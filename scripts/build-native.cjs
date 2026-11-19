#!/usr/bin/env node
// Direct local native builds; signing values stay in the process environment.
const { spawnSync } = require('node:child_process');
const { existsSync, mkdirSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const artifacts = path.join(root, 'artifacts');
const mode = process.argv[2];
const jobs = Number(process.env.NATO_BUILD_JOBS || 1);
if (!Number.isInteger(jobs) || jobs < 1 || jobs > 4) {
  console.error('NATO_BUILD_JOBS must be an integer from 1 to 4.');
  process.exit(1);
}
function run(command, args, cwd = root) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', env: process.env });
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
}
mkdirSync(artifacts, { recursive: true });
switch (mode) {
  case 'android-debug':
    run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', [':app:assembleDebug', '--no-daemon', `--max-workers=${jobs}`], path.join(root, 'android'));
    break;
  case 'android-release':
    run(process.platform === 'win32' ? 'gradlew.bat' : './gradlew', [':app:bundleRelease', '--no-daemon', `--max-workers=${jobs}`], path.join(root, 'android'));
    break;
  case 'ios-simulator':
    run('xcodebuild', ['-workspace', 'ios/NATOPhonetics.xcworkspace', '-scheme', 'NATOPhonetics',
      '-configuration', 'Release', '-sdk', 'iphonesimulator', '-destination', 'generic/platform=iOS Simulator',
      `ARCHS=${process.arch === 'arm64' ? 'arm64' : 'x86_64'}`, '-jobs', String(jobs),
      '-derivedDataPath', 'artifacts/ios-simulator', 'ONLY_ACTIVE_ARCH=YES', 'CODE_SIGNING_ALLOWED=NO', 'build']);
    break;
  case 'ios-archive':
    run('xcodebuild', ['-workspace', 'ios/NATOPhonetics.xcworkspace', '-scheme', 'NATOPhonetics',
      '-configuration', 'Release', '-destination', 'generic/platform=iOS', '-jobs', String(jobs),
      '-archivePath', 'artifacts/NATOPhonetics.xcarchive', 'archive']);
    break;
  case 'ios-export': {
    const options = process.env.NATO_EXPORT_OPTIONS_PLIST;
    if (!options || !existsSync(options)) {
      console.error('Set NATO_EXPORT_OPTIONS_PLIST to your local Xcode export options plist.');
      process.exit(1);
    }
    run('xcodebuild', ['-exportArchive', '-archivePath', 'artifacts/NATOPhonetics.xcarchive',
      '-exportPath', 'artifacts/ios-export', '-exportOptionsPlist', options]);
    break;
  }
  default:
    console.error('Usage: node scripts/build-native.cjs android-debug|android-release|ios-simulator|ios-archive|ios-export');
    process.exit(1);
}
