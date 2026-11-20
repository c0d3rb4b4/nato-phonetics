// Exported-app regression checks. Uses an isolated, disposable browser context.
// Set NODE_PATH to an external puppeteer-core install and BROWSER_EXECUTABLE.
// Optional BROWSER_SCREENSHOT_DIR captures review images. --flows-only and
// --audio-only are scoped diagnostics; CI always runs the full default suite.
// Speech mocks below check control flow, never pronunciation or provider privacy.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');

const root = path.resolve(process.argv[2] || 'dist');
const audioOnly = process.argv.includes('--audio-only');
const flowsOnly = process.argv.includes('--flows-only') || audioOnly;
const screenshotDirectory = process.env.BROWSER_SCREENSHOT_DIR;
if (screenshotDirectory) fs.mkdirSync(screenshotDirectory, { recursive: true });
const preferenceKey = 'nato.preferences.v1';
const colors = { dark: 'rgb(31, 41, 51)', light: 'rgb(255, 253, 247)' };
const byTestId = name => `[data-testid="${name}"]`;
const button = name => `[role="button"][aria-label="${name}"]`;
const radio = name => `[role="radio"][aria-label="${name}"]`;
const { staticHandler } = require('./serve-web.cjs');
const server = http.createServer(staticHandler(root));

function htmlRoutes(directory, prefix = '') {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.isDirectory()) return htmlRoutes(path.join(directory, entry.name), `${prefix}/${entry.name}`);
    if (!entry.name.endsWith('.html')) return [];
    return [entry.name === 'index.html' ? prefix || '/' : `${prefix}/${entry.name.slice(0, -5)}`];
  }).sort();
}

async function ready(page, expectedTheme) {
  try { await page.waitForSelector(byTestId('app-theme')); }
  catch (error) {
    console.error('Page readiness failed:', page.url(), await page.evaluate(() => ({ title: document.title, text: document.body.innerText.slice(0, 1000) })));
    throw error;
  }
  if (expectedTheme) await page.waitForFunction(expected => {
    const app = document.querySelector('[data-testid="app-theme"]');
    return app && getComputedStyle(app).backgroundColor === expected;
  }, {}, colors[expectedTheme]);
  await page.waitForFunction(() => document.title.trim().length > 0);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

async function visit(page, base, route, expectedTheme) {
  const response = await page.goto(base + route, { waitUntil: 'domcontentloaded' });
  assert.equal(response.status(), 200, `Export serves ${route}`);
  await ready(page, expectedTheme);
}

async function seed(page, values) {
  await page.evaluateOnNewDocument((key, preferences) => {
    // Seed once per context; do not undo writes made by the application on reload.
    if (!localStorage.getItem('browser-test-seeded')) {
      localStorage.setItem(key, JSON.stringify({ version: 1, themeMode: 'system', selectedVoice: null, ...preferences }));
      localStorage.setItem('browser-test-seeded', 'yes');
    }
  }, preferenceKey, values);
}

async function keyboardActivate(page, selector, key = 'Enter') {
  // Reach the control by Tab, so an element that is merely programmatically
  // focusable does not accidentally pass the keyboard acceptance check.
  await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
  let found = false;
  for (let i = 0; i < 100; i += 1) {
    await page.keyboard.press('Tab');
    if (await page.evaluate(target => document.activeElement?.matches(target), selector)) { found = true; break; }
  }
  assert.equal(found, true, `Tab reaches ${selector}`);
  await page.keyboard.press(key);
}

async function assertReachable(page, selector) {
  await page.$eval(selector, node => node.scrollIntoView({ block: 'center', inline: 'nearest' }));
  const rect = await page.$eval(selector, node => {
    const box = node.getBoundingClientRect();
    let top = 0;
    let bottom = innerHeight;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowY)) {
        const clip = parent.getBoundingClientRect();
        top = Math.max(top, clip.top);
        bottom = Math.min(bottom, clip.bottom);
      }
    }
    return { top: box.top, bottom: box.bottom, left: box.left, right: box.right, clipTop: top, clipBottom: bottom, width: innerWidth };
  });
  assert.ok(rect.top >= rect.clipTop - 1 && rect.bottom <= rect.clipBottom + 1, `${selector} vertically reachable: ${JSON.stringify(rect)}`);
  assert.ok(rect.left >= -1 && rect.right <= rect.width + 1, `${selector} horizontally contained: ${JSON.stringify(rect)}`);
}

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

