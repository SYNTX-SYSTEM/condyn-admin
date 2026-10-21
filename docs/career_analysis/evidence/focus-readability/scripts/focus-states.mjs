// Focus-state reconstruction (owner "FOCUS_DEPENDENT_READABILITY" + decision 03): every relational state, measured, never changed.
// argv: <lab state.json> <walk-results.json> <out dir> <W> <H> <lang en|de> <inventory.mjs path>. Run after GELB's video walk on the same lab.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, WALK, OUT, W, H, LANG, INV] = process.argv.slice(2);
const { inventory } = await import(pathToFileURL(INV).href);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const BASE = JSON.parse(readFileSync(STATE, "utf8")).base; const walk = JSON.parse(readFileSync(WALK, "utf8"));
const P = "JPOOL_B94850C439974E27496FE3B1A9A076B5", ORG = "org_kestrel", ROLE = "role_kestrel_fullstack";
const PERSON = walk.personAnalysis, PXJ = walk.pxjAnalysis;
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: +W, height: +H } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage(); const t = id => page.getByTestId(id); const errors = []; page.on("pageerror", e => errors.push(String(e).slice(0, 200)));
const chooseLang = async () => { await t("open-system-codex-btn").click(); await t(`switch-lang-${LANG}`).click(); await t("system-codex-close").click(); await page.waitForTimeout(300); };
const go = async q => { await page.goto(`${BASE}/career/demo?${q}`, { waitUntil: "networkidle" }); await page.waitForTimeout(800); await chooseLang(); };
// Focus map + geometry of the entity roots: state attributes, effective opacity, keyboard reach, and per text run its frame.
const reconstruct = () => page.evaluate(() => {
  const op = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) o *= Number(getComputedStyle(e).opacity); return Math.round(o * 100) / 100; };
  const R = /^(syntx-pool|syntx-pool-core|syntx-organization-|syntx-body-org|syntx-cosmos-centre|syntx-role-|syntx-requirement-|syntx-trace-|syntx-open-|syntx-source-|syntx-evidence|capability-cosmos-node-|capability-cosmos-center|capability-focus-|cap-|focused-stage-bubble-|identity-core)/;
  const field = document.querySelector('[data-testid="syntx-field"]');
  const rootAttrs = el => el ? Object.fromEntries([...el.attributes].filter(a => a.name.startsWith("data-") && a.value.length < 80).map(a => [a.name, a.value])) : null;
  const shell = document.querySelector("[data-investigation-mode]");
  const roots = [...document.querySelectorAll("[data-testid]")].filter(e => R.test(e.getAttribute("data-testid"))).map(e => {
    const b = e.getBoundingClientRect(); if (b.width < 1 || b.height < 1) return null;
    const runs = [...e.querySelectorAll("*")].filter(n => [...n.childNodes].some(c => c.nodeType === 3 && c.textContent.trim()) && n.closest("[data-testid]") === e).map(n => {
      const r = document.createRange(); r.selectNodeContents(n); const lines = [...r.getClientRects()].filter(x => x.width > 1); const s = getComputedStyle(n);
      const lw = lines.length ? Math.max(...lines.map(x => x.width)) : 0; const host = n.parentElement; const hb = host ? host.getBoundingClientRect() : null;
      return { text: n.textContent.trim().slice(0, 48), css: parseFloat(s.fontSize), weight: +s.fontWeight, lines: lines.length, lineW: Math.round(lw), runW: Math.round(n.getBoundingClientRect().width), maxW: s.maxWidth, ws: s.whiteSpace, host: hb && [Math.round(hb.width), Math.round(hb.height)], op: op(n) };
    });
    return { id: e.getAttribute("data-testid"), box: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)], state: e.getAttribute("data-sign-state"), relation: e.getAttribute("data-sign-relation"), interaction: e.getAttribute("data-sign-interaction"), support: e.getAttribute("data-support"), evaluation: e.getAttribute("data-evaluation-state"), tab: e.tabIndex, role: e.getAttribute("role"), aria: (e.getAttribute("aria-label") ?? "").slice(0, 60), op: op(e), runs };
  }).filter(Boolean);
  return { url: location.search, field: rootAttrs(field), shell: shell && { mode: shell.getAttribute("data-investigation-mode"), gate: shell.getAttribute("data-capability-gate") }, roots };
});
const out = [];
const snap = async name => { await page.waitForTimeout(900); const tag = `${name}-${LANG}-${W}`; await page.screenshot({ path: `${OUT}/${tag}.png` }); const rec = { name, lang: LANG, w: +W, h: +H, ...(await reconstruct()), inv: await inventory(page) }; writeFileSync(`${OUT}/${tag}.json`, JSON.stringify(rec)); out.push({ name, kind: rec.field?.["data-observation-kind"], aperture: rec.field?.["data-aperture-open"], source: rec.field?.["data-analysis-source"], mode: rec.shell?.mode, roots: rec.roots.length }); console.log("SNAP", tag, JSON.stringify(out.at(-1))); };
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log("FAIL", name, String(e).split("\n")[0].slice(0, 200)); } };
const jf = `focus=FIELD&jobPoolUploadId=${P}`; const scope = `jobScopePoolUploadId=${P}&jobScopeRoleId=${ROLE}`;
await step("FIELD", async () => { await go(`${jf}&investigationMode=PERSON`); await snap("s1-field"); });
await step("ORGANIZATION", async () => { await go(`${jf}&jobOrganizationId=${ORG}&investigationMode=PERSON`); await snap("s2-organization"); });
await step("ROLE", async () => { await go(`${jf}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&investigationMode=PERSON`); await snap("s3-role"); });
await step("REQUIREMENT", async () => { await go(`${jf}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&jobRequirementId=req_kestrel_fullstack_01&investigationMode=PERSON`); await snap("s4-requirement"); });
await step("PXJ-ROLE", async () => { await go(`analysisId=${PXJ}&${jf}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&${scope}&investigationMode=PERSON_X_JOB`); await snap("s5-pxj-role"); });
let supported = null;
await step("PXJ-REQUIREMENT", async () => {
  await go(`analysisId=${PXJ}&${jf}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&${scope}&investigationMode=PERSON_X_JOB`);
  supported = await page.locator('[data-testid^="syntx-requirement-"][data-support="SUPPORTED"]').first().getAttribute("data-testid").catch(() => null);
  const req = (supported ?? "syntx-requirement-req_kestrel_fullstack_01").replace("syntx-requirement-", "");
  await go(`analysisId=${PXJ}&${jf}&jobOrganizationId=${ORG}&jobRoleId=${ROLE}&jobRequirementId=${req}&${scope}&investigationMode=PERSON_X_JOB`); await snap("s6-pxj-requirement");
});
await step("PXJ-EVIDENCE", async () => {
  const tr = page.locator('[data-testid^="syntx-trace-"]').first(); await tr.dispatchEvent("click");
  await page.locator('[data-testid="syntx-field"][data-aperture-open="true"]').waitFor({ timeout: 15000 }); await snap("s7-pxj-evidence");
});
// PERSON: the Capability Field holds only an analysis made in this page (the demo page passes empty data), so one PERSON analysis runs
// through the lab's stand-in Gemini, exactly as GELB's walk V-02 does it.
await step("PERSON", async () => {
  await go("focus=FIELD"); await t("investigation-mode-PERSON").click(); await t("field-focus-capability-btn").click();
  await t("source-dock-file-input").setInputFiles(new URL("../../../../examples/cv.synthetic.pdf", pathToFileURL(INV)).pathname); await t("analyze-investigation").waitFor({ timeout: 20000 });
  await t("start-intake-analysis-btn").click(); await t("intake-success-banner").waitFor({ timeout: 240000 }); await t("focused-stage-bubble-02").waitFor({ timeout: 30000 });
  await snap("s8-person-capability-field");
});
await step("CAPABILITY-COSMOS", async () => { await t("focused-stage-bubble-02").click(); await page.locator('[data-testid^="capability-cosmos-node-"]').first().waitFor({ timeout: 30000 }); await snap("s8b-capability-cosmos"); });
await step("CAPABILITY", async () => {
  const ts = page.locator('[data-testid^="capability-cosmos-node-"]', { hasText: "TypeScript" }); await (await ts.count() ? ts.first() : page.locator('[data-testid^="capability-cosmos-node-"]').first()).dispatchEvent("click"); // as the walk's tap: the orbiting node moves
  await t("capability-focus-evidence-surface").waitFor({ timeout: 20000 }); await snap("s9-capability-evidence");
});
writeFileSync(`${OUT}/states-${LANG}-${W}.json`, JSON.stringify({ out, errors })); console.log("DONE", out.length, "errors", errors.length); await browser.close();
