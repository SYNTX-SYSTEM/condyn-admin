/** PINK · PHASE G · PG-10 LIMB 1 BLURRED vs UNBLURRED, paired, on 3ec8457d. (GELB §75.)
 *
 *  LIMB 1 (`PHASE_G:757`): *"on the visible glow, **>= 25 %** of pixels swing >= 0.004."* A SHARE above a LOW
 *  threshold, with a **floor** bound. Unblurred (§52) it read 0.506-0.552 unselected and 0.243 / 0.223 selected
 *  on the deepest breathing body.
 *
 *  WHY GELB'S PREDICTED DIRECTION IS NOT ASSUMED. §75 prices this as *"blur lowers per-pixel swing, so the
 *  share above 0.004 can only fall"*, and for a MAXIMUM that is exactly right -- §26 watched PF-6 row 1 drop
 *  from 0.03269 to 0.02825. **But blur is a spatial AVERAGE, not an attenuation.** It lowers isolated extremes
 *  and simultaneously RAISES the neighbours of every high-swing pixel. For a share above a threshold the two
 *  effects pull opposite ways, and which wins depends on the spatial structure of the swing field:
 *    - swing concentrated on a minority above 0.004  -> blur spreads it outward, the COUNT can RISE
 *    - swing already broad and smooth                -> blur barely moves it
 *  Unselected the share is already > 50 % (broad); selected it is ~24 % (patchier). **So the two states may
 *  move in opposite directions, and a single predicted sign cannot be right for both.** Measured, not assumed.
 *
 *  BOTH STATISTICS COME FROM THE SAME CAPTURES. Each frame is decoded twice -- `sharp(png).raw()` and
 *  `sharp(png).blur(2).raw()` -- so blurred and unblurred shares are a PAIRED comparison on identical pixels
 *  at identical instants. A re-run would confound the blur with sampling phase, which is the defect that
 *  voided my first PG-10 attempt.
 *
 *  THE CARRIER MASK IS DERIVED IN A SEPARATE STATIC PASS (§10-§14's remedy for defect nineteen): under
 *  `reduce`, each FIELD halo group is suppressed individually and the mask is the pixels its own light reaches
 *  (|base - noHalo| > a MEASURED epsilon). Per body, never pooled (A-G194). Shelf halos are excluded by
 *  A-G48/A-G31 -- the carrier is `.mf-wave-halo`, field glows only -- and §18 confirmed that class membership
 *  and `animationName` partition the halos identically, which is the second route that makes the mask citable.
 *  **Masks are derived in one context and swing measured in another, so the geometry is ASSERTED equal rather
 *  than assumed:** halo centres and radii are compared between contexts and the run aborts if they differ.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const SWING_T = 0.004, SHARE_BOUND = 0.25, FRAMES = 27, STEP_MS = 500;
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
    const field = [];
    document.querySelectorAll('.mf-halo').forEach((g, i) => {
      const c = g.querySelector('circle');
      if (!c.classList.contains('mf-wave-halo')) return;      // A-G48/A-G31: field glows only
      const r = c.getBoundingClientRect();
      field.push({ haloDomIndex: i, cx: +(r.x + r.width / 2).toFixed(2), cy: +(r.y + r.height / 2).toFixed(2),
        rpx: +(r.width / 2).toFixed(2), animationName: getComputedStyle(c).animationName,
        groupOpacity: Number(getComputedStyle(g).opacity) });
    });
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      field, selection: document.querySelector('[data-testid="mapping-field"]').getAttribute('data-selection') };
  });
  return { b, page, geo };
}
const decode = async (data, blur) => {
  const img = blur ? sharp(Buffer.from(data, "base64")).blur(2) : sharp(Buffer.from(data, "base64"));
  const s = await img.raw().toBuffer({ resolveWithObject: true });
  return { ch: s.info.channels, d: s.data };
};
const lumOf = ({ ch, d }, idx) => { const L = new Float64Array(idx.length);
  for (let j = 0; j < idx.length; j++) { const q = idx[j] * ch; L[j] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L; };

async function run(VW, VH, select) {
  // ---- pass 1: masks, static, under reduce ----
  const A = await boot(VW, VH, "reduce", select);
  const clip = A.geo.clip, W = clip.width, H = clip.height, N = W * H;
  const cdpA = await A.page.context().newCDPSession(A.page);
  const shotA = async () => (await cdpA.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true })).data;
  const all = Array.from({ length: N }, (_, i) => i);
  const base1 = lumOf(await decode(await shotA(), false), all);
  const base2 = lumOf(await decode(await shotA(), false), all);
  let repeat = 0; for (let i = 0; i < N; i++) { const dd = Math.abs(base1[i] - base2[i]); if (dd > repeat) repeat = dd; }
  const EPS = Math.max(repeat * 2, 1e-9);
  const masks = [];
  for (const f of A.geo.field) {
    await A.page.evaluate(i => { const g = document.querySelectorAll('.mf-halo')[i]; g.setAttribute('data-pink-hidden', '1'); g.style.visibility = 'hidden'; }, f.haloDomIndex);
    await A.page.waitForTimeout(430);
    const noHalo = lumOf(await decode(await shotA(), false), all);
    await A.page.evaluate(() => { for (const el of document.querySelectorAll('[data-pink-hidden]')) { el.style.visibility = ''; el.removeAttribute('data-pink-hidden'); } });
    await A.page.waitForTimeout(380);
    const idx = []; for (let i = 0; i < N; i++) if (base1[i] - noHalo[i] > EPS) idx.push(i);
    masks.push({ haloDomIndex: f.haloDomIndex, cx: f.cx, cy: f.cy, rpx: f.rpx, groupOpacity: f.groupOpacity, idx });
  }
  await A.b.close();

  // ---- pass 2: swing, LIVE, blurred and unblurred from the SAME captures ----
  const B = await boot(VW, VH, "no-preference", select);
  // geometry asserted equal, not assumed
  const same = B.geo.field.length === A.geo.field.length && B.geo.field.every((f, i) =>
    Math.abs(f.cx - A.geo.field[i].cx) < 0.75 && Math.abs(f.cy - A.geo.field[i].cy) < 0.75 && Math.abs(f.rpx - A.geo.field[i].rpx) < 0.75);
  if (!same) { await B.b.close(); throw new Error("ABORT geometry differs between mask and swing contexts"); }
  const cdpB = await B.page.context().newCDPSession(B.page);
  const acc = masks.map(m => ({ mnU: new Float64Array(m.idx.length).fill(Infinity), mxU: new Float64Array(m.idx.length).fill(-Infinity),
    mnB: new Float64Array(m.idx.length).fill(Infinity), mxB: new Float64Array(m.idx.length).fill(-Infinity) }));
  for (let fr = 0; fr < FRAMES; fr++) {
    const data = (await cdpB.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true })).data;
    const raw = await decode(data, false), blr = await decode(data, true);
    masks.forEach((m, k) => { const u = lumOf(raw, m.idx), v = lumOf(blr, m.idx), a = acc[k];
      for (let j = 0; j < m.idx.length; j++) { if (u[j] < a.mnU[j]) a.mnU[j] = u[j]; if (u[j] > a.mxU[j]) a.mxU[j] = u[j];
        if (v[j] < a.mnB[j]) a.mnB[j] = v[j]; if (v[j] > a.mxB[j]) a.mxB[j] = v[j]; } });
    if (fr < FRAMES - 1) await B.page.waitForTimeout(STEP_MS);
  }
  await B.b.close();

  const bodies = masks.map((m, k) => {
    const a = acc[k]; let nU = 0, nB = 0;
    for (let j = 0; j < m.idx.length; j++) { if (a.mxU[j] - a.mnU[j] >= SWING_T) nU++; if (a.mxB[j] - a.mnB[j] >= SWING_T) nB++; }
    const sU = m.idx.length ? nU / m.idx.length : null, sB = m.idx.length ? nB / m.idx.length : null;
    return { haloDomIndex: m.haloDomIndex, groupOpacity: m.groupOpacity, maskPixels: m.idx.length,
      shareUnblurred: sU === null ? null : +sU.toFixed(4), shareBlurred: sB === null ? null : +sB.toFixed(4),
      bound: `>= ${SHARE_BOUND}`, clearsUnblurred: sU !== null && sU >= SHARE_BOUND, clearsBlurred: sB !== null && sB >= SHARE_BOUND,
      blurDelta: sU !== null && sB !== null ? +(sB - sU).toFixed(4) : null,
      blurDirection: sU !== null && sB !== null ? (sB > sU ? "RAISED by blur" : sB < sU ? "lowered by blur" : "unchanged") : null };
  });
  return { viewport: `${VW}x${VH}`, selection: B.geo.selection ?? "none", selectedCapability: select ?? null,
    maskEpsilon: +EPS.toExponential(5), measuredRepeatFloor: +repeat.toExponential(5),
    geometryAssertedEqual: same, fieldHalos: masks.length, framesCaptured: FRAMES,
    deepestBreathingBody: bodies.length ? bodies[bodies.length - 1] : null,
    bodies, allClearBlurred: bodies.every(x => x.clearsBlurred), allClearUnblurred: bodies.every(x => x.clearsUnblurred) };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  pin: "PG-10 limb 1 (PHASE_G:757) — on the visible glow, >= 25 % of pixels swing >= 0.004",
  frames: "blurred and unblurred decoded from the SAME captures — a paired comparison, not two runs",
  scope: "one fixture, one analysisId, L0, field halos only (A-G48/A-G31) — §63", runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) {
  out.runs.push(await run(w, h, null));
  out.runs.push(await run(w, h, "PCAP_PG"));
}
console.log(JSON.stringify(out, null, 2));
