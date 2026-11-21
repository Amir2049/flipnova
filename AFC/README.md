# AFC

A football game for Android tablets and phones, made with Godot 4.7 (GDScript). Every club, player and logo is original.

## Layout
- `scripts/core` simulation: ball physics, players, match rules, team AI (no rendering, runs headless)
- `scripts/view` 3D: pitch, players, ball, camera, sound
- `scripts/ui`, `scripts/input`, `scripts/main.gd` menus, HUD, touch / pad / keyboard input
- `scripts/data` clubs, squads, formations, career and save data
- `assets/player.glb` player model with 100+ animation clips, `assets/player_clips.json` clip timing
- `tests/` headless checks (`tests/check.sh` parse-checks every script)
- `tools/` asset and APK tools (`sign_apk.py` signs an exported APK)

## Match engine (native/)
Friendlies run on Google Research Football's C++ engine (Apache-2.0) inside Godot as a GDExtension (`GFEngine`).
The prebuilt libraries are in `native/bin/`. To rebuild them:
1. `sh native/prepare.sh deps` fetches the engine (pinned commit, patched for headless use) and godot-cpp 4.5.
2. Desktop: `cmake -G Ninja -S native -B build -DGF_ROOT=deps/football/third_party/gfootball_engine -DGODOT_CPP=deps/godot-cpp && ninja -C build afcgf`
3. Android arm64, no NDK needed: `sh native/android/build_toolchain.sh deps/android` builds an Android sysroot, libc++
   and compiler-rt from source with the host clang (18+), then configure with
   `-DCMAKE_TOOLCHAIN_FILE=deps/android/toolchain.cmake -DGODOTCPP_TARGET=template_release -DGODOTCPP_USE_STATIC_CPP=OFF`,
   build `afcgf`, `llvm-strip` it and copy it to `native/bin/libafcgf.android.arm64.so`.
4. `python3 tools/pack_gf_data.py <football>/third_party/gfootball_engine/data assets/gfdata.zip` packs the engine's
   animation and model data (unpacked into user:// on first run).

## Build the Android APK
1. Godot 4.7.2 with Android export templates.
2. `godot --headless --export-release "Android" afc-unsigned.apk`
3. `python3 tools/fix_apk.py afc-unsigned.apk AFC.apk signing/hara-lab-key.pem` (fixes the manifest, aligns stored native
   libraries to 16 KB, signs with APK Signature Scheme v2)

Keep `signing/hara-lab-key.pem` private and backed up: updates only install over the old app when they are signed with the same key. It is not stored in git.

## Credits
- Match engine: Google Research Football (Apache-2.0).
- Motion capture (celebrations, disappointment, kicks, walks; `assets/mocap.json`, built by `tools/cmu_retarget.py` from
  `tools/mocap/clips.txt`): CMU Graphics Lab Motion Capture Database, mocap.cs.cmu.edu. The database was created with
  funding from NSF EIA-0196217.
- Player body: MakeHuman base mesh (CC0).
