const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SEVERITIES = ['info', 'low', 'moderate', 'high', 'critical'];
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isText = value => typeof value === 'string' && value.trim().length > 0;
const sortByJson = values => values.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));

function requireValid(condition, message) {
  if (!condition) throw new Error(message);
}

function dateOnly(value) {
  requireValid(typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value), 'Invalid review date');
  const date = new Date(`${value}T00:00:00.000Z`);
  requireValid(!Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value, 'Invalid review date');
  return value;
}

function validateReport(report) {
  requireValid(isObject(report) && !report.error && report.auditReportVersion === 2,
    'npm audit did not return a successful version 2 vulnerability report');
  requireValid(isObject(report.vulnerabilities) && isObject(report.metadata?.vulnerabilities),
    'npm audit report is missing vulnerabilities or counts');
  const counts = Object.fromEntries(SEVERITIES.map(severity => [severity, 0]));
  for (const [name, entry] of Object.entries(report.vulnerabilities)) {
    requireValid(isObject(entry) && entry.name === name && SEVERITIES.includes(entry.severity)
      && typeof entry.isDirect === 'boolean' && Array.isArray(entry.effects) && entry.effects.every(isText)
      && isText(entry.range) && Array.isArray(entry.nodes) && entry.nodes.length > 0
      && entry.nodes.every(isText) && Array.isArray(entry.via) && entry.via.length > 0,
    `Malformed npm audit entry: ${name}`);
    counts[entry.severity]++;
    for (const cause of entry.via) {
      if (typeof cause === 'string') {
        requireValid(Object.hasOwn(report.vulnerabilities, cause), `Missing audit cause ${cause} for ${name}`);
      } else {
        requireValid(isObject(cause) && isText(cause.name) && isText(cause.url)
          && cause.url.startsWith('https://') && isText(cause.range) && SEVERITIES.includes(cause.severity),
        `Malformed advisory for ${name}`);
        requireValid(SEVERITIES.indexOf(entry.severity) >= SEVERITIES.indexOf(cause.severity),
          `npm audit understates direct advisory severity for ${name}`);
      }
    }
  }
  for (const severity of SEVERITIES) {
    requireValid(report.metadata.vulnerabilities[severity] === counts[severity],
      `npm audit ${severity} count does not match its entries`);
  }
  requireValid(report.metadata.vulnerabilities.total === Object.keys(report.vulnerabilities).length,
    'npm audit total count does not match its entries');
  return report;
}

function parseAuditResult(result) {
  requireValid(!result.error && !result.signal && (result.status === 0 || result.status === 1),
    `npm audit failed to execute (exit ${result.status}, ${result.error?.message || result.signal || 'unexpected status'})`);
  let report;
  try {
    report = JSON.parse(result.stdout);
  } catch {
    throw new Error('npm audit returned invalid JSON; check registry/network access');
  }
  validateReport(report);
  // npm audit is explicitly run with --audit-level=low, so a nonzero result
  // must be explained by findings rather than silently treated as an outage.
  const expectedStatus = report.metadata.vulnerabilities.total - report.metadata.vulnerabilities.info > 0 ? 1 : 0;
  requireValid(result.status === expectedStatus, 'npm audit exit status disagrees with the vulnerability report');
  return report;
}

function fingerprint(entry, lock) {
  requireValid(isObject(lock?.packages), 'package-lock.json must contain locked package entries');
  return {
    severity: entry.severity,
    isDirect: entry.isDirect,
    range: entry.range,
    effects: [...entry.effects].sort(),
    installed: sortByJson(entry.nodes.map(location => {
      const version = lock.packages[location]?.version;
      requireValid(isText(version), `Audit package missing from lockfile: ${location}`);
      return { path: location, version };
    })),
    via: sortByJson(entry.via.map(cause => typeof cause === 'string' ? { dependency: cause } : {
      name: cause.name,
      url: cause.url,
      severity: cause.severity,
      range: cause.range,
    })),
  };
}

function reviewAudit(report, lock, inventory, today = new Date().toISOString().slice(0, 10)) {
  validateReport(report);
  dateOnly(today);
  requireValid(inventory?.schemaVersion === 1 && Array.isArray(inventory.entries), 'Invalid security review inventory');
  const errors = [];
  const reviewed = new Map();
  for (const entry of inventory.entries) {
    requireValid(isText(entry.package) && !reviewed.has(entry.package), 'Missing or duplicate inventory package');
    requireValid(['high', 'critical'].includes(entry.fingerprint?.severity)
      && ['owner', 'applicability', 'remediation', 'evidence'].every(field => isText(entry[field])),
    `Incomplete disposition for ${entry.package}`);
    const reviewedOn = dateOnly(entry.reviewedOn);
    const reviewBy = dateOnly(entry.reviewBy);
    requireValid(reviewedOn < reviewBy, `Review deadline must follow the review date for ${entry.package}`);
    if (reviewedOn > today) errors.push(`${entry.package}: review date is in the future`);
    if (reviewBy <= today) errors.push(`${entry.package}: security review expired on ${reviewBy}`);
    reviewed.set(entry.package, entry);
  }
  const findings = Object.values(report.vulnerabilities).filter(entry => ['high', 'critical'].includes(entry.severity));
  for (const finding of findings) {
    const disposition = reviewed.get(finding.name);
    if (!disposition) {
      errors.push(`${finding.name}: new ${finding.severity} finding; investigate and document before changing the inventory`);
      continue;
    }
    if (JSON.stringify(fingerprint(finding, lock)) !== JSON.stringify(disposition.fingerprint)) {
      errors.push(`${finding.name}: advisory, severity, affected range, dependency path or locked version changed; re-review required`);
    }
    reviewed.delete(finding.name);
  }
  for (const name of reviewed.keys()) errors.push(`${name}: reviewed finding is absent; verify remediation and remove the stale disposition`);
  return { errors, findings, counts: report.metadata.vulnerabilities };
}

function main() {
  const root = path.resolve(__dirname, '..');
  const result = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['audit', '--json', '--audit-level=low'], { cwd: root, encoding: 'utf8', timeout: 60000, maxBuffer: 16 * 1024 * 1024 });
  console.log(`Raw npm audit exit status: ${result.status ?? 'not completed'}`);
  if (result.stderr) process.stderr.write(result.stderr);
  try {
    const report = parseAuditResult(result);
    const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
    const inventory = JSON.parse(fs.readFileSync(path.join(root, 'docs/security-audit-inventory.json'), 'utf8'));
    const review = reviewAudit(report, lock, inventory);
    console.log(`npm audit findings (still unresolved): ${JSON.stringify(review.counts)}`);
    for (const finding of review.findings) console.log(`  ${finding.severity}: ${finding.name}`);
    if (review.errors.length) throw new Error(review.errors.join('\n'));
    console.log(`Security review gate passed: ${review.findings.length} high/critical entries match current, unexpired dispositions.`);
    console.log('This gate does not mean npm audit passed or that release risk was accepted. See docs/SECURITY_REVIEW.md.');
  } catch (error) {
    console.error(`Security review gate failed: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = { fingerprint, parseAuditResult, reviewAudit };
if (require.main === module) main();
