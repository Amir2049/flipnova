# /team-polish sign-off: Flippo build 66, whole game (2026-11-20)

Active set (team.size raised to `small` on the owner's "everything"): performance-analyst, technical-artist,
sound-designer (audits); fixes implemented by the orchestrator from their reports; hardening by the full test suite.
Not spawned: tools-programmer (no tool-side cause found).
Nothing in the repo reads `production/polish/` — this is a record, not an input to a later gate.

Reports: `whole-game-report-2026-11-20.md` (performance), `whole-game-render-notes-2026-11-20.md` (visual),
`whole-game-audio-notes-2026-11-20.md` (audio). Evidence screenshots: `evidence/`.

## Changes made (owner chose: home look, new-world sounds, new-world readability)
| # | Change | Files | Verified by |
|---|---|---|---|
| V1 | AR home boss sprite no longer collapses to a sliver every 1.6 s (`scale: -1 1` instead of a transform the float animation overwrote) | css/style.css | width constant over 8 samples at 640/844 AR (28/37 px) |
| V2 | EN home boss sprite no longer clipped on its left edge | css/style.css | art box inside card at 640/844 EN |
| V3 | Home moon: pixel disc with craters instead of a crescent cut with dark rectangles (was a tan square on desert/nebula/jungle skies) | js/homebg.js | screenshots night/dusk AR/EN |
| V4 | Wind zones: dark line inside each edge, chevrons with a dark 1 px shadow, streaks .5→.75 | js/game.js drawWind | desert-wind-zone.png |
| V5 | Reduce flashes: wind streaks / float bubbles halved and slowed, totem glow steady | js/game.js | code path (render-only) |
| V6 | Totem: dark outline, wider arrow head, brighter glow while you're about to pass it (reads p.x, writes nothing) | js/game.js drawTotem | jungle-totem.png |
| A1 | Entry sounds for TAILWIND / HEADWIND / FLOAT / HEAVY zones (noise, clicks, thumps — no tones) | js/audio.js, js/game.js | all 4 fire in sim runs; RMS within ±1 dB of the flip or quieter |
| A2 | Totem has its own stone knock and says FLIP! (was the pad's sound and BOING!) | js/audio.js, js/game.js | fires 4× in jungle runs; RMS −19.2 dB vs flip −20.2 |
| A3 | SFX volume slider previews with the flip (was the coin, the quietest sound) | js/ui.js | — |

Levels measured offline (RMS dB, same synthesis as the game): flip −20.2 · pad −19.1 · coin −27.8 · windTail −25.1 ·
windHead −19.7 · fieldFloat −24.5 · fieldHeavy −19.6 (lowered 3 dB after the first measure) · totem −19.2.

## Hardening
- Full suite, serially: 23/24 pass (skins39 needs gift codes typed by hand) — incl. human-test "ALL HUMANLY FAIR",
  run-proof (replays still verify), boss 16/16, death-tip, rotate, offline, save-compat.
- qa-click-through: 5 sizes × AR/EN, 0 JS errors, 0 screen errors. dist/Flippo.html smoke AR+EN: 0 errors.

## Result: NEEDS MORE WORK
- **Weekly Boss in HD is over the assumed budget** (assumed 60 fps / 16.7 ms, not committed by the owner): at 4× CPU
  throttle the intro p95 is 66.6 ms (max 216.7 ms, 14% of frames over 33 ms) and the fights p95 33.3 ms (~7% over 33 ms).
  S3 — the HD quality governor already steps down to pixel mode, so it plays, but the start of the duel stutters.
  The owner chose not to touch the boss in this run. Optimisation list (hdboss.js quality/governor, intro bake spikes)
  is in the performance report, handed to `/dev-story`; verify with a CPU profile first.
- Not assessed: real devices (headless CPU only, no GPU/WebView), heap soak and DOM growth, visual items 7–9
  (spike contrast on the new worlds, palette collisions, nebula rocks), audio proposals 4–10 (NERVE tier sound,
  stage/milestone split, boss-moment loudness), performance budgets (none committed in project.yaml).
