// Optional exported-web smoke test. Install puppeteer-core separately and set
// NODE_PATH plus BROWSER_EXECUTABLE; see README.md. No personal browser profile.
const assert = require('node:assert/strict');
const http = require('node:http');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const root = path.resolve(process.argv[2] || 'dist');
const { staticHandler } = require('./serve-web.cjs');
const server = http.createServer(staticHandler(root));
const key = 'nato.preferences.v1';
const dark = 'rgb(31, 41, 51)';
const light = 'rgb(255, 253, 247)';
const themeColor = async (page, expected) => {
  await page.waitForFunction(color => {
    const root = document.querySelector('[data-testid="app-theme"]');
    return root && getComputedStyle(root).backgroundColor === color;
  }, {}, expected);
};
const radio = async (page, name) => {
  await page.waitForSelector(`[role="radio"][aria-label="${name}"]`);
  await page.click(`[role="radio"][aria-label="${name}"]`);
  try {
    await page.waitForFunction(label => document.querySelector(`[role="radio"][aria-label="${label}"]`)?.getAttribute('aria-checked') === 'true', { timeout: 10000 }, name);
  } catch (error) {
    console.error('Radio state after click:', await page.evaluate(() => ({
      radios: [...document.querySelectorAll('[role="radio"]')].map(node => node.outerHTML),
      stored: localStorage.getItem('nato.preferences.v1'), body: document.body.innerText,
    })));
    throw error;
  }
};

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  try {
    browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--no-first-run', '--disable-background-networking', ...(process.env.CI ? ['--no-sandbox'] : [])] });
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewport({ width: 375, height: 667 });
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await page.goto(base + '/settings', { waitUntil: 'networkidle0' });
    await themeColor(page, dark);
    await radio(page, 'Light');
    await themeColor(page, light);
    await page.reload({ waitUntil: 'networkidle0' });
    await themeColor(page, light);
    await radio(page, 'System');
    await themeColor(page, dark);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
    await themeColor(page, light);
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await themeColor(page, dark);
    console.log('PASS first launch, saved appearance reload, explicit override, return to System, live OS changes');

    await page.evaluate(() => {
      localStorage.removeItem('nato.preferences.v1');
      localStorage.setItem('darkMode', 'true');
      localStorage.setItem('selectedVoice', 'missing-test-voice');
      localStorage.setItem('learning.progress', 'keep-me');
    });
    await page.reload({ waitUntil: 'networkidle0' });
    await themeColor(page, dark);
    await page.waitForFunction(() => localStorage.getItem('nato.preferences.v1') !== null);
    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('nato.preferences.v1')));
    assert.equal(migrated.themeMode, 'dark');
    assert.equal(migrated.selectedVoice, 'missing-test-voice');
    await page.goto(base + '/voice-select', { waitUntil: 'networkidle0' });
    await radio(page, 'System Default');
    assert.equal(await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).selectedVoice, key), null);
    await page.goto(base + '/settings', { waitUntil: 'networkidle0' });
    await page.click('[role="button"][aria-label="Reset Preferences"]');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('nato.preferences.v1')).themeMode === 'system');
    assert.equal(await page.evaluate(() => localStorage.getItem('learning.progress')), 'keep-me');
    console.log('PASS legacy migration, System Default voice, scoped reset preserving unrelated progress');

    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(storageKey, value) {
        if (storageKey === 'nato.preferences.v1') throw new Error('Injected storage failure');
        return original.call(this, storageKey, value);
      };
    });
    await page.click('[role="radio"][aria-label="Light"]');
    await page.waitForSelector('[role="alert"]');
    await themeColor(page, dark);
    assert.equal(await page.$eval('[role="radio"][aria-label="System"]', node => node.getAttribute('aria-checked')), 'true');
    assert.equal(await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)).themeMode, key), 'system');
    console.log('PASS failed write reports error and preserves saved appearance');

    for (const route of ['/', '/settings', '/voice-select']) {
      await page.goto(base + route, { waitUntil: 'networkidle0' });
      await themeColor(page, dark);
    }
    assert.deepEqual(errors, [], 'No page/hydration errors on tested preference flows');
    console.log(`PASS direct Home/Settings/Voice routes; no hydration errors. Browser: ${await browser.version()}`);
  } finally {
    if (browser) await browser.close();
    server.close();
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
