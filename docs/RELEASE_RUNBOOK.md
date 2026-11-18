# Release preparation and web hosting

Prepared 18 November 2026 (P10.3 and partial P10.4). This describes the implemented candidate; it is not publication or release acceptance. [Current delivery status](APP_REVIEW.md#current-delivery-status) and [the plan](DELIVERY_PLAN.md) retain all unfinished engineering and human gates. Run 18 adds a guarded source-built iOS Yoga precision repair; [current candidate scope](evidence/run18/README.md) and [native patch/rebuild contract](NATIVE_TEXT_PRECISION.md). Run 16 implements P10.2 caching with local Edge evidence. Run 17 prepares the [actual unsigned all-architecture Android Release AAB](evidence/run17/android/release-artifact.json) with its embedded JavaScript and signature inspection, and qualifies compatible Metro parser removal. Hosted/other-engine qualification, signed native distribution, P09 spoken recognition and integrated P10.5–.7 remain unfinished. R08 still fails for 28 picomatch-derived high entries; the prior image-size disposition is removed after remediation, with no new acceptance.

## Identity and supported configuration

| Field | Current source/value | Release action |
|---|---|---|
| Product and registration | `app.json`: NATO Phonetics / `NATOPhonetics` | Keep native registration aligned with `index.js` and app delegates |
| Display version | `package.json`, `app.json`, Android `versionName`, iOS `MARKETING_VERSION`: `1.0.0` | Update all four together before a versioned distribution |
| Build number | Android `versionCode` and iOS `CURRENT_PROJECT_VERSION`: `1` | Increase for the next store/internal candidate as required by its distribution channel |
| Native identifier | Android application ID / iOS bundle ID: `com.natophonetics.app` | Preserve for signed upgrades and local data retention |
| Native URL scheme | `natophonetics` | Exercise cold/warm Menu, Home fallback and ordinary Back |
| Web base | Origin root, with HTTPS outside secure loopback | A subdirectory deployment is not configured or qualified |
| Policy/support | In-app Privacy and About; [repository policy](../PRIVACY.md); [issue tracker](https://github.com/c0d3rb4b4/nato-phonetics/issues) | Owner checks destination, public policy wording and release metadata in M11.7 |

Android minimum API 24 / compile-target 36 and iOS minimum 15.1 are **configured minimums**, not tested coverage. Actual native evidence uses the emulators/simulators identified in each run. iOS 26.2 has scoped runtime evidence; iOS 27 and older header fallback still need P10 qualification. No macOS/Windows/watch target is configured. Edge 157 has actual production browser evidence; other browser/engine/version qualification remains open. Provider speech and future recognition support are separate from rendering and saved progress.

## Prepare a reviewable candidate

1. Use the pinned Node 22.23.0/npm 10.9.4 and locked native toolchains in [Native builds](NATIVE_BUILDS.md). Start from a clean checkout, or preserve and identify an intentional uncommitted candidate with a source SHA-256 manifest and a base revision. Never identify an Android Debug candidate only by its APK: also archive/hash the Metro graph actually loaded by the app. Release builds identify their embedded JS. Preserve install scripts and the native patch version/source hashes; rebuild iOS after the Yoga backport. Standard Android Maven binaries do not consume that patched source.
2. Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:yoga`, `npm run check:dependencies`, `npm run audit:review`, then `npm run export:web`. Keep raw audit failure and its dated disposition distinct. Regenerate/verify artwork with `npm run generate-icons` and rebuild native consumers after any asset change. [Artwork contract](RELEASE_ASSETS.md).
3. Run the CI production browser commands in [the workflow](../.github/workflows/ci.yml), including progress concurrency and the actual service-worker offline/update suite. Use the isolated Puppeteer/browser setup in [README](../README.md#web-routing-and-browser-checks). Keep stdout, exits, browser/version, source/build hashes and actual screenshot metadata. A mock speech callback establishes controller behavior, not audible correctness.
4. Run direct native builds and installed-app checks. Keep the fresh locked install, dependency audit and all native/runtime checks as actual candidate evidence; earlier builds remain historical. Preserve storage during upgrade tests. The [native workflow](../.github/workflows/native-builds.yml) prepares builds on a configured private runner and never publishes; local success does not claim a hosted workflow ran.
5. Run P10.5's integrated matrix, prepare P10.6's one consolidated M11 handoff, and capture P10.7's full final target/flow matrix. Include remaining P1/P3 failures without renaming them as passes. Owner acceptance/publication is the final M11 action after the candidate, hashes, install steps, policy and exact outstanding checks are ready.

## Native artifacts and distribution boundary

| Build command | Output | Meaning / installation |
|---|---|---|
| `npm run build:android:debug` | `android/app/build/outputs/apk/debug/app-debug.apk` | Development key, requires running Metro and ADB reverse; use the documented emulator install flow |
| `npm run build:android:release` | `android/app/build/outputs/bundle/release/app-release.aab` | Bundled JS; unsigned unless all four private signing inputs are supplied. An AAB is not directly installed with `adb install` |
| `npm run build:ios:simulator` | `artifacts/ios-simulator/Build/Products/Release-iphonesimulator/NATOPhonetics.app` | Unsigned simulator app with bundled JS; `simctl install`/`launch`, not a physical-device IPA |
| `npm run build:ios:archive` | `artifacts/NATOPhonetics.xcarchive` | Device archive needs a configured Apple team/provisioning |
| `npm run build:ios:export` | `artifacts/ios-export/` | Requires local `NATO_EXPORT_OPTIONS_PLIST` and valid signing/provisioning; no upload is performed |

Exact SDK setup, signing variable names, commands and simulator/ADB instructions are in [Native builds](NATIVE_BUILDS.md). Keep secrets outside the repository and logs. Debug/simulator artifacts do not replace signed internal distribution, physical installation, microphone/provider tests or owner release acceptance. These human results stay in M11.2/.7. No new signed artifacts are claimed by this documentation task.

## Independent web deployment contract

`npm run export:web` produces the complete `dist/` directory. Host it at an origin root over HTTPS; upload a versioned directory first and switch the served directory atomically. Keep the previous complete directory for rollback. Do not upload files incrementally over a live release or delete hashed assets still referenced by open pages.

The build emits thirteen route HTML files plus hashed JS/fonts, favicon, `service-worker.js`, `offline-manifest.json` and reference `_headers`. Configure the host to:

- Serve `/` from `index.html` and a known extensionless route such as `/progress` from `progress.html`. Direct refresh must work for all routes in [the route table](../src/navigation/routes.js).
- Fall back to `index.html` for unknown extensionless navigation paths; the client displays its Page Not Found route with Home access. Keep missing JS/font/image requests as HTTP 404, never HTML responses with status 200.
- Serve `.js` as JavaScript, `.html` as HTML, `.ttf` as a font and `.png` as an image. Revalidate HTML, `service-worker.js`, `offline-manifest.json` and `favicon.png` on each visit. Serve the worker at the origin root without redirects and with JavaScript MIME type; never cache its stable URL immutably. Hashed JS/fonts may use immutable caching only if their exact bytes never change at that URL.
- Use HTTPS. Browser progress writes/deletion require Web Locks and secure context; unsupported capabilities show recovery guidance and leave ordinary practice available. Apply the site's normal transport/security headers without blocking the bundled app, local fonts or required inline React Native Web styles. A restrictive CSP needs its own actual browser qualification.

`dist/_headers` is reference syntax for hosts that support it, not universal host configuration. The former broad `_redirects` fallback is no longer emitted because it can turn missing assets into HTML. Configure known extensionless routes and unknown navigation fallback explicitly, with missing asset 404s. The repository `node scripts/serve-web.cjs dist` command is a loopback preview with correct local direct-route/404/cache-header behavior, not an internet production server. Use a different port from development (for example `PORT=8090`) to avoid an old production worker controlling development. No host/account/domain was selected or published; host-specific configuration and actual deployment checks remain P10.4/M11.7.

After a deployment, load every known URL directly and hard-refresh it, check title and favicon/font/JS responses, test unknown navigation and missing asset 404, then use browser Back and Menu/Home. Verify real HTTPS and `navigator.locks` support, save answers in two windows and Clear/Retry without resurrecting earlier answers. Check policy/support links. Keep actual URL, date, browser, response/cache headers and build identity as evidence. Hosted routing cannot be inferred from local loopback tests.

## Updates, local data and rollback

The production build caches a digest-verified app shell after successful connected setup; Menu displays readiness, retry or waiting-update guidance. Each worker serves its complete pinned build online and offline. Failed installs preserve the active shell; readiness checks detect missing resources, and Check/Retry can repair them after reconnection. New workers wait until all controlled app windows close; no forced activation/reload is used. Finish/save pending progress and copy drafts first. First-ever visits and evicted/restricted storage need a connection. Browser/OS speech connectivity stays provider-dependent. There is no home-screen install prompt, new provider or microphone permission. [Full caching/update/storage/support contract](WEB_OFFLINE.md), [actual Run 16 evidence](evidence/run16/README.md).

Existing v1 progress is read without a rewrite. Browser Clear Progress atomically removes all symbol aggregates and retains only a fresh random `generation` marker in the same key. Later answers retain the marker; it prevents a suspended window's earlier pending answers from restoring deleted data. It has no user/answer identity and is replaced on each deletion. Native Clear still removes its progress key. Preferences keep their independent scope. [Storage and failure rules](LOCAL_PROGRESS.md).

Refresh **all old app windows** after upgrading to the coordinated browser store. Web Locks coordinate cooperating updated windows only; already loaded legacy code cannot be made to acquire locks by the new bundle. In-memory rounds/drafts and unsaved answers clear on reload, so finish/save or explicitly discard them first. Capture that migration result before claiming deployed upgrade assurance. Delayed storage events/frozen pages, old deployed clients and browser-engine support remain distinct coverage cases.

For rollback, atomically serve the prior complete directory; use Check for web update, finish/save in-memory work, close every app window, then reopen. This rollback follows the same waiting lifecycle; refreshing one window while another remains open keeps the old worker. A version without generation support will reject a post-deletion marker as an unsupported record; preserve it and offer recovery instead of silently deleting data. Prefer a corrected forward build with generation support. Never clear an installation's data or switch origin merely to make a rollback look successful. Native downgrade/upgrade also needs its real signing/data-preservation checks.

## Consolidated human result fields

P10.6 must reconcile a final candidate against all existing supplements, including [Run 15](evidence/run15/manual-handoff.md). For each M11 row record candidate revision/manifest, artifact hash, platform/OS/device/provider, exact scenario, expected/actual result, screenshot/log, person/date and pass/fail/unperformed. Content/listening, physical AT/appearance, interruption/provider/offline behavior, signing, legal/policy acceptance and publication are human-only results. Keep engineering failures in their P tasks. All human acceptance is currently unperformed; this runbook does not fill those fields.
