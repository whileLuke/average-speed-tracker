const CACHE_NAME = 'speed-tracker-v1';
const APP_SHELL = [
  '/', '/index.html', '/manifest.json',
  // Add other local assets here if you change names
];

// Install: cache app shell
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(k => (k !== CACHE_NAME) ? caches.delete(k) : Promise.resolve())
    ))
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network fallback
self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);
  // Use cache-first for same-origin GETs
  if (evt.request.method === 'GET') {
    evt.respondWith(
      caches.match(evt.request).then(cached => {
        if (cached) return cached;
        return fetch(evt.request).then(response => {
          // Only cache same-origin responses (avoid caching leafet tiles)
          if (response && response.status === 200 && url.origin === location.origin) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(evt.request, copy));
          }
          return response;
        }).catch(()=> {
          return new Response('', {status: 503, statusText: 'Offline'});
        });
      })
    );
  }
});
