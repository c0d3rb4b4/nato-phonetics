// R25 production DOM/font/layout checks and actual browser screenshots.
// NODE_PATH=/isolated/puppeteer/node_modules BROWSER_EXECUTABLE=/browser \
//   node scripts/verify-tiles-browser.cjs dist [evidence-directory]
// Initial screenshots are platform-specific baselines, not evidence of a diff
// against a prior design. Measurements remain executable on subsequent builds.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const http = require('node:http');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer-core');
const { staticHandler } = require('./serve-web.cjs');

const root = path.resolve(__dirname, '..');
const build = path.resolve(process.argv[2] || 'dist');
const evidence = path.resolve(process.argv[3] || process.env.TILE_EVIDENCE_DIR || 'artifacts/tile-browser');
const output = path.join(evidence, 'screenshots/web');
const baseline = process.env.TILE_BASELINE_DIR ? path.resolve(process.env.TILE_BASELINE_DIR) : null;
const quizSeed = process.env.TILE_QUIZ_SEED === undefined ? null : Number(process.env.TILE_QUIZ_SEED);
const byId = name => `[data-testid="${name}"]`;
const tileSelector = '[data-nato-tile]';
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const near = (actual, expected, description, tolerance = 0.075) => assert.ok(Math.abs(actual - expected) <= tolerance,
  `${description}: expected ${expected}, actual ${actual}, tolerance ${tolerance}`);
