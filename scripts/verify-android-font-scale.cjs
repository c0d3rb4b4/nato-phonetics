#!/usr/bin/env node
// Actual native runtime regression. Start the dedicated Metro config first.
// Inspector evaluates observations only; it never replaces the React root.
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const WebSocket = require('ws');
const {checkSamples, inputContentHeight, equivalentHeight} = require('./android-font-scale-gate.cjs');
const {captureNativeJavascript} = require('./capture-native-javascript.cjs');
const args = process.argv.slice(2);
if (args[0] === '--samples') {
  const report = checkSamples(JSON.parse(fs.readFileSync(args[1], 'utf8')));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}
const out = path.resolve(args[0] || 'artifacts/android-font-scale');
const serial = process.env.ANDROID_SERIAL;
if (!serial) throw new Error('Set ANDROID_SERIAL to the intended test emulator');
const app = 'com.natophonetics.app';
const adb = (...params) => execFileSync('adb', ['-s', serial, ...params]);
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function runtime(expression) {
  const pages = await (await fetch('http://127.0.0.1:8081/json')).json();
  const page = pages.find(p => p.appId === app || p.description?.includes(app));
  if (!page) throw new Error('No app inspector target');
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    const timer = setTimeout(() => { ws.close(); reject(new Error('Inspector timeout')); }, 10000);
    ws.on('open', () => ws.send(JSON.stringify({id: 1, method: 'Runtime.evaluate', params: {expression, returnByValue: true, awaitPromise: true}})));
    ws.on('message', bytes => {
      const response = JSON.parse(bytes.toString());
      if (response.id !== 1) return;
      clearTimeout(timer); ws.close();
      if (response.error || response.result.exceptionDetails) reject(new Error(JSON.stringify(response)));
      else resolve(response.result.result.value);
    });
    ws.on('error', error => { clearTimeout(timer); reject(error); });
  });
}
const samples = {};
const captures = [];
async function ready(scale) {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    try {
      if (await runtime(`Math.abs((globalThis.__fontProbe?.dimensions?.fontScale ?? -1) - ${scale}) < 0.000001`)) { await sleep(600); return; }
    } catch { /* Startup target may not yet exist. */ }
    await sleep(300);
  }
  throw new Error(`Fixture did not reach scale ${scale}`);
}
async function sample(stage) {
  await runtime('globalThis.__fontProbe.sample(); true');
  await sleep(250);
  samples[stage] = await runtime('globalThis.__fontProbe');
  const image = adb('exec-out', 'screencap', '-p');
  const file = `screenshots/${stage}.png`;
  fs.writeFileSync(path.join(out, file), image);
  captures.push({stage, file, sha256: createHash('sha256').update(image).digest('hex'), command: `adb -s ${serial} exec-out screencap -p`});
  console.log(JSON.stringify({stage, dimensions: samples[stage].dimensions, frames: samples[stage].frames, mounts: samples[stage].mounts, value: samples[stage].value}));
}
async function start(scale) {
  adb('shell', 'am', 'force-stop', app);
  adb('shell', 'settings', 'put', 'system', 'font_scale', String(scale));
  adb('shell', 'am', 'start', '-n', `${app}/.MainActivity`);
  await ready(scale);
}
function tapInput(density) {
  adb('shell', 'uiautomator', 'dump', '/sdcard/nato-font-input.xml');
  const xml = adb('exec-out', 'cat', '/sdcard/nato-font-input.xml').toString();
  const node = xml.match(/<node\b[^>]*resource-id="(?:[^"]*\/)?probe-input"[^>]*>/)?.[0];
  const box = node?.match(/bounds="\[(-?\d+),(-?\d+)\]\[(-?\d+),(-?\d+)\]"/)?.slice(1).map(Number);
  if (!box || box[2] <= box[0] || box[3] <= box[1]) throw new Error('No visible native input bounds');
  // UIAutomator supplies physical screen coordinates. measureInWindow on this
  // edge-to-edge Activity has a status-bar offset and cannot drive screen taps.
  adb('shell', 'input', 'tap', String(Math.round(box[0]+45*density)), String(Math.round((box[1]+box[3])/2)));
  return box;
}
(async () => {
  fs.mkdirSync(path.join(out, 'screenshots'), {recursive: true});
  const originalScale = adb('shell', 'settings', 'get', 'system', 'font_scale').toString().trim();
  const originalWindowSize = adb('shell', 'wm', 'size').toString().trim();
  const originalOverride = originalWindowSize.match(/Override size: (\d+x\d+)/)?.[1] || 'reset';
  const apk = adb('shell', 'pm', 'path', app).toString().trim().replace(/^package:/, '');
  const apkSha256 = adb('shell', 'sha256sum', apk).toString().trim().split(/\s/)[0];
  const expectedApkSha256 = process.env.NATO_EXPECTED_APK_SHA256 || createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../android/app/build/outputs/apk/debug/app-debug.apk'))).digest('hex');
  const identity = {date: new Date().toISOString(), serial, apk, apkSha256, expectedApkSha256, runtime: adb('shell', 'getprop', 'ro.build.version.release').toString().trim(), fixtureSha256: createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../tests/fixtures/android-font-scale/index.js'))).digest('hex'), originalScale};
  fs.writeFileSync(path.join(out, 'identity.json'), JSON.stringify(identity, null, 2) + '\n');
  if (apkSha256 !== expectedApkSha256) throw new Error('Installed APK differs from intended candidate; install and verify before running regression');
  try {
    await start(1); await sample('cold1');
    for (const [stage, scale] of [['live2', 2], ['return1', 1]]) {
      adb('shell', 'settings', 'put', 'system', 'font_scale', String(scale));
      await ready(scale); await sample(stage);
    }
    await start(2); await sample('cold2');
    const report = checkSamples(samples);
    fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report, null, 2));
    process.exitCode = report.passed ? 0 : 1;
    await captureNativeJavascript(path.join(out, 'loaded-source'));
    if (args.includes('--resize')) {
      const narrowSize = args[args.indexOf('--resize')+1];
      if (!/^\d+x\d+$/.test(narrowSize)) throw new Error('Pass an explicit physical window size after --resize');
      const rows = [];
      // Every paragraph has an explicit unchanged260dp width; this single-line
      // input's height is independent of available width. Compare the same
      // font environment across a real live window resize, preserving its root.
      for (const [stage, size] of [['resize-narrow2', narrowSize], ['resize-restored2', originalOverride]]) {
        adb('shell', 'wm', 'size', size); await sleep(1000); await sample(stage);
        const row = samples[stage];
        for (const name of ['stable', 'feedback', 'input', 'revision', 'nested', 'input-widget']) {
          const height = name === 'input-widget' ? inputContentHeight(row) : row.frames[name]?.height;
          const reference = name === 'input-widget' ? inputContentHeight(samples.cold2) : samples.cold2.frames[name]?.height;
          rows.push({stage, name, height, reference, passed: row.mounts === 1 && row.value === 'NUWJ359' && equivalentHeight(height, reference, row.dimensions.scale)});
        }
      }
      const resize = {passed: rows.every(row => row.passed) && samples['resize-narrow2'].dimensions.width !== samples.cold2.dimensions.width && samples['resize-restored2'].dimensions.width === samples.cold2.dimensions.width, originalWindowSize, narrowSize, comparisons: rows};
      fs.writeFileSync(path.join(out, 'resize-report.json'), JSON.stringify(resize, null, 2)+'\n');
      if (!resize.passed) process.exitCode = 1;
    }
    if (args.includes('--sweep')) {
      for (const [stage, scale] of [['cold085', 0.85], ['cold13', 1.3]]) {
        await start(scale); await sample(stage);
      }
      await start(1);
      const rows = [];
      for (const [index, scale] of [0.85, 1.3, 2, 1, 0.85, 2, 1.3, 1].entries()) {
        const stage = `sweep${index}-${scale}`;
        adb('shell', 'settings', 'put', 'system', 'font_scale', String(scale));
        await ready(scale); await sample(stage);
        const cold = samples[{0.85: 'cold085', 1: 'cold1', 1.3: 'cold13', 2: 'cold2'}[scale]];
        for (const name of ['stable', 'feedback', 'input', 'revision', 'nested']) {
          const height = samples[stage].frames[name]?.height; const reference = cold.frames[name]?.height;
          rows.push({stage, name, height, reference, passed: Number.isFinite(height) && Number.isFinite(reference) && Math.abs(height-reference)*samples[stage].dimensions.scale <= 1});
        }
        const height = inputContentHeight(samples[stage]); const reference = inputContentHeight(cold);
        rows.push({stage, name: 'input-widget', height, reference, passed: equivalentHeight(height, reference, samples[stage].dimensions.scale)});
        if (samples[stage].mounts !== 1 || samples[stage].value !== 'NUWJ359') throw new Error(`State lost at ${stage}`);
      }
      const sweep = {passed: rows.every(row => row.passed), comparisons: rows};
      fs.writeFileSync(path.join(out, 'sweep-report.json'), JSON.stringify(sweep, null, 2)+'\n');
      if (!sweep.passed) process.exitCode = 1;
    }
    if (args.includes('--editing')) {
      await start(1); await sample('editing-start');
      const density = samples['editing-start'].dimensions.scale;
      tapInput(density);
      await sleep(500);
      const screenBounds = tapInput(density);
      await sleep(300); await sample('editing-before');
      const before = samples['editing-before']; let caret = before.selection?.start;
      if (!before.focused || !(caret > 0 && caret < 7) || before.selection.end !== caret) throw new Error('Touch driver did not establish an interior collapsed caret before the font transition');
      // Exercise the native edited-input/spannable state before changing scale.
      const retainedValue = 'NUWJ359'.slice(0,caret)+'Q'+'NUWJ359'.slice(caret);
      adb('shell', 'input', 'text', 'Q'); await sleep(300); await sample('editing-typed-before');
      caret += 1;
      const typed = samples['editing-typed-before'];
      if (!typed.focused || typed.value !== retainedValue || typed.selection?.start !== caret || typed.selection?.end !== caret) throw new Error('Native typing precondition failed');
      const checks = [];
      for (const [stage, scale] of [['editing-live2', 2], ['editing-return1', 1]]) {
        adb('shell', 'settings', 'put', 'system', 'font_scale', String(scale));
        await ready(scale); await sample(stage);
        const row = samples[stage];
        const cold = samples[scale === 2 ? 'cold2' : 'cold1'];
        const reference = cold.frames.input.height;
        const widgetHeight = inputContentHeight(row); const referenceWidgetHeight = inputContentHeight(cold);
        checks.push({stage, caret, retainedValue, inputHeight: row.frames.input.height, referenceHeight: reference, widgetHeight, referenceWidgetHeight, passed: row.focused === true && row.selection?.start === caret && row.selection?.end === caret && row.value === retainedValue && row.mounts === 1 && equivalentHeight(row.frames.input.height,reference,row.dimensions.scale) && equivalentHeight(widgetHeight,referenceWidgetHeight,row.dimensions.scale)});
      }
      adb('shell', 'input', 'text', 'Z'); await sleep(300); await sample('editing-insert');
      const inserted = samples['editing-insert'];
      checks.push({stage: 'editing-insert', caret, passed: inserted.focused === true && inserted.value === retainedValue.slice(0,caret)+'Z'+retainedValue.slice(caret) && inserted.selection?.start === caret+1 && inserted.selection?.end === caret+1 && inserted.mounts === 1});
      const editing = {passed: checks.every(row => row.passed), screenBounds, checks, composition: 'unrun; adb key events do not establish IME composition retention'};
      fs.writeFileSync(path.join(out, 'editing-report.json'), JSON.stringify(editing, null, 2)+'\n');
      if (!editing.passed) process.exitCode = 1;
    }
  } finally {
    fs.writeFileSync(path.join(out, 'samples.json'), JSON.stringify(samples, null, 2) + '\n');
    fs.writeFileSync(path.join(out, 'captures.json'), JSON.stringify(captures, null, 2) + '\n');
    adb('shell', 'am', 'force-stop', app);
    adb('shell', 'settings', 'put', 'system', 'font_scale', originalScale);
    if (args.includes('--resize')) adb('shell', 'wm', 'size', originalOverride);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
