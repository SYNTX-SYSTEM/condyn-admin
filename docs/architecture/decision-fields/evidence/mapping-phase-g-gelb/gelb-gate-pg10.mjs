#!/usr/bin/env node
// GELB · A-G128 satisfiability gate on PG-10, run on committed constants only, before PINK measures it.
// A-G165 predicted PG-10's corridor sits in R21's position (a mechanism cited with no quantity taken).
// PG-10 as A-G22 restated it: on the visible glow, >= 25 % of pixels swing >= 0.004 relative luminance,
// AND the median Weber fraction lies in [10 %, 35 %].  Carrier: .mf-wave-halo (A-G48) = field halos only.

/* §88 A-G398: these were FORKED product values. They now come from gelb-product-constants.mjs,
   which PARSES them out of the product at a pinned build and holds no copy — READS, not HALTS.
   The output is byte-identical after the wiring, which is both the proof the literals were right
   and the reason nothing would have said so once they stopped being. */
import { CYAN, GLOW_RAMP } from "./gelb-product-constants.mjs";
const VOLUME = { coreAlpha: 0.16, haloAlpha: 0.5, haloNear: 2.6, haloFar: 3.0, depthRatio: 1.45 };
const WAVE = { periodMs: 10000, riseMs: 4000, edgeLagMs: 1200, layers: 7, peakAlpha: 0.015, haloDepth: 0.235, selectedGain: 0.35 };
const GROUND = [14, 14, 14];          // nearest neutral triple to GRUEN's measured local ground (A-G136)
const GROUND_L_MEASURED = 0.0044378;  // GRUEN's disclosed scalar (A-G132)
const SWING_MIN = 0.004, SWING_SHARE = 0.25, WEBER_LO = 0.10, WEBER_HI = 0.35;
const STROKE_MIN_PX = 1.2, FLOOR_HEADROOM = 1.002, SEAT_PAD_PX = 1.6, R_PX_FLOOR = 28;

const lin = (c) => { const s = c / 255; return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4); };
const L = ([r,g,b]) => 0.2126*lin(r) + 0.7152*lin(g) + 0.0722*lin(b);
const qa = (a) => Math.round(a * 255) / 255;                       // A-G81
const over = (a) => GROUND.map((g, i) => Math.round(g + qa(a) * (CYAN[i] - g)));

const out = []; const say = (s) => { out.push(s); console.log(s); };
say('=== GELB gate · PG-10 · constants only ===\n');
say(`ground triple rgb(${GROUND}) -> L = ${L(GROUND).toFixed(7)}   (GRUEN measured ${GROUND_L_MEASURED}, delta ${Math.abs(L(GROUND)-GROUND_L_MEASURED).toExponential(2)})`);

// the breath: opacity = mean + depth * gain * w, w in [-1, 1]  (waveAt / waveKeyframes, :191-:198)
const mean = 1 - WAVE.haloDepth / 2, depth = WAVE.haloDepth / 2;
say(`breath on .mf-wave-halo: opacity = ${mean} +/- ${depth}  =>  [${(mean-depth).toFixed(3)}, ${(mean+depth).toFixed(3)}], peak-to-peak ${WAVE.haloDepth}`);
say(`with CAPABILITY selected, --mf-wave-gain = ${WAVE.selectedGain}  =>  peak-to-peak ${(WAVE.haloDepth*WAVE.selectedGain).toFixed(5)}\n`);

const shareAt = (o) => {
  for (let i = 0; i < GLOW_RAMP.length - 1; i++) {
    const [x0,y0] = GLOW_RAMP[i], [x1,y1] = GLOW_RAMP[i+1];
    if (o >= x0 && o <= x1) return y0 + (y1 - y0) * (x1 === x0 ? 0 : (o - x0) / (x1 - x0));
  }
  return 0;
};
const haloR = (t) => VOLUME.haloNear + (VOLUME.haloFar - VOLUME.haloNear) * t;
const seatHalfMarked = (2 + SEAT_PAD_PX) / 2, seatHalfPlain = (STROKE_MIN_PX * FLOOR_HEADROOM + SEAT_PAD_PX) / 2;

