# FLIPPO b66 - visual polish audit (render notes), 2026-11-20

Scope of evidence, stated up front:
- LOOKED AT (screenshots): home screen, EN + AR, 844x390 and 640x360, plus home background at four times of day (desert, nebula, jungle, neon).
- CODE-READ ONLY (no screenshot, treat as hypotheses): wind/float/heavy zones, totems, the three new world backgrounds (js/game.js 1438-1496, js/worlds.js builders desert/nebula/jungle).
- NOT CHECKED: any in-run frame of stages 22-27, flip/PERFECT/NERVE/death/coin/stage-change feedback, results screen, Weekly Boss duel (boss.js / hdboss.js / bossworld.js), tablet and portrait screenshots (captured, not viewed), reduce-flashes behaviour, Level Maker/Zen. The turn ran out before I reached them.
- Home screenshots are in /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/polish/art/ (A = that folder below).
- Harness: scratchpad/polish/h.js (save needs enV1:1 or lang resets to en), t2.js (home sweep), t3.js (boss art box measure). To finish the audit, reuse h.js, call FF.UI.startGame('endless',{startX:22*FF.Level.STAGE_LEN, god:true}) with save owner:true.
- All proposals are draw-only (no write to simulation state, no timing/difficulty change), pixel style kept, no music.

Top 5 to implement now: items 1, 2, 3, 4, 5.

## 1. [TOP 5] AR boss card sprite collapses to a sliver every 1.6 s (CONFIRMED)
- Seen: A/home-640-ar.png, A/crop-boss-640-ar.png (sprite is a 2 px sliver at the card edge). Measured with t3.js: transform matrix(-0.82,0,0,1) mid-animation, box otherwise in the right place.
- Cause: `@keyframes float` (css/style.css:446) animates `transform` only, which overrides the RTL mirror `html[dir=rtl] .bossArt { transform: scaleX(-1) }` (style.css:691). Mirror interpolates -1 -> 1 and passes through 0 width. Animation is applied at style.css:727 (and :689-693 region).
- Change: style.css:691 -> `html[dir=rtl] .bossArt { transform: none; scale: -1 1; }`. `scale` is a separate property so the float keyframe no longer touches the mirror. (`translate` is already used on this element at :717, so the same pattern is in use.)
- Why: this is the one real defect on the home screen; the boss is the weekly hook and in Arabic it flickers out. The QA fix for the tag/sprite overlap did not cover it.
- Risk: very low. Verify at 640x360, 844x390, 1024x768 in AR (the matrix reads -0.7 to -0.8 at all three, so it is not size specific).
- Files: css/style.css

## 2. [TOP 5] EN boss card sprite is clipped on its left edge (CONFIRMED)
- Seen: A/crop-boss-640-en.png (horn and the grey crate cut by the card edge); measured art box x=148 vs card x=152 at 640 wide.
- Change: style.css:717 `inset-inline-start: calc(var(--u) * -2)` -> `calc(var(--u) * 1)` (keep the 14u start padding at :714, art is 17u wide so it still clears the text). Same file as item 1, same visual check.
- Why: the card has `overflow: hidden` (style.css:722-723), so a negative inset crops the sprite; it looks unfinished next to the clean Adventure door.
- Risk: very low; check the tag does not touch the art in AR/EN at 640 (the previous overlap bug).
- Files: css/style.css

## 3. [TOP 5] Home moon is a tan square with a dark notch on non-dark skies (CONFIRMED)
- Seen: A/home-640-ar.png, A/home-ar-tod1.png (nebula dusk: tan block plus navy rectangle), A/home-ar-tod2.png (jungle night). On desert/jungle/nebula skies the crescent "mask" does not match the sky.
- Cause: js/homebg.js `light()`, sky-body block (~l.44-58): the moon is two fillRects (cream) and the crescent is cut by drawing `rgba(10,12,40,0.9)` rectangles over it, which only works on a near-black sky.
- Change: draw a pixel disc (rows of widths 4,8,10,10,8,4 via fillRect) with 2-3 darker crater pixels and no mask. Keep the same bx/by drift, keep the sun branch. Colours stay what they are today (cream); no new palette.
- Why: it is on the first frame every player sees and reads as a rendering glitch.
- Risk: low; pure cosmetic. Check all four times of day and `lite` mode.
- Files: js/homebg.js

