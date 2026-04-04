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
  const wUrl=document.getElementById('workerUrl').value.trim();
  if(!wUrl){showError('Configura el Worker URL para generar PPTX.');return;}
  const btn=document.getElementById('btnPptx');
  btn.disabled=true;
  startPptxProgress('Diseñando estructura de slides...');
  hideError();
  try{
    const res=await fetch(wUrl,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
          userContent:'__PPTX_MODE__',
          reportJSON:JSON.stringify(result),
          pptxInstructions:`VISUAL LAYOUTS DISPONIBLES — elige el más adecuado para cada slide:
- "stat_callouts": KPIs y cifras clave. USA data_points:[{value,label,trend?}] donde trend es "up"/"down"/"neutral". Mínimo 3, máximo 4 puntos.
- "bar_chart": evolución temporal o comparativo cuantitativo vertical. USA chart_data:{categories:["Ene","Feb",...],series:[{name:"Métrica",values:[10,20,...]}]}. Para una sola métrica usa SIEMPRE 1 serie con todos los valores — NUNCA una serie por categoría.
- "line_chart": tendencias y series temporales con múltiples líneas. USA chart_data:{categories,series}. Múltiples series OK aquí.
- "horizontal_bar": rankings de entidades (tiendas, regiones, productos). USA chart_data con 1 sola serie: {categories:["Entidad A","Entidad B",...],series:[{name:"Valor",values:[85,72,...]}]}. NUNCA uses una serie por entidad. Ordena categorías de mayor a menor valor.
- "donut_chart": composición o distribución porcentual. USA data_points:[{value:"35%",label:"Nombre"}]. Máximo 6 segmentos.
- "comparison": comparar 2-3 opciones/escenarios. USA columns:[{title,items}].
- "pillars": 3-4 pilares estratégicos paralelos. USA columns:[{title,items}].
- "process": flujo de pasos secuenciales (3-5 pasos). USA columns:[{title,items}] — cada columna es un paso.
- "timeline": roadmap o fases temporales. USA columns:[{title,items}] — cada columna es una fase.
- "matrix": clasificar 4 conceptos en cuadrantes 2x2. USA columns:[{title,items}] — TL, TR, BL, BR. Incluye etiquetas de ejes en subheading.
- "split": texto izquierda + bloque destacado derecha. USA body_text + highlight_box.
- "none": slide estándar con body_text + bullets.

REGLAS OBLIGATORIAS:
- Slide 2 SIEMPRE type:"toc" con items:[{title,description}] y campo "tagline".
- USA type:"divider" (sin visual_suggestion) para separar secciones principales — slide navy oscuro con solo el título de la sección. Incluye el número de sección en subheading ("Sección 1", "Sección 2", etc).
- INCLUYE AL MENOS: 1x stat_callouts, 1x line_chart o bar_chart, 1x process o timeline, 1x comparison o pillars.
- NO repitas el mismo visual_suggestion más de 2 slides seguidos.
- Slides riesgos → type:"risks", visual:"comparison" con acento rojo.
- Slides oportunidades → type:"opportunities", visual:"pillars" o "matrix".
- Si hay KPIs o métricas → stat_callouts con trend arrows.
- Si hay evolución temporal → line_chart (múltiples series) o bar_chart (una serie).
- Si hay rankings o comparativos entre entidades → horizontal_bar.
- Si hay distribución porcentual → donut_chart.
- Si hay proceso o metodología → process.
- Sin emojis ni símbolos decorativos en ningún campo de texto.
- Mínimo 10 slides, máximo 16 (sin contar cover y closing).`
        })});
    const raw=await res.text();
    if(raw.trim().startsWith('<'))throw new Error('Worker devolvió HTML. Status: '+res.status);
    let data;try{data=JSON.parse(raw);}catch(e){throw new Error('Respuesta no es JSON');}
    if(data.error)throw new Error(data.error.message||data.error);
    const txt=data.content.filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean=txt.replace(/```json|```/g,'').trim();
    let slideData;try{slideData=JSON.parse(clean);}catch(e){throw new Error('IA no devolvió JSON de slides válido');}

    updatePptxProgress(98, 'Renderizando presentación ALTO...');
    const pptx=new PptxGenJS();pptx.layout='LAYOUT_WIDE';pptx.author='ALTO';pptx.title=result.title;
    const A=ALTO;
    const W=13.33,M=0.5,CW=W-2*M;

    // --- SLIDE MASTER ---
    pptx.defineSlideMaster({title:'ALTO_MASTER',background:{color:A.WHITE},objects:[
      {text:{text:'CONFIDENCIAL · ALTO',options:{x:M,y:7.25,w:5,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:false}}},
    ],slideNumber:{x:12.0,y:7.25,w:1.0,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,align:'right'}});

    // --- HELPER FUNCTIONS ---
    function addLogo(sl){if(logoBase64)sl.addImage({data:'image/png;base64,'+logoBase64,x:12.1,y:0.1,w:1.0,h:0.39});}
    function actionTitle(sl,t,accent){
      const titleW=W-SW-M-0.25;
      sl.addShape('rect',{x:0,y:0,w:W,h:1.0,fill:{color:A.WHITE}});
      const titleText=t||result.title||'';
      if(titleText){
        sl.addText(titleText,{x:M,y:0.1,w:titleW,h:0.75,fontSize:20,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.05,valign:'middle',shrinkText:true});
        sl.addShape('rect',{x:M,y:0.88,w:1.2,h:0.04,fill:{color:accent||A.RED}});
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
    function srcNote(sl,t){if(t)sl.addText('Fuente: '+t,{x:M,y:6.9,w:8,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,italic:true});}

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
        // Main title — large extrabold
        sl.addText(s.action_title||result.title,{x:0.55,y:1.45,w:leftW-0.8,h:3.2,fontSize:32,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.1,valign:'top'});
        // Subtitle italic
        if(s.subheading)sl.addText(s.subheading,{x:0.55,y:4.85,w:leftW-1.0,h:0.5,fontSize:12,fontFace:'Calibri',color:A.SGRAY,italic:true});
        // Presented by / date row
        sl.addShape('rect',{x:0.55,y:5.55,w:0.03,h:0.7,fill:{color:A.MGRAY}});
        sl.addText('Preparado por',{x:0.72,y:5.55,w:2,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:false,letterSpacing:2});
        sl.addText('ALTO Strategy',{x:0.72,y:5.75,w:2.5,h:0.3,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true});
        sl.addShape('rect',{x:3.1,y:5.55,w:0.03,h:0.7,fill:{color:A.MGRAY}});
        sl.addText('Fecha',{x:3.28,y:5.55,w:1.5,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,bold:false,letterSpacing:2});
        sl.addText(new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long'}),{x:3.28,y:5.75,w:3,h:0.3,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true});
        // CONFIDENCIAL small
        sl.addText('CONFIDENCIAL',{x:0.55,y:6.55,w:3,h:0.25,fontSize:8,fontFace:'Calibri',color:A.RED,bold:true,letterSpacing:3});
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
        sl.addText(s.action_title||'Gracias',{x:0.55,y:1.6,w:cRX-0.8,h:2.2,fontSize:40,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.1,valign:'top',shrinkText:true});
        if(s.subheading)sl.addText(s.subheading,{x:0.55,y:4.0,w:cRX-1.0,h:0.5,fontSize:12,fontFace:'Calibri',color:A.SGRAY,italic:true});
        sl.addShape('rect',{x:0.55,y:5.0,w:2.2,h:0.05,fill:{color:A.RED}});
        sl.addShape('rect',{x:0.55,y:5.15,w:1.2,h:0.04,fill:{color:'B0B6B8'}});
        sl.addText('Preparado por',{x:0.72,y:5.45,w:2,h:0.2,fontSize:7,fontFace:'Calibri',color:A.SGRAY,charSpacing:2});
        sl.addText('ALTO Strategy',{x:0.72,y:5.65,w:2.5,h:0.3,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true});
        sl.addText(new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long'}),{x:0.72,y:6.0,w:3,h:0.3,fontSize:10,fontFace:'Calibri',color:A.SGRAY});
        sl.addText('CONFIDENCIAL',{x:0.55,y:6.55,w:3,h:0.25,fontSize:8,fontFace:'Calibri',color:A.RED,bold:true,charSpacing:3});
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
            sl.addText(item.description,{x:M+0.45,y:iy+titleH,w:listW-1.2,h:rowH*0.4,fontSize:8,fontFace:'Calibri',color:A.SGRAY,italic:false,valign:'top'});
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
            lineSpacingMultiple:1.7,valign:'middle',bold:false});
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
        sl.addText(s.action_title||'',{x:0.55,y:2.55,w:dRX-0.8,h:2.6,fontSize:34,fontFace:'Calibri',color:A.NAVY,bold:true,lineSpacingMultiple:1.1,valign:'top',shrinkText:true});
        // Red accent lines — same position as cover
        sl.addShape('rect',{x:0.55,y:5.3,w:2.2,h:0.05,fill:{color:A.RED}});
        sl.addShape('rect',{x:0.55,y:5.45,w:1.2,h:0.04,fill:{color:'B0B6B8'}});
        if(s.body_text)sl.addText(s.body_text,{x:0.55,y:5.65,w:dRX-0.8,h:0.5,fontSize:11,fontFace:'Calibri',color:A.SGRAY,italic:true});
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
      if(s.subheading){sl.addText(s.subheading,{x:M,y:cy,w:eLW,h:0.35,fontSize:11,fontFace:'Calibri',color:A.SGRAY,italic:true,valign:'middle'});cy+=0.42;}

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
          // Trend arrow (if present)
          if(d.trend){const tChar=d.trend==='up'?'▲':d.trend==='down'?'▼':'—';const tColor=d.trend==='up'?A.TBLUE:d.trend==='down'?A.RED:A.SGRAY;sl.addText(tChar,{x:cx+0.12,y:cy+cardH*0.46,w:colW-0.24,h:0.32,fontSize:13,fontFace:'Calibri',color:tColor,bold:true,align:'center',valign:'middle'});}
          // Label below divider line
          sl.addShape('rect',{x:cx+0.25,y:cy+cardH*0.52,w:colW-0.5,h:0.03,fill:{color:A.MGRAY}});
          sl.addText(d.label,{x:cx+0.15,y:cy+cardH*0.56,w:colW-0.3,h:cardH*0.40,fontSize:13,fontFace:'Calibri',color:A.BODY,align:'center',valign:'top',lineSpacingMultiple:1.4,bold:false});
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: BAR CHART ==========
      } else if(vis==='bar_chart' && s.chart_data){
        const {cats,series:barSeries}=normalizeChartData(s.chart_data);
        const normBar=barSeries.slice(0,3);
        const chartH=5.0;const chartW=LW*0.95;
        if(normBar.length&&cats.length){
          const singleSeries=normBar.length===1;
          sl.addChart(pptx.charts.BAR,normBar,{
            x:M,y:cy,w:chartW,h:chartH,
            barDir:'col',barGapWidthPct:80,
            catAxisLabelColor:A.BODY,valAxisLabelColor:A.BODY,
            catAxisLabelFontFace:'Calibri',valAxisLabelFontFace:'Calibri',
            catAxisLabelFontSize:9,valAxisLabelFontSize:9,
            catAxisOrientation:'minMax',
            dataLabelFontSize:8,dataLabelFontBold:true,dataLabelColor:A.NAVY,
            showDataLabel:true,dataLabelPosition:'outEnd',
            catGridLine:{style:'none'},valGridLine:{color:A.MGRAY,style:'dash',size:0.5},
            valAxisHidden:false,valAxisMajorUnit:null,
            plotAreaBorderColor:A.WHITE,
            chartColors:singleSeries?[A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED]:[A.NAVY,A.RED,A.TBLUE],
            varyColors:singleSeries,
            showLegend:!singleSeries,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
            showTitle:false
          });
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: LINE CHART ==========
      } else if(vis==='line_chart' && s.chart_data){
        const {cats:lineCats,series:lineSeries}=normalizeChartData(s.chart_data);
        const normLine=lineSeries.slice(0,4);
        const chartH=4.8;const chartW=LW*0.95;
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
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: HORIZONTAL BAR ==========
      } else if(vis==='horizontal_bar' && s.chart_data){
        const {cats:hCats,series:hSeries}=normalizeChartData(s.chart_data);
        const normH=hSeries.slice(0,3);
        const chartH=Math.min(5.4,7.5-cy-0.8);const chartW=LW*0.95;
        if(normH.length&&hCats.length){
          const singleH=normH.length===1;
          sl.addChart(pptx.charts.BAR,normH,{
            x:M,y:cy,w:chartW,h:chartH,
            barDir:'bar',barGapWidthPct:55,
            catAxisLabelColor:A.NAVY,valAxisLabelColor:A.BODY,
            catAxisLabelFontFace:'Calibri',valAxisLabelFontFace:'Calibri',
            catAxisLabelFontSize:10,valAxisLabelFontSize:9,
            dataLabelFontSize:9,dataLabelFontBold:true,dataLabelColor:A.WHITE,
            showDataLabel:true,dataLabelPosition:'inEnd',
            catGridLine:{style:'none'},valGridLine:{color:A.MGRAY,style:'dash',size:0.5},
            plotAreaBorderColor:A.WHITE,
            chartColors:singleH?[A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED,A.NAVY,A.RED]:[A.NAVY,A.RED,A.TBLUE],
            varyColors:singleH,
            showLegend:!singleH,legendPos:'b',legendFontSize:8,legendFontFace:'Calibri',
            showTitle:false
          });
        }
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: DONUT CHART ==========
      } else if(vis==='donut_chart' && s.data_points&&s.data_points.length){
        const dp=s.data_points.slice(0,6).filter(d=>d&&d.label);
        if(!dp.length){soWhatPanel(sl,s.so_what);return;}
        const vals=dp.map(d=>parseFloat(String(d.value).replace(/[^0-9.]/g,''))||1);
        const lbls=dp.map(d=>d.label||'');
        const donutColors=[A.NAVY,A.RED,A.TBLUE,'74777D','1A2B3C','C4C6CD'];
        sl.addChart(pptx.charts.DOUGHNUT,[{name:'',labels:lbls,values:vals}],{
          x:M,y:cy,w:eLW*0.58,h:4.6,
          holeSize:55,
          showLabel:false,showValue:false,showPercent:true,
          dataLabelFontSize:10,dataLabelFontBold:true,dataLabelColor:A.WHITE,
          chartColors:donutColors,
          showLegend:true,legendPos:'r',legendFontSize:9,legendFontFace:'Calibri',
          legendColor:A.BODY,
          showTitle:false,plotAreaBorderColor:A.WHITE
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: PROCESS FLOW ==========
      } else if(vis==='process' && s.columns&&s.columns.length>=2){
        const steps=s.columns.slice(0,5);const n=steps.length;
        const arrowW=0.3;const boxW=(eLW-(arrowW*(n-1)))/n;
        const boxH=Math.min(3.8,7.5-cy-1.2);const boxY=cy+0.5;
        const stepColors=[A.NAVY,A.RED,A.TBLUE,A.NAVY,A.RED];
        steps.forEach((step,i)=>{
          const bx=M+i*(boxW+arrowW);const sc=stepColors[i%3];
          // Number badge
          sl.addShape('roundRect',{x:bx+boxW*0.35,y:boxY-0.26,w:boxW*0.3,h:0.28,fill:{color:sc},rectRadius:0.06});
          sl.addText(String(i+1),{x:bx+boxW*0.35,y:boxY-0.26,w:boxW*0.3,h:0.28,fontSize:10,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
          // Box body
          sl.addShape('rect',{x:bx,y:boxY,w:boxW,h:boxH,fill:{color:A.LGRAY},line:{color:sc,width:1}});
          sl.addShape('rect',{x:bx,y:boxY,w:boxW,h:0.1,fill:{color:sc}});
          // Step title
          sl.addText(step.title||'',{x:bx+0.1,y:boxY+0.18,w:boxW-0.2,h:0.7,fontSize:11,fontFace:'Calibri',color:A.NAVY,bold:true,align:'center',valign:'middle',lineSpacingMultiple:1.15,shrinkText:true});
          // Items
          let iy=boxY+1.0;
          (step.items||[]).slice(0,5).forEach(item=>{
            sl.addText([{text:'▸ ',options:{fontSize:9,color:sc,bold:true}},{text:item,options:{fontSize:9,color:A.BODY}}],{x:bx+0.12,y:iy,w:boxW-0.24,h:0.38,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.2});
            iy+=0.4;
          });
          // Arrow to next step
          if(i<n-1){
            const ax=bx+boxW+0.02;const ay=boxY+boxH/2;
            sl.addText('→',{x:ax,y:ay-0.18,w:arrowW,h:0.36,fontSize:18,fontFace:'Calibri',color:A.MGRAY,align:'center',valign:'middle',bold:true});
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
          // Distribute items evenly across the full column height
          const innerH=compH-0.25;
          const itemH=Math.max(0.38,innerH/Math.max(items.length,1));
          const startIy=cy+headerH+0.12;
          items.forEach((item,j)=>{
            const iy=startIy+j*itemH;
            sl.addText([{text:'\u25B8 ',options:{fontSize:11,color:colColors[i%3],bold:true}},{text:item,options:{fontSize:11,color:A.BODY}}],{x:cx+0.18,y:iy,w:colW-0.32,h:itemH-0.04,fontFace:'Calibri',valign:'middle',lineSpacingMultiple:1.25,shrinkText:true});
          });
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
          // Items — spread evenly within the card
          const items=ph.items||[];
          const itemH=Math.min(0.6, (cardH-0.3)/Math.max(items.length,1));
          let iy=cardTop+0.18;
          items.forEach(item=>{
            sl.addText('\u25B8 '+item,{x:px+0.15,y:iy,w:phW-0.3,h:itemH,fontSize:11,fontFace:'Calibri',color:A.BODY,valign:'top',lineSpacingMultiple:1.3});
            iy+=itemH+0.05;
          });
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
          const innerH=pilBodyH-0.2;
          const itemH=Math.max(0.38,innerH/Math.max(items.length,1));
          items.forEach((item,j)=>{
            const iy=cy+pilHeaderH+0.1+j*itemH;
            sl.addText('\u25B8 '+item,{x:px+0.15,y:iy,w:pW-0.3,h:itemH-0.04,fontSize:11,fontFace:'Calibri',color:A.BODY,valign:'middle',lineSpacingMultiple:1.2,shrinkText:true});
          });
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
          let iy=qy+0.6;
          (qd.items||[]).slice(0,4).forEach(item=>{
            sl.addText([{text:'▸ ',options:{fontSize:9,color:qColors[i],bold:true}},{text:item,options:{fontSize:9,color:A.BODY}}],{x:qx+0.15,y:iy,w:halfW-0.3,h:0.34,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.15});
            iy+=0.36;
          });
        });
        soWhatPanel(sl,s.so_what);

      // ========== LAYOUT: SPLIT ==========
      } else if(vis==='split'){
        // Two-column split: left text (60%) + right navy highlight (40%)
        const splitGap=0.25;
        const leftColW=LW*0.58;
        const rightColW=LW-leftColW-splitGap;
        const rightColX=M+leftColW+splitGap;
        const contentTop=cy;
        const contentH=7.5-contentTop-0.6;
        // Left column background — starts below subheading to avoid covering it
        sl.addShape('rect',{x:0,y:contentTop,w:M+leftColW+splitGap*0.5,h:7.5-contentTop,fill:{color:'F8F9FB'}});
        // Body text
        let bcy=contentTop;
        if(s.body_text){
          const textH=Math.min(contentH*0.45, Math.max(1.4,s.body_text.length/90*0.35));
          sl.addText(s.body_text,{x:M,y:bcy,w:leftColW,h:textH,fontSize:13,fontFace:'Calibri',color:A.BODY,lineSpacingMultiple:1.6,valign:'top'});
          bcy+=textH+0.15;
        }
        if(s.bullets&&s.bullets.length){
          s.bullets.forEach(b=>{
            sl.addText([{text:'\u25B8 ',options:{fontSize:12,color:accentColor,bold:true}},{text:b,options:{fontSize:12,color:A.BODY}}],{x:M+0.1,y:bcy,w:leftColW-0.2,h:0.4,fontFace:'Calibri',valign:'top',lineSpacingMultiple:1.3});
            bcy+=0.48;
          });
        }
        // Right column — navy highlight block (only if distinct from so_what)
        const hText=s.highlight_box||'';
        if(hText && hText!==s.so_what){
          sl.addShape('rect',{x:rightColX,y:contentTop,w:rightColW,h:contentH,fill:{color:'EBF2FA'},line:{color:'C8DFF2',width:0.5}});
          sl.addShape('rect',{x:rightColX,y:contentTop,w:0.06,h:contentH,fill:{color:A.RED}});
          sl.addText(hText,{x:rightColX+0.25,y:contentTop+0.5,w:rightColW-0.45,h:contentH-1.0,
            fontSize:14,fontFace:'Calibri',color:A.NAVY,italic:true,
            lineSpacingMultiple:1.6,valign:'middle',bold:false,shrinkText:true});
        } else {
          // No distinct highlight — use the space for a key takeaway card
          sl.addShape('rect',{x:rightColX,y:contentTop,w:rightColW,h:contentH,fill:{color:A.LGRAY}});
          sl.addShape('rect',{x:rightColX,y:contentTop,w:0.05,h:contentH,fill:{color:A.NAVY}});
          sl.addText('CONCLUSIÓN CLAVE',{x:rightColX+0.2,y:contentTop+0.3,w:rightColW-0.4,h:0.3,fontSize:8,fontFace:'Calibri',color:A.RED,bold:true,letterSpacing:2});
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
        if(s.type==='executive_summary' && s.body_text){
          const exH=Math.min(4.0,Math.max(1.5,s.body_text.length/130+1.0));
          sl.addShape('rect',{x:M,y:cy,w:eLW,h:exH,fill:{color:A.LGRAY}});
          sl.addShape('rect',{x:M,y:cy,w:0.06,h:exH,fill:{color:A.NAVY}});
          sl.addText(s.body_text,{x:M+0.25,y:cy+0.15,w:eLW-0.4,h:exH-0.25,fontSize:12,fontFace:'Calibri',color:A.DGRAY,italic:true,lineSpacingMultiple:1.5,valign:'top',shrinkText:true});
          cy+=exH+0.2;
        } else if(s.body_text){
          sl.addText(s.body_text,{x:M,y:cy,w:eLW,h:2.2,fontSize:13,fontFace:'Calibri',color:A.BODY,lineSpacingMultiple:1.6,valign:'top',shrinkText:true});
          cy+=2.35;
        }
        if(s.bullets&&s.bullets.length){
          s.bullets.forEach(b=>{
            sl.addText([{text:'\u25B8 ',options:{fontSize:13,fontFace:'Calibri',color:accentColor,bold:true}},{text:b,options:{fontSize:12,fontFace:'Calibri',color:A.BODY}}],{x:M+0.15,y:cy,w:eLW-0.2,h:0.44,valign:'top',lineSpacingMultiple:1.3,shrinkText:true});
            cy+=0.5;
          });
          cy+=0.1;
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
      sl.background={color:'F8F9FB'};
      addLogo(sl);
      // Navy left accent bar
      sl.addShape('rect',{x:0,y:0,w:0.08,h:7.5,fill:{color:A.NAVY}});
      // Header
      sl.addText('Anexo: Áreas Pendientes de Validación',{x:M,y:0.25,w:8,h:0.6,fontSize:20,fontFace:'Calibri',color:A.NAVY,bold:true});
      sl.addShape('rect',{x:M,y:0.88,w:1.0,h:0.04,fill:{color:A.RED}});
      sl.addText('Los siguientes puntos requieren información adicional para completar el análisis.',{x:M,y:1.05,w:CW*0.7,h:0.35,fontSize:10,fontFace:'Calibri',color:A.SGRAY,italic:true});
      // Gap items
      const gaps=result.information_gaps;
      const gapH=Math.min(0.7,(7.5-1.7-0.5)/gaps.length);
      let gy=1.55;
      gaps.forEach((gap,i)=>{
        // Number circle
        sl.addShape('ellipse',{x:M,y:gy+0.08,w:0.28,h:0.28,fill:{color:A.RED}});
        sl.addText(String(i+1),{x:M,y:gy+0.08,w:0.28,h:0.28,fontSize:9,fontFace:'Calibri',color:A.WHITE,bold:true,align:'center',valign:'middle'});
        // Card background
        sl.addShape('rect',{x:M+0.4,y:gy,w:CW*0.65,h:gapH-0.08,fill:{color:A.LGRAY}});
        sl.addShape('rect',{x:M+0.4,y:gy,w:0.04,h:gapH-0.08,fill:{color:A.RED}});
        // Gap text
        sl.addText(gap,{x:M+0.6,y:gy+0.04,w:CW*0.6,h:gapH-0.16,fontSize:11,fontFace:'Calibri',color:A.BODY,valign:'middle',lineSpacingMultiple:1.3});
        gy+=gapH;
      });
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

