// Real browser transparency probe for the final test-only observer.
const assert = require('node:assert/strict'), http = require('node:http');
const { chromium, firefox, webkit } = require('playwright');
const { observeProgress } = require('../../../../scripts/progress-observation.cjs');
const server = http.createServer((_request, response) => response.end('<!doctype html><title>Observer contract</title>'));
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  for (const [engine, type] of Object.entries({ chromium, firefox, webkit })) {
    const browser = await type.launch({ headless: true, ...(engine === 'chromium' ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    try {
      const context = await browser.newContext(); await context.addInitScript(observeProgress);
      const page = await context.newPage(); await page.goto('http://127.0.0.1:' + server.address().port);
      const result = await page.evaluate(async () => {
        const key = 'nato.progress.v1', records = [null, '{', '{"version":1,"symbols":{"A":null}}', '{"version":1,"symbols":{"A":{"attempts":1}}}'];
        const reads = [];
        for (const raw of records) { if (raw === null) localStorage.removeItem(key); else localStorage.setItem(key, raw); reads.push(localStorage.getItem(key)); }
        const callbackOnly = await navigator.locks.request(key, () => 42);
        const withOptions = await navigator.locks.request(key, { mode: 'shared' }, () => 43);
        const unrelated = await navigator.locks.request('observer-unrelated', () => 44);
        return { reads, callbackOnly, withOptions, unrelated, events: window.__progressObservation.events,
          locks: await navigator.locks.query() };
      });
      assert.deepEqual(result.reads, [null, '{', '{"version":1,"symbols":{"A":null}}', '{"version":1,"symbols":{"A":{"attempts":1}}}']);
      assert.deepEqual([result.callbackOnly, result.withOptions, result.unrelated], [42, 43, 44]);
      assert.equal(result.events.filter(event => event.type === 'lock-request').length, 2);
      assert.equal(result.events.filter(event => event.type === 'lock-acquired').length, 2);
      assert.equal(result.events.filter(event => event.type === 'lock-completed').length, 2);
      assert.deepEqual(result.locks.held, []); assert.deepEqual(result.locks.pending, []);
      console.log(JSON.stringify({ engine, browser: browser.version(), status: 'passed', result }));
    } finally { await browser.close(); }
  }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { server.closeAllConnections(); server.close(); });
