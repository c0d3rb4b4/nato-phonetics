import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { fingerprint, parseAuditResult, reviewAudit } = require('../scripts/check-audit.cjs');

function fixture() {
  const report = {
    auditReportVersion: 2,
    vulnerabilities: {
      dependency: {
        name: 'dependency', severity: 'high', isDirect: false, effects: [], range: '<2.0.0', nodes: ['node_modules/dependency'],
        via: [{ name: 'dependency', url: 'https://github.com/advisories/GHSA-test', severity: 'high', range: '<2.0.0', source: 1 }],
      },
    },
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 1, critical: 0, total: 1 } },
  };
  const lock = { packages: { 'node_modules/dependency': { version: '1.0.0' } } };
  const inventory = { schemaVersion: 1, entries: [{
    package: 'dependency', fingerprint: fingerprint(report.vulnerabilities.dependency, lock),
    owner: 'Repository maintainer', applicability: 'Build tool accepts repository assets.',
    remediation: 'Upgrade with the compatible SDK.', evidence: 'docs/SECURITY_REVIEW.md',
    reviewedOn: '2026-11-16', reviewBy: '2026-12-16',
  }] };
  return { report, lock, inventory };
}

const inspect = ({ report, lock, inventory }, today = '2026-11-16') => reviewAudit(report, lock, inventory, today);

test('a matching review passes while the raw audit remains a failure with unresolved vulnerabilities', () => {
  const data = fixture();
  const report = parseAuditResult({ status: 1, stdout: JSON.stringify(data.report) });
  assert.equal(report.metadata.vulnerabilities.high, 1);
  assert.deepEqual(inspect(data).errors, []);
  // npm's numeric source identifier can change without changing the advisory.
  data.report.vulnerabilities.dependency.via[0].source = 999;
  assert.deepEqual(inspect(data).errors, []);
});

test('new findings, changed advisories, ranges, severity and locked versions require re-review', () => {
  const missing = fixture();
  missing.inventory.entries = [];
  assert.match(inspect(missing).errors.join(), /new high finding/);
  for (const change of [
    data => { data.report.vulnerabilities.dependency.via[0].url += '-new'; },
    data => { data.report.vulnerabilities.dependency.via[0].range = '<3.0.0'; },
    data => { data.report.vulnerabilities.dependency.range = '<3.0.0'; },
    data => { data.lock.packages['node_modules/dependency'].version = '1.1.0'; },
    data => { data.report.vulnerabilities.dependency.isDirect = true; },
    data => { data.report.vulnerabilities.dependency.effects = ['new-consumer']; },
    data => {
      data.report.vulnerabilities.dependency.severity = 'critical';
      data.report.metadata.vulnerabilities.high = 0;
      data.report.metadata.vulnerabilities.critical = 1;
    },
  ]) {
    const data = fixture();
    change(data);
    assert.match(inspect(data).errors.join(), /changed; re-review required/);
  }
});

test('review deadlines, future review dates and malformed dispositions cannot authorize findings', () => {
  assert.match(inspect(fixture(), '2026-12-16').errors.join(), /expired/);
  assert.match(inspect(fixture(), '2026-11-15').errors.join(), /future/);
  for (const change of [
    data => { data.inventory.entries[0].owner = ''; },
    data => { data.inventory.entries[0].reviewBy = '2026-02-30'; },
    data => { data.inventory.entries.push(data.inventory.entries[0]); },
    data => { data.inventory.entries[0].reviewBy = '2026-11-16'; },
  ]) {
    const data = fixture();
    change(data);
    assert.throws(() => inspect(data));
  }
});

test('disappearing findings and missing lock entries require investigation', () => {
  const fixed = fixture();
  fixed.report.vulnerabilities = {};
  fixed.report.metadata.vulnerabilities.high = 0;
  fixed.report.metadata.vulnerabilities.total = 0;
  assert.match(inspect(fixed).errors.join(), /stale disposition/);
  const missing = fixture();
  missing.lock.packages = {};
  assert.throws(() => inspect(missing), /missing from lockfile/);
});

test('network failures, unexpected exits, truncated JSON and inconsistent reports fail closed', () => {
  const { report } = fixture();
  for (const result of [
    { status: 1, stdout: '{"error":{"code":"ENOTFOUND"}}' },
    { status: 1, stdout: '{"auditReportVersion":2,' },
    { status: 2, stdout: JSON.stringify(report) },
    { status: null, error: new Error('Timed out'), stdout: '' },
    { status: null, signal: 'SIGTERM', stdout: JSON.stringify(report) },
    { status: 0, stdout: JSON.stringify(report) },
  ]) assert.throws(() => parseAuditResult(result));
  report.metadata.vulnerabilities.high = 0;
  assert.throws(() => parseAuditResult({ status: 1, stdout: JSON.stringify(report) }), /count/);
});

test('malformed advisory chains and incomplete reports cannot bypass review', () => {
  for (const change of [
    data => { data.report.vulnerabilities.dependency.via = ['absent']; },
    data => { data.report.vulnerabilities.dependency.via[0].url = ''; },
    data => { data.report.vulnerabilities.dependency.nodes = []; },
    data => { data.report.metadata = {}; },
  ]) {
    const data = fixture();
    change(data);
    assert.throws(() => inspect(data));
  }
});

test('a high advisory cannot hide behind a lower package severity and matching lower counts', () => {
  const data = fixture();
  data.report.vulnerabilities.dependency.severity = 'low';
  data.report.metadata.vulnerabilities.high = 0;
  data.report.metadata.vulnerabilities.low = 1;
  data.inventory.entries = [];
  assert.throws(() => inspect(data), /understates direct advisory severity/);
});
