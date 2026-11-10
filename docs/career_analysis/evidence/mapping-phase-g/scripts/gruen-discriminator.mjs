/**
 * GRÜN · PHASE-G DEVELOPMENT READING · A-G86's discriminator in the motion mode the anomaly was OBSERVED in.
 * **NO VERDICT** (A-G36 point 2).
 *
 * The inversion this lane reported — PG-1 rising 0.52215 → 0.54139 when the only product change was the shelf
 * alpha — was observed under `reducedMotion:reduce`. `gruen-pg1-live.mjs` runs A-G86's discriminator LIVE,
 * which is A-G61's normative mode but NOT the mode of the observation. A non-reproduction in the wrong mode
 * answers nothing, so this probe runs the same discriminator under `reduce`.
 *
 * The field is static under reduce (this instrument measures in-disc swing 0.000000 at both sizes), so one
 * frame per condition is exact and no period averaging is needed.
 *
 * The perturbation is a live style override of the shelf ring's stroke alpha between byte 5 (0.02) and byte 6
 * (0.022) on ONE build — controlled, where the original observation compared two different builds. If the two
 * disagree, that difference is itself the finding.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  servedProvenance, PROVENANCE, CLASS_SELECTOR, EMITTING_CLASSES, OCCLUDING_CLASSES, alphaRendersAs, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const sel = cs => cs.map(c => CLASS_SELECTOR[c]).join(",");
const EMIT = sel(EMITTING_CLASSES), OCCL = sel(OCCLUDING_CLASSES);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, discPixels } = geom;
const cdp = await cdpSession(page);

const setShelf = async a => {
  await page.evaluate(x => {
    document.querySelectorAll("style[data-shelf-alpha]").forEach(s => s.remove());
    const st = document.createElement("style");
    st.setAttribute("data-shelf-alpha", "1");
    st.textContent = `[data-testid="mapping-ring-shelf"]{stroke: rgba(205, 240, 255, ${x}) !important}`;
    document.head.appendChild(st);
  }, a);
  await page.waitForTimeout(400);
};
const discSum = async () => { const L = await captureLuminance(cdp, clip, N); let s = 0; for (let i = 0; i < N; i += 1) if (disc[i]) s += L[i]; return s; };
const sumWith = async (alpha, selector) => { if (selector !== null) await hide(page, selector); const v = await discSum(); if (selector !== null) await unhideAll(page); await setShelf(alpha); return v; };

const rows = {};
for (const alpha of [0.02, 0.022]) {
  await setShelf(alpha);
  const full = await sumWith(alpha, null);
  const hidEmit = await sumWith(alpha, EMIT);
  const hidOccl = await sumWith(alpha, OCCL);
  const hidBoth = await sumWith(alpha, `${EMIT},${OCCL}`);
  rows[String(alpha)] = {
    renders: alphaRendersAs(alpha),
    PG1_standard: +((full - hidEmit) / full).toFixed(5),
    PG1_occluderExcluded: +((hidOccl - hidBoth) / hidOccl).toFixed(5),
    discSums: { full: +full.toFixed(1), emittingSuppressed: +hidEmit.toFixed(1), occludersSuppressed: +hidOccl.toFixed(1), bothSuppressed: +hidBoth.toFixed(1) },
    discMeanLuminance: e4(full / discPixels)
  };
}
await ctx.close(); await browser.close();

const a1 = rows["0.02"], a2 = rows["0.022"];
const dStd = +(a2.PG1_standard - a1.PG1_standard).toFixed(5);
const dOcc = +(a2.PG1_occluderExcluded - a1.PG1_occluderExcluded).toFixed(5);
const out = {
  reading: "GRÜN development reading · A-G86's discriminator under reducedMotion:reduce — the mode the inversion was observed in",
  verdict: PROVENANCE.verdict, provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, motion: "reduce (static field; in-disc swing measured 0.000000, so one frame per condition is exact)",
  discPixels,
  definitions: {
    PG1_standard: "(ΣL_full − ΣL_emittingSuppressed) / ΣL_full over disc pixels",
    PG1_occluderExcluded: "A-G86: (ΣL_occlSuppressed − ΣL_occlAndEmittingSuppressed) / ΣL_occlSuppressed",
    perturbation: "live style override of the shelf ring's stroke alpha, byte 5 (0.02) → byte 6 (0.022), on ONE build",
    expectedDirection: "NEGATIVE — rings are excluded from the numerator and included in the denominator, so adding ring light should lower the share",
    carrierSetCaveat: "the emitting set here INCLUDES .mf-travel and .mf-beam-glow (A-G61). The original 0.52215 → 0.54139 observation used the superseded set without them, which is why the absolute values here are higher. Re-running the original pair would require resurrecting a definition that omits a semantic channel."
  },
  byShelfAlpha: rows,
  delta: { PG1_standard: dStd, PG1_occluderExcluded: dOcc },
  outcome: {
    inversionReproduced: dStd > 0,
    occluderMediated: dStd > 0 && dOcc <= 0,
    reading: dStd > 0
      ? "the inversion reproduces under the controlled perturbation"
      : "the inversion DOES NOT reproduce: both definitions move in the expected NEGATIVE direction, so the rise this lane reported is not attributable to the shelf alpha. A-G86's either/or is answered on its first limb — not occluder-mediated, and PG-1's definition does not need the joint-to-parts relationship stated on this evidence."
  }
};
writeFileSync(resolve(here, `../outputs/discriminator-reduce-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ viewport: out.viewport, standard: { "0.02": a1.PG1_standard, "0.022": a2.PG1_standard, delta: dStd }, occluderExcluded: { "0.02": a1.PG1_occluderExcluded, "0.022": a2.PG1_occluderExcluded, delta: dOcc }, inversionReproduced: out.outcome.inversionReproduced }, null, 1));
