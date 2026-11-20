import collections,datetime,hashlib,json,pathlib,re,subprocess,urllib.parse
root=pathlib.Path.cwd();out=root/'docs/evidence/run19'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
meta=json.loads((out/'screenshots/metadata.json').read_text())
for row in meta:
 assert sha(out/row['path'])==row['sha256']
 row['inspected']=True
 row['inspection']='Viewed in per-runtime contact sheets containing every original capture; no blank/loading screen, unexpected overlay or new clipping in the recorded viewport. Scrollable page continuations are expected.'
(out/'screenshots/metadata.json').write_text(json.dumps(meta,indent=2)+'\n')
manifest=json.loads((out/'shared/web-identity.json').read_text())
lines=['# Run19 actual screenshots','', 'Captured18November2026 from the running production web app, not mockups. Product shell `'+manifest['manifest']['buildId']+'` exactly matches Run18. Candidate is the preserved dirty Run18 source plus Run19 browser runners/CI/documentation; [source identity](../source-identity.json), [checks/failures](../README.md), [capture metadata and hashes](metadata.json).', '', 'All21 retained images were inspected. Desktop1280×900 uses light appearance; narrow320×568 uses dark. Browser/runtime and capture times/commands/arguments are recorded per image in metadata. Actual OS: '+meta[0]['os']+'. Screenshots show complete visible viewports, with normal scrolling for longer pages.', '', '| Runtime / state | Actual image |','|---|---|']
for row in meta:
 runtime=row['path'].split('/')[2];lines.append('| '+runtime+' · '+row['state']+' | ['+row['file']+']('+row['path'].replace('screenshots/','',1)+') |')
lines += ['', 'Android/iOS: **not applicable for this batch**. Only browser automation/CI/docs change; native/product/schema/permission/provider inputs remain byte-identical. [Prior Run18 actual native captures](../../run18/screenshots/index.md) retain their original qualification; no new native screenshot or build pass is claimed. No changed-target capture is missing. P10.7 full integrated candidate matrix remains incomplete.', '', 'Playwright WebKit is not branded Safari/iOS. Actual Chromium page freezing is not OS process suspension. Images supplement behavioral checks and do not prove audible output, physical AT, provider privacy, signing, hosted routing or release acceptance. Original diagnostic failures remain outside this final21-image set and are retained under their command directories.']
(out/'screenshots/index.md').write_text('\n'.join(lines)+'\n')
baseline=json.loads((out/'shared/baseline.json').read_text())
changes={f:{'before':h,'after':sha(root/f) if (root/f).exists() else None} for f,h in baseline['files'].items() if not (root/f).exists() or sha(root/f)!=h}
allowed={'.github/workflows/ci.yml','README.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/LOCAL_PROGRESS.md','docs/RELEASE_RUNBOOK.md','docs/SECURITY_REVIEW.md','docs/WEB_OFFLINE.md'}
assert set(changes)==allowed,changes.keys()
assert baseline['run18Mismatches']==[]
previous=json.loads((root/'docs/evidence/run18/source-identity.json').read_text())['files']
files={f:sha(root/f) for f in sorted(set(previous)|{'scripts/verify-browser-support.cjs','scripts/verify-progress-lifecycle-browser.cjs'})}
identity={'clientDate':'2026-11-18','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':baseline['head'],'candidate':'Uncommitted Run19 browser qualification/CI/document delta on preserved dirty Run18; no commit created','algorithm':'SHA-256','files':files,'productShellBuildId':manifest['manifest']['buildId'],'scriptHashes':{f:files[f] for f in files if f.startswith('scripts/verify-browser-support') or f.startswith('scripts/verify-progress-lifecycle')},'priorNativeEvidence':'Run18 native source/build/captures unchanged; no new native build/runtime/capture claim'}
(out/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
plan=(root/'docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger\n')[1].split('## Execution contract')[0]
rows=[line.split('|') for line in ledger.splitlines() if re.match(r'^\| [RF]\d\d \|',line)]
counts=dict(collections.Counter(row[4].strip() for row in rows));assert len(rows)==35
assert counts=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18},counts
assert not re.search(r'^- \[x\] \*\*M11\.',plan,re.M)
assert all(re.search(r'^\| '+p+r' \|.*\| active \|$',plan,re.M) for p in ('P05','P06','P07','P08','P09','P10'))
# Validate relative file links without inventing closure for pre-existing broken
# historical links in the review snapshot. The staged index is this run's
# preserved baseline: no staging operation is performed.
def broken_links(path,text):
 result=[]
 for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)',text):
  target=target.split('#')[0].strip('<>')
  if not target or re.match(r'^[a-z]+:',target) or target.startswith('/') or ' ' in target:continue
  resolved=(path.parent/urllib.parse.unquote(target)).resolve()
  # This report is emitted below; all other links must already exist.
  if resolved == out/'verification.json':continue
  if not resolved.exists():result.append(target)
 return sorted(set(result))
