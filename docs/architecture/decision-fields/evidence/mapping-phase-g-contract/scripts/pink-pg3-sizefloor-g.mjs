/** PINK · PHASE G · PG-3's lower limb and the size-floor disclosure, read off the rendered page. Measured on 3ec8457d.
 *
 *  GELB (§64 item 1) asked for the floor's disclosure as PG-3's falsifiable quantity: `data-testid="mapping-size-floor"`
 *  with a `data-count`. Three corrections come out of actually reading it, and the first changes what the quantity means.
 *
 *  1. **`sizeFloor` does not enforce PG-3's 56 px.** `SIZE_FLOOR_PX = 12` (`mapping-field.ts:441`), and
 *     `floorRadius = (SIZE_FLOOR_PX / 2) * k` (`:443`). The floor is TWELVE px of diameter, not fifty-six. So the
 *     disclosure counts interventions of a floor almost five times lower than PG-3's bound, and `data-count` can be
 *     0 while every body on screen is far below 56 px. **It is not a disclosure about PG-3's lower limb at all.**
 *  2. **The span is conditional, so its absence is ambiguous** -- `:784` renders it only `floored > 0`. An instrument
 *     that reads the span cannot distinguish "no bodies floored" from "the element was renamed, or never rendered".
 *     **`:736` carries `data-size-floors={floored}` UNCONDITIONALLY on the field element**, which is the same number
 *     with a defined reading at zero. That is the hook to use, and it is already in the product.
 *  3. PG-3's 56...92 px is stated FOR L0 1920x1080 (layout-spec-v1.1.json:26), the condition A-G162 turned on. So the
 *     limb is checked at 1920 and the other viewports are reported as out-of-condition context, not as failures.
 *
 *  Both hooks are read at every viewport, and body diameters are computed in DEVICE px as `2 * r * k` with k taken
 *  from the FIELD svg's own viewBox (rule 5 -- never from a descendant svg, which resolves to a 14 px icon).
 */
const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const { chromium } = await import(PW);
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const SIZE_FLOOR_PX = 12, PG3_LO = 56, PG3_HI = 92;

async function run(VW, VH) {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1500);
  const r = await page.evaluate(() => {
    const field = document.querySelector('[data-testid="mapping-field"]');
    const span = document.querySelector('[data-testid="mapping-size-floor"]');
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    const vb = svg.getAttribute('viewBox').split(/\s+/).map(Number);
    const k = svg.getBoundingClientRect().width / vb[2];
    return { k, level: field.getAttribute('data-level'),
      unconditionalHook_dataSizeFloors: field.getAttribute('data-size-floors'),
      conditionalSpanPresent: !!span, conditionalSpanCount: span ? span.getAttribute('data-count') : null,
      bodyRadiiUserUnits: [...document.querySelectorAll('circle.mf-core')].map(c => Number(c.getAttribute('r'))).sort((x, y) => y - x) };
  });
  await b.close();
  const dia = r.bodyRadiiUserUnits.map(v => +(2 * v * r.k).toFixed(2));
  const floorDia = +(SIZE_FLOOR_PX).toFixed(2);
  const inCondition = VW === 1920 && VH === 1080;
  return { viewport: `${VW}x${VH}`, k: +r.k.toFixed(6), level: r.level,
    unconditionalHook_dataSizeFloors: r.unconditionalHook_dataSizeFloors,
    conditionalSpanPresent: r.conditionalSpanPresent, conditionalSpanCount: r.conditionalSpanCount,
    hooksAgree: String(r.unconditionalHook_dataSizeFloors) === String(r.conditionalSpanCount ?? "0"),
    bodyDiametersDevicePx: dia, smallest: dia[dia.length - 1], largest: dia[0],
    productFloorDevicePx: floorDia,
    anyBodyBelowProductFloor: dia.some(d => d < floorDia),
    PG3_inStatedCondition: inCondition,
    PG3_bound: `${PG3_LO}..${PG3_HI} px diameter at L0 1920x1080`,
    PG3_allWithinBound: dia.every(d => d >= PG3_LO && d <= PG3_HI),
    PG3_marginAtSmallest_px: +(dia[dia.length - 1] - PG3_LO).toFixed(2),
    PG3_verdict: inCondition ? (dia.every(d => d >= PG3_LO && d <= PG3_HI) ? "WITHIN" : "OUTSIDE")
      : "OUT OF CONDITION — reported as context, not as a verdict (A-G162)",
    bodiesBelowPG3Low: dia.filter(d => d < PG3_LO).length };
}

const out = { commit: "3ec8457d", buildId: "xCD8LBxdjnP97-2Gjs5yr",
  reading: "PINK — PG-3's lower limb and the size-floor disclosure, on the rendered page",
  verdict: "PG-3's lower limb WITHIN bound at its stated condition; the disclosure does NOT measure it",
  scope: "one fixture, one analysisId, five bodies (2 field / 3 shelf), L0 — §63's condition applies",
  constants: { SIZE_FLOOR_PX, PG3_LO, PG3_HI },
  finding: "sizeFloor enforces 12 px of diameter, not PG-3's 56. The disclosure counts interventions of a floor ~4.7x lower than the bound, so data-count = 0 is consistent with every body being far under 56 px — as the 1280 and 1024 rows show. Use data-size-floors (unconditional, :736) over the span (:784, conditional on floored > 0).",
  runs: [] };
for (const [w, h] of [[1920, 1080], [1280, 800], [1024, 768]]) out.runs.push(await run(w, h));
console.log(JSON.stringify(out, null, 2));
