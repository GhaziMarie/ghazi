const CACHE_NAME = 'adhkar-app-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/script.js',
    '/favicon.ico',
    '/manifest.json',
    // أضف مسارات جميع الأيقونات التي ذكرتها في manifest.json
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png',
    // أضف مسارات ملفات الصوت
    '/sounds/bell.mp3',
    '/sounds/chime.mp3',
    '/sounds/xylophone.mp3'
];

// تثبيت عامل الخدمة وتخزين الأصول في الذاكرة المؤقتة
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// اعتراض طلبات الشبكة وتقديم الأصول من الذاكرة المؤقتة أولاً
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

// تحديث عامل الخدمة ومسح ذاكرات التخزين المؤقت القديمة
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});