// ============================================================
// Cloudflare Worker — ALTO Strategic Report Agent v8
// ============================================================
// v8: WhatsApp integration via Twilio
//     + report cache (KV) for magic links
//     + audio transcription via Whisper
//     + email via Resend
// ============================================================
// Env vars required:
//   ANTHROPIC_API_KEY      — Anthropic API key
//   CLAUDE_MODEL           — e.g. "claude-sonnet-4-20250514"
//   ALLOWED_ORIGIN         — comma-separated allowed origins or "*"
//   RATE_LIMIT_PER_HOUR    — default 30
//   APP_URL                — e.g. "https://hcuevasg.github.io/strategic-report-agent"
//   TWILIO_ACCOUNT_SID     — Twilio Account SID
//   TWILIO_AUTH_TOKEN      — Twilio Auth Token
//   TWILIO_WHATSAPP_NUMBER — e.g. "+14155238886" (sandbox) or your business number
//   OPENAI_API_KEY         — for Whisper audio transcription
//   RESEND_API_KEY         — for email sending
//   RESEND_FROM            — e.g. "ALTO Reports <reports@tudominio.com>"
//
// KV bindings required:
//   RATE_LIMIT_KV          — existing rate limit KV
//   WA_KV                  — new KV for WhatsApp state + report cache
// ============================================================

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
  // Escape XML special chars
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
  const model = env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
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
      system: SYSTEM_PROMPT,
      messages: [{
        role: 'user',
        content: `Transforma el siguiente documento fuente en el informe ejecutivo solicitado. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n${content}`,
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

async function sendEmailWithLink(to, report, uuid, workerUrl, env) {
  const appUrl = (env.APP_URL || '').replace(/\/$/, '');
  const link = `${appUrl}?wa=${uuid}&worker=${encodeURIComponent(workerUrl)}&format=pptx`;
  const title = report.title || 'Informe ALTO';
  const summary = report.executive_summary || '';

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM || 'ALTO Reports <noreply@alto.com>',
      to: [to],
      subject: `Tu presentación ALTO: ${title}`,
      html: `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F8F9FB;font-family:sans-serif;">
<div style="max-width:580px;margin:40px auto;">
  <div style="background:#041627;padding:24px 28px;">
    <div style="color:#BB0014;font-size:9px;letter-spacing:3px;font-weight:800;text-transform:uppercase;margin-bottom:10px;">ALTO · Strategic Insights</div>
    <div style="color:#fff;font-size:19px;font-weight:800;line-height:1.25;">${title}</div>
    ${report.subtitle ? `<div style="color:#8192A7;font-size:11px;margin-top:6px;font-style:italic;">${report.subtitle}</div>` : ''}
  </div>
  <div style="background:#fff;padding:28px;">
    <p style="color:#44474C;font-size:13px;line-height:1.7;margin:0 0 24px;">${summary}</p>
    <a href="${link}" style="display:inline-block;background:#041627;color:#fff;padding:14px 28px;text-decoration:none;font-weight:700;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">
      Descargar Presentación PPT →
    </a>
    <p style="color:#74777D;font-size:10px;margin-top:20px;">El enlace estará disponible por 24 horas. Ábrelo en Chrome o Safari para la descarga automática.</p>
  </div>
  <div style="background:#F2F4F6;padding:12px 28px;border-left:3px solid #BB0014;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:9px;font-weight:800;color:#041627;letter-spacing:1px;">ALTO</span>
    <span style="font-size:9px;color:#74777D;font-style:italic;">Confidencial · Uso interno</span>
  </div>
</div>
</body>
</html>`,
    }),
  });
  return resp.ok;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
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
  const msg = `Informe listo\n\n*${report.title}*\n\n${preview}...\n\n¿En qué formato lo quieres?\n\n1 - Brief (aqui en el chat)\n2 - PDF\n3 - Word\n4 - PPT (te lo enviamos al correo)`;
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
      await env.WA_KV.delete(stateKey);
      if (!reportData) return twimlResponse('No encontre el informe. Por favor envía el contenido de nuevo.');
      const brief = formatBriefForWhatsApp(reportData);
      return twimlResponse(brief.length > 3800 ? brief.slice(0, 3800) + '\n\n_[resumido por límite de WhatsApp]_' : brief);
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
      await env.WA_KV.put(stateKey, JSON.stringify({ ...stateData, state: 'AWAITING_EMAIL' }), { expirationTtl: 3600 });
      return twimlResponse('A que correo te enviamos la presentacion PPT?');
    }

    return twimlResponse('Por favor elige:\n\n1 - Brief (aqui en el chat)\n2 - PDF\n3 - Word\n4 - PPT (por correo)');
  }

  // ── EMAIL INPUT ──────────────────────────────────────────
  if (stateData.state === 'AWAITING_EMAIL') {
    if (isValidEmail(body)) {
      const reportData = await env.WA_KV.get(`report:${stateData.uuid}`, { type: 'json' });
      const uuid = stateData.uuid;
      ctx.waitUntil((async () => {
        await sendEmailWithLink(body.trim(), reportData || { title: stateData.reportTitle }, uuid, workerUrl, env);
        await env.WA_KV.delete(stateKey);
      })());
      return twimlResponse(`Enviando la presentacion a *${body.trim()}*...\n\nRevisa tu bandeja en unos segundos.\n\n_ALTO · Strategic Insights_`);
    }
    return twimlResponse('No reconoci ese correo. Por favor envíalo de nuevo.\nEjemplo: nombre@empresa.com');
  }

  // ── IDLE — new content ───────────────────────────────────
  if (numMedia > 0 && mediaUrl) {
    if (mediaType.includes('audio')) {
      ctx.waitUntil(processAudioAndReply(from, mediaUrl, mediaType, stateKey, workerUrl, env));
      return twimlResponse('Recibi tu audio. Transcribiendo y generando informe ALTO...\n\nTe respondo en aprox 30-60 segundos.');
    }
    return twimlResponse('Por ahora proceso texto y audios. Por favor pega el texto directamente en el chat.');
  }

  const greetings = ['hola', 'hi', 'hello', 'buenas', 'help', 'ayuda', 'start', 'inicio'];
  if (!body || greetings.includes(body.toLowerCase())) {
    return twimlResponse('Hola! Soy el agente ALTO.\n\nEnviame texto o una nota de voz con informacion sobre cualquier tema y lo convierto en un informe ejecutivo profesional.\n\nPuedo entregarlo como:\n- Brief en el chat\n- PDF\n- Word\n- PPT (por correo)\n\nQue quieres analizar?');
  }

  ctx.waitUntil(processContentAndReply(from, body, stateKey, workerUrl, env));
  return twimlResponse('Generando tu informe ALTO...\n\nTe respondo en aproximadamente 30-60 segundos.');
}

