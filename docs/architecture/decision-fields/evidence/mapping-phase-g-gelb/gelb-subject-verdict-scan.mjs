#!/usr/bin/env node
// GELB · A-G460 (GRÜN's) — A GUARD AT THE RADIUS NOBODY GUARDED.
//
// A-G460: a rule scoped to the artifact does not bind the sentence about it. GRÜN held three
// guards at the innermost radius (banner, verdict field, bound-naming convention), all honoured;
// §119 found the middle radius unguarded (a summary generalising past its own pinStanding block);
// A-G458 found the outer one (a relay stripping the verdict field). *** THE COMMIT SUBJECT IS THE
// ONLY RADIUS THAT CANNOT BE CORRECTED IN PLACE, AND IT IS THE ONE NO LANE HAD A GUARD FOR. ***
//
// This is that guard. It cannot be a hook — installing one is the user's config decision, not a
// lane's — so it is a fail-closed instrument, run against a range on demand.
//
// A-G450 governs the design: grep cannot tell a standing from a verdict. So this CLASSIFIES and
// refuses only the class it can defend, and prints every subject it touched (A-G429 remedy 1).
import { execFileSync } from "node:child_process";

const RANGE = process.argv[2] ?? "origin/main..HEAD";
const ROOT = new URL("../../../../..", import.meta.url).pathname;
const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" });

const subjects = git("log", "--format=%h%x00%s", RANGE).split("\n").filter(Boolean)
  .map((l) => { const [sha, s] = l.split("\0"); return { sha, s }; });

// A satisfaction word asserts that an obligation is MET. A standing word asserts what an
// obligation IS. This lane may rule standings (A-G20, §36, A-G164); it may not rule satisfaction,
// which A-G36 point 2 reserves to PINK.
// "fail-closed" is not a verdict, and \bclosed\b matches inside it — the detector's own first
// form flagged two subjects on that and on "two passes" (a noun). A-G429: audit the alarming
// number BECAUSE it is alarming. Both inflations are removed where mechanical, printed where not.
const SATISFIED = /\b(green|satisfied|holds?|passes|passed|clean|closed|met|proven|confirmed)\b/i;
const NOT_VERDICT = /fail-closed|zero-by-construction|cannot fail|two passes|closed loop/i;
const STANDING  = /\b(retired|malformed|unsatisfiable|withdrawn|un-?begun|superseded|struck|killed|unasserted|moot|suspended)\b/i;
const BANNER    = /\b(green|ok|pass(es|ed)?)\b/i;   // GRÜN's outputs/ banner words
const PIN       = /\b(P[FG])-(\d{1,2})\b/;

const rows = subjects.map((r) => {
  const pin = PIN.exec(r.s)?.[0] ?? null;
  const sat = SATISFIED.test(r.s) && !NOT_VERDICT.test(r.s);
  const std = STANDING.test(r.s);
  const ban = BANNER.test(r.s);
  let cls;
  if (pin && sat && !std) cls = "PIN-VERDICT";        // refuse: a pin's satisfaction
  else if (pin && std) cls = "STANDING";              // allowed: what the pin IS
  else if (ban) cls = "BANNER-WORD";                   // flag: the forbidden word, no pin
  else if (sat) cls = "SATISFACTION-NO-PIN";           // flag: a claim with no named subject
  else cls = "CLEAN";
  return { ...r, pin, cls };
});

const by = (c) => rows.filter((r) => r.cls === c);

