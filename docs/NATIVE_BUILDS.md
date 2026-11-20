# Direct native builds

**Run30 current Android checkpoint — 20 November 2026:** original complete production Release tile contexts on unchanged APK5dfa45d2 now pass505 actual native baselines/217 ink observations, with93 scoped window and21 complete-narrow baselines, retained converter/quiz state and explicit Next.30 actual Android captures inspected.11 scoped tests/lint pass; observer/selection failures remain archived. Ordinary clean/default source integration and exact-artifact retests are next P1; broader runtime/integrated/M11 acceptance remains open. Default Maven retains the historical defect. [Evidence](evidence/run30/README.md), [screenshots](evidence/run30/screenshots/index.md), [next Android](evidence/run30/android/next-android.md).

**Historical Run29 Android checkpoint — 20 November 2026:** an inspector-free, test-only Release fixture/native observer now passes60 strict frame/widget comparisons,12resize/12narrow and3edit checks on the exact preserved Release native/Hermes payload.487 other non-signature APK entries, including dependency metadata, match the original. Scoped unchanged production Release converter/submitted quiz/Next samples,12tests/lint and40inspected actual captures pass. Full production Release baseline/ink/context/window acceptance, ordinary clean/default integration and other ABI runtime remain open P1. Initial tool/packaging failures are retained and corrected final qualification is separate. [Evidence](evidence/run29/README.md), [captures](evidence/run29/screenshots/index.md), [next P1](evidence/run29/android/next-android.md).


