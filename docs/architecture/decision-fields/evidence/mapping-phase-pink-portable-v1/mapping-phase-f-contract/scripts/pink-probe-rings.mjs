import { playwright } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120", AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1500);
while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{}); await page.keyboard.press("Escape").catch(()=>{}); await page.waitForTimeout(400); }
const rings = await page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  // candidate ring elements: circles with a ring testid or ring data-* ; also any circle whose role looks structural
  const cand = [...svg.querySelectorAll('circle,[data-ring],[data-drawn-radius],[data-ring-luminance],[data-class]')];
  const seen = new Set(); const out = [];
  for (const e of cand) {
    if (e.tagName.toLowerCase() !== "circle") continue;
    const ctm = e.getScreenCTM(); if (!ctm) continue;
    const cx = parseFloat(e.getAttribute("cx")||"0"), cy = parseFloat(e.getAttribute("cy")||"0"), r = parseFloat(e.getAttribute("r")||"0");
    const sx = ctm.a*cx + ctm.c*cy + ctm.e, sy = ctm.b*cx + ctm.d*cy + ctm.f; const scale = Math.hypot(ctm.a, ctm.b);
    const cs = getComputedStyle(e);
    const key = e.getAttribute("data-testid")||`${cx},${cy},${r}`; if (seen.has(key)) continue; seen.add(key);
    out.push({ testid: e.getAttribute("data-testid"), dataRing: e.getAttribute("data-ring"), dataClass: e.getAttribute("data-class"),
      dataShelf: e.getAttribute("data-shelf"), drawnRadius: e.getAttribute("data-drawn-radius"), ringLum: e.getAttribute("data-ring-luminance"),
      r_user: r, scale: +scale.toFixed(4), screen: { cx: +sx.toFixed(2), cy: +sy.toFixed(2), r: +(r*scale).toFixed(2) },
      stroke: cs.stroke, strokeOpacity: cs.strokeOpacity, opacity: cs.opacity, strokeWidth: cs.strokeWidth, dash: cs.strokeDasharray, fill: cs.fill });
  }
  return out;
});
await ctx.close(); await b.close();
console.log(JSON.stringify({ ringCount: rings.length, rings }, null, 1));
