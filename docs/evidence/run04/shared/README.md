# Run 04 shared and web verification

Executed 16 November 2026 with Node 22.23.0 / npm 10.9.4. The uncommitted migration work was preserved. [Environment](environment.json) and [machine-readable results](verification.json) record the commands, installation method and limits.

| Check | Result | Evidence |
|---|---|---|
| Fresh locked installation | Pass, including Android UUID and iOS Boolean bridge patches | [Install](locked-install.log) |
| Lint / checked application types | Pass | [Lint](lint.log), [types](types.log) |
| Regression tests | 65 passed, 0 failed | [Tests](tests.log) |
| Installed graph and maintained consumers | No Expo/EAS dependency or build usage | [Graph/consumer check](no-expo.log) |
| Independent production web build | 12 route pages; final bundle matches the tested/captured bundle | [Build](web-build.log) |
| Production browser regression suite | Pass, including 144 direct/reload route loads, history, keyboard/accessibility, layout and controlled speech failures | [Browser](browser-app.log) |
| Production preference suite | Pass, including legacy migration, failed writes, persistence and scoped reset | [Preferences](browser-preferences.log) |
| Actual web screenshots | Nine captures, visually inspected; no substituted native images | [Capture log](capture-web.log), [metadata](../screenshots/web/metadata.json) |
| Dependency audit | Raw exit 1: 0 critical, 1 high, 6 moderate, 3 low; unchanged disposition gate passes | [Raw audit](audit.json), [review gate](audit-review.log) |

The fresh installation ran in `/tmp/nato-p00-clean-run04` with copied maintained source, avoiding changes to dependencies used by simultaneous native builds. Its install and checks passed. Final native-adapter changes were then checked in the repository against the same locked graph. Temporary duplicate dependencies were removed afterward. The final production web bundle remains SHA-256 `0b78445e30ede5ce9ded14b748453b7312192ea84b676198c3ba32f92d6c9dd5`, so the complete browser checks and captures still describe the final web output.

## Native defects found during verification

The iOS provider exported four Boolean arguments as `BOOL *`, an unsupported pointer encoding in React Native 0.81.5 TurboModule interop. Actual app playback displayed the safe-stop error before speech. The version/source-guarded install patch changes these to scalar `BOOL` and fixes the boundary branches. [ABI evidence](ios-tts-abi.json) and [focused regressions](native-tts-patch-tests.log) cover the installed signatures and repeatability/source/version guards. Actual native compilation and speech checks are recorded in the [iOS report](../ios/README.md).

Source review also found that Android can reject Stop before its engine finishes initialization, while the controller calls Stop before first Play. The adapter now awaits engine readiness inside its existing serial queue; cancellation still invalidates the current operation immediately. A first-Play integration regression exercises delayed initialization and successful completion. Android's explicit false Stop result is treated as failure; iOS's benign false result when idle remains accepted. These are verified contract fixes, not an attribution of the earlier emulator/host failures to an initialization race. The isolated real Android Stop probe resolved successfully; see the [Android report](../android/README.md).

Browser speech tests use controlled provider behavior to verify state handling; screenshots use the available real browser provider. Neither establishes audible pronunciation, provider privacy, physical accessibility, signed upgrade compatibility or release acceptance. [Signing availability](signing-availability.json) records configuration presence only, with no secret values.
