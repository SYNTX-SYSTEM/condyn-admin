/** PINK · PHASE G · §53 — PF-5 AND PF-7 RED-FIRST BY RUNTIME INJECTION, on 3ec8457d, :3122.
 *  §52 said the unnamed pins are dischargeable in this lane and that the blocker was the pins'
 *  STATEMENTS, not an instrument. GELB (§115) supplied them. So this runs them, on the phase-E
 *  technique (`pink-p4-mutants.mjs`, `pink-static-mutants.mjs`): faithful runtime injection that
 *  reproduces the mutated RENDER without a rebuild.
 *
 *  PF-5 — ">= 25 % of DISC pixels swing >= 0.004 over one period, blurred."
 *    MUT-PF5-DEPTH0: set `--mf-wave-depth: 0` on the halo and ground groups. Nothing breathes,
 *    so the share must collapse below 25 % and a guard must fire.
 *    GELB's trap, honoured: the share carries its POPULATION beside it (A-G340). PF-5's denominator
 *    is the whole disc rather than a mask, which is what makes it immune to §28's mask-floor
 *    disaster -- so the population is reported to show the denominator did not move, not to defend
 *    a mask choice.
 *
 *  PF-7 — "the swing's phase is monotone in radius; total spread 1200 +/- 300 ms."
 *    The spread's source is visible in the component: `WAVE.edgeLagMs = 1200` (:122), and
 *    `waveDelay(r, shelfNear)` writes it into each layer's `animationDelay`. So the pin's number IS
 *    the constant, and a measurement that returns ~1200 ms is measuring the propagation of that
 *    constant through the compositing chain.
 *    MUT-PF7-NOLAG:  force every wave element's animationDelay to 0s -> spread must go to ~0.
 *    MUT-PF7-REVERSE: NEGATE each element's own animationDelay -> the phase becomes monotone
 *      DECREASING. **PF-7 as stated does not name a DIRECTION.** If a direction-checking guard
 *      fires here it invented one; if it passes, "monotone" is direction-free and the pin should say
 *      so. Either outcome is a finding and the mutant is the only way to learn which -- GELB's
 *      observation, and the reason this limb exists.
 *
 *  PHASE IS FITTED, NOT PEAK-PICKED: least squares at f = 0.1 Hz (the breath's fundamental, period
 *  10000 ms per :122) over a whole number of periods, phase = atan2(-b, a), converted to ms. A
 *  peak-picked phase would be quantised to the frame cadence; a fit is not.
 *  A-G341/A-G430's guard: every figure carries its population, and pixels whose fitted amplitude is
 *  below the measured noise floor are EXCLUDED from the phase statistic, because the phase of a
 *  signal that is not there is uniform noise and would flatten any spread toward zero.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const PERIOD_MS = 10000, F0 = 1 / (PERIOD_MS / 1000);   // 0.1 Hz
const FRAMES = 51, STEP_MS = 400;                        // 20.0 s = two whole periods
const PF5_SWING = 0.004, PF5_SHARE = 0.25;
const PF7_SPREAD_MS = 1200, PF7_TOL_MS = 300;
const RBINS = 12;

const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const med = a => { if (!a.length) return null; const s = Float64Array.from(a).sort(); const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const r4 = v => (v === null || !Number.isFinite(v)) ? null : +v.toFixed(4);

const MUTANTS = {
  BASELINE:        null,
  "MUT-PF5-DEPTH0": { css: `[data-testid="mapping-field"] .mf-wave-halo,[data-testid="mapping-field"] .mf-wave-ground{--mf-wave-depth:0 !important}` },
  "MUT-PF7-NOLAG":  { delay: "zero" },
  "MUT-PF7-REVERSE":{ delay: "negate" },
};

async function run(VW, VH, mutName) {
  const mut = MUTANTS[mutName];
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1800);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");

  // ---- the injection, and a read-back proving it took
  let injected = null;
  if (mut?.css) { await page.addStyleTag({ content: mut.css }); await page.waitForTimeout(500); }
  if (mut?.delay) {
    injected = await page.evaluate(mode => {
      const els = [...document.querySelectorAll('[data-testid="mapping-field"] .mf-wave')];
      const before = els.map(e => getComputedStyle(e).animationDelay);
      els.forEach((e, i) => {
        const d = parseFloat(before[i]) || 0;
        e.style.animationDelay = mode === "zero" ? "0s" : `${-d}s`;
      });
      return { n: els.length, before: before.slice(0, 4),
               after: els.slice(0, 4).map(e => getComputedStyle(e).animationDelay) };
    }, mut.delay);
    await page.waitForTimeout(500);
  }
  const deep = await page.evaluate(() => {
    const halo = document.querySelector('.mf-wave-halo'), grd = document.querySelector('.mf-wave-ground');
    const fe = document.querySelector('[data-testid="mapping-field"]');
    const delays = [...document.querySelectorAll('[data-testid="mapping-field"] .mf-wave')]
      .map(e => getComputedStyle(e).animationDelay);
    return { breath: fe.getAttribute('data-breath'),
      haloDepth: halo ? getComputedStyle(halo).getPropertyValue('--mf-wave-depth').trim() : null,
      groundDepth: grd ? getComputedStyle(grd).getPropertyValue('--mf-wave-depth').trim() : null,
      waveCount: delays.length, distinctDelays: [...new Set(delays)].length,
      delaySpanS: (() => { const v = delays.map(parseFloat).filter(Number.isFinite);
        return v.length ? +(Math.max(...v) - Math.min(...v)).toFixed(4) : null; })(),
      animationRunning: halo ? getComputedStyle(halo).animationName : null };
  });
  if (deep.breath !== "LIVE") throw new Error(`ABORT breath ${deep.breath}`);
  if (!deep.animationRunning || deep.animationRunning === "none") throw new Error("ABORT wave not animating");

  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
    const fr = document.querySelector('[data-testid="mapping-ring-field"]').getBoundingClientRect();
    return { clip: { x: Math.round(svg.x), y: Math.round(svg.y), width: Math.round(svg.width), height: Math.round(svg.height) },
      cx: fr.x + fr.width / 2, cy: fr.y + fr.height / 2, R: fr.width / 2 };
  });
  const clip = geo.clip, W = clip.width, H = clip.height;
  const cx = geo.cx - clip.x, cy = geo.cy - clip.y, R = geo.R;
  const idxA = [], radA = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy, r2 = dx * dx + dy * dy;
    if (r2 <= R * R) { idxA.push(y * W + x); radA.push(Math.sqrt(r2)); }
  }
  const idx = Int32Array.from(idxA), rad = Float64Array.from(radA), N = idx.length;

  const cdp = await page.context().newCDPSession(page);
  // blurred AND unblurred from the SAME buffer -- paired, per §27
  const sharpSum = new Float64Array(N), sinS = new Float64Array(N), cosS = new Float64Array(N);
  const bMin = new Float64Array(N).fill(Infinity), bMax = new Float64Array(N).fill(-Infinity);
  const ts = [];
  const t0 = Date.now();
  for (let f = 0; f < FRAMES; f++) {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const buf = Buffer.from(data, "base64");
    const t = (Date.now() - t0) / 1000; ts.push(t);
    const raw = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const bl = await sharp(buf).blur(2).raw().toBuffer({ resolveWithObject: true });
    const ch = raw.info.channels, d = raw.data, chb = bl.info.channels, db = bl.data;
    const w = 2 * Math.PI * F0 * t, sw = Math.sin(w), cw = Math.cos(w);
    for (let j = 0; j < N; j++) {
      const p = idx[j] * ch, pb = idx[j] * chb;
      const Lu = 0.2126 * LUT[d[p]] + 0.7152 * LUT[d[p + 1]] + 0.0722 * LUT[d[p + 2]];
      const Lb = 0.2126 * LUT[db[pb]] + 0.7152 * LUT[db[pb + 1]] + 0.0722 * LUT[db[pb + 2]];
      if (Lb < bMin[j]) bMin[j] = Lb; if (Lb > bMax[j]) bMax[j] = Lb;
      sharpSum[j] += Lu; sinS[j] += Lu * sw; cosS[j] += Lu * cw;
    }
    if (f < FRAMES - 1) await page.waitForTimeout(STEP_MS);
  }
  await ctx.close(); await b.close();

  // ---- PF-5: share of DISC pixels whose BLURRED peak-to-peak swing >= 0.004
  let over = 0; const swings = [];
  for (let j = 0; j < N; j++) { const s = bMax[j] - bMin[j]; swings.push(s); if (s >= PF5_SWING) over++; }
  const share = over / N;

  // ---- PF-7: fitted amplitude and phase at F0, per pixel
  const amp = new Float64Array(N), phMs = new Float64Array(N);
  for (let j = 0; j < N; j++) {
    const a = (2 / FRAMES) * cosS[j], bb = (2 / FRAMES) * sinS[j];
    amp[j] = Math.hypot(a, bb);
    let ph = Math.atan2(-bb, a); if (ph < 0) ph += 2 * Math.PI;
    phMs[j] = (ph / (2 * Math.PI)) * PERIOD_MS;
  }
  const ampFloor = med(Array.from(amp)) * 0.5;     // a pixel must carry signal to carry a phase
  const keep = [];
  for (let j = 0; j < N; j++) if (amp[j] >= Math.max(ampFloor, 1e-5)) keep.push(j);
  const bins = Array.from({ length: RBINS }, () => []);
  for (const j of keep) { const k = Math.min(RBINS - 1, Math.floor((rad[j] / R) * RBINS)); bins[k].push(phMs[j]); }
  const binMed = bins.map(v => v.length >= 50 ? med(v) : null);
  const populated = binMed.filter(v => v !== null);
  // unwrap the sequence so a wrap at 0/10000 ms is not read as a jump
  const unwrapped = []; let off = 0;
  for (let i = 0; i < populated.length; i++) {
    let v = populated[i] + off;
    if (i > 0) { while (v - unwrapped[i - 1] > PERIOD_MS / 2) { off -= PERIOD_MS; v -= PERIOD_MS; }
                 while (unwrapped[i - 1] - v > PERIOD_MS / 2) { off += PERIOD_MS; v += PERIOD_MS; } }
    unwrapped.push(v);
  }
  const spread = unwrapped.length ? Math.max(...unwrapped) - Math.min(...unwrapped) : null;
  let incr = 0, decr = 0;
  for (let i = 1; i < unwrapped.length; i++) (unwrapped[i] > unwrapped[i - 1]) ? incr++ : decr++;
  const monotone = (incr === 0 || decr === 0);
  const direction = incr > decr ? "INCREASING with radius" : (decr > incr ? "DECREASING with radius" : "flat/mixed");

  return { mutant: mutName, viewport: `${VW}x${VH}`,
    injectionProof: { ...deep, injected },
    framesSampled: FRAMES, stepMs: STEP_MS, spanS: +ts[ts.length - 1].toFixed(1),
    periodsCovered: +(ts[ts.length - 1] / (PERIOD_MS / 1000)).toFixed(3),
    PF5: { discPopulation: N, pixelsOverSwing: over, share: r4(share),
      bound: `>= ${PF5_SHARE}`, pass: share >= PF5_SHARE,
      medianSwing: med(swings) === null ? null : +med(swings).toExponential(4) },
    PF7: { pixelsCarryingSignal: keep.length, ampFloorUsed: +ampFloor.toExponential(3),
      binsPopulated: populated.length, binMediansMs: binMed.map(v => v === null ? null : +v.toFixed(0)),
      spreadMs: spread === null ? null : +spread.toFixed(0),
      bound: `${PF7_SPREAD_MS} +/- ${PF7_TOL_MS} ms`,
      spreadPass: spread !== null && Math.abs(spread - PF7_SPREAD_MS) <= PF7_TOL_MS,
      monotone, direction, stepsUp: incr, stepsDown: decr } };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, stand: BASE, shelfAlpha: 0.02,
  pin: "PF-5 and PF-7 red-first by runtime injection (PINK §53)",
  statements: { "PF-5": ">= 25 % of disc pixels swing >= 0.004 over one period, blurred (GELB §115)",
    "PF-7": "phase monotone in radius; total spread 1200 +/- 300 ms (GELB §115)" },
  technique: "faithful runtime injection, no rebuild — the phase-E method of pink-p4-mutants.mjs",
  runs: [] };
for (const m of ["BASELINE", "MUT-PF5-DEPTH0", "MUT-PF7-NOLAG", "MUT-PF7-REVERSE"])
  out.runs.push(await run(1920, 1080, m));
console.log(JSON.stringify(out, null, 1));
