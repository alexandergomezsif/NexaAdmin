// ============================================================
// NexaAdmin Service Worker — Cache-First Strategy
// Version: 2.6.1-pwa
// ============================================================

const CACHE_NAME = 'nexaadmin-v2.6.1';

// Recursos a pre-cachear al instalar el SW
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './js/bundle.js',
  './css/variables.css',
  './css/themes.css',
  './css/layout.css',
  './css/components.css',
  './css/utilities.css',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

// == INSTALL: pre-cachear todos los assets principales ==
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando NexaAdmin PWA...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-cacheando assets...');
      return Promise.allSettled(
        PRECACHE_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] No se pudo cachear:', url, err.message);
          })
        )
      );
    }).then(() => {
      console.log('[SW] Instalacion completada.');
      return self.skipWaiting();
    })
  );
});

// == ACTIVATE: limpiar caches viejos ==
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando NexaAdmin PWA...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Eliminando cache antiguo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[SW] Activacion completada.');
      return self.clients.claim();
    })
  );
});

// == FETCH: Cache-First con Network Fallback ==
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  // No interceptar requests que no sean http/https
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Cache hit -> actualizar en background
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Cache miss -> ir a la red
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
          return networkResponse;
        }
        const responseClone = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return networkResponse;
      }).catch(() => {
        // Sin red y sin cache -> pagina principal como fallback
        return caches.match('./index.html');
      });
    })
  );
});

// == MESSAGE: forzar actualizacion desde la app ==
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('[SW] NexaAdmin Service Worker cargado v2.6.1-pwa');
