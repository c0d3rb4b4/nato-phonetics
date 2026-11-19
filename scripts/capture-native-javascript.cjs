// Archive actual loaded Metro bytes through Hermes; read-only CDP observation.
const WebSocket = require('ws');
const fs = require('node:fs');
const path = require('node:path');
const {gzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
async function captureNativeJavascript(output) {
  const pages = await (await fetch('http://127.0.0.1:8081/json')).json();
  const page = pages.find(p => p.appId === 'com.natophonetics.app');
  if (!page) throw new Error('Installed app Hermes target missing');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  const pending = new Map(); const scripts = new Map(); let sequence = 0;
  ws.on('message', bytes => {
    const message = JSON.parse(bytes.toString());
    if (message.method === 'Debugger.scriptParsed') scripts.set(message.params.scriptId, message.params);
    const request = pending.get(message.id);
    if (request) {
      clearTimeout(request.timer); pending.delete(message.id);
      if (message.error) request.reject(new Error(JSON.stringify(message.error))); else request.resolve(message.result);
    }
  });
  function command(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Inspector timeout: ${method}`)); }, 15000);
      pending.set(id, {resolve, reject, timer}); ws.send(JSON.stringify({id, method, params}));
    });
  }
  try {
    await new Promise((resolve, reject) => { ws.on('open', resolve); ws.on('error', reject); });
    await command('Runtime.enable');
    await command('Debugger.enable');
    await new Promise(resolve => setTimeout(resolve, 500));
    fs.mkdirSync(output, {recursive: true}); const manifest = [];
    for (const script of scripts.values()) {
      if (!/^http/.test(script.url) || !script.url.includes('bundle')) continue;
      const response = await command('Debugger.getScriptSource', {scriptId: script.scriptId});
      const {scriptSource} = response;
      if (typeof scriptSource !== 'string') throw new Error(`Hermes did not return source: ${JSON.stringify({script, response})}`);
      const data = Buffer.from(scriptSource); const file = `script-${script.scriptId}.js.gz`;
      fs.writeFileSync(path.join(output, file), gzipSync(data));
      manifest.push({file, url: script.url, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex')});
    }
    if (!manifest.length) throw new Error('No loaded Metro source returned by Hermes');
    fs.writeFileSync(path.join(output, 'loaded-javascript.json'), JSON.stringify({capturedAt: new Date().toISOString(), method: 'Hermes CDP Debugger.getScriptSource', scripts: manifest}, null, 2) + '\n');
    await command('Debugger.disable'); return manifest;
  } finally { for (const request of pending.values()) clearTimeout(request.timer); ws.close(); }
}
module.exports = {captureNativeJavascript};
if (require.main === module) {
  if (!process.argv[2]) throw new Error('Provide a durable output directory');
  captureNativeJavascript(path.resolve(process.argv[2])).then(rows => console.log(JSON.stringify(rows))).catch(error => {console.error(error); process.exitCode = 1;});
}
