# Performance Report -- FLIPPO build 66 -- 2026-11-20 (PARTIAL)

Status: the run was stopped on the coordinator's instruction. Several requested measurements were not taken (see "Not measured").

## Budget and method
- Budget: 60 fps = 16.7 ms/frame on a mid-range phone. **This is an assumption. The owner has not committed it.** It was not changed.
- Setup: headless Chromium 153 on a 4-core Linux box, **software-rendered (no GPU)**. Viewport 844x390, deviceScaleFactor 2, CDP `Emulation.setCPUThrottlingRate` = 4. Supabase routes blocked. Save `{runs:6,tutDone:1}`. Owner Shield mode was used for Endless and the boss.
- A test driver (not game code) pressed flip every 380 ms. Each scenario ran 20 s after a 3.5 s warm-up, in a fresh browser.
- Frame interval = delta between rAF timestamps. JS cost = time inside the rAF callbacks. "task" = CDP TaskDuration as % of wall time. The JS figures are post-throttle (ms on the emulated phone).
- Caveats:
  - The headless CPU throttle does not model a phone GPU, a thermal limit or WebView. GPU-side cost is not measured.
  - Frame intervals sit on the 16.7 ms vsync grid, so p50/p95 can only be 16.7 / 33.3 / 50 and so on.
- Scripts: `/tmp/claude-0/-home-user/9ff758b5-e8da-5c09-9ea4-2af125b20c3a/scratchpad/polish/` (`lib.js`, `scen.js`, `boss.js`, `sum.py`, raw JSON in `out/`).

## Frame time at 4x CPU throttle (budget 16.7 ms)
| Scenario | fps | interval p50 | p95 | max | frames >33 ms | JS p50 / p95 / max | main-thread task % | Verdict |
|---|---|---|---|---|---|---|---|---|
| Home idle | 59.95 | 16.7 | 16.7 | 33.5 | 1 | 1.1 / 2.2 / 7.4 | 65 (style 14) | OK on frames. Main thread is busy. |
| Endless stage 1 (neon) | 59.7 | 16.7 | 16.8 | **66.6** | 4 (one >50) | 2.6 / 5.6 / **73.1** | 40 | OK except one hitch of about 50 ms over budget |
| Desert (stage idx 22) | 59.95 | 16.7 | 16.7 | 33.4 | 1 | 3.5 / 7.7 / 28 | 46 | OK |
| Nebula (idx 24) | 59.95 | 16.7 | 16.7 | 33.4 | 1 | 3.3 / 6.5 / 39.2 | 43 | OK |
| Jungle (idx 26) | 59.95 | 16.7 | 16.7 | 33.3 | 1 | 3.3 / 6.6 / 29.7 | 44 | OK |
| Boss intro (HD default) | **42.8** | 16.7 | **66.6** | **216.7** | **173** (51 >50) | 6.2 / 26.8 / **166.6** | 82 | **OVER** |
| Boss dim 0 citadel, fight | **54.6** | 16.7 | **33.3** | 116.6 | **85** | 5.3 / 14.9 / 99 | 72 | **OVER** |
| Boss dim 1 mirror void | **55.2** | 16.7 | **33.3** | 83.3 | **90** | 5.5 / 12.2 / 77.4 | 72 | **OVER** |
| Boss dim 2 / 3 / 4 | not measured | | | | | | | the dim 2 run was killed by the stop order |
| Results screen | not measured | | | | | | | |

### How far over budget
- **Boss with HD on:** p95 is 33.3 ms (2x budget) in the fights. In the intro p95 is 66.6 ms (4x) and the worst frame is 216.7 ms (13x). 14% of intro frames (173 of 1,200) and about 7% of fight frames exceed 33 ms.
- **Boss measurements are a mix.**
  - HD started on (`hdOn` true) at governor level Q0, with a 866x487 backing store.
  - Inside each 20 s window the built-in quality governor (`FF.HDBoss._dbg.Q`) stepped down. It went to level 1 (640x360 store) and then to level 2, which switches HD off and hides `#hdBack`.
  - Its "avg frame > 24 ms for two 45-frame windows" trigger fired in all three runs.
  - The fight figures therefore blend HD and pixel-only frames. They understate the HD-default cost.
  - On this emulated phone the default HD boss does not hold 60 fps. It downgrades itself, and level 2 swaps the look mid-fight.
- **Endless one-off hitch:** 66.6 ms (about 4x budget). The 73 ms JS spike is roughly 18 ms of real work. The cause is not identified. No such hitch appeared in the other worlds (max 33 ms, one frame each).
- **Home idle:** frames are on budget, but the main thread is 65% busy at 4x. JS is only 12.6% and style recalculation is 14%. That is thin headroom and a battery cost, so any extra work on the home screen would drop frames.

