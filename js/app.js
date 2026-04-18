// ============================================================
// APP — Report configuration, validation, navigation, calendar
// Depends on: state.js, ui-helpers.js, schemas.js, api.js, preview.js, history.js
// ============================================================

// ============================================================
// REPORT TYPE SELECTOR
// ============================================================
function setReportType(el) {
  document
    .querySelectorAll('#reportTypeChips .rtype-chip')
    .forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  currentReportType = el.dataset.type;
}

// ============================================================
// OUTPUT LANGUAGE SELECTOR
// ============================================================
function setOutputLang(el) {
  document.querySelectorAll('#langChips .rtype-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  outputLanguage = el.dataset.lang;
  if (outputLanguage !== 'auto' && i18n[outputLanguage]) currentLang = outputLanguage;
}

// ============================================================
// UI LANGUAGE TOGGLE (ES/EN in header)
// ============================================================
function setUILang(lang) {
  currentLang = lang;
  // Toggle active styles
  const esBtn = document.getElementById('uiLangEs');
  const enBtn = document.getElementById('uiLangEn');
  if (lang === 'es') {
    esBtn.className =
      "font-['Inter'] text-[10px] uppercase tracking-widest text-white font-bold px-1.5 py-0.5 transition-all";
    esBtn.style.background = 'rgba(187,0,20,0.8)';
    enBtn.className =
      "font-['Inter'] text-[10px] uppercase tracking-widest text-slate-400 px-1.5 py-0.5 transition-all hover:text-white";
    enBtn.style.background = 'transparent';
  } else {
    enBtn.className =
      "font-['Inter'] text-[10px] uppercase tracking-widest text-white font-bold px-1.5 py-0.5 transition-all";
    enBtn.style.background = 'rgba(187,0,20,0.8)';
    esBtn.className =
      "font-['Inter'] text-[10px] uppercase tracking-widest text-slate-400 px-1.5 py-0.5 transition-all hover:text-white";
    esBtn.style.background = 'transparent';
  }
  updateUI();
}

// ============================================================
// UPDATE UI LANGUAGE — applies i18n to all data-i18n elements
// ============================================================
function updateUI() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val && val !== key) el.textContent = val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key);
    if (val && val !== key) el.title = val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val && val !== key) el.placeholder = val;
  });
  // Re-render JS-generated UI that contains translated strings
  renderHistory();
  renderInformesDashboard();
  renderMinutasList();
}

// ============================================================
// JSON VALIDATION
// ============================================================
function validateReport(r) {
  const checks = [
    { key: 'title', label: t('valTitle') },
    { key: 'executive_summary', label: t('valSummary') },
    { key: 'key_messages', label: t('valMessages') },
    { key: 'findings', label: t('valFindings') },
    { key: 'analysis_blocks', label: t('valAnalysis') },
    { key: 'recommendations', label: t('valRecs') },
  ];
  return checks
    .filter(c => !r[c.key] || (Array.isArray(r[c.key]) && !r[c.key].length))
    .map(c => c.label);
}

function parseReportJSON(rawText) {
  try {
    return parseModelJSON('report', rawText);
  } catch (schemaError) {
    const clean = String(rawText || '')
      .replace(/```json|```/g, '')
      .trim();
    let salvaged = null;
    try {
      let fix = clean;
      const opens = (fix.match(/\{/g) || []).length;
      const closes = (fix.match(/\}/g) || []).length;
      const arrOpens = (fix.match(/\[/g) || []).length;
      const arrCloses = (fix.match(/\]/g) || []).length;
      fix = fix.replace(/,\s*$/, '');
      fix = fix.replace(/,\s*"[^"]*"?\s*$/, '');
      for (let i = 0; i < arrOpens - arrCloses; i++) fix += ']';
      for (let i = 0; i < opens - closes; i++) fix += '}';
      salvaged = parseModelJSON('report', fix);
    } catch (_salvageError) {}
    if (salvaged && salvaged.title) {
      showValidationWarning(['El informe se recibió incompleto — algunas secciones pueden faltar']);
      return salvaged;
    }
    throw new Error('La IA no devolvió JSON válido. ' + schemaError.message);
  }
}
function showValidationWarning(fields) {
  document.getElementById('validationWarnText').textContent =
    t('uiFieldsIncomplete') + ': ' + fields.join(', ') + '. ' + t('uiMayBeIncomplete');
  document.getElementById('validationWarn').classList.remove('hidden');
}

// ============================================================
// REGENERAR SECCIÓN
// ============================================================
function startFakeProgress(onUpdate) {
  let pct = 0;
  const iv = setInterval(() => {
    const inc = pct < 25 ? 5 : pct < 55 ? 3 : pct < 78 ? 1.5 : 0.4;
    pct = Math.min(pct + inc, 88);
    onUpdate(Math.round(pct));
  }, 350);
  return {
    complete() {
      clearInterval(iv);
      onUpdate(100);
    },
    cancel() {
      clearInterval(iv);
    },
  };
}

