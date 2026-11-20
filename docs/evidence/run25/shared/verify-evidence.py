from pathlib import Path
import json,hashlib,subprocess,datetime,re,collections,urllib.parse
root=Path.cwd();evidence=Path('docs/evidence/run25');baseline=json.loads(Path('artifacts/run25/baseline.json').read_text())
sha=lambda p:hashlib.sha256(Path(p).read_bytes()).hexdigest()
head=subprocess.check_output(['git','rev-parse','HEAD']).decode().strip();assert head==baseline['baseHead']
changed=[p for p,h in baseline['files'].items() if not Path(p).is_file() or sha(p)!=h]
expected={'.github/workflows/ci.yml','README.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/LOCAL_PROGRESS.md','docs/RELEASE_RUNBOOK.md','docs/WEB_DISTRIBUTION.md','scripts/verify-web-host.cjs'}
assert set(changed)==expected,(set(changed)-expected,expected-set(changed))
assert not any(p.startswith('docs/evidence/') for p in changed)
review=Path('docs/APP_REVIEW.md').read_text();original=subprocess.check_output(['git','show','HEAD:docs/APP_REVIEW.md']).decode()
assert review.split('## Current delivery status')[0]==original.split('## Current delivery status')[0]
plan=Path('docs/DELIVERY_PLAN.md').read_text();ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
rows=[line.split('|') for line in ledger.splitlines() if re.match(r'^\| (?:R\d{2}|F\d{2}) \|',line)]
assert len(rows)==35
counts=collections.Counter(row[4].strip() for row in rows);assert dict(counts)=={'resolved':6,'implemented-awaiting-M11':12,'in-progress':17},counts
manual=plan.split('## M11 —')[1].split('## Complete scope')[0];assert not re.search(r'^- \[x\]',manual,re.M)
assert subprocess.check_output(['git','diff','--cached','--name-only']).decode()==''
product=['src/','app/','web/','android/','ios/','assets/','package.json','package-lock.json']
assert not any(any(p.startswith(prefix) for prefix in product) for p in changed)
newcode=['scripts/progress-observation.cjs','scripts/verify-progress-recovery-browser.cjs']
maintained=sorted(expected|set(newcode));source={p:sha(p) for p in maintained}
patch=subprocess.check_output(['git','diff','--binary','HEAD','--',*sorted(expected)])
for p in newcode:
 result=subprocess.run(['git','diff','--no-index','--binary','--','/dev/null',p],capture_output=True);assert result.returncode==1;patch+=result.stdout
(evidence/'source.patch').write_bytes(patch)
# Check local Markdown file targets; remote URLs and anchor-only links excluded.
markdown=[Path(p) for p in changed if p.endswith('.md')]+list(evidence.rglob('*.md'))
links=0;missing=[]
for p in markdown:
 for match in re.finditer(r'\[[^\]]*\]\(([^\n]+?)\)',p.read_text()):
  target=match.group(1).strip().strip('<>');parsed=urllib.parse.urlsplit(target)
  if parsed.scheme or target.startswith('#'):continue
  file=urllib.parse.unquote(target.split('#')[0])
  if not file:continue
  if not (p.parent/file).exists():missing.append({'source':str(p),'target':target})
  links+=1
assert not missing,missing
metadata=json.loads((evidence/'screenshots/metadata.json').read_text());assert len(metadata)==30
for m in metadata:assert sha(evidence/'screenshots'/m['file'])==m['sha256']
recovery=[]
qualified=sha(evidence/'shared/qualified-progress-observation.cjs')
for engine in ['chromium','firefox','webkit']:
 report=json.loads((evidence/'recovery'/engine/'report.json').read_text());assert report['status']=='passed';assert len(report['checks'])==6
 assert report['observerSha256']==qualified;assert report['runnerSha256']==sha('scripts/verify-progress-recovery-browser.cjs')
 for c in report['checks']:assert c['status']=='passed'
 recovery.append({'engine':engine,'scenarios':6,'captures':len(report['captures']),'browser':report['browser']})
host=json.loads((evidence/'diagnostics/host-webkit-tabs/report.json').read_text());assert len(host['checks'])==2 and 'failure' in host
assert host['runnerSha256']==sha('scripts/verify-web-host.cjs') and host['progressObserverSha256']==qualified
assert host['firstAnswer']['data']['total']==1 and not host['firstAnswer']['locks']['held'] and not host['firstAnswer']['locks']['pending']
assert host['failure']['state']['controllerIsActive'] and not host['failure']['state']['waiting'] and not host['failure']['state']['installing']
archive=json.loads((evidence/'candidate.json').read_text());assert sha(archive['archive'])==archive['archiveSha256']
for p,v in archive['release']['files'].items():assert sha(Path('artifacts/run25/candidate')/p)==v['sha256']
# The completed runtime results identify the earlier valid-row observer; final
# defensive summary change was separately exercised by three real probes.
assert len(list((evidence/'diagnostics').rglob('*.png')))==6
assert sha(evidence/'shared/final-progress-observation.cjs')==sha('scripts/progress-observation.cjs')
command_records=json.loads((evidence/'shared/commands.json').read_text())
assert all(next(c for c in command_records if Path(c['log']).name==name)['exitCode']==0 for name in ['lint-handoff.log','workflow.log','observer-contract.log'])
result={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':head,'initialWorkingTree':baseline['status'],'baselineFiles':len(baseline['files']),'modifiedMaintainedFiles':maintained,'sourceFilesSha256':source,'sourceId':hashlib.sha256(json.dumps(source,sort_keys=True).encode()).hexdigest(),'sourcePatchSha256':hashlib.sha256(patch).hexdigest(),'priorEvidenceUntouched':True,'reviewSnapshotPreserved':True,'indexUnchangedEmpty':True,'productNativeDependencyWorkerProviderPermissionSchemaUnchanged':True,'statusCounts':dict(counts),'requiredItems':35,'allManualResultsUnperformed':True,'phases':'P05–P10 active; no phase closes','recovery':recovery,'observerContractProbes':3,'hostCommand':'failed1;2HTTP/resource groups and observed first-save boundary qualified; rejected-update feedback fails; later update/rollback/repair/offline unrun','initialObserverCommand':'failed1 after2ordinary scopes; original observer/runner/report retained','finalCaptures':30,'separateDiagnosticImages':6,'nativeCaptures':'inapplicable to browser-tooling/CI-only delta; prior native scopes retained; final P10.7 remains unfinished','linksChecked':links,'maintainedLint':'passed0warnings','workflowGate':'local matrix/nonzero/always-upload assertions pass; hosted Linux unrun','reuse':'151shared tests/177compiledYoga/Run23directbuilds/rawaudit0/review0 reused at unchanged scope, not newly run','runtimeObserverSha256':qualified,'finalObserverSha256':source['scripts/progress-observation.cjs'],'finalObserverDelta':'defensive malformed-row diagnostic summary only;3real-browser contract probes pass; valid-record recovery assertions/production bytes unchanged','noCommitOrPublication':True}
(evidence/'verification.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'verified':True,'priorEvidenceFilesPreserved':sum(p.startswith('docs/evidence/') for p in baseline['files']),'statusCounts':dict(counts),'linksChecked':links,'recoveryScenarios':18,'finalScreenshots':30,'diagnosticImages':6,'sourceId':result['sourceId']},indent=2))
