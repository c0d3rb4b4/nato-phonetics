# Run 11 actual screenshot index

18 November 2026. **55 inspected primary original PNG captures: 21 web, 15 Android, 19 iOS.** Actual production browser / installed native apps; no mockups or platform substitution. Inspection sheets in each platform report are review aids; linked PNGs preserve original bytes.

Candidate: inherited uncommitted workspace over `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; [source manifest](../source-identity.json) `348a12b08c63a01c9b20105f031beb856fc2358731355b13be1ee41470a25130`. Production build: [log](../shared/web-build-qualified.log). Native binaries rehashed unchanged; actual loaded Metro graphs archived separately: [Android artifact](../android/artifact.json) / [JS](../android/loaded-javascript.json), [iOS artifact](../ios/artifact.json) / [final JS](../ios/loaded-javascript.json). The earlier default iOS practice checkpoint uses [its separately preserved graph](../ios/practice-loaded-javascript.json), before voice/ARIA/policy additions; numeric implementation is unchanged. Only XCTest runners compiled; no new app/Release binary or full integrated P10.7 claim.

Capture methods: Puppeteer `page.screenshot` of the independent production build, `adb -s emulator-5580 exec-out screencap -p`, and XCTest `XCUIScreen.main.screenshot()` attachments exported with `xcrun xcresulttool export attachments` and copied unchanged. Date/browser/device/viewport/theme/text scale/OS/source log/command and SHA-256 are retained in [web numeric metadata](web/metadata.json), [web voice metadata](web/app-metadata.json), [Android metadata](android/metadata.json), [iOS metadata](ios/metadata.json). [Consolidated hashes](manifest.json).

Inspection: all primary images inspected via platform contact sheets; no blank/loading captures accepted. Default/native numeric/reference/example/voice flows are shown. Debug warning toasts remain labelled in iOS frames; browser no-match/error states are intentional. Maximum iOS portrait cards preserve proportions and require horizontal scrolling beyond the visible viewport, so some frames show only part of a card. Android live-scale image visibly FAILS ordinary instruction/label readability; it is retained as failed P05.2 evidence, not a pass. Cold configured 2× is distinct. Scrolled-off content at viewport edges is not a whole-content screenshot or proof of lost content.

Supplemental [13 letter-regression images and metadata](../letter-regression/screenshots/web/sessions-metadata.json) were also inspected and retained, separate from the primary changed-flow count. Failed/interrupted attempt logs/drivers and [pre-ARIA web diagnostic](../web/pre-aria-voice-no-match.png) / [first maximum iOS checkpoint](../ios/maximum-start-checkpoint.png) remain in platform reports; they are not final passing captures.

Missing/unrun: **no supported target lacks a changed-flow capture**. Maximum native voice search/locale/focus combinations, physical AT/listening, original long-drag/Release reach, broader support/orientation/runtime/final integrated states remain P05/P06/P08/P10.7 engineering or the explicitly human [M11 queue](../manual-handoff.md). Historical strict ink failures remain open and no font/design/tolerance change is inferred. P10.7 stays incomplete; these are batch captures, not an accepted final release set.

| Platform / original image | State / setting | Actual size | Capture time (UTC) |
|---|---|---|---|
| web / [light-1280-digit-reference.png](web/light-1280-digit-reference.png) | digit-reference · light · text 1 | 1280×900 | 2026-11-18T10:30:58.797Z |
| web / [light-1280-numeric-setup.png](web/light-1280-numeric-setup.png) | numeric-setup · light · text 1 | 1280×900 | 2026-11-18T10:30:59.872Z |
| web / [light-1280-numeric-question.png](web/light-1280-numeric-question.png) | numeric-question · light · text 1 | 1280×900 | 2026-11-18T10:30:59.989Z |
| web / [light-1280-numeric-feedback.png](web/light-1280-numeric-feedback.png) | numeric-feedback · light · text 1 | 1280×900 | 2026-11-18T10:31:00.289Z |
| web / [light-1280-numeric-results.png](web/light-1280-numeric-results.png) | numeric-results · light · text 1 | 1280×900 | 2026-11-18T10:31:00.883Z |
| web / [light-1280-mixed-results.png](web/light-1280-mixed-results.png) | mixed-results · light · text 1 | 1280×900 | 2026-11-18T10:31:03.845Z |
| web / [light-1280-postcode-example.png](web/light-1280-postcode-example.png) | postcode-example · light · text 1 | 1280×900 | 2026-11-18T10:31:04.167Z |
| web / [light-1280-callsign-example.png](web/light-1280-callsign-example.png) | callsign-example · light · text 1 | 1280×900 | 2026-11-18T10:31:04.680Z |
| web / [light-1280-callsign-results.png](web/light-1280-callsign-results.png) | callsign-results · light · text 1 | 1280×900 | 2026-11-18T10:31:05.165Z |
| web / [dark-320-digit-reference.png](web/dark-320-digit-reference.png) | digit-reference · dark · text 2 | 320×568 | 2026-11-18T10:31:06.880Z |
| web / [dark-320-numeric-setup.png](web/dark-320-numeric-setup.png) | numeric-setup · dark · text 2 | 320×568 | 2026-11-18T10:31:07.709Z |
| web / [dark-320-numeric-question.png](web/dark-320-numeric-question.png) | numeric-question · dark · text 2 | 320×568 | 2026-11-18T10:31:07.789Z |
| web / [dark-320-numeric-feedback.png](web/dark-320-numeric-feedback.png) | numeric-feedback · dark · text 2 | 320×568 | 2026-11-18T10:31:07.975Z |
| web / [dark-320-numeric-results.png](web/dark-320-numeric-results.png) | numeric-results · dark · text 2 | 320×568 | 2026-11-18T10:31:08.476Z |
| web / [dark-320-mixed-results.png](web/dark-320-mixed-results.png) | mixed-results · dark · text 2 | 320×568 | 2026-11-18T10:31:11.437Z |
| web / [dark-320-postcode-example.png](web/dark-320-postcode-example.png) | postcode-example · dark · text 2 | 320×568 | 2026-11-18T10:31:11.608Z |
| web / [dark-320-callsign-example.png](web/dark-320-callsign-example.png) | callsign-example · dark · text 2 | 320×568 | 2026-11-18T10:31:12.075Z |
| web / [dark-320-callsign-results.png](web/dark-320-callsign-results.png) | callsign-results · dark · text 2 | 320×568 | 2026-11-18T10:31:12.559Z |
| web / [voice-filters-desktop-no-match.png](web/voice-filters-desktop-no-match.png) | voice-filters-desktop-no-match · dark · text 1 | 1280×900 | 2026-11-18T10:31:03.603Z |
| web / [voices-320-200-percent.png](web/voices-320-200-percent.png) | voices-320-200-percent · dark · text 2 | 320×568 | 2026-11-18T10:31:04.123Z |
| web / [voice-filters-320-200-percent-no-match.png](web/voice-filters-320-200-percent-no-match.png) | voice-filters-320-200-percent-no-match · dark · text 2 | 320×568 | 2026-11-18T10:31:04.550Z |
| android / [digit-reference.png](android/digit-reference.png) | New ten-digit reference with canonical word and pronunciation guide · dark · text 1 | 720×1600 | 2026-11-18T10:38:32Z |
| android / [numeric-setup.png](android/numeric-setup.png) | Digits selected before starting new numeric round · dark · text 1 | 720×1600 | 2026-11-18T10:38:52Z |
| android / [numeric-question.png](android/numeric-question.png) | Concealed numeric question; four choices below in scroll area · dark · text 1 | 720×1600 | 2026-11-18T10:39:09Z |
| android / [numeric-feedback.png](android/numeric-feedback.png) | Submitted numeric answer with explicit Next and Replay · dark · text 1 | 720×1600 | 2026-11-18T10:39:21Z |
| android / [numeric-results.png](android/numeric-results.png) | Five answered numeric round; misses and retry available · dark · text 1 | 720×1600 | 2026-11-18T10:40:47Z |
| android / [mixed-question.png](android/mixed-question.png) | Mixed symbol set uses the existing guarded session and shared tile · dark · text 1 | 720×1600 | 2026-11-18T10:41:15Z |
| android / [postcode-example.png](android/postcode-example.png) | Postcode symbols with full canonical example text · dark · text 1 | 720×1600 | 2026-11-18T10:41:31Z |
| android / [callsign-example.png](android/callsign-example.png) | Callsign symbols with full canonical example text · dark · text 1 | 720×1600 | 2026-11-18T10:42:06Z |
| android / [voice-no-match.png](android/voice-no-match.png) | Actual installed voice search no-match; saved voice unchanged · dark · text 1 | 720×1600 | 2026-11-18T10:42:46Z |
| android / [voice-reset.png](android/voice-reset.png) | Reset voice filters restores all English voices · dark · text 1 | 720×1600 | 2026-11-18T10:42:59Z |
| android / [numeric-cold-scale2-setup.png](android/numeric-cold-scale2-setup.png) | Cold 2x new numeric setup; inspect ordinary labels · dark · text 2.0 | 720×1600 | 2026-11-18T10:43:19Z |
| android / [numeric-cold-scale2-question.png](android/numeric-cold-scale2-question.png) | Cold 2x numeric tile/prompt; inspect reachable scrolling · dark · text 2.0 | 720×1600 | 2026-11-18T10:43:37Z |
| android / [numeric-live-scale2-question.png](android/numeric-live-scale2-question.png) | Live 1x to 2x; inherited ordinary-text sizing remains under P05.2 · dark · text 2.0 | 720×1600 | 2026-11-18T10:44:03Z |
| android / [voice-checked-no-match.png](android/voice-checked-no-match.png) | Asserted native no-match count; System Default remains above · dark · text 1 | 720×1600 | 2026-11-18T10:46:08Z |
| android / [voice-checked-reset.png](android/voice-checked-reset.png) | Asserted nonempty restored list and exact unchanged preferences after Reset · dark · text 1 | 720×1600 | 2026-11-18T10:46:25Z |
| ios / [callsign-partial-results.png](ios/callsign-partial-results.png) | callsign-partial-results · dark · text large | 1206×2622 | 2026-11-18T10:26:03.859000+00:00 |
| ios / [callsign-example.png](ios/callsign-example.png) | callsign-example · dark · text large | 1206×2622 | 2026-11-18T10:26:02.121000+00:00 |
| ios / [postcode-example.png](ios/postcode-example.png) | postcode-example · dark · text large | 1206×2622 | 2026-11-18T10:25:56.298000+00:00 |
| ios / [mixed-question.png](ios/mixed-question.png) | mixed-question · dark · text large | 1206×2622 | 2026-11-18T10:25:51.029000+00:00 |
| ios / [numeric-results.png](ios/numeric-results.png) | numeric-results · dark · text large | 1206×2622 | 2026-11-18T10:25:02.833000+00:00 |
| ios / [numeric-feedback.png](ios/numeric-feedback.png) | numeric-feedback · dark · text large | 1206×2622 | 2026-11-18T10:24:57.272000+00:00 |
| ios / [numeric-question.png](ios/numeric-question.png) | numeric-question · dark · text large | 1206×2622 | 2026-11-18T10:24:55.005000+00:00 |
| ios / [numeric-setup.png](ios/numeric-setup.png) | numeric-setup · dark · text large | 1206×2622 | 2026-11-18T10:24:53.753000+00:00 |
| ios / [digit-reference.png](ios/digit-reference.png) | digit-reference · dark · text large | 1206×2622 | 2026-11-18T10:24:48.937000+00:00 |
| ios / [replay-without-keyboard.png](ios/replay-without-keyboard.png) | replay-without-keyboard · dark · text large | 1206×2622 | 2026-11-18T10:31:49.743000+00:00 |
| ios / [replay-cycle-1.png](ios/replay-cycle-1.png) | replay-cycle-1 · dark · text large | 1206×2622 | 2026-11-18T10:31:39.177000+00:00 |
| ios / [replay-cycle-0.png](ios/replay-cycle-0.png) | replay-cycle-0 · dark · text large | 1206×2622 | 2026-11-18T10:31:31.452000+00:00 |
| ios / [voice-search-reset.png](ios/voice-search-reset.png) | voice-search-reset · dark · text large | 1206×2622 | 2026-11-18T10:32:10.565000+00:00 |
| ios / [voice-search-no-match.png](ios/voice-search-no-match.png) | voice-search-no-match · dark · text large | 1206×2622 | 2026-11-18T10:32:07.063000+00:00 |
| ios / [numeric-partial-results-maximum.png](ios/numeric-partial-results-maximum.png) | numeric-partial-results-maximum · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T10:36:15.544000+00:00 |
| ios / [numeric-feedback-maximum.png](ios/numeric-feedback-maximum.png) | numeric-feedback-maximum · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T10:36:08.357000+00:00 |
| ios / [numeric-question-maximum.png](ios/numeric-question-maximum.png) | numeric-question-maximum · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T10:36:01.461000+00:00 |
| ios / [numeric-setup-maximum.png](ios/numeric-setup-maximum.png) | numeric-setup-maximum · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T10:35:44.765000+00:00 |
| ios / [digit-reference-maximum.png](ios/digit-reference-maximum.png) | digit-reference-maximum · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T10:35:39.868000+00:00 |
