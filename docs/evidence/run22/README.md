# Run22 — shared host execution, native context and audit reconciliation

19 November2026. Base `f8c0a3c2a32b5f65dfcfbea70b94677a3a6113b5` plus the identified uncommitted candidate. Owner planning changes were committed during initial inspection and preserved. **P05.2 remains P1/failed; P10.8 is active/partial. No whole task/phase closes.** All35 items remain required:18in-progress/12implemented-awaiting-M11/5resolved. Every M11 result remains unperformed.

## Delivered and checked

- `scripts/host-build.cjs` shares checks/web/native execution between Actions and a prepared host. It records exact source/diff/untracked identities, pinned tools/resources, serial worker limits/build lock, fresh outputs, expected-source/drift rejection, per-command logs/exit/signal details and artifact hashes. Existing Gradle/Xcode/web implementations remain the build logic. [Guide](../../NATIVE_BUILDS.md#shared-host-execution--run22).
- Manual private native workflow restricts refs to main/develop, serializes unsigned selected modes and reports checks independently; any failed security/check/build remains failed and retains logs. Existing three-engine distribution CI uses the common web entry. [Workflow checks](shared/workflows.json). **No workflow dispatch/hosted native/Linux job is run; GitHub inventory has0 registered self-hosted runners.** Actual remote reconstruction/retrieval/direct second invocation and a separately justified framework diagnostic remain P10.8.
- Actual **147 shared tests**, including8 new subprocess/install/source-drift/lock/failure behavioral tests, lint/types and the795-package Expo-free graph pass. [Actual checks report](host/host-checks/report.json), [8 targeted tests](shared/host-tests.log). Prior177 compiled Yoga checks are reused unchanged, not newly run.
- Actual local Android Debug APK, all-four-ABI unsigned Release AAB and unsigned iOS simulator tar builds pass. iOS tar preserves executable permission and all25 retrieved/installed app-file hashes match. Final Android installed APK matches its host output; actual Home is asserted before the accepted capture. [Candidate/ABI/signature/source identities](candidate.json), [install/captures](shared/native-install-captures.json), [Android readiness retry](shared/android-capture-retry.json). These are scoped local installation checks, not a native font/caret/full-flow repair or signed distribution acceptance.
- Two web host invocations, one enforcing exact source ID, produce the exact Run20/21 archive SHA256 `fe911a9691812e3989e048429e034e1fef5f7ff1e7960d7e4a1c196d7e0e8f96`. [First](host/host-web-first/report.json), [second](host/host-web-second/report.json), [durable identical archive](../run20/hosting/nato-web.tar.gz). Production desktop/light and320px/dark converter screenshots have no page errors; unchanged Run21 other-engine hosting/update evidence retains its original scope.

## Native diagnostic and changed security status

Read-only normal-startup hooks on the unchanged Run17 APK observe surface Java/C++ font multiplier1 despite live2, no root clone and15 cold versus10 live Yoga configuration calls. The stable paragraph/feedback/input frame gate still **fails3/4**; mount1/inputNUWJ359 survive, while caret/composition/state/full tile/window/AT remain unqualified. [Context report](android/context-report.json), [actual failed frame gate](android/gate-result.json), [scope/next question](../../ANDROID_TEXT_MEASUREMENT.md#run22--actual-surfacecontext-and-yoga-traversal-checkpoint). No flag/cache override, root replacement, source framework patch, workaround or tolerance change is shipped. Product entry/scale restored; instrumentation stopped.

Fresh [raw npm audit](shared/audit.json) is **exit1:0high/critical,7low**; the high/critical [review gate](shared/audit-review-final.log) is **exit0**, including after inventory reconciliation. Dependencies/lock unchanged. Primary matcher metadata still has the same18November withdrawal; its absence in npm is classification/propagation evidence, not a code repair. All7 low entries derive from one XML advisory. The two inspected CLI consumers do not enable its required stopNodes option; this is a scoped source applicability inference. CLI20.2.0 is an unverified future compatibility candidate. [Assessment/primary-source captures](shared/security-assessment.json), [current review](../../SECURITY_REVIEW.md#run22--registry-reconciliation-and-bounded-low-parser-triage). R08 remains in-progress; no suppression, risk waiver or owner acceptance. Low-parser/CLI follow-up is P2, promoted on new severity/advisory/exposed XML/pattern input and rechecked before release.

## Actual host outcomes

| Invocation | Status | Result |
|---|---|---|
| [host-android-debug](host/host-android-debug/report.json) | failed | Android requires JDK17; set JAVA_HOME |
| [host-android-debug-final](host/host-android-debug-final/report.json) | passed | Actual command outcome; see steps/artifacts |
| [host-android-release](host/host-android-release/report.json) | passed | Actual command outcome; see steps/artifacts |
| [host-checks](host/host-checks/report.json) | passed | Actual command outcome; see steps/artifacts |
| [host-controlled-failure](host/host-controlled-failure/report.json) | failed | native-build failed (1); see logs/01-native-build.log |
| [host-ios-final](host/host-ios-final/report.json) | passed | Actual command outcome; see steps/artifacts |
| [host-ios-preflight](host/host-ios-preflight/report.json) | failed | xcodebuild -version: xcode-select: error: tool 'xcodebuild' requires Xcode, but active developer directory '/Library/Developer/CommandLineTools' is a command line tools instance
 |
| [host-ios-simulator](host/host-ios-simulator/report.json) | failed | Candidate source changed during execution; artifact qualification rejected |
| [host-web-first](host/host-web-first/report.json) | passed | Actual command outcome; see steps/artifacts |
| [host-web-second](host/host-web-second/report.json) | passed | Actual command outcome; see steps/artifacts |

[All durable host reports](host/index.json), [actual command records](shared/host-commands.json), [initial/checkpoint/reforecast](shared/forecast.md), [verification/preservation](verification.json). Per-command raw compiler logs are stored as lossless `logs/*.log.gz`; each report's original `.log` maps to the gzip path and uncompressed SHA256 in its `archived-logs.json`. Use `gzip -dc <file>` to inspect exact original bytes. Source/patch snapshots identify each command's actual candidate; final documentation/security-metadata changes follow native compilation and do not alter product inputs. Logs/source snapshots are durable; large native artifacts remain under ignored workspace `artifacts/run22/` with exact identities in candidate.json. Remote transfer is unperformed.

## Failures retained

1. Historical JDK path is absent; first preflight fails. Official isolated Temurin17.0.13+11 is downloaded and SHA256 verified; [identity](shared/jdk-install.json). Global xcode-select points at Command Line Tools; iOS preflight fails, then process-only DEVELOPER_DIR selects existing Xcode27.2. No shell/system settings or arbitrary minimum free-space gate. Actual standard builds fit; available disk falls from about11GiB to about6GiB with retained intermediates/artifacts. A first Android framework source build is still unqualified, with no causal native patch selected.
2. First iOS compiler succeeds, but wrapper rejects qualification after install-verification tests changed during compilation. Original failed source-drift report remains red; stable-source retry passes. This was an agent edit during compilation, not an intended negative control.
3. Verification driver asserts the historical failed audit and exits1 when the actual review passes. [Original failure](shared/host-verification.log) is preserved; actual147 tests and gate results take precedence. The missing-export command is resumed independently without repeating already passing checks.
4. Intentional `ios-export` with a missing plist exits1 and retains the real failure log with no stale artifact collection. No signing/archive/export is attempted beyond the existing missing-input guard.
5. First new Android screenshot catches Loading settings; it is rejected on inspection, retained and superseded by a retry requiring actual Home hierarchy. No app startup defect is inferred from this early capture.

## Captures, residuals and stop

[Ten actual inspected captures](screenshots/index.md):5 product views,4 failing Android font diagnostics and1 rejected loading image. Web/Android/iOS are represented; no changed-flow target is missing. Final Debug scope identifies matching native APK, unchanged current product source/normal Metro entry and Home hierarchy; a new final-process inspector JS archive/full behavioral pass is not claimed. Earlier restored-product inspector archive remains separately identified. Full integrated P10.7 is unfinished.

App/native/font/permission/provider/storage/dependency/lock inputs remain unchanged. Android P1 live sizing, original iOS gestures/max navigation, WebKit waiting-update process-close, strict P3 fringes, low tooling advisory/CLI qualification, recognition, branded/legacy/other-OS/public HTTPS, signed artifacts and integrated/physical/AT/provider gates remain open. [Human-only supplement](manual-handoff.md) keeps restricted runner/enrollment/access/signing and human acceptance in M11; no local owner prerequisite is invented.

Stop after the bounded native trace, shared local tooling/native artifact verification, newly triggered security reconciliation and full evidence/source/capture/status handoff. Remaining framework/ABI/caret/tile and recognition/provider cycles require substantial fresh implementation/verification; actual remote qualification needs a suitable authorized host. Next P1 Android causal native regression/context-owner/cache repair; P2 CLI/parser upgrade qualification, P10.8 remote execution or P09 are eligible by their dependencies/forecasts. No fixed phase count, publication, release exception or acceptance.
