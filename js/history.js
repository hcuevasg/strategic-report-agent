// ============================================================
// HISTORY — Informes localStorage persistence, dashboard grid,
//           sidebar history list, quarter planner.
// Depends on: state.js (result, HISTORY_KEY, currentHistoryId, etc.)
//             ui-helpers.js (showStatus, showExportBtns, hidePreview, t)
// ============================================================

// ============================================================
// ============================================================
// HISTORIAL DE INFORMES — localStorage (últimos 5)
// ============================================================

function saveToHistory(r) {
  try {
    const history = loadHistory();
    const entry = {
      id: Date.now(),
      title: r.title || 'Sin título',
      subtitle: r.subtitle || '',
      date: new Date().toLocaleDateString('es-CL', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      data: JSON.stringify(r),
    };
    history.unshift(entry);
    const trimmed = history.slice(0, MAX_HISTORY_ENTRIES);
    writeStorageJSON(HISTORY_KEY, trimmed);
    currentHistoryId = entry.id;
    renderHistory();
    renderInformesDashboard();
  } catch (e) {
    console.warn('History save error:', e);
  }
}

function loadHistory() {
  return readStorageJSON(HISTORY_KEY, []);
}

function loadFromHistory(id) {
  const history = loadHistory();
  const entry = history.find(h => h.id === id);
  if (!entry) return;
  showNuevoInformeForm();
  // Viewing a saved report — hide the new-report input form
  const inputCard = document.getElementById('newReportInputCard');
  if (inputCard) inputCard.style.display = 'none';
  try {
    result = parseModelJSON('report', entry.data);
    originalResult = cloneData(result);
    currentHistoryId = id;
    if (result.language && i18n[result.language]) currentLang = result.language;
    else currentLang = 'es';
    renderPreview(result);
    showExportBtns();
    showStatus(t('reportLoaded') + ' — ' + entry.title);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    showError('Error al cargar historial');
  }
}

// ============================================================
// INFORMES DASHBOARD — grid view of saved reports
// ============================================================
const INFORME_TYPE_I18N_KEYS = {
  strategic: 'uiStrategic',
  financial: 'uiFinancial',
  operational: 'uiOperational',
  risk: 'uiRisks',
  competitive: 'uiCompetitive',
  due_diligence: 'uiDueDiligence',
  general: 'uiGeneral',
};
function getInformeTypeLabel(type) {
  return t(INFORME_TYPE_I18N_KEYS[type] || 'uiGeneral');
}
const INFORME_TYPE_COLORS = {
  strategic: { bg: '#FEE2E2', text: '#991B1B' },
  financial: { bg: '#FEF3C7', text: '#92400E' },
  operational: { bg: '#DBEAFE', text: '#1E40AF' },
  risk: { bg: '#FDE68A', text: '#78350F' },
  competitive: { bg: '#D1FAE5', text: '#065F46' },
  due_diligence: { bg: '#EDE9FE', text: '#4C1D95' },
  general: { bg: '#F3F4F6', text: '#374151' },
};

function renderInformesDashboard() {
  const grid = document.getElementById('informesGrid');
  const empty = document.getElementById('informesEmpty');
  if (!grid) return;
  const history = loadHistory();
  if (!history.length) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    if (empty) empty.classList.remove('hidden');
    return;
  }
  grid.style.display = '';
  if (empty) empty.classList.add('hidden');
  grid.innerHTML = history
    .map(h => {
      let r = null;
      try {
        r = parseModelJSON('report', h.data);
      } catch (e) {
        console.warn('History entry parse error:', e.message);
      }
      const type = r?.type || 'general';
      const colors = INFORME_TYPE_COLORS[type] || INFORME_TYPE_COLORS.general;
      const label = getInformeTypeLabel(type);
      const subtitle = h.subtitle || r?.subtitle || '';
      const sections = r
        ? ['findings', 'recommendations', 'risks', 'opportunities', 'analysis'].filter(
            k => Array.isArray(r[k]) && r[k].length
          ).length
        : 0;
      return `<div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #f0f0f0;transition:all .2s;cursor:default"
         onmouseover="this.style.boxShadow='0 8px 32px rgba(4,22,39,0.08)';this.style.borderColor='rgba(196,198,205,0.5)'"
         onmouseout="this.style.boxShadow='';this.style.borderColor='#f0f0f0'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div style="flex:1;min-width:0">
          <span style="display:inline-block;padding:2px 10px;border-radius:20px;background:${colors.bg};color:${colors.text};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">${label}</span>
          <h3 style="font-family:Manrope,sans-serif;font-size:17px;font-weight:800;color:#1A3350;line-height:1.3;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(h.title)}</h3>
        </div>
        <span style="padding:4px 12px;border-radius:20px;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;white-space:nowrap;margin-left:12px;flex-shrink:0">${t('uiSaved')}</span>
      </div>
      ${
        subtitle
          ? `<p style="font-family:Inter,sans-serif;font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(subtitle)}</p>`
          : `<p style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;line-height:1.5;margin:0 0 20px;font-style:italic">${t('uiNoDescription')}</p>`
      }
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#6b7280;background:#F2F4F6;padding:4px 8px;border-radius:4px">
            <span class="material-symbols-outlined" style="font-size:12px">calendar_today</span>${esc(h.date)}
          </span>
          ${
            sections > 0
              ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#6b7280;background:#F2F4F6;padding:4px 8px;border-radius:4px">
            <span class="material-symbols-outlined" style="font-size:12px">layers</span>${sections} ${t('uiSections')}
          </span>`
              : ''
          }
        </div>
        <button onclick="openInformeFromGrid(${h.id})" style="display:flex;align-items:center;gap:4px;padding:6px 14px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#374151;cursor:pointer;transition:all .15s"
                onmouseover="this.style.background='#1A3350';this.style.color='#fff';this.style.borderColor='#1A3350'"
                onmouseout="this.style.background='#fff';this.style.color='#374151';this.style.borderColor='#e5e7eb'">
          <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>${t('uiView')}
        </button>
      </div>
    </div>`;
    })
    .join('');
}

