/**
 * GELB · PF-8 IN ITS THREE-TIER FORM — the sweep §74 recorded as owed.
 *
 * §68's sweep covered PF-1 … PF-18 from the restated table at PHASE_F:897 and §72 then found that table
 * is current only as of §17. PF-8 was the pin that sweep could not reach: its row at :682 was superseded
 * entirely at :867 and then amended five more times. §74 recorded it as owed. This is that run.
 *
 * A-G327 is the reason this instrument verifies LOCATIONS before it verifies ARITHMETIC. My §72 list had
 * four locations; PINK found eleven, and the two I had omitted were the admissibility conditions — the
 * clauses that decide whether a tier is EVALUATED at all. An amendment that narrows what counts as a
 * measurement is more dangerous to omit than one that moves a bound.
 *
 * *** AND THE COUNT WAS TAKEN OVER ONE FILE. *** Every location in A-G327's list is in PHASE_F.md. PF-8
 * is amended five more times in PHASE_G.md — A-G32 (:949), A-G42 (:1207), the per-class null currency
 * rule (:1999), §74's retirement of `max ≤ 0.006` (:8726) and the `reduce` vacuity (:8238). A-G327's
 * lesson was "count the locations"; this instrument is the first time the count crossed the file
 * boundary. Rows are tagged with the file they come from for exactly that reason.
 *
 * Every row below quotes an EXACT substring of the committed document and reports UNVERIFIED if the
 * substring is absent or occurs more than once. Same discipline as §64's and §68's sweeps.
 *
 * *** AN INSTRUMENT DEFECT OF MINE, FOUND IN THIS RUN AND KEPT HERE RATHER THAN QUIETLY FIXED ***
 * Block [3]'s first form probed the component with /coherent|amplitude|modulat/ and /\bHz\b|harmonic/ and
 * printed PRESENT on both — directly above my own conclusion that the product contains no such predicate.
 * The hits were: `amplitudePx`, `radiusAmplitude`, `opacityAmplitude` (the breath's OWN amplitude constants,
 * i.e. the source of the signal PF-8 measures, not a cap on it) and two COMMENTS — one of which, at the
 * component's `SEAT_PAD_PX` docstring, quotes PF-8's own tier A readings. **A probe for enforcement found the
 * pin's recorded measurements written in a comment and reported them as enforcement.**
 * GRÜN hit the identical shape the same day (§81: a grep "found" `[data-mapping-halo]` in the CSS and the hit
 * was the literal string inside the comment it had just written). Two lanes, independently, one day.
 * Block [3] now strips comments before probing and PRINTS EVERY MATCH, so no verdict row can stand on a
 * string the instrument cannot show.
 */
import { execFileSync } from "node:child_process";
import { readLines, git as gitBuf } from "./gelb-read.mjs"; // A-G468: the cat read below died of ENOBUFS when §125 pushed PHASE_G past 1 MiB
const DIR = "/home/codi/Entwicklung/condyn-admin-hr-integration/docs/architecture/decision-fields";
const F = `${DIR}/PERSON_X_JOB_MAPPING_PHASE_F.md`, G = `${DIR}/PERSON_X_JOB_MAPPING_PHASE_G.md`;
const read = p => readLines(p); // was execFileSync("cat", …) — no subprocess, so no inherited 1 MiB cap (A-G468)
const SRC = { F: read(F), G: read(G) };
/* A-G468 LIMB 2, found when this gate was revived: the needle below went AMBIGUOUS (x2) because §80
   cites PHASE_G:1999 and — correctly, per A-G427 — QUOTES THE CLAUSE alongside the offset. A-G427's own
   remedy wrote the sentence a second time into the corpus this locator searches, and a locator that
   requires h.length === 1 then reports UNVERIFIED for a clause that is present and cited properly.
   *** THE SIGN IS WRONG AGAIN: UNV reads as "missing or moved" when the cause was the citation discipline
   being FOLLOWED. *** So this classifies instead of counting, per A-G429's first remedy, on exactly the
   assertion/citation line A-G466 drew for sentinels: a table row carrying an offset is a CITATION of the
   clause, not an instance of it. And CITED-ONLY is now a reachable state and a worse one than ABSENT —
   the clause surviving only inside a quotation of itself is A-G450's family. */
