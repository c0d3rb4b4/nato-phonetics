// Apply the existing physical-pixel geometry and baseline assertions to the OS split pair.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {checkCapture} = require('../../../../scripts/check-android-release-tiles.cjs');

async function main(directory) {
  const read = name => JSON.parse(fs.readFileSync(path.join(directory, name), 'utf8'));
  const result = read('result.json');
  assert.equal(result.passed, true);
  assert.equal(result.selectedPackageAbi, 'x86_64');
  const identity = read('identity.json');
  assert.equal(identity.nonDebuggable, true);
  const stages = [
    ['before-1', 1], ['before-2', 2], ['split-half-2', 2], ['split-large-2', 2],
    ['split-visible-tile-2', 2], ['restored-2', 2], ['returned-1', 1],
  ];
  const groups = [];
  for (const [name, scale] of stages) {
    const capture = read(name + '-native-layout.json');
    assert.equal(capture.candidateSha256, identity.candidateSha256);
    assert.equal(capture.runtimePid, result.observations[0].runtimePid);
    assert.equal(capture.activityIdentity, result.observations[0].activityIdentity);
    const report = await checkCapture(capture, {scale});
    assert.equal(report.tiles, 7, 'All seven populated converter roots');
    groups.push({name, measuredBaselines: report.measuredBaselines, maxDeltaPx: report.maxBaselineDeltaPhysicalPixels});
  }
  const visible = read('checks.json').find(row => row.check === 'split-visible-tile-2');
  assert(visible.tiles.some(tile => tile.testID === 'converter-0'));
  return {passed: true, candidateSha256: identity.candidateSha256, groups,
    measuredBaselines: groups.reduce((total, group) => total + group.measuredBaselines, 0)};
}
main(process.argv[2]).then(report => console.log(JSON.stringify(report, null, 2)))
  .catch(error => { console.error(error); process.exitCode = 1; });