async function regenSection(sectionKey, idx, btn) {
  const wUrl = WORKER_URL;
  if (!wUrl || !result) return;
  const labels = {
    findings: t('regenFindings'),
    analysis_blocks: t('regenAnalysis') + (idx !== undefined ? ' ' + (idx + 1) : ''),
    recommendations: t('regenRecs'),
    risks: t('regenRisks'),
    opportunities: t('regenOpps'),
    executive_summary: t('regenExecSummary'),
    key_messages: t('regenKeyMessages'),
    context: t('regenContext'),
    conclusion: t('regenConclusion'),
  };
  const label = labels[sectionKey] || sectionKey;

  // Build inline progress UI inside the button
  let btnOrigHTML = '';
  let sectionEl = null;
  if (btn) {
    btnOrigHTML = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<div class="regen-progress-wrap"><div class="regen-progress-label">${t('uiRegenerating')} ${label}… <span class="regen-pct">0%</span></div><div class="regen-progress-bar"><div class="regen-progress-fill" style="width:0%"></div></div></div>`;
    // Dim the section body
    sectionEl = btn.closest('[class*="px-10"]') || btn.closest('div[class]');
    if (sectionEl) sectionEl.classList.add('section-regen-loading');
  }
  const progress = startFakeProgress(pct => {
    if (!btn) return;
    const fill = btn.querySelector('.regen-progress-fill');
    const pctEl = btn.querySelector('.regen-pct');
    if (fill) fill.style.width = pct + '%';
    if (pctEl) pctEl.textContent = pct + '%';
  });

  try {
    const prompt = `Este es el informe ejecutivo actual en JSON:\n\n${JSON.stringify(result, null, 2)}\n\nPor favor regenera ${idx !== undefined ? 'el ítem ' + idx + ' de ' : ''}la sección "${sectionKey}" con contenido fresco y de mayor calidad. Responde con el JSON completo actualizado precedido de __JSON_UPDATE__ en línea separada.`;
    const reply = await fetchFromWorker(
      wUrl,
      { userContent: '__CHAT_MODE__', chatMessages: [{ role: 'user', content: prompt }] },
      null
    );
    progress.complete();
    if (reply.includes('__JSON_UPDATE__')) {
      const parts = reply.split('__JSON_UPDATE__');
      const jsonPart = parts[1].replace(/```json|```/g, '').trim();
      const updated = parseModelJSON('report', jsonPart);
      if (
        idx !== undefined &&
        Array.isArray(updated[sectionKey]) &&
        updated[sectionKey][idx] !== undefined
      ) {
        result[sectionKey][idx] = updated[sectionKey][idx];
      } else if (updated[sectionKey] !== undefined) {
        result[sectionKey] = updated[sectionKey];
      } else {
        result = updated;
      }
    } else {
      throw new Error('El Worker no devolvió JSON actualizado');
    }
    setTimeout(() => {
      renderPreview(result);
      flash('✓ ' + label + ' regenerado');
    }, 300);
  } catch (e) {
    progress.cancel();
    showError('Error regenerando: ' + e.message);
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btnOrigHTML;
    }
    if (sectionEl) sectionEl.classList.remove('section-regen-loading');
  }
}

// ============================================================
// API CALL

// Init history on load
document.addEventListener('DOMContentLoaded', () => {
  updateUI();
  buildCalendar();
  switchNavTab('minutas');
  handleMagicLink();
});

// ============================================================
// MAGIC LINK HANDLER — WhatsApp email links (?wa=UUID&worker=...&format=...)
// ============================================================
async function handleMagicLink() {
  const params = new URLSearchParams(window.location.search);
  const uuid = params.get('wa');
  const format = params.get('format'); // pptx | pdf | docx | brief
  if (!uuid) return;

  // Clean URL so user doesn't accidentally share the magic link
  history.replaceState(null, '', window.location.pathname);

  showStatus('Cargando informe desde enlace…');
  try {
    const res = await fetch(`${WORKER_URL}/report/${uuid}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !data.title) throw new Error('Informe inválido o expirado');

    result = data;
    renderPreview(result);
    document.getElementById('validationWarn').classList.add('hidden');
    document.getElementById('output').classList.remove('hidden');
    document.getElementById('exportButtons').classList.remove('hidden');

    // Auto-trigger the requested download
    if (format === 'pptx') setTimeout(downloadPptx, 800);
    else if (format === 'pdf') setTimeout(downloadPdf, 800);
    else if (format === 'docx') setTimeout(downloadDocx, 800);
    else if (format === 'brief') setTimeout(downloadBrief, 800);

    showStatus(
      `Informe cargado${format ? ' — iniciando descarga ' + format.toUpperCase() + '…' : ''}`
    );
  } catch (e) {
    showStatus('Error cargando informe: ' + e.message, true);
  }
}


