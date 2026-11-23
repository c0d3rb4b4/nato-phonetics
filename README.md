# NATO Phonetics

**Web offline updates, 22 November 2026.** If an update fails while another window is checking the current offline copy, Menu keeps the error visible. Use Retry offline setup to try the update again. [Checks and screenshots](docs/evidence/run39/README.md).

**UI update, 22 November 2026.** Menu uses compact destination rows. Settings groups Converter controls, Appearance, and the current voice. Reset Preferences shows which choices it restores and keeps Learning Progress. In Voice Select, filter by name, locale or quality and use the separate Play control to preview a voice. Use Refresh voice list after installing voices, or Retry voice list after a loading failure. [Rollout status](docs/UI_DESIGN_LANGUAGE.md) · [Screenshots](docs/evidence/run34/screenshots/index.md).

**Android build and quiz update, 20 November 2026.** The ordinary Release APK and AAB contain all four configured Android ABIs. The locked install prepares the React Native 0.81.5 live text-sizing repair, and Gradle selects the source renderer with the pinned Release Hermes engine. On Android 13 and 16, changing font size during a submitted letter question preserved the answer, enlarged feedback and controls, and allowed the learner to finish the round and retry the missed letter. Both default x86_64 installations were verified in the running process. [Run 32 evidence](docs/evidence/run32/README.md) · [actual quiz and converter screenshots](docs/evidence/run32/screenshots/index.md).

**Historical Run30 Android checkpoint — 20 November 2026:** original complete production Release tile contexts on unchanged APK5dfa45d2 now pass505 actual native baselines/217 ink observations, with93 scoped window and21 complete-narrow baselines, retained converter/quiz state and explicit Next.30 actual Android captures inspected.11 scoped tests/lint pass; observer/selection failures remain archived. Ordinary clean/default source integration and exact-artifact retests are next P1; broader runtime/integrated/M11 acceptance remains open. Default Maven retains the historical defect. [Evidence](docs/evidence/run30/README.md), [screenshots](docs/evidence/run30/screenshots/index.md), [next Android](docs/evidence/run30/android/next-android.md).

**Historical Run29 Android checkpoint — 20 November 2026:** an inspector-free, test-only Release fixture/native observer now passes60 strict frame/widget comparisons,12resize/12narrow and3edit checks on the exact preserved Release native/Hermes payload.487 other non-signature APK entries, including dependency metadata, match the original. Scoped unchanged production Release converter/submitted quiz/Next samples,12tests/lint and40inspected actual captures pass. Full production Release baseline/ink/context/window acceptance, ordinary clean/default integration and other ABI runtime remain open P1. Initial tool/packaging failures are retained and corrected final qualification is separate. [Evidence](docs/evidence/run29/README.md), [captures](docs/evidence/run29/screenshots/index.md), [next P1](docs/evidence/run29/android/next-android.md).


