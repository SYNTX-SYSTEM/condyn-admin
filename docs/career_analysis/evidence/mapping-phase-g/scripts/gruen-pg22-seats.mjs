/**
 * GRÜN · PHASE-G DEVELOPMENT READING · A-G99's discriminator: does PG-22's post-shelf residual track the
 * remaining RING SEATS?  **NO VERDICT** (A-G36 point 2).
 *
 * GELB (§31) read the seat widths: the shelf seat was BAND-scaled (fieldRadius − shelfNear ≈ 65 px at 1920)
 * while the other three are PIXEL-FLOORED — (RING_WIDTH_PX.{best,horizon,field} + SEAT_PAD_PX) × k ≈ 4.0 /
 * 3.6 / 3.6 px (`:926`, `:928`, `:930`) — a factor of sixteen, and they do NOT shrink with the stage. At 1280
 * a body's annulus spans 1.1…2.6 r ≈ 28 px radially, so one 4 px seat is ≈ 14 % of it and two crossing one
 * body would plausibly account for the 0.20494 / 0.21536 residual.
 *
 * If it holds, A-G23's premise was not wrong — it was MASKED by a term sixteen times larger that did not obey
 * it, and the post-shelf field may be close to 1/r after all. GELB is explicitly NOT reinstating A-G44 on that
 * reasoning; this is the measurement that would bring PG-22's form back to the table, or leave the flat bound
 * standing with the residual having another cause. Either outcome is one run.
 *
 * Conditions, all on top of option (3)'s condition C (shelf ring AND its seat suppressed):
 *   C_base            nothing further
 *   C_minus_best      + the best-fit ring's seat
 *   C_minus_horizon   + the horizon ring's seat
 *   C_minus_field     + the field ring's seat
 *   C_minus_allThree  + all three
 * Each ring seat carries no class and no data-* (A-G49's seven), so each is tagged by GEOMETRY: the circle
 * whose stroke is SEAT and whose r equals that ring's own r.
 *
 * Beside the measurement, a GEOMETRIC PREDICTION per body: a ring of radius R crosses a body's annulus iff
 * | d − R | ≤ 2.6 r, with d the body's eccentricity. Predicted crossings are reported next to the measured
 * drop, so "the residual tracks the seats" is a comparison and not an impression.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  signAndSeatMask, zeroByConstruction, servedProvenance, PROVENANCE, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1280), VH = Number(process.env.VH ?? 800);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h -- docs/career_analysis/evidence/mapping-phase-g/scripts`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, W, H } = geom;
const cdp = await cdpSession(page);
const k = geo.unitsToPx;
const zeroChannel = await zeroByConstruction(cdp, clip, N, disc);

/** Tag each ring's seat by geometry, and record the seat widths GELB read from the source. */
const seats = await page.evaluate(() => {
  const out = {};
  for (const name of ["shelf", "best", "horizon", "field"]) {
    const ring = document.querySelector(`[data-testid="mapping-ring-${name}"]`);
    if (ring === null) { out[name] = null; continue; }
    const r = ring.getAttribute("r");
    const seat = [...document.querySelectorAll("circle")].find(c => c !== ring && c.getAttribute("r") === r && /rgba\(0, 0, 0, 1\)/.test(c.getAttribute("stroke") ?? ""));
    if (seat === undefined) { out[name] = null; continue; }
    seat.setAttribute("data-gruen-seat", name);
    out[name] = { ringRadiusUnits: Number(r), ringStrokeUnits: Number(ring.getAttribute("stroke-width")), seatStrokeUnits: Number(seat.getAttribute("stroke-width")) };
  }
  return out;
});

const SHELF_OFF = '[data-testid="mapping-ring-shelf"],[data-gruen-seat="shelf"]';
const CONDITIONS = {
  C_base: SHELF_OFF,
  C_minus_best: `${SHELF_OFF},[data-gruen-seat="best"]`,
  C_minus_horizon: `${SHELF_OFF},[data-gruen-seat="horizon"]`,
  C_minus_field: `${SHELF_OFF},[data-gruen-seat="field"]`,
  C_minus_allThree: `${SHELF_OFF},[data-gruen-seat="best"],[data-gruen-seat="horizon"],[data-gruen-seat="field"]`
};

const drawn = geo.bodies.filter(b => b.inPool);
/** The geometric prediction: which ring circles cross each body's 1.1…2.6 r annulus. */
const prediction = drawn.map(b => {
  const rPx = b.drawnRadiusUnits * k;
  const d = Math.hypot(b.cx - geo.fieldCentre.x, b.cy - geo.fieldCentre.y);
  const crossings = {};
  for (const [name, s] of Object.entries(seats)) {
    if (s === null) { crossings[name] = null; continue; }
    const R = s.ringRadiusUnits * k, half = (s.seatStrokeUnits * k) / 2;
    const gap = Math.abs(d - R);
    crossings[name] = { crossesAnnulus: gap - half <= 2.6 * rPx && gap + half >= 0, gapPx: +gap.toFixed(2), seatWidthPx: +(s.seatStrokeUnits * k).toFixed(2),
      seatShareOfAnnulusRadially: +((s.seatStrokeUnits * k) / (1.5 * rPx)).toFixed(4) };
  }
  return { rank: b.rank, shelf: b.shelf, drawnRadiusPx: +rPx.toFixed(2), eccentricityPx: +d.toFixed(2), annulusRadialSpanPx: +(1.5 * rPx).toFixed(2), crossings };
});

