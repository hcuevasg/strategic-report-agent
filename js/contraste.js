// ============================================================
// CONTRASTE MULTIFUENTE MODULE
// Depends on: state.js, ui-helpers.js (esc, t, flash),
//             fetchFromWorker (app.js until api.js extracted)
// ============================================================

// ============================================================
// CONTRASTE MULTIFUENTE MODULE
// ============================================================

let _cmPuntos = ['', '', ''];
let _cmFuentes = [
  { nombre: '', rol: '', unidad: '', tipo: 'área', notas: '' },
  { nombre: '', rol: '', unidad: '', tipo: 'área', notas: '' },
];
let _cmTipoContraste = 'operativo_legal';
let _cmSensibilidad = 'uso_interno';
let _cmTono = 'ejecutivo_prudente';
let _cmProfundidad = 'estandar';
let _contrasteResult = null;
let _contrasteInited = false;

const CM_PLACEHOLDER_TOKENS = [
  'test',
  'tbd',
  'lorem',
  'ipsum',
  'xxx',
  'n/a',
  'na',
  'pendiente',
  'por definir',
  'por completar',
  'por llenar',
  'dummy',
  'sample',
];

function normalizeCmText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hasCmPlaceholder(value) {
  const text = normalizeCmText(value);
  if (!text) return false;
  if (/^x{3,}$/i.test(text.replace(/\s+/g, ''))) return true;
  return CM_PLACEHOLDER_TOKENS.some(token => text === token);
}

function isMeaningfulCmText(value, minLength = 20) {
  const raw = String(value || '').trim();
  if (raw.length < minLength) return false;
  if (hasCmPlaceholder(raw)) return false;
  const words = raw.split(/\s+/).filter(Boolean);
  return words.length >= 4;
}

function isMeaningfulCmPoint(value) {
  const raw = String(value || '').trim();
  if (raw.length < 3) return false;
  if (hasCmPlaceholder(raw)) return false;
  const alnumCount = (raw.match(/[A-Za-z0-9ÁÉÍÓÚáéíóúÑñ]/g) || []).length;
  return alnumCount >= 3;
}

function getCmTextIssue(value, minLength = 20) {
  const raw = String(value || '').trim();
  if (!raw) return 'esta vacio';
  if (raw.length < minLength) return `es demasiado breve (${raw.length}/${minLength})`;
  if (hasCmPlaceholder(raw)) return 'parece un placeholder';
  const words = raw.split(/\s+/).filter(Boolean);
  if (words.length < 4) return 'necesita mas detalle';
  return '';
}

function getContrasteInputIssue() {
  const objetivo = (document.getElementById('cmObjetivo')?.value || '').trim();
  const puntos = _cmPuntos.map(p => p.trim()).filter(Boolean);
  const fuentes = _cmFuentes.filter(f => f.nombre.trim() || f.notas.trim());
  const fuentesConNotas = fuentes.filter(f => isMeaningfulCmText(f.notas, 40));

  if (!isMeaningfulCmText(objetivo, 24)) {
    return `Completa un objetivo claro y sustantivo antes de generar el contraste. El objetivo ${getCmTextIssue(objetivo, 24)}.`;
  }
  if (!puntos.length) {
    return 'Agrega al menos un punto a contrastar.';
  }
  if (puntos.some(p => !isMeaningfulCmPoint(p))) {
    return 'Cada punto a contrastar debe describir un tema real; evita placeholders o textos vacios.';
  }
  if (fuentes.length < 2) {
    return 'Agrega al menos dos fuentes para realizar un contraste multifuente.';
  }
  if (fuentesConNotas.length < 2) {
    return 'Incluye notas sustantivas en al menos dos fuentes; evita marcadores como TEST o pendientes.';
  }
  return null;
}

function initContrasteForm() {
  if (_contrasteInited) return;
  _contrasteInited = true;
  renderCmPuntos();
  renderCmFuentes();
}

