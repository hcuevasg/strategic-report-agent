// ============================================================
// MINUTAS MODULE — generate, save, list, render, export DOCX
// Depends on: state.js, ui-helpers.js, fetchFromWorker (app.js)
// ============================================================


// ============================================================
// MINUTAS — Show/hide input panel
// ============================================================
function showNuevaMinuta() {
  document.getElementById('nuevaMinutaSection').style.display = 'block';
  document.getElementById('minutaInput').focus();
}

// ============================================================
// MINUTAS — Generate via Worker
// ============================================================
const MINUTAS_KEY = 'alto_minutas_history';

async function generateMinuta() {
  const input = (document.getElementById('minutaInput').value || '').trim();
  if (!input) { flash('Ingresa las notas de la reunión'); return; }

  const btn = document.getElementById('btnGenerateMinuta');
  const prog = document.getElementById('minutaProgress');
  const progFill = document.getElementById('minutaProgressFill');
  const progLabel = document.getElementById('minutaProgressLabel');

  btn.disabled = true;
  prog.style.display = 'flex';
  progFill.style.width = '15%';
  progLabel.textContent = t('uiAnalyzingMeeting');

  let token;
  try {
    const tokenRes = await fetch(`${WORKER_URL}/token`, { credentials: 'omit' });
    if (tokenRes.ok) { const td = await tokenRes.json(); token = td.token; }
  } catch(e) {}

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['X-Session-Token'] = token;

  const sanitized = input.replace(/ignore\s+(previous\s+)?instructions?/gi,'')
                         .replace(/system\s*:/gi,'').trim();
  const body = { userContent: sanitized, reportType: 'minuta', outputLanguage };

  let accumulated = '';
  let minutaResult = null;

  try {
    progFill.style.width = '40%';
    progLabel.textContent = t('uiGeneratingMinuta');

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') break;
        try {
          const ev = JSON.parse(data);
          if (ev.text) accumulated += ev.text;
        } catch(e) {}
      }
    }

    progFill.style.width = '80%';
    progLabel.textContent = 'Procesando resultado...';

    const jsonMatch = accumulated.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No se recibió JSON válido');
    minutaResult = JSON.parse(jsonMatch[0]);

    progFill.style.width = '100%';
    progLabel.textContent = '¡Listo!';
    setTimeout(() => { prog.style.display = 'none'; progFill.style.width = '0%'; }, 1500);

    saveMinuta(minutaResult);
    document.getElementById('nuevaMinutaSection').style.display = 'none';
    renderMinutasList();
    // Auto-expand the newly saved minuta (first in list)
    const saved = loadMinutasHistory();
    if (saved.length > 0) toggleMinutaCard(saved[0].id);

  } catch(err) {
    progLabel.textContent = 'Error: ' + err.message;
    progLabel.style.color = '#E74243';
    setTimeout(() => { prog.style.display = 'none'; progLabel.style.color = '#E74243'; }, 3000);
  } finally {
    btn.disabled = false;
  }
}

// ============================================================
// MINUTAS — Save & load from localStorage
// ============================================================
function saveMinuta(r) {
  try {
    const list = loadMinutasHistory();
    const id = Date.now();
    const entry = {
      id,
      title: r.title || 'Sin título',
      date: r.date || new Date().toLocaleDateString('es-CL'), // display date (may come from AI)
      cal_date: new Date().toLocaleDateString('es-CL'),       // filter date — always JS-generated
      saved_at: new Date().toISOString(),
      data: JSON.stringify(r),
    };
    list.unshift(entry);
    if (list.length > 20) list.splice(20);
    localStorage.setItem(MINUTAS_KEY, JSON.stringify(list));
    buildCalendar(); // refresh dots
  } catch(e) {}
}

function loadMinutasHistory() {
  try { return JSON.parse(localStorage.getItem(MINUTAS_KEY) || '[]'); } catch(e) { return []; }
}

// ============================================================
// MINUTAS — Render preview (after generation)
// ============================================================
function renderMinutaPreview(r) {
  const container = document.getElementById('minutaPreviewCard');
  if (!container) return;
  container.style.display = 'block';
  container.innerHTML = buildMinutaCardHTML(r, true);
}

