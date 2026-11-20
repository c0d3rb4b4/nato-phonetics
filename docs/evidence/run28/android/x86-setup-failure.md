# First x86 attempt — retained failure and bounded recovery

Owner: P05.2-F2, with build-execution tooling as the enabling slice. Reproduction:
the [exact source Release command](source-release-x86.json), Node22.23.0,
RN0.81.5, JDK17/NDK27.1.12297006 on this 8GiB Apple silicon host,
Gradle max-workers1, no explicit Metro limit. It fails after14.26s: CMake cannot
create its x86 log directory and Metro fails opening/writing its output.
[Original whole-command log](source-release-x86.log).

Impact: this blocks x86 source ABI qualification; it does not demonstrate a
new application text failure. No x86 artifact is accepted or installed from
the failed command. Existing installed data, product/source files and prior
artifacts remain intact. Severity is an engineering enabler for the active P1,
with reach limited to this observed host/configuration; one attempt supplies
no population estimate.

Observed facts have high confidence: exit1, both failed task names, eight Metro
transform worker PIDs, available disk1,427,476,480→352,059,392bytes and swap
capacity11→12GiB. The retained log has no underlying OS errno, so a specific
ENOSPC diagnosis is unproven. Resource pressure is a supported inference.
Gradle's worker setting did not constrain the observed separate Metro pool.

Recovery: preserve the failure, stop the owned daemon, preserve/rehash qualified
products and reclaim only reproducible object/static-link caches with exact
path/byte records. Source, shared libraries, headers, toolchain and historical
evidence stay intact. Removed compile caches increase future recompilation
cost. The initial PCH search found zero files; actual remaining files were
static link archives. No user cleanup or new restricted input is requested.

Metro now honors the existing explicit NATO_BUILD_JOBS1..4 setting and preserves
its unspecified default. Actual configuration/default/invalid-input tests and
lint pass. The separately recorded [one-worker retry](source-release-x86-retry.json)
builds successfully in437.58s, then passes exact payload/Hermes/ELF/header and
native consumer-link checks. Both resource recovery and worker configuration
changed, so this does not establish their individual contribution to the first
failure or a universal peak-memory guarantee. No need to recreate a low-space
failure to claim the scoped recovery.

Effort: localized configuration/ABI tooling and meaningful tests, then one
actual source build and artifact/link verification. The immediate build blocker
is cleared at that scope; x86 runtime and full Release affected gates remain
unrun. A repeat at a different boundary requires its exact compiler/resource
question and a new forecast, with the original failed command kept red.