// ---- VACUITY GUARD, both limbs (A-G452) ------------------------------------------------------
const probe = (s) => {
  const pin = PIN.exec(s)?.[0] ?? null;
  const sv = SATISFIED.test(s) && !NOT_VERDICT.test(s);
  if (pin && sv && !STANDING.test(s)) return "PIN-VERDICT";
  if (pin && STANDING.test(s)) return "STANDING";
  if (BANNER.test(s)) return "BANNER-WORD";
  if (sv) return "SATISFACTION-NO-PIN";
  return "CLEAN";
};
const must = [
  ["PF-13 green on all 15 files", "PIN-VERDICT"],       // GRÜN's real defect
  ["the full suite is green on the restored B-ENTRY", "BANNER-WORD"], // mine
  ["A-G320 at three pins' own locations — PF-1 retired, PF-15 malformed", "STANDING"],
  // my own expectation was wrong here, not the code: "clean" is a satisfaction word, not one of
  // the banner's three. The guard's second limb caught its author before the instrument ran.
  ["a mask of nothing reads as a clean exclusion", "SATISFACTION-NO-PIN"],
  ["evidence(career): the suite is green", "BANNER-WORD"],
  ["phase G §116 — the live pins had no forward pointer", "CLEAN"],
];
for (const [s, want] of must) {
  const got = probe(s);
  if (got !== want) { console.error(`REFUSED: vacuity guard — ${JSON.stringify(s)} classified ${got}, expected ${want}`); process.exit(1); }
}

const bar = "=".repeat(104);
console.log(`${bar}\nGELB · A-G460 (GRÜN's) — COMMIT SUBJECTS: THE RADIUS THAT CANNOT BE CORRECTED IN PLACE\n${bar}`);
console.log(`
  range: ${RANGE}        subjects scanned: ${rows.length}

  PIN-VERDICT           ${by("PIN-VERDICT").length}   <- a pin's SATISFACTION. A-G36 point 2 reserves it to PINK. REFUSED.
  STANDING              ${by("STANDING").length}   <- what a pin IS. This lane may rule these.
  BANNER-WORD           ${by("BANNER-WORD").length}   <- GRÜN's outputs/ banner forbids these words; no pin named.
  SATISFACTION-NO-PIN   ${by("SATISFACTION-NO-PIN").length}   <- asserts something is met, names no pin.
  CLEAN                 ${by("CLEAN").length}
`);
for (const c of ["PIN-VERDICT", "BANNER-WORD", "SATISFACTION-NO-PIN", "STANDING"]) {
  const g = by(c);
  if (g.length === 0) continue;
  console.log(`${bar}\n[${c}] ${g.length}\n${bar}`);
  for (const r of g.slice(0, 14)) console.log(`  ${r.sha}  ${r.pin ?? "   —  "}  ${r.s.slice(0, 118)}`);
  if (g.length > 14) console.log(`  … and ${g.length - 14} more`);
}
console.log(`
${bar}
  WHAT THIS GUARD IS, AND WHAT IT IS NOT

  *** IT CANNOT BE A HOOK. Installing one is the user's configuration decision, not a lane's, so
  this runs on demand and refuses — which means it guards the radius only when someone runs it. ***
  That is a weaker guard than the three at the inner radius and it is stated as weaker.

  THE CLASSES IT CANNOT SEPARATE: "PG-15's absence closed" is GRÜN's own work and legitimate, but
  the POSSESSIVE is what makes it legitimate — drop it and the subject reads as a pin verdict.
  *** A SUBJECT LINE THAT SURVIVES ONLY BECAUSE OF ONE POSSESSIVE IS BEYOND THIS INSTRUMENT, AND
  GRÜN SAID IT FIRST: not a subject line it would write again. *** So STANDING is printed, never
  trusted silently.

  AND A SATISFACTION WORD CAN BE TRUE AND STILL TOO STRONG. GRÜN's "A-G43 implemented and PROVEN"
  is a true claim about a mutant binding, verified by reverting the predicate. *** THE GAP BETWEEN
  A TRUE CLAIM AND ITS WORDING IS THE WHOLE OF A-G460, AND NO SCAN MEASURES IT. ***
${bar}`);

if (by("PIN-VERDICT").length > 0) {
  console.error(`\nREFUSED — ${by("PIN-VERDICT").length} commit subject(s) assert a pin's satisfaction.`);
  for (const r of by("PIN-VERDICT")) console.error(`  ${r.sha}  ${r.pin}  ${r.s}`);
  console.error(`\n  A subject cannot be corrected in place. The correction goes where a reader lands.\n`);
  process.exit(1);
}