const results = {};
for (const [name, hideSel] of Object.entries(CONDITIONS)) {
  await unhideAll(page, hideSel);
  const { covered } = await signAndSeatMask(page, cdp, clip, N, { exclude: ["glowsAll"], keepHidden: hideSel });
  await unhideAll(page, hideSel);
  const base = await captureLuminance(cdp, clip, N);
  const bodies = [];
  for (const b of drawn) {
    await hide(page, `[data-testid="mapping-name-${b.id}"],[data-testid="mapping-measure-${b.id}"]`);
    const woOwn = await captureLuminance(cdp, clip, N);
    await unhideAll(page, hideSel);
    const rPx = b.drawnRadiusUnits * k, inner = 1.1 * rPx, outer = 2.6 * rPx;
    const bcx = b.cx - clip.x, bcy = b.cy - clip.y;
    let ann = 0, occ = 0;
    for (let y = Math.floor(bcy - outer); y <= Math.ceil(bcy + outer); y += 1) for (let x = Math.floor(bcx - outer); x <= Math.ceil(bcx + outer); x += 1) {
      const d = Math.hypot(x - bcx, y - bcy);
      if (d < inner || d > outer || x < 0 || y < 0 || x >= W || y >= H) continue;
      ann += 1;
      const i = y * W + x;
      if (Math.abs(base[i] - woOwn[i]) > 0.001) continue;
      if (covered[i]) occ += 1;
    }
    bodies.push({ rank: b.rank, shelf: b.shelf, occupancy: ann ? +(occ / ann).toFixed(5) : null });
  }
  results[name] = { conditionSelector: hideSel, perBody: bodies };
}
await ctx.close(); await browser.close();

const occ = (cond, rank) => results[cond].perBody.find(b => b.rank === rank)?.occupancy ?? null;
const perBodyDrops = drawn.map(b => ({
  rank: b.rank, shelf: b.shelf,
  C_base: occ("C_base", b.rank),
  dropFrom_best: +(occ("C_base", b.rank) - occ("C_minus_best", b.rank)).toFixed(5),
  dropFrom_horizon: +(occ("C_base", b.rank) - occ("C_minus_horizon", b.rank)).toFixed(5),
  dropFrom_field: +(occ("C_base", b.rank) - occ("C_minus_field", b.rank)).toFixed(5),
  dropFrom_allThree: +(occ("C_base", b.rank) - occ("C_minus_allThree", b.rank)).toFixed(5),
  afterAllThree: occ("C_minus_allThree", b.rank),
  predictedCrossings: Object.entries(prediction.find(p => p.rank === b.rank).crossings).filter(([, v]) => v?.crossesAnnulus).map(([n]) => n)
}));
const out = {
  reading: "GRÜN development reading · A-G99's discriminator — does PG-22's post-shelf residual track the remaining ring seats?",
  verdict: PROVENANCE.verdict, provenance: { ...provenance, instrumentCommit }, instrument: PROVENANCE, guard,
  zeroByConstructionChannel: zeroChannel,
  viewport: `${VW}x${VH}`, unitsToPx: +k.toFixed(5),
  definitions: {
    conditions: "every condition sits on top of option (3)'s C — the shelf ring AND its seat suppressed — and adds one or all of the remaining ring seats. Each condition is threaded through every mask build via unhideAll(page, keep) (A-G100).",
    conditionsStatedPerFigure: "A-G100: each figure below names the condition it was taken under, not the condition the run was configured with",
    seatTagging: "no ring seat has a class or data-* (A-G49's seven), so each is tagged by geometry: the circle whose stroke is SEAT and whose r equals that ring's own r",
    prediction: "a ring of radius R crosses a body's annulus iff |d − R| ≤ 2.6 r, with d the body's eccentricity — reported beside the measured drop so 'the residual tracks the seats' is a comparison, not an impression",
    boundForReference: "PG-22 ≤ 0.20 per body (A-G93: flat, no 1/r law)",
    notReinstating: "A-G93 withdrew A-G44's 1/r form on measurement. This probe does not reinstate it; it tests whether the residual has a seat-shaped cause, which is what would bring the form back to the table WITH a measurement behind it."
  },
  seatGeometryFromRenderer: seats,
  geometricPrediction: prediction,
  perBodyDrops,
  conditions: results
};
writeFileSync(resolve(here, `../outputs/pg22-seats-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ viewport: `${VW}x${VH}`, zero: zeroChannel.measured, seatWidthsPx: Object.fromEntries(Object.entries(seats).map(([n, s]) => [n, s === null ? null : +(s.seatStrokeUnits * k).toFixed(2)])), perBodyDrops }, null, 1));
