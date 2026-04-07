// ============================================================
// ALTO Strategic Report Agent — Service Worker
// Cache-first for static assets, network-only for API calls
// ============================================================

const CACHE_VERSION = 'v1';
const CACHE_NAME = `alto-reports-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/home.html',
  '/manifest.json',
  '/css/tailwind.css',
  '/css/styles.css',
  '/js/lib-loader.js',
  '/js/i18n.js',
  '/js/app.js',
  '/js/pptx-gen.js',
  '/js/exports.js',
  '/js/dashboard.js',
  '/assets/alto-logo.png',
  '/assets/alto-logo-white.png',
];

// ── Install: pre-cache static shell ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ───────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first for static, network-only for API ──────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Never cache: Worker API, CDN libs (loaded lazily), external APIs
  if (
    url.hostname.includes('workers.dev') ||
    url.hostname.includes('cdn.jsdelivr.net') ||
    url.hostname.includes('cdnjs.cloudflare.com') ||
    url.hostname.includes('fonts.googleapis.com') ||
    url.hostname.includes('fonts.gstatic.com') ||
    event.request.method !== 'GET'
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
