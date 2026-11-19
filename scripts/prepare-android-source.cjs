// Deliberate opt-in only; no mutation of the ordinary npm install/build path.
const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const buildPatch = require('./patches/react-native-0.81.5-source-build.json');
const fontPatch = require('./patches/react-native-0.81.5-font-environment.json');
const patch = {version: buildPatch.version, files: [...buildPatch.files, ...fontPatch.files]};
const sha = text => createHash('sha256').update(text).digest('hex');
function prepareAndroidSource(packageFile = require.resolve('react-native/package.json')) {
  const root = path.dirname(packageFile);
  if (JSON.parse(fs.readFileSync(packageFile, 'utf8')).version !== patch.version) throw new Error('Re-review Android source build for new React Native version');
  // Validate every input before writing any file.
  const writes = patch.files.map(file => {
    const target = path.join(root, file.path);
    let source = fs.readFileSync(target, 'utf8');
    if (sha(source) === file.patchedSha256) return null;
    if (sha(source) !== file.originalSha256) throw new Error(`Source build context drift: ${file.path}`);
    for (const change of file.changes) {
      if (source.split(change.before).length !== 2) throw new Error(`Ambiguous source build patch: ${file.path}`);
      source = source.replace(change.before, change.after);
    }
    if (sha(source) !== file.patchedSha256) throw new Error(`Source build output drift: ${file.path}`);
    return {target, source};
  });
  for (const write of writes) if (write) fs.writeFileSync(write.target, write.source);
  // RN's PreparePrefabHeaders task can remain up-to-date after source-header
  // edits. A mismatched exported class layout must never reach a consumer.
  const headerDrift = patch.files.filter(file => file.path.startsWith('ReactCommon/') && file.path.endsWith('.h')).some(file => {
    const exported = path.join(root, 'ReactAndroid/build/prefab-headers/reactnative', file.path.slice('ReactCommon/'.length));
    return fs.existsSync(exported) && sha(fs.readFileSync(exported)) !== sha(fs.readFileSync(path.join(root, file.path)));
  });
  if (writes.some(write => write?.target.endsWith('.h')) || headerDrift) {
    for (const relative of ['ReactAndroid/build/prefab-headers', 'ReactAndroid/build/intermediates/prefab_package', 'ReactAndroid/build/intermediates/prefab_package_header_only']) {
      fs.rmSync(path.join(root, relative), {recursive: true, force: true});
    }
  }
}
module.exports = {prepareAndroidSource};
if (require.main === module) {
  prepareAndroidSource();
  console.log('RN0.81.5 font-environment/source-build guards verified; Hermes remains pinned Maven0.81.5.');
}
