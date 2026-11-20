# Run27 — Android tile acceptance and ARM64 source Release checkpoint

19 November 2026. **P05.2-F1 passes its complete original Run07 scope. F2 is partial: ARM64 Release build/native/composition scopes pass; other ABIs, full Release application gates and default integration remain unfinished.** P05–P10 stay active, all35 required remain17 in-progress/12 implemented-awaiting-M11/6 resolved. No release acceptance or unrelated P2 work.

Initial HEAD `e591f903af9df1be41a715abe3d1978ae9a452ca` with inherited Run26 changes. A concurrent commit `37abdc5a250f0d8c290c0de984aab21b5d409686` recorded that work and initial Run27 forecast/baseline. The agent made no commit/staging/reset/publication. [Initial preservation snapshot](shared/baseline.json), [HEAD reconciliation](shared/head-reconciliation.json), [final identity/preservation checks](verification.json). Product JS, native repair sources, dependency graph, fonts, all prior evidence and acceptance thresholds are preserved. [Forecast and checkpoint decisions](shared/forecast.md).

## Delivered and checked

| Scope | Actual evidence and limit |
|---|---|
| F1 original complete native geometry/baseline/raster acceptance | Reused installed Debug source APK `1b045e2d…`. **18groups/625baselines, none missing**, maximum delta0.000606physical pixels against1px. **271ink observations**, maximum top/bottom deltas1.369/1.282px against2px. All26 default/light alphabet; NUWJ359 converter light/dark1× and dark2×; concealed question/revealed feedback dark2×. [Summary](android/f1-summary.json), [baseline report](android/native-layout-checks.json), [raster observations](android/extended-raster-measurements.json). |
| Unchanged assertions | Inspectors/checkers/glyph metrics are byte-identical to Run07; no tolerance/part/context/background threshold changed. [Provenance](android/assertion-provenance.json). Navigation adapts to actual export/pacing controls and explicit session start; offscreen nodes are not raster observations. |
| Source ARM64 Release compile/package | `:app:assembleRelease :app:bundleRelease -PnatoReactNativeSource=true -PreactNativeArchitectures=arm64-v8a --max-workers=1`, pinned Node22.23.0/JDK17/NDK27.1.12297006; source CMake3.30.5, app CMake3.22.1. **8m51s/exit0**,246tasks,89executed. [Exact command/resources](android/source-release-arm64.json), [log](android/source-release-arm64.log). This is one ABI, not default integration or complete Release acceptance. |
| Exact unsigned/test artifact identity | [Manifest](android/release-artifacts.json), [identity checker](android/identify-release.py). Original APK/AAB unsigned; separate local test APK uses repository development key, remains non-debuggable and preserves every original payload entry. All native ELF machines are AArch64; APK/AAB native hashes agree and stripped APK/exported prefab build IDs match. No private signing. |
| Product/engine preservation | Embedded Hermes JS SHA256 `5cef952342d21de060ed3036c51570e1a7ad987cec3e2f362842ca7a8f671075` equals Run23. `libhermes.so` equals exact pinned Maven Hermes0.81.5 **Release** AAR (not the Debug engine). All13 installed patched source hashes match. [Source preflight](android/source-preflight.json), [identity](android/release-artifacts.json). |
| Actual Release native owner/cache regression | **6cases/exit0** against exact APK native libraries, same header/library ABI and build IDs. [Actual execution](android/native-release/native-result.json), [Release-mode compile](android/native-release/compile.json). Four owner/generation cases, clean old-child adoption and actual RN cache case pass. SP simulation here remains distinct from actual Android product measurement. |
| Real Release input/composition | **5checkpoints**, same native view/Editable/focus, `NUWQJ359`, caret4 and composition3–4 at1→2→1; continueQR then commitZ. Uses actual embedded product entry, no Metro/fixture substitution. Native widget SP sizing asserted and actual pixels captured. [Report](android/release-composition/report.json), [installed identities](android/release-composition/identity.json), [command](android/release-composition-command.json). No physical/provider-keyboard/AT claim. |
| Maintained test tooling | Optional external-evidence retrieval supports non-debuggable Release without `run-as`; missing report/checkpoint/PNG fails. Native helper explicitly matches Debug/Release class layout before compiling; unchanged six predicates. Correct Debug and Release compile paths pass; [wrong-mode negative](android/native-mode-negative.json) is rejected before compilation. [Debug compatibility](android/native-debug-mode-compile.json). |
| Shared regression | **6/6** maintained Android stale-frame/widget/source-guard tests pass. [Command](shared/android-guard-tests.json), [log](shared/android-guard-tests.log). No fresh157-test/lint/type/web/browser/audit/iOS build claim; those unchanged-input Run26/23 scopes retain their limits. |

