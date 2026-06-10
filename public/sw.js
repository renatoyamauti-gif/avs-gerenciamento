const CACHE_NAME = 'avs-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Only handle HTML navigation requests for offline support to be a valid PWA
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response('Offline support not fully implemented yet.', {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      })
    );
  }
});
