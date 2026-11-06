/**
 * PINK · PHASE-E · P-8 in RENDERED CSS PIXELS (§14 binding) at the worst window 1280×800.
 * Fixes PINK's own recurring defect: getComputedStyle stroke-width / font-size on SVG return USER UNITS; the
 * binding floors are rendered px = userValue × (svg client width / viewBox width). Floors: stroke 1.2, beam 1.0,
 * body 12, text 11 — all rendered px. Compare to GELB §16 (stroke 1.2, beams 1.57, text 11.02, 4 bodies at floor).
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1500);
if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
  await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
  await page.waitForTimeout(300);
}
const out = await page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  const vb = (svg.getAttribute("viewBox") || "0 0 0 0").split(/\s+/).map(Number);
  const clientW = svg.getBoundingClientRect().width;
  const scale = clientW / vb[2]; // uniform viewBox→viewport scale (preserveAspectRatio default)
  const px = u => +(u * scale).toFixed(3);
  // structure strokes: computed stroke actually paints (not "none"), width>0, excluding the beams group
  const beamsGroup = svg.querySelector('[data-testid="mapping-beams"]');
  const isBeam = e => beamsGroup && beamsGroup.contains(e);
  const strokeEls = [...svg.querySelectorAll("circle,path,line,rect")].map(e => {
    const cs = getComputedStyle(e); const w = parseFloat(cs.strokeWidth);
    return { id: e.getAttribute("data-testid") || e.getAttribute("data-arc-line") !== null ? "arc-line" : (e.getAttribute("data-ring-luminance") ? "ring" : e.tagName), paints: cs.stroke !== "none" && cs.stroke !== "" && !isNaN(w) && w > 0, wU: w, beam: isBeam(e) };
  }).filter(x => x.paints);
  const structure = strokeEls.filter(x => !x.beam);
  const beams = strokeEls.filter(x => x.beam);
  const texts = [...svg.querySelectorAll("text")].map(t => parseFloat(getComputedStyle(t).fontSize)).filter(v => !isNaN(v));
  // bodies: the body shape circle radius → diameter in px (the dot that must stay ≥ 12px)
  const bodyShapes = [...svg.querySelectorAll('[data-mapping-body-shape]')].map(c => { const r = parseFloat(c.getAttribute("r")); return r; }).filter(v => !isNaN(v));
  const minStructU = Math.min(...structure.map(s => s.wU));
  const minBeamU = beams.length ? Math.min(...beams.map(s => s.wU)) : null;
  const minTextU = texts.length ? Math.min(...texts) : null;
  const bodyDiaPx = bodyShapes.map(r => px(2 * r)).sort((a, b) => a - b);
  const minBodyPx = bodyDiaPx[0] ?? null;
  return {
    viewBoxW: vb[2], svgClientW: +clientW.toFixed(2), scale: +scale.toFixed(4),
    renderedPx: {
      minStroke: px(minStructU), minStrokeEl: structure.sort((a, b) => a.wU - b.wU)[0]?.id,
      minBeam: minBeamU === null ? null : px(minBeamU), beamCount: beams.length,
      minText: minTextU === null ? null : px(minTextU), textCount: texts.length,
      minBody: minBodyPx, bodyCount: bodyDiaPx.length, bodiesAtFloor: bodyDiaPx.filter(d => Math.abs(d - 12) < 0.6).length, bodyDiaPx
    },
    floors: { stroke: 1.2, beam: 1.0, body: 12, text: 11 },
    pass: { stroke: px(minStructU) >= 1.2 - 0.02, beam: minBeamU === null || px(minBeamU) >= 1.0 - 0.02, text: minTextU === null || px(minTextU) >= 11 - 0.05, body: minBodyPx === null || minBodyPx >= 12 - 0.1 }
  };
});
console.log(JSON.stringify({ commit: "716a1941", window: "1280x800", ...out }, null, 1));
await ctx.close();
await browser.close();
