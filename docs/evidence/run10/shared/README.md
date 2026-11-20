# Run 10 shared verification

18 November 2026. No applicable repository/ancestor AGENTS.md; inherited uncommitted work preserved. [Resume comparison](resume-comparison.json): **137/137** Run 09 maintained inputs match before this run. P06.3 then P06.4 were selected dynamically after the bounded native checkpoint and measured long-render risk, not a fixed phase count. [Forecast/reforecasts](forecast.md).

Pinned toolchain: `PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH`. Commands/results:

| Command | Actual result |
|---|---|
| `npm test` | [94/94 pass](tests.log): new source-index mapping and optional pacing persistence/validation/failure/reset/old-record coverage, plus qualified existing tests |
| `npm run typecheck` | [Pass](typecheck.log), maintained JS/types/routes |
| `npm run lint` | [Pass](lint.log), zero warnings/errors |
| `npm run check:dependencies` | [Pass](dependencies.log), unchanged Expo-free dependency graph |
| `npm run export:web` | [Pass](web-build.log), independent 12-route production build |

The initial new test's injected storage failure was left active during Reset; correcting the test restores 94/94. [All attempt dispositions](attempts.md). No app package/lockfile, native dependency/source, font/design/tolerance, permission or provider changed. The existing v1 preference record gains optional explicitly saved converterPacing; older records remain valid without a rewrite and input/cursor/page are not stored. Reset removes pacing overrides and retains unrelated data.

Production browser and installed native checks are reported separately. No hosted CI, fresh install/audit, new app/Release build, full native raster matrix or iOS 27 qualification repeated: the change does not invalidate those unchanged foundations, and pending final gates remain pending. The Metro/image-size disposition is unchanged, not fixed/accepted; triggers and next review remain in SECURITY_REVIEW.md. The CI workflow adds the actual pacing suite and its artifact upload; hosted execution is unrun.

[Source identity](../source-identity.json), [changed inputs](source-changes.json), [document/source preservation checks](document-checks.json), [screenshot metadata/index](../screenshots/index.md). Only rebuildable owned Xcode intermediates were cleared ([record](disposable-cleanup.json)); binaries, archives, logs, source and evidence were preserved. All M11 remains unperformed.
