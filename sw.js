const CACHE_NAME = 'quicksend-v1';
const ASSETS = [
    './receive.html',
    './webapp.webmanifest',
    './icons/icon128.png',
    './config.js',
    './libs/supabase.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
