// API — Worker communication, streaming SSE, retry logic
// Depends on: state.js, ui-helpers.js, schemas.js
// ============================================================

// ============================================================
// WORKER FETCH — soporta streaming SSE y JSON legado
// ============================================================
function isRetryableWorkerError(message) {
  const text = String(message || '').toLowerCase();
  return (
    text.includes('llego incompleta') ||
    text.includes('tiempo de espera agotado') ||
    text.includes('se detuvo por demasiado tiempo') ||
    text.includes('tardando demasiado') ||
    text.includes('failed to fetch') ||
    text.includes('networkerror')
  );
}

async function fetchFromWorker(url, body, onChunk, onPhase) {
  const headers = { 'Content-Type': 'application/json' };
  if (window._sessionToken) headers['X-Session-Token'] = window._sessionToken;
  const retryCount = Number(body._retryCount || 0);
  const maxRetries = body.reportType === 'multisource_contrast' ? 1 : 0;
  const timeoutMs =
    body.userContent === '__PPTX_MODE__'
      ? FETCH_TIMEOUT_PPTX_MS
      : body.reportType === 'multisource_contrast'
        ? FETCH_TIMEOUT_CONTRAST_MS
        : FETCH_TIMEOUT_MS;
  const streamIdleTimeoutMs =
    body.reportType === 'multisource_contrast' ? STREAM_IDLE_TIMEOUT_CONTRAST_MS : STREAM_IDLE_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    if (e.name === 'AbortError') {
      const err = new Error('Tiempo de espera agotado. Intenta con un documento más corto.');
      if (retryCount < maxRetries) {
        return fetchFromWorker(url, { ...body, _retryCount: retryCount + 1 }, onChunk, onPhase);
      }
      throw err;
    }
    if (retryCount < maxRetries && isRetryableWorkerError(e.message || e)) {
      return fetchFromWorker(url, { ...body, _retryCount: retryCount + 1 }, onChunk, onPhase);
    }
    throw e;
  }
  clearTimeout(timer);
  if (!res.ok) {
    const errText = await res.text();
    if (errText.trim().startsWith('<'))
      throw new Error('Worker devolvió HTML. Status: ' + res.status);
    try {
      const d = JSON.parse(errText);
      throw new Error(d.error?.message || d.error || 'Error del servidor');
    } catch (e2) {
      if (e2.message.startsWith('Worker') || e2.message.startsWith('Error del')) throw e2;
      throw new Error('Error: ' + errText.substring(0, 200));
    }
  }
  const ct = res.headers.get('content-type') || '';
  let fullText = '';
  if (ct.includes('text/event-stream')) {
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let streamError = null;
    let seenWritingPhase = false;
    let sawDone = false;

    const readWithTimeout = async () => {
      let idleTimer;
      try {
        return await Promise.race([
          reader.read(),
          new Promise((_, reject) => {
            idleTimer = setTimeout(() => {
              reject(
                new Error(
                  seenWritingPhase
                    ? 'La generacion del informe se detuvo por demasiado tiempo. Intenta nuevamente.'
                    : 'El contraste esta tardando demasiado en empezar a redactarse. Reduce la cantidad de puntos o fuentes e intenta nuevamente.'
                )
              );
            }, streamIdleTimeoutMs);
          }),
        ]);
      } finally {
        clearTimeout(idleTimer);
      }
    };

    try {
      while (true) {
        const { done, value } = await readWithTimeout();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split('\n\n');
        buf = lines.pop();
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            sawDone = true;
            continue;
          }
          try {
            const p = JSON.parse(data);
            if (p.phase && onPhase) onPhase(p.phase);
            if (p.phase === 'writing') seenWritingPhase = true;
            if (p.text) {
              fullText += p.text;
              if (onChunk) onChunk(fullText, p.text);
            }
          } catch (parseErr) {
            console.warn('SSE chunk parse error:', parseErr.message);
          }
        }
      }
    } catch (streamErr) {
      streamError = streamErr;
      try {
        await reader.cancel(streamErr.message);
      } catch (cancelErr) {
        console.warn('Stream cancel failed:', cancelErr.message);
      }
    }
    // If stream broke but we have partial content, try to use it
    if (streamError && !fullText) {
      if (retryCount < maxRetries && isRetryableWorkerError(streamError.message || streamError)) {
        return fetchFromWorker(url, { ...body, _retryCount: retryCount + 1 }, onChunk, onPhase);
      }
      throw streamError;
    }
    if (streamError && fullText) {
      console.warn('Stream interrupted, discarding partial response:', streamError.message);
      const err = new Error(
        'La respuesta del modelo llego incompleta. Intenta generar el contraste nuevamente.'
      );
      if (retryCount < maxRetries) {
        return fetchFromWorker(url, { ...body, _retryCount: retryCount + 1 }, onChunk, onPhase);
      }
      throw err;
    }
    if (!sawDone) {
      const err = new Error(
        'La respuesta del modelo llego incompleta. Intenta generar el contraste nuevamente.'
      );
      if (retryCount < maxRetries) {
        return fetchFromWorker(url, { ...body, _retryCount: retryCount + 1 }, onChunk, onPhase);
      }
      throw err;
    }
  } else {
    const raw = await res.text();
    if (raw.trim().startsWith('<')) throw new Error('Worker devolvió HTML. Status: ' + res.status);
    let data;
    try {
      data = JSON.parse(raw);
    } catch (e) {
      throw new Error('No es JSON: ' + raw.substring(0, 200));
    }
    if (data.error) throw new Error(data.error.message || data.error);
    if (!data.content || !Array.isArray(data.content)) throw new Error('Respuesta inesperada');
    fullText = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');
  }
  return fullText;
}

