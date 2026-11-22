// Two real same-origin production pages, real Web Locks and localStorage.
// Failure switches exercise unavailable storage/locks; speech alone is mocked.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { setTimeout: delay } = require('node:timers/promises');
const { pathToFileURL } = require('node:url');
const { staticHandler } = require('./serve-web.cjs');
const puppeteer = require('puppeteer-core');
const out = path.resolve(process.argv[3] || 'artifacts/progress-concurrency-browser');
const shots = path.join(out, 'screenshots/web');
fs.mkdirSync(shots, { recursive: true });
const server = http.createServer(staticHandler(path.resolve(process.argv[2] || 'dist')));
const visible = selector => `${selector}:not([aria-hidden="true"] *)`;
const id = value => visible(`[data-testid="${value}"]`), named = value => visible(`[aria-label="${value}"]`);
const captures = [], checks = [], errors = [];
async function click(page, selector) {
  await page.waitForSelector(selector);
  await page.$eval(selector, element => element.scrollIntoView({ block: 'center' }));
  await page.$eval(selector, element => element.click());
}
const read = page => page.evaluate(() => JSON.parse(localStorage.getItem('nato.progress.v1')));
const total = data => Object.values(data?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0);
// Poll from the test process so hidden renderer timers cannot conceal a storage
// write or a live summary update. Keep the observed page in the background.
async function waitForValue(readValue, matches, description) {
  const deadline = performance.now() + 30_000;
  let observed;
  do {
    observed = await readValue();
    if (matches(observed)) return;
    await delay(100);
  } while (performance.now() < deadline);
  assert.fail(`Timed out waiting for ${description}; last observed ${JSON.stringify(observed)}`);
}
const waitTotal = (page, n) => waitForValue(async () => total(await read(page)), value => value === n, `exactly ${n} stored answers`);
const summary = (page, n) => waitForValue(
  () => page.evaluate(selector => document.querySelector(selector)?.textContent ?? null, id('progress-summary')),
  value => value?.startsWith(`${n} answers saved`), `a visible summary with ${n} saved answers`);
