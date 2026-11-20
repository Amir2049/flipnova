# FLIPPO build 66 - whole-game audio polish audit (2026-11-20)

Scope: js/audio.js (all sounds synthesized), emit sites in game.js / boss.js / boss-niro.js / hdboss.js, UI sounds in ui.js.
Hard rule respected: every proposal below is air / click / pulse / crackle / bit-crushed noise / impact. No pitched sequences, no held tones.

STATUS OF MEASUREMENT: NOT MEASURED. This session had no shell, so the Playwright / OfflineAudioContext renders could not be run.
Section B is a gain-sum estimate from the source, not a measurement. Treat every dB figure as +/-4 dB until rendered.
Audio-director naming/style guide: not looked for in this pass (not checked). New names below follow the existing camelCase pattern;
note A.play routes any name starting with "ui" to the ui bus (audio.js:433), so non-UI sounds must not start with "ui".

## A. Event -> sound table (GAP = no sound feedback)

| Event | Source | Sound | Note |
|---|---|---|---|
| Flip (up / down) | game.js:235 | flip {up} | mirrored sweep, OK |
| Flip blocked (lock zone) | game.js:197 | lock | OK |
| PERFECT | game.js:247 | perfect (+flip same tick) | stacks with flip, combo, nerve |
| GREAT / GOOD grade | game.js:269-279 | none (only visuals) | GAP, low priority (flip alone) |
| NEAR MISS | game.js:623, 671 | near | OK |
| NERVE tier 8 / 15 | game.js:305 | frenzy | GAP: same sound as FRENZY, tiers not distinguishable |
| NERVE tier 25 / 40 | game.js:305 | record | GAP: same as milestone, stage, finish, brave route, ghost, rift clear |
| NERVE LOST | game.js:309 | lock | reuse of the "blocked" sound, acceptable |
| COMBO x2 / x3 | game.js:332 | combo {level} | OK |
| FRENZY | game.js:343 | frenzy | OK |
| Coin | game.js:834 | coin (random 3.2-4.8 kHz) | no cooldown, no variety beyond pitch |
| Gem (gold coin) | game.js:834 | gem | OK |
| Clean line / checkpoint | game.js:841, 707 | line | same sound for both |
| Milestone (SPARK...INFINITE) | game.js:393 | record | GAP: full "record" every 10-60 s |
| Stage change | game.js:766 | record | GAP: same as milestone, can fire together |
| World change | game.js:791 | world | OK |
| Pad / bumper / BURST | game.js:603, 779 | pad | OK |
| Fly portal in / out | game.js:594 | frenzy / world | reuse, acceptable |
| Secret glitch | game.js:849 | glitch | OK |
| Rift enter / clear / collapse | game.js:885, 916, 924 | frenzy / record / crash | acceptable |
| Death | game.js:939 | crash | OK (see boss stacking) |
| Intro countdown / GO | game.js:408-409 | ui / uiGo | OK |
| Victory lap | game.js:493-497 | coin / record / frenzy | OK |
| Respawn at checkpoint | game.js:972 | uiGo | OK |
| **Wind zone enter (tailwind)** | level.js:113, 1153 | **none** | **GAP**: only a visual (game.js drawWind) |
| **Wind zone enter (headwind)** | same | **none** | **GAP** |
| **FLOAT field enter** | level.js:156, 1123 | **none** | **GAP** |
| **HEAVY field enter** | same | **none** | **GAP** |
| Zone exit (wind / field) | - | none | GAP, optional |
| **Totem pass** | level.js:146 sets p.padFlip | pad (game.js:598-606) | works by reuse, but sounds identical to a pad, popup says "BOING!"; no stone identity |
| Boss intro / phase / dim shift | boss.js:310-336, 592-601 | impact, bossRoar, stingVS, cutIn, shiftBoom, warp, thunder | covered; stacking risk, see B |
| Boss ult / clash | boss.js:537-569 | clashIn, clashWin/Lose, ultStart, ultHit | covered, ambience ducked |
| Boss defeat of player | boss.js:1938-1948 | crash (game.js:939) + stingDefeat + glassCrack + whoosh + cutIn + shatter + tryAgain | crash is redundant and stacks |
| Boss win | boss.js:368-369 | stingVictory, unlock | OK |
| Boss hearts low | boss.js:378 | heart {fast} | OK |
| Results screen (non-best run) | ui.js:1509 | none | GAP (silent screen after crash) |
| Results: new best | ui.js:1510 | record | OK |
| Results: level up, skin, mission | ui.js:1488, 1497, 1219 | unlock / record / line | OK |
| Home / menu buttons | ui.js:2530 | ui (uiBack for home) | OK, consistent |
| Pause | ui.js:2508 | uiBack | OK |
| Start game | ui.js:1288 | uiGo | OK |
| Settings toggles | ui.js:2020 | ui | OK. Turning mute ON is silent by design (A.play returns when muted) |
| SFX slider | ui.js:1971 | coin on release | PROBLEM: coin is the quietest sound in the game, a poor volume reference |
| UI slider | ui.js:1971 | ui on release | OK |
| Ambience (boss) | audio.js:402 | own bus, own switch (amb2) | no level slider; bypasses sfx slider; muted correctly via master |
| Weekly Boss phases | boss.js:592-603 | see boss row | no per-phase identity beyond shared shiftBoom/roar |

