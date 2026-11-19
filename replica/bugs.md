# QA report: Flippo build 65 (14.0)

Date: 2026-11-19. Code: branch `ccr-b8cf5a95-rf6p9a`.

## What was run

1. **The game's own suite: all 23 `tools/*test*.js`.** 12 pass, 11 fail. **The same 11 fail on the untouched
   build 65 import (commit 9533dad)**, so none of them come from this session's changes.
   - Pass: test, campaign-test (50 levels cleared), human-test ("ALL HUMANLY FAIR"), crowd-test,
     endless-start-test, first-minute-test, legend-test, maker-app-test, online-test, run-proof-test,
     save-compat-test (3 build-21 saves), share-card-test (template-test has no pass line, exit 0).
   - Fail, already failing in b65: see "To check" below.
2. **Click-through on 5 screen sizes × 2 languages** (`tools/qa-click-through.js`): 640×360, 844×390,
   932×430, 1024×768 and 390×844 portrait, in Arabic and English. It opens every menu (home, settings,
   characters, adventure, leaderboard, levels, missions, how-to), plays 6 s of Endless, and lists
   off-screen or tiny buttons. **No JavaScript errors on any of them** (the only console errors are the
   leaderboard server, blocked on purpose in tests). Portrait shows the "turn your phone" screen.

## Bugs (reproduced)

| ID | Sev | What | Status |
|---|---|---|---|
| B1 | S3 | **Home, Weekly Boss card: the tag ran past the card.** Arabic "زعيم الأسبوع · الأسبوع 47" overflowed by 18-28 px and **hid the week number** (it read "الأسبوع 4" on week 47). English overflowed by 7-11 px. | **Fixed**: label shortened to "BOSS · WEEK 47" / "الزعيم · الأسبوع 47", tighter tag, no letter-spacing in Arabic. Now 23-45 px of spare room at every size. |
| B2 | S4 | **Home, Weekly Boss card (English only): the boss sprite covered the countdown** by 24-38 px. Cause: the later `.doors .evCard.weekBoss` rule reset the card's padding in LTR; the Arabic rule was more specific so Arabic was fine. | **Fixed**: one logical-padding rule for both directions. Overlap now 2-3 px (the sprite's transparent edge). |
| B3 | S4 | Home: "Level Maker" and "Zen Practice" buttons are 20-22 px tall on phones (under the 44 px touch-target guideline). They still work with a finger. | Open (design call). |

Evidence: `replica/qa/before-*.png` and `after-*.png` (844×390). Fix in `css/style.css` (after `.evCard.weekBoss.mini2 .evTag`) and the
`bossCard` string in `js/ui.js`; `tools/boss-test.js` updated to the new label.

## To check (failing tests that look outdated, not confirmed as game bugs)

All of these fail identically on the untouched build 65. Most check things that b65 removed on purpose:

| test | why it fails | likely cause |
|---|---|---|
| redesign-test, niro-test | expects the **STORY** door on the home | Story has no screen in b65 (no `storyBox`, no story/bosslevel/tyrantlevel scripts). If Story is gone for good, its code in `js/ui.js` is more dead code like the Legend was. |
| editor-test, review-test | wait for the Level Maker button, which is hidden | "Maker hidden for new players" (2026-11-03 decision); the tests use a fresh save |
| weekly-test, weekly2-test | look for the old weekly-run card on the home | build 37: the boss duel became the only weekly card |
| boss-test | only `fx` is undefined (the rest pass) | the test reads an effects counter the game no longer exposes |
| gift-test, book-publish-test, cleanup35-test | one check each (trails tab count, published book name, toast hand-over timing) | need a closer look |
| skins39-test | needs 4 old + 4 new gift codes passed in by hand | not runnable without the codes |

No S1 or S2 bug found.
