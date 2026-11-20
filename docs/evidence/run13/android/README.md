# Run 13 installed Android verification

Android 16 / API 36 / arm64, emulator-5580, 720×1600 override / 280 dpi, font scale 1 and cold configured/live 2. [Installed Debug APK rehash unchanged from Run 12](artifact.json); [actual final loaded Metro JavaScript](loaded-javascript.json) retrieved through Hermes `Debugger.getScriptSource`, hashed and compressed beside its manifest. No native app/Release rebuild, framework/provider/dependency/font/geometry/tolerance change or speech substitution. Emulator startup log records actual memory adjustment to 2560 MB; native runtime is serialized after iOS shutdown.

[First progress driver](progress.py) / [log](progress.log) supplies qualified checkpoints, then **exits 1** on a read-only inspector subprocess immediately after a force-stop/reroute:

- Five actual digit submissions (0/3/4/7/9), one incorrect 7, produce 4/5. [Observed store snapshots](checks.json) contain only aggregate counters/timestamps, five accepted answers and no pending events. Force-stop/relaunch preserves saved totals/rows.
- Reset Preferences retains the exact progress data; one-symbol due/last-miss review corrects 7, saves answer six and produces zero currently due/last-missed symbols. Keep progress preserves six.
- Cold configured 2× progress summary/rows and reachable deletion controls are captured. Confirmed Delete produces zero saved state and keeps the exact preference snapshot. Counts/data retention are distinct from readability acceptance.
- The following immediate inspector subprocess returns nonzero before the driver waits for rendered readiness. The helper captured nested stderr but did not print it in the outer exception, so the exact failure cause is unestablished. No app crash/framework/storage cause is claimed. The whole command remains failed.

[Separate relaunch driver](relaunch.py) / [passing log](relaunch.log) waits for the real visible zero summary, then reads the store, captures the cleared state after relaunch and a live 1×→2× transition without repeating submissions/deletion. The cleared state remains. **Ordinary live labels stay stale/small in comparison with cold 2×; affected P05.2 readability is not passed.** No remount/scaling suppression or native measurement repair is shipped.

[Support driver](support.py) / [passing log](support.log) reaches and captures new local-progress inventory, separate deletion/backup controls and progress/text-alternative/reset help. [Raw captures, metadata and UIAutomator hierarchies](../screenshots/index.md) use actual adb screencaps. Theme is read from native Appearance at capture time: initially saved Dark, then System resolving Light after reset. Both initial and later images are labelled accordingly.

Commands use `PATH=/tmp/nato-phonetics-toolchain/node_modules/.bin:$PATH python3 -u docs/evidence/run13/android/{progress,relaunch,support}.py`, one at a time. The [driver support](verify_native.py) and [read-only observer](read-runtime.cjs) remain beside the scripts. Default font scale is restored to 1 after live sizing. No release acceptance follows from successful scoped state checks.

Unrun/open: live ordinary-text repair/causal boundary, full enlarged due/focused rounds across every mode/symbol, native forced quota/read/version/deletion failures (shared/browser cover those branches), concurrent browser-process coordination, physical TalkBack/keyboard/listening/provider/offline/backup, Release/other runtime/orientation and integrated P10/M11. No new restricted owner prerequisite. All human scenarios remain [M11, unperformed](../manual-handoff.md).
