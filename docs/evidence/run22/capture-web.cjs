const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {startServer}=require('../../../scripts/serve-web.cjs');
(async()=>{
 const server=startServer('/tmp/nato-run22-web-preview/public',0);
 await new Promise(resolve=>server.once('listening',resolve));
 const browser=await chromium.launch({headless:true,executablePath:'/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'});
 const records=[];
 try{
  for(const [name,viewport,colorScheme,route] of [
   ['home-desktop-light',{width:1280,height:900},'light','/'],
   ['converter-mobile-dark',{width:320,height:800},'dark','/converter']
  ]){
   const context=await browser.newContext({viewport,colorScheme});const page=await context.newPage();const errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`http://127.0.0.1:${server.address().port}${route}`,{waitUntil:'networkidle'});
   if(route==='/converter'){
    const field=page.locator('textarea');await field.fill('CV34 7AP');assert.equal(await field.inputValue(),'CV34 7AP');
    await page.getByText('Charlie',{exact:true}).first().waitFor();
   }
   await page.evaluate(()=>document.fonts.ready);
   const file=`docs/evidence/run22/screenshots/web/${name}.png`;await page.screenshot({path:file,fullPage:true});
   assert.deepEqual(errors,[]);records.push({file:`web/${name}.png`,date:new Date().toISOString(),browser:await browser.version(),viewport,theme:colorScheme,route,errors,sourceArchiveSha256:'fe911a9691812e3989e048429e034e1fef5f7ff1e7960d7e4a1c196d7e0e8f96',command:'NODE_PATH=/tmp/nato-run19-browser/node_modules node docs/evidence/run22/capture-web.cjs'});
   await context.close();
  }
 }finally{fs.writeFileSync('docs/evidence/run22/screenshots/web/metadata.json',JSON.stringify(records,null,2)+'\n');await browser.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
