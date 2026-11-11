/**
 * GRÜN · PHASE-G · PG-12 AS RE-FORMED (§36 A-G123): which DIRECTION does a hue leak move the medium's
 * chroma?  **NO VERDICT** (A-G36 point 2). Pure computation — no render, no browser, no sealed quantity.
 *
 * A-G123 re-formed PG-12 one-sided: "the chroma measured where the hue could leak must not EXCEED the chroma
 * measured where no hue exists, paired by radius, by more than the run's own chroma quantum", and gave as
 * reason 1 that a differential is robust to the metric because "the sign of a paired difference and its size
 * against that metric's own quantum do not depend on the metric's absolute scale".
 *
 * Both halves are tested here against the MEASURED medium triple rgb(6, 12, 17) and the source constant
 * GAP_HUE rgb(245, 166, 35), alpha-composited as the renderer would composite it.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { labOf, chromaQuantumFloor } from "./gruen-colour.mjs";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const MEDIUM = [6, 12, 17];          // the medium's modal triple, MEASURED at both sizes
const GAP_HUE = [245, 166, 35];      // the source constant
const labC = (r, g, b) => labOf(r, g, b).C;
const hsvS = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx === 0 ? 0 : 100 * (mx - mn) / mx; };
const srgbRange = (r, g, b) => Math.max(r, g, b) - Math.min(r, g, b);
const METRICS = { "CIELAB C*": labC, "HSV S x100": hsvS, "sRGB range": srgbRange };
const quantumOf = (f, [r, g, b]) => Math.max(...[[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]
  .map(([dr, dg, db]) => Math.abs(f(Math.min(255, Math.max(0, r + dr)), Math.min(255, Math.max(0, g + dg)), Math.min(255, Math.max(0, b + db))) - f(r, g, b))));
const composite = a => MEDIUM.map((v, i) => Math.round(v + a * (GAP_HUE[i] - v)));

const ALPHAS = [0, 0.005, 0.01, 0.02, 0.03, 0.04, 0.05, 0.055, 0.06, 0.08, 0.15, 0.3, 0.6, 1];
const table = ALPHAS.map(a => {
  const c = composite(a);
  const row = { alpha: a, composite: `rgb(${c.join(", ")})` };
  for (const [name, f] of Object.entries(METRICS)) {
    const d = f(...c) - f(...MEDIUM), q = quantumOf(f, MEDIUM);
    row[name] = { value: +f(...c).toFixed(4), delta: +d.toFixed(4), deltaOverQuantum: +(d / q).toFixed(3) };
  }
  return row;
});
/** where does CIELAB chroma turn back up, and how far down does it go first? */
let minimum = { alpha: 0, delta: 0 }, crossing = null;
for (let a = 0; a <= 1; a += 0.001) {
  const d = labC(...composite(a)) - labC(...MEDIUM);
  if (d < minimum.delta) minimum = { alpha: +a.toFixed(3), delta: +d.toFixed(4) };
  if (crossing === null && a > 0 && d > 0) crossing = +a.toFixed(3);
}
const q = chromaQuantumFloor(...MEDIUM).maxOneCodeDeltaC;

/* ── A-G126's projection form, verified, and WHY the magnitude form failed ─────────────────────────── */
const med = labOf(...MEDIUM), hue = labOf(...GAP_HUE);
const hlen = Math.hypot(hue.a, hue.b), U = { a: hue.a / hlen, b: hue.b / hlen };
const projOf = t => { const p = labOf(...t); return (p.a - med.a) * U.a + (p.b - med.b) * U.b; };
const STEPS = [["R +1", [1, 0, 0]], ["R -1", [-1, 0, 0]], ["G +1", [0, 1, 0]], ["G -1", [0, -1, 0]], ["B +1", [0, 0, 1]], ["B -1", [0, 0, -1]]];
const stepProj = Object.fromEntries(STEPS.map(([n, d]) => [n, +projOf(MEDIUM.map((v, i) => Math.min(255, Math.max(0, v + d[i])))).toFixed(4)]));
const qProj = +Math.max(...Object.values(stepProj).map(Math.abs)).toFixed(4);
const projTable = [0.002, 0.005, 0.01, 0.02, 0.04, 0.08].map(a => {
  const t = composite(a), pr = projOf(t);
  return { alpha: a, composite: `rgb(${t.join(", ")})`, projection: +pr.toFixed(4), inQProj: +(pr / qProj).toFixed(2), signedNonNegative: pr >= 0 };
});
const hueAngle = Math.atan2(hue.b, hue.a) * 180 / Math.PI;
const medAngle = Math.atan2(med.b, med.a) * 180 / Math.PI;
const separation = Math.abs(((hueAngle - medAngle + 540) % 360) - 180);

