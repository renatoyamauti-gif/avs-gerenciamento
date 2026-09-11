const CACHE_NAME = 'avs-pwa-cache-v37';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Don't intercept Supabase API requests (handled in dbService.ts)
  if (url.hostname.includes('supabase.co') || url.pathname.includes('/api/')) {
    return;
  }

  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Cache-First strategy for hashed assets (instant load, 0 network latency)
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(js|css|svg|png|jpg|webp|woff2?)$/)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const contentType = networkResponse.headers.get('content-type') || '';
            // Critical: Never cache an HTML SPA fallback response for a .js/.css asset!
            if (!contentType.includes('text/html')) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Network-First strategy for HTML navigation:
  // Always fetches the latest index.html from network when online to guarantee current script chunks.
  // Falls back to cached index.html when offline.
  if (event.request.mode === 'navigate' || url.pathname === '/' || url.pathname === '/index.html') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put('/index.html', responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Default fetch for other requests
  event.respondWith(fetch(event.request));
});
