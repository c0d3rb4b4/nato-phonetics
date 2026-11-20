# Isolated UIKit input control — 16 November 2026

This diagnostic tests whether the same bulk XCTest input fails without React Native or NATO Phonetics application logic. It does not replace application acceptance or its screenshots.

A separate unsigned UIKit application, `com.natophonetics.inputcontrol`, contains one ordinary `UITextField` with all-character capitalization, autocorrection disabled and spell checking disabled. There are no JavaScript, React Native, conversion, speech, navigation or controlled-value callbacks. The [test](InputControlUITests.swift) launches that app, taps the field, asserts that the software keyboard exists and is hittable, waits two seconds, types `CV34 7AP` in one `typeText` call, waits one second and asserts the exact value. Xcode repeats the test three times.

Actual result: **3 tests, 0 failures**, 41.726 seconds, test command exit **0**. Every iteration reported the exact full string. The unsigned build, install, attachment export and removal of the diagnostic app/runner also exited0. NATO Phonetics was preserved and returned to the foreground afterward. See [build log](build.log), [test log](test.log), and [environment/commands/artifact hash](environment.json).

The control ran on the same iPhone17Pro / iOS26.2 simulator using Xcode27.2. It is a small Debug UIKit application, whereas NATO Phonetics is a Release React Native application with conversion output and additional layout work. These three passes show that the bulk-injection call can succeed in this environment. They do **not** establish that the application defect is caused by React Native, rule out intermittent XCTest/simulator behavior, or resolve the application's observed dropped characters. P00.6/P06 retain that engineering follow-up.

All three exported images were inspected. [Iteration1](attachments/AFEB7E44-42CB-4669-971F-C92324F3741A.png) visibly shows the exact text and keyboard. Iterations2/3 are mostly black except the field outline, despite the passing accessibility-value assertions; their visual result is unusable and the cause is unproven. They are retained as diagnostics in the [attachment manifest](attachments/manifest.json), with hashes/inspection results in environment.json. None is a NATO Phonetics product screenshot.

Reproduction from the repository root, using a new temporary output directory and the intended available simulator:

```sh
GEM_HOME=/private/tmp/nato-ruby33-gems GEM_PATH=/private/tmp/nato-ruby33-gems \
  /opt/homebrew/opt/ruby@3.3/bin/ruby docs/evidence/run03/input-control/generate.rb /private/tmp/new-input-control
export DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer
xcodebuild build-for-testing \
  -project /private/tmp/new-input-control/InputControl.xcodeproj -scheme InputControl \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath /private/tmp/new-input-control/build CODE_SIGNING_ALLOWED=NO
xcrun simctl install 0653F7EC-9237-4AC5-A264-12969E625070 \
  /private/tmp/new-input-control/build/Build/Products/Debug-iphonesimulator/InputControl.app
xcodebuild test-without-building \
  -project /private/tmp/new-input-control/InputControl.xcodeproj -scheme InputControl \
  -destination 'platform=iOS Simulator,id=0653F7EC-9237-4AC5-A264-12969E625070' \
  -derivedDataPath /private/tmp/new-input-control/build \
  -resultBundlePath /private/tmp/new-input-control/Control.xcresult \
  -parallel-testing-enabled NO -test-iterations 3 CODE_SIGNING_ALLOWED=NO
xcrun simctl uninstall 0653F7EC-9237-4AC5-A264-12969E625070 com.natophonetics.inputcontrol
xcrun simctl uninstall 0653F7EC-9237-4AC5-A264-12969E625070 com.natophonetics.inputcontroltests.xctrunner
```

The exact paths used for this run are in environment.json. No simulator keyboard preference, application source, candidate bundle, dependency or user data was modified by this diagnostic.
