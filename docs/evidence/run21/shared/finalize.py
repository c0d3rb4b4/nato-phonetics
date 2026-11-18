from pathlib import Path
import json,hashlib,subprocess,datetime,re,collections,shutil
ROOT=Path(__file__).resolve().parents[4];OUT=ROOT/'docs/evidence/run21'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
baseline=json.loads((OUT/'shared/baseline.json').read_text())
allowed={'.github/workflows/ci.yml','README.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/RELEASE_RUNBOOK.md','docs/WEB_DISTRIBUTION.md','docs/WEB_OFFLINE.md','scripts/verify-web-host.cjs'}
changed=[f for f,h in baseline['files'].items() if not (ROOT/f).is_file() or sha(ROOT/f)!=h]
assert set(changed)==allowed,(changed,allowed)
assert all(not f.startswith('docs/evidence/run20/') for f in changed)
review=(ROOT/'docs/APP_REVIEW.md').read_text()
original=subprocess.check_output(['git','show',':docs/APP_REVIEW.md'],cwd=ROOT).decode()
assert review.split('## Current delivery status')[0]==original.split('## Current delivery status')[0]
plan=(ROOT/'docs/DELIVERY_PLAN.md').read_text()
ledger=plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
rows=[line.split('|') for line in ledger.splitlines() if re.match(r'\| [RF]\d{2} \|',line)]
counts=dict(collections.Counter(row[4].strip() for row in rows))
assert len(rows)==35 and counts=={'resolved':5,'implemented-awaiting-M11':12,'in-progress':18},counts
for phase in range(5,11): assert re.search(r'\| P'+str(phase).zfill(2)+r' \|.*\| active \|',plan)
assert all(re.match(r'\| M11\.\d \|[^|]+\| todo \|',line) for line in plan.splitlines() if re.match(r'\| M11\.\d \|',line))
# Metadata/index preserves individual real screenshot identities and commands.
index='''# Run21 actual screenshot index

Captured18 November2026 on macOS26.6.2 (25G83), Caddy2.11.9, Node22.23.0 and isolated Playwright1.65.1.24 final actual screenshots are inspected individually through complete contact sheets;4 diagnostic failure captures are separately inspected. No blank/loading/error overlay or new component clipping observed. Screens are ordinary scrollable viewports; content below the viewport is not asserted visible. The rejected-update capture shows both error guidance and the actual Retry action. No image is generated or substituted for another target.

Product/archive bytes equal Run20. [Candidate](../candidate.json), [source/check scope](../verification.json). Each engine's metadata records exact candidate/archive/shell IDs, capture time, browser/user agent, viewport, actual app background/saved/system appearance and command/arguments. Desktop1280×900 starts Light; actual Settings→Dark is selected before error/wait/rollback scopes. Narrow320×568 is Dark. `tabs` is close-all-app-tabs/1s browser-idle/reopen; cold offline is a new persistent browser process/context after stable rollback, with Caddy stopped. These are scoped host/lifecycle images, not a final integrated P10.7 pass.

| State | Edge157.0.4341.60 | Firefox159.0 | Playwright WebKit27.2 |
|---|---|---|---|
'''
engines=['chromium','firefox','webkit']
metas={e:json.loads((OUT/'screenshots/web'/e/'metadata.json').read_text()) for e in engines}
for i,m in enumerate(metas['chromium']):
 index+='| '+m['state']+' | '+' | '.join('['+e+'](web/'+e+'/'+metas[e][i]['file']+')' for e in engines)+' |\n'
index+='\nMetadata: '+', '.join('['+e+'](web/'+e+'/metadata.json)' for e in engines)+'.\n'
index+='''\nAndroid/iOS screenshots are **inapplicable to this tooling/CI-only delta**: native/app/font/layout/permission/provider bytes are unchanged; Run18/20 captures retain their original scopes. No changed-target capture is missing. Final P10.7 all-target candidate/AT/support matrix remains incomplete; no native test/build/physical acceptance is claimed.

Diagnostic failures stay separate from final results: [initial eviction setup](../diagnostics/chromium-first/failure.png), [wrong HTML identity](../diagnostics/chromium-identity/failure.png), [read-only worker probe](../diagnostics/chromium-worker/failure.png), [WebKit waiting-update process close](../diagnostics/webkit-process-close/failure.png). The first three expose async runner gating, not a product repair. WebKit process-close remains failed/P2/P10; actual progress is visibly retained. [Exact scopes/failures](../README.md).
'''
(OUT/'screenshots/index.md').write_text(index)
records={}
for e in engines:
 report=json.loads((OUT/'hosting'/e/'report.json').read_text())
 assert len(report['checks'])==6 and all(c['passed'] for c in report['checks']) and not report.get('failure')
 assert report['runnerSha256']==sha(ROOT/'scripts/verify-web-host.cjs')
 assert report['originStoppedForOffline'] and report['transitionMode']=='tabs'
 assert [o['controllerIsActive'] for o in report['reopenObservations']]==[True,True]
 for m in metas[e]:
  f=OUT/'screenshots/web'/e/m['file']; assert f.is_file();records[str(f.relative_to(ROOT))]=sha(f)
