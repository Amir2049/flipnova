# QA Strategy: FLIPPO build 66 (14.1), 2026-11-20

Scope is the whole game in 9 areas, each treated as a story. `qa.level` is unset, so this uses `standard`. Logic and Integration areas need test evidence. UI and Visual/Feel areas need retained screenshots in `production/qa/evidence/`. That folder does not exist yet.
I wrote this under a turn limit. Anything marked "not checked" was not verified.

## Smoke check: UNKNOWN
There is no `production/qa/smoke-*.md`. Nothing here proves a smoke pass. The 14 green automated tests and `tools/qa-click-through.js` (5 sizes x AR/EN, no JS errors) are strong signals, but they are not a smoke report. Run `/smoke-check` before any manual QA hand-off. Until it runs, the build is not cleared for manual QA.

## Area table
"Blocker?" means a gate is unmet or a real risk is open. It does not mean a bug was found.

| # | Area | Primary type | Existing automated cover | Still manual or scripted | Blocker? |
|---|---|---|---|---|---|
| 1 | Home and navigation | UI | qa-click-through; first-minute-test; endless-start-test. redesign-test is partly stale (see below). | Retained screenshots, AR and EN, 5 sizes. Boss card against the Adventure card. Tap-target sizes. | Y: no retained screenshots (not checked). Level Maker and Zen are 20-22 px tall (S4, open). |
| 2 | Endless run | Logic (mixed with Visual/Feel) | test.js, human-test ("ALL HUMANLY FAIR"), crowd-test, endless-start-test, run-proof-test, legend-test | Feel of the 3 new b61 worlds (wind, nebula float/heavy, totems). NERVE, PERFECT and frenzy feedback. Low-end performance. | N for logic. The b61 world visuals have no retained evidence (not checked). |
| 3 | Death / results | Logic and UI | death-tip-test (new), share-card-test, run-proof-test | Replay of the last 3 s. Tap-anywhere against PLAY AGAIN. The mission line in AR. Results layout at 640x360. | N. The death-tip fix has a test. |
| 4 | Adventure | Integration | campaign-test (50 levels cleared by bot), save-compat-test | Star counting up to 150. Checkpoint restore. Map screen with a partial save. Human-feel of the harder levels. | N |
| 5 | Weekly Boss | Integration (with Visual/Feel) | boss-test: 15 of 16 checks true (only the `fx` counter is undefined) | Real-time play of all 3 phases. ULT. Clash. Week rollover (Friday 20:00 Cairo). Card layout in AR and EN. | Y: Visual/Feel evidence missing. The boss sprite over the countdown was fixed this session and needs a retained screenshot. |
| 6 | Level Maker and Zen | Integration | maker-app-test; editor-test (stale, but featured-level bot verify passed) | Build, test, bot verify, share-code round trip on a real device. The new-player gate. | N. See the gating note under the failing tests. |
| 7 | Settings and save | Logic and Config/Data | save-compat-test (3 build-21 saves) | Restore a progress code that is corrupted, truncated or from a newer build. Language toggle mid-run. Reduce-flashes and colour-blind visuals. | N. The mirrored AR achievement popup is unverified, so run an AR achievement unlock on 5 sizes. |
| 8 | Shop, missions, achievements, leaderboard | Integration | online-test, cleanup35-test, run-proof-test | Unlock rules for 55 skins and 20 trails. Offline leaderboard fallback with the server blocked. Replay verification against a tampered proof. | N for gates. skins39-test cannot run (needs gift codes), so skin unlock rules by code are not checked. |
| 9 | Platform | Integration | sw-files-test (new), qa-click-through for sizes | Portrait "turn your phone" screen on a real device. Offline cold start after a service-worker update. **Android APK on a real device: not checked.** | Y: the APK wrapper has no evidence at all. |

## Highest-risk manual checks (real-player paths)
1. **Fresh-install first minute** (areas 1 and 2). Clear storage and launch. Level Maker and Zen must stay hidden until 5 runs or best stage 3. Check the transition. Check that the weekly boss card and PLAY work before the tutorial finishes.
2. **Death tip accuracy** (area 3). Die on a ground hazard, in the air tunnel, and in each b61 world. The tip must match the real killer. The old bug misreported 94% of Endless deaths, so sample at least 20 deaths.
3. **Arabic RTL sweep** (areas 1, 3, 5, 7). Open the boss card, results, achievement popup and settings in AR on 640x360 and on tablet. The popup must not be mirrored. Week-number tags must not overflow. This is the open S4 candidate.
4. **Save round trip** (area 7). Copy a progress code on build 66, wipe, restore, then confirm skins, camp stars and best score. Repeat with a build-21 save.
5. **Offline and update** (area 9). Load once online, go offline, hard reload. Everything must run, with the leaderboard falling back to offline. Then ship a new `sw.js` version and confirm the old cache is dropped. The old cache listed deleted files.
6. **Boss duel end to end** (area 5). Win, lose, and quit mid-phase. Confirm the checkpoint after each phase, hearts persist, and the reward ladder unlocks.
7. **Phone sizes** (area 9). 640x360, 844x390 and a tablet. Rotate to portrait and back during a run, which must pause and not crash.

