"""Final actual source/payload/evidence/status preservation checks, not a runtime gate."""
from pathlib import Path
import ast, collections, hashlib, json, re, subprocess, urllib.parse, zipfile

root=Path(__file__).resolve().parents[4]
out=root/'docs/evidence/run29'
sha=lambda data:hashlib.sha256(data).hexdigest()
baseline=json.loads((out/'shared/baseline.json').read_text())
allowed={'README.md','docs/ANDROID_FONT_SCALE_P1_REPORT.md','docs/ANDROID_TEXT_MEASUREMENT.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/NATIVE_BUILDS.md','docs/RELEASE_RUNBOOK.md','tests/fixtures/android-font-scale/README.md','tests/fixtures/android-font-scale/index.js','tests/fixtures/android-font-scale/instrumentation-manifest.xml'}
changed=[];missing=[];history=[]
for name,expected in baseline['files'].items():
 p=root/name
 if not p.exists():missing.append(name)
 elif sha(p.read_bytes())!=expected:
  changed.append(name)
  if name.startswith('docs/evidence/'):history.append(name)
assert not missing and not history and set(changed)==allowed,(missing,history,changed)
assert sha((root/'.git/index').read_bytes())==baseline['indexSha256']
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
assert head==baseline['head']

binding=json.loads((out/'android/fixture-payload-identity-final.json').read_text())
original=root/'artifacts/run27/release-arm64/app-release-unsigned.apk'
fixture=root/'artifacts/run29/release-fixture/font-release-fixture.apk'
assert sha(original.read_bytes())==binding['originalSha256'] and sha(fixture.read_bytes())==binding['fixtureSha256']
signature=lambda n:bool(re.fullmatch(r'META-INF/(?:MANIFEST\.MF|[^/]+\.(?:SF|RSA|DSA|EC))',n,re.IGNORECASE))
with zipfile.ZipFile(original) as a,zipfile.ZipFile(fixture) as b:
 before={n:sha(a.read(n)) for n in a.namelist() if not signature(n)}
 after={n:sha(b.read(n)) for n in b.namelist() if not signature(n)}
 assert set(before)==set(after)
 assert [n for n in before if before[n]!=after[n]]==['assets/index.android.bundle']
 assert before==binding['originalPayload'] and after==binding['fixturePayload']
 assert len(before)-1==487 and len([n for n in before if n.startswith('META-INF/')])==37
 for service in ['kotlinx.coroutines.CoroutineExceptionHandler','kotlinx.coroutines.internal.MainDispatcherFactory']:
  name='META-INF/services/'+service;assert before[name]==after[name]
 assert sha((root/'tests/fixtures/android-font-scale/index.js').read_bytes())==binding['fixtureSourceSha256']
product=root/'artifacts/run27/release-arm64/app-release-local-test.apk'
assert sha(product.read_bytes())=='5dfa45d22b562ddb03fffcbeb16b16bf0392197d69e92320437d5a1ab22ae129'
with zipfile.ZipFile(product) as p:assert sha(p.read('AndroidManifest.xml'))==before['AndroidManifest.xml']
assert json.loads((out/'android/product/identity.json').read_text())['nonDebuggable'] is True
for directory in ['final','narrow-final']:
 report=json.loads((out/'android'/directory/'identity.json').read_text());assert report['passed']
 assert report['identities']['com.natophonetics.app']['sha256']==binding['fixtureSha256']
 gate=json.loads((out/'android'/directory/'gate.json').read_text());assert gate['passed']
gate=json.loads((out/'android/final/gate.json').read_text())
assert len(gate['primary']['comparisons'])+len(gate['primary']['widgetComparisons'])+len(gate['sweep'])==60
assert len(gate['resize'])==12 and len(gate['editing'])==3
restore=json.loads((out/'android/restoration.json').read_text())
assert restore['passed'] and restore['matchesInitial'] and restore['fixtureUndefined']
assert restore['ownedToolingShutdown']['metroStopped'] and restore['ownedToolingShutdown']['emulatorStopped']
assert restore['appDataCleared'] is False
inspection=json.loads((out/'screenshots/inspection.json').read_text());assert len(inspection['rows'])==40
for row in inspection['rows']:
 image=out/'screenshots'/row['file'];assert image.exists() and sha(image.read_bytes())==row['sha256']

