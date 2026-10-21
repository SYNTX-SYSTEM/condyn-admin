// Geometry of the focus identities: the pool name in the core organism, the organization centre disc, the requirement / capability
// siblings. Engineering pool and a long-name variant (pool, organization, requirement names lengthened; ids kept per upload).
// argv: <lab state.json> <repo root> <out.json> [W H lang]
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ROOT, OUT, W = "1920", H = "1080", LANG = "en"] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const BASE = JSON.parse(readFileSync(STATE, "utf8")).base;
const eng = JSON.parse(readFileSync(`${ROOT}/docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json`, "utf8"));
const long = structuredClone(eng);
long.pool.id = "pool_dll_engineering_longnames"; long.pool.name = "Decision Loop Labs Engineering, Architecture & Platform Reliability Pool Europe";
for (const r of [long.roles, long.requirements]) for (const x of r) x.pool_id = long.pool.id;
long.organizations[0].name = "Kestrel Logistics Software und Plattformdienste Holding GmbH & Co. KG";
long.requirements.find(r => r.id === "req_kestrel_fullstack_02").capability_name = "Event-Driven Distributed Systems Architecture with Kafka Streams";
long.requirements.find(r => r.id === "req_kestrel_fullstack_03").capability_name = "Geospatial Visualisation and Real-Time Fleet Tracking Interfaces";
for (const o of long.organizations) o.pool_id = long.pool.id;
const mid = structuredClone(eng);
mid.pool.id = "pool_dll_engineering_midnames"; mid.pool.name = "DLL Engineering, Architecture & Platform Pool EU"; // 48
for (const r of [mid.roles, mid.requirements, mid.organizations]) for (const x of r) x.pool_id = mid.pool.id;
mid.organizations[0].name = "Kestrel Logistics Software Holding GmbH"; // 39 (+3 ordinal = 42)
// At the step edges: pool name 36 / 37 characters, centre label 34 / 35.
const edge = structuredClone(eng);
edge.pool.id = "pool_dll_engineering_edgenames"; edge.pool.name = "DLL Engineering & Architecture Pools"; // 36
for (const r of [edge.roles, edge.requirements, edge.organizations]) for (const x of r) x.pool_id = edge.pool.id;
edge.organizations[0].name = "Kestrel Logistics Softwares GmbH"; // 32 (+3 = 35)
const post = async body => { const r = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_FOCUS_LAB" }, body: JSON.stringify(body) })).json(); return r.jobPoolUploadId ?? r.upload?.jobPoolUploadId; };
// GELB F-FR-1: ß grows to SS in upper case, so each name sits one character below a step as written and on it as shown.
const sharp = (id, poolName, orgName) => { const v = structuredClone(eng); v.pool.id = id; v.pool.name = poolName; for (const r of [v.roles, v.requirements, v.organizations]) for (const x of r) x.pool_id = id; v.organizations[0].name = orgName; return v; };
const sz1 = sharp("pool_dll_engineering_sz1", "DLL Straßenbau & Architektur Pool EU", "Kestrel Straßenlogistik Soft AG"); // 36 → 37 shown; label 34 → 35
const sz2 = sharp("pool_dll_engineering_sz2", "DLL Straßenbau, Architektur & Plattform Pool Europa EU", "Kestrel Straßenlogistik Software AG"); // 54 → 55; label 38 → 39
const pools = { eng: await post(eng), edge: await post(edge), mid: await post(mid), long: await post(long), sz1: await post(sz1), sz2: await post(sz2) };
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: +W, height: +H } });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage(); const t = id => page.getByTestId(id);
const chooseLang = async () => { await t("open-system-codex-btn").click(); await t(`switch-lang-${LANG}`).click(); await t("system-codex-close").click(); await page.waitForTimeout(300); };
const res = { pools, rows: [] };
const go = async q => { await page.goto(`${BASE}/career/demo?focus=FIELD&${q}&investigationMode=PERSON`, { waitUntil: "networkidle" }); await page.waitForTimeout(1500); await chooseLang(); await page.waitForTimeout(600); };
const box = r => r && [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
for (const [name, P] of Object.entries(pools)) {
  await go(`jobPoolUploadId=${P}`);
  res.rows.push({ pool: name, state: "FIELD", ...(await page.evaluate(() => {
    const core = document.querySelector('[data-testid="syntx-pool-core"]'); const content = core.querySelector('div[style*="max-width"]') ?? core.firstElementChild;
    const kids = [...content.children].map(c => c.getBoundingClientRect()); const name = kids[2]; const r = document.createRange(); r.selectNodeContents(content.children[2]);
    const lines = new Set([...r.getClientRects()].map(x => Math.round(x.top))).size;
    const orgNames = [...document.querySelectorAll('[data-testid^="syntx-body-org"] span')].filter(s => s.textContent.trim().startsWith("⬡")).map(s => s.getBoundingClientRect().height);
    const cb = core.getBoundingClientRect();
    return { core: [Math.round(cb.left), Math.round(cb.top), Math.round(cb.right), Math.round(cb.bottom)], emblem: kids[0] && [Math.round(kids[0].top), Math.round(kids[0].bottom)], kicker: [Math.round(kids[1].top), Math.round(kids[1].bottom)], name: [Math.round(name.left), Math.round(name.top), Math.round(name.right), Math.round(name.bottom)], nameLines: lines, nameText: content.children[2].textContent, chip: [Math.round(kids[3].top), Math.round(kids[3].bottom)], gapNameChip: Math.round(kids[3].top - name.bottom), gapKickerName: Math.round(name.top - kids[1].bottom), nameFont: getComputedStyle(content.children[2]).fontSize };
  })) });
  await go(`jobPoolUploadId=${P}&jobOrganizationId=org_kestrel`);
  res.rows.push({ pool: name, state: "ORGANIZATION", ...(await page.evaluate(() => {
    const c = document.querySelector('[data-testid="syntx-cosmos-centre"]'); const b = c.getBoundingClientRect(); const nameEl = c.children[1]; const r = document.createRange(); r.selectNodeContents(nameEl);
    const rects = [...r.getClientRects()]; const lines = new Set(rects.map(x => Math.round(x.top))).size; const maxW = Math.round(Math.max(...rects.map(x => x.width)));
    const kick = c.children[3].getBoundingClientRect(); const nb = nameEl.getBoundingClientRect();
    // Inscribed check: every corner of the name and kicker blocks inside the disc (radius from the button's width).
    const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2, R = b.width / 2 - 1.5;
    const inside = q => [[q.left, q.top], [q.right, q.top], [q.left, q.bottom], [q.right, q.bottom]].map(([x, y]) => Math.round(R - Math.hypot(x - cx, y - cy)));
    const roleCards = [...document.querySelectorAll('[data-testid^="syntx-role-"]')].map(e => e.getBoundingClientRect()).filter(q => q.width > 20);
    const nearest = Math.min(...roleCards.map(q => Math.max(q.left - b.right, b.left - q.right, q.top - b.bottom, b.top - q.bottom)));
    return { disc: [Math.round(b.width), Math.round(b.height)], nameFont: getComputedStyle(c).fontSize, nameLines: lines, nameMaxLineW: maxW, nameText: nameEl.textContent, nameBlock: [Math.round(nb.top - b.top), Math.round(nb.bottom - b.top)], kickerBlock: [Math.round(kick.top - b.top), Math.round(kick.bottom - b.top)], cornerAirName: inside(nb), cornerAirKicker: inside(kick), nearestRoleCardAir: Math.round(nearest) };
  })) });
}
for (const [name, P] of Object.entries(pools)) {
  await go(`jobPoolUploadId=${P}&jobOrganizationId=org_kestrel&jobRoleId=role_kestrel_fullstack&jobRequirementId=req_kestrel_fullstack_01`);
  res.rows.push({ pool: name, state: "REQUIREMENT", ...(await page.evaluate(() => {
    const cards = [...document.querySelectorAll('[data-testid^="syntx-requirement-"] > button[aria-pressed="false"]')];
    const rects = cards.map(c => c.getBoundingClientRect());
    let overlaps = 0; for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const a = rects[i], b = rects[j]; if (a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom) overlaps++; }
    const nucleus = document.querySelector('[data-testid^="syntx-requirement-"] > button[aria-pressed="true"]').getBoundingClientRect(); const ev = document.querySelector('[data-testid="syntx-evidence-surface"]')?.getBoundingClientRect();
    const hit = q => q && rects.filter(a => a.left < q.right && q.left < a.right && a.top < q.bottom && q.top < a.bottom).length;
    const grown = cards.filter(c => c.offsetHeight > parseFloat(getComputedStyle(c).minHeight) + 0.5).map(c => `${c.textContent.trim().slice(0, 30)}: ${c.offsetHeight}/${getComputedStyle(c).minHeight}`);
    const lines = cards.map(c => { const sp = c.querySelector("span"); const r = document.createRange(); r.selectNodeContents(sp); return new Set([...r.getClientRects()].map(x => Math.round(x.top))).size; });
    const offscreen = rects.filter(q => q.left < 0 || q.top < 0 || q.right > innerWidth || q.bottom > innerHeight).length;
    return { siblings: cards.length, font: cards[0] && getComputedStyle(cards[0]).fontSize, maxLines: Math.max(...lines), grown, overlaps, onNucleus: hit(nucleus), onEvidence: hit(ev), offscreen };
  })) });
}
writeFileSync(OUT, JSON.stringify(res, null, 1)); console.log(JSON.stringify(res.rows.map(r => ({ pool: r.pool, state: r.state, ...r })), null, 0)); await browser.close();
