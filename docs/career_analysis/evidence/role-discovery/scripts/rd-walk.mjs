// RD walk (GRÜN, role discovery additive): production build, STANDIN lab. argv: state analysisId out. Per viewport: six orbits stand,
// entry → panel (no URL step), release = one push + one GET, wording, groups, reachability of every panel control, trace, reload /
// Back / Forward (NAV ≡ RELOAD), handover → PxJ NO_ANALYSIS; no POST anywhere.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ANALYSIS, OUT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base;
// The panel releases in the uploads' list order (GET /api/career/job-pools), whatever order the boxes were ticked in.
const POOLS = (await (await fetch(`${BASE}/api/career/job-pools`)).json()).jobPools.map(p => p.jobPoolUploadId).filter(id => [S.validationUploadId, S.engineeringUploadId].includes(id));
const VIEWPORTS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
const vps = (process.env.VPS ?? VIEWPORTS.map(v => v[0]).join(",")).split(",");
const browser = await chromium.launch();
const report = [];
const badge = page => page.evaluate(() => { const d = document.createElement("div"); d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "8px", bottom: "4px", zIndex: 99999, padding: "2px 8px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 11px monospace", pointerEvents: "none" }); d.dataset.badge = "1"; document.body.appendChild(d); });
const shot = async (page, name) => { await badge(page); await page.screenshot({ path: `${OUT}/STANDIN-rd-${name}.jpg`, type: "jpeg", quality: 80 }); await page.evaluate(() => document.querySelectorAll("[data-badge]").forEach(n => n.remove())); };
// A control is reachable when, after scrolling what a user can scroll (its scroll containers, the page), its centre hits it.
const reach = (page, selector) => page.evaluate(sel => {
  const scrollable = a => { const st = getComputedStyle(a); return (st.overflowY === "auto" || st.overflowY === "scroll") && a.scrollHeight > a.clientHeight + 1; };
  const out = [];
  for (const el of document.querySelectorAll(sel)) {
    if (el.disabled) continue;
    for (let a = el.parentElement; a && a !== document.body; a = a.parentElement) if (scrollable(a)) { const er = el.getBoundingClientRect(), ar = a.getBoundingClientRect(); a.scrollTop += (er.top + er.height / 2) - (ar.top + ar.height / 2); }
    let r = el.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) { window.scrollBy(0, r.top + r.height / 2 - innerHeight / 2); r = el.getBoundingClientRect(); }
    const x = r.left + r.width / 2, y = r.top + r.height / 2; const hit = document.elementFromPoint(x, y);
    out.push({ id: el.getAttribute("data-testid") ?? el.tagName, ok: !!hit && (hit === el || el.contains(hit) || hit.contains(el) && hit.tagName === "LABEL"), by: hit?.closest("[data-testid]")?.getAttribute("data-testid") ?? hit?.tagName ?? "none" });
  }
  scrollTo(0, 0); document.querySelectorAll("[data-rd-panel]").forEach(p => { p.scrollTop = 0; });
  return out;
}, selector);
// Nothing of the discovery (entry or panel) may overlap an orbit (its whole shell) or the shell's controls — rect intersection.
const overlaps = (page, selector) => page.evaluate(sel => {
  const own = document.querySelector(sel); if (!own) return ["absent"];
  const R = el => el.getBoundingClientRect(); const a = R(own);
  const hit = b => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const others = [...["01", "02", "03", "04", "05", "06"].map(id => `focus-transition-stage-shell-${id}`), "source-dock", "decision-graph-inspector-idle", "decision-graph-inspector", "semantic-zoom-telemetry", "semantic-guide-drawer-toggle", "investigation-mode-selector", "field-focus-strip", "job-scope-indicator", "inference-telemetry-hud"];
  return others.map(id => [id, document.querySelector(`[data-testid="${id}"]`)]).filter(([, el]) => el && R(el).width > 0 && hit(R(el))).map(([id]) => id);
}, selector);
for (const [vname, w, h, dsf] of VIEWPORTS.filter(v => vps.includes(v[0]))) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  const requests = []; page.on("request", r => { if (r.url().includes("/api/")) requests.push(`${r.method()} ${new URL(r.url()).pathname}${new URL(r.url()).search}`); });
  const row = { vname, checks: {} }; const check = (k, v) => { row.checks[k] = v; };
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON&analysisId=${ANALYSIS}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="rd-entry"]', { timeout: 60000 });
  await page.waitForTimeout(1200);
  check("sixOrbits", await page.evaluate(() => ["01", "02", "03", "04", "05", "06"].every(id => document.querySelector(`[data-testid="focus-transition-stage-shell-${id}"]`)) && ["03", "04", "05", "06"].every(id => document.querySelector(`[data-testid="energy-ray-${id}"]`)) && !!document.querySelector('[data-testid="inter-orbital-coupling"]')));
  check("entryReachable", (await reach(page, '[data-testid="rd-open"]')).every(r => r.ok));
  row.entryOverlaps = await overlaps(page, '[data-testid="rd-entry"]');
  check("entryOverlapsNothing", row.entryOverlaps.length === 0);
  await shot(page, `${vname}-1-entry`);
  const href0 = page.url(); const hist0 = await page.evaluate(() => history.length);
  await page.click('[data-testid="rd-open"]');
  await page.waitForSelector('[data-testid="role-discovery-panel"]');
  check("openNoUrlStep", page.url() === href0 && await page.evaluate(() => history.length) === hist0);
  check("poolsUnticked", await page.evaluate(() => [...document.querySelectorAll('[data-testid^="rd-pool-"] input')].every(i => !i.checked)));
  for (const id of [...POOLS].reverse()) await page.click(`[data-testid="rd-pool-${id}"] input`);
  const before = requests.length;
  await page.click('[data-testid="rd-discover"]');
  await page.waitForSelector('[data-testid="rd-semantic"]', { timeout: 60000 });
  await page.waitForTimeout(600);
  const u = new URL(page.url());
  check("releaseOnePush", await page.evaluate(() => history.length) === hist0 + 1 && JSON.stringify(u.searchParams.getAll("discoveryPoolUploadId")) === JSON.stringify(POOLS));
  const reads = requests.slice(before).filter(r => r.includes("role-discovery"));
  check("releaseOneGet", reads.length === 1 && reads[0] === `GET /api/career/analyses/${ANALYSIS}/role-discovery?jobPoolUploadId=${POOLS[0]}&jobPoolUploadId=${POOLS[1]}`);
  const text = await page.evaluate(() => ({ header: document.querySelector('[data-testid="rd-header"]')?.textContent, semantic: document.querySelector('[data-testid="rd-semantic"]')?.textContent, groups: [...document.querySelectorAll('[data-testid^="rd-group-"][data-expanded]')].map(g => `${g.dataset.testid.slice(9)}:${g.dataset.expanded}:${g.dataset.count}`) }));
  row.text = text;
  check("groupsOrder", text.groups.map(g => g.split(":")[0]).join(",") === "ALL_REQUIREMENTS_NAME_RELATED,PARTIAL_NAME_RELATED,WEAK_LEXICAL_ONLY,NO_LEXICAL_RELATION,NO_REQUIREMENTS" && text.groups.slice(3).every(g => g.split(":")[1] === "false"));
  check("sixOrbitsWithPanel", await page.evaluate(() => ["01", "02", "03", "04", "05", "06"].every(id => document.querySelector(`[data-testid="focus-transition-stage-shell-${id}"]`))));
  row.panelOverlaps = await overlaps(page, '[data-testid="role-discovery-panel"]');
  check("panelOverlapsNothing", row.panelOverlaps.length === 0);
  await shot(page, `${vname}-2-panel`);
  row.reach = await reach(page, '[data-rd-panel] button, [data-rd-panel] input');
  check("panelControlsReachable", row.reach.every(r => r.ok));
  await page.evaluate(() => { const b = document.querySelector('[data-testid="rd-role-trace"]'); b.scrollIntoView({ block: "center" }); });
  await page.click('[data-testid="rd-role-trace"]');
  await page.waitForSelector('[data-testid="rd-trace"]');
  check("traceNoUrlStep", await page.evaluate(() => history.length) === hist0 + 1);
  // Bring the trace into view inside the panel only (the page stays where it is).
  await page.evaluate(() => { scrollTo(0, 0); const p = document.querySelector("[data-rd-panel]"), t = document.querySelector('[data-testid="rd-trace"]'); if (getComputedStyle(p).overflowY === "auto" && p.scrollHeight > p.clientHeight) p.scrollTop += t.getBoundingClientRect().top - p.getBoundingClientRect().top - 12; else t.scrollIntoView({ block: "start" }); });
  await shot(page, `${vname}-3-trace`);
  check("traceControlsReachable", (await reach(page, '[data-testid="rd-trace"] button')).every(r => r.ok));
  // NAV ≡ RELOAD: a reload of the released URL, then Back (no release) and Forward (the release again).
  await page.reload({ waitUntil: "networkidle" }); await page.waitForSelector('[data-testid="rd-semantic"]', { timeout: 60000 });
  const reloaded = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="rd-group-"][data-expanded]')].map(g => `${g.dataset.testid.slice(9)}:${g.dataset.expanded}:${g.dataset.count}`));
  check("reloadSame", JSON.stringify(reloaded) === JSON.stringify(text.groups) && await page.evaluate(() => [...document.querySelectorAll('[data-testid^="rd-pool-"] input')].every(i => i.checked)));
  await page.goBack(); await page.waitForSelector('[data-testid="rd-entry"]', { timeout: 30000 });
  check("backToEntry", !(await page.$('[data-testid="role-discovery-panel"]')) && !new URL(page.url()).searchParams.has("discoveryPoolUploadId"));
  await page.goForward(); await page.waitForSelector('[data-testid="rd-semantic"]', { timeout: 30000 });
  check("forwardToPanel", JSON.stringify(await page.evaluate(() => [...document.querySelectorAll('[data-testid^="rd-group-"][data-expanded]')].map(g => `${g.dataset.testid.slice(9)}:${g.dataset.expanded}:${g.dataset.count}`))) === JSON.stringify(text.groups));
  // Handover.
  await page.evaluate(() => document.querySelector('[data-testid="rd-role-trace"]').scrollIntoView({ block: "center" }));
  await page.click('[data-testid="rd-role-trace"]'); await page.waitForSelector('[data-testid="rd-investigate"]');
  const target = await page.evaluate(() => { const b = document.querySelector('[data-testid="rd-investigate"]'); b.scrollIntoView({ block: "center" }); return [b.dataset.jobPoolUploadId, b.dataset.poolRoleId]; });
  const histH = await page.evaluate(() => history.length);
  await page.click('[data-testid="rd-investigate"]');
  await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state === "NO_ANALYSIS", null, { timeout: 60000 });
  const hu = new URL(page.url()).searchParams;
  check("handoverOnePush", await page.evaluate(() => history.length) === histH + 1 && hu.get("investigationMode") === "PERSON_X_JOB" && hu.get("jobScopePoolUploadId") === target[0] && hu.get("jobScopeRoleId") === target[1] && !hu.has("analysisId") && !hu.has("discoveryPoolUploadId"));
  check("handoverNoDiscovery", !(await page.$('[data-testid="role-discovery-panel"]')) && !(await page.$('[data-testid="rd-entry"]')));
  await shot(page, `${vname}-4-handover`);
  check("noPost", requests.every(r => r.startsWith("GET ")));
  check("discoveryReadsGetOnly", requests.filter(r => r.includes("role-discovery")).every(r => r.startsWith("GET ")));
  row.requests = requests.filter(r => r.includes("role-discovery") || !r.startsWith("GET "));
  report.push(row);
  const failed = Object.entries(row.checks).filter(([, v]) => v !== true).map(([k]) => k);
  console.log(`${vname}: ${Object.keys(row.checks).length - failed.length}/${Object.keys(row.checks).length}${failed.length ? ` FAIL ${failed.join(",")}` : ""}`);
  await ctx.close();
}
writeFileSync(`${OUT}/rd-walk.json`, JSON.stringify(report, null, 2));
await browser.close();
