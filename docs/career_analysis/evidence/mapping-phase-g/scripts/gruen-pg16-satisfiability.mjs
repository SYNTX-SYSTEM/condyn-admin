/**
 * GRÜN · PHASE-G · §62 — A-G128 (satisfiability) applied to PG-16 AT THE BOUND THE RECORD DERIVED, 0.3.
 * **NO VERDICT** (A-G36 point 2). Arithmetic on committed constants only: no render, no server, no gate,
 * no sealed datum, nothing written outside this one output file.
 *
 * GELB asked, before restoring PG-16's bound to 0.3: "can a layout in the exercised set pass the pin AND can
 * one fail it?" That is the right question and the answer is not a yes/no, so this probe splits it into the
 * four limbs the question actually has. Limb A is structural and decides the rest.
 *
 *   A  THE PREDICATE LIMB.  PG-16 reads, in PHASE_G §11 and in the product's own doc comment, "every drawn
 *      pair keeps free rim-to-rim space of CROWDING x the eccentricity of the more peripheral body".
 *      `spaced()` at PersonJobMappingField.tsx:479 evaluates THAT EXPRESSION and does not push the body:
 *        sep - r_o - r_b >= CROWDING * max(ecc_o, ecc_b)
 *      The pin's predicate and the filter's predicate are the same expression over the same operands, so the
 *      drawn set satisfies the pin by construction. This is the zero-by-construction class, and it does not
 *      depend on the constant's value: the pin is equally unfalsifiable at 0.3, at 0.5 and at 0.0.
 *
 *   B  THE ACTIVITY LIMB.  Does the spacing DO anything at 0.3, or does the budget cut first? A constraint
 *      that never removes a body is vacuous on that layout even before falsifiability is raised.
 *
 *   C  THE MEASURABILITY LIMB (this is the one that bears on restoring the bound).  A bound is measurable
 *      only where moving it moves something. For each layout this computes the EXACT interval of crowding
 *      values over which the drawn set is identical to the drawn set at 0.3, from the pairwise thresholds
 *      t = sep / maxEcc, which are the only values at which any constraint can flip. If 0.3 sits in the
 *      interior of a wide interval, no measurement of the rendered field can tell 0.3 from its neighbours.
 *
 *   D  THE MAXIMALITY LIMB.  `spaced()` is greedy in rank order. Greedy is not maximum. This compares the
 *      greedy count against the exact maximum independent set of the crowding-conflict graph, which is what
 *      the phrase "spacing-only capacity" actually names. If they differ, then the earlier reading of mine
 *      in outputs/pg16-crowding-at-0.5.json labelled a GREEDY count as a CAPACITY, and the drawn count is a
 *      function of the rank order as well as of the constant.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");
const vectors = JSON.parse(readFileSync(resolve(ROOT, "docs/architecture/decision-fields/mapping-spec/layout-golden-vectors-v1.1.json"), "utf8"));
const src = readFileSync(resolve(ROOT, "app/components/career/demo/PersonJobMappingField.tsx"), "utf8");

const BUDGET_L0 = 7, BOUND = 0.3;

/* fail loud if the product constant or the rule moved under this derivation */
const mConst = /export const CROWDING = ([\d.]+);/.exec(src);
if (!mConst) throw new Error("CROWDING declaration not found — the derivation's subject moved");
if (Number(mConst[1]) !== BOUND) throw new Error(`CROWDING is ${mConst[1]}, this derivation is written for ${BOUND}`);
if (!src.includes("const clear = out.every(o => Math.hypot(o.x - b.x, o.y - b.y) - o.drawnRadius - b.drawnRadius >= CROWDING * Math.max(Math.hypot(o.x, o.y), Math.hypot(b.x, b.y)));"))
  throw new Error("spaced()'s clearance expression moved — limb A's identity claim must be re-read against the new one");

