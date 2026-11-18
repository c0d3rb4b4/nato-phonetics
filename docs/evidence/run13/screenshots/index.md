# Run 13 actual screenshot index

18 November 2026. **65 inspected primary original PNGs: 30 web, 17 Android, 18 iOS.** Actual production browser and installed native apps, with no mockups or platform substitution. Contact sheets are inspection aids; linked originals preserve the captured bytes.

Candidate: inherited uncommitted workspace over `784bb93c5cfb6edfd318d0dcec2d54d5bb222483`; [source manifest](../source-identity.json) `4dc2f135736464c36b4064e2503f17cf4b1f2ca70539b9ff98d786cb7130b357`; [source changes](../shared/source-changes.json) and [final build](../shared/build-web-final.log). Native binaries rehash unchanged from Run 12: [Android](../android/artifact.json) / [actual loaded JS](../android/loaded-javascript.json), [iOS](../ios/artifact.json) / [actual loaded JS](../ios/loaded-javascript.json). Loaded-source manifests link durable compressed copies with uncompressed/archive hashes. No native app/Release rebuild or final P10.7 claim.

Methods: Puppeteer `page.screenshot` on independent production web; `adb -s emulator-5580 exec-out screencap -p`; XCTest `XCUIScreen.main.screenshot()` attachments copied unchanged by `xcrun xcresulttool export attachments`. Capture commands, time, OS/browser/device, viewport, theme, font setting and hashes are in [web metadata](web/metadata.json), [web support metadata](web/support-metadata.json), [Android metadata](android/metadata.json), [iOS metadata](ios/metadata.json) and the [consolidated manifest](manifest.json). Android metadata resolves the actual native appearance (saved Dark, System→Light); iOS appearance is Dark. Web narrow progress uses actual 200% text enlargement; support copy uses default text.

Inspection: all originals were reviewed through final contact sheets plus direct Home images. No blank/loading image is accepted. Intentional browser write/delete/schema errors are labelled controlled branches. Long enlarged content extends beyond viewports: iOS symbol first/last edges are separately captured; button reachability and paragraph content are separate checks. Partial headings at scroll edges are viewport portions, not whole-page images. Android live 2× ordinary labels remain stale/small compared with cold 2×; **affected readability is not passed**. No font/metric/tolerance/scaling workaround.

Failure qualifications: iOS serial and maximum images are qualified checkpoints inside commands that subsequently fail; those commands remain failed. Separate due-letter/set-count/maximum-deleted-state/policy commands pass. Android first command qualifies answers/reset/due/cold deletion before a later inspector subprocess failure; separate rendered-ready relaunch/live and support commands pass. Exact logs/drivers and unrun evidence are in [iOS](../ios/README.md) and [Android](../android/README.md). [Pre-correction web captures](../web/pre-final-captures/metadata.json) remain separate from final images; deletion failure feedback was moved beside the controls and the affected suite recaptured.

Missing/unrun: **no supported target lacks changed-progress captures**. Full native candidate Home/About/settings/voice/reference/converter and complete enlarged-mode/all-symbol/runtime/orientation coverage are not refreshed by this batch; they remain P10.7 or the affected engineering tasks. Native forced storage failures/unknown schemas, iOS maximum direct long-page return-to-summary, concurrent browser-process coordination, original gesture/input/runtime residuals, Release and final integrated states remain unqualified. Physical AT/listening/provider/offline/backup/policy/distribution/release remain [M11, unperformed](../manual-handoff.md). No target/support/scope exception or release approval. P10.7 stays incomplete.

