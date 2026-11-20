#!/usr/bin/env python3
"""Validate this documentation amendment without rewriting historical evidence."""
import datetime
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote

sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
DOCUMENTS = ['README.md', 'docs/APP_REVIEW.md', 'docs/DELIVERY_PLAN.md',
             'docs/EXECUTION_PROMPT.md', 'docs/TILE_DESIGN.md', 'docs/DELIVERY_PRIORITY_REVIEW.md']
MODIFIED = set(DOCUMENTS[:-1])
errors = []
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
frozen = json.loads((ROOT / 'docs/evidence/run07/source-identity.json').read_text())
initial = json.loads((HERE / 'initial-state.json').read_text())
changed = []
removed = []
for item in frozen['files']:
    p = ROOT / item['file']
    if not p.is_file():
        removed.append(item['file'])
    elif sha(p) != item['sha256'] or oct(p.lstat().st_mode & 0o777) != item['mode']:
        changed.append(item['file'])
if set(changed) != MODIFIED or removed:
    errors.append(f'Unexpected maintained-source changes/removals: {changed}, {removed}')
if initial['run07MismatchesAtStart']:
    errors.append('The review did not start at the recorded Run07 baseline.')
for name, digest in initial['documentsBefore'].items():
    old = next(item['sha256'] for item in frozen['files'] if item['file'] == name)
    if digest != old:
        errors.append(f'Initial document hash differs from Run07: {name}')

links = []
def anchors(text):
    found = set()
    for heading in re.findall(r'^#{1,6}\s+(.+?)\s*#*$', text, re.M):
        heading = re.sub(r'\[([^]]+)\]\([^)]*\)', r'\1', heading).strip().lower()
        found.add(re.sub(r'[^\w\- ]', '', heading).replace(' ', '-'))
    return found
for name in DOCUMENTS:
    document = ROOT / name
    text = document.read_text()
    # Fenced examples are literal text, including the copied prompt's links
    # resolved from the parent apps workspace rather than this Markdown file.
    prose = re.sub(r'```.*?```', '', text, flags=re.S)
    for match in re.finditer(r'(?<!!)\[[^]\n]+\]\(([^)\n]+)\)', prose):
        destination = match[1].strip('<>')
        if re.match(r'[a-zA-Z][a-zA-Z0-9+.-]*:', destination):
            continue
        path, _, fragment = destination.partition('#')
        target = (document.parent / unquote(path)).resolve() if path else document
        # This report is generated after the checks, and is linked before generation.
        pending_output = target == HERE / 'verification.json'
        valid = target.exists() or pending_output
        if valid and fragment and target.suffix == '.md':
            valid = unquote(fragment) in anchors(target.read_text())
        links.append({'document': name, 'destination': destination, 'valid': valid})
        if not valid:
            errors.append(f'Invalid local link or heading: {name} -> {destination}')