Weekly Boss detail: boss-niro.js uses its own set (knock, niroShift, niroBreath, niroFree) - well differentiated. The shared Tyrant
phase moment fires up to four heavy layers at the same instant (boss.js:323 impact + bossRoar/shatter, 592 shiftBoom, 601 thunder, 334 quake).

## B. Level table (ESTIMATE, NOT MEASURED)

Method: summed nominal gains of simultaneous layers, discounted for narrow Q (a Q=9-12 bandpass on white noise is roughly -15 dB vs full band).
Reference: flip = 0 dB. Signs below are the expected direction only.

| Sound | Est. vs flip | Flag |
|---|---|---|
| flip | 0 | reference |
| coin | about -8 to -10 | quiet; fine as a rapid tick, but wrong as a slider test sound |
| gem | about -6 | ok |
| perfect | about +3 | ok; adds to flip on the same tick |
| near | about 0 | ok |
| combo / frenzy / record | +3 to +6 | record = 3 knocks (nominal noise gain 1.6-2.2 each) + 18 clicks; loud, and used 8+ ways |
| sig / knock / knockMe / niroFree | +4 to +8 | narrow resonances with nominal gain 1.9-2.0; verify these are not hotter than flip by more than about 6 dB |
| crash | +6 | crush noise 0.8 + thump + delayed knock; fine |
| hit-based (bossHit, impact, bossHurt) | +10 to +14 | heavy path adds a saturated saw at gain 1.0 |
| boom-based (shiftBoom, stingVS, bossFall, stingDefeat, warp) | +12 to +16 | hit + boom + swell stack; likely hitting the limiter (threshold -2 dB, ratio 20) |
| Boss phase moment (impact + roar + shiftBoom + thunder at once) | likely over the limiter | expect pumping and a "squashed" boss; MEASURE FIRST |
| Player death in a boss (crash + stingDefeat + glassCrack within about 0.1 s) | likely over the limiter | crash adds nothing there |
| flip + perfect + combo + nerve tier on one tap | 4-5 simultaneous events | compressor (threshold -18, ratio 4, makeup x1.5) is doing the work |
| Ambience (AMIX) | about -12 to -20 | fine; only 'rumble' + heartbeat thump (0.55) are strong; heartbeat can fight with `heart` sfx at 1-2 hearts |

To measure (for whoever has a shell): load index.html, call FF.audio.renderOffline([[0,name,opts]], seconds, 44100) for every key of S
(list in audio.js:173-366), take peak and RMS of channel 0/1, express in dB relative to flip. Also render the 4 stacked combinations above.
Script location requested: /tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/polish/audio/ (not created, not run).

## C. Proposed changes (max 10; TOP 5 marked)

Common note: all changes are audio feedback only. None touches physics, ticks, replays or proofs. `Game.prototype.sfx` already no-ops in demo / silent runs (game.js:137).

### 1. [TOP 5] Entry sounds for wind (tail / head) and FLOAT / HEAVY fields
- game.js, near-loop switch (about line 644-735): add a case, same pattern as 'check' / 'hint':
  `case 'wind': case 'field': if (!o.heard && p.x + PW / 2 >= o.x) { o.heard = true; this.sfx(o.t === 'wind' ? (o.kind === 'tail' ? 'windTail' : 'windHead') : (o.kind === 'float' ? 'fieldFloat' : 'fieldHeavy')); } break;`
