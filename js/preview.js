// ============================================================
// PREVIEW — Editable report preview rendering
// Depends on: state.js, ui-helpers.js (esc, t, flash)
// ============================================================

// ============================================================
// EDITABLE PREVIEW (ALTO branded)
// ============================================================
function ed(path) {
  const val = getPath(result, path) || '';
  return `<span class="editable" contenteditable="true" data-path="${path}" onblur="updateField(this)">${esc(val)}</span>`;
}
function getPath(o, p) {
  return p.split('.').reduce((c, k) => {
    if (c === null || c === undefined) return undefined;
    const m = k.match(/^(.+)\[(\d+)\]$/);
    return m ? (c[m[1]] || [])[parseInt(m[2])] : c[k];
  }, o);
}
function setPath(o, p, v) {
  const parts = p.split('.');
  let c = o;
  for (let i = 0; i < parts.length - 1; i++) {
    const m = parts[i].match(/^(.+)\[(\d+)\]$/);
    c = m ? c[m[1]][parseInt(m[2])] : c[parts[i]];
  }
  const l = parts[parts.length - 1];
  const lm = l.match(/^(.+)\[(\d+)\]$/);
  if (lm) c[lm[1]][parseInt(lm[2])] = v;
  else c[l] = v;
}
function updateField(el) {
  setPath(result, el.dataset.path, el.textContent.trim());
  autoSaveEdit();
}
function resetEdits() {
  if (originalResult) {
    result = cloneData(originalResult);
    renderPreview(result);
    flash('Restaurado');
  }
}

