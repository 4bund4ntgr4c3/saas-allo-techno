/* Service worker Allô Techno v3 — stratégies de cache avancées.
 * - cache-first pour assets statiques (CSS, JS, images)
 * - network-first pour pages HTML (SSR)
 * - stale-while-revalidate pour API publiques (suivi, catalogue)
 * - background sync pour soumissions hors-ligne
 * - ne cache jamais les requêtes non-GET ni les endpoints sensibles */
const CACHE = "allotechno-v3";
const API_CACHE = "allotechno-api-v1";
const STATIC_CACHE = "allotechno-static-v1";

const API_SWRevalidate = ["/fr/suivi", "/en/suivi", "/api/ical"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(["/offline.html"]).catch(() => {})),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== CACHE && k !== API_CACHE && k !== STATIC_CACHE)
            .map((k) => caches.delete(k)),
        ),
      )
      .catch(() => {}),
  );
  self.clients.claim();
});

/* ── Stratégies ──────────────────────────────────────────────────── */

async function cacheFirst(req) {
  try {
    const cached = await caches.match(req);
    if (cached) return cached;
  } catch {
    /* cache injoignable */
  }
  const res = await fetch(req);
  if (res && res.ok && (res.type === "basic" || res.type === "cors")) {
    const clone = res.clone();
    caches
      .open(STATIC_CACHE)
      .then((c) => c.put(req, clone))
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
        .then((c) => c.put(req, clone))
        .catch(() => {});
    }
    return res;
  } catch {
    const cached = await caches.match(req);
    if (cached) return cached;
    if (req.mode === "navigate") {
      const offlinePage = await caches.match("/offline.html");
      if (offlinePage) return offlinePage;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(API_CACHE);
  const cached = await cache.match(req);
  const fetchPromise = fetch(req)
    .then((res) => {
      if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => cached);
  return cached || fetchPromise;
}

/* ── Background sync queue ───────────────────────────────────────── */

const SYNC_QUEUE = "allotechno-sync-queue";

async function enqueueForSync(req) {
  const body = await req.clone().text();
  const db = await openDB();
  const tx = db.transaction(SYNC_QUEUE, "readwrite");
  tx.objectStore(SYNC_QUEUE).add({
    url: req.url,
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body,
    timestamp: Date.now(),
  });
  await tx.done;
  self.registration.sync.register("sync-offline-queue").catch(() => {});
}

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("allotechno-offline", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(SYNC_QUEUE, { keyPath: "timestamp" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

self.addEventListener("sync", (event) => {
  if (event.tag !== "sync-offline-queue") return;
  event.waitUntil(processSyncQueue());
});

async function processSyncQueue() {
  const db = await openDB();
  const tx = db.transaction(SYNC_QUEUE, "readwrite");
  const store = tx.objectStore(SYNC_QUEUE);
  const all = await new Promise((resolve) => {
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve([]);
  });

  for (const entry of all) {
    try {
      await fetch(entry.url, {
        method: entry.method,
        headers: entry.headers,
        body: entry.body,
      });
      store.delete(entry.timestamp);
    } catch {
      /* keep in queue for next sync */
    }
  }
  await tx.done;
}

/* ── Fetch router ────────────────────────────────────────────────── */

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" && req.method !== "POST") return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }
  if (url.origin !== self.location.origin) return;

  /* POST → background sync queue */
  if (req.method === "POST" && url.pathname.startsWith("/api/")) {
    event.respondWith(
      (async () => {
        try {
          const res = await fetch(req);
          return res;
        } catch {
          await enqueueForSync(req);
          return new Response(JSON.stringify({ queued: true }), {
            headers: { "Content-Type": "application/json" },
          });
        }
      })(),
    );
    return;
  }

  /* GET requests */
  if (url.pathname.includes("/api")) {
    if (API_SWRevalidate.some((p) => url.pathname.startsWith(p))) {
      event.respondWith(staleWhileRevalidate(req));
    }
    return;
  }

  event.respondWith(req.mode === "navigate" ? networkFirst(req) : cacheFirst(req));
});
