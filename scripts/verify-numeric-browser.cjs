// Production DOM verification; speech is controlled to measure canonical inputs and stale events.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { staticHandler } = require('./serve-web.cjs');
const puppeteer = require('puppeteer-core');
const out = path.resolve(process.argv[3] || 'docs/evidence/run11');
const shots = path.join(out, 'screenshots/web');
fs.mkdirSync(shots, { recursive: true });
const server = http.createServer(staticHandler(path.resolve(process.argv[2] || 'dist')));
const id = value => `[data-testid="${value}"]`;
const named = value => `[aria-label="${value}"]`;
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
  const { NATO_NUMBERS, NATO_ALPHABET } = await import(pathToFileURL(path.resolve('src/data/natoData.js')));
  const entries = [...NATO_NUMBERS, ...NATO_ALPHABET];
  const entryFor = symbol => entries.find(e => (e.letter || e.digit) === symbol);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await puppeteer.launch({ executablePath: process.env.BROWSER_EXECUTABLE, headless: true });
  try {
    for (const state of [{theme:'light',width:1280,height:900}, {theme:'dark',width:320,height:568}]) {
      const context = await browser.createBrowserContext();
      const page = await context.newPage();
      await page.setViewport(state);
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
      await page.evaluateOnNewDocument(theme => {
        localStorage.setItem('nato.preferences.v1', JSON.stringify({version:1,themeMode:theme,selectedVoice:null}));
        window.__numericSpeech = {calls:[], pending:[], stale:[]};
        Object.defineProperty(window, 'SpeechSynthesisUtterance', {value:class {constructor(text){this.text=text;}}});
        Object.defineProperty(window, 'speechSynthesis', {value:{
          getVoices:()=>[], addEventListener(){},removeEventListener(){},
          speak(u){window.__numericSpeech.calls.push(u.text);window.__numericSpeech.pending.push(u);queueMicrotask(()=>u.onstart?.({}));},
          cancel(){window.__numericSpeech.stale.push(...window.__numericSpeech.pending.map(u=>u.onend));window.__numericSpeech.pending=[];},
        }});
      },state.theme);
      const visit = async route => page.goto(`http://127.0.0.1:${server.address().port}/${route}`,{waitUntil:'networkidle0'});
      const click = async selector => {await page.waitForSelector(selector);await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));await page.click(selector);};
      const text = selector => page.$eval(selector,e=>e.textContent.trim());
      const capture = async name => {
        const file = `${state.theme}-${state.width}-${name}.png`;
        await page.screenshot({path:path.join(shots,file)});
        captures.push({file,...state,state:name,textScale:state.width===320?2:1,browser:await browser.version(),capturedAt:new Date().toISOString(),command:`node scripts/verify-numeric-browser.cjs ${process.argv.slice(2).join(' ')}`});
      };
      await visit('alphabet');await page.waitForSelector(id('alphabet-A'));
      if(state.width===320)await enlargeText(page);
      await click(named('Digits 0–9'));await page.waitForSelector(id('digit-9'));
      assert.equal(await page.$$eval('[data-testid^="digit-"][data-nato-tile]',els=>els.length),10);
      for(const symbol of ['0','3','5','9']){
        await click(id(`digit-${symbol}`));
        await page.waitForFunction(expected=>window.__numericSpeech.calls.at(-1)===expected,{},entryFor(symbol).speechText);
      }
      await page.$eval(id('digit-0'),e=>e.scrollIntoView({block:'start'}));await capture('digit-reference');
      const geometry=await page.$$eval('[data-testid^="digit-"][data-nato-tile]',els=>els.map(e=>{const r=e.getBoundingClientRect();return {id:e.dataset.testid,w:r.width,h:r.height};}));
      for(const tile of geometry)assert.ok(Math.abs(tile.w/tile.h-11/15)<.001);
      await click(named('Letters A–Z'));assert.equal(await page.$(id('digits-grid')),null);
      assert.equal(await page.evaluate(()=>window.__numericSpeech.pending.length),0,'Switching reference stops audio');
      await visit('letter-quiz');await page.waitForSelector(id('quiz-start'));if(state.width===320)await enlargeText(page);
      assert.equal(await page.$eval(id('practice-letters'),e=>e.getAttribute('aria-checked')),'true');
      await click(id('practice-digits'));
      assert.equal(await page.$eval(id('practice-digits'),e=>e.getAttribute('aria-checked')),'true');
      assert.equal(await page.$eval(id('practice-letters'),e=>e.getAttribute('aria-checked')),'false');
      const radioTree=await page.createCDPSession();
      const ax=await radioTree.send('Accessibility.getFullAXTree');await radioTree.detach();
      assert.ok(ax.nodes.some(n=>!n.ignored&&n.role?.value==='radio'&&n.name?.value==='Digits'&&n.properties?.some(p=>p.name==='checked'&&String(p.value.value)==='true')));
      await assertTextContained(page,'[role="button"], [role="radio"]');
      await page.$eval(id('practice-digits'),e=>e.scrollIntoView({block:'center'}));await capture('numeric-setup');
      await click(id('quiz-start'));
      const missed=[],seen=[];
      for(let i=0;i<10;i++){
        await page.waitForSelector(id('quiz-letter'));const symbol=await text(id('quiz-letter'));seen.push(symbol);
        assert.match(symbol,/^[0-9]$/);const entry=entryFor(symbol);
        assert.equal(await page.$(id('quiz-answer')),null);
        const cdp=await page.createCDPSession();const tree=await cdp.send('Accessibility.getFullAXTree');await cdp.detach();
        assert.equal(tree.nodes.some(n=>!n.ignored&&n.name?.value===entry.pronunciation),false);
        if(i===0){await page.$eval(id('quiz-card'),e=>e.scrollIntoView({block:'start'}));await capture('numeric-question');}
        const wrong=i===0||symbol==='9';if(wrong)missed.push(symbol);
        const choice=wrong?await page.$eval('[data-testid="quiz-choice-0"]',(e,word)=>e.getAttribute('aria-label')===`Choose ${word}`?'quiz-choice-1':'quiz-choice-0',entry.word):null;
        const selector=choice?id(choice):named(`Choose ${entry.word}`);
        const before=await page.evaluate(()=>window.__numericSpeech.calls.length);
        await page.$eval(selector,e=>{e.scrollIntoView({block:'center'});e.click();e.click();});
        await page.waitForSelector(id('quiz-answer'));
        await page.waitForFunction(count=>window.__numericSpeech.calls.length===count,{},before+1);
        assert.equal(await page.evaluate(()=>window.__numericSpeech.calls.at(-1)),entry.speechText);
        if(i===0){
          await click(named('Stop playback'));
          await click(named('Replay answer'));await click(named('Menu'));await click(named('Letter Quiz'));
          assert.ok(await page.$(id('quiz-answer')));await assertTextContained(page,'[role="button"], [role="radio"]');
          await page.$eval(id('quiz-next'),e=>e.scrollIntoView({block:'center'}));await capture('numeric-feedback');
        }
        await click(id('quiz-next'));
      }
      assert.equal(new Set(seen).size,10);
      assert.ok((await text(id('quiz-score'))).startsWith(`${10-missed.length} correct of 10 answered`));
      await page.$eval(id('quiz-results'),e=>e.scrollIntoView({block:'start'}));await capture('numeric-results');
      await click(id('quiz-retry'));const retried=[];
      for(let i=0;i<missed.length;i++){const symbol=await text(id('quiz-letter'));retried.push(symbol);await click(named(`Choose ${entryFor(symbol).word}`));await click(id('quiz-next'));}
      assert.deepEqual(retried.sort(),missed.sort());assert.match(await text(id('quiz-score')),/100%/);
      await click(named('Choose a new round'));await click(id('practice-mixed'));await click(named('36 questions'));await click(id('quiz-start'));
      const mixed=[];
      for(let i=0;i<36;i++){const symbol=await text(id('quiz-letter'));mixed.push(symbol);await click(named(`Choose ${entryFor(symbol).word}`));await click(id('quiz-next'));}
      assert.equal(new Set(mixed).size,36);assert.match(await text(id('quiz-score')),/36 correct of 36 answered · 100%/);
      await page.$eval(id('quiz-results'),e=>e.scrollIntoView({block:'start'}));await capture('mixed-results');
      for(const [practice,example,size] of [['postcode','SW1A 1AA',4],['callsign','N359AB',6]]){
        await click(named('Choose a new round'));await click(id(`practice-${practice}`));
        await click(named('Hear example'));assert.equal(await page.evaluate(()=>window.__numericSpeech.calls.at(-1)),practice==='postcode'?'Sierra':'November');
        await page.$eval(id('practice-example-text'),e=>e.scrollIntoView({block:'center'}));await capture(`${practice}-example`);
        assert.ok((await text(id('practice-example-text'))).includes(practice==='postcode'?'/':'Three Five Nine'));
        await click(id('quiz-start'));const symbols=[];
        for(let i=0;i<size;i++){const symbol=await text(id('quiz-letter'));symbols.push(symbol);await click(named(`Choose ${entryFor(symbol).word}`));await click(id('quiz-next'));}
        assert.equal(new Set(symbols).size,size);assert.ok((await text(id('quiz-score'))).startsWith(`${size} correct of ${size} answered`));
        assert.ok((await text(id('quiz-results'))).includes(example));
      }
      await page.$eval(id('quiz-results'),e=>e.scrollIntoView({block:'start'}));await capture('callsign-results');
      await assertTextContained(page,'[role="button"], [role="radio"]');
      const calls=await page.evaluate(()=>window.__numericSpeech.calls.length);
      await page.evaluate(()=>window.__numericSpeech.stale.splice(0).forEach(end=>end?.({})));
      assert.equal(await page.evaluate(()=>window.__numericSpeech.calls.length),calls,'No stale example/answer audio after completion');
      assert.deepEqual(errors,[]);
      console.log(`PASS ${state.theme} ${state.width}: ten digits/raster ratio/special speech, 10/36 coverage, score/retry/concealment/Menu, example sets/audio cancellation, controls contained`);
      await context.close();
    }
    fs.writeFileSync(path.join(shots,'metadata.json'),JSON.stringify(captures,null,2)+'\n');
  }finally{server.closeAllConnections();server.close();await browser.close();}
})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});
