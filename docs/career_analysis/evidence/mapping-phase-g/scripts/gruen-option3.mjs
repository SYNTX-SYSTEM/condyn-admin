/**
 * GRÜN · PHASE-G DEVELOPMENT READING · costing A-G91 option (3): the fits/shelved boundary carried by
 * something that is not a ring.  **NO VERDICT** (A-G36 point 2).
 *
 * GELB (§30): three measurements converge on option (3) and it should be COSTED, not guessed, before PINK's
 * limb (a) verdict. Three questions: what carries the boundary if not a ring; what it costs in lib/career;
 * what it costs in PG-22, PF-15(a) and A-G82's legibility floor if the shelf ring is simply not drawn.
 *
 * Three render conditions, by live override on one build — no product change, no rebuild:
 *   A asBuilt          the shelf ring drawn at RING_LUMINANCE.shelf = 0.022 (byte 6)
 *   B ringHidden       the ring not drawn, its opaque black seat KEPT (an orphaned seat)
 *   C ringAndSeatHidden  both gone — the band falls back to whatever lies beneath it
 * The shelf seat carries no class and no data-* (one of A-G49's seven), so it is found by geometry: the
 * circle whose stroke is SEAT and whose r equals the shelf ring's own r.
 *
 * ZERO-BY-CONSTRUCTION CHANNEL (§30, from this lane's bbox-centre catch): every run reports a quantity that
 * must be zero. Here it is the luminance difference, under reduce, between two captures taken with NOTHING
 * changed between them — a static field must be bit-identical, and a non-zero value invalidates the run.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  classMasks, signAndSeatMask, servedProvenance, PROVENANCE, CLASS_SELECTOR, EMITTING_CLASSES, OCCLUDING_CLASSES,
  RING_CLASSES, zeroByConstruction, luminanceOfRgb, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const sel = cs => cs.map(c => CLASS_SELECTOR[c]).join(",");

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
/** A-G92: the provenance covers the INSTRUMENT too, not only the artifact. */
const instrumentCommit = (() => { try { return execSync(`git -C ${WT} log -1 --format=%h -- docs/career_analysis/evidence/mapping-phase-g/scripts`, { encoding: "utf8" }).trim(); } catch { return null; } })();
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N } = geom;
const cdp = await cdpSession(page);
const k = geo.unitsToPx;

/** Mark the shelf seat so it can be addressed at all (A-G49's gap, worked around by geometry). */
const seatTagged = await page.evaluate(() => {
  const ring = document.querySelector('[data-testid="mapping-ring-shelf"]');
  const r = ring.getAttribute("r");
  const seat = [...document.querySelectorAll("circle")].find(c => c !== ring && c.getAttribute("r") === r && /rgba\(0, 0, 0, 1\)/.test(c.getAttribute("stroke") ?? ""));
  if (seat === undefined) return false;
  seat.setAttribute("data-gruen-shelf-seat", "1");
  return true;
});

const CONDITIONS = {
  A_asBuilt: null,
  B_ringHidden: '[data-testid="mapping-ring-shelf"]',
  C_ringAndSeatHidden: '[data-testid="mapping-ring-shelf"],[data-gruen-shelf-seat]'
};
const apply = async hideSel => { await unhideAll(page); if (hideSel !== null) await hide(page, hideSel); await page.waitForTimeout(360); };
const discSum = async () => { const L = await captureLuminance(cdp, clip, N); let s = 0; for (let i = 0; i < N; i += 1) if (disc[i]) s += L[i]; return s; };

const zeroChannel = await zeroByConstruction(cdp, clip, N, disc);

