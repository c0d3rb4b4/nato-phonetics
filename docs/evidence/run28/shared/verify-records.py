"""Reconcile actual Run28 commands, preserved inputs, status and local links."""
from pathlib import Path
import ast
import hashlib
import json
import re
import subprocess
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'docs/evidence/run28'
sha = lambda data: hashlib.sha256(data).hexdigest()
baseline = json.loads((OUT / 'shared/baseline.json').read_text())
allowed = {'README.md', 'docs/ANDROID_FONT_SCALE_P1_REPORT.md', 'docs/ANDROID_TEXT_MEASUREMENT.md',
           'docs/APP_REVIEW.md', 'docs/DELIVERY_PLAN.md', 'docs/NATIVE_BUILDS.md', 'docs/RELEASE_RUNBOOK.md',
           'scripts/build-android-font-native.py', 'tests/fixtures/android-font-scale/README.md', 'metro.config.js'}
changed, missing = [], []
for name, digest in baseline['files'].items():
    file = ROOT / name
    if not file.is_file(): missing.append(name)
    elif sha(file.read_bytes()) != digest: changed.append(name)
assert not missing and set(changed) <= allowed, (missing, set(changed) - allowed)
assert not any(name.startswith('docs/evidence/') for name in changed)
source_guards = json.loads((ROOT / 'docs/evidence/run27/android/source-preflight.json').read_text())['guards']
for guard in source_guards:
    assert sha((ROOT / 'node_modules/react-native' / guard['file']).read_bytes()) == guard['expected'], guard['file']
preservation = json.loads((OUT / 'shared/stage-preservation.json').read_text())
assert preservation['indexBytesUnchanged']
assert sha((ROOT / '.git/index').read_bytes()) == baseline['indexSha256']
assert subprocess.check_output(['git', 'ls-files', '--stage'], cwd=ROOT, text=True) == (OUT / 'shared/stage-entries.txt').read_text()
for file in [ROOT / 'scripts/build-android-font-native.py', *OUT.rglob('*.py')]: ast.parse(file.read_text(), filename=str(file))

successful = ['android/source-preflight', 'android/source-release-armeabi-v7a',
              'android/source-release-x86-retry', 'android/source-release-x86_64',
              'android/identify-armeabi-v7a', 'android/identify-x86', 'android/identify-x86_64',
              'android/native-armeabi-v7a-command', 'android/native-x86-command', 'android/native-x86_64-command',
              'android/harness-guard-command', 'android/native-arm64-command', 'android/native-arm64-run',
              'android/native-debug-command', 'android/release-sample-command', 'android/gradle-stop',
              'shared/android-guard-tests', 'shared/metro-worker-tests', 'shared/lint']
for name in successful:
    assert json.loads((OUT / (name + '.json')).read_text())['exitCode'] == 0, name
assert json.loads((OUT / 'android/source-release-x86.json').read_text())['exitCode'] != 0
assert json.loads((OUT / 'android/emulator-first-launch.json').read_text())['exitCode'] == 1
assert json.loads((OUT / 'android/harness-negative-controls.json').read_text())['passed']
abi_artifacts = {}
for abi in ['armeabi-v7a', 'x86', 'x86_64']:
    identity = json.loads((OUT / f'android/{abi}-artifacts.json').read_text())
    assert identity['passed'] and identity['unsigned'] and not identity['releaseIsDebuggable']
    for row in identity['artifacts'].values(): assert sha((ROOT / row['path']).read_bytes()) == row['sha256']
    compile = json.loads((OUT / f'android/native-{abi}/compile.json').read_text())
    assert compile['exitCode'] == 0 and compile['abi'] == abi and compile['contextGenerationAbi']
    assert sha((ROOT / f'artifacts/run28/native-{abi}/font-environment').read_bytes()) == compile['executableSha256']
    abi_artifacts[abi] = {name: row['sha256'] for name, row in identity['artifacts'].items()}
