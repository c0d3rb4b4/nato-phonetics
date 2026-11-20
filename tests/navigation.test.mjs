import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveRoute, ROUTE_TITLES } from '../src/navigation/routes.js';

test('all maintained URLs and static HTML aliases resolve to the same screen', () => {
  assert.equal(Object.keys(ROUTE_TITLES).length, 13);
  for (const path of Object.keys(ROUTE_TITLES)) {
    assert.equal(resolveRoute(path), path);
    assert.equal(resolveRoute(path === '/' ? '/index.html' : path + '.html'), path);
    assert.equal(resolveRoute(path + '?source=test#heading'), path);
    assert.equal(resolveRoute(path + '/'), path);
  }
});

test('native custom scheme supports host and path forms without accepting external schemes', () => {
  assert.equal(resolveRoute('natophonetics://converter'), '/converter');
  assert.equal(resolveRoute('natophonetics://progress'), '/progress');
  assert.equal(resolveRoute('natophonetics:///voice-select?source=test'), '/voice-select');
  assert.equal(resolveRoute('natophonetics://'), '/');
  assert.equal(resolveRoute('https://unrelated.example/converter'), '/+not-found');
});

test('unknown, malformed and encoded paths remain explicit not-found routes', () => {
  assert.equal(resolveRoute('/%61lphabet'), '/alphabet');
  for (const path of ['/missing', '/%ZZ', '/alphabet/../settings', '/%2e%2e/settings']) {
    assert.equal(resolveRoute(path), '/+not-found');
  }
});
