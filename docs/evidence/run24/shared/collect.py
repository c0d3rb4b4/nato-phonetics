"""Copy actual reports/captures unchanged into durable Run24 evidence."""
from pathlib import Path
import hashlib, json, shutil

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'docs/evidence/run24'
scopes = ['chromium-tabs', 'firefox-tabs', 'webkit-tabs-serial', 'chromium-process', 'firefox-process', 'webkit-process']
metadata = []
summary = []
runner_hash = hashlib.sha256((ROOT / 'scripts/verify-web-host.cjs').read_bytes()).hexdigest()
for scope in scopes:
    source = ROOT / 'artifacts/run24/readonly' / scope
    report = json.loads((source / 'report.json').read_text())
    assert not report.get('failure'), (scope, report.get('failure'))
    assert report['runnerSha256'] == runner_hash
    assert len(report['checks']) == 6 and all(row['passed'] for row in report['checks'])
    assert report['asyncPollingNegativeCheck']
    target = OUT / 'hosting' / scope
    target.mkdir(parents=True, exist_ok=True)
    for name in ['report.json', 'caddy.log']:
        shutil.copyfile(source / name, target / name)
    captures = json.loads((source / 'screenshots/web/metadata.json').read_text())
    for row in captures:
        name = scope + '-' + row['file']
        shutil.copyfile(source / 'screenshots/web' / row['file'], OUT / 'screenshots/web' / name)
        metadata.append({**row, 'file': 'web/' + name, 'scope': scope, 'report': 'hosting/' + scope + '/report.json'})
    summary.append(dict(scope=scope, checks=len(report['checks']), negativePolling=True, report='hosting/' + scope + '/report.json'))

for scope in ['webkit-tabs']:
    source = ROOT / 'artifacts/run24/readonly' / scope
    target = OUT / 'diagnostics' / ('readonly-' + scope)
    target.mkdir(parents=True, exist_ok=True)
    for name in ['report.json', 'diagnostics/failure.png']:
        dest = target / name
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source / name, dest)

# Retain earlier passing runs without substituting them for final-source runs.
for scope in ['chromium-tabs', 'firefox-tabs', 'webkit-tabs']:
    source = ROOT / 'artifacts/run24/final' / scope
    target = OUT / 'diagnostics/pre-noncreating' / scope
    target.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(source / 'report.json', target / 'report.json')

(OUT / 'screenshots/web-metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
(OUT / 'hosting/summary.json').write_text(json.dumps(summary, indent=2) + '\n')
print('Copied', len(metadata), 'actual final web captures; preserved separate failed reports')
