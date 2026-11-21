// Production DOM; real browser clipboard plus controlled Web Share/speech edges.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const puppeteer = require('puppeteer-core');
const { staticHandler } = require('./serve-web.cjs');
const out = path.resolve(process.argv[3] || 'artifacts/converter-browser');
const shots = path.join(out, 'screenshots/web');
fs.mkdirSync(shots, { recursive: true });
const server = http.createServer(staticHandler(path.resolve(process.argv[2] || 'dist')));
const id = name => `[data-testid="${name}"]`;
const button = name => `[role="button"][aria-label="${name}"]`;
const captures = [];
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  try {
    await browser.defaultBrowserContext().overridePermissions(origin, ['clipboard-read', 'clipboard-sanitized-write']);
    for (const state of [{ theme: 'light', width: 1280, height: 900 }, { theme: 'dark', width: 320, height: 568 }]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.setViewport(state);
      await page.evaluateOnNewDocument(theme => {
        localStorage.setItem('nato.preferences.v1', JSON.stringify({ version: 1, themeMode: theme, selectedVoice: null }));
        const mock = { calls: [], pending: [], stale: [] };
        window.__converterSpeech = mock;
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
        Object.defineProperty(window, 'speechSynthesis', { value: {
          getVoices: () => [], addEventListener() {}, removeEventListener() {},
          speak(u) { mock.calls.push(u.text); mock.pending.push(u); queueMicrotask(() => u.onstart?.({})); },
          cancel() { mock.stale.push(...mock.pending.map(u => u.onend)); mock.pending = []; },
        } });
      }, state.theme);
      await page.goto(origin + '/converter', { waitUntil: 'networkidle0' });
      const click = async selector => {
        await page.waitForSelector(selector);
        await page.$eval(selector, el => el.scrollIntoView({ block: 'center' }));
        await page.click(selector);
      };
      const text = () => page.$eval(id('converter-plain-text'), el => el.textContent);
      const expectMessage = message => page.waitForFunction(value => document.body.textContent.includes(value), {}, message);
      const input = async value => {
        await page.$eval(id('converter-input'), (el, value) => {
          Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(el, value);
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }, value);
      };
      const capture = async name => {
        const file = `${state.theme}-${state.width}-${name}.png`;
        await page.screenshot({ path: path.join(shots, file) });
        captures.push({ file, ...state, state: name, browser: await browser.version(), capturedAt: new Date().toISOString(), command: 'node scripts/verify-converter-browser.cjs', arguments: process.argv.slice(2), provider: 'controlled speech; real browser clipboard; share branches explicitly controlled' });
      };
      await page.waitForSelector(id('converter-input'));
      assert.equal(await page.$eval(button('Play Full Phrase'), el => el.getAttribute('aria-disabled')), 'true');
      assert.equal(await page.$(id('converter-output')), null);
      await capture('empty');
      await input('CV34');
      await page.waitForSelector(id('converter-output'));
      assert.deepEqual(await page.$$eval(`${id('converter-output')} [role="button"]`, nodes => nodes.map(node => node.textContent)),
        ['Charlie', 'Victor', 'Three', 'Four']);
      assert.equal(await page.$('[data-nato-tile]'), null, 'The default output uses word-only bubbles');
      await capture('bubbles');
      await input('a3\t b-!é🛰');
      const expected = 'Alfa Three / Bravo dash [not spoken: "!" U+0021] [not spoken: "é" U+00E9] [not spoken: "🛰" U+1F6F0]';
      await click(button('Copy or share'));
      await page.waitForFunction(value => document.querySelector('[data-testid="converter-plain-text"]').textContent === value, {}, expected);
      await click(button('Copy conversion'));
      await expectMessage('Copied conversion.');
      assert.equal(await page.evaluate(() => navigator.clipboard.readText()), expected, 'Actual browser clipboard equals visible conversion');
      await capture('copied');
      // Actual installed desktop browser has no Web Share; make that branch deterministic for CI too.
      await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: undefined }));
      await click(button('Share conversion')); await expectMessage('Sharing is unavailable here.'); await capture('share-fallback');
      await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async value => { window.__shared = value; } }));
      await click(button('Share conversion')); await expectMessage('Share sheet opened.');
      assert.equal(await page.evaluate(() => window.__shared.text), expected);
      await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new DOMException('Cancelled', 'AbortError'); } }));
      await click(button('Share conversion')); await expectMessage('Sharing cancelled.');
      await page.evaluate(() => Object.defineProperty(navigator, 'share', { configurable: true, value: async () => { throw new Error('Denied'); } }));
      await click(button('Share conversion')); await expectMessage('Could not open sharing. Use Copy conversion');
      await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: async () => { throw new Error('Denied'); } }));
      await click(button('Copy conversion')); await expectMessage('Could not copy. Select the plain text conversion'); await capture('copy-denied');
      // A late export result cannot claim to have copied the edited conversion.
      await page.evaluate(() => Object.defineProperty(navigator.clipboard, 'writeText', { configurable: true, value: () => new Promise(resolve => { window.__finishCopy = resolve; }) }));
      await click(button('Copy conversion')); await input('j');
      await page.evaluate(() => window.__finishCopy());
      assert.equal(await text(), 'Juliett');
      assert.equal(await page.evaluate(() => document.body.textContent.includes('Copied conversion.')), false);
      await click(button('Copy conversion'));
      await click(button('Menu')); await click(button('Word Converter'));
      await page.evaluate(() => window.__finishCopy());
      assert.equal(await page.evaluate(() => document.body.textContent.includes('Copied conversion.')), false, 'Blur invalidates pending export status');
      await input('a3 b-');
      await click(button('Play Full Phrase'));
      for (let i = 0; i < 4; i++) {
        await page.waitForFunction(count => window.__converterSpeech.calls.length === count, {}, i + 1);
        await page.evaluate(() => window.__converterSpeech.pending.shift().onend?.({}));
      }
      assert.deepEqual(await page.evaluate(() => window.__converterSpeech.calls), ['Alfa', 'tree', 'Bravo', 'dash']);
      await click(button('Play Full Phrase')); await page.waitForFunction(() => window.__converterSpeech.pending.length > 0);
      await input('b');
      await page.waitForFunction(() => window.__converterSpeech.pending.length === 0);
      const before = await page.evaluate(() => window.__converterSpeech.calls.length);
      await page.evaluate(() => window.__converterSpeech.stale.splice(0).forEach(end => end?.({})));
      assert.equal(await page.evaluate(() => window.__converterSpeech.calls.length), before);
      await click(button('Play Full Phrase')); await page.waitForFunction(() => window.__converterSpeech.pending.length > 0);
      await input('');
      await page.waitForFunction(() => window.__converterSpeech.pending.length === 0);
      assert.equal(await page.$eval(id('converter-input'), el => el.value), '');
      assert.equal(await page.$(id('converter-0')), null);
      await input('cv34 7ap');
      await click(button('Menu')); await click(button('Settings')); await click('[role="radio"][aria-label="Full cards"]');
      await page.waitForFunction(() => JSON.parse(localStorage.getItem('nato.preferences.v1')).converterDisplay === 'cards');
      await click(button('Word Converter'));
      assert.equal(await page.$eval(id('converter-input'), el => el.value), 'cv34 7ap');
      await page.waitForSelector(`${id('converter-0')}[data-nato-tile]`);
      await page.$eval(id('converter-output'), el => el.scrollIntoView({ block: 'start' }));
      await capture('cards');
      if (state.width === 320) {
        // Text-only 200% enlargement, with existing proportional R25 tile scale.
        await page.evaluate(() => {
          const targets = [...document.querySelectorAll('body *')].filter(node => !node.closest('[data-nato-tile]') && ([...node.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()) || node.matches('textarea')));
          const sizes = targets.map(node => ({ node, size: parseFloat(getComputedStyle(node).fontSize), line: parseFloat(getComputedStyle(node).lineHeight) }));
          document.documentElement.style.fontSize = '32px';
          for (const { node, size, line } of sizes) { node.style.setProperty('font-size', `${size * 2}px`, 'important'); if (Number.isFinite(line)) node.style.setProperty('line-height', `${line * 2}px`, 'important'); }
        });
        await page.$eval(id('converter-plain-text'), el => el.scrollIntoView({ block: 'start' })); await capture('plain-200-percent');
        const clipped = await page.$$eval('[role="button"]', nodes => nodes.filter(n => !n.closest('[aria-hidden="true"]') && (n.scrollHeight > n.clientHeight + 2 || n.scrollWidth > n.clientWidth + 2)).map(n => n.getAttribute('aria-label')));
        assert.deepEqual(clipped, []);
        await page.$eval(button('Share conversion'), el => el.scrollIntoView({ block: 'center' })); await capture('controls-200-percent');
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${state.theme} ${state.width}: default bubbles, full-card setting, canonical exports, clipboard/share, audio and tab draft retention`);
      await page.close();
    }
    fs.writeFileSync(path.join(shots, 'metadata.json'), JSON.stringify(captures, null, 2) + '\n');
  } finally { server.closeAllConnections(); server.close(); await browser.close(); }
})().catch(error => { console.error(error); server.closeAllConnections(); server.close(); process.exitCode = 1; });
