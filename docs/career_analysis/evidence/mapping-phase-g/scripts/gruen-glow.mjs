/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-10's TWO SURVIVING LIMBS on the visible glow.
 * **NO VERDICT** (A-G36 point 2).
 *
 * A-G26 / A-G37: the max-swing limb is WITHDRAWN — PINK's committed static jitter floor is 0.031872 with
 * nothing animating, above both the 0.030 ceiling and the 0.0297 reading, so by A-F11 it was never a bound.
 * There is NO baseline: §12/§14's 35.3 %/33.0 % and Weber p50 20.6 %/22.6 % are prose attached to a vanished
 * tree (A-G41). **This is a first measurement, and it does not attempt to reproduce 0.0297.**
 *
 * The two surviving limbs, on the VISIBLE GLOW (mean luminance ≥ 2 × local ground):
 *   limb 1 — ≥ 25 % of carrier pixels swing ≥ 0.004
 *   limb 2 — the median Weber fraction lies in [10 %, 35 %]
 *
 * A-G26's replacement ceiling (p999.9 of per-pixel swing on CO-REGISTERED frames, thresholded at the run's
 * own floor) is NOT reported as satisfied here: co-registration does not exist in either lane's instrument
 * and A-G26 calls it "a prerequisite, not an assumption". The uncoregistered p9999 is emitted as material
 * only, named as such.
 *
 * Render mode: "travel-masked" (A-G42 point 1 / A-G32) — the travel is DRAWN and excluded by its own mask,
 * never hidden, because G-3 puts the arc's own glow under it and hiding would reveal glow, not ground.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, captureRaw, decodeLuminance,
  classMasks, travelMask, servedProvenance, PROVENANCE, RENDER_MODES, WINDOW_SECONDS,
  HARMONICS, NULL_FREQS, lockIn, stats, median, fracAbove, pct, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const VOLUME = { haloNear: 2.6, haloFar: 3.0 };

const browser = await chromium.launch();

/* ── pass 1 · masks and the carrier, under reduced motion so the breath never enters a mask ────────── */
const R1 = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(R1.page, WT);
const geo = await probeGeometry(R1.page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, W, H, discPixels } = geom;
const cdp1 = await cdpSession(R1.page);
const base = await captureLuminance(cdp1, clip, N);
const { masks } = await classMasks(R1.page, cdp1, clip, N, ["glowsAll", "glowsBreathing", "bodyOutlines", "bodyNames", "arcs", "beams", "nodes", "sectorText"]);
const travel = await travelMask(R1.page, cdp1, clip, N);
await R1.ctx.close();

/**
 * PG-10's carrier is the BREATHING glow, not every glow. Only non-shelf halo circles carry `mf-wave-halo`
 * (PersonJobMappingField.tsx:670) — the shelf is a still ring (A-F8), so a shelf glow cannot swing by design.
 * Measured live at L0: 5 glows, of which 3 belong to shelf bodies. Including them dilutes BOTH limbs, because
 * a pixel that cannot swing is counted in the denominator of "fraction of pixels that swing". The still glows
 * are therefore measured SEPARATELY and reported beside the carrier rather than mixed into it.
 */
const isGlow = new Uint8Array(N); for (const i of masks.glowsBreathing) isGlow[i] = 1;
const isStillGlow = new Uint8Array(N);
{ const breathing = new Set(masks.glowsBreathing); for (const i of masks.glowsAll) if (!breathing.has(i)) isStillGlow[i] = 1; }
const isMark = new Uint8Array(N);
for (const cls of ["bodyOutlines", "bodyNames", "arcs", "beams", "nodes", "sectorText"]) for (const i of masks[cls]) isMark[i] = 1;
const isTravel = new Uint8Array(N); for (const i of travel) isTravel[i] = 1;