plan=(root/'docs/DELIVERY_PLAN.md').read_text();statuses=collections.Counter()
for line in plan.splitlines():
 if re.match(r'^\| (?:R\d{2}|F\d{2}) \|',line):statuses[line.split('|')[4].strip()]+=1
assert dict(statuses)=={'resolved':6,'implemented-awaiting-M11':12,'in-progress':17},statuses
manual=re.findall(r'- \[(.)\] \*\*(M11\.\d+)',plan)
assert len(manual)==7 and all(mark==' ' for mark,_ in manual),manual
review=(root/'docs/APP_REVIEW.md').read_text().split('## Current delivery status')[1]
assert 'Run29' in review and '17 in-progress/12 implemented-awaiting-M11/6 resolved' in review

commands={}
for p in sorted(out.rglob('*.json')):
 data=json.loads(p.read_text())
 if isinstance(data,dict) and isinstance(data.get('command'),list) and isinstance(data.get('exitCode'),int):commands[str(p.relative_to(out))]=data['exitCode']
expected_failures={'android/minimal-runtime.json','android/extended-gate.json'}
assert {p for p,code in commands.items() if code!=0}==expected_failures,commands
assert '# pass 12' in (out/'shared/final-tests.log').read_text()
assert json.loads((out/'shared/final-lint.json').read_text())['exitCode']==0
python_files=[root/'scripts/build-android-font-release-fixture.py',root/'scripts/run-android-font-release-fixture.py',root/'scripts/build-android-font-instrumentation.py',root/'tests/fixtures/android-font-scale/FontScaleFixtureInstrumentation.java']
for p in [*root.joinpath('scripts').glob('*.py'),*out.rglob('*.py')]:ast.parse(p.read_text(),filename=str(p))

links=[];broken=[]
for p in [root/'README.md',*root.joinpath('docs').glob('*.md'),root/'tests/fixtures/android-font-scale/README.md',*out.rglob('*.md')]:
 content=re.sub(r'```.*?```','',p.read_text(),flags=re.S)
 for target in re.findall(r'\]\(([^)]+)\)',content):
  target=target.strip().strip('<>')
  if re.match(r'^(?:https?:|mailto:|#)',target):continue
  target=urllib.parse.unquote(target.split('#')[0])
  if not target:continue
  links.append((str(p.relative_to(root)),target))
  if not (p.parent/target).exists() and (p.parent/target).resolve()!=(out/'verification.json').resolve():broken.append((str(p.relative_to(root)),target))
assert not broken,broken
check=subprocess.run(['git','diff','--check'],cwd=root,capture_output=True,text=True)
assert check.returncode==0,check.stdout+check.stderr
report={'passed':True,'initialHead':baseline['head'],'finalHead':head,'initialFilesChecked':len(baseline['files']),
 'authorizedInitialFilesChanged':sorted(changed),'missingInitialFiles':missing,'historicalEvidenceChanged':history,
 'indexAndHeadUnchanged':True,'productJsNativeFontsDependenciesWorkerUnchanged':True,
 'agentCommitStagingResetPublication':False,'fixtureSha256':binding['fixtureSha256'],
 'otherNonSignaturePayloadEntriesIdentical':487,'nonSignatureMetadataPreserved':37,'changedPayloadEntries':['assets/index.android.bundle'],
 'strictFrameWidgetComparisons':60,'resizeComparisons':12,'narrowComparisons':12,'editedInputChecks':3,
 'actualFinalScreenshotsInspected':40,'scopedTestsPassed':12,'fullSharedTypesWebAuditIosOrSourceBuildRerun':False,
 'itemStatuses':dict(statuses),'humanChecksUnperformed':7,'localLinksChecked':len(links),'brokenLinks':broken,
 'recordedCommandExitCodes':commands,'retainedFailedCommands':sorted(expected_failures),'restorationAndOwnedToolingShutdownPassed':True,
 'diffCheckExitCode':check.returncode,'sourceHashes':{str(p.relative_to(root)):sha(p.read_bytes()) for p in [root/'scripts/build-android-font-release-fixture.py',root/'scripts/check-android-font-release-fixture.cjs',root/'scripts/run-android-font-release-fixture.py',root/'tests/fixtures/android-font-scale/FontScaleFixtureInstrumentation.java',root/'tests/android-release-fixture.test.mjs',root/'tests/fixtures/android-font-scale/index.js']}}
(out/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k not in ['recordedCommandExitCodes','sourceHashes','authorizedInitialFilesChanged']}))
