// AUTO_CAPABILITY walk (GRÜN): the automatic product path in the browser, on the disposable stand-in lab. argv: STATE OUT TAG PHASES
// Phase "flow": PERSON → text source → ANALYZE, then no input at all: job → result → run → ranking (line states sampled), POSTs counted.
// Phase "views": the result URL on 6 viewports × EN/DE — panel, line, evidence class, authority, ranks, WHY, six orbits, overlaps,
// the manual discovery (open → its panel, close → the ranking back), no non-GET request. Phase "github": the account hint EN/DE.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, OUT, TAG, PHASES = "flow,views,github"] = process.argv.slice(2);
mkdirSync(`${OUT}/shots`, { recursive: true });
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base;
const VPS = [["1920x1080", 1920, 1080, 1], ["1600x900", 1600, 900, 1], ["1440x900", 1440, 900, 1], ["1280x720", 1280, 720, 1], ["zoom200-1920x1080", 960, 540, 2], ["zoom200-1280x720", 640, 360, 2]];
const TEXT = "Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees. Implemented fault-tolerant gossip protocols across 5,000+ edge nodes in EMEA. Led the worldwide IoT infrastructure transformation at Siemens Industrial Automation. Built high-throughput edge automation pipelines.";
const browser = await chromium.launch();
const report = { tag: TAG, flow: null, views: [], github: [] };
let analysisId = process.env.AC_ANALYSIS ?? null;

async function context(w, h, dsf) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage();
  const errors = [], writes = [];
  page.on("pageerror", e => errors.push(String(e).slice(0, 200)));
  page.on("request", r => { if (!["GET", "HEAD"].includes(r.method())) writes.push(`${r.method()} ${r.url().replace(BASE, "")}`); });
  return { ctx, page, errors, writes };
}
async function german(page) { await page.click('[data-testid="open-system-codex-btn"]'); await page.click('[data-testid="switch-lang-de"]'); await page.click('[data-testid="system-codex-close"]'); await page.waitForTimeout(400); }
const panelState = page => page.evaluate(() => { const p = document.querySelector('[data-testid="auto-ranking-panel"]'); return p ? { line: p.getAttribute("data-auto-line"), ranking: p.getAttribute("data-ranking-state") } : null; });

if (PHASES.includes("flow")) {
  const { ctx, page, errors, writes } = await context(1920, 1080, 1);
  await page.goto(`${BASE}/career/demo`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="investigation-mode-selector"]', { timeout: 90000 });
  const actions = [];
  const act = async (label, fn) => { actions.push(label); await fn(); await page.waitForTimeout(300); };
  await act("mode PERSON", () => page.click('[data-testid="investigation-mode-PERSON"]'));
  if (!(await page.isVisible('[data-testid="add-text-source-btn"]'))) await act("Capability Field", () => page.click('[data-testid="field-focus-capability-btn"]'));
  await act("ENTER TEXT", () => page.click('[data-testid="add-text-source-btn"]'));
  await act("type text", () => page.fill('[data-testid="source-text-input"]', TEXT));
  await act("ADD", () => page.click('[data-testid="submit-source-btn"]'));
  await act("ANALYZE", () => page.click('[data-testid="start-intake-analysis-btn"]'));
  // From here on: no input. The line states as they come, until the ranking stands.
  const seen = [];
  const started = Date.now();
  let last = null;
  while (Date.now() - started < 300000) {
    const s = await panelState(page);
    const key = s ? `${s.line}/${s.ranking}` : "no-panel";
    if (key !== last) { seen.push({ t: Math.round((Date.now() - started) / 100) / 10, state: key }); last = key; }
    if (s && s.ranking === "AVAILABLE") break;
    await page.waitForTimeout(400);
  }
  await page.mouse.move(2, 2); await page.waitForTimeout(600);
  analysisId = new URL(page.url()).searchParams.get("analysisId");
  await page.screenshot({ path: `${OUT}/shots/${TAG}-flow-ranking-1920.jpg`, type: "jpeg", quality: 76 });
  const summary = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const ranks = [...document.querySelectorAll('[data-testid^="auto-rank-JPOOL"]')].map(li => ({ rank: li.dataset.rank, tier: li.dataset.tier, fit: li.dataset.fit, text: li.textContent.replace(/\s+/g, " ").slice(0, 120) }));
    return { line: q('[data-testid="auto-line"]')?.textContent.replace(/\s+/g, " ").trim() ?? null, evidence: q('[data-testid="auto-evidence"]')?.getAttribute("data-evidence-class") ?? null,
      authority: q('[data-testid="auto-authority"]')?.textContent ?? null, ranks: ranks.length, top: ranks.slice(0, 5), tiers: ranks.reduce((m, r) => ({ ...m, [r.tier]: (m[r.tier] ?? 0) + 1 }), {}) };
  });
  const why = await page.$('[data-testid="auto-rank-why"]');
  if (why) { await why.click(); await page.waitForTimeout(400); await page.screenshot({ path: `${OUT}/shots/${TAG}-flow-why-1920.jpg`, type: "jpeg", quality: 76 }); }
  const reasons = await page.evaluate(() => [...document.querySelectorAll('[data-testid^="auto-req-"]')].filter(e => /^auto-req-[^q]/.test(e.dataset.testid) && e.dataset.source).slice(0, 6).map(e => ({ source: e.dataset.source, state: e.dataset.state, text: e.textContent.replace(/\s+/g, " ").slice(0, 200) })));
  report.flow = { actions, actionsAfterAnalyze: 0, analysisId, seen, summary, reasons, writes, errors, url: page.url().replace(BASE, "") };
  await ctx.close();
}

