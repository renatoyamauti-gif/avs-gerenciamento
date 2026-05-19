const CACHE_NAME = 'avs-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple fetch handler to make it a valid PWA
  event.respondWith(
    fetch(event.request).catch(() => {
      return new Response('Offline support not fully implemented yet.');
    })
  );
});
