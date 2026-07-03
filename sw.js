const CACHE = "unkou-cache-v3";
const ASSETS = [
  "./", "./index.html", "./manifest.webmanifest",
  "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(ks => Promise.all(ks.map(k => k !== CACHE ? caches.delete(k) : null)))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  // ページ本体は「ネット優先」（更新をすぐ反映）。圏外ならキャッシュ。
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(r => {
        caches.open(CACHE).then(c => c.put("./index.html", r.clone()));
        return r;
      }).catch(() => caches.match("./index.html"))
    );
    return;
  }
  // 自分のファイル（アイコン等）はキャッシュ優先。
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(req).then(r => r || fetch(req).then(resp => {
        caches.open(CACHE).then(c => c.put(req, resp.clone()));
        return resp;
      }))
    );
  }
});
