// ============================================================
// CONTRASTE MULTIFUENTE MODULE
// Depends on: state.js, schemas.js (normalizeContentText, hasPlaceholderContent),
//             ui-helpers.js (esc, t, flash),
//             fetchFromWorker (app.js)
// ============================================================

let _cmPuntos = ['', '', ''];
let _cmFuentes = [createEmptyCmFuente(), createEmptyCmFuente()];
let _cmTipoContraste = 'operativo_legal';
let _cmSensibilidad = 'uso_interno';
let _cmTono = 'ejecutivo_prudente';
let _cmProfundidad = 'estandar';
let _contrasteResult = null;
let _contrasteInited = false;

const CM_COUNTRY_OPTIONS = ['Colombia', 'Chile', 'USA', 'España', 'Mexico'];

// Placeholder tokens: uses CONTENT_PLACEHOLDER_TOKENS from schemas.js

function createEmptyCmFuente() {
  return { nombre: '', rol: '', pais: '', unidad: '', tipo: 'área', notas: '' };
}

function formatCmDateDisplay(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const date = new Date(raw + 'T00:00:00');
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' });
}

function renderCmCountryOptions(selectedValue = '') {
  return [`<option value="">Seleccionar</option>`]
    .concat(
      CM_COUNTRY_OPTIONS.map(
        option =>
          `<option value="${esc(option)}"${option === selectedValue ? ' selected' : ''}>${esc(option)}</option>`
      )
    )
    .join('');
}

function buildSourceScope(source) {
  return [source.pais, source.unidad].filter(Boolean).join(' · ');
}

// Aliases — unified implementations live in schemas.js
const normalizeCmText = normalizeContentText;
const hasCmPlaceholder = hasPlaceholderContent;

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
  _cmFuentes = [createEmptyCmFuente(), createEmptyCmFuente()];
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
    report_date: formatCmDateDisplay(document.getElementById('cmFecha')?.value || ''),
    fieldwork_lead: (document.getElementById('cmAnalista')?.value || '').trim(),
    country: (document.getElementById('cmPais')?.value || '').trim(),
    objective: (document.getElementById('cmObjetivo')?.value || '').trim(),
    main_input_notes: (document.getElementById('cmNotasInsumo')?.value || '').trim(),
    fieldwork_date: formatCmDateDisplay(
      document.getElementById('cmFechaLevantamiento')?.value || ''
    ),
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
      country: (f.pais || '').trim(),
      unit: buildSourceScope(f),
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

  const fallbackTitle = [payload.title, payload.central_message, payload.scope, metadata.objective]
    .map(value => String(value || '').trim())
    .find(value => value.length >= 6 && value.split(/\s+/).filter(Boolean).length >= 2);
  hydrated.title = fallbackTitle || 'Contraste ejecutivo multifuente';

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

function loadContrasteSample() {
  showNuevoContrasteForm();
  resetContrasteForm();
  document.getElementById('cmSponsor').value = 'Dirección Regional Cono Sur';
  document.getElementById('cmFecha').value = '2026-04-17';
  document.getElementById('cmAnalista').value = 'Gerencia de Análisis Estratégico';
  document.getElementById('cmPais').value = 'Chile';
  document.getElementById('cmObjetivo').value =
    'Contrastar percepciones operativas, legales y de discovery sobre los principales focos de pérdida y calidad de ejecución para priorizar acciones ejecutivas en Chile.';
  document.getElementById('cmNotasInsumo').value =
    'El sponsor solicita un contraste ejecutivo para ordenar hallazgos de operación, legal, call center y discovery, distinguiendo coincidencias, vacíos y prioridades de gestión.';
  document.getElementById('cmFechaLevantamiento').value = '2026-04-12';
  document.getElementById('cmUnidad').value = 'Operaciones y Legal Chile';
  document.getElementById('cmObservaciones').value =
    'Existe presión por responder rápido a dirección. El informe debe ser prudente y accionable, evitando conclusiones forenses o afirmaciones no verificadas.';
  _cmPuntos = [
    'Clústeres y estrategia asociada',
    'Poder sancionatorio y causas de disminución',
    'ROI',
    'Calidad del dato',
    'Reportes Discovery',
  ];
  _cmFuentes = [
    {
      nombre: 'María José Matus',
      rol: 'Country Manager',
      pais: 'Chile',
      unidad: 'Operaciones',
      tipo: 'persona',
      notas:
        'Sostiene que los clústeres actuales no están priorizando correctamente tiendas con mayor presión de bandas GDO y que el ROI operativo se diluye por ejecución desigual entre zonas.',
    },
    {
      nombre: 'Equipo Legal Chile',
      rol: 'Legal / Compliance',
      pais: 'Chile',
      unidad: 'Legal',
      tipo: 'área',
      notas:
        'Reporta caída en efectividad del poder sancionatorio por tiempos de tramitación, menor calidad de respaldo documental y dificultad para sostener ciertos casos por falta de evidencia consistente.',
    },
    {
      nombre: 'Discovery Regional',
      rol: 'Analytics Lead',
      pais: 'Chile',
      unidad: 'Discovery',
      tipo: 'fuente_técnica',
      notas:
        'Identifica brechas de calidad del dato en Alliance, subreporte de acuerdos reparatorios y discrepancias entre reportes operativos y consolidado discovery, especialmente en reincidentes vs recurrentes.',
    },
  ];
  _cmTipoContraste = 'estrategico';
  _cmSensibilidad = 'confidencial';
  _cmTono = 'alta_direccion';
  _cmProfundidad = 'estandar';
  renderCmPuntos();
  renderCmFuentes();
  setContrasteChipSelection('cmTipoChips', 'tipo', _cmTipoContraste);
  setContrasteChipSelection('cmSensibilidadChips', 'sens', _cmSensibilidad);
  setContrasteChipSelection('cmTonoChips', 'tono', _cmTono);
  setContrasteChipSelection('cmProfundidadChips', 'prof', _cmProfundidad);
  const errorEl = document.getElementById('contrasteError');
  if (errorEl) errorEl.style.display = 'none';
  window.scrollTo({ top: 0, behavior: 'smooth' });
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
          <label style="${labelStyle}">País</label>
          <select oninput="updateCmFuente(${i},'pais',this.value)" style="${inputStyle};appearance:auto">
            ${renderCmCountryOptions(f.pais)}
          </select>
        </div>
        <div>
          <label style="${labelStyle}">Unidad / Área</label>
          <input type="text" value="${esc(f.unidad)}" oninput="updateCmFuente(${i},'unidad',this.value)" placeholder="Ej: Gerencia de Operaciones" style="${inputStyle}">
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
  _cmFuentes.push(createEmptyCmFuente());
  renderCmFuentes();
}
function removeCmFuente(i) {
  _cmFuentes.splice(i, 1);
  renderCmFuentes();
}

