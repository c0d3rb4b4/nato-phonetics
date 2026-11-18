// Historical Run 02 diagnostic for the preserved P02 export. It never edits
// exported files and retains React's original hydration failure/throw.
// Usage: NODE_PATH=<puppeteer install> BROWSER_EXECUTABLE=<browser> node
// scripts/diagnose-home-hydration.cjs /path/to/p02-export [/path/to/fixed-export]
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const roots = process.argv.slice(2).map(directory => path.resolve(directory));
assert.ok(roots.length, 'Provide the preserved P02 export directory');
const hash = contents => crypto.createHash('sha256').update(contents).digest('hex');
const marker = 'function bl(e){throw Cl(Mr(Error(c(418,"")),e)),yl}';
// Names ml/e are specific to the recorded P02 React production bundle. Fail if
// its layout changes; do not silently instrument another function or artifact.
const diagnostic = 'function bl(e){window.__hydrationDebug={node:ml&&ml.outerHTML,text:ml&&ml.textContent,fibers:[]};for(var dbg=e;dbg&&window.__hydrationDebug.fibers.length<15;dbg=dbg.return){window.__hydrationDebug.fibers.push({type:typeof dbg.type==="string"?dbg.type:dbg.type&&dbg.type.name,tag:dbg.tag,text:typeof dbg.pendingProps==="string"?dbg.pendingProps:typeof dbg.pendingProps?.children==="string"?dbg.pendingProps.children:null,style:dbg.pendingProps?.style});}throw Cl(Mr(Error(c(418,"")),e)),yl}';
let current = roots[0];
let instrument = true;
let patchedBundle = null;
const server = http.createServer((req, res) => {
  let pathname;
  try { pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end(); }
  let file = path.resolve(current, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(current + path.sep)) { res.writeHead(403); return res.end(); }
  if (!path.extname(file)) file += '.html';
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404); return res.end(); }
  res.setHeader('Content-Type', ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf' })[path.extname(file)] || 'application/octet-stream');
  if (instrument && file.endsWith('.js')) {
    const original = fs.readFileSync(file, 'utf8');
    if (original.includes(marker)) {
      patchedBundle = { file, sha256: hash(original) };
      res.end(original.replace(marker, diagnostic));
      return;
    }
  }
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--no-first-run'] });
  try {
    console.log(JSON.stringify({ browser: await browser.version(), note: 'Only first artifact instrumented in memory; original throw retained; no files modified.' }));
    for (const [index, directory] of roots.entries()) {
      current = directory;
      instrument = index === 0;
      for (const scheme of ['light', 'dark']) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: scheme }]);
        await page.goto(`http://127.0.0.1:${server.address().port}/`, { waitUntil: 'networkidle0' });
        const details = await page.evaluate(() => ({
          diagnostic: window.__hydrationDebug ?? null,
          theme: document.querySelector('[data-testid="app-theme"]') ? getComputedStyle(document.querySelector('[data-testid="app-theme"]')).backgroundColor : null,
        }));
        if (instrument) assert.ok(patchedBundle, 'Recorded React failure marker was not found; artifact is not the expected P02 bundle');
        console.log(JSON.stringify({ artifact: directory, htmlSha256: hash(fs.readFileSync(path.join(directory, 'index.html'))), scheme, instrumentedBundle: instrument ? patchedBundle : null, errors, ...details }));
        await context.close();
      }
    }
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
