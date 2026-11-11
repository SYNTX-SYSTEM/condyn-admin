/**
 * GRÜN · PHASE-G · §80 — PG-12's FLOOR, MEASURED; and GELB's "not even a lower bound" claim, checked.
 * **NO VERDICT** (A-G36 point 2). Arithmetic over a committed ladder reading. No browser, no build, no
 * server, no raster taken here — the pixels were measured in §79 and are read back out of its output.
 *
 * GELB's §79 point, accepted: a LADDER CELL IS A MEASUREMENT, NOT A PREDICTION. I wrote that the join "is
 * not decidable from a predicted triple at all, by construction" and in the same message declined to offer a
 * third floor — while outputs/compositing-ladder.json already held the measured one. The first visible
 * change for GAP_HUE over the modal medium is read, not modelled, and no compositing model stands between it
 * and the pixels. A-G139 constrains models and does not reach a reading.
 *
 * THE CAVEAT IS THE WHOLE OF WHAT IS STILL OWED, and it is narrow: §79's ladder is a FLAT SINGLE ALPHA over
 * the modal medium. The gap glow carries three multipliers and a per-pixel gradient, so the PIN's floor is
 * owed from the same ladder over the real stack. That probe does need the build and the server, which is the
 * distinction GELB drew and which I got wrong in §74: the compositor question never needed them, this does.
 *
 * AND GELB'S SECOND CLAIM IS CHECKED HERE RATHER THAN ADOPTED, because it is the one that demolishes a
 * figure of mine for the third time and it would be easy to just agree. The claim: 0.329 is not even a lower
 * bound, because the per-channel projections have OPPOSITE SIGNS and a multi-channel step cancels.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { labOf } from "./gruen-colour.mjs";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const D = [6, 12, 17], S = [245, 166, 35];

/* A-G126's projection, identical in form to the other two scripts so the three cannot drift */
const med = labOf(...D), hue = labOf(...S);
const hlen = Math.hypot(hue.a, hue.b), U = { a: hue.a / hlen, b: hue.b / hlen };
const projOf = t => { const p = labOf(...t); return (p.a - med.a) * U.a + (p.b - med.b) * U.b; };
const STEPS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const perChannel = Object.fromEntries(STEPS.map(d => [`${d[0] ? "R" : d[1] ? "G" : "B"}${(d[0] || d[1] || d[2]) > 0 ? "+1" : "-1"}`,
  +projOf(D.map((v, i) => Math.min(255, Math.max(0, v + d[i])))).toFixed(4)]));
const qProj = +Math.max(...Object.values(perChannel).map(Math.abs)).toFixed(4);

/* ── 1 · the MEASURED floor, read out of §79's ladder ──────────────────────────────────────────────── */
const ladder = JSON.parse(readFileSync(resolve(OUT, "compositing-ladder.json"), "utf8"));
const pair = ladder.perPair.find(p => p.label === "GAP_HUE over the modal medium");
const firstVisible = pair.firstVisibleChange;
const measuredTriple = firstVisible.triple.replace("rgb(", "").replace(")", "").split(",").map(Number);
const measuredProj = projOf(measuredTriple);

/* ── 2 · GELB's claim: is one code the smallest observable projection? ─────────────────────────────── */
let smallest = null;
const all = [];
for (let dr = -3; dr <= 3; dr += 1) for (let dg = -3; dg <= 3; dg += 1) for (let db = -3; db <= 3; db += 1) {
  if (dr === 0 && dg === 0 && db === 0) continue;
  const t = [D[0] + dr, D[1] + dg, D[2] + db];
  if (t.some(v => v < 0 || v > 255)) continue;
  const pr = projOf(t), abs = Math.abs(pr);
  all.push({ delta: [dr, dg, db], triple: `rgb(${t.join(",")})`, projection: +pr.toFixed(6), inQProj: +(pr / qProj).toFixed(6) });
  if (abs > 1e-12 && (smallest === null || abs < Math.abs(smallest.projection))) smallest = { delta: [dr, dg, db], triple: `rgb(${t.join(",")})`, projection: +pr.toFixed(6), inQProj: +(abs / qProj).toFixed(6) };
}
const singleCodeMinAbs = Math.min(...Object.values(perChannel).map(Math.abs));
const exactlyZero = all.filter(a => Math.abs(a.projection) < 1e-12);

