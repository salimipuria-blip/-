/* POORS · ALGORITHME 3000 service worker.
 * Security rules:
 *  - /api/* is never intercepted (the browser handles it directly, never cached).
 *  - Requests carrying credentials or an Authorization header are never intercepted.
 *  - Only GET, same-origin requests are considered at all.
 *  - Only the public shell is precached; /assets/ images use a size-capped cache.
 */
const VERSION = 'v1';
const SHELL_CACHE = 'poors-shell-' + VERSION;
const ASSET_CACHE = 'poors-assets-' + VERSION;
const ASSET_LIMIT = 40;
const OFFLINE_URL = '/offline.html';
const SHELL = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/engine-ui.js',
  '/engine-ui.css',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
  '/icons/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => cache.addAll(SHELL.map((u) => new Request(u, { cache: 'reload', credentials: 'omit' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const keep = new Set([SHELL_CACHE, ASSET_CACHE]);
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('poors-') && !keep.has(k)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isCacheable(response) {
  return response && response.ok && response.type === 'basic' &&
    !/no-store|private/i.test(response.headers.get('Cache-Control') || '');
}

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

async function networkFirstNavigation(request) {
  try {
    // Navigation responses are never written to cache at runtime.
    return await fetch(request);
  } catch (err) {
    const cache = await caches.open(SHELL_CACHE);
    return (await cache.match(OFFLINE_URL)) || Response.error();
  }
}

async function cacheFirstAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  const hit = await cache.match(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (isCacheable(response)) {
    await cache.put(request, response.clone());
    trimCache(ASSET_CACHE, ASSET_LIMIT).catch(() => {});
  }
  return response;
}

async function staleWhileRevalidateShell(request) {
  const cache = await caches.open(SHELL_CACHE);
  const hit = await cache.match(request);
  const network = fetch(request).then((response) => {
    if (isCacheable(response)) cache.put(request, response.clone()).catch(() => {});
    return response;
  });
  if (hit) { network.catch(() => {}); return hit; }
  return network;
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Never touch the API: return early so the browser performs the request itself.
  if (url.pathname === '/api' || url.pathname.startsWith('/api/')) return;
  // Never touch anything carrying credentials.
  if (request.headers.has('Authorization')) return;
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') {
    // Network-only with offline fallback (nothing from a navigation is cached).
    event.respondWith(networkFirstNavigation(request));
    return;
  }
  // Subresources explicitly sent with credentials are left to the browser.
  if (request.credentials === 'include') return;
  if (url.pathname.startsWith('/assets/') && /\.(webp|png|jpe?g|gif|avif|svg)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstAsset(request));
    return;
  }
  if (!url.search && SHELL.includes(url.pathname)) {
    event.respondWith(staleWhileRevalidateShell(request));
  }
  // Anything else: not intercepted.
});
