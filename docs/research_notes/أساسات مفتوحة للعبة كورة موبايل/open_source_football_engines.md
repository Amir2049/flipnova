# Open-source 3D football (soccer) engines and game projects as a base for a commercial Android game (as of 21 Nov 2026)

Method note: repo metadata (stars, last push date, SPDX license) came from the GitHub search API on 2026-11-21. LICENSE and README files were downloaded raw from GitHub and read. The google-research/football tree was listed from a shallow, blob-less git clone (HEAD = 3d9e754, 2025-06-17). "Last push" is GitHub's `pushed_at` value, which is the last push to any branch.

## 1. Google Research Football (gfootball) and GameplayFootball: licenses of code and data, maintenance, forks, ARM

### Takeaway
Everything needed to ship gfootball's engine in a closed-source commercial Android game is permissively licensed. The repo wrapper is Apache-2.0, the C++ engine and its bundled `data/` directory are under the Unlicense (public domain), and the one font is SIL OFL 1.1. Two things need action. First, the bundled data contains real FC Barcelona and Real Madrid logos and kits, which are a trademark problem and must be removed. Second, upstream was archived on 19 Aug 2026, so AFC now effectively owns its copy of the engine. No Android or ARM-mobile port of gfootball exists publicly. ARM64 builds are proven only on Apple Silicon and Linux/Arm, the latter through the new "cuju" reimplementation.

