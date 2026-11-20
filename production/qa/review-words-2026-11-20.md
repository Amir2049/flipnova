# FLIPPO build 66 — Review: words, sharing, leaderboard, packaging
Date: 2026-11-20 · Reviewer: qa-tester (subagent) · Story type: UI + Config/Data review · Output: production/qa/ · Gate: ADVISORY (findings report, no tests written)
Status: IN PROGRESS — static checks done; in-browser checks (640x360 screens, share, ?vs link, offline board) being added below.

Method so far: read every string table in js/ui.js (T.ar/T.en lines 7-126, HINTS 129-208, WHY 210-255, ACH 257-282); a script compared keys used (`t('…')`, `data-t` in index.html) against both tables — **no missing keys, ar/en key sets identical**, so no raw key name can appear from a static call (dynamic `tw_`/`dm_`/`rar_` keys not yet checked in the browser). Read manifest.webmanifest, AndroidManifest.xml, desktop/*, privacy.html, index.html head.

## Confirmed problems

| # | Sev | Where | Problem |
|---|-----|-------|---------|
| W1 | S3 | index.html:1-17 | **No Open Graph / Twitter tags** (`og:title`, `og:description`, `og:image`, `twitter:card` absent — grep finds none). Every challenge link (`?vs=…`) and share text points to this page, so in WhatsApp/Telegram/Discord the link shows as a bare URL with no picture or title. Directly weakens the challenge-link feature. |
| W2 | S4 | js/ui.js:1294 (`SITE = 'https://amir2049.github.io/flipnova/'`) | The old name **flipnova** is visible to players in every challenge link shared from the APK, the desktop build, file:// and itch (all fall back to SITE). The link text is pasted into chats under the share message. |
| W3 | S4 | privacy.html:9 | "Flippo (formerly FLIPNOVA) …" — old name shown to players on the privacy page. Probably intentional for continuity; flag for a decision. |
| W4 | S4 | js/ui.js:37 `tutSkip` vs js/ui.js:11 `howto` | Arabic toast says the tutorial is in «طريقة اللعب», but the button it points to is labelled «كيف ألعب». Player cannot find a button with that name. (English matches: "How to play".) |
| W5 | S4 | js/ui.js:37 `vsHello` (ar+en) | Challenge toast says "دوس Endless" / "tap Endless", but the home button is labelled «العب» / "PLAY" (Endless is only the small subtitle; in Arabic the subtitle is «جري لانهائي», so the word "Endless" is nowhere on the Arabic home). |
| W6 | S4 | js/ui.js:14 `needSoon`, 37 `tutDone`/`tutGo`/`friendMissing`, 124 `needSecs`, 21 `star3`, 15 `perfect`/`near` | English words left in the Arabic UI: "Endless" (5 strings, while the Arabic name «جري لانهائي» exists in `endless`), "Perfect ×", "Near Miss", "COMING SOON". Some are game-mechanic brand words (PERFECT/NEAR MISS also appear as in-game pixel text), but "Endless" is inconsistent with the Arabic label used on the home screen. |
| W7 | S4 | js/ui.js:11,12,22; HINTS ar 131-144; WHY ar 217-221; ACH ar 258-267, 280 | Arabic is meant to be Egyptian colloquial, but many older strings are Modern Standard Arabic and read stiff next to the colloquial ones: `howto` «كيف ألعب», `again` «العب مجددًا», `shareText` «هل تقدر تتفوق عليّ؟», `restart` «ابدأ من جديد», WHY `slab/catch/block` «اصطدمت بحافة…» (while `lift/crumble/blink` say «خبطت في…»), HINTS spike/gate/lock/pad/laser («اقلب قبلها بلحظة لتحصل على»، «لا تقلب»، «اقرأ ما ينتظرك»), ACH «أتمم ممر المخاطرة دون اصطدام», «أنهِ مهام اليوم الثلاث», «اعثر على البوابة السرية». Mixed register on the same screen (e.g. the WHY line after a crash). |
| W8 | S4 | js/ui.js:121-123 | Boss strings mix Eastern-Arabic digits and Western digits in the same feature: `bossNone` «٣ قلوب», `bossRwP2/P3` «المرحلة ٢/٣» vs `bossResLose` «المرحلة {ph}/3» and the rest of the game (Western digits everywhere). Also «المرحلة» is used for a boss *phase* and for an Endless *stage* — ambiguous. |
| W9 | S4 | js/ui.js:66 `onFake`, 73 `streakNext` (en) | Plural hacks/errors: "{n} fake score(s) removed"; `streakNext` "💎 {n} more days for the AURORA skin" reads "1 more days" on day 6 (need to confirm n=1 reachable — see To check). |
| W10 | S4 | desktop/main.js:1, desktop/package.json | Outdated packaging metadata: comment says "the same game (build 21)"; package `name: "flipnova"` (old name) and `version: "8.5.0"` unrelated to build 66. `name` becomes the userData folder (%APPDATA%/flipnova) — do NOT change it without migrating saves (localStorage lives there). |
| W11 | S4 | js/ui.js:30/66 `onOff`; js/ui.js:914, 1001 | Developer text reachable by players: "World board is not connected to a server yet — one step in the README." Shown whenever `FF.Online.enabled()` is false (config is filled in online-config.js today, so only if config is cleared/forked). |

## To check (not confirmed)
- **Weekly run leftovers**: weekly strings are still wired — `weekShare` replaces the share text when `isWeekRun(res)` (js/ui.js:1663, 658), `tmrw` promises «تحدي الأسبوع لحد الجمعة», index.html:28 `#weekLast` card, index.html:39 hidden `legendChip` (Legend removed in build 36). Need in-browser confirmation whether a normal Endless run is a "week run" (then every share says "weekly challenge … until Friday").
- Share card (js/ui.js:1654) prints `res.mode.toUpperCase()` — if `share` is reachable after campaign/boss/zen runs, the internal mode name (e.g. CAMPAIGN) is printed on the image. Card text is English-only pixel font in both languages (by design?).
- manifest.webmanifest icons use `"purpose": "any maskable"` on one image — Android may crop the logo in the adaptive mask; also as "any" the padded icon looks small. Needs a look at icons/icon-192.png safe zone.
- index.html:2 ships `lang="en" dir="ltr"` while manifest is `lang: ar, dir: rtl`; JS fixes it at runtime (ui.js:426-427) — a flash of LTR before JS runs? not checked.
- Android back button: not in the manifest (handled in MainActivity) — not checked yet.
- 640x360 overflow / cut-off text on each screen — not checked yet.
- Challenge link end-to-end (?vs= open → same road → vsWin/vsLose) — not checked yet.
- Offline leaderboard tabs, name row, empty states — not checked yet.
- Death clip (shareClip) — not checked yet.

## Ideas
1. Add `og:title/og:description/og:image` (a 1200x630 card from store-assets) so challenge links unfurl with a picture.
2. One Arabic register pass: rewrite the MSA strings listed in W7 to the colloquial voice used elsewhere.
3. Use `t('endless')` inside strings instead of the literal "Endless" so the Arabic label stays one word.
