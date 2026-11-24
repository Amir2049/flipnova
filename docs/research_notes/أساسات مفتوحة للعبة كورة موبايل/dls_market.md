# Dream League Soccer (DLS) and Rivals: Market Position, Design and Weaknesses (for positioning "AFC", an offline Godot football game for Android by a solo Egyptian developer)

Research date: 2026-11-21. Figures are dated where the source dates them. Gaps are listed where I could not find a reliable source. Note: Google Play, AppBrain, APKMirror and EGW pages returned 403 or empty content to the fetch tool, so Android-specific stats (install band, APK size, min Android version) come only from secondary snippets.

## 1. DLS core loop, meta and what changed in DLS 2024/2025/2026

### Takeaway
DLS is a "build a club from nothing" loop: sign players with coins and gems, climb 8 divisions plus 10+ cups, and upgrade the stadium and facilities, with kit and logo customization as a key part of its identity. Each yearly release (it is the same app, id1462911602, renamed each year) adds new data, licensed legends, social and online layers (Clans, Dream League Live, friends) and presentation upgrades rather than a new core loop.

### Cited Findings
- DLS 2026 (App Store listing, current Nov 2026) offers 4,000+ FIFPRO-licensed players including classic legends, **8 divisions** and **10+ cup competitions**, upgradeable Stadium, Medical, Commercial, Training and Fanzone facilities, a Clan system, Agents and Scouts for the transfer market, Coaches to develop players, Dream League Live (global online mode with leaderboards and events), daily scenarios, Dream Draft, kit, logo and manager customization (hair and outfits), 3D motion-captured animations and in-match commentary. — [App Store: DLS 2026](https://apps.apple.com/us/app/-/id1462911602)
- DLS 2026 launched in December 2025 on Google Play and the App Store, advertising new animations, improved AI, a "new and improved graphics engine", manager customization, Clans and Dream League Live. A pre-launch report mentioned a new volley skill move. — [GamingOnPhone](https://gamingonphone.com/news/dream-league-soccer-2026-arriving-this-december-drops-new-teaser-trailer) (via search summary); [EGW News](https://egw.news/fifa/news/30474/dream-league-soccer-2026-confirmed-for-december-20-W5O5N2-o3) (title only, page 403)
- 2026 live-ops cadence (App Store version history): Winter Reload (13.100–13.110, Feb–Mar 2026) brought updated team data, a news system, Clan improvements, UI and sound upgrades and Game Center support. 13.120–13.130 (Mar 2026) added "Dream Stars 2026" and a community-voted "12th Man" superstar. The Summer Spotlight (13.3xx, to Jul 14 2026) added Dynamic Stars, the Fanzone facility, a "World Tournament" event type, North-American-themed manager accessories and Clan improvements. 13.410–13.430 (Aug–Sep 2026) teased a "Cult Heroes" special player collection and fixed bugs. — [App Store: DLS 2026](https://apps.apple.com/us/app/-/id1462911602)
- DLS 2025 (released 5 Dec 2024): Classic Players starting with a World Cup '98 collection, Portuguese commentary (the third language after English and Spanish), squad size raised from 40 to 64, gamepad support, a friend system (friend codes, head-to-head, live leaderboards), 24/25 data, revised tackles, runs, marking and shooting, better lighting and models, plus new cutscenes, walkouts and stadium flyovers. Available in 15 languages. — [Gamespress press release, Dec 2024](https://gamespress.com/First-Touch-Games-unveils-Dream-League-Soccer-2025-Classic-Stars-Meet-)
- A complaint-site post titled "DLS 2026 Removed Bicycle Kicks and Skill Moves" suggests some players saw feature regression in DLS 26. — [Sikayetvar](https://www.sikayetvar.com/en/dream-league-soccer-us/dls-2026-removed-bicycle-kicks-and-skill-moves) (title only, single user)

### Inferences
- The loop that keeps players is a sense of ownership (my club, my kit, my logo, my stadium) plus a ladder (Division 8 up to the Elite Division). AFC can copy this structure cheaply. Divisions, kit and logo editors and a facility tree are mostly UI and data work, not high-end tech.
- DLS's annual "new" features have shifted toward online, social and collection systems (Clans, Live, special players). That leaves the pure offline-career player underserved.
- DLS covers only English, Spanish and Portuguese commentary (as of DLS25). No Arabic commentary was found.

### Gaps
- Whether DLS 2024 introduced specific changes; I found no dedicated DLS 2024 changelog.
- The exact number of DLS 2026 languages and whether Arabic UI exists (DLS25 said 15 languages without listing them).

## 2. Scale: downloads, ratings, revenue, team size, engine, APK size, minimum specs

### Takeaway
DLS is a mass-market hit: 20M+ monthly players (Dec 2024), a 4.6 rating on iOS from 741K ratings, and a reported 100M–1B install band on Android. It comes from a small, independent Oxford studio. Revenue, headcount and engine are not publicly confirmed in the sources I could reach.

### Cited Findings
- Over 20 million monthly players. First Touch Games' titles have over 1 billion total downloads (whole catalogue). The studio is UK-based, founded 2011, datelined Oxford. — [Gamespress, Dec 2024](https://gamespress.com/First-Touch-Games-unveils-Dream-League-Soccer-2025-Classic-Stars-Meet-)
- First Touch Games is independent, formerly a team within Exient, and localises in about a dozen languages. Key people are Charles Chapman (Director/Owner) and Andy Dunn (Production Manager). It was named in PocketGamer.biz's Top 50 UK Game Makers 2025 and 2026 (May 27 2026). Its core titles are DLS, Score! Hero, Ultimate Clash Soccer and Score! Match. — [PocketGamer.biz company page](https://www.pocketgamer.biz/industry/first-touch-games/)
- iOS (Nov 2026): rating 4.6/5 from 741K ratings, size 269.6 MB, requires iOS 15.0+, rated 13+ (frequent contests, loot boxes, advertising), #19 in Sports. — [App Store](https://apps.apple.com/us/app/-/id1462911602)
- AppBrain places DLS 2026 (com.firsttouchgames.dls7) in the 100M–1B Android install range. — [AppBrain developer page](https://www.appbrain.com/dev/First+Touch+Games+Ltd./) (via search summary; page not directly fetched)
- A historical data point (around 2013): DLS at about 6.5M downloads across three games. The studio said it was profitable but "our games don't make enough revenue per download to justify the high costs involved" (context: low ARPDAU). — [GamesBrief](https://gamesbrief.com/?p=9895) (via search summary)
- Score! Hero passed about 90M downloads (sister title, showing the studio's reach). — [PocketGamer.biz interview](https://www.pocketgamer.biz/interview/65769/first-touch-games-on-the-evolution-of-score-hero/) (via search summary)
- Egypt, Android, Q3 2025 (Sensor Tower): DLS 2025 weekly downloads peaked at about 54K in early September and fell to 34K. Weekly revenue was only about $273. Active users were about 1.4M at quarter end. Compare EA FC Mobile at about $4.7K/week and eFootball's peak of $10.4K/week. — [Sensor Tower Q3 2025 Egypt soccer](https://sensortower.com/blog/2025-q3-android-top-5-soccer%20games-units-eg-60129cb7241bc16eb8b7b23c)
- Game Brain aggregates about 10,000 reviews for DLS 2025 with a 62% user score and a median play time of 200 hours. — [Game Brain](https://gamebrain.co/game/dream-league-soccer-2025)

### Inferences
- In Egypt, DLS monetizes very weakly per user ($273/week against about 1.4M weekly actives), so it likely relies on ads there. This shows Egyptian players will play heavily but pay little. AFC should plan around ad revenue and very cheap IAP, not whales.
- At a 270 MB iOS size, DLS is mid-weight. Football League 2026 is about 579 MB. A Godot game in the 100–150 MB range would be a real advantage on low-storage Android phones (an inference, not measured).

### Gaps
- **Engine:** I found no primary source confirming that DLS uses Unity. The listing only says "new and improved graphics engine". It is widely assumed to be Unity, but this is not verified here. Check job postings or decompiled APK libraries (libunity.so) to confirm.
- Global DLS revenue estimates (Sensor Tower, AppMagic): the Appfigures and Apptopia pages gave no figures.
- Studio headcount: not stated in any source reached.
- Android APK size and minimum Android version: Google Play and APKMirror blocked fetching.

## 3. Monetization and player sentiment

### Takeaway
DLS uses a dual-currency economy (coins as soft currency, gems as hard currency), rewarded and interstitial video ads, a $3.99 Season Pass and $0.49–$19.99 bundles. Monetization is the single most criticized aspect of the game. Ads, especially at halftime and unskippable ones, dominate negative reviews.

### Cited Findings
- iOS top IAPs: Season Pass $3.99, Bundle of Coins $0.99, Stack of Coins $1.99, Bundle of Gems $1.99, Stack of Gems $9.99, Cup of Coins $4.99, Promo Pack $0.49, Locker of Gems $19.99, Special Offers $3.99/$4.99. The age rating flags loot boxes and advertising. — [App Store](https://apps.apple.com/us/app/-/id1462911602)
- Game Brain review analysis (DLS 2025): monetization had 608 negative mentions (98% of 618). Players object to "intrusive, non-skippable ads, especially at halftime" and to the IAP model. Grinding had 5 mentions, all negative, about the time needed to build a strong team. — [Game Brain](https://gamebrain.co/game/dream-league-soccer-2025)
- An App Store review (Aug 2026) praises the customization but says rewards are small and progression feels pay-to-win. An older review says higher divisions feel unfair and calls the game "Buyer beware!" after spending $27. — [App Store](https://apps.apple.com/us/app/-/id1462911602)
- Players complain when rewarded ads fail to load, because they depend on ads for rewards. The developer responded that the videos may be unavailable from ad networks. — [Sikayetvar](https://www.sikayetvar.com/en/dream-league-soccer-us/dream-league-soccer-stopped-showing-adshow-can-i-fix-rewards-q-45699)
- One user alleges that paying players get no lag while free players suffer lag (an unverified claim). — [Sikayetvar](https://www.sikayetvar.com/en/dream-league-soccer-us/dls-2025-lag-pay-to-play-or-deal-with-freezes)

### Inferences
- Players accept and even seek out rewarded ads, because they want the coins. What they hate are forced interstitials at halftime and unskippable 30-second ads. A clear positioning line for AFC: "no forced ads in matches, rewarded only, plus a one-time 'remove ads' purchase", which mirrors Football League's $3.99 No Ads IAP.

### Gaps
- Exact ad frequency and ad networks used by DLS (SDK listing pages were blocked).

## 4. Top complaints and most-loved features

### Takeaway
DLS is loved for its graphics, customization (kits and logos), club-building depth, player pool and progression through cups and divisions. It is hated for ads, crashes and freezes, AI behaviour (excessive slide tackles, unresponsive player switching), repetitive or "scripted-feeling" difficulty in high divisions, online matchmaking and lag, and the lack of a deeper career or story mode.

### Cited Findings
- Loved: graphics (922 positive of 1,581 mentions, 58%), smooth gameplay for some players, music, and funny AI moments. — [Game Brain](https://gamebrain.co/game/dream-league-soccer-2025)
- Loved: depth of teams, graphics, player pool, cup progression and live 1v1 events (Jul 2025 review). Customization is praised (Aug 2026). Users ask for more leagues and better logo customization. — [App Store](https://apps.apple.com/us/app/-/id1462911602)
- Complaints: stability (99% negative of 258 mentions: crashes, freezes, unresponsive controls), AI slide tackles that injure players, sluggish movement after updates, lag even on high-end devices, grinding, and players wanting a dedicated career or story mode. — [Game Brain](https://gamebrain.co/game/dream-league-soccer-2025)
- Complaints: inconsistent shooting and penalty mechanics (Aug 2026). High divisions feel unfair, with high-rated players underperforming. — [App Store](https://apps.apple.com/us/app/-/id1462911602)
- Complaints (2025–2026 posts): freezing on the stadium loading screen, stutters after an Android update, a post-update bug where players move randomly and ignore positioning, unfair Live matchmaking, tournament wins recorded as losses, and the view that DLS 2019 had better gameplay than newer versions. — [Sikayetvar: Android stutter](https://www.sikayetvar.com/en/dream-league-soccer-us/dream-league-soccer-2026-stutters-and-freezes-after-latest-android-update); [positioning bug](https://www.sikayetvar.com/en/dream-league-soccer-us/dream-league-26-post-update-bug-makes-players-move-randomly-and-ignore-positioning); [matchmaking](https://www.sikayetvar.com/en/dream-league-soccer-us/unfair-matchmaking-in-dream-league-soccer-live-mode); [DLS 2019 better](https://www.sikayetvar.com/en/dream-league-soccer-us/dream-league-soccer-2019-had-better-gameplay-than-new-dls-versions)
- A review page also reports unresponsive player switching in defence and fast attackers who are too hard to catch. — [appireview (aggregator)](https://appireview.pages.dev/com.firsttouchgames.dls7) (via search summary; low-quality source)

### Inferences
- The nostalgia for DLS 2019 and complaints like "removed bicycle kicks" suggest that core gameplay feel has stagnated or regressed for a vocal segment. A solo developer cannot beat DLS on graphics, but can compete on stability, fair difficulty (no rubber-banding feel), and the offline career depth that players explicitly ask for.

### Gaps
- Reddit r/DreamLeagueSoccer threads did not surface in searches. Most complaint evidence comes from Sikayetvar (single-user posts) and Game Brain aggregation, so treat individual posts as anecdotal.

## 5. Offline play quality and low-end Android performance

### Takeaway
DLS's career (division and cup) mode is playable offline. Online features (Live, Clans, events) need a connection, and some users miss a fully offline experience. Low-end performance is mixed: it is reported as running on modest hardware, but freeze and lag complaints are common.

### Cited Findings
- The career mode offers offline play with local saves and optional cloud sync (promotional-style guide). A Persian review says the career mode stays enjoyable without fast internet. An older user review wishes the game could be "offline as it was before". — [Search summary of appireview](https://appireview.pages.dev/com.firsttouchgames.dls7); [Zoomg (Persian)](https://www.zoomg.ir/game-articles/417716-dls-2026-mobile-game/)
- DLS25 "runs on a wide range of devices and operating systems". — [Gamespress](https://gamespress.com/First-Touch-Games-unveils-Dream-League-Soccer-2025-Classic-Stars-Meet-)
- Optimization complaints include lag and poor performance even on higher-end devices (10% negative of 68 mentions). Freezes happen offline as well as online. — [Game Brain](https://gamebrain.co/game/dream-league-soccer-2025)
- The January 2026 update brought crash fixes and performance tweaks. — via search summary (source page unclear; low confidence)

### Inferences
- "Truly offline, no ads interrupting matches, runs at a stable frame rate on 2–3 GB RAM phones, small download" is a defensible niche against DLS, eFootball and FC Mobile. FC Mobile and eFootball are online-first.

### Gaps
- No benchmark data (FPS on specific budget phones) for DLS 26.
- DLS minimum Android version and RAM: not confirmed.

## 6. Middle East / Arab market (Egypt focus)

### Takeaway
In Egypt, the five most important football games on Android are EA FC Mobile, eFootball, Football League (Mobile Soccer), DLS and Soccer Superstar. Football League, an offline-capable game with Arabic support, leads or matches on downloads. Revenue per user is tiny, and no top-grossing game in Egypt is made by an Egyptian developer. No source showed Arabic commentary in DLS.

### Cited Findings
- Egypt, Android, Q3 2025 (weekly figures): Football League 2025 downloads went from 121K+ to about 60K, with weekly actives from about 1.9M to about 1.2M. EA FC Mobile downloads reached up to 112K, revenue about $4.7K/week and actives about 1.8–2.5M. DLS 2025 downloads were 54K at peak, revenue about $273 and actives about 1.4M. eFootball downloads were about 25K, revenue peaked at $10.4K and actives were about 1.9–2.1M. Soccer Superstar downloads peaked at 56K with actives about 1.1–1.4M. — [Sensor Tower Q3 2025](https://sensortower.com/blog/2025-q3-android-top-5-soccer%20games-units-eg-60129cb7241bc16eb8b7b23c)
- Football League 2025 weekly downloads in Egypt peaked at about 154K in late Dec 2024, with actives above 1.5M. eFootball's Egypt weekly revenue reached $11.3K in mid-Sep 2024. — [Sensor Tower Egypt blogs (search summary)](https://sensortower.com/blog/2025-q4-android-top-5-soccer-games-revenue-eg-60129cb7241bc16eb8b7b23c)
- "0% of the top grossing Games in Egypt were built by Egyptian mobile Game developers." — [42matters Egypt top grossing](https://42matters.com/top-grossing-mobile-games-egypt) (via search summary)
- Football League 2026 lists Arabic among 18 languages and has multi-language commentary. — [App Store: Football League 2026](https://apps.apple.com/us/app/-/id6447961802)

### Inferences
- Football League's strong download share in Egypt (often above DLS) shows that offline, lightweight, broad-content games win there. Its Arabic support is likely part of that.
- Gap AFC could fill: Arabic UI plus Egyptian or Arabic-dialect commentary, and fictional or editable Egyptian and Arab league structures (an Egyptian Premier League-style ladder, Arab and African club cups). None of the major titles offers Egyptian-dialect commentary (inference from absence of evidence). Licensing real clubs is risky. Use editable names and kits (DLS-style kit and logo editors) instead.

### Gaps
- Saudi Arabia, UAE and Morocco rankings: not found.
- Any DLS Arabic commentary or UI: no source found (Arabic-language search returned unrelated DAZN pages).
- Survey data on demand for Arabic commentary: none found.

## 7. Competitor comparison (EA SPORTS FC Mobile, eFootball, Football League 2026, others)

### Takeaway
FC Mobile and eFootball are licensed, online-first, heavier games that monetize best. DLS is the club-builder with custom kits, 8 divisions and decent offline play. Football League 2026 is the light, offline, "huge content" game with Arabic. All of them draw complaints about ads, pay-to-win and AI.

### Cited Findings
- **Football League 2026 (Mobile Soccer Pte. Ltd.):** 40,000+ players, 1,500 clubs, 150 national teams, Man City (and Monaco) licensed, "play online or offline", many cups and leagues (including Asian and African), custom leagues, gamepad support, Arabic among 18 languages, iOS 4.6 from 49K ratings, 578.6 MB, iOS 15+, IAP coins $0.99–$9.99 and No Ads $3.99. Complaints: "3 minute+ long ads to play 1 match", stats not mattering, repetitive commentary, weak AI and 10+ goal matches. — [App Store: Football League 2026](https://apps.apple.com/us/app/-/id6447961802). Google Play reportedly shows 100M+ downloads and 2.11M reviews (via search summary; not verified).
- **EA SPORTS FC Mobile:** reported minimum (FC Mobile 27, checked Oct 2026) of Android 7.0+, 1.7 GB RAM and 4 cores at 1.5 GHz+. EA says the app may be removed for unsupported devices from August 2026. Pay-to-win complaints appear on EA's own forums. — [GameOverdrive (search summary)](https://gameoverdrive.com.br/fc-mobile-requisitos/); [EA Help](https://help.ea.com/en/articles/ea-sports-fc/fc-mobile/system-requirements/) (page 503 at fetch); [EA Forums pay-to-win thread](https://forums.ea.com/discussions/fc-mobile-technical-issues-ru/serious-complaint-about-unfair-pay-to-win-system-and-broken-gameplay/13516493)
- **eFootball (Konami):** about 2 GB RAM, quad-core and Android 7.0+ per a third-party listing (possibly outdated). It has a large install size plus additional downloads. It is the highest earner per week in Egypt among football games ($10.4–11.3K/week peaks). — [SourceForge listing (aggregator)](https://sourceforge.net/app/efootball/android/); [Sensor Tower](https://sensortower.com/blog/2025-q3-android-top-5-soccer%20games-units-eg-60129cb7241bc16eb8b7b23c)
- **Soccer Superstar:** a top-5 football game in Egypt by activity (1.1–1.4M weekly actives, Q3 2025). — [Sensor Tower](https://sensortower.com/blog/2025-q3-android-top-5-soccer%20games-units-eg-60129cb7241bc16eb8b7b23c)

### Inferences
Positioning matrix for AFC (solo, Godot, offline, Android):

| Axis | FC Mobile / eFootball | DLS | Football League | AFC opportunity |
|---|---|---|---|---|
| Online need | Online-first | Career offline, rest online | Online or offline | 100% offline |
| Size | Large | about 270 MB (iOS) | about 580 MB (iOS) | Aim under 150 MB |
| Ads | IAP-led | Halftime and unskippable ads are hated | Long ads are hated | Rewarded only, never mid-match |
| Arabic | Unknown | None found | Arabic UI | Arabic UI plus Egyptian commentary |
| Club ownership | Ultimate Team cards | Kits, logos, stadium, 8 divisions | Licensed or large database | DLS-style ownership plus local leagues |
| Fairness | Pay-to-win complaints | Pay-to-win and "unfair high divisions" | Stats don't matter | Transparent stats, no rubber-banding |

### Gaps
- Exact current minimum specs and install sizes for eFootball and FC Mobile on Android (official pages unavailable).
- Global revenue rankings for these titles (paid tools).
