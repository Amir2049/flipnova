#!/usr/bin/env bash
# Builds dist/Flippo.aab — the Android App Bundle Google Play needs (Play does not take APKs for new apps).
# Play REJECTS bundles signed with the debug key, so this needs YOUR upload key:
#   export FLIPNOVA_KEYSTORE_PROPS=/safe/place/keystore.properties   (storeFile, storePassword, keyAlias, keyPassword)
# The keystore and its passwords never go into this repo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export ANDROID_HOME="${ANDROID_HOME:-/opt/android-sdk}"
if [ -z "${FLIPNOVA_KEYSTORE_PROPS:-}" ] && [ "${ALLOW_DEBUG_AAB:-0}" != "1" ]; then
  echo "FLIPNOVA_KEYSTORE_PROPS is not set: Google Play rejects a debug-signed bundle. (ALLOW_DEBUG_AAB=1 builds one for local checks only.)" >&2
  exit 1
fi
WWW="$ROOT/android/app/src/main/assets/www"
bash "$ROOT/tools/build-dist.sh"
rm -rf "$WWW" && mkdir -p "$WWW"
cp -r "$ROOT/build/www/." "$WWW/"
echo "sdk.dir=$ANDROID_HOME" > "$ROOT/android/local.properties"
cd "$ROOT/android"
gradle --no-daemon -q bundleGameRelease
mkdir -p "$ROOT/dist"
OUT="$ROOT/dist/Flippo.aab"; [ -z "${FLIPNOVA_KEYSTORE_PROPS:-}" ] && OUT="$ROOT/dist/Flippo-DEBUG-not-for-play.aab"
cp app/build/outputs/bundle/gameRelease/app-game-release.aab "$OUT"
ls -la "$OUT"
