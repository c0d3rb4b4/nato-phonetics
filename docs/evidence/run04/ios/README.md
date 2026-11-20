# Run 04 — iOS P00 verification

Date: **16 November 2026**. **The final iOS P00 simulator engineering checks pass:** direct Release build/install, seven native XCTest cases with zero failures, storage migration/reset assertions, and sixteen actual application screenshots. The delivery plan owns overall P00 completion.

## Native changes

- The app now owns its window through a single `UIWindowScene`/`SceneDelegate`. Cold custom URLs become React Native launch options; warm URLs use `RCTLinkingManager`. The scene manifest disables multiple windows, preserving the existing global navigation and speech ownership contract.
- This implements the lifecycle required by Apple's [scene migration guidance](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle). Xcode **27.2 (27B52)** builds against the iOS 27.2 SDK. Only **iOS 26.2 (23C54)** is installed as a simulator runtime here; adopting the required lifecycle is not an iOS 27 runtime pass.
- Actual speech testing exposed an independent `react-native-tts` 4.1.1 bridge defect: four exported Objective-C Boolean arguments used `BOOL *` rather than scalar `BOOL`. React Native's new-architecture interop cannot convert the resulting `^B` argument encoding. The initial test displayed “Audio could not be stopped safely”; see the [failure hierarchy](diagnostics/audio-stop-failure-tree.txt). The version-guarded postinstall patch now repairs these signatures and the two word-boundary conditions. The final native rebuild and real-provider runtime suite pass after that fix. The shared adapter also waits for provider initialization before Stop; iOS correctly accepts a false idle-stop result.

## Final candidate and results

The unsigned **arm64 Release simulator app 1.0.0 (1)** has bundle identifier `com.natophonetics.app`. [Artifact identity](artifact.json) records the installed/built binary and JavaScript hash comparison, scene manifest, patched native TTS source hash, source manifest and packaged archive. The [simulator ZIP](../../../../artifacts/NATOPhonetics-ios-simulator.zip) contains the `.app`; it is not a signed device IPA.

- Native executable SHA-256: `0f112130a992e8c32fcfc44ef34cd8e28c07f67b547004ffa39bb569ce7dab16`.
- Bundled JavaScript SHA-256: `291bacefd16816ce0a1f455c7799e35eb6ef1ef193750b025e953bf14c5feb8d`.
- Simulator ZIP SHA-256: `fb320de578c497c2ff222552a9b1420ca79137ef4094140326606c8c05e30149`.
- Final source manifest: [source-sha256.txt](../source-sha256.txt), SHA-256 `e4f6c9af3df7d3e1214064ae6239d9ab00a6906bafb98a83421e43d9e6815ad7`.

| Final gate | Result and evidence |
|---|---|
| Direct native rebuild after the iOS TTS signature repair | **Pass**, [full build](build-final.log). |
| Final build after the shared native adapter initialization fix | **Pass**, [incremental build](build-final-adapter.log); actual installed binary and bundle hashes equal the built artifact. |
| Native UI, input, speech and routing suite | **5 tests, 0 failures, 198.585 seconds, exit 0**. [Final log](native-final-patched-test.log). |
| Legacy native preference migration | **1 test, 0 failures, 9.711 seconds, exit 0**. [Migration log](storage-migration.log). |
| Native scoped preference reset | **1 test, 0 failures, 8.293 seconds, exit 0**. [Reset log](storage-reset.log). |
| Persisted storage assertions and restoration | **Pass**. [Actual records](storage-results.json), [verification log](storage-verification.log). |
| Actual native screenshots | **16 exported and independently inspected**, each **1206 × 2622 pixels**, captured **18:27:28–18:31:24 UTC**. [Metadata and provenance](../screenshots/ios/metadata.json), [export log](screenshot-export.log), [overall screenshot index](../screenshots/index.md). |

The final UI suite verifies Home, alphabet, empty/populated converter, quiz question/feedback, Settings, voice list, audio help and cold Menu entry. It asserts saved dark appearance after terminate/relaunch; warm/cold/unknown URL handling and Home fallback; independent quiz taps; consecutive individual key events, deletion, append and retained converter state after Menu/Back; and the native Paste menu with exact full text and all expected cards.

The real iOS speech provider is used throughout. The suite observes active playback, explicit Stop, replacement followed by completion, cancellation on navigation and backgrounding, and no automatic resume on Back/foreground. Terminal checks also assert the absence of the playback error action, so an error is not counted as successful completion or cancellation. A selected Karen voice survives relaunch; returning to System Default is saved and its real preview completes. These checks establish provider/control behavior, not audible pronunciation or an offline guarantee.

