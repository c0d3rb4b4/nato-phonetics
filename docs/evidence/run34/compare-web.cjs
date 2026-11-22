// Compare two isolated production exports on matching viewport and theme.
const fs = require('node:fs/promises');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');
const { staticHandler } = require('../../../scripts/serve-web.cjs');

async function capture(browser, stage, root, output, report) {
  const manifest = JSON.parse(await fs.readFile(path.join(root, 'offline-manifest.json')));
  const server = http.createServer(staticHandler(root));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const context = await browser.createBrowserContext();
  try {
    const page = await context.newPage();
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    for (const [state, route, width, height] of [
      ['reference', '/', 375, 667],
      ['converter', '/converter', 375, 667],
      ['menu', '/menu', 1280, 900],
      ['settings', '/settings', 375, 667],
    ]) {
      await page.setViewport({ width, height });
      await page.goto(`http://127.0.0.1:${server.address().port}${route}`, { waitUntil: 'networkidle0' });
      await page.waitForSelector('[data-testid="app-theme"]');
      await page.evaluate(() => document.fonts.ready);
      if (state === 'converter') {
        await page.type('[data-testid="converter-input"]', 'NUWJ 359');
        await page.waitForSelector('[data-testid="converter-output"]');
      }
      if (state === 'menu') {
        await page.waitForFunction(() => document.querySelector('[data-testid="web-offline-status"]')?.textContent.includes('Offline copy ready'));
      }
      const file = `${stage}-${state}-light.png`;
      await page.screenshot({ path: path.join(output, file) });
      report.push({ file, route, stage, buildId: manifest.buildId, width, height, appearance: 'System with OS light',
        capturedAt: new Date().toISOString() });
    }
  } finally {
    await context.close();
    server.close();
    server.closeAllConnections();
  }
}

async function main() {
  const [before, after, output] = process.argv.slice(2);
  await fs.mkdir(output, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  try {
    const captures = [];
    await capture(browser, 'before', before, output, captures);
    await capture(browser, 'after', after, output, captures);
    await fs.writeFile(path.join(output, 'comparison.json'), JSON.stringify({ browser: await browser.version(),
      command: `node docs/evidence/run34/compare-web.cjs ${process.argv.slice(2).join(' ')}`, captures }, null, 2) + '\n');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