const PLATE = luminanceOfRgb(3, 5, 8);
const radialProfile = async () => {
  const L = await captureLuminance(cdp, clip, N);
  const at = units => {
    const vals = [];
    for (let a = 0; a < 360; a += 1) {
      const th = (a * Math.PI) / 180;
      const x = Math.round(geom.cx + units * k * Math.cos(th)), y = Math.round(geom.cy + units * k * Math.sin(th));
      if (x < 0 || y < 0 || x >= geom.W || y >= geom.H) continue;
      vals.push(L[y * geom.W + x]);
    }
    vals.sort((p, q) => p - q);
    return vals.length ? vals[Math.floor(vals.length / 2)] : null;
  };
  const inside = at(420), outside = at(445), beyond = at(510);
  return { medianAt420Units_insideBoundary: e4(inside), medianAt445Units_inShelfBand: e4(outside), medianAt510Units_outsideField: e4(beyond),
    boundaryStepRatio: outside > 0 ? +(inside / outside).toFixed(3) : null, boundaryStepAbsolute: e4(inside - outside) };
};

const results = {};
for (const [name, hideSel] of Object.entries(CONDITIONS)) {
  await apply(hideSel);
  const profile = await radialProfile();
  const full = await discSum();
  const keepHidden = hideSel;
  /** shares: suppress on TOP of the condition, then restore the condition */
  const shareOf = async selector => { await hide(page, selector); const v = await discSum(); await apply(keepHidden); return (full - v) / full; };
  // the condition MUST survive the mask build — unhideAll would otherwise strip it (see unhideAll's `keep`)
  const semShare = await shareOf(sel(EMITTING_CLASSES));
  const ringsShare = await shareOf(sel(RING_CLASSES));
  const limbA = ringsShare / Math.max(1e-12, semShare);

  /** PG-22 per body under this condition */
  const { covered } = await signAndSeatMask(page, cdp, clip, N, { exclude: ["glowsAll"], keepHidden });
  await apply(keepHidden);
  const base = await captureLuminance(cdp, clip, N);
  const bodies = [];
  for (const b of geo.bodies.filter(x => x.inPool)) {
    await hide(page, `[data-testid="mapping-name-${b.id}"],[data-testid="mapping-measure-${b.id}"]`);
    const woOwn = await captureLuminance(cdp, clip, N);
    await unhideAll(page, keepHidden);
    const rPx = b.drawnRadiusUnits * k, inner = 1.1 * rPx, outer = 2.6 * rPx;
    const bcx = b.cx - clip.x, bcy = b.cy - clip.y;
    let ann = 0, occ = 0;
    for (let y = Math.floor(bcy - outer); y <= Math.ceil(bcy + outer); y += 1) for (let x = Math.floor(bcx - outer); x <= Math.ceil(bcx + outer); x += 1) {
      const d = Math.hypot(x - bcx, y - bcy);
      if (d < inner || d > outer || x < 0 || y < 0 || x >= geom.W || y >= geom.H) continue;
      ann += 1;
      const i = y * geom.W + x;
      if (Math.abs(base[i] - woOwn[i]) > 0.001) continue;
      if (covered[i]) occ += 1;
    }
    bodies.push({ rank: b.rank, shelf: b.shelf, drawnRadiusPx: +rPx.toFixed(2), occupancy: ann ? +(occ / ann).toFixed(5) : null });
  }
  results[name] = {
    boundary: profile,
    PG1_semanticShare_exclRings: +semShare.toFixed(5), ringsShareOfField: +ringsShare.toFixed(5),
    PF15_limbA: +limbA.toFixed(5), discMeanLuminance: e4(full / geom.discPixels),
    PG22_perBody: bodies,
    PG22_shelfBodiesMean: +(bodies.filter(b => b.shelf).reduce((s, b) => s + b.occupancy, 0) / Math.max(1, bodies.filter(b => b.shelf).length)).toFixed(5)
  };
}
await ctx.close(); await browser.close();

