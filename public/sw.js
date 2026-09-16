// BantayBarangay PWA Service Worker - v8 (Live Update Sync Release)
// Build Timestamp: 2026-09-16T08:35:00+08:00
const CACHE_NAME = "bantay-app-v8-20260916";
const STATIC_ASSETS = [
  "/",
  "/manifest.json",
  "/globals.css",
  "/logo.png",
  "/icon-192x192.png?v=2",
  "/icon-512x512.png?v=2",
  "/apple-touch-icon.png?v=2",
  "/favicon-32x32.png?v=2",
  "/favicon-16x16.png?v=2",
  "/favicon.ico?v=2"
];

// Offline HTML fallback for uncached pages
const OFFLINE_FALLBACK_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>Offline - BantayBarangay</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background-color: #080d1a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    .card { background: #0f172a; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 24px; padding: 36px 24px; max-width: 440px; width: 100%; box-shadow: 0 20px 40px rgba(0,0,0,0.6); }
    .icon { width: 64px; height: 64px; border-radius: 20px; background: rgba(2, 132, 199, 0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 0.938rem; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 0.938rem; border: none; cursor: pointer; text-decoration: none; margin-bottom: 10px; }
    .btn-primary { background: linear-gradient(135deg, #0284c7 0%, #10b981 100%); color: #fff; }
    .btn-outline { background: transparent; border: 1px solid rgba(255, 255, 255, 0.15); color: #cbd5e1; }
    .hotline { margin-top: 20px; font-size: 0.813rem; color: #cbd5e1; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 16px; }
    .hotline a { color: #f87171; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>You're Currently Offline</h1>
    <p>BantayBarangay requires an active network connection for live updates, but you can continue viewing cached reports.</p>
    <button class="btn btn-primary" onclick="window.location.reload()">Retry Connection</button>
    <a href="/dashboard" class="btn btn-outline">Back to Home Dashboard</a>
    <div class="hotline">
      Emergency? Call Pasig Hotline: <a href="tel:0286431111">(02) 8643-1111</a> or <a href="tel:911">911</a>
    </div>
  </div>
</body>
</html>`;

// Install Event: Activate immediately
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker install non-fatal cache asset warning:", err);
      });
    })
  );
});

// Message Event: Handle user requests
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  if (event.data && event.data.type === "CLEAR_ALL_CACHES") {
    caches.keys().then((keys) => {
      return Promise.all(keys.map((k) => caches.delete(k)));
    });
  }
});

// Activate Event: Delete all older cache versions and claim clients
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[ServiceWorker] Purging stale cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event: Smart routing & caching
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Let non-GET and backend APIs pass directly through
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Handle HTML document navigation (Network-First with cache fallback)
  if (event.request.mode === "navigate" || event.request.destination === "document") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          if (cached) return cached;

          const homeCached = await caches.match("/");
          if (homeCached) return homeCached;

          return new Response(OFFLINE_FALLBACK_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // 3. Un-hashed dynamic style & manifest assets (globals.css, manifest.json)
  // Use Network-First so design updates arrive on the phone instantly!
  if (url.pathname === "/globals.css" || url.pathname === "/manifest.json") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 4. Static assets (hashed JS chunks, images, icons, fonts) - Stale-While-Revalidate
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2)$/) ||
              url.pathname.startsWith("/_next/static/"))
          ) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      // Return cached immediately if available, while updating cache in background
      return cached || fetchPromise;
    })
  );
});
