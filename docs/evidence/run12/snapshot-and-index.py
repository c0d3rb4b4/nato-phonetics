from pathlib import Path
from collections import Counter
import hashlib,json,datetime,subprocess,re,urllib.parse
ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/evidence/run12'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((ROOT/'docs/evidence/run11/source-identity.json').read_text())
paths=set(old['files'])
for folder in ['app','src','scripts','tests','.github/workflows']:
 paths.update(str(p.relative_to(ROOT)) for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.js','.mjs','.cjs','.ts','.tsx','.json','.yml'])
files={p:sha(ROOT/p) for p in sorted(paths) if (ROOT/p).is_file()}
d={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),'candidate':'Run12 inherited uncommitted workspace plus listening/typed recall, session modes, tests/CI, discovery/help/memory-only policy/docs; no commit or release','applicationManifestSha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'algorithm':'SHA256 of sorted compact JSON mapping; maintained inputs plus practice/audio docs, excluding evidence/plan/review self-reference.','files':files}
(OUT/'source-identity.json').write_text(json.dumps(d,indent=2)+'\n')
changes=[{'file':p,'before':old['files'].get(p),'after':h} for p,h in files.items() if h!=old['files'].get(p)]
(OUT/'shared/source-changes.json').write_text(json.dumps(changes,indent=2)+'\n')

captures=[]
for platform,names in [('web',['metadata.json','support-metadata.json']),('android',['metadata.json']),('ios',['metadata.json'])]:
 folder=OUT/'screenshots'/platform;rows=[]
 for name in names:
  path=folder/name;values=json.loads(path.read_text())
  for r in values:
   png=folder/r['file'];raw=png.read_bytes();assert raw[:8]==b'\x89PNG\r\n\x1a\n'
   w,h=int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big');assert (w,h)==(r['width'],r['height'])
   digest=sha(png)
   if r.get('sha256'):assert digest==r['sha256']
   r['sha256']=digest;r['candidate']='Run12; source-identity.json; native binary/loaded graph per platform report'
   # A headless browser field focus does not depict a mobile OS keyboard.
   if platform=='web' and r.get('state')=='typed-keyboard':r['state']='typed draft/focus; no OS keyboard in headless web'
   rows.append(r);captures.append({'platform':platform,**r})
  path.write_text(json.dumps(values,indent=2)+'\n')
 assert len({r['file'] for r in rows})==len(rows)
 assert {r['file'] for r in rows}=={p.name for p in folder.glob('*.png')}
counts=Counter(r['platform'] for r in captures)
header=f'''# Run 12 actual screenshot index

18 November 2026. **{len(captures)} inspected primary original PNGs: {counts['web']} web, {counts['android']} Android, {counts['ios']} iOS.** Actual independent production browser and installed native apps; no mockups or platform substitution. Inspection sheets in platform reports are review aids; linked originals preserve captured bytes.

Candidate: inherited uncommitted workspace over `{d['baseHead']}`; [source manifest](../source-identity.json) `{d['applicationManifestSha256']}`; [source changes](../shared/source-changes.json) and [final build](../shared/build-web-final.log). Native binaries rehashed unchanged: [Android artifact](../android/artifact.json) / [actual JS](../android/loaded-javascript.json), [iOS artifact](../ios/artifact.json) / [practice JS](../ios/practice-loaded-javascript.json) / [final JS](../ios/loaded-javascript.json). Pre-help iOS practice graph and final help/privacy/discovery graph differ; recall code is unchanged. No native app/Release rebuild or final integrated P10.7 claim.

Methods: Puppeteer `page.screenshot` on production web, `adb -s emulator-5580 exec-out screencap -p`, and XCTest `XCUIScreen.main.screenshot()` attachments exported with `xcrun xcresulttool export attachments`; final iOS help uses `simctl openurl` and `simctl io screenshot`. Capture-time OS/device/viewport/theme/text scale/source log/graph/command/time and SHA-256 are retained in [web recall metadata](web/metadata.json), [web support metadata](web/support-metadata.json), [Android metadata](android/metadata.json), [iOS metadata](ios/metadata.json) and [consolidated manifest](manifest.json).

Inspection: all primary images inspected through final platform contact sheets; no blank/loading frame accepted. Deliberate browser synthesis-error frames are labelled. Native Debug warning toasts remain unsuppressed and labelled. Enlarged scrollable content/tiles extend beyond the viewport, so some frames show portions of them; checked scrolling/input/submission is separate from a whole-content image. Native OS keyboards are real; web typed-keyboard filenames mean a focused draft in headless browser, with no OS keyboard claim. Android live-scale typed draft retains input while ordinary labels remain stale/small: **failed affected readability**, not an accessibility pass.

Failed evidence: iOS listening images are assertions/checkpoints within a command that later fails bulk typed input, as recorded in [iOS report](../ios/README.md). That command never becomes a pass. Exact bulk input and blocked-toast scroll checkpoints, original drivers/logs and exporter recovery are retained. [Initial pre-help web images](../web/pre-final-captures/metadata.json) and pre-support-alignment images remain separate from primary final captures. Unchanged historical strict ink failures remain failed/parked with unchanged tolerances.

Missing/unrun: **no supported target lacks changed-mode captures**. Full enlarged native rounds/all-symbol coverage, Android cold enlarged typed flow, native About/iOS policy-page capture refresh (P10.7), native no-engine/error combinations, physical AT/listening/keyboards/provider/offline, original iOS long-drag/Release reach, broader runtime/orientation and final integrated states remain P05/P06/P08/P10.7 engineering or explicitly human [M11](../manual-handoff.md). No scope/support/release exception. P10.7 stays incomplete; this is a batch set.

| Platform / original image | State / setting | Actual size | Capture time (UTC) |
|---|---|---|---|
'''
rows=[]
for r in captures:
 scale=r.get('contentSizeCategory',str(r.get('fontScale',r.get('textScale',1))))
 rows.append(f"| {r['platform']} / [{r['file']}]({r['platform']}/{r['file']}) | {r.get('state',r['file'])} · {r.get('theme','dark')} · text {scale} | {r['width']}×{r['height']} | {r.get('capturedAt',r.get('timestamp',''))} |")
(OUT/'screenshots/index.md').write_text(header+'\n'.join(rows)+'\n')
(OUT/'screenshots/manifest.json').write_text(json.dumps({'candidateManifestSha256':d['applicationManifestSha256'],'date':'2026-11-18','primaryCount':len(captures),'counts':dict(counts),'captures':captures},indent=2)+'\n')

allowed={'.github/workflows/ci.yml','README.md','PRIVACY.md','app/about.js','app/audio-help.js','app/index.js','app/letter-quiz.js','app/privacy.js','src/lib/quizSession.js','docs/DELIVERY_PLAN.md','docs/APP_REVIEW.md','docs/NUMERIC_PRACTICE.md','docs/AUDIO_VALIDATION.md'}
initial=json.loads((OUT/'shared/baseline-files.json').read_text())
modified=[p for p,h in initial.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
unexpected=sorted(set(modified)-allowed);assert not unexpected,unexpected
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
status=Counter(line.split('|')[4].strip() for line in ledger.splitlines() if re.match(r'^\| [RF]\d\d \|',line))
assert status=={'open':3,'in-progress':16,'implemented-awaiting-M11':12,'resolved':4},status
assert '- [ ] **P08.2**' in plan
assert all(not line.startswith('- [x]') for line in plan.split('## M11 —')[1].split('## Complete scope')[0].splitlines())
docs=[ROOT/'README.md',ROOT/'PRIVACY.md',ROOT/'docs/DELIVERY_PLAN.md',ROOT/'docs/APP_REVIEW.md',ROOT/'docs/AUDIO_VALIDATION.md',ROOT/'docs/NUMERIC_PRACTICE.md',*OUT.rglob('*.md')]
# The report links to itself; create an honest pending record before link checks.
(OUT/'verification.json').write_text(json.dumps({'status':'in-progress','reason':'Local links and graph/native hashes not yet checked.'},indent=2)+'\n')
broken=[];links=0
for p in docs:
 for target in re.findall(r'\]\(([^)\n]+)\)',p.read_text()):
  if re.match(r'^(https?://|mailto:|#)',target):continue
  local=urllib.parse.unquote(target.split('#')[0].strip('<>'))
  if not local:continue
  links+=1
  if not (p.parent/local).exists():broken.append({'document':str(p.relative_to(ROOT)),'target':target})
assert not broken,broken
for platform,filename in [('ios','loaded-javascript.json'),('ios','practice-loaded-javascript.json'),('android','loaded-javascript.json')]:
 data=json.loads((OUT/platform/filename).read_text())
 for row in data['scripts']:assert sha(ROOT/row['file'])==row['sha256']
for platform in ['ios','android']:assert json.loads((OUT/platform/'artifact.json').read_text())['unchangedFromRun11']
report={'date':'2026-11-18','sourceInputs':len(files),'sourceChangesVsRun11':len(changes),'baselineFilesChecked':len(initial),'reviewedInheritedChanges':sorted(modified),'unexpectedInheritedChanges':unexpected,'ledgerCounts':dict(status),'primaryScreenshots':len(captures),'platformCounts':dict(counts),'allPrimaryImagesInspected':True,'pngHashesAndDimensions':'all match','localMarkdownLinksChecked':links,'brokenLocalLinks':broken,'loadedJavaScriptHashes':'all match','installedNativeBinaries':'unchanged hashes match Run11','manualChecks':'all unperformed','remainingAcceptance':'Affected native gates, P08.3, P09/P10/M11 and final release remain open; no release approval'}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
