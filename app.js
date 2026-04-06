// ============================================================
// Worker URL — hardcoded, no user input needed
// ============================================================
const WORKER_URL = 'https://strategic-report-proxy.hcuevas.workers.dev';
// APP_TOKEN removed — authentication handled via session tokens only

// ============================================================
// i18n — Multi-language labels
// ============================================================
const i18n = {
  es: {
    analysisLabel: 'Análisis Estratégico',
    execSummary: 'Resumen Ejecutivo',
    keyMessages: 'Mensajes Clave',
    context: 'Contexto y Objetivo',
    findings: 'Hallazgos Clave',
    analysis: 'Análisis',
    risks: 'Riesgos',
    opportunities: 'Oportunidades',
    recommendations: 'Recomendaciones',
    infoGaps: 'Brechas de Información',
    conclusion: 'Conclusión Ejecutiva',
    evidence: 'Evidencia',
    implication: 'Implicancia',
    impact: 'Impacto',
    soWhat: 'So what?',
    shortTerm: 'Corto Plazo',
    mediumTerm: 'Mediano Plazo',
    longTerm: 'Largo Plazo',
    regenerate: 'Regenerar',
    confidential: 'Informe Ejecutivo Confidencial',
    reportReady: 'Informe generado — edita y exporta',
    reportLoaded: 'Informe cargado',
    generating: 'Procesando...',
    generateBtn: 'Generar Informe Ejecutivo',
    thinkingStep: 'Analizando en profundidad...',
    writingStep: 'Redactando informe...',
    progressTitle: 'Redactando título...',
    progressSummary: 'Redactando resumen ejecutivo...',
    progressKeys: 'Estructurando mensajes clave...',
    progressContext: 'Construyendo contexto...',
    progressFindings: 'Identificando hallazgos clave...',
    progressAnalysis: 'Construyendo bloques de análisis...',
    progressRisks: 'Evaluando riesgos...',
    progressOpps: 'Identificando oportunidades...',
    progressRecs: 'Redactando recomendaciones...',
    progressConclusion: 'Redactando conclusión ejecutiva...',
    progressKpis: 'Calculando KPIs...',
    imagesDetected: 'imágenes detectadas',
    restored: 'Restaurado',
    // UI labels
    uiOffline: 'Sin conexión',
    uiConsulting: 'Consultoría Estratégica',
    uiReports: 'Informes Ejecutivos',
    uiReportType: 'Tipo de Informe',
    uiReportLang: 'Idioma del Informe',
    uiUploadFile: 'Subir archivo',
    uiPlaceholder: 'Pega texto, o arrastra un archivo .txt / .pdf / .docx aquí...',
    uiGenerate: 'Generar Informe Ejecutivo',
    uiExportPdf: 'Exportar PDF',
    uiGenPptx: 'Generar PPTX',
    uiExportWord: 'Exportar Word',
    uiBrief: 'Brief 1 página',
    uiDesigningSlides: 'Diseñando slides...',
    uiRetry: 'Reintentar',
    uiChatPlaceholder: 'Ej: Profundiza el hallazgo 3, agrega análisis financiero, reformula para el CFO...',
    uiMece: 'Mutuamente excluyente, colectivamente exhaustivo. Sin solapamientos ni vacíos.',
    uiPyramid: 'Conclusión primero, argumentos después. Estructura de arriba hacia abajo.',
    uiFacts: 'Basado en Hechos',
    uiFactsDesc: 'Hechos observados, inferencias razonables e hipótesis diferenciados explícitamente.',
    uiStrategic: 'Estratégico',
    uiFinancial: 'Financiero',
    uiOperational: 'Operacional',
    uiRisks: 'Riesgos',
    uiCompetitive: 'Competitivo',
    uiDueDiligence: 'Due Diligence',
    uiGeneral: 'General',
    tipStrategic: 'Análisis estratégico con hallazgos, riesgos, oportunidades y recomendaciones por horizonte',
    tipFinancial: 'Enfoque en impacto financiero, ROI, métricas de rentabilidad y proyecciones',
    tipOperational: 'Diagnóstico de procesos, eficiencia operacional, cuellos de botella y mejoras',
    tipRisk: 'Matriz de riesgos, probabilidad e impacto, mitigación y planes de contingencia',
    tipCompetitive: 'Benchmarking competitivo, posicionamiento, ventajas y brechas vs competencia',
    tipDueDiligence: 'Due diligence: evaluación de viabilidad, red flags, fortalezas y riesgos',
    tipGeneral: 'Análisis general sin enfoque específico',
    uiSourceDoc: 'Documento Fuente',
    uiExample: 'Ejemplo',
    uiEditBanner: 'Haz click en cualquier texto para editarlo antes de exportar',
    uiRestore: 'Restaurar',
    uiChatHeader: 'Consultar sobre el informe',
    uiPyramidTitle: 'Principio Piramidal',
    uiLangAuto: 'Auto (detectar)',
    // Status & error messages
    uiReading: 'Leyendo',
    uiFileLoaded: 'Archivo cargado',
    uiCompleted: 'Completado',
    uiConnected: 'Conectado',
    uiError: 'Error',
    uiReportReadyEdit: 'Informe listo — edita y exporta',
    uiRegenerating: 'Regenerando',
    uiRegenerated: 'regenerado',
    uiRegenError: 'Error regenerando',
    uiNoJsonUpdate: 'El Worker no devolvió JSON actualizado',
    uiHistoryError: 'Error al cargar historial',
    uiLoadingReport: 'Cargando informe desde enlace…',
    uiReportLoadedLink: 'Informe cargado',
    uiStartingDownload: 'iniciando descarga',
    uiErrorLoadingReport: 'Error cargando informe',
    uiServerError: 'Error del servidor',
    uiUnsupportedFormat: 'Formato no soportado',
    uiPdfLibError: 'Librería PDF no cargada, recarga la página',
    uiDocxLibError: 'Librería DOCX no cargada, recarga la página',
    uiNoTitle: 'Sin título',
    uiGeneratingPdf: 'Generando PDF...',
    uiPdfDownloaded: 'PDF descargado',
    uiMdCopied: 'Markdown copiado',
    uiReportUpdated: 'Informe actualizado.',
    uiReportUpdatedDetail: 'El informe ha sido actualizado. Los cambios se reflejan en la vista previa y en las exportaciones.',
    uiChars: 'caracteres',
    uiTooLong: 'muy largo, puede afectar calidad',
    uiFieldsIncomplete: 'Campos incompletos',
    uiMayBeIncomplete: 'El informe puede estar incompleto — puedes continuar o reintentar.',
    uiNoValidJson: 'La IA no devolvió JSON válido. Intenta de nuevo o reduce el largo del documento.',
    // Regen section labels
    regenFindings: 'hallazgos',
    regenAnalysis: 'bloque de análisis',
    regenRecs: 'recomendaciones',
    regenRisks: 'riesgos',
    regenOpps: 'oportunidades',
    // Validate labels
    valTitle: 'título',
    valSummary: 'resumen ejecutivo',
    valMessages: 'mensajes clave',
    valFindings: 'hallazgos',
    valAnalysis: 'bloques de análisis',
    valRecs: 'recomendaciones',
    // PPTX progress
    pptxStep1: 'Analizando estructura del informe...',
    pptxStep2: 'Diseñando narrativa de slides...',
    pptxStep3: 'Aplicando principios McKinsey...',
    pptxStep4: 'Definiendo layouts y visualizaciones...',
    pptxStep5: 'Optimizando flujo argumental...',
    pptxStep6: 'Construyendo action titles...',
    pptxStep7: 'Incorporando datos clave...',
    pptxStep8: 'Finalizando estructura de slides...',
    pptxStep9: 'Validando coherencia narrativa...',
    pptxStep10: 'Preparando para renderizado...',
    pptxCompleted: 'Completado',
    // Brief & DOCX export
    uiGeneratingBrief: 'Generando Executive Brief...',
    uiBriefDownloaded: 'Executive Brief descargado',
    uiGeneratingDocx: 'Generando documento Word ALTO...',
    uiDocxDownloaded: 'Documento ALTO descargado',
    // Brief labels
    briefExecSummary: 'Resumen Ejecutivo',
    briefKeyMessages: 'Mensajes Clave',
    briefFindings: 'Hallazgos Principales',
    briefRecs: 'Recomendaciones Estratégicas',
    briefConclusion: 'Conclusión',
    briefShortTerm: 'Corto Plazo',
    briefMediumTerm: 'Mediano Plazo',
    briefLongTerm: 'Largo Plazo',
    briefFindingsCount: 'Hallazgos identificados',
    briefRisksCount: 'Riesgos detectados',
    briefOppsCount: 'Oportunidades',
    briefConfidential: 'Confidencial',
    // DOCX section labels
    docxExecSummary: 'Resumen Ejecutivo',
    docxKeyMessages: 'Mensajes Clave',
    docxContext: 'Contexto y Objetivo',
    docxFindings: 'Hallazgos Clave',
    docxRisks: 'Riesgos',
    docxOpps: 'Oportunidades',
    docxRecs: 'Recomendaciones',
    docxShortTerm: 'CORTO PLAZO',
    docxMediumTerm: 'MEDIANO PLAZO',
    docxLongTerm: 'LARGO PLAZO',
    docxInfoGaps: 'Información Faltante',
    docxConclusion: 'Conclusión Ejecutiva',
    docxConfidential: 'CONFIDENCIAL',
    docxPage: 'Página',
    docxEvidence: 'Evidencia',
    docxImplication: 'Implicancia',
    docxImpact: 'Impacto',
    // Dashboard
    dashPrompt: 'Ingresa tu Stats Token (primeros 20 caracteres de tu ANTHROPIC_API_KEY o tu STATS_TOKEN):',
    dashLoading: 'Cargando datos...',
    dashTokenError: 'Token inválido. Inténtalo de nuevo.',
    dashFetchError: 'Error obteniendo datos.',
  },
  en: {
    analysisLabel: 'Strategic Analysis',
    execSummary: 'Executive Summary',
    keyMessages: 'Key Messages',
    context: 'Context & Objective',
    findings: 'Key Findings',
    analysis: 'Analysis',
    risks: 'Risks',
    opportunities: 'Opportunities',
    recommendations: 'Recommendations',
    infoGaps: 'Information Gaps',
    conclusion: 'Executive Conclusion',
    evidence: 'Evidence',
    implication: 'Implication',
    impact: 'Impact',
    soWhat: 'So what?',
    shortTerm: 'Short Term',
    mediumTerm: 'Medium Term',
    longTerm: 'Long Term',
    regenerate: 'Regenerate',
    confidential: 'Confidential Executive Report',
    reportReady: 'Report generated — edit and export',
    reportLoaded: 'Report loaded',
    generating: 'Processing...',
    generateBtn: 'Generate Executive Report',
    thinkingStep: 'Deep analysis in progress...',
    writingStep: 'Writing report...',
    progressTitle: 'Writing title...',
    progressSummary: 'Writing executive summary...',
    progressKeys: 'Structuring key messages...',
    progressContext: 'Building context...',
    progressFindings: 'Identifying key findings...',
    progressAnalysis: 'Building analysis blocks...',
    progressRisks: 'Evaluating risks...',
    progressOpps: 'Identifying opportunities...',
    progressRecs: 'Writing recommendations...',
    progressConclusion: 'Writing executive conclusion...',
    progressKpis: 'Calculating KPIs...',
    imagesDetected: 'images detected',
    restored: 'Restored',
    // UI labels
    uiOffline: 'Offline',
    uiConsulting: 'Strategic Consulting',
    uiReports: 'Executive Reports',
    uiReportType: 'Report Type',
    uiReportLang: 'Report Language',
    uiUploadFile: 'Upload file',
    uiPlaceholder: 'Paste text, or drag a .txt / .pdf / .docx file here...',
    uiGenerate: 'Generate Executive Report',
    uiExportPdf: 'Export PDF',
    uiGenPptx: 'Generate PPTX',
    uiExportWord: 'Export Word',
    uiBrief: '1-page Brief',
    uiDesigningSlides: 'Designing slides...',
    uiRetry: 'Retry',
    uiChatPlaceholder: 'E.g.: Deepen finding 3, add financial analysis, reformat for CFO...',
    uiMece: 'Mutually exclusive, collectively exhaustive. No overlaps or gaps.',
    uiPyramid: 'Conclusion first, arguments after. Top-down structure.',
    uiFacts: 'Fact-Based',
    uiFactsDesc: 'Observed facts, reasonable inferences, and hypotheses explicitly differentiated.',
    uiStrategic: 'Strategic',
    uiFinancial: 'Financial',
    uiOperational: 'Operational',
    uiRisks: 'Risks',
    uiCompetitive: 'Competitive',
    uiDueDiligence: 'Due Diligence',
    uiGeneral: 'General',
    tipStrategic: 'Strategic analysis with findings, risks, opportunities and recommendations by horizon',
    tipFinancial: 'Focus on financial impact, ROI, profitability metrics and projections',
    tipOperational: 'Process diagnosis, operational efficiency, bottlenecks and improvements',
    tipRisk: 'Risk matrix, probability and impact, mitigation and contingency plans',
    tipCompetitive: 'Competitive benchmarking, positioning, advantages and gaps vs competition',
    tipDueDiligence: 'Due diligence: feasibility assessment, red flags, strengths and risks',
    tipGeneral: 'General analysis without specific focus',
    uiSourceDoc: 'Source Document',
    uiExample: 'Example',
    uiEditBanner: 'Click any text to edit before exporting',
    uiRestore: 'Reset',
    uiChatHeader: 'Ask about the report',
    uiPyramidTitle: 'Pyramid Principle',
    uiLangAuto: 'Auto (detect)',
    // Status & error messages
    uiReading: 'Reading',
    uiFileLoaded: 'File loaded',
    uiCompleted: 'Completed',
    uiConnected: 'Connected',
    uiError: 'Error',
    uiReportReadyEdit: 'Report ready — edit and export',
    uiRegenerating: 'Regenerating',
    uiRegenerated: 'regenerated',
    uiRegenError: 'Error regenerating',
    uiNoJsonUpdate: 'Worker did not return updated JSON',
    uiHistoryError: 'Error loading history',
    uiLoadingReport: 'Loading report from link…',
    uiReportLoadedLink: 'Report loaded',
    uiStartingDownload: 'starting download',
    uiErrorLoadingReport: 'Error loading report',
    uiServerError: 'Server error',
    uiUnsupportedFormat: 'Unsupported format',
    uiPdfLibError: 'PDF library not loaded, reload the page',
    uiDocxLibError: 'DOCX library not loaded, reload the page',
    uiNoTitle: 'Untitled',
    uiGeneratingPdf: 'Generating PDF...',
    uiPdfDownloaded: 'PDF downloaded',
    uiMdCopied: 'Markdown copied',
    uiReportUpdated: 'Report updated.',
    uiReportUpdatedDetail: 'The report has been updated. Changes are reflected in the preview and exports.',
    uiChars: 'characters',
    uiTooLong: 'too long, may affect quality',
    uiFieldsIncomplete: 'Incomplete fields',
    uiMayBeIncomplete: 'The report may be incomplete — you can continue or retry.',
    uiNoValidJson: 'AI did not return valid JSON. Try again or reduce document length.',
    // Regen section labels
    regenFindings: 'findings',
    regenAnalysis: 'analysis block',
    regenRecs: 'recommendations',
    regenRisks: 'risks',
    regenOpps: 'opportunities',
    // Validate labels
    valTitle: 'title',
    valSummary: 'executive summary',
    valMessages: 'key messages',
    valFindings: 'findings',
    valAnalysis: 'analysis blocks',
    valRecs: 'recommendations',
    // PPTX progress
    pptxStep1: 'Analyzing report structure...',
    pptxStep2: 'Designing slide narrative...',
    pptxStep3: 'Applying McKinsey principles...',
    pptxStep4: 'Defining layouts and visuals...',
    pptxStep5: 'Optimizing argument flow...',
    pptxStep6: 'Building action titles...',
    pptxStep7: 'Incorporating key data...',
    pptxStep8: 'Finalizing slide structure...',
    pptxStep9: 'Validating narrative coherence...',
    pptxStep10: 'Preparing for rendering...',
    pptxCompleted: 'Completed',
    // Brief & DOCX export
    uiGeneratingBrief: 'Generating Executive Brief...',
    uiBriefDownloaded: 'Executive Brief downloaded',
    uiGeneratingDocx: 'Generating ALTO Word document...',
    uiDocxDownloaded: 'ALTO document downloaded',
    // Brief labels
    briefExecSummary: 'Executive Summary',
    briefKeyMessages: 'Key Messages',
    briefFindings: 'Key Findings',
    briefRecs: 'Strategic Recommendations',
    briefConclusion: 'Conclusion',
    briefShortTerm: 'Short Term',
    briefMediumTerm: 'Medium Term',
    briefLongTerm: 'Long Term',
    briefFindingsCount: 'Findings identified',
    briefRisksCount: 'Risks detected',
    briefOppsCount: 'Opportunities',
    briefConfidential: 'Confidential',
    // DOCX section labels
    docxExecSummary: 'Executive Summary',
    docxKeyMessages: 'Key Messages',
    docxContext: 'Context & Objective',
    docxFindings: 'Key Findings',
    docxRisks: 'Risks',
    docxOpps: 'Opportunities',
    docxRecs: 'Recommendations',
    docxShortTerm: 'SHORT TERM',
    docxMediumTerm: 'MEDIUM TERM',
    docxLongTerm: 'LONG TERM',
    docxInfoGaps: 'Information Gaps',
    docxConclusion: 'Executive Conclusion',
    docxConfidential: 'CONFIDENTIAL',
    docxPage: 'Page',
    docxEvidence: 'Evidence',
    docxImplication: 'Implication',
    docxImpact: 'Impact',
    // Dashboard
    dashPrompt: 'Enter your Stats Token (first 20 characters of your ANTHROPIC_API_KEY or your STATS_TOKEN):',
    dashLoading: 'Loading data...',
    dashTokenError: 'Invalid token. Please try again.',
    dashFetchError: 'Error fetching data.',
  },
};