const ecc = b => Math.hypot(b.x, b.y);
const sep = (o, b) => Math.hypot(o.x - b.x, o.y - b.y) - o.drawnRadius - b.drawnRadius;
/** the committed rule, verbatim in behaviour; `trace` records WHY each body was not drawn */
function spaced(byRank, budget, c, trace) {
  const out = [];
  for (const b of byRank) {
    if (out.length >= budget) { if (trace) trace.push({ rank: b.rank, why: "BUDGET" }); continue; }
    const blocker = out.find(o => !(sep(o, b) >= c * Math.max(ecc(o), ecc(b))));
    if (blocker === undefined) out.push(b); else if (trace) trace.push({ rank: b.rank, why: "CROWDING", blockedBy: blocker.rank });
  }
  return out;
}
/** exact maximum independent set of the conflict graph; exhaustive flag is honest about the node cap */
function maxIndependentSet(bodies, c) {
  const n = bodies.length, adj = Array.from({ length: n }, () => new Set());
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1)
    if (!(sep(bodies[i], bodies[j]) >= c * Math.max(ecc(bodies[i]), ecc(bodies[j])))) { adj[i].add(j); adj[j].add(i); }
  let best = 0, nodes = 0, exhaustive = true;
  const LIMIT = 4e6;
  (function rec(cand, chosen) {
    if (nodes++ > LIMIT) { exhaustive = false; return; }
    if (chosen + cand.length <= best) return;            // bound
    if (cand.length === 0) { best = Math.max(best, chosen); return; }
    let piv = cand[0], deg = -1;
    for (const v of cand) { const d = cand.reduce((a, u) => a + (adj[v].has(u) ? 1 : 0), 0); if (d > deg) { deg = d; piv = v; } }
    if (deg === 0) { best = Math.max(best, chosen + cand.length); return; }   // independent remainder
    rec(cand.filter(u => u !== piv && !adj[piv].has(u)), chosen + 1);         // include pivot
    rec(cand.filter(u => u !== piv), chosen);                                  // exclude pivot
  })([...Array(n).keys()], 0);
  return { size: best, exhaustive, conflictEdges: adj.reduce((a, s) => a + s.size, 0) / 2 };
}

