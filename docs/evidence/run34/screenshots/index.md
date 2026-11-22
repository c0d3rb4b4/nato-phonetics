# Run 34 app screenshots · 22 November 2026

The web PNGs came from the actual production app in Edge 157.0.4341.60 on Windows. The baseline export is from clean `d313296`, shell `d75a6f25da23bcc88dbc996f36acb186d71c41bb32cf397a704f315e17957098`. The final export uses the reviewed Run 34 patch, shell `b9276dd127a690ace2c43549bed8d98ffe844615982ad86483fbada03a70ffdd`. Each browser capture records viewport, appearance, state, capture command and candidate in the linked metadata.

| Flow | Inspected captures |
| --- | --- |
| Matched light comparisons | Reference 375×667 [before](web/before-reference-light.png) and [after](web/after-reference-light.png). Populated Converter 375×667 [before](web/before-converter-light.png) and [after](web/after-converter-light.png). Menu 1280×900 [before](web/before-menu-light.png) and [after](web/after-menu-light.png). Settings 375×667 [before](web/before-settings-light.png) and [after](web/after-settings-light.png). [Comparison metadata](web/comparison.json) |
| Menu and Settings | Dark desktop keyboard focus [Menu](web/menu-desktop-keyboard-focus.png) and [Settings](web/settings-desktop-keyboard-focus.png). Dark 320×568/200% [Menu rows](web/menu-320-200-percent.png), [Converter choices](web/settings-320-200-percent-converter.png) and [Reset](web/settings-320-200-percent-reset.png). |
| Menu web availability | Actual worker [ready](web/desktop-offline-ready.png), [failed download](web/update-download-failed.png), [waiting update](web/desktop-update-waiting.png), [narrow 200% offline](web/narrow-dark-200-offline-status.png) and [unavailable](web/narrow-unavailable.png). [Worker capture metadata](web/offline-metadata.json) |
| Voice and Audio Help | Dark 320×568/200% [voice picker](web/voices-320-200-percent.png), [empty filter](web/voice-filters-320-200-percent-no-match.png), [test idle](web/audio-help-320-200-percent-idle.png) and [test playing](web/audio-help-320-200-percent-playing.png). Desktop [empty filter](web/voice-filters-desktop-no-match.png). Voice enumeration and active speech in these images use the browser test provider. |
| Site Map and baseline screens | Dark mobile [Site Map](web/sitemap-mobile.png), [Reference](web/reference-mobile-letters.png) and desktop [populated Converter](web/converter-desktop.png). [Browser capture metadata](web/app-metadata.json) |

## Installed Android

The development APK `c361ff2262761af3639d15dc151c0dcba7c16c74f92eaa27cb3e586a478490b0` ran with Metro stopped on Android 16/API 36 x86_64, emulator `5572`, 1080×2400 at 420 dpi. The captures came from `adb -s emulator-5572 exec-out screencap -p`. UI hierarchies and image digests are paired with the frames. [Frame metadata and original command result](android/metadata.json) · [collector](../check-android.py).

| Flow | Inspected captures |
| --- | --- |
| Reference | System light at 1× on [Letters](android/reference-letters.png) and [Digits](android/reference-digits.png). |
| Menu and Settings | [Light Menu](android/menu-default.png), [light Settings](android/settings-default.png), [Dark and Full cards](android/settings-dark.png), [Menu at 2×](android/menu-dark-enlarged.png) and [Settings at 2×](android/settings-dark-enlarged.png). |
| Converter | `NUWJ359` with [keyboard open](android/converter-keyboard.png) and [full cards after dismissal](android/converter-cards.png) at 1×/dark. |
| Support | [Voice list failure and Retry](android/voice-select.png), [Audio Help](android/audio-help.png) and [Site Map](android/sitemap.png) at 1×/dark. The installed guest returned a voice-list error despite an enumerated TTS service. A populated Android voice list and native filter captures remain open for P05.9 on a working provider. |
| Initial reset sequence | [Reference after attempted reset sequence](android/reset-sequence-failed.png). This is a diagnostic frame from the failed assertion looking for System in Settings. |
| Scoped reset retest | [Reachable reset control](android/settings-reset-controls.png) at 1×/dark and [System defaults after reset and relaunch](android/settings-reset-restored.png) at 1×/light. [Retest metadata and command](android/reset-metadata.json) |

## Missing iOS captures

Changed-flow iOS captures are pending P05.9/P10.7. Windows could export the iOS bundle but could not run Xcode or simctl. The former hosted unsigned simulator workflows are disabled, and the current production lane requires the approved `main` environment. Resume with the Run 34 candidate on an unsigned Xcode simulator host. Capture Menu, Settings, Voice Select, Audio Help, Site Map and the shared Reference and Converter controls. Physical checks stay in M11.
