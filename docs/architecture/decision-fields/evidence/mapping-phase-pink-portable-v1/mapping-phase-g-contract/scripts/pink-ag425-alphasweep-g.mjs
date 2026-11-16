/** PINK · PHASE G · §38 / A-G425 — SWEEP the renderer's alpha quantisation instead of solving for it.
 *  GELB (§95) identifies the model as alpha -> round(alpha*255)/255 then channel, and it predicts both
 *  triples I measured (0.02 and 0.022). But it DISCRIMINATES from the naive model at exactly ONE of those
 *  two points, and GELB then quotes its output at alpha = 0.05 — where it has never been checked — to
 *  produce a corrected 2.030x ratio. That is A-G425 again, one model deeper: a better model, still
 *  unvalidated at the point that carries the claim.
 *
 *  AND THIS NEEDS NO PRODUCTION BUILD. I told the owner that measuring alpha 0.05 required building
 *  9cc06f84. That conflated two questions: "what did the shelf band look like on that build" (needs the
 *  build) with "what bytes does this renderer emit for rgba(205,240,255,a) over opaque black" (a property
 *  of the RENDERER, testable here). The conversion question only ever needed the second.
 *
 *  So: sweep alpha, render in the SAME browser and the SAME compositor path, read the bytes, and score both
 *  models over the whole sweep rather than at the two points that happened to be measured. The lane's own
 *  standing rule is "sweep the constant, never solve for it" — this is that rule applied to the model.
 *  Two constructs are rendered side by side (an SVG circle STROKE, which is what the shelf band actually is
 *  at :883, and a div background) because agreement between them is a real robustness check and
 *  disagreement would mean the shelf's path is not the path a swatch tests.
 */
import { playwright, sharpModule } from "../../../mapping-phase-pink-tools/pink-tools.mjs";
const chromium = await playwright();
const sharp = await sharpModule();

const INK = [205, 240, 255];
const ALPHAS = [0.01, 0.015, 0.018, 0.02, 0.021, 0.022, 0.024, 0.026, 0.03, 0.035, 0.04, 0.045, 0.05, 0.055, 0.06, 0.085];
const W = [0.2126, 0.7152, 0.0722];
const dec = v => { const c = v / 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = t => W[0] * dec(t[0]) + W[1] * dec(t[1]) + W[2] * dec(t[2]);
const naive = a => INK.map(c => Math.round(a * c));
const aQuant = a => { const ab = Math.round(a * 255) / 255; return INK.map(c => Math.round(ab * c)); };
const same = (x, y) => x[0] === y[0] && x[1] === y[1] && x[2] === y[2];

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
 html,body{margin:0;padding:0;background:#000}
 .row{height:40px;position:relative}
 .sw{position:absolute;left:0;top:0;width:120px;height:40px;background:#000}
 .bg{position:absolute;left:0;top:0;width:120px;height:40px}
 svg{position:absolute;left:140px;top:0}
</style></head><body>
${ALPHAS.map((a, i) => `<div class="row" data-i="${i}">
  <div class="sw"></div><div class="bg" style="background:rgba(${INK[0]},${INK[1]},${INK[2]},${a})"></div>
  <svg width="120" height="40"><rect x="0" y="0" width="120" height="40" fill="rgb(0,0,0)"/>
    <circle cx="60" cy="20" r="14" fill="none" stroke="rgba(${INK[0]},${INK[1]},${INK[2]},${a})" stroke-width="28"/></svg>
</div>`).join("\n")}
</body></html>`;

const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 400, height: 40 * ALPHAS.length + 20 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.setContent(html, { waitUntil: "load" });
await page.waitForTimeout(400);
const cdp = await page.context().newCDPSession(page);
const { data } = await cdp.send("Page.captureScreenshot", { format: "png", optimizeForSpeed: true });
const s = await sharp(Buffer.from(data, "base64")).raw().toBuffer({ resolveWithObject: true });
const ch = s.info.channels, d = s.data, Wd = s.info.width;
const at = (x, y) => { const p = (y * Wd + x) * ch; return [d[p], d[p + 1], d[p + 2]]; };

const rows = ALPHAS.map((a, i) => {
  const y = i * 40 + 20;
  const div = at(60, y);          // div background over opaque black
  const svg = at(140 + 60, y);    // SVG circle STROKE over an opaque black rect — the shelf's own construct
  const n = naive(a), q = aQuant(a);
  return { alpha: a, measured_div: div.join(","), measured_svgStroke: svg.join(","),
    constructsAgree: same(div, svg),
    naive: n.join(","), alphaQuantised: q.join(","),
    naiveMatches: same(div, n), alphaQuantisedMatches: same(div, q),
    modelsDiffer: !same(n, q),
    alphaByte: Math.round(a * 255),
    L_measured: +L(div).toExponential(6), L_naive: +L(n).toExponential(6), L_aQuant: +L(q).toExponential(6) };
});
await ctx.close(); await b.close();

const disc = rows.filter(r => r.modelsDiffer);
const out = { pin: "A-G425 limb 2 (PINK §38)", ink: INK.join(","),
  question: "what bytes does THIS renderer emit for rgba(INK,a) over opaque black — a renderer property, no build required",
  constructs: "div background and SVG circle stroke (the shelf band's own construct at :883), side by side",
  rows,
  summary: {
    total: rows.length,
    constructsAgreeOnAll: rows.every(r => r.constructsAgree),
    naiveCorrect: rows.filter(r => r.naiveMatches).length,
    alphaQuantisedCorrect: rows.filter(r => r.alphaQuantisedMatches).length,
    discriminatingPoints: disc.length,
    naiveCorrectWhereDiscriminating: disc.filter(r => r.naiveMatches).length,
    alphaQuantisedCorrectWhereDiscriminating: disc.filter(r => r.alphaQuantisedMatches).length,
    discriminatingAlphas: disc.map(r => r.alpha) } };
console.log(JSON.stringify(out, null, 1));