## 4. [TOP 5] Wind zones: orange on orange, weak edges (CODE-READ; needs one in-run screenshot to confirm)
- Where: js/game.js:1459-1478 `drawWind`. Zone fill is alpha .09 and the edge bars alpha .75, tail #ffc23a / head #ff7a3a, over the desert sky/dunes (worlds.js desert: #f08a2a..#c8762e). Streaks are #ffe2a8/#fff at alpha .5 with no outline.
- Change (no new colours): (a) under each 2 px edge bar draw a 1 px dark line (#05060d, alpha .8) on its inner side; (b) draw each chevron twice, first a +1 px offset dark copy; (c) streak alpha .5 -> .75. Direction cue stays the chevron shape and the TAILWIND/HEADWIND label, so colour is still not the only cue.
- Why: the zone must be readable before the player commits; tint at .09 on a bright orange sky is close to invisible, leaving only the label.
- Risk: low; draw-only. Verify against desert stages 22-23 and the same zone over other worlds.
- Files: js/game.js

## 5. [TOP 5] Reduce-flashes / low quality gating for the new zone effects (CODE-READ)
- Where: js/game.js drawTotem l.1480 (glow pulse `sin(t*6)`), drawWind (o.w/9 streaks, `t*sp` scroll), drawField (bubbles, arrow bob). None reads the reduce-flashes or low-quality setting (homebg.js does, via FF.save.settings.reduceFx).
- Change: read the same flag the rest of Game uses for reduce-effects (confirm the exact name in game.js before writing; I did not verify it). When on: totem glow constant at .55; wind streak loop `i += 2` and half speed; field bubbles `i += 2`. Zone fill, edges, labels and chevrons are unchanged so readability holds.
- Why: totem pulse is ~1 Hz brightness modulation over a full-height strip; cheap to calm. Cuts per-frame fillRects in zones (a 300 px wind zone draws ~33 streaks + chevrons).
- Risk: low; ensure the flag is a render-time read only (never in Level/Phys), so replays still verify.
- Files: js/game.js

## 6. Totem is dark stone on dark jungle; no approach cue (CODE-READ)
- Where: js/game.js:1480-1496 `drawTotem`: 6 px pole #3a4a2e / #5e7448 over jungle mid layer (#2a1c10 trunks, #1c5a26 canopy), glow alpha .22, vines #2f9a3a. Arrow glyph is 2 px wide.
- Change: 1 px dark outline columns (#0a1006) either side of the pole; widen the arrow to 4 px and keep it white-tinted; while the player is within ~48 px before the totem, brighten the glow to .5 for a "about to flip" read (reads this.p.x, already read for `passed`; writes nothing). Passed state keeps its dim look (that part is already good).
- Why: the totem flips you for free; missing it or being surprised by it is a feel problem. Shape cue (double arrow) already exists, so this is a contrast fix.
- Risk: low-medium; art-director should approve the glow level.
- Files: js/game.js

## 7. Spikes vs the three new world surfaces (UNVERIFIED hypothesis)
- Concern: red/orange hazard colour (COL.hazard) on desert dunes (#c8762e/#a85a22) and purple phase walls on the nebula gas giant (#6a3ad8..#b07aff). Colour-blind mode already outlines spikes white (sprites.js), which suggests a known weakness.
- Proposed (after a screenshot check): in FF.drawSpikes (js/sprites.js) always add a 1 px dark under-outline when world.id is desert, nebula or jungle (not only in colour-blind mode). Palette choice stays with art-director.
- Risk: medium (spikes are drawn everywhere; hitbox must still match what is drawn).
- Files: js/sprites.js (plus a world flag read in js/game.js if needed)

## 8. Zone colours collide with world palettes (CODE-READ)
- FLOAT green (#3fdc7a, game.js:1440) on jungle green and next to the green totem (#7aff6a); HEAVY orange (#ff6a1a) on desert orange; wind orange on desert. Shapes differ (bubbles vs arrows vs chevrons) so colour is not the sole cue, but at a glance these merge.
- Proposed: per-world tint override table in drawField/drawWind (e.g. world.id -> zone colour). Specific colours need an art-director decision, so I am not choosing them. Mechanism only.
- Risk: medium, subjective. Files: js/game.js (and js/worlds.js if tints live on the world object).

## 9. Nebula "drifting rocks" read as hazards (UNVERIFIED)
- js/worlds.js nebula builder, "drifting rocks" loop: 9 grey-violet discs (#5a5070 / #2e2840) in the mid layer at y 150..H-50. They are the same shape language as saws/mines. Proposed: move to the far layer or lower their contrast (art-director). Verify in-run first.
- Risk: low. Files: js/worlds.js

## 10. Language button glyph reads as "e" in English UI
- Seen: A/home-en-844.png (top-right, first icon looks like the Greek epsilon); in Arabic it shows "EN", which is clear.
- Change: show "AR" in Latin letters when the UI is English, or enlarge the Arabic glyph. Text in the button is set from ui.js (langToggle ~l.2477 and the topbar render); index.html:~64 `#langBtn`.
- Risk: very low. Files: js/ui.js (label), css/style.css if size changes.

## 11. Home: Boss and Adventure doors differ in edge treatment
- Seen: A/home-en-844.png: Adventure has a lip and drop-plate, boss card is flush with no plate (it picks up one only while glowing). Align the boss card border/shadow with .door.adv. Cosmetic.
- Risk: low. Files: css/style.css (lines ~720-731 .doors .evCard.weekBoss)

## 12. Still to be audited (not checked)
Endless feedback (flip, PERFECT, NERVE, death, coin pickup, stage-change banner), results screen at 640x360 and tablet, Weekly Boss duel in both painters, tablet/portrait home (screenshots exist: A/home-tab-en.png, home-tab-ar.png, home-portrait.png), reduce-flashes behaviour in-run. QA signoff b66 also lists the b61 worlds and the boss duel as "no human playtest", so these remain open.
