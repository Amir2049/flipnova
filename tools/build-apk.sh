#!/usr/bin/env bash
# Builds dist/Flippo.apk (the game) and dist/Flippo-Maker.apk (the stage engine app): copies the web game
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
cp app/build/outputs/apk/game/release/app-game-release.apk "$ROOT/dist/Flippo.apk"
cp app/build/outputs/apk/maker/release/app-maker-release.apk "$ROOT/dist/Flippo-Maker.apk"
ls -la "$ROOT/dist/Flippo.apk" "$ROOT/dist/Flippo-Maker.apk"
# b66: players update over the old version only when the APK carries the SAME signing key as before. A different key
# means Android refuses the update and players would have to uninstall (and lose progress without the progress code).
# Key of builds 58-65 (Android debug key of the machine that built them):
KNOWN_KEY=20ea7ce35c3fc3f3360d4dab636b6d76e58efe6ff23160d8d270f81d9f3ce2f6
SIGNER=$(ls "$ANDROID_HOME"/build-tools/*/apksigner 2>/dev/null | tail -1)
if [ -n "$SIGNER" ] && [ -z "${FLIPNOVA_KEYSTORE_PROPS:-}" ]; then
  KEY=$("$SIGNER" verify --print-certs "$ROOT/dist/Flippo.apk" 2>/dev/null | sed -n 's/^Signer #1 certificate SHA-256 digest: //p')
  if [ "$KEY" = "$KNOWN_KEY" ]; then echo "OK: same key as builds 58-65, players can update over the old version."
  else
    echo "WARNING: this APK is signed with a DIFFERENT key ($KEY)." >&2
    echo "         It will NOT install over builds 58-65. Build on the computer that built them, or don't ship it." >&2
    rm -f "$ROOT/dist/Flippo.apk" "$ROOT/dist/Flippo-Maker.apk"
    exit 1
  fi
fi
