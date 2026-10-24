// UX/UI closure walk on GRÜN's own lab, PRODUCTION server (next start), deterministic loopback STAND-IN (no model execution).
// argv: <state.json> <repo root> <out dir>. Every request is recorded (method + path) per step.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ROOT, OUT] = process.argv.slice(2);
mkdirSync(`${OUT}/shots`, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base; const VAL = S.validationUploadId;
const ORG = "org_pink_alpha", ROLE = "role_pink_alpha_architect";
const CV = `${ROOT}/test/gold/case_001_minimal_valid/input/doc1.md`;
const browser = await chromium.launch();
const record = { gemini: "STAND_IN", server: "next start (production build, no ignoreBuildErrors)", note: "STAND-IN · keine Modellausführung", base: BASE, steps: [] };
let phase = "start"; const requests = [];
async function context(w = 1920, h = 1080, dsf = 1) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  page.on("request", r => { const u = new URL(r.url()); if (u.pathname.startsWith("/api/")) requests.push({ phase, method: r.method(), path: u.pathname + u.search }); });
  return { ctx, page, t: id => page.getByTestId(id) };
}
const mark = async page => page.evaluate(() => { if (document.getElementById("standin-mark")) return; const d = document.createElement("div"); d.id = "standin-mark"; d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "8px", bottom: "6px", zIndex: 99999, padding: "2px 8px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 11px monospace", pointerEvents: "none" }); document.body.appendChild(d); });
const shot = async (page, name) => { await mark(page); await page.screenshot({ path: `${OUT}/shots/STANDIN-ux-${name}.jpg`, type: "jpeg", quality: 80 }); };
const param = (page, name) => new URL(page.url()).searchParams.get(name);
const state = page => page.evaluate(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state ?? null);
const posts = name => requests.filter(r => r.phase === name && r.method !== "GET");
async function step(name, fn) {
  phase = name; const started = Date.now();
  try { const extra = (await fn()) ?? {}; const ok = extra.ok ?? true; record.steps.push({ name, ok, ms: Date.now() - started, ...extra, nonGet: posts(name).length }); console.log(`${ok ? "PASS" : "FAIL"} ${name} ${JSON.stringify(extra).slice(0, 240)}`); }
  catch (e) { record.steps.push({ name, ok: false, error: String(e).slice(0, 400) }); console.log(`FAIL ${name} ${String(e).slice(0, 240)}`); }
}
const fieldReady = page => page.waitForSelector('[data-testid="semantic-career-intelligence-field"]', { timeout: 60000 });

// 0 · an existing PERSON × JOB analysis of the role (made here by ANALYZE, stand-in) — the walk below reaches it without upload.
let existing = null;
await step("00-existing-analysis-by-analyze", async () => {
  const { ctx, page, t } = await context();
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" });
  await t("add-text-source-btn").click(); await t("source-text-input").fill(readFileSync(CV, "utf8")); await t("submit-source-btn").click();
  await t("start-intake-analysis-btn").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state === "AVAILABLE", null, { timeout: 240000 });
  existing = param(page, "analysisId"); await ctx.close();
  return { ok: existing !== null, existing, posts: posts("00-existing-analysis-by-analyze").map(r => r.path) };
});