function formatCmTokenLabel(value) {
  return String(value || '')
    .split('_')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function setContrasteChipSelection(containerId, attrName, value) {
  document.querySelectorAll(`#${containerId} .rtype-chip`).forEach(node => {
    node.classList.toggle('active', node.dataset[attrName] === value);
  });
}

function resetContrasteForm() {
  [
    'cmSponsor',
    'cmFecha',
    'cmAnalista',
    'cmPais',
    'cmObjetivo',
    'cmNotasInsumo',
    'cmFechaLevantamiento',
    'cmUnidad',
    'cmObservaciones',
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  _cmPuntos = ['', '', ''];
  _cmFuentes = [
    { nombre: '', rol: '', unidad: '', tipo: 'área', notas: '' },
    { nombre: '', rol: '', unidad: '', tipo: 'área', notas: '' },
  ];
  _cmTipoContraste = 'operativo_legal';
  _cmSensibilidad = 'uso_interno';
  _cmTono = 'ejecutivo_prudente';
  _cmProfundidad = 'estandar';
  _contrasteResult = null;
  currentContrastHistoryId = null;
  renderCmPuntos();
  renderCmFuentes();
  setContrasteChipSelection('cmTipoChips', 'tipo', _cmTipoContraste);
  setContrasteChipSelection('cmSensibilidadChips', 'sens', _cmSensibilidad);
  setContrasteChipSelection('cmTonoChips', 'tono', _cmTono);
  setContrasteChipSelection('cmProfundidadChips', 'prof', _cmProfundidad);
  const errorEl = document.getElementById('contrasteError');
  const progressEl = document.getElementById('contrasteProgress');
  if (errorEl) errorEl.style.display = 'none';
  if (progressEl) progressEl.style.display = 'none';
}

function getContrasteFormMetadata() {
  return {
    sponsor: (document.getElementById('cmSponsor')?.value || '').trim(),
    report_date: (document.getElementById('cmFecha')?.value || '').trim(),
    fieldwork_lead: (document.getElementById('cmAnalista')?.value || '').trim(),
    country: (document.getElementById('cmPais')?.value || '').trim(),
    objective: (document.getElementById('cmObjetivo')?.value || '').trim(),
    main_input_notes: (document.getElementById('cmNotasInsumo')?.value || '').trim(),
    fieldwork_date: (document.getElementById('cmFechaLevantamiento')?.value || '').trim(),
    business_unit: (document.getElementById('cmUnidad')?.value || '').trim(),
    analyst_notes: (document.getElementById('cmObservaciones')?.value || '').trim(),
    contrast_type: _cmTipoContraste,
    sensitivity: _cmSensibilidad,
    tone: _cmTono,
    depth: _cmProfundidad,
  };
}

function getContrasteSourcesFromForm() {
  return _cmFuentes
    .filter(f => f.nombre.trim() || f.notas.trim())
    .map(f => ({
      name: (f.nombre || '').trim(),
      role: (f.rol || '').trim(),
      unit: (f.unidad || '').trim(),
      type: (f.tipo || '').trim(),
      notes: (f.notas || '').trim(),
    }));
}

function normalizeContrasteResult(payload, useFormMetadata = true) {
  const formMetadata = useFormMetadata ? getContrasteFormMetadata() : {};
  const metadata = { ...formMetadata, ...(payload.metadata || {}) };
  if (useFormMetadata) {
    Object.entries(formMetadata).forEach(([key, value]) => {
      if (value) metadata[key] = value;
    });
  }
  const hydrated = {
    ...payload,
    subtitle: payload.subtitle || 'Informe Ejecutivo de Contraste Multifuente',
    sponsor: payload.sponsor || metadata.sponsor,
    scope: payload.scope || metadata.objective,
    metadata,
  };

  const formSources = useFormMetadata ? getContrasteSourcesFromForm() : [];
  if (!Array.isArray(hydrated.sources_map) || hydrated.sources_map.length < 2) {
    hydrated.sources_map = formSources.map(source => ({
      name: source.name || 'Fuente sin nombre',
      role: source.role,
      unit: source.unit,
      type: source.type,
      notes: source.notes,
    }));
  } else if (formSources.length) {
    hydrated.sources_map = hydrated.sources_map.map((source, index) => ({
      ...source,
      notes: source.notes || formSources[index]?.notes || '',
    }));
  }

  hydrated.analysis_by_point = Array.isArray(hydrated.analysis_by_point)
    ? hydrated.analysis_by_point
    : [];
  hydrated.comparison_matrix = Array.isArray(hydrated.comparison_matrix)
    ? hydrated.comparison_matrix
    : [];
  hydrated.key_messages = Array.isArray(hydrated.key_messages) ? hydrated.key_messages : [];
  hydrated.transversal_findings = Array.isArray(hydrated.transversal_findings)
    ? hydrated.transversal_findings
    : [];
  hydrated.risks = Array.isArray(hydrated.risks) ? hydrated.risks : [];
  hydrated.opportunities = Array.isArray(hydrated.opportunities) ? hydrated.opportunities : [];
  hydrated.recommendations = hydrated.recommendations || {
    immediate: [],
    short_term: [],
    structural: [],
  };

  return hydrated;
}

function saveContrasteToHistory(r) {
  try {
    const history = readStorageJSON(CONTRASTE_HISTORY_KEY, []);
    const meta = r.metadata || {};
    const entry = {
      id: Date.now(),
      title: r.title || 'Sin título',
      subtitle: r.subtitle || '',
      sponsor: r.sponsor || meta.sponsor || '',
      contrast_type: meta.contrast_type || '',
      report_date:
        meta.report_date ||
        new Date().toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }),
      data: JSON.stringify(r),
    };
    history.unshift(entry);
    writeStorageJSON(CONTRASTE_HISTORY_KEY, history.slice(0, 12));
    currentContrastHistoryId = entry.id;
    renderContrastesDashboard();
  } catch (err) {
    console.warn('Contrast history save error:', err);
  }
}

function loadContrastesHistory() {
  return readStorageJSON(CONTRASTE_HISTORY_KEY, []);
}

function renderContrastesDashboard() {
  const grid = document.getElementById('contrastesGrid');
  const empty = document.getElementById('contrastesEmpty');
  if (!grid) return;
  const history = loadContrastesHistory();
  if (!history.length) {
    grid.innerHTML = '';
    grid.style.display = 'none';
    if (empty) empty.style.display = 'block';
    return;
  }
  if (empty) empty.style.display = 'none';
  grid.style.display = 'grid';
  grid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(280px, 1fr))';
  grid.style.gap = '18px';
  grid.innerHTML = history
    .map(item => {
      const typeLabel = formatCmTokenLabel(item.contrast_type || 'contraste');
      return `<div style="background:#fff;border:1px solid #edf0f2;padding:24px;box-shadow:0 8px 32px rgba(4,22,39,0.05)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
          <span style="display:inline-block;padding:3px 10px;background:#EEF4FF;color:#4279B0;font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em">${esc(typeLabel)}</span>
          <span style="font-family:Inter,sans-serif;font-size:11px;color:#74777D">${esc(item.report_date || '')}</span>
        </div>
        <h3 style="font-family:Manrope,sans-serif;font-size:18px;font-weight:800;color:#1A3350;line-height:1.3;margin:0 0 10px">${esc(item.title)}</h3>
        <p style="font-family:Inter,sans-serif;font-size:13px;color:#676766;line-height:1.5;margin:0 0 16px">${esc(item.subtitle || 'Informe Ejecutivo de Contraste Multifuente')}</p>
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:14px;border-top:1px solid #EEF1F4">
          <span style="font-family:Inter,sans-serif;font-size:12px;color:#1A3350;font-weight:600">${esc(item.sponsor || 'Sin sponsor')}</span>
          <button type="button" onclick="loadContrasteFromHistory(${item.id})" style="display:flex;align-items:center;gap:4px;padding:8px 12px;border:1px solid #d9dee3;background:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:700;color:#374151;cursor:pointer">
            <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>Abrir
          </button>
        </div>
      </div>`;
    })
    .join('');
}

function hideNuevoContrasteForm() {
  const dashboard = document.getElementById('contrasteDashboard');
  const form = document.getElementById('contrasteFormSection');
  const preview = document.getElementById('contrastePreviewSection');
  if (dashboard) dashboard.style.display = 'block';
  if (form) form.style.display = 'none';
  if (preview) preview.style.display = 'none';
  renderContrastesDashboard();
}

function showNuevoContrasteForm() {
  const dashboard = document.getElementById('contrasteDashboard');
  const form = document.getElementById('contrasteFormSection');
  const preview = document.getElementById('contrastePreviewSection');
  if (dashboard) dashboard.style.display = 'none';
  if (preview) preview.style.display = 'none';
  if (form) form.style.display = 'block';
}

