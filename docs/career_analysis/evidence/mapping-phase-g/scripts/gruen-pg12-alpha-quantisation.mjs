/**
 * GRÜN · PHASE-G · §62 — WHICH BACKDROP DID MY RASTER MEASURE? It did not. The answer to GELB's question,
 * and the withdrawal of the figure the question was about.  **NO VERDICT** (A-G36 point 2).
 * Pure arithmetic over two committed triples. No render, no raster, no server, no browser, no credential.
 *
 * GELB asked which backdrop this lane's raster measured, offering a rescue: that α 0.00210 → rgb(7,12,17)
 * might be right about a RENDERED pixel whose backdrop was not the modal medium, in which case A-G131's
 * record would be wrong and this lane's table right.
 *
 * THE RESCUE DOES NOT APPLY, AND THE FIGURE IS MINE. There is no backdrop question, because no backdrop was
 * measured. `outputs/pg12-leak-direction.json` is a COMPUTATION over the modal medium rgb(6,12,17), stated
 * as such at the top of gruen-pg12-direction.mjs, and the sealed PG-12 raster (SEALED-pg12-ratio-*.json)
 * contains C* DISTRIBUTIONS — hue class, plain glow, medium, and their ratio — and no alpha, no composite
 * triple and no backdrop at all. The two were never the same reading.
 *
 * WHAT WENT WRONG IS NARROWER AND WORSE. gruen-pg12-direction.mjs:90 sweeps
 *     for (let a = 0; a <= 0.05; a += 0.00001)
 * and reports the first α at which the composite leaves the medium under a field named
 * `firstVisibleInRaster`. The sweep is over CONTINUOUS α. A-G81 — established by this lane, and upheld by
 * GELB when they declined this lane's withdrawal of it — fixes 8-bit alpha quantisation BEFORE compositing.
 * The achievable alphas are therefore k/255, and 0.00210 lies strictly between 0 and 1/255 = 0.0039216. So
 * the figure describes a state the renderer cannot produce, and the FIELD NAME is what carried it into the
 * record as a raster floor: a continuum arithmetic result labelled as a raster observation.
 *
 * GELB's recomputation is right, and the arithmetic is reproduced below rather than accepted.
 *
 * THE ONE PATH THAT COULD STILL RESCUE IT is not the backdrop but the COMPOSITING DEPTH. The gap glow is a
 * gradient-filled circle inside a `<g opacity=…>` (depthGain), so the leak reaches the medium through TWO
 * alphas, not one. If the compositor quantises the effective alpha to 8 bits at the join, the achievable set
 * is still k/255 and rgb(7,12,17) stays unreachable. If it keeps the exact product in higher precision, many
 * effective alphas below 1/255 become achievable and rgb(7,12,17) comes back. Both branches are computed.
 * Which one the renderer does is an empirical question about the renderer, it needs a raster to settle, and
 * that is blocked — so it is recorded as an open measurable rather than resolved by preference.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { labOf, chromaQuantumFloor } from "./gruen-colour.mjs";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const MEDIUM = [6, 12, 17];           // the modal medium triple, MEASURED at both sizes
const GAP_HUE = [245, 166, 35];       // the source constant
const eq = (x, y) => x[0] === y[0] && x[1] === y[1] && x[2] === y[2];
const rgb = t => `rgb(${t.join(", ")})`;

/* A-G126's projection, identical in form to gruen-pg12-direction.mjs so the two cannot drift */
const med = labOf(...MEDIUM), hue = labOf(...GAP_HUE);
const hlen = Math.hypot(hue.a, hue.b), U = { a: hue.a / hlen, b: hue.b / hlen };
const projOf = t => { const p = labOf(...t); return (p.a - med.a) * U.a + (p.b - med.b) * U.b; };
const STEPS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const qProj = +Math.max(...STEPS.map(d => Math.abs(projOf(MEDIUM.map((v, i) => Math.min(255, Math.max(0, v + d[i]))))))).toFixed(4);

const compose = (dst, a, f = Math.round) => dst.map((v, i) => Math.max(0, Math.min(255, f(v + a * (GAP_HUE[i] - v)))));

/* ── 1 · reproduce the committed continuum figure, so what is being withdrawn is not in doubt ──────── */
let continuum = null;
for (let a = 0; a <= 0.05; a += 0.00001) {
  const t = compose(MEDIUM, a);
  if (!eq(t, MEDIUM)) { continuum = { alpha: +a.toFixed(5), triple: rgb(t), inQProj: +(projOf(t) / qProj).toFixed(3) }; break; }
}

