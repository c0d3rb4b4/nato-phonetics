const { firefox } = require('playwright');
const http = require('node:http'), fs = require('node:fs');
(async () => {
 const server = http.createServer((_req,res) => res.end('<!doctype html><title>API probe</title>'));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser = await firefox.launch({headless:true}), page = await browser.newPage();
 const errors=[];
 page.on('pageerror', e=>errors.push({message:e.message,stack:e.stack}));
 try {
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const caught=await page.evaluate(async()=>{
   const results=[]; window.probeEvents=[];
   window.addEventListener('error',event=>window.probeEvents.push({type:'error',message:event.message}));
   window.addEventListener('unhandledrejection',event=>window.probeEvents.push({type:'unhandledrejection',message:event.reason?.message}));
   for(const name of ['throw','rejected-promise','settled-envelope']) {
    try {
     const value=await navigator.locks.request('probe', async()=>{
      if(name==='throw') throw new Error('probe throw');
      if(name==='rejected-promise') return Promise.reject(new Error('probe rejected promise'));
      try { throw new Error('probe envelope'); } catch(error) { return {error:error.message}; }
     });
     results.push({name,value});
    } catch(error) {results.push({name,caught:error.message});}
   }
   return results;
  });
  await page.waitForTimeout(100);
  const result={browser:browser.version(),caught,errors,pageEvents:await page.evaluate(()=>window.probeEvents),scope:'No app, storage mocks, dependencies or framework: actual Web Locks callback rejections and caught outer promises'};
  fs.writeFileSync(__dirname+'/lock-rejection-probe.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 } finally {await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
