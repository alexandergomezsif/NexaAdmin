// ============================================================
// NexaAdmin Service Worker — red primero para la aplicación, caché como respaldo offline
// Cambie APP_VERSION en cada publicación para invalidar la caché.
// ============================================================

const APP_VERSION = '3.4.0';
const CACHE_NAME = `nexaadmin-${APP_VERSION}`;

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
  './icons/nexa-corp-light.png',
  './icons/nexa-corp-dark.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE_ASSETS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n.startsWith('nexaadmin-') && n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

// Red primero: siempre se usa la versión más reciente si hay conexión;
// sin conexión se sirve la última copia guardada.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('./index.html') : undefined)))
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
