"""Final scoped evidence/source/preservation/status/link reconciliation."""
from pathlib import Path
import ast,collections,datetime,hashlib,json,re,shutil,subprocess,urllib.parse
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run30'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
b=json.loads((OUT/'shared/baseline.json').read_text())
allowed={'README.md','docs/ANDROID_FONT_SCALE_P1_REPORT.md','docs/ANDROID_TEXT_MEASUREMENT.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/NATIVE_BUILDS.md','docs/RELEASE_RUNBOOK.md','tests/fixtures/android-font-scale/README.md','tests/fixtures/android-font-scale/instrumentation-manifest.xml'}
changed=[f for f,h in b['trackedSha256'].items() if not (ROOT/f).is_file() or sha(ROOT/f)!=h]
assert set(changed)==allowed,(set(changed)-allowed,allowed-set(changed))
head=json.loads((OUT/'shared/head-reconciliation.json').read_text())
assert head['everyCommittedFileMatchesInitialBytes'] and head['initialStagedFiles']==278
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==head['currentHead']
assert not subprocess.check_output(['git','diff','--cached','--name-only'])
commands={}
for name in ['android/checkpoint-public-api.json','android/checkpoint-gate-corrected.json','android/matrix-active-tree-runtime.json','android/layout-gate-final.json','android/raster-gate-visible.json','android/windows-runtime.json','android/window-gate-final.json','android/narrow-complete-runtime.json','android/narrow-gate-final.json','android/restoration-runtime.json','android/restored-loaded-source.json','shared/final-tests.json','shared/final-lint.json','shared/contact-sheets.json']:
 r=json.loads((OUT/name).read_text());assert r['exitCode']==0,name;commands[name]=r['exitCode']
failed={}
for name in ['android/checkpoint.json','android/checkpoint-api-corrected.json','android/checkpoint-radius-corrected.json','android/checkpoint-gate.json','android/matrix-runtime.json','android/raster-gate.json']:
 r=json.loads((OUT/name).read_text());assert r['exitCode']!=0,name;failed[name]=r['exitCode']
reports={}
for f,count,groups in [('native-layout-checks.json',505,15),('window-layout-checks.json',93,7),('narrow-layout-checks.json',21,1)]:
 rows=json.loads((OUT/'android'/f).read_text());assert len(rows)==groups and all(r['passed'] for r in rows)
 assert sum(r['measuredBaselines'] for r in rows)==count
 reports[f]={'groups':groups,'baselines':count,'maxBaselineDeltaPhysicalPixels':max(r['maxBaselineDeltaPhysicalPixels'] for r in rows)}
ink=json.loads((OUT/'android/extended-raster-measurements.json').read_text());assert len(ink)==217
assert all(abs(v)<=2 for r in ink for v in r['deltaPixels'].values())
provenance=json.loads((OUT/'android/assertion-and-payload-provenance.json').read_text())
assert all(row['matchesRun27'] for row in provenance['originalAssertions'].values())
apk=ROOT/'artifacts/run27/release-arm64/app-release-local-test.apk'
assert sha(apk)==provenance['productionApkSha256']=='5dfa45d22b562ddb03fffcbeb16b16bf0392197d69e92320437d5a1ab22ae129'
for name in ['matrix-identity.json','windows-identity.json','narrow-identity.json']:
 r=json.loads((OUT/'android'/name).read_text());assert r['candidateSha256']==sha(apk) and r['nonDebuggable']
 assert r['testApkSha256']==sha(ROOT/'artifacts/run30/instrumentation/font-composition.apk')
meta=json.loads((OUT/'screenshots/android/metadata.json').read_text());assert len(meta)==30
for r in meta:assert sha(OUT/'screenshots/android'/r['file'])==r['sha256']
inspection=json.loads((OUT/'screenshots/inspection.json').read_text())
assert len(inspection)==10 and all(r['status']=='inspected' for r in inspection)
assert {f for r in inspection for f in r['actualCaptures']}=={r['file'] for r in meta}
restore=json.loads((OUT/'android/restoration.json').read_text())
assert restore['passed'] and restore['matchesInitialNumericSettingsAndApk'] and not restore['appDataCleared']
assert restore['ownedToolingShutdown']['metroStopped'] and restore['ownedToolingShutdown']['emulatorKillExit']==0
assert restore['ownedExports']['removedAfterCollection']
assert all(v=='undefined' for v in json.loads((OUT/'android/restored-fixture-absence.json').read_text()).values())
for p in OUT.rglob('*.py'):ast.parse(p.read_text(),filename=str(p))
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
counts=collections.Counter(l.split('|')[4].strip() for l in ledger.splitlines() if re.match(r'\| [RF]\d\d \|',l))
assert counts=={'in-progress':17,'implemented-awaiting-M11':12,'resolved':6},counts
assert len(re.findall(r'^- \[ \] \*\*M11\.[1-7]',plan,re.M))==7
assert re.search(r'\| P05 \|.*\| active \|',plan)
assert 'Run30' in (ROOT/'docs/APP_REVIEW.md').read_text().split('## Current delivery status')[1]
links=[]
for p in [*OUT.rglob('*.md'),*[ROOT/f for f in allowed if f.endswith('.md')]]:
 for raw in re.findall(r'(?<!!)\[[^\]]*\]\(([^)]+)\)',p.read_text()):
  if not ('run30' in raw or OUT in p.parents):continue
  target=urllib.parse.unquote(raw.strip('<>').split('#')[0])
  if not target or re.match(r'\w+://',target):continue
  dest=(p.parent/target).resolve()
  if dest!=OUT/'verification.json':assert dest.exists(),(str(p),raw)
  links.append({'source':str(p.relative_to(ROOT)),'target':raw})
patch=subprocess.check_output(['git','diff','--binary']);(OUT/'shared/final-tracked.diff').write_bytes(patch)
new_sources=['scripts/check-android-release-tiles.cjs','tests/android-release-tiles.test.mjs','tests/fixtures/android-font-scale/TileLayoutInstrumentation.java']
result={'passed':True,'verifiedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'headReconciliation':head,'initialTrackedFilesChecked':len(b['trackedSha256']),'allowedExistingChanges':sorted(allowed),'allOtherInitialTrackedBytesPreserved':True,'noStagingOrCommitByThisExecution':True,'currentBatch':'unstaged changes over a6f51f9','trackedDiffSha256':hashlib.sha256(patch).hexdigest(),'sourceSha256':{f:sha(ROOT/f) for f in new_sources},'passingCommands':commands,'retainedFailedCommands':failed,'nativeReports':reports,'inkObservations':len(ink),'actualScreenshots':len(meta),'inspectedSheets':len(inspection),'newLocalLinksChecked':len(links),'statusCounts':dict(counts),'M11Unperformed':7,'restorationNumericApkVerified':True,'themeRestorationLimit':restore['theme'],'availableBytesFinal':shutil.disk_usage(ROOT).free,'capturesInapplicable':['web/iOS: Android-only test tooling; unchanged product inputs'],'unrun':['default source integration/exact default artifact gates','additional ABI runtime/broader OS/split-window/support','full shared/type/web/audit/iOS builds this batch','integrated P10.5-.7 and all M11']}
(OUT/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
assert (OUT/'verification.json').is_file()
print(json.dumps({k:result[k] for k in ['passed','initialTrackedFilesChecked','inkObservations','actualScreenshots','newLocalLinksChecked','statusCounts']}))
