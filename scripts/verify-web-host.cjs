// Exercise the packaged static candidate on the real independent Caddy host.
// Loopback HTTP qualifies routing/updates; it does not qualify public HTTPS.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const net = require('node:net');
const { spawn, execFileSync } = require('node:child_process');
const { createHash } = require('node:crypto');
const { chromium } = require('playwright');
const { packageWeb } = require('./package-web.cjs');
const { writeOfflineManifest } = require('./offline-manifest.cjs');
const { pathToFileURL } = require('node:url');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const id = value => `[data-testid="${value}"]:not([aria-hidden="true"] *)`;
const named = value => `[aria-label="${value}"]:not([aria-hidden="true"] *)`;
const output = path.resolve(process.argv[3] || 'artifacts/web-host');
const report = { checks: [], errors: [], boundary: 'Actual local Caddy; public HTTPS/certificates/host and M11 remain unrun' };
const captures = [];
let server, context, log;
async function main() {
  assert(process.env.CADDY_EXECUTABLE, 'Set CADDY_EXECUTABLE to a verified Caddy binary');
  await fs.mkdir(output, { recursive: true });
  const work = await fs.mkdtemp(path.join(output, 'runtime-'));
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
    const ctx = await chromium.launchPersistentContext(profile, { headless: true, viewport: { width: 1280, height: 900 }, colorScheme: 'light',
      ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}) });
    ctx.setDefaultTimeout(15000); ctx.on('page', page => page.on('pageerror', error => report.errors.push(error.message)));
    report.browser = ctx.browser().version(); return ctx;
  }
  async function capture(page, file, state) {
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: path.join(shots, file) });
    captures.push({ file, state, capturedAt: new Date().toISOString(), viewport: page.viewportSize(), browser: report.browser,
      theme: await page.evaluate(() => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
      candidate: report.candidate, host: report.caddy, command: 'node scripts/verify-web-host.cjs', arguments: process.argv.slice(2) });
  }
  const savedTotal = page => page.evaluate(() => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0));
  const ready = (page, build) => page.waitForFunction(async expected => {
    const keys = (await caches.keys()).filter(key => key.startsWith('nato-shell-v1-'));
    return !!navigator.serviceWorker.controller && keys.length === 1 && keys[0] === 'nato-shell-v1-' + expected;
  }, build);
  context = await launch(); let page = await context.newPage();
  await page.goto(origin + '/letter-quiz');
  await page.locator(id('quiz-start')).click(); await page.locator(id('quiz-letter')).waitFor();
  const { PRACTICE_ENTRIES, entrySymbol } = await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const symbol = (await page.locator(id('quiz-letter')).textContent()).trim();
  const word = PRACTICE_ENTRIES.find(entry => entrySymbol(entry) === symbol).word;
  await page.locator(named('Choose ' + word)).click(); await page.locator(id('quiz-answer')).waitFor();
  await page.waitForFunction(() => Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols || {}).reduce((sum, row) => sum + row.attempts, 0) === 1);
  await page.goto(origin + '/progress'); await page.locator(id('progress-summary')).waitFor();
  await capture(page, 'desktop-hosted-progress.png', 'Actual pointer answer saved through the packaged host');
  await page.goto(origin + '/converter'); await page.locator(id('converter-input')).fill('a3 b-');
  await page.locator(id('converter-plain-text')).filter({ hasText: 'Alfa Three / Bravo dash' }).waitFor();
  await capture(page, 'desktop-hosted-converter.png', 'Exact converter on the extracted production release');
  await page.evaluate(() => navigator.serviceWorker.ready); await page.reload(); await ready(page, release.shellBuildId);
  await page.locator(id('converter-input')).fill('a3 b-');

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
  await switchRoot(path.join(b, 'public'));
  for (const [header, value] of [['If-None-Match', '"prior-host-etag"'], ['If-Modified-Since', new Date().toUTCString()]]) {
    const conditional = await fetch(origin + '/index.html', { headers: { [header]: value } });
    assert.equal(conditional.status, 200, `${header} from the prior release must not validate changed HTML`);
    assert.equal(hash(Buffer.from(await conditional.arrayBuffer())), hash(await fs.readFile(path.join(b, 'public/index.html'))));
  }
  assert.equal((await (await fetch(origin + '/offline-manifest.json')).json()).buildId, update.buildId);
  assert.equal(hash(Buffer.from(await (await fetch(origin + oldJS)).arrayBuffer())), manifest.resources.find(resource => resource.url === oldJS).sha256);
  await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); });
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
  assert.equal(await page.locator(id('converter-input')).inputValue(), 'a3 b-', 'Atomic switch and waiting worker preserve the active draft');
  await page.goto(origin + '/menu');
  await page.locator(id('web-offline-status')).filter({ hasText: 'Update ready.' }).waitFor();
  await capture(page, 'desktop-host-update-waiting.png', 'Atomic root switch preserves the active shell and waits for every window to close');
  await context.close(); context = await launch(); page = await context.newPage();
  await page.goto(origin + '/progress'); await ready(page, update.buildId); assert.equal(await savedTotal(page), 1);
  report.checks.push({ name: 'Real atomic forward switch: old immutable asset available, actual worker waits, close-all/reopen activates new shell and preserves saved answer', passed: true, fixtureBuildId: update.buildId });
  const rollbackArchive = path.join(work, 'rollback.tar.gz');
  await packageWeb({ directory: path.join(a, 'public'), output: rollbackArchive, retain: [path.join(b, 'public')] });
  const rollback = path.join(work, 'rollback'); await fs.mkdir(rollback); execFileSync('tar', ['-xzf', rollbackArchive, '-C', rollback]);
  await switchRoot(path.join(rollback, 'public'));
  assert.equal(hash(Buffer.from(await (await fetch(origin + newJS)).arrayBuffer())), hash(await fs.readFile(path.join(fixture, newJS.slice(1)))));
  await page.evaluate(async () => { const reg = await navigator.serviceWorker.getRegistration(); await reg.update(); });
  await page.waitForFunction(async () => !!(await navigator.serviceWorker.getRegistration()).waiting);
  await context.close(); context = await launch(); page = await context.newPage();
  await page.setViewportSize({ width: 320, height: 568 }); await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(origin + '/menu'); await ready(page, release.shellBuildId); assert.equal(await savedTotal(page), 1);
  await page.locator(id('web-offline-status')).scrollIntoViewIfNeeded();
  await capture(page, 'narrow-host-rollback-ready.png', 'Original candidate active after rollback with progress retained');
  await context.setOffline(true); await page.goto(origin + '/progress'); await page.locator(id('progress-summary')).waitFor(); assert.equal(await savedTotal(page), 1);
  await capture(page, 'narrow-host-offline-progress.png', 'Saved answer accessible offline through the packaged shell after rollback');
  assert.deepEqual(report.errors, []);
  report.checks.push({ name: 'Real atomic rollback retains newer immutable assets, activates original worker after close-all, preserves exact saved total and offline direct progress', passed: true });
}
main().catch(error => { report.failure = { message: error.message, stack: error.stack }; console.error(error); process.exitCode = 1; }).finally(async () => {
  if (context) await context.close();
  if (server && server.exitCode === null) { server.kill('SIGTERM'); await new Promise(resolve => server.once('exit', resolve)); }
  if (log) await log.close();
  await fs.mkdir(path.join(output, 'screenshots/web'), { recursive: true });
  await fs.writeFile(path.join(output, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await fs.writeFile(path.join(output, 'screenshots/web/metadata.json'), JSON.stringify(captures, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
});
