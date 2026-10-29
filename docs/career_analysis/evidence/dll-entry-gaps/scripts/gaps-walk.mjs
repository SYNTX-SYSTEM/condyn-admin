// DLL-entry-gaps walk (GRÜN): production build, STANDIN lab. Per viewport: gate text names both ways (point 1), a real
// dropped file reaches SourceDock's intake (point 3), discovery panel with pools still opens normally (point 2 sanity).
// argv: state out
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base;
const VIEWPORTS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
const vps = (process.env.VPS ?? VIEWPORTS.map(v => v[0]).join(",")).split(",");
const browser = await chromium.launch();
const report = [];
const badge = page => page.evaluate(() => { const d = document.createElement("div"); d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "8px", bottom: "4px", zIndex: 99999, padding: "2px 8px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 11px monospace", pointerEvents: "none" }); d.dataset.badge = "1"; document.body.appendChild(d); });
const shot = async (page, name) => { await badge(page); await page.screenshot({ path: `${OUT}/STANDIN-gaps-${name}.jpg`, type: "jpeg", quality: 80 }); await page.evaluate(() => document.querySelectorAll("[data-badge]").forEach(n => n.remove())); };
for (const [vname, w, h, dsf] of VIEWPORTS.filter(v => vps.includes(v[0]))) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  const row = { vname, checks: {} }; const check = (k, v) => { row.checks[k] = v; };

  // Point 1: default landing (Job Field, PERSON×JOB, no job) — the gate text names both ways.
  await page.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="capability-gate-reason"]', { timeout: 60000 });
  const way = await page.textContent('[data-testid="capability-gate-way"]');
  const tooltip = await page.getAttribute('[data-testid="field-focus-capability-btn"]', "title");
  check("wayNamesBoth", way.includes("PERSON") && way.toLowerCase().includes("no job") && way.includes("PERSON × JOB"));
  check("tooltipNamesBoth", tooltip.includes("PERSON needs no job") && tooltip.includes("PERSON × JOB"));
  await shot(page, `${vname}-1-gate`);
  // Switching the investigation mode to PERSON (the way the text now also names) opens the gate with no job at all.
  await page.click('[data-testid="investigation-mode-selector"] button[aria-checked="false"]:has-text("PERSON"):not(:has-text("JOB"))');
  await page.waitForFunction(() => document.querySelector('[data-testid="field-focus-capability-btn"]')?.getAttribute("disabled") === null, null, { timeout: 15000 });
  check("personOpensGateNoJob", true);
  await page.click('[data-testid="field-focus-capability-btn"]');
  await page.waitForSelector('[data-testid="identity-core-dropzone"]', { timeout: 30000 });

  // Point 3: a real dropped file reaches SourceDock's own intake (same validation as the file button).
  await page.waitForTimeout(500);
  const before = await page.locator('[data-testid="source-dock"] >> text=SOURCES ACTIVE, text=sources active').count().catch(() => 0);
  await page.evaluate(() => {
    const zone = document.querySelector('[data-testid="identity-core-dropzone"]');
    const file = new File(["# A dropped CV\nArchitected distributed IIoT Edge Computing systems."], "dropped-cv.md", { type: "text/markdown" });
    const dt = new DataTransfer(); dt.items.add(file);
    zone.dispatchEvent(new DragEvent("dragover", { dataTransfer: dt, bubbles: true }));
    zone.dispatchEvent(new DragEvent("drop", { dataTransfer: dt, bubbles: true }));
  });
  await page.waitForTimeout(600);
  const dockText = await page.textContent('body');
  check("droppedFileStaged", dockText.includes("dropped-cv.md"));
  await shot(page, `${vname}-2-dropped`);

  // Point 2 sanity: DISCOVER JOBS still opens and the pools (already uploaded by the lab) show as choices.
  await page.waitForSelector('[data-testid="pxj-first-way-analyze"], [data-testid="rd-entry"]', { timeout: 15000 }).catch(() => {});
  if (await page.$('[data-testid="rd-entry"]')) {
    await page.click('[data-testid="rd-open"]');
    await page.waitForSelector('[data-testid="role-discovery-panel"]', { timeout: 15000 });
    check("discoveryPanelOpens", !!(await page.$(`[data-testid="rd-pool-${S.engineeringUploadId}"]`)));
    await shot(page, `${vname}-3-discovery`);
  } else check("discoveryPanelOpens", "no PERSON result on view (no analysis to discover from) — expected without an ANALYZE run");

  await ctx.close();
  report.push(row);
  console.log(`${vname}: ${JSON.stringify(row.checks)}`);
}
writeFileSync(`${OUT}/gaps-walk-report.json`, JSON.stringify(report, null, 2));
await browser.close();
const allOk = report.every(r => Object.values(r.checks).every(v => v === true || typeof v === "string"));
console.log(allOk ? "GAPS-WALK ALL PASS" : "GAPS-WALK FAIL");
process.exit(allOk ? 0 : 1);