async function progress(page) { await click(page, named('Menu')); await click(page, named('Learning progress')); await page.waitForSelector(id('progress-summary')); }
async function quizBack(page) { await page.goBack(); await page.goBack(); await page.waitForSelector(id('quiz-next')); }
async function next(page) { await click(page, id('quiz-next')); await page.waitForSelector(id('quiz-answer'), { hidden: true }); }
async function clear(page) { await click(page, id('progress-clear')); await click(page, id('progress-delete')); await summary(page, 0); }
(async () => {
  const { PRACTICE_ENTRIES, entrySymbol } = await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const words = new Map(PRACTICE_ENTRIES.map(entry => [entrySymbol(entry), entry.word]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  const browserVersion = await browser.version();
  async function pageFor(context, width, noLocks = false, unreadable = false) {
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height: width === 320 ? 568 : 900 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: width === 320 ? 'dark' : 'light' }]);
    await page.evaluateOnNewDocument(({ noLocks, unreadable }) => {
      if (unreadable) {
        const at = Date.now();
        localStorage.setItem('nato.progress.v1', JSON.stringify({ version: 1, generation: '00000000-0000-4000-8000-000000000001', symbols: { A: { attempts: 1, errors: 0, streak: 1, lastReviewedAt: at, dueAt: at + 86400000 } } }));
        window.__failProgressRead = true;
      }
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        if (key === 'nato.progress.v1' && window.__failProgressRead) throw new Error('deliberate unreadable storage');
        return get.call(this, key);
      };
      if (noLocks) Object.defineProperty(navigator, 'locks', { value: undefined });
      // Simulates delayed storage-event delivery in a suspended window. The
      // retry must check the persisted generation even without notification.
      window.addEventListener('storage', event => { if (window.__suspendProgressEvents) event.stopImmediatePropagation(); }, true);
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'nato.progress.v1' && window.__failProgressWrite) throw new Error('deliberate quota failure');
        return set.call(this, key, value);
      };
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
      Object.defineProperty(window, 'speechSynthesis', { value: { getVoices: () => [], addEventListener() {}, removeEventListener() {}, cancel() {}, speak(u) { queueMicrotask(() => { u.onstart?.({}); u.onend?.({}); }); } } });
    }, { noLocks, unreadable });
    await page.goto(base + '/letter-quiz', { waitUntil: 'networkidle0' });
    await click(page, named('26 questions')); await click(page, id('quiz-start'));
    await page.waitForSelector(id('quiz-letter'));
    return page;
  }
  async function answer(page, correct = true) {
    const symbol = await page.$eval(id('quiz-letter'), e => e.textContent.trim());
    let word = words.get(symbol);
    if (!correct) word = await page.$$eval('[data-testid^="quiz-choice-"]', (elements, word) => elements.map(e => e.getAttribute('aria-label').slice(7)).find(value => value !== word), word);
    await click(page, named('Choose ' + word)); await page.waitForSelector(id('quiz-answer'));
    return symbol;
  }
  async function capture(page, file, state, selector) {
    if (selector) {
      await page.$eval(selector, e => e.scrollIntoView({ block: 'center' }));
      await page.waitForFunction(selector => { const r = document.querySelector(selector)?.getBoundingClientRect(); return r && r.height > 0 && r.top >= 0 && r.bottom <= innerHeight; }, {}, selector);
    }
    await page.screenshot({ path: path.join(shots, file) });
    captures.push({ file, state, capturedAt: new Date().toISOString(), browser: browserVersion, viewport: page.viewport(), theme: page.viewport().width === 320 ? 'dark' : 'light', command: 'node scripts/verify-progress-concurrency-browser.cjs', arguments: process.argv.slice(2) });
  }
  try {
    const context = await browser.createBrowserContext();
    const a = await pageFor(context, 1280), b = await pageFor(context, 320);
    await a.evaluate(() => localStorage.setItem('unrelated', 'keep'));
    await Promise.all([answer(a), answer(b, false)]); await waitTotal(a, 2);
    await progress(a); await progress(b); await summary(a, 2); await summary(b, 2);
    await capture(a, 'desktop-merged-summary.png', 'Two simultaneous answers retained in both windows', id('progress-summary'));
    await capture(b, 'narrow-merged-summary.png', 'Same saved totals update in narrow second window', id('progress-summary'));
    checks.push('simultaneous accepted answers merge; both live summaries agree at 2');
    await quizBack(b); await next(b); await b.evaluate(() => { window.__failProgressWrite = true; });
    await answer(b); await b.waitForSelector(named('Retry progress storage'));
    assert.equal(total(await read(a)), 2);
    await clear(a); await b.waitForFunction(() => !document.body.innerText.includes('unsaved answer'));
    await b.evaluate(() => { window.__failProgressWrite = false; });
    await next(b); await answer(b); await waitTotal(a, 1); await summary(a, 1);
    assert.equal(Object.keys((await read(a)).symbols).length, 1);
    checks.push('external deletion discards failed pending answer; following submission creates only new progress');
    await next(b); await b.evaluate(() => { window.__suspendProgressEvents = true; window.__failProgressWrite = true; });
    await answer(b); await b.waitForSelector(named('Retry progress storage'));
    await clear(a); const deleted = await read(a);
    await b.evaluate(() => { window.__failProgressWrite = false; });
    await click(b, named('Retry progress storage'));
    await b.waitForFunction(() => !document.body.innerText.includes('unsaved answer'));
    assert.deepEqual(await read(a), deleted);
    await click(b, named('Menu')); await click(b, named('Learning progress')); await summary(b, 0);
    await capture(a, 'desktop-cleared-summary.png', 'Zero saved aggregates after cross-window deletion', id('progress-summary'));
    await capture(b, 'narrow-stale-retry-cleared.png', 'Retry cannot resurrect an answer with delayed storage events', id('progress-summary'));
    checks.push('persisted generation rejects old Retry without a storage event; deletion leaves no aggregates');
    await quizBack(b); await next(b); await answer(b); await waitTotal(a, 1); await summary(a, 1);
    await b.evaluate(() => { window.__suspendProgressEvents = false; });
    checks.push('new answer after unseen deletion is retained using generation read at submission');
    // Hold the real lock longer than the product timeout, then Retry. This
    // exercises bounded recovery instead of stealing another writer's lock.
    await a.evaluate(() => { window.__holding = navigator.locks.request('nato.progress.v1', async () => { window.__lockHeld = true; await new Promise(resolve => { window.__releaseProgressLock = resolve; }); }); });
    await a.waitForFunction(() => window.__lockHeld);
    await next(b); await answer(b); await b.waitForSelector(named('Retry progress storage'));
    assert.equal(total(await read(a)), 1);
    await capture(b, 'narrow-lock-timeout.png', 'Bounded lock wait retains one unsaved answer and exposes Retry', named('Retry progress storage'));
    await a.evaluate(async () => { window.__releaseProgressLock(); await window.__holding; });
    await click(b, named('Retry progress storage'));
    try { await waitTotal(a, 2); }
    catch (error) {
      const observations = await Promise.all([a,b].map(p => p.evaluate(async () => ({text:document.body.innerText,progress:localStorage.getItem('nato.progress.v1'),locks:await navigator.locks.query(),visibility:document.visibilityState,worker:navigator.serviceWorker?.controller?.scriptURL}))));
      fs.writeFileSync(path.join(out,'retry-timeout-diagnostic.json'),JSON.stringify(observations,null,2)+'\n');
      await b.screenshot({path:path.join(shots,'retry-timeout-diagnostic.png')});
      throw error;
    }
    await summary(a, 2);
    await progress(b); await summary(b, 2);
    const finalData = await read(a);
    await capture(b, 'narrow-retry-merged.png', 'Retry merges new saved totals without restoring deleted answers', id('progress-summary'));
    assert.equal(await a.evaluate(() => localStorage.getItem('unrelated')), 'keep');
    await b.reload({ waitUntil: 'networkidle0' }); await summary(b, 2); assert.deepEqual(await read(b), finalData);
    checks.push('real lock timeout preserves pending answer; Retry saves once; fresh page restores exact aggregate record');
    const unsupported = await browser.createBrowserContext(), u = await pageFor(unsupported, 320, true);
    await answer(u); await u.waitForSelector(named('Retry progress storage'));
    assert.equal(await read(u), null);
    assert.match(await u.$eval('[role="alert"]', e => e.textContent), /HTTPS.*Web Locks/);
    await capture(u, 'narrow-coordination-unavailable.png', 'Missing Web Locks leaves practice available and avoids unsafe persistence', named('Retry progress storage'));
    checks.push('missing Web Locks fails safely with explicit support guidance and no persisted answers');
    const blocked = await browser.createBrowserContext(), v = await pageFor(blocked, 320, false, true);
    await answer(v); await v.waitForSelector(named('Retry progress storage'));
    await v.evaluate(() => { window.__failProgressRead = false; });
    const preserved = await read(v);
    await click(v, named('Retry progress storage'));
    await v.waitForFunction(() => document.body.innerText.includes('could not be linked'));
    assert.deepEqual(await read(v), preserved);
    assert.match(await v.evaluate(() => document.body.innerText), /1 unsaved answer held in memory/);
    await capture(v, 'narrow-uncertain-storage-recovery.png', 'Unknown deletion generation preserves pending answer and explains safe recovery', named('Retry progress storage'));
    await progress(v); await clear(v); await quizBack(v); await next(v); await answer(v); await waitTotal(v, 1);
    checks.push('unreadable generation preserves saved and pending answers after recovery; explicit Clear then new submission works');
    assert.deepEqual(errors, []);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify({ browser: browserVersion, at: new Date().toISOString(), checks, finalData, errors }, null, 2) + '\n');
    console.log(JSON.stringify({ passed: checks.length, checks, captures: captures.length }));
  } finally {
    fs.writeFileSync(path.join(shots, 'metadata.json'), JSON.stringify(captures, null, 2) + '\n');
    await browser.close(); server.closeAllConnections(); server.close();
  }
})().catch(error => { console.error(error); server.closeAllConnections(); server.close(); process.exitCode = 1; });
