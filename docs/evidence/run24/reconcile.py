"""Reconcile recorded, scoped Run24 results without closing inherited gates."""
from pathlib import Path
import json, re

ROOT = Path(__file__).resolve().parents[3]
OUT = ROOT / 'docs/evidence/run24'
native = json.loads((OUT / 'ios/results.json').read_text())
maximum = next((row for row in native if row['size'].startswith('accessibility')), None)
assert native[0]['exactClipboardMatch'] and native[0]['shareAndCancel']
assert maximum and maximum['exactClipboardMatch'] and maximum['shareAndCancel'] is False
native_scope = 'default/light and maximum accessibility/dark'
native_text = f'iOS26.2 Release passes3 standalone XCTest scopes: long Copy/inner scrolling/Menu at {native_scope}, plus actual Share-sheet opening/cancellation at default size. Both sizes retain2,001 input characters after real2,000-character Paste plus j and match the exact10,123-byte clipboard. Maximum/keyboard Share fails its35-short-swipe alignment bound; that sheet capture is missing and stays P06.2/P10.7 engineering. All25 installed app files match Run23; no application rebuild or physical/AT/receiving-app pass.'

summary = f'Run24 adds non-creating worker/controller/HTML observations and explicit CI tab/process selection. Six final three-engine transition scopes pass36groups plus6 negative controls. {native_text} WebKit cleanup remains failed in separate reproductions; one first-answer save fails with visible pending/Retry and its serial comparison passes. Product/worker/native/dependency bytes remain unchanged; Run23 security/build scopes retain their limits. All35 required:17in-progress/12implemented-awaiting-M11/6resolved; P05–P10 active, every M11 result unperformed.'

plan_file = ROOT / 'docs/DELIVERY_PLAN.md'
plan = plan_file.read_text()
plan = re.sub(r'^\*\*Current state:\*\* .*$', '**Current state:** ' + summary + ' [Evidence](evidence/run24/README.md), [actual captures](evidence/run24/screenshots/index.md).', plan, count=1, flags=re.M)
plan = re.sub(r'^\*\*Run23 update — 19 November 2026:\*\* .*$', '**Run24 update — 19 November 2026:** ' + summary + ' Next P1 causal Android native regression/repair; P2 progress-save exception/Retry discrimination and remote qualification when a suitable host exists. Recognition retains its own M–L forecast. [Evidence](evidence/run24/README.md).', plan, count=1, flags=re.M)
old = next(line for line in plan.splitlines() if line.startswith('| P10.4/.5 / WebKit waiting-update process close |'))
new = '| P10.4/.5 / WebKit waiting-update process close | **P2 cleanup assurance active; strict failures retained** | Sole-cache cleanup/release qualification; observed served-forward scope passes, independent work eligible | Run24 reproduces exact forward HTML with controller===active/no waiting or installing worker while both complete caches remain beyond15s. Original unchanged runner fails too; six final tab/process scopes pass separately, no product repair. [Observed failure](evidence/run24/diagnostics/webkit-observed/report.json), [final scopes](evidence/run24/hosting/summary.json). | Relevant worker/browser/lifecycle change or pre-release: distinguish interrupted activation cleanup/persistence with exact bytes. Retain strict red and bounded investigation; no target exception or human prerequisite. |'
plan = plan.replace(old, new)
plan = plan.replace(new, '| P06.2/P10.7 / maximum iOS keyboard Share | **P2 engineering; final driver fails** | Maximum Share/sheet-capture qualification; separate Copy/default Share passes retain scope | Run24 iOS26.2 Release, maximum/dark,2,001-character draft and keyboard:35short swipes fail alignment before a verified sheet. No ordinary-user reach/cause or original-drag repair established. Copy/scroll/Menu/exact clipboard passes separately; default Share/cancel passes. [Failure](evidence/run24/ios/maximum-share.log), [actual capture](evidence/run24/diagnostics/maximum-share/unreachable-Share%20conversion.png). | Next S–M bounded scroll-offset/keyboard viewport/hit-target correlation; then choose driver/product repair. Re-enter on native/input/runtime changes or pre-release qualification. Missing maximum sheet stays P06.2/P10.7 engineering, not M11. |\n' + new, 1)
new_row = '| P08.3/P10 / WebKit first-answer save | **P2 observed failure; cause/reach unknown** | Affected save/recovery assurance; no demonstrated saved-record loss | Run24 first pointer answer remains visibly pending with Retry before update checks; serial fresh-profile comparison passes. Pending answer would be lost on close. [Failure](evidence/run24/diagnostics/readonly-webkit-tabs/report.json), [triage](LOCAL_PROGRESS.md#run24--observed-first-answer-save-failure). | Reproduce with lock/storage exception and pending generation, then actual Retry/exactly-once save; browser/storage/lifecycle change or pre-release. Promote repeatable ordinary loss/silent success. Keep original red; concurrent load is not an established cause. |\n'
plan = plan.replace('| P10.8 / GitHub and reusable remote-host build execution |', new_row + '| P10.8 / GitHub and reusable remote-host build execution |', 1)

