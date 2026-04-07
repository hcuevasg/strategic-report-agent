// ============================================================
// ALTO — Lazy library loader
// Loads heavy CDN libs on demand instead of at page load.
// Usage: await loadLib('jspdf')
// ============================================================

const _LIBS = {
  docx: {
    url: 'https://cdn.jsdelivr.net/npm/docx@8.5.0/build/index.umd.js',
    integrity: 'sha384-4xaIisuLEy2lo2HkB2C4rEf7v8jbTb2kuogX6TkuEt9feTWKBSFSOzsqNNbV+sKh',
    check: () => typeof window.docx !== 'undefined',
  },
  html2canvas: {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
    integrity: 'sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H',
    check: () => typeof window.html2canvas !== 'undefined',
  },
  jspdf: {
    url: 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
    integrity: 'sha384-JcnsjUPPylma1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk',
    check: () => typeof window.jspdf !== 'undefined',
  },
  mammoth: {
    url: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
    integrity: 'sha384-nFoSjZIoH3CCp8W639jJyQkuPHinJ2NHe7on1xvlUA7SuGfJAfvMldrsoAVm6ECz',
    check: () => typeof window.mammoth !== 'undefined',
  },
  pdfjs: {
    url: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js',
    integrity: 'sha384-/1qUCSGwTur9vjf/z9lmu/eCUYbpOTgSjmpbMQZ1/CtX2v/WcAIKqRv+U1DUCG6e',
    check: () => typeof window.pdfjsLib !== 'undefined',
    onload: () => {
      if (window.pdfjsLib) {
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
      }
    },
  },
  pptxgenjs: {
    url: 'https://cdn.jsdelivr.net/npm/pptxgenjs@3.12.0/dist/pptxgen.bundle.js',
    integrity: 'sha384-Cck14aA9cifjYolcnjebXRfWGkz5ltHMBiG4px/j8GS+xQcb7OhNQWZYyWjQ+UwQ',
    check: () => typeof window.PptxGenJS !== 'undefined',
  },
};

const _libPromises = {};

function loadLib(name) {
  const lib = _LIBS[name];
  if (!lib) return Promise.reject(new Error('Unknown lib: ' + name));
  if (lib.check()) return Promise.resolve();
  if (_libPromises[name]) return _libPromises[name];

  _libPromises[name] = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = lib.url;
    s.integrity = lib.integrity;
    s.crossOrigin = 'anonymous';
    s.onload = () => {
      if (lib.onload) lib.onload();
      resolve();
    };
    s.onerror = () =>
      reject(new Error('No se pudo cargar ' + name + '. Verifica tu conexión.'));
    document.head.appendChild(s);
  });
  return _libPromises[name];
}