/** Per body: the local ground just OUTSIDE its glow — annulus [3.2 r, 4.0 r], no glow, no mark, inside the disc. */
const k = geo.unitsToPx;
const perBody = [];
for (const b of geo.bodies.filter(x => x.inPool)) {
  // a shelf body's glow is still by design (A-F8) and is not part of PG-10's carrier
  const bcx = b.cx - clip.x, bcy = b.cy - clip.y, rPx = b.drawnRadiusUnits * k;
  const lo = 3.2 * rPx, hi = 4.0 * rPx, ground = [];
  const x0 = Math.max(0, Math.floor(bcx - hi)), x1 = Math.min(W - 1, Math.ceil(bcx + hi));
  const y0 = Math.max(0, Math.floor(bcy - hi)), y1 = Math.min(H - 1, Math.ceil(bcy + hi));
  for (let y = y0; y <= y1; y += 1) for (let x = x0; x <= x1; x += 1) {
    const i = y * W + x, d = Math.hypot(x - bcx, y - bcy);
    if (d < lo || d > hi || !disc[i] || isGlow[i] || isStillGlow[i] || isMark[i] || isTravel[i]) continue;
    ground.push(base[i]);
  }
  const localGround = ground.length >= 200 ? median(ground) : null;
  /** this body's own glow pixels: inside haloFar, in the glow mask, not travel, not another mark */
  const own = [];
  const outer = VOLUME.haloFar * rPx;
  for (let y = Math.max(0, Math.floor(bcy - outer)); y <= Math.min(H - 1, Math.ceil(bcy + outer)); y += 1)
    for (let x = Math.max(0, Math.floor(bcx - outer)); x <= Math.min(W - 1, Math.ceil(bcx + outer)); x += 1) {
      const i = y * W + x;
      if (!isGlow[i] || isTravel[i] || isMark[i]) continue;
      if (Math.hypot(x - bcx, y - bcy) > outer) continue;
      own.push(i);
    }
  const carrier = localGround === null ? [] : own.filter(i => base[i] >= 2 * localGround);
  perBody.push({ id: b.id, rank: b.rank, shelf: b.shelf, requiredGaps: b.requiredGaps, drawnRadiusPx: +rPx.toFixed(2), localGround: e4(localGround), groundSamples: ground.length, glowPixels: own.length, carrierPixels: carrier.length, carrierFraction: +(carrier.length / Math.max(1, own.length)).toFixed(4), _carrier: carrier });
}
const carrierSet = new Set();
for (const b of perBody) for (const i of b._carrier) carrierSet.add(i);
/** The medium: disc pixels that are neither glow, mark nor travel — PG-10's comparison ground. */
const mediumIx = [];
for (let i = 0; i < N; i += 1) if (disc[i] && !isGlow[i] && !isStillGlow[i] && !isMark[i] && !isTravel[i]) mediumIx.push(i);
const stillGlowIx = []; for (let i = 0; i < N; i += 1) if (isStillGlow[i]) stillGlowIx.push(i);
const carrierIx = [...carrierSet];
/** Subsample the medium so the union stays tractable; deterministic stride, no randomness. */
const MEDIUM_CAP = 120000;
const stride = Math.max(1, Math.ceil(mediumIx.length / MEDIUM_CAP));
const mediumSample = mediumIx.filter((_, n) => n % stride === 0);
const stillSample = stillGlowIx.filter((_, n) => n % Math.max(1, Math.ceil(stillGlowIx.length / 40000)) === 0);
const union = [...new Set([...carrierIx, ...mediumSample, ...stillSample])];
const posOf = new Map(union.map((v, n) => [v, n]));
const U = union.length;

/* ── pass 2 · the live window, travel DRAWN (masked, not hidden), ≥ WINDOW_SECONDS, decode deferred ── */
const L2 = await openField(browser, { reduce: false, vw: VW, vh: VH });
const geo2 = await probeGeometry(L2.page);
const clip2 = clipOf(geo2, VW, VH);
const clipMatch = clip2.x === clip.x && clip2.y === clip.y && clip2.width === clip.width && clip2.height === clip.height;
const cdp2 = await cdpSession(L2.page);
const shots = [], ts = [], t0 = Date.now();
while (Date.now() - t0 < WINDOW_SECONDS * 1000) { shots.push(await captureRaw(cdp2, clip2)); ts.push((Date.now() - t0) / 1000); }
await L2.ctx.close(); await browser.close();

