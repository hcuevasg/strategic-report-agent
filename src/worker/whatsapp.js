// ============================================================
// WhatsApp — Twilio webhook handler and message processing
// ============================================================

import { WA_SYSTEM_PROMPT } from './prompts.js';
import { extractTextFromDocument } from './document-parser.js';
import { trackEvent } from './analytics.js';
import { validateWhatsAppReport } from './validation.js';

// ── Format report as WhatsApp message ────────────────────────
export function formatBriefForWhatsApp(report) {
  const lines = [];
  lines.push(`*${(report.title || '').toUpperCase()}*`);
  if (report.subtitle) lines.push(`_${report.subtitle}_`);
  lines.push('');

  lines.push('*Resumen Ejecutivo*');
  lines.push(report.executive_summary || '');

  if (report.key_messages?.length) {
    lines.push('');
    lines.push('*Mensajes Clave*');
    report.key_messages.slice(0, 3).forEach(m => lines.push(`▸ ${m}`));
  }

  if (report.findings?.length) {
    lines.push('');
    lines.push('*Hallazgos Principales*');
    report.findings.slice(0, 2).forEach((f, i) => {
      lines.push(`${i + 1}. *${f.finding}*`);
      if (f.business_implication) lines.push(`   → ${f.business_implication}`);
    });
  }

  if (report.recommendations?.short_term?.length) {
    lines.push('');
    lines.push('*Proximos Pasos*');
    report.recommendations.short_term.slice(0, 2).forEach((r, i) => {
      lines.push(`${i + 1}. ${r.action}`);
    });
  }

  if (report.conclusion) {
    lines.push('');
    lines.push('*Conclusion*');
    lines.push(report.conclusion);
  }

  lines.push('');
  lines.push('_ALTO · Informe Ejecutivo Confidencial_');
  return lines.join('\n');
}

// ── TwiML response ────────────────────────────────────────────
export function twimlResponse(message) {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  return new Response(xml, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
}

// ── Send a WhatsApp message via Twilio REST API ───────────────
export async function sendWhatsAppMessage(to, body, env) {
  const num = (env.TWILIO_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: `whatsapp:+${num}`,
      To: to,
      Body: body,
    }).toString(),
  });
  if (!resp.ok) {
    console.error('Twilio send error:', await resp.text());
  }
}

// ── Transcribe audio via OpenAI Whisper ───────────────────────
export async function transcribeAudio(mediaUrl, mediaType, env) {
  try {
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const audioResp = await fetch(mediaUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });
    if (!audioResp.ok) throw new Error('Cannot download audio from Twilio');
    const audioBuffer = await audioResp.arrayBuffer();

    const ext = mediaType.includes('ogg')
      ? 'ogg'
      : mediaType.includes('mp4')
        ? 'mp4'
        : mediaType.includes('mpeg')
          ? 'mp3'
          : 'ogg';

    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: mediaType }), `audio.${ext}`);
    form.append('model', 'whisper-1');
    form.append('language', 'es');

    const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: form,
    });
    const result = await whisperResp.json();
    return result.text || '';
  } catch (e) {
    console.error('Transcription error:', e);
    return '';
  }
}

