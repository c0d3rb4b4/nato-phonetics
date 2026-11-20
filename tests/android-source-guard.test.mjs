import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {prepareAndroidSource} = require('../scripts/prepare-android-source.cjs');
const patches = ['source-build', 'font-environment'].flatMap(name => require(`../scripts/patches/react-native-0.81.5-${name}.json`).files);
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-source-guard-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const packageFile = path.join(root, 'package.json');
  fs.writeFileSync(packageFile, JSON.stringify({version: '0.81.5'}));
  for (const file of patches) {
    // Start from actual reviewed package bytes, reversing only this candidate's
    // exact edits. This exercises guards against the actual native source.
    let source = fs.readFileSync(path.join('node_modules/react-native', file.path), 'utf8');
    for (const change of [...file.changes].reverse()) if (source.includes(change.after)) source = source.replace(change.after, change.before);
    const target = path.join(root, file.path);
    fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, source);
  }
  return {root, packageFile};
}
test('native source preparation is repeatable and preserves unrelated bytes', t => {
  const {root, packageFile} = fixture(t);
  const unrelated = path.join(root, 'owner-file'); fs.writeFileSync(unrelated, 'retained');
  prepareAndroidSource(packageFile);
  const once = patches.map(file => fs.readFileSync(path.join(root, file.path), 'utf8'));
  prepareAndroidSource(packageFile);
  assert.deepEqual(patches.map(file => fs.readFileSync(path.join(root, file.path), 'utf8')), once);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'retained');
});
test('native context drift fails before any source file is patched', t => {
  const {root, packageFile} = fixture(t);
  const target = path.join(root, patches.at(-1).path);
  fs.appendFileSync(target, '\n// external edit\n');
  const before = patches.map(file => fs.readFileSync(path.join(root, file.path), 'utf8'));
  assert.throws(() => prepareAndroidSource(packageFile), /context drift/);
  assert.deepEqual(patches.map(file => fs.readFileSync(path.join(root, file.path), 'utf8')), before);
  fs.writeFileSync(packageFile, JSON.stringify({version: '0.82.0'}));
  assert.throws(() => prepareAndroidSource(packageFile), /new React Native version/);
});
