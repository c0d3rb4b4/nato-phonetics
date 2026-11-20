// Apply the existing editing predicates to six fresh stage observations. Only
// the cold1/cold2 reference sizes come from the earlier run of this fixture.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {checkReleaseSamples} = require('../../../../scripts/check-android-font-release-fixture.cjs');
const target = path.resolve(process.argv[2]);
const reference = path.join(__dirname, 'fixture-display', 'primary');
const read = (dir, name) => JSON.parse(fs.readFileSync(path.join(dir, name + '.json'), 'utf8'));
const fresh = read(target, 'samples');
const stages = ['editing-start', 'editing-before', 'editing-typed-before', 'editing-live2', 'editing-return1', 'editing-insert'];
assert.deepEqual(Object.keys(fresh).sort(), [...stages].sort());
const id = read(target, 'identity');
const originalId = read(reference, 'identity');
assert.equal(id.serial, originalId.serial);
assert.equal(id.originalWindowSize, originalId.originalWindowSize);
assert.deepEqual(Object.keys(id.identities).sort(), Object.keys(originalId.identities).sort());
for (const [pkg, installed] of Object.entries(id.identities)) {
  // Android selects a new /data/app/... location when installing the same APK.
  assert.equal(installed.sha256, installed.expectedSha256);
  assert.equal(installed.sha256, originalId.identities[pkg].sha256);
}
const {cold1, cold2} = read(reference, 'samples');
const report = checkReleaseSamples({cold1, cold2, ...fresh});
const state = report.state.filter(row => stages.includes(row.stage));
const identity = report.identities.find(row => row.stages[0] === 'editing-start');
const passed = state.length === stages.length && state.every(row => row.passed) &&
  identity?.passed && report.editing.length === 3 && report.editing.every(row => row.passed);
fs.writeFileSync(path.join(target, 'gate.json'), JSON.stringify({
  passed, state, identity, editing: report.editing, coldReference: '../../fixture-display/primary/samples.json',
}, null, 2) + '\n');
assert.equal(passed, true);
