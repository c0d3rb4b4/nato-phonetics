# Run 04 Android native verification — 16 November 2026

P00 Android build, installed-app verification and capture work passed. The final record contains **32 passing checkpoints** (including two suite-completion records) and **12 inspected native screenshots**. This is engineering evidence for the migration, not distribution, physical-device, accessibility or listening acceptance.

## Build and installed artifact

`npm run build:android:debug` invoked the repository's direct Gradle workflow and passed in **26 seconds**, with **121 actionable tasks: 8 executed, 113 up-to-date**. See [build-debug.log](build-debug.log). The prior NDK licence failure is resolved; NDK `27.1.12297006`, platform 36, build tools, CMake and platform tools are installed. No new licence acceptance was performed by this verification run.

The debug APK is [NATOPhonetics-1.0.0-debug.apk](../../../../artifacts/run04/android/NATOPhonetics-1.0.0-debug.apk), **102,514,574 bytes**, SHA-256 `06b3564a96807caec920799c7632e9f73c08f9066de637261544ca711976ff45`. Package `com.natophonetics.app`, version `1.0.0` / code `1`, minimum API 24 and target API 36 were read from the APK. [Badging](apk-badging.txt) and [signature verification](apk-signature.txt) confirm it uses the repository's public development certificate; this is not a distribution build.

Debug JavaScript is served by Metro, so the APK hash alone does not identify application behavior. After the final checks, the real running Hermes inspector exported the loaded JavaScript with `Debugger.getScriptSource`: **5,137,251 bytes**, SHA-256 `a28aac70a8a8760c012e178d764fbcab4cefacded23e65d97ea79b7c093fa38c`. The [loaded-source manifest](loaded-javascript.json), [exporter](capture-loaded-bundles.cjs), [export log](loaded-javascript.log), [artifact identity](artifact.json) and [maintained-source manifest](../source-sha256.txt) record the exact candidate. Generated APK/JavaScript archives stay under ignored `artifacts/`; verification logs and screenshot metadata remain in this evidence directory.

## Emulator and provider

The dedicated `nato-p00-api36` AVD used Android Emulator **37.2.13**, **Android 16 / API 36**, Google APIs ARM64 system-image revision **7**, serial `emulator-5580`, and the Pixel 7 profile. Its 1080 × 2400 / 420 dpi display was overridden to **720 × 1600 / 280 dpi**, preserving the same logical dimensions while reducing rendering work on the 8 GB host. Final runtime work used the host GPU with 2560 MiB guest RAM, no snapshots, and no concurrent iOS simulator. The emulator was shut down after the checks; its installed app and data remain available.

The real engine was `com.google.android.tts`, version code **210526444**, version `googletts.google-speech-apk_20241125.02_p2.702443970`, supplied by the Google APIs image. No speech provider was mocked or replaced. The initial API enumeration returned 17 English voices; a later retry returned 30 as the engine's available voice set changed. Both [initial voices](voices.json) and [later voices](voices-after-retry.json) are preserved. The screenshot driver asserts visible voice controls against the current list instead of assuming a fixed first voice. No audible pronunciation or offline-synthesis conclusion is inferred.

## Checks and screenshots

The [checkpoint record](checks.json) and UIAutomator [hierarchies](hierarchies/) cover:

- Native Home, every maintained route and unknown-route fallback; warm links, cold Menu link and its Home fallback.
- Exact bulk input `CV34 7AP`, all seven emitted cards, editing to `CV34 7AZ`, Menu/Back retention and Android hardware Back.
- Four quiz choices, persistent feedback and Next/Replay controls.
- Theme selection and persistence after process restart.
- Real AsyncStorage migration of legacy `darkMode` and a valid `selectedVoice`, removal of old keys, and Reset Preferences preserving an unrelated sentinel. The sentinel was removed afterward. This checks the storage contract in the installed migrated app; it is not a signed upgrade from a separately installed old APK.
- Real native voice enumeration and Retry, a three-word default preview, Stop, replacement, navigation cancellation, background cancellation, and no automatic resumption after foreground or Menu Back.
- Four consecutive identical words (`AAAA`) each completing with a different native utterance UUID.

