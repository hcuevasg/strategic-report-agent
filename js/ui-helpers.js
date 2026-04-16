// ============================================================
// UI HELPERS — Low-level DOM utilities with no report-logic deps.
// Depends only on: state.js (STEPS, progressTimer, result, t)
// ============================================================

function startProgress(){const s=document.getElementById('progressSection'),f=document.getElementById('progressFill'),st=document.getElementById('progressStep'),p=document.getElementById('progressPct');s.classList.remove('hidden');let i=0;f.style.width='0%';progressTimer=setInterval(()=>{if(i<STEPS.length){f.style.width=STEPS[i].pct+'%';st.textContent=STEPS[i].msg;p.textContent=STEPS[i].pct+'%';i++;}},2200);}
function stopProgress(ok){clearInterval(progressTimer);const f=document.getElementById('progressFill'),st=document.getElementById('progressStep'),p=document.getElementById('progressPct');if(ok){f.style.width='100%';st.textContent=t('uiCompleted');p.textContent='100%';setTimeout(()=>document.getElementById('progressSection').classList.add('hidden'),1500);}else{document.getElementById('progressSection').classList.add('hidden');}}

// HELPERS
// ============================================================
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
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

function setDot(s){
  const d=document.getElementById('statusDot'),l=document.getElementById('statusDotLabel');
  d.classList.remove('connected');
  if(s==='ok'){d.style.background='#10b981';d.style.boxShadow='0 0 8px rgba(16,185,129,0.6)';d.classList.add('connected');l.textContent=t('uiConnected');}
  else if(s==='no'){d.style.background='#E74243';d.style.boxShadow='0 0 8px rgba(187,0,20,0.6)';l.textContent=t('uiError');}
  else{d.style.background='#64748b';d.style.boxShadow='none';l.textContent=t('uiOffline');}
}
function flash(m){showStatus(m);setTimeout(()=>{if(result)showStatus(t('uiReportReadyEdit'));},2500);}
function loadSample(){document.getElementById('inputText').value=`Tenemos un problema con las tiendas de México. Los eventos de pérdida han bajado un 15% en Q1 2026 comparado con Q4 2025, pero no sabemos si es porque mejoró la prevención o porque dejaron de reportar.\n\nLas tiendas de Walmart concentran el 60% de los eventos. Los modus operandi más frecuentes son hurto hormiga y robo organizado. El equipo legal tiene 340 expedientes abiertos y solo 12 han llegado a sentencia este trimestre.\n\nEl área de operaciones reporta que hay 3 tiendas que concentran el 25% de los eventos pero no han tenido visita de auditoría en 6 meses. El equipo de analytics detectó que los eventos de "robo organizado" subieron un 40% en tiendas de formato grande.\n\nNecesitamos decidir si reasignar guardias, cambiar protocolos en ciertas tiendas, priorizar casos legales por monto, y definir un modelo de scoring de tiendas por riesgo.\n\nNota: la data de modus operandi tiene un 30% de registros sin clasificar. También hay discrepancias entre los datos del sistema legacy y la plataforma nueva.`;}