const classifyHit = (text) =>
  (/^\s*\|/.test(text) && /`PHASE_[FG]:\d+`|`:\d+`/.test(text)) ? "CITATION" : "ASSERTION";
const locate = (file, needle) => {
  const h = [];
  SRC[file].forEach((l, i) => l.includes(needle) && h.push({ line: i + 1, kind: classifyHit(l) }));
  const asserts = h.filter(x => x.kind === "ASSERTION"), cites = h.filter(x => x.kind === "CITATION");
  return {
    hits: h, asserts, cites,
    ok: asserts.length === 1,
    citedOnly: asserts.length === 0 && cites.length > 0,
    line: asserts.length === 1 ? asserts[0].line : null,
  };
};
const f = (x, n = 5) => Number.isFinite(x) ? x.toFixed(n) : String(x);

console.log("=".repeat(110));
console.log("GELB · PF-8 IN ITS THREE-TIER FORM — A-G128's three limbs over the assembled pin");
console.log("=".repeat(110));

/* ══════════════════════════════════════════════════════════════════════════════════════════════════
   [1] THE AMENDMENT INVENTORY — located, not recalled
   ══════════════════════════════════════════════════════════════════════════════════════════════════ */
const AMEND = [
  ["F", "measured as **p99 of mark pixels ≤ 0.002 and max ≤ 0.006**", "BOUND", "first bound: p99 ≤ 0.002 AND max ≤ 0.006"],
  ["F", "every drawn **sign and structure** pixel swings ≤ 0.002", "SCOPE", "restated over sign AND structure pixels"],
  ["F", "both limbs already red at base from AA alone", "READING", "both limbs red at base from antialiasing alone"],
  ["F", "PF-8 bounds **a sign's own rendered luminance**", "SCOPE", "A-F13: own luminance, NOT contrast against ground"],
  ["F", "PF-8, restated in two tiers**, because one statistic cannot do both jobs", "BOUND", "REPLACED by two tiers: A pooled mean, B per-pixel p99"],
  ["F", "Tier B's bound is stated **against the run's own floor** rather than as an absolute", "BOUND", "tier B floor-relative, ≤ 2× the run's decoy floor"],
  ["F", "tier A's floor rose from 0.00001 to 0.00007", "METHOD", "dof-matched null (3 harmonics vs 3 incommensurate)"],
  ["F", "**PF-8 is now three tiers, all of which must pass.**", "BOUND", "tier C added: population ladder at 4 rungs, ≤ 1.5× null"],
  ["F", "tiers A, B and C are measured PER CLASS", "SCOPE", "per class, each against its OWN bound and OWN null"],
  ["F", "every level that draws evidence", "SCOPE", "every level that draws evidence — L0 AND L2"],
  ["F", "the fringe is unavoidably inside it", "SCOPE", "mask is the FULL seat footprint; fringe is inside it"],
  ["F", "population** — below 1 000 px it is not evaluated", "ADMISSIBILITY", "tier C: class population ≥ 1000 px or NOT EVALUATED"],
  ["F", "**A rung below 2× the measured per-pixel floor is not evaluated**", "ADMISSIBILITY", "tier C: rung ≥ 2× per-pixel floor or NOT EVALUATED"],
  ["F", "**Tier B amended: `p99 ≤ 0.002` absolute**", "BOUND", "tier B → 0.002 ABSOLUTE; floor-relative demoted to admissibility (floor ≤ 0.0004)"],
  ["G", "**Decided: A-G20's hiding instruction is withdrawn.** PF-8 is measured **mask-based**", "METHOD", "A-G32: mask-based, travel DRAWN, travel pixels excluded by own mask"],
  ["G", "**PF-8 is measured with the travel masked** (A-G32's mask-based form, not hidden)", "METHOD", "A-G42: separate pass from PG-11; neither may reuse the other's frames"],
  ["G", "**a shelf alpha change invalidates the per-class nulls**", "CURRENCY", "a shelf alpha change voids every per-class null"],
  ["G", "§74 retired PF-8's `max ≤ 0.006`", "BOUND", "§74: `max ≤ 0.006` RETIRED under A-F11 corrected"],
  ["G", "**PG-11, PG-7, PF-8** go vacuous", "MODE", "under `reduce` PF-8 goes vacuous"],
];
console.log("\n[1] AMENDMENT INVENTORY — located by exact substring\n");
let unver = 0, byFile = { F: 0, G: 0 }, byKind = {};
for (const [file, needle, kind, gloss] of AMEND) {
  const r = locate(file, needle);
  if (!r.ok) unver += 1; else byFile[file] += 1;
  byKind[kind] = (byKind[kind] || 0) + 1;
  const where = r.ok ? `PHASE_${file}:${String(r.line).padStart(4)}`
    : `PHASE_${file}:${r.hits.length === 0 ? "ABSENT" : r.citedOnly ? "CITED-ONLY" : "x" + r.asserts.length}`;
  const tail = r.cites.length ? `  (+${r.cites.length} cited at ${r.cites.map(c => c.line).join(",")})` : "";
  console.log(`  ${r.ok ? "ok  " : r.citedOnly ? "CITE" : "UNV "} ${where}  ${kind.padEnd(14)} ${gloss}${tail}`);
}
console.log(`\n  located ${AMEND.length - unver} of ${AMEND.length}   UNVERIFIED ${unver}`);
console.log(`  by file:  PHASE_F ${byFile.F}   PHASE_G ${byFile.G}`);
console.log(`  by kind:  ${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join("   ")}`);
console.log(`\n  A-G327's corrected list named 11, all in PHASE_F. This inventory finds ${byFile.F} there`);
console.log(`  and ${byFile.G} in PHASE_G. The ${byFile.G} phase-G amendments were in NO list before this run.`);
console.log(`  Of the ${AMEND.length}, ${byKind.ADMISSIBILITY} are ADMISSIBILITY clauses — they decide whether a tier is`);
console.log(`  EVALUATED, not what it must beat. A-G327's reason for counting at all.`);

