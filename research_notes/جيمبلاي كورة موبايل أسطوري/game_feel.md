# On-Pitch Game Feel in Football Video Games: What Makes It "Legendary"

Scope note: research done 2026-11-21 in about 16 tool calls. Primary developer sources found: EA Pitch Notes (FC 24, FC 26), GDC Vault listings (Rocket League physics, Motion Matching), Game Developer, and Sports Interactive interviews. Several Konami, GDC and Football Manager primary sources were paywalled, blocked (Operation Sports returned 403) or thin, and are listed under Gaps. Fan forums are labelled as fan opinion.

## 1. Why the classics are praised (PES 5/6, FIFA/EA FC, eFootball, Rocket League, Sensible Soccer, FM)

### Takeaway
The games people call legendary share four traits:
- Inputs that feel snappy and immediate.
- A ball that is a separate physics object, so touches and contacts vary and produce "random moments".
- Players who feel different on the pitch even at similar ratings.
- Mechanics with a skill ceiling and no hidden "momentum".

Realism-first systems (heavy animation commitment, as in FIFA 18) are criticised when they add delay. Pure-physics designs (Rocket League) are praised for predictability: "the ball does what you'd expect".

### Cited Findings
**PES 5/6 (fan and critic opinion)**
- Evoweb fans cite "more variety in ball physics and contact outcomes" and "ball physics and first touch give us a lot of random moments". They call the controls "fluid & responsive" and "very snappy and satisfying", and cite "lots of diversity in goal scoring opportunities". — [Evoweb thread "Why are PES 5 & 6 so highly regarded?"](https://evoweb.uk/goto/post?id=4069156)
- Player individuality: "player's individuality, something that shines on old Pes". The poster says players with similar overall ratings (Adriano vs Ibrahimovic) still play very differently. — [Evoweb](https://evoweb.uk/goto/post?id=4069156)
- Keepers "acting naturally and not over exagerated during animations". One poster calls the referee "the best we have ever see on a football game". — [Evoweb](https://evoweb.uk/goto/post?id=4069156) (fan opinion)
- Operation Sports argues PES 6 has no scripted moments or momentum systems and rewards skill. The page itself returned 403, so this is known only via the search summary. — [Operation Sports](https://www.operationsports.com/why-pes-6-is-still-the-best-soccer-game-ever-made)
- FourFourTwo runs a parallel argument that PES 4 is the greatest football game of all time. Some fans and critics prefer PES 5; Gamewatcher calls PES 5 "the best damn football game ever made… by a gnat's whisker". — [FourFourTwo](https://www.fourfourtwo.com/features/pro-evolution-soccer-pro-evo-4-best-football-game-all-time); [Gamewatcher](https://www.gamewatcher.com/pro-evolution-soccer-6/review)

**FIFA / EA FC**
- GameSpot's FIFA 18 review: animation transitions are smoother, but "painful input lag and the world's heaviest touches" mean "it still takes far too long for your intentions to be translated to the pitch". This is the classic realism-vs-responsiveness complaint. — [GameSpot](https://www.gamespot.com/articles/fifa-18-continues-to-strive-for-realism-but-at-a-c/1100-6450687/)
- For FC 26, EA reports community feedback asking for more responsive passing and shooting and better control when trapping the ball. — [EA Pitch Notes FC 26 Gameplay Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)

**eFootball**
- Early eFootball footage was heavily criticised, including the comment "First touch is all over the place". — [VGC](https://www.videogameschronicle.com/news/the-first-footage-of-pess-f2p-successor-efootball-is-receiving-heavy-criticism)
- Konami said it worked with Iniesta on dribbling feel and wanted "a whole new level of realism for dribbling". A 2020 GamesRadar hands-on found the ball physics "unpredictable, yet impressive". eFootball moved from the FOX Engine to Unreal Engine 4. — [TechRadar](https://www.techradar.com/news/how-the-pro-evolution-of-konamis-efootball-came-to-be); [GamesRadar](https://www.gamesradar.com/efootball-pes-2020-hands-on-licensing-master-league-gameplay)

**Rocket League**
- Psyonix "refined the physics… so the ball and car do the things you'd expect regardless of skill level". The core promise is that "the ball does what you want it to do when it's hit". — [The Ringer (Corey Davis)](https://www.theringer.com/2017/6/30/16039894/rocket-league-corey-davis-interview-podcast-achievement-oriented-e465e3e2a129); [Shacknews](https://shacknews.com/article/88302/psyonix-director-discusses-rocket-league-and-how-it-hopes-to-further-build-on-battle-cars)
- Dave Hagewood: "I prefer to keep the physics simulation as pure as possible". Boost is literally a force on the car's rigid body. The mechanics are deliberately "not automatically going to work every time", which gives a "scaling of skill that made the game feel satisfying to master". Psyonix rejected a grappling hook because players would "default to the same moves every time". — [Game Developer: Rocket jumping deep dive](https://gamedeveloper.com/design/game-design-deep-dive-rocket-jumping-in-i-rocket-league-i-)
- Physics runs at a fixed 120 Hz (about 8 ms per step) and is deterministic, which supports replays and network sync. This comes from an unofficial summary of Jared Cone's GDC 2018 talk "It IS Rocket Science!", so treat it with caution. — [GDC Vault](https://www.gdcvault.com/play/1024972/); [Glasp summary](https://glasp.co/youtube/ueEmiDM94IE)
- Cars have no stats; only hitboxes differ. — [Dexerto](https://dexerto.com/rocket-league/best-rocket-league-hitboxes-all-car-hitboxes-body-types-more-1755443)

**Sensible Soccer**
- One-button-plus-joystick design where "the controls were always context sensitive". — [HEXUS Jon Hare interview](https://hexus.net/gaming/features/industry/4529-sensible-soccer-jon-hare-interview/?page=2)
- Aftertouch (bending the ball after the kick) is a defining feature that "enabled effective but unrealistic swerves". — [Wikipedia: Sensible Soccer](https://en.wikipedia.org/wiki/Sensible_Soccer)
- According to Retro Gamer (via search summary), aftertouch descends from the team reading a bug in Tehkan World Cup as a feature. Hare's Sociable Soccer keeps it: "you can loft, dip and chip your shots". — [Everand / Retro Gamer](https://www.everand.com/article/669016489/The-History-Of-Sensible-Soccer); [Vice](https://www.vice.com/en/article/a-sensible-progression-jon-hare-explains-the-thinking-behind-sociable-soccer-1015/)

**Football Manager match engine**
- FM22 introduced a new player animation engine. Nic Madden said "Our old system wasn't up to scratch, it wasn't scalable and was very restrictive". The new system adds "more fluidity" so animations help guide the AI (defensive shape). — [RealSport101](https://realsport101.com/article/football-manager-2022-fm22-developer-interview-new-player-animation-engine-nic-madden-cj-ramson)
- FM moved to Unity. Miles Jacobson: "FM25 wasn't good enough… Moving to a new engine is bastard hard." A TopGear review calls FM26's 3D match engine "fantastic", with animation detail and in-match storytelling potential. — [Epic Games Store interview](https://store.epicgames.com/news/football-manager-26-interview); [TopGear](https://www.topgear.com/car-news/gaming/football-manager-26-review-fantastic-match-engine-tangled-mess-menus)

### Inferences
- "Ball not glued to feet" and "random moments" go together. Fans value outcome variance from real contact physics, as long as it reads as caused (by touch quality, body shape, pressure) rather than arbitrary.
- Individuality should come from differences in animation, timing and touch, not only from numeric speed. EA FC 26 now gates acceleration types and tackle animation sets by stats (see section 2), an explicit version of what PES did implicitly.
- Rocket League shows a different path: no stats, pure physics, and predictability as the source of fairness.

### Gaps
- I found no Konami primary developer interview on PES 5/6 gameplay design; the Operation Sports page returned 403.
- I found no first-person Hare account of how aftertouch was implemented.
- I found no technical detail on the FM26 match-engine animation system.

## 2. Techniques: animation, responsiveness, physics, assistance and error, keepers, duels

### Takeaway
EA's own Pitch Notes name the main trade-off. Animation variety, which needs selection by ball distance, input angle and speed, causes delay. Even 1 frame is noticeable. EA's FC 26 answer is to add short "fast" animations, re-tune transitions and branching, cut input latency by a frame, and split the game into a Competitive (responsive) and an Authentic (realistic) tuning.

Motion matching (Ubisoft) and ML animation (EA HyperMotion) trade CPU and data cost for natural motion. Stat-gated animation sets, PlayStyles and error sliders are the levers that make individuality and fairness tunable.

### Cited Findings
**Responsiveness and animation selection (EA FC 26 Responsiveness Pitch Notes)**
- "Delays of even 1 frame can result in a noticeably unresponsive experience."
- Animation choice depends on "ball distance from the player, movement input angle, and player speed". Limited animation coverage previously made the system "use a longer animation or delay starting an animation". FC 26 added "hundreds of new animations meant to enable players to perform actions faster".
- "Transitions and branching were reevaluated and re-tuned across most areas of gameplay."
- Example bug: a player switches feet before a shot, "delaying the shot for a couple of frames".
- Input latency was reduced by one frame for first-time passes and shots, so these "more likely to resolve as a first-time pass or shot rather than an unresponsive touch".
- A TV outside Game Mode adds "20 to over 100ms".
- Source for all of the above: [EA Pitch Notes FC 26 Responsiveness Update](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-responsiveness-update)
- A community frame-count test on FC 25 measured about 75–117 ms (9–14 frames) from input to player switch. This is a single user's test. — [EA Forums](https://forums.ea.com/discussions/fc-25-bug-reports-archive-en/input-lag---offline-mode-worse-online/7882743)

**Two tunings: Competitive vs Authentic (FC 26)**
- Competitive: responsiveness, consistency and control, with less AI defending and fewer auto tackles and blocks. It is locked in online modes.
- Authentic: slower dribbling and skill moves, more realistic tackle accuracy, and weather. It adds error sliders for Header Shot, Header Pass, Intercept, Ball Deflection and Tackle Assistance.
- EA defines error as: "Error refers to an action not being performed as perfectly as possible."
- Source: [EA FC 26 Gameplay Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)

**Anti-meta tuning (FC 26)**
- First-time 135° and 180° through passes are "significantly less accurate", to stop Directed Run exploits.
- Timed Finishing was removed because it "disproportionately rewarded long-range shots".
- Trivela shots are limited to players with the Gamechanger PlayStyle.
- Consecutive flick-ups become progressively less effective.
- Source: [EA FC 26 Gameplay Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)

**First touch (FC 26)**
- First Touch Precision: hold L2/LT for better control at the cost of speed. "Earlier timing of this input will result in increased control."
- Shield Trap: prioritises blocking the opponent over a perfect touch, scaled by Strength.
- Sprint toward a loose ball gives immediate acceleration.
- Source: [EA FC 26 Gameplay Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)

**Stats felt on the pitch (FC 26 / FC 24)**
- Acceleration archetypes have thresholds. Explosive needs Agility ≥65, Agility−Strength ≥10, Acceleration ≥80 and height ≤182 cm (male). Lengthy needs Strength ≥65, Strength−Agility ≥4, Acceleration ≥40 and height ≥183 cm.
- Stand Tackle below 71 gets basic animations only, 71–84 most, 85+ all.
- Contested box-outs are decided by the Strength difference.
- "Players stuck together are separated, and avoidance is made more slippery."
- Source for the above: [EA FC 26 Gameplay Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)
- FC 24 PlayStyles change mechanics, not just numbers. For example, Incisive Pass reduces the time to contact the ball on through passes and increases pass quality so the receiver traps better. — [EA FC 24 PlayStyles Deep Dive](https://www.ea.com/games/ea-sports-fc/pitch-notes/news/fc-24-playstyles-deepdive)

**Goalkeepers (FC 26)**
- Deflection Control sends most save deflections out of bounds, to teammates or into open space. This reduces cheap rebound goals.
- A reinforcement-learning system is used for GK positioning only, not for saves.
- Source: [EA FC 26 Gameplay Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)

**HyperMotion (ML animation)**
- FIFA 22's algorithm learned from over 8.7 million frames of 11v11 Xsens capture of 22 professionals, writes animations in real time, and added about 4,000 animations. — [EA HyperMotion](https://ea.com/games/fifa/fifa-22/hypermotion); [TechRadar](https://techradar.com/news/hypermotion-technology-in-fifa-22-sounds-like-a-game-changer-but-what-is-it)
- HyperMotion V (FC) reportedly uses more than 590 million frames of real match capture. — [NME](https://www.nme.com/news/ea-sports-fc-new-technology-will-blur-the-lines-between-virtual-and-real-soccer-3464712)
- None of these sources call HyperMotion "motion matching". TheNextWeb was sceptical of the marketing. — [TNW](https://thenextweb.com/news/ea-hypes-hypermotion-reveals-fifa-22-release-date)

**Motion matching (Ubisoft, For Honor)**
- Simon Clavet's talk "Motion Matching and The Road to Next-Gen Animation" (GDC 2016). — [GDC Vault](https://www.gdcvault.com/play/1022985/Motion-Matching-and-The-Road)
- The method searches all mocap data every frame for the best frame to jump to. The aims are accurate gameplay and convincing animation, which often conflict. — [Game Watch](https://game.watch.impress.co.jp/docs/news/749136.html)
- Costs: CPU-heavy, needs big datasets, and the team ran roughly weekly mocap sessions to fill gaps. — [Game Watch](https://game.watch.impress.co.jp/docs/news/749136.html); [CGWorld](https://cgworld.jp/feature/1604-gdc2016-03-2.html)

**Google Research Football engine (AFC context)**
- The engine is "based on a heavily modified version of Gameplay Football", a physics-based 3D simulator that runs about 25 million steps per day on a hexa-core machine. — [arXiv 1907.11180](https://arxiv.org/abs/1907.11180)

### Inferences
- For an animation-driven engine like GameplayFootball, with a small clip library (the brief says about 300 clips): sparse coverage causes the delays EA describes, so the system waits for or picks a longer clip. Practical mitigations follow EA's list:
  - Add short, interruptible "fast" clips for first-time passes and shots.
  - Allow early branch/cancel windows into kick clips.
  - Process inputs on the same frame.
  - Use procedural blending (root-motion warping, foot IK) to cover gaps instead of committing to a mismatched clip.
- An error cone scaled by stat, body orientation, pressure and first-time difficulty (EA's 135° and 180° accuracy penalty) is the standard way to make stats felt while keeping control responsive. Fairness comes from showing the cause, for example a visible bad touch or off-balance animation.
- On mobile, offer two tunings, like EA's split: "competitive/responsive" for PvP and "authentic" for career play.
- Avoid single dominant mechanics (timed finishing, trivela spam, flick-up chains). Use diminishing returns and gate mechanics by stats.

### Gaps
- I found no sourced public detail on cancel-window frame counts in FIFA or PES.
- I found no academic ball-physics model (Magnus or drag constants) used by a commercial football game.
- I could not open the Clavet slides on trajectory prediction (login-gated).
- I could not verify the "~300 mocap clips" figure for GameplayFootball; it came from the brief and is not independently confirmed.

## 3. Presentation that creates excitement (camera, replays, crowd, commentary, haptics, near-misses)

### Takeaway
EA treats crowd audio as an action-driven system: recorded club-specific assets triggered by on-field events, getting louder and chanting at exciting moments. It was good enough that broadcasters used it during COVID-era empty stadiums. Rocket League shows how a rule ("zero-second" goals that count until the ball touches the ground) can manufacture last-moment drama.

### Cited Findings
- EA crowd audio uses thousands of recorded club-linked assets ("no simulated or generic library audio"). Triggers and automation in game code link audio to on-field action. Paul Boechler built the dynamic crowd playback system later used by Sky, BT and BBC broadcasts. — [HyperX blog](https://blog.hyperx.com/article/11006/how-fifa-21s-audio-engineers-came-to-the-rescue-of-premier-league-broadcasts); [Sound Particles](https://blog.soundparticles.com/how-paul-boechler-created-live-stadium-crowds-from-fifa-recordings); [GamesRadar](https://www.gamesradar.com/uk/sky-sports-partners-with-ea-to-use-crowd-noises-from-fifa-20/)
- FC 25 preview: the crowd gets louder and chants during exciting moments and goals. — [GodisaGeek FC 25 presentation](https://godisageek.com/2024/07/ea-sports-fc-25-presentation-a-look-at-the-big-changes/)
- FIFA 23 promised better crowds and "flashier replays". — [NME](https://www.nme.com/news/gaming-news/fifa-23-will-improve-matchday-experience-with-better-crowds-and-flashier-replays-3285320)
- Rocket League ends matches only when the ball touches the ground after the buzzer, which creates "zero second magic". — [Game Developer: how Rocket League succeeded](https://www.gamedeveloper.com/business/smart-calls-timing-luck-poverty-how-i-rocket-league-i-succeeded)
- FM26's engine is praised for "in-match storytelling potential". — [TopGear](https://www.topgear.com/car-news/gaming/football-manager-26-review-fantastic-match-engine-tangled-mess-menus)

### Inferences
- Drive crowd intensity from a "danger" value: ball near the box, shot xG, a counter-attack in progress. Play a crowd "ooh" on near-misses (shot within about 1 m of the post, a save off the bar). These are cheap, high-impact cues on mobile.
- A replay plus short slow motion on goals and big saves, triggered by event thresholds, gives the "highlight" moments. Deterministic or recorded simulation, as in Rocket League, makes replays straightforward.

### Gaps
- I found no developer source on camera design (broadcast vs dynamic cameras), haptics design, or commentary systems in FIFA or PES within this budget.
- I found no source that explicitly describes crowd reaction to shot quality.

## 4. Common reasons football games feel bad

### Takeaway
The recurring complaints are:
- Input lag from animation commitment and selection.
- Perceived "scripting" or "momentum".
- Overpowered meta shots and passes.
- Players sticking together or sliding.
- Rebounds and keepers that feel cheap.

EA's own patch notes address each of these, which confirms they are real design pressures.

### Cited Findings
- Input lag and heavy touches: GameSpot on FIFA 18. — [GameSpot](https://www.gamespot.com/articles/fifa-18-continues-to-strive-for-realism-but-at-a-c/1100-6450687/)
- Animation-system delay sources and the 1-frame sensitivity. — [EA Responsiveness Pitch Notes](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-responsiveness-update)
- "Scripting" and momentum: EA filed two 2016 dynamic difficulty adjustment (DDA) patents but repeatedly says DDA "was never part of FIFA". It attributes perceived momentum to ratings and fatigue. A November 2020 class action ended without trial. — [PCGamesN](https://www.pcgamesn.com/fifa-19/scripting-dda-momentum); [Goal](https://www.goal.com/en-gb/news/ea-sports-deny-theres-been-scripting-in-fifa-19-or-previous-game-versions/1fmb32lnhiwlw1jppwxap7ki9w); [GameStar](https://www.gamestar.de/artikel/fifa-momentum-verfahren,3367611.html)
- Meta exploits were patched out: timed finishing, first-time 135°/180° through balls, trivela, chained flick-ups. — [EA FC 26 Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)
- Physics fixes for "players stuck together" and more "slippery" avoidance. Fixes for unfair rebounds through Deflection Control. — [EA FC 26 Deep Dive](https://www.ea.com/games/ea-sports-fc/fc-26/news/pitch-notes-fc26-gameplay-deep-dive)

### Inferences
- Players blame "scripting" when outcomes vary without a visible cause. Making error causes legible (stat, fatigue, pressure, body shape shown through animation and UI) is the best defence, and it also keeps the PES-style "random moments" that fans love.
- Do not add hidden DDA in competitive modes. If difficulty assistance exists, make it explicit and offline-only.

### Gaps
- I found no rigorous source on foot sliding in football games specifically; it is a general animation-blending issue and was not covered by the sources found.
