# Run 04 — actual application screenshots

Captured **16 November 2026**: **37 inspected application images — 9 web, 12 Android and 16 iOS**. These show actual running apps after the final relevant fixes and assertions. No generated image, substituted browser image or fake speech provider is used for native captures. This completes P00 migration capture evidence; P10.7 still owns the final integrated candidate and later feature states.

## Candidate, method and limits

- Uncommitted source over base `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; [140-file source manifest](../source-sha256.txt), SHA-256 `e4f6c9af3df7d3e1214064ae6239d9ab00a6906bafb98a83421e43d9e6815ad7`. [Build/bundle verification](../artifact-verification.json) independently checks the packaged files.
- Web: Microsoft Edge 157.0.4341.60, Puppeteer 24.43.1, actual production esbuild output. The final bundle hash equals the one used by the passing full browser/preference suites and these captures. [Shared results](../shared/README.md), [capture driver](../capture-web.cjs), [metadata](web/metadata.json).
- Android: installed debug APK on Android 16 / API 36, Pixel 7 AVD, Google APIs ARM64 revision 7; **720 × 1600 pixels at 280 dpi**. The real Google TTS engine was used. Images come from `adb exec-out screencap -p`; UIAutomator checks and Hermes observations verify behavior. [32 checkpoints, reproduction and limits](../android/README.md), [APK plus loaded JavaScript identity](../android/artifact.json), [metadata](android/metadata.json). Debug APK needs Metro; its hash alone does not identify the served JavaScript.
- iOS: installed unsigned arm64 Release simulator app, iPhone 17 Pro / iOS 26.2, Xcode 27.2; **1206 × 2622 pixels**. A separate XCTest runner drives the installed app and exports original `XCUIScreen.main.screenshot()` PNG attachments. Binary/bundle hashes are checked before export. [Final runtime/storage checks](../ios/README.md), [artifact identity](../ios/artifact.json), [metadata/provenance](ios/metadata.json).
- All images were visually reviewed. Content, themes, icons, native insets and controls render without blank/loading/error overlays or horizontal clipping. Long alphabet, converter and voice content extends below the viewport and can be scrolled. The known R25 tile geometry remains P05 work; these images are migration evidence, not approval of that design.
- Android's initial empty voice list is a real observed state; the later populated capture follows Retry. iOS Reset Preferences follows the current dark system appearance while correctly selecting System and System Default voice.
- The separately labelled [iOS bulk-input diagnostic images](../ios/diagnostics/metadata.json) are **not** part of the 37 application captures. Bulk XCTest delivery still fails intermittently in minimal controlled and uncontrolled React Native fields; actual app key events without character sleeps, editing, native Paste and card assertions pass. [Investigation](../ios/README.md#input-investigation).

## Web

| Image | Theme | Verified state |
|---|---|---|
| [home desktop light](web/home-desktop-light.png) | light | Home, desktop |
| [home mobile dark](web/home-mobile-dark.png) | dark | Home, mobile browser width |
| [alphabet desktop light](web/alphabet-desktop-light.png) | light | Alphabet reference, top of scrollable list |
| [converter desktop light](web/converter-desktop-light.png) | light | Converter populated with CV34 7AP |
| [quiz question mobile dark](web/quiz-question-mobile-dark.png) | dark | Unanswered quiz question |
| [quiz feedback desktop light](web/quiz-feedback-desktop-light.png) | light | Answered quiz with persistent feedback and Next/Replay |
| [settings desktop light](web/settings-desktop-light.png) | light | Appearance/voice/reset settings |
| [voice mobile dark](web/voice-mobile-dark.png) | dark | Real browser voice enumeration / capability result |
| [audio help desktop light](web/audio-help-desktop-light.png) | light | Audio help after actual sound-test request |

## Android

| Image | Theme | Verified state |
|---|---|---|
| [home light](android/home-light.png) | light | Actual installed native Home; light theme |
| [converter empty light](android/converter-empty-light.png) | light | Empty converter; Play Full Phrase disabled |
| [converter populated light](android/converter-populated-light.png) | light | Exact bulk input CV34 7AP and all seven letter/digit cards asserted |
| [voice empty light](android/voice-empty-light.png) | light | Actual initial empty English voice list before engine enumeration settled; Retry available |
| [alphabet light](android/alphabet-light.png) | light | Native alphabet reference and playback controls |
| [quiz question light](android/quiz-question-light.png) | light | Unanswered native quiz with four choices |
| [quiz feedback light](android/quiz-feedback-light.png) | light | Quiz answer feedback; Next and Replay available |
| [audio help light](android/audio-help-light.png) | light | Native Audio Help and sound test |
| [menu cold light](android/menu-cold-light.png) | light | Cold native natophonetics://menu link |
| [settings dark](android/settings-dark.png) | dark | Dark chosen through native Settings |
| [home dark restarted](android/home-dark-restarted.png) | dark | Dark appearance persists through process restart |
| [voice light](android/voice-light.png) | light | Real Google TTS English voice enumeration after Retry; visible rows checked against current provider list |

## iOS

| Image | Theme | Verified state |
|---|---|---|
| [home light](ios/home-light.png) | light | Home, native header/status insets and feature controls |
| [alphabet light](ios/alphabet-light.png) | light | Alphabet reference with canonical A–H viewport |
| [converter empty light](ios/converter-empty-light.png) | light | Empty converter and disabled phrase button |
| [converter populated light](ios/converter-populated-light.png) | light | CV34 7AP; consecutive individual key events without artificial character sleeps, exact prefix/full value and all seven output cards asserted |
| [quiz light](ios/quiz-light.png) | light | Unanswered random quiz; four unique options and hidden answer |
| [quiz feedback light](ios/quiz-feedback-light.png) | light | Submitted answer; persistent feedback, Next and Replay asserted |
| [settings dark](ios/settings-dark.png) | dark | Dark appearance selected with ordinary app control |
| [home dark restarted](ios/home-dark-restarted.png) | dark | Saved dark theme retained after terminate/relaunch |
| [voice dark](ios/voice-dark.png) | dark | Real installed English voices and System Default |
| [audio help light](ios/audio-help-light.png) | light | Audio help and test controls |
| [menu cold light](ios/menu-cold-light.png) | light | Cold Menu URL, followed by asserted Back to App → Home |
| [audio playing](ios/audio-playing.png) | light | Real native provider request with visible playback progress and Stop |
| [converter edited](ios/converter-edited.png) | light | CV34 7XY after individual key events, deletion, append and Menu/Back; exact text and output asserted |
| [converter pasted](ios/converter-pasted.png) | light | CV34 7AP inserted through actual native clipboard Paste; full text/cards asserted |
| [legacy preferences migrated dark](ios/legacy-preferences-migrated-dark.png) | dark | Seeded legacy darkMode/selectedVoice restored in native app; persistent schema checked separately |
| [preferences reset](ios/preferences-reset.png) | system | Reset Preferences restores System appearance/System Default voice; unrelated storage sentinel remains |

## Remaining candidate scope

All three maintained targets now have P00 build/run/capture evidence. No other native target is declared. Session results, expanded drills, spoken practice and final portrait tile implementation remain their existing P05–P09 tasks; no missing feature screen was fabricated. P10.7 is still open for the integrated candidate. iOS 27 runtime behavior, broader device/iPad coverage, physical accessibility, listening/provider privacy/offline checks, signed upgrades and distribution remain explicitly unverified in P10/M11 as applicable.
