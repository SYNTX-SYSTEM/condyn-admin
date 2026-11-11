#!/usr/bin/env node
// GELB · A-G453 (PINK's) — A FORWARD POINTER IS A GUARD AND NEEDS A VACUITY CHECK.
// The §7 pointer exists only to stop a lane reading a stale pin. Nothing in it could report
// that it was incomplete. This instrument reports that.
//
// DESIGN COMMITMENTS, each forced by a named amendment:
//   A-G429(1) CLASSIFY, never filter — every candidate is printed with its sentence.
//   A-G408    EXCLUDE THE INSTRUMENT'S OWN SUBJECT — the pointer region is cut before scanning.
//   A-G450    grep cannot tell a retirement from its obituary. So this check is deliberately
//             OVER-INCLUSIVE: any pin in any retirement sentence is DEMANDED of the pointer.
//             A false positive costs one pointer line; a false negative costs a lane a round.
//   A-G396    no bare numeral in a narrative line; every figure below is interpolated.
//   A-G452    a vacuity guard, and it is the no-signal mutant: on a corpus with no retirement
//             sentence the detector must find nothing, which is asserted at the end.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(HERE, "../..");
const DOC = {
  PHASE_F: "PERSON_X_JOB_MAPPING_PHASE_F.md",
  PHASE_G: "PERSON_X_JOB_MAPPING_PHASE_G.md",
};
const text = Object.fromEntries(
  Object.entries(DOC).map(([k, f]) => [k, readFileSync(resolve(DOCS, f), "utf8")])
);

const fail = (m) => { console.error(`\nREFUSED: ${m}\n`); process.exit(1); };

// ---- the pointer region, located by its own heading, never by a line number -----------------
const POINTER_HEAD = "⚠ FORWARD POINTER — THESE ARE THE ORIGINALS";
const fLines = text.PHASE_F.split("\n");
const pStart = fLines.findIndex((l) => l.includes(POINTER_HEAD));
if (pStart < 0) fail(`pointer heading not found: ${POINTER_HEAD}`);
let pEnd = pStart + 1;
while (pEnd < fLines.length && (fLines[pEnd].startsWith(">") || fLines[pEnd].trim() === "")) {
  if (fLines[pEnd].trim() === "" && !fLines[pEnd + 1]?.startsWith(">")) break;
  pEnd++;
}
const pointerText = fLines.slice(pStart, pEnd).join("\n");

const PIN = /\b(P[FG])-(\d{1,2})\b/g;
const pins = (s) => {
  const out = new Set();
  for (const m of s.matchAll(PIN)) out.add(`${m[1]}-${m[2]}`);
  // compound forms the record really uses: "PF-5/7/10", "PG-1/PG-2"
  for (const m of s.matchAll(/\b(P[FG])-(\d{1,2})((?:\/(?:P[FG]-)?\d{1,2})+)/g)) {
    for (const n of m[3].split("/").filter(Boolean)) out.add(`${m[1]}-${n.replace(/P[FG]-/, "")}`);
  }
  return out;
};

const pointerPins = pins(pointerText);

// ---- retirement sentences, over the record with the pointer cut out --------------------------
const DEATH = /\b(retired|retires|retire|RETIRED|killed|superseded|struck|withdrawn|replaced by|replaces)\b/;
const LIMBISH = /\b(limb|ratio limb|cap|row \d|clause|wording|statistic|form)\b/i;

const corpus = [
  ["PHASE_F", text.PHASE_F.replace(pointerText, "")],
  ["PHASE_G", text.PHASE_G],
];

const found = new Map(); // pin -> [{doc,line,kind,sentence}]
for (const [doc, body] of corpus) {
  body.split("\n").forEach((line, i) => {
    for (const sent of line.split(/(?<=[.;:!?])\s+/)) {
      if (!DEATH.test(sent)) continue;
      const kind = LIMBISH.test(sent) ? "LIMB" : "WHOLE";
      for (const p of pins(sent)) {
        if (!found.has(p)) found.set(p, []);
        found.get(p).push({ doc, line: i + 1, kind, sentence: sent.trim() });
      }
    }
  });
}

const wholeDeath = [...found.entries()]
  .filter(([, hits]) => hits.some((h) => h.kind === "WHOLE"))
  .map(([p]) => p)
  .sort((a, b) => a.localeCompare(b, "en", { numeric: true }));

