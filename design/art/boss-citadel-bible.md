# ⚔️ Weekly Boss — art bible, asset spec, ideas and pacing (build 36)

INFINITY VOID vs THE CRIMSON TYRANT, in THE CRIMSON CITADEL. Original characters and world. They are not
based on any existing franchise: no borrowed names, faces, marks, hand signs or signature moves.
Code: `js/bossworld.js` (the reusable boss-world system and the Citadel), `js/boss.js` (the fight), `js/sprites.js` (`ivoid`).

## 1. Art bible (terse)

**Identity:** a duel between two overwhelming rivals. The cold, calm star (silver, star-blue) faces the burning king
(obsidian, molten gold, blood red). Every frame puts **blue on the left** and **red on the right**.

**Palette:** each variant is one set (`PAL` in bossworld.js). Nothing is shared with the 9 normal worlds.
| Variant (phase) | Sky | Silhouettes | Glow / seams | Weather |
|---|---|---|---|---|
| EMBER DUSK (1) | #0c0208 → #c2381e → #ff8a3a | #2e0a18, rim #6a1a2a | #ff5a1a / #ffd27a | rising embers, a burning eclipse |
| BLOOD STORM (2) | #05020c → #7a1438 → #c2283a | #1e0a26, rim #4a1858 | #ff2a4a / #ffb0c0 | slanted rain, forked lightning, a blood moon |
| HELLSCAPE (3) | #000 → #a01404 → #ff4a00 | #1a0404, rim #7a1806 | #ff8a00 / #fff2a0 | falling debris, lava drips, sky fissures, red pulse |
| Hero accents | — | #141a3a body | #7fe8ff, #b8a6ff, #ffffff | star motes |

**Silhouettes:**
- The Tyrant fills about half the screen height at the right edge. He has horns that sweep out and up like a crescent, a crown of 5 spikes, broad spiked pauldrons, 4 arms (2 cleavers and 2 fists) and a tattered mantle down to the floor. A 1-px rim light in the phase colour always separates him from his dark world.
- Infinity Void is the 12-px runner with a swept, spiky silver crest streaming behind him, star-blue eyes with a white glint and a night collar.
- Background layers stay lower in contrast than anything that can hurt you. The danger colours are red (warning) and white-hot (lethal).

**Animation rules:**
- Every attack has wind-up, then release, then recovery. The wind-up matches the telegraph (≥ 0.62 sim s ≈ 0.5 real s).
- Hits flash white for 0.08 s, the boss recoils, and the hit-stop scales with damage: 0.035 s normal, 0.06 s for a big hit.
- Cinematics run for 2 s or less. Full-screen cut-ins only appear while nothing can hurt you. During combat a cut-in uses the strip below the floor.
- Juice returns to rest: zoom punch-in ≤ 0.45 s, impact frame 0.05 s, then a chromatic ghost 0.17 s. All of it is off with Reduce effects.
- All motion is drawn from the simulation clock. Nothing uses `Math.random` in the fight logic, so replays look and play identical.

## 2. Asset spec (everything is procedural canvas pixel art, no image files)

