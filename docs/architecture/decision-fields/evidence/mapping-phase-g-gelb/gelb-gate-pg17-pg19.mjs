#!/usr/bin/env node
// GELB · A-G128 satisfiability gate, run on committed constants only.
// Subjects: PG-17 (both limbs) and PG-19 (re-derivation attempt).
// A-G35: every number GELB states in §45 is produced here.
// A-G36: GRUEN is asked to reproduce independently; this is one of the two instruments.
//
// Constants are transcribed from, and must be checked against:
//   condyn-admin-mapping-d/app/components/career/demo/PersonJobMappingField.tsx
//   condyn-admin-mapping-d/docs/architecture/decision-fields/mapping-spec/layout-spec-v1.1.json

const INK = [205, 240, 255];
const GLOW_RAMP = [[0,1],[0.33,1],[0.45,0.72],[0.58,0.46],[0.72,0.24],[0.86,0.08],[1,0]];
const VOLUME = { coreAlpha: 0.16, haloAlpha: 0.5, haloNear: 2.6, haloFar: 3.0, depthRatio: 1.45 };
const CORE_STOPS = [[0,1],[0.4,0.78],[0.75,0.55],[1,0.42]];   // mf-core gradient
const GROUND_L = 0.0044378;        // GRUEN's disclosed scalar, A-G132/A-G133, L0/1920
const PG17_CORE_BOUND = 1.45;      // UNDERIVED (A-G138)
const PG17_EXTENT_R = 1.5;         // CITED-WITHOUT-A-NUMBER (A-G143)

// --- WCAG relative luminance, 8-bit sRGB ---
const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const L = ([r,g,b]) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
// A-G81: the alpha is quantised to 8 bits BEFORE compositing, then the composite rounds.
const qa = (a) => Math.round(a * 255) / 255;
const overBlack = (a) => INK.map((c) => Math.round(c * qa(a)));

const out = [];
const say = (s) => { out.push(s); console.log(s); };

say('=== GELB gate · PG-17 / PG-19 · constants only ===\n');

// ---------------------------------------------------------------- 1
say('[1] ANCHOR — reproduce A-G137\'s five rows (regression check on the model)');
const ranks = { 'rank 1': 1, 'last rank': 1 / VOLUME.depthRatio };
const anchor = [
  ['rank 1',    0,    'rgb(33,39,41)', 4.36],
  ['rank 1',    0.4,  'rgb(26,30,32)', 2.82],
  ['rank 1',    0.75, 'rgb(18,21,22)', 1.63],
  ['last rank', 0,    'rgb(23,26,28)', 2.26],
  ['last rank', 0.75, 'rgb(12,14,15)', 0.96],
];
const stopFactor = (o) => CORE_STOPS.find(([x]) => x === o)[1];
let anchorOk = true;
for (const [rank, off, wantRgb, wantRatio] of anchor) {
  const a = VOLUME.coreAlpha * stopFactor(off) * ranks[rank];
  const rgb = overBlack(a);
  const ratio = L(rgb) / GROUND_L;
  const gotRgb = `rgb(${rgb.join(',')})`;
  const ok = gotRgb === wantRgb && Math.abs(ratio - wantRatio) < 0.005;
  anchorOk &&= ok;
  say(`    ${rank.padEnd(10)} offset ${String(off).padEnd(5)} a=${a.toFixed(5)}  ${gotRgb.padEnd(14)} ${ratio.toFixed(3)}x  want ${wantRgb} ${wantRatio}x  ${ok ? 'OK' : 'MISMATCH'}`);
}
say(`    anchor: ${anchorOk ? 'all five rows reproduced' : 'FAILED — model does not match the record'}\n`);

// ---------------------------------------------------------------- 2
say('[2] PG-17 core limb — the full stop family, including the offset-1 stop A-G137 omitted');
const rows = [];
for (const [rname, gain] of Object.entries(ranks))
  for (const [off, f] of CORE_STOPS) {
    const a = VOLUME.coreAlpha * f * gain;
    const rgb = overBlack(a);
    rows.push({ rname, off, a, rgb, ratio: L(rgb) / GROUND_L });
  }