async function analyze() {
  const input = document.getElementById('inputText').value.trim();
  const wUrl = WORKER_URL;
  if (!input) return;
  document.getElementById('validationWarn').classList.add('hidden');
  setLoading(true);
  startProgress();
  hideError();
  hidePreview();
  result = null;
  originalResult = null;
  try {
    const SECTION_PROGRESS = {
      '"title"': t('progressTitle'),
      '"executive_summary"': t('progressSummary'),
      '"key_messages"': t('progressKeys'),
      '"context"': t('progressContext'),
      '"findings"': t('progressFindings'),
      '"analysis_blocks"': t('progressAnalysis'),
      '"risks"': t('progressRisks'),
      '"opportunities"': t('progressOpps'),
      '"recommendations"': t('progressRecs'),
      '"conclusion"': t('progressConclusion'),
      '"kpis"': t('progressKpis'),
    };
    let chunks = 0;
    let thinkingPhase = true;
    const requestBody = { userContent: input, reportType: currentReportType, outputLanguage };
    // Attach images if available (vision support)
    if (window._pendingImages && window._pendingImages.length > 0) {
      requestBody.images = window._pendingImages;
    }
    const txt = await fetchFromWorker(
      wUrl,
      requestBody,
      (full, chunk) => {
        chunks++;
        if (thinkingPhase) {
          thinkingPhase = false;
          clearInterval(progressTimer);
        }
        clearInterval(progressTimer);
        const pct = Math.min(93, 10 + chunks * 4);
        document.getElementById('progressFill').style.width = pct + '%';
        document.getElementById('progressPct').textContent = pct + '%';
        const keys = Object.keys(SECTION_PROGRESS);
        let lastKey = null;
        let lastPos = -1;
        for (const k of keys) {
          const p = full.lastIndexOf(k);
          if (p > lastPos) {
            lastPos = p;
            lastKey = k;
          }
        }
        if (lastKey)
          document.getElementById('progressStep').textContent = SECTION_PROGRESS[lastKey];
      },
      phase => {
        if (phase === 'thinking') {
          document.getElementById('progressStep').textContent = t('thinkingStep');
          document.getElementById('progressFill').style.width = '5%';
          document.getElementById('progressPct').textContent = '5%';
        } else if (phase === 'writing') {
          document.getElementById('progressStep').textContent = t('writingStep');
          document.getElementById('progressFill').style.width = '12%';
          document.getElementById('progressPct').textContent = '12%';
        }
      }
    );
    result = parseReportJSON(txt);
    // Set language from report
    if (result.language && i18n[result.language]) currentLang = result.language;
    else currentLang = 'es';
    originalResult = cloneData(result);
    const missing = validateReport(result);
    if (missing.length) showValidationWarning(missing);
    window._pendingImages = null;
    stopProgress(true);
    renderPreview(result);
    showExportBtns();
    showStatus(t('reportReady'));
    setDot('ok');
    saveToHistory(result);
  } catch (err) {
    stopProgress(false);
    showError(err.message);
    setDot('no');
  } finally {
    setLoading(false);
  }
}