function renderPreview(r) {
  document.getElementById('methodCards').classList.add('hidden');
  document.getElementById('editBanner').classList.remove('hidden');
  const card = document.getElementById('previewCard');
  card.classList.remove('hidden');
  card.style.animation = 'none';
  void card.offsetHeight;
  card.style.animation = '';
  let h = `<div id="reportContent" class="bg-white overflow-hidden fade-in" style="box-shadow:0 2px 40px rgba(4,22,39,0.08)">`;

  // ── Cover bar ──────────────────────────────────────────────
  h += `<div class="flex items-center justify-between px-8 py-4 bg-[#1A3350]">
    <div class="flex items-center gap-3">
      <span class="font-['Manrope'] font-black text-white text-xs tracking-widest uppercase">ALTO</span>
      <div class="w-px h-4 bg-white/20"></div>
      <span class="font-['Inter'] text-[10px] text-slate-400 tracking-wide uppercase">${t('confidential')}</span>
    </div>
    <span class="font-['Inter'] italic text-[10px] text-slate-500">${new Date().toLocaleDateString('es-CL', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
  </div>`;

  // ── Title block ────────────────────────────────────────────
  h += `<div class="px-10 pt-10 pb-8 border-b border-[#E0E3E5]">
    <span class="font-['Inter'] text-[#E74243] font-bold tracking-[0.25em] uppercase text-[10px] mb-3 block">${t('analysisLabel')}</span>
    <h1 class="font-['Manrope'] text-3xl font-extrabold text-[#1A3350] leading-tight tracking-tight editable" contenteditable="true" data-path="title" onblur="updateField(this)">${esc(r.title)}</h1>`;
  if (r.subtitle)
    h += `<p class="font-['Inter'] text-sm text-slate-500 italic mt-2 editable" contenteditable="true" data-path="subtitle" onblur="updateField(this)">${esc(r.subtitle)}</p>`;
  h += `<div class="w-16 h-0.5 bg-[#E74243] mt-5"></div></div>`;

  // ── Review toolbar (QA + Adversarial) ──────────────────────
  h += `<div class="px-10 py-4 border-b border-[#E0E3E5] flex items-center gap-3 flex-wrap bg-[#F8F9FB]">
    <button id="qaReviewBtn" class="regen-btn" onclick="runQAReview()">
      <span class="material-symbols-outlined" style="font-size:14px">fact_check</span>${t('qaReviewBtn')}
    </button>
    <button id="advReviewBtn" class="regen-btn" onclick="runAdversarial()">
      <span class="material-symbols-outlined" style="font-size:14px">whatshot</span>${t('advReviewBtn')}
    </button>
    <div id="qaBadgeSlot" class="flex items-center gap-2"></div>
  </div>
  <div id="qaDetailSlot"></div>
  <div id="advDetailSlot"></div>`;

  // ── Executive Summary — So What box ───────────────────────
  h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
    <div class="flex items-center justify-between mb-4">
      <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#E74243] font-bold">${t('execSummary')}</span>
      <button class="regen-btn" onclick="regenSection('executive_summary',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
    </div>
    <div class="flex gap-0">
      <div class="accent-bar self-stretch"></div>
      <div class="bg-[#F2F4F6] flex-1 p-6">
        <p class="font-['Inter'] italic text-base leading-relaxed text-[#1A3350] editable" contenteditable="true" data-path="executive_summary" onblur="updateField(this)">${esc(r.executive_summary)}</p>
      </div>
    </div>
  </div>`;

  // ── Key Messages ───────────────────────────────────────────
  if (r.key_messages?.length) {
    h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('keyMessages')}</h2>
        <button class="regen-btn" onclick="regenSection('key_messages',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="space-y-3">`;
    r.key_messages.forEach((m, i) => {
      h += `<div class="flex gap-3 items-start">
        <span class="font-['Inter'] text-[#E74243] font-black text-xs mt-0.5 select-none">▸</span>
        <span class="font-['Inter'] text-sm text-[#191C1E] leading-snug editable" contenteditable="true" data-path="key_messages[${i}]" onblur="updateField(this)">${esc(m)}</span>
      </div>`;
    });
    h += `</div></div>`;
  }

  // ── Context ────────────────────────────────────────────────
  if (r.context) {
    h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('context')}</h2>
        <button class="regen-btn" onclick="regenSection('context',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <p class="font-['Inter'] text-sm text-[#44474C] leading-relaxed editable" contenteditable="true" data-path="context" onblur="updateField(this)">${esc(r.context)}</p>
    </div>`;
  }

  // ── Findings ───────────────────────────────────────────────
  if (r.findings?.length) {
    h += `<div class="px-10 py-8 border-b border-[#E0E3E5] section-collapsible">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3 cursor-pointer select-none flex-1" onclick="this.closest('.section-collapsible').classList.toggle('collapsed')">
          <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('findings')}</h2>
          <span class="collapse-icon material-symbols-outlined text-sm text-slate-400">expand_more</span>
        </div>
        <button class="regen-btn" onclick="event.stopPropagation();regenSection('findings',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="section-body" style="max-height:2000px">
      <div class="space-y-5">`;
    r.findings.forEach((f, i) => {
      h += `<div class="grid grid-cols-12 gap-0 finding-card">
        <div class="col-span-1 bg-[#1A3350] flex items-center justify-center py-4">
          <span class="font-['Manrope'] font-black text-white text-sm">${i + 1}</span>
        </div>
        <div class="col-span-11 bg-[#F8F9FB] p-5 border-b-2 border-[#E74243]">
          <p class="font-['Manrope'] font-bold text-sm text-[#1A3350] mb-2 editable" contenteditable="true" data-path="findings[${i}].finding" onblur="updateField(this)">${esc(f.finding)}</p>
          <p class="font-['Inter'] text-xs text-slate-500 mb-1.5"><strong>${t('evidence')}:</strong> <span class="editable" contenteditable="true" data-path="findings[${i}].evidence" onblur="updateField(this)">${esc(f.evidence)}</span></p>
          <p class="font-['Inter'] text-xs text-[#E74243] font-medium"><strong>${t('implication')}:</strong> <span class="editable" contenteditable="true" data-path="findings[${i}].business_implication" onblur="updateField(this)">${esc(f.business_implication)}</span></p>
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // ── Analysis blocks ────────────────────────────────────────
  if (r.analysis_blocks?.length) {
    r.analysis_blocks.forEach((s, i) => {
      h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
        <div class="flex items-start justify-between mb-5">
          <div class="flex items-start gap-0 flex-1">
            <div class="accent-bar self-stretch mr-5"></div>
            <div>
              <span class="font-['Inter'] text-[#E74243] text-[10px] uppercase tracking-widest font-bold">${i + 1}. ${t('analysis')}</span>
              <h2 class="font-['Manrope'] text-lg font-bold text-[#1A3350] mt-1 editable" contenteditable="true" data-path="analysis_blocks[${i}].heading" onblur="updateField(this)">${esc(s.heading)}</h2>
            </div>
          </div>
          <button class="regen-btn" onclick="regenSection('analysis_blocks',${i},this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
        </div>`;
      if (s.governing_thought) {
        h += `<div class="bg-[#1A3350] text-white p-5 mb-5">
          <p class="font-['Manrope'] font-bold text-sm leading-snug editable" contenteditable="true" data-path="analysis_blocks[${i}].governing_thought" onblur="updateField(this)">${esc(s.governing_thought)}</p>
        </div>`;
      }
      if (s.content) {
        h += `<p class="font-['Inter'] text-sm text-[#44474C] leading-relaxed mb-4 editable" contenteditable="true" data-path="analysis_blocks[${i}].content" onblur="updateField(this)">${esc(s.content)}</p>`;
      }
      if (s.bullets?.length) {
        s.bullets.forEach((b, j) => {
          h += `<div class="flex gap-3 mb-2 items-start pl-2"><span class="text-[#E74243] font-black text-xs select-none mt-0.5">▸</span><span class="font-['Inter'] text-sm text-[#191C1E] editable" contenteditable="true" data-path="analysis_blocks[${i}].bullets[${j}]" onblur="updateField(this)">${esc(b)}</span></div>`;
        });
      }
      if (s.so_what) {
        h += `<div class="flex gap-0 mt-5 so-what-box">
          <div style="width:3px;background:#E74243;flex-shrink:0"></div>
          <div class="bg-[#FFF5F5] flex-1 px-5 py-3">
            <span class="font-['Inter'] text-[10px] font-bold text-[#E74243] uppercase tracking-widest">So what?  </span>
            <span class="font-['Inter'] text-xs italic text-slate-600 editable" contenteditable="true" data-path="analysis_blocks[${i}].so_what" onblur="updateField(this)">${esc(s.so_what)}</span>
          </div>
        </div>`;
      }
      h += `</div>`;
    });
  }

  // ── Risks ──────────────────────────────────────────────────
  if (r.risks?.length) {
    h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#E74243] font-bold">${t('risks')}</h2>
        <button class="regen-btn" onclick="regenSection('risks',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="space-y-3">`;
    r.risks.forEach((rk, i) => {
      h += `<div class="flex gap-0">
        <div style="width:3px;background:#E74243;flex-shrink:0"></div>
        <div class="bg-[#FFF5F5] flex-1 px-5 py-4">
          <p class="font-['Manrope'] font-bold text-sm text-[#E74243] mb-1 editable" contenteditable="true" data-path="risks[${i}].risk" onblur="updateField(this)">${esc(rk.risk)}</p>
          <p class="font-['Inter'] text-xs text-slate-500 editable" contenteditable="true" data-path="risks[${i}].implication" onblur="updateField(this)">${esc(rk.implication)}</p>
        </div>
      </div>`;
    });
    h += `</div></div>`;
  }

  // ── Opportunities ──────────────────────────────────────────
  if (r.opportunities?.length) {
    h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('opportunities')}</h2>
        <button class="regen-btn" onclick="regenSection('opportunities',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="space-y-2">`;
    r.opportunities.forEach((o, i) => {
      h += `<div class="flex gap-3 items-start"><span class="font-['Inter'] text-[#4174B9] font-black text-xs select-none mt-0.5">✦</span><span class="font-['Inter'] text-sm text-[#191C1E] editable" contenteditable="true" data-path="opportunities[${i}]" onblur="updateField(this)">${esc(o)}</span></div>`;
    });
    h += `</div></div>`;
  }

  // ── Recommendations ────────────────────────────────────────
  if (r.recommendations) {
    h += `<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('recommendations')}</h2>
        <button class="regen-btn" onclick="regenSection('recommendations',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>`;
    [
      { key: 'short_term', label: t('shortTerm'), color: '#E74243' },
      { key: 'medium_term', label: t('mediumTerm'), color: '#1A3350' },
      { key: 'long_term', label: t('longTerm'), color: '#2A313E' },
    ].forEach(hz => {
      const items = r.recommendations[hz.key];
      if (!items?.length) return;
      h += `<div class="mb-6">
        <div class="inline-block font-['Inter'] text-[9px] uppercase tracking-widest font-bold text-white px-3 py-1 mb-4" style="background:${hz.color}">${hz.label}</div>`;
      items.forEach((rec, i) => {
        h += `<div class="flex gap-0 mb-3">
          <div class="w-7 h-7 flex items-center justify-center flex-shrink-0 font-['Manrope'] font-black text-xs text-white" style="background:${hz.color}">${i + 1}</div>
          <div class="bg-[#F8F9FB] flex-1 px-5 py-3">
            <p class="font-['Manrope'] font-bold text-sm text-[#1A3350] editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].action" onblur="updateField(this)">${esc(rec.action)}</p>
            <p class="font-['Inter'] text-xs text-slate-500 italic mt-1 editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].rationale" onblur="updateField(this)">${esc(rec.rationale)}</p>
            <p class="font-['Inter'] text-xs font-medium mt-1" style="color:${hz.color}">${t('impact')}: <span class="editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].impact" onblur="updateField(this)">${esc(rec.impact)}</span></p>
          </div>
        </div>`;
      });
      h += `</div>`;
    });
    h += `</div>`;
  }

  // ── Info gaps ──────────────────────────────────────────────
  if (r.information_gaps?.length) {
    h += `<div class="px-10 py-7 border-b border-[#E0E3E5]">
      <div class="flex gap-0">
        <div style="width:4px;background:#4174B9;flex-shrink:0"></div>
        <div class="flex-1 pl-6">
          <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#4174B9] font-bold block mb-4">${t('infoGaps')}</span>
          <div class="space-y-2.5">`;
    r.information_gaps.forEach((g, i) => {
      h += `<div class="flex gap-3 items-start"><span class="material-symbols-outlined text-[14px] text-[#4174B9] select-none mt-0.5" style="font-variation-settings:'FILL' 0">info</span><span class="font-['Inter'] text-sm text-[#44474C] editable" contenteditable="true" data-path="information_gaps[${i}]" onblur="updateField(this)">${esc(g)}</span></div>`;
    });
    h += `</div></div></div></div>`;
  }

  // ── Conclusion ─────────────────────────────────────────────
  if (r.conclusion) {
    h += `<div class="px-10 py-8">
      <div class="flex items-center justify-between mb-4">
        <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('conclusion')}</span>
        <button class="regen-btn" onclick="regenSection('conclusion',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="flex gap-0">
        <div style="width:4px;background:#1A3350;flex-shrink:0"></div>
        <div class="bg-[#F2F4F6] flex-1 p-6">
          <p class="font-['Manrope'] italic text-base leading-relaxed text-[#1A3350] font-semibold editable" contenteditable="true" data-path="conclusion" onblur="updateField(this)">${esc(r.conclusion)}</p>
        </div>
      </div>
    </div>`;
  }

  h += `</div>`;
  card.innerHTML = h;
}