## Artifact paths

Local originals and the separate engineering test copy are in `artifacts/run27/release-arm64/`:

- `app-release-unsigned.apk` — SHA256 `1efaab9d3c1b7b956f1c9d6ca85e9539304568504eb239b89cc21cc4da610f86`.
- `app-release.aab` — SHA256 `71344dfa356926495d5b9930c1a3b8935d4388d6a374e7803452274d7b04d80a`.
- `app-release-local-test.apk` — SHA256 `5dfa45d22b562ddb03fffcbeb16b16bf0392197d69e92320437d5a1ab22ae129`; development key only, not a distribution signature.

## Failures preserved and unrun work

The initial capture command fails at a converter-top assumption after alphabet coverage; export/pacing controls now precede tiles. [Original script/log/hierarchy/images](diagnostics/initial-capture/capture.log). A second collection fails its non-scrolling Next expectation after actual Q/Quebec submission; the selected answer and score1 survive. [Retained failure](diagnostics/quiz-next-offscreen/capture.log). [Same-round feedback/control continuation](android/finish-feedback.json) passes after real scroll alignment; earlier unchanged captures reused. Neither failed command is relabeled successful. The subsequent unchanged complete baseline/raster gates independently pass.

First standalone Release harness link fails because the old helper uses Debug class-layout macros against a Release library. [Original source/compile evidence](diagnostics/native-release-debug-abi/compile.log). `react/debug/flags.h`, `Sealable.h` and debug-string flags establish the ABI mismatch; explicit matching mode fixes test compilation, with no product rebuild or assertion/tolerance change. Correct Release native execution then passes all six cases. Two read-only preflight reader schema errors are recorded in source-preflight; they never mutated source.

Unrun: source armeabi-v7a/x86/x86_64 builds; full Release strict fixture/raster/application/window gates; clean install/default-source integration and exact resulting affected gates; broader supported native/runtime/OS split-screen/AT/provider scope. Standard Maven path remains unchanged with its historical3/4 failed live controls. Original iOS/WebKit/P3 failures stay open. Web/iOS product/worker/source inputs unchanged; new captures inapplicable here, no fresh target pass. P10.7 complete integrated captures remain open.

## Captures, manual work and next checkpoint

[Actual screenshot index](screenshots/index.md):19 F1 originals,5 Release composition originals and the restored product reference. All25 inspected; failed setup images remain separate. [Restoration](android/restoration.json) verifies original numeric font, display/density, Gboard IME and exact initial Debug source APK; app data is never cleared. Owned tooling shutdown is recorded there.

[Human-only supplement](manual-handoff.md): every M11 result remains unperformed. Local engineering has no new owner prerequisite. **Next P1: P05.2-F2 remaining source ABI qualification**, starting with the 32-bit armeabi-v7a boundary, then remaining Release application gates and reproducible default integration. [Concrete command and forecast](android/next-android.md).

Stop at the verified ARM64 Release checkpoint to reserve remaining execution capacity for source/status/evidence handoff before the next ABI/default-build cycle. No fixed phase count, disk-shortfall claim, P2 switch, scope reduction or release acceptance.
