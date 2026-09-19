/* ─────────────────────────────────────────────────────────────
   sw.js — Service Worker for BantayBarangay PWA (Province of Masbate)
   Provides offline caching, fast asset loading, and network resilience.
   ───────────────────────────────────────────────────────────── */

const CACHE_NAME = 'bantay-pwa-v1.3.0';

const PRECACHE_ASSETS = [
  './mobile.html',
  './index.html',
  './auth.html',
  './manifest.json',
  './css/mobile.css?v=5.3',
  './css/resident.css?v=5.3',
  './css/auth.css?v=5.3',
  '../shared/css/common.css?v=5.3',
  './js/resident.js',
  './js/chat.js',
  '../shared/js/api.js',
  '../shared/js/reports.js',
  '../shared/js/auth.js',
  '../shared/js/ui.js',
  '../shared/js/locations.js',
  './images/logo.png',
  './images/icon-192.png',
  './images/icon-512.png',
  './images/icon-512-maskable.png'
];

/* ── 1. INSTALL EVENT: Pre-cache core app shell assets ──────── */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // Cache assets with error resilience (don't fail install if a single asset 404s)
      for (const asset of PRECACHE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (err) {
          console.warn('[SW] Could not precache:', asset, err);
        }
      }
    }).then(() => self.skipWaiting())
  );
});

/* ── 2. ACTIVATE EVENT: Clean up stale caches & claim clients ── */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

/* ── 3. FETCH EVENT: Cache-first for assets, Network-first for pages ── */
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignore non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Navigation requests (HTML pages) -> Network-first with Cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;
          // Fallback to mobile app shell
          return caches.match('./mobile.html') || caches.match('./index.html');
        })
    );
    return;
  }

  // B. Google Fonts or external static assets -> Stale-while-revalidate
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => null);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. Local static assets (CSS, JS, Images, Icons) -> Cache-first with Network update
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch in background to update cache (Stale-While-Revalidate)
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {/* Offline, silent ignore */});
        return cachedResponse;
      }

      // If not in cache, fetch from network and store
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return networkResponse;
        })
        .catch(() => {
          // If offline and request is an image, return transparent fallback or logo
          if (request.destination === 'image') {
            return caches.match('./images/logo.png');
          }
        });
    })
  );
});

/* ── 4. BACKGROUND SYNC / MESSAGE HANDLING ──────────────────── */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
