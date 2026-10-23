// N-1 … N-5 · walk on GRÜN's own lab, PRODUCTION server (next start), deterministic loopback STAND-IN (no model execution).
// argv: <state.json> <repo root> <out dir> [W H]. Every in-app Back / Forward is compared with a fresh load of the same URL in a
// second tab (NAV ≡ RELOAD: first-screen state, text, rows, quotes); every request is recorded (method + path) per phase.
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
const page = await ctx.newPage(); const twin = await ctx.newPage(); const t = id => page.getByTestId(id);
let phase = "start"; const requests = [];
for (const [tab, name] of [[page, "nav"], [twin, "reload"]]) tab.on("request", r => { const u = new URL(r.url()); if (u.pathname.startsWith("/api/") || r.resourceType() === "document") requests.push({ phase, tab: name, method: r.method(), type: r.resourceType(), path: u.pathname + u.search }); });
const record = { gemini: "STAND_IN", server: "next start (production build)", note: "STAND-IN · keine Modellausführung: the lab's Gemini is GRÜN's deterministic loopback stand-in", base: BASE, viewport: `${W}x${H}`, steps: [] };
const screenState = tab => tab.evaluate(() => {
  const s = document.querySelector('[data-testid="pxj-first-screen"]');
  const rows = [...document.querySelectorAll('[data-testid^="pxj-first-req-"]')].map(e => ({ id: e.dataset.testid, coverage: e.dataset.coverage, basis: e.dataset.matchBasis, proposal: e.dataset.proposalId }));
  const quotes = [...document.querySelectorAll('[data-testid^="pxj-first-quote-"]')].map(e => ({ id: e.dataset.testid, doc: e.dataset.docId, verified: e.dataset.verified }));
  const root = document.querySelector('[data-testid="semantic-career-intelligence-field"]');
  const offer = document.querySelector('[data-testid="pxj-analysis-job-offer"]');
  return { state: s?.dataset.state ?? null, text: s?.innerText ?? null, rows, quotes, offer: offer ? offer.innerText : null, field: root?.dataset.fieldFocus ?? null, mode: root?.dataset.investigationMode ?? null, url: location.search, historyLength: history.length };
});
const settled = async tab => { await tab.waitForLoadState("networkidle"); await tab.waitForSelector('[data-testid="semantic-career-intelligence-field"]', { timeout: 60000 }); await tab.waitForTimeout(1500); };
const mark = async () => page.evaluate(() => { if (document.getElementById("standin-mark")) return; const d = document.createElement("div"); d.id = "standin-mark"; d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "12px", top: "8px", zIndex: 99999, padding: "3px 10px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 12px monospace", pointerEvents: "none" }); document.body.appendChild(d); });
const waitState = async (states, timeout = 60000) => page.waitForFunction(s => s.includes(document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state), states, { timeout });
const step = async (name, fn, { shot = true } = {}) => { phase = name; const started = Date.now(); try { const extra = (await fn()) ?? {}; await page.waitForTimeout(800); const s = await screenState(page); if (shot) { await mark(); await page.screenshot({ path: `${OUT}/STANDIN-nav-${name}-${W}.jpg`, type: "jpeg", quality: 82 }); } const ok = extra.ok ?? true; record.steps.push({ name, ok, ms: Date.now() - started, ...extra, ...s }); console.log(`${ok ? "PASS" : "FAIL"} ${name} ${s.state ?? "-"} ${s.url}`); } catch (e) { record.steps.push({ name, ok: false, error: String(e).slice(0, 300), ...(await screenState(page).catch(() => ({}))) }); console.log(`FAIL ${name} ${String(e).slice(0, 200)}`); } };
const same = (a, b) => JSON.stringify({ s: a.state, t: a.text, r: a.rows, q: a.quotes, o: a.offer, f: a.field, m: a.mode }) === JSON.stringify({ s: b.state, t: b.text, r: b.rows, q: b.quotes, o: b.offer, f: b.field, m: b.mode });
/** NAV ≡ RELOAD: the entry Back / Forward landed on, against the same URL loaded fresh in the second tab. */
const versusReload = async () => { await settled(page); const nav = await screenState(page); await twin.goto(`${BASE}/career/demo${nav.url}`, { waitUntil: "networkidle" }); await settled(twin); const reload = await screenState(twin); return { ok: same(nav, reload), reloadState: reload.state, reloadUrl: reload.url }; };
const stage = async () => { await t("add-text-source-btn").click(); await t("source-text-input").fill(readFileSync(CV, "utf8")); await t("submit-source-btn").click(); await t("analyze-investigation").waitFor({ timeout: 20000 }); };
const param = name => new URL(page.url()).searchParams.get(name);

