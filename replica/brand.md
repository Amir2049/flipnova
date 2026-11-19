# Name sweep: FLIPNOVA / FlipFrenzy → Flippo

Run: `python3 sweep.py . --avoid "FLIPNOVA,FlipFrenzy,Flip Frenzy"` found 359 mentions
(tools 88, company 65, marketing 65, js 49, android 24, experiments 18, ...).

## Changed (players could see these)
- Shared files: `flipnova-clip.*`, `flipnova.png`, `flipnova-<score>.png`, `flipnova-challenge.png` → `flippo-…` (js/ui.js, MainActivity.java)
- Android share-sheet title "FLIPNOVA" → "Flippo" (3 places, MainActivity.java)
- Stage Maker header "FLIPNOVA Maker" → "Flippo Maker" (js/stagemaker.js; the Android app label was already "Flippo Maker")
- Windows app: window title, productName, description, README and the `.exe` name → Flippo

## Kept on purpose (changing them would break players)
- `com.flipfrenzy.game`: the Android app id. Changing it makes a new app; installed players lose the update path.
- Save keys `flipfrenzy.v1`, IndexedDB `flipnova`, the save checksum salt: changing them would wipe every save.
- Level-code prefix `FLIPNOVA:`: older builds can only read this prefix; new codes keep it so they still load everywhere.
- User-agent marker `FlipFrenzyApp`: the web code uses it to detect the Android app.
- `https://amir2049.github.io/flipnova/`: the live site address (the repo name). Share links point there.
- Build-script output names (`dist/FLIPNOVA*.apk|html|zip`) and code comments: not seen by players.

## Name checks to do yourself before the Play launch
- Search Google Play and the App Store for "Flippo" (other games/apps with the same name).
- Trademark search: WIPO Global Brand Database and the Egyptian trademark office, class 9 and 41.
- Handles: @flippo on TikTok / Instagram / YouTube, and a domain if you want one.
