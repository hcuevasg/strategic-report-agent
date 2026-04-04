// ============================================================
// Cloudflare Worker — ALTO Strategic Report Agent v9.0
// ============================================================
// v9.0: Extended thinking, vision, PPTX streaming, multi-lang
//       + image support in analysis mode
//       + streaming SSE for PPTX generation
//       + phase signals (thinking/writing) for frontend UX
// v8.3: Security hardening —
//       Twilio signature validation, CORS fix, rate limit on
//       /whatsapp, body size limit, error logging, UUID validation
// v8.2: PPT delivered via magic link (same as PDF/Word) —
//       removes Resend email dependency entirely
// v8.1: Fix brief delivery — send via Twilio REST API instead
//       of TwiML to avoid silent message drops on long content
//       + use WA_MODEL (Haiku) for WhatsApp report generation
// v8: WhatsApp integration via Twilio
//     + report cache (KV) for magic links
//     + audio transcription via Whisper
// ============================================================
// Env vars required:
//   ANTHROPIC_API_KEY      — Anthropic API key
//   CLAUDE_MODEL           — e.g. "claude-sonnet-4-20250514"
//   WA_MODEL               — e.g. "claude-haiku-4-5-20251001" (WhatsApp, faster/cheaper)
//   ALLOWED_ORIGIN         — comma-separated allowed origins or "*"
//   RATE_LIMIT_PER_HOUR    — default 30
//   APP_URL                — e.g. "https://hcuevasg.github.io/strategic-report-agent"
//   TWILIO_ACCOUNT_SID     — Twilio Account SID
//   TWILIO_AUTH_TOKEN       — Twilio Auth Token
//   TWILIO_WHATSAPP_NUMBER — e.g. "+14155238886" (sandbox) or your business number
//   OPENAI_API_KEY         — for Whisper audio transcription
//
// KV bindings required:
//   RATE_LIMIT_KV          — existing rate limit KV
//   WA_KV                  — new KV for WhatsApp state + report cache
// ============================================================

// ── Max request body size: 10MB (supports image attachments) ──
const MAX_BODY_SIZE = 10_485_760;

// ── UUID v4 format validation ────────────────────────────────
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const SYSTEM_PROMPT = `Eres un consultor senior de estrategia corporativa y redactor ejecutivo de informes de alta dirección. Tu tarea es transformar el documento fuente en un informe de estándar consultoría premium.

OBJETIVO: Convertir el texto en un informe estratégico, estructurado, analítico, accionable y persuasivo.

INSTRUCCIONES:
1. No repitas el texto original mecánicamente.
2. Depura ruido, redundancias, informalidades.
3. Identifica la tesis central.
4. Ordena: problema, implicancia, recomendación.
5. Distingue: hechos observados, inferencias razonables, hipótesis por validar.
6. Tono institucional, estratégico y sobrio. Sin marketing vacío.
7. Toda afirmación debe tener fundamento en el material fuente.
8. Si detectas vacíos, identifícalos explícitamente.
9. Responde en el MISMO IDIOMA del contenido original.

ESTÁNDAR MECE: sin solapamientos, cobertura suficiente. Diferencia síntomas, causas, impactos y recomendaciones. Traduce observaciones operativas en implicancias estratégicas.

Prioriza claridad, estructura y capacidad de decisión. Cuando corresponda incluye mirada de eficiencia operacional, experiencia cliente, riesgo, escalabilidad, gobernanza, calidad de datos, impacto financiero y factibilidad.

ESTÁNDAR DE FORMA:
- Título ejecutivo tipo assertion, no genérico.
- Resumen ejecutivo conclusivo, no descriptivo.
- Párrafos breves y densos.
- Encabezados con mensaje, no solo tema.
- Redacción precisa sin muletillas ni frases vagas.
- Evitar listas largas salvo que agreguen claridad.
- Sin emojis, sin adornos retóricos, sin fórmulas genéricas.

Responde SOLO con JSON válido (sin markdown, sin backticks):
{
  "language": "código ISO 639-1 del idioma del contenido (es, en, pt, fr, de, etc.)",
  "title": "Título ejecutivo (assertion, no descriptivo)",
  "subtitle": "Objeto del informe",
  "executive_summary": "Resumen conclusivo, no descriptivo. 2-4 oraciones con la conclusión principal primero.",
  "key_messages": ["Mensaje clave 1", "Mensaje clave 2", "Mensaje clave 3"],
  "context": "Qué problema aborda y por qué importa",
  "findings": [
    {
      "finding": "Hallazgo concreto",
      "evidence": "Base textual o evidencia del material fuente",
      "business_implication": "Implicancia de negocio"
    }
  ],
  "analysis_blocks": [
    {
      "heading": "Título con mensaje, no solo tema",
      "governing_thought": "Mensaje clave de este bloque",
      "content": "Análisis desarrollado",
      "bullets": ["Punto 1", "Punto 2"],
      "so_what": "Implicación concreta"
    }
  ],
  "risks": [
    { "risk": "Descripción del riesgo", "implication": "Qué puede salir mal" }
  ],
  "opportunities": ["Oportunidad o palanca estratégica 1", "Oportunidad 2"],
  "recommendations": {
    "short_term": [{ "action": "Acción", "rationale": "Racional", "impact": "Impacto esperado" }],
    "medium_term": [{ "action": "Acción", "rationale": "Racional", "impact": "Impacto esperado" }],
    "long_term": [{ "action": "Acción", "rationale": "Racional", "impact": "Impacto esperado" }]
  },
  "information_gaps": ["Información faltante 1", "Información faltante 2"],
  "conclusion": "Conclusión ejecutiva final"
}`;

