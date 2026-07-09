const CACHE_NAME = 'admin-cache-v2';
const urlsToCache = ['index.html', 'manifest.json'];

self.addEventListener('install', event => {
    self.skipWaiting(); // Obliga al nuevo Service Worker a instalarse de inmediato
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('activate', event => {
    // Borra las cachés antiguas para que siempre veas tu código nuevo
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', event => {
    // Estrategia "Network First": Intenta buscar siempre en internet/localhost primero, si falla, usa la caché.
    event.respondWith(
        fetch(event.request).catch(() => caches.match(event.request))
    );
});