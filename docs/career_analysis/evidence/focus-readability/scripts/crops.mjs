// argv: <base url> <out prefix> <W> <H>; crops of the pool core (FIELD) and the organization centre (ORGANIZATION), EN.
import { pathToFileURL } from "node:url";
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const [BASE, OUT, W = "1920", H = "1080"] = process.argv.slice(2); const P = "JPOOL_B94850C439974E27496FE3B1A9A076B5";
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: +W, height: +H } }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const p = await ctx.newPage();
for (const [name, q, sel] of [["field", "", '[data-testid="syntx-pool-core"]'], ["org", "&jobOrganizationId=org_kestrel", '[data-testid="syntx-cosmos-centre"]']]) {
  await p.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${P}${q}&investigationMode=PERSON`, { waitUntil: "networkidle" }); await p.waitForTimeout(2500);
  const r = await p.locator(sel).boundingBox(); const pad = 110;
  await p.screenshot({ path: `${OUT}-${name}.png`, clip: { x: r.x - pad, y: r.y - pad, width: r.width + 2 * pad, height: r.height + 2 * pad } });
}
await b.close();