// Current language — defaults to Spanish, updated when report is generated
let currentLang = 'es';
function t(key) { return (i18n[currentLang] || i18n.es)[key] || (i18n.es)[key] || key; }

// ============================================================
// ALTO CORPORATE COLORS
// ============================================================
const ALTO = {
  // Stitch design system — The Executive Architect
  RED:   'BB0014',  // secondary — accent rojo quirúrgico
  BLUE:  '041627',  // primary   — navy institucional
  GRAY:  'B0B6B8',
  NAVY:  '041627',  // primary
  DNAVY: '041627',  // dark navy (portada)
  WHITE: 'FFFFFF',
  LGRAY: 'F2F4F6',  // surface-container-low
  MGRAY: 'E0E3E5',  // surface-container-highest
  BODY:  '44474C',  // on-surface-variant
  SGRAY: '74777D',  // outline
  DGRAY: '191C1E',  // on-surface
  TBLUE: '4279B0',  // tertiary blue (3rd accent)
};

// Logos ALTO embebidos (extraídos del template corporativo oficial)
const logoBase64 = "iVBORw0KGgoAAAANSUhEUgAAB84AAAMSCAYAAAALMO6OAAAACXBIWXMAAC4jAAAuIwF4pT92AAAgAElEQVR4nOzdPXIbaZYu4DMT41PXgkneFYi9AmGIwCBggbMCoVZQHIN2oewxhr2CglbQgoUAEZgiV9DkCoY0YV1xBXUNpEYqtX74A+Bk5vc8EYySqiTq7RYBAvnmOd8//fHHHwEAAAAAAAAApfrn7AAAAAAAAAAAkElxDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAAAAAAAEDRFOcAAAAAAAAAFE1xDgAA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";
const logoWhiteBase64 = "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";

