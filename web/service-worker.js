/* Generated manifest values bind this worker to one complete production build. */
const CACHE_NAME = 'nato-shell-v1-{{BUILD_ID}}';
const RESOURCES = {{RESOURCES}};
const ROUTES = {{ROUTES}};
const paths = new Set(RESOURCES.map(resource => resource.url));

async function prepareShell() {
      // Verify every response before publishing this cache. A partial upload or
      // interrupted installation must never replace a working offline shell.
      const responses = await Promise.all(RESOURCES.map(async resource => {
        const response = await fetch(resource.url, { cache: 'no-store', redirect: 'error' });
        if (!response.ok) throw new Error('Offline resource unavailable');
        const bytes = await response.clone().arrayBuffer();
        const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
          .map(byte => byte.toString(16).padStart(2, '0')).join('');
        if (hash !== resource.sha256) throw new Error('Offline resource version mismatch');
        return [resource.url, response];
      }));
      const cache = await caches.open(CACHE_NAME);
      await Promise.all(responses.map(([url, response]) => cache.put(url, response)));
}
async function shellComplete() {
  const cache = await caches.open(CACHE_NAME);
  return (await Promise.all(RESOURCES.map(resource => cache.match(resource.url)))).every(Boolean);
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    try {
      await prepareShell();
    } catch (error) {
      await caches.delete(CACHE_NAME);
      throw error;
    }
  })());
  // Never skipWaiting: all existing app windows must finish before activation.
});

self.addEventListener('message', event => {
  if (event.data?.type !== 'SHELL_STATUS' || !event.ports[0]) return;
  event.waitUntil((async () => {
    try {
      if (!(await shellComplete()) && event.data.repair) await prepareShell();
      event.ports[0].postMessage({ ready: await shellComplete() });
    } catch { event.ports[0].postMessage({ ready: false }); }
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith('nato-shell-v1-') && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
  })());
  // Never claim existing pages or force a reload that could lose a draft.
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  let key = url.pathname;
  if (request.mode === 'navigate') {
    // Keep missing assets as 404 rather than serving HTML as JavaScript/fonts.
    if (/\.[^/]+$/.test(key) && !key.endsWith('.html')) return;
    const route = key.replace(/\.html$/, '').replace(/\/+$/, '') || '/';
    key = ROUTES[route === '/index' ? '/' : route] || '/index.html';
  } else if (url.search || !paths.has(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(key);
    // Do not mix a missing piece of a pinned build with the latest server build.
    return cached || new Response('Offline copy unavailable. Reconnect and use Menu to retry offline setup.', {
      status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  })());
});
