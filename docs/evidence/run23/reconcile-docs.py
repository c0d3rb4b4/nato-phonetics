"""Reconcile current status only after actual native checks/captures succeed."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/evidence/run23'
for mode in ['checks', 'web', 'android-debug', 'android-release', 'ios-simulator']:
    assert json.loads((ROOT / 'artifacts/run23' / mode / 'report.json').read_text())['status'] == 'passed', mode
assert '** TEST SUCCEEDED **' in (OUT / 'ios/smoke.log').read_text()
assert json.loads((OUT / 'ios/installed-artifact.json').read_text())['installedMatchesArchive']
android = json.loads((OUT / 'android/installed-artifact.json').read_text())
assert android['apkSha256'] == android['installedSha256']
assert len(json.loads((OUT / 'android/checks.json').read_text())) == 3
native_shots = json.loads((OUT / 'screenshots/native-metadata.json').read_text())
android_shots = json.loads((OUT / 'screenshots/android/metadata.json').read_text())
web_shots = json.loads((OUT / 'screenshots/web/metadata.json').read_text())
assert len(native_shots) == 3 and len(android_shots) == 3 and len(web_shots) == 2
assert json.loads((OUT / 'shared/audit-after.log').read_text())['metadata']['vulnerabilities']['total'] == 0

summary = ('Run23 upgrades the compatible CLI family20.0.2→20.2.0 and its sole XML parser4.5.7→5.12.1 without overrides. '
           'Fresh locked install,151 shared tests,types/lint/Expo-free graph,actual CLI/XML/bounded malformed-input checks,production browser and direct local APK/AAB/unsigned iOS simulator builds pass in recorded scopes. '
           'Raw npm audit and review both exit0 with zero findings; R08 resolves its automated dependency scope without a waiver. '
           'All35 remain required:17in-progress/12implemented-awaiting-M11/6resolved. No whole phase closes; P05–P10 stay active and every M11 result is unperformed. '
           '[Evidence](evidence/run23/README.md), [actual captures](evidence/run23/screenshots/index.md).')
plan_file = ROOT / 'docs/DELIVERY_PLAN.md'
plan = plan_file.read_text()
lines = plan.splitlines()
lines = ['**Current state:** ' + summary if line.startswith('**Current state:**') else line for line in lines]
lines = ['**Run23 update — 19 November 2026:** ' + summary + ' Run22 local shared-host qualification remains delivered; actual remote execution is still open with no established runner. Android live sizing remains failed3/4 with no framework repair. WebKit waiting-update process-close, original iOS gestures/max navigation and strict P3 ink retain their recorded failures.' if line.startswith('**Run22 update —') else line for line in lines]
for index, line in enumerate(lines):
    if line.startswith('| R08 |'):
        lines[index] = line.replace('| in-progress |', '| resolved |', 1)[:-1] + ' **Run23 current:** compatible CLI20.2.0 resolves patched parser5.12.1; fresh install,151 tests,real XML/CLI/native build and installed smoke scopes pass. Raw audit/review0 with zero findings; no waiver/manual risk acceptance required for this dependency finding. Final integrated release/M11 remains pending. [Evidence](evidence/run23/README.md). |'
    elif line.startswith('| R14 |') or line.startswith('| R20 |'):
        lines[index] = line[:-1] + ' Run23 adds actual compatible CLI/parser,151-test,locked install/Pods,native artifact/installed smoke and production-browser assurance; hosted/remote/final integrated acceptance remains unrun. [Evidence](evidence/run23/README.md). |'
    elif line.startswith('| R08/P10 matcher / low XML-parser chain |'):
        lines[index] = '| R08/P10 advisory maintenance | **Run23 dependency repair delivered; current raw/review0, zero findings** | Pre-release/new-advisory or changed-exposure review; historical matcher behavior is not package-repaired | CLI20.2.0 uses patched XML parser5.12.1 through upstream ranges; fresh install,actual XML/CLI/native scopes qualify. [Assessment](evidence/run23/shared/lock-review.json), [current review](SECURITY_REVIEW.md#run23--compatible-cli-and-xml-parser-remediation). Prior matcher timeout/withdrawal and failed audits stay historical. | Re-enter on new advisory/severity/untrusted XML or glob exposure/tooling changes; re-audit before release. No suppression, risk waiver or M11 acceptance. |'
    elif line.startswith('- [ ] **P10.5**'):
        lines[index] += ' Run23 fresh locked install/Pods,151 tests,CLI/XML/bounded parser regressions,types/lint/Expo-free graph,production browser and direct local Android Debug/Release/iOS simulator plus installed smoke pass. Raw audit/review now0/zero findings after an actual compatible CLI/parser repair. This closes R08 automated dependency scope, not P10.5 final integrated/native/provider/support acceptance. [Evidence](evidence/run23/README.md).'
    elif line.startswith('- [ ] **P10.7**'):
        lines[index] += ' Run23 adds8 inspected actual captures (2web/3Android/3iOS), identified local native products and exact typed-input/Menu/reference checks. No changed-target capture is missing; final integrated matrix remains incomplete. [Index](evidence/run23/screenshots/index.md).'
plan = '\n'.join(lines) + '\n'
old = 'Run22 R08 review now passes with0high/critical after registry withdrawal propagation; raw audit remains1/7low, with P2 CLI/parser applicability/compatibility follow-up and re-entry on changed exposure/advisory. No package repair or owner risk acceptance.'
assert old in plan
plan = plan.replace(old, 'Run23 compatible CLI/parser repair now passes raw audit/review0 with zero findings and actual affected native/tooling checks; R08 resolves its dependency scope. Historical matcher behavior/withdrawal is not a package repair; re-enter on new advisory/exposure/tooling changes and before release. No owner risk acceptance.')
start = plan.index('**Current maintenance:**')
end = plan.index('\n', start)
plan = plan[:start] + '**Current maintenance:** historical P02 foundation completion is retained. Run17 Metro/image-size remediation and Run23 compatible CLI/parser remediation now pass actual raw audit/review0 with zero findings; R08 resolves its automated scope. Prior failed audits remain historical. P10.5 final integrated and M11 acceptance remain unfinished. [Evidence](evidence/run23/README.md).' + plan[end:]
manual = '**Run23 prepared supplement:** [candidate-specific human-only handoff](evidence/run23/manual-handoff.md); all M11 results remain unperformed. No new local prerequisite or advisory waiver; native/remote/provider/support work stays engineering.\n\n'
plan = plan.replace('### Checkpoint B: one integrated manual acceptance pass', manual + '### Checkpoint B: one integrated manual acceptance pass', 1)
row = '| Run23 · 2026-11-19 | R08/P10.5 M compatible CLI/parser upgrade,then real native/tooling assurance after reforecast | CLI20.2.0/parser5.12.1,151 shared tests,locked npm/Pods,actual CLI/XML/production browser and local native builds/installed smoke pass; raw/review0/zero findings. R08 resolved; no phase closes. [Evidence](evidence/run23/README.md), [8 actual captures](evidence/run23/screenshots/index.md). | All M11 unperformed; prior Android/iOS/WebKit/P3 failures and remote/recognition/signing/public-host/integrated gates remain open. Initial test/Pods/source-map hypotheses and correction records retained. | Next P1 Android native owner/context/cache regression/repair; P2 remote qualification when a host exists or separately forecast recognition. Stop at verified dependency/build/capture/source/status handoff before substantial framework/provider/remote integration; no fixed phase count. |\n\n'
plan = plan.replace('For each implementation run, include:', row + 'For each implementation run, include:', 1)
plan += '''
## Run23 — 19 November 2026

**Resume/forecast:** clean `73b57e2`; no applicable AGENTS.md. Plan/review/evidence reconcile; README's stale Run20/21 security snapshot is corrected. Select R08/P10.5 P2 CLI/parser follow-up M/moderate tooling risk, a concrete upstream-compatible candidate. P05.2 stays P1: Run22 did not establish a native patch and its full context/owner/cache/source/ABI/caret/tile cycle is L/high uncertainty; no repeated hooks or failed flag/root hypothesis. Actual remote work needs an established host. [Forecast/checkpoints](evidence/run23/shared/forecast.md).

**Delivered/verified:** pin all three direct CLI packages20.2.0; thirteen CLI-family entries update together, with parser5.12.1 through upstream ranges and no override/RN/Metro/provider upgrade. Complete60-record lock delta reviewed. Native project/autolink output is exactly equal; actual Apple workspace discovery passes. Four meaningful maintained XML regressions cover repository/array/attribute/workspace behavior and a bounded malformed stop-node corpus through both resolved consumers. Old4.5.7's400k-fragment diagnostic times out; patched5.12.1 throws within the bound. This is a scoped corpus, not comprehensive fuzzing. Fresh npm ci/locked Pods,151 tests,types/lint/791-package Expo-free graph and production browser pass. Raw audit/review exit0 with zero findings; R08 resolves, without risk waiver or M11 acceptance. [Assessment](evidence/run23/shared/lock-review.json), [real parser results](evidence/run23/shared/parser-results.json), [commands/reports](evidence/run23/README.md).

**Native/captures:** actual local Debug APK,all-four-ABI unsigned Release AAB and unsigned iOS simulator builds pass. Retrieved/installed artifacts match recorded identities; all eight Android framework hashes equal Run22. Installed default-scale input/Menu retention/reference/digit scopes pass; iOS typed input uses individual real keys. Eight actual web/Android/iOS images are inspected. Web archive is exactly Run20/21/22; app/native/font/layout/provider/permissions/schema source is unchanged. No changed-target capture is missing, no new full native/AT/runtime/raster pass is claimed. [Candidate](evidence/run23/candidate.json), [index](evidence/run23/screenshots/index.md).

**Failures/reforecast:** initial two XML tests incorrectly expect numeric-reference decoding; exact old/current defaults agree, and corrected tests pass. First Pods command selects absent vendor/bundle and exits127; existing Ruby33 environment retry passes. Byte-identical consumer hypothesis fails only on sourceMappingURL trailer; exact bodies agree. A first diagnostic-result/command filename collision is repaired with distinct durable files and an explicit rerun. Original failures remain recorded. Clean install/Pods source timestamps expand the iOS rebuild beyond cached timing; measured capacity permits the actual serial standard builds. No general framework-build capacity guarantee. [Limits/corrections](evidence/run23/README.md).

**Status/stop:** all35 required:17in-progress/12implemented-awaiting-M11/6resolved; P05–P10 active, no whole phase closes. Every M11 result unperformed; [human supplement](evidence/run23/manual-handoff.md). Android live sizing3/4, original iOS gesture/max navigation, WebKit process-close, strict P3 ink, recognition/remote/public HTTPS/signing/support/integrated gates remain open. Next P1 causal Android regression/repair; independent P2 remote qualification when a host exists or separately forecast P09 implementation. Stop after the verified dependency/native/capture/source/status handoff: the next framework/provider cycle adds substantial implementation and fresh verification. No preset phase count, publication, support exception or release acceptance.
'''
plan_file.write_text(plan)

review_file = ROOT / 'docs/APP_REVIEW.md'
review = review_file.read_text().split('## Current delivery status')[0]
review += '''## Current delivery status

**Updated:** 19 November 2026 — Run23 compatible CLI/XML-parser remediation and affected build qualification. Original review snapshot/findings above are preserved; [the ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger) owns current status.

- **Scope/status:** All35 remain required:0open/17in-progress/12implemented-awaiting-M11/6resolved/0blocked/0scope changes. **R08 resolves its automated dependency scope.** P05–P10 stay active; no whole phase closes and every M11 result is unperformed.
- **Delivered:** three direct CLI pins20.0.2→20.2.0 and thirteen CLI-family updates resolve the sole XML parser4.5.7→5.12.1 through upstream ranges. Full lock delta reviewed; no override/RN/Metro/provider/app/permission/schema change. New maintained XML compatibility and bounded malformed-input regressions join existing CI tests. [Changes/assessment](evidence/run23/README.md), [lock review](evidence/run23/shared/lock-review.json).
- **Actual checks:** fresh npm ci/locked Pods,151 shared tests,types/lint/791-package Expo-free graph,exact CLI/autolink equality,real Apple workspace discovery,production browser and direct local APK/AAB/unsigned iOS simulator builds pass in recorded scopes. Retrieved/installed artifacts match; scoped real input/Menu/reference/digit smoke passes. **Raw audit and review both exit0 with zero findings**, an actual compatible parser repair. Prior matcher withdrawal/backtracking is not a package repair or waiver. [Reports/candidate](evidence/run23/candidate.json), [security scope](SECURITY_REVIEW.md#run23--compatible-cli-and-xml-parser-remediation).
- **Captures/reuse:** [8 actual inspected web/Android/iOS captures](evidence/run23/screenshots/index.md), with source/artifact/runtime metadata. Production web archive equals Run20/21/22; all eight Android framework-library hashes equal Run22. Qualified unchanged Run21 host scopes and previous renderer/native tests retain their original limits; no new full native/AT/runtime/raster or final P10.7 pass.
- **Failures/limits:** initial numeric-entity expectations,absent-bundle Pods setup,source-map-only hash hypothesis and diagnostic filename correction are retained separately from final passes. Android live ordinary text still fails3/4 with no context/owner/cache repair. Original iOS gestures/max navigation,WebKit waiting-update process-close and strict P3 ink failures remain open. [Corrections/remaining gates](evidence/run23/README.md).
- **Remote/manual/next:** P10.8 local shared path remains delivered; no actual remote host/runner qualification. Signing,public HTTPS,recognition/provider/AT/release and integrated gates remain unfinished. Every human result stays unperformed in [M11](evidence/run23/manual-handoff.md). Next P1 Android causal native regression/repair; P2 remote completion when a suitable host exists or separately forecast P09 integration. Re-enter security on new advisory/exposure/tooling and before release. Stop at the verified dependency/native/capture/source/status handoff before a substantial framework/provider cycle. [Execution record](DELIVERY_PLAN.md#run23--19-november-2026).
'''
review_file.write_text(review)

readme_file = ROOT / 'README.md'
readme = readme_file.read_text()
readme = readme.replace('Current audit/review still fail28 high/3 low.', 'Run23 raw audit and review pass with zero findings after a compatible CLI/parser upgrade.')
old = 'The current audit still reports 28 high/3 low affected package entries; picomatch has no selected repair or new disposition, so the security gate remains failed.'
assert old in readme
readme = readme.replace(old, 'Run23 upgrades the CLI family to20.2.0 and resolves patched fast-xml-parser5.12.1 through its upstream ranges; clean installation,151 tests,actual CLI/XML/native scopes and raw audit/review0 with zero findings qualify this dependency repair. Historical withdrawn matcher backtracking is not a package repair. [Current evidence](docs/evidence/run23/README.md).')
readme = readme.replace('[Current evidence](docs/evidence/run21/README.md), [actual screenshots](docs/evidence/run21/screenshots/index.md)', 'Run22 adds shared local/Actions host execution (remote qualification remains open). Run23 delivers the compatible CLI/parser security repair and actual affected native/build verification. [Current evidence](docs/evidence/run23/README.md), [actual screenshots](docs/evidence/run23/screenshots/index.md)', 1)
readme_file.write_text(readme)

native_file = ROOT / 'docs/NATIVE_BUILDS.md'
native = native_file.read_text().replace('| React Native / community CLI | `0.81.5` / `20.0.2` |', '| React Native / community CLI | `0.81.5` / `20.2.0` (Run23 qualified) |')
native += '''
## Run23 — compatible CLI/parser qualification

All three direct CLI packages are pinned to20.2.0; the CLI family uses patched fast-xml-parser5.12.1 through its upstream range. RN0.81.5/Metro0.83.8/native provider/Pod lock/project/permissions stay unchanged. The [upstream CLI20/RN0.81 compatibility table](https://github.com/react-native-community/cli/blob/v20.2.0/packages/cli/README.md#compatibility) supplies the candidate family; actual repository qualification is [Run23](evidence/run23/README.md), not inferred from that table. Source-map comments differ; the two CLI XML consumer bodies/config/autolink output remain equal. XML array/attribute/workspace and bounded malformed-stop-node checks run in `npm test`.

Fresh locked npm and Pods installation,151 tests/types/lint/Expo-free graph,real workspace discovery and local Android Debug/four-ABI unsigned Release/unsigned iOS simulator builds pass. Retrieved/installed default-scale converter/Menu/reference scopes and actual captures are [identified](evidence/run23/candidate.json). Raw audit/review now pass0 with zero findings. The first Pods command failed because vendor/bundle is absent on this host; select the existing Ruby33 gem environment rather than setting BUNDLE_PATH to a nonexistent directory. The successful locked retry changes no Pod lock or native project. Clean installation refreshes native-source timestamps and can require a longer recompilation than a cached build.

All eight Android framework-library hashes match Run22; no Android live-sizing fix is implied. Existing guarded speech/Yoga patches still apply after npm ci. Final native/physical/runtime/provider/signing/remote/integrated gates remain unfinished. Standard build entry points and publication boundaries are unchanged; no Expo/EAS path is introduced.
'''
native_file.write_text(native)
print('Current plan/ledger/review/README/build guide reconciled after actual native/capture gates.')

