// PINK D-FR-1: names with one long word. Pool name in the core organism and organization centre disc, per word length at the steps.
// argv: <lab state.json> <repo root> <out.json> [W H]
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, ROOT, OUT, W = "1920", H = "1080"] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const BASE = JSON.parse(readFileSync(STATE, "utf8")).base;
const eng = JSON.parse(readFileSync(`${ROOT}/docs/examples/job-pool-tests/DLL_JOBPOOL_ENGINEERING.json`, "utf8"));
const variant = (id, poolName, orgName) => { const v = structuredClone(eng); v.pool.id = `pool_dll_words_${id}`; v.pool.name = poolName; for (const r of [v.roles, v.requirements, v.organizations]) for (const x of r) x.pool_id = v.pool.id; v.organizations[0].name = orgName; return v; };
// [id, pool name (longest word), organization name (longest word)]
const VARIANTS = [
  ["w1", "DLL Wohnungswirtschaftsma Pool", "Industrieanlagen"],            // pool 21 → 12; org 16 → 13
  ["w2", "Wohnungswirtschaftsman Pool", "Telecommunications"],             // pool 22 → 12; org 18 → 12
  ["w3", "Gesundheitsplattformen", "Versicherungsgruppe"],                 // pool 22 → 12; org 19 → 11
  ["w4", "DLL Wohnungswirtschaftsmanag", "Kestrel Industrieanlagenx"],     // pool 24 → 10.5; org 17 → 12
  ["w5", "DLL Straßenbauplattform EU", "Straßenbaufirmen"],                // ß: pool 19 → 20 shown → 12; org 16 → 17 shown → 12
  ["w6", "Energieversorgungsunternehmen", "Energieversorgungsunternehmen"], // 29: 10.5 / 11, as before
  ["w7", "DLL Wohnungswirtschafts Pool", "Kestrel Wohnungswirtsch"]        // pool 19 → 14 (the edge); org 15 → 13
].filter(([id]) => !process.env.ONLY || process.env.ONLY.split(",").includes(id));
const post = async body => { const r = await (await fetch(`${BASE}/api/career/job-pools`, { method: "POST", headers: { "content-type": "application/json", "x-condyn-principal-actor-id": "GRUEN_FOCUS_LAB" }, body: JSON.stringify(body) })).json(); return r.jobPoolUploadId ?? r.upload?.jobPoolUploadId; };
const pools = {}; for (const [id, p, o] of VARIANTS) pools[id] = await post(variant(id, p, o));
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, reducedMotion: "reduce" });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage(); const rows = [];
const go = async q => { await page.goto(`${BASE}/career/demo?focus=FIELD&${q}&investigationMode=PERSON`, { waitUntil: "networkidle" }); await page.waitForTimeout(1800); };
for (const [id, P] of Object.entries(pools)) {
  await go(`jobPoolUploadId=${P}`);
  rows.push({ v: id, state: "FIELD", ...(await page.evaluate(() => {
    const core = document.querySelector('[data-testid="syntx-pool-core"]'); const content = core.querySelector('div[style*="max-width"]'); const el = content.children[2];
    const cb = core.getBoundingClientRect(); const cx = (cb.left + cb.right) / 2, cy = (cb.top + cb.bottom) / 2, R = cb.width / 2;
    const r = document.createRange(); r.selectNodeContents(el); const rects = [...r.getClientRects()];
    const air = Math.min(...rects.flatMap(q => [[q.left, q.top], [q.right, q.top], [q.left, q.bottom], [q.right, q.bottom]].map(([x, y]) => R - Math.hypot(x - cx, y - cy))));
    const cw = content.getBoundingClientRect(); const overContent = Math.max(...rects.map(q => Math.max(cw.left - q.left, q.right - cw.right)));
    return { text: el.textContent, font: getComputedStyle(el).fontSize, lines: new Set(rects.map(q => Math.round(q.top))).size, ringAir: +air.toFixed(1), overContent: +overContent.toFixed(1) };
  })) });
  await go(`jobPoolUploadId=${P}&jobOrganizationId=org_kestrel`);
  rows.push({ v: id, state: "ORGANIZATION", ...(await page.evaluate(() => {
    const c = document.querySelector('[data-testid="syntx-cosmos-centre"]'); const b = c.getBoundingClientRect(); const el = c.children[1];
    const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2, R = b.width / 2 - 1.5;
    const r = document.createRange(); r.selectNodeContents(el); const rects = [...r.getClientRects()];
    const air = Math.min(...rects.flatMap(q => [[q.left, q.top], [q.right, q.top], [q.left, q.bottom], [q.right, q.bottom]].map(([x, y]) => R - Math.hypot(x - cx, y - cy))));
    return { text: el.textContent, font: getComputedStyle(c).fontSize, disc: [Math.round(b.width), Math.round(b.height)], lines: new Set(rects.map(q => Math.round(q.top))).size, discAir: +air.toFixed(1) };
  })) });
}
writeFileSync(OUT, JSON.stringify({ pools, rows }, null, 1));
for (const r of rows) console.log(r.v, r.state.padEnd(12), r.font.padEnd(6), r.state === "FIELD" ? `ringAir ${r.ringAir} overContent ${r.overContent}` : `disc ${r.disc.join("×")} discAir ${r.discAir}`, "|", r.text);
await browser.close();
