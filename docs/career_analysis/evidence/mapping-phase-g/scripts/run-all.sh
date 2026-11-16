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

# §117: EVERY FAILURE IS NAMED AT THE END AND THE PASS EXITS NON-ZERO. §116b found gruen-pg14-frame-fixed
# dead for nine sections: it threw, the `|| printf` below turned the throw into one `!!` line among forty,
# and a reader who scrolled to the last line saw a pass. The loop still CONTINUES on a failure, which is
# right — one dead instrument must not hide the other thirty-nine — but the pass no longer ENDS quietly.
FAILED=()
note_failure() { FAILED+=("$1"); }

# Derivations first: these render NOTHING and need no build, no server and no façade, so they run on a bare
# checkout and they fail loudly if a product constant moves under a figure that was derived from it. None
# writes to a SEALED-* file. The sealed probes themselves stay OUT of this script on purpose — a routine pass
# must not be able to overwrite a sealed reading.
#
# gruen-seal-staleness is the counterweight to that exclusion: keeping the sealed probes out of a pass also
# removed the only thing that would have noticed a seal going stale, so this audit re-checks every SEALED-*
# file against HEAD on every pass and exits non-zero if any is stale. It re-measures nothing and cannot.
for derivation in gruen-ag36-pg17-geometry gruen-pg17-reanchor gruen-pg23-alpha gruen-pg16-satisfiability gruen-seal-staleness gruen-pg12-alpha-quantisation gruen-pg14-frame-fixed gruen-pg12-floor-measured gruen-vector-expressibility gruen-constant-forks gruen-currency-lapse; do
  printf '\n=== %s (derivation, no render) ===\n' "$derivation"
  node "$derivation.mjs" >/dev/null || { rc=$?; printf '!! %s FAILED (exit %s)\n' "$derivation" "$rc"; note_failure "$derivation (exit $rc)"; }
done
# §130: the absolute export that stood here named a file inside /home/codi/Entwicklung/nquiry, a DIFFERENT
# repository origin does not contain. Resolution now belongs to gruen-paths.mjs, which tries a bare import of
# the declared devDependency FIRST, then CONDYN_PLAYWRIGHT_MODULE, then documented machine-local fallbacks,
# and THROWS NAMING EVERY CANDIDATE rather than falling back to something that merely imports. Nothing is
# exported here: an env var set by the runner would pre-empt the declared dependency it is meant to replace.
# A pre-set CONDYN_PLAYWRIGHT_MODULE is still honoured, by the resolver, as step 2.
printf '\n=== tool resolution (gruen-paths.mjs) ===\n'
node gruen-paths.mjs || { printf '!! gruen-paths FAILED (exit %s) — no reading below can name its tools\n' "$?"; note_failure "gruen-paths (tool resolution)"; }

# Needs a BROWSER but no build, no server and no façade: it renders its own controlled stack with
# page.setContent. Kept separate from the server probes for exactly that reason, and viewport-independent.
printf '\n=== gruen-compositing-model (browser only, no server) ===\n'
# The raster-path smoke test goes FIRST of the browser work: if captureRaw -> decodeLuminance -> luminance
# is broken, every pixel reading below it is worthless, and §90 found exactly that sitting unnoticed for
# twenty-eight sections because no raster probe ran in between.
printf '\n=== gruen-raster-smoke (browser only, no server) ===\n'
# §130 / F-G3: §117's own header says "EVERY FAILURE IS NAMED AT THE END AND THE PASS EXITS NON-ZERO". MEASURED
# against the script as it stood: only the 11 DERIVATIONS called note_failure. The raster smoke test, the two
# compositing probes, the 12 per-size probes (×2 sizes) and the 3 hooked probes — about 30 of roughly 41
# executions — printed one `!!` line and left FAILED empty, so the pass still ended
# "ALL DERIVATIONS AND PROBES RETURNED 0". *** THAT IS §116b's DEFECT, THE ONE §117 WAS WRITTEN TO CLOSE,
# STILL LIVE FOR EVERY PROBE THAT RENDERS A PIXEL *** — and the raster smoke test is the one whose silence is
# worst, because its own message says no pixel reading below it can be trusted.
node gruen-raster-smoke.mjs || { rc=$?; printf '!! gruen-raster-smoke FAILED (exit %s) — DO NOT TRUST ANY PIXEL READING BELOW\n' "$rc"; note_failure "gruen-raster-smoke (exit $rc) — EVERY PIXEL READING BELOW IS UNTRUSTED"; }
node gruen-compositing-model.mjs >/dev/null || { rc=$?; printf '!! gruen-compositing-model FAILED (exit %s)\n' "$rc"; note_failure "gruen-compositing-model (exit $rc)"; }
node gruen-compositing-ladder.mjs >/dev/null || { rc=$?; printf '!! gruen-compositing-ladder FAILED (exit %s)\n' "$rc"; note_failure "gruen-compositing-ladder (exit $rc)"; }

