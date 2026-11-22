# Audio strategy and M11 listening worksheet

Prepared 16 November 2026 for P04. **No listening, physical-device, provider privacy or offline acceptance has been performed.** This is an input to M11.3/.5/.6, not a claim of verified pronunciation or a separate manual gate. Record the exact source/artifact identity from the delivery run before using this worksheet.

## Implemented strategy

Every entry has independent canonical `word`, explanatory `pronunciation`, and intentional `speechText` fields. Canonical labels remain Alfa/Juliett and Zero–Nine. Speech sends explicit `tree`, `fower`, `fife`, `niner`; Juliett uses `Juliet`, and Quebec uses `keh beck` to steer provider pronunciation. Other alphabet entries deliberately use ordinary word input. These are provider inputs, not phonetic markup or recordings; stress, accent and intelligibility must be listened to on each supported engine. No recorded assets are included and no recording-rights assumption is needed. If listening fails, revise the input or propose reviewed recordings and record rights/provenance in M11.

Native iOS/Android playback uses **react-native-tts 4.1.1**, backed by AVSpeechSynthesizer / Android TextToSpeech, through `platformSpeech.js` and `nativeTtsAdapter.js`. Web retains the browser SpeechSynthesis adapter. Enumeration stays in preparation so a late voice-list result cannot start cancelled speech. Native initialization/configuration/Stop are serialized; event subscriptions are scoped to each utterance and removed on completion/cancellation. Stop awaits engine initialization before calling the provider, preventing an Android cold-start `not_ready` rejection. An explicit Android Stop error blocks replacement, while iOS reporting no active utterance remains safe. Android's published provider reused the text hash as an event ID; a version-guarded postinstall patch replaces it with a UUID so repeated words cannot share terminal events. iOS subscribes only to its supported finish/cancel events; rejected promises and bounded timeouts handle failures. The install patch also corrects the provider's four iOS Boolean bridge parameters from pointer to scalar types; the original ABI caused native Stop failure under React Native 0.81.5 interop.

**P00 / R24 migration:** the source replacement is implemented; direct native build/install/launch evidence is tracked separately in the delivery record. The adapter keeps voice identifiers and the shared controller contract. Language reset restores System Default after a custom voice. Android rate uses a 1.0 multiplier; iOS maps that to AVSpeech's 0.5 scale. The provider inherits iOS audio-session/silent-switch behavior rather than forcing playback over mute. These are implementation facts, not native audibility or parity acceptance. Complete M11.3/.5/.6 against the migrated candidate for pronunciation, interruptions, silent-output recovery, privacy and offline behavior.

The controller has one owner. New playback replaces the entire previous sequence, including preparation, current utterance and inter-word waits. Explicit Stop and lifecycle cleanup invalidate callbacks immediately. Words are submitted one at a time. Outcomes distinguish completed, failed and cancelled; error messages do not include provider-returned text. Progress reports preparation, current token and the gap between words. The default gap is 120 ms; configurable gaps are bounded to 5 seconds and rate to 0.5–1.5. These are app pacing choices, not claims of official transmission timing.

Provider completion is bounded per token to 15–60 seconds according to text length/rate. Voice enumeration is bounded to 3 seconds, voice/settings lookup to 3.5 seconds each, overall preparation to 8 seconds, and Stop acknowledgement to 2.5 seconds. Missing settings, removed voices or failed listing use System Default with feedback. A missing completion fails rather than silently advancing. A timed-out native Stop still blocks new speech until the underlying Stop actually settles; retry cannot bypass it and create overlapping output. An explicit Stop failure displays provider uncertainty. Restart is the recovery when the provider remains stuck.

Voice browsing retains all English voices, including Default when Enhanced voices are available. Locales such as `en_GB`/`EN-gb` normalize to `en-GB`; canonical ISO alias `eng` becomes `en`. Voices are grouped in locale order, Enhanced before Default within a locale, then by name and identifier. Web does not report enhanced quality, so browser voices are honestly marked Default. A selected identifier is checked at playback time; fallback does not silently overwrite the stored choice.

The app does not add a speech backend, analytics or audio recordings. Device/browser speech providers may use network services; native voice metadata does not establish local processing, and browser `localService` is provider metadata, not an independently verified privacy guarantee. Empty voice enumeration does not necessarily mean default speech is unavailable. Silent output can occur despite a completed callback, so automated outcomes do not prove audibility.

## References inspected