const rows = [];
for (const [name, v] of Object.entries(vectors.layouts)) {
  const byRank = v.expected.bodies.filter(b => !b.overflow).sort((a, b) => a.rank - b.rank);
  if (byRank.length === 0) { rows.push({ layout: name, nonOverflowBodies: 0, note: "no roles — PG-16 has no subject here" }); continue; }

  /* --- limb B: activity at the bound --- */
  const trace = [];
  const drawn = spaced(byRank, BUDGET_L0, BOUND, trace);
  const crowdingDrops = trace.filter(t => t.why === "CROWDING");
  const spacingActive = crowdingDrops.length > 0;

  /* --- limb C: the exact interval of c over which the drawn set is unchanged --- */
  const thresholds = [];
  for (let i = 0; i < byRank.length; i += 1) for (let j = i + 1; j < byRank.length; j += 1)
    thresholds.push(sep(byRank[i], byRank[j]) / Math.max(ecc(byRank[i]), ecc(byRank[j])));
  const brk = [...new Set(thresholds.filter(t => Number.isFinite(t) && t > 0))].sort((a, b) => a - b);
  const key = c => spaced(byRank, BUDGET_L0, c, null).map(b => b.rank).join(",");
  const atBound = key(BOUND);
  /* walk down and up through the breakpoints while the drawn set is unchanged */
  let lo = 0, hi = Infinity;
  for (const t of brk) { if (t < BOUND && key((t + (brk.filter(x => x < t).pop() ?? 0)) / 2 || t / 2) !== atBound) lo = Math.max(lo, t); }
  /* precise scan: smallest breakpoint above BOUND whose crossing changes the set; largest below likewise */
  const above = brk.filter(t => t >= BOUND);
  hi = Infinity;
  for (let i = 0; i < above.length; i += 1) {
    const probe = i + 1 < above.length ? (above[i] + above[i + 1]) / 2 : above[i] + 1e-9;
    if (key(probe) !== atBound) { hi = above[i]; break; }
  }
  const below = brk.filter(t => t < BOUND).sort((a, b) => b - a);
  lo = 0;
  for (let i = 0; i < below.length; i += 1) {
    const probe = i + 1 < below.length ? (below[i] + below[i + 1]) / 2 : below[i] / 2;
    if (key(probe) !== atBound) { lo = below[i]; break; }
  }

  /* --- limb D: greedy vs maximum --- */
  const greedyUncapped = spaced(byRank, Infinity, BOUND, null).length;
  const mis = maxIndependentSet(byRank, BOUND);

  rows.push({
    layout: name,
    nonOverflowBodies: byRank.length,
    drawnAtBound: drawn.length,
    binding: greedyUncapped >= BUDGET_L0 ? "BUDGET" : "SPACING",
    limbB: {
      spacingActive,
      bodiesDroppedByCrowdingBeforeBudget: crowdingDrops.length,
      crowdingDrops: crowdingDrops.slice(0, 6)
    },
    limbC: {
      /* the constraint is satisfied iff c <= sep/maxEcc, so a LOWER c is LOOSER. At c = lo the blocked pair
         is clear again, so lo itself already belongs to the next regime: the drawn set is identical to the
         drawn set at 0.3 exactly on the OPEN interval (lo, hi). */
      drawnSetUnchangedOnOpenInterval: { above: Number(lo.toFixed(6)), below: hi === Infinity ? null : Number(hi.toFixed(6)) },
      boundIsInterior: lo < BOUND && (hi === Infinity || hi > BOUND),
      marginBelowBound: Number((BOUND - lo).toFixed(6)),
      marginAboveBound: hi === Infinity ? null : Number((hi - BOUND).toFixed(6)),
      nearestBoundaryDistance: Number(Math.min(BOUND - lo, hi === Infinity ? Infinity : hi - BOUND).toFixed(6)),
      distinguishes_0_3_from_0_5: hi !== Infinity && hi <= 0.5
    },
    limbD: {
      greedyUncapped,
      maximumIndependentSet: mis.size,
      exhaustive: mis.exhaustive,
      conflictEdges: mis.conflictEdges,
      greedyIsMaximum: greedyUncapped === mis.size,
      shortfall: mis.size - greedyUncapped
    }
  });
}

const subjects = rows.filter(r => r.nonOverflowBodies > 0);
const exercised = subjects.filter(r => r.nonOverflowBodies >= BUDGET_L0);
const activeSomewhere = subjects.filter(r => r.limbB.spacingActive);
const interior = subjects.filter(r => r.limbC.boundIsInterior);
const distinguishing = subjects.filter(r => r.limbC.distinguishes_0_3_from_0_5);
const greedyGaps = subjects.filter(r => !r.limbD.greedyIsMaximum);
/* ERRATUM PROPAGATION: outputs/pg16-crowding-at-0.5.json classifies each layout's binding constraint as
   `uncapped >= BUDGET ? "BUDGET" : "SPACING"` where `uncapped` is the GREEDY count. If the true maximum
   crosses the budget where the greedy count does not, that classification flips and the erratum reaches the
   conclusions rather than only the field name. This checks it instead of assuming either way. */
const reclassified = subjects.filter(r => (r.limbD.greedyUncapped >= BUDGET_L0) !== (r.limbD.maximumIndependentSet >= BUDGET_L0))
  .map(r => ({ layout: r.layout, greedySays: r.limbD.greedyUncapped >= BUDGET_L0 ? "BUDGET" : "SPACING", maximumSays: r.limbD.maximumIndependentSet >= BUDGET_L0 ? "BUDGET" : "SPACING" }));
/* and the drawn counts themselves are greedy BY DEFINITION — they are what the product draws — so they
   cannot be in error from this cause. Stated so the erratum's blast radius is bounded explicitly. */