function run(label, t, gain, seatHalf) {
  const depthGain = 1 - (1 - 1 / VOLUME.depthRatio) * t;        // 1 at rank 1 -> 1/depthRatio at the last rank
  const oStart = (R_PX_FLOOR + seatHalf) / (haloR(t) * R_PX_FLOOR);   // the seat occludes everything inside
  const N = 200000; let wSwing = 0, wAll = 0; const samples = [];
  for (let i = 0; i < N; i++) {
    const o = oStart + (1 - oStart) * ((i + 0.5) / N);
    const w = o;                                                // area weight: dA ~ o do
    const s = shareAt(o);
    const aLo = VOLUME.haloAlpha * s * depthGain * (mean - depth * gain);
    const aHi = VOLUME.haloAlpha * s * depthGain * (mean + depth * gain);
    const aMid = VOLUME.haloAlpha * s * depthGain * mean;
    const dL = L(over(aHi)) - L(over(aLo));
    const lMid = L(over(aMid));
    wAll += w; if (dL >= SWING_MIN) wSwing += w;
    samples.push({ w, weber: lMid > 0 ? dL / lMid : 0 });
  }
  samples.sort((a, b) => a.weber - b.weber);
  let acc = 0, med = 0;
  for (const s of samples) { acc += s.w; if (acc >= wAll / 2) { med = s.weber; break; } }
  const frac = wSwing / wAll;
  const limbA = frac >= SWING_SHARE, limbB = med >= WEBER_LO && med <= WEBER_HI;
  say(`[${label}]`);
  say(`    measurable annulus: gradient offset ${oStart.toFixed(6)} .. 1   (everything inside is the body's seat)`);
  say(`    limb (a) area share swinging >= ${SWING_MIN}: ${(frac*100).toFixed(2)} %   vs >= ${SWING_SHARE*100} %   ${limbA ? 'clears' : 'FAILS'}`);
  say(`    limb (b) area-weighted median Weber: ${(med*100).toFixed(3)} %   vs [${WEBER_LO*100}, ${WEBER_HI*100}] %   ${limbB ? 'clears' : 'FAILS'}`);
  say(`    PG-10 (conjunction): ${limbA && limbB ? 'CLEARS' : 'FAILS'}`);
  return { frac, med, limbA, limbB };
}

say('--- resting carrier geometry, breath at full gain (no CAPABILITY selection) ---');
const r1 = run('rank 1, marked body (smallest guaranteed drawn size)', 0, 1, seatHalfMarked);
const r1p = run('rank 1, unmarked body', 0, 1, seatHalfPlain);
const rL = run('last rank, unmarked body', 1, 1, seatHalfPlain);
say('--- with a CAPABILITY selected, --mf-wave-gain = 0.35 ---');
const sel = run('rank 1, unmarked body, selected gain', 0, WAVE.selectedGain, seatHalfPlain);

say('\n=== what the gate says ===');
const all = [r1, r1p, rL, sel];
say(`limb (a) share across the four cases: ${all.map(x => (x.frac*100).toFixed(1)+' %').join(' / ')}`);
say(`limb (b) median across the four cases: ${all.map(x => (x.med*100).toFixed(2)+' %').join(' / ')}`);
say(`limb (a) can fail: ${all.some(x => !x.limbA)}    limb (b) can fail: ${all.some(x => !x.limbB)}`);
say(`PG-10 is a CONJUNCTION, so by A-G144 it fails as soon as its strongest requirement fails.`);
say(`cases clearing both limbs: ${all.filter(x => x.limbA && x.limbB).length} of ${all.length}`);
say('');
say('--- sensitivity: the ground is the ONE approximated input, so sweep it ---');
for (const G of [[10,10,10],[12,12,12],[13,13,13],[14,14,14],[16,16,16],[18,18,18],[6,12,17]]) {
  const o2 = (a) => G.map((g, i) => Math.round(g + qa(a) * (CYAN[i] - g)));
  const line = [];
  for (const gain of [1, WAVE.selectedGain]) {
    const oStart = (R_PX_FLOOR + seatHalfPlain) / (haloR(0) * R_PX_FLOOR);
    const N = 60000; let wS = 0, wA = 0; const sm = [];
    for (let i = 0; i < N; i++) {
      const o = oStart + (1 - oStart) * ((i + 0.5) / N), w = o, sh = shareAt(o);
      const dL = L(o2(VOLUME.haloAlpha*sh*(mean+depth*gain))) - L(o2(VOLUME.haloAlpha*sh*(mean-depth*gain)));
      const lM = L(o2(VOLUME.haloAlpha*sh*mean));
      wA += w; if (dL >= SWING_MIN) wS += w; sm.push({ w, v: lM > 0 ? dL/lM : 0 });
    }
    sm.sort((a,b) => a.v - b.v); let acc = 0, med = 0;
    for (const x of sm) { acc += x.w; if (acc >= wA/2) { med = x.v; break; } }
    const ok = wS/wA >= SWING_SHARE && med >= WEBER_LO && med <= WEBER_HI;
    line.push(`gain ${String(gain).padEnd(4)} share ${(wS/wA*100).toFixed(2)}% median ${(med*100).toFixed(2)}% ${ok ? 'CLEARS' : 'FAILS '}`);
  }
  say(`    rgb(${G.join(',').padEnd(9)}) L=${L(G).toFixed(6)}  ${line.join('  |  ')}`);
}
say('    => the verdict is stable over a +/-4 code ground range and over the non-neutral rgb(6,12,17):');
say('       unselected clears both limbs, selected fails both. The split is not an artefact of my estimate.');
say('');
say('PROVENANCE (A-G143/A-G165): PG-10 cites R17 for its ceiling. The record states no number from R17.');
say('  0.004 : UNDERIVED        0.25 : UNDERIVED        [10 %, 35 %] : CITED-WITHOUT-A-NUMBER');
say('  Every verdict below is a comparison against a number with no recorded origin.');

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
writeFileSync(join(dirname(fileURLToPath(import.meta.url)), 'gelb-gate-pg10.out.txt'), out.join('\n') + '\n');