## Memory and leaks: NOT MEASURED
- JS heap growth over a 2-3 minute Endless soak: not measured.
- DOM node and canvas count over 10 run, death, again cycles: not measured.
- I only know that `hdBack` and `hdFront` are created once (`ensure()` in `js/hdboss.js`, guarded by `back.isConnected`). That is by reading the code, not by measurement.
- Next step: run the soak with `performance.memory` or CDP `HeapProfiler.collectGarbage`, then sample `usedJSHeapSize`, `document.getElementsByTagName('*').length` and `document.getElementsByTagName('canvas').length` per cycle.

## Hot functions: NOT MEASURED
- No CDP Profiler capture was taken. The worst scenario is the HD boss (intro, then the fights).
- Everything below is a hypothesis from the measurements and from reading the code. Capture a CPU profile before anyone implements it.

## Prioritized optimisation list
All items are visual only. None reads or writes sim state, and none changes difficulty, save keys or replays.

1. **HD boss does not hold 60 fps at 4x, and the governor ends by dropping HD.**
   - Where: `js/hdboss.js:32` (backing-store cap 1024 at Q0, 640 at Q1), `:259` and `:533` (governor), `:527` (`on()` turns HD off at Q>=2).
   - Change: first profile `drawWorld` and `drawTyrant` (`js/hdboss.js`, called from `frame()` at about `:540`) to find the real cost.
   - Options:
     - (a) Start at Q1 on coarse-pointer or app devices.
     - (b) Make the governor react faster. It needs 2 x 45 frames of average above 24 ms.
     - (c) Make level 2 degrade the effects (fog, glows) before it removes the HD layers.
   - Gain: unmeasured. The expected target is p95 33 ms down to 16.7 ms in the fights.
   - Risk: medium. The visuals change slightly. Q is visual-only state.
   - Owner: **technical-artist**. Needs a sign-off from technical-director on how much the look may be lowered.
2. **Boss intro spikes (up to 216 ms, 14% of frames over 33 ms).**
   - Suspect: baking in the dark intro (`prebake(f)` in `FF.HDBoss.frame`, `js/hdboss.js` about `:535`), plus the first-use bakes (`build()`/`bakeTyrant`).
   - Change: spread the bakes thinner or run them earlier, for example during the stage-load or wipe.
   - Gain: removes the worst frames (up to 13x budget).
   - Risk: low.
   - Owner: **engine-programmer** (bake scheduling), with **technical-artist** for bake costs.
3. **Home: main thread is 65% busy at 4x (style 14%).**
   - Suspects, all CSS animations that cannot run on the compositor:
     - `css/style.css:510` and `:557`, `breathe` animating `filter` on the infinite Play button.
     - `:449`, `evGlow` animating the custom property `--fc`.
     - `:450`, `hueRun` animating `background-position`.
     - `:504`, the logo's `float` animation combined with `filter: drop-shadow`.
   - Change: move the effects to `opacity` or `transform` on a pseudo-element, or pause them when not visible.
   - Gain: unmeasured. Up to about 14 points of main thread. Check by disabling each animation in a profile.
   - Risk: low. Visual only.
   - Owner: **technical-artist**.
4. **Endless 66 ms hitch at stage 1, cause unknown.**
   - Capture a Profiler trace with a long-task filter around world or stage transitions. Candidate: lazy world prep (`FF.prepareWorlds`, `js/main.js:14`) or the stage banner.
   - Owner: **engine-programmer**.
   - Gain and risk cannot be estimated until it is identified.
5. **No action needed.** Endless deep stages (desert, nebula, jungle) are on budget at 4x. JS mean is 3.6-3.9 ms and p95 is 6.5-7.7 ms, which is about 2x headroom before 16.7 ms. Verify with a heavier throttle (6x) before declaring them safe.

## Not measured
- Boss dims 2 (cosmos tunnel), 3 and 4. Boss results and defeat cinematic. Results screen.
- Boss with the governor pinned at Q0 (to isolate raw HD cost), and the same with `hdBoss:false` (to give a pixel-only baseline). `boss.js` has `PIN=1` and `HDOFF=1` switches for exactly this.
- JS heap soak. DOM and canvas growth. CPU profile of hot functions. GPU cost and any real-device run.
- 6x throttle headroom probe.

## Regressions since last report
No baseline exists. Not assessed.

## Escalations
- The 60 fps / 16.7 ms mid-range budget is an assumption and needs the owner's or technical-director's confirmation.
- Dropping HD quality (item 1) is a visual-quality trade-off for technical-director to decide.
