// D-FR-1 probe: per word length and font size, does the longest word stay inside the centre disc / the pool core?
// DOM override only (text + font size on the rendered element); argv: <lab state.json> <out.json> [W H]
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const [STATE, OUT, W = "1920", H = "1080"] = process.argv.slice(2);
const pw = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href); const { chromium } = pw.chromium ? pw : pw.default;
const S = JSON.parse(readFileSync(STATE, "utf8")); const BASE = S.base; const P = S.engineeringUploadId;
const WIDE = "WOHNUNGSWIRTSCHAFTSMANAGEMENTWERKSWOHNUNG"; const MID = "VERSICHERUNGSGRUPPENGESUNDHEITSPLATTFORMEN"; const NARROW = "INFRASTRUKTURINITIATIVENTELEKOMMUNIKATIONS";
const words = []; for (let n = 12; n <= 26; n++) for (const [k, s] of [["wide", WIDE], ["mid", MID], ["narrow", NARROW]]) words.push({ n, k, w: s.slice(0, n) });
const browser = await chromium.launch(); const ctx = await browser.newContext({ viewport: { width: +W, height: +H }, reducedMotion: "reduce" });
await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
const page = await ctx.newPage(); const rows = [];
const measure = (kind, sizes) => page.evaluate(({ kind, sizes, words }) => {
  const out = [];
  const lineAir = (el, cx, cy, R) => { const r = document.createRange(); r.selectNodeContents(el); return Math.min(...[...r.getClientRects()].flatMap(q => [[q.left, q.top], [q.right, q.top], [q.left, q.bottom], [q.right, q.bottom]].map(([x, y]) => R - Math.hypot(x - cx, y - cy)))); };
  if (kind === "centre") {
    const c = document.querySelector('[data-testid="syntx-cosmos-centre"]'); const el = c.children[1]; const orig = el.textContent;
    for (const size of sizes) for (const { n, k, w } of words) for (const [ctxName, text] of [["alone", `01 ${w}`], ["first", `01 ${w} SOFTWARE GMBH`], ["last", `01 KESTREL LOGISTIK ${w}`]]) {
      c.style.fontSize = size; el.textContent = text; const b = c.getBoundingClientRect(); const cx = (b.left + b.right) / 2, cy = (b.top + b.bottom) / 2, R = b.width / 2 - 1.5;
      out.push({ kind, size, n, k, ctx: ctxName, disc: [Math.round(b.width), Math.round(b.height)], air: +lineAir(el, cx, cy, R).toFixed(1) });
    }
    el.textContent = orig; c.style.fontSize = "";
  } else {
    const core = document.querySelector('[data-testid="syntx-pool-core"]'); const content = core.querySelector('div[style*="max-width"]'); const el = content.children[2]; const orig = el.textContent;
    const cb = core.getBoundingClientRect(); const cx = (cb.left + cb.right) / 2, cy = (cb.top + cb.bottom) / 2, R = cb.width / 2;
    for (const size of sizes) for (const { n, k, w } of words) for (const [ctxName, text] of [["alone", w], ["first", `${w} POOL EU`], ["last", `DLL ENGINEERING ${w}`]]) {
      el.style.fontSize = size; el.textContent = text; const r = document.createRange(); r.selectNodeContents(el); const maxW = Math.max(...[...r.getClientRects()].map(q => q.width));
      out.push({ kind, size, n, k, ctx: ctxName, overContent: +(maxW - content.getBoundingClientRect().width).toFixed(1), air: +lineAir(el, cx, cy, R).toFixed(1) });
    }
    el.textContent = orig; el.style.fontSize = "";
  }
  return out;
}, { kind, sizes, words });
await page.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${P}&investigationMode=PERSON`, { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
rows.push(...await measure("pool", ["10.5px", "12px", "14px"]));
await page.goto(`${BASE}/career/demo?focus=FIELD&jobPoolUploadId=${P}&jobOrganizationId=org_kestrel&investigationMode=PERSON`, { waitUntil: "networkidle" }); await page.waitForTimeout(2000);
rows.push(...await measure("centre", ["11px", "12px", "13px"]));
writeFileSync(OUT, JSON.stringify(rows));
// Largest word length per kind/size whose worst case (all letter sets, all positions) keeps air >= 0 (and, for the pool, within the content width).
const summary = {};
for (const r of rows) { const key = `${r.kind} ${r.size}`; (summary[key] ??= {}); const ok = r.air >= 0 && (r.overContent === undefined || r.overContent <= 0.5); summary[key][r.n] = (summary[key][r.n] ?? true) && ok; }
for (const [key, m] of Object.entries(summary)) { let fit = 0; for (let n = 12; n <= 26; n++) { if (m[n]) fit = n; else break; } const worst = rows.filter(r => `${r.kind} ${r.size}` === key); console.log(key, "fits up to", fit, "| air by n (worst):", [...new Set(worst.map(r => r.n))].map(n => `${n}:${Math.min(...worst.filter(r => r.n === n).map(r => r.air))}`).join(" ")); }
await browser.close();
