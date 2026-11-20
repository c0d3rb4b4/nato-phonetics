# Native window-resize verification preparation

17 November 2026, Run 05. The initial investigation read local tools/source and official platform documentation without changing the active simulator/emulator. Its subsequent separate XCTest now has [actual iPad window-resize evidence](ios/window-resize-report.md): tile reflow assertions pass, while visual inspection records a window-header overlap. This does not independently close all P05.8 or navigation acceptance.

## iPadOS

The retained pre-contrast iPad capture visibly shows the operating system's bottom-right resize handle. Apple's [iPadOS 26 feature list](https://www.apple.com/ca/os/pdf/All_New_Features_iPadOS_26_Sept_2025.pdf) describes resizing app windows from their bottom corners. The app opts into resizing with UIRequiresFullScreen=false and all iPad orientations; [Apple's migration note](https://developer.apple.com/documentation/technotes/tn3192-migrating-your-app-from-the-deprecated-uirequiresfullscreen-key) requires adapting to dynamic scene size changes.

Prepared [window-resize.swift](ios/window-resize.swift) and [project generator](ios/window-resize.rb) launch the installed final app, drag the actual OS resize handle inward, require its native scroll viewport to shrink by more than100pt and its column count to decrease, and assert110×150 tile frames. The test retains before/smaller/restored screenshots and actual frame logs, then drags outward. It requires the existing iPad Pro11/M5 simulator at default text scale. A failed gesture or unchanged viewport is a failure, never an inferred pass.

The local Xcode27.2 `simctl io` help also exposes `screenConfig geometry <width>x<height>[@scale]`. That changes simulated **screen** geometry; it does not prove OS app-window resizing. Similarly, [Simulator canvas scaling](https://developer.apple.com/documentation/xcode/configuring-a-simulator-for-your-environment) must not be mistaken for a changed app viewport.

## Android

The app targetsAPI36. [Android's multi-window documentation](https://developer.android.com/develop/ui/views/layout/support-multi-window-mode) describes resizable app windows and launch bounds. Read-only inspection of the [Android16 release shell source](https://android.googlesource.com/platform/frameworks/base/+/android-16.0.0_r1/services/core/java/com/android/server/am/ActivityManagerShellCommand.java) confirms `--windowingMode` for activity launch and `am task resize <taskId> <left> <top> <right> <bottom>`; bounds are four separate integer arguments.

No Android device was attached during this read-only investigation, so host source inspection does not establish emulator support. After the final Android matrix, the engineering follow-up is:

1. Inspect `adb shell pm list features` for `android.software.freeform_window_management`, plus the active task/window configuration. Keep the result as capability evidence.
2. On a capable image, launch the existing activity with windowing mode5 (freeform), determine its actual task ID, then resize that task to two different bounds. Assert actual app-window/React Native viewport dimensions change, tile geometry/fonts remain fixed, columns adapt and state survives. Capture the real OS window and restore its prior bounds/mode.
3. If the current image lacks freeform windows, use a suitable tablet/desktop Android emulator or test split-screen resizing through that image's System UI. This is agent/environment verification, not a human-only task. Do not force a fake completed check from accepted shell arguments alone.

`wm size` display overrides and orientation changes exercise native layout but are not equivalent to app-window multi-window resizing. Required unrun checks remain in P05.8 until actual execution supplies evidence.