- game.js respawnAtCheckpoint loop (about line 962-967): add `o.heard = false;` so a re-entry after respawn is heard again.
- audio.js, add to S (after `pad`, about line 252). Recipes (no held tones; all under 0.5 s):
  - windTail: `noise(b,{f0:500,f1:3600,q:1.2,dur:0.4,gain:0.4,a:0.25,pan:-0.3}); noise(b,{buf:A.crackle,type:'highpass',f0:3000,dur:0.3,gain:0.5,delay:0.15});` (rushing in, grit of sand)
  - windHead: `noise(b,{type:'lowpass',f0:2600,f1:260,q:0.9,dur:0.5,gain:0.5,a:0.05}); noise(b,{buf:A.crush,type:'lowpass',f0:900,f1:200,dur:0.4,gain:0.3,delay:0.05});` (pushed back, muffled)
  - fieldFloat: `noise(b,{type:'lowpass',f0:1800,f1:500,dur:0.35,gain:0.3,a:0.08}); for 3 pings: noise(b,{f0:1800+i*350,q:14,dur:0.03,gain:0.35,delay:0.08+i*0.07,pan:i%2?0.5:-0.5});` (soft air plus bubble ticks; pings are unpitched clicks)
  - fieldHeavy: `thump(b,{f0:100,f1:34,dur:0.28,gain:0.55}); noise(b,{buf:A.crush,type:'lowpass',f0:1800,f1:200,dur:0.3,gain:0.5}); click(b,{f:1200,gain:0.3,dur:0.02});` (pressed down)
- Why: the three newest worlds' signature mechanics (the player must change rhythm on entry) are silent. The player only has the visual haze.
- Risk: low. Level near() returns long zones whenever the player is inside, so `heard` stops repeats. Zones that start under the player at spawn will sound once. Keep gain at or below flip level.
- Files: js/game.js, js/audio.js.

### 2. [TOP 5] Totem gets its own stone sound
- game.js:598 (padFlip block): before `this.sfx('pad')` compute `const tot = this.L.near(p.x - 12, p.x + 12).some((o) => o.t === 'totem');` then `this.sfx(tot ? 'totem' : 'pad')`. Keep the rest of the block (the BOING popup text could be changed to a totem word by whoever owns UI text; not audio).
- audio.js: S.totem = stone knock family reused from `knock`: `noise(b,{f0:310,q:12,dur:0.09,gain:1.4}); noise(b,{f0:820,q:10,dur:0.06,gain:1.0}); thump(b,{f0:150,f1:60,dur:0.1,gain:0.4}); noise(b,{f0:600,f1:2400,q:1.4,dur:0.1,gain:0.3,a:0.02}); noise(A.verb,{f0:600,q:3,dur:0.15,gain:0.3});` (a knock plus a short whip: the flip it forces)
- Why: totem currently sounds like a spring pad. The jungle world's identity is stone, and the existing signature knock already is the game's stone voice.
- Risk: low; if a pad sits within 12 px of a totem the player hears a totem sound (harmless). Alternative with zero ambiguity: set `p.padKind='totem'` at level.js:146 (touches physics file, avoid).
- Files: js/game.js, js/audio.js.

### 3. [TOP 5] SFX slider test sound uses flip instead of coin
- ui.js:1971: `sound(r.dataset.rg === 'ui' ? 'ui' : 'flip')`.
- Why: coin is the quietest sound in the game (narrow Q9 band). A player setting SFX volume by ear will set it too high, then get the full boss hits and the limiter. Flip is the reference sound and the one heard most.
- Risk: none.
- Files: js/ui.js.

### 4. [TOP 5] Distinct NERVE tier sound, delayed off the PERFECT stack
- game.js:305: replace with `this.sfx('nerveTier', { tier: NERVE.findIndex((x) => x[0] === this.nerve) });`
- audio.js new S.nerveTier(b,o), t = o.tier (0..3), delay 0.06 so it lands after flip + perfect:
  `const n=(o&&o.tier)||0, d=0.06; click(b,{f:2500+n*600,gain:0.5,dur:0.014,delay:d}); noise(b,{buf:A.crackle,type:'highpass',f0:1800,dur:0.15+n*0.12,gain:0.6+n*0.2,delay:d}); thump(b,{f0:200-n*30,f1:60,dur:0.12+n*0.05,gain:0.4+n*0.1,delay:d}); if(n>=2) noise(b,{type:'highpass',f0:1500,f1:9000,q:0.7,dur:0.5,gain:0.3,a:0.2,delay:d}); if(n>=3) boom(b,{gain:0.5,len:0.9,delay:d});`
  (louder, denser, and lower with each tier; tier 3 = NOVA gets a boom; it escalates in density and weight, not in pitch notes)
- Why: four tiers pay coins and multiply score (HOT, BLAZING, UNREAL, NOVA) but share two sounds with FRENZY and a stage fanfare. The player cannot hear the ladder.
- Risk: medium-low. It lands on the busiest tick (flip, perfect, combo, nerve). Delay and gain figures need a render pass; keep tier 3 below the boss-hit level.
- Files: js/game.js, js/audio.js.

