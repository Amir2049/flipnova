# NOVA STUDIO

Amir's own game maker: make any 2D game on your phone — no code. A separate app from FLIPNOVA.
Egyptian Arabic first (English with one tap), and it opens straight back where you stopped.

- **Scene**: paint objects on a grid with your finger (two fingers to move and zoom).
- **Art**: draw 16×16 pixel sprites, with a 2nd frame for animation.
- **Objects**: give each thing a behaviour — player (platformer, top-down, gravity flip, flappy), wall, danger,
  collectible, goal, walking or chasing enemy, spring, key, locked door, checkpoint, sign, decoration.
- **Rules**: WHEN something happens THEN do things (score, messages, sounds, scenes, win/lose, spawn, gravity…).
- **Game**: lives, gravity, export as one HTML file (plays anywhere, upload it to itch.io), share codes.

Faster work:
- **▭ Rectangle**: drag to fill or erase a whole area. **💧 Picker**: tap anything to select it. **🎯 Test from here**: the player starts where you tap.
- **📚 My library**: save any object once, reuse it in every game (starts with all the template objects).
- **🕘 Backups**: made automatically (on open and every 5 minutes of work), restore any of the last 12.
- **✅ To-do + 💡 ideas** per game (never exported or shared).
- On a computer: Enter plays, Esc goes back, Ctrl+Z undoes.

Templates: Platformer, Gravity Flip, Flappy, Maze, Blank.

Build: `bash build-apk.sh` → `dist/NOVA-STUDIO.apk`, `bash build-web.sh` → `dist/NOVA-STUDIO.html`.
The game runtime is `js/runtime.js`; exported games carry a copy of it.
