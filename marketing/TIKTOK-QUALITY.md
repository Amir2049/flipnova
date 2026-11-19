# TikTok quality bar (Amir: the old videos were bad — every new one must pass this)

What was wrong with the old ones: the game was a thin strip in the middle, the player was tiny, colours were dark,
the counter showed twice, 40-48 s long, and a robotic AI voice.

## Every video must
1. **Hook on frame 1.** Big yellow text (2-3 words) visible from the first frame. No intro, no logo first.
2. **Game is big.** Zoom so the corridor fills the width (tools/video/make-tiktok-v3.js crops 136x132 around the player, 1.6x). Brighter and more saturated than the game.
3. **15-25 seconds.** Fast fail montage (each try ≤ 3 s) → one heartbreak at 95-99% in slow motion with a freeze ("NOOO") → the win → end card.
4. **One clear number on screen:** TRY n + one big progress bar. Nothing duplicated.
5. **Sound:** punchy SFX (flip ticks, crash, win chime). No AI voice. Amir can add a trending sound inside TikTok when posting (that is not music in the game).
6. **End card ≤ 2.5 s:** YOUR TURN / FLIPNOVA / FREE - NO ADS / LINK IN BIO.
7. **Honest:** real gameplay from the real game (bot plays it), real tries. No fake numbers or fake comments.
8. Check 8 frames (a strip) before calling it done: player visible, nothing cut off, text inside the frame.

## Ideas that tend to work (test them, keep the ones whose views are best)
- "Rate my run 1-10", "Only 1% pass this", "I'm 1 flip away", "The floor is lava", POV texts.
- Same level, 3 skins: which is the hardest to see?
- "Comment a number and I'll try that many times."
- Post 1 a day for 14 days, write views/likes after 48 h into marketing/state/ so we learn from real numbers.

Render: `node tools/video/make-tiktok-v3.js <game-root> out.mp4 tools/video/configs/saw.json`
