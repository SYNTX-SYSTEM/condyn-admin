#!/bin/bash
# Stop a video lab by its own PID (from <lab dir>/state.json only; never a pattern kill). The lab drops its databases on SIGTERM.
S="$1/state.json"
[ -f "$S" ] || { echo "no lab state in $1"; exit 0; }
P=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1]))['pid'])" "$S")
kill -TERM "$P"; for i in $(seq 1 40); do kill -0 "$P" 2>/dev/null || break; sleep 1; done
kill -0 "$P" 2>/dev/null && echo "lab $P still running" || echo "lab $P stopped"
