# FLIPNOVA: facts about the game as it is (read this before proposing anything)

Checked against the code and real screenshots on 2026-11-10 (line `b42`, commit 087cbef in the build worktree).
Written because a story/sound proposal was made without re-reading the game and got four things wrong.

## Characters are squares
- Every playable character is a **small pixel cube with eyes** (16x20 art), not a person with arms and legs.
- **FLIPPO**, the default hero, is **red-orange** (`#ff5a3c`), white eyes. Not cyan.
- Skins are other cubes with an accessory (hair, horns, aura). New story characters must exist as cube skins too.

## The boss fight that exists today
- There is **one boss: THE CRIMSON TYRANT** (a huge horned red king with blades, an arrogant-king voice:
  "YOU DARE STAND BEFORE A KING?").
- **INFINITY VOID is the HERO of the duel, not a boss**: a dark-blue cube with white spiky hair and blue eyes
  (skin `ivoid`). The weekly event is "INFINITY VOID vs THE CRIMSON TYRANT".
- The duel already has: a VS intro with lines, 3 phases, 3 hearts, checkpoints, continues, seal orbs that damage the
  boss, **5 dimensions** (Crimson Citadel, Mirror Void, Starfall Cosmos = the 3D tunnel, Shattered Time, Collapsed
  Citadel), attacks `slash, cleave, pillar, beam, mirror, comet, gravity, chase, shard`, near-miss slow-mo, impact
  frames, cut-ins, a clash QTE, counter-QTEs, an ULT meter with per-skin ultimates, a defeat cinematic.
- The fight is a pure simulation on `FF.STEP` ticks (replays exactly from taps). Visuals read it and never write it.

## Sound as it is
- Rule written at the top of `js/audio.js`: **no music, no melodies, no tonal jingles**. Everything is air, clicks,
  digital pulses, crackle and bit-crushed noise.
- The flip is **already a mirrored pair** (up sweeps 700→2600 Hz, down 2600→700 Hz) with a small thump.
- Mix: sfx/ui buses → compressor → make-up → limiter. Heavy blows go through saturation and a short room reverb.
- Commit 087cbef (after build 42) added the duel **ambience** (wind, fire crackle, rumble, void echo, hiss, a
  heartbeat pulse, per dimension) with its own Ambience setting, plus clash / counter / ultimate sounds.
  The build 42 HTML and APK that were sent do **not** contain it.

## Look
- Neon pixel art on dark navy: pink-to-orange PLAY button, purple Adventure, green/cyan accents.
- Home: PLAY (Endless), Weekly Boss card beside Adventure (0/135 stars), Level Maker, Zen Practice.

## What the first story/sound proposal got wrong
1. Cast INFINITY VOID as boss 1. He is the hero.
2. Drew Flippo cyan and humanoid. He is a red-orange cube.
3. Proposed "5 new ideas" for the Tyrant without listing the 9 attacks and 5 dimensions he already has.
4. Sound board used ringing pitched glass and a rising pitch ladder on PERFECT, which breaks the no-tones rule,
   and "invented" a mirrored flip that already exists.

## Since build 46 (11.0)
- **STORY**: prologue + 5 chapters. Ch 1 THE CRIMSON TYRANT and ch 3 PALE NIRO are playable; ch 2 THE STILL HOUR,
  ch 4 THE HOURLESS, ch 5 THE GRAY are COMING SOON.
- The prologue is a **narrated HD film** (`video/prologue-en.mp4`, ~1:41, English narrator), made by `tools/trailer`
  (HD canvas art, synthesized sound). SKIP and the back button close it; old phones get the canvas prologue.
- Chapter 3 is a **hand-made 3-act boss level** (`js/bosslevel.js`): THE CHASE, THE MIRROR CAVE (real hold-to-rise
  flight), THE FALL; checkpoints, replays of every try, a rank; first win plays the truth and unlocks the Niro skins.
- Sound rule still holds and is stricter: **no held tones at all**, only noise-based effects, impacts and the voice.
