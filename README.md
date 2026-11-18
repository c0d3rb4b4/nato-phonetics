# NATO Phonetics

A shared React Native app with repository-owned Android/iOS projects and an independent React Native Web build. It includes letter/digit reference, conversion with Copy/Share/Replay/pacing/paged cards, guarded practice sessions/results/Retry, listening and typed recall, local symbol progress/due review, appearance and voice selection. Run 16 adds a verified web offline shell, readiness/retry guidance and updates that wait for all app windows to close. Run 17 updates the compatible Metro family to remove the vulnerable image-size parser and prepares an unsigned Android Release AAB. Run 18 backports the merged Yoga precision correction for clipped iOS paragraphs, with guarded installation and a native rebuild. [Current evidence](docs/evidence/run18/README.md), [actual screenshots](docs/evidence/run18/screenshots/index.md) and [delivery status](docs/DELIVERY_PLAN.md) distinguish delivered engineering from remaining native and human acceptance.

P05/P06/P07/P08 remain active for affected native qualification. Android live font-size changes can keep ordinary text stale. Run 16 also records clipped final words in the default iOS Release speech-policy paragraph; a cold-process/title-body experiment did not repair it. Original iOS long-drag/input/runtime and maximum long-page navigation assurance, broader browser support/upgrade assurance and three strict P3 ink fringes remain open. Two-window Edge progress integrity is now qualified for the updated client. P09/P10 are active: recognition assessment and release assets are delivered; recognition implementation, hosted/broader-browser offline qualification, integrated candidate/security/support and physical M11 acceptance remain unfinished. [Practice rules](docs/NUMERIC_PRACTICE.md), [local progress](docs/LOCAL_PROGRESS.md), [recognition assessment](docs/SPOKEN_PRACTICE.md).

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
| `npm run lint` | ESLint with hooks and JSX checks, no warnings |
| `npm run typecheck` | Checked JS/JSDoc and TypeScript over active screens, entries and helpers |
| `npm test` | Data, preferences, progress, questions, playback, native adapter, release artwork, bounded Metro asset parsing and audit regression tests |
| `npm run generate-icons` | Generate/verify all web and native icon/splash resources; rebuild native apps afterward |
| `npm run check:yoga` | Compile installed Yoga and check dimensions/rounding; requires a C++20 compiler (Xcode clang or Linux g++) |
| `npm run check:dependencies` | Installed graph/lockfile and native/web consumer check for Expo removal |
| `npm run audit:review` | Real npm audit plus dated high/critical dispositions; not a clean-audit claim |
| `npm run build:android:debug` | Direct Gradle debug APK |
| `npm run build:android:release` | Direct Gradle AAB; unsigned unless private signing is supplied |
| `npm run ios:pods` | Install native dependencies using the locked Ruby toolchain |
| `npm run build:ios:simulator` | Direct Xcode Release simulator build, no signing |
| `npm run build:ios:archive` / `npm run build:ios:export` | Credential-dependent distribution preparation |

`npm ci` applies a small version-guarded [native speech patch](scripts/patch-native-tts.cjs): Android utterance IDs become UUIDs rather than hashes of spoken text, so delayed events from one “Alfa” cannot finish the next “Alfa.” Installation fails if the pinned provider source changes. Do not use `--ignore-scripts` for a delivery installation. The adapter tests also verify the installed source patch. Installation also applies the RN0.81.5/source-SHA-256-guarded [Yoga precision backport](scripts/patch-native-yoga.cjs), preserving full paragraph heights in source-built iOS. Rebuild/install iOS after this patch; refreshing Metro does not change the native library. Standard Android builds retain their Maven native binary. [Diagnosis, guards and qualification](docs/NATIVE_TEXT_PRECISION.md). Native audible playback remains a device check.

