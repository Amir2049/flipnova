# What players of rival one-tap games hate, and where Flippo stands

Source: `replica/reviews.csv`, 36 real reviews (copied exactly, every one linked) from 3 pages:
App Store (Geometry Dash Lite), justuseapp (Flip Runner) and grand-screen (Geometry Dash Lite).
Ranked with `reviews.py` and the genre themes in `replica/game-themes.json`. The full ranked list
with quotes is in `replica/feedback.md`.

**Sample size is small.** 36 reviews, 2 games, 3 sources, almost no star ratings. Two more review
pages (marlvel.ai) refused automated reading. Treat the order below as a direction, not a measurement.
"Thin" in feedback.md means fewer than 3 reviews or one source.

| # | What they hate | reviews | Flippo today | Action |
|---|---|---|---|---|
| 1 | **Too many ads** ("ads every 15-30 seconds", "the ads come up too often and interrupt the flow") | 8 / 3 sources | **No ads at all** | Keep it. This is the main selling point; it is already in the store listing. |
| 2 | **Paywalls / subscriptions / premium currency** ("you need a subscription for that too?" about the level editor) | 7 / 2 sources | **No purchases. The Level Maker is free.** | Keep. Say "free Level Maker" in the store text (it is in the description already). |
| 3 | Physics / landing feel wrong (thin) | 4 / 1 | One tap, no jump arcs; fairness bot checks every stage | Nothing new. Keep `tools/human-test.js` green. |
| 4 | Difficulty spikes (thin) | 3 / 1 | Human-bot fairness test on every stage | Keep. Watch first-minute numbers. |
| 5 | **Lag and crashes** | 3 / 2 sources | Not measured on low-end Android in this session | **To do:** test the APK on an old, cheap phone (2 GB RAM) before the Play launch. |
| 6 | Accessibility (thin) | 2 / 1 | Colour-blind mode, reduce flashes & shake | Keep. Possible later: a high-contrast obstacle outline option. |

What they ask for: more levels (Flippo: 50 + Endless), secrets worth finding (Flippo: secret "?" gates),
a free level editor (Flippo has it), a better practice mode (Flippo: Zen + checkpoints).

## The angle

**"The gravity-flip runner with no ads and nothing to buy — and a free Level Maker."**

Every top complaint in this sample (ads, paywalls) is something Flippo already does not have.
The work is not new features. It is getting the game onto Google Play and saying this clearly.
