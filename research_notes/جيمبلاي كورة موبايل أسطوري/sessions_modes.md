# Session Design, Onboarding and Game Modes Around the Match in Mobile Football Games

Research compiled 2026-11-21. Every metric below has its date or data period attached. Many store-listing version notes show only day and month. Where the year is missing, they are presumably 2026 versions, read in November 2026.

## 1. Match length, session length, quick play vs full match, halftime, skip/simulate

### Takeaway
Mobile football games pack a full 90 "game minutes" into a few real minutes. DLS uses about 4-5 real minutes per half. The fastest competitive format seen here is FC Mobile's 90-second VS Attack, which plays only attacking chances. Full matches have an adjustable length in friend or custom settings, not as a default quick option. No official source confirmed a "simulate/skip match" button in the games researched.

### Cited Findings
- **DLS (First Touch Games):** matches are 90 simulated minutes in two 45-minute halves. Each half is about 4-5 real minutes, with a short halftime intermission. The pause menu allows substitutions and team changes at halftime and during play. The game may prompt auto-subs when a player tires. No skip/simulate option is mentioned. — [LevelWinner DLS 2021 beginner guide, updated 2021-07-07](https://www.levelwinner.com/dream-league-soccer-2021-beginners-guide-tips-tricks-strategies/)
- **DLS 2026:** the store listing does not state match length. It lists Dream League Live (real-time PvP), Global Leaderboards and Events, Dream Draft, "Daily scenarios with bonus objectives", seasons, a World Tournament event type, Clans and a Daily Bonus. Latest version is 13.430, dated 16 Sept (presumably 2026). A user review mentions a 30-second pause usable during live events. — [App Store: Dream League Soccer 2026](https://apps.apple.com/app/1462911602)
- **FC Mobile VS Attack:** EA calls it a "fast-paced 90-second mode" in Division Rivals and League vs League. — [EA official, "Rivals update: gameplay", 2025-06-06](https://www.ea.com/games/ea-sports-fc/fc-mobile/news/rivals-update-gameplay)
- **VS Attack details:** a match lasts 1:30 and gives "around 10-15 chances to score". It is chance-based (Basic, Good and Great chances) and sits in Division Rivals alongside Head to Head and Manager Mode. — [FIFA Mobile Guide VSA page, updated 2025-10-21](https://www.fifamobileguide.com/vsa)
- **Older VS Attack length:** guides for the FIFA Mobile era described a 2-minute match with no clock stop for set pieces and no extra time. EA's 2025 figure of 90 seconds supersedes this. — [FIFPlay VS Attack](https://www.fifplay.com/fc-mobile-vs-attack/)
- **FC Mobile Quick Match:** added 2026-05-27. It replaced the "vs Friends" tile and uses a Match ID lobby for friends and league members. It works in VS Attack or Head to Head with your own team, Classic clubs or national teams. Settings add extra time and penalties so a draw can be decided. The article gives no match-length options. — [EA official, Quick Match deep dive, 2026-05-27](https://www.ea.com/zh-hans/games/ea-sports-fc/fc-mobile/news/quick-match-deep-dive)
- **FC Mobile Manager Mode:** player forum posts describe it as fully AI-controlled, a "watch and manage" match that works like a lighter simulate option. — [EA Forums, Manager Mode passing thread](https://forums.ea.com/discussions/fc-mobile-general-discussion-en/fc-mobile-manger-mode---passing-issue/8070022/replies/8070044)
- **Player demand for longer matches:** FC Mobile forum users ask for a 10-minute match option and for minute settings in friendlies. This suggests there is no free choice of length in standard modes. — [EA Forums, "Minute settings for FC Mobile"](https://forums.ea.com/discussions/fc-mobile-general-discussion-en/minute-settings-for-fc-mobile/13595049)
- **eFootball mobile:** Friend Match has a configurable Match Length plus Extra Time and Penalty toggles. The guide's author advises "don't set Match Length above 10 minutes", partly because of load time, and warns of a bug where extra time voided matches. — [GamingOnPhone, Friend Match guide, 2025-09-19, updated 2025-09-24](https://gamingonphone.com/guides/efootball-friend-match-mode-guide-tips). A search-result snippet of the same page quoted "above 6 minutes" instead, so the threshold is unverified. App Store reviews complain of a fixed match length of about 4-6 minutes. — [App Store eFootball reviews](https://apps.apple.com/dm/app/efootball-2024/id1117270703)
- **Football League 2026 (MOBILE SOCCER):** the store lists online and offline play, "events and challenges", national and club cups, leagues and a Custom League. Version notes mention Player Mode, a Moment Challenge mode, and Derby, Christmas and Halloween challenge events (v1.6.6, 23 Oct). Match length is not documented. A user review complains of ads of "3 minute+" before a single match. — [App Store: Football League 2026](https://apps.apple.com/us/app/-/id6447961802). The Google Play listing shows 100M+ downloads, ads and IAP. — [Google Play event page](https://play.google.com/store/apps/eventdetails/4829013996948944897)
- **Score! Hero:** it has no full matches. Each level is "an individually crafted soccer scenario", a moment in a match, played by drawing the ball's path. — [App Store: Score! Hero (GB)](https://apps.apple.com/gb/app/score-hero/id847492141)
- **Console reference:** FIFA 23 half length is selectable from 3 to 20 minutes. — [Sportskeeda](https://www.sportskeeda.com/esports/how-long-game-fifa-23)

### Inferences
- The market has settled on three tiers of match length:
  - **Micro (about 90 seconds to 2 minutes, or one moment):** FC VS Attack, Score! Hero levels, FL26 Moment Challenge, DLS daily scenarios.
  - **Short full match (about 6-10 real minutes):** the DLS default, and eFootball and FC Mobile H2H.
  - **Custom length:** only in friend or custom settings.
- AFC should offer the same tiers. A good default for career or friendlies is 2 x 3-4 real-minute halves, with micro scenarios for session fillers.
- Halftime in DLS is a short management break for substitutions and tactics, not a cutscene. AFC could add "skip halftime" or "continue" as a single tap.
- FC Mobile's Manager Mode, an AI-played match the player watches and manages, is the closest thing to a simulate option. For AFC career fixtures the player doesn't want to play, a "simulate/auto-play" button would be a cheap way to reduce friction. No competitor was confirmed to have one, so this is a possible differentiator rather than a standard feature.

### Gaps
- I found no official current default match length for FC Mobile H2H or eFootball mobile vs-AI, or for DLS 2026 (only the 2021-era figure). Konami and EA help-centre pages were not found.
- I found no official confirmation of a skip or simulate-match option in DLS, eFootball or FL26.
- No source documented the match-length options in Football League 2026.

## 2. Onboarding / FTUE and D1 retention practices

### Takeaway
Football games onboard with a short guided tutorial, often a tutorial match that counts as real progress. They follow it with a low-stakes start (a low division, a weak squad, rewards for taking part). FTUE best practice is to get players to the fun within minutes, teach only the essentials, and allow immediate retries. The documentation found does not describe a difficulty-selection step in DLS or eFootball onboarding.

### Cited Findings
- **DLS tutorial:**
  - The tutorial match counts as your first Career league match.
  - Losing it "is not a major setback".
  - The tutorial can be replayed later from More > Training > Tutorial, though the match itself can't.
  - Players start in the Academy Division (8th tier) with squads in the 50s-60s, with 15 matches to promotion.
  - Source: [LevelWinner DLS 2021, 2021-07-07](https://www.levelwinner.com/dream-league-soccer-2021-beginners-guide-tips-tricks-strategies/)
- **DLS 2026 first launch:** you pick a captain from a list of legendary players. Daily Challenges pay Coins and Gems. — [GamingOnPhone DLS 2026 career guide](https://gamingonphone.com/guides/dream-league-soccer-2026-the-ultimate-career-mode-guide-and-tips/) (via search summary, not fully verified)
- **DLS 2020 guide:** a new-player reward follows the tutorial match. — [BlueStacks DLS beginner guide](https://dbk589trlnxim.cloudfront.net/blog/game-guides/dream-league-soccer-2020/dlsr-beginner-guide-en.html) (via search summary)
- **eFootball:** "Skill Up" mode on first launch is the tutorial, covering passing, dribbling, defence and shooting. It pays eFootball Coins, GP and Training XP, claimed via the Inbox. Extra Training (free kicks, skill moves, defending) follows in Extras. Guides tell new players they earn rewards just for taking part in online matches. — [MuMu Player eFootball 2026 beginner guide](https://www.mumuplayer.com/blog/efootball-2026-beginners-guide.html); [Game8 eFootball](https://game8.co/games/eFootball/archives/536186) (via search summary)
- **Score! Hero controls:** "simply draw a line where you want the ball to go." A single gesture, so the game teaches itself in level 1. — [App Store: Score! Hero](https://apps.apple.com/gb/app/score-hero/id847492141)
- **Roblox FTUE guidance:** successful onboarding teaches the essentials, gets to the fun quickly, and leaves players wanting more. High-D1 games reach this "through constant iteration and data-driven testing". — [Roblox Creator Docs, Onboarding](https://create.roblox.com/docs/production/game-design/onboarding)
- **PocketGamer.biz:** "get players into the fun part of your game as soon as possible", with clear goals and emotional rewards in tutorials. — [PocketGamer.biz FTUE article](https://www.pocketgamer.biz/first-impressions-count-creating-the-ultimate-first-time-user-experience)
- **devtodev:** D1 is driven by tutorial completion and first-session comfort. Track funnel steps of the tutorial. — [devtodev, Main Metrics: FTUE](https://www.devtodev.com/resources/articles/main-metrics-ftue)
- **Meta developer guidance:** design tutorial interactions with immediate retry opportunities. — [Meta Growth Insights: onboarding](https://developers.meta.com/vr/blog/growth-insights-series-best-practices-user-onboarding-recall-progression)
- **Unity's 10 FTUE tips** — [Unity](https://unity.com/how-to/10-first-time-user-experience-tips-games) (not fetched; listed for the report writer)

### Inferences
- AFC's "users call it hard" problem likely hits the FTUE hardest. DLS and Score! Hero both make the first experience forgiving: losing doesn't matter, the opponent is in the weakest tier, rewards come for taking part, and controls are one gesture.
- Recommendations for AFC:
  - Run an easy, guaranteed-winnable first match, or a scripted scenario: "score this one goal".
  - Default new players to an Easy AI difficulty. Ask for a difficulty choice only after the first match, or adapt it automatically after losses.
  - Teach skill moves later through Practice or skill games, not up front.
  - Make the tutorial replayable from a menu, as DLS does.
  - Log tutorial-step funnel events offline, if any analytics are possible.

### Gaps
- I found no first-party description of the current FC Mobile FTUE, such as starter pack choice or a tutorial match.
- I found no confirmed difficulty-selection screen in onboarding for the five target games.
- No Deconstructor of Fun or GDC FTUE talk specific to sports games was found in the searches.

## 3. Short-form, replayable modes around football gameplay

### Takeaway
Every major title adds "bite-size" modes on top of full matches:
- scenario and moment challenges (DLS daily scenarios, FL26 Moment Challenge, the whole of Score! Hero)
- chance-only PvP (FC VS Attack)
- set-piece and penalty modes (FL26)
- skill drills (eFootball Extra Training)
- single-player career (FL26 Player Mode, Score! Hero's player career)
- seasonal themed events (Halloween, Christmas, Derby; Score! Hero seasons)

### Cited Findings
- **DLS 2026:** "Daily scenarios with bonus objectives", plus events, Dream Draft, seasons and World Tournament events. — [App Store DLS 2026](https://apps.apple.com/app/1462911602)
- **Score! Hero structure:**
  - Hundreds of handcrafted scenarios, about 700 per some listings, with new levels each season.
  - Objectives include scoring, assists and pass counts.
  - Stars rate performance and gate progress. A reviewer lacked enough stars to start Season 33.
  - The career arc runs from a young player through clubs to country.
  - The latest version is 4.74 (5 Nov), "Season 63 released".
  - Sources: [App Store Score! Hero GB](https://apps.apple.com/gb/app/score-hero/id847492141); [App Store Score! Hero IN](https://apps.apple.com/in/app/score-hero/id847492141)
- **Score! Hero events and monetization:** past themed events include Holiday Hero, Valentines Hero, Easter Hero, World Hero and Frenzy Hero (a minigame), plus daily objectives and weekly leaderboards. Energy gates play, with a 24-hour unlimited energy purchase at GBP 2.99. — [App Store Score! Hero GB](https://apps.apple.com/gb/app/score-hero/id847492141)
- **Football League 2026:** Player Mode (single-player), Moment Challenge mode, and Derby, Christmas and Halloween challenge events. Users mention set-piece modes (free kicks, penalty shootouts), a World Cup mode and a kick-off mode. — [App Store FL26](https://apps.apple.com/us/app/-/id6447961802)
- **FC Mobile:** VS Attack is a 90-second chance-based PvP mode. Manager Mode lets players manage AI-played matches. Football Centre event matches count towards weekly tasks. — [EA Rivals update 2025-06-06](https://www.ea.com/games/ea-sports-fc/fc-mobile/news/rivals-update-gameplay); [EA Forums weekly task thread](https://forums.ea.com/discussions/fc-mobile-bug-reports-en/bug/12252643/replies/12253950)
- **eFootball:** Extra Training covers free kicks, skill moves and defending. There is also a "Daily Game" reward minigame. — [MuMu eFootball 2026 guide](https://www.mumuplayer.com/blog/efootball-2026-beginners-guide.html); [Sportskeeda eFootball Daily Game](https://www.sportskeeda.com/esports/daily-game-efootball-2024-mobile-how-play-rewards)
- **Score! Hero difficulty complaints (user reviews, 2018-2021):**
  - Levels that need 5-6 goals in specific ways.
  - Failing late resets to 0-0.
  - Rewinding a failed play costs paid tokens.
  - Overpowered keepers.
  - Star requirements for later seasons are too high.
  - Requests to show the 3-star requirements before the level starts.
  - Sources: [App Store Score! Hero GB](https://apps.apple.com/gb/app/score-hero/id847492141); search summary of Apple listings

### Inferences
- AFC already has most of these mode types: scenarios with stars, skill games, street, cups and career. The gap is more likely in packaging:
  - daily rotation of scenarios ("daily scenario" with a bonus objective, as DLS does)
  - weekly and seasonal themed events
  - an explicit single-player career arc (Score! Hero / Player Mode)
  - a penalty shootout or free-kick quick mode as a 1-minute session
- Score! Hero's reviews are a warning for AFC's "hard" perception. Show star requirements upfront, avoid "fail late, lose everything", and offer a free retry or checkpoint, since AFC is offline and has no paid rewind.

### Gaps
- No public retention data per mode type, such as scenario modes vs full matches, was found.
- I found no official description of "Road to Glory"-style single-player career modes beyond FL26's Player Mode note.

## 4. Rewards tied to gameplay performance

### Takeaway
The evidence shows stars per scenario (Score! Hero), objective-based bonuses (DLS daily scenarios), leaderboards (weekly in Score! Hero, global in DLS) and achievements. Shareable highlights or "goal of the week" features were not documented in the sources found.

### Cited Findings
- **Score! Hero:** stars per level gate progression into later seasons. It also has weekly leaderboards, Game Center leaderboards and achievements, and a Share button on the store page. — [App Store Score! Hero GB](https://apps.apple.com/gb/app/score-hero/id847492141)
- **DLS 2026:** "Daily scenarios with bonus objectives", Global Leaderboards and Events prizes, season rewards, Game Center achievements and friend leaderboards, and a Daily Bonus. — [App Store DLS 2026](https://apps.apple.com/app/1462911602)
- **DLS career economy:** stadium capacity affects home-match coin bonuses, and the Commercial Centre raises match coin income. — [GamingOnPhone DLS 2026 career guide](https://gamingonphone.com/guides/dream-league-soccer-2026-the-ultimate-career-mode-guide-and-tips/) (via search summary)
- **eFootball:** rewards for taking part in online matches regardless of result. — [MuMu eFootball 2026 guide](https://www.mumuplayer.com/blog/efootball-2026-beginners-guide.html) (via search summary)

### Inferences
- For an offline game, the practical levers are:
  - stars or a grade (S/A/B) per match based on a match rating
  - bonus objectives per fixture ("win by 2+", "score a header")
  - local personal bests and a "goal of the session" replay with save or share of a clip or screenshot
- Participation rewards on a loss soften the difficulty for players who find the game hard.

### Gaps
- I found no sourced evidence of in-game highlight or replay sharing, or "goal of the week", in DLS, FC Mobile, eFootball or FL26.
- I found no data quantifying the retention impact of performance-based rewards.

## 5. Benchmark retention and session figures (public sources)

### Takeaway
GameAnalytics' sports-genre medians for 2024 are:
- D1 about 19-20%
- D7 about 3.3-3.9%
- D28 about 0.7-0.9%
- sessions about 4.2-4.5 minutes
- daily playtime about 15-16 minutes

The 2025 cross-genre top-quartile figures are D1 just over 30% and D7 6-7%. Retention is declining industry-wide.

### Cited Findings
- **GameAnalytics Sports genre, median, Jan-Dec 2024 monthly cohorts:** D1 18.78-19.73%; D7 3.25-3.94%; D28 0.72-0.89%; session length 4.2-4.5 minutes; daily playtime 15.3-16.2 minutes. — [GameAnalytics 2025 Mobile Gaming Benchmarks](https://gameanalytics.com/reports/2025-mobile-gaming-benchmarks)
- **Sports compared with other genres (same report):** sports D1 is mid-to-high, above Racing and Action, while Arcade is strongest and Multiplayer lowest. D28 is above Action, Casual and Racing but well below Card, Board and Casino. Session length is mid-to-low. — [GameAnalytics 2025 report](https://gameanalytics.com/reports/2025-mobile-gaming-benchmarks)
- **Sports quartile spread:** GameAnalytics notes a large gap between average and top-quartile performers in Casino and Sports. — [GameDevReports summary of the GA 2025 report](https://gamedevreports.substack.com/p/gameanalytics-mobile-gaming-benchmarks)
- **GameAnalytics 2026 benchmarks (2025 data, 16,262 mobile games with 1k+ MAU, all genres):**

  | Metric | Median | Top 25% | Top 10% | Top 1% |
  |---|---|---|---|---|
  | D1 retention | not stated (about 22% per a second summary) | just over 30% | about 40% | 64-68% |
  | D7 retention | just under 4% | 6-7% | 11-12% | over 25% |
  | D30 retention | 0.69-0.79% | 1.6-1.8% | not stated | 13-15% |
  | Session length | not stated | about 5.2 min | about 8 min | about 22 min |
  | Daily playtime | not stated | 22-24 min | 40-42 min | over 94 min |
  | Sessions per day | not stated | 5.3-5.7 | about 9.6 | about 14 |

  Source: [GameDevReports, GameAnalytics Mobile and PC Benchmarks 2026, 2026-06-04](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)
- **D1 trend:** D1 kept declining in 2025 compared with 2024. — [same source](https://gamedevreports.substack.com/p/gameanalytics-mobile-and-pc-game)
- **Platform gap:** among the top 25% of games, iOS D1 is 31-33% and Android 25-27%. This matters because AFC is Android-only. — [GameAnalytics via search summary](https://gameanalytics.com/reports/2025-mobile-gaming-benchmarks)
- **Adjust:** D1 retention across all gaming apps was 27% in 2025. — [Adjust Gaming App Insights 2026](https://www.adjust.com/blog/gaming-app-insights-2026/) (via search summary; no sports split seen)
- **Liftoff and Singular 2025 Casual Gaming Apps Report** (data Feb 2024 - Feb 2025) is gated. No sports retention split was visible. — [Liftoff](https://info.liftoff.ai/2025-casual-gaming-apps-report)

### Inferences
- For an indie offline Android football game, realistic targets are D1 of 20% (sports median) to 30% (top quartile), and D7 of 4% to 7%.
- Sports sessions are short, a median of about 4-5 minutes. That length fits one scenario or skill game, or half of a DLS-style match. AFC should make sure a satisfying unit of play, with a reward, fits inside about 4 minutes.
- The Android D1 discount of about 5-6 points versus iOS should be considered when setting AFC's goals.

### Gaps
- No public D1, D7 or D30 figures for the specific titles (DLS, FC Mobile, eFootball, FL26, Score! Hero) were found. These are usually only in paid Sensor Tower or data.ai tools.
- No sports-specific AppsFlyer or Liftoff retention numbers were found. AppsFlyer's Q3 2026 gaming benchmark page was not fetched.
- The 2025 sports figures from the GameAnalytics 2026 report were not broken out in the summary I read. The sports-specific medians above are for 2024.
