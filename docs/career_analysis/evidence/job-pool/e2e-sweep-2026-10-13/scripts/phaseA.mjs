/* Phase A (REAL): PDF → real Gemini analysis through the production worker → Capability Field; persistence; the three DLL pools through
 * the real intake upload in the browser (plus a duplicate upload). Writes $DIR/state-A.json with the ids. */
import { readFileSync, writeFileSync } from "node:fs";
import { chromium, BASE, DIR, rec, closeOnboarding, shot, getJson } from "./common.mjs";
const PDFS = [{ key: "ENG", path: "/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/cv.synthetic.pdf" }, { key: "AI", path: `${DIR}/cv-ai-data.synthetic.pdf` }];
const POOLS = ["DLL_JOBPOOL_ENGINEERING", "DLL_JOBPOOL_AI_DATA", "DLL_JOBPOOL_ENTERPRISE_SCALE"];
const EXPECTED_IDS = { DLL_JOBPOOL_ENGINEERING: "JPOOL_B94850C439974E27496FE3B1A9A076B5", DLL_JOBPOOL_AI_DATA: "JPOOL_0DCDB34AE9F8FF8A3D335BA26C9F16C2", DLL_JOBPOOL_ENTERPRISE_SCALE: "JPOOL_D39ADA99F34A60B982ADE5F929276294" };
const state = { analyses: {}, uploads: {} };
const browser = await chromium.launch({ headless: true });
const bubbles = (page) => page.evaluate(() => [...document.querySelectorAll('[data-testid^="orbital-bubble-body-"]')].map(e => `${e.getAttribute("data-testid").replace("orbital-bubble-body-", "")}: ${(e.parentElement?.innerText ?? "").replace(/\s+/g, " ").trim().slice(0, 80)}`));
for (const [i, pdf] of PDFS.entries()) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  const errors = []; page.on("pageerror", e => errors.push(String(e)));
  await page.goto(`${BASE}/career/demo`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await closeOnboarding(page);
  await page.getByTestId("add-pdf-source-btn").click();
  await page.getByTestId("source-dock-file-input").setInputFiles(pdf.path);
  await page.locator('[data-testid="start-intake-analysis-btn"]:not([disabled])').waitFor({ timeout: 30000 });
  const t0 = Date.now();
  await page.getByTestId("start-intake-analysis-btn").click();
  let ok = true;
  try { await page.getByTestId("intake-success-banner").waitFor({ timeout: 600000 }); } catch (e) { ok = false; }
  const seconds = Math.round((Date.now() - t0) / 1000);
  await shot(page, `A1-${pdf.key}-capability-after-analysis`);
  rec(1, `A1.${pdf.key} PDF upload + real Gemini analysis completes (intake-success-banner)`, ok, `${pdf.path.split("/").pop()} in ${seconds}s`);
  if (!ok) { const body = await page.locator("body").innerText(); rec(1, `A1.${pdf.key} failure surface`, "INFO", body.slice(0, 600)); await page.close(); continue; }
  const b = await bubbles(page);
  rec(2, `A2.${pdf.key} Capability Field shows the analysis (orbital bubbles with items)`, b.some(t => /[1-9]\d* items?/i.test(t)), b);
  await page.getByTestId("job-pool-panel-toggle").click();
  const field = page.getByTestId("syntx-field");
  await page.locator('[data-testid="syntx-field"][data-analysis-source="JOB_RESULT"]').waitFor({ timeout: 30000 });
  const analysisId = await field.getAttribute("data-analysis-id");
  state.analyses[pdf.key] = { analysisId, seconds };
  rec(2, `A2.${pdf.key} Job Field takes the session's analysis as source`, /^ANL_/.test(analysisId ?? ""), analysisId);
  const api = await getJson(`/api/career/analyses/${analysisId}`);
  const text = JSON.stringify(api.body ?? {});
  const kinds = {}; for (const m of text.matchAll(/"entity_kind":"([A-Z_]+)"/g)) kinds[m[1]] = (kinds[m[1]] ?? 0) + 1;
  state.analyses[pdf.key].entityKinds = kinds;
  rec(2, `A2.${pdf.key} analysis persisted (GET /api/career/analyses/{id})`, api.status === 200, { status: api.status, entityKinds: kinds, bytes: text.length });
  // Pools through the real intake (first session uploads all three; second session re-uploads AI_DATA → identical)
  await page.getByTestId("job-pool-intake-toggle").click();
  await page.getByTestId("job-pool-upload").waitFor({ state: "visible", timeout: 10000 });
  const toUpload = i === 0 ? POOLS : ["DLL_JOBPOOL_AI_DATA"];
  for (const pool of toUpload) {
    await page.getByTestId("job-pool-file-input").setInputFiles(`/home/codi/Entwicklung/condyn-admin-e2e/docs/examples/job-pool-tests/${pool}.json`);
    await page.getByTestId("job-pool-actor-input").fill("GRUEN_E2E_SWEEP");
    await page.locator('[data-testid="job-pool-upload-btn"]:not([disabled])').waitFor({ timeout: 10000 });
    const u0 = Date.now();
    await page.getByTestId("job-pool-upload-btn").click();
    const result = page.locator('[data-testid="job-pool-upload-result"]');
    await page.waitForFunction(() => { const r = document.querySelector('[data-testid="job-pool-upload-result"]'); return r && r.getAttribute("data-upload-outcome"); }, null, { timeout: 120000 }).catch(() => {});
    const outcome = await result.getAttribute("data-upload-outcome").catch(() => null);
    const uploadId = await result.getAttribute("data-upload-id").catch(() => null);
    const resultText = (await result.innerText().catch(() => "")).replace(/\s+/g, " ");
    const expectOutcome = i === 0 ? "CREATED" : "IDENTICAL";
    rec(3, `A3.${pool} intake upload (${i === 0 ? "new" : "duplicate"})`, outcome !== null && uploadId === EXPECTED_IDS[pool] && (outcome === expectOutcome || (i === 0 && outcome === "IDENTICAL")), { outcome, uploadId, expected: EXPECTED_IDS[pool], ms: Date.now() - u0, text: resultText.slice(0, 160) });
    if (i === 0) state.uploads[pool] = uploadId;
    const pool200 = await getJson(`/api/career/job-pools/${uploadId}`);
    const mapping = JSON.stringify(pool200.body ?? {}).match(/"mappingState":"([A-Z_]+)"/)?.[1] ?? null;
    rec(3, `A3.${pool} persisted pool readable, canonical mapping`, pool200.status === 200 && mapping === "MAPPED", { status: pool200.status, mappingState: mapping });
    await page.waitForTimeout(800);
  }
  await shot(page, `A3-${pdf.key}-after-uploads`);
  rec(3, `A3.${pdf.key} uploaded != selected (field stays without pool until SELECT)`, (await field.getAttribute("data-field-state")) === "NO_POOL", await field.getAttribute("data-field-state"));
  rec(9, `A.${pdf.key} page errors during the real flow`, errors.length === 0, errors.join(" | ").slice(0, 400));
  // Refresh persistence: reload with analysisId only (Capability Field) and with analysisId + upload (Job Field)
  await page.goto(`${BASE}/career/demo?analysisId=${analysisId}`, { waitUntil: "domcontentloaded" }); await closeOnboarding(page); await page.waitForTimeout(4000);
  const afterReload = await bubbles(page);
  await shot(page, `A2-${pdf.key}-capability-after-reload`);
  rec(2, `A2.${pdf.key} Capability Field after refresh (?analysisId) shows the persisted analysis`, afterReload.some(t => /[1-9]\d* items?/i.test(t)), afterReload);
  await page.close();
}
writeFileSync(`${DIR}/state-A.json`, JSON.stringify(state, null, 2));
await browser.close();
