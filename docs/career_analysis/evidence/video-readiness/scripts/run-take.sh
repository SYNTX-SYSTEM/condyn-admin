#!/bin/bash
# One verified take of the END-TO-END VIDEO WALK, from the repository root of a checkout in which NO other `next dev` runs:
#   CONDYN_PLAYWRIGHT_MODULE=<path to playwright/index.js> bash docs/career_analysis/evidence/video-readiness/scripts/run-take.sh <out dir> <width> <height> [port]
# Fresh lab (own PID; empty disposable database; real server and worker; loopback Gemini stand-in; network sentinel) → walk → lab stopped
# (its databases dropped). VIDEO_LAB_PROD=1 uses a local production build instead of `next dev` (see the readiness document, B-3).
# The least-privilege test role comes from TEST_DB_ROLE_ENV (default ~/.config/condyn/test-db-role.env); it is never printed.
set -u
S=$(cd "$(dirname "$0")" && pwd); OUT=$1; W=$2; H=$3; PORT=${4:-41861}; LAB="$OUT.lab"
[ -n "${CONDYN_PLAYWRIGHT_MODULE:-}" ] || { echo "CONDYN_PLAYWRIGHT_MODULE is required (path to playwright/index.js)"; exit 2; }
set -a; . "${TEST_DB_ROLE_ENV:-$HOME/.config/condyn/test-db-role.env}"; set +a
unset DATABASE_URL CONDYN_ALLOW_SHARED_DATABASE GEMINI_API_KEY GEMINI_MODEL GOOGLE_GEMINI_BASE_URL
rm -rf "$LAB" "$OUT"; mkdir -p "$LAB" "$OUT"
VIDEO_LAB_PROD=${VIDEO_LAB_PROD:-0} VIDEO_LAB_PORT=$PORT VIDEO_LAB_DIR=$LAB npx tsx "$S/video-lab.ts" > "$LAB/lab.log" 2>&1 &
for i in $(seq 1 400); do grep -qE "VIDEO LAB READY|Error|failed" "$LAB/lab.log" && break; sleep 3; done
grep -E "VIDEO LAB READY" "$LAB/lab.log" || { echo "lab failed"; grep -E "Error|failed|Type error" "$LAB/lab.log" | sed -E 's/(postgres[a-z]*:\/\/)[^ ]*/\1***/g' | head -10; bash "$S/stop-lab.sh" "$LAB"; wait; exit 1; }
timeout 1500 node "$S/video-walk.mjs" "$LAB/state.json" "$OUT" "$W" "$H"; rc=$?
cp "$LAB/standin.jsonl" "$OUT/standin.jsonl" 2>/dev/null; cp "$LAB/net.jsonl" "$OUT/net.jsonl" 2>/dev/null || : > "$OUT/net.jsonl"
bash "$S/stop-lab.sh" "$LAB"; wait
exit $rc