const PPTX_SYSTEM_PROMPT = `Eres un consultor senior de estrategia y diseñador de presentaciones ejecutivas McKinsey/BCG. Tu trabajo es transformar un informe ejecutivo en una estructura de slides de altísimo nivel visual y narrativo.

PALETA CORPORATIVA ALTO — OBLIGATORIA:
Solo puedes usar estos colores. NINGÚN otro color está permitido:
- Navy: #041627 (fondos oscuros, títulos, acentos primarios)
- Rojo ALTO: #BB0014 (acentos, líneas, "so what" boxes, riesgos)
- Azul terciario: #4279B0 (segundo acento, oportunidades, tendencias positivas)
- Gris claro: #F2F4F6 (fondos de cards/boxes)
- Gris medio: #E0E3E5 (bordes, líneas sutiles)
- Body text: #44474C
- Outline: #74777D
- Blanco: #FFFFFF
PROHIBIDO: verde, naranja, amarillo, ni ningún color fuera de esta lista.
PROHIBIDO: emojis, flechas decorativas, símbolos unicode como arriba/abajo en body_text o bullets.

PRINCIPIOS McKINSEY:
1. ACTION TITLES: cada slide tiene un título conclusivo (assertion), NO descriptivo.
2. UNA IDEA POR SLIDE.
3. "SO WHAT" obligatorio en cada slide de contenido.
4. VERTICAL FLOW: conclusión arriba, evidencia abajo.
5. HORIZONTAL FLOW: leyendo solo los action_title se entiende toda la historia.

VISUAL LAYOUTS DISPONIBLES:
- "stat_callouts": KPIs. data_points:[{value,label,trend?}]. trend:"up"/"down"/"neutral". Min 3, max 4.
- "bar_chart": comparativo vertical o evolución 1 serie. chart_data:{categories,series:[{name,values}]}. SIEMPRE 1 serie con todos los valores, NUNCA una serie por categoría.
- "line_chart": tendencias múltiples series. chart_data:{categories,series}.
- "horizontal_bar": rankings. 1 sola serie. chart_data:{categories,series:[{name,values}]}. Ordena mayor a menor. NUNCA una serie por entidad.
- "donut_chart": distribución porcentual. data_points:[{value:"35%",label}]. Max 6.
- "comparison": 2-3 opciones lado a lado. columns:[{title,items}].
- "pillars": 3-4 pilares paralelos. columns:[{title,items}].
- "process": flujo 3-5 pasos. columns:[{title,items}].
- "timeline": roadmap fases. columns:[{title,items}].
- "matrix": 4 cuadrantes 2x2. columns:[{title,items}] orden: TL,TR,BL,BR.
- "split": tesis izq + insight der. body_text + bullets + highlight_box.
- "none": estándar con body_text + bullets.

TIPOS ESPECIALES:
- type:"divider": separador de sección. Solo action_title, subheading (ej:"Sección 1"), body_text opcional.
- type:"toc": slide 2 obligatorio. items:[{title,description}] + tagline.
- type:"cover": portada, slide 1.
- type:"closing": cierre, slide final.
- type:"risks": riesgos, acento rojo.
- type:"opportunities": oportunidades, acento azul.

REGLAS:
- Slide 2 SIEMPRE type:"toc".
- USA type:"divider" para separar secciones principales.
- INCLUYE AL MENOS: 1x stat_callouts, 1x bar_chart o line_chart, 1x process o timeline, 1x comparison o pillars.
- NO repitas el mismo visual_suggestion más de 2 slides seguidos.
- Sin emojis ni símbolos decorativos en ningún campo.
- Mínimo 10 slides, máximo 16 (sin contar cover y closing).

Responde SOLO con JSON válido (sin backticks, sin markdown):
{
  "slides": [
    {
      "type": "cover|toc|divider|executive_summary|content|data_callout|risks|opportunities|recommendations|conclusion|closing",
      "action_title": "Título assertion conclusivo",
      "subheading": "Contexto breve o número de sección (opcional)",
      "body_text": "Texto principal (opcional)",
      "bullets": ["Punto 1", "Punto 2"],
      "data_points": [{"value": "60%", "label": "Descripción", "trend": "up|down|neutral"}],
      "columns": [{"title": "Columna/Paso/Fase", "items": ["item a", "item b"]}],
      "highlight_box": "Texto destacado para split (opcional)",
      "so_what": "Implicancia de negocio (OBLIGATORIO en slides de contenido)",
      "visual_suggestion": "stat_callouts|bar_chart|line_chart|horizontal_bar|donut_chart|comparison|pillars|process|timeline|matrix|split|none",
      "source_note": "Fuente (opcional)",
      "items": [{"title": "Título del slide", "description": "Una línea"}],
      "chart_data": {"categories": ["Q1","Q2","Q3"], "series": [{"name": "Serie", "values": [10,20,30]}]},
      "tagline": "Tesis central (solo para toc)"
    }
  ]
}`;

