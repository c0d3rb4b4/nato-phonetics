from pathlib import Path
import hashlib,json,struct,datetime
root=Path(__file__).resolve().parents[4];out=root/'docs/evidence/run09';allrows=[]
assets={str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (root/'dist').rglob('*') if p.is_file()}
(out/'web/artifact.json').write_text(json.dumps({'capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'candidate':'Run09 final production web; earlier tile suite has separate original asset identity in tiles-metadata.json','files':assets},indent=2)+'\n')
for platform in ['web','android','ios']:
 folder=out/'screenshots'/platform
 source=json.loads((folder/'metadata.json').read_text())
 if platform=='web':
  tile=json.loads((folder/'tiles-metadata.json').read_text())
  source += [{**r,'command':tile['command'],'browser':tile['browser'],'capturedAt':tile['capturedAt'],'artifact':'tiles-metadata.json original assets (tile sources unchanged after wording/privacy edits)'} for r in tile['captures']]
 rows={r['file']:r for r in source}
 for p in sorted(folder.glob('*.png')):
  assert p.name in rows,p
  r=rows[p.name];data=p.read_bytes();w,h=struct.unpack('>II',data[16:24]);sha=hashlib.sha256(data).hexdigest()
  if r.get('sha256'):assert r['sha256']==sha,p
  r.update(platform=platform,width=w,height=h,sha256=sha,inspection='Inspected actual image: see screenshot index notes; failed/intentional error states remain labelled',sourceIdentity='../../source-identity.json')
  allrows.append(r)
(folder.parent/'all-metadata.json').write_text(json.dumps(allrows,indent=2)+'\n')
counts={platform:sum(r['platform']==platform for r in allrows) for platform in ['web','android','ios']}
lines=['# Run 09 actual screenshot evidence','',f"17 November 2026. **{len(allrows)} inspected actual PNG captures**: "+', '.join(f'{n} {p}' for p,n in counts.items())+'. No mockups or AI images. Native runtimes serialized.','', '[Source identity](../source-identity.json), [all per-image metadata/hashes](all-metadata.json), [web artifacts](../web/artifact.json), [Android APK + loaded JS](../android/artifact.json), [iOS executable/dylib + loaded JS](../ios/artifact.json). Native binaries are unchanged and reverified; current loaded JavaScript is separately archived. Earlier measured converter tile web captures retain their original asset identity in [tiles metadata](web/tiles-metadata.json).','', '**Inspection:** default web/native converter, clipboard/share, cards, empty/Clear and policy frames contain actual readable app content; ordinary viewport scrolling and keyboard occlusion are labelled. Android copied frames retain OS clipboard preview/Debug warning overlays. Cold Android 2× output/export controls are readable; live 1×→2× frames explicitly fail sizing (ordinary labels stay small while tiles enlarge). iOS default Copy/Paste/Share/Menu/Clear/policy passes. Its maximum-size keyboard/input frame is a failed capture scenario; the corrected driver subsequently crashes with a native touch registry assertion. No maximum-size iOS plain-text/control pass is claimed. The alphabet font-error web image is intentional.','', '**Missing captures:** no supported target lacks actual changed-flow images. Successful maximum-size iOS plain text/Copy/Share captures are missing because keyboard-visible reachability failed and the corrected native drag hit RCTSurfaceTouchHandler/SIGABRT. Engineering owners P05.2/P06.2/P10.7; next ordinary-gesture reproduction in the [iOS report](../ios/README.md). Full integrated future-flow release screenshots remain P10.7.','', '| Target | Image / state | Settings and inspection |','|---|---|---|']
for r in allrows:
 name=r['file'];state=r.get('state') or r.get('name') or name[:-4]
 settings=f"{r.get('theme','see metadata')}, {r['width']}×{r['height']}"
 if 'fontScale' in r:settings+=f", font {r['fontScale']}"
 if 'contentSizeCategory' in r:settings+=', '+r['contentSizeCategory']
 if 'live-scale2' in name:settings+='; FAILED live size invalidation'
 if 'maximum-keyboard' in name:settings+='; FAILED / controls unverified'
 if 'font-load-error' in name:settings+='; intentional error'
 if 'clipboard-paste' in name or (r['platform']=='ios' and 'copied' in name):settings+='; keyboard visible'
 lines.append(f"| {r['platform']} | [{name}]({r['platform']}/{name}) — {state} | {settings} |")
(out/'screenshots/index.md').write_text('\n'.join(lines)+'\n')
print(counts,len(allrows))