const tightest = subjects.filter(r => Number.isFinite(r.limbC.nearestBoundaryDistance))
  .sort((a, b) => a.limbC.nearestBoundaryDistance - b.limbC.nearestBoundaryDistance)[0];

const out = {
  reading: "GRÜN · §62 — A-G128 satisfiability of PG-16 at the derived bound 0.3, in four limbs",
  verdict: PROVENANCE.verdict,
  scope: "arithmetic on committed constants: layout-golden-vectors-v1.1.json and spaced() as committed. No render, no server, no gate, no sealed datum.",
  question: "GELB §62: at the bound the record derived, is the pin satisfiable — can a layout in the exercised set pass it AND can one fail it?",
  constants: { CROWDING: BOUND, BODY_BUDGET_L0: BUDGET_L0, layoutsInSet: rows.length, layoutsWithASubject: subjects.length, layoutsExercisingTheCap: exercised.length },

  limbA_predicate: {
    pinPredicate: "sep(o,b) - r_o - r_b >= CROWDING * max(ecc_o, ecc_b)   [PHASE_G §11, and the spaced() doc comment]",
    filterPredicate: "sep(o,b) - r_o - r_b >= CROWDING * max(ecc_o, ecc_b)   [PersonJobMappingField.tsx:479]",
    identical: true,
    docCommentQuote: "A body that would crowd one already drawn is left to the list, like the ones beyond the budget: the spacing wins, the budget shrinks.",
    canAnyLayoutFail: false,
    finding: "NO layout in the exercised set can fail PG-16, and none could at any other value of the constant either. The product evaluates the pin's own predicate and declines to draw the counterexample, so the drawn set satisfies the pin by construction. PG-16 as a pin over the RENDERED FIELD is a zero-by-construction channel: it is not falsifiable at 0.3, and restoring the bound to 0.3 does not make it falsifiable, because the obstruction is the shared expression and not the number in it.",
    whatThisDoesNotSay: "It does NOT say PG-16 is worthless or that the bound should not be restored. It says the pin's subject has to change, not its constant: what is falsifiable is whether the FILTER IS PRESENT AND CORRECT (a mutant that deletes line 479's clearance test must be caught), not whether its output satisfies it. A-G128 is a question about the pin, and this is the pin failing it, not the bound."
  },

  limbB_activity: {
    layoutsWhereSpacingRemovesABody: activeSomewhere.map(r => ({ layout: r.layout, dropped: r.limbB.bodiesDroppedByCrowdingBeforeBudget })),
    layoutsWhereSpacingIsInert: subjects.filter(r => !r.limbB.spacingActive).map(r => r.layout),
    finding: `At 0.3 the spacing actually removes at least one body on ${activeSomewhere.length} of ${subjects.length} layouts that have a subject. On the rest the budget alone determines the drawn set and PG-16 is inert — it is not merely unfalsifiable there, it is doing nothing.`
  },

  limbC_measurability: {
    convention: "the clearance test is satisfied iff c <= sep/maxEcc, so a lower c is looser; the drawn set equals the drawn set at 0.3 exactly on the OPEN interval (above, below) reported per layout.",
    perLayoutInterval: subjects.map(r => ({ layout: r.layout, unchangedAbove: r.limbC.drawnSetUnchangedOnOpenInterval.above, unchangedBelow: r.limbC.drawnSetUnchangedOnOpenInterval.below, nearestBoundaryDistance: r.limbC.nearestBoundaryDistance, distinguishes_0_3_from_0_5: r.limbC.distinguishes_0_3_from_0_5 })),
    layoutsWhereMovingTheBoundTo0_5ChangesTheDrawnSet: distinguishing.map(r => r.layout),
    tightestLayout: tightest && { layout: tightest.layout, interval: tightest.limbC.drawnSetUnchangedOnOpenInterval, nearestBoundaryDistance: tightest.limbC.nearestBoundaryDistance },
    finding: `0.3 is interior to the invariance interval on ${interior.length} of ${subjects.length} layouts, so no layout in the set is exactly AT a decision boundary. But the intervals are NARROW where the spacing is active: the tightest is ${tightest ? tightest.layout : "n/a"} at (${tightest ? tightest.limbC.drawnSetUnchangedOnOpenInterval.above : "?"}, ${tightest ? tightest.limbC.drawnSetUnchangedOnOpenInterval.below : "?"}), which puts 0.3 only ${tightest ? tightest.limbC.nearestBoundaryDistance : "?"} from a value that changes the drawn set. And ${distinguishing.length} of ${subjects.length} layouts change their drawn set somewhere in (0.3, 0.5].`,
    whyThisMatters: "I pre-wrote this limb expecting it to say that 0.3 sits in a wide dead zone and is therefore underdetermined by any rendered reading. THE RUN SAYS THE OPPOSITE and the pre-written text is withdrawn. The constant's VALUE is sharply observable: the 0.3-vs-0.5 divergence changes the drawn set on 10 of 11 layouts, and on the tightest layout a shift of ~0.0015 is already visible. So PG-16's bound is both derived AND consequential — which is precisely why limb A matters rather than being a technicality. The field is highly sensitive to the constant and completely insensitive to whether the pin holds, because the product enforces the pin and reports the constant only through which bodies survive."
  },

  limbD_maximality: {
    layoutsWhereGreedyIsNotMaximum: greedyGaps.map(r => ({ layout: r.layout, greedy: r.limbD.greedyUncapped, maximum: r.limbD.maximumIndependentSet, shortfall: r.limbD.shortfall, exhaustive: r.limbD.exhaustive })),
    allExhaustive: subjects.every(r => r.limbD.exhaustive),
    finding: greedyGaps.length > 0
      ? `On ${greedyGaps.length} of ${subjects.length} layouts the rank-greedy filter admits FEWER bodies than the crowding constraint alone permits. The drawn count is therefore a function of the RANK ORDER as well as of the constant, and "spacing-only capacity" is not a capacity.`
      : "On every layout with a subject the rank-greedy filter achieves the maximum the crowding constraint permits, so for this vector set greedy and maximum coincide and 'spacing-only capacity' is accurate as a count even though it is greedy as a method.",
    errataPropagation: {
      bindingClassificationsThatFlipUnderTheTrueMaximum: reclassified,
      drawnCountsAffected: false,
      drawnCountsWhyNot: "L0_at_0_3 / L0_at_0_5 / delta in the earlier file are greedy counts because `spaced()` is greedy — they are what the product actually draws, so greediness is not an error in them. Only the quantity labelled a CAPACITY is wrong, plus any inference drawn from it.",
      conclusionAffected: reclassified.length > 0
        ? "YES — the binding classification flips on the layouts listed, so the earlier file's BUDGET/SPACING columns are wrong there and any count of 'layouts where the budget binds' taken from it must be recomputed."
        : "NO — no layout's BUDGET/SPACING classification flips when the greedy count is replaced by the true maximum, because on every layout the two fall on the same side of the budget. So the earlier file's conclusions, including 'the budget binds on 8 at 0.3' and 'the effective cap at 0.5 is 4-7', stand as written. The erratum is confined to the NAME of one field and to any reading of it as a capacity."
    },
    erratumAgainstMyOwnEarlierReading: greedyGaps.length > 0
      ? "outputs/pg16-crowding-at-0.5.json reports a field named `spacingOnlyCapacity` computed as spaced(byRank, Infinity, c).length. That is a greedy count, not a capacity, and on the layouts listed here it understates the maximum. The figures in that file are correct AS DRAWN COUNTS — they are what the product draws — but the NAME is wrong and the 'capacity' reading of them is wrong. Both lanes quoted those numbers."
      : "outputs/pg16-crowding-at-0.5.json's `spacingOnlyCapacity` is a greedy count by construction. On this vector set it happens to equal the maximum on every layout, so the figures stand and the name is merely imprecise rather than misleading. The imprecision is still mine and is recorded here rather than left for a third lane to find."
  },

  answerToGELB: null,
  perLayout: rows
};

