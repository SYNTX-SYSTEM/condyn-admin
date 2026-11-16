/** PINK · PHASE G · PG-17 EXTENT-LIMB GATE on 3ec8457d.
 *
 *  GELB §45 (gelb-gate-pg17-pg19.mjs, architecture/mapping-phase-f @ 977f78bf) concludes the extent limb
 *  "cannot fail ... by exactly 1.000 device px (0.1 x 28 - 1.8)". Its stroke arithmetic is exact and k
 *  genuinely cancels. Its RADIUS premise does not hold: 28 px is the layout spec's figure, and the spec
 *  conditions it -- layout-spec-v1.1.json:26 ">= 56 ... <= 92 px diameter AT L0, 1920 x 1080". PG-17
 *  (PHASE_G.md:585) carries no level and no viewport condition. The CODE's guarantee is
 *  sizeFloor()/SIZE_FLOOR_PX = 12  =>  mapping-field.ts:441,443  floorRadius = 6 * k  =>  6 DEVICE px.
 *
 *  Derivation of the break-even (constants only, device px, k cancels):
 *    halo radius            = r * (haloNear + (haloFar - haloNear) * t),  VOLUME:127  2.6 -> 3.0
 *    seat edge              = r + seatHalf,  seat stroke centred on r  (PersonJobMappingField.tsx:698)
 *    seatHalf (marked)      = (2*k + SEAT_PAD_PX*k)/2 / k                      = 1.8
 *    seatHalf (unmarked)    = (STROKE_MIN_PX*FLOOR_HEADROOM*k + SEAT_PAD_PX*k)/2 / k = 1.4012
 *    measurable extent / r  = (1.6 + 0.4 t) - seatHalf / r_device
 *    bound (PG-17)          = 1.5 r      =>  worst case t = 0 (rank 1):  r_device >= 10 * seatHalf
 *  => marked r >= 18.000 px, unmarked r >= 14.012 px. The code guarantees 6 px. Both fail at the floor.
 *
 *  This instrument measures the ACTUAL drawn radius in device px at L0/L1/L2 at two viewports, by TWO
 *  independent routes (viewBox-derived k, and the shape's own bounding rect), and hovers the smallest
 *  body at each level to reach the marked case GELB names as its worst. Verdict per body, not a maximum.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;

const SEAT_PAD_PX = 1.6, STROKE_MIN_PX = 1.2, FLOOR_HEADROOM = 1.002, SIZE_FLOOR_PX = 12;
const HALO_NEAR = 2.6, HALO_FAR = 3.0, BOUND = 1.5;
const seatHalf = m => ((m ? 2 : STROKE_MIN_PX * FLOOR_HEADROOM) + SEAT_PAD_PX) / 2;
const extentOf = (rDev, t, m) => (HALO_NEAR - 1 + (HALO_FAR - HALO_NEAR) * t) - seatHalf(m) / rDev;
const breakEven = m => 10 * seatHalf(m);   // t = 0, the binding rank

const probe = async page => page.evaluate(() => {
  // the SVG that actually CONTAINS the bodies -- a [data-testid="mapping-field"] descendant svg
  // may be a 14px icon, which silently yields k = 14/14 = 1 and returns USER units as device px.
  const anyBody = document.querySelector('[data-mapping-body]');
  const svg = anyBody?.closest('svg') ?? null;
  const vb = svg?.viewBox?.baseVal, rect = svg?.getBoundingClientRect();
  const k = vb && rect && rect.width > 0 ? vb.width / rect.width : null;
  const bodies = [...document.querySelectorAll('[data-mapping-body]')].map(el => {
    const shape = el.querySelector('[data-mapping-body-shape]');
    const r = shape?.getBoundingClientRect();
    const marked = el.getAttribute("data-marked") === "true";
    const swDev = marked ? 2 : 1.2 * 1.002;              // shape stroke, user units / k = device px
    return {
      rank: Number(el.getAttribute("data-rank")),
      cls: el.getAttribute("data-class"),
      shelf: el.getAttribute("data-shelf") === "true",
      marked, floored: el.getAttribute("data-size-floor") === "true",
      rUser: Number(el.getAttribute("data-drawn-radius")),
      rectW: r ? r.width : null,
      rFromRect: r && r.width > 0 ? (r.width - swDev) / 2 : null,
    };
  });
  return { k, viewBox: vb ? vb.width : null, svgCss: rect ? rect.width : null, bodies,
           level: document.querySelector('[data-testid="mapping-field"]')?.getAttribute("data-level") ?? null };
});

const enrich = s => {
  const lastRank = Math.max(...s.bodies.map(b => b.rank));
  for (const b of s.bodies) {
    b.rFromK = s.k ? b.rUser / s.k : null;
    b.rDev = b.rFromK ?? b.rFromRect;
    b.routeDelta = b.rFromK != null && b.rFromRect != null ? +(b.rFromK - b.rFromRect).toFixed(4) : null;
    b.kImplied = b.rFromRect ? +(b.rUser / b.rFromRect).toFixed(5) : null;   // dash/linecap sensitive
    b.marginPx = b.rDev ? +(0.1 * b.rDev - seatHalf(true)).toFixed(4) : null;
    b.t = lastRank <= 1 ? 0 : (b.rank - 1) / (lastRank - 1);
    for (const m of [false, true]) {
      const e = extentOf(b.rDev, b.t, m);
      b[m ? "extentMarked" : "extentUnmarked"] = +e.toFixed(5);
      b[m ? "passMarked" : "passUnmarked"] = e >= BOUND;
    }
  }
  s.lastRank = lastRank;
  const ks = s.bodies.map(x => x.kImplied).filter(x => x != null);
  s.kImpliedSpreadPct = ks.length ? +(100 * (Math.max(...ks) - Math.min(...ks)) / s.k).toFixed(3) : null;
  s.kRectVsViewBox = ks.length ? { min: Math.min(...ks), max: Math.max(...ks), viewBoxK: s.k } : null;
  return s;
};

const out = {
  commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId, pin: "PG-17 extent limb (PHASE_G.md:585)",
  bound: `extent >= ${BOUND} r`,
  gelbPremise: { radiusPx: 28, source: "layout-spec-v1.1.json:26, conditioned 'at L0, 1920 x 1080'",
                 marginPx: +(0.1 * 28 - 1.8).toFixed(3) },
  codeGuarantee: { SIZE_FLOOR_PX, floorRadiusDevicePx: SIZE_FLOOR_PX / 2,
                   source: "lib/career/view-model/mapping-field.ts:441,443 sizeFloor()" },
  breakEvenDevicePx: { marked: +breakEven(true).toFixed(3), unmarked: +breakEven(false).toFixed(3) },
  atCodeFloor: { marked: +extentOf(SIZE_FLOOR_PX / 2, 0, true).toFixed(5),
                 unmarked: +extentOf(SIZE_FLOOR_PX / 2, 0, false).toFixed(5) },
  viewports: {},
};

const b = await chromium.launch();
for (const vp of [{ width: 1920, height: 1080 }, { width: 1280, height: 800 }]) {
  const ctx = await b.newContext({ viewport: vp, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1200);
  while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(400);
  }
  const key = `${vp.width}x${vp.height}`;
  out.viewports[key] = { levels: {} };

  const takeLevel = async name => {
    const s = enrich(await probe(page));
    // hover the SMALLEST body to reach the marked case GELB names as its worst
    const idx = s.bodies.reduce((a, x, i) => (x.rDev < s.bodies[a].rDev ? i : a), 0);
    const els = page.locator('[data-mapping-body]');
    await els.nth(idx).hover({ force: true }).catch(() => {});
    await page.waitForTimeout(500);
    const h = enrich(await probe(page));
    const hoveredMarked = h.bodies.filter(x => x.marked);
    await page.mouse.move(2, 2).catch(() => {});
    await page.waitForTimeout(300);
    out.viewports[key].levels[name] = {
      level: s.level, k: s.k, viewBox: s.viewBox, svgCss: s.svgCss, lastRank: s.lastRank,
      bodies: s.bodies,
      minRDev: +Math.min(...s.bodies.map(x => x.rDev)).toFixed(4),
      anyFloored: s.bodies.some(x => x.floored),
      failUnmarked: s.bodies.filter(x => !x.passUnmarked).map(x => ({ rank: x.rank, rDev: +x.rDev.toFixed(3), extent: x.extentUnmarked })),
      failIfMarked: s.bodies.filter(x => !x.passMarked).map(x => ({ rank: x.rank, rDev: +x.rDev.toFixed(3), extent: x.extentMarked })),
      hoverProbe: { smallestIdx: idx, markedCount: hoveredMarked.length,
                    marked: hoveredMarked.map(x => ({ rank: x.rank, rDev: +x.rDev.toFixed(3), t: x.t,
                                                      extent: x.extentMarked, pass: x.passMarked })) },
    };
  };

  await takeLevel("L0");
  const pool = page.locator('[data-mapping-sector]').first();
  if (await pool.count() > 0) { await pool.click({ force: true }).catch(() => {}); await page.waitForTimeout(900); await takeLevel("L1"); }
  const body = page.locator('[data-mapping-body]').first();
  if (await body.count() > 0) { await body.click({ force: true }).catch(() => {}); await page.waitForTimeout(900); await takeLevel("L2"); }
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
