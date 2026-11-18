# P00 migration inventory and preservation contract

Prepared 16 November 2026 for Run 03. This records the inspected Run 02 source and the selected migration design. It is not native build, device, speech or release acceptance. The [delivery plan](DELIVERY_PLAN.md) and its execution record own current completion status and actual check results.

**Completion update, Run 04:** P00.1–P00.6 are agent-done. [Native/shared reports](evidence/run04/README.md) and [37 inspected captures](evidence/run04/screenshots/index.md) supersede the initial environment blockers below. Inventory and preservation requirements remain applicable; signed upgrades, physical acceptance and broader runtime coverage remain P10/M11.

## Selected architecture and references

Keep React Native **0.81.5**, React **19.1.0**, shared screens/content and AsyncStorage. Own the Android Gradle and iOS Xcode projects in this repository. Use the React Native Community CLI/Metro for native development and bundling, a small explicit shared router, and an independent esbuild/React Native Web build. No Expo package, config plugin, CLI, EAS service or Expo credential belongs in the maintained path.

The versioned [React Native 0.81 environment guide](https://reactnative.dev/docs/0.81/set-up-your-environment) documents the native toolchain, including Node 20.19.4 or newer and recommended JDK 17. This repository keeps its already tested Node 22.23.0/npm 10.9.4 baseline. The [framework-free setup guide](https://reactnative.dev/docs/0.81/getting-started-without-a-framework) documents versioned Community CLI initialization, Metro and CocoaPods. A generated project is a starting point; checked-in projects and reproducible builds remain the repository's responsibility.

The [esbuild API](https://esbuild.github.io/api/) supplies an independent browser build with explicit entry, React Native Web alias, platform resolution and JSX transforms. Native speech uses [react-native-tts](https://github.com/ak1394/react-native-tts), wrapped behind the existing controller contract; its engine initialization, voices, utterance identifiers and finish/cancel/error events require dedicated adapter checks. Web keeps the existing direct browser speech adapter. These choices preserve replaceable platform boundaries and introduce no new app backend, account or analytics service.

Installed-source review of `react-native-tts` 4.1.1 found that Android derived utterance IDs from the spoken text's hash. Consecutive identical words could therefore receive one another's delayed events. `scripts/patch-native-tts.cjs` applies a version-guarded postinstall change to UUID IDs and fails on unexpected source drift. The adapter keeps iOS subscriptions within that platform's actual supported event list; failed iOS starts use the bridge promise. Neither source inspection nor injected adapter tests substitute for the native runtime checks below.

Run 04 native execution additionally exposed malformed iOS `BOOL *` bridge parameters in `react-native-tts` 4.1.1. The guarded install patch converts Stop/Pause/Ducking/rate-transform arguments to scalar `BOOL`, which React Native 0.81.5 TurboModule interop supports. Installed-source ABI and patch-drift regressions accompany the actual rebuilt speech checks. The owned iOS bootstrap now uses a single `UIWindowScene`, preserving warm and cold scheme links. See the [Run 04 native report](evidence/run04/ios/README.md) for tested runtime limits and the independent input diagnostic.

Eclipse Timer's [local build workflow](../../eclipse-timer/.github/workflows/eas-build.yml), [runner guide](../../eclipse-timer/documents/planning/self-hosted-macos-runner.md), [Android screenshot workflow](../../eclipse-timer/.github/workflows/android-emulator-screenshots.yml) and [iOS screenshot workflow](../../eclipse-timer/.github/workflows/ios-simulator-screenshots.yml) inform local execution, toolchain provisioning, named artifacts and capture manifests. They still invoke local EAS/Expo, require `EXPO_TOKEN`, and contain unrelated upload/submission steps. Its Android project also resolves Expo's entry/CLI and applies Expo autolinking/plugins; no maintained iOS project was found. Those dependencies and publication steps are not part of this migration.

## Inspected Expo consumers and replacements

| Area | Run 02 consumer | Selected replacement / preservation condition |
|---|---|---|
| Entry | `package.json`: `expo-router/entry` | Repository native entry registered through `AppRegistry`; independent web entry; one shared root. |
| Routes and lifecycle | `app/_layout.js`, screen imports, `src/components/ui.js`, `PlaybackStatus.js`, `src/hooks/usePlayback.js`; Router `push`, `replace`, `back`, `canGoBack`, `usePathname`, `useFocusEffect` | Typed explicit route table and small router using browser history plus native Linking/BackHandler. Preserve focus cleanup, Home fallback, deep links and route titles. |
| Page metadata | Router `Head` in root, sitemap and not-found screens | Browser document metadata and build-generated HTML metadata. Preserve distinct meaningful titles on direct loads and navigation. |
| Speech | `src/lib/speech.js`: Expo Speech enumeration, speak and stop | `react-native-tts` adapter; retain shared playback owner, voice preparation and browser adapter. Stop must invalidate queued native preparation as well as utterances. |
| Icons and fonts | `@expo/vector-icons` Ionicons in root/shared controls and `src/types.ts`; transitive font loading | Small repository-owned decorative icon component. Keep named controls and hidden decorative graphics; avoid a remote font request or startup glyph mismatch. |
| Splash/status/system UI | Expo SplashScreen, StatusBar and System UI in root | Native launch resources plus React Native status bar/theme integration and safe areas. Hold app content behind the existing preference hydration boundary. Native appearance must be rechecked. |
| Metadata/config | Expo object in `app.json`, router/splash plugins, typed-route/react-compiler experiments | Neutral shared app metadata; explicit Android manifest/resources/Gradle and iOS plist/project settings. No config generation dependency. |
| Native projects | `/android` and `/ios` ignored; no owned projects in baseline | Tracked framework-free projects, Gradle wrapper, CocoaPods declarations/lock when actual resolution succeeds; ignore generated outputs and private signing files only. |
| Native peers | React Navigation, gesture handler, reanimated, screens and worklets installed for Router architecture | Remove only after consumer/autolinking review proves they are unused. Keep AsyncStorage and safe-area support required by maintained code. |
| Build/development | `expo start`, `expo export`, compatibility check; `reset-project.js` recreates Expo scaffold | Direct Community CLI/Metro, Gradle and Xcode commands; independent web build/server; remove unused destructive reset scaffold. |
| Types | `expo/tsconfig.base`, `.expo/types`, `expo-env.d.ts`, `generate-route-types.cjs` | Explicit checked-JS/TypeScript configuration and route union. Invalid route/data/speech probes must still fail. |
| Lint | `eslint-config-expo/flat` | Explicit ESLint/React/hooks configuration covering maintained code and scripts. |
| CI | Expo compatibility/export/environment flag, JS-only platform evidence | Locked npm installation, types/lint/tests/audit, independent production web/browser checks and direct native jobs on suitable runners. Build artifacts must not silently use debug signing for release. |
| Documentation | README, privacy page/policy, audio worksheet and earlier evidence | Update current provider/build instructions; retain historical Expo evidence labeled by run. Historical prose does not imply a current dependency. |

The baseline also declares `expo-constants`, `expo-linking`, `expo-font`, `expo-splash-screen`, `expo-status-bar`, `expo-system-ui` and Expo itself. Inspect both the final lockfile and installed dependency graph; removing direct manifest entries alone cannot satisfy P00.5.

## Behavior and identity that must survive

| Contract | Required evidence on replacement stack |
|---|---|
| App identity | `NATO Phonetics`, version `1.0.0`, Android/iOS identifier `com.natophonetics.app`, URL scheme `natophonetics`. Document native build numbering; do not infer installed signing compatibility. |
| Targets | Android, iOS including iPad, web. Retain portrait intent and record any native supported-orientation differences explicitly. No Windows/macOS/watch/TV target is implied by a library's support list. |
| Public routes | `/`, `/alphabet`, `/converter`, `/letter-quiz`, `/menu`, `/settings`, `/about`, `/voice-select`, `/privacy`, `/audio-help`, `/_sitemap`, `/+not-found`; unknown URLs show the maintained not-found flow. Preserve direct entry, hard refresh, internal/back/Home paths and scheme deep links. |
| Stored preferences | Keep `nato.preferences.v1` schema and legacy `darkMode`/`selectedVoice` migration using the same AsyncStorage package. Fresh/saved/failed/rapid-change/reset flows must pass; reset must preserve unrelated learning data. Native upgrade verification remains required. |
| Audio | Canonical word, pronunciation and `speechText` remain separate for all 36 symbols. Rapid replacement, Stop during word/pause/preparation, late callbacks, missing callbacks, navigation/unmount/background, failed storage and removed voice must preserve completed/failed/cancelled outcomes. |
| Voice selection | All eligible English qualities/locales, System Default, loading/empty/error/retry and removed voice fallback. Native provider IDs must remain usable where the engine returns the same IDs. Changing to Default must clear a previously set native voice rather than retain it invisibly. |
| Theme and layout | Live System/Light/Dark, neutral preference-loading boundary, themed header/status area, insets, 320px scrolling and actual 200% text. Browser appearance does not prove native system-bar or keyboard behavior. |
| Accessibility | Button/radio names and state, keyboard activation/focus, visible feedback, unrevealed quiz answer excluded from the accessibility tree, four unique choices and explicit Next/Replay. |
| Assets | Preserve existing icon/favicon/splash source and branding while moving native ownership. R19's opaque monochrome-mask defect remains open until its dedicated repair is verified. |
| Privacy | No microphone permission for TTS. Provider-dependent speech connectivity/privacy wording remains honest; local shell, synthesis input tests and screenshots do not establish audible correctness or offline speech. |

## Migration and verification sequence

1. Preserve the uncommitted Run 01/02 tree and historical evidence; record current metadata, routes, storage keys and dependencies before replacement.
2. Replace shared routing/icons/metadata and speech adapter while keeping canonical content, preference store, playback controller and existing screen behaviors. Compile/typecheck all active modules.
3. Add owned native projects with explicit identity, links, resources and signing boundaries; replace Metro/Babel/tooling and remove Expo consumers/configuration/scaffold only as replacements land.
4. Produce independent web output with every maintained direct route; run the existing full browser and preference suites against that production output. Add route/history/deep-link and native speech-adapter checks where migration introduces new boundaries.
5. Perform a fresh locked installation, inspect installed/transitive dependencies plus Gradle/Pod/bundling scripts, re-run raw npm audit and reconcile the actual security inventory. A previous accepted audit fingerprint is not a new pass.
6. Compile, install and run Android debug and iOS simulator apps using direct toolchains, then exercise native links/back/theme/storage/speech lifecycle. Build signed release artifacts only when the signing inputs exist; missing signing must not block debug/simulator work.
7. After implementation and checks, capture actual running web desktop/mobile, Android and iOS states under `docs/evidence/run03/screenshots/`. Record candidate/artifact identity, date, platform, OS/browser, viewport/device, theme, screen/state and command in an index. Inspect images; recapture after any relevant fix. Missing captures retain an exact target/blocker/task, never a substituted browser image.

## Initial environment observations (not final build results)

The existing isolated Node toolchain is `/tmp/nato-phonetics-toolchain/node_modules/.bin` (the earlier runs document Node 22.23.0/npm 10.9.4). Existing browser tooling is Puppeteer under `/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules` and Microsoft Edge under `/Applications/Microsoft Edge.app`; use disposable profiles and record actual versions during checks.

At initial inspection, `xcode-select -p` returned `/Library/Developer/CommandLineTools`. Setting `DEVELOPER_DIR=/Applications/Xcode.app/Contents/Developer` for a command found Xcode **27.2, build 27B52**, but `xcrun simctl list runtimes` and `list devices available` stopped because the Xcode license had not been accepted. `java -version` and `/usr/libexec/java_home -V` found no runtime. No Android SDK, Android Studio or CocoaPods was found in the inspected standard paths; `adb version` reported **36.0.2-14143358** and `adb devices -l` showed no device.

These observations warrant provisioning/investigation, not a claim that native builds fail. Ordinary tool installation and automated native checks remain P00 work. A restricted owner/admin license/access action, if required, belongs in M11.2; absent toolchains and unrun compilation must remain explicit P00 blockers until resolved. Final results and exact remaining blockers belong in the Run 03 execution record.
