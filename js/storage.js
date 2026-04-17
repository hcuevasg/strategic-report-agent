// ============================================================
// STORAGE — centralized localStorage access and data hygiene
// ============================================================

function readStorageJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function writeStorageJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function removeStorageItem(key) {
  localStorage.removeItem(key);
}

function getStatsToken() {
  const token = localStorage.getItem('alto_stats_token') || '';
  return token.trim();
}

function setStatsToken(token) {
  localStorage.setItem('alto_stats_token', String(token || '').trim());
}

function clearStatsToken() {
  localStorage.removeItem('alto_stats_token');
}
