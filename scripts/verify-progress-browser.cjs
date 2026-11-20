// Real production DOM/storage. Only storage failure branches and speech callbacks are controlled.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {pathToFileURL}=require('node:url'),{staticHandler}=require('./serve-web.cjs'),puppeteer=require('puppeteer-core');
const out=path.resolve(process.argv[3]||'artifacts/progress-browser'),shots=path.join(out,'screenshots/web');fs.mkdirSync(shots,{recursive:true});
const server=http.createServer(staticHandler(path.resolve(process.argv[2]||'dist'))),captures=[];
const id=x=>`[data-testid="${x}"]`,named=x=>`[aria-label="${x}"]`;
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

(async()=>{
 const {PRACTICE_ENTRIES,entrySymbol}=await import(pathToFileURL(path.resolve('src/lib/practiceSets.js')));
 const words=new Map(PRACTICE_ENTRIES.map(e=>[entrySymbol(e),e.word]));
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
 try {for(const state of [{theme:'light',width:1280,height:900},{theme:'dark',width:320,height:568}]){
  const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport(state);
  await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:state.theme}]);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.evaluateOnNewDocument(theme=>{
   if(!localStorage.getItem('progress-test-seeded')){localStorage.setItem('nato.preferences.v1',JSON.stringify({version:1,themeMode:theme,selectedVoice:null,converterPacing:{rate:1.25,wordPauseMs:700}}));localStorage.setItem('progress-test-seeded','yes');localStorage.setItem('unrelated','keep');}
   const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
   Storage.prototype.setItem=function(k,v){if(k==='nato.progress.v1'&&(window.__failProgressWrite || window.__failProgressClear))throw new Error('deliberate quota failure');return set.call(this,k,v);};
   Storage.prototype.removeItem=function(k){if(k==='nato.progress.v1'&&window.__failProgressClear)throw new Error('deliberate deletion failure');return remove.call(this,k);};
   Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
   Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],addEventListener(){},removeEventListener(){},cancel(){},speak(u){queueMicrotask(()=>{u.onstart?.({});u.onend?.({});});}}});
  },state.theme);
  const visit=async route=>{await page.goto(base+route,{waitUntil:'networkidle0'});await page.waitForSelector(id('app-theme'));if(state.width===320)await enlargeText(page);};
  const click=async selector=>{await page.waitForSelector(selector);await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));await page.click(selector);};
  const text=s=>page.$eval(s,e=>e.textContent.trim());
  const capture=async(name,selector)=>{if(selector)await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));const file=`${state.theme}-${state.width}-${name}.png`;await page.screenshot({path:path.join(shots,file)});captures.push({file,...state,state:name,textScale:state.width===320?2:1,browser:await browser.version(),capturedAt:new Date().toISOString(),command:'node scripts/verify-progress-browser.cjs',arguments:process.argv.slice(2)});};
  const saved=()=>page.evaluate(()=>localStorage.getItem('nato.progress.v1'));
  const waitAnswers=n=>page.waitForFunction(n=>Object.values(JSON.parse(localStorage.getItem('nato.progress.v1')||'{"symbols":{}}').symbols).reduce((sum,r)=>sum+r.attempts,0)===n,{},n);
  await visit('/letter-quiz');await click(id('review-due'));assert.equal(await page.$eval(id('quiz-start'),e=>e.getAttribute('aria-disabled')),'true');assert.equal(await saved(),null);
  await capture('empty-due-review',id('review-availability'));await click(id('review-all'));await click(id('practice-digits'));await click(named('5 questions'));await click(id('quiz-start'));
  let missed;
  for(let i=0;i<5;i++){
   await page.waitForSelector(id('quiz-letter'));
   const symbol=await text(id('quiz-letter')),word=words.get(symbol);
   const options=await page.$$eval('[data-testid^="quiz-choice-"]',es=>es.map(e=>e.getAttribute('aria-label').slice(7)));
   const answer=i===0?options.find(w=>w!==word):word;
   if(i===0){missed=symbol;await page.evaluate(()=>{window.__failProgressWrite=true;});}
   await page.$eval(named('Choose '+answer),e=>{e.scrollIntoView({block:'center'});e.click();e.click();});await page.waitForSelector(id('quiz-answer'));
   if(i===0){
    await page.waitForSelector(named('Retry progress storage'));assert.equal(await saved(),null);await capture('save-error',named('Retry progress storage'));
    await page.evaluate(()=>{window.__failProgressWrite=false;});await click(named('Retry progress storage'));await waitAnswers(1);
   }else await waitAnswers(i+1);
   await click(id('quiz-next'));
   if(i<4)await page.waitForSelector(id('quiz-answer'),{hidden:true});else await page.waitForSelector(id('quiz-score'));
  }
  assert.match(await text(id('quiz-score')),/4 correct of 5 answered/);
  await visit('/progress');assert.match(await text(id('progress-summary')),/5 answers saved · 4 correct · 1 errors/);assert.match(await text(id('progress-due')),/5 of 36 symbols practised · 1 due now · 1 need another try/);
  const original=await saved();assert.equal(Object.keys(JSON.parse(original).symbols).length,5);assert.equal(original.includes('answer'),false);await capture('saved-summary',id('progress-summary'));await capture('saved-symbols',id(`progress-symbol-${missed}`));
  await page.reload({waitUntil:'networkidle0'});await page.waitForSelector(id('progress-summary'));if(state.width===320)await enlargeText(page);assert.equal(await saved(),original);assert.match(await text(id('progress-summary')),/5 answers saved/);
  await click(named('Preferences'));await click(named('Reset Preferences'));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('nato.preferences.v1')).themeMode==='system');assert.equal(await saved(),original);
  await visit('/letter-quiz');await click(id('practice-digits'));await click(id('review-mistakes'));assert.match(await text(id('review-availability')),/^1 saved symbols available/);await click(id('review-due'));await capture('due-review-setup',id('review-availability'));await click(id('quiz-start'));
  await page.waitForSelector(id('quiz-letter'));assert.equal(await text(id('quiz-letter')),missed);assert.match(await text(id('quiz-progress')),/Question 1 of 1/);await capture('due-review-question',id('quiz-progress'));await click(named('Choose '+words.get(missed)));await waitAnswers(6);await click(id('quiz-next'));await page.waitForSelector(id('quiz-score'));assert.match(await text(id('quiz-score')),/1 correct of 1 answered/);
  await visit('/letter-quiz');await click(id('practice-digits'));await click(id('review-mistakes'));assert.match(await text(id('review-availability')),/^0 saved symbols available/);assert.equal(await page.$eval(id('quiz-start'),e=>e.getAttribute('aria-disabled')),'true');
  await visit('/progress');await capture('recovered-summary',id('progress-summary'));const preferences=await page.evaluate(()=>localStorage.getItem('nato.preferences.v1')),before=await saved();
  await click(id('progress-clear'));await capture('clear-confirmation',id('progress-delete'));await click(named('Keep progress'));assert.equal(await saved(),before);
  await click(id('progress-clear'));await page.evaluate(()=>{window.__failProgressClear=true;});await click(id('progress-delete'));await page.waitForFunction(()=>document.body.innerText.includes('Progress could not be cleared.'));assert.equal(await saved(),before);await capture('clear-error','[role="alert"]');
  await page.evaluate(()=>{window.__failProgressClear=false;});await click(id('progress-delete'));await page.waitForFunction(()=>{const d=JSON.parse(localStorage.getItem('nato.progress.v1'));return d?.generation && Object.keys(d.symbols).length===0;});assert.equal(await page.evaluate(()=>localStorage.getItem('nato.preferences.v1')),preferences);assert.equal(await page.evaluate(()=>localStorage.getItem('unrelated')),'keep');assert.match(await text(id('progress-summary')),/^0 answers saved/);await capture('cleared-summary',id('progress-summary'));
  await assertTextContained(page,'[role="button"], [role="radio"]');assert.deepEqual(errors,[]);
  console.log(`PASS ${state.theme} ${state.width}: real persistence/reload, exact 5 guarded answers, save failure/retry, Reset scoped, due/focus/unique review/recovery, confirmed deletion/cancel/failure/retry and preference/unrelated retention; contained controls`);
  await page.evaluate(()=>localStorage.setItem('nato.progress.v1','{"version":99,"symbols":{}}'));await visit('/progress');await page.waitForSelector('[role="alert"]');assert.equal(await saved(),'{"version":99,"symbols":{}}');assert.equal(await page.$(id('progress-summary')),null);await capture('unsupported-schema','[role="alert"]');await click(named('Retry progress storage'));assert.equal(await saved(),'{"version":99,"symbols":{}}');await click(id('progress-clear'));await click(id('progress-delete'));await page.waitForFunction(()=>{const d=JSON.parse(localStorage.getItem('nato.progress.v1'));return d?.generation && Object.keys(d.symbols).length===0;});
  console.log(`PASS ${state.theme} ${state.width}: future schema kept unchanged, unknown summary omitted, Retry and explicit deletion`);
  await context.close();
 }}finally{fs.writeFileSync(path.join(shots,'metadata.json'),JSON.stringify(captures,null,2)+'\n');await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});

