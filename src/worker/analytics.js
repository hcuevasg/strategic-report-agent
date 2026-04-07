// ============================================================
// Analytics — lightweight event tracking and abuse logging via KV
// ============================================================

// ── Event tracking ───────────────────────────────────────────
export async function trackEvent(env, event) {
  if (!env.WA_KV) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `stats:${today}`;
    const raw = (await env.WA_KV.get(key, { type: 'json' })) || {
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

// ── Abuse logging ─────────────────────────────────────────────
export async function logAbuse(env, type, detail) {
  if (!env.WA_KV) return;
  try {
    const today = new Date().toISOString().slice(0, 10);
    const key = `abuse:${today}`;
    const raw = (await env.WA_KV.get(key, { type: 'json' })) || {};
    raw[type] = (raw[type] || 0) + 1;

    // Store last 5 details for forensics
    const detailKey = `${type}_details`;
    if (!raw[detailKey]) raw[detailKey] = [];
    raw[detailKey].push({ detail, ts: new Date().toISOString() });
    if (raw[detailKey].length > 5) raw[detailKey] = raw[detailKey].slice(-5);

    await env.WA_KV.put(key, JSON.stringify(raw), { expirationTtl: 604800 });
    console.error(`[ABUSE] ${type}: ${detail}`);
  } catch (e) {
    console.error('logAbuse error:', e);
  }
}
