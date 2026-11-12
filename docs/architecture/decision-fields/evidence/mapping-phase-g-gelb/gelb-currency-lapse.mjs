/**
 * GELB · §131 A-G473's DISCHARGE — WHICH CURRENCY CLAIMS IN THIS RECORD HAVE LAPSED
 *
 * A-G473: a currency claim is itself DATED. "Re-measured on the current build" is a statement about a MOMENT,
 * and writing it in the present tense makes it read live forever. §89 recorded "A-G277 returns to CLOSED,
 * resting on current readings" at 17:58; the component changed at 20:25 and again at 22:13. The sentence was
 * true for 2h27m and has been false since, and nothing in the record marks the expiry.
 *
 * So the rule cannot be left as prose: it indicts the record that states it. This instrument dates every
 * currency claim against the product's own history.
 *
 * METHOD, and it is deliberately the weakest form that can still fail:
 *   1. find each CURRENCY CLAIM in the record by phrase;
 *   2. date it by the commit that INTRODUCED that line (`git log -S`), not by the section it sits in — a
 *      section can be edited long after its claim was written;
 *   3. compare against the last commit touching the PRODUCT at the peer ref;
 *   4. LAPSED if the product moved after the claim was written. CURRENT otherwise.
 *
 * WHAT IT CANNOT DO, stated because A-G465 is this lane's rule: it cannot tell whether a lapsed claim is
 * WRONG. A reading can survive a product change that does not touch its quantity — §129 measured exactly
 * that, with 5 of 9 instruments' findings stable across +166/-29. *** SO "LAPSED" MEANS "NO LONGER CARRIES
 * ITS OWN WARRANT", NOT "FALSE". *** It is over-inclusive by construction and that is the only honest
 * direction for it: a claim whose warrant has expired needs re-measurement to say anything at all.
 *
 * AND IT DOES NOT ANNOUNCE A VERDICT ON ANY PIN. A-G36 point 2 reserves obligation verdicts to PINK.
 */
import { REPO_ROOT, PHASE_G, PHASE_F, peerRef } from "./gelb-paths.mjs";
import { readLines, git } from "./gelb-read.mjs";

const PRODUCT = "app/components/career/demo/PersonJobMappingField.tsx";
const PEER = peerRef(REPO_ROOT);

/* phrases that ASSERT a reading is current. Over-inclusive by design (A-G429 remedy 1: classify, never
   filter) — every hit is printed with its line so no row stands on something unshown. */
const CLAIMS = [
  "resting on current readings", "on current readings", "re-measured on the shipping build",
  "on the build that ships", "byte-identical to HEAD", "re-ran all three cells",
  "RE-MEASURED ON THE SHIPPING BUILD", "SUSPENSION LIFTED", "returns to CLOSED",
  "closed again", "CLOSED AGAIN", "verified on a rendered page", "on the current build",
];

const lastProductChange = () => {
  const out = git(REPO_ROOT, "log", "-1", "--format=%H %ct %ad %s", "--date=format:%m-%d %H:%M",
    `${PEER.sha}`, "--", PRODUCT).trim();
  const [sha, ct, ...rest] = out.split(" ");
  return { sha: sha.slice(0, 8), ct: Number(ct), label: rest.join(" ").slice(0, 60) };
};

/** the commit that INTRODUCED this exact line into this file */
const introducedBy = (file, line) => {
  const needle = line.trim();
  if (needle.length < 24) return null;
  try {
    const out = git(REPO_ROOT, "log", "--format=%H %ct %ad", "--date=format:%m-%d %H:%M",
      "-S", needle, "--pickaxe-all", "--", file).trim();
    if (!out) return null;
    const rows = out.split("\n").filter(Boolean);
    const [sha, ct, ...d] = rows[rows.length - 1].split(" ");   // the OLDEST = the introducing commit
    return { sha: sha.slice(0, 8), ct: Number(ct), date: d.join(" ") };
  } catch { return null; }
};

/* A-G468 LIMB 2 / A-G466, AND THE FIRST FORM OF THIS INSTRUMENT HAD THE DEFECT IT WAS BUILT TO RULE ON.
   It reported 12 claims, 8 LAPSED and 4 CURRENT — and all four "CURRENT" rows were §129/§130's own text
   QUOTING the lapsed claims in order to rule against them. *** A SCAN THAT COUNTS THE SENTENCE RULING
   AGAINST A CLAIM AS AN INSTANCE OF THE CLAIM HAS MEASURED ITS OWN PROSE. *** A-G450's family, in the
   instrument discharging A-G473, four sections after A-G468 limb 2 named the shape.
   The discriminator is mechanical: a claim phrase wrapped in QUOTATION MARKS is being quoted; a claim in a
   TABLE ROW beside an offset or SHA is being cited. Neither asserts currency. */
/* AND THE FIRST FORM OF *THIS* DISCRIMINATOR WAS TOO LOCAL. It tested for a quote mark ADJACENT to the
   phrase and missed §130's own line, where the claim sits INSIDE a quoted span that opens earlier:
     > *"So limb (a) holds on the build that ships and **A-G277 returns to CLOSED, resting on current readings**."*
   The phrase's neighbours there are ", " and "**.", so adjacency sees nothing. *** A QUOTATION IS A SPAN, NOT
   A PAIR OF NEIGHBOURING CHARACTERS *** — so the spans are computed and the claim's offset tested for
   containment. Third correction in this instrument, all three the same family: an assertion and a quotation
   of it are different things, and every cheap test for the difference has been wrong. */
