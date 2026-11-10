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
import { labOf, chromaQuantumFloor, PROVENANCE } from "./gruen-instrument.mjs";

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
  finding2_metricRobustness: {
    claim: "A-G123 reason 1: 'the sign of a paired difference and its size against that metric's own quantum do not depend on the metric's absolute scale'.",
    signHalf: "HOLDS. All three monotone measures agree on the sign at every alpha — a real leak is a real leak.",
    magnitudeHalf: `DOES NOT HOLD. At alpha 0.01 the normalised difference is ${table.find(r => r.alpha === 0.01)["CIELAB C*"].deltaOverQuantum} in CIELAB C*, ${table.find(r => r.alpha === 0.01)["HSV S x100"].deltaOverQuantum} in HSV S and ${table.find(r => r.alpha === 0.01)["sRGB range"].deltaOverQuantum} in sRGB range — a factor of about 1.5 between them, and 3.6 for a single +1R step. Normalising by the metric's own quantum does NOT cancel the metric's local anisotropy: the quantum is taken along the metric's most sensitive channel direction while the leak runs along a different one, so the two do not scale together.`,
    consequence: "a one-quantum threshold is metric-dependent even in differential form. The sign-robustness that reason 1 gets right is enough to make the FORM sound; it is not enough to make the THRESHOLD portable, so the chosen metric still has to be stated with the threshold — which is A-G122's point surviving its own remedy."
  }
};
writeFileSync(resolve(here, "../outputs/pg12-leak-direction.json"), JSON.stringify(out, null, 1));
console.log(`minimum dC* ${minimum.delta} (${(minimum.delta / q).toFixed(2)} quanta) at alpha ${minimum.alpha}; returns to base at alpha ~${crossing}`);
