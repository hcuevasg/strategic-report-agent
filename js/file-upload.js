// ============================================================
// FILE UPLOAD — drag/drop, file processing, char count
// Depends on: lib-loader.js (loadLib), state.js, ui-helpers.js (showStatus, showError, t)
// ============================================================

const dz = document.getElementById('dropZone');
['dragenter', 'dragover'].forEach(e => {
  dz.addEventListener(e, ev => {
    ev.preventDefault();
    dz.classList.add('drag-over');
  });
});
['dragleave', 'drop'].forEach(e => {
  dz.addEventListener(e, ev => {
    ev.preventDefault();
    dz.classList.remove('drag-over');
  });
});
dz.addEventListener('drop', ev => {
  const f = ev.dataTransfer.files[0];
  if (f) processFile(f);
});
function handleFile(ev) {
  const f = ev.target.files[0];
  if (f) processFile(f);
}
async function processFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  showStatus(t('uiReading') + ': ' + file.name + '...');
  try {
    let txt = '';
    window._pendingImages = null;
    if (['txt', 'md', 'csv'].includes(ext)) {
      txt = await file.text();
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) {
      // Direct image upload — send as vision input
      const ab = await file.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(ab)));
      const mimeType =
        ext === 'jpg'
          ? 'image/jpeg'
          : ext === 'png'
            ? 'image/png'
            : ext === 'gif'
              ? 'image/gif'
              : 'image/webp';
      window._pendingImages = [{ media_type: mimeType, data: base64 }];
      txt = '[Imagen subida: ' + file.name + ' — analizar visualmente]';
    } else if (ext === 'pdf') {
      const ab = await file.arrayBuffer();
      await loadLib('pdfjs');
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      const pp = [];
      const images = [];
      const maxImagePages = Math.min(pdf.numPages, 5);
      for (let i = 1; i <= pdf.numPages; i++) {
        const pg = await pdf.getPage(i);
        const c = await pg.getTextContent();
        pp.push(c.items.map(x => x.str).join(' '));
        // Render first N pages as images for vision analysis
        if (i <= maxImagePages) {
          try {
            const scale = 1.5;
            const vp = pg.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = Math.min(vp.width, 1024);
            canvas.height = Math.min(vp.height, 1400);
            const ctx = canvas.getContext('2d');
            const renderScale = canvas.width / vp.width;
            await pg.render({
              canvasContext: ctx,
              viewport: pg.getViewport({ scale: scale * renderScale }),
            }).promise;
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            const base64 = dataUrl.split(',')[1];
            images.push({ media_type: 'image/jpeg', data: base64 });
          } catch (imgErr) {
            console.warn('Page image extraction failed:', imgErr);
          }
        }
      }
      txt = pp.join('\n\n');
      if (images.length > 0) window._pendingImages = images;
    } else if (['docx', 'doc'].includes(ext)) {
      const ab = await file.arrayBuffer();
      await loadLib('mammoth');
      const r = await mammoth.extractRawText({ arrayBuffer: ab });
      txt = r.value;
    } else {
      throw new Error('Formato no soportado');
    }
    document.getElementById('inputText').value = txt;
    document.getElementById('fileInfo').classList.remove('hidden');
    const imgCount = window._pendingImages ? window._pendingImages.length : 0;
    const imgLabel = imgCount > 0 ? ' + ' + imgCount + ' ' + t('imagesDetected') : '';
    document.getElementById('fileName').textContent =
      file.name + ' (' + (txt.length / 1000).toFixed(1) + 'K chars' + imgLabel + ')';
    showStatus(t('uiFileLoaded') + (imgCount ? ' — ' + imgCount + ' ' + t('imagesDetected') : ''));
  } catch (e) {
    showError('Error: ' + e.message);
  }
}
function clearFile() {
  document.getElementById('inputText').value = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('fileInput').value = '';
  updateCharCount({ value: '' });
}
function updateCharCount(el) {
  const n = el.value.length;
  const c = document.getElementById('charCount');
  if (!c) return;
  if (n === 0) {
    c.textContent = '';
    return;
  }
  const k = (n / 1000).toFixed(1);
  if (n > CHAR_LIMIT_ERROR) {
    c.textContent = k + 'K ' + t('uiChars') + ' — ⚠ ' + t('uiTooLong');
    c.style.color = '#E74243';
    c.style.fontWeight = '600';
  } else {
    c.textContent = k + 'K ' + t('uiChars');
    c.style.color = n > CHAR_LIMIT_WARN ? '#44474C' : '#94a3b8';
    c.style.fontWeight = '400';
  }
}
