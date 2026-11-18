#!/bin/sh
set -eu
root_dir=$(cd "$(dirname "$0")/../../../../.." && pwd)
source_dir="$root_dir/docs/evidence/run14/android/icon-preview"
build_dir="$root_dir/artifacts/run14/icon-preview"
android_tools="$ANDROID_HOME/build-tools/36.0.0"
mkdir -p "$build_dir/classes" "$build_dir/dex"
"$JAVA_HOME/bin/javac" -source 17 -target 17 -classpath "$ANDROID_HOME/platforms/android-36/android.jar" -d "$build_dir/classes" "$source_dir/IconPreview.java"
"$android_tools/d8" --lib "$ANDROID_HOME/platforms/android-36/android.jar" --output "$build_dir/dex" "$build_dir/classes/com/natophonetics/iconpreview/"*.class
"$android_tools/aapt2" link -I "$ANDROID_HOME/platforms/android-36/android.jar" --manifest "$source_dir/AndroidManifest.xml" -o "$build_dir/unsigned.apk"
(cd "$build_dir/dex" && zip -q "$build_dir/unsigned.apk" classes.dex)
"$android_tools/zipalign" -f 4 "$build_dir/unsigned.apk" "$build_dir/aligned.apk"
"$android_tools/apksigner" sign --ks "$root_dir/android/app/debug.keystore" --ks-key-alias androiddebugkey --ks-pass pass:android --key-pass pass:android --out "$build_dir/preview.apk" "$build_dir/aligned.apk"
adb -s emulator-5580 install -r "$build_dir/preview.apk"
adb -s emulator-5580 shell am start -W -n com.natophonetics.iconpreview/.IconPreview
