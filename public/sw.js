// Offline support: keep a copy of the app shell. Network first, so updates
// show up immediately when online; the cached copy is used when offline.
const CACHE = "grover-v6";
const SHELL = [
  "./", "index.html", "privacy.html", "styles.css", "manifest.webmanifest",
  "js/app.js", "js/audio.js", "js/vision.js", "js/speech.js", "js/coach.js",
  "js/calm.js", "js/demo.js", "js/ai.js", "js/profiles.js", "js/perception.js", "js/scene.js", "js/overlay.js",
  "icons/icon-192.png", "icons/icon-512.png", "icons/icon-180.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
