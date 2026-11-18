# Retained setup failures

These observations are copied from actual tool-call output during Run20; they are setup failures, not passed commands or product failures. The commands registry separately retains the npm review, live/cold equivalence and initial host failures.

- Frida process-name lookup: `frida.get_device(...).get_process("com.natophonetics.app")` raises `frida.ProcessNotFoundError: unable to find process with name 'com.natophonetics.app'`. Using the actual `adb shell pidof` process ID permits attachment; exported symbol and hook-preflight JSON are saved.
- Running the native esbuild executable through `node node_modules/esbuild/bin/esbuild` raises `SyntaxError: Invalid or unexpected token`. Direct `node_modules/.bin/esbuild` then reports `Could not resolve "buffer"` from the isolated Java bridge. Explicit isolated `frida-java-bridge@7.0.11 buffer@6.0.3` installation and direct compilation succeed. No app dependency changes.
- Initial Caddy download assertion compared SHA256 with the128-hex-character upstream SHA512 checksum and raised `AssertionError`. The saved mismatch JSON records real expected/actual values. Correct SHA512 and independent release-asset SHA256 both verify before extraction/execution; metadata is saved.
- Initial host command exits1 with `MODULE_NOT_FOUND` for Playwright because the copied command wrapper selected a nonexistent isolated Run20 runner path. Corrected wrapper selects the existing pinned Run19 Playwright1.65.1 installation; separate actual host reports pass. Original command/log remains failed.
- Early Hermes observations report `Error: No running Hermes target` while spawned native processes finish normal startup. The collector catches and retries these setup observations. Its successful exit records collection, while the independent live/cold equivalence command still exits1 with three failed controls.

No old driver/native/OCR/audit/staged-whitespace evidence is edited or relabelled.