task_additions = {
 'P05.2': 'Run24 adds scoped installed iOS large-export readability/input/short-gesture evidence through maximum native text; original long-drag/max progress navigation and Android live text stay failed/open. [Scope](evidence/run24/README.md).',
 'P06.2': 'Run24 qualifies exact long iOS clipboard bytes, nested plain-text interior, Menu/Back at default/light and maximum/dark, plus actual long-output default Share/cancellation at default size; maximum/keyboard Share fails its alignment bound on the unchanged Run23 Release app. [Results](evidence/run24/ios/results.json), [captures](evidence/run24/screenshots/index.md). Original long-drag P1, Android live sizing, physical receiving-app/AT/integrated gates keep this unchecked.',
 'P10.5': 'Run24 final runner/CI choice/default/failure/artifact checks and lint pass;6 final real engine/transition scopes pass36groups and6 negative controls, plus3 passing actual iOS export tests/exact OS clipboard comparisons; maximum Share test fails. Separate cleanup/save/driver failures remain red.151 shared tests/compiled Yoga/audit/native builds reused unchanged at Run23/original scopes, not newly run; no final integrated pass. [Evidence](evidence/run24/README.md).',
 'P10.7': 'Run24 adds48 actual final web and11 installed iOS captures, with separate failed diagnostics and source/artifact/runtime metadata. Android captures are inapplicable to the unchanged-product/tooling and iOS-only qualification delta; Run23 Android captures retained. Maximum iOS Share-sheet capture missing at the failed35-swipe/keyboard alignment; no final integrated capture completion. [Index](evidence/run24/screenshots/index.md).',
}
lines = plan.splitlines()
for task, addition in task_additions.items():
    index = next(i for i, line in enumerate(lines) if re.match(r'- \[[ x]\] \*\*' + re.escape(task) + r'\*\*', line))
    lines[index] += ' ' + addition
plan = '\n'.join(lines) + '\n'
ledger_additions = {
 'R06': 'Run24 scoped maximum iOS export/input/inner scrolling passes; no whole accessibility/AT or Android acceptance. [Evidence](evidence/run24/README.md).',
 'R07': 'Run24 reaches native iOS long-output Copy at maximum and Share at default through short swipes; maximum/keyboard Share fails its alignment bound. Inherited original gesture/navigation/Android gates stay open. [Scope](evidence/run24/README.md).',
 'R14': 'Run24 adds explicit CI tabs/process dispatch, unique artifacts and non-creating actual controller/HTML diagnostics; local6 transition scopes pass, hosted execution unrun. [Evidence](evidence/run24/README.md).',
 'R20': 'Run24 synchronizes host transition/CI, native export evidence and residual support/runbook documentation. [Current scope](evidence/run24/README.md).',
 'F02': 'Run24 verifies exact10,123-byte iOS clipboard equality from2,001 input characters, inner scrolling/Menu at default/maximum text and actual Share/cancel at default; maximum Share stays failed; physical receiving apps and inherited native gates stay open. [Results](evidence/run24/ios/results.json).',
 'F07': 'Run24 separately observes first-answer save failure with pending/Retry; serial comparison passes, no cause/repair. [Failure/next](LOCAL_PROGRESS.md#run24--observed-first-answer-save-failure).',
 'F10': 'Run24 adds6 final tab/process scopes with36 passing groups; reproduced WebKit stale-cache cleanup failure and one visible pending-save failure remain. No worker repair/hosted/branded/integrated pass. [Evidence](evidence/run24/README.md).',
}
start = plan.index('## Complete scope and resolution ledger')
end = plan.index('## Execution contract', start)
ledger = plan[start:end]
for item, addition in ledger_additions.items():
    old = next(line for line in ledger.splitlines() if line.startswith('| ' + item + ' |'))
    ledger = ledger.replace(old, old[:-1].rstrip() + ' ' + addition + ' |')
