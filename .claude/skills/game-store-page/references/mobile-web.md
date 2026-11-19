# Mobile store & web landing profile

Covers **Apple App Store**, **Google Play**, and a **self-hosted web landing page**.
These share a world with no "wishlist" (mostly), an install/play CTA, and — on mobile —
hard character limits and store-review constraints. Universal principles hold; the specs
and the conversion model differ from Steam.

## Apple App Store

Assets & copy:
- **App icon:** 1024×1024, no alpha, no rounded corners (Apple rounds it). This is your
  capsule — readable at tiny home-screen size, no text baked in beyond a mark. No AI art.
- **App name:** ≤30 characters. **Subtitle:** ≤30 characters — use it for genre + hook.
- **Promotional text:** ≤170 chars, editable without a review — put the current pitch here.
- **Description:** long, but only the **first ~3 lines show before "more"** — front-load
  the pitch exactly like the universal rule; genre + goal + verbs in those first lines.
- **Keywords field:** 100 chars, comma-separated, no spaces — this is the tag analog.
  Don't repeat words already in the name/subtitle; every character counts.
- **Screenshots:** required per device size (6.7"/6.5" iPhone, 12.9" iPad). First 2-3 are
  what shows in search — make them mechanic-first and legible. You may add caption overlays
  (common on mobile, unlike Steam's "raw gameplay" rule). Still show real gameplay + UI.
- **App preview video:** 15-30s (Apple's cap is 30s), autoplays muted in search — so the
  **first frame and first 3 seconds must read without sound**. Cold open still applies.

CTA & model: the button is **"Get"/"Install"** — there is no wishlist. Apple has no
pre-launch wishlist; drive to a landing page / email list before launch. Pre-orders exist
as the closest analog. Trailer CTA card → "Download free" / "Play now".

## Google Play

- **App icon:** 512×512, 32-bit PNG.
- **Feature graphic:** 1024×500 — shown at the top of the listing and in promos. Treat it
  like a hero capsule: name-only, high contrast, readable small.
- **Short description:** ≤80 characters — the single most important copy line; genre + hook.
- **Full description:** ≤4,000 characters, but same front-load discipline (first lines win).
- **Screenshots:** min 2 (add ≥7 for quality parity), first ones are the search preview;
  captions allowed. Real gameplay + UI, color variety.
- **Promo video:** a YouTube link; autoplays. Same cold-open rules; first 3s must sell muted.
- CTA: **"Install"**. No wishlist (pre-registration is the analog — worth setting up).

## Web landing page (self-hosted)

You control everything, so apply the universal principles as *design*, not fill-in fields:
- **Above the fold = the capsule + short description + CTA.** Hero art or an autoplaying
  muted gameplay clip, the one-line genre+hook, and one primary button.
- **Primary CTA** = wherever you actually want them: "Wishlist on Steam" / "Download on
  itch" / "Get it on the App Store" / "Join the Discord" / email capture. Pick ONE primary.
- **Trailer** embedded (YouTube), same structure. **Screenshots** gallery, ≥7, mechanic-
  first, variety. **Features** section. **Press kit link** (use presskit()/dopresskit).
- No character caps, but ruthless brevity converts better — a landing page is a funnel,
  not a wiki. Front-load, one screenful to the core pitch + CTA.
- SEO: the first 1-2 sentences double as the meta description / OpenGraph card — write them
  to stand alone (this is the universal "first sentences → embeds" rule, literally).

## Cross-cutting for all three

- **The muted-autoplay reality:** on mobile stores and web heroes, video plays without
  sound in the feed. Steam's cold open becomes even more critical — the first 3 seconds
  must communicate the game with zero audio and zero context.
- **Localization:** mobile stores localize per-locale listings (name, description,
  screenshots, keywords) — high value, do the universal language set. Web: localize if you
  have the traffic, else ship EN and add OpenGraph per-locale later.
- **No Steam-isms:** no capsule template overlay, no "Wishlist Now" wording (unless the web
  page's CTA literally points at a Steam page), no 15-20 Steam tags, no Community hub.

## When auditing, weight these highest
Icon/feature-graphic legibility → the shortest copy field (subtitle / 80-char short desc /
hero line) → first 1-3 screenshots (the search preview) → muted first-3-seconds of the
preview video → single clear CTA.
