# FLIPNOVA: why the one tap feels flat (measured, 17 Nov 2026)

Measured on build 48 source with a bot that plays Endless like a person: it taps only when it must,
0.12-0.37 s before impact, never twice within 0.25 s. 12 runs, 41.8 s average (scripts in the session scratchpad).

## The numbers
| Measure | Value | What it means |
|---|---|---|
| Taps needed per minute | 18.8 | One tap every ~3 s on average. |
| Median time between needed taps | ~1.9 s | Even the busy part is slow. |
| Stretches with no needed tap longer than 5 s | 49 in 758 s of play | ... |
| Time spent inside those stretches | 426 of 758 s (56%) | **More than half the run asks nothing of you.** |
| Longest stretch with no needed tap | 20.3 s | |
| Near Misses | 0 in 12 runs | The 5 px rule can't happen in a floor/ceiling game. The feature is dead. |
| Perfect share of taps | 60% for a bot that taps late | A person taps early to be safe, so Perfect is rare (Amir's own report). |

Those quiet stretches are not empty: they hold spikes, coins and pistons that you pass without touching the button.
The screen looks busy, but your thumb has nothing to do. That is the boredom.

## What the research says
- One-button games get depth from timing, risk/reward and pacing, not from more content (abagames essay).
- Feedback must answer every input fast (under ~0.1 s) and be layered (game-feel skill, Swink's input/response/context).
- Difficulty should rise in waves with breathers, not a flat line (flow writing).
FLIPNOVA has the breathers but they are far too long, and the reward (Perfect) asks for the opposite of what a careful player does.

## Fix list, in order (none makes the game easier)
1. **Decision density.** In Endless, no stretch longer than ~3 s without a decision. Fill quiet parts with optional
   risk coins (the old idea B: coins in the dangerous half pay x3). Target: median gap <= 1.2 s, longest <= 4 s.
2. **Grade every tap.** GOOD / GREAT / PERFECT by how late you flipped, with feedback for each grade.
   Every tap answers you, and early players see there is more to get. FLOW then fills from GREAT and PERFECT,
   so it is reachable (fixes the problem Amir found with C).
3. **Bring Near Miss back** with a rule that can happen: a hazard on the surface you just left passes under you
   within ~0.15 s of leaving it.
4. Keep experiment A (shockwave on Perfect). Amir: "better".

## Rules respected
No ads, no music, no easier difficulty, no fake numbers.
