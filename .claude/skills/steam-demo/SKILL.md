---
name: steam-demo
description: Plan or audit a Steam demo before you ship it. Use when a developer is preparing a demo build for Steam (Next Fest or standalone) and wants to grade it — or spec it from scratch — against a proven checklist covering the game itself, onboarding, game feel, audio, settings, and demo marketing. Two modes — AUDIT an existing/described demo build, or PLAN the demo spec + task list from the game's details. Steam-first (Shift+Tab overlay, Wishlist CTA, demo depot rules), with itch.io as a secondary distribution target. Sibling to game-store-page — the store page drives wishlists; the demo converts them.
disable-model-invocation: true
---

# Steam Demo

Helps ship a demo that converts browsers into wishlists and wishlists into buyers. Based
on Marnix Wyns' Steam Demo Checklist (BiteMe Games) — https://youtu.be/k9IixsdNP_g and
the companion Notion checklist. A demo is the highest-intent marketing asset you have:
players who finish it and hit "Wishlist" are your buyers. It is also easy to ship one
that quietly loses people (no pause menu, a five-minute walk before any gameplay, no
wishlist button at the end). Treat this as infrastructure — run it on every demo build.

## The one rule that frames everything

**A demo is not a playtest.** It is a marketing build. Its job is to show the core loop
fast, feel polished, and end with a wishlist prompt — not to gather bug reports or expose
the whole game. Every item below serves that job. If you catch yourself defending a rough
edge with "it's just a demo," that's the exact instinct this skill exists to correct.

## Two modes

Ask (or infer) which the user wants:

- **AUDIT** — the user has a demo build (playable, or described to you). Grade it
  item-by-item against the checklist, mark each ✅ / ⚠️ / ❌, and give a *concrete* fix for
  every miss (not "improve onboarding" — say "cut the opening cutscene, drop the player
  straight into the tutorial fight"). Lead with the misses that cost the most conversion.
- **PLAN** — the user has a game but hasn't built the demo scope yet. Produce a demo spec:
  what slice of the game to include, where the core loop lands in the first 3 minutes,
  the ending + CTA moment, and a categorized task list (game feel, audio, settings,
  marketing) they can hand to the team. Ask for genre + core loop if missing.

Both modes need the **genre** and the **core gameplay loop**. Genre matters because some
requirements bend by genre (see the note at the end of the checklist) — a narrative game's
"no lore dump" and a roguelite's "core loop in 3 minutes" land differently. If you don't
know the genre and loop, ask before grading or planning.

## The checklist

Read `references/checklist.md` for the full, paste-ready list. It is grouped into six
categories — work them in this order, because that's roughly the order of impact:

1. **Game** — no breaking bugs, pause menu, Shift+Tab pauses, core loop in the first
   3 minutes, clear ending + CTA, don't hijack Quit.
2. **Onboarding** — main menu (animated), social/support links, no opening cutscene, a
   real tutorial, controls shown explicitly, don't soft-lock AZERTY/QWERTZ players.
3. **Game Feel** — button hover/click SFX, scale-on-hover + squish-on-click, tweened
   windows (never instant).
4. **Audio** — music, an ambient layer, SFX on every major interaction, random-pitched
   SFX, all volumes default to 50%.
5. **Settings** — display mode, vsync, framerate limiter, resolution, four sound sliders,
   localization.
6. **Marketing** — demo trailer, itch.io upload, wishlist buttons on menu + ending CTA,
   content-creator outreach 1-2 weeks early.

Do not treat these as equal. The **conversion-critical** ones are: core loop in the first
3 minutes, a clear ending with a wishlist CTA, no opening cutscene/lore dump, and a pause
menu that actually pauses (including on Shift+Tab). A demo can miss random-pitched SFX and
still convert; it cannot survive a five-minute intro with no wishlist prompt at the end.

## Why the non-obvious items matter (use these when the user pushes back)

- **Core loop in the first 3 minutes** — demo players are sampling, not committed. Making
  them walk/talk/watch before they *play* the thing burns the window where you win them.
- **Shift+Tab pauses** — players open the Steam overlay to wishlist mid-session. If the
  game keeps running, they die or miss something and blame the demo.
- **Clear ending + CTA** — the wishlist moment is at the *end*, at peak enthusiasm. No
  ending = the player alt-F4s at a random low and never wishlists. This is the #1 miss.
- **Don't hijack Quit** — opening a browser or Steam page when the player quits reads as
  spammy and burns goodwill at the exact worst moment. Put the wishlist CTA *in* the game.
- **Volumes default to 50%** — 100% default blasts people on first launch; they quit
  before they hear anything. 50% leaves headroom and signals audio polish.
- **Don't soft-lock AZERTY/QWERTZ** — hardcoded WASD locks out a chunk of EU players who
  can't even move. Read scancodes / offer rebinding.
- **itch.io upload (<2GB)** — a mirror for creators and players who can't/won't use Steam,
  and a hedge; only if the build fits itch's size limit.
- **Creator outreach 1-2 weeks early** — use Steam's demo release-state override key to
  give creators early access so their videos land *when the demo goes public*, not after.

## Deliver

- **AUDIT:** a table — category · item · verdict (✅/⚠️/❌) · specific fix. Sort so the
  conversion-critical ❌/⚠️ are at the top; don't bury "no wishlist CTA at the end" under
  "SFX aren't random-pitched." Close with the 3 fixes that matter most.
- **PLAN:** the demo scope (what's in / what's cut and why), the first-3-minutes beat
  sheet, the ending/CTA moment, and the categorized task list ready for the team. Flag
  every assumption you made about the game so they can correct it.

This skill is the demo counterpart to **game-store-page** — if the user also needs the
store page, trailer, or capsule graded, point them there. Never invent facts about the
game (genre, controls, content length, platforms). If you don't know, ask or leave a
clearly-marked `[TODO: …]` placeholder.
