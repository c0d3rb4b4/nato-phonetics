from pathlib import Path
from collections import Counter
import hashlib,json,datetime,subprocess,re,urllib.parse
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/evidence/run11'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((ROOT/'docs/evidence/run10/source-identity.json').read_text())
paths=set(old['files'])|{'docs/NUMERIC_PRACTICE.md','docs/AUDIO_VALIDATION.md'}
for folder in ['app','src','scripts','tests','.github/workflows']:
 paths.update(str(p.relative_to(ROOT)) for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.js','.mjs','.cjs','.ts','.tsx','.json','.yml'])
files={p:sha(ROOT/p) for p in sorted(paths) if (ROOT/p).is_file()}
d={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'candidate':'Run11 inherited uncommitted workspace plus digit reference/numeric-mixed-example symbol drills, temporary voice filters, explicit shared Button ARIA, policy/test/CI/docs changes; no commit or release','applicationManifestSha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'algorithm':'SHA256 of sorted compact JSON mapping. Maintained inputs plus numeric practice/audio docs; evidence/plan/review excluded to avoid self-reference.','files':files}
(OUT/'source-identity.json').write_text(json.dumps(d,indent=2)+'\n')
changes=[{'file':p,'before':old['files'].get(p),'after':h} for p,h in files.items() if h!=old['files'].get(p)]
(OUT/'shared/source-changes.json').write_text(json.dumps(changes,indent=2)+'\n')

captures=[]
for platform,names in [('web',['metadata.json','app-metadata.json']),('android',['metadata.json']),('ios',['metadata.json'])]:
 folder=OUT/'screenshots'/platform
 rows=[]
 for name in names:
  path=folder/name;values=json.loads(path.read_text())
  for r in values:
   png=folder/r['file'];raw=png.read_bytes();assert raw[:8]==b'\x89PNG\r\n\x1a\n'
   w,h=int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big')
   assert (w,h)==(r['width'],r['height']),(png,w,h,r)
   digest=sha(png)
   if r.get('sha256'):assert r['sha256']==digest,png
   r['sha256']=digest;r['candidate']='Run11; source-identity.json; native binary and loaded graph per platform report'
   rows.append(r);captures.append({'platform':platform,**r})
  path.write_text(json.dumps(values,indent=2)+'\n')
 assert len({r['file'] for r in rows})==len(rows)
 assert {r['file'] for r in rows}=={p.name for p in folder.glob('*.png')},platform

counts=Counter(row['platform'] for row in captures)
header=f'''# Run 11 actual screenshot index

18 November 2026. **{len(captures)} inspected primary original PNG captures: {counts['web']} web, {counts['android']} Android, {counts['ios']} iOS.** Actual production browser / installed native apps; no mockups or platform substitution. Inspection sheets in each platform report are review aids; linked PNGs preserve original bytes.

Candidate: inherited uncommitted workspace over `{d['baseHead']}`; [source manifest](../source-identity.json) `{d['applicationManifestSha256']}`. Production build: [log](../shared/web-build-qualified.log). Native binaries rehashed unchanged; actual loaded Metro graphs archived separately: [Android artifact](../android/artifact.json) / [JS](../android/loaded-javascript.json), [iOS artifact](../ios/artifact.json) / [final JS](../ios/loaded-javascript.json). The earlier default iOS practice checkpoint uses [its separately preserved graph](../ios/practice-loaded-javascript.json), before voice/ARIA/policy additions; numeric implementation is unchanged. Only XCTest runners compiled; no new app/Release binary or full integrated P10.7 claim.

Capture methods: Puppeteer `page.screenshot` of the independent production build, `adb -s emulator-5580 exec-out screencap -p`, and XCTest `XCUIScreen.main.screenshot()` attachments exported with `xcrun xcresulttool export attachments` and copied unchanged. Date/browser/device/viewport/theme/text scale/OS/source log/command and SHA-256 are retained in [web numeric metadata](web/metadata.json), [web voice metadata](web/app-metadata.json), [Android metadata](android/metadata.json), [iOS metadata](ios/metadata.json). [Consolidated hashes](manifest.json).

Inspection: all primary images inspected via platform contact sheets; no blank/loading captures accepted. Default/native numeric/reference/example/voice flows are shown. Debug warning toasts remain labelled in iOS frames; browser no-match/error states are intentional. Maximum iOS portrait cards preserve proportions and require horizontal scrolling beyond the visible viewport, so some frames show only part of a card. Android live-scale image visibly FAILS ordinary instruction/label readability; it is retained as failed P05.2 evidence, not a pass. Cold configured 2× is distinct. Scrolled-off content at viewport edges is not a whole-content screenshot or proof of lost content.

Supplemental [13 letter-regression images and metadata](../letter-regression/screenshots/web/sessions-metadata.json) were also inspected and retained, separate from the primary changed-flow count. Failed/interrupted attempt logs/drivers and [pre-ARIA web diagnostic](../web/pre-aria-voice-no-match.png) / [first maximum iOS checkpoint](../ios/maximum-start-checkpoint.png) remain in platform reports; they are not final passing captures.

Missing/unrun: **no supported target lacks a changed-flow capture**. Maximum native voice search/locale/focus combinations, physical AT/listening, original long-drag/Release reach, broader support/orientation/runtime/final integrated states remain P05/P06/P08/P10.7 engineering or the explicitly human [M11 queue](../manual-handoff.md). Historical strict ink failures remain open and no font/design/tolerance change is inferred. P10.7 stays incomplete; these are batch captures, not an accepted final release set.

| Platform / original image | State / setting | Actual size | Capture time (UTC) |
|---|---|---|---|
'''
rows=[]
for r in captures:
 scale=r.get('contentSizeCategory',str(r.get('fontScale',r.get('textScale',1))))
 theme=r.get('theme', 'dark' if r.get('background')=='rgb(31, 41, 51)' else 'light')
 rows.append(f"| {r['platform']} / [{r['file']}]({r['platform']}/{r['file']}) | {r.get('state',r['file'])} · {theme} · text {scale} | {r['width']}×{r['height']} | {r.get('capturedAt',r.get('timestamp',''))} |")
(OUT/'screenshots/index.md').write_text(header+'\n'.join(rows)+'\n')
(OUT/'screenshots/manifest.json').write_text(json.dumps({'candidateManifestSha256':d['applicationManifestSha256'],'date':'2026-11-18','primaryCount':len(captures),'counts':dict(counts),'captures':captures},indent=2)+'\n')

# Preserve every inherited input except the reviewed, explicit task changes.
allowed={
 '.github/workflows/ci.yml','PRIVACY.md','README.md','app/alphabet.js','app/index.js','app/letter-quiz.js','app/privacy.js','app/voice-select.js','docs/AUDIO_VALIDATION.md','docs/DELIVERY_PLAN.md','docs/APP_REVIEW.md','scripts/verify-app-browser.cjs','src/components/NatoTile.js','src/components/ui.js','src/lib/audioVoices.js','src/lib/questions.js','src/lib/quizSession.js','tests/audio.test.mjs','tests/quiz-session.test.mjs',
}
initial=json.loads((OUT/'shared/initial-files.json').read_text())
modified=[p for p,h in initial.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
unexpected=sorted(set(modified)-allowed);assert not unexpected,unexpected
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
status=Counter(line.split('|')[4].strip() for line in ledger.splitlines() if re.match(r'^\| [RF]\d\d \|',line))
assert status=={'open':4,'in-progress':15,'implemented-awaiting-M11':12,'resolved':4},status
for id in ['P08.1','P08.4']:
 assert f'- [ ] **{id}**' in plan
assert all(not line.startswith('- [x]') for line in plan.split('## M11 —')[1].split('## Complete scope')[0].splitlines())
# Only local path existence is asserted; web URLs/manual results are not fabricated.
docs=[ROOT/'README.md',ROOT/'PRIVACY.md',ROOT/'docs/DELIVERY_PLAN.md',ROOT/'docs/APP_REVIEW.md',ROOT/'docs/AUDIO_VALIDATION.md',ROOT/'docs/NUMERIC_PRACTICE.md',*OUT.rglob('*.md')]
broken=[];links=0
for p in docs:
 for target in re.findall(r'\]\(([^)\n]+)\)',p.read_text()):
  if re.match(r'^(https?://|mailto:|#)',target):continue
  local=target.split('#')[0].strip('<>');local=urllib.parse.unquote(local)
  if not local:continue
  links+=1
  if not (p.parent/local).exists():broken.append({'document':str(p.relative_to(ROOT)),'target':target})
assert not broken,broken
for platform in ['ios','android']:
 data=json.loads((OUT/platform/'loaded-javascript.json').read_text())
 for row in data['scripts']:assert sha(ROOT/row['file'])==row['sha256']
report={'date':'2026-11-18','sourceInputs':len(files),'sourceChangesVsRun10':len(changes),'initialFilesChecked':len(initial),'reviewedInheritedChanges':sorted(modified),'unexpectedInheritedChanges':unexpected,'ledgerCounts':dict(status),'primaryScreenshots':len(captures),'platformCounts':dict(counts),'pngHashesAndDimensions':'all matched','primaryImagesInspected':True,'supplementalLetterImages':13,'localMarkdownLinksChecked':links,'brokenLocalLinks':broken,'loadedJavaScriptHashes':'matched','manualChecks':'all unperformed','remainingAcceptance':'P05/P06/P07/P08 native gates, P09/P10/M11 open; no release acceptance'}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
