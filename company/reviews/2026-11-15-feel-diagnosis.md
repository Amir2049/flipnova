# FLIPNOVA: where the core loop stands (read-only diagnosis, no gameplay changed)

Written 15 Nov 2026 while Amir rests. Back to work Tuesday 17 Nov. Source: js/core.js, js/game.js (doFlip).

## What the one-tap loop is today
- One input: flip gravity. Physics: G=2600, terminal 460, FLIP_KICK=60, fixed 1/120 s step.
- Flip cooldown 0.07 s. Locked zones reject the flip (shake + sfx).
- Perfect Flip: simulate "no flip", if death within 0.26 s and the flip saves you, it is Perfect.
- Feedback on Perfect: slow-mo 0.14 s, 10 particles, "PERFECT!" popup, streak -> Flip Echo at 3.
- Feedback on Near Miss: slow-mo 0.10 s, popup.
- Plain flip: screen flash, squash, flip sound, vibrate 6 ms.

## Honest read
1. The skill expression (Perfect/Near Miss) is detected by the game, not felt by the player. The player gets a popup and a short slow-mo, but nothing in the world physically reacts.
2. A plain flip and a Perfect flip look almost the same for ~0.1 s. The reward is a number, not an image.
3. There is no moment of tension that the player creates themselves (no risk they choose). Death is always "I mistimed", never "I gambled and won".
4. Content added since (45 stages, 9 worlds, boss, story) sits on top of this same flip. If the flip does not feel good, more content will not fix it.

## Candidate experiments (each is ONE change, reversible, never makes the game easier)
A. Perfect flip gets a real physical payoff: a 2-frame hit-stop, a white shockwave ring from the player, and a brief zoom punch (camera scale 1.0 -> 1.04 -> 1.0). Pure feedback, no rule change.
B. Risk reward: a "close shave" lane. Coins placed in the dangerous half of a gap pay x3. Player chooses to gamble. Needs level-data changes.
C. Momentum: consecutive Perfects slowly raise run speed a little and drop it on a miss. The streak changes how the game plays, not only the score.

Recommendation: try A first (smallest, 10 minutes of play to judge), then C if A is not enough.

## Rules respected
No ads, no music, no easier difficulty, no fake numbers. Nothing here is merged into the shipped build.