/* ── 2 · the same question at the only alphas the renderer can apply (A-G81) ───────────────────────── */
const quantised = {};
for (const mode of ["round", "truncate"]) {
  const f = mode === "truncate" ? Math.trunc : Math.round;
  let first = null, reportable = null;
  for (let k = 0; k <= 255; k += 1) {
    const t = compose(MEDIUM, k / 255, f);
    if (first === null && !eq(t, MEDIUM)) first = { k, alpha: +(k / 255).toFixed(7), triple: rgb(t), projection: +projOf(t).toFixed(4), inQProj: +(projOf(t) / qProj).toFixed(3) };
    if (reportable === null && projOf(t) >= qProj) reportable = { k, alpha: +(k / 255).toFixed(7), triple: rgb(t), inQProj: +(projOf(t) / qProj).toFixed(3) };
    if (first && reportable) break;
  }
  quantised[mode] = { firstVisibleState: first, firstReportableAtOneQProj: reportable };
}
/* why G cannot stay at 12 while R moves to 7 — the mechanism, not just the outcome */
const kOne = 1 / 255;
const channelAtKOne = ["R", "G", "B"].map((name, i) => ({
  channel: name, from: MEDIUM[i], exact: +(MEDIUM[i] + kOne * (GAP_HUE[i] - MEDIUM[i])).toFixed(4),
  rounds: Math.round(MEDIUM[i] + kOne * (GAP_HUE[i] - MEDIUM[i])),
  fractionalPart: +((MEDIUM[i] + kOne * (GAP_HUE[i] - MEDIUM[i])) % 1).toFixed(4)
}));

/* ── 3 · GELB's diagnosis of where 0.329 came from, checked ────────────────────────────────────────── */
const singleCodeR = Math.abs(projOf([MEDIUM[0] + 1, MEDIUM[1], MEDIUM[2]]));
const diagnosis = {
  claim: "A-G131's 0.329 floor is A-G126's single-code R step divided by q_proj — the smallest step the METRIC can resolve, taken for the smallest step the RASTER can carry.",
  singleCodeRStep: +singleCodeR.toFixed(4), q_proj: qProj, ratio: +(singleCodeR / qProj).toFixed(4),
  matchesTheRecordedFloor: Math.abs(singleCodeR / qProj - 0.329) < 0.001,
  whyItIsWrong: "compositing a triple over a triple moves EVERY channel at once, so the achievable step is the vector step and never the smallest component step. An rgb(7,12,17) is a pure-R step; no alpha produces one here."
};

/* ── 4 · the 27 backdrops within one code: GELB's sweep, reproduced ─────────────────────────────────── */
const TARGET = [7, 12, 17];
const backdrops = [];
for (let dr = -1; dr <= 1; dr += 1) for (let dg = -1; dg <= 1; dg += 1) for (let db = -1; db <= 1; db += 1) {
  const d = [MEDIUM[0] + dr, MEDIUM[1] + dg, MEDIUM[2] + db];
  /* EACH BACKDROP IN ITS OWN REFERENCE FRAME. The first version projected every backdrop against the MODAL
     medium's a*,b* origin and divided by the modal q_proj, which mixes two questions: "how far is this
     pixel from the modal medium" and "what is the smallest step visible ON this backdrop". The second is
     the one a floor is about, so the projection origin and q_proj are recomputed per backdrop. The modal
     framing is kept alongside it, because that is the frame A-G126's q_proj was defined in. */
  const dMed = labOf(...d);
  const projLocal = t => { const q = labOf(...t); return (q.a - dMed.a) * U.a + (q.b - dMed.b) * U.b; };
  const qProjLocal = +Math.max(...STEPS.map(e => Math.abs(projLocal(d.map((v, i) => Math.min(255, Math.max(0, v + e[i]))))))).toFixed(4);
  let reachesTarget = null, firstVisible = null;
  for (let k = 1; k <= 255; k += 1) {        // k >= 1: at k = 0 nothing is composited, so a backdrop
    const t = compose(d, k / 255);           // "reaching" its own value is not a reach
    if (firstVisible === null && !eq(t, d)) firstVisible = { k, triple: rgb(t), inQProjLocal: +(projLocal(t) / qProjLocal).toFixed(3), inQProjModal: +(projOf(t) / qProj).toFixed(3) };
    if (reachesTarget === null && eq(t, TARGET)) reachesTarget = { k, alpha: +(k / 255).toFixed(7) };
    if (firstVisible && reachesTarget) break;
  }
  backdrops.push({ backdrop: rgb(d), isModal: eq(d, MEDIUM), isTarget: eq(d, TARGET), q_projAtThisBackdrop: qProjLocal,
    reachesRgb7_12_17: reachesTarget !== null, atCode: reachesTarget?.k ?? null,
    firstVisibleTriple: firstVisible?.triple ?? null,
    firstVisibleStepInOwnQProj: firstVisible?.inQProjLocal ?? null,
    firstVisibleStepInModalQProj: firstVisible?.inQProjModal ?? null });
}
const reaching = backdrops.filter(b => b.reachesRgb7_12_17 && !b.isTarget);
const nearFloorOwn = backdrops.filter(b => b.firstVisibleStepInOwnQProj !== null && Math.abs(b.firstVisibleStepInOwnQProj - 0.329) < 0.05);
const nearFloorModal = backdrops.filter(b => b.firstVisibleStepInModalQProj !== null && Math.abs(b.firstVisibleStepInModalQProj - 0.329) < 0.05);

