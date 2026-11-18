# Reproducible independent web candidate

Run20 implements the local packaging/configuration part of P10.4. This is a reversible self-hosting option using Caddy **2.11.9**, without accounts, Expo/EAS or a new app dependency. Nothing is published. Actual domain/HTTPS/certificate/host operations and release acceptance remain M11.2/.7; native distribution and final P10 gates stay open. [Evidence and limits](evidence/run20/README.md).

## Prepare and inspect

Use the pinned Node22/npm10 toolchain and the normal locked installation. Build production, then choose a **new** archive path:

```sh
npm run export:web
npm run package:web -- dist artifacts/web-release.tar.gz
mkdir -p artifacts/web-release
tar -xzf artifacts/web-release.tar.gz -C artifacts/web-release
```

The archive contains only `public/`, `Caddyfile` and `release.json`. The public tree holds the complete verified production shell, worker and manifest. Development output, source maps, build markers, `_headers`, unrelated files and credentials are excluded. Packaging validates every manifest digest, the current route table, complete generated worker/template identity and regular files without symlinks. Unsafe paths, missing/corrupt resources, conflicting immutable URL bytes and an existing output path fail before a success report. The output is never automatically overwritten.

`release.json` records display version, shell build ID, SHA-256 and byte count of each public/config file, retained URLs and a content identity derived from that inventory. The command also reports the archive SHA-256. It contains no assumed clean commit or timestamp; identify the intentional dirty source separately using the execution evidence manifest. Sorted POSIX ustar entries, fixed owners/mode/epoch timestamps and gzip make repeated archives byte-identical with the pinned toolchain. The six packaging regressions extract the real tar and check actual bytes and negative cases.

## Run the concrete host

Install the official Caddy2.11.9 binary appropriate for the host and verify its release checksum. Caddy's upstream checksum file uses **SHA-512**; release asset API metadata separately supplies SHA-256. [Run20 verified macOS tool identity](evidence/run20/shared/caddy-tool.json). CI pins the Linux AMD64 checksum; its hosted run is unperformed.

For a local check:

```sh
export NATO_SITE_ADDRESS=http://127.0.0.1:8090
export NATO_WEB_ROOT="$PWD/artifacts/web-release/public"
caddy validate --config artifacts/web-release/Caddyfile --adapter caddyfile
caddy run --config artifacts/web-release/Caddyfile --adapter caddyfile
```

The address and absolute web root must be set before validation/run. The administration API is disabled in this configuration. The service account needs read access to the release and persistent Caddy certificate storage where HTTPS is used; this repository does not install a system service or change machine trust. For an authorized public host, set `NATO_SITE_ADDRESS` to the real hostname, configure DNS/ports/service and Caddy certificate storage, then verify actual HTTPS on that host. Do not put secret values in the archive or evidence. A subdirectory deployment is still unconfigured.

The configuration serves all13 known direct routes, `.html` paths and trailing-slash variants. Unknown extensionless navigation receives the app's Not Found flow; missing JS/fonts/images and missing paths inside `/assets/` stay404. It serves correct HTML/JS/font MIME types and `nosniff`, revalidates stable HTML/worker/manifest/favicon URLs, and caches hashed JS plus the root-level hashed tile fonts immutably. It blocks build metadata paths. No directory listing or application API is enabled.

