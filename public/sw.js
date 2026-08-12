const CACHE_NAME = 'tp-flame-cache-v2';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json',
        '/icon-192.svg',
        '/icon-512.svg'
      ]).catch(() => {
        // Ignore precache errors if specific assets missing
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event - claim clients to control all open tabs immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network-first with cache fallback for full offline support
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') return;

  // Don't intercept Google Apps Script or WhatsApp external requests
  if (event.request.url.includes('script.google.com') || event.request.url.includes('api.whatsapp.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        // If network request succeeds, clone and store in cache for offline fallback
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        // Network failed (offline), try exact match first
        const cachedResponse = await caches.match(event.request);
        if (cachedResponse) {
          return cachedResponse;
        }

        // If HTML page navigation request and offline, return cached root/index.html
        if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
          const rootCache = await caches.match('/');
          if (rootCache) return rootCache;
          const indexCache = await caches.match('/index.html');
          if (indexCache) return indexCache;
        }

        return new Response('Offline - Conteúdo em cache não encontrado', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({ 'Content-Type': 'text/plain; charset=utf-8' })
        });
      })
  );
});

