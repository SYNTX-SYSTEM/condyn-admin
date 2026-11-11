#!/usr/bin/env bash
# GRÜN · PHASE-G · §107 — a verification step whose EXIT CODE comes from the artifact, not from a pipeline.
#
# A-G374's second limb (GELB §113): reading the artifact fixes what you REPORT; it does not fix what you DO.
# A conditional action — `... | grep ... && git commit` — takes its decision from the exit code, and the
# "read the artifact" remedy never touched that. Six instances of A-G374 were misreporting. The seventh was
# mine and was the first FALSE ACTION: a suite piped into grep, chained with &&, and a red commit went in.
#
# So this runs the suite UNPIPED, writes the runner's own output to a file, parses the runner's SUMMARY, and
# exits non-zero unless the summary itself says nothing failed. Anything chained after it with && is then
# gated on the artifact's verdict rather than on the last process in a pipe.
#
# FAIL-CLOSED: a missing or unparseable summary exits non-zero. A run that died before printing one is not a
# pass, and "no summary" must never be quieter than "1 failed" (A-G419's shape: absence is not success).
#
# `--parse FILE` runs the parser alone against a given file, so the parser can be put at risk without
# breaking the tree. §100 found verification code to be the least examined in either lane; this is
# verification code, so it ships with its own negative test.
set -uo pipefail

parse() {
  local out="$1" files tests
  [ -r "$out" ] || { echo "VERIFY: no output file at $out — fail closed"; return 2; }
  files=$(grep -E '^ *Test Files +' "$out" | tail -1)
  tests=$(grep -E '^ *Tests +' "$out" | tail -1)
  if [ -z "$files" ] || [ -z "$tests" ]; then
    echo "VERIFY: the runner printed no summary — fail closed (a run that died before its summary is not a pass)"
    return 3
  fi
  echo "VERIFY: ${files#"${files%%[![:space:]]*}"}"
  echo "VERIFY: ${tests#"${tests%%[![:space:]]*}"}"
  case "$files$tests" in
    *failed*) echo "VERIFY: FAILED — the summary names failures"; return 1 ;;
  esac
  echo "VERIFY: PASSED — the summary names no failure"
  return 0
}

if [ "${1:-}" = "--parse" ]; then parse "${2:?--parse needs a file}"; exit $?; fi

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../../.." && pwd)"
OUT="${GRUEN_VERIFY_OUT:-$(mktemp)}"
cd "$ROOT" || exit 4
[ -r .env.local ] || { echo "VERIFY: no .env.local — the vitest gate needs TEST_DATABASE_ADMIN_URL in the PROCESS env"; exit 5; }
set -a; . ./.env.local; set +a
npm run test:isolated -- "${@:-test/career/mapping-field/ test/career/mapping-spec/}" > "$OUT" 2>&1
echo "VERIFY: runner exit was $? (NOT the verdict — the summary below is)"
parse "$OUT"