out.answerToGELB = [
  "Direct answer: NO. At 0.3 the pin is satisfiable in the trivial sense — every layout passes — and falsifiable on NONE, so A-G128 fails on PG-16 and it fails for a reason the bound cannot fix.",
  "Limb A is the whole of it: PHASE_G §11's pin predicate and spaced()'s filter predicate at line 479 are the same expression over the same operands. The product declines to draw any body that would violate the pin. So there is no layout in the exercised set that can fail it, at 0.3 or at any other value.",
  "That means restoring the bound to 0.3 does NOT give you a derived bound on an unfalsifiable pin by some accident of the number — the pin is unfalsifiable by construction and was equally so at 0.5. A-G156 did not make it unfalsifiable and withdrawing A-G156 will not make it falsifiable. The two questions are independent, which I think is good news for your write-up: you can restore the derived bound without inheriting a new defect, provided the entry says what the pin can and cannot do.",
  `Limb B adds that on ${subjects.length - activeSomewhere.length} of ${subjects.length} layouts with a subject the spacing does not remove a single body at 0.3 — there the budget alone fixes the drawn set and PG-16 is inert, not just unfalsifiable.`,
  `Limb C came out the OPPOSITE WAY from how I had written it before running it, and the prediction is withdrawn in the file rather than deleted. I expected 0.3 to sit in a wide dead zone where the value could not matter. It does not: the 0.3-vs-0.5 divergence changes the drawn set on ${distinguishing.length} of ${subjects.length} layouts, and on ${tightest ? tightest.layout : "the tightest layout"} the invariance interval is only (${tightest ? tightest.limbC.drawnSetUnchangedOnOpenInterval.above : "?"}, ${tightest ? tightest.limbC.drawnSetUnchangedOnOpenInterval.below : "?"}) — 0.3 is ${tightest ? tightest.limbC.nearestBoundaryDistance : "?"} from a value that removes or adds a body. So the constant is sharply consequential. That strengthens the case for restoring the derived number rather than weakening it, and it is also why limb A is not a technicality: the field is very sensitive to the constant's VALUE and entirely insensitive to whether the PIN holds.`,
  "What IS falsifiable, and what I would pin instead or in addition: the PRESENCE and CORRECTNESS of the filter. Delete line 479's clearance test and a layout must visibly gain a crowded body. That is a mutant, it is cheap, and it is exactly the shape A-F11 asks for. It is also — and I am flagging this rather than quietly doing it — a vitest assertion, so it lands in the held-on-B-ENTRY bucket with the other two mutants, written red-first and not executed.",
  "One erratum of my own falls out of limb D and I would rather you have it before you quote the file again: see limbD.erratumAgainstMyOwnEarlierReading."
];

writeFileSync(resolve(here, "../outputs/pg16-satisfiability-at-0.3.json"), JSON.stringify(out, null, 1));
console.log("layout                                          bodies  drawn  bind      spacing-drops  unchanged-c-interval        greedy/MIS");
for (const r of rows) {
  if (!r.nonOverflowBodies) { console.log(`${r.layout.padEnd(48)}  (no roles)`); continue; }
  const iv = `(${r.limbC.drawnSetUnchangedOnOpenInterval.above.toFixed(4)}, ${r.limbC.drawnSetUnchangedOnOpenInterval.below === null ? "inf" : r.limbC.drawnSetUnchangedOnOpenInterval.below.toFixed(4)})`;
  console.log(`${r.layout.padEnd(48)}${String(r.nonOverflowBodies).padStart(5)}${String(r.drawnAtBound).padStart(7)}${r.binding.padStart(9)}${String(r.limbB.bodiesDroppedByCrowdingBeforeBudget).padStart(13)}   ${iv.padEnd(26)} ${r.limbD.greedyUncapped}/${r.limbD.maximumIndependentSet}${r.limbD.exhaustive ? "" : "+"}`);
}
console.log();
for (const line of out.answerToGELB) console.log("·", line, "\n");
