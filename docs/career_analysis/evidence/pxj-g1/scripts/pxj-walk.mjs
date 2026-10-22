// G1 · walk 1c on GRÜN's own lab with the deterministic loopback STAND-IN (no model execution). argv: <state.json> <repo root> <out dir> [W H]
// Records every request (method + path), the first screen's state per step, and STANDIN-marked shots.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ROOT, OUT, W = "1920", H = "1080"] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base; const VAL = S.validationUploadId;
const ROLE = "role_pink_alpha_architect", OTHER = "role_pink_beta_platform";
const CV = `${ROOT}/test/gold/case_001_minimal_valid/input/doc1.md`;
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: +W, height: +H } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage(); const t = id => page.getByTestId(id);
let phase = "start"; const requests = [];
page.on("request", r => { const u = new URL(r.url()); if (u.pathname.startsWith("/api/")) requests.push({ phase, method: r.method(), path: u.pathname + u.search }); });
const record = { gemini: "STAND_IN", note: "STAND-IN · keine Modellausführung: the lab's Gemini is GRÜN's deterministic loopback stand-in", base: BASE, viewport: `${W}x${H}`, steps: [] };
const screenState = async () => page.evaluate(() => {
  const s = document.querySelector('[data-testid="pxj-first-screen"]');
  const rows = [...document.querySelectorAll('[data-testid^="pxj-first-req-"]')].map(e => ({ id: e.dataset.testid, coverage: e.dataset.coverage, basis: e.dataset.matchBasis, proposal: e.dataset.proposalId }));
  const quotes = [...document.querySelectorAll('[data-testid^="pxj-first-quote-"]')].map(e => ({ id: e.dataset.testid, doc: e.dataset.docId, inProjection: e.dataset.quoteInProjection, resolved: e.dataset.sourceResolved, verified: e.dataset.verified }));
  const root = document.querySelector('[data-testid="semantic-career-intelligence-field"]');
  const stages = [...document.querySelectorAll('[data-testid^="focus-transition-stage-shell-"]')].map(e => e.dataset.testid.slice(-2));
  return { state: s?.dataset.state ?? null, text: s?.innerText ?? null, rows, quotes, stages, field: root?.dataset.fieldFocus, mode: root?.dataset.investigationMode, coupling: !!document.querySelector('[data-testid="inter-orbital-coupling"]'), viewMatches: document.querySelectorAll('[data-testid="hud-action-view-matches"]').length, url: location.search };
});
const mark = async () => page.evaluate(() => { if (document.getElementById("standin-mark")) return; const d = document.createElement("div"); d.id = "standin-mark"; d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "12px", top: "8px", zIndex: 99999, padding: "3px 10px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 12px monospace", pointerEvents: "none" }); document.body.appendChild(d); });
const waitState = async (states, timeout = 60000) => page.waitForFunction(s => s.includes(document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state), states, { timeout });
const step = async (name, fn) => { phase = name; const started = Date.now(); try { await fn(); await page.waitForTimeout(1200); const s = await screenState(); await mark(); await page.screenshot({ path: `${OUT}/STANDIN-${name}-${W}.jpg`, type: "jpeg", quality: 82 }); record.steps.push({ name, ok: true, ms: Date.now() - started, ...s }); console.log(`PASS ${name} ${s.state ?? "-"}`); } catch (e) { record.steps.push({ name, ok: false, error: String(e).slice(0, 300), ...(await screenState().catch(() => ({}))) }); console.log(`FAIL ${name} ${String(e).slice(0, 200)}`); } };
// The source as text (ENTER TEXT): a .md file through the file input is sent as a PDF and fails to parse (pre-existing, SourceDock).
const analyze = async () => { await t("add-text-source-btn").click(); await t("source-text-input").fill(readFileSync(CV, "utf8")); await t("submit-source-btn").click(); await t("analyze-investigation").waitFor({ timeout: 20000 }); await t("start-intake-analysis-btn").click(); await t("intake-success-banner").waitFor({ timeout: 240000 }); };