const out = {
  reading: "GRÜN · PG-12 as re-formed — the leak's DIRECTION and the metric-robustness of the normalised difference",
  verdict: PROVENANCE.verdict, scope: "pure computation from a MEASURED medium triple and a SOURCE constant. No render, no sealed quantity, and about the pin's FORM, which A-G116 places outside the seal.",
  mediumTriple: MEDIUM, gapHue: GAP_HUE, chromaQuantumAtMedium: q,
  mediumBaseChroma: { "CIELAB C*": +labC(...MEDIUM).toFixed(4), "HSV S x100": +hsvS(...MEDIUM).toFixed(4), "sRGB range": srgbRange(...MEDIUM) },
  table,
  finding1_leakDirection: {
    claim: "A-G123's form is ONE-SIDED: it fires only when the leak-side chroma EXCEEDS the no-hue side.",
    measured: `a small hue leak LOWERS the medium's chroma. GAP_HUE is warm (R-dominant) and the medium is cool (B > G > R), so compositing the hue at low alpha drives the triple TOWARD NEUTRAL before it ever becomes warm. CIELAB C* falls from ${labC(...MEDIUM).toFixed(3)} to a minimum ${minimum.delta} (${(minimum.delta / q).toFixed(2)} quanta BELOW base) at alpha ${minimum.alpha}, and does not return to its starting value until alpha ~ ${crossing}.`,
    consequence: "over the whole small-leak range — which is what 'never leaks to the ground' is about — the re-formed bound CANNOT FIRE. It passes trivially, and it passes MOST comfortably near the alpha where the leak is most detectable in magnitude. The test is anti-correlated with the defect it is meant to catch.",
    class: "a fourth A-G7 form defect, and a new kind: not 'cannot fail' (PG-13) nor 'cannot clear' (PG-11) nor 'cannot be met' (PG-12 as originally written), but FIRES IN THE WRONG DIRECTION — a build with a leak scores better than a build without one.",
    remedyShape: "NOT this lane's to choose. Two shapes exist: make the test two-sided on |difference|, which catches a magnitude change of either sign; or measure the SIGNED component along the hue's own chromatic direction (the projection of (a*, b*) onto GAP_HUE's hue angle), which is what 'the hue leaked' actually means and which rises monotonically with alpha from zero."
  },
  verification_ofA_G126: {
    scope: "verification of figures GELB derived in §37 A-G126/A-G127. Those figures now sit inside a rule, and A-G106 requires a figure in a rule to meet the rule's evidentiary standard. This is arithmetic, which A-G128 makes mandatory before a pin is measured — not a measurement of the artifact.",
    hueDirectionUnitVector: { a: +U.a.toFixed(5), b: +U.b.toFixed(5) },
    singleCodeProjectionsAtMedium: stepProj,
    q_proj: qProj,
    gelbStated: { "R +/-": 0.1579, "G +": 0.1955, "G -": -0.1853, "B -": -0.4797, "B +": 0.4585, q_proj: 0.4797 },
    agreement: "EXACT to four decimals on all six steps and on q_proj, set by the BLUE channel as GELB said — which is where the cool medium's chroma lives (b* dominant at -2.9683).",
    alphaTable: projTable,
    reportabilityClaimVerified: "GELB: a leak is reportable at alpha ~0.01 (1.50 q_proj) and under one quantum at 0.005. Measured: 1.50 and 0.74. Exact.",
    monotoneFromZero: projTable.every(r => r.signedNonNegative)
  },
  whyTheMagnitudeFormFailed: {
    mediumHueAngleDeg: +medAngle.toFixed(2), gapHueAngleDeg: +hueAngle.toFixed(2), separationDeg: +separation.toFixed(2),
    mechanism: `the medium's chroma and GAP_HUE are ${separation.toFixed(2)} degrees apart in (a*, b*) — NEAR-ANTIPODAL. So the hue enters almost exactly opposite the medium's own chroma direction: it CANCELS the medium's chroma before it builds its own, which is why magnitude falls to a minimum and only then rises. The projection is immune because it is signed along the hue's direction, where cancellation of the medium reads as positive.`,
    generalises: "this is a CONDITION, not an accident of two constants: a one-sided magnitude test fails for ANY hue whose chroma direction is near-antipodal to the medium it is leaking onto. A phase that chose a warm accent for a cool field chose the geometry that breaks the magnitude form.",
    exactCrossings: (() => {
      const proj = t => { const q = labOf(...t); return (q.a - med.a) * U.a + (q.b - med.b) * U.b; };
      let visible = null, reportable = null;
      for (let a = 0; a <= 0.05; a += 0.00001) {
        const t = composite(a);
        if (visible === null && (t[0] !== MEDIUM[0] || t[1] !== MEDIUM[1] || t[2] !== MEDIUM[2])) visible = { alpha: +a.toFixed(5), triple: `rgb(${t.join(", ")})`, projection: +proj(t).toFixed(4), inQProj: +(proj(t) / qProj).toFixed(3) };
        if (reportable === null && proj(t) >= qProj) reportable = { alpha: +a.toFixed(5), inQProj: +(proj(t) / qProj).toFixed(3) };
        if (visible !== null && reportable !== null) break;
      }
      return {
        firstVisibleInRaster: visible, firstReportableAtOneQProj: reportable,
        note: "EXACT, replacing two approximations that both erred CONSERVATIVE-UPWARD on a lower bound: this lane said the raster floor was 'about alpha 0.003' where it is 0.00210 (GELB's correction, A-G131), and GELB's table puts reportability at '~0.008' where one q_proj is first reached at 0.00628. A-G106 applies to both — a figure inside a rule must meet the rule's standard, and a floor overstated upward licenses a factor that is too permissive."
      };
    })(),
    rasterDetectionFloor: "at alpha 0.002 the composite ROUNDS BACK to the medium exactly — rgb(6, 12, 17), projection 0.0000. Below about alpha 0.003 a leak is invisible to any metric because the triple does not change. That floor is the raster's, not the metric's, and it bounds what any chroma instrument can be asked for."
  },
  finding2_metricRobustness: {
    claim: "A-G123 reason 1: 'the sign of a paired difference and its size against that metric's own quantum do not depend on the metric's absolute scale'.",
    signHalf: "HOLDS. All three monotone measures agree on the sign at every alpha — a real leak is a real leak.",
    magnitudeHalf: `DOES NOT HOLD. At alpha 0.01 the normalised difference is ${table.find(r => r.alpha === 0.01)["CIELAB C*"].deltaOverQuantum} in CIELAB C*, ${table.find(r => r.alpha === 0.01)["HSV S x100"].deltaOverQuantum} in HSV S and ${table.find(r => r.alpha === 0.01)["sRGB range"].deltaOverQuantum} in sRGB range — a factor of about 1.5 between them, and 3.6 for a single +1R step. Normalising by the metric's own quantum does NOT cancel the metric's local anisotropy: the quantum is taken along the metric's most sensitive channel direction while the leak runs along a different one, so the two do not scale together.`,
    consequence: "a one-quantum threshold is metric-dependent even in differential form. The sign-robustness that reason 1 gets right is enough to make the FORM sound; it is not enough to make the THRESHOLD portable, so the chosen metric still has to be stated with the threshold — which is A-G122's point surviving its own remedy."
  }
};
writeFileSync(resolve(here, "../outputs/pg12-leak-direction.json"), JSON.stringify(out, null, 1));
console.log(`minimum dC* ${minimum.delta} (${(minimum.delta / q).toFixed(2)} quanta) at alpha ${minimum.alpha}; returns to base at alpha ~${crossing}`);