const WA_SYSTEM_PROMPT = `Eres un consultor estratégico senior. Transforma el contenido en un informe ejecutivo breve. Responde SOLO con JSON válido (sin backticks):
{
  "title": "Título ejecutivo assertion",
  "subtitle": "Objeto del informe",
  "executive_summary": "2-3 oraciones conclusivas",
  "key_messages": ["Mensaje 1", "Mensaje 2", "Mensaje 3"],
  "findings": [
    {"finding": "Hallazgo", "business_implication": "Implicancia"}
  ],
  "recommendations": {
    "short_term": [{"action": "Acción inmediata", "rationale": "Por qué"}]
  },
  "conclusion": "Conclusión ejecutiva en 1-2 oraciones"
}`;

// ============================================================
// SECURITY: Twilio Signature Validation
// ============================================================

async function validateTwilioSignature(request, env) {
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature) return false;

  const authToken = env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  // Build the full URL Twilio used to generate the signature
  const url = new URL(request.url);
  const fullUrl = url.origin + url.pathname;

  // Parse form data and sort params alphabetically
  const formData = await request.clone().formData();
  const params = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value;
  }
  const sortedKeys = Object.keys(params).sort();
  let dataStr = fullUrl;
  for (const key of sortedKeys) {
    dataStr += key + params[key];
  }

  // HMAC-SHA1 with auth token
  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const msgData = encoder.encode(dataStr);

  const cryptoKey = await crypto.subtle.importKey(
    'raw', keyData, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));

  // Constant-time comparison
  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ============================================================
// CORS — returns only the matched origin, not the full list
// ============================================================

function corsHeaders(env, requestOrigin) {
  const allowedRaw = env.ALLOWED_ORIGIN || '*';
  let origin = '*';

  if (allowedRaw !== '*' && requestOrigin) {
    const allowed = allowedRaw.split(',').map(s => s.trim());
    const matched = allowed.find(a => requestOrigin.startsWith(a));
    origin = matched || 'null';
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    ...(origin !== '*' ? { 'Vary': 'Origin' } : {}),
  };
}

function jsonResponse(status, body, env, requestOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env, requestOrigin) },
  });
}

// ============================================================
// MONITORING — lightweight analytics via KV
// ============================================================

