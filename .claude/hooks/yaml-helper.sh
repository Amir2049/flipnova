#!/usr/bin/env bash
# FLIPNOVA stub for the skills copied from the Claude-Code-Game-Studios pack.
# Those skills call `yaml-helper.sh resolve_config --keys a,b` to read a project.yaml this repo does not have.
# The full upstream helper is not installed here; this stub answers every key with a default and says so,
# so a skill never mistakes "not configured" for a real setting.
cmd="$1"; shift
keys=""
while [ $# -gt 0 ]; do
  case "$1" in --keys) keys="$2"; shift 2 ;; *) shift ;; esac
done
case "$cmd" in
  resolve_config)
    echo "# NOT CONFIGURED: FLIPNOVA has no project.yaml; values below are defaults from the stub"
    IFS=',' read -ra K <<< "$keys"
    for k in "${K[@]}"; do
      case "$k" in
        review_mode|modes.review_mode) echo "$k=full	(default)" ;;
        automation) echo "$k=off	(default)" ;;
        team.size) echo "$k=individual	(default)" ;;
        *) echo "$k=	unset" ;;
      esac
    done ;;
  *) echo "# NOT CONFIGURED: yaml-helper stub only supports resolve_config" ;;
esac
exit 0
