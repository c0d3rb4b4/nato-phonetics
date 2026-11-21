// Real production pages/storage/workers in isolated persistent browser profiles.
// Only explicit storage-failure/event-delay branches are injected. No app state
// or speech result is mocked. Playwright WebKit is not branded Safari evidence.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { chromium, firefox, webkit } = require('playwright');
const { staticHandler } = require('./serve-web.cjs');

const engine = process.argv[4] || 'chromium';
const browserType = { chromium, firefox, webkit }[engine];
assert(browserType, 'Engine must be chromium, firefox or webkit');
const out = path.resolve(process.argv[3] || `artifacts/browser-support/${engine}`);
const shots = path.join(out, 'screenshots/web');
fs.mkdirSync(shots, { recursive: true });
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-browser-support-'));
const handler = staticHandler(path.resolve(process.argv[2] || 'dist'));
let connected = true, deniedRequests = 0, context;
const server = http.createServer((req, res) => {
  if (!connected) { deniedRequests++; res.destroy(); return; }
  handler(req, res);
});
const checks = [], captures = [], errors = [], automationErrors = [];
const report = { engine, runner: require('playwright/package.json').version, checks, errors, automationErrors };
const id = value => `[data-testid="${value}"]:not([aria-hidden="true"] *)`;
const named = value => `[aria-label="${value}"]:not([aria-hidden="true"] *)`;
const read = page => page.evaluate(() => JSON.parse(localStorage.getItem('nato.progress.v1')));
const total = data => Object.values(data?.symbols || {}).reduce((n, row) => n + row.attempts, 0);
async function waitTotal(page, n) {
  await page.waitForFunction(n => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0) === n, n);
}
async function summary(page, n) {
  await page.waitForFunction(n => document.querySelector('[data-testid="progress-summary"]:not([aria-hidden="true"] *)')?.textContent.startsWith(`${n} answers saved`), n);
}
async function click(page, selector) { await page.locator(selector).click(); }
async function progress(page) {
  await click(page, named('Menu')); await click(page, named('Learning progress')); await summary(page, total(await read(page)));
}
async function clear(page) {
  await click(page, id('progress-clear')); await click(page, id('progress-delete')); await summary(page, 0);
}
async function next(page) {
  await click(page, id('quiz-next')); await page.locator(id('quiz-answer')).waitFor({ state: 'hidden' });
}
async function capture(page, file, state, selector) {
  if (selector) await page.locator(selector).scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(shots, file) });
  captures.push({ file, state, capturedAt: new Date().toISOString(), engine, browser: report.browser,
    userAgent: await page.evaluate(() => navigator.userAgent), viewport: page.viewportSize(),
    theme: await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    command: 'node scripts/verify-browser-support.cjs', arguments: process.argv.slice(2) });
}
async function launch() {
  const result = await browserType.launchPersistentContext(profile, {
    headless: true, viewport: { width: 1280, height: 900 }, colorScheme: 'light',
    ...(engine === 'chromium' && process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  result.setDefaultTimeout(15000);
  result.on('page', page => page.on('pageerror', error => automationErrors.push({ message: error.message, stack: error.stack })));
  await result.exposeBinding('__recordPageError', (_source, error) => errors.push(error));
  await result.addInitScript(() => {
    window.addEventListener('error', event => { void window.__recordPageError({ type: 'error', message: event.message }); });
    window.addEventListener('unhandledrejection', event => { void window.__recordPageError({ type: 'unhandledrejection', message: event.reason?.message }); });
  });
  report.browser = result.browser().version();
  return result;
}

(async () => {
  const { PRACTICE_ENTRIES, entrySymbol } = await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const words = new Map(PRACTICE_ENTRIES.map(entry => [entrySymbol(entry), entry.word]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  context = await launch();
  await context.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === 'nato.progress.v1' && window.__failProgressWrite) throw new Error('deliberate quota failure');
      return set.call(this, key, value);
    };
    window.addEventListener('storage', event => { if (window.__delayProgressEvents) event.stopImmediatePropagation(); }, true);
  });
  const a = await context.newPage(), b = await context.newPage();
  await b.setViewportSize({ width: 320, height: 568 }); await b.emulateMedia({ colorScheme: 'dark' });
  for (const page of [a, b]) {
    await page.goto(base + '/letter-quiz');
    await click(page, named('26 questions')); await click(page, id('quiz-start'));
    await page.locator(id('quiz-letter')).waitFor();
  }
  report.capabilities = await a.evaluate(() => ({ secureContext: isSecureContext, locks: !!navigator.locks,
    serviceWorker: !!navigator.serviceWorker, cacheStorage: !!window.caches, abortTimeout: typeof AbortSignal.timeout === 'function' }));
  assert(Object.values(report.capabilities).every(Boolean), 'Required persistence/offline browser capabilities');
  await a.evaluate(() => localStorage.setItem('nato.support-test.unrelated', 'keep'));
  async function answer(page) {
    const symbol = (await page.locator(id('quiz-letter')).textContent()).trim(), word = words.get(symbol);
    await click(page, named('Choose ' + word));
    await page.locator(id('quiz-answer')).waitFor();
    const selected = page.locator(named('Choose ' + word));
    assert.equal(await selected.getAttribute('aria-pressed'), 'true');
    assert.equal(await selected.textContent(), word + ' · Your answer');
    await page.waitForFunction(text => document.body.innerText.includes(text), `Correct! ${symbol} is ${word}.`);
    return { symbol, word };
  }
  const answers = await Promise.all([answer(a), answer(b)]);
  await waitTotal(a, 2); await progress(a); await progress(b); await summary(a, 2); await summary(b, 2);
  checks.push({ scope: 'two simultaneous actual pointer answers; exact selected word/feedback and both live summaries', answers });
  await capture(a, 'desktop-merged-progress.png', 'Both simultaneous pointer answers saved', id('progress-summary'));
  await capture(b, 'narrow-merged-progress.png', 'Same saved totals in the second dark narrow window', id('progress-summary'));

  await b.goBack(); await b.goBack(); await next(b);
  await b.evaluate(() => { window.__failProgressWrite = true; window.__delayProgressEvents = true; });
  await answer(b); await b.locator(named('Retry progress storage')).waitFor();
  assert.equal(total(await read(a)), 2);
  await clear(a); const deleted = await read(a);
  await b.evaluate(() => { window.__failProgressWrite = false; });
  await click(b, named('Retry progress storage'));
  await b.waitForFunction(() => !document.body.innerText.includes('unsaved answer'));
  assert.deepEqual(await read(a), deleted);
  checks.push({ scope: 'failed-write Retry with withheld storage events cannot resurrect deleted answers', generation: deleted.generation });
  await b.evaluate(() => { window.__delayProgressEvents = false; });
  await next(b); await answer(b); await waitTotal(a, 1); await summary(a, 1);
  checks.push({ scope: 'a new submission after unseen deletion saves exactly once' });

  await a.evaluate(() => {
    window.__heldLock = navigator.locks.request('nato.progress.v1', async () => {
      window.__lockAcquired = true; await new Promise(resolve => { window.__releaseLock = resolve; });
    });
  });
  await a.waitForFunction(() => window.__lockAcquired);
  await next(b); await answer(b); await b.locator(named('Retry progress storage')).waitFor();
  assert.equal(total(await read(a)), 1);
  await capture(b, 'narrow-lock-timeout.png', 'Real five-second lock timeout retains one unsaved answer', named('Retry progress storage'));
  await a.evaluate(async () => { window.__releaseLock(); await window.__heldLock; });
  await click(b, named('Retry progress storage')); await waitTotal(a, 2); await summary(a, 2);
  await progress(b); await summary(b, 2);
  checks.push({ scope: 'real exclusive-lock timeout followed by awaited release/actual pointer Retry saves once' });

  report.freeze = 'Dedicated Puppeteer lifecycle suite owns Chromium page freeze. No Firefox/WebKit or OS process suspension pass.';
  const expected = await read(a);
  await b.close();
  await click(a, named('Menu'));
  await a.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.startsWith('Offline copy ready'));
  await a.reload();
  await a.waitForFunction(() => !!navigator.serviceWorker.controller);
  report.shell = await a.evaluate(async () => ({ controller: navigator.serviceWorker.controller.scriptURL, caches: await caches.keys() }));
  connected = false; await context.setOffline(true);
  await a.goto(base + '/progress'); await summary(a, total(expected)); assert.deepEqual(await read(a), expected);
  checks.push({ scope: 'offline direct progress route preserves exact aggregate record with test server disconnected' });
  await capture(a, 'desktop-offline-progress.png', 'Direct offline progress route retains saved aggregates', id('progress-summary'));
  await a.goto(base + '/converter');
  await a.locator(id('converter-input')).fill('a3 b!');
  await click(a, named('Copy or share'));
  await a.waitForFunction(() => document.querySelector('[data-testid="converter-plain-text"]')?.textContent.includes('Alfa Three'));
  await capture(a, 'desktop-offline-converter.png', 'Production converter works from cached shell offline', id('converter-plain-text'));
  await a.goto(base + '/alphabet'); await a.locator('[data-nato-tile]').first().waitFor();
  checks.push({ scope: 'offline converter/reference direct routes render actual app and bundled tiles' });
  await context.close(); context = null;
  context = await launch(); await context.setOffline(true);
  const restored = await context.newPage(); await restored.setViewportSize({ width: 320, height: 568 }); await restored.emulateMedia({ colorScheme: 'dark' });
  await restored.goto(base + '/progress'); await summary(restored, total(expected)); assert.deepEqual(await read(restored), expected);
  assert.equal(await restored.evaluate(() => localStorage.getItem('nato.support-test.unrelated')), 'keep');
  await capture(restored, 'narrow-cold-offline-progress.png', 'New persistent browser session opens saved progress offline', id('progress-summary'));
  await restored.goto(base + '/converter'); assert.equal(await restored.locator(id('converter-input')).inputValue(), '');
  checks.push({ scope: 'persistent browser relaunch offline restores shell/exact progress/unrelated key; converter draft remains memory-only' });
  assert.deepEqual(errors, []);
  // Firefox159's automation reports a caught Web Locks callback rejection as a
  // pageerror, with no window error/unhandledrejection. The standalone no-app
  // probe records this boundary. Require the exact injected negative-test error
  // once; any other message/count, or an actual page event, fails the gate.
  assert.deepEqual(automationErrors.map(error => error.message), engine === 'firefox' ? ['deliberate quota failure'] : []);
  report.errorBoundary = 'Actual window error/unhandledrejection events must be empty. Firefox automation must report exactly the single injected quota rejection; all other automation errors fail.';
  report.status = 'passed'; report.deniedServerRequests = deniedRequests;
  console.log(JSON.stringify({ engine, browser: report.browser, checks: checks.length, captures: captures.length, status: report.status }));
})().catch(async error => {
  report.status = 'failed'; report.failure = error.stack;
  console.error(error);
  if (context) {
    for (const [i, page] of context.pages().entries()) {
      try {
        fs.writeFileSync(path.join(out, `failure-page-${i}.json`), JSON.stringify(await page.evaluate(() => ({ url: location.href, text: document.body.innerText, data: localStorage.getItem('nato.progress.v1') })), null, 2) + '\n');
        await page.screenshot({ path: path.join(out, `failure-page-${i}.png`) });
      } catch { /* Preserve the original failure if a crashed page cannot report. */ }
    }
  }
  process.exitCode = 1;
}).finally(async () => {
  report.at = new Date().toISOString();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(shots, 'metadata.json'), JSON.stringify(captures, null, 2) + '\n');
  if (context) await context.close();
  server.closeAllConnections(); server.close(); fs.rmSync(profile, { recursive: true, force: true });
});