### 5. [TOP 5] Separate stage change and milestone from `record`; add a per-sound cooldown
- game.js:766: `this.sfx('stage')`. game.js:393: `this.sfx('mile')`. Leave `record` for finish, brave route, ghost, rift clear, new best.
- audio.js: S.stage = `swell(b,{len:0.3,gain:0.45}); for 4 clicks i*0.04: click(b,{f:2800+i*500,gain:0.4,dur:0.014,delay:0.3+i*0.04}); thump(b,{f0:120,f1:45,dur:0.25,gain:0.55,delay:0.3}); noise(b,{buf:A.crackle,type:'highpass',f0:2200,dur:0.4,gain:0.7,delay:0.3});` (a suck-in then a pulse burst: "speed up")
  S.mile = `click(b,{f:3500,gain:0.4,dur:0.014}); noise(b,{f0:700,f1:3200,q:1.4,dur:0.18,gain:0.3,a:0.1}); thump(b,{f0:160,f1:70,dur:0.1,gain:0.3,delay:0.1});` (a quiet callout, runs every 10-60 s)
- audio.js A.play (line 428): add a min-gap table checked before `fn(...)`: `const GAP={coin:0.03,flip:0.05,near:0.15,perfect:0.08,line:0.1,mile:0.5,stage:0.5}; A.last=A.last||{}; const nt=performance.now()/1000; if(GAP[name]&&nt-(A.last[name]||0)<GAP[name]) return; A.last[name]=nt;` (keep A.tap before it so tools still log).
- Why: eight different events share one loud 3-knock sound and a milestone and stage change can land in the same second. No sound has a concurrency limit now (frenzy magnet can pile up coin voices).
- Risk: low-medium. The cooldown changes what plays when events are rapid; renderOffline calls fn directly (line 443) so offline renders are unaffected. Pick GAP values after a render.
- Files: js/game.js, js/audio.js.

### 6. Boss death: do not play `crash` under a boss
- game.js:939: `if (!this.boss) this.sfx('crash');`
- Why: defeatStart (boss.js:1938) plays stingDefeat + glassCrack at once; crash adds a third hit.
- Risk: medium: I did NOT verify defeatStart runs on every boss death path (campaign / retry / HD boss). Verify before implementing.
- Files: js/game.js.

### 7. Heavy-layer budget on boss phase moments
- boss.js:323-334, 592-601: when `impact` + `bossRoar` + `shiftBoom` + `thunder` coincide, drop `thunder` or give it `delay: 0.25`, and lower impact(0.6) gain. Alternative in audio.js A.play: if a heavy name (impact, bossRoar, shiftBoom, stingVS, thunder, quake) played within the last 0.2 s, route the second through a 0.6 gain trim.
- Why: estimated limiter slam (section B). MEASURE first, then decide.
- Risk: medium (changes the Weekly Boss feel). Files: js/boss.js or js/audio.js.

### 8. Results screen soft "settle" for non-best runs
- ui.js:1509-1510: `else setTimeout(() => sound('uiBack'), 250)` (or a new quiet `uiResult` : lowpass noise 1800 to 400, 0.2 s, gain 0.3, ui bus).
- Why: after the crash tail the results screen is silent unless it is a new best. Gap, not a bug.
- Risk: low. Files: js/ui.js (and js/audio.js if a new name).

### 9. Ambience level slider
- ui.js settings list (line 1951): ambience has only an on/off switch; it also bypasses the sfx slider, so a player who lowers SFX still hears full ambience. Either add a slider that drives `AMB.bus.gain` (new `A.vol.amb`, audio.js:78-83) or route AMB.bus through sfxBus (audio.js:389, `.connect(A.sfxBus)` instead of master).
- Why: control consistency. Routing through sfxBus is the one-line version.
- Risk: low-medium (changes ambience loudness relative to sfx at default 0.8: it would drop by 2 dB; compensate in AMIX if needed). Files: js/audio.js (+ js/ui.js for a slider).

### 10. Grade feedback for GREAT / GOOD
- game.js:269-279: `this.sfx('near')` is too loud for GOOD. Add a tiny `click(b,{f:3200,gain:0.25,dur:0.012})` sound `grade` for GREAT only.
- Why: rules v8 says every saving tap answers you visually; audio is silent. Lowest priority.
- Risk: low. Files: js/game.js, js/audio.js.

## D. Top 5 to implement now
1 (wind / field entry), 2 (totem), 3 (SFX slider test sound), 4 (NERVE tier sound), 5 (stage / milestone split + cooldown table).
Files touched by the top 5: js/audio.js, js/game.js, js/ui.js. No physics or level files.

## E. Open issues
- Everything in section B must be rendered before any gain value in section C is final.
- "BOING!" popup text for totem (game.js:606) is misleading; owner of UI text should decide.
- Coin pickup variety was reviewed: pitch random only, no melodic ladder is proposed on purpose (a rising pitch per coin in a line would be a melody and breaks the HARD RULE). Cooldown in #5 is the only change.