spec = importlib.util.spec_from_file_location('historical_run07_audit', ROOT / 'docs/evidence/run07/verify-evidence.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)
image_warnings = []
images = audit.screenshots(errors, image_warnings)
findings = []
artifacts = audit.artifacts(errors, findings)
state = audit.status(errors, image_warnings, images)
old_state = json.loads((ROOT / 'docs/evidence/run07/document-verification.json').read_text())
for field in ('ledger', 'ledgerCounts', 'phases', 'tasks', 'captureTotals'):
    if state[field] != old_state[field]:
        errors.append(f'Status/evidence changed during documentation review: {field}')
if audit.previous.digest(ROOT / 'docs/evidence/run07/verify-evidence.py') != old_state['auditScriptSha256']:
    errors.append('Historical evidence auditor changed.')
files, deleted = audit.previous.source_inventory()
added = sorted({item['file'] for item in files} - {item['file'] for item in frozen['files']})
if added != ['docs/DELIVERY_PRIORITY_REVIEW.md']:
    errors.append(f'Unexpected new maintained files: {added}')
if deleted != frozen['deletedTrackedPaths']:
    errors.append('Inherited tracked deletions changed.')
prompt_text = (ROOT / 'docs/EXECUTION_PROMPT.md').read_text()
prompt = re.search(r'```text\n(.*?)\n```', prompt_text, re.S)[1]
for destination in re.findall(r'\[[^]]+\]\(([^)]+)\)', prompt):
    valid = (ROOT.parent / destination).exists()
    links.append({'document': 'docs/EXECUTION_PROMPT.md (copied prompt)',
                  'destination': destination, 'base': 'parent apps workspace', 'valid': valid})
    if not valid:
        errors.append(f'Copied prompt workspace link missing: {destination}')
count = int(re.search(r'prompt is \*\*(\d+) ASCII', prompt_text)[1])
if len(prompt) != count or count >= 1000 or not prompt.isascii():
    errors.append('Reusable prompt length/ASCII claim is incorrect.')
diff = subprocess.run(['git', 'diff', '--check'], cwd=ROOT, capture_output=True, text=True)
if diff.returncode:
    errors.append('git diff --check failed: ' + diff.stdout + diff.stderr)
reviewed = [
    'docs/evidence/run03/screenshots/ios/alphabet-light.png',
    'docs/evidence/run07/screenshots/android/final-quiz-controls-dark-scale2.png',
    'docs/evidence/run07/screenshots/ios/final-release-phone-maximum-focused-alphabet-J-dark.png',
]
report = {
    'date': '2026-11-17', 'checkedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(),
    'scope': 'Documentation priority review; historical candidate artifact/image checks only; no new app acceptance',
    'passed': not errors, 'errors': errors,
    'baseCommit': frozen['baseCommit'], 'initialMaintainedFilesMatched': initial['run07ComparedFiles'],
    'maintainedSourceFilesAfter': len(files), 'modifiedMaintainedDocuments': changed,
    'addedMaintainedDocuments': added, 'removedMaintainedFiles': removed,
    'unchangedPriorMaintainedFiles': len(frozen['files']) - len(changed),
    'inheritedTrackedDeletionsUnchanged': deleted == frozen['deletedTrackedPaths'],
    'documents': [{'file': name, 'sha256': sha(ROOT / name)} for name in DOCUMENTS],
    'localLinksChecked': len(links), 'localLinks': links,
    'ledgerCounts': state['ledgerCounts'], 'tasksAndPhasesUnchanged': state['tasks'] == old_state['tasks'] and state['phases'] == old_state['phases'],
    'historicalCaptureTotals': state['captureTotals'],
    'historicalArtifactHashChecks': len(artifacts), 'historicalArtifactFindings': findings,
    'historicalSourceIdentityDisposition': 'Run07 identity remains frozen; five documentation amendments intentionally supersede it. All other prior maintained files match.',
    'historicalEvidenceDisposition': 'Prior evidence files not edited. Run07 screenshot/artifact identities rechecked read-only; no historical reports refrozen.',
    'originalScreenshotsReopened': [{'file': name, 'sha256': sha(ROOT / name)} for name in reviewed],
    'newAppScreenshots': {'status': 'not-applicable', 'reason': 'Documentation-only assessment; no changed application flow.'},
    'newApplicationTestsBuilds': {'status': 'not-run-not-applicable', 'reason': 'No application/native/dependency change; prior results retain their original scope.'},
    'promptAsciiCharacters': count, 'diffCheckPassed': diff.returncode == 0,
    'reviewAuditorSha256': sha(Path(__file__)),
}
(HERE / 'verification.json').write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({k: report[k] for k in ('passed', 'errors', 'modifiedMaintainedDocuments', 'addedMaintainedDocuments',
    'unchangedPriorMaintainedFiles', 'localLinksChecked', 'ledgerCounts', 'historicalCaptureTotals',
    'historicalArtifactHashChecks', 'promptAsciiCharacters', 'diffCheckPassed')}, indent=2))
sys.exit(0 if not errors else 1)
