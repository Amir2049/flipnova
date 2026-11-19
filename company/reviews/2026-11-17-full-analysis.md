# FLIPNOVA: full analysis vs other games (17 Nov 2026)

Measured on build 48 + Endless rules v8 with a human-like bot; compared against published reviews and design write-ups.

## Where the game is now
| What | Now | Note |
|---|---|---|
| Needed taps per minute (Endless) | 33 (was 18.8) | A Flappy Bird bot measures ~66/min (1.1 taps/s). |
| Time inside 5 s+ no-tap stretches | 18% (was 56%) | Left: gravity-change breathers between stages (on purpose). |
| First needed tap | 1.2 s (was 2.7 s, then nothing until 8 s) | |
| Content | 45 adventure stages, 9 worlds, ~30 obstacle types, bosses, story, maker | ~21,700 lines of JS in 27 files. |
| Players | 16 named players, 52 runs (3 Nov) | Too few to measure retention. |

## Side by side
| Game | What keeps people playing | FLIPNOVA has it? |
|---|---|---|
| Gravity Guy (closest: same flip) | one tap, fast restart, "almost got there"; criticised for hard pace swings and setting changes every few levels | Flip + fast restart: yes. Pace swings and world changes: yes, the same risk. |
| Super Hexagon | score = seconds, instant retry, callouts at 10/20/30 s | Milestones now yes; retry still goes through a results screen. |
| Geometry Dash | levels synced to music; practice checkpoints | Music: no (house rule). Checkpoints: Adventure only. |
| Jetpack Joyride | 3 missions active at once, kept across failed runs, levels up the player | Daily missions exist, but none for the new systems (GREAT, NERVE, milestones), and progress is not shown at death. |
| Downwell | a combo that pays at tiers and rewards risk | NERVE now (8/15/25/40). |
| Flappy Bird | nothing but the tap, ~1 tap/s | Half that tap rate now. |

## What is still missing, in order
1. **A beat you can hear (without music).** GD and Super Hexagon lean on music; FLIPNOVA forbids it. Fill the gap with
   rhythm from sound effects only: a soft click as each beat group passes, a rising click pitch through a RUN/RUSH
   (no tones: noise and clicks shaped by filters), grade-specific flip sounds (GOOD dull, GREAT bright, PERFECT crack).
2. **Missions for what the game is now, shown at death.** Jetpack's missions carry across failed runs and are always
   visible. Add "reach NERVE 15", "get 10 GREAT", "reach BLAZE (30 s)", "clear 3 PHASE beats"; show the closest one on
   the death screen ("NERVE 12/15") so the next run has a goal.
3. **Readability rule: one new idea at a time.** Two rejections this week (piston + spikes, the eye) and Gravity Guy's
   reviews say the same: new things must read in a glance. Every new obstacle appears alone first, with room after it.
4. **Retry without the results screen.** Super Hexagon and Gravity Guy restart at once. Keep results for records only;
   otherwise one tap = run again, with the one-line goal on top.
5. **Measure before more content.** Hyper-casual D1 is ~25-30%, D7 ~5-10% (vendor reports). Count anonymously: first
   session length, runs per session, day-1 and day-7 return. Without it every change is a guess.
6. **Fewer doors on the home screen.** Gravity Guy was praised for simplicity; FLIPNOVA's home has Endless, Weekly Boss,
   Adventure, Story, Maker, Zen. Put Endless first and big; the rest one tap deeper.

## What NOT to add now
New modes, more worlds, more bosses, more systems. The game already has more than most games in its genre; what
it lacks is feel, rhythm and clear goals between runs.

## Sources
- Gravity Guy reviews: pocketgamer.com/gravity-guy/review, 148apps.com/hook-worlds/gravity-guy-review, commonsensemedia.org/app-reviews/gravity-guy
- Jetpack Joyride missions: jetpackjoyride.fandom.com/wiki/Jetpack_Joyride/Missions, adriancrook.com/design-breakdown-jetpack-joyride, arcadianrhythms.com/2012/12/review-jetpack-joyride
- Geometry Dash: en.wikipedia.org/wiki/Geometry_Dash
- Super Hexagon: waltoriouswritesaboutgames.com/2014/11/12/six-sided-sadism-super-hexagon
- Downwell: gamedeveloper.com/design/downwell-design-analysis
- Flappy Bird bot tap rate: github.com/moeltae/flappy-hhi
- Retention benchmarks: innovecsgames.com/blog/mobile-game-retention-benchmarks, segwise.ai/blog/mobile-gaming-app-user-retention-strategies
