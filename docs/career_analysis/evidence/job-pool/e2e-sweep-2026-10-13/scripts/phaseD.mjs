/* Phase D (REAL data): growing pools 9 → 16 → 48 roles — API latency, time to AVAILABLE, DOM size, frame rate (headless, no GPU:
 * relative only), organization body overlap at FIELD, role cards at the largest organization (overlap, inside the viewport). */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium, BASE, DIR, rec, closeOnboarding, shot } from "./common.mjs";
const A = JSON.parse(readFileSync(`${DIR}/state-A.json`, "utf8"));
const anl = A.analyses.ENG.analysisId; const rows = [];
const browser = await chromium.launch({ headless: true });
for (const pool of ["DLL_JOBPOOL_ENGINEERING", "DLL_JOBPOOL_AI_DATA", "DLL_JOBPOOL_ENTERPRISE_SCALE"]) {
  const up = A.uploads[pool]; const file = JSON.parse(readFileSync(`/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/job-pool-tests/${pool}.json`, "utf8"));
  const t = []; for (let i = 0; i < 3; i += 1) { const s = Date.now(); const r = await fetch(`${BASE}/api/career/job-pools/${up}/matches?analysisId=${anl}`); await r.arrayBuffer(); t.push(Date.now() - s); }
  for (const vp of [[1600, 1000], [1280, 720]]) {
    const page = await browser.newPage({ viewport: { width: vp[0], height: vp[1] } }); const errors = []; page.on("pageerror", e => errors.push(String(e)));
    const s0 = Date.now();
    await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${anl}&jobPoolUploadId=${up}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page);
    await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 120000 });
    const toAvailable = Date.now() - s0; await page.mouse.move(5, vp[1] - 5); await page.waitForTimeout(2500);
    const dom = await page.evaluate(() => document.querySelectorAll('[data-testid="syntx-field"] *').length);
    const fps = await page.evaluate(async () => { let n = 0; const t0 = performance.now(); while (performance.now() - t0 < 5000) { await new Promise(r => requestAnimationFrame(r)); n += 1; } return Math.round(n / 5 * 10) / 10; });
    // organization bodies: pairwise overlap of their spheres, inside the viewport, labels readable (font >= 9px)
    const geo = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="syntx-organization-"][data-sign-manifestation="region"]')].map(o => { const s = [...o.querySelectorAll("div")].find(x => getComputedStyle(x).borderRadius === "50%"); const r = s.getBoundingClientRect(); return { id: o.dataset.testid, x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width / 2 }; }));
    const overlaps = []; for (let i = 0; i < geo.length; i += 1) for (let j = i + 1; j < geo.length; j += 1) { const d = Math.hypot(geo[i].x - geo[j].x, geo[i].y - geo[j].y); if (d < geo[i].r + geo[j].r - 2) overlaps.push(`${geo[i].id.slice(19)}~${geo[j].id.slice(19)} (${Math.round(geo[i].r + geo[j].r - d)}px)`); }
    const outside = geo.filter(g => g.x - g.r < 0 || g.y - g.r < 0 || g.x + g.r > vp[0] || g.y + g.r > vp[1]).map(g => g.id.slice(19));
    await shot(page, `D-${pool}-${vp[0]}`);
    // largest organization at ORGANIZATION level: role cards overlap each other / leave the viewport
    const big = file.organizations.map(o => ({ id: o.id, n: file.roles.filter(r => r.organization_id === o.id).length })).sort((a, b) => b.n - a.n)[0];
    await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${anl}&jobPoolUploadId=${up}&jobOrganizationId=${big.id}`, { waitUntil: "domcontentloaded" });
    await page.locator(`[data-testid="syntx-field"][data-observation-kind="ORGANIZATION"][data-sources-state="AVAILABLE"]`).waitFor({ timeout: 60000 }); await page.waitForTimeout(2000);
    const cards = await page.evaluate(() => [...document.querySelectorAll('[data-sx-level="organization"] [data-sx-role-card]')].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; }));
    let cardOverlap = 0; for (let i = 0; i < cards.length; i += 1) for (let j = i + 1; j < cards.length; j += 1) { const a = cards[i], b = cards[j]; if (a[0] < b[2] - 2 && b[0] < a[2] - 2 && a[1] < b[3] - 2 && b[1] < a[3] - 2) cardOverlap += 1; }
    const cardOut = cards.filter(c => c[0] < 0 || c[1] < 0 || c[2] > vp[0] || c[3] > vp[1]).length;
    const surfaces = await page.evaluate(() => { const o = document.querySelector('[data-sx-surface="header"]').getBoundingClientRect(); return [...document.querySelectorAll('[data-sx-level="organization"] [data-sx-role-card]')].filter(e => { const r = e.getBoundingClientRect(); return r.left < o.right && o.left < r.right && r.top < o.bottom && o.top < r.bottom; }).length; });
    await shot(page, `D-${pool}-${vp[0]}-org-${big.id}`);
    const row = { pool, roles: file.roles.length, orgs: file.organizations.length, viewport: vp.join("x"), matchesApiMs: t, toAvailableMs: toAvailable, fieldDomNodes: dom, fps, orgOverlaps: overlaps, orgOutsideViewport: outside, largestOrg: big, roleCards: cards.length, roleCardOverlaps: cardOverlap, roleCardsOutsideViewport: cardOut, roleCardsUnderOrientation: surfaces, errors: errors.length };
    rows.push(row);
    rec(10, `D10.${pool} ${vp.join("x")} organization bodies: no overlap, inside the viewport`, overlaps.length === 0 && outside.length === 0, { overlaps, outside });
    rec(10, `D10.${pool} ${vp.join("x")} largest organization (${big.n} roles): role cards neither overlap nor leave the viewport nor cover the orientation surface`, cardOverlap === 0 && cardOut === 0 && surfaces === 0, { cards: cards.length, cardOverlap, cardOut, underOrientation: surfaces });
    rec(10, `D10.${pool} ${vp.join("x")} load and frame metrics (headless, no GPU)`, "INFO", { matchesApiMs: t, toAvailableMs: toAvailable, fieldDomNodes: dom, fps });
    await page.close();
  }
}
writeFileSync(`${DIR}/phaseD.json`, JSON.stringify(rows, null, 2));
await browser.close();
