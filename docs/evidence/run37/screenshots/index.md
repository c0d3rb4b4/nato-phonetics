# Run 37 screenshots

Captured on 22 November 2026 from the installed Android app in a read-only instance of the Run 35 API 36 Google Play x86_64 AVD. All captures use `adb -s emulator-5580 exec-out screencap -p`. Native display 1080×2400, density 420, light appearance and 1× text unless stated otherwise.

[Original failure](android/before-retry.png) shows the previous Run 35 APK offering Retry. System Default is selected.

Only the Android source set and package registration changed. Web and iOS have no changed user-facing flow in this batch. Existing production web evidence retains its Run 35/36 scope. Installed iOS rollout, maximum-text drag, Share and Speech disclosure still require a simulator or device on an Xcode host. Final integrated P10.7 captures remain open.

| Candidate state | Inspected frames |
| --- | --- |
| Light, 1× | [Full list](android/voice-list.png) · [One filtered voice](android/filtered.png) · [Preview active with System Default still checked](android/preview.png) · [Explicit saved selection](android/selected.png) |
| Dark, 2× | [Full list and wrapping controls](android/large-list.png) · [Scrolled to the complete matching row](android/large-filtered.png) · [Same row during preview](android/large-preview.png) |

The enlarged scrolled frames start partway down System Default. The matching row and its Play/Stop control are fully visible. For the candidate and original APK identities and SHA-256 of each capture, see the [capture inventory](../identity.json).
