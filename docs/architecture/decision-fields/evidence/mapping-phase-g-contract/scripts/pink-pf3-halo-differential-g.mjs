/** PINK · PHASE G · PF-3's HALO LIMB in A-F19's DIFFERENTIAL form, on 3ec8457d. (GELB §72.)
 *
 *  PF-3's halo limb: *"halo peak <= 0.25 x core peak."* A-F19 (GRÜN's, accepted at PHASE_F `:1054`) amended
 *  HOW: *"the halo is measured as an EXCESS against a render without it, never as a raw window"* -- because a
 *  raw window at the shelf edge reads the lit ground inside the shelf and goes *"red for entirely the wrong
 *  reason"*. A-F19's phase-F figures: halo excess 0.0035-0.0076, ratio 0.039-0.083 across five bodies.
 *
 *  WHY IT IS RE-MEASURED RATHER THAN INHERITED. A-G54 / rule 1: a figure is a property of a BUILD. Phase G's
 *  `VOLUME.haloAlpha` is 0.5 and `coreAlpha` 0.16, and A-G17 replaced a lit translucent plate with cheap
 *  occlusion, so neither the halo's excess nor the core's peak carries over. **GELB flagged this residue
 *  itself when it withdrew A-G293; it is the small true thing left of that section and it wants a render.**
 *
 *  PER BODY, NOT POOLED (A-G194), AND PER BODY ONE HALO AT A TIME. Halos run to 2.6-3.0 x the body radius
 *  (§18), so they OVERLAP heavily: hiding `.mf-halo` wholesale would attribute a neighbour's light to this
 *  body. Each halo group and each core circle is therefore suppressed INDIVIDUALLY, and paired to its body by
 *  concentricity (< 2 px), the pairing §18 showed is 1:1 at both sizes. **A pooled differential would have let
 *  a bright neighbour pay for a dim body, which is A-G194's objection in a new place.**
 *
 *  THE PIN SAYS "PEAK" AND A-F11 SAYS DISTRIBUTIONS, SO BOTH ARE REPORTED. The verdict is taken on the max,
 *  because that is the pin's word; p999.9 and p99.9 are reported beside it so a reader can see whether the
 *  verdict rests on a single pixel. Epsilon and the noise floor are MEASURED from two consecutive base frames
 *  (rule 6), never chosen.
 *
 *  reducedMotion: reduce -- PF-3 is a static volume pin, and under `reduce` the field halos rest too, so the
 *  differential is not smeared across the breath. That is a declared scope, not an assumption: §18 measured
 *  that the halo group's opacity carries `depthGain`, which scales the breath as well as the resting level.
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const CEIL = 0.25;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort();
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return +((lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo))).toExponential(6); };

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1700);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");

  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const ctr = el => { const r = el.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, rx: r.width / 2 }; };
    const cores = [...document.querySelectorAll('circle.mf-core')].map((el, i) => ({ i, ...ctr(el), gain: Number(getComputedStyle(el).opacity) }));
    const halos = [...document.querySelectorAll('.mf-halo')].map((el, i) => {
      const c = el.querySelector('circle');
      return { i, ...ctr(c), isField: c.classList.contains('mf-wave-halo'), groupOpacity: Number(getComputedStyle(el).opacity) };
    });
    // pair halo -> core by concentricity (< 2 px), the §18 pairing
    const pairs = halos.map(h => { const m = cores.filter(c => Math.hypot(c.x - h.x, c.y - h.y) < 2.0);
      return { haloIndex: h.i, coreIndex: m.length === 1 ? m[0].i : null, matched: m.length,
        isField: h.isField, groupOpacity: h.groupOpacity,
        coreRadiusPx: m.length === 1 ? m[0].rx : null, coreGain: m.length === 1 ? m[0].gain : null,
        haloRadiusPx: h.rx, cx: h.x, cy: h.y } });
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      pairs, nCores: cores.length, nHalos: halos.length };
  });
  const clip = geo.clip, W = clip.width, H = clip.height, N = W * H;
  const cdp = await page.context().newCDPSession(page);
  const frame = async () => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data, L = new Float64Array(N);
    for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
    return L; };
  const hideNth = async (sel, n) => { await page.evaluate(([s, i]) => {
      const el = document.querySelectorAll(s)[i]; if (el) { el.setAttribute('data-pink-hidden', '1'); el.style.visibility = 'hidden'; } }, [sel, n]);
    await page.waitForTimeout(420); const L = await frame();
    await page.evaluate(() => { for (const el of document.querySelectorAll('[data-pink-hidden]')) { el.style.visibility = ''; el.removeAttribute('data-pink-hidden'); } });
    await page.waitForTimeout(380); return L; };

  const base1 = await frame(), base2 = await frame();
  let repeat = 0; for (let i = 0; i < N; i++) { const d = Math.abs(base1[i] - base2[i]); if (d > repeat) repeat = d; }
  const EPS = Math.max(repeat * 2, 1e-9);

  const bodies = [];
  for (const p of geo.pairs) {
    if (p.coreIndex === null) { bodies.push({ ...p, skipped: "no 1:1 core pairing" }); continue; }
    const noHalo = await hideNth('.mf-halo', p.haloIndex);
    const noCore = await hideNth('circle.mf-core', p.coreIndex);
    const cx = p.cx - clip.x, cy = p.cy - clip.y;
    const haloEx = [], coreEx = [];
    const R = Math.ceil(p.haloRadiusPx) + 2;
    for (let y = Math.max(0, Math.floor(cy - R)); y < Math.min(H, Math.ceil(cy + R)); y++)
      for (let x = Math.max(0, Math.floor(cx - R)); x < Math.min(W, Math.ceil(cx + R)); x++) {
        const dx = x - cx, dy = y - cy, d2 = dx * dx + dy * dy, j = y * W + x;
        if (d2 <= p.haloRadiusPx * p.haloRadiusPx) { const e = base1[j] - noHalo[j]; if (e > EPS) haloEx.push(e); }
        if (d2 <= p.coreRadiusPx * p.coreRadiusPx) { const e = base1[j] - noCore[j]; if (e > EPS) coreEx.push(e); }
      }
    const haloPeak = haloEx.length ? Math.max(...haloEx) : null;
    const corePeak = coreEx.length ? Math.max(...coreEx) : null;
    bodies.push({ haloIndex: p.haloIndex, coreIndex: p.coreIndex, isField: p.isField,
      restsUnderReduce: true, coreGain: p.coreGain, haloGroupOpacity: p.groupOpacity,
      coreRadiusPx: +p.coreRadiusPx.toFixed(2), haloRadiusPx: +p.haloRadiusPx.toFixed(2),
      haloPixels: haloEx.length, corePixels: coreEx.length,
      haloExcess: { max: haloPeak === null ? null : +haloPeak.toExponential(6), p999_9: pct(haloEx, 0.9999), p99_9: pct(haloEx, 0.999), p50: pct(haloEx, 0.5) },
      coreExcess: { max: corePeak === null ? null : +corePeak.toExponential(6), p999_9: pct(coreEx, 0.9999), p99_9: pct(coreEx, 0.999), p50: pct(coreEx, 0.5) },
      ratio_onPeaks: haloPeak && corePeak ? +(haloPeak / corePeak).toFixed(4) : null,
      ratio_onP999_9: pct(haloEx, 0.9999) && pct(coreEx, 0.9999) ? +(pct(haloEx, 0.9999) / pct(coreEx, 0.9999)).toFixed(4) : null,
      bound: `<= ${CEIL}`,
      clears_onPeaks: haloPeak && corePeak ? haloPeak / corePeak <= CEIL : null });
  }
  await ctx.close(); await b.close();
  const live = bodies.filter(x => x.ratio_onPeaks !== null && x.ratio_onPeaks !== undefined);
  return { viewport: `${VW}x${VH}`, motion: "reduce", measuredRepeatFloor: +repeat.toExponential(5), maskEpsilon: +EPS.toExponential(5),
    nCores: geo.nCores, nHalos: geo.nHalos, bodiesMeasured: live.length,
    worstRatio_onPeaks: live.length ? Math.max(...live.map(x => x.ratio_onPeaks)) : null,
    ratioRange_onPeaks: live.length ? [Math.min(...live.map(x => x.ratio_onPeaks)), Math.max(...live.map(x => x.ratio_onPeaks))] : null,
    haloExcessRange_max: live.length ? [Math.min(...live.map(x => x.haloExcess.max)), Math.max(...live.map(x => x.haloExcess.max))] : null,
    allClear_onPeaks: live.every(x => x.clears_onPeaks), bodies };
}

const out = { commit: "3ec8457d", buildId: "xCD8LBxdjnP97-2Gjs5yr",
  pin: "PF-3 halo limb — halo peak <= 0.25 x core peak, in A-F19's DIFFERENTIAL form",
  whyRemeasured: "A-G54 / rule 1 — A-F19's 0.039-0.083 is a phase-F figure; phase G's VOLUME.haloAlpha is 0.5 and A-G17 changed the medium beneath",
  constants: { haloAlpha: 0.5, coreAlpha: 0.16, ceiling: CEIL },
  scope: "one fixture, one analysisId, five bodies (2 field / 3 shelf), L0, reduce — §63",
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 2));
