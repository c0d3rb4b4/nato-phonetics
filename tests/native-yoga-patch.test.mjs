import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { patchNativeYoga } = require('../scripts/patch-native-yoga.cjs');
const patch = require('../scripts/patches/react-native-0.81.5-yoga-pixel-grid.json');
const installed = fs.readFileSync(path.join(path.dirname(require.resolve('react-native/package.json')), patch.sourcePath), 'utf8');
const sha = text => createHash('sha256').update(text).digest('hex');
let original = installed;
if (sha(original) === patch.patchedSha256) {
  for (const { before, after } of [...patch.changes].reverse()) original = original.replace(after, before);
}
assert.equal(sha(original), patch.originalSha256, 'Fixture reconstructs the exact published source');
function fixture(t, version = '0.81.5', source = original) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-yoga-patch-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const manifest = path.join(dir, 'package.json'), file = path.join(dir, patch.sourcePath);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(manifest, JSON.stringify({ version })); fs.writeFileSync(file, source);
  return { manifest, file };
}
test('Yoga patch exactly reproduces reviewed backport and repeated install leaves bytes intact', t => {
  const { manifest, file } = fixture(t);
  patchNativeYoga(manifest); assert.equal(sha(fs.readFileSync(file)), patch.patchedSha256);
  const stat = fs.statSync(file); patchNativeYoga(manifest);
  assert.equal(fs.statSync(file).mtimeMs, stat.mtimeMs);
});
test('Yoga patch rejects version drift without writing source', t => {
  const { manifest, file } = fixture(t, '0.81.6');
  assert.throws(() => patchNativeYoga(manifest), /version/);
  assert.equal(fs.readFileSync(file, 'utf8'), original);
});
test('Yoga patch rejects drift anywhere in original or already-patched source', t => {
  for (const source of [original, installed]) {
    const changed = source + '\n// source drift\n'; const { manifest, file } = fixture(t, '0.81.5', changed);
    assert.throws(() => patchNativeYoga(manifest), /source changed/);
    assert.equal(fs.readFileSync(file, 'utf8'), changed);
  }
});
test('installed source-built Yoga includes the reviewed precision correction', () => {
  assert.equal(sha(installed), patch.patchedSha256);
});
