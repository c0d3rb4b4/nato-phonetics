const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const puppeteer=require('puppeteer-core');
const root=path.resolve(__dirname,'../../../..'),out=path.join(__dirname,'../screenshots/web');
const server=http.createServer(require(path.join(root,'scripts/serve-web.cjs')).staticHandler(path.join(root,'dist')));
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
 const rows=[];
 try{
 for(const [width,height,theme] of [[1280,900,'light'],[320,568,'dark']]){
 const context=await browser.createBrowserContext(),page=await context.newPage();await page.setViewport({width,height,deviceScaleFactor:1});await page.emulateMediaFeatures([{name:'prefers-color-scheme',value:theme}]);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base,{waitUntil:'networkidle0'});await page.waitForSelector('[data-testid="app-header"]');
 const icon=await page.$eval('link[rel="icon"]',el=>el.href);const response=await page.goto(icon,{waitUntil:'networkidle0'});assert.equal(response.status(),200);
 const bytes=await response.buffer(),expected=fs.readFileSync(path.join(root,'assets/images/favicon.png'));assert.deepEqual(bytes,expected);
 const faviconHash=crypto.createHash('sha256').update(bytes).digest('hex');
 await page.goto(base,{waitUntil:'networkidle0'});await page.waitForSelector('[data-testid="app-header"]');assert.ok((await page.title()).includes('NATO Phonetics'));assert.deepEqual(errors,[]);
 const file=`${theme}-${width}-home.png`;await page.screenshot({path:path.join(out,file)});
 rows.push({file,state:'Actual production Home; linked favicon fetched and byte-verified separately (browser chrome is outside page screenshot)',theme,width,height,dpr:1,capturedAt:new Date().toISOString(),browser:await browser.version(),command:'Puppeteer page.screenshot',faviconSha256:faviconHash});
 await context.close();
 }
 fs.writeFileSync(path.join(out,'metadata.json'),JSON.stringify(rows,null,2)+'\n');console.log(JSON.stringify({passed:true,captures:rows.length,favicon:'Actual served bytes equal generated resource'}));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1});