const rows = [];
for (const s of shots) { const L = await decodeLuminance(s, N); const row = new Float32Array(U); for (let n = 0; n < U; n += 1) row[n] = L[union[n]]; rows.push(row); }
const F = rows.length;
const spanS = ts[F - 1] - ts[0];
const cadenceMs = (spanS * 1000) / Math.max(1, F - 1);
const nyquistHz = 1000 / (2 * cadenceMs);
const maxFreq = Math.max(...HARMONICS, ...NULL_FREQS);
const adequacy = { cadenceMs: +cadenceMs.toFixed(0), nyquistHz: +nyquistHz.toFixed(3), maxFittedFreqHz: maxFreq, limit: +(0.9 * nyquistHz).toFixed(3), adequate: maxFreq < 0.9 * nyquistHz };
const windowRule = { seconds: +spanS.toFixed(1), deltaFHz: 0.05, requiredSeconds: +(2 / (0.7 * 0.05)).toFixed(0), satisfied: spanS >= 2 / (0.7 * 0.05) };

const localIx = ix => ix.map(i => posOf.get(i)).filter(n => n !== undefined);
function swingOn(ix) {
  const local = localIx(ix), m = local.length;
  const swing = new Float64Array(m), weber = new Float64Array(m);
  for (let kk = 0; kk < m; kk += 1) {
    const n = local[kk];
    let lo = Infinity, hi = -Infinity, sum = 0;
    for (let r = 0; r < F; r += 1) { const v = rows[r][n]; if (v < lo) lo = v; if (v > hi) hi = v; sum += v; }
    swing[kk] = hi - lo;
    weber[kk] = sum > 0 ? (hi - lo) / (sum / F) : 0;
  }
  const sS = Float64Array.from(swing); sS.sort();
  return { px: m, swing: stats(swing), weber: stats(weber), fracSwingGe0004: fracAbove(swing, 0.004), swing_p9999_uncoregistered: e4(pct(sS, 0.9999)), weberMedian: +median(weber).toFixed(5) };
}
const carrier = swingOn(carrierIx), medium = swingOn(mediumSample), stillGlow = swingOn(stillSample);

/** Coherent energy at the breath's harmonics, each against its bracketed dof-matched null. */
function coherent(ix) {
  const local = localIx(ix), m = local.length;
  if (m === 0) return { px: 0 };
  const lock = lockIn(ts);
  const y = new Float64Array(F), pooled = new Float64Array(F);
  const sig = new Float64Array(m), nul = new Float64Array(m);
  for (let kk = 0; kk < m; kk += 1) {
    const n = local[kk];
    let mean = 0;
    for (let r = 0; r < F; r += 1) { y[r] = rows[r][n]; mean += y[r]; pooled[r] += rows[r][n]; }
    mean /= F;
    for (let r = 0; r < F; r += 1) y[r] -= mean;
    const f = lock.fit(y); sig[kk] = f.signal; nul[kk] = f.null;
  }
  let pm = 0; for (let r = 0; r < F; r += 1) { pooled[r] /= m; pm += pooled[r]; } pm /= F;
  const pf = lock.fit(Float64Array.from(pooled, v => v - pm));
  const sS = Float64Array.from(sig); sS.sort(); const nS = Float64Array.from(nul); nS.sort();
  return { px: m, pooledSignal: e4(pf.signal), pooledNull: e4(pf.null), pooledRatio: +(pf.signal / pf.null).toFixed(2), perPixelP99: e4(pct(sS, 0.99)), perPixelNullP99: e4(pct(nS, 0.99)), perPixelNullP50: e4(pct(nS, 0.5)) };
}

