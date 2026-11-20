from pathlib import Path
import json,hashlib,subprocess,datetime,re,collections,gzip
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run17';SHOTS=OUT/'screenshots'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=json.loads((OUT/'shared/baseline.json').read_text());prior=json.loads((ROOT/'docs/evidence/run16/source-identity.json').read_text())
rows=[]
for platform in ['web','ios','android']:
 metadata=json.loads((SHOTS/platform/'metadata.json').read_text())
 for row in metadata:
  p=SHOTS/platform/row['file'];raw=p.read_bytes();row.update(platform=platform,sha256=sha(p),width=int.from_bytes(raw[16:20],'big'),height=int.from_bytes(raw[20:24],'big'),inspected=True)
  rows.append(row)
 (SHOTS/platform/'metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
(SHOTS/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
notes={
 'converter-copy.png':'Complete native plain conversion/Copy confirmation; retained generic Debug warning overlays lower content.',
 'converter-retained-input.png':'Exact retained a3 b! after same-live-state viewport return; Debug warning remains.',
 'converter-playing.png':'Real provider playing3 of26 before verified Stop; no audible/physical pass.',
 'release-converter-keyboard.png':'Exact individual-key input a3 b! with keyboard visible.',
 'release-converter-copy.png':'Complete conversion and Copy assertion with keyboard visible; lower content outside viewport.',
 'release-long-phrase-stopped.png':'Real long-phrase Play→Stop; complete plain conversion/retained input asserted.',
 'alphabet.png':'Visible native reference rows/fonts; lower viewport edge and Debug warning crop later rows.',
 'digits.png':'Visible native digits/fonts; lower viewport edge and Debug warning crop later rows.',
 'release-alphabet.png':'Native Release reference; later rows continue below viewport.',
 'release-digits.png':'Native Release digits; later rows continue below viewport.',
 'desktop-converter.png':'Complete plain conversion; scrolled viewport crops top controls and lower tiles.',
 'narrow-converter.png':'Complete wrapped plain conversion; other controls/tiles continue outside viewport.',
 'desktop-pointer-progress.png':'Four saved exact pointer submissions; top explanatory text partly outside viewport.',
 'narrow-pointer-progress.png':'Same four saved answers in second live page; saved rows continue below viewport.',
 'desktop-alphabet.png':'Production reference/font sample; later rows continue below viewport.',
 'narrow-alphabet.png':'320px dark reference; later rows continue below viewport.',
}
index='''# Run 17 actual screenshot index

18 November 2026. **16 original inspected captures**:6 web,5 iOS,5 Android. [Source identity](../source-identity.json), [all metadata/hashes](metadata.json), [reconciliation](../verification.json).

Production web is Edge157 at1280×900/light and320×568/dark, DPR1; current JS/worker/full shell is byte-identical to Run16. iOS is the actually installed rebuilt unsigned Release on iPhone17Pro/iOS26.2,402×874pt/DPR3/default Large/Light. Android is the actually installed rebuilt Debug APK plus archived actually loaded Metro0.83.8 graph, Android16/API36 arm64,720×1600/280dpi/fontScale1/Light. Exact times/commands/viewports/themes/image hashes are in each platform's metadata. Native artifact identities: [iOS](../ios/artifact.json), [Android](../android/artifact.json); [unsigned Release AAB](../android/release-artifact.json) is separately identified and is not the installed Debug product.

Each image was visually inspected for real content, readable visible text, blank/loading/error states and clipping. Native keyboard/scroll-edge crops and retained Android generic Debug warnings are recorded; no warnings are suppressed and no sole-cause claim is made. These default/scoped samples do not close native P1/P3 or P10.7's full final matrix.

| Target/image | Observed state / limits |
|---|---|
'''
for row in rows:index+=f"| {row['platform']} / [{row['file']}]({row['platform']}/{row['file']}) | {notes[row['file']]} |\n"
index+='''
No changed-target capture is missing: actual web, installed Android and installed iOS are covered. No additional native target is configured. P10.7 still needs the full integrated candidate matrix after remaining implementation/native/security gates; physical devices/AT/listening/provider/other-runtime/signed/hosted acceptance remains unperformed. Original Run16 policy clipping and prior strict fidelity failures are preserved and not requalified by these images.

Failed commands stay separate: [initial iOS no-focus image](../ios/initial-no-input-focus.png), [iOS command/source scope](../ios/README.md), [Android original offscreen lookup and same-live-state follow-up](../android/README.md), [initial web pointer-selector failure](../shared/pointer-check.log). None is relabelled as a whole-command pass.
'''
(SHOTS/'index.md').write_text(index)
manifest=json.loads((ROOT/'dist/offline-manifest.json').read_text())
files=sorted(set(subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=ROOT).decode().split('\0')))
files=[f for f in files if f and (not f.startswith('docs/evidence/') or f in prior['files']) and (ROOT/f).is_file()]
hashes={f:sha(ROOT/f) for f in files}
identity={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'candidate':'Uncommitted Run17 lock/test/doc delta on preserved uncommitted Run16 baseline; no commit created','algorithm':'SHA-256','files':hashes,'manifestSha256':hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest(),'productionShell':manifest,'productionWorkerSha256':sha(ROOT/'dist/service-worker.js'),'productionBundle':next(r for r in manifest['resources'] if r['url'].endswith('.js')),'nativeCandidates':{'ios':'ios/artifact.json','androidDebug':'android/artifact.json','androidUnsignedRelease':'android/release-artifact.json'},'screenshots':'screenshots/metadata.json'}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
changed={f:{'before':h,'after':sha(ROOT/f) if (ROOT/f).is_file() else None} for f,h in base['files'].items() if not (ROOT/f).is_file() or sha(ROOT/f)!=h}
allowed={'README.md','package-lock.json','docs/security-audit-inventory.json','docs/SECURITY_REVIEW.md','docs/NATIVE_BUILDS.md','docs/RELEASE_RUNBOOK.md','docs/LOCAL_PROGRESS.md','docs/DELIVERY_PLAN.md','docs/APP_REVIEW.md'}
unexpected=[f for f in changed if f not in allowed]
historical=[f for f in base['files'] if f.startswith('docs/evidence/')]
historyOK=all((ROOT/f).is_file() and sha(ROOT/f)==base['files'][f] for f in historical)
protected=[f for f in base['files'] if f.startswith(('app/','src/','android/','ios/','assets/','web/','scripts/','.github/')) or f in ['package.json','index.js','index.web.js','PRIVACY.md']]
protectedOK=all(sha(ROOT/f)==base['files'][f] for f in protected)
reviewHistory=(ROOT/'docs/APP_REVIEW.md').read_text().split('## Current delivery status')[0]
oldReview=subprocess.check_output(['git','show',identity['baseHead']+':docs/APP_REVIEW.md'],cwd=ROOT,text=True).split('## Current delivery status')[0]
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();counts=collections.Counter(line.split('|')[4].strip() for line in plan.splitlines() if re.match(r'^\| [RF]\d{2} \|',line))
missing=[];localTargets=[]
for f in [f for f in changed if f.endswith('.md')]+[str(p.relative_to(ROOT)) for p in OUT.rglob('*.md')]:
 p=ROOT/f;body=re.sub(r'```.*?```','',p.read_text(),flags=re.S)
 for target in re.findall(r'\]\(([^)]+)\)',body):
  target=target.strip('<>').split('#')[0]
  if target and '://' not in target:localTargets.append({'file':f,'target':target})
aab=json.loads((OUT/'android/release-artifact.json').read_text());ios=json.loads((OUT/'ios/artifact.json').read_text());android=json.loads((OUT/'android/artifact.json').read_text());loaded=json.loads((OUT/'android/loaded-javascript.json').read_text())
artifactOK=sha(ROOT/aab['path'])==aab['sha256'] and not aab['signatureEntries'] and len(aab['nativeArchitectures'])==4 and sha(ROOT/android['builtApk'])==android['builtSha256'] and android['matchesBuild'] and ios['allInstalledFilesMatch'] and all(sha(ROOT/ios['appPath']/f)==h for f,h in ios['files'].items()) and all(hashlib.sha256(gzip.decompress((ROOT/r['durableArchive']).read_bytes())).hexdigest()==r['sha256'] for r in loaded['scripts'])
resourcesOK=all(sha(ROOT/'dist'/r['url'].lstrip('/'))==r['sha256'] for r in manifest['resources'])
commands=json.loads((OUT/'shared/commands.json').read_text());red=[{'command':r['command'],'exitCode':r['exitCode'],'log':r['log']} for r in commands if r['exitCode']!=0]
ver={'date':'2026-11-18','resumeMatched':base['run16Comparison'],'baselineFiles':len(base['files']),'changedSinceResume':changed,'unexpectedBaselineChanges':unexpected,'historicalEvidenceFiles':len(historical),'allPriorEvidencePreserved':historyOK,'protectedAppNativeFontsProviderStorageWorkerBuildAndCIInputsPreserved':protectedOK,'protectedFiles':protected,'originalReviewHistoryPreserved':reviewHistory==oldReview,'maintainedFiles':len(files),'ledgerCounts':dict(counts),'allM11Unperformed':not re.search(r'^- \[x\] \*\*M11',plan,re.M),'missingLocalLinks':missing,'productionResourceHashesPass':resourcesOK,'webManifestExactlyMatchesRun16':manifest==prior['productionShell'],'webWorkerExactlyMatchesRun16':identity['productionWorkerSha256']==prior['productionWorkerSha256'],'webBundleExactlyMatchesRun16':identity['productionBundle']==prior['productionBundle'],'allScreenshotHashesPass':all(sha(SHOTS/r['platform']/r['file'])==r['sha256'] for r in rows),'screenshotsInspected':len(rows),'platformCounts':dict(collections.Counter(r['platform'] for r in rows)),'artifactHashesPass':artifactOK,'installedImageSizeDirectoryAbsent':not (ROOT/'node_modules/image-size').exists(),'retainedNonzeroCommands':red,'expectedIntentionalStop':'Android emulator exit130 after completed capture, not a build/test failure','knownRedGates':['Current raw audit and disposition gate exit1,28high/3low','First web comparison reads tile body as feedback; assertion fails; corrected assertions pass without product changes','First iOS generic tap fails keyboard focus; coordinate combined short-phrase command fails Stop reach; separate final scoped2tests pass','First Android capture fails lookup of offscreen input; same-live-state viewport return proves exact retention; original remains failed','Prior Android live-text/iOS disclosure/long-drag/max navigation and strict P3 tile gates remain open','Prior concurrent-pointer/injected Retry and broader browser/runtime/host/recognition/integrated gates remain open'],'notClaimed':['Signed distribution or publication','Hosted CI or actual HTTPS deployment','Other engines/frozen/legacy hosted updates','Native measurement/scaling/renderer/framework/gesture repairs','Physical AT/listening/provider/privacy/release acceptance','Full P10.5/.6/.7 or any new phase closure']}
(OUT/'verification.json').write_text(json.dumps(ver,indent=2)+'\n')
# Validate generated report self-links after writing the report.
missing=[r for r in localTargets if not ((ROOT/r['file']).parent/r['target']).exists()]
ver['missingLocalLinks']=missing
(OUT/'verification.json').write_text(json.dumps(ver,indent=2)+'\n')
assert not unexpected and historyOK and protectedOK and reviewHistory==oldReview and not missing and artifactOK and resourcesOK and ver['allM11Unperformed'] and ver['installedImageSizeDirectoryAbsent'],ver
assert ver['webManifestExactlyMatchesRun16'] and ver['webWorkerExactlyMatchesRun16'] and ver['webBundleExactlyMatchesRun16']
assert dict(counts)=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18}
assert len(rows)==16 and ver['platformCounts']=={'web':6,'ios':5,'android':5}
print(json.dumps({k:v for k,v in ver.items() if k not in ['changedSinceResume','protectedFiles','retainedNonzeroCommands','knownRedGates','notClaimed']},indent=2))