const screenshotMetadata = [];
async function screenshot(page, name) {
  if (!screenshotDirectory) return;
  await page.screenshot({ path: path.join(screenshotDirectory, `${name}.png`) });
  const state = await page.evaluate(() => ({
    background: getComputedStyle(document.querySelector('[data-testid="app-theme"]')).backgroundColor,
    textScale: window.__textScaleCheck ? 2 : 1,
  }));
  screenshotMetadata.push({ file: `${name}.png`, state: name, ...page.viewport(), ...state,
    browser: await page.browser().version(), capturedAt: new Date().toISOString(),
    command: `node scripts/verify-app-browser.cjs ${process.argv.slice(2).join(' ')}` });
  fs.writeFileSync(path.join(screenshotDirectory, 'app-metadata.json'), JSON.stringify(screenshotMetadata, null, 2) + '\n');
}

async function contrast(page, selector) {
  return page.$eval(selector, node => {
    const color = getComputedStyle(node.querySelector('div') || node).color;
    const background = getComputedStyle(node).backgroundColor;
    const luminance = value => {
      const [r, g, b] = value.match(/[\d.]+/g).slice(0, 3).map(Number).map(channel => {
        const c = channel / 255;
        return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      });
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const values = [luminance(color), luminance(background)].sort((a, b) => b - a);
    return { ratio: (values[0] + 0.05) / (values[1] + 0.05), color, background };
  });
}

function installSpeechMock(options = {}) {
  const listeners = new Set();
  const callbacks = new WeakMap();
  const state = {
    calls: [], pending: [], cancelled: 0, failEnumeration: !!options.failEnumeration,
    failSpeech: false, voices: options.empty ? [] : [
      { voiceURI: 'british-default', name: 'British Default', lang: 'en-GB', localService: true, default: true },
      { voiceURI: 'american-network', name: 'American Network', lang: 'en-US', localService: false, default: false },
      { voiceURI: 'australian-local', name: 'Australian Local', lang: 'en-AU', localService: true, default: false },
      { voiceURI: 'french-local', name: 'French Local', lang: 'fr-FR', localService: true, default: false },
    ],
  };
  const synth = {
    get speaking() { return state.pending.length > 0; },
    getVoices() { if (state.failEnumeration) throw new Error('Injected voice lookup failure'); return state.voices; },
    speak(utterance) {
      state.calls.push({ text: utterance.text, voice: utterance.voice?.voiceURI ?? null });
      if (state.failSpeech) { queueMicrotask(() => utterance.onerror?.({ error: 'synthesis-failed' })); return; }
      state.pending.push(utterance);
      callbacks.set(utterance, utterance.onend);
      queueMicrotask(() => utterance.onstart?.({}));
    },
    cancel() {
      state.cancelled += 1;
      // Keep cancelled callbacks deliberately available to test stale onend.
      state.stale = [...(state.stale || []), ...state.pending.map(utterance => callbacks.get(utterance))];
      state.pending = [];
    },
    addEventListener(event, listener) { if (event === 'voiceschanged') listeners.add(listener); },
    removeEventListener(event, listener) { if (event === 'voiceschanged') listeners.delete(listener); },
    pause() {}, resume() {}, onvoiceschanged: null,
  };
  state.finish = () => { const utterance = state.pending.shift(); utterance?.onend?.({}); };
  state.finishStale = () => { for (const onend of state.stale || []) onend?.({}); state.stale = []; };
  state.changeVoices = () => { for (const listener of listeners) listener(); synth.onvoiceschanged?.(); };
  Object.defineProperty(window, 'speechSynthesis', { configurable: true, value: synth });
  // Real Chromium utterance.voice rejects plain fixture objects; both halves
  // of the provider boundary are mocked here, while production DOM/UI is real.
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { configurable: true, value: class {
    constructor(text) { this.text = text; this.voice = null; }
  } });
  window.__speechTest = state;
}

