/** PINK · PHASE G · §30: A-G366 — the s/c > 0.5503 foreign-mover fraction, split at the QUANTISER boundary.
 *  Stand: PINK :3122, commit 3ec8457d, BUILD_ID xCD8LBxdjnP97-2Gjs5yr (same build as §10/§27/§28).
 *
 *  GELB's block [2] rests on `s/c = opSwing / op_sampled`: a pixel's swing over its contribution equals the
 *  group-opacity swing over the sampled group opacity, because the gradient alpha and the (S−D) term cancel.
 *  **That cancellation is exact only if luminance is LINEAR in group opacity, and it is not.** CSS composites
 *  group opacity in ENCODED sRGB — `v = a·S + (1−a)·D` is affine in `a` on the byte channel — while WCAG
 *  luminance DECODES that byte: linear below 0.03928 (byte <= ~10) and then a 2.4 power. So:
 *    · in the deep dark, where the composited channel sits under ~10/255, the decode IS linear and GELB's
 *      relation is EXACT. The stage ground is rgb(3,5,8), so much of the glow lives in that regime.
 *    · above it L is CONVEX in `a`, so s/c EXCEEDS the linear value and the capability threshold is SMALLER
 *      than 0.01502 / 0.04292.
 *  Analytic worst case (pure 2.4 power, no pedestal): s/c = 2.4 × linear, so capability -> 0.00626 (unsel)
 *  and 0.01788 (sel). **Both still exceed 0.004, so GELB's monotonicity conclusion survives the worst case.**
 *  This run replaces that bound with a measurement: the capability threshold is located EMPIRICALLY as the
 *  contribution `c` at which the median swing `s` crosses 0.004, per state, and compared to the derived value.
 *
 *  ONE SHARED MASK, AND THAT IS THE SECOND REPAIR. §28 derived its mask INSIDE each state (`run(…, select)`
 *  applied the selection in pass 1), so sel/none was a ratio of two different pixel sets — GELB's hypothesis
 *  (1), confirmed from source and from §28's own tracked counts (36268 unselected vs 43753 selected at 1920).
 *  Here the pixel SET is defined once, unselected, and both states are measured on it, so `M` genuinely
 *  cancels and GELB's flatness test becomes valid. Contribution `c` is still measured PER STATE, because
 *  selection changes what the halo composites over.
 *  **If the shared-mask ratio is flat unblurred and drifts blurred, blur-boundary mixing is the residue.**
 *
 *  Sampling asserted, not assumed: the reduce passes read the computed opacity of `.mf-wave-halo` and the
 *  inherited `--mf-wave-gain`, and abort unless they are the mean (0.8825) and 1 / 0.35. A-G341's guard is
 *  honoured throughout — **the mask population is reported beside every share, always.**
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const SWING_T = 0.004, SHARE_BOUND = 0.25, FRAMES = 27, STEP_MS = 500;
const MEAN = 0.8825, DEPTH = 0.1175, SEL_GAIN = 0.35;   // source :122 / :274 / :275, w in [-1,1] per :174
const OP_SWING = { none: 2 * DEPTH, sel: 2 * DEPTH * SEL_GAIN };
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

async function boot(VW, VH, motion, select) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: motion });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1800);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");
  if (select) { await page.locator(`[data-testid="mapping-capability-${select}"]`).click({ force: true }).catch(() => {});
    await page.waitForTimeout(700); }
  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const rings = [];
    document.querySelectorAll('[data-testid^="mapping-ring"]').forEach(el => { const r = el.getBoundingClientRect();
      rings.push({ id: el.getAttribute('data-testid'), rpx: +(r.width / 2).toFixed(3), cx: +(r.x + r.width / 2).toFixed(3), cy: +(r.y + r.height / 2).toFixed(3) }); });
    rings.sort((a, b) => b.rpx - a.rpx);
    const field = [];
    document.querySelectorAll('.mf-halo').forEach((g, i) => { const c = g.querySelector('circle');
      if (!c || !c.classList.contains('mf-wave-halo')) return;
      const r = c.getBoundingClientRect(), cs = getComputedStyle(c);
      field.push({ haloDomIndex: i, cx: +(r.x + r.width / 2).toFixed(2), cy: +(r.y + r.height / 2).toFixed(2), rpx: +(r.width / 2).toFixed(2),
        waveOpacity: Number(cs.opacity), waveGain: cs.getPropertyValue('--mf-wave-gain').trim() || "(unset -> 1)",
        animationName: cs.animationName, groupOpacity: Number(getComputedStyle(g).opacity) }); });
    const fe = document.querySelector('[data-testid="mapping-field"]');
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      rings, outermostRing: rings[0], field, selection: fe.getAttribute('data-selection'), breath: fe.getAttribute('data-breath') };
  });
  return { b, page, geo };
}
const decode = async (data, blur) => { const img = blur ? sharp(Buffer.from(data, "base64")).blur(2) : sharp(Buffer.from(data, "base64"));
  const s = await img.raw().toBuffer({ resolveWithObject: true }); return { ch: s.info.channels, d: s.data }; };
const lumAll = ({ ch, d }, N) => { const L = new Float64Array(N);
  for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; } return L; };
const lumAt = ({ ch, d }, idx) => { const L = new Float64Array(idx.length);
  for (let j = 0; j < idx.length; j++) { const q = idx[j] * ch; L[j] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; } return L; };
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort(); const i = Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1)))); return s[i]; };

/** reduce pass: contribution c of the deepest field halo, on a given index set (or defining one). */
async function contribution(VW, VH, select, idxIn, clipIn) {
  const A = await boot(VW, VH, "reduce", select);
  if (A.geo.outermostRing.id !== "mapping-ring-field") { await A.b.close(); throw new Error("ABORT outermost ring " + A.geo.outermostRing.id); }
  const clip = clipIn ?? A.geo.clip, W = clip.width, H = clip.height, N = W * H;
  const deep = A.geo.field[A.geo.field.length - 1];
  // SAMPLING ASSERTED: the un-animated base is var(--mf-wave-mean) (:272), so a reduce capture is the MEAN.
  const expectGain = select ? SEL_GAIN : 1;
  const sampling = { waveOpacity: deep.waveOpacity, waveGainRaw: deep.waveGain, animationName: deep.animationName,
    breath: A.geo.breath, expectedMean: MEAN, sampledAtMean: Math.abs(deep.waveOpacity - MEAN) < 2e-3,
    expectedGain: expectGain, gainMatches: A.geo.breath === "STILL" || (parseFloat(deep.waveGain) || 1) === expectGain };
  if (!sampling.sampledAtMean) { await A.b.close(); throw new Error(`ABORT .mf-wave-halo opacity ${deep.waveOpacity} != mean ${MEAN} — mask is not sampled at the mean`); }
  const cdp = await A.page.context().newCDPSession(A.page);
  const shot = async () => (await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true })).data;
  const shotBytes = await shot();
  const base1 = lumAll(await decode(shotBytes, false), N);
  const base2 = lumAll(await decode(await shot(), false), N);
  await A.page.evaluate(i => { const g = document.querySelectorAll('.mf-halo')[i]; g.style.visibility = 'hidden'; g.setAttribute('data-pink-hidden','1'); }, deep.haloDomIndex);
  await A.page.waitForTimeout(430);
  const noHalo = lumAll(await decode(await shot(), false), N);
  await A.b.close();
  // disc-scoped jitter (§28: exactly zero), floor = smallest positive
  const cx = A.geo.outermostRing.cx - clip.x, cy = A.geo.outermostRing.cy - clip.y, R = A.geo.outermostRing.rpx;
  let jitDisc = 0, discN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy;
    if (dx*dx + dy*dy <= R*R) { discN++; const i = y*W+x, dd = Math.abs(base1[i]-base2[i]); if (dd > jitDisc) jitDisc = dd; } }
  let idx = idxIn, c;
  if (!idx) { idx = []; for (let i = 0; i < N; i++) if (base1[i] - noHalo[i] > Math.max(jitDisc*2, 1e-9)) idx.push(i); }
  c = new Float64Array(idx.length);
  for (let j = 0; j < idx.length; j++) c[j] = base1[idx[j]] - noHalo[idx[j]];
  // Per-pixel luminance QUANTUM: half an LSB on each channel, summed. This is the uncertainty in c that
  // 8-bit rounding alone can produce, and it is what A-G30 ("a ratio of two floor values is not a
  // measurement") needs in order to be applied rather than merely cited. Measured from the actual bytes,
  // not assumed from the dark-regime constant.
  const q = new Float64Array(idx.length);
  { const s1 = await decode(shotBytes, false); const ch = s1.ch, d = s1.d;
    const g = v => { const cc = v / 255; return cc <= 0.03928 ? cc / 12.92 : Math.pow((cc + 0.055) / 1.055, 2.4); };
    const W2 = [0.2126, 0.7152, 0.0722];
    for (let j = 0; j < idx.length; j++) { const p = idx[j] * ch; let acc = 0;
      for (let k = 0; k < 3; k++) { const v = d[p + k]; acc += W2[k] * Math.abs(g(Math.min(255, v + 1)) - g(v)); }
      q[j] = 0.5 * acc; } }
  return { clip, idx, c, q, deep, sampling, jitDisc: +jitDisc.toExponential(5), discPixels: discN, clipPixels: N, geo: A.geo };
}

