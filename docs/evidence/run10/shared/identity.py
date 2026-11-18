from pathlib import Path
import json,hashlib,datetime,subprocess
root=Path(__file__).resolve().parents[4];out=root/'docs/evidence/run10';old=json.loads((root/'docs/evidence/run09/source-identity.json').read_text());files=set(old['files'])
for dirname in ['app','src','scripts','tests','constants','.github/workflows']:
 files.update(str(p.relative_to(root)) for p in (root/dirname).rglob('*') if p.is_file())
files.update(['README.md','PRIVACY.md','docs/CONVERTER_POLICY.md'])
manifest={f:hashlib.sha256((root/f).read_bytes()).hexdigest() for f in sorted(files) if (root/f).is_file()}
identity={'date':'2026-11-18','capturedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip(),'candidate':'Run10 inherited uncommitted workspace plus converter pacing/mapped highlighting/paging/scrolling, optional v1 pacing preferences, policy/reset and test/CI/evidence changes; no commit/release','applicationManifestSha256':hashlib.sha256(json.dumps(manifest,sort_keys=True,separators=(',',':')).encode()).hexdigest(),'algorithm':'SHA256 over sorted compact JSON mapping; prior maintained inputs plus app/src/scripts/tests/constants/CI and README/PRIVACY/converter policy; evidence/plan/review excluded to avoid self-reference','files':manifest}
(out/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
changed=[{'file':f,'before':old['files'][f],'after':h} for f,h in manifest.items() if f in old['files'] and h!=old['files'][f]]
report={'comparedTo':'Run09 source-identity.json','inheritedFilesMatchedAtResume':137,'confirmedHashChanges':changed,'addedThisRun':[{'file':'scripts/verify-pacing-browser.cjs','sha256':manifest['scripts/verify-pacing-browser.cjs']}],'newlyInventoriedPreexisting':[{'file':'docs/CONVERTER_POLICY.md','modifiedThisRun':True,'priorHash':'not inventoried in Run09; no new-file claim'}],'missingInheritedInputs':[f for f in old['files'] if f not in manifest]}
assert not report['missingInheritedInputs'];assert manifest['package-lock.json']==old['files']['package-lock.json']
(out/'shared/source-changes.json').write_text(json.dumps(report,indent=2)+'\n')
(out/'shared/final-git-status.txt').write_text(subprocess.check_output(['git','status','--short'],cwd=root,text=True))
print(len(manifest),'inputs;',len(changed),'inherited changes;',identity['applicationManifestSha256'])