/* ══════════════════════════════════════════════════════════════════════════════════════════════════
   [2] LIMB 1 — ARITHMETIC SATISFIABILITY, PER TIER
   ══════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log("\n" + "=".repeat(110));
console.log("[2] A-G128 LIMB 1 — does each tier admit BOTH a passing and a failing observation?");
console.log("=".repeat(110));

/* readings quoted from the record, by location */
const R = {
  tierA_bound: 0.0005, tierA_floor_dof: 0.00007, tierA_floor_pre: 0.00001, tierA_base: 0.00014,
  tierB_bound_abs: 0.002, tierB_admiss_floor: 0.0004,
  tierB_floor_26f: 0.00231, tierB_floor_mid: 0.00287, tierB_floor_64f: 0.00027,
  tierB_base_mid: 0.00629, tierB_arcs_64f: 0.0033,
  rungs: [0.001, 0.002, 0.004, 0.008],
  sig: [24210, 18218, 10584, 163], nul: [22586, 8703, 323, 4], printed: [1.07, 2.09, 32.77, Infinity],
  tierC_ratio_bound: 1.5, tierC_min_pop: 1000,
};

console.log("\n  TIER A — pooled mean coherent amplitude ≤ 0.0005 absolute");
const aMargin = R.tierA_bound / R.tierA_floor_dof;
console.log(`    bound ${f(R.tierA_bound)}   dof-matched floor ${f(R.tierA_floor_dof)}   bound/floor = ${f(aMargin, 2)}×`);
console.log(`    base reading ${f(R.tierA_base)} → ${R.tierA_base <= R.tierA_bound ? "PASS" : "FAIL"}; a value above ${f(R.tierA_bound)} is reachable and resolvable`);
console.log(`    LIMB 1: SATISFIABLE — both outcomes lie above the floor`);
console.log(`    A-G139: bound sits ${f(aMargin, 2)}× above the floor it is read against — outside the spread`);

