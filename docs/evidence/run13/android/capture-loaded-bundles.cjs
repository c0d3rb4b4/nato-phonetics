#!/usr/bin/env node
// Archive the JavaScript sources actually loaded by the installed Hermes app.
const WebSocket = require('ws');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../../../..');
const output = path.join(root, 'artifacts/run13/android/loaded-javascript');
(async () => {
  const pages = await (await fetch('http://127.0.0.1:8081/json')).json();
  const page = pages.find(p => p.appId === 'com.natophonetics.app');
  if (!page) throw new Error('Installed app Hermes target missing');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  let sequence = 0;
  const pending = new Map();
  const scripts = new Map();
  ws.on('message', bytes => {
    const message = JSON.parse(bytes.toString());
    if (message.method === 'Debugger.scriptParsed') scripts.set(message.params.scriptId,message.params);
    if (pending.has(message.id)) {
      const {resolve,reject,timer} = pending.get(message.id);
      clearTimeout(timer); pending.delete(message.id);
      if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
    }
  });
  function command(method,params={}) {
    return new Promise((resolve,reject) => {
      const id=++sequence;
      const timer=setTimeout(()=>reject(new Error('Inspector timeout: '+method)),15000);
      pending.set(id,{resolve,reject,timer});
      ws.send(JSON.stringify({id,method,params}));
    });
  }
  await new Promise((resolve,reject)=>{ws.on('open',resolve);ws.on('error',reject);});
  await command('Debugger.enable');
  await new Promise(resolve=>setTimeout(resolve,500));
  fs.mkdirSync(output,{recursive:true});
  const manifest=[];
  for (const script of scripts.values()) {
    if (!/^http/.test(script.url) || !script.url.includes('bundle')) continue;
    const {scriptSource}=await command('Debugger.getScriptSource',{scriptId:script.scriptId});
    const data=Buffer.from(scriptSource);
    const name=`script-${script.scriptId}.js`;
    fs.writeFileSync(path.join(output,name),data);
    manifest.push({file:`artifacts/run13/android/loaded-javascript/${name}`,url:script.url,
      bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
  }
  if (!manifest.length) throw new Error('No loaded Metro source returned by Hermes');
  fs.writeFileSync(path.join(__dirname,'loaded-javascript.json'),JSON.stringify({capturedAt:new Date().toISOString(),method:'Hermes CDP Debugger.getScriptSource',scripts:manifest},null,2)+'\n');
  console.log(JSON.stringify({scripts:manifest.length,bytes:manifest.reduce((n,s)=>n+s.bytes,0)}));
  await command('Debugger.disable');ws.close();
})().catch(error=>{console.error(error);process.exit(1);});
