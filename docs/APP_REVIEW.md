# NATO Phonetics — comprehensive application review

**Review date:** 16 November 2026

**Revision reviewed:** `784bb93` (`main` history: “Merge pull request #1 from c0d3rb4b4/setup/ci”)

**Scope:** Product functionality, educational content, accessibility, UX, speech, persistence, architecture, testing, dependencies, privacy claims, assets, documentation and release readiness.

**Deliverable:** Analysis and prioritized backlog. No application fixes or dependency upgrades were made.

For current implementation, acceptance and the next engineering task, see [Current delivery status](#current-delivery-status) and the [delivery queue](DELIVERY_PLAN.md#current-delivery-order-and-residual-engineering-queue).

**Planning amendment — 16 November 2026, after Run 02:** R24 adds the owner's requirement to remove Expo and build Android/iOS directly, using Eclipse Timer's local/self-hosted build pattern as a reference. The earlier review and execution evidence remain historical. The updated plan also requires real web/Android/iOS screenshots after implementation and verification, linked in the final summary.

**Planning amendment — 16 November 2026, after Run 03:** R25 is a **P1 priority** to restore and enforce the original portrait tile design across web, Android and iOS. P05.6–P05.8 own the shared geometry/typography specification, implementation and regression evidence. Its original before-feature sequencing is historical and superseded by the current amendment below.

**Historical priority amendment — 17 November 2026, after Run 07:** The [cross-run evidence review](DELIVERY_PRIORITY_REVIEW.md) finds justified foundation/design work followed by diminishing returns from the whole-P05 feature gate. The shared portrait component is delivered. Remaining iPhone ink-only fringes are **P3 parked polish**; ordinary Android unreadable/stale text remains **P1**. Proceed with **P07.2/.4 sessions/results and P06 converter completion** through delivered shared components, with affected-flow accessibility checks. This amendment supersedes earlier sequencing that required every P05 check before feature UI; failed checks, full scope and M11 acceptance remain open.

## Assessment

The app is a useful early implementation of three focused tools: an alphabet reference, an alphanumeric converter and a multiple-choice letter quiz. Its small architecture and shared alphabet data are appropriate for the product. The web export succeeds, and the dataset contains all 26 unique letters and all 10 unique digits.

It needs a stabilization pass before a public release. The most important problems affect the core promise of teaching correct phonetics: a canonical spelling error, unverified digit pronunciation, overlapping speech sequences, inaccessible quiz content and incomplete quality gates. The privacy policy also promises more control over device speech processing than the implementation establishes.

There is no confirmed P0 incident or demonstrated exploitable critical application vulnerability in this review. The dependency audit does report critical advisories; their applicability must be assessed, especially because several affected packages are development tools. Successful bundling does not establish native release readiness.

## Evidence and limitations

Source review covered every route in `app/`, shared data and speech code, both theme systems, starter components, configuration, scripts, CI, README, privacy policy, package manifests and lockfile. External factual checks used official NATO/ICAO, Expo, React, Android and W3C references linked below.

Validation ran on macOS with **Node 25.6.1 / npm 11.9.0**, using the committed lockfile. This is not the same runtime as the workflow's Node 20 environment.

| Check | Result | Interpretation |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Passed; 1,004 packages installed | Install lifecycle scripts were deliberately not executed; this is not a native build validation. |
| `CI=1 npm run lint` | **Failed: 8 errors, 4 warnings** | Current code does not pass the repository's only CI check. |
| `./node_modules/.bin/tsc --noEmit` | Passed | `tsc --showConfig` lists starter TS/TSX modules, not the active JS application; see R15. |
| `CI=1 EXPO_NO_TELEMETRY=1 ./node_modules/.bin/expo export --platform web --output-dir /private/tmp/nato-phonetics-review-web` | Passed; 11 static routes, approximately 1.53 MB entry JS before transfer compression | Export includes the unfinished `/voice-quiz` route. Bundle size is an observation, not a measured performance defect. |
| Exported app in isolated headless Microsoft Edge | Home, alphabet, converter, letter quiz, settings, voice selection and voice quiz rendered | Production React error #418 occurred on direct Home and Letter Quiz loads. Browser document titles were empty. |
| Browser layout at 375×667 and 320×568 | Small viewport clips quiz options | At 320×568 the fourth answer label occupied approximately y=610–630. Wheel scrolling left `scrollY` at 0; body overflow was hidden. |
| Chromium accessibility tree before answering | Hidden quiz answer and pronunciation exposed | Answer face is visually hidden with opacity only; controls also lack useful roles/names. |
| Isolated Node harnesses using extracted application logic | Reproduced overlapping sequences, swallowed storage failure and unsettled cancellation | These exercise logic with mocked speech/storage, not real device audio. |
| Data checks and seeded question generation | Complete letter/digit coverage; duplicate choices reproduced | Current question generation can produce `Kilo, Kenya, Kenya, Kitchen`. |
| `npm audit --json` against the locked tree | **49 affected package entries: 2 critical, 21 high, 24 moderate, 2 low** | Counts include transitive/metavulnerability entries, not 49 independently demonstrated app exploits. Snapshot is date-dependent. |
| Committed icon PNG inspection | Foreground and monochrome assets are fully opaque | Both 512×512 images have alpha 255 throughout; see R19. |

**Not verified:** signed iOS/Android builds, native installation, physical-device pronunciation, VoiceOver/TalkBack, mobile background/interruption behavior, real network traffic during TTS, airplane-mode behavior, store compliance, or large-input performance. Device-dependent risks are labeled accordingly. The browser checks are a smoke review, not a full end-to-end suite or accessibility certification.

## Priority and effort definitions

| Priority | Meaning |
|---|---|
| **P0 — Immediate** | Confirmed severe incident, data loss or exploitable release-blocking security flaw. None established here. |
| **P1 — Before release** | Incorrect core behavior/content, blocked access to a core flow, misleading privacy guarantees, or an essential quality/security gate needing resolution. |
| **P2 — Next milestone** | Important reliability, usability, maintainability or product completeness work. |
| **P3 — Later** | Optional expansion, polish or cleanup with lower immediate impact. |

Effort is relative: **S** = localized change; **M** = multiple modules plus meaningful verification; **L** = feature/platform work. It is not a delivery estimate. Security triage is P1 even where an advisory's package severity is “critical”; package severity and application priority are different measures.

Apply priority to the **remaining subproblem**, not forever to its original R-ID. Record user consequence, reproducible scenario/settings, reach, evidence confidence, workaround, implementation/verification cost and exact blocking scope. Accessibility failures are not polish merely because larger text or a less common device/window triggers them. Conversely, a faint measured fringe with readable text and correct font/geometry need not block unrelated features. Unknown prevalence/root cause stays unknown. The [plan's triage and investigation rules](DELIVERY_PLAN.md#impact-triage-and-investigation-limits) define parking, promotion triggers and bounded investigation.

| Historical residual / deliverable after Run 11 | Priority / action at that checkpoint |
|---|---|
| Android ordinary text/feedback/action-label readability, R06/R07/P05.2 | **P1 active**; separate cold configured large text from live transitions, establish the smallest causal reproduction and preserve state. Affected native accessibility/release acceptance remains failed. |
| Sessions/results/Retry Mistakes, F01/P07.2/.4 | **P2 functional implementation delivered**; retain affected native accessibility qualification. Run 11 extends symbol sets without closing the live Android gate. |
| Converter normalization/Clear/Copy/Share/pacing/highlighting, R17/F02/F03 | **P2 functional implementation delivered**; retain affected native input/readability, clipboard and final acceptance. Run 11 passes scoped direct iOS Stop→Replay with/without keyboard. |
| Security/native CI/support qualification, R08/R14/P10 | Maintain dated security dispositions, schedule compatible remediation and actual CI/runtime qualification; promote new severe exposure. Unrun support/device evidence remains explicit. |
| iPhone DPR 3 maximum India/Juliett ink fringes, R25/P05.8 | **P3 parked**; retain strict failed results, unchanged tolerances and re-entry triggers. Design drift/readability regressions still promote; no P06/P07 implementation gate. |
| iOS bulk-XCTest input anomaly, P06.4/P10 | **P2 parked compatibility follow-up**; realistic key/edit/Paste tests remain required. Reproduced ordinary input loss promotes to P1. |

The original register and detailed findings below preserve the reviewed snapshot. For later engineering evidence and priorities, see the [current status](#current-delivery-status) and the [delivery plan](DELIVERY_PLAN.md#current-delivery-order-and-residual-engineering-queue).

## Prioritized issue register

| ID | Priority | Finding | Evidence | Effort |
|---|---|---|---|---|
| R01 | P1 | Existing lint gate fails | Executed | S |
| R02 | P1 | J is taught as `Juliet` instead of `Juliett` | Source + official reference | S |
| R03 | P1 | Digit audio bypasses the pronunciation being taught | Source + mocked speech inputs | M |
| R04 | P1 | Concurrent speech loops mix phrases; no Stop or ownership | Reproduced logic + source | M |
| R05 | P1 | Absolute offline/privacy claims are not enforced | Source + platform capabilities | M |
| R06 | P1 | Missing accessibility semantics and exposed quiz answer | Source + browser accessibility tree | M |
| R07 | P1 | Quiz choices overflow small screens | Source + browser rendering | M |
| R08 | P1 | Locked dependency advisories need remediation/triage | Live npm audit | M–L |
| R24 | P1 | Expo removal and independently owned native/web builds missing from delivery scope | Owner requirement + current repository/build reference inspection; added after Run 02 | L |
| R25 | P1 | Original portrait tile proportions, composition and typography have drifted | Owner requirement + Run 03 web/iOS screenshots + historical/current source; added after Run 03 | M–L |
| R09 | P2 | Speech failures look successful; cancellation can hang | Reproduced logic | M |
| R10 | P2 | Quiz timers outlive navigation and feedback disappears too quickly | Source | M |
| R11 | P2 | Duplicate/ambiguous distractors and biased shuffling | Source + seeded simulation | S–M |
| R12 | P2 | Voice selection has filtering, fallback and persistence defects | Source | M |
| R13 | P2 | Theme does not track system changes or safely hydrate preferences | Source | M |
| R14 | P2 | CI lacks behavioral, export and native smoke coverage | Repository inspection | M |
| R15 | P2 | Type checking excludes the active application | Executed configuration inspection | M |
| R16 | P2 | Static web rendering produces hydration errors | Browser execution + source | M |
| R17 | P2 | Converter silently omits unsupported input during audio | Source | M |
| R18 | P2 | Primary button label contrast is insufficient | Color calculation | S |
| R19 | P2 | Android themed icon has an opaque full-image mask | Asset inspection | S–M |
| R20 | P2 | Setup/release documentation is incomplete and partly incorrect | Source + Expo reference | M |
| R21 | P2 | Feature claims, policy access and product metadata are incomplete | Source + browser execution | S–M |
| R22 | P2 | Direct-linked Menu has no reliable Home fallback | Source; platform behavior pending | S |
| R23 | P3 | Dead starter architecture and unreliable icon-script exit status | Source + lint | S–M |

## Detailed findings

### R01 — Restore the existing lint gate

**P1 · Confirmed · S**

The eight errors are two unescaped quotes in [app/letter-quiz.js](../app/letter-quiz.js), line 189; an unescaped apostrophe in [app/voice-quiz.js](https://github.com/c0d3rb4b4/nato-phonetics/blob/784bb93c5cfb6edfd318d0dcec2d54d5bb222483/app/voice-quiz.js), line 15; and five unresolved screen imports in [src/App.js](../src/App.js), lines 3–7. Four unused-variable warnings occur in the layout, About, quiz and speech helper.

The actual entry point is `expo-router/entry` ([package.json](../package.json), line 3). The obsolete `src/App.js` is therefore a lint/maintenance failure, not proof that the shipped app crashes at startup.

**Action:** Remove the unused alternative entry and resolve the JSX/unused-code findings. **Acceptance:** A clean locked install passes `npm run lint`; the existing CI workflow runs successfully.

### R02 — Correct and validate the canonical learning data

**P1 · Confirmed · S**

[src/data/natoData.js](../src/data/natoData.js), line 11, spells J as `Juliet`. The official spelling is `Juliett`. Because the reference, converter and answer checker share this dataset, the error appears across the app. The existing `Alfa` spelling is correct and should be preserved. [NATO reference](https://nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet), [ICAO explanation](https://www.icao.int/sites/default/files/postalhistory/annex_10_aeronautical_telecommunications.htm).

**Action:** Correct J, document the chosen authoritative reference and validate the full canonical table. Keep display spellings separate from acceptable user-answer variants if free-text practice is added. **Acceptance:** Alphabet J, converter J and quiz J consistently show `Juliett`; a data check verifies all 26 mappings and ten digit entries.

### R03 — Make pronunciation playback agree with the guide

**P1 · Confirmed speech-input mismatch; audible outcome needs devices · M**

[app/converter.js](../app/converter.js), lines 35–39 and 122–131, sends `entry.word` to speech. [src/data/natoData.js](../src/data/natoData.js), lines 38–44, displays `TREE`, `FIFE` and `NIN-er` but supplies `Three`, `Five` and `Nine`. The implementation does not instruct the synthesizer to use the radio pronunciations. ICAO describes these distinctions. [ICAO reference](https://www.icao.int/sites/default/files/postalhistory/annex_10_aeronautical_telecommunications.htm).

**Action:** Separate display word, pronunciation guide and validated spoken representation. Reviewed bundled recordings would provide consistent pronunciation and help resolve R05; engine-specific pronunciation text must be listening-tested. **Acceptance:** Playback of `359`, both individually and in a phrase, agrees with the guide on supported platforms. Review all letters and digits, including stress patterns, rather than assuming generic TTS is authoritative.

### R04 — Give speech one owner and a cancellable sequence

**P1 · Reproduced logic · M**

Every press of “Play Full Phrase” starts another async loop ([app/converter.js](../app/converter.js), lines 35–43 and 61–72). There is no running state, Stop action or cancellation on navigation. Individual cards, quiz speech and voice previews also enqueue utterances independently. A mocked run of the actual loop for `AB` twice produced **Alfa, Alfa, Bravo, Bravo**.

**Action:** Introduce a small shared playback controller with explicit replace/queue behavior, sequence identifiers, Stop and cleanup on blur/unmount/background as appropriate. Changing the input should have an explicit relationship to the active phrase. Voice previews should use the same controller. **Acceptance:** Rapid Play presses cannot interleave phrases; tapping another source follows one documented policy; Stop and navigation invalidate all remaining utterances and pauses. Complete R09 alongside this change.

### R05 — Align privacy and offline claims with the speech provider

**P1 · Unsupported guarantee confirmed; transmission not observed · M**

[PRIVACY.md](../PRIVACY.md), especially lines 13, 43, 51, 56 and 93, and [app/about.js](../app/about.js), lines 65–67, assert wholly local processing. The voice picker filters only by language and quality ([app/voice-select.js](../app/voice-select.js), lines 19–30). Android supports voices that require a network connection; the pinned Expo implementation enumerates native voices without enforcing local-only use. On web, Expo exposes `localService`, but the app does not inspect it. [Android Voice API](https://developer.android.com/reference/android/speech/tts/Voice#isNetworkConnectionRequired()), [Expo SDK 54 implementation](https://github.com/expo/expo/blob/sdk-54/packages/expo-speech/android/src/main/java/expo/modules/speech/SpeechModule.kt), [Web voice locality](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService).

No analytics/backend calls were found in the authored app code; network traffic from installed speech providers was not measured. Source inspection does not prove every installed speech provider processes text locally.

**Action:** Either enforce offline playback, for example with bundled recordings, or qualify the policy and UI accurately around device/provider behavior. Reassess the blanket GDPR/CCPA/COPPA assertions at policy lines 82–89; this review establishes no legal compliance conclusion. **Acceptance:** Document and test the supported offline behavior, including unavailable/network voices; policy, README and UI agree with that evidence.

### R06 — Add accessibility semantics and hide the unrevealed answer

**P1 · Source + browser accessibility tree · M**

The menu icon has no accessible name/role ([app/_layout.js](../app/_layout.js), lines 11–20), the Dark Mode switch has no explicit label association ([app/settings.js](../app/settings.js), lines 52–57), and voice choices lack selected/radio semantics. Converter input and many action cards also lack explicit labels/roles.

Both quiz faces remain mounted ([app/letter-quiz.js](../app/letter-quiz.js), lines 112–144); opacity hides the back visually. Before answering, the browser accessibility tree exposed **Oscar / OSS-cah** alongside the masked front. The tree exposed option labels as static text without button roles and the menu as an icon glyph.

**Action:** Use named, correctly typed controls with selected/disabled state; exclude decorative icons; conditionally render or explicitly remove the hidden face from the accessibility tree. Announce feedback and manage focus when advancing. Respect reduced-motion preferences. **Acceptance:** A learner can navigate, convert, change settings and complete a quiz with keyboard and VoiceOver/TalkBack; the answer is absent before selection and feedback is announced once.

### R07 — Make the quiz and cards usable on small screens and large text

**P1 · Browser clipping confirmed; native effects pending · M**

The quiz uses a non-scrollable root `View`, a 240-pixel card, a 40-pixel gap and four vertically padded answers ([app/letter-quiz.js](../app/letter-quiz.js), lines 104, 208–225 and 281–287). At 320×568, the fourth answer text appeared at y=610–630, outside the viewport. A wheel-scroll attempt left `scrollY` at 0 with body overflow hidden. The source offers no dedicated scroll container for the quiz.

The reference also fixes cards at 110×150 with hidden overflow ([app/alphabet.js](../app/alphabet.js), lines 63–72); converter cards have fixed dimensions. These create further large-text risks. Android edge-to-edge is enabled, but active screens do not explicitly handle bottom insets; verify native system-bar overlap rather than assuming it occurs.

**Action:** Use safe-area-aware scrolling, wrapping controls and a readable content width. Reflow the grid or scale the complete NATO tile proportionally under R25. Keep the bottom tabs and task controls reachable. **Acceptance:** Every answer and feedback state remains reachable at 320×568, at 200% text scaling and with supported native accessibility text sizes; test keyboard-visible converter, Android gesture navigation, iPhone insets and supported tablets.

**Design reference.** The [tile specification](TILE_DESIGN.md) governs geometry and type. The [uniform UI design language](UI_DESIGN_LANGUAGE.md#shared-patterns) governs surrounding controls, layout and focus.

### R08 — Triage and update vulnerable locked dependencies

**P1 · Audit confirmed; exploitability not established · M–L**

The audit reported 49 affected package entries. Examples from [package-lock.json](../package-lock.json):

| Package / chain | Locked version | Initial relevance |
|---|---|---|
| `shell-quote` | 1.8.3 | Critical audit entry; reached through React Native development tooling. Do not equate its presence with end-user remote code execution. |
| `tar` | 7.5.2 | Critical audit entry; Expo CLI archive handling, principally development/build exposure. |
| `expo-router` → `query-string` → `decode-uri-component` | 6.0.17 → 7.1.3 → 0.2.2 | High audit chain with runtime relevance to URL parsing; malformed-input reachability needs verification. |
| `sharp` | 0.34.5 | High audit entry; a direct dev dependency used by the icon script against a tracked SVG. |

The audit also flags other navigation, parsing, image and build-tool dependencies. These examples are a starting point, not an exhaustive disposition. Maintainer advisories: [shell-quote command quoting](https://github.com/ljharb/shell-quote/security/advisories/GHSA-w7jw-789q-3m8p), [tar decompression/parse denial of service](https://github.com/isaacs/node-tar/security/advisories/GHSA-23hp-3jrh-7fpw), [URI decoding](https://github.com/SamVerschueren/decode-uri-component/security/advisories/GHSA-qr28-fpjm-wq7f), [sharp SVG processing](https://github.com/lovell/sharp/security/advisories/GHSA-wq5f-xc86-pv6w).

Installed-source inspection places React Native DevTools behind `__DEV__`. For URL decoding, React Navigation core calls `queryString.parse`, while Expo Router's customized parser comments out that call and its other usage includes serialization. The vulnerable runtime dependency is present, but an exploitable application deep link was not demonstrated. Also, `npm audit --omit=dev` alone is insufficient to classify exposure: Expo/React Native include tooling through production dependencies.

**Action:** Record reachable runtime versus tooling paths, remove unused dependencies such as `svg2img` where confirmed safe, update compatible patches and plan Expo-family upgrades coherently. Do not apply `npm audit fix --force` blindly: suggested fixes can cross SDK major versions. **Acceptance:** Re-run audit against the resulting lockfile; every remaining high/critical item has a documented applicability decision, owner and remediation plan, and lint/export/native smoke checks pass.

**Current plan amendment:** R24/P00 replaces the long-term Expo-family upgrade approach with Expo removal. Re-audit the replacement graph and refresh the security inventory from actual evidence; this requirement does not declare any historical advisory fixed.

### R09 — Treat speech failure and cancellation as distinct outcomes

**P2 · Reproduced logic · M**

[src/lib/speech.js](../src/lib/speech.js), lines 5–25, resolves both success and error. If reading the stored voice fails, execution never reaches `Speech.speak`; the helper logs text and resolves. An isolated test confirmed zero speech calls for this failure. Only `onDone` and `onError` settle the promise; a stopped event leaves it pending.

**Action:** Fall back to the default voice when preference reads fail, return explicit completed/failed/cancelled outcomes, settle `onStopped`, and provide a bounded recovery path for missing callbacks. Surface audio failures in a dismissible notice with a reachable recovery action. Keep the playback control and surrounding layout stable. Preserve troubleshooting guidance for device-specific audio restrictions and avoid logging entered content. **Acceptance:** Storage errors do not silence otherwise available speech; engine errors are visible; cancellation settles once and never resumes the old phrase.

### R10 — Let learners control quiz progression and clean up callbacks

**P2 · Source-confirmed · M**

[app/letter-quiz.js](../app/letter-quiz.js), lines 84–100, starts a 700 ms animation, then speech, plus a separate 2,000/2,500 ms transition timer. Feedback gets only approximately 1.3/1.8 seconds after the animation, independent of speech completion. No timeout/animation cleanup or focus handling exists. Answering and immediately opening Menu can allow speech and advancement on the covered screen.

**Action.** Keep answer feedback visible until the learner chooses Next or opens results. Use the shared Play/Stop control for replay. Release owned audio and callbacks when leaving the quiz. **Acceptance.** Playback leaves the feedback and Next control in place. Leaving or stopping never advances an inactive question or resumes stale audio.

### R11 — Generate unique, unambiguous and fairly shuffled options

**P2 · Reproduced logic · S–M**

[src/data/quizDistractors.js](../src/data/quizDistractors.js) repeats values such as Atlas, Dublin, Kenya and Ranger. The generator only removes exact matches to the correct word before sampling ([app/letter-quiz.js](../app/letter-quiz.js), lines 28–37). It can therefore render duplicate options. `Québec` remains a wrong option for `Quebec`, creating an ambiguous spelling exercise without explanation.

Both option and distractor shuffles use `sort(() => Math.random() - 0.5)` at lines 23 and 36. This is not uniform: 100,000 seeded option-shuffle trials placed the correct option in positions 1–4 approximately **27.9%, 28.3%, 25.1%, 18.6%** of the time. These exact rates are engine/seed-specific.

**Action:** Deduplicate/normalize candidate pools, exclude confusing equivalents and use Fisher–Yates with injectable randomness. **Acceptance:** Every generated question has exactly four distinct, unambiguous choices and one correct answer; deterministic tests cover all letters and pool fallback behavior. A shuffled-letter deck can additionally avoid immediate repeats (F01).

### R12 — Make voice selection complete and recoverable

**P2 · Source-confirmed · M**

[app/voice-select.js](../app/voice-select.js), lines 20–30, hides all standard English voices if any enhanced English voice exists. There is no System Default option or recovery from a removed saved voice. The initial empty array displays “No English voices” during loading (lines 83–88). Selection updates before storage succeeds (lines 56–67), so a failure can leave a checkmark on an unsaved choice. A delayed initial preference read can overwrite newer UI state. Settings does not reset its label when a saved identifier is missing ([app/settings.js](../app/settings.js), lines 22–29).

**Action:** Show eligible voices with compact locale headings and wrapping filters. Keep System Default visible. Give each voice a clearly selected row and a separate Play/Stop preview. Validate saved identifiers and distinguish loading, empty and error states with a nearby Retry action. Serialize or guard preference updates; rollback or explain failed saves. Align the chosen voice's locale with playback options. **Acceptance:** Test mixed-quality voices, no voices, delayed enumeration, removed voices, storage failures and rapid selections; displayed and persisted selections always agree.

### R13 — Support live system theming and safe preference hydration

**P2 · Source-confirmed · M**

[src/context/ThemeContext.js](../src/context/ThemeContext.js), lines 8–20, uses the system color scheme only to initialize state. Later OS changes do not update it. The persisted boolean cannot represent “follow system.” `isLoading` is exposed but ignored by the layout, allowing a theme flash and a delayed load to overwrite an early toggle. Save failures are console-only despite Settings saying preferences are saved automatically.

**Action:** Persist `system | light | dark`, derive the effective theme from the live system setting, coordinate hydration with user interaction and provide accurate failure handling. Verify navigation/status/system-bar colors alongside the content theme. **Acceptance:** Test cold starts, OS theme changes, manual overrides, return to System and delayed/failed storage without flashes or lost choices.

### R14 — Expand CI around the actual failure modes

**P2 · Confirmed gap · M**

[.github/workflows/ci.yml](../.github/workflows/ci.yml), lines 19–29, runs Node 20, `npm install` and lint only. No automated test suite or test script exists. CI does not exercise conversion, speech sequencing, quiz transitions, preference restoration or export.

**Action:** Use `npm ci`, add focused behavioral tests and a static web export gate, and document a native smoke gate. Prioritize tests that reproduce R02–R13 over snapshot-heavy or implementation-mirroring tests. Add dependency review with sensible triage rather than treating every tool advisory as a runtime exploit. **Acceptance:** CI catches incorrect canonical data, duplicate options, cancellation/order regressions, preference failures and bundling failures.

### R15 — Type-check maintained application code

**P2 · Executed configuration evidence · M**

[tsconfig.json](../tsconfig.json), lines 11–16, includes TS/TSX files, while the maintained screens, data, context and speech helper are JavaScript. `tsc --showConfig` listed 13 starter TS/TSX files; no active application modules were included. Inherited `allowJs` does not itself turn on checked JavaScript. `typedRoutes` in app configuration does not compensate for this.

**Action:** Incrementally migrate active modules to TS/TSX, or explicitly include checked JS with JSDoc. Start with alphabet entries, quiz questions, preferences and speech outcomes. **Acceptance:** Deliberately invalid data fields, route usage and speech options in maintained files fail the typecheck gate. Remove the deliberate errors after verifying the gate.

### R16 — Fix static web hydration before relying on web export

**P2 · Browser-confirmed · M**

The static build rendered, but direct Home and Letter Quiz loads produced React error **#418**, indicating server/client markup mismatch. This reproduced with explicit light-mode emulation; Home also reproduced with dark-mode emulation. The quiz initializes from `Math.random()` during rendering ([app/letter-quiz.js](../app/letter-quiz.js), lines 8–25 and 42), so build-time and browser questions need not match. The exact additional cause on Home was not isolated. [React error reference](https://react.dev/errors/418).

**Action:** Give quiz initialization a deterministic server/client boundary or initialize the random question after hydration with a stable loading state. Investigate Home using an unminified build and coordinate browser-only theme/state initialization. **Acceptance:** Hard refresh and direct navigation to every exported route produce no hydration errors in light/dark modes or with saved preferences. Do not hide warnings as a substitute for fixing mismatches.

### R17 — Define converter input and omission behavior

**P2 · Source-confirmed; performance impact unprofiled · M**

[app/converter.js](../app/converter.js), lines 20–42, treats only a literal space as a pause. Accents, punctuation and other whitespace become Unknown cards; Play Full Phrase silently skips unknown entries. For example, `AB-CD` is spoken like `ABCD`, with no audio indication that the hyphen was omitted. Uppercasing may also change Unicode character counts, so any transliteration policy should be intentional.

There is no input limit and all output cards render in a `ScrollView`, creating a plausible large-paste performance risk; no freeze threshold was measured.

**Action:** Specify supported characters, normalize whitespace deliberately, explain omissions and optionally add common punctuation names. Bound input or use an appropriate rendering strategy after measuring realistic pasted text. **Acceptance:** Cover lowercase, digits, spaces, tabs/newlines, punctuation, accents, emoji and long input; the displayed output and playback communicate the same content policy.

### R18 — Improve normal-size button contrast

**P2 · Measured from source colors · S**

White `#FFFFFF` text on primary blue `#3B82F6` has a contrast ratio of approximately **3.68:1**. The converter uses this for a 16-size semibold label ([app/converter.js](../app/converter.js), lines 65 and 191–195); Menu uses the same pairing. This is below the 4.5:1 target for normal text. [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).

**Action:** Darken the button background or change text color and check pressed/disabled states in both themes. **Acceptance:** Normal-size actionable text meets 4.5:1; feedback remains understandable without color alone.

### R19 — Generate a real Android monochrome icon mask

**P2 · Asset/source-confirmed; launcher appearance pending · S–M**

[scripts/generate-icons.js](../scripts/generate-icons.js), lines 60–67, grayscales the SVG; the source contains a full background rectangle ([assets/images/test.svg](../assets/images/test.svg), lines 63–67). Both committed foreground and monochrome PNGs are fully opaque. A themed launcher using the monochrome alpha silhouette cannot recover the intended logo shape from a full opaque rectangle. [Android adaptive icon guidance](https://developer.android.com/develop/ui/compose/system/icon_design_adaptive).

**Action:** Supply a dedicated transparent monochrome silhouette and separate adaptive foreground/background with appropriate safe zones. **Acceptance:** Validate alpha/mask structure and preview circle/squircle crops and themed icons on Android; regeneration produces the reviewed assets reproducibly.

### R20 — Document a reproducible development and release workflow

**P2 · Confirmed documentation gap · M**

[README.md](../README.md), lines 25–35, recommends Node 18+, global `expo-cli` and a placeholder clone URL. SDK 54 requires Node **20.19.4 or later**; use a tested compatible toolchain and the project-local CLI. [Expo SDK 54 release notes](https://expo.dev/changelog/sdk-54), [Expo CLI documentation](https://docs.expo.dev/more/expo-cli/).

The repository describes starting development sessions, but not signed builds, internal distribution, build numbering, store metadata or release verification. No EAS configuration or alternative documented release procedure is present. That is not proof native builds fail.

**Action:** Pin/document the supported Node version, use `npm ci`, replace placeholders, and document the chosen EAS or local native workflow, application identifier ownership, version increments and smoke checks. **Acceptance:** Another maintainer can set up from a clean checkout and produce a reviewable internal build using documented steps.

**Current plan amendment:** The selected workflow is now direct Gradle/Xcode plus an independent web build under R24/P00. EAS, including local EAS builds, does not satisfy the owner's Expo-removal requirement. P10 completes the distribution runbook and final screenshot evidence.

### R21 — Make feature claims and support surfaces truthful and complete

**P2 · Source/browser-confirmed · S–M**

About promises “Multiple quiz modes” ([app/about.js](../app/about.js), line 42), but only Letter Quiz is implemented and linked. [app/voice-quiz.js](https://github.com/c0d3rb4b4/nato-phonetics/blob/784bb93c5cfb6edfd318d0dcec2d54d5bb222483/app/voice-quiz.js), lines 9–16, is a placeholder containing development-process text. Although absent from Home, it is exported as a public static route with a raw `voice-quiz` header.

About has no working link to the full privacy policy or support destination; its `openLink` function is unused. Version strings are duplicated across package/app configuration, Home, About and README. Browser document titles were empty in all tested routes.

**Action:** Correct feature claims immediately; remove the unfinished public route or turn it into intentional product content pending a roadmap decision. Add accessible policy/support links and readable offline policy content where appropriate. Centralize displayed version information and provide meaningful web page titles. **Acceptance:** Advertised features are reachable and complete; no internal implementation notes appear in product screens; policy/support destinations work and tab titles identify the page.

### R22 — Keep direct entries navigable

**P2 · Source-supported risk; full deep-link testing pending · S**

[app/menu.js](../app/menu.js), line 63, implements “Back to App” solely with `router.back()`. The app config declares a URL scheme and static web routes, but the layout provides no explicit fallback for a cold-start Menu entry. With no in-app history, back may do nothing or leave the app's browser history.

**Current action.** Keep the bottom tabs available on direct entries, with Menu selected on its detail screens. Reference serves as the launch destination and is available from any route. **Acceptance.** Cold Menu and detail links and Page Not Found can reach Reference through the bottom bar. Browser history and Android Back work after in-app navigation.

### R23 — Remove unused scaffolding and make asset generation fail honestly

**P3 · Source-confirmed · S–M**

Alongside the dead [src/App.js](../src/App.js), unused template components/hooks maintain a second theme system in [constants/theme.ts](https://github.com/c0d3rb4b4/nato-phonetics/blob/784bb93c5cfb6edfd318d0dcec2d54d5bb222483/constants/theme.ts). Starter React logos remain, and `svg2img` is declared although icon generation uses `sharp`. These increase maintenance and dependency review work; do not remove native/navigation packages without checking indirect and peer requirements.

[scripts/generate-icons.js](../scripts/generate-icons.js), lines 34–35, 53–54 and 69–83, logs failures then prints unconditional completion; its top-level catch does not set a failing exit status.

**Action:** Remove verified unused scaffolding, dependencies and duplicate patterns. Make generation aggregate errors and exit nonzero on failure. **Acceptance:** There is one documented app entry/theme system, retained dependencies have a purpose, and a simulated unwritable output makes icon generation fail rather than report success.

### R24 — Remove Expo and make native builds independently maintainable

**P1 · Owner-required planning amendment after Run 02 · L**

The current [package manifest](../package.json) uses `expo-router/entry`, Expo CLI scripts and Expo modules for routing, speech, fonts and platform UI. [CI](../.github/workflows/ci.yml) checks Expo compatibility and exports web; the earlier successful mobile JS exports are not compiled native binaries. The plan previously retained Expo Router and left release tooling open, so it omitted the requested migration.

Eclipse Timer's [build workflow](../../eclipse-timer/.github/workflows/eas-build.yml) provides a local/self-hosted execution and artifact pattern, but still runs `eas build --local` with Expo tooling/tokens. Its checked-in Android build also invokes Expo; it has no checked-in iOS project. Use it as an operational reference while removing those dependencies in NATO Phonetics. The requirement is independence from Expo/EAS accounts, subscriptions and cloud build quotas; it does not assert that all Expo builds require payment or eliminate platform signing/store requirements.

**Action:** Deliver [P00](DELIVERY_PLAN.md#p00--remove-expo-and-own-native-builds): replace Expo Router and every Expo module/tooling dependency, preserve React Native/shared behavior and local data, own tracked Android/iOS projects, build directly with Gradle/Xcode, and replace Expo web/type/lint/CI tooling. Document local/self-hosted setup, signing, versioning and artifact paths. Revalidate navigation, speech, preferences, accessibility and web routing; re-audit dependencies. **Acceptance:** A fresh checkout installs and builds web, Android debug and iOS simulator apps without Expo/EAS packages, commands, credentials or services. Run the actual native apps and capture platform-labeled screenshots; complete credential-dependent release artifacts and physical-device acceptance through P10/M11. Migration remains open until this evidence exists.

### R25 — Restore and lock the original portrait tile design

**P1 · Owner-required amendment after Run 03; web/iOS drift confirmed · M–L**

The [web alphabet capture](evidence/run03/screenshots/web/alphabet-desktop-light.png) shows nearly square cards and a full-width final Z; the [iOS alphabet capture](evidence/run03/screenshots/ios/alphabet-light.png) shows cards wider than tall. Colors and rounded corners remain, but [app/alphabet.js](../app/alphabet.js) now uses `flexGrow: 1` and a minimum height, with no fixed aspect ratio or separate letter header. These are regression evidence, not design baselines. Android appearance was not captured in that planning amendment; [Run 04](evidence/run04/screenshots/index.md) now provides migration captures, while R25 implementation remains open.

The recoverable alphabet design in `784bb93:app/alphabet.js` is **110×150 (width:height = 11:15)** with radius 12, a centered 60-unit letter header and 2-unit divider, and a centered body padded 8 horizontally/12 vertically. Base typography is letter **36/800**, word **16/600** with a 6-unit gap below, and pronunciation **11/400 italic** (size/weight). The old code does not specify a font family or line heights; the quiz also used different dimensions. Record these gaps explicitly rather than claiming an exact universal design already exists.

**Historical requested action (current implementation/disposition follows below):** Deliver [P05.6–P05.8](DELIVERY_PLAN.md#p05--make-the-application-accessible-and-dependable-to-navigate) as the next priority UI work. Establish one versioned tile specification from the original alphabet baseline, completing exact font assets/weights, sizes, line heights, letter spacing, text bounds/baselines, alignment, padding, corner radius and header/divider placement. Use one shared tile component for alphabet, converter, quiz and future symbol cards; keep the per-letter palette and quiz answer concealment. Any context size uses one uniform scale for geometry and typography. Adapt column count, surrounding spacing and scrolling to screen shape/size; never stretch the last row or independently resize/reposition text. Bundle the specified font faces on every platform and verify loading so platform defaults cannot silently change the design.

**Acceptance:** All 26 tiles retain the exact 11:15 portrait ratio and specified letter/word/pronunciation composition on web, Android and iOS, across narrow phones, tablets, desktop, orientation changes and resizable windows. At the same tile scale, every platform uses the same logical font sizes, font files and placements. Long labels such as November and Uniform must fit without ad hoc wrapping, truncation or auto-shrinking. Preserve 200% text/native accessibility sizing through proportional whole-tile enlargement, fewer columns and scrolling, with no clipped content or disabled text scaling. Add measured geometry/typography assertions and platform-specific visual baselines covering both themes, pixel densities, first/last rows and all tile contexts; document pixel-rounding/antialiasing tolerances without permitting layout drift. Actual native screenshots are required; missing Android evidence keeps verification open. M11.4 owns physical accessibility and appearance acceptance.

**Current R25 disposition — after Run 07:** The shared specification/composition/fonts are delivered and the origin correction clears the previous TREE/iPad J checks. P05.8 remains unchecked, with three ink-only iPhone failures parked at P3. Its strict measurements remain failed; readable controls, correct font/geometry, proportional accessibility scaling and hidden-answer semantics remain essential. Use the shared component for P06/P07 now. Revisit polish at the [plan's explicit triggers](DELIVERY_PLAN.md#current-delivery-order-and-residual-engineering-queue); no tolerance or release exception is granted here.

## Missing features and product improvements

These are proposed product choices, not claims that every small learning app needs them. Address the P1 defects before widening scope.

| ID | Priority | Feature | Benefit and minimum useful scope | Effort / dependency |
|---|---|---|---|---|
| F01 | P2 | Bounded practice sessions and results | Offer a configurable short round, question count, score/accuracy, missed-answer recap and Retry Mistakes. Current state tracks only the current question/result. A shuffled deck can ensure coverage without immediate repeats. | M; R10/R11 |
| F02 | P2 | Copy/share conversion and Clear | Keep selectable plain text, Copy and Share in the existing Copy or share disclosure. Verify that clearing through the input resets the output and cancels speech. Preserve word boundaries and omission markers. | S–M; R17 |
| F03 | P2 | Stable playback and pacing | Highlight the active bubble or card in place and use the fixed Play/Stop control beside the input. Use the same control to replay the phrase. Keep rate and inter-word pause in Word Converter settings. | M; R03/R04/R09 |
| F04 | P2 | Audio help and preference reset | Use the shared Play/Stop control for the sound test and keep troubleshooting in short sections. Keep Reset Preferences in its own Settings group with its scope stated. | S–M; R12/R13 |
| F05 | P3 | Number reference and numeric/mixed drills | Surface the existing digit data in the reference and offer number/postcode/callsign practice once pronunciation is verified. | S–M; R03 |
| F06 | P3 | Listening quiz and reverse recall | Play a code word and ask for its letter, or ask users to type a code word. This adds recall/listening practice without requiring a microphone. | M; audio reliability |
| F07 | P3 | Local progress and spaced practice | Show saved counts and review states in compact symbol rows and keep Open practice easy to reach. Confirm Clear Progress explicitly and keep Reset Preferences separate. Update the privacy inventory for new local data. | M–L; F01 |
| F08 | P3 | Spoken-answer quiz | Offer an optional mode in Letter Quiz after confirming provider, permission and privacy behavior. Keep recording controls in place and distinct from playback. Show a clear recording state and keep listening and typed practice reachable after failure. | L; explicit product decision |
| F09 | P3 | Reference/voice browsing polish | Keep Letters/Digits and Play/Stop together in Reference. Use the shared input and compact selected options for voice search and locale filters, with an independent Play/Stop preview per voice. | S–M |
| F10 | P3 | Deliberate web product support | Keep the bottom navigation and shared controls at desktop widths. Preserve direct links, meaningful titles, browser history and an explicit offline strategy. Show ready, update and retry states in Menu’s web availability section. | M–L; R16/R21/R22 |

## Architecture recommendations

The original recommendation to retain Expo Router is superseded by the owner's R24 requirement. Keep a lightweight React Native/shared-web architecture while replacing Expo routing, modules and build tooling through P00. Own native Android/iOS projects and an independent web build; a backend, account system or larger state framework is unnecessary for the current scope. Preserve the shared letter/digit data and separate it from rendering concerns as follows:

- Extract pure `convertText` and question-generation functions so edge cases can be tested without rendering screens.
- Centralize preferences and one audio controller; avoid repeated independent storage reads and unrelated speech queues.
- Use small shared accessible button/card/input patterns and a single theme token system to prevent repeated omissions and color drift. R25 additionally requires one NATO tile component with fixed portrait geometry, bundled fonts and exact typography tokens across every tile context.
- Keep canonical content, audio representation and explanatory pronunciation distinct. Establish a reviewed content source before adding more learning modes.
- Keep progress local if added. Make any future network service an explicit product/privacy decision.

## Suggested delivery order

Start the next implementation workload with [P05.9 Uniform UI design language](DELIVERY_PLAN.md#p059-uniform-ui-design-language), beginning with Menu and Settings. [Current action points](#next-workload-uniform-ui-design-language)

The actionable expansion of these stages is [DELIVERY_PLAN.md](DELIVERY_PLAN.md), covering all R01–R25 and F01–F10. It groups all human-only work into the single M11 phase and provides a resumable execution contract, including screenshots during final summary preparation. Use [EXECUTION_PROMPT.md](EXECUTION_PROMPT.md) to run a dynamically sized implementation batch.

| Stage | Scope | Exit condition |
|---|---|---|
| **0. Own the build (added after Run 02)** | R24/P00; revisit affected R08/R14–R16/R20–R22 behavior | Expo removed; direct Android/iOS and independent web builds run from a fresh checkout with parity evidence. |
| **1. Restore trust and checks** | R01/R02, R08 triage, truthful copy in R05/R21; decide canonical audio approach | Lint passes, J is correct, high/critical dependency exposure has a disposition, public claims match implemented behavior. |
| **2. Stabilize core use** | R03/R04/R06/R07/R09–R13/R16–R18/R25 | Correct and controllable audio; accessible usable quiz at small sizes; robust preferences; exact portrait tile design across platforms; no hydration errors on exported routes. |
| **3. Establish release confidence** | R14/R15/R19/R20/R22/R24/R25 and native/device validation | CI covers key regressions and native/web builds; internal native builds pass the manual matrix; final web/Android/iOS screenshots are linked. |
| **4. Improve learning value** | F01–F04, then selected P3 work and R23 | Users can complete/review a session, reuse converted text and control practice pace. |

The shared portrait design supports sessions/results, complete converter exports, digit practice, listening, typed recall, local progress and voice browsing. The active phase owners track remaining native readability, progress and voice/runtime qualification, recognition and release engineering. The iPhone ink fringe remains parked at P3. [Current queue](DELIVERY_PLAN.md#current-delivery-order-and-residual-engineering-queue) · [current delivery status](#current-delivery-status).

## Acceptance and regression checklist

These remain acceptance obligations. Execution scope is proportional to the change; a failed P3 diagnostic stays open and does not block unrelated feature implementation. The full scope or any concrete release exception must be reconciled before claiming overall delivery.

| Area | Checks required before release |
|---|---|
| Content | All 26 canonical spellings, ten digits and pronunciation guides reviewed; J correct throughout; reviewed audio agrees with text. |
| Converter | Empty/lowercase/alphanumeric input, repeated spaces, tabs/newlines, punctuation, accents, emoji, long paste, individual playback, rapid Play, Stop, input edit during playback, navigation mid-phrase. |
| Quiz | Exactly four unique choices, one correct option, all letters reachable, correct/incorrect feedback, explicit Next or Results, fixed Play/Stop, rapid taps, cancellation on navigation, stable feedback during speech and screen-reader answer concealment. |
| Speech | Default/selected/removed voice, mixed voice qualities, storage failure, no engine/voices, slow initialization, speech error/stop callback, silent-mode troubleshooting, interruption and background/foreground. |
| Preferences | First launch, delayed loading, failed writes, rapid changes, restart persistence, system theme changes and explicit System reset. |
| Accessibility/layout | Keyboard-only web; VoiceOver and TalkBack; 320×568 and supported native small screens; enlarged text; reduced motion; contrast; insets; tablet; keyboard-visible converter. |
| Tile design fidelity | R25: exact 11:15 portrait geometry, rounded corners, header/divider and main-letter/word/pronunciation placement; pinned font files/weights/sizes/line heights; all 26 letters and all tile contexts; no final-row stretching; web/Android/iOS geometry assertions and actual screenshots across sizes/orientations/themes/text scales. |
| UI consistency | P05.9 covers shared control states, compact navigation and settings rows, task-first layout and stable playback across Android, iOS and web. Compare the affected screens with the Reference and Word Converter baselines. [Checks](UI_DESIGN_LANGUAGE.md#acceptance-checks) |
| Privacy/offline | Airplane-mode cold launch and every audio flow; provider/network behavior checked against claims; policy/support available; new stored data inventoried. |
| Web | All direct routes and hard refreshes, meaningful document titles, bottom tabs on direct and unknown routes, browser Back and Forward, supported speech behavior and actual deployment URL routing. Check for hydration errors. |
| Native/build independence | Tracked Android/iOS projects; direct Gradle/Xcode debug/simulator and release workflows; independent web build; no Expo runtime/tooling, EAS services or Expo credentials required. Preserve identifiers, versioning, deep links, assets, permissions and existing data. |
| Screenshots | Actual final web (desktop/mobile widths), Android and iOS application captures; key screens/states/themes; candidate/platform/viewport metadata; durable evidence index and summary links. Missing captures retain an explicit blocker and open task. |
| Release | Clean locked install, lint, active-code type checking, meaningful tests, independent web build, reviewed dependency audit, regenerated icon validation and signed internal iOS/Android smoke tests from direct native builds. |

### Review maintenance

Turn R01–R25 and selected feature items into individually owned work items, retain their reproduction/acceptance details, and update this document with resolution evidence. Re-run dependency and platform checks at implementation time: audit counts and tool compatibility are snapshots, not permanent conclusions.

## Current delivery status

### Run 35 learning and support rollout

**22 November 2026 · P05.9 active.** Letter Quiz has grouped, visibly selected choices and uses the shared typed field. Learning Progress shows saved counts and due states first, followed by practice, symbol details and confirmed deletion. About, Privacy Policy and Page Not Found use the shared support patterns. Web choices respond to Space and keyboard users can activate the support link. The full Speech-policy ending is visible in narrow Edge at 200% text. R06/R07, R14, R18, R21/R22 and F01/F05/F06/F07 gained scoped evidence. The ledger remains at 14 in progress, 15 implemented awaiting M11 and six resolved. [Run 35 checks](evidence/run35/README.md) · [Screenshots](evidence/run35/screenshots/index.md).

The one-question result now uses the singular form. Production Edge rechecked score, concealment, retained drafts, saved totals, Retry, cancel and confirmed deletion. The installed Android 16 x86_64 app retained the typed draft at 2× text, passed confirmed deletion and restart, and displayed the full Speech-policy ending. The final web shell passed seven local concurrency and three Chromium freeze/resume scenarios. Installed iOS, the working-provider voice list and the exact-ABI ARM app check remain open. All seven M11 checks remain pending. [Delivery queue](DELIVERY_PLAN.md#current-delivery-order-and-residual-engineering-queue).

### Run 34 uniform UI rollout

**22 November 2026 · P05.9 active.** Menu and Settings share compact, wrapping choices and navigation rows. Voice Select uses the Converter field, compact locale choices and separate Preview controls. Audio Help uses the shared headings and navigation rows. Site Map includes Learning Progress and updated practice and settings descriptions. R06/R07, R12/R13, R18, R21/R22 and F04/F09/F10 gained scoped evidence. R14 gained a separate local browser lifecycle check. The ledger stays at 14 in progress, 15 implemented awaiting M11 and six resolved. P05, P06 and P08–P10 remain active. [Verification](evidence/run34/README.md) · [Screenshots](evidence/run34/screenshots/index.md).

The Android 16 x86_64 development build passed scoped navigation, saved-choice restart, keyboard-visible conversion, enlarged layout and a dedicated reset retest. The voice list showed the retry state on this emulator. The next UI work is Letter Quiz setup and Learning Progress, followed by About, Privacy Policy and Page Not Found. Installed iOS pilot qualification is pending. The ARM app live-size and iOS maximum-text long-drag/Share engineering gates remain P1. All seven M11 checks are pending. [UI rollout](UI_DESIGN_LANGUAGE.md#remaining-qualification) · [Acceptance queue](DELIVERY_PLAN.md#current-delivery-order-and-residual-engineering-queue).

### Next workload Uniform UI design language

**21 November 2026 · P05.9 · P2.** Reference and Word Converter establish the compact control layout, clear selection and stable audio behavior for the app. The current Quiz and Appearance choice groups use a different visual treatment. Menu destinations, voice filters and progress summaries also need a more compact, task-first hierarchy. [Full screen audit](UI_DESIGN_LANGUAGE.md#screen-analysis)

1. Define shared spacing, heading levels, visibly selected choices, destination rows and input and feedback styles from the two baseline screens.
2. Pilot the patterns in Menu and Settings, including the web availability states and the current and saved preference values.
3. Apply the patterns to Voice Select, Audio Help, Quiz, Learning Progress, About, Privacy Policy, Site Map and Page Not Found. Keep the shared playback controls and preserve tile, navigation, quiz and storage behavior.
4. Compare the affected screens on Android, iOS and web. Verify light and dark appearance, large text, focus, keyboard reachability, stable playback geometry and the core flows touched by the changes. [Delivery task](DELIVERY_PLAN.md#p059-uniform-ui-design-language) · [Acceptance checks](UI_DESIGN_LANGUAGE.md#acceptance-checks)

**Run 33 · 20 November 2026.** The standalone develop APK passed a real push, hosted Android 13 cold launch and an Android 16 cross-host upgrade with separate saved preferences. Trusted dispatch at `5963498` produced the unsigned four-ABI Android APK/AAB and launched the matching iOS simulator app. The independent hosted checks passed 174 tests and reported zero dependency advisories. Four existing web CI jobs remain red. The first actual main push is pending promotion. R14 and R20 remain in progress. R24 remains implemented awaiting M11. The ledger retains 14 in progress, 15 implemented awaiting M11 and six resolved. All seven M11 checks are pending. [Hosted results and downloadable products](evidence/run33/README.md) · [Screenshot index](evidence/run33/screenshots/index.md) · [Runbook](RELEASE_RUNBOOK.md#branch-builds-and-downloads).

**20 November 2026 · Run 32.** P07 is agent-done. P08.1 and P08.2 pass their affected Android checks. P05, P06, P08, P09 and P10 remain active. The 35-item ledger now has 14 in progress, 15 implemented awaiting M11 and six resolved. F01, F05 and F06 move to implemented awaiting M11. All seven human acceptance tasks are unperformed. [Resolution ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger).

F01/F05/F06 retain their earlier feature coverage and now qualify the original Android live-size failures on the ordinary four-ABI Release. Default x86_64 installations on Android 13 and 16 enlarged the original submitted feedback, Next and Replay. Each session ended 4/5, preserved the missed answer and finished its one-question retry at 1/1. On both Android versions the same seven numeric and four typed controls enlarged and fitted their text. The typed flow retained the digit and the draft `three`, and accepted the submitted response. Physical listening and assistive technology remain in M11. [Android 13 quiz](evidence/run32/android/quiz-api33-universal/result.json) · [Android 16 quiz](evidence/run32/android/quiz-api36-universal/result.json) · [practice evidence](NUMERIC_PRACTICE.md#live-android-digit-practice-and-typed-recall).

R06/R07/R14/R20/R24/R25 gained qualified Android build, input and layout evidence. The four-ABI APK and AAB contain matching payloads, and the local signature preserved all 521 original APK entries. Android 11 ran the x86 converter. Android 13 preserved the x86_64 converter through true split-screen, divider enlargement and restoration, and preserved the complete 2,001-character draft through Share and paging. Android 16 passed the x86_64 tile, window, editing and composition measures. Visual inspection rejected an earlier stale 2× fixture frame and confirmed that all six corrected candidate editing crops match their actual cold references. PackageManager’s requested ARM ABI did not identify the live process on this host. [Build and runtime identities](evidence/run32/README.md) · [split and visible tile](evidence/run32/android/api33-universal/result.json) · [long export](CONVERTER_POLICY.md#android-13-export-qualification) · [screenshots and limits](evidence/run32/screenshots/index.md).

### App build pipeline follow-up

**Release layout update, 20 November 2026.** R14/R20/R24 now use GitHub Releases for app downloads. The develop workflow publishes only the standalone APK. An approved production run publishes the signed APK, AAB and IPA. PR and manual CI retain the browser checks. The first public APK was retrieved and verified. [Release evidence](evidence/2026-11-20-release-layout.md) and [runbook](RELEASE_RUNBOOK.md#branch-builds-and-downloads).

**20 November 2026 · R14/R20/R24 · P2, active/partial.** The CI run in `logs_121193232675` covered quality, browser support and web distribution. Native builds live in a separate manual workflow. Eclipse Timer automatically produces a development APK on `develop` and runs its mobile build on `main`. NATO's gap is the branch-triggered build and artifact workflow. The shared build commands and manual native jobs already exist. [CI](../.github/workflows/ci.yml), [manual native builds](../.github/workflows/native-builds.yml), [Eclipse Timer dev APK](../../eclipse-timer/.github/workflows/develop-apk-release.yml), [Eclipse Timer main build](../../eclipse-timer/.github/workflows/eas-build.yml).

**Action and acceptance.** Pick P10.8 next. Use direct Gradle and Xcode to provide a development APK that cold-launches without Metro, Android Release APK/AAB and an unsigned iOS simulator artifact. Retain manual reruns, the existing web checks and source-linked build reports. Verify the downloadable outputs and an actual failure path on a suitable runner. GitHub prerelease publication requires separate authorization under M11.7. Run 32 recorded zero registered self-hosted runners, so hosted native verification remains open. [Workflow plan](DELIVERY_PLAN.md#branch-triggered-app-builds), [execution prompt](PIPELINE_EXECUTION_PROMPT.md), [runner inventory](evidence/run32/shared/remote-capability.json).

### Historical Run 31 checkpoint

**20 November 2026 · Run 31.** Ordinary Android installs now prepare the reviewed React Native source repair for live font sizing. Both Debug and Release Gradle configurations select source ReactAndroid and the pinned Maven Hermes AAR for their variant. P05.2 and P05–P10 remain active. The 35-item ledger has 17 in progress, 12 implemented awaiting M11, 6 resolved, and zero open, blocked or scope-changed. All seven M11 tasks remain unperformed. [Ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger) · [Run 31](evidence/run31/README.md).

The exact x86_64 Release product passed six native regressions and preserved converter input across live text-size changes. Its reference, converter and quiz matrix passed 505 native baselines and 220 ink observations. Resizing preserved submitted quiz state and explicit Next advanced once. R06/R07/R25 retain their wider accessibility and appearance gates. R14/R20/R24 gain clean install, classpath, host and cross-platform source evidence. R08's unchanged lock returned zero audit findings. Earlier ARM64 screenshots and measurements still identify the historical opt-in binary. [Selection](evidence/run31/android/default-renderers.log) · [new capture index](evidence/run31/screenshots/index.md) · [next P1](evidence/run31/android/next-android.md).

The 83 inspected Android screenshots include superseded stale frames. The corrected system-display captures verify live product composition. Gboard still obscures the enlarged fixture input and caret, although the native editing checks pass. Revisit that visual check when a supported keyboard configuration exposes the field. The next P1 is the unfiltered four-ABI Release package and affected ARM64 runtime checks. [Editing evidence](evidence/run31/android/fixture-edit-display/README.md) · [capture inventory](evidence/run31/screenshots/inventory.json).

### Historical Run30 checkpoint

**Historical update:** 20 November 2026 — Run30 production Android Release native tile qualification and scoped window/state acceptance. Original review findings remain historical; the [ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger) owns current statuses.

- **Status:** all35 remain0 open/17 in-progress/12 implemented-awaiting-M11/6 resolved/0 blocked/0 scope changes. P05.2 and P05–P10 remain active; all M11 results unperformed. R06/R07/R14/R20/R24/R25 gain scoped evidence; no whole item/phase closes. [Evidence](evidence/run30/README.md).
- **Delivered:** isolated native observer reads actual Android Layout baselines, transforms, spans/resolved typography/radius and identities on unchanged non-debuggable Release5dfa45d2. Original complete tile context matrix passes15groups/505baselines and217ink observations at unchanged1px/2px/>8RGB thresholds. Product display resizing/state adds93baselines plus21complete-narrow; NUWJ359/submitted quiz X/score retained, feedback/Next reachable and explicit Next advances once. [Native](evidence/run30/android/native-layout-checks.json), [ink](evidence/run30/android/extended-raster-measurements.json), [windows](evidence/run30/android/window-layout-checks.json).
- **Checks/failures:**11 scoped tests/lint pass. Initial Android API/radius-reflection failures, extra inner-Text-height predicate, interrupted hidden-screen traversal and native-only full-visibility ink failure remain archived. Final collection prunes inactive native subtrees; actual saved UIAutomator clipping selects complete tiles for the unchanged ink checker. No product/font/native repair/dependency/worker changes or fresh broad shared/audit/type/web/iOS/ABI build claim. [Commands and corrections](evidence/run30/README.md).
- **Screens/restoration:**30 inspected actual Android captures, including complete narrow tile and reachable enlarged feedback/Next. Initial Debug APK/numeric settings/Gboard and ordinary entry restored without data clear; exact pre-run theme was not captured, Dark matches last documented preference. Two test answers may append normal aggregate progress. Owned exports collected/removed, tools stopped. Web/iOS captures inapplicable to this Android-only tooling delta; full P10.7/broader runtime remain open. [Index](evidence/run30/screenshots/index.md), [restoration](evidence/run30/android/restoration.json).
- **Next/stop/manual:** next P1 ordinary clean/default source integration with guarded preparation, actual default dependency/payload selection and exact-artifact retests. Default Maven historical defect remains; reuse qualified opt-in scopes. Stop at verified original Release/window/state checkpoint to reserve inspection/restoration/status capacity before the M–L integration/build cycle; free-space low watermark~303MiB (recovering to~1.3GiB after shutdown), no invented cleanup gate or new owner prerequisite. Broader OS/split-window/additional-ABI/runtime, iOS/WebKit/P3/recognition/integrated and physical/AT/provider/listening/private signing/distribution/release acceptance remain open. [Exact next](evidence/run30/android/next-android.md), [M11](evidence/run30/manual-handoff.md).

### Historical Run29 checkpoint (superseded by Run30 above)

**Historical update:** 20 November 2026 — Run29 exact-payload Release fixture/native observer and scoped unchanged production state/captures. Original review date, snapshot and findings above remain historical; [ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger) owns current statuses.

- **Status:** all35 required remain0 open/17 in-progress/12 implemented-awaiting-M11/6 resolved/0 blocked/0 scope changes. P05–P10 active; every M11 result unperformed. R06/R07/R14/R20/R24 gain scoped evidence; no whole item/phase closes. Standard Maven remains unchanged/historically failing. [Evidence](evidence/run29/README.md).
- **Delivered:** separate normal-startup Release fixture and native observer work without development inspector/root replacement/product changes. Corrected fixturef56ea0f3 changes only embedded diagnostic JS plus local signature;487 other non-signature entries match preserved Release original1efaab9d, including37 metadata/ServiceLoader entries, manifest/DEX/native/Hermes/fonts. Actual60 frame/widget comparisons,12resize/12narrow/3edits and native identity/focus/caret/paint/layout checks pass. [Binding](evidence/run29/android/fixture-payload-identity-final.json), [full gate](evidence/run29/android/final/gate.json), [narrow](evidence/run29/android/narrow-final/gate.json).
- **Production/checks/failures:** unchanged non-debuggable Release5dfa45d2 passes scoped converter1→2→1, same submitted quiz symbol/score, reachable feedback/Next and single advance.12scoped tests/lint pass; prior broader shared/type/web/audit/iOS/native scopes retain exact limits, not fresh passes. Initial serial selection, added float-equality predicate and metadata-stripping tool failures remain archived; corrected final candidate freshly executes all affected gates. Detailed original float-gate output was overwritten; raw observations/failed command/log retained, no fabricated substitute. [Actual product scope](evidence/run29/android/product/identity.json), [failure details](evidence/run29/README.md).
- **Screens/restoration:**40 inspected actual Android images:28final fixture/11production Release/1restored initial Debug. Narrow fixture's unscrolled offscreen nested text is explicitly diagnostic; no full product Release fidelity matrix claim. Initial APK/font/window/density/Gboard/ordinary entry restored without data clear, owned tools stopped/collected exports removed. Web/iOS captures inapplicable to Android-only tooling; other ABI runtime and full P10.7 remain missing/unrun. [Index](evidence/run29/screenshots/index.md), [restoration](evidence/run29/android/restoration.json).
- **Next/stop/manual:** next P1 production Release baseline/ink/full original contexts/window/application acceptance via isolated native observation, then ordinary clean/default-source integration and exact-artifact retests. Existing inspector-based Debug evidence is not Release evidence. Stop at verified fixture/state/capture checkpoint to reserve remaining capacity for reliable handoff before that substantial M–L cycle. No owner input blocks it. All prior iOS/WebKit/P3/support/recognition/integrated obligations and M11 physical/AT/provider/listening/private signing/distribution/release acceptance remain open. [Exact next work](evidence/run29/android/next-android.md), [M11](evidence/run29/manual-handoff.md).
