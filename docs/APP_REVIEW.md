# NATO Phonetics — comprehensive application review

**Review date:** 16 November 2026

**Revision reviewed:** `784bb93` (`main` history: “Merge pull request #1 from c0d3rb4b4/setup/ci”)

**Scope:** Product functionality, educational content, accessibility, UX, speech, persistence, architecture, testing, dependencies, privacy claims, assets, documentation and release readiness.

**Deliverable:** Analysis and prioritized backlog. No application fixes or dependency upgrades were made.

**Planning amendment — 16 November 2026, after Run 02:** R24 adds the owner's requirement to remove Expo and build Android/iOS directly, using Eclipse Timer's local/self-hosted build pattern as a reference. The earlier review and execution evidence remain historical. The updated plan also requires real web/Android/iOS screenshots after implementation and verification, linked in the final summary.

**Planning amendment — 16 November 2026, after Run 03:** R25 is a **P1 priority** to restore and enforce the original portrait tile design across web, Android and iOS. P05.6–P05.8 own the shared geometry/typography specification, implementation and regression evidence. Its original before-feature sequencing is historical and superseded by the current amendment below.

**Current priority amendment — 17 November 2026, after Run 07:** The [cross-run evidence review](DELIVERY_PRIORITY_REVIEW.md) finds justified foundation/design work followed by diminishing returns from the whole-P05 feature gate. The shared portrait component is delivered. Remaining iPhone ink-only fringes are **P3 parked polish**; ordinary Android unreadable/stale text remains **P1**. Proceed with **P07.2/.4 sessions/results and P06 converter completion** through delivered shared components, with affected-flow accessibility checks. This amendment supersedes earlier sequencing that required every P05 check before feature UI; failed checks, full scope and M11 acceptance remain open.

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

| Current residual / deliverable | Priority / action |
|---|---|
| Android ordinary text/feedback/action-label readability, R06/R07/P05.2 | **P1 active**; separate cold configured large text from live transitions, establish the smallest causal reproduction and preserve state. Affected native accessibility/release acceptance remains failed. |
| Sessions/results/Retry Mistakes, F01/P07.2/.4 | **P2 functional implementation delivered**; retain affected native accessibility qualification. Run 11 extends symbol sets without closing the live Android gate. |
| Converter normalization/Clear/Copy/Share/pacing/highlighting, R17/F02/F03 | **P2 functional implementation delivered**; retain affected native input/readability, clipboard and final acceptance. Run 11 passes scoped direct iOS Stop→Replay with/without keyboard. |
| Security/native CI/support qualification, R08/R14/P10 | Maintain dated security dispositions, schedule compatible remediation and actual CI/runtime qualification; promote new severe exposure. Unrun support/device evidence remains explicit. |
| iPhone DPR 3 maximum India/Juliett ink fringes, R25/P05.8 | **P3 parked**; retain strict failed results, unchanged tolerances and re-entry triggers. Design drift/readability regressions still promote; no P06/P07 implementation gate. |
| iOS bulk-XCTest input anomaly, P06.4/P10 | **P2 parked compatibility follow-up**; realistic key/edit/Paste tests remain required. Reproduced ordinary input loss promotes to P1. |

The original register and detailed findings below preserve the reviewed snapshot. Current implementation evidence, residual priorities and scheduling come from this amendment, the Current delivery status and the plan; no original issue is silently declared fixed.

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

**Action:** Add safe-area-aware scrolling, flexible card heights and responsive spacing; constrain wide desktop/tablet content for readability. **Acceptance:** Every answer and feedback state remains reachable at 320×568, at 200% text scaling and with supported native accessibility text sizes; test keyboard-visible converter, Android gesture navigation, iPhone insets and supported tablets.

**Current plan amendment:** R25 supersedes flexible heights for NATO tiles: scale the complete portrait tile proportionally, reflow the grid and allow scrolling. Preserve this finding's reachability and large-text requirements without stretching tiles or moving their internal content independently.

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

**Action:** Fall back to the default voice when preference reads fail, return explicit completed/failed/cancelled outcomes, settle `onStopped`, and provide a bounded recovery path for missing callbacks. Surface useful retry/troubleshooting feedback, including device-specific audio restrictions, without logging entered content unnecessarily. **Acceptance:** Storage errors do not silence otherwise available speech; engine errors are visible; cancellation settles once and never resumes the old phrase.

### R10 — Let learners control quiz progression and clean up callbacks

**P2 · Source-confirmed · M**

[app/letter-quiz.js](../app/letter-quiz.js), lines 84–100, starts a 700 ms animation, then speech, plus a separate 2,000/2,500 ms transition timer. Feedback gets only approximately 1.3/1.8 seconds after the animation, independent of speech completion. No timeout/animation cleanup or focus handling exists. Answering and immediately opening Menu can allow speech and advancement on the covered screen.

**Action:** Prefer explicit Next and Replay actions; make auto-advance optional. Cancel animation/timer/speech ownership on blur or unmount, and ignore cancelled animation callbacks. **Acceptance:** Feedback stays until acknowledged in manual mode; slow speech does not overlap the next question; leaving during the flip cannot trigger stale audio or advance an inactive session.

### R11 — Generate unique, unambiguous and fairly shuffled options

**P2 · Reproduced logic · S–M**

[src/data/quizDistractors.js](../src/data/quizDistractors.js) repeats values such as Atlas, Dublin, Kenya and Ranger. The generator only removes exact matches to the correct word before sampling ([app/letter-quiz.js](../app/letter-quiz.js), lines 28–37). It can therefore render duplicate options. `Québec` remains a wrong option for `Quebec`, creating an ambiguous spelling exercise without explanation.

Both option and distractor shuffles use `sort(() => Math.random() - 0.5)` at lines 23 and 36. This is not uniform: 100,000 seeded option-shuffle trials placed the correct option in positions 1–4 approximately **27.9%, 28.3%, 25.1%, 18.6%** of the time. These exact rates are engine/seed-specific.

**Action:** Deduplicate/normalize candidate pools, exclude confusing equivalents and use Fisher–Yates with injectable randomness. **Acceptance:** Every generated question has exactly four distinct, unambiguous choices and one correct answer; deterministic tests cover all letters and pool fallback behavior. A shuffled-letter deck can additionally avoid immediate repeats (F01).

### R12 — Make voice selection complete and recoverable

**P2 · Source-confirmed · M**

[app/voice-select.js](../app/voice-select.js), lines 20–30, hides all standard English voices if any enhanced English voice exists. There is no System Default option or recovery from a removed saved voice. The initial empty array displays “No English voices” during loading (lines 83–88). Selection updates before storage succeeds (lines 56–67), so a failure can leave a checkmark on an unsaved choice. A delayed initial preference read can overwrite newer UI state. Settings does not reset its label when a saved identifier is missing ([app/settings.js](../app/settings.js), lines 22–29).

**Action:** Show all eligible voices, group by locale/quality, offer System Default, validate saved identifiers, and distinguish loading/empty/error states with Retry. Serialize or guard preference updates; rollback or explain failed saves. Align the chosen voice's locale with playback options. **Acceptance:** Test mixed-quality voices, no voices, delayed enumeration, removed voices, storage failures and rapid selections; displayed and persisted selections always agree.

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

### R22 — Provide Home navigation for direct entry

**P2 · Source-supported risk; full deep-link testing pending · S**

[app/menu.js](../app/menu.js), line 63, implements “Back to App” solely with `router.back()`. The app config declares a URL scheme and static web routes, but the layout provides no explicit fallback for a cold-start Menu entry. With no in-app history, back may do nothing or leave the app's browser history.

**Action:** Use the appropriate navigation-stack check and fall back to Home; decide how secondary deep-linked screens expose Home. **Acceptance:** Opening `/menu` directly in a fresh browser context or via the native scheme gives a reliable route to Home, while normal in-app back behavior remains correct.

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
| F02 | P2 | Copy/share conversion and Clear | Provide a plain-text phonetic representation, Copy, native Share where supported, and Clear input. Preserve meaningful word boundaries and disclose omitted characters. | S–M; R17 |
| F03 | P2 | Playback progress and pacing | Highlight the current token and offer replay, adjustable rate and inter-word pause. Stop is already a correctness requirement in R04, not an optional enhancement. | M; R03/R04/R09 |
| F04 | P2 | Audio help and preference reset | Explain no-voice/silent-output recovery, provide a sound test and reset voice/theme preferences without clearing the entire app. | S–M; R12/R13 |
| F05 | P3 | Number reference and numeric/mixed drills | Surface the existing digit data in the reference and offer number/postcode/callsign practice once pronunciation is verified. | S–M; R03 |
| F06 | P3 | Listening quiz and reverse recall | Play a code word and ask for its letter, or ask users to type a code word. This adds recall/listening practice without requiring a microphone. | M; audio reliability |
| F07 | P3 | Local progress and spaced practice | Save per-letter attempts/errors and offer focused review. Add clear/reset controls and update the privacy inventory for new local data. | M–L; F01 |
| F08 | P3 | Spoken-answer quiz | Replace the placeholder only after deciding speech-recognition support, accuracy, permissions and offline/privacy behavior across platforms. Keep optional; failure must not block basic learning. | L; explicit product decision |
| F09 | P3 | Reference/voice browsing polish | Add voice search/locale filters and quick reference navigation if the installed list or user testing justifies it. A 26-item alphabet does not need elaborate search infrastructure. | S–M |
| F10 | P3 | Deliberate web product support | If web is a release target, add responsive desktop layouts, deployment/deep-link documentation, metadata and an explicit offline strategy. Static HTML alone does not establish offline web support. | M–L; R16/R21/R22 |

## Architecture recommendations

The original recommendation to retain Expo Router is superseded by the owner's R24 requirement. Keep a lightweight React Native/shared-web architecture while replacing Expo routing, modules and build tooling through P00. Own native Android/iOS projects and an independent web build; a backend, account system or larger state framework is unnecessary for the current scope. Preserve the shared letter/digit data and separate it from rendering concerns as follows:

- Extract pure `convertText` and question-generation functions so edge cases can be tested without rendering screens.
- Centralize preferences and one audio controller; avoid repeated independent storage reads and unrelated speech queues.
- Use small shared accessible button/card/input patterns and a single theme token system to prevent repeated omissions and color drift. R25 additionally requires one NATO tile component with fixed portrait geometry, bundled fonts and exact typography tokens across every tile context.
- Keep canonical content, audio representation and explanatory pronunciation distinct. Establish a reviewed content source before adding more learning modes.
- Keep progress local if added. Make any future network service an explicit product/privacy decision.

## Suggested delivery order

The actionable expansion of these stages is [DELIVERY_PLAN.md](DELIVERY_PLAN.md), covering all R01–R25 and F01–F10. It groups all human-only work into the single M11 phase and provides a resumable execution contract, including screenshots during final summary preparation. Use [EXECUTION_PROMPT.md](EXECUTION_PROMPT.md) to run a dynamically sized implementation batch.

| Stage | Scope | Exit condition |
|---|---|---|
| **0. Own the build (added after Run 02)** | R24/P00; revisit affected R08/R14–R16/R20–R22 behavior | Expo removed; direct Android/iOS and independent web builds run from a fresh checkout with parity evidence. |
| **1. Restore trust and checks** | R01/R02, R08 triage, truthful copy in R05/R21; decide canonical audio approach | Lint passes, J is correct, high/critical dependency exposure has a disposition, public claims match implemented behavior. |
| **2. Stabilize core use** | R03/R04/R06/R07/R09–R13/R16–R18/R25 | Correct and controllable audio; accessible usable quiz at small sizes; robust preferences; exact portrait tile design across platforms; no hydration errors on exported routes. |
| **3. Establish release confidence** | R14/R15/R19/R20/R22/R24/R25 and native/device validation | CI covers key regressions and native/web builds; internal native builds pass the manual matrix; final web/Android/iOS screenshots are linked. |
| **4. Improve learning value** | F01–F04, then selected P3 work and R23 | Users can complete/review a session, reuse converted text and control practice pace. |

The R25 shared design foundation now exists. Runs 08–10 integrate sessions/results and converter normalization/export/pacing/paged long-input rendering. Run 11 adds digit/mixed/example drills and voice browsing through those foundations; Run 12 adds listening-to-symbol and typed canonical code-word recall. Run 13 adds versioned local progress/due/focused practice and inventory/help. Prioritize bounded P05.2 native readability/affected qualification; Run 14 delivers P10.1 release assets and P09.1 recognition assessment; P10 offline/runbook, concurrent progress qualification and separately forecast P09.2–.4 remain eligible. P07.4/P06/P08.1/.2/.4 affected accessibility remains open. Keep the remaining P3 ink fringe out of their implementation dependency path. Candidate/security/offline/asset preparation can proceed by task; final support/accessibility/release evidence remains required. Dependencies should guide implementation: R09 is part of making R04 safe; R03 and R05 share the audio architecture decision; R10/R11 underpin F01; R14 should grow alongside the fixes rather than wait until all work is finished.

## Acceptance and regression checklist

These remain acceptance obligations. Execution scope is proportional to the change; a failed P3 diagnostic stays open and does not block unrelated feature implementation. The full scope or any concrete release exception must be reconciled before claiming overall delivery.

| Area | Checks required before release |
|---|---|
| Content | All 26 canonical spellings, ten digits and pronunciation guides reviewed; J correct throughout; reviewed audio agrees with text. |
| Converter | Empty/lowercase/alphanumeric input, repeated spaces, tabs/newlines, punctuation, accents, emoji, long paste, individual playback, rapid Play, Stop, input edit during playback, navigation mid-phrase. |
| Quiz | Exactly four unique choices, one correct option, all letters reachable, correct/incorrect feedback, explicit next/replay, rapid taps, leave during flip/timer, no stale audio, screen-reader answer concealment. |
| Speech | Default/selected/removed voice, mixed voice qualities, storage failure, no engine/voices, slow initialization, speech error/stop callback, silent-mode troubleshooting, interruption and background/foreground. |
| Preferences | First launch, delayed loading, failed writes, rapid changes, restart persistence, system theme changes and explicit System reset. |
| Accessibility/layout | Keyboard-only web; VoiceOver and TalkBack; 320×568 and supported native small screens; enlarged text; reduced motion; contrast; insets; tablet; keyboard-visible converter. |
| Tile design fidelity | R25: exact 11:15 portrait geometry, rounded corners, header/divider and main-letter/word/pronunciation placement; pinned font files/weights/sizes/line heights; all 26 letters and all tile contexts; no final-row stretching; web/Android/iOS geometry assertions and actual screenshots across sizes/orientations/themes/text scales. |
| Privacy/offline | Airplane-mode cold launch and every audio flow; provider/network behavior checked against claims; policy/support available; new stored data inventoried. |
| Web | All direct routes and hard refreshes; no hydration errors; meaningful document titles; browser back/Home fallback; supported speech behavior; actual deployment URL routing. |
| Native/build independence | Tracked Android/iOS projects; direct Gradle/Xcode debug/simulator and release workflows; independent web build; no Expo runtime/tooling, EAS services or Expo credentials required. Preserve identifiers, versioning, deep links, assets, permissions and existing data. |
| Screenshots | Actual final web (desktop/mobile widths), Android and iOS application captures; key screens/states/themes; candidate/platform/viewport metadata; durable evidence index and summary links. Missing captures retain an explicit blocker and open task. |
| Release | Clean locked install, lint, active-code type checking, meaningful tests, independent web build, reviewed dependency audit, regenerated icon validation and signed internal iOS/Android smoke tests from direct native builds. |

### Review maintenance

Turn R01–R25 and selected feature items into individually owned work items, retain their reproduction/acceptance details, and update this document with resolution evidence. Re-run dependency and platform checks at implementation time: audit counts and tool compatibility are snapshots, not permanent conclusions.

## Current delivery status

**Updated:** 19 November 2026 — Run27 complete Android F1 tile scope and scoped ARM64 source Release qualification. Original review date, snapshot and findings above remain historical; [the ledger](DELIVERY_PLAN.md#complete-scope-and-resolution-ledger) owns current status.

- **Scope/status:** all35 required:0 open/17 in-progress/12 implemented-awaiting-M11/6 resolved/0 blocked/0 scope changes. P05–P10 active, every M11 result unperformed. R06/R07/R14/R20/R24/R25 gain evidence; no whole item/phase closes. Default Maven path remains unchanged with the historical live-text failure. [Evidence](evidence/run27/README.md).
- **F1 delivered:** existing source Debug candidate passes the original complete Run07 context/part checks:18 groups/625 native baselines, none missing;271 ink observations, maxima0.000606px baseline/1.369px top/1.282px bottom against unchanged1px/2px limits. All26 default alphabet, NUWJ359 converter light/dark1× and dark2×, concealed/revealed quiz dark2×.19 actual F1 captures inspected. [Provenance](evidence/run27/android/assertion-provenance.json), [reports](evidence/run27/android/f1-summary.json).
- **F2 scoped delivery:** optimized ARM64 source Release APK/AAB build passes8m51s. Originals unsigned; separate local development-signed Release copy remains non-debuggable and preserves all original payload entries. Embedded production JS equals Run23; Hermes equals pinned Maven0.81.5 Release. Six actual native cases and five real-product test-IME checkpoints pass, including same view/Editable/focus/caret/composition at1→2→1 and continued input. No physical/provider-IME/AT pass. [Artifacts](evidence/run27/android/release-artifacts.json), [native cases](evidence/run27/android/native-release/native-result.json), [composition](evidence/run27/android/release-composition/report.json).
- **Tooling/failures:** explicit Debug/Release ABI guard and optional non-debuggable evidence export implemented. First Release native harness link fails from Debug class-layout macros; correct variant passes unchanged six predicates. Correct Debug compile and wrong-mode negative verified. Two capture setup commands remain failed; same-round scroll-aligned continuation completes required captures before independent unchanged complete gates pass. Original/intermediate native/iOS/WebKit/P3 failures remain red. Six maintained Android regression/source-guard tests pass; full157/lint/types/web/audit/iOS unchanged-input scopes are historical, not fresh passes. [Checkpoint record](evidence/run27/shared/forecast.md).
- **Remaining/next/manual:** next P1 F2 remaining source ABIs (armeabi-v7a first), full Release affected fixture/raster/application/window gates, then clean default-source integration and exact-artifact retests. F1 is not repeated without an invalidating renderer/font/layout input. No missing owner input or measured disk/build failure blocks the next engineering step. Stop at verified ARM64 Release checkpoint for remaining execution capacity/source-status-evidence handoff. All25 actual Android captures inspected; no new web/iOS capture applicable to unchanged targets. P10.7 integrated cross-target set and M11 physical/AT/listening/provider/private signing/distribution/release acceptance stay unfinished. [Screenshot index](evidence/run27/screenshots/index.md), [next command](evidence/run27/android/next-android.md), [M11](evidence/run27/manual-handoff.md).