// A · UX-06 / UX-01 / UX-02 / UX-07 / D-PICK: from the bare start to the existing investigation — no upload, no analysis, GET only.
await step("A1-start-pools-first", async () => {
  const w = await context(); globalThis.A = w; const { page, t } = w;
  await page.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" }); await fieldReady(page); await page.waitForTimeout(1200);
  const list = await t("job-pool-list").isVisible(); const intakeHidden = await t("job-pool-upload").isHidden();
  const giant = await t("syntx-no-pool").innerText(); await shot(page, "A1-start-1920");
  return { ok: list && intakeHidden && /Open an uploaded pool in POOLS/.test(giant) && giant.indexOf("Open an uploaded pool") < giant.indexOf("upload one"), list, intakeHidden, giant: giant.replace(/\s+/g, " ") };
});
await step("A2-open-pool-org-role", async () => {
  const { page, t } = globalThis.A;
  await t(`job-pool-select-${VAL}`).click(); await page.waitForFunction(v => new URL(location.href).searchParams.get("jobPoolUploadId") === v, VAL);
  const poolLevel = await t("syntx-level").innerText(); const hint = await t("syntx-job-scope-hint").innerText();
  await t(`syntx-organization-${ORG}`).dispatchEvent("click"); await page.waitForTimeout(900);
  const orgLevel = await t("syntx-level").innerText();
  await t(`syntx-role-${ROLE}`).dispatchEvent("click"); await page.waitForFunction(r => new URL(location.href).searchParams.get("jobRoleId") === r, ROLE); await page.waitForTimeout(900);
  const roleLevel = await t("syntx-level").innerText(); const opened = await t("syntx-opened-role").innerText(); await shot(page, "A2-role-1920");
  return { ok: poolLevel === "LEVEL · POOL" && orgLevel === "LEVEL · ORGANIZATION" && roleLevel === "LEVEL · ROLE" && /Open a role to select it as the job/.test(hint) && /not the selected job/.test(opened), poolLevel, orgLevel, roleLevel, hint, opened };
});
await step("A3-tab-order-to-select", async () => {
  const { page } = globalThis.A;
  await page.evaluate(() => document.querySelector('[data-testid="syntx-field"]')?.focus());
  const order = []; for (let i = 0; i < 40; i += 1) { await page.keyboard.press("Tab"); const id = await page.evaluate(() => document.activeElement?.getAttribute("data-testid")); order.push(id); if (id === "syntx-job-scope-select") break; }
  // Recorded only: the bound against 70d1cb4 is PINK's pink-v11-order probe on both labs (round-2 measures, V-11-R).
  return { ok: order.at(-1) === "syntx-job-scope-select", presses: order.length, order };
});
await step("A4-select-as-job", async () => {
  const { page, t } = globalThis.A;
  await t("syntx-job-scope-select").click(); await page.waitForFunction(r => new URL(location.href).searchParams.get("jobScopeRoleId") === r, ROLE);
  await page.waitForTimeout(800); const opened = await t("syntx-opened-role").innerText(); const indicator = await t("job-scope-indicator").innerText();
  return { ok: /the selected job/.test(opened) && /^SELECTED JOB/.test(indicator.trim()), opened, indicator: indicator.replace(/\s+/g, " ") };
});
await step("A5-dpick-from-role-view", async () => {
  const { page, t } = globalThis.A;
  const before = page.url(); const length = await page.evaluate(() => history.length);
  const readsBefore = requests.filter(r => r.path === "/api/career/analyses").length;
  await t("analysis-picker-toggle").click(); await page.waitForSelector(`[data-testid="analysis-pick-${existing}"]`, { timeout: 30000 });
  const listReads = requests.filter(r => r.path === "/api/career/analyses").length - readsBefore;
  const offered = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="analysis-pick-item-"]')].map(e => ({ id: e.dataset.analysisId, upload: e.dataset.bindingUpload, role: e.dataset.bindingRole })));
  const chosenByOpening = param(page, "analysisId"); await shot(page, "A5-picker-open-1920");
  await t(`analysis-pick-${existing}`).click();
  await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state === "AVAILABLE", null, { timeout: 60000 });
  const after = { analysisId: param(page, "analysisId"), focus: param(page, "focus"), length: await page.evaluate(() => history.length) };
  await shot(page, "A5-picked-available-1920");
  await page.goBack(); await page.waitForTimeout(1500);
  const back = { url: page.url(), analysisId: param(page, "analysisId"), roleView: await t("syntx-job-scope-select").isVisible().catch(() => false) };
  const nonGetInA = requests.filter(r => r.phase.startsWith("A") && r.method !== "GET").length;
  return { ok: listReads === 1 && chosenByOpening === null && offered.length >= 1 && offered.every(o => o.upload === VAL && o.role === ROLE) && after.analysisId === existing && after.focus === "CAPABILITY" && after.length === length + 1 && back.url === before && back.analysisId === null && nonGetInA === 0, offered, after, back: { analysisId: back.analysisId, sameUrl: back.url === before }, nonGetInA };
});
await globalThis.A.ctx.close();