/** live pass: per-pixel swing on a fixed index set, blurred and unblurred from the SAME captures. */
async function swing(VW, VH, select, clip, idx, refDeep) {
  const B = await boot(VW, VH, "no-preference", select);
  const d = B.geo.field[B.geo.field.length - 1];
  const same = Math.abs(d.cx - refDeep.cx) < 0.75 && Math.abs(d.cy - refDeep.cy) < 0.75 && Math.abs(d.rpx - refDeep.rpx) < 0.75;
  if (!same) { await B.b.close(); throw new Error("ABORT deepest halo geometry differs between mask and swing contexts"); }
  const cdp = await B.page.context().newCDPSession(B.page);
  const mnU = new Float64Array(idx.length).fill(Infinity), mxU = new Float64Array(idx.length).fill(-Infinity);
  const mnB = new Float64Array(idx.length).fill(Infinity), mxB = new Float64Array(idx.length).fill(-Infinity);
  for (let fr = 0; fr < FRAMES; fr++) {
    const data = (await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true })).data;
    const raw = await decode(data, false), blr = await decode(data, true);
    const u = lumAt(raw, idx), v = lumAt(blr, idx);
    for (let j = 0; j < idx.length; j++) { if (u[j] < mnU[j]) mnU[j] = u[j]; if (u[j] > mxU[j]) mxU[j] = u[j];
      if (v[j] < mnB[j]) mnB[j] = v[j]; if (v[j] > mxB[j]) mxB[j] = v[j]; }
    if (fr < FRAMES - 1) await B.page.waitForTimeout(STEP_MS);
  }
  const animating = d.animationName && d.animationName !== "none";
  await B.b.close();
  const sU = new Float64Array(idx.length), sB = new Float64Array(idx.length);
  for (let j = 0; j < idx.length; j++) { sU[j] = mxU[j] - mnU[j]; sB[j] = mxB[j] - mnB[j]; }
  return { sU, sB, animating, waveGain: d.waveGain, selection: B.geo.selection, breath: B.geo.breath };
}

