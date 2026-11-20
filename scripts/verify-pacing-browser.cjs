// Real production UI, controlled provider completion; timings are samples, not SLAs.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const puppeteer=require('puppeteer-core');
const {staticHandler}=require('./serve-web.cjs');
const out=path.resolve(process.argv[3]||'artifacts/pacing-browser'),shots=path.join(out,'screenshots/web');fs.mkdirSync(shots,{recursive:true});fs.mkdirSync(path.join(out,'web'),{recursive:true});
const server=http.createServer(staticHandler(path.resolve(process.argv[2]||'dist')));
const id=x=>`[data-testid="${x}"]`,button=x=>`[role="button"][aria-label="${x}"]`;
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});const captures=[],performanceSamples=[];
try {await browser.defaultBrowserContext().overridePermissions(base,['clipboard-read','clipboard-sanitized-write']);
for(const state of [{width:1280,height:900,theme:'light'},{width:320,height:568,theme:'dark'}]) {
 const context=await browser.createBrowserContext();await context.overridePermissions(base,['clipboard-read','clipboard-sanitized-write']);
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewport(state);
 await page.evaluateOnNewDocument(theme=>{
  if(!localStorage.getItem('nato.preferences.v1'))localStorage.setItem('nato.preferences.v1',JSON.stringify({version:1,themeMode:theme,selectedVoice:null}));
  const m=window.__pacing={calls:[],pending:[],stale:[]};Object.defineProperty(window,'SpeechSynthesisUtterance',{value:class{constructor(text){this.text=text;}}});
  Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[],addEventListener(){},removeEventListener(){},speak(u){m.calls.push({text:u.text,rate:u.rate,time:performance.now()});m.pending.push(u);queueMicrotask(()=>u.onstart?.({}));},cancel(){m.stale.push(...m.pending.map(u=>u.onend));m.pending=[];}}});
 },state.theme);
 await page.goto(base+'/converter',{waitUntil:'networkidle0'});await page.waitForSelector(id('converter-input'));
 const click=async s=>{await page.$eval(s,e=>e.scrollIntoView({block:'center'}));await page.click(s);};
 const input=async value=>page.$eval(id('converter-input'),(el,value)=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));},value);
 const capture=async name=>{const file=`${state.theme}-${state.width}-${name}.png`;await page.screenshot({path:path.join(shots,file)});captures.push({file,...state,state:name,browser:await browser.version(),capturedAt:new Date().toISOString(),command:'node scripts/verify-pacing-browser.cjs',arguments:process.argv.slice(2),provider:'controlled Web Speech completion, production app DOM'});};
 await click(button('Change playback pace'));await click(button('Rate 0.75×'));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('nato.preferences.v1')).converterPacing?.rate===0.75);
 await click(button('Word pause 700 ms'));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('nato.preferences.v1')).converterPacing?.wordPauseMs===700);await capture('pace');
 await click(button('Hide playback pace'));await input('a 🛰a-\n3!');await click(button('Play Full Phrase'));
 const expected=['Alfa','Alfa','dash','tree'],indices=[0,3,4,6];
 for(let i=0;i<4;i++){
  await page.waitForFunction(n=>window.__pacing.calls.length===n,{},i+1);
  await page.waitForFunction(word=>document.querySelector('[data-testid="converter-current-token"]').textContent.includes(word),{},i===3?'Three':expected[i]);
  if(i!==2)assert.equal(await page.$eval(id(`converter-${indices[i]}`),el=>el.getAttribute('aria-pressed')), 'true');
  if(i===0){await click(button('Show current card'));await page.$eval(id('converter-0'),e=>e.scrollIntoView({block:'center'}));await capture('highlight');}
  const ended=await page.evaluate(()=>{window.__pacing.pending.shift().onend?.({});return performance.now();});
  if(i<3){await page.waitForFunction(n=>window.__pacing.calls.length===n,{},i+2);const started=await page.evaluate(i=>window.__pacing.calls[i+1].time,i);assert.ok(started-ended>=(i===1?100:650),'Configured boundary pause versus ordinary token gap');}
 }
 assert.deepEqual(await page.evaluate(()=>window.__pacing.calls.map(x=>[x.text,x.rate])),expected.map(x=>[x,0.75]));
 await click(button('Replay phrase'));await page.waitForFunction(()=>window.__pacing.calls.length===5);await input('j');
 await page.waitForFunction(()=>window.__pacing.pending.length===0);await page.evaluate(()=>window.__pacing.stale.splice(0).forEach(end=>end?.({})));assert.equal(await page.evaluate(()=>window.__pacing.calls.length),5);
 await click(button('Replay phrase'));await page.waitForFunction(()=>window.__pacing.calls.length===6);await click(button('Stop playback'));assert.equal(await page.$eval(id('converter-current-token'),e=>e.textContent.trim()),'No token playing.');
 await click(button('Change playback pace'));await click(button('Rate 1.25×'));await page.waitForFunction(()=>JSON.parse(localStorage.getItem('nato.preferences.v1')).converterPacing.rate===1.25);await page.reload({waitUntil:'networkidle0'});
 await page.waitForSelector(id('converter-input'));assert.equal(await page.$eval(id('converter-input'),e=>e.value),'');assert.ok(await page.evaluate(()=>document.body.textContent.includes('Rate 1.25× · word pause 700 ms')));
 for(const count of [100,500,2000]){
  const sample=await page.evaluate(async count=>{const el=document.querySelector('[data-testid="converter-input"]');const text=('CV34 7AP / G-ABCD\n').repeat(Math.ceil(count/17)).slice(0,count);const set=value=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));};const frames=()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const t=performance.now();set(text);await frames();const pasteMs=performance.now()-t;const e=performance.now();set(text+'j');await frames();return {characters:count,pasteToTwoFramesMs:pasteMs,nextEditToTwoFramesMs:performance.now()-e,domElements:document.querySelectorAll('*').length,tiles:document.querySelectorAll('[data-nato-tile]').length,outputCharacters:document.querySelector('[data-testid="converter-plain-text"]').textContent.length,input:el.value.length};},count);
  assert.ok(sample.tiles<=24);assert.equal(sample.input,count+1);performanceSamples.push({...state,...sample});
 }
 await click(button('Copy conversion'));await page.waitForFunction(()=>document.body.textContent.includes('Copied conversion.'));assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),await page.$eval(id('converter-plain-text'),e=>e.textContent));
 await click(button('Next cards'));assert.ok(await page.$eval(id('converter-card-page'),e=>e.textContent.includes('Card page 2')));await page.$eval(id('converter-output'),e=>e.scrollIntoView({block:'start'}));await capture('paged-long-input');
 await input('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');assert.ok(await page.$eval(id('converter-card-page'),e=>e.textContent.includes('Card page 1 of 2')));await click(button('Next cards'));assert.equal(await page.$eval(button('Next cards'),e=>e.getAttribute('aria-disabled')),'true');assert.equal(await page.$$eval('[data-nato-tile]',nodes=>nodes.length),12);
 await click(id('converter-35'));await page.waitForFunction(()=>window.__pacing.pending.length===1);
 assert.equal(await page.$eval(id('converter-current-token'),e=>e.textContent.trim()),'Current token: Nine (1 of 1)');assert.equal(await page.$eval(id('converter-35'),e=>e.getAttribute('aria-pressed')),'true');
 assert.deepEqual(await page.evaluate(()=>window.__pacing.calls.map(x=>[x.text,x.rate])),[['niner',1.25]]);
 await click(button('Show current card'));assert.ok(await page.$eval(id('converter-card-page'),e=>e.textContent.includes('Card page 2 of 2')));await page.$eval(id('converter-35'),e=>e.scrollIntoView({block:'center'}));await capture('individual-page-2-highlight');await click(button('Stop playback'));
 await click(button('Previous cards'));assert.equal(await page.$$eval('[data-nato-tile]',nodes=>nodes.length),24);
 await input('cv34 7ap');await click(button('Open menu'));await click(button('Back to App'));assert.equal(await page.$eval(id('converter-input'),e=>e.value),'cv34 7ap');
 if(state.width===320){await click(button('Change playback pace'));await page.evaluate(()=>{const nodes=[...document.querySelectorAll('body *')].filter(n=>!n.closest('[data-nato-tile]')&&[...n.childNodes].some(x=>x.nodeType===Node.TEXT_NODE&&x.textContent.trim()));const sizes=nodes.map(n=>[n,parseFloat(getComputedStyle(n).fontSize),parseFloat(getComputedStyle(n).lineHeight)]);document.documentElement.style.fontSize='32px';for(const [n,s,l]of sizes){n.style.setProperty('font-size',s*2+'px','important');if(Number.isFinite(l))n.style.setProperty('line-height',l*2+'px','important');}});await page.$eval(button('Word pause 700 ms'),e=>e.scrollIntoView({block:'center'}));await capture('pace-200-percent');assert.deepEqual(await page.$$eval('[role="button"]',nodes=>nodes.filter(n=>n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2).map(n=>n.getAttribute('aria-label'))),[]);}
 assert.deepEqual(errors,[]);console.log(`PASS ${state.width}: mapped highlight/pause/rate/replay/stop/edit, saved pacing/reload, full clipboard, 24-token pages and long input`);await context.close();
}
fs.writeFileSync(path.join(shots,'pacing-metadata.json'),JSON.stringify(captures,null,2)+'\n');fs.writeFileSync(path.join(out,'web/final-performance.json'),JSON.stringify({browser:await browser.version(),method:'one sample per size and viewport; two animation frames after production DOM input event, no performance SLA',samples:performanceSamples},null,2)+'\n');
}finally{await browser.close();server.closeAllConnections();server.close();}})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});
