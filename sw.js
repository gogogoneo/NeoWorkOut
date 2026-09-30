const CACHE_NAME = "workout-tracker-v58";
const ASSETS = ["./index.html", "./app.js", "./manifest.json", "./icon-192.png", "./icon-512.png"];
self.addEventListener("install", event => { event.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin && (url.pathname.endsWith("/app.js") || url.pathname.endsWith("/index.html") || url.pathname.endsWith("/sw.js") || url.pathname.endsWith("/"))) {
    event.respondWith(fetch(req).then(res => { const clone=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,clone)); return res; }).catch(()=>caches.match(req)));
  } else {
    event.respondWith(caches.match(req).then(cached => cached || fetch(req).then(res => { const clone=res.clone(); caches.open(CACHE_NAME).then(c=>c.put(req,clone)); return res; })));
  }
});
