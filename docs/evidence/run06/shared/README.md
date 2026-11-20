# Run 06 shared verification

17 November 2026. Node 22.23.0; existing user work preserved. [Resume comparison](resume-comparison.json) found all 179 Run 05 maintained-source hashes unchanged before this batch. Native builds and captures have their own platform reports.

| Check | Actual result |
|---|---|
| `npm test` | [80 passed, 0 failed](tests.log). |
| `npm run typecheck` | [Pass](types.log), including both HeaderInsets implementations. |
| `npm run lint` | [Pass](lint.log). The subsequent audio-test edit also passes [targeted lint](audio-timers-lint.log). |
| `npm run check:dependencies` | [Pass](no-expo.log), 793 locked packages plus installed graph and maintained native/web consumers remain Expo-free. |
| `npm run export:web` | [Pass](web-build.log), 12 independent route pages and local bundled fonts. |

The [initial test run](tests-initial-failure.log) passed 79/80: the rapid-replacement audio test exceeded its 100 ms fixture deadline during concurrent native work (180.56 ms test duration). This exposed a test clock race, not evidence of a product regression. `tests/audio.test.mjs` now controls `setTimeout` with each Node test's mock clock while leaving promise and `setImmediate` ordering real. Ordinary controller fixtures use production deadlines; explicit timeout tests retain their short, deliberately advanced boundaries. The missing-completion test verifies playback is still active at 9 ms and fails at 10 ms; pause cancellation advances past the cancelled pause and verifies no queued speech. [18 focused audio tests pass](audio-timers.log), followed by the 80-test suite above. Node 22 reports the expected experimental MockTimers warning. No production audio code or dependency changed.

Independent source review found the header probe scoped to the custom bar, excluded from touch/accessibility, and responsive to layout/safe-area/window changes. Native runtime evidence must establish inset convergence, actual taps and state retention; build/type/style declarations alone do not close P05.2 or P05.8. The strict digit-3 raster miss uses consistent outer-pixel-edge measurement, so it cannot be closed by switching to pixel centers or widening tolerance.

No dependency graph or lockfile change required a new install or audit in this batch. Run 04's locked installation and Run 05's audit (0 critical / 1 high / 7 moderate) retain their historical scope. The Metro/image-size high advisory remains dispositioned, not fixed or owner-accepted. [Production-web checks and captures](../web/README.md) are current; physical accessibility, listening/provider/offline and release acceptance remain M11.

Final maintained-source comparison against Run 05 records [169 unchanged files, ten changed files and four additions, with no removals](source-changes.json). Changes are limited to the Activity/manifest, header integration/native view/project, audio test fixture and affected delivery/build/design/readme documents. Experimental Android startup adapters and diagnostic logging are absent from maintained source. The dependency lock and previously delivered feature modules are unchanged. `git diff --check` passes; this includes the preserved inherited working tree.