Epoch timestamps deliberately have no `Last-Modified` or timestamp-derived ETag under Caddy2.11.9. Otherwise equal-length files from two deterministic releases could share a false validator. The actual host gate asserts absent validators and200/current bytes for stale conditional requests after a root switch. Recheck this boundary on a Caddy/config/packaging change; do not substitute a different server without its HTTP/cache tests. [Pinned upstream implementation](https://github.com/caddyserver/caddy/blob/v2.11.9/modules/caddyhttp/fileserver/staticfiles.go).

## Forward updates and rollback

Keep every release directory immutable. Before a forward switch, retain all prior releases' hashed assets in the new archive by passing the prior `public/` directories (or their original build directories):

```sh
npm run package:web -- dist artifacts/next-web.tar.gz /srv/nato/releases/previous/public
```

Retention is transitive for supported hashed JS/font filenames. Files outside the prior worker manifest require the original sibling `release.json` inventory, with its content identity and each file hash/length verified; damaged or uninventoried retained assets fail. A same-URL/different-byte collision fails instead of replacing an old asset. Old HTML/worker/manifest are never copied over current files. Keep all asset lineages needed by open pages; an unknown external build's asset naming needs review, not a silent retention claim.

Extract the complete archive into a new, versioned directory and verify its hashes before changing the served root. Serve via a `current` symlink and switch that symlink with an **atomic rename on the same filesystem**; do not delete the old link then create the new one, and do not upload incrementally into the live directory. Host-specific ownership/service/filesystem setup and authorization remain M11; the maintained runner performs the actual local atomic symlink operation.

For rollback, create a **new** rollback archive from the previous release's `public/` tree, retaining the current release's `public/` tree as another argument. This keeps newer hashed assets available to pages that remain open during rollback. Merely restoring the old directory can strand newer pages. Do not mutate a previously identified archive or erase local browser data to make rollback succeed.

Workers follow the existing [waiting/update contract](WEB_OFFLINE.md). Finish/save rounds and copy drafts, close every app window, then reopen; there is no forced reload/activation. Refresh all legacy clients before claiming coordination. The scoped host gate proves one actual saved answer survives forward and rollback worker activation and offline direct progress; it does not replace the full legacy/update/deletion/browser/OS/provider/physical acceptance matrix.

## Repeat local qualification

Install the isolated pinned Playwright runner as described in [README](../README.md#web-routing-and-browser-checks), then run:

```sh
NODE_PATH=/tmp/nato-playwright/node_modules CADDY_EXECUTABLE=/absolute/path/to/caddy \
  node scripts/verify-web-host.cjs artifacts/web-release.tar.gz artifacts/web-host-check chromium tabs
```

The runner starts and stops Caddy on a temporary loopback port, reads the extracted candidate inventory, exercises HTTP responses, actual pointer practice/converter/progress, a separately labelled real-JS update fixture, atomic switches, normal worker waiting/activation and saved progress offline after rollback. It writes reports and actual desktop/light/320px/dark screenshots. Browser profiles and complete test release directories stay in ignored artifacts; upload only the report/log/screenshots/candidate. The synthetic update is qualification evidence, not a second shipped product candidate. [Run20 captures](evidence/run20/screenshots/index.md).

Public HTTPS/certificate renewal, actual hosted routing, server hardening/operations, mobile/branded Safari/other engines for this host, legacy deployed clients, native signing, recognition and integrated release acceptance remain unrun. All M11 results are unperformed.

## Additional runtime/transition qualification — Run21

Run21 repairs the host runner's asynchronous polling and qualifies **Edge157, Firefox159 and Playwright WebKit27.2** against the same Caddy/config/archive on macOS loopback. Pass engine `chromium`, `firefox` or `webkit` as the fourth argument; the fifth is `tabs` (default) or `process`. `BROWSER_EXECUTABLE` applies only to Chromium. CI installs each engine and uploads a unique artifact, but hosted Linux execution remains unrun.

The default `tabs` scenario closes all app tabs, leaves the browser's worker process alive with zero app clients for1s, then reopens. Actual active-controller/cache/served-HTML checks determine success; idle time is not a passed gate.18 final groups cover hash-rejected truncated update responses/visible Retry, two-window pinning/draft survival, exact progress/preferences/unrelated-data retention, forward and rollback, font eviction503/visible repair and cold offline relaunch after Caddy stops. [Reports/24 actual images](evidence/run21/README.md).

The `process` scenario quits the browser context while an update waits. Corrected Chromium/Firefox checks pass in Run21; WebKit27.2 fails expected activation/cache assurance with the saved answer visible. This path remains P10 engineering; cause and branded/physical reach are unknown. The passing tab-close comparison does not repair or qualify it. Do not claim a universal quit/restart update guarantee. Preserve the original failure and re-enter at browser/lifecycle changes or pre-release support review.

Run20's artifact/HTTP/resource results are preserved. Its async `waitForFunction` transition checks could pass before their false boolean resolved and are superseded by Run21's explicitly awaited polling, negative control and served-byte assertions. No production worker or app change is made. Public HTTPS/certificate/host, legacy/branded/OS/native/provider/integrated acceptance and all M11 results remain unperformed.