// ── Generate a short report via Claude (Haiku) ────────────────
export async function generateReportFromContent(content, env) {
  const model = env.WA_MODEL || 'claude-haiku-4-5-20251001';
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2000,
      system: WA_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Transforma el siguiente contenido en el informe ejecutivo. Responde SOLO con JSON válido, sin backticks:\n\n${content}`,
        },
      ],
    }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const txt = (data.content || [])
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');
  try {
    const parsed = JSON.parse(txt.replace(/```json|```/g, '').trim());
    return validateWhatsAppReport(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// ── Send brief in chunks via Twilio REST API ──────────────────
export async function sendBriefViaREST(from, reportData, stateKey, env) {
  try {
    await env.WA_KV.delete(stateKey);

    if (!reportData) {
      await sendWhatsAppMessage(
        from,
        'No encontre el informe. Por favor envia el contenido de nuevo.',
        env
      );
      return;
    }

    const brief = formatBriefForWhatsApp(reportData);
    const MAX_CHUNK = 1500;
    const chunks = [];
    const paragraphs = brief.split('\n\n');
    let current = '';

    for (const para of paragraphs) {
      if (para.length > MAX_CHUNK) {
        if (current.trim()) {
          chunks.push(current.trim());
          current = '';
        }
        for (let i = 0; i < para.length; i += MAX_CHUNK) {
          chunks.push(para.slice(i, i + MAX_CHUNK));
        }
        continue;
      }
      const candidate = current ? current + '\n\n' + para : para;
      if (candidate.length > MAX_CHUNK) {
        chunks.push(current.trim());
        current = para;
      } else {
        current = candidate;
      }
    }
    if (current.trim()) chunks.push(current.trim());

    for (let i = 0; i < chunks.length; i++) {
      const suffix = chunks.length > 1 ? `\n\n_(${i + 1}/${chunks.length})_` : '';
      await sendWhatsAppMessage(from, chunks[i] + suffix, env);
    }
  } catch (e) {
    console.error('sendBriefViaREST error:', e);
    await sendWhatsAppMessage(
      from,
      'Ocurrio un error al enviar el brief. Por favor intenta de nuevo.',
      env
    );
  }
}

// ── Process content and reply via WhatsApp ────────────────────
export async function processContentAndReply(from, content, stateKey, workerUrl, env) {
  const report = await generateReportFromContent(content, env);
  if (!report) {
    await sendWhatsAppMessage(
      from,
      'Lo siento, no pude generar el informe. Por favor intenta de nuevo con mas detalle en el texto.',
      env
    );
    return;
  }

  const uuid = crypto.randomUUID();
  await env.WA_KV.put(`report:${uuid}`, JSON.stringify(report), { expirationTtl: 86400 });
  await env.WA_KV.put(
    stateKey,
    JSON.stringify({ state: 'AWAITING_FORMAT', uuid, reportTitle: report.title }),
    { expirationTtl: 3600 }
  );

  const preview = (report.executive_summary || '').slice(0, 220);
  const msg =
    `Informe listo\n\n*${report.title}*\n\n${preview}...\n\n` +
    `¿En qué formato lo quieres?\n\n1 - Brief (aqui en el chat)\n2 - PDF\n3 - Word\n4 - PPT (link de descarga)`;
  await sendWhatsAppMessage(from, msg, env);
}

// ── Process audio and reply via WhatsApp ─────────────────────
export async function processAudioAndReply(from, mediaUrl, mediaType, stateKey, workerUrl, env) {
  const transcript = await transcribeAudio(mediaUrl, mediaType, env);
  if (!transcript) {
    await sendWhatsAppMessage(
      from,
      'No pude transcribir el audio. Por favor envía el texto directamente en el chat.',
      env
    );
    return;
  }
  await sendWhatsAppMessage(
    from,
    `Audio transcrito. Generando informe...\n\n"${transcript.slice(0, 120)}..."`,
    env
  );
  await processContentAndReply(from, transcript, stateKey, workerUrl, env);
}

// ── Main WhatsApp webhook handler ─────────────────────────────
export async function handleWhatsApp(request, env, ctx) {
  const formData = await request.formData();
  const from = formData.get('From') || '';
  const body = (formData.get('Body') || '').trim();
  const numMedia = parseInt(formData.get('NumMedia') || '0');
  const mediaUrl = formData.get('MediaUrl0') || '';
  const mediaType = formData.get('MediaContentType0') || '';

  if (!from) return new Response('Bad Request', { status: 400 });

  const stateKey = `wa_state:${from}`;
  const stateData = (await env.WA_KV.get(stateKey, { type: 'json' })) || { state: 'IDLE' };
  const workerUrl = new URL(request.url).origin;
  const appUrl = (env.APP_URL || '').replace(/\/$/, '');

  // ── Format choice ────────────────────────────────────────
  if (stateData.state === 'AWAITING_FORMAT') {
    const choice = body.toLowerCase();

    if (choice === '1' || choice.includes('brief') || choice.includes('texto')) {
      const reportData = await env.WA_KV.get(`report:${stateData.uuid}`, { type: 'json' });
      ctx.waitUntil(sendBriefViaREST(from, reportData, stateKey, env));
      return twimlResponse('Preparando tu brief...');
    }

    if (choice === '2' || choice.includes('pdf')) {
      const link = `${appUrl}?wa=${stateData.uuid}&worker=${encodeURIComponent(workerUrl)}&format=pdf`;
      await env.WA_KV.delete(stateKey);
      return twimlResponse(`Aqui esta tu PDF:\n\n${link}\n\n_Disponible por 24 horas._`);
    }

    if (choice === '3' || choice.includes('word') || choice.includes('docx')) {
      const link = `${appUrl}?wa=${stateData.uuid}&worker=${encodeURIComponent(workerUrl)}&format=docx`;
      await env.WA_KV.delete(stateKey);
      return twimlResponse(`Aqui esta tu Word:\n\n${link}\n\n_Disponible por 24 horas._`);
    }

    if (
      choice === '4' ||
      choice.includes('ppt') ||
      choice.includes('presentacion') ||
      choice.includes('presentación')
    ) {
      const link = `${appUrl}?wa=${stateData.uuid}&worker=${encodeURIComponent(workerUrl)}&format=pptx`;
      await env.WA_KV.delete(stateKey);
      return twimlResponse(`Aqui esta tu PPT:\n\n${link}\n\n_Disponible por 24 horas._`);
    }

    return twimlResponse(
      'Por favor elige:\n\n1 - Brief (aqui en el chat)\n2 - PDF\n3 - Word\n4 - PPT (link de descarga)'
    );
  }

  // ── New content (IDLE state) ─────────────────────────────
  if (numMedia > 0 && mediaUrl) {
    if (mediaType.includes('audio')) {
      ctx.waitUntil(
        (async () => {
          await trackEvent(env, 'wa_audio');
          await processAudioAndReply(from, mediaUrl, mediaType, stateKey, workerUrl, env);
        })()
      );
      return twimlResponse(
        'Recibi tu audio. Transcribiendo y generando informe ALTO...\n\nTe respondo en aprox 30-60 segundos.'
      );
    }

    const isDocument =
      mediaType.includes('pdf') ||
      mediaType.includes('wordprocessingml') ||
      mediaType.includes('msword') ||
      mediaType.includes('docx') ||
      mediaType.includes('text/plain') ||
      mediaType.includes('text/csv') ||
      mediaType.includes('text/markdown');

    if (isDocument) {
      ctx.waitUntil(
        (async () => {
          await trackEvent(env, 'wa_document');
          const text = await extractTextFromDocument(mediaUrl, mediaType, env);
          if (!text || text.startsWith('[')) {
            await sendWhatsAppMessage(
              from,
              text ||
                'No pude extraer texto del documento. Intenta con un archivo de texto o pega el contenido directamente.',
              env
            );
            return;
          }
          await sendWhatsAppMessage(
            from,
            `Documento recibido (${Math.round(text.length / 1000)}K caracteres). Generando informe...`,
            env
          );
          await processContentAndReply(from, text.slice(0, 50000), stateKey, workerUrl, env);
        })()
      );
      return twimlResponse(
        'Recibi tu documento. Extrayendo texto y generando informe ALTO...\n\nTe respondo en aprox 30-60 segundos.'
      );
    }

    return twimlResponse(
      'Acepto texto, notas de voz, y documentos (PDF, Word, TXT).\n\nPor favor envia uno de esos formatos.'
    );
  }

  // ── Greeting ─────────────────────────────────────────────
  const greetings = ['hola', 'hi', 'hello', 'buenas', 'help', 'ayuda', 'start', 'inicio'];
  if (!body || greetings.includes(body.toLowerCase())) {
    return twimlResponse(
      'Hola! Soy el agente ALTO.\n\n' +
        'Enviame texto o una nota de voz con informacion sobre cualquier tema y lo convierto en un informe ejecutivo profesional.\n\n' +
        'Acepto:\n- Texto directo\n- Notas de voz\n- Documentos (PDF, Word, TXT)\n\n' +
        'Formatos de entrega:\n- Brief en el chat\n- PDF\n- Word\n- PPT (link de descarga)\n\n' +
        'Que quieres analizar?'
    );
  }

  ctx.waitUntil(
    (async () => {
      await trackEvent(env, 'wa_text');
      await processContentAndReply(from, body, stateKey, workerUrl, env);
    })()
  );
  return twimlResponse(
    'Generando tu informe ALTO...\n\nTe respondo en aproximadamente 30-60 segundos.'
  );
}
