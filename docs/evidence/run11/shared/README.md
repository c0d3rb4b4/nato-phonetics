# Run 11 shared verification and source reconciliation

[Resume comparison](resume-comparison.json): all **139/139** Run 10 maintained source inputs matched before edits. No applicable ancestor/repository AGENTS.md; inherited changes were preserved. [Initial status](initial-git-status.txt), [initial files](initial-files.json), [forecast/reforecasts](forecast.md), [source changes](source-changes.json) and [final source identity](../source-identity.json) record the uncommitted candidate over `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`. No invented commit/release.

Commands use `PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH` (Node 22.23.0 / npm 10.9.4):

| Command | Actual result / log |
|---|---|
| `npm test` | [100/100 pass](tests-qualified.log); numeric/mixed/unique example cycles, 3/5/9 scoring/retry/speech, cross-set stale guards, examples retaining order/repetitions/boundary, round choices and voice search/intersection/reset/preserved order. Earlier [99-test checkpoint](tests.log) predates voice filter helper. |
| `npm run typecheck` | [Pass](types-qualified.log), all active source; earlier checkpoints retained. |
| `npm run lint` | [Pass, zero warnings](lint-qualified.log). |
| `npm run check:dependencies` | [Pass](no-expo.log), 793 locked packages/installed graph/maintained consumers. Dependencies and native configs unchanged. |
| `npm run export:web` | [Pass](web-build-qualified.log), independent 12-route production build with unchanged bundled fonts. |

No stored progress, new persistence/permission/provider/dependency or tile font/metric/tolerance change. P08.1/.4 functional implementation is integrated, and P05.1/R06 gains explicit web radio checked/disabled/expanded mapping. Existing inaccessible native live sizing does not become a pass through the semantic repair. P08 remains active; affected checks/manual acceptance are separate.

Browser and installed native reports qualify affected behavior; use their stated scopes and failed/interrupted attempts. P08.2 listening/typed recall, P08.3 saved progress, P09 recognition and integrated P10/M11 remain unfinished. No fresh install, audit-remediation, new native app/Release build, hosted CI, full unchanged raster/runtime or human listening/AT/privacy/release claim.

[Final reconciliation](../verification.json) checks 2,302 inherited file hashes (no unexpected changes), 144 maintained source inputs, all 55 primary PNG hashes/dimensions (21 web / 15 Android / 19 iOS), local Markdown links, ledger counts and archived loaded JS. Thirteen supplemental letter-regression frames were inspected separately. Final image reviews are recorded in the platform inspection sheets; none establish human acceptance.
