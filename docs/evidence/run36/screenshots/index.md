# Run 36 screenshot index

Captured on 22 November 2026 using production web build `1fe756c769262c15922755dd588c3cac4bfea97bd2951cccf9b200a6aacb0107` at `7350d269`. The local verification diff leaves all 22 built files identical to Run 35. The six images were visually inspected. [Capture commands, dimensions, runtimes, job links and SHA-256](../checks/screenshot-metadata.json).

| Target | State | Capture |
| --- | --- | --- |
| Chromium 159 Windows, 1280×900 light | Two pointer answers merged in Learning Progress | [Desktop merged progress](web/desktop-merged-progress.png) |
| Chrome 159 Windows, 320×568 dark | One unsaved answer after a real held lock, then two saved answers after Retry | [Lock timeout](web/narrow-lock-timeout.png) · [Retry result](web/narrow-retry-merged.png) |
| Chromium 159 Ubuntu, 320×568 dark | The hosted speech error covers Next. Dismiss is visible. Diagnostic. | [Quiz speech notice](web/hosted-chromium-audio-overlay.png) |
| Firefox 159 Ubuntu, 1280×900 dark | One saved answer is visible after reopening. The report records an uncontrolled page. Diagnostic. | [Firefox process failure](web/hosted-firefox-process-failure.png) |
| WebKit 27.2 Ubuntu, 1280×900 dark | Menu still shows offline ready where failed-update feedback was expected. Diagnostic. | [WebKit process failure](web/hosted-webkit-process-failure.png) |

Android and iOS captures of the browser test changes are inapplicable. The scoped Android retry state already has a capture on Run 34. A populated list capture remains missing under P05.9/P08.4 because the installed app returned the retry state again. Exact-ABI ARM captures require a process with mapped ARM libraries. Current installed iOS product captures need a suitable unsigned Xcode host under P05.2/P05.9/P06 and P10.7. [Run 34 Voice Select](../../run34/screenshots/index.md) · [Run 35 Android rollout](../../run35/screenshots/index.md).
