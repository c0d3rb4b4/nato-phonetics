# Privacy Policy

Last updated: 18 November 2026

NATO Phonetics provides letter/digit reference, text conversion and letter/digit practice without an account. The authored app has no analytics, advertising or application backend. This describes the current implementation, not a legal compliance certification.

## Local data

The app uses AsyncStorage (browser storage on web) for these local records:

| Key | Value | Purpose |
|---|---|---|
| `nato.preferences.v1` | Version 1 record with `themeMode`, nullable `selectedVoice`, optional `converterPacing` (`rate`, `wordPauseMs`) and optional `converterDisplay` (`bubbles`, `cards`) | Restore appearance, voice, converter pace and display |
| `nato.progress.v1` | Version 1 record: canonical symbol → `attempts`, `errors`, `streak` (0–5 consecutive-correct scheduling step), `lastReviewedAt` and `dueAt` (epoch milliseconds); optional browser deletion `generation` marker | Saved per-symbol totals and focused/due practice across modes |

On first use after updating, the app reads the old `darkMode` and `selectedVoice` keys. It removes only those legacy keys after the versioned preference record is saved successfully. A failed migration retains the old data and displays a recovery message.

Each accepted quiz submission updates symbol totals, including Retry Mistakes and listening text alternatives. Progress combines modes; it is not a mastery assessment. The app does not store typed responses, question identities, complete rounds or audio in this record, and provides no account or app cloud sync. OS/browser backups have separate controls.

Progress starts at version 1 with no earlier progress schema to migrate. Browsing without answering does not create the key. Unknown versions, invalid records and failed reads are preserved; writes wait for successful Retry or explicit Clear Progress. Failed writes keep unsaved aggregate events in memory for Retry; closing/reloading loses unsaved events. Summaries show successfully saved totals only. [Scheduling and storage rules](docs/LOCAL_PROGRESS.md) document elapsed intervals, clock changes, selection and failure behavior.

Updated same-origin browser windows coordinate progress mutations and refresh saved summaries. Saving/clearing requires HTTPS (or secure localhost) and browser Web Locks support; when unavailable, practice remains usable and unsaved answers stay in memory with recovery guidance. The app adds no server sync. Refresh all legacy app windows after an update; already loaded older code does not cooperate in the new lock. [Update and rollback instructions](docs/RELEASE_RUNBOOK.md#updates-local-data-and-rollback).

Reference category, voice search/locale filters, selected practice set/mode/review scope, typed drafts, revealed listening text alternatives, converter text, active quiz rounds, submitted response strings and result/missed-answer recaps are held in memory; the app does not intentionally persist them. Starting a new round replaces the previous recap; closing the app process or reloading the page clears rounds/results. No microphone recording or speech recognition is currently implemented.

## Copy and Share

Only when you tap **Copy conversion** does the app write the plain text conversion, including not-spoken markers, to your system clipboard. **Share conversion** passes that same text to the operating system or browser share sheet, where you choose a destination. Unsupported sharing offers Copy or manual selection; denied or cancelled sharing does not silently write to the clipboard. Clipboard history, synced clipboards and receiving applications have their own storage and deletion controls.

Editing the converter text stops playback. Manage earlier copies or shares through your clipboard or the receiving app. The app does not read your clipboard during normal conversion or copying.

## Speech and connectivity

When you request playback, the text to pronounce is passed to the installed speech provider: through react-native-tts and the operating system speech API on native platforms, or browser SpeechSynthesis on web. Voices, processing location and connectivity requirements depend on that provider. Some voices may use network services. The app does not currently enforce on-device speech or verify a provider's retention practices. Check your device/browser speech settings and provider policy before entering sensitive text.

Reference and conversion logic run locally once loaded. After a successful connected setup, the production website caches a verified versioned app shell: route pages, application code, bundled fonts and favicon. Menu shows offline readiness and setup/retry guidance. A first visit needs a connection; browser storage restrictions, eviction or clearing can remove availability. This shell does not guarantee speech connectivity. Audio availability in airplane mode has not been verified across supported devices. Speech synthesis is output; the current app does not request microphone access for it. Audio Help and voice previews follow the same provider behavior. Starting new playback replaces the current sequence; Stop, navigation, backgrounding and converter edits cancel pending words. These controls do not establish what a provider has already processed. Playback failures are shown without logging the entered text.

## Browser shell cache and updates

The production website uses CacheStorage named `nato-shell-v1-<build hash>` for public build resources only. No converter input, typed response, progress, audio or provider request is added to this cache. Progress/preferences remain in their separate local records. Failed downloads or mismatched resources do not replace an active offline copy; Check for web update / Retry offline setup can repair missing resources when connected. Updates wait until every app window closes; the app does not force a reload. Finish/save pending answers and copy drafts before closing. New activation deletes older app-shell caches only. No home-screen installation or persistent-storage permission is requested. [Offline/update rules](docs/WEB_OFFLINE.md).

Clear Progress and Reset Preferences keep the public shell cache. Clearing this site's browser storage removes the shell and local records; OS/browser backups and speech providers remain outside the app's control.

## Deletion and control

Converter pace is saved only after an explicit selection: rate 0.75×/1×/1.25× and word pause 0/300/700 ms. Older version 1 records keep their appearance/voice and use 1×/300 ms without a rewrite. Text, playback position and card page are not stored.

Use **Settings → Reset Preferences** to restore System appearance, System Default voice, phonetic bubbles and the default playback pace (1× speed, 300 ms between words). Reset changes the versioned preference record and removes its two old migration keys. It preserves unrelated local storage and learning progress. A failed write leaves the prior selection in use and displays an error. You can also clear this site's browser storage, clear Android app storage, or delete the iOS app and its data. Those actions remove other installation data too. Device backups and third-party speech providers have their own controls.

Use **Menu → Learning progress → Clear Progress → Delete saved progress** to delete saved symbol totals/review times and pending unsaved answer events. Native removes `nato.progress.v1`. Web atomically replaces its contents with an empty symbol map and a fresh random `generation` marker, preventing an older pending answer in another updated window from restoring deleted totals on Retry. The marker contains no answers or identity information, changes at every deletion and remains in this key with later progress until site storage is cleared. Confirmation is required; Cancel/Keep progress changes nothing. Preferences and unrelated keys are kept. Deletion is serialized with answer writes: the current round/recap remains in memory, earlier answers are never re-imported, and answers submitted after deletion start new progress. Failed deletion keeps data and shows an error. App deletion cannot erase OS/browser backups or copies outside this installation.

## Support and changes

Report issues or privacy questions at the [repository issue tracker](https://github.com/c0d3rb4b4/nato-phonetics/issues). GitHub processes information you submit under its own policies; avoid posting sensitive converter text. This policy will be updated when storage, permissions or provider behavior changes. Provider/offline validation and owner policy acceptance remain in the delivery plan's M11 checks.

If browser storage was unreadable when an answer was submitted, its deletion generation cannot be established. After storage recovers, that answer stays visibly unsaved in memory; the app preserves saved data and explains why it cannot safely retry across a possible deletion. Confirmed Clear Progress discards saved and pending answers, after which new submissions can be saved. It never silently drops uncertain answers or guesses that no deletion occurred.
