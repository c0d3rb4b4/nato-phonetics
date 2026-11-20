// react-native-tts 4.1.1 needs two native compatibility corrections:
// Android text hashes collide across replays; iOS BOOL* bridge arguments are
// unsupported by React Native's TurboModule interop (which expects scalar BOOL).
// Validate every edit before writing, and fail closed on upstream source drift.
const fs = require('node:fs');
const path = require('node:path');

function replaceGuarded(contents, before, after, expected = 1) {
  const beforeCount = contents.split(before).length - 1;
  const afterCount = contents.split(after).length - 1;
  if (beforeCount === expected && afterCount === 0) return contents.split(before).join(after);
  if (beforeCount === 0 && afterCount === expected) return contents;
  throw new Error(`Native speech source changed; re-review patch: ${before}`);
}

function patchNativeTts(packageFile = require.resolve('react-native-tts/package.json')) {
  const manifest = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
  if (manifest.version !== '4.1.1') throw new Error('Re-review native speech patch for this react-native-tts version.');
  const root = path.dirname(packageFile);
  const android = path.join(root, 'android/src/main/java/net/no_mad/tts/TextToSpeechModule.java');
  const ios = path.join(root, 'ios/TextToSpeech/TextToSpeech.m');
  const androidSource = replaceGuarded(fs.readFileSync(android, 'utf8'),
    'String utteranceId = Integer.toString(utterance.hashCode());',
    'String utteranceId = java.util.UUID.randomUUID().toString();');
  let iosSource = fs.readFileSync(ios, 'utf8');
  for (const selector of ['stop', 'pause', 'setDucking']) {
    iosSource = replaceGuarded(iosSource, `${selector}:(BOOL *)`, `${selector}:(BOOL)`);
  }
  iosSource = replaceGuarded(iosSource, 'skipTransform:(BOOL *)', 'skipTransform:(BOOL)');
  iosSource = replaceGuarded(iosSource, 'if(onWordBoundary != NULL && onWordBoundary)', 'if(onWordBoundary)', 2);
  for (const [file, contents] of [[android, androidSource], [ios, iosSource]]) {
    if (fs.readFileSync(file, 'utf8') !== contents) fs.writeFileSync(file, contents);
  }
}

module.exports = { patchNativeTts };
if (require.main === module) {
  patchNativeTts();
  console.log('react-native-tts 4.1.1 Android unique IDs and iOS scalar Boolean bridge arguments verified.');
}
