import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { parseArgs, runHost, sourceSnapshot } from '../scripts/host-build.cjs';

function fixture(t, scripts = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-host-build-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, '.gitignore'), 'artifacts/\n');
  fs.writeFileSync(path.join(root, '.nvmrc'), process.versions.node + '\n');
  const npmVersion = execFileSync('npm', ['--version'], { encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({ packageManager: `npm@${npmVersion}`, scripts: Object.fromEntries(
    ['check:dependencies', 'typecheck', 'lint', 'test', 'audit:review'].map(name => [name, scripts[name] || 'node -e "console.log(\'gate completed\')"'])
  ) }));
  for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']]) execFileSync('git', args, { cwd: root });
  return root;
}
const options = root => ({ root, mode: 'checks', jobs: 1, output: 'artifacts/job' });

test('host CLI rejects unsupported framework mode, missing arguments and invalid concurrency', () => {
  assert.throws(() => parseArgs(['android-framework', '--output', 'x']));
  assert.throws(() => parseArgs(['web', '--output']));
  assert.throws(() => parseArgs(['web', '--output', 'x', '--jobs', '0']));
});

test('failed child checks retain exact exits and logs, run remaining gates and release the build lock', t => {
  const root = fixture(t, { lint: 'node -e "console.error(\'controlled compiler-like failure\');process.exit(7)"', 'audit:review': 'node -e "process.exit(9)"' });
  const report = runHost(options(root));
  assert.equal(report.status, 'failed'); assert.equal(report.exitCode, 1);
  assert.deepEqual(report.steps.map(step => step.exitCode), [0, 0, 7, 0, 9]);
  assert.match(fs.readFileSync(path.join(root, 'artifacts/job', report.steps[2].log), 'utf8'), /controlled compiler-like failure/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(root, 'artifacts/job/report.json'))).status, 'failed');
  assert.equal(fs.existsSync(path.join(root, 'artifacts/.host-build.lock')), false);
  assert.deepEqual(report.artifacts, []);
});

test('source identity includes dirty tracked and untracked bytes, preserves their transfer inputs and rejects mismatches', t => {
  const root = fixture(t), before = sourceSnapshot(root);
  fs.appendFileSync(path.join(root, '.nvmrc'), '\n');
  fs.writeFileSync(path.join(root, 'new-source.txt'), 'reviewed input');
  const after = sourceSnapshot(root);
  assert.notEqual(before.sourceId, after.sourceId);
  const report = runHost({ ...options(root), preflightOnly: true, expectedSource: after.sourceId });
  assert.equal(report.status, 'preflight-pass');
  assert.equal(fs.readFileSync(path.join(root, 'artifacts/job/source-untracked/new-source.txt'), 'utf8'), 'reviewed input');
  assert.match(fs.readFileSync(path.join(root, 'artifacts/job/source.patch'), 'utf8'), /\.nvmrc/);
  const rejected = runHost({ ...options(root), output: 'artifacts/wrong-source', expectedSource: before.sourceId });
  assert.equal(rejected.status, 'failed'); assert.match(rejected.error, /source ID/); assert.equal(rejected.steps.length, 0);
});

test('a pre-existing lock and evidence directory are preserved; a new run gets an explicit failure report', t => {
  const root = fixture(t), lock = path.join(root, 'artifacts/.host-build.lock');
  fs.mkdirSync(lock, { recursive: true }); fs.writeFileSync(path.join(lock, 'owner.json'), 'original owner');
  const report = runHost(options(root));
  assert.equal(report.status, 'failed'); assert.match(report.error, /Another host build/);
  assert.equal(fs.readFileSync(path.join(lock, 'owner.json'), 'utf8'), 'original owner');
  assert.throws(() => runHost(options(root)), /already exists/);
  assert.throws(() => runHost({ ...options(root), output: 'src/job' }), /outside the checkout/);
});

test('wrong Node pin fails preflight without running checks', t => {
  const root = fixture(t);
  fs.writeFileSync(path.join(root, '.nvmrc'), '0.0.0');
  const report = runHost(options(root));
  assert.equal(report.status, 'failed'); assert.match(report.error, /pinned Node/); assert.equal(report.steps.length, 0);
});

test('source mutation during otherwise successful checks rejects qualification', t => {
  const root = fixture(t, { lint: 'node -e "require(\'fs\').writeFileSync(\'changed-source.js\',\'changed\')"' });
  const report = runHost(options(root));
  assert.equal(report.status, 'failed'); assert.match(report.error, /source changed during execution/);
  assert(report.steps.every(step => step.exitCode === 0));
});

test('a selected locked install really runs npm ci before the gates and preserves its source lock', t => {
  const root = fixture(t);
  execFileSync('npm', ['install', '--package-lock-only', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: root });
  const before = sourceSnapshot(root).sourceId;
  const report = runHost({ ...options(root), install: true });
  assert.equal(report.status, 'passed');
  assert.equal(report.steps[0].name, 'locked-install'); assert.equal(report.steps[0].exitCode, 0);
  assert.equal(report.steps.length, 6); assert.equal(sourceSnapshot(root).sourceId, before);
});

test('a missing lock prevents install and later gates, with a retained npm error', t => {
  const root = fixture(t);
  const report = runHost({ ...options(root), install: true });
  assert.equal(report.status, 'failed'); assert.equal(report.steps.length, 1);
  assert.notEqual(report.steps[0].exitCode, 0);
  assert.match(fs.readFileSync(path.join(root, 'artifacts/job', report.steps[0].log), 'utf8'), /package-lock|lockfile/);
});
