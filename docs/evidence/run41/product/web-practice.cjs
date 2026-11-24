// Check the final production export, with a new browser context for each size.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const { startServer } = require('../../../../scripts/serve-web.cjs');

async function main() {
  const server = startServer(process.argv[2], 0);
  await new Promise(resolve => server.once('listening', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ executablePath: process.env.BROWSER_EXECUTABLE });
  try {
    for (const [width, height, colorScheme] of [[1280, 900, 'light'], [320, 568, 'dark']]) {
      const context = await browser.newContext({ viewport: { width, height }, colorScheme });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(origin + '/letter-quiz');
      await page.getByTestId('mode-listening').waitFor();
      assert.equal(await page.getByTestId('mode-spoken').count(), 0);
      assert.equal(await page.getByText(/Spoken answers require Android/).count(), 0);
      await page.getByTestId('mode-typed').click();
      await page.getByTestId('quiz-start').click();
      await page.getByTestId('quiz-typed-answer').fill('Alfa');
      await page.getByTestId('quiz-check').click();
      await page.getByTestId('quiz-next').waitFor();
      await page.goto(origin + '/privacy');
      await page.getByText('Updated 24 November 2026', { exact: true }).waitFor();
      assert.equal(await page.getByText('Spoken answers', { exact: true }).count(), 0);
      await page.screenshot({ path: path.join(__dirname, '../screenshots/web', 'privacy-' + width + '.png') });
      assert.deepEqual(errors, []);
      console.log(JSON.stringify({ browser: browser.version(), width, height, colorScheme, typedSubmission: true, errors }));
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
