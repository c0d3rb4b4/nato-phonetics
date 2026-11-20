// Backport the merged Yoga #2037 precision fix to RN 0.81.5's source-built Yoga.
// The public float API and pixel rounding policy stay intact; only edge
// subtraction happens in double before narrowing. Android's Maven binary is
// unchanged. Re-review this patch when upgrading React Native.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const patch = require('./patches/react-native-0.81.5-yoga-pixel-grid.json');
const sha = source => createHash('sha256').update(source).digest('hex');

function patchNativeYoga(packageFile = require.resolve('react-native/package.json')) {
  const manifest = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (manifest.version !== patch.version) throw new Error('Re-review Yoga precision patch for this React Native version.');
  const file = path.join(path.dirname(packageFile), patch.sourcePath);
  const source = fs.readFileSync(file, 'utf8');
  const digest = sha(source);
  if (digest === patch.patchedSha256) return;
  if (digest !== patch.originalSha256) throw new Error('Yoga source changed; re-review precision patch.');
  let candidate = source;
  for (const { before, after } of patch.changes) {
    if (!before || candidate.split(before).length !== 2) throw new Error('Yoga patch context changed.');
    candidate = candidate.replace(before, after);
  }
  if (sha(candidate) !== patch.patchedSha256) throw new Error('Yoga precision patch output differs from reviewed source.');
  fs.writeFileSync(file, candidate);
}
module.exports = { patchNativeYoga };
if (require.main === module) {
  patchNativeYoga();
  console.log('React Native 0.81.5 source-built Yoga dimension precision verified (upstream #2037).');
}