let pxjAnalysis = null, personAnalysis = null;
await step("01-session-pxj", async () => {
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]', { timeout: 60000 });
  await analyze(); await waitState(["AVAILABLE", "NO_PROJECTION", "LINEAGE_MISMATCH", "COVERAGE_FAILED", "COVERAGE_NOT_FOUND"]);
  pxjAnalysis = new URL(page.url()).searchParams.get("analysisId");
});
const session = record.steps.at(-1);
await step("02-focus-no-selection", async () => {
  const before = page.url();
  const proposal = page.locator('[data-testid^="pxj-first-proposal-"]').first(); await proposal.hover(); await proposal.focus(); await page.locator('[data-testid^="pxj-first-req-"]').first().hover();
  await page.waitForTimeout(400);
  if (page.url() !== before) throw new Error(`URL changed by focus: ${before} → ${page.url()}`);
});
await step("03-role-switch-in-session", async () => {
  await t("job-pool-panel-toggle").click(); await page.waitForSelector('[data-testid="semantic-career-intelligence-field"][data-field-focus="FIELD"]');
  await t("syntx-organization-org_pink_beta").dispatchEvent("click"); await t(`syntx-role-${OTHER}`).waitFor({ timeout: 20000 }); await t(`syntx-role-${OTHER}`).dispatchEvent("click");
  await t("syntx-job-scope-select").click(); await page.waitForFunction(r => new URL(location.href).searchParams.get("jobScopeRoleId") === r, OTHER);
  await page.waitForTimeout(800); await t("field-focus-capability-btn").click(); await waitState(["ROLE_MISMATCH"]);
});
await step("04-role-back-explicit", async () => { await t("pxj-first-select-role").click(); await waitState(["AVAILABLE"]); });
await step("05-reload", async () => { await page.reload({ waitUntil: "networkidle" }); await waitState(["AVAILABLE"]); });
const reload = record.steps.at(-1);
await step("05b-reload-de", async () => { await t("open-system-codex-btn").click(); await t("switch-lang-de").click(); await t("system-codex-close").click(); await waitState(["AVAILABLE"]); await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.textContent?.includes("ANFORDERUNGSABDECKUNG")); });
await step("06-reload-other-role", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&analysisId=${pxjAnalysis}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${OTHER}`, { waitUntil: "networkidle" }); await waitState(["ROLE_MISMATCH"]); });
await step("07-pxj-analysis-under-person", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON&analysisId=${pxjAnalysis}`, { waitUntil: "networkidle" }); await waitState(["MODE_MISMATCH"]); });
await step("08-session-person", async () => {
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON`, { waitUntil: "networkidle" }); await page.waitForSelector('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]', { timeout: 60000 });
  await analyze(); await page.waitForFunction(() => new URL(location.href).searchParams.get("analysisId") !== null); personAnalysis = new URL(page.url()).searchParams.get("analysisId");
});
await step("09-person-deep-link-default-mode", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&analysisId=${personAnalysis}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" }); await waitState(["MODE_MISMATCH"]); });
await step("10-unknown-analysis", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&analysisId=ANL_0000000000000_0&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" }); await waitState(["RESULT_NOT_FOUND"]); });
await step("11-job-field-no-job", async () => { await page.goto(`${BASE}/career/demo?focus=FIELD&investigationMode=PERSON_X_JOB&analysisId=${pxjAnalysis}&jobPoolUploadId=${VAL}`, { waitUntil: "networkidle" }); await t("pxj-analysis-job-offer").waitFor({ timeout: 30000 }); });

record.analyses = { pxj: pxjAnalysis, person: personAnalysis };
const same = (a, b) => JSON.stringify({ s: a?.state, t: a?.text, r: a?.rows, q: a?.quotes }) === JSON.stringify({ s: b?.state, t: b?.text, r: b?.rows, q: b?.quotes });
record.checks = {
  sessionEqualsReload: same(session, reload),
  urlAfterSession: session?.url ?? null,
  nonGet: requests.filter(r => r.method !== "GET" && !/^\/api\/career\/(analyze|job-pools)$/.test(r.path.split("?")[0])),
  postsOnlyAnalyze: requests.filter(r => r.method !== "GET").map(r => `${r.phase} ${r.method} ${r.path.split("?")[0]}`),
  geminiInspector: requests.filter(r => /gemini-result|gemini-exchanges/.test(r.path)),
  matchesReads: requests.filter(r => /\/matches/.test(r.path)).map(r => `${r.phase} ${r.path}`),
  matchesOnCapabilityField: requests.filter(r => /\/matches/.test(r.path) && r.phase !== "11-job-field-no-job" && r.phase !== "03-role-switch-in-session").map(r => `${r.phase} ${r.path}`),
  b2Reads: requests.filter(r => /job-comparison/.test(r.path)).map(r => `${r.phase} ${r.path}`)
};
record.requests = requests;
writeFileSync(`${OUT}/STANDIN-walk-${W}.json`, JSON.stringify(record, null, 1));
console.log(JSON.stringify({ sessionEqualsReload: record.checks.sessionEqualsReload, posts: record.checks.postsOnlyAnalyze, matches: record.checks.matchesReads, matchesOnCapabilityField: record.checks.matchesOnCapabilityField.length, gemini: record.checks.geminiInspector.length }));
await browser.close();
