# Review: Level Maker + Zen Practice + level codes (build 66)

Story type: Integration (play review) · Evidence: screenshots in the scratchpad (paths below) · Gate: ADVISORY (exploratory review)
Harness: Playwright/chromium, supabase.co blocked, returning-player save `{runs:12,tutDone:1,enV1:1,settings:{lang}}`.
Scripts and screenshots: /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/

## Status (in progress)
| Area | EN 844x390 | AR 844x390 | 640x360 |
|---|---|---|---|
| Maker button visible for returning player | PASS | PASS | not checked |
| Level list with 0 levels | PASS (empty note shown) | not checked | not checked |
| Place / undo / erase / undo-erase | PASS | PASS | not checked |
| Bot verify (beatable level) | PASS | PASS (Arabic message) | not checked |
| Exit saves level, list shows it, AR RTL list | PASS | PASS | not checked |
| Test-play, rename, delete, share/export | — | not checked | PASS except M-1, M-3 |
| Import valid / invalid / garbage / long / FLIPFRENZY: | PASS (garbage, bad base64, empty: "Invalid code"; FLIPFRENZY: and code inside a sentence import; 38 KB code capped at 800 items/4000 len; `<img onerror>` name shown as text, no script) | not checked | — |
| Remix, featured verify, back button mid-edit | — | not checked | Remix works ("… RMX", unverified); back saves (M-4) |
| Zen | not checked | not checked | not checked |

No console/page errors beyond the expected blocked-network `ERR_FAILED` lines.

## Reproduced problems

### M-1 (S2) Undo after Save forks the level into a duplicate and throws away the rename
Undo snapshots the whole level object, including `id` and `name`. Undoing to a snapshot taken before the first Save puts `id: null` and the old name back, so the next Save / Test / Exit stores a **second** level.
Steps (EN, 640x360, script t4.js):
1. Level Maker > + New level. Spike tool: tap twice on the track (2 items).
2. Type a new name in the name box ("RENAMED LEVEL 123456"), press Save (disk icon). The list now has 1 level with that name.
3. Press the speed button (120 > 140), then press Undo.
4. Press "here" (test from here) or X.
Expected: speed back to 120, the level keeps its name and stays one entry.
Actual: name box shows "MY LEVEL" again, one spike is gone too (see M-2), and the list has **two** levels: "MY LEVEL" (the one being edited) and "RENAMED LEVEL 123456" (orphaned copy).
Evidence: /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en640-levels-after.png (two entries), /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en640-editor.png.
System: Level Maker (js/editor.js `snapshot`/`undoLast`, js/ui.js `saveLevel`).

### M-2 (S3) Undo after a speed change undoes the last placed item as well
Speed (and world) changes do not take a snapshot. Undo then jumps to the state before the last placement: speed goes back **and** the last piece disappears.
Steps: New level, place 2 spikes, press speed (120 > 140), press Undo.
Expected: only the speed reverts (or only the piece). Actual: speed 120 and items 2 > 1 in one press.
Evidence: t4.js output `speed 140 after undo [120, 1 item]`; /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en640-editor.png.
System: Level Maker.

### M-3 (S3) Delete confirmation never expires: one tap deletes a level later on
`pendingDelete` is set by the first trash tap and never cleared.
Steps (EN 640x360): Level Maker, tap trash on the top level once (toast "Tap again to delete"), go Home, come back to Level Maker, tap the same trash once.
Expected: the confirm toast again. Actual: level deleted on that single tap (2 > 1 levels, no confirm).
Evidence: /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en640-after-delete.png; t4.js `del1 2` / `del2 1`.
System: Level Maker list (js/ui.js `renderLevels`).

### M-4 (S3) Leaving the editor always saves: empty levels and unwanted Remix copies pile up in "My levels"
Steps A: Level Maker > + New level > X immediately. Result: an empty "MY LEVEL" (0 items) appears in My levels. Evidence /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en-empty-exit.png.
Steps B: Featured > Remix on VOLCANO RUN > Android back (`FF.UI.back()`). Result: "VOLCANO RUN RMX" saved to My levels without the player pressing Save.
Expected: nothing saved when nothing was placed / changed (or ask). System: Level Maker (`ED.exit`).

### M-5 (S4) Imported names are cut from 24 to 20 characters on first edit
`E.decode` keeps 24 characters, the editor (`#edName` maxlength 20, `saveLevel`) keeps 20.
Steps: import a code whose name is "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123" > list shows "ABCDEFGHIJKLMNOPQRSTUVWX" (24) > ✎ > X > list now shows "ABCDEFGHIJKLMNOPQRST" (20).
Evidence: t3.js output; /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en-levels-many.png. System: level codes.

### M-6 (S4) A code with a non-numeric y imports invisible pieces that still pass "Verified"
`E.decode` checks x with `isFinite` but not y: `s20.abc` imports as `{k:'spike', y:null}`. The spike and coin draw nowhere, the bot verifies the level, and re-sharing writes `.null`.
Steps: import `FLIPNOVA:` + base64 of `FF1|NANY|nope|abc|xyz|s20.abc,c30.zz,zz,s,b40,q50.150`. Imported (4 items), ✎ shows only the wall, Verify > "The bot beat it!". No crash, no console error.
Evidence: /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/maker/en-nan-editor.png. Only hand-made codes do this. System: level codes.


## To check (suspicions from reading js/editor.js + js/ui.js, not yet reproduced)
- Name length mismatch: `E.decode` keeps 24 chars, `#edName` maxlength and `saveLevel` cut to 20 -> an imported 21-24 char name gets silently cut on first edit/exit.
- `E.decode` with a non-numeric y (`s20.abc`) gives `y: NaN` (FF.clamp does not catch NaN; only x is checked with isFinite) -> possible broken render/physics.
- Exit (X / Android back) always saves: opening "+ New level" and leaving immediately creates an empty "MY LEVEL"; Remix of a featured level then back also saves a copy.
- Undo mixes edits: speed change does not snapshot, so Undo after (place item -> change speed) reverts both.
- Delete confirm (`pendingDelete`) never resets: tap delete once, come back much later, one tap deletes.
- At default camera (camX 24) the START ghost/label is drawn off-screen (sx = -24), so the start marker is not visible when the editor opens.
- Zen: `save.runs++` / totalDist / m1000 achievement may be earned in a can't-lose mode, if a zen result is ever recorded.

## Ideas
(to be added)
