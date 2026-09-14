// BantayBarangay PWA Service Worker - v4 (Production Release)
const CACHE_NAME = "bantay-app-v4";
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
    body { background-color: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 24px; padding: 36px 24px; max-width: 440px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    .icon { width: 64px; height: 64px; border-radius: 20px; background: rgba(2, 132, 199, 0.15); color: #38bdf8; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; font-size: 28px; }
    h1 { font-size: 1.5rem; font-weight: 800; margin-bottom: 8px; }
    p { color: #94a3b8; font-size: 0.938rem; line-height: 1.5; margin-bottom: 24px; }
    .btn { display: inline-flex; align-items: center; justify-content: center; width: 100%; padding: 14px; border-radius: 14px; font-weight: 700; font-size: 0.938rem; border: none; cursor: pointer; text-decoration: none; margin-bottom: 10px; }
    .btn-primary { background: #0284c7; color: #fff; }
    .btn-outline { background: transparent; border: 1px solid #475569; color: #cbd5e1; }
    .hotline { margin-top: 20px; font-size: 0.813rem; color: #cbd5e1; border-top: 1px solid #334155; padding-top: 16px; }
    .hotline a { color: #f87171; font-weight: 700; text-decoration: none; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>You're Currently Offline</h1>
    <p>BantayBarangay requires an internet connection to load new pages, but you can continue viewing cached reports and draft new issues offline.</p>
    <button class="btn btn-primary" onclick="window.location.reload()">Retry Connection</button>
    <a href="/dashboard" class="btn btn-outline">Back to Home Dashboard</a>
    <div class="hotline">
      Emergency? Call Pasig Hotline: <a href="tel:0286431111">(02) 8643-1111</a> or <a href="tel:911">911</a>
    </div>
  </div>
</body>
</html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache app shell assets
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn("Service worker install non-fatal cache asset warning:", err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // 1. Let non-GET and backend APIs pass directly through
  if (event.request.method !== "GET" || url.pathname.startsWith("/api/")) {
    return;
  }

  // 2. Handle HTML document navigation (network-first with cache & offline fallback)
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

          // Try fallback to root dashboard or offline fallback page
          const homeCached = await caches.match("/");
          if (homeCached) return homeCached;

          return new Response(OFFLINE_FALLBACK_HTML, {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
        })
    );
    return;
  }

  // 3. Handle static assets (images, icons, styles, scripts) - Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        if (response && response.status === 200 && (url.pathname.match(/\.(png|jpg|jpeg|svg|ico|css|js|woff2)$/) || url.pathname.startsWith("/_next/static/"))) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Return blank or cached default if asset unavailable offline
        return cached || new Response("", { status: 408 });
      });
    })
  );
});
