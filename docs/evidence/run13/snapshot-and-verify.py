from pathlib import Path
from collections import Counter
import hashlib,json,datetime,subprocess,re,urllib.parse,gzip

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/evidence/run13'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
old=json.loads((ROOT/'docs/evidence/run12/source-identity.json').read_text())['files']
paths=set(old)
for folder in ['app','src','scripts','tests','.github/workflows']:
 paths.update(str(p.relative_to(ROOT)) for p in (ROOT/folder).rglob('*') if p.is_file() and p.suffix in ['.js','.mjs','.cjs','.ts','.tsx','.json','.yml'])
paths.add('docs/LOCAL_PROGRESS.md')
files={p:sha(ROOT/p) for p in sorted(paths) if (ROOT/p).is_file()}
identity={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),
 'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),
 'candidate':'Run13 inherited uncommitted candidate plus local progress, scoped review/recovery/deletion and privacy/help; no commit or release',
 'algorithm':'SHA256 of sorted compact JSON mapping of maintained inputs, including rules/help/privacy but excluding plan/review/evidence self-reference',
 'applicationManifestSha256':hashlib.sha256(json.dumps(files,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'files':files}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
changes=[{'file':p,'before':old.get(p),'after':h} for p,h in files.items() if h!=old.get(p)]
(OUT/'shared/source-changes.json').write_text(json.dumps(changes,indent=2)+'\n')

captures=[]
for platform,names in [('web',['metadata.json','support-metadata.json']),('android',['metadata.json']),('ios',['metadata.json'])]:
 folder=OUT/'screenshots'/platform;rows=[]
 for name in names:
  path=folder/name;values=json.loads(path.read_text())
  for row in values:
   png=folder/row['file'];raw=png.read_bytes();assert raw[:8]==b'\x89PNG\r\n\x1a\n'
   w,h=int.from_bytes(raw[16:20],'big'),int.from_bytes(raw[20:24],'big')
   assert (w,h)==(row['width'],row['height']),(platform,row['file'],w,h)
   digest=sha(png)
   if row.get('sha256'):assert digest==row['sha256']
   row.update(sha256=digest,candidate='Run13; source-identity.json and platform native/loaded-JS manifests')
   if platform=='android':
    row['qualification']='Qualified checkpoints within failed first command; see progress.log' if row['file'] not in ['cleared-summary-relaunched.png','live-scale2-summary.png','privacy-local-progress.png','privacy-progress-deletion.png','help-local-progress.png'] else 'Separate rendered-ready relaunch/live or support command; readability remains open'
   rows.append(row);captures.append({'platform':platform,**row})
  path.write_text(json.dumps(values,indent=2)+'\n')
 assert len({row['file'] for row in rows})==len(rows)
 assert {row['file'] for row in rows}=={p.name for p in folder.glob('*.png')}
counts=Counter(row['platform'] for row in captures)
assert counts=={'web':30,'android':17,'ios':18},counts
header=f'''# Run 13 actual screenshot index

18 November 2026. **{len(captures)} inspected primary original PNGs: {counts['web']} web, {counts['android']} Android, {counts['ios']} iOS.** Actual production browser and installed native apps, with no mockups or platform substitution. Contact sheets are inspection aids; linked originals preserve the captured bytes.

Candidate: inherited uncommitted workspace over `{identity['baseHead']}`; [source manifest](../source-identity.json) `{identity['applicationManifestSha256']}`; [source changes](../shared/source-changes.json) and [final build](../shared/build-web-final.log). Native binaries rehash unchanged from Run 12: [Android](../android/artifact.json) / [actual loaded JS](../android/loaded-javascript.json), [iOS](../ios/artifact.json) / [actual loaded JS](../ios/loaded-javascript.json). Loaded-source manifests link durable compressed copies with uncompressed/archive hashes. No native app/Release rebuild or final P10.7 claim.

Methods: Puppeteer `page.screenshot` on independent production web; `adb -s emulator-5580 exec-out screencap -p`; XCTest `XCUIScreen.main.screenshot()` attachments copied unchanged by `xcrun xcresulttool export attachments`. Capture commands, time, OS/browser/device, viewport, theme, font setting and hashes are in [web metadata](web/metadata.json), [web support metadata](web/support-metadata.json), [Android metadata](android/metadata.json), [iOS metadata](ios/metadata.json) and the [consolidated manifest](manifest.json). Android metadata resolves the actual native appearance (saved Dark, System→Light); iOS appearance is Dark. Web narrow progress uses actual 200% text enlargement; support copy uses default text.

Inspection: all originals were reviewed through final contact sheets plus direct Home images. No blank/loading image is accepted. Intentional browser write/delete/schema errors are labelled controlled branches. Long enlarged content extends beyond viewports: iOS symbol first/last edges are separately captured; button reachability and paragraph content are separate checks. Partial headings at scroll edges are viewport portions, not whole-page images. Android live 2× ordinary labels remain stale/small compared with cold 2×; **affected readability is not passed**. No font/metric/tolerance/scaling workaround.

Failure qualifications: iOS serial and maximum images are qualified checkpoints inside commands that subsequently fail; those commands remain failed. Separate due-letter/set-count/maximum-deleted-state/policy commands pass. Android first command qualifies answers/reset/due/cold deletion before a later inspector subprocess failure; separate rendered-ready relaunch/live and support commands pass. Exact logs/drivers and unrun evidence are in [iOS](../ios/README.md) and [Android](../android/README.md). [Pre-correction web captures](../web/pre-final-captures/metadata.json) remain separate from final images; deletion failure feedback was moved beside the controls and the affected suite recaptured.

Missing/unrun: **no supported target lacks changed-progress captures**. Full native candidate Home/About/settings/voice/reference/converter and complete enlarged-mode/all-symbol/runtime/orientation coverage are not refreshed by this batch; they remain P10.7 or the affected engineering tasks. Native forced storage failures/unknown schemas, iOS maximum direct long-page return-to-summary, concurrent browser-process coordination, original gesture/input/runtime residuals, Release and final integrated states remain unqualified. Physical AT/listening/provider/offline/backup/policy/distribution/release remain [M11, unperformed](../manual-handoff.md). No target/support/scope exception or release approval. P10.7 stays incomplete.

| Platform / original image | State / setting | Actual size | Capture time (UTC) |
|---|---|---|---|
'''
rows=[]
for row in captures:
 setting=row.get('contentSizeCategory',str(row.get('fontScale',row.get('textScale',1))))
 rows.append(f"| {row['platform']} / [{row['file']}]({row['platform']}/{row['file']}) | {row.get('state',row['file'])} · {row.get('theme','')} · text {setting} | {row['width']}×{row['height']} | {row.get('capturedAt',row.get('timestamp',''))} |")
(OUT/'screenshots/index.md').write_text(header+'\n'.join(rows)+'\n')
(OUT/'screenshots/manifest.json').write_text(json.dumps({'candidateManifestSha256':identity['applicationManifestSha256'],'date':'2026-11-18','primaryCount':len(captures),'counts':dict(counts),'captures':captures},indent=2)+'\n')

allowed={'.github/workflows/ci.yml','README.md','PRIVACY.md','app/_layout.js','app/about.js','app/audio-help.js','app/index.js','app/letter-quiz.js','app/menu.js','app/privacy.js','app/settings.js','src/navigation/routes.js','scripts/verify-recall-browser.cjs','tests/navigation.test.mjs','docs/DELIVERY_PLAN.md','docs/APP_REVIEW.md','docs/NUMERIC_PRACTICE.md','docs/AUDIO_VALIDATION.md'}
initial=json.loads((OUT/'shared/baseline-files.json').read_text())
modified=[p for p,h in initial.items() if not (ROOT/p).is_file() or sha(ROOT/p)!=h]
unexpected=sorted(set(modified)-allowed);assert not unexpected,unexpected
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
status=Counter(line.split('|')[4].strip() for line in ledger.splitlines() if re.match(r'^\| [RF]\d\d \|',line))
assert status=={'open':2,'in-progress':17,'implemented-awaiting-M11':12,'resolved':4},status
assert '- [ ] **P08.3**' in plan and '- [x] **P08.5**' in plan
assert all(not line.startswith('- [x]') for line in plan.split('## M11 —')[1].split('## Complete scope')[0].splitlines())
graphs=[]
for platform in ['ios','android']:
 d=json.loads((OUT/platform/'loaded-javascript.json').read_text())
 for script in d['scripts']:
  archive=ROOT/script['durableArchive'];raw=gzip.decompress(archive.read_bytes())
  assert sha(archive)==script['archiveSha256']
  assert hashlib.sha256(raw).hexdigest()==script['sha256']
  assert script['progressSourcePresent'];graphs.append({'platform':platform,'sha256':script['sha256'],'bytes':len(raw)})
 assert json.loads((OUT/platform/'artifact.json').read_text())['unchangedFromRun12']
docs=[ROOT/'README.md',ROOT/'PRIVACY.md',ROOT/'docs/DELIVERY_PLAN.md',ROOT/'docs/APP_REVIEW.md',ROOT/'docs/AUDIO_VALIDATION.md',ROOT/'docs/NUMERIC_PRACTICE.md',ROOT/'docs/LOCAL_PROGRESS.md',*OUT.rglob('*.md')]
(OUT/'verification.json').write_text(json.dumps({'status':'in-progress','reason':'Final links/status/source checks in progress'},indent=2)+'\n')
links=0;broken=[]
for path in docs:
 for target in re.findall(r'\]\(([^)\n]+)\)',path.read_text()):
  if re.match(r'^(https?://|mailto:|#)',target):continue
  local=urllib.parse.unquote(target.split('#')[0].strip('<>'))
  if not local:continue
  links+=1
  if not (path.parent/local).exists():broken.append({'document':str(path.relative_to(ROOT)),'target':target})
assert not broken,broken
report={'date':'2026-11-18','status':'passed for stated source/status/link/hash reconciliation; required failed/unrun behavior remains open',
 'sourceInputs':len(files),'sourceChangesVsRun12':len(changes),'baselineFilesChecked':len(initial),'reviewedInheritedChanges':modified,'unexpectedInheritedChanges':unexpected,
 'ledger':dict(status),'M11':'all unperformed','P08.3':'active; functionally delivered with affected native acceptance open','P08.5':'engineering task done; human acceptance pending',
 'screenshots':dict(counts),'inspectedPrimaryCount':len(captures),'localLinksChecked':links,'brokenLocalLinks':broken,'actualLoadedGraphs':graphs,
 'noNativeAppOrReleaseRebuild':True,'newDependencyOrProvider':False,'supportOrReleaseApproval':False,
 'failedCommandsRetained':['web/progress-first.log','ios/default.log','ios/default-corrected.log','ios/ready.log','ios/serial.log','ios/due.log','ios/maximum.log','ios/maximum-edges.log','ios/policy.log','ios/loaded-javascript.log','android/progress.log'],
 'remainingEngineering':['Android ordinary live text P1/first native divergence','Original iOS long-drag P1/bulk compatibility','Maximum iOS long-page return-to-summary qualification','Concurrent browser-process coordination unqualified','Strict P3 ink','Security/runtime/offline/assets/final P10'],
 'nextIndependent':'P10.1 assets; P10 offline/runbook and P09.1 remain eligible','stopReason':'Expanded native driver/capture/storage checks completed to stated scope; reserve reliable evidence/handoff before another asset/cache/native-source cycle'}
(OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
