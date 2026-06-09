const CACHE_NAME = "focusbridge21-v1-0-release-hub";
const APP_SHELL = [
  "./",
  "./index.html",
  "./404.html",
  "./manifest.webmanifest",
  "./docs/index.html",
  "./docs/styles.css",
  "./docs/upgrade.css",
  "./docs/pwa-coach.css",
  "./docs/pattern-lab.css",
  "./docs/fb21-v06-lab.css",
  "./docs/fb21-v07-masterylab.css",
  "./docs/fb21-v08-guidancelab.css",
  "./docs/fb21-v09-audiolab.css",
  "./docs/fb21-v10-releasehub.css",
  "./docs/fb21-react.js",
  "./docs/fb21-pwa-coach.js",
  "./docs/fb21-pattern-lab.js",
  "./docs/fb21-v06-lab.js",
  "./docs/fb21-v07-masterylab.js",
  "./docs/fb21-v08-guidancelab.js",
  "./docs/fb21-v09-audiolab.js",
  "./docs/fb21-v10-releasehub.js",
  "./docs/icon.svg",
  "./docs/FocusBridge21_Master_Spec_v0.2.md",
  "https://unpkg.com/react@18/umd/react.production.min.js",
  "https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.allSettled(APP_SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy));
          return response;
        })
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((cached) => cached || fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      }))
      .catch(() => caches.match("./index.html"))
  );
});
