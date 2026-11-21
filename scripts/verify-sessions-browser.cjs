// Real production DOM, with a controlled speech provider to expose stale callbacks.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');
const { staticHandler } = require('./serve-web.cjs');
const out = path.resolve(process.argv[3] || 'docs/evidence/run08');
const shots = path.join(out, 'screenshots/web');
fs.mkdirSync(shots, { recursive: true });
const server = http.createServer(staticHandler(path.resolve(process.argv[2] || 'dist')));
const id = name => `[data-testid="${name}"]`;
const button = name => `[role="button"][aria-label="${name}"]`;
const captures = [];
async function enlargeText(page) {
  // Real text-only enlargement at the same CSS viewport. R25 tiles consume the
  // root text scale as one proportional composition; applying independent text
  // overrides would test an intentionally unsupported broken composition.
  // Surrounding UI still uses px styles and receives matching 200% enlargement.
  await page.evaluate(() => {
    const enlarged = new WeakSet();
    const nodes = [...document.querySelectorAll('body *')].filter(node => (
      [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()) || node.matches('input,textarea')));
    window.__textScaleCheck = nodes.map(node => ({ node, before: parseFloat(getComputedStyle(node).fontSize) }));
    const root = document.documentElement;
    root.style.fontSize = `${parseFloat(getComputedStyle(root).fontSize) * 2}px`;
    const resize = () => {
      const targets = [...document.querySelectorAll('body *')].filter(node => !enlarged.has(node) && !node.closest('[data-nato-tile]') && (
        [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()) || node.matches('input,textarea')));
      const sizes = targets.map(node => ({ node, size: parseFloat(getComputedStyle(node).fontSize), line: parseFloat(getComputedStyle(node).lineHeight) }));
      for (const { node, size, line } of sizes) {
        node.style.setProperty('font-size', `${size * 2}px`, 'important');
        if (Number.isFinite(line)) node.style.setProperty('line-height', `${line * 2}px`, 'important');
        enlarged.add(node);
      }
    };
    resize();
    new MutationObserver(resize).observe(document.body, { childList: true, subtree: true });
  });
  await page.waitForFunction(() => window.__textScaleCheck.every(({ node, before }) => parseFloat(getComputedStyle(node).fontSize) >= before * 2 - 0.1));
  return page.evaluate(() => window.__textScaleCheck.map(({ node, before }) => ({ before, after: parseFloat(getComputedStyle(node).fontSize) })));
}

async function assertTextContained(page, selector) {
  const overflowing = await page.$$eval(selector, controls => controls.flatMap(control => {
    const box = control.getBoundingClientRect();
    return [...control.querySelectorAll('*')].filter(node => [...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())).flatMap(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return [...range.getClientRects()].filter(rect => rect.width > 0 && (rect.left < box.left - 1 || rect.right > box.right + 1 || rect.top < box.top - 1 || rect.bottom > box.bottom + 1))
        .map(rect => ({ control: control.getAttribute('aria-label'), text: node.textContent, controlWidth: box.width, left: rect.left - box.left, right: rect.right - box.right }));
    });
  }));
  assert.deepEqual(overflowing, [], `Text remains inside ${selector}`);
}


