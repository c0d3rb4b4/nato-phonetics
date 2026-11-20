# GitHub Releases pipeline · 20 November 2026

The owner chose GitHub Releases as the download location, following the Eclipse Timer development APK and versioned mobile release pattern. The development workflow has one job for building, inspecting and publishing the standalone APK. The production workflow has one owner-approved job for the signed Android APK, AAB and iOS IPA. The old native matrix and its separate download and emulator jobs are retired. Debug and simulator commands are available locally. PRs and manual CI retain the web gates.

## First published APK

| Field | Value |
|---|---|
| Release | [NATO Phonetics Dev v1.0.0](https://github.com/c0d3rb4b4/nato-phonetics/releases/tag/dev-v1.0.0-r44822417574-a1) |
| File | [nato-phonetics-v1.0.0-dev.apk](https://github.com/c0d3rb4b4/nato-phonetics/releases/download/dev-v1.0.0-r44822417574-a1/nato-phonetics-v1.0.0-dev.apk), 47,891,148 bytes |
| Build | [Develop push job](https://github.com/c0d3rb4b4/nato-phonetics/actions/runs/44822417574/job/136586388018) at `c35caa5d498ccd2d785018a6336bea2614737b07` |
| SHA-256 | `12e6030c653ef2e131a4f18ace8255ec81e0ef0332452d87d6b297661247cd8d` |
| Android identity | `com.natophonetics.app.dev`, version `1.0.0-dev`, build 1, stable development signer, four configured ABIs |

The public URL returned the same bytes as GitHub's asset digest and the release notes. SDK reinspection verified the certificate, embedded Hermes bundle and library architectures. GitHub's release tag resolves to the build commit. The successful Actions run uploaded zero workflow artifacts. The exact download installed, cold-launched without Metro, opened its converter link and reinstalled on Android 16 x86_64, 1080 × 2400, light. The Home and converter captures showed the expected visible app content. [Smoke report](release-layout/smoke.json) · [Home](release-layout/home.png) · [Converter](release-layout/converter.png).

## Verification and production handoff

- Workflow lint, Bash syntax and shared checks passed. The scoped host suite passed 12 tests. The clean Windows suite passed 171 tests with one file-symlink fixture skipped, and the dependency audit returned zero findings. A controlled publisher test refused a tag at another commit.
- The first hosted Xcode attempt compiled and launched, then correctly failed its source-integrity check. The diagnostic run found a single CocoaPods ordering change. The normalized Xcode project passed the locked install, simulator build and launch, with the app target's iPhoneOS signing include and Pods settings present. The IPA gate rejected a real simulator bundle in an IPA-shaped ZIP. [Original failure](https://github.com/c0d3rb4b4/nato-phonetics/actions/runs/44822521156/job/136586740584) · [CocoaPods diff](https://github.com/c0d3rb4b4/nato-phonetics/actions/runs/44824794066/job/136594538205) · [Final check](https://github.com/c0d3rb4b4/nato-phonetics/actions/runs/44825411012/job/136596628901).
- Manual web CI passed five of seven jobs. Chromium lifecycle could not find the quiz element, and browser quality timed out waiting for cross-tab progress. The release changes retain both checks. [Web CI](https://github.com/c0d3rb4b4/nato-phonetics/actions/runs/44823442081).
- The GitHub `production-release` environment accepts `main` and requires the repository owner's approval. The next production checkpoint is promotion to `main`, approved signing inputs, and a signed release run. An actual signed build and release remain pending. [Configuration and versioning](../RELEASE_RUNBOOK.md#branch-builds-and-downloads).
