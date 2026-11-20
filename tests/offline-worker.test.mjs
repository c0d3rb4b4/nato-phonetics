import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import { createHash, webcrypto } from 'node:crypto';

const body = '<!doctype html>offline fixture';
const hash = createHash('sha256').update(body).digest('hex');
async function worker(fetchImpl = async () => new Response(body)) {
  const handlers = {}, stores = new Map();
  const caches = {
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      return {
        async put(key, value) { stores.get(name).set(key, value.clone()); },
        async match(key) { return stores.get(name).get(key)?.clone(); },
      };
    },
  };
  const self = { location: { origin: 'https://example.test' }, addEventListener(name, handler) { handlers[name] = handler; },
    skipWaiting() { assert.fail('forced activation loses in-memory work'); }, clients: { claim() { assert.fail('existing pages must keep their worker'); } } };
  const template = await fs.readFile(new URL('../web/service-worker.js', import.meta.url), 'utf8');
  const script = template.replaceAll('{{BUILD_ID}}', 'test').replaceAll('{{RESOURCES}}', JSON.stringify([
    { url: '/index.html', sha256: hash }, { url: '/app-hash.js', sha256: hash },
  ])).replaceAll('{{ROUTES}}', JSON.stringify({ '/': '/index.html', '/menu': '/index.html' }));
  vm.runInNewContext(script, { self, caches, fetch: fetchImpl, crypto: webcrypto, URL, Response, Uint8Array });
  const lifecycle = name => new Promise((resolve, reject) => handlers[name]({ waitUntil: promise => promise.then(resolve, reject) }));
  const request = (pathname, options = {}) => {
    let response;
    handlers.fetch({ request: { url: 'https://example.test' + pathname, method: 'GET', mode: 'cors', ...options }, respondWith(value) { response = value; } });
    return response;
  };
  const message = repair => new Promise((resolve, reject) => handlers.message({
    data: { type: 'SHELL_STATUS', repair }, ports: [{ postMessage: resolve }], waitUntil: promise => promise.catch(reject),
  }));
  return { stores, caches, lifecycle, request, message };
}

test('offline installation caches only a complete integrity-checked shell', async () => {
  const good = await worker(); await good.lifecycle('install');
  assert.deepEqual([...good.stores.get('nato-shell-v1-test').keys()].sort(), ['/app-hash.js', '/index.html']);
  for (const response of [new Response('wrong bytes'), new Response('unavailable', { status: 503 })]) {
    const failed = await worker(async () => response.clone());
    await failed.caches.open('nato-shell-v1-previous');
    await assert.rejects(failed.lifecycle('install'));
    assert.deepEqual(await failed.caches.keys(), ['nato-shell-v1-previous']);
  }
});

test('offline fetch boundary preserves routes without caching user/provider traffic', async () => {
  const w = await worker(); await w.lifecycle('install');
  for (const route of ['/', '/menu?x=1', '/menu.html', '/index.html', '/unknown-route']) {
    assert.equal(await (await w.request(route, { mode: 'navigate' })).text(), body);
  }
  for (const [route, options] of [
    ['/app-hash.js?user=value', {}], ['/missing.js', { mode: 'navigate' }], ['/api/progress', {}],
    ['/app-hash.js', { method: 'POST' }], ['/anything', { url: 'https://provider.test/voice' }],
  ]) assert.equal(w.request(route, options), undefined);
});

test('evicted pinned resource fails honestly instead of mixing server builds', async () => {
  let fetched = 0;
  const w = await worker(async () => { fetched++; return new Response(body); });
  await w.lifecycle('install'); fetched = 0;
  w.stores.get('nato-shell-v1-test').delete('/app-hash.js');
  const response = await w.request('/app-hash.js');
  assert.equal(response.status, 503);
  assert.match(await response.text(), /Reconnect/);
  assert.equal(fetched, 0);
});

test('normal activation removes only prior app-shell caches and never claims clients', async () => {
  const w = await worker(); await w.lifecycle('install');
  await w.caches.open('nato-shell-v1-old'); await w.caches.open('unrelated');
  await w.lifecycle('activate');
  assert.deepEqual((await w.caches.keys()).sort(), ['nato-shell-v1-test', 'unrelated']);
});


test('readiness detects eviction and explicit repair preserves a remaining offline copy on failure', async () => {
  let connected = true;
  const w = await worker(async () => { if (!connected) throw new Error('offline'); return new Response(body); });
  await w.lifecycle('install');
  assert.equal((await w.message(false)).ready, true);
  w.stores.get('nato-shell-v1-test').delete('/app-hash.js'); connected = false;
  assert.equal((await w.message(false)).ready, false);
  assert.equal((await w.message(true)).ready, false);
  assert.equal(await (await w.request('/', { mode: 'navigate' })).text(), body);
  connected = true;
  assert.equal((await w.message(true)).ready, true);
  assert.equal(await (await w.request('/app-hash.js')).text(), body);
});
