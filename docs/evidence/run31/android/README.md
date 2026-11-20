# Android default renderer qualification

On 20 November 2026 a clean Windows x64 checkout built the ordinary ReactAndroid source renderer and Maven Hermes 0.81.5. The unsigned x86_64 Release APK and AAB passed payload checks. A development-key copy with all 488 unsigned payload entries intact cold-launched on a dedicated Android 16 emulator. The scoped build took 13m41s with 241 tasks executed and six up to date. [Final Gradle log](x86_64-release-short.log) · [Product identities](product-identity.json) · [Installed APK and observer](installed.json)

| Scope | Observation |
| --- | --- |
| Host | Gradle 8.14.3, JDK 17.0.13+11, Node 22.23.0, npm 10.9.4, SDK 36, NDK 27.1.12297006. App CMake 3.22.1 and source CMake 3.30.5. Free space samples were 428.4 GB at inventory and 419.1 GB after build/install with both scratch trees retained. [Toolchain](host.json) · [Resource samples](build-resources.json) |
| Preparation | Locked install added 741 packages and prepared all 13 pinned files. Three guard tests exercised repeatability, version/last-input drift and stale packaged headers. After source compilation all four patched headers matched the Release prefab. The read-only guard passed again after the full build. [Install](short-install.log) · [Regressions](guard-tests-final.log) · [Prefab digests](packaged-prefab-check.json) · [Post-build guard](after-build-prefab.log) |
| Actual selection | Both ordinary Debug and Release runtime classpaths selected the composite project at the checkout's installed ReactAndroid directory. The selected Maven Hermes AARs matched their pinned hashes. An explicit historical Maven override triggered its warning and failed the default verification task as intended. [Both variants](default-renderers.log) · [Negative control](maven-control.log) |
| Packaged contents | APK `91781060`, AAB `ace49ab5`, engineering copy `ce74de34`. The APK/AAB agreed on all 11 x86_64 ELF libraries, the three source fonts and embedded application bundle. The renderer and JSI build IDs matched the build's prefab. The packaged engine matched the Release Hermes AAR. Seven APK entries differed from the older Run28 x86_64 build, including the application bundle and renderer. [Payload comparison](product-identity.json) · [Manifest](product-manifest.log) · [Signatures](engineering-signature.log) |

The first diagnostic printed the correct Debug graph, then failed while formatting a Java file length. The maintained variant tasks independently passed both complete assertions. The first native build in the long temporary checkout failed after 3m55s at Ninja's `mkdir` for a text-layout object path. The longest generated object path was 303 characters. A new short physical checkout at `C:\n3137e8` reduced the maximum to 252 and completed. It reused downloaded upstream archives and compiled fresh native objects. Long Windows checkout paths remain a reproducible build limitation. [Failed diagnostic](selection.log) · [Failed native build](x86_64-release.log) · [Path measurement](path-diagnosis.json) · [Retry input and revision](short-checkout.json) · [Short-path measurement](short-path-layout.json)

The commands below start at the checkout root with the pinned tools on the process PATH.

```powershell
npm ci --no-audit --no-fund
node scripts/prepare-android-source.cjs --check
$env:NATO_BUILD_JOBS = '1'
Set-Location android
.\gradlew.bat :app:verifyDebugRenderer :app:verifyReleaseRenderer --max-workers=1
.\gradlew.bat :app:verifyReleaseRenderer :app:assembleRelease :app:bundleRelease -PreactNativeArchitectures=x86_64 --max-workers=1 --console=plain '-Dorg.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m -XX:ActiveProcessorCount=2'
```

The original unsigned APK/AAB and separate signed copy are preserved under `artifacts/run31/x86_64`. The installed observer was built separately. The disposable AVD started empty with stock 1080×2400 display, density 420, font scale 1.0 and Gboard. Qualification used the previous 720×1600/density-280 reference viewport on this x86_64 Android 16/API 36 image. After observation the two installed packages and guest exports were removed, the empty baseline and settings were verified, and the emulator stopped. [Preservation command](preserve-products.ps1) · [Payload checker](inspect-products.py) · [Original AVD state](device-initial.json) · [Product observation scopes](product-observation.md) · [Fixture image inspection](fixture-inspection.md) · [Restoration](restoration.json) · [Screenshot index](../screenshots/index.md)

This build selects the emulator ABI explicitly. The ordinary all-ABI package, other installed ABI runtimes, wider OS/window coverage and integrated release acceptance remain open. Human listening, physical assistive technology, private signing, distribution and release acceptance stay in M11.
