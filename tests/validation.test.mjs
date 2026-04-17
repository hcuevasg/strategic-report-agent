import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRequestBody, validateWhatsAppReport } from '../src/worker/validation.js';

test('validateRequestBody accepts normal analysis payload', () => {
  const error = validateRequestBody({
    userContent: 'Documento fuente',
    reportType: 'strategic',
    outputLanguage: 'es',
  });

  assert.equal(error, null);
});

test('validateRequestBody rejects invalid images payload', () => {
  const error = validateRequestBody({
    userContent: 'Documento fuente',
    reportType: 'strategic',
    images: [{ media_type: 'image/png' }],
  });

  assert.equal(error, 'Invalid images payload');
});

test('validateWhatsAppReport enforces minimal structure', () => {
  assert.equal(
    validateWhatsAppReport({
      title: 'Reporte',
      executive_summary: 'Resumen',
      key_messages: ['uno'],
      findings: [{ finding: 'Hallazgo', business_implication: 'Impacto' }],
      recommendations: { short_term: [{ action: 'Accion', rationale: 'Porque' }] },
    }),
    true
  );

  assert.equal(validateWhatsAppReport({ title: 'Incompleto' }), false);
});
