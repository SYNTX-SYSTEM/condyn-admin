#!/usr/bin/env node
/**
 * GRÜN · A-G163 / A-G166 · re-anchoring the released PG-17 seal. NO VERDICT (A-G36 point 2).
 *
 * Reads the three released SEALED-pg17-*.json profiles and recomputes the monotone extent against the
 * geometry A-G163 established, without re-rendering anything. The sealed files are NOT modified: they are
 * the committed measurement and stay byte-identical. This script states what that measurement supports.
 *
 * Two defects in the sealed statistic, both found by writing the geometry down rather than by measuring:
 *
 *   (a) ANCHORED INSIDE THE OCCLUDER. `gruen-pg17.mjs` runs the profile from the rim, u = 1.0, and breaks
 *       its monotone run at the first null band. The seat occludes to 1 + seatHalf/r_px — 1.032 … 1.049 r
 *       at the radii measured here — so the 1.00…1.05 band is seat, dash gap and antialias fringe, never a
 *       clean sample of the glow. Rank 3's sealed extent of 0 is that break on a LEADING NULL, not a
 *       measured reversal: its populated profile is monotone from 1.10 r down. A statistic that reports
 *       "not monotone" for "not measurable" is defect class 4 again, one level up.
 *
 *   (b) RUN PAST THE SUBJECT'S OWN EDGE. The profile runs to 3.0 r for every body, but a body's glow ends
 *       at haloNear + (haloFar - haloNear) * t = 2.6 r at rank 1, reaching 3.0 r only at the last rank.
 *       Bands beyond that are local ground and neighbouring glows, so the sealed extents counted up to
 *       0.4 r of NOT-THE-SUBJECT as part of the subject's ramp. Same shape as `.mf-halo` including the
 *       still shelf glows: the carrier was named in the renderer's vocabulary, not the obligation's.
 *
 * Both defects push the same way for the wrong reason, which is why neither was visible in the figure.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "outputs");
// Source constants, quoted from app/components/career/demo/PersonJobMappingField.tsx:
const haloNear = 2.6, haloFar = 3.0;                                   // :143 VOLUME
const SEAT_PAD_PX = 1.6, STROKE_MIN_PX = 1.2, FLOOR_HEADROOM = 1.002;  // :124 :61 :64
// :714 — the seat ring is a stroke CENTRED on r, so it occludes to r + width/2. No body is marked in a
// probe that never hovers or focuses, so every seat here is the unmarked width.
const seatHalfPx = (STROKE_MIN_PX * FLOOR_HEADROOM + SEAT_PAD_PX) / 2;
const STEP = 0.05;
// the sealed reading's own named epsilon, quoted from its definitions block: "~ one 8-bit code step at
// these levels". Neither run is presented as THE figure; the pair is (A-G105).
const MONO_EPS = 0.000022;

const files = readdirSync(OUT).filter(f => /^SEALED-pg17-.*\.json$/.test(f)).sort();
const report = { instrument: "GRÜN phase-G · PG-17 seal re-anchor (A-G166)", verdict: "NONE — development reading only (A-G36 point 2)",
  basis: "recomputed from the committed SEALED-pg17-*.json profiles; nothing re-rendered, nothing in those files changed",
  seatHalfPx_unmarked_boundForReference: +seatHalfPx.toFixed(4), files: [] };

for (const f of files) {
  const src = JSON.parse(readFileSync(join(OUT, f), "utf8"));
  const lastRank = Math.max(...src.perBody.map(b => b.rank));
  const rows = src.perBody.map(b => {
    const t = lastRank <= 1 ? 0 : (b.rank - 1) / (lastRank - 1);
    const glowEdgeInR = haloNear + (haloFar - haloNear) * t;          // the SUBJECT's own outer edge
    const seatEdgeInR = 1 + seatHalfPx / b.drawnRadiusPx;             // the occluder's own inner edge
    const measurableExtentInR = glowEdgeInR - seatEdgeInR;
    // the bands that are wholly inside the measurable annulus
    const bands = src.perBody.find(x => x.rank === b.rank).profile
      .filter(p => p.uFrom >= seatEdgeInR - 1e-9 && p.uTo <= glowEdgeInR + 1e-9);
    const walk = (bs, eps) => {
      const v = bs.map(p => (p.median === null ? null : Number(p.median)));
      let run = 0, brokeAt = null;
      for (let i = 1; i < v.length; i += 1) {
        if (v[i] === null || v[i - 1] === null) { brokeAt = "NULL BAND"; break; }
        if (v[i] <= v[i - 1] + eps) run = (i + 1) * STEP; else { brokeAt = `${bs[i].uFrom} r`; break; }
      }
      return { run: +run.toFixed(2), brokeAt };
    };
    const vals = bands.map(p => (p.median === null ? null : Number(p.median)));
    const nulls = vals.filter(v => v === null).length;
    const { run, brokeAt } = walk(bands, 0);
    /**
     * A shelf body is occluded past its OWN seat: the shelf ring is a stroke of the full band width with a
     * black seat of its own (:898), and `covered` also carries every ring seat and the body's name and
     * measure. So the seat edge is a LOWER bound on the occlusion and not the anchor for every body. The
     * second anchor is the first band that actually holds pixels, and `anchorSetBy` says which bound bound.
     */
    const firstClean = bands.findIndex(p => p.n > 0);
    const clean = firstClean < 0 ? [] : bands.slice(firstClean);
    const fromClean = walk(clean, 0), fromCleanEps = walk(clean, MONO_EPS);
    return { rank: b.rank, shelf: b.shelf, drawnRadiusPx: b.drawnRadiusPx,
      seatEdgeInR: +seatEdgeInR.toFixed(4), glowEdgeInR: +glowEdgeInR.toFixed(2),
      measurableExtentInR: +measurableExtentInR.toFixed(4),
      bandsInMeasurableAnnulus: bands.length, nullBands: nulls,
      firstBandInR: bands.length ? bands[0].uFrom : null, lastBandInR: bands.length ? bands[bands.length - 1].uTo : null,
      // the grid cannot start at the seat edge, so the run can only ever cover whole 0.05 r bands
      coverableExtentInR: +(bands.length * STEP).toFixed(2),
      monotoneRunInR: run, brokeAt,
      anchorSetBy: firstClean <= 0 ? "the body's own seat" : "a further occluder — ring seat, sign seat, name or measure",
      firstCleanBandInR: clean.length ? clean[0].uFrom : null,
      measurableFromFirstCleanBandInR: clean.length ? +(glowEdgeInR - clean[0].uFrom).toFixed(4) : null,
      monotoneRunFromFirstCleanBandInR: fromClean.run, brokeAtFromFirstCleanBand: fromClean.brokeAt,
      monotoneRunFromFirstCleanBandEpsTolerantInR: fromCleanEps.run, brokeAtEpsTolerant: fromCleanEps.brokeAt,
      /* §122 · A-G480 (GELB's): A ZERO NEEDS A WITNESS, AND THE CHEAPEST WITNESS IS A DENOMINATOR IN ITS OWN
         OUTPUT BLOCK. `sealedStatistic` was the only block in this lane's eleven derivations that printed a
         bare zero: the INNERMOST enclosing object read `{ "strict": 0, "epsTolerant": 0 }` and contained
         nothing else, so five bodies across the covered files printed ten zeros with nothing beside them
         showing the comparison had run. VERIFIED TRUE BEFORE BEING FIXED, which is GELB's order: the seals
         do carry `monotoneExtentInR_strict: 0` for one body per file, and `monotoneRunInR` is 0 there too,
         so the zeros are readings and not a failed lookup. They were also byte-identical to what a broken
         lookup would print, which is the whole of A-G480.
         The denominator goes INSIDE the object, because the block is the one the document declares (A-G474)
         and a figure three lines up in the parent object is a proximity heuristic, not a witness. */
      sealedStatistic: {
        strict: b.monotoneExtentInR_strict, epsTolerant: b.monotoneExtentInR_epsTolerant,
        comparedAgainstRunInR: run, overBandsInMeasurableAnnulus: bands.length, nullBandsAmongThem: nulls
      },
      sealedOverstatesBy: +(b.monotoneExtentInR_strict - run).toFixed(2) };
  });
  /* §122: a renamed sealed field would make `b.monotoneExtentInR_strict` undefined — JSON drops the key and
     `sealedOverstatesBy` becomes null, so the shape changes rather than the value. Named explicitly anyway,
     because "the failure mode happens to be visible" is not a check (A-G465). */
  for (const r of rows)
    if (typeof r.sealedStatistic.strict !== "number" || typeof r.sealedStatistic.epsTolerant !== "number")
      throw new Error(`ERR_GRUEN_PG17_SEALED_FIELD_ABSENT: rank ${r.rank} in ${f} has no numeric sealed statistic, so no comparison against the seal was made and none may be reported.`);
  report.files.push({ file: f, viewport: src.viewport, level: src.level, carries: src.carries, lastRank, perBody: rows });
}
const path = join(OUT, "pg17-seal-reanchor.json");
writeFileSync(path, JSON.stringify(report, null, 1) + "\n");
console.log(JSON.stringify(report, null, 1));
console.error(`written ${path}`);
