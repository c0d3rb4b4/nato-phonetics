# Run 38 screenshots

22 November 2026 · installed Android 16/API 36 x86_64 Release · 1080×2400 · system light · 1× font. These frames are from the engineering-signed **single-ABI** Run 37 Release, installed SHA-256 `e9e74b587c89034827cd6878c2e5e2f8b4d2ed1ffdbe5f232134c58def399981`. The unsigned original and all 488 matched entries are recorded in the [product controls](../controls.json).

| Inspected frame | Visible check |
| --- | --- |
| [Cold Release voice list](android/release-voices.png) | System Default is checked and 17 English voices are available. The last visible row continues below the scroll viewport. |
| [Local preview](android/release-preview.png) | Search leaves one voice. Its preview control shows Stop and System Default remains checked. |
| [Selection after restart](android/release-persisted.png) | Filtering after restart shows the local voice checked and System Default unchecked. |

Captured using `adb -s emulator-5580 exec-out screencap -p` from the installed production package in a read-only emulator instance. The recognition instrumentation has no product UI. The web recovery-driver captures follow below. The batch changed no iOS screens. P10.7 retains the missing integrated candidate set, including installed iOS rollout, maximum-text drag, Share and Speech disclosure on an Xcode host.

## Web recovery

All four frames show the production shell `af6b951339690f34f252a3d8073d4813f64f94917f2a2ac0983a82287c115df5` on 22 November 2026. Playwright 1.65.1 captured the viewport with `page.screenshot()`. The hosted failure is Linux Chromium 159.0.8154.6. The three local frames are Windows Chromium 159.0.8154.6 using the same hosted production archive and the controlled unavailable-voice replay.

| State | Frame |
| --- | --- |
| Hosted 1280×900 light, quota failure. Dismiss and Audio Help are visible over the pending Retry row. | [Covered Retry](web/hosted-retry-covered.png) |
| Local 1280×900 light. Dismissing the notice and double-clicking Retry saves one answer. | [Quota recovery](web/quota-1280-saved.png) |
| Local 320×568 dark. The notice covers part of the pending progress status. Dismiss remains reachable. | [Lock timeout](web/lock-320-pending.png) |
| Local 320×568 dark. After Dismiss and Retry the summary contains one correct answer. | [Saved progress](web/lock-320-saved.png) |

The singular count still reads “1 answers saved”. Its existing P3 trigger remains the next count-copy edit. [Command, viewport and capture metadata](../web/controlled-final.json) · [Hosted failure metadata](../web/hosted-recovery-failure.json).

## Universal Release converter

Captured 22 November 2026 with `adb -s emulator-5580 exec-out screencap -p` on the API 36 Google Play x86_64 guest, 1080×2400, light appearance, default text size. The engineering-signed universal APK has SHA-256 `10e5d09b8df818c839d76eaeba23f637918ae7aa9bfc997f3918fa8eebfc243b`. Both frames show the selected Converter tab at the same scroll position. The keyboard is hidden.

[Idle phrase](android/universal-converter-idle.png) shows 359 and the three digit bubbles. [Active phrase](android/universal-converter-active.png) shows Stop beside the same input and the inset ring on Three. [Provider requests, retained input and control bounds](../universal-runtime.json).
