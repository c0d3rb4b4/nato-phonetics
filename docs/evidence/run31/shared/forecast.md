# Run 31 forecast · 20 November 2026

The initial index and worktree were clean on `develop` at
`9e4d09c26e2b931e6a7d57074a86bf4093e5170a`, 18 commits ahead of its
upstream. No applicable AGENTS.md was found. The merge includes the Run 30
observer, reports and captures. The actual ordinary Gradle settings still made
the repair conditional on a flag. The current host is Windows x64 with about
400 GiB initially free on C:. Previous macOS disk readings describe a
different machine.

| Checkpoint | Effort and risk | Verification and decision |
| --- | --- | --- |
| P05.2 E, default preparation | M. A partial patch, stale exported header, skipped lifecycle or an unguarded shared C++ change could affect native builds. | Use the locked graph in a separate checkout, inspect every reviewed input/output, repeat preparation, reject version/drift, and compare iOS-facing compiler tokens against the locked registry package. |
| Ordinary Gradle and host entry points | M. The SDK/JDK exist, but Windows host wrappers and dependency downloads may behave differently from the prior macOS builds. | Preserve the original failure, verify runner argument handling, and inspect the real default Gradle dependency graph without the historical source switch. |
| Exact default product | M–L, conditional on dependency resolution and cold source compilation. | Serialize builds. Identify the actual framework, Hermes, JS, fonts and ABI before applying the native regression, fixture, composition, state and raster gates. Only new product captures qualify. |

Run 27–30 Debug/Release and ABI evidence remains attached to its original
artifacts. No repeat raster or ABI cycle precedes integration. A concrete
toolchain or transport failure gets a bounded recovery with its actual
diagnostic. Human listening, device/AT, private signing and acceptance stay
in M11. No unrelated P2 was selected.

## Reforecast after install and resolution

Both real runtime configurations selected source ReactAndroid and the expected
Hermes classifiers. All 13 source checks passed. The cost of one cold x86_64
Release APK/AAB was justified because this Windows host has an x86_64 phone
image and none of the preserved ARM64 test APKs. The selected ABI is explicit.
The first full build ran for 3m55s and failed in Ninja after 141 native
commands. Its generated object paths reached 303 characters. The retry in a
fresh short physical checkout regenerated the same 410-object graph, with a
maximum of 252 characters. It reused downloaded upstream archives. No compiled
objects or product data were carried into it. A bounded single-ABI retry
precedes any wider compile. [Path observations](../android/path-diagnosis.json)
and [second clean install](../android/short-checkout.json).

The changed Windows launcher also exposed independent fixture assumptions in
the shared suite. The repair cost was small and the failures prevented the
ordinary Windows checks from running. Exact icon input bytes, archive modes
and actual symlink/junction tests now have separate platform evidence. Linux
passed all 169 tests, Windows passed 168 with one file-symlink fixture denied
by the OS, and the actual Yoga source passed 177 compiled checks.

The next checkpoint after packaging is exact APK/AAB/native/Hermes/JS/font
identification, then a real installed converter and composition sample. A
red widget, input or raster measurement keeps the affected gate open and
selects the smallest discriminating test. A passing sample enables the strict
fixture and original product matrix on that same binary. Wider ABIs and release
acceptance have their own dependencies.

## Reforecast after the x86_64 build and device gates

The short-path build completed in 13m41s. Seven packaged entries differed
from the previous opt-in x86_64 APK. That difference selected the native
consumer, first x86_64 runtime, strict Release fixture and new production
captures. The six native cases and numeric fixture checks passed. Image
inspection then found stale pixels in the fixture primary and production
composition captures. Repeating those specific stages using a system display
read established the changed size and glyphs while leaving the app and
measurement predicates intact. The other ABI and unchanged fixture sweeps
were not repeated to diagnose this observer issue.

The fresh product passed the original tile matrix and seven display-resize
stages. The original fixed-swipe narrow capture overshot the first converter
tile. The saved hierarchy showed later items. One bounded alignment retry
must satisfy the same complete-tile predicate. An independent last editing
capture targets the Gboard prompt that obscured the enlarged fixture input.
The next larger build is the ordinary four-ABI release and a measured ARM64
retest, with the 13m41s single-ABI cycle as a planning observation.

The narrow retry met the same visibility predicate after eight measured gestures and passed 21 native baselines. Six direct-display fixture captures confirmed the edits at 1×. At 2× Gboard still covered the edited glyphs and caret, although all three native edit checks passed. Further keyboard investigation has lower impact than the default four-ABI package. Re-enter when a supported IME configuration leaves the enlarged field visible. The batch ends after restoring the guest, inspecting 83 PNGs and reconciling the ledger. The next M–L build and ARM64 runtime cycle remains eligible. [Narrow gate](../android/narrow-native.log) · [editing result](../android/fixture-edit-display/README.md) · [next P1](../android/next-android.md).
