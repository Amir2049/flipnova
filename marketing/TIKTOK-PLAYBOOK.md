# FLIPNOVA TikTok playbook (3 Nov 2026)

Studied by the team (TikTok Strategist, Growth, Video Editor, Data). Sources at the bottom; most are marketing blogs,
not TikTok itself, so every rule below is a bet we test with our own numbers.

## What the research agrees on
1. **Tension on frame 1, not setup.** The strongest hooks open in the middle of danger. Gaming does best with
   "wait for it" tension and pattern interrupts. No logo, no intro, no "hey guys".
2. **Retention is the score.** TikTok pushes videos people finish and rewatch. Shorter almost always raises average
   watch time: aim 12-25 s. Rewatch: end on a moment that makes people want to see it again.
3. **Test hooks, not whole videos.** Keep the body identical and change only the first 3 seconds; post the versions
   on different days and compare 2-second view rate and average watch time in TikTok Analytics.
4. **Indie games that went viral** showed a clear, visually distinct moment that needs no explanation,
   with the hook understood in 3 seconds (FREERIDE: 715k views, ~13k wishlists). Developer-led, honest accounts beat ads.
5. **Series** raise watch time: viewers who like one part watch the next ("Day 3 of trying SAW HELL").

## Our formula (built into tools/video/make-tiktok-v3.js)
- **0-1 s:** cold open at 95% of the hardest level, saws on screen, big yellow hook.
- **1-5 s:** the 98% death in slow motion, freeze, "NOOO".
- **5-16 s:** fast fail montage, TRY 1 → 12 → 27 → 39 (≤ 3 s each), red progress bar.
- **16-23 s:** TRY 47 in slow motion at the end, CLEARED.
- **23-25 s:** YOUR TURN / FLIPNOVA / LINK IN BIO.
- SFX only (flip ticks, crash, win chime) plus optionally Amir's own voice. NO music and NO trending sounds (hard rule, emergency meeting 3 Nov).

## Hooks to test (same body)
| Version | Hook | Why |
|---|---|---|
| A | 98%. AGAIN. / 47 TRIES LATER... | pain + curiosity ("wait for it") |
| B | ONLY 1% / CAN BEAT THIS | challenge to the viewer's ego |
| C | RATE MY RUN / 1 TO 10 | invites comments (comments push reach) |

## Posting routine (Amir)
- 1 video a day, same hour (try 7-10 pm Cairo first; move it if the analytics say your viewers are elsewhere).
- Caption = a question ("Would you rage quit?") + 3-5 hashtags: #flipnova #indiegame #mobilegame #ragegame #fyp
- Pin a comment: "Free, no ads. Link in bio." Reply to the first comments fast, best replies as video replies.
- After 48 h write into `marketing/state/video-results.md`: views, 2 s view %, avg watch time, finished %, likes,
  comments, profile visits. The team picks the next hooks from these numbers only.

## TikTok tools to use (free, on Amir's account)
- **TikTok Analytics** (Creator tools → Analytics): per-video retention graph. The drop point tells us which second is boring.
- **TikTok Creative Center** (ads.tiktok.com/business/creativecenter): Trends → trending songs and hashtags by
  region (Egypt, Saudi, US); Top Ads → filter "Games" to copy hook *patterns* (not their videos).
- **Creator Academy / Creator hub** inside the app: follow its rules on originality (our own gameplay only).

## Sources
- https://www.stackmatix.com/blog/tiktok-hook-first-3-seconds
- https://www.stackmatix.com/blog/tiktok-creative-best-practices-2026
- https://soku.ai/blog/ai-creative-guide-tiktok-ads
- https://mintec.co/blog/tiktok-ad-creative-data-2026/
- https://www.admapix.com/blog/ad-intelligence/tiktok-ads-research-guide
- https://influenceflow.io/resources/how-to-boost-tiktok-video-watch-time-the-ultimate-2026-retention-guide/
- https://www.socialync.io/blog/tiktok-viral-retention-rate-2026
- https://howtomarketagame.com/2022/02/14/how-to-go-viral-on-tiktok/
- https://www.gamedeveloper.com/game-platforms/from-400-to-20-000-wishlists-with-1-video-how-tiktok-can-make-your-game-go-viral
- https://gameworldobserver.com/2022/06/15/whisker-squadron-flippfly-tiktok-wishlist-additions-steam
- https://presskit.gg/field-guides/tiktok-indie-game-marketing
