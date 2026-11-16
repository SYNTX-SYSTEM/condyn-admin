/** PINK · PHASE G · PF-2 UNDER THE REDUCED-MOTION ACCOMMODATION. Measured on 3ec8457d. (GELB §71.)
 *
 *  PF-2 (phase F :320): *"The E-1/A-3 band separation holds at the pixel level — adjacent bands' ratio >= 1.6
 *  at their closest points (floor of the upper band vs. ceiling of the lower, PHASE_E §12). Measured on
 *  rendered pixels, not computed styles."* And :898: *"Marks are black-seated, so the values are absolute and
 *  should reproduce phase E's 1.814 / 1.940."*
 *
 *  GELB'S DERIVATION: under `reduce` with a capability selected, a dimmed body's group opacity is 0.32, a
 *  factor of 3.125 -- larger than the whole 1.6...1.94 separation PF-2 protects. So a HIGHER band on a dimmed
 *  body should read DARKER than a LOWER band on a lit one. Two questions: does it appear in the pixels, and is
 *  PF-2's comparison scoped within a body or across bodies?
 *
 *  THE SCOPE QUESTION IS ANSWERED FROM MY OWN PHASE-E INSTRUMENT, WHICH IS WHAT PF-2 POINTS AT. PF-2 cites
 *  PHASE_E §12 for "floor of the upper band vs ceiling of the lower", and that measurement is recorded in
 *  `mapping-phase-e-contract/prep.txt:267` as: *"bands PER FOCUSED GROUP (role_all), from
 *  `data-evidence-luminance` bucketed by `data-evidence-step`"*, with my own note that *"within-band ratios
 *  are NOT a separation test (A-6: separation is between classes, within one focused group)."*
 *      So PF-2's inherited scope is **between classes, within one focused group** -- which is ACROSS BODIES
 *      (a focused group spans several), but across bodies that SHARE A FOCUS STATE.
 *  **A common multiplier cancels in a ratio.** Every body in one focus state carries the same group opacity, so
 *  the 0.32 dim cannot enter a ratio taken inside the pin's scope. That is the answer, and it is neither
 *  "within-body" nor "across bodies" -- it is "within one focus state", a third option the question did not
 *  offer and the one the record actually contains.
 *
 *  SO THIS INSTRUMENT MEASURES BOTH, AND KEEPS THEM APART:
 *    (a) IN SCOPE  -- band separations among bodies sharing a focus state. Must reproduce phase E's figures.
 *    (b) OUT OF SCOPE -- the cross-focus-state comparison GELB derives. Reported as a real pixel fact if it
 *        appears, labelled as outside PF-2's inherited scope, so it is neither hidden nor charged to PF-2.
 *  A derivation confirmed in the pixels but out of scope is a finding about the PIN'S SILENCE, not a red.
 *
 *  TWO ROUTES TO EACH MARK'S RENDERED VALUE (A-G176). Route 1: the median rendered luminance sampled along the
 *  arc's own path via `getPointAtLength` -- a robust central statistic, never an extremum (A-G65). Route 2:
 *  `data-evidence-luminance` x the body group's opacity, composited over black through A-G81's quantisation.
 *  They must agree; their disagreement is reported rather than assumed away.
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const SHARP = process.env.CONDYN_SHARP_MODULE ?? "/home/codi/Entwicklung/condyn-admin-pink-visual-g/node_modules/sharp/lib/index.js";
const { chromium } = await import(PW);
const sharp = (await import(SHARP)).default;
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const INK_RGB = [205, 240, 255], BOUND = 1.6, SAMPLES = 40;
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const lin = v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
// A-G81: alpha to a byte first, then channels against the effective alpha.
const predict = alpha => { const eff = Math.round(Math.min(1, Math.max(0, alpha)) * 255) / 255;
  const [r, g, b] = INK_RGB.map(c => Math.round(c * eff));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b); };
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), i = (s.length - 1) / 2;
  return Math.floor(i) === Math.ceil(i) ? s[i] : (s[Math.floor(i)] + s[Math.ceil(i)]) / 2; };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1600);
while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
  await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
  await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }

async function snapshot(label) {
  const geo = await page.evaluate(([SAMPLES]) => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const sr = svg.getBoundingClientRect();
    const arcs = [...document.querySelectorAll('[data-mapping-arc]')].map((el, i) => {
      const body = el.closest('[data-mapping-body]');
      // `[data-mapping-arc]` is a <g> (a "tick" group), so it has no getTotalLength -- the drawn geometry is a
      // CHILD. An earlier version of this sampler required getTotalLength on the attributed element itself and
      // silently produced zero marks: the attribute carrier and the geometry carrier are different elements.
      // That is rule 2's shape again (semantic carriers and drawable carriers need not coincide) and the tell
      // was a mark count of 0 rather than a wrong number.
      const pts = [];
      const geomAll = [...el.querySelectorAll('path, line, polyline, circle, rect')]
        .filter(g => typeof g.getTotalLength === "function");
      const geom = geomAll.find(g => { try { return g.getTotalLength() > 0; } catch { return false; } });
      if (geom) {
        const L = geom.getTotalLength(), m = geom.getScreenCTM();
        if (m) for (let s = 0; s < SAMPLES; s++) { const q = geom.getPointAtLength(L * (s + 0.5) / SAMPLES);
          pts.push({ x: m.a * q.x + m.c * q.y + m.e, y: m.b * q.x + m.d * q.y + m.f }); }
      }
      return { i, step: el.getAttribute('data-evidence-step'), declared: Number(el.getAttribute('data-evidence-luminance')),
        mark: el.getAttribute('data-mark'), cls: el.getAttribute('data-class'),
        bodyRank: body ? Number(body.getAttribute('data-rank')) : null,
        bodyLit: body ? body.getAttribute('data-lit') : null,
        bodyInPool: body ? body.getAttribute('data-in-pool') : null,
        bodyGroupOpacity: body ? Number(getComputedStyle(body).opacity) : null,
        arcOwnOpacity: Number(getComputedStyle(el).opacity),
        geometryTag: geom ? geom.tagName : null, pts };
    });
    const field = document.querySelector('[data-testid="mapping-field"]');
    return { clip: { x: Math.round(sr.x), y: Math.round(sr.y), width: Math.round(sr.width), height: Math.round(sr.height) },
      selection: field.getAttribute('data-selection'), arcs };
  }, [SAMPLES]);

  const cdp = await page.context().newCDPSession(page);
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...geo.clip, scale: 1 }, optimizeForSpeed: true });
  const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
  const ch = s.info.channels, d = s.data, W = geo.clip.width, H = geo.clip.height;
  const at = (x, y) => { const px = Math.round(x - geo.clip.x), py = Math.round(y - geo.clip.y);
    if (px < 0 || py < 0 || px >= W || py >= H) return null; const q = (py * W + px) * ch;
    return 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; };

  const marks = geo.arcs.map(a => {
    const vals = a.pts.map(p => at(p.x, p.y)).filter(v => v !== null);
    const renderedMedian = med(vals);
    const effAlpha = a.declared * (a.bodyGroupOpacity ?? 1) * (a.arcOwnOpacity ?? 1);
    const predicted = predict(effAlpha);
    return { step: a.step, declared: a.declared, bodyRank: a.bodyRank, bodyLit: a.bodyLit,
      bodyInPool: a.bodyInPool, bodyGroupOpacity: a.bodyGroupOpacity, arcOwnOpacity: a.arcOwnOpacity,
      samples: vals.length, geometryTag: a.geometryTag, renderedMedian: renderedMedian === null ? null : +renderedMedian.toExponential(6),
      predictedFromDeclared: +predicted.toExponential(6),
      twoRouteRatio: renderedMedian && predicted ? +(renderedMedian / predicted).toFixed(4) : null };
  }).filter(m => m.renderedMedian !== null && m.step !== null);

  // (a) IN SCOPE: adjacent-band separation among marks sharing a focus state.
  const byFocus = {};
  for (const m of marks) (byFocus[`lit=${m.bodyLit},inPool=${m.bodyInPool},op=${m.bodyGroupOpacity}`] ??= []).push(m);
  const inScope = Object.entries(byFocus).map(([focus, ms]) => {
    const bands = {};
    for (const m of ms) (bands[m.step] ??= []).push(m.renderedMedian);
    const ordered = Object.entries(bands).map(([step, vs]) => ({ step, floor: Math.min(...vs), ceil: Math.max(...vs), n: vs.length }))
      .sort((x, y) => y.floor - x.floor);
    const pairs = ordered.slice(1).map((lower, i) => ({ upper: ordered[i].step, lower: lower.step,
      upperFloor: +ordered[i].floor.toExponential(6), lowerCeil: +lower.ceil.toExponential(6),
      ratio: +(ordered[i].floor / lower.ceil).toFixed(4), bound: `>= ${BOUND}`, clears: ordered[i].floor / lower.ceil >= BOUND }));
    return { focusState: focus, marks: ms.length, bandsPresent: ordered, adjacentPairs: pairs, allClear: pairs.every(p => p.clears) };
  });

  // (b) OUT OF SCOPE: GELB's cross-focus-state comparison.
  const states = [...new Set(marks.map(m => m.bodyGroupOpacity))].sort((x, y) => y - x);
  let crossFocus = null;
  if (states.length > 1) {
    const lit = marks.filter(m => m.bodyGroupOpacity === states[0]);
    const dim = marks.filter(m => m.bodyGroupOpacity === states[states.length - 1]);
    const inversions = [];
    for (const u of dim) for (const l of lit) {
      if (Number(u.declared) > Number(l.declared)) {
        inversions.push({ higherBandOnDimmedBody: { step: u.step, declared: u.declared, rendered: u.renderedMedian, groupOpacity: u.bodyGroupOpacity },
          lowerBandOnLitBody: { step: l.step, declared: l.declared, rendered: l.renderedMedian, groupOpacity: l.bodyGroupOpacity },
          renderedRatio_higherOverLower: +(u.renderedMedian / l.renderedMedian).toFixed(4),
          inverted: u.renderedMedian < l.renderedMedian });
      }
    }
    crossFocus = { litGroupOpacity: states[0], dimmedGroupOpacity: states[states.length - 1],
      dimFactor: +(states[0] / states[states.length - 1]).toFixed(4),
      comparablePairs: inversions.length, invertedPairs: inversions.filter(x => x.inverted).length,
      anyInversion: inversions.some(x => x.inverted), examples: inversions.slice(0, 6) };
  }
  return { label, selection: geo.selection, markCount: marks.length,
    twoRouteAgreement: { min: Math.min(...marks.map(m => m.twoRouteRatio ?? Infinity)),
      max: Math.max(...marks.map(m => m.twoRouteRatio ?? -Infinity)) },
    inScope_withinOneFocusState: inScope, outOfScope_crossFocusState: crossFocus, marks };
}

const out = { commit: "3ec8457d", buildId: "xCD8LBxdjnP97-2Gjs5yr", motion: "reduce", viewport: "1920x1080",
  pin: "PF-2 — adjacent evidence bands >= 1.6 at their closest points, on rendered pixels",
  inheritedScope: "between classes, WITHIN ONE FOCUSED GROUP (PHASE_E §12, recorded at mapping-phase-e-contract/prep.txt:267, citing A-6) — i.e. across bodies that SHARE a focus state, so a common group opacity cancels in the ratio",
  scope: "one fixture, one analysisId, L0 — §63",
  snapshots: [] };
out.snapshots.push(await snapshot("resting (no selection)"));
const nodes = await page.locator('[data-mapping-node]').all();
for (let i = 0; i < nodes.length; i++) {
  const list = await page.locator('[data-mapping-node]').all();
  const id = await list[i].getAttribute('data-testid');
  await list[i].click({ force: true }).catch(() => {}); await page.waitForTimeout(650);
  out.snapshots.push(await snapshot(`selected ${id}`));
  const again = await page.locator('[data-mapping-node]').all();
  await again[i].click({ force: true }).catch(() => {}); await page.waitForTimeout(500);
}
await ctx.close(); await b.close();
console.log(JSON.stringify(out, null, 2));
