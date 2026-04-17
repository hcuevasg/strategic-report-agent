// ============================================================
// Validation helpers for Worker payloads and AI responses
// ============================================================

const ALLOWED_REPORT_TYPES = new Set([
  'strategic',
  'financial',
  'operational',
  'risk',
  'competitive',
  'due_diligence',
  'general',
  'minuta',
  'multisource_contrast',
]);

const ALLOWED_OUTPUT_LANGUAGES = new Set(['auto', 'es', 'en', 'pt', 'fr', 'de']);

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function validateRequestBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Invalid request payload';
  }

  if (body.userContent === '__CHAT_MODE__') {
    if (!Array.isArray(body.chatMessages) || body.chatMessages.length === 0) {
      return 'chatMessages is required for chat mode';
    }
    return null;
  }

  if (body.userContent === '__PPTX_MODE__') {
    if (!isNonEmptyString(body.reportJSON)) {
      return 'reportJSON is required for PPTX mode';
    }
    return null;
  }

  if (!isNonEmptyString(body.userContent)) {
    return 'userContent is required';
  }

  if (body.reportType && !ALLOWED_REPORT_TYPES.has(body.reportType)) {
    return 'Unsupported reportType';
  }

  if (body.outputLanguage && !ALLOWED_OUTPUT_LANGUAGES.has(body.outputLanguage)) {
    return 'Unsupported outputLanguage';
  }

  if (body.images !== undefined) {
    if (!Array.isArray(body.images)) {
      return 'images must be an array';
    }
    const invalidImage = body.images.find(
      image =>
        !image ||
        typeof image !== 'object' ||
        !isNonEmptyString(image.media_type) ||
        !isNonEmptyString(image.data)
    );
    if (invalidImage) {
      return 'Invalid images payload';
    }
  }

  return null;
}

export function validateWhatsAppReport(report) {
  if (!report || typeof report !== 'object' || Array.isArray(report)) {
    return false;
  }

  if (!isNonEmptyString(report.title) || !isNonEmptyString(report.executive_summary)) {
    return false;
  }

  if (!Array.isArray(report.key_messages)) {
    return false;
  }

  const findings = asArray(report.findings);
  const recommendations = report.recommendations || {};
  const shortTerm = asArray(recommendations.short_term);

  if (findings.some(item => !item || typeof item !== 'object' || !isNonEmptyString(item.finding))) {
    return false;
  }

  if (shortTerm.some(item => !item || typeof item !== 'object' || !isNonEmptyString(item.action))) {
    return false;
  }

  return true;
}
