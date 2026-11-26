# Presentation in Godot: zocram4cc's broadcast ideas, rebuilt for AFC

zocram4cc/GameplayFootball (Apache-2.0) puts ~140 of its commits into presentation: the goal replay and its cameras,
the scorer's celebration, the walk-out, the substitution and foul "incidents", the game-plan screen, a moving net,
a crowd that reacts. Its code draws with its own OpenGL renderer, so none of it runs in AFC; what carries over is
the design and the timings - rebuilt in Godot on top of what AFC already has (engine_match_view.gd records the
engine's poses every frame, camera_rig.gd, player_view.gd's animations). Its PES-derived content (camera tables,
celebration clips, entrance shots) is never used; every shot here is authored for AFC.

## What and how (in order of what players see most)

| # | Feature (zocram4cc commits) | How in AFC / Godot | Size |
|---|---|---|---|
| 1 | **Goal replay** with 2-3 cuts (dcd5931, beec00a, 029f620) | AFC already buffers the engine poses: keep the last 6 s in a ring buffer, on a goal replay them at 0.5x from 3 cameras (behind the goal, the scorer's side, a high wide) chosen by where the shot came from; skip button | 2-3 days |
| 2 | **Scorer runs off and celebrates** (cfbf6bb, 5765b89, 9ca914b) | after the whistle the engine stands still: the scorer's view takes over - a run towards the nearest corner flag (steering over the pitch), then one of AFC's celebration clips (player_view already has them), team-mates jog in; follow camera | 2 days |
| 3 | **Walk-out before kick-off** (7daf561, 19370ad) | two lines from the tunnel to the halfway line (Path3D), idle animations, a slow dolly camera, the club names; skippable, off in Settings | 2 days |
| 4 | **Incidents filmed where they happen** - foul, card, substitution (7816f1b, 8121c2d, ebf1fcb, 1b2910a) | a short close camera on the foul spot at the whistle; a card graphic over the fouler; the substitution banner with both faces (the HUD already announces subs) | 1-2 days |
| 5 | **Game-plan / half-time screen** (4255735, d0a990e, 698aaa9) | the tactics board from 2.44 plus the stats and the formation in one half-time screen | 1 day |
| 6 | **Net that moves** (2ae1a1e, 4b752e5) | the goal net as a vertex shader: a bulge where the ball hits, decaying over 0.6 s - cheap on phones | 1 day |
| 7 | **Crowd that reacts** (b3dc7f4, db2ac9b) | the stand shader already animates the crowd; add a "jump" pulse on goals and near misses, louder chant | 0.5 day |
| 8 | **Corner flags, touchline staff** (9e04322, c442950) | small meshes; flags swing in the wind (2.49's wind) | 0.5 day |

Each item gets a screenshot test (tests/shot_*.gd) and a frame-cost check on the FrameGovernor before it ships.