// area-weighted statistics over the core disc: area fraction up to offset t is t^2
const opacityAt = (t) => {
  for (let i = 0; i < CORE_STOPS.length - 1; i++) {
    const [x0,y0] = CORE_STOPS[i], [x1,y1] = CORE_STOPS[i+1];
    if (t >= x0 && t <= x1) return y0 + (y1 - y0) * (x1 === x0 ? 0 : (t - x0) / (x1 - x0));
  }
  return CORE_STOPS.at(-1)[1];
};
const tMedian = Math.sqrt(0.5);
for (const [rname, gain] of Object.entries(ranks)) {
  const a = VOLUME.coreAlpha * opacityAt(tMedian) * gain;
  const rgb = overBlack(a);
  rows.push({ rname, off: `median(t=${tMedian.toFixed(4)})`, a, rgb, ratio: L(rgb) / GROUND_L });
}
for (const r of rows)
  say(`    ${r.rname.padEnd(10)} ${String(r.off).padEnd(18)} a=${r.a.toFixed(5)} rgb(${r.rgb.join(',')})`.padEnd(66) + `${r.ratio.toFixed(3)}x  ${r.ratio >= PG17_CORE_BOUND ? 'clears' : 'FAILS'} ${PG17_CORE_BOUND}`);
const lo = Math.min(...rows.map(r => r.ratio)), hi = Math.max(...rows.map(r => r.ratio));
say(`    achievable range ${lo.toFixed(3)}x .. ${hi.toFixed(3)}x   straddles ${PG17_CORE_BOUND}: ${lo < PG17_CORE_BOUND && hi > PG17_CORE_BOUND}`);
say(`    => the statistic selects the verdict (A-G137), and the family is wider than A-G137 stated:`);
say(`       the offset-1 stop reaches ${rows.filter(r=>r.off===1).map(r=>r.ratio.toFixed(3)).join(' / ')}x, below every value A-G137 listed.\n`);

// ---------------------------------------------------------------- 3
say('[3] PG-17 ramp GEOMETRY — the measurable domain, which neither A-G136 nor the pin states');
// line 679: const t = (b.rank - 1) / (lastRank - 1)  -> t is the RANK, not the breath.
// line 686: halo circle r = r * (haloNear + (haloFar - haloNear) * t)   => 2.6 r at rank 1, 3.0 r at the last rank.
// mf-halo has no gradientUnits => objectBoundingBox: offset 1 is the halo circle's own radius.
// line 714: the seat is a stroke CENTRED on r, so it occludes out to r + width/2 (A-G97: an area occluder).
const STROKE_MIN_PX = 1.2, FLOOR_HEADROOM = 1.002, SEAT_PAD_PX = 1.6;
const seatHalf = { unmarked: (STROKE_MIN_PX * FLOOR_HEADROOM + SEAT_PAD_PX) / 2, marked: (2 + SEAT_PAD_PX) / 2 };
const R_PX_FLOOR = 28;   // layout-spec-v1.1.json: drawn diameter >= 56 px at L0/1920, so r >= 28 px
say(`    seat half-width: unmarked ${seatHalf.unmarked.toFixed(4)} px, marked ${seatHalf.marked.toFixed(4)} px (device px; k cancels)`);
say(`    guaranteed smallest drawn radius: ${R_PX_FLOOR} px (spec's own ">= 56 px diameter at L0/1920")`);
say('');
say('    (a) where does the body rim fall on the gradient\'s offset axis?');
const haloR = (t) => VOLUME.haloNear + (VOLUME.haloFar - VOLUME.haloNear) * t;
const flatEnd = GLOW_RAMP[1][0];
for (const [rname, t] of [['rank 1', 0], ['last rank', 1]]) {
  const rimOff = 1 / haloR(t);
  const seatOff = (R_PX_FLOOR + seatHalf.marked) / (haloR(t) * R_PX_FLOOR);
  say(`        ${rname.padEnd(10)} halo ${haloR(t).toFixed(2)} r   rim at offset ${rimOff.toFixed(6)}   seat edge at offset ${seatOff.toFixed(6)}`);
  say(`        ${''.padEnd(10)} flat head ends at ${flatEnd}  ->  occluded by ${(seatOff - flatEnd).toFixed(6)} offset = ${((seatOff - flatEnd) * haloR(t) * R_PX_FLOOR).toFixed(2)} px`);
}
say('    => the flat head lies BEHIND the body\'s own seat at every rank. It is not measurable.');
say('    => over the measurable domain the ramp is STRICTLY decreasing: decrements');
const dec = [];
for (let i = 0; i < GLOW_RAMP.length - 1; i++) dec.push(GLOW_RAMP[i][1] - GLOW_RAMP[i+1][1]);
say(`       [${dec.map(d => d.toFixed(2)).join(', ')}] -- the only zero is the head, and the head is occluded.`);
say('    => A-G136 CORRECTED: strict does not fail by construction, because the segment that would have');
say('       failed it is never sampled. Both words give the same verdict, and that verdict is CANNOT FAIL.');
say('');

