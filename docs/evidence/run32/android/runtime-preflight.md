# API 36 runtime qualification

The Windows host initially had no connected Android device. A new empty API 36 phone
uses the x86_64 Play image, with arm64-v8a as its secondary ABI and
`libndk_translation.so` as the native bridge. The original display is 1080×2400
at density 420, font scale 1.0 and Gboard. The established 720×1600/density-280
viewport gives comparable Android fixture and production measurements.
[Emulator](runtime-emulator.json) · [initial settings](runtime-initial.json).

The first checkpoint tests whether a specific ABI can be selected and identified
from an installed universal package. The historical Run 31 x86_64-only product
rejected an ARM64 install with `INSTALL_FAILED_NO_MATCHING_ABIS`. Its x86_64
installation then provided a positive control for the new process observer.
Android mapped the renderer, Hermes and JSI from the measured offsets of all
three x86_64 ELF entries in the exact installed APK. Seven controls rejected a
wrong package ABI, installed digest, path, PID, missing Hermes mapping and
absent or ambiguous package ABI. This observation belongs to the historical
product. The universal binary receives its own measurements.
[Rejected install](runtime-wrong-abi-install.json) · [positive observation](runtime-calibration/qualified.json) · [controls](runtime-calibration/controls.json).

An initial PowerShell calibration command stopped at a parser error before
execution. The first calibration install timed out at 35 seconds. A streamed
install succeeded. The first mapping read attempted to parse an absent file
when `adb exec-out` returned without a failing host exit status. A bounded poll
of the file in the selected guest then observed the mounted React Native views.
[Initial attempts](runtime-calibration/attempt.json) · [first instrumentation](runtime-calibration/identity.json) · [successful observation](runtime-calibration/candidate.json).

The six-stage editing calibration exercised the updated ABI-selecting fixture
collector on the unchanged Run 31 fixture. Native checks succeeded, but the
2× screenshot still displayed the 1× paragraph and field. Only 87 pixels in the
navigation area changed from the preceding 1× image. The files had different
SHA-256 digests. That 2× capture fails visual qualification.
[Frame comparison](runtime-calibration-edit/visual-comparison.json) · [original captures](runtime-calibration-edit/measurements/captures.json).

The test-only observer now compares actual dark pixels in the static paragraph
against the final glyph cell of every visible line in Android's mounted
`Layout`. It captures the system display for up to five seconds and returns a
failure with the final actual image if the display does not settle. The
accepted PNG comes directly from the system display. The existing font and
native geometry gates retain their original tolerances. The next control passed
all six stages with the new observer. The 2× frame shows the enlarged paragraph
and `NUWQJ359` with the keyboard out of view. Native focus and selection
remained present. The exact previous x86_64 product, Gboard and scale were
restored. The keyboard-visible enlarged-field appearance remains a separate
case.
[Observer build](runtime-calibration-edit2/build.json) · [measurements](runtime-calibration-edit2/measurements/samples.json) · [actual images](runtime-calibration-edit2/measurements/captures.json) · [product restoration](runtime-calibration-edit2/restoration.json).

The next M checkpoint depends on the unfiltered Release payload comparison.
For each selected scope, the [driver](qualify-runtime.py) verifies the locally
test-signed APK and observer and checks the installed SHA-256 and primary ABI.
For an ABI-specific fixture reinstall, it explicitly selects the ABI each time
and restores the exact product with that ABI. The composition, fixture and tile
instrumentation report their own process IDs. The host checks renderer, Hermes
and JSI mappings against the packaged ELF entries for the selected ABI. Reuse
an unchanged x86_64 payload within the Run 31 checks and identify translated
ARM64 observations separately from native hardware and wider platform support.