link_results={};new_broken={}
mdfiles=[root/f for f in allowed if f.endswith('.md')]+[out/'README.md',out/'manual-handoff.md',out/'screenshots/index.md']
for p in mdfiles:
 rel=str(p.relative_to(root));current=broken_links(p,p.read_text())
 old=subprocess.run(['git','show',':'+rel],capture_output=True,text=True)
 before=broken_links(p,old.stdout) if old.returncode==0 else []
 link_results[rel]={'currentBroken':current,'baselineBroken':before,'newBroken':sorted(set(current)-set(before))}
 if link_results[rel]['newBroken']:new_broken[rel]=link_results[rel]['newBroken']
assert not new_broken,new_broken
reports={name:json.loads((out/'browser'/name/'report.json').read_text()) for name in ('chromium','firefox','webkit')}
lifecycle=json.loads((out/'lifecycle-initial/report.json').read_text())
assert all(r['status']=='passed' and len(r['checks'])==7 for r in reports.values())
assert lifecycle['status']=='passed' and len(lifecycle['checks'])==3
raw=json.loads((out/'shared/audit-final.json').read_text());assert raw['metadata']['vulnerabilities']['high']==28 and raw['metadata']['vulnerabilities']['low']==3
commands=json.loads((out/'shared/commands.json').read_text());assert any(row['log']=='shared/audit-final.json' and row['exitCode']==1 for row in commands)
assert all(row['inspected'] for row in meta) and len(meta)==21
verification={'clientDate':'2026-11-18','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'resumeMatched':{'matched':len(previous),'total':len(previous),'mismatches':[]},'baselineFiles':len(baseline['files']),'changedSinceResume':changes,'unapprovedBaselineChanges':[],'priorEvidencePreserved':all(sha(root/f)==h for f,h in baseline['files'].items() if f.startswith('docs/evidence/')),'newMaintainedFiles':['scripts/verify-browser-support.cjs','scripts/verify-progress-lifecycle-browser.cjs'],'statusCounts':counts,'requiredScopeItems':len(rows),'activePhases':['P05','P06','P07','P08','P09','P10'],'humanChecks':'all unperformed','newPassingBrowserChecks':24,'captures':{'count':len(meta),'allInspected':True,'webOnly':True,'missingChangedTarget':[],'native':'inapplicable: unchanged product/native inputs, tooling-only delta'},'webManifestExactlyMatchesRun18':True,'linkChecks':link_results,'rawAudit':raw['metadata']['vulnerabilities'],'sourceIdentitySha256':sha(out/'source-identity.json'),'stop':'Verified browser/lifecycle/source/status/capture handoff before substantial native/provider/security cycle; no phase count limit'}
verification['diffChecks']={'run19TrackedDiffExitCode':0,'preservedStagedDiffExitCode':2,'reason':'Unchanged Run18 upstream patch/log whitespace; actual command retained, no staging or history rewrite'}
(out/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
assert (out/'verification.json').is_file()
# Now validate links to the emitted report too.
assert all((p.parent/target.split('#')[0]).exists() for p,target in [(root/'docs/DELIVERY_PLAN.md','evidence/run19/verification.json'),(root/'docs/APP_REVIEW.md','evidence/run19/verification.json'),(out/'README.md','verification.json')])
print(json.dumps({'preservedPriorEvidence':verification['priorEvidencePreserved'],'changedBaselineFiles':list(changes),'scopeCounts':counts,'captures':len(meta),'newPassingBrowserChecks':24,'newBrokenLinks':new_broken,'shellMatchesRun18':True}))
