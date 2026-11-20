# Run 03 — actual application screenshots

**Historical Run03 evidence.** [Run04](../../run04/screenshots/index.md) now supplies Android captures and updated iOS/web verification, including the resolved native speech issues and isolated bulk-input diagnostic. The Run03 failures and missing-target table below remain a record of that earlier run.

Captured **16 November 2026**, after the production web/browser checks and the direct iOS simulator build/install/launch passed. Native screenshots also follow the screen/state assertions described below. This is P00 migration evidence, not P10's final candidate or M11 release acceptance. Screenshots show actual running application states; no mockup, generated image, speech mock or substituted native image is used.

## Candidate and capture environment

- Uncommitted Run 03 source over base `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; the [140-file source manifest](../../run03-code-sha256.txt) has SHA-256 `4af97fe1ccfb29b00df79ffdaf52ee2225dddb51b19d6feed3ea8e366b7844ba`. It includes maintained native projects and lockfiles, excluding generated build outputs and documentation prose. Final status is recorded in the [delivery execution record](../../../DELIVERY_PLAN.md#execution-record).
- Production esbuild output: `dist/assets/app-3KDRZPQV.js`, 356,675 bytes, SHA-256 `0b78445e30ede5ce9ded14b748453b7312192ea84b676198c3ba32f92d6c9dd5`.
- `dist/index.html` SHA-256 `82c2926fb27ea89eb223ea3162b94b9d891b4435ad82907afc257adb6e72bf4f`; 12 maintained HTML route pages.
- Browser: Microsoft Edge **157.0.4341.60**, Puppeteer **24.43.1**, headless isolated profiles, device scale factor **1**. Host reports macOS **26.6.2 / 25G83**, Darwin **25.6.0**, Apple silicon arm64. Mobile-width images are web evidence only.
- Capture completed at **16:52:15 UTC**; image hashes, exact viewports, page titles and observed text are in [metadata.json](web/metadata.json). The [capture log](../capture-web.log) records all nine files and successful completion.
- Verification immediately preceding capture: [production build](../web-build.log), [full browser matrix and flows](../browser-app.log), [preferences](../browser-preferences.log). The scripted speech tests in those logs are control-flow checks; these screenshots used the real available browser provider.

Reproduce from the repository root with the [capture script](../capture-web.cjs), using an isolated Puppeteer installation and the intended production output:

```sh
PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH \
NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules \
BROWSER_EXECUTABLE='/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge' \
node docs/evidence/run03/capture-web.cjs dist
```

The paths above record this machine's actual command; a new environment supplies its own tool paths. The script starts a loopback production preview and uses Puppeteer's `page.screenshot({ fullPage: false })` at each recorded viewport. It seeds only the documented theme preference in a fresh profile and interacts with ordinary application controls. Sample converter text is `CV34 7AP`.

## Web captures and inspection

Every image below was opened and visually inspected. All show rendered application content with readable controls and the intended light/dark theme; no blank page, stuck loading boundary, hydration error or horizontal clipping was found. Alphabet and voice screenshots show viewport portions of scrollable lists; their offscreen content is reachable and covered by the browser scroll checks.

| Image | Viewport | Theme | Visible screen/state |
|---|---|---|---|
| [Home — desktop](web/home-desktop-light.png) | 1440 × 1000 | Light | Shared navigation/icons, feature links and version |
| [Home — mobile width](web/home-mobile-dark.png) | 390 × 844 | Dark | Wrapped navigation text and responsive layout |
| [Alphabet](web/alphabet-desktop-light.png) | 1280 × 1100 | Light | Canonical A–Z reference list; Juliett and pronunciation guides visible |
| [Populated converter](web/converter-desktop-light.png) | 1280 × 1100 | Light | `CV34 7AP`, letter/digit cards, space boundary and phrase control |
| [Quiz question](web/quiz-question-mobile-dark.png) | 390 × 1000 | Dark | Unanswered T, four unique choices (Tunisia/Tango/Turbo/Thailand), hidden answer and visible focus |
| [Quiz feedback](web/quiz-feedback-desktop-light.png) | 1280 × 1200 | Light | Answered B/Bravo after Brazil selected; persistent incorrect feedback, Next and Replay |
| [Settings](web/settings-desktop-light.png) | 1280 × 1100 | Light | Theme selection, System Default voice, help and scoped Reset Preferences |
| [Voice selection](web/voice-mobile-dark.png) | 390 × 1100 | Dark | Real provider enumeration including Karen/Daniel and English locales; System Default selected |
| [Audio help](web/audio-help-desktop-light.png) | 1280 × 1300 | Light | After an actual audio-test request; troubleshooting and provider-dependent privacy text |

The real browser returned voices and the requested audio flows did not display an error in these captures. No unavailable-provider or permission-denied state was fabricated. Screenshots do not establish audible correctness, network behavior or physical assistive-technology acceptance.

## iOS captures and inspection

The final unsigned Release app **1.0.0 (1)** was built directly with Xcode **27.2 (27B52)**, installed and launched on **iPhone 17 Pro / iOS 26.2**, UDID `0653F7EC-9237-4AC5-A264-12969E625070`. [Final build](../../run03-ios-final-input-build.txt), [final install/launch](../../run03-ios-final-input-install-launch.txt) and [artifact identity](../../run03-ios-artifact.json) are recorded separately. The native executable SHA-256 is `57c67d86583ec6109a9d9002d4d40c2262f236b643397d3e91accf3a3b174628`; bundled JavaScript is `31890a1a476c48162bd5a87588dbf9b0fd6533d58a89439e23db5a99f428ded2`. The exporter verifies both hashes before accepting attachments.

A separate temporary XCUITest runner drove the **already installed app**, used `XCUIApplication.open(URL)` for native routes, tapped ordinary application controls and captured `XCUIScreen.main.screenshot()` PNG attachments. It did not modify app source or substitute speech providers. The **final paced-input screen/capture test passed: 1 test, 0 failures, 99.775 seconds, exit 0**, completing at 16:54:55 UTC after the final shared checks. The bulk-input probes below still contain failures; this is limited smoke/capture evidence, not complete native parity. [Final log](../capture-ios-final-ui.log), [Swift driver](../capture-ios-ui.swift), [temporary project generator](../capture-ios-ui.rb), [exporter](../capture-ios.cjs) and [export log](../capture-ios.log) make the method reviewable. The temporary runner was uninstalled afterward; the target app remains installed.

All eleven final images below were opened and inspected. They show the asserted application screens without OS confirmation prompts, blank/loading views or horizontal clipping. Long lists and articles show the visible viewport; content below the bottom edge is not a clipped control claim. Each image is **1206 × 2622 pixels**, the simulator's native display capture. [Metadata](ios/metadata.json) records per-image timestamp, dimensions, hashes and original XCTest attachment provenance. The [final XCTest export manifest](ios/xcresult-final-attachments.json) records the source attachment names. Captures run from **16:53:35 to 16:54:50 UTC**, after the last application changes.

| Image | Theme | Visible screen/state and verification |
|---|---|---|
| [Home](ios/home-light.png) | Light | Real native header/status insets, font-free icons, feature cards and version |
| [Alphabet](ios/alphabet-light.png) | Light | A–H viewport; `Play A, Alfa` control asserted |
| [Empty converter](ios/converter-empty-light.png) | Light | Empty field, disabled phrase control and explanatory empty state |
| [Populated converter](ios/converter-populated-light.png) | Light | `CV34 7AP` entered with one-second pauses; every prefix, final value after Return and all seven emitted letter/digit cards asserted |
| [Quiz question](ios/quiz-light.png) | Light | Random X question, hidden answer and X-ray/Xingu/Xiamen/Xena choices |
| [Quiz feedback](ios/quiz-feedback-light.png) | Light | First choice X-ray submitted; correct answer, persistent feedback, Next and Replay visible |
| [Settings](ios/settings-dark.png) | Dark | Dark selected through the Settings control; System Default voice and scoped reset |
| [Home after relaunch](ios/home-dark-restarted.png) | Dark | Saved dark appearance remains after terminate/relaunch; Home content asserted |
| [Voice selection](ios/voice-dark.png) | Dark | Real provider enumeration, Karen/en-AU and Daniel/en-GB with Default quality; System Default selected |
| [Audio help](ios/audio-help-light.png) | Light | Test button, troubleshooting and playback/privacy text; this capture step did not invoke the audio test |
| [Cold Menu deep link](ios/menu-cold-light.png) | Light | Terminated app opened with `natophonetics://menu`; Menu asserted; Back to App then tapped and Home asserted |

