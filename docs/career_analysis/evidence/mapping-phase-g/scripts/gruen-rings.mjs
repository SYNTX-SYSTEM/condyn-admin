/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PF-15 INVERTED, both limbs JOINTLY.  **NO VERDICT** (A-G36 point 2).
 *
 * A-G34: joint satisfiability is a prerequisite, not an expectation — (a) the rings' total ≤ 8 % of the
 * semantic light AND (b) ring-to-ring separation ≥ 1.6 must be measured TOGETHER, because the budget may
 * have constrained the very resource the separation needs.
 * A-G45: and the statistic must be the ENGRAVED MINIMUM, not a max or an area mean — PINK's shelf once read
 * 0.58 and that was a BODY crossing the 61 px annulus, so a max over a ring band measures the contaminant.
 * A-G41: §12's 0.23 is void as a measurement. This is a FIRST reading of limb (a) with no prior.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  servedProvenance, PROVENANCE, CLASS_SELECTOR, SEMANTIC_CLASSES, RING_CLASSES, ringBandLuminance, ringBandMasked, signAndSeatMask, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);

const sel = classes => classes.map(c => CLASS_SELECTOR[c]).join(",");
const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, discPixels } = geom;
const cdp = await cdpSession(page);

const discSum = async () => { const L = await captureLuminance(cdp, clip, N); let s = 0; for (let i = 0; i < N; i += 1) if (disc[i]) s += L[i]; return s; };
const removedBy = async selector => { await hide(page, selector); const s = await discSum(); await unhideAll(page); return s; };

/* ── limb (a): the rings' share of the SEMANTIC light ─────────────────────────────────────────────── */
const full = await discSum();
const semSuppressed = await removedBy(sel(SEMANTIC_CLASSES));
const ringsSuppressed = await removedBy(sel(RING_CLASSES));
const semanticLight = full - semSuppressed, ringsLight = full - ringsSuppressed;

/* ── limb (b): the ladder, on the engraved minimum, with the bodies DRAWN (no suppression) ─────────── */
const base = await captureLuminance(cdp, clip, N);
/** A-G65: the statistic is neither min nor max — exclude every sign and seat pixel, keep the signs DRAWN. */
const { covered, perClassPixels } = await signAndSeatMask(page, cdp, clip, N);
const k = geo.unitsToPx;
/**
 * The band of each ring is read from the RENDERER, not from this script's constants: each ring circle's own
 * `r` and `strokeWidth` (SVG user units) scaled by units→px. So the band IS the stroke the browser paints —
 * no padding, no assumption about RING_WIDTH_PX, and no local copy of the alphas to drift out of date (an
 * earlier version of this file carried `ALPHA.shelf = 0.02` and mislabelled a build serving 0.022).
 */
const ringDom = await page.evaluate(() => Object.fromEntries(["shelf", "best", "field", "horizon"].map(name => {
  const el = document.querySelector(`[data-testid="mapping-ring-${name}"]`);
  return [name, el === null ? null : {
    r: Number(el.getAttribute("r")),
    strokeWidthUnits: Number(el.getAttribute("stroke-width") ?? el.style.strokeWidth),
    alpha: Number(el.getAttribute("data-ring-luminance")),
    stroke: el.getAttribute("stroke")
  }];
})));
const band = {};
for (const [name, d] of Object.entries(ringDom)) {
  if (d === null) throw new Error(`ERR_INSTRUMENT_RING_ABSENT:${name}`);
  band[name] = [(d.r - d.strokeWidthUnits / 2) * k, (d.r + d.strokeWidthUnits / 2) * k];
}
const ladderOrder = ["shelf", "best", "field", "horizon"];
const measured = {};
for (const ring of ladderOrder) measured[ring] = {
  bandPx: band[ring].map(v => +v.toFixed(1)), bandIsStrokeExtent: true,
  fromRenderer: { r: ringDom[ring].r, strokeWidthUnits: ringDom[ring].strokeWidthUnits, strokeWidthPx: +(ringDom[ring].strokeWidthUnits * k).toFixed(2), alpha: ringDom[ring].alpha, stroke: ringDom[ring].stroke },
  /** A-G65's figure, and the one the ladder uses. */
  masked: ringBandMasked(base, geom, band[ring][0], band[ring][1], covered),
  /** The superseded extremum form, kept beside it so the two statistics can be compared rather than argued. */
  supersededExtrema: ringBandLuminance(base, geom, band[ring][0], band[ring][1])
};
await ctx.close(); await browser.close();

