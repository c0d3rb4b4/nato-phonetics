#!/usr/bin/env node
// Run on a retrieved host directory with the revision and attempt from the job URL.
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const digest = value => createHash('sha256').update(value).digest('hex');
const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

function verifyHostArtifacts(directory, mode, commit, runId, attempt, signedRelease = false) {
  assert.match(commit, /^[a-f0-9]{40}$/, 'Expected a full git commit SHA');
  assert.equal(Boolean(runId), Boolean(attempt), 'Supply both run ID and attempt');
  assert(!signedRelease || mode === 'android-release', 'Signed verification requires android-release');
  const report = readJson(path.join(directory, 'report.json'));
  const source = readJson(path.join(directory, 'source.json'));
  assert.equal(report.schemaVersion, 2);
  assert.equal(report.mode, mode);
  assert.equal(report.status, 'passed');
  assert.equal(report.exitCode, 0);
  assert.equal(report.preflightOnly, false);
  assert.equal(report.commit, commit);
  assert.equal(source.head, commit);
  assert.equal(source.sourceId, digest(JSON.stringify({ head: source.head, files: source.files })));
  assert.equal(report.sourceId, source.sourceId);
  const patch = fs.readFileSync(path.join(directory, 'source.patch'));
  assert.equal(digest(patch), source.patchSha256);
  if (runId) {
    assert.match(runId, /^\d+$/);
    assert.match(attempt, /^\d+$/);
    assert.equal(report.remoteJob?.provider, 'github');
    assert.equal(report.remoteJob.runId, runId);
    assert.equal(report.remoteJob.attempt, attempt);
    assert.equal(patch.length, 0, 'Workflow checkout contains a patch');
    assert.deepEqual(source.untracked, [], 'Workflow checkout contains untracked inputs');
  }
  const outputs = {
    'android-debug': ['app-debug.apk'],
    'android-develop': ['app-develop.apk'],
    'android-release': [signedRelease || (report.artifacts.some(a => a.file === 'app-release.apk') && !runId)
      ? 'app-release.apk' : 'app-release-unsigned.apk', 'app-release.aab'],
    'ios-simulator': ['ios-simulator.tar.gz'],
    web: ['nato-web.tar.gz'],
  };
  assert(Object.hasOwn(outputs, mode), 'Select a downloadable build mode');
  const expected = outputs[mode].sort();
  assert.deepEqual(report.artifacts.map(a => a.file).sort(), expected, 'Product set in report');
  const productsOnDisk = fs.readdirSync(directory).filter(f => /\.(apk|aab|tar\.gz)$/.test(f)).sort();
  assert.deepEqual(productsOnDisk, expected, 'Retrieved product set');
  for (const { file, bytes, sha256 } of report.artifacts) {
    const local = path.join(directory, file);
    assert(fs.lstatSync(local).isFile(), `Expected a regular file: ${file}`);
    assert.equal(fs.statSync(local).size, bytes, `Size mismatch for ${file}`);
    assert(bytes > 0, `Empty product: ${file}`);
    assert.equal(digest(fs.readFileSync(local)), sha256, `SHA-256 mismatch for ${file}`);
  }
  if (mode !== 'web') {
    const inspection = mode === 'ios-simulator' ? 'verify-ios-simulator' : 'verify-android-product';
    assert(report.steps.some(s => s.name === inspection && s.exitCode === 0), 'Missing product inspection');
    assert.deepEqual(report.product, readJson(path.join(directory, inspection + '.json')));
    assert(report.product.version && report.product.signing && report.product.packageId, 'Missing inspected identity');
    assert(Array.isArray(report.product.abis) && report.product.abis.length > 0, 'Missing inspected architectures');
    if (mode === 'ios-simulator') {
      assert.equal(report.product.archiveSha256, report.artifacts[0].sha256, 'Archive inspected by simulator');
      assert.equal(digest(fs.readFileSync(path.join(directory, 'ios-home.png'))), report.product.simulator.screenshotSha256);
    } else {
      assert.equal(report.product.mode, mode, 'Inspected Android variant');
      if (signedRelease) {
        assert.equal(report.product.signing, 'release-signed', 'Expected the approved Android signing identity');
      }
      for (const { file, bytes, sha256 } of report.artifacts) {
        assert.deepEqual(report.product.files[file], { bytes, sha256 }, `Android inspector identity for ${file}`);
      }
    }
  }
  return { mode, commit, sourceId: report.sourceId, remoteJob: report.remoteJob, artifacts: report.artifacts };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const signedRelease = args.at(-1) === '--signed';
    if (signedRelease) args.pop();
    assert([3, 5].includes(args.length),
      'Usage: node scripts/verify-host-artifacts.cjs <directory> <mode> <expected-commit> [<run-id> <attempt>] [--signed]');
    const [directory, mode, commit, runId, attempt] = args;
    console.log(JSON.stringify(verifyHostArtifacts(directory, mode, commit, runId, attempt, signedRelease), null, 2));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
module.exports = { verifyHostArtifacts };
