
const CACHE_NAME = 'muza-aura-os-v3'; // Changed to v3
const RUNTIME_CACHE = 'muza-runtime-v3'; // Changed to v3

// All the assets that should be cached on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/metadata.json', // Added metadata.json
  '/icon-192.png',
  '/icon-512.png'
  // Add other critical assets here if they are not picked up by runtime caching
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache, adding static assets...');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!currentCaches.includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;

  // Network-first for HTML navigation to get latest version
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          // If response is good, clone it and cache it.
          if (response.ok) {
            const resClone = response.clone();
            caches.open(RUNTIME_CACHE).then(cache => {
              cache.put(request, resClone);
            });
          }
          return response;
        })
        .catch(() => caches.match(request)) // On failure, serve from cache
    );
    return;
  }

  // Cache-first for other assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseToCache);
        });

        return response;
      });
    })
  );
});