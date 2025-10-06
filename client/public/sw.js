// Morouna Loans - Service Worker
// Version 1.0.1

const CACHE_VERSION = 'morouna-v1.0.1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/manifest.json'
];

// Maximum cache size (entries)
const MAX_CACHE_SIZE = 100;

// Clean up old caches
const cleanupCaches = async () => {
  const cacheNames = await caches.keys();
  return Promise.all(
    cacheNames
      .filter(name => name !== STATIC_CACHE && name !== DYNAMIC_CACHE && name !== API_CACHE)
      .map(name => caches.delete(name))
  );
};

// Limit cache size
const limitCacheSize = async (cacheName, maxSize) => {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxSize) {
    await cache.delete(keys[0]);
    await limitCacheSize(cacheName, maxSize);
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    cleanupCaches()
      .then(() => self.clients.claim())
      .then(() => console.log('[SW] Service worker activated'))
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip chrome extensions and other protocols
  if (!url.protocol.startsWith('http')) return;

  // Strategy 1: Network-first for API calls (fresh data when online)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          // Cache successful API responses
          if (response.ok) {
            const cache = await caches.open(API_CACHE);
            cache.put(request, response.clone());
            await limitCacheSize(API_CACHE, 50);
          }
          return response;
        })
        .catch(async () => {
          // Fallback to cache if offline
          const cached = await caches.match(request);
          if (cached) {
            return cached;
          }
          // Return offline response for API calls
          return new Response(
            JSON.stringify({ 
              error: 'You are currently offline. Some features may be unavailable.' 
            }),
            { 
              status: 503,
              headers: { 'Content-Type': 'application/json' }
            }
          );
        })
    );
    return;
  }

  // Strategy 2: Cache-first for static assets (fast loading)
  if (
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|gif|webp|woff2?|ttf|eot)$/) ||
    url.pathname.includes('/icons/') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) {
            return cached;
          }
          return fetch(request)
            .then(async (response) => {
              if (response.ok) {
                const cache = await caches.open(STATIC_CACHE);
                cache.put(request, response.clone());
              }
              return response;
            });
        })
    );
    return;
  }

  // Strategy 3: Network-first with cache fallback for HTML pages
  event.respondWith(
    fetch(request)
      .then(async (response) => {
        if (response.ok) {
          const cache = await caches.open(DYNAMIC_CACHE);
          cache.put(request, response.clone());
          await limitCacheSize(DYNAMIC_CACHE, MAX_CACHE_SIZE);
        }
        return response;
      })
      .catch(async () => {
        // Try cache first
        const cached = await caches.match(request);
        if (cached) {
          return cached;
        }
        
        // Fallback to offline page for navigation requests
        if (request.mode === 'navigate') {
          const offlinePage = await caches.match('/offline.html');
          if (offlinePage) {
            return offlinePage;
          }
        }
        
        // Final fallback
        return new Response('Offline - Content not available', {
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        });
      })
  );
});

// Listen for messages from the client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      cleanupCaches()
        .then(() => {
          return self.clients.matchAll();
        })
        .then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        })
    );
  }
});

// Background sync for offline actions (if supported)
if ('sync' in self.registration) {
  self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);
    
    if (event.tag === 'sync-data') {
      event.waitUntil(
        // Implement background sync logic here
        Promise.resolve()
      );
    }
  });
}

console.log('[SW] Service worker loaded - Morouna Loans PWA');
