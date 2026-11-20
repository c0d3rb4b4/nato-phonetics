from pathlib import Path
from collections import Counter
import hashlib,json,datetime,subprocess,re,urllib.parse,gzip
ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/evidence/run14'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((ROOT/'docs/evidence/run13/source-identity.json').read_text())['files'];baseline=json.loads((OUT/'shared/baseline-files.json').read_text())
assets=json.loads((ROOT/'assets/images/icon-manifest.json').read_text())
paths=set(old)|set(assets['files'])|set(assets['sources'])|{'assets/images/icon-manifest.json','docs/RELEASE_ASSETS.md','docs/SPOKEN_PRACTICE.md','docs/NATIVE_BUILDS.md'}
for folder in ['app','src','scripts','tests','.github/workflows']:
 paths.update(str(p.relative_to(ROOT)) for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.js','.mjs','.cjs','.ts','.tsx','.json','.yml'])
files={p:sha(ROOT/p) for p in sorted(paths) if (ROOT/p).is_file()}
identity={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'candidate':'Run14 inherited uncommitted candidate plus verified release resources/generator/cleanup and recognition assessment; no commit/release','algorithm':'SHA256 of sorted compact JSON maintained-input mapping; includes source/output artwork and affected docs, excludes plan/review/evidence self-reference','applicationManifestSha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'files':files}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
changes=[{'file':p,'before':old.get(p),'after':h} for p,h in files.items() if old.get(p)!=h]
(OUT/'shared/source-changes.json').write_text(json.dumps(changes,indent=2)+'\n')
allowed=set(assets['files'])|{'scripts/generate-icons.js','README.md','docs/NATIVE_BUILDS.md','docs/DELIVERY_PLAN.md','docs/APP_REVIEW.md','assets/images/react-logo.png','assets/images/react-logo@2x.png','assets/images/react-logo@3x.png','assets/images/partial-react-logo.png'}
modified=[p for p,h in baseline.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
unexpected=sorted(set(modified)-allowed);assert not unexpected,unexpected
# Historical evidence, native/app code, user .gitignore, permissions/locks/fonts remain preserved.
assert all(sha(ROOT/p)==h for p,h in baseline.items() if p.startswith('docs/evidence/run') and not p.startswith('docs/evidence/run14/'))
for p in ['.gitignore','package.json','package-lock.json','android/app/src/main/AndroidManifest.xml','ios/NATOPhonetics/Info.plist']:
 assert sha(ROOT/p)==baseline[p],p
for p,entry in assets['files'].items():assert sha(ROOT/p)==entry['sha256'],p
captures=[]
for platform in ['web','android','ios']:
 folder=OUT/'screenshots'/platform;rows=json.loads((folder/'metadata.json').read_text())
 assert {r['file'] for r in rows}=={p.name for p in folder.glob('*.png')}
 for row in rows:
  p=folder/row['file'];raw=p.read_bytes();assert raw[:8]==b'\x89PNG\r\n\x1a\n'
  assert (row['width'],row['height'])==(int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big'))
  if row.get('sha256'):assert sha(p)==row['sha256']
  row.update(sha256=sha(p),candidateManifestSha256=identity['applicationManifestSha256'])
  row['evidenceKind']='native diagnostic (not production app)' if row['file']=='native-crop-diagnostics.png' else 'actual production web' if platform=='web' else 'actual installed native app or OS launcher'
  captures.append({'platform':platform,**row})
 (folder/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
counts=Counter(r['platform'] for r in captures);assert counts=={'web':2,'android':4,'ios':3},counts
(OUT/'screenshots/manifest.json').write_text(json.dumps({'candidateManifestSha256':identity['applicationManifestSha256'],'date':'2026-11-18','inspectedOriginals':9,'productionOriginals':8,'nativeDiagnosticOriginals':1,'counts':dict(counts),'captures':captures},indent=2)+'\n')
header=f'''# Run 14 actual screenshot index

18 November 2026. **9 inspected originals: 2 production web, 3 installed Android launcher/app, 3 installed iOS launcher/app, plus 1 separately labelled native crop diagnostic.** No generated mockup or platform substitution. Candidate is the inherited uncommitted workspace over `{identity['baseHead']}`; [source identity](../source-identity.json) `{identity['applicationManifestSha256']}`.

Actual rebuilt native identities: [Android Debug APK](../android/artifact.json), [exact packaged layers](../android/packaged-resources.json), [separately archived loaded JS](../android/loaded-javascript.json); [iOS unsigned Release installed-file/embedded-JS identity](../ios/artifact.json). [Production browser result](../web/capture.log) byte-verifies served favicon; the tab/browser chrome is outside page screenshots. [Capture manifest](manifest.json) and platform metadata below record settings/time/commands/hash/candidate.

Inspection: every original opened and reviewed. No blank/loading capture accepted. Android color/themed crops retain bubble, tail, A and waves. Final themed launcher capture waits for the launcher transition to settle; ordinary icons are restored after capture. Its outer ring is the launcher's predicted-app decoration. The native crop image uses a separate diagnostic Activity reading actual installed resources; it is not production UI or an OEM support claim. Diagnostic header inset corrected; [earlier image](../android/native-crop-before-insets.png) retained. iOS SpringBoard shows historical test-runner icons beside the actual app. Home images are real running apps; the narrow web page scrolls below the viewport.

Retained failures: [pre-boot install](../android/install-before-boot.log), [overlapped Activity driver](../android/capture-overlap-failed.log), [predicted-label driver](../android/capture-predicted-label-failed.log). Final serial [Android](../android/capture.log) and [iOS XCTest](../ios/capture.log) pass in stated scope; those earlier commands remain failed. No production UI fix, native measurement/gesture/input/accessibility or full Release-flow qualification is inferred.

Missing/inapplicable: no supported target lacks actual changed-launcher-flow evidence. Transient splash files are packaged/identified but separate transient splash captures are not claimed. Full integrated P10.7 Home/reference/converter/practice/settings/permission/themes/text-scale/orientation/runtime set remains unfinished. P09.1 assessment adds no product capture/permission flow, so its screenshots are inapplicable; capability probes do not implement recognition. Physical/OEM appearance/AT/audio/provider/privacy/signing/distribution/release remain [M11 unperformed](../manual-handoff.md). Existing native P1, concurrent progress, P3 ink and security/offline gates stay open.

| Platform / original | Actual state / settings | Size | Capture time UTC |
|---|---|---|---|
'''
rows=[]
for r in captures:
 rows.append(f"| {r['platform']} / [{r['file']}]({r['platform']}/{r['file']}) | {r['state']} · {r.get('theme','')} · {r['evidenceKind']} | {r['width']}×{r['height']} | {r.get('capturedAt',r.get('timestamp',''))} |")
(OUT/'screenshots/index.md').write_text(header+'\n'.join(rows)+'\n')
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
status=Counter(line.split('|')[4].strip() for line in ledger.splitlines() if re.match(r'^\| [RF]\d\d \|',line));assert status=={'in-progress':17,'implemented-awaiting-M11':13,'resolved':5},status
assert '- [x] **P10.1**' in plan and '- [x] **P09.1**' in plan
assert all(not line.startswith('- [x]') for line in plan.split('## M11 —')[1].split('## Complete scope')[0].splitlines())
for task in ['P09.2','P09.3','P09.4','P10.2','P10.3','P10.4','P10.5','P10.6','P10.7']:assert '- [ ] **'+task+'**' in plan
for script in json.loads((OUT/'android/loaded-javascript.json').read_text())['scripts']:
 archive=ROOT/script['durableArchive'];assert sha(archive)==script['archiveSha256'];assert hashlib.sha256(gzip.decompress(archive.read_bytes())).hexdigest()==script['sha256']
assert json.loads((OUT/'android/artifact.json').read_text())['installedMatchesBuild'];assert json.loads((OUT/'ios/artifact.json').read_text())['allInstalledFilesMatch']
(OUT/'verification.json').write_text('{}\n')
docs=[ROOT/'README.md',ROOT/'docs/DELIVERY_PLAN.md',ROOT/'docs/APP_REVIEW.md',ROOT/'docs/NATIVE_BUILDS.md',ROOT/'docs/RELEASE_ASSETS.md',ROOT/'docs/SPOKEN_PRACTICE.md',*OUT.rglob('*.md')]
links=0;broken=[]
for doc in docs:
 for target in re.findall(r'\]\(([^)\n]+)\)',doc.read_text()):
  if re.match(r'^(https?://|mailto:|#)',target):continue
  local=urllib.parse.unquote(target.split('#')[0].strip('<>'))
  if not local:continue
  links+=1
  if not (doc.parent/local).exists():broken.append({'file':str(doc.relative_to(ROOT)),'target':target})
assert not broken,broken
report={'date':'2026-11-18','status':'passed scoped source/status/link/hash reconciliation; inherited failures/unrun gates remain open','sourceInputs':len(files),'differencesVsRun13':len(changes),'baselineFilesChecked':len(baseline),'intendedExistingChanges':modified,'unexpectedInheritedChanges':unexpected,'historicalEvidencePreserved':True,'ledger':dict(status),'zeroStatusCounts':{'open':0,'blocked':0,'scope-change-approved':0},'M11':'all unperformed','completedTasks':['P10.1','P09.1'],'activePhases':['P05','P06','P07','P08','P09','P10'],'screenshots':dict(counts),'productionOriginals':8,'nativeDiagnosticOriginals':1,'localLinksChecked':links,'brokenLocalLinks':broken,'androidRebuiltInstalledHashMatch':True,'iosRebuiltReleaseInstalledFileMatch':True,'recognitionImplemented':False,'newProductionPermissionsDependenciesProvidersOrAppCode':False,'missingTransientSplashCaptures':'Not separately captured; resources packaged/identified; integrated P10.7 unfinished','failedCommandsRetained':['shared/generate-icons-first.log','android/install-before-boot.log','android/capture-overlap-failed.log','android/capture-predicted-label-failed.log'],'remainingEngineering':['Android live ordinary-text P1/first divergence','Original iOS long-drag/input/runtime/max long-page qualification','Concurrent progress integrity','Strict P3 ink','Security/offline/integrated release/support','Recognition P09.2-.4'],'next':'P05.2 priority; independent P10.2 cache/update/P10.3-.4 runbook/artifacts, concurrent progress or separately forecast recognition implementation','stopReason':'Asset delivery then bounded recognition assessment completed; reserve final reliable handoff before a new cache/permission/native-provider verification cycle','noReleaseScopeOrPublishingApproval':True}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