async function trackEvent(env, event, meta) {
  if (!env.WA_KV) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `stats:${today}`;
    const raw = await env.WA_KV.get(key, { type: 'json' }) || {
      date: today,
      requests: { analysis: 0, chat: 0, pptx: 0, whatsapp: 0, report_fetch: 0 },
      whatsapp: { text: 0, audio: 0, document: 0 },
      exports: { brief: 0, pdf: 0, docx: 0, pptx: 0 },
      errors: 0,
    };
    if (event === 'error') {
      raw.errors++;
    } else if (raw.requests[event] !== undefined) {
      raw.requests[event]++;
    } else if (event.startsWith('wa_')) {
      const sub = event.slice(3);
      if (raw.whatsapp[sub] !== undefined) raw.whatsapp[sub]++;
    } else if (event.startsWith('export_')) {
      const sub = event.slice(7);
      if (raw.exports[sub] !== undefined) raw.exports[sub]++;
    }
    await env.WA_KV.put(key, JSON.stringify(raw), { expirationTtl: 604800 }); // 7 days
  } catch (e) {
    console.error('trackEvent error:', e);
  }
}

// ============================================================
// WHATSAPP: Document text extraction (PDF/DOCX/TXT)
// ============================================================

async function extractTextFromDocument(mediaUrl, mediaType, env) {
  try {
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const docResp = await fetch(mediaUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    if (!docResp.ok) throw new Error('Cannot download document from Twilio');

    // Plain text files
    if (mediaType.includes('text/plain') || mediaType.includes('text/csv') || mediaType.includes('text/markdown')) {
      return await docResp.text();
    }

    // PDF — extract text via a simple heuristic (stream text extraction)
    if (mediaType.includes('pdf')) {
      const buffer = await docResp.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const text = extractTextFromPDFBytes(bytes);
      return text || '[No se pudo extraer texto del PDF. Puede ser un PDF escaneado.]';
    }

    // DOCX — extract text from word/document.xml inside the zip
    if (mediaType.includes('wordprocessingml') || mediaType.includes('docx') || mediaType.includes('msword')) {
      const buffer = await docResp.arrayBuffer();
      const text = extractTextFromDOCXBytes(new Uint8Array(buffer));
      return text || '[No se pudo extraer texto del documento Word.]';
    }

    return '';
  } catch (e) {
    console.error('Document extraction error:', e);
    return '';
  }
}

// Lightweight PDF text extraction (no external libs, handles most text PDFs)
function extractTextFromPDFBytes(bytes) {
  const str = new TextDecoder('latin1').decode(bytes);
  const texts = [];

  // Extract text between BT...ET blocks (PDF text objects)
  const btRegex = /BT\s([\s\S]*?)ET/g;
  let match;
  while ((match = btRegex.exec(str)) !== null) {
    const block = match[1];
    // Match text show operators: Tj, TJ, ', "
    const tjRegex = /\(([^)]*)\)\s*Tj/g;
    let tm;
    while ((tm = tjRegex.exec(block)) !== null) {
      texts.push(tm[1]);
    }
    // TJ array operator
    const tjArrRegex = /\[(.*?)\]\s*TJ/g;
    while ((tm = tjArrRegex.exec(block)) !== null) {
      const inner = tm[1];
      const parts = inner.match(/\(([^)]*)\)/g);
      if (parts) {
        texts.push(parts.map(p => p.slice(1, -1)).join(''));
      }
    }
  }

  // Also try to extract from stream content with plain text
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  while ((match = streamRegex.exec(str)) !== null) {
    const content = match[1];
    if (content.includes('BT') && content.includes('ET')) continue; // already handled
    // Check for readable ASCII text
    const readable = content.replace(/[^\x20-\x7E\xC0-\xFF\n]/g, '').trim();
    if (readable.length > 50) texts.push(readable);
  }

  return texts.join(' ').replace(/\\n/g, '\n').replace(/\s+/g, ' ').trim();
}

