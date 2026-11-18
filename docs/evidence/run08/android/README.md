# Run 08 Android evidence

17 November 2026. The actual installed Android 16/API 36 app (720×1600, density 1.75; `nato-p00-api36`, emulator-5580) completes a five-question round, persistent wrong-answer feedback, Replay, Menu/Back retention, 0/5 results, five-letter Retry and explicit early review. The [driver](sessions.py), [log](sessions.log), [checkpoint](checks.json), retained UI hierarchies and actual [screenshots](../screenshots/index.md) are separate from listening/physical accessibility acceptance.

The unchanged Run 06 native APK is hash-verified against the installed file in [artifact.json](artifact.json). This is a JavaScript-only application change, not a new Android build. [The exact Metro source loaded by Hermes](loaded-javascript.json) is archived under `artifacts/run08/android/loaded-javascript`; no new native, font, dependency or storage-schema change is claimed.

Command: `NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules python3 docs/evidence/run08/android/sessions.py`. It uses only actual app entry/taps, UIAutomator observation, standard Hermes inspection and `adb exec-out screencap -p`; no replaced React root, mocked provider or session state injection.

## Bounded P05.2 checkpoint

[Normal-entry comparison](text-comparison.json): after cold 1× → live 2×, the new setup text remains visually at 1×. The same Activity/process cold-started at configured 2× renders enlarged, readable setup text. Native measured heights differ: heading 35.4286 versus 49.7143 dp, two/three-line instruction 48 versus 108 dp, Start label 21.7143 versus 37.7142 dp. Actual screenshots retain the discrepancy. This app case removes the previous diagnostic root-replacement variable and confirms live-size invalidation as a real user consequence. It does not locate the first failing framework boundary or establish a repair.

Cold 2× setup is readable in this sample; that is not evidence that every quiz heading/feedback/result/control is readable at cold 2×. Run 07's captured enlarged ordinary-control failures remain valid, and P05.2 remains P1/open. Stop this bounded investigation after the comparison: a framework build remains L/high uncertainty, whereas converter completion is eligible independently. Re-enter with a normal-entry native measurement regression and instrument the configuration → paragraph measurement → Yoga/mounted-frame boundaries in the [Run 07 handoff](../../run07/android/next-investigation.md); do not ship remounts or suppressed text scaling.

The emulator was restored to font scale 1 before shutdown. Physical TalkBack, provider pronunciation/listening, offline, signing and release acceptance remain M11. Stable full tile/window/raster coverage remains historical in Run 07; this batch does not repeat or claim it anew.

## Changed-flow enlarged check

The [focused follow-on](enlarged-session.py) [passes state/reachability assertions](enlarged-session.log) and retains five additional inspected captures. A submitted answer survives live 1×→2× and early review reports one answer of five. **Readability fails:** the retained feedback text is internally clipped and choice/Next/Replay/End labels remain at the old size ([actual controls](../screenshots/android/submitted-live-scale2-controls.png)). The newly opened [review](../screenshots/android/results-live-scale2.png) uses enlarged readable text. A separate cold 2× round has readable question/choices, [feedback controls](../screenshots/android/feedback-cold-scale2-controls.png) and [partial recap](../screenshots/android/results-cold-scale2.png) in this sample. This difference supports the live-invalidation reproduction, not a cache-cause claim or a shipped remount repair. It does not certify a full completed/retry recap at every size.

The first follow-on launch ran before Android completed boot and could not resolve the Activity; [that driver/environment attempt](enlarged-start-before-boot.log) is excluded from app assertions. The successful run began after `sys.boot_completed=1`. Runtime was restored to scale 1 and shut down. P05.2 and the affected P07.4 accessibility acceptance remain open; engineering remains independent of M11.
