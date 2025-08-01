// Service Worker for SEOTIZE - Performance Optimization
const CACHE_NAME = 'seotize-v1.2';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/login.html',
    '/register.html',
    '/blogs.html',
    '/connect.html',
    '/styles.css',
    '/utils.js',
    '/critical.css'
];

const CDN_ASSETS = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
    'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMa1ZL7.woff2',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/gsap.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/TextPlugin.min.js',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install event - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    // Skip non-GET requests and chrome-extension requests
    if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
        return;
    }

    const url = new URL(event.request.url);
    
    // Handle static assets with cache-first strategy
    if (STATIC_ASSETS.some(asset => url.pathname === asset) || 
        CDN_ASSETS.some(asset => event.request.url === asset)) {
        event.respondWith(
            caches.match(event.request).then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request).then(response => {
                    // Cache valid responses
                    if (response.status === 200) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then(cache => {
                            cache.put(event.request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
    }
    // Handle API requests with network-first strategy
    else if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request).then(response => {
                // Cache successful API responses for 5 minutes
                if (response.status === 200) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME + '-api').then(cache => {
                        cache.put(event.request, responseClone);
                        // Set expiration
                        setTimeout(() => {
                            cache.delete(event.request);
                        }, 5 * 60 * 1000); // 5 minutes
                    });
                }
                return response;
            }).catch(() => {
                // Serve from cache if network fails
                return caches.match(event.request);
            })
        );
    }
    // Handle other requests with network-first strategy
    else {
        event.respondWith(
            fetch(event.request).catch(() => {
                return caches.match(event.request);
            })
        );
    }
});