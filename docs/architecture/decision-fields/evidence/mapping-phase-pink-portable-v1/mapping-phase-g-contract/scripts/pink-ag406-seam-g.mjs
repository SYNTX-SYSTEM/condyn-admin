/** PINK · PHASE G · §35 / A-G406 — the WELL-POSED question at the ground/shelf boundary.
 *  Stand: PINK :3122, commit 3ec8457d, BUILD_ID xCD8LBxdjnP97-2Gjs5yr.
 *
 *  A-G406 asks whether the ground at its breath PEAK is "ordered against the shelf ring at 0.022 the way
 *  E-7 orders the rings against each other". §35 rules that the quantity DOES NOT ADMIT that ordering —
 *  three independent reasons, all from source at this build:
 *    (1) DIFFERENT COLORANTS OVER DIFFERENT BACKDROPS, which is stronger than the shared-pixel argument.
 *        The ground is CYAN at the GROUND.stops alphas (:115) inside a radial gradient, multiplied by an
 *        animated GROUP opacity (:273, mean 0.5 depth 0.5, so [0,1]). The shelf ring is INK at
 *        RING_LUMINANCE.shelf (:88, = 0.02 on THIS build) stroked over a black SEAT painted first (:882).
 *        E-7's four rings are all INK at their own alphas on the same seat, so THERE an alpha ordering IS a
 *        luminance ordering. Across two colorants over two backdrops it is not — it is a category error.
 *    (2) "THE GROUND AT ITS BREATH PEAK" IS NOT A NUMBER. Seven layers (:876), each with its own
 *        animationDelay, each a 5-stop radial gradient, under a group opacity sweeping [0,1]. The peak is a
 *        maximum over time AND over layers AND it varies with radius. Comparing it to a static constant is
 *        max-against-point — §31's malformed shape, A-F11 again.
 *    (3) NO SHARED SUPPORT. The ground circles end at r = shelfNear (:874, :876); the shelf band runs
 *        shelfNear -> fieldRadius (:883, r = (shelfNear+fieldRadius)/2, strokeWidth = fieldRadius-shelfNear).
 *        They meet on one circle — zero area — so no pixel ever carries both and "which is dimmer" has no
 *        location at which it is decidable.
 *  So A-G406 is INCONCLUSIVE BY CONSTRUCTION (A-G364) and E-7's obligation is MALFORMED for the medium
 *  rather than violated by it. Declining is the finding — but declining alone is not useful, so:
 *
 *  THE WELL-POSED NEIGHBOUR, MEASURED HERE. The real worry behind A-G406 is whether the medium's end at the
 *  shelf READS AS A SEAM. That question is well posed where the ordering is not: it has a SHARED SUPPORT
 *  (the pixels either side of one boundary), it lives in ONE space (WCAG luminance on actual bytes), and it
 *  is a STEP at a boundary rather than two values at two radii. Because the ground breathes, the step is
 *  time-varying, so the honest statement is its RANGE over one full breath period against the stand's own
 *  quantisation floor — never a single number.
 *
 *  ISOLATION, per §33 limb 3, which is the technique that made that run work: every animation in the field
 *  is PAUSED and only `circle.mf-wave.mf-wave-ground` is left running, asserted by reading animationPlayState
 *  back. So the step's variation is the GROUND's breath and not the travel, the evidence pulse or the query
 *  highlight — §33 established that four families animate and that selection adds carriers.
 *  The seam is sampled on both sides at matched radial offsets around r = shelfNear, over many angles, with
 *  the sector wedges (:878) and the halo discs excluded from the angular sample by taking the MEDIAN over
 *  angles — reported with its spread, not as a mean.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const FRAMES = 33, STEP_MS = 310;             // 10.23s > one 10000ms period
const OFFSETS = [1, 2, 3, 5, 8];              // matched px inside/outside the boundary
const ANGLES = 720;
const ISOLATE = `[data-testid="mapping-field"], [data-testid="mapping-field"] * { animation-play-state: paused !important; }
                 circle.mf-wave.mf-wave-ground { animation-play-state: running !important; }`;

const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const W = [0.2126, 0.7152, 0.0722];
const gf = v => { const c = Math.min(1, Math.max(0, v / 255)); return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const med = a => { if (!a.length) return null; const s = Float64Array.from(a).sort(); const n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const pct = (a, p) => { if (!a.length) return null; const s = Float64Array.from(a).sort();
  return s[Math.min(s.length - 1, Math.max(0, Math.round(p * (s.length - 1))))]; };
const r6 = v => (v === null || v === undefined || !Number.isFinite(v)) ? null : +v.toPrecision(6);

async function boot(VW, VH) {
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
  await page.addStyleTag({ content: ISOLATE });
  await page.waitForTimeout(600);
  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const fieldEl = document.querySelector('[data-testid="mapping-ring-field"]');
    const shelfEl = document.querySelector('[data-testid="mapping-ring-shelf"]');
    const fr = fieldEl.getBoundingClientRect();
    const rUserField = parseFloat(fieldEl.getAttribute("r"));
    const rUserShelf = parseFloat(shelfEl.getAttribute("r"));
    const swUserShelf = parseFloat(shelfEl.getAttribute("stroke-width"));
    const fe = document.querySelector('[data-testid="mapping-field"]');
    const st = sel => { const o = []; document.querySelectorAll(sel).forEach(el => {
      const cs = getComputedStyle(el); o.push(`${cs.animationName}:${cs.animationPlayState}`); }); return o; };
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      cx: fr.x + fr.width / 2, cy: fr.y + fr.height / 2, clientFieldR: fr.width / 2,
      rUserField, rUserShelf, swUserShelf,
      breath: fe.getAttribute('data-breath'), selection: fe.getAttribute('data-selection'),
      shelfStroke: getComputedStyle(shelfEl).stroke,
      playState: { ground: st('circle.mf-wave.mf-wave-ground'), halo: st('circle.mf-wave.mf-wave-halo'),
                   travel: st('line.mf-travel') } };
  });
  const cdp = await page.context().newCDPSession(page);
  return { b, ctx, page, cdp, geo };
}

async function run(VW, VH) {
  const h = await boot(VW, VH);
  const g = h.geo;
  if (g.breath !== "LIVE") throw new Error(`ABORT breath ${g.breath}`);
  if (!g.playState.ground.length) throw new Error("ABORT no ground group found");
  for (const s of g.playState.ground) if (!s.endsWith(":running")) throw new Error(`ABORT ground not running (${s})`);
  for (const k of ["halo", "travel"]) for (const s of g.playState[k])
    if (!s.endsWith(":paused")) throw new Error(`ABORT ${k} not paused (${s})`);

  // user units -> client px, and the boundary itself
  const scale = g.clientFieldR / g.rUserField;
  const shelfNearUser = g.rUserShelf - g.swUserShelf / 2;
  const shelfFarUser = g.rUserShelf + g.swUserShelf / 2;
  const Rb = shelfNearUser * scale;                 // the boundary: where the ground ends
  const Rfar = shelfFarUser * scale;
  if (!(Math.abs(shelfFarUser - g.rUserField) < 0.75))
    throw new Error(`ABORT shelf far edge ${shelfFarUser} != field radius ${g.rUserField}`);

  const clip = g.clip, Wd = clip.width, Hd = clip.height;
  const cx = g.cx - clip.x, cy = g.cy - clip.y;
  // sample points: for each angle and offset, one pixel inside and one outside, matched in |offset|
  const pts = [];
  for (let a = 0; a < ANGLES; a++) {
    const th = (2 * Math.PI * a) / ANGLES, ct = Math.cos(th), sn = Math.sin(th);
    for (const d of OFFSETS) {
      const xi = Math.round(cx + (Rb - d) * ct), yi = Math.round(cy + (Rb - d) * sn);
      const xo = Math.round(cx + (Rb + d) * ct), yo = Math.round(cy + (Rb + d) * sn);
      if (xi < 0 || yi < 0 || xo < 0 || yo < 0 || xi >= Wd || yi >= Wd && false || xi >= Wd || yi >= Hd || xo >= Wd || yo >= Hd) continue;
      pts.push({ a, d, inI: yi * Wd + xi, outI: yo * Wd + xo });
    }
  }
  const uniq = Array.from(new Set(pts.flatMap(p => [p.inI, p.outI])));
  const pos = new Map(uniq.map((v, i) => [v, i]));
  const idx = Int32Array.from(uniq);

  const frames = [];
  for (let f = 0; f < FRAMES; f++) {
    const { data } = await h.cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data;
    const L = new Float64Array(idx.length), Q = new Float64Array(idx.length);
    for (let j = 0; j < idx.length; j++) {
      const p = idx[j] * ch;
      L[j] = W[0] * LUT[d[p]] + W[1] * LUT[d[p + 1]] + W[2] * LUT[d[p + 2]];
      let q = 0; for (let k = 0; k < 3; k++) { const v = d[p + k]; q += W[k] * Math.abs(gf(Math.min(255, v + 1)) - gf(v)); }
      Q[j] = 0.5 * q;
    }
    frames.push({ L, Q });
    if (f < FRAMES - 1) await h.page.waitForTimeout(STEP_MS);
  }
  await h.ctx.close(); await h.b.close();

  // per offset: the step across the boundary, per frame, median over angles
  const byOffset = OFFSETS.map(d => {
    const sel = pts.filter(p => p.d === d);
    const perFrameMedian = frames.map(fr => med(sel.map(p => fr.L[pos.get(p.inI)] - fr.L[pos.get(p.outI)])));
    const quanta = med(frames.flatMap(fr => sel.map(p => fr.Q[pos.get(p.inI)] + fr.Q[pos.get(p.outI)])));
    const insideRange = (() => {
      const per = sel.map(p => { const v = frames.map(fr => fr.L[pos.get(p.inI)]);
        return Math.max(...v) - Math.min(...v); }); return med(per); })();
    const outsideRange = (() => {
      const per = sel.map(p => { const v = frames.map(fr => fr.L[pos.get(p.outI)]);
        return Math.max(...v) - Math.min(...v); }); return med(per); })();
    const steps = perFrameMedian.filter(v => v !== null);
    return { offsetPx: d, samplePairs: sel.length,
      step_min: r6(Math.min(...steps)), step_max: r6(Math.max(...steps)),
      step_median: r6(med(steps)),
      step_rangeOverBreath: r6(Math.max(...steps) - Math.min(...steps)),
      stepSpreadOverAngles_p05_p95: [r6(pct(sel.map(p => frames[0].L[pos.get(p.inI)] - frames[0].L[pos.get(p.outI)]), 0.05)),
                                      r6(pct(sel.map(p => frames[0].L[pos.get(p.inI)] - frames[0].L[pos.get(p.outI)]), 0.95))],
      pairQuantum: r6(quanta),
      step_in_quanta_median: r6(med(steps) / quanta),
      insideTemporalRange_median: r6(insideRange), outsideTemporalRange_median: r6(outsideRange),
      outsideTemporalRange_in_quanta: r6(outsideRange / quanta) };
  });

  return { viewport: `${VW}x${VH}`,
    isolation: "all field animations paused, only circle.mf-wave.mf-wave-ground running — asserted",
    playState: g.playState, breath: g.breath, selection: g.selection, shelfStrokeComputed: g.shelfStroke,
    geometry: { rUserField: g.rUserField, rUserShelf: g.rUserShelf, swUserShelf: g.swUserShelf,
      shelfNearUser: r6(shelfNearUser), shelfFarUser: r6(shelfFarUser),
      scale_clientPxPerUserUnit: r6(scale), boundaryClientR: r6(Rb), shelfFarClientR: r6(Rfar),
      note: "the ground ends at shelfNear (:874/:876); the shelf band spans shelfNear..fieldRadius (:883). Zero shared area." },
    framesSampled: FRAMES, stepMs: STEP_MS, anglesSampled: ANGLES, byOffset };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, stand: BASE, pin: "A-G406 (PINK §35)",
  ruling: "the ordering E-7 states does not admit this pair: different colorants over different backdrops, a peak that is not a number, and zero shared support",
  wellPosedSubstitute: "the LUMINANCE STEP across r = shelfNear, with its range over one breath period, against the per-pair quantisation floor",
  sourceFacts: { "RING_LUMINANCE.shelf@:88": 0.02, "GROUND.stops@:115": [[0, 0.075], [0.3, 0.06], [0.6, 0.042], [0.85, 0.026], [1, 0.018]],
    "mf-wave-ground mean/depth@:273": [0.5, 0.5], "ground layers@:876": 7,
    "shelf band@:883": "r=(shelfNear+fieldRadius)/2, strokeWidth=fieldRadius-shelfNear, rgba(INK,0.02) over SEAT painted at :882" },
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 1));
