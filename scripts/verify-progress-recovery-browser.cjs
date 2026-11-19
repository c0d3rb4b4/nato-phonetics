// First-answer recovery on real production pages. Only quota failure is
// injected; lock timeout uses a real second page holding the exclusive lock.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const http = require('node:http');
const { createHash } = require('node:crypto');
const { pathToFileURL } = require('node:url');
const { chromium, firefox, webkit } = require('playwright');
const { staticHandler } = require('./serve-web.cjs');
const { observeProgress, progressSnapshot } = require('./progress-observation.cjs');
const root = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'artifacts/progress-recovery');
const engine = process.argv[4] || 'webkit';
const browserType = { chromium, firefox, webkit }[engine];
assert(browserType, 'Engine must be chromium, firefox or webkit');
const id = value => `[data-testid="${value}"]:not([aria-hidden="true"] *)`;
const named = value => `[aria-label="${value}"]:not([aria-hidden="true"] *)`;
const report = { engine, runner: require('playwright/package.json').version, checks: [], captures: [],
  boundary: 'Local production build; injected quota and actual held lock are recovery qualification, not the cause of the Run24 spontaneous failure. No native, branded Safari, OS suspension, hosted CI or M11 pass.' };
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const server = http.createServer(staticHandler(root));
let browser, context, page, active;
async function capture(file, state) {
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(out, 'screenshots/web', file) });
  report.captures.push({ file, state, at: new Date().toISOString(), engine, browser: report.browser,
    viewport: page.viewportSize(), theme: active.theme, scenario: active.scenario,
    candidate: report.candidate, command: 'node scripts/verify-progress-recovery-browser.cjs', arguments: process.argv.slice(2) });
}
async function saved(n) {
  await page.waitForFunction(n => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0) === n, n);
}
async function main() {
  await fs.mkdir(path.join(out, 'screenshots/web'), { recursive: true });
  report.runnerSha256 = hash(await fs.readFile(__filename));
  report.observerSha256 = hash(await fs.readFile(path.join(__dirname, 'progress-observation.cjs')));
  report.candidate = { root, manifestSha256: hash(await fs.readFile(path.join(root, 'offline-manifest.json'))),
    shellBuildId: JSON.parse(await fs.readFile(path.join(root, 'offline-manifest.json'))).buildId };
  report.browserExecutable = engine === 'chromium' && process.env.BROWSER_EXECUTABLE ? process.env.BROWSER_EXECUTABLE : browserType.executablePath();
  report.browserExecutableSha256 = hash(await fs.readFile(report.browserExecutable));
  browser = await browserType.launch({ headless: true, ...(engine === 'chromium' && process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
  report.browser = browser.version();
  const { PRACTICE_ENTRIES, entrySymbol } = await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const words = new Map(PRACTICE_ENTRIES.map(entry => [entrySymbol(entry), entry.word]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  for (const scenario of ['ordinary', 'quota', 'lock']) for (const width of [1280, 320]) {
    active = { scenario, width, theme: width === 320 ? 'dark' : 'light', errors: [], automationErrors: [], snapshots: {} };
    report.checks.push(active);
    context = await browser.newContext({ viewport: { width, height: width === 320 ? 568 : 900 }, colorScheme: active.theme });
    // One init script fixes installation order: faults sit beneath observations.
    await context.addInitScript(({ observe, failWrite }) => {
      window.__failProgressWrite = failWrite;
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'nato.progress.v1' && window.__failProgressWrite) throw new DOMException('Run25 deliberate first-write quota failure', 'QuotaExceededError');
        return set.call(this, key, value);
      };
      (0, eval)(`(${observe})()`);
    }, { observe: observeProgress.toString(), failWrite: scenario === 'quota' });
    await context.exposeBinding('__recordProgressError', (_source, error) => active.errors.push(error));
    await context.addInitScript(() => {
      addEventListener('error', event => { void window.__recordProgressError({ type: 'error', message: event.message }); });
      addEventListener('unhandledrejection', event => { void window.__recordProgressError({ type: 'unhandledrejection', name: event.reason?.name, message: event.reason?.message }); });
    });
    page = await context.newPage(); page.setDefaultTimeout(15000);
    page.on('pageerror', error => active.automationErrors.push({ name: error.name, message: error.message }));
    await page.goto(origin + '/letter-quiz');
    await page.locator(id('quiz-start')).click(); await page.locator(id('quiz-letter')).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('nato.progress.v1')), null);
    await page.evaluate(() => localStorage.setItem('nato.recovery.unrelated', 'keep'));
    let holder;
    if (scenario === 'lock') {
      holder = await context.newPage(); await holder.goto(origin + '/about');
      await holder.evaluate(() => {
        window.__holding = navigator.locks.request('nato.progress.v1', async () => {
          window.__held = true; await new Promise(resolve => { window.__release = resolve; });
        });
      });
      await holder.waitForFunction(() => window.__held);
    }
    const symbol = (await page.locator(id('quiz-letter')).textContent()).trim(), word = words.get(symbol);
    active.answer = { symbol, word };
    await page.evaluate(() => window.__progressObservation.mark('before-pointer-answer'));
    await page.locator(named('Choose ' + word)).click(); await page.locator(id('quiz-answer')).waitFor();
    assert.equal(await page.locator(named('Choose ' + word)).getAttribute('aria-pressed'), 'true');
    await page.waitForFunction(text => document.body.innerText.includes(text), `Correct! ${symbol} is ${word}.`);
    if (scenario !== 'ordinary') {
      await page.locator(named('Retry progress storage')).waitFor();
      await page.waitForFunction(() => document.body.innerText.includes('1 unsaved answer held in memory.'));
      active.snapshots.pending = await progressSnapshot(page);
      assert.equal(active.snapshots.pending.data.present, false);
      const events = active.snapshots.pending.events;
      if (scenario === 'quota') {
        assert.equal(events.filter(e => e.type === 'storage-write-rejected' && e.name === 'QuotaExceededError').length, 1);
        assert.equal(events.filter(e => e.type === 'lock-acquired').length, 1);
        await page.evaluate(() => { window.__failProgressWrite = false; });
      } else {
        const rejection = events.find(e => e.type === 'lock-rejected');
        assert(rejection?.aborted && rejection.elapsedMs >= 4500 && rejection.name === 'TimeoutError');
        assert.equal(events.filter(e => e.type === 'lock-acquired').length, 0);
        assert.equal(active.snapshots.pending.locks.held.filter(lock => lock.name === 'nato.progress.v1').length, 1);
        await holder.evaluate(async () => { window.__release(); await window.__holding; });
      }
      await page.locator(named('Retry progress storage')).scrollIntoViewIfNeeded();
      await capture(`${scenario}-${width}-pending.png`, 'First answer visibly pending with Retry; no saved record');
      await page.evaluate(() => window.__progressObservation.mark('before-pointer-retry'));
      await page.locator(named('Retry progress storage')).dblclick();
    }
    await saved(1);
    await page.waitForFunction(() => !document.body.innerText.includes('unsaved answer') && !document.querySelector('[aria-label="Retry progress storage"]'));
    active.snapshots.saved = await progressSnapshot(page);
    active.record = await page.evaluate(() => localStorage.getItem('nato.progress.v1'));
    const data = JSON.parse(active.record);
    assert.deepEqual(Object.keys(data.symbols), [symbol]); assert.equal(data.symbols[symbol].attempts, 1);
    assert.equal(data.symbols[symbol].errors, 0); assert.equal(data.generation, undefined);
    assert.equal(active.snapshots.saved.events.filter(event => event.type === 'storage-write').length, 1);
    assert.equal(active.snapshots.saved.locks.held.length, 0); assert.equal(active.snapshots.saved.locks.pending.length, 0);
    await page.locator(named('Open menu')).click(); await page.locator(named('Learning progress')).click();
    await page.locator(id('progress-summary')).filter({ hasText: '1 answers saved' }).waitFor();
    await page.locator(id('progress-summary')).scrollIntoViewIfNeeded();
    await capture(`${scenario}-${width}-saved.png`, 'Exactly one saved answer after real pointer input/Retry');
    await page.reload(); await page.locator(id('progress-summary')).filter({ hasText: '1 answers saved' }).waitFor();
    assert.equal(await page.evaluate(() => localStorage.getItem('nato.progress.v1')), active.record);
    assert.equal(await page.evaluate(() => localStorage.getItem('nato.recovery.unrelated')), 'keep');
    active.snapshots.reloaded = await progressSnapshot(page);
    assert.equal(active.snapshots.reloaded.events.filter(e => e.type === 'storage-write').length, 0);
    assert.deepEqual(active.errors, []);
    // Preserve Firefox's exact automation-only caught callback diagnostic.
    assert.deepEqual(active.automationErrors.map(e => e.message), engine === 'firefox' && scenario === 'quota' ? ['Run25 deliberate first-write quota failure'] : []);
    active.status = 'passed'; await context.close(); context = null;
  }
  report.status = 'passed';
}
main().catch(async error => {
  report.status = 'failed'; report.failure = error.stack; process.exitCode = 1;
  if (active) { active.status = 'failed'; active.snapshots.failure = await progressSnapshot(page).catch(() => null); }
  if (page && !page.isClosed()) await capture('failure.png', 'Failed scope; retained without Retry or assertion relaxation').catch(() => {});
  console.error(error);
}).finally(async () => {
  if (context) await context.close(); if (browser) await browser.close(); server.closeAllConnections(); server.close();
  report.at = new Date().toISOString(); await fs.mkdir(out, { recursive: true });
  await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(out, 'screenshots/web/metadata.json'), JSON.stringify(report.captures, null, 2) + '\n');
  console.log(JSON.stringify({ engine, status: report.status, checks: report.checks.length, captures: report.captures.length }));
});
