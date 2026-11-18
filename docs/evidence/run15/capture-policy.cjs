const fs = require('node:fs'), path = require('node:path'), http = require('node:http');
const assert = require('node:assert/strict'), puppeteer = require('puppeteer-core');
const { staticHandler } = require('../../../scripts/serve-web.cjs');
const shots = path.join(__dirname, 'screenshots/web'); fs.mkdirSync(shots, { recursive: true });
(async () => {
 const server = http.createServer(staticHandler(path.resolve('dist'))); await new Promise(r => server.listen(0, '127.0.0.1', r));
 const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true }), metadata = [];
 try {
 for (const width of [1280, 320]) {
  const page = await browser.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.setViewport({ width, height: width === 320 ? 568 : 900 });
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: width === 320 ? 'dark' : 'light' }]);
  await page.goto(`http://127.0.0.1:${server.address().port}/privacy`, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-testid="app-theme"]');
  for (const title of ['Clear Progress', 'Browser progress']) {
   await page.evaluate(async title => {
    await document.fonts.ready;
    const target = [...document.querySelectorAll('[dir="auto"]')].filter(e => e.textContent.startsWith(title) && e.textContent.length > title.length + 10).sort((a, b) => a.textContent.length - b.textContent.length)[0];
    if (!target) throw new Error('Missing policy clause ' + title);
    target.scrollIntoView({ block: 'start' });
   }, title);
   const file = `${width}-${title.toLowerCase().replaceAll(' ', '-')}-policy.png`;
   await page.screenshot({ path: path.join(shots, file) });
   metadata.push({ file, width, height: page.viewport().height, theme: width === 320 ? 'dark' : 'light', state: title + ' policy', browser: await browser.version(), at: new Date().toISOString(), command: 'node docs/evidence/run15/capture-policy.cjs' });
  }
  assert.deepEqual(errors, []); await page.close();
 }
 console.log('PASS four real production web policy captures; no page errors.');
 } finally { fs.writeFileSync(path.join(shots, 'policy-metadata.json'), JSON.stringify(metadata, null, 2) + '\n'); await browser.close(); server.closeAllConnections(); server.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