/* ── 5 · the compositing-depth branch: two alphas, and whether sub-quantum effective alphas exist ──── */
const twoStage = (() => {
  /* branch A: the join quantises the effective alpha to 8 bits -> the achievable set is unchanged */
  const branchA = { model: "effective alpha re-quantised to 8 bits at the group join", achievableSetChanges: false,
    reachesRgb7_12_17: false, why: "round(k1*k2/255)/255 is itself of the form k/255, so no effective alpha below 1/255 exists and the single-stage result stands unchanged" };
  /* branch B: the exact product survives in higher precision -> sweep all 8-bit pairs */
  let best = null, reaches = null;
  for (let k1 = 1; k1 <= 255; k1 += 1) for (let k2 = 1; k2 <= 255; k2 += 1) {
    const a = (k1 / 255) * (k2 / 255);
    if (a >= 1 / 255) continue;                      // only the sub-quantum region is new
    const t = compose(MEDIUM, a);
    if (eq(t, MEDIUM)) continue;
    if (reaches === null && eq(t, TARGET)) reaches = { k1, k2, effectiveAlpha: +a.toFixed(7), inQProj: +(projOf(t) / qProj).toFixed(3) };
    if (best === null || a < best.effectiveAlpha) best = { k1, k2, effectiveAlpha: +a.toFixed(7), triple: rgb(t), inQProj: +(projOf(t) / qProj).toFixed(3) };
  }
  return { branchA, branchB: { model: "exact product of the two 8-bit alphas kept in higher precision", achievableSetChanges: true,
    lowestVisibleEffectiveAlpha: best, reachesRgb7_12_17: reaches,
    why: "k1*k2/255^2 densely fills (0, 1/255), so states unreachable with one alpha become reachable with two" } };
})();

const out = {
  reading: "GRÜN · §62 — PG-12's alpha floor recomputed at the only alphas A-G81 permits, and the answer to 'which backdrop'",
  verdict: PROVENANCE.verdict,
  scope: "pure arithmetic over the committed modal medium rgb(6,12,17) and the source constant GAP_HUE rgb(245,166,35). No render, no raster, no server, no browser, no credential.",
  answerToGELB_whichBackdrop: {
    shortAnswer: "None — no raster measured it. The 0.329 figure is this lane's and it is a COMPUTATION, not a reading.",
    where: "outputs/pg12-leak-direction.json → whyTheMagnitudeFormFailed.exactCrossings.firstVisibleInRaster",
    backdropUsed: rgb(MEDIUM),
    backdropProvenance: "the modal medium triple, declared at gruen-pg12-direction.mjs:19 as MEASURED at both sizes; the composite is Math.round over it",
    whatTheSealedRasterActuallyContains: "SEALED-pg12-ratio-{1920x1080,1280x800}.json hold C* DISTRIBUTIONS — hueCarryingClassChroma, plainGlowChroma, mediumChroma and mediumOverHue. No alpha, no composite triple, no backdrop. The rescue hypothesis has nothing to attach to.",
    soTheRecordIsRightAndIAmWrong: "A-G131's withdrawal is correct and A-G209 does not land on GELB here. The defect is this lane's: a continuous-alpha sweep reported under a field called `firstVisibleInRaster`."
  },
  continuumFigureAsCommitted: continuum,
  quantisedUnderA_G81: quantised,
  whyGCannotStayAt12: { atFirstAchievableAlpha: "k = 1, α = 1/255 = 0.0039216", channels: channelAtKOne,
    mechanism: "G's exact value is 12.6039, fractional part 0.60, so G rounds to 13 at the same alpha code where R first rounds to 7. A pure-R step is unreachable: the two channels cross their rounding boundaries at different alphas and there is no alpha code between them." },
  diagnosisOfTheFloor: diagnosis,
  backdropSweep: { target: rgb(TARGET), backdropsTested: backdrops.length,
    backdropsReachingTarget: reaching.map(b => ({ backdrop: b.backdrop, atCode: b.atCode })),
    excludedAsDegenerate: "rgb(7, 12, 17) itself: a backdrop equal to the target is not a backdrop that reaches it, so the sweep starts at k = 1. The first version of this sweep started at k = 0 and listed the target among the reaching backdrops.",
    backdropsWithFirstStepNear0_329_ownFrame: nearFloorOwn.map(b => ({ backdrop: b.backdrop, firstStep: b.firstVisibleStepInOwnQProj })),
    backdropsWithFirstStepNear0_329_modalFrame: nearFloorModal.map(b => ({ backdrop: b.backdrop, firstStep: b.firstVisibleStepInModalQProj })),
    perBackdrop: backdrops },
  compositingDepth: twoStage,
  withdrawals: [
    "WITHDRAWN: `firstVisibleInRaster` α 0.00210 → rgb(7,12,17) at 0.329 q_proj, in outputs/pg12-leak-direction.json. It is a continuum figure at an alpha the renderer cannot apply, and its field name asserted a raster observation that never happened.",
    "WITHDRAWN: the same file's `rasterDetectionFloor` sentence, 'below about alpha 0.003 a leak is invisible to any metric because the triple does not change'. The true statement under A-G81 is that no alpha below 1/255 exists at all, so the floor is not 'about 0.003' and is not a property of the raster's colour resolution; it is the alpha ladder.",
    "CONFIRMED AS A CLASS, not a one-off: this is the same defect as the selectedGain erratum already declared this phase — a figure exact in the continuum and void at the quantised levels where it would be measured. Every alpha-swept figure in this lane is suspect until checked against the k/255 ladder, which is why gruen-colour.mjs now exports `achievableAlphas` and `compositeAtCode`: a derivation should not be able to sweep past the ladder by accident."
  ],
  openMeasurable: "Whether the gap glow's two alphas (gradient stop × group opacity) yield effective alphas below 1/255 is a property of the compositor, not of this arithmetic. Branch A leaves every figure above unchanged; branch B restores sub-quantum states and would make rgb(7,12,17) reachable after all. Settling it needs one rendered probe of a known two-alpha stack, which is blocked with the rest of the raster work. It is recorded as measurable, not resolved."
};
writeFileSync(resolve(here, "../outputs/pg12-alpha-quantisation.json"), JSON.stringify(out, null, 1));

