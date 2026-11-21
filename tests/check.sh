#!/bin/sh
# Parse-check every script (a failed parse makes -s test scripts hang instead of exiting).
# --check-only runs without autoloads, so "Identifier not found: Profile" (and the knock-on "line 0" failures of
# scripts that depend on those) are not real errors; the game itself is run by tests/shot_*.gd.
G=${GODOT:-godot}
cd "$(dirname "$0")/.."
fail=0
for f in $(find scripts -name '*.gd'); do
  out=$(timeout 30 $G --headless --check-only --script res://$f 2>&1 | grep -A1 -E "SCRIPT ERROR" | grep -v "Failed to compile depended" | paste - - | grep "res://$f" | grep -v "Identifier not found: Profile" | grep -v ":0)" | sed -E 's/SCRIPT ERROR: //; s/\s+at: GDScript::reload \(res:\/\/[^:]*:/  line /' | head -8)
  if [ -n "$out" ]; then echo "== $f"; echo "$out"; fail=1; fi
done
[ $fail = 0 ] && echo "all scripts parse"
