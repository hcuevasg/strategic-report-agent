// ============================================================
// PPTX GENERATION v4 — ALTO Corporate Style (Fixed Colors + Space)
// ============================================================
// Changes from v3:
// - Replaced #1B7A4A (green) with #4279B0 (ALTO tertiary blue) 
// - Replaced #CC3333 with #BB0014 (ALTO corporate red)
// - Taller cards/columns in all layouts (better space usage)
// - Improved closing slide (no dead space)
// - Larger SoWhat boxes
// - Calibri typography throughout
// ============================================================

// ── i18n labels for PPTX (reads from global currentLang/i18n) ──
const pptxI18n = {
  es: { confidential:'CONFIDENCIAL', source:'Fuente', keyConclusion:'CONCLUSIÓN CLAVE' },
  en: { confidential:'CONFIDENTIAL', source:'Source', keyConclusion:'KEY CONCLUSION' },
  pt: { confidential:'CONFIDENCIAL', source:'Fonte', keyConclusion:'CONCLUSÃO-CHAVE' },
};
function tp(k){ return (pptxI18n[typeof currentLang!=='undefined'?currentLang:'es']||pptxI18n.es)[k]||pptxI18n.es[k]||k; }

// ── PPTX Progress helpers ──────────────────────────────────
const PPTX_STEPS = [
  {pct:8,  msg:'Analizando estructura del informe...'},
  {pct:18, msg:'Diseñando narrativa de slides...'},
  {pct:30, msg:'Aplicando principios McKinsey...'},
  {pct:42, msg:'Definiendo layouts y visualizaciones...'},
  {pct:55, msg:'Optimizando flujo argumental...'},
  {pct:68, msg:'Construyendo action titles...'},
  {pct:78, msg:'Incorporando datos clave...'},
  {pct:88, msg:'Finalizando estructura de slides...'},
  {pct:94, msg:'Validando coherencia narrativa...'},
  {pct:97, msg:'Preparando para renderizado...'},
];
let pptxProgressTimer = null;

function startPptxProgress(phase){
  const sec = document.getElementById('pptxProgressSection');
  const fill = document.getElementById('pptxProgressFill');
  const step = document.getElementById('pptxProgressStep');
  const pct  = document.getElementById('pptxProgressPct');
  const lbl  = document.getElementById('pptxProgressLabel');
  sec.classList.remove('hidden');
  
  lbl.textContent = phase || 'Diseñando slides...';
  fill.style.width = '0%';
  step.textContent = '';
  pct.textContent  = '';
  let i = 0;
  pptxProgressTimer = setInterval(() => {
    if(i < PPTX_STEPS.length){
      fill.style.width = PPTX_STEPS[i].pct + '%';
      step.textContent = PPTX_STEPS[i].msg;
      pct.textContent  = PPTX_STEPS[i].pct + '%';
      i++;
    }
  }, 2400);
}

function updatePptxProgress(pctVal, msg){
  clearInterval(pptxProgressTimer);
  document.getElementById('pptxProgressFill').style.width = pctVal + '%';
  document.getElementById('pptxProgressStep').textContent = msg || '';
  document.getElementById('pptxProgressPct').textContent  = pctVal + '%';
  document.getElementById('pptxProgressLabel').textContent = msg || 'Renderizando...';
}

function stopPptxProgress(ok){
  clearInterval(pptxProgressTimer);
  if(ok){
    document.getElementById('pptxProgressFill').style.width = '100%';
    document.getElementById('pptxProgressStep').textContent = 'Completado';
    document.getElementById('pptxProgressPct').textContent  = '100%';
    setTimeout(() => document.getElementById('pptxProgressSection').classList.add('hidden'), 1800);
  } else {
    document.getElementById('pptxProgressSection').classList.add('hidden');
  }
}

// ── Thumbnail generator ─────────────────────────────────────

function wrapText(ctx, text, x, y, maxW, lineH, align){
  if(!text) return;
  const words = text.split(' ');
  let line = '';
  const origAlign = ctx.textAlign;
  if(align) ctx.textAlign = align;
  words.forEach(word => {
    const test = line + word + ' ';
    if(ctx.measureText(test).width > maxW && line !== ''){
      ctx.fillText(line, x, y);
      line = word + ' ';
      y += lineH;
    } else { line = test; }
  });
  ctx.fillText(line, x, y);
  ctx.textAlign = origAlign;
}

