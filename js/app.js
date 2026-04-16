// ============================================================
function startProgress(){const s=document.getElementById('progressSection'),f=document.getElementById('progressFill'),st=document.getElementById('progressStep'),p=document.getElementById('progressPct');s.classList.remove('hidden');let i=0;f.style.width='0%';progressTimer=setInterval(()=>{if(i<STEPS.length){f.style.width=STEPS[i].pct+'%';st.textContent=STEPS[i].msg;p.textContent=STEPS[i].pct+'%';i++;}},2200);}
function stopProgress(ok){clearInterval(progressTimer);const f=document.getElementById('progressFill'),st=document.getElementById('progressStep'),p=document.getElementById('progressPct');if(ok){f.style.width='100%';st.textContent=t('uiCompleted');p.textContent='100%';setTimeout(()=>document.getElementById('progressSection').classList.add('hidden'),1500);}else{document.getElementById('progressSection').classList.add('hidden');}}

// ============================================================
// FILE UPLOAD
// ============================================================
const dz=document.getElementById('dropZone');
['dragenter','dragover'].forEach(e=>{dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.add('drag-over');});});
['dragleave','drop'].forEach(e=>{dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.remove('drag-over');});});
dz.addEventListener('drop',ev=>{const f=ev.dataTransfer.files[0];if(f)processFile(f);});
function handleFile(ev){const f=ev.target.files[0];if(f)processFile(f);}
async function processFile(file){const ext=file.name.split('.').pop().toLowerCase();showStatus(t('uiReading')+': '+file.name+'...');try{let txt='';window._pendingImages=null;
  if(['txt','md','csv'].includes(ext)){
    txt=await file.text();
  }else if(['png','jpg','jpeg','gif','webp'].includes(ext)){
    // Direct image upload — send as vision input
    const ab=await file.arrayBuffer();
    const base64=btoa(String.fromCharCode(...new Uint8Array(ab)));
    const mimeType=ext==='jpg'?'image/jpeg':ext==='png'?'image/png':ext==='gif'?'image/gif':'image/webp';
    window._pendingImages=[{media_type:mimeType,data:base64}];
    txt='[Imagen subida: '+file.name+' — analizar visualmente]';
  }else if(ext==='pdf'){
    const ab=await file.arrayBuffer();
    await loadLib('pdfjs');
    const pdf=await pdfjsLib.getDocument({data:ab}).promise;
    const pp=[];const images=[];
    const maxImagePages=Math.min(pdf.numPages,5);
    for(let i=1;i<=pdf.numPages;i++){
      const pg=await pdf.getPage(i);
      const c=await pg.getTextContent();
      pp.push(c.items.map(x=>x.str).join(' '));
      // Render first N pages as images for vision analysis
      if(i<=maxImagePages){
        try{
          const scale=1.5;
          const vp=pg.getViewport({scale});
          const canvas=document.createElement('canvas');
          canvas.width=Math.min(vp.width,1024);
          canvas.height=Math.min(vp.height,1400);
          const ctx=canvas.getContext('2d');
          const renderScale=canvas.width/vp.width;
          await pg.render({canvasContext:ctx,viewport:pg.getViewport({scale:scale*renderScale})}).promise;
          const dataUrl=canvas.toDataURL('image/jpeg',0.7);
          const base64=dataUrl.split(',')[1];
          images.push({media_type:'image/jpeg',data:base64});
        }catch(imgErr){console.warn('Page image extraction failed:',imgErr);}
      }
    }
    txt=pp.join('\n\n');
    if(images.length>0) window._pendingImages=images;
  }else if(['docx','doc'].includes(ext)){
    const ab=await file.arrayBuffer();
    await loadLib('mammoth');
    const r=await mammoth.extractRawText({arrayBuffer:ab});
    txt=r.value;
  }else{throw new Error('Formato no soportado');}
  document.getElementById('inputText').value=txt;
  document.getElementById('fileInfo').classList.remove('hidden');
  const imgCount=window._pendingImages?window._pendingImages.length:0;
  const imgLabel=imgCount>0?' + '+imgCount+' '+t('imagesDetected'):'';
  document.getElementById('fileName').textContent=file.name+' ('+(txt.length/1000).toFixed(1)+'K chars'+imgLabel+')';
  showStatus(t('uiFileLoaded')+(imgCount?' — '+imgCount+' '+t('imagesDetected'):''));
}catch(e){showError('Error: '+e.message);}}
function clearFile(){document.getElementById('inputText').value='';document.getElementById('fileInfo').classList.add('hidden');document.getElementById('fileInput').value='';updateCharCount({value:''});}
function updateCharCount(el){const n=el.value.length;const c=document.getElementById('charCount');if(!c)return;if(n===0){c.textContent='';return;}const k=(n/1000).toFixed(1);if(n>60000){c.textContent=k+'K '+t('uiChars')+' — ⚠ '+t('uiTooLong');c.style.color='#E74243';c.style.fontWeight='600';}else{c.textContent=k+'K '+t('uiChars');c.style.color=n>30000?'#44474C':'#94a3b8';c.style.fontWeight='400';}}

// ============================================================
// REPORT TYPE SELECTOR
// ============================================================
function setReportType(el){
  document.querySelectorAll('#reportTypeChips .rtype-chip').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  currentReportType=el.dataset.type;
}

// ============================================================
// OUTPUT LANGUAGE SELECTOR
// ============================================================
function setOutputLang(el){
  document.querySelectorAll('#langChips .rtype-chip').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  outputLanguage=el.dataset.lang;
  if(outputLanguage!=='auto' && i18n[outputLanguage]) currentLang=outputLanguage;
}

// ============================================================
// UI LANGUAGE TOGGLE (ES/EN in header)
// ============================================================
function setUILang(lang){
  currentLang=lang;
  // Toggle active styles
  const esBtn=document.getElementById('uiLangEs');
  const enBtn=document.getElementById('uiLangEn');
  if(lang==='es'){
    esBtn.className="font-['Inter'] text-[10px] uppercase tracking-widest text-white font-bold px-1.5 py-0.5 transition-all";
    esBtn.style.background='rgba(187,0,20,0.8)';
    enBtn.className="font-['Inter'] text-[10px] uppercase tracking-widest text-slate-400 px-1.5 py-0.5 transition-all hover:text-white";
    enBtn.style.background='transparent';
  } else {
    enBtn.className="font-['Inter'] text-[10px] uppercase tracking-widest text-white font-bold px-1.5 py-0.5 transition-all";
    enBtn.style.background='rgba(187,0,20,0.8)';
    esBtn.className="font-['Inter'] text-[10px] uppercase tracking-widest text-slate-400 px-1.5 py-0.5 transition-all hover:text-white";
    esBtn.style.background='transparent';
  }
  updateUI();
}

// ============================================================
// UPDATE UI LANGUAGE — applies i18n to all data-i18n elements
// ============================================================
function updateUI(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const key=el.getAttribute('data-i18n');
    const val=t(key);
    if(val && val!==key) el.textContent=val;
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el=>{
    const key=el.getAttribute('data-i18n-title');
    const val=t(key);
    if(val && val!==key) el.title=val;
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el=>{
    const key=el.getAttribute('data-i18n-placeholder');
    const val=t(key);
    if(val && val!==key) el.placeholder=val;
  });
  // Re-render JS-generated UI that contains translated strings
  renderHistory();
  renderInformesDashboard();
  renderMinutasList();
}

// ============================================================
// JSON VALIDATION
// ============================================================
function validateReport(r){
  const checks=[
    {key:'title',label:t('valTitle')},
    {key:'executive_summary',label:t('valSummary')},
    {key:'key_messages',label:t('valMessages')},
    {key:'findings',label:t('valFindings')},
    {key:'analysis_blocks',label:t('valAnalysis')},
    {key:'recommendations',label:t('valRecs')},
  ];
  return checks.filter(c=>!r[c.key]||(Array.isArray(r[c.key])&&!r[c.key].length)).map(c=>c.label);
}
function showValidationWarning(fields){
  document.getElementById('validationWarnText').textContent=t('uiFieldsIncomplete')+': '+fields.join(', ')+'. '+t('uiMayBeIncomplete');
  document.getElementById('validationWarn').classList.remove('hidden');
}

// ============================================================
// REGENERAR SECCIÓN
// ============================================================
function startFakeProgress(onUpdate){
  let pct=0;
  const iv=setInterval(()=>{
    const inc=pct<25?5:pct<55?3:pct<78?1.5:0.4;
    pct=Math.min(pct+inc,88);
    onUpdate(Math.round(pct));
  },350);
  return{
    complete(){clearInterval(iv);onUpdate(100);},
    cancel(){clearInterval(iv);}
  };
}

async function regenSection(sectionKey,idx,btn){
  const wUrl=WORKER_URL;
  if(!wUrl||!result)return;
  const labels={findings:t('regenFindings'),analysis_blocks:t('regenAnalysis')+(idx!==undefined?' '+(idx+1):''),recommendations:t('regenRecs'),risks:t('regenRisks'),opportunities:t('regenOpps'),executive_summary:t('regenExecSummary'),key_messages:t('regenKeyMessages'),context:t('regenContext'),conclusion:t('regenConclusion')};
  const label=labels[sectionKey]||sectionKey;

  // Build inline progress UI inside the button
  let btnOrigHTML='';
  let sectionEl=null;
  if(btn){
    btnOrigHTML=btn.innerHTML;
    btn.disabled=true;
    btn.innerHTML=`<div class="regen-progress-wrap"><div class="regen-progress-label">${t('uiRegenerating')} ${label}… <span class="regen-pct">0%</span></div><div class="regen-progress-bar"><div class="regen-progress-fill" style="width:0%"></div></div></div>`;
    // Dim the section body
    sectionEl=btn.closest('[class*="px-10"]')||btn.closest('div[class]');
    if(sectionEl) sectionEl.classList.add('section-regen-loading');
  }
  const progress=startFakeProgress(pct=>{
    if(!btn)return;
    const fill=btn.querySelector('.regen-progress-fill');
    const pctEl=btn.querySelector('.regen-pct');
    if(fill) fill.style.width=pct+'%';
    if(pctEl) pctEl.textContent=pct+'%';
  });

  try{
    const prompt=`Este es el informe ejecutivo actual en JSON:\n\n${JSON.stringify(result,null,2)}\n\nPor favor regenera ${idx!==undefined?'el ítem '+idx+' de ':''}la sección "${sectionKey}" con contenido fresco y de mayor calidad. Responde con el JSON completo actualizado precedido de __JSON_UPDATE__ en línea separada.`;
    const reply=await fetchFromWorker(wUrl,{userContent:'__CHAT_MODE__',chatMessages:[{role:'user',content:prompt}]},null);
    progress.complete();
    if(reply.includes('__JSON_UPDATE__')){
      const parts=reply.split('__JSON_UPDATE__');
      const jsonPart=parts[1].replace(/```json|```/g,'').trim();
      const updated=JSON.parse(jsonPart);
      if(idx!==undefined&&Array.isArray(updated[sectionKey])&&updated[sectionKey][idx]!==undefined){
        result[sectionKey][idx]=updated[sectionKey][idx];
      } else if(updated[sectionKey]!==undefined){
        result[sectionKey]=updated[sectionKey];
      } else {
        result=updated;
      }
    } else {
      throw new Error('El Worker no devolvió JSON actualizado');
    }
    setTimeout(()=>{renderPreview(result);flash('✓ '+label+' regenerado');},300);
  }catch(e){
    progress.cancel();
    showError('Error regenerando: '+e.message);
    if(btn){btn.disabled=false;btn.innerHTML=btnOrigHTML;}
    if(sectionEl) sectionEl.classList.remove('section-regen-loading');
  }
}

// ============================================================
// API CALL
// ============================================================
// ============================================================
// HISTORIAL DE INFORMES — localStorage (últimos 5)
// ============================================================

function saveToHistory(r){
  try{
    const history = loadHistory();
    const entry = {
      id: Date.now(),
      title: r.title||'Sin título',
      subtitle: r.subtitle||'',
      date: new Date().toLocaleDateString('es-CL',{day:'2-digit',month:'short',year:'numeric'}),
      data: JSON.stringify(r)
    };
    history.unshift(entry);
    const trimmed = history.slice(0,5);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    currentHistoryId = entry.id;
    renderHistory();
    renderInformesDashboard();
  }catch(e){console.warn('History save error:',e);}
}

