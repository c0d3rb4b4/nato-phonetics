import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { npmInvocation, runHost } from '../scripts/host-build.cjs';
import { verifyHostArtifacts } from '../scripts/verify-host-artifacts.cjs';

function webFixture(t, mutate) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-retained-product-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'scripts'));
  fs.mkdirSync(path.join(root, 'tests'));
  const npm = execFileSync(npmInvocation.executable, [...npmInvocation.prefix, '--version'], { encoding: 'utf8' }).trim();
  fs.writeFileSync(path.join(root, '.nvmrc'), process.versions.node + '\n');
  fs.writeFileSync(path.join(root, '.gitignore'), 'artifacts/\n');
  fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify({
    packageManager: 'npm@' + npm, scripts: { 'export:web': 'node --version' },
  }));
  fs.writeFileSync(path.join(root, 'tests/web-package.test.mjs'), '');
  fs.writeFileSync(path.join(root, 'scripts/package-web.cjs'), [
    "const fs = require('node:fs');",
    "fs.writeFileSync(process.argv[3], 'packaged bytes');",
    mutate ? "fs.writeFileSync('new-source.txt', 'changed during packaging');" : '',
  ].join('\n'));
  for (const args of [['init', '-q'], ['add', '.'], ['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-qm', 'fixture']]) {
    execFileSync('git', args, { cwd: root });
  }
  const output = path.join(root, 'artifacts/job');
  return { root, output, report: runHost({ root, output, mode: 'web' }) };
}

test('an identified download rejects wrong mode, revision, attempt, digest and unexpected products', t => {
  const { output, report } = webFixture(t, false);
  assert.equal(report.status, 'passed');
  assert.deepEqual(verifyHostArtifacts(output, 'web', report.commit).artifacts, report.artifacts);
  assert.throws(() => verifyHostArtifacts(output, 'android-develop', report.commit));
  assert.throws(() => verifyHostArtifacts(output, 'web', 'f'.repeat(40)));
  assert.throws(() => verifyHostArtifacts(output, 'web', report.commit, '1', '999'));
  fs.writeFileSync(path.join(output, 'other.apk'), 'stale');
  assert.throws(() => verifyHostArtifacts(output, 'web', report.commit), /product set/);
  fs.unlinkSync(path.join(output, 'other.apk'));
  fs.writeFileSync(path.join(output, 'nato-web.tar.gz'), 'replaced bytes');
  assert.throws(() => verifyHostArtifacts(output, 'web', report.commit), /SHA-256/);
});

test('source drift after packaging keeps diagnostics and rejects all product bytes', t => {
  const { root, output, report } = webFixture(t, true);
  assert.equal(report.status, 'failed');
  assert.match(report.error, /source changed/);
  assert.deepEqual(report.artifacts, []);
  assert.equal(fs.existsSync(path.join(output, 'nato-web.tar.gz')), false);
  assert.equal(fs.existsSync(path.join(output, report.steps.at(-1).log)), true);
  assert.deepEqual(fs.readdirSync(path.join(root, 'artifacts')), ['job']);
  assert.throws(() => verifyHostArtifacts(output, 'web', report.commit));
});
