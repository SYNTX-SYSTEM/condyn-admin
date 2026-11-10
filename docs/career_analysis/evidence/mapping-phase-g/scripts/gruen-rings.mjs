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
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  servedProvenance, PROVENANCE, CLASS_SELECTOR, SEMANTIC_CLASSES, RING_CLASSES, ringBandLuminance, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const spec = JSON.parse(readFileSync(resolve(here, "../../../../architecture/decision-fields/mapping-spec/layout-spec.json"), "utf8"));
/** The drawn stroke widths (PersonJobMappingField.tsx RING_WIDTH_PX); the shelf is a BAND and keeps its width. */
const STROKE_PX = { best: 2.4, field: 2.0, horizon: 2.0 };
const ALPHA = { shelf: 0.02, best: 0.085, field: 0.15, horizon: 0.25 };

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
const k = geo.unitsToPx;
const band = {
  shelf: [spec.rings.shelfNear * k, spec.rings.shelfFar * k],
  best: [spec.rings.bestFit * k - (STROKE_PX.best / 2 + 1.5), spec.rings.bestFit * k + (STROKE_PX.best / 2 + 1.5)],
  horizon: [spec.rings.horizon * k - (STROKE_PX.horizon / 2 + 1.5), spec.rings.horizon * k + (STROKE_PX.horizon / 2 + 1.5)],
  field: [spec.field.radius * k - (STROKE_PX.field / 2 + 1.5), spec.field.radius * k + (STROKE_PX.field / 2 + 1.5)]
};
const ladderOrder = ["shelf", "best", "field", "horizon"];
const measured = {};
for (const ring of ladderOrder) measured[ring] = { bandPx: band[ring].map(v => +v.toFixed(1)), specAlpha: ALPHA[ring], ...ringBandLuminance(base, geom, band[ring][0], band[ring][1]) };
await ctx.close(); await browser.close();

/** The ladder: each step against the one below it, on the engraved minimum (A-G45's statistic). */
const steps = [];
for (let i = 1; i < ladderOrder.length; i += 1) {
  const lo = measured[ladderOrder[i - 1]], hi = measured[ladderOrder[i]];
  const onMin = lo.engravedMin > 0 ? hi.engravedMin / lo.engravedMin : null;
  const onP50 = lo.p50 > 0 ? hi.p50 / lo.p50 : null;
  steps.push({ step: `${ladderOrder[i - 1]} → ${ladderOrder[i]}`, ratioOnEngravedMin: onMin === null ? null : +onMin.toFixed(3), ratioOnP50: onP50 === null ? null : +onP50.toFixed(3) });
}

const out = {
  reading: "GRÜN development reading · PF-15 inverted, limbs (a) budget and (b) ladder, measured jointly",
  verdict: PROVENANCE.verdict,
  priorBaseline: "NONE for limb (a) — A-G41 voided §12's 0.23. Limb (b) has PINK's phase-F readings on a different ground and a different statistic.",
  provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, region: `${clip.width}x${clip.height}`, discPixels, unitsToPx: +k.toFixed(5),
  definitions: {
    statistic: "A-G45: per angle the radial PEAK across the band, then the MINIMUM over 720 angles (the engraved minimum). A max would measure a body crossing the band — PINK's 0.58 shelf reading.",
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
  shelfRenderedLuminance_forTheStaleComment: {
    engravedMin: measured.shelf.engravedMin, p50: measured.shelf.p50,
    note: "A-G39(a): PersonJobMappingField.tsx:96–100 still records the pre-inversion ladder at shelf alpha 0.05. GELB's instruction is to correct that comment with the shelf's REAL rendered luminance when a measurement produces it, never with an invented number. This is that measurement — development grade, so the comment should cite it as GRÜN's development reading, not as a verdict."
  },
  pinkComparison: { source: "PINK phase-F rings (all-angles / ink-only closest-point)", pink_ratios: [1.636, 0.630, 0.861], note: "different ground, different statistic (closest-point, not engraved minimum); divergence is a finding (A-G36 point 4)" }
};
writeFileSync(resolve(here, `../outputs/rings-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ limbA: out.limbA_ringsShareOfSemanticLight, ladder: steps, engravedMin: Object.fromEntries(ladderOrder.map(r => [r, measured[r].engravedMin])) }, null, 1));