**Capture corrections and input limitation:** The interrupted `simctl openurl` loop left OS “Open in NATO Phonetics?” confirmations over Home. Those images were rejected and replaced; the [interrupted script](../capture-ios-interrupted.cjs) and [log](../capture-ios-interrupted.log) are failed capture evidence, not route acceptance. The earlier main driver checked only the first emitted card and did not catch incomplete bulk text; its [historical driver](../capture-ios-ui-before-input-fix.swift) and [log](../capture-ios-ui.log) are retained. The final driver checks every full prefix and all expected cards.

| Native input diagnostic | Actual outcome |
|---|---|
| Initial bulk `typeText` with Return | Only `C` visible; [diagnostic image](ios/diagnostics/converter-fast-input-incomplete.png). The initial first-letter assertion was insufficient. |
| Bulk typing without Return | Expected `CV34 7AP`, observed `C 7AP`: **1 failure**, exit 65. [Log](../capture-ios-fast-input.log), [image](ios/diagnostics/converter-fast-without-return.png). |
| Autocorrection/spellcheck disabled | One bulk probe passed, then an editing probe failed on its initial bulk text (`CP`); it remained `CP` after settling. [Pass](../capture-ios-fast-input-autocorrect-off.log), [failure](../capture-ios-input-editing.log), [image](ios/diagnostics/converter-autocorrect-off-incomplete.png). The settings remain appropriate for literal codes but are **not claimed to fix bulk typing**. |
| Speculative native-owned input buffer | **6 executions, 6 failures**, before edits, with `C7AP`/`C 7AP`. [Log](../capture-ios-native-input-regression.log). The speculative buffer change was reverted; final source remains controlled. |
| Explicit keyboard exists/hittable + 2-second wait before bulk typing | **3 executions: 2 pass, 1 failure**, 94.816 seconds, exit 65; the failed value was `C`. Passing trials also assert deletion, append, Menu/Back retention and updated/removed output cards. [Log](../capture-ios-keyboard-ready.log). Readiness alone is insufficient. |
| Final screenshot input | Paced individual characters, exact prefix/full value and emitted-card assertions: **pass** in the final 99.775-second capture test above. |

