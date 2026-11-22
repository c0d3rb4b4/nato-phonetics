# Run 35 screenshots

## Production web

The 21 PNGs came from Edge 157.0.4341.60 on Windows on 22 November 2026. The served app and the independent locked export matched all 22 file digests. The shell ID is `1fe756c769262c15922755dd588c3cac4bfea97bd2951cccf9b200a6aacb0107`. Desktop captures are 1280×900. Narrow captures use 320×568 with 200% text where noted below. The browser speech provider is controlled in the learning checks. [Capture commands, theme, scale and SHA-256](web/metadata.json) · [Export identity](../checks/identities.json).

| Flow | Inspected images |
| --- | --- |
| Setup and selection | [Listening setup, desktop light](web/light-1280-listening-setup.png) · [Typed choice and keyboard focus, narrow dark at 200%](web/quiz-setup-320-200-percent.png) |
| Listening and typed recall | [Concealed listening question](web/dark-320-listening-question.png) · [Text alternative](web/dark-320-listening-text-alternative.png) · [Retained typed draft](web/dark-320-typed-keyboard.png) · [Typed feedback and Next](web/dark-320-typed-feedback.png) · [Typed results](web/dark-320-typed-results.png). All use narrow dark at 200%. The web draft frame does not show a system keyboard. |
| Review and saved progress | [One-question result, desktop light](web/light-1280-single-question-result.png) · [Saved totals, desktop light](web/light-1280-saved-summary.png) · [Saved totals](web/dark-320-saved-summary.png) · [Due symbol row](web/dark-320-saved-symbols.png). The last two use narrow dark at 200%. |
| Storage recovery and deletion | [Failed save and Retry](web/dark-320-save-error.png) · [Delete or keep](web/dark-320-clear-confirmation.png) · [Failed deletion](web/dark-320-clear-error.png) · [Cleared totals](web/dark-320-cleared-summary.png). All use narrow dark at 200%. |
| Support and recovery | [About and support link focus, desktop dark](web/about-desktop-support.png) · [Full Speech policy ending](web/privacy-320-200-percent-speech-ending.png) · [Unknown route and Site Map action](web/not-found-320-200-percent.png). Privacy and the unknown route use narrow dark at 200%. |
| Shared guardrails | [Reference](web/reference-mobile-letters.png) · [Populated Converter](web/converter-desktop.png) · [Choice quiz after submission at 200%](web/quiz-320-200-percent.png). |

## Installed Android

The 15 PNGs came from the development APK `c30ca0d912e1bd56bd895f5f5d6790525036a419a09f3f419d9b57429a1e4ecb`, installed on Android 16/API 36 x86_64 on 22 November 2026. The guest uses 1080×2400 and 420 dpi. The collector compared installed APK bytes, checked that Metro was disconnected, and captured through `adb -s emulator-5574 exec-out screencap -p`. It saved the corresponding UI hierarchies. [Candidate, capture state and SHA-256](android/metadata.json) · [Collector](../check-android.py).

| Flow | Inspected images |
| --- | --- |
| Quiz setup and listening | [Setup](android/quiz-setup-light.png) · [Concealed question](android/listening-concealed-light.png) · [Text alternative](android/listening-text-light.png). All use 1× light. |
| Typed recall and recovery | [Real keyboard and draft](android/typed-keyboard-dark-2x.png) · [Provider notice](android/audio-notice-dark-2x.png) · [Feedback after dismissal](android/typed-feedback-dark-2x.png) · [Early recap](android/round-review-dark-2x.png). All use 2× dark. |
| Progress | [Saved totals](android/progress-summary-dark-2x.png) · [Saved symbol](android/progress-symbol-dark-2x.png) · [Confirmation reached](android/progress-confirm-dark-2x.png) · [Cleared](android/progress-cleared-dark-2x.png). The confirmation capture is at the scroll edge. Both actions were reached and exercised by touch in the walkthrough. |
| Support | [About links](android/about-dark-2x.png) · [Speech section heading during scrolling](android/privacy-speech-dark-2x.png) · [Full Speech paragraph and microphone-access ending](android/privacy-speech-ending-dark-2x.png) · [Unknown-route recovery](android/not-found-dark-2x.png). All use 2× dark. |

The first driver attempted an [offscreen Start node](diagnostics/offscreen-node.png). The second touched Audio Help through an [unexpected provider notice over the quiz actions](diagnostics/audio-notice-route.png). The final run used the same APK with positive visible bounds and explicit notice dismissal.

## iOS captures pending

The candidate exported an iOS Metro bundle on Windows. This host has neither Xcode nor simctl, there are zero registered self-hosted runners, and the earlier unsigned simulator workflows are disabled. P05.9/P10.7 own the missing installed captures for quiz setup and recall, Learning Progress, About, Privacy Policy and unknown-route recovery, plus the prior pilot. On an unsigned Xcode host, verify the full Speech policy ending at default and maximum text and the largest-text progress navigation and deletion. [Bundle identity](../checks/identities.json) · [Host inventory](../checks/ios-host.txt).