console.log("\n  TIER B — per-pixel p99, two successive forms");
const bOldBound = 2 * R.tierB_floor_64f, bOldRatio = bOldBound / R.tierB_floor_64f;
const bNewRatio = R.tierB_bound_abs / R.tierB_admiss_floor;
console.log(`    OLD (:879, floor-relative ≤ 2× decoy floor), at 64 frames: floor ${f(R.tierB_floor_64f)} → bound ${f(bOldBound)}`);
console.log(`      bound/floor = ${f(bOldRatio, 2)}× BY CONSTRUCTION, at every frame count, forever.`);
console.log(`      A floor-relative bound at 2× the floor can NEVER sit outside the spread of its own floor:`);
console.log(`      a passing observation must lie between the floor and twice the floor — INSIDE the noise band.`);
console.log(`      LIMB 1: formally satisfiable, A-G139: NOT SATISFIED, structurally and permanently.`);
console.log(`    NEW (:1513, p99 ≤ 0.002 absolute, admissible only if floor ≤ ${f(R.tierB_admiss_floor)})`);
console.log(`      worst admissible floor ${f(R.tierB_admiss_floor)} → bound/floor = ${f(bNewRatio, 2)}× at the admissibility edge`);
console.log(`      at the measured 64-frame floor ${f(R.tierB_floor_64f)} → ${f(R.tierB_bound_abs / R.tierB_floor_64f, 2)}×`);
console.log(`      LIMB 1: SATISFIABLE.   A-G139: SATISFIED, and satisfied by the ADMISSIBILITY clause, not the bound.`);
console.log(`    *** A-F29 is what made tier B satisfiable. Not a tightening and not a loosening — it moved the`);
console.log(`    bound off the instrument and onto the physics, and the floor condition is what keeps it honest. ***`);
console.log(`    arcs at 64 frames read ${f(R.tierB_arcs_64f)} against ${f(R.tierB_bound_abs)} → ${R.tierB_arcs_64f <= R.tierB_bound_abs ? "PASS" : "FAIL"} (the one surviving firewall question)`);

console.log("\n  TIER C — population ladder, count ≤ 1.5× null count at each rung");
console.log("    the rung-admissibility clause (:1359) applied to the ladder the record actually printed:\n");
console.log("      rung     signal      null   ratio     printed   2×floor(mid)  admissible?");
const perPixelFloor = R.tierB_floor_mid, admitAt = 2 * perPixelFloor;
let admissible = 0, inadmissibleRed = [];
R.rungs.forEach((rung, i) => {
  const ratio = R.nul[i] === 0 ? Infinity : R.sig[i] / R.nul[i];
  const ok = rung >= admitAt;
  if (ok) admissible += 1; else if (ratio > R.tierC_ratio_bound) inadmissibleRed.push([rung, ratio]);
  console.log(`      ${f(rung, 3)}  ${String(R.sig[i]).padStart(8)}  ${String(R.nul[i]).padStart(8)}  ${f(ratio, 2).padStart(7)}   ${(Number.isFinite(R.printed[i]) ? f(R.printed[i], 2) : "∞").padStart(7)}   ${f(admitAt, 5)}       ${ok ? "YES" : "no — below 2× floor"}`);
});
console.log(`\n    per-pixel floor for that run (:980-era tier B floor) = ${f(perPixelFloor)}, so a rung is evaluated only at ≥ ${f(admitAt)}`);
console.log(`    ADMISSIBLE RUNGS: ${admissible} of ${R.rungs.length}.`);
console.log(`    The record's headline — "red by 32.77× at 0.004", "tier C separates by more than an order of`);
console.log(`    magnitude where tier B separates by 2.2×" — rests on rung ${f(0.004, 3)}, which is INADMISSIBLE`);
console.log(`    under the clause adopted at :1359 three sections later. So are 0.001 and 0.002.`);
console.log(`    Inadmissible rungs that were read as red: ${inadmissibleRed.map(([r, x]) => `${f(r, 3)} (${f(x, 2)}×)`).join(", ")}`);

/* the fourth ratio */
const r4 = R.sig[3] / R.nul[3];
console.log(`\n    AND THE ONE ADMISSIBLE RUNG IS THE ONE WHOSE RATIO IS MISPRINTED.`);
console.log(`      rung ${f(0.008, 3)}:  signal ${R.sig[3]} ÷ null ${R.nul[3]} = ${f(r4, 2)}.   The record prints ∞.`);
console.log(`      ${R.nul[3]} is not zero. The ratio is finite, well-resolved, and ${f(r4 / R.tierC_ratio_bound, 1)}× over the 1.5 bound.`);
console.log(`      This matters because A-F26's erosion guard was written for exactly the ∞ form — "the null counts`);
console.log(`      go to nothing, blowing ratios to ∞". A reader applying that guard to the printed ∞ DISCARDS the`);
console.log(`      only admissible rung in the ladder. The printed form decides which guard reaches the figure.`);
console.log(`\n    VERDICT ON TIER C: still RED, and still the sharpest of the three — ${f(r4, 2)}× against tier B's`);
console.log(`    ${f(R.tierB_base_mid / R.tierB_floor_mid, 2)}×. The CONCLUSION survives; the cited EVIDENCE does not.`);
console.log(`    A-G323's rule applies in the same shape PINK gave it: a figure reached by an inadmissible rung is`);
console.log(`    unsupported, not wrong. Three of four rungs are unsupported; the fourth is misprinted; the verdict holds.`);

