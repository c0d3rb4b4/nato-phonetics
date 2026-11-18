const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http');
const {staticHandler}=require('/Users/mac/dev/apps/nato-phonetics/scripts/serve-web.cjs');
const puppeteer=require('puppeteer-core');
(async()=>{
 const server=http.createServer(staticHandler('/Users/mac/dev/apps/nato-phonetics/dist'));
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER_EXECUTABLE,headless:true});
 try{
 const a=await browser.newPage(),b=await browser.newPage(),base=`http://127.0.0.1:${server.address().port}`;
 for(const p of [a,b]){await p.goto(base+'/letter-quiz',{waitUntil:'networkidle0'});await p.click('[data-testid="quiz-start"]');await p.waitForSelector('[data-testid="quiz-choice-1"]');}
 for(const p of [a,b]){await p.$eval('[data-testid="quiz-choice-1"]',e=>e.click());await p.waitForSelector('[data-testid="quiz-answer"]');}
 const stored=await a.evaluate(()=>JSON.parse(localStorage.getItem('nato.progress.v1')));
 const attempts=Object.values(stored.symbols).reduce((n,r)=>n+r.attempts,0);
 const report={expectedAttempts:2,actualAttempts:attempts,stored,browser:await browser.version(),at:new Date().toISOString(),baseHead:'51501310ef3f4261ac79e7d56917408c3f3745c4'};
 fs.writeFileSync('/Users/mac/dev/apps/nato-phonetics/docs/evidence/run15/shared/concurrency-before.json',JSON.stringify(report,null,2)+'\n');
 console.log(report);assert.equal(attempts,2,'Both accepted answers must survive');
 }finally{await browser.close();server.closeAllConnections();server.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