A shared React Native app with repository-owned Android/iOS projects and an independent React Native Web build. It includes letter/digit reference, conversion with Copy/Share/Replay/pacing/paged cards, guarded practice sessions/results/Retry, listening and typed recall, local symbol progress/due review, appearance and voice selection. Run 16 adds a verified web offline shell, readiness/retry guidance and updates that wait for all app windows to close. Run 17 updates the compatible Metro family to remove the vulnerable image-size parser and prepares an unsigned Android Release AAB. Run 18 backports the merged Yoga precision correction for clipped iOS paragraphs, with guarded installation and a native rebuild. Run20 adds [reproducible static web archives and concrete hosting configuration](docs/WEB_DISTRIBUTION.md), with actual local update/rollback qualification. Run21 repairs asynchronous host verification and qualifies three-engine tab-close/update/rollback/repair/cold-offline scopes; WebKit process-close during a waiting update remains failed. Run22 adds shared local/Actions host execution (remote qualification remains open). Run23 delivers the compatible CLI/parser security repair and actual affected native/build verification. Run24 adds explicit CI transition selection, separate worker-generation/cache observations and scoped iOS long-export qualification; retained browser/native failures remain open. Run25 adds test-only first-save boundary tracing,18 passing three-engine recovery scenarios and a CI gate; a separate host rejected-update feedback check fails and remains open. Run26 adds a pinned opt-in Android source repair for live ordinary-text sizing, with separate owner/adoption, measurement-cache and editable-widget refresh fixes. Six actual native regressions,60 strict runtime frame/widget comparisons,3 committed-edit checks and5 real-product test-IME composition checkpoints pass. 198current native baselines and live/narrow window checks also pass. Run27 completes the original current-source tile scope with625 native baselines/271 ink observations, then builds unsigned ARM64 source Release APK/AAB and passes6 native cases/5 real-product test-IME checkpoints. At the Run27 checkpoint, other ABIs, full Release affected gates and default-build integration remained active P1; [exact Android resume step](docs/evidence/run27/android/next-android.md). [Current evidence](docs/evidence/run27/README.md), [25 actual screenshots](docs/evidence/run27/screenshots/index.md) and [delivery status](docs/DELIVERY_PLAN.md) distinguish delivered engineering from remaining native and human acceptance.

**Run28 engineering checkpoint:** remaining source Release ABIs (armeabi-v7a/x86/x86_64) pass build/package/identity and native consumer links; Run27 ARM64 evidence retained. The harness now selects/checks ABI, and explicit `NATO_BUILD_JOBS=1..4` also bounds Metro. Fresh ARM64 native regressions,8 scoped tests/lint and4 actual captures pass. Full Release affected gates, other ABI runtime and ordinary default integration stay open; standard Maven still has the historical bug. [Evidence](docs/evidence/run28/README.md), [screenshots](docs/evidence/run28/screenshots/index.md), [next P1](docs/evidence/run28/android/next-android.md).

P05, P06 and P08–P10 remain active. P05.2 retains the additional-ABI and broader runtime accessibility checks. Run18 repairs the observed default iOS policy ending; original iOS long-drag/max progress navigation, broader runtime/AT and three strict P3 ink fringes stay open. Run23 raw audit and review pass with zero findings after a compatible CLI/parser upgrade. Recognition on additional targets, signed distribution, actual public HTTPS hosting and integrated/M11 acceptance remain unfinished. [Delivery status](docs/DELIVERY_PLAN.md), [local progress](docs/LOCAL_PROGRESS.md), [recognition assessment](docs/SPOKEN_PRACTICE.md).

## Setup and local development

Use Node **22.23.0** (`.nvmrc`) and npm **10.9.4**.

```bash
git clone https://github.com/c0d3rb4b4/nato-phonetics.git
cd nato-phonetics
npm ci
npm run web
```

Open the URL printed by the web server. For native development, start Metro with `npm start`, then `npm run android` or `npm run ios` with the platform toolchain installed. Follow [Native builds](docs/NATIVE_BUILDS.md) for SDKs, direct Gradle/Xcode commands, signing, artifacts and installation. No Expo/EAS tooling, accounts or build quota is used. Store signing/distribution access remains an owner input in M11. [Release runbook](docs/RELEASE_RUNBOOK.md) covers candidate identity, build numbering, artifact/signing boundaries, independent HTTPS hosting, update/rollback and current support limits. Production shell caching is implemented; [offline/update rules](docs/WEB_OFFLINE.md) distinguish qualified local behavior from remaining hosted/browser/device checks. Publication is not implied.

