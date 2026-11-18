const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const puppeteer=require('puppeteer-core');const root=path.resolve(__dirname,'../../../..');
const server=http.createServer(require(path.join(root,'scripts/serve-web.cjs')).staticHandler(path.join(root,'dist')));
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});try{
 const page=await browser.newPage();await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'networkidle0'});
 const capability=await page.evaluate(async()=>{const C=globalThis.SpeechRecognition||globalThis.webkitSpeechRecognition;
 const result={secureContext:isSecureContext,constructorName:C?.name||null,constructorAvailable:!!C,processLocally:C ? 'processLocally' in C.prototype:false,availableMethod:typeof C?.available,installMethod:typeof C?.install,probe:'No recognizer construction/start, model installation or microphone request'};
 if(typeof C?.available==='function'){try{result.localEnglish=await Promise.race([C.available({langs:['en-GB'],processLocally:true}),new Promise((_,reject)=>setTimeout(()=>reject(new Error('availability-timeout')),5000))]);}catch(e){result.availabilityError=String(e);}}return result;});
 fs.writeFileSync(path.join(__dirname,'browser-capability.json'),JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),origin:'loopback secure context; production app served',...capability},null,2)+'\n');console.log(JSON.stringify(capability));
 }finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