/** locate, empirically, the contribution c at which median swing crosses SWING_T. */
function capability(c, s) {
  const lo = Math.log10(Math.max(1e-10, pct(c, 0.0005) || 1e-10)), hi = Math.log10(Math.max(1e-9, pct(c, 0.9995) || 1e-9));
  const NB = 48, bins = Array.from({ length: NB }, () => []);
  for (let j = 0; j < c.length; j++) { if (c[j] <= 0) continue;
    const t = (Math.log10(c[j]) - lo) / (hi - lo); const b = Math.min(NB - 1, Math.max(0, Math.floor(t * NB))); bins[b].push(s[j]); }
  const rows = bins.map((v, b) => ({ cCentre: +Math.pow(10, lo + ((b + 0.5) / NB) * (hi - lo)).toExponential(4),
    n: v.length, medianSwing: v.length ? +pct(v, 0.5).toExponential(4) : null })).filter(r => r.n >= 30);
  let cross = null;
  for (let i = 1; i < rows.length; i++) {
    const a = rows[i-1], b = rows[i];
    if (a.medianSwing < SWING_T && b.medianSwing >= SWING_T) {
      const f = (SWING_T - a.medianSwing) / (b.medianSwing - a.medianSwing);
      cross = +Math.pow(10, Math.log10(a.cCentre) + f * (Math.log10(b.cCentre) - Math.log10(a.cCentre))).toExponential(5);
      break; } }
  return { empiricalCapabilityThreshold: cross, bins: rows };
}