const quotedSpans = (line) => {
  const spans = []; const re = /["\u201C]([^"\u201D]{3,})["\u201D]/g; let m;
  while ((m = re.exec(line)) !== null) spans.push([m.index, m.index + m[0].length]);
  return spans;
};
const QUOTED = (line, phrase) => {
  const i = line.indexOf(phrase);
  if (i < 0) return false;
  if (/^\s*\|/.test(line)) return true;
  return quotedSpans(line).some(([a, b]) => i >= a && i + phrase.length <= b);
};

const P = lastProductChange();
const bar = "=".repeat(108);
console.log(bar);
console.log("GELB · §131 A-G473 — CURRENCY CLAIMS, DATED AGAINST THE PRODUCT'S OWN HISTORY");
console.log(bar);
console.log(`\n  product            ${PRODUCT}`);
console.log(`  peer ref           ${PEER.ref} -> ${PEER.sha}`);
console.log(`  last product move  ${P.sha}  ${P.label}`);
console.log(`\n  A claim written BEFORE ${P.sha} no longer carries its own warrant. That is not the same as being`);
console.log(`  wrong — §129 measured 5 of 9 instruments' findings stable across +166/-29 on this file.`);

const rel = (f) => f.replace(`${REPO_ROOT}/`, "");
const rows = [], quoted = [];
for (const file of [PHASE_G, PHASE_F]) {
  const lines = readLines(file);
  lines.forEach((l, i) => {
    const hit = CLAIMS.find((c) => l.includes(c));
    if (!hit) return;
    if (QUOTED(l, hit)) { quoted.push({ file: rel(file), ln: i + 1, phrase: hit }); return; }
    const intro = introducedBy(rel(file), l);
    rows.push({ file: rel(file).split("/").pop().replace("PERSON_X_JOB_MAPPING_", ""), ln: i + 1, phrase: hit, intro, text: l.trim() });
  });
}

let lapsed = 0, current = 0, undatable = 0;
console.log(`\n${bar}\n[1] EVERY CURRENCY CLAIM, WITH ITS DATE AND ITS STATE\n${bar}\n`);
for (const r of rows) {
  let state;
  if (!r.intro) { state = "UNDATABLE "; undatable++; }
  else if (r.intro.ct < P.ct) { state = "*** LAPSED"; lapsed++; }
  else { state = "CURRENT   "; current++; }
  console.log(`  ${state}  ${r.file}:${String(r.ln).padStart(5)}  ${r.intro ? `${r.intro.sha} ${r.intro.date}` : "  — not locatable  "}  "${r.phrase}"`);
  console.log(`              ${r.text.slice(0, 96)}`);
}

console.log(`\n${bar}\n[2] WHAT THIS BOUNDS\n${bar}\n`);
console.log(`  currency claims ASSERTED:  ${rows.length}`);
console.log(`  quotations of a claim, excluded and counted: ${quoted.length}  <- §129/§130 ruling against them`);
console.log(`    LAPSED — written before the product's last move:  ${lapsed}`);
console.log(`    CURRENT:                                          ${current}`);
console.log(`    UNDATABLE by this method:                         ${undatable}`);
console.log(`\n  *** ${lapsed} OF ${rows.length} CURRENCY CLAIMS IN THIS RECORD NO LONGER CARRY THEIR OWN WARRANT. ***`);
console.log(`  Every one is written in the PRESENT TENSE and none carries an expiry. That is A-G473, and the`);
console.log(`  record that rules it is the record it indicts.`);
console.log(`\n  AND THE LIMIT, STATED RATHER THAN IMPLIED: this says nothing about whether any lapsed claim is`);
console.log(`  FALSE. It says the claim's warrant is older than the thing it claims about. A re-measurement is`);
console.log(`  the only thing that can move a row out of LAPSED, and re-sealing is a deliberate act on a`);
console.log(`  deliberate build — so these rows are OWED, not silently repairable.`);
console.log(`\n  NO PIN VERDICT IS ANNOUNCED HERE. A-G36 point 2 reserves those to PINK.`);
console.log(bar);

/* ───────────── A-G452: prove each state can fire, on synthetic lines, printing every outcome ───────────── */
console.log(`\n${bar}\n[3] MUTANTS — each classification proven reachable (A-G452)\n${bar}\n`);
{
  const cases = [
    ["an asserted claim",            "So **A-G277 returns to CLOSED**, resting on current readings.", false],
    ["the same claim QUOTED",        'the note said *"resting on current readings"* and that is the defect',  true],
    ["the same claim in a TABLE ROW", '| `7910845b` | §86 · verified on a rendered page | inside the 90 |',   true],
    ["QUOTED, span opens earlier",   '> *"So limb (a) holds on the build that ships and A-G277 returns to CLOSED, resting on current readings."*', true],
    ["ASSERTED in italics not quotes", "*re-ran all three cells; the product is byte-identical to HEAD now.*", false],
    ["a line with no claim at all",  "PG-14's two passes do not converge at 420 px.",                        null],
  ];
  let pass = 0, fail = 0;
  for (const [name, line, expectQuoted] of cases) {
    const hit = CLAIMS.find((c) => line.includes(c));
    const got = hit ? QUOTED(line, hit) : null;
    const ok = got === expectQuoted;
    console.log(`  ${ok ? "✓" : "✗"} ${name.padEnd(32)} hit=${hit ? `"${hit}"` : "none"} -> ${got === null ? "NOT A CLAIM" : got ? "QUOTED" : "ASSERTED"}`);
    ok ? pass++ : fail++;
  }
  console.log(`\n  mutants: ${pass} pass, ${fail} fail. The LAST is the no-signal direction and the one before it is the\n  negative control: without a line that must classify as ASSERTED, a scan reporting 0 CURRENT would be\n  unaudited in exactly the direction A-G452 names.`);
  if (fail) process.exitCode = 1;
}

/* fail-closed: a record whose currency claims have lapsed must not report exit 0 */
if (lapsed > 0) process.exitCode = 1;
