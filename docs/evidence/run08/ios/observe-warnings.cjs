// Bounded diagnostic of the observed Debug toast; uses the real native provider.
const WebSocket = require('ws');
const fs = require('node:fs');
(async () => {
  const pages = await (await fetch('http://127.0.0.1:8081/json')).json();
  const page = pages.find(p => p.appId === 'com.natophonetics.app');
  if (!page) throw new Error('No running Hermes app');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const events=[];let id=0;const pending=new Map();
  ws.on('message',raw=>{const m=JSON.parse(raw);if(m.method==='Runtime.consoleAPICalled')events.push(m.params);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}});
  await new Promise(resolve=>ws.on('open',resolve));
  const command=(method,params={})=>new Promise(resolve=>{const n=++id;pending.set(n,resolve);ws.send(JSON.stringify({id:n,method,params}));});
  await command('Runtime.enable');
  const result=await command('Runtime.evaluate',{expression:`(()=>{const pair=[...__r.getModules().entries()].find(pair=>pair[1].verboseName==='src/lib/speech.js');const p=__r(pair[0]).playback;const running=p.play('run08-warning-diagnostic',[{text:'Alfa Bravo Charlie Delta'}]);globalThis.__natoWarningResult={pending:true};new Promise(resolve=>setTimeout(resolve,1000)).then(()=>p.stop('run08-warning-diagnostic')).then(()=>running).then(result=>{globalThis.__natoWarningResult={result,snapshot:p.getSnapshot()};});return 'pending';})()`,awaitPromise:true,returnByValue:true});
  if(result.result?.exceptionDetails) throw new Error(JSON.stringify(result.result.exceptionDetails));
  await new Promise(resolve=>setTimeout(resolve,2500));
  const settled=await command('Runtime.evaluate',{expression:'globalThis.__natoWarningResult',returnByValue:true});
  fs.writeFileSync(__dirname+'/warnings.json',JSON.stringify({scenario:'Actual native Alfa playback followed by Stop via existing controller; diagnostic owner, no app source/provider substitution',result,settled,events},null,2)+'\n');
  console.log(JSON.stringify({consoleEvents:events.length,settled:settled.result?.result?.value}));ws.close();
})().catch(error=>{console.error(error);process.exit(1);});
