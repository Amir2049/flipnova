# Deploy preflight: Flippo build 65 (14.0)

Date: 2026-11-19. **Nothing has been published.** Every "go" below is Amir's.

## Checks

| check | result |
|---|---|
| Game tests (`tools/*test*.js`) | 12/23 pass. The 11 that fail fail the same way on the untouched b65 (outdated tests, see `bugs.md`). |
| Fairness (`tools/human-test.js`) | ✅ ALL HUMANLY FAIR |
| Old saves load (`save-compat-test`) | ✅ 3 build-21 saves |
| Open S1 / S2 bugs | ✅ none |
| Genre parity (`parity.py replica/features.csv`) | 86.4. The one missing must-have is "on Google Play", which is this deploy. |
| Name sweep | ✅ everything a player sees says Flippo. Kept on purpose: app id, save keys, level-code prefix (`brand.md`). |
| Store listing lint (`listing.py`) | ✅ EN and AR: 0 errors, 0 warnings. Every number checked against the game (12 worlds, 28 stages, 50 levels, 150 stars, 55 characters, 20 trails). |
| Privacy policy | ✅ `privacy.html` (says "Flippo (formerly FLIPNOVA)") |

## 1. The web version (GitHub Pages)

- **Now:** https://amir2049.github.io/flipnova/ is live (HTTP 200), but it serves the **old FLIPNOVA single file**
  from `main`. The game's share and challenge links (`SITE` in `js/ui.js`) point to this address, so **anyone who
  opens a Flippo link today gets the old game.**
- **To ship:** merge branch `ccr-b8cf5a95-rf6p9a` into `main` (a Pull Request). Pages then serves b65 within a minute or two.
- **Check after:** open the link on a phone, play one run, share a challenge link and open it on another phone.
- **Note:** the repo is **public**. With the full source on `main`, anyone can read the code, `company/` plans and `.claude/`.
  The Supabase key in `js/online-config.js` is the publishable one (made to be public). If you want the plans private,
  make the repo private first. GitHub Pages on a private repo needs a paid plan, so the game site would need another host.

## 2. Google Play (Amir does these steps)

From `company/google-play-kit.md`:
1. Your own release key, kept **outside** the repo: `export FLIPNOVA_KEYSTORE_PROPS=/safe/place/keystore.properties`,
   then `tools/build-aab.sh`. Never commit the key or its passwords (`.gitignore` already blocks them).
2. **Decide the app id before the first upload. It can never change after.** It is `com.flipfrenzy.game` now.
   Earlier notes mention `com.flipnovax.game`. Players with the old APK keep their progress only if the id stays the
   same, or by moving it with the progress code (Settings → 💾).
3. Play Console: listing text from `replica/launch/listing.json` (EN) and `listing.ar.json` (AR), icon and
   screenshots from `store-assets/`, content rating (IARC) and Data safety answers from the kit.
4. Closed test with the testers' Gmail addresses, then production.
5. **Before that, from the review research:** try the APK on an old, cheap Android phone (about 2 GB RAM). Lag and
   crashes are a top complaint about rival games.