The native storage fixture seeds legacy `darkMode=true`, `selectedVoice=com.apple.voice.super-compact.en-AU.Karen`, and an unrelated learning-data sentinel into the actual simulator AsyncStorage manifest. Launch migrates to `nato.preferences.v1` with dark/Karen and removes the legacy keys. Reset stores System/null and leaves the sentinel untouched. Exact persisted values are asserted and the complete original manifest is restored in a `finally` block. This is a seeded storage migration check, not a signed prior-app upgrade.

The earlier [scene-only runtime attempt](native-final-test.log) had two failures (quiz action assertion and the confirmed TTS bridge error); its two input tests passed. Those failures remain historical diagnostics. The final rebuilt candidate passes both the full quiz capture flow and an independent single-tap quiz test, as well as the repaired real speech lifecycle. Android and iOS runtime suites ran sequentially for the final checks on this 8 GB host.

## Input investigation

No speculative converter rewrite was retained. The actual app continues to use its controlled `TextInput`.

| Check | Observed outcome |
|---|---|
| Scene-enabled app, existing bulk insertion/deletion/append/Menu test | **3 executions: 2 pass, 1 failure**. The failed trial inserted `CV34 7AP` correctly, but bulk double-delete left `CV34 7A` instead of `CV34 7`. [Log](full-input-scene-test.log). |
| Minimal React Native-only probe, bulk insertion | **6 executions: 6 pass** (3 controlled, 3 uncontrolled). [Log](input-probe-test.log). |
| Same minimal probe, extended insertion/deletion/append test | **6 executions: 2 pass, 4 failures** (1 pass/2 failures for each control mode). All four failures reproduced the initial `CV34 7AP` → `C` loss before deletion. [Log](input-editing-probe-test.log), [source](input-probe.js), [inspected diagnostic images and hashes](diagnostics/metadata.json). |
| Actual app, consecutive single-character events without artificial character sleeps | Initial scene candidate **passed** exact prefixes, deletion, append, Menu/Back retention and updated/removed cards. The final candidate repeats this successfully in [the final log](native-final-patched-test.log). |
| Actual app, native clipboard Paste | Initial scene candidate **passed** exact full value and all seven emitted cards. The final candidate repeats this successfully in [the final log](native-final-patched-test.log). |

The minimal probe has no app routing, theme, storage, speech, converter, or output-card code. It was bundled into a **copy** of the simulator app and replaced by the maintained app before application checks. Both controlled and uncontrolled fields reproduce the loss, so neither application logic nor controlled input alone explains it. This isolates the observed failure to the React Native/iOS/XCTest bulk-injection path; it does not establish which upstream component causes it, guarantee bulk automation, or substitute for physical typing acceptance. The original failed results remain failures. The diagnostic PNGs are clearly separated from actual application screenshots.

## Reproduction

The [Swift driver](capture-ios-ui.swift) runs against the already installed app through a separate temporary XCTest runner; the [project generator](capture-ios-ui.rb) creates that runner without modifying application source. [Storage verification](verify-storage.py) seeds and checks the actual simulator AsyncStorage manifest and restores the pre-test manifest even after failure. [Screenshot export](export-screenshots.py) verifies application binary/bundle hashes and preserves original XCTest attachment provenance.

Use the repository’s `npm run build:ios:simulator` with Node 22.23.0 and `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`, then install the resulting `artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app` using `xcrun simctl install`. The simulator used here is `0653F7EC-9237-4AC5-A264-12969E625070` (iPhone 17 Pro, iOS 26.2).

Create a fresh temporary XCTest project with the Ruby generator and the installed `xcodeproj` gem. Select `testCaptureNativeStates`, `testNativeKeyEventsEditing`, `testNativePaste`, `testNativeLifecycleAndVoice`, and `testQuizSingleTap` for the application suite. The `testMinimalControlled`/`testMinimalUncontrolled` tests are only for the separately bundled diagnostic copy. Each `-resultBundlePath` must be unused. Exact selected-test commands and exit statuses accompany the final logs.

The clipboard test uses simulator `simctl pbcopy` with the sample `CV34 7AP`, then invokes the app’s ordinary native Paste menu. The simulator clipboard is restored after the run. No `TextInput` value is injected directly into the app and no provider is mocked.

The final selected-test invocation appears at the beginning of [the native log](native-final-patched-test.log). Storage commands and exits are recorded in their individual logs; the screenshot exporter takes the final app plus the three exported attachment directories.

## Scope

These are simulator engineering checks. Physical listening/pronunciation, accessibility with assistive technology, prior signed-app upgrades, offline provider guarantees, iPad-specific layout acceptance, signed distribution and an iOS 27 runtime remain separate P05/P10/M11 work. The current simulator's ordinary app installation is preserved; temporary test runners and probe apps are not distribution builds.

[Cleanup](cleanup.log) restored the simulator clipboard, removed the temporary XCTest runner, and shut down the simulator after verification. The maintained app remains installed and the final build/ZIP and result bundles remain available.