plan = plan[:start] + ledger + plan[end:]
for manual in ['M11.4', 'M11.5', 'M11.6', 'M11.7']:
    old = next(line for line in plan.splitlines() if line.startswith('| ' + manual + ' |'))
    cells = old.split('|')
    cells[4] += ' Run24 [human-only supplement](evidence/run24/manual-handoff.md) adds current export/browser scopes; every human result remains unperformed. '
    plan = plan.replace(old, '|'.join(cells))
record_row = '| Run24 · 2026-11-19 | P10.4/.5 M bounded WebKit discrimination/runner/CI, then P06.2 S–M iOS export qualification after reforecast |36 final host groups/6 negative controls,3 passing actual iOS export tests/exact clipboard comparisons; maximum Share failed, lint/workflow checks and59 inspected final captures. [Evidence](evidence/run24/README.md), [index](evidence/run24/screenshots/index.md). No phase closes. | Original/observed cleanup failure, first-answer save failure and native driver failures retained; all M11 unperformed. Product/dependencies unchanged; prior151/shared/build/audit scopes reused honestly. | Next P1 Android native regression/repair, P2 save exception/Retry or remote host qualification. Stop at verified scopes/captures/status/source handoff before substantial framework/provider/new-cause cycles; no fixed phase count. |\n\n'
plan = plan.replace('For each implementation run, include:', record_row + 'For each implementation run, include:', 1)
plan += f'''\n## Run24 — 19 November 2026

**Resume/forecast:** clean b551420; plan/review/Run23 agree. No applicable AGENTS.md. Select bounded P2 WebKit process-close discrimination/runner/CI, M; P1 Android remains failed3/4 and requires a distinct L/high-uncertainty native regression/source/ABI/state cycle. No established remote host; do not repeat delivered local builds. Reforecast into unfinished P06.2 iOS export, S–M, after the diagnostic. [Checkpoints](evidence/run24/shared/forecast.md).

**Delivered/verified:** maintained snapshots distinguish active/controller/served HTML from caches, use non-creating reads and preserve all original strict gates. CI selects tabs/default or explicit process with independent engines, distinct artifacts and retained failures. Six final local scopes pass36groups plus6 false-async controls; lint/workflow checks pass. {native_text} [Reports/results](evidence/run24/README.md).

**Failures/limits:** observed and original-control WebKit process checks retain strict cache failures; exact forward HTML/controller pass in the observed failure, no cleanup cause/repair. One first-answer save fails visibly with pending/Retry; serial comparison passes, cause/reach unestablished. Three relocated-control setup failures, initial iOS wrapper alignment, wrong Close-button assumption and offscreen maximum output precondition stay separate from final passes. Actual measured regions/known Copy-cell/short-swipes repair the drivers, with no product fix or original-gesture pass. Snapshot review replaces caches.open with non-creating match; exact earlier versions are retained. [Failures/triage](evidence/run24/README.md).

**Identity/captures/status:** exact Run23/Run20 web archive and all25 installed iOS files match; product/worker/fonts/native/dependencies/provider/permission/schema bytes unchanged. Reuse151 shared tests, compiled Yoga and Run23 build/audit scopes; no fresh install/audit/native app build/AT/runtime/raster claim.59 actual final web/iOS captures inspected; maximum Share sheet remains missing at its exact failed driver bound; Android inapplicable to this delta, prior captures retained, final P10.7 matrix open. Index was staged externally during the run; preserve it and review both staged/newer working-tree files. [Source/preservation](evidence/run24/verification.json), [captures](evidence/run24/screenshots/index.md).

**Handoff/stop:** all35 required,17in-progress/12implemented-awaiting-M11/6resolved; P05–P10 active, every human result unperformed. [M11 supplement](evidence/run24/manual-handoff.md). Next P1 causal Android regression/repair; P2 save exception/Retry discrimination, remote qualification when a host exists or separately forecast recognition. Original iOS gestures/max progress, strict P3 ink, WebKit cleanup, provider/signing/public-host/support/integrated gates remain open. Stop after concrete verification/capture/source/status handoff; remaining framework/provider/new-cause cycles are substantial and no preset phase count determined the batch.
'''
plan_file.write_text(plan)

