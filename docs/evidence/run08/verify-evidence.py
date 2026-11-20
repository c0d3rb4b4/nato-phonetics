"""Check current source identity, retained artifacts/captures, links and status counts."""
from pathlib import Path
import hashlib,json,re,collections,subprocess
ROOT=Path(__file__).resolve().parents[3];OUT=Path(__file__).resolve().parent
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((OUT/'source-identity.json').read_text())
for name,expected in manifest['files'].items():assert sha(ROOT/name)==expected,name
identity=hashlib.sha256(json.dumps(manifest['files'],sort_keys=True,separators=(',',':')).encode()).hexdigest()
assert identity==manifest['applicationManifestSha256']
resume=json.loads((OUT/'shared/resume-source.json').read_text());changed=json.loads((OUT/'shared/source-changes.json').read_text())
allowed={r['file'] for r in changed['changed']}
for name,expected in resume.items():
 if name not in allowed:assert sha(ROOT/name)==expected,('inherited source changed',name)
assert not changed['removed']
for platform in ['android','ios']:
 for script in json.loads((OUT/platform/'loaded-javascript.json').read_text())['scripts']:
  assert sha(ROOT/script['file'])==script['sha256'],script['file']
artifact=json.loads((OUT/'android/artifact.json').read_text());assert sha(ROOT/artifact['apk'])==artifact['sha256']
a=json.loads((OUT/'ios/artifact.json').read_text());app=ROOT/a['appPath'];assert sha(app/'NATOPhonetics')==a['nativeExecutableSha256'];assert sha(app/'NATOPhonetics.debug.dylib')==a['debugDylibSha256']
shots=json.loads((OUT/'screenshots/inspection.json').read_text());assert shots['count']==44
for row in shots['captures']:assert sha(OUT/'screenshots'/row['platform']/row['file'])==row['sha256'],row['file']
assert collections.Counter(r['platform'] for r in shots['captures'])=={'web':20,'android':15,'ios':9}
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
counts=collections.Counter()
for line in ledger.splitlines():
 if re.match(r'^\| (R\d\d|F\d\d) \|',line):counts[line.split('|')[4].strip()]+=1
assert dict(counts)=={'resolved':4,'implemented-awaiting-M11':12,'in-progress':12,'open':7},counts
assert '- [x] **P07.2**' in plan and '- [ ] **P07.4**' in plan
# Changed/new reports only; historical external/repository references retain their scope.
files=[ROOT/'docs/DELIVERY_PLAN.md',ROOT/'docs/APP_REVIEW.md',ROOT/'docs/DELIVERY_PRIORITY_REVIEW.md',ROOT/'README.md',ROOT/'PRIVACY.md',*OUT.rglob('*.md')]
missing=[];checked=0
for p in files:
 for target in re.findall(r'(?<!!)\[[^\]]*\]\(([^)]+)\)',p.read_text()):
  if target.startswith(('http:','https:','mailto:','#')):continue
  target=target.split('#')[0].split(' "')[0]
  if not target:continue
  checked+=1
  if not (p.parent/target).exists():missing.append({'file':str(p.relative_to(ROOT)),'target':target})
assert not missing,missing
# Native toolchain logs and browser results are assertions from executed drivers, not fabricated passes.
for filename in ['ios/sessions-test.log','ios/large-test.log']:
 text=(OUT/filename).read_text();assert ('** TEST SUCCEEDED **' in text or '** TEST EXECUTE SUCCEEDED **' in text),filename
for filename in ['web/sessions.log','web/app-flows.log','web/tiles.log']:
 text=(OUT/filename).read_text();assert 'PASS' in text and not re.search(r'AssertionError|TimeoutError|^Error:',text,re.M),filename
result={'passed':True,'date':'2026-11-17','applicationManifestSha256':identity,'inheritedUnchangedFiles':changed['unchangedCount'],'unexpectedRemovedFiles':0,'indexedInspectedScreenshots':44,'screenshotsByTarget':{'web':20,'android':15,'ios':9},'supplementaryDiagnosticScreenshot':'ios/diagnostics/url-confirmation.png','checkedLocalLinks':checked,'missingLinks':missing,'ledgerCounts':dict(counts),'taskStatus':{'P07.2':'delivered','P07.4':'partial; affected Android live enlarged-text gate open','P07':'active','P05.2':'failed; no repair claimed','M11':'unperformed'},'notRepeated':'Unchanged locked install/audit/native app builds/full tile-window-raster matrices; historical evidence retains scope'}
(OUT/'verification.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps(result,indent=2))
