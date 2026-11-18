// Export evidence from the separately built XCUITest runner; never changes the app.
// Usage: node capture-ios.cjs <verified .app> <xcresult attachment directory> [...]
// First export each result with: xcrun xcresulttool export attachments --path ... --output-path ...
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const [app, ...sources] = process.argv.slice(2);
const output = path.join(__dirname, 'screenshots/ios');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const artifact = JSON.parse(fs.readFileSync(path.join(__dirname, '../run03-ios-artifact.json')));
if (!app || !sources.length || hash(path.join(app, 'NATOPhonetics')) !== artifact.nativeExecutableSha256
    || hash(path.join(app, 'main.jsbundle')) !== artifact.javaScriptBundleSha256) {
  throw new Error('Supply the verified Run 03 application and exported XCTest attachments');
}
const states = {
  'home-light': ['light', 'Home with native status area, insets, icons and feature cards'],
  'alphabet-light': ['light', 'Alphabet viewport, A–H visible; remaining cards scroll'],
  'converter-empty-light': ['light', 'Empty input and disabled phrase control'],
  'converter-populated-light': ['light', 'CV34 7AP entered with one-second pauses and exact prefix assertions; full value after Return and all seven emitted cards asserted'],
  'quiz-light': ['light', 'Random unanswered quiz with four choices'],
  'quiz-feedback-light': ['light', 'Submitted first choice, persistent answer/feedback and Next/Replay controls'],
  'settings-dark': ['dark', 'Dark selected using ordinary Settings control'],
  'home-dark-restarted': ['dark', 'Home after app termination/relaunch, saved dark appearance retained'],
  'voice-dark': ['dark', 'Real installed iOS voices, System Default selected'],
  'audio-help-light': ['light', 'Audio troubleshooting; audio test not invoked by this capture step'],
  'menu-cold-light': ['light', 'Cold natophonetics://menu route; Back to App subsequently asserted to return Home'],
};
const byName = new Map();
for (const source of sources) {
  const exported = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json')));
  for (const test of exported) for (const attachment of test.attachments) {
    const name = attachment.suggestedHumanReadableName.split('_0_')[0];
    if (!states[name] || attachment.isAssociatedWithFailure) continue;
    if (attachment.deviceId !== artifact.simulator.udid) throw new Error('Unexpected capture device');
    byName.set(name, { source, attachment, testIdentifier: test.testIdentifier });
  }
}
fs.mkdirSync(output, { recursive: true });
const captures = [];
for (const [name, [theme, state]] of Object.entries(states)) {
  const value = byName.get(name);
  if (!value) throw new Error(`Missing native capture: ${name}`);
  if (name === 'converter-populated-light' && !value.testIdentifier.includes('testCaptureNativeStates')) {
    throw new Error('Use the final full-state capture with exact-value and emitted-card assertions');
  }
  const file = path.join(output, `${name}.png`);
  fs.copyFileSync(path.join(value.source, value.attachment.exportedFileName), file);
  const png = fs.readFileSync(file);
  if (png.subarray(1, 4).toString() !== 'PNG') throw new Error('Unexpected attachment format');
  captures.push({ file: `${name}.png`, theme, state,
    capturedAt: new Date(value.attachment.timestamp * 1000).toISOString(),
    pixels: { width: png.readUInt32BE(16), height: png.readUInt32BE(20) },
    bytes: png.length, sha256: hash(file), testIdentifier: value.testIdentifier,
    originalAttachment: value.attachment });
}
const metadata = { date: '2026-11-16', platform: 'ios', device: artifact.simulator,
  captureMethod: 'XCUIScreen.main.screenshot(), retained XCTest PNG attachment exported by xcresulttool',
  xcode: artifact.xcode, app, version: artifact.version, build: artifact.build,
  executableSha256: artifact.nativeExecutableSha256, bundleSha256: artifact.javaScriptBundleSha256,
  captures };
fs.writeFileSync(path.join(output, 'metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(`Exported ${captures.length} actual native screenshots; inspect every image before accepting evidence.`);
