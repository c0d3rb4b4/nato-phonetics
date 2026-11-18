"""Verify the actual Run20 candidate, preservation, links, ledger and captures."""
import collections,datetime,hashlib,json,re,subprocess
from pathlib import Path
ROOT=Path(__file__).resolve().parents[4]
OUT=ROOT/'docs/evidence/run20'
def sha(file):return hashlib.sha256(file.read_bytes()).hexdigest()
def read(file):return json.loads(file.read_text())
baseline=read(OUT/'shared/baseline.json')
allowed={'.github/workflows/ci.yml','README.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/LOCAL_PROGRESS.md','docs/NATIVE_BUILDS.md','docs/RELEASE_RUNBOOK.md','docs/SECURITY_REVIEW.md','docs/WEB_OFFLINE.md','package.json'}
changes={name:{'before':old,'after':sha(ROOT/name) if (ROOT/name).is_file() else None} for name,old in baseline['files'].items() if not (ROOT/name).is_file() or sha(ROOT/name)!=old}
unapproved=sorted(set(changes)-allowed)
assert not unapproved,unapproved
assert not any(name.startswith('docs/evidence/') for name in changes)
prior=read(ROOT/'docs/evidence/run19/source-identity.json')
new={'deploy/Caddyfile','scripts/package-web.cjs','scripts/verify-web-host.cjs','tests/web-package.test.mjs','docs/ANDROID_TEXT_MEASUREMENT.md','docs/WEB_DISTRIBUTION.md'}
maintained=set(prior['files'])|new
source={name:sha(ROOT/name) for name in sorted(maintained)}
assert all(source[name]==old for name,old in prior['files'].items() if name.startswith(('app/','src/','android/','ios/','web/','assets/')) or name=='package-lock.json')
web=read(ROOT/'dist/offline-manifest.json');previous=read(ROOT/'docs/evidence/run19/shared/web-identity.json')
resources={row['url']:sha(ROOT/'dist'/row['url'].lstrip('/')) for row in web['resources']}
worker=sha(ROOT/'dist/service-worker.js')
assert web==previous['manifest'] and resources==previous['actualResourceHashes'] and worker==previous['workerSha256']
(OUT/'shared/web-identity.json').write_text(json.dumps({'manifestExactlyMatchesRun19':True,'manifest':web,'actualResourceHashes':resources,'workerSha256':worker},indent=2)+'\n')
host=read(OUT/'hosting/report.json')
assert len(host['checks'])==4 and all(check['passed'] for check in host['checks']) and not host['errors'] and not host.get('failure')
assert sha(OUT/'hosting/nato-web.tar.gz')==host['candidate']['archiveSha256']
assert sha(ROOT/'artifacts/run20/nato-web-reproduced.tar.gz')==host['candidate']['archiveSha256']
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();review=(ROOT/'docs/APP_REVIEW.md').read_text()
ledger=[line.split('|') for line in plan.splitlines() if re.match(r'^\| (R\d\d|F\d\d) \|',line)]
counts=dict(collections.Counter(row[4].strip() for row in ledger))
assert len(ledger)==35 and counts=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18},counts
assert '## Run20 — 18 November 2026' in plan and 'Run20' in review.split('## Current delivery status')[1]
assert all(f'- [ ] **M11.{number}' in plan for number in range(1,8))
captures=[]
for platform in ['web','android']:
 for row in read(OUT/f'screenshots/{platform}/metadata.json'):
  file=OUT/f'screenshots/{platform}'/row['file'];assert file.is_file()
  assert sha(file)==row['sha256']
  data=file.read_bytes();assert data[:8]==b'\x89PNG\r\n\x1a\n'
  captures.append({'file':str(file.relative_to(OUT)),'sha256':sha(file),'width':int.from_bytes(data[16:20],'big'),'height':int.from_bytes(data[20:24],'big'),'inspected':True,'diagnostic':row.get('diagnostic',False)})
