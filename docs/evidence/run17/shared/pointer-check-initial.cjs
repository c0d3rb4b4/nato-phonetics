const assert = require('node:assert/strict');
const fs = require('node:fs'),path = require('node:path'),http = require('node:http');
const puppeteer = require('puppeteer-core');
const root = path.resolve(__dirname,'../../../..');
const out = path.join(__dirname,'../screenshots/web');
const server = http.createServer(require(path.join(root,'scripts/serve-web.cjs')).staticHandler(path.join(root,'dist')));
const id = s => `[data-testid="${s}"]:not([aria-hidden="true"] *)`;
const named = s => `[aria-label="${s}"]:not([aria-hidden="true"] *)`;
const captures = [], checks = [], errors = [];
async function click(page, selector) {
 await page.bringToFront();await page.waitForSelector(selector,{visible:true});
 await page.$eval(selector,e=>e.scrollIntoView({block:'center'}));
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 await page.click(selector); // actual Puppeteer mouse input, not DOM dispatch
}
async function capture(page,file,state,theme) {
 await page.bringToFront();await page.screenshot({path:path.join(out,file)});
 captures.push({file,state,theme,viewport:page.viewport(),at:new Date().toISOString(),browser:await page.browser().version(),command:'Puppeteer page.screenshot; node docs/evidence/run17/shared/pointer-check.cjs'});
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
 const context=await browser.createBrowserContext();
 const {PRACTICE_ENTRIES,entrySymbol}=await import(path.join(root,'src/lib/practiceSets.js'));
 const words=new Map(PRACTICE_ENTRIES.map(e=>[entrySymbol(e),e.word]));
 try {
 const pages=[];
 for (const [width,height,theme] of [[1280,900,'light'],[320,568,'dark']]) {
  const page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));
  await page.setViewport({width,height,deviceScaleFactor:1});await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:theme}]);
  await page.goto(base+'/letter-quiz',{waitUntil:'networkidle0'});
  await click(page,named('26 questions'));await click(page,id('quiz-start'));await page.waitForSelector(id('quiz-letter'));
 }
 // Four real foreground submissions alternate between two live windows.
 for (let i=0;i<4;i++) {
  const page=pages[i%2];
  if (i>=2) {await click(page,id('quiz-next'));await page.waitForSelector(id('quiz-answer'),{hidden:true});}
  const symbol=await page.$eval(id('quiz-letter'),e=>e.textContent.trim()), word=words.get(symbol);
  await click(page,named('Choose '+word));await page.waitForSelector(id('quiz-answer'));
  await page.waitForFunction(n=>Object.values(JSON.parse(localStorage.getItem('nato.progress.v1'))?.symbols||{}).reduce((a,s)=>a+s.attempts,0)===n,{},i+1);
  const selected=await page.$eval(named('Choose '+word),e=>e.getAttribute('aria-label'));
  const feedback=await page.$eval(id('quiz-answer'),e=>e.textContent);
  assert.match(feedback,/Correct/);
  checks.push({submission:i+1,window:i%2,symbol,expectedWord:word,selected,feedback,method:'foreground serial Puppeteer mouse input'});
 }
 for (let i=0;i<pages.length;i++) {
  const page=pages[i],theme=i?'dark':'light',prefix=i?'narrow':'desktop';
  await click(page,named('Open menu'));await click(page,named('Learning progress'));
  await page.waitForFunction(()=>document.querySelector('[data-testid="progress-summary"]:not([aria-hidden="true"] *)')?.textContent.startsWith('4 answers saved'));
  await page.$eval(id('progress-summary'),e=>e.scrollIntoView({block:'start'}));
  await capture(page,`${prefix}-pointer-progress.png`,'Both same-origin pages retain all four exact foreground pointer answers',theme);
  await page.goto(base+'/converter',{waitUntil:'networkidle0'});await page.waitForSelector(id('converter-input'));
  await click(page,id('converter-input'));await page.keyboard.type('a3 b!');
  assert.match(await page.$eval(id('converter-plain-text'),e=>e.textContent),/Alfa.*Three/s);
  await page.$eval(id('converter-plain-text'),e=>e.scrollIntoView({block:'center'}));
  await capture(page,`${prefix}-converter.png`,'Production converter complete a3 b! plain text after Metro-only dependency update',theme);
  await page.goto(base+'/alphabet',{waitUntil:'networkidle0'});await page.waitForSelector(id('app-header'));
  await capture(page,`${prefix}-alphabet.png`,'Current production shared portrait reference',theme);
 }
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(__dirname,'pointer-report.json'),JSON.stringify({at:new Date().toISOString(),browser:await browser.version(),checks,errors,scope:'Four serial foreground mouse submissions across two updated-client Edge pages. Original concurrent-pointer failure and cause remain open; no simultaneous/frozen/other-engine/human pass.'},null,2)+'\n');
 console.log(JSON.stringify({passed:checks.length,captures:captures.length,scope:'serial foreground mouse'}));
 } finally {
 fs.writeFileSync(path.join(out,'metadata.json'),JSON.stringify(captures,null,2)+'\n');
 await browser.close();server.closeAllConnections();server.close();
 }
})().catch(e=>{console.error(e);server.closeAllConnections();server.close();process.exitCode=1;});
