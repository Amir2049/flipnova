# Steam profile

The canonical checklist (Marnix Wyns / BiteMe Games). Steam has the most surface area
and the strictest asset rules of any platform here. Items marked **[Steam-only]** have
no equivalent on itch/mobile/web — do not port them elsewhere.

Official docs: Steamworks → Store Presence (https://partner.steamgames.com/doc/store).
Capsule guide: https://www.steamcapsule.com/guide . Capsule templates/guidelines are in
the Steamworks asset guidelines.

## First impressions

### Capsule (the store thumbnail) **[Steam-only asset]**
- [ ] No AI-generated art.
- [ ] Good, (semi-)custom logo — stylized font or a custom commission, not a default font.
- [ ] Strong contrast between logo and background art (no beige-on-brown).
- [ ] Follows the capsule rules at https://www.steamcapsule.com/guide .
- [ ] Logo does not overlap the Steam UI template overlay zones (see Steam templates).
- [ ] Contains **only the game's name** — no taglines, no review quotes, no awards.
- [ ] Has a border so it stands out against Steam's dark background.

Capsule sizes you'll be asked for (px): Header 460×215, Small 231×87, Main 616×353,
Vertical 374×448, Library 600×900, Library hero 1920×620, Library logo 1280×720 (PNG,
transparent). Verify current sizes in Steamworks — Valve changes them.

### Short description
- [ ] Names the genre up front: "{NAME} is a roguelike deckbuilder where…".
- [ ] States the end goal (e.g. "Save the princess").
- [ ] Describes what the player *does* with verbs (trade, fight, dodge, build, manipulate).
- [ ] No lore-heavy setup ("The Prime Cyrule has taken over…" → "Fight back against an
      alien invasion").

### Trailer
- [ ] Exists.
- [ ] 30-50 seconds.
- [ ] Cold open: 4-5 different highlights in the first 15 seconds.
- [ ] No individual shot over ~6 seconds.
- [ ] Also uploaded to YouTube.
- [ ] Ends on a 5-8s CTA card: **"Wishlist Now"** (pre-launch) or "Demo out now" /
      "Available now" as appropriate. **[Steam-only CTA — Wishlist is a Steam concept]**

### Screenshots
- [ ] Minimum 7.
- [ ] First screenshot shows the main game mechanic.
- [ ] Gameplay with in-game UI (no cinematics).
- [ ] No menu screenshots.
- [ ] Variety in color and scene (not 4 near-identical shots).

## Smaller stuff

### Long description
- [ ] Opens with 1-2 sentences of plain text (used for embeds/social cards).
- [ ] **Max ~1,000 characters total**, including headers. **[Steam-specific cap]**
- [ ] 2-4 gameplay "gifs" — actually **800px-wide MP4 files** — showing highlights.
- [ ] A **Features** section at the bottom (controller support, level count, co-op, …).

### Socials
- [ ] Links to Discord & YouTube.
- [ ] Link to a website, or to the game's press kit if no site.
- [ ] Follow your own **Community Discussion board** to get notified of new posts. **[Steam-only]**

### Localization
- [ ] Store page localized in at least: EN, DE, PT-BR, ES-419, RU, ZH, JA, KO.
- [ ] The game itself marked with its supported languages (sidebar shows them).

### Other
- [ ] **15-20 tags** added. **[Steam-only tag system — quantity and taxonomy are Steam's]**
- [ ] Release date set to year or month (exact date if releasing in <2 months).
- [ ] **Steam Developer Homepage** configured. **[Steam-only]**
- [ ] **Press release** on store-page announcement.

## When auditing a Steam page, weight these highest
Short description clarity → capsule readability at thumbnail size → first screenshot →
trailer cold open → Wishlist CTA present. These move wishlists the most; tags/homepage
matter but are recoverable later.
