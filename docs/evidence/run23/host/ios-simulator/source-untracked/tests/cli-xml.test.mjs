import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

const require = createRequire(import.meta.url);
const androidConsumer = require.resolve('@react-native-community/cli-config-android/build/config/getMainActivity');
const appleConsumer = require.resolve('@react-native-community/cli-platform-apple/build/tools/getInfo');
const getMainActivity = require(androidConsumer).default;

test('CLI discovers the real Android launcher with its separate deep-link intent', () => {
  assert.equal(getMainActivity(new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url)), '.MainActivity');
});

test('CLI manifest parsing preserves single/multiple activities, intent arrays and escaped names', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'nato-cli-xml-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));
  const manifest = path.join(directory, 'AndroidManifest.xml');
  const launcher = '<intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter>';
  for (const activities of [
    `<activity android:name=".CaféActivity">${launcher}</activity>`,
    `<activity android:name=".Other"/><activity android:name=".CaféActivity"><intent-filter><action android:name="android.intent.action.VIEW"/></intent-filter>${launcher}</activity>`,
    '<activity android:name=".CaféActivity"><intent-filter><action android:name="other"/><action android:name="android.intent.action.MAIN"/><category android:name="other"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity>',
  ]) {
    fs.writeFileSync(manifest, `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application>${activities}</application></manifest>`);
    assert.equal(getMainActivity(manifest), '.CaféActivity');
  }
  for (const xml of ['<manifest><application/></manifest>', '<manifest><application><activity', '']) {
    fs.writeFileSync(manifest, xml);
    assert.equal(getMainActivity(manifest), null);
  }
});

test('Apple CLI-resolved parser preserves workspace attributes and single/multiple project references', () => {
  const { XMLParser } = createRequire(appleConsumer)('fast-xml-parser');
  const parser = new XMLParser({ ignoreAttributes: false });
  const real = parser.parse(fs.readFileSync(new URL('../ios/NATOPhonetics.xcworkspace/contents.xcworkspacedata', import.meta.url), 'utf8'));
  assert.deepEqual(real.Workspace.FileRef.map(ref => ref['@_location']), ['group:NATOPhonetics.xcodeproj', 'group:Pods/Pods.xcodeproj']);
  const single = parser.parse('<?xml version="1.0"?><Workspace version="1.0"><FileRef location="group:Café &amp; App.xcodeproj"/></Workspace>');
  assert.equal(single.Workspace.FileRef['@_location'], 'group:Café & App.xcodeproj');
  // Both the prior4.5.7 and current5.x defaults leave numeric entities encoded;
  // htmlEntities is not enabled by the CLI. Do not invent a new decoding rule.
  assert.equal(parser.parse('<Workspace><FileRef location="group:Caf&#233;.xcodeproj"/></Workspace>').Workspace.FileRef['@_location'], 'group:Caf&#233;.xcodeproj');
});

test('both CLI-resolved parsers bound unterminated stop nodes and retain valid literal bodies', () => {
  // Advisory GHSA-474x-hrwr-fgx4: old parsers repeatedly scan the remaining
  // suffix for every "<a ". Bound the child so regressions cannot hang CI.
  // This checks a fixed corpus, not a timing ratio or comprehensive fuzzing.
  const worker = String.raw`
    const assert = require('node:assert/strict');
    const { createRequire } = require('node:module');
    for (const consumer of JSON.parse(process.argv[1])) {
      const { XMLParser } = createRequire(consumer)('fast-xml-parser');
      const parser = new XMLParser({ stopNodes: ['stop'] });
      assert.equal(parser.parse('<stop><a > &amp; literal</stop>').stop, '<a > &amp; literal');
      for (const count of [100000, 200000, 400000]) {
        assert.throws(() => parser.parse('<stop>' + '<a '.repeat(count)), /[Uu]nexpected end|[Cc]losing tag/);
      }
    }
  `;
  const result = spawnSync(process.execPath, ['-e', worker, JSON.stringify([androidConsumer, appleConsumer])], { encoding: 'utf8', timeout: 5000 });
  assert.equal(result.error, undefined, result.error?.message);
  assert.equal(result.status, 0, result.stderr);
});
