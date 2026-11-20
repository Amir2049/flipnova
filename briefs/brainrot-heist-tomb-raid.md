# Brief: Brainrot Heist — "Tomb Raid" update (v2.4)

Source idea: `reports/2026-11-20-ideas.md`, idea 1 (scored 28/35).
Codebase: the Roblox project `BrainrotHeist/` (Rojo layout, `src/*.lua`, built by `build.py`, verified by `test_project.py`
with `luau` + `luau-analyze` on PATH). Art: `brainrot-models/realistic/<Name>.fbx` (20 creatures, one MeshPart each,
`_Color.png` / `_Normal.png` maps). Read `BrainrotHeist/DEVELOPER_GUIDE_AR.md` and `CHANGELOG.md` before starting.

## 1. Goal & hypothesis
We believe that **breaking open golden sarcophagi with an upgradeable pickaxe to reveal brainrots, then escaping mummy
guards**, layered on top of the existing steal/defend loop and shown with the new Egyptian creature models, will lift
D1 retention to ≥ 12% and average session length to ≥ 14 minutes (current baseline unknown; targets from
`tracking-game-metrics` defaults for Roblox simulators). This update exists to test that hook.

## 2. Non-goals (do NOT build these)
- No new currencies, no new paid random items, no loot boxes (store rule: every paid item has a fixed, disclosed result).
- No pyramid interior levels, traps, boss fight or quests specific to the tomb.
- No new DataStore keys except the two fields listed in §6.4. No changes to the save/lease logic in `Profiles.lua`.
- No pathfinding service for mummies (straight-line chase only). No ragdoll.
- No change to existing player-vs-player heist rules, shields, Peace Mode or receipts.
- No disguise gadget (that is the next update).

## 3. Core loop spec (exact rules)
1. **Sarcophagi** spawn on 10 fixed points in a ring around a new pyramid plaza at the island centre (radius 40–70 studs
   from origin; keep 12 studs clear of every base plot and of the King Brainrot spot).
2. Each sarcophagus has a **tier** = creature rarity it can contain, rolled like wild spawns today
   (`spawnAt` ring odds: outer ring tiers 1–3, middle 3–6, inner 6–9) and **HP = 20 × tier²** (tier 1 = 20, tier 9 = 1,620).
3. A player hits a sarcophagus by activating the **Pickaxe** tool within 8 studs. Server-side cooldown 0.35 s per hit.
   Damage per hit = `C.Pickaxe[level].damage` (table in §6.2). Several players may hit the same sarcophagus.
4. At 0 HP it breaks: the creature (id from its tier exactly as `grant()` picks ids, mutation from
   `E.rollMutation(rng, luck())`) appears on top for **12 s** and can be grabbed only by the player who dealt the most
   damage for the first 4 s, then by anyone (same `Grab` prompt + `carry()` as wild creatures; reuse `placeWild` with a
   new `opts.owner` / `opts.ownerUntil`).
5. Grabbing from a broken sarcophagus starts a **tomb escape**: the 2 nearest idle **mummies** chase the carrier.
   Carrier walk speed while escaping = existing carry speed (12). Mummy speed = 11 + 0.5 × tier (max 15.5).
6. A mummy that comes within `C.CatchRadius` (5) of the carrier **catches** them: same effect as wave/caught today
   (`uncarry`, creature lost, message "The mummy took it back!"). Mummies give up after 25 s or when the carrier
   is inside their own base (`W.inside`). Mummies then walk back to their post.
7. Depositing at the player's own deposit pad works exactly like a wild deposit (`E.deposit`), so income, quests,
   index and the existing raid system apply unchanged.
8. Respawn: a broken sarcophagus respawns after 20 s at the same point with a new tier roll.

## 4. Controls & feel (the 3-second clip)
- Pickaxe: Roblox `Tool`, activated by click/tap; swing animation (rotate the handle 70° and back in 0.18 s on the client).
- Per hit: gold chip particles (`ParticleEmitter` burst 8), a short "tink" sound (reuse built-in client sfx with a
  higher pitch), a floating damage number, and an HP bar (BillboardGui) above the sarcophagus.
- Break: lid flips off (tween 0.4 s), a vertical light beam (Neon cylinder, transparency 0.6, 2 s) and a rarity-coloured
  announcement for tier ≥ 6 (`announce`).
- Mummies: red Neon eyes, groan sound when they start chasing, the carrier's screen edge pulses red (client) while chased.

## 5. Content pipeline (build first, as tooling)
- **Models:** `brainrot-models/realistic/creatures_real.py` + `creatures_classic.py` already generate all 20 creatures
  (one FBX each, ≤ 20,000 triangles, grounded at Y=0, front = −Z). Add a `Mummy` and a `Sarcophagus` to
  `creatures_classic.py` with the same `brainrot_lib` (the mummy and sarcophagus shapes already exist in
  `brainrot-models/marketing/make_thumbnails.py` — move them into the library).
- **Studio import:** the owner imports every FBX with *File → Import 3D* into `ReplicatedStorage.BrainrotModels`
  (one Model per creature, named exactly like `Config.Creatures[i].name` without spaces, e.g. `KosharyDragon`).
