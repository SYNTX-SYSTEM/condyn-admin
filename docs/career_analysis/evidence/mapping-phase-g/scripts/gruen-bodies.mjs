/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-3 (drawn body diameter in rendered px).  **NO VERDICT** (A-G36 p2).
 *
 * A-G41: §12's "PG-3 at 54 px" is void — measured on a vanished working tree. A-G24: V1.1's drawn range raise
 * IS built (drawn.min 34.2 / drawn.max 54.6, annotated "≥ 56 … ≤ 92 px at L0, 1920×1080") but the PIXEL is
 * unverified, and PG-3 stays OPEN. This is a first reading of the rendered diameter.
 *
 * Measured two ways, because they can disagree and the disagreement is the point: (1) from the model —
 * data-drawn-radius (field units) × the SVG's units→px scale; (2) from the render — the body shape element's
 * own client rectangle. A gap between them is the frame widening (PG-14 / frameWithBodies) changing k.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, openField, probeGeometry, clipOf, servedProvenance, PROVENANCE, stats } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const shapes = await page.evaluate(() => [...document.querySelectorAll("[data-mapping-body]")].map(e => {
  const shape = e.querySelector("[data-mapping-body-shape]");
  const r = shape === null ? null : shape.getBoundingClientRect();
  return { id: String(e.getAttribute("data-testid")).replace(/^mapping-body-/, ""), shapeW: r?.width ?? null, shapeH: r?.height ?? null };
}));
await ctx.close(); await browser.close();

const byId = new Map(shapes.map(s => [s.id, s]));
const k = geo.unitsToPx;
const bodies = geo.bodies.map(b => {
  const s = byId.get(b.id);
  return {
    id: b.id, rank: b.rank, tier: b.tier, shelf: b.shelf, inPool: b.inPool, sizeFloorApplied: b.sizeFloor, requiredGaps: b.requiredGaps,
    drawnRadiusUnits: b.drawnRadiusUnits,
    diameterPx_fromModel: +(2 * b.drawnRadiusUnits * k).toFixed(2),
    diameterPx_fromRenderedShape: s?.shapeW === null || s?.shapeW === undefined ? null : +s.shapeW.toFixed(2)
  };
});
const drawn = bodies.filter(b => b.inPool);
const modelDiams = drawn.map(b => b.diameterPx_fromModel);
const renderDiams = drawn.map(b => b.diameterPx_fromRenderedShape).filter(v => v !== null);

const out = {
  reading: "GRÜN development reading · PG-3 rendered drawn-body diameter",
  verdict: PROVENANCE.verdict,
  priorBaseline: "NONE — A-G41 voided §12's 54 px. PG-3 stays OPEN per A-G24. FIRST MEASUREMENT.",
  provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, region: `${clip.width}x${clip.height}`,
  svgCssWidthPx: +geo.svg.w.toFixed(2), viewBoxUnits: geo.viewBox, unitsToPx: +k.toFixed(5), level: geo.level, breath: geo.breath,
  definitions: {
    fromModel: "2 × data-drawn-radius (field units) × (svg CSS width ÷ viewBox width)",
    fromRenderedShape: "the [data-mapping-body-shape] element's own client rectangle width",
    specRange: "layout-spec-v1.1.json body.drawn 34.2 … 54.6 units, annotated '≥ 56 … ≤ 92 px diameter at L0, 1920×1080, with the frame widened to hold every drawn body whole (PG-14)'",
    whyTwoWays: "the frame widening (frameWithBodies, PG-14 as restated by A-G38(c)) changes k, so the spec's px annotation and the rendered px can diverge — A-G19's '~4 % shrink' prediction is about exactly this",
    drawnSet: "bodies with data-in-pool=true — the set the level actually draws (PG-5 budget ∩ PG-16 crowding)"
  },
  PG3_boundForReference: ">= 56 px diameter at 1920x1080 (<= 92 px)",
  drawnBodyCount: drawn.length, totalBodyCount: bodies.length,
  diameterPx_fromModel: stats(modelDiams), diameterPx_fromRenderedShape: stats(renderDiams),
  bodies
};
writeFileSync(resolve(here, `../outputs/bodies-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ drawn: drawn.length, unitsToPx: out.unitsToPx, modelDiamMin: out.diameterPx_fromModel.min, modelDiamMax: out.diameterPx_fromModel.max, renderDiamMin: out.diameterPx_fromRenderedShape.min, renderDiamMax: out.diameterPx_fromRenderedShape.max }, null, 1));
