/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-22 occupancy, per body (A-G44).  **NO VERDICT** (A-G36 point 2).
 *
 * A-G23 set 20 % at 1920 and scaled it by a FIXTURE MEAN (34.9 px → 18.8 px = 1.86 ×). A-G44 withdrew that:
 * the mean over drawn bodies depends on the pool's weightSum distribution while ρ_drawn spans 34.2…54.6, so
 * 1.86 was not geometric — and it is not the viewport ratio 1.5 either. **The bound is stated per body,
 * share ∝ 1/r_drawn, against each body's own drawn radius, 20 % anchored at the 1920 reference.** The annulus
 * stays 1.1 … 2.6 r and a body's own name and measure are excluded.
 *
 * WHAT THIS PROBE WILL NOT DO: invent the anchor. "20 % anchored at the 1920 reference body" does not pick a
 * radius out of the text — the reference could be the largest drawn body, the rank-1 body, or a nominal
 * ρ_drawn — and A-G44 withdrew the mean precisely because a fixture-dependent anchor is not geometric. So this
 * reports the MEASURED occupancy per body, the invariant `occupancy × r_drawn` that is constant iff the share
 * really goes as 1/r, and the bound each candidate anchor would imply. GELB names the anchor; the instrument
 * does not (A-G64).
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  classMasks, EMITTING_CLASSES, OCCLUDING_CLASSES, RING_CLASSES, signAndSeatMask, servedProvenance, PROVENANCE, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const ANNULUS = [1.1, 2.6];          // A-G23/A-G44: a body's own outline band and its seat are figure on the rim
const ANCHOR_SHARE = 0.20;           // 20 % at the 1920 reference

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { N, W, H } = geom;
const cdp = await cdpSession(page);
const base = await captureLuminance(cdp, clip, N);
/**
 * THE RAMP IS NOT AN OCCUPIER OF ITSELF. `glowsAll` is excluded from the occupying mask: the halo circle's own
 * radius IS 2.6 … 3.0 × r (VOLUME.haloNear/haloFar), so as a filled gradient disc it covers the WHOLE
 * 1.1 … 2.6 r annulus. Including it read occupancy at 0.80 … 0.88 — the ramp occluding itself — against a
 * 20 % bound. A-G18's purpose for PG-22 is that "a ramp cut to pieces stops being read as a ramp", so the
 * occupiers are the signs and seats standing ON the ramp. The relation carriers (beam, its glow, its travel)
 * stay IN: they cross a body's ramp and are figure on it, not part of it.
 */
const { covered } = await signAndSeatMask(page, cdp, clip, N, { exclude: ["glowsAll"] });
/** Per-class masks so the occupancy can be ATTRIBUTED rather than inferred — rings included, since the
 *  scaffold crosses a body's ramp even though it is not in the sign/seat mask. */
const occupierClasses = [...EMITTING_CLASSES.filter(c => c !== "glowsAll"), ...OCCLUDING_CLASSES, ...RING_CLASSES];
const { masks: occMasks } = await classMasks(page, cdp, clip, N, occupierClasses);
const classFlag = {};
for (const c of occupierClasses) { const f = new Uint8Array(N); for (const i of occMasks[c]) f[i] = 1; classFlag[c] = f; }
const k = geo.unitsToPx;

const drawn = geo.bodies.filter(b => b.inPool);

/**
 * A-G103, binding on both lanes: a PG-22 record states its own run-to-run variation, and no overage under
 * 2 × it is reported as a failure. The figure came from this instrument reading the SAME conditions twice —
 * C_base 0.19426 / 0.21596 against option (3)'s C 0.20494 / 0.21536 — so the resolution is ≈ ±0.01 and it
 * belongs in the record rather than in a message about the record. The second pass rebuilds the mask from
 * scratch, because the mask is where the variation comes from: the differential threshold sits at 0.001 and
 * an opaque seat brightening what lies beneath it moves which pixels clear it.
 */
