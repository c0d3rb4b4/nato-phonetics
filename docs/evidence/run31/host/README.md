# Ordinary Windows build entry points

The shared Android build previously stopped before Gradle on Windows. Node
24.15.0 returned `EINVAL` when spawning either batch launcher directly. Seven
of eight existing host tests also stopped in fixture setup when spawning
`npm`. [Launcher observations](windows-launch-before.log) and
[original test output](host-tests-before.log).

The native entry point now invokes the tracked Windows Gradle wrapper through
`cmd.exe /d /c` with a fixed variant and validated worker count. Each ordinary
Debug or Release build runs the variant's renderer verification task first in
the same Gradle invocation. The task checks the selected ReactAndroid project
and source directory on the app runtime classpath, Maven Hermes 0.81.5 and the
SHA-256 of the selected Debug or Release AAR. An explicit source-mode override
fails ordinary qualification. The Maven control remains available through a
direct diagnostic Gradle invocation. [Gradle verification](../../../../android/app/verify-renderer.gradle)
and [Maven Central checksums](maven-hermes-checksums.json).

Both real verification tasks passed on the clean Windows checkout. A separate
Debug invocation with the historical Maven override failed as required before
producing any product. [Actual component and digest results](../android/default-renderers.log)
and [negative control](../android/maven-control.log).

The host runner selects the Windows npm batch launcher through the command
processor. On pinned Node 22.23.0 and npm 10.9.4 all nine host tests pass,
including an actual locked fixture install, preserved child failures and both
ordinary Gradle task lists. The wrapper fixture checks arguments, working
directory and exact child exit in a checkout path with spaces. Focused ESLint
also exited zero. [Final test output](pinned-host-tests-final.log) and
[input identities](source.json).

Local Windows Android Release preflight passed with JDK 17 and NDK
27.1.12297006. This was an intermediate source snapshot. Its report records
zero executed build steps and zero products. The workflow continues to call
the shared host runner with one build worker and a locked install, without an
explicit renderer selection. Remote execution and artifact retrieval remain
open. [Preflight report](release-preflight.json) and
[workflow](../../../../.github/workflows/native-builds.yml).

These launcher and classpath checks have no standalone application screen.
The exact default Android product has its own runtime and screenshot gates.

## Windows test observer and fixture tools

The original observer builder compiled the Java sources, then failed to find
D8 on Windows. It now calls the SDK 36.0.0 D8 and APK signer JARs through the
selected JDK 17 on Windows, and locates native SDK executables by platform.
The rebuilt observer APK has SHA-256
`c7ae1041adf4a3695c9945099491d58c9661d846c0f726ec7d2a4003bd1f37a9`.
The SDK verified its v2 and v3 signatures. [Original failure](instrumentation-before.log),
[build commands](instrumentation-build.json) and [signature check](instrumentation-signature.log).

The separate Release fixture builder selects the bundled host Hermes compiler.
The native consumer selects the platform's NDK tools and honors
`GRADLE_USER_HOME` when locating fbjni. Windows Hermes reports bytecode
version 96 and the NDK compiler reports clang 18.0.2. The observer build and
host-tool inventory alone do not establish any application runtime result.

The Release fixture's first Metro invocation in the main workspace could not
load the RN CLI. Selecting the actual locked product checkout through
`--project-root` built fixture `ac14df7d…` from unsigned product
`91781060…`. The sole changed payload was the embedded diagnostic JavaScript
bundle. All 487 other non-signature entries, including every font, DEX file,
library, manifest and service metadata entry, matched. The SDK signature and
16 KiB alignment verifications passed. [Initial CLI failure](fixture-build.log),
[complete build log](fixture-build-clean.log.gz) and [entry-by-entry manifest](fixture-identity.json).

The x86_64 native consumer compiled and linked against the exact short-checkout
Release prefab. The harness checked the ELF architecture, Release ABI and
exported headers. Its executable SHA-256 starts with `c66cf7b0`.
All 11 runtime libraries were extracted from the unsigned product.
[Compiler inputs and result](native-compile.json) and [APK library identities](native-runtime-libraries.json).

On the Android 16 x86_64 emulator the executable passed all six renderer
cases with these exact 11 library hashes. The owned test binary and libraries
were removed from the device after the run.
[Runtime output](../android/native/native-result.json) and [checked result](../android/native/checks.json).

On the same candidate the separate Release fixture passed 60 primary/sweep
frame and widget comparisons, 12 resize comparisons, three edit/focus/caret
checks and 12 further comparisons at a narrow width. The sample collector
saved 22 full-size and six narrow screenshots. The full-size live2 screenshot
was identical to cold1 despite the changed native measurements. The large-text
editing screenshot also has a Gboard prompt over the editable field. Both
limits are retained. The ordinary product, window, font scale and IME were
verified after restoring the product.
[Full gate](../android/fixture/full/gate.json), [narrow gate](../android/fixture/narrow/gate.json)
and [run and restoration record](../android/fixture/summary.json).

The bounded primary/cold2 repeat used an independent system display capture
at the same stages. The live2 image visibly shows the enlarged heading,
paragraph, feedback, editable `NUWJ359` and nested text. Its SHA-256 matches
cold2 exactly. The return1 image matches cold1 exactly. The narrow shot shows
the enlarged input and partially visible nested text below it. The unchanged
primary measurement gate also passed. The exact product and original
tile observer were restored for the next product checks.
[Image comparison](../android/fixture-display/primary/display-comparison.json),
[corrected live2](../android/fixture-display/primary/screenshots/live2.png),
[numeric gate](../android/fixture-display/primary/gate.json) and
[installed identities](../android/fixture-display/observer-restoration.json).