// ============================================================
// STATE
// ============================================================
let result = null, originalResult = null, progressTimer = null;

// ============================================================
// PROGRESS
// ============================================================
const STEPS=[
  {pct:5,msg:'Recibiendo documento fuente...'},{pct:12,msg:'Identificando tesis central...'},
  {pct:20,msg:'Depurando ruido y redundancias...'},{pct:30,msg:'Reconstruyendo lógica argumental...'},
  {pct:40,msg:'Clasificando hechos vs inferencias...'},{pct:50,msg:'Estructurando hallazgos clave...'},
  {pct:60,msg:'Evaluando riesgos y tensiones...'},{pct:70,msg:'Identificando palancas estratégicas...'},
  {pct:80,msg:'Priorizando recomendaciones...'},{pct:88,msg:'Redactando resumen ejecutivo...'},
  {pct:94,msg:'Aplicando estándar consultoría...'},{pct:97,msg:'Validando estructura MECE...'},
];
function startProgress(){const s=document.getElementById('progressSection'),f=document.getElementById('progressFill'),st=document.getElementById('progressStep'),p=document.getElementById('progressPct');s.classList.remove('hidden');let i=0;f.style.width='0%';progressTimer=setInterval(()=>{if(i<STEPS.length){f.style.width=STEPS[i].pct+'%';st.textContent=STEPS[i].msg;p.textContent=STEPS[i].pct+'%';i++;}},2200);}
function stopProgress(ok){clearInterval(progressTimer);const f=document.getElementById('progressFill'),st=document.getElementById('progressStep'),p=document.getElementById('progressPct');if(ok){f.style.width='100%';st.textContent='Completado';p.textContent='100%';setTimeout(()=>document.getElementById('progressSection').classList.add('hidden'),1500);}else{document.getElementById('progressSection').classList.add('hidden');}}

// ============================================================
// FILE UPLOAD
// ============================================================
const dz=document.getElementById('dropZone');
['dragenter','dragover'].forEach(e=>{dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.add('drag-over');});});
['dragleave','drop'].forEach(e=>{dz.addEventListener(e,ev=>{ev.preventDefault();dz.classList.remove('drag-over');});});
dz.addEventListener('drop',ev=>{const f=ev.dataTransfer.files[0];if(f)processFile(f);});
function handleFile(ev){const f=ev.target.files[0];if(f)processFile(f);}
async function processFile(file){const ext=file.name.split('.').pop().toLowerCase();showStatus('Leyendo: '+file.name+'...');try{let t='';window._pendingImages=null;
  if(['txt','md','csv'].includes(ext)){
    t=await file.text();
  }else if(['png','jpg','jpeg','gif','webp'].includes(ext)){
    // Direct image upload — send as vision input
    const ab=await file.arrayBuffer();
    const base64=btoa(String.fromCharCode(...new Uint8Array(ab)));
    const mimeType=ext==='jpg'?'image/jpeg':ext==='png'?'image/png':ext==='gif'?'image/gif':'image/webp';
    window._pendingImages=[{media_type:mimeType,data:base64}];
    t='[Imagen subida: '+file.name+' — analizar visualmente]';
  }else if(ext==='pdf'){
    const ab=await file.arrayBuffer();
    if(typeof pdfjsLib==='undefined')throw new Error('Librería PDF no cargada, recarga la página');
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
    t=pp.join('\n\n');
    if(images.length>0) window._pendingImages=images;
  }else if(['docx','doc'].includes(ext)){
    const ab=await file.arrayBuffer();
    if(typeof mammoth==='undefined')throw new Error('Librería DOCX no cargada, recarga la página');
    const r=await mammoth.extractRawText({arrayBuffer:ab});
    t=r.value;
  }else{throw new Error('Formato no soportado');}
  document.getElementById('inputText').value=t;
  document.getElementById('fileInfo').classList.remove('hidden');
  const imgCount=window._pendingImages?window._pendingImages.length:0;
  const imgLabel=imgCount>0?' + '+imgCount+' '+t('imagesDetected'):'';
  document.getElementById('fileName').textContent=file.name+' ('+(t.length/1000).toFixed(1)+'K chars'+imgLabel+')';
  showStatus('Archivo cargado'+(imgCount?' — '+imgCount+' '+t('imagesDetected'):''));
}catch(e){showError('Error: '+e.message);}}
function clearFile(){document.getElementById('inputText').value='';document.getElementById('fileInfo').classList.add('hidden');document.getElementById('fileInput').value='';updateCharCount({value:''});}
function updateCharCount(el){const n=el.value.length;const c=document.getElementById('charCount');if(!c)return;if(n===0){c.textContent='';return;}const k=(n/1000).toFixed(1);if(n>60000){c.textContent=k+'K caracteres — ⚠ muy largo, puede afectar calidad';c.style.color='#BB0014';c.style.fontWeight='600';}else{c.textContent=k+'K caracteres';c.style.color=n>30000?'#44474C':'#94a3b8';c.style.fontWeight='400';}}

