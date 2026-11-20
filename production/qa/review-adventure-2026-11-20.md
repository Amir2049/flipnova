# QA Review — Adventure (build 66) — 2026-11-20

**Area**: Adventure (js/campaign.js, map via `FF.UI.act('camp')`, results/stars in js/ui.js `campaignResult`/`showResults`, checkpoints in js/game.js)
**Story type**: Integration (UI + rules + save) · **Evidence**: documented playtest, scripts and screenshots in
`/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/review/adventure/` · **Gate**: BLOCKING
**Status**: IN PROGRESS. The reviewer hit a turn limit, so this is a partial report. Anything marked "not checked" was not checked.

## Bugs (reproduced)

None reproduced in play yet. See "To check" (TC-1 is high confidence).

## To check (unreproduced or only checked by data analysis)

- **TC-1 (likely S2): "All coins" star (so 3 stars) looks impossible without a death on the 7 levels with a fork.**
  The `fork` template (js/level.js ~1325) puts gold coins in the risky lane and plain coins in the safe lane. The two lanes
  are split by a solid slab, so you can only take one lane per pass. `coinTotal` counts the coins in both lanes, and
  `campaignResult` gives star 2 only when `coinsTaken >= coinTotal`. On a respawn, coins you have taken stay taken and the
  fork is reset. So you could die and play the other lane, but that costs the "No deaths" star.
  Analysis in the engine (`forkcoins.js` builds each level and counts the coins in each lane) shows these coins can't
  be reached in a single deathless run:
  c1-4: 12 of 82 · c1-5 (Gauntlet): 12 of 126 · c4-1: 4 of 66 · c4-2: 4 of 78 · c4-3: 20 of 71 · c4-4: 8 of 82 · c4-5 (Gauntlet): 12 of 172.
  If this holds, 7 of the 150 stars can't be earned as designed (3 stars per level). That also blocks the "♛ Legend"
  achievement (every star plus Challenge Master). In-play check (bot run on c4-1, then count coins) is pending.
- **TC-2: Owner Shield / god runs still award stars.** `campaignResult` ignores `res.assist`. An owner/god run gets
  "No deaths" and the rewards. Dev-only, so it matters only if testers' saves count. Not played.
- **TC-3: Pause has no "Map" button in Adventure.** The pause screen offers resume/restart/settings/home. Home goes to the
  home screen, not the Adventure map. Read from index.html:87-92, not yet confirmed visually.
- **TC-4: Stale header comment.** js/campaign.js line 1 says "45 hand-built levels (9 worlds x 5)", but there are 50 (Nova Rush is world 10). Cosmetic, code only.
- **TC-5: Results stars show this run, not the best.** `showResults` draws the stars from this run. Replaying a
  3-star level with deaths shows 1 star while the map still shows 3. Possibly intended. Not played.

## Coverage

| Check | Status |
|---|---|
| Map screen: locks, stars, world headers, scrolling | not checked |
| Map AR RTL order | not checked |
| Starting a level | not checked |
| Checkpoints / respawn, coins kept on respawn | code read only (coins stay taken, by design comment) |
| Level-complete screen | not checked |
| 3-star rules | code read + fork analysis (TC-1) |
| First-clear / new-star rewards | code read only: first clear = 25 + 10·worldIndex, +10 per new star |
| Next-level flow | code read only |
| Back/home mid-level | code read only (TC-3) |
| Gauntlet (level 5) | not checked |
| Progress saved after reload | not checked |
| Arabic + English | not checked |
| 640x360 and 844x390 | not checked |

## Ideas
(none yet)