/* ══════════════════════════════════════════════════════════════════════════════════════════════════
   [3] LIMB 2 — A-G268 ENFORCEMENT
   ══════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log("\n" + "=".repeat(110));
console.log("[3] A-G128 LIMB 2 — does the product evaluate PF-8's predicate and decline to emit a counterexample?");
console.log("=".repeat(110));
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d", SHA = "4b83414e";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const raw = gitBuf(TREE, "show", `${SHA}:${FILE}`);
/* comments out, so a docstring quoting PF-8's own readings cannot answer for the code */
const code = raw.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/(^|[^:])\/\/[^\n]*/g, "$1 ");
const stripped = raw.split("\n").length;
console.log(`\n  source ${SHA}:${FILE} — ${stripped} lines, probed with comments REMOVED (${raw.length} → ${code.length} chars)\n`);
const probes = [
  ["a tier bound as a literal in code (0.0005 / 0.002 / 1.5× ladder)", /0\.0005|p99|coherent/],
  ["a frequency-domain term in code", /\bfft\b|harmonic|lock-?in|\bHz\b/i],
  ["a clamp on the wave's amplitude keyed to a mark or seat", /(min|max|clamp)[^\n]{0,40}(seat|mark|sign)[^\n]{0,40}(amp|wave|breath)/i],
  ["ANY amplitude identifier in code at all", /amplitude|Amplitude/],
];
for (const [what, re] of probes) {
  const hits = [...code.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))].map(m => m[0]);
  const uniq = [...new Set(hits)];
  console.log(`  ${uniq.length ? "PRESENT" : "ABSENT "}  ${what}`);
  if (uniq.length) console.log(`           matches: ${uniq.slice(0, 6).join(", ")}${uniq.length > 6 ? ` … (${uniq.length})` : ""}`);
}
console.log(`\n  The one PRESENT row is \`radiusAmplitude\` / \`opacityAmplitude\` / \`amplitudePx\` — the breath's own`);
console.log(`  amplitude constants. Those are the SOURCE of the quantity PF-8 bounds, not a bound on it.`);
console.log(`\n  LIMB 2: NOT zero-by-construction, and the reason is sharper than "no code matched".`);
console.log(`  The product's answer to PF-8 is \`SEAT_PAD_PX = 1.6\` — a seat 0.8 px wider than its mark on each`);
console.log(`  side, so the breath shows through only by (1 − coverage). *** THAT IS A MITIGATION, NOT AN`);
console.log(`  ENFORCEMENT. *** A-G268's limb asks whether the product evaluates the pin's predicate and`);
console.log(`  declines to emit a counterexample. A wider seat emits a SMALLER counterexample. It never`);
console.log(`  evaluates anything, which is exactly why arcs still read 0.0033 against a 0.002 bound: the`);
console.log(`  mechanism is antialiasing coverage over a breathing ground (:1218, GRÜN's diagnosis, confirmed`);
console.log(`  from a third direction by PINK's erosion at :1350), and coverage is geometry, not a branch.`);
console.log(`\n  The distinction is worth keeping: of the pins that cleared limb 2 as ZERO-BY-CONSTRUCTION, each had`);
console.log(`  a predicate in the product. PF-8 has a parameter. A parameter cannot return a verdict.`);

