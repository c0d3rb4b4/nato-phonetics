// Exercise the packaged static candidate on the real independent Caddy host.
// Loopback HTTP qualifies routing/updates; it does not qualify public HTTPS.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const { spawn, execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { chromium, firefox, webkit } = require('playwright');
const { packageWeb } = require('./package-web.cjs');
const { writeOfflineManifest } = require('./offline-manifest.cjs');
const { pathToFileURL } = require('node:url');
const { observeProgress, progressSnapshot } = require('./progress-observation.cjs');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const id = value => `[data-testid="${value}"]:not([aria-hidden="true"] *)`;
const named = value => `[aria-label="${value}"]:not([aria-hidden="true"] *)`;
const output = path.resolve(process.argv[3] || 'artifacts/web-host');
const engine = process.argv[4] || 'chromium';
const transitionMode = process.argv[5] || 'tabs';
const browserType = { chromium, firefox, webkit }[engine];
assert(browserType, 'Engine must be chromium, firefox or webkit');
assert(['tabs', 'process'].includes(transitionMode), 'Transition mode must be tabs or process');
const report = { engine, runner: require('playwright/package.json').version, platform: process.platform,
  transitionMode, idleWithNoAppClientsMs: transitionMode === 'tabs' ? 1000 : 0,
  checks: [], errors: [], boundary: 'Actual local Caddy; public HTTPS/certificates/host, branded Safari/iOS, legacy clients and M11 remain unrun' };