The repository owns `android/` and `ios/`. They originate from the official [`@react-native-community/template@0.81.5`](https://www.npmjs.com/package/@react-native-community/template/v/0.81.5), adapted directly without prebuild. Gradle, CocoaPods and Xcode call React Native's own CLI/scripts. Eclipse Timer's local artifact pattern informed this setup; its hosted-build integrations were not copied.

The app retains `com.natophonetics.app`, version `1.0.0` (native build number `1`), `natophonetics://` links, the application branding and AsyncStorage `2.2.0`. Native registration is `NATOPhonetics`. Configured deployment minimums are Android API 24 and iOS 15.1. Run 05 enables phone/tablet orientation changes and removes the iPad full-screen requirement for responsive tile layouts; configuration is not runtime acceptance on every OS/device/window size. Neither macOS, Windows, watchOS nor Wear OS is a configured target.

Tile fonts are bundled from `assets/fonts/` into Android assets and Xcode resources. Startup validates the required native faces before React renders, and Android registers each exact face in React Native's font cache. Changing these files requires rebuilding both native apps, not only refreshing Metro. Font provenance, hashes and geometry are in [TILE_DESIGN.md](TILE_DESIGN.md); browser assets are emitted by the web build's local TTF loader.

Run 05 also adds the Android `TileTypography` module. It reverses the OS SP conversion for each desired logical text size so Android 14+'s nonlinear accessibility sizing can preserve one scale for the complete tile; `allowFontScaling` stays enabled. Rebuild/install the APK after this native-module addition. Shared text layout measures each rendered baseline and aligns its inner text to the versioned target without changing the outer boxes. [Run 05 evidence](evidence/run05/README.md) distinguishes original scaling/baseline failures from the corrected candidate and records the actual tested OS/device matrix.

The [release runbook](RELEASE_RUNBOOK.md) maps version/build metadata, distribution artifacts, web hosting and rollback to final P10/M11 acceptance. Run 15 adds browser-only progress coordination; native keeps its existing adapter, key removal and rendered policy. No new native build or runtime pass is inferred.

## Toolchain and locks

| Tool | Repository choice |
|---|---|
| Node / npm | `22.23.0` / `10.9.4`; `.nvmrc`, engines and `package-lock.json` |
| React Native / community CLI | `0.81.5` / `20.2.0` (Run23 qualified) |
| Metro family | `0.83.8` within existing RN ranges; [Run 17 parser removal and qualification](evidence/run17/README.md) |
| Java | JDK 17; Run 03 found Temurin `17.0.13` locally |
| Gradle / Android Gradle plugin | Wrapper `8.14.3`, checked distribution SHA-256; plugin `8.11.0` from the pinned RN Gradle package |
| Android SDK | Platform `36`, Build Tools `36.0.0`, NDK `27.1.12297006`; Kotlin `2.1.20` |
| Ruby / Bundler | Ruby `3.3.13` (`.ruby-version`); Bundler `2.4.22`; `Gemfile.lock` |
| CocoaPods / xcodeproj | `1.16.2` / `1.27.0`, pinned by `Gemfile.lock` |
| Xcode | React Native 0.81 documents Xcode 16.1+ as a prerequisite. Verified unsigned simulator build: `27.2 (27B52)`, Apple clang 21, with the version-guarded fmt 11.0.2 compatibility patch below. Runtime launch checked on iOS 26.2; iOS 27 remains unverified. |

React Native's [environment guide](https://reactnative.dev/docs/0.81/set-up-your-environment) describes toolchain setup. Choose an installed JDK using `JAVA_HOME`, an SDK using `ANDROID_HOME`, and Xcode per command using `DEVELOPER_DIR`; these are machine paths and must not be committed. `.xcode.env.local` may set a stable `NODE_BINARY` for Xcode started outside your terminal. Do not use Apple's system Ruby: the current host's Ruby 2.6 lacks required development headers. On this host the new Homebrew OpenSSL installation lacked its default CA link; the verified retry used `SSL_CERT_FILE=/opt/homebrew/etc/ca-certificates/cert.pem` (the existing trusted CA bundle), retaining TLS verification. The Podfile also raises older dependency resource-target minimums to the app's iOS 15.1 minimum so current Xcode SDKs can compile them.

From the repository root, install the locked application graph with `npm ci`. For iOS run `bundle install`, then `npm run ios:pods`. The checked `ios/Podfile.lock` was generated by a real CocoaPods installation. Use `bundle exec pod install --deployment --project-directory=ios` in locked verification. A successful dependency installation alone is not a verified native application build. `npm ci` must keep lifecycle scripts enabled: Run 18 adds the [guarded merged Yoga precision backport](NATIVE_TEXT_PRECISION.md) to source-built iOS. Run `npm run check:yoga` with a C++20 compiler, then rebuild/install iOS; Metro refresh alone cannot apply it. The standard Android Maven native library is unchanged.

## Android

Install the documented SDK packages with Android Studio or the Android CLI. Command-line tools revision 23 delegates `sdkmanager` to `android sdk install`; `sdkmanager --licenses` alone only warns and exits, so it does not establish package installation or licence state. Use an explicit install command such as `android --sdk="$ANDROID_HOME" sdk install "platforms;android-36" "build-tools;36.0.0" "ndk;27.1.12297006"`, reviewing any terms presented. The owner's Run 04 command completed without a separate acceptance prompt; the SDK now has its licence record and Gradle reports the required licences accepted. This resolves the technical SDK prerequisite; it is not a claim about an unseen agreement interaction. Use `adb devices -l` to confirm an authorized emulator/device.

```sh
npm run start
# In another shell with the same Node/Java/SDK environment:
npm run build:android:debug
adb reverse tcp:8081 tcp:8081
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.natophonetics.app/.MainActivity
adb shell am start -W -a android.intent.action.VIEW -d natophonetics://menu com.natophonetics.app
```

Debug uses Metro at port 8081 and the checked-in public React Native development keystore. A debug key is not a release credential and may differ from a prior installed build's key. Do not uninstall a user's existing install merely to bypass a signature mismatch: that deletes its local learning/preferences data. Use a clean emulator for debug tests and an appropriately signed upgrade for M11 migration acceptance.

```sh
npm run build:android:release
```

The release bundle is `android/app/build/outputs/bundle/release/app-release.aab`. It contains bundled JavaScript. Run 17 directly builds all four configured architectures and records the [unsigned AAB/embedded-bundle hashes](evidence/run17/android/release-artifact.json) and [actual signature inspection](evidence/run17/android/release-signature.log). This available artifact remains separate from signed internal-distribution acceptance. With no private credentials it remains unsigned. Set all four `NATO_UPLOAD_STORE_FILE`, `NATO_UPLOAD_STORE_PASSWORD`, `NATO_UPLOAD_KEY_ALIAS`, `NATO_UPLOAD_KEY_PASSWORD` values through the local environment/CI secret store to sign it; partial configuration fails rather than silently signing with a debug key. Keep the keystore and values outside this repository. Store submission is a separate M11 action.

### P05.2 Android source candidate — Run26, acceptance still active

Run29 also provides a separate, exact-payload Release fixture and SDK-only native
observer when the development inspector is unavailable. Use the pinned toolchain
and the [fixture build/collect/gate commands](../tests/fixtures/android-font-scale/README.md#inspector-free-release-fixture-run29).
This diagnostic replaces only embedded JS in a locally signed copy, preserves all
non-signature metadata/native/DEX/manifest entries and never changes the original
product artifact. It qualifies framework fixture behavior, not production JS or
full Release tile fidelity. Do not install the fixture as a product/distribution
candidate. [Final payload manifest](evidence/run29/android/fixture-payload-identity-final.json).

**Historical Run28 qualification:** all configured source Release ABIs have
compile/package qualification (ARM64 Run27; armeabi-v7a/x86/x86_64 Run28).
Exact payload/Hermes/ELF/prefab/header and consumer links pass; fresh ARM64
six-case runtime and4 inspected actual captures pass. Other ABI execution,
full Release affected gates and clean default integration remain open P1.
[Evidence/products](evidence/run28/README.md),
[exact next observation/gate](evidence/run28/android/next-android.md).

`NATO_BUILD_JOBS=1..4` now also controls Metro's separate worker pool when
explicitly supplied, including the existing host/native wrappers. An unspecified
value preserves Metro's default. Set1 for the serialized source commands below;
Gradle's `--max-workers` alone did not cap the observed8 Metro workers. One x86
setup/write failure and an emulator disk rejection remain archived; passing
retries followed measured cache/resource recovery. Only generated compile caches
were reclaimed; future builds may be cold. No fixed free-space minimum is imposed.

**Historical Run27 qualification update:** F1 original complete tile scope passes625 native
baselines/271 ink observations. Actual source ARM64 unsigned Release APK/AAB,
six native cases and five real-product composition checkpoints pass. Other
ABIs/full Release affected gates and clean default integration remain active;
ordinary builds still consume Maven and retain the historical defect.
[Exact artifacts/evidence](evidence/run27/README.md),
[current F2 command and checkpoint](evidence/run27/android/next-android.md).
Do not repeat unchanged F1 or treat the opt-in build as default integration.

For source Release, use the existing pinned environment/guards and replace the
Debug task with `:app:assembleRelease :app:bundleRelease`; select the intended
ABI explicitly. Run27 qualifies only `-PreactNativeArchitectures=arm64-v8a`.
Originals are unsigned. The separate local development-signed test copy retains
the exact original payload and remains non-debuggable; no private signing or
distribution acceptance follows. [Artifact identity and signature checks](evidence/run27/android/release-artifacts.json).

The standalone C++ helper supports `--release` and explicit ABI selection:

```sh
ANDROID_HOME=... python3 scripts/build-android-font-native.py <release-prefab> <output> --release
ANDROID_HOME=... python3 scripts/build-android-font-native.py <release-prefab> <output> --release --abi armeabi-v7a
```

This selects the actual production class layout from `react/debug/flags.h`;
Debug and `arm64-v8a` are the defaults; `armeabi-v7a`, `x86` and `x86_64` select
their matching compiler target and exported/fbjni libraries. ELF class/machine,
Sealable/debug-string mode and exported-header mismatches are rejected before
compiling. Font-generation ABI detection handles both 32-bit and 64-bit
`uint64_t` encodings. The six explicit
result predicates are identical in both variants. First Release link with old
Debug macros failed and remains archived; correct Debug/Release compiles and
actual Release execution pass. This is test-tool ABI matching, not a product
assertion override. [Compile and runtime](evidence/run27/android/native-release/native-result.json).

For the real product composition test on a non-debuggable Release app, install
a separately development-signed local copy with the same certificate as the
test APK, then append `--external-evidence` to
`scripts/run-android-font-instrumentation.py TEST_APK EXACT_APP_APK OUTPUT SERIAL`.
This opt-in exports report/captures to the app's external files directory rather
than requiring `run-as`; the isolated test APK alone creates that test data.
The runner requires all five expected checkpoints and actual PNGs plus exact
APK identities and successful instrumentation. Preserve the unsigned originals
and remove exported test files after collection. No product permission/storage
or native repair source changes. [Fixture guide](../tests/fixtures/android-font-scale/README.md),
[actual Release command](evidence/run27/android/release-composition-command.json).


Ordinary builds still consume Maven RN0.81.5. The opt-in candidate uses the
exact installed npm source and hash-guarded patches; it has not yet passed all
P05.2 application acceptance. Read [current checkpoints](evidence/run28/shared/forecast.md)
before resuming. Do not mistake an edited C++ file for an installed repair.

With the pinned Node22.23.0/JDK17/SDK36/NDK27.1.12297006 environment:

```sh
npm run prepare:android:source
cd android
./gradlew :app:dependencyInsight --dependency react-android --configuration debugRuntimeClasspath -PnatoReactNativeSource=true --max-workers=1
NATO_BUILD_JOBS=1 ./gradlew :app:assembleDebug -PnatoReactNativeSource=true -PreactNativeArchitectures=arm64-v8a --max-workers=1 '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:ActiveProcessorCount=2'
```

The [official composite-build path](https://reactnative.dev/contributing/how-to-build-from-source)
is pinned to0.81.5 without a nightly upgrade. CMake3.30.5 is installed by the SDK
on first use. The guarded build-only edit makes ReactAndroid compile against
the same Maven Hermes0.81.5 prefab as the app, avoiding a redundant Hermes
source build and its observed archive-prefix extraction failure. Explicit
CMake compile/link job pools serialize Ninja; CMAKE_BUILD_PARALLEL_LEVEL alone
does not constrain AGP's direct Ninja invocation. Inspect actual disk and swap
at checkpoints. Run26 removes only owned, regenerable obsolete native
intermediates and retains APK/AAB/source/evidence. All other ABIs and release
qualification remain required before integrating a repair.

The ordinary-text runtime regression uses normal AppRegistry startup:

```sh
npx --no-install react-native start --config tests/fixtures/android-font-scale/metro.config.cjs
# In another shell, after installing the intended APK without clearing data:
adb -s emulator-5580 reverse tcp:8081 tcp:8081
ANDROID_SERIAL=emulator-5580 npm run check:android:font-scale -- artifacts/font-scale --sweep --editing
```

It records APK/fixture identity, frames, native widget content height, mount/value
retention, strict one-pixel live/cold comparisons and actual screenshots. The
full invocation checks60 frame/widget comparisons and3 committed-edit state
checks. Correct outer frames alone cannot qualify editable glyph sizing. A collected red report exits1.
Historical samples can exercise the same gate with
`node scripts/verify-android-font-scale.cjs --samples docs/evidence/run20/android/samples.json`.
This must fail the three original controls. After fixture use, stop its Metro,
restore the ordinary Metro config and restart the product process; restore
the captured font-scale value even on failure. Never replace a live React root.
The separate [native executable](../scripts/native-tests/font-environment.cpp)
links actual candidate RN/Yoga; build it with
`ANDROID_HOME=... python3 scripts/build-android-font-native.py <exact-prefab> <output>`.
Its RN_SERIALIZABLE_STATE ABI define must match the app. Use the exact candidate
libraries for execution, record hashes and retain the original red control.
It isolates renderer context/owner propagation; Android SP/JNI, focus/composition
and real application acceptance are separate checks.

Run26 extends this to six actual native regression cases: two font-change
owner paths, two generation-only owner paths, adoption of clean JS children
from an older font environment, and the actual RN measurement cache under a
changed simulated SP environment. All native measurement bodies are preserved;
the Android fixture supplies actual SP/JNI/frame acceptance. The input driver
uses UIAutomator physical bounds, types before scale changes, and checks exact
text/interior caret/focus/height afterward. Invoke its full scope with
`--sweep --editing`; failed whole commands stay failed.

The source repair tracks the font environment through Android surface JNI,
LayoutContext and Yoga configuration/adoption, and independently keys the
measurement/line caches by the actual SP environment. The getter observes
public `TypedValue` SP conversion and density; it does not replace Android's
nonlinear scaling. All shared C++ changes are Android-guarded. Exact original
and patched hashes, [reviewable source diff](evidence/run26/android/font-environment-final.patch),
[artifact identities](evidence/run26/android/candidate-adoption.json) and
[checkpoints](evidence/run26/shared/forecast.md) identify the candidate. Source
preparation checks every file before writing and refreshes stale exported
headers before Gradle. Never mix old prefab headers with the new library.

The standard Maven path remains unchanged as the failed control. Do not infer
default-source integration, all-ABI/Release, IME composition, full tile/raster,
resized-window or physical acceptance from an ARM64 Debug candidate. Actual
P05.2 status and the exact next Android subtask live in the delivery plan.

## iOS

Select a working Xcode using `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer`. `xcodebuild -version` and `xcrun simctl list devices available` should work before building. First-launch setup, an unaccepted Apple license or a broken Xcode installation needs machine-owner action; simulator signing itself needs no developer account.

```sh
bundle install
npm run ios:pods
npm run build:ios:simulator
xcrun simctl boot <simulator-udid>
xcrun simctl bootstatus <simulator-udid> -b
xcrun simctl install <simulator-udid> artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app
xcrun simctl launch <simulator-udid> com.natophonetics.app
xcrun simctl openurl <simulator-udid> natophonetics://menu
```

The simulator command directly calls `xcodebuild` for the host architecture, produces a Release app with bundled JS, and disables code signing. `npm run ios` is the CLI development path and uses Metro. For distribution, configure the correct Apple team and provisioning in Xcode, then run:

```sh
npm run build:ios:archive
NATO_EXPORT_OPTIONS_PLIST=/absolute/local/ExportOptions.plist npm run build:ios:export
```

Archive: `artifacts/NATOPhonetics.xcarchive`. Exported IPA: `artifacts/ios-export/`. The export plist and private signing material stay outside source control. Missing signing access does not block unsigned simulator work. No command publishes to a store.

## Validation and actual screenshots

After lint/types/tests and the final production web build, validate the native candidate: install/launch, cold `natophonetics://menu`, back/Home, all screens, saved-theme restart, native voice selection/Stop/navigation cancellation and status/inset layout. Preserve the AsyncStorage version/key migration; an actual upgrade test with prior signed app/data remains M11. Run 14 regenerates launcher/splash consumers from outlined sources, verifies packaged resources and captures actual native appearance; physical launcher/device acceptance remains M11. See [release asset generation](RELEASE_ASSETS.md).

Capture the running app with the platform tools, not a browser approximation:

```sh
adb exec-out screencap -p > docs/evidence/<run>/android-home-light.png
xcrun simctl io <simulator-udid> screenshot docs/evidence/<run>/ios-home-light.png
```

Capture the screens/states required by `DELIVERY_PLAN.md`, record OS/device/theme/viewport, source manifest and artifact SHA-256, and link the images in the run's evidence index. If a build/install/run prerequisite fails, record the command, exit and cause and leave that platform's capture open. No placeholder qualifies as a screenshot. Native permission/speech-provider/listening and physical accessibility checks remain in M11 even after automated builds and screenshots pass.

## Run 03 native verification, 16 November 2026

- Source configuration, plist/XML parsing, Ruby syntax, Xcode project identity inspection and locked Bundler resolution passed: [native static checks](evidence/run03-native-static-checks.txt). The [native consumer scan](evidence/run03-native-residual-scan.txt) found no Expo/EAS usage in Gradle, native projects/Pod lock or bundling scripts. Upstream React Native's Pod installation message mentions an optional Expo command; it was not invoked.
- CocoaPods installed and locked **75 Pods**, including AsyncStorage, safe-area-context and TextToSpeech; final `bundle exec pod install --deployment --project-directory=ios` passed: [locked Pod evidence](evidence/run03-pod-final-locked.txt). The generated `ios/Podfile.lock` and workspace are repository-owned. Corrected the dependency resource-target deployment floor to iOS 15.1 after Xcode rejected AsyncStorage's older 13.4 resource target.
- The final direct Android debug attempt built React Native's Gradle plugins, then exited **1** because the SDK's NDK `27.1.12297006` license is unaccepted: [Android compile attempt](evidence/run03-android-build-retry.txt). SDK components and an emulator/device remain unavailable; [ADB listed no devices](evidence/run03-android-devices.txt). The machine owner must review/accept applicable SDK terms (M11.2); subsequent installation, compiling, running and captures remain P00 engineering work.
- The initial unsigned iOS simulator attempt reached real C++ compilation and exited **65** in `fmt 11.0.2`, with consteval format-string errors under Xcode 27.2: [iOS compile attempt](evidence/run03-ios-build-verified-attempt.txt). This matches the upstream [fmt report](https://github.com/fmtlib/fmt/issues/4740) and [React Native report](https://github.com/react/react-native/issues/55601). A subsequent bounded retry applies `ios/scripts/patch_fmt.rb` from the Podfile: it requires fmt 11.0.2 and the exact original source pattern, fails on drift, and selects fmt's existing runtime-checked fallback on Apple clang 21+. This disables the failing consteval path for that compiler while retaining runtime format validation. Its actual installed-header idempotence, source/version drift guards and Apple clang preprocessor fallback were [checked successfully](evidence/run03-fmt-patch-checks.txt); it must be reviewed/removed when the fmt dependency changes. The initial failed attempt is retained as diagnosis. The [patched direct simulator build](evidence/run03-ios-build-patched.txt) then **passed**, followed by successful [install and launch](evidence/run03-ios-install-launch.txt) on iPhone 17 Pro / iOS 26.2. [Artifact identity and SHA-256 hashes](evidence/run03-ios-artifact.json) record the actual unsigned Release app, version 1.0.0 (1), SDK 27.2 and minimum deployment 15.1.
- The final controlled-input candidate [rebuilt successfully](evidence/run03-ios-final-input-build.txt) and [installed/launched](evidence/run03-ios-final-input-install-launch.txt); [artifact hashes](evidence/run03-ios-artifact.json) identify it. Native UI automation passes screen/quiz/theme/cold-link smoke and exact paced input, but bulk input still fails intermittently (the keyboard-ready three-iteration run has 2 passes / 1 failure). Disabling correction alone was insufficient; a native-owned-buffer experiment also failed and was reverted. A separate [plain UIKit control](evidence/run03/input-control/test.log) passes 3/3 equivalent field-value assertions, so a generic XCTest-only cause is not established. Investigate/isolate this automated input issue in P00.6/P06; do not substitute screenshots for a passing fast-input check. The [screenshot index](evidence/run03/screenshots/index.md) retains actual captures, failing diagnostics and reproduction commands.
- Xcode's initial license/plugin errors disappeared on later read-only probes without an agent acceptance command; they are historical observations, **not the final iOS blocker**. `simctl` listed iOS 26.2 devices, booted iPhone 17 Pro and installed/launched the verified app. Actual iOS captures are recorded in the run screenshot index; Android captures remain blocked. Native build/launch and images are engineering evidence, not M11 physical-device, provider privacy, listening or distribution acceptance.

## Run 04 native verification, 16 November 2026

**P00 is agent-done.** Direct Android debug and unsigned iOS Release simulator builds, installation, runtime checks and capture requirements pass. [Complete report](evidence/run04/README.md), [37 actual images](evidence/run04/screenshots/index.md), [source identity](evidence/run04/source-sha256.txt).

- Android 16/API 36, Pixel 7 AVD:32 recorded checkpoints and12 inspected captures cover routing/back/links, exact input/editing, real Google TTS events/completion/cancellation/replacement, persisted/legacy preferences and scoped reset. [Report/reproduction](evidence/run04/android/README.md), [APK and actual loaded Hermes JavaScript identity](evidence/run04/android/artifact.json). Debug still uses Metro and the public development key.
- iPhone 17 Pro/iOS 26.2: final five-test UI/runtime suite plus actual native legacy migration/reset checks pass;16 inspected captures. The app now uses one scene with cold/warm URL forwarding. The guarded provider patch fixes unsupported `BOOL *` bridge arguments, and the adapter’s Stop readiness/error contracts are verified. [Report/reproduction](evidence/run04/ios/README.md), [binary/bundle/ZIP identity](evidence/run04/ios/artifact.json).
- Fresh locked install, lint/types,65 tests, Expo-free graph/consumer checks and full independent web/browser gates pass. [Shared verification](evidence/run04/shared/README.md). The unchanged high dependency advisory and manual acceptance are not cleared by these checks.

The SDK is now `/Users/mac/Library/Android/sdk`; use `ANDROID_HOME="$HOME/Library/Android/sdk"` for new terminals. The old `/tmp/nato-android-sdk` is a compatibility symlink; ignored `android/local.properties` also selects the durable SDK. No shell-startup file was changed. The dedicated emulator remains available but is shut down after verification. [Machine commands and resource limits](evidence/run04/android/README.md#reproduction) include the JDK 17 path, Metro/ADB reverse and emulator settings.

Prepared local builds: `artifacts/run04/android/NATOPhonetics-1.0.0-debug.apk`, `artifacts/NATOPhonetics-ios-simulator.zip` (unsigned arm64 simulator app, not device IPA), and web `dist/`. [Independent hash verification](evidence/run04/artifact-verification.json). Private release-signing/export inputs were absent; no signed distribution, upload or store action was performed.

The iOS bulk-injection failure is isolated to a minimal React Native/iOS/XCTest path, including uncontrolled input; ordinary consecutive key events, edits and native Paste pass. Retain this diagnostic for P06/P10 upstream rechecks. Physical typing, listening, signed upgrade and assistive-technology acceptance remain M11. Earlier Run03 build failures above are historical and are not the current blocker state.

## Run 05 tile verification, 17 November 2026

The shared alphabet/converter/quiz tile now packages the same pinned fonts on all targets. Native startup verifies the registered font names; build and evidence reports verify bytes. Native orientation is unlocked, and iPad app-window resizing is enabled. [Numeric specification](TILE_DESIGN.md), [Run 05 evidence](evidence/run05/README.md), [actual screenshots](evidence/run05/screenshots/index.md).

Android's new repository-owned `TileTypography` module compensates for Android 14+ nonlinear SP conversion so the whole tile enlarges proportionally while React Native text scaling remains enabled. Rebuild the APK when adding/changing this module; Metro reload alone cannot supply it. The shared native baseline hook measures the rendered line and positions its inner run within unchanged tile text boxes. A controlled live 1×→2×→1×→2×→1× failure exposed stale JavaScript inverse values when reported scale returned to an old value. Removing that memoization passes final tile glyph/baseline checks; each call now inverts the metrics actually used by the native renderer. The APK is unchanged by this JavaScript-only repair, and final evidence identifies its new loaded Metro bundle. Ordinary header/instruction text still clips or retains enlarged sizing during transitions; that broader lifecycle issue remains P05.2/P05.8. No internal feature-flag force override was applied. These are rendering changes; no package/Pod dependency, permission, preference schema or cloud service was added.

Direct Android debug and unsigned iOS Release simulator builds pass. [Android report](evidence/run05/android/README.md) identifies the APK and actually loaded Metro JavaScript separately; [iOS report](evidence/run05/ios/README.md) identifies the installed executable, bundled JavaScript/fonts and simulator ZIP. The previous Run 04 artifacts remain historical. Final per-platform reports distinguish complete checks, earlier diagnostics and missing coverage; a build alone does not close P05.8.

The [Run 05 iPad window-resize check](evidence/run05/ios/window-resize-report.md) exposed OS controls over Home in a small window. Run 06 adds `NatoHeaderInsets`, a header-local native view that reads UIKit's live corner-adapted safe-area region on iOS 26+, with ordinary safe-area behavior on older iOS. `HeaderInsets.ios.js` applies only those additional horizontal insets; it does not narrow the screen body or change tile geometry. Rebuild iOS after adding/changing the Swift view or its Objective-C bridge; refreshing JavaScript alone is insufficient. Actual resized-window captures and tap results, including the retained first automatic-tap failure and three passing restored-window automatic navigation cycles, are in [Run 06](evidence/run06/README.md). P05 and the integrated P10 candidate remain unfinished; no physical-device or release acceptance is claimed.

## Run 06 configuration and window-header follow-up, 17 November 2026

Android now handles `fontScale` in the Activity, refreshes React Native display metrics before creation/resume/configuration updates, notifies DeviceInfo of the current scale and requests layout of the existing surface. Rebuild/install the APK for these native changes. This preserves the active route, converter input and submitted quiz answer during repeated live font-size changes. The final candidate uses stock React Native startup; unsuccessful internal-feature-flag and layout experiments are archived, not enabled. Tile geometry/raster checks pass, but ordinary text retains its previous size and enlarged quiz feedback clips. Cold-start enlarged text behaves differently. P05.2 remains open; the exact measurement/cache cause is unresolved.

[Run 06 Android identity](evidence/run06/android/artifact.json) records the APK, installed hash, fonts and separately captured loaded Metro JavaScript. [Run 06 iOS identity](evidence/run06/ios/artifact.json) records the rebuilt simulator executable, embedded JavaScript and packaged ZIP. Six final iOS runtime cases pass, including iPad window restoration and maximum-category alphabet/converter/quiz coverage; its strict raster gate retains four J lower-edge failures. [Reports and actual screenshots](evidence/run06/README.md) separate application passes, known failures and missing coverage. No dependency, permission, storage schema or provider changed; no physical or release acceptance is inferred.

## Self-hosted CI runner

Run22 replaces the serial audit/build chain with independent checks and selected unsigned native modes. See the [shared host execution guide](#shared-host-execution--run22) below; the earlier workflow description records its historical starting point.


`.github/workflows/native-builds.yml` requires labels `self-hosted`, `macOS`, `ARM64`, `nato-phonetics`. The current Ruby lock supports Apple silicon Darwin; Intel runners are not verified by this lock. Prepare Ruby3.3.13/Bundler2.4.22, the documented Android SDK/licenses and working Xcode before dispatch. CI uses `npm ci`, frozen Bundler and `pod install --deployment`, then direct local builds and artifact upload. Workflow dispatch does not publish or approve release. If a local Homebrew Ruby reports a missing certificate issuer, configure its existing trusted CA bundle (Run03 used `/opt/homebrew/etc/ca-certificates/cert.pem`); do not disable certificate verification.

The [React Native iOS 27 lifecycle report](https://github.com/react/react-native/issues/58545) motivated the owned scene migration in Run 04. The new scene bootstrap is compiled with SDK 27.2 and verified on the available iOS 26.2 runtime. **iOS 27 runtime behavior remains unverified**, because that runtime was unavailable; retain it in P10 compatibility checks. This is a technical coverage limitation, not an outstanding owner licence action or a claim of support inferred from the deployment minimum.


## Planned remote build completion — 19 November 2026

[P10.8](DELIVERY_PLAN.md#p108--remote-build-pipeline-and-reusable-host-execution) is **P2/active/partial**, M–L for remaining remote qualification. The existing self-hosted native workflow and separate web CI are authored; this does not establish a verified remote build. Complete them using shared Gradle/Xcode/web entry points that can also run on another authorized host, with pinned preflight, exact source/patch/artifact identities, durable logs, artifact retrieval and failure reporting. Keep private-runner trust boundaries and failed security/release gates intact. iOS requires a suitable macOS/Xcode host; other OS/architecture claims need qualification. A selectable Android source-framework diagnostic mode follows a justified P05.2 candidate; ordinary builds retain the current dependency path.

The owner reports11GiB free and wants local work to proceed.25–30GiB was an advisory buffer, not a verified minimum: measure before large builds, serialize them and report actual shortfalls. Pipeline completion is scheduled later, with an enabling slice eligible earlier only if a measured local constraint blocks P1 validation and a host is available. Future restricted host/runner enrollment/access and signing inputs stay in M11.2; setup/implementation/verification remain engineering. No workflow is changed, host provisioned or build performed by this documentation amendment.

## Run 07 native text measurement, 17 November 2026

The shared JavaScript tile correction reads pixel-rounded parent/box origins from native layout events and aligns the inner text to the existing whole-tile baseline. It changes no native project, font file or dependency. Android therefore reuses the hash-verified Run 06 debug APK with a separately archived Run 07 Metro bundle; APK identity alone cannot identify that running JavaScript. Native text events and strict raster checks are recorded in [Run 07](evidence/run07/README.md).

iOS uses separately identified Debug/inspector evidence for native line events and Release confirmation for the bundled candidate. Debug loader, debug library, loaded JavaScript and font hashes must be identified together; Release identifies its executable and embedded JavaScript. Reports distinguish those builds and keep pre-correction diagnostics separate. Refreshing Metro cannot update a Release app's embedded bundle.

The attempted Android ordinary-text cache invalidation adapters were isolated diagnostic controls and failed; none is shipped. Ordinary text can retain stale sizing and enlarged headings, feedback and button labels can clip. P05.2 still needs an exact-version framework reproduction/remedy plus native retest. No permission, storage or provider changed; no physical, signing or release acceptance is inferred.

Run 07 clears the historical maximum-size iPad J baseline/raster failure, but the added density-3 iPhone probe retains an `India` word lower-edge observation at +2.041928153 physical pixels against 2 px. Its native baseline is exact; actual font/raster-phase diagnosis remains P05.8 engineering. See [the retained measurement](evidence/run07/ios/phone-india-fringe.json). No tolerance or font asset was changed to hide it.

The final focused Debug phone probe also retains two `Juliett` word lower-edge misses at +2.042446952 px, before and after the verified horizontal scroll. Required coverage passes, but strict raster is 453/456; native origin/baseline checks are 1,773/1,773. These are distinct gates.

### Android composition gate (isolated test APK, API36)

The Run26 composition regression uses the actual converter and a small test IME
through Android's system-managed InputConnection. It is built with existing
SDK36/build-tools36.0.0/JDK17; no new app dependency or production component is
added. Use ordinary product Metro, not the fixture config:

```sh
python3 scripts/build-android-font-instrumentation.py artifacts/font-instrumentation
python3 scripts/run-android-font-instrumentation.py artifacts/font-instrumentation/font-composition.apk EXACT_APP.apk artifacts/font-composition emulator-5580
```

Both installed APK hashes must match. The runner and instrumentation restore the
original system font scale and IME even on failure. adb's exit0 is insufficient:
actual instrumentation code and report must pass. The gate checks unchanged
native view/Editable, focus/value/caret/composing range across1→2→1, continued
composition and commit, with actual UiAutomation screenshots. Two early
manually created connections failed the composition precondition before any
font transition; the system-managed test IME passes5 checkpoints. This does not
qualify physical/provider keyboards or AT. [Android Instrumentation](https://developer.android.com/reference/android/app/Instrumentation),
[composing-span API](https://developer.android.com/reference/android/view/inputmethod/BaseInputConnection).

## Run 14 release resources, 18 November 2026

`npm run generate-icons` now updates every web/Android/iOS consumer with verified deterministic resources. Android adaptive layers use separate foreground/background and a transparent alpha monochrome outline. iOS AppIcon is opaque RGB, with outlined lettering independent of machine fonts. Regenerate and rebuild/reinstall both native apps after an artwork edit; refreshing Metro is insufficient. [Specification and failure behavior](RELEASE_ASSETS.md).

Direct Android Debug and unsigned iOS Release simulator builds pass; the installed APK matches its build hash and exact PNG layer bytes, and all 25 installed iOS app files match the Release product. [Android evidence](evidence/run14/android/README.md), [iOS evidence](evidence/run14/ios/README.md), [actual launcher/app/browser and separately labelled crop captures](evidence/run14/screenshots/index.md). Android Debug loaded JS is separately archived; iOS Release uses the identified bundled JS. No dependency/framework/font/permission change or final integrated build/support/device acceptance is inferred. The [P09.1 assessment](SPOKEN_PRACTICE.md) specifies future recognition integration; it adds no production native module or microphone permission.


## Run 18 native paragraph precision

The [causal diagnosis and patch contract](NATIVE_TEXT_PRECISION.md) replace the unresolved default iOS Speech-policy clipping diagnosis with an actual source/build/runtime repair in the recorded scope. RN0.81.5 and the lockfile stay pinned. The direct unsigned Release build compiles the guarded Yoga source; [installed identity](evidence/run18/ios/artifact.json) identifies the changed native executable and the unchanged embedded product JavaScript/fonts. Diagnostic and final candidates stay separate. [Commands, failed drivers and scoped checks](evidence/run18/README.md); [actual captures](evidence/run18/screenshots/index.md). Android live scaling, iOS original long gestures/max progress return, strict ink/full runtime/device/AT qualification remain open; this is not a final integrated native pass.

## Run20 — Android diagnostics without a new native candidate

[Normal-startup measurement tracing](ANDROID_TEXT_MEASUREMENT.md) reuses the exact installed/built Run17 Debug APK and records the diagnostic/product loaded bundles separately. C++/Java calls are observed through isolated tooling; no native source/flag/cache/package/lock change or rebuild occurs. The live/cold gate still fails3/4. Normal product entry/scale are restored and actual alphabet captured before owned Metro/trace daemon/emulator shutdown. [Artifact identity](evidence/run20/android/artifact.json), [captures/limits](evidence/run20/screenshots/index.md). A guarded source-build/regression/ABI/state/tile cycle remains a separate L/high-uncertainty P05.2 forecast. iOS sources/build scopes are unchanged.

## Shared host execution — Run22

[P10.8](DELIVERY_PLAN.md#p108--remote-build-pipeline-and-reusable-host-execution) is **active/partial**. `scripts/host-build.cjs` is the common entry point for Actions and a prepared local/remote host. It invokes the existing Gradle/Xcode/web implementations, measures available disk/memory, checks pinned Node/npm and platform tools, limits native workers (default1, explicit1–4) and takes a checkout build lock. No minimum free-space guess is a gate or a promise that a first build fits.

Use a fresh output directory for every attempt. Bootstrap Node22.23.0/npm10.9.4 first; prepare JDK17/SDK36/Build Tools36.0.0/NDK27.1.12297006 for Android, or macOS/Xcode and Ruby3.3.13/Bundler2.4.22 for locked iOS installation. SDK licences and signing remain their existing prerequisites. The wrapper does not install SDKs or enroll a runner.

```sh
npm run build:host -- web --install --output artifacts/host-web-001
npm run build:host -- android-debug --install --output artifacts/host-android-001
npm run build:host -- android-release --output artifacts/host-aab-001
npm run build:host -- ios-simulator --install --output artifacts/host-ios-001
npm run build:host -- checks --output artifacts/host-checks-001
npm run build:host -- android-debug --preflight-only --output artifacts/preflight-001
```

`--install` runs `npm ci`; iOS additionally uses frozen Bundler and `pod install --deployment`. Without it, the caller supplies the already locked/qualified dependency installation. `checks` records dependency/type/lint/test/audit outcomes independently and exits nonzero if any fails. No audit failure becomes acceptance. `web` runs packaging regressions, builds production pages and packages the verified static archive. Android emits APK/AAB; iOS simulator `.app`, archive and export outputs use tar.gz to preserve executable bits and bundle structure through Actions upload. `ios-archive`/`ios-export` remain separately selected signing-capable modes and are absent from the unsigned workflow; export uses the existing `NATO_EXPORT_OPTIONS_PLIST` environment input. No signing material is logged or included in source transfer.

Each output contains `report.json`, `preflight.json` when preflight completes, per-command `logs/`, `source.json`, `source.patch`, `source-untracked/` when needed, and successful product SHA256/size records. Failed commands keep actual child exit/signal details; a failed build never collects a stale output. Source changes during execution reject qualification. Existing job directories are never overwritten. A concurrent invocation fails with its own report while preserving the original `artifacts/.host-build.lock/owner.json`; after an interrupted/killed job inspect its PID and prove no build is running before removing that stale lock. Logs/evidence and durable product copies are retained; only the owned lock is removed automatically. Standard Gradle/Pods/Xcode caches and products remain for reuse, subject to measured host capacity.

Source identity covers tracked and unignored source/configuration/docs/test files, their executable bits/symlink targets and deletions. Historical/generated `docs/evidence/` and ignored local data/build/cache/signing files are excluded from the standard-build identity. The patch is relative to the recorded HEAD; untracked source files are copied separately. For a dirty candidate, transfer these reviewed inputs onto that exact HEAD over an authorized channel, then require its `sourceId`:

```sh
node scripts/host-build.cjs web --install --expected-source <sourceId> --output artifacts/remote-web-001
```

Verify the reconstructed source ID before accepting outputs; also compare artifact hashes after retrieval. A source manifest is not an automatic remote transport or permission to send a candidate elsewhere. Runner-specific SSH/checkout/bootstrap is outside build logic. Record a remote job ID (Actions records its run URL/attempt automatically), retrieve the entire evidence folder, and install the matching native artifact for any affected runtime regression/captures. A second direct invocation on that host demonstrates execution outside the Actions wrapper.

The manual native workflow supports `all`, `android-debug`, `android-release`, `ios-simulator`. Its private job accepts only `main`/`develop`, uses the existing trusted labels and serializes its matrix; a separate Ubuntu checks job retains any failing check/audit status without a dependency that hides unsigned artifacts. All steps upload identified evidence on failure. The existing three-engine web distribution jobs use the same host entry point; browser/hosting checks remain their own gates. The selected workflow ref must already contain the reviewed implementation. Use `gh workflow run native-builds.yml --ref main -f mode=all`, inspect `gh run view <run-id>`, and retrieve `gh run download <run-id> --dir <new-directory>` only against the authorized candidate. These are instructions, not a recorded dispatch.

Run22 read-only GitHub inventory finds **zero registered self-hosted runners**. No runner enrollment, workflow dispatch, remote build, signing or publication is performed. Actual remote standard outputs, source reconstruction/retrieval and on-host second invocation remain P10.8 engineering; only restricted enrollment/access belongs in M11.2. Framework diagnostic selection remains unavailable until P05.2 supplies a justified regression/patch and pinned source/CMake/ABI configuration; ordinary builds retain Maven RN0.81.5. [Run22 evidence and limitations](evidence/run22/README.md).


Run22 local setup correction: the historical AnypointStudio JDK directory is absent. An isolated, SHA256-verified Temurin17.0.13+11 is available at `/tmp/nato-run22-jdk/jdk-17.0.13+11/Contents/Home`; use it as process `JAVA_HOME`. Existing `/Applications/Xcode.app/Contents/Developer` works as process `DEVELOPER_DIR` while global xcode-select remains on Command Line Tools. No shell/system configuration was changed. Actual standard builds fit the measured host capacity; no Android framework-source-build capacity guarantee is inferred. [Setup/qualification evidence](evidence/run22/README.md).

## Run23 — compatible CLI/parser qualification

All three direct CLI packages are pinned to20.2.0; the CLI family uses patched fast-xml-parser 5.12.1 through its upstream range. RN 0.81.5/Metro 0.83.8/native provider/Pod lock/project/permissions stay unchanged. The [upstream CLI20/RN0.81 compatibility table](https://github.com/react-native-community/cli/blob/v20.2.0/packages/cli/README.md#compatibility) supplies the candidate family; actual repository qualification is [Run23](evidence/run23/README.md), not inferred from that table. Source-map comments differ; the two CLI XML consumer bodies/config/autolink output remain equal. XML array/attribute/workspace and bounded malformed-stop-node checks run in `npm test`.

Fresh locked npm and Pods installation, 151 tests/types/lint/Expo-free graph, real workspace discovery and local Android Debug/four-ABI unsigned Release/unsigned iOS simulator builds pass. Retrieved/installed default-scale converter/Menu/reference scopes and actual captures are [identified](evidence/run23/candidate.json). Raw audit/review now pass0 with zero findings. The first Pods command failed because vendor/bundle is absent on this host; select the existing Ruby 3.3 gem environment rather than setting BUNDLE_PATH to a nonexistent directory. The successful locked retry changes no Pod lock or native project. Clean installation refreshes native-source timestamps and can require a longer recompilation than a cached build.

All eight Android framework-library hashes match Run22; no Android live-sizing fix is implied. Existing guarded speech/Yoga patches still apply after npm ci. Final native/physical/runtime/provider/signing/remote/integrated gates remain unfinished. Standard build entry points and publication boundaries are unchanged; no Expo/EAS path is introduced.

## Inspector-free production Release tile observation — Run30

The separate `TileLayoutInstrumentation` test-APK entry observes actual native
Layout baselines, transforms, typography/spans/resolved paint and corner radius
on the unchanged non-debuggable product. It prunes inactive/zero-sized native
ancestors; host adb supplies real screenshots. Use actual UIAutomator clipping
to select complete raster tiles, since native getGlobalVisibleRect can include
content covered by a fixed header. No inspector/product JS/root change is used.

```sh
python3 scripts/build-android-font-instrumentation.py NEW_TEST_OUTPUT
node scripts/check-android-release-tiles.cjs NEW_EVIDENCE
node scripts/check-android-release-tiles.cjs NEW_EVIDENCE --windows
node scripts/check-android-release-tiles.cjs NEW_EVIDENCE --narrow
```

Use pinned JDK17/SDK36/Node22 and the same local development signature as the
engineering product copy. The [Run30 driver](evidence/run30/android/observe-product.py)
is deliberately candidate/path-specific; adapt artifacts/output to a new run
before reuse and never overwrite archived captures/reports. Both strict native
and unchanged original ink/context-completeness gates are required.

Run30 passes505context/93window/21narrow native baselines and217ink observations,
with30inspected actual images. Original observer/API/reflection/selection
failures remain archived; initial product/numeric settings/Gboard restored,
owned exports collected/removed and tools stopped. Exact pre-run theme was not
independently recorded. [Scope/evidence](evidence/run30/README.md). This qualifies
the recorded opt-in Release scopes; ordinary clean/default integration and
exact-artifact retests, broader runtime and integrated/M11 acceptance remain
open. [Next concrete engineering](evidence/run30/android/next-android.md).