assert len(captures)==10
docs=[ROOT/name for name in changes if name.endswith('.md')]+[ROOT/name for name in new if name.endswith('.md')]+list(OUT.rglob('*.md'))
broken=[];links=0
for doc in docs:
 for target in re.findall(r'\]\(([^)]+)\)',doc.read_text()):
  if re.match(r'^(?:https?:|mailto:|#)',target):continue
  file=target.split('#')[0].split(' "')[0].strip('<>')
  if not file:continue
  links+=1
  targetFile=(doc.parent/file).resolve()
  # This command emits these reports after completing its assertions. Check
  # their actual existence below, without a provisional 'passed' report.
  if targetFile in {OUT/'verification.json',OUT/'source-identity.json'}:continue
  if not targetFile.exists():broken.append({'source':str(doc.relative_to(ROOT)),'target':target})
assert not broken,broken
commands=read(OUT/'shared/commands.json');bylog={row['log']:row for row in commands}
for name in ['shared/web-package-reviewed-tests.log','shared/lint-reviewed.log','shared/types.log','shared/dependencies.log','shared/build.log','shared/workflow.log','shared/host-reviewed.log','shared/package-reproduce.log','shared/diff-check.log']:
 assert bylog[name]['exitCode']==0,name
assert bylog['shared/audit-review.log']['exitCode']==1
assert bylog['android/live-cold-gate.log']['exitCode']==1
boundary=read(OUT/'android/boundary-report.json');assert sum(not row['passed'] for row in boundary['liveColdComparison'])==3
identity={'clientDate':'2026-11-18','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':baseline['baseRevision'],'candidate':'Intentional inherited dirty source + Run20 diagnostic/distribution work; not a clean commit or release approval','algorithm':'sha256','files':source,'productShellBuildId':web['buildId'],'webArchiveSha256':host['candidate']['archiveSha256'],'diagnosticInputs':{str(file.relative_to(ROOT)):sha(file) for file in (OUT/'android').iterdir() if file.suffix in ['.js','.py','.cjs']},'priorNativeEvidence':'Run18 scoped native builds/captures unchanged; Run20 reuses unchanged Android APK for diagnostics/restored capture only'}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
verification={'clientDate':'2026-11-18','at':identity['at'],'resumeMatched':read(OUT/'shared/resume-comparison.json'),'baselineFiles':len(baseline['files']),'changedSinceResume':changes,'unapprovedBaselineChanges':unapproved,'priorEvidencePreserved':True,'maintainedFiles':len(source),'productNativeAndLockUnchanged':True,'webShellExactlyMatchesRun19':True,'durableArchiveMatchesReproduction':True,'ledgerCounts':counts,'manualChecksAllUnperformed':True,'localFileLinksChecked':links,'brokenLocalLinks':broken,'screenshots':captures,'captureInapplicability':'No iOS/product/native UI delta or new iOS build; current web5 + Android diagnostic4/restored1 inspected; full P10.7 final integrated matrix remains unfinished','passedScope':'6 new packaging tests;4 grouped actual local Caddy/Edge host checks;types/lint/Expo-free/build/workflow/diff/source/link checks','retainedFailedGates':{'AndroidLiveCold':'3 failures / 1 pass; no repair','security':'Review/raw exit1;28high/3low','initialHostCommand':'MODULE_NOT_FOUND; separate corrected pass','earlierRuns':'All original evidence unchanged, including native/driver/OCR/staged-whitespace failures'},'unrun':'Public HTTPS/cert/host;Linux/hosted CI;full native/runtime/AT/provider/recognition/signing/integrated/M11','reused':'Qualified unchanged133 shared tests/177 compiled Yoga/native scopes;not freshly run','implementationReview':'shared/implementation-review.md','cleanup':read(OUT/'shared/cleanup.json')}
(OUT/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
assert (OUT/'verification.json').is_file() and (OUT/'source-identity.json').is_file()
print(json.dumps({'maintainedFiles':len(source),'baselineFiles':len(baseline['files']),'allowedChangedFiles':len(changes),'priorEvidencePreserved':True,'ledger':counts,'links':links,'captures':len(captures),'archive':host['candidate']['archiveSha256'],'retainedFailures':['Android live sizing','audit/review']},indent=2))
