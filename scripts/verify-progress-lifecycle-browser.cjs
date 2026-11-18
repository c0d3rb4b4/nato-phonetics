// Actual Chromium page lifecycle freezing. Puppeteer leaves ordinary browser
// visibility intact; Playwright's focus emulation prevents this CDP scenario.
// This is a browser-page freeze, not suspension of an entire OS process.
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');
const { staticHandler } = require('./serve-web.cjs');
const out = path.resolve(process.argv[3] || 'artifacts/progress-lifecycle-browser');
const shots = path.join(out, 'screenshots/web');
fs.mkdirSync(shots, { recursive: true });
const server = http.createServer(staticHandler(path.resolve(process.argv[2] || 'dist')));
const id = value => `[data-testid="${value}"]:not([aria-hidden="true"] *)`;
const named = value => `[aria-label="${value}"]:not([aria-hidden="true"] *)`;
const captures = [], checks = [], errors = [];
const report = { checks, errors, scope: 'Actual hidden Chromium page freeze/resume; no OS process, Firefox/WebKit or legacy-client upgrade qualification' };
let browser;
async function click(page, selector) {
  await page.waitForSelector(selector);
  // No input/focus switch while another page is frozen. Invoke the actual UI
  // handler; pointer input is separately checked in verify-browser-support.
  await page.$eval(selector, element => element.click());
}
const read = page => page.evaluate(() => JSON.parse(localStorage.getItem('nato.progress.v1')));
const total = data => Object.values(data?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0);
const summary = (page, count) => page.waitForFunction(n => document.querySelector('[data-testid="progress-summary"]:not([aria-hidden="true"] *)')?.textContent.startsWith(`${n} answers saved`), { polling: 50 }, count);
async function capture(page, file, state) {
  await page.bringToFront(); await page.$eval(id('progress-summary'), element => element.scrollIntoView({ block: 'center' }));
  await page.screenshot({ path: path.join(shots, file) });
  captures.push({ file, state, at: new Date().toISOString(), browser: report.browser, viewport: page.viewport(),
    theme: page.viewport().width === 320 ? 'dark' : 'light', command: 'node scripts/verify-progress-lifecycle-browser.cjs', arguments: process.argv.slice(2) });
}
(async () => {
  const { PRACTICE_ENTRIES, entrySymbol } = await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const words = new Map(PRACTICE_ENTRIES.map(entry => [entrySymbol(entry), entry.word]));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  report.browser = await browser.version();
  const a = await browser.newPage(), b = await browser.newPage();
  for (const [page, width, height, theme] of [[a, 1280, 900, 'light'], [b, 320, 568, 'dark']]) {
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width, height }); await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: theme }]);
    await page.evaluateOnNewDocument(() => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (key, value) {
        if (key === 'nato.progress.v1' && window.__failProgressWrite) throw new Error('deliberate quota failure');
        return set.call(this, key, value);
      };
      window.__beats = 0; window.__lifecycle = [];
      setInterval(() => { window.__beats++; }, 20);
      document.addEventListener('freeze', () => window.__lifecycle.push({ event: 'freeze', beats: window.__beats }));
      document.addEventListener('resume', () => window.__lifecycle.push({ event: 'resume', beats: window.__beats }));
    });
    await page.goto(base + '/letter-quiz'); await click(page, named('26 questions')); await click(page, id('quiz-start'));
  }
  async function answer(page) {
    const symbol = await page.$eval(id('quiz-letter'), element => element.textContent.trim());
    await click(page, named('Choose ' + words.get(symbol))); await page.waitForSelector(id('quiz-answer'));
  }
  async function progress(page) { await click(page, named('Open menu')); await click(page, named('Learning progress')); }
  async function clear() { await click(a, id('progress-clear')); await click(a, id('progress-delete')); await summary(a, 0); }
  const session = await b.createCDPSession();
  async function frozenClear() {
    await a.bringToFront();
    assert.equal(await b.evaluate(() => document.visibilityState), 'hidden');
    await session.send('Page.setWebLifecycleState', { state: 'frozen' });
    try { await clear(); await new Promise(resolve => setTimeout(resolve, 500)); }
    finally { await session.send('Page.setWebLifecycleState', { state: 'active' }); }
    const events = await b.evaluate(() => window.__lifecycle.slice(-2));
    assert.deepEqual(events.map(event => event.event), ['freeze', 'resume']);
    assert.equal(events[0].beats, events[1].beats, 'No interval tasks execute between actual freeze and resume events');
    return events;
  }
  await answer(b); await progress(a); await summary(a, 1); await progress(b); await summary(b, 1);
  const first = await frozenClear(); await summary(b, 0);
  checks.push({ scope: 'saved summary refreshes deletion after actual page freeze; task queue is measured stopped', events: first });
  await capture(b, 'narrow-resumed-progress.png', 'A genuinely frozen page resumes and shows externally cleared progress');
  await b.goBack(); await b.goBack(); await click(b, id('quiz-next'));
  await b.evaluate(() => { window.__failProgressWrite = true; });
  await answer(b); await b.waitForSelector(named('Retry progress storage'));
  assert.equal(total(await read(a)), 0);
  const second = await frozenClear();
  await b.waitForFunction(() => !document.body.innerText.includes('unsaved answer'), { polling: 50 });
  await b.evaluate(() => { window.__failProgressWrite = false; });
  const cleared = await read(a); assert.equal(total(cleared), 0); assert.deepEqual(await read(b), cleared);
  checks.push({ scope: 'actual freeze with one failed pending answer; deletion during freeze discards that old answer after resume', events: second, generation: cleared.generation });
  await click(b, id('quiz-next')); await answer(b);
  await summary(a, 1); assert.equal(total(await read(a)), 1);
  await progress(b); await summary(b, 1);
  await capture(a, 'desktop-new-answer.png', 'Only a newly submitted answer is saved after frozen-page deletion');
  await capture(b, 'narrow-new-answer.png', 'Resumed second window agrees on the exact new aggregate');
  checks.push({ scope: 'new submission after frozen-page deletion saves exactly once and both summaries agree' });
  assert.deepEqual(errors, []); report.status = 'passed';
  console.log(JSON.stringify({ status: report.status, checks: checks.length, captures: captures.length }));
})().catch(error => { report.status = 'failed'; report.failure = error.stack; console.error(error); process.exitCode = 1; })
  .finally(async () => {
    report.at = new Date().toISOString(); fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(shots, 'metadata.json'), JSON.stringify(captures, null, 2) + '\n');
    if (browser) await browser.close(); server.closeAllConnections(); server.close();
  });
