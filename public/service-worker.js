// A deliberately narrow shell cache, not a copy of the language-learning corpus.
// Online navigation and app-shell assets are always fetched before cache fallback.
// To intentionally replace precached resources offline, increment CACHE_VERSION.
const CACHE_VERSION = "v1";
const CACHE_PREFIX = "metkagram-shell-";
const CACHE_NAME = CACHE_PREFIX + CACHE_VERSION;
const HOME_ROUTES = new Set(["/en/", "/ru/"]);
const SHELL_ASSETS = new Set([
  "/assets/app.js",
  "/assets/styles.css",
  "/assets/icons/metkagram-icon-192x192.png",
  "/assets/icons/metkagram-icon-512x512.png",
  "/assets/icons/metkagram-icon-180x180.png"
]);
const OFFLINE_PAGE = "/offline.html";
const PRECACHE = [OFFLINE_PAGE, ...HOME_ROUTES, ...SHELL_ASSETS];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)));
  // Do not skipWaiting: existing tabs should finish with their existing worker.
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallback) {
  const pathname = new URL(request.url).pathname;
  try {
    const response = await fetch(request, { cache: "no-cache" });
    if (response.ok && response.type === "basic" &&
        (HOME_ROUTES.has(pathname) || SHELL_ASSETS.has(pathname))) {
      // A storage error must never turn a successful online request into a failure.
      const copy = response.clone();
      try {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(pathname, copy);
      } catch {
        // Quota/storage restrictions affect offline fallback, not live navigation.
      }
    }
    return response;
  } catch {
    const cached = await caches.match(pathname);
    return cached || (fallback ? await caches.match(fallback) : null) || Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Never cache arbitrary learning pages, APIs, datasets, or user progress.
    // An uncached route gets an explicit noindex offline message instead.
    event.respondWith(networkFirst(request, OFFLINE_PAGE));
  } else if (SHELL_ASSETS.has(url.pathname)) {
    event.respondWith(networkFirst(request));
  }
});
