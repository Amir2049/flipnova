#!/bin/sh
# Runs the pass/fail tests with a time limit each (a script that fails to parse makes Godot hang, not exit).
#   GODOT=/path/to/godot sh tests/run_all.sh
G=${GODOT:-godot}
cd "$(dirname "$0")/.."
fail=0
for t in profile_save_test gf_data_test touch_pass_latency_test frame_governor_test patch_test; do
  if timeout 120 $G --headless --path . -s res://tests/$t.gd; then echo "PASS $t"; else echo "FAIL $t (exit $?)"; fail=1; fi
done
exit $fail