// ============================================================
// MINUTAS — Render saved list
// ============================================================
function filterMinutas(q) { _minutasFilter = q.toLowerCase(); renderMinutasList(); }

function renderMinutasList() {
  const container = document.getElementById('minutasList');
  if (!container) return;
  let list = loadMinutasHistory();
  if (_minutasFilter) {
    list = list.filter(m => m.title.toLowerCase().includes(_minutasFilter) || (m.cal_date||m.date||'').includes(_minutasFilter));
  }
  if (!list.length) {
    container.innerHTML = `<p style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;padding:32px 0;text-align:center;font-style:italic">${t('uiNoMinutas')}</p>`;
    return;
  }
  container.innerHTML = list.map((m, idx) => {
    let r = null;
    try { r = JSON.parse(m.data); } catch(e) {}
    const commitCount = r?.commitments?.length || 0;
    const pending     = r?.open_issues?.length || 0;
    const savedDate   = m.date || new Date(m.saved_at).toLocaleDateString('es-CL');
    const attendees   = r?.attendees?.length || 0;
    return `
    <div style="background:#fff;border-left:4px solid #1A3350;box-shadow:0 2px 12px rgba(4,22,39,0.06);margin-bottom:12px;overflow:hidden">
      <div style="padding:18px 24px;cursor:pointer" onclick="toggleMinutaCard(${m.id})">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="font-family:Manrope,sans-serif;font-size:15px;font-weight:800;color:#1A3350;line-height:1.3">${esc(m.title)}</div>
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#676766;margin-top:4px;display:flex;align-items:center;gap:6px">
              <span class="material-symbols-outlined" style="font-size:13px;color:#E74243">calendar_today</span>
              ${esc(savedDate)}${attendees ? ` &nbsp;·&nbsp; <span class="material-symbols-outlined" style="font-size:13px">group</span> ${attendees} ${t('uiAttendeesSuffix')}` : ''}
            </div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
            ${commitCount ? `<span style="font-size:10px;font-weight:700;padding:3px 10px;background:#F0FDF4;color:#16a34a;letter-spacing:.05em;text-transform:uppercase">✓ ${commitCount}</span>` : ''}
            ${pending ? `<span style="font-size:10px;font-weight:700;padding:3px 10px;background:#FFFBEB;color:#D97706;letter-spacing:.05em;text-transform:uppercase">⚠ ${pending}</span>` : ''}
            <span id="chevron-${m.id}" class="material-symbols-outlined" style="font-size:20px;color:#676766;transition:transform .2s">expand_more</span>
          </div>
        </div>
      </div>
      <div id="minuta-body-${m.id}" style="display:none">
        ${r ? buildMinutaBodyHTML(r) : ''}
      </div>
    </div>`;
  }).join('');
}

function toggleMinutaCard(id) {
  const body    = document.getElementById(`minuta-body-${id}`);
  const chevron = document.getElementById(`chevron-${id}`);
  if (!body) return;
  const open = body.style.display !== 'none';
  body.style.display    = open ? 'none' : 'block';
  if (chevron) chevron.style.transform = open ? '' : 'rotate(180deg)';
}