// ============================================================
// REPORT TYPE SELECTOR
// ============================================================
let currentReportType='strategic';
function setReportType(el){
  document.querySelectorAll('#reportTypeChips .rtype-chip').forEach(b=>b.classList.remove('active'));
  el.classList.add('active');
  currentReportType=el.dataset.type;
}

// ============================================================
// OUTPUT LANGUAGE SELECTOR
// ============================================================
let outputLanguage='es';
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
}

// ============================================================
// JSON VALIDATION
// ============================================================
function validateReport(r){
  const checks=[
    {key:'title',label:'título'},
    {key:'executive_summary',label:'resumen ejecutivo'},
    {key:'key_messages',label:'mensajes clave'},
    {key:'findings',label:'hallazgos'},
    {key:'analysis_blocks',label:'bloques de análisis'},
    {key:'recommendations',label:'recomendaciones'},
  ];
  return checks.filter(c=>!r[c.key]||(Array.isArray(r[c.key])&&!r[c.key].length)).map(c=>c.label);
}
function showValidationWarning(fields){
  document.getElementById('validationWarnText').textContent='Campos incompletos: '+fields.join(', ')+'. El informe puede estar incompleto — puedes continuar o reintentar.';
  document.getElementById('validationWarn').classList.remove('hidden');
}

// ============================================================
// REGENERAR SECCIÓN
// ============================================================
async function regenSection(sectionKey,idx,btn){
  const wUrl=WORKER_URL;
  if(!wUrl||!result)return;
  if(btn){btn.disabled=true;const ic=btn.querySelector('.material-symbols-outlined');if(ic)ic.textContent='hourglass_empty';}
  const labels={findings:'hallazgos',analysis_blocks:'bloque de análisis '+(idx!==undefined?idx+1:''),recommendations:'recomendaciones',risks:'riesgos',opportunities:'oportunidades'};
  const label=labels[sectionKey]||sectionKey;
  try{
    flash('Regenerando '+label+'...');
    const prompt=`Este es el informe ejecutivo actual en JSON:\n\n${JSON.stringify(result,null,2)}\n\nPor favor regenera ${idx!==undefined?'el ítem '+idx+' de ':''}la sección "${sectionKey}" con contenido fresco y de mayor calidad. Responde con el JSON completo actualizado precedido de __JSON_UPDATE__ en línea separada.`;
    const reply=await fetchFromWorker(wUrl,{userContent:'__CHAT_MODE__',chatMessages:[{role:'user',content:prompt}]},null);
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
    renderPreview(result);flash('✓ '+label+' regenerado');
  }catch(e){showError('Error regenerando: '+e.message);}
  finally{if(btn){btn.disabled=false;const ic=btn.querySelector('.material-symbols-outlined');if(ic)ic.textContent='refresh';}}
}

// ============================================================
// API CALL
// ============================================================
// ============================================================
// HISTORIAL DE INFORMES — localStorage (últimos 5)
// ============================================================
const HISTORY_KEY = 'alto_report_history';
let currentHistoryId = null;
let _autoSaveTimer = null;

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
    list.innerHTML='<p class="font-inter text-xs text-slate-400 px-3 py-2 italic" style="font-family:Inter,sans-serif">Sin informes aún</p>';
    return;
  }
  list.innerHTML = history.map(h=>`
    <button onclick="loadFromHistory(${h.id})" class="w-full text-left px-3 py-2.5 hover:bg-white transition-all group">
      <div class="font-['Inter'] text-[11px] font-semibold text-[#041627] leading-snug line-clamp-2 group-hover:text-[#BB0014] transition-colors">${h.title}</div>
      <div class="font-['Inter'] text-[9px] text-slate-400 mt-0.5">${h.date}</div>
    </button>
  `).join('');
}

