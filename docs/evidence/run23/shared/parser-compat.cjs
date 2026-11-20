const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { XMLParser: OldParser } = require('/tmp/nato-run23-old-parser/node_modules/fast-xml-parser');
const { XMLParser: NewParser } = require('fast-xml-parser');
const root = path.resolve(__dirname, '../../../..');
const samples = [
  fs.readFileSync(path.join(root, 'android/app/src/main/AndroidManifest.xml'), 'utf8'),
  fs.readFileSync(path.join(root, 'ios/NATOPhonetics.xcworkspace/contents.xcworkspacedata'), 'utf8'),
  '<Workspace><FileRef location="group:Café &amp; App.xcodeproj"/></Workspace>',
  '<Workspace><FileRef location="group:Caf&#233;.xcodeproj"/></Workspace>',
];
const results = samples.map(xml => {
  const old = new OldParser({ ignoreAttributes: false }).parse(xml);
  const current = new NewParser({ ignoreAttributes: false }).parse(xml);
  assert.deepEqual(current, old);
  return { xml, old, current, equal: true };
});
const bounded = {};
for (const [name, module] of [['old4.5.7', '/tmp/nato-run23-old-parser/node_modules/fast-xml-parser'], ['current5.12.1', require.resolve('fast-xml-parser')]]) {
  const start = performance.now();
  const result = spawnSync(process.execPath, ['-e', `const {XMLParser}=require(process.argv[1]);try{new XMLParser({stopNodes:['stop']}).parse('<stop>'+'<a '.repeat(400000));process.exit(2)}catch(e){console.log(e.message)}`, module], { timeout: 1000, encoding: 'utf8' });
  bounded[name] = { exitCode: result.status, signal: result.signal, error: result.error?.code || null, elapsedMs: performance.now() - start, stdout: result.stdout, stderr: result.stderr };
}
assert.equal(bounded['old4.5.7'].error, 'ETIMEDOUT');
assert.equal(bounded['current5.12.1'].exitCode, 0);
assert.equal(bounded['current5.12.1'].error, null);
fs.writeFileSync(path.join(__dirname, 'parser-results.json'), JSON.stringify({ results, bounded, scope: 'One bounded local corpus, not comprehensive fuzzing or a timing guarantee. Numeric entities are unchanged from prior parser defaults; initial tests incorrectly expected decoding.' }, null, 2) + '\n');
console.log('4 real/representative XML parses equal; old malformed corpus times out, patched corpus throws within bound.');
