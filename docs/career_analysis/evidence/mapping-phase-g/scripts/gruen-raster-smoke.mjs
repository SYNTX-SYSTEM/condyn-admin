/**
 * GRÜN · PHASE-G · §90 — THE SMOKE TEST §62 SHOULD HAVE HAD. **NO VERDICT** (A-G36 point 2).
 *
 * §62 split the colour math into `gruen-colour.mjs` and verified the split by checking that `chromium` and
 * `sharp` imported and that `labOf` and `luminanceOfRgb` returned their committed values. That proved
 * IMPORTS RESOLVE. It did not prove THE RASTER PATH RUNS — and it did not, because
 * `export { … } from "./gruen-colour.mjs"` is a RE-EXPORT and creates no local binding, so every internal
 * use inside `gruen-instrument.mjs` broke while every external import kept working perfectly.
 *
 * `decodeLuminance` threw "luminance is not defined" — the function EVERY raster probe goes through,
 * including all three that write sealed readings. It sat broken from §62 to §90 and nothing noticed, because
 * no raster probe was run in between: the derivations need no browser and the live probes were not re-run.
 *
 * So this exercises the actual chain, on a page whose answer is known independently of the instrument:
 *   openField's capture path -> captureRaw -> decodeLuminance -> luminance
 * against a flat fill whose WCAG luminance is computed from the sRGB formula directly. If the two disagree,
 * or if anything in the chain throws, the raster path is broken and every pixel reading taken through it is
 * worthless — which is a thing worth one second per pass to know.
 *
 * Needs a browser. Needs NO build, NO server and NO façade: it renders its own page.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, sharp, luminance, luminanceOfRgb, labOf, chromaQuantumFloor, decodeLuminance, cdpSession, captureRaw, PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SWATCHES = [[6, 12, 17], [92, 200, 255], [245, 166, 35], [128, 64, 32], [255, 255, 255], [0, 0, 0]];
const W = 60, H = 40;

const browser = await chromium.launch();
let out;
try {
  const ctx = await browser.newContext({ viewport: { width: W * SWATCHES.length, height: H }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;display:flex}div{width:${W}px;height:${H}px}</style></head>
    <body>${SWATCHES.map(c => `<div style="background:rgb(${c.join(",")})"></div>`).join("")}</body></html>`, { waitUntil: "load" });

  const cdp = await cdpSession(page);
  const rows = [];
  for (const [i, c] of SWATCHES.entries()) {
    const clip = { x: i * W + 10, y: 10, width: 20, height: 20, scale: 1 };
    const N = clip.width * clip.height;
    /* THE CHAIN UNDER TEST: captureRaw -> decodeLuminance -> luminance */
    const L = await decodeLuminance(await captureRaw(cdp, clip), N);
    const mean = [...L].reduce((a, b) => a + b, 0) / N;
    const expected = luminanceOfRgb(...c);                    // the sRGB formula, independent of the capture
    rows.push({ swatch: `rgb(${c.join(", ")})`, pixels: N, meanFromRaster: +mean.toFixed(9),
      expectedFromFormula: +expected.toFixed(9), absError: +Math.abs(mean - expected).toFixed(9),
      agrees: Math.abs(mean - expected) < 1e-7 });
  }
  /* the pure helpers too, so a split that breaks one of them is caught by name */
  const helpers = {
    luminanceIsCallable: typeof luminance === "function",
    labOfOnMedium: +labOf(6, 12, 17).C.toFixed(4),
    chromaQuantumAtMedium: chromaQuantumFloor(6, 12, 17).maxOneCodeDeltaC,
    sharpIsCallable: typeof sharp === "function"
  };
  const allAgree = rows.every(r => r.agrees);
  out = {
    reading: "GRÜN · §90 — raster-path smoke test: captureRaw -> decodeLuminance -> luminance, against the sRGB formula",
    verdict: PROVENANCE.verdict,
    scope: "a self-rendered page of flat swatches. Browser only — NO build, NO server, NO façade, NO product page.",
    why: "§62 verified the colour-math split by checking that imports RESOLVED. A re-export resolves from outside and is broken from inside, so no import check could see that decodeLuminance had lost its binding to `luminance`. This exercises the chain instead of its imports.",
    swatches: rows, helpers,
    finding: allAgree
      ? `The raster path RUNS and AGREES: all ${rows.length} swatches match the sRGB formula to better than 1e-7, worst absolute error ${rows.reduce((m, r) => Math.max(m, r.absError), 0)}. Every pixel reading taken through this chain is taken through a chain that works.`
      : `THE RASTER PATH DISAGREES WITH THE FORMULA on ${rows.filter(r => !r.agrees).length} of ${rows.length} swatches. Every pixel reading taken through it is suspect until this is explained: ${rows.filter(r => !r.agrees).map(r => `${r.swatch} raster ${r.meanFromRaster} vs formula ${r.expectedFromFormula}`).join("; ")}`
  };
  writeFileSync(resolve(here, "../outputs/raster-smoke.json"), JSON.stringify(out, null, 1));
} finally { await browser.close(); }
for (const r of out.swatches) console.log(`   ${r.swatch.padEnd(22)} raster ${String(r.meanFromRaster).padEnd(13)} formula ${String(r.expectedFromFormula).padEnd(13)} ${r.agrees ? "agrees" : "DIFFERS"}`);
console.log(`\nhelpers: ${JSON.stringify(out.helpers)}`);
console.log(`\n${out.finding}`);
if (!out.swatches.every(r => r.agrees)) process.exitCode = 1;
