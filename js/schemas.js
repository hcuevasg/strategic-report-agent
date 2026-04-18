// ============================================================
// SCHEMAS — lightweight validators for AI JSON responses
// ============================================================

function isObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function cloneData(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertString(value, label, issues, required = true) {
  if (value === null || value === undefined || value === '') {
    if (required) issues.push(label + ' is required');
    return;
  }
  if (typeof value !== 'string') issues.push(label + ' must be a string');
}

function assertArray(value, label, issues) {
  if (!Array.isArray(value)) issues.push(label + ' must be an array');
}

const CONTENT_PLACEHOLDER_TOKENS = [
  'test',
  'tbd',
  'lorem',
  'ipsum',
  'xxx',
  'n/a',
  'na',
  'pendiente',
  'por definir',
  'por completar',
  'por llenar',
  'dummy',
  'sample',
  'ejemplo',
];

const CONTRASTE_INSUFFICIENT_PHRASES = [
  'insumo insuficiente',
  'documento fuente esta incompleto',
  'no contiene informacion analizable',
  'marcadores de posicion',
  'marcador de posicion',
  'no puede ser completado',
  'bloqueo es exclusivamente de contenido',
];

function normalizeContentText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function hasPlaceholderContent(value) {
  const text = normalizeContentText(value);
  if (!text) return false;
  if (/^x{3,}$/i.test(text.replace(/\s+/g, ''))) return true;
  return CONTENT_PLACEHOLDER_TOKENS.some(token => text === token || text.includes(token));
}

function isMeaningfulContent(value, minLength = 20) {
  const raw = String(value || '').trim();
  if (raw.length < minLength) return false;
  if (hasPlaceholderContent(raw)) return false;
  const words = raw.split(/\s+/).filter(Boolean);
  return words.length >= 4;
}

function isMeaningfulTitle(value) {
  const raw = String(value || '').trim();
  if (raw.length < 6) return false;
  if (hasPlaceholderContent(raw)) return false;
  const words = raw.split(/\s+/).filter(Boolean);
  return words.length >= 2;
}

function isInsufficientContraste(payload) {
  const title = normalizeContentText(payload?.title);
  const summary = normalizeContentText(payload?.executive_summary || payload?.summary);
  return CONTRASTE_INSUFFICIENT_PHRASES.some(
    phrase => title.includes(phrase) || summary.includes(phrase)
  );
}

function validateReportShape(report) {
  const issues = [];
  if (!isObject(report)) return ['Report must be an object'];
  assertString(report.title, 'title', issues);
  assertString(report.executive_summary, 'executive_summary', issues);
  assertArray(report.key_messages, 'key_messages', issues);
  assertArray(report.findings, 'findings', issues);
  assertArray(report.analysis_blocks, 'analysis_blocks', issues);

  if (!isObject(report.recommendations)) {
    issues.push('recommendations must be an object');
  } else {
    ['short_term', 'medium_term', 'long_term'].forEach(key => {
      if (
        report.recommendations[key] !== null &&
        report.recommendations[key] !== undefined &&
        !Array.isArray(report.recommendations[key])
      ) {
        issues.push('recommendations.' + key + ' must be an array');
      }
    });
  }
  return issues;
}

function validateMinutaShape(minuta) {
  const issues = [];
  if (!isObject(minuta)) return ['Minuta must be an object'];
  assertString(minuta.title, 'title', issues);
  assertArray(minuta.decisions || [], 'decisions', issues);
  assertArray(minuta.commitments || [], 'commitments', issues);
  assertArray(minuta.key_topics || [], 'key_topics', issues);
  assertString(minuta.summary, 'summary', issues);
  return issues;
}

function validateSlidesShape(payload) {
  const issues = [];
  if (!isObject(payload)) return ['Slides payload must be an object'];
  if (!Array.isArray(payload.slides) || payload.slides.length < 3) {
    issues.push('slides must be a non-empty array');
  }
  return issues;
}

function validateContrasteShape(payload) {
  const issues = [];
  if (!isObject(payload)) return ['Contraste payload must be an object'];
  assertString(payload.title, 'title', issues);
  assertString(payload.executive_summary || payload.summary, 'summary', issues);
  if (issues.length) return issues;

  if (isInsufficientContraste(payload)) {
    issues.push(
      'El contraste no se genero porque el insumo estaba incompleto o contenia placeholders como TEST.'
    );
  }
  return issues;
}

function validateByKind(kind, payload) {
  if (kind === 'report') return validateReportShape(payload);
  if (kind === 'minuta') return validateMinutaShape(payload);
  if (kind === 'slides') return validateSlidesShape(payload);
  if (kind === 'contraste') return validateContrasteShape(payload);
  return [];
}

function repairLikelyJson(rawText) {
  const input = String(rawText || '');
  let out = '';
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (inString) {
      if (escaped) {
        out += ch;
        escaped = false;
        continue;
      }
      if (ch === '\\') {
        out += ch;
        escaped = true;
        continue;
      }
      if (ch === '\n') {
        out += '\\n';
        continue;
      }
      if (ch === '\r') continue;
      if (ch === '\t') {
        out += '\\t';
        continue;
      }
      if (ch === '"') {
        const nextNonWhitespace = input.slice(i + 1).match(/\S/);
        const nextChar = nextNonWhitespace ? nextNonWhitespace[0] : '';
        if (!nextChar || ',}]'.includes(nextChar) || nextChar === ':') {
          inString = false;
          out += ch;
        } else {
          out += '\\"';
        }
        continue;
      }
      out += ch;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    out += ch;
  }

  if (inString) out += '"';
  out = out.replace(/,\s*([}\]])/g, '$1');

  const openArrays = (out.match(/\[/g) || []).length;
  const closeArrays = (out.match(/\]/g) || []).length;
  const openObjects = (out.match(/\{/g) || []).length;
  const closeObjects = (out.match(/\}/g) || []).length;
  if (closeArrays < openArrays) out += ']'.repeat(openArrays - closeArrays);
  if (closeObjects < openObjects) out += '}'.repeat(openObjects - closeObjects);

  return out;
}

function parseModelJSON(kind, rawText) {
  const clean = String(rawText || '')
    .replace(/```json|```/g, '')
    .trim();
  let parsed;
  try {
    parsed = JSON.parse(clean);
  } catch (err) {
    try {
      parsed = JSON.parse(repairLikelyJson(clean));
    } catch (_repairErr) {
      if (
        err instanceof SyntaxError &&
        (err.message.includes('Unexpected end of JSON input') ||
          err.message.includes('Unterminated string in JSON'))
      ) {
        throw new Error(
          'La respuesta del modelo llego incompleta o mal cerrada. Intenta generar el informe nuevamente.'
        );
      }
      throw err;
    }
  }
  const issues = validateByKind(kind, parsed);
  if (issues.length) throw new Error(issues[0]);
  return parsed;
}
