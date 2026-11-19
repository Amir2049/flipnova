#!/usr/bin/env bash
# Builds dist/NOVA-STUDIO.apk: copies the studio into the Android project and runs Gradle.
# Needs: JDK 17+, Gradle 8.9+, Android SDK (platform 35 + build-tools 35) at $ANDROID_HOME.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
WWW="$ROOT/android/app/src/main/assets/www"
rm -rf "$WWW" && mkdir -p "$WWW"
cp -r "$ROOT/index.html" "$ROOT/css" "$ROOT/js" "$WWW/"
echo "sdk.dir=$ANDROID_HOME" > "$ROOT/android/local.properties"
cd "$ROOT/android"
gradle --no-daemon -q assembleRelease
mkdir -p "$ROOT/dist"
cp app/build/outputs/apk/release/app-release.apk "$ROOT/dist/NOVA-STUDIO.apk"
ls -la "$ROOT/dist/NOVA-STUDIO.apk"
