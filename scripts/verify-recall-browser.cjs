// Production DOM verification; speech is controlled to measure canonical inputs and stale events.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const { staticHandler } = require('./serve-web.cjs');
const puppeteer = require('puppeteer-core');
const out = path.resolve(process.argv[3] || 'docs/evidence/run12');
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
  const {PRACTICE_ENTRIES,entrySymbol}=await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
  const bySymbol=new Map(PRACTICE_ENTRIES.map(e=>[entrySymbol(e),e]));
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
  try {for(const state of [{theme:'light',width:1280,height:900},{theme:'dark',width:320,height:568}]) {
    const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport(state);
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.evaluateOnNewDocument(theme=>{
      localStorage.setItem('nato.preferences.v1',JSON.stringify({version:1,themeMode:theme,selectedVoice:null}));
      window.__recall={calls:[],pending:[],stale:[],fail:false};
      Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
      Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],addEventListener(){},removeEventListener(){},
        speak(u){window.__recall.calls.push(u.text);window.__recall.pending.push(u);queueMicrotask(()=>window.__recall.fail?u.onerror?.({error:'synthesis-failed'}):u.onstart?.({}));},
        cancel(){window.__recall.stale.push(...window.__recall.pending.map(u=>u.onend));window.__recall.pending=[];}}});
    },state.theme);
    const click=async selector=>{await page.waitForSelector(selector);await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));await page.click(selector);};
    const text=selector=>page.$eval(selector,e=>e.textContent.trim());
    const capture=async(name,selector)=>{if(selector)await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));const file=`${state.theme}-${state.width}-${name}.png`;await page.screenshot({path:path.join(shots,file)});captures.push({file,...state,state:name,textScale:state.width===320?2:1,browser:await browser.version(),capturedAt:new Date().toISOString(),command:`node scripts/verify-recall-browser.cjs ${process.argv.slice(2).join(' ')}`});};
    const calls=()=>page.evaluate(()=>window.__recall.calls.length);
    await page.goto(`http://127.0.0.1:${server.address().port}/letter-quiz`,{waitUntil:'networkidle0'});await page.waitForSelector(id('quiz-start'));
    if(state.width===320)await enlargeText(page);
    await click(id('mode-listening'));await click(id('practice-digits'));await click(named('5 questions'));
    await capture('listening-setup',id('mode-listening'));await click(id('quiz-start'));
    const seen=[];
    for(let i=0;i<5;i++) {
      assert.equal(await page.$(id('quiz-card')),null);assert.equal(await page.$(id('quiz-letter')),null);assert.equal(await page.$(id('quiz-code-word')),null);
      await click(id('quiz-listen'));await page.waitForFunction(()=>window.__recall.calls.length>0);
      const spoken=await page.evaluate(()=>window.__recall.calls.at(-1));const entry=PRACTICE_ENTRIES.find(e=>e.speechText===spoken);assert.ok(entry);const symbol=entrySymbol(entry);seen.push(symbol);
      assert.equal(await page.$(id('quiz-answer')),null);
      const cdp=await page.createCDPSession(),ax=await cdp.send('Accessibility.getFullAXTree');await cdp.detach();
      assert.equal(ax.nodes.some(n=>!n.ignored&&[entry.word,entry.pronunciation,`Symbol ${symbol}`].includes(n.name?.value)),false,'Listening answer hidden from AX');
      if(i===0){
        await capture('listening-question',id('quiz-listen'));await click(named('Stop playback'));
        const before=await calls();await click(id('quiz-listen'));assert.equal(await calls(),before+1);
        await click(named('Menu'));await click(named('Letter Quiz'));assert.equal(await page.evaluate(()=>window.__recall.pending.length),0);
        await page.evaluate(()=>{window.__recall.fail=true;});await click(id('quiz-listen'));await page.waitForSelector('[role="alert"]');
        await capture('listening-error',named('Audio Help'));await page.evaluate(()=>{window.__recall.fail=false;});
        await click(named('Show code word as text'));assert.equal(await text(id('quiz-code-word')),entry.word);
        assert.equal(await page.$(id('quiz-card')),null);await capture('listening-text-alternative',id('quiz-code-word'));
        await click(id('quiz-listen'));assert.equal(await page.evaluate(()=>window.__recall.calls.at(-1)),entry.speechText);
      }
      const options=await page.$$eval('[data-testid^="quiz-choice-"]',els=>els.map(e=>e.getAttribute('aria-label').replace('Choose ','')));
      assert.equal(new Set(options).size,4);assert.ok(options.includes(symbol));const selected=i===0?options.find(x=>x!==symbol):symbol;
      await page.$eval(named(`Choose ${selected}`),e=>{e.scrollIntoView({block:'center'});e.click();e.click();});await page.waitForSelector(id('quiz-answer'));
      if(i===0)await capture('listening-feedback',id('quiz-next'));
      await click(id('quiz-next'));
    }
    assert.equal(new Set(seen).size,5);assert.match(await text(id('quiz-score')),/4 correct of 5 answered · 80%/);await capture('listening-results',id('quiz-score'));
    await click(id('quiz-retry'));assert.equal(await page.$(id('quiz-card')),null);await click(named('Show code word as text'));assert.equal(await text(id('quiz-code-word')),bySymbol.get(seen[0]).word);await click(named(`Choose ${seen[0]}`));await click(id('quiz-next'));assert.match(await text(id('quiz-score')),/1 correct of 1 answered · 100%/);
    await click(named('Choose a new round'));await click(id('mode-typed'));await click(id('practice-mixed'));await click(named('36 questions'));await click(id('quiz-start'));
    const typed=[];
    for(let i=0;i<36;i++) {
      const symbol=await text(id('quiz-letter')),entry=bySymbol.get(symbol);typed.push(symbol);
      assert.equal(await page.$(id('quiz-answer')),null);assert.equal(await page.$('[data-testid^="quiz-choice-"]'),null);
      assert.equal(await page.$eval(id('quiz-typed-answer'),e=>e.value),'');
      if(i===0){
        await click(id('quiz-check'));assert.ok((await page.$eval('[role="alert"]',e=>e.textContent)).includes('Enter a code word'));
        await click(id('quiz-typed-answer'));await page.type(id('quiz-typed-answer'),'draft');
        await click(named('Menu'));await click(named('Letter Quiz'));assert.equal(await page.$eval(id('quiz-typed-answer'),e=>e.value),'draft');
        await capture('typed-keyboard',id('quiz-typed-answer'));await page.$eval(id('quiz-typed-answer'),e=>e.select());await page.keyboard.press('Backspace');
      }
      const response=i===0?'wrong':symbol==='A'?' ÁL-PHA! ':symbol==='J'?'ju liet':symbol==='X'?'x ray':entry.word.toUpperCase();
      await click(id('quiz-typed-answer'));await page.type(id('quiz-typed-answer'),response);
      await page.keyboard.press('Enter');await page.waitForSelector(id('quiz-answer'));await page.keyboard.press('Enter');
      assert.ok((await text(id('quiz-progress'))).startsWith(`Question ${i+1} of 36`));
      assert.equal(await text(id('quiz-submitted-answer')),`Your answer: ${response.trim()}`);
      if(i===0)await capture('typed-feedback',id('quiz-next'));
      await click(id('quiz-next'));
    }
    assert.equal(new Set(typed).size,36);assert.match(await text(id('quiz-score')),/35 correct of 36 answered/);await capture('typed-results',id('quiz-score'));
    await click(id('quiz-retry'));assert.equal(await text(id('quiz-letter')),typed[0]);await click(id('quiz-typed-answer'));await page.type(id('quiz-typed-answer'),bySymbol.get(typed[0]).word);await click(id('quiz-check'));await click(id('quiz-next'));assert.match(await text(id('quiz-score')),/100%/);
    await assertTextContained(page,'[role="button"], [role="radio"]');
    const before=await calls();await page.evaluate(()=>window.__recall.stale.splice(0).forEach(end=>end?.({})));assert.equal(await calls(),before);
    assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('nato.')).sort()),['nato.preferences.v1','nato.progress.v1']);
    assert.equal(await page.evaluate(()=>Object.values(JSON.parse(localStorage.getItem('nato.progress.v1')).symbols).reduce((n,row)=>n+row.attempts,0)),43);
    assert.deepEqual(errors,[]);console.log(`PASS ${state.theme} ${state.width}: listening concealment/5 digits/error/retry/text alternative/Menu/Stop; 36 typed symbols/aliases/blank/retention/Enter/score/retry; stale audio, scoped aggregate persistence, contained controls`);
    await context.close();
  }}finally{fs.writeFileSync(path.join(shots,'metadata.json'),JSON.stringify(captures,null,2)+'\n');server.closeAllConnections();server.close();await browser.close();}
})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});
