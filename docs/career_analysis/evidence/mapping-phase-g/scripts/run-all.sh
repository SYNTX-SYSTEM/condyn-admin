#!/usr/bin/env bash
# GRÜN · PHASE-G DEVELOPMENT INSTRUMENT · one pass over one build.  PRODUCES NO VERDICT (A-G36 point 2).
#
#   bash docs/career_analysis/evidence/mapping-phase-g/scripts/run-all.sh [1920x1080 ...]
#
# Prerequisites, in this order:
#   1. npm run build                                  (a PRODUCTION build — Turbopack dev does not hydrate headless)
#   2. npx next start --port 3221                     (the prod server, GRÜN's own port)
#   3. node_modules/.bin/tsx docs/.../scripts/gruen-facade.mts   (the fixture façade on 3220 → 3221)
# The façade serves only the fixtures field-g.test.tsx already uses; any unscripted /api read answers 404 and
# is logged to ../outputs/facade.log, so a read GRÜN did not script is visible rather than invented.
set -uo pipefail
cd "$(dirname "$0")"
SIZES=("$@"); [ ${#SIZES[@]} -eq 0 ] && SIZES=(1920x1080 1280x800)
export CONDYN_PLAYWRIGHT_MODULE="${CONDYN_PLAYWRIGHT_MODULE:-/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs}"
for size in "${SIZES[@]}"; do
  export VW="${size%x*}" VH="${size#*x}"
  for probe in gruen-floor gruen-light gruen-rings gruen-bodies gruen-glow gruen-pg1-live gruen-discriminator; do
    printf '\n=== %s @ %s ===\n' "$probe" "$size"
    node "$probe.mjs" || printf '!! %s FAILED at %s (exit %s)\n' "$probe" "$size" "$?"
  done
done
printf '\nreadings in %s\n' "$(cd ../outputs && pwd)"