say('[4] PG-17 extent limb — the REACHABLE envelope (A-G170: this block said "cannot fail" and was wrong)');
say('    WITHDRAWN as first written. It evaluated r_px at the single value 28, which layout-spec-v1.1.json:26');
say('    states WITH ITS CONDITION ATTACHED -- ">= 56 .. <= 92 px diameter AT L0, 1920 x 1080". PG-17');
say('    (PHASE_G.md:585) carries no viewport condition, so the pin ranges over an axis the premise does not.');
say('    PINK measured the axis (validation/hr-decision-loop-pink @ d133f400, 20 widths, L0, rank 1 marked;');
say('    5 bodies, lastRank 5, zero overflow, data-size-floor false, rank-1 rho_drawn constant at 41.544,');
say('    so k is the only variable). Its k values are the measured input below; the arithmetic is mine.');
say('');
const RHO_DRAWN_RANK1 = 41.544;        // PINK, measured, constant across all 20 widths
const PINK_K = [[1920, 1.5156], [1366, 1.8982], [1280, 2.2524], [1270, 2.3023],
                [1260, 2.3545], [1200, 2.7264], [1152, 2.8791]];   // 1152 = the E-8 stage clamp floor
const extentAt = (rPx, t, seatHalf) => haloR(t) - 1 - seatHalf / rPx;
say(`    ${'width'.padStart(6)} ${'k'.padStart(7)} ${'r_device'.padStart(9)} ${'extent/r'.padStart(9)} ${'margin px'.padStart(10)}`);
const env = [];
for (const [w, k] of PINK_K) {
  const rPx = RHO_DRAWN_RANK1 / k;
  const e = extentAt(rPx, 0, seatHalf.marked);
  env.push(e);
  say(`    ${String(w).padStart(6)} ${k.toFixed(4).padStart(7)} ${rPx.toFixed(3).padStart(9)} ${e.toFixed(5).padStart(9)} ${((e - PG17_EXTENT_R) * rPx).toFixed(4).padStart(10)}  ${e >= PG17_EXTENT_R ? 'pass' : 'FAIL'}`);
}
const breakEvenR = seatHalf.marked / (haloR(0) - 1 - PG17_EXTENT_R);
say('');
say(`    break-even r_device (marked, rank 1): ${seatHalf.marked} / ${(haloR(0) - 1 - PG17_EXTENT_R).toFixed(1)} = ${breakEvenR.toFixed(3)} px`);
say(`    break-even k: ${RHO_DRAWN_RANK1} / ${breakEvenR} = ${(RHO_DRAWN_RANK1 / breakEvenR).toFixed(5)}`);
const eClampMarked = Math.min(...env), eWide = extentAt(RHO_DRAWN_RANK1 / PINK_K[0][1], 1, seatHalf.unmarked);
say(`    reachable envelope: ${eClampMarked.toFixed(5)} .. ${extentAt(RHO_DRAWN_RANK1 / PINK_K[PINK_K.length-1][1], 1, seatHalf.unmarked).toFixed(5)} r   bound ${PG17_EXTENT_R} r`);
say(`    straddles the bound: ${eClampMarked < PG17_EXTENT_R}  =>  PG-17's extent limb IS a well-formed test.`);
say('');
say('    The E-8 stage clamp bottoms the stage at 420 px below 1152, so the limb saturates at -0.3570 px:');
say('    never worse, never recovering. At the clamp floor the UNMARKED case clears by +0.0418 px, so both');
say(`    cases sit within 0.36 px of the bound, one below and one above, separated only by whether the`);
say('    reader is pointing at the body. Neither lane has a mechanism for that and neither invents one.');
say('');
say('    A-G171: satisfiability is a property of the REACHABLE ENVELOPE, not of one configuration of it,');
say('    and "reachable" means along the axes the pin ranges over. (PINK: SIZE_FLOOR_PX permits 6 device px');
say('    and extent 1.300 r, but data-size-floor is false at every width because the stage clamp bottoms');
say('    out first -- reachable in the code, not reachable along this axis. The failure needs no appeal to it.)');
say('');
say('    The code\'s own statements of this extent still disagree, which is now worse and not better:');
say('       line 146 ">= 1.6 x" (the rank-1 RIM figure), line 880 ">= 1.5 x", the pin ">= 1.5 x",');
say(`       the record's §13 "1.1..2.6 r" -- and the reachable minimum, ${eClampMarked.toFixed(3)} r, appears nowhere.`);
say('');

