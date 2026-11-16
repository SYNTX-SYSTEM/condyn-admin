/** PINK · PHASE G · PF-15 · what shelf alpha actually satisfies A-G66's local-ground limb, MEASURED.
 *
 *  WHY A SWEEP AND NOT ARITHMETIC. The quantised-triple model (alpha x INK, rounded, through the WCAG
 *  transfer) reproduces every MEASURED band value in `PF15.json` exactly -- rgb(4,5,5) at 0.02 and
 *  rgb(5,6,6) at 0.022, matching GRÜN's 0.0014531 / 0.0017566 to five figures. But the model predicts
 *  rgb(5,5,6) at 0.022, one code step BELOW what Chrome rendered. **A model that is wrong by one code at
 *  the one alpha both lanes measured cannot be trusted to name the alpha that clears a bound, because at
 *  these levels one code step is 14 % of the whole quantity.** So the alpha is measured, not solved.
 *
 *  WHAT IS MEASURED AT EACH ALPHA, at 1920 only (the band's luminance is resolution-independent -- PF15.json
 *  shows an identical p50 at both sizes -- while limb (a)'s share is not, so the share is reported as the
 *  1920 reading and not generalised):
 *    - the band's masked median (A-G65's statistic, same mask-by-vanishing-diff as PF15.json)
 *    - the outer local ground, A-G66's verdict-carrying side
 *    - the ratio, against >= 1.6
 *    - limb (a): the four rings' share of disc light over the semantic share, against <= 0.08
 *  Because brightening the band to satisfy A-G66 SPENDS limb (a)'s budget, both must be read at the same
 *  alpha or the answer is not an answer. That tension is the point of the sweep.
 *
 *  This reports a RANGE, not a recommendation. The constant is GRÜN's and the bound is GELB's.
 */
