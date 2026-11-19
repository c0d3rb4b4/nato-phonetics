# Run24 human handoff — all results unperformed

19 November 2026. This supplements the integrated M11 queue; it does not turn engineering failures into human prerequisites. Product artifacts remain the identified [Run23 candidate](../run23/candidate.json). No signing, publication, new recognition provider or owner approval is inferred.

| Manual check | Prepared scenario | Result |
|---|---|---|
| M11.4 physical accessibility/layout | On a signed device candidate, use large native text and the keyboard; Paste the non-sensitive [fixture](ios/input.txt), add `j`, reach Copy/Share and scroll inside the plain-text region. Check visible text, focus and VoiceOver/TalkBack, including navigation back to the draft. Simulator/clipboard checks do not prove physical accessibility. | unperformed |
| M11.5 receiving-app clipboard/share | Copy the long conversion and paste it into an actual receiving app; compare with [expected text](ios/expected-copy.txt). Open Share, cancel, then use an available receiving destination and verify the full text. System-sheet opening/cancellation does not prove delivery. Repeat interruption/backgrounding separately. | unperformed |
| M11.6 browser/provider/offline | Use the authorized public HTTPS candidate in branded/mobile browsers: save an answer, finish/copy drafts, close all windows, reopen through update and rollback, then cold-open offline. Verify saved records. Local Caddy/Playwright results do not qualify public hosting, branded Safari/iOS, provider privacy or physical behavior. | unperformed |
| M11.2/.7 restricted access/distribution/release | Existing runner enrollment/host access, private signing and actual publication/release acceptance remain pending. Local workflow edits and unsigned artifacts grant no external publication authority. | unperformed |

Android live text, original iOS gestures/max navigation, strict tile ink, WebKit stale-cache cleanup, the observed browser save failure, recognition implementation and final integrated automated gates remain in their owning P tasks. No new owner input is needed for ordinary local engineering. Record candidate/device/runtime/tester/date, exact result and evidence before changing any M11 status.
