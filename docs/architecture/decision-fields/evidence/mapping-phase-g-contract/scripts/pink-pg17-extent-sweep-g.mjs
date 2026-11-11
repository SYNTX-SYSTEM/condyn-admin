/** PINK · PHASE G · PG-17 extent limb: WHERE DOES IT CROSS? on 3ec8457d.
 *
 *  pink-pg17-extent-g.mjs measured the binding case (rank 1, marked, L0) at two viewports:
 *      1920x1080  margin +1.662 device px      1280x800  margin +0.0445 device px
 *  GELB §45 reported the worst achievable case as +1.000 px and concluded "straddles the bound: false
 *  => cannot fail on this artifact". The margin is CONTINUOUS in the stage's CSS width (k = viewBox /
 *  svgCssWidth, and extent/r = 1.6 - seatHalf/(rUser/k) at rank 1), so a 22x smaller margin at 1280
 *  means the zero crossing is close. This sweeps viewport width to locate it by measurement.
 *
 *  Reports, per width: k, the rank-1 drawn radius in device px, the marked extent against the 1.5 r
 *  bound, whether any body hit SIZE_FLOOR_PX, and the body count (so a layout/overflow change that
 *  moves the binding body is visible rather than silently absorbed).
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const { chromium } = await import(PW);
const BASE = "http://127.0.0.1:3122", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const SEAT_HALF_MARKED = (2 + 1.6) / 2, SEAT_HALF_UNMARKED = (1.2 * 1.002 + 1.6) / 2, BOUND = 1.5;
const WIDTHS = [1920, 1680, 1600, 1440, 1366, 1300, 1280, 1270, 1260, 1250, 1240, 1220, 1200, 1152, 1100, 1024, 960, 900, 800, 768];

const probe = page => page.evaluate(() => {
  const anyBody = document.querySelector('[data-mapping-body]');
  const svg = anyBody?.closest('svg') ?? null;
  const vb = svg?.viewBox?.baseVal, rect = svg?.getBoundingClientRect();
  const bodies = [...document.querySelectorAll('[data-mapping-body]')].map(el => ({
    rank: Number(el.getAttribute("data-rank")),
    rUser: Number(el.getAttribute("data-drawn-radius")),
    floored: el.getAttribute("data-size-floor") === "true",
  }));
  return { k: vb && rect && rect.width > 0 ? vb.width / rect.width : null,
           viewBox: vb ? vb.width : null, svgCss: rect ? rect.width : null, bodies,
           overflow: document.querySelector('[data-testid="mapping-beyond-budget"]')?.textContent ?? null };
});

const rows = [];
const b = await chromium.launch();
for (const width of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  try {
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
    await page.waitForTimeout(900);
    while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
      await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(350);
    }
    const s = await probe(page);
    const lastRank = Math.max(...s.bodies.map(x => x.rank));
    const row = { width, k: s.k, viewBox: s.viewBox, svgCss: s.svgCss, n: s.bodies.length,
                  lastRank, anyFloored: s.bodies.some(x => x.floored), overflow: s.overflow, bodies: [] };
    for (const bd of s.bodies) {
      const rDev = bd.rUser / s.k;
      const t = lastRank <= 1 ? 0 : (bd.rank - 1) / (lastRank - 1);
      const span = 1.6 + 0.4 * t;
      const em = span - SEAT_HALF_MARKED / rDev, eu = span - SEAT_HALF_UNMARKED / rDev;
      row.bodies.push({ rank: bd.rank, t: +t.toFixed(4), rUser: bd.rUser, rDev: +rDev.toFixed(4),
        floored: bd.floored,
        extentMarked: +em.toFixed(5), passMarked: em >= BOUND, marginMarkedPx: +((em - BOUND) * rDev).toFixed(4),
        extentUnmarked: +eu.toFixed(5), passUnmarked: eu >= BOUND, marginUnmarkedPx: +((eu - BOUND) * rDev).toFixed(4) });
    }
    // the BINDING body is the one with the least marked margin, whichever rank that is
    row.binding = row.bodies.reduce((a, x) => (x.marginMarkedPx < a.marginMarkedPx ? x : a), row.bodies[0]);
    row.allPassMarked = row.bodies.every(x => x.passMarked);
    row.allPassUnmarked = row.bodies.every(x => x.passUnmarked);
    rows.push(row);
  } catch (e) { rows.push({ width, error: String(e).slice(0, 200) }); }
  await ctx.close();
}
await b.close();
const ok = rows.filter(r => !r.error);
const crossMarked = ok.filter(r => !r.allPassMarked).map(r => r.width);
console.log(JSON.stringify({
  commit: "3ec8457d", buildId: "xCD8LBxdjnP97-2Gjs5yr", pin: "PG-17 extent limb (PHASE_G.md:585)", bound: "extent >= 1.5 r",
  gelbClaim: { source: "gelb-gate-pg17-pg19 §45", worstCaseMarginPx: 1.0, straddles: false, verdict: "cannot fail" },
  widestFailingMarked: crossMarked.length ? Math.max(...crossMarked) : null,
  failingWidthsMarked: crossMarked,
  failingWidthsUnmarked: ok.filter(r => !r.allPassUnmarked).map(r => r.width),
  rows,
}, null, 1));
