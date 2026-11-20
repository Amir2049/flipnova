# Review: first-time player + Settings + save (build 66) — 2026-11-20

**Story type**: Integration / UI (headless Chromium play-through) · **Output**: this file + screenshots in
`/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/settings/` · **Gate**: ADVISORY (review, not a gate run)

Status: PARTIAL — written at the turn limit. So far the code has been read (js/ui.js save/settings/back/code-box,
index.html); browser runs are being added below as they are reproduced.

## Findings (reproduced in the browser)

### F1 — S2 · Android back from the progress-code box during a pause lands on Home with the run still alive behind it
**Steps** (844x390, returning save `{runs:12,tutDone:1,enV1:1,settings:{lang:'en'}}`): `FF.UI.act('play')` → wait 0.8 s →
`FF.UI.pause()` → `FF.UI.act('settings')` → click 💾 **Copy** (`[data-act2=saveOut]`) → `FF.UI.back()` (→ Settings, correct) →
`FF.UI.back()` again.
**Expected**: back to the Pause menu (Settings was opened from Pause).
**Actual**: `UI.screen === 'home'` while `UI.game` is still set (`paused:true, ended:false`), pause button hidden. The frozen run is
drawn behind the home menu and its HUD score ("38") sits over the home header. A third `FF.UI.back()` stays on Home. The run is
silently abandoned (no result, no restart). Also reproduced with 💾 **Restore** and with 🎁 **Code** (wrong gift code
`NOPE-123` → toast → `FF.UI.back()` ×2 → Home with `UI.game` alive) — script `t2.js`, screenshot `b2-gift-wrong.png`.
**Cause** (js/ui.js:2522 + 2468): `UI.back` on codeBox calls `UI.act('settings')`, and `ACT.settings` recomputes
`settingsReturn` from `UI.screen`, which is `'codeBox'` → `'home'`. The on-screen ← (`codeBack`) does not have this bug.
**Screenshot**: `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/settings/b1-back-from-code-in-pause.png`
**System**: UI / navigation (js/ui.js `UI.back`).

### F2 — S3 · "Guides" switched on from the pause menu does nothing for the current run
**Steps**: returning save → Play → `FF.UI.pause()` → Settings → click **Guides** (`[data-sw=guides]`) → ← back to Pause → resume.
**Expected**: guide marks appear in this run (every other in-run setting — reduce flashes, vibration, ambience — is read live).
**Actual**: `save.settings.guides === true` but `FF.UI.game.guides === false`; it only applies from the next run.
**Cause**: js/game.js:132 caches `this.guides` in the constructor; `settingsBack` only swaps `UI.game.settings`.
**Evidence**: script output (no visual; value check) — `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/settings/t1.js`.
**System**: Game (js/game.js).

### F3 — S3 · No privacy policy link anywhere in the game
**Steps**: open the game, check Home, Settings, How to play; `document.querySelectorAll('a,[data-act]')` filtered for
"privacy"/"خصوص" → **0**. `privacy.html` exists in the repo, nothing links to it (grep over index.html, js/, css/ also 0).
**Expected**: a Privacy link in Settings (the game sends names/scores to a server; stores require it reachable in-app).
**Screenshot**: `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/settings/b5-settings-no-privacy.png`
**System**: UI (Settings).

## Checked and OK
- All 8 Settings switches + 2 sliders (sfx 0.2, ui 0.1, mute, ambience, vibration off, reduce flashes, colour-blind, guides,
  hand=left, lang=ar) survive a reload and are applied on boot (`FF.cbMode`, `FF.audio.vol`, `#pauseBtn.left-hand`,
  `<html dir=rtl lang=ar>`). Screenshot `b3-settings-ar-after-reload.png`.
- Progress code: 4 bad inputs (one changed character, truncated, `FNSAVE:!!!`, empty) → "That is not a progress code", save
  untouched (coins stay). The real code with surrounding spaces/newline restores coins 777, name, runs, lang ar, cb.
- Wrong gift code with the server blocked → "Checking the code…" then "This code needs internet…" (not "not valid"); the game
  cannot tell offline, acceptable.
- Name box: Arabic kept, all-spaces → empty (falls back to FLIPPO), 40 chars → 14, `<b>x</b>…` stored as text (only
  `textContent` paths found for the name).

## To check (found by reading the code, NOT yet reproduced in the browser)

1. ~~Back from the progress-code box~~ → reproduced, see F1. Pause → Settings → 💾 Copy (or
   Restore) → Android back (`FF.UI.back()`). `UI.back` calls `UI.act('settings')` for codeBox, and
   `ACT.settings` sets `settingsReturn = UI.screen === 'pause' ? 'pause' : 'home'` — but `UI.screen` is
   `'codeBox'` at that moment, so `settingsReturn` becomes `'home'`. The next back/← from Settings then shows
   Home while `UI.game` (the paused run) is still alive. The on-screen ← in the code box uses `codeBack`, which
   does not reset `settingsReturn`, so only the Android back path is affected. (js/ui.js:2468, 2522)
2. Gift code path → reproduced as part of F1.
3. ~~Guides from pause~~ → reproduced, see F2. `game.guides` is
   computed once in the Game constructor (js/game.js:132); `settingsBack` only swaps `UI.game.settings`.
   Reduce flashes / vibration / ambience are read live from `settings`, so they do apply.
4. **Name with emoji — checked, NOT a bug in Chromium**: `maxlength=14` refuses a 2-unit emoji as the 14th unit, so no lone
   surrogate is stored ("ABCDEFGHIJKLM😀" → "ABCDEFGHIJKLM"; the emoji is silently dropped). Original note: `#playerName` input handler does `.trim().slice(0, 14)` on
   UTF-16 code units (js/ui.js `playerName` input listener + `saveName`); a 13-char name followed by an emoji
   stores a lone surrogate (shows as �) on the board/results. `maxlength="14"` also counts code units.
5. ~~No privacy link~~ → reproduced, see F3. `privacy.html` exists in the repo but no
   element in index.html or js/ links to it (grep "privacy" over index.html, js/, css/ finds nothing). Settings
   has only How to play, 🎁 Code and the credit line.
6. **Slider moves send `setVolumes({sfx, ui})` without `muted`** — harmless because `Object.assign` keeps the old
   value; listed only so it is not re-raised.

## Not checked yet

- (a) brand-new player: first-open language (code says English: `enV1` forces `lang='en'`), tutorial stuck/skip,
  hidden-until-5-runs/stage-3 home, how-to screen — at 640x360 and 844x390, Arabic + English.
- (b) every toggle persisting over reload; progress code copy → wipe → restore and a corrupted code; wrong gift
  code; name entry (empty, very long, Arabic, `<b>x</b>`).
- (c) pause resume / restart / home; `FF.UI.back()` on every screen.

## Ideas

_(none yet)_