function buildMinutaBodyHTML(r) {
  const S = {
    section: 'font-family:Inter,sans-serif;font-size:9px;font-weight:800;color:#E74243;text-transform:uppercase;letter-spacing:.18em;margin:20px 0 10px;display:flex;align-items:center;gap:8px',
    sectionLine: 'flex:1;height:1px;background:#E74243;opacity:.25',
    body: 'padding:0 24px 20px',
  };
  const priorityStyle = p => ({
    high:   'background:#FEE2E2;color:#991B1B;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;font-family:Inter,sans-serif',
    medium: 'background:#FEF3C7;color:#92400E;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;font-family:Inter,sans-serif',
    low:    'background:#F3F4F6;color:#374151;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;font-family:Inter,sans-serif',
  }[p] || 'background:#F3F4F6;color:#374151;font-size:10px;font-weight:700;padding:2px 8px;border-radius:3px;font-family:Inter,sans-serif');
  const priorityLabel = p => p==='high'?t('uiPriorityCritical'):p==='medium'?t('uiPriorityMedium'):t('uiPriorityLow');
  const sectionHead = label => `<div style="${S.section}">${label}<div style="${S.sectionLine}"></div></div>`;

  let html = `<div style="${S.body};border-top:2px solid #F2F4F6">`;

  // Summary
  if (r.summary) {
    html += sectionHead(t('execSummary'));
    html += `<p style="font-family:Inter,sans-serif;font-size:13px;color:#44474C;line-height:1.6;margin:0 0 4px;background:#F8F9FB;border-left:3px solid #1A3350;padding:12px 14px">${esc(r.summary)}</p>`;
  }

  // Attendees
  if (r.attendees?.length) {
    const avatarColors = ['#E74243','#4174B9','#16a34a','#7c3aed','#ea580c','#0891b2'];
    html += sectionHead(t('uiAttendees'));
    html += `<div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">`;
    r.attendees.slice(0,8).forEach((a, i) => {
      const initials = a.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      html += `<div title="${esc(a)}" style="display:flex;align-items:center;gap:6px;background:#F2F4F6;border-radius:4px;padding:4px 10px 4px 6px">
        <div style="width:22px;height:22px;border-radius:50%;background:${avatarColors[i%avatarColors.length]};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:700;color:#fff">${initials}</div>
        <span style="font-family:Inter,sans-serif;font-size:11px;color:#374151;font-weight:500">${esc(a)}</span>
      </div>`;
    });
    if (r.attendees.length > 8) html += `<span style="font-family:Inter,sans-serif;font-size:11px;color:#9ca3af">+${r.attendees.length-8} más</span>`;
    html += `</div>`;
  }

  // Commitments table
  if (r.commitments?.length) {
    html += sectionHead(t('uiActionPlan'));
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead>
        <tr style="background:#1A3350">
          <th style="text-align:left;padding:8px 10px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em">${t('uiTask')}</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">${t('uiResponsible')}</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em;white-space:nowrap">${t('uiDeadline')}</th>
          <th style="text-align:left;padding:8px 10px;font-size:10px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.08em">${t('uiPriority')}</th>
        </tr>
      </thead>
      <tbody>`;
    r.commitments.forEach((c, i) => {
      html += `<tr style="background:${i%2===0?'#fff':'#F8F9FB'}">
        <td style="padding:9px 10px;color:#191C1E;border-bottom:1px solid #F2F4F6;font-family:Inter,sans-serif;font-size:12px;font-weight:500">${esc(c.task)}</td>
        <td style="padding:9px 10px;color:#44474C;border-bottom:1px solid #F2F4F6;font-family:Inter,sans-serif;font-size:12px;white-space:nowrap">${esc(c.responsible)}</td>
        <td style="padding:9px 10px;color:#44474C;border-bottom:1px solid #F2F4F6;font-family:Inter,sans-serif;font-size:11px;white-space:nowrap">${esc(c.deadline)}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #F2F4F6"><span style="${priorityStyle(c.priority)}">${priorityLabel(c.priority)}</span></td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }

  // Decisions
  if (r.decisions?.length) {
    html += sectionHead(t('uiDecisions'));
    r.decisions.forEach(d => {
      html += `<div style="border-left:3px solid #1A3350;padding:8px 12px;background:#F8F9FB;margin-bottom:8px">
        <div style="font-family:Inter,sans-serif;font-size:12px;font-weight:700;color:#1A3350">${esc(d.decision)}</div>
        ${d.rationale ? `<div style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;margin-top:3px">${esc(d.rationale)}</div>` : ''}
        ${d.owner ? `<div style="font-family:Inter,sans-serif;font-size:10px;color:#4174B9;margin-top:3px;font-weight:600;text-transform:uppercase;letter-spacing:.05em">${t('uiResponsibleColon')} ${esc(d.owner)}</div>` : ''}
      </div>`;
    });
  }

  // Key topics
  if (r.key_topics?.length) {
    html += sectionHead(t('uiTopics'));
    r.key_topics.forEach(topic => {
      html += `<div style="margin-bottom:8px;padding:8px 12px;border-left:3px solid #E74243;background:#FFF8F8">
        <div style="font-family:Inter,sans-serif;font-size:12px;font-weight:700;color:#1A3350">${esc(topic.topic)}</div>
        ${topic.summary ? `<div style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;margin-top:2px">${esc(topic.summary)}</div>` : ''}
        ${topic.outcome ? `<div style="font-family:Inter,sans-serif;font-size:11px;color:#16a34a;margin-top:3px;font-weight:600">→ ${esc(topic.outcome)}</div>` : ''}
      </div>`;
    });
  }

  // Open issues
  if (r.open_issues?.length) {
    html += sectionHead(t('uiOpenIssues'));
    html += `<div style="background:#FFFBEB;border:1px solid #FDE68A;padding:12px 14px">`;
    r.open_issues.forEach(i => {
      html += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;font-family:Inter,sans-serif;font-size:12px;color:#374151">
        <span style="color:#D97706;font-weight:700;margin-top:1px">⚠</span>${esc(i)}
      </div>`;
    });
    html += `</div>`;
  }

  // Next meeting
  if (r.next_meeting?.date || r.next_meeting?.objectives?.length) {
    html += sectionHead(t('uiNextMeeting'));
    if (r.next_meeting.date) html += `<div style="font-family:Inter,sans-serif;font-size:12px;color:#1A3350;font-weight:600;margin-bottom:4px">📅 ${esc(r.next_meeting.date)}</div>`;
    r.next_meeting.objectives?.forEach(o => {
      html += `<div style="font-family:Inter,sans-serif;font-size:12px;color:#44474C;margin-bottom:3px">• ${esc(o)}</div>`;
    });
  }

  // Export row
  const minutaData = JSON.stringify(r).replace(/'/g,"&#39;");
  html += `<div style="display:flex;align-items:center;gap:10px;margin-top:20px;padding-top:14px;border-top:2px solid #F2F4F6">
    <span style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;color:#676766;text-transform:uppercase;letter-spacing:.1em">${t('uiExport')}</span>
    <button onclick="downloadMinutaDocx(this)" data-minuta='${minutaData}' style="display:flex;align-items:center;gap:5px;padding:6px 12px;background:#1A3350;border:none;color:#fff;font-size:11px;font-weight:600;cursor:pointer;font-family:Inter,sans-serif;letter-spacing:.05em;transition:opacity .15s" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">
      <span class="material-symbols-outlined" style="font-size:14px">description</span>DOCX
    </button>
  </div>`;

  html += '</div>';
  return html;
}

function buildMinutaCardHTML(r, isPreview) {
  return `<div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07),0 2px 12px rgba(0,0,0,0.04);margin-bottom:12px;overflow:hidden">
    <div style="padding:16px 20px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
        <div>
          <div style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#111827">${esc(r.title)}</div>
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#9ca3af;margin-top:3px">${r.date || ''} ${r.attendees?.length ? '· '+r.attendees.length+' '+t('uiAttendeesSuffix') : ''}</div>
        </div>
        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:#dbeafe;color:#1d4ed8">${t('uiNewBadge')}</span>
      </div>
      ${r.summary ? `<p style="font-family:Inter,sans-serif;font-size:13px;color:#374151;line-height:1.5;margin:0 0 12px">${esc(r.summary)}</p>` : ''}
    </div>
    ${buildMinutaBodyHTML(r)}
  </div>`;
}

// ============================================================
// MINUTAS — DOCX export
// ============================================================
async function downloadMinutaDocx(btn) {
  let r;
  try { r = JSON.parse(btn.dataset.minuta); } catch(e) { return; }
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, AlignmentType } = docx;

  const F = 'Calibri';
  const NAVY = '1A3350', RED = 'E74243', GRAY = '44474C', LGRAY = 'F2F4F6', WHITE = 'FFFFFF';

  const sectionHeader = label => new Paragraph({
    children: [new TextRun({ text: label, bold: true, size: 18, color: RED, font: F })],
    spacing: { before: 300, after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'DDDDDD' } },
  });

  const prioLabel = p => p==='high'?'CRÍTICA':p==='medium'?'MEDIA':'BAJA';
  const prioColor = p => p==='high'?'FEE2E2':p==='medium'?'FEF3C7':'F3F4F6';

  const children = [];

  // ── Header ──
  children.push(new Paragraph({
    children: [new TextRun({ text: r.title || 'Minuta de Reunión', bold: true, size: 40, color: NAVY, font: F })],
    spacing: { after: 120 },
  }));
  const metaRuns = [];
  if (r.date) metaRuns.push(new TextRun({ text: `Fecha: ${r.date}`, size: 20, color: GRAY, font: F }));
  if (r.attendees?.length) {
    if (metaRuns.length) metaRuns.push(new TextRun({ text: '   ·   ', size: 20, color: 'AAAAAA', font: F }));
    metaRuns.push(new TextRun({ text: `Asistentes: ${r.attendees.join(', ')}`, size: 20, color: GRAY, font: F }));
  }
  if (metaRuns.length) children.push(new Paragraph({ children: metaRuns, spacing: { after: 80 } }));
  if (r.facilitator) children.push(new Paragraph({ children: [new TextRun({ text: `Facilitador: ${r.facilitator}`, size: 20, color: GRAY, font: F, italics: true })], spacing: { after: 200 } }));

  // ── Summary ──
  if (r.summary) {
    children.push(sectionHeader('RESUMEN EJECUTIVO'));
    children.push(new Paragraph({ children: [new TextRun({ text: r.summary, size: 22, font: F, color: GRAY })], spacing: { after: 200 }, indent: { left: 240 } }));
  }

  // ── Objectives ──
  if (r.objectives?.length) {
    children.push(sectionHeader('OBJETIVOS DE LA REUNIÓN'));
    r.objectives.forEach(o => children.push(new Paragraph({ children: [new TextRun({ text: `• ${o}`, size: 22, font: F, color: GRAY })], spacing: { after: 80 }, indent: { left: 240 } })));
    children.push(new Paragraph({ children: [], spacing: { after: 120 } }));
  }

  // ── Commitments table ──
  if (r.commitments?.length) {
    children.push(sectionHeader('PLAN DE ACCIÓN & COMPROMISOS'));
    const headerRow = new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'TAREA', bold: true, size: 18, color: WHITE, font: F })] })], shading: { fill: NAVY, type: ShadingType.SOLID }, width: { size: 45, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'RESPONSABLE', bold: true, size: 18, color: WHITE, font: F })] })], shading: { fill: NAVY, type: ShadingType.SOLID }, width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'FECHA LÍMITE', bold: true, size: 18, color: WHITE, font: F })] })], shading: { fill: NAVY, type: ShadingType.SOLID }, width: { size: 20, type: WidthType.PERCENTAGE } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'PRIORIDAD', bold: true, size: 18, color: WHITE, font: F })] })], shading: { fill: NAVY, type: ShadingType.SOLID }, width: { size: 15, type: WidthType.PERCENTAGE } }),
    ]});
    const dataRows = r.commitments.map((c, i) => new TableRow({ children: [
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.task||'', size: 20, font: F })] })], shading: { fill: i%2===0?'FFFFFF':'F8F9FB', type: ShadingType.SOLID } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.responsible||'', size: 20, font: F, color: GRAY })] })], shading: { fill: i%2===0?'FFFFFF':'F8F9FB', type: ShadingType.SOLID } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c.deadline||'', size: 20, font: F, color: GRAY })] })], shading: { fill: i%2===0?'FFFFFF':'F8F9FB', type: ShadingType.SOLID } }),
      new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: prioLabel(c.priority), bold: true, size: 18, font: F })] })], shading: { fill: prioColor(c.priority), type: ShadingType.SOLID } }),
    ]}));
    children.push(new Table({ rows: [headerRow, ...dataRows], width: { size: 100, type: WidthType.PERCENTAGE } }));
    children.push(new Paragraph({ children: [], spacing: { after: 200 } }));
  }

  // ── Decisions ──
  if (r.decisions?.length) {
    children.push(sectionHeader('DECISIONES'));
    r.decisions.forEach(d => {
      children.push(new Paragraph({ children: [new TextRun({ text: `• ${d.decision}`, bold: true, size: 22, font: F, color: NAVY })], spacing: { after: 60 }, indent: { left: 240 } }));
      if (d.rationale) children.push(new Paragraph({ children: [new TextRun({ text: `  ${d.rationale}`, size: 20, font: F, color: GRAY, italics: true })], spacing: { after: 60 }, indent: { left: 480 } }));
      if (d.owner) children.push(new Paragraph({ children: [new TextRun({ text: `  Responsable: ${d.owner}`, size: 18, font: F, color: '4174B9', bold: true })], spacing: { after: 120 }, indent: { left: 480 } }));
    });
  }

  // ── Key topics ──
  if (r.key_topics?.length) {
    children.push(sectionHeader('TEMAS TRATADOS'));
    r.key_topics.forEach(t => {
      children.push(new Paragraph({ children: [new TextRun({ text: t.topic, bold: true, size: 22, font: F, color: NAVY })], spacing: { after: 60 }, indent: { left: 240 } }));
      if (t.summary) children.push(new Paragraph({ children: [new TextRun({ text: t.summary, size: 20, font: F, color: GRAY })], spacing: { after: 60 }, indent: { left: 480 } }));
      if (t.outcome) children.push(new Paragraph({ children: [new TextRun({ text: `→ ${t.outcome}`, size: 20, font: F, color: '16A34A', bold: true })], spacing: { after: 120 }, indent: { left: 480 } }));
    });
  }

  // ── Open issues ──
  if (r.open_issues?.length) {
    children.push(sectionHeader('PENDIENTES'));
    r.open_issues.forEach(i => children.push(new Paragraph({ children: [new TextRun({ text: `⚠ ${i}`, size: 22, font: F, color: 'D97706' })], spacing: { after: 80 }, indent: { left: 240 } })));
    children.push(new Paragraph({ children: [], spacing: { after: 120 } }));
  }

  // ── Next meeting ──
  if (r.next_meeting?.date || r.next_meeting?.objectives?.length) {
    children.push(sectionHeader('PRÓXIMA REUNIÓN'));
    if (r.next_meeting.date) children.push(new Paragraph({ children: [new TextRun({ text: `Fecha: ${r.next_meeting.date}`, bold: true, size: 22, font: F, color: NAVY })], spacing: { after: 80 }, indent: { left: 240 } }));
    r.next_meeting.objectives?.forEach(o => children.push(new Paragraph({ children: [new TextRun({ text: `• ${o}`, size: 20, font: F, color: GRAY })], spacing: { after: 60 }, indent: { left: 480 } })));
  }

  // ── Footer note ──
  children.push(new Paragraph({ children: [new TextRun({ text: `Generado por ALTO Strategic Report Agent · ${new Date().toLocaleDateString('es-CL')}`, size: 16, color: 'AAAAAA', font: F, italics: true })], spacing: { before: 400 }, alignment: AlignmentType.RIGHT }));

  const doc = new Document({ sections: [{ children }] });
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url;
  a.download = `Minuta_ALTO_${new Date().toISOString().slice(0,10)}.docx`;
  a.click(); URL.revokeObjectURL(url);
}

// ============================================================
// Prevent accidental navigation when report is loaded
window.addEventListener('beforeunload',e=>{if(result){e.preventDefault();}});

// ── Session token for Worker auth ──
async function refreshSessionToken(){
  try{
    const res=await fetch(`${WORKER_URL}/token`);
    if(res.ok){const d=await res.json();window._sessionToken=d.token;}
  }catch(e){console.warn('Token fetch failed:',e);}
}
// Fetch token on load (after DOM ready)
setTimeout(refreshSessionToken, 500);
// Refresh token every 90 minutes
setInterval(refreshSessionToken, 90*60*1000);
