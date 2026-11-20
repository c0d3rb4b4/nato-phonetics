const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
const puppeteer=require('puppeteer-core');
const {staticHandler}=require('../../../../scripts/serve-web.cjs');
const root=path.resolve(__dirname,'../../../..'),out=path.join(root,'docs/evidence/run18');
(async()=>{
 const server=http.createServer(staticHandler(path.join(root,'dist')));await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true,args:['--no-first-run','--disable-background-networking']});
 const captures=[];
 try{
  for(const state of [{name:'desktop',width:1280,height:900,theme:'light'},{name:'narrow',width:320,height:568,theme:'dark'}]){
   const context=await browser.createBrowserContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.setViewport({width:state.width,height:state.height});await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:state.theme}]);
   const url=`http://127.0.0.1:${server.address().port}/privacy`;await page.goto(url,{waitUntil:'networkidle0'});
   await page.waitForFunction(()=>[...document.querySelectorAll('div')].some(n=>n.textContent.startsWith('Speech and connectivity')&&n.textContent.endsWith('Speech output does not request microphone access.')));
   const metrics=await page.evaluate(()=>{
    const node=[...document.querySelectorAll('div')].find(n=>n.textContent.startsWith('Speech and connectivity')&&n.textContent.endsWith('Speech output does not request microphone access.'));
    node.scrollIntoView({block:'center'});const box=node.getBoundingClientRect(),range=document.createRange();range.selectNodeContents(node);
    return {text:node.textContent,box:box.toJSON(),overflow:[...range.getClientRects()].filter(r=>r.width>0&&(r.left<box.left-1||r.right>box.right+1||r.top<box.top-1||r.bottom>box.bottom+1)).map(r=>r.toJSON())};
   });assert.deepEqual(metrics.overflow,[]);assert.deepEqual(errors,[]);
   const file=`policy-${state.name}.png`;await page.screenshot({path:path.join(out,'screenshots/web',file)});
   captures.push({file,...state,timestamp:new Date().toISOString(),browser:await browser.version(),url,command:'node docs/evidence/run18/shared/capture-policy-web.cjs',metrics});
   await context.close();console.log(`PASS ${state.name} actual policy glyph ranges/no page errors`);
  }
 }finally{await browser.close();await new Promise(r=>server.close(r));}
 fs.writeFileSync(path.join(out,'screenshots/web/metadata.json'),JSON.stringify(captures,null,2)+'\n');
 const current=JSON.parse(fs.readFileSync(path.join(root,'dist/offline-manifest.json'))),prior=JSON.parse(fs.readFileSync(path.join(root,'docs/evidence/run17/source-identity.json')));
 assert.deepEqual(current,prior.productionShell);
 fs.writeFileSync(path.join(out,'shared/web-reuse.json'),JSON.stringify({manifestExactlyMatchesRun17:true,reason:'Product web JS/worker/resources are unchanged; npm postinstall affects only source-built native Yoga. Prior qualified app/offline/update results retained.',manifest:current},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1});