const occupancyPass = async () => {
  const { covered: cov } = await signAndSeatMask(page, cdp, clip, N, { exclude: ["glowsAll"] });
  const b0 = await captureLuminance(cdp, clip, N);
  const rows = [];
  for (const b of drawn) {
    await hide(page, `[data-testid="mapping-name-${b.id}"],[data-testid="mapping-measure-${b.id}"]`);
    const woOwn = await captureLuminance(cdp, clip, N);
    await unhideAll(page);
    const rPx = b.drawnRadiusUnits * k, inner = 1.1 * rPx, outer = 2.6 * rPx;
    const bcx = b.cx - clip.x, bcy = b.cy - clip.y;
    let ann = 0, occ = 0;
    for (let y = Math.floor(bcy - outer); y <= Math.ceil(bcy + outer); y += 1) for (let x = Math.floor(bcx - outer); x <= Math.ceil(bcx + outer); x += 1) {
      const d = Math.hypot(x - bcx, y - bcy);
      if (d < inner || d > outer || x < 0 || y < 0 || x >= W || y >= H) continue;
      ann += 1;
      const i = y * W + x;
      if (Math.abs(b0[i] - woOwn[i]) > 0.001) continue;
      if (cov[i]) occ += 1;
    }
    rows.push({ rank: b.rank, occupancy: ann ? occ / ann : null });
  }
  return rows;
};
const passA = await occupancyPass();
const passB = await occupancyPass();
const variation = passA.map((r, i) => ({ rank: r.rank, passA: +r.occupancy.toFixed(5), passB: +passB[i].occupancy.toFixed(5), delta: +Math.abs(r.occupancy - passB[i].occupancy).toFixed(5) }));
const maxVariation = Math.max(...variation.map(v => v.delta));

const perBody = [];
for (const b of drawn) {
  /** This body's OWN name and measure, by differential suppression — excluded from its own annulus (A-G23). */
  const ownSel = `[data-testid="mapping-name-${b.id}"],[data-testid="mapping-measure-${b.id}"]`;
  await hide(page, ownSel);
  const withoutOwn = await captureLuminance(cdp, clip, N);
  await unhideAll(page);
  const own = new Uint8Array(N);
  for (let i = 0; i < N; i += 1) if (Math.abs(base[i] - withoutOwn[i]) > 0.001) own[i] = 1;

  const rPx = b.drawnRadiusUnits * k;
  const inner = ANNULUS[0] * rPx, outer = ANNULUS[1] * rPx;
  const bcx = b.cx - clip.x, bcy = b.cy - clip.y;
  let annulus = 0, occupied = 0, ownInAnnulus = 0, offRegion = 0;
  const byClass = {};
  const x0 = Math.floor(bcx - outer), x1 = Math.ceil(bcx + outer), y0 = Math.floor(bcy - outer), y1 = Math.ceil(bcy + outer);
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) {
    const d = Math.hypot(x - bcx, y - bcy);
    if (d < inner || d > outer) continue;
    if (x < 0 || y < 0 || x >= W || y >= H) { offRegion += 1; continue; }
    annulus += 1;
    const i = y * W + x;
    if (own[i]) { ownInAnnulus += 1; continue; }        // a body's own figure, excluded by A-G23
    if (covered[i]) occupied += 1;
    for (const c of occupierClasses) if (classFlag[c][i]) byClass[c] = (byClass[c] ?? 0) + 1;
  }
  const occupancy = annulus === 0 ? null : occupied / annulus;
  perBody.push({
    id: b.id, rank: b.rank, shelf: b.shelf, sizeFloorApplied: b.sizeFloor,
    drawnRadiusPx: +rPx.toFixed(2), annulusPx: [+inner.toFixed(1), +outer.toFixed(1)],
    annulusPixels: annulus, pixelsOutsideRegion: offRegion,
    annulusTruncated: offRegion > 0, truncatedFraction: +(offRegion / Math.max(1, annulus + offRegion)).toFixed(4),
    ownNameAndMeasurePixelsExcluded: ownInAnnulus,
    occupiedBySignsAndSeats: occupied,
    occupancy: occupancy === null ? null : +occupancy.toFixed(5),
    /** Constant across bodies iff the share really goes as 1/r_drawn — the claim A-G44 makes. */
    occupancyTimesRadiusPx: occupancy === null ? null : +(occupancy * rPx).toFixed(4),
    /** Which class occupies the ramp, as a share of the annulus. Not summands (A-G60) — classes overlap. */
    occupancyByClass_notSummands: Object.fromEntries(Object.entries(byClass).sort((a, b) => b[1] - a[1]).map(([c, n]) => [c, +(n / Math.max(1, annulus)).toFixed(5)]))
  });
}
await ctx.close(); await browser.close();

