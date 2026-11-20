#!/usr/bin/env bash
set -euo pipefail

packages=(artifacts/ios-export/*.ipa)
[[ ${#packages[@]} == 1 && -s "${packages[0]}" ]]
inspection=$(mktemp -d "$RUNNER_TEMP/ipa.XXXXXX")
ditto -x -k "${packages[0]}" "$inspection"
app="$inspection/Payload/NATOPhonetics.app"
plist="$app/Info.plist"
version=$(node -p 'require("./package.json").version')
[[ $(/usr/libexec/PlistBuddy -c 'Print :CFBundleIdentifier' "$plist") == com.natophonetics.app ]]
[[ $(/usr/libexec/PlistBuddy -c 'Print :CFBundleShortVersionString' "$plist") == "$version" ]]
[[ $(/usr/libexec/PlistBuddy -c 'Print :CFBundleSupportedPlatforms:0' "$plist") == iPhoneOS ]]
codesign --verify --deep --strict "$app"
codesign -dv --verbose=4 "$app" 2>&1 | grep '^Authority=Apple Distribution:'
if [[ -f "$app/embedded.mobileprovision" ]]; then
  security cms -D -i "$app/embedded.mobileprovision" > "$inspection/profile.plist"
  if /usr/libexec/PlistBuddy -c 'Print :ProvisionedDevices' "$inspection/profile.plist" >/dev/null 2>&1; then
    echo "Public IPA assets must omit registered device identifiers."
    exit 1
  fi
fi
cp "${packages[0]}" "$RUNNER_TEMP/verified.ipa"
