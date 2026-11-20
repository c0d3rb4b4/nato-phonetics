// Re-resolve the mutually pinned Metro family inside existing consumer ranges.
// npm update with named transitive packages was a no-op; preserve every other
// lock entry and let npm reconstruct only the removed family metadata.
const fs = require('node:fs');
const cp = require('node:child_process');
const os = require('node:os');
const path = require('node:path');
const root = process.cwd();
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-run17-metro-'));
const lock = JSON.parse(fs.readFileSync('package-lock.json', 'utf8'));
const removed = Object.keys(lock.packages).filter(p => /(?:^|\/)node_modules\/metro(?:-[^/]+)?$/.test(p));
for (const p of removed) delete lock.packages[p];
fs.copyFileSync('package.json', path.join(dir, 'package.json'));
fs.writeFileSync(path.join(dir, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');
console.log(JSON.stringify({dir, removed}));
const result = cp.spawnSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], {cwd: dir, stdio:'inherit'});
if (result.status !== 0) process.exit(result.status ?? 1);
const final = JSON.parse(fs.readFileSync(path.join(dir, 'package-lock.json')));
if (final.packages['node_modules/metro'].version !== '0.83.8') throw new Error('Unexpected Metro version');
if (JSON.stringify(final.packages['']) !== JSON.stringify(lock.packages[''])) throw new Error('Root dependency drift');
fs.copyFileSync(path.join(dir, 'package-lock.json'), path.join(root, 'package-lock.json'));
