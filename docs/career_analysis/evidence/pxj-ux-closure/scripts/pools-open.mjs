import { readFileSync } from "node:fs"; import { pathToFileURL } from "node:url";
const [STATE, CSS, FITJS, OUTSHOT] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const VAL = S.validationUploadId;
const b = await chromium.launch();
for (const [w, h] of [[1280, 720], [1440, 900], [1600, 900], [1920, 1080]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const p = await ctx.newPage();
  await p.goto(`${S.base}/career/demo?focus=FIELD&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobOrganizationId=org_pink_alpha&jobRoleId=role_pink_alpha_architect&jobScopePoolUploadId=${VAL}&jobScopeRoleId=role_pink_alpha_architect`, { waitUntil: "networkidle" });
  if (CSS !== "-") { await p.addStyleTag({ content: readFileSync(CSS, "utf8") }); await p.evaluate(readFileSync(FITJS, "utf8")); }
  await p.waitForTimeout(1200);
  await p.getByTestId("syntx-pools-toggle").click(); await p.waitForTimeout(600);
  const r = await p.evaluate(() => { const l = document.querySelector('[data-testid="job-pool-list"]').getBoundingClientRect(); const o = document.querySelector('[data-sx-orient]').getBoundingClientRect(); const btn = document.querySelector('[data-testid^="job-pool-select-"]:not([disabled])'); const br = btn?.getBoundingClientRect(); const hit = br ? document.elementFromPoint(br.x + br.width / 2, br.y + br.height / 2) : null; return { list: [Math.round(l.x), Math.round(l.y), Math.round(l.right), Math.round(l.bottom)], orient: [Math.round(o.x), Math.round(o.y), Math.round(o.right), Math.round(o.bottom)], vh: innerHeight, buttonHit: !!btn && !!hit && btn.contains(hit) }; });
  let clicked = false; try { await p.locator('[data-testid^="job-pool-select-"]:not([disabled])').first().click({ timeout: 3000 }); clicked = true; } catch {}
  if (OUTSHOT !== "-" && w === 1280) { await p.goto(p.url()); }
  console.log(w, h, JSON.stringify(r), "click", clicked);
  await ctx.close();
}
await b.close();
