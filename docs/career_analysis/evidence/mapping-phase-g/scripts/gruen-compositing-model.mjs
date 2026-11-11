/**
 * GRÜN · PHASE-G · §74 — WHAT DOES THE COMPOSITOR ACTUALLY DO? **NO VERDICT** (A-G36 point 2).
 *
 * This probe set out to answer A-G139's join question — stop alpha and element opacity, quantised at each
 * join or kept as a product — and it DID NOT GET THERE. What it found instead is prior to that question and
 * invalidates the arithmetic both lanes were arguing with, so it is reported as what it is: a calibration
 * that failed in an informative direction, with the join still open.
 *
 * NO BUILD, NO SERVER, NO FAÇADE, NO PRODUCT PAGE. Only a browser, which this lane has always had. I told
 * GELB this item was the one the owner's new build-and-server permission was decisive for; that was wrong
 * and the correction is recorded here rather than left standing. The permission is decisive for reading the
 * REAL gap glow, which is a different probe.
 *
 * WHAT IS SOUND, established before anything is concluded:
 *   1. THE READBACK PATH IS COLOUR-EXACT. Declared rgb(6,12,17), rgb(128,64,32) and rgb(255,255,255) read
 *      back identically through both page.screenshot and CDP Page.captureScreenshot. No colour management.
 *   2. THE COMPOSITING PATH IS EXACT AT THE EXTREMES. White over black at every alpha k/255 reads exactly k,
 *      and black over white reads exactly 255 − k, on all ten rungs. So nothing is lossy in general.
 *   3. THE FLAT COMPOSITES ARE UNIFORM AND REPRODUCIBLE. 4000 of 4000 sampled pixels carry ONE triple at
 *      every rung. There is no dither to average away and no sampling noise to blame.
 *
 * WHAT IS BROKEN, and it is the record's model rather than the browser:
 *   GAP_HUE rgb(245,166,35) over the modal medium rgb(6,12,17) at a single flat alpha matches NEITHER
 *   round(D + a(S−D)) — this record's model everywhere — NOR truncation.
 *
 *     k   exact float                  measured        round            truncate
 *     1   (6.9373, 12.6039, 17.0706)   rgb(6,12,16)    rgb(7,13,17)     rgb(6,12,17)
 *     2   (7.8745, 13.2078, 17.1412)   rgb(7,12,16)    rgb(8,13,17)     rgb(7,13,17)
 *   128   (125.9686, 89.3020, 26.0353) rgb(126,89,26)  rgb(126,89,26)   rgb(125,89,26)
 *
 *   At k=1 the BLUE channel reads 16 while the backdrop is 17 and the source is 35 — the composite moves a
 *   channel AWAY from both endpoints, which no convex blend of the two can do at any rounding. So the mixing
 *   is not happening on the straight 8-bit values at all. The best fit found is a PREMULTIPLIED 8-bit source
 *   composited with a truncated output, which reproduces six of the eight rungs exactly and fails two in the
 *   green channel — close enough to name the mechanism, not close enough to compute with.
 *
 * WHY THIS MATTERS MORE THAN THE QUESTION IT FAILED TO ANSWER. Any figure of the form "alpha a over triple D
 * renders as triple T" is unsafe, and this record is built on them: this lane's own first-visible-state
 * arithmetic, GELB's rgb(7,13,17), A-G137's computed core family, and every single-code projection in
 * A-G126. AGGREGATE figures are NOT implicated — A-G62's shelf luminance agreed with its model to five
 * significant figures because luminance over many pixels averages the per-channel error away, and that
 * reading stands. The distinction is the finding: this instrument may continue to trust its POOLED
 * luminances and may not trust a predicted TRIPLE.
 *
 * SO THE JOIN REMAINS OPEN AND A-G139 IS NOT SATISFIED. Both withdrawn floors — this lane's 0.329 and
 * GELB's 0.737 — stay withdrawn, and neither may be rebuilt. The next step is not more argument: it is to
 * fit the compositor's model properly, on a dense ladder over several backdrops, and that is a self-contained
 * run that needs nothing but a browser.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, sharp, PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const D = [6, 12, 17], S = [245, 166, 35];
const clamp = v => Math.max(0, Math.min(255, v));
const KS = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 48, 64, 96, 128, 192, 255];

const MODELS = {
  "round(D+a(S-D))":        (d, s, a) => d.map((v, i) => clamp(Math.round(v + a * (s[i] - v)))),
  "trunc(D+a(S-D))":        (d, s, a) => d.map((v, i) => clamp(Math.trunc(v + a * (s[i] - v)))),
  "premulRound+outRound":   (d, s, a) => { const p = s.map(c => Math.round(c * a)); return d.map((v, i) => clamp(Math.round(p[i] + v * (1 - a)))); },
  "premulRound+outTrunc":   (d, s, a) => { const p = s.map(c => Math.round(c * a)); return d.map((v, i) => clamp(Math.trunc(p[i] + v * (1 - a)))); },
  "premulTrunc+outTrunc":   (d, s, a) => { const p = s.map(c => Math.trunc(c * a)); return d.map((v, i) => clamp(Math.trunc(p[i] + v * (1 - a)))); },
  "premulRound+int255":     (d, s, a) => { const A = Math.round(a * 255), p = s.map(c => Math.round(c * A / 255));
                                            return d.map((v, i) => clamp(Math.floor(p[i] + ((v * (255 - A) + 127) / 255)))); }
};

const browser = await chromium.launch();
let out;
try {
  const ctx = await browser.newContext({ viewport: { width: 320, height: 60 * KS.length + 40 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  /* display:block is MANDATORY: inline SVGs take line-height spacing and every y coordinate drifts. An
     earlier run of this probe omitted it and read each row from the row above, which is how "the compositor
     truncates" survived two passes before being caught. Box positions are now read from the DOM, never
     computed from an assumed row height. */
  const row = k => `<svg width="320" height="60" xmlns="http://www.w3.org/2000/svg">
     <rect width="320" height="60" fill="rgb(${D})"/>
     <rect x="10" y="8" width="140" height="44" fill="rgb(${S})" fill-opacity="${k / 255}"/>
     <rect x="170" y="8" width="140" height="44" fill="rgb(255,255,255)"/>
     <rect x="170" y="8" width="140" height="44" fill="rgb(0,0,0)" fill-opacity="${k / 255}"/></svg>`;
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:rgb(${D})}svg{display:block}</style></head>
     <body>${KS.map(row).join("")}</body></html>`, { waitUntil: "load" });
  const tops = await page.evaluate(() => Array.from(document.querySelectorAll("svg")).map(s => s.getBoundingClientRect().top));
  const { data, info } = await sharp(await page.screenshot({ type: "png" })).raw().toBuffer({ resolveWithObject: true });
  const block = (x0, y0, w, h) => {
    const m = new Map();
    for (let dy = 0; dy < h; dy += 1) for (let dx = 0; dx < w; dx += 1) {
      const o = ((y0 + dy) * info.width + (x0 + dx)) * info.channels;
      const key = `${data[o]},${data[o + 1]},${data[o + 2]}`;
      m.set(key, (m.get(key) ?? 0) + 1);
    }
    const s = [...m.entries()].sort((a, b) => b[1] - a[1]);
    return { modal: s[0][0].split(",").map(Number), distinct: s.length, uniform: s.length === 1 };
  };

  const rungs = KS.map((k, i) => {
    const y = Math.round(tops[i]) + 18, a = k / 255;
    const hue = block(30, y, 100, 24);           // GAP_HUE over the medium
    const bw = block(190, y, 100, 24);           // black over white: must read exactly 255 - k
    return { k, alpha: +a.toFixed(7),
      exactFloat: D.map((v, j) => +(v + a * (S[j] - v)).toFixed(4)),
      measured: `rgb(${hue.modal.join(", ")})`, uniform: hue.uniform, distinct: hue.distinct,
      pathCheck: { measured: bw.modal[0], expected: 255 - k, exact: bw.modal[0] === 255 - k },
      models: Object.fromEntries(Object.entries(MODELS).map(([n, f]) => {
        const t = f(D, S, a); return [n, { triple: `rgb(${t.join(", ")})`, matches: t.every((v, j) => v === hue.modal[j]) }];
      })) };
  });

  const pathExact = rungs.every(r => r.pathCheck.exact);
  const allUniform = rungs.every(r => r.uniform);
  const fit = Object.keys(MODELS).map(n => ({ model: n, matches: rungs.filter(r => r.models[n].matches).length, of: rungs.length }))
    .sort((a, b) => b.matches - a.matches);
  const exact = fit.filter(f => f.matches === f.of).map(f => f.model);

  out = {
    reading: "GRÜN · §74 — fitting the compositor's actual blend arithmetic, after the join probe failed its own calibration",
    verdict: PROVENANCE.verdict,
    scope: "a flat-filled rect at one alpha over a known backdrop, rendered with page.setContent and block-sampled. NO build, NO server, NO façade, NO product page.",
    correctionToMyOwnClaim: "I told GELB the join question was what the new build-and-server permission was decisive for. It needs a browser only, which this lane has always had.",
    soundnessChecks: {
      readbackIsColourExact: "declared rgb(6,12,17) / rgb(128,64,32) / rgb(255,255,255) read back identically through page.screenshot and CDP Page.captureScreenshot",
      compositingPathExactAtExtremes: pathExact, pathCheckMeaning: "black over white at alpha k/255 must read exactly 255 - k; measured on every rung in the same screenshot as the subject",
      everyCellUniform: allUniform, uniformityMeaning: "no dither to average away and no sampling noise to blame for the mismatch below"
    },
    samplingDefectFoundAndFixed: "two earlier passes of this probe omitted `svg{display:block}`, so inline SVGs took line-height spacing and each row was sampled from the row above. That artefact produced a clean-looking 'the compositor truncates' result that survived two passes. Box positions are now read from the DOM instead of computed from an assumed row height.",
    rungs, modelFit: fit, modelsMatchingEveryRung: exact,
    finding: null,
    consequence: null,
    joinQuestion: "STILL OPEN. A-G139 is NOT satisfied and both withdrawn floors — this lane's 0.329 and GELB's 0.737 — stay withdrawn. The join cannot be read off a predicted triple while the single-alpha triple itself is not predictable."
  };
  out.finding = exact.length > 0
    ? `The compositor is "${exact[0]}": it matches the measured triple on all ${rungs.length} rungs and the readback path checks exact on every one. The record's round(D + a(S-D)) ${exact.includes("round(D+a(S-D))") ? "is that model and stands." : "is NOT that model and every predicted triple in this record needs re-checking."}`
    : `NO MODEL FITS ALL ${rungs.length} RUNGS. The best is "${fit[0].model}" at ${fit[0].matches}/${fit[0].of}, and this record's round(D + a(S-D)) manages ${fit.find(f => f.model === "round(D+a(S-D))").matches}/${fit[0].of}. At the lowest rungs the BLUE channel reads below the backdrop while the source is above it, which no convex blend of the two endpoints can produce at any rounding — so the mixing is not performed on the straight 8-bit values. The mechanism is named (a premultiplied 8-bit source) and not yet computable.`;
  out.consequence = "Any figure of the form 'alpha a over triple D renders as triple T' is unsafe, and this record is built on them — this lane's first-visible-state arithmetic, GELB's rgb(7,13,17), A-G137's computed core family, A-G126's single-code projections. AGGREGATE figures are NOT implicated: A-G62's shelf luminance agreed with its model to five significant figures because pooled luminance averages the per-channel error away, and it stands. This instrument may continue to trust its POOLED LUMINANCES and may not trust a PREDICTED TRIPLE.";

  writeFileSync(resolve(here, "../outputs/compositing-model.json"), JSON.stringify(out, null, 1));
} finally { await browser.close(); }

console.log(`readback path exact on every rung: ${out.soundnessChecks.compositingPathExactAtExtremes} · every cell uniform: ${out.soundnessChecks.everyCellUniform}\n`);
console.log("  k  alpha      exact float                    measured        " + Object.keys(MODELS).map(m => m.slice(0, 16).padEnd(17)).join(""));
for (const r of out.rungs) console.log(`${String(r.k).padStart(3)}  ${r.alpha.toFixed(5)}  (${r.exactFloat.map(v => String(v).padStart(8)).join(",")})  ${r.measured.padEnd(16)}` + Object.keys(MODELS).map(m => (r.models[m].matches ? "ok" : "--").padEnd(17)).join(""));
console.log("\nmodel fit:");
for (const f of out.modelFit) console.log(`   ${f.model.padEnd(24)} ${f.matches}/${f.of}`);
console.log(`\n${out.finding}\n\nCONSEQUENCE: ${out.consequence}\n\nJOIN: ${out.joinQuestion}`);
