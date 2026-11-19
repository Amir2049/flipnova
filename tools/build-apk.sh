#!/usr/bin/env bash
# Builds dist/FLIPNOVA.apk (the game) and dist/FLIPNOVA-Maker.apk (the stage engine app): copies the web game
# into the Android project and runs Gradle.
# Needs: JDK 17+, Gradle 8.9+, Android SDK (platform 35 + build-tools 35) at $ANDROID_HOME.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
WWW="$ROOT/android/app/src/main/assets/www"
bash "$ROOT/tools/build-dist.sh"
rm -rf "$WWW" && mkdir -p "$WWW"
cp -r "$ROOT/build/www/." "$WWW/"
echo "sdk.dir=$ANDROID_HOME" > "$ROOT/android/local.properties"
cd "$ROOT/android"
gradle --no-daemon -q assembleGameRelease assembleMakerRelease
mkdir -p "$ROOT/dist"
cp app/build/outputs/apk/game/release/app-game-release.apk "$ROOT/dist/FLIPNOVA.apk"
cp app/build/outputs/apk/maker/release/app-maker-release.apk "$ROOT/dist/FLIPNOVA-Maker.apk"
ls -la "$ROOT/dist/FLIPNOVA.apk" "$ROOT/dist/FLIPNOVA-Maker.apk"
