from pathlib import Path
import hashlib,json,re,subprocess,collections,os
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run22';os.chdir(ROOT)
sha=lambda f:hashlib.sha256(Path(f).read_bytes()).hexdigest()
baseline=json.loads((OUT/'baseline.json').read_text());changed=[p for p,h in baseline['files'].items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
expected={'.github/workflows/ci.yml','.github/workflows/native-builds.yml','README.md','docs/ANDROID_TEXT_MEASUREMENT.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/NATIVE_BUILDS.md','docs/SECURITY_REVIEW.md','docs/security-audit-inventory.json','package.json','scripts/build-native.cjs'}
assert set(changed)==expected,(set(changed)-expected,expected-set(changed))
original=lambda p:subprocess.check_output(['git','show',baseline['head']+':'+p]).decode()
assert Path('docs/APP_REVIEW.md').read_text().split('## Current delivery status\n')[0]==original('docs/APP_REVIEW.md').split('## Current delivery status\n')[0]
assert Path('README.md').read_text().startswith(original('README.md'))
assert all(sha(ROOT/p)==h for p,h in baseline['files'].items() if p.startswith(('app/','src/','android/','ios/','assets/','web/','docs/evidence/')))
pkg=json.loads(Path('package.json').read_text());oldpkg=json.loads(original('package.json'))
assert all(pkg[k]==oldpkg[k] for k in ['dependencies','devDependencies','engines','packageManager'])
assert sha('package-lock.json')==baseline['files']['package-lock.json']
s=Path('docs/DELIVERY_PLAN.md').read_text();ledger=s.split('## Complete scope and resolution ledger\n')[1].split('## Execution contract')[0];rows=[line.split('|') for line in ledger.splitlines() if re.match(r'^\| (R\d+|F\d+) \|',line)];counts=dict(collections.Counter(r[4].strip() for r in rows));assert len(rows)==35 and counts=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18},counts
phasepart=s.split('## Phase overview and dependencies\n')[1].split('## P00')[0];phases={r.split('|')[1].strip():r.split('|')[-2].strip() for r in phasepart.splitlines() if re.match(r'^\| (P\d+|M11) \|',r)};assert all(phases[f'P{n:02}']=='active' for n in range(5,11)) and phases['M11']=='todo'
assert '- [ ] **P10.8**' in s and '**Priority P2; status active/partial;' in s
manual=[line.split('|') for line in s.splitlines() if re.match(r'^\| M11\.\d+ \|',line)];assert len(manual)==7 and all(r[3].strip()=='todo' for r in manual)
images=json.loads((OUT/'screenshots/index.json').read_text());assert len(images)==10 and all(r['inspected'] and sha(OUT/'screenshots'/r['file'])==r['sha256'] for r in images)
native=json.loads((OUT/'screenshots/native-metadata.json').read_text());ios=next(x for x in native if x['platform']=='ios');assert len(ios['retrievedAndInstalledFiles'])==25;android=next(x for x in native if x['platform']=='android');assert android['apkSha256']==android['installedApkSha256'] and android['homeAssertedInActualHierarchy']
candidate=json.loads((OUT/'candidate.json').read_text());assert all(len(candidate['artifacts'][n]['abis'])==4 for n in ['host-android-debug-final','host-android-release'])
# Output the final source manifest separately; evidence is excluded by design.
result=subprocess.run(['/tmp/nato-phonetics-toolchain/node_modules/node/bin/node','-e',"const fs=require('fs');const {sourceSnapshot}=require('./scripts/host-build.cjs');const {patch,untracked,...s}=sourceSnapshot(process.cwd());fs.writeFileSync('docs/evidence/run22/source-identity.json',JSON.stringify({...s,untracked},null,2)+'\\n');"],capture_output=True,text=True);assert result.returncode==0,result.stderr
report={'date':'2026-11-19','baselineHead':baseline['head'],'finalHead':subprocess.check_output(['git','rev-parse','HEAD']).decode().strip(),'changedBaselineFiles':changed,'baselineFiles':len(baseline['files']),'allOtherBaselineFilesPreserved':True,'originalReviewPrefixPreserved':True,'originalReadmePrefixPreserved':True,'appNativeWebFontsProviderPermissionStorageInputsPreserved':True,'dependenciesAndLockPreserved':True,'ledgerCounts':counts,'phases':phases,'M11':'all7 todo; no human results','P10.8':'active/partial; remote unperformed','screenshots':{'inspected':10,'productViews':5,'failingFontDiagnostics':4,'rejectedLoadingCapture':1,'missingChangedTarget':None,'fullIntegratedMatrix':'unfinished'},'hostOutputs':'actual local APK/AAB/iOS simulator/web; each report owns invocation source identity; final docs/security metadata follow builds','rawAudit':{'exit':1,'high':0,'critical':0,'low':7},'reviewAuditExit':0,'sharedTests':147,'newHostBehavioralTests':8,'frameworkNativeFix':'unperformed; live/cold fails3/4','remoteRunners':0,'priorEvidenceScopesReused':'Run21 unchanged archive/3-engine scopes; prior177 compiled/native/AT limits retained; no broad rerun','finalSourceIdentity':'source-identity.json','sourceIdentityDocDelta':'Final docs/security-inventory differ from command snapshots; product inputs and tested host implementation are unchanged. Final Android inspector archive is explicitly unperformed; actual APK/source/entry/Home scope recorded.','diskAvailableBytes':os.statvfs(ROOT).f_bavail*os.statvfs(ROOT).f_frsize}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
# Validate introduced/edited relative file links, preserve original historical references.
pattern=re.compile(r'\[[^\]]*\]\(([^)]+)\)')
files=[ROOT/p for p in expected if p.endswith('.md')]+list(OUT.rglob('*.md'));checked=0;missing=[]
for p in files:
 rel=str(p.relative_to(ROOT));oldtargets=set(pattern.findall(original(rel))) if rel in baseline['files'] else set()
 for target in pattern.findall(p.read_text()):
  target=target.strip('<>')
  if target.startswith(('http:','https:','mailto:','#','plugin:')):continue
  if target in oldtargets:continue
  target=target.split('#')[0]
  if not target:continue
  checked+=1
  if not (p.parent/target).exists():missing.append({'file':rel,'target':target})
assert not missing,missing
for args in [['git','diff','--check'],['git','diff','--cached','--check']]:
 p=subprocess.run(args,stdout=subprocess.PIPE,stderr=subprocess.STDOUT);assert p.returncode==0,p.stdout.decode()
report['newOrChangedRelativeLinks']=checked;report['newMissingLinks']=[];report['gitDiffCheck']='pass';report['stagedDiffCheck']='pass';report['stagedPatchPreserved']=hashlib.sha256(subprocess.check_output(['git','diff','--cached','--binary'])).hexdigest()==baseline['inheritedStagedPatchSha256'];assert report['stagedPatchPreserved']
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({'result':'pass','baselineFiles':len(baseline['files']),'changed':len(changed),'ledger':counts,'captures':len(images),'newLinks':checked,'nativeRetrievedFiles':len(ios['retrievedAndInstalledFiles']),'reviewGate':0,'rawAudit':1}))
