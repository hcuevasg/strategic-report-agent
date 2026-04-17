// ============================================================
// Security — Auth, CORS, input sanitization, session tokens
// ============================================================

const TOKEN_TTL_SECONDS = 7200; // 2 hours

function getSessionSecret(env) {
  return env.SESSION_TOKEN_SECRET || env.ANTHROPIC_API_KEY;
}

// ── Input sanitization — strip prompt injection patterns ─────
export function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return text;
  const injectionPatterns = [
    /\bignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)\b/gi,
    /\byou\s+are\s+now\b/gi,
    /\bsystem\s*:\s*/gi,
    /\b(act|behave|pretend|respond)\s+as\b/gi,
    /\bnew\s+instructions?\s*:/gi,
    /\boverride\s+(system|instructions?|rules?)\b/gi,
    /<\/?system[^>]*>/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
    /<<\s*SYS\s*>>/gi,
    /<<\s*\/SYS\s*>>/gi,
  ];
  let sanitized = text;
  for (const pat of injectionPatterns) {
    sanitized = sanitized.replace(pat, '[filtered]');
  }
  return sanitized;
}

// ── Security headers ─────────────────────────────────────────
export function securityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };
}

function normalizeAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || '*')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function originMatchesRule(requestOrigin, allowedOrigin) {
  if (!requestOrigin || !allowedOrigin) return false;
  if (allowedOrigin === '*') return true;

  let requestUrl;
  let allowedUrl;
  try {
    requestUrl = new URL(requestOrigin);
    allowedUrl = new URL(allowedOrigin);
  } catch {
    return requestOrigin === allowedOrigin || requestOrigin.startsWith(allowedOrigin);
  }

  if (requestUrl.protocol !== allowedUrl.protocol) return false;
  if (requestUrl.host === allowedUrl.host) return true;

  return requestUrl.hostname.endsWith(`.${allowedUrl.hostname}`);
}

export function isAllowedOrigin(env, requestOrigin) {
  const allowed = normalizeAllowedOrigins(env);
  return allowed.some(origin => originMatchesRule(requestOrigin, origin));
}

// ── CORS — returns only the matched origin, not the full list ─
export function corsHeaders(env, requestOrigin) {
  const allowedRaw = env.ALLOWED_ORIGIN || '*';
  let origin = '*';

  if (allowedRaw !== '*' && requestOrigin) {
    origin = isAllowedOrigin(env, requestOrigin) ? requestOrigin : 'null';
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-App-Token, Authorization',
    'Access-Control-Max-Age': '86400',
    ...(origin !== '*' ? { Vary: 'Origin' } : {}),
  };
}

// ── JSON response helper ─────────────────────────────────────
export function jsonResponse(status, body, env, requestOrigin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...securityHeaders(),
      ...corsHeaders(env, requestOrigin),
    },
  });
}

// ── Twilio signature validation ──────────────────────────────
export async function validateTwilioSignature(request, env) {
  const signature = request.headers.get('X-Twilio-Signature');
  if (!signature) return false;

  const authToken = env.TWILIO_AUTH_TOKEN;
  if (!authToken) return false;

  const url = new URL(request.url);
  const fullUrl = url.origin + url.pathname;

  const formData = await request.clone().formData();
  const params = {};
  for (const [key, value] of formData.entries()) {
    params[key] = value;
  }
  const sortedKeys = Object.keys(params).sort();
  let dataStr = fullUrl;
  for (const key of sortedKeys) {
    dataStr += key + params[key];
  }

  const encoder = new TextEncoder();
  const keyData = encoder.encode(authToken);
  const msgData = encoder.encode(dataStr);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));

  if (computed.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < computed.length; i++) {
    mismatch |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

// ── Session token generation (HMAC-based, IP-bound, time-limited) ──
export async function generateSessionToken(ip, env) {
  const secret = getSessionSecret(env);
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `${ip}:${timestamp}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const hmac = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
  return `${timestamp}.${hmac}`;
}

// ── Session token validation ─────────────────────────────────
export async function validateSessionToken(token, ip, env) {
  if (!token || !token.includes('.')) return false;
  const [tsStr, hmac] = token.split('.');
  const timestamp = parseInt(tsStr, 10);
  if (isNaN(timestamp)) return false;

  const now = Math.floor(Date.now() / 1000);
  if (now - timestamp > TOKEN_TTL_SECONDS) return false;

  const secret = getSessionSecret(env);
  const payload = `${ip}:${timestamp}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  const expected = [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');

  if (expected.length !== hmac.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ hmac.charCodeAt(i);
  }
  return mismatch === 0;
}
