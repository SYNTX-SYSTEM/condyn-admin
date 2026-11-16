/**
 * GRÜN · PHASE-G · A-G108's flag on rank 5, answered by set comparison.  **NO VERDICT** (A-G36 point 2).
 *
 * GELB flagged that rank 5's horizon-seat and field-seat drops were byte-identical at 0.02385, invoking this
 * lane's own §28 rule — identical figures across different conditions are a sampling-artifact signature — and
 * asked that it be looked at before rank 5 is cited for anything.
 *
 * My first hypothesis was that rank 5 sits equidistant between the two rings. THAT IS WRONG: the gaps are
 * 36.44 px (horizon) and 7.96 px (field) at 1280. So the identical drops are not a geometric symmetry, and
 * reasoning could not settle whether they were a coincidence or a bug.
 *
 * RESULT — removal sets compared element by element: 106 pixels removed by each, intersection 0, Jaccard 0.
 * Two completely DISJOINT sets of exactly equal size. A coincidence of count, not a shared-pixel bug. The
 * ring-seat attribute tags survive every run (checked), so the conditions were distinct throughout.
 * Both seats are 3.6 px wide: the horizon ring grazes the annulus near its outer edge (a long, shallow arc)
 * while the field ring passes inside the inner edge and crosses the band twice at a steeper angle — different
 * geometries whose pixel counts happen to coincide.
 *
 * NOTE on the absolute level: this probe does NOT exclude a body's own name and measure, which gruen-pg22-seats
 * does, so its occupancy reads higher (0.2795 against that run's 0.0877). Irrelevant to the set question —
 * both conditions are treated identically — but the two numbers are not comparable and should not be read as
 * contradicting each other.
 */
import { chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
         signAndSeatMask } from "./gruen-instrument.mjs";
const b = await chromium.launch();
const { ctx, page } = await openField(b, { reduce: true, vw: 1280, vh: 800 });
const geo = await probeGeometry(page), clip = clipOf(geo, 1280, 800), geom = discMask(clip, geo);
const { N, W, H } = geom, k = geo.unitsToPx;
const cdp = await cdpSession(page);
const tagged = await page.evaluate(() => {
  const out = {};
  for (const n of ["shelf", "best", "horizon", "field"]) {
    const ring = document.querySelector(`[data-testid="mapping-ring-${n}"]`);
    const r = ring.getAttribute("r");
    const seat = [...document.querySelectorAll("circle")].find(c => c !== ring && c.getAttribute("r") === r && /rgba\(0, 0, 0, 1\)/.test(c.getAttribute("stroke") ?? ""));
    if (seat) { seat.setAttribute("data-gruen-seat", n); out[n] = true; }
  }
  return out;
});
const SHELF_OFF = '[data-testid="mapping-ring-shelf"],[data-gruen-seat="shelf"]';
const r5 = geo.bodies.filter(x => x.inPool).find(x => x.rank === 5);
const rPx = r5.drawnRadiusUnits * k, bcx = r5.cx - clip.x, bcy = r5.cy - clip.y;
const inAnnulus = i => { const x = i % W, y = (i - x) / W; const d = Math.hypot(x - bcx, y - bcy) / rPx; return d >= 1.1 && d <= 2.6; };
const occSet = async hideSel => {
  await unhideAll(page, hideSel);
  const { covered } = await signAndSeatMask(page, cdp, clip, N, { exclude: ["glowsAll"], keepHidden: hideSel });
  await unhideAll(page, hideSel);
  const s = new Set();
  let ann = 0;
  for (let i = 0; i < N; i += 1) if (inAnnulus(i)) { ann += 1; if (covered[i]) s.add(i); }
  return { set: s, ann };
};
const base = await occSet(SHELF_OFF);
const noH = await occSet(`${SHELF_OFF},[data-gruen-seat="horizon"]`);
const noF = await occSet(`${SHELF_OFF},[data-gruen-seat="field"]`);
// attribute survival check
const stillTagged = await page.evaluate(() => ({ shelf: !!document.querySelector('[data-gruen-seat="shelf"]'), horizon: !!document.querySelector('[data-gruen-seat="horizon"]'), field: !!document.querySelector('[data-gruen-seat="field"]') }));
await ctx.close(); await b.close();
const removedH = [...base.set].filter(i => !noH.set.has(i));
const removedF = [...base.set].filter(i => !noF.set.has(i));
const inter = removedH.filter(i => removedF.includes(i));
console.log(JSON.stringify({
  tagged, stillTaggedAfterRuns: stillTagged,
  annulusPixels: base.ann,
  occBase: +(base.set.size / base.ann).toFixed(5), occNoHorizon: +(noH.set.size / noH.ann).toFixed(5), occNoField: +(noF.set.size / noF.ann).toFixed(5),
  removedByHorizon: removedH.length, removedByField: removedF.length,
  identicalSets: removedH.length === removedF.length && inter.length === removedH.length,
  intersection: inter.length,
  jaccard: +(inter.length / Math.max(1, new Set([...removedH, ...removedF]).size)).toFixed(4)
}, null, 1));