async function run(VW, VH) {
  // ONE shared pixel set, defined unselected
  const cNone = await contribution(VW, VH, null, null, null);
  const cSel  = await contribution(VW, VH, "PCAP_PG", cNone.idx, cNone.clip);
  const wNone = await swing(VW, VH, null, cNone.clip, cNone.idx, cNone.deep);
  const wSel  = await swing(VW, VH, "PCAP_PG", cNone.clip, cNone.idx, cNone.deep);

  const states = {};
  for (const [name, cc, ww] of [["none", cNone, wNone], ["sel", cSel, wSel]]) {
    const ratio = [];
    for (let j = 0; j < cc.c.length; j++) if (cc.c[j] > 1e-6) ratio.push(ww.sU[j] / cc.c[j]);
    const derivedLinear = OP_SWING[name] / MEAN;
    const cap = capability(cc.c, ww.sU);
    states[name] = {
      sampling: cc.sampling, animatingInLivePass: ww.animating, waveGainInLivePass: ww.waveGain, selectionAttr: ww.selection,
      maskPopulation: cc.idx.length,
      contribution_c: { median: +pct(cc.c,0.5).toExponential(4), p05: +pct(cc.c,0.05).toExponential(4), p95: +pct(cc.c,0.95).toExponential(4), max: +pct(cc.c,1).toExponential(4) },
      swing_s: { median: +pct(ww.sU,0.5).toExponential(4), p95: +pct(ww.sU,0.95).toExponential(4), max: +pct(ww.sU,1).toExponential(4) },
      ratio_s_over_c: { n: ratio.length, p05: +pct(ratio,0.05).toFixed(5), median: +pct(ratio,0.5).toFixed(5), p95: +pct(ratio,0.95).toFixed(5) },
      derivedLinear_sOverC: +derivedLinear.toFixed(5),
      medianRatioOverDerived: +(pct(ratio,0.5)/derivedLinear).toFixed(4),
      derivedCapability: +(SWING_T * MEAN / OP_SWING[name]).toExponential(5),
      empiricalCapability: cap.empiricalCapabilityThreshold,
      empiricalOverDerived: cap.empiricalCapabilityThreshold ? +(cap.empiricalCapabilityThreshold / (SWING_T * MEAN / OP_SWING[name])).toFixed(4) : null,
      empiricalCapabilityAbove0_004: cap.empiricalCapabilityThreshold !== null ? cap.empiricalCapabilityThreshold > SWING_T : null,
      bins: cap.bins,
    };
  }
  // ---- A-G366: fraction of masked pixels above GELB's derived ceiling, SPLIT at the quantiser ----
  // GELB's ceiling 0.5503 = max s/c over every share, both states, three backdrops. Its argument that
  // "quantisation cannot raise it" holds for the NUMERATOR -- rounding cannot manufacture swing the opacity
  // range does not contain. **It does not hold for the RATIO**, because the DENOMINATOR c can be quantised
  // DOWN: if the true c is 1.9 LSB and it rounds to 1 LSB, s/c nearly doubles with no foreign mover present.
  // So the test is reported against a ladder of admissibility in units of the pixel's OWN quantum q, and
  // the unrestricted figure is reported too -- as the one GELB asked for and the one that cannot be read.
  const CEIL = 0.5503, KS = [0, 1, 2, 5, 10];
  const foreign = {};
  for (const [name, cc, ww] of [["none", cNone, wNone], ["sel", cSel, wSel]]) {
    const rows = KS.map(k => {
      let n = 0, over = 0, maxSC = 0; const keep = [];
      for (let j = 0; j < cc.c.length; j++) { if (cc.c[j] <= 0) continue;
        if (cc.c[j] < k * cc.q[j]) continue;
        const sc = ww.sU[j] / cc.c[j]; n++; if (sc > CEIL) over++; if (sc > maxSC) maxSC = sc; keep.push(sc); }
      return { admissibility: k === 0 ? "none (as asked)" : `c >= ${k} x quantum`, pixels: n,
        fractionOfMask: +(n / cc.c.length).toFixed(4),
        aboveCeiling: over, fractionAboveCeiling: n ? +(over / n).toFixed(4) : null,
        maxRatio: +maxSC.toFixed(3),
        medianRatio: keep.length ? +pct(keep, 0.5).toFixed(5) : null,
        p95Ratio: keep.length ? +pct(keep, 0.95).toFixed(5) : null };
    });
    foreign[name] = { ceiling: CEIL, exactAtCapability: name === "none" ? 0.3756 : 0.1504,
      quantum: { median: +pct(cc.q, 0.5).toExponential(4), p05: +pct(cc.q, 0.05).toExponential(4), p95: +pct(cc.q, 0.95).toExponential(4) },
      ladder: rows };
  }

  // ---- A-G373: is the NUMERATOR resolved? Measured, not simulated. ----
  // GELB: "your 10q rung resolves the DENOMINATOR and not the NUMERATOR", with a simulation putting the
  // selected `s` at 18.5 % of true at c = 10q and selected s/c reading 0.0194 against an exact 0.1504.
  // **My §30 ladder measured 0.16919 there, 8.7x its simulated value, and moving DOWNWARD toward the exact
  // value as the rung tightens** -- the opposite of an attenuation being relieved. Its structural claim is
  // nonetheless true as logic: nothing in an admissibility clause on `c` checks `s`. So `s` is measured in
  // units of each pixel's own quantum, which answers "is it resolved" with no ground truth and no model:
  //   s/q >> 1  -> the swing spans many codes and is resolved
  //   s/q  < 1  -> the swing spans less than one code; GELB's annihilation case
  // and the rung at which the measured median s/c first comes within 10 % / 5 % of the EXACT s/c is solved
  // by a fine scan, to be set against GELB's derived 11.2 / 57.4 (10 %) and 29.2 / 57.9 (5 %) quanta.
  const EXACT_SC = { none: 0.3756, sel: 0.1504 };
  const numerator = {};
  for (const [name, cc, ww] of [["none", cNone, wNone], ["sel", cSel, wSel]]) {
    const at = k => { const sq = [], sc = [], scB = []; let below1 = 0, below2 = 0, n = 0;
      for (let j = 0; j < cc.c.length; j++) { if (cc.c[j] <= 0 || cc.c[j] < k * cc.q[j]) continue;
        n++; const r = ww.sU[j] / cc.q[j]; sq.push(r); if (r < 1) below1++; if (r < 2) below2++;
        sc.push(ww.sU[j] / cc.c[j]); scB.push(ww.sB[j] / cc.c[j]); }
      return { pixels: n, medianS_over_q: sq.length ? pct(sq, 0.5) : null, p05S_over_q: sq.length ? pct(sq, 0.05) : null,
        fracSwingBelow1q: n ? below1 / n : null, fracSwingBelow2q: n ? below2 / n : null,
        medianS_over_c: sc.length ? pct(sc, 0.5) : null, medianSblur_over_c: scB.length ? pct(scB, 0.5) : null }; };
    const ladder = [0, 1, 2, 5, 10, 20, 30, 60, 90].map(k => { const r = at(k);
      return { admissibility: k === 0 ? "none" : `c >= ${k}q`, pixels: r.pixels,
        medianS_over_q: r.medianS_over_q === null ? null : +r.medianS_over_q.toFixed(3),
        p05S_over_q: r.p05S_over_q === null ? null : +r.p05S_over_q.toFixed(3),
        fracSwingBelow1q: r.fracSwingBelow1q === null ? null : +r.fracSwingBelow1q.toFixed(4),
        fracSwingBelow2q: r.fracSwingBelow2q === null ? null : +r.fracSwingBelow2q.toFixed(4),
        medianS_over_c: r.medianS_over_c === null ? null : +r.medianS_over_c.toFixed(5),
        medianSblur_over_c: r.medianSblur_over_c === null ? null : +r.medianSblur_over_c.toFixed(5),
        relErrVsExact: r.medianS_over_c === null ? null : +((r.medianS_over_c - EXACT_SC[name]) / EXACT_SC[name]).toFixed(4) }; });
    // fine scan: smallest rung whose measured median s/c is within 10 % / 5 % of exact, and where s/q crosses 10 / 20
    let w10 = null, w05 = null, q10 = null, q20 = null;
    for (let k = 0; k <= 140; k++) { const r = at(k); if (!r.pixels || r.medianS_over_c === null) break;
      const rel = Math.abs(r.medianS_over_c - EXACT_SC[name]) / EXACT_SC[name];
      if (w10 === null && rel <= 0.10) w10 = k;
      if (w05 === null && rel <= 0.05) w05 = k;
      if (q10 === null && r.medianS_over_q >= 10) q10 = k;
      if (q20 === null && r.medianS_over_q >= 20) q20 = k; }
    numerator[name] = { exactSC: EXACT_SC[name], ladder,
      measuredRung_sc_within10pct: w10, measuredRung_sc_within05pct: w05,
      measuredRung_s_over_q_reaches10: q10, measuredRung_s_over_q_reaches20: q20,
      gelbDerivedRung_10pct: name === "none" ? 11.2 : 57.4, gelbDerivedRung_05pct: name === "none" ? 29.2 : 57.9 };
  }

  // shared-mask flatness test: GELB's A-G341 discriminator, now on ONE mask
  const RUNGS = [1e-9, 0.001, 0.002, 0.004, 0.01502];
  const flat = RUNGS.map(t => {
    const row = { maskThreshold: +t.toExponential(5) };
    for (const [name, cc, ww] of [["none", cNone, wNone], ["sel", cSel, wSel]]) {
      let den = 0, nU = 0, nB = 0;
      for (let j = 0; j < cNone.idx.length; j++) if (cNone.c[j] > t) { den++; if (ww.sU[j] >= SWING_T) nU++; if (ww.sB[j] >= SWING_T) nB++; }
      row[name] = den === 0 ? { maskPopulation: 0, shareUnblurred: null, shareBlurred: null, emptyMask: true }
        : { maskPopulation: den, shareUnblurred: +(nU/den).toFixed(4), shareBlurred: +(nB/den).toFixed(4),
            clearsUnblurred: nU/den >= SHARE_BOUND, clearsBlurred: nB/den >= SHARE_BOUND };
    }
    row.ratio_sel_over_none_unblurred = row.none.shareUnblurred ? +(row.sel.shareUnblurred/row.none.shareUnblurred).toFixed(4) : null;
    row.ratio_sel_over_none_blurred  = row.none.shareBlurred  ? +(row.sel.shareBlurred /row.none.shareBlurred ).toFixed(4) : null;
    return row;
  });
  const rU = flat.map(r => r.ratio_sel_over_none_unblurred).filter(x => x !== null);
  const rB = flat.map(r => r.ratio_sel_over_none_blurred).filter(x => x !== null);
  return { viewport: `${VW}x${VH}`, sharedMask: true, maskDefinedIn: "unselected, reduce, disc-scoped floor",
    maskPopulation: cNone.idx.length, discPixels: cNone.discPixels, clipPixels: cNone.clipPixels,
    jitterDisc_none: cNone.jitDisc, jitterDisc_sel: cSel.jitDisc,
    deepestHalo: { haloDomIndex: cNone.deep.haloDomIndex, groupOpacity: cNone.deep.groupOpacity, rpx: cNone.deep.rpx },
    states, foreignMoverTest: foreign, numeratorResolution: numerator, flatnessTest: flat,
    ratioSpread_unblurred: +(Math.max(...rU) - Math.min(...rU)).toFixed(4),
    ratioSpread_blurred: +(Math.max(...rB) - Math.min(...rB)).toFixed(4),
    selectedGainConstant: SEL_GAIN };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId, stand: "PINK :3122 (own build)",
  pin: "A-G373 numerator resolution measured; A-G366 foreign-mover fraction split at the quantiser; A-G341 block [2] premise — s/c = opSwing/op_sampled — MEASURED; plus §28's sel/none drift on one shared mask",
  sourceFacts: { "WAVE.haloDepth@:122": 0.235, "WAVE.selectedGain@:122": 0.35, "mf-wave-halo mean@:274": MEAN,
    "mf-wave-halo depth@:274": DEPTH, "waveAt range@:174": "[-1,1]", "un-animated base@:272": "var(--mf-wave-mean) = MEAN",
    "opSwing unselected": OP_SWING.none, "opSwing selected": OP_SWING.sel },
  caveat: "luminance is NOT linear in group opacity: compositing is affine in encoded sRGB, WCAG decodes it (linear below byte ~10, then ^2.4). GELB's cancellation is exact in the dark-linear regime and convex above it.",
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 2));
