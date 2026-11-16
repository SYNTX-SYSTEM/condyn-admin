/** PINK · PHASE G · PF-15 INVERTED, on A-G65's masked statistic. Measured on 3ec8457d.
 *
 *  THE PIN (A-G5, the live form -- the phase-F mutual-legibility form is the INVERTED one's parent and
 *  is not what is checked here):
 *    (a) SUBORDINATION   the four rings' TOTAL share of disc light <= 8 % of the semantic share
 *    (b) LEGIBILITY      the rings stay mutually distinguishable at >= 1.6x INSIDE that budget
 *  plus the phase-F local-ground limb as A-G66 re-posed it, and A-G56's floor limb on the shelf.
 *
 *  A-G65 IS THE WHOLE REASON THIS IS BEING RE-RUN. max() was contaminated by crossing bodies; min() was
 *  contaminated by crossing SEATS (p01 = 0, pure black, at over 1 % of angles -- the opaque seat of a mark
 *  crossing the band). The replacement inherited the defect of the statistic it replaced, in the mirror.
 *  A-G65's remedy: keep every sign drawn, exclude sign and seat pixels BY MASK, and take a ROBUST CENTRAL
 *  statistic over the band pixels no mark covers. So: median over kept angles, never an extremum.
 *
 *  HOW THE MASK IS BUILT, AND WHY IT NEEDS NO GEOMETRY. Hiding one ring and differencing gives that ring's
 *  own additive light per angle. Marks paint AFTER the rings, so wherever a seat, body, beam or glyph covers
 *  the band, removing the ring changes nothing and the diff collapses to the floor. **The angles to exclude
 *  are exactly the angles where the diff vanishes** -- the mask falls out of the measurement instead of being
 *  drawn by hand, and every sign stays drawn in every measured frame (defect nineteen).
 *
 *  THE VALUES ARE ABSOLUTE, THE DIFF IS ONLY THE MASK. The ladder, the local ground and the floor limb are
 *  all about what a viewer's eye receives, so they are read off the BASE frame. The diff decides WHICH angles
 *  are admissible, not what they are worth. Mixing the two would compare a contribution against a luminance.
 *  (The two agree here anyway, because every ring is stroked over its own opaque black seat -- but agreeing
 *  is not being the same quantity, and A-G176 says carry the second route and report the disagreement.)
 *
 *  EPSILON IS MEASURED, NOT CHOSEN (rule 6 / A-F11 applied to mask thresholds). Two consecutive base frames
 *  are differenced over the same sample set; the largest excursion is the repeat floor, and the mask epsilon
 *  is twice it. A constant would be a defect no pin in either phase states.
 *
 *  A-G66: THE SHELF'S TWO SIDES ARE NOT THE SAME GROUND -- 1.92x apart, wider than PF-15's own 1.6x bound, so
 *  which side counts decides the verdict. A-G66 declared the OUTER side the ground (the field's dark space is
 *  what the scaffold must not out-light, G-1 / PG-1's framing); the inner side is the lit medium the ring is
 *  drawn against as a boundary. Both are measured; only `outer` carries a verdict, `inner` is reported as the
 *  boundary contrast it actually is.
 *
 *  THE 0.022 OVERRIDE, DECLARED. PF-15's input is GRÜN's `RING_LUMINANCE.shelf = 0.022`; this build carries
 *  0.02. The ONLY executable delta between 3ec8457d and GRÜN's 4b83414e is that constant (verified by diff;
 *  the other 53 inserted lines are comment), and it enters the render only as a stroke alpha. So a live
 *  attribute override is equivalent to a rebuild FOR THIS PIN -- equivalence by diff, not by assumption.
 *  BOTH are run: `asBuilt` at 0.02 and `override` at 0.022, so the override is auditable rather than trusted.
 *
 *  reducedMotion: reduce. PF-15 is a static luminance ladder. NOTE the field ring carries `data-breath`, so
 *  under LIVE its value has a range this reading does not cover; that is recorded, not silently assumed away.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const INK = "205, 240, 255", SHELF_OVERRIDE = 0.022, ANGLES = 720;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }

const RINGS = ["shelf", "best", "field", "horizon"];
const GROUP = { bodies: '[data-mapping-body]', glows: '.mf-halo', arcs: '[data-mapping-arc]', beams: '[data-beam]',
  beamGlow: '.mf-beam-glow', travel: '.mf-travel', nodes: '[data-mapping-node]', text: 'text' };
const SEM = Object.values(GROUP).join(",");
const ALL_RINGS = '[data-testid^="mapping-ring"]';

// The IDEAL luminance of `rgba(INK, alpha)` composited over opaque black, by the same WCAG transfer the
// instrument uses. PF-15's own docstring claims each ring "is drawn solid and wide enough that its centre
// pixel is fully covered at every angle, so it renders at its alpha's own luminance". That is a CHECKABLE
// claim and it is checked: `realisation` is measured / ideal, and a thin stroke at k < 1 cannot reach 1.
const INK_RGB = INK.split(",").map(v => Number(v.trim()));
const lin = v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
// A-G81's quantisation, which SUPERSEDES the float-alpha method (§23): the alpha is quantised to a BYTE
// first, and the channels are rounded against that effective alpha -- not against the declared float.
// It matters: at 0.022 the float method predicts rgb(5,5,6) and A-G81 predicts rgb(5,6,6), and Chrome
// renders rgb(5,6,6). A-G274 does not touch this, because these rings carry a DECLARED CONSTANT alpha,
// which is exactly the carrier A-G81 was measured on.
const idealLum = alpha => { const aByte = Math.round(alpha * 255), eff = aByte / 255;
  const [r, g, b] = INK_RGB.map(c => Math.round(c * eff));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const idealTriple = alpha => { const eff = Math.round(alpha * 255) / 255;
  return INK_RGB.map(c => Math.round(c * eff)); };

const pct = (a, p) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y);
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return +( (lo === hi ? s[lo] : s[lo] + (s[hi] - s[lo]) * (i - lo)) ).toExponential(5); };
const dist = a => ({ n: a.length, min: pct(a, 0), p01: pct(a, 0.01), p05: pct(a, 0.05), p25: pct(a, 0.25),
  p50: pct(a, 0.5), p75: pct(a, 0.75), p95: pct(a, 0.95), max: pct(a, 1) });

async function run(VW, VH, applyOverride) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1800);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");

  const appliedOverride = applyOverride ? await page.evaluate(([ink, a]) => {
    const el = document.querySelector('[data-testid="mapping-ring-shelf"]');
    if (!el) return null; const before = el.getAttribute('stroke');
    el.setAttribute('stroke', `rgba(${ink}, ${a})`); el.setAttribute('data-ring-luminance', String(a));
    return { before, after: el.getAttribute('stroke') };
  }, [INK, SHELF_OVERRIDE]) : null;
  if (applyOverride) await page.waitForTimeout(400);

  const geo = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
    const g = {}; for (const k of ["shelf", "best", "field", "horizon"]) {
      const el = document.querySelector(`[data-testid="mapping-ring-${k}"]`); if (!el) continue;
      const bb = el.getBoundingClientRect(), cs = getComputedStyle(el);
      g[k] = { cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2, rOuterBox: bb.width / 2,
        rAttr: Number(el.getAttribute('r')), strokeWidthAttr: Number(el.getAttribute('stroke-width') ?? cs.strokeWidth.replace('px','')),
        alpha: Number(el.getAttribute('data-ring-luminance')), breath: el.getAttribute('data-breath') }; }
    const svgEl = document.querySelector('[data-testid="mapping-field-svg"]');
    const vb = svgEl.getAttribute('viewBox').split(/\s+/).map(Number);
    return { clip: { x: Math.round(svg.x), y: Math.round(svg.y), width: Math.round(svg.width), height: Math.round(svg.height) },
      rings: g, k: svg.width / vb[2] };
  });
  const clip = geo.clip, W = clip.width, H = clip.height, N = W * H, k = geo.k;
  const cx = geo.rings.field.cx - clip.x, cy = geo.rings.field.cy - clip.y;
  // device-px radii: the attributes are user units, k converts (rule 5 -- k taken from the FIELD svg's own viewBox)
  const rDev = {}; for (const key of RINGS) if (geo.rings[key]) rDev[key] = { r: geo.rings[key].rAttr * k, w: geo.rings[key].strokeWidthAttr * k };
  const shelfNear = rDev.shelf.r - rDev.shelf.w / 2, fieldFar = rDev.field.r + rDev.field.w / 2;
  const radiiOrderingDevicePx = Object.fromEntries(RINGS.map(key => [key, +rDev[key].r.toFixed(2)]));
  const outermostRing = RINGS.reduce((a, key) => rDev[key].r > rDev[a].r ? key : a, RINGS[0]);

  const cdp = await page.context().newCDPSession(page);
  const lumFrame = async () => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
    const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
    const ch = s.info.channels, d = s.data, L = new Float64Array(N);
    for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
    return L; };
  const bil = (L, x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
    if (x0 < 0 || y0 < 0 || x0 + 1 >= W || y0 + 1 >= H) return null;
    return L[y0 * W + x0] * (1 - fx) * (1 - fy) + L[y0 * W + x0 + 1] * fx * (1 - fy)
         + L[(y0 + 1) * W + x0] * (1 - fx) * fy + L[(y0 + 1) * W + x0 + 1] * fx * fy; };
  const ringAt = (L, r) => { const v = []; for (let a = 0; a < ANGLES; a++) { const th = a * 2 * Math.PI / ANGLES;
      const s = bil(L, cx + r * Math.cos(th), cy + r * Math.sin(th)); if (s !== null) v.push(s); } return v; };

  const hide = async sel => { const h = await page.addStyleTag({ content: `${sel}{visibility:hidden !important}` });
    await page.waitForTimeout(430); const L = await lumFrame(); await h.evaluate(e => e.remove()); await page.waitForTimeout(380); return L; };

  const base1 = await lumFrame(), base2 = await lumFrame();
  // MEASURED epsilon: the largest base-to-base excursion over every angle of every ring.
  let repeat = 0;
  for (const key of RINGS) { const a = ringAt(base1, rDev[key].r), b2 = ringAt(base2, rDev[key].r);
    for (let i = 0; i < a.length; i++) repeat = Math.max(repeat, Math.abs(a[i] - b2[i])); }
  const EPS = Math.max(repeat * 2, 1e-9);

  const perRing = {};
  for (const key of RINGS) {
    const noRing = await hide(`[data-testid="mapping-ring-${key}"]`);
    const absAll = ringAt(base1, rDev[key].r), contribAll = [], abs = [], contrib = [];
    const nr = ringAt(noRing, rDev[key].r);
    for (let i = 0; i < absAll.length; i++) { const c = absAll[i] - nr[i]; contribAll.push(c);
      if (c > EPS) { abs.push(absAll[i]); contrib.push(c); } }
    const dAbs = dist(abs), dAll = dist(absAll);
    perRing[key] = { alpha: geo.rings[key].alpha, breath: geo.rings[key].breath,
      rUserUnits: geo.rings[key].rAttr, strokeWidthUserUnits: geo.rings[key].strokeWidthAttr,
      rDevicePx: +rDev[key].r.toFixed(3), strokeWidthDevicePx: +rDev[key].w.toFixed(3),
      anglesSampled: absAll.length, anglesKept: abs.length,
      coverage: +(abs.length / absAll.length).toFixed(4),
      maskedOutByCrossingMarks: absAll.length - abs.length,
      absoluteKept: dAbs, absoluteUnmasked_FOR_CONTRAST_ONLY: dAll,
      ownContributionKept: dist(contrib),
      twoRoutesAgree_absVsContribution: dAbs.p50 !== null && dist(contrib).p50 !== null
        && Math.abs(dAbs.p50 - dist(contrib).p50) / dAbs.p50 < 0.05,
      // A-G65's own cheap diagnostic, on the UNMASKED series: a single contaminated angle does not do this.
      AG65_contaminationSignature_unmasked: dAll.min !== null && dAll.p05 === dAll.min && dAll.p25 === dAll.min,
      unmaskedMinIsPureBlack: dAll.min === 0,
      idealLuminanceOverBlack_AG81: +idealLum(geo.rings[key].alpha).toExponential(5),
      idealTriple_AG81: idealTriple(geo.rings[key].alpha),
      realisation_measuredOverIdeal_AG81: dAbs.p50 === null ? null : +(dAbs.p50 / idealLum(geo.rings[key].alpha)).toFixed(4),
      // The 58 px BAND is the control for this ratio: on it the A-G81 model is exact (1.0000 at both 0.02
      // and 0.022, five figures). So a shortfall on the 2 px strokes is a property of THIN STROKES, not of
      // the model -- which is what makes the realisation finding stand rather than dissolve.
      strokeWidthDevicePx_forRealisation: +rDev[key].w.toFixed(3) };
  }

  // A-G66: the shelf's two sides, both measured, only `outer` carrying the verdict.
  const innerR = shelfNear - 4, outerR = fieldFar + 6;
  const ground = { innerRadiusDevicePx: +innerR.toFixed(3), outerRadiusDevicePx: +outerR.toFixed(3),
    inner_litMedium_boundaryContrastOnly: dist(ringAt(base1, innerR)), outer_fieldDarkSpace_CARRIES_VERDICT: dist(ringAt(base1, outerR)) };

  // limb (a): suppression shares. The ring is additive over its own opaque black seat, which stays drawn when
  // the ring is hidden, so no occluder inversion (rule 3's exception, and why PG-1's `rings` term kept its sign).
  // DEFECT CAUGHT BEFORE REPORTING, and it is mine: this first read `rDev.horizon.r`, on the assumption that
  // "horizon" is the outermost ring. It is NOT. Measured radii (user units): best 160, horizon 400, shelf band
  // 465 +/- 35 (430...500), field 500. **`field` is the outermost ring**, so a horizon-radius disc excludes the
  // shelf band AND the field ring, and limb (a) was being computed over two inner rings inside an inner disc.
  // The signature was unmissable once looked at: the rings' share was bit-identical at ten shelf alphas while
  // the band's own median tracked every one of them. The disc is the FIELD ring's outer edge, which is what
  // PG-1 has always used (`mapping-ring-field` boundingClientRect half-width = r + w/2) and is the only disc
  // that contains all four rings, as PF-15(a) requires.
  const discR = fieldFar;
  const disc = new Uint8Array(N); let discN = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= discR * discR) { disc[y * W + x] = 1; discN++; } }
  const sumOf = L => { let s = 0; for (let i = 0; i < N; i++) if (disc[i]) s += L[i]; return s; };
  const full = sumOf(base1);
  const ringsShare = (full - sumOf(await hide(ALL_RINGS))) / full;
  const semShare = (full - sumOf(await hide(SEM))) / full;

  await ctx.close(); await b.close();

  const ladderInput = RINGS.filter(key => perRing[key].absoluteKept.p50 !== null)
    .map(key => ({ key, v: perRing[key].absoluteKept.p50 })).sort((a, b2) => a.v - b2.v);
  const ladder = ladderInput.slice(1).map((e, i) => ({ pair: `${ladderInput[i].key}->${e.key}`,
    ratio: +(e.v / ladderInput[i].v).toFixed(4), bound: ">=1.6", clears: e.v / ladderInput[i].v >= 1.6 }));
  const subordination = +(ringsShare / semShare).toFixed(5);
  const shelfP50 = perRing.shelf.absoluteKept.p50, outerP50 = ground.outer_fieldDarkSpace_CARRIES_VERDICT.p50;

  return { viewport: `${VW}x${VH}`, motion: "reduce", radiiOrderingDevicePx, outermostRing,
    discRadiusDevicePx: +discR.toFixed(3), discIsFieldRingOuterEdge: true, shelfAlphaMode: applyOverride ? `override ${SHELF_OVERRIDE}` : "as built 0.02",
    appliedOverride, k: +k.toFixed(6), measuredRepeatFloor: +repeat.toExponential(5), maskEpsilon: +EPS.toExponential(5),
    perRing, ground,
    limb_a_subordination: { ringsShareOfDisc: +ringsShare.toFixed(5), semanticShareOfDisc: +semShare.toFixed(5),
      ratio: subordination, bound: "<=0.08", clears: subordination <= 0.08 },
    limb_b_ladder: { orderedByMeasuredValue: ladderInput.map(e => `${e.key}=${e.v.toExponential(4)}`), adjacentRatios: ladder,
      allClear: ladder.every(r => r.clears) },
    AG66_localGround_shelf: { side: "outer (A-G66's declaration)", shelfP50, outerGroundP50: outerP50,
      ratio: shelfP50 && outerP50 ? +(shelfP50 / outerP50).toFixed(4) : null, bound: ">=1.6",
      clears: shelfP50 && outerP50 ? shelfP50 / outerP50 >= 1.6 : null,
      innerGroundP50_reportedNotVerdict: ground.inner_litMedium_boundaryContrastOnly.p50,
      innerOuterRatio_AG66s_1_92: ground.inner_litMedium_boundaryContrastOnly.p50 && outerP50
        ? +(ground.inner_litMedium_boundaryContrastOnly.p50 / outerP50).toFixed(4) : null } };
}

const out = { commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId, pin: "PF-15 inverted (A-G5) on A-G65's masked statistic",
  statistic: "median over band angles whose own contribution exceeds a MEASURED mask epsilon; never an extremum (A-G65)",
  declaredOverride: `RING_LUMINANCE.shelf 0.02 -> ${SHELF_OVERRIDE}, equivalence by diff (sole executable delta 3ec8457d..4b83414e)`,
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800]])
  for (const ov of [false, true]) out.runs.push(await run(w, h, ov));
console.log(JSON.stringify(out, null, 2));
