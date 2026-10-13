/* Phase C2 (REAL data, real browser): boundary ⇄ API, field switch (Capability ⇄ Job) with staged sources, scroll, error states,
 * negative uploads through the intake UI, reduced motion. */
import { readFileSync } from "node:fs";
import { chromium, BASE, DIR, rec, closeOnboarding, shot, getJson } from "./common.mjs";
const A = JSON.parse(readFileSync(`${DIR}/state-A.json`, "utf8"));
const up = A.uploads.DLL_JOBPOOL_ENGINEERING, anl = A.analyses.ENG.analysisId;
const browser = await chromium.launch({ headless: true });
const root = (page) => page.locator('[data-testid="syntx-field"]');
const avail = (page) => page.locator('[data-testid="syntx-field"][data-field-state="AVAILABLE"][data-sources-state="AVAILABLE"]').waitFor({ timeout: 90000 });
// 7 · boundary ⇄ API
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${anl}&jobPoolUploadId=${up}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page); await avail(page);
  const m = (await getJson(`/api/career/job-pools/${up}/matches?analysisId=${anl}`)).body;
  const v = (await getJson(`/api/career/job-pools/${up}`)).body;
  rec(7, "C7 boundary folded until asked for", !(await page.getByTestId("job-pool-matches").isVisible()));
  await page.getByTestId("syntx-boundary-toggle").click(); await page.getByTestId("job-pool-matches").waitFor({ state: "visible", timeout: 10000 });
  const b = await page.evaluate(() => { const q = s => document.querySelector(s); return { labels: [...document.querySelectorAll('[data-testid^="job-pool-label-"]')].map(e => e.dataset.testid.replace("job-pool-label-", "")), authority: q('[data-testid="job-pool-presentation-labels"]').dataset.authorityState, policy: q('[data-testid="job-pool-presentation-labels"]').dataset.policyVersion, mapping: q('[data-testid="job-pool-canonical-mapping"]').dataset, sweep: q('[data-testid="job-pool-capability-sweep"]').dataset, ranking: q('[data-testid="job-pool-ranking"]').dataset.ranking, text: q('[data-testid="job-pool-matches"]').innerText.replace(/\s+/g, " ") }; });
  await shot(page, "C7-boundary");
  const ok = b.authority === m.presentation.authorityState && b.policy === m.presentation.policyVersion && b.sweep.sweepState === m.capabilitySweep.state && +b.sweep.proposalCount === m.capabilitySweep.proposalCount && b.sweep.scored === "false" && b.mapping.authorityState === "NONE" && b.text.includes(String(m.presentation.weakEvidenceThreshold)) && b.text.includes(`CANDIDATE CAPABILITIES ${m.candidateCapabilityCount}`) && b.labels.includes("NOT_A_DECISION") && b.labels.includes("NOT_A_CANONICAL_EVALUATION");
  rec(7, "C7 boundary = matches body (authority, policy, sweep, candidates, threshold, mapping, labels)", ok, { labels: b.labels, mapping: { m: b.mapping.mappingState, p: b.mapping.proposalState, a: b.mapping.authorityState }, sweep: b.sweep, candidates: m.candidateCapabilityCount });
  await root(page).focus(); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  rec(7, "C7 Escape closes the boundary before any level change", !(await page.getByTestId("job-pool-matches").isVisible()) && (await root(page).getAttribute("data-observation-kind")) === "FIELD");
  // scroll: wheel over the field must not change the level; boundary scrolls at 1280 x 720
  await page.mouse.move(800, 500); await page.mouse.wheel(0, 600); await page.waitForTimeout(500);
  rec(9, "C9 wheel over the field changes nothing (level, URL)", (await root(page).getAttribute("data-observation-kind")) === "FIELD" && page.url().includes(up), page.url().replace(BASE, ""));
  await page.setViewportSize({ width: 1280, height: 720 }); await page.getByTestId("syntx-boundary-toggle").click(); await page.waitForTimeout(800);
  const s0 = await page.getByTestId("job-pool-matches").evaluate(e => [e.scrollTop, e.scrollHeight, e.clientHeight]);
  const bb = await page.getByTestId("job-pool-matches").boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.wheel(0, 400); await page.waitForTimeout(500);
  const s1 = await page.getByTestId("job-pool-matches").evaluate(e => e.scrollTop);
  rec(9, "C9 boundary scrolls its own content at 1280 x 720 (wheel)", s0[1] > s0[2] && s1 > s0[0], { before: s0, after: s1 });
  await page.close();
}
// 8 · Capability ⇄ Job: staged sources and URL
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.goto(`${BASE}/career/demo?analysisId=${anl}&jobPoolUploadId=${up}&focus=CAPABILITY`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page);
  await page.getByTestId("add-text-source-btn").click(); await page.getByTestId("source-text-input").fill("E2E staged text source: Kubernetes operations and PostgreSQL schema design."); await page.getByTestId("submit-source-btn").click();
  const staged = async () => Number(((await page.getByTestId("source-dock").innerText().catch(() => "")).match(/\((\d+)\)/) ?? [])[1] ?? -1);
  const n0 = await staged();
  await page.getByTestId("job-pool-panel-toggle").click(); await avail(page);
  const urlJob = page.url();
  await page.getByTestId("field-focus-capability-btn").click(); await page.waitForTimeout(1200);
  const n1 = await staged(); const urlCap = page.url();
  rec(8, "C8 Capability → Job → Capability keeps the staged sources", n0 >= 1 && n1 === n0, { before: n0, after: n1 });
  rec(8, "C8 the URL follows the field (focus=FIELD / focus=CAPABILITY, upload kept)", urlJob.includes("focus=FIELD") && urlCap.includes("focus=CAPABILITY") && urlCap.includes(up), { urlJob: urlJob.replace(BASE, ""), urlCap: urlCap.replace(BASE, "") });
  await page.getByTestId("job-pool-panel-toggle").click(); await avail(page);
  rec(8, "C8 back in the Job Field the selected pool and analysis are kept", (await root(page).getAttribute("data-selected-pool")) === up && (await root(page).getAttribute("data-analysis-id")) === anl);
  await page.reload({ waitUntil: "domcontentloaded" }); await closeOnboarding(page); await page.waitForTimeout(3000);
  rec(9, "C9 refresh in the Job Field reopens the Job Field (focus from URL)", (await root(page).count()) > 0 && (await root(page).isVisible()), page.url().replace(BASE, ""));
  rec(9, "C9 page errors (switching)", errors.length === 0, errors.join(" | ").slice(0, 300));
  await page.close();
}
// 9 · error states
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } }); const errors = []; page.on("pageerror", e => errors.push(String(e)));
  const state = async (q) => { await page.goto(`${BASE}/career/demo?focus=FIELD${q}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page); await root(page).waitFor({ timeout: 60000 }); await page.waitForTimeout(4000); return { field: await root(page).getAttribute("data-field-state"), view: await root(page).getAttribute("data-view-state"), matches: await root(page).getAttribute("data-matches-state"), text: (await root(page).innerText()).replace(/\s+/g, " ").slice(0, 160) }; };
  const s1 = await state(`&analysisId=${anl}&jobPoolUploadId=JPOOL_00000000000000000000000000000000`);
  rec(9, "C9 unknown upload id → NOT_FOUND state, readable", s1.field === "NOT_FOUND", s1);
  const s2 = await state(`&jobPoolUploadId=${up}`);
  rec(9, "C9 pool without analysis → NO_ANALYSIS", s2.field === "NO_ANALYSIS", s2);
  const s3 = await state(`&analysisId=ANL_DOES_NOT_EXIST&jobPoolUploadId=${up}`);
  rec(9, "C9 unknown analysis id → explicit non-AVAILABLE state (no fabricated matching)", s3.field !== "AVAILABLE" || s3.matches !== "AVAILABLE", s3);
  await shot(page, "C9-unknown-analysis");
  const s4 = await state(`&analysisId=${anl}&jobPoolUploadId=${up}&jobOrganizationId=org_nope&jobRoleId=role_nope`);
  rec(9, "C9 deep link to an unknown organization/role → falls back to a valid level", ["FIELD", "ORGANIZATION"].includes(await root(page).getAttribute("data-observation-kind")) && s4.field === "AVAILABLE", { kind: await root(page).getAttribute("data-observation-kind"), field: s4.field });
  const api404 = await getJson(`/api/career/job-pools/JPOOL_00000000000000000000000000000000/matches?analysisId=${anl}`);
  rec(9, "C9 API: unknown upload → 404 with code", api404.status === 404, { status: api404.status, code: api404.body?.code ?? api404.body?.error });
  const apiNoAnl = await getJson(`/api/career/job-pools/${up}/matches?analysisId=ANL_DOES_NOT_EXIST`);
  rec(9, "C9 API: unknown analysis → 4xx with code", apiNoAnl.status >= 400 && apiNoAnl.status < 500, { status: apiNoAnl.status, code: apiNoAnl.body?.code ?? apiNoAnl.body?.error });
  // negative uploads through the intake UI
  await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${anl}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page); await root(page).waitFor({ timeout: 60000 });
  await page.getByTestId("job-pool-intake-toggle").click(); await page.getByTestId("job-pool-upload").waitFor({ state: "visible" });
  for (const [file, want] of [["neg-weight.json", { status: "422", code: "ERR_JOB_POOL_SCHEMA_INVALID" }], ["neg-ref.json", { status: "422", code: "ERR_JOB_POOL_REFERENCE_INVALID" }], ["neg-big.json", { status: "413" }], ["neg-syntax.json", { status: "4" }]]) {
    await page.getByTestId("job-pool-file-input").setInputFiles(`${DIR}/${file}`); await page.getByTestId("job-pool-actor-input").fill("GRUEN_E2E_NEG");
    const enabled = await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').count();
    if (!enabled) { rec(9, `C9 intake rejects ${file} before sending (button disabled)`, "INFO", "client-side guard"); continue; }
    await page.getByTestId("job-pool-upload-btn").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="job-pool-upload-rejected"], [data-testid="job-pool-upload-failed"], [data-testid="job-pool-upload-result"]'), null, { timeout: 30000 }).catch(() => {});
    const rj = page.getByTestId("job-pool-upload-rejected");
    const got = (await rj.count()) ? { status: await rj.getAttribute("data-rejection-status"), code: await rj.getAttribute("data-rejection-code"), issues: (await page.getByTestId("job-pool-upload-issue").allInnerTexts()).slice(0, 2) } : { other: (await page.getByTestId("job-pool-upload").innerText()).replace(/\s+/g, " ").slice(-200) };
    rec(9, `C9 intake UI rejects ${file} with a readable reason`, got.status !== undefined && got.status.startsWith(want.status) && (!want.code || got.code === want.code), got);
  }
  await shot(page, "C9-intake-rejected");
  rec(9, "C9 page errors (error states)", errors.length === 0, errors.join(" | ").slice(0, 300));
  await page.close();
}
// reduced motion: functional walk, nothing animates
{
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" });
  const m = (await getJson(`/api/career/job-pools/${up}/matches?analysisId=${anl}`)).body; const role = m.roleMatches[0];
  const running = () => page.evaluate(() => document.querySelector('[data-testid="syntx-field"]').getAnimations({ subtree: true }).filter(a => a.playState === "running").length);
  const res = {};
  for (const [kind, q] of [["FIELD", ""], ["ORGANIZATION", `&jobOrganizationId=${role.poolOrganizationId}`], ["ROLE", `&jobOrganizationId=${role.poolOrganizationId}&jobRoleId=${role.poolRoleId}`], ["REQUIREMENT", `&jobOrganizationId=${role.poolOrganizationId}&jobRoleId=${role.poolRoleId}&jobRequirementId=${(role.matched[0] ?? role.weakEvidence[0] ?? role.missing[0]).poolRequirementId}`]]) {
    await page.goto(`${BASE}/career/demo?focus=FIELD&analysisId=${anl}&jobPoolUploadId=${up}${q}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page);
    await page.locator(`[data-testid="syntx-field"][data-observation-kind="${kind}"][data-sources-state="AVAILABLE"]`).waitFor({ timeout: 60000 }); await page.waitForTimeout(800);
    res[kind] = { mode: await root(page).getAttribute("data-motion-mode"), running: await running() };
  }
  rec(9, "C9 reduced motion: REDUCED mode, no running animation at FIELD / ORGANIZATION / ROLE / REQUIREMENT", Object.values(res).every(r => r.mode === "REDUCED" && r.running === 0), res);
  await root(page).focus(); await page.keyboard.press("Escape"); await page.waitForTimeout(400);
  rec(9, "C9 reduced motion: navigation still works (Escape REQUIREMENT → ROLE)", (await root(page).getAttribute("data-observation-kind")) === "ROLE");
  await page.close();
}
await browser.close();