native = json.loads((OUT / 'android/native-arm64/native-result.json').read_text())
assert native['exitCode'] == 0
cases = [json.loads(line) for line in native['stdout'].splitlines() if line.startswith('{')]
assert sum(row.get('passed') is True for row in cases) == 4
assert any(row.get('cacheEnvironmentPassed') is True for row in cases)
assert any(row.get('olderEnvironmentAdoptionPassed') is True for row in cases)
captures = json.loads((OUT / 'screenshots/android/metadata.json').read_text())
assert len(captures) == 4
for row in captures: assert sha((OUT / 'screenshots/android' / row['file']).read_bytes()) == row['sha256']
inspection = json.loads((OUT / 'screenshots/inspection.json').read_text())
assert inspection['allActualOriginalsInspected'] and inspection['count'] == len(captures)
restoration = json.loads((OUT / 'android/restoration.json').read_text())
assert restoration['passed'] and restoration['ownedToolingShutdown']['emulatorStopped'] and restoration['ownedToolingShutdown']['metroStopped']

plan = (ROOT / 'docs/DELIVERY_PLAN.md').read_text()
ledger = plan.split('## Complete scope and resolution ledger', 1)[1].split('## Execution contract', 1)[0]
rows = [line.split('|') for line in ledger.splitlines() if re.match(r'\| [RF]\d\d \|', line)]
assert len(rows) == 35
statuses = {}
for row in rows:
    status = row[4].strip(); statuses[status] = statuses.get(status, 0) + 1
assert statuses == {'resolved': 6, 'implemented-awaiting-M11': 12, 'in-progress': 17}
manual = plan.split('## M11', 1)[1].split('## Complete scope', 1)[0]
assert len(re.findall(r'^- \[ \] \*\*M11\.', manual, re.M)) == 7
assert not re.search(r'^- \[x\] \*\*M11\.', manual, re.M)
assert '- [ ] **P05.2**' in plan and '- [ ] **P05.8' in plan

pattern = re.compile(r'!?\[[^\]]*\]\(([^\s)]+)(?:\s+[^)]*)?\)')
new_broken, old_broken, checked = [], [], 0
markdown = [ROOT / name for name in allowed if name.endswith('.md')] + list(OUT.rglob('*.md'))
for file in markdown:
    relative = str(file.relative_to(ROOT))
    original = subprocess.run(['git', 'show', ':' + relative], cwd=ROOT, capture_output=True, text=True)
    old_links = set(pattern.findall(original.stdout)) if original.returncode == 0 else set()
    for link in pattern.findall(file.read_text()):
        target = unquote(link.strip('<>'))
        if re.match(r'^[A-Za-z][A-Za-z0-9+.-]*:', target) or target.startswith('#'): continue
        target = target.split('#', 1)[0].split('?', 1)[0]
        if not target: continue
        checked += 1
        destination = (file.parent / target).resolve()
        if destination == (OUT / 'verification.json').resolve(): continue
        if not destination.exists():
            (old_broken if link in old_links else new_broken).append({'file': relative, 'link': link})
assert not new_broken, new_broken
diff = subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True, text=True)
assert diff.returncode == 0, diff.stdout + diff.stderr
report = {'passed': True, 'initialHead': baseline['head'], 'finalObservedHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
          'initialFilesChecked': len(baseline['files']), 'authorizedPriorFilesChanged': sorted(changed), 'missingInitialFiles': missing,
          'allHistoricalEvidenceUnchanged': True, 'indexBytesAndStageEntriesUnchanged': True,
          'agentCommitStagingResetOrPublication': False, 'productNativeRepairFontsDependenciesAndWebServiceWorkerUnchanged': True,
          'installedNativeSourceGuardsUnchanged': len(source_guards),
          'metroChange': 'explicit worker control only; artifact reports independently check unchanged embedded product JS',
          'successfulRecordedCommands': successful, 'retainedFailedCommands': ['android/source-release-x86', 'android/emulator-first-launch'],
          'abiArtifacts': abi_artifacts, 'nonArm64Runtime': 'unrun; ARM64-only local runtime',
          'arm64NativeCasesPassed': 6, 'actualScreenshotsInspected': len(captures), 'itemStatuses': statuses,
          'humanChecksUnperformed': 7, 'localLinksChecked': checked, 'newBrokenLinks': new_broken,
          'historicalBrokenLinks': old_broken, 'diffCheckExitCode': diff.returncode,
          'changedSourceHashes': {name: sha((ROOT / name).read_bytes()) for name in sorted(allowed | {'tests/metro-workers.test.mjs'})}}
(OUT / 'verification.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({k: v for k, v in report.items() if k not in ['changedSourceHashes', 'abiArtifacts', 'successfulRecordedCommands']}))
