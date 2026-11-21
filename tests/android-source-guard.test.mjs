import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {prepareAndroidSource} = require('../scripts/prepare-android-source.cjs');
const yoga = require('../scripts/patches/react-native-0.81.5-yoga-pixel-grid.json');
const patches = [
  ...['source-build', 'font-environment'].flatMap(name => require(`../scripts/patches/react-native-0.81.5-${name}.json`).files),
  {...yoga, path: yoga.sourcePath},
];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const fileDigests = root => patches.map(file => digest(fs.readFileSync(path.join(root, file.path))));
function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-source-guard-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const packageFile = path.join(root, 'package.json');
  fs.writeFileSync(packageFile, JSON.stringify({version: '0.81.5'}));
  for (const file of patches) {
    // Reverse only exact edits from the reviewed installed package bytes.
    let source = fs.readFileSync(path.join('node_modules/react-native', file.path), 'utf8');
    const installed = digest(source);
    if (installed === file.patchedSha256 || installed === file.previousPatchedSha256) {
      for (const change of [...file.changes].reverse()) {
        const context = installed === file.patchedSha256 ? change.after : change.previous ?? change.after;
        source = source.replace(context, () => change.before);
      }
    }
    assert.equal(digest(source), file.originalSha256, file.path);
    const target = path.join(root, file.path);
    fs.mkdirSync(path.dirname(target), {recursive: true}); fs.writeFileSync(target, source);
  }
  return {root, packageFile};
}
test('native source preparation is repeatable and preserves unrelated bytes', t => {
  const {root, packageFile} = fixture(t);
  const unrelated = path.join(root, 'owner-file'); fs.writeFileSync(unrelated, 'retained');
  assert.throws(() => prepareAndroidSource(packageFile, {checkOnly: true}));
  assert.deepEqual(fileDigests(root), patches.map(file => file.originalSha256));
  prepareAndroidSource(packageFile);
  const expected = patches.map(file => file.patchedSha256);
  assert.deepEqual(fileDigests(root), expected);
  prepareAndroidSource(packageFile, {checkOnly: true});
  prepareAndroidSource(packageFile);
  assert.deepEqual(fileDigests(root), expected);
  assert.equal(fs.readFileSync(unrelated, 'utf8'), 'retained');
});
test('preparation upgrades the previously reviewed single-compiler patch in place', t => {
  const {root, packageFile} = fixture(t);
  const file = patches.find(entry => entry.previousPatchedSha256);
  const target = path.join(root, file.path);
  let source = fs.readFileSync(target, 'utf8');
  for (const change of file.changes) source = source.replace(change.before, () => change.previous ?? change.after);
  assert.equal(digest(source), file.previousPatchedSha256);
  fs.writeFileSync(target, source);
  assert.throws(() => prepareAndroidSource(packageFile, {checkOnly: true}), /unprepared/);
  assert.equal(digest(fs.readFileSync(target)), file.previousPatchedSha256);
  prepareAndroidSource(packageFile);
  assert.deepEqual(fileDigests(root), patches.map(entry => entry.patchedSha256));
  prepareAndroidSource(packageFile, {checkOnly: true});
});
test('native context drift fails before any source file is patched', t => {
  const {root, packageFile} = fixture(t);
  const target = path.join(root, yoga.sourcePath);
  fs.appendFileSync(target, '\n// external edit\n');
  const before = fileDigests(root);
  assert.throws(() => prepareAndroidSource(packageFile), /drift|re-review/i);
  assert.deepEqual(fileDigests(root), before);
  fs.writeFileSync(packageFile, JSON.stringify({version: '0.82.0'}));
  assert.throws(() => prepareAndroidSource(packageFile), /new React Native version/);
  assert.deepEqual(fileDigests(root), before);
});
test('a complete prefab survives preparation, while a stale packaged header requires regeneration', t => {
  const {root, packageFile} = fixture(t);
  prepareAndroidSource(packageFile);
  const relativeRoots = [
    'ReactAndroid/build/prefab-headers/reactnative',
    'ReactAndroid/build/intermediates/prefab_package/release/prefab/modules/reactnative/include',
  ];
  const emitted = [];
  for (const relativeRoot of relativeRoots) {
    for (const file of patches.filter(entry => entry.path.endsWith('.h'))) {
      const include = file.path.replace(/^(?:ReactCommon\/|ReactAndroid\/src\/main\/jni\/)/, '');
      const exported = path.join(root, relativeRoot, include);
      fs.mkdirSync(path.dirname(exported), {recursive: true});
      fs.copyFileSync(path.join(root, file.path), exported);
      emitted.push(exported);
    }
  }
  prepareAndroidSource(packageFile);
  prepareAndroidSource(packageFile, {checkOnly: true});
  assert.ok(emitted.every(file => fs.existsSync(file)));
  const packaged = emitted.at(-1);
  fs.writeFileSync(packaged, '// stale ABI\n');
  assert.throws(() => prepareAndroidSource(packageFile, {checkOnly: true}), /prefab headers are stale/);
  assert.equal(fs.readFileSync(packaged, 'utf8'), '// stale ABI\n');
  prepareAndroidSource(packageFile);
  assert.ok(emitted.every(file => !fs.existsSync(file)));
  prepareAndroidSource(packageFile, {checkOnly: true});
});
