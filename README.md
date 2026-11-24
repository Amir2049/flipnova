# AFC test builds (install as "AFC Test", next to the original game)

- `AFC-2.27.apk`: the full game. The native match engine is loaded behind a guard: if it fails on a phone, the
  game still opens (on the second start at worst) with matches on the built-in engine.
- `AFC-2.27-safe.apk`: without the native library at all.