CI runs the shared gates and production browser tests. A separate manually triggered [native workflow](.github/workflows/native-builds.yml) builds on a prepared self-hosted macOS runner and collects artifacts without publishing. Hosted/self-hosted workflow execution is not implied by local results. [Security review](docs/SECURITY_REVIEW.md) records unresolved findings. Run 17 removes image-size through Metro 0.83.8 within the existing React Native 0.81.5 ranges. The current audit still reports 28 high/3 low affected package entries; picomatch has no selected repair or new disposition, so the security gate remains failed. No framework upgrade or owner risk acceptance is implied.

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
node scripts/verify-offline-browser.cjs dist
```

Browser mocks verify speech control flow, not pronunciation or provider privacy. Real captures and platform gaps are linked from the execution record.

The alphabet, converter and quiz use one portrait tile with the original 11:15 proportions. Bundled, pinned font faces and shared geometry keep the letter, word and pronunciation in fixed positions. Larger text enlarges the whole tile; grids reflow and scroll. The [tile specification](docs/TILE_DESIGN.md) records recovered dimensions, completed typography, font provenance and verification tolerances. Native orientation changes are enabled; the current device matrix and remaining verification are recorded with each delivery run.

## Storage, audio and privacy

Preferences are stored locally in `nato.preferences.v1`; legacy `darkMode`/`selectedVoice` values migrate without deleting unrelated data. Reset Preferences restores appearance, voice and converter pace while retaining unrelated data. There are no accounts, backend or analytics.

Each submitted quiz answer saves per-symbol attempts/errors and review times in separate `nato.progress.v1` storage. Menu → Learning progress shows saved totals, due symbols and the last missed symbols; its confirmed Clear Progress action keeps preferences. Reset Preferences keeps progress. Failed/unsupported reads preserve data; failed writes expose Retry with unsaved events held only until the app closes. Typed responses and full recaps are never saved. Updated browser windows merge answers under a shared lock, refresh summaries and prevent stale Retry from restoring cleared progress. Browser persistence requires HTTPS (or secure localhost) and Web Locks; unsupported capability shows guidance while practice remains available. Web Clear retains only a random deletion marker with no answers/identity before new progress is added; native Clear removes the key. Refresh all legacy app windows after an update. See [deployment/rollback](docs/RELEASE_RUNBOOK.md) and [local progress and review rules](docs/LOCAL_PROGRESS.md) for the versioned schema, 1/3/7/14/30 elapsed-day schedule, date/clock behavior and deletion semantics.

Settings → Audio Help provides a sound test, Stop, voice selection and recovery guidance. New playback replaces previous playback. Stop, navigation, backgrounding and input edits cancel remaining words/pauses. The native adapter uses **react-native-tts 4.1.1**, backed by Android TextToSpeech or iOS AVSpeechSynthesizer; web uses browser SpeechSynthesis. Delayed initialization and terminal events are guarded, failures are explicit and missing callbacks time out. Voice availability, processing location and connectivity depend on the provider. No microphone is used for playback. [Audio validation](docs/AUDIO_VALIDATION.md) contains the outstanding device/listening worksheet; [PRIVACY.md](PRIVACY.md) lists the actual data/provider behavior.

Converter Play/Replay begins at the start with a current-token label and an inset card highlight. Change playback pace saves rate (0.75×/1×/1.25×) and word-boundary gap (0/300/700 ms); the ordinary token gap stays 120 ms. Changing pace stops playback. Edits, Clear and leaving/backgrounding also stop it. Reset Preferences restores 1×/300 ms.

Converter cards show 24 input tokens per page with Previous/Next and a current-card-page shortcut during playback. Input and full selectable output scroll within their own areas for long phrases; Copy/Share and phrase playback always use all input. No text is silently truncated. Measurements qualify samples through 2,000 characters, not arbitrarily large inputs or a response-time guarantee. Native affected large-text acceptance remains open; see the current delivery record.

Release artwork is generated from outlined vector sources with separate adaptive foreground/background and a transparent monochrome mask. Generation verifies dimensions, safe bounds, alpha and all 22 shipped consumers; failures exit nonzero without claiming success. See [release assets](docs/RELEASE_ASSETS.md). Spoken-answer implementation and offline web remain in the delivery plan. The [recognition assessment](docs/SPOKEN_PRACTICE.md) does not add microphone access. Progress and other affected native flows retain open qualification; automated checks do not establish release acceptance.

The alphabet reference now includes a Digits 0–9 view using the same portrait cards and audio controller. Letter Quiz offers Letters, Digits, Letters and digits, Postcode symbols (`SW1A 1AA`) and Callsign symbols (`N359AB`). Choose 5, 10 or a complete set (26 letters, 10 digits, 36 mixed symbols, or the example’s distinct symbols). Each symbol appears once before the shuffled deck repeats. Example questions practise distinct symbols in shuffled order; Hear example speaks the complete original sequence, with a word-boundary pause for the postcode. Canonical Three/Five/Nine display with intentional `tree`/`fife`/`niner` provider inputs; human listening/content acceptance remains pending M11.3. Category/set choices stay in memory.

Practice uses a shuffled coverage deck. Submit once, then use Replay or Next; the last answer stays visible until View results. Results show answered count, score/accuracy and every missed answer. Retry Mistakes asks once per missed symbol. End round and review retains a partial recap. Menu/Back keeps the current round and feedback; choosing a new round keeps the recap until Start new round replaces it. Rounds and results stay in memory only and clear when the app process closes or the page reloads. They are not saved progress.

Due review and Focus on mistakes filter the selected symbol set using saved progress. Due includes previously practised symbols whose review time has arrived; Focus includes symbols whose last saved answer was incorrect. Review rounds cap length at available symbols and never repeat within that round. Empty lists leave full practice available. Review symbols are fixed at Start; new answers update future reviews. All modes, including listening text alternatives, share totals.

Converter tools use one token model for cards, playback and plain-text Copy/Share. ASCII lowercase becomes uppercase; digits use canonical words in text and their intentional provider inputs in speech. Spaces, tabs and newlines form one word boundary, shown as `/` in plain text and one extra 300 ms audio pause. `- . / @ +` are spoken as dash, dot, slash, at and plus (literal separators, not NATO code words). Other Unicode, accents and punctuation are not transliterated or silently expanded: visible `not spoken` markers include the original code point and remain in copied/shared text. Clear input stops playback and removes the current conversion. Editing also stops playback; Menu/Back retains input.

Copy writes only on request; Share opens the platform sheet where supported. If browser permissions/capabilities prevent exporting, select the plain text conversion and use the device’s Copy action. Clipboard history/sync and receiving apps have their own controls; Clear does not erase previous copies/shares. The native clipboard adapter uses the public deprecated API still present in pinned RN 0.81.5; reassess that isolated adapter before a framework upgrade. These converter tools add no native dependency, permission or saved data. [Run 09 evidence](docs/evidence/run09/README.md) records actual platform checks and remaining acceptance.

Voice selection supports search by name, locale code or quality and exact locale filters. System Default and its preview remain available even when no installed voice matches. Reset voice filters restores the complete English list without changing the saved voice. Reference category, practice set and search/locale filters stay in memory only; Reset Preferences continues to affect only the documented saved preferences.

Letter Quiz offers Choose a code word, Listen and choose a symbol, and Type a code word across the existing sets. Listening hides the answer tile until submission; Play/replay, Stop and a code-word text alternative are explicit. Typed responses ignore case, accents, spaces and punctuation and accept Alpha/Juliet aliases; use canonical Three/Five/Nine rather than pronunciation guides. Blank input stays on the question. Drafts survive Menu/Back and clear on the next question/new round. Modes, drafts and text alternatives stay in memory only. [Answer rules](docs/NUMERIC_PRACTICE.md#listening-and-typed-recall-run-12).