const valid = perBody.filter(b => b.occupancy !== null && !b.annulusTruncated);
const inv = valid.map(b => b.occupancyTimesRadiusPx);
const radii = valid.map(b => b.drawnRadiusPx);
const anchors = {
  largestDrawnBody: Math.max(...radii, 0),
  smallestDrawnBody: Math.min(...radii, 0),
  rank1Body: (perBody.find(b => b.rank === 1) ?? {}).drawnRadiusPx ?? null,
  specDrawnMaxUnits54_6: +(54.6 * k).toFixed(2),
  specDrawnMinUnits34_2: +(34.2 * k).toFixed(2)
};
const out = {
  reading: "GRÜN development reading · PG-22 occupancy per body, annulus 1.1…2.6 r, own name and measure excluded",
  verdict: PROVENANCE.verdict, provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, unitsToPx: +k.toFixed(5), drawnBodies: drawn.length,
  definitions: {
    annulus: "1.1 … 2.6 × the body's DRAWN radius (A-G23: a body's own outline band and its seat are figure on the rim, not interruptions of the ramp)",
    occupancy: "pixels covered by any sign or seat ÷ annulus pixels, with THIS body's own name and measure removed first (A-G23's exclusion; a label is the body's own figure and moving it out would tear name from body)",
    coveredMask: "the sign AND seat mask, built differentially under reducedMotion:reduce with every sign kept drawn (A-G65 / defect nineteen), EXCLUDING glowsAll — the glow IS the ramp (its circle's radius is 2.6…3.0 r, so as a filled disc it covers the whole annulus) and cannot occupy itself. Relation carriers stay in: they cross the ramp as figure.",
    boundForm: "A-G44: per body, share ∝ 1/r_drawn, 20 % anchored at the 1920 reference. The fixture-mean 1.86 × form is withdrawn.",
    anchorNotChosenHere: "A-G44's phrase does not determine WHICH radius is the 1920 reference, and a fixture-dependent anchor is what A-G44 withdrew. Candidates are reported; the anchor is GELB's to name (A-G64).",
    invariant: "occupancy × r_drawn is constant across bodies iff the share really goes as 1/r — this is the testable content of A-G44's form, independent of the anchor"
  },
  ANCHOR_SHARE, annulusFactors: ANNULUS,
  runToRunVariation: {
    perBody: variation, maxDelta: +maxVariation.toFixed(5),
    reportableFailureThreshold: +(2 * maxVariation).toFixed(5),
    rule: "A-G103: no overage under 2 × this is reported as a failure by either lane. Two independent passes over identical conditions, each rebuilding the mask.",
    priorCrossRunEvidence: "C_base 0.19426 / 0.21596 against option (3)'s C 0.20494 / 0.21536 for identical conditions — the observation the rule came from"
  },
  perBody,
  invariantCheck: inv.length > 1
    ? { n: inv.length, min: Math.min(...inv), max: Math.max(...inv), spread: +((Math.max(...inv) - Math.min(...inv)) / Math.max(1e-12, Math.min(...inv))).toFixed(3),
        reading: "a small spread supports share ∝ 1/r; a large spread says occupancy is not simply inverse in the drawn radius and A-G44's form would be fitting a law the pixels do not show" }
    : { n: inv.length, reading: "too few untruncated bodies to test the invariant" },
  candidateAnchorRadiiPx: anchors,
  impliedBoundsPerBody: Object.fromEntries(Object.entries(anchors).filter(([, r]) => typeof r === "number" && r > 0).map(([name, rRef]) => [
    name, perBody.map(b => ({ id: b.id, drawnRadiusPx: b.drawnRadiusPx, bound: +(ANCHOR_SHARE * (rRef / b.drawnRadiusPx)).toFixed(5), occupancy: b.occupancy }))
  ]))
};
writeFileSync(resolve(here, `../outputs/pg22-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ viewport: `${VW}x${VH}`, bodies: perBody.map(b => ({ id: b.id.slice(-12), r: b.drawnRadiusPx, occ: b.occupancy, occR: b.occupancyTimesRadiusPx, trunc: b.annulusTruncated })), invariant: out.invariantCheck }, null, 1));
