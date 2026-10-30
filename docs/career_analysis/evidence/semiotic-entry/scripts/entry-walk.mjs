// Semiotic entry walk (GRÜN): four entry states × EN/DE × 6 viewports on my own empty-pool lab. argv: state out tag
// Phase 1 (no pool uploaded): state 1. Then the pool is uploaded through the real route. Phase 2: states 2, 3, 4 (+ JOB).
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, OUT, TAG] = process.argv.slice(2);
mkdirSync(`${OUT}/shots`, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base;
const VPS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
const browser = await chromium.launch();
const report = [];
const measure = page => page.evaluate(() => {
  const q = s => document.querySelector(s);
  const el = q('[data-testid="capability-gate-reason"]') ?? q('[data-testid="field-entry-state"]');
  const R = e => e.getBoundingClientRect();
  const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  // Real carriers, not the full-area field container: shell controls, the Job Field's nodes, its pool/state panels.
  const sel = '[data-testid="field-focus-strip"], [data-testid="investigation-mode-selector"], [data-testid="job-scope-indicator"], [data-testid="semantic-guide-drawer-toggle"], [data-testid="open-system-codex-btn"], [data-testid^="syntx-organization-"], [data-testid^="syntx-role-"], [data-testid="syntx-pool"], [data-testid="syntx-no-pool"], [data-testid="syntx-no-analysis"], [data-testid="syntx-orient"], [data-testid="syntx-state"], [data-testid="job-pool-list"], [data-sx-panel]';
  const ov = el ? [...document.querySelectorAll(sel)].filter(e => { const r = R(e); return r.width > 0 && r.height > 0 && hit(R(el), r) && !e.contains(el) && !el.contains(e); }).map(e => { const r = R(e), a = R(el); const dy = Math.round(Math.min(a.bottom, r.bottom) - Math.max(a.top, r.top)); return `${e.getAttribute("data-testid")}(${dy}px)`; }) : [];
  const btn = q('[data-testid="field-focus-capability-btn"]');
  return {
    present: !!el, testid: el?.getAttribute("data-testid") ?? null, role: el?.getAttribute("role") ?? null, live: el?.getAttribute("aria-live") ?? null,
    gate: el?.getAttribute("data-gate") ?? null, entry: el?.getAttribute("data-entry-state") ?? null,
    text: el ? el.innerText.replace(/\s+/g, " ").trim() : null,
    tooltip: btn?.getAttribute("title") ?? null, capabilityDisabled: btn?.hasAttribute("disabled") ?? null,
    rect: el ? [R(el).x, R(el).y, R(el).width, R(el).height].map(Math.round) : null, overlaps: ov,
    border: el ? getComputedStyle(el).borderColor : null,
    action: q('[data-testid="field-entry-action"]')?.getAttribute("data-action") ?? null,
    roleNode: !!q('[data-testid="syntx-job-scope-select"]'), url: location.search,
    pageScrolls: document.scrollingElement.scrollHeight > innerHeight + 1
  };
});
async function visit(name, path, vp, locale, prep) {
  const [vname, w, h, dsf] = vp;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  const errors = []; page.on("pageerror", e => errors.push(String(e).slice(0, 160)));
  await page.goto(`${BASE}${path}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="field-focus-strip"], [data-testid="investigation-mode-selector"]', { timeout: 60000 });
  await page.waitForTimeout(900);
  if (locale === "de") { await page.click('[data-testid="open-system-codex-btn"]'); await page.click('[data-testid="switch-lang-de"]'); await page.click('[data-testid="system-codex-close"]'); await page.waitForTimeout(500); }
  if (prep) await prep(page);
  await page.mouse.move(2, 2); await page.waitForTimeout(400);
  const m = await measure(page);
  await page.screenshot({ path: `${OUT}/shots/${TAG}-${name}-${locale}-${vname}.jpg`, type: "jpeg", quality: 74 });
  report.push({ state: name, locale, vname, ...m, errors });
  console.log(`${name} ${locale} ${vname}: present=${m.present} entry=${m.entry} gate=${m.gate} role=${m.role} live=${m.live} ov=${m.overlaps.join("|") || "-"} scroll=${m.pageScrolls} :: ${(m.text ?? "").slice(0, 150)}`);
  await ctx.close();
}
const LOCALES = (process.env.LOCALES ?? "en,de").split(",");
// ONLY: comma list of states to visit (default all); the role opened for owner state 4 (observation point, not the job).
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null;
const want = name => ONLY === null || ONLY.includes(name);
const ROLE_OPEN = "&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_fullstack";
// Phase 1: no pool at all.
if (want("s1-no-pool")) for (const vp of VPS) for (const l of LOCALES) await visit("s1-no-pool", "/career/demo?investigationMode=PERSON_X_JOB", vp, l);
// Upload the engineering pool through the real upload route (my own disposable lab).
const pool = readFileSync(`${process.env.REPO}/docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json`, "utf8");
const up = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_ENTRY_LAB" }, body: pool })).json();
const POOL = up.jobPoolUploadId ?? up.upload?.jobPoolUploadId;
console.log("uploaded pool", POOL);
for (const vp of VPS) for (const l of LOCALES) {
  if (want("s2-pool-not-opened")) await visit("s2-pool-not-opened", "/career/demo?investigationMode=PERSON_X_JOB", vp, l);
  if (want("s3-person")) await visit("s3-person", "/career/demo?focus=FIELD&investigationMode=PERSON", vp, l);
  // (the before walk named this URL "s4-role-needed": it is owner state 2, step b — a pool opened, no role)
  if (want("s2b-pool-open")) await visit("s2b-pool-open", `/career/demo?investigationMode=PERSON_X_JOB&jobPoolUploadId=${POOL}`, vp, l);
  if (want("s4-role-open")) await visit("s4-role-open", `/career/demo?investigationMode=PERSON_X_JOB&jobPoolUploadId=${POOL}${ROLE_OPEN}`, vp, l);
  // State 4's transition, clicked: SELECT AS JOB (the existing selectJobScope) — the gate then opens by its own unchanged rule.
  if (want("s4-chosen")) await visit("s4-chosen", `/career/demo?investigationMode=PERSON_X_JOB&jobPoolUploadId=${POOL}${ROLE_OPEN}`, vp, l, async page => { const a = await page.$('[data-testid="field-entry-action"]'); if (a) { await a.click(); await page.waitForFunction(() => document.querySelector('[data-testid="field-focus-capability-btn"]')?.hasAttribute("disabled") === false, null, { timeout: 15000 }).catch(() => undefined); await page.waitForTimeout(600); } });
  if (want("job-mode")) await visit("job-mode", "/career/demo?investigationMode=JOB", vp, l);
}
writeFileSync(`${OUT}/${TAG}-report.json`, JSON.stringify(report, null, 2));
await browser.close();
