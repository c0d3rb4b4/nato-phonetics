# Native builds

Run these commands from the repository root. Android targets API 24 and later. iOS targets 15.1 and later. Both use React Native 0.81.5 and register the app as `NATOPhonetics`.

| Platform | Prerequisites |
| --- | --- |
| Both | Node 22.23.0 and npm 10.9.4. Use the tracked package lock and keep npm lifecycle scripts enabled. |
| Android | JDK 17, Android SDK Platform 36, Build Tools 36.0.0, NDK 27.1.12297006, CMake 3.30.5 for ReactAndroid and 3.22.1 for the app. Use the checked-in Gradle wrapper. Set `JAVA_HOME` and `ANDROID_HOME`. A short physical checkout path on Windows avoids Ninja path-length failures. |
| iOS | macOS with Xcode and an installed iOS Simulator runtime, Ruby 3.3.13, Bundler 2.4.22 and the locked CocoaPods 1.16.2. Select Xcode with `DEVELOPER_DIR` if multiple versions are installed. |

```sh
npm ci
```

The install prepares the renderer and native speech provider. Rebuild and reinstall the affected app after editing native code, patches, fonts or artwork.

## Android

The npm build commands select the local ReactAndroid source, verify the Maven Hermes AAR and run the Gradle wrapper. Leave the default architecture list in place to build for `armeabi-v7a`, `arm64-v8a`, `x86` and `x86_64`. Set `NATO_BUILD_JOBS` to a value from 1 to 4 to control build concurrency.

| Command | Build product and use |
| --- | --- |
| `npm run build:android:debug` | `android/app/build/outputs/apk/debug/app-debug.apk` loads JavaScript from Metro. |
| `npm run build:android:develop` | `android/app/build/outputs/apk/develop/app-develop.apk` embeds JavaScript and installs alongside production as `com.natophonetics.app.dev`, with its own data and `natophonetics-dev://` links. |
| `npm run build:android:release` | The APK is under `android/app/build/outputs/apk/release/` and the app bundle is `android/app/build/outputs/bundle/release/app-release.aab`. Both embed JavaScript. |

To run Debug, start `npm start` in one terminal, then build and install from another. Select a test device with `ANDROID_SERIAL` if multiple adb targets are connected.

```sh
adb devices -l
npm run build:android:debug
adb reverse tcp:8081 tcp:8081
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.natophonetics.app/.MainActivity
adb shell am start -W -a android.intent.action.VIEW -d natophonetics://menu com.natophonetics.app
```

Debug and Develop use the public development key. Android requires a matching signature to update an installed app and preserve its local data. To sign Release products, set `NATO_UPLOAD_STORE_FILE`, `NATO_UPLOAD_STORE_PASSWORD`, `NATO_UPLOAD_KEY_ALIAS` and `NATO_UPLOAD_KEY_PASSWORD` in the environment. Omitting all four builds unsigned Release products. [Release runbook](RELEASE_RUNBOOK.md)

## iOS

Install the locked Pods and build a Release simulator app for the host architecture. Choose an available simulator and set `SIMULATOR_UDID` to its identifier. Run the boot command if the simulator is shut down.

```sh
bundle install
bundle exec pod install --deployment --project-directory=ios
npm run build:ios:simulator
xcrun simctl list devices available
xcrun simctl boot "$SIMULATOR_UDID"
xcrun simctl bootstatus "$SIMULATOR_UDID" -b
xcrun simctl install "$SIMULATOR_UDID" artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app
xcrun simctl launch "$SIMULATOR_UDID" com.natophonetics.app
xcrun simctl openurl "$SIMULATOR_UDID" natophonetics://menu
```

For interactive development, open `ios/NATOPhonetics.xcworkspace` in Xcode or run `npm run ios` with Metro. Xcode can read `NODE_BINARY` from an ignored `ios/.xcode.env.local`. The Podfile aligns dependency deployment targets and applies the guarded fmt 11.0.2 fallback for Apple clang 21 and later. Review the patch when upgrading fmt. [Podfile](../ios/Podfile) · [fmt compatibility patch](../ios/scripts/patch_fmt.rb)

For a signed device build, configure the team and provisioning, then use `npm run build:ios:archive`. Set `NATO_EXPORT_OPTIONS_PLIST` to a local export options file and run `npm run build:ios:export`. The archive is `artifacts/NATOPhonetics.xcarchive` and exported files are under `artifacts/ios-export/`. [Release runbook](RELEASE_RUNBOOK.md)

## Renderer and fonts

**Paragraph layout.** The Yoga patch subtracts rounded edges in double precision before converting the resulting dimension to a float. This prevents a paragraph at a fractional origin from losing enough height to clip its final line. Both the iOS Pods and Android composite build consume the patched source. [Reviewed Yoga patch](../scripts/patches/react-native-0.81.5-yoga-pixel-grid.json)

**Live font scaling.** Android propagates font-environment changes through the renderer, refreshes text measurement caches and updates editable text sizing. The tile typography module compensates for nonlinear Android SP conversion so each tile scales as a unit. Both native apps bundle the three static Nunito faces from `assets/fonts/`. Their manifest records upstream revision, SHA-256 hashes and face names. [Android renderer patch](../scripts/patches/react-native-0.81.5-font-environment.json) · [Font manifest](../assets/fonts/manifest.json)

`npm ci` runs the version- and hash-guarded source preparation. Check its result and run the Yoga regression with a C++20 compiler available as `c++` or through `CXX`.

```sh
npm run prepare:android:source -- --check
npm run check:yoga
```

If a generated prefab header is stale, run `npm run prepare:android:source` and rebuild. Changes to an upstream file or React Native version require review of the patch manifests. For a renderer or accessibility change, exercise live and cold scale changes, input editing, resized windows and tile baselines on the installed candidate. The fixture guide includes commands for a Debug device, an instrumented Release fixture and the native tile observer. [Android font and layout tests](../tests/fixtures/android-font-scale/README.md)

## Artwork

Edit the outlined source vectors for the full icon, adaptive foreground and monochrome mask. Preserve transparency around the adaptive mark and keep its painted pixels inside the central 66 dp safe circle on the 108 dp canvas. The background is solid `#FFFDF7` and the 1024 px iOS AppIcon is opaque. [Source artwork](../assets/images/)

```sh
npm run generate-icons
node --test tests/icons.test.mjs
```

The generator renders the web favicon, launcher icons, adaptive layers and splash resources. It records source and output hashes, dimensions and alpha coverage. To preview an edit, run `node scripts/generate-icons.js --output-dir PATH` with an empty directory. Rebuild the web export and native apps to ship the regenerated artwork. [Icon manifest](../assets/images/icon-manifest.json)

## Build reports

For a build with a source manifest, command logs and artifact hashes, use the shared host wrapper with a fresh directory under `artifacts/` or outside the checkout. Add `--install` for a locked dependency install, `--preflight-only` to check the host or `--expected-source SHA256` to verify a source snapshot.

```sh
npm run build:host -- android-release --install --output artifacts/android-release-001
```
