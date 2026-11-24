# Web distribution

The web build serves static files from the root of an HTTPS origin. Use a separate origin or port for development. `npm run web` starts a development server, and a production service worker registered on the same origin could intercept it.

## Build and serve

With the pinned Node and npm versions, run these commands from the repository root. Choose a new archive name for each release.

```sh
npm ci
npm run export:web
npm run package:web -- dist artifacts/web-release.tar.gz
mkdir -p artifacts/web-release
tar -xzf artifacts/web-release.tar.gz -C artifacts/web-release
```

The archive contains `public/`, a Caddy configuration and `release.json`. The packager checks the route table, service worker and asset hashes. The release inventory lists file sizes and SHA-256 digests, and the command prints the archive digest. Keep the inventory beside `public/` for future upgrades.

For a local preview, install Caddy 2.11.9 and verify its release checksum. The following commands serve the extracted archive on a secure loopback origin.

```sh
export NATO_SITE_ADDRESS=http://127.0.0.1:8090
export NATO_WEB_ROOT="$PWD/artifacts/web-release/public"
caddy validate --config artifacts/web-release/Caddyfile --adapter caddyfile
caddy run --config artifacts/web-release/Caddyfile --adapter caddyfile
```

For a public deployment, configure the hostname, DNS, HTTPS and persistent Caddy certificate storage. Point `NATO_WEB_ROOT` at the served release’s `public/` directory. The configuration revalidates HTML, the worker and the manifest. Hashed JavaScript and font URLs are immutable. Unknown app routes show Page Not Found, while missing assets return HTTP 404. [Host configuration](../deploy/Caddyfile)

## Forward updates and rollback

1. When packaging an update, pass the previous release’s extracted `public/` directory after the output archive. Pass additional releases if open clients still depend on them. This preserves hashed JavaScript and fonts while updating HTML and the service worker.
2. Extract the archive into a new versioned directory and verify the release hashes. Point the host at a stable `current` symlink and switch that link by atomic rename on the same filesystem. Keep each release directory intact so clients always see a complete version.
3. To roll back, package the previous release’s `public/` as the build input and pass the newer release as a retention source. Use the checkout corresponding to the rollback target so the packager can validate its worker and route table. Switch to the newly extracted rollback directory in the same way. Open pages from both versions can then finish loading their assets.

These examples use release directories under `/srv/nato/releases/`.

```sh
npm run package:web -- dist artifacts/forward.tar.gz /srv/nato/releases/previous/public
npm run package:web -- /srv/nato/releases/previous/public artifacts/rollback.tar.gz /srv/nato/releases/newer/public
```

## Offline updates

On the first connected visit, the production service worker downloads and verifies the public shell. Open **Menu → Web availability** and wait for **Offline copy ready** before disconnecting. The app’s offline copy includes routes, code and fonts. Preferences and progress have separate local storage, and speech availability depends on the device or browser provider. [Learning progress](APP_GUIDE.md#learning-progress)

A new worker waits until every NATO Phonetics tab or window has closed. **In Firefox 159, quitting the entire browser while an update waits can leave the next offline launch unable to load.** While still connected, finish the round, retry pending saves and copy any draft you want to keep. Leave a tab for a different site open, close all NATO Phonetics tabs or windows, reopen the app online and wait for **Offline copy ready** in Menu. [Update guidance in Menu](screenshots/web-offline-update.png)

A failed download leaves the active copy usable if its files are intact. If storage was evicted or setup failed, reconnect and select **Retry offline setup**. Clearing all site storage also removes preferences and progress. **Clear Progress** and **Reset Preferences** leave the cached shell in place.

## Browser checks

After exporting and packaging, install the browser tools outside the app. These shell commands use the pinned CI versions. On a fresh Linux host, Playwright’s `install --with-deps` option can also install required system libraries.

```sh
runner="$(mktemp -d)"
npm install --prefix "$runner" --no-save --package-lock=false playwright@1.65.1 puppeteer-core@24.43.1
export NODE_PATH="$runner/node_modules"
node "$NODE_PATH/playwright/cli.js" install chromium firefox webkit
export CADDY_EXECUTABLE="$(command -v caddy)"
export BROWSER_EXECUTABLE="$(node -p "require('playwright').chromium.executablePath()")"

node scripts/verify-offline-browser.cjs dist artifacts/offline-browser
node scripts/verify-web-host.cjs artifacts/web-release.tar.gz artifacts/web-host/chromium chromium tabs
node scripts/verify-web-host.cjs artifacts/web-release.tar.gz artifacts/web-host/firefox-handoff firefox handoff
```

The host runner starts Caddy on loopback and checks routing, headers, updates, rollback and saved progress across offline launches. It supports `chromium`, `firefox` and `webkit`. Use `tabs` to close the app tabs or `process` to quit the browser. Firefox’s additional `handoff` mode tests the connected update sequence above. Use distinct output directories for each combination. Check public HTTPS and branded mobile browsers on their actual deployment targets. [CI browser matrix](../.github/workflows/ci.yml)
