// Layout probe: per viewport and scene, every visible control checked at 5 points (elementFromPoint), off-viewport parts, horizontal
// overflow, page scroll; key rects. Optional CSS file injected (prototype) before measuring. argv: state root out tag [css]
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ROOT, OUT, TAG, CSS] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base; const VAL = S.validationUploadId; const ROLE = "role_pink_alpha_architect";
const analysis = readFileSync(`${OUT}/../analysis.txt`, "utf8").trim();
const css = CSS ? readFileSync(CSS, "utf8") : null; const fitJs = process.env.FITJS ? readFileSync(process.env.FITJS, "utf8") : null;
const pxj = `investigationMode=PERSON_X_JOB&jobPoolUploadId=${VAL}&jobScopePoolUploadId=${VAL}&jobScopeRoleId=${ROLE}`;
const SCENES = {
  "cap-no-analysis": `focus=CAPABILITY&${pxj}`,
  "b2": `focus=CAPABILITY&${pxj}&analysisId=${analysis}`,
  "person": `focus=CAPABILITY&investigationMode=PERSON`,
  "role-view": `focus=FIELD&${pxj}&jobOrganizationId=org_pink_alpha&jobRoleId=${ROLE}`
};
const only = (process.env.SCENES ?? Object.keys(SCENES).join(",")).split(",");
const VIEWPORTS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
const vps = (process.env.VPS ?? VIEWPORTS.map(v => v[0]).join(",")).split(",");
const browser = await chromium.launch();
const report = { tag: TAG, css: CSS ?? null, rows: [] };
for (const [vname, w, h, dsf] of VIEWPORTS.filter(v => vps.includes(v[0]))) for (const scene of only) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/career/demo?${SCENES[scene]}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="semantic-career-intelligence-field"]', { timeout: 60000 });
  if (scene === "b2") await page.waitForFunction(() => document.querySelector('[data-testid="pxj-first-screen"]')?.dataset.state === "AVAILABLE", null, { timeout: 60000 });
  if (scene === "role-view") await page.waitForSelector('[data-testid="syntx-job-scope-select"]', { timeout: 60000 }).catch(() => undefined);
  if (css) await page.addStyleTag({ content: css });
  if (fitJs) await page.evaluate(fitJs);
  await page.waitForTimeout(1600);
  await page.evaluate(() => { const d = document.createElement("div"); d.textContent = "STAND-IN · keine Modellausführung"; Object.assign(d.style, { position: "fixed", left: "8px", bottom: "4px", zIndex: 99999, padding: "2px 8px", borderRadius: "6px", background: "rgba(245,166,35,0.92)", color: "#111", font: "700 11px monospace", pointerEvents: "none" }); document.body.appendChild(d); });
  await page.screenshot({ path: `${OUT}/STANDIN-layout-${TAG}-${scene}-${vname}.jpg`, type: "jpeg", quality: 80 });
  const m = await page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;
    const visible = el => { const s = getComputedStyle(el); if (s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && !el.closest("[hidden]") && !el.closest('[aria-hidden="true"]'); };
    const name = el => (el.getAttribute("data-testid") ?? el.getAttribute("aria-label") ?? el.innerText ?? el.tagName).trim().replace(/\s+/g, " ").slice(0, 40);
    const controls = [...document.querySelectorAll("button, a[href], input, select, textarea, [tabindex='0'], [role='radio']")].filter(el => visible(el) && !el.disabled);
    const problems = [];
    for (const el of controls) {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2; const pts = [[cx, cy], [r.left + r.width * 0.2, cy], [r.left + r.width * 0.8, cy], [cx, r.top + r.height * 0.25], [cx, r.top + r.height * 0.75]];
      let own = 0, off = 0; const by = new Set();
      for (const [x, y] of pts) { if (x < 0 || y < 0 || x >= vw || y >= vh) { off += 1; continue; } const hit = document.elementFromPoint(x, y); if (hit && (el === hit || el.contains(hit) || hit.contains(el) && hit.getAttribute("data-testid") === "career-intelligence-dashboard")) own += 1; else by.add(hit?.closest("[data-testid]")?.getAttribute("data-testid") ?? hit?.tagName ?? "none"); }
      // A control inside a scroll container may be off-view legitimately; record the container.
      // Off the viewport: a page or container scroll brings it in view — measured again there (reachable by scrolling, not covered).
      if (off > 0 && own + off === 5) continue;
      if (own < 5) problems.push({ control: name(el), own, off, by: [...by], rect: [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)] });
    }
    const offs = controls.filter(el => { const r = el.getBoundingClientRect(); return r.bottom > vh || r.top < 0 || r.right > vw || r.left < 0; });
    // Only what a user can scroll: overflow auto/scroll containers with overflow, and the page. Overflow-hidden ones stay put.
    const userScrollable = a => { const st = getComputedStyle(a); return (st.overflowY === "auto" || st.overflowY === "scroll") && a.scrollHeight > a.clientHeight + 1; };
    for (const el of offs) {
      for (let a = el.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
        if (!userScrollable(a)) continue;
        const er = el.getBoundingClientRect(), ar = a.getBoundingClientRect();
        a.scrollTop += (er.top + er.height / 2) - (ar.top + Math.min(ar.height, vh - ar.top) / 2);
      }
      const er = el.getBoundingClientRect();
      if (er.top < 0 || er.bottom > vh) window.scrollBy(0, er.top + er.height / 2 - vh / 2);
      const r = el.getBoundingClientRect(); const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const inside = cx >= 0 && cy >= 0 && cx < vw && cy < vh; const hit = inside ? document.elementFromPoint(cx, cy) : null;
      if (!inside || !(hit && (el === hit || el.contains(hit)))) problems.push({ control: name(el), afterScroll: true, inside, by: [hit?.closest("[data-testid]")?.getAttribute("data-testid") ?? hit?.tagName ?? "none"] });
      document.querySelectorAll("*").forEach(a => { if (a.scrollTop && userScrollable(a)) a.scrollTop = 0; });
      scrollTo(0, 0);
    }
    scrollTo(0, 0); document.querySelectorAll("[data-pxj-panel]").forEach(p => { p.scrollTop = 0; });
    const rect = sel => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y), Math.round(r.right), Math.round(r.bottom)]; };
    const se = document.scrollingElement;
    return { vw, vh, scrollW: se.scrollWidth, scrollH: se.scrollHeight, controls: controls.length, problems,
      rects: { header: rect('[data-testid="career-intelligence-dashboard"] > div'), jobScope: rect('[data-testid="job-scope-indicator"]'), strip: rect('[data-testid="field-focus-strip"]'), modes: rect('[data-testid="investigation-mode-selector"]'), guide: rect('[data-testid="semantic-guide-drawer-toggle"]'), dock: rect('[data-testid="source-dock"]'), inspector: rect('[data-testid="decision-graph-inspector"]'), stage: rect('svg[data-testid="resonance-energy-paths"]'), panel: rect('[data-testid="pxj-first-screen"]'), counts: rect('[data-testid="pxj-first-counts"]'), gate: rect('[data-testid="capability-gate-reason"]'), orient: rect('[data-sx-orient]') } };
  });
  report.rows.push({ vname, scene, ...m });
  console.log(`${vname} ${scene} hOverflow=${m.scrollW > m.vw} pageScroll=${m.scrollH > m.vh}(${m.scrollH}) controls=${m.controls} problems=${m.problems.length}: ${m.problems.slice(0, 8).map(p => `${p.control}[${p.afterScroll ? (p.inside ? "SCROLLED-covered" : "SCROLLED-unreachable") : p.own + "/5 off" + p.off} by ${p.by.join("|")}]`).join("; ")}`);
  await ctx.close();
}
writeFileSync(`${OUT}/layout-${TAG}.json`, JSON.stringify(report, null, 2));
await browser.close();
