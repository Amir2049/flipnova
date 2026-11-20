# Review — Weekly Boss duel (INFINITY VOID vs THE CRIMSON TYRANT) — build 66 — 2026-11-20

Story type: Integration (boss.js / hdboss.js / bossworld.js / ui.js). Evidence: a documented headless playtest. Gate: ADVISORY (review).
Method: headless Chromium (Playwright), file:///home/user/flipnova/index.html, supabase.co blocked, returning-player save
`{runs:12,tutDone:1,enV1:1,settings:{lang}}`. Scripts and screenshots are in
/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/boss/

STATUS: PARTIAL. The coordinator stopped the run at its turn limit. Parts marked "not checked" were not played.

## Coverage

| Area | Status |
|---|---|
| Home boss card (EN/AR, 844x390 and 640x360) | checked |
| Reward ladder on the home card | checked: **not visible** (BUG-A) |
| Intro → FIGHT (EN, 844x390, real time) | checked: intro 3.4 sim s, then mode `fight` with the "FIGHT!" banner. No page errors. |
| Hearts (the first seconds, no input) | partly checked: hearts 3→2→1, then back to 2 at t≈15 s (a heart refill, likely a seal or orb pickup; not verified) |
| 3 phases / 5 dimensions, checkpoints, seal orbs, clash QTE, counter, ULT | not checked by hand. The existing tools/boss-test.js covers these automatically; I did not re-run it. |
| Defeat cinematic, win/loss result screens | not checked |
| Retry/again, pause/back mid-fight | not checked |
| Arabic DOM stage banner during the fight | not checked |
| 640x360 in-fight | not checked |

## Bugs (reproduced)

### BUG-A — The home boss card hides the reward ladder, the best result and the weekly stats — S3
- **Steps**: 1. Save `{runs:12,tutDone:1,enV1:1,settings:{lang:'en'}}` and reload. 2. Look at the home screen at 844x390 (or 640x360, EN or AR).
  3. Read `#bossRw`, `#bossStat` and `#evTitle` inside `#eventCard .evCard.boss`.
- **Expected**: The card shows this week's reward ladder ("🎁 OVERCLOCK PHASE 2 · PHASE 3 · DEFEAT" with ✓ for each step earned), the player's best
  ("⚔️ Best: N% damage" / "🏆 Best: time · N× defeated") and the VS title. ui.js `bossCard()` fills all of these every 30 s.
- **Actual**: All of these elements measure 0x0. Only "⚔️ BOSS · WEEK 47" and the countdown are visible. The cause is
  `css/style.css:731`: `.doors .evCard.weekBoss .evTitle, .doors .evCard.weekBoss .evRank, .doors .evCard.weekBoss .evGo { display: none; }`
  (`#bossStat` and `#bossRw` are both `.evRank`). The player cannot see the gear the duel pays out, or their progress, before or after a fight.
  The only reward feedback is a toast after the fight.
- **Frequency**: 4/4 (EN/AR x 844x390/640x360).
- **Screenshots**: /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/boss/home-en-844.png, home-ar-844.png, home-en-640.png, home-ar-640.png (same folder)
- **System**: ui / css (home card). This may be a deliberate "doors" layout choice. If so, the ladder needs another home.

## To check (not reproduced)
- **Week rollover during a fight.** At test time the card showed "⏳ 12m" left (Fri 17:48 UTC). `bossEnd()` calls `bossSave()`, which resets
  `save.boss` when `FF.bossWeek().key` has changed. A fight started in week N and ended in week N+1 would therefore be credited to N+1.
  `bossRewards()` keys the gear on `FF.weekInfo().key`, not on `FF.bossWeek()`, so if those two keys differ the ladder could award the wrong week's gear.
  Needs a Date-mock test.
- **Arabic ladder text.** In AR the hidden ladder reads "🎁 OVERCLOCK المرحلة ٢ …". The gear name `FF.WEEK_GEAR[th].name` is not translated,
  and this mixes LTR inside RTL. Hidden today (BUG-A), but it would show once the ladder is made visible.
- **Arabic banner timing.** The Arabic DOM banner is cleared by a real-time `setTimeout((len||1.5)*800)`. When the game is paused while a banner
  is up, the banner probably disappears during the pause, while the canvas banner (sim time) does not. Not played.
- **`FF.UI.screen` during the fight.** It reads `null` during the fight (not 'game'). This was only noticed, not investigated.

## Ideas (not bugs)
1. Show the reward ladder on the home card. A compact row of 3 pips (P2 / P3 / DEFEAT) with ✓ fits the door layout.
2. Show "best: N% · phase X/3" on the card, so a returning player knows what they are chasing.
3. Show a "last hours" warning on the card when under 1 h is left (the `.urgent` class exists; at 12 m left it read only "12m").