for size in "${SIZES[@]}"; do
  export VW="${size%x*}" VH="${size#*x}"
  for probe in gruen-pg23-computed gruen-floor gruen-light gruen-rings gruen-bodies gruen-glow gruen-pg1-live gruen-discriminator gruen-pg22 gruen-pg20 gruen-option3 gruen-pg22-seats; do
    printf '\n=== %s @ %s ===\n' "$probe" "$size"
    node "$probe.mjs" || { rc=$?; printf '!! %s FAILED at %s (exit %s)\n' "$probe" "$size" "$rc"; note_failure "$probe @ $size (exit $rc)"; }
  done
done
# §82 · the HOOKED stand, which is a SECOND build on its own loopback ports and is NOT what the loop above
# reads. The preserved build (3220/3221, BUILD_ID HRYkeEpbpndI3UEE7ceeC) is the one the eight SEALED readings
# were taken against and is never rebuilt. gruen-hooks-verify declares itself VOID against a build without
# the hooks, so pointing it at the preserved stand is safe and informative rather than a false pass.
# §130: GRUEN_WT was hardcoded to one named worktree on three lines. It is the BUILD HOST whose BUILD_ID and
# git state the provenance block records, so a wrong value does not fail — it RECORDS THE WRONG BUILD under a
# right-looking reading, which is the worst available outcome. It is therefore derived from this checkout by a
# DOCUMENTED convention (<this repo>-hooks) and then CHECKED: if it is not a checkout, the hooked probes are
# skipped with a named reason instead of running against a tree nobody verified. Override with GRUEN_HOOKS_WT.
GRUEN_REPO_ROOT="$(cd ../../../../.. && pwd)"
GRUEN_HOOKS_WT="${GRUEN_HOOKS_WT:-${GRUEN_REPO_ROOT}-hooks}"
if curl -s -o /dev/null --max-time 3 http://127.0.0.1:3230/ 2>/dev/null; then
  if [ ! -e "$GRUEN_HOOKS_WT/.git" ]; then
    printf '\n(hooked stand :3230 IS up, but GRUEN_HOOKS_WT=%s is not a checkout — the three hooked probes are\n' "$GRUEN_HOOKS_WT"
    printf ' SKIPPED rather than run against an unverified build host. Set GRUEN_HOOKS_WT. DECLARED, not silent.)\n'
    note_failure "hooked probes SKIPPED: GRUEN_HOOKS_WT=$GRUEN_HOOKS_WT is not a checkout (declared, not a dead instrument)"
  else
  for size in "${SIZES[@]}"; do
    export VW="${size%x*}" VH="${size#*x}"
    printf '\n=== gruen-hooks-verify @ %s (HOOKED stand :3230) ===\n' "$size"
    GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT="$GRUEN_HOOKS_WT" \
      node gruen-hooks-verify.mjs || { rc=$?; printf '!! gruen-hooks-verify FAILED at %s (exit %s)\n' "$size" "$rc"; note_failure "gruen-hooks-verify @ $size, hooked stand (exit $rc)"; }
    printf '\n=== gruen-fixture-states @ %s (HOOKED stand :3230) ===\n' "$size"
    GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT="$GRUEN_HOOKS_WT" \
      node gruen-fixture-states.mjs || { rc=$?; printf '!! gruen-fixture-states FAILED at %s (exit %s)\n' "$size" "$rc"; note_failure "gruen-fixture-states @ $size, hooked stand (exit $rc)"; }
    # §94: the real-stack ladder needs the A-G49 geometry hooks (data-required-gaps, data-drawn-radius) to
    # separate the hue-carrying glow from the plain one, so it belongs to the HOOKED stand and not the loop above.
    printf '\n=== gruen-pg12-realstack-ladder @ %s (HOOKED stand :3230) ===\n' "$size"
    GRUEN_BASE=http://127.0.0.1:3230 GRUEN_WT="$GRUEN_HOOKS_WT" \
      node gruen-pg12-realstack-ladder.mjs || { rc=$?; printf '!! gruen-pg12-realstack-ladder FAILED at %s (exit %s)\n' "$size" "$rc"; note_failure "gruen-pg12-realstack-ladder @ $size, hooked stand (exit $rc)"; }
  done
  fi
else
  printf '\n(hooked stand :3230 not up — gruen-hooks-verify skipped; see README 6b)\n'
fi

printf '\nreadings in %s\n' "$(cd ../outputs && pwd)"

# §117, and it is A-G465's shape: the exit code of a reporter is not a verdict, so this one describes the
# PASS and nothing else. gruen-seal-staleness and gruen-currency-lapse exit non-zero to report a FINDING
# about the record, not a failure of themselves — both appear below, and the distinction is the reader's to
# make from the named list, which is why the list is named rather than counted.
if [ ${#FAILED[@]} -eq 0 ]; then
  printf '\nALL DERIVATIONS AND PROBES RETURNED 0, and as of §130 the probes are actually COUNTED rather than\n  only printed (F-G3). That is a statement about the TOOLS, not about any pin (A-G374).\n'
else
  printf '\n!! %s NON-ZERO, NAMED RATHER THAN COUNTED:\n' "${#FAILED[@]}"
  for f in "${FAILED[@]}"; do printf '!!   %s\n' "$f"; done
  printf '!! A non-zero here may be a DEAD INSTRUMENT or a LIVE FINDING. gruen-seal-staleness and\n'
  printf '!! gruen-currency-lapse report findings this way by design; read their output, not their code.\n'
  exit 1
fi
