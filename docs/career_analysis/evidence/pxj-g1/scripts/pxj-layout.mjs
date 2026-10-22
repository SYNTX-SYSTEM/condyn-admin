// G1 · the first screen's panel against orbit 02 and the shell at several viewports (reload path, STAND-IN data). argv: <state.json> <analysisId> <out dir>
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ANALYSIS, OUT] = process.argv.slice(2); mkdirSync(OUT, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8"));
const browser = await chromium.launch(); const rows = [];
for (const [w, h] of [[1920, 1080], [1600, 900], [1440, 900], [1280, 720]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(`${S.base}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&analysisId=${ANALYSIS}&jobScopePoolUploadId=${S.validationUploadId}&jobScopeRoleId=role_pink_alpha_architect`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state === "AVAILABLE", null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const r = s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
    const hit = (a, b) => a && b && a[0] < b[2] && b[0] < a[2] && a[1] < b[3] && b[1] < a[3];
    const panel = r('[data-testid="pxj-first-screen"]'), orbit02 = r('[data-testid="focus-transition-stage-shell-02"] [data-testid="focused-stage-bubble-02"]') ?? r('[data-testid="focus-transition-stage-shell-02"]'), orbit01 = r('[data-testid="focus-transition-stage-shell-01"]'), core = r('[data-testid="identity-core-wrapper"]');
    const shell = ['[data-sx-shell="controls"]', '[data-sx-shell="guide"]', '[data-testid="investigation-mode-selector"]'].map(r);
    return { scrollY: window.scrollY, panel, orbit02, orbit01, core, panelOverOrbit02: !!hit(panel, orbit02), panelOverOrbit01: !!hit(panel, orbit01), panelOverCore: !!hit(panel, core), panelUnderShell: shell.some(s => hit(panel, s)) };
  });
  rows.push({ viewport: `${w}x${h}`, ...m });
  await page.evaluate(() => { const d = document.createElement("div"); d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "12px", top: "8px", zIndex: 99999, padding: "3px 10px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 12px monospace", pointerEvents: "none" }); document.body.appendChild(d); });
  await page.screenshot({ path: `${OUT}/STANDIN-layout-available-${w}x${h}.jpg`, type: "jpeg", quality: 82 });
  await ctx.close();
}
writeFileSync(`${OUT}/STANDIN-layout.json`, JSON.stringify({ gemini: "STAND_IN", note: "STAND-IN · keine Modellausführung", analysisId: ANALYSIS, rows }, null, 1));
for (const row of rows) console.log(row.viewport, "scroll", row.scrollY, "overOrbit02", row.panelOverOrbit02, "overOrbit01", row.panelOverOrbit01, "overCore", row.panelOverCore, "underShell", row.panelUnderShell, "panel", row.panel?.join(","));
await browser.close();