// B · O-NAV-SUBMIT: Back right after ANALYZE. (a) The POST held 1.5 s by the browser (network latency): the 202 arrives after the
// remount — the job is handed over, named in the entry on view and followed by GET; one POST. (b) Without latency the 202 may
// arrive before the Back: the job is then named in the entry ANALYZE was pressed on (Forward shows it). Never unnamed.
for (const [variant, latency] of [["a-latency", 1500], ["b-no-latency", 0]]) {
  await step(`B1-back-during-submit-${variant}`, async () => {
    const { ctx, page, t } = await context();
    if (latency > 0) await page.route("**/api/career/analyze", async route => { await new Promise(resolve => setTimeout(resolve, latency)); await route.continue(); });
    await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" });
    await t("investigation-mode-PERSON").click(); await page.waitForTimeout(400); await t("investigation-mode-PERSON_X_JOB").click(); await page.waitForTimeout(600);
    await t("add-text-source-btn").click(); await t("source-text-input").fill(readFileSync(CV, "utf8")); await t("submit-source-btn").click();
    await t("start-intake-analysis-btn").click(); await page.waitForTimeout(150); await page.goBack();
    const named = () => page.waitForFunction(() => { const q = new URL(location.href).searchParams; return q.get("analysisJobId") !== null || q.get("analysisId") !== null; }, null, { timeout: 8000 }).then(() => true, () => false);
    let where = "entry-on-view", hasName = await named();
    if (!hasName) { await page.goForward(); where = "entry-of-analyze"; hasName = await named(); }
    const job = param(page, "analysisJobId");
    await page.waitForFunction(() => new URL(location.href).searchParams.get("analysisId") !== null && new URL(location.href).searchParams.get("analysisJobId") === null, null, { timeout: 240000 }).catch(() => undefined);
    const analysis = param(page, "analysisId"); const p = posts(`B1-back-during-submit-${variant}`);
    const jobReads = requests.filter(r => r.phase === `B1-back-during-submit-${variant}` && r.path.startsWith("/api/career/jobs/")).length;
    await shot(page, `B1-${variant}-1920`); await ctx.close();
    return { ok: hasName && analysis !== null && p.length === 1 && p[0].path === "/api/career/analyze" && (latency === 0 || where === "entry-on-view"), where, job, analysis, posts: p.map(r => `${r.method} ${r.path}`), jobReads };
  });
}

// C · V-06: a followed job not found — CLOSE (one push, no POST), Back names it again.
await step("C1-job-banner-close", async () => {
  const { ctx, page, t } = await context();
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}&analysisJobId=JOB_1000000000000_1`, { waitUntil: "networkidle" });
  await t("intake-error-banner").waitFor({ timeout: 30000 }); const resume = await t("intake-error-banner").getAttribute("data-job-resume");
  const retry = await t("retry-intake-btn").count(); await shot(page, "C1-job-not-found-1920");
  const length = await page.evaluate(() => history.length);
  await t("intake-error-dismiss").click(); await page.waitForTimeout(600);
  const gone = (await t("intake-error-banner").count()) === 0; const afterParam = param(page, "analysisJobId"); const afterLength = await page.evaluate(() => history.length);
  await page.goBack(); await page.waitForTimeout(1500); const backParam = param(page, "analysisJobId");
  await ctx.close();
  return { ok: resume === "NOT_FOUND" && retry === 0 && gone && afterParam === null && afterLength === length + 1 && backParam === "JOB_1000000000000_1" && posts("C1-job-banner-close").length === 0, resume, retry, gone, afterParam, backParam };
});

// D · F-G1-MD: .md staged as text, .docx refused.
await step("D1-md-as-text-docx-refused", async () => {
  const { ctx, page, t } = await context();
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON`, { waitUntil: "networkidle" }); await fieldReady(page);
  await t("source-dock-file-input").setInputFiles({ name: "pink-ux-note.md", mimeType: "text/markdown", buffer: Buffer.from("# Note\nDistributed systems.") });
  await page.waitForTimeout(500); const staged = await page.evaluate(() => document.querySelector('[data-testid="source-dock"]')?.innerText ?? "");
  await t("source-dock-file-input").setInputFiles({ name: "cv.docx", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", buffer: Buffer.from("PK") });
  await page.waitForTimeout(500); const refused = await t("source-dock-file-refused").innerText().catch(() => null); await shot(page, "D1-md-and-docx-1920");
  await ctx.close();
  return { ok: /pink-ux-note\.md/.test(staged) && !/PDF pink-ux-note/.test(staged) && /Not added: cv\.docx/.test(refused ?? "") && posts("D1-md-as-text-docx-refused").length === 0, refused, stagedHasMd: /pink-ux-note\.md/.test(staged), stagedAsPdf: /PDF pink-ux-note/.test(staged) };
});