// ============================================================
// INFORMES DASHBOARD — grid view of saved reports
// ============================================================
const INFORME_TYPE_LABELS = {
  strategic:'Estratégico', financial:'Financiero', operational:'Operacional',
  risk:'Riesgos', competitive:'Competitivo', due_diligence:'Due Diligence', general:'General'
};
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
    const label  = INFORME_TYPE_LABELS[type] || 'General';
    const subtitle = h.subtitle || r?.subtitle || '';
    const sections = r ? ['findings','recommendations','risks','opportunities','analysis'].filter(k => Array.isArray(r[k]) && r[k].length).length : 0;
    return `<div style="background:#fff;border-radius:12px;padding:28px;border:1px solid #f0f0f0;transition:all .2s;cursor:default"
         onmouseover="this.style.boxShadow='0 8px 32px rgba(4,22,39,0.08)';this.style.borderColor='rgba(196,198,205,0.5)'"
         onmouseout="this.style.boxShadow='';this.style.borderColor='#f0f0f0'">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
        <div style="flex:1;min-width:0">
          <span style="display:inline-block;padding:2px 10px;border-radius:20px;background:${colors.bg};color:${colors.text};font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px">${label}</span>
          <h3 style="font-family:Manrope,sans-serif;font-size:17px;font-weight:800;color:#041627;line-height:1.3;margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical">${esc(h.title)}</h3>
        </div>
        <span style="padding:4px 12px;border-radius:20px;background:#f0fdf4;color:#16a34a;font-size:11px;font-weight:600;white-space:nowrap;margin-left:12px;flex-shrink:0">Guardado</span>
      </div>
      ${subtitle
        ? `<p style="font-family:Inter,sans-serif;font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 20px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${esc(subtitle)}</p>`
        : `<p style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;line-height:1.5;margin:0 0 20px;font-style:italic">Sin descripción</p>`}
      <div style="display:flex;align-items:center;justify-content:space-between;padding-top:16px;border-top:1px solid #f3f4f6">
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#6b7280;background:#F2F4F6;padding:4px 8px;border-radius:4px">
            <span class="material-symbols-outlined" style="font-size:12px">calendar_today</span>${esc(h.date)}
          </span>
          ${sections > 0 ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:600;color:#6b7280;background:#F2F4F6;padding:4px 8px;border-radius:4px">
            <span class="material-symbols-outlined" style="font-size:12px">layers</span>${sections} secciones
          </span>` : ''}
        </div>
        <button onclick="openInformeFromGrid(${h.id})" style="display:flex;align-items:center;gap:4px;padding:6px 14px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:#374151;cursor:pointer;transition:all .15s"
                onmouseover="this.style.background='#041627';this.style.color='#fff';this.style.borderColor='#041627'"
                onmouseout="this.style.background='#fff';this.style.color='#374151';this.style.borderColor='#e5e7eb'">
          <span class="material-symbols-outlined" style="font-size:14px">open_in_new</span>Ver
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
}

function nuevoInforme() {
  // Reset all form state before showing clean form
  result = null; originalResult = null;
  hidePreview();
  ['btnDocx','btnPdf','btnPptx','btnBrief'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });
  const chatSection = document.getElementById('chatSection');
  if (chatSection) chatSection.classList.add('hidden');
  const statusMsg = document.getElementById('statusMsg');
  if (statusMsg) statusMsg.classList.add('hidden');
  const errorBox = document.getElementById('errorBox');
  if (errorBox) errorBox.classList.add('hidden');
  const validationWarn = document.getElementById('validationWarn');
  if (validationWarn) validationWarn.classList.add('hidden');
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) chatMessages.innerHTML = '';
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
      : `<div style="width:6px;height:6px;border-radius:50%;background:#BB0014"></div>${count>1?`<div style="width:6px;height:6px;border-radius:50%;background:#4279B0"></div>`:'<div style="width:6px;height:6px;border-radius:50%;background:rgba(255,255,255,0.15)"></div>'}`;
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
  h+=`<div class="flex items-center justify-between px-8 py-4 bg-[#041627]">
    <div class="flex items-center gap-3">
      <span class="font-['Manrope'] font-black text-white text-xs tracking-widest uppercase">ALTO</span>
      <div class="w-px h-4 bg-white/20"></div>
      <span class="font-['Inter'] text-[10px] text-slate-400 tracking-wide uppercase">${t('confidential')}</span>
    </div>
    <span class="font-['Inter'] italic text-[10px] text-slate-500">${new Date().toLocaleDateString('es-CL',{year:'numeric',month:'long',day:'numeric'})}</span>
  </div>`;

  // ── Title block ────────────────────────────────────────────
  h+=`<div class="px-10 pt-10 pb-8 border-b border-[#E0E3E5]">
    <span class="font-['Inter'] text-[#BB0014] font-bold tracking-[0.25em] uppercase text-[10px] mb-3 block">${t('analysisLabel')}</span>
    <h1 class="font-['Manrope'] text-3xl font-extrabold text-[#041627] leading-tight tracking-tight editable" contenteditable="true" data-path="title" onblur="updateField(this)">${esc(r.title)}</h1>`;
  if(r.subtitle)h+=`<p class="font-['Inter'] text-sm text-slate-500 italic mt-2 editable" contenteditable="true" data-path="subtitle" onblur="updateField(this)">${esc(r.subtitle)}</p>`;
  h+=`<div class="w-16 h-0.5 bg-[#BB0014] mt-5"></div></div>`;

  // ── Executive Summary — So What box ───────────────────────
  h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
    <div class="flex gap-0">
      <div class="accent-bar self-stretch"></div>
      <div class="bg-[#F2F4F6] flex-1 p-6">
        <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#BB0014] font-bold block mb-3">${t('execSummary')}</span>
        <p class="font-['Inter'] italic text-base leading-relaxed text-[#041627] editable" contenteditable="true" data-path="executive_summary" onblur="updateField(this)">${esc(r.executive_summary)}</p>
      </div>
    </div>
  </div>`;

  // ── Key Messages ───────────────────────────────────────────
  if(r.key_messages?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#041627] font-bold mb-5">${t('keyMessages')}</h2>
      <div class="space-y-3">`;
    r.key_messages.forEach((m,i)=>{
      h+=`<div class="flex gap-3 items-start">
        <span class="font-['Inter'] text-[#BB0014] font-black text-xs mt-0.5 select-none">▸</span>
        <span class="font-['Inter'] text-sm text-[#191C1E] leading-snug editable" contenteditable="true" data-path="key_messages[${i}]" onblur="updateField(this)">${esc(m)}</span>
      </div>`;
    });
    h+=`</div></div>`;
  }

  // ── Context ────────────────────────────────────────────────
  if(r.context){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#041627] font-bold mb-4">${t('context')}</h2>
      <p class="font-['Inter'] text-sm text-[#44474C] leading-relaxed editable" contenteditable="true" data-path="context" onblur="updateField(this)">${esc(r.context)}</p>
    </div>`;
  }

  // ── Findings ───────────────────────────────────────────────
  if(r.findings?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5] section-collapsible">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3 cursor-pointer select-none flex-1" onclick="this.closest('.section-collapsible').classList.toggle('collapsed')">
          <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#041627] font-bold">${t('findings')}</h2>
          <span class="collapse-icon material-symbols-outlined text-sm text-slate-400">expand_more</span>
        </div>
        <button class="regen-btn" onclick="event.stopPropagation();regenSection('findings',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>
      <div class="section-body" style="max-height:2000px">
      <div class="space-y-5">`;
    r.findings.forEach((f,i)=>{
      h+=`<div class="grid grid-cols-12 gap-0 finding-card">
        <div class="col-span-1 bg-[#041627] flex items-center justify-center py-4">
          <span class="font-['Manrope'] font-black text-white text-sm">${i+1}</span>
        </div>
        <div class="col-span-11 bg-[#F8F9FB] p-5 border-b-2 border-[#BB0014]">
          <p class="font-['Manrope'] font-bold text-sm text-[#041627] mb-2 editable" contenteditable="true" data-path="findings[${i}].finding" onblur="updateField(this)">${esc(f.finding)}</p>
          <p class="font-['Inter'] text-xs text-slate-500 mb-1.5"><strong>${t('evidence')}:</strong> <span class="editable" contenteditable="true" data-path="findings[${i}].evidence" onblur="updateField(this)">${esc(f.evidence)}</span></p>
          <p class="font-['Inter'] text-xs text-[#BB0014] font-medium"><strong>${t('implication')}:</strong> <span class="editable" contenteditable="true" data-path="findings[${i}].business_implication" onblur="updateField(this)">${esc(f.business_implication)}</span></p>
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
              <span class="font-['Inter'] text-[#BB0014] text-[10px] uppercase tracking-widest font-bold">${i+1}. ${t('analysis')}</span>
              <h2 class="font-['Manrope'] text-lg font-bold text-[#041627] mt-1 editable" contenteditable="true" data-path="analysis_blocks[${i}].heading" onblur="updateField(this)">${esc(s.heading)}</h2>
            </div>
          </div>
          <button class="regen-btn" onclick="regenSection('analysis_blocks',${i},this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
        </div>`;
      if(s.governing_thought){
        h+=`<div class="bg-[#041627] text-white p-5 mb-5">
          <p class="font-['Manrope'] font-bold text-sm leading-snug editable" contenteditable="true" data-path="analysis_blocks[${i}].governing_thought" onblur="updateField(this)">${esc(s.governing_thought)}</p>
        </div>`;
      }
      if(s.content){
        h+=`<p class="font-['Inter'] text-sm text-[#44474C] leading-relaxed mb-4 editable" contenteditable="true" data-path="analysis_blocks[${i}].content" onblur="updateField(this)">${esc(s.content)}</p>`;
      }
      if(s.bullets?.length){
        s.bullets.forEach((b,j)=>{
          h+=`<div class="flex gap-3 mb-2 items-start pl-2"><span class="text-[#BB0014] font-black text-xs select-none mt-0.5">▸</span><span class="font-['Inter'] text-sm text-[#191C1E] editable" contenteditable="true" data-path="analysis_blocks[${i}].bullets[${j}]" onblur="updateField(this)">${esc(b)}</span></div>`;
        });
      }
      if(s.so_what){
        h+=`<div class="flex gap-0 mt-5 so-what-box">
          <div style="width:3px;background:#BB0014;flex-shrink:0"></div>
          <div class="bg-[#FFF5F5] flex-1 px-5 py-3">
            <span class="font-['Inter'] text-[10px] font-bold text-[#BB0014] uppercase tracking-widest">So what?  </span>
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
      <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#BB0014] font-bold mb-5">${t('risks')}</h2>
      <div class="space-y-3">`;
    r.risks.forEach((rk,i)=>{
      h+=`<div class="flex gap-0">
        <div style="width:3px;background:#BB0014;flex-shrink:0"></div>
        <div class="bg-[#FFF5F5] flex-1 px-5 py-4">
          <p class="font-['Manrope'] font-bold text-sm text-[#BB0014] mb-1 editable" contenteditable="true" data-path="risks[${i}].risk" onblur="updateField(this)">${esc(rk.risk)}</p>
          <p class="font-['Inter'] text-xs text-slate-500 editable" contenteditable="true" data-path="risks[${i}].implication" onblur="updateField(this)">${esc(rk.implication)}</p>
        </div>
      </div>`;
    });
    h+=`</div></div>`;
  }

  // ── Opportunities ──────────────────────────────────────────
  if(r.opportunities?.length){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#041627] font-bold mb-5">${t('opportunities')}</h2>
      <div class="space-y-2">`;
    r.opportunities.forEach((o,i)=>{
      h+=`<div class="flex gap-3 items-start"><span class="font-['Inter'] text-[#4279B0] font-black text-xs select-none mt-0.5">✦</span><span class="font-['Inter'] text-sm text-[#191C1E] editable" contenteditable="true" data-path="opportunities[${i}]" onblur="updateField(this)">${esc(o)}</span></div>`;
    });
    h+=`</div></div>`;
  }

  // ── Recommendations ────────────────────────────────────────
  if(r.recommendations){
    h+=`<div class="px-10 py-8 border-b border-[#E0E3E5]">
      <div class="flex items-center justify-between mb-6">
        <h2 class="font-['Manrope'] text-[10px] uppercase tracking-widest text-[#041627] font-bold">${t('recommendations')}</h2>
        <button class="regen-btn" onclick="regenSection('recommendations',undefined,this)"><span class="material-symbols-outlined" style="font-size:13px">refresh</span>${t('regenerate')}</button>
      </div>`;
    [{key:'short_term',label:t('shortTerm'),color:'#BB0014'},{key:'medium_term',label:t('mediumTerm'),color:'#041627'},{key:'long_term',label:t('longTerm'),color:'#1A2B3C'}].forEach(hz=>{
      const items=r.recommendations[hz.key];
      if(!items?.length)return;
      h+=`<div class="mb-6">
        <div class="inline-block font-['Inter'] text-[9px] uppercase tracking-widest font-bold text-white px-3 py-1 mb-4" style="background:${hz.color}">${hz.label}</div>`;
      items.forEach((rec,i)=>{
        h+=`<div class="flex gap-0 mb-3">
          <div class="w-7 h-7 flex items-center justify-center flex-shrink-0 font-['Manrope'] font-black text-xs text-white" style="background:${hz.color}">${i+1}</div>
          <div class="bg-[#F8F9FB] flex-1 px-5 py-3">
            <p class="font-['Manrope'] font-bold text-sm text-[#041627] editable" contenteditable="true" data-path="recommendations.${hz.key}[${i}].action" onblur="updateField(this)">${esc(rec.action)}</p>
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
        <div style="width:4px;background:#4279B0;flex-shrink:0"></div>
        <div class="flex-1 pl-6">
          <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#4279B0] font-bold block mb-4">${t('infoGaps')}</span>
          <div class="space-y-2.5">`;
    r.information_gaps.forEach((g,i)=>{
      h+=`<div class="flex gap-3 items-start"><span class="material-symbols-outlined text-[14px] text-[#4279B0] select-none mt-0.5" style="font-variation-settings:'FILL' 0">info</span><span class="font-['Inter'] text-sm text-[#44474C] editable" contenteditable="true" data-path="information_gaps[${i}]" onblur="updateField(this)">${esc(g)}</span></div>`;
    });
    h+=`</div></div></div></div>`;
  }

  // ── Conclusion ─────────────────────────────────────────────
  if(r.conclusion){
    h+=`<div class="px-10 py-8">
      <div class="flex gap-0">
        <div style="width:4px;background:#041627;flex-shrink:0"></div>
        <div class="bg-[#F2F4F6] flex-1 p-6">
          <span class="font-['Inter'] text-[10px] uppercase tracking-widest text-[#041627] font-bold block mb-3">${t('conclusion')}</span>
          <p class="font-['Manrope'] italic text-base leading-relaxed text-[#041627] font-semibold editable" contenteditable="true" data-path="conclusion" onblur="updateField(this)">${esc(r.conclusion)}</p>
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
    const{jsPDF}=window.jspdf;
    const pdf=new jsPDF('p','mm','a4');
    const r=result;
    const W=210,H=297;
    const ML=18,MR=18,MT=22,MB=22;
    const CW=W-ML-MR;
    let y=0;
    const NAVY='#041627',RED='#BB0014',BLUE='#4279B0',BODY='#44474C',SGRAY='#74777D',LGRAY='#F2F4F6',MGRAY='#C4C6CD';
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
function showExportBtns(){['btnDocx','btnPdf','btnPptx','btnBrief'].forEach(id=>document.getElementById(id).classList.remove('hidden'));document.getElementById('chatSection').classList.remove('hidden');}

// ============================================================
// MEJORA #8: FOLLOW-UP CHAT
// ============================================================
let chatHistory = [];

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  const wUrl = WORKER_URL;
  if (!msg || !result || !wUrl) return;

  input.value = '';
  addChatBubble('user', msg);

  const btn = document.getElementById('btnChat');
  btn.disabled = true;

  // Build context with current report state
  chatHistory.push({ role: 'user', content: msg });

  try {
    const reply = await fetchFromWorker(wUrl, {
      userContent: '__CHAT_MODE__',
      chatMessages: [
        { role: 'user', content: `Este es el informe ejecutivo actual en JSON:\n\n${JSON.stringify(result, null, 2)}\n\nEl usuario tiene una consulta sobre este informe. Responde de forma concisa y profesional. Si el usuario pide modificar el informe, responde con el JSON actualizado completo precedido de la etiqueta __JSON_UPDATE__ en una línea separada. Si solo pide información o aclaración, responde en texto normal.\n\nConsulta del usuario: ${msg}` },
      ],
    }, null);

    // Check if response includes a JSON update
    if (reply.includes('__JSON_UPDATE__')) {
      const parts = reply.split('__JSON_UPDATE__');
      const textPart = parts[0].trim();
      const jsonPart = parts[1].replace(/```json|```/g, '').trim();
      try {
        const updated = JSON.parse(jsonPart);
        result = updated;
        renderPreview(result);
        addChatBubble('assistant', (textPart || 'Informe actualizado.') + '\n\n✅ El informe ha sido actualizado. Los cambios se reflejan en la vista previa y en las exportaciones.');
      } catch(e) {
        addChatBubble('assistant', textPart || reply);
      }
    } else {
      addChatBubble('assistant', reply);
    }

    chatHistory.push({ role: 'assistant', content: reply });
  } catch(err) {
    addChatBubble('assistant', '❌ Error: ' + err.message);
  } finally {
    btn.disabled = false;
  }
}

function addChatBubble(role, text) {
  const container = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = role === 'user'
    ? 'flex justify-end'
    : 'flex justify-start';
  const bubble = document.createElement('div');
  bubble.className = role === 'user'
    ? 'bg-[#041627] text-white font-[Inter] text-sm px-4 py-3 max-w-[85%] whitespace-pre-wrap'
    : 'bg-[#F2F4F6] border-l-4 border-[#BB0014] text-[#191C1E] font-[Inter] text-sm px-4 py-3 max-w-[85%] whitespace-pre-wrap';
  bubble.textContent = text;
  div.appendChild(bubble);
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}
function setDot(s){
  const d=document.getElementById('statusDot'),l=document.getElementById('statusDotLabel');
  d.classList.remove('connected');
  if(s==='ok'){d.style.background='#10b981';d.style.boxShadow='0 0 8px rgba(16,185,129,0.6)';d.classList.add('connected');l.textContent='Conectado';}
  else if(s==='no'){d.style.background='#BB0014';d.style.boxShadow='0 0 8px rgba(187,0,20,0.6)';l.textContent='Error';}
  else{d.style.background='#64748b';d.style.boxShadow='none';l.textContent='Sin conexión';}
}
function flash(m){showStatus(m);setTimeout(()=>{if(result)showStatus('Informe listo — edita y exporta');},2500);}
function loadSample(){document.getElementById('inputText').value=`Tenemos un problema con las tiendas de México. Los eventos de pérdida han bajado un 15% en Q1 2026 comparado con Q4 2025, pero no sabemos si es porque mejoró la prevención o porque dejaron de reportar.\n\nLas tiendas de Walmart concentran el 60% de los eventos. Los modus operandi más frecuentes son hurto hormiga y robo organizado. El equipo legal tiene 340 expedientes abiertos y solo 12 han llegado a sentencia este trimestre.\n\nEl área de operaciones reporta que hay 3 tiendas que concentran el 25% de los eventos pero no han tenido visita de auditoría en 6 meses. El equipo de analytics detectó que los eventos de "robo organizado" subieron un 40% en tiendas de formato grande.\n\nNecesitamos decidir si reasignar guardias, cambiar protocolos en ciertas tiendas, priorizar casos legales por monto, y definir un modelo de scoring de tiendas por riesgo.\n\nNota: la data de modus operandi tiene un 30% de registros sin clasificar. También hay discrepancias entre los datos del sistema legacy y la plataforma nueva.`;}
// ============================================================
// NAV SIDEBAR — Minutas / Informes tab switching
// ============================================================
function switchNavTab(tab) {
  const minutasPanel   = document.getElementById('minutasPanel');
  const informesPanel  = document.getElementById('informesPanel');
  const navMinutas     = document.getElementById('navMinutas');
  const navInformes    = document.getElementById('navInformes');
  const calSection     = document.getElementById('sidebarCalendar');
  const histSection    = document.getElementById('sidebarHistory');

  const activeStyle   = 'display:flex;align-items:center;gap:10px;width:100%;padding:10px 18px;font-family:Inter,sans-serif;font-size:13px;font-weight:500;color:#fff;background:rgba(187,0,20,0.12);border:none;border-left:3px solid #BB0014;cursor:pointer;text-align:left';
  const inactiveStyle = 'display:flex;align-items:center;gap:10px;width:100%;padding:10px 18px;font-family:Inter,sans-serif;font-size:13px;font-weight:500;color:rgba(255,255,255,0.55);background:transparent;border:none;border-left:3px solid transparent;cursor:pointer;text-align:left';

  if (tab === 'minutas') {
    minutasPanel.style.display  = 'block';
    informesPanel.style.display = 'none';
    navMinutas.style.cssText    = activeStyle;
    navInformes.style.cssText   = inactiveStyle;
    calSection.style.display    = 'block';
    histSection.style.display   = 'none';
    renderMinutasList();
  } else {
    minutasPanel.style.display  = 'none';
    informesPanel.style.display = 'block';
    navMinutas.style.cssText    = inactiveStyle;
    navInformes.style.cssText   = activeStyle;
    calSection.style.display    = 'none';
    histSection.style.display   = 'block';
    buildQuarterPlanner();
    hideNuevoInformeForm();
  }
}

// ============================================================
// CALENDAR — 3-month planner in sidebar
// ============================================================
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

  let html = '';
  months.forEach(({ year, month }, idx) => {
    const isCurrent = year === todayY && month === todayM;
    const firstDay  = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    html += `<div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:600;color:${isCurrent ? '#BB0014' : 'rgba(255,255,255,0.9)'};text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;padding:0 2px">${monthNames[month]} ${year}</div>
      <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px">`;
    ['D','L','M','X','J','V','S'].forEach(d => {
      html += `<div style="font-size:9px;color:rgba(255,255,255,0.35);text-align:center;padding:2px 0;font-weight:500">${d}</div>`;
    });
    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      html += `<div></div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = isCurrent && d === todayD;
      const style = isToday
        ? 'font-size:10px;text-align:center;padding:3px 1px;border-radius:50%;background:#BB0014;color:#fff;font-weight:600;cursor:pointer'
        : 'font-size:10px;text-align:center;padding:3px 1px;border-radius:50%;color:rgba(255,255,255,0.55);cursor:pointer';
      html += `<div style="${style}">${d}</div>`;
    }
    html += `</div></div>`;
    if (idx < 2) html += `<div style="height:1px;background:rgba(255,255,255,0.08);margin:4px 0 12px"></div>`;
  });
  container.innerHTML = html;
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
  progLabel.textContent = 'Analizando reunión...';

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
    progLabel.textContent = 'Generando minuta...';

    const res = await fetch(WORKER_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Error ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      chunk.split('\n').forEach(line => {
        if (!line.startsWith('data:')) return;
        try {
          const ev = JSON.parse(line.slice(5));
          if (ev.text) accumulated += ev.text;
        } catch(e) {}
      });
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
    renderMinutaPreview(minutaResult);
    document.getElementById('nuevaMinutaSection').style.display = 'none';
    renderMinutasList();

  } catch(err) {
    progLabel.textContent = 'Error: ' + err.message;
    progLabel.style.color = '#BB0014';
    setTimeout(() => { prog.style.display = 'none'; progLabel.style.color = '#BB0014'; }, 3000);
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
      date: r.date || new Date().toLocaleDateString('es-CL'),
      saved_at: new Date().toISOString(),
      data: JSON.stringify(r),
    };
    list.unshift(entry);
    if (list.length > 20) list.splice(20);
    localStorage.setItem(MINUTAS_KEY, JSON.stringify(list));
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
let _minutasFilter = '';
function filterMinutas(q) { _minutasFilter = q.toLowerCase(); renderMinutasList(); }

function renderMinutasList() {
  const container = document.getElementById('minutasList');
  if (!container) return;
  let list = loadMinutasHistory();
  if (_minutasFilter) {
    list = list.filter(m => m.title.toLowerCase().includes(_minutasFilter) || (m.date||'').includes(_minutasFilter));
  }
  if (!list.length) {
    container.innerHTML = `<p style="font-family:Inter,sans-serif;font-size:13px;color:#9ca3af;padding:32px 0;text-align:center;font-style:italic">Sin minutas guardadas aún. Crea tu primera minuta.</p>`;
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
    <div style="background:#fff;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,0.07),0 2px 12px rgba(0,0,0,0.04);margin-bottom:12px;overflow:hidden">
      <div style="padding:16px 20px;cursor:pointer" onclick="toggleMinutaCard(${m.id})">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
          <div>
            <div style="font-family:Inter,sans-serif;font-size:14px;font-weight:600;color:#111827">${esc(m.title)}</div>
            <div style="font-family:Inter,sans-serif;font-size:12px;color:#9ca3af;margin-top:3px">${esc(savedDate)}${attendees ? ' · ' + attendees + ' asistentes' : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:#dcfce7;color:#16a34a">Finalizada</span>
            <span id="chevron-${m.id}" style="font-family:Material Symbols Outlined;font-size:18px;color:#9ca3af;transition:transform .2s">expand_more</span>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${commitCount ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;padding:4px 10px;border-radius:20px;background:#f0fdf4;color:#16a34a">✓ ${commitCount} compromisos</span>` : ''}
          ${pending ? `<span style="display:inline-flex;align-items:center;gap:4px;font-size:11px;font-weight:500;padding:4px 10px;border-radius:20px;background:#fffbeb;color:#d97706">⚠ ${pending} pendientes</span>` : ''}
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
  const priorityDot = p => {
    const colors = { high: '#BB0014', medium: '#f59e0b', low: '#22c55e' };
    return `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${colors[p]||'#9ca3af'};margin-right:4px"></span>`;
  };

  let html = '<div style="padding:0 20px 18px;border-top:1px solid #f3f4f6">';

  // Attendees
  if (r.attendees?.length) {
    const avatarColors = ['#BB0014','#4279B0','#16a34a','#7c3aed','#ea580c','#0891b2'];
    html += `<div style="display:flex;align-items:center;gap:6px;padding:14px 0 12px">
      <span style="font-family:Inter,sans-serif;font-size:11px;color:#9ca3af;font-weight:500;margin-right:4px;text-transform:uppercase;letter-spacing:.05em">Asistentes</span>`;
    r.attendees.slice(0,6).forEach((a, i) => {
      const initials = a.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2);
      html += `<div title="${esc(a)}" style="width:26px;height:26px;border-radius:50%;background:${avatarColors[i%avatarColors.length]};display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;color:#fff;border:2px solid #fff">${initials}</div>`;
    });
    if (r.attendees.length > 6) html += `<span style="font-size:11px;color:#9ca3af">+${r.attendees.length-6}</span>`;
    html += `</div>`;
  }

  // Decisions
  if (r.decisions?.length) {
    html += `<div style="font-family:Inter,sans-serif;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Decisiones</div>`;
    html += `<div style="margin-bottom:14px">`;
    r.decisions.forEach(d => {
      html += `<div style="padding:8px 12px;background:#f8fafc;border-left:3px solid #041627;margin-bottom:6px;border-radius:0 6px 6px 0">
        <div style="font-family:Inter,sans-serif;font-size:12px;font-weight:600;color:#111827">${esc(d.decision)}</div>
        ${d.rationale ? `<div style="font-family:Inter,sans-serif;font-size:11px;color:#6b7280;margin-top:2px">${esc(d.rationale)}</div>` : ''}
        ${d.owner ? `<div style="font-family:Inter,sans-serif;font-size:11px;color:#4279B0;margin-top:2px">👤 ${esc(d.owner)}</div>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  // Commitments table
  if (r.commitments?.length) {
    html += `<div style="font-family:Inter,sans-serif;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Compromisos</div>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:14px">
      <thead>
        <tr>
          <th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f3f4f6">Tarea</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f3f4f6">Responsable</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f3f4f6">Fecha</th>
          <th style="text-align:left;padding:6px 8px;font-size:10px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f3f4f6">Prioridad</th>
        </tr>
      </thead>
      <tbody>`;
    r.commitments.forEach(c => {
      html += `<tr>
        <td style="padding:8px;color:#374151;border-bottom:1px solid #f9fafb;font-family:Inter,sans-serif">${esc(c.task)}</td>
        <td style="padding:8px;color:#374151;border-bottom:1px solid #f9fafb;font-family:Inter,sans-serif"><span style="display:inline-flex;align-items:center;background:#f3f4f6;border-radius:20px;padding:2px 8px;font-size:11px">${esc(c.responsible)}</span></td>
        <td style="padding:8px;color:#374151;border-bottom:1px solid #f9fafb;font-family:Inter,sans-serif;font-size:11px">${esc(c.deadline)}</td>
        <td style="padding:8px;color:#374151;border-bottom:1px solid #f9fafb;font-family:Inter,sans-serif">${priorityDot(c.priority)}${c.priority==='high'?'Alta':c.priority==='medium'?'Media':'Baja'}</td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }

  // Open issues
  if (r.open_issues?.length) {
    html += `<div style="font-family:Inter,sans-serif;font-size:11px;color:#9ca3af;font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Pendientes</div>
    <ul style="margin:0 0 14px 0;padding-left:16px">`;
    r.open_issues.forEach(i => {
      html += `<li style="font-family:Inter,sans-serif;font-size:12px;color:#374151;margin-bottom:4px">${esc(i)}</li>`;
    });
    html += `</ul>`;
  }

  // Export row
  html += `<div style="display:flex;align-items:center;gap:10px;padding-top:14px;border-top:1px solid #f3f4f6">
    <span style="font-family:Inter,sans-serif;font-size:11px;color:#9ca3af;font-weight:500">Exportar</span>
    <button onclick="downloadMinutaDocx(this)" data-minuta='${JSON.stringify(r).replace(/'/g,"&#39;")}' style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:6px;border:1px solid #e5e7eb;background:#fff;font-size:11px;font-weight:500;color:#6b7280;cursor:pointer;font-family:Inter,sans-serif">
      <span class="material-symbols-outlined" style="font-size:14px">description</span> DOCX
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
          <div style="font-family:Inter,sans-serif;font-size:12px;color:#9ca3af;margin-top:3px">${r.date || ''} ${r.attendees?.length ? '· '+r.attendees.length+' asistentes' : ''}</div>
        </div>
        <span style="font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;background:#dbeafe;color:#1d4ed8">Nueva</span>
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
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = docx;
  const children = [];
  children.push(new Paragraph({ children:[new TextRun({text:r.title||'Minuta',bold:true,size:36,color:'041627',font:'Calibri'})], spacing:{after:200} }));
  if(r.date) children.push(new Paragraph({ children:[new TextRun({text:'Fecha: '+r.date,size:22,color:'44474C',font:'Calibri'})], spacing:{after:100} }));
  if(r.attendees?.length) children.push(new Paragraph({ children:[new TextRun({text:'Asistentes: '+r.attendees.join(', '),size:22,color:'44474C',font:'Calibri'})], spacing:{after:300} }));
  if(r.summary) {
    children.push(new Paragraph({ children:[new TextRun({text:'RESUMEN',bold:true,size:20,color:'BB0014',font:'Calibri'})], spacing:{before:200,after:100} }));
    children.push(new Paragraph({ children:[new TextRun({text:r.summary,size:22,font:'Calibri'})], spacing:{after:300} }));
  }
  if(r.commitments?.length) {
    children.push(new Paragraph({ children:[new TextRun({text:'COMPROMISOS',bold:true,size:20,color:'BB0014',font:'Calibri'})], spacing:{before:200,after:200} }));
    const rows = [new TableRow({children:[
      new TableCell({children:[new Paragraph({children:[new TextRun({text:'Tarea',bold:true,size:18,font:'Calibri'})]})], shading:{fill:'041627'}}),
      new TableCell({children:[new Paragraph({children:[new TextRun({text:'Responsable',bold:true,size:18,font:'Calibri'})]})], shading:{fill:'041627'}}),
      new TableCell({children:[new Paragraph({children:[new TextRun({text:'Fecha',bold:true,size:18,font:'Calibri'})]})], shading:{fill:'041627'}}),
      new TableCell({children:[new Paragraph({children:[new TextRun({text:'Prioridad',bold:true,size:18,font:'Calibri'})]})], shading:{fill:'041627'}}),
    ]})];
    r.commitments.forEach(c => {
      rows.push(new TableRow({children:[
        new TableCell({children:[new Paragraph({children:[new TextRun({text:c.task||'',size:18,font:'Calibri'})]})] }),
        new TableCell({children:[new Paragraph({children:[new TextRun({text:c.responsible||'',size:18,font:'Calibri'})]})] }),
        new TableCell({children:[new Paragraph({children:[new TextRun({text:c.deadline||'',size:18,font:'Calibri'})]})] }),
        new TableCell({children:[new Paragraph({children:[new TextRun({text:c.priority||'',size:18,font:'Calibri'})]})] }),
      ]}));
    });
    children.push(new Table({rows, width:{size:100,type:WidthType.PERCENTAGE}}));
    children.push(new Paragraph({children:[],spacing:{after:300}}));
  }
  if(r.decisions?.length) {
    children.push(new Paragraph({ children:[new TextRun({text:'DECISIONES',bold:true,size:20,color:'BB0014',font:'Calibri'})], spacing:{before:200,after:100} }));
    r.decisions.forEach(d => {
      children.push(new Paragraph({ children:[new TextRun({text:'• '+d.decision,bold:true,size:22,font:'Calibri'})], spacing:{after:60} }));
      if(d.rationale) children.push(new Paragraph({ children:[new TextRun({text:'  '+d.rationale,size:20,color:'44474C',font:'Calibri'})], spacing:{after:100} }));
    });
  }
  if(r.open_issues?.length) {
    children.push(new Paragraph({ children:[new TextRun({text:'PENDIENTES',bold:true,size:20,color:'BB0014',font:'Calibri'})], spacing:{before:200,after:100} }));
    r.open_issues.forEach(i => {
      children.push(new Paragraph({ children:[new TextRun({text:'• '+i,size:22,font:'Calibri'})], spacing:{after:80} }));
    });
  }
  const doc = new Document({sections:[{children}]});
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url;
  a.download=`Minuta_ALTO_${new Date().toISOString().slice(0,10)}.docx`;
  a.click(); URL.revokeObjectURL(url);
}

// ============================================================
// Update renderHistory for dark sidebar
// ============================================================
function renderHistory(){
  const list = document.getElementById('historyList');
  if(!list)return;
  const history = loadHistory();
  if(!history.length){
    list.innerHTML='<p style="font-family:Inter,sans-serif;font-size:12px;color:rgba(255,255,255,0.4);padding:12px 16px;font-style:italic">Sin informes aún</p>';
    return;
  }
  list.innerHTML = history.map(h=>`
    <button onclick="loadFromHistory(${h.id})" style="display:block;width:100%;text-align:left;padding:10px 14px;background:transparent;border:none;border-radius:6px;cursor:pointer;transition:background .15s" onmouseover="this.style.background='rgba(255,255,255,0.08)'" onmouseout="this.style.background='transparent'">
      <div style="font-family:Inter,sans-serif;font-size:11px;font-weight:600;color:rgba(255,255,255,0.85);line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${h.title}</div>
      <div style="font-family:Inter,sans-serif;font-size:9px;color:rgba(255,255,255,0.35);margin-top:3px">${h.date}</div>
    </button>
  `).join('');
}

// ============================================================
// Prevent accidental navigation when report is loaded
window.addEventListener('beforeunload',e=>{if(result){e.preventDefault();}});

// ── Session token for Worker auth ──
window._sessionToken = null;
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