- **Game code:** `W.creature(id, …)` must use `ReplicatedStorage.BrainrotModels[<NameWithoutSpaces>]` when it exists
  (clone, scale to the same height the procedural shape would have, recolour by mutation using the existing
  mutation colours on a Highlight/attribute, keep labels/attributes identical) and fall back to today's procedural
  builder when it does not. Nothing else may depend on which path was taken.
- **Acceptance:** with the folder missing, every existing test still passes unchanged; with a stub folder containing one
  Model per creature, a new test asserts that all 20 ids build from the folder and keep `Top`, `Wild`, `Tier`,
  `Mutation` attributes.

## 6. Systems, in build order
1. **Model loader in `World.lua`** (§5). Purpose: show the new art everywhere with zero gameplay risk.
2. **Config:** `C.Tomb = {points=10, respawn=20, revealSeconds=12, ownerSeconds=4, hpPerTier2=20, hitCooldown=0.35}`,
   `C.Pickaxe = {{damage=10,cost=0},{damage=18,cost=2500},{damage=32,cost=25000},{damage=60,cost=250000},{damage=110,cost=2500000}}`,
   `C.Mummy = {count=4, base=11, perTier=0.5, give=25}`.
3. **Sarcophagus server module** (new `Tomb.lua`, required by `Main.server.lua`): points, HP, hits with server-side range
   + cooldown checks, break → `placeWild` with owner window, respawn.
4. **Saved data (`Economy.lua` `E.clean`)**: `d.pickaxe` (int 1–5, default 1) and `d.tombsBroken` (int ≥ 0). Clamp both on
   load like every other field. Pickaxe upgrades are bought with coins at a new "Tomb Smith" prompt on the plaza
   (`E.buy`).
5. **Mummies** (server, in `Tomb.lua`): 4 NPC models anchored-and-CFramed on Heartbeat (no Humanoid physics), straight-line
   chase on the XZ plane, catch rule from §3.6.
6. **Client juice** (`Client.client.lua`): swing, particles, HP bar, damage numbers, chase vignette, sounds.
7. **Quests/badges:** add `tomb` quest kind ("Break 10 sarcophagi") and badge `tomb` (artwork in
   `brainrot-models/marketing`), via the existing `track(s,"tomb",1)` path.
8. **What's New:** bump `C.News` to version `2.4` with the Tomb Raid lines and a fixed gift (coins + 1 x2 token).

## 7. Monetization hooks (existing systems only)
- Game Pass **"Golden Pickaxe"** (`MyIds.Passes.goldpickaxe`): permanent ×2 pickaxe damage. Hidden while the id is 0.
- Developer product **"Royal Sarcophagus Key"**: instantly breaks the sarcophagus you are standing next to
  (fixed result: you are told its tier before buying; the creature itself is the normal roll of that tier). If the
  disclosure cannot be shown before purchase, do not ship this product.
- Reuse `Market.ProcessReceipt` exactly as today (record receipt id, save, then grant). No new receipt code paths.

## 8. Analytics events
Roblox has no ad SDK here; log through one helper `Analytics.event(name, data)` that wraps
`AnalyticsService:LogCustomEvent` (stub in tests):
`session_start`, `session_end`, `tomb_hit`, `tomb_break {tier}`, `tomb_escape_success {tier}`, `tomb_caught {tier}`,
`pickaxe_upgrade {level}`, `deposit {source="tomb"|"wild"|"heist"}`.

## 9. Tech constraints
- Roblox, Luau, existing Rojo layout. No new packages. Mobile + PC + console input (tool activation only).
- Server budget: Tomb + mummies ≤ 0.5 ms per Heartbeat with 8 players (measure with `os.clock` in a test loop).
- Every remote/tool activation is validated server-side (range, cooldown, ownership); the client never reports damage.
- Keep `luau-analyze` clean (no warnings) and every existing test in `test_project.py` green.

## 10. Milestones & acceptance
- **M0 – Models in game:** loader + fallback; existing tests green; new loader test green; screenshot in Studio of the
  island with imported models.
- **M1 – Graybox tomb:** sarcophagi with HP, pickaxe hits, break → grab → deposit works end to end in the engine double
  (`tests/tomb.lua`, run_main=True): break a tier-3 sarcophagus with 2 players, top damager gets the 4 s window.
- **M2 – Mummies:** chase/catch/give-up rules covered by `tests/tomb_rules.lua` (pure maths) and one simulation.
- **M3 – Juice + store + quests:** muted 10-second capture in Studio looks like an ad (hit → break → beam → chase → deposit);
  Golden Pickaxe hidden at id 0, visible and working with a test id in the commerce test.
- **M4 – Ship:** `python3 build.py` produces the `.rbxlx`; `python3 test_project.py` writes an all-PASS `VERIFICATION.txt`;
  CHANGELOG + `START_HERE_AR.md` updated in Egyptian Arabic.

## 11. Verification
`python3 test_project.py` (static analysis, rules, server simulations, client loopback, API dump check) after every
milestone; add the new test files to its lists. Studio play test only for M0 and M3 captures.

## 12. Open questions (defaults if nobody answers)
- Plaza replaces the current centre decoration? **Default:** yes, keep the King Brainrot spot and move the plaza
  ring outward if they overlap.
- Should sarcophagus creatures be stealable by other players during the escape? **Default:** yes, the normal heist rules
  apply once deposited; during the escape only mummies can stop you.
- Language: **Default:** all new text in English with Arabic in the existing `ar` fields.
