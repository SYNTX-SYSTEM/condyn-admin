// RI-START walk (GRÜN): production build, STANDIN lab, real engine (ROLE_DISCOVERY_SEMANTIC_PROVIDER=stand-in). Per viewport: open
// discovery, release the engineering pool, pick one role with pending pairs, read the confirmed call count, START (exactly one
// POST), wait for COMPLETED, check the stand-in label (never a model name), re-read the plan, reload (NAV ≡ RELOAD via
// roleInvestigationId, GET only, no POST), Back/Forward. argv: state analysisId out
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ANALYSIS, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base;
const POOL = S.engineeringUploadId;
const VIEWPORTS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
const vps = (process.env.VPS ?? VIEWPORTS.map(v => v[0]).join(",")).split(",");
const browser = await chromium.launch();
const report = [];
const badge = page => page.evaluate(() => { const d = document.createElement("div"); d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "8px", bottom: "4px", zIndex: 99999, padding: "2px 8px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 11px monospace", pointerEvents: "none" }); d.dataset.badge = "1"; document.body.appendChild(d); });
const shot = async (page, name) => { await badge(page); await page.screenshot({ path: `${OUT}/STANDIN-ri-${name}.jpg`, type: "jpeg", quality: 80 }); await page.evaluate(() => document.querySelectorAll("[data-badge]").forEach(n => n.remove())); };
const MODEL_RE = /gemini|gpt|claude|flash|llama|mistral|openai|anthropic/i;
for (const [vname, w, h, dsf] of VIEWPORTS.filter(v => vps.includes(v[0]))) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  const requests = []; page.on("request", r => { if (r.url().includes("/api/")) requests.push(`${r.method()} ${new URL(r.url()).pathname}${new URL(r.url()).search}`); });
  const row = { vname, checks: {} }; const check = (k, v) => { row.checks[k] = v; };
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="rd-open"]', { timeout: 60000 });
  await page.click('[data-testid="rd-open"]');
  await page.waitForSelector('[data-testid="role-discovery-panel"]');
  await page.click(`[data-testid="rd-pool-${POOL}"] input`);
  await page.click('[data-testid="rd-discover"]');
  await page.waitForSelector('[data-testid="rd-semantic"]', { timeout: 60000 });
  await page.waitForTimeout(400);
  check("startOffered", !!(await page.$('[data-testid="rd-start"]')));
  const picks = await page.$$('[data-testid="rd-role-pick"] input');
  check("picksPresent", picks.length > 0);
  if (picks.length === 0) { console.error(`${vname}: no pickable role — panel html follows`); console.error(await page.evaluate(() => document.querySelector('[data-testid="role-discovery-panel"]')?.outerHTML.slice(0, 4000))); await ctx.close(); report.push(row); continue; }
  await picks[0].click();
  await page.waitForTimeout(150);
  const selection = await page.textContent('[data-testid="rd-start-selection"]');
  row.selection = selection;
  const confirmedCalls = await page.getAttribute('[data-testid="rd-start-run"]', "data-confirmed-calls");
  row.confirmedCalls = confirmedCalls;
  await shot(page, `${vname}-1-picked`);
  const before = requests.length;
  await page.evaluate(() => document.querySelector('[data-testid="rd-start-run"]').scrollIntoView({ block: "center" }));
  await page.click('[data-testid="rd-start-run"]', { timeout: 10000 });
  try {
    await page.waitForSelector('[data-testid="rd-investigation"][data-state="STORED"]', { timeout: 15000 });
  } catch (error) {
    console.error(vname + ": STORED wait failed");
    console.error("  requests since click:", JSON.stringify(requests.slice(before)));
    console.error("  investigation html:", await page.evaluate(() => document.querySelector('[data-testid="rd-investigation"]')?.outerHTML.slice(0, 1500) ?? "ABSENT"));
    console.error("  panel visible:", await page.evaluate(() => !!document.querySelector('[data-testid="role-discovery-panel"]')));
    await ctx.close();
    report.push(row);
    continue;
  }
  const posts = requests.slice(before).filter(r => r.startsWith("POST"));
  check("exactlyOnePost", posts.length === 1 && posts[0].startsWith(`POST /api/career/analyses/${ANALYSIS}/role-discovery/investigations`));
  const status = await page.getAttribute('[data-testid="rd-investigation"]', "data-status");
  row.status = status;
  check("completed", status === "COMPLETED" || status === "PARTIAL");
  const investigationId = await page.getAttribute('[data-testid="rd-investigation"]', "data-investigation-id");
  row.investigationId = investigationId;
  const bodyText = await page.evaluate(() => document.querySelector('[data-testid="role-discovery-panel"]').textContent);
  check("standInNamed", bodyText.includes("Stand-in"));
  check("noModelNamed", !MODEL_RE.test(bodyText));
  const u = new URL(page.url());
  check("urlNamesInvestigation", u.searchParams.get("roleInvestigationId") === investigationId);
  await shot(page, `${vname}-2-completed`);
  // NAV ≡ RELOAD: reload reads the stored investigation again by GET only, never a POST.
  const beforeReload = requests.length;
  console.error(vname + ": URL before reload: " + page.url());
  await page.reload({ waitUntil: "networkidle" });
  try {
    await page.waitForSelector('[data-testid="rd-investigation"][data-state="STORED"]', { timeout: 15000 });
  } catch (error) {
    console.error(vname + ": reload STORED wait failed");
    console.error("  URL after reload:", page.url());
    console.error("  requests since reload:", JSON.stringify(requests.slice(beforeReload)));
    console.error("  investigation html:", await page.evaluate(() => document.querySelector('[data-testid="rd-investigation"]')?.outerHTML.slice(0, 1500) ?? "ABSENT"));
    console.error("  panel visible:", await page.evaluate(() => !!document.querySelector('[data-testid="role-discovery-panel"]')));
    await ctx.close();
    report.push(row);
    continue;
  }
  const reloadCalls = requests.slice(beforeReload);
  check("reloadNoPost", reloadCalls.every(r => r.startsWith("GET")));
  check("reloadReadsInvestigation", reloadCalls.some(r => r.includes(`/investigations/${investigationId}`)));
  const statusAfterReload = await page.getAttribute('[data-testid="rd-investigation"]', "data-status");
  check("reloadSameStatus", statusAfterReload === status);
  await shot(page, `${vname}-3-reload`);
  // Back removes the release and the investigation from the URL; Forward restores both (NAV ≡ RELOAD on history too).
  await page.goBack(); await page.waitForSelector('[data-testid="rd-entry"]', { timeout: 30000 });
  check("backToEntry", !(await page.$('[data-testid="role-discovery-panel"]')));
  const beforeForward = requests.length;
  await page.goForward(); await page.waitForSelector('[data-testid="rd-investigation"][data-state="STORED"]', { timeout: 60000 });
  check("forwardNoPost", requests.slice(beforeForward).every(r => r.startsWith("GET")));
  check("forwardSameStatus", await page.evaluate(() => document.querySelector('[data-testid="rd-investigation"]')?.dataset.status) === status);
  await ctx.close();
  report.push(row);
  console.log(`${vname}: ${JSON.stringify(row.checks)}`);
}
writeFileSync(`${OUT}/ri-walk-report.json`, JSON.stringify(report, null, 2));
await browser.close();
const allOk = report.every(r => Object.values(r.checks).every(Boolean));
console.log(allOk ? "RI-WALK ALL PASS" : "RI-WALK FAIL");
process.exit(allOk ? 0 : 1);
