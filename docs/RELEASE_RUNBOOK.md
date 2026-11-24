# Mobile releases

Download builds from [GitHub Releases](https://github.com/c0d3rb4b4/nato-phonetics/releases). Each release includes its source commit, workflow run and SHA-256 checksum for each asset.

| Build | Trigger | Download |
| --- | --- | --- |
| Develop | Product changes pushed to `develop`, or manual dispatch on that branch | Standalone `nato-phonetics-v<VERSION>-dev.apk` on a prerelease |
| Production | Manual dispatch on `main` using the `production-release` environment | Signed APK, AAB and App Store Connect IPA together under the `v<VERSION>` tag |

The development APK uses the repository’s public development certificate and package ID `com.natophonetics.app.dev`. Install a newer development build with `adb install -r <apk>` to keep its data. Production uses `com.natophonetics.app` and its own signing identity. [Develop workflow](../.github/workflows/develop-apk-release.yml) · [Production workflow](../.github/workflows/mobile-release.yml)

## Prepare a candidate

1. Keep the display version aligned in `package.json`, its lockfile, `app.json`, Android `versionName` and iOS `MARKETING_VERSION`. Set Android `versionCode` and iOS `CURRENT_PROJECT_VERSION` for the distribution channel. Preserve the production application ID and signing identity for upgrades.
2. Run the pull request checks, including the compiled Yoga regression, dependency review, production browser flows and offline transitions. Use `npm run build:host -- <mode> --install --output artifacts/<new-directory>` to keep build logs, source identity and product hashes together. [CI workflow](../.github/workflows/ci.yml) · [Dependency review](SECURITY_REVIEW.md)
3. Check the release artifacts on the target devices. Exercise an upgrade with saved preferences and learning progress, deep links, playback and accessibility at large text sizes. Record the device, OS, provider, build identity and result. [Native builds](NATIVE_BUILDS.md) · [Device audio checks](AUDIO_VALIDATION.md)

Device checks still needed include live font changes in the default ARM Android app with the loaded libraries identified, and a spoken word returned into the installed quiz. On iOS, check long-text selection and Share at maximum text size, the return from Learning Progress, and the full speech disclosure. Review the final candidate with TalkBack and VoiceOver, including on physical devices. [Tile checks](TILE_DESIGN.md#visual-checks)

## Production signing

Configure the protected `production-release` GitHub environment for `main` and supply its signing inputs.

| Environment secret | Expected value |
| --- | --- |
| `ANDROID_KEYSTORE` | Base64-encoded release keystore |
| `NATO_UPLOAD_STORE_PASSWORD`, `NATO_UPLOAD_KEY_ALIAS`, `NATO_UPLOAD_KEY_PASSWORD` | Release keystore password, alias and key password |
| `IOS_CERTIFICATE`, `IOS_CERTIFICATE_PASSWORD` | Base64-encoded Apple Distribution P12 and its password |
| `IOS_PROFILE` | Base64-encoded App Store provisioning profile for `com.natophonetics.app` |
| `IOS_SIGNING_CONFIG` | xcconfig text with `DEVELOPMENT_TEAM`, manual signing, Apple Distribution identity and the profile specifier |
| `IOS_EXPORT_OPTIONS` | ExportOptions plist text with method `app-store-connect` and the matching team, certificate and profile |

For an approved release, select **Mobile Release → Run workflow**, choose `main` and enter the package version. The workflow verifies the IPA profile and signatures and inspects the Android products before publishing the three files. The Git tag must identify that exact commit. Store submission and web deployment are separate operations. [Signing setup](../.github/prepare-ios-signing.sh) · [Web distribution](WEB_DISTRIBUTION.md)
