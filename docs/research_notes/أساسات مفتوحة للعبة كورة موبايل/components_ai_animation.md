# Open-source building blocks for a 3D mobile football game (animation, mocap, models, AI, ball physics)

Context: the user's game AFC uses Godot 4.7 GDScript on Android with the GL Compatibility renderer, CMU mocap and MakeHuman. Research date 2026-11-21. Some primary pages could not be fetched: the CMU FAQ returned HTTP 503, the Adobe Mixamo FAQ returned 403 and the GitHub API was blocked for this session. Where that happened, the notes cite the closest primary or secondary copy and say so.

## Q1. Motion capture datasets and animation libraries usable commercially

### Takeaway
Only a few sources are clearly safe for a commercial game: CMU mocap (embed it, never resell it), Mixamo (royalty-free inside a game), Quaternius Universal Animation Library 1 and 2 (CC0, retargetable, Godot-ready) and Rokoko's free Motion Library moves. LAFAN1 and AMASS are non-commercial, and so is SoccerNet video. None of them is a game-ready football mocap set with kicks, headers and keeper dives. The richest football mocap set, Soccer-X, has no confirmed license.

### Cited Findings
- **CMU Graphics Lab Motion Capture Database.** The FAQ text, as reproduced by Papers with Code and by an identical UPenn notice, reads: "This data is free for use in research projects. You may include this data in commercially-sold products, but you may not resell this data directly, even in converted form." — [Papers with Code](https://paperswithcode.com/dataset/cmu-motion-capture); [UPenn mocap DB](https://fling.seas.upenn.edu/~mocap/cgi-bin/i.php). The live CMU FAQ (mocap.cs.cmu.edu/faqs.php) returned 503 during this research, so this was not verified on CMU's own page.
- A third-party FBX conversion of CMU on 4TU.ResearchData is labelled CC BY-NC 4.0, which conflicts with CMU's original terms. Converted copies can carry stricter licenses, so the original BVH/ASF-AMC files are the safe source — [4TU FBX conversion](https://data.4tu.nl/datasets/0448aab2-3332-449f-a8e2-d208cb58c7df).
- **LAFAN1 (Ubisoft La Forge).** Licensed CC BY-NC-ND 4.0, so not for commercial use. It holds 5 subjects, 77 sequences and 496,672 frames (about 4.6 h) of BVH at 30 fps: walk, run, sprint, jumps, fall and get up, fight, push and stumble, "fight and sports" (2 sequences), dance, aiming and obstacles. It has no football content — [LAFAN1 GitHub](https://github.com/ubisoft/ubisoft-laforge-animation-dataset).
- **AMASS.** The license allows only "non-commercial scientific research, non-commercial education, or non-commercial artistic projects". "Incorporation in a commercial product" is prohibited, and so is training networks "for commercial use of any kind". Commercial licensing goes through ps-license@tue.mpg.de — [AMASS license](https://amass.is.tue.mpg.de/license.html).
- **Mixamo.** Adobe's FAQ says "You can use both characters and animations royalty free for personal, commercial, and non-profit projects including creating video games", and that Mixamo is free with no subscription required — [Adobe Mixamo FAQ](https://helpx.adobe.com/creative-cloud/faq/mixamo-faq.html) (the page returned 403 to the fetcher; the quote comes from the search-indexed copy). Forum guidance says not to redistribute the raw FBX files as assets and to embed them in the game. No credit is required — [Adobe Community Mixamo FAQ thread](https://community.adobe.com/t5/mixamo-discussions/mixamo-faq-licensing-royalties-ownership-eula-and-tos/td-p/13234775); [itch.io post](https://itch.io/post/7765268). The forum points are not official terms.
- **Rokoko Motion Library.** 150 free mocap moves "licensed for use in commercial projects" (announced in 2020) — [CG Channel 2020](https://www.cgchannel.com/2020/03/get-150-free-mocap-moves-from-rokokos-motion-library). The pricing page says exports can be used "in any of your projects, including commercial ones", and the Starter plan is free forever with FBX export — [Rokoko pricing](https://rokoko.com/pricing/). Paid moves cost $3 to $6 each — [Broadcast Now](https://www.broadcastnow.co.uk/vfx-worlds-largest-motion-capture-marketplace-opens/5148339.article).
- **Quaternius Universal Animation Library (v1, March 2025).** CC0, 120+ animations on a universal humanoid rig "compatible with Unreal Engine, Godot and Unity, ready for retargeting". It covers 8-direction locomotion, jog, sprint, push, death animations and more, in FBX and glTF. The Standard zip is free, and the Source zip costs $14.99 or more — [Quaternius UAL](https://quaternius.com/packs/universalanimationlibrary.html); [itch.io](https://quaternius.itch.io/universal-animation-library).
- **Quaternius Universal Animation Library 2 (January 2026).** 130+ animations. The free Standard version has about 70% of the set (9.7 MB), and the Source version adds the .blend rig — [Quaternius UAL2](https://quaternius.com/packs/universalanimationlibrary2.html); [80.lv](https://80.lv/articles/get-this-animation-asset-library-with-over-130-diverse-items). The CC0 Universal Base Characters (FBX/glTF) use the same rig — [Quaternius Universal Base Characters](https://quaternius.com/packs/universalbasecharacters.html).
- **Football-specific mocap.**
  - Soccer-X (SMGDiff, ICCV 2025): 30 skilled players, 16 OptiTrack cameras, more than 10 h and 1.08M frames in SMPL format. Categories are Dribble, Stand, Off-the-ball Move, Trick, Shoot and Celebrate. The paper says "Our data and model will be disseminated to the community". No license was found — [arXiv 2411.16216](https://arxiv.org/pdf/2411.16216); [ICCV 2025 page](https://openaccess.thecvf.com/content/ICCV2025/html/Yang_SMGDiff_Soccer_Motion_Generation_using_Diffusion_Probabilistic_Models_ICCV_2025_paper.html).
  - SoccerKicks (UNESP, 2021): 3D reference motions of penalty and free kicks, reconstructed from video for humanoid robots and hosted at github.com/larocs/SoccerKicks. License and format were not confirmed — [UNESP repository](https://repositorio.unesp.br/entities/publication/62e37544-4f4b-47ff-b81c-a46ca5249856/full).
- **SoccerNet.** Video access requires an NDA. Derived datasets such as SoccerChat bar commercial use of the video, and SoccerNet-Echoes needs written permission for commercial use — [KAUST SoccerNet](https://ivul.kaust.edu.sa/soccernet); [SoccerChat HF](https://huggingface.co/datasets/SimulaMet/SoccerChat); [SoccerNet-Echoes](https://datasets.simula.no/soccernet-echoes/). It is broadcast video, not mocap.

### Inferences
- The strongest legal stack is CMU (locomotion, some kicks), Mixamo (soccer kicks, headers and goalkeeper catches and dives are well known to exist in its library, though this was not verified here) and Quaternius UAL1/2 (clean CC0 locomotion on a Godot-friendly rig), with Rokoko for gap-filling. All of them must be retargeted to one skeleton.
- CMU data is noisy, has inconsistent skeletons and sits in a raw format. If AFC uses CMU directly with MakeHuman, retargeting errors (foot sliding, twisted bones, scale mismatch) are a likely source of the "buggy" feel. Mixamo and Quaternius clips are already cleaned up for games.
- LAFAN1 can be used to *prototype* motion matching (Holden's demos use it), but it must be swapped out before shipping a commercial build.

### Gaps
- The Mixamo Terms of Use were not fetched (403). Whether they now restrict AI/ML training is unverified.
- The current list of Rokoko's free moves and whether any are football-related could not be checked.
- License, format and download status of Soccer-X and SoccerKicks are unknown.
- No CC0 or commercial-OK mocap pack dedicated to football (keeper dives, volleys, slide tackles) was found.

## Q2. Motion matching and learned animation implementations for Godot or custom engines, and their mobile cost

### Takeaway
Daniel Holden's Motion-Matching repo (MIT code, non-commercial LAFAN1 data) is the reference implementation. For Godot 4, GuilhermeGSousa/godot-motion-matching (MIT, C++ GDExtension, AnimationTree integration, targets 4.4) is the most usable option, but it is still under development and has reported bugs. No mobile benchmark was found for any of them.

### Cited Findings
- **orangeduck/Motion-Matching.** MIT code. It implements Motion Matching and Learned Motion Matching (decompressor, stepper and projector networks trained in Python) with a C++/raylib demo. The data is LAFAN1 and stays under CC BY-NC-ND. It "omits some database storage optimizations", and changing weights requires regenerating the database and retraining the networks — [GitHub](https://github.com/orangeduck/Motion-Matching).
- **Learned Motion Matching** (Holden et al., SIGGRAPH 2020). It "has no need to store animation data or additional matching meta-data in memory". Motion Matching's memory "scale[s] linearly with the amount of data" — [Ubisoft La Forge](https://www.ubisoft.com/en-us/studio/laforge/news/6xXL85Q3bF2vEj76xmnmIu/introducing-learned-motion-matching); [paper PDF](https://www.theorangeduck.com/media/uploads/other_stuff/Learned_Motion_Matching.pdf); [article](https://theorangeduck.com/page/learned-motion-matching). A 2023 follow-up says LMM reduces memory but increases performance costs — [unpaywall DOI 10.1145/3623264.3624442](https://unpaywall.org/10.1145%2F3623264.3624442).
- **GuilhermeGSousa/godot-motion-matching.** MIT, built on godot-cpp (GDExtension) and "fully integrated into Godot's AnimationTree". It follows Holden's article and is listed on the Asset Library as v0.2.1 for Godot 4.4, "still under development" — [GitHub](https://github.com/GuilhermeGSousa/godot-motion-matching); [Asset Library #3822](https://godotengine.org/asset-library/asset/3822). A user on Godot 4.5.1 reported that the character "is not able to stay still" — [Godot forum](https://forum.godotengine.org/t/character-cannot-stay-still/129816). Android builds are not documented.
- **Other ports.** Remi123/MotionMatching is a Godot 4.2 module last updated in 2024, and v-sekai/godot_motion_matching is a pre-release C++ module port of it — [Remi123](https://github.com/Remi123/MotionMatching); [ecosyste.ms v-sekai](https://awesome.ecosyste.ms/projects/github.com%2Fv-sekai%2Fgodot_motion_matching).

### Inferences
- Full motion matching for 22 players at once is a heavy CPU load for mid-range Android: one nearest-neighbour search per player, a few times per second, plus inertialization. The Godot plugin's AnimationTree route keeps that cost in C++, not GDScript.
- For a solo developer, a cheaper and more robust option is a hand-built AnimationTree with BlendSpace2D locomotion, root-motion-free movement plus foot IK, and short one-shot clips for kick, header, tackle and dive selected by distance and angle to the ball. Motion matching can come later, perhaps only for the controlled player.
- Learned motion matching would need on-device neural-network inference, which Godot does not provide out of the box. It is impractical for this project.

### Gaps
- No measured mobile or Android performance numbers exist for any of these implementations.
- Exact LMM memory figures from the paper were not extracted.
- Whether the Godot plugin builds for Android arm64 and Godot 4.7 is unverified.

## Q3. Football AI (RL agents, Kaggle winners, rule-based team AI, formations)

### Takeaway
The RL agents (TiZero, the Kaggle/GRF winners) need the Python GRF environment and its observation format. They don't port realistically to a Godot mobile game. Their main value is as research references. For shipping, the practical base is rule-based team AI: Buckland's SimpleSoccer architecture, steering behaviours, formation slots and finite-state machines. GameplayFootball, the engine under GRF, is released under the Unlicense and is a rich source of football logic.

### Cited Findings
- **Google Research Football (GRF).** Apache License 2.0 — [LICENSE](https://raw.githubusercontent.com/google-research/football/master/LICENSE). It is based on the open-source Gameplay Football and has a "Play vs built-in AI" mode. The repo "was archived by the owner on Aug 19, 2026. It is now read-only" — [GitHub](https://github.com/google-research/football).
- **GameplayFootball** (Bastiaan Konings Schuiling, C++). Unlicense, described as "Football game, discontinued". A fork, zocram4cc/GameplayFootball, is Apache-2.0 and adds "deeper football simulation (tactics, traits, penalties, formations)" — GitHub search results via gh CLI for [BazkieBumpercar/GameplayFootball](https://github.com/BazkieBumpercar/GameplayFootball) and [zocram4cc/GameplayFootball](https://github.com/zocram4cc/GameplayFootball).
- **TiZero** (AAMAS 2023). Apache-2.0 badge. The final model weights ship in `./submission/tizero` (ranked 1st on JIDI on 28 October 2022). It requires gfootball and openrl. The README asks for citation when "our codes or our weights" are used, and gives no separate weight license — [TiZero README](https://raw.githubusercontent.com/OpenRL-Lab/TiZero/main/README.md); [arXiv 2302.07515](https://arxiv.org/pdf/2302.07515v2.pdf). Stats sites put the last push at about three years ago — [repositorystats](https://repositorystats.com/openrl-lab/tizero).
- **Kaggle GRF competition (2020).** Won by Tencent's WeKick (score 1785.8) using distributed PPO, self-play and GAIL. No released code or license was found, and a 2023 survey notes few teams share implementations — [besthub write-up](https://besthub.dev/articles/how-tencent-s-wekick-ai-dominated-the-google-football-kaggle-competition-1ffa586cc281); [arXiv 2305.09458](https://arxiv.org/pdf/2305.09458).
- **Buckland, "Programming Game AI by Example", ch. 4 SimpleSoccer.** It covers team and player state machines, steering behaviours and support spot calculation. The original C++ comes in the book's Buckland_AISource.zip — [O'Reilly](https://www.oreilly.com/library/view/programming-game-ai/9781556220784/). The port luiskarlos/soccer is Java, GWT and Phaser, and its license was not found — [GitHub](https://github.com/luiskarlos/soccer).
- Godot-specific sports guidance (formations, steering, contextual input, Magnus) exists as a local skill (`godot-genre-sports`). It is not an external source.

### Inferences
- The Buckland pattern maps cleanly onto GDScript: a team state machine (attacking, defending, kickoff), player states (chase ball, receive, support, return home, dribble, kick, intercept) and steering behaviours (seek, arrive, pursuit, interpose). That makes it the most practical AI base. A rewrite from the book's description avoids the unclear code license.
- GameplayFootball's Unlicense C++ code is legally usable as reference for positioning, marking and tactics, and could even be ported.
- Running TiZero on-device would require exporting the policy (for example to ONNX), feeding it a GRF-style observation and running an inference runtime on Android. That costs a lot of engineering for little gain over a tuned rule-based AI.

### Gaps
- The exact license of the TiZero weights and the luiskarlos/soccer port is unknown (GitHub API blocked).
- No open-source formation or tactics library for Godot was found.

## Q4. Character models, stadium and pitch assets, and AI 3D generation terms

### Takeaway
MakeHuman exports are CC0 when made with the official, unmodified build and core assets only. Quaternius Universal Base Characters (CC0) share a rig with the CC0 animation libraries, which makes them a strong low-poly alternative. Ready Player Me shut down on 31 January 2026, so it is no longer an option. No CC0 3D footballer or stadium pack from Kenney, Quaternius or Poly Pizza was confirmed. OpenGameArt has CC0 goal, field and ball models. Meshy outputs are CC BY 4.0 on the free plan and owned by the user on paid plans.

### Cited Findings
- **MakeHuman.**
  - Exported models "end up being licensed CC0" and can be used in closed-source commercial games without payment — [MakeHuman FAQ: sell models](https://static.makehumancommunity.org/oldsite/faq/can_i_sell_models_created_with_makehuman.html); [license page](https://static.makehumancommunity.org/about/license.html).
  - The September 2020 change moved targets, proxies and the base mesh to CC0 — [MakeHuman 2020 license change](https://static.makehumancommunity.org/oldsite/faq/what_changed_regarding_the_license_in_2020.html).
  - The grant covers exports from an "OFFICIAL and UNMODIFIED version". Assets from the community repositories can be CC-BY and need attribution — [Are MakeHuman files free?](https://static.makehumancommunity.org/makehuman/faq/are_makehuman_files_free.html).
- **Quaternius Universal Base Characters.** CC0, FBX and glTF, compatible with UAL — [Quaternius](https://quaternius.com/packs/universalbasecharacters.html).
- **Ready Player Me.** Netflix acquired it in December 2025, and services, including PlayerZero and the SDKs, wound down on 31 January 2026 — [TechCrunch](https://techcrunch.com/2025/12/19/netflix-acquires-gaming-avatar-maker-ready-player-me/); [Estonian World](https://estonianworld.com/business/netflix-buys-estonian-avatar-pioneer-ready-player-me/).
- **Kenney.** The Sports Pack is CC0 but 2D (top-down) — [Kenney Sports Pack](https://kenney.nl/assets/sports-pack).
- **OpenGameArt CC0 3D assets.**
  - soccerGoal, with real measurements and cloth-net variants — [OGA](https://opengameart.org/node/141921)
  - soccer field — [OGA](https://opengameart.org/content/soccer-field)
  - soccer ball sprites and texture generator — [OGA](https://opengameart.org/content/soccer-ball-animation-sprites-and-3d-texture)
- **Sketchfab.** A low-poly football stadium is available under CC-BY (attribution required) — [Sketchfab](https://sketchfab.com/3d-models/low-poly-football-stadium-soccer-field-3d-model-7af9fea33016437da7c24edee6e47cef).
- **Commercial marketplace packs** (CGTrader, Unity Asset Store) use royalty-free or EULA licenses rather than CC0 — [Unity soccer players & stadiums pack](https://assetstore.unity.com/packages/3d/characters/soccer-players-stadiums-pack-105891).
- **Meshy.**
  - Free plan output is CC BY 4.0: commercial use is allowed with attribution, and the user owns the output. Paid plans grant full ownership and private commercial use — [Meshy help: commercial use](https://help.meshy.ai/en/articles/9992001-can-i-use-my-generated-assets-for-commercial-projects); [Meshy pricing](https://meshy.ai/pricing); [Meshy docs pricing](https://docs.meshy.ai/en/webapp/pricing).
  - Rights follow the plan active when the model was generated — [Meshy ownership](https://help.meshy.ai/en/articles/10137554-what-is-the-ownership-of-the-generated-models).
  - The ToS was last updated 7 March 2026 — [Meshy ToS](https://www.meshy.ai/cs/terms-of-use).

### Inferences
- For GL Compatibility on Android with 22 or more skinned players, polygon and bone count matter more than realism. That favours low-poly CC0 characters (Quaternius, or MakeHuman exported with a low-poly proxy and the game-engine skeleton), with kit colours driven by material or shader parameters.
- Meshy free-tier output needs a credit line. AI-generated meshes usually need retopology and rigging before they can be animated.

### Gaps
- Poly Pizza's football and stadium listings and their licenses were not checked directly.
- No confirmed CC0 3D footballer or stadium pack exists from Kenney or Quaternius.
- Other Meshy-style generators (Tripo and others) were not verified from primary pages.

## Q5. Ball physics (Magnus effect, drag, bounce) with open implementations

### Takeaway
The physics is well documented: drag with Cd of about 0.25 and a drag crisis near 12 to 15 m/s, a Magnus or lift force set by the spin parameter, and spin decay. There is no dedicated open-source football ball library. The practical approach is a small custom integrator, or forces added to a Godot RigidBody3D, using coefficients from Goff and Carré and from NASA.

### Cited Findings
- **NASA Glenn soccer page.** Default soccer ball drag coefficient of about 0.25 — [NASA](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/soccer).
- **Goff and Carré.**
  - Lift coefficients for spin parameter 0 to 1 at Re from 130,000 to 300,000, with separation angles around the drag crisis — [White Rose eprint 98035](https://eprints.whiterose.ac.uk/id/eprint/98035/).
  - Earlier lift coefficients extracted from trajectory data — [White Rose 11156](https://eprints.whiterose.ac.uk/11156/1/paper_2.pdf).
- **Drag crisis.** About 12 m/s according to Physics Today, and Cd rises slightly beyond it — [Physics Today](https://physicstoday.aip.org/quick-study/power-and-spin-in-the-beautiful-game). Other sources put it near 14 to 15 m/s (Re about 10^5) — [core.ac.uk](https://core.ac.uk/download/288384438.pdf). The sources disagree.
- **Accurate simulation** needs spin decay and a drag profile that varies with the Reynolds number — [core.ac.uk Tuplin et al.](https://core.ac.uk/download/288384438.pdf).
- **Open or inspectable models.**
  - Wolfram free-kick model using drag and Magnus equations from Palmer's *Physics for Game Programmers* — [Wolfram](https://reference.wolfram.com/system-modeler/libraries/EducationExamples/EducationExamples.Physics.FreeKick.FreeKickScenario.html)
  - Python spinning-ball (Roberto Carlos) model with gravity, quadratic drag and Magnus — [Théo Palagi](https://theoplg.github.io/projects/spinning-ball-spiral)
  - pitchphys, a Python baseball simulator with drag, Magnus and spin decay — [PyPI](https://pypi.org/project/pitchphys/)
  - Wooster thesis "Bend It like Magnus" — [PDF](https://physics.wooster.edu/wp-content/uploads/2021/08/Junior-IS-Thesis-Web_2011_Ahmad.pdf)
  - Spathopoulos's simplified model (constant Cd, Magnus coefficient equal to the spin parameter) — [SlideShare](https://de.slideshare.net/vspathop/workshop-ball-simulation)

### Inferences
- A deterministic custom ball integrator is usually more stable and easier to tune for gameplay than raw RigidBody3D physics, especially on mobile. It would run in `_physics_process` with gravity, drag of 0.5·ρ·Cd·A·|v|·v, Magnus of roughly 0.5·ρ·CL·A·|v|²·(ω̂×v̂) with CL a function of the spin parameter, exponential spin decay and a simple restitution-and-friction bounce. It also supports trajectory prediction for the AI (interception, receiver positioning), as Buckland does with ball "time to cover distance".
- Typical values: mass 0.43 kg, radius 0.11 m, air density 1.2 kg/m³. These come from standard FIFA and physics knowledge, not from the fetched sources.

### Gaps
- No open-source, football-specific ball physics library with a permissive license was found.
- Bounce restitution and grass friction coefficients were not sourced.
