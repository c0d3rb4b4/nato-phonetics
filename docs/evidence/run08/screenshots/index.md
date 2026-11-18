# Run 08 screenshot evidence

17 November 2026 — **44 actual inspected PNGs**, tied to [source identity](../source-identity.json) and platform artifact/loaded-JavaScript manifests. No target capture is missing: web desktop/mobile, installed Android emulator and installed iOS simulator are represented. These are changed-flow evidence; P10.7’s integrated release set remains incomplete.

Original screenshot bytes are preserved. Browser capture uses Puppeteer against the independent production build; Android uses `adb -s emulator-5580 exec-out screencap -p`; iOS uses original `XCUIScreen.main.screenshot()` XCTest attachments exported with `xcresulttool`. [Inspection and per-image metadata](inspection.json) include hashes and candidate/platform information. Android and iOS each also retain their native capture metadata. Web [session metadata](web/sessions-metadata.json) is separate from [tile metadata](web/metadata.json); the latter explicitly records recovery after the initial shared-filename collision, without a fabricated rerun.

Known failures remain visible: live Android 2× feedback clips and previously mounted labels stay small; cold 2× sample labels and new review text are readable. Some iOS Debug images retain a developer warning toast. The web font-error image intentionally blocks bundled fonts. Scroll-edge partial tiles/text are reachable, and are distinguished from internal clipping. No images are mockups or another target’s substitute.

## web — 20 captures

| Actual image | State / theme / size |
|---|---|
| [alphabet-font-load-error.png](web/alphabet-font-load-error.png) | alphabet-font-load-error; system; text setting 1 |
| [dark-320-ended-early.png](web/dark-320-ended-early.png) | ended-early; dark; text setting 2 |
| [dark-320-feedback.png](web/dark-320-feedback.png) | feedback; dark; text setting 2 |
| [dark-320-question.png](web/dark-320-question.png) | question; dark; text setting 2 |
| [dark-320-results.png](web/dark-320-results.png) | results; dark; text setting 2 |
| [dark-320-retry-complete.png](web/dark-320-retry-complete.png) | retry-complete; dark; text setting 2 |
| [dark-320-setup-200-percent.png](web/dark-320-setup-200-percent.png) | setup-200-percent; dark; text setting 2 |
| [dark-320-setup.png](web/dark-320-setup.png) | setup; dark; text setting 1 |
| [light-1280-ended-early.png](web/light-1280-ended-early.png) | ended-early; light; text setting 1 |
| [light-1280-feedback.png](web/light-1280-feedback.png) | feedback; light; text setting 1 |
| [light-1280-question.png](web/light-1280-question.png) | question; light; text setting 1 |
| [light-1280-results.png](web/light-1280-results.png) | results; light; text setting 1 |
| [light-1280-retry-complete.png](web/light-1280-retry-complete.png) | retry-complete; light; text setting 1 |
| [light-1280-setup.png](web/light-1280-setup.png) | setup; light; text setting 1 |
| [quiz-narrow-200-dark-feedback.png](web/quiz-narrow-200-dark-feedback.png) | quiz-narrow-200-dark-feedback; dark; text setting 2 |
| [quiz-narrow-200-dark-first.png](web/quiz-narrow-200-dark-first.png) | quiz-narrow-200-dark-first; dark; text setting 2 |
| [quiz-narrow-200-dark-revealed.png](web/quiz-narrow-200-dark-revealed.png) | quiz-narrow-200-dark-revealed; dark; text setting 2 |
| [quiz-narrow-light-feedback.png](web/quiz-narrow-light-feedback.png) | quiz-narrow-light-feedback; light; text setting 1 |
| [quiz-narrow-light-first.png](web/quiz-narrow-light-first.png) | quiz-narrow-light-first; light; text setting 1 |
| [quiz-narrow-light-revealed.png](web/quiz-narrow-light-revealed.png) | quiz-narrow-light-revealed; light; text setting 1 |

## android — 15 captures

| Actual image | State / theme / size |
|---|---|
| [ended-early.png](android/ended-early.png) | Explicit early end preserves partial recap; dark; text setting 1 |
| [enlarged-question.png](android/enlarged-question.png) | Cold 2× quiz question and proportionally enlarged portrait tile; dark; text setting 2.0 |
| [feedback-cold-scale2-controls.png](android/feedback-cold-scale2-controls.png) | feedback-cold-scale2-controls; dark; text setting 2.0 |
| [feedback.png](android/feedback.png) | Wrong answer, persistent feedback and explicit controls; dark; text setting 1 |
| [question.png](android/question.png) | Concealed answer and progress; dark; text setting 1 |
| [results-cold-scale2.png](android/results-cold-scale2.png) | results-cold-scale2; dark; text setting 2.0 |
| [results-live-scale2.png](android/results-live-scale2.png) | results-live-scale2; dark; text setting 2.0 |
| [results.png](android/results.png) | Completed round and missed-answer recap; dark; text setting 1 |
| [retry-question.png](android/retry-question.png) | Retry creates a round from missed letters; dark; text setting 1 |
| [setup.png](android/setup.png) | Round length and memory-only disclosure; dark; text setting 1 |
| [submitted-live-scale2-controls.png](android/submitted-live-scale2-controls.png) | submitted-live-scale2-controls; dark; text setting 2.0 |
| [text-cold-scale1.png](android/text-cold-scale1.png) | text-cold-scale1; dark; text setting 1 |
| [text-cold-scale2.png](android/text-cold-scale2.png) | text-cold-scale2; dark; text setting 2.0 |
| [text-live-scale2.png](android/text-live-scale2.png) | text-live-scale2; dark; text setting 2.0 |
| [text-return-scale1.png](android/text-return-scale1.png) | text-return-scale1; dark; text setting 1.0 |

## ios — 9 captures

| Actual image | State / theme / size |
|---|---|
| [early-end-dark.png](ios/early-end-dark.png) | early-end-dark; dark; text setting large |
| [feedback-dark.png](ios/feedback-dark.png) | feedback-dark; dark; text setting large |
| [large-question-dark.png](ios/large-question-dark.png) | large-question-dark; dark; text setting accessibility-extra-extra-extra-large |
| [large-results-dark.png](ios/large-results-dark.png) | large-results-dark; dark; text setting accessibility-extra-extra-extra-large |
| [large-setup-dark.png](ios/large-setup-dark.png) | large-setup-dark; dark; text setting accessibility-extra-extra-extra-large |
| [question-dark.png](ios/question-dark.png) | question-dark; dark; text setting large |
| [results-dark.png](ios/results-dark.png) | results-dark; dark; text setting large |
| [retry-dark.png](ios/retry-dark.png) | retry-dark; dark; text setting large |
| [setup-dark.png](ios/setup-dark.png) | setup-dark; dark; text setting large |


Supplementary driver-only evidence: an inspected [iOS URL confirmation dialog](../ios/diagnostics/url-confirmation.png), captured through `simctl io screenshot`, explains a failed diagnostic navigation attempt. It is outside the 44 changed-flow captures and never substitutes for them.
