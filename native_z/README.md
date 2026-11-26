# Z Football: zocram4cc's engine on the phone (in progress)

The owner asked for a second app that plays zocram4cc/GameplayFootball's gameplay (Apache-2.0, League-Soccer's
fork) with its camera, on AFC's own teams and models. Their game is desktop-only (SDL window, desktop OpenGL), so
the plan is the one Google followed with the same parent engine: the engine simulates, Godot draws.

| Stage | Status |
|---|---|
| Z1 build their game as-is on Linux, play a match | done (full match, recorded) |
| Z2 headless library: their engine minus menus / viewer / OpenGL renderer; `NullRenderer3D` (here, generated from their `interface_renderer3d.hpp`, all 69 methods, compiles); AFC's SDL stand-in (`native/shims`); SQLite built in | started |
| Z3 `ZFEngine` GDExtension with GFEngine's API (start / frames / poses / state / set_input); a match frame = `match->Process()` + `PreparePutBuffers()` (GameTask::ProcessPhase), called in step | |
| Z4 Android build, a separate app (own package and name) beside AFC | |

Not taken from their repository: its database content (their community's team and player names are offensive,
and it is PES-derived), PES model / kit import. Their source is fetched at build time, not copied here.