(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  const { NATO_ALPHABET } = await import(pathToFileURL(path.resolve('src/data/natoData.js')));
  try {
    for (const state of [{ theme: 'light', width: 1280, height: 900 }, { theme: 'dark', width: 320, height: 568 }]) {
      const page = await browser.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });
      await page.setViewport(state);
      await page.evaluateOnNewDocument(theme => {
        localStorage.setItem('nato.preferences.v1', JSON.stringify({ version: 1, themeMode: theme, selectedVoice: null }));
        const mock = { calls: [], pending: [], stale: [] };
        window.__quizSpeech = mock;
        Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: class { constructor(text) { this.text = text; } } });
        Object.defineProperty(window, 'speechSynthesis', { value: {
          getVoices: () => [], addEventListener() {}, removeEventListener() {},
          speak(u) { mock.calls.push(u.text); mock.pending.push(u); queueMicrotask(() => u.onstart?.({})); },
          cancel() { mock.stale.push(...mock.pending.map(u => u.onend)); mock.pending = []; },
        } });
      }, state.theme);
      await page.goto(`http://127.0.0.1:${server.address().port}/letter-quiz`, { waitUntil: 'networkidle0' });
      const capture = async name => {
        const file = `${state.theme}-${state.width}-${name}.png`;
        await page.screenshot({ path: path.join(shots, file) });
        captures.push({ file, ...state, state: name, textScale: state.width === 320 && name !== 'setup' ? 2 : 1, browser: await browser.version(), capturedAt: new Date().toISOString(), command: 'node scripts/verify-sessions-browser.cjs dist docs/evidence/run08' });
      };
      const click = async selector => {
        await page.waitForSelector(selector);
        await page.$eval(selector, el => el.scrollIntoView({ block: 'center' }));
        await page.click(selector);
      };
      const text = selector => page.$eval(selector, el => el.textContent);
      const calls = () => page.evaluate(() => window.__quizSpeech.calls.length);
      const stopped = async () => {
        await page.waitForFunction(() => window.__quizSpeech.pending.length === 0);
        const before = await calls();
        await page.evaluate(() => { for (const end of window.__quizSpeech.stale.splice(0)) end?.({}); });
        assert.equal(await calls(), before, 'Stale speech completion starts no audio');
      };
      await page.waitForSelector(id('quiz-start'));
      await capture('setup');
      if (state.width === 320) { await enlargeText(page); await assertTextContained(page, '[role="button"], [role="radio"]'); await capture('setup-200-percent'); }
      await click('[role="radio"][aria-label="5 questions"]');
      await click(id('quiz-start'));
      const missed = [];
      const seen = [];
      for (let i = 0; i < 5; i++) {
        await page.waitForFunction(n => document.querySelector('[data-testid="quiz-progress"]')?.textContent.startsWith(`Question ${n} of 5`), {}, i + 1);
        await page.waitForSelector(id('quiz-letter'));
        const letter = (await text(id('quiz-letter'))).trim();
        const entry = NATO_ALPHABET.find(e => e.letter === letter);
        seen.push(letter);
        assert.equal(await page.$(id('quiz-answer')), null);
        const cdp = await page.createCDPSession();
        const tree = await cdp.send('Accessibility.getFullAXTree');
        assert.equal(tree.nodes.some(n => !n.ignored && n.name?.value === entry.pronunciation), false);
        await cdp.detach();
        if (i === 0) await capture('question');
        const choice = i % 2 ? button(`Choose ${entry.word}`) : await page.evaluate(expected => {
          const node = [...document.querySelectorAll('[data-testid^="quiz-choice-"]')].find(el => el.getAttribute('aria-label') !== `Choose ${expected}`);
          return `[data-testid="${node.getAttribute('data-testid')}"]`;
        }, entry.word);
        if (!(i % 2)) missed.push(letter);
        const before = await calls();
        await page.$eval(choice, el => { el.scrollIntoView({ block: 'center' }); el.click(); el.click(); });
        await page.waitForSelector(id('quiz-answer'));
        await page.waitForFunction(n => window.__quizSpeech.calls.length === n, {}, before + 1);
        assert.equal(await calls(), before + 1, 'Rapid submission scores/speaks once');
        assert.ok((await text(id('quiz-progress'))).includes(`${Math.ceil(i / 2)} correct`));
        if (i === 0) {
          await click(button('Stop playback'));
          await click(button('Replay answer'));
          await page.waitForFunction(n => window.__quizSpeech.calls.length === n, {}, before + 2);
          await click(button('Menu'));
          await stopped();
          await click(button('Letter Quiz'));
          assert.ok(await page.$(id('quiz-answer')), 'Feedback survives Menu/Back');
          await capture('feedback');
        }
        await page.$eval(id('quiz-next'), el => { el.scrollIntoView({ block: 'center' }); el.click(); el.click(); });
        await stopped();
      }
      assert.equal(new Set(seen).size, 5);
      await page.waitForSelector(id('quiz-results'));
      assert.match(await text(id('quiz-score')), /2 correct of 5 answered · 40%/);
      await page.$eval(id('quiz-results'), el => el.scrollIntoView({ block: 'start' }));
      await assertTextContained(page, '[role="button"], [role="radio"]');
      await capture('results');
      await click(id('quiz-retry'));
      const retried = [];
      for (let i = 0; i < missed.length; i++) {
        await page.waitForSelector(id('quiz-letter'));
        const letter = (await text(id('quiz-letter'))).trim(); retried.push(letter);
        await click(button(`Choose ${NATO_ALPHABET.find(e => e.letter === letter).word}`));
        await click(id('quiz-next'));
      }
      assert.deepEqual(retried.sort(), missed.sort());
      assert.match(await text(id('quiz-score')), /3 correct of 3 answered · 100%/);
      assert.equal(await page.$(id('quiz-retry')), null, 'Perfect retry offers no empty round');
      await page.$eval(id('quiz-results'), el => el.scrollIntoView({ block: 'start' }));
      await capture('retry-complete');
      await click(button('Choose a new round'));
      assert.match(await text(id('quiz-score')), /100%/, 'Choosing keeps recap until Start');
      await click('[role="radio"][aria-label="26 questions"]');
      await click(id('quiz-start'));
      const coverage = [];
      for (let i = 0; i < 26; i++) {
        await page.waitForSelector(id('quiz-letter'));
        const letter = (await text(id('quiz-letter'))).trim();coverage.push(letter);
        await click(button(`Choose ${NATO_ALPHABET.find(e => e.letter === letter).word}`));
        await click(id('quiz-next'));
      }
      assert.equal(new Set(coverage).size, 26, 'Full round reaches each letter once');
      assert.match(await text(id('quiz-score')), /26 correct of 26 answered · 100%/);
      await click(button('Choose a new round')); await click(id('quiz-start'));
      await click(button('End round and review'));
      assert.match(await text(id('quiz-score')), /0 correct of 0 answered · 0%/);
      assert.ok((await text(id('quiz-results'))).includes('Round ended early'));
      await page.$eval(id('quiz-results'), el => el.scrollIntoView({ block: 'start' }));
      await capture('ended-early');
      assert.deepEqual(errors, [], 'No hydration or runtime errors');
      console.log(`PASS ${state.theme} ${state.width}: setup, 5/26 coverage, scoring, duplicate submit/Next, concealment, replay/navigation/stale audio, recap, Retry, full-deck reset and early exit`);
      await page.close();
    }
    fs.writeFileSync(path.join(shots, 'sessions-metadata.json'), JSON.stringify(captures, null, 2) + '\n');
  } finally {
    server.closeAllConnections();server.close();await browser.close();
  }
})().catch(error => { console.error(error); server.closeAllConnections();server.close();process.exitCode = 1; });
