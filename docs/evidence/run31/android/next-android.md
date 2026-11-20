# P05.2 default product qualification

Run 31 passes the ordinary clean-install guard and real Debug/Release dependency selection. Run the relevant Gradle verification task without a source-mode override. Keep `NATO_BUILD_JOBS=1` for this serialized build. Windows needs JDK 17, SDK 36, NDK 27.1.12297006, SDK CMake 3.30.5 for ReactAndroid and 3.22.1 for the app. Choose a short physical checkout path. [Selected components](default-renderers.log) · [host inventory](host.json).

The x86_64 ordinary Release APK and bundle passed packaging, payload and post-build header checks. Six actual native cases, the strict fixture, production input/composition, original tile contexts and display/window observations now have candidate-specific results. Reuse those results for that exact payload. [Product identity](product-identity.json) · [actual runtime scopes](../README.md).

**Next P1 is the ordinary four-ABI Release artifact and its ARM64 qualification.** The executed command selected x86_64 to match this emulator. From a short clean checkout, keep the setting in `android/gradle.properties` and omit `-PreactNativeArchitectures`. For both unsigned outputs on Windows, use the pinned Node/npm/JDK/SDK environment:

```powershell
npm.cmd ci
$env:NATO_BUILD_JOBS = '1'
Set-Location android
.\gradlew.bat :app:verifyReleaseRenderer :app:assembleRelease :app:bundleRelease --max-workers=1
```

Record the actual four ABI sets, embedded JS, fonts, Maven Hermes, source native libraries and IDs. Compare per-ABI payloads to Run 31 and Run 27–30 **before** repeating expensive runtime matrices. Bind the actual ARM64 install to its own artifact and rerun affected checks where the payload differs. The present AVD reports x86_64 as its CPU ABI and arm64-v8a as a secondary supported ABI. Only x86_64 ran in this batch. Identify translated and native-hardware runs separately. Store new results in a fresh evidence directory. [AVD ABI properties](runtime-abis.json).

The former opt-in ARM64 results and the three other source ABI compile/link results retain their recorded scope. Additional default ABIs, broader OS and actual split-window behavior, full release integration and M11 remain open. A packaging or automation failure stays an engineering task. The private signing and physical acceptance checkpoints are in M11.
