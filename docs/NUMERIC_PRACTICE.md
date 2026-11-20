# Letter and digit practice

The reference uses the existing canonical 26 letters and ten digits, the shared portrait tile and the owned audio controller. Letters A–Z / Digits 0–9 switches the list and stops current playback. Cards show canonical words and the existing pronunciation guide; speech uses each entry's separate `speechText`. No pronunciation table or font/design metric was changed.

Letter Quiz offers these symbol sets:

| Set | Coverage cycle | Example playback |
|---|---|---|
| Letters | 26 letters | — |
| Digits | Ten digits | — |
| Letters and digits | All 36 symbols | — |
| Postcode symbols | S, W, 1, A | `SW1A 1AA`: Sierra Whiskey One Alfa / One Alfa Alfa |
| Callsign symbols | N, 3, 5, 9, A, B | `N359AB`: November Three Five Nine Alfa Bravo |

Examples are symbol recognition drills, not whole-string transcription: questions shuffle the distinct symbols, while Hear example preserves the complete original order and repetitions. A postcode space uses the converter's default word-boundary pause. Canonical text/export is distinct from spoken inputs: Three, Five, Nine use `tree`, `fife`, `niner`. Provider callbacks and automated input checks do not establish audible correctness; M11.3 remains required.

Each set offers 5, 10 and one full coverage-cycle length, deduplicated and sorted. The existing session engine validates canonical letters/digits, shuffles each coverage cycle and avoids an immediate cycle-boundary repeat when possible. Digit distractors come from the other canonical digits; letter distractors retain the existing normalized/deduplicated pools. Each choice-mode question has four distinct options and exactly one correct answer.

Submission, explicit Next/Replay, score, missed recap, early review and Retry Mistakes keep the existing guarded immutable transitions. Retry includes one question per distinct missed symbol, including digits. Start new round applies the selected set and replaces the recap; changing setup choices alone keeps it. Menu/Back retains a round and releases audio. Closing the process/reloading clears rounds, set/category choices and filters; this adds no persistent progress or preferences.

Voice browsing adds case/accent-insensitive name/locale-code/quality search intersected with an exact normalized locale filter. It preserves provider order, keeps System Default/preview outside the filtered list and checks removed saved voices against the complete provider list. No match is explicit. Reset voice filters restores all English voices without changing the saved voice; Retry refreshes locales and returns to All if the chosen locale disappears. Changing filters stops a preview. Search/filter choices stay in memory.

Run 11 evidence is linked from the delivery plan. Changed-flow automated/native evidence is scoped; Android live enlarged ordinary text remains P05.2, and physical listening/AT/usability remains M11. Run 12 adds P08.2 listening/typed recall below. The no-new-storage descriptions in Runs 11–12 are historical; Run 13 adds the separate aggregate progress record described below.

## Listening and typed recall (Run 12)

Each symbol set now offers three answer modes. Choose a code word preserves the original four-word question. Listen and choose a symbol offers Play code word (also replay), four distinct letter or digit choices, and Show code word as text. Before submission there is no answer tile or pronunciation guide in the rendered or accessibility tree. The text alternative reveals the code word, leaving the symbol response to the learner; using it counts toward the same practice score. An audio failure offers Audio Help and leaves Play/text response usable. Playback is explicit, so entering a question does not unexpectedly speak.

Type a code word shows a concealed symbol tile and accepts up to 80 characters. Normalization uses the existing answer-equivalence function: Unicode NFKD, remove combining marks, lowercase, remove everything except ASCII letters/digits, then map Alpha→Alfa and Juliet→Juliett. Thus `ÁL-PHA!`, `ju liet`, and `x ray` are accepted for A/J/X. Blank or punctuation-only input does not consume the question and displays an error. Otherwise a nonmatching response is an incorrect attempt. Canonical Three/Five/Nine are expected; speech guides Tree/Fife/Niner are not alternate typed answers. The actual response is retained in feedback/recap. The input requests autocorrection, spell-check and autocomplete off. Keyboard apps control their own suggestion UI; the actual Android keyboard still shows a suggestion strip. The app supplies no typed answer options.

All modes use the same coverage, explicit feedback/Next, score, early review and unique-mistake Retry engine. Listening distractors are three other canonical symbols of the answer's letter/digit category, including for small example sets. Typed mode has no suggested options. Duplicate/stale submissions are rejected. Retry preserves mode; Start new round applies setup mode/set/length. Menu/Back retains an unsubmitted typed draft and stops owned audio. New questions clear drafts/errors/text alternatives. Mode, draft and text-alternative state are memory-only; no progress storage, microphone, permission, provider or dependency is added. Physical listening/AT/usability remains M11; native acceptance remains scoped by the run evidence and inherited P05.2 failures.

## Local progress and review — Run 13

Every guarded accepted answer now updates per-symbol aggregate progress in `nato.progress.v1`, across all sets/modes, partial rounds, text alternatives and Retry Mistakes. Typed response strings, mode/set/scope, active rounds and recaps remain memory-only. A wrong answer is immediately due and eligible for Focus; subsequent correct answers remove last-miss Focus status and schedule 1/3/7/14/30 elapsed-day review. The shared engine shuffles the selected due/focus symbols, with review length capped at available unique symbols. Empty review lists explain the Full symbol set fallback. Menu/Settings expose summary and confirmed Clear Progress; Reset Preferences keeps it. See [complete rules/schema/recovery/date/deletion behavior](LOCAL_PROGRESS.md) and [privacy](../PRIVACY.md). Human content/listening/learning/AT/privacy acceptance remains M11.