async function audioPage(browser, base, options = {}, preferences = {}) {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  await seed(page, preferences);
  await page.evaluateOnNewDocument(installSpeechMock, options);
  await page.setViewport({ width: 375, height: 667 });
  return { context, page };
}

async function waitForCalls(page, number) {
  await page.waitForFunction(count => window.__speechTest.calls.length === count, {}, number);
}

async function replaceInput(page, value) {
  await page.focus('[aria-label="Text to convert"]');
  await page.$eval('[aria-label="Text to convert"]', node => node.select());
  await page.keyboard.type(value);
}

(async () => {
  assert.ok(fs.existsSync(path.join(root, 'index.html')), `Export missing: ${root}`);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  let browser;
  const errors = [];
  try {
    browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true, args: ['--no-first-run', '--disable-background-networking', ...(process.env.CI ? ['--no-sandbox'] : [])] });
    browser.on('targetcreated', async target => {
      const page = await target.page();
      if (page) {
        page.on('pageerror', error => errors.push(`${page.url()}: ${error.message}`));
        page.on('console', message => {
          if (message.type() === 'error' && /hydrat|server rendered|did not match|Minified React error #4(18|23|25)/i.test(message.text())) {
            errors.push(`${page.url()}: ${message.text()}`);
          }
        });
      }
    });
    const routes = flowsOnly ? [] : htmlRoutes(root);
    const titles = new Map();
    for (const mode of flowsOnly ? [] : ['system', 'light', 'dark']) {
      for (const os of ['light', 'dark']) {
        const context = await browser.createBrowserContext();
        const page = await context.newPage();
        page.setDefaultTimeout(10000);
        await page.setViewport({ width: 375, height: 667 });
        await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: os }]);
        await seed(page, { themeMode: mode });
        for (const route of routes) {
          await visit(page, base, route, mode === 'system' ? os : mode);
          const title = await page.title();
          assert.match(title, /NATO|Sitemap|Unmatched|Not Found/i, `Meaningful title for ${route}: ${title}`);
          titles.set(route, title);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await ready(page, mode === 'system' ? os : mode);
          assert.equal(await page.title(), title, `Stable title on reload: ${route}`);
        }
        await context.close();
        console.log(`PASS direct + reload ${routes.length} routes, stored ${mode}, OS ${os}`);
      }
    }
    assert.equal(new Set([...titles.values()]).size, routes.length, 'Every exported route has a distinct meaningful title');
    assert.deepEqual(errors, [], 'No page/hydration errors in all-route theme matrix');
    if (flowsOnly) console.log(`DIAGNOSTIC ${audioOnly ? '--audio-only: layout/keyboard and' : '--flows-only:'} all-route theme/title/reload matrix skipped`);

    if (!audioOnly) {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.setViewport({ width: 320, height: 568 });
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await visit(page, base, '/menu');
    await keyboardActivate(page, button('Back to App'));
    await page.waitForFunction(() => location.pathname === '/');
    await keyboardActivate(page, button('Open menu'), 'Space');
    await page.waitForFunction(() => location.pathname === '/menu');
    await keyboardActivate(page, button('Back to App'));
    await page.waitForFunction(() => location.pathname === '/');
    console.log('PASS direct Menu Home fallback and in-app keyboard Enter/Space navigation');

    await visit(page, base, '/converter');
    await page.type('[aria-label="Text to convert"]', 'AB 359');
    await page.click(button('Open menu'));
    await page.waitForFunction(() => location.pathname === '/menu');
    await page.click(button('Back to App'));
    await page.waitForFunction(() => location.pathname === '/converter');
    assert.equal(await page.$eval('[aria-label="Text to convert"]', node => node.value), 'AB 359', 'Back to App preserves converter input');
    await page.goForward();
    await page.waitForFunction(() => location.pathname === '/menu');
    await page.goBack();
    await page.waitForFunction(() => location.pathname === '/converter');
    assert.equal(await page.$eval('[aria-label="Text to convert"]', node => node.value), 'AB 359', 'Browser Back/Forward preserves converter input');
    await visit(page, base, '/converter.html');
    assert.equal(await page.title(), 'Word Converter · NATO Phonetics');
    await visit(page, base, '/missing-route');
    assert.equal(await page.title(), 'Page Not Found · NATO Phonetics');
    await page.click(button('Go Home'));
    await page.waitForFunction(() => location.pathname === '/');
    console.log('PASS retained converter state, browser Back/Forward, static HTML alias and unknown-route Home recovery');

    await visit(page, base, '/letter-quiz');
    await keyboardActivate(page, byTestId('quiz-start'));
    await page.waitForSelector(byTestId('quiz-choice-3'));
    assert.equal(await page.$(byTestId('quiz-answer')), null, 'Unrevealed answer is not mounted');
    const cdp = await page.createCDPSession();
    const tree = await cdp.send('Accessibility.getFullAXTree');
    const choices = tree.nodes.filter(node => !node.ignored && node.role?.value === 'button' && node.name?.value.startsWith('Choose '));
    assert.equal(choices.length, 4, 'All quiz choices are named AX buttons');
    assert.equal(new Set(choices.map(node => node.name.value)).size, 4, 'Quiz offers four distinct accessible choices');
    const unrevealedCard = await page.$eval(byTestId('quiz-card'), node => node.innerText);
    assert.ok(!unrevealedCard.includes('Correct answer'), 'Quiz card does not disclose its answer');
    const { NATO_ALPHABET } = await import(pathToFileURL(path.resolve(__dirname, '../src/data/natoData.js')));
    const quizLetter = await page.$eval(byTestId('quiz-letter'), node => node.textContent.trim());
    const answer = NATO_ALPHABET.find(entry => entry.letter === quizLetter);
    assert.ok(answer, `Quiz letter is canonical: ${quizLetter}`);
    assert.equal(tree.nodes.some(node => !node.ignored && node.name?.value === answer.pronunciation), false, 'Unrevealed pronunciation is absent from accessibility tree');
    assert.equal(unrevealedCard.includes(answer.word), false, 'Unrevealed word is absent from quiz card');
    for (let i = 0; i < 4; i += 1) await assertReachable(page, byTestId(`quiz-choice-${i}`));
    await assertTextContained(page, '[data-testid^="quiz-choice-"]');
    const enlarged = await enlargeText(page);
    assert.ok(enlarged.length > 0 && enlarged.every(({ before, after }) => after >= before * 2 - 0.1), 'Text is actually enlarged to 200%');
    for (let i = 0; i < 4; i += 1) await assertReachable(page, byTestId(`quiz-choice-${i}`));
    await keyboardActivate(page, byTestId('quiz-choice-3'));
    await page.waitForSelector(byTestId('quiz-answer'));
    await assertReachable(page, byTestId('quiz-answer'));
    assert.equal(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true);
    assert.equal(await page.$eval(byTestId('quiz-card'), node => node.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length), 0, 'Reduced motion does not run a quiz flip');
    await assertReachable(page, button('Next question'));
    await assertTextContained(page, '[data-testid^="quiz-choice-"], [aria-label="Next question"], [data-testid="quiz-card"]');
    assert.equal(await page.$eval(byTestId('quiz-choice-3'), node => node.getAttribute('aria-pressed')), 'true', 'Selected answer exposes pressed state');
    assert.equal(await page.$eval(byTestId('quiz-choice-3'), node => node.getAttribute('aria-disabled')), 'true', 'Submitted choices expose disabled state');
    const retainedFeedback = await page.$eval(byTestId('quiz-answer'), node => node.textContent);
    await page.click(button('Open menu'));
    await page.waitForFunction(() => location.pathname === '/menu');
    await page.click(button('Back to App'));
    await page.waitForFunction(() => location.pathname === '/letter-quiz');
    assert.equal(await page.$eval(byTestId('quiz-answer'), node => node.textContent), retainedFeedback, 'Menu/Back preserves current quiz answer and feedback');
    await page.$eval(byTestId('quiz-card'), node => node.scrollIntoView({ block: 'start' }));
    await screenshot(page, 'quiz-320-200-percent');
    await keyboardActivate(page, button('Next question'));
    await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'heading');
    assert.equal(await page.$(byTestId('quiz-answer')), null, 'Next question conceals answer and focuses its heading');
    console.log('PASS quiz answer absent before selection, AX choice names, 320×568 scrolling, actual 200% text and reduced motion');

    await visit(page, base, '/converter');
    await page.focus('[aria-label="Text to convert"]');
    await page.keyboard.type('AB 359');
    await page.waitForSelector(button('Play Full Phrase'));
    await page.setViewport({ width: 320, height: 300 });
    await assertReachable(page, '[aria-label="Text to convert"]');
    await assertReachable(page, button('Play Full Phrase'));
    await assertReachable(page, button('Play Nine'));
    console.log('PASS converter input/play/output reachability in 320×300 keyboard-sized viewport (not a physical keyboard test)');
    await page.setViewport({ width: 1280, height: 900 });
    await replaceInput(page, 'November 359');
    await screenshot(page, 'converter-desktop');
    await page.setViewport({ width: 320, height: 568 });
    await replaceInput(page, 'NWU');
    await enlargeText(page);
    await assertTextContained(page, '[role="button"][aria-label^="Play "]');
    for (const route of ['/alphabet', '/settings']) {
      await visit(page, base, route);
      await enlargeText(page);
      await assertTextContained(page, '[role="button"], [role="radio"]');
    }
    console.log('PASS 200% text remains within converter/alphabet cards and Settings controls at 320px');
    for (const mode of ['light', 'dark']) {
      await page.evaluate((key, themeMode) => localStorage.setItem(key, JSON.stringify({ version: 1, themeMode, selectedVoice: null })), preferenceKey, mode);
      await visit(page, base, '/menu', mode);
      await assertReachable(page, button('Back to App'));
      const normal = await contrast(page, button('Back to App'));
      assert.ok(normal.ratio >= 4.5, `${mode} primary contrast ${JSON.stringify(normal)}`);
      const control = await page.$(button('Back to App'));
      const box = await control.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.waitForFunction(selector => getComputedStyle(document.querySelector(selector)).backgroundColor === 'rgb(30, 64, 175)', {}, button('Back to App'));
      const pressed = await contrast(page, button('Back to App'));
      assert.ok(pressed.ratio >= 4.5, `${mode} pressed primary contrast ${JSON.stringify(pressed)}`);
      await page.mouse.up();
      console.log(`PASS ${mode} primary normal ${normal.ratio.toFixed(2)}:1 / pressed ${pressed.ratio.toFixed(2)}:1 computed contrast`);
    }
    await context.close();
    }

    const audio = await audioPage(browser, base);
    await visit(audio.page, base, '/converter');
    await audio.page.type('[aria-label="Text to convert"]', 'AB');
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 1);
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 2);
    await audio.page.evaluate(() => { window.__speechTest.finishStale(); window.__speechTest.finish(); });
    await waitForCalls(audio.page, 3);
    assert.deepEqual(await audio.page.evaluate(() => window.__speechTest.calls.map(call => call.text)), ['Alfa', 'Alfa', 'Bravo'], 'Replacement invalidates the old AB queue');
    await audio.page.click(button('Stop playback'));
    await audio.page.evaluate(() => window.__speechTest.finishStale());
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 4);
    await audio.page.focus('[aria-label="Text to convert"]');
    await audio.page.keyboard.type('C');
    await audio.page.evaluate(() => window.__speechTest.finishStale());
    assert.equal(await audio.page.evaluate(() => window.__speechTest.pending.length), 0, 'Editing cancels active speech');
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 5);
    await audio.page.click(button('Open menu'));
    await audio.page.waitForFunction(() => location.pathname === '/menu');
    await audio.page.evaluate(() => window.__speechTest.finishStale());
    assert.equal(await audio.page.evaluate(() => window.__speechTest.pending.length), 0, 'Navigation cancels active speech');
    assert.equal(await audio.page.evaluate(() => window.__speechTest.calls.length), 5, 'Stopped/stale callbacks start no queued words');
    await visit(audio.page, base, '/converter');
    await replaceInput(audio.page, 'A B');
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 1);
    await audio.page.evaluate(() => window.__speechTest.finish());
    await audio.page.click(button('Stop playback'));
    await audio.page.evaluate(() => new Promise(resolve => setTimeout(resolve, 1100)));
    assert.equal(await audio.page.evaluate(() => window.__speechTest.calls.length), 1, 'Stop during word-boundary pause prevents B');
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 2);
    await audio.page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await audio.page.waitForFunction(() => window.__speechTest.pending.length === 0);
    await audio.page.evaluate(() => {
      window.__speechTest.finishStale();
      delete document.hidden;
      document.dispatchEvent(new Event('visibilitychange'));
    });
    assert.equal(await audio.page.evaluate(() => window.__speechTest.calls.length), 2, 'Background visibility stops queued speech');
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 3);
    await audio.page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
    await audio.page.waitForFunction(() => window.__speechTest.pending.length === 0);
    await audio.page.click(button('Play Full Phrase'));
    assert.equal(await audio.page.evaluate(() => window.__speechTest.calls.length), 3, 'Hidden-page play request is rejected');
    await audio.page.evaluate(() => window.dispatchEvent(new Event('pageshow')));
    await audio.page.click(button('Play Full Phrase'));
    await waitForCalls(audio.page, 4);
    await audio.page.click(button('Stop playback'));
    await audio.context.close();
    console.log('PASS mocked speech replacement, Stop (including word pause), edit, navigation and background ownership; stale callbacks cannot resume queues');

    const voices = await audioPage(browser, base, {}, { selectedVoice: 'removed-voice' });
    await visit(voices.page, base, '/voice-select');
    for (const name of ['British Default, en-GB', 'American Network, en-US', 'Australian Local, en-AU']) await voices.page.waitForSelector(radio(name));
    assert.equal(await voices.page.$(radio('French Local, fr-FR')), null, 'Non-English voice excluded');
    await voices.page.waitForFunction(() => /no longer available|unavailable|removed/i.test(document.body.innerText));
    await visit(voices.page, base, '/converter');
    await voices.page.type('[aria-label="Text to convert"]', 'A');
    await voices.page.click(button('Play Full Phrase'));
    await waitForCalls(voices.page, 1);
    assert.equal(await voices.page.evaluate(() => window.__speechTest.calls[0].voice), null, 'Removed voice actually plays with provider default');
    await visit(voices.page, base, '/voice-select');
    await voices.page.click(button('Preview British Default'));
    await waitForCalls(voices.page, 1);
    assert.equal(await voices.page.evaluate(() => window.__speechTest.calls[0].voice), 'british-default');
    await voices.page.click(radio('American Network, en-US'));
    await voices.page.waitForFunction(() => JSON.parse(localStorage.getItem('nato.preferences.v1')).selectedVoice === 'american-network');
    await voices.page.click(radio('Locale en-GB'));
    assert.equal(await voices.page.$(radio('American Network, en-US')), null);
    assert.equal(await voices.page.evaluate(() => JSON.parse(localStorage.getItem('nato.preferences.v1')).selectedVoice), 'american-network', 'Filtering preserves saved voice');
    assert.equal(await voices.page.$eval(byTestId('voice-status'), e => e.textContent.includes('no longer available')), false, 'Filtered voice is not treated as removed');
    await voices.page.type(byTestId('voice-search'), 'default');
    assert.equal(await voices.page.$eval(byTestId('voice-filter-count'), e => e.textContent), 'Showing 1 of 3 English voices.');
    await voices.page.click(button('Preview British Default'));
    await voices.page.type(byTestId('voice-search'), ' no-match');
    await voices.page.waitForFunction(() => window.__speechTest.pending.length === 0);
    assert.equal(await voices.page.$eval(byTestId('voice-filter-count'), e => e.textContent), 'Showing 0 of 3 English voices.');
    assert.ok(await voices.page.$(radio('System Default')));
    await voices.page.setViewport({ width: 1280, height: 900 });
    await voices.page.$eval(byTestId('voice-search'), e => e.scrollIntoView({ block: 'center' }));
    await screenshot(voices.page, 'voice-filters-desktop-no-match');
    await voices.page.click(button('Reset voice filters'));
    await voices.page.waitForSelector(radio('American Network, en-US'));
    assert.equal(await voices.page.$eval(byTestId('voice-search'), e => e.value), '');
    assert.equal(await voices.page.$eval(radio('All English locales'), e => e.getAttribute('aria-checked')), 'true');
    assert.equal(await voices.page.evaluate(() => JSON.parse(localStorage.getItem('nato.preferences.v1')).selectedVoice), 'american-network');
    await voices.page.click(radio('System Default'));
    await voices.page.waitForFunction(() => JSON.parse(localStorage.getItem('nato.preferences.v1')).selectedVoice === null);
    assert.equal(await voices.page.$eval(radio('System Default'), node => node.getAttribute('aria-checked')), 'true');
    await voices.page.setViewport({ width: 320, height: 568 });
    await enlargeText(voices.page);
    await assertTextContained(voices.page, '[role="radio"], [role="button"]');
    await voices.page.$eval(byTestId('voice-list'), node => node.scrollIntoView({ block: 'start' }));
    await screenshot(voices.page, 'voices-320-200-percent');
    await voices.page.type(byTestId('voice-search'), 'zzzz-no-match');
    await assertTextContained(voices.page, '[role="radio"], [role="button"]');
    await assertReachable(voices.page, button('Reset voice filters'));
    await screenshot(voices.page, 'voice-filters-320-200-percent-no-match');
    await voices.page.click(button('Reset voice filters'));
    await voices.page.waitForSelector(radio('British Default, en-GB'));
    console.log('PASS voice search/locale intersection, filter reset, saved-choice independence, Default/no-match, preview cancellation and 200% controls');
    await voices.context.close();

    const failed = await audioPage(browser, base, { failEnumeration: true });
    await visit(failed.page, base, '/voice-select');
    await failed.page.waitForFunction(() => document.querySelector('[data-testid="voice-status"]')?.innerText.includes('Could not load voices'));
    await failed.page.evaluate(() => { window.__speechTest.failEnumeration = false; });
    await failed.page.click(button('Retry voice list'));
    await failed.page.waitForSelector(radio('British Default, en-GB'));
    await failed.page.evaluate(() => { window.__speechTest.failSpeech = true; });
    await failed.page.click(button('Preview British Default'));
    await failed.page.waitForSelector('[role="alert"]');
    await failed.context.close();

    const empty = await audioPage(browser, base, { empty: true });
    await visit(empty.page, base, '/voice-select');
    await empty.page.waitForFunction(() => document.querySelector('[data-testid="voice-status"]')?.innerText.includes('Loading English voices'));
    await empty.page.waitForFunction(() => document.querySelector('[data-testid="voice-status"]')?.innerText.includes('No English voices found'));
    assert.ok(await empty.page.$(radio('System Default')), 'Default remains available without installed English voices');
    await empty.page.evaluate(() => {
      window.__speechTest.voices.push({ voiceURI: 'new-voice', name: 'Installed Voice', lang: 'en-CA', localService: true });
      window.__speechTest.changeVoices();
    });
    await empty.page.click(button('Retry voice list'));
    await empty.page.waitForSelector(radio('Installed Voice, en-CA'));
    await empty.context.close();

    const storage = await audioPage(browser, base);
    await storage.page.evaluateOnNewDocument(key => {
      const getItem = Storage.prototype.getItem;
      Storage.prototype.getItem = function(storageKey) {
        if (storageKey === key) throw new Error('Injected saved-preference read failure');
        return getItem.call(this, storageKey);
      };
    }, preferenceKey);
    await visit(storage.page, base, '/converter');
    await storage.page.type('[aria-label="Text to convert"]', 'A');
    await storage.page.click(button('Play Full Phrase'));
    await waitForCalls(storage.page, 1);
    assert.equal(await storage.page.evaluate(() => window.__speechTest.calls[0].voice), null, 'Failed preference read still permits default speech');
    await storage.context.close();
    console.log('PASS mocked English voice enumeration, empty/loading/retry, removed voice fallback, Default selection, lookup/storage failures and playback error feedback');

    const timeout = await audioPage(browser, base);
    await visit(timeout.page, base, '/converter');
    await timeout.page.type('[aria-label="Text to convert"]', 'AB');
    await timeout.page.click(button('Play Full Phrase'));
    await waitForCalls(timeout.page, 1);
    await timeout.page.waitForSelector('[role="alert"]', { timeout: 20000 });
    await timeout.page.waitForFunction(() => window.__speechTest.pending.length === 0);
    assert.equal(await timeout.page.$(button('Stop playback')), null, 'Missing completion callback does not leave a stuck playing state');
    assert.equal(await timeout.page.evaluate(() => window.__speechTest.calls.length), 1, 'Timeout prevents queued B');
    await timeout.context.close();
    console.log('PASS mocked missing provider callback settles to visible failure within production timeout');
    assert.deepEqual(errors, [], 'No unhandled page errors during browser checks');
    console.log(`PASS ${audioOnly ? 'diagnostic audio only (layout and route matrix UNRUN)' : flowsOnly ? 'diagnostic flows only (route matrix UNRUN)' : 'exported-app regression suite'}. Browser: ${await browser.version()}. Speech pronunciation, native accessibility and real provider/offline behavior remain M11.`);
  } finally {
    // All application assertions are finished. Retire the preview's keep-alive
    // sockets and do not let an already-exited browser strand its IPC transport.
    await new Promise(resolve => {
      server.close(resolve);
      server.closeAllConnections();
    });
    if (browser) {
      let cleanupTimer;
      const closed = await Promise.race([
        browser.close().then(() => true, error => {
          console.warn(`Browser cleanup rejected: ${error.message}`);
          return false;
        }),
        new Promise(resolve => { cleanupTimer = setTimeout(() => resolve(false), 10000); }),
      ]);
      clearTimeout(cleanupTimer);
      if (!closed) {
        console.warn('Browser cleanup did not finish; disconnecting only this test browser.');
        browser.disconnect();
        const ownedProcess = browser.process();
        if (ownedProcess && ownedProcess.exitCode === null && ownedProcess.signalCode === null) {
          ownedProcess.kill('SIGKILL');
        }
      }
    }
  }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
