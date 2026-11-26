# Real football as the yardstick (2.62)

The owner asked for "excellent foundations". Every gameplay number in AFC is measured against real football data,
not against a feeling. The game is measured with `gftest` (native/src/gftest.cpp) on the same engine the phone runs.

## The yardstick

| Measure | Real football | Source |
|---|---|---|
| Shots scored, inside the box | 14.7 % (central box ~16 %, wide ~6 %) | Opta, Premier League 2024/25; Opta Pro Forum (Woolcock) |
| Shots scored, outside the box | 4.2 % (older seasons 2-3.4 %) | Opta 2024/25; StatsBomb |
| Shots scored, all | ~11 % | Opta / StatsBomb (13.1 % inside the box over five seasons) |
| Shots on target | ~33-35 % (a quarter of shots are blocked) | Opta, StatsBomb |
| Keeper saves of shots on target | ~66-70 % | Premier League seasons (FourFourTwo, Opta) |
| Goals a match | ~2.7 | league averages |
| Pass, initial ball speed | ~16 m/s typical; side-foot / instep peaks 23-28 m/s | tracking-data studies (arXiv 2210.16474, 2607.27838) |
| 180 deg turn with the ball | ~0.5-0.7 s | change-of-direction tests (505 test) |
| Pass types | ground, driven ground, lofted ground, lob, driven lob / cross, through, lofted / lobbed / driven through | EA FC passing guide |

## Where AFC stood and what changed

| Measure | Before | After | How |
|---|---|---|---|
| Goals a match (CPU v CPU, real squads, 8 matches) | 3.6 | 2.75 | every shot carries an error floor (0.25) and a defender within 2.5 m adds up to 0.25 more (`humanoid_utils.cpp`, the engine had neither) |
| Goals per shot | 18 % | 14 % | same |
| Shots on target | 57 % | 52 % | same (the engine rarely blocks shots, so the gap to 33 % is partly blocks) |
| Close-shot goals v an Amateur CPU | 44 % | 30 % | the keeper keeps at least the 0.85 level at any difficulty (`player.cpp`, `playercontroller.cpp`) |
| Long power shots v Amateur | 7 % | 0 % | same |
| Turn on the ball, moving back (human's player) | 0.61 s | 0.53 s | agility 1.0 / acceleration 0.8 for the human's player only (`humanoidbase.cpp`) |
| Shot placement | 90 deg of stick to reach the post | 45 deg | stick angle doubled for the human's shots (`humancontroller.cpp`) |
| Driven ground pass | - | 23.6 m/s (normal 17.6) | `e_PlayerCommandModifier_AfcDriven`: x1.25 on the grass |
| Driven cross | - | 21.4 m/s, upward 4.5 (normal 18.0, 6.9) | x1.12 and 0.6 of the height; first-time shots off crosses 15 % -> 37 % |

## gftest switches added

- `GF_RIGHT_DIFF=0.3` the CPU at a game level with the human's side full; `SHOTGOALS` goals per shot by distance.
- `GF_SHOT_AIM=deg` shots with the stick off the goal; GOALLINE prints where shots cross (`mean y`).
- `GF_PASS_DRIVEN=1` passes with a flick down; `PASSSPEED` the struck pass's speed and upward speed.
- Tunables (defaults shipped): `GF_SHOT_FLOOR` 0.25, `GF_SHOT_PRESS` 0.25, `GF_KEEPER_MIN` 0.85, `GF_HUMAN_AGIL` 1.0,
  `GF_HUMAN_ACCEL` 0.8, `GF_SHOT_AIM_K` 2.0.

## Still apart from real football

- Shots on target 52 % v ~33 %: the engine's defenders almost never block a shot. A block model is the next lever.
- Shots a match ~19 v ~25.
- Facing back in a turn is bound by the turn clips' length (~0.32 s): new clips (mocap) would move it.

## Sources

- [Premier League: why are players shooting less from long range (Opta, 14.7 % / 4.2 %)](https://www.premierleague.com/news/4272809)
- [Opta Pro Analytics Forum, Woolcock (shot-type conversion tree)](https://de.slideshare.net/TheWoolster/woolcock-opta-pro-analytics-forum-with-links)
- [StatsBomb: Is long range shooting a bad option?](https://blogarchive.statsbomb.com/articles/soccer/mythbusting-is-long-range-shooting-a-bad-option/)
- [The Analyst: what is expected goals](https://theanalyst.com/eu/2023/08/what-is-expected-goals-xg/)
- [FourFourTwo: Premier League keepers by save percentage](https://www.fourfourtwo.com/features/ranked-every-premier-league-goalkeeper-based-their-save-percentage-201718)
- [The Analyst: Premier League goalkeeper stats 2024/25](https://theanalyst.com/eu/2025/04/premier-league-goalkeeper-stats-2024-25)
- [Controlling ball progression in soccer (pass speed 16.2 m/s)](https://arxiv.org/pdf/2210.16474)
- [Vector field theory in motion (ball speeds, kick peaks)](https://arxiv.org/pdf/2607.27838)
- [Modified 505 change of direction test](https://accedacris.ulpgc.es/bitstream/10553/129531/1/intratest_reliability_modified.pdf)
- [EA: how to pass in EA SPORTS FC](https://help.ea.com/en/articles/ea-sports-fc/how-to-pass/)
- [Google Research Football paper (the engine AFC runs)](https://arxiv.org/abs/1907.11180)