// ============================================================
// QA REVIEW — badge + detail rendering
// ============================================================
async function runQAReview() {
  const btn = document.getElementById('qaReviewBtn');
  const slot = document.getElementById('qaBadgeSlot');
  const detail = document.getElementById('qaDetailSlot');
  if (!result || !btn || !slot) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px">progress_activity</span>${t('qaRunning')}`;
  try {
    const qa = await qaReview(result);
    window._qaResult = qa;
    renderQABadge(qa);
    renderQADetail(qa);
  } catch (err) {
    flash(t('qaError') + ': ' + (err.message || err));
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

function qaScoreColor(avg) {
  if (avg >= 8.5) return '#166534';
  if (avg >= 7) return '#4174B9';
  if (avg >= 5.5) return '#B45309';
  return '#E74243';
}

function renderQABadge(qa) {
  const slot = document.getElementById('qaBadgeSlot');
  if (!slot) return;
  const avg = Number(qa.average || 0).toFixed(1);
  const color = qaScoreColor(Number(qa.average || 0));
  const verdict = esc(qa.verdict || '');
  slot.innerHTML = `<span class="inline-flex items-center gap-2 px-3 py-1.5 font-['Inter'] text-xs font-bold text-white rounded" style="background:${color}">
    <span class="material-symbols-outlined" style="font-size:14px">verified</span>
    ${t('qaScore')}: ${avg}/10
  </span>
  <span class="font-['Inter'] text-[10px] uppercase tracking-widest" style="color:${color}">${verdict.replace(/_/g, ' ')}</span>
  <button class="font-['Inter'] text-[10px] text-[#4174B9] underline" onclick="toggleQADetail()">${t('qaDetails')}</button>`;
}

function toggleQADetail() {
  const d = document.getElementById('qaDetailSlot');
  if (d) d.classList.toggle('hidden');
}

function renderQADetail(qa) {
  const d = document.getElementById('qaDetailSlot');
  if (!d) return;
  const catLabels = {
    mece: 'MECE',
    so_what: 'So What',
    actionability: t('qaActionability'),
    evidence_rigor: t('qaEvidence'),
    executive_tone: t('qaTone'),
    balance: t('qaBalance'),
    internal_consistency: t('qaConsistency'),
    specificity: t('qaSpecificity'),
  };
  let h = `<div class="px-10 py-6 border-b border-[#E0E3E5] bg-[#F8F9FB]">
    <h3 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold mb-4">${t('qaDetailTitle')}</h3>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">`;
  Object.entries(qa.scores || {}).forEach(([k, v]) => {
    const label = catLabels[k] || k;
    const c = qaScoreColor(Number(v));
    h += `<div class="bg-white p-3 border-l-4" style="border-color:${c}">
      <div class="font-['Inter'] text-[9px] uppercase tracking-widest text-slate-500">${esc(label)}</div>
      <div class="font-['Manrope'] text-xl font-black" style="color:${c}">${Number(v).toFixed(1)}</div>
    </div>`;
  });
  h += `</div>`;
  if (qa.strengths?.length) {
    h += `<div class="mb-4"><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#166534] font-bold mb-2">${t('qaStrengths')}</div>`;
    qa.strengths.forEach(s => {
      h += `<div class="flex gap-2 items-start mb-1"><span class="text-[#166534] font-black text-xs mt-0.5">✓</span><span class="font-['Inter'] text-xs text-[#191C1E]">${esc(s)}</span></div>`;
    });
    h += `</div>`;
  }
  if (qa.weaknesses?.length) {
    h += `<div class="mb-4"><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#E74243] font-bold mb-2">${t('qaWeaknesses')}</div>`;
    qa.weaknesses.forEach(s => {
      h += `<div class="flex gap-2 items-start mb-1"><span class="text-[#E74243] font-black text-xs mt-0.5">▸</span><span class="font-['Inter'] text-xs text-[#191C1E]">${esc(s)}</span></div>`;
    });
    h += `</div>`;
  }
  if (qa.flags?.length) {
    h += `<div><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#B45309] font-bold mb-2">${t('qaFlags')}</div>`;
    qa.flags.forEach(f => {
      const sev = f.severity === 'critical' ? '#E74243' : '#B45309';
      h += `<div class="flex gap-2 items-start mb-1.5">
        <span class="material-symbols-outlined" style="font-size:13px;color:${sev};margin-top:1px">${f.severity === 'critical' ? 'error' : 'warning'}</span>
        <div class="font-['Inter'] text-xs"><strong style="color:${sev}">[${esc(f.category || '')}]</strong> ${esc(f.message || '')}</div>
      </div>`;
    });
    h += `</div>`;
  }
  h += `</div>`;
  d.innerHTML = h;
  d.classList.remove('hidden');
}

// ============================================================
// ADVERSARIAL — stress-test rendering
// ============================================================
async function runAdversarial() {
  const btn = document.getElementById('advReviewBtn');
  const slot = document.getElementById('advDetailSlot');
  if (!result || !btn || !slot) return;
  const original = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:14px">progress_activity</span>${t('advRunning')}`;
  try {
    const adv = await adversarialReview(result);
    window._advResult = adv;
    renderAdversarial(adv);
  } catch (err) {
    flash(t('advError') + ': ' + (err.message || err));
  } finally {
    btn.disabled = false;
    btn.innerHTML = original;
  }
}

function renderAdversarial(adv) {
  const d = document.getElementById('advDetailSlot');
  if (!d) return;
  let h = `<div class="px-10 py-6 border-b border-[#E0E3E5] bg-[#FFF5F5]">
    <div class="flex items-center gap-2 mb-4">
      <span class="material-symbols-outlined" style="font-size:18px;color:#E74243">whatshot</span>
      <h3 class="font-['Manrope'] text-[11px] uppercase tracking-widest text-[#E74243] font-bold">${t('advTitle')}</h3>
    </div>`;
  if (adv.overall_assessment) {
    h += `<div class="mb-5 p-4 bg-white border-l-4 border-[#E74243]">
      <div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#E74243] font-bold mb-1">${t('advVerdict')}</div>
      <p class="font-['Manrope'] italic text-sm text-[#1A3350]">${esc(adv.overall_assessment)}</p>
    </div>`;
  }
  if (adv.weaknesses?.length) {
    h += `<div class="mb-5"><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#E74243] font-bold mb-2">${t('advWeaknesses')}</div>`;
    adv.weaknesses.forEach(w => {
      h += `<div class="mb-3 p-3 bg-white border-l-2 border-[#E74243]">
        <div class="font-['Manrope'] font-bold text-sm text-[#1A3350]">${esc(w.point || '')} ${w.section ? `<span class="font-['Inter'] text-[10px] uppercase text-slate-400 ml-2">${esc(w.section)}</span>` : ''}</div>
        <p class="font-['Inter'] text-xs text-[#44474C] mt-1">${esc(w.explanation || '')}</p>
      </div>`;
    });
    h += `</div>`;
  }
  if (adv.counter_arguments?.length) {
    h += `<div class="mb-5"><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold mb-2">${t('advCounters')}</div>`;
    adv.counter_arguments.forEach(c => {
      h += `<div class="mb-2 p-3 bg-white border-l-2 border-[#4174B9]">
        <p class="font-['Inter'] text-xs text-[#191C1E]">${esc(c.argument || '')}</p>
        ${c.targets ? `<p class="font-['Inter'] text-[10px] italic text-slate-500 mt-1">→ ${esc(c.targets)}</p>` : ''}
      </div>`;
    });
    h += `</div>`;
  }
  if (adv.stress_questions?.length) {
    h += `<div class="mb-5"><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold mb-2">${t('advQuestions')}</div>`;
    adv.stress_questions.forEach(q => {
      h += `<div class="flex gap-2 items-start mb-2"><span class="text-[#E74243] font-black mt-0.5">?</span><span class="font-['Inter'] text-sm italic text-[#1A3350]">${esc(q)}</span></div>`;
    });
    h += `</div>`;
  }
  if (adv.fragile_assumptions?.length) {
    h += `<div><div class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#B45309] font-bold mb-2">${t('advAssumptions')}</div>`;
    adv.fragile_assumptions.forEach(a => {
      h += `<div class="flex gap-2 items-start mb-1"><span class="material-symbols-outlined" style="font-size:13px;color:#B45309;margin-top:1px">warning</span><span class="font-['Inter'] text-xs text-[#191C1E]">${esc(a)}</span></div>`;
    });
    h += `</div>`;
  }
  h += `</div>`;
  d.innerHTML = h;
}

// ── Chart Utilities ──
function extractNumbers(r) {
  const nums = [];
  const pctRegex = /(\d+[\.,]?\d*)\s*%/g;
  const numRegex =
    /(\d+[\.,]?\d*)\s*(eventos|expedientes|tiendas|casos|guardias|sentencias|meses|d\u00edas|semanas|millones|M|K|USD|\$|CLP|MXN)/gi;
  const allText = [
    r.executive_summary,
    r.context,
    ...(r.findings || []).map(f => f.finding + ' ' + f.evidence + ' ' + f.business_implication),
    ...(r.analysis_blocks || []).map(
      b => (b.content || '') + ' ' + (b.governing_thought || '') + ' ' + (b.bullets || []).join(' ')
    ),
    ...(r.key_messages || []),
  ]
    .filter(Boolean)
    .join(' ');
  let m;
  while ((m = pctRegex.exec(allText)) !== null) {
    const val = m[1].replace(',', '.');
    const before = allText.substring(Math.max(0, m.index - 80), m.index).trim();
    const words = before.split(/\s+/).slice(-6).join(' ');
    nums.push({ value: m[0], raw: val, label: words || 'Porcentaje' });
  }
  while ((m = numRegex.exec(allText)) !== null) {
    const val = m[1].replace(',', '.');
    const unit = m[2];
    const before = allText.substring(Math.max(0, m.index - 60), m.index).trim();
    const words = before.split(/\s+/).slice(-4).join(' ');
    if (!nums.some(n => n.raw === val && Math.abs(allText.indexOf(n.value) - m.index) < 10)) {
      nums.push({ value: m[1] + ' ' + unit, raw: val, label: words || unit });
    }
  }
  const seen = new Set();
  return nums
    .filter(n => {
      if (seen.has(n.value)) return false;
      seen.add(n.value);
      return true;
    })
    .slice(0, 8);
}
