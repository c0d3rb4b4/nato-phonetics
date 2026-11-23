# Run 40 changed-flow captures

Captured and visually inspected 22 November 2026. The [identity report](../identity.json) binds every PNG to its SHA-256 and records the candidate’s changed-source hashes. [Installed verification](../README.md#installed-results-and-remaining-gate).

## Android

Standalone Develop APK `572b31373a4f4932bbf0f3f864e347153f69d71d663ace10335b75574e652dab`, installed as `com.natophonetics.app.dev`. Read-only Medium Phone, Android 16/API 36 x86_64 Google Play image, 1080×2400 at 420 dpi. Light appearance at 1× unless indicated. All captures use `adb -s emulator-5586 exec-out screencap -p` through the [installed app driver](../android.py).

| Flow | Inspected states |
|---|---|
| Select and start | [Spoken mode selected](android/setup.png) · [Question before permission](android/question.png) · [OS microphone dialog](android/permission.png) |
| Recover and stop | [Denied with typed fallback](android/denied.png) · [Recording indicator and Stop](android/recording.png) · [Silence recovery](android/silence.png) · [After explicit Stop](android/stop.png) |
| Check an answer | [Typed correction before scoring](android/edited.png) · [Submitted correction and feedback](android/checked.png) |
| Enlarged controls | [Dark 2× idle](android/large-idle.png) · [Dark 2× recording at matching position](android/large-recording.png) |
| Discover and understand | [Audio Help](android/audio-help.png) · [Complete spoken privacy paragraph](android/privacy.png) · [About](android/about.png) · [Site Map](android/site-map.png) |

The idle and active controls occupy the same position. The dark 2× pair shows the recording status wrapping above the editable field, with Check answer still visible. The complete privacy paragraph is visible after scrolling. The two correction images contain an explicitly typed sample. No screenshot or transcript of a recognized result is claimed.

## Production web

Local production shell `66e8aaca6efcca6b07c3ece9c0a708cfaafefab6c4afde688fbc4c66976ca025`, Windows Chromium 159.0.8154.6. The [browser driver](../web.cjs) opens the built routes and uses Playwright page screenshots at the stated viewport. The web microphone wording is visible in Menu. Privacy shows the local-data disclosure in both layouts. The browser also completed a typed quiz submission.

| Appearance and viewport | Captures |
|---|---|
| Light, 1280×900 | [Menu](web/menu-1280.png) · [Privacy](web/privacy-1280.png) |
| Dark, 320×568 | [Menu](web/menu-320.png) · [Privacy](web/privacy-320.png) |

## Missing and inapplicable

No installed iOS capture was available on this Windows host. P09/P10.7 retain the iOS provider, updated shared policy screen and integrated captures for an Xcode simulator/device host. Web and iOS currently expose no spoken option, so there is no recording UI to photograph there. P10.7 and physical M11 acceptance remain open.
