const CACHE_NAME = 'podium-rush-v1';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './worker.js',
    './core.js',
    './core.wasm',
    './modules/sound.js',
    './modules/mascots.js',
    './modules/confetti.js',
    './modules/heap_visualizer.js',
    './modules/chart.js',
    './modules/game_modes.js',
    './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.map((key) => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }
            return fetch(e.request).then((networkResponse) => {
                // Cache valid same-origin responses
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseClone = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseClone);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // Offline fallback
                if (e.request.destination === 'document') {
                    return caches.match('./index.html');
                }
            });
        })
    );
});