The React Native [0.81 environment guide](https://reactnative.dev/docs/0.81/set-up-your-environment) describes upstream requirements. This repository retains RN **0.81.5** and React **19.1.0** to isolate the build migration from a framework upgrade. See [migration inventory](docs/P00_MIGRATION.md) for replacement choices and preservation requirements.

## Maintained entry points and checks

`index.js` registers `NATOPhonetics` for native builds; `index.web.js` mounts the same application for web. Screens remain in `app/`, shared logic in `src/`. `src/navigation/` owns route types, native links/back handling and browser history. Decorative icons use React Native primitives; no icon-font download is needed. Metadata is in `app.json`; native identifiers/version codes are also explicit in Gradle and Xcode and must be updated together for release.

| Command | Purpose |
|---|---|
| `npm start` | React Native Metro development server |
| `npm run android` / `npm run ios` | Local development launch |
| `npm run web` | Independent browser development build/server |
| `npm run export:web` | Production web app and route HTML in `dist/` |
| `npm run package:web -- dist NEW_ARCHIVE.tar.gz [PRIOR_PUBLIC_DIR ...]` | Verified deterministic static candidate with concrete Caddy config and retained immutable assets; [instructions](docs/WEB_DISTRIBUTION.md) |
| `npm run lint` | ESLint with hooks and JSX checks, no warnings |
| `npm run prepare:android:source` | Reapply the version- and hash-guarded renderer preparation performed by `npm ci`. Add `-- --check` for read-only verification. [Native builds](docs/NATIVE_BUILDS.md#android) |
| `npm run check:android:font-scale -- OUTPUT --sweep --editing` | Strict actual Android live/cold frame/widget and editing gate; dedicated fixture Metro, intended APK and explicit ANDROID_SERIAL required |
| `npm run typecheck` | Checked JS/JSDoc and TypeScript over active screens, entries and helpers |
| `npm test` | Data, preferences, progress, questions, playback, native adapter, release artwork, bounded Metro asset parsing and audit regression tests |
| `npm run generate-icons` | Generate/verify all web and native icon/splash resources; rebuild native apps afterward |
| `npm run check:yoga` | Compile installed Yoga and check dimensions/rounding; requires a C++20 compiler (Xcode clang or Linux g++) |
| `npm run check:dependencies` | Installed graph/lockfile and native/web consumer check for Expo removal |
| `npm run audit:review` | Real npm audit plus dated high/critical dispositions; not a clean-audit claim |
| `npm run build:android:debug` | Direct Gradle debug APK |
| `npm run build:android:develop` | Standalone development APK with bundled JS, a separate app ID and the public development key |
| `npm run build:android:release` | Direct Gradle APK and AAB, signed when the approved keystore is available |
| `npm run ios:pods` | Install native dependencies using the locked Ruby toolchain |
| `npm run build:ios:simulator` | Direct Xcode Release simulator build, no signing |
| `npm run build:ios:archive` / `npm run build:ios:export` | Credential-dependent distribution preparation |

Keep npm install scripts enabled. The postinstall checks the original or reviewed hashes for 13 React Native files, prepares the Android renderer and the Yoga precision fix used by both source-built native targets, and applies the speech provider patch. Rebuild native apps after changing these sources. Android compiles and registers the pinned speech bridge in the app. The rebuilt Android 16 development app lists installed voices and preserves the saved choice during preview. [Installed verification](docs/evidence/run37/README.md). Android speech uses distinct IDs for repeated utterances so a late callback cannot finish a later replay. [Renderer preparation](scripts/prepare-android-source.cjs), [speech patch](scripts/patch-native-tts.cjs), [Yoga evidence](docs/NATIVE_TEXT_PRECISION.md).

Download app builds from [GitHub Releases](https://github.com/c0d3rb4b4/nato-phonetics/releases). A `develop` push publishes one installable Android APK as a prerelease. An approved production run on `main` publishes the signed APK, AAB and IPA together. PR and manual CI run the shared gates and production browser tests. [Develop workflow](.github/workflows/develop-apk-release.yml) · [Production workflow](.github/workflows/mobile-release.yml) · [Release runbook](docs/RELEASE_RUNBOOK.md#branch-builds-and-downloads). [Security review](docs/SECURITY_REVIEW.md) records unresolved findings. Run 17 removes image-size through Metro 0.83.8 within the existing React Native 0.81.5 ranges. Run23 upgrades the CLI family to20.2.0 and resolves patched fast-xml-parser5.12.1 through its upstream ranges; clean installation,151 tests,actual CLI/XML/native scopes and raw audit/review0 with zero findings qualify this dependency repair. Historical withdrawn matcher backtracking is not a package repair. [Current evidence](docs/evidence/run23/README.md). No framework upgrade or owner risk acceptance is implied.

## Web routing and browser checks

The web build emits HTML for each supported URL and a root fallback shell. Hosts must serve `/alphabet` from `alphabet.html` (equivalently for other routes) and serve `index.html` for unknown paths; the supplied local server handles this. Deploy `dist/` as a whole at the origin root. This is a client-rendered app with a neutral loading shell, followed by stored-preference restoration. Production builds register a versioned service worker; Menu reports offline readiness, setup/retry or waiting updates. After successful setup the complete shell works offline; speech remains provider-dependent. Finish/save or copy drafts, close every app window and reopen to apply an update. Development does not register a worker: use distinct preview/development ports to avoid a cached production shell. [Caching/update/support contract](docs/WEB_OFFLINE.md).

Install Puppeteer outside the app and supply its location and a browser executable:

```bash
npm install --prefix /tmp/nato-browser --no-save --package-lock=false puppeteer@24.43.1
export NODE_PATH=/tmp/nato-browser/node_modules
export BROWSER_EXECUTABLE="$(NODE_PATH=/tmp/nato-browser/node_modules node -e 'process.stdout.write(require("puppeteer").executablePath())')"
npm run export:web
node scripts/verify-preferences-browser.cjs dist
node scripts/verify-app-browser.cjs dist
node scripts/verify-tiles-browser.cjs dist
node scripts/verify-pacing-browser.cjs dist
node scripts/verify-numeric-browser.cjs dist
node scripts/verify-recall-browser.cjs dist
node scripts/verify-progress-browser.cjs dist
node scripts/verify-progress-concurrency-browser.cjs dist
node scripts/verify-progress-lifecycle-browser.cjs dist
node scripts/verify-offline-browser.cjs dist
```

Browser mocks verify speech control flow, not pronunciation or provider privacy. Real captures and platform gaps are linked from the execution record.

For the production persistence/offline runtime matrix, install the separate pinned runner and its browser binaries:

```bash
npm install --prefix /tmp/nato-playwright --no-save --package-lock=false playwright@1.65.1
node /tmp/nato-playwright/node_modules/playwright/cli.js install chromium firefox webkit
NODE_PATH=/tmp/nato-playwright/node_modules BROWSER_EXECUTABLE= node scripts/verify-browser-support.cjs dist artifacts/browser-support/chromium chromium
NODE_PATH=/tmp/nato-playwright/node_modules node scripts/verify-browser-support.cjs dist artifacts/browser-support/firefox firefox
NODE_PATH=/tmp/nato-playwright/node_modules node scripts/verify-browser-support.cjs dist artifacts/browser-support/webkit webkit
NODE_PATH=/tmp/nato-playwright/node_modules node scripts/verify-progress-recovery-browser.cjs dist artifacts/progress-recovery/webkit webkit
```

Run 19 qualifies Edge157, Playwright Firefox159 and WebKit27.2 on macOS for simultaneous progress saves, deletion/Retry, real lock timeout and persistent offline reopening. The separate Puppeteer lifecycle check measures actual Chromium page freeze/resume and deletion safety. WebKit automation does not establish branded Safari/iOS support; an actual page freeze does not establish OS process suspension. The runner requires no app dependency change and CI retains each engine's report/captures independently of the failed security gate. [Evidence and exact diagnostic boundaries](docs/evidence/run19/README.md).

Run25 adds first-answer recovery qualification with `verify-progress-recovery-browser.cjs`, accepting the same engine argument (`chromium`, `firefox`, `webkit`). Each engine checks ordinary first save, deliberate quota failure and actual held-lock timeout/real pointer Retry at desktop/light and320px/dark; exactly one successful write/answer and exact read-only reload are required. The host runner also retains test-only storage/lock exception/abort/generation/count traces on first save/failure. No production logging/key/schema is added. Controlled recovery does not establish the cause of Run24’s spontaneous WebKit failure. The actual Run25 host command passes first save but fails rejected-update feedback while the original shell remains ready; later host scopes are unrun. [Reports and retained failures](docs/evidence/run25/README.md).

The app opens to Reference, with side-by-side Letters and Digits selectors. The bottom menu gives access to Reference, Word Converter, Letter Quiz and Menu. Reference, the converter’s Full cards view and the quiz share the original 11:15 portrait tile. Bundled fonts and shared geometry keep the letter, word and pronunciation in fixed positions. Larger text enlarges the whole tile, and grids reflow and scroll. The [tile specification](docs/TILE_DESIGN.md) records the dimensions, font provenance and verification tolerances.

## Storage, audio and privacy

Letter Quiz groups the answer mode, symbols, review scope and round length before Start round. From quiz setup or Menu, open Learning Progress to see saved totals, review status for each symbol and the confirmed Clear Progress action. [Practice setup](docs/NUMERIC_PRACTICE.md) · [Local progress](docs/LOCAL_PROGRESS.md).

Preferences are stored locally in `nato.preferences.v1`. Legacy `darkMode` and `selectedVoice` values migrate while preserving unrelated data. Reset Preferences restores appearance, voice, converter display and playback pace. There are no accounts, backend or analytics.

Each submitted quiz answer saves per-symbol attempts/errors and review times in separate `nato.progress.v1` storage. Menu → Learning progress shows saved totals, due symbols and the last missed symbols; its confirmed Clear Progress action keeps preferences. Reset Preferences keeps progress. Failed/unsupported reads preserve data; failed writes expose Retry with unsaved events held only until the app closes. Typed responses and full recaps are never saved. Updated browser windows merge answers under a shared lock, refresh summaries and prevent stale Retry from restoring cleared progress. Browser persistence requires HTTPS (or secure localhost) and Web Locks; unsupported capability shows guidance while practice remains available. Web Clear retains only a random deletion marker with no answers/identity before new progress is added; native Clear removes the key. Refresh all legacy app windows after an update. See [deployment/rollback](docs/RELEASE_RUNBOOK.md) and [local progress and review rules](docs/LOCAL_PROGRESS.md) for the versioned schema, 1/3/7/14/30 elapsed-day schedule, date/clock behavior and deletion semantics.

Settings → Audio Help provides a sound test, Stop, voice selection and recovery guidance. New playback replaces previous playback. Stop, navigation, backgrounding and input edits cancel remaining words/pauses. The native adapter uses **react-native-tts 4.1.1**, backed by Android TextToSpeech or iOS AVSpeechSynthesizer; web uses browser SpeechSynthesis. Delayed initialization and terminal events are guarded, failures are explicit and missing callbacks time out. Voice availability, processing location and connectivity depend on the provider. No microphone is used for playback. [Audio validation](docs/AUDIO_VALIDATION.md) contains the outstanding device/listening worksheet; [PRIVACY.md](PRIVACY.md) lists the actual data/provider behavior.

The play icon reads the full phrase from the start and switches to a stop icon during playback. The converter highlights the word being read. Menu → Settings → Word Converter lets you choose Phonetic bubbles or Full cards, speed (0.75×, 1× or 1.25×), and the pause between words (0, 300 or 700 ms). The ordinary token gap is 120 ms. Reset Preferences restores bubbles, 1× speed and a 300 ms pause.

The converter displays results directly below the input in pages of up to 24 tokens. Copy or share opens the full selectable text. Phrase playback, copying and sharing use the entire input. Tab switches preserve the draft.

Release artwork is generated from outlined vector sources with separate adaptive foreground/background and a transparent monochrome mask. Generation verifies dimensions, safe bounds, alpha and all 22 shipped consumers; failures exit nonzero without claiming success. See [release assets](docs/RELEASE_ASSETS.md). On eligible Android 12+ devices, choose **Speak a code word** in Letter Quiz. Tap **Start recording** to grant microphone access, then tap again when ready. The device’s US English recognizer returns a draft. Edit it or type an answer and tap **Check answer** to score it. Web and iOS currently offer listening and typed practice. [Recognition support and verification](docs/SPOKEN_PRACTICE.md). Progress and other affected native flows retain open qualification; automated checks do not establish release acceptance.

The alphabet reference now includes a Digits 0–9 view using the same portrait cards and audio controller. Letter Quiz offers Letters, Digits, Letters and digits, Postcode symbols (`SW1A 1AA`) and Callsign symbols (`N359AB`). Choose 5, 10 or a complete set (26 letters, 10 digits, 36 mixed symbols, or the example’s distinct symbols). Each symbol appears once before the shuffled deck repeats. Example questions practise distinct symbols in shuffled order; Hear example speaks the complete original sequence, with a word-boundary pause for the postcode. Canonical Three/Five/Nine display with intentional `tree`/`fife`/`niner` provider inputs; human listening/content acceptance remains pending M11.3. Category/set choices stay in memory.

Practice uses a shuffled coverage deck. Submit once, then use Replay or Next; the last answer stays visible until View results. Results show answered count, score/accuracy and every missed answer. Retry Mistakes asks once per missed symbol. End round and review retains a partial recap. Switching tabs keeps the current round and feedback. Choosing a new round keeps the recap until Start new round replaces it. Rounds and results stay in memory only and clear when the app process closes or the page reloads. They are not saved progress.

Due review and Focus on mistakes filter the selected symbol set using saved progress. Due includes previously practised symbols whose review time has arrived; Focus includes symbols whose last saved answer was incorrect. Review rounds cap length at available symbols and never repeat within that round. Empty lists leave full practice available. Review symbols are fixed at Start; new answers update future reviews. All modes, including listening text alternatives, share totals.

Converter tools use one token model for display, playback and plain-text Copy/Share. ASCII lowercase matches uppercase, and digits use their canonical code words in text. Spaces, tabs and newlines form a word boundary, shown as `/` in plain text and read with the configured pause. The literal separators `- . / @ +` are read as dash, dot, slash, at and plus. Unsupported characters appear with a `not spoken` marker and their original code point, including in copied or shared text. Editing the input stops playback.

Copy writes only on request. Share opens the platform sheet where supported. If exporting is unavailable, select the plain text conversion and use the device’s Copy action. Clipboard history and receiving apps have their own controls. The native clipboard adapter uses the deprecated public API in React Native 0.81.5. [Run 09 evidence](docs/evidence/run09/README.md) records the platform checks.

Voice selection supports search by name, locale code or quality and exact locale filters. System Default and its preview remain available even when no installed voice matches. Reset voice filters restores the complete English list without changing the saved voice. Reference category, practice set and search/locale filters stay in memory only; Reset Preferences continues to affect only the documented saved preferences.

Letter Quiz offers Choose a code word, Listen and choose a symbol, and Type a code word across the existing sets. Listening hides the answer tile until submission; Play/replay, Stop and a code-word text alternative are explicit. Typed responses ignore case, accents, spaces and punctuation and accept Alpha/Juliet aliases; use canonical Three/Five/Nine rather than pronunciation guides. Blank input stays on the question. Drafts survive tab switches and clear on the next question or new round. Modes, drafts and text alternatives stay in memory only. [Answer rules](docs/NUMERIC_PRACTICE.md#listening-and-typed-recall-run-12).


Shared local/remote host commands, source/artifact identities, failure logs and the independent unsigned native workflow are documented in [NATIVE_BUILDS.md](docs/NATIVE_BUILDS.md#shared-host-execution--run22). `npm run build:host -- web --install --output artifacts/host-web-001` runs the same build path used by distribution CI. Remote execution remains unverified; P10.8 stays active.