// Lightweight DOCX text extraction (reads word/document.xml from ZIP)
function extractTextFromDOCXBytes(bytes) {
  try {
    // Find ZIP local file headers and locate word/document.xml
    const target = 'word/document.xml';
    let offset = 0;
    const len = bytes.length;

    while (offset < len - 4) {
      // Local file header signature: 0x04034b50
      if (bytes[offset] === 0x50 && bytes[offset+1] === 0x4B &&
          bytes[offset+2] === 0x03 && bytes[offset+3] === 0x04) {
        const fnLen = bytes[offset+26] | (bytes[offset+27] << 8);
        const exLen = bytes[offset+28] | (bytes[offset+29] << 8);
        const compMethod = bytes[offset+8] | (bytes[offset+9] << 8);
        const compSize = bytes[offset+18] | (bytes[offset+19] << 8) | (bytes[offset+20] << 16) | (bytes[offset+21] << 24);
        const fileName = new TextDecoder().decode(bytes.slice(offset+30, offset+30+fnLen));

        if (fileName === target && compMethod === 0) { // stored (not compressed)
          const dataStart = offset + 30 + fnLen + exLen;
          const xml = new TextDecoder().decode(bytes.slice(dataStart, dataStart + compSize));
          // Strip XML tags and extract text
          return xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        offset += 30 + fnLen + exLen + compSize;
      } else {
        offset++;
      }
    }
    return '';
  } catch (e) {
    console.error('DOCX parse error:', e);
    return '';
  }
}

// ============================================================
// WHATSAPP HELPERS
// ============================================================

function formatBriefForWhatsApp(report) {
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

function twimlResponse(message) {
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
  return new Response(xml, { headers: { 'Content-Type': 'text/xml; charset=utf-8' } });
}

async function sendWhatsAppMessage(to, body, env) {
  const num = (env.TWILIO_WHATSAPP_NUMBER || '').replace(/\D/g, '');
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
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

async function transcribeAudio(mediaUrl, mediaType, env) {
  try {
    const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
    const audioResp = await fetch(mediaUrl, {
      headers: { 'Authorization': `Basic ${auth}` }
    });
    if (!audioResp.ok) throw new Error('Cannot download audio from Twilio');
    const audioBuffer = await audioResp.arrayBuffer();

    const ext = mediaType.includes('ogg') ? 'ogg'
      : mediaType.includes('mp4') ? 'mp4'
      : mediaType.includes('mpeg') ? 'mp3'
      : 'ogg';

    const form = new FormData();
    form.append('file', new Blob([audioBuffer], { type: mediaType }), `audio.${ext}`);
    form.append('model', 'whisper-1');
    form.append('language', 'es');

    const whisperResp = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${env.OPENAI_API_KEY}` },
      body: form,
    });
    const result = await whisperResp.json();
    return result.text || '';
  } catch (e) {
    console.error('Transcription error:', e);
    return '';
  }
}

async function generateReportFromContent(content, env) {
  // Use fast model (Haiku) for WhatsApp to stay within CF waitUntil() time limits
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
      messages: [{
        role: 'user',
        content: `Transforma el siguiente contenido en el informe ejecutivo. Responde SOLO con JSON válido, sin backticks:\n\n${content}`,
      }],
    }),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const txt = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    return JSON.parse(txt.replace(/```json|```/g, '').trim());
  } catch {
    return null;
  }
}

// ── Send brief in chunks via Twilio REST API ─────────────────
async function sendBriefViaREST(from, reportData, stateKey, env) {
  try {
    await env.WA_KV.delete(stateKey);

    if (!reportData) {
      await sendWhatsAppMessage(from,
        'No encontre el informe. Por favor envia el contenido de nuevo.',
        env);
      return;
    }

    const brief = formatBriefForWhatsApp(reportData);
    const MAX_CHUNK = 1500;
    const chunks = [];
    const paragraphs = brief.split('\n\n');
    let current = '';

    for (const para of paragraphs) {
      if (para.length > MAX_CHUNK) {
        if (current.trim()) { chunks.push(current.trim()); current = ''; }
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
    await sendWhatsAppMessage(from,
      'Ocurrio un error al enviar el brief. Por favor intenta de nuevo.',
      env);
  }
}

// ── Async: process text content and reply via Twilio REST ────
async function processContentAndReply(from, content, stateKey, workerUrl, env) {
  const report = await generateReportFromContent(content, env);
  if (!report) {
    await sendWhatsAppMessage(from,
      'Lo siento, no pude generar el informe. Por favor intenta de nuevo con mas detalle en el texto.',
      env);
    return;
  }

  const uuid = crypto.randomUUID();
  await env.WA_KV.put(`report:${uuid}`, JSON.stringify(report), { expirationTtl: 86400 });
  await env.WA_KV.put(stateKey, JSON.stringify({
    state: 'AWAITING_FORMAT',
    uuid,
    reportTitle: report.title,
  }), { expirationTtl: 3600 });

  const preview = (report.executive_summary || '').slice(0, 220);
  const msg = `Informe listo\n\n*${report.title}*\n\n${preview}...\n\n¿En qué formato lo quieres?\n\n1 - Brief (aqui en el chat)\n2 - PDF\n3 - Word\n4 - PPT (link de descarga)`;
  await sendWhatsAppMessage(from, msg, env);
}

// ── Async: transcribe audio then process ─────────────────────
async function processAudioAndReply(from, mediaUrl, mediaType, stateKey, workerUrl, env) {
  const transcript = await transcribeAudio(mediaUrl, mediaType, env);
  if (!transcript) {
    await sendWhatsAppMessage(from,
      'No pude transcribir el audio. Por favor envía el texto directamente en el chat.',
      env);
    return;
  }
  await sendWhatsAppMessage(from,
    `Audio transcrito. Generando informe...\n\n"${transcript.slice(0, 120)}..."`,
    env);
  await processContentAndReply(from, transcript, stateKey, workerUrl, env);
}

// ── Main WhatsApp webhook handler ────────────────────────────
async function handleWhatsApp(request, env, ctx) {
  const formData = await request.formData();
  const from = formData.get('From') || '';
  const body = (formData.get('Body') || '').trim();
  const numMedia = parseInt(formData.get('NumMedia') || '0');
  const mediaUrl = formData.get('MediaUrl0') || '';
  const mediaType = formData.get('MediaContentType0') || '';

  if (!from) return new Response('Bad Request', { status: 400 });

  const stateKey = `wa_state:${from}`;
  const stateData = await env.WA_KV.get(stateKey, { type: 'json' }) || { state: 'IDLE' };
  const workerUrl = new URL(request.url).origin;
  const appUrl = (env.APP_URL || '').replace(/\/$/, '');

  // ── FORMAT CHOICE ────────────────────────────────────────
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

    if (choice === '4' || choice.includes('ppt') || choice.includes('presentacion') || choice.includes('presentación')) {
      const link = `${appUrl}?wa=${stateData.uuid}&worker=${encodeURIComponent(workerUrl)}&format=pptx`;
      await env.WA_KV.delete(stateKey);
      return twimlResponse(`Aqui esta tu PPT:\n\n${link}\n\n_Disponible por 24 horas._`);
    }

    return twimlResponse('Por favor elige:\n\n1 - Brief (aqui en el chat)\n2 - PDF\n3 - Word\n4 - PPT (link de descarga)');
  }

  // ── IDLE — new content ───────────────────────────────────
  if (numMedia > 0 && mediaUrl) {
    if (mediaType.includes('audio')) {
      ctx.waitUntil((async () => {
        await trackEvent(env, 'wa_audio');
        await processAudioAndReply(from, mediaUrl, mediaType, stateKey, workerUrl, env);
      })());
      return twimlResponse('Recibi tu audio. Transcribiendo y generando informe ALTO...\n\nTe respondo en aprox 30-60 segundos.');
    }

    // Document support: PDF, DOCX, TXT, CSV
    const isDocument = mediaType.includes('pdf')
      || mediaType.includes('wordprocessingml') || mediaType.includes('msword') || mediaType.includes('docx')
      || mediaType.includes('text/plain') || mediaType.includes('text/csv') || mediaType.includes('text/markdown');

    if (isDocument) {
      ctx.waitUntil((async () => {
        await trackEvent(env, 'wa_document');
        const text = await extractTextFromDocument(mediaUrl, mediaType, env);
        if (!text || text.startsWith('[')) {
          await sendWhatsAppMessage(from,
            text || 'No pude extraer texto del documento. Intenta con un archivo de texto o pega el contenido directamente.',
            env);
          return;
        }
        await sendWhatsAppMessage(from,
          `Documento recibido (${Math.round(text.length/1000)}K caracteres). Generando informe...`,
          env);
        await processContentAndReply(from, text.slice(0, 50000), stateKey, workerUrl, env);
      })());
      return twimlResponse('Recibi tu documento. Extrayendo texto y generando informe ALTO...\n\nTe respondo en aprox 30-60 segundos.');
    }

    return twimlResponse('Acepto texto, notas de voz, y documentos (PDF, Word, TXT).\n\nPor favor envia uno de esos formatos.');
  }

  const greetings = ['hola', 'hi', 'hello', 'buenas', 'help', 'ayuda', 'start', 'inicio'];
  if (!body || greetings.includes(body.toLowerCase())) {
    return twimlResponse('Hola! Soy el agente ALTO.\n\nEnviame texto o una nota de voz con informacion sobre cualquier tema y lo convierto en un informe ejecutivo profesional.\n\nAcepto:\n- Texto directo\n- Notas de voz\n- Documentos (PDF, Word, TXT)\n\nFormatos de entrega:\n- Brief en el chat\n- PDF\n- Word\n- PPT (link de descarga)\n\nQue quieres analizar?');
  }

  ctx.waitUntil((async () => {
    await trackEvent(env, 'wa_text');
    await processContentAndReply(from, body, stateKey, workerUrl, env);
  })());
  return twimlResponse('Generando tu informe ALTO...\n\nTe respondo en aproximadamente 30-60 segundos.');
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const requestOrigin = request.headers.get('Origin') || '';

    // ── OPTIONS (CORS preflight) ──────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env, requestOrigin) });
    }

    // ── GET /stats — monitoring dashboard data ─────────────
    if (request.method === 'GET' && url.pathname === '/stats') {
      // Require a simple bearer token (reuse ANTHROPIC key prefix as admin check)
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

      // Aggregate totals
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

      return new Response(JSON.stringify({ days: stats, totals }, null, 2), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, requestOrigin) }
      });
    }

    // ── GET /report/:uuid — serve cached report for magic links ──
    if (request.method === 'GET' && url.pathname.startsWith('/report/')) {
      const uuid = url.pathname.split('/')[2];
      if (!uuid || !UUID_RE.test(uuid)) {
        return new Response('Not found', { status: 404 });
      }
      const data = await env.WA_KV.get(`report:${uuid}`);
      if (!data) return new Response(JSON.stringify({ error: 'Report not found or expired' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, requestOrigin) }
      });
      ctx.waitUntil(trackEvent(env, 'report_fetch'));
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env, requestOrigin) }
      });
    }

    // ── POST /whatsapp — Twilio webhook ───────────────────
    if (request.method === 'POST' && url.pathname === '/whatsapp') {
      // FIX 1: Validate Twilio signature to prevent unauthorized access
      const isValid = await validateTwilioSignature(request, env);
      if (!isValid) {
        console.error('Invalid Twilio signature — rejecting webhook');
        return new Response('Forbidden', { status: 403 });
      }

      // FIX 3: Rate limit WhatsApp per phone number
      const waFrom = (await request.clone().formData()).get('From') || '';
      if (waFrom && env.RATE_LIMIT_KV) {
        const waKey = `rl:wa:${waFrom}`;
        const waCurrent = parseInt((await env.RATE_LIMIT_KV.get(waKey)) || '0', 10);
        const waLimit = parseInt(env.WA_RATE_LIMIT_PER_HOUR || '20', 10);
        if (waCurrent >= waLimit) {
          return twimlResponse('Has excedido el limite de mensajes por hora. Por favor intenta en unos minutos.');
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

    // ── FIX 2: Origin check — no localhost bypass ─────────
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
    const isAllowed = allowed[0] === '*' || allowed.some(a => requestOrigin === a || requestOrigin.startsWith(a));
    if (!isAllowed) {
      return jsonResponse(403, { error: 'Origin not allowed' }, env, requestOrigin);
    }

    // ── Rate limiting ─────────────────────────────────────
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limitPerHour = parseInt(env.RATE_LIMIT_PER_HOUR || '30', 10);
    if (env.RATE_LIMIT_KV) {
      const key = `rl:${ip}`;
      const current = parseInt((await env.RATE_LIMIT_KV.get(key)) || '0', 10);
      if (current >= limitPerHour) {
        return jsonResponse(429, { error: 'Rate limit exceeded. Try again later.', limit: limitPerHour, reset: '1 hour' }, env, requestOrigin);
      }
      await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 3600 });
    }

    // ── FIX 5: Body size limit ────────────────────────────
    const contentLength = parseInt(request.headers.get('Content-Length') || '0', 10);
    if (contentLength > MAX_BODY_SIZE) {
      return jsonResponse(413, { error: 'Request body too large. Max 500KB.' }, env, requestOrigin);
    }

    try {
      const rawBody = await request.text();
      if (rawBody.length > MAX_BODY_SIZE) {
        return jsonResponse(413, { error: 'Request body too large. Max 500KB.' }, env, requestOrigin);
      }
      const body = JSON.parse(rawBody);
      const model = env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

      // ── CHAT MODE ──────────────────────────────────────
      if (body.userContent === '__CHAT_MODE__' && body.chatMessages) {
        ctx.waitUntil(trackEvent(env, 'chat'));
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
            system: 'Eres un consultor estratégico senior. El usuario te consulta sobre un informe ejecutivo que ya fue generado. Responde de forma concisa y profesional en el mismo idioma del informe. Si el usuario pide modificaciones al informe, responde con el texto explicativo seguido de __JSON_UPDATE__ en una línea separada y luego el JSON completo actualizado del informe (mismo esquema que el original). Si solo pide información o aclaración, responde en texto normal sin JSON.',
            messages: body.chatMessages,
          }),
        });
        const data = await resp.json();
        return jsonResponse(resp.status, data, env, requestOrigin);

      // ── PPTX MODE — streaming SSE with extended thinking ──
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
            messages: [{
              role: 'user',
              content: 'Transforma este informe ejecutivo en estructura de slides. Usa SOLO la paleta ALTO. Sin emojis ni símbolos decorativos. Responde SOLO con JSON válido.\n\n'
                + (body.pptxInstructions ? body.pptxInstructions + '\n\n' : '')
                + 'INFORME:\n' + body.reportJSON,
            }],
          }),
        });

        if (!pptxResponse.ok) {
          const err = await pptxResponse.json();
          return jsonResponse(pptxResponse.status, { error: err.error?.message || 'API error' }, env, requestOrigin);
        }

        const { readable: pptxReadable, writable: pptxWritable } = new TransformStream();
        const pptxWriter = pptxWritable.getWriter();
        const pptxEncoder = new TextEncoder();

        (async () => {
          const reader = pptxResponse.body.getReader();
          const decoder = new TextDecoder();
          let buf = '';
          let isThinking = true;
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
                  // Signal thinking→writing transition
                  if (evt.type === 'content_block_start' && evt.content_block?.type === 'text') {
                    isThinking = false;
                    await pptxWriter.write(pptxEncoder.encode(`data: ${JSON.stringify({ phase: 'writing' })}\n\n`));
                  }
                  if (evt.type === 'content_block_start' && evt.content_block?.type === 'thinking') {
                    await pptxWriter.write(pptxEncoder.encode(`data: ${JSON.stringify({ phase: 'thinking' })}\n\n`));
                  }
                  // Forward only text deltas
                  if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                    await pptxWriter.write(pptxEncoder.encode(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`));
                  }
                } catch {}
              }
            }
          } finally {
            await pptxWriter.write(pptxEncoder.encode('data: [DONE]\n\n'));
            await pptxWriter.close();
          }
        })();

        return new Response(pptxReadable, {
          status: 200,
          headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            ...corsHeaders(env, requestOrigin),
          },
        });

      // ── ANÁLISIS MODE — streaming SSE with extended thinking ──
      } else {
        ctx.waitUntil(trackEvent(env, 'analysis'));

        // Build messages — support vision (images array)
        const userBlocks = [];
        if (body.images && Array.isArray(body.images) && body.images.length > 0) {
          body.images.forEach(img => {
            userBlocks.push({
              type: 'image',
              source: { type: 'base64', media_type: img.media_type, data: img.data },
            });
          });
          userBlocks.push({
            type: 'text',
            text: 'Transforma el siguiente documento fuente (incluye imágenes del documento) en el informe ejecutivo solicitado. Analiza las imágenes para extraer datos, gráficos y tablas relevantes. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n' + (body.userContent || ''),
          });
        } else {
          userBlocks.push({
            type: 'text',
            text: 'Transforma el siguiente documento fuente en el informe ejecutivo solicitado. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n' + (body.userContent || ''),
          });
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
            max_tokens: 16000,
            thinking: { type: 'enabled', budget_tokens: 10000 },
            stream: true,
            system: SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: userBlocks,
            }],
          }),
        });

        if (!anthropicResponse.ok) {
          const err = await anthropicResponse.json();
          return jsonResponse(anthropicResponse.status, { error: err.error?.message || 'API error' }, env, requestOrigin);
        }

        const { readable, writable } = new TransformStream();
        const writer = writable.getWriter();
        const encoder = new TextEncoder();

        (async () => {
          const reader = anthropicResponse.body.getReader();
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
                  // Signal thinking→writing transition to frontend
                  if (evt.type === 'content_block_start' && evt.content_block?.type === 'text') {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ phase: 'writing' })}\n\n`));
                  }
                  if (evt.type === 'content_block_start' && evt.content_block?.type === 'thinking') {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ phase: 'thinking' })}\n\n`));
                  }
                  // Forward only text deltas (not thinking deltas)
                  if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
                    await writer.write(encoder.encode(`data: ${JSON.stringify({ text: evt.delta.text })}\n\n`));
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
            ...corsHeaders(env, requestOrigin),
          },
        });
      }

    } catch (err) {
      // FIX 6: Log the actual error for debugging
      console.error('Worker error:', err.message, err.stack);
      ctx.waitUntil(trackEvent(env, 'error'));
      return jsonResponse(500, { error: 'Internal server error' }, env, requestOrigin);
    }
  },
};
