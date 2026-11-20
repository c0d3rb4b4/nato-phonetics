const p = require('puppeteer-core'),fs=require('node:fs');
(async()=>{
 const browser=await p.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
 try {
  const a=await browser.newPage(),b=await browser.newPage();
  await b.setContent('<title>Freeze probe</title>');
  await b.evaluate(()=>{window.beats=0;window.events=[];setInterval(()=>window.beats++,20);document.addEventListener('freeze',()=>window.events.push('freeze'));document.addEventListener('resume',()=>window.events.push('resume'));});
  await a.bringToFront();const visibility=await b.evaluate(()=>document.visibilityState);
  const session=await b.createCDPSession();const before=await b.evaluate(()=>window.beats);
  await session.send('Page.setWebLifecycleState',{state:'frozen'});
  await new Promise(r=>setTimeout(r,700));await session.send('Page.setWebLifecycleState',{state:'active'});
  const after=await b.evaluate(()=>({beats:window.beats,events:window.events}));
  const result={browser:await browser.version(),visibility,before,after};
  fs.writeFileSync(__dirname+'/freeze-probe.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
