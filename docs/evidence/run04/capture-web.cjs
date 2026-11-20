// Actual production browser captures. No speech mocks or application state hooks.
// NODE_PATH=/path/to/puppeteer/node_modules BROWSER_EXECUTABLE=/path/to/browser
// node docs/evidence/run04/capture-web.cjs [production-output-directory]
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const puppeteer = require('puppeteer-core');
const project = path.resolve(__dirname, '../../..');
const { staticHandler } = require(path.join(project, 'scripts/serve-web.cjs'));
const build = path.resolve(process.argv[2] || path.join(project, 'dist'));
const output = path.join(__dirname, 'screenshots/web');
const key = 'nato.preferences.v1';
const byId = value => `[data-testid="${value}"]`;
const button = value => `[role="button"][aria-label="${value}"]`;
const pause = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function main() {
  fs.mkdirSync(output, { recursive: true });
  const server = http.createServer(staticHandler(build));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const captures = [];
  const errors = [];
  try {
    browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true,
      args: ['--no-first-run', '--disable-background-networking'] });
    const browserVersion = await browser.version();
    const states = [
      { file: 'home-desktop-light.png', route: '/', theme: 'light', width: 1440, height: 1000, state: 'Home, desktop' },
      { file: 'home-mobile-dark.png', route: '/', theme: 'dark', width: 390, height: 844, state: 'Home, mobile browser width' },
      { file: 'alphabet-desktop-light.png', route: '/alphabet', theme: 'light', width: 1280, height: 1100, state: 'Alphabet reference, top of scrollable list' },
      { file: 'converter-desktop-light.png', route: '/converter', theme: 'light', width: 1280, height: 1100, state: 'Converter populated with CV34 7AP', action: 'convert' },
      { file: 'quiz-question-mobile-dark.png', route: '/letter-quiz', theme: 'dark', width: 390, height: 1000, state: 'Unanswered quiz question' },
      { file: 'quiz-feedback-desktop-light.png', route: '/letter-quiz', theme: 'light', width: 1280, height: 1200, state: 'Answered quiz with persistent feedback and Next/Replay', action: 'answer' },
      { file: 'settings-desktop-light.png', route: '/settings', theme: 'light', width: 1280, height: 1100, state: 'Appearance/voice/reset settings' },
      { file: 'voice-mobile-dark.png', route: '/voice-select', theme: 'dark', width: 390, height: 1100, state: 'Real browser voice enumeration / capability result', action: 'voices' },
      { file: 'audio-help-desktop-light.png', route: '/audio-help', theme: 'light', width: 1280, height: 1300, state: 'Audio help after actual sound-test request', action: 'audio' },
    ];
    for (const state of states) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      page.on('pageerror', error => errors.push({ file: state.file, error: error.message }));
      await page.setViewport({ width: state.width, height: state.height, deviceScaleFactor: 1 });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: state.theme }]);
      await page.evaluateOnNewDocument((storageKey, themeMode) => {
        localStorage.setItem(storageKey, JSON.stringify({ version: 1, themeMode, selectedVoice: null }));
      }, key, state.theme);
      await page.goto(base + state.route, { waitUntil: 'networkidle0' });
      await page.waitForSelector(byId('app-theme'));
      if (state.route === '/letter-quiz') await page.waitForSelector(byId('quiz-choice-3'));
      if (state.action === 'convert') await page.type(byId('converter-input'), 'CV34 7AP');
      if (state.action === 'answer') {
        await page.click(byId('quiz-choice-0'));
        await page.waitForSelector(byId('quiz-answer'));
        await pause(16000); // Real provider can reach the bounded missing-callback result.
      }
      if (state.action === 'voices') await pause(4000);
      if (state.action === 'audio') {
        const names = await page.$$eval('[role="button"]', nodes => nodes.map(node => node.getAttribute('aria-label')));
        const testName = names.find(name => /sound test|test audio|play.*test|test sound/i.test(name || ''));
        if (!testName) throw new Error(`Sound-test control missing: ${JSON.stringify(names)}`);
        await page.click(button(testName));
        await pause(17000);
      }
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const text = await page.evaluate(() => document.body.innerText);
      if (text.includes('Loading settings…') || text.trim().length < 50) throw new Error(`Blank/loading capture ${state.file}`);
      const image = path.join(output, state.file);
      await page.screenshot({ path: image, fullPage: false });
      captures.push({ ...state, action: undefined, browser: browserVersion, os: `${os.type()} ${os.release()} ${os.arch()}`,
        title: await page.title(), text, bytes: fs.statSync(image).size,
        sha256: crypto.createHash('sha256').update(fs.readFileSync(image)).digest('hex') });
      console.log(`CAPTURE ${state.file}: ${state.width}x${state.height}, ${state.theme}, ${state.route}`);
      await context.close();
    }
    const bundle = fs.readdirSync(path.join(build, 'assets')).find(file => /^app-.*\.js$/.test(file));
    const metadata = { date: '2026-11-16', capturedAt: new Date().toISOString(), build, bundle,
      bundleSha256: crypto.createHash('sha256').update(fs.readFileSync(path.join(build, 'assets', bundle))).digest('hex'),
      browser: browserVersion, platform: 'web', os: `${os.type()} ${os.release()} ${os.arch()}`, captures, errors };
    fs.writeFileSync(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
    if (errors.length) throw new Error(`Browser errors: ${JSON.stringify(errors)}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
