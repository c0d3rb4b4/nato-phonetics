from pathlib import Path
import json,hashlib,struct,datetime,shutil
root=Path(__file__).resolve().parents[4];out=root/'docs/evidence/run10';folder=out/'screenshots/web'
raw=folder/'metadata.json';backup=out/'web/converter-original-metadata.json'
if not backup.exists():shutil.copyfile(raw,backup)
rows=json.loads(raw.read_text())
for row in rows:
 row['command']='node scripts/verify-converter-browser.cjs dist docs/evidence/run10'
 row['metadataCorrection']='Original helper hardcoded run09 output; corrected to actual Run10 invocation, PNG unchanged; original metadata preserved in web/converter-original-metadata.json'
raw.write_text(json.dumps(rows,indent=2)+'\n')
rows+=json.loads((folder/'pacing-metadata.json').read_text())+json.loads((folder/'policy-metadata.json').read_text())
tile=json.loads((out/'web/tiles/screenshots/web/metadata.json').read_text())
rows += [{**r,'command':tile['command'],'browser':tile['browser'],'capturedAt':tile['capturedAt'],'artifact':'web/pre-policy-artifact.json and original tile metadata asset identity','metadataDateCorrection':'Original tile helper has hardcoded Nov17 date; capturedAt/actual command are Nov18. Helper now uses actual date.'} for r in tile['captures']]
allrows=[]
for platform in ['web','android','ios']:
 current=rows if platform=='web' else json.loads((out/'screenshots'/platform/'metadata.json').read_text())
 byfile={r['file']:r for r in current}
 for p in sorted((out/'screenshots'/platform).glob('*.png')):
  assert p.name in byfile,p
  r=byfile[p.name];data=p.read_bytes();w,h=struct.unpack('>II',data[16:24]);sha=hashlib.sha256(data).hexdigest()
  if r.get('sha256'):assert r['sha256']==sha,p
  r.update(platform=platform,width=w,height=h,sha256=sha,inspection='Inspected actual PNG/contact sheet; see index for overlays, failure scopes and missing states',sourceIdentity='../../source-identity.json')
  allrows.append(r)
(out/'screenshots/all-metadata.json').write_text(json.dumps(allrows,indent=2)+'\n')
counts={t:sum(r['platform']==t for r in allrows) for t in ['web','android','ios']}
lines=['# Run 10 actual screenshot evidence','', '18 November 2026. **'+str(len(allrows))+' inspected original PNG captures**: '+', '.join(str(v)+' '+k for k,v in counts.items())+'. No AI images or mockups. Contact sheets are inspection aids only; original PNG bytes/hashes are preserved.','', '[Source identity](../source-identity.json), [per-image metadata/hashes](all-metadata.json), [web artifact](../web/artifact.json), [earlier export/tile web artifact](../web/pre-policy-artifact.json), [Android APK/current JS](../android/artifact.json), [iOS native/current JS](../ios/artifact.json). Binaries are unchanged and rehashed; standalone XCTest drivers compiled. Earlier web export/tile captures precede only privacy/reset wording edits; pacing/current converter layout is unchanged. Final pacing/policy captures use final production web assets.','', '**Inspection:** Actual readable pacing/progress, card pages, long input/export and policy content are present. Web themes are isolated and final dark frames recaptured after detecting shared-storage contamination; no stale light frame is labelled dark. Narrow/200% button labels remain within their frames; scrolled-off content is not a clipping pass/failure by itself. Android cold 2× pacing labels are readable, while live 1×→2× controls retain stale small labels and enlarged explanatory prose visibly clips: FAILED accessibility. Actual input survives. Android clipboard previews and a transient Debug Refreshing banner on policy are retained/labelled. iOS maximum short-swipes/Copy succeeds in scoped tests; its tall wrapped header is visible. The original long-drag crash is not fixed. Native Copy/Replay captures retain keyboard and generic Debug warning overlays; current-token text can be below the keyboard in iOS progress frames. Two iOS checkpoint frames come from a failed combined command and do not establish a full pass. The web font error is intentional.','', '**Missing / unqualified states:** All supported targets have actual changed-flow images. Maximum iOS plain-text interior, Share sheet, expanded pace and current-card ring are not captured/qualified by the Copy frame; the new iOS stored-data paragraph is above the captured policy position. Native current-card ring timing, very large inputs, physical AT/listening/receiving-app and final integrated release screenshots remain P05.2/P06.2/.3/.4/P10.7 and M11 as appropriate. Exact long iOS clipboard equality remains an engineering check (actual Copy/status and complete output observed); Android/web exact long clipboard equality passes. No missing SDK/credential/target waiver is invented.','', '| Target | Image / state | Settings / inspection |','|---|---|---|']
for r in allrows:
 name=r['file'];settings=f"{r.get('theme','see metadata')}, {r['width']}×{r['height']}"
 if 'fontScale' in r:settings+=', font '+r['fontScale']
 if 'contentSizeCategory' in r:settings+=', '+r['contentSizeCategory']
 if name=='pace-live-scale2.png':settings+='; FAILED stale ordinary text/clipped prose'
 if name=='privacy-pacing.png':settings+='; transient Debug Refreshing banner'
 if name=='privacy-storage-pacing.png':settings+='; new stored-data paragraph above viewport'
 if name in ['native-phrase-progress.png','pace-selected-default.png']:settings+='; captured checkpoint in failed combined test'
 if 'keyboard-copy-after' in name or 'long-paste-full-output-copy' in name:settings+='; Debug warning overlay'
 if 'font-load-error' in name:settings+='; intentional error'
 lines.append(f"| {r['platform']} | [{name}]({r['platform']}/{name}) — {r.get('state',name[:-4])} | {settings} |")
(out/'screenshots/index.md').write_text('\n'.join(lines)+'\n')
assets={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'dist').rglob('*') if p.is_file()}
(out/'web/artifact.json').write_text(json.dumps({'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'candidate':'Run10 final production app; metadata-only script fixes after captures do not change bundle','files':assets},indent=2)+'\n')
print(counts,len(allrows))
