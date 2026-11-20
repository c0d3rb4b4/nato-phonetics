from pathlib import Path
import hashlib,json,subprocess,re,collections,gzip,datetime
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run18';SHOTS=OUT/'screenshots'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=json.loads((OUT/'shared/baseline.json').read_text())
notes={
'policy-desktop.png':'Production Edge desktop/light; complete Speech paragraph and nearby policy; viewport crops unrelated top/bottom sections.',
'policy-narrow.png':'Production320×568/dark; complete Speech paragraph; adjacent sections continue outside viewport.',
'policy-complete.png':'Installed unchanged Android Debug/default; complete Speech and Offline paragraphs; unrelated upper/lower sections crop at viewport.',
'policy-default-complete.png':'Rebuilt final iOS/default; repaired final microphone-access words visible and actual screenshot OCR passes. Default policy method passes inside the retained mixed-result original command.',
'policy-maximum-opening.png':'Maximum native text; title wraps connectivit then a visibly drawn isolated y. Original whole command fails OCR because Vision omits y; image is not a full policy pass.',
'policy-maximum-complete-ending.png':'Separate retained maximum-state ending; complete microphone access words visible and actual screenshot OCR passes. Earlier text lies above viewport.',
'reference-juliett.png':'Default iOS reference J and surrounding complete rows; edge rows crop with scrolling. All26 default tile ratios checked, not a full strict raster/baseline gate.',
'maximum-reference-india.png':'Maximum iOS India tile/text readable; enlarged proportional tile has horizontal viewport-edge crop. Strict P3 ink envelope not rerun or passed.',
'maximum-reference-juliett.png':'Maximum iOS Juliett tile/text readable; horizontal viewport-edge crop retained. Strict P3 ink/baseline sweep unrun.',
'converter-retained-input.png':'Final iOS exact a3 b! via individual keys; actual keyboard visible and lower output outside viewport.',
'quiz-question.png':'Final iOS concealed question with four visible choices; entry/layout sample, not a new full scored-session/AT pass.',
'progress-summary.png':'Final iOS zero-progress summary; existing data/scoring unchanged. Lower long-page content continues outside viewport.',
'settings.png':'Final iOS default appearance/voice/settings text and controls; no saved preference change or physical AT pass.',
}
rows=[]
for platform in ['web','ios','android']:
 metadata=json.loads((SHOTS/platform/'metadata.json').read_text())
 for row in metadata:
  file=SHOTS/platform/row['file'];raw=file.read_bytes()
  row.update(platform=platform,sha256=sha(file),pixelWidth=int.from_bytes(raw[16:20],'big'),pixelHeight=int.from_bytes(raw[20:24],'big'),inspected=True,inspection=notes[row['file']])
  rows.append(row)
 (SHOTS/platform/'metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
(SHOTS/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
index='''# Run 18 actual screenshot index

18 November2026. **13 actual inspected captures:2 web,10 iOS,1 Android**. [All metadata/hashes](metadata.json), [source/candidate identity](../source-identity.json), [verification](../verification.json).

Web:actual production Edge157,1280×900/light and320×568/dark,DPR1; complete shell matches Run17 exactly. iOS:actually installed direct rebuilt unsigned Release,iPhone17Pro/iOS26.2,402×874pt/DPR3,Light/default Large or accessibility-extra-extra-extra-large. Android:actually installed unchanged Run17 Debug APK plus separately archived actually loaded Metro graph,Android16/API36/arm64,720×1600/280dpi/fontScale1/Light. [iOS identity](../ios/artifact.json), [Android identity](../android/artifact.json), [Android loaded graph](../android/loaded-javascript.json). Exact capture times/commands/categories/viewports are in platform metadata. No responsive image substitutes for a native capture.

Each image is inspected for actual content, readable visible text, loading/errors and clipping. Ordinary scroll/keyboard/horizontal tile viewport crops are recorded. The failed OCR of the isolated visibly drawn heading y stays failed; a separate ending scope passes, never the whole original command. Default policy OCR and native measurement evidence qualify their precise scopes.

| Target/image | Actual state / limits |
|---|---|
'''
for r in rows:index+=f"| {r['platform']} / [{r['file']}]({r['platform']}/{r['file']}) | {r['inspection']} |\n"
index+='''
Separate same-JS diagnostic pair: [original clipped paragraph](../ios/metrics-live.png), [rebuilt complete paragraph](../ios/metrics-patched-live.png), [measurement/native identities](../ios/paragraph-comparison.json). These two actual images are inspected and are diagnostic, not final product captures. Final product JS/policy/fonts match Run17.

No changed-target capture is missing in this batch. Full P10.7 final candidate coverage remains unfinished, including complete integrated flows/themes/windows/runtime/AT and native baseline/strict raster qualification after the Yoga source change. Prior Android live sizing, iOS original gesture/max progress return and strict P3 ink gates remain open. Human physical/AT/listening/provider/signing/release results are all unperformed. [Exact failed/passing scopes](../README.md).
'''
(SHOTS/'index.md').write_text(index)
paths=sorted(f for f in subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=ROOT).decode().split('\0') if f and (ROOT/f).is_file() and not f.startswith('docs/evidence/'))
hashes={f:sha(ROOT/f) for f in paths}
manifest=json.loads((ROOT/'dist/offline-manifest.json').read_text());prior=json.loads((ROOT/'docs/evidence/run17/source-identity.json').read_text())
identity={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':base['head'],'candidate':'Uncommitted Run18 guarded native-Yoga/compiled-regression/CI/document delta on preserved dirty Run17 baseline; no commit created','algorithm':'SHA-256','files':hashes,'manifestSha256':hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest(),'productionShell':manifest,'productionWorkerSha256':sha(ROOT/'dist/service-worker.js'),'productionBundle':next(r for r in manifest['resources'] if r['url'].endswith('.js')),'installedYogaSourceSha256':sha(ROOT/'node_modules/react-native/ReactCommon/yoga/yoga/algorithm/PixelGrid.cpp'),'nativeCandidates':{'ios':'ios/artifact.json','androidReusedDebug':'android/artifact.json','androidUnsignedReleaseReuse':'../run17/android/release-artifact.json'},'screenshots':'screenshots/metadata.json'}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
changed={f:{'before':h,'after':sha(ROOT/f) if (ROOT/f).exists() else None} for f,h in base['files'].items() if not (ROOT/f).is_file() or sha(ROOT/f)!=h}
allowed={'.github/workflows/ci.yml','README.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/NATIVE_BUILDS.md','docs/RELEASE_RUNBOOK.md','docs/SECURITY_REVIEW.md','package.json'}
unexpected=[f for f in changed if f not in allowed]
history=[f for f in base['files'] if f.startswith('docs/evidence/')]
historyOK=all((ROOT/f).is_file() and sha(ROOT/f)==base['files'][f] for f in history)
protected=[f for f in base['files'] if f.startswith(('app/','src/','android/','ios/','assets/','web/')) or f in ['package-lock.json','PRIVACY.md','index.js','index.web.js']]
protectedOK=all((ROOT/f).is_file() and sha(ROOT/f)==base['files'][f] for f in protected)
review=(ROOT/'docs/APP_REVIEW.md').read_text();oldReview=subprocess.check_output(['git','show',base['head']+':docs/APP_REVIEW.md'],cwd=ROOT,text=True)
reviewOK=review.split('## Current delivery status')[0]==oldReview.split('## Current delivery status')[0]
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();counts=collections.Counter(line.split('|')[4].strip() for line in plan.splitlines() if re.match(r'^\| [RF]\d{2} \|',line))
commands=json.loads((OUT/'shared/commands.json').read_text());nonzero=[{'command':r['command'],'exitCode':r['exitCode'],'log':r['log']} for r in commands if r['exitCode']]
ios=json.loads((OUT/'ios/artifact.json').read_text());android=json.loads((OUT/'android/artifact.json').read_text());loaded=json.loads((OUT/'android/loaded-javascript.json').read_text());patch=json.loads((ROOT/'scripts/patches/react-native-0.81.5-yoga-pixel-grid.json').read_text())
artifactOK=all(sha(ROOT/ios['appPath']/f)==h for f,h in ios['files'].items()) and sha(ROOT/android['builtApk'])==android['builtSha256'] and all(hashlib.sha256(gzip.decompress((ROOT/r['durableArchive']).read_bytes())).hexdigest()==r['sha256'] for r in loaded['scripts'])
resourcesOK=all(sha(ROOT/'dist'/r['url'].lstrip('/'))==r['sha256'] for r in manifest['resources'])
ver={'date':'2026-11-18','resumeMatched':base['run17Comparison'],'baselineFiles':len(base['files']),'changedSinceResume':changed,'newMaintainedFiles':[f for f in paths if f not in base['files']],'unexpectedBaselineChanges':unexpected,'historicalEvidenceFiles':len(history),'allPriorEvidencePreserved':historyOK,'protectedAppPolicyNativeConfigFontsLockStorageWorkerInputsPreserved':protectedOK,'originalReviewHistoryPreserved':reviewOK,'maintainedFiles':len(paths),'ledgerCounts':dict(counts),'allM11Unperformed':not re.search(r'^- \[x\] \*\*M11',plan,re.M),'allScreenshotHashesPass':all(sha(SHOTS/r['platform']/r['file'])==r['sha256'] for r in rows),'screenshotsInspected':len(rows),'platformCounts':dict(collections.Counter(r['platform'] for r in rows)),'artifactHashesPass':artifactOK,'all25IOSInstalledFilesPreviouslyCompared':ios['allInstalledFilesMatch'],'iosExecutableChangedFromRun17':ios['nativeExecutableChangedFromRun17'],'iosEmbeddedJSMatchesRun17':ios['embeddedJSMatchesRun17'],'androidLoadedJSMatchesRun17':loaded['matchesRun17LoadedSource'],'productionShellExactlyMatchesRun17':manifest==prior['productionShell'],'productionResourcesPass':resourcesOK,'guardedInstalledYogaHashPass':identity['installedYogaSourceSha256']==patch['patchedSha256'],'retainedNonzeroCommands':nonzero,'intentionalStop':'Metro child exit-2 from explicit SIGINT after actual loaded-source capture; emulator retry exits0 after explicit adb shutdown; initial emulator exit1 remains failed','knownRedGates':['Current raw audit/disposition exit1,28high/3low','First default core command stale selector fails; default policy method passes; corrected core command separately passes','Original full maximum policy heading OCR fails isolated visibly drawn y; separate same-state ending command passes','First whole web range includes blank trailing-space overflow; precise non-whitespace character follow-up passes','First emulator start disk minimum fails; cleanup/product-preservation/retry succeeds','First documentation updater rejects long-bold task anchor before any file write; corrected anchored update succeeds','All prior native P1/P3, browser/runtime/recognition/signing/hosting/integrated and M11 gates remain as recorded'],'missingLocalLinks':[]}
# Write self-linked report before link validation.
(OUT/'verification.json').write_text(json.dumps(ver,indent=2)+'\n')
missing=[]
mds=[ROOT/f for f in changed if f.endswith('.md')]+[ROOT/f for f in ver['newMaintainedFiles'] if f.endswith('.md')]+list(OUT.rglob('*.md'))
for p in mds:
 body=re.sub(r'```.*?```','',p.read_text(),flags=re.S)
 for target in re.findall(r'\]\(([^)]+)\)',body):
  target=target.strip('<>').split('#')[0]
  if target and '://' not in target and not (p.parent/target).exists():missing.append({'file':str(p.relative_to(ROOT)),'target':target})
ver['missingLocalLinks']=missing;(OUT/'verification.json').write_text(json.dumps(ver,indent=2)+'\n')
assert not unexpected and historyOK and protectedOK and reviewOK and not missing and artifactOK and resourcesOK and ver['guardedInstalledYogaHashPass'] and ver['allM11Unperformed'],ver
assert dict(counts)=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18},dict(counts)
assert len(rows)==13 and ver['platformCounts']=={'web':2,'ios':10,'android':1},ver['platformCounts']
assert ver['productionShellExactlyMatchesRun17'] and ver['iosEmbeddedJSMatchesRun17'] and ver['androidLoadedJSMatchesRun17'] and ver['iosExecutableChangedFromRun17']
print(json.dumps({k:v for k,v in ver.items() if k not in ['changedSinceResume','retainedNonzeroCommands','knownRedGates']},indent=2))
