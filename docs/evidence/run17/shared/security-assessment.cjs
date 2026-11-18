const fs = require('node:fs');
const crypto = require('node:crypto');
const {spawnSync} = require('node:child_process');
const {performance} = require('node:perf_hooks');
const lock = JSON.parse(fs.readFileSync('package-lock.json'));
const before = JSON.parse(fs.readFileSync('docs/evidence/run17/shared/audit-before.json'));
const audit = JSON.parse(fs.readFileSync('docs/evidence/run17/shared/audit-after.json'));
const graph = JSON.parse(fs.readFileSync('docs/evidence/run17/shared/web-metafile.json'));
const samples = [16, 48].map(length => {
  const start = performance.now();
  const result = spawnSync(process.execPath, ['-e', `const p=require('picomatch');console.log(p('+(*a)')('a'.repeat(${length})+'!'));`], {timeout:1000,encoding:'utf8'});
  return {pattern:'+(*a)',input:`${length} a characters followed by !`,timeoutMs:1000,elapsedMs:performance.now()-start,exitCode:result.status,signal:result.signal,error:result.error?.code??null,stdout:result.stdout.trim()};
});
const report = {
  date:'2026-11-18',lockfileSha256:crypto.createHash('sha256').update(fs.readFileSync('package-lock.json')).digest('hex'),
  before:before.metadata.vulnerabilities,after:audit.metadata.vulnerabilities,
  removedImageSize:!Object.keys(lock.packages).some(p=>p.endsWith('/image-size'))&&!audit.vulnerabilities['image-size'],
  metroFamily:Object.entries(lock.packages).filter(([p])=>/(?:^|\/)node_modules\/metro(?:-[^/]+)?$/.test(p)).map(([path,v])=>({path,version:v.version})),
  actualWebInputCount:Object.keys(graph.inputs).length,
  affectedInWebGraph:Object.keys(graph.inputs).filter(p=>/node_modules\/(?:metro(?:-|\/)|picomatch\/|micromatch\/|image-size\/|fast-xml-parser\/)/.test(p)),
  matcher: {version:require('picomatch/package.json').version,advisory:'https://github.com/advisories/GHSA-fc5q-39xc-vjpf',registryLatest:JSON.parse(fs.readFileSync('docs/evidence/run17/shared/picomatch-registry.json')).version,samples,
  reach:'Controlled local pattern reproduces excessive backtracking. Installed Metro file-map common.js consumes filesystem globs through micromatch; CLI/Jest/watch paths remain affected. No authored browser converter/practice input route to these tools is established. No matcher patch/disposition/risk acceptance.'},
  nativeFramework:require('react-native/package.json').version,
  references:['https://github.com/react/metro/releases/tag/v0.83.8','https://github.com/react/metro/pull/1860','https://github.com/micromatch/picomatch/pull/194'],
  decision:'Adopt compatible upstream parser removal subject to native qualification. Retain failed security gate for28 picomatch-derived high entries. Do not backport the open4.x semantics PR into2.3.2 without complete semantics/adversarial/upstream-suite review.'
};
fs.writeFileSync('docs/evidence/run17/shared/security-assessment.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
