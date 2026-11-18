# Privacy Policy

Last updated: 18 November 2026

NATO Phonetics provides letter/digit reference, text conversion and letter/digit practice without an account. The authored app has no analytics, advertising or application backend. This describes the current implementation, not a legal compliance certification.

## Local data

The app uses AsyncStorage (browser storage on web) for these local records:

| Key | Value | Purpose |
|---|---|---|
| `nato.preferences.v1` | Version 1 record: `themeMode` (`system`, `light`, `dark`) nullable `selectedVoice` identifier and optional `converterPacing` (`rate`, `wordPauseMs`) | Restore appearance, voice and deliberately selected converter pace |
| `nato.progress.v1` | Version 1 record: canonical symbol → `attempts`, `errors`, `streak` (0–5 consecutive-correct scheduling step), `lastReviewedAt` and `dueAt` (epoch milliseconds) | Saved per-symbol totals and focused/due practice across modes |

On first use after updating, the app reads the old `darkMode` and `selectedVoice` keys. It removes only those legacy keys after the versioned preference record is saved successfully. A failed migration retains the old data and displays a recovery message.

Each accepted quiz submission updates symbol totals, including Retry Mistakes and listening text alternatives. Progress combines modes; it is not a mastery assessment. The app does not store typed responses, question identities, complete rounds or audio in this record, and provides no account or app cloud sync. OS/browser backups have separate controls.

Progress starts at version 1 with no earlier progress schema to migrate. Browsing without answering does not create the key. Unknown versions, invalid records and failed reads are preserved; writes wait for successful Retry or explicit Clear Progress. Failed writes keep unsaved aggregate events in memory for Retry; closing/reloading loses unsaved events. Summaries show successfully saved totals only. [Scheduling and storage rules](docs/LOCAL_PROGRESS.md) document elapsed intervals, clock changes, selection and failure behavior.

Reference category, voice search/locale filters, selected practice set/mode/review scope, typed drafts, revealed listening text alternatives, converter text, active quiz rounds, submitted response strings and result/missed-answer recaps are held in memory; the app does not intentionally persist them. Starting a new round replaces the previous recap; closing the app process or reloading the page clears rounds/results. No microphone recording or speech recognition is currently implemented.

## Copy and Share

Only when you tap **Copy conversion** does the app write the plain text conversion, including not-spoken markers, to your system clipboard. **Share conversion** passes that same text to the operating system or browser share sheet, where you choose a destination. Unsupported sharing offers Copy or manual selection; denied or cancelled sharing does not silently write to the clipboard. Clipboard history, synced clipboards and receiving applications have their own storage and deletion controls.

**Clear input** removes the converter text/output and stops its playback. It does not erase an earlier clipboard copy or content already shared with another app. The app does not read your clipboard during normal conversion or copying.

## Speech and connectivity

When you request playback, the text to pronounce is passed to the installed speech provider: through react-native-tts and the operating system speech API on native platforms, or browser SpeechSynthesis on web. Voices, processing location and connectivity requirements depend on that provider. Some voices may use network services. The app does not currently enforce on-device speech or verify a provider's retention practices. Check your device/browser speech settings and provider policy before entering sensitive text.

Reference and conversion logic run locally once loaded. Web installation and offline caching have not yet been implemented, so an offline cold launch on web is not guaranteed. Audio availability in airplane mode has not been verified across supported devices. Speech synthesis is output; the current app does not request microphone access for it. Audio Help and voice previews follow the same provider behavior. Starting new playback replaces the current sequence; Stop, navigation, backgrounding and converter edits cancel pending words. These controls do not establish what a provider has already processed. Playback failures are shown without logging the entered text.

## Deletion and control

Converter pace is saved only after an explicit selection: rate 0.75×/1×/1.25× and word pause 0/300/700 ms. Older version 1 records keep their appearance/voice and use 1×/300 ms without a rewrite. Text, playback position and card page are not stored.

Use **Settings → Reset Preferences** to save System appearance, System Default voice and default converter pace (1×/300 ms). Reset changes only the versioned preference record and removes its two old migration keys; it does not clear unrelated local storage or learning progress. A failed write leaves the prior selection in use and displays an error. You can also clear this site's browser storage, clear Android app storage, or delete the iOS app and its data; these broader OS/browser actions remove other installation data too. Device backups and third-party speech providers have their own controls.

Use **Menu → Learning progress → Clear Progress → Delete saved progress** to remove only `nato.progress.v1` and pending unsaved answer events. Confirmation is required; Cancel/Keep progress changes nothing. Preferences and unrelated keys are kept. Deletion is serialized with answer writes: the current round/recap remains in memory, earlier answers are never re-imported, and answers submitted after deletion start new progress. Failed deletion keeps data and shows an error. App deletion cannot erase OS/browser backups or copies outside this installation.

## Support and changes

Report issues or privacy questions at the [repository issue tracker](https://github.com/c0d3rb4b4/nato-phonetics/issues). GitHub processes information you submit under its own policies; avoid posting sensitive converter text. This policy will be updated when storage, permissions or provider behavior changes. Provider/offline validation and owner policy acceptance remain in the delivery plan's M11 checks.