## The 11 pre-existing failing tests: real bug or outdated test?
I ran all 11 on b66. Parallel runs collided on mock-server port 8798, which gift-test and book-publish-test both use. I re-ran book-publish alone and re-ran cleanup35 serially.

**Verdict: none of the 11 hides a confirmed game bug.** Nine are stale tests, one needs data, and one (cleanup35) did not fail for me.

| Test | Verdict | Evidence |
|---|---|---|
| redesign-test | Outdated assertion. Remaining checks: not checked. | The `acts.includes('story')` assertion (about line 101, line not pinned) expects the removed STORY door. The 8 Legend and 1% checks passed. My run was killed at 280 s under parallel load (exit 124), so the layout checks never ran. Re-run it alone. |
| niro-test | Outdated | `niro-test.js:35` waits for `#home [data-act=story]`. The printed door state was `shown:false`. |
| editor-test | Outdated, with a design question | `editor-test.js:15` clicks `[data-act=levels]`, which exists but is not visible. `css/*.css` has `#home.newbie .minis .mini { display:none }`, set at `js/ui.js:468` while runs < 5 and bestStage < 3. The featured-level bot verify did pass (5 of 5 `ok:true`). |
| review-test | Outdated, feature removed | `review-test.js:22` clicks `[data-act="review"]`. There is no player-review code in `js/ui.js`, `js/online.js` or `index.html`. The only "review" hits in `js/stagemaker.js` (line 558) are the unrelated `reviewDraft` publish flow. |
| weekly-test | Outdated | `weekly-test.js:22` reads `#weekStat`, which is null on the current home (the old weekly-run card is gone). |
| weekly2-test | Outdated expectations. One open question. | Only `run1` (`weekly2-test.js:120`) and `results` (`:154`) fail. `card`, `board`, `daily`, `arabic` and `last` pass. `results` expects "Reach stage 6 ... ECLIPSE character", but the game now shows "Reach stage 3 this week: ECLIPSE trail". `run1` expects stage >= 3 from a bot capped at x<6300, and the bot ended at stage 2. |
| boss-test | Outdated or missing test hook | 15 of 16 checks are true (hearts, checkpoint, clashLose, defeat, arabic and more). Only `fx` is undefined. I did not read where `fx` is meant to come from. |
| gift-test | Outdated timing, reproduced | With the test's 700 ms waits, the evil-code toast reads "Checking the code...". With 4500 ms waits (scratchpad copy) it PASSES: "That code is not valid", the g_test skin stays equipped, and the maker gift unlocks. The cause is the b35 one-toast-at-a-time queue. |
| book-publish-test | Outdated, real path not tested | Run alone, `r.id` equals the built-in id. `js/online.js:233-238` (`useBook`, with `O.BOOK_MIN_STAMP` and `fresh`) drops any book without a stamp. The test calls `Online.publishBook` with an unstamped draft. The real UI adds `stamp: Date.now()` at `js/stagemaker.js:634`. Owner-only tool. |
| cleanup35-test | Not reproduced | Exit 0 and no failures in 3 runs (1 parallel, 2 serial). The "fails identically on b65" claim did not hold for me. It may be flaky or timing-dependent. Unexplained. |
| skins39-test | Not runnable | It needs 4 old and 4 new gift codes. Skin unlock-by-code is not checked. |

### Open points that could still be real bugs
- **Weekly run entry point: not confirmed.** `startWeekly` (`js/ui.js:706`) and the `weekly` act (`:2667`) exist. I found no `data-act=weekly` button in `js/ui.js` or `index.html`. If the weekly run (twist, ghost, board) has no player entry, the code is dead. If it is meant to be reachable, it is a gap. Ask the owner. Not checked beyond grep.
- **Game never played in the weekly2 failures.** Whether stage 3 is reachable at the bot's distance depends on stage lengths in the b61 stage book. Not checked.
- **Level Maker gate.** A new player cannot reach the Maker until 5 runs or stage 3. This looks intentional (the build 33 comment at `js/ui.js:468`). It needs product confirmation, and editor-test needs updating either way.
- **Toast queue delays errors.** A "code is not valid" message waits behind queued toasts. Minor UX, S4.
- **Dead story code.** `js/ui.js` still has the STORY strings (lines 120-131), the unlock hooks (1163, 1179), the story start branches (1342-1348), the story screen (about 1494-1617) and the `story` act (2669). There is no `js/story.js`, and `FF.BossLevel` and `FF.TyrantLevel` are never defined, so `main.js:91` guards on them. `js/boss-niro.js` (835 lines) is still loaded at `index.html:262`. Anything that triggers the `story` act after `needsTutorial()` clears would hit missing objects. I did not test calling `FF.UI.act('story')`. Recommend a dead-code removal story with a regression run.

## Recommended actions, in order
1. Run `/smoke-check` on b66 and file the report.
2. Re-run redesign-test alone, with no parallel load, to see whether any real layout check fails.
3. Fix the stale tests (story door, weekly card, review, stamp, toast timing, Maker gate) or retire them, so the suite is trustworthy. Run tests serially, or give each its own port.
4. Capture retained screenshots into `production/qa/evidence/` for areas 1, 5 and the b61 worlds.
5. Do the APK real-device pass for area 9.
6. Confirm the weekly run entry point and the Maker gating with the owner.
