const CACHE_NAME = 'mallsound-pwa-v58';
const AUDIO_CACHE_NAME = 'mallsound-audio-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
];

// ============================================================
// INSTALL: Pre-cache shell assets
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ============================================================
// ACTIVATE: Clean up old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key !== AUDIO_CACHE_NAME) {
              return caches.delete(key);
            }
            return Promise.resolve();
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH: Handle all network requests
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // --- 1. Audio proxy requests: Cache-first with network fallback ---
  // Cache iTunes/mzstatic audio previews so they keep playing offline
  if (
    url.pathname.startsWith('/api/music/audio-proxy') ||
    url.hostname.includes('mzstatic.com') ||
    url.hostname.includes('itunes.apple.com')
  ) {
    event.respondWith(
      caches.open(AUDIO_CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            // Only cache audio responses up to 15MB to avoid storage overflow
            const contentLength = networkResponse.headers.get('content-length');
            const size = contentLength ? parseInt(contentLength, 10) : 0;
            if (size === 0 || size < 15 * 1024 * 1024) {
              cache.put(request, networkResponse.clone());
            }
          }
          return networkResponse;
        } catch {
          // Return cached if network fails
          return cached || new Response('Audio unavailable offline', { status: 503 });
        }
      })
    );
    return;
  }

  // --- 2. API routes: Network only (dynamic data) ---
  if (url.pathname.startsWith('/api/')) return;

  // --- 3. Static app assets: Network first, then cache ---
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || caches.match('/index.html'))
      )
  );
});

// ============================================================
// MESSAGE: Handle messages from the main app
// ============================================================
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_AUDIO_CACHE') {
    caches.delete(AUDIO_CACHE_NAME);
  }
});