function loadHistory(){
  try{return JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');}
  catch(e){return [];}
}

function loadFromHistory(id){
  const history = loadHistory();
  const entry = history.find(h=>h.id===id);
  if(!entry)return;
  showNuevoInformeForm();
  // Viewing a saved report — hide the new-report input form
  const inputCard = document.getElementById('newReportInputCard');
  if (inputCard) inputCard.style.display = 'none';
  try{
    result = JSON.parse(entry.data);
    originalResult = JSON.parse(entry.data);
    currentHistoryId = id;
    if(result.language && i18n[result.language]) currentLang=result.language; else currentLang='es';
    renderPreview(result);
    showExportBtns();
    showStatus(t('reportLoaded')+' — '+entry.title);
    window.scrollTo({top:0,behavior:'smooth'});
  }catch(e){showError('Error al cargar historial');}
}

function renderHistory(){
  const list = document.getElementById('historyList');
  if(!list)return;
  const history = loadHistory();
  if(!history.length){
    list.innerHTML=`<p class="font-inter text-xs text-slate-400 px-3 py-2 italic" style="font-family:Inter,sans-serif">${t('uiNoReports')}</p>`;
    return;
  }
  list.innerHTML = history.map(h=>`
    <button onclick="loadFromHistory(${h.id})" class="w-full text-left px-3 py-2.5 hover:bg-white transition-all group">
      <div class="font-['Inter'] text-[11px] font-semibold text-[#1A3350] leading-snug line-clamp-2 group-hover:text-[#E74243] transition-colors">${h.title}</div>
      <div class="font-['Inter'] text-[9px] text-slate-400 mt-0.5">${h.date}</div>
    </button>
  `).join('');
}

// ============================================================
// INFORMES DASHBOARD — grid view of saved reports
// ============================================================
const INFORME_TYPE_I18N_KEYS = {
  strategic:'uiStrategic', financial:'uiFinancial', operational:'uiOperational',
  risk:'uiRisks', competitive:'uiCompetitive', due_diligence:'uiDueDiligence', general:'uiGeneral'
};
function getInformeTypeLabel(type){ return t(INFORME_TYPE_I18N_KEYS[type] || 'uiGeneral'); }
const INFORME_TYPE_COLORS = {
  strategic: {bg:'#FEE2E2',text:'#991B1B'},
  financial: {bg:'#FEF3C7',text:'#92400E'},
  operational:{bg:'#DBEAFE',text:'#1E40AF'},
  risk:       {bg:'#FDE68A',text:'#78350F'},
  competitive:{bg:'#D1FAE5',text:'#065F46'},
  due_diligence:{bg:'#EDE9FE',text:'#4C1D95'},
  general:    {bg:'#F3F4F6',text:'#374151'}
};

function renderInformesDashboard() {
  const grid  = document.getElementById('informesGrid');
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
  grid.innerHTML = history.map(h => {
    let r = null;
    try { r = JSON.parse(h.data); } catch(e) {}
    const type   = r?.type || 'general';
    const colors = INFORME_TYPE_COLORS[type] || INFORME_TYPE_COLORS.general;
    const label  = getInformeTypeLabel(type);
    const subtitle = h.subtitle || r?.subtitle || '';
    const sections = r ? ['findings','recommendations','risks','opportunities','analysis'].filter(k => Array.isArray(r[k]) && r[k].length).length : 0;
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
      ${subtitle
        ? `<p style="font-family:Inter,sans-serif;font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(subtitle)}</p>`
        : `<p style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;line-height:1.5;margin:0 0 20px;font-style:italic">${t('uiNoDescription')}</p>`}
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#6b7280;background:#F2F4F6;padding:4px 8px;border-radius:4px">
            <span class="material-symbols-outlined" style="font-size:12px">calendar_today</span>${esc(h.date)}
          </span>
          ${sections > 0 ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#6b7280;background:#F2F4F6;padding:4px 8px;border-radius:4px">
            <span class="material-symbols-outlined" style="font-size:12px">layers</span>${sections} ${t('uiSections')}
          </span>` : ''}
        </div>
        <button onclick="openInformeFromGrid(${h.id})" style="display:flex;align-items:center;gap:4px;padding:6px 14px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#374151;cursor:pointer;transition:all .15s"
                onmouseover="this.style.background='#1A3350';this.style.color='#fff';this.style.borderColor='#1A3350'"
                onmouseout="this.style.background='#fff';this.style.color='#374151';this.style.borderColor='#e5e7eb'">
          <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>${t('uiView')}
        </button>
      </div>
    </div>`;
  }).join('');
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
  result = null; originalResult = null;
  hidePreview();
  ['btnDocx','btnPdf','btnPptx','btnBrief'].forEach(id => {
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
  if (floatPanel) { floatPanel.classList.remove('open'); floatPanel.style.display = 'none'; }
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
  const now    = new Date();
  const month  = now.getMonth();
  const qStart = Math.floor(month / 3) * 3;
  const qNum   = Math.floor(month / 3) + 1;
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  // Count reports per month using entry id (timestamp)
  const history = loadHistory();
  const byMonth = {};
  history.forEach(h => { const m = new Date(h.id).getMonth(); byMonth[m] = (byMonth[m]||0)+1; });
  const rows = [qStart, qStart+1, qStart+2].map(m => {
    const isActive = m === month;
    const count = byMonth[m] || 0;
    const dots = count === 0
      ? `<div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div><div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>`
      : `<div style="width:6px;height:6px;border-radius:50%;background:#E74243"></div>${count>1?`<div style="width:6px;height:6px;border-radius:50%;background:#4174B9"></div>`:'<div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>'}`;
    return `<div style="display:flex;align-items:center;justify-content:space-between">
      <span style="font-family:Inter,sans-serif;font-size:12px;font-weight:${isActive?'600':'400'};color:${isActive?'#fff':'rgba(255,255,255,0.55)'}">${monthNames[m]}</span>
      <div style="display:flex;gap:4px">${dots}</div>
    </div>`;
  }).join('');
  container.innerHTML = `
    <div style="background:rgba(255,255,255,0.06);border-radius:8px;padding:14px 12px">
      <div style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:.12em;margin-bottom:14px">Planificador Q${qNum}</div>
      <div style="display:flex;flex-direction:column;gap:12px">${rows}</div>
    </div>`;
}

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
async function handleMagicLink(){
  const params = new URLSearchParams(window.location.search);
  const uuid   = params.get('wa');
  const format = params.get('format'); // pptx | pdf | docx | brief
  if(!uuid) return;

  // Clean URL so user doesn't accidentally share the magic link
  history.replaceState(null,'',window.location.pathname);

  showStatus('Cargando informe desde enlace…');
  try{
    const res = await fetch(`${WORKER_URL}/report/${uuid}`);
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if(!data || !data.title) throw new Error('Informe inválido o expirado');

    result = data;
    renderPreview(result);
    document.getElementById('validationWarn').classList.add('hidden');
    document.getElementById('output').classList.remove('hidden');
    document.getElementById('exportButtons').classList.remove('hidden');

    // Auto-trigger the requested download
    if(format==='pptx')       setTimeout(downloadPptx, 800);
    else if(format==='pdf')   setTimeout(downloadPdf,  800);
    else if(format==='docx')  setTimeout(downloadDocx, 800);
    else if(format==='brief') setTimeout(downloadBrief,800);

    showStatus(`Informe cargado${format ? ' — iniciando descarga '+format.toUpperCase()+'…' : ''}`);
  }catch(e){
    showStatus('Error cargando informe: '+e.message, true);
  }
}

// ============================================================
// WORKER FETCH — soporta streaming SSE y JSON legado
// ============================================================
async function fetchFromWorker(url, body, onChunk, onPhase){
  const headers = {'Content-Type':'application/json'};
  if(window._sessionToken) headers['X-Session-Token'] = window._sessionToken;
  const timeoutMs = body.userContent==='__PPTX_MODE__' ? 180000 : 120000;
  const controller = new AbortController();
  const timer = setTimeout(()=>controller.abort(), timeoutMs);
  let res;
  try{
    res = await fetch(url, {method:'POST', headers, body:JSON.stringify(body), signal:controller.signal});
  }catch(e){
    clearTimeout(timer);
    if(e.name==='AbortError') throw new Error('Tiempo de espera agotado. Intenta con un documento más corto.');
    throw e;
  }
  clearTimeout(timer);
  if(!res.ok){
    const errText = await res.text();
    if(errText.trim().startsWith('<')) throw new Error('Worker devolvió HTML. Status: '+res.status);
    try{const d=JSON.parse(errText);throw new Error(d.error?.message||d.error||'Error del servidor');}
    catch(e2){if(e2.message.startsWith('Worker')||e2.message.startsWith('Error del')) throw e2;throw new Error('Error: '+errText.substring(0,200));}
  }
  const ct = res.headers.get('content-type')||'';
  let fullText = '';
  if(ct.includes('text/event-stream')){
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    let streamError = null;
    try{
      while(true){
        const {done, value} = await reader.read();
        if(done) break;
        buf += decoder.decode(value, {stream:true});
        const lines = buf.split('\n\n');
        buf = lines.pop();
        for(const line of lines){
          if(!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if(data==='[DONE]') break;
          try{
            const p=JSON.parse(data);
            if(p.phase && onPhase) onPhase(p.phase);
            if(p.text){fullText+=p.text;if(onChunk)onChunk(fullText,p.text);}
          }catch{}
        }
      }
    }catch(streamErr){
      streamError = streamErr;
    }
    // If stream broke but we have partial content, try to use it
    if(streamError && !fullText) throw streamError;
    if(streamError && fullText) console.warn('Stream interrupted, using partial response:', streamError.message);
  } else {
    const raw = await res.text();
    if(raw.trim().startsWith('<')) throw new Error('Worker devolvió HTML. Status: '+res.status);
    let data;
    try{data=JSON.parse(raw);}catch(e){throw new Error('No es JSON: '+raw.substring(0,200));}
    if(data.error) throw new Error(data.error.message||data.error);
    if(!data.content||!Array.isArray(data.content)) throw new Error('Respuesta inesperada');
    fullText = data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
  }
  return fullText;
}

async function analyze(){
  const input=document.getElementById('inputText').value.trim();
  const wUrl=WORKER_URL;
  if(!input)return;
  document.getElementById('validationWarn').classList.add('hidden');
  setLoading(true);startProgress();hideError();hidePreview();result=null;originalResult=null;
  try{
    const SECTION_PROGRESS={
      '"title"':t('progressTitle'),
      '"executive_summary"':t('progressSummary'),
      '"key_messages"':t('progressKeys'),
      '"context"':t('progressContext'),
      '"findings"':t('progressFindings'),
      '"analysis_blocks"':t('progressAnalysis'),
      '"risks"':t('progressRisks'),
      '"opportunities"':t('progressOpps'),
      '"recommendations"':t('progressRecs'),
      '"conclusion"':t('progressConclusion'),
      '"kpis"':t('progressKpis'),
    };
    let chunks=0;
    let thinkingPhase=true;
    const requestBody={userContent:input,reportType:currentReportType,outputLanguage};
    // Attach images if available (vision support)
    if(window._pendingImages && window._pendingImages.length>0){
      requestBody.images=window._pendingImages;
    }
    const txt=await fetchFromWorker(wUrl,requestBody,(full,chunk)=>{
      chunks++;
      if(thinkingPhase){
        thinkingPhase=false;
        clearInterval(progressTimer);
      }
      clearInterval(progressTimer);
      const pct=Math.min(93,10+chunks*4);
      document.getElementById('progressFill').style.width=pct+'%';
      document.getElementById('progressPct').textContent=pct+'%';
      const keys=Object.keys(SECTION_PROGRESS);let lastKey=null;let lastPos=-1;
      for(const k of keys){const p=full.lastIndexOf(k);if(p>lastPos){lastPos=p;lastKey=k;}}
      if(lastKey) document.getElementById('progressStep').textContent=SECTION_PROGRESS[lastKey];
    },(phase)=>{
      if(phase==='thinking'){
        document.getElementById('progressStep').textContent=t('thinkingStep');
        document.getElementById('progressFill').style.width='5%';
        document.getElementById('progressPct').textContent='5%';
      } else if(phase==='writing'){
        document.getElementById('progressStep').textContent=t('writingStep');
        document.getElementById('progressFill').style.width='12%';
        document.getElementById('progressPct').textContent='12%';
      }
    });
    const clean=txt.replace(/```json|```/g,'').trim();
    try{result=JSON.parse(clean);}catch(e){
      // Attempt to salvage truncated JSON by closing open braces/brackets
      let salvaged=null;
      try{
        let fix=clean;
        const opens=(fix.match(/\{/g)||[]).length;
        const closes=(fix.match(/\}/g)||[]).length;
        const arrOpens=(fix.match(/\[/g)||[]).length;
        const arrCloses=(fix.match(/\]/g)||[]).length;
        // Remove trailing comma or incomplete value
        fix=fix.replace(/,\s*$/,'');
        fix=fix.replace(/,\s*"[^"]*"?\s*$/,'');
        for(let i=0;i<arrOpens-arrCloses;i++) fix+=']';
        for(let i=0;i<opens-closes;i++) fix+='}';
        salvaged=JSON.parse(fix);
      }catch(e2){}
      if(salvaged&&salvaged.title){
        result=salvaged;
        showValidationWarning(['El informe se recibió incompleto — algunas secciones pueden faltar']);
      } else {
        throw new Error('La IA no devolvió JSON válido. Intenta de nuevo o reduce el largo del documento.');
      }
    }
    // Set language from report
    if(result.language && i18n[result.language]) currentLang=result.language;
    else currentLang='es';
    originalResult=JSON.parse(JSON.stringify(result));
    const missing=validateReport(result);
    if(missing.length) showValidationWarning(missing);
    window._pendingImages=null;
    stopProgress(true);renderPreview(result);showExportBtns();
    showStatus(t('reportReady'));setDot('ok');saveToHistory(result);
  }catch(err){
    stopProgress(false);showError(err.message);setDot('no');
  }finally{setLoading(false);}
}

// ============================================================
// EDITABLE PREVIEW (ALTO branded)
// ============================================================
function ed(path){const val=getPath(result,path)||'';return `<span class="editable" contenteditable="true" data-path="${path}" onblur="updateField(this)">${esc(val)}</span>`;}
function getPath(o,p){return p.split('.').reduce((c,k)=>{if(c==null)return undefined;const m=k.match(/^(.+)\[(\d+)\]$/);return m?(c[m[1]]||[])[parseInt(m[2])]:c[k];},o);}
function setPath(o,p,v){const parts=p.split('.');let c=o;for(let i=0;i<parts.length-1;i++){const m=parts[i].match(/^(.+)\[(\d+)\]$/);c=m?c[m[1]][parseInt(m[2])]:c[parts[i]];}const l=parts[parts.length-1];const lm=l.match(/^(.+)\[(\d+)\]$/);if(lm)c[lm[1]][parseInt(lm[2])]=v;else c[l]=v;}
function updateField(el){setPath(result,el.dataset.path,el.textContent.trim());autoSaveEdit();}
function autoSaveEdit(){if(!result||!currentHistoryId)return;clearTimeout(_autoSaveTimer);_autoSaveTimer=setTimeout(()=>{try{const h=loadHistory();const idx=h.findIndex(e=>e.id===currentHistoryId);if(idx>=0){h[idx].data=JSON.stringify(result);h[idx].title=result.title||'Sin título';localStorage.setItem(HISTORY_KEY,JSON.stringify(h));renderHistory();}}catch(e){}},800);}
function resetEdits(){if(originalResult){result=JSON.parse(JSON.stringify(originalResult));renderPreview(result);flash('Restaurado');}}

function renderPreview(r){
  document.getElementById('methodCards').classList.add('hidden');
  document.getElementById('editBanner').classList.remove('hidden');
  const card=document.getElementById('previewCard');card.classList.remove('hidden');card.style.animation='none';void card.offsetHeight;card.style.animation='';
  let h=`<div id="reportContent" class="bg-white overflow-hidden fade-in" style="box-shadow:0 2px 40px rgba(4,22,39,0.08)">`;

  // ── Cover bar ──────────────────────────────────────────────
  h+=`<div class="flex items-center justify-between px-8 py-4 bg-[#1A3350]">
    <div class="flex items-center gap-3">
      <span class="font-['Manrope'] font-black text-white text-xs tracking-widest uppercase">ALTO</span>
      <div class="w-px h-4 bg-white/20"></div>
      <span class="font-['Inter'] text-[10px] text-slate-400 tracking-wide uppercase">${t('confidential')}</span>
    </div>
    <span class="font-['Inter'] italic text-[10px] text-slate-500">${new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long',day:'numeric'})}</span>
  </div>`;

  // ── Title block ────────────────────────────────────────────
  h+=`<div class="px-10 pt-10 pb-8 border-b border-[#E0E3E5]">
    <span class="font-['Inter'] text-[#E74243] font-bold tracking-[0.25em] uppercase text-[10px] mb-3 block">${t('analysisLabel')}</span>
    <h1 class="font-['Manrope'] text-3xl font-extrabold text-[#1A3350] leading-tight tracking-tight editable" contenteditable="true" data-path="title" onblur="updateField(this)">${esc(r.title)}</h1>`;
  if(r.subtitle)h+=`<p class="font-['Inter'] text-sm text-slate-500 italic mt-2 editable" contenteditable="true" data-path="subtitle" onblur="updateField(this)">${esc(r.subtitle)}</p>`;
  h+=`<div class="w-16 h-0.5 bg-[#E74243] mt-5"></div></div>`;

  // ── Executive Summary — So What box ───────────────────────
  h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
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
  if(r.key_messages?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('keyMessages')}</h2>
        <button class="regen-btn" onclick="regenSection('key_messages',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="space-y-3">`;
    r.key_messages.forEach((m,i)=>{
      h+=`<div class="flex gap-3 items-start">
        <span class="font-['Inter'] text-[#E74243] font-black text-xs mt-0.5 select-none">▸</span>
        <span class="font-['Inter'] text-sm text-[#191C1E] leading-snug editable" contenteditable="true" data-path="key_messages[${i}]" onblur="updateField(this)">${esc(m)}</span>
      </div>`;
    });
    h+=`</div></div>`;
  }

  // ── Context ────────────────────────────────────────────────
  if(r.context){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-4">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('context')}</h2>
        <button class="regen-btn" onclick="regenSection('context',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <p class="font-['Inter'] text-sm text-[#44474C] leading-relaxed editable" contenteditable="true" data-path="context" onblur="updateField(this)">${esc(r.context)}</p>
    </div>`;
  }

  // ── Findings ───────────────────────────────────────────────
  if(r.findings?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5] section-collapsible">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3 cursor-pointer select-none flex-1" onclick="this.closest('.section-collapsible').classList.toggle('collapsed')">
          <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('findings')}</h2>
          <span class="collapse-icon material-symbols-outlined text-sm text-slate-400">expand_more</span>
        </div>
        <button class="regen-btn" onclick="event.stopPropagation();regenSection('findings',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="section-body" style="max-height:2000px">
      <div class="space-y-5">`;
    r.findings.forEach((f,i)=>{
      h+=`<div class="grid grid-cols-12 gap-0 finding-card">
        <div class="col-span-1 bg-[#1A3350] flex items-center justify-center py-4">
          <span class="font-['Manrope'] font-black text-white text-sm">${i+1}</span>
        </div>
        <div class="col-span-11 bg-[#F8F9FB] p-5 border-b-2 border-[#E74243]">
          <p class="font-['Manrope'] font-bold text-sm text-[#1A3350] mb-2 editable" contenteditable="true" data-path="findings[${i}].finding" onblur="updateField(this)">${esc(f.finding)}</p>
          <p class="font-['Inter'] text-xs text-slate-500 mb-1.5"><strong>${t('evidence')}:</strong> <span class="editable" contenteditable="true" data-path="findings[${i}].evidence" onblur="updateField(this)">${esc(f.evidence)}</span></p>
          <p class="font-['Inter'] text-xs text-[#E74243] font-medium"><strong>${t('implication')}:</strong> <span class="editable" contenteditable="true" data-path="findings[${i}].business_implication" onblur="updateField(this)">${esc(f.business_implication)}</span></p>
        </div>
      </div>`;
    });
    h+=`</div></div>`;
  }

  // ── Analysis blocks ────────────────────────────────────────
  if(r.analysis_blocks?.length){
    r.analysis_blocks.forEach((s,i)=>{
      h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
        <div class="flex items-start justify-between mb-5">
          <div class="flex items-start gap-0 flex-1">
            <div class="accent-bar self-stretch mr-5"></div>
            <div>
              <span class="font-['Inter'] text-[#E74243] text-[10px] uppercase tracking-widest font-bold">${i+1}. ${t('analysis')}</span>
              <h2 class="font-['Manrope'] text-lg font-bold text-[#1A3350] mt-1 editable" contenteditable="true" data-path="analysis_blocks[${i}].heading" onblur="updateField(this)">${esc(s.heading)}</h2>
            </div>
          </div>
          <button class="regen-btn" onclick="regenSection('analysis_blocks',${i},this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
        </div>`;
      if(s.governing_thought){
        h+=`<div class="bg-[#1A3350] text-white p-5 mb-5">
          <p class="font-['Manrope'] font-bold text-sm leading-snug editable" contenteditable="true" data-path="analysis_blocks[${i}].governing_thought" onblur="updateField(this)">${esc(s.governing_thought)}</p>
        </div>`;
      }
      if(s.content){
        h+=`<p class="font-['Inter'] text-sm text-[#44474C] leading-relaxed mb-4 editable" contenteditable="true" data-path="analysis_blocks[${i}].content" onblur="updateField(this)">${esc(s.content)}</p>`;
      }
      if(s.bullets?.length){
        s.bullets.forEach((b,j)=>{
          h+=`<div class="flex gap-3 mb-2 items-start pl-2"><span class="text-[#E74243] font-black text-xs select-none mt-0.5">▸</span><span class="font-['Inter'] text-sm text-[#191C1E] editable" contenteditable="true" data-path="analysis_blocks[${i}].bullets[${j}]" onblur="updateField(this)">${esc(b)}</span></div>`;
        });
      }
      if(s.so_what){
        h+=`<div class="flex gap-0 mt-5 so-what-box">
          <div style="width:3px;background:#E74243;flex-shrink:0"></div>
          <div class="bg-[#FFF5F5] flex-1 px-5 py-3">
            <span class="font-['Inter'] text-[10px] font-bold text-[#E74243] uppercase tracking-widest">So what?  </span>
            <span class="font-['Inter'] text-xs italic text-slate-600 editable" contenteditable="true" data-path="analysis_blocks[${i}].so_what" onblur="updateField(this)">${esc(s.so_what)}</span>
          </div>
        </div>`;
      }
      h+=`</div>`;
    });
  }

  // ── Risks ──────────────────────────────────────────────────
  if(r.risks?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#E74243] font-bold">${t('risks')}</h2>
        <button class="regen-btn" onclick="regenSection('risks',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="space-y-3">`;
    r.risks.forEach((rk,i)=>{
      h+=`<div class="flex gap-0">
        <div style="width:3px;background:#E74243;flex-shrink:0"></div>
        <div class="bg-[#FFF5F5] flex-1 px-5 py-4">
          <p class="font-['Manrope'] font-bold text-sm text-[#E74243] mb-1 editable" contenteditable="true" data-path="risks[${i}].risk" onblur="updateField(this)">${esc(rk.risk)}</p>
          <p class="font-['Inter'] text-xs text-slate-500 editable" contenteditable="true" data-path="risks[${i}].implication" onblur="updateField(this)">${esc(rk.implication)}</p>
        </div>
      </div>`;
    });
    h+=`</div></div>`;
  }

  // ── Opportunities ──────────────────────────────────────────
  if(r.opportunities?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-5">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('opportunities')}</h2>
        <button class="regen-btn" onclick="regenSection('opportunities',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="space-y-2">`;
    r.opportunities.forEach((o,i)=>{
      h+=`<div class="flex gap-3 items-start"><span class="font-['Inter'] text-[#4174B9] font-black text-xs select-none mt-0.5">✦</span><span class="font-['Inter'] text-sm text-[#191C1E] editable" contenteditable="true" data-path="opportunities[${i}]" onblur="updateField(this)">${esc(o)}</span></div>`;
    });
    h+=`</div></div>`;
  }

  // ── Recommendations ────────────────────────────────────────
  if(r.recommendations){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#1A3350] font-bold">${t('recommendations')}</h2>
        <button class="regen-btn" onclick="regenSection('recommendations',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>`;
    [{key:'short_term',label:t('shortTerm'),color:'#E74243'},{key:'medium_term',label:t('mediumTerm'),color:'#1A3350'},{key:'long_term',label:t('longTerm'),color:'#2A313E'}].forEach(hz=>{
      const items=r.recommendations[hz.key];
      if(!items?.length)return;
      h+=`<div class="mb-6">
        <div class="inline-block font-['Inter'] text-[9px] uppercase tracking-widest font-bold text-white px-3 py-1 mb-4" style="background:${hz.color}">${hz.label}</div>`;
      items.forEach((rec,i)=>{
        h+=`<div class="flex gap-0 mb-3">
          <div class="w-7 h-7 flex items-center justify-center flex-shrink-0 font-['Manrope'] font-black text-xs text-white" style="background:${hz.color}">${i+1}</div>
          <div class="bg-[#F8F9FB] flex-1 px-5 py-3">
            <p class="font-['Manrope'] font-bold text-sm text-[#1A3350] editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].action" onblur="updateField(this)">${esc(rec.action)}</p>
            <p class="font-['Inter'] text-xs text-slate-500 italic mt-1 editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].rationale" onblur="updateField(this)">${esc(rec.rationale)}</p>
            <p class="font-['Inter'] text-xs font-medium mt-1" style="color:${hz.color}">${t('impact')}: <span class="editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].impact" onblur="updateField(this)">${esc(rec.impact)}</span></p>
          </div>
        </div>`;
      });
      h+=`</div>`;
    });
    h+=`</div>`;
  }

  // ── Info gaps ──────────────────────────────────────────────
  if(r.information_gaps?.length){
    h+=`<div class="px-10 py-7 border-b border-[#E0E3E5]">
      <div class="flex gap-0">
        <div style="width:4px;background:#4174B9;flex-shrink:0"></div>
        <div class="flex-1 pl-6">
          <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#4174B9] font-bold block mb-4">${t('infoGaps')}</span>
          <div class="space-y-2.5">`;
    r.information_gaps.forEach((g,i)=>{
      h+=`<div class="flex gap-3 items-start"><span class="material-symbols-outlined text-[14px] text-[#4174B9] select-none mt-0.5" style="font-variation-settings:'FILL' 0">info</span><span class="font-['Inter'] text-sm text-[#44474C] editable" contenteditable="true" data-path="information_gaps[${i}]" onblur="updateField(this)">${esc(g)}</span></div>`;
    });
    h+=`</div></div></div></div>`;
  }

  // ── Conclusion ─────────────────────────────────────────────
  if(r.conclusion){
    h+=`<div class="px-10 py-8">
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

  h+=`</div>`;
  card.innerHTML=h;
}

// ============================================================
// EXPORT: MARKDOWN
// ============================================================
function copyMarkdown(){if(!result)return;let md=`# ${result.title}\n*${result.subtitle||''}*\n\n---\n\n## Resumen Ejecutivo\n\n> ${result.executive_summary}\n\n`;if(result.key_messages?.length){md+=`### Mensajes Clave\n\n`;result.key_messages.forEach(m=>{md+=`- ${m}\n`;});md+=`\n`;}if(result.context)md+=`## Contexto\n\n${result.context}\n\n`;if(result.findings?.length){md+=`## Hallazgos\n\n`;result.findings.forEach((f,i)=>{md+=`### ${i+1}. ${f.finding}\n- **Evidencia:** ${f.evidence}\n- **Implicancia:** ${f.business_implication}\n\n`;});}if(result.analysis_blocks?.length){result.analysis_blocks.forEach((s,i)=>{md+=`## ${i+1}. ${s.heading}\n\n`;if(s.governing_thought)md+=`**${s.governing_thought}**\n\n`;if(s.content)md+=`${s.content}\n\n`;s.bullets?.forEach(b=>{md+=`- ${b}\n`;});if(s.so_what)md+=`\n> **So what?** *${s.so_what}*\n`;md+=`\n`;});}if(result.risks?.length){md+=`## Riesgos\n\n`;result.risks.forEach(r=>{md+=`- **${r.risk}**: ${r.implication}\n`;});md+=`\n`;}if(result.opportunities?.length){md+=`## Oportunidades\n\n`;result.opportunities.forEach(o=>{md+=`- ${o}\n`;});md+=`\n`;}if(result.recommendations){md+=`## Recomendaciones\n\n`;['short_term','medium_term','long_term'].forEach(h=>{const l={short_term:'Corto',medium_term:'Mediano',long_term:'Largo'}[h];const items=result.recommendations[h];if(!items?.length)return;md+=`### ${l} Plazo\n\n`;items.forEach((r,i)=>{md+=`${i+1}. **${r.action}** — ${r.rationale} *(${r.impact})*\n`;});md+=`\n`;});}if(result.conclusion)md+=`---\n\n## Conclusión\n\n${result.conclusion}\n`;navigator.clipboard.writeText(md);flash('✓ Markdown copiado');}

// ============================================================
// PDF EXPORT
// ============================================================
async function downloadPdf(){
  if(!result)return;
  showStatus('Generando PDF...');
  try{
    await loadLib('jspdf');
    const{jsPDF}=window.jspdf;
    const pdf=new jsPDF('p','mm','a4');
    const r=result;
    const W=210,H=297;
    const ML=18,MR=18,MT=22,MB=22;
    const CW=W-ML-MR;
    let y=0;
    const NAVY='#1A3350',RED='#E74243',BLUE='#4174B9',BODY='#44474C',SGRAY='#676766',LGRAY='#F2F4F6',MGRAY='#BFC4C5';
    const SIDEBAR_W=52;
    const CONTENT_X=SIDEBAR_W+14;
    const CONTENT_W=W-CONTENT_X-MR;

    // Track page where each analysis block starts (for TOC)
    const tocEntries=[];
    let currentPage=1;

    function checkPage(need){
      if(y+need>H-MB){pdf.addPage();currentPage++;y=MT;return true;}
      return false;
    }
    function drawRect(x,ry,w,h,color){pdf.setFillColor(color);pdf.rect(x,ry,w,h,'F');}
    function wrapText(text,maxW){return pdf.splitTextToSize(text||'',maxW);}
    function drawWrapped(text,x,maxW,fontSize,color,style,lineH){
      lineH=lineH||5.5;
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica',style||'normal');
      pdf.setTextColor(color);
      const lines=wrapText(text,maxW);
      lines.forEach(line=>{
        checkPage(lineH+1);
        pdf.text(line,x,y);
        y+=lineH;
      });
      return lines.length;
    }
    function sectionHeader(num,label){
      checkPage(22);
      drawRect(ML,y,CW,0.6,RED);
      y+=6;
      if(num!==null){
        pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
        pdf.text(String(num).padStart(2,'0'),ML,y);
      }
      pdf.setFontSize(13);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
      pdf.text(label,ML+(num!==null?10:0),y);
      y+=10;
    }

    const dateStr=new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long',day:'numeric'});
    const monthYear=new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long'});

    // ================================================================
    // PAGE 1 — COVER
    // ================================================================
    // Navy sidebar
    drawRect(0,0,SIDEBAR_W,H,NAVY);

    // Logo on sidebar
    if(typeof logoBase64!=='undefined'&&logoBase64){
      try{pdf.addImage(logoBase64,'PNG',10,20,32,32);}catch(e){}
    }

    // Sidebar bottom text
    pdf.setFontSize(7);pdf.setFont('helvetica','normal');pdf.setTextColor('#8899AA');
    pdf.text('ALTO Strategy',10,H-40);
    pdf.text(dateStr,10,H-34);

    // CONFIDENCIAL badge on sidebar
    drawRect(8,H-26,36,8,RED);
    pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor('#FFFFFF');
    pdf.text('CONFIDENCIAL',10,H-21);

    // Right side content
    const titleX=CONTENT_X;
    const titleW=CONTENT_W;

    // Red accent line
    drawRect(titleX,80,40,1.2,RED);

    // Title
    pdf.setFontSize(24);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
    const titleLines=wrapText(r.title,titleW);
    let ty=92;
    titleLines.forEach(line=>{pdf.text(line,titleX,ty);ty+=11;});

    // Subtitle
    if(r.subtitle){
      ty+=4;
      pdf.setFontSize(11);pdf.setFont('helvetica','italic');pdf.setTextColor(SGRAY);
      const subLines=wrapText(r.subtitle,titleW);
      subLines.forEach(line=>{pdf.text(line,titleX,ty);ty+=6;});
    }

    // Red accent line below subtitle
    ty+=8;
    drawRect(titleX,ty,40,1.2,RED);
    ty+=14;

    // Prepared by
    pdf.setFontSize(9);pdf.setFont('helvetica','normal');pdf.setTextColor(SGRAY);
    pdf.text('Preparado por:',titleX,ty);
    ty+=6;
    pdf.setFontSize(10);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
    pdf.text('ALTO Strategy',titleX,ty);
    ty+=6;
    pdf.setFontSize(9);pdf.setFont('helvetica','normal');pdf.setTextColor(SGRAY);
    pdf.text(dateStr,titleX,ty);

    // BORRADOR watermark
    pdf.setFontSize(50);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
    pdf.saveGraphicsState();
    pdf.setGState(new pdf.GState({opacity:0.08}));
    pdf.text('BORRADOR',W/2+20,H/2,{align:'center',angle:45});
    pdf.restoreGraphicsState();

    // ================================================================
    // PAGE 2 — TABLE OF CONTENTS
    // ================================================================
    pdf.addPage();currentPage++;y=MT;

    // Header rule
    drawRect(0,0,W,1.2,NAVY);

    y=35;
    drawRect(ML,y,1.5,8,RED);
    pdf.setFontSize(16);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
    pdf.text('CONTENIDO',ML+6,y+6);
    y+=22;

    // Build TOC entries - we'll fill page numbers later
    // For now, record sections and estimate
    const tocSections=[];
    let tocNum=1;
    if(r.executive_summary)tocSections.push({num:tocNum++,label:'Resumen Ejecutivo'});
    if(r.key_messages?.length)tocSections.push({num:tocNum++,label:'Mensajes Clave'});
    if(r.context)tocSections.push({num:tocNum++,label:'Contexto'});
    if(r.analysis_blocks?.length){
      r.analysis_blocks.forEach((s,i)=>{
        tocSections.push({num:tocNum++,label:s.heading});
      });
    }
    if(r.findings?.length)tocSections.push({num:tocNum++,label:'Hallazgos'});
    if(r.risks?.length)tocSections.push({num:tocNum++,label:'Riesgos'});
    if(r.opportunities?.length)tocSections.push({num:tocNum++,label:'Oportunidades'});
    if(r.recommendations)tocSections.push({num:tocNum++,label:'Recomendaciones'});
    if(r.information_gaps?.length)tocSections.push({num:tocNum++,label:'Brechas de Informacion'});
    if(r.conclusion)tocSections.push({num:tocNum++,label:'Conclusion'});

    tocSections.forEach((item,idx)=>{
      const numStr=String(item.num).padStart(2,'0');
      pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
      pdf.text(numStr,ML,y);
      pdf.setFontSize(10);pdf.setFont('helvetica','normal');pdf.setTextColor(NAVY);
      pdf.text(item.label,ML+12,y);
      // Dotted leader line
      pdf.setFontSize(8);pdf.setFont('helvetica','normal');pdf.setTextColor(MGRAY);
      const labelW=pdf.getTextWidth(item.label);
      const dotsX=ML+12+labelW+3;
      const dotsEnd=W-MR-8;
      let dots='';
      pdf.setFontSize(8);
      while(pdf.getTextWidth(dots+'.')<(dotsEnd-dotsX)){dots+=' .';}
      if(dots)pdf.text(dots,dotsX,y);
      y+=8;
    });

    // ================================================================
    // PAGE 3+ — CONTENT
    // ================================================================
    pdf.addPage();currentPage++;y=MT;

    let secNum=1;

    // ── Executive Summary ──────────────────────────────────────
    if(r.executive_summary){
      sectionHeader(null,'RESUMEN EJECUTIVO');
      // Pre-measure
      pdf.setFontSize(10);
      const exLines=wrapText(r.executive_summary,CW-16);
      const exH=14+exLines.length*5.5+8;
      checkPage(exH);
      drawRect(ML,y-4,2,exH,RED);
      drawRect(ML+2,y-4,CW-2,exH,LGRAY);
      // Label
      pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
      pdf.text('RESUMEN EJECUTIVO',ML+8,y+2);
      y+=10;
      // Body
      pdf.setFontSize(10);pdf.setFont('helvetica','italic');pdf.setTextColor(NAVY);
      exLines.forEach(line=>{checkPage(5.5);pdf.text(line,ML+8,y);y+=5.5;});
      y+=14;
      secNum++;
    }

    // ── Key Messages ───────────────────────────────────────────
    if(r.key_messages?.length){
      sectionHeader(secNum,'MENSAJES CLAVE');secNum++;
      r.key_messages.forEach((m,idx)=>{
        pdf.setFontSize(9);
        const mLines=wrapText(m,CW-20);
        const cardH=mLines.length*5+8;
        checkPage(cardH+4);
        // Card background
        const accent=idx%2===0?NAVY:RED;
        drawRect(ML,y-3,2,cardH,accent);
        drawRect(ML+2,y-3,CW-2,cardH,LGRAY);
        // Number circle
        pdf.setFontSize(10);pdf.setFont('helvetica','bold');pdf.setTextColor(accent);
        pdf.text(String(idx+1),ML+7,y+2);
        // Message text
        pdf.setFontSize(9);pdf.setFont('helvetica','normal');pdf.setTextColor(BODY);
        let my=y+2;
        mLines.forEach(line=>{pdf.text(line,ML+14,my);my+=5;});
        y+=cardH+5;
      });
      y+=8;
    }

    // ── Context ────────────────────────────────────────────────
    if(r.context){
      sectionHeader(secNum,'CONTEXTO');secNum++;
      drawWrapped(r.context,ML,CW,9.5,BODY,'normal',5.5);
      y+=12;
    }

    // ── Analysis Blocks ────────────────────────────────────────
    if(r.analysis_blocks?.length){
      r.analysis_blocks.forEach((s,i)=>{
        // Start each analysis block on a new page for clean layout
        if(i>0||y>MT+20){pdf.addPage();currentPage++;y=MT;}

        // Section header with number + red accent bar
        checkPage(24);
        drawRect(ML,y,CW,0.6,RED);
        y+=6;
        pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
        pdf.text(String(secNum).padStart(2,'0')+' | ANALISIS',ML,y);
        secNum++;
        y+=4;
        pdf.setFontSize(14);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
        const hLines=wrapText(s.heading,CW-4);
        hLines.forEach(line=>{pdf.text(line,ML,y);y+=7;});
        y+=6;

        // Governing thought — navy background box with white text
        if(s.governing_thought){
          checkPage(18);
          pdf.setFontSize(9);
          const gtLines=wrapText(s.governing_thought,CW-16);
          const gtH=gtLines.length*5+10;
          drawRect(ML,y-3,CW,gtH,NAVY);
          pdf.setFont('helvetica','bold');pdf.setTextColor('#FFFFFF');
          let gty=y+2;
          gtLines.forEach(line=>{pdf.text(line,ML+8,gty);gty+=5;});
          y+=gtH+6;
        }

        // Content
        if(s.content){
          checkPage(10);
          drawWrapped(s.content,ML,CW,9.5,BODY,'normal',5.5);
          y+=8;
        }

        // Bullets with red arrow markers
        if(s.bullets?.length){
          y+=2;
          s.bullets.forEach(b=>{
            checkPage(8);
            pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
            pdf.text('>',ML+3,y);
            pdf.setFont('helvetica','normal');pdf.setTextColor(BODY);
            const bLines=wrapText(b,CW-12);
            bLines.forEach(line=>{checkPage(5);pdf.text(line,ML+9,y);y+=5;});
            y+=3;
          });
          y+=4;
        }

        // SO WHAT box
        if(s.so_what){
          y+=3;
          checkPage(16);
          pdf.setFontSize(9);
          const swLines=wrapText(s.so_what,CW-18);
          const swH=swLines.length*5+14;
          drawRect(ML,y-3,2.5,swH,RED);
          drawRect(ML+2.5,y-3,CW-2.5,swH,'#FFF5F5');
          // Label
          pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
          pdf.text('SO WHAT?',ML+8,y+3);
          y+=10;
          // Text
          pdf.setFontSize(9);pdf.setFont('helvetica','italic');pdf.setTextColor('#475569');
          swLines.forEach(line=>{checkPage(5);pdf.text(line,ML+8,y);y+=5;});
          y+=12;
        }
      });
    }

    // ── Findings ───────────────────────────────────────────────
    if(r.findings?.length){
      pdf.addPage();currentPage++;y=MT;
      sectionHeader(secNum,'HALLAZGOS');secNum++;
      r.findings.forEach((f,i)=>{
        // Pre-measure
        pdf.setFontSize(9);
        const fLines=wrapText(f.finding,CW-18);
        let fH=fLines.length*5+6;
        if(f.evidence){pdf.setFontSize(8.5);fH+=8+wrapText(f.evidence,CW-18).length*4.5;}
        if(f.business_implication){pdf.setFontSize(8.5);fH+=8+wrapText(f.business_implication,CW-18).length*4.5;}
        fH+=6;
        checkPage(fH+6);

        const fX=ML+10;
        // Number badge
        drawRect(ML,y-3,8,8,NAVY);
        pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor('#FFFFFF');
        pdf.text(String(i+1),ML+4,y+2,{align:'center'});
        // Card background
        drawRect(fX,y-3,CW-10,fH,LGRAY);
        drawRect(fX,y-3+fH-0.5,CW-10,0.5,RED);

        // Finding text
        pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
        fLines.forEach(line=>{pdf.text(line,fX+4,y);y+=5;});
        y+=3;

        if(f.evidence){
          pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(SGRAY);
          pdf.text('EVIDENCIA',fX+4,y);y+=5;
          pdf.setFontSize(8.5);pdf.setFont('helvetica','normal');pdf.setTextColor(BODY);
          const evLines=wrapText(f.evidence,CW-18);
          evLines.forEach(line=>{checkPage(4.5);pdf.text(line,fX+4,y);y+=4.5;});
          y+=3;
        }
        if(f.business_implication){
          pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
          pdf.text('IMPLICANCIA DE NEGOCIO',fX+4,y);y+=5;
          pdf.setFontSize(8.5);pdf.setFont('helvetica','normal');pdf.setTextColor(RED);
          const impLines=wrapText(f.business_implication,CW-18);
          impLines.forEach(line=>{checkPage(4.5);pdf.text(line,fX+4,y);y+=4.5;});
        }
        y+=10;
      });
      y+=6;
    }

    // ── Risks ──────────────────────────────────────────────────
    if(r.risks?.length){
      checkPage(30);
      sectionHeader(secNum,'RIESGOS');secNum++;
      r.risks.forEach(rk=>{
        pdf.setFontSize(9);
        const rkLines=wrapText(rk.risk,CW-12);
        pdf.setFontSize(8.5);
        const impLines=wrapText(rk.implication||'',CW-12);
        const boxH=rkLines.length*5+impLines.length*5+14;
        checkPage(boxH+4);
        drawRect(ML,y-3,2.5,boxH,RED);
        drawRect(ML+2.5,y-3,CW-2.5,boxH,'#FFF5F5');
        // Risk title
        pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
        rkLines.forEach(line=>{pdf.text(line,ML+8,y);y+=5;});
        y+=4;
        // Implication
        pdf.setFontSize(8.5);pdf.setFont('helvetica','normal');pdf.setTextColor(SGRAY);
        impLines.forEach(line=>{checkPage(5);pdf.text(line,ML+8,y);y+=5;});
        y+=8;
      });
      y+=6;
    }

    // ── Opportunities ──────────────────────────────────────────
    if(r.opportunities?.length){
      checkPage(30);
      sectionHeader(secNum,'OPORTUNIDADES');secNum++;
      r.opportunities.forEach((o,idx)=>{
        checkPage(10);
        pdf.setFontSize(9);
        const oLines=wrapText(o,CW-14);
        const oH=oLines.length*5+6;
        drawRect(ML,y-3,2,oH,BLUE);
        drawRect(ML+2,y-3,CW-2,oH,LGRAY);
        pdf.setFont('helvetica','bold');pdf.setTextColor(BLUE);
        pdf.text('>',ML+6,y);
        pdf.setFont('helvetica','normal');pdf.setTextColor(BODY);
        oLines.forEach(line=>{checkPage(5);pdf.text(line,ML+11,y);y+=5;});
        y+=6;
      });
      y+=8;
    }

    // ── Recommendations ────────────────────────────────────────
    if(r.recommendations){
      pdf.addPage();currentPage++;y=MT;
      sectionHeader(secNum,'RECOMENDACIONES');secNum++;

      [{key:'short_term',label:'CORTO PLAZO',color:RED},{key:'medium_term',label:'MEDIANO PLAZO',color:NAVY},{key:'long_term',label:'LARGO PLAZO',color:BLUE}].forEach(hz=>{
        const items=r.recommendations[hz.key];
        if(!items?.length)return;
        checkPage(18);
        // Horizon badge
        drawRect(ML,y-3,CW*0.28,7,hz.color);
        pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor('#FFFFFF');
        pdf.text(hz.label,ML+3,y+1);
        y+=12;

        items.forEach((rec,idx)=>{
          const rcX=ML+10;
          // Pre-measure
          pdf.setFontSize(9);
          const aLines=wrapText(rec.action,CW-18);
          pdf.setFontSize(8.5);
          const ratLines=rec.rationale?wrapText(rec.rationale,CW-18):[];
          const impLines=rec.impact?wrapText('Impacto: '+rec.impact,CW-18):[];
          const recH=aLines.length*5+ratLines.length*4.5+impLines.length*4.5+10;
          checkPage(recH+6);
          // Number badge
          drawRect(ML,y-3,8,8,hz.color);
          pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor('#FFFFFF');
          pdf.text(String(idx+1),ML+4,y+2,{align:'center'});
          // Card background
          drawRect(rcX,y-3,CW-10,Math.max(8,recH),LGRAY);
          // Action
          pdf.setFontSize(9);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
          aLines.forEach(line=>{pdf.text(line,rcX+4,y);y+=5;});
          y+=2;
          // Rationale
          if(ratLines.length){
            pdf.setFontSize(8.5);pdf.setFont('helvetica','italic');pdf.setTextColor(SGRAY);
            ratLines.forEach(line=>{checkPage(4.5);pdf.text(line,rcX+4,y);y+=4.5;});
            y+=2;
          }
          // Impact
          if(impLines.length){
            pdf.setFontSize(8.5);pdf.setFont('helvetica','bold');pdf.setTextColor(hz.color);
            impLines.forEach(line=>{checkPage(4.5);pdf.text(line,rcX+4,y);y+=4.5;});
          }
          y+=8;
        });
        y+=6;
      });
    }

    // ── Information Gaps ───────────────────────────────────────
    if(r.information_gaps?.length){
      checkPage(30);
      sectionHeader(secNum,'BRECHAS DE INFORMACION');secNum++;
      r.information_gaps.forEach((g,idx)=>{
        checkPage(10);
        pdf.setFontSize(9);
        const gLines=wrapText(g,CW-16);
        const gH=gLines.length*5+6;
        drawRect(ML,y-3,2,gH,BLUE);
        drawRect(ML+2,y-3,CW-2,gH,'#F0F4FA');
        // Info marker
        pdf.setFontSize(8);pdf.setFont('helvetica','bold');pdf.setTextColor(BLUE);
        pdf.text('(i)',ML+6,y);
        // Text
        pdf.setFont('helvetica','normal');pdf.setTextColor(BODY);
        gLines.forEach(line=>{checkPage(5);pdf.text(line,ML+13,y);y+=5;});
        y+=6;
      });
      y+=8;
    }

    // ── Conclusion ─────────────────────────────────────────────
    if(r.conclusion){
      checkPage(30);
      sectionHeader(secNum,'CONCLUSION');secNum++;
      // Pre-measure
      pdf.setFontSize(10);
      const clLines=wrapText(r.conclusion,CW-16);
      const clH=14+clLines.length*5.5+8;
      checkPage(clH);
      drawRect(ML,y-4,2.5,clH,NAVY);
      drawRect(ML+2.5,y-4,CW-2.5,clH,LGRAY);
      // Label
      pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(NAVY);
      pdf.text('CONCLUSION',ML+8,y+2);
      y+=10;
      // Body
      pdf.setFontSize(10);pdf.setFont('helvetica','bolditalic');pdf.setTextColor(NAVY);
      clLines.forEach(line=>{checkPage(5.5);pdf.text(line,ML+8,y);y+=5.5;});
    }

    // ================================================================
    // HEADERS + FOOTERS on every page
    // ================================================================
    const pages=pdf.internal.getNumberOfPages();
    for(let p=1;p<=pages;p++){
      pdf.setPage(p);
      if(p===1){
        // Cover page — no header/footer, already styled
        continue;
      }
      // ── Header: thin navy top rule + ALTO branding ──
      drawRect(0,0,W,1.2,NAVY);
      pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(SGRAY);
      pdf.text('ALTO',W-MR,8,{align:'right'});

      // ── Footer ──
      drawRect(ML,H-14,CW,0.3,MGRAY);
      pdf.setFontSize(6.5);pdf.setFont('helvetica','normal');pdf.setTextColor(SGRAY);
      pdf.text('CONFIDENCIAL  |  ALTO Strategy  |  '+monthYear,ML,H-10);
      // BORRADOR in red
      pdf.setFontSize(7);pdf.setFont('helvetica','bold');pdf.setTextColor(RED);
      pdf.text('BORRADOR',W/2+10,H-10);
      // Page number
      pdf.setFontSize(6.5);pdf.setFont('helvetica','normal');pdf.setTextColor(SGRAY);
      pdf.text(p+' / '+pages,W-MR,H-10,{align:'right'});
    }

    pdf.save('Informe_ALTO_'+new Date().toISOString().slice(0,10)+'.pdf');
    flash('\u2713 PDF descargado');
  }catch(err){showError('Error PDF: '+err.message);}
}

// ============================================================
// HELPERS
// ============================================================
function esc(s){if(!s)return'';const d=document.createElement('div');d.textContent=s;return d.innerHTML;}
function setLoading(on){
  const b=document.getElementById('btnAnalyze');
  b.disabled=on;
  if(on){
    b.classList.add('generating-glow');
    b.innerHTML='<span class="spinner" style="border-top-color:#fff;border-color:rgba(255,255,255,0.3)"></span><span class="font-[Manrope] text-xs uppercase tracking-[0.2em]">Procesando...</span>';
  }else{
    b.classList.remove('generating-glow');
    b.innerHTML='<span class="material-symbols-outlined text-lg" style="font-variation-settings:\'FILL\' 1;">psychology</span><span class="font-[Manrope] text-xs uppercase tracking-[0.2em]">Generar Informe Ejecutivo</span>';
  }
}
function showStatus(m){const e=document.getElementById('statusMsg');e.textContent=m;e.classList.remove('hidden');}
function showError(m){const b=document.getElementById('errorBox');b.textContent=m;b.classList.remove('hidden');document.getElementById('statusMsg').classList.add('hidden');}
function hideError(){document.getElementById('errorBox').classList.add('hidden');}
function hidePreview(){document.getElementById('previewCard').classList.add('hidden');document.getElementById('editBanner').classList.add('hidden');document.getElementById('methodCards').classList.remove('hidden');}
function showExportBtns(){
  ['btnDocx','btnPdf','btnPptx','btnBrief'].forEach(id=>document.getElementById(id).classList.remove('hidden'));
  const floatBtn = document.getElementById('aiFloatBtn');
  if(floatBtn) floatBtn.style.display = 'flex';
}

// ============================================================
// MEJORA #8: FOLLOW-UP CHAT
// ============================================================

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  const wUrl = WORKER_URL;
  if (!msg || !result || !wUrl) return;

  input.value = '';
  input.disabled = true;
  addChatBubble('user', msg);

  const btn = document.getElementById('btnChat');
  btn.disabled = true;

  // Show typing indicator
  const container = document.getElementById('chatMessages');
  const typingEl = document.createElement('div');
  typingEl.id = 'chatTyping';
  typingEl.style.cssText = 'display:flex;align-items:flex-start;gap:8px';
  typingEl.innerHTML = `<div style="width:24px;height:24px;background:#E74243;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px"><span class="material-symbols-outlined" style="font-size:13px;color:#fff;font-variation-settings:'FILL' 1">smart_toy</span></div><div class="typing-bubble"><span></span><span></span><span></span></div>`;
  container.appendChild(typingEl);
  container.scrollTop = container.scrollHeight;

  chatHistory.push({ role: 'user', content: msg });

  try {
    const reply = await fetchFromWorker(wUrl, {
      userContent: '__CHAT_MODE__',
      chatMessages: [
        { role: 'user', content: `Este es el informe ejecutivo actual en JSON:\n\n${JSON.stringify(result, null, 2)}\n\nEl usuario tiene una consulta sobre este informe. Responde de forma concisa y profesional. Si el usuario pide modificar el informe, responde con el JSON actualizado completo precedido de la etiqueta __JSON_UPDATE__ en una línea separada. Si solo pide información o aclaración, responde en texto normal.\n\nConsulta del usuario: ${msg}` },
      ],
    }, null);

    typingEl.remove();

    // Check if response includes a JSON update
    if (reply.includes('__JSON_UPDATE__')) {
      const parts = reply.split('__JSON_UPDATE__');
      const textPart = parts[0].trim();
      const jsonPart = parts[1].replace(/```json|```/g, '').trim();
      try {
        const updated = JSON.parse(jsonPart);
        result = updated;
        renderPreview(result);
        addChatBubble('assistant', (textPart || t('uiReportUpdated')) + '\n\n✅ '+t('uiReportUpdatedDetail'));
      } catch(e) {
        addChatBubble('assistant', textPart || reply);
      }
    } else {
      addChatBubble('assistant', reply);
    }

    chatHistory.push({ role: 'assistant', content: reply });
  } catch(err) {
    typingEl.remove();
    addChatBubble('assistant', '❌ Error: ' + err.message);
  } finally {
    btn.disabled = false;
    input.disabled = false;
    input.focus();
  }
}

function addChatBubble(role, text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.style.cssText = role === 'user' ? 'display:flex;justify-content:flex-end' : 'display:flex;justify-content:flex-start;gap:8px;align-items:flex-start';
  if(role === 'assistant'){
    const avatar = document.createElement('div');
    avatar.style.cssText = 'width:24px;height:24px;background:#E74243;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px';
    avatar.innerHTML = '<span class="material-symbols-outlined" style="font-size:13px;color:#fff;font-variation-settings:\'FILL\' 1">smart_toy</span>';
    div.appendChild(avatar);
  }
  const bubble = document.createElement('div');
  bubble.style.cssText = role === 'user'
    ? 'background:#1A3350;color:#fff;font-family:Inter,sans-serif;font-size:13px;padding:10px 14px;border-radius:10px 10px 2px 10px;max-width:85%;white-space:pre-wrap;line-height:1.5'
    : 'background:#fff;border:1px solid #E0E3E5;border-left:3px solid #E74243;color:#191C1E;font-family:Inter,sans-serif;font-size:13px;padding:10px 14px;border-radius:2px 10px 10px 10px;max-width:85%;white-space:pre-wrap;line-height:1.5';
  bubble.textContent = text;
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  // Show notif dot on button if panel is collapsed and it's an AI response
  if(role === 'assistant' && !window._aiPanelOpen){
    const notif = document.getElementById('aiFloatNotif');
    if(notif) notif.style.display = 'block';
  }
}
function setDot(s){
  const d=document.getElementById('statusDot'),l=document.getElementById('statusDotLabel');
  d.classList.remove('connected');
  if(s==='ok'){d.style.background='#10b981';d.style.boxShadow='0 0 8px rgba(16,185,129,0.6)';d.classList.add('connected');l.textContent=t('uiConnected');}
  else if(s==='no'){d.style.background='#E74243';d.style.boxShadow='0 0 8px rgba(187,0,20,0.6)';l.textContent=t('uiError');}
  else{d.style.background='#64748b';d.style.boxShadow='none';l.textContent=t('uiOffline');}
}
function flash(m){showStatus(m);setTimeout(()=>{if(result)showStatus(t('uiReportReadyEdit'));},2500);}
function loadSample(){document.getElementById('inputText').value=`Tenemos un problema con las tiendas de México. Los eventos de pérdida han bajado un 15% en Q1 2026 comparado con Q4 2025, pero no sabemos si es porque mejoró la prevención o porque dejaron de reportar.\n\nLas tiendas de Walmart concentran el 60% de los eventos. Los modus operandi más frecuentes son hurto hormiga y robo organizado. El equipo legal tiene 340 expedientes abiertos y solo 12 han llegado a sentencia este trimestre.\n\nEl área de operaciones reporta que hay 3 tiendas que concentran el 25% de los eventos pero no han tenido visita de auditoría en 6 meses. El equipo de analytics detectó que los eventos de "robo organizado" subieron un 40% en tiendas de formato grande.\n\nNecesitamos decidir si reasignar guardias, cambiar protocolos en ciertas tiendas, priorizar casos legales por monto, y definir un modelo de scoring de tiendas por riesgo.\n\nNota: la data de modus operandi tiene un 30% de registros sin clasificar. También hay discrepancias entre los datos del sistema legacy y la plataforma nueva.`;}
// ============================================================
// NAV SIDEBAR — Minutas / Informes tab switching
// ============================================================
function switchNavTab(tab) {
  const minutasPanel   = document.getElementById('minutasPanel');
  const informesPanel  = document.getElementById('informesPanel');
  const contrastePanel = document.getElementById('contrastePanel');
  const navMinutas     = document.getElementById('navMinutas');
  const navInformes    = document.getElementById('navInformes');
  const navContraste   = document.getElementById('navContraste');
  const calSection     = document.getElementById('sidebarCalendar');
  const histSection    = document.getElementById('sidebarHistory');

  const activeStyle   = 'display:flex;align-items:center;gap:10px;width:100%;padding:10px 18px;font-family:Inter,sans-serif;font-size:13px;font-weight:500;color:#fff;background:rgba(187,0,20,0.12);border:none;border-left:3px solid #E74243;cursor:pointer;text-align:left';
  const inactiveStyle = 'display:flex;align-items:center;gap:10px;width:100%;padding:10px 18px;font-family:Inter,sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,0.55);background:transparent;border:none;border-left:3px solid transparent;cursor:pointer;text-align:left';

  if (tab === 'minutas') {
    minutasPanel.style.display   = 'block';
    informesPanel.style.display  = 'none';
    contrastePanel.style.display = 'none';
    navMinutas.style.cssText     = activeStyle;
    navInformes.style.cssText    = inactiveStyle;
    if (navContraste) navContraste.style.cssText = inactiveStyle;
    calSection.style.display     = 'block';
    histSection.style.display    = 'none';
    renderMinutasList();
  } else if (tab === 'contraste') {
    minutasPanel.style.display   = 'none';
    informesPanel.style.display  = 'none';
    contrastePanel.style.display = 'block';
    navMinutas.style.cssText     = inactiveStyle;
    navInformes.style.cssText    = inactiveStyle;
    if (navContraste) navContraste.style.cssText = activeStyle;
    calSection.style.display     = 'none';
    histSection.style.display    = 'none';
    initContrasteForm();
  } else {
    minutasPanel.style.display   = 'none';
    informesPanel.style.display  = 'block';
    contrastePanel.style.display = 'none';
    navMinutas.style.cssText     = inactiveStyle;
    navInformes.style.cssText    = activeStyle;
    if (navContraste) navContraste.style.cssText = inactiveStyle;
    calSection.style.display     = 'none';
    histSection.style.display    = 'block';
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
  const now   = new Date();
  const months = [-1, 0, 1].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const todayY = now.getFullYear(), todayM = now.getMonth(), todayD = now.getDate();

  // Build set of dates that have minutas (prefer cal_date for reliable matching)
  const minutasDates = new Set(loadMinutasHistory().map(m => m.cal_date || m.date || ''));

  let html = '';
  months.forEach(({ year, month }, idx) => {
    const isCurrent = year === todayY && month === todayM;
    const firstDay  = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    html += `<div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:600;color:${isCurrent ? '#E74243' : 'rgba(255,255,255,0.9)'};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;padding:0 2px">${monthNames[month]} ${year}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">`;
    ['D','L','M','X','J','V','S'].forEach(d => {
      html += `<div style="font-size:9px;color:rgba(255,255,255,0.35);text-align:center;padding:2px 0;font-weight:500">${d}</div>`;
    });
    for (let i = 0; i < firstDay; i++) html += `<div></div>`;
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = new Date(year, month, d).toLocaleDateString('es-CL');
      const isToday    = isCurrent && d === todayD;
      const hasMinutas = minutasDates.has(dateStr);
      const isSelected = _calSelectedDate === dateStr;

      let bg = 'transparent', color = 'rgba(255,255,255,0.55)', fw = '400', border = 'none';
      if (isSelected)    { bg = '#fff'; color = '#1A3350'; fw = '700'; }
      else if (isToday)  { bg = '#E74243'; color = '#fff'; fw = '600'; }
      else if (hasMinutas) { color = '#fff'; fw = '600'; }

      const dot = hasMinutas && !isSelected && !isToday
        ? `<div style="width:3px;height:3px;border-radius:50%;background:#E74243;margin:0 auto;margin-top:1px"></div>` : '';

      html += `<div onclick="filterMinutasByDate('${dateStr}')" style="font-size:10px;text-align:center;padding:3px 1px;border-radius:50%;background:${bg};color:${color};font-weight:${fw};cursor:pointer;transition:background .15s" title="${dateStr}">${d}${dot}</div>`;
    }
    html += `</div></div>`;
    if (idx < 2) html += `<div style="height:1px;background:rgba(255,255,255,0.08);margin:4px 0 12px"></div>`;
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
// Update renderHistory for dark sidebar
// ============================================================
function renderHistoryItems(items){
  const list = document.getElementById('historyList');
  if(!list)return;
  if(!items.length){
    list.innerHTML=`<p style="font-family:Inter,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);padding:12px 16px;font-style:italic">${t('uiNoResults')}</p>`;
    return;
  }
  list.innerHTML = items.map(h=>`
    <button onclick="loadFromHistory(${h.id})" style="display:block;width:100%;text-align:left;padding:10px 14px;background:transparent;border:none;border-radius:6px;cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
      <div style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${h.title}</div>
      <div style="font-family:Inter,sans-serif;font-size:9px;color:rgba(255,255,255,0.35);margin-top:3px">${h.date}</div>
    </button>
  `).join('');
}

function renderHistory(){
  const list = document.getElementById('historyList');
  if(!list)return;
  const history = loadHistory();
  const searchWrap = document.getElementById('historySearchWrap');
  if(!history.length){
    list.innerHTML=`<p style="font-family:Inter,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);padding:12px 16px;font-style:italic">${t('uiNoReports')}</p>`;
    if(searchWrap) searchWrap.style.display='none';
    return;
  }
  if(searchWrap) searchWrap.style.display='block';
  const q = (document.getElementById('historySearch')?.value||'').toLowerCase();
  renderHistoryItems(q ? history.filter(h=>h.title.toLowerCase().includes(q)) : history);
}

function filterHistory(q){
  const history = loadHistory();
  renderHistoryItems(q ? history.filter(h=>h.title.toLowerCase().includes(q.toLowerCase())) : history);
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

// ── Chart Utilities ──
function extractNumbers(r) {
  const nums = [];
  const pctRegex = /(\d+[\.,]?\d*)\s*%/g;
  const numRegex = /(\d+[\.,]?\d*)\s*(eventos|expedientes|tiendas|casos|guardias|sentencias|meses|d\u00edas|semanas|millones|M|K|USD|\$|CLP|MXN)/gi;
  const allText = [
    r.executive_summary, r.context,
    ...(r.findings||[]).map(f=>f.finding+' '+f.evidence+' '+f.business_implication),
    ...(r.analysis_blocks||[]).map(b=>(b.content||'')+' '+(b.governing_thought||'')+' '+(b.bullets||[]).join(' ')),
    ...(r.key_messages||[]),
  ].filter(Boolean).join(' ');
  let m;
  while((m=pctRegex.exec(allText))!==null){
    const val=m[1].replace(',','.');
    const before=allText.substring(Math.max(0,m.index-80),m.index).trim();
    const words=before.split(/\s+/).slice(-6).join(' ');
    nums.push({value:m[0],raw:val,label:words||'Porcentaje'});
  }
  while((m=numRegex.exec(allText))!==null){
    const val=m[1].replace(',','.');
    const unit=m[2];
    const before=allText.substring(Math.max(0,m.index-60),m.index).trim();
    const words=before.split(/\s+/).slice(-4).join(' ');
    if(!nums.some(n=>n.raw===val&&Math.abs(allText.indexOf(n.value)-m.index)<10)){
      nums.push({value:m[1]+' '+unit,raw:val,label:words||unit});
    }
  }
  const seen=new Set();
  return nums.filter(n=>{if(seen.has(n.value))return false;seen.add(n.value);return true;}).slice(0,8);
}

// ============================================================
// CONTRASTE MULTIFUENTE MODULE
// ============================================================

let _cmPuntos = ['', '', ''];
let _cmFuentes = [
  {nombre:'',rol:'',unidad:'',tipo:'área',notas:''},
  {nombre:'',rol:'',unidad:'',tipo:'área',notas:''}
];
let _cmTipoContraste = 'operativo_legal';
let _cmSensibilidad = 'uso_interno';
let _cmTono = 'ejecutivo_prudente';
let _cmProfundidad = 'estandar';
let _contrasteResult = null;
let _contrasteInited = false;

function initContrasteForm() {
  if (_contrasteInited) return;
  _contrasteInited = true;
  renderCmPuntos();
  renderCmFuentes();
}

// ── Chip selectors ────────────────────────────────────────────
function setCmTipo(el) {
  document.querySelectorAll('#cmTipoChips .rtype-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmTipoContraste = el.dataset.tipo;
}
function setCmSensibilidad(el) {
  document.querySelectorAll('#cmSensibilidadChips .rtype-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmSensibilidad = el.dataset.sens;
}
function setCmTono(el) {
  document.querySelectorAll('#cmTonoChips .rtype-chip').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  _cmTono = el.dataset.tono;
}
function setCmProfundidad(el) {
  document.querySelectorAll('#cmProfundidadChips .rtype-chip').forEach(b => b.classList.remove('active'));
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
        <span style="font-family:Manrope,sans-serif;font-size:10px;font-weight:800;color:#fff">${i+1}</span>
      </div>
      <input type="text" value="${esc(p)}" oninput="updateCmPunto(${i},this.value)" placeholder="Ej: Clústeres, ROI, Discovery..."
        style="flex:1;background:#F8F9FB;border:none;border-bottom:1px solid #BFC4C5;padding:8px 12px;font-family:Inter,sans-serif;font-size:13px;color:#191C1E;outline:none">
      ${_cmPuntos.length > 1
        ? `<button onclick="removeCmPunto(${i})" style="background:none;border:none;cursor:pointer;color:#9ca3af;padding:4px;display:flex;align-items:center" title="Eliminar">
             <span class="material-symbols-outlined" style="font-size:16px">close</span>
           </button>`
        : ''}
    </div>`;
  });
  container.innerHTML = h;
}
function updateCmPunto(i, val) { _cmPuntos[i] = val; }
function addCmPunto() { _cmPuntos.push(''); renderCmPuntos(); }
function removeCmPunto(i) { _cmPuntos.splice(i, 1); renderCmPuntos(); }

// ── Dynamic fuentes list ──────────────────────────────────────
function renderCmFuentes() {
  const container = document.getElementById('cmFuentesList');
  if (!container) return;
  const inputStyle = 'width:100%;background:#fff;border:none;border-bottom:1px solid #BFC4C5;padding:7px 10px;font-family:Inter,sans-serif;font-size:12px;color:#191C1E;outline:none';
  const labelStyle = 'font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:.12em;color:#1A3350;font-weight:700;display:block;margin-bottom:5px';
  let h = '';
  _cmFuentes.forEach((f, i) => {
    h += `<div style="background:#F8F9FB;padding:16px 18px;margin-bottom:12px;border-left:3px solid #4279B0">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
        <span style="font-family:Manrope,sans-serif;font-size:11px;font-weight:700;color:#1A3350">Fuente ${i+1}</span>
        ${_cmFuentes.length > 1
          ? `<button onclick="removeCmFuente(${i})" style="background:none;border:none;cursor:pointer;color:#9ca3af;display:flex;align-items:center;gap:4px;font-family:Inter,sans-serif;font-size:10px">
               <span class="material-symbols-outlined" style="font-size:14px">close</span>Eliminar
             </button>`
          : ''}
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
            <option value="área"${f.tipo==='área'?' selected':''}>Área</option>
            <option value="país"${f.tipo==='país'?' selected':''}>País</option>
            <option value="persona"${f.tipo==='persona'?' selected':''}>Persona</option>
            <option value="rol_funcional"${f.tipo==='rol_funcional'?' selected':''}>Rol funcional</option>
            <option value="fuente_técnica"${f.tipo==='fuente_técnica'?' selected':''}>Fuente técnica</option>
            <option value="otra"${f.tipo==='otra'?' selected':''}>Otra</option>
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
function updateCmFuente(i, field, val) { _cmFuentes[i][field] = val; }
function addCmFuente() { _cmFuentes.push({nombre:'',rol:'',unidad:'',tipo:'área',notas:''}); renderCmFuentes(); }
function removeCmFuente(i) { _cmFuentes.splice(i, 1); renderCmFuentes(); }

// ── Build structured text input ───────────────────────────────
function buildContrasteInput() {
  const sponsor           = (document.getElementById('cmSponsor')?.value || '').trim();
  const fecha             = (document.getElementById('cmFecha')?.value || '').trim();
  const analista          = (document.getElementById('cmAnalista')?.value || '').trim();
  const pais              = (document.getElementById('cmPais')?.value || '').trim();
  const objetivo          = (document.getElementById('cmObjetivo')?.value || '').trim();
  const notasInsumo       = (document.getElementById('cmNotasInsumo')?.value || '').trim();
  const fechaLevantamiento= (document.getElementById('cmFechaLevantamiento')?.value || '').trim();
  const unidad            = (document.getElementById('cmUnidad')?.value || '').trim();
  const observaciones     = (document.getElementById('cmObservaciones')?.value || '').trim();
  const puntos = _cmPuntos.filter(p => p.trim());
  const fuentes = _cmFuentes.filter(f => f.nombre.trim() || f.notas.trim());

  let text = 'INFORME DE CONTRASTE MULTIFUENTE\n' + '─'.repeat(48) + '\n\n';
  text += 'METADATOS\n';
  if (sponsor)            text += `Solicitante / Sponsor: ${sponsor}\n`;
  if (fecha)              text += `Fecha del informe: ${fecha}\n`;
  if (analista)           text += `Responsable del levantamiento: ${analista}\n`;
  if (pais)               text += `País / Geografía: ${pais}\n`;
  text += `Tipo de contraste: ${_cmTipoContraste.replace(/_/g,' ')}\n`;
  if (fechaLevantamiento) text += `Fecha del levantamiento: ${fechaLevantamiento}\n`;
  if (unidad)             text += `Unidad / Gerencia / Área: ${unidad}\n`;
  text += `Nivel de sensibilidad: ${_cmSensibilidad.replace(/_/g,' ')}\n`;
  text += '\n';
  if (objetivo)    { text += `OBJETIVO DEL INFORME\n${objetivo}\n\n`; }
  if (notasInsumo) { text += `NOTAS O INSUMO PRINCIPAL\n${notasInsumo}\n\n`; }
  if (puntos.length) {
    text += 'PUNTOS A CONTRASTAR\n';
    puntos.forEach((p, i) => { text += `${i+1}. ${p}\n`; });
    text += '\n';
  }
  if (fuentes.length) {
    text += 'FUENTES CONTRASTADAS\n';
    fuentes.forEach((f, i) => {
      text += `\nFuente ${i+1}:\n`;
      if (f.nombre) text += `  Nombre: ${f.nombre}\n`;
      if (f.rol)    text += `  Rol / Cargo: ${f.rol}\n`;
      if (f.unidad) text += `  País / Unidad: ${f.unidad}\n`;
      if (f.tipo)   text += `  Tipo: ${f.tipo}\n`;
      if (f.notas)  text += `  Notas por fuente:\n  ${f.notas.replace(/\n/g,'  \n')}\n`;
    });
    text += '\n';
  }
  if (observaciones) { text += `OBSERVACIONES DEL ANALISTA\n${observaciones}\n\n`; }
  text += `TONO DEL INFORME: ${_cmTono.replace(/_/g,' ')}\n`;
  text += `NIVEL DE PROFUNDIDAD: ${_cmProfundidad.replace(/_/g,' ')}\n`;
  return text;
}

// ── Submit ────────────────────────────────────────────────────
async function submitContraste() {
  const puntos = _cmPuntos.filter(p => p.trim());
  const fuentes = _cmFuentes.filter(f => f.nombre.trim() || f.notas.trim());
  const contrasteErrEl = document.getElementById('contrasteError');
  if (!puntos.length) {
    contrasteErrEl.textContent = 'Agrega al menos un punto a contrastar.';
    contrasteErrEl.style.display = 'block';
    return;
  }
  if (!fuentes.length) {
    contrasteErrEl.textContent = 'Agrega al menos una fuente con nombre o notas.';
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
    const txt = await fetchFromWorker(WORKER_URL, {
      userContent: input,
      reportType: 'multisource_contrast',
      outputLanguage
    }, (full, chunk) => {
      chunks++;
      const pct = Math.min(93, 12 + chunks * 3);
      fill.style.width = pct + '%';
    }, (phase) => {
      if (phase === 'thinking') {
        label.textContent = t('uiContrasteProgressThinking') || 'Analizando fuentes y puntos críticos...';
        fill.style.width = '8%';
      } else if (phase === 'writing') {
        label.textContent = t('uiContrasteProgressWriting') || 'Elaborando contraste ejecutivo...';
        fill.style.width = '15%';
      }
    });

    const clean = txt.replace(/```json|```/g, '').trim();
    _contrasteResult = JSON.parse(clean);
    result = _contrasteResult; // share with export functions

    fill.style.width = '100%';
    setTimeout(() => {
      prog.style.display = 'none';
      btn.disabled = false;
      btn.style.opacity = '1';
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
  document.getElementById('contrastePreviewSection').style.display = 'none';
  document.getElementById('contrasteFormSection').style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Status helper ─────────────────────────────────────────────
function showContrasteStatus(msg) {
  const el = document.getElementById('contrasteStatusMsg');
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

// ── Render preview ────────────────────────────────────────────
function renderContrastePreview(r) {
  const card = document.getElementById('contrastePreviewCard');
  if (!card) return;
  const dateStr = new Date().toLocaleDateString('es-CL', {year:'numeric',month:'long',day:'numeric'});
  let h = `<div id="contrasteReportContent" style="background:#fff;overflow:hidden;box-shadow:0 2px 40px rgba(4,22,39,0.08)">`;

  // Cover bar
  h += `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 32px;background:#1A3350">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-family:Manrope,sans-serif;font-weight:900;color:#fff;font-size:12px;letter-spacing:.2em;text-transform:uppercase">ALTO</span>
      <div style="width:1px;height:16px;background:rgba(255,255,255,0.2)"></div>
      <span style="font-family:Inter,sans-serif;font-size:10px;color:rgba(255,255,255,0.45);letter-spacing:.08em;text-transform:uppercase">Contraste Multifuente · Confidencial</span>
    </div>
    <span style="font-family:Inter,sans-serif;font-style:italic;font-size:10px;color:rgba(255,255,255,0.35)">${dateStr}</span>
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
      const bg = i%2===0?'#F8F9FB':'#fff';
      h += `<tr style="background:${bg}">
        <td style="padding:8px 12px;font-weight:600;color:#1A3350;border-bottom:1px solid #E0E3E5">${esc(s.name)}</td>
        <td style="padding:8px 12px;color:#44474C;border-bottom:1px solid #E0E3E5">${esc(s.role)}</td>
        <td style="padding:8px 12px;color:#44474C;border-bottom:1px solid #E0E3E5">${esc(s.unit)}</td>
        <td style="padding:8px 12px;color:#44474C;border-bottom:1px solid #E0E3E5">${esc(s.type)}</td>
      </tr>`;
    });
    h += `</tbody></table></div></div>`;
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
      h += `<div style="margin-bottom:${notLast?'32px':'0'};${notLast?'border-bottom:1px dashed #E0E3E5;padding-bottom:32px':''}">
        <div style="display:flex;gap:0;margin-bottom:14px">
          <div style="width:28px;background:#1A3350;display:flex;align-items:center;justify-content:center;flex-shrink:0">
            <span style="font-family:Manrope,sans-serif;font-weight:900;font-size:11px;color:#fff">${i+1}</span>
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
      const hasConv = ap.convergences?.length, hasDiv = ap.divergences?.length, hasGap = ap.gaps?.length;
      if (hasConv || hasDiv || hasGap) {
        h += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">`;
        h += hasConv
          ? `<div style="background:#EEF6EE;padding:11px 14px;border-top:3px solid #4279B0">
              <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#4279B0;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:7px">Convergencias</span>
              ${ap.convergences.map(c=>`<div style="font-family:Inter,sans-serif;font-size:11px;color:#1A3350;line-height:1.4;margin-bottom:4px">· ${esc(c)}</div>`).join('')}
            </div>`
          : '<div></div>';
        h += hasDiv
          ? `<div style="background:#FFF5F5;padding:11px 14px;border-top:3px solid #E74243">
              <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#E74243;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:7px">Divergencias</span>
              ${ap.divergences.map(d=>`<div style="font-family:Inter,sans-serif;font-size:11px;color:#191C1E;line-height:1.4;margin-bottom:4px">· ${esc(d)}</div>`).join('')}
            </div>`
          : '<div></div>';
        h += hasGap
          ? `<div style="background:#F8F9FB;padding:11px 14px;border-top:3px solid #74777D">
              <span style="font-family:Inter,sans-serif;font-size:9px;font-weight:700;color:#74777D;text-transform:uppercase;letter-spacing:.1em;display:block;margin-bottom:7px">Vacíos de Información</span>
              ${ap.gaps.map(g=>`<div style="font-family:Inter,sans-serif;font-size:11px;color:#44474C;line-height:1.4;margin-bottom:4px">· ${esc(g)}</div>`).join('')}
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
      Object.keys(row.source_views||{}).forEach(n => { if(!srcNames.includes(n)) srcNames.push(n); });
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
      const bg = i%2===0?'#F8F9FB':'#fff';
      h += `<tr style="background:${bg}">
        <td style="padding:9px 11px;font-weight:600;color:#1A3350;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.point)}</td>`;
      srcNames.forEach(n => {
        h += `<td style="padding:9px 11px;color:#44474C;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.source_views?.[n]||'—')}</td>`;
      });
      h += `<td style="padding:9px 11px;color:#44474C;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.convergence_divergence||'')}</td>
        <td style="padding:9px 11px;color:#1A3350;font-weight:500;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.preliminary_finding||'')}</td>
        <td style="padding:9px 11px;color:#E74243;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.risk_opportunity||'')}</td>
        <td style="padding:9px 11px;color:#44474C;border-bottom:1px solid #E0E3E5;vertical-align:top">${esc(row.suggested_action||'')}</td>
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
    [{key:'immediate',label:'Inmediatas',color:'#E74243'},{key:'short_term',label:'Corto Plazo',color:'#1A3350'},{key:'structural',label:'Estructurales',color:'#2A313E'}].forEach(hz => {
      const items = r.recommendations[hz.key];
      if (!items?.length) return;
      h += `<div style="margin-bottom:20px">
        <div style="display:inline-block;font-family:Inter,sans-serif;font-size:9px;text-transform:uppercase;letter-spacing:.15em;font-weight:700;color:#fff;padding:4px 12px;margin-bottom:12px;background:${hz.color}">${hz.label}</div>`;
      items.forEach((rec, i) => {
        h += `<div style="display:flex;gap:0;margin-bottom:10px">
          <div style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-family:Manrope,sans-serif;font-weight:900;font-size:11px;color:#fff;background:${hz.color}">${i+1}</div>
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
    pdf.save('Contraste_ALTO_' + new Date().toISOString().slice(0,10) + '.pdf');
    showContrasteStatus('PDF descargado');
  } catch (err) {
    showContrasteStatus('Error PDF: ' + err.message);
  }
}

// ── Markdown copy ─────────────────────────────────────────────
function copyContrasteMarkdown() {
  const r = _contrasteResult;
  if (!r) return;
  let md = `# ${r.title}\n*${r.subtitle||'Informe Ejecutivo de Contraste Multifuente'}*\n\n`;
  if (r.sponsor) md += `**Solicitante:** ${r.sponsor}  \n`;
  if (r.scope)   md += `**Alcance:** ${r.scope}\n`;
  md += `\n---\n\n`;
  if (r.central_message) md += `## Mensaje Central\n\n> **So What?** *${r.central_message}*\n\n`;
  if (r.executive_summary) md += `## Resumen Ejecutivo\n\n> ${r.executive_summary}\n\n`;
  if (r.key_messages?.length) {
    md += `## Mensajes Clave\n\n`;
    r.key_messages.forEach(m => { md += `- ${m}\n`; });
    md += '\n';
  }
  if (r.sources_map?.length) {
    md += `## Fuentes Contrastadas\n\n| Fuente | Rol | País/Unidad | Tipo |\n|--------|-----|-------------|------|\n`;
    r.sources_map.forEach(s => { md += `| ${s.name} | ${s.role} | ${s.unit} | ${s.type} |\n`; });
    md += '\n';
  }
  if (r.analysis_by_point?.length) {
    md += `## Desarrollo Analítico por Punto\n\n`;
    r.analysis_by_point.forEach((ap, i) => {
      md += `### ${i+1}. ${ap.point}\n\n`;
      if (ap.consolidated_reading) md += `**Lectura consolidada:** ${ap.consolidated_reading}\n\n`;
      if (ap.contrast) md += `**Contraste:** ${ap.contrast}\n\n`;
      if (ap.convergences?.length) { md += `**Convergencias:**\n`; ap.convergences.forEach(c=>{md+=`- ${c}\n`;}); md+='\n'; }
      if (ap.divergences?.length)  { md += `**Divergencias:**\n`;  ap.divergences.forEach(d=>{md+=`- ${d}\n`;}); md+='\n'; }
      if (ap.gaps?.length)         { md += `**Vacíos:**\n`;         ap.gaps.forEach(g=>{md+=`- ${g}\n`;}); md+='\n'; }
      if (ap.executive_finding) md += `**Hallazgo ejecutivo:** ${ap.executive_finding}\n\n`;
      if (ap.implication)       md += `**Implicancia:** ${ap.implication}\n\n`;
      if (ap.next_step)         md += `**Próximo paso:** ${ap.next_step}\n\n`;
    });
  }
  if (r.risks?.length) {
    md += `## Riesgos\n\n`;
    r.risks.forEach(rk => { md += `- **${rk.risk}** *(${rk.nature})*\n`; });
    md += '\n';
  }
  if (r.opportunities?.length) {
    md += `## Oportunidades\n\n`;
    r.opportunities.forEach(op => { md += `- ${op.opportunity} *(${op.improvement_type})*\n`; });
    md += '\n';
  }
  if (r.recommendations) {
    md += `## Recomendaciones\n\n`;
    [{key:'immediate',label:'Inmediatas'},{key:'short_term',label:'Corto Plazo'},{key:'structural',label:'Estructurales'}].forEach(hz => {
      const items = r.recommendations[hz.key];
      if (!items?.length) return;
      md += `### ${hz.label}\n\n`;
      items.forEach((rec,i) => { md += `${i+1}. **${rec.action}** — ${rec.rationale} *(${rec.impact})*\n`; });
      md += '\n';
    });
  }
  if (r.conclusion) md += `---\n\n## Conclusión Ejecutiva\n\n${r.conclusion}\n`;
  navigator.clipboard.writeText(md);
  showContrasteStatus('Markdown copiado');
}
