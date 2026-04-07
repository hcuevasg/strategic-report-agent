// ESLint flat config (ESLint v9+)
export default [
  {
    // Worker source — ES modules, no browser globals
    files: ['src/worker/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        crypto: 'readonly',
        fetch: 'readonly',
        Response: 'readonly',
        Request: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        TransformStream: 'readonly',
        ReadableStream: 'readonly',
        console: 'readonly',
        btoa: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'warn',
    },
  },
  {
    // Frontend scripts — browser globals, no modules
    files: ['js/app.js', 'js/pptx-gen.js', 'js/exports.js', 'js/dashboard.js', 'js/i18n.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly',
        FormData: 'readonly',
        Blob: 'readonly',
        TextEncoder: 'readonly',
        TextDecoder: 'readonly',
        btoa: 'readonly',
        atob: 'readonly',
        crypto: 'readonly',
        setTimeout: 'readonly',
        clearInterval: 'readonly',
        setInterval: 'readonly',
        requestAnimationFrame: 'readonly',
        localStorage: 'readonly',
        // App-level globals (shared between scripts via window)
        result: 'writable',
        ALTO: 'readonly',
        logoBase64: 'readonly',
        currentReportType: 'readonly',
        i18n: 'readonly',
        docx: 'readonly',
        html2canvas: 'readonly',
        pdfjsLib: 'readonly',
        mammoth: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-undef': 'warn',
      eqeqeq: ['error', 'always'],
    },
  },
  {
    // Ignore generated/vendor files
    ignores: ['node_modules/', '.wrangler/'],
  },
];
