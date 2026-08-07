/* Service worker minimaliste d'Allô Techno — cache-first pour les assets
 * statiques, réseau d'abord pour les pages (HTML SSR). Défensif : ne doit
 * jamais casser l'application. Les requêtes non-GET ou /api ne sont jamais
 * mises en cache. */
const CACHE = "allotechno-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .catch(() => {}),
  );
  self.clients.claim();
});

async function cacheFirst(req) {
  try {
    const cached = await caches.match(req);
    if (cached) return cached;
  } catch {
    /* cache injoignable : on passe au réseau */
  }
  const res = await fetch(req);
  if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
    const clone = res.clone();
    caches
      .open(CACHE)
      .then((cache) => cache.put(req, clone))
      .catch(() => {});
  }
  return res;
}

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res && res.ok) {
      const clone = res.clone();
      caches
        .open(CACHE)
        .then((cache) => cache.put(req, clone))
        .catch(() => {});
    }
    return res;
  } catch {
    return (await caches.match(req)) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (url.pathname.includes("/api")) return;
  event.respondWith(req.mode === "navigate" ? networkFirst(req) : cacheFirst(req));
});