/** The ladder: each step against the one below it, on the engraved minimum (A-G45's statistic). */
const steps = [];
for (let i = 1; i < ladderOrder.length; i += 1) {
  const lo = measured[ladderOrder[i - 1]], hi = measured[ladderOrder[i]];
  const onMasked = lo.masked.pooledMedian > 0 ? hi.masked.pooledMedian / lo.masked.pooledMedian : null;
  const onMinSuperseded = lo.supersededExtrema.engravedMin > 0 ? hi.supersededExtrema.engravedMin / lo.supersededExtrema.engravedMin : null;
  steps.push({ step: `${ladderOrder[i - 1]} → ${ladderOrder[i]}`, ratioOnMaskedMedian: onMasked === null ? null : +onMasked.toFixed(3), ratioOnEngravedMin_SUPERSEDED: onMinSuperseded === null ? null : +onMinSuperseded.toFixed(3) });
}

const out = {
  reading: "GRÜN development reading · PF-15 inverted, limbs (a) budget and (b) ladder, measured jointly",
  verdict: PROVENANCE.verdict,
  priorBaseline: "NONE for limb (a) — A-G41 voided §12's 0.23. Limb (b) has PINK's phase-F readings on a different ground and a different statistic.",
  provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, region: `${clip.width}x${clip.height}`, discPixels, unitsToPx: +k.toFixed(5),
  definitions: {
    statistic: "A-G65: per-angle MEDIAN over band pixels no SIGN and no SEAT covers, signs kept drawn; the ring's figure is the pooled median and the distribution is always published. min() and max() are BOTH superseded: max() caught a crossing body (PINK's 0.58), min() caught a crossing opaque seat (pure rgb(0,0,0) over ~1% of angles). The engraved minimum is retained in `supersededExtrema` for comparison only.",
    signsDrawn: "defect nineteen's remedy: suppression does not isolate the medium, so every sign stays drawn and is excluded by mask instead.",
    limbA: "(ΣL_full − ΣL_ringsSuppressed) / (ΣL_full − ΣL_semanticsSuppressed) — the rings' light as a share of the semantic light (A-G5 limb a, bound ≤ 0.08)",
    limbB: "ring-to-ring ratio on the engraved minimum, ladder shelf → best → field → horizon (A-G5 limb b, bound ≥ 1.6 per step)",
    bodiesDrawn: "the bodies are DRAWN, not suppressed: the engraved minimum is what makes that safe, and suppressing them would change the ground the rings sit on",
    jointness: "A-G34 — both limbs from ONE run, so a declaration of mutual unsatisfiability would rest on one state of the field"
  },
  limbA_ringsShareOfSemanticLight: +(ringsLight / Math.max(1e-12, semanticLight)).toFixed(5),
  limbA_boundForReference: "<= 0.08",
  limbA_sums: { full: e4(full), semanticLight: e4(semanticLight), ringsLight: e4(ringsLight) },
  limbB_ladder: steps,
  limbB_boundForReference: ">= 1.6 per step",
  perRing: measured,
  signAndSeatMaskPixels: perClassPixels,
  shelfCompositedOverItsOwnBlackSeat: {
    note: "The shelf ring is NOT composited over the stage plate. A black seat circle of the SAME geometry (:882) is painted immediately before it, so the band is pure black beneath the ring and rgba(INK, alpha) composites over rgb(0,0,0), not over rgb(3,5,8). Measured radial profile at 1920: the band reads 1.45e-3 with the ring and ~0 without it (+1.5e-3 contribution at every sampled radius 435…495), and the ring contributes light at 718 of 720 angles. At alpha 0.02 that lands on 0.0014531 against the plate's 0.00145432 — luminance-identical to within 1.2e-6 BY COINCIDENCE, not because the ring is missing.",
    consequence: "the shelf band renders at the stage ground's luminance at EVERY angle, which is systematic rather than the single dark angle this lane first reported"
  },
  shelfRenderedLuminance_forTheStaleComment: {
    engravedMin: measured.shelf.engravedMin, p50: measured.shelf.p50,
    note: "A-G39(a): PersonJobMappingField.tsx:96–100 still records the pre-inversion ladder at shelf alpha 0.05. GELB's instruction is to correct that comment with the shelf's REAL rendered luminance when a measurement produces it, never with an invented number. This is that measurement — development grade, so the comment should cite it as GRÜN's development reading, not as a verdict."
  },
  pinkComparison: { source: "PINK phase-F rings (all-angles / ink-only closest-point)", pink_ratios: [1.636, 0.630, 0.861], note: "different ground, different statistic (closest-point, not engraved minimum); divergence is a finding (A-G36 point 4)" }
};
writeFileSync(resolve(here, `../outputs/rings-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ limbA: out.limbA_ringsShareOfSemanticLight, ladder: steps, engravedMin: Object.fromEntries(ladderOrder.map(r => [r, measured[r].engravedMin])) }, null, 1));