// ── downloadPptx v4 ─────────────────────────────────────────
async function downloadPptx(){if(!result)return;
  const wUrl=WORKER_URL;
  const btn=document.getElementById('btnPptx');
  btn.disabled=true;
  startPptxProgress('Diseñando estructura de slides...');
  hideError();
  try{
    // Stream PPTX generation with real-time slide detection
    let slidesDetected=0;
    const txt=await fetchFromWorker(wUrl,{
          userContent:'__PPTX_MODE__',
          reportJSON:JSON.stringify(result),
          pptxInstructions:`VISUAL LAYOUTS DISPONIBLES — elige el más adecuado para cada slide:
- "stat_callouts": KPIs y cifras clave. USA data_points:[{value,label,trend?,trend_description?}] donde trend es "up"/"down"/"neutral" y trend_description es texto corto (ej: "+12% vs año anterior"). Mínimo 3, máximo 4 puntos.
- "bar_chart": evolución temporal o comparativo cuantitativo vertical. USA chart_data:{categories:["Ene","Feb",...],series:[{name:"Métrica",values:[10,20,...]}]}. Para una sola métrica usa SIEMPRE 1 serie con todos los valores — NUNCA una serie por categoría.
- "line_chart": tendencias y series temporales con múltiples líneas. USA chart_data:{categories,series}. Múltiples series OK aquí.
- "horizontal_bar": rankings de entidades (tiendas, regiones, productos). USA chart_data con 1 sola serie: {categories:["Entidad A","Entidad B",...],series:[{name:"Valor",values:[85,72,...]}]}. NUNCA uses una serie por entidad. Ordena categorías de mayor a menor valor.
- "donut_chart": composición o distribución porcentual. USA data_points:[{value:"35%",label:"Nombre"}]. Máximo 6 segmentos.
- "comparison": comparar 2-3 opciones/escenarios. USA columns:[{title,items}].
- "pillars": 3-4 pilares estratégicos paralelos. USA columns:[{title,items}].
- "process": flujo de pasos secuenciales (3-5 pasos). USA columns:[{title,items}] — cada columna es un paso.
- "timeline": roadmap o fases temporales. USA columns:[{title,items}] — cada columna es una fase.
- "matrix": clasificar 4 conceptos en cuadrantes 2x2. USA columns:[{title,items}] — TL, TR, BL, BR. Incluye etiquetas de ejes en subheading.
- "waterfall": gráfico waterfall McKinsey para descomposiciones de un total en sus componentes. USA data_points:[{value:number,label,type}] donde type es "positive","negative" o "total". IMPORTANTE: Los componentes deben sumar al total. Ej: Revenue 100 = Product 60 + Services 30 + Other 10. El primer punto suele ser el total (type:"total"), luego los componentes positivos/negativos que lo explican. NO pongas un valor enorme + componentes diminutos — los componentes deben ser proporcionales y visualmente comparables.
- "traffic_light": tabla de estado con semáforos. USA rows:[{label,status,detail}] donde status es "green","yellow","red". Ideal para scorecards, riesgos, KPIs de seguimiento.
- "stacked_bar": composición o desglose porcentual por categoría. USA chart_data:{categories,series} con múltiples series que se apilan.
- "icon_grid": grilla de puntos clave numerados. USA items:[{title,description}]. Máximo 9 items. Ideal para "factores críticos", "próximos pasos", "conclusiones clave".
- "funnel": pipeline o embudo de conversión. USA data_points:[{value,label}] ordenados de mayor a menor.
- "split": texto izquierda + bloque destacado derecha. USA body_text + highlight_box.
- "none": slide estándar con body_text + bullets.

REGLAS OBLIGATORIAS:
- Slide 2 SIEMPRE type:"toc" con items:[{title,description}] y campo "tagline".
- Slide 3 SIEMPRE type:"storyline" con body_text (tesis central, 1 oración poderosa) y bullets (3-4 líneas argumentales). Visual_suggestion:"none".
- Cada slide de contenido DEBE incluir section_label:"SECCIÓN N · NOMBRE DE SECCIÓN" para el breadcrumb tracker.
- Executive summary slides DEBEN incluir key_messages:["assertion 1","assertion 2","assertion 3"] — cada una es un insight independiente, no una descripción.
- Para slides con charts, incluye chart_annotation:"insight principal, ej: ▲ +40% vs trimestre anterior" cuando haya un dato destacable.
- type:"divider" debe incluir section_number (número), total_sections (total), y items:[{title}] con 2-4 temas de la sección. Incluye el número de sección en subheading ("Sección 1", "Sección 2", etc).
- Subheadings deben conectar narrativamente con el slide anterior (ej: "Habiendo dimensionado el impacto operativo, evaluamos la respuesta legal").
- USA type:"divider" (sin visual_suggestion) para separar secciones principales — slide navy oscuro con solo el título de la sección.
- INCLUYE AL MENOS: 1x stat_callouts, 1x line_chart o bar_chart, 1x process o timeline, 1x comparison o pillars.
- USA los nuevos layouts cuando corresponda: waterfall para análisis financiero de componentes, traffic_light para dashboards de estado, stacked_bar para composición, icon_grid para próximos pasos o factores clave, funnel para embudos o pipelines.
- NO repitas el mismo visual_suggestion más de 2 slides seguidos.
- Slides riesgos → type:"risks", visual:"comparison" o "traffic_light" con acento rojo.
- Slides oportunidades → type:"opportunities", visual:"pillars" o "matrix".
- Si hay KPIs o métricas → stat_callouts con trend arrows y trend_description.
- Si hay evolución temporal → line_chart (múltiples series) o bar_chart (una serie).
- Si hay rankings o comparativos entre entidades → horizontal_bar.
- Si hay distribución porcentual → donut_chart o stacked_bar.
- Si hay proceso o metodología → process.
- Si hay análisis financiero de build-up → waterfall.
- Si hay próximos pasos o factores clave (3-9 items) → icon_grid.
- Sin emojis ni símbolos decorativos en ningún campo de texto.
- Mínimo 10 slides, máximo 16 (sin contar cover y closing).`
        },(fullText,chunk)=>{
          // Detect slides as they stream in by counting "action_title" occurrences
          const matches=fullText.match(/"action_title"/g);
          const count=matches?matches.length:0;
          if(count>slidesDetected){
            slidesDetected=count;
            // Extract the latest action_title
            const titleMatch=fullText.match(/"action_title"\s*:\s*"([^"]{1,80})"/g);
            const lastTitle=titleMatch?titleMatch[titleMatch.length-1].replace(/"action_title"\s*:\s*"/,'').replace(/"$/,''):'';
            const pct=Math.min(92,20+Math.round(slidesDetected*5));
            updatePptxProgress(pct, `Slide ${slidesDetected}: ${lastTitle.substring(0,50)}...`);
          }
        },(phase)=>{
          if(phase==='thinking') updatePptxProgress(5, 'Pensando estructura narrativa...');
          else if(phase==='writing') updatePptxProgress(15, 'Diseñando slides...');
        });
    const clean=txt.replace(/```json|```/g,'').trim();
    let slideData;try{slideData=JSON.parse(clean);}catch(e){throw new Error('IA no devolvió JSON de slides válido');}

    updatePptxProgress(98, 'Renderizando presentación ALTO...');
    const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='ALTO';pptx.title=result.title;
    const A=ALTO;
    const W=13.33,M=0.5,CW=W-2*M;

    // --- SLIDE MASTER ---
    pptx.defineSlideMaster({title:'ALTO_MASTER',background:{color:A.WHITE},objects:[
      {text:{text:tp('confidential')+' | ALTO Strategy | '+new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long'}),options:{x:M,y:7.25,w:8,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:false}}},
      {text:{text:'BORRADOR',options:{x:9.8,y:7.25,w:1.6,h:0.2,fontSize:7,fontFace:'Calibri',color:A.RED,bold:true,align:'right',charSpacing:2}}},
    ],slideNumber:{x:11.5,y:7.25,w:1.5,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,align:'right'}});

    // --- HELPER FUNCTIONS ---
    function addLogo(sl){if(logoBase64)sl.addImage({data:'image/png;base64,'+logoBase64,x:12.1,y:0.1,w:1.0,h:0.39});}
    function actionTitle(sl,t,accent){
      const titleW=W-SW-M-0.25;
      // McKinsey characteristic top rule — full-width navy line
      sl.addShape('rect',{x:0,y:0,w:W,h:0.045,fill:{color:A.NAVY}});
      sl.addShape('rect',{x:0,y:0.045,w:W,h:1.005,fill:{color:A.WHITE}});
      const titleText=t||result.title||'';
      if(titleText){
        sl.addText(titleText,{x:M,y:0.1,w:titleW,h:0.78,fontSize:19,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.05,valign:'middle',shrinkText:true});
        sl.addShape('rect',{x:M,y:0.93,w:1.2,h:0.04,fill:{color:accent||A.RED}});
      }
      addLogo(sl);
    }
    // ── Helper: normalize chart series ──────────────────────────
    // 1. Pads/trims values to match category count
    // 2. Collapses "N series × 1 value" (Claude anti-pattern) into "1 series × N values"
    //    so bar/horizontal_bar renders as a clean single-color ranking
    function normalizeChartData(cd){
      const cats=(cd.categories||[]).map(String);
      let series=(cd.series||[]).map(ser=>{
        const vals=(ser.values||[]).map(Number);
        while(vals.length<cats.length)vals.push(0);
        return {name:ser.name||'',labels:cats,values:vals.slice(0,cats.length)};
      });
      // Detect: each series has exactly 1 non-zero value (Claude encoded each category as a series)
      const isAntiPattern = series.length>1 && cats.length>1 &&
        series.every(ser=>ser.values.filter(v=>v!==0).length<=1);
      if(isAntiPattern){
        // Collapse: pick the non-zero value (or first) from each series
        const collapsed=series.map(ser=>{
          const nz=ser.values.find(v=>v!==0);
          return nz!==undefined?nz:ser.values[0]||0;
        });
        series=[{name:'',labels:cats,values:collapsed}];
      }
      return{cats,series};
    }
    // SO WHAT panel constants
    const SW=3.5;
    const SX=W-SW;

    function soWhatPanel(sl,text){
      if(!text)return;
      const panelY=1.0;
      const panelH=7.5-panelY;
      sl.addShape('rect',{x:SX,y:panelY,w:SW,h:panelH,fill:{color:A.WHITE}});
      sl.addShape('rect',{x:SX,y:panelY,w:0.08,h:panelH,fill:{color:A.RED}});
      sl.addShape('rect',{x:SX+0.08,y:panelY,w:SW-0.08,h:1.05,fill:{color:'F2F4F6'}});
      sl.addText('SO WHAT?',{x:SX+0.25,y:panelY+0.18,w:SW-0.35,h:0.65,fontSize:22,fontFace:'Calibri',color:A.RED,bold:true,charSpacing:3,valign:'middle'});
      sl.addShape('rect',{x:SX+0.08,y:panelY+1.05,w:SW-0.08,h:0.04,fill:{color:A.RED}});
      sl.addText('\u201C',{x:SX+0.15,y:panelY+1.05,w:0.9,h:0.9,fontSize:72,fontFace:'Calibri',color:'E0E3E5',bold:true,align:'left',valign:'top'});
      // shrinkText prevents text overflow when so_what is long
      sl.addText(text,{x:SX+0.22,y:panelY+1.7,w:SW-0.38,h:panelH-2.1,fontSize:14,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.65,valign:'top',wrap:true,shrinkText:true});
    }
    // ── Helper: add so_what as speaker note ──
    function addNote(sl,text){if(text)sl.addNotes(text);}

    function soWhatBox(sl,text,y){ /* no-op */ }
    function srcNote(sl,t){if(t)sl.addText(tp('source')+': '+t,{x:M,y:6.9,w:8,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,italic:true,shrinkText:true});}
    function chartFallback(sl,s,cy,eLW){
      // Show body_text/bullets when chart data is missing
      const parts=[];
      if(s.body_text) parts.push({text:s.body_text,options:{fontSize:12,color:A.BODY}});
      if(s.bullets&&s.bullets.length){
        if(parts.length) parts.push({text:'\n\n',options:{fontSize:5}});
        s.bullets.forEach((b,j)=>{
          if(j>0) parts.push({text:'\n',options:{fontSize:4}});
          parts.push({text:'\u25B8 ',options:{fontSize:11,color:A.RED,bold:true}});
          parts.push({text:b,options:{fontSize:11,color:A.BODY}});
        });
      }
      if(parts.length) sl.addText(parts,{x:M,y:cy,w:eLW,h:7.5-cy-0.8,fontFace:'Calibri',lineSpacingMultiple:1.5,valign:'top',shrinkText:true});
    }

    const slides=slideData.slides||[];

    // Pre-compute actual PPTX slide numbers for TOC (each slides[] entry = 1 PPTX slide, 1-based)
    const tocSlideNums=slides
      .map((sl,i)=>({type:sl.type,num:i+1}))
      .filter(x=>x.type!=='cover'&&x.type!=='toc'&&x.type!=='closing')
      .map(x=>x.num);

    const slideErrors=[];
    slides.forEach((s,sIdx)=>{
      const vis=s.visual_suggestion||'none';
      try{

      // =================== COVER — Strategic Insights style ===================
      if(s.type==='cover'){
        const sl=pptx.addSlide();sl.background={color:'F8F9FB'};
        // Left side — light surface, large bold title
        const leftW=7.8;
        // Logo color (top left)
        if(logoBase64)sl.addImage({data:'image/png;base64,'+logoBase64,x:0.55,y:0.4,w:1.6,h:0.63});
        // Main title — constrained to avoid overlapping metadata below
        sl.addText(s.action_title||result.title,{x:0.55,y:1.45,w:leftW-0.8,h:2.8,fontSize:28,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.1,valign:'top',shrinkText:true});
        // Subtitle italic
        if(s.subheading)sl.addText(s.subheading,{x:0.55,y:4.35,w:leftW-1.0,h:0.4,fontSize:11,fontFace:'Calibri',color:A.SGRAY,italic:true,shrinkText:true});
        // Presented by / date row
        sl.addShape('rect',{x:0.55,y:5.55,w:0.03,h:0.7,fill:{color:A.MGRAY}});
        sl.addText('Preparado por',{x:0.72,y:5.55,w:2,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:false,letterSpacing:2});
        sl.addText('ALTO Strategy',{x:0.72,y:5.75,w:2.5,h:0.3,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true});
        sl.addShape('rect',{x:3.1,y:5.55,w:0.03,h:0.7,fill:{color:A.MGRAY}});
        sl.addText('Fecha',{x:3.28,y:5.55,w:1.5,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:false,letterSpacing:2});
        sl.addText(new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long'}),{x:3.28,y:5.75,w:3,h:0.3,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true});
        // CONFIDENCIAL small
        sl.addText(tp('confidential'),{x:0.55,y:6.55,w:3,h:0.25,fontSize:8,fontFace:'Calibri',color:A.RED,bold:true,letterSpacing:3});
        // Right side — asymmetric navy shape (simulated with tall rect from 60% to right edge)
        const rX=leftW+0.1;
        const rW=W-rX;
        sl.addShape('rect',{x:rX,y:0,w:rW,h:7.5,fill:{color:A.NAVY}});
        // Accent shapes on right side
        sl.addShape('rect',{x:rX,y:0,w:0.08,h:7.5,fill:{color:A.RED}});
        sl.addShape('rect',{x:rX+0.2,y:5.8,w:1.8,h:0.04,fill:{color:A.RED}});
        sl.addShape('rect',{x:rX+0.2,y:5.95,w:1.2,h:0.04,fill:{color:A.TBLUE}});
        sl.addText('ALTO · Strategic Insights',{x:rX+0.25,y:6.2,w:rW-0.4,h:0.25,fontSize:7,fontFace:'Calibri',color:'8192A7',letterSpacing:3,bold:false});
        return;
      }
      // =================== CLOSING ===================
      if(s.type==='closing'){
        // Closing — same split layout as cover
        const sl=pptx.addSlide();sl.background={color:'F8F9FB'};
        const cRX=7.8;const cRW=W-cRX;
        // Left side
        if(logoBase64)sl.addImage({data:'image/png;base64,'+logoBase64,x:0.55,y:0.4,w:1.6,h:0.63});
        sl.addText(s.action_title||'Gracias',{x:0.55,y:1.6,w:cRX-0.8,h:2.5,fontSize:28,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.1,valign:'top',shrinkText:true});
        if(s.subheading)sl.addText(s.subheading,{x:0.55,y:4.0,w:cRX-1.0,h:0.4,fontSize:12,fontFace:'Calibri',color:A.SGRAY,italic:true});
        sl.addShape('rect',{x:0.55,y:5.0,w:2.2,h:0.05,fill:{color:A.RED}});
        sl.addShape('rect',{x:0.55,y:5.15,w:1.2,h:0.04,fill:{color:'B0B6B8'}});
        sl.addText('Preparado por',{x:0.72,y:5.45,w:2,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,charSpacing:2});
        sl.addText('ALTO Strategy',{x:0.72,y:5.65,w:2.5,h:0.3,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true});
        sl.addText(new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long'}),{x:0.72,y:6.0,w:3,h:0.3,fontSize:10,fontFace:'Calibri',color:A.SGRAY});
        sl.addText(tp('confidential'),{x:0.55,y:6.55,w:3,h:0.25,fontSize:8,fontFace:'Calibri',color:A.RED,bold:true,charSpacing:3});
        // Right side — navy block
        sl.addShape('rect',{x:cRX,y:0,w:cRW,h:7.5,fill:{color:A.NAVY}});
        sl.addShape('rect',{x:cRX,y:0,w:0.08,h:7.5,fill:{color:A.RED}});
        if(logoWhiteBase64)sl.addImage({data:'image/png;base64,'+logoWhiteBase64,x:cRX+0.5,y:2.8,w:2.8,h:1.1});
        sl.addShape('rect',{x:cRX+0.2,y:5.8,w:1.8,h:0.04,fill:{color:A.RED}});
        sl.addShape('rect',{x:cRX+0.2,y:5.95,w:1.2,h:0.04,fill:{color:'B0B6B8'}});
        sl.addText('ALTO · Strategic Insights',{x:cRX+0.25,y:6.2,w:cRW-0.4,h:0.25,fontSize:7,fontFace:'Calibri',color:'8192A7',charSpacing:3});
        return;
      }

      // =================== TABLE OF CONTENTS ===================
      if(s.type==='toc'){
        const sl=pptx.addSlide();sl.background={color:'F8F9FB'};
        addLogo(sl);
        sl.addShape('rect',{x:0,y:0,w:0.08,h:7.5,fill:{color:A.NAVY}});
        sl.addText('Contenido',{x:M,y:0.25,w:6,h:0.6,fontSize:24,fontFace:'Calibri',color:A.NAVY,bold:true});
        sl.addShape('rect',{x:M,y:0.88,w:1.0,h:0.04,fill:{color:A.RED}});
        const items=s.items||[];
        const startY=1.1;
        const maxY=6.9; // leave room for footer
        const availH=maxY-startY;
        const listW=CW*0.68;
        // Dynamic row height: compact when many items
        const showDesc=items.length<=8;
        const rowH=Math.min(0.62, availH/items.length);
        const circleSize=Math.min(0.32, rowH*0.5);
        const titleFontSize=items.length<=8?11:items.length<=12?10:9;
        items.forEach((item,i)=>{
          const iy=startY+(i*rowH);
          sl.addShape('roundRect',{x:M,y:iy+(rowH-circleSize)/2,w:circleSize,h:circleSize,fill:{color:i===0?A.RED:A.TBLUE},rectRadius:0.12});
          sl.addText(String(i+1),{x:M,y:iy+(rowH-circleSize)/2,w:circleSize,h:circleSize,fontSize:circleSize>0.28?10:8,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
          const titleH=showDesc?rowH*0.55:rowH-0.04;
          sl.addText(item.title||item,{x:M+0.45,y:iy,w:listW-1.2,h:titleH,fontSize:titleFontSize,fontFace:'Calibri',color:A.NAVY,bold:true,valign:'middle',shrinkText:true});
          // Use pre-computed actual PPTX slide number
          const actualNum=tocSlideNums[i]||'';
          sl.addText(String(actualNum),{x:M+listW-0.8,y:iy,w:0.7,h:titleH,fontSize:titleFontSize-1,fontFace:'Calibri',color:A.SGRAY,bold:false,align:'right',valign:'middle'});
          // Description — only when there's room
          if(showDesc&&item.description){
            sl.addText(item.description,{x:M+0.45,y:iy+titleH,w:listW-1.2,h:rowH*0.4,fontSize:8,fontFace:'Calibri',color:A.SGRAY,italic:false,valign:'top',shrinkText:true});
          }
          if(i<items.length-1){
            sl.addShape('rect',{x:M,y:iy+rowH-0.02,w:listW,h:0.008,fill:{color:A.MGRAY}});
          }
        });
        // Right panel — navy background, tagline — fits content area
        const panelX=M+listW+0.15;
        const panelW=CW-listW-0.15;
        const panelH=maxY-1.0;
        sl.addShape('rect',{x:panelX,y:1.0,w:panelW,h:panelH,fill:{color:'EBF2FA'},line:{color:'C8DFF2',width:0.5}});
        sl.addShape('rect',{x:panelX,y:1.0,w:0.06,h:panelH,fill:{color:A.RED}});
        if(s.tagline){
          sl.addText(s.tagline,{x:panelX+0.22,y:1.2,w:panelW-0.38,h:panelH-0.4,
            fontSize:13,fontFace:'Calibri',color:A.NAVY,italic:false,
            lineSpacingMultiple:1.7,valign:'middle',bold:false,shrinkText:true});
        }
        return;
      }

      // =================== DIVIDER SLIDE — cover style ===================
      if(s.type==='divider'){
        const sl=pptx.addSlide();sl.background={color:'F8F9FB'};
        // Left side — light, large section title (mirrors cover)
        const dRX=6.8;const dRW=W-dRX;
        // Logo top-left
        if(logoBase64)sl.addImage({data:'image/png;base64,'+logoBase64,x:0.55,y:0.4,w:1.6,h:0.63});
        // Section label (subheading)
        if(s.subheading)sl.addText(s.subheading.toUpperCase(),{x:0.55,y:2.15,w:dRX-0.8,h:0.3,fontSize:9,fontFace:'Calibri',color:A.RED,bold:true,charSpacing:4});
        // Large section title — navy on light background
        sl.addText(s.action_title||'',{x:0.55,y:2.55,w:dRX-0.8,h:2.6,fontSize:32,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.1,valign:'top',shrinkText:true});
        // Red accent lines
        sl.addShape('rect',{x:0.55,y:5.3,w:2.2,h:0.05,fill:{color:A.RED}});
        sl.addShape('rect',{x:0.55,y:5.45,w:1.2,h:0.04,fill:{color:'B0B6B8'}});
        let divFootY=5.55;
        if(s.body_text){sl.addText(s.body_text,{x:0.55,y:divFootY,w:dRX-0.8,h:0.45,fontSize:11,fontFace:'Calibri',color:A.SGRAY,italic:true,shrinkText:true});divFootY+=0.5;}
        // Section progress indicator
        if(s.section_number&&s.total_sections){
          const progText='Sección '+s.section_number+' de '+s.total_sections;
          sl.addText(progText,{x:0.55,y:divFootY,w:dRX-0.8,h:0.25,fontSize:8,fontFace:'Calibri',color:A.SGRAY,charSpacing:2});divFootY+=0.3;
        }
        // Mini-TOC items — cap to fit within slide (max y=7.1)
        if(s.items&&s.items.length){
          const miniY=divFootY+0.1;
          const maxItems=Math.min(s.items.length,Math.floor((7.0-miniY)/0.24));
          const itemH=Math.min(0.24,(7.0-miniY)/maxItems);
          s.items.slice(0,maxItems).forEach((item,i)=>{
            sl.addText((i+1)+'. '+(typeof item==='string'?item:item.title||''),{x:0.72,y:miniY+i*itemH,w:dRX-1.2,h:itemH,fontSize:8,fontFace:'Calibri',color:A.SGRAY,valign:'middle',shrinkText:true});
          });
        }
        // Right side — navy block (same as cover)
        sl.addShape('rect',{x:dRX,y:0,w:dRW,h:7.5,fill:{color:A.NAVY}});
        sl.addShape('rect',{x:dRX,y:0,w:0.08,h:7.5,fill:{color:A.RED}});
        sl.addShape('rect',{x:dRX+0.2,y:5.8,w:1.8,h:0.04,fill:{color:A.RED}});
        sl.addShape('rect',{x:dRX+0.2,y:5.95,w:1.2,h:0.04,fill:{color:'B0B6B8'}});
        sl.addText('ALTO · Strategic Insights',{x:dRX+0.25,y:6.2,w:dRW-0.4,h:0.25,fontSize:7,fontFace:'Calibri',color:'8192A7',charSpacing:3,bold:false});
        return;
      }

      // =================== CONTENT SLIDES ===================
      const sl=pptx.addSlide({masterName:'ALTO_MASTER'});
      // FIXED: Use only ALTO corporate colors for accents
      const accentColor=s.type==='risks'?A.RED:s.type==='opportunities'?A.TBLUE:A.RED;
      actionTitle(sl,s.action_title,accentColor);
      let cy=1.02;
      const LW=SX-M-0.25; // left content width (when SO WHAT panel present)
      const eLW=s.so_what?LW:CW; // effective content width — full when no SO WHAT
      if(s.section_label){sl.addText(s.section_label.toUpperCase(),{x:M,y:cy,w:eLW,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:true,charSpacing:3,valign:'middle'});cy+=0.28;}
      if(s.subheading){sl.addText(s.subheading,{x:M,y:cy,w:eLW,h:0.3,fontSize:11,fontFace:'Calibri',color:A.SGRAY,italic:true,valign:'middle',shrinkText:true});cy+=0.38;}

      // ========== LAYOUT: STORYLINE ==========
      if(s.type==='storyline') {
        sl.addShape('rect',{x:M,y:cy,w:eLW,h:2.2,fill:{color:A.LGRAY}});
        sl.addShape('rect',{x:M,y:cy,w:eLW,h:0.06,fill:{color:A.RED}});
        sl.addText(s.body_text||'',{x:M+0.3,y:cy+0.2,w:eLW-0.6,h:1.8,fontSize:14,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.4,valign:'middle',shrinkText:true});
        const argY=cy+2.5;
        const args=s.bullets||[];
        const argCols=Math.min(args.length,4)||1;
        const argW=eLW/argCols;
        args.slice(0,4).forEach((arg,i)=>{
          const ax=M+i*argW;
          sl.addShape('rect',{x:ax+0.06,y:argY,w:argW-0.12,h:3.2,fill:{color:A.WHITE},line:{color:A.MGRAY,width:0.5}});
          sl.addShape('rect',{x:ax+0.06,y:argY,w:argW-0.12,h:0.06,fill:{color:i===0?A.RED:A.NAVY}});
          sl.addShape('ellipse',{x:ax+argW/2-0.18,y:argY+0.2,w:0.36,h:0.36,fill:{color:i===0?A.RED:A.NAVY}});
          sl.addText(String(i+1),{x:ax+argW/2-0.18,y:argY+0.2,w:0.36,h:0.36,fontSize:12,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
          sl.addText(arg,{x:ax+0.15,y:argY+0.7,w:argW-0.3,h:2.4,fontSize:11,fontFace:'Calibri',color:A.BODY,lineSpacingMultiple:1.35,valign:'top',shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);
        srcNote(sl,s.source_note);
        addNote(sl,s.so_what);
        return;
      }

      // ========== LAYOUT: STAT CALLOUTS ==========
      if(vis==='stat_callouts' && s.data_points&&s.data_points.length){
        const dp=s.data_points.slice(0,4);
        const cols=dp.length;
        // For 2 cards: cap width so they don't stretch to fill full LW
        const maxColW=cols<=2?3.2:eLW/cols;
        const totalW=maxColW*cols;
        const startX=M+(eLW-totalW)/2; // center if narrower than eLW
        const colW=maxColW;
        const cardColors=[A.NAVY,A.RED,A.NAVY,A.RED];
        const cardH=4.5;
        dp.forEach((d,i)=>{
          const cx=startX+(i*colW);
          const val=String(d.value);
          // Auto-size: shorter values get bigger font, long values scale down
          const numFontSize=val.length<=3?52:val.length<=5?40:val.length<=8?32:24;
          sl.addShape('rect',{x:cx+0.08,y:cy,w:colW-0.16,h:cardH,fill:{color:A.LGRAY}});
          sl.addShape('rect',{x:cx+0.08,y:cy,w:colW-0.16,h:0.08,fill:{color:cardColors[i%4]}});
          // Big number centred in top ~45% of card
          sl.addText(val,{x:cx+0.12,y:cy+0.25,w:colW-0.24,h:cardH*0.44,fontSize:numFontSize,fontFace:'Calibri',color:A.NAVY,bold:true,align:'center',valign:'middle',shrinkText:true});
          // Trend arrow + description (compact, above divider)
          if(d.trend){
            const tChar=d.trend==='up'?'▲':d.trend==='down'?'▼':'—';
            const tColor=d.trend==='up'?A.TBLUE:d.trend==='down'?A.RED:A.SGRAY;
            const trendText=d.trend_description ? tChar+' '+d.trend_description : tChar;
            sl.addText(trendText,{x:cx+0.12,y:cy+cardH*0.44,w:colW-0.24,h:0.28,fontSize:9,fontFace:'Calibri',color:tColor,bold:true,align:'center',valign:'middle',italic:!!d.trend_description,shrinkText:true});
          }
          // Label below divider line
          sl.addShape('rect',{x:cx+0.25,y:cy+cardH*0.52,w:colW-0.5,h:0.04,fill:{color:A.MGRAY}});
          sl.addText(d.label,{x:cx+0.15,y:cy+cardH*0.56,w:colW-0.3,h:cardH*0.40,fontSize:12,fontFace:'Calibri',color:A.BODY,align:'center',valign:'top',lineSpacingMultiple:1.35,bold:false,shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: BAR CHART ==========
      } else if(vis==='bar_chart' && s.chart_data){
        const {cats,series:barSeries}=normalizeChartData(s.chart_data);
        const normBar=barSeries.slice(0,3);
        const chartH=5.0;const chartW=eLW*0.95;
        if(normBar.length&&cats.length&&cats.length>0){
          const singleSeries=normBar.length===1;
          sl.addChart(pptx.charts.BAR,normBar,{
            x:M,y:cy,w:chartW,h:chartH,
            barDir:'col',barGapWidthPct:60,
            catAxisLabelColor:A.BODY,valAxisLabelColor:A.BODY,
            catAxisLabelFontFace:'Calibri',valAxisLabelFontFace:'Calibri',
            catAxisLabelFontSize:9,valAxisLabelFontSize:9,
            catAxisOrientation:'minMax',
            dataLabelFontSize:8,dataLabelFontBold:true,dataLabelColor:A.NAVY,
            showDataLabel:true,dataLabelPosition:'outEnd',catAxisTruncate:false,
            catGridLine:{style:'none'},valGridLine:{color:A.MGRAY,style:'dash',size:0.5},
            valAxisHidden:false,valAxisMajorUnit:null,
            plotAreaBorderColor:A.WHITE,
            chartColors:singleSeries?[A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED]:[A.NAVY,A.RED,A.TBLUE],
            varyColors:singleSeries,
            showLegend:!singleSeries,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
            showTitle:false
          });
        } else { chartFallback(sl,s,cy,eLW); }
        if(s.chart_annotation){
          sl.addShape('rect',{x:M+0.3,y:6.15,w:2.8,h:0.4,fill:{color:'FFF8E1'},line:{color:'F9A825',width:0.75},rectRadius:0.04});
          sl.addText(s.chart_annotation,{x:M+0.4,y:6.15,w:2.6,h:0.4,fontSize:8,fontFace:'Calibri',color:A.DGRAY,bold:true,valign:'middle',shrinkText:true});
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: LINE CHART ==========
      } else if(vis==='line_chart' && s.chart_data){
        const {cats:lineCats,series:lineSeries}=normalizeChartData(s.chart_data);
        const normLine=lineSeries.slice(0,4);
        const chartH=4.8;const chartW=eLW*0.95;
        if(normLine.length&&lineCats.length){
          sl.addChart(pptx.charts.LINE,normLine,{
            x:M,y:cy,w:chartW,h:chartH,
            lineSize:2.5,lineDataSymbol:'circle',lineDataSymbolSize:6,
            catAxisLabelColor:A.BODY,valAxisLabelColor:A.BODY,
            catAxisLabelFontFace:'Calibri',valAxisLabelFontFace:'Calibri',
            catAxisLabelFontSize:9,valAxisLabelFontSize:9,
            catGridLine:{style:'none'},valGridLine:{color:A.MGRAY,style:'dash',size:0.5},
            plotAreaBorderColor:A.WHITE,
            chartColors:[A.NAVY,A.RED,A.TBLUE,'74777D'],
            showLegend:normLine.length>1,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
            showTitle:false,dataLabelFontSize:8,showDataLabel:false
          });
        } else { chartFallback(sl,s,cy,eLW); }
        if(s.chart_annotation){
          sl.addShape('rect',{x:M+0.3,y:6.15,w:2.8,h:0.4,fill:{color:'FFF8E1'},line:{color:'F9A825',width:0.75},rectRadius:0.04});
          sl.addText(s.chart_annotation,{x:M+0.4,y:6.15,w:2.6,h:0.4,fontSize:8,fontFace:'Calibri',color:A.DGRAY,bold:true,valign:'middle',shrinkText:true});
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: HORIZONTAL BAR ==========
      } else if(vis==='horizontal_bar' && s.chart_data){
        const {cats:hCats,series:hSeries}=normalizeChartData(s.chart_data);
        const normH=hSeries.slice(0,3);
        const chartH=Math.min(5.4,7.5-cy-0.8);const chartW=eLW*0.85;
        if(normH.length&&hCats.length){
          const singleH=normH.length===1;
          sl.addChart(pptx.charts.BAR,normH,{
            x:M,y:cy,w:chartW,h:chartH,
            barDir:'bar',barGapWidthPct:40,
            catAxisLabelColor:A.NAVY,valAxisLabelColor:A.BODY,
            catAxisLabelFontFace:'Calibri',valAxisLabelFontFace:'Calibri',
            catAxisLabelFontSize:11,valAxisLabelFontSize:9,
            dataLabelFontSize:9,dataLabelFontBold:true,dataLabelColor:A.WHITE,
            showDataLabel:true,dataLabelPosition:'inEnd',
            catGridLine:{style:'none'},valGridLine:{color:A.MGRAY,style:'dash',size:0.5},
            plotAreaBorderColor:A.WHITE,
            chartColors:singleH?[A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED]:[A.NAVY,A.RED,A.TBLUE],
            varyColors:singleH,
            showLegend:!singleH,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
            showTitle:false
          });
        } else { chartFallback(sl,s,cy,eLW); }
        if(s.chart_annotation){
          sl.addShape('rect',{x:M+0.3,y:6.15,w:2.8,h:0.4,fill:{color:'FFF8E1'},line:{color:'F9A825',width:0.75},rectRadius:0.04});
          sl.addText(s.chart_annotation,{x:M+0.4,y:6.15,w:2.6,h:0.4,fontSize:8,fontFace:'Calibri',color:A.DGRAY,bold:true,valign:'middle',shrinkText:true});
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: DONUT CHART ==========
      } else if(vis==='donut_chart' && s.data_points&&s.data_points.length){
        const dp=s.data_points.slice(0,6).filter(d=>d&&d.label);
        if(!dp.length){chartFallback(sl,s,cy,eLW);soWhatPanel(sl,s.so_what);return;}
        const vals=dp.map(d=>parseFloat(String(d.value).replace(/[^0-9.]/g,''))||1);
        const lbls=dp.map(d=>d.label||'');
        const donutColors=[A.NAVY,A.RED,A.TBLUE,'74777D','1A2B3C','C4C6CD'];
        const donutW=eLW*0.55;const donutH=3.8;const donutX=M+(eLW-donutW)/2;
        sl.addChart(pptx.charts.DOUGHNUT,[{name:'',labels:lbls,values:vals}],{
          x:donutX,y:cy,w:donutW,h:donutH,
          holeSize:55,
          showLabel:false,showValue:false,showPercent:true,dataLabelPosition:'outEnd',
          dataLabelFontSize:9,dataLabelFontBold:true,dataLabelColor:A.NAVY,
          chartColors:donutColors,
          showLegend:true,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
          legendColor:A.BODY,
          showTitle:false,plotAreaBorderColor:A.WHITE
        });
        // Center number in donut hole
        const centerVal=dp[0]?String(dp[0].value):'';
        const donutCenterY=cy+donutH/2-0.3;
        const donutCenterX=donutX+donutW/2-0.6;
        sl.addText(centerVal,{x:donutCenterX,y:donutCenterY,w:1.2,h:0.6,fontSize:24,fontFace:'Calibri',color:A.NAVY,bold:true,align:'center',valign:'middle'});
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: PROCESS FLOW ==========
      } else if(vis==='process' && s.columns&&s.columns.length>=2){
        const steps=s.columns.slice(0,5);const n=steps.length;
        const arrowW=0.3;const boxW=(eLW-(arrowW*(n-1)))/n;
        const boxH=Math.min(3.8,7.5-cy-1.2);const boxY=cy+0.5;
        // Gradient-style shading: each step slightly lighter (simulated with alternating fills)
        const stepColors=[A.NAVY,A.RED,A.TBLUE,A.NAVY,A.RED];
        const stepFills=['E8EEF4','F5E8EA','E8EEF6','E8EEF4','F5E8EA'];
        steps.forEach((step,i)=>{
          const bx=M+i*(boxW+arrowW);const sc=stepColors[i%3];
          const sf=stepFills[i%5];
          // Number badge (circle)
          sl.addShape('ellipse',{x:bx+boxW*0.38,y:boxY-0.3,w:0.28,h:0.28,fill:{color:sc},line:{color:A.WHITE,width:1}});
          sl.addText(String(i+1),{x:bx+boxW*0.38,y:boxY-0.3,w:0.28,h:0.28,fontSize:10,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
          // Box body with per-step fill
          sl.addShape('rect',{x:bx,y:boxY,w:boxW,h:boxH,fill:{color:sf},line:{color:sc,width:1}});
          sl.addShape('rect',{x:bx,y:boxY,w:boxW,h:0.1,fill:{color:sc}});
          // Step title
          sl.addText(step.title||'',{x:bx+0.1,y:boxY+0.18,w:boxW-0.2,h:0.7,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true,align:'center',valign:'middle',lineSpacingMultiple:1.15,shrinkText:true});
          // Items — single text block to prevent overlap
          const items=(step.items||[]).slice(0,5);
          const itemAreaTop=boxY+0.95;
          const itemAreaH=boxH-(itemAreaTop-boxY)-0.1;
          const itemTextParts=[];
          items.forEach((item,j)=>{
            if(j>0) itemTextParts.push({text:'\n',options:{fontSize:5}});
            itemTextParts.push({text:'▸ ',options:{fontSize:9,color:sc,bold:true}});
            itemTextParts.push({text:item,options:{fontSize:9,color:A.BODY}});
          });
          if(itemTextParts.length) sl.addText(itemTextParts,{x:bx+0.12,y:itemAreaTop,w:boxW-0.24,h:itemAreaH,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.25,shrinkText:true});
          // Chevron connector to next step (filled right-pointing triangle)
          if(i<n-1){
            const ax=bx+boxW+0.02;const ay=boxY+boxH/2;
            sl.addShape('triangle',{x:ax,y:ay-0.14,w:0.22,h:0.28,fill:{color:sc},line:{color:sc,width:0},rotate:90});
          }
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: COMPARISON COLUMNS ==========
      } else if(vis==='comparison' && s.columns&&s.columns.length){
        const cols=s.columns.slice(0,3);
        const effectiveLW=s.so_what?LW:CW;
        const colW=effectiveLW/cols.length;
        const colColors=[A.NAVY,A.RED,A.NAVY];
        const availCompH=7.5-cy-0.5;
        const headerH=0.52;
        const compH=availCompH-headerH;
        cols.forEach((col,i)=>{
          const cx=M+(i*colW);
          sl.addShape('rect',{x:cx+0.06,y:cy,w:colW-0.12,h:headerH,fill:{color:colColors[i%3]}});
          sl.addText(col.title||'',{x:cx+0.06,y:cy,w:colW-0.12,h:headerH,fontSize:12,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle',shrinkText:true});
          sl.addShape('rect',{x:cx+0.06,y:cy+headerH,w:colW-0.12,h:compH,fill:{color:A.LGRAY}});
          const items=col.items||[];
          const itemTextParts=[];
          items.forEach((item,j)=>{
            if(j>0) itemTextParts.push({text:'\n',options:{fontSize:5}});
            itemTextParts.push({text:'\u25B8 ',options:{fontSize:10,color:colColors[i%3],bold:true}});
            itemTextParts.push({text:item,options:{fontSize:10,color:A.BODY}});
          });
          if(itemTextParts.length) sl.addText(itemTextParts,{x:cx+0.18,y:cy+headerH+0.12,w:colW-0.32,h:compH-0.25,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.25,shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: TIMELINE ==========
      } else if(vis==='timeline' && s.columns&&s.columns.length){
        const phases=s.columns.slice(0,4);
        const phW=eLW/phases.length;
        // Available height: from cy to near bottom of slide
        const availH=7.5-cy-0.6;
        sl.addShape('rect',{x:M,y:cy+0.2,w:eLW,h:0.05,fill:{color:A.MGRAY}});
        // Card area starts after circle+title header (~1.05 from cy)
        const cardTop=cy+1.05;
        const cardH=availH-1.05; // fill remaining space
        phases.forEach((ph,i)=>{
          const px=M+(i*phW);
          // Step circle
          sl.addShape('ellipse',{x:px+phW/2-0.2,y:cy+0.02,w:0.4,h:0.4,fill:{color:i===0?A.RED:A.NAVY},line:{color:A.WHITE,width:2}});
          sl.addText(String(i+1),{x:px+phW/2-0.2,y:cy+0.02,w:0.4,h:0.4,fontSize:12,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
          // Phase title
          sl.addText(ph.title||'',{x:px+0.05,y:cy+0.55,w:phW-0.1,h:0.45,fontSize:12,fontFace:'Calibri',color:A.NAVY,bold:true,align:'center',valign:'top'});
          // Card background — fills available space
          sl.addShape('rect',{x:px+0.05,y:cardTop,w:phW-0.1,h:cardH,fill:{color:A.LGRAY}});
          sl.addShape('rect',{x:px+0.05,y:cardTop,w:phW-0.1,h:0.05,fill:{color:i===0?A.RED:A.NAVY}});
          // Items — single text block to prevent overlap
          const items=ph.items||[];
          const itemTextParts=[];
          items.forEach((item,j)=>{
            if(j>0) itemTextParts.push({text:'\n',options:{fontSize:5}});
            itemTextParts.push({text:'\u25B8 ',options:{fontSize:10,color:i===0?A.RED:A.NAVY,bold:true}});
            itemTextParts.push({text:item,options:{fontSize:10,color:A.BODY}});
          });
          if(itemTextParts.length) sl.addText(itemTextParts,{x:px+0.15,y:cardTop+0.15,w:phW-0.3,h:cardH-0.3,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.3,shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: PILLARS ==========
      } else if(vis==='pillars' && s.columns&&s.columns.length){
        const pils=s.columns.slice(0,4);
        const effectiveLW=s.so_what?LW:CW;
        const pW=effectiveLW/pils.length;
        const pilColors=[A.NAVY,A.RED,A.NAVY,A.RED];
        const pilAvailH=7.5-cy-0.5;
        const pilHeaderH=0.55;
        const pilBodyH=pilAvailH-pilHeaderH;
        pils.forEach((p,i)=>{
          const px=M+(i*pW);
          sl.addShape('rect',{x:px+0.06,y:cy,w:pW-0.12,h:pilAvailH,fill:{color:A.LGRAY}});
          sl.addShape('rect',{x:px+0.06,y:cy,w:pW-0.12,h:pilHeaderH,fill:{color:pilColors[i%4]}});
          sl.addText(p.title||'',{x:px+0.06,y:cy,w:pW-0.12,h:pilHeaderH,fontSize:12,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle',shrinkText:true});
          const items=p.items||[];
          const itemTextParts=[];
          items.forEach((item,j)=>{
            if(j>0) itemTextParts.push({text:'\n',options:{fontSize:5}});
            itemTextParts.push({text:'\u25B8 ',options:{fontSize:10,color:pilColors[i%4],bold:true}});
            itemTextParts.push({text:item,options:{fontSize:10,color:A.BODY}});
          });
          if(itemTextParts.length) sl.addText(itemTextParts,{x:px+0.15,y:cy+pilHeaderH+0.1,w:pW-0.3,h:pilBodyH-0.2,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.25,shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: MATRIX 2x2 ==========
      } else if(vis==='matrix' && s.columns&&s.columns.length>=4){
        const q=s.columns.slice(0,4);
        const matH=7.5-cy-0.55;const matW=eLW;
        const halfW=matW/2-0.06;const halfH=matH/2-0.06;
        const qColors=[A.TBLUE,A.RED,A.NAVY,A.NAVY];
        const qFills=['EBF2FA','FFF0F0',A.LGRAY,A.LGRAY];
        // Axis center lines
        const midX=M+matW/2;const midY=cy+matH/2;
        sl.addShape('rect',{x:M,y:midY-0.015,w:matW,h:0.03,fill:{color:A.MGRAY}});
        sl.addShape('rect',{x:midX-0.015,y:cy,w:0.03,h:matH,fill:{color:A.MGRAY}});
        // 4 quadrants: TL=0, TR=1, BL=2, BR=3
        const qPos=[{qx:M,qy:cy},{qx:midX+0.03,qy:cy},{qx:M,qy:midY+0.03},{qx:midX+0.03,qy:midY+0.03}];
        q.forEach((qd,i)=>{
          const {qx,qy}=qPos[i];
          sl.addShape('rect',{x:qx,y:qy,w:halfW,h:halfH,fill:{color:qFills[i]},line:{color:A.MGRAY,width:0.25}});
          sl.addShape('rect',{x:qx,y:qy,w:halfW,h:0.07,fill:{color:qColors[i]}});
          sl.addText(qd.title||'',{x:qx+0.12,y:qy+0.15,w:halfW-0.24,h:0.38,fontSize:10,fontFace:'Calibri',color:qColors[i],bold:true,lineSpacingMultiple:1.15,shrinkText:true});
          const qItems=(qd.items||[]).slice(0,4);
          const qItemParts=[];
          qItems.forEach((item,j)=>{
            if(j>0) qItemParts.push({text:'\n',options:{fontSize:4}});
            qItemParts.push({text:'▸ ',options:{fontSize:9,color:qColors[i],bold:true}});
            qItemParts.push({text:item,options:{fontSize:9,color:A.BODY}});
          });
          if(qItemParts.length) sl.addText(qItemParts,{x:qx+0.15,y:qy+0.55,w:halfW-0.3,h:halfH-0.7,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.15,shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: WATERFALL CHART ==========
      } else if(vis==='waterfall' && s.data_points&&s.data_points.length){
        const pts=s.data_points.slice(0,10);
        const n=pts.length;
        const chartH=Math.min(4.2,7.5-cy-1.2);
        const chartW=eLW;
        const chartBottom=cy+chartH;
        const barGap=0.12;
        const barW=Math.min(1.2,(chartW-barGap*(n+1))/n);
        const totalBarsW=n*barW+(n+1)*barGap;
        const chartOffsetX=M+(chartW-totalBarsW)/2; // center bars
        // Determine scale: find min/max of running total
        let running=0;const tops=[];const bots=[];
        pts.forEach(pt=>{
          const v=Number(pt.value)||0;
          if(pt.type==='total'){tops.push(v);bots.push(0);}
          else{bots.push(Math.min(running,running+v));tops.push(Math.max(running,running+v));if(pt.type!=='total')running+=v;}
        });
        const allVals=[...tops,...bots];
        const dataMin=Math.min(0,...allVals);const dataMax=Math.max(...allVals);
        const dataRange=dataMax-dataMin||1;
        const scale=(chartH-0.6)/dataRange; // leave 0.6 padding for labels
        // Baseline (zero line)
        const baselineY=chartBottom-(0-dataMin)*scale;
        sl.addShape('rect',{x:M,y:baselineY,w:chartW,h:0.02,fill:{color:A.NAVY}});
        // Draw bars
        let runVal=0;
        pts.forEach((pt,i)=>{
          const v=Number(pt.value)||0;
          const bColor=pt.type==='total'?A.TBLUE:v>=0?A.NAVY:A.RED;
          const barTop=pt.type==='total'?Math.max(v,0):Math.max(runVal,runVal+v);
          const barBot=pt.type==='total'?Math.min(v,0):Math.min(runVal,runVal+v);
          const rawH=(barTop-barBot)*scale;
          const barH=Math.max(rawH,0.18); // minimum visible bar height
          const bx=chartOffsetX+barGap+i*(barW+barGap);
          const by=chartBottom-(barTop-dataMin)*scale-(barH>rawH?(barH-rawH)/2:0);
          sl.addShape('rect',{x:bx,y:by,w:barW,h:barH,fill:{color:bColor}});
          // Value label: inside bar if tall enough, above/below if small
          const valStr=pt.type==='total'?String(v):(v>=0?'+':'')+v;
          if(barH>=0.4){
            sl.addText(valStr,{x:bx,y:by+0.05,w:barW,h:0.28,fontSize:11,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle',shrinkText:true});
          } else {
            const labelY=v>=0?by-0.25:by+barH+0.03;
            sl.addText(valStr,{x:bx-0.1,y:labelY,w:barW+0.2,h:0.22,fontSize:9,fontFace:'Calibri',color:bColor,bold:true,align:'center',valign:'middle',shrinkText:true});
          }
          // Category label below chart
          sl.addText(pt.label||'',{x:bx-0.1,y:chartBottom+0.08,w:barW+0.2,h:0.45,fontSize:8,fontFace:'Calibri',color:A.BODY,align:'center',valign:'top',lineSpacingMultiple:1.1,shrinkText:true});
          // Connector line between consecutive bars
          if(i>0 && pt.type!=='total'){
            const connY=chartBottom-(runVal-dataMin)*scale;
            const prevBx=chartOffsetX+barGap+(i-1)*(barW+barGap);
            sl.addShape('rect',{x:prevBx+barW,y:connY-0.008,w:bx-(prevBx+barW),h:0.016,fill:{color:A.SGRAY}});
          }
          if(pt.type!=='total') runVal+=v;
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: TRAFFIC LIGHT STATUS TABLE ==========
      } else if(vis==='traffic_light' && s.rows&&s.rows.length){
        const rows=s.rows.slice(0,10);
        const tableW=eLW;
        const availH=7.5-cy-0.6;
        const rowH=Math.min(0.62,availH/rows.length);
        const statusColors={green:'2E7D32',yellow:'F9A825',red:A.RED};
        // Table header bar
        sl.addShape('rect',{x:M,y:cy,w:tableW,h:0.32,fill:{color:A.NAVY}});
        sl.addText('STATUS',{x:M+0.08,y:cy,w:0.8,h:0.32,fontSize:7,fontFace:'Calibri',color:A.WHITE,bold:true,valign:'middle',charSpacing:1});
        sl.addText('INDICADOR',{x:M+0.9,y:cy,w:tableW*0.35,h:0.32,fontSize:7,fontFace:'Calibri',color:A.WHITE,bold:true,valign:'middle',charSpacing:2});
        sl.addText('DETALLE',{x:M+0.9+tableW*0.35,y:cy,w:tableW*0.55,h:0.32,fontSize:7,fontFace:'Calibri',color:A.WHITE,bold:true,valign:'middle',charSpacing:2});
        cy+=0.32;
        rows.forEach((row,i)=>{
          const ry=cy+(i*rowH);
          const rowFill=i%2===0?A.WHITE:'F7F8FA';
          const sc=statusColors[row.status]||A.SGRAY;
          sl.addShape('rect',{x:M,y:ry,w:tableW,h:rowH,fill:{color:rowFill}});
          // Bottom separator
          if(i<rows.length-1) sl.addShape('rect',{x:M,y:ry+rowH-0.01,w:tableW,h:0.01,fill:{color:'DDDFE2'}});
          // Status circle
          sl.addShape('ellipse',{x:M+0.25,y:ry+(rowH-0.22)/2,w:0.22,h:0.22,fill:{color:sc}});
          // Label (bold)
          sl.addText(row.label||'',{x:M+0.9,y:ry,w:tableW*0.35,h:rowH,fontSize:10,fontFace:'Calibri',color:A.NAVY,bold:true,valign:'middle',shrinkText:true});
          // Detail text
          sl.addText(row.detail||'',{x:M+0.9+tableW*0.35,y:ry,w:tableW*0.55,h:rowH,fontSize:9,fontFace:'Calibri',color:A.BODY,valign:'middle',lineSpacingMultiple:1.2,shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: STACKED BAR CHART ==========
      } else if(vis==='stacked_bar' && s.chart_data){
        const {cats:sCats,series:sSeries}=normalizeChartData(s.chart_data);
        const normStack=sSeries.slice(0,5);
        const chartH=Math.min(5.0,7.5-cy-0.9);const chartW=eLW*0.95;
        const stackColors=[A.NAVY,A.RED,A.TBLUE,'74777D','1A2B3C'];
        if(normStack.length&&sCats.length){
          sl.addChart(pptx.charts.BAR,normStack,{
            x:M,y:cy,w:chartW,h:chartH,
            barDir:'col',barGrouping:'stacked',barGapWidthPct:50,
            catAxisLabelColor:A.BODY,valAxisLabelColor:A.BODY,
            catAxisLabelFontFace:'Calibri',valAxisLabelFontFace:'Calibri',
            catAxisLabelFontSize:9,valAxisLabelFontSize:9,
            dataLabelFontSize:8,dataLabelFontBold:true,dataLabelColor:A.WHITE,
            showDataLabel:true,dataLabelPosition:'ctr',
            catGridLine:{style:'none'},valGridLine:{color:A.MGRAY,style:'dash',size:0.5},
            plotAreaBorderColor:A.WHITE,
            chartColors:stackColors,
            showLegend:true,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
            showTitle:false
          });
        } else { chartFallback(sl,s,cy,eLW); }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: ICON GRID ==========
      } else if(vis==='icon_grid' && s.items&&s.items.length){
        const items=s.items.slice(0,9);
        const cols=items.length<=4?2:3;
        const rows=Math.ceil(items.length/cols);
        const gridW=eLW;const gridH=Math.min(7.5-cy-0.5,rows*1.8);
        const cellW=gridW/cols;const cellH=gridH/rows;
        const circleColors=[A.NAVY,A.RED,A.TBLUE,A.NAVY,A.RED,A.TBLUE,A.NAVY,A.RED,A.TBLUE];
        items.forEach((item,i)=>{
          const col=i%cols;const row=Math.floor(i/cols);
          const cx=M+col*cellW;const cy2=cy+row*cellH;
          const cellPad=0.1;
          // Card background
          sl.addShape('roundRect',{x:cx+cellPad,y:cy2+cellPad,w:cellW-cellPad*2,h:cellH-cellPad*2,fill:{color:A.LGRAY},line:{color:'DDDFE2',width:0.5},rectRadius:0.08});
          // Numbered circle
          const circR=0.26;const circX=cx+cellPad+0.18;const circY=cy2+cellPad+0.18;
          sl.addShape('ellipse',{x:circX,y:circY,w:circR*2,h:circR*2,fill:{color:circleColors[i%3]}});
          sl.addText(String(i+1),{x:circX,y:circY,w:circR*2,h:circR*2,fontSize:11,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
          // Title bold — next to circle
          const titleX=cx+cellPad+circR*2+0.28;
          sl.addText(item.title||'',{x:titleX,y:cy2+cellPad+0.15,w:cellW-cellPad*2-circR*2-0.34,h:0.42,fontSize:10,fontFace:'Calibri',color:A.NAVY,bold:true,valign:'middle',shrinkText:true});
          // Description — more gap below title/circle
          sl.addText(item.description||'',{x:cx+cellPad+0.14,y:cy2+cellPad+0.72,w:cellW-cellPad*2-0.2,h:cellH-cellPad*2-0.82,fontSize:9,fontFace:'Calibri',color:A.BODY,lineSpacingMultiple:1.25,valign:'top',shrinkText:true});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: FUNNEL ==========
      } else if(vis==='funnel' && s.data_points&&s.data_points.length){
        const pts=s.data_points.slice(0,7);
        const n=pts.length;
        const funnelH=Math.min(5.2,7.5-cy-0.8);
        const barH=(funnelH-(n-1)*0.12)/n;
        const maxBarW=eLW*0.82;
        const levelColors=[A.NAVY,A.TBLUE,'4A7FB5','5E90C4','7AA8D0','94BEE0',A.MGRAY];
        pts.forEach((pt,i)=>{
          // Each bar gets progressively narrower
          const fraction=1-(i*(0.65/(n-1||1)));
          const barW=maxBarW*fraction;
          const bx=M+(maxBarW-barW)/2;
          const by=cy+(i*(barH+0.12));
          sl.addShape('rect',{x:bx,y:by,w:barW,h:barH,fill:{color:levelColors[i%7]}});
          // Value label on bar (left side, white text)
          sl.addText(String(pt.value||''),{x:bx+0.12,y:by,w:Math.min(1.2,barW*0.3),h:barH,fontSize:11,fontFace:'Calibri',color:A.WHITE,bold:true,valign:'middle',shrinkText:true});
          // Category label centered on bar
          sl.addText(pt.label||'',{x:bx+barW*0.25,y:by,w:barW*0.5,h:barH,fontSize:10,fontFace:'Calibri',color:A.WHITE,align:'center',valign:'middle',shrinkText:true});
          // Percentage on right side of bar
          if(i>0&&pts[0].value){
            const pct=Math.round((Number(pt.value)||0)/(Number(pts[0].value)||1)*100);
            if(!isNaN(pct))sl.addText(pct+'%',{x:bx+barW*0.7,y:by,w:barW*0.25,h:barH,fontSize:9,fontFace:'Calibri',color:A.WHITE,bold:false,align:'right',valign:'middle',shrinkText:true});
          }
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: SPLIT ==========
      } else if(vis==='split'){
        // Two-column split: left text (60%) + right navy highlight (40%)
        const splitGap=0.25;
        const splitLW=s.so_what?LW:CW;
        const leftColW=splitLW*0.58;
        const rightColW=splitLW-leftColW-splitGap;
        const rightColX=M+leftColW+splitGap;
        const contentTop=cy;
        const contentH=7.5-contentTop-0.6;
        // Left column background — starts below subheading to avoid covering it
        sl.addShape('rect',{x:0,y:contentTop,w:M+leftColW+splitGap*0.5,h:7.5-contentTop,fill:{color:'F8F9FB'}});
        // Body text + bullets — single text block to prevent overlap
        const leftParts=[];
        if(s.body_text){
          leftParts.push({text:s.body_text,options:{fontSize:12,color:A.BODY}});
        }
        if(s.bullets&&s.bullets.length){
          if(leftParts.length) leftParts.push({text:'\n\n',options:{fontSize:6}});
          s.bullets.forEach((b,j)=>{
            if(j>0) leftParts.push({text:'\n',options:{fontSize:4}});
            leftParts.push({text:'\u25B8 ',options:{fontSize:11,color:accentColor,bold:true}});
            leftParts.push({text:b,options:{fontSize:11,color:A.BODY}});
          });
        }
        if(leftParts.length) sl.addText(leftParts,{x:M,y:contentTop,w:leftColW,h:contentH,fontFace:'Calibri',lineSpacingMultiple:1.5,valign:'top',shrinkText:true});
        // Right column — navy highlight block (only if distinct from so_what)
        const hText=s.highlight_box||'';
        if(hText && hText!==s.so_what){
          sl.addShape('rect',{x:rightColX,y:contentTop,w:rightColW,h:contentH,fill:{color:'EBF2FA'},line:{color:'C8DFF2',width:0.5}});
          sl.addShape('rect',{x:rightColX,y:contentTop,w:0.06,h:contentH,fill:{color:A.RED}});
          sl.addText(hText,{x:rightColX+0.25,y:contentTop+0.5,w:rightColW-0.45,h:contentH-1.0,
            fontSize:16,fontFace:'Calibri',color:A.NAVY,italic:false,
            lineSpacingMultiple:1.6,valign:'middle',bold:false,shrinkText:true});
        } else {
          // No distinct highlight — use the space for a key takeaway card
          sl.addShape('rect',{x:rightColX,y:contentTop,w:rightColW,h:contentH,fill:{color:A.LGRAY}});
          sl.addShape('rect',{x:rightColX,y:contentTop,w:0.05,h:contentH,fill:{color:A.NAVY}});
          sl.addText(tp('keyConclusion'),{x:rightColX+0.2,y:contentTop+0.3,w:rightColW-0.4,h:0.3,fontSize:8,fontFace:'Calibri',color:A.RED,bold:true,letterSpacing:2});
          sl.addShape('rect',{x:rightColX+0.2,y:contentTop+0.65,w:rightColW*0.4,h:0.03,fill:{color:A.RED}});
          if(s.so_what){
            sl.addText(s.so_what,{x:rightColX+0.2,y:contentTop+0.85,w:rightColW-0.4,h:contentH-1.3,
              fontSize:13,fontFace:'Calibri',color:A.NAVY,bold:true,
              lineSpacingMultiple:1.6,valign:'top'});
          }
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: DEFAULT ==========
      } else {
        if(s.type==='executive_summary'){
          const msgs=s.key_messages||[];
          if(msgs.length>=2){
            const msgCount=Math.min(msgs.length,4);
            const msgW=eLW/msgCount;
            const msgH=7.5-cy-0.8;
            msgs.slice(0,msgCount).forEach((msg,i)=>{
              const mx=M+(i*msgW);
              sl.addShape('ellipse',{x:mx+msgW/2-0.22,y:cy,w:0.44,h:0.44,fill:{color:i===0?A.RED:A.NAVY}});
              sl.addText(String(i+1),{x:mx+msgW/2-0.22,y:cy,w:0.44,h:0.44,fontSize:14,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
              const msgText=typeof msg==='string'?msg:(msg.message||msg.title||'');
              sl.addText(msgText,{x:mx+0.1,y:cy+0.6,w:msgW-0.2,h:msgH-0.7,fontSize:12,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.4,valign:'top',shrinkText:true});
              sl.addShape('rect',{x:mx+0.05,y:cy+0.55,w:0.04,h:msgH-0.6,fill:{color:i===0?A.RED:A.NAVY}});
            });
            cy+=4.5;
          } else if(s.body_text){
            const exH=Math.min(4.5,Math.max(1.5,s.body_text.length/100+1.0));
            sl.addShape('rect',{x:M,y:cy,w:eLW,h:exH,fill:{color:A.LGRAY}});
            sl.addShape('rect',{x:M,y:cy,w:0.06,h:exH,fill:{color:A.NAVY}});
            sl.addText(s.body_text,{x:M+0.25,y:cy+0.15,w:eLW-0.4,h:exH-0.25,fontSize:12,fontFace:'Calibri',color:A.DGRAY,italic:true,lineSpacingMultiple:1.5,valign:'top',shrinkText:true});
            cy+=exH+0.2;
          }
        } else if(s.body_text && s.bullets && s.bullets.length){
          // Merge body + bullets into single block to prevent overlap
          const parts=[{text:s.body_text,options:{fontSize:12,color:A.BODY}}];
          parts.push({text:'\n\n',options:{fontSize:5}});
          s.bullets.forEach((b,j)=>{
            if(j>0) parts.push({text:'\n',options:{fontSize:4}});
            parts.push({text:'\u25B8 ',options:{fontSize:12,color:accentColor,bold:true}});
            parts.push({text:b,options:{fontSize:11,color:A.BODY}});
          });
          const availH=7.5-cy-0.6-(s.data_points&&s.data_points.length?1.7:0);
          sl.addText(parts,{x:M,y:cy,w:eLW,h:availH,fontFace:'Calibri',lineSpacingMultiple:1.5,valign:'top',shrinkText:true});
          cy+=availH+0.15;
        } else if(s.body_text){
          const hasMoreContent=!!(s.data_points&&s.data_points.length)||(s.bullets&&s.bullets.length);
          if(!hasMoreContent){
            // McKinsey assertion-evidence layout: top 40% large assertion, bottom 60% evidence area
            const totalH=7.5-cy-0.5;
            const assertionH=totalH*0.38;
            const evidenceH=totalH*0.56;
            const evidenceY=cy+assertionH+0.08;
            // Assertion area — large bold navy text
            sl.addText(s.body_text,{x:M,y:cy,w:eLW,h:assertionH,fontSize:22,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.3,valign:'middle',shrinkText:true});
            // Evidence area — light gray background
            sl.addShape('rect',{x:M,y:evidenceY,w:eLW,h:evidenceH,fill:{color:A.LGRAY}});
            sl.addShape('rect',{x:M,y:evidenceY,w:0.06,h:evidenceH,fill:{color:A.RED}});
            sl.addText('EVIDENCIA DE APOYO',{x:M+0.22,y:evidenceY+0.12,w:eLW-0.35,h:0.25,fontSize:7,fontFace:'Calibri',color:A.RED,bold:true,charSpacing:3});
            sl.addShape('rect',{x:M+0.22,y:evidenceY+0.38,w:eLW*0.4,h:0.025,fill:{color:A.MGRAY}});
            // space for presenter to add evidence notes — leave visible but empty styled area
            cy+=assertionH+evidenceH+0.12;
          } else {
            const availH=7.5-cy-0.6-(s.data_points&&s.data_points.length?1.7:0)-(s.bullets&&s.bullets.length?s.bullets.length*0.5+0.2:0);
            sl.addText(s.body_text,{x:M,y:cy,w:eLW,h:Math.min(availH,2.5),fontSize:13,fontFace:'Calibri',color:A.BODY,lineSpacingMultiple:1.6,valign:'top',shrinkText:true});
            cy+=Math.min(availH,2.5)+0.15;
          }
        }
        if(!(s.body_text && s.bullets && s.bullets.length) && s.bullets&&s.bullets.length){
          // Bullets only (no body_text) — single block
          const bulletParts=[];
          s.bullets.forEach((b,j)=>{
            if(j>0) bulletParts.push({text:'\n',options:{fontSize:4}});
            bulletParts.push({text:'\u25B8 ',options:{fontSize:12,color:accentColor,bold:true}});
            bulletParts.push({text:b,options:{fontSize:11,color:A.BODY}});
          });
          const bAvail=7.5-cy-0.6-(s.data_points&&s.data_points.length?1.7:0);
          sl.addText(bulletParts,{x:M+0.15,y:cy,w:eLW-0.2,h:bAvail,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.3,shrinkText:true});
          cy+=bAvail+0.1;
        }
        if(s.data_points&&s.data_points.length){
          const dp=s.data_points.slice(0,4);
          const dpW=eLW/dp.length;
          dp.forEach((d,i)=>{
            const dx=M+(i*dpW);
            sl.addShape('rect',{x:dx+0.05,y:cy,w:dpW-0.1,h:1.4,fill:{color:A.LGRAY}});
            sl.addShape('rect',{x:dx+0.05,y:cy,w:dpW-0.1,h:0.05,fill:{color:i%2===0?A.NAVY:A.RED}});
            sl.addText(String(d.value),{x:dx+0.05,y:cy+0.15,w:dpW-0.1,h:0.6,fontSize:28,fontFace:'Calibri',color:A.NAVY,bold:true,align:'center',valign:'middle',shrinkText:true});
            sl.addText(d.label,{x:dx+0.1,y:cy+0.8,w:dpW-0.2,h:0.5,fontSize:8,fontFace:'Calibri',color:A.SGRAY,align:'center',valign:'top',shrinkText:true});
          });
          cy+=1.6;
        }
        soWhatPanel(sl,s.so_what);
      }
      srcNote(sl,s.source_note);
      addNote(sl,s.so_what);
      }catch(slideErr){
        console.warn('Slide '+(sIdx+1)+' error:',slideErr);
        slideErrors.push({idx:sIdx+1,title:s.action_title||'(sin título)',err:slideErr.message});
      }
    });
    if(slideErrors.length){
      const msg=slideErrors.map(e=>'· Slide '+e.idx+' "'+e.title+'": '+e.err).join('\n');
      showError('Advertencia — '+slideErrors.length+' slide(s) con error (el resto se generó correctamente):\n'+msg);
    }

    // =================== APPENDIX: INFORMATION GAPS ===================
    if(result.information_gaps&&result.information_gaps.length){
      const sl=pptx.addSlide({masterName:'ALTO_MASTER'});
      sl.background={color:'F0F0F0'};
      addLogo(sl);
      // BACKUP badge top-right
      sl.addShape('rect',{x:W-2.2,y:0.15,w:1.8,h:0.35,fill:{color:A.MGRAY}});
      sl.addText('BACKUP',{x:W-2.2,y:0.15,w:1.8,h:0.35,fontSize:8,fontFace:'Calibri',color:A.SGRAY,bold:true,align:'center',valign:'middle',charSpacing:3});
      // Navy left accent bar
      sl.addShape('rect',{x:0,y:0,w:0.08,h:7.5,fill:{color:A.NAVY}});
      // Header
      sl.addText('Anexo: Áreas Pendientes de Validación',{x:M,y:0.25,w:8,h:0.6,fontSize:20,fontFace:'Calibri',color:A.NAVY,bold:true});
      sl.addShape('rect',{x:M,y:0.88,w:1.0,h:0.04,fill:{color:A.RED}});
      sl.addText('Los siguientes puntos requieren información adicional para completar el análisis.',{x:M,y:1.05,w:CW*0.7,h:0.35,fontSize:10,fontFace:'Calibri',color:A.SGRAY,italic:true});
      // Gap items — single text block to prevent overlap
      const gaps=result.information_gaps;
      const gapParts=[];
      gaps.forEach((gap,i)=>{
        if(i>0) gapParts.push({text:'\n',options:{fontSize:5}});
        gapParts.push({text:(i+1)+'.  ',options:{fontSize:11,color:A.RED,bold:true}});
        gapParts.push({text:gap,options:{fontSize:11,color:A.BODY}});
      });
      sl.addShape('rect',{x:M,y:1.55,w:CW*0.68,h:7.5-1.55-0.8,fill:{color:A.LGRAY}});
      sl.addShape('rect',{x:M,y:1.55,w:0.05,h:7.5-1.55-0.8,fill:{color:A.RED}});
      sl.addText(gapParts,{x:M+0.2,y:1.65,w:CW*0.63,h:7.5-1.65-0.9,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.45,shrinkText:true});
      // Status label bottom
      sl.addShape('rect',{x:M,y:6.7,w:CW*0.7,h:0.01,fill:{color:A.MGRAY}});
      sl.addText('BACKUP · PARA DISCUSIÓN',{x:M,y:6.8,w:4,h:0.25,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:true,letterSpacing:3});
    }

    updatePptxProgress(99, 'Generando archivo .pptx...');
    await pptx.writeFile({fileName:'Informe_ALTO_'+new Date().toISOString().slice(0,10)+'.pptx'});
    stopPptxProgress(true);
    flash('\u2713 Presentación McKinsey/ALTO descargada');
  }catch(err){
    console.error(err);
    stopPptxProgress(false);
    showError('Error PPTX: '+err.message);
  }finally{
    document.getElementById('btnPptx').disabled=false;
  }
}

