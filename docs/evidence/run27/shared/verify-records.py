"""Final preservation, actual evidence, status and changed-link reconciliation."""
from pathlib import Path
import ast
import hashlib
import json
import re
import subprocess
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'docs/evidence/run27'
sha = lambda data: hashlib.sha256(data).hexdigest()
baseline = json.loads((OUT / 'shared/baseline.json').read_text())
allowed = {
    'README.md', 'docs/ANDROID_FONT_SCALE_P1_REPORT.md', 'docs/ANDROID_TEXT_MEASUREMENT.md',
    'docs/APP_REVIEW.md', 'docs/DELIVERY_PLAN.md', 'docs/NATIVE_BUILDS.md', 'docs/RELEASE_RUNBOOK.md',
    'scripts/build-android-font-native.py', 'scripts/run-android-font-instrumentation.py',
    'tests/fixtures/android-font-scale/FontScaleInstrumentation.java', 'tests/fixtures/android-font-scale/README.md',
}
changed, missing = [], []
for name, digest in baseline['files'].items():
    file = ROOT / name
    if not file.exists():
        missing.append(name)
    elif sha(file.read_bytes()) != digest:
        changed.append(name)
assert not missing and set(changed) <= allowed, (missing, set(changed) - allowed)
prior_evidence = [name for name in baseline['files'] if name.startswith('docs/evidence/')]
assert not any(name.startswith('docs/evidence/') for name in changed)
for name in [*allowed, *map(lambda p: str(p.relative_to(ROOT)), OUT.rglob('*.py'))]:
    if name.endswith('.py'):
        ast.parse((ROOT / name).read_text(), filename=name)

commands = ['android/layout-gate', 'android/raster-gate', 'android/finish-feedback',
            'android/source-release-arm64', 'android/identify-release', 'android/instrumentation-build',
            'android/native-release-mode-compile', 'android/native-release-run',
            'android/release-composition-command', 'android/native-debug-mode-compile',
            'shared/android-guard-tests']
assert all(json.loads((OUT / (name + '.json')).read_text())['exitCode'] == 0 for name in commands)
assert json.loads((OUT / 'android/native-release-compile.json').read_text())['exitCode'] != 0
assert json.loads((OUT / 'android/native-mode-negative.json').read_text())['passed'] is True
layout = json.loads((OUT / 'android/native-layout-checks.json').read_text())
assert len(layout) == 18 and all(row['passed'] and row['baselineStatus'] == 'measured-pass' for row in layout)
assert sum(row['measuredBaselines'] for row in layout) == 625
assert sum(row['missingBaselineCount'] for row in layout) == 0
raster = json.loads((OUT / 'android/extended-raster-measurements.json').read_text())
assert len(raster) == 271 and all(abs(d) <= 2 for row in raster for d in row['deltaPixels'].values())
assert json.loads((OUT / 'android/release-artifacts.json').read_text())['passed'] is True
composition = json.loads((OUT / 'android/release-composition/report.json').read_text())
assert composition['passed'] and len(composition['stages']) == 5
assert json.loads((OUT / 'android/release-composition/identity.json').read_text())['evidenceComplete']
assert json.loads((OUT / 'android/restoration.json').read_text())['ownedToolingShutdown'] != 'pending'
assert json.loads((OUT / 'screenshots/inspection.json').read_text())['totalFinalActualOriginals'] == 25
captures = list((OUT / 'screenshots/android').rglob('*.png'))
assert len(captures) == 25
for meta in (OUT / 'screenshots/android').rglob('metadata.json'):
    for row in json.loads(meta.read_text()):
        assert sha((meta.parent / row['file']).read_bytes()) == row['sha256']

plan = (ROOT / 'docs/DELIVERY_PLAN.md').read_text()
ledger = plan.split('## Complete scope and resolution ledger', 1)[1].split('## Execution contract', 1)[0]
rows = [line.split('|') for line in ledger.splitlines() if re.match(r'\| [RF]\d\d \|', line)]
assert len(rows) == 35
statuses = {}
for row in rows:
    status = row[4].strip()
    statuses[status] = statuses.get(status, 0) + 1
assert statuses == {'resolved': 6, 'implemented-awaiting-M11': 12, 'in-progress': 17}, statuses
manual = plan.split('## M11', 1)[1].split('## Complete scope', 1)[0]
assert len(re.findall(r'^- \[ \] \*\*M11\.', manual, re.MULTILINE)) == 7
assert not re.search(r'^- \[x\] \*\*M11\.', manual, re.MULTILINE)
assert '- [ ] **P05.2**' in plan and '- [ ] **P05.8' in plan

# Check new local Markdown destinations. Existing unrelated historical link
# failures are reported separately and never silently repaired or called green.
current_head = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip()
files = [ROOT / name for name in allowed if name.endswith('.md')] + list(OUT.rglob('*.md'))
new_broken, historical_broken = [], []
links_checked = 0
pattern = re.compile(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)')
for file in files:
    relative = str(file.relative_to(ROOT))
    previous = subprocess.run(['git', 'show', f'{current_head}:{relative}'], cwd=ROOT, capture_output=True, text=True)
    old_links = set(pattern.findall(previous.stdout)) if previous.returncode == 0 else set()
    for link in pattern.findall(file.read_text()):
        link = unquote(link.strip('<>'))
        if re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:', link) or link.startswith('#'):
            continue
        destination = link.split('#', 1)[0].split('?', 1)[0]
        if not destination:
            continue
        links_checked += 1
        target = file.parent / destination
        if target.resolve() == (OUT / 'verification.json').resolve():
            continue  # This invocation writes it after completing assertions.
        if not target.exists():
            item = {'file': relative, 'link': link}
            (historical_broken if link in old_links else new_broken).append(item)
assert not new_broken, new_broken
diff_check = subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True, text=True)
assert diff_check.returncode == 0, diff_check.stdout + diff_check.stderr
files_now = subprocess.check_output(['git', 'ls-files', '-co', '--exclude-standard', '-z'], cwd=ROOT).decode().split('\0')
identities = {name: sha((ROOT / name).read_bytes()) for name in sorted(set(files_now))
              if name and (ROOT / name).is_file() and name != 'docs/evidence/run27/verification.json'}
report = {'passed': True, 'initialHead': baseline['base'], 'finalObservedHead': current_head,
          'agentCommitStagingResetOrPublication': False, 'initialFilesChecked': len(baseline['files']),
          'authorizedPriorFilesChanged': sorted(changed), 'initialFilesMissing': missing,
          'priorEvidenceFilesUnchanged': len(prior_evidence),
          'productNativeRepairFontsDependenciesAndWorkersUnchanged': True,
          'successfulRecordedCommands': commands, 'retainedFailedCommands': ['initial converter capture', 'offscreen Next collection', 'Debug-mode harness against Release'],
          'layoutGroups': 18, 'baselines': 625, 'rasterObservations': 271,
          'inspectedFinalActualCaptures': len(captures), 'itemStatuses': statuses, 'humanChecksUnperformed': 7,
          'localLinksChecked': links_checked, 'newBrokenLinks': new_broken, 'preexistingBrokenLinks': historical_broken,
          'diffCheckExitCode': diff_check.returncode, 'files': identities}
(OUT / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({key: value for key, value in report.items() if key != 'files'}))