Bulk synthetic input remains an unresolved automation-versus-runtime concern under P00.6/P06. No failed result is converted into a pass by the successful paced captures. Some failure logs also contain a later diagnostic-collection error about the default `xcrun simctl` path; it did not cause the text-value assertion failures. Simulator `ConnectHardwareKeyboard` has no explicit preferences key on this host; no global keyboard setting was changed. [Diagnostic image hashes](ios/diagnostics/metadata.json) preserve the inspected incomplete states. A separate [plain UIKit control](../input-control/test.log) passed 3/3 equivalent exact-value assertions in 41.726 s, so a generic XCTest-only cause is not established; the app/React Native input path remains under investigation. Two control diagnostic images were visually unusable and are not part of the 20 accepted app captures. The [execution record](../../../DELIVERY_PLAN.md#run-03--16-november-2026) records this bounded interpretation.

Reproduce the final capture on this machine (temporary result/output paths must be unused for a new run):

```sh
GEM_HOME=/private/tmp/nato-ruby33-gems GEM_PATH=/private/tmp/nato-ruby33-gems \
  /opt/homebrew/opt/ruby@3.3/bin/ruby docs/evidence/run03/capture-ios-ui.rb /private/tmp/nato-ios-capture
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcodebuild test \
  -project /private/tmp/nato-ios-capture/Capture.xcodeproj -scheme Capture \
  -destination 'platform=iOS Simulator,id=0653F7EC-9237-4AC5-A264-12969E625070' \
  -derivedDataPath /private/tmp/nato-ios-capture/build \
  -resultBundlePath /private/tmp/nato-ios-capture/FinalCapture.xcresult \
  -parallel-testing-enabled NO \
  -only-testing:CaptureUITests/CaptureUITests/testCaptureNativeStates CODE_SIGNING_ALLOWED=NO
DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer xcrun xcresulttool export attachments \
  --path /private/tmp/nato-ios-capture/FinalCapture.xcresult --output-path /private/tmp/nato-ios-capture/final-attachments
node docs/evidence/run03/capture-ios.cjs \
  artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app \
  /private/tmp/nato-ios-capture/final-attachments
```

Diagnostic commands use the same temporary project and distinct result paths, selecting `testFastInputWithoutReturn`, `testConverterEditingAndMenuRetention`, or `testKeyboardReadyFastInputAndEditing`; the three-trial runs use `-test-iterations 3`. Exact invocations are in their logs. iOS 27 lifecycle, full native speech cancellation/provider behavior, reliable bulk input, physical accessibility, prior-app upgrade and listening acceptance remain unverified. M11 keeps human-only checks; engineering follow-ups stay in P00/P06/P10.

## Missing targets and unfinished candidate states

| Target/state | Current capture status | Exact blocker and follow-up |
|---|---|---|
| Android installed native app | **Missing** | Direct `:app:assembleDebug` compiled the RN Gradle plugins, then failed with `LicenceNotAcceptedException` for `ndk;27.1.12297006`; [build evidence](../../run03-android-build-retry.txt). `adb devices -l` lists no attached device; [device evidence](../../run03-android-devices.txt). Owner/admin reviews and accepts the required Android SDK terms through M11.2. Agent then finishes SDK provisioning, compiles/installs/runs the app and captures with `adb exec-out screencap -p` under P00.6/P10.7. No Android screenshot is replaced with a web image. |
| Other targets | Not applicable | The maintained target set is Android, iOS and web. No Windows, macOS desktop, watch or TV application is declared. |
| Session results, digit reference, expanded/spoken practice | Not yet implemented | P07.2/.4, P08 and P09 remain open. These screens cannot be captured honestly before their implementation and verification. P10.7 retains the complete final-candidate capture obligation. |

P10.7 remains incomplete. M11 pronunciation, accessibility, provider/privacy and release acceptance remain unperformed regardless of screenshot availability.
