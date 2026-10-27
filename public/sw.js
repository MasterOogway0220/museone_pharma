// MuseOne Pharma service worker: lets the till page open with no internet.
// Only two things are cached:
//  - /_next/static/*  (content-hashed build files): cache first
//  - the till page /t/<slug>: network first, cached copy when offline
// API calls and every other page always go to the network.
const CACHE = "museone-v1";
const TILL_PAGE = /^\/t\/[a-z0-9-]+\/?$/;

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  if (req.mode === "navigate" && TILL_PAGE.test(url.pathname)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          // Don't cache a redirect to the login page.
          if (res.ok && !res.redirected) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(url.pathname, copy));
          }
          return res;
        })
        .catch(() => caches.match(url.pathname).then((hit) => hit || Response.error())),
    );
  }
});
