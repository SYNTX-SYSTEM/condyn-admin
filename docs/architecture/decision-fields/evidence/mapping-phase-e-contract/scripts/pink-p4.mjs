/**
 * PINK · PHASE-E · P-4 both directions, measured on PINK's own render at 9cc06f84.
 * Rising (own fit changed) must be EVIDENCE: data-change=EVIDENCE, a brightness transient (peak ~1.77), and a CUT —
 *   it crosses only its two endpoints, no eased intermediates.
 * Steady (displaced only) must be LAYOUT: data-change=LAYOUT, filter none in EVERY frame (no luminance), and an
 *   EASE — it crosses many distinct places over ~850 ms.
 * Positions read from the COMPUTED transform. High-rate sampling (50 ms) to resolve the glide.
 */
import { chromium } from "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3120";
const AN = "CAN_00000000000000000000000000000002";
const L0 = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const POOL = "JPOOL_AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
const RISING = `mapping-body-${POOL}:role_x`, STEADY = `mapping-body-${POOL}:role_y`;
const browser = await chromium.launch();
async function ctl(p) { return (await fetch(`${BASE}${p}`)).json(); }
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: "no-preference" });
const page = await ctx.newPage();
await page.goto(L0, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1500);
if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) { await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {}); await page.waitForTimeout(300); }
const SAMPLE = (rising, steady) => {
  const g = id => { const e = document.querySelector(`[data-testid="${id}"]`); if (!e) return null; const cs = getComputedStyle(e); const f = cs.filter; let bright = 1; const m = /brightness\(([^)]+)\)/.exec(f); if (m) bright = parseFloat(m[1]); return { tr: cs.transform, change: e.getAttribute("data-change"), moved: e.getAttribute("data-moved"), filter: f, bright, op: +(+cs.opacity).toFixed(3), hasTransition: cs.transitionProperty.includes("transform") && cs.transitionDuration !== "0s", anim: cs.animationName }; };
  return { rising: g(rising), steady: g(steady) };
};
const base = await page.evaluate(SAMPLE, [RISING, STEADY]);
// in-page rAF recorder: once either body first shows data-change, record each FRAME for 1400ms — peak brightness
// and the full set of distinct transforms per body (resolves the eased glide and catches the transient peak).
const framesPromise = page.evaluate(({ rising, steady }) => new Promise(resolve => {
  const rec = { rising: { bright: [], tr: new Set(), change: new Set() }, steady: { bright: [], tr: new Set(), change: new Set() } };
  let startedAt = null;
  const read = id => { const e = document.querySelector(`[data-testid="${id}"]`); if (!e) return; const cs = getComputedStyle(e); const m = /brightness\(([^)]+)\)/.exec(cs.filter); const b = m ? parseFloat(m[1]) : 1; const r = id === rising ? rec.rising : rec.steady; r.bright.push(b); r.tr.add(cs.transform); if (e.getAttribute("data-change")) r.change.add(e.getAttribute("data-change")); };
  function frame(now) {
    const re = document.querySelector(`[data-testid="${rising}"]`), se = document.querySelector(`[data-testid="${steady}"]`);
    const active = (re && re.getAttribute("data-change")) || (se && se.getAttribute("data-change"));
    if (startedAt === null && active) startedAt = now;
    if (startedAt !== null) { read(rising); read(steady); if (now - startedAt > 1400) { resolve({ rising: { peakBright: Math.max(1, ...rec.rising.bright), distinctTr: rec.rising.tr.size, changes: [...rec.rising.change], frames: rec.rising.bright.length }, steady: { peakBright: Math.max(1, ...rec.steady.bright), distinctTr: rec.steady.tr.size, changes: [...rec.steady.change], frames: rec.steady.bright.length } }); return; } }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  setTimeout(() => resolve({ rising: { peakBright: Math.max(1, ...rec.rising.bright), distinctTr: rec.rising.tr.size, changes: [...rec.rising.change], frames: rec.rising.bright.length }, steady: { peakBright: Math.max(1, ...rec.steady.bright), distinctTr: rec.steady.tr.size, changes: [...rec.steady.change], frames: rec.steady.bright.length } }), 8000);
}), { rising: RISING, steady: STEADY });
const t0 = Date.now(); await ctl("/__pink/flip?to=B");
const S = [];
for (let i = 0; i < 120; i++) { S.push({ tMs: Date.now() - t0, ...(await page.evaluate(SAMPLE, [RISING, STEADY])) }); await page.waitForTimeout(50); }
const frames = await framesPromise;
await ctx.close(); await browser.close();
const col = (k, f) => S.map(s => s[k]).filter(Boolean).map(f);
const distinct = arr => [...new Set(arr)];
const risingTr = distinct(col("rising", r => r.tr));
const steadyTr = distinct(col("steady", r => r.tr));
const out = {
  commit: "9cc06f84",
  rising: {
    changesSeen: distinct(col("rising", r => r.change)),
    distinctPositions: risingTr.length,
    peakBrightness: Math.max(1, ...col("rising", r => r.bright)),
    transientAnimSeen: distinct(col("rising", r => r.anim)).filter(n => /Transient/.test(n)),
    everHadTransformTransition: col("rising", r => r.hasTransition).some(Boolean),
    firstEvidenceAt: (S.find(s => s.rising?.change === "EVIDENCE") || {}).tMs ?? null
  },
  steady: {
    changesSeen: distinct(col("steady", r => r.change)),
    distinctPositions: steadyTr.length,
    peakBrightness: Math.max(1, ...col("steady", r => r.bright)),
    filterNoneEveryFrame: col("steady", r => r.filter).every(f => f === "none"),
    everHadTransformTransition: col("steady", r => r.hasTransition).some(Boolean),
    firstLayoutAt: (S.find(s => s.steady?.change === "LAYOUT") || {}).tMs ?? null
  }
};
out.rafFrames = frames;
out.verdict = {
  EVIDENCE_cut: out.rising.changesSeen.includes("EVIDENCE") && frames.rising.peakBright > 1.3 && frames.rising.distinctTr <= 3,
  LAYOUT_ease: out.steady.changesSeen.includes("LAYOUT") && out.steady.filterNoneEveryFrame && frames.steady.peakBright < 1.01 && frames.steady.distinctTr >= 6,
  directions_disjoint: !out.rising.changesSeen.includes("LAYOUT") && !out.steady.changesSeen.includes("EVIDENCE")
};
console.log(JSON.stringify(out, null, 1));
