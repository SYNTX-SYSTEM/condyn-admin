#!/bin/bash
# One typography take, from the repository root of a checkout in which NO other `next dev` runs:
#   CONDYN_PLAYWRIGHT_MODULE=<playwright/index.js> bash docs/career_analysis/evidence/ui-typography/scripts/take.sh <out dir> <width> <height> [port]
# A fresh video lab (../../video-readiness/scripts/video-lab.ts: empty disposable database, real server and worker, loopback Gemini
# stand-in, network sentinel; stopped by its own PID) → the video walk with the text inventory of every frame → the extra surfaces
# (onboarding, system codex EN/DE, semantic guide, the German field, scale and dense pools) → lab stopped (databases dropped).
set -u
S=$(cd "$(dirname "$0")" && pwd); V="$S/../../video-readiness/scripts"; OUT=$1; W=$2; H=$3; PORT=${4:-41807}; LAB="$OUT.lab"
[ -n "${CONDYN_PLAYWRIGHT_MODULE:-}" ] || { echo "CONDYN_PLAYWRIGHT_MODULE is required (path to playwright/index.js)"; exit 2; }
set -a; . "${TEST_DB_ROLE_ENV:-$HOME/.config/condyn/test-db-role.env}"; set +a
unset DATABASE_URL CONDYN_ALLOW_SHARED_DATABASE GEMINI_API_KEY GEMINI_MODEL GOOGLE_GEMINI_BASE_URL
rm -rf "$LAB" "$OUT"; mkdir -p "$LAB" "$OUT"
node "$S/instrument-walk.mjs" "$LAB/video-walk.inventory.mjs" || exit 2
VIDEO_LAB_PORT=$PORT VIDEO_LAB_DIR=$LAB npx tsx "$V/video-lab.ts" > "$LAB/lab.log" 2>&1 &
for i in $(seq 1 400); do grep -qE "VIDEO LAB READY|Error|failed|refused" "$LAB/lab.log" && break; sleep 3; done
grep -qE "VIDEO LAB READY" "$LAB/lab.log" || { echo "lab failed"; bash "$V/stop-lab.sh" "$LAB"; wait; exit 1; }
timeout 1500 node "$LAB/video-walk.inventory.mjs" "$LAB/state.json" "$OUT" "$W" "$H" > "$OUT/walk.log" 2>&1; rc=$?
timeout 900 node "$S/extras-walk.mjs" "$LAB/state.json" "$OUT" "$W" "$H" > "$OUT/extras.log" 2>&1
echo "PASS $(grep -cE '^PASS' "$OUT/walk.log")"; grep -hE "^FAIL" "$OUT/walk.log" "$OUT/extras.log"
bash "$V/stop-lab.sh" "$LAB"; wait
exit $rc