const out = {
  reading: "GRÜN development reading · PG-10's two surviving limbs on the visible glow",
  verdict: PROVENANCE.verdict,
  priorBaseline: "NONE — A-G41 voided §12/§14's readings; A-G26 withdrew the max-swing limb; A-G37 instructs a FIRST measurement and forbids reproducing 0.0297.",
  renderMode: RENDER_MODES.PF8, renderModeNote: "travel DRAWN, excluded by its own mask (A-G42 point 1 / A-G32). PG-11's travel-drawn-on-relation-pixels pass is a SEPARATE run and may not reuse these frames (A-G42 point 3).",
  provenance, instrument: PROVENANCE, guard: { masksPass: R1.guard, livePass: L2.guard },
  viewport: `${VW}x${VH}`, region: `${W}x${H}`, discPixels, clipMatch, frames: F, spanS: +spanS.toFixed(1),
  adequacyGuard: adequacy, windowRule,
  definitions: {
    carrierIsBreathingGlowOnly: "the carrier is the BREATHING glow (.mf-wave-halo). Shelf glows are still by design (A-F8) and are excluded; at L0 three of five glows are shelf glows, so including them diluted both limbs in this instrument's first reading.",
    carrier: "A-G22's carrier: a body's own glow-mask pixels (inside haloFar) whose base luminance ≥ 2 × that body's LOCAL ground; local ground = median of disc pixels in the annulus [3.2 r, 4.0 r] that are neither glow, mark nor travel",
    localGroundCaveat: "per body, not a single disc-wide ground — the §13 lesson was that a statistic written for one ground reads differently on another",
    medium: "disc pixels that are neither glow, mark nor travel; deterministically subsampled by stride for tractability",
    swing: "per-pixel (max − min) over the live window",
    weber: "per-pixel swing ÷ that pixel's own temporal MEAN (named explicitly: /mean, not /min — a definitional choice PINK may differ on, which A-G36 point 4 makes a finding rather than something to reconcile)",
    limb1: "fraction of carrier pixels with swing ≥ 0.004 (bound ≥ 0.25)",
    limb2: "median Weber fraction over carrier pixels (bound [0.10, 0.35])",
    withdrawnLimb: "the 0.030 max-swing ceiling is NOT evaluated — withdrawn by A-G26",
    ceilingNotMeasured: "A-G26's replacement ceiling needs p999.9 on CO-REGISTERED frames; co-registration does not exist in this instrument, so swing_p9999_uncoregistered is MATERIAL ONLY and is not that ceiling"
  },
  PG10_limb1_fracCarrierSwingGe0004: carrier.fracSwingGe0004,
  PG10_limb1_boundForReference: ">= 0.25",
  PG10_limb2_medianWeber: carrier.weberMedian,
  PG10_limb2_boundForReference: "[0.10, 0.35]",
  carrier, medium,
  stillGlow_shelfBodies: { ...stillGlow, note: "a shelf body's glow is STILL by design (A-F8); reported beside the carrier, never inside it. An earlier reading of this instrument mixed these in and diluted both limbs." },
  coherentEnergy: { carrier: coherent(carrierIx), medium: coherent(mediumSample), harmonics: HARMONICS, nullFreqs: NULL_FREQS },
  perBody: perBody.map(({ _carrier, ...rest }) => rest),
  stageGroundNote: "the glow lives OUTSIDE the medium group (mapping-glows) since A-G10 pin 7; PG-17's domain is glows + the medium beneath them (A-G31), which this carrier definition follows"
};
writeFileSync(resolve(here, `../outputs/glow-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ frames: F, spanS: out.spanS, adequate: adequacy.adequate, windowOk: windowRule.satisfied, carrierPx: carrier.px, limb1: out.PG10_limb1_fracCarrierSwingGe0004, limb2: out.PG10_limb2_medianWeber, carrierSwingP50: carrier.swing.p50, mediumSwingP50: medium.swing.p50 }, null, 1));
