---
name: game-store-page
description: Draft and audit a game's store / storefront page (Steam, itch.io, App Store, Google Play, or a web landing page). Use when preparing a game to publish or wishlist — writing the short/long description, planning the trailer and screenshots, choosing tags, or grading an existing/draft store page against a proven indie-marketing checklist. Two modes — AUDIT an existing page, or DRAFT copy + an asset plan from a game pitch. Platform-aware — universal principles are shared, concrete specs (capsule sizes, char limits, CTA wording) swap per platform.
disable-model-invocation: true
---

# Game Store Page

Helps ship a high-converting storefront page for a game. Based on Marnix Wyns' Steam
Store Page Checklist (BiteMe Games) — https://youtu.be/cYvV_RLwKJ8 — generalized to
other platforms. The store page is one of the biggest predictors of wishlists and
conversion, and it is easy to forget items, so treat this as infrastructure: run it
every time.

## Two modes

Ask (or infer) which the user wants:

- **AUDIT** — the user has a draft or live page (or is describing one). Grade it
  item-by-item against the checklist for their platform, mark each ✅ / ⚠️ / ❌, and
  give a *concrete* fix for every miss (not "improve the description" — rewrite it).
- **DRAFT** — the user has a game but not the page. From a short pitch, produce the
  copy and an asset plan: short description, long description skeleton, trailer shot
  list, screenshot plan, tag list, localization target. Ask for the pitch if missing.

Both modes need the **platform** and enough about the game (genre, core loop, end
goal, hook, target audience). If the pitch is thin, ask 2-3 sharp questions before
generating — a vague pitch produces vague copy.

## Step 1 — Pick the platform profile

Read the matching reference file for the concrete specs, then apply it:

- **Steam** → `references/steam.md` (the fullest profile; the canonical checklist)
- **itch.io** → `references/itch.md`
- **App Store / Google Play / web landing** → `references/mobile-web.md`

Only the platform profile has correct numbers (asset dimensions, character caps) and
correct CTA wording. Do **not** carry Steam-only concepts (capsule templates, Wishlist
CTA, Steam tags, Community hub) onto a non-Steam page — that is the #1 mistake this
skill exists to prevent.

## Step 2 — Apply the universal principles

These hold on every platform. The platform profile only changes the *specs*, not these:

### First impression (the capsule/icon/hero + short description)
- **Genre first.** The short description must name the genre in the first clause:
  "{NAME} is a roguelike deckbuilder where…". A player who can't classify it bounces.
- **State the end goal.** What is the player trying to achieve? ("Escape the dungeon",
  "Save the princess.") Fantasy, not mechanics-only.
- **Describe actions with verbs** the player performs: trade, fight, dodge, build,
  manipulate, sneak. Verbs sell interactivity.
- **No lore-dumping.** Cut proper nouns and setup. "The Prime Cyrule has taken over the
  Cyrellian Reaches" → "Fight back against an alien invasion." Lore is a wall.
- **Logo/art:** readable at thumbnail size, high contrast between text and background
  (no beige-on-brown), no AI-generated key art, name-only (no taglines baked into the
  image). Custom or stylized logo, not a default system font.

### Trailer
- Have one. It is the single highest-impact asset.
- **30-50 seconds.** Longer loses people; shorter can't show the loop.
- **Cold open** — gameplay in the first frame, no logo intro. Show **4-5 distinct
  highlights within the first 15 seconds.**
- **No single shot longer than ~6 seconds** — keep cuts moving.
- **End on a 5-8s call-to-action card** (platform-specific wording — see profile).
- Also host it on **YouTube** (embeds, SEO, shareability) regardless of platform.

### Screenshots
- **At least 7.**
- **First screenshot = the core mechanic**, instantly legible.
- Show **actual gameplay including the UI** — not cinematics, not concept art.
- **No menu / title-screen screenshots.**
- **Vary color and scene** — not five shots of the same green field. Variety signals
  content depth.

### Long description
- **First 1-2 sentences carry the whole pitch** — they get pulled into embeds/social
  cards. Front-load, don't warm up.
- **Keep it tight.** Walls of text don't get read. (Steam: ~1,000 char cap incl.
  headers — see profile; other platforms vary but the discipline is the same.)
- **Embed 2-4 short gameplay clips/GIFs** showing highlights (see profile for format).
- End with a **Features** section: controller support, level/content count, co-op,
  languages, accessibility — scannable bullets.

### Discoverability & trust
- **Tags/categories:** fill them out fully and accurately (count and system are
  platform-specific — see profile). Wrong tags kill the algorithm's targeting.
- **Localization:** at minimum EN, DE, PT-BR, ES-419, RU, ZH, JA, KO for the store
  text. Mark the *game's* supported languages separately and truthfully.
- **Socials & links:** Discord, YouTube, and a website or press kit. Links build trust
  and give the algorithm engagement signals.
- **Release date:** set it (year → month → exact date as it firms up; exact once <2
  months out). An empty date reads as vaporware.

## Step 3 — Deliver

- **AUDIT:** a checklist table — item · verdict (✅/⚠️/❌) · specific fix. Lead with the
  ❌/⚠️ that cost the most conversion (short description, capsule/icon, first screenshot,
  trailer cold open). Don't bury the important misses under trivia.
- **DRAFT:** the copy blocks (ready to paste) + an asset shot-list the user can hand to
  an artist/editor. Flag anything you assumed so they can correct it.

Never invent facts about the game (platforms, price, languages, content counts). If you
don't know, ask or leave a clearly-marked `[TODO: …]` placeholder.
