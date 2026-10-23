// PINK's held items as regression (STAND-IN lab, production build): 600 Tab presses change neither URL nor history; Shift+Tab is
// the exact reverse; the Esc chain role → organisation → field; no focus on hidden elements.
import { readFileSync, writeFileSync } from "node:fs"; import { pathToFileURL } from "node:url";
const [STATE, OUT] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const VAL = S.validationUploadId;
const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const p = await ctx.newPage(); const out = {};
const role = `${S.base}/career/demo?focus=FIELD&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobOrganizationId=org_pink_alpha&jobRoleId=role_pink_alpha_architect&jobScopePoolUploadId=${VAL}&jobScopeRoleId=role_pink_alpha_architect`;
await p.goto(role, { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
const url = p.url(), length = await p.evaluate(() => history.length); const forward = []; let hiddenFocus = 0;
for (let i = 0; i < 600; i += 1) { await p.keyboard.press("Tab"); const info = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return { id: "BODY", hidden: false }; const r = a.getBoundingClientRect(); const s = getComputedStyle(a); return { id: a.getAttribute("data-testid") ?? a.getAttribute("aria-label") ?? a.tagName, hidden: r.width === 0 || s.visibility === "hidden" || !!a.closest("[hidden]") }; }); if (i < 40) forward.push(info.id); if (info.hidden) hiddenFocus += 1; }
out.tab600 = { urlUnchanged: p.url() === url, historyUnchanged: (await p.evaluate(() => history.length)) === length, hiddenFocus };
await p.goto(role, { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
const f = []; for (let i = 0; i < 20; i += 1) { await p.keyboard.press("Tab"); f.push(await p.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName)); }
const r = []; for (let i = 0; i < 19; i += 1) { await p.keyboard.press("Shift+Tab"); r.push(await p.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? document.activeElement?.getAttribute("aria-label") ?? document.activeElement?.tagName)); }
out.shiftTabReverse = JSON.stringify(r) === JSON.stringify(f.slice(0, 19).reverse());
await p.goto(role, { waitUntil: "networkidle" }); await p.waitForTimeout(1500);
await p.evaluate(() => document.querySelector('[data-testid="syntx-field"]')?.focus());
const levels = [await p.getAttribute('[data-testid="syntx-field"]', "data-observation-kind")];
for (let i = 0; i < 2; i += 1) { await p.keyboard.press("Escape"); await p.waitForTimeout(700); levels.push(await p.getAttribute('[data-testid="syntx-field"]', "data-observation-kind")); }
out.escChain = levels;
out.ok = out.tab600.urlUnchanged && out.tab600.historyUnchanged && out.tab600.hiddenFocus === 0 && out.shiftTabReverse && levels.join(",") === "ROLE,ORGANIZATION,FIELD";
out.firstTabs = forward.slice(0, 12);
writeFileSync(`${OUT}/STANDIN-ux-keyboard.json`, JSON.stringify(out, null, 2)); console.log(JSON.stringify(out));
await b.close();