// ── Build structured text input ───────────────────────────────
function buildContrasteInput() {
  const sponsor = (document.getElementById('cmSponsor')?.value || '').trim();
  const fecha = formatCmDateDisplay(document.getElementById('cmFecha')?.value || '');
  const analista = (document.getElementById('cmAnalista')?.value || '').trim();
  const pais = (document.getElementById('cmPais')?.value || '').trim();
  const objetivo = (document.getElementById('cmObjetivo')?.value || '').trim();
  const notasInsumo = (document.getElementById('cmNotasInsumo')?.value || '').trim();
  const fechaLevantamiento = formatCmDateDisplay(
    document.getElementById('cmFechaLevantamiento')?.value || ''
  );
  const unidad = (document.getElementById('cmUnidad')?.value || '').trim();
  const observaciones = (document.getElementById('cmObservaciones')?.value || '').trim();
  const puntos = _cmPuntos.filter(p => p.trim());
  const fuentes = _cmFuentes.filter(f => f.nombre.trim() || f.notas.trim());
  const compactMode = puntos.length >= 8;

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
  if (compactMode) {
    text +=
      'MODO DE SINTESIS\nHay muchos puntos a contrastar. Prioriza brevedad ejecutiva, evita redundancias y limita cada desarrollo a lo estrictamente necesario para decidir.\n\n';
  }
  if (fuentes.length) {
    text += 'FUENTES CONTRASTADAS\n';
    fuentes.forEach((f, i) => {
      text += `\nFuente ${i + 1}:\n`;
      if (f.nombre) text += `  Nombre: ${f.nombre}\n`;
      if (f.rol) text += `  Rol / Cargo: ${f.rol}\n`;
      if (f.pais) text += `  País: ${f.pais}\n`;
      if (f.unidad) text += `  Unidad / Área: ${f.unidad}\n`;
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
    const pointCount = _cmPuntos.map(p => p.trim()).filter(Boolean).length;
    const input = buildContrasteInput();
    const txt = await fetchFromWorker(
      WORKER_URL,
      {
        userContent: input,
        reportType: 'multisource_contrast',
        contrastPointCount: pointCount,
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

    _contrasteResult = parseModelJSON(null, txt);
    _contrasteResult = normalizeContrasteResult(_contrasteResult, true);
    const contrasteIssues = validateContrasteShape(_contrasteResult);
    if (contrasteIssues.length) throw new Error(contrasteIssues[0]);
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
    <h1 contenteditable="true" data-ce="title" style="font-family:Manrope,sans-serif;font-size:28px;font-weight:800;color:#1A3350;line-height:1.1;margin:0;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(r.title)}</h1>
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
          <p contenteditable="true" data-ce="central_message" style="font-family:Manrope,sans-serif;font-size:15px;font-weight:700;color:#1A3350;font-style:italic;margin-top:6px;line-height:1.45;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(r.central_message)}</p>
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
          <p contenteditable="true" data-ce="executive_summary" style="font-family:Inter,sans-serif;font-style:italic;font-size:14px;line-height:1.65;color:#1A3350;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(r.executive_summary)}</p>
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
      <p contenteditable="true" data-ce="methodology" style="font-family:Inter,sans-serif;font-size:13px;color:#44474C;line-height:1.65;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(r.methodology)}</p>
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
          <p contenteditable="true" data-ce="abp-${i}-consolidated_reading" style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;line-height:1.6;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(ap.consolidated_reading)}</p>
        </div>`;
      }
      if (ap.contrast) {
        h += `<div style="margin-bottom:14px">
          <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#1A3350;text-transform:uppercase;letter-spacing:.12em;display:block;margin-bottom:5px">Contraste multifuente</span>
          <p contenteditable="true" data-ce="abp-${i}-contrast" style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;line-height:1.6;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(ap.contrast)}</p>
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
          <p contenteditable="true" data-ce="abp-${i}-executive_finding" style="font-family:Manrope,sans-serif;font-weight:700;font-size:13px;color:#fff;line-height:1.4;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='rgba(255,255,255,0.4)'" onmouseout="this.style.borderBottomColor='transparent'">${esc(ap.executive_finding)}</p>
        </div>`;
      }
      if (ap.implication || ap.risk_opportunity || ap.next_step) {
        h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:10px">
          <div>${ap.implication ? `<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#E74243;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:4px">Implicancia</span><p contenteditable="true" data-ce="abp-${i}-implication" style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(ap.implication)}</p>` : ''}</div>
          <div>${ap.risk_opportunity ? `<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#1A3350;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:4px">Riesgo / Oportunidad</span><p contenteditable="true" data-ce="abp-${i}-risk_opportunity" style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(ap.risk_opportunity)}</p>` : ''}</div>
          <div>${ap.next_step ? `<span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#4279B0;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:4px">Próximo paso</span><p contenteditable="true" data-ce="abp-${i}-next_step" style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(ap.next_step)}</p>` : ''}</div>
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
          <p contenteditable="true" data-ce="conclusion" style="font-family:Manrope,sans-serif;font-style:italic;font-size:14px;font-weight:600;line-height:1.65;color:#1A3350;outline:none;cursor:text;border-bottom:1px dashed transparent;transition:border-color .2s" onmouseover="this.style.borderBottomColor='#BFC4C5'" onmouseout="this.style.borderBottomColor='transparent'">${esc(r.conclusion)}</p>
        </div>
      </div>
    </div>`;
  }

  h += `</div>`;
  card.innerHTML = h;
}

// ── Sync contenteditable edits back to _contrasteResult ──────
function syncContrasteEdits() {
  const container = document.getElementById('contrasteReportContent');
  if (!container || !_contrasteResult) return;
  container.querySelectorAll('[data-ce]').forEach(el => {
    const key = el.getAttribute('data-ce');
    const text = el.innerText.trim();
    if (key.startsWith('abp-')) {
      const parts = key.split('-');
      const idx = parseInt(parts[1], 10);
      const field = parts.slice(2).join('-');
      if (_contrasteResult.analysis_by_point && _contrasteResult.analysis_by_point[idx]) {
        _contrasteResult.analysis_by_point[idx][field] = text;
      }
    } else {
      _contrasteResult[key] = text;
    }
  });
  result = _contrasteResult;
}

// ── PDF export (real jsPDF text) ─────────────────────────────
async function downloadContrastePDF() {
  const r = _contrasteResult;
  if (!r) return;
  syncContrasteEdits();
  showContrasteStatus('Generando PDF...');
  try {
    await loadLib('jspdf');
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pw = 210, ph = 297, ml = 20, mr = 20, mt = 25, mb = 25;
    const cw = pw - ml - mr; // 170
    let y = mt;
    const meta = r.metadata || {};
    const dateStr = meta.report_date || new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' });

    function hexToRgb(hex) { const h = hex.replace('#',''); return [parseInt(h.substring(0,2),16), parseInt(h.substring(2,4),16), parseInt(h.substring(4,6),16)]; }
    const cNAVY = hexToRgb('1A3350'), cRED = hexToRgb('E74243'), cBODY = hexToRgb('44474C'), cGRAY = hexToRgb('676766'), cBLUE = hexToRgb('4279B0');

    function addHeader() {
      pdf.setFillColor(...cNAVY);
      pdf.rect(0, 0, pw, 12, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(255,255,255);
      pdf.text('ALTO', ml, 7);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(200,200,200);
      pdf.text('Confidencial', pw - mr, 7, { align: 'right' });
    }
    function addFooter(pageNum) {
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(150,150,150);
      pdf.text('Pagina ' + pageNum, pw / 2, ph - 10, { align: 'center' });
    }
    function checkPage(needed) {
      if (y + needed > ph - mb) { addFooter(pdf.getNumberOfPages()); pdf.addPage(); addHeader(); y = mt + 8; }
    }
    function sectionTitle(txt) {
      checkPage(16);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...cRED);
      pdf.text(txt.toUpperCase(), ml, y); y += 5;
      pdf.setDrawColor(...cRED); pdf.setLineWidth(0.4); pdf.line(ml, y, ml + cw, y); y += 8;
    }
    function bodyText(txt, fontSize, color, bold) {
      if (!txt) return;
      pdf.setFont('helvetica', bold ? 'bold' : 'normal'); pdf.setFontSize(fontSize || 9); pdf.setTextColor(...(color || cBODY));
      const lines = pdf.splitTextToSize(String(txt), cw);
      const lineH = (fontSize || 9) * 0.5;
      lines.forEach(line => { checkPage(lineH + 2); pdf.text(line, ml, y); y += lineH; });
      y += 4;
    }
    function labelValue(label, value) {
      if (!value) return;
      checkPage(8);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cGRAY);
      pdf.text(label.toUpperCase(), ml, y);
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...cNAVY);
      pdf.text(String(value), ml + 50, y);
      y += 6;
    }
    function grayBox(txt) {
      if (!txt) return;
      const lines = pdf.splitTextToSize(String(txt), cw - 12);
      const boxH = lines.length * 5 + 10;
      checkPage(boxH + 4);
      pdf.setFillColor(242, 244, 246);
      pdf.rect(ml, y - 2, cw, boxH, 'F');
      pdf.setFillColor(...cNAVY);
      pdf.rect(ml, y - 2, 1.5, boxH, 'F');
      pdf.setFont('helvetica', 'italic'); pdf.setFontSize(9); pdf.setTextColor(...cNAVY);
      let ty = y + 4;
      lines.forEach(line => { pdf.text(line, ml + 6, ty); ty += 5; });
      y += boxH + 6;
    }
    function redBox(label, txt) {
      if (!txt) return;
      const lines = pdf.splitTextToSize(String(txt), cw - 12);
      const boxH = lines.length * 5 + 14;
      checkPage(boxH + 4);
      pdf.setFillColor(255, 245, 245);
      pdf.rect(ml, y - 2, cw, boxH, 'F');
      pdf.setFillColor(...cRED);
      pdf.rect(ml, y - 2, 1.5, boxH, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cRED);
      pdf.text(label.toUpperCase(), ml + 6, y + 3);
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...cNAVY);
      let ty = y + 9;
      lines.forEach(line => { pdf.text(line, ml + 6, ty); ty += 5; });
      y += boxH + 6;
    }
    function bulletList(items, color) {
      if (!items || !items.length) return;
      items.forEach(item => {
        const lines = pdf.splitTextToSize(String(typeof item === 'string' ? item : item.risk || item.opportunity || item.action || ''), cw - 8);
        checkPage(lines.length * 5 + 4);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...(color || cRED));
        pdf.text('\u25B8', ml, y);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...cBODY);
        let ty = y;
        lines.forEach(line => { pdf.text(line, ml + 6, ty); ty += 5; });
        y = ty + 3;
      });
      y += 4;
    }

    // Page 1 header
    addHeader();
    y = mt + 8;

    // Cover
    y += 12;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...cRED);
    pdf.text('CONTRASTE MULTIFUENTE', ml, y); y += 10;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(20); pdf.setTextColor(...cNAVY);
    const titleLines = pdf.splitTextToSize(r.title || '', cw);
    titleLines.forEach(line => { pdf.text(line, ml, y); y += 9; });
    y += 2;
    if (r.subtitle) { pdf.setFont('helvetica', 'italic'); pdf.setFontSize(10); pdf.setTextColor(...cGRAY); pdf.text(r.subtitle, ml, y); y += 8; }
    pdf.setDrawColor(...cRED); pdf.setLineWidth(0.8); pdf.line(ml, y, ml + 40, y); y += 10;
    if (r.sponsor) { labelValue('Solicitante', r.sponsor); }
    if (r.scope) { labelValue('Alcance', r.scope); }
    labelValue('Fecha', dateStr);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...cNAVY);
    pdf.text('CONFIDENCIAL', ml, y); y += 12;

    // Ficha Tecnica
    sectionTitle('Ficha Tecnica del Contraste');
    [['Fecha del informe', meta.report_date], ['Responsable', meta.fieldwork_lead], ['Pais', meta.country], ['Tipo de contraste', formatCmTokenLabel(meta.contrast_type)], ['Sensibilidad', formatCmTokenLabel(meta.sensitivity)], ['Fecha levantamiento', meta.fieldwork_date], ['Unidad', meta.business_unit], ['Tono', formatCmTokenLabel(meta.tone)], ['Profundidad', formatCmTokenLabel(meta.depth)]].forEach(([l,v]) => { if (v) labelValue(l, v); });
    y += 6;

    // Central Message
    if (r.central_message) { sectionTitle('Mensaje Central'); redBox('So What?', r.central_message); }

    // Executive Summary
    if (r.executive_summary) { sectionTitle('Resumen Ejecutivo'); grayBox(r.executive_summary); }

    // Sources Map
    if (r.sources_map && r.sources_map.length) {
      sectionTitle('Mapa de Fuentes Contrastadas');
      r.sources_map.forEach((s, idx) => {
        checkPage(14);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...cNAVY);
        pdf.text((idx+1) + '. ' + (s.name || ''), ml, y);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...cGRAY);
        const info = [s.role, s.unit, s.type].filter(Boolean).join(' | ');
        if (info) { pdf.text(info, ml + 50, y); }
        y += 6;
      });
      y += 6;
    }

    // Key Messages
    if (r.key_messages && r.key_messages.length) { sectionTitle('Mensajes Clave'); bulletList(r.key_messages); }

    // Methodology
    if (r.methodology) { sectionTitle('Metodologia'); bodyText(r.methodology); y += 4; }

    // Analysis by Point
    if (r.analysis_by_point && r.analysis_by_point.length) {
      sectionTitle('Desarrollo Analitico por Punto');
      r.analysis_by_point.forEach((ap, idx) => {
        checkPage(20);
        pdf.setFillColor(...cNAVY); pdf.rect(ml, y - 4, 8, 8, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255,255,255);
        pdf.text(String(idx + 1), ml + 3, y + 1);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(...cNAVY);
        pdf.text(ap.point || '', ml + 12, y + 1);
        y += 10;
        if (ap.consolidated_reading) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cGRAY); pdf.text('LECTURA CONSOLIDADA', ml, y); y += 4; bodyText(ap.consolidated_reading); }
        if (ap.contrast) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cGRAY); pdf.text('CONTRASTE MULTIFUENTE', ml, y); y += 4; bodyText(ap.contrast); }
        if (ap.convergences && ap.convergences.length) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cBLUE); checkPage(6); pdf.text('CONVERGENCIAS', ml, y); y += 4; bulletList(ap.convergences, cBLUE); }
        if (ap.divergences && ap.divergences.length) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cRED); checkPage(6); pdf.text('DIVERGENCIAS', ml, y); y += 4; bulletList(ap.divergences, cRED); }
        if (ap.gaps && ap.gaps.length) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cGRAY); checkPage(6); pdf.text('VACIOS DE INFORMACION', ml, y); y += 4; bulletList(ap.gaps, cGRAY); }
        if (ap.executive_finding) {
          const efLines = pdf.splitTextToSize(ap.executive_finding, cw - 12);
          const efH = efLines.length * 5 + 10;
          checkPage(efH + 4);
          pdf.setFillColor(...cNAVY); pdf.rect(ml, y - 2, cw, efH, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(200,200,200);
          pdf.text('HALLAZGO EJECUTIVO', ml + 5, y + 3);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(255,255,255);
          let ey = y + 9;
          efLines.forEach(line => { pdf.text(line, ml + 5, ey); ey += 5; });
          y += efH + 6;
        }
        if (ap.implication) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cRED); checkPage(6); pdf.text('IMPLICANCIA', ml, y); y += 4; bodyText(ap.implication); }
        if (ap.risk_opportunity) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cNAVY); checkPage(6); pdf.text('RIESGO / OPORTUNIDAD', ml, y); y += 4; bodyText(ap.risk_opportunity); }
        if (ap.next_step) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cBLUE); checkPage(6); pdf.text('PROXIMO PASO', ml, y); y += 4; bodyText(ap.next_step); }
        y += 8;
      });
    }

    // Comparison Matrix
    if (r.comparison_matrix && r.comparison_matrix.length) {
      sectionTitle('Matriz Comparativa Consolidada');
      r.comparison_matrix.forEach((row, idx) => {
        checkPage(16);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...cNAVY);
        pdf.text((idx+1) + '. ' + (row.point || ''), ml, y); y += 6;
        Object.entries(row.source_views || {}).forEach(([src, view]) => {
          checkPage(10);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(...cBLUE);
          pdf.text(src + ':', ml + 4, y);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(...cBODY);
          const vLines = pdf.splitTextToSize(String(view), cw - 40);
          vLines.forEach(line => { pdf.text(line, ml + 40, y); y += 4; });
          y += 2;
        });
        if (row.convergence_divergence) { bodyText('Conv/Div: ' + row.convergence_divergence, 8, cGRAY); }
        if (row.preliminary_finding) { bodyText('Hallazgo: ' + row.preliminary_finding, 8, cNAVY, true); }
        if (row.risk_opportunity) { bodyText('Riesgo/Op: ' + row.risk_opportunity, 8, cRED); }
        if (row.suggested_action) { bodyText('Accion: ' + row.suggested_action, 8, cBLUE); }
        y += 4;
      });
    }

    // Transversal Findings
    if (r.transversal_findings && r.transversal_findings.length) { sectionTitle('Hallazgos Transversales'); bulletList(r.transversal_findings, cBLUE); }

    // Risks
    if (r.risks && r.risks.length) {
      sectionTitle('Riesgos');
      r.risks.forEach(rk => {
        const lines = pdf.splitTextToSize(rk.risk || '', cw - 12);
        const bh = lines.length * 5 + (rk.nature ? 12 : 6);
        checkPage(bh + 4);
        pdf.setFillColor(255,245,245); pdf.rect(ml, y - 2, cw, bh, 'F');
        pdf.setFillColor(...cRED); pdf.rect(ml, y - 2, 1.5, bh, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...cRED);
        let ry = y + 3;
        lines.forEach(line => { pdf.text(line, ml + 6, ry); ry += 5; });
        if (rk.nature) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(...cGRAY); pdf.text(rk.nature, ml + 6, ry); }
        y += bh + 6;
      });
    }

    // Opportunities
    if (r.opportunities && r.opportunities.length) {
      sectionTitle('Oportunidades');
      r.opportunities.forEach(op => {
        checkPage(10);
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...cBLUE);
        pdf.text('\u25B8', ml, y);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(...cBODY);
        const lines = pdf.splitTextToSize(op.opportunity || '', cw - 8);
        lines.forEach(line => { pdf.text(line, ml + 6, y); y += 5; });
        if (op.improvement_type) { pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7); pdf.setTextColor(...cBLUE); pdf.text(op.improvement_type, ml + 6, y); y += 4; }
        y += 3;
      });
    }

    // Recommendations
    if (r.recommendations) {
      sectionTitle('Recomendaciones');
      [{ key: 'immediate', label: 'INMEDIATAS', c: cRED }, { key: 'short_term', label: 'CORTO PLAZO', c: cNAVY }, { key: 'structural', label: 'ESTRUCTURALES', c: cGRAY }].forEach(hz => {
        const items = r.recommendations[hz.key];
        if (!items || !items.length) return;
        checkPage(12);
        pdf.setFillColor(...hz.c); pdf.rect(ml, y - 3, 40, 7, 'F');
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(255,255,255);
        pdf.text(hz.label, ml + 2, y + 1); y += 10;
        items.forEach((rec, idx) => {
          checkPage(16);
          pdf.setFillColor(...cNAVY); pdf.rect(ml, y - 3, 7, 7, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255,255,255);
          pdf.text(String(idx + 1), ml + 2.5, y + 1);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(...cNAVY);
          const aLines = pdf.splitTextToSize(rec.action || '', cw - 12);
          let ay = y;
          aLines.forEach(line => { pdf.text(line, ml + 10, ay + 1); ay += 5; });
          y = ay + 2;
          if (rec.rationale) { pdf.setFont('helvetica', 'italic'); pdf.setFontSize(8); pdf.setTextColor(...cGRAY); const rLines = pdf.splitTextToSize(rec.rationale, cw - 12); rLines.forEach(line => { checkPage(5); pdf.text(line, ml + 10, y); y += 4; }); y += 1; }
          if (rec.impact) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(...cRED); checkPage(6); pdf.text('Impacto: ' + rec.impact, ml + 10, y); y += 5; }
          y += 4;
        });
        y += 4;
      });
    }

    // Conclusion
    if (r.conclusion) { sectionTitle('Conclusion Ejecutiva'); grayBox(r.conclusion); }

    // Final footer
    addFooter(pdf.getNumberOfPages());

    pdf.save('Contraste_ALTO_' + new Date().toISOString().slice(0, 10) + '.pdf');
    showContrasteStatus('PDF descargado');
  } catch (err) {
    showContrasteStatus('Error PDF: ' + err.message);
  }
}

// ── DOCX export ──────────────────────────────────────────────
async function downloadContrasteDocx() {
  const r = _contrasteResult;
  if (!r) return;
  syncContrasteEdits();
  showContrasteStatus('Generando documento Word...');
  try {
    await loadLib('docx');
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, AlignmentType, BorderStyle, WidthType, ShadingType, Header, Footer, PageNumber, PageBreak, ImageRun } = docx;
    const A = ALTO;
    const noBdr = { style: BorderStyle.NONE, size: 0, color: A.WHITE };
    const noBorders = { top: noBdr, bottom: noBdr, left: noBdr, right: noBdr };
    const children = [];
    const sp = n => new Paragraph({ spacing: { after: n || 120 }, children: [] });
    const meta = r.metadata || {};

    function govBox(t) {
      return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [200, 9160], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: A.NAVY, type: ShadingType.CLEAR }, width: { size: 200, type: WidthType.DXA }, children: [new Paragraph({ children: [] })] }), new TableCell({ borders: noBorders, shading: { fill: A.LGRAY, type: ShadingType.CLEAR }, margins: { top: 120, bottom: 120, left: 160, right: 160 }, width: { size: 9160, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: t, font: 'Calibri', size: 21, bold: true, color: A.NAVY })] })] })] })] });
    }
    function grayBox(l, t) {
      return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: A.LGRAY, type: ShadingType.CLEAR }, margins: { top: 160, bottom: 160, left: 200, right: 200 }, width: { size: 9360, type: WidthType.DXA }, children: [new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: l, font: 'Calibri', size: 16, bold: true, color: A.BLUE })] }), new Paragraph({ children: [new TextRun({ text: t, font: 'Calibri', size: 22, italics: true, color: A.DGRAY })] })] })] })] });
    }
    function secH(t) {
      return [new Paragraph({ spacing: { before: 360, after: 100 }, children: [new TextRun({ text: t.toUpperCase(), font: 'Calibri', size: 24, bold: true, color: A.NAVY })] }), new Paragraph({ spacing: { after: 60 }, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: A.MGRAY, space: 1 } }, children: [] })];
    }
    function blt(t, c) {
      return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [360, 9000], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, width: { size: 360, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 0 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '\u25B8', font: 'Calibri', size: 20, color: c || A.RED })] })] }), new TableCell({ borders: noBorders, width: { size: 9000, type: WidthType.DXA }, margins: { top: 40, bottom: 40, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: t, font: 'Calibri', size: 21, color: A.DGRAY })] })] })] })] });
    }
    function swBox(t) {
      return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [new TableRow({ children: [new TableCell({ borders: { top: { style: BorderStyle.SINGLE, size: 1, color: A.RED }, bottom: { style: BorderStyle.SINGLE, size: 1, color: A.RED }, left: { style: BorderStyle.SINGLE, size: 4, color: A.RED }, right: { style: BorderStyle.SINGLE, size: 1, color: A.RED } }, margins: { top: 100, bottom: 100, left: 160, right: 160 }, width: { size: 9360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: 'So what?  ', font: 'Calibri', size: 20, bold: true, color: A.RED }), new TextRun({ text: t, font: 'Calibri', size: 20, italics: true, color: A.SGRAY })] })] })] })] });
    }
    function numS(n, t) {
      return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [600, 8760], rows: [new TableRow({ children: [new TableCell({ borders: noBorders, shading: { fill: A.NAVY, type: ShadingType.CLEAR }, width: { size: 600, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 80, right: 80 }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(n), font: 'Calibri', size: 22, bold: true, color: A.WHITE })] })] }), new TableCell({ borders: noBorders, shading: { fill: A.LGRAY, type: ShadingType.CLEAR }, width: { size: 8760, type: WidthType.DXA }, margins: { top: 100, bottom: 100, left: 160, right: 160 }, children: [new Paragraph({ children: [new TextRun({ text: t, font: 'Calibri', size: 21, color: A.DGRAY })] })] })] })] });
    }

    // Cover
    children.push(sp(1200));
    if (typeof logoBase64 !== 'undefined' && logoBase64) {
      try {
        const logoBytes = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
        children.push(new Paragraph({ children: [new ImageRun({ data: logoBytes, transformation: { width: 200, height: 79 }, type: 'png' })] }));
      } catch (e) {
        children.push(new Paragraph({ children: [new TextRun({ text: 'ALTO', font: 'Calibri', size: 40, bold: true, color: A.RED })] }));
      }
    }
    children.push(sp(400));
    children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: r.title || 'Contraste Multifuente', font: 'Calibri', size: 56, bold: true, color: A.NAVY })] }));
    if (r.subtitle) children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: r.subtitle, font: 'Calibri', size: 28, italics: true, color: A.SGRAY })] }));
    children.push(new Paragraph({ spacing: { before: 200, after: 200 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: A.RED, space: 1 } }, children: [] }));
    if (r.sponsor) children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Solicitante: ', font: 'Calibri', size: 20, bold: true, color: A.SGRAY }), new TextRun({ text: r.sponsor, font: 'Calibri', size: 20, color: A.NAVY })] }));
    if (r.scope) children.push(new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: 'Alcance: ', font: 'Calibri', size: 20, bold: true, color: A.SGRAY }), new TextRun({ text: r.scope, font: 'Calibri', size: 20, color: A.NAVY })] }));
    children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: 'CONFIDENCIAL', font: 'Calibri', size: 18, bold: true, color: A.NAVY })] }));
    children.push(new Paragraph({ spacing: { after: 600 }, children: [new TextRun({ text: meta.report_date || new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' }), font: 'Calibri', size: 20, color: A.SGRAY })] }));
    children.push(new Paragraph({ children: [new PageBreak()] }));

    // Ficha Tecnica
    children.push(...secH('Ficha Tecnica del Contraste'));
    [['Fecha del informe', meta.report_date], ['Responsable del levantamiento', meta.fieldwork_lead], ['Pais / Geografia', meta.country], ['Tipo de contraste', formatCmTokenLabel(meta.contrast_type)], ['Nivel de sensibilidad', formatCmTokenLabel(meta.sensitivity)], ['Fecha del levantamiento', meta.fieldwork_date], ['Unidad / Gerencia / Area', meta.business_unit], ['Tono solicitado', formatCmTokenLabel(meta.tone)], ['Profundidad solicitada', formatCmTokenLabel(meta.depth)]].forEach(([label, value]) => {
      if (!value) return;
      children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: label + ': ', font: 'Calibri', size: 19, bold: true, color: A.SGRAY }), new TextRun({ text: value, font: 'Calibri', size: 19, color: A.NAVY })] }));
    });
    children.push(sp(200));

    // Central Message
    if (r.central_message) { children.push(...secH('Mensaje Central')); children.push(swBox(r.central_message)); children.push(sp(200)); }

    // Executive Summary
    if (r.executive_summary) { children.push(...secH('Resumen Ejecutivo')); children.push(grayBox('RESUMEN EJECUTIVO', r.executive_summary)); children.push(sp(200)); }

    // Sources Map
    if (r.sources_map && r.sources_map.length) {
      children.push(...secH('Mapa de Fuentes Contrastadas'));
      const srcHeaderRow = new TableRow({ children: ['Fuente', 'Rol / Cargo', 'Pais / Unidad', 'Tipo'].map(h => new TableCell({ borders: noBorders, shading: { fill: A.NAVY, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: h, font: 'Calibri', size: 16, bold: true, color: A.WHITE })] })] })) });
      const srcRows = r.sources_map.map((s, idx) => new TableRow({ children: [s.name || '', s.role || '', s.unit || '', s.type || ''].map(v => new TableCell({ borders: { top: noBdr, bottom: { style: BorderStyle.SINGLE, size: 1, color: A.MGRAY }, left: noBdr, right: noBdr }, shading: { fill: idx % 2 === 0 ? A.LGRAY : A.WHITE, type: ShadingType.CLEAR }, margins: { top: 60, bottom: 60, left: 80, right: 80 }, children: [new Paragraph({ children: [new TextRun({ text: v, font: 'Calibri', size: 19, color: A.DGRAY })] })] })) }));
      children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, rows: [srcHeaderRow, ...srcRows] }));
      children.push(sp(200));
    }

    // Key Messages
    if (r.key_messages && r.key_messages.length) { children.push(...secH('Mensajes Clave')); r.key_messages.forEach(m => children.push(blt(m))); children.push(sp(200)); }

    // Methodology
    if (r.methodology) { children.push(...secH('Metodologia')); children.push(new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: r.methodology, font: 'Calibri', size: 21, color: A.DGRAY })] })); }

    // Analysis by Point
    if (r.analysis_by_point && r.analysis_by_point.length) {
      children.push(...secH('Desarrollo Analitico por Punto'));
      r.analysis_by_point.forEach((ap, idx) => {
        children.push(new Paragraph({ spacing: { before: 240, after: 80 }, children: [new TextRun({ text: (idx + 1) + '. ' + (ap.point || ''), font: 'Calibri', size: 24, bold: true, color: A.NAVY })] }));
        if (ap.consolidated_reading) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Lectura consolidada', font: 'Calibri', size: 16, bold: true, color: A.SGRAY })] })); children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: ap.consolidated_reading, font: 'Calibri', size: 21, color: A.DGRAY })] })); }
        if (ap.contrast) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Contraste multifuente', font: 'Calibri', size: 16, bold: true, color: A.SGRAY })] })); children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: ap.contrast, font: 'Calibri', size: 21, color: A.DGRAY })] })); }
        if (ap.convergences && ap.convergences.length) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Convergencias', font: 'Calibri', size: 16, bold: true, color: '4279B0' })] })); ap.convergences.forEach(c => children.push(blt(c, '4279B0'))); }
        if (ap.divergences && ap.divergences.length) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Divergencias', font: 'Calibri', size: 16, bold: true, color: A.RED })] })); ap.divergences.forEach(d => children.push(blt(d, A.RED))); }
        if (ap.gaps && ap.gaps.length) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: 'Vacios de informacion', font: 'Calibri', size: 16, bold: true, color: A.SGRAY })] })); ap.gaps.forEach(g => children.push(blt(g, A.SGRAY))); }
        if (ap.executive_finding) { children.push(govBox(ap.executive_finding)); children.push(sp(80)); }
        if (ap.implication) { children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Implicancia: ', font: 'Calibri', size: 19, bold: true, color: A.RED }), new TextRun({ text: ap.implication, font: 'Calibri', size: 19, color: A.BODY })] })); }
        if (ap.risk_opportunity) { children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: 'Riesgo / Oportunidad: ', font: 'Calibri', size: 19, bold: true, color: A.NAVY }), new TextRun({ text: ap.risk_opportunity, font: 'Calibri', size: 19, color: A.BODY })] })); }
        if (ap.next_step) { children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Proximo paso: ', font: 'Calibri', size: 19, bold: true, color: '4279B0' }), new TextRun({ text: ap.next_step, font: 'Calibri', size: 19, color: A.BODY })] })); }
        children.push(sp(160));
      });
    }

    // Comparison Matrix
    if (r.comparison_matrix && r.comparison_matrix.length) {
      children.push(...secH('Matriz Comparativa Consolidada'));
      r.comparison_matrix.forEach((row, idx) => {
        children.push(new Paragraph({ spacing: { before: 160, after: 60 }, children: [new TextRun({ text: (idx+1) + '. ' + (row.point || ''), font: 'Calibri', size: 22, bold: true, color: A.NAVY })] }));
        Object.entries(row.source_views || {}).forEach(([src, view]) => {
          children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: src + ': ', font: 'Calibri', size: 19, bold: true, color: '4279B0' }), new TextRun({ text: String(view), font: 'Calibri', size: 19, color: A.DGRAY })] }));
        });
        if (row.convergence_divergence) children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: 'Conv/Div: ', font: 'Calibri', size: 19, bold: true, color: A.SGRAY }), new TextRun({ text: row.convergence_divergence, font: 'Calibri', size: 19, color: A.DGRAY })] }));
        if (row.preliminary_finding) children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: 'Hallazgo: ', font: 'Calibri', size: 19, bold: true, color: A.NAVY }), new TextRun({ text: row.preliminary_finding, font: 'Calibri', size: 19, color: A.DGRAY })] }));
        if (row.risk_opportunity) children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 360 }, children: [new TextRun({ text: 'Riesgo/Op: ', font: 'Calibri', size: 19, bold: true, color: A.RED }), new TextRun({ text: row.risk_opportunity, font: 'Calibri', size: 19, color: A.DGRAY })] }));
        if (row.suggested_action) children.push(new Paragraph({ spacing: { after: 80 }, indent: { left: 360 }, children: [new TextRun({ text: 'Accion: ', font: 'Calibri', size: 19, bold: true, color: '4279B0' }), new TextRun({ text: row.suggested_action, font: 'Calibri', size: 19, color: A.DGRAY })] }));
      });
      children.push(sp(200));
    }

    // Transversal Findings
    if (r.transversal_findings && r.transversal_findings.length) { children.push(...secH('Hallazgos Transversales')); r.transversal_findings.forEach(f => children.push(blt(f, '4279B0'))); children.push(sp(200)); }

    // Risks
    if (r.risks && r.risks.length) {
      children.push(...secH('Riesgos'));
      r.risks.forEach(rk => {
        children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [9360], rows: [new TableRow({ children: [new TableCell({ borders: { top: noBdr, bottom: noBdr, left: { style: BorderStyle.SINGLE, size: 4, color: A.RED }, right: noBdr }, margins: { top: 100, bottom: 100, left: 160, right: 160 }, width: { size: 9360, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: rk.risk || '', font: 'Calibri', size: 21, bold: true, color: A.RED })] }), new Paragraph({ children: [new TextRun({ text: rk.nature || '', font: 'Calibri', size: 20, color: A.SGRAY })] })] })] })] }));
        children.push(sp(100));
      });
      children.push(sp(200));
    }

    // Opportunities
    if (r.opportunities && r.opportunities.length) {
      children.push(...secH('Oportunidades'));
      r.opportunities.forEach(op => {
        children.push(blt(op.opportunity || '', '4279B0'));
        if (op.improvement_type) children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: op.improvement_type, font: 'Calibri', size: 17, italics: true, color: '4279B0' })] }));
      });
      children.push(sp(200));
    }

    // Recommendations
    if (r.recommendations) {
      children.push(...secH('Recomendaciones'));
      [{ key: 'immediate', label: 'INMEDIATAS' }, { key: 'short_term', label: 'CORTO PLAZO' }, { key: 'structural', label: 'ESTRUCTURALES' }].forEach(hz => {
        const items = r.recommendations[hz.key];
        if (!items || !items.length) return;
        children.push(new Paragraph({ spacing: { before: 200, after: 100 }, children: [new TextRun({ text: hz.label, font: 'Calibri', size: 20, bold: true, color: A.BLUE })] }));
        items.forEach((rec, idx) => {
          children.push(numS(idx + 1, rec.action || ''));
          if (rec.rationale) children.push(new Paragraph({ spacing: { after: 40 }, indent: { left: 720 }, children: [new TextRun({ text: rec.rationale, font: 'Calibri', size: 19, color: A.SGRAY, italics: true })] }));
          if (rec.impact) children.push(new Paragraph({ spacing: { after: 120 }, indent: { left: 720 }, children: [new TextRun({ text: 'Impacto: ', font: 'Calibri', size: 19, bold: true, color: A.RED }), new TextRun({ text: rec.impact, font: 'Calibri', size: 19, color: A.BODY })] }));
        });
      });
      children.push(sp(200));
    }

    // Conclusion
    if (r.conclusion) { children.push(...secH('Conclusion Ejecutiva')); children.push(grayBox('CONCLUSION', r.conclusion)); }

    // Assemble document
    const doc = new Document({
      styles: { default: { document: { run: { font: 'Calibri', size: 22 } } } },
      sections: [{
        properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
        headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: A.RED, space: 4 } }, children: [new TextRun({ text: 'CONFIDENCIAL  |  ', font: 'Calibri', size: 14, color: '999999' }), new TextRun({ text: 'ALTO', font: 'Calibri', size: 14, bold: true, color: A.RED })] })] }) },
        footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, border: { top: { style: BorderStyle.SINGLE, size: 1, color: A.MGRAY, space: 4 } }, children: [new TextRun({ text: 'Pagina ', font: 'Calibri', size: 16, color: '999999' }), new TextRun({ children: [PageNumber.CURRENT], font: 'Calibri', size: 16, color: '999999' })] })] }) },
        children
      }]
    });

    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Contraste_ALTO_' + new Date().toISOString().slice(0, 10) + '.docx';
    a.click();
    URL.revokeObjectURL(url);
    showContrasteStatus('Documento Word descargado');
  } catch (err) {
    console.error(err);
    showContrasteStatus('Error DOCX: ' + err.message);
  }
}

// ── Markdown copy ─────────────────────────────────────────────
function copyContrasteMarkdown() {
  const r = _contrasteResult;
  if (!r) return;
  syncContrasteEdits();
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
