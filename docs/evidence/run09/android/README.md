# Run 09 Android verification

17 November 2026. Actual installed app on Android 16/API 36 (`nato-p00-api36`, emulator-5580, 720×1600, density 1.75). [Native artifact](artifact.json) rechecks the installed APK bytes against the unchanged Run 06 APK. [Actual loaded JavaScript](loaded-javascript.json) is separately archived under `artifacts/run09/android/loaded-javascript` via Hermes Debugger.getScriptSource. No new native app/Release build is claimed.

## Functional checkpoint

[checks.json](checks.json) records a passed `converter-native` checkpoint: ordinary keyboard input `a3 b-!`, canonical plain text/omission marker, actual Copy tap followed by an OS clipboard read of exactly `Alfa Three / Bravo dash [not spoken: "!" U+0021]`, actual Android ChooserActivity, Clear cancelling owned playback and clearing input, and Menu/Back retaining `cv34 7ap`. [Driver](converter.py), [executed attempt log](converter.log), [hierarchies](hierarchies/) and [actual captures](../screenshots/index.md).

The larger original driver passed that functional checkpoint before its extra enlarged-text capture branch failed to find text above its current scroll position. **The complete original command did not exit successfully**; do not confuse its functional checkpoint with a whole-driver pass. Enlarged checks then moved to [a separate driver](enlarged.py), which exits 0 in [enlarged.log](enlarged.log), using smaller scroll steps and resetting to the top. The final functional driver now contains only its functional scope; earlier line numbers refer to the earlier combined attempt.

Commands: `NODE_PATH=/Users/mac/.npm/_npx/e5f4bcd55d2c7c9f/node_modules python3 docs/evidence/run09/android/converter.py` (scoped checkpoint before later capture failure) and `… python3 docs/evidence/run09/android/enlarged.py` (exit 0). The Hermes helper observes the actual clipboard/controller and archives loaded source; no React-root replacement, state injection or speech-provider substitution.

## Affected large-text acceptance remains failed

Cold configured 2× [plain text](../screenshots/android/plain-cold-scale2.png) and [Copy/Share](../screenshots/android/controls-cold-scale2.png) are enlarged, readable and reachable in this sample. Live 1×→2× preserves `a3 b!` and enlarges tiles but [existing text and export labels remain at their old size](../screenshots/android/controls-live-scale2.png). Compare [before](../screenshots/android/plain-before-live-scale2.png) and [after](../screenshots/android/plain-live-scale2.png). No new internal clipping is claimed for this sample; failure to respect the new text size is enough to retain P05.2 and affected P06.2 acceptance. No remount, disabled scaling, font/tolerance change or framework repair is shipped. P07.4's historical affected failure remains open.

## Driver attempts and limitations

- [Initial startup](first-start-readiness.log) ran before the loaded app was ready; initial 12-second wait replaced by a 60-second startup allowance.
- [Menu-return attempt](menu-return-attempt.log): the keyboard helper sent Back even when the keyboard was hidden, navigating away. It now checks OS input visibility before sending Back.
- [Case assertion](keyboard-capitalization-attempt.log): native auto-capitalization produced `a3 B-!`; input-retention assertions now compare ASCII case without weakening canonical conversion assertions.
- [Header attempt](header-visibility-attempt.log): a scrolling helper excluded fixed-header bounds. Open menu uses its actual header tap; later success is in checks.json.
- [Enlarged scrolling](enlarged-scroll-step-attempt.log): a large one-way swipe skipped the desired above-viewport target; smaller steps/top reset produce the retained successful captures.

These are nonpassing automation attempts, not product fixes or hidden passes. The app's Copy emits the pinned RN API's deprecation warning; generic Debug warning/clipboard-preview overlays remain visible where captured. No warning suppression. Native Clipboard migration remains an engineering follow-up on framework upgrade/capability failure. Physical TalkBack, receiving-app clipboard/share behavior, listening, provider/offline and signed acceptance remain M11. Font scale was restored to 1 before emulator shutdown. Stable all-letter/window/raster coverage remains historical.
