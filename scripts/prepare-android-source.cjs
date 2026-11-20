// npm prepares the pinned renderer. Direct Gradle builds verify the same inputs read-only.
const fs = require('node:fs');
const path = require('node:path');
const {createHash, randomUUID} = require('node:crypto');
const buildPatch = require('./patches/react-native-0.81.5-source-build.json');
const fontPatch = require('./patches/react-native-0.81.5-font-environment.json');
const yogaPatch = require('./patches/react-native-0.81.5-yoga-pixel-grid.json');
const patches = [...buildPatch.files, ...fontPatch.files, {...yogaPatch, path: yogaPatch.sourcePath}];
const sha = bytes => createHash('sha256').update(bytes).digest('hex');

// RN's PreparePrefabHeaders task can remain up-to-date after a header changes.
// Check both its export tree and existing build variants' consumer packages.
function prefabOutputs(root) {
  const build = path.join(root, 'ReactAndroid/build');
  const headers = path.join(build, 'prefab-headers');
  const packages = ['prefab_package', 'prefab_package_header_only'].map(name => path.join(build, 'intermediates', name));
  const includeRoots = [path.join(headers, 'reactnative')];
  for (const directory of packages) {
    if (!fs.existsSync(directory)) continue;
    for (const variant of fs.readdirSync(directory)) {
      includeRoots.push(path.join(directory, variant, 'prefab/modules/reactnative/include'));
    }
  }
  const exportedHeaders = patches.filter(file => file.path.endsWith('.h'));
  const stale = includeRoots.filter(dir => fs.existsSync(dir)).some(dir => exportedHeaders.some(file => {
    const include = file.path.replace(/^(?:ReactCommon\/|ReactAndroid\/src\/main\/jni\/)/, '');
    const target = path.join(dir, include);
    return !fs.existsSync(target) || sha(fs.readFileSync(target)) !== file.patchedSha256;
  }));
  return {stale, directories: [headers, ...packages]};
}

function prepareAndroidSource(packageFile = require.resolve('react-native/package.json'), {checkOnly = false} = {}) {
  const root = fs.realpathSync(path.dirname(packageFile));
  const version = JSON.parse(fs.readFileSync(packageFile, 'utf8')).version;
  if (![buildPatch, fontPatch, yogaPatch].every(manifest => manifest.version === version)) {
    throw new Error('Re-review Android source build for new React Native version');
  }

  // Stage every reviewed transformation in memory before changing any source or export.
  const writes = [];
  for (const file of patches) {
    const target = path.join(root, file.path);
    const bytes = fs.readFileSync(target);
    const digest = sha(bytes);
    if (digest === file.patchedSha256) continue;
    if (digest !== file.originalSha256) throw new Error(`Source build context drift: ${file.path}`);
    let source = bytes.toString('utf8');
    for (const change of file.changes) {
      if (source.split(change.before).length !== 2) throw new Error(`Ambiguous source build patch: ${file.path}`);
      source = source.replace(change.before, () => change.after);
    }
    if (sha(source) !== file.patchedSha256) throw new Error(`Source build output drift: ${file.path}`);
    writes.push({target, source});
  }

  const prefab = prefabOutputs(root);
  if (checkOnly) {
    if (writes.length || prefab.stale) {
      throw new Error(`React Native source is unprepared or prefab headers are stale. Run npm run prepare:android:source (${writes.length} source files require preparation).`);
    }
    return;
  }
  const invalidate = prefab.stale || writes.some(({target}) => target.endsWith('.h'));
  const remove = invalidate ? prefab.directories.filter(dir => fs.existsSync(dir)) : [];
  for (const directory of remove) {
    if (fs.realpathSync(directory) !== directory) throw new Error(`Unexpected linked prefab output: ${directory}`);
  }
  // Per-file replacement keeps source at an accepted original or final digest on interruption.
  for (const {target, source} of writes) {
    const temporary = `${target}.${randomUUID()}.tmp`;
    try {
      fs.writeFileSync(temporary, source, {flag: 'wx', mode: fs.statSync(target).mode});
      fs.renameSync(temporary, target);
    } finally {
      fs.rmSync(temporary, {force: true});
    }
  }
  for (const directory of remove) fs.rmSync(directory, {recursive: true, force: true});
}

module.exports = {prepareAndroidSource};
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1 || (args.length === 1 && args[0] !== '--check')) {
      throw new Error('Usage: node scripts/prepare-android-source.cjs [--check]');
    }
    prepareAndroidSource(undefined, {checkOnly: args.includes('--check')});
    console.log(`React Native ${buildPatch.version}: verified ${patches.length} reviewed renderer, Yoga and source-build files.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
