/** PINK · PHASE G · PG-23 in its ALPHA form, measured on 3ec8457d (GELB A-G223, §55).
 *
 *  PIN: "A resting glow rests. The shelf halo's own opacity is time-invariant: no animation targets
 *  it, and its computed opacity is constant across the breath cycle."
 *
 *  No raster, no mask, no floor, no number -- so it is immune by construction to the composite
 *  problem that killed the swing form (§14: a translucent resting layer over a moving ground shows
 *  swing at every pixel however perfect the mask), and A-G49's missing selector stops being a
 *  prerequisite because a DOM check can name the element without one.
 *
 *  THE CONTROL IS THE POINT, AND THE PIN DOES NOT STATE IT. A statistic that reports "constant" must
 *  be able to report "not constant", and the thing it must fail on has to be in the frame -- A-G48's
 *  own two-limb discipline, applied to the instrument. So the FIELD halos are sampled identically:
 *  they carry `.mf-wave-halo` and must VARY over the cycle. If the field halos also read constant,
 *  the instrument is blind and the shelf result means nothing. Reported as `controlDiscriminates`.
 *
 *  Sampled over > 1 full WAVE.periodMs (10000) under reducedMotion: no-preference, at both sizes.
 *  `animationName` is read per element, and transitionProperty/Duration too, since a transition on
 *  the halo would make its opacity time-varying without any animation targeting it. The RENDERED
 *  alpha is circle x group, so BOTH carry a series and the verdict is taken on the product -- a
 *  constant circle under a modulated group would otherwise read as resting.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002`;
const PERIOD_MS = 10000, WINDOW_MS = 13000, STEP_MS = 400;

const sample = page => page.evaluate(() => [...document.querySelectorAll('.mf-halo')].map((g, i) => {
  const c = g.querySelector('circle'), cs = getComputedStyle(c), gs = getComputedStyle(g);
  return { i, isField: c.classList.contains('mf-wave-halo'),
    animationName: cs.animationName, animationDuration: cs.animationDuration,
    transitionProperty: cs.transitionProperty, transitionDuration: cs.transitionDuration,
    groupAnimationName: gs.animationName, groupAnimationDuration: gs.animationDuration,
    groupTransitionProperty: gs.transitionProperty, groupTransitionDuration: gs.transitionDuration,
    circleOpacity: cs.opacity, groupOpacity: gs.opacity, r: c.getAttribute('r') };
}));

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(2000);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400);
  }
  const series = new Map();
  const meta = new Map();
  const t0 = Date.now(); let samples = 0;
  while (Date.now() - t0 < WINDOW_MS) {
    for (const e of await sample(page)) {
      if (!series.has(e.i)) { series.set(e.i, { circle: [], group: [], product: [] }); meta.set(e.i, e); }
      const S = series.get(e.i);
      S.circle.push(+e.circleOpacity); S.group.push(+e.groupOpacity);
      S.product.push(+e.circleOpacity * +e.groupOpacity);
    }
    samples++;
    await page.waitForTimeout(STEP_MS);
  }
  const elapsed = Date.now() - t0;
  const stat = vals => { const min = Math.min(...vals), max = Math.max(...vals);
    return { n: vals.length, min: +min.toFixed(6), max: +max.toFixed(6), range: +(max - min).toFixed(6),
             distinctValues: [...new Set(vals.map(v => v.toFixed(6)))].length, timeInvariant: max === min }; };
  const rows = [...series.entries()].map(([i, S]) => {
    const m = meta.get(i);
    const circle = stat(S.circle), group = stat(S.group), rendered = stat(S.product);
    return { i, isField: m.isField, r: m.r,
      animationName: m.animationName, animationDuration: m.animationDuration,
      transitionProperty: m.transitionProperty, transitionDuration: m.transitionDuration,
      groupAnimationName: m.groupAnimationName, groupAnimationDuration: m.groupAnimationDuration,
      groupTransitionProperty: m.groupTransitionProperty, groupTransitionDuration: m.groupTransitionDuration,
      circleOpacity: circle, groupOpacity: group, renderedAlpha: rendered,
      timeInvariant: rendered.timeInvariant,
      animationTargetsIt: (m.animationName !== 'none' && m.animationDuration !== '0s')
                       || (m.groupAnimationName !== 'none' && m.groupAnimationDuration !== '0s') };
  });
  await ctx.close(); await b.close();
  const shelf = rows.filter(r => !r.isField), field = rows.filter(r => r.isField);
  return { viewport: `${VW}x${VH}`, samples, elapsedMs: elapsed,
    periodsCovered: +(elapsed / PERIOD_MS).toFixed(2), periodCoverageAdequate: elapsed >= PERIOD_MS,
    shelfHalos: shelf, fieldHalos: field,
    controlDiscriminates: field.length > 0 && field.every(r => !r.timeInvariant),
    PG23_limbA_noAnimationTargetsShelf: shelf.length > 0 && shelf.every(r => !r.animationTargetsIt),
    PG23_limbB_shelfOpacityTimeInvariant: shelf.length > 0 && shelf.every(r => r.timeInvariant),
    verdict: shelf.length === 0 ? "NOT RUN (no shelf halo)"
      : !(field.length > 0 && field.every(r => !r.timeInvariant)) ? "NOT RUN (control did not discriminate)"
      : shelf.every(r => !r.animationTargetsIt && r.timeInvariant) ? "CLEARS" : "FAILS" };
}

console.log(JSON.stringify({
  commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  pin: "PG-23 (alpha form, A-G223): a resting glow rests -- no animation targets the shelf halo and its computed opacity is time-invariant",
  method: "DOM only: computed opacity sampled over > 1 breath period, plus animationName/Duration and transitionProperty/Duration per element",
  retains: "per-element min/max/range/distinct-count for the circle opacity, the GROUP opacity and their PRODUCT (the rendered alpha), plus animation+transition descriptors for both; the raw per-sample series is not retained (A-G220)",
  control: "field halos (.mf-wave-halo) sampled identically and required to VARY, else the instrument is blind and the shelf result means nothing",
  runs: [await run(1920, 1080), await run(1280, 800)],
}, null, 1));