const A = results.A_asBuilt, B = results.B_ringHidden, C = results.C_ringAndSeatHidden;
const out = {
  reading: "GRÜN development reading · A-G91 option (3) costed — the fits/shelved boundary without a shelf ring",
  verdict: PROVENANCE.verdict, provenance: { ...provenance, instrumentCommit }, instrument: PROVENANCE, guard,
  zeroByConstructionChannel: zeroChannel,
  viewport: `${VW}x${VH}`, shelfSeatAddressable: seatTagged,
  definitions: {
    conditionPersistence: "each condition is threaded through every mask build via unhideAll(page, keep). Without it the first unhideAll inside signAndSeatMask strips the condition and all three conditions measure the same field — which is what the first version of this probe did, and only the per-body occupancies were wrong.",
    conditions: { A_asBuilt: "shelf ring drawn at alpha 0.022", B_ringHidden: "ring not drawn, its opaque black seat kept", C_ringAndSeatHidden: "ring and its seat both gone" },
    boundaryStep: "median luminance over 360 angles just INSIDE the boundary (420 units) against just outside it in the shelf band (445 units); the fits/shelved radius is 430",
    whatAlreadyCarriesTheBoundary: "the MEDIUM already terminates at shelfNear by construction: mf-ground r = shelfNear (:855/:890), all seven wave layers r = shelfNear (:859/:892), the territory wash spans personRadius…shelfNear (:894), and mf-rest steps to SEAT at shelfNear/fieldRadius + 0.001 (:867). The lit, breathing medium ENDS at the boundary — so option (3) needs no new carrier, it needs the ring removed.",
    libCareerCost: "ZERO. rings.shelfNear/shelfFar appear in lib/career only in fitDistance (layout.ts:48) and the band rule (layout.ts:102), and in the view model's geometry passthrough — the RADIUS, never the drawn ring. No layout maths, no golden vector and no spec value changes.",
    testCost: "NOT zero, and gated: field-f.test.tsx:114 iterates all four ring testids asserting each has a seat beneath it, so it must become three. field-e.test.tsx:328 already skips the shelf. neurovisual-e.test.ts:84 asserts best/shelf >= 1.6 on the CONSTANT, so it survives if RING_LUMINANCE keeps a shelf entry that nothing draws — which would be a lie in the table and should instead be removed with the ring, which that assertion then also needs. So option (3) cannot land without the test-database gate.",
    plateLuminance: e4(PLATE)
  },
  conditions: results,
  costSummary: {
    PF15_limbA: { asBuilt: A.PF15_limbA, ringHidden: B.PF15_limbA, ringAndSeatHidden: C.PF15_limbA, boundForReference: "<= 0.08",
      savingFromRemoval: +(A.PF15_limbA - C.PF15_limbA).toFixed(5) },
    PG22_shelfBodiesMeanOccupancy: { asBuilt: A.PG22_shelfBodiesMean, ringHidden: B.PG22_shelfBodiesMean, ringAndSeatHidden: C.PG22_shelfBodiesMean, boundForReference: "<= 0.20",
      savingFromRemoval: +(A.PG22_shelfBodiesMean - C.PG22_shelfBodiesMean).toFixed(5) },
    PG1_semanticShare: { asBuilt: A.PG1_semanticShare_exclRings, ringHidden: B.PG1_semanticShare_exclRings, ringAndSeatHidden: C.PG1_semanticShare_exclRings, boundForReference: ">= 0.55" },
    boundaryStepRatio: { asBuilt: A.boundary.boundaryStepRatio, ringHidden: B.boundary.boundaryStepRatio, ringAndSeatHidden: C.boundary.boundaryStepRatio,
      reading: "whether the fits/shelved line is still legible as a step in the medium with no ring drawn" },
    A_G82_legibilityFloor: "dissolves — there is no ring to make legible. The floor was a bound on a rung; option (3) removes the rung and keeps the boundary."
  }
};
writeFileSync(resolve(here, `../outputs/option3-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ viewport: `${VW}x${VH}`, zeroChannel, cost: out.costSummary }, null, 2));
