// Real worker/cache/DOM/storage; update B is an explicitly modified HTML fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const puppeteer = require('puppeteer-core');
const { staticHandler } = require('./serve-web.cjs');
const { writeOfflineManifest } = require('./offline-manifest.cjs');
const source = path.resolve(process.argv[2] || 'dist');
const out = path.resolve(process.argv[3] || 'artifacts/offline-browser');
const shots = path.join(out, 'screenshots/web');
const report = { scenarios: [], captures: [] };
let connected = true, broken = '', corrupt = false, root = source;
const server = http.createServer((req, res) => {
  if (!connected) return req.socket.destroy();
  if (req.url.split('?')[0] === broken) { res.writeHead(503); return res.end('deliberate interrupted resource'); }
  if (corrupt && req.url === '/favicon.png') { res.writeHead(200, { 'Content-Type': 'image/png' }); return res.end('deliberate wrong build bytes'); }
  staticHandler(root)(req, res);
});
let browser, persistent, temp;
const id = value => `[data-testid="${value}"]`;
(async () => {
  await fs.mkdir(shots, { recursive: true });
  temp = await fs.mkdtemp(path.join(os.tmpdir(), 'nato-offline-'));
  const b = path.join(temp, 'b');
  await fs.cp(source, b, { recursive: true });
  const manifest = JSON.parse(await fs.readFile(path.join(source, 'offline-manifest.json')));
  for (const resource of manifest.resources.filter(r => r.url.endsWith('.html'))) {
    const file = path.join(b, resource.url.slice(1));
    await fs.writeFile(file, (await fs.readFile(file, 'utf8')).replace('<div id="root"', '<div data-update-probe="b" id="root"'));
  }
  const next = await writeOfflineManifest(b, manifest.routes, manifest.resources.map(r => r.url));
  report.candidate = { buildId: manifest.buildId, fixtureB: next.buildId, fixtureDescription: 'same production JS; HTML root gains data-update-probe=b; manifest hashes regenerated', resources: manifest.resources };
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  report.origin = base;
  browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  report.browser = await browser.version();
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewport({ width: 1280, height: 900 });
  const visit = async (p, route) => { await p.goto(base + route, { waitUntil: 'networkidle0' }); await p.waitForSelector(id('app-theme')); };
  const click = async (p, selector) => { await p.bringToFront(); await p.$eval(selector, e => { e.scrollIntoView({ block: 'center' }); e.click(); }); };
  const ready = p => p.waitForFunction(async () => (await navigator.serviceWorker.getRegistration())?.active?.state === 'activated');
  const capture = async (p, name, target = id('web-offline'), block = 'end') => {
    await p.bringToFront(); if (target) await p.$eval(target, (e, block) => e.scrollIntoView({ block }), block);
    await p.screenshot({ path: path.join(shots, name + '.png') });
    const renderedFixture = await p.$eval('#root', e => e.dataset.updateProbe || 'production A');
    const appearance = await p.evaluate(() => ({ background: getComputedStyle(document.querySelector('[data-testid="app-theme"]')).backgroundColor, rootFontSize: getComputedStyle(document.documentElement).fontSize }));
    report.captures.push({ file: name + '.png', capturedAt: new Date().toISOString(), viewport: p.viewport(), browser: report.browser, buildId: renderedFixture === 'b' ? next.buildId : manifest.buildId, serverShellId: root === b ? next.buildId : manifest.buildId, renderedFixture, ...appearance, online: connected, command: 'node scripts/verify-offline-browser.cjs', arguments: [source, out] });
  };
  await visit(page, '/menu'); await ready(page);
  await page.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
  await capture(page, 'desktop-offline-ready');
  await page.evaluate(async () => { const [name] = await caches.keys(); await (await caches.open(name)).delete('/favicon.png'); });
  await click(page, '[aria-label="Check for web update"]');
  await page.waitForFunction(async () => { const [name] = await caches.keys(); return !!(await (await caches.open(name)).match('/favicon.png')); });
  await page.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
  report.scenarios.push('PASS evicted resource repaired by explicit Check without replacing app data');
  const names = await page.evaluate(() => caches.keys());
  assert.deepEqual(names, ['nato-shell-v1-' + manifest.buildId]);
  const cacheEntries = await page.evaluate(async name => (await (await caches.open(name)).keys()).map(r => new URL(r.url).pathname).sort(), names[0]);
  assert.deepEqual(cacheEntries, manifest.resources.map(r => r.url).sort());
  // Actual accepted answer; the existing store must persist identically through updates.
  await visit(page, '/letter-quiz');
  await click(page, id('quiz-start')); await page.waitForSelector(id('quiz-letter'));
  await click(page, '[data-testid^="quiz-choice-"]'); await page.waitForSelector(id('quiz-answer'));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('nato.progress.v1') || '{}').symbols);
  let progress = await page.evaluate(() => localStorage.getItem('nato.progress.v1'));
  const prefs = JSON.stringify({ version: 1, themeMode: 'dark', selectedVoice: null });
  await page.evaluate(p => { localStorage.setItem('nato.preferences.v1', p); localStorage.setItem('unrelated', 'keep'); }, prefs);
  connected = false; await page.setOfflineMode(true);
  for (const route of Object.keys(manifest.routes)) await visit(page, route + '?offline=1');
  await visit(page, '/alphabet.html');
  assert.equal(await page.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter(f => f.family.startsWith('NatoTile')).every(f => f.status === 'loaded'); }), true);
  await capture(page, 'offline-alphabet-fonts', id('app-theme'));
  await visit(page, '/letter-quiz');
  await click(page, id('quiz-start')); await page.waitForSelector(id('quiz-letter'));
  await click(page, '[data-testid^="quiz-choice-"]'); await page.waitForSelector(id('quiz-answer'));
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1')).symbols).reduce((sum, row) => sum + row.attempts, 0) === 2);
  progress = await page.evaluate(() => localStorage.getItem('nato.progress.v1'));
  await visit(page, '/converter'); const input = 'a3 b!';
  await page.type('textarea', input);
  assert.equal(await page.$eval('textarea', e => e.value), input);
  await click(page, '[role="button"][aria-label="Copy or share"]');
  assert.match(await page.$eval(id('converter-plain-text'), e => e.textContent), /Alfa/);
  await capture(page, 'offline-converter', 'textarea');
  await visit(page, '/progress'); assert.equal(await page.evaluate(() => localStorage.getItem('nato.progress.v1')), progress);
  await capture(page, 'offline-saved-progress', id('progress-summary'));
  await visit(page, '/this-route-does-not-exist'); assert.match(await page.$eval('body', e => e.innerText), /not found/i);
  await visit(page, '/privacy');
  await page.evaluate(() => { const e = [...document.querySelectorAll('div')].find(e => e.textContent.startsWith('Offline availability') && e.textContent.includes('After a successful connected setup')); if (!e) throw new Error('Missing offline policy'); e.setAttribute('data-policy-offline-check', 'true'); });
  await capture(page, 'desktop-offline-policy', '[data-policy-offline-check]');
  await visit(page, '/menu'); await capture(page, 'desktop-offline-menu');
  report.scenarios.push('PASS all 13 direct routes + query/.html/unknown fallback offline; cached fonts; actual offline quiz answer commits aggregate two; converter exact typed input/export; submitted progress retained');
  connected = true; await page.setOfflineMode(false);
  const second = await context.newPage(); await visit(second, '/converter'); await second.type('textarea', input);
  // Delay the delivery of A's real readiness reply. Another open window can
  // discover B while this check is still in flight.
  await page.evaluate(() => {
    const descriptor = Object.getOwnPropertyDescriptor(MessagePort.prototype, 'onmessage');
    const replies = [];
    let holding = true;
    window.offlineCheckReplies = replies;
    Object.defineProperty(MessagePort.prototype, 'onmessage', { ...descriptor, set(listener) {
      descriptor.set.call(this, function(event) {
        if (holding && event.data?.ready === true) replies.push(() => listener.call(this, event));
        else listener.call(this, event);
      });
    } });
    window.releaseOfflineCheck = () => {
      holding = false;
      Object.defineProperty(MessagePort.prototype, 'onmessage', descriptor);
      for (const deliver of replies.splice(0)) deliver();
    };
  });
  await click(page, '[aria-label="Check for web update"]');
  await page.waitForFunction(() => window.offlineCheckReplies.length > 0);
  const checker = await context.newPage(); await visit(checker, '/menu');
  await checker.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
  root = b; broken = '/favicon.png'; await click(checker, '[aria-label="Check for web update"]');
  await checker.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('could not finish'));
  await checker.close();
  await page.bringToFront();
  await page.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('could not finish'));
  await page.evaluate(async () => {
    window.releaseOfflineCheck();
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  });
  assert.match(await page.$eval(id('web-offline-status'), e => e.textContent), /could not finish/,
    'A late ready reply from the working shell must preserve the failed update and Retry');
  report.scenarios.push('PASS delayed active-shell reply preserves the failed update and Retry');
  assert.deepEqual(await page.evaluate(() => caches.keys()), names);
  assert.equal(await second.$eval('textarea', e => e.value), input);
  await capture(page, 'update-download-failed');
  await page.setViewport({ width: 320, height: 568 });
  await capture(page, 'narrow-update-download-failed', '[aria-label="Retry offline setup"]');
  await page.setViewport({ width: 1280, height: 900 });
  broken = ''; await click(page, '[aria-label="Retry offline setup"]');
  await page.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Update ready'));
  assert.equal(await second.$eval('textarea', e => e.value), input);
  assert.equal(await page.evaluate(() => localStorage.getItem('nato.progress.v1')), progress);
  await capture(page, 'desktop-update-waiting');
  await visit(page, '/menu'); assert.equal(await page.$eval('#root', e => e.dataset.updateProbe || null), null);
  await page.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Update ready'));
  assert.equal(await second.$eval('textarea', e => e.value), input);
  await page.close(); await second.close();
  // No in-scope clients remain: B may activate normally. Observe from a fresh page.
  const updated = await context.newPage(); await visit(updated, '/menu'); await ready(updated);
  // A navigation immediately after closing can still race activation; navigate once
  // the registration says its waiting worker is gone, never force activation.
  await updated.waitForFunction(async () => !(await navigator.serviceWorker.getRegistration())?.waiting);
  await visit(updated, '/menu'); assert.equal(await updated.$eval('#root', e => e.dataset.updateProbe), 'b');
  assert.deepEqual(await updated.evaluate(() => caches.keys()), ['nato-shell-v1-' + next.buildId]);
  assert.equal(await updated.evaluate(() => localStorage.getItem('nato.progress.v1')), progress);
  assert.equal(await updated.evaluate(() => localStorage.getItem('nato.preferences.v1')), prefs);
  assert.equal(await updated.evaluate(() => localStorage.getItem('unrelated')), 'keep');
  await capture(updated, 'update-activated');
  report.scenarios.push('PASS failed update keeps complete A; retry installs B; two windows/draft retained; reload keeps A while another open; normal close-all activation B; old shell cleanup; saved progress/preferences/unrelated retained');
  // Rollback is another waiting install, with no data reset.
  root = source; await click(updated, '[aria-label="Check for web update"]');
  await updated.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Update ready'));
  await updated.close(); const rollback = await context.newPage(); await visit(rollback, '/menu');
  await rollback.waitForFunction(async () => !(await navigator.serviceWorker.getRegistration())?.waiting);
  await visit(rollback, '/menu'); assert.equal(await rollback.$eval('#root', e => e.dataset.updateProbe || null), null);
  assert.equal(await rollback.evaluate(() => localStorage.getItem('nato.progress.v1')), progress);
  await capture(rollback, 'rollback-ready');
  report.scenarios.push('PASS rollback to complete A through default waiting lifecycle preserves data');
  await context.close();
  // Cold launch a new process with a real persistent profile and no network.
  const launch = () => puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, userDataDir: path.join(temp, 'profile') });
  persistent = await launch();
  let cold = await persistent.newPage();
  await visit(cold, '/menu'); await ready(cold);
  await cold.evaluate((progress, prefs) => { localStorage.setItem('nato.progress.v1', progress); localStorage.setItem('nato.preferences.v1', prefs); }, progress, prefs);
  await persistent.close(); connected = false;
  persistent = await launch(); cold = await persistent.newPage(); await cold.setOfflineMode(true);
  await cold.setViewport({ width: 320, height: 568 });
  await visit(cold, '/progress');
  assert.equal(await cold.evaluate(() => localStorage.getItem('nato.progress.v1')), progress);
  await capture(cold, 'narrow-dark-cold-progress', id('progress-summary'));
  await visit(cold, '/menu');
  await cold.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
  await capture(cold, 'narrow-dark-cold-offline');
  await visit(cold, '/privacy');
  await cold.evaluate(() => { const e = [...document.querySelectorAll('div')].find(e => e.textContent.startsWith('Offline availability') && e.textContent.includes('After a successful connected setup')); if (!e) throw new Error('Missing offline policy'); e.setAttribute('data-policy-offline-check', 'true'); e.scrollIntoView({block:'start'}); });
  await capture(cold, 'narrow-dark-offline-policy-top', '[data-policy-offline-check]', 'start');
  await capture(cold, 'narrow-dark-offline-policy-bottom', '[data-policy-offline-check]');
  await visit(cold, '/menu');
  await cold.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
  // 200% text at the same 320px viewport, with proportional tile root scale.
  await cold.evaluate(() => {
    document.documentElement.style.fontSize = '32px';
    const nodes = [...document.querySelectorAll('body *')].filter(e => !e.closest('[data-nato-tile]') && [...e.childNodes].some(c => c.nodeType === Node.TEXT_NODE && c.textContent.trim()));
    const sizes = nodes.map(e => ({ e, size: parseFloat(getComputedStyle(e).fontSize), line: parseFloat(getComputedStyle(e).lineHeight) }));
    for (const { e, size, line } of sizes) { e.style.fontSize = size * 2 + 'px'; if (Number.isFinite(line)) e.style.lineHeight = line * 2 + 'px'; }
  });
  await capture(cold, 'narrow-dark-200-offline-status', id('web-offline-status'));
  await capture(cold, 'narrow-dark-200-offline-retry', '[aria-label="Check for web update"]');
  assert.equal(await cold.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const controlClips = await cold.$$eval('[data-testid="web-offline"] [role="button"]', buttons => buttons.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent));
  assert.deepEqual(controlClips, []);
  await persistent.close(); connected = true;
  report.scenarios.push('PASS real process restart offline with saved progress; narrow dark 320px readiness and 200% text/control reachability');
  for (const mode of ['first-offline', 'blocked', 'unavailable', 'corrupt']) {
    const isolated = await browser.createBrowserContext(), p = await isolated.newPage();
    await p.setViewport({ width: 320, height: 568 });
    await p.emulateMediaFeatures([{name:'prefers-color-scheme',value:'dark'}]);
    if (mode === 'first-offline') {
      connected = false; await p.setOfflineMode(true);
      await assert.rejects(() => p.goto(base + '/menu')); connected = true;
      report.scenarios.push('PASS first-ever offline visit fails honestly, no cached availability claimed');
    } else {
      if (mode === 'blocked') await p.evaluateOnNewDocument(() => { navigator.serviceWorker.register = async () => { throw new Error('deliberate storage denial'); }; });
      if (mode === 'unavailable') await p.evaluateOnNewDocument(() => { Object.defineProperty(navigator, 'serviceWorker', { value: undefined }); });
      // Alter one response without changing worker/manifest: a mixed upload must fail hash verification.
      if (mode === 'corrupt') { root = b; corrupt = true; }
      await visit(p, '/menu');
      if (mode === 'unavailable') {
        await p.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('unavailable'));
      } else {
        await p.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('could not finish'));
      }
      await capture(p, 'narrow-' + mode);
      assert.deepEqual(await p.evaluate(() => caches.keys()), []);
      report.scenarios.push('PASS ' + mode + ' setup guidance without partial cache or app failure');
      if (mode === 'corrupt') {
        corrupt = false;
        await click(p, '[aria-label="Retry offline setup"]');
        await p.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
        await capture(p, 'narrow-first-install-recovered');
        report.scenarios.push('PASS first-install integrity failure recovers through Retry without reload');
      }
    }
    broken = ''; corrupt = false; root = source; await isolated.close();
  }
  assert.deepEqual(errors, []);
  report.appErrors = errors;
  report.workerSha256 = crypto.createHash('sha256').update(await fs.readFile(path.join(source, 'service-worker.js'))).digest('hex');
  console.log(report.scenarios.join('\n'));
})().catch(error => { report.failure = error.stack; console.error(error); process.exitCode = 1; }).finally(async () => {
  await fs.mkdir(out, { recursive: true }); await fs.writeFile(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await persistent?.close(); await browser?.close(); server.closeAllConnections(); server.close(); if (temp) await fs.rm(temp, { recursive: true, force: true });
});
