# Checking audio on a device

Playback uses Android TextToSpeech, iOS AVSpeechSynthesizer or browser SpeechSynthesis. A provider can report completion while the device is silent. Listen on each target before accepting changes to pronunciation, voice selection or pacing. Voice availability and network use depend on the installed provider. [Speech adapter](../src/lib/platformSpeech.js) · [Browser adapter](../src/lib/platformSpeech.web.js)

## Pronunciation and playback

Record the build, device and OS or browser, provider, voice and locale, network state and playback speed. Try System Default and a selected English voice. For each failure, record the input, what you heard and the displayed pronunciation.

1. Use Reference to play all 26 letters and 10 digits. Compare syllables and stress with the displayed guides. Pay particular attention to Juliett, Quebec, Papa and Hotel, and to the digit inputs `tree`, `fower`, `fife` and `niner`. Each entry defines its spelling, display guide and speech input separately. [App reference data](../src/data/natoData.js) · [FAA radiotelephony alphabet and numerals](https://www.faa.gov/air_traffic/publications/atpubs/fs_html/chap2_section_3.html) · [ICAO pronunciation reference](https://www.icao.int/sites/default/files/postalhistory/annex_10_aeronautical_telecommunications.htm) · [NATO spelling reference](https://nato.int/en/about-us/nato-history/history-by-theme/symbols-of-nato/nato-phonetic-alphabet)
2. Play `A359 B953` in Word Converter. Check the order, inter-word pause and highlighted token. Repeat at the offered rates and pauses. Stop in the middle of a word and during a pause, then replay. Listen for any words left over from the interrupted sequence.
3. Preview another voice in Voice Select, then use Audio Help’s sound test. Check which voice is heard before and after explicitly selecting it. Remove the selected voice at the system level and check the fallback and recovery in the app.
4. Run a listening quiz question. Check replay, Stop and the text alternative. With a screen reader, confirm the answer stays concealed until the learner requests the text alternative or submits a response.
5. Navigate away, background the app and change the output route during playback. Try offline playback after an online launch. If silent, check media volume, output device and installed voices. On iOS, test both silent-switch positions. Record shell availability and audibility separately.

## On-device recognition

Use a physical Android 12+ device with a local US English recognition model. The recognizer supplies an editable draft. Checking the answer is a separate action. [Spoken answers](APP_GUIDE.md#spoken-answers)

1. Grant microphone permission on first use. Start a new capture, speak a code word, then repeat with a digit in airplane mode. Confirm the returned word appears in the field.
2. Correct a returned word, then submit it. Check that one answer is scored and counted in Learning Progress.
3. Try denial, silence, Stop, an unavailable model, switching screens and backgrounding during capture. Check that typing remains available and a late recognition result cannot overwrite the learner’s correction.
4. Use TalkBack and enlarged text to reach the recorder, its status, the editable word and feedback. Record the device, model, permission and observed result. Use ordinary test words and keep recordings and transcripts out of reports.
