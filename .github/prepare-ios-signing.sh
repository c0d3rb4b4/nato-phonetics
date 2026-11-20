#!/usr/bin/env bash
set -euo pipefail
umask 077

certificate="$RUNNER_TEMP/apple.p12"
profile="$RUNNER_TEMP/apple.mobileprovision"
profile_plist="$RUNNER_TEMP/profile.plist"
keychain="$RUNNER_TEMP/mobile-release.keychain-db"
password=$(openssl rand -hex 24)

printf '%s' "$IOS_CERTIFICATE" | base64 -D > "$certificate"
printf '%s' "$IOS_PROFILE" | base64 -D > "$profile"
security cms -D -i "$profile" > "$profile_plist"
uuid=$(/usr/libexec/PlistBuddy -c 'Print :UUID' "$profile_plist")
[[ "$uuid" =~ ^[0-9a-fA-F-]{36}$ ]]
for directory in "$HOME/Library/MobileDevice/Provisioning Profiles" "$HOME/Library/Developer/Xcode/UserData/Provisioning Profiles"; do
  mkdir -p "$directory"
  cp "$profile" "$directory/$uuid.mobileprovision"
done
security create-keychain -p "$password" "$keychain"
security set-keychain-settings -lut 21600 "$keychain"
security unlock-keychain -p "$password" "$keychain"
security import "$certificate" -P "$IOS_CERTIFICATE_PASSWORD" -f pkcs12 -k "$keychain" -T /usr/bin/codesign
security set-key-partition-list -S apple-tool:,apple: -s -k "$password" "$keychain" >/dev/null
security list-keychains -d user -s "$keychain"
printf '%s\n' "$IOS_SIGNING_CONFIG" > ios/ReleaseSigning.local.xcconfig
printf '%s\n' "$IOS_EXPORT_OPTIONS" > "$RUNNER_TEMP/export-options.plist"
method=$(/usr/libexec/PlistBuddy -c 'Print :method' "$RUNNER_TEMP/export-options.plist")
[[ "$method" == app-store-connect ]] || { echo "Use app-store-connect export for public IPA assets."; exit 1; }
