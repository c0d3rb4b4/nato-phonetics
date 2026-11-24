# Run 41 screenshots

24 November 2026. All 22 images are original captures of installed apps or real browser states. Each was inspected. Android identifies each installed APK by SHA-256. The Firefox reports identify the starting archive, expected forward build and transition. Chromium used the final production export. [Image hashes](inventory.json) · [Candidate identities](../identity.json).

## Android

The installed test-signed Release hash starts with `9d0a2b6f`. The earlier published Develop APK starts with `3412115c`. The Android 11 Google APIs x86 guest used 720×1600 at 280 dpi. The Android 16 Google Play x86_64 guest used 1080×2400 at 420 dpi. Captures used `adb -s <serial> exec-out screencap -p` through the [installed replay](../product/practice.py). The API 30 and API 36 ABI labels here describe the guest/package selection. ARM process mapping remains a separate gate.

| Artifact and appearance | Screen state and inspected captures |
| --- | --- |
| Android 11, published baseline, light/default | [Spoken round discovers local recognition is unavailable](android/legacy-unavailable.png) · [Typed fallback scored correctly](android/legacy-checked.png) |
| Android 11, final Release, light/default | [Three available modes and OS requirement](android/api30-legacy-setup.png) · [Correct typed answer](android/api30-typed-checked.png) |
| Android 11, final Release, dark/2× | [Quiz setup with complete version notice and wrapping choices](android/api30-large-setup.png) |
| Android 11, final Release, light/default | [Audio Help](android/api30-audio-help.png) · [Spoken answers privacy disclosure](android/api30-privacy.png) · [About feature list](android/api30-about.png) · [Site Map quiz description](android/api30-sitemap.png) |
| Android 16, final Release, light/1× | [Spoken mode selected](android/api36-spoken-setup.png) · [Idle Start and editable answer](android/api36-start.png) · [Missing en-US model before permission](android/api36-missing-model.png) · [Explicitly checked typed fallback](android/api36-typed-checked.png) |

## Web

Firefox 159 ran on Ubuntu 24.04 under WSL2 using Playwright 1.65.1 with Caddy 2.11.9. Its final archive hash starts with `6c5d5147`; the archived Run 40 input starts with `dfdd9881`. The changed waiting-state screenshots show the original shell while the forward update waits. The cold success shows the forward shell. Captures used Playwright's `page.screenshot` in the linked runners. [Firefox commands](../firefox/README.md) · [Detailed viewport, appearance and build metadata](../firefox/handoff-captures.json).

| Candidate and viewport | Screen state and inspected captures |
| --- | --- |
| Final integrated Firefox, 1280×900/light | [Menu with update instructions](web/firefox-desktop-update-handoff.png) · [Connected Menu confirms offline readiness](web/firefox-desktop-handoff-ready.png) |
| Final integrated Firefox, 320×568/dark | [Complete narrow update instructions](web/firefox-narrow-update-handoff.png) · [First cold offline visit after following the instructions](web/firefox-narrow-handoff-offline.png) |
| Final integrated Firefox, 320×568/dark, failed process-quit path | [First offline visit displays the browser error](web/firefox-integrated-first-offline.png) |
| Archived input, Firefox, 320×568/dark | [First offline visit from the untouched closed profile](web/firefox-first-offline.png) · [Saved progress on the subsequent verified recovery](web/firefox-recovered-offline.png) |
| Final export, Chromium 159.0.8154.6 on Windows | Updated policy at [1280×900/light](web/privacy-1280.png) and [320×568/dark](web/privacy-320.png). Both captures followed real typed submission in the same browser context. [Replay](../product/web-practice.cjs) |

## Missing captures

The installed iOS policy date and current app screens lack new captures. The Windows host has no Xcode/simctl, and the repository had no registered runner available for this unsigned UI check. P05/P06/P10.7 engineering owns the installed iOS pass. The Android version notice and web update instructions apply only on their respective platforms.

An Android recognized word in the editable field still lacks a verified screenshot. The qualified Android 16 recorder did not match the supplied synthetic word, and the fresh final-Release guest had no installed model. Resume P09 on a qualified input/provider pair. The browser model experiment changed no app flow. The final integrated three-target P10.7 set and all M11 physical checks remain open.
