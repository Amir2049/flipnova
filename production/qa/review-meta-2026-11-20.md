# FLIPPO build 66 — Play review: Progression & Meta

Date: 2026-11-20 · Reviewer: qa-tester (headless Chromium, Playwright) · Story type: Integration (meta) · Gate: ADVISORY (review)
Evidence dir: `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/meta/`
Setup: returning-player save `{runs:12,tutDone:1,enV1:1,coins:5000,settings:{lang}}`, /supabase.co/ blocked, file:// load.

## Verified OK (reproduced, passing)
- Home 844x390 EN: LV bar, coin chip, streak toast "Day 1 in a row! +25" — coins 5000 -> 5025, FF.save.coins == localStorage == HUD (`home_en_844.png`).
- Skins screen opens in EN/AR at 844x390 and 640x360; AR grid is `direction: rtl`; no JS errors (`skins_chars_{en,ar}_{844,640}.png`, `skins_trails_*.png`).
- Counts: 55 skins / 20 trails; "Collected 1/48" (chars) and "2/13" (trails) — 7 secret/code items correctly hidden and excluded.
- Unlock labels present in both languages for every locked item (level, achievement, stage8, runs N (12/N), streak7 (1/7), stars30 (0/30), boss, nerve40, secs180, week themes, legendAll).
- Buy NEON (150): 5025 -> 4875; owned + equipped; HUD == FF.save == localStorage. Clicking again does not charge. Re-equip FLIPPO / NEON free.
- Shop deal GLOOP (800 -> 560, -30%): charged 560 once; second click shows ✓ and does not charge; main-grid GLOOP shows "Equipped".
- Purchases and equipped skin survive reload.
- Not enough coins (PHARAOH 25000 with 4315): "Not enough coins" toast, no change.

## Findings

### M-01 [S2] The bundle ×3 charges full price for skins you already own
**Repro (2026-11-20, today's bundle = PHARAOH 25000 + NEON 150 + MAGMA 6000 -> 23360):**
1. Save `{runs:12,tutDone:1,enV1:1,coins:40000,owned:{flippo:1,neon:1},settings:{lang:'en'}}`, reload (+25 streak -> 40025).
2. `FF.UI.act('skins')`. The bundle card still reads `31150 ● 23360`, with no reduction for the NEON skin you already own.
3. Tap BUNDLE ×3.
**Expected:** the price drops by the skin you own (or the card says it is partly owned).
**Actual:** 40025 -> 16665 (-23360, the full price). NEON is paid for a second time. The same happens if you own 2 of the 3: you pay the whole bundle for one skin.
**Screenshots:** `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/meta/bundle_partial_before.png`, `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/meta/bundle_partial_after.png`
**Code:** ui.js `renderShop` -> `buy(sh.bundlePrice, sh.bundle.map(...))`. Only `all` owned is checked.

### M-02 [S3] "Bundle bought!" shows when the purchase failed (not enough coins)
**Repro:** same save with coins 5000 -> skins -> tap BUNDLE ×3 (23360).
**Expected:** only "Not enough coins".
**Actual:** "Not enough coins" shows, then "Bundle bought!". Coins stay at 5025 and nothing is granted. The toast is misleading.
**Screenshots:** `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/meta/bundle_poor_toasts.png`, `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/meta/bundle_poor_bought_toast.png`
**Code:** ui.js `renderShop` bundle `card.onclick` calls `toast(t('bundleDone'))` after `buy()` no matter what it returned.

## To check (code-read suspicions, NOT yet reproduced)
- Streak AURORA label uses current `streak.n`, unlock uses `streakBest` — harmless while locked, verify.

## Not checked (turn limit)
Missions box (progress/complete/reward/refresh), achievements list, XP/level gain after runs, coins earned per run, 7-day streak reward & AURORA grant, Daily Remix, trails equip, 640x360 home.

## Ideas
