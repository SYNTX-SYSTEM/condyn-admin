/** PINK · PHASE G · A-G340: PG-10 LIMB 1 RE-RUN ON A DISC-SCOPED FLOOR, mask threshold <= 0.004.
 *  Stand: PINK's own :3122, commit 3ec8457d, BUILD_ID xCD8LBxdjnP97-2Gjs5yr -- the SAME BUILD as §10/§27.
 *
 *  WHY NOT THE HOOKED STAND. GELB offers GRUEN's hooked build (839623e8, :3230) because `data-halo-radius`
 *  would give the disc scope without a radius heuristic. Declined, and the reason is A-G54 itself: this run
 *  exists to correct figures produced on 3ec8457d by changing ONE thing -- the floor's region and the mask's
 *  threshold. Moving the build at the same time would make any difference from §27 unattributable between
 *  "the floor was wrong" and "the build changed". The control below only works if the build is held. Also,
 *  this instrument never used the concentricity heuristic the hook retires: it enumerates `.mf-halo` groups
 *  and reads each circle's own bbox, so the hook buys this particular measurement nothing.
 *
 *  THE TWO DEFECTS BEING CORRECTED (§27, stated there with their sign):
 *    (1) the floor was `max |base1 - base2|` over the WHOLE CAPTURE CLIP, so the worst raster jitter anywhere
 *        in the frame -- text, beams, travel -- set the threshold applied to the halo. That is §24's defect
 *        recurring two sections later.
 *    (2) the resulting EPS (0.0063-0.0070) EXCEEDS the 0.004 swing threshold it serves. A mask that admits
 *        only pixels the halo brightens by more than 0.0063 keeps the glow's bright core and discards the
 *        faint rim -- which is exactly where swing is lowest. Both defects push the share UP, so every masked
 *        share reported this phase is an OVERESTIMATE. Generous for a floor bound: the error does not
 *        threaten the red, it threatens the greens.
 *
 *  THE CONTROL THAT MAKES THIS CITABLE. The mask threshold is SWEPT, and the sweep INCLUDES the old whole-clip
 *  floor. If the share at that rung does not reproduce §27, the difference is in the instrument and not in the
 *  floor, and nothing here may be cited. Reproduction is asserted, not hoped for.
 *
 *  THREE FLOORS MEASURED, from the same two static captures, so the DEFECT'S REACH is shown rather than
 *  claimed: whole clip (the old, defective region), the disc (A-G340's ask), and each halo's own bbox
 *  (the tightest honest region -- a floor is a property of the region it is measured over).
 *
 *  DECIDABILITY. If the disc floor still exceeds 0.004, then at a 0.004 mask threshold the mask admits pixels
 *  whose halo contribution is indistinguishable from noise -- and since those pixels' own jitter then exceeds
 *  the swing threshold, they pollute NUMERATOR AND DENOMINATOR TOGETHER. In that case the limb is not decidable
 *  at this threshold and the run says so instead of returning a number. `floorBelowSwingThreshold` carries it.
 *
 *  Unchanged from §27 and deliberately so: paired blur (every frame decoded twice from ONE capture, never two
 *  runs), per body never pooled (A-G194), field halos only (A-G48/A-G31), geometry ASSERTED equal between the
 *  mask context and the swing context, outermost-ring assertion before the disc is trusted (§19's correction --
 *  `field` is the OUTERMOST ring, not `horizon`), and a negative limb: an empty mask returns null, never 0.
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
    // §19's correction: assert which ring is outermost rather than assume it.
    const rings = [];
    document.querySelectorAll('[data-testid^="mapping-ring"]').forEach(el => {
      const r = el.getBoundingClientRect();
      rings.push({ id: el.getAttribute('data-testid'), rpx: +(r.width / 2).toFixed(3),
        cx: +(r.x + r.width / 2).toFixed(3), cy: +(r.y + r.height / 2).toFixed(3) });
    });
    rings.sort((a, b) => b.rpx - a.rpx);
    const field = [];
    document.querySelectorAll('.mf-halo').forEach((g, i) => {
      const c = g.querySelector('circle');
      if (!c || !c.classList.contains('mf-wave-halo')) return;      // A-G48/A-G31: field glows only
      const r = c.getBoundingClientRect();
      field.push({ haloDomIndex: i, cx: +(r.x + r.width / 2).toFixed(2), cy: +(r.y + r.height / 2).toFixed(2),
        rpx: +(r.width / 2).toFixed(2), animationName: getComputedStyle(c).animationName,
        groupOpacity: Number(getComputedStyle(g).opacity) });
    });
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      rings, outermostRing: rings[0], field,
      selection: document.querySelector('[data-testid="mapping-field"]').getAttribute('data-selection') };
  });
  return { b, page, geo };
}
const decode = async (data, blur) => {
  const img = blur ? sharp(Buffer.from(data, "base64")).blur(2) : sharp(Buffer.from(data, "base64"));
  const s = await img.raw().toBuffer({ resolveWithObject: true });
  return { ch: s.info.channels, d: s.data };
};
const lumAll = ({ ch, d }, N) => { const L = new Float64Array(N);
  for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L; };
const lumAt = ({ ch, d }, idx) => { const L = new Float64Array(idx.length);
  for (let j = 0; j < idx.length; j++) { const q = idx[j] * ch; L[j] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L; };

async function run(VW, VH, select) {
  // ---------------- pass 1: floors and masks, static, under reduce ----------------
  const A = await boot(VW, VH, "reduce", select);
  const clip = A.geo.clip, W = clip.width, H = clip.height, N = W * H;
  if (A.geo.outermostRing.id !== "mapping-ring-field") {
    await A.b.close(); throw new Error(`ABORT outermost ring is ${A.geo.outermostRing.id}, not mapping-ring-field`); }
  const cx = A.geo.outermostRing.cx - clip.x, cy = A.geo.outermostRing.cy - clip.y, R = A.geo.outermostRing.rpx;
  const inDisc = new Uint8Array(N); let discN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= R * R) { inDisc[y * W + x] = 1; discN++; } }

  const cdpA = await A.page.context().newCDPSession(A.page);
  const shotA = async () => (await cdpA.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true })).data;
  const base1 = lumAll(await decode(await shotA(), false), N);
  const base2 = lumAll(await decode(await shotA(), false), N);

  // three floors, same two captures, so the defect's REACH is measured rather than asserted
  let jitClip = 0, jitDisc = 0;
  for (let i = 0; i < N; i++) { const dd = Math.abs(base1[i] - base2[i]);
    if (dd > jitClip) jitClip = dd; if (inDisc[i] && dd > jitDisc) jitDisc = dd; }
  const EPS_CLIP = Math.max(jitClip * 2, 1e-9);      // the OLD, defective threshold -- kept as the control
  const EPS_DISC = Math.max(jitDisc * 2, 1e-9);      // A-G340's ask

  const masks = [];
  for (const f of A.geo.field) {
    await A.page.evaluate(i => { const g = document.querySelectorAll('.mf-halo')[i]; g.setAttribute('data-pink-hidden', '1'); g.style.visibility = 'hidden'; }, f.haloDomIndex);
    await A.page.waitForTimeout(430);
    const noHalo = lumAll(await decode(await shotA(), false), N);
    await A.page.evaluate(() => { for (const el of document.querySelectorAll('[data-pink-hidden]')) { el.style.visibility = ''; el.removeAttribute('data-pink-hidden'); } });
    await A.page.waitForTimeout(380);
    // this halo's OWN bbox floor -- the tightest honest region for a per-body mask
    const x0 = Math.max(0, Math.floor(f.cx - clip.x - f.rpx)), x1 = Math.min(W - 1, Math.ceil(f.cx - clip.x + f.rpx));
    const y0 = Math.max(0, Math.floor(f.cy - clip.y - f.rpx)), y1 = Math.min(H - 1, Math.ceil(f.cy - clip.y + f.rpx));
    let jitHalo = 0;
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const dd = Math.abs(base1[y * W + x] - base2[y * W + x]); if (dd > jitHalo) jitHalo = dd; }
    const EPS_HALO = Math.max(jitHalo * 2, 1e-9);
    // the LOOSEST rung governs which pixels are tracked in pass 2; everything else is a subset of it
    const loosest = Math.min(EPS_CLIP, EPS_DISC, EPS_HALO, SWING_T, 0.002, 0.001);
    const idx = [], delta = [];
    for (let i = 0; i < N; i++) { const dv = base1[i] - noHalo[i]; if (dv > loosest) { idx.push(i); delta.push(dv); } }
    masks.push({ haloDomIndex: f.haloDomIndex, cx: f.cx, cy: f.cy, rpx: f.rpx, groupOpacity: f.groupOpacity,
      epsHalo: +EPS_HALO.toExponential(5), jitterHaloBbox: +jitHalo.toExponential(5),
      haloBboxInsideDisc: (() => { const dx = f.cx - clip.x - cx, dy = f.cy - clip.y - cy;
        return Math.hypot(dx, dy) + f.rpx <= R + 0.5; })(),
      idx, delta: Float64Array.from(delta), loosest });
  }
  await A.b.close();

  // ---------------- pass 2: swing, LIVE, blurred and unblurred from the SAME captures ----------------
  const B = await boot(VW, VH, "no-preference", select);
  const same = B.geo.field.length === A.geo.field.length && B.geo.field.every((f, i) =>
    Math.abs(f.cx - A.geo.field[i].cx) < 0.75 && Math.abs(f.cy - A.geo.field[i].cy) < 0.75 && Math.abs(f.rpx - A.geo.field[i].rpx) < 0.75);
  if (!same) { await B.b.close(); throw new Error("ABORT geometry differs between mask and swing contexts"); }
  const cdpB = await B.page.context().newCDPSession(B.page);
  const acc = masks.map(m => ({ mnU: new Float64Array(m.idx.length).fill(Infinity), mxU: new Float64Array(m.idx.length).fill(-Infinity),
    mnB: new Float64Array(m.idx.length).fill(Infinity), mxB: new Float64Array(m.idx.length).fill(-Infinity) }));
  for (let fr = 0; fr < FRAMES; fr++) {
    const data = (await cdpB.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true })).data;
    const raw = await decode(data, false), blr = await decode(data, true);
    masks.forEach((m, k) => { const u = lumAt(raw, m.idx), v = lumAt(blr, m.idx), a = acc[k];
      for (let j = 0; j < m.idx.length; j++) { if (u[j] < a.mnU[j]) a.mnU[j] = u[j]; if (u[j] > a.mxU[j]) a.mxU[j] = u[j];
        if (v[j] < a.mnB[j]) a.mnB[j] = v[j]; if (v[j] > a.mxB[j]) a.mxB[j] = v[j]; } });
    if (fr < FRAMES - 1) await B.page.waitForTimeout(STEP_MS);
  }
  await B.b.close();

  // ---------------- shares, at every mask threshold, as SUBSETS of one tracked set ----------------
  const RUNGS = [
    { name: "wholeClipFloor_OLD_DEFECT", t: EPS_CLIP, note: "the threshold §10/§27 used -- control: must reproduce §27" },
    { name: "discFloor_A-G340", t: EPS_DISC, note: "floor measured over the disc only" },
    { name: "swingThreshold_0.004", t: SWING_T, note: "mask threshold == the swing threshold it serves" },
    { name: "tight_0.002", t: 0.002, note: "sensitivity rung" },
    { name: "tight_0.001", t: 0.001, note: "sensitivity rung" },
  ];
  const bodies = masks.map((m, k) => {
    const a = acc[k];
    const swU = new Float64Array(m.idx.length), swB = new Float64Array(m.idx.length);
    for (let j = 0; j < m.idx.length; j++) { swU[j] = a.mxU[j] - a.mnU[j]; swB[j] = a.mxB[j] - a.mnB[j]; }
    const atThreshold = {};
    for (const r of RUNGS) {
      let den = 0, nU = 0, nB = 0;
      for (let j = 0; j < m.idx.length; j++) if (m.delta[j] > r.t) { den++; if (swU[j] >= SWING_T) nU++; if (swB[j] >= SWING_T) nB++; }
      atThreshold[r.name] = den === 0
        ? { maskThreshold: +r.t.toExponential(5), maskPixels: 0, shareUnblurred: null, shareBlurred: null,
            emptyMask: true, note: `${r.note} -- MASK EMPTY, no share (A-G197 negative limb: null, never 0)` }
        : { maskThreshold: +r.t.toExponential(5), maskPixels: den,
            shareUnblurred: +(nU / den).toFixed(4), shareBlurred: +(nB / den).toFixed(4),
            clearsBlurred: nB / den >= SHARE_BOUND, clearsUnblurred: nU / den >= SHARE_BOUND,
            blurDelta: +((nB - nU) / den).toFixed(4), note: r.note };
    }
    return { haloDomIndex: m.haloDomIndex, groupOpacity: m.groupOpacity, epsHalo: m.epsHalo,
      jitterHaloBbox: m.jitterHaloBbox, haloBboxInsideDisc: m.haloBboxInsideDisc,
      trackedPixels: m.idx.length, bound: `>= ${SHARE_BOUND}`, atThreshold };
  });
  return { viewport: `${VW}x${VH}`, selection: B.geo.selection ?? "none", selectedCapability: select ?? null,
    outermostRingAsserted: A.geo.outermostRing, ringLadder: A.geo.rings, discPixels: discN, clipPixels: N,
    floors: { jitterWholeClip: +jitClip.toExponential(5), jitterDisc: +jitDisc.toExponential(5),
      epsWholeClip_OLD: +EPS_CLIP.toExponential(5), epsDisc_NEW: +EPS_DISC.toExponential(5),
      discFloorBelowSwingThreshold: EPS_DISC < SWING_T,
      oldFloorBelowSwingThreshold: EPS_CLIP < SWING_T,
      floorRegionShrankBy: +(1 - EPS_DISC / EPS_CLIP).toFixed(4) },
    geometryAssertedEqual: same, fieldHalos: masks.length, framesCaptured: FRAMES,
    deepestBreathingBody: bodies.length ? bodies[bodies.length - 1] : null, bodies };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId, stand: "PINK :3122 (own build) -- NOT GRUEN's hooked 839623e8/:3230",
  pin: "PG-10 limb 1 (PHASE_G:757) -- on the visible glow, >= 25 % of pixels swing >= 0.004",
  amendment: "A-G340 -- disc-scoped floor, mask inclusion threshold <= 0.004",
  control: "the wholeClipFloor_OLD_DEFECT rung must reproduce §27; if it does not, the delta is instrumental and nothing here may be cited",
  scope: "one fixture, one analysisId, L0, field halos only (A-G48/A-G31)", runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) {
  out.runs.push(await run(w, h, null));
  out.runs.push(await run(w, h, "PCAP_PG"));
}
console.log(JSON.stringify(out, null, 2));
