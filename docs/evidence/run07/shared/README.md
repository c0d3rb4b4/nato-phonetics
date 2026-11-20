# Run 07 shared verification

17 November 2026, Node 22.23.0 / npm 10.9.4. [All 183 prior maintained source files match the resume baseline](resume-comparison.json); inherited changes were preserved. [Final source comparison](source-changes.json) records the precise eight modified files and one new regression file, with no removals and unchanged inherited deletions.

| Check | Actual result |
|---|---|
| `npm test` | [84 passed, 0 failed](tests.log). |
| `npm run typecheck` | [Pass](types.log), active checked application code. |
| `npm run lint` | [Pass](lint.log), zero warnings/errors. |
| `npm run check:dependencies` | [Pass](no-expo.log), 793 locked packages and installed/native/web consumers remain Expo-free. |
| `npm run export:web` | [Pass](web-build.log), independent 12-route production build. |

The four new [baseline lifecycle regressions](tile-baseline-tests.log) execute the maintained native hooks with controlled React state/effect scheduling. Recorded Android TREE and maximum iOS J frames establish concrete expected corrections; additional cases cover text replacement without a new geometry event, parent-target changes, old callbacks after 1→2→1, and unmount. These tests do not simulate native rasterization. [Independent audit](fidelity-audit.md) and the platform reports distinguish original failure measurements from new native rendering results.

No design token, font byte, layout tolerance, dependency, permission or storage schema changed. Locked installation and registry audit were not rerun: Run 04's installation and Run 05's audit retain their historical scope. The Metro/image-size high advisory remains dispositioned, not fixed or owner-accepted. Physical accessibility/listening/provider/offline, signing and release acceptance remain in M11.

A [runner check](runner-correction.json) found the first script invocations used host npm 11.9.0 despite the Node path pin. Those passing logs are retained in `diagnostics/npm11-script-launch/`. All five gates were rerun once using the explicit pinned npm 10.9.4 CLI and passed; no installation or dependency change occurred. The web asset hash is identical before/after, so browser evidence was not needlessly repeated.
