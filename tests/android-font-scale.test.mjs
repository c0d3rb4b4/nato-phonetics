import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {checkSamples} = require('../scripts/android-font-scale-gate.cjs');
function readSamples(name) {
  return JSON.parse(fs.readFileSync(new URL(`./fixtures/android-observations/${name}.json`, import.meta.url)));
}

test('real stale native text frames remain rejected', () => {
  const report = checkSamples(readSamples('stale-text-frames'));
  assert.equal(report.passed, false);
  assert.deepEqual(report.comparisons.filter(row => row.liveStage === 'live2' && !row.passed).map(row => row.name), ['stable', 'feedback', 'input']);
  assert.equal(report.errors.length, 0);
});
test('native acceptance rejects incomplete stages and remounts even with cold-equivalent frames', () => {
  const {cold1, cold2} = readSamples('stale-text-frames');
  const samples = {cold1, return1: cold1, cold2, live2: cold2};
  assert.equal(checkSamples(samples).passed, true);
  samples.live2 = {...samples.live2, mounts: 2};
  assert.equal(checkSamples(samples).passed, false);
  delete samples.cold1;
  assert.equal(checkSamples(samples).passed, false);
});
test('correct outer frames cannot hide stale editable glyph sizing', () => {
  const samples = readSamples('stale-input-glyphs');
  const report = checkSamples(samples);
  assert.equal(report.comparisons.every(row => row.passed), true);
  assert.equal(report.passed, false);
  assert.deepEqual(report.widgetComparisons.filter(row => !row.passed).map(row => row.liveStage), ['live2']);
});
