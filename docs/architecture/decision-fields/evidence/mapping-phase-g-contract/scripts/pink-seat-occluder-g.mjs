const PW = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const { chromium } = await import(PW);
const URL = "http://127.0.0.1:3122/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=CAN_00000000000000000000000000000002";
const out = {};
const b = await chromium.launch();
for (const w of [1920, 1366, 1280, 1260, 1152]) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 1920 ? 1080 : 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
  await p.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await p.waitForTimeout(1200);
  while (await p.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await p.locator('[data-testid="onboarding-close-btn"]').first().click().catch(()=>{});
    await p.keyboard.press("Escape").catch(()=>{}); await p.waitForTimeout(350);
  }
  out[w] = await p.evaluate(() => {
    const svg = document.querySelector('[data-mapping-body]').closest('svg');
    const k = svg.viewBox.baseVal.width / svg.getBoundingClientRect().width;
    return [...document.querySelectorAll('[data-mapping-body]')].map(el => {
      const seats = [...el.querySelectorAll('circle.mf-seat')];
      const filled = seats.find(c => c.getAttribute('fill') && c.getAttribute('fill') !== 'none');
      const ring = seats.find(c => c.getAttribute('fill') === 'none');
      return { rank: +el.getAttribute('data-rank'), cls: el.getAttribute('data-class'),
               line: el.getAttribute('data-line'), shelf: el.getAttribute('data-shelf'),
               rhoDrawn: +el.getAttribute('data-drawn-radius'), k: +k.toFixed(5),
               rDevicePx: +(+el.getAttribute('data-drawn-radius') / k).toFixed(4),
               filledSeat: filled ? { r: filled.getAttribute('r'), fill: filled.getAttribute('fill') } : null,
               ringDash: ring ? (ring.getAttribute('stroke-dasharray') ?? "(none => continuous)") : null,
               ringWidthUser: ring ? +ring.getAttribute('stroke-width') : null,
               ringHalfDevicePx: ring ? +(ring.getAttribute('stroke-width') / 2 / k).toFixed(4) : null };
    });
  });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(out, null, 1));
