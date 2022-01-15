var CACHE_NAME = 'LOCALIO_CACHE';

var jsFiles = [
    '/js/app.js',
    '/js/chat.js',
    '/js/connection.js',
    '/js/crypto.js',
    '/js/deviceName.js',
    '/js/navigation.js',
    '/js/qrcode.js',
    '/js/qrscanner.js',
    '/js/sound.js',
    '/js/upload.js',
    '/js/webrtc.js'
];

var externalFiles = [
    '/external/scanner/all.js',
    '/external/scanner/all.wasm',
    '/external/scanner/helper.js',
    '/external/sdp-transform/grammar.js',
    '/external/sdp-transform/index.js',
    '/external/sdp-transform/parser.js',
    '/external/sdp-transform/writer.js',
    '/external/ggwave.min.js',
    '/external/qrcodegen.js',
    '/external/scannerWorker.js',
    '/external/ua-parser.min.js',
    '/external/webrtc-ips.js'
];

var icons = [
    'icons/localio.png',
    'icons/favicon.ico',
    'icons/favicon-32x32.png',
    'icons/favicon-16x16.png',
    'icons/android-chrome-192x192.png',
    'icons/android-chrome-144x144.png',
    'icons/favicon-194x194.png',
];

var urlsToCache = [
    '/',
    '/index.html',
    'site.webmanifest',
    '/css/style.css',
    ...jsFiles,
    ...externalFiles,
    ...icons
];

self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {
                // Cache hit - return response
                if (response) {
                    return response;
                }
            }
            )
    );
});
// Install the service worker and open the cache and add files mentioned in array to cache
self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Listens to request from application.
self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request)
            .then(function (response) {

                if (response) {
                    console.log(response);
                    // The requested file exists in cache so we return it from cache.
                    return response;
                }

                // The requested file is not present in cache so we send it forward to the internet
                return fetch(event.request);
            }
            )
    );
});


self.addEventListener('activate', function (event) {
    var cacheWhitelist = []; // add cache names which you do not want to delete
    cacheWhitelist.push(CACHE_NAME);
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cacheName) {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});