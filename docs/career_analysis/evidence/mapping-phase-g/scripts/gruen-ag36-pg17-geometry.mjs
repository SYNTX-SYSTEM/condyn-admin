#!/usr/bin/env node
/**
 * GRÜN · A-G36 · independent re-derivation of §45's four geometry figures. NO VERDICT (A-G36 point 2).
 *
 * Nothing is rendered and nothing is read from GELB's script: every number below comes from the product's
 * own constants, named by SYMBOL rather than by line, because the defect this answers (§45 A-G163) was two
 * comments disagreeing about one constant and line numbers are how such a comment goes stale.
 *
 * All four of §45's figures reproduce exactly. The decisive one is the last block: whether the ramp's flat
 * head is behind the seat, because A-G136's verdict inverts on it.
 */
import { writeFileSync } from "node:fs";

const haloNear = 2.6, haloFar = 3.0;                                   // VOLUME
const RAMP = [[0,1],[0.33,1],[0.45,0.72],[0.58,0.46],[0.72,0.24],[0.86,0.08],[1,0]];  // GLOW_RAMP
const haloAlpha = 0.5;                                                 // VOLUME
const SEAT_PAD_PX = 1.6, STROKE_MIN_PX = 1.2, FLOOR_HEADROOM = 1.002;  // SEAT_PAD_PX, STROKE_MIN_PX, FLOOR_HEADROOM
const MARKED_W = 2;                                                    // the body seat ring: isMarked ? 2 * k : structure
const R_FLOOR_PX = 28;                                                 // PG-3: ">= 56 px diameter at L0, 1920 x 1080"
const structure = STROKE_MIN_PX * FLOOR_HEADROOM;
/**
 * `k = box.width / drawnPx` is USER UNITS PER PIXEL, and every seat width is written `… * k`, so each
 * half-width here is in device px and carries no viewport dependence. The seat ring is a stroke CENTRED on
 * r, so it occludes to r + width/2.
 */
const seatHalf = { marked: (MARKED_W + SEAT_PAD_PX) / 2, unmarked: (structure + SEAT_PAD_PX) / 2 };

const R = t => haloNear + (haloFar - haloNear) * t;  // the glow's radius in units of r; t is the RANK: (rank-1)/(lastRank-1)
const rimOffset = t => 1 / R(t);
const seatOffset = (t, h, rpx) => (1 + h / rpx) / R(t);
const extent = (t, h, rpx) => R(t) - 1 - h / rpx;
const shareAt = o => { for (let i = 1; i < RAMP.length; i++) { const [o0,s0] = RAMP[i-1], [o1,s1] = RAMP[i];
  if (o <= o1) return s0 + (s1 - s0) * (o - o0) / (o1 - o0); } return 0; };
const FLAT_END = RAMP[1][0];
const r6 = x => +x.toFixed(6);

const figures = {
  "1 · body rim on the gradient's offset axis": {
    note: "the gradient declares no gradientUnits, so objectBoundingBox applies and offset 1 is the drawn circle's own radius",
    rank1: r6(rimOffset(0)), lastRank: r6(rimOffset(1)), gelb: [0.384615, 0.333333] },
  "2 · the seat's occluding edge": {
    seatHalfPx: { marked: r6(seatHalf.marked), unmarked: r6(seatHalf.unmarked) }, gelbSeatHalfPx: [1.8, 1.4012],
    offsetMarkedAtRFloor: { rank1: r6(seatOffset(0, seatHalf.marked, R_FLOOR_PX)), lastRank: r6(seatOffset(1, seatHalf.marked, R_FLOOR_PX)) },
    gelb: [0.409341, 0.354762] },
  "3 · measurable extent": {
    formula: "(haloNear + 0.4t) - 1 - seatHalfPx / r_px",
    atRFloor: { rank1_marked: r6(extent(0, seatHalf.marked, R_FLOOR_PX)), lastRank_unmarked: r6(extent(1, seatHalf.unmarked, R_FLOOR_PX)) },
    gelb: [1.53571, 1.94996],
    oneCorrection: "the UPPER figure is the value AT r_px = 28, not the supremum over r_px >= 28, which is 2.0 and not attained. The lower figure IS the infimum, so the interval is right where it is load-bearing." },
  "4 · worst-case margin against the pin's 1.5 r": {
    formula: "(R(0) - 1 - h/r) - 1.5 = 0.1 - h/r_px, times r_px",
    px: r6(0.1 * R_FLOOR_PX - seatHalf.marked), gelb: 1.0,
    againstTheRimFigureOf1_6: r6((extent(0, seatHalf.marked, R_FLOOR_PX) - 1.6) * R_FLOOR_PX) + " px, i.e. the measurable extent FAILS the 1.6 by exactly the seat's half-width — which is A-G163's point" },
};