// A · a document before the demo (for the crossing of document boundaries), then the PERSON × JOB session.
let analysis = null, runJob = null;
await step("01-other-document", async () => { await page.goto(`${BASE}/career/analyses`, { waitUntil: "networkidle" }); }, { shot: false });
await step("02-session-pxj", async () => {
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="semantic-career-intelligence-field"][data-field-focus="CAPABILITY"]', { timeout: 60000 });
  await stage(); await t("start-intake-analysis-btn").click();
  await page.waitForFunction(() => new URL(location.href).searchParams.get("analysisJobId") !== null, null, { timeout: 60000 }); runJob = param("analysisJobId");
  await t("intake-success-banner").waitFor({ timeout: 240000 }); await waitState(["AVAILABLE"]);
  analysis = param("analysisId");
  return { ok: analysis !== null && param("analysisJobId") === null, jobSeenInUrlWhileRunning: runJob };
});
// B · user decisions: mode, mode back, Job Field, another role as job, Capability Field (ROLE_MISMATCH), the offer's role back.
await step("03-mode-person", async () => { await t("investigation-mode-PERSON").click(); await page.waitForFunction(() => new URL(location.href).searchParams.get("investigationMode") === "PERSON"); });
await step("04-mode-pxj", async () => { await t("investigation-mode-PERSON_X_JOB").click(); await waitState(["AVAILABLE"]); });
await step("05-job-field", async () => { await t("job-pool-panel-toggle").click(); await page.waitForSelector('[data-testid="semantic-career-intelligence-field"][data-field-focus="FIELD"]'); });
await step("06-observe-role", async () => { await t("syntx-organization-org_pink_beta").dispatchEvent("click"); await t(`syntx-role-${OTHER}`).waitFor({ timeout: 20000 }); await t(`syntx-role-${OTHER}`).dispatchEvent("click"); await page.waitForFunction(r => new URL(location.href).searchParams.get("jobRoleId") === r, OTHER); });
await step("07-select-other-job", async () => { await t("syntx-job-scope-select").click(); await page.waitForFunction(r => new URL(location.href).searchParams.get("jobScopeRoleId") === r, OTHER); });
await step("08-capability-mismatch", async () => { await page.waitForTimeout(800); await t("field-focus-capability-btn").click(); await waitState(["ROLE_MISMATCH"]); });
await step("09-offer-role-back", async () => { await t("pxj-first-select-role").click(); await waitState(["AVAILABLE"]); });
const entries = record.steps.slice(-8).map(s => s.historyLength);
/** One entry per decision: the session's entry, then one per push (the organisation and the role are two observations). */
const pushed = record.steps.at(-1).historyLength - record.steps.at(-8).historyLength;
// C · Back through every entry, then Forward through every entry; each compared with a fresh load of its URL.
const backs = [];
for (let i = 1; i <= pushed; i += 1) await step(`10-back-${i}`, async () => { await page.goBack(); const v = await versusReload(); backs.push(v.ok); return v; });
// D · across the document boundary: Back leaves the demo (the other document), Forward loads the demo document again.
await step("11-back-leaves-document", async () => { await page.goBack(); await page.waitForLoadState("networkidle"); return { ok: new URL(page.url()).pathname === "/career/analyses" }; }, { shot: false });
await step("12-forward-document", async () => { await page.goForward(); return versusReload(); });
for (let i = 1; i <= pushed; i += 1) await step(`13-forward-${i}`, async () => { await page.goForward(); return versusReload(); });
// E · N-2: a second run, reloaded while it runs: followed by its job id (GET only), the analysis on view stays the first meanwhile.
let second = null;
await step("14-second-run-reload", async () => {
  await stage(); await t("start-intake-analysis-btn").click();
  await page.waitForFunction(() => new URL(location.href).searchParams.get("analysisJobId") !== null, null, { timeout: 60000 });
  const job = param("analysisJobId"); const postsBefore = requests.filter(r => r.method === "POST").length;
  await page.reload({ waitUntil: "domcontentloaded" });
  const afterReload = await screenState(page).catch(() => null);
  await t("intake-success-banner").waitFor({ timeout: 240000 }).catch(() => undefined);
  await page.waitForFunction(() => new URL(location.href).searchParams.get("analysisJobId") === null, null, { timeout: 240000 });
  second = param("analysisId");
  return { ok: second !== null && second !== analysis && requests.filter(r => r.method === "POST").length === postsBefore, job, urlRightAfterReload: afterReload?.url ?? null, jobReads: requests.filter(r => r.phase === "14-second-run-reload" && r.path.startsWith(`/api/career/jobs/${job}`)).length };
});
await step("15-unknown-job", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}&analysisJobId=JOB_1000000000000_1`, { waitUntil: "networkidle" }); const banner = await t("intake-error-banner").getAttribute("data-job-resume", { timeout: 30000 }); return { ok: banner === "NOT_FOUND" && param("analysisJobId") === "JOB_1000000000000_1", banner }; });
await step("16-malformed-job", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}&analysisJobId=..%2Fx`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500); return { ok: param("analysisJobId") === null && requests.filter(r => r.phase === "16-malformed-job" && r.path.startsWith("/api/career/jobs/")).length === 0 }; }, { shot: false });
// F · N-3: an unknown mode is removed on mount.
await step("17-unknown-mode", async () => { await page.goto(`${BASE}/career/demo?focus=FIELD&investigationMode=BOGUS&jobPoolUploadId=${VAL}`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500); const mode = await screenState(page); return { ok: param("investigationMode") === null && param("focus") === "FIELD" && mode.mode === "PERSON_X_JOB" }; }, { shot: false });
// G · N-5: staged sources say they are not kept; a reload drops them.
await step("18-staged-hint", async () => { await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON`, { waitUntil: "networkidle" }); await settled(page); await stage(); const hint = await t("staged-sources-not-kept").innerText(); return { ok: hint.length > 0, hint }; });
await step("19-staged-after-reload", async () => { await page.reload({ waitUntil: "networkidle" }); await settled(page); return { ok: (await t("staged-sources-not-kept").count()) === 0 }; }, { shot: false });

const navPhases = record.steps.filter(s => /^1[0-3]-/.test(s.name)).map(s => s.name);
record.analyses = { first: analysis, second, runJob };
record.checks = {
  historyLengthsSessionThroughDecisions: entries,
  entriesPushedByDecisions: pushed,
  navEqualsReload: record.steps.filter(s => /^(10-back|12-forward|13-forward)/.test(s.name)).map(s => ({ step: s.name, ok: s.ok, state: s.state, reloadState: s.reloadState })),
  navNonGet: requests.filter(r => navPhases.includes(r.phase) && r.tab === "nav" && r.method !== "GET"),
  navAnalyze: requests.filter(r => navPhases.includes(r.phase) && /\/api\/career\/analyze/.test(r.path)),
  navDocumentLoads: requests.filter(r => navPhases.includes(r.phase) && r.tab === "nav" && r.type === "document").map(r => `${r.phase} ${r.path.split("?")[0]}`),
  posts: requests.filter(r => r.method !== "GET").map(r => `${r.phase} ${r.method} ${r.path.split("?")[0]}`),
  geminiInspector: requests.filter(r => /gemini-result|gemini-exchanges/.test(r.path)).length
};
record.requests = requests;
writeFileSync(`${OUT}/STANDIN-nav-walk-${W}.json`, JSON.stringify(record, null, 1));
console.log(JSON.stringify({ pass: record.steps.filter(s => s.ok).length, of: record.steps.length, ...record.checks, navEqualsReload: record.checks.navEqualsReload.every(c => c.ok) }));
await browser.close();