// ---- A-G417/A-G437: THE POINTER HAS A DOMAIN, AND A GAP IS ONLY A GAP INSIDE IT -------------
// The §7 pointer sits in PHASE_F and governs the PF originals. A PG pin's retirement is not a
// hole in it; it is a hole somewhere else, and the first form of this instrument conflated the
// two and reported one number over both. That is the error this lane has ruled on all phase.
const FAMILY = (p) => p.slice(0, 2);
const pfDeath = wholeDeath.filter((p) => FAMILY(p) === "PF");
const pgDeath = wholeDeath.filter((p) => FAMILY(p) === "PG");
const pfMissing = pfDeath.filter((p) => !pointerPins.has(p));

// Does PHASE_G carry a pointer of its own? Asked rather than assumed.
const gLines = text.PHASE_G.split("\n");
const gPointer = gLines
  .map((l, i) => ({ line: i + 1, l }))
  .filter((x) => /FORWARD POINTER|THESE ARE THE ORIGINALS/.test(x.l))
  // §116 discusses the PHASE_F pointer; a discussion is not a pointer (A-G450 again)
  .filter((x) => !/§116|PHASE_F|§7's/.test(x.l));

// if PHASE_G now carries a pointer, score it the same way the PF one is scored
let gPointerPins = new Set();
let gStart = -1, gEnd = -1;
if (gPointer.length > 0) {
  gStart = gPointer[0].line - 1;
  gEnd = gStart + 1;
  while (gEnd < gLines.length && (gLines[gEnd].startsWith(">") || gLines[gEnd].trim() === "")) {
    if (gLines[gEnd].trim() === "" && !gLines[gEnd + 1]?.startsWith(">")) break;
    gEnd++;
  }
  gPointerPins = pins(gLines.slice(gStart, gEnd).join("\n"));
}
const pgMissing = pgDeath.filter((p) => !gPointerPins.has(p));

// ---- VACUITY GUARD (A-G452), both limbs ------------------------------------------------------
const sham = "PG-19 is a pin about marks and local ground. PF-13 counts tests.";
let shamHits = 0;
for (const sent of sham.split(/(?<=[.;:!?])\s+/)) if (DEATH.test(sent)) shamHits += pins(sent).size;
if (shamHits !== 0) fail(`vacuity guard: detector fired ${shamHits} times on a corpus with no retirement`);
for (const must of ["PF-3", "PF-5", "PF-7", "PF-10"]) {
  if (!wholeDeath.includes(must)) fail(`vacuity guard: known A-G20 retirement ${must} not detected`);
}

const bar = "=".repeat(104);
const show = (ps) => ps.join(" ") || "none";
console.log(`${bar}\nGELB · A-G453 (PINK's) — IS A FORWARD POINTER COMPLETE? ONE PER DOMAIN.\n${bar}`);
console.log(`
  the pointer is located by its HEADING, never by a line number, and runs ${pEnd - pStart} lines.
  pins it names:  ${show([...pointerPins].sort((a, b) => a.localeCompare(b, "en", { numeric: true })))}

  pins in a whole-pin death sentence:  ${wholeDeath.length}   (PF ${pfDeath.length}, PG ${pgDeath.length})
`);
console.log(`${bar}\n[1] DOMAIN PF — the §7 pointer's own population, which is the only place it can be wrong\n${bar}\n`);
for (const p of pfDeath) {
  const h = found.get(p).filter((x) => x.kind === "WHOLE")[0];
  console.log(`  ${pointerPins.has(p) ? "IN POINTER    " : "*** ABSENT ***"}  ${p.padEnd(6)} ${h.doc}:${h.line}`);
  console.log(`                  "${h.sentence.replace(/\*+/g, "").slice(0, 132)}"`);
}
console.log(`
  *** ${pfMissing.length} PF PIN(S) ABSENT FROM THE POINTER THAT GOVERNS THEM: ${show(pfMissing)} ***
  A-G20's four are present as of 265ac7f1. Each remaining name is a CANDIDATE and the sentence is
  printed because reading settles it: PF-4's hit is a sentence about a STALE CITATION of PF-4's
  text, not about PF-4's retirement, and PF-4 is live. *** THAT IS THE OVER-INCLUSION WORKING AS
  DESIGNED, AND IT IS WHY THIS PRINTS SENTENCES INSTEAD OF A VERDICT. ***
`);
console.log(`${bar}\n[2] DOMAIN PG — PHASE_G's own pointer, which did not exist until A-G453\n${bar}\n`);
console.log(`  pins whose death PHASE_G discusses:   ${pgDeath.length}\n    ${show(pgDeath)}\n`);
console.log(`  forward pointers found in PHASE_G:    ${gPointer.length}`);
if (gPointer.length === 0) {
  console.log(`
  *** PHASE_G CARRIES NO FORWARD POINTER, AND IT IS THE DOCUMENT HOLDING THE LIVE PINS. ***
  The superseded document has a staleness note at its originals; the current one has none.
`);
} else {
  console.log(`  it runs ${gEnd - gStart} lines from PHASE_G:${gStart + 1} and names ${gPointerPins.size} pins.`);
  console.log(`
  *** ${pgMissing.length} PG PIN(S) ABSENT FROM THE POINTER THAT GOVERNS THEM: ${show(pgMissing)} ***
  THE FINDING THAT BUILT THIS POINTER STANDS WHATEVER THIS NUMBER IS: until A-G453 ran, the
  document holding the LIVE pins carried no staleness note while the SUPERSEDED one did. *** THE
  POINTER HAD BEEN WRITTEN WHERE THE STALENESS WAS FIRST NOTICED, NOT WHERE A READER ARRIVES. ***
  A reader landing on §8 by search now learns that PG-19 was killed before formation, that PG-12
  and PG-18 are unsatisfiable, and that PG-13's retirement is a LIMB and not the pin.
`);
}
// ---- FAIL-CLOSED (A-G374 limb 2: reading the artifact must change what the tool DOES) --------
// Both domains are clean as of §116, so this instrument stops reporting and starts refusing.
// A pointer that merely PRINTS its own gap is the defect A-G453 names, one level up.
const gaps = [
  ...pfMissing.map((p) => `PF domain: ${p} absent from the §7 pointer`),
  ...(gPointer.length === 0
    ? ["PG domain: PHASE_G carries NO forward pointer at all"]
    : pgMissing.map((p) => `PG domain: ${p} absent from PHASE_G's §8 pointer`)),
];
if (gaps.length > 0) {
  console.error(`\n${bar}\nREFUSED — ${gaps.length} POINTER GAP(S). A reader landing by search would be told nothing.\n${bar}`);
  for (const g of gaps) console.error(`  ${g}`);
  console.error(`\n  Answer each in the pointer it belongs to — one line, even for a false positive.\n${bar}`);
  process.exit(1);
}
console.log(`${bar}\n  *** BOTH POINTERS ARE COMPLETE ON THIS CHECK'S CRITERION, SO THIS INSTRUMENT NOW REFUSES
  RATHER THAN REPORTS: any pin whose death enters the record without reaching its pointer exits 1. ***
`);
console.log(`${bar}\n[3] WHAT THIS CHECK IS, AND WHAT IT IS NOT\n${bar}
  OVER-INCLUSIVE BY CONSTRUCTION. A sentence that CITES a retirement is indistinguishable by any
  pattern from one that MAKES it — A-G450, in prose. So every pin whose death is discussed is
  demanded of its pointer. *** A FALSE POSITIVE COSTS ONE LINE IN A POINTER; A FALSE NEGATIVE COSTS
  A LANE A MEASUREMENT ROUND, WHICH IS WHAT HAPPENED. ***

  NOT A COUNT OF RETIREMENTS. ${wholeDeath.length} pins appear in a whole-pin death sentence; which were
  retired, superseded, struck or killed before formation is settled only by reading, and the
  sentences are printed for that.

  NOT A CHECK ON THE POINTER'S TEXT. An entry naming a pin and describing its death wrongly passes.
  AND THE FIRST FORM OF THIS INSTRUMENT REPORTED ONE NUMBER OVER BOTH DOMAINS — 11 "absent" — which
  mixed PG pins into a PF pointer's score. *** A-G417's population error, in the instrument written
  to catch A-G453's. The gap is scoped per domain above because a pointer can only be incomplete
  about the pins it governs. ***
${bar}`);