import { playwright, sharpModule, provenance } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const PINK_PROV_3ec8457d = await provenance({ declaredCommit: "3ec8457d", declaredBuildId: "xCD8LBxdjnP97-2Gjs5yr" });
const chromium = await playwright();
const sharp = await sharpModule();
const BASE = process.env.PINK_BASE ?? "http://127.0.0.1:3122";
const AN = "CAN_00000000000000000000000000000002";
const URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${AN}`;
const INK = "205, 240, 255", ANGLES = 720;
const ALPHAS = [0, 0.005, 0.01, 0.02, 0.022, 0.026, 0.030, 0.034, 0.040, 0.044];
const LUT = new Float64Array(256);
for (let i = 0; i < 256; i++) { const c = i / 255; LUT[i] = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
const GROUP = { bodies: '[data-mapping-body]', glows: '.mf-halo', arcs: '[data-mapping-arc]', beams: '[data-beam]',
  beamGlow: '.mf-beam-glow', travel: '.mf-travel', nodes: '[data-mapping-node]', text: 'text' };
const SEM = Object.values(GROUP).join(","), ALL_RINGS = '[data-testid^="mapping-ring"]';
const med = a => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y), i = (s.length - 1) / 2;
  return Math.floor(i) === Math.ceil(i) ? s[i] : (s[Math.floor(i)] + s[Math.ceil(i)]) / 2; };

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
const page = await ctx.newPage();
await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForSelector('[data-testid="mapping-field"]', { timeout: 30000 });
await page.waitForTimeout(1800);
while (await page.locator('[data-testid="guided-onboarding-overlay"]').count() > 0) {
  await page.locator('[data-testid="onboarding-close-btn"]').first().click().catch(() => {});
  await page.keyboard.press("Escape").catch(() => {}); await page.waitForTimeout(400); }
if (await page.locator('[data-testid="guided-onboarding-overlay"]').count() !== 0) throw new Error("ABORT overlay present");

const geo = await page.evaluate(() => {
  const svg = document.querySelector('[data-testid="mapping-field-svg"]').getBoundingClientRect();
  const g = {}; for (const key of ["shelf", "field", "horizon"]) { const el = document.querySelector(`[data-testid="mapping-ring-${key}"]`);
    const bb = el.getBoundingClientRect(); g[key] = { cx: bb.x + bb.width / 2, cy: bb.y + bb.height / 2,
      rAttr: Number(el.getAttribute('r')), w: Number(el.getAttribute('stroke-width')) }; }
  const vb = document.querySelector('[data-testid="mapping-field-svg"]').getAttribute('viewBox').split(/\s+/).map(Number);
  return { clip: { x: Math.round(svg.x), y: Math.round(svg.y), width: Math.round(svg.width), height: Math.round(svg.height) }, g, k: svg.width / vb[2] };
});
const clip = geo.clip, W = clip.width, H = clip.height, N = W * H, k = geo.k;
const cx = geo.g.field.cx - clip.x, cy = geo.g.field.cy - clip.y;
const rShelf = geo.g.shelf.rAttr * k, wShelf = geo.g.shelf.w * k;
const rFieldFar = geo.g.field.rAttr * k + geo.g.field.w * k / 2;
// The disc is the FIELD ring's outer edge -- `field` (r=500 user) is the OUTERMOST ring, not `horizon` (r=400).
// An earlier version of this sweep used the horizon radius and so excluded the shelf band from the disc
// entirely; the tell was a rings-share bit-identical at ten alphas while the band's median tracked each one.
const rDisc = rFieldFar;
const outerR = rFieldFar + 6;
const disc = new Uint8Array(N); let discN = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const dx = x - cx, dy = y - cy; if (dx * dx + dy * dy <= rDisc * rDisc) { disc[y * W + x] = 1; discN++; } }

const cdp = await page.context().newCDPSession(page);
const lumFrame = async () => { const { data } = await cdp.send("Page.captureScreenshot", { format: "png", clip: { ...clip, scale: 1 }, optimizeForSpeed: true });
  const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
  const ch = s.info.channels, d = s.data, L = new Float64Array(N);
  for (let i = 0; i < N; i++) { const q = i * ch; L[i] = 0.2126 * LUT[d[q]] + 0.7152 * LUT[d[q + 1]] + 0.0722 * LUT[d[q + 2]]; }
  return L; };
const bil = (L, x, y) => { const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0;
  if (x0 < 0 || y0 < 0 || x0 + 1 >= W || y0 + 1 >= H) return null;
  return L[y0 * W + x0] * (1 - fx) * (1 - fy) + L[y0 * W + x0 + 1] * fx * (1 - fy)
       + L[(y0 + 1) * W + x0] * (1 - fx) * fy + L[(y0 + 1) * W + x0 + 1] * fx * fy; };
const ringAt = (L, r) => { const v = []; for (let a = 0; a < ANGLES; a++) { const th = a * 2 * Math.PI / ANGLES;
    const s = bil(L, cx + r * Math.cos(th), cy + r * Math.sin(th)); if (s !== null) v.push(s); } return v; };
const sumDisc = L => { let s = 0; for (let i = 0; i < N; i++) if (disc[i]) s += L[i]; return s; };
const hide = async sel => { const h = await page.addStyleTag({ content: `${sel}{visibility:hidden !important}` });
  await page.waitForTimeout(430); const L = await lumFrame(); await h.evaluate(e => e.remove()); await page.waitForTimeout(380); return L; };
const setAlpha = async a => { await page.evaluate(([ink, v]) => { const el = document.querySelector('[data-testid="mapping-ring-shelf"]');
    el.setAttribute('stroke', `rgba(${ink}, ${v})`); el.setAttribute('data-ring-luminance', String(v)); }, [INK, a]); await page.waitForTimeout(420); };

const rows = [];
for (const a of ALPHAS) {
  await setAlpha(a);
  const base1 = await lumFrame(), base2 = await lumFrame();
  const s1 = ringAt(base1, rShelf), s2 = ringAt(base2, rShelf);
  let repeat = 0; for (let i = 0; i < s1.length; i++) repeat = Math.max(repeat, Math.abs(s1[i] - s2[i]));
  const EPS = Math.max(repeat * 2, 1e-9);
  const noShelf = ringAt(await hide('[data-testid="mapping-ring-shelf"]'), rShelf);
  const kept = []; for (let i = 0; i < s1.length; i++) if (s1[i] - noShelf[i] > EPS) kept.push(s1[i]);
  const bandP50 = med(kept), outerP50 = med(ringAt(base1, outerR));
  const full = sumDisc(base1);
  const ringsShare = (full - sumDisc(await hide(ALL_RINGS))) / full;
  const semShare = (full - sumDisc(await hide(SEM))) / full;
  // alpha 0 emits nothing, so EVERY angle's own contribution falls under the mask epsilon and `kept` is empty.
  // That is the mask working, not the instrument failing: it is the negative limb A-G197 asks for, and it is
  // kept in the sweep precisely because a statistic that cannot return "no band here" cannot be trusted when
  // it returns a number. A-G66 is not applicable at alpha 0; limb (a) still is, and is the useful reading --
  // it gives the rings' share with the shelf band contributing nothing at all.
  const ratio = bandP50 === null ? null : bandP50 / outerP50, sub = ringsShare / semShare;
  rows.push({ alpha: a, maskEpsilon: +EPS.toExponential(4), anglesKept: kept.length, anglesSampled: s1.length,
    maskRejectedEveryAngle: kept.length === 0,
    bandMedian: bandP50 === null ? null : +bandP50.toExponential(6), outerGroundMedian: +outerP50.toExponential(6),
    AG66_ratio: ratio === null ? null : +ratio.toFixed(4), AG66_clears_1_6: ratio === null ? null : ratio >= 1.6,
    limbA_ringsShare: +ringsShare.toFixed(5), limbA_semShare: +semShare.toFixed(5),
    limbA_ratio: +sub.toFixed(5), limbA_clears_0_08: sub <= 0.08,
    bothLimbsClear: ratio !== null && ratio >= 1.6 && sub <= 0.08 });
  console.error(`alpha ${a}: band ${bandP50 === null ? "none (mask rejected all angles)" : bandP50.toExponential(5)} ratio ${ratio === null ? "n/a" : ratio.toFixed(4)} ${ratio === null ? "AG66 n/a" : ratio >= 1.6 ? "AG66 OK" : "AG66 fail"} | limbA ${sub.toFixed(5)} ${sub <= 0.08 ? "OK" : "FAIL"}`);
}
await ctx.close(); await b.close();

const ok = rows.filter(r => r.bothLimbsClear);
console.log(JSON.stringify({ commit: PINK_PROV_3ec8457d.observedCommit, buildId: PINK_PROV_3ec8457d.observedBuildId,
  reading: "PINK — shelf alpha measured against A-G66's local-ground limb and PF-15 limb (a) together",
  verdict: "NONE — a measured range, not a recommendation. The constant is GRÜN's and the bound is GELB's.",
  viewport: "1920x1080", motion: "reduce", statistic: "masked median over 720 band angles (A-G65)",
  discRadiusDevicePx: +rDisc.toFixed(3), discIsFieldRingOuterEdge: true,
  builtAlpha: 0.02, gruenNewAlpha: 0.022,
  smallestAlphaClearingBoth: ok.length ? ok[0].alpha : null,
  limbAHeadroomAtThatAlpha: ok.length ? { ratio: ok[0].limbA_ratio, bound: 0.08 } : null,
  rows }, null, 2));
