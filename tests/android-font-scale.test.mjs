import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {checkSamples} = require('../scripts/android-font-scale-gate.cjs');
for (const run of ['run20', 'run22']) {
  test(`${run} real stale native measurements remain rejected`, () => {
    const samples = JSON.parse(fs.readFileSync(new URL(`../docs/evidence/${run}/android/samples.json`, import.meta.url)));
    const report = checkSamples(samples);
    assert.equal(report.passed, false);
    assert.deepEqual(report.comparisons.filter(row => row.liveStage === 'live2' && !row.passed).map(row => row.name), ['stable', 'feedback', 'input']);
    assert.equal(report.errors.length, 0);
  });
}
test('native acceptance rejects incomplete stages and remounts even with cold-equivalent frames', () => {
  const archived = JSON.parse(fs.readFileSync(new URL('../docs/evidence/run20/android/samples.json', import.meta.url)));
  const samples = {cold1: archived.cold1, return1: archived.cold1, cold2: archived.cold2, live2: archived.cold2};
  assert.equal(checkSamples(samples).passed, true);
  samples.live2 = {...samples.live2, mounts: 2};
  assert.equal(checkSamples(samples).passed, false);
  delete samples.cold1;
  assert.equal(checkSamples(samples).passed, false);
});
test('correct outer frames cannot hide stale editable glyph sizing', () => {
  const samples = JSON.parse(fs.readFileSync(new URL('../docs/evidence/run26/android/adoption-runtime/samples.json', import.meta.url)));
  const report = checkSamples(samples);
  assert.equal(report.comparisons.every(row => row.passed), true);
  assert.equal(report.passed, false);
  assert.deepEqual(report.widgetComparisons.filter(row => !row.passed).map(row => row.liveStage), ['live2']);
});
