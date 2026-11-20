# Run 08 M11 preparation — no human results recorded

Candidate: [source identity](source-identity.json), [Android APK plus actual JS](android/artifact.json), [iOS Debug native artifact plus actual JS](ios/artifact.json), [production-web report](web/README.md), [all actual captures](screenshots/index.md). These are local Debug/simulator/production-browser engineering candidates; signed integrated distribution remains P10/M11.2/.7.

M11.4/.5 session script, prepared for the integrated physical-device candidate:

1. Open Letter Quiz, select 5 questions, Start round. Before choosing, check VoiceOver/TalkBack reads the letter and four unique choices without revealing the code word or pronunciation. Confirm reachability, focus and text at the device's normal and enlarged settings; Android live-size invalidation is an existing engineering failure, not a manual prerequisite/fix request.
2. Answer one correctly and one incorrectly. Feedback stays visible until Next; Replay speaks the canonical answer with the selected/default voice. Rapid answer/Next taps must not score or advance twice. Navigate to Menu and Back, background and return; no old audio resumes and the same round/feedback remains.
3. Complete the round and explicitly choose View results. Check answered count, accuracy, expected/missed answers and the selected wrong choices. Retry Mistakes asks once per missed letter; a perfect round has no empty Retry action.
4. Choose a new round. The old recap remains until Start new round. Verify 10 and 26-question choices; the full round should cover 26 letters once. End round and review shows only submitted answers with a truthful partial count.
5. Reload/close the process and confirm a new setup: this release does not save rounds/results or progress. The UI, README and privacy inventory state that limit. Scope-scoped preference reset remains unrelated to learning state.

Leave actual results, device/OS/voice, candidate identity, failures and retest links in M11.4/.5 on the integrated pass. Listening/content/privacy/provider/offline, physical accessibility, interruption, signed install/upgrade and final release decisions remain unperformed in M11.3–.7. No owner input blocks the remaining independent engineering. Converter Copy/Share and persistent progress are not implemented by this batch and need their own later preparation.