/** The decisive check: is the flat head [0, 0.33] behind the seat at EVERY rank and radius? */
const flatHead = {
  question: "A-G136's verdict inverts on this",
  infimumOfSeatOffset: { value: r6(1 / haloFar), reason: "h/r_px -> 0 as r_px grows, and t = 1 maximises the denominator", exceedsFlatEnd: (1 / haloFar) > FLAT_END },
  answer: "OCCLUDED AT EVERY RANK AND EVERY RADIUS. 0.33 < 1/haloFar = 0.333333 is pure constant arithmetic — it needs no radius, no mark and no measurement.",
  strongerThanTheSeatRing: {
    note: "the seat's opaque FILL alone reaches r, and the flat head's outer radius at the worst rank is 0.33 * haloFar = " + r6(FLAT_END * haloFar) + " r < 1, so the ring is not even required",
    fillOnlyMarginPx: r6((1 - FLAT_END * R(1)) * R_FLOOR_PX),
    caveat: "the seat RING carries the body's own dash pattern (LINE_DASH dotted/open/broken), so through a dash gap the guaranteed occluder is the fill alone and the margin is this sub-pixel figure, not the ring's 1.68 px. The CONCLUSION is unaffected; the MARGIN is." },
  consequence: "the flat head is never sampled, so the observable ramp is strictly decreasing and strict-versus-non-increasing is not a difference.",
  /**
   * §51 A-G205 — WITHDRAWN. I claimed a second, independent reason the distinction is void: that the outer
   * tail carries at most 11 byte levels over 11.76 px, so by pigeonhole some adjacent pair must read equal.
   * **It does not hold.** 11 was ONE channel's levels, and luminance is a weighted sum of THREE channels that
   * cross their code boundaries at different alpha. CYAN is (92, 200, 255), so over the tail's alpha 0.04 → 0
   * blue spans 11 values, green 9 and red 4, giving **23 distinct composited triples** against at most 12
   * pixel samples — more colours than samples, so no repeat is forced. Strict decrease IS expressible there.
   * The flat-head conclusion is unaffected and rests on the truncation alone, which is where GELB put it.
   */
  andTheOtherWayToo: (() => {
    const C = [92, 200, 255].map(v => v / 255), GROUND = [6, 6, 6];
    const triple = a => C.map((c, i) => Math.round(GROUND[i] + 255 * a * c * (1 - GROUND[i] / 255)));
    const seen = new Set();
    for (let i = 0; i <= 200000; i += 1) seen.add(triple(0.04 * (1 - i / 200000)).join(","));
    const tailPx = (1 - 0.86) * R(1) * R_FLOOR_PX;
    return { status: "WITHDRAWN — §51 A-G205", claimWas: "the tail cannot read strictly decreasing, by pigeonhole on 11 byte levels over 11.76 px",
      whyItFails: "11 was one channel's levels; luminance sums three channels whose code crossings do not coincide",
      distinctTriplesAlongTail: seen.size, pixelSamples: Math.ceil(tailPx), pigeonholeHolds: seen.size <= Math.ceil(tailPx),
      note: "so there is ONE reason the flat head is never sampled, not two: the truncation. The all-channel quantum that made the count look small is also the wrong quantum for a cyan glow — one BLUE code is 2.7834e-05, 13.85x finer." };
  })(),
  rows: [0, 0.5, 1].flatMap(t => Object.entries(seatHalf).flatMap(([m, h]) => [R_FLOOR_PX, 56].map(rpx => ({
    t, mark: m, rpx, seatOffset: r6(seatOffset(t, h, rpx)), occludesFlatHead: seatOffset(t, h, rpx) >= FLAT_END,
    clearancePx: r6((seatOffset(t, h, rpx) - FLAT_END) * R(t) * rpx), maxMeasurableShareOfPeak: r6(shareAt(seatOffset(t, h, rpx))) })))),
};

const report = { instrument: "GRÜN phase-G · A-G36 re-derivation of §45", verdict: "NONE — development reading only (A-G36 point 2)",
  basis: "product constants only; nothing rendered, nothing read from GELB's instrument", figures, flatHead };
const out = new URL("../outputs/ag36-pg17-geometry.json", import.meta.url);
writeFileSync(out, JSON.stringify(report, null, 1) + "\n");
console.log(JSON.stringify(report, null, 1));
console.error(`written ${out.pathname}`);
