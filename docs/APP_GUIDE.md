# Reference, converter and practice

Reference opens on launch. Choose **Letters** or **Digits**, tap a tile to hear its code word, or use Play to hear the set. Open Settings from Menu to choose a voice, change appearance or adjust converter playback. Previewing a voice keeps the saved selection. Audio Help includes a sound test.

## Word Converter

Type a phrase such as `AB 39/5`. Copy and Share produce `Alfa Bravo / Three Nine slash Five`. A slash between words in the output represents whitespace. A slash typed in the input becomes the word `slash`.

| Input | Text and playback |
| --- | --- |
| A–Z, a–z and 0–9 | Each symbol becomes its canonical code word. Speech uses the pronunciation input for that entry. |
| Whitespace | Consecutive spaces, tabs or line breaks form one boundary. Playback pauses between words. The plain text omits leading and trailing boundaries. |
| `- . / @ +` | Each becomes its spoken name, respectively dash, dot, slash, at and plus. |
| Other code points | The output identifies each skipped character and its Unicode value, including invisible characters and combining marks. Playback skips these markers. |

Phonetic bubbles and Full cards show up to 24 tokens per page. **Show current card** takes you to the page being spoken. Playing a phrase, copying or sharing uses the entire conversion. If the device cannot copy or share, open **Copy or share** and select the text manually. On iOS, opening Share at maximum text size with the keyboard visible still needs an installed-device check.

Playback starts at the beginning and highlights the current token. A card tap replaces phrase playback. Editing, clearing or leaving the screen stops it. Settings offers 0.75×, 1× and 1.25× speed and pauses of 0, 300 or 700 ms between words. Defaults are 1× and 300 ms, with 120 ms between ordinary tokens. The draft survives switching tabs and clears when the app closes or the page reloads. [Conversion rules](../src/lib/conversion.js)

## Letter Quiz

Select a mode, symbol set, review scope and round length. Choose letters, digits, a mixed set, postcode symbols (`SW1A 1AA`) or callsign symbols (`N359AB`). Example rounds shuffle their distinct symbols. **Hear example** plays the full example in order, including repeated symbols.

| Mode | How to answer |
| --- | --- |
| Choose a code word | Select one of four code words for the symbol on the tile. |
| Listen and choose a symbol | Play the code word and choose the symbol. **Show code word as text** offers the same question visually. |
| Type a code word | Enter the canonical word and check the answer. Spacing, accents, punctuation and case are ignored. Alpha and Juliet are accepted aliases for Alfa and Juliett. For 3, 5 and 9, enter Three, Five and Nine. |
| Speak a code word | On eligible Android devices, record a draft, review or edit it, then check the answer. |

An empty or punctuation-only typed answer leaves the question open. Once submitted, each answer counts once. Use **Next question** to advance, **View results** after the final question, or end the round early for a partial recap. **Retry Mistakes** asks once for each distinct missed symbol. The current round and recap survive tab changes and clear on reload or app exit.

## Spoken answers

**Speak a code word** requires Android 12 or later, a device with an on-device US English recognizer and microphone permission. The first tap on **Start recording** can prompt for permission. After granting it, tap again when ready to speak. **Stop recording** asks the recognizer to finish. Edit the returned word and tap **Check answer**, or submit with the keyboard’s Done action. [Android quiz setup](screenshots/android-quiz.png)

If the local model is missing, permission is denied, or the recognizer returns silence, the same question accepts a typed answer. Editing, leaving the question or backgrounding the app cancels capture. The app requests local recognition and never initiates a model download. Web, iOS and earlier Android versions offer listening, choice and typed practice. A real microphone returning a recognised word into the installed app still needs a physical-device check. [Audio and recognition checks](AUDIO_VALIDATION.md)

## Learning progress

Learning Progress shows saved attempts, errors and review dates per symbol. After a wrong answer, the symbol is due immediately. Consecutive correct answers schedule reviews after **1, 3, 7, 14 and 30 elapsed days**, then every 30 days. The device clock sets the due time. **Due review** selects previously practised symbols whose due time has arrived. **Focus on mistakes** selects symbols whose latest saved answer was wrong. Starting a review fixes the symbol set for that round.

The local `nato.progress.v1` record contains counts, the scheduling step and timestamps. Typed answers, audio, transcripts and round recaps stay out of this record. Failed saves keep the answer in memory for Retry until the app closes. Unsupported or corrupt records remain available for recovery or explicit deletion.

On the web, saving requires HTTPS or secure localhost and Web Locks. Windows on the same origin coordinate saves and deletion. **Clear Progress** removes the native record or writes an empty browser record with a fresh deletion marker. A pending answer from before deletion cannot restore cleared totals. If the browser could not read the marker at submission, Retry explains why it cannot safely save that answer. **Reset Preferences** restores appearance, voice, converter view and pace. Learning progress has its own deletion control. [Storage implementation](../src/lib/progress.js) · [Privacy policy](../PRIVACY.md)