function nuevoContraste() {
  resetContrasteForm();
  showNuevoContrasteForm();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function loadContrasteFromHistory(id) {
  const entry = loadContrastesHistory().find(item => item.id === id);
  if (!entry) return;
  try {
    _contrasteResult = parseModelJSON('contraste', entry.data);
    _contrasteResult = normalizeContrasteResult(_contrasteResult, false);
    result = _contrasteResult;
    currentContrastHistoryId = id;
    const dashboard = document.getElementById('contrasteDashboard');
    const form = document.getElementById('contrasteFormSection');
    const preview = document.getElementById('contrastePreviewSection');
    if (dashboard) dashboard.style.display = 'none';
    if (form) form.style.display = 'none';
    if (preview) preview.style.display = 'block';
    renderContrastePreview(_contrasteResult);
    showContrasteStatus('Contraste cargado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    showContrasteStatus('Error al cargar historial');
  }
}

// ── Chip selectors ────────────────────────────────────────────
function setCmTipo(el) {
  document.querySelectorAll('#cmTipoChips .rtype-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmTipoContraste = el.dataset.tipo;
}
function setCmSensibilidad(el) {
  document
    .querySelectorAll('#cmSensibilidadChips .rtype-chip')
    .forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmSensibilidad = el.dataset.sens;
}
function setCmTono(el) {
  document.querySelectorAll('#cmTonoChips .rtype-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmTono = el.dataset.tono;
}
function setCmProfundidad(el) {
  document
    .querySelectorAll('#cmProfundidadChips .rtype-chip')
    .forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmProfundidad = el.dataset.prof;
}

// ── Dynamic puntos list ───────────────────────────────────────
function renderCmPuntos() {
  const container = document.getElementById('cmPuntosList');
  if (!container) return;
  let h = '';
  _cmPuntos.forEach((p, i) => {
    h += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <div style="width:22px;height:22px;background:#1A3350;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <span style="font-family:Manrope,sans-serif;font-size:10px;font-weight:800;color:#fff">${i + 1}</span>
      </div>
      <input type="text" value="${esc(p)}" oninput="updateCmPunto(${i},this.value)" placeholder="Ej: Clústeres, ROI, Discovery..."
        style="flex:1;background:#F8F9FB;border:none;border-bottom:1px solid #BFC4C5;padding:8px 12px;font-family:Inter,sans-serif;font-size:13px;color:#191C1E;outline:none">
      ${
        _cmPuntos.length > 1
          ? `<button type="button" onclick="removeCmPunto(${i})" style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center" title="Eliminar">
             <span class="material-symbols-outlined" style="font-size:16px">close</span>
           </button>`
          : ''
      }
    </div>`;
  });
  container.innerHTML = h;
}
function updateCmPunto(i, val) {
  _cmPuntos[i] = val;
}
function addCmPunto() {
  _cmPuntos.push('');
  renderCmPuntos();
}
function removeCmPunto(i) {
  _cmPuntos.splice(i, 1);
  renderCmPuntos();
}

// ── Dynamic fuentes list ──────────────────────────────────────
function renderCmFuentes() {
  const container = document.getElementById('cmFuentesList');
  if (!container) return;
  const inputStyle =
    'width:100%;background:#fff;border:none;border-bottom:1px solid #BFC4C5;padding:7px 10px;font-family:Inter,sans-serif;font-size:12px;color:#191C1E;outline:none';
  const labelStyle =
    'font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#1A3350;font-weight:700;display:block;margin-bottom:5px';
  let h = '';
  _cmFuentes.forEach((f, i) => {
    h += `<div style="background:#F8F9FB;padding:16px 18px;margin-bottom:12px;border-left:3px solid #4279B0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-family:Manrope,sans-serif;font-size:11px;font-weight:700;color:#1A3350">Fuente ${i + 1}</span>
        ${
          _cmFuentes.length > 1
            ? `<button type="button" onclick="removeCmFuente(${i})" style="background:none;border:none;cursor:pointer;color:#9ca3af;display:flex;align-items:center;gap:4px;font-family:Inter,sans-serif;font-size:10px">
               <span class="material-symbols-outlined" style="font-size:14px">close</span>Eliminar
             </button>`
            : ''
        }
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <label style="${labelStyle}">Nombre</label>
          <input type="text" value="${esc(f.nombre)}" oninput="updateCmFuente(${i},'nombre',this.value)" placeholder="Ej: María José Matus" style="${inputStyle}">
        </div>
        <div>
          <label style="${labelStyle}">Rol / Cargo</label>
          <input type="text" value="${esc(f.rol)}" oninput="updateCmFuente(${i},'rol',this.value)" placeholder="Ej: Jefa de Operaciones" style="${inputStyle}">
        </div>
        <div>
          <label style="${labelStyle}">País / Unidad</label>
          <input type="text" value="${esc(f.unidad)}" oninput="updateCmFuente(${i},'unidad',this.value)" placeholder="Ej: Colombia" style="${inputStyle}">
        </div>
        <div>
          <label style="${labelStyle}">Tipo de Fuente</label>
          <select oninput="updateCmFuente(${i},'tipo',this.value)" style="${inputStyle};appearance:auto">
            <option value="área"${f.tipo === 'área' ? ' selected' : ''}>Área</option>
            <option value="país"${f.tipo === 'país' ? ' selected' : ''}>País</option>
            <option value="persona"${f.tipo === 'persona' ? ' selected' : ''}>Persona</option>
            <option value="rol_funcional"${f.tipo === 'rol_funcional' ? ' selected' : ''}>Rol funcional</option>
            <option value="fuente_técnica"${f.tipo === 'fuente_técnica' ? ' selected' : ''}>Fuente técnica</option>
            <option value="otra"${f.tipo === 'otra' ? ' selected' : ''}>Otra</option>
          </select>
        </div>
      </div>
      <div>
        <label style="${labelStyle}">Notas / Insumo de esta fuente</label>
        <textarea oninput="updateCmFuente(${i},'notas',this.value)" rows="4" placeholder="Pega aquí la posición, notas o insumo de esta fuente..." style="width:100%;background:#fff;border:none;border-bottom:1px solid #BFC4C5;padding:8px 10px;font-family:Inter,sans-serif;font-size:12px;color:#191C1E;resize:vertical;outline:none">${esc(f.notas)}</textarea>
      </div>
    </div>`;
  });
  container.innerHTML = h;
}
function updateCmFuente(i, field, val) {
  _cmFuentes[i][field] = val;
}
function addCmFuente() {
  _cmFuentes.push({ nombre: '', rol: '', unidad: '', tipo: 'área', notas: '' });
  renderCmFuentes();
}
function removeCmFuente(i) {
  _cmFuentes.splice(i, 1);
  renderCmFuentes();
}

// ── Build structured text input ───────────────────────────────
function buildContrasteInput() {
  const sponsor = (document.getElementById('cmSponsor')?.value || '').trim();
  const fecha = (document.getElementById('cmFecha')?.value || '').trim();
  const analista = (document.getElementById('cmAnalista')?.value || '').trim();
  const pais = (document.getElementById('cmPais')?.value || '').trim();
  const objetivo = (document.getElementById('cmObjetivo')?.value || '').trim();
  const notasInsumo = (document.getElementById('cmNotasInsumo')?.value || '').trim();
  const fechaLevantamiento = (document.getElementById('cmFechaLevantamiento')?.value || '').trim();
  const unidad = (document.getElementById('cmUnidad')?.value || '').trim();
  const observaciones = (document.getElementById('cmObservaciones')?.value || '').trim();
  const puntos = _cmPuntos.filter(p => p.trim());
  const fuentes = _cmFuentes.filter(f => f.nombre.trim() || f.notas.trim());

  let text = 'INFORME DE CONTRASTE MULTIFUENTE\n' + '─'.repeat(48) + '\n\n';
  text += 'METADATOS\n';
  if (sponsor) text += `Solicitante / Sponsor: ${sponsor}\n`;
  if (fecha) text += `Fecha del informe: ${fecha}\n`;
  if (analista) text += `Responsable del levantamiento: ${analista}\n`;
  if (pais) text += `País / Geografía: ${pais}\n`;
  text += `Tipo de contraste: ${_cmTipoContraste.replace(/_/g, ' ')}\n`;
  if (fechaLevantamiento) text += `Fecha del levantamiento: ${fechaLevantamiento}\n`;
  if (unidad) text += `Unidad / Gerencia / Área: ${unidad}\n`;
  text += `Nivel de sensibilidad: ${_cmSensibilidad.replace(/_/g, ' ')}\n`;
  text += '\n';
  if (objetivo) {
    text += `OBJETIVO DEL INFORME\n${objetivo}\n\n`;
  }
  if (notasInsumo) {
    text += `NOTAS O INSUMO PRINCIPAL\n${notasInsumo}\n\n`;
  }
  if (puntos.length) {
    text += 'PUNTOS A CONTRASTAR\n';
    puntos.forEach((p, i) => {
      text += `${i + 1}. ${p}\n`;
    });
    text += '\n';
  }
  if (fuentes.length) {
    text += 'FUENTES CONTRASTADAS\n';
    fuentes.forEach((f, i) => {
      text += `\nFuente ${i + 1}:\n`;
      if (f.nombre) text += `  Nombre: ${f.nombre}\n`;
      if (f.rol) text += `  Rol / Cargo: ${f.rol}\n`;
      if (f.unidad) text += `  País / Unidad: ${f.unidad}\n`;
      if (f.tipo) text += `  Tipo: ${f.tipo}\n`;
      if (f.notas) text += `  Notas por fuente:\n  ${f.notas.replace(/\n/g, '  \n')}\n`;
    });
    text += '\n';
  }
  if (observaciones) {
    text += `OBSERVACIONES DEL ANALISTA\n${observaciones}\n\n`;
  }
  text += `TONO DEL INFORME: ${_cmTono.replace(/_/g, ' ')}\n`;
  text += `NIVEL DE PROFUNDIDAD: ${_cmProfundidad.replace(/_/g, ' ')}\n`;
  return text;
}

// ── Submit ────────────────────────────────────────────────────
async function submitContraste() {
  const contrasteErrEl = document.getElementById('contrasteError');
  const inputIssue = getContrasteInputIssue();
  if (inputIssue) {
    contrasteErrEl.textContent = inputIssue;
    contrasteErrEl.style.display = 'block';
    return;
  }
  contrasteErrEl.style.display = 'none';

  const btn = document.getElementById('btnSubmitContraste');
  const prog = document.getElementById('contrasteProgress');
  const fill = document.getElementById('contrasteProgressFill');
  const label = document.getElementById('contrasteProgressLabel');
  btn.disabled = true;
  btn.style.opacity = '0.6';
  prog.style.display = 'block';
  fill.style.width = '5%';
  label.textContent = t('uiContrasteProgressThinking') || 'Analizando fuentes y puntos críticos...';

  try {
    let chunks = 0;
    const input = buildContrasteInput();
    const txt = await fetchFromWorker(
      WORKER_URL,
      {
        userContent: input,
        reportType: 'multisource_contrast',
        outputLanguage,
      },
      (full, chunk) => {
        chunks++;
        const pct = Math.min(93, 12 + chunks * 3);
        fill.style.width = pct + '%';
      },
      phase => {
        if (phase === 'thinking') {
          label.textContent =
            t('uiContrasteProgressThinking') || 'Analizando fuentes y puntos críticos...';
          fill.style.width = '8%';
        } else if (phase === 'writing') {
          label.textContent =
            t('uiContrasteProgressWriting') || 'Elaborando contraste ejecutivo...';
          fill.style.width = '15%';
        }
      }
    );

    _contrasteResult = parseModelJSON('contraste', txt);
    _contrasteResult = normalizeContrasteResult(_contrasteResult, true);
    result = _contrasteResult; // share with export functions
    saveContrasteToHistory(_contrasteResult);

    fill.style.width = '100%';
    setTimeout(() => {
      prog.style.display = 'none';
      btn.disabled = false;
      btn.style.opacity = '1';
      document.getElementById('contrasteDashboard').style.display = 'none';
      document.getElementById('contrasteFormSection').style.display = 'none';
      renderContrastePreview(_contrasteResult);
      document.getElementById('contrastePreviewSection').style.display = 'block';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 400);
  } catch (err) {
    prog.style.display = 'none';
    btn.disabled = false;
    btn.style.opacity = '1';
    contrasteErrEl.textContent = 'Error: ' + err.message;
    contrasteErrEl.style.display = 'block';
  }
}

// ── Show form again ───────────────────────────────────────────
function showContrasteForm() {
  resetContrasteForm();
  document.getElementById('contrastePreviewSection').style.display = 'none';
  document.getElementById('contrasteFormSection').style.display = 'block';
  document.getElementById('contrasteDashboard').style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Status helper ─────────────────────────────────────────────
function showContrasteStatus(msg) {
  const el = document.getElementById('contrasteStatusMsg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => {
    el.style.display = 'none';
  }, 3000);
}

// ── Render preview ────────────────────────────────────────────
function renderContrastePreview(r) {
  const card = document.getElementById('contrastePreviewCard');
  if (!card) return;
  const meta = r.metadata || {};
  const dateStr = new Date().toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  let h = `<div id="contrasteReportContent" style="background:#fff;overflow:hidden;box-shadow:0 2px 40px rgba(4,22,39,0.08)">`;

  // Cover bar
  h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 32px;background:#1A3350">
    <div style="display:flex;align-items:center;gap:12px">
      <img src="assets/alto-logo-white.png" alt="ALTO" style="height:18px;width:auto;display:block">
      <div style="width:1px;height:16px;background:rgba(255,255,255,0.2)"></div>
      <span style="font-family:Inter,sans-serif;font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:.08em;text-transform:uppercase">Contraste Multifuente · Confidencial</span>
    </div>
    <span style="font-family:Inter,sans-serif;font-style:italic;font-size:10px;color:rgba(255,255,255,0.35)">${esc(meta.report_date || dateStr)}</span>
  </div>`;

  // Title block
  h += `<div style="padding:40px 40px 28px;border-bottom:1px solid #E0E3E5">
    <span style="font-family:Inter,sans-serif;color:#E74243;font-weight:700;letter-spacing:.25em;text-transform:uppercase;font-size:10px;display:block;margin-bottom:10px">Contraste Multifuente</span>
    <h1 style="font-family:Manrope,sans-serif;font-size:28px;font-weight:800;color:#1A3350;line-height:1.1;margin:0">${esc(r.title)}</h1>
    ${r.subtitle ? `<p style="font-family:Inter,sans-serif;font-size:13px;color:#74777D;font-style:italic;margin-top:8px">${esc(r.subtitle)}</p>` : ''}
    <div style="display:flex;flex-wrap:wrap;gap:16px;margin-top:14px">
      ${r.sponsor ? `<div style="display:flex;align-items:center;gap:6px"><span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#74777D">Solicitante:</span><span style="font-family:Inter,sans-serif;font-size:12px;color:#1A3350;font-weight:600">${esc(r.sponsor)}</span></div>` : ''}
      ${r.scope ? `<div style="display:flex;align-items:center;gap:6px"><span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#74777D">Alcance:</span><span style="font-family:Inter,sans-serif;font-size:12px;color:#44474C">${esc(r.scope)}</span></div>` : ''}
    </div>
    <div style="width:64px;height:3px;background:#E74243;margin-top:16px"></div>
  </div>`;

  h += `<div style="padding:24px 40px;border-bottom:1px solid #E0E3E5">
    <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:14px">Ficha Técnica del Contraste</span>
    <div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px">
      ${[
        ['Fecha del informe', meta.report_date],
        ['Responsable del levantamiento', meta.fieldwork_lead],
        ['País / Geografía', meta.country],
        ['Tipo de contraste', formatCmTokenLabel(meta.contrast_type)],
        ['Nivel de sensibilidad', formatCmTokenLabel(meta.sensitivity)],
        ['Fecha del levantamiento', meta.fieldwork_date],
        ['Unidad / Gerencia / Área', meta.business_unit],
        ['Tono solicitado', formatCmTokenLabel(meta.tone)],
        ['Profundidad solicitada', formatCmTokenLabel(meta.depth)],
      ]
        .filter(([, value]) => value)
        .map(
          ([
            label,
            value,
          ]) => `<div style="background:#F8F9FB;padding:12px 14px;border-left:3px solid #4279B0">
            <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#74777D;display:block;margin-bottom:6px">${esc(label)}</span>
            <span style="font-family:Inter,sans-serif;font-size:12px;color:#1A3350;line-height:1.45">${esc(value)}</span>
          </div>`
        )
        .join('')}
    </div>
    ${
      meta.main_input_notes
        ? `<div style="margin-top:14px;background:#F8F9FB;padding:14px 16px;border-left:3px solid #1A3350"><span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#74777D;display:block;margin-bottom:6px">Notas o Insumo Principal</span><p style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;line-height:1.6">${esc(meta.main_input_notes)}</p></div>`
        : ''
    }
    ${
      meta.analyst_notes
        ? `<div style="margin-top:12px;background:#FFF8F4;padding:14px 16px;border-left:3px solid #E74243"><span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#E74243;display:block;margin-bottom:6px">Observaciones del Analista</span><p style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;line-height:1.6">${esc(meta.analyst_notes)}</p></div>`
        : ''
    }
  </div>`;

  // Central Message (So What)
  if (r.central_message) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#E74243;display:block;margin-bottom:12px">Mensaje Central</span>
      <div style="display:flex;gap:0">
        <div style="width:4px;background:#E74243;flex-shrink:0"></div>
        <div style="background:#FFF5F5;flex:1;padding:18px 22px">
          <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#E74243;text-transform:uppercase;letter-spacing:.2em">So What?  </span>
          <p style="font-family:Manrope,sans-serif;font-size:15px;font-weight:700;color:#1A3350;font-style:italic;margin-top:6px;line-height:1.45">${esc(r.central_message)}</p>
        </div>
      </div>
    </div>`;
  }

  // Executive Summary
  if (r.executive_summary) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#E74243;display:block;margin-bottom:12px">Resumen Ejecutivo</span>
      <div style="display:flex;gap:0">
        <div style="width:4px;background:#1A3350;flex-shrink:0"></div>
        <div style="background:#F2F4F6;flex:1;padding:18px 22px">
          <p style="font-family:Inter,sans-serif;font-style:italic;font-size:14px;line-height:1.65;color:#1A3350">${esc(r.executive_summary)}</p>
        </div>
      </div>
    </div>`;
  }

  // Sources Map
  if (r.sources_map?.length) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:14px">Mapa de Fuentes Contrastadas</span>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;font-size:12px">
        <thead><tr style="background:#1A3350;color:#fff">
          <th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:600">Fuente</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:600">Rol / Cargo</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:600">País / Unidad</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;font-weight:600">Tipo</th>
        </tr></thead>
        <tbody>`;
    r.sources_map.forEach((s, i) => {
      const bg = i % 2 === 0 ? '#F8F9FB' : '#fff';
      h += `<tr style="background:${bg}">
        <td style="padding:8px 12px;font-weight:600;color:#1A3350;border-bottom:1px solid #E0E3E5">${esc(s.name)}</td>
        <td style="padding:8px 12px;color:#44474C;border-bottom:1px solid #E0E3E5">${esc(s.role)}</td>
        <td style="padding:8px 12px;color:#44474C;border-bottom:1px solid #E0E3E5">${esc(s.unit)}</td>
        <td style="padding:8px 12px;color:#44474C;border-bottom:1px solid #E0E3E5">${esc(s.type)}</td>
      </tr>`;
    });
    h += `</tbody></table></div>`;
    const sourceNotes = r.sources_map.filter(source => source.notes);
    if (sourceNotes.length) {
      h += `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px">`;
      sourceNotes.forEach(source => {
        h += `<div style="background:#F8F9FB;padding:12px 14px;border-left:3px solid #4279B0">
          <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4279B0;display:block;margin-bottom:6px">${esc(source.name || 'Fuente')}</span>
          <p style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.55">${esc(source.notes)}</p>
        </div>`;
      });
      h += `</div>`;
    }
    h += `</div>`;
  }

  // Key Messages
  if (r.key_messages?.length) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:14px">Mensajes Clave</span>
      <div style="display:flex;flex-direction:column;gap:10px">`;
    r.key_messages.forEach(m => {
      h += `<div style="display:flex;gap:10px;align-items:start">
        <span style="color:#E74243;font-weight:900;font-size:12px;flex-shrink:0;margin-top:2px">▸</span>
        <span style="font-family:Inter,sans-serif;font-size:13px;color:#191C1E;line-height:1.5">${esc(m)}</span>
      </div>`;
    });
    h += `</div></div>`;
  }

  // Methodology
  if (r.methodology) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:10px">Metodología</span>
      <p style="font-family:Inter,sans-serif;font-size:13px;color:#44474C;line-height:1.65">${esc(r.methodology)}</p>
    </div>`;
  }

  // Analysis by point
  if (r.analysis_by_point?.length) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#E74243;display:block;margin-bottom:24px">Desarrollo Analítico por Punto</span>`;
    r.analysis_by_point.forEach((ap, i) => {
      const notLast = i < r.analysis_by_point.length - 1;
      h += `<div style="margin-bottom:${notLast ? '32px' : '0'};${notLast ? 'border-bottom:1px dashed #E0E3E5;padding-bottom:32px' : ''}">
        <div style="display:flex;gap:0;margin-bottom:14px">
          <div style="width:28px;background:#1A3350;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-family:Manrope,sans-serif;font-weight:900;font-size:11px;color:#fff">${i + 1}</span>
          </div>
          <div style="background:#F8F9FB;flex:1;padding:11px 16px;border-bottom:2px solid #E74243">
            <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#E74243">Punto consultado</span>
            <h3 style="font-family:Manrope,sans-serif;font-size:15px;font-weight:800;color:#1A3350;margin-top:3px">${esc(ap.point)}</h3>
          </div>
        </div>`;
      if (ap.consolidated_reading) {
        h += `<div style="margin-bottom:12px">
          <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#1A3350;text-transform:uppercase;letter-spacing:.12em;display:block;margin-bottom:5px">Lectura consolidada</span>
          <p style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;line-height:1.6">${esc(ap.consolidated_reading)}</p>
        </div>`;
      }
      if (ap.contrast) {
        h += `<div style="margin-bottom:14px">
          <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#1A3350;text-transform:uppercase;letter-spacing:.12em;display:block;margin-bottom:5px">Contraste multifuente</span>
          <p style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;line-height:1.6">${esc(ap.contrast)}</p>
        </div>`;
      }
      // Convergences / Divergences / Gaps — 3-col grid
      const hasConv = ap.convergences?.length,
        hasDiv = ap.divergences?.length,
        hasGap = ap.gaps?.length;
      if (hasConv || hasDiv || hasGap) {
        h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">`;
        h += hasConv
          ? `<div style="background:#EEF6EE;padding:11px 14px;border-top:3px solid #4279B0">
              <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#4279B0;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:7px">Convergencias</span>
              ${ap.convergences.map(c => `<div style="font-family:Inter,sans-serif;font-size:11px;color:#1A3350;line-height:1.4;margin-bottom:4px">· ${esc(c)}</div>`).join('')}
            </div>`
          : '<div></div>';
        h += hasDiv
          ? `<div style="background:#FFF5F5;padding:11px 14px;border-top:3px solid #E74243">
              <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#E74243;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:7px">Divergencias</span>
              ${ap.divergences.map(d => `<div style="font-family:Inter,sans-serif;font-size:11px;color:#191C1E;line-height:1.4;margin-bottom:4px">· ${esc(d)}</div>`).join('')}
            </div>`
          : '<div></div>';
        h += hasGap
          ? `<div style="background:#F8F9FB;padding:11px 14px;border-top:3px solid #74777D">
              <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#74777D;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:7px">Vacíos de Información</span>
              ${ap.gaps.map(g => `<div style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4;margin-bottom:4px">· ${esc(g)}</div>`).join('')}
            </div>`
          : '<div></div>';
        h += `</div>`;
      }
      if (ap.executive_finding) {
        h += `<div style="background:#1A3350;padding:11px 16px;margin-bottom:10px">
          <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:rgba(255,255,255,0.55);text-transform:uppercase;letter-spacing:.12em;display:block;margin-bottom:3px">Hallazgo ejecutivo</span>
          <p style="font-family:Manrope,sans-serif;font-weight:700;font-size:13px;color:#fff;line-height:1.4">${esc(ap.executive_finding)}</p>
        </div>`;
      }
      if (ap.implication || ap.risk_opportunity || ap.next_step) {
        h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">
          <div>${ap.implication ? `<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#E74243;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:4px">Implicancia</span><p style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4">${esc(ap.implication)}</p>` : ''}</div>
          <div>${ap.risk_opportunity ? `<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#1A3350;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:4px">Riesgo / Oportunidad</span><p style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4">${esc(ap.risk_opportunity)}</p>` : ''}</div>
          <div>${ap.next_step ? `<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#4279B0;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:4px">Próximo paso</span><p style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4">${esc(ap.next_step)}</p>` : ''}</div>
        </div>`;
      }
      h += `</div>`;
    });
    h += `</div>`;
  }

  // Comparison Matrix
  if (r.comparison_matrix?.length) {
    const srcNames = [];
    r.comparison_matrix.forEach(row => {
      Object.keys(row.source_views || {}).forEach(n => {
        if (!srcNames.includes(n)) srcNames.push(n);
      });
    });
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:14px">Matriz Comparativa Consolidada</span>
      <div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-family:Inter,sans-serif;font-size:11px">
        <thead><tr style="background:#1A3350;color:#fff">
          <th style="padding:9px 11px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;min-width:100px">Punto</th>`;
    srcNames.forEach(n => {
      h += `<th style="padding:9px 11px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;min-width:110px">${esc(n)}</th>`;
    });
    h += `<th style="padding:9px 11px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;min-width:110px">Convergencia / Divergencia</th>
          <th style="padding:9px 11px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;min-width:110px">Hallazgo Preliminar</th>
          <th style="padding:9px 11px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#E74243;min-width:100px">Riesgo / Oportunidad</th>
          <th style="padding:9px 11px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;min-width:100px">Acción Sugerida</th>
        </tr></thead>
        <tbody>`;
    r.comparison_matrix.forEach((row, i) => {
      const bg = i % 2 === 0 ? '#F8F9FB' : '#fff';
      h += `<tr style="background:${bg}">
        <td style="padding:9px 11px;font-weight:600;color:#1A3350;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.point)}</td>`;
      srcNames.forEach(n => {
        h += `<td style="padding:9px 11px;color:#44474C;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.source_views?.[n] || '—')}</td>`;
      });
      h += `<td style="padding:9px 11px;color:#44474C;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.convergence_divergence || '')}</td>
        <td style="padding:9px 11px;color:#1A3350;font-weight:500;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.preliminary_finding || '')}</td>
        <td style="padding:9px 11px;color:#E74243;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.risk_opportunity || '')}</td>
        <td style="padding:9px 11px;color:#44474C;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.suggested_action || '')}</td>
      </tr>`;
    });
    h += `</tbody></table></div></div>`;
  }

  // Transversal Findings
  if (r.transversal_findings?.length) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:14px">Hallazgos Transversales</span>
      <div style="display:flex;flex-direction:column;gap:10px">`;
    r.transversal_findings.forEach(f => {
      h += `<div style="display:flex;gap:0">
        <div style="width:3px;background:#4279B0;flex-shrink:0"></div>
        <div style="background:#EEF4FF;flex:1;padding:10px 16px">
          <p style="font-family:Inter,sans-serif;font-size:13px;color:#1A3350;line-height:1.5">${esc(f)}</p>
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // Risks
  if (r.risks?.length) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#E74243;display:block;margin-bottom:14px">Riesgos</span>
      <div style="display:flex;flex-direction:column;gap:10px">`;
    r.risks.forEach(rk => {
      h += `<div style="display:flex;gap:0">
        <div style="width:3px;background:#E74243;flex-shrink:0"></div>
        <div style="background:#FFF5F5;flex:1;padding:12px 16px">
          <p style="font-family:Manrope,sans-serif;font-size:13px;font-weight:700;color:#E74243;margin-bottom:4px">${esc(rk.risk)}</p>
          ${rk.nature ? `<span style="font-family:Inter,sans-serif;font-size:10px;color:#74777D;background:#fff;padding:2px 8px;border-radius:10px">${esc(rk.nature)}</span>` : ''}
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // Opportunities
  if (r.opportunities?.length) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:14px">Oportunidades</span>
      <div style="display:flex;flex-direction:column;gap:10px">`;
    r.opportunities.forEach(op => {
      h += `<div style="display:flex;gap:10px;align-items:start">
        <span style="color:#4279B0;font-weight:900;font-size:14px;flex-shrink:0;margin-top:1px">✦</span>
        <div>
          <p style="font-family:Inter,sans-serif;font-size:13px;color:#191C1E;line-height:1.4;margin-bottom:4px">${esc(op.opportunity)}</p>
          ${op.improvement_type ? `<span style="font-family:Inter,sans-serif;font-size:10px;color:#4279B0;background:#EEF4FF;padding:2px 8px;border-radius:10px">${esc(op.improvement_type)}</span>` : ''}
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // Recommendations
  if (r.recommendations) {
    h += `<div style="padding:28px 40px;border-bottom:1px solid #E0E3E5">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:20px">Recomendaciones</span>`;
    [
      { key: 'immediate', label: 'Inmediatas', color: '#E74243' },
      { key: 'short_term', label: 'Corto Plazo', color: '#1A3350' },
      { key: 'structural', label: 'Estructurales', color: '#2A313E' },
    ].forEach(hz => {
      const items = r.recommendations[hz.key];
      if (!items?.length) return;
      h += `<div style="margin-bottom:20px">
        <div style="display:inline-block;font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:.15em;font-weight:700;color:#fff;padding:4px 12px;margin-bottom:12px;background:${hz.color}">${hz.label}</div>`;
      items.forEach((rec, i) => {
        h += `<div style="display:flex;gap:0;margin-bottom:10px">
          <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:Manrope,sans-serif;font-weight:900;font-size:11px;color:#fff;background:${hz.color}">${i + 1}</div>
          <div style="background:#F8F9FB;flex:1;padding:10px 16px">
            <p style="font-family:Manrope,sans-serif;font-weight:700;font-size:13px;color:#1A3350;margin-bottom:3px">${esc(rec.action)}</p>
            ${rec.rationale ? `<p style="font-family:Inter,sans-serif;font-size:11px;color:#74777D;font-style:italic;margin-bottom:3px">${esc(rec.rationale)}</p>` : ''}
            ${rec.impact ? `<p style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:${hz.color}">Impacto: ${esc(rec.impact)}</p>` : ''}
          </div>
        </div>`;
      });
      h += `</div>`;
    });
    h += `</div>`;
  }

  // Conclusion
  if (r.conclusion) {
    h += `<div style="padding:28px 40px">
      <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:#1A3350;display:block;margin-bottom:12px">Conclusión Ejecutiva</span>
      <div style="display:flex;gap:0">
        <div style="width:4px;background:#1A3350;flex-shrink:0"></div>
        <div style="background:#F2F4F6;flex:1;padding:18px 22px">
          <p style="font-family:Manrope,sans-serif;font-style:italic;font-size:14px;font-weight:600;line-height:1.65;color:#1A3350">${esc(r.conclusion)}</p>
        </div>
      </div>
    </div>`;
  }

  h += `</div>`;
  card.innerHTML = h;
}

// ── PDF export (html2canvas screenshot) ──────────────────────
async function downloadContrastePDF() {
  const reportEl = document.getElementById('contrasteReportContent');
  if (!reportEl) return;
  showContrasteStatus('Generando PDF...');
  try {
    await Promise.all([loadLib('html2canvas'), loadLib('jspdf')]);
    const canvas = await html2canvas(reportEl, {
      backgroundColor: '#fff',
      scale: 1.5,
      useCORS: true,
      logging: false,
    });
    const imgData = canvas.toDataURL('image/png');
    const { jsPDF } = window.jspdf;
    const pdfW = 210;
    const pdfH = Math.round((canvas.height * pdfW) / canvas.width);
    const pdf = new jsPDF('p', 'mm', [pdfW, pdfH]);
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH);
    pdf.save('Contraste_ALTO_' + new Date().toISOString().slice(0, 10) + '.pdf');
    showContrasteStatus('PDF descargado');
  } catch (err) {
    showContrasteStatus('Error PDF: ' + err.message);
  }
}

// ── Markdown copy ─────────────────────────────────────────────
function copyContrasteMarkdown() {
  const r = _contrasteResult;
  if (!r) return;
  const meta = r.metadata || {};
  let md = `# ${r.title}\n*${r.subtitle || 'Informe Ejecutivo de Contraste Multifuente'}*\n\n`;
  if (r.sponsor) md += `**Solicitante:** ${r.sponsor}  \n`;
  if (r.scope) md += `**Alcance:** ${r.scope}\n`;
  [
    ['Fecha del informe', meta.report_date],
    ['Responsable del levantamiento', meta.fieldwork_lead],
    ['País / Geografía', meta.country],
    ['Tipo de contraste', formatCmTokenLabel(meta.contrast_type)],
    ['Nivel de sensibilidad', formatCmTokenLabel(meta.sensitivity)],
    ['Fecha del levantamiento', meta.fieldwork_date],
    ['Unidad / Gerencia / Área', meta.business_unit],
    ['Tono solicitado', formatCmTokenLabel(meta.tone)],
    ['Profundidad solicitada', formatCmTokenLabel(meta.depth)],
  ].forEach(([label, value]) => {
    if (value) md += `**${label}:** ${value}  \n`;
  });
  md += `\n---\n\n`;
  if (r.central_message) md += `## Mensaje Central\n\n> **So What?** *${r.central_message}*\n\n`;
  if (r.executive_summary) md += `## Resumen Ejecutivo\n\n> ${r.executive_summary}\n\n`;
  if (meta.main_input_notes) md += `## Notas o Insumo Principal\n\n${meta.main_input_notes}\n\n`;
  if (meta.analyst_notes) md += `## Observaciones del Analista\n\n${meta.analyst_notes}\n\n`;
  if (r.key_messages?.length) {
    md += `## Mensajes Clave\n\n`;
    r.key_messages.forEach(m => {
      md += `- ${m}\n`;
    });
    md += '\n';
  }
  if (r.sources_map?.length) {
    md += `## Fuentes Contrastadas\n\n| Fuente | Rol | País/Unidad | Tipo |\n|--------|-----|-------------|------|\n`;
    r.sources_map.forEach(s => {
      md += `| ${s.name} | ${s.role} | ${s.unit} | ${s.type} |\n`;
    });
    md += '\n';
    const sourceNotes = r.sources_map.filter(s => s.notes);
    if (sourceNotes.length) {
      md += `### Notas por fuente\n\n`;
      sourceNotes.forEach(s => {
        md += `**${s.name || 'Fuente'}**: ${s.notes}\n\n`;
      });
    }
  }
  if (r.methodology) md += `## Metodología\n\n${r.methodology}\n\n`;
  if (r.analysis_by_point?.length) {
    md += `## Desarrollo Analítico por Punto\n\n`;
    r.analysis_by_point.forEach((ap, i) => {
      md += `### ${i + 1}. ${ap.point}\n\n`;
      if (ap.consolidated_reading) md += `**Lectura consolidada:** ${ap.consolidated_reading}\n\n`;
      if (ap.contrast) md += `**Contraste:** ${ap.contrast}\n\n`;
      if (ap.convergences?.length) {
        md += `**Convergencias:**\n`;
        ap.convergences.forEach(c => {
          md += `- ${c}\n`;
        });
        md += '\n';
      }
      if (ap.divergences?.length) {
        md += `**Divergencias:**\n`;
        ap.divergences.forEach(d => {
          md += `- ${d}\n`;
        });
        md += '\n';
      }
      if (ap.gaps?.length) {
        md += `**Vacíos:**\n`;
        ap.gaps.forEach(g => {
          md += `- ${g}\n`;
        });
        md += '\n';
      }
      if (ap.executive_finding) md += `**Hallazgo ejecutivo:** ${ap.executive_finding}\n\n`;
      if (ap.implication) md += `**Implicancia:** ${ap.implication}\n\n`;
      if (ap.next_step) md += `**Próximo paso:** ${ap.next_step}\n\n`;
    });
  }
  if (r.comparison_matrix?.length) {
    md += `## Matriz Comparativa Consolidada\n\n`;
    r.comparison_matrix.forEach((row, i) => {
      md += `### ${i + 1}. ${row.point}\n\n`;
      Object.entries(row.source_views || {}).forEach(([source, view]) => {
        md += `- **${source}:** ${view}\n`;
      });
      if (row.convergence_divergence)
        md += `- **Convergencia / Divergencia:** ${row.convergence_divergence}\n`;
      if (row.preliminary_finding) md += `- **Hallazgo preliminar:** ${row.preliminary_finding}\n`;
      if (row.risk_opportunity) md += `- **Riesgo / Oportunidad:** ${row.risk_opportunity}\n`;
      if (row.suggested_action) md += `- **Acción sugerida:** ${row.suggested_action}\n`;
      md += '\n';
    });
  }
  if (r.transversal_findings?.length) {
    md += `## Hallazgos Transversales\n\n`;
    r.transversal_findings.forEach(item => {
      md += `- ${item}\n`;
    });
    md += '\n';
  }
  if (r.risks?.length) {
    md += `## Riesgos\n\n`;
    r.risks.forEach(rk => {
      md += `- **${rk.risk}** *(${rk.nature})*\n`;
    });
    md += '\n';
  }
  if (r.opportunities?.length) {
    md += `## Oportunidades\n\n`;
    r.opportunities.forEach(op => {
      md += `- ${op.opportunity} *(${op.improvement_type})*\n`;
    });
    md += '\n';
  }
  if (r.recommendations) {
    md += `## Recomendaciones\n\n`;
    [
      { key: 'immediate', label: 'Inmediatas' },
      { key: 'short_term', label: 'Corto Plazo' },
      { key: 'structural', label: 'Estructurales' },
    ].forEach(hz => {
      const items = r.recommendations[hz.key];
      if (!items?.length) return;
      md += `### ${hz.label}\n\n`;
      items.forEach((rec, i) => {
        md += `${i + 1}. **${rec.action}** — ${rec.rationale} *(${rec.impact})*\n`;
      });
      md += '\n';
    });
  }
  if (r.conclusion) md += `---\n\n## Conclusión Ejecutiva\n\n${r.conclusion}\n`;
  navigator.clipboard.writeText(md);
  showContrasteStatus('Markdown copiado');
}
