/**
 * PINK · PHASE-E PREP-2 · sharpen instruments per §11/§12 rulings, validate on the 86e36924 baseline.
 *  P-6 restated: (a) no non-zero computed animation/transition duration in the field AND (b) the field does not
 *      move (sample every drawn element's geometry+opacity twice >=2s apart, all identical). Plus a CONTROL with
 *      motion ON to prove the sampler actually detects movement (so (b) is not blind).
 *  P-7 corrected set: outermost DRAWN element (incl. sector NAMES — the set A-1 says falls outside) inside the
 *      stage box, and the stage box inside the section box. E-8a: the host scroll, measured and reported.
 *  P-8 @1280x800: min structure stroke, min SVG text px (cross-check GRÜN's 0.49 / 5.96), min beam where present.
 * Own render, own numbers. Not a GO.
 */
import { playwright, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const PINK_PROV_86e36924 = await provenance({ declaredCommit: "86e36924" });
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const A = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${A}`;
const browser = await chromium.launch();
const report = { base: BASE, commit: PINK_PROV_86e36924.observedCommit };

async function openL0(page) {
  await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
  await page.waitForTimeout(1200);
  if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
    await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
    await page.waitForTimeout(400);
  }
}
// serialize a stable snapshot of every drawn element: geometry + opacity + key animated attrs
const SAMPLE = () => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]');
  if (!svg) return { error: "no svg" };
  // every element under the svg, including <g> wrappers (group opacity does NOT show on children's computed opacity)
  const els = [svg, ...svg.querySelectorAll("*")];
  const snap = {};
  els.forEach((el, i) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const key = (el.getAttribute("data-testid") || el.tagName + i);
    snap[key + "#" + i] = [
      +r.x.toFixed(2), +r.y.toFixed(2), +r.width.toFixed(2), +r.height.toFixed(2),
      (+cs.opacity).toFixed(3), cs.transform, cs.visibility,
      el.getAttribute("transform") || "", el.getAttribute("cx") || "", el.getAttribute("cy") || "", el.getAttribute("r") || "", el.getAttribute("opacity") || ""
    ].join("|");
  });
  return snap;
};
const diffSnaps = (a, b) => {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const moved = [];
  for (const k of keys) if (a[k] !== b[k]) moved.push({ key: k, from: a[k], to: b[k] });
  return moved;
};
const durationsScan = () => {
  const field = document.querySelector('[data-testid="mapping-field"]');
  if (!field) return { scanned: 0, offenders: [] };
  const all = [field, ...field.querySelectorAll("*")];
  const pm = v => Math.max(0, ...String(v || "0s").split(",").map(s => { s = s.trim(); return s.endsWith("ms") ? parseFloat(s) : s.endsWith("s") ? parseFloat(s) * 1000 : 0; }).filter(n => !Number.isNaN(n)));
  const off = [];
  for (const el of all) { const cs = getComputedStyle(el); const a = pm(cs.animationDuration), t = pm(cs.transitionDuration); if (a > 0 || t > 0) off.push({ testid: el.getAttribute?.("data-testid") || el.tagName, animName: cs.animationName, aMs: a, tMs: t }); }
  return { scanned: all.length, offenders: off.slice(0, 40), offenderCount: off.length };
};

// ---- P-6 (a)+(b) under reduced motion ----
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await openL0(page);
  // exercise selection too (query motion path), then settle
  const node = page.locator("[data-mapping-node]").first();
  if (await node.count()) { await node.dispatchEvent("click").catch(() => {}); await page.waitForTimeout(600); }
  const dur = await page.evaluate(durationsScan);
  const s1 = await page.evaluate(SAMPLE);
  await page.waitForTimeout(2200);
  const s2 = await page.evaluate(SAMPLE);
  const moved = diffSnaps(s1, s2);
  report.P6_reducedMotion = { reducedMotion: await page.evaluate(() => matchMedia("(prefers-reduced-motion: reduce)").matches), durations: dur, movedCount: moved.length, moved: moved.slice(0, 20), pass: dur.offenderCount === 0 && moved.length === 0 };
  await ctx.close();
}
// ---- P-6 CONTROL: motion ON, the sampler must detect movement ----
{
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
  const page = await ctx.newPage();
  await openL0(page);
  const node = page.locator("[data-mapping-node]").first();
  if (await node.count()) { await node.dispatchEvent("click").catch(() => {}); await page.waitForTimeout(600); }
  const dur = await page.evaluate(durationsScan);
  const s1 = await page.evaluate(SAMPLE);
  await page.waitForTimeout(2200);
  const s2 = await page.evaluate(SAMPLE);
  const moved = diffSnaps(s1, s2);
  report.P6_control_motionOn = { durationsOffenderCount: dur.offenderCount, animNames: [...new Set(dur.offenders.map(o => o.animName))], movedCount: moved.length, movedSample: moved.slice(0, 8), samplerDetectsMotion: moved.length > 0 || dur.offenderCount > 0 };
  await ctx.close();
}

// ---- P-7 corrected set + section box + E-8a ----
report.P7 = [];
for (const size of [{ w: 1280, h: 800 }, { w: 1600, h: 1000 }, { w: 1829, h: 912 }, { w: 2560, h: 1300 }]) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h } });
  const page = await ctx.newPage();
  await openL0(page);
  const g = await page.evaluate(() => {
    const I = t => `[data-testid="${t}"]`;
    const R = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: +r.top.toFixed(1), bottom: +r.bottom.toFixed(1), left: +r.left.toFixed(1), right: +r.right.toFixed(1) }; };
    const svg = document.querySelector(I("mapping-field-svg"));
    const stage = R(svg);
    // the section = nearest positioned ancestor of the svg that is inset:0 of the host; walk up for a 'mapping' container
    let node = svg?.parentElement, section = null, sectionId = null;
    while (node) { const cs = getComputedStyle(node); if (cs.position === "absolute" || cs.position === "relative" || cs.position === "fixed") { section = node; sectionId = node.getAttribute("data-testid"); if ((sectionId || "").includes("mapping")) break; } node = node.parentElement; }
    const field = document.querySelector(I("mapping-field"));
    // corrected drawn set: bodies, nodes, arcs, sector NAMES, rings
    const drawn = [...document.querySelectorAll('[data-mapping-body],[data-mapping-node],[data-mapping-arc],[data-testid^="mapping-sector-name-"],[data-testid^="mapping-ring"]')];
    const rects = drawn.map(d => ({ id: d.getAttribute("data-testid") || d.tagName, ...R(d) })).filter(x => x.top !== undefined);
    const outB = rects.reduce((m, r) => r.bottom > m.bottom ? r : m, rects[0]);
    const outT = rects.reduce((m, r) => r.top < m.top ? r : m, rects[0]);
    const outL = rects.reduce((m, r) => r.left < m.left ? r : m, rects[0]);
    const outR = rects.reduce((m, r) => r.right > m.right ? r : m, rects[0]);
    const insideStage = r => stage && r.top >= stage.top - 0.5 && r.bottom <= stage.bottom + 0.5 && r.left >= stage.left - 0.5 && r.right <= stage.right + 0.5;
    const stageInsideSection = section && stage ? (stage.top >= R(section).top - 0.5 && stage.bottom <= R(section).bottom + 0.5 && stage.left >= R(section).left - 0.5 && stage.right <= R(section).right + 0.5) : null;
    const de = document.documentElement;
    const dash = document.querySelector(I("career-intelligence-dashboard"));
    const host = document.querySelector(I("semantic-career-intelligence-field"));
    return {
      innerW: window.innerWidth, innerH: window.innerHeight,
      stage, section: section ? { id: sectionId, ...R(section) } : null,
      outermostBottom: outB, outermostTop: outT, outermostLeft: outL, outermostRight: outR,
      outermostBottomInsideStage: insideStage(outB), outermostTopInsideStage: insideStage(outT),
      outermostLeftInsideStage: insideStage(outL), outermostRightInsideStage: insideStage(outR),
      stageInsideSection,
      dashScrollH: de.scrollHeight, pageScrolls: de.scrollHeight > window.innerHeight + 1,
      dashboardH: dash ? +dash.getBoundingClientRect().height.toFixed(1) : null,
      hostH: host ? +host.getBoundingClientRect().height.toFixed(1) : null
    };
  });
  const p7pass = (g.outermostBottomInsideStage && g.outermostTopInsideStage && g.outermostLeftInsideStage && g.outermostRightInsideStage && g.stageInsideSection === true);
  report.P7.push({ size, p7pass, ...g });
  await ctx.close();
}

// ---- P-8 @1280x800 ----
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await openL0(page);
  report.P8_1280x800 = await page.evaluate(() => {
    const svg = document.querySelector('[data-testid="mapping-field-svg"]');
    if (!svg) return { error: "no svg" };
    const strokeEls = [...svg.querySelectorAll("circle,path,line,rect")].map(e => { const cs = getComputedStyle(e); const w = parseFloat(cs.strokeWidth); return { id: e.getAttribute("data-testid") || e.tagName, strokeWidth: isNaN(w) ? null : +w.toFixed(3), hasStroke: cs.stroke !== "none" && cs.stroke !== "" }; }).filter(x => x.hasStroke && x.strokeWidth != null && x.strokeWidth > 0);
    const texts = [...svg.querySelectorAll("text")].map(t => { const cs = getComputedStyle(t); return { id: t.getAttribute("data-testid") || "text", fontPx: +parseFloat(cs.fontSize).toFixed(2) }; });
    const beams = [...svg.querySelectorAll('[data-testid="mapping-beams"] line')].map(l => { const w = parseFloat(getComputedStyle(l).strokeWidth); return isNaN(w) ? null : +w.toFixed(3); }).filter(x => x != null);
    return {
      minStroke: strokeEls.length ? Math.min(...strokeEls.map(s => s.strokeWidth)) : null,
      minStrokeEl: strokeEls.sort((a, b) => a.strokeWidth - b.strokeWidth)[0] || null,
      strokeCount: strokeEls.length,
      minTextPx: texts.length ? Math.min(...texts.map(t => t.fontPx)) : null,
      textCount: texts.length,
      beamCount: beams.length, minBeam: beams.length ? Math.min(...beams) : null
    };
  });
  await ctx.close();
}

console.log(JSON.stringify(report, null, 1));
await browser.close();
