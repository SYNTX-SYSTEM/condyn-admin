// F-AC-1 check (PINK §3.85): the automatic panel in the stack tier (960×540@2, 640×360@2) — its height, orbit 01's place and click.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, OUT, ANALYSIS] = process.argv.slice(2);
mkdirSync(`${OUT}/shots`, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const BASE = JSON.parse(readFileSync(STATE, "utf8")).base;
const browser = await chromium.launch(); const out = [];
for (const [name, w, h] of [["zoom200-1920x1080", 960, 540], ["zoom200-1280x720", 640, 360]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage(); const errors = []; page.on("pageerror", e => errors.push(String(e).slice(0, 160)));
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector('[data-testid="auto-ranking-panel"]')?.getAttribute("data-ranking-state") === "AVAILABLE", null, { timeout: 60000 });
  await page.waitForTimeout(800);
  const m = await page.evaluate(() => {
    const R = e => e.getBoundingClientRect(), y = e => R(e).top + scrollY;
    const panel = document.querySelector('[data-testid="auto-ranking-panel"]'), orbit = document.querySelector('[data-testid="focus-transition-stage-shell-01"]');
    const cs = getComputedStyle(panel);
    const measured = { innerHeight, panelTop: Math.round(y(panel)), panelHeight: Math.round(R(panel).height), panelScroll: panel.scrollHeight, overflowY: cs.overflowY, maxHeight: cs.maxHeight, orbit01Top: Math.round(y(orbit)), docHeight: document.scrollingElement.scrollHeight };
    // The column without the automatic panel (as before the path: only the manual entry there) — orbit 01's place then.
    const wrap = panel.parentElement; const entry = panel.querySelector('[data-testid="rd-entry"]');
    const saved = wrap.style.display; wrap.style.display = "none";
    measured.orbit01TopWithoutPanel = Math.round(y(orbit)); wrap.style.display = saved;
    measured.entryHeight = entry ? Math.round(R(entry).height) : null;
    return measured;
  });
  await page.screenshot({ path: `${OUT}/shots/stack-${name}.jpg`, type: "jpeg", quality: 72, fullPage: false });
  // Orbit 01 reached by the page's own scroll and clicked at its centre.
  const orbit = page.locator('[data-testid="focus-transition-stage-shell-01"]');
  await orbit.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  const box = await orbit.boundingBox();
  const target = await page.evaluate(([x, yy]) => document.elementFromPoint(x, yy)?.closest("[data-testid]")?.getAttribute("data-testid") ?? null, [box.x + box.width / 2, box.y + box.height / 2]);
  await page.screenshot({ path: `${OUT}/shots/stack-${name}-orbit01.jpg`, type: "jpeg", quality: 72 });
  out.push({ vp: name, ...m, orbit01CentreTakesClickOf: target, errors });
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/stack-report.json`, JSON.stringify(out, null, 1));
for (const o of out) console.log(JSON.stringify(o));
