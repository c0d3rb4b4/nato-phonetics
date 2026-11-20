# Architecture observed in the running Android app

The instrumentation read its own file mappings after the converter mounted.
Although PackageManager selected arm64-v8a and PID 9290 reported a native
library directory ending in `lib/arm64`, eight executable mappings in the
unchanged universal APK correspond to x86_64 entries. These include React
Native, JSI and Hermes. The test launched with explicit `am instrument --abi
arm64-v8a`. All five native input/composition stages succeeded in that process.
The ARM64 application qualification failed. The three earlier screenshots of
ordinary converter startup have the selected package ABI and no independent
same-process mapping. [Actual ELF segments](arm64-composition/actual-projection.json) ·
[selection, signer and product](arm64-install/checkpoint.json) · [converter observations](arm64-product/measurements/checks.json).

The original host collector lost its connection to the local ADB server
while pulling the fourth PNG. The device had already completed the five
checkpoints. A read-only retry verified the original device report, PID,
installed APK SHA-256 and all five remote PNG hashes, including byte identity
of the three files already collected. Recovering the pictures exposed the
architecture mismatch. Both the first host collection and requested ARM64
check remain failed. The recovered captures correspond to the same
instrumentation, without another round of input. [Original interruption](arm64-composition/composition.log) ·
[recovered display evidence](../screenshots/android/arm64-composition-recovery/report.json) ·
[failed ARM mapping check](arm64-composition/recovery.log).

The installed SoLoader 0.12.1 implementation constructs a direct APK library
search path using the first ABI returned by `SysUtil.getSupportedAbis()`.
The guest advertises x86_64 first. This provides a testable explanation for
the differing logical selection and observed code. The actual ELF mappings
establish which code ran. The fresh x86_64 package selection on the same
universal APK agrees with the measured renderer, JSI and Hermes entries in
the production tile observer. [Process-specific x86_64 proof](x64-matrix/tile-process-abi.json).
[Pinned SoLoader bytecode excerpt](soloader-abi-source.json).

An attempt to run the exact universal package on an ARM64 **guest OS** used a
Google AOSP API 36 system image. Its 810,736,863-byte download matched Google's
published SHA-1. The Windows Android Emulator 36.4.9 launcher rejected an
ARM64 AVD on this AMD64 host, including with acceleration off. The launcher
exited with status 1 before boot. A compatible ARM host remains relevant to
the literal universal-on-ARM qualification. [Image identity](arm64-aosp-image.json) ·
[launch arguments](arm64-aosp-start.json) · [host limitation](arm64-aosp-start.stdout.log).

A second packaging experiment used Google's bundletool 1.18.1 and the
original ordinary AAB. A device specification copied from the API 36 guest
was narrowed to arm64-v8a. The generated base, ARM64, English and density APKs
have the repository's public engineering signer. The eleven native entries
and all embedded DEX, product JS and font entries match their AAB payloads.
The first invocation reached the system's Java 8 and failed on a compiled
Java 11 class. The normal pinned JDK 17 produced the set. This package set has
its own artifact identity and runtime evidence. [Targeted payloads](arm64-targeted-identity.json) ·
[tool identity](arm64-bundletool.json) · [device specification](arm64-only-device-spec.json) ·
[Android bundletool documentation](https://developer.android.com/tools/bundletool).

All four targeted APKs installed with their verified hashes and ARM64
PackageManager selection. One ordinary, non-instrumented converter launch
returned Android's initial `Status: ok`, then the app process exited. Five
hierarchies continued to show the launcher. The original PID 24559 crash
record identifies `SoLoaderDSONotFoundError` for `libreactnative.so`.
The library exists in the ARM64 split. SoLoader searched
`split_config.arm64_v8a.apk!/lib/x86_64` on this translated guest.
Android recorded an application exception. The collector initially missed
the padded timestamps in the crash buffer. A read-only extraction recovered
the original stack from the same timed launch. The converter screenshot,
composition and strict fixture on this targeted installation remain missing.
[Installed package and launch](arm64-targeted-startup/result.json) ·
[original exception](arm64-targeted-startup/crash-recovered.log) ·
[process exit](arm64-targeted-startup/latest-exit.log) ·
[diagnostic launcher frame](../screenshots/android/arm64-targeted-startup/ordinary-startup.png).

The failure blocks ARM64 application qualification on this x86_64 bridge.
Re-enter on an ARM-native engineering runner with the preserved universal APK
or on a representative device that reports ARM64 first. An ordinary native
ARM startup failure would promote product-loader remediation. The local
ARM64 executable harness and x86_64 application evidence keep their measured
scopes.

## Verified x86_64 product and fixture

The universal product was reinstalled with an explicit x86_64 selection on
the API 36 x86_64 guest. All 15 original production context groups passed
505 native baselines and 232 complete-tile ink observations. The seven
display-size stages passed 93 additional baselines. The populated converter
and submitted quiz retained their state and Next advanced once. Eight
measured scroll gestures brought the complete enlarged November tile into the
560×1000 viewport, passing 21 further baselines. The observed PIDs loaded the
x86_64 renderer, JSI and Hermes from the signed universal APK. The ink
checker loaded sharp 0.35.5 / libvips 8.18.7 from the clean release checkout.
[Matrix](x64-matrix/native-gate.log) · [ink](x64-matrix/ink-gate.log) ·
[window state](x64-windows/measurements/checks.json) · [narrow](x64-narrow-aligned/native-gate.log) ·
[compiler and decoder environment](runtime-host-tools.json).

The matched Release fixture changed only the diagnostic JS and retained all
520 other unsigned payload entries. Its full run passed 60 primary/sweep
frame and widget comparisons, 12 resize comparisons and 3 committed edits.
The narrow run passed the 12 primary comparisons at the smaller initial
viewport. All six editing captures matched their own candidate's cold-scale
paragraph pixels. The enlarged Gboard banner still covers the field in the
full-run editing frame. The real production converter's test IME separately
passed all five composing, focus, selection, continuation and commit stages
with the x86_64 renderer identified in its measured process. [Fixture identity](runtime-fixture-identity.json) ·
[full comparisons](x64-fixture-full/measurements/gate.json) · [narrow comparisons](x64-fixture-narrow/measurements/gate.json) ·
[independent editing visual check](x64-fixture-full/cold-visual-check.json) ·
[production composition](../screenshots/android/x64-composition/identity.json).

Twelve recorded production and fixture PIDs passed a stricter replay that
requires an executable ELF segment in the process maps. A read-only check on
the guest verified 27 original PNGs against the remote SHA-256, complete PNG
structure and the recorded same-PID report. Later narrow fixture samples had
already replaced the six full primary/cold2 exports in Android's diagnostic
directory. The local full-run originals retain their collection evidence.
[Executable mapping replay](runtime-executable-recheck.json) · [device PNG verification](runtime-device-png-recheck.json).

After the targeted split failed, the signed universal product and final
observer `92191db2…` were installed on the x86_64 path. A fresh five-stage
production composition run exercised the final host transfer checks and
Java restoration. The PID's executable mappings, page size and complete
display captures passed. The guest returned to its initially empty package
list, 1080×2400, density 420, Gboard and scale 1.0. Its shell fixture directory
was empty at shutdown. The emulator log's original hash is retained alongside
the transport-independent startup record. [Final composition](x64-final-composition/checkpoint.json) ·
[process proof](../screenshots/android/x64-final-composition/runtime-abi.json) ·
[restoration](runtime-restoration.json).
