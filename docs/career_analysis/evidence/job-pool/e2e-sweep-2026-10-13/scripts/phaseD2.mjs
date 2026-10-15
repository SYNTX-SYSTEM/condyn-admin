/* Phase D2: pool growth 16 → 32 → 64 organizations (48 → 96 → 192 roles; 290 → 580 → 1160 requirements). Upload through the real API,
 * matching latency against the real analysis, field rendering at 1600 x 1000. Scaled pools are E2E-generated copies of the fixture. */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium, BASE, DIR, rec, closeOnboarding, shot } from "./common.mjs";
const A = JSON.parse(readFileSync(`${DIR}/state-A.json`, "utf8")); const anl = A.analyses.ENG.analysisId;
const sets = [["x1 (fixture)", null, A.uploads.DLL_JOBPOOL_ENTERPRISE_SCALE], ["x2", `${DIR}/scale-x2.json`, null], ["x4", `${DIR}/scale-x4.json`, null]];
const browser = await chromium.launch({ headless: true }); const rows = [];
for (const [name, path, known] of sets) {
  let uploadId = known, uploadMs = null, status = null;
  if (path) { const body = readFileSync(path, "utf8"); const s = Date.now(); const r = await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_E2E_GROWTH" }, body }); uploadMs = Date.now() - s; status = r.status; const j = await r.json(); uploadId = j.jobPoolUploadId ?? j.upload?.jobPoolUploadId ?? JSON.stringify(j).match(/JPOOL_[0-9A-F]{32}/)?.[0]; }
  const view = await (await fetch(`${BASE}/api/career/job-pools/${uploadId}`)).json();
  const lat = []; for (let i = 0; i < 3; i += 1) { const s = Date.now(); const r = await fetch(`${BASE}/api/career/job-pools/${uploadId}/matches?analysisId=${anl}`); await r.arrayBuffer(); lat.push(Date.now() - s); }
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); const errors = []; page.on("pageerror", e => errors.push(String(e)));
  const s0 = Date.now(); await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${anl}&jobPoolUploadId=${uploadId}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page);
  await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 180000 }); const toAvail = Date.now() - s0;
  await page.mouse.move(5, 995); await page.waitForTimeout(2500);
  const geo = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="syntx-organization-"][data-sign-manifestation="region"]')].map(o => { const s = [...o.querySelectorAll("div")].find(x => getComputedStyle(x).borderRadius === "50%"); const r = s.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; }));
  let overlaps = 0; for (let i = 0; i < geo.length; i += 1) for (let j = i + 1; j < geo.length; j += 1) if (Math.hypot(geo[i].x - geo[j].x, geo[i].y - geo[j].y) < geo[i].r + geo[j].r - 2) overlaps += 1;
  const outside = geo.filter(g => g.x - g.r < 0 || g.y - g.r < 0 || g.x + g.r > 1600 || g.y + g.r > 1000).length;
  const dom = await page.evaluate(() => document.querySelectorAll('[data-testid="syntx-field"] *').length);
  const fps = await page.evaluate(async () => { let n = 0; const t0 = performance.now(); while (performance.now() - t0 < 5000) { await new Promise(r => requestAnimationFrame(r)); n += 1; } return Math.round(n / 5 * 10) / 10; });
  const minRadius = Math.min(...geo.map(g => g.r));
  await shot(page, `D2-${name.split(" ")[0]}-field`);
  const row = { set: name, orgs: view.organizationCount, roles: view.roleCount, requirements: view.requirementCount, uploadStatus: status, uploadMs, matchesMs: lat, toAvailableMs: toAvail, bodies: geo.length, overlaps, outsideViewport: outside, minBodyRadiusPx: Math.round(minRadius), fieldDomNodes: dom, fps, pageErrors: errors.length };
  rows.push(row); console.log(JSON.stringify(row));
  rec(10, `D10 growth ${name}: ${view.organizationCount} orgs / ${view.roleCount} roles — upload, matching and field render`, path ? status === 201 : "INFO", row, path ? "FIXTURE" : "REAL");
  rec(10, `D10 growth ${name}: organization bodies do not overlap and stay inside 1600 x 1000`, overlaps === 0 && outside === 0, { overlaps, outside, minBodyRadiusPx: Math.round(minRadius) }, path ? "FIXTURE" : "REAL");
  await page.close();
}
writeFileSync(`${DIR}/phaseD2.json`, JSON.stringify(rows, null, 2)); await browser.close();
