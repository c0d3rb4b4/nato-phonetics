"""Identify unchanged products, index actual captures and verify preservation."""
from pathlib import Path
import collections, datetime, hashlib, json, re, subprocess
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[4]
OUT = ROOT / 'docs/evidence/run24'
sha = lambda data: hashlib.sha256(data).hexdigest()
baseline = json.loads((OUT / 'baseline.json').read_text())
modified = []
for name, expected in baseline['files'].items():
    path = ROOT / name
    assert path.is_file(), 'Removed baseline file: ' + name
    if sha(path.read_bytes()) != expected: modified.append(name)
assert all(not name.startswith('docs/evidence/') for name in modified), 'Historical evidence changed'
expected_changes = {'.github/workflows/ci.yml','scripts/verify-web-host.cjs','README.md','docs/APP_REVIEW.md','docs/DELIVERY_PLAN.md','docs/CONVERTER_POLICY.md','docs/LOCAL_PROGRESS.md','docs/RELEASE_RUNBOOK.md','docs/WEB_DISTRIBUTION.md','docs/WEB_OFFLINE.md'}
assert set(modified) == expected_changes, modified
review_before = subprocess.check_output(['git','show',baseline['head']+':docs/APP_REVIEW.md']).decode().split('## Current delivery status')[0]
assert (ROOT/'docs/APP_REVIEW.md').read_text().split('## Current delivery status')[0] == review_before
plan = (ROOT/'docs/DELIVERY_PLAN.md').read_text()
ledger = plan.split('## Complete scope and resolution ledger')[1].split('## Execution contract')[0]
statuses = collections.Counter()
for line in ledger.splitlines():
    if re.match(r'\| [RF]\d\d \|', line): statuses[line.split('|')[4].strip()] += 1
assert dict(statuses) == {'implemented-awaiting-M11':12,'resolved':6,'in-progress':17}, statuses
assert len(re.findall(r'^- \[ \] \*\*M11\.',plan,re.M)) == 7
assert not re.search(r'^- \[x\] \*\*M11\.',plan,re.M)

web = json.loads((OUT/'screenshots/web-metadata.json').read_text())
native = []
for scale in ['default','maximum']:
    for suffix in ['', '-share']:
        manifest = OUT/f'ios/attachments-{scale}{suffix}.json'
        if not manifest.exists(): continue
        for test in json.loads(manifest.read_text()):
            for row in test['attachments']:
                if not row['exportedFileName'].endswith('.png') or '_0_' not in row['suggestedHumanReadableName']: continue
                name = row['suggestedHumanReadableName'].split('_0_')[0]
                file = f'ios/{scale}' + ('-share-' if suffix else '-') + name + '.png'
                assert (OUT/'screenshots'/file).exists()
                native.append(dict(file=file, capturedAt=datetime.datetime.fromtimestamp(row['timestamp'],datetime.timezone.utc).isoformat(),
                    platform='iOS simulator',runtime='iOS26.2',device='iPhone17Pro',viewportPoints=[402,874],dpr=3,
                    theme='light' if scale=='default' else 'dark',textSize='large' if scale=='default' else 'accessibility-extra-extra-extra-large',
                    appCandidate='Run23 Release; all25 installed files match',
                    harnessSource='ios/default-passing-driver.swift' if scale=='default' else 'ios/harness/CaptureUITests.swift',
                    command='xcrun xcresulttool export attachments; exact path/arguments in ios/commands.json',
                    state=name.replace('-',' ')))
assert len(web)==48 and len(native)==11, (len(web),len(native))
rows = web + native
for row in rows:
    row['sha256'] = sha((OUT/'screenshots'/row['file']).read_bytes())
    row['inspection'] = 'Inspected actual image/contact sheet; no blank/loading capture. Natural scrolling/keyboard occlusion retained; no whole accessibility pass.'
(OUT/'screenshots/native-metadata.json').write_text(json.dumps(native,indent=2)+'\n')
(OUT/'screenshots/metadata.json').write_text(json.dumps(rows,indent=2)+'\n')
index = '''# Run24 actual screenshots

19 November 2026. **59 actual final images:48web +11iOS**, inspected with original files preserved. [Exact metadata, dates, hashes and commands](metadata.json), [candidate](../candidate.json), [reports/failures](../README.md).

Web: actual Caddy2.11.9 on macOS, Run23/Run20 production archive, Edge157/Firefox159/Playwright WebKit27.2,1280×900 desktop and320×568 dark mobile-width. Update/truncation/eviction are explicitly labelled real-resource fault fixtures. Native: actually installed Run23 Release, iPhone17Pro/iOS26.2,402×874pt/DPR3, default/light and maximum accessibility/dark. Only the XCTest harness is rebuilt. Copy captures may retain the keyboard and hide lower feedback; successful status/input/clipboard assertions are documented separately. Scrolling naturally clips text at the region boundary.

**Missing:** maximum iOS Share-sheet/cancel capture. Its actual keyboard/35-short-swipe alignment fails before sheet qualification; P06.2/P10.7 stays open. [Actual failed state](../diagnostics/maximum-share/unreachable-Share%20conversion.png), [test](../ios/maximum-share.log). Android captures are inapplicable to this tooling-only/unchanged-product and iOS-only qualification delta; [Run23 actual Android captures](../../run23/screenshots/index.md) retain their scope. Final integrated P10.7 target/state/runtime coverage remains incomplete. No mockups, image generation or other-platform substitution.

Separate failed diagnostics: [WebKit stale-cache failure](../diagnostics/webkit-observed/diagnostics/failure.png), [first-answer save failure](../diagnostics/readonly-webkit-tabs/diagnostics/failure.png), [initial native alignment](../diagnostics/ios-first/unreachable-plain-scroll.png). The second attempt's file named share-sheet is an immediate pre-verification frame from a failed Close-button query, not a qualified system-sheet capture; final actual default sheet below waits for Copy Cell.

| Image | Runtime / appearance | Actual state |
|---|---|---|
'''
for row in web:
    index += f"| [{row['file']}]({row['file']}) | {row['scope']} · {row['browser']} · {row['viewport']['width']}×{row['viewport']['height']} | {row['state']} |\n"