console.log(`q_proj = ${qProj}   medium = ${rgb(MEDIUM)}   GAP_HUE = ${rgb(GAP_HUE)}\n`);
console.log(`continuum (as committed): α ${continuum.alpha} → ${continuum.triple} at ${continuum.inQProj} q_proj`);
for (const mode of ["round", "truncate"]) {
  const q = quantised[mode].firstVisibleState;
  console.log(`quantised (${mode.padEnd(8)}):  k=${q.k}, α ${q.alpha} → ${q.triple} at ${q.inQProj} q_proj`);
}
console.log("\nwhy G cannot stay at 12 at k=1:");
for (const c of channelAtKOne) console.log(`  ${c.channel}: ${c.from} → exact ${c.exact} (frac ${c.fractionalPart}) → rounds to ${c.rounds}`);
console.log(`\nfloor diagnosis: single-code R step ${diagnosis.singleCodeRStep} / q_proj ${qProj} = ${diagnosis.ratio}  (matches recorded 0.329: ${diagnosis.matchesTheRecordedFloor})`);
console.log(`backdrops reaching ${rgb(TARGET)} (k>=1): ${reaching.map(b => `${b.backdrop} @ k=${b.atCode}`).join(" · ") || "none"}`);
console.log(`first step near 0.329, OWN frame  : ${nearFloorOwn.map(b => `${b.backdrop} @ ${b.firstVisibleStepInOwnQProj}`).join(" · ") || "NONE"}`);
console.log(`first step near 0.329, MODAL frame: ${nearFloorModal.map(b => `${b.backdrop} @ ${b.firstVisibleStepInModalQProj}`).join(" · ") || "NONE"}`);
const b6_11_17 = backdrops.find(b => b.backdrop === "rgb(6, 11, 17)");
console.log(`\nrgb(6, 11, 17) in detail: first visible ${b6_11_17.firstVisibleTriple} at k=${b6_11_17.atCode ?? "?"}, own-frame step ${b6_11_17.firstVisibleStepInOwnQProj}, modal-frame step ${b6_11_17.firstVisibleStepInModalQProj}, its own q_proj ${b6_11_17.q_projAtThisBackdrop}`);
console.log(`\ntwo-stage branch B lowest visible effective α: ${JSON.stringify(twoStage.branchB.lowestVisibleEffectiveAlpha)}`);
console.log(`two-stage branch B reaches ${rgb(TARGET)}: ${JSON.stringify(twoStage.branchB.reachesRgb7_12_17)}`);