function openInformeFromGrid(id) {
  showNuevoInformeForm();
  loadFromHistory(id);
}

function showNuevoInformeForm() {
  const dash = document.getElementById('informesDashboard');
  const form = document.getElementById('informesNewSection');
  if (dash) dash.style.display = 'none';
  if (form) form.style.display = 'block';
  const inputCard = document.getElementById('newReportInputCard');
  if (inputCard) inputCard.style.display = '';
}

function nuevoInforme() {
  // Reset all form state before showing clean form
  result = null;
  originalResult = null;
  hidePreview();
  ['btnDocx', 'btnPdf', 'btnPptx', 'btnBrief'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const statusMsg = document.getElementById('statusMsg');
  if (statusMsg) statusMsg.classList.add('hidden');
  const errorBox = document.getElementById('errorBox');
  if (errorBox) errorBox.classList.add('hidden');
  const validationWarn = document.getElementById('validationWarn');
  if (validationWarn) validationWarn.classList.add('hidden');
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) chatMessages.innerHTML = '';
  // Hide floating AI panel
  const floatBtn = document.getElementById('aiFloatBtn');
  const floatPanel = document.getElementById('aiFloatPanel');
  if (floatBtn) floatBtn.style.display = 'none';
  if (floatPanel) {
    floatPanel.classList.remove('open');
    floatPanel.style.display = 'none';
  }
  if (typeof _aiPanelOpen !== 'undefined') window._aiPanelOpen = false;
  showNuevoInformeForm();
}

function hideNuevoInformeForm() {
  const dash = document.getElementById('informesDashboard');
  const form = document.getElementById('informesNewSection');
  if (dash) dash.style.display = 'block';
  if (form) form.style.display = 'none';
  renderInformesDashboard();
}