for row in native:
    index += f"| [{row['file']}]({row['file']}) | iOS26.2 · {row['theme']} · {row['textSize']} | {row['state']} |\n"
(OUT/'screenshots/index.md').write_text(index)

archive = ROOT/'artifacts/run23/web/nato-web.tar.gz'
archive_hash=sha(archive.read_bytes())
assert archive_hash=='fe911a9691812e3989e048429e034e1fef5f7ff1e7960d7e4a1c196d7e0e8f96'
assert sha((ROOT/'docs/evidence/run20/hosting/nato-web.tar.gz').read_bytes()) == archive_hash
candidate=dict(date='2026-11-19',baseHead=baseline['head'],workingTree='Run24 tooling/docs plus evidence; no commit made',
    web=dict(archiveSha256=archive_hash,durableArchive='../run20/hosting/nato-web.tar.gz',reports='hosting/summary.json'),
    ios=dict(candidate='../run23/candidate.json',installedIdentity='ios/installed-artifact.json',results='ios/results.json',appRebuilt=False),
    unchanged=['app','src','web worker','fonts','native projects','package/lockfiles','providers','permissions','storage schemas'],
    boundary='Scoped local qualification; strict cleanup, save reliability, maximum Share and inherited gates remain open. No release acceptance.')
maintained={name:sha((ROOT/name).read_bytes()) for name in baseline['files'] if not name.startswith('docs/evidence/')}
source_id=sha(json.dumps(maintained,sort_keys=True,separators=(',',':')).encode())
(OUT/'source-identity.json').write_text(json.dumps(dict(baseHead=baseline['head'],sourceId=source_id,method='SHA256 of sorted maintained path/content hash JSON, excluding evidence',files=maintained),indent=2)+'\n')
candidate['maintainedSourceId']=source_id
(OUT/'candidate.json').write_text(json.dumps(candidate,indent=2)+'\n')

changed_docs=[ROOT/name for name in modified if name.endswith('.md')]
changed_docs += list(OUT.rglob('*.md'))
checked=0;bad=[]
for doc in changed_docs:
    for target in re.findall(r'\]\(([^)]+)\)',doc.read_text()):
        target=target.strip('<>')
        if re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:',target) or target.startswith('#'): continue
        file=unquote(target.split('#')[0])
        if file and not (doc.parent/file).exists() and (doc.parent/file).resolve() != OUT/'verification.json': bad.append(dict(document=str(doc.relative_to(ROOT)),target=target))
        checked+=1
assert not bad,bad
patch=subprocess.check_output(['git','diff','HEAD','--binary','--',*sorted(expected_changes)])
(OUT/'source.patch').write_bytes(patch)
verification=dict(date=datetime.datetime.now(datetime.timezone.utc).isoformat(),baseHead=baseline['head'],sourceId=source_id,
    modifiedMaintainedFiles=sorted(modified),baselineFiles=len(baseline['files']),priorEvidenceUntouched=True,reviewSnapshotPreserved=True,
    productNativeDependencyWorkerProviderPermissionSchemaUnchanged=True,statusCounts=dict(statuses),allManualResultsUnperformed=True,
    sharedTests='151 reused from Run23 at unchanged scope; not newly run',compiledYoga='177 reused at unchanged original scope; not newly run',
    dependencyAudit='Run23 raw0/review0/zero findings reused at unchanged lock; no fresh audit or release acceptance',
    webFinalGroups=36,webNegativeControls=6,nativePassingTests=3,nativeMaximumShare='failed65; missing sheet capture; original failures retained',
    finalCaptures=59,androidCaptures='inapplicable to this unchanged-product/tooling and iOS-only delta',linksChecked=checked,
    sourcePatchSha256=sha(patch),index='Externally staged snapshot preserved; staged/newer working-tree differences reviewed, no index mutation/commit')
(OUT/'verification.json').write_text(json.dumps(verification,indent=2)+'\n')
print(json.dumps(verification,indent=2))
