from pathlib import Path
import hashlib,json,subprocess,datetime
root=Path(__file__).resolve().parents[4]
old=json.loads((root/'docs/evidence/run08/source-identity.json').read_text())
files=set(old['files'])
for dirname in ['app','src','scripts','tests','constants','.github/workflows']:
    files.update(str(p.relative_to(root)) for p in (root/dirname).rglob('*') if p.is_file())
files.update(['package.json','package-lock.json','tsconfig.json','eslint.config.js','README.md','PRIVACY.md'])
# Product docs are hashed; evidence/plan/review are excluded to avoid self-reference.
manifest={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in sorted(files) if (root/f).is_file()}
identity={'date':'2026-11-17','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'candidate':'Run09 inherited uncommitted workspace plus scoped converter/export/policy/CI changes; no commit or release claimed','applicationManifestSha256':hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'algorithm':'SHA256 over sorted compact JSON mapping; scope includes Run08 maintained inputs plus app/src/scripts/tests/constants/CI and README/PRIVACY; evidence/plan/review excluded','files':manifest}
(root/'docs/evidence/run09/source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
changed=[{'file':f,'before':old['files'][f],'after':h} for f,h in manifest.items() if f in old['files'] and old['files'][f]!=h]
added=['src/lib/conversionExport.js','src/lib/conversionExport.web.js','scripts/verify-converter-browser.cjs','tests/conversion.test.mjs','tests/conversion-export.test.mjs']
report={'comparedTo':'Run08 source-identity.json','inheritedFilesMatchedAtResume':127,'confirmedHashChanges':changed,'addedThisRun':[{'file':f,'sha256':manifest[f]} for f in added],'newlyInventoriedPreexisting':[{'file':f,'sha256':h,'modifiedThisRun':f in ['README.md','PRIVACY.md'],'priorHash':'not recorded in Run08 manifest; no new-file claim'} for f,h in manifest.items() if f not in old['files'] and f not in added]}
(root/'docs/evidence/run09/shared/source-changes.json').write_text(json.dumps(report,indent=2)+'\n')
(root/'docs/evidence/run09/shared/final-git-status.txt').write_text(subprocess.check_output(['git','status','--short'],cwd=root,text=True))
print(identity['applicationManifestSha256'],len(manifest),'maintained inputs')