/* ══════════════════════════════════════════════════════════════════════════════════════════════════
   [4] LIMB 3 — A-G313 MOTION MODE
   ══════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log("\n" + "=".repeat(110));
console.log("[4] A-G128 LIMB 3 — the motion-mode limb, and it is where PF-8 fails");
console.log("=".repeat(110));
const reduceBlock = /prefers-reduced-motion:\s*reduce/.test(raw);
const killsAll = /\*\s*\{[^}]*animation:\s*none\s*!important/.test(raw.replace(/\n/g, " "));
const hidesTravel = /\.mf-travel\s*\{[^}]*visibility:\s*hidden/.test(raw.replace(/\n/g, " "));
console.log(`\n  accommodation present                      ${reduceBlock ? "yes" : "no"}`);
console.log(`  \`* { animation: none !important }\`          ${killsAll ? "yes — EVERY animation, the ground's breath included" : "no"}`);
console.log(`  \`.mf-travel { visibility: hidden }\`         ${hidesTravel ? "yes" : "no"}`);
console.log(`\n  PF-8's quantity is coherent amplitude AT THE BREATH'S HARMONICS. Under \`reduce\` there is no breath,`);
console.log(`  so signal and null are both identically zero. :8238 records this as "PF-8 goes vacuous". Correct —`);
console.log(`  and incomplete, which is what this limb is for. Run the three tiers at zero:\n`);
const z = 0;
console.log(`    tier A   ${f(z)} ≤ ${f(R.tierA_bound)}                                  → PASS`);
console.log(`    tier B   ${f(z)} ≤ ${f(R.tierB_bound_abs)}   admissibility: floor ${f(z)} ≤ ${f(R.tierB_admiss_floor)}   → PASS, ADMISSIBLE`);
console.log(`    tier C   rung admissibility: rung ≥ 2 × ${f(z)} = ${f(z)}  → ALL FOUR RUNGS ADMISSIBLE`);
console.log(`             counts 0 vs 0 at every rung → ratio 0/0`);
console.log(`\n  *** EVERY ADMISSIBILITY CLAUSE PASSES IN THE ONE MODE WHERE THE MEASUREMENT CANNOT FAIL. ***`);
console.log(`  :1513's floor condition reads "floor ≤ 0.0004" and a floor of zero satisfies it most comfortably`);
console.log(`  of all. :1359's rung condition reads "rung ≥ 2× the floor" and a zero floor admits every rung.`);
console.log(`  Both were written against a floor that was TOO HIGH. Neither has a lower end.`);
console.log(`  So PF-8 under \`reduce\` does not merely go vacuous — it returns GREEN ON THREE TIERS WITH ALL`);
console.log(`  GUARDS SATISFIED. A vacuity that announces itself as a pass is worse than one that errors.`);
console.log(`\n  And A-G42's two-pass rule degenerates in the same mode: PF-8 is travel-MASKED, PG-11 travel-DRAWN,`);
console.log(`  and the two passes "may not reuse the other's frames". Under \`reduce\` \`.mf-travel\` is hidden, so the`);
console.log(`  travel mask is EMPTY and the two configurations are pixel-identical. The rule separating them`);
console.log(`  still reads as satisfied because it is stated over frames, not over configurations.`);
console.log(`\n  LIMB 3: PF-8 is LIVE-ONLY, and nothing in its eighteen amendments says so.`);
console.log(`  PF-9 states the STILL case (:8238's own reference). PF-8 names no mode — the same gap A-G313`);
console.log(`  found in nine pins, and PF-8 is the one with the most guards and the least mode discipline.`);

/* ══════════════════════════════════════════════════════════════════════════════════════════════════
   [5] THE CURRENCY ROW — PHASE_G:1999, checked against the build history
   ══════════════════════════════════════════════════════════════════════════════════════════════════ */