// ---------------------------------------------------------------- 5
say('[5] A-G139 — quantisation-order spread, for the record');
const spreads = [];
for (const [rname, gain] of Object.entries(ranks)) {
  for (const [off, f] of CORE_STOPS) {
    const sep = L(overBlack(VOLUME.coreAlpha * f * gain));                       // quantise the product once
    const joint = L(INK.map((c) => Math.round(c * qa(VOLUME.coreAlpha * f) * gain))); // stop quantised, gain applied after
    const spread = Math.abs(joint - sep) / sep * 100;
    spreads.push(spread);
    say(`    ${rname.padEnd(10)} offset ${String(off).padEnd(5)} one-step ${(sep/GROUND_L).toFixed(3)}x  two-step ${(joint/GROUND_L).toFixed(3)}x  spread ${spread.toFixed(2)}%`);
  }
}
say(`    max spread ${Math.max(...spreads).toFixed(2)}%  (A-G139 recorded 4.49% on last-rank-centre)\n`);

// ---------------------------------------------------------------- 6
say('[6] PG-19 — what R25 actually quantifies');
say('    R25, verbatim: "enhanced when the stimulus is small, low-contrast or blurred, and enhanced');
say('    further from fixation. Raising target contrast halves the disappearance rate."');
const k = Math.log(0.5) / Math.log(2);
say(`    the halving fixes ONE exponent: rate ~ C^k with 2^k = 1/2  =>  k = ${k.toFixed(6)}`);
say('    size: direction only, no exponent.   eccentricity: direction only, no exponent.');
say('    => a joint scalar index needs an exchange rate between factors. R25 supplies none.');
say('');
say('[7] PG-19 — is size fusible with eccentricity via Bouma (R23/PG-16)?');
say('    R23 critical spacing is a FLANKER-DISTANCE quantity; R25 "small" is a STIMULUS-EXTENT');
say('    quantity. Fusing them is A-G150\'s class: applying R23\'s number to the wrong relation.');
say('    => no derived dimensionless fusion is available.');
say('');
say('[8] PG-19 — would a compensation ordering be satisfiable? (size vs eccentricity in the layout)');
const SPEC = { drawnMin: 34.2, drawnMax: 54.6, bestFit: 160, horizon: 400 };
const near = SPEC.drawnMin / SPEC.bestFit, far = SPEC.drawnMax / SPEC.horizon;
say(`    drawn size comes from requirement mass (rho_drawn rule); radius comes from fit. Independent.`);
say(`    smallest body at the best-fit ring:  ${SPEC.drawnMin} / ${SPEC.bestFit} = ${near.toFixed(4)} size-per-unit-eccentricity`);
say(`    largest  body at the horizon ring:   ${SPEC.drawnMax} / ${SPEC.horizon} = ${far.toFixed(4)}`);
say(`    relative size NON-DECREASING outward: ${far >= near}  (ratio ${(far/near).toFixed(3)})`);
say(`    => an outward-compensation ordering fails by construction, because the layout makes size and`);
say(`       eccentricity independent on purpose. Not a defect in the layout; a defect in the pin.\n`);

say('=== VERDICTS ===');
say(`PG-17 core limb    : statistic unnamed, range ${lo.toFixed(2)}x..${hi.toFixed(2)}x straddles the bound; bound UNDERIVED; and R21`);
say('                     states the percept is "explained by neither local contrast nor total luminance');
say('                     energy" -- so this limb measures a quantity its own mechanism excludes.');
say('PG-17 monotone limb: cannot fail. Non-increasing holds by construction, and STRICT also holds,');
say('                     because the one flat segment lies behind the body\'s own seat and is never sampled.');
say(`PG-17 extent limb  : A WELL-FORMED TEST. Reachable ${eClampMarked.toFixed(3)} r at the stage clamp to 1.950 r,`);
say('                     straddling 1.5 r. It FAILS at every viewport width <= 1260 px (break-even k 2.30800,');
say('                     r_device 18.000 px, stage CSS width ~508.7 px), measured by PINK over 20 widths.');
say('                     A-G162 said "cannot fail, a tripwire" on a premise scoped to 1920 x 1080. Withdrawn.');
say('PG-19              : no joint index derivable -- one exponent from R25, no exchange rate, no fusion.');

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'gelb-gate-pg17-pg19.out.txt'), out.join('\n') + '\n');