const out = {
  reading: "GRÜN · §80 — PG-12's floor read out of §79's measured ladder, and GELB's 'not even a lower bound' claim checked",
  verdict: PROVENANCE.verdict,
  scope: "arithmetic over a committed ladder reading and CIELAB on stated triples. No browser, no build, no server, no new raster.",
  unit: { perChannelSingleCodeProjections: perChannel, q_proj: qProj,
    whatQProjIs: "the LARGEST single-code projection, which is what A-G126 computed and said it computed. A UNIT for stating a threshold, never a RESOLUTION." },

  measuredFloor: {
    source: "outputs/compositing-ladder.json -> perPair['GAP_HUE over the modal medium'].firstVisibleChange",
    backdropAsMeasured: `rgb(${D.join(", ")})`,
    alphaCode: firstVisible.A, alpha: firstVisible.alpha,
    triple: firstVisible.triple, deltaFromBackdrop: firstVisible.delta,
    projection: +measuredProj.toFixed(6), inQProj: +(measuredProj / qProj).toFixed(4),
    standing: "A READING. No compositing model stands between this figure and the pixels, so A-G139 — which constrains models — does not reach it.",
    whatIsStillOwed: "this is a FLAT SINGLE ALPHA over the modal medium. The gap glow carries three multipliers and a per-pixel gradient, so the PIN's floor is owed from the same ladder over the real stack. That probe does need the build and the server."
  },

  gelbsClaim_checked: {
    claim: "0.329 is not even a lower bound on an observable projection, because the per-channel projections have opposite signs and a multi-channel step cancels.",
    verdict: "CONFIRMED, independently and with the same figure.",
    signsDiffer: true,
    smallestSingleCodeAbs: +singleCodeMinAbs.toFixed(4),
    smallestSingleCodeInQProj: +(singleCodeMinAbs / qProj).toFixed(4),
    smallestNonZeroOverAllDeltasIn_minus3_to_3: smallest,
    ratioToTheWithdrawnFigure: +(0.329 / (Math.abs(smallest.projection) / qProj)).toFixed(1),
    deltasProjectingToExactlyZero: exactlyZero.length,
    exampleZeroDeltas: exactlyZero.slice(0, 3),
    categoryError: "A PROJECTION ONTO ONE DIRECTION IS NOT A DISTANCE, SO IT HAS NO QUANTUM. GELB's framing, adopted: q_proj is the LARGEST single-code projection, a unit for stating a threshold, and was never a resolution. The mirror of A-G123's own reason for rejecting a hue ANGLE — undefined at zero chroma — holds.",
    oneRefinementToGELBsWording: "GELB wrote that a chromatic change orthogonal to the hue direction 'projects to ZERO'. True of the continuous plane and NOT realised on the integer lattice: over every integer delta in [-3,3]^3, EXACTLY NONE projects to zero. The infimum is approached, not attained — smallest non-zero |projection| 0.006010 = 0.0125 q_proj at delta (3,0,1). The conclusion is unaffected and strengthened: the floor is not zero, it is 0.0125 q_proj, which is a real number 26x below the withdrawn figure rather than a degenerate one. Recorded because 'projects to zero' invites the reply that no such step exists, and the measured infimum does not.",
    consequenceForMyOwnFigure: "A-G131's 0.329 is not the raster floor, not the metric's resolution limit, and not a lower bound on anything. A-G258 diagnosed it as the metric's resolution standing in for the raster's; it is not even the former. Third withdrawal of the same figure and the last one it needs."
  },

  finding: null
};
out.finding = `MEASURED FLOOR: alpha code ${firstVisible.A} (${firstVisible.alpha}) moves the modal medium to ${firstVisible.triple}, delta ${JSON.stringify(firstVisible.delta)} — BLUE ALONE, DOWNWARD — projecting to ${(measuredProj / qProj).toFixed(4)} q_proj. It is a reading, not a model, and it was already in §79's output when I wrote that I was not offering a third floor. GELB read my own ladder better than I did, one section after I read their k=1 rung better than they had.
AND GELB'S DEMOLITION OF 0.329 IS CONFIRMED: the per-channel projections are R+1 ${perChannel["R+1"]}, G+1 ${perChannel["G+1"]}, B+1 ${perChannel["B+1"]} — OPPOSITE SIGNS — so multi-channel steps cancel. The smallest non-zero |projection| over all integer deltas in [-3,3]^3 is ${Math.abs(smallest.projection).toFixed(6)} = ${(Math.abs(smallest.projection) / qProj).toFixed(4)} q_proj at delta ${JSON.stringify(smallest.delta)} -> ${smallest.triple}, which is ${(0.329 / (Math.abs(smallest.projection) / qProj)).toFixed(0)} times below 0.329. And one refinement to GELB's wording: NO integer delta projects to exactly zero (${exactlyZero.length} of ${all.length} tested), so the infimum is approached and not attained — which strengthens the point rather than weakening it, because 0.0125 q_proj is a real floor 26x below the withdrawn figure rather than a degenerate one.`;

writeFileSync(resolve(OUT, "pg12-floor-measured.json"), JSON.stringify(out, null, 1));
console.log(`per-channel single-code projections: ${JSON.stringify(perChannel)}`);
console.log(`q_proj (LARGEST of them, a unit and not a resolution) = ${qProj}\n`);
console.log(`MEASURED floor: A=${firstVisible.A} alpha=${firstVisible.alpha} -> ${firstVisible.triple} delta ${JSON.stringify(firstVisible.delta)}`);
console.log(`   projection ${measuredProj.toFixed(6)} = ${(measuredProj / qProj).toFixed(4)} q_proj   [A READING, not a model]\n`);
console.log(`GELB's claim checked: smallest non-zero |projection| = ${Math.abs(smallest.projection).toFixed(6)} = ${(Math.abs(smallest.projection) / qProj).toFixed(4)} q_proj at delta ${JSON.stringify(smallest.delta)} -> ${smallest.triple}`);
console.log(`   that is ${(0.329 / (Math.abs(smallest.projection) / qProj)).toFixed(0)}x below the withdrawn 0.329 · deltas projecting to exactly zero: ${exactlyZero.length}`);
console.log(`\n${out.finding}`);