const captures = [];
let server, context, log;
// Playwright's waitForFunction treats an async predicate's Promise as truthy
// before its boolean resolves. Await evaluate explicitly before polling again.
async function pollPage(page, predicate, arg, description, timeout = 15000) {
  const deadline = Date.now() + timeout;
  do {
    if (await page.evaluate(predicate, arg) === true) return;
    await sleep(50);
  } while (Date.now() < deadline);
  throw new Error(`Timed out waiting for ${description}`);
}
// Read actual controller/served bytes separately from cache housekeeping. One
// failed combined predicate otherwise hides which update boundary diverged.
async function workerSnapshot(page) {
  return page.evaluate(async () => {
    const digest = async response => response ? [...new Uint8Array(await crypto.subtle.digest('SHA-256', await response.arrayBuffer()))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('') : null;
    const registration = await navigator.serviceWorker.getRegistration();
    const worker = value => value ? { state: value.state, scriptURL: value.scriptURL } : null;
    return {
      url: location.href, controlled: !!navigator.serviceWorker.controller,
      active: worker(registration?.active), waiting: worker(registration?.waiting), installing: worker(registration?.installing),
      controllerIsActive: !!navigator.serviceWorker.controller && navigator.serviceWorker.controller === registration?.active,
      servedHtmlSha256: await digest(await fetch('/index.html')),
      // CacheStorage.match with cacheName never creates a cache that activation
      // deleted between keys() and this read. caches.open would change the
      // cleanup outcome being observed in precisely that race.
      caches: await Promise.all((await caches.keys()).map(async name => ({ name,
        indexHtmlSha256: await digest(await caches.match('/index.html', { cacheName: name })) }))),
    };
  });
}
async function main() {
  report.runnerSha256 = hash(await fs.readFile(__filename));
  report.progressObserverSha256 = hash(await fs.readFile(path.join(__dirname, 'progress-observation.cjs')));
  report.browserExecutable = engine === 'chromium' && process.env.BROWSER_EXECUTABLE ? process.env.BROWSER_EXECUTABLE : browserType.executablePath();
  report.browserExecutableSha256 = hash(await fs.readFile(report.browserExecutable));
  assert(process.env.CADDY_EXECUTABLE, 'Set CADDY_EXECUTABLE to a verified Caddy binary');
  await fs.mkdir(output, { recursive: true });
  const work = await fs.mkdtemp(path.join(output, 'runtime-'));
  report.runtimeDirectory = work;
  const a = path.join(work, 'a'); await fs.mkdir(a);
  const artifact = path.resolve(process.argv[2] || 'artifacts/nato-web.tar.gz');
  execFileSync('tar', ['-xzf', artifact, '-C', a]);
  const release = JSON.parse(await fs.readFile(path.join(a, 'release.json')));
  for (const [file, record] of Object.entries(release.files)) assert.equal(hash(await fs.readFile(path.join(a, file))), record.sha256, file);
  report.candidate = { artifact, archiveSha256: hash(await fs.readFile(artifact)), shellBuildId: release.shellBuildId, contentId: release.contentId };
  report.caddy = execFileSync(process.env.CADDY_EXECUTABLE, ['version'], { encoding: 'utf8' }).trim();
  const portServer = net.createServer();
  await new Promise(resolve => portServer.listen(0, '127.0.0.1', resolve));
  const port = portServer.address().port; await new Promise(resolve => portServer.close(resolve));
  const origin = `http://127.0.0.1:${port}`;
  const current = path.join(work, 'current'); await fs.symlink(path.join(a, 'public'), current);
  const env = { ...process.env, NATO_SITE_ADDRESS: origin, NATO_WEB_ROOT: current,
    XDG_CONFIG_HOME: path.join(work, 'config'), XDG_DATA_HOME: path.join(work, 'data') };
  const config = path.join(a, 'Caddyfile');
  report.validation = execFileSync(process.env.CADDY_EXECUTABLE, ['validate', '--config', config, '--adapter', 'caddyfile'], { env, encoding: 'utf8' }).trim();
  log = await fs.open(path.join(output, 'caddy.log'), 'w');
  server = spawn(process.env.CADDY_EXECUTABLE, ['run', '--config', config, '--adapter', 'caddyfile'], { env, stdio: ['ignore', log.fd, log.fd] });
  for (let attempt = 0; attempt < 100; attempt++) {
    if (server.exitCode !== null) throw new Error('Caddy stopped before readiness');
    try { if ((await fetch(origin)).ok) break; } catch { /* startup */ }
    if (attempt === 99) throw new Error('Caddy readiness timeout'); await sleep(100);
  }
  const manifest = JSON.parse(await fs.readFile(path.join(a, 'public/offline-manifest.json')));
  const originalIndex = await fetch(origin + '/index.html');
  const oldValidators = { etag: originalIndex.headers.get('etag'), modified: originalIndex.headers.get('last-modified') };
  // Archive mtimes are the Unix epoch. Caddy 2.11.9 omits timestamp-derived
  // validators for that value; equal-length new HTML must never get a false304.
  assert.deepEqual(oldValidators, { etag: null, modified: null });
  report.validators = oldValidators;
  for (const [route, file] of Object.entries(manifest.routes)) {
    for (const suffix of route === '/' ? [''] : ['', '/']) {
      const response = await fetch(origin + route + suffix);
      assert.equal(response.status, 200); assert.match(response.headers.get('content-type'), /text\/html/);
      assert.equal(response.headers.get('cache-control'), 'no-cache');
      assert.equal(hash(Buffer.from(await response.arrayBuffer())), hash(await fs.readFile(path.join(a, 'public', file.slice(1)))));
    }
  }
  report.checks.push({ name: 'All 13 direct routes and trailing slashes return exact route HTML with revalidation', passed: true });
  for (const [file, record] of Object.entries(release.files).filter(([file]) => file.startsWith('public/'))) {
    const url = file.slice('public'.length), response = await fetch(origin + url);
    assert.equal(response.status, 200); assert.equal(hash(Buffer.from(await response.arrayBuffer())), record.sha256, url);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('cache-control'), /\/assets\/|\.ttf$/.test(url) ? 'public, max-age=31536000, immutable' : 'no-cache', url);
    if (/\.js$/.test(url)) assert.match(response.headers.get('content-type'), /javascript/);
    if (/\.ttf$/.test(url)) assert.match(response.headers.get('content-type'), /font\/ttf/);
    const head = await fetch(origin + url, { method: 'HEAD' }); assert.equal(head.status, 200); assert.equal(await head.text(), '');
    assert.equal(Number(head.headers.get('content-length')), record.bytes);
  }
  for (const url of ['/assets/missing.js', '/assets/missing', '/missing.ttf', '/missing.html', '/.nato-web-output', '/_headers', '/release.json', '/Caddyfile', '/.git/config']) {
    assert.equal((await fetch(origin + url)).status, 404, url);
  }
  const unknown = await fetch(origin + '/unknown-route'); assert.equal(unknown.status, 200);
  assert.equal(hash(Buffer.from(await unknown.arrayBuffer())), release.files['public/index.html'].sha256);
  assert.equal((await fetch(origin + '/converter', { method: 'POST' })).status, 405);
  report.checks.push({ name: 'Exact resource GET/HEAD bytes, MIME/cache headers, missing assets/private metadata 404, navigation fallback and method handling', passed: true });

  const shots = path.join(output, 'screenshots/web'); await fs.mkdir(shots, { recursive: true });
  const profile = path.join(work, 'browser-profile');
  async function launch() {
    const ctx = await browserType.launchPersistentContext(profile, { headless: true, viewport: { width: 1280, height: 900 }, colorScheme: 'light',
      ...(engine === 'chromium' && process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    ctx.setDefaultTimeout(15000); ctx.on('page', page => page.on('pageerror', error => report.errors.push(error.message)));
    await ctx.addInitScript(observeProgress);
    report.browser = ctx.browser().version(); return ctx;
  }
  async function capture(page, file, state) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(shots, file) });
    captures.push({ file, state, capturedAt: new Date().toISOString(), viewport: page.viewportSize(), engine, browser: report.browser,
      userAgent: await page.evaluate(() => navigator.userAgent),
      appearance: await page.locator(id('app-theme')).evaluate(element => ({ background: getComputedStyle(element).backgroundColor,
        preference: JSON.parse(localStorage.getItem('nato.preferences.v1'))?.themeMode || 'system',
        system: matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light' })),
      candidate: report.candidate, host: report.caddy, command: 'node scripts/verify-web-host.cjs', arguments: process.argv.slice(2) });
  }
  const savedTotal = page => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0));
  const ready = (page, build) => pollPage(page, async expected => {
    const registration = await navigator.serviceWorker.getRegistration();
    const keys = (await caches.keys()).filter(key => key.startsWith('nato-shell-v1-'));
    return !!navigator.serviceWorker.controller && navigator.serviceWorker.controller === registration?.active && !registration.waiting &&
      keys.length === 1 && keys[0] === 'nato-shell-v1-' + expected;
  }, build, 'active controller and sole expected shell cache');
  async function reopened(target, route, build, htmlHash) {
    // Capture the new document before the app registers its worker. A later
    // active registration alone cannot show whether it controlled navigation.
    await target.addInitScript(() => {
      const service = navigator.serviceWorker;
      const events = window.__natoReopenEvents = [];
      const record = (event, registration) => events.push({
        event, ms: performance.now(), controlled: !!service.controller,
        ...(registration ? { active: registration.active?.state, waiting: registration.waiting?.state,
          installing: registration.installing?.state } : {}),
      });
      record('document-start');
      service.addEventListener('controllerchange', () => record('controllerchange'));
      void service.getRegistration().then(registration => {
        record(registration ? 'initial-registration' : 'initial-registration-absent', registration);
        registration?.addEventListener('updatefound', () => record('updatefound', registration));
      });
      window.addEventListener('pageshow', () => record('pageshow'));
    });
    const navigation = () => target.evaluate(() => ({
      timeOrigin: performance.timeOrigin, events: window.__natoReopenEvents,
      workerStart: performance.getEntriesByType('navigation')[0]?.workerStart,
    }));
    const observation = { route, build, expectedHtmlSha256: htmlHash };
    (report.reopenObservations ||= []).push(observation);
    await target.goto(origin + route);
    // A process can close during normal activation. The first new navigation
    // may still get the prior controller. Once activation settles, an explicit
    // fresh navigation selects the active worker; production never forces it.
    try {
      await pollPage(target, async () => {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration?.active?.state === 'activated' && !registration.waiting && !registration.installing;
      }, undefined, 'normal worker activation after closing all windows');
    } finally { observation.firstDocument = await navigation().catch(() => null); }
    observation.beforeFreshNavigation = await workerSnapshot(target);
    await target.goto(origin + route);
    observation.afterFreshNavigation = await workerSnapshot(target);
    observation.servedExpectedHtmlBeforeCleanup = observation.afterFreshNavigation.servedHtmlSha256 === htmlHash;
    observation.activeControllerBeforeCleanup = observation.afterFreshNavigation.controllerIsActive;
    try { await ready(target, build); }
    finally { observation.freshDocument = await navigation().catch(() => null); }
    observation.settled = await workerSnapshot(target);
    assert.equal(observation.settled.servedHtmlSha256, htmlHash);
  }
  async function closeAppWindows() {
    const openPages = context.pages();
    (report.closeObservations ||= []).push({ mode: transitionMode, pageCount: openPages.length,
      beforeClose: await workerSnapshot(openPages.at(-1)) });
    if (transitionMode === 'process') {
      await context.close(); context = await launch();
      return context.newPage();
    }
    // Firefox and WebKit can exit when their last tab closes. A fresh
    // about:blank tab keeps the browser alive outside the app worker's scope.
    const nextPage = await context.newPage();
    for (const page of openPages) await page.close();
    // Leave the browser's worker process alive with zero app clients before
    // reopening. This idle interval is scenario timing, never a passed gate;
    // reopened() still verifies actual activation/controller/cache/HTML bytes.
    await sleep(1000);
    return nextPage;
  }
  context = await launch(); let page = await context.newPage();
  await assert.rejects(() => pollPage(page, async () => false, undefined, 'deliberately false async precondition', 150), /Timed out waiting for deliberately false async precondition/);
  report.asyncPollingNegativeCheck = 'Explicitly awaited false predicate times out, never passes';
  await page.goto(origin + '/letter-quiz');
  await page.locator(id('quiz-start')).click(); await page.locator(id('quiz-letter')).waitFor();
  const { PRACTICE_ENTRIES, entrySymbol } = await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const symbol = (await page.locator(id('quiz-letter')).textContent()).trim();
  const word = PRACTICE_ENTRIES.find(entry => entrySymbol(entry) === symbol).word;
  await page.locator(named('Choose ' + word)).click(); await page.locator(id('quiz-answer')).waitFor();
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0) === 1);
  report.firstAnswer = await progressSnapshot(page);
  await page.goto(origin + '/progress'); await page.locator(id('progress-summary')).waitFor();
  await capture(page, 'desktop-hosted-progress.png', 'Actual pointer answer saved through the packaged host');
  await page.goto(origin + '/converter'); await page.locator(id('converter-input')).fill('a3 b-');
  await page.locator(named('Copy or share')).click();
  await page.locator(id('converter-plain-text')).filter({ hasText: 'Alfa Three / Bravo dash' }).waitFor();
  await capture(page, 'desktop-hosted-converter.png', 'Exact converter on the extracted production release');
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload(); await ready(page, release.shellBuildId);
  await page.locator(id('converter-input')).fill('a3 b-');
  const progress = await page.evaluate(() => localStorage.getItem('nato.progress.v1'));
  // Unrelated storage is a deliberate fixture, not a mocked application answer.
  await page.evaluate(async () => {
    localStorage.setItem('host-check-unrelated', 'keep');
    await (await caches.open('host-check-unrelated')).put('/host-check-unrelated', new Response('keep'));
  });
  const settings = await context.newPage(); await settings.goto(origin + '/settings');
  await settings.locator(named('Dark')).click();
  await settings.waitForFunction(() => JSON.parse(localStorage.getItem('nato.preferences.v1'))?.themeMode === 'dark');
  const preferences = await settings.evaluate(() => localStorage.getItem('nato.preferences.v1'));
  await settings.close();
  const assertRecords = async target => {
    assert.deepEqual(await target.evaluate(() => ({ progress: localStorage.getItem('nato.progress.v1'),
      preferences: localStorage.getItem('nato.preferences.v1'), unrelated: localStorage.getItem('host-check-unrelated') })),
    { progress, preferences, unrelated: 'keep' });
    assert.equal(await target.evaluate(async () => (await (await caches.open('host-check-unrelated')).match('/host-check-unrelated')).text()), 'keep');
  };

  // A separately labelled update fixture changes real JS URL/bytes and every
  // route reference, then uses the same production worker and packaging path.
  const fixture = path.join(work, 'update-fixture'); await fs.cp(path.join(a, 'public'), fixture, { recursive: true });
  const oldJS = manifest.resources.find(resource => resource.url.startsWith('/assets/')).url;
  const newJS = '/assets/app-HOSTTEST.js';
  await fs.writeFile(path.join(fixture, newJS.slice(1)), Buffer.concat([await fs.readFile(path.join(fixture, oldJS.slice(1))), Buffer.from('\n// local hosting update fixture\n')]));
  await fs.rm(path.join(fixture, oldJS.slice(1)));
  for (const file of Object.values(manifest.routes)) {
    const target = path.join(fixture, file.slice(1)); await fs.writeFile(target, (await fs.readFile(target, 'utf8')).replaceAll(oldJS, newJS));
  }
  const update = await writeOfflineManifest(fixture, manifest.routes, manifest.resources.map(resource => resource.url === oldJS ? newJS : resource.url));
  const forwardArchive = path.join(work, 'forward.tar.gz');
  await packageWeb({ directory: fixture, output: forwardArchive, retain: [path.join(a, 'public')] });
  const b = path.join(work, 'b'); await fs.mkdir(b); execFileSync('tar', ['-xzf', forwardArchive, '-C', b]);
  const switchRoot = async destination => { const next = path.join(work, 'next'); await fs.symlink(destination, next); await fs.rename(next, current); };
  // Deliberate origin-response corruption after verified extraction. This is
  // a transport/storage fault fixture, never a valid packaged release.
  const newAssetPath = path.join(b, 'public', newJS.slice(1));
  const newAssetBytes = await fs.readFile(newAssetPath);
  await fs.writeFile(newAssetPath, '/* deliberate truncated update response */');
  await switchRoot(path.join(b, 'public'));
  for (const [header, value] of [['If-None-Match', '"prior-host-etag"'], ['If-Modified-Since', new Date().toUTCString()]]) {
    const conditional = await fetch(origin + '/index.html', { headers: { [header]: value } });
    assert.equal(conditional.status, 200, `${header} from the prior release must not validate changed HTML`);
    assert.equal(hash(Buffer.from(await conditional.arrayBuffer())), hash(await fs.readFile(path.join(b, 'public/index.html'))));
  }
  assert.equal((await (await fetch(origin + '/offline-manifest.json')).json()).buildId, update.buildId);
  assert.equal(hash(Buffer.from(await (await fetch(origin + oldJS)).arrayBuffer())), manifest.resources.find(resource => resource.url === oldJS).sha256);
  const draft = page;
  const menu = await context.newPage(); await menu.goto(origin + '/menu');
  await menu.locator(id('web-offline-status')).filter({ hasText: 'could not finish' }).waitFor();
  assert.deepEqual(await menu.evaluate(() => caches.keys()).then(keys => keys.filter(key => key.startsWith('nato-shell-v1-'))), ['nato-shell-v1-' + release.shellBuildId]);
  assert.equal(await draft.locator(id('converter-input')).inputValue(), 'a3 b-');
  await assertRecords(menu);
  await menu.locator(named('Retry offline setup')).scrollIntoViewIfNeeded();
  await capture(menu, 'desktop-host-update-rejected.png', 'Deliberately truncated origin response rejects update; active shell, draft and exact saved data survive');
  await fs.writeFile(newAssetPath, newAssetBytes);
  await menu.locator(named('Retry offline setup')).click();
  page = menu;
  await pollPage(page, async () => !!(await navigator.serviceWorker.getRegistration()).waiting, undefined, 'verified forward worker waiting');
  assert.equal(await draft.locator(id('converter-input')).inputValue(), 'a3 b-', 'Retry and waiting update preserve the other window draft');
  await page.locator(id('web-offline-status')).filter({ hasText: 'Update ready.' }).waitFor();
  await capture(page, 'desktop-host-update-waiting.png', 'Atomic root switch preserves the active shell and waits for every window to close');
  await page.close();
  assert.equal(await draft.locator(id('converter-input')).inputValue(), 'a3 b-', 'Closing one window preserves the remaining draft');
  await draft.reload();
  await pollPage(draft, async expected => (await navigator.serviceWorker.getRegistration()).active.scriptURL.endsWith('/service-worker.js') &&
    !!(await navigator.serviceWorker.getRegistration()).waiting && !!(await (await caches.open('nato-shell-v1-' + expected)).match('/index.html')), release.shellBuildId, 'other window pins original worker');
  // Reload discards the in-memory draft by design; an open window still pins A.
  assert.equal(hash(Buffer.from(await draft.evaluate(async () => (await fetch('/index.html')).text()))), release.files['public/index.html'].sha256);
  await draft.locator(id('converter-input')).fill('a3 b-');
  await assertRecords(draft);
  await capture(draft, 'desktop-host-second-window-pinned.png', 'Closing one window and reloading the other keeps the original shell while the new worker waits');
  report.checks.push({ name: 'Real digest-rejected update leaves only complete original cache; explicit Retry installs verified update; two-window close/reload keeps original shell and exact progress/preferences/unrelated data', passed: true });
  page = await closeAppWindows();
  await reopened(page, '/progress', update.buildId, hash(await fs.readFile(path.join(b, 'public/index.html')))); assert.equal(await savedTotal(page), 1);
  await assertRecords(page);
  report.checks.push({ name: 'Real atomic forward switch: old immutable asset available, actual worker waits, close-all/reopen activates new shell and preserves saved answer', passed: true, fixtureBuildId: update.buildId });
  const rollbackArchive = path.join(work, 'rollback.tar.gz');
  await packageWeb({ directory: path.join(a, 'public'), output: rollbackArchive, retain: [path.join(b, 'public')] });
  const rollback = path.join(work, 'rollback'); await fs.mkdir(rollback); execFileSync('tar', ['-xzf', rollbackArchive, '-C', rollback]);
  await switchRoot(path.join(rollback, 'public'));
  assert.equal(hash(Buffer.from(await (await fetch(origin + newJS)).arrayBuffer())), hash(await fs.readFile(path.join(fixture, newJS.slice(1)))));
  await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); });
  await pollPage(page, async () => !!(await navigator.serviceWorker.getRegistration()).waiting, undefined, 'verified rollback worker waiting');
  page = await closeAppWindows();
  await page.setViewportSize({ width: 320, height: 568 }); await page.emulateMedia({ colorScheme: 'dark' });
  await reopened(page, '/menu', release.shellBuildId, release.files['public/index.html'].sha256); assert.equal(await savedTotal(page), 1);
  await assertRecords(page);
  await page.locator(id('web-offline-status')).filter({ hasText: 'Offline copy ready' }).waitFor();
  await page.locator(id('web-offline-status')).scrollIntoViewIfNeeded();
  await capture(page, 'narrow-host-rollback-ready.png', 'Original candidate active after rollback with progress retained');
  // Delete one real pinned cache entry; the worker must fail closed, then the
  // visible Menu action must restore it from the actual Caddy origin.
  const evicted = manifest.resources.find(resource => /\.ttf$/.test(resource.url)).url;
  assert.equal(await page.evaluate(async ({ name, url }) => (await caches.open(name)).delete(url), { name: 'nato-shell-v1-' + release.shellBuildId, url: evicted }), true);
  assert.equal(await page.evaluate(async url => (await fetch(url)).status, evicted), 503);
  await page.locator(named('Check for web update')).click();
  await page.locator(id('web-offline-status')).filter({ hasText: 'Offline copy ready' }).waitFor();
  assert.equal(await page.evaluate(async url => {
    const bytes = await (await fetch(url)).arrayBuffer();
    return [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))].map(b => b.toString(16).padStart(2, '0')).join('');
  }, evicted), manifest.resources.find(resource => resource.url === evicted).sha256);
  await assertRecords(page);
  report.checks.push({ name: 'Actual pinned font eviction returns 503; visible Menu check repairs exact digest from real host and preserves saved/unrelated records', passed: true });
  await capture(page, 'narrow-host-cache-repaired.png', 'Actual missing pinned font repaired through Menu; original rollback shell and saved records retained');
  await context.close();
  server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve));
  report.originStoppedForOffline = true;
  context = await launch(); await context.setOffline(true); page = await context.newPage();
  await page.setViewportSize({ width: 320, height: 568 }); await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(origin + '/progress'); await page.locator(id('progress-summary')).waitFor(); assert.equal(await savedTotal(page), 1);
  await assertRecords(page);
  await capture(page, 'narrow-host-offline-progress.png', 'Saved answer accessible offline through the packaged shell after rollback');
  assert.deepEqual(report.errors, []);
  report.checks.push({ name: 'Real atomic rollback retains newer assets, activates original worker, preserves exact saved records and cold-relaunch offline progress with browser network disabled and Caddy stopped', passed: true });
}
main().catch(async error => {
  report.failure = { message: error.message, stack: error.stack }; console.error(error); process.exitCode = 1;
  const page = context?.pages().filter(page => !page.isClosed()).at(-1);
  if (page) {
    await fs.mkdir(path.join(output, 'diagnostics'), { recursive: true });
    await page.screenshot({ path: path.join(output, 'diagnostics/failure.png') }).catch(() => {});
    report.failure.state = await workerSnapshot(page).catch(() => null);
    report.failure.visibleText = await page.locator('body').innerText().catch(() => null);
    report.failure.progress = await progressSnapshot(page).catch(() => null);
  }
}).finally(async () => {
  if (context) await context.close();
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  if (log) await log.close();
  await fs.mkdir(path.join(output, 'screenshots/web'), { recursive: true });
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(output, 'screenshots/web/metadata.json'), JSON.stringify(captures, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
});