| Asset | Size | Frames / states | Where |
|---|---|---|---|
| Tyrant body + mantle | 170×170 buffer, ~110 px tall | breathing (sin 2.4 Hz), recoil, roar, prowl (phase 3), death crumble | `drawTyrant` |
| Tyrant face | 26×22 hand map (`HEAD`) | jaw open 0–6 px (beam, roar, hit), eyes with 4 flame tongues | `drawHead` |
| Horns + crown | 2 × 26-segment curves, 5 spikes | molten tips in phase 3 | `drawTyrant` |
| Front arms + cleavers | 2 limbs, 22×11 blades | idle, slash wind-up/swing, throw loop, roar | `seg`, `cleaver` |
| Back arms (fists) | 2 limbs | idle, raise, slam | `drawTyrant` |
| Spectral flame arms | 2 limbs | grow in over 0.6 s from phase 2 | `drawTyrant` |
| Aura | 16 / 26 flame tongues | phase 2 crimson, phase 3 black-and-fire | `drawTyrant` |
| Rim light | silhouette copy ×4 | phase colour | `renderMid` |
| Slash wave | 16×22 crescent + 3 afterimages | travels at 290–320 px/s | `renderMid` |
| Cleaver (thrown) | 8×30 blade + guard | drop 0.1 s, impact spark | `renderMid` |
| Shock pillar | 14×54 obsidian + molten core | rise 0.06 s, hold 1 s, sink 0.3 s, ground ring | `renderMid` |
| Fire beam | band 57 px high, from the jaw | sweep-in, wobble, white core, sparks | `renderMid` |
| Telegraphs | lines, columns, cracks, chevrons | blink at 16 Hz, solid in the last 25 % | `renderMid` |
| Seal orb / grand seal | 10–12 px ring + 4 motes | spin, pulse, "FLIP" tag | `renderMid` |
| Seal bolt | comet, 8-dot trail | 0.3 s arc, impact bloom | `renderMid` |
| Time-shield | 28-dot ring | 0.55 s | `renderFront` |
| World layers | sky 320×180, far 640, mid 560, floor 64×24, ceiling 64×36 | ×3 variants, cached | `paint*` |
| Live props | braziers, fog wall, chains/rubble foreground, vignette | animated | `drawVariant`, `drawFront` |
| Transitions | wipe (phase 2), 20-px shatter shards (phase 3) | 1 s | `BW.wipe`, `BW.shatter` |
| Cut-ins | full band (letterboxed) / bottom strip | slide 0.12 s, speed lines | `renderOverlay` |
| Intro | darkness + cracks + eyes, burst, VS splash | 3.4 s first time, 1.6 s after (a tap skips) | `renderIntro` |
| INFINITY VOID skin | 16×20 sprite | spiky crest, star eyes, collar; aura (combo), shimmer, start burst, STARDUST trail | `sprites.js`, `game.js` |

## 3. Brainstorm: 14 ideas, the best 5 kept

1. ✅ **Slash waves** along the floor or ceiling, alternating 1/2/3 per phase (dodge by flipping).
2. ✅ **Cleaver rain**: blades thrown into the floor or ceiling ahead, marked by red columns.
3. ✅ **Fire-beam sweep**: one half of the lane, then the other, with a 0.55 s gap to flip through.
4. ✅ **Shock pillars**: a ripple of eruptions alternating floor and ceiling.
5. ✅ **Counter + time-shield**: a last-moment dodge hits back, and the shield shatters slash waves (an impact frame on every counter).
6. Chain lash from the ceiling (cut: too close to the existing pendulum).
7. Gravity seize, where the boss flips your gravity (cut: it takes control away, which is unfair at one life).
8. Red decoy seals (cut: they punish the core reward loop).
9. Eclipse blackout with only the telegraphs lit (cut: the weekly DARKNESS twist already does it).
10. Ember mines on the lane (cut: they are static spikes in disguise).
11. Split-screen "clash" freeze on a counter (merged into the impact frame + cut-in).
12. ✅ (cinematic) Phase-3 shatter of the whole world into the HELLSCAPE.
13. ✅ (cinematic) Final blow: slow motion, white-out, the Tyrant crumbles into particles, then the unlock.
14. Hero super-move at full aura (cut for now: a future skin ability).

## 4. Pacing (level-design): the tension/rest curve

| Beat | Time (sim s, bot) | Intensity | What happens |
|---|---|---|---|
| Entrance + VS | 0–3.4 | 0.2 | teach the stakes: one life, two rivals |
| Phase 1 TEACH | ~3–25 | 0.4 | single waves, 3 cleavers, 3 pillars, 2-beam sweep, rest 0.55 s, speed 150 |
| Rest: PHASE 2 | 2.5 s | 0.1 | cut-in, wipe to the storm, arms grow |
| Phase 2 DEVELOP | ~25–45 | 0.7 | double waves, 4 cleavers/pillars, 45 % combos, rest 0.3 s, speed 165 |
| Rest: ARENA COLLAPSE | 2.5 s | 0.15 | shatter transition, VOID AWAKENED (+1 seal damage) |
| Phase 3 TEST | ~45–70 | 1.0 | triple waves, 5 cleavers/pillars, 3-beam sweep, 80 % combos, speed 180 |
| Climax + reward | 3.4 + 3.4 s | release | the fall, white-out, INFINITY VOID unlock |

Fairness rules held by the code: the next attack's first danger never starts until the last one is behind you (`overlap` < telegraph), alternating hazards leave ≥ 0.29 s flip windows at their tightest, and a planning bot clears every phase (`tools/boss-test.js`).
