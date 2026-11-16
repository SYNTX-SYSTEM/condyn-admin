import { playwright } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const BASE = "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
const page = await ctx.newPage();
const fetches = [];
page.on("requestfinished", async r => { try { if (new URL(r.url()).pathname.startsWith("/api")) fetches.push(r.url().split("/api")[1]); } catch {} });
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1800);
const overlayBefore = await page.locator('[data-testid="guided-onboarding-overlay"]').count();
const info = await page.evaluate(() => {
  const q = s => document.querySelector(s);
  const bb = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { x:+r.x.toFixed(1), y:+r.y.toFixed(1), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }; };
  const svg = q('[data-testid="mapping-field-svg"]') || q('[data-testid="mapping-field"] svg');
  const ring = q('[data-testid="mapping-ring-field"]');
  const bodies = [...document.querySelectorAll('[data-mapping-body]')].map(e=>({id:e.getAttribute("data-testid"),bb:bb(e)}));
  // candidate capability-node selectors
  const capSel = ['[data-mapping-cap]','[data-mapping-capability]','[data-capability-node]','[data-testid^="mapping-cap"]','[data-mapping-node]'];
  const caps = {}; capSel.forEach(s=>caps[s]=document.querySelectorAll(s).length);
  // all data-* attributes present on svg descendants (names only)
  const attrs = new Set();
  svg && svg.querySelectorAll("*").forEach(e=>{ for (const a of e.attributes) if (a.name.startsWith("data-")) attrs.add(a.name); });
  return { svg: bb(svg), svgTag: svg?.tagName, field: bb(q('[data-testid="mapping-field"]')), ring: bb(ring), ringTag: ring?.tagName, nBodies: bodies.length, bodies: bodies.slice(0,3), caps, svgDataAttrs: [...attrs].sort() };
});
await ctx.close(); await b.close();
console.log(JSON.stringify({ overlayBefore, firstFetches: fetches, ...info }, null, 1));
