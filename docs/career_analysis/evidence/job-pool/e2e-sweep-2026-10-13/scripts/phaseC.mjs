/* Phase C (REAL data, real browser): selection, DOM ⇄ API at every level, aperture ⇄ quote, navigation (click, keyboard, Escape, RETURN,
 * path), deep link and refresh. */
import { readFileSync } from "node:fs";
import { chromium, BASE, DIR, rec, closeOnboarding, shot, getJson } from "./common.mjs";
const A = JSON.parse(readFileSync(`${DIR}/state-A.json`, "utf8"));
const PAIRS = [["DLL_JOBPOOL_ENGINEERING", "ENG"], ["DLL_JOBPOOL_AI_DATA", "AI"]];
const browser = await chromium.launch({ headless: true });
const supportOf = (m) => { const s = new Map(); for (const r of m.roleMatches) { for (const x of r.matched) s.set(x.poolRequirementId, "SUPPORTED"); for (const x of r.weakEvidence) s.set(x.poolRequirementId, "WEAK"); for (const x of r.missing) s.set(x.poolRequirementId, x.sweepProposal ? "SWEEP_ONLY" : "OPEN"); } return s; };
const root = (page) => page.locator('[data-testid="syntx-field"]');
const level = (page, kind, id) => page.locator(`[data-testid="syntx-field"][data-observation-kind="${kind}"]${id ? `[data-observation-id="${id}"]` : ""}[data-sources-state="AVAILABLE"]`).waitFor({ timeout: 30000 });
/** Click a moving sign at its current centre after asserting that the sign owns that point (retries while it orbits). */
const clickOwned = async (page, locator) => { for (let i = 0; i < 12; i += 1) { const p = await locator.evaluate(e => { const r = e.getBoundingClientRect(); const x = r.left + r.width / 2, y = r.top + r.height / 2; const h = document.elementFromPoint(x, y); return { x, y, own: h !== null && (e === h || e.contains(h)) }; }); if (p.own) { await page.mouse.click(p.x, p.y); return true; } await page.waitForTimeout(250); } return false; };
for (const [poolName, key] of PAIRS) {
  const uploadId = A.uploads[poolName], analysisId = A.analyses[key].analysisId, tag = `${poolName}×${key}`;
  const file = JSON.parse(readFileSync(`/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/job-pool-tests/${poolName}.json`, "utf8"));
  const m = (await getJson(`/api/career/job-pools/${uploadId}/matches?analysisId=${analysisId}`)).body; const sup = supportOf(m);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); const errors = []; page.on("pageerror", e => errors.push(String(e)));
  // 1 · explicit selection from the POOLS panel (analysis from the URL)
  await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${analysisId}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page);
  await root(page).waitFor({ timeout: 60000 });
  const before = await root(page).getAttribute("data-field-state");
  await page.getByTestId("syntx-pools-toggle").click(); await page.getByTestId(`job-pool-select-${uploadId}`).click();
  await page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 90000 });
  rec(3, `C3.${tag} explicit SELECT in the pools panel opens the pool; URL carries the upload`, before === "NO_POOL" && page.url().includes(`jobPoolUploadId=${uploadId}`), { before, url: page.url().replace(BASE, "") });
  await page.getByTestId("syntx-pools-toggle").click();
  // 2 · DOM = API at FIELD
  const counts = await root(page).evaluate(e => ({ o: +e.dataset.organizationCount, r: +e.dataset.roleCount, q: +e.dataset.requirementCount, src: e.dataset.analysisSource, anl: e.dataset.analysisId }));
  rec(4, `C4.${tag} field counts = file`, counts.o === file.organizations.length && counts.r === file.roles.length && counts.q === file.requirements.length && counts.anl === analysisId, counts);
  const orgDom = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-testid^="syntx-organization-"][data-sign-manifestation="region"]')].map(e => [e.dataset.testid.replace("syntx-organization-", ""), +e.dataset.roleCount])));
  const orgFile = Object.fromEntries(file.organizations.map(o => [o.id, file.roles.filter(r => r.organization_id === o.id).length]));
  rec(4, `C4.${tag} every organization body exists with its role count`, JSON.stringify(Object.entries(orgDom).sort()) === JSON.stringify(Object.entries(orgFile).sort()), { dom: orgDom });
  await shot(page, `C-${key}-${poolName}-field`);
  // 3 · ROLE level for every role via deep link: requirement signs and their support = API
  const roleBad = [];
  for (const role of file.roles) {
    await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${analysisId}&jobPoolUploadId=${uploadId}&jobOrganizationId=${role.organization_id}&jobRoleId=${role.id}`, { waitUntil: "domcontentloaded" });
    await level(page, "ROLE", role.id);
    const dom = await page.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-sx-level="role"] [data-testid^="syntx-requirement-"]')].map(e => [e.dataset.testid.replace("syntx-requirement-", ""), e.dataset.support])));
    const want = Object.fromEntries(file.requirements.filter(q => q.role_id === role.id).map(q => [q.id, sup.get(q.id)]));
    if (JSON.stringify(Object.entries(dom).sort()) !== JSON.stringify(Object.entries(want).sort())) roleBad.push({ role: role.id, dom: Object.keys(dom).length, want: Object.keys(want).length, diff: Object.keys(want).filter(k => dom[k] !== want[k]).slice(0, 4).map(k => `${k}:${dom[k]}≠${want[k]}`) });
  }
  rec(5, `C5.${tag} every role: requirement signs and support (SUPPORTED/WEAK/SWEEP_ONLY/OPEN) = matches body`, roleBad.length === 0, { roles: file.roles.length, bad: roleBad.slice(0, 3) });
  // 4 · REQUIREMENT level + evidence aperture: rendered quote = API quote
  const best = m.roleMatches.find(r => r.matched.length > 0) ?? m.roleMatches.find(r => r.weakEvidence.length > 0);
  if (best) {
    const item = best.matched[0] ?? best.weakEvidence[0];
    await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${analysisId}&jobPoolUploadId=${uploadId}&jobOrganizationId=${best.poolOrganizationId}&jobRoleId=${best.poolRoleId}&jobRequirementId=${item.poolRequirementId}`, { waitUntil: "domcontentloaded" });
    await level(page, "REQUIREMENT", item.poolRequirementId);
    const row = page.locator(`[data-sx-evidence-row][data-trace-kind="${best.matched[0] ? "supports" : "weakly_supports"}"]`).first();
    const opened = await clickOwned(page, row);
    await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 10000 }).catch(() => {});
    const quote = (await page.getByTestId("syntx-aperture-quote").innerText().catch(() => "")).replace(/[“”"]/g, "").replace(/\s+/g, " ").trim();
    const auth = (await page.getByTestId("syntx-aperture-authority").innerText().catch(() => "")).replace(/\s+/g, " ");
    await shot(page, `C-${key}-${poolName}-aperture`);
    rec(5, `C5.${tag} evidence aperture shows the served quote verbatim and its authority boundary`, opened && quote.includes(item.evidence[0].quote.replace(/\s+/g, " ").trim()) && /NONE/i.test(auth), { req: item.poolRequirementId, quote: quote.slice(0, 90), authority: auth.slice(0, 90) });
    await page.keyboard.press("Escape"); await page.locator('[data-testid="syntx-field"][data-aperture-open="false"]').waitFor({ timeout: 5000 }).catch(() => {});
    rec(6, `C6.${tag} Escape closes the aperture first (level kept)`, (await root(page).getAttribute("data-aperture-open")) === "false" && (await root(page).getAttribute("data-observation-kind")) === "REQUIREMENT");
    // refresh keeps the level
    await page.reload({ waitUntil: "domcontentloaded" }); await level(page, "REQUIREMENT", item.poolRequirementId).catch(() => {});
    rec(9, `C9.${tag} refresh restores the requirement level from the URL`, (await root(page).getAttribute("data-observation-id")) === item.poolRequirementId);
    // Escape chain up to FIELD
    const chain = [];
    for (const want of ["ROLE", "ORGANIZATION", "FIELD"]) { await root(page).focus(); await page.keyboard.press("Escape"); await level(page, want).catch(() => {}); chain.push(await root(page).getAttribute("data-observation-kind")); }
    rec(6, `C6.${tag} Escape walks back REQUIREMENT → ROLE → ORGANIZATION → FIELD; URL cleared`, chain.join(">") === "ROLE>ORGANIZATION>FIELD" && !page.url().includes("jobOrganizationId"), { chain, url: page.url().replace(BASE, "") });
  }
  // 5 · click path down and RETURN / path steps up
  await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${analysisId}&jobPoolUploadId=${uploadId}`, { waitUntil: "domcontentloaded" }); await level(page, "FIELD");
  const org = best?.poolOrganizationId ?? file.organizations[0].id; const roleId = best?.poolRoleId ?? file.roles.find(r => r.organization_id === org).id;
  const c1 = await clickOwned(page, page.locator(`[data-testid="syntx-organization-${org}"]`)); await level(page, "ORGANIZATION", org).catch(() => {});
  const k1 = await root(page).getAttribute("data-observation-kind");
  const c2 = await clickOwned(page, page.locator(`[data-sx-level="organization"] [data-testid="syntx-role-${roleId}"]`)); await level(page, "ROLE", roleId).catch(() => {});
  const k2 = await root(page).getAttribute("data-observation-kind");
  const reqTarget = page.locator(`[data-sx-level="role"] [data-testid^="syntx-requirement-"] [data-sign-manifestation="anchor"]`).first();
  const c3 = await clickOwned(page, reqTarget); await level(page, "REQUIREMENT").catch(() => {});
  const k3 = await root(page).getAttribute("data-observation-kind");
  rec(6, `C6.${tag} pointer path FIELD → ORGANIZATION → ROLE → REQUIREMENT (moving signs, ownership-checked clicks)`, c1 && c2 && c3 && `${k1}>${k2}>${k3}` === "ORGANIZATION>ROLE>REQUIREMENT", { clicks: [c1, c2, c3], kinds: [k1, k2, k3] });
  await page.getByTestId("syntx-return-btn").click(); await level(page, "ROLE").catch(() => {});
  const r1 = await root(page).getAttribute("data-observation-kind");
  await page.getByTestId("syntx-path-FIELD").click().catch(() => {}); await level(page, "FIELD").catch(() => {});
  rec(6, `C6.${tag} RETURN goes one level up; the FIELD path step returns to the field`, r1 === "ROLE" && (await root(page).getAttribute("data-observation-kind")) === "FIELD", { afterReturn: r1, afterPath: await root(page).getAttribute("data-observation-kind") });
  // 6 · keyboard: Tab to an organization, Enter
  await root(page).focus(); let reached = null;
  for (let i = 0; i < 40; i += 1) { await page.keyboard.press("Tab"); const t = await page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? ""); if (t.startsWith("syntx-organization-")) { reached = t; break; } }
  if (reached) { await page.keyboard.press("Enter"); await level(page, "ORGANIZATION").catch(() => {}); }
  rec(9, `C9.${tag} keyboard: Tab reaches an organization, Enter observes it`, reached !== null && (await root(page).getAttribute("data-observation-kind")) === "ORGANIZATION", { reached });
  rec(9, `C.${tag} page errors`, errors.length === 0, errors.join(" | ").slice(0, 300));
  await page.close();
}
await browser.close();
