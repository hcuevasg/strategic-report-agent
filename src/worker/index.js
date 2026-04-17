// ============================================================
// Cloudflare Worker — ALTO Strategic Report Agent
// Entry point: routing only. Business logic lives in src/worker/
// ============================================================

import {
  SYSTEM_PROMPT,
  MINUTA_SYSTEM_PROMPT,
  MULTISOURCE_SYSTEM_PROMPT,
  PPTX_SYSTEM_PROMPT,
  REPORT_TEMPLATES,
} from './prompts.js';
import {
  validateTwilioSignature,
  corsHeaders,
  jsonResponse,
  sanitizeInput,
  securityHeaders,
  generateSessionToken,
  validateSessionToken,
} from './security.js';
import { trackEvent, logAbuse } from './analytics.js';
import { handleWhatsApp, twimlResponse } from './whatsapp.js';
import { validateRequestBody } from './validation.js';

// ── Constants ────────────────────────────────────────────────
const MAX_BODY_SIZE = 10_485_760; // 10 MB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LANG_NAMES = { es: 'español', en: 'English', pt: 'português', fr: 'français', de: 'Deutsch' };

// ============================================================
// Main export
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('Origin') || '';

    // ── OPTIONS (CORS preflight) ──────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: { ...securityHeaders(), ...corsHeaders(env, requestOrigin) },
      });
    }

    // ── GET /stats — monitoring dashboard ────────────────
    if (request.method === 'GET' && url.pathname === '/stats') {
      const authHeader = request.headers.get('Authorization') || '';
      const adminToken = env.STATS_TOKEN || env.ANTHROPIC_API_KEY?.slice(0, 20);
      if (!authHeader.includes(adminToken)) {
        return new Response('Unauthorized', { status: 401 });
      }

      const days = parseInt(url.searchParams.get('days') || '7', 10);
      const stats = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = `stats:${d.toISOString().slice(0, 10)}`;
        const data = await env.WA_KV.get(key, { type: 'json' });
        if (data) stats.push(data);
      }

      const totals = { requests: {}, whatsapp: {}, exports: {}, errors: 0 };
      for (const day of stats) {
        totals.errors += day.errors || 0;
        for (const [k, v] of Object.entries(day.requests || {})) {
          totals.requests[k] = (totals.requests[k] || 0) + v;
        }
        for (const [k, v] of Object.entries(day.whatsapp || {})) {
          totals.whatsapp[k] = (totals.whatsapp[k] || 0) + v;
        }
        for (const [k, v] of Object.entries(day.exports || {})) {
          totals.exports[k] = (totals.exports[k] || 0) + v;
        }
      }

      const abuseLogs = [];
      for (let i = 0; i < days; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const abuseKey = `abuse:${d.toISOString().slice(0, 10)}`;
        const abuseData = await env.WA_KV.get(abuseKey, { type: 'json' });
        if (abuseData) abuseLogs.push({ date: d.toISOString().slice(0, 10), ...abuseData });
      }

      return new Response(JSON.stringify({ days: stats, totals, abuse: abuseLogs }, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders(),
          ...corsHeaders(env, requestOrigin),
        },
      });
    }

    // ── GET /token — issue session token ─────────────────
    if (request.method === 'GET' && url.pathname === '/token') {
      const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
      const originOk =
        allowed[0] === '*' || allowed.some(a => requestOrigin === a || requestOrigin.startsWith(a));
      if (!originOk) {
        return jsonResponse(403, { error: 'Origin not allowed' }, env, requestOrigin);
      }
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      const token = await generateSessionToken(ip, env);
      return jsonResponse(200, { token }, env, requestOrigin);
    }

    // ── GET /report/:uuid — serve cached report ───────────
    if (request.method === 'GET' && url.pathname.startsWith('/report/')) {
      const uuid = url.pathname.split('/')[2];
      if (!uuid || !UUID_RE.test(uuid)) {
        return new Response('Not found', { status: 404, headers: securityHeaders() });
      }

      const reportIp = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (env.RATE_LIMIT_KV) {
        const rlKey = `rl:report:${reportIp}`;
        const cur = parseInt((await env.RATE_LIMIT_KV.get(rlKey)) || '0', 10);
        if (cur >= 60) {
          ctx.waitUntil(logAbuse(env, 'report_brute_force', reportIp));
          return jsonResponse(429, { error: 'Too many requests' }, env, requestOrigin);
        }
        await env.RATE_LIMIT_KV.put(rlKey, String(cur + 1), { expirationTtl: 3600 });
      }

      const data = await env.WA_KV.get(`report:${uuid}`);
      if (!data) {
        return new Response(JSON.stringify({ error: 'Report not found or expired' }), {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
            ...securityHeaders(),
            ...corsHeaders(env, requestOrigin),
          },
        });
      }
      ctx.waitUntil(trackEvent(env, 'report_fetch'));
      return new Response(data, {
        headers: {
          'Content-Type': 'application/json',
          ...securityHeaders(),
          ...corsHeaders(env, requestOrigin),
        },
      });
    }

    // ── POST /whatsapp — Twilio webhook ───────────────────
    if (request.method === 'POST' && url.pathname === '/whatsapp') {
      const isValid = await validateTwilioSignature(request, env);
      if (!isValid) {
        console.error('Invalid Twilio signature — rejecting webhook');
        return new Response('Forbidden', { status: 403 });
      }

      const waFrom = (await request.clone().formData()).get('From') || '';
      if (waFrom && env.RATE_LIMIT_KV) {
        const waKey = `rl:wa:${waFrom}`;
        const waCurrent = parseInt((await env.RATE_LIMIT_KV.get(waKey)) || '0', 10);
        const waLimit = parseInt(env.WA_RATE_LIMIT_PER_HOUR || '20', 10);
        if (waCurrent >= waLimit) {
          return twimlResponse(
            'Has excedido el limite de mensajes por hora. Por favor intenta en unos minutos.'
          );
        }
        await env.RATE_LIMIT_KV.put(waKey, String(waCurrent + 1), { expirationTtl: 3600 });
      }

      ctx.waitUntil(trackEvent(env, 'whatsapp'));
      return handleWhatsApp(request, env, ctx);
    }

    // ── All other requests: require POST ──────────────────
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' }, env, requestOrigin);
    }

    // ── Origin check ──────────────────────────────────────
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
    const isAllowed =
      allowed[0] === '*' || allowed.some(a => requestOrigin === a || requestOrigin.startsWith(a));
    if (!isAllowed) {
      ctx.waitUntil(logAbuse(env, 'origin_rejected', requestOrigin));
      return jsonResponse(403, { error: 'Origin not allowed' }, env, requestOrigin);
    }

    // ── Session token authentication ───────────────────────
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const sessionToken = request.headers.get('X-Session-Token') || '';
    if (!sessionToken) {
      ctx.waitUntil(logAbuse(env, 'no_token', ip));
      return jsonResponse(
        401,
        { error: 'Session token required. Refresh the page.' },
        env,
        requestOrigin
      );
    }
    const tokenValid = await validateSessionToken(sessionToken, ip, env);
    if (!tokenValid) {
      ctx.waitUntil(logAbuse(env, 'invalid_token', ip));
      return jsonResponse(
        401,
        { error: 'Invalid or expired session token. Refresh the page.' },
        env,
        requestOrigin
      );
    }

    // ── Rate limiting (by IP + by session token) ──────────
    const limitPerHour = parseInt(env.RATE_LIMIT_PER_HOUR || '30', 10);
    if (env.RATE_LIMIT_KV) {
      const ipKey = `rl:ip:${ip}`;
      const ipCurrent = parseInt((await env.RATE_LIMIT_KV.get(ipKey)) || '0', 10);
      if (ipCurrent >= limitPerHour) {
        ctx.waitUntil(logAbuse(env, 'rate_limited_ip', ip));
        return jsonResponse(
          429,
          { error: 'Rate limit exceeded. Try again later.', limit: limitPerHour, reset: '1 hour' },
          env,
          requestOrigin
        );
      }
      const tokenHash = sessionToken.slice(0, 16);
      const tokenKey = `rl:tok:${tokenHash}`;
      const tokCurrent = parseInt((await env.RATE_LIMIT_KV.get(tokenKey)) || '0', 10);
      if (tokCurrent >= limitPerHour) {
        ctx.waitUntil(logAbuse(env, 'rate_limited_token', ip));
        return jsonResponse(
          429,
          { error: 'Rate limit exceeded. Try again later.', limit: limitPerHour, reset: '1 hour' },
          env,
          requestOrigin
        );
      }
      await env.RATE_LIMIT_KV.put(ipKey, String(ipCurrent + 1), { expirationTtl: 3600 });
      await env.RATE_LIMIT_KV.put(tokenKey, String(tokCurrent + 1), { expirationTtl: 3600 });
    }

    // ── Body size limit ───────────────────────────────────
    const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      return jsonResponse(413, { error: 'Request body too large. Max 10MB.' }, env, requestOrigin);
    }

    try {
      const rawBody = await request.text();
      if (rawBody.length > MAX_BODY_SIZE) {
        return jsonResponse(
          413,
          { error: 'Request body too large. Max 10MB.' },
          env,
          requestOrigin
        );
      }
      const body = JSON.parse(rawBody);
      const bodyError = validateRequestBody(body);
      if (bodyError) {
        return jsonResponse(400, { error: bodyError }, env, requestOrigin);
      }
      const model = env.CLAUDE_MODEL || 'claude-sonnet-4-6';

      // ── Chat mode ─────────────────────────────────────
      if (body.userContent === '__CHAT_MODE__' && body.chatMessages) {
        ctx.waitUntil(trackEvent(env, 'chat'));
        const sanitizedChat = (body.chatMessages || []).map(m => ({
          ...m,
          content: typeof m.content === 'string' ? sanitizeInput(m.content) : m.content,
        }));
        const resp = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 8000,
            system:
              'Eres un consultor estratégico senior. El usuario te consulta sobre un informe ejecutivo que ya fue generado. Responde de forma concisa y profesional en el mismo idioma del informe. Si el usuario pide modificaciones al informe, responde con el texto explicativo seguido de __JSON_UPDATE__ en una línea separada y luego el JSON completo actualizado del informe (mismo esquema que el original). Si solo pide información o aclaración, responde en texto normal sin JSON.',
            messages: sanitizedChat,
          }),
        });
        const data = await resp.json();
        return jsonResponse(resp.status, data, env, requestOrigin);

        // ── PPTX mode — streaming SSE with extended thinking ─
      } else if (body.userContent === '__PPTX_MODE__' && body.reportJSON) {
        ctx.waitUntil(trackEvent(env, 'pptx'));
        const pptxResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'interleaved-thinking-2025-05-14',
          },
          body: JSON.stringify({
            model,
            max_tokens: 16000,
            thinking: { type: 'enabled', budget_tokens: 5000 },
            stream: true,
            system: PPTX_SYSTEM_PROMPT,
            messages: [
              {
                role: 'user',
                content:
                  'Transforma este informe ejecutivo en estructura de slides. Usa SOLO la paleta ALTO. Sin emojis ni símbolos decorativos. Responde SOLO con JSON válido.\n\n' +
                  (body.pptxInstructions ? body.pptxInstructions + '\n\n' : '') +
                  'INFORME:\n' +
                  body.reportJSON,
              },
            ],
          }),
        });

        if (!pptxResponse.ok) {
          const err = await pptxResponse.json();
          return jsonResponse(
            pptxResponse.status,
            { error: err.error?.message || 'API error' },
            env,
            requestOrigin
          );
        }

        return streamSSE(pptxResponse, env, requestOrigin);

        // ── Analysis mode — streaming SSE with extended thinking ─
      } else {
        ctx.waitUntil(trackEvent(env, 'analysis'));

        const langPref =
          body.outputLanguage && body.outputLanguage !== 'auto' && LANG_NAMES[body.outputLanguage]
            ? `\nIMPORTANTE: Redacta TODO el informe en ${LANG_NAMES[body.outputLanguage]}, independientemente del idioma del contenido fuente.\n`
            : '';

        const isMinuta = body.reportType === 'minuta';
        const isMultisource = body.reportType === 'multisource_contrast';
        const activeSystemPrompt = isMinuta
          ? MINUTA_SYSTEM_PROMPT
          : isMultisource
            ? MULTISOURCE_SYSTEM_PROMPT
            : SYSTEM_PROMPT;
        const templateInstr =
          isMinuta || isMultisource ? '' : REPORT_TEMPLATES[body.reportType] || '';
        const typePref = templateInstr ? `\n${templateInstr}\n` : '';

        const userBlocks = [];
        const sanitizedContent = sanitizeInput(body.userContent || '');
        const promptPrefix = isMinuta
          ? langPref +
            'Genera la minuta de reunión a partir del siguiente contenido. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n'
          : isMultisource
            ? langPref +
              'Elabora el Informe Ejecutivo de Contraste Multifuente a partir del siguiente input estructurado. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n'
            : langPref +
              typePref +
              'Transforma el siguiente documento fuente en el informe ejecutivo solicitado. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n';

        if (body.images && Array.isArray(body.images) && body.images.length > 0) {
          body.images.forEach(img => {
            userBlocks.push({
              type: 'image',
              source: { type: 'base64', media_type: img.media_type, data: img.data },
            });
          });
          userBlocks.push({
            type: 'text',
            text:
              promptPrefix +
              '(incluye imágenes del documento — analiza las imágenes para extraer datos, gráficos y tablas relevantes)\n\n' +
              sanitizedContent,
          });
        } else {
          userBlocks.push({ type: 'text', text: promptPrefix + sanitizedContent });
        }

        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'anthropic-beta': 'interleaved-thinking-2025-05-14',
          },
          body: JSON.stringify({
            model,
            max_tokens: isMultisource ? 20000 : 16000,
            thinking: { type: 'enabled', budget_tokens: isMultisource ? 6000 : 4000 },
            stream: true,
            system: activeSystemPrompt,
            messages: [{ role: 'user', content: userBlocks }],
          }),
        });

        if (!anthropicResponse.ok) {
          const err = await anthropicResponse.json();
          return jsonResponse(
            anthropicResponse.status,
            { error: err.error?.message || 'API error' },
            env,
            requestOrigin
          );
        }

        return streamSSE(anthropicResponse, env, requestOrigin);
      }
    } catch (err) {
      console.error('Worker error:', err.message, err.stack);
      ctx.waitUntil(trackEvent(env, 'error'));
      return jsonResponse(500, { error: 'Internal server error' }, env, requestOrigin);
    }
  },
};

// ── SSE streaming helper ──────────────────────────────────────
// Forwards Anthropic SSE stream to the client, translating phase signals.
function streamSSE(upstreamResponse, env, requestOrigin) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    const reader = upstreamResponse.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') continue;
          try {
            const evt = JSON.parse(raw);
            if (evt.type === 'content_block_start' && evt.content_block?.type === 'thinking') {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ phase: 'thinking' })}\n\n`)
              );
            }
            if (evt.type === 'content_block_start' && evt.content_block?.type === 'text') {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ phase: 'writing' })}\n\n`)
              );
            }
            if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
              await writer.write(
                encoder.encode(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`)
              );
            }
          } catch {}
        }
      }
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'));
      await writer.close();
    }
  })();

  return new Response(readable, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
      ...securityHeaders(),
      ...corsHeaders(env, requestOrigin),
    },
  });
}