// ============================================================
// QUARTER PLANNER — sidebar widget for Informes tab
// ============================================================
function buildQuarterPlanner() {
  const container = document.getElementById('sidebarPlanner');
  if (!container) return;
  const now = new Date();
  const month = now.getMonth();
  const qStart = Math.floor(month / 3) * 3;
  const qNum = Math.floor(month / 3) + 1;
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
  // Count reports per month using entry id (timestamp)
  const history = loadHistory();
  const byMonth = {};
  history.forEach(h => {
    const m = new Date(h.id).getMonth();
    byMonth[m] = (byMonth[m] || 0) + 1;
  });
  const rows = [qStart, qStart + 1, qStart + 2]
    .map(m => {
      const isActive = m === month;
      const count = byMonth[m] || 0;
      const dots =
        count === 0
          ? `<div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>`
          : `<div style="width:6px;height:6px;border-radius:50%;background:#E74243"></div>${count > 1 ? `<div style="width:6px;height:6px;border-radius:50%;background:#4174B9"></div>` : '<div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>'}`;
      return `<div style="display:flex;align-items:center;justify-content:space-between">
      <span style="font-family:Inter,sans-serif;font-size:12px;font-weight:${isActive ? '600' : '400'};color:${isActive ? '#fff' : 'rgba(255,255,255,0.55)'}">${monthNames[m]}</span>
      <div style="display:flex;gap:4px">${dots}</div>
    </div>`;
    })
    .join('');
  container.innerHTML = `
    <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:14px 12px">
      <div style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.12em;margin-bottom:14px">Planificador Q${qNum}</div>
      <div style="display:flex;flex-direction:column;gap:12px">${rows}</div>
    </div>`;
}

function autoSaveEdit() {
  if (!result || !currentHistoryId) return;
  clearTimeout(_autoSaveTimer);
  _autoSaveTimer = setTimeout(() => {
    try {
      const h = loadHistory();
      const idx = h.findIndex(e => e.id === currentHistoryId);
      if (idx >= 0) {
        h[idx].data = JSON.stringify(result);
        h[idx].title = result.title || 'Sin título';
        writeStorageJSON(HISTORY_KEY, h);
        renderHistory();
      }
    } catch (e) {
      console.warn('Auto-save error:', e.message);
    }
  }, AUTOSAVE_DEBOUNCE_MS);
}

// ============================================================
// Update renderHistory for dark sidebar
// ============================================================
function renderHistoryItems(items) {
  const list = document.getElementById('historyList');
  if (!list) return;
  if (!items.length) {
    list.innerHTML = `<p style="font-family:Inter,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);padding:12px 16px;font-style:italic">${t('uiNoResults')}</p>`;
    return;
  }
  list.innerHTML = items
    .map(
      h => `
    <button onclick="loadFromHistory(${h.id})" style="display:block;width:100%;text-align:left;padding:10px 14px;background:transparent;border:none;border-radius:6px;cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
      <div style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${h.title}</div>
      <div style="font-family:Inter,sans-serif;font-size:9px;color:rgba(255,255,255,0.35);margin-top:3px">${h.date}</div>
    </button>
  `
    )
    .join('');
}

function renderHistory() {
  const list = document.getElementById('historyList');
  if (!list) return;
  const history = loadHistory();
  const searchWrap = document.getElementById('historySearchWrap');
  if (!history.length) {
    list.innerHTML = `<p style="font-family:Inter,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);padding:12px 16px;font-style:italic">${t('uiNoReports')}</p>`;
    if (searchWrap) searchWrap.style.display = 'none';
    return;
  }
  if (searchWrap) searchWrap.style.display = 'block';
  const q = (document.getElementById('historySearch')?.value || '').toLowerCase();
  renderHistoryItems(q ? history.filter(h => h.title.toLowerCase().includes(q)) : history);
}

function filterHistory(q) {
  const history = loadHistory();
  renderHistoryItems(
    q ? history.filter(h => h.title.toLowerCase().includes(q.toLowerCase())) : history
  );
}
