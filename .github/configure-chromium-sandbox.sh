#!/usr/bin/env bash
set -eu

# Ubuntu restricts unprivileged user namespaces for browsers installed outside
# the system packages. Allow the pinned test executable to create its sandbox.
browser_executable=$(realpath -e "$1")
sudo apparmor_parser --replace <<PROFILE
abi <abi/4.0>,
include <tunables/global>

profile nato-ci-chromium "$browser_executable" flags=(unconfined) {
  userns,
}
PROFILE
