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

# Derivations first: these render NOTHING and need no build, no server and no façade, so they run on a bare
# checkout and they fail loudly if a product constant moves under a figure that was derived from it. None
# writes to a SEALED-* file. The sealed probes themselves stay OUT of this script on purpose — a routine pass
# must not be able to overwrite a sealed reading.
#
# gruen-seal-staleness is the counterweight to that exclusion: keeping the sealed probes out of a pass also
# removed the only thing that would have noticed a seal going stale, so this audit re-checks every SEALED-*
# file against HEAD on every pass and exits non-zero if any is stale. It re-measures nothing and cannot.
for derivation in gruen-ag36-pg17-geometry gruen-pg17-reanchor gruen-pg23-alpha gruen-pg16-satisfiability gruen-seal-staleness gruen-pg12-alpha-quantisation gruen-pg14-frame-fixed gruen-pg12-floor-measured gruen-vector-expressibility gruen-constant-forks; do
  printf '\n=== %s (derivation, no render) ===\n' "$derivation"
  node "$derivation.mjs" >/dev/null || printf '!! %s FAILED (exit %s)\n' "$derivation" "$?"
done
export CONDYN_PLAYWRIGHT_MODULE="${CONDYN_PLAYWRIGHT_MODULE:-/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs}"

# Needs a BROWSER but no build, no server and no façade: it renders its own controlled stack with
# page.setContent. Kept separate from the server probes for exactly that reason, and viewport-independent.
printf '\n=== gruen-compositing-model (browser only, no server) ===\n'
# The raster-path smoke test goes FIRST of the browser work: if captureRaw -> decodeLuminance -> luminance
# is broken, every pixel reading below it is worthless, and §90 found exactly that sitting unnoticed for
# twenty-eight sections because no raster probe ran in between.
printf '\n=== gruen-raster-smoke (browser only, no server) ===\n'
node gruen-raster-smoke.mjs || printf '!! gruen-raster-smoke FAILED (exit %s) — DO NOT TRUST ANY PIXEL READING BELOW\n' "$?"
node gruen-compositing-model.mjs >/dev/null || printf '!! gruen-compositing-model FAILED (exit %s)\n' "$?"
node gruen-compositing-ladder.mjs >/dev/null || printf '!! gruen-compositing-ladder FAILED (exit %s)\n' "$?"

for size in "${SIZES[@]}"; do
  export VW="${size%x*}" VH="${size#*x}"
  for probe in gruen-pg23-computed gruen-floor gruen-light gruen-rings gruen-bodies gruen-glow gruen-pg1-live gruen-discriminator gruen-pg22 gruen-pg20 gruen-option3 gruen-pg22-seats; do
    printf '\n=== %s @ %s ===\n' "$probe" "$size"
    node "$probe.mjs" || printf '!! %s FAILED at %s (exit %s)\n' "$probe" "$size" "$?"
  done
done
# §82 · the HOOKED stand, which is a SECOND build on its own loopback ports and is NOT what the loop above
# reads. The preserved build (3220/3221, BUILD_ID HRYkeEpbpndI3UEE7ceeC) is the one the eight SEALED readings
# were taken against and is never rebuilt. gruen-hooks-verify declares itself VOID against a build without
# the hooks, so pointing it at the preserved stand is safe and informative rather than a false pass.
if curl -s -o /dev/null --max-time 3 http://127.0.0.1:3230/ 2>/dev/null; then
  for size in "${SIZES[@]}"; do
    export VW="${size%x*}" VH="${size#*x}"
    printf '\n=== gruen-hooks-verify @ %s (HOOKED stand :3230) ===\n' "$size"
    GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT=/home/codi/Entwicklung/condyn-admin-mapping-d-hooks \
      node gruen-hooks-verify.mjs || printf '!! gruen-hooks-verify FAILED at %s (exit %s)\n' "$size" "$?"
    printf '\n=== gruen-fixture-states @ %s (HOOKED stand :3230) ===\n' "$size"
    GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT=/home/codi/Entwicklung/condyn-admin-mapping-d-hooks \
      node gruen-fixture-states.mjs || printf '!! gruen-fixture-states FAILED at %s (exit %s)\n' "$size" "$?"
    # §94: the real-stack ladder needs the A-G49 geometry hooks (data-required-gaps, data-drawn-radius) to
    # separate the hue-carrying glow from the plain one, so it belongs to the HOOKED stand and not the loop above.
    printf '\n=== gruen-pg12-realstack-ladder @ %s (HOOKED stand :3230) ===\n' "$size"
    GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT=/home/codi/Entwicklung/condyn-admin-mapping-d-hooks \
      node gruen-pg12-realstack-ladder.mjs || printf '!! gruen-pg12-realstack-ladder FAILED at %s (exit %s)\n' "$size" "$?"
  done
else
  printf '\n(hooked stand :3230 not up — gruen-hooks-verify skipped; see README 6b)\n'
fi

printf '\nreadings in %s\n' "$(cd ../outputs && pwd)"