// ============================================================
// NAV SIDEBAR — Minutas / Informes tab switching
// ============================================================
function switchNavTab(tab) {
  const minutasPanel = document.getElementById('minutasPanel');
  const informesPanel = document.getElementById('informesPanel');
  const contrastePanel = document.getElementById('contrastePanel');
  const navMinutas = document.getElementById('navMinutas');
  const navInformes = document.getElementById('navInformes');
  const navContraste = document.getElementById('navContraste');
  const calSection = document.getElementById('sidebarCalendar');
  const histSection = document.getElementById('sidebarHistory');

  // Reset all nav buttons
  [navMinutas, navInformes, navContraste].forEach(btn => {
    if (btn) btn.classList.remove('active');
  });

  if (tab === 'minutas') {
    minutasPanel.style.display = 'block';
    informesPanel.style.display = 'none';
    contrastePanel.style.display = 'none';
    navMinutas.classList.add('active');
    calSection.style.display = 'block';
    histSection.style.display = 'none';
    renderMinutasList();
  } else if (tab === 'contraste') {
    minutasPanel.style.display = 'none';
    informesPanel.style.display = 'none';
    contrastePanel.style.display = 'block';
    if (navContraste) navContraste.classList.add('active');
    calSection.style.display = 'none';
    histSection.style.display = 'none';
    initContrasteForm();
    hideNuevoContrasteForm();
  } else {
    minutasPanel.style.display = 'none';
    informesPanel.style.display = 'block';
    contrastePanel.style.display = 'none';
    navInformes.classList.add('active');
    calSection.style.display = 'none';
    histSection.style.display = 'block';
    buildQuarterPlanner();
    hideNuevoInformeForm();
  }
}

// ============================================================
// CALENDAR — 3-month planner in sidebar
// ============================================================
let _calSelectedDate = '';

function buildCalendar() {
  const container = document.getElementById('sidebarCalendar');
  if (!container) return;
  const now = new Date();
  const months = [-1, 0, 1].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const monthNames = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ];
  const todayY = now.getFullYear(),
    todayM = now.getMonth(),
    todayD = now.getDate();

  // Build set of dates that have minutas (prefer cal_date for reliable matching)
  const minutasDates = new Set(loadMinutasHistory().map(m => m.cal_date || m.date || ''));

  let html = '';
  months.forEach(({ year, month }, idx) => {
    const isCurrent = year === todayY && month === todayM;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    html += `<div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:600;color:${isCurrent ? '#E74243' : 'rgba(255,255,255,0.9)'};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;padding:0 2px">${monthNames[month]} ${year}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">`;
    ['D', 'L', 'M', 'X', 'J', 'V', 'S'].forEach(d => {
      html += `<div style="font-size:9px;color:rgba(255,255,255,0.35);text-align:center;padding:2px 0;font-weight:500">${d}</div>`;
    });
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toLocaleDateString('es-CL');
      const isToday = isCurrent && d === todayD;
      const hasMinutas = minutasDates.has(dateStr);
      const isSelected = _calSelectedDate === dateStr;

      let bg = 'transparent',
        color = 'rgba(255,255,255,0.55)',
        fw = '400',
        border = 'none';
      if (isSelected) {
        bg = '#fff';
        color = '#1A3350';
        fw = '700';
      } else if (isToday) {
        bg = '#E74243';
        color = '#fff';
        fw = '600';
      } else if (hasMinutas) {
        color = '#fff';
        fw = '600';
      }

      const dot =
        hasMinutas && !isSelected && !isToday
          ? `<div style="width:3px;height:3px;border-radius:50%;background:#E74243;margin:0 auto;margin-top:1px"></div>`
          : '';

      html += `<div onclick="filterMinutasByDate('${dateStr}')" style="font-size:10px;text-align:center;padding:3px 1px;border-radius:50%;background:${bg};color:${color};font-weight:${fw};cursor:pointer;transition:background .15s" title="${dateStr}">${d}${dot}</div>`;
    }
    html += `</div></div>`;
    if (idx < 2)
      html += `<div style="height:1px;background:rgba(255,255,255,0.08);margin:4px 0 12px"></div>`;
  });

  // Active filter banner
  if (_calSelectedDate) {
    html += `<div style="margin-top:8px;padding:6px 10px;background:rgba(187,0,20,0.15);border-left:2px solid #E74243;display:flex;justify-content:space-between;align-items:center">
      <span style="font-family:Inter,sans-serif;font-size:10px;color:#fff;opacity:.8">${_calSelectedDate}</span>
      <button onclick="clearCalendarFilter()" style="background:none;border:none;color:rgba(255,255,255,0.6);font-size:12px;cursor:pointer;padding:0 2px" title="Quitar filtro">✕</button>
    </div>`;
  }

  container.innerHTML = html;
}

function filterMinutasByDate(dateStr) {
  // Toggle: click same date again to clear
  if (_calSelectedDate === dateStr) {
    clearCalendarFilter();
    return;
  }
  _calSelectedDate = dateStr;
  _minutasFilter = dateStr;
  renderMinutasList();
  buildCalendar();
  // Scroll minutas list into view on mobile
  const el = document.getElementById('minutasList');
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function clearCalendarFilter() {
  _calSelectedDate = '';
  _minutasFilter = '';
  renderMinutasList();
  buildCalendar();
}

