# Gameplay: a fair keeper, instant controls, grounded players - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the things that make AFC's matches feel unfair or unresponsive (a keeper who dives at everything,
sticks that answer late, feet that skate) and make the built-in engine's matches end with real scores, each change
proven by numbers from a headless benchmark.

**Architecture:** The 11-a-side matches run in Google Research Football's C++ engine (`native/`, patched through
`native/patches/afc-gameplay.patch`); the view (`scripts/view/engine_match_view.gd`, `player_view.gd`) draws it.
Street / practice run on AFC's GDScript engine (`scripts/core/match_sim.gd`, `team_ai.gd`). Every task first adds
the measurement, then the change, then shows the measurement move.

**Tech Stack:** C++17 (GRF engine, NDK r27c for Android), Godot 4.7.2 GDScript, headless benchmarks
(`native/src/gftest.cpp`, `tests/*.gd`).

**Spec:** `docs/reports/جيمبلاي كورة موبايل أسطوري.md` (sections "الحركة والحارس", "خطة الجيمبلاي" G1-G3) and the
2026-11-25 research below.

## Research (2026-11-25)

- FC Mobile 26 made light-run dribbling more responsive, slowed jog dribble for a more explosive first sprint touch,
  and tied turn speed to agility/height; June 2026 patch again fixed "heavy" dribbling and delayed first touches -
  responsiveness of the dribble is the thing players notice first
  ([EA deep dive](https://www.ea.com/games/ea-sports-fc/fc-mobile/news/fc-mobile-gameplay-deep-dive),
  [EGW](https://egw.news/fifa/news/35367/fc-mobile-june-2026-update-finally-fixes-goalkeepe-Lic-A9EFn)).
- Keepers: EA FC 26 reworked keepers again ([EA](https://www.ea.com/en-gb/news/fc-26-goalkeepers)); GRF's keeper
  dives at shots going wide because its "heading for goal" test is 2D with a panic margin, and it sees shots with no
  reaction time (report above, `goalie_default.cpp`, `elizacontroller.cpp`).
- Foot IK in Godot 4.6+: `TwoBoneIK3D` under `SkeletonModifier3D`, targets updated between the mixer and the
  modifier ([Godot](https://godotengine.org/article/inverse-kinematics-returns-to-godot-4-6/),
  [forum](https://forum.godotengine.org/t/help-setting-a-bone-pose/138445)).

## Global Constraints

- Engine changes live only in `native/patches/afc-gameplay.patch` (applied by `native/prepare.sh` after the headless patch).
- Android library: NDK r27c, arm64-v8a, android-24, c++_static, 16 KB pages (see `native/README` build line).
- No change may lower the frame rate on the phone path: the view work must cost < 0.3 ms a frame for 22 players.
- Credits: GRF is Apache-2.0; keep its licence headers.

## Review Focus

- A keeper who now never dives at a shot just inside the post (over-correction): on-target save rate must stay >= 55 %.
- Penalties and 1-v-1s: the depth cap must not apply when the keeper rushes (`GF_KEEPER_RUSH`, one-on-one).
- A human controlling the keeper (none today) - the reaction delay applies to the AI keeper only.
- Foot IK on a sliding tackle or a dive (feet off the ground): locking must switch off when the foot is high.
- Low-end phones: IK must switch off with the FrameGovernor at level >= 4.

---

### Task 1: Measure the keeper and the shots in the engine benchmark

**Files:**
- Modify: `native/src/gftest.cpp`
- Create: `native/bench.sh`

**Interfaces:**
- Produces: a line `KEEPER shots %d on_target %d saves %d goals %d dives %d dives_off_target %d depth_at_goal %.2f`
  printed after `STATS`; `sh native/bench.sh <build dir> <data dir> [seeds] [frames]` prints the sum over seeds.

- [ ] Port EngineStats' shot detector (ball leaves its man at > 12 m/s toward the goal his side attacks, within 36 m,
  arrival < 2.5 s, |y| < 10) to gftest; a save = the defending keeper (player index 0 / 11) gets the ball while a shot
  is live; a dive = the defending keeper's root height `root[2]` drops below 0.55 m while a shot is live
  (off target when the shot's predicted |y| >= 3.66 or z >= 2.44 + 0.4); depth at goal = the scoring side's opponent
  keeper's distance from his goal line when the goal is given, averaged.
- [ ] Run baseline: 6 seeds x 60000 frames, save the numbers in this plan under "Baseline".

### Task 2: A fair keeper (patch)

**Files:**
- Modify: `native/patches/afc-gameplay.patch` (via `$GF/src/onthepitch/player/controller/strategies/offtheball/goalie_default.cpp`,
  `.../controller/elizacontroller.cpp`, `.../humanoid/humanoid.cpp` as found)

- [ ] The "ball heading for goal" test: add the height (bar + 0.3 m) and posts (3.66 + 0.3 m), and cut the panic
  margin to `1.0 + (1 - (defPos*0.6 + vision*0.4)) * 0.15`.
- [ ] Keeper reaction: the keeper's ball prediction lags by `150 + (1 - reaction) * 100` ms (no "premonition").
- [ ] Depth cap: inside 18 m with no one-on-one, the keeper stays within 1.5 m of the line.
- [ ] Acceptance (bench, same seeds): dives_off_target / dives <= 0.25; saves / on_target between 0.55 and 0.78;
  depth_at_goal <= 1.5 m; goals per 90 min between 1.5 and 4.

### Task 3: Sticks that answer at once (patch + view)

**Files:**
- Modify: patch (`humanoidbase.cpp` requeue frame), `scripts/view/engine_match_view.gd` (input), test
  `tests/stick_turn_latency_test.gd` (new)

- [ ] Test: scripted input turns the stick 120 degrees while dribbling; measure frames until the player's yaw has
  turned 60 degrees. Baseline first.
- [ ] Requeue at frame 8 instead of 12 for dribble / jog (not sprint).
- [ ] Acceptance: turn latency down by >= 30 % with no new ball losses in the bench (possession_changes within +5 %).

### Task 4: Grounded feet (view)

**Files:**
- Modify: `scripts/view/player_view.gd`; create `tests/foot_slide_test.gd`

- [ ] Test: in a watched native match, for every foot contact (ankle < 0.12 m high and its speed < 0.6 m/s), the
  ankle's world drift during the contact; report the mean in cm. Baseline first.
- [ ] Foot locking: per leg, `TwoBoneIK3D` (thigh-knee-ankle) whose target is the ankle's world position frozen at
  contact start, blended out over 0.1 s when the foot lifts; off at FrameGovernor level >= 4 and for players > 35 m
  from the camera.
- [ ] Acceptance: mean drift down >= 50 %; `frame_governor_test` and a 22-player frame-cost check (< 0.3 ms) pass.

### Task 5: Real scores on the built-in engine (street, practice, fallback)

**Files:**
- Modify: `scripts/core/team_ai.gd`, `scripts/core/match_sim.gd`; test `tests/match_metrics.gd` (exists)

- [ ] Baseline: goals per 10-minute match over 6 seeds (today 7-9).
- [ ] Defending: the nearest defender to the ball carrier inside 25 m of goal closes him down, the second covers the
  shot line, the back line drops to the penalty spot height when the ball is inside 30 m; shots from > 22 m need
  a clear lane.
- [ ] Acceptance: 2-5 goals per 10-minute match, passes completed >= 75 %.

### Task 6: Ship

- [ ] Rebuild the Android library (NDK line in Global Constraints) and the Linux one; run `tests/run_all.sh`;
  build the APK; push `afc` and `apk`.

## Baseline

(filled in by Task 1)