// ============================================================
// MAIN EXPORT
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // ── OPTIONS (CORS preflight) ──────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    // ── GET /report/:uuid — serve cached report for magic links ──
    if (request.method === 'GET' && url.pathname.startsWith('/report/')) {
      const uuid = url.pathname.split('/')[2];
      if (!uuid) return new Response('Not found', { status: 404 });
      const data = await env.WA_KV.get(`report:${uuid}`);
      if (!data) return new Response(JSON.stringify({ error: 'Report not found or expired' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
      });
      return new Response(data, {
        headers: { 'Content-Type': 'application/json', ...corsHeaders(env) }
      });
    }

    // ── POST /whatsapp — Twilio webhook ───────────────────
    if (request.method === 'POST' && url.pathname === '/whatsapp') {
      return handleWhatsApp(request, env, ctx);
    }

    // ── All other requests: require POST ──────────────────
    if (request.method !== 'POST') {
      return jsonResponse(405, { error: 'Method not allowed' }, env);
    }

    // ── Origin check ──────────────────────────────────────
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim());
    const isAllowed = allowed.some(a => origin.startsWith(a)) || origin.includes('localhost') || origin.includes('127.0.0.1');
    if (!isAllowed && allowed[0] !== '*') {
      return jsonResponse(403, { error: 'Origin not allowed' }, env);
    }

    // ── Rate limiting ─────────────────────────────────────
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const limitPerHour = parseInt(env.RATE_LIMIT_PER_HOUR || '30', 10);
    if (env.RATE_LIMIT_KV) {
      const key = `rl:${ip}`;
      const current = parseInt((await env.RATE_LIMIT_KV.get(key)) || '0', 10);
      if (current >= limitPerHour) {
        return jsonResponse(429, { error: 'Rate limit exceeded. Try again later.', limit: limitPerHour, reset: '1 hour' }, env);
      }
      await env.RATE_LIMIT_KV.put(key, String(current + 1), { expirationTtl: 3600 });
    }

    try {
      const body = await request.json();
      const model = env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';

      // ── CHAT MODE ──────────────────────────────────────
      if (body.userContent === '__CHAT_MODE__' && body.chatMessages) {
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
        return jsonResponse(resp.status, data, env);

      // ── PPTX MODE ──────────────────────────────────────
      } else if (body.userContent === '__PPTX_MODE__' && body.reportJSON) {
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
            system: PPTX_SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: 'Transforma este informe ejecutivo en estructura de slides. Usa SOLO la paleta ALTO. Sin emojis ni símbolos decorativos. Responde SOLO con JSON válido.\n\n'
                + (body.pptxInstructions ? body.pptxInstructions + '\n\n' : '')
                + 'INFORME:\n' + body.reportJSON,
            }],
          }),
        });
        const data = await resp.json();
        return jsonResponse(resp.status, data, env);

      // ── ANÁLISIS MODE — streaming SSE ───────────────────
      } else {
        const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: 8000,
            stream: true,
            system: SYSTEM_PROMPT,
            messages: [{
              role: 'user',
              content: 'Transforma el siguiente documento fuente en el informe ejecutivo solicitado. Responde SOLO con JSON válido, sin backticks ni markdown:\n\n' + (body.userContent || ''),
            }],
          }),
        });

        if (!anthropicResponse.ok) {
          const err = await anthropicResponse.json();
          return jsonResponse(anthropicResponse.status, { error: err.error?.message || 'API error' }, env);
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
            ...corsHeaders(env),
          },
        });
      }

    } catch (err) {
      return jsonResponse(500, { error: 'Internal server error' }, env);
    }
  },
};

function corsHeaders(env) {
  return {
    'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(status, body, env) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(env) },
  });
}
