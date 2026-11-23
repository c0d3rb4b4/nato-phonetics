const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');
const { startServer } = require('../../../scripts/serve-web.cjs');

async function main() {
  const server = startServer(process.argv[2], 0);
  await new Promise(resolve => server.once('listening', resolve));
  const url = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  const out = path.join(__dirname, 'screenshots/web');
  await fs.mkdir(out, { recursive: true });
  try {
    for (const [width, height, colorScheme] of [[1280, 900, 'light'], [320, 568, 'dark']]) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(url + '/letter-quiz');
      assert.equal(await page.getByTestId('mode-spoken').count(), 0);
      await page.getByTestId('mode-typed').click();
      await page.getByTestId('quiz-start').click();
      await page.getByTestId('quiz-typed-answer').fill('test');
      await page.getByTestId('quiz-check').click();
      await page.getByTestId('quiz-next').waitFor();
      await page.goto(url + '/menu');
      await page.getByText('Offline copy ready', { exact: false }).first().waitFor();
      await page.getByText(/This website does not use the microphone/).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, 'menu-' + width + '.png') });
      await page.goto(url + '/privacy');
      await page.getByText(/Updated 22 November 2026/).waitFor();
      await page.getByText(/Closing or reloading clears them/).scrollIntoViewIfNeeded();
      await page.screenshot({ path: path.join(out, 'privacy-' + width + '.png') });
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ width, height, colorScheme, version: browser.version(), typedSubmission: true, errors }));
      await context.close();
    }
  } finally { await browser.close(); server.close(); }
}
main().catch(e => { console.error(e); process.exitCode = 1; });
