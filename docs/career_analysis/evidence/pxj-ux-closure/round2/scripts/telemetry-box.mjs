import { readFileSync } from "node:fs"; import { pathToFileURL } from "node:url";
const [STATE, ANALYSIS, CSS, FITJS] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const VAL = S.validationUploadId;
const b = await chromium.launch();
for (const [w, h] of [[1920, 1080], [1600, 900], [1440, 900], [1280, 720]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } }); await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  await ctx.route("**/*", r => { const m = r.request().method(); return m !== "GET" && m !== "HEAD" ? r.abort() : r.continue(); });
  const p = await ctx.newPage();
  await p.goto(`${S.base}/career/demo?focus=CAPABILITY&investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=role_pink_alpha_architect${ANALYSIS === "-" ? "" : `&analysisId=${ANALYSIS}`}&analysisJobId=JOB_1000000000000_1`, { waitUntil: "networkidle" });
  if (CSS && CSS !== "-") { await p.addStyleTag({ content: readFileSync(CSS, "utf8") }); await p.evaluate(readFileSync(FITJS, "utf8")); }
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => { const rect = s => { const e = document.querySelector(s); if (!e) return null; const x = e.getBoundingClientRect(); return [Math.round(x.left), Math.round(x.top), Math.round(x.right), Math.round(x.bottom)]; }; const hud = rect('[data-testid="inference-telemetry-hud"]'), panel = rect('[data-pxj-panel]'); const ov = hud && panel ? Math.max(0, Math.min(hud[2], panel[2]) - Math.max(hud[0], panel[0])) * Math.max(0, Math.min(hud[3], panel[3]) - Math.max(hud[1], panel[1])) : null; const rows = [...document.querySelectorAll('[data-testid^="pxj-first-req-"]')].map(e => { const x = e.getBoundingClientRect(); const pts = [[x.left + x.width / 2, Math.min(x.bottom - 4, innerHeight - 2)]]; return pts.map(([a, b2]) => { const el = document.elementFromPoint(a, b2); return el?.closest("[data-testid]")?.getAttribute("data-testid") ?? "none"; })[0]; }); return { hud, panel, overlapPx: ov, rowHits: rows, state: document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state }; });
  console.log(w, h, JSON.stringify(r));
  await ctx.close();
}
await b.close();