- [react-native-tts maintainer reference](https://github.com/ak1394/react-native-tts), plus the installed 4.1.1 JavaScript, Android and iOS source, establish actual events, voice IDs, rate scales and inherited audio-session behavior. Run 02's Expo Speech investigation remains historical in its execution evidence; Expo is no longer the maintained provider.
- [Web Speech API specification](https://webaudio.github.io/web-speech-api/#tts-section), [MDN voice enumeration](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/getVoices), [voice change events](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis/voiceschanged_event) and [localService](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisVoice/localService) explain browser voice availability and provider metadata.
- [ICAO alphabet explanation](https://www.icao.int/sites/default/files/postalhistory/annex_10_aeronautical_telecommunications.htm) identifies special radio pronunciation, including TREE/FIFE/NINER. [FAA radiotelephony alphabet and numerals](https://www.faa.gov/air_traffic/publications/atpubs/fs_html/chap2_section_3.html) supplies the reference guides for listening. Canonical spelling is also checked against the [NATO reference](https://nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet). The worksheet below records the app's current data, not a certification of synthesized audio.

## M11.3: complete listening script

Record candidate hash/build, date, reviewer, device/OS/browser version, speech provider/version, voice identifier/locale/quality, network state, rate and gap. Test System Default plus at least one selected English voice on each supported platform. Include both Default/Enhanced native qualities and multiple English locales where available. No platform or voice is passed by implication from another.

In Alphabet, play each letter independently. In Converter, enter `ABCDEFGHIJKLMNOPQRSTUVWXYZ` and play the sequence. Enter `0123456789`, play each digit card individually, then Play All. For every row record heard syllables/stress, agreement with the guide and pass/fail; an unfilled result is **unrun**.

| Symbol | Canonical label | Displayed guide | Provider text | Heard result / pass or fail |
|---|---|---|---|---|
| A | Alfa | AL-fah | Alfa | unrun |
| B | Bravo | BRAH-voh | Bravo | unrun |
| C | Charlie | CHAR-lee | Charlie | unrun |
| D | Delta | DELL-tah | Delta | unrun |
| E | Echo | ECK-oh | Echo | unrun |
| F | Foxtrot | FOKS-trot | Foxtrot | unrun |
| G | Golf | GOLF | Golf | unrun |
| H | Hotel | hoh-TELL | Hotel | unrun |
| I | India | IN-dee-ah | India | unrun |
| J | Juliett | JEW-lee-ett | Juliet | unrun |
| K | Kilo | KEY-loh | Kilo | unrun |
| L | Lima | LEE-mah | Lima | unrun |
| M | Mike | MIKE | Mike | unrun |
| N | November | no-VEM-ber | November | unrun |
| O | Oscar | OSS-cah | Oscar | unrun |
| P | Papa | pah-PAH | Papa | unrun |
| Q | Quebec | keh-BECK | keh beck | unrun |
| R | Romeo | ROW-me-oh | Romeo | unrun |
| S | Sierra | see-AIR-ah | Sierra | unrun |
| T | Tango | TANG-go | Tango | unrun |
| U | Uniform | YOU-nee-form | Uniform | unrun |
| V | Victor | VIK-tah | Victor | unrun |
| W | Whiskey | WISS-key | Whiskey | unrun |
| X | X-ray | ECKS-ray | X-ray | unrun |
| Y | Yankee | YANG-key | Yankee | unrun |
| Z | Zulu | ZOO-loo | Zulu | unrun |
| 0 | Zero | ZEE-roh | Zero | unrun |
| 1 | One | WUN | One | unrun |
| 2 | Two | TOO | Two | unrun |
| 3 | Three | TREE | tree | unrun |
| 4 | Four | FOW-er | fower | unrun |
| 5 | Five | FIFE | fife | unrun |
| 6 | Six | SIX | Six | unrun |
| 7 | Seven | SEV-en | Seven | unrun |
| 8 | Eight | AIT | Eight | unrun |
| 9 | Nine | NIN-er | niner | unrun |

Then use the following cases and write a separate result per voice/platform:

1. `359`, then `A359 B953`, then `GABCD 359`: hear TREE/FIFE/NINER, never ordinary THREE/FIVE/NINE; retain letter/digit order and word boundaries.
2. `JQPH`: assess Juliett, Quebec, Papa and Hotel stress explicitly. Compare the display guide with heard output; a plausible word is insufficient if stress is wrong.
3. Use the Audio Help sound test and Voice Selection preview. Confirm the same entry inputs and intended voice are heard. Selection must reflect persisted preference; preview must not silently change it.
4. Repeat `AB` rapidly, interrupt after Alfa, then replay once. An interrupted Alfa may be heard twice, but Bravo from the replaced request must never follow the new sequence. Check highlighted token agrees with the utterance being heard.
5. After P06 pacing controls are available, repeat at every offered rate and gap; check intelligibility, progress and consistent word boundaries. Until those controls are implemented this particular UI check remains pending P06; the P04 controller parameters alone do not complete F03.

## M11.5: device resilience and silent-output recovery

Try Stop during a word, an inter-word gap, slow provider initialization and voice preview. Navigate away and background the app during those same states; no queued word should resume on return. Test real OS interruption/call/audio-route changes. Verify only the current screen's owner can stop its playback, and a later screen's audio survives old-screen cleanup.

Remove/change the saved provider voice outside the app, reopen and play: default speech should work with visible fallback and no fabricated saved selection. Re-select a valid voice, restart and verify it. Exercise empty/failed voice enumeration and Retry where possible; another working mode must stay usable. Rapidly preview and select voices, leave, return, and verify the final confirmed selection rather than an earlier async result. Keep existing preference migration/reset checks in M11.5.

If silent, check media volume, output device, OS text-to-speech availability and installed English voices; on physical iOS test with silent mode both enabled and disabled. The native adapter inherits the audio session; record the actual device behavior before making stronger claims. Try System Default, another installed voice and the Audio Help test. Record whether callbacks completed even when no sound was audible. If a provider fails or hangs, verify visible feedback and no continued sequence. Browser automation simulates these conditions but does not replace this device check.

## M11.6: provider and offline matrix

For each tested voice, cold launch online and in airplane mode, then run independent letter, `359`, phrase, preview and quiz playback. Record shell availability separately from speech success. Inspect provider/network behavior using appropriate device/browser tools; record evidence and revise README/PRIVACY if observed behavior differs. Do not label the whole app local-only because one browser voice reports `localService` or one voice works offline. Recognition checks remain P09/M11.6 work.

## Automated evidence and limits

`node --test tests/audio.test.mjs tests/native-tts.test.mjs` covers model inputs, replacement, preparation/pause cancellation, owner scoping, stopped/error/throw/timeout outcomes, late callbacks, stop acknowledgement/timeout/recovery, progress/rate, mixed-quality locale normalization, missing storage/voice fallback, browser event cleanup and a late voice-list result after Stop. Native adapter regressions additionally cover initialization/Stop races, ID correlation, early events, default-voice restoration, voice connectivity metadata, unsupported iOS events and the installed Android UUID patch. Default browser playback is tested with empty and throwing voice-list APIs. Source tests cannot hear output; exported browser integration evidence is recorded separately in the delivery plan. Every manual result in this worksheet remains unrun.


## Run 04 native engineering evidence

The final installed Android 16/API 36 and iOS 26.2 apps pass real-provider enumeration, saved/default voice, completion, explicit Stop, replacement, navigation/background cancellation and no-resume checks. Android also verifies four identical words have distinct native UUIDs with matching finish events. Actual legacy voice/theme migration and scoped reset pass on both native storage implementations. [Android traces/report](evidence/run04/android/README.md), [iOS runtime/storage report](evidence/run04/ios/README.md), [playback capture](evidence/run04/screenshots/ios/audio-playing.png).

These checks exposed and repaired the iOS scalar-Boolean ABI and native Stop readiness/error issues described above. Earlier failed provider/harness/environment attempts remain labelled diagnostics. **All M11 listening, physical interruption, privacy/offline and signed-upgrade results remain unrun.** Provider callbacks and inspected screenshots do not prove audible pronunciation or offline synthesis. P00 migration engineering is complete; P10/M11 still owns integrated candidate acceptance.

## P08 reference and example supplement (Run 11)

M11.3/.5: In the reference, select Digits 0–9 and listen to all ten cards with Default and a selected voice. Compare displayed guide to heard pronunciation, especially `359`. In Letter Quiz, select Digits and complete/review/retry a round. Select Postcode symbols and Hear example `SW1A 1AA`; expect all seven symbols in source order and one word-boundary pause. Select Callsign symbols and Hear example `N359AB`; compare November / TREE / FIFE / NINER / Alfa / Bravo. Stop mid-example and leave through Menu; no subsequent owned audio should continue. These are new manual scenarios, not completed listening checks.

M11.4/.5: Try voice name/locale/quality search, a locale filter, an empty result and Reset voice filters using VoiceOver/TalkBack and physical enlarged text. The saved voice must survive filtering; System Default stays available. Inspect the reference category and numeric question/feedback/results at large text. Record the actual provider/OS/voice and result; do not transfer browser mock results to device acceptance.

## Run 12 M11 supplement: listening and typed recall

All human results remain unrun. [Exact new scenarios](evidence/run12/manual-handoff.md) add real listening Play/replay/Stop, scored text alternatives, physical VoiceOver/TalkBack answer concealment and feedback, typed canonical normalization/blank/input retention/Retry and no-microphone checks. Automated provider input/callback or emulator outcomes do not verify audible correctness or physical accessibility. Run 12 uses existing `speechText` for listening, while typed recall expects canonical words; Three/Five/Nine remain distinct from TREE/FIFE/NINER speech guides. No new provider, permission or saved data is introduced.

## Run 13 progress supplement

All human results remain unperformed. [Run 13 M11 supplement](evidence/run13/manual-handoff.md) adds physical AT/status/Retry, partial-round restart, separate reset/deletion and simple review usability scenarios. All existing listening checks still apply: progress combines modes and counts listening text alternatives; saved aggregate counters are not evidence of audible correctness, comprehension or provider locality. No new speech provider, microphone permission or recognition is introduced.

**Run 37 Android provider check.** Voice Select on the API 36 x86_64 development APK listed 17 English voices. Previewing a local voice dispatched three embedded synthesis requests while preserving System Default. Explicitly choosing that voice survived restart. Use the sequence in M11 for listening and provider acceptance. [Installed checks](evidence/run37/README.md) · [Screenshots](evidence/run37/screenshots/index.md).