async function view(vp, locale) {
  const [vname, w, h, dsf] = vp;
  const { ctx, page, errors, writes } = await context(w, h, dsf);
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON&analysisId=${analysisId}`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="investigation-mode-selector"]', { timeout: 90000 });
  if (locale === "de") await german(page);
  await page.waitForFunction(() => document.querySelector('[data-testid="auto-ranking-panel"]')?.getAttribute("data-ranking-state") === "AVAILABLE", null, { timeout: 60000 }).catch(() => {});
  await page.mouse.move(2, 2); await page.waitForTimeout(900);
  const m = await page.evaluate(() => {
    const q = s => document.querySelector(s), R = e => e.getBoundingClientRect();
    const hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1;
    const panel = q('[data-testid="auto-ranking-panel"]');
    const P = panel ? R(panel) : null;
    const orbits = [...document.querySelectorAll('[data-testid^="focus-transition-stage-shell-0"]')].filter(e => R(e).width > 0);
    const others = [...document.querySelectorAll('[data-sx-shell], [data-testid="source-dock"], [data-testid="semantic-zoom-telemetry"], [data-testid="inference-telemetry-hud"], [data-testid="decision-graph-inspector-idle"]')].filter(e => R(e).width > 0 && !panel?.contains(e) && !e.contains(panel));
    const line = q('[data-testid="auto-line"]');
    return {
      panel: !!panel, line: panel?.getAttribute("data-auto-line") ?? null, ranking: panel?.getAttribute("data-ranking-state") ?? null,
      lineText: line?.textContent.replace(/\s+/g, " ").trim() ?? null, role: line?.getAttribute("role"), live: line?.getAttribute("aria-live"),
      evidence: q('[data-testid="auto-evidence"]')?.getAttribute("data-evidence-class") ?? null, authority: !!q('[data-testid="auto-authority"]'),
      ranks: document.querySelectorAll('[data-testid^="auto-rank-JPOOL"]').length, orbits: orbits.length,
      orbitOverlap: P ? orbits.filter(o => hit(R(o), P)).map(o => o.dataset.testid) : [],
      shellOverlap: P ? others.filter(o => hit(R(o), P)).map(o => o.dataset.testid ?? o.dataset.sxShell) : [],
      panelBox: P ? [Math.round(P.left), Math.round(P.top), Math.round(P.width), Math.round(P.height)] : null,
      panelInView: P ? P.left >= 0 && P.right <= innerWidth + 1 : null, entry: !!q('[data-testid="rd-open"]'),
      checkbox: !!panel?.querySelector('input'), pageScroll: document.scrollingElement.scrollWidth > innerWidth + 1
    };
  });
  await page.screenshot({ path: `${OUT}/shots/${TAG}-view-${locale}-${vname}.jpg`, type: "jpeg", quality: 72 });
  let why = null, manual = null;
  const button = await page.$('[data-testid="auto-rank-why"]');
  if (button) {
    await button.scrollIntoViewIfNeeded(); await button.click(); await page.waitForTimeout(300);
    why = await page.evaluate(() => ({ open: document.querySelector('[data-testid="auto-rank-why"]')?.getAttribute("aria-expanded"), reasons: document.querySelectorAll('[data-testid="auto-rank-reasons"] [data-source]').length, quotes: document.querySelectorAll('[data-testid="auto-req-quote"]').length, statements: document.querySelectorAll('[data-testid="auto-req-explanation"]').length }));
    if (vname === "1920x1080" || vname === "zoom200-1280x720") await page.screenshot({ path: `${OUT}/shots/${TAG}-why-${locale}-${vname}.jpg`, type: "jpeg", quality: 72 });
  }
  const open = await page.$('[data-testid="rd-open"]');
  if (open) {
    await open.scrollIntoViewIfNeeded(); await open.click(); await page.waitForTimeout(500);
    const opened = await page.evaluate(() => ({ manual: !!document.querySelector('[data-testid="role-discovery-panel"]'), auto: !!document.querySelector('[data-testid="auto-ranking-panel"]') }));
    await page.click('[data-testid="rd-close"]'); await page.waitForTimeout(500);
    const closed = await page.evaluate(() => ({ manual: !!document.querySelector('[data-testid="role-discovery-panel"]'), auto: !!document.querySelector('[data-testid="auto-ranking-panel"]') }));
    manual = { opened, closed };
  }
  report.views.push({ vp: vname, locale, ...m, why, manual, writes, errors });
  await ctx.close();
}
if (PHASES.includes("views")) for (const vp of VPS) for (const locale of ["en", "de"]) await view(vp, locale);

if (PHASES.includes("github")) for (const locale of ["en", "de"]) {
  const { ctx, page, errors } = await context(1920, 1080, 1);
  await page.goto(`${BASE}/career/demo?focus=CAPABILITY&investigationMode=PERSON`, { waitUntil: "networkidle" });
  await page.waitForSelector('[data-testid="investigation-mode-selector"]', { timeout: 90000 });
  if (locale === "de") await german(page);
  await page.click('[data-testid="add-github-source-btn"]'); await page.waitForTimeout(300);
  const g = await page.evaluate(() => ({ placeholder: document.querySelector('[data-testid="source-url-input"]')?.getAttribute("placeholder"), hint: document.querySelector('[data-testid="source-github-hint"]')?.textContent ?? null }));
  await page.screenshot({ path: `${OUT}/shots/${TAG}-github-${locale}.jpg`, type: "jpeg", quality: 72, clip: { x: 0, y: 60, width: 520, height: 620 } });
  report.github.push({ locale, ...g, errors });
  await ctx.close();
}
await browser.close();
writeFileSync(`${OUT}/${TAG}-report.json`, JSON.stringify(report, null, 1));
if (report.flow) { const f = report.flow; console.log("FLOW", JSON.stringify({ actions: f.actions, seen: f.seen, writes: f.writes, errors: f.errors.length, evidence: f.summary.evidence, ranks: f.summary.ranks, tiers: f.summary.tiers, line: f.summary.line })); console.log("TOP", JSON.stringify(f.summary.top.slice(0, 3))); console.log("REASONS", JSON.stringify(f.reasons.slice(0, 3))); }
for (const v of report.views) console.log([v.vp, v.locale, v.line, v.ranking, v.evidence, `ranks ${v.ranks}`, `orbits ${v.orbits}`, `ovlOrbit ${v.orbitOverlap.length}`, `ovlShell ${v.shellOverlap.join("|") || 0}`, `why ${v.why?.reasons ?? "-"}/${v.why?.quotes ?? "-"}`, `manual ${JSON.stringify(v.manual)}`, `writes ${v.writes.length}`, `err ${v.errors.length}`, `hscroll ${v.pageScroll}`].join(" "));
for (const g of report.github) console.log("GITHUB", g.locale, g.placeholder, "|", g.hint);
console.log("ANALYSIS", analysisId);
