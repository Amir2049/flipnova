# FLIPNOVA autopilot — the daily work session

A scheduled Claude Code session runs this once a day. It is the "team working on their own".
It never publishes anything: Amir reviews and uploads every build himself.

## Hard rules (never break)
- Never publish to the production Supabase server, never run SQL against it, never change Amir's website.
  Tests must use `tools/mock-supabase.js` or block `*supabase.co` requests.
- Never commit the owner code or the owner hash. Owner tools stay hidden from normal players.
- No ads inside the game. No music. No religious symbols. Don't make the game easier. No fake numbers, accounts or reviews.
- English is the game's default language.
- Push only to branch `ccr-2aa9f916-rybcna` of Amir2049/Afc-gmae. Never open a PR.
- No model names in commits.

## The game line
Amir plays the build-21 line, not `main`'s build 22+. Rebuild it every run:

    git worktree add /tmp/w21 dc71ebe && cd /tmp/w21
    git am <repo>/releases/build-*-patches/0*.patch   # use the newest build-NN-patches folder

## Sessions (emergency meeting 3 Nov, company/reviews/2026-11-03-emergency.md)
- 04:17 Cairo, daily: this build run — ONE task per the day-by-day table in company/reviews/2026-11-04-all-hands-2.md (it overrides earlier tables; rules from 2026-11-03-all-hands.md still apply). tools/save-compat-test.js must pass on every build; passing builds get an APK in releases/latest/. No video, no weekly review here.
- 05:15 Cairo, Sun/Thu/Sat: the video run (rules below).
- 06:47 Cairo, daily: QA + CEO check (CEO session): reviews the day's build and video, writes Amir's 5-step review sheet; Sundays the weekly review.

## Skills (required)
Before each task, open company/SKILLS-MAP.md and run the listed skills with the Skill tool. In the log entry add a line `مهارات:` naming every skill you ran, and `اتساب:` naming any listed skill or step you could NOT run and why (missing input, tool failed, not applicable). A step that did not run must be named; an empty `اتساب:` means everything listed ran.

## Each run
1. Read `company/ROADMAP.md`, the newest file in `company/reports/` and `company/autopilot-log.md`.
2. Pick ONE task (the board table at the top of ROADMAP.md comes first, in order B1, B2, then the counter): the highest roadmap item (this month first) that can be done in code or as a document
   in one session and isn't already done in the log. Prefer things that make players come back.
   Tasks that need Amir (accounts, money, posting) → write the ready-to-use material instead.
3. Do it on the 21x line. Bump BUILD/versionCode by one, versionName by 0.1, and the service-worker cache name.
4. Run the tests in `tools/` that touch what changed, plus `node tools/test.js`. If anything fails and you can't fix it, throw the change away and log why.
5. Save the work: `git format-patch dc71ebe..HEAD -o releases/build-<N>-patches/` with a README like the previous one,
   and if `bash tools/build-web.sh` works, put the single index.html in `releases/build-<N>/` (skip files over 50 MB).
6. Append to `company/autopilot-log.md`: date, task, what changed, test results, what Amir must do or decide.
7. Commit and push to `ccr-2aa9f916-rybcna`.

## TikTok videos (Amir: the old ones were bad)
- Read `marketing/TIKTOK-QUALITY.md` and `marketing/TIKTOK-PLAYBOOK.md`, and choose hooks from `marketing/state/video-results.md` when it has numbers. Video runs only (Sun/Thu/Sat 05:15): make ONE new video with the Remotion template (fallback `tools/video/make-tiktok-v3.js`), following the recipe and the 5-item quality gate in company/reviews/2026-11-03-emergency.md and a TikTok Strategist review; save an 8-frame contact sheet next to it, and a new config (new challenge, new hook, new idea), check its frame strip against the bar, and save it in `marketing/videos/` (under 15 MB) with its caption + hashtags in a .txt next to it. Never post it yourself.

## Be creative (Amir asked for this)
- Don't just do the plain version of the task. Add one idea of your own that makes it feel special:
  a surprising visual moment, a clever twist on gravity-flipping, a fun reward, a shareable moment for TikTok.
- Keep it in the game's pixel style and its rules: the game stays hard, no ads, no music, no religious symbols.
- PAUSED until 1 Dec: the Sunday free idea. Once a week (Sunday), instead of a roadmap item you may build one small original idea nobody asked for,
  as long as it is tested and can be turned off.
- In the log, add a line "فكرة جديدة:" saying what you invented and why players will like it.

Write the log in Egyptian Arabic, short and plain.