### Cited Findings
**Licenses (read from the LICENSE files)**
- Top-level `LICENSE` of google-research/football is Apache License 2.0. — [google-research/football LICENSE](https://github.com/google-research/football/blob/master/LICENSE)
- `third_party/gfootball_engine/LICENSE` is the Unlicense: "Anyone is free to copy, modify, publish, use, compile, sell, or distribute this software ... for any purpose, commercial or non-commercial". — [gfootball_engine/LICENSE](https://github.com/google-research/football/blob/master/third_party/gfootball_engine/LICENSE)
- `third_party/gfootball_engine/README.md` says the engine "is a heavily modified version of https://github.com/BazkieBumpercar/GameplayFootball". — [gfootball_engine README](https://github.com/google-research/football/blob/master/third_party/gfootball_engine/README.md)
- The original BazkieBumpercar/GameplayFootball `LICENSE` is the same Unlicense text, and GitHub reports it as SPDX `unlicense`. — [BazkieBumpercar/GameplayFootball LICENSE](https://github.com/BazkieBumpercar/GameplayFootball/blob/master/LICENSE)
- The only font in the gfootball repo is `third_party/fonts/AlegreyaSansSC-ExtraBold.ttf`, under the SIL Open Font License 1.1 (`third_party/fonts/LICENSE`). — [gfootball third_party/fonts](https://github.com/google-research/football/tree/master/third_party/fonts)
- **Data and assets:** the animations, models, textures and shaders sit inside the engine directory at `third_party/gfootball_engine/data/media/`, so the engine's Unlicense covers them. No separate asset license file exists. The tree listing shows `animations/` (movement 49 files, ballcontrol 45, trap 40, pass 37, deflect 28, trip 19, shot 17, movement_special 16, highpass 15, interfere 7, sliding 6, celebration 3, templates 10), `objects/` (players 38, stadiums 15, officials 4, balls 3), `textures/` (pitch 14, adboards 16, stadium 5) and GLSL shaders. — [gfootball_engine/data](https://github.com/google-research/football/tree/master/third_party/gfootball_engine/data)
- **Trademark risk:** the data includes `databases/default/images_teams/primeradivision/fcbarcelona_logo.bmp`, `fcbarcelona_kit_02.bmp`, `realmadrid_logo.bmp` and `realmadrid_kit_02.bmp`. The adboards have names such as `ad_3xblast01`, `ad_altfunc01`, `ad_blauwprint01` and `ad_groningen01`, which mostly look fictional or like the author's in-jokes. — same tree listing as above
- The original author's README says the full project directory "including images, models and such" was hosted separately at properlydecent.com/data/gameplayfootball/, not in the git repo. The full original asset set may therefore have shipped outside the Unlicensed repo. — [BazkieBumpercar/GameplayFootball README](https://github.com/BazkieBumpercar/GameplayFootball)
- The original author advises: "this game has pretty good potential gameplay-wise, but has architectural problems regarding the code. I would advise you *not* to continue development, but rather use the source as inspiration". He also calls his multithreaded Blunted2 engine "badly tested and undocumented". The repo is marked "discontinued" and its last push was 2021-03-29 (254 stars). — [BazkieBumpercar/GameplayFootball](https://github.com/BazkieBumpercar/GameplayFootball)

**Maintenance status**
- google-research/football "was archived by the owner on Aug 19, 2026" and is read-only. It has 3.7k stars, 1.4k forks, 81 commits and no GitHub releases. The About text says "Check out the new game server:" and links to research-football.dev. — [google-research/football](https://github.com/google-research/football)
- The last commit is 3d9e754 (2025-06-17, "Update README.md"). The last engine release in the CHANGELOG is v2.10.3: Conda on macOS, Boost.Bind fixes, "Limit Gym version to v0.21.0", and a macOS GitHub workflow. v2.10.2 added "Support Apple Silicon". — [gfootball CHANGELOG](https://github.com/google-research/football/blob/master/CHANGELOG)
- The gfootball README notes that human play goes through the RL environment at "a single action per 100 ms ... which might cause a lag effect when playing". — [gfootball README](https://github.com/google-research/football)

**Forks and derivatives**
- **vi3itor/GameplayFootball** (Apache-2.0, 161 stars, 52 forks, 36 commits) aims to merge Google Brain's changes back into the full game, "based on Google Brain's changes (see `google_brain` branch) and other forks", and to make it compile "on as many platforms as possible". It says Google "threw away everything (e.g. menus, audio effects, etc.)". On macOS it "can be compiled ... but it is not running yet, because rendering must be done on the Main Thread". Windows support is a work in progress. — [vi3itor/GameplayFootball](https://github.com/vi3itor/GameplayFootball)
- **awest813/League-Soccer** (fork of vi3itor; Apache-2.0; 15 stars, 17 forks, 299 commits) calls itself a "fully featured" GameplayFootball rebuild. It lists a 3D match engine, "tactical AI referee", custom BallPhysics (spin and wind), career and management modes, SQLite saves, 5 languages and CI. Platforms are Linux, macOS and Windows, with no Android. It gives no separate asset license. — [awest813/League-Soccer](https://github.com/awest813/League-Soccer)
- **zocram4cc/GameplayFootball** (Apache-2.0, 2 stars, last push 2026-10-15) carries the League-Soccer README and is described as "deeper football simulation (tactics, traits, penalties, formations)". — [zocram4cc/GameplayFootball](https://github.com/zocram4cc/GameplayFootball)
- **Open-Gameplay** org (Sept 2026, 0 stars, mostly no license) has Python tools that turn Transfermarkt data into GameplayFootball databases, ratings and kits. Scraped real-player data is a separate legal issue. — [Open-Gameplay/tm-gf-import](https://github.com/Open-Gameplay/tm-gf-import)
- **cuju-football/engine** (Apache-2.0; initial release 0.1.0 in 2026-10; last push 2026-11-20; 4 stars) is a "bit-exact, batched reimplementation of Google Research Football for CUDA and the CPU". Its reference is GRF 2.10.3 commit 3d9e754. Platforms are "Linux on x86-64 and Arm, Windows, macOS". Backends include "64-bit Arm CPUs". It says GRF "runs one match per process at a few hundred steps per second". It is built for RL throughput, not as a game client. Sister repos are `cuju-football/render` (Apache-2.0, a browser renderer) and `arena`. — [cuju-football/engine](https://github.com/cuju-football/engine)
- **mxmsbt/rugby_sim** (Apache-2.0, 2026-04) is a rugby fork of gfootball. It shows the engine can be reworked into a different sport. — [mxmsbt/rugby_sim](https://github.com/mxmsbt/rugby_sim)
- OpenMandriva packages `gameplayfootball` (last push 2026-09-16), so a Linux distro packaging exists. — [OpenMandrivaAssociation/gameplayfootball](https://github.com/OpenMandrivaAssociation/gameplayfootball)

**ARM and mobile**
- Searches found no public Android or ARM-mobile port of gfootball or GameplayFootball (GitHub searches for "gfootball android", "gameplayfootball android", "gfootball arm" and "gfootball godot" all returned nothing; a web search also found nothing). — [GitHub search, 2026-11-21](https://github.com/search?q=gfootball+android&type=repositories)
- ARM64 builds exist for Apple Silicon (gfootball v2.10.2) and for Linux/Arm in cuju. — [CHANGELOG](https://github.com/google-research/football/blob/master/CHANGELOG); [cuju README](https://github.com/cuju-football/engine)

### Inferences
- A closed-source commercial Android game can legally use the gfootball engine and its animations, models and textures. The Unlicense requires nothing, and the Apache-2.0 Python wrapper code needs only a license copy and NOTICE kept if AFC redistributes any of it. AFC should still ship an attribution file for the font (OFL) and as a courtesy to Bastiaan Konings Schuiling.
- Before release, AFC must strip the Barcelona and Real Madrid logo and kit BMPs and review the adboard textures. Any Transfermarkt-derived data from Open-Gameplay must not be used commercially without separate rights.
- Archiving upstream changes little for AFC, which already vendors the engine as a GDExtension. There will be no upstream fixes. For bug fixes or restored features (menus, audio, set pieces), the most useful community lines are vi3itor, then awest813/League-Soccer, then zocram4cc. All are Apache-2.0, so code can be merged into a closed fork with attribution.
- cuju proves the GRF logic builds and runs bit-exactly on 64-bit ARM CPUs, which is good evidence the simulation core runs on Android arm64. Because it is a batched CUDA/CPU RL engine, it is not a game client replacement.
- The original author's own warning about architecture, and the 100 ms action granularity of the GRF env path, are the main quality and feel risks. AFC likely already avoids the latter by stepping the engine directly.

### Gaps
- I could not confirm whether the original properlydecent.com asset tarball held assets beyond the git repo, or under what terms. The site was not fetched.
- research-football.dev ("new game server") failed DNS resolution from this sandbox, so its owner, license and relation to Google are unknown.
- No measured Android/ARM frame-time or step-rate benchmarks for the GRF engine were found anywhere.
- vi3itor/GameplayFootball's last-commit date was not shown on its page.

## 2. Other open-source football games and engines (3D in depth, 2D briefly)

### Takeaway
No other open-source 3D football codebase comes close to GameplayFootball/gfootball's mix of 11v11 animation-driven gameplay and permissive license. The playable alternatives are either copyleft (GPL: YSoccer, Freekick 3, Slam Soccer code, OpenSWOS) or dependent on proprietary assets (OpenSWOS and angree/openswos need your own copy of SWOS). Slam Soccer's art is CC BY-NC-SA, which bans commercial use. Godot, Unity and Unreal soccer repos are almost all small demos or courses.

### Cited Findings
**3D, full games**
- **Bolzplatz 2006 / Slam Soccer 2006 / Coup de Foot 2006**: GitHub archive at Xenoage/Bolzplatz2006 (last push 2026-05-15, 5 stars, no SPDX license detected). The README says the sources "were copied from sourceforge.net ... mainly for archiving". — [Xenoage/Bolzplatz2006](https://github.com/Xenoage/Bolzplatz2006)
- The SourceForge page lists GPLv2 and Fedora packaging lists GPLv2+ for code. Fedora notes the data files are "Creative Commons Attribution-NonCommercial-ShareAlike 2.5", so it excludes them. The game is Java on Irrlicht/Jirr (OpenGL), LWJGL/OpenAL and SDLJava. — [SourceForge bp2k6](https://sourceforge.net/projects/bp2k6/); [Fedora spec](https://src.stg.fedoraproject.org/rpms/bolzplatz2006/blob/e1ab764abe1b15547a13262eb77cb26f8b6650b7/f/bolzplatz2006.spec); [Irrlicht forum thread](https://irrlicht.sourceforge.io/forum/viewtopic.php?p=79375)
- **Freekick 3** (anttisalonen/freekick3): GPL-3.0 code, art "Creative Commons Attribution-ShareAlike 3.0", C++/SDL/OpenGL, mouse and keyboard controls. 68 stars, last push 2020-08-27. Its predecessors freekick2 (Haskell, 2011) and freekick (AGPL, 2010) are dead. — [freekick3 README](https://github.com/anttisalonen/freekick3)
- **Retro League GX** (mholtkamp/retro-league): MIT, C++ on the author's Octave engine, a Rocket League "demake for older game consoles". 56 stars, last push 2024-08-06. — [retro-league](https://github.com/mholtkamp/retro-league)
- Other Rocket-League-likes are toy-sized: Wocket-Weague (MIT, Three.js and Rapier, 5 stars, 2024), lufemas/rocketleague-godot (no license, 5 stars, 2020) and pocket-league (MIT, GameBoy, 25 stars). — [Wocket-Weague](https://github.com/Aebel-Shajan/Wocket-Weague); [rocketleague-godot](https://github.com/lufemas/rocketleague-godot); [pocket-league](https://github.com/ty-porter/pocket-league)

**2D and retro (brief)**
- **YSoccer** (Sensible Soccer-style, Java; GitHub mirror ysoccer/ysoccer last push 2026-06-12) is GPLv2 per its SourceForge page and project news since 0.66 beta in 2003. Its Android sibling "YSoccer Touch" is listed as LGPLv2 on SourceForge, while its description says GPL, a conflict. A Flathub package exists (last push 2026-04-26). — [SourceForge ysoccer](https://sourceforge.net/projects/ysoccer/); [YSoccer news](https://ysoccer.sourceforge.io/news_eng.htm); [ysoccer-touch](https://sourceforge.net/projects/ysoccer-touch/); [flathub/io.sourceforge.YSoccer](https://github.com/flathub/io.sourceforge.YSoccer)
- **OpenSWOS** (benbaker76): GPL-3.0, C, 86 stars, last push 2026-11-20. It is a full Sensible World of Soccer rebuild "on Windows, macOS, Linux, the Raspberry Pi, the Amiga 1200, Android and iPhone/iPad, with online multiplayer". It needs "your own copy of Sensible World of Soccer 96/97", because the graphics, music and teams are not included. — [OpenSWOS](https://github.com/benbaker76/OpenSWOS)
- **angree/openswos**: MIT, Godot 4 + C#, 31 stars, last push 2026-08-26. It targets "desktop, web, Android, ARM handhelds". It claims the pitch engine is "~99% recreated" but says it is "still worse than the original", its menus are placeholders, and it "ships no game assets" (Amiga ADFs required). — [angree/openswos](https://github.com/angree/openswos)
- zlatkok/swos-port (SWOS reconstruction, no license detected, 39 stars, last push 2026-11-06). — [swos-port](https://github.com/zlatkok/swos-port)
- Small SWOS-likes: Jasc-Soccer (GPL-2.0, Python, 2016), europico88 (PICO-8 Lua, 2023), foolish-football (Java, 2014). — [Jasc-Soccer](https://github.com/Pitto/Jasc-Soccer); [europico88](https://github.com/RuairiD/europico88)
- Haxball clones: open-haxball (MIT, TypeScript, p2p multiplayer, last push 2026-10-14, 4 stars). — [open-haxball](https://github.com/ivo-/open-haxball)

**Simulation and manager engines (no 3D gameplay, relevant to AFC's MatchSim)**
- **Open Football** (ZOXEXIVO/open-football): Apache-2.0, Rust, 268 stars, last push 2026-11-19. A "football world simulator"; "Matches are resolved by the engine, not by user input". — [open-football](https://github.com/ZOXEXIVO/open-football)
- **openfootmanager**: GPL-3.0, Rust, 1,201 stars, last push 2026-11-18. — [openfootmanager](https://github.com/openfootmanager/openfootmanager)
- **footballSimulationEngine**: MIT, Node.js, 183 stars, last push 2026-03-17. — [footballSimulationEngine](https://github.com/GallagherAiden/footballSimulationEngine)
- DeltaBitsSystem/FootballEngine: GPL-3.0, F#, "Deterministic 22-player simulation, 3D ma[tch]", 15 stars, last push 2026-11-16. — [FootballEngine](https://github.com/DeltaBitsSystem/FootballEngine)

**Godot soccer projects**
- nicolasbize/soccer-course: MIT, 2D, 84 stars (the most-starred Godot soccer repo), last push 2025-05-27. — [soccer-course](https://github.com/nicolasbize/soccer-course)
- richardschembri/GodotBasic3DFootball: "A very basic 3D football/soccer game as a study", no license, 21 stars, 2018 (Godot 3 era). — [GodotBasic3DFootball](https://github.com/richardschembri/GodotBasic3DFootball)
- AKM-8byte/FreeKick: MIT, Godot 4 free-kick game "with procedural IK, configurable ball physics and cinematic replay", 2 stars, last push 2026-10-30. — [AKM-8byte/FreeKick](https://github.com/AKM-8byte/FreeKick)
- jotalamp/fuma-football-godot ("Full Manual Football", MIT, 1 star, last push 2026-11-20). Other repos: Habeeb-Rahman-CA/soccer5v5-game-godot (MIT, 2026), devinarena/Pixel-Striker (MIT, "soccer mobile game", 2021), GameDev.tv "Cubedude Kickabout" course clones. — [fuma-football-godot](https://github.com/jotalamp/fuma-football-godot); [Pixel-Striker](https://github.com/devinarena/Pixel-Striker); [soccer5v5](https://github.com/Habeeb-Rahman-CA/soccer5v5-game-godot)

**Unity soccer projects**
- mertusta1996/Unity-Football-Freekick-Game: MIT, a free-kick mechanic "similar to ... FIFA 23", 47 stars, 2023. Also Unity-First-Person-Football-Game (MIT, 10 stars, 2025). — [Unity-Football-Freekick-Game](https://github.com/mertusta1996/Unity-Football-Freekick-Game)
- junaid109/ProEvoSoccerUnity: a "Pro Evolution Soccer 4 Remake", no license (all rights reserved by default), 22 stars, 2023. — [ProEvoSoccerUnity](https://github.com/junaid109/ProEvoSoccerUnity)
- Others are small: nuno-faria/HeadToHead (19 stars, 2019, no license), PeterPopma/unityfc and KickIt (15 and 13 stars), rishavnathpati/Flick_Soccer-Unity-Android (MIT, 2020), and ML-Agents soccer derivatives such as cemtas81/Football. — [HeadToHead](https://github.com/nuno-faria/HeadToHead); [Flick_Soccer](https://github.com/rishavnathpati/Flick_Soccer-Unity-Android); [cemtas81/Football](https://github.com/cemtas81/Football)

**Unreal**
- No substantial open-source Unreal soccer game was found. The top results are UE4 2D toys (johnny-la/glow-soccer, 30 stars, 2017; GlorySoccer, 18 stars, 2022) and portfolio projects (nicholaszollinger/ProjectSoccer, UE5, 2026). — [glow-soccer](https://github.com/johnny-la/glow-soccer); [ProjectSoccer](https://github.com/nicholaszollinger/ProjectSoccer)

### Inferences
- **Playable and good:** gfootball/GameplayFootball and its League-Soccer fork (3D, 11v11), OpenSWOS (2D, full SWOS, but needs proprietary assets), and YSoccer (2D retro). Freekick 3 and Slam Soccer 2006 are playable but dated and dormant, at 2020 and 2006 respectively.
- **Demos or abandoned:** nearly all Godot, Unity and Unreal repos, including every 3D Godot soccer repo found, fall in this group.
- **Unusable as a closed-source commercial base:** GPL code (YSoccer, Freekick 3, Slam Soccer, OpenSWOS, openfootmanager), NC-licensed art (Slam Soccer), repos with no license (ProEvoSoccerUnity, GodotBasic3DFootball, swos-port), and anything needing SWOS assets.
- **Permissive and possibly useful as parts:** angree/openswos (MIT Godot 4 C# match logic, but 2D/SWOS-derived and needs SWOS data), Open Football (Apache-2.0 Rust sim, for MatchSim ideas), footballSimulationEngine (MIT), Unity-Football-Freekick-Game (MIT mechanic reference), and AKM-8byte/FreeKick (MIT Godot 4 IK and ball physics).

### Gaps
- I did not verify that YSoccer is built on libGDX or check its exact LICENSE file in the repo. The GitHub mirror's raw README and LICENSE paths returned 404.
- No license file is detected for Xenoage/Bolzplatz2006. The GPLv2 claim rests on SourceForge and Fedora metadata.
- The Godot Asset Library, itch.io and Reddit (r/godot, r/gamedev) were not searched directly within the tool budget, so community quality opinions are missing.
- Unity ML-Agents' own Soccer example (Apache-2.0, in Unity-Technologies/ml-agents) was not checked in this session.

## 3. Open-source football projects explicitly targeting mobile/Android

### Takeaway
Only retro 2D projects target Android and are actually maintained: OpenSWOS (GPL-3.0, real Android and iOS builds), angree/openswos (MIT, Godot 4, Android target, early) and YSoccer Touch (GPL/LGPL). No open-source 3D 11v11 football game targets Android. AFC's gfootball-on-Godot-Android approach appears to be the only one of its kind.

### Cited Findings
- OpenSWOS ships "Android and iPhone/iPad, with on-screen controls or a Bluetooth controller". GPL-3.0; SWOS assets required. — [OpenSWOS](https://github.com/benbaker76/OpenSWOS)
- angree/openswos targets "desktop, web, Android, ARM handhelds". MIT; Godot 4 + C#. — [angree/openswos](https://github.com/angree/openswos)
- YSoccer Touch, the Android version, is on SourceForge with conflicting LGPLv2/GPL labels. — [ysoccer-touch](https://sourceforge.net/projects/ysoccer-touch/)
- Dead or minor Android titles: delight-im/NationSoccer ("[UNMAINTAINED] Free 1-vs-1 soccer game for Android", GPL-2.0, 2014), nhulbert/ball-soccer (GPL-3.0, LAN, Bullet physics, 2017), Maskyn/Sky-Soccer (Unity, 2016, no license), rishavnathpati/Flick_Soccer-Unity-Android (MIT, 2020), tomlud123/Hoop-Soccer-android (2025, no license), balkac/Gaffer (Unity 6 roguelike manager, 2026-09, no license). — [NationSoccer](https://github.com/delight-im/NationSoccer); [ball-soccer](https://github.com/nhulbert/ball-soccer); [Gaffer](https://github.com/balkac/Gaffer)
- No gfootball or GameplayFootball Android port turned up in GitHub or web search. — [web search, 2026-11-21](https://trac.wildfiregames.com/wiki/AndroidPort) (the results were unrelated, which confirms the absence)

### Inferences
- None of the Android-targeting projects are both 3D and permissively licensed with free assets. angree/openswos is the only permissive and active Godot 4 Android football codebase, and it is 2D and depends on proprietary SWOS data.

### Gaps
- None of these were tested on Android hardware, so there is no first-hand data on frame rate or controls.

## 4. Is any alternative a better foundation than AFC's current stack (Godot 4.7 + gfootball C++ engine as GDExtension + GDScript MatchSim)?

### Takeaway
No. Of every credible open-source football codebase, gfootball/GameplayFootball is the only one with full 11v11 3D gameplay, a large motion-captured-style animation set (more than 300 animation files), built-in AI and referee, and a license (Unlicense plus Apache-2.0) that allows closed-source Play Store distribution. AFC should stay on it. It should harvest fixes from the Apache-2.0 community forks and clean the trademarked team assets.

### Cited Findings
- gfootball data has more than 300 animation files across movement, ball control, trap, pass, shot, high pass, deflect, trip, sliding, interfere and celebration, plus player, stadium, officials and ball models. All are Unlicense. — [gfootball_engine/data](https://github.com/google-research/football/tree/master/third_party/gfootball_engine/data); [gfootball_engine/LICENSE](https://github.com/google-research/football/blob/master/third_party/gfootball_engine/LICENSE)
- League-Soccer restores what Google removed ("menus, audio, full gameplay") and adds a referee, set-piece editor, replays and career modes, under Apache-2.0. — [awest813/League-Soccer](https://github.com/awest813/League-Soccer)
- cuju shows the GRF core is deterministic and builds on 64-bit Arm. — [cuju-football/engine](https://github.com/cuju-football/engine)
- The original author warns of architectural problems and an over-multithreaded engine. — [BazkieBumpercar/GameplayFootball](https://github.com/BazkieBumpercar/GameplayFootball)
- Upstream is archived (2026-08-19). — [google-research/football](https://github.com/google-research/football)

### Inferences
- **Keep gfootball as the match engine.** Of the alternatives, the GPL codebases are legally out, OpenSWOS and openswos need proprietary assets and are 2D, and the Godot, Unity and Unreal repos are demos smaller than what AFC already has.
- **Watch or borrow from:** (a) League-Soccer and zocram4cc for restored gameplay features such as set pieces, penalties, tactics and audio hooks (Apache-2.0, so keep the NOTICE); (b) cuju for ARM and determinism hints, and possibly its software renderer or observation code for headless or server use; (c) angree/openswos as a reference for a Godot 4 Android football UX and pipeline; (d) Open Football (Apache-2.0) and footballSimulationEngine (MIT) for ideas for the GDScript MatchSim.
- **Risks to manage:** no upstream maintenance (AFC owns the bugs); trademarked Barcelona and Real Madrid assets in the data folder; real player and club names (use fictional data or licensed data); the original author's warning that the code is architecturally messy; and the lack of any public Android performance data, so AFC's own profiling on low-end arm64 devices is the only evidence available.

### Gaps
- There are no published comparative gameplay-quality reviews, from Reddit or press, of League-Soccer versus stock gfootball. Neither was played in this session.
- AFC's actual on-device performance numbers were not available to this researcher.