function contrastRatio(foreground, background) {
  const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(value => {
    const component = value / 255;
    return component <= 0.04045 ? component / 12.92 : ((component + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
  const values = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

// This is an independent numeric copy of the versioned design contract. A
// component edit cannot silently update the expected measurements with itself.
const contract = {
  width: 110, height: 150, radius: 12, headerHeight: 60, divider: 2,
  letter: { x: 0, y: 4, width: 110, height: 50, fontSize: 36, lineHeight: 50, weight: '800', style: 'normal', baseline: 40.844 },
  word: { x: 8, y: 83, width: 94, height: 22, fontSize: 16, lineHeight: 22, weight: '600', style: 'normal', baseline: 99.264 },
  pronunciation: { x: 8, y: 111, width: 94, height: 16, fontSize: 11, lineHeight: 16, weight: '400', style: 'italic', baseline: 122.619 },
};

async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
}

function stopPlaybackIfActive(page) {
  // Speech can finish and unmount Stop between two browser commands.
  return page.evaluate(() => document.querySelector('[aria-label="Stop playback"]')?.click());
}

// Root rem enlargement changes the complete tile composition. The surrounding
// UI still uses px styles, so those text nodes receive the same real text-only
// enlargement explicitly. No tile node gets an independent font override.
async function enlargeText(page, multiplier = 2) {
  const result = await page.evaluate(scale => {
    const before = [...document.querySelectorAll('[data-nato-tile] [data-testid$="-word-run"]')].map(node => parseFloat(getComputedStyle(node).fontSize));
    const rootSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    document.documentElement.style.fontSize = `${rootSize * scale}px`;
    const enlarged = new WeakSet();
    const apply = () => {
      for (const node of document.querySelectorAll('body *')) {
        if (enlarged.has(node) || node.closest('[data-nato-tile]')) continue;
        if (![...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim()) && !node.matches('input,textarea')) continue;
        const computed = getComputedStyle(node);
        const size = parseFloat(computed.fontSize);
        const line = parseFloat(computed.lineHeight);
        node.style.setProperty('font-size', `${size * scale}px`, 'important');
        if (Number.isFinite(line)) node.style.setProperty('line-height', `${line * scale}px`, 'important');
        enlarged.add(node);
      }
    };
    apply();
    new MutationObserver(apply).observe(document.body, { childList: true, subtree: true });
    return { before };
  }, multiplier);
  await page.waitForFunction(scale => Math.abs(document.querySelector('[data-nato-tile]').getBoundingClientRect().width - 110 * scale) < 0.1, {}, multiplier);
  return { ...result, after: await page.$$eval('[data-nato-tile] [data-testid$="-word-run"]', nodes => nodes.map(node => parseFloat(getComputedStyle(node).fontSize))) };
}

async function measure(page) {
  return page.$$eval(tileSelector, nodes => nodes.map(tile => {
    const rect = tile.getBoundingClientRect();
    const style = getComputedStyle(tile);
    const id = tile.getAttribute('data-testid');
    const child = suffix => tile.querySelector(`[data-testid="${id}-${suffix}"]`) ||
      (suffix === 'letter' ? tile.querySelector('[data-testid="quiz-letter"]') : null);
    const fields = {};
    for (const name of ['letter', 'word', 'pronunciation']) {
      const boxNode = child(name);
      if (!boxNode) continue;
      const node = boxNode.querySelector('[data-testid$="-run"], [data-testid="quiz-letter"]') || boxNode;
      const box = boxNode.getBoundingClientRect();
      const textStyle = getComputedStyle(node);
      const range = document.createRange();
      range.selectNodeContents(node);
      const ink = [...range.getClientRects()].filter(value => value.width > 0).map(value => ({ x: value.x - rect.x, y: value.y - rect.y, width: value.width, height: value.height }));
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize} ${textStyle.fontFamily}`;
      const metrics = context.measureText(node.textContent);
      // An empty inline box has its bottom on the actual line baseline. Remove
      // it immediately, before capture; this does not substitute design values
      // for browser measurements or change the text/image being tested.
      const marker = document.createElement('span');
      marker.style.cssText = 'display:inline-block;width:0;height:0;padding:0;margin:0;border:0;vertical-align:baseline';
      node.append(marker);
      const baseline = marker.getBoundingClientRect().top - rect.y;
      marker.remove();
      fields[name] = { text: node.textContent, x: box.x - rect.x, y: box.y - rect.y, width: box.width, height: box.height,
        fontFamily: textStyle.fontFamily, fontSize: parseFloat(textStyle.fontSize), lineHeight: parseFloat(textStyle.lineHeight),
        fontWeight: textStyle.fontWeight, fontStyle: textStyle.fontStyle, letterSpacing: textStyle.letterSpacing,
        color: textStyle.color, textAlign: textStyle.textAlign, overflow: textStyle.overflow, whiteSpace: textStyle.whiteSpace, baseline, ink,
        glyphs: { width: metrics.width, ascent: metrics.actualBoundingBoxAscent, descent: metrics.actualBoundingBoxDescent,
          fontAscent: metrics.fontBoundingBoxAscent, fontDescent: metrics.fontBoundingBoxDescent } };
    }
    const header = child('header');
    const headerBox = header.getBoundingClientRect();
    return { id, x: rect.x, y: rect.y, width: rect.width, height: rect.height, radius: parseFloat(style.borderTopLeftRadius),
      backgroundColor: style.backgroundColor, flexGrow: style.flexGrow, flexShrink: style.flexShrink,
      header: { x: headerBox.x - rect.x, y: headerBox.y - rect.y, width: headerBox.width, height: headerBox.height,
        divider: parseFloat(getComputedStyle(header).borderBottomWidth) }, fields };
  }));
}

function assertGeometry(tiles, scale, entries, concealed = false, dpr = 1) {
  assert.ok(tiles.length > 0, 'Tiles rendered');
  for (const tile of tiles) {
    const label = `${tile.id} @${scale}`;
    near(tile.width, contract.width * scale, `${label} width`);
    near(tile.height, contract.height * scale, `${label} height`);
    near(tile.width / tile.height, 11 / 15, `${label} ratio`, 0.0005);
    near(tile.radius, contract.radius * scale, `${label} radius`);
    near(tile.header.width, contract.width * scale, `${label} header width`);
    near(tile.header.height, contract.headerHeight * scale, `${label} header height`);
    near(tile.header.divider, contract.divider * scale, `${label} divider`);
    assert.equal(tile.flexGrow, '0', `${label} never stretches last row`);
    assert.equal(tile.flexShrink, '0', `${label} never shrinks composition`);
    const symbol = tile.fields.letter?.text;
    const entry = entries.find(value => (value.letter || value.digit) === symbol);
    assert.ok(entry, `${label} canonical symbol ${symbol}`);
    const expectedRgb = entry.color.match(/\w\w/g).map(value => parseInt(value, 16));
    assert.equal(tile.backgroundColor, `rgb(${expectedRgb.join(', ')})`, `${label} original palette`);
    if (concealed) {
      assert.equal(tile.fields.word, undefined, `${label} concealed word is unmounted`);
      assert.equal(tile.fields.pronunciation, undefined, `${label} concealed guide is unmounted`);
    } else {
      assert.equal(tile.fields.word.text, entry.word, `${label} canonical word`);
      assert.equal(tile.fields.pronunciation.text, entry.pronunciation, `${label} pronunciation`);
    }
    for (const [name, actual] of Object.entries(tile.fields)) {
      const expected = contract[name];
      for (const metric of ['x', 'y', 'width', 'height', 'fontSize', 'lineHeight']) near(actual[metric], expected[metric] * scale, `${label} ${name}.${metric}`);
      // Native and browser line rasterizers round ascent/descent separately;
      // only the baseline permits one physical pixel of rounding. The
      // containing boxes and declared font metrics retain the 0.075px gate.
      near(actual.baseline, expected.baseline * scale, `${label} ${name}.baseline`, 1 / dpr);
      assert.equal(actual.fontWeight, expected.weight, `${label} ${name} weight`);
      assert.equal(actual.fontStyle, expected.style, `${label} ${name} face`);
      const expectedFamily = { letter: 'NatoTile-ExtraBold', word: 'NatoTile-SemiBold', pronunciation: 'NatoTile-Italic' }[name];
      assert.equal(actual.fontFamily.replaceAll('"', ''), expectedFamily, `${label} ${name} pinned font family`);
      assert.equal(actual.color, name === 'pronunciation' ? 'rgb(55, 65, 81)' : 'rgb(31, 41, 51)', `${label} ${name} specified readable foreground`);
      const contrast = contrastRatio(actual.color, tile.backgroundColor);
      actual.contrastRatio = contrast;
      assert.ok(contrast >= 4.5, `${label} ${name} contrast ${contrast.toFixed(3)}:1 must meet4.5:1`);
      assert.equal(actual.textAlign, 'center', `${label} ${name} centered`);
      assert.ok(actual.letterSpacing === 'normal' || parseFloat(actual.letterSpacing) === 0, `${label} ${name} no tracking override`);
      assert.ok(actual.glyphs.width <= expected.width * scale + 0.1, `${label} ${name} glyph width fits without wrap/autoshrink`);
      for (const ink of actual.ink) {
        assert.ok(ink.x >= -0.5 && ink.x + ink.width <= tile.width + 0.5, `${label} ${name} horizontal text containment`);
        assert.ok(ink.y >= -0.5 && ink.y + ink.height <= tile.height + 0.5, `${label} ${name} vertical text containment`);
      }
    }
  }
}

async function actualFonts(page) {
  const cdp = await page.createCDPSession();
  await cdp.send('DOM.enable');
  await cdp.send('CSS.enable');
  const { root: document } = await cdp.send('DOM.getDocument');
  const result = {};
  for (const name of ['letter', 'word', 'pronunciation']) {
    const selector = name === 'letter' ? `${tileSelector} [data-testid$="-letter-run"], ${tileSelector} [data-testid="quiz-letter"]` : `${tileSelector} [data-testid$="-${name}-run"]`;
    const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: document.nodeId, selector });
    if (!nodeId) continue;
    const { fonts } = await cdp.send('CSS.getPlatformFontsForNode', { nodeId });
    assert.ok(fonts.length && fonts.every(font => font.isCustomFont), `${name} actually renders a bundled custom font, no system fallback`);
    result[name] = fonts;
  }
  await cdp.detach();
  return result;
}

async function reachable(page, selector) {
  return page.$eval(selector, node => {
    node.scrollIntoView({ block: 'center', inline: 'center' });
    const box = node.getBoundingClientRect();
    let left = 0, right = innerWidth, top = 0, bottom = innerHeight;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      const style = getComputedStyle(parent);
      const rect = parent.getBoundingClientRect();
      if (/(auto|scroll|hidden)/.test(style.overflowX)) { left = Math.max(left, rect.left); right = Math.min(right, rect.right); }
      if (/(auto|scroll|hidden)/.test(style.overflowY)) { top = Math.max(top, rect.top); bottom = Math.min(bottom, rect.bottom); }
    }
    return { x: box.x, y: box.y, width: box.width, height: box.height, left, right, top, bottom,
      fits: box.left >= left - 1 && box.right <= right + 1 && box.top >= top - 1 && box.bottom <= bottom + 1 };
  });
}

async function overflowEdges(page, selector) {
  const results = [];
  for (const edge of ['start', 'end']) {
    const result = await page.$eval(selector, (node, alignment) => {
      node.scrollIntoView({ block: 'center', inline: alignment });
      const box = node.getBoundingClientRect();
      let left = 0, right = innerWidth;
      for (let parent = node.parentElement; parent; parent = parent.parentElement) {
        if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowX)) {
          const clip = parent.getBoundingClientRect();
          left = Math.max(left, clip.left); right = Math.min(right, clip.right);
        }
      }
      return { alignment, tileLeft: box.left, tileRight: box.right, clipLeft: left, clipRight: right };
    }, edge);
    near(edge === 'start' ? result.tileLeft : result.tileRight, edge === 'start' ? result.clipLeft : result.clipRight, `${selector} ${edge} overflow edge reachable`, 1);
    results.push(result);
  }
  return results;
}

async function main() {
  assert.ok(quizSeed === null || Number.isInteger(quizSeed), 'Optional quiz seed must be an integer');
  assert.notEqual(output, baseline, 'Capture output must not overwrite an approved visual baseline');
  fs.mkdirSync(output, { recursive: true });
  const { NATO_ALPHABET, NATO_NUMBERS } = await import(pathToFileURL(path.join(root, 'src/data/natoData.js')));
  const entries = [...NATO_ALPHABET, ...NATO_NUMBERS];
  const server = http.createServer(staticHandler(build));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  const cases = [
    { name: 'alphabet-desktop-light', route: '/alphabet', width: 1280, height: 1100, theme: 'light', dpr: 1 },
    { name: 'alphabet-tablet-dark', route: '/alphabet', width: 768, height: 1024, theme: 'dark', dpr: 2 },
    { name: 'alphabet-narrow-light', route: '/alphabet', width: 320, height: 568, theme: 'light', dpr: 2 },
    { name: 'alphabet-phone-dark', route: '/alphabet', width: 430, height: 932, theme: 'dark', dpr: 3 },
    { name: 'alphabet-landscape-light', route: '/alphabet', width: 932, height: 430, theme: 'light', dpr: 3 },
    { name: 'alphabet-narrow-200-dark', route: '/alphabet', width: 320, height: 568, theme: 'dark', dpr: 2, scale: 2 },
    { name: 'alphabet-narrow-300-overflow-light', route: '/alphabet', width: 320, height: 568, theme: 'light', dpr: 2, scale: 3 },
    { name: 'alphabet-tablet-200-light', route: '/alphabet', width: 1024, height: 768, theme: 'light', dpr: 2, scale: 2 },
    { name: 'converter-all-desktop-light', route: '/converter', width: 1280, height: 1200, theme: 'light', dpr: 1 },
    { name: 'converter-narrow-dark', route: '/converter', width: 320, height: 568, theme: 'dark', dpr: 2 },
    { name: 'converter-narrow-200-light', route: '/converter', width: 320, height: 568, theme: 'light', dpr: 2, scale: 2 },
    { name: 'quiz-narrow-light', route: '/letter-quiz', width: 320, height: 568, theme: 'light', dpr: 2 },
    { name: 'quiz-narrow-200-dark', route: '/letter-quiz', width: 320, height: 568, theme: 'dark', dpr: 2, scale: 2 },
  ].filter(state => !process.env.TILE_CASE_FILTER || new RegExp(process.env.TILE_CASE_FILTER).test(state.name));
  assert.ok(cases.length, 'At least one selected browser case');
  const checks = [], captures = [], errors = [], comparisons = [];
  let browser;
  const capture = async (page, state, suffix, extra = {}) => {
    await settle(page);
    const file = `${state.name}${suffix ? '-' + suffix : ''}.png`;
    const text = await page.evaluate(() => document.body.innerText);
    assert.ok(!text.includes('Loading tile fonts') && text.trim().length > 50, `Nonblank application capture ${file}`);
    await page.screenshot({ path: path.join(output, file) });
    captures.push({ file, ...state, ...extra, controlledRandomSeed: state.route === '/letter-quiz' ? quizSeed : null,
      browser: await browser.version(), bytes: fs.statSync(path.join(output, file)).size, sha256: sha256(path.join(output, file)) });
    // Quizzes choose a random symbol/option order, so their actual captures have
    // numeric/AX gates but are not compared to an unrelated random image.
    if (baseline && (state.route !== '/letter-quiz' || quizSeed !== null)) {
      const sharp = require('sharp');
      const expected = await sharp(path.join(baseline, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      const actual = await sharp(path.join(output, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      assert.deepEqual(actual.info, expected.info, `${file} baseline dimensions and channels`);
      let changed = 0;
      for (let offset = 0; offset < actual.data.length; offset += actual.info.channels) {
        if (Array.from({ length: actual.info.channels }, (_, channel) => Math.abs(actual.data[offset + channel] - expected.data[offset + channel])).some(value => value > 32)) changed += 1;
      }
      const changedFraction = changed / (actual.info.width * actual.info.height);
      comparisons.push({ file, changedPixels: changed, changedFraction, channelTolerance: 32, maximumChangedFraction: 0.005 });
      assert.ok(changedFraction <= 0.005, `${file} raster difference ${(changedFraction * 100).toFixed(3)}% exceeds 0.5% tolerance`);
    }
  };
  try {
    browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true,
      args: ['--no-first-run', '--disable-background-networking'] });
    if (baseline) {
      const metadata = JSON.parse(fs.readFileSync(path.join(baseline, 'metadata.json'), 'utf8'));
      assert.equal(metadata.os, `${os.type()} ${os.release()} ${os.arch()}`, 'Visual baseline must match the OS/rasterizer; use numeric gates on other targets until their own baseline is captured');
      assert.equal(metadata.browser, await browser.version(), 'Visual baseline must match browser engine/version');
      if (quizSeed !== null) for (const capture of metadata.captures.filter(value => value.route === '/letter-quiz')) {
        assert.equal(capture.controlledRandomSeed, quizSeed, 'Quiz baseline must use the same explicit test-driver seed');
      }
    }
    for (const state of cases) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      page.setDefaultTimeout(20000);
      page.on('pageerror', error => errors.push({ case: state.name, error: error.message }));
      await page.setViewport({ width: state.width, height: state.height, deviceScaleFactor: state.dpr });
      await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: state.theme }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
      await page.evaluateOnNewDocument(theme => localStorage.setItem('nato.preferences.v1', JSON.stringify({
        version: 1, themeMode: theme, selectedVoice: null, converterDisplay: 'cards',
      })), state.theme);
      if (state.route === '/letter-quiz' && quizSeed !== null) await page.evaluateOnNewDocument(seed => {
        // Test-driver determinism only: the production app, DOM and provider are
        // unchanged. This permits actual quiz screenshots to be compared later.
        let current = seed >>> 0;
        Math.random = () => { current = (1664525 * current + 1013904223) >>> 0; return current / 2 ** 32; };
      }, quizSeed);
      await page.goto(base + state.route, { waitUntil: 'networkidle0' });
      if (state.route === '/letter-quiz') { await page.waitForSelector(byId('quiz-start')); await page.click(byId('quiz-start')); }
      if (state.route === '/converter') await page.type(byId('converter-input'), state.name.includes('all') ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' : 'NWUJ359');
      await page.waitForSelector(tileSelector);
      if (state.scale) {
        const sizes = await enlargeText(page, state.scale);
        assert.ok(sizes.before.every((size, i) => Math.abs(sizes.after[i] - size * state.scale) < 0.1), `${state.name} actual text size increases proportionally`);
      }
      await settle(page);
      let tiles = await measure(page);
      if (state.route === '/alphabet') assert.equal(tiles.length, 26, `${state.name} all 26 letters`);
      if (state.name.includes('converter-all')) {
        assert.equal(tiles.length, 24, `${state.name} first card page`);
        assertGeometry(tiles, state.scale || 1, entries, false, state.dpr);
        checks.push({ ...state, state: 'page-1', tiles, fonts: await actualFonts(page) });
        await capture(page, state, 'page-1');
        await reachable(page, '[aria-label="Next page"]');
        await page.click('[aria-label="Next page"]');
        await settle(page);
        const secondPage = await measure(page);
        assert.equal(secondPage.length, 12, `${state.name} second card page`);
        assert.equal(new Set([...tiles, ...secondPage].map(tile => tile.fields.letter.text)).size, 36, 'All symbols covered across pages');
        tiles = secondPage;
      }
      assertGeometry(tiles, state.scale || 1, entries, state.route === '/letter-quiz', state.dpr);
      const fonts = await actualFonts(page);
      checks.push({ ...state, tiles, fonts });
      await capture(page, state, 'first');
      if (state.route === '/letter-quiz') {
        assert.equal(await page.$(byId('quiz-answer')), null, 'Quiz answer is not mounted before choosing');
        const cdp = await page.createCDPSession();
        const tree = await cdp.send('Accessibility.getFullAXTree');
        const entry = NATO_ALPHABET.find(value => value.letter === tiles[0].fields.letter.text);
        assert.ok(!tree.nodes.some(node => !node.ignored && node.name?.value === entry.pronunciation), 'Unrevealed pronunciation is absent from accessibility tree');
        for (let i = 0; i < 4; i += 1) assert.ok((await reachable(page, byId(`quiz-choice-${i}`))).fits, `${state.name} choice ${i} reachable`);
        await page.click(byId('quiz-choice-0'));
        await page.waitForSelector(byId('quiz-answer'));
        await stopPlaybackIfActive(page);
        await settle(page);
        const revealed = await measure(page);
        assertGeometry(revealed, state.scale || 1, entries, false, state.dpr);
        checks.push({ ...state, state: 'revealed', tiles: revealed, fonts: await actualFonts(page) });
        assert.ok((await reachable(page, byId('quiz-card'))).fits, `${state.name} revealed tile reachable`);
        await capture(page, state, 'revealed');
        assert.ok((await reachable(page, '[aria-label="Next question"]')).fits, `${state.name} Next reachable`);
        await capture(page, state, 'feedback');
        await cdp.detach();
      } else {
        const last = tiles[tiles.length - 1];
        if (state.scale > 2) {
          const edges = await overflowEdges(page, byId(last.id));
          checks.push({ ...state, name: `${state.name}-edges`, edges });
          await capture(page, state, 'last-right-edge');
          await page.$eval(byId(last.id), node => node.scrollIntoView({ block: 'center', inline: 'start' }));
          await capture(page, state, 'last-left-edge');
        } else {
          assert.ok((await reachable(page, byId(last.id))).fits, `${state.name} complete last tile reachable`);
          await capture(page, state, 'last');
        }
      }
      if (state.name === 'alphabet-desktop-light') {
        await page.setViewport({ width: 568, height: 320, deviceScaleFactor: 1 });
        await settle(page);
        const resized = await measure(page);
        assertGeometry(resized, 1, entries);
        assert.ok((await reachable(page, byId('alphabet-Z'))).fits, 'Live window resize preserves reachable last tile');
        checks.push({ ...state, name: 'alphabet-live-window-resize', width: 568, height: 320, tiles: resized });
        await capture(page, { ...state, name: 'alphabet-live-window-resize', width: 568, height: 320 }, 'last');
        await page.setViewport({ width: state.width, height: state.height, deviceScaleFactor: state.dpr });
        await page.$eval(byId('alphabet-C'), node => node.scrollIntoView({ block: 'center' }));
        const tile = await page.$(byId('alphabet-C'));
        const box = await tile.boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        try {
          await page.waitForSelector(byId('alphabet-C-interaction-ring'));
          await settle(page);
          const opacity = await page.$eval(byId('alphabet-C'), node => {
            const values = [];
            for (let current = node; current; current = current.parentElement) values.push({ tag: current.tagName, opacity: getComputedStyle(current).opacity });
            return values;
          });
          assert.ok(opacity.every(value => Number(value.opacity) === 1), 'Pointer-held tile and ancestors preserve full opacity and contrast');
          const ringWidth = await page.$eval(byId('alphabet-C-interaction-ring'), node => parseFloat(getComputedStyle(node).borderTopWidth));
          assert.ok(ringWidth === 2 || ringWidth === 3, 'Pointer-held feedback ring is visible inside fixed geometry');
          const pressed = await measure(page);
          assertGeometry(pressed, 1, entries, false, state.dpr);
          checks.push({ ...state, state: 'pointer-held', opacity, ringWidth, tiles: pressed });
          await capture(page, state, 'pressed', { interaction: 'Actual mouse down held on Charlie; no opacity fade' });
        } finally {
          await page.mouse.up();
          await page.$eval(byId('alphabet-C'), node => node.blur());
          await stopPlaybackIfActive(page);
        }
      }
      console.log(`PASS ${state.name}: ${tiles.length} tiles, fixed geometry/typography, custom fonts, reachable content`);
      await context.close();
    }
    const failureContext = await browser.createBrowserContext();
    const failurePage = await failureContext.newPage();
    await failurePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
    await failurePage.setRequestInterception(true);
    failurePage.on('request', request => request.url().endsWith('.ttf') ? request.abort('failed') : request.continue());
    await failurePage.goto(base + '/alphabet', { waitUntil: 'networkidle0' });
    await failurePage.waitForFunction(() => document.querySelector('[role="alert"]')?.textContent.includes('Tile fonts could not load'));
    assert.equal((await failurePage.$$(tileSelector)).length, 0, 'Missing font shows a visible error instead of fallback tiles');
    await capture(failurePage, { name: 'alphabet-font-load-error', route: '/alphabet', width: 390, height: 844, theme: 'system', dpr: 2 }, '');
    checks.push({ name: 'blocked-font-request', visibleError: true, renderedFallbackTiles: 0 });
    console.log('PASS blocked bundled font request: visible error and zero silent-fallback tiles');
    await failureContext.close();
    assert.deepEqual(errors, [], 'No browser runtime errors');
    const assets = [
      ...fs.readdirSync(path.join(build, 'assets')).map(file => ({ file: `assets/${file}`, sha256: sha256(path.join(build, 'assets', file)) })),
      ...fs.readdirSync(build).filter(file => file.endsWith('.ttf')).map(file => ({ file, sha256: sha256(path.join(build, file)) })),
    ];
    fs.writeFileSync(path.join(evidence, 'web-tile-measurements.json'), JSON.stringify({ contract, checks, comparisons, errors }, null, 2) + '\n');
    fs.writeFileSync(path.join(output, 'metadata.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), capturedAt: new Date().toISOString(), platform: 'web',
      os: `${os.type()} ${os.release()} ${os.arch()}`, browser: await browser.version(),
      command: `${quizSeed === null ? '' : `TILE_QUIZ_SEED=${quizSeed} `}node scripts/verify-tiles-browser.cjs ${build} ${evidence}`,
      selectedCaseFilter: process.env.TILE_CASE_FILTER || null, baseline, assets, captures, inspection: 'pending' }, null, 2) + '\n');
    console.log(`PASS ${checks.length} measured states; ${captures.length} actual screenshots. Visual inspection remains separate.`);
  } finally {
    if (browser) {
      const closed = browser.close();
      const timer = setTimeout(() => browser.process()?.kill('SIGKILL'), 10000);
      await closed.finally(() => clearTimeout(timer));
    }
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
