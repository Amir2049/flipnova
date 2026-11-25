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

## Foundations still to take

- League-Soccer: one-two runs started on the pass contact, knock-on by double-tapping sprint, the referee's
  advantage and deferred cautions.
- vi3itor/GameplayFootball: not yet reviewed for gameplay fixes.
- Open Football / Buckland rules for the built-in engine's defending (Task 5 of the gameplay plan).
