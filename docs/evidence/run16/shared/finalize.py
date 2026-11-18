from pathlib import Path
import json,hashlib,re,subprocess,datetime,collections
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run16';SHOTS=OUT/'screenshots'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
report=json.loads((OUT/'report.json').read_text());manifest=json.loads((ROOT/'dist/offline-manifest.json').read_text())
assert report['candidate']['buildId']==manifest['buildId']
rows=[]
for row in report['captures']:
 row=dict(row,platform='web',theme='dark',textScale=2 if '-200-' in row['file'] else 1)
 row['sha256']=sha(SHOTS/'web'/row['file']);rows.append(row)
for row in json.loads((SHOTS/'web/light-metadata.json').read_text()):rows.append(dict(row,platform='web',sha256=sha(SHOTS/'web'/row['file']),textScale=1))
for platform in ['android','ios']:
 for row in json.loads((SHOTS/platform/'metadata.json').read_text()):rows.append(dict(row,platform=platform))
(SHOTS/'metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
intro=f'''# Run 16 actual final screenshots

18 November 2026. **{len(rows)} final actual captures**: {sum(r['platform']=='web' for r in rows)} web, one Android, one iOS. [Source identity](../source-identity.json), [hash/viewport/state metadata](metadata.json), [browser report](../report.json). Every image is inspected; no generated/mock app images. The exact server directory and rendered shell are separate metadata fields for waiting updates. Fixture B is the same production JS with an HTML root marker and regenerated resource digests, not a second shipped application.

Web: production build, Edge157.0.4341.60/macOS, loopback, desktop1280×900 (two activation/rollback pages use the browser's actual800×600 viewport), narrow320×568 and 200% text at the same narrow width. A={manifest['buildId']}; B={report['candidate']['fixtureB']}. Actual viewport is in each metadata row. `node scripts/verify-offline-browser.cjs dist docs/evidence/run16` captures worker/offline/update states; `node docs/evidence/run16/capture-light.cjs` supplies explicit Light readiness/policy. Speech-provider connectivity is not qualified by these images.

Android: installed Run14 Debug APK/current archived Hermes graph, Android16/API36,720×1600/280dpi/fontScale1/Light; raw ADB screencap after UIAutomator changed-paragraph assertions. [Candidate/logs](../android/README.md).

iOS: final direct unsigned Release simulator build, iPhone17Pro/iOS26.2/402×874pt/DPR3/Large/Light; XCUIScreen screenshot attachment exported unchanged. [Candidate/logs](../ios/README.md). The changed Offline paragraph is fully readable. **The adjacent unchanged Speech paragraph loses its final microphone-access words: this is failed P05.2 readability evidence**, despite successful label/frame assertions. Original/cold/split-candidate images are linked below; no whole-policy pass.

Scroll-boundary crops of neighboring content are expected on these long screens. The two200% frames deliberately cover the full status text and later provider/action region separately; the heading can be above the current scroll viewport. Buttons are reachable/contained. No first-ever-offline app screenshot is possible before resources exist; the actual failed navigation is tested in the report, rather than replaced with a mock.

| Platform / image | Actual state / inspection |
|---|---|
'''
notes={
'desktop-light-ready.png':'Light, complete production offline readiness and update control',
'desktop-light-policy.png':'Light, current public-cache/provider/update policy, complete changed paragraph',
'desktop-offline-ready.png':'Dark initial connected setup, ready',
'desktop-offline-menu.png':'Dark disconnected worker navigation, ready plus browser-offline report',
'desktop-update-waiting.png':'Active A while server stages B; waiting guidance, no forced reload',
'update-download-failed.png':'A retained after deliberate update resource failure; Retry visible',
'update-activated.png':'Modified-HTML fixture B after all A windows close; saved data retained',
'rollback-ready.png':'Production A restored through ordinary waiting lifecycle',
'narrow-dark-cold-progress.png':'Real persistent-profile browser process restart offline; saved answer retained',
'narrow-dark-cold-offline.png':'Offline process restart, honest readiness/provider limitation',
'narrow-dark-200-offline-status.png':'200% status text; separate scroll region, no lost body text',
'narrow-dark-200-offline-retry.png':'200% provider caveat/action region; update button fits',
'narrow-dark-offline-policy-top.png':'Narrow policy top/whole changed paragraph within scrollable document',
'narrow-dark-offline-policy-bottom.png':'Narrow policy bottom; complete changed disclosure',
'narrow-blocked.png':'Controlled registration/storage denial: error/Retry, no partial cache',
'narrow-corrupt.png':'Deliberate mismatched resource bytes rejected, error/Retry',
'narrow-first-install-recovered.png':'First install succeeds after Retry without reload',
'narrow-unavailable.png':'Service-worker capability absent: guidance, app usable',
'offline-alphabet-fonts.png':'Cached reference and bundled fonts offline; lower rows scroll',
'offline-converter.png':'Exact a3 b! input and complete plain conversion offline; provider playback unclaimed',
'offline-saved-progress.png':'Actual submitted answer/aggregate restored offline',
'desktop-offline-policy.png':'Dark full changed cache/provider/update disclosure',
}
for row in rows:
 p=row['platform'];f=row['file'];note=notes.get(f,'Changed native Offline paragraph readable; adjacent iOS Speech clipping remains failed' if p=='ios' else 'Changed native Offline paragraph readable/reachable; no live-size pass')
 intro+=f'| {p} / [{f}]({p}/{f}) | {note} |\n'
intro+='''
No missing changed-target capture remains: web availability controls apply only to web, native renders no new controls; both native changed policies are actually captured. This does not complete P10.7's all-flow/final-target matrix. Other engines/runtime/frozen/legacy-hosted checks and physical/provider/AT/signing/hosting acceptance remain unperformed.

Failed/diagnostic evidence is preserved separately: [original iOS clipping](../ios/adjacent-speech-clipping-original.png), [cold iOS clipping](../ios/adjacent-speech-clipping-cold.png), [failed/reverted split candidate](../ios/policy-split-still-clipped.png). Earlier `offline/`, `offline-checkpoint2/`, `concurrency/` and `concurrency-diagnostic/` captures are checkpoint artifacts, not added to this final index or relabelled passing final-candidate images. First Preparing/metadata-driver states and the first injected Retry timeout remain explicit in the execution record.
'''
(SHOTS/'index.md').write_text(intro)
prior=json.loads((ROOT/'docs/evidence/run15/source-identity.json').read_text())['files']
files=subprocess.check_output(['git','ls-files','-z','--cached','--others','--exclude-standard'],cwd=ROOT).decode().split('\0')
files=sorted(f for f in files if f and (not f.startswith('docs/evidence/') or f in prior) and (ROOT/f).is_file())
newSinceBase=set(subprocess.check_output(['git','ls-files','-z','--others','--exclude-standard'],cwd=ROOT).decode().split('\0'))
hashes={f:sha(ROOT/f) for f in files}
head=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
identity={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':head,'candidate':'base HEAD plus scoped uncommitted Run16 maintained-source hashes; no commit created','algorithm':'SHA-256','files':hashes,'manifestSha256':hashlib.sha256(json.dumps(hashes,sort_keys=True).encode()).hexdigest(),'productionShell':manifest,'productionWorkerSha256':sha(ROOT/'dist/service-worker.js'),'productionBundle':next(r for r in manifest['resources'] if r['url'].endswith('.js')),'nativeCandidates':{'ios':'ios/artifact.json','android':'android/artifact.json'},'screenshots':'screenshots/metadata.json'}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
# Check every generated resource and real image against recorded bytes.
resourceOK=all(sha(ROOT/'dist'/r['url'].lstrip('/'))==r['sha256'] for r in manifest['resources'])
screenshotOK=all(sha(SHOTS/r['platform']/r['file'])==r['sha256'] for r in rows)
prior=json.loads((ROOT/'docs/evidence/run15/source-identity.json').read_text())['files']
changedPrior={f:{'before':h,'after':hashes.get(f)} for f,h in prior.items() if hashes.get(f)!=h}
protected=[f for f in prior if f.startswith(('android/','ios/','assets/fonts/')) or f in ['package.json','package-lock.json','src/lib/progress.js','src/lib/progressStore.js','src/lib/progressStore.web.js']]
protectedOK=all(hashes.get(f)==prior[f] for f in protected)
reviewBefore=subprocess.check_output(['git','show',head+':docs/APP_REVIEW.md'],cwd=ROOT,text=True).split('## Current delivery status')[0]
reviewHistoryOK=(ROOT/'docs/APP_REVIEW.md').read_text().split('## Current delivery status')[0]==reviewBefore
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();counts=collections.Counter()
for line in plan.splitlines():
 if re.match(r'^\| [RF]\d{2} \|',line):counts[line.split('|')[4].strip()]+=1
manualOK=not re.search(r'^- \[x\] \*\*M11',plan,re.M)
missing=[]
for f in [f for f in files if f.endswith('.md') and (f in changedPrior or f in newSinceBase)]+[str(p.relative_to(ROOT)) for p in OUT.rglob('*.md')]:
 p=ROOT/f
 for target in re.findall(r'\]\(([^)]+)\)',re.sub(r'```.*?```','',p.read_text(),flags=re.S)):
  target=target.strip('<>').split('#')[0]
  if target and '://' not in target and not (p.parent/target).exists():missing.append({'file':f,'target':target})
ver={'date':'2026-11-18','priorInputs':len(prior),'resumeMatched':json.loads((OUT/'shared/resume-comparison.json').read_text())['matched'],'maintainedFiles':len(files),'changedPrior':changedPrior,'newMaintainedFiles':[f for f in files if f in newSinceBase],'newlyInventoriedPreexistingFiles':[f for f in files if f not in prior and f not in newSinceBase],'resourceHashesPass':resourceOK,'finalShellMatchesBrowserReport':manifest['buildId']==report['candidate']['buildId'],'finalRenderedAndServerShellFieldsSeparate':all('serverShellId' in r for r in report['captures']),'screenshotHashesPass':screenshotOK,'finalScreenshots':len(rows),'protectedNativeDependenciesFontsAndProgressFilesPass':protectedOK,'protectedFiles':protected,'originalReviewHistoryPreserved':reviewHistoryOK,'ledgerCounts':dict(counts),'allM11Unperformed':manualOK,'missingLocalLinks':missing,'knownRedGates':['raw audit exit1, 29high/3low','audit disposition exit1, unreviewed new propagated fingerprints','first injected lock-Retry wait timed out; diagnostic rerun7/7 is not a product repair','iOS default Speech policy words clipped; cold/split candidate still fails; experiment reverted','inherited Android live text P1, original iOS long-drag/max navigation, strict P3 ink and other release/runtime gates'],'notClaimed':['fresh locked install','Android rebuild/release distribution','hosted CI','actual HTTPS deployment','other browser engines/frozen/legacy deployed upgrades','provider/listening/physical AT','signing/publication/release acceptance']}
(OUT/'verification.json').write_text(json.dumps(ver,indent=2)+'\n')
assert resourceOK and screenshotOK and protectedOK and reviewHistoryOK and manualOK and not missing,ver
assert dict(counts)=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18}
print(json.dumps({k:v for k,v in ver.items() if k not in ['changedPrior','protectedFiles','notClaimed','knownRedGates']},indent=2))
