// The application shell row at many widths, both fields, English and German: every shell control's box and the smallest horizontal
// air between two controls whose boxes share rows (negative = overlap). argv: <lab state.json> [out.json]. Run from the repository root.
import { readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
const playwright = await import(pathToFileURL(process.env.CONDYN_PLAYWRIGHT_MODULE).href);
const { chromium } = playwright.chromium ? playwright : playwright.default;
const [STATE, OUT] = process.argv.slice(2);
const BASE = JSON.parse(readFileSync(STATE, "utf8")).base;
const IDS = ["job-scope-indicator", "field-focus-strip", "investigation-mode-selector", "semantic-guide-drawer-toggle", "how-this-works-btn", "open-system-codex-btn"];
const browser = await chromium.launch(); const rows = [];
const DOCK = new Set(["semantic-guide-drawer-toggle", "how-this-works-btn", "open-system-codex-btn"]);
for (const width of [1280, 1366, 1440, 1600, 1920]) for (const lang of ["en", "de"]) for (const focus of ["CAPABILITY", "JOB"]) {
  const ctx = await browser.newContext({ viewport: { width, height: 800 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("condyn_onboarding_seen", "1"); } catch {} });
  const page = await ctx.newPage(); await page.goto(`${BASE}/career/demo${focus === "JOB" ? "?focus=FIELD" : ""}`, { waitUntil: "networkidle" });
  await page.getByTestId("field-focus-strip").waitFor({ timeout: 60000 });
  // The Capability Field opens without a job only under PERSON (the explicit boundary); then the field is chosen.
  if (focus === "CAPABILITY") { await page.getByTestId("investigation-mode-PERSON").click(); await page.getByTestId("field-focus-capability-btn").click(); }
  if (lang === "de") { await page.getByTestId("open-system-codex-btn").click(); await page.getByTestId("switch-lang-de").click(); await page.getByTestId("system-codex-close").click(); }
  await page.waitForTimeout(800);
  const boxes = await page.evaluate(ids => {
    const out = {};
    for (const id of ids) { const el = document.querySelector(`[data-testid="${id}"]`); if (el) { const b = el.getBoundingClientRect(); if (b.width > 0) out[id] = [b.left, b.top, b.right, b.bottom]; } }
    // The brand line of the header (its text extent).
    const brand = document.querySelector('[data-testid="shell-brand-dll"]')?.parentElement ?? document.querySelector("header");
    if (brand) { const r = document.createRange(); r.selectNodeContents(brand); const b = r.getBoundingClientRect(); out.brand = [b.left, b.top, b.right, b.bottom]; }
    return out;
  }, IDS);
  let air = Infinity, pair = "";
  const keys = Object.keys(boxes);
  for (let i = 0; i < keys.length; i += 1) for (let j = i + 1; j < keys.length; j += 1) {
    const a = boxes[keys[i]], b = boxes[keys[j]];
    if (Math.min(a[3], b[3]) - Math.max(a[1], b[1]) <= 0) continue; // not on a shared row
    const gap = Math.max(a[0], b[0]) - Math.min(a[2], b[2]);
    if (DOCK.has(keys[i]) && DOCK.has(keys[j]) && Math.abs(gap) <= 1.5) continue; // the meta dock's segments meet by design
    if (gap < air) { air = gap; pair = `${keys[i]} | ${keys[j]}`; }
  }
  rows.push({ width, lang, field: focus, air: Math.round(air * 10) / 10, pair, boxes });
  console.log(`${width} ${lang} ${focus.padEnd(10)} air ${Math.round(air * 10) / 10} px  ${pair}`);
  await ctx.close();
}
if (OUT) writeFileSync(OUT, JSON.stringify(rows, null, 1));
await browser.close();