| Platform / original image | State / setting | Actual size | Capture time (UTC) |
|---|---|---|---|
| web / [light-1280-empty-due-review.png](web/light-1280-empty-due-review.png) | empty-due-review · light · text 1 | 1280×900 | 2026-11-18T11:37:27.243Z |
| web / [light-1280-save-error.png](web/light-1280-save-error.png) | save-error · light · text 1 | 1280×900 | 2026-11-18T11:37:27.464Z |
| web / [light-1280-saved-summary.png](web/light-1280-saved-summary.png) | saved-summary · light · text 1 | 1280×900 | 2026-11-18T11:37:28.424Z |
| web / [light-1280-saved-symbols.png](web/light-1280-saved-symbols.png) | saved-symbols · light · text 1 | 1280×900 | 2026-11-18T11:37:28.488Z |
| web / [light-1280-due-review-setup.png](web/light-1280-due-review-setup.png) | due-review-setup · light · text 1 | 1280×900 | 2026-11-18T11:37:30.326Z |
| web / [light-1280-due-review-question.png](web/light-1280-due-review-question.png) | due-review-question · light · text 1 | 1280×900 | 2026-11-18T11:37:30.447Z |
| web / [light-1280-recovered-summary.png](web/light-1280-recovered-summary.png) | recovered-summary · light · text 1 | 1280×900 | 2026-11-18T11:37:32.202Z |
| web / [light-1280-clear-confirmation.png](web/light-1280-clear-confirmation.png) | clear-confirmation · light · text 1 | 1280×900 | 2026-11-18T11:37:32.308Z |
| web / [light-1280-clear-error.png](web/light-1280-clear-error.png) | clear-error · light · text 1 | 1280×900 | 2026-11-18T11:37:32.457Z |
| web / [light-1280-cleared-summary.png](web/light-1280-cleared-summary.png) | cleared-summary · light · text 1 | 1280×900 | 2026-11-18T11:37:32.540Z |
| web / [light-1280-unsupported-schema.png](web/light-1280-unsupported-schema.png) | unsupported-schema · light · text 1 | 1280×900 | 2026-11-18T11:37:33.204Z |
| web / [dark-320-empty-due-review.png](web/dark-320-empty-due-review.png) | empty-due-review · dark · text 2 | 320×568 | 2026-11-18T11:37:35.332Z |
| web / [dark-320-save-error.png](web/dark-320-save-error.png) | save-error · dark · text 2 | 320×568 | 2026-11-18T11:37:35.612Z |
| web / [dark-320-saved-summary.png](web/dark-320-saved-summary.png) | saved-summary · dark · text 2 | 320×568 | 2026-11-18T11:37:37.354Z |
| web / [dark-320-saved-symbols.png](web/dark-320-saved-symbols.png) | saved-symbols · dark · text 2 | 320×568 | 2026-11-18T11:37:37.398Z |
| web / [dark-320-due-review-setup.png](web/dark-320-due-review-setup.png) | due-review-setup · dark · text 2 | 320×568 | 2026-11-18T11:37:39.431Z |
| web / [dark-320-due-review-question.png](web/dark-320-due-review-question.png) | due-review-question · dark · text 2 | 320×568 | 2026-11-18T11:37:39.562Z |
| web / [dark-320-recovered-summary.png](web/dark-320-recovered-summary.png) | recovered-summary · dark · text 2 | 320×568 | 2026-11-18T11:37:41.047Z |
| web / [dark-320-clear-confirmation.png](web/dark-320-clear-confirmation.png) | clear-confirmation · dark · text 2 | 320×568 | 2026-11-18T11:37:41.129Z |
| web / [dark-320-clear-error.png](web/dark-320-clear-error.png) | clear-error · dark · text 2 | 320×568 | 2026-11-18T11:37:41.264Z |
| web / [dark-320-cleared-summary.png](web/dark-320-cleared-summary.png) | cleared-summary · dark · text 2 | 320×568 | 2026-11-18T11:37:41.347Z |
| web / [dark-320-unsupported-schema.png](web/dark-320-unsupported-schema.png) | unsupported-schema · dark · text 2 | 320×568 | 2026-11-18T11:37:42.336Z |
| web / [home-support-1280.png](web/home-support-1280.png) | home updated discovery/help/local-progress inventory · light · text 1 | 1280×900 | 2026-11-18T11:44:41.581Z |
| web / [audio-help-support-1280.png](web/audio-help-support-1280.png) | audio-help updated discovery/help/local-progress inventory · light · text 1 | 1280×900 | 2026-11-18T11:44:42.381Z |
| web / [privacy-support-1280.png](web/privacy-support-1280.png) | privacy updated discovery/help/local-progress inventory · light · text 1 | 1280×900 | 2026-11-18T11:44:43.610Z |
| web / [about-support-1280.png](web/about-support-1280.png) | about updated discovery/help/local-progress inventory · light · text 1 | 1280×900 | 2026-11-18T11:44:44.703Z |
| web / [home-support-320.png](web/home-support-320.png) | home updated discovery/help/local-progress inventory · dark · text 1 | 320×568 | 2026-11-18T11:44:46.407Z |
| web / [audio-help-support-320.png](web/audio-help-support-320.png) | audio-help updated discovery/help/local-progress inventory · dark · text 1 | 320×568 | 2026-11-18T11:44:47.395Z |
| web / [privacy-support-320.png](web/privacy-support-320.png) | privacy updated discovery/help/local-progress inventory · dark · text 1 | 320×568 | 2026-11-18T11:44:48.395Z |
| web / [about-support-320.png](web/about-support-320.png) | about updated discovery/help/local-progress inventory · dark · text 1 | 320×568 | 2026-11-18T11:44:49.397Z |
| android / [empty-progress.png](android/empty-progress.png) | No saved progress; default text · dark · text 1 | 720×1600 | 2026-11-18T11:54:26Z |
| android / [empty-due-review.png](android/empty-due-review.png) | No due digits; full practice remains available · dark · text 1 | 720×1600 | 2026-11-18T11:55:07Z |
| android / [saved-summary-relaunched.png](android/saved-summary-relaunched.png) | Saved aggregate survives force-stop and relaunch · dark · text 1 | 720×1600 | 2026-11-18T11:56:27Z |
| android / [saved-symbols.png](android/saved-symbols.png) | Per-symbol attempts/errors and due status · dark · text 1 | 720×1600 | 2026-11-18T11:56:35Z |
| android / [due-review-setup.png](android/due-review-setup.png) | Exactly one missed digit is due after preference reset · light · text 1 | 720×1600 | 2026-11-18T11:57:11Z |
| android / [due-review-question.png](android/due-review-question.png) | One-symbol review through unchanged shared tile · light · text 1 | 720×1600 | 2026-11-18T11:57:26Z |
| android / [recovered-summary.png](android/recovered-summary.png) | Six saved answers; no symbols currently due or last missed · light · text 1 | 720×1600 | 2026-11-18T11:57:43Z |
| android / [clear-confirmation.png](android/clear-confirmation.png) | Explicit deletion confirmation; preferences retained · light · text 1 | 720×1600 | 2026-11-18T11:57:59Z |
| android / [cold-scale2-summary.png](android/cold-scale2-summary.png) | Cold configured 2x progress summary; scrolling viewport · light · text 2.0 | 720×1600 | 2026-11-18T11:58:14Z |
| android / [cold-scale2-symbols.png](android/cold-scale2-symbols.png) | Cold configured 2x per-symbol information · light · text 2.0 | 720×1600 | 2026-11-18T11:58:31Z |
| android / [cold-scale2-clear-confirmation.png](android/cold-scale2-clear-confirmation.png) | Cold configured 2x delete and keep controls · light · text 2.0 | 720×1600 | 2026-11-18T11:58:52Z |
| android / [cold-scale2-cleared-summary.png](android/cold-scale2-cleared-summary.png) | Scoped deletion; saved zero summary at cold 2x · light · text 2.0 | 720×1600 | 2026-11-18T11:59:01Z |
| android / [cleared-summary-relaunched.png](android/cleared-summary-relaunched.png) | Zero saved summary after native relaunch and rendered readiness · light · text 1 | 720×1600 | 2026-11-18T12:00:20Z |
| android / [live-scale2-summary.png](android/live-scale2-summary.png) | Live 1x to 2x ordinary labels; affected readability remains open · light · text 2.0 | 720×1600 | 2026-11-18T12:00:25Z |
| android / [privacy-local-progress.png](android/privacy-local-progress.png) | Actual new local aggregate record and no-account/sync disclosure · light · text 1.0 | 720×1600 | 2026-11-18T12:00:38Z |
| android / [privacy-progress-deletion.png](android/privacy-progress-deletion.png) | Actual scoped progress deletion and preference/backup controls · light · text 1.0 | 720×1600 | 2026-11-18T12:01:00Z |
| android / [help-local-progress.png](android/help-local-progress.png) | Updated progress/text-alternative/reset help · light · text 1.0 | 720×1600 | 2026-11-18T12:01:13Z |
| ios / [saved-symbols.png](ios/saved-symbols.png) | saved-symbols · dark · text large | 1206×2622 | 2026-11-18T11:39:39.802000+00:00 |
| ios / [saved-summary-relaunched.png](ios/saved-summary-relaunched.png) | saved-summary-relaunched · dark · text large | 1206×2622 | 2026-11-18T11:39:37.141000+00:00 |
| ios / [empty-due-review.png](ios/empty-due-review.png) | empty-due-review · dark · text large | 1206×2622 | 2026-11-18T11:39:12.725000+00:00 |
| ios / [empty-progress.png](ios/empty-progress.png) | empty-progress · dark · text large | 1206×2622 | 2026-11-18T11:38:52.633000+00:00 |
| ios / [clear-confirmation.png](ios/clear-confirmation.png) | clear-confirmation · dark · text large | 1206×2622 | 2026-11-18T11:42:54.037000+00:00 |
| ios / [recovered-summary.png](ios/recovered-summary.png) | recovered-summary · dark · text large | 1206×2622 | 2026-11-18T11:42:48.173000+00:00 |
| ios / [due-review-question.png](ios/due-review-question.png) | due-review-question · dark · text large | 1206×2622 | 2026-11-18T11:42:38.404000+00:00 |
| ios / [due-review-setup.png](ios/due-review-setup.png) | due-review-setup · dark · text large | 1206×2622 | 2026-11-18T11:42:35.359000+00:00 |
| ios / [letter-set-count.png](ios/letter-set-count.png) | letter-set-count · dark · text large | 1206×2622 | 2026-11-18T11:43:40.065000+00:00 |
| ios / [digit-set-count.png](ios/digit-set-count.png) | digit-set-count · dark · text large | 1206×2622 | 2026-11-18T11:43:39.324000+00:00 |
| ios / [maximum-clear-confirmation.png](ios/maximum-clear-confirmation.png) | maximum-clear-confirmation · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T11:47:59.195000+00:00 |
| ios / [maximum-symbol-bottom.png](ios/maximum-symbol-bottom.png) | maximum-symbol-bottom · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T11:47:22.199000+00:00 |
| ios / [maximum-symbol-top.png](ios/maximum-symbol-top.png) | maximum-symbol-top · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T11:47:21.010000+00:00 |
| ios / [maximum-summary.png](ios/maximum-summary.png) | maximum-summary · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T11:46:53.159000+00:00 |
| ios / [maximum-cleared-summary.png](ios/maximum-cleared-summary.png) | maximum-cleared-summary · dark · text accessibility-extra-extra-extra-large | 1206×2622 | 2026-11-18T11:49:57.233000+00:00 |
| ios / [help-local-progress.png](ios/help-local-progress.png) | help-local-progress · dark · text large | 1206×2622 | 2026-11-18T11:52:51.767000+00:00 |
| ios / [privacy-progress-deletion.png](ios/privacy-progress-deletion.png) | privacy-progress-deletion · dark · text large | 1206×2622 | 2026-11-18T11:52:41.291000+00:00 |
| ios / [privacy-local-progress.png](ios/privacy-local-progress.png) | privacy-local-progress · dark · text large | 1206×2622 | 2026-11-18T11:52:29.674000+00:00 |
