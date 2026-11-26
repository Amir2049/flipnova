# Fun, skill moves and players: research and what went into 2.40

## What makes a football game fun (research)

- **Risk with a reward.** FC Mobile: a 2nd, 3rd... skill move in a row slows the dribbler and adds touch error; the
  power shot's long wind-up leaves the shooter open to a tackle. Moves pay off once, spamming them is punished
  ([EA FC Mobile gameplay deep dive](https://www.ea.com/games/ea-sports-fc/fc-mobile/news/fc-mobile-gameplay-deep-dive)).
- **Stats you can feel.** Agility and ball control make moves faster and cleaner; short players turn quicker
  (same source).
- **Moves at jogging pace.** FIFA 08's designers limited the speed skill moves work at - you can't do one at top
  speed in real life ([GamesRadar, FIFA 08 dev blog](https://www.gamesradar.com/fifa-08-ps3-and-xbox-360-developer-blog-01/3)).
- **Touch: taps and swipes.** FC Mobile's sprint button doubles as the skill input (a tap or a swipe); quick taps
  pass, swipes lift the ball ([EA gesture controls guide](https://www.ea.com/news/gameplay-controls-guide-gesture-controls)).
- **The opposite view.** Players of FC 27 ask that purposeful 1v1 dribbling stays effective while endless spinning
  becomes risky ([EA forums](https://forums.ea.com/discussions/fc-27-general-discussion-en/gameplay-feedback-excessive-left-stick-dribbling-dribble-fatigue-solution/13775327/replies/13816311)).

## Skill moves in 11-a-side matches (2.40)

Found: the gesture skill moves only worked on the built-in engine (street, practice); in matches on the football
engine the gestures were never read. Now `scripts/view/engine_skills.gd` plays each move into the engine as a short
script of stick directions and buttons (close control, sprint + close control = the engine's knock-on, shot then
pass = its fake shot). A move straight after another runs 30 % slower (the FC Mobile cost).

`tests/engine_skills_test.gd`, 6 tries each, measured 1.2 s after the move:

| move | kept the ball | turned | sideways |
|---|---|---|---|
| knock-on | 50 % | 22 deg | 1.2 m |
| body feint | 66 % | 15 deg | 1.8 m |
| ball roll | 100 % | 17 deg | 1.9 m |
| drag back | 100 % | (turns back to the stick after) | 0.4 m |
| step over | 50-100 % | 8-11 deg | 1.1-1.8 m |
| elastico | 66 % | 48 deg | 6.1 m |
| Cruyff turn | 50 % | 40 deg | 7.7 m |

## Shots from League-Soccer (Apache-2.0)

- **Chip** (flick up off SHOOT; pad: skill modifier + shoot) and **finesse** (flick sideways off SHOOT; pad: close
  control + shoot). gftest `GF_SHOT_STYLE`: normal 6.6 deg / 27.7 m/s, chip 20.7 deg / 19.8 m/s, finesse 6.0 deg
  with half the scatter and more curl.
- **Late aim**: the aim correction while winding up was calculated and thrown away; now it reaches the shot -
  for the human's player only (for the CPU it made every shot truer: goals 22 -> 31 in 4 matches).

## Player models

- Quaternius Universal Animation Library 1/2 (CC0): no football clips (combat, parkour, locomotion), so it adds
  nothing over GRF's own football animations ([Quaternius UAL2](https://quaternius.com/packs/universalanimationlibrary2.html)).
- What separated our players from FC's on screen was not size (both ~3 % of the screen width) but contrast and
  build: 2.39 deepened the kits, added rim light, a broader build and a firmer contact shadow.
- Next for the body itself: a higher-detail model (Meshy, needs the owner's go-ahead to spend credits) or sculpting
  the MakeHuman body in Blender (shoulders, calves, hair).

## Foundations taken in 2.43

- League-Soccer (Apache-2.0): one-two runs started on the pass contact, a first-touch penalty under pressure, fatigue
  from workload, the ball rolling slower, a wet pitch in the rain.
- zocram4cc/GameplayFootball (Apache-2.0, code only, none of its PES data): attacking runners actually run (the gate
  that let them was unreachable), the keeper may hold a ball that is going in, a keeper's parry or slide can no
  longer push the ball into his own net, and the player sent for a loose ball runs at it instead of standing.
  8 matches (gftest, CPU v CPU): goals 39 -> 38, shots on target kept out 73 %.
- vi3itor/GameplayFootball: reviewed, no gameplay changes to take.
- Not taken: zocram4cc's "catch by pace" (our retain code needs the catch animation; without it the ball would go
  in), its shot scatter (our engine already scatters, and long shots were cut in 2.42).

## 2.44: more foundations, tactics, stoppage time

- zocram4cc: the keeper's read of a shot stops 10 % short of the goal line (from past it he stood central whatever
  the aim); a ball-goer beside a still ball steps onto it before choosing a pass; a misplayed ground pass skids
  along the floor instead of lofting (8 matches: possession lost 916 -> 884); a shot aimed straight at goal goes to
  the corner away from the keeper (the human's shots inside 20 m: on target 52 % -> 57 %). The CPU already picks its
  corner from three lanes, so this changes only the human's.
- Tried and dropped: zocram4cc's receiver-pressure term for passes (possession lost 884 -> 946).
- Team instructions (pause and half-time menus): mentality, width, pressing, with a board whose dots move to the new
  shape. gftest GF_TAC_L, 4 matches each: all-out attack + high press holds the block 2.6 m further up and wins the
  ball back 106 times (normal 102, low block 90); wide 12.8 m across, narrow 7.3 m (normal 10.0 m). The CPU has a
  mild style per club, attacks and presses when losing after 70', sits deep when winning after 80'.
- Stoppage time (League-Soccer): announced at 89' (a minute, one for the end, one per goal in the half, 1-5), the
  clock reads 90+1'.
- Day matches: the sun sinks and warms over the 90 minutes.

## 2.45: zocram4cc, the next batch

zocram4cc/GameplayFootball is League-Soccer's fork taken much further; the repository holds no PES content (its
docs/ASSETS.md: PES-derived packs are built from a local install and git-ignored), its code is Apache-2.0.
Measured each, 8 matches CPU v CPU (possession lost / goals; 2.44: 884 / 31):

- taken: a receiver kills up to half a hard ball's pace (885 / 27); DOGSO - a man brought down through on goal is a
  red card, a yellow in the box for a genuine attempt at the ball; a panic clearance probes three lanes and takes
  the safest; an interceptor half-way down a pass lane priced at the ball's real flight time (it was u squared);
  passing and ball-control skill count for more (with the two before: 867 / 32); the man on an attacking run is
  always a pass option, and a little preferred; close in the CPU places its shot (856 / 31); the CPU shoots only
  when the chance (zocram4cc's xG: distance, angle, bodies in the lane) clears its bar (872 / 35)
- tried, not taken: the touch radius 0.4 -> 0.8 m (985 lost), the wider gate for hard balls (948, goals 49)
- not for our engine: the deferred card (our referee plays no advantage on cards), keeper "sharpness" (its own
  keeper model), the net's cloth (our net is drawn in Godot); already ours: no offside from corners, throw-ins and
  goal kicks, the offside restart where the offence was

## 2.47: the players' own ratings, playing styles

- Found: the 11-a-side engine never got the game's ratings - every club fielded the engine's stock players, so a
  90-finisher and a 60 played alike. Now each player's ratings (pace, finishing, passing...) become his 22 engine
  stats (engine_match_view.gd engine_stats), a substitute's too. gftest: a side rated 0.9 against one rated 0.55,
  4 matches, 14-3.
- Playing styles (zocram4cc ef6d5d5), read off the ratings so the same man plays the same way every match: a
  long-range shooter (power and finishing) shoots from up to 9 m further out, a fox in the box (a finishing
  striker) wants it more, a playmaker (vision) and the holding men look to pass first.
- The game's real squads (gftest GF_STATS_FILE, 4 pairings x 2): 4.4 goals a match, 20 shots, 71 % of shots on
  target kept out.
- Not for our engine: zocram4cc's keeper save model (f14c99d) replaces a coin flip our engine never had.

## 2.48-2.49: Ultra graphics, the referee, wind

- Ultra (Forward+, Settings > Graphics engine): SSAO, subsurface skin, SSR on a wet pitch; a failed start steps down.
- zocram4cc: a flagged attacker stays offside after a deflection or a save (only a deliberate play resets it);
  a standing tackle from behind is a booking (it was always a plain foul); wind on a ball in the air (half the
  matches, harder in the rain), shown by the clock.
- How much of zocram4cc: of its 393 engine commits ~290 cannot serve us (~140 presentation drawn by Godot in AFC,
  ~70 PES import, ~80 measurement and its own build); of the ~45 gameplay changes, ~27 are taken or tried.

## 2.51: tap passing, first-time finishes, shot types (FC Mobile's controls)

FC Mobile (EA gesture guide): a tap on or behind a team-mate passes to his feet, ahead of him into space, a double
tap lofts it. AFC: a quick tap anywhere passes (to feet when it is on/behind a team-mate, else to that exact spot),
a long press lofts it there (a lob, a lofted through ball, a cross) - a long press instead of a double tap so a
ground pass never waits to see if a second tap comes; a double tap on your own player stays the step-over.
- Engine: gf_pass_to + the AfcPoint modifier (aimed passes are not re-targeted at the kick); a lofted ball to a spot
  aims 22 % short (the engine's lob is tuned to drop at a runner's stride). gftest GF_TAP_TEST: ground to open grass
  ~70 % within 3 m; lofted lands within 1-2 m. tests/tap_pass_test.gd drives it through the real touch path.
- First-time finishes: SHOOT pressed while a cross is in the air was always chested down (gftest GF_CROSS_TEST:
  0 strikes in the air in 45 crosses) - the trap was offered alongside the shot, and the shot clips for a high ball
  (header, diving header, bicycle, volley) almost never matched. Now a waiting shot takes the trap off the table
  and gets the keeper's height slack: 5 struck in the air in 35 crosses.
- Shot types: flick SHOOT down = low drive (4.8 deg v 8.3, it goes wide rather than over when it goes wrong); hold
  SHOOT till the ring is full = power shot (34.7 m/s v 29.5, more scatter); with the chip (up) and finesse (side).

## Still to take

- League-Soccer: stoppage time, deferred cautions, wind, human sprint speeds.
- Open Football / Buckland rules for the built-in engine's defending (Task 5 of the gameplay plan).