// R2 · V-08-R: a broken PDF through the real worker — the banner offers no RETRY; R-05: the tooltip of an invalid job.
await step("R2-V08-broken-pdf-no-retry", async () => {
  const { ctx, page, t } = await context();
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON`, { waitUntil: "networkidle" }); await fieldReady(page);
  await t("source-dock-file-input").setInputFiles({ name: "broken-cv.pdf", mimeType: "application/pdf", buffer: Buffer.from("%PDF-1.4 this is not a readable pdf") });
  await page.waitForTimeout(500); await t("start-intake-analysis-btn").click();
  await t("intake-error-banner").waitFor({ timeout: 300000 });
  const code = await t("intake-error-banner").getAttribute("data-error-code"); const banner = (await t("intake-error-banner").innerText()).replace(/\s+/g, " ");
  const retry = await t("retry-intake-btn").count(); const format = await t("intake-error-format").count();
  await shot(page, "R2-V08-broken-pdf-1920"); await ctx.close();
  return { ok: retry === 0 && format === 1 && /ERR_PDF_PARSE_FAILURE/.test(banner), code, retry, format, posts: posts("R2-V08-broken-pdf-no-retry").map(r => `${r.method} ${r.path}`) };
});
await step("R2-R05-invalid-job-tooltip", async () => {
  const { ctx, page, t } = await context();
  await page.goto(`${BASE}/career/demo?investigationMode=PERSON_X_JOB&jobScopePoolUploadId=${VAL}&jobScopeRoleId=role_not_in_this_pool`, { waitUntil: "networkidle" }); await fieldReady(page);
  await page.waitForSelector('[data-testid="capability-gate-reason"][data-gate="INVALID"]', { timeout: 30000 });
  const title = await t("field-focus-capability-btn").getAttribute("title"); const cause = await t("capability-gate-cause").innerText(); const way = await t("capability-gate-way").innerText();
  const exitTitle = await t("syntx-exit-btn").getAttribute("title").catch(() => null);
  await ctx.close();
  return { ok: title === `${cause}. ${way}` && !/Select a job in the Job Field first/.test(title ?? ""), title, exitTitle };
});

// E · UX-04 gate reason and V-12 keyboard (arrow moves focus only).
await step("E1-gate-reason-and-mode-keys", async () => {
  const { ctx, page, t } = await context();
  await page.goto(`${BASE}/career/demo?investigationMode=PERSON_X_JOB`, { waitUntil: "networkidle" }); await fieldReady(page); await page.waitForTimeout(800);
  const gate = await t("capability-gate-reason").innerText(); const describedBy = await t("field-focus-capability-btn").getAttribute("aria-describedby");
  await shot(page, "E1-gate-reason-1920");
  const url = page.url(), length = await page.evaluate(() => history.length);
  await t("investigation-mode-PERSON_X_JOB").focus(); await page.keyboard.press("ArrowRight"); await page.keyboard.press("ArrowLeft"); await page.keyboard.press("End");
  const focused = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
  const unchanged = page.url() === url && (await page.evaluate(() => history.length)) === length;
  await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  const chosen = param(page, "investigationMode"); await ctx.close();
  return { ok: /needs a valid role selected as the job/.test(gate) && describedBy === "capability-gate-reason" && focused === "investigation-mode-JOB" && unchanged && chosen === "JOB", gate: gate.replace(/\s+/g, " "), focused, unchanged, chosen };
});

// F · viewports: B2 and the no-analysis first screen at the five acceptance viewports (+200 % of 1280×720), real click on ENTER TEXT.
const VPS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
for (const [name, w, h, dsf] of VPS) {
  await step(`F-${name}`, async () => {
    const { ctx, page, t } = await context(w, h, dsf);
    await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}&analysisId=${existing}`, { waitUntil: "networkidle" });
    await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state === "AVAILABLE", null, { timeout: 60000 }); await page.waitForTimeout(1500);
    const m = await page.evaluate(() => { const vh = innerHeight, vw = innerWidth; const r = sel => document.querySelector(sel)?.getBoundingClientRect(); const inView = x => x && x.top >= 0 && x.bottom <= vh && x.left >= 0 && x.right <= vw; return { head: inView(r('[data-testid="pxj-first-screen"] > span')), binding: inView(r('[data-pxj-section="binding"]')), counts: inView(r('[data-testid="pxj-first-counts"]')), countsY: Math.round(r('[data-testid="pxj-first-counts"]')?.top ?? -1), hScroll: document.scrollingElement.scrollWidth > vw }; });
    await shot(page, `F-b2-${name}`);
    // the rows by the wheel, as a user scrolls (panel in fit, page in stack)
    const rows = await page.locator('[data-testid^="pxj-first-req-"]').count(); let reached = 0;
    for (let i = 0; i < rows; i += 1) { const row = page.locator('[data-testid^="pxj-first-req-"]').nth(i); for (let k = 0; k < 30; k += 1) { const box = await row.boundingBox(); if (box && box.y >= 0 && box.y + box.height / 2 <= h) break; const panel = await page.locator('[data-pxj-panel]').boundingBox(); await page.mouse.move(Math.min(w - 5, (panel?.x ?? w / 2) + 40), Math.min(h - 5, Math.max(5, (panel?.y ?? 0) + 60))); await page.mouse.wheel(0, 160); await page.waitForTimeout(120); } const box = await row.boundingBox(); if (box) { const hit = await page.evaluate(([x, y, id]) => { const el = document.elementFromPoint(x, y); return !!el && !!el.closest(`[data-testid="${id}"]`); }, [box.x + box.width / 2, Math.min(h - 2, box.y + Math.min(box.height / 2, 20)), await row.getAttribute("data-testid")]); if (hit) reached += 1; } }
    // the no-analysis screen: ENTER TEXT clicked for real
    await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`, { waitUntil: "networkidle" }); await page.waitForTimeout(1200);
    await shot(page, `F-no-analysis-${name}`);
    let enterText = false; try { await t("add-text-source-btn").click({ timeout: 5000 }); enterText = await t("source-text-input").isVisible(); } catch {}
    await ctx.close();
    const ok = m.head && m.binding && (m.counts || name === "zoom200-1280x720") && !m.hScroll && reached === rows && enterText;
    return { ok, ...m, rows, reached, enterText };
  });
}

// G · PERSON, visual only (GELB): the first screen under PERSON at 1920 × 1080 and 1280 × 720.
for (const [name, w, h] of [["1920x1080", 1920, 1080], ["1280x720", 1280, 720]]) await step(`G-person-${name}`, async () => { const { ctx, page } = await context(w, h); await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500); await shot(page, `G-person-${name}`); await ctx.close(); });

record.summary = { steps: record.steps.length, pass: record.steps.filter(s => s.ok).length, nonGetOutsideAnalyze: requests.filter(r => r.method !== "GET" && !["00-existing-analysis-by-analyze", "B1-back-during-submit-a-latency", "B1-back-during-submit-b-no-latency", "R2-V08-broken-pdf-no-retry"].includes(r.phase)).length };
writeFileSync(`${OUT}/STANDIN-ux-walk.json`, JSON.stringify(record, null, 2));
writeFileSync(`${OUT}/STANDIN-ux-requests.json`, JSON.stringify(requests, null, 1));
console.log("SUMMARY", JSON.stringify(record.summary));
await browser.close();