Speech checks observe the existing controller and the real native TTS start/finish/cancel events through a temporary Hermes debugger observer; ordinary UI controls initiate playback. No application source hooks or fake events are introduced. [Default completion](speech-default-completion.json), [Stop](speech-explicit-stop.json), [navigation](speech-navigation-stop.json), [background](speech-background-stop.json), [replacement](speech-replacement.json), [identical words](speech-repeated-words.json) and [Menu Back](speech-menu-back-stop.json) retain the traces. The Menu Back supplement cancelled between words, so its absence of a native cancel callback is expected; the original navigation test includes a native cancellation event. Production speech timeouts were unchanged.

The [12 screenshots and hashes](../screenshots/android/metadata.json) show Home light/dark after restart, alphabet, empty/populated converter, quiz question/feedback, settings dark, cold Menu, Audio Help, and both actual empty and populated voice-list states. Every image was independently opened and inspected. They show actual installed Android content, not a browser substitute. The existing R25/P05 tile-design follow-up remains separate from P00.

## Reproduction

The SDK now lives at `/Users/mac/Library/Android/sdk`. The old `/tmp/nato-android-sdk` is a compatibility symlink, and ignored `android/local.properties` points to the durable location. This was a same-volume rename after emulator shutdown; no duplicate SDK or shell-startup edit was made. See [SDK location](sdk-location.json) and [AVD listing after the move](avds-after-move.txt).

On this machine, use the documented JDK 17 and Node 22 toolchain, start Metro, start the existing AVD without wiping its data, then run the script against the debug app:

```sh
export JAVA_HOME='/Users/mac/dev/AnypointStudio 2.app/Contents/Eclipse/plugins/org.mule.tooling.jdk.macosx.aarch64_1.3.4/Contents/Home'
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="/tmp/nato-phonetics-toolchain/node_modules/.bin:$ANDROID_HOME/platform-tools:$PATH"
npm start -- --host 127.0.0.1
# In another terminal with the same environment:
"$ANDROID_HOME/emulator/emulator" -avd nato-p00-api36 -port 5580 \
  -no-window -no-snapshot -no-boot-anim -gpu host -memory 2560
# Once Android has booted, in another terminal:
adb -s emulator-5580 reverse tcp:8081 tcp:8081
adb -s emulator-5580 install -r android/app/build/outputs/apk/debug/app-debug.apk
python3 docs/evidence/run04/android/scenarios.py
node docs/evidence/run04/android/capture-loaded-bundles.cjs
```

The AVD's ordinary React Native developer setting `debug_http_host` is `localhost:8081`; this uses ADB reverse because this host did not reliably connect through the emulator's `10.0.2.2` route. A fresh AVD must set that developer option. [Helpers](verify-native.py), [runtime reader](read-runtime.cjs), [main driver](scenarios.py), [supplement](supplement.py) and [native initialization probe](probe-tts-init.py) document the exact methods. The storage fixture is intentionally restricted to this disposable development installation.

## Diagnostics retained separately

The first SDK download exhausted host disk space. Generated Android/iOS intermediates were reclaimed while preserving built artifacts and evidence, and SDK installation was retried. An incomplete emulator package left by that failure was reinstalled. Initial standard startup rejected insufficient space for its 6 GiB userdata disk. A sparse-data experiment is retained as a failed diagnostic; the final AVD was initialized with the standard emulator `-wipe-data` flow after space became available.

Concurrent native work on this 8 GB host caused System UI/Google TTS ANRs and one `system_server` finalizer timeout. A first playback attempt failed safely; it is not counted as passing. Native runtime checks were then serialized. The isolated [initialization probe](tts-initialization.json) observed native Stop and readiness resolving in 16 ms; it did **not** reproduce a `not_ready` rejection. The separate shared adapter readiness repair is supported by source-contract regression tests, not falsely attributed to that earlier host failure.

The first final driver reached successful app behavior but its raw debugger observer incorrectly captured a loop variable, labelling callbacks with the last event name. The observer was changed to a per-callback parameter; corrected traces show matching starts/finishes and cancellation. [Initial driver log](native-scenarios.log) and [observer diagnostic](speech-observer-loop-diagnostic.json) retain the failed harness assertion. The [resumed driver](native-scenarios-final.log) and [supplement](native-supplement-final.log) exited zero on the same final application source. A [stale voice-list expectation](native-supplement.log) was also corrected by asserting against the newly enumerated list. These failed harness/environment attempts are not native product passes and do not replace the final evidence.

P10 release packaging, broader device/OS coverage and M11 listening, physical accessibility, signed-upgrade and distribution acceptance remain unperformed by this run.