review_file = ROOT / 'docs/APP_REVIEW.md'
review = review_file.read_text().split('## Current delivery status')[0]
review += f'''## Current delivery status

**Updated:** 19 November 2026 — Run24 transition/CI and iOS export qualification. Original review snapshot/findings above are preserved; [the ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger) owns current status.

- **Scope/status:** all35 remain required:0open/17in-progress/12implemented-awaiting-M11/6resolved/0blocked/0scope changes. P05–P10 stay active; no whole phase closes and every M11 result is unperformed. R08 retains Run23's resolved automated dependency scope.
- **Delivered/checks:** non-creating worker/controller/served/cached-HTML diagnostics and explicit CI tabs/process dispatch with retained failures. Six final local scopes in Edge157/Firefox159/WebKit27.2 pass36groups and6 negative controls; lint/workflow checks pass. {native_text} [Evidence](evidence/run24/README.md), [native results](evidence/run24/ios/results.json).
- **Failures/limits:** strict WebKit cache cleanup fails in separate original/observed runs, despite exact forward HTML/controller in the observed failure; later process passes establish no cause/repair. A first-answer save fails with visible pending/Retry, then a serial comparison passes. Maximum Share fails35-short-swipe keyboard alignment with no sheet capture; other native driver/setup failures retained separately. Android live text remains failed3/4; original iOS gestures/max progress, strict ink, recognition/remote/public-host/support/integrated gates stay open. [Triage/checkpoints](evidence/run24/shared/forecast.md).
- **Captures/reuse:** [59 actual inspected final web/iOS captures](evidence/run24/screenshots/index.md), plus separate failed diagnostics. Android captures inapplicable to this unchanged-product/tooling and iOS-only delta; Run23 captures retained. Product/native/dependency/worker bytes unchanged.151 shared tests/compiled Yoga and Run23 direct builds/raw audit0/review0 are reused at their original scopes, not rerun or final P10.7 acceptance. [Identity/preservation](evidence/run24/verification.json).
- **Manual/next/stop:** every human result stays unperformed in [M11](evidence/run24/manual-handoff.md). Next P1 Android causal native regression/repair; P2 progress exception/Retry or remote qualification when a host exists, with recognition separately forecast. Stop at verified tooling/native/capture/source/status handoff before another substantial framework/provider/new-cause cycle. [Execution record](DELIVERY_PLAN.md#run24--19-november-2026).
'''
review_file.write_text(review)

readme_file = ROOT / 'README.md'
readme = readme_file.read_text()
readme = readme.replace('[Current evidence](docs/evidence/run23/README.md), [actual screenshots](docs/evidence/run23/screenshots/index.md)', 'Run24 adds explicit CI transition selection, separate worker-generation/cache observations and scoped iOS long-export qualification; retained browser/native failures remain open. [Current evidence](docs/evidence/run24/README.md), [actual screenshots](docs/evidence/run24/screenshots/index.md)', 1)
readme_file.write_text(readme)
for relative, title, body in [
 ('docs/RELEASE_RUNBOOK.md', 'Run24 qualification handoff', summary + ' See [reports and retained failures](evidence/run24/README.md), [capture index](evidence/run24/screenshots/index.md), [CI mode selection](WEB_DISTRIBUTION.md#transition-observations-and-ci-selection--run24) and [human-only supplement](evidence/run24/manual-handoff.md). No new distribution/publication authority.'),
 ('docs/CONVERTER_POLICY.md', 'Run24 iOS export qualification', native_text + ' Exact clipboard comparison uses the already qualified shared conversion model; canonical-content review is reused. Driver failures and original native gates remain separate. [Reports/fixtures](evidence/run24/README.md), [actual native captures](evidence/run24/screenshots/index.md). No converter behavior, storage or privacy claim changes.'),
]:
    p = ROOT / relative
    p.write_text(p.read_text() + '\n## ' + title + '\n\n' + body + '\n')
print(summary)