console.log("\n" + "=".repeat(110));
console.log("[5] THE CURRENCY CLAUSE — \"a shelf alpha change invalidates the per-class nulls\"");
console.log("=".repeat(110));
const shelfAt = sha => {
  try {
    const t = gitBuf(TREE, "show", `${sha}:${FILE}`);
    const m = t.match(/RING_LUMINANCE = Object\.freeze\(\{ shelf: ([0-9.]+)/);
    const d = gitBuf(TREE, "log", "-1", "--format=%ad|%s", "--date=short", sha).trim();
    return { shelf: m ? Number(m[1]) : null, date: d.split("|")[0], subj: d.split("|").slice(1).join("|").slice(0, 52) };
  } catch { return null; }
};
const HIST = [["9cc06f84", "the ONLY tier C ladder in the record (§21)"], ["93c47e03", "phase F re-delivery"],
              ["3ec8457d", "phase G PG-20"], ["185427d5", "A-G62"], ["4b83414e", "this sweep's source"],
              ["839623e8", "GRÜN's hooked stand (§82)"]];
console.log("");
let ladderShelf = null, nowShelf = null;
for (const [sha, what] of HIST) {
  const r = shelfAt(sha);
  if (!r) { console.log(`  ${sha}  <not a commit here>  ${what}`); continue; }
  if (sha === "9cc06f84") ladderShelf = r.shelf;
  nowShelf = r.shelf;
  console.log(`  ${sha}  ${r.date}  shelf ${String(r.shelf).padEnd(6)} ${what}`);
}
console.log(`\n  TWO THINGS FALL OUT, AND NEITHER WAS IN ANY LANE'S QUEUE.`);
console.log(`\n  (a) THE DEFERRAL OUTLIVED ITS PRECONDITION. :1999 shelved "the engraved ladder, A-G34 and PF-8`);
console.log(`      per class" pending GRÜN's new \`RING_LUMINANCE.shelf\`, and called it "A-G54's rule applied`);
console.log(`      BEFORE the fact rather than after, the first time in this phase it has been used that way".`);
console.log(`      The change landed at 185427d5 — A-G62, 2026-11-10 — and the deferral was never lifted.`);
console.log(`      *** PF-8 PER CLASS HAS BEEN UNBLOCKED SINCE THEN. *** A precondition stated correctly and`);
console.log(`      then satisfied, with nobody watching for its satisfaction. A-G343's shape in the other`);
console.log(`      direction: there I left a lane working from a statement I had superseded; here a lane is`);
console.log(`      waiting on an event that has already happened.`);
console.log(`\n  (b) THE LADDER IS ON A SUPERSEDED GROUND. §21's tier C ladder — the only one in the record — was`);
console.log(`      measured at 9cc06f84, shelf ${ladderShelf}. The current build is shelf ${nowShelf}, a factor of`);
console.log(`      ${f(ladderShelf / nowShelf, 2)} down. :1205 states the shelf band alone is about HALF of the ~173 k sign pixels, so`);
console.log(`      it is the pool's dominant class, and :1999 says in its own words that this voids the nulls.`);
console.log(`\n  So tier C has no rung that is simultaneously ADMISSIBLE (1 of 4), CORRECTLY PRINTED (the admissible`);
console.log(`  one reads ∞ for ${f(r4, 2)}) and CURRENT (all four predate A-G62 by two shelf changes).`);
console.log(`  The verdict RED is not overturned by any of that — ${f(r4, 2)} would have to fall below 1.5, and the`);
console.log(`  AA-fringe mechanism that produces it is unchanged. It is UNSUPPORTED in A-G323's exact sense,`);
console.log(`  now on three independent grounds instead of one.`);

console.log("\n" + "=".repeat(110));
console.log("SUMMARY");
console.log("=".repeat(110));
console.log(`  amendments located        ${AMEND.length - unver}/${AMEND.length}  (PHASE_F ${byFile.F}, PHASE_G ${byFile.G})`);
console.log(`  limb 1 tier A            SATISFIABLE, A-G139 satisfied at ${f(aMargin, 2)}×`);
console.log(`  limb 1 tier B (old form) A-G139 NOT SATISFIED by construction at ${f(bOldRatio, 1)}× — A-F29 repaired it`);
console.log(`  limb 1 tier B (current)  SATISFIABLE, A-G139 satisfied via the admissibility clause`);
console.log(`  limb 1 tier C            ${admissible}/4 rungs admissible; the headline rung 0.004 is NOT one of them`);
console.log(`  tier C rung 0.008        ratio ${f(r4, 2)}, printed ∞ — finite, and the only admissible rung`);
console.log(`  limb 2                   NOT zero-by-construction`);
console.log(`  currency (a)             PF-8 per class UNBLOCKED since 185427d5 (A-G62) — deferral never lifted`);
console.log(`  currency (b)             the only tier C ladder is at shelf ${ladderShelf} vs the build's ${nowShelf} — nulls void`);
console.log(`  limb 3                   FAILS — green on all three tiers with all guards satisfied under \`reduce\``);