# Preserve only source identities, not an invented clean revision.
files=subprocess.check_output(['git','ls-files','-co','--exclude-standard','-z'],cwd=ROOT).decode().split('\0')
source={f:sha(ROOT/f) for f in sorted(set(files)) if f and (ROOT/f).is_file() and not f.startswith('docs/evidence/')}
identity={'clientDate':'2026-11-18','at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':baseline['head'],'candidate':'Inherited staged Run20 + Run21 host-tool/CI/docs work; no clean revision/release claim','algorithm':'sha256','files':source}
(OUT/'source-identity.json').write_text(json.dumps(identity,indent=2)+'\n')
cleanup=json.loads((OUT/'shared/cleanup.json').read_text())['removedOwnedGeneratedRuntimeDirectories'] if (OUT/'shared/cleanup.json').exists() else []
for p in sorted((ROOT/'artifacts/run21').rglob('runtime-*')):
 if p.is_dir(): cleanup.append(str(p.relative_to(ROOT)));shutil.rmtree(p)
(OUT/'shared/cleanup.json').write_text(json.dumps({'removedOwnedGeneratedRuntimeDirectories':cleanup,'scope':'Only Run21 temporary browser profiles/extracted fixtures after durable report/capture preservation; prior evidence/user files untouched'},indent=2)+'\n')
verification={'at':datetime.datetime.now(datetime.timezone.utc).isoformat(),'baseHead':baseline['head'],'changedInheritedFiles':changed,'unexpectedChangedOrRemovedBaselineFiles':[],'priorRun20EvidencePreserved':True,'originalReviewBeforeCurrentStatusPreserved':True,'ledgerCount':35,'ledgerStatuses':counts,'phaseStatuses':'P05–P10 active; M11 all todo','productNativeFontsLayoutProviderPermissionsStorageDependenciesLockUnchanged':True,'archiveByteIdenticalToDurableRun20':(ROOT/'artifacts/run21/nato-web.tar.gz').read_bytes()==(ROOT/'docs/evidence/run20/hosting/nato-web.tar.gz').read_bytes(),'newChecks':{'finalScopeGroups':18,'awaitedFalseNegativeControls':3,'productionBuild':'passed','verifiedDeterministicPackage':'passed','types':'passed','lint':'passed','workflowYamlMatrix':'passed','currentDiffWhitespace':'passed','inheritedStagedDiffWhitespace':'failed exit2 on unchanged raw Run20 logs; preserved verbatim'},'notRerun':['fresh locked install','133 shared unit tests','177 compiled Yoga checks','native builds/runtime/all-letter/AT','audit/registry recheck','packaging unit tests (implementation unchanged)'],'reusedScopes':'Prior unchanged qualified evidence retains original scope; Run20 async host-transition preconditions superseded','openFailure':'WebKit27.2 process-close while update waiting; saved answer visible, tab-close scope separately passes','security':'Last actual Run20 audit/review failed28high/3low; no new disposition','screenshots':{'finalInspected':24,'diagnosticInspected':4,'sha256':records,'missingChangedTargetCaptures':[],'nativeInapplicability':'Tooling/CI-only; native/product bytes unchanged','finalP10_7':'unfinished'},'unperformed':['hosted Linux/CI','public HTTPS/host/certificates','branded Safari/iOS/OS/legacy transitions','native P1/P3/recognition/signing/integrated gates','all M11 human acceptance']}
(OUT/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
# Relative document links to real files; ignore generated/example fenced text.
missing=[];checked=0
for f in sorted([ROOT/p for p in allowed if p.endswith('.md')]+list(OUT.rglob('*.md'))):
 text=re.sub(r'```.*?```','',f.read_text(),flags=re.S)
 for target in re.findall(r'\]\(([^)]+)\)',text):
  if target.startswith(('https:','http:','mailto:','#','plugin:')): continue
  clean=target.split('#')[0]
  if not clean: continue
  checked+=1
  if not (f.parent/clean).exists():missing.append({'document':str(f.relative_to(ROOT)),'target':target})
assert not missing,missing
(OUT/'shared/reconciliation.json').write_text(json.dumps({'relativeFileLinksChecked':checked,'missing':missing,'all35LedgerStatusesVerified':True,'phaseManualStatusesVerified':True,'originalReviewPreserved':True,'inheritedSourceAndRun20EvidencePreserved':True},indent=2)+'\n')
print(json.dumps({'changedInheritedFiles':changed,'finalGroups':18,'negativeControls':3,'captures':24,'diagnostics':4,'counts':counts,'relativeLinks':checked,'cleanupDirectories':len(cleanup)}))
