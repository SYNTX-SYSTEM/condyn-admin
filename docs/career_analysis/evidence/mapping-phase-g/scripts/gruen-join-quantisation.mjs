/**
 * GRÜN · PHASE-G · §74 — THE COMPOSITOR'S ROUNDING MODE, AND THEN THE JOIN. **NO VERDICT** (A-G36 pt 2).
 *
 * A-G139 requires the join measured before either lane's withdrawn floor is usable: when a gradient's stop
 * alpha and an ancestor's element opacity both apply to one pixel, does the browser quantise at EACH join or
 * keep the product? The spread between the answers is 124 % on this stack, and a bound must sit outside the
 * quantisation-order spread of the quantity it bounds.
 *
 * THIS PROBE NEEDS NO BUILD AND NO SERVER, and I am correcting my own claim to the contrary. I told GELB
 * this was the item the owner's new build-and-server permission was decisive for. It is not. The question is
 * a property of the COMPOSITOR, answered by rendering a controlled stack with `page.setContent` and reading
 * the pixel back; it needs a browser, which this lane has always had. It would have run twenty sections ago.
 * The permission is still decisive for the second half — the REAL gap glow on the real build — which is a
 * separate probe. Recorded here rather than left standing.
 *
 * AND THE FIRST ATTEMPT AT THIS PROBE FAILED ITS OWN CALIBRATION, WHICH IS WHY IT HAS TWO PHASES NOW.
 * It assumed the composite is `round(D + a·(S−D))`, hard-coded the discriminating pairs against that
 * assumption, and its single-alpha ladder mismatched on all eight rungs — each measured triple equal to the
 * prediction for the rung BELOW. The pattern is exact and its cause is that **the compositor TRUNCATES where
 * this record has always written `Math.round`.** Every rung fits `floor(D + a·(S−D))` to the code.
 *
 *   k=1  measured rgb(6,12,17)   round -> rgb(7,13,17)   floor -> rgb(6,12,17)
 *   k=34 measured rgb(37,32,19)  round -> rgb(38,33,19)  floor -> rgb(37,32,19)
 *
 * So the mode is FITTED here rather than assumed, from a ladder on which every account of compositing
 * agrees, and the discriminating pairs are then SEARCHED under the fitted mode instead of being chosen in
 * advance. A probe whose discriminator is chosen under the wrong model does not discriminate: under
 * truncation, seven of the eight hand-picked pairs collapse to agreement, including the build's own.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, sharp, PROVENANCE } from "./gruen-instrument.mjs";
import { rgbConstant } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const D = [6, 12, 17];            // the modal medium, as measured at both sizes
const S = rgbConstant("GAP_HUE");         // GAP_HUE, the source constant
const CELL = 40, COLS = 8;
const clamp = v => Math.max(0, Math.min(255, v));
const q8 = a => Math.round(a * 255) / 255;

/* candidate compositing modes — the fit decides, not the author */
const MODES = {
  round:     a => D.map((v, i) => clamp(Math.round(v + a * (S[i] - v)))),
  truncate:  a => D.map((v, i) => clamp(Math.trunc(v + a * (S[i] - v)))),
  ceil:      a => D.map((v, i) => clamp(Math.ceil(v + a * (S[i] - v)))),
  /* premultiplied: the source goes into an 8-bit layer premultiplied, then composites over the backdrop */
  premulRound: a => { const p = S.map(c => Math.round(c * a)); return D.map((v, i) => clamp(Math.round(p[i] + v * (1 - a)))); },
  premulTrunc: a => { const p = S.map(c => Math.trunc(c * a)); return D.map((v, i) => clamp(Math.trunc(p[i] + v * (1 - a)))); }
};
/* the three accounts of the JOIN, which is the question A-G139 asks */
const JOIN = {
  floatProduct:  (a1, a2) => a1 * a2,
  stopQuantised: (a1, a2) => q8(a1) * a2,
  bothQuantised: (a1, a2) => Math.round(q8(a1) * 255 * (q8(a2) * 255) / 255) / 255
};

const CALIB = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89].map(k => ({ k, a: k / 255 }));
const svgDefs = (id, a1) => `<radialGradient id="${id}" gradientUnits="objectBoundingBox">`
  + `<stop offset="0" stop-color="rgb(${S.join(",")})" stop-opacity="${a1}"/>`
  + `<stop offset="1" stop-color="rgb(${S.join(",")})" stop-opacity="${a1}"/></radialGradient>`;
const svgCell = (i, id, a2) => { const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL;
  return `<g opacity="${a2}"><circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL / 2 - 2}" fill="url(#${id})"/></g>`; };
/* a FLAT fill at the same alpha, as a control. If the flat cell is uniform and the gradient cell is not,
   the non-uniformity is the gradient RAMP's and not the compositor's — which matters, because the gap glow
   IS a gradient. Separating the two is why the first two attempts at this probe were unstable. */
const svgFlatCell = (i, a1, a2) => { const x = (i % COLS) * CELL, y = Math.floor(i / COLS) * CELL;
  return `<g opacity="${a2}"><circle cx="${x + CELL / 2}" cy="${y + CELL / 2}" r="${CELL / 2 - 2}" fill="rgb(${S.join(",")})" fill-opacity="${a1}"/></g>`; };
const sheet = (name, list, flat = false) => {
  const h = Math.ceil(list.length / COLS) * CELL;
  return `<svg id="${name}" width="${COLS * CELL}" height="${h}" xmlns="http://www.w3.org/2000/svg"><defs>`
    + (flat ? "" : list.map((p, i) => svgDefs(`${name}${i}`, p.a1)).join("")) + `</defs>`
    + `<rect width="100%" height="100%" fill="rgb(${D.join(",")})"/>`
    + list.map((p, i) => flat ? svgFlatCell(i, p.a1, p.a2) : svgCell(i, `${name}${i}`, p.a2)).join("") + `</svg>`;
};
const pageHtml = sheets => `<!doctype html><html><head><meta charset="utf-8"><style>
 html,body{margin:0;padding:0;background:rgb(${D.join(",")});} svg{display:block;background:rgb(${D.join(",")});}
</style></head><body>${sheets}</body></html>`;

const browser = await chromium.launch();
let out;
try {
  const ctx = await browser.newContext({ viewport: { width: COLS * CELL, height: 1200 }, deviceScaleFactor: 1, colorScheme: "dark" });
  const page = await ctx.newPage();
  /**
   * Sample a BLOCK, not a pixel. The first two attempts read one pixel at each cell's centre and were not
   * reproducible: rung k=34 gave rgb(37,32,19) at one screen position and rgb(38,32,19) at another, which is
   * a property of the sample and not of the compositor. Each cell now returns its distinct triples, its
   * modal triple and whether it is uniform, so a non-uniform cell is visible instead of being sampled once
   * and believed.
   */
  const BLOCK = 8;
  const read = async (name, list, flat = false) => {
    await page.setContent(pageHtml(sheet(name, list, flat)), { waitUntil: "load" });
    const boxes = await page.evaluate(({ cell, cols, n, name }) => {
      const b = document.getElementById(name).getBoundingClientRect();
      return Array.from({ length: n }, (_, i) => ({ x: Math.round(b.left + (i % cols) * cell + cell / 2), y: Math.round(b.top + Math.floor(i / cols) * cell + cell / 2) }));
    }, { cell: CELL, cols: COLS, n: list.length, name });
    const { data, info } = await sharp(await page.screenshot({ type: "png" })).raw().toBuffer({ resolveWithObject: true });
    return boxes.map(({ x, y }) => {
      const counts = new Map();
      for (let dy = -BLOCK / 2; dy < BLOCK / 2; dy += 1) for (let dx = -BLOCK / 2; dx < BLOCK / 2; dx += 1) {
        const o = ((y + dy) * info.width + (x + dx)) * info.channels;
        const key = `${data[o]},${data[o + 1]},${data[o + 2]}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
      return { modal: sorted[0][0].split(",").map(Number), distinct: sorted.length,
               uniform: sorted.length === 1, histogram: sorted.slice(0, 4).map(([k, n]) => ({ triple: `rgb(${k})`, px: n })) };
    });
  };

  /* ── PHASE 1 · fit the compositing mode on a single-alpha ladder at exactly k/255 ─────────────── */
  const calFlat = await read("calflat", CALIB.map(c => ({ a1: c.a, a2: 1 })), true);
  const calGrad = await read("calgrad", CALIB.map(c => ({ a1: c.a, a2: 1 })), false);
  const fitOn = measured => Object.entries(MODES).map(([name, f]) => {
    const rungs = CALIB.map((c, i) => ({ k: c.k, measured: measured[i].modal, uniform: measured[i].uniform, distinct: measured[i].distinct,
      predicted: f(c.a), ok: f(c.a).every((v, j) => v === measured[i].modal[j]) }));
    return { mode: name, rungsMatched: rungs.filter(r => r.ok).length, of: rungs.length, rungs };
  });
  const flatFit = fitOn(calFlat), gradFit = fitOn(calGrad);
  const pick = fit => { const w = fit.filter(m => m.rungsMatched === m.of).map(m => m.mode); return w.length === 1 ? w[0] : null; };
  const modeFlat = pick(flatFit), modeGrad = pick(gradFit);
  const mode = modeFlat ?? modeGrad;
  const modeFit = modeFlat ? flatFit : gradFit;
  const uniformity = { flatCellsUniform: calFlat.filter(c => c.uniform).length, gradientCellsUniform: calGrad.filter(c => c.uniform).length, of: CALIB.length,
    flatWorstDistinct: Math.max(...calFlat.map(c => c.distinct)), gradientWorstDistinct: Math.max(...calGrad.map(c => c.distinct)) };

  /* ── PHASE 2 · SEARCH for pairs that discriminate UNDER THE FITTED MODE ────────────────────────── */
  let pairs = [], caseRows = [], tally = [], winner = [];
  if (mode) {
    const f = MODES[mode];
    const tripleOf = a => f(a).join(",");
    const A1 = [], A2 = [0.18, 0.32, 0.69, 0.757, 0.765, 0.83, 0.8825, 1.0];
    for (let i = 1; i <= 120; i += 1) A1.push(+(i * 0.0005).toFixed(4));
    const seen = new Set();
    for (const a2 of A2) for (const a1 of A1) {
      const t = Object.fromEntries(Object.entries(JOIN).map(([n, g]) => [n, tripleOf(g(a1, a2))]));
      const distinct = new Set(Object.values(t));
      if (distinct.size < 2) continue;
      const sig = `${a2}|${[...distinct].sort().join("/")}`;
      if (seen.has(sig)) continue;                       // one pair per (a2, prediction-pattern)
      seen.add(sig);
      pairs.push({ label: `stop ${a1} x opacity ${a2}`, a1, a2, separates: distinct.size });
      if (pairs.length >= 24) break;
    }
    const measuredCells = await read("disc", pairs);
    caseRows = pairs.map((p, i) => {
      const m = measuredCells[i].modal;
      const models = Object.fromEntries(Object.entries(JOIN).map(([n, g]) => {
        const aEff = g(p.a1, p.a2), t = f(aEff);
        return [n, { aEff: +aEff.toFixed(8), triple: `rgb(${t.join(", ")})`, matches: t.every((v, j) => v === m[j]) }];
      }));
      return { ...p, measured: `rgb(${m.join(", ")})`, uniform: measuredCells[i].uniform, distinct: measuredCells[i].distinct,
               models, modelsMatching: Object.entries(models).filter(([, v]) => v.matches).map(([k]) => k) };
    });
    tally = Object.keys(JOIN).map(n => ({ model: n, matchesOn: caseRows.filter(c => c.modelsMatching.includes(n)).length, of: caseRows.length }));
    winner = tally.filter(t => t.matchesOn === t.of && t.of > 0).map(t => t.model);
  }

  out = {
    reading: "GRÜN · §74 — the compositor's rounding mode, fitted; then whether the alpha join is quantised",
    verdict: PROVENANCE.verdict,
    scope: "a controlled constant-alpha gradient inside a group opacity, rendered with page.setContent and read back as pixels. NO build, NO server, NO façade, NO product page.",
    correctionToMyOwnClaim: "I told GELB this item was the one the new build-and-server permission was decisive for. It is not — it needs a browser only, which this lane has always had. The permission remains decisive for reading the REAL gap glow on the real build, which is a separate probe.",
    firstAttemptFailed: "The first version assumed round() and hard-coded its discriminating pairs against that assumption. Its calibration mismatched on all eight rungs, each measured triple equalling the prediction for the rung below. Under the fitted mode, seven of those eight hand-picked pairs collapse to agreement — including the build's own 0.0030 x 0.8825 — so a discriminator chosen under the wrong model does not discriminate. The mode is now fitted first and the pairs searched afterwards.",
    backdrop: `rgb(${D.join(", ")})`, source: `rgb(${S.join(", ")})`,
    gradientIsConstant: "two stops, same colour, same stop-opacity, so every pixel inside the circle carries ONE alpha and per-pixel interpolation cannot contribute",
    phase1_compositingMode: {
      candidates: Object.keys(MODES),
      samplingNote: `each cell is an ${8}x${8} block, reported as its distinct triples and modal triple. The first two attempts read ONE pixel and were not reproducible across screen positions.`,
      uniformity,
      fitOnFlatFill: flatFit.map(m => ({ mode: m.mode, rungsMatched: `${m.rungsMatched}/${m.of}` })),
      fitOnGradient: gradFit.map(m => ({ mode: m.mode, rungsMatched: `${m.rungsMatched}/${m.of}` })),
      fittedOnFlat: modeFlat, fittedOnGradient: modeGrad,
      flatAndGradientAgree: modeFlat !== null && modeFlat === modeGrad,
      fit: modeFit.map(m => ({ mode: m.mode, rungsMatched: `${m.rungsMatched}/${m.of}` })),
      fitted: mode,
      ladderFlat: flatFit.find(m => m.mode === (mode ?? "round")).rungs.map(r => ({ k: r.k, measured: `rgb(${r.measured.join(", ")})`, predicted: `rgb(${r.predicted.join(", ")})`, uniform: r.uniform, distinct: r.distinct, ok: r.ok })),
      ladderGradient: gradFit.find(m => m.mode === (mode ?? "round")).rungs.map(r => ({ k: r.k, measured: `rgb(${r.measured.join(", ")})`, predicted: `rgb(${r.predicted.join(", ")})`, uniform: r.uniform, distinct: r.distinct, ok: r.ok })),
      finding: mode === null
        ? `NO MODE FITS all ${CALIB.length} rungs, so the compositor does something none of the five candidates describes and everything below is VOID.`
        : `The compositor is ${mode.toUpperCase()}. All ${CALIB.length} rungs of a single alpha at exactly k/255 reproduce to the code under it, and no other candidate does.`,
      consequenceForTheRecord: mode === "truncate"
        ? "THIS RECORD HAS WRITTEN Math.round FOR EVERY COMPOSITE. It truncates. Any figure of the form 'alpha a over triple D renders as T' is wrong by up to one code per channel wherever the fractional part was at least 0.5 — which includes this lane's own first-visible-state arithmetic, and should be re-checked anywhere a composited triple carries a conclusion rather than an illustration."
        : "the record's use of round() is consistent with the fitted mode."
    },
    phase2_theJoin: {
      models: { floatProduct: "a_eff = a1 · a2", stopQuantised: "a_eff = q8(a1) · a2", bothQuantised: "a_eff = q8(q8(a1) · q8(a2))" },
      pairsSearchedUnderFittedMode: pairs.length,
      cases: caseRows, tally, modelsMatchingEveryCase: winner
    },
    finding: null
  };
  out.finding = mode === null
    ? "VOID — no compositing mode fits the calibration ladder, so no claim is made about the join."
    : caseRows.length === 0
      ? `The mode is ${mode}, but NO pair in the searched grid separates the three join models under it. That is itself a result worth having: on this backdrop and source, with these element opacities, the join's quantisation is NOT OBSERVABLE — which satisfies A-G139 by collapsing the spread to zero rather than by choosing a branch.`
      : winner.length === 1
        ? `The compositor is ${mode.toUpperCase()}, and the join is ${winner[0] === "floatProduct" ? "NOT QUANTISED — the product is kept in higher precision" : winner[0] === "stopQuantised" ? "QUANTISED AT THE GRADIENT STOP ONLY — the stop alpha is 8-bit, the element opacity applies in float" : "QUANTISED AT BOTH JOINS"}. "${winner[0]}" matches the measured triple on all ${caseRows.length} discriminating pairs and no other model does. A-G139's spread collapses, so the floor becomes usable — by the finding, not by either lane's figure.`
        : winner.length === 0
          ? `The compositor is ${mode}, but NO join model matches on all ${caseRows.length} discriminating pairs. The per-case rows are the result and A-G139's spread is NOT collapsed by this run.`
          : `The compositor is ${mode}, but ${winner.join(" and ")} both match on all ${caseRows.length} pairs — the search did not separate them from each other.`;

  writeFileSync(resolve(here, "../outputs/join-quantisation.json"), JSON.stringify(out, null, 1));
} finally { await browser.close(); }

console.log("PHASE 1 — fitting the compositing mode on a single-alpha ladder:");
console.log(`   uniformity: flat cells uniform ${out.phase1_compositingMode.uniformity.flatCellsUniform}/${out.phase1_compositingMode.uniformity.of} (worst ${out.phase1_compositingMode.uniformity.flatWorstDistinct} distinct) · gradient cells uniform ${out.phase1_compositingMode.uniformity.gradientCellsUniform}/${out.phase1_compositingMode.uniformity.of} (worst ${out.phase1_compositingMode.uniformity.gradientWorstDistinct} distinct)`);
console.log("   FLAT FILL:     " + out.phase1_compositingMode.fitOnFlatFill.map(m => `${m.mode} ${m.rungsMatched}`).join(" · "));
console.log("   GRADIENT:      " + out.phase1_compositingMode.fitOnGradient.map(m => `${m.mode} ${m.rungsMatched}`).join(" · "));
console.log(`   => ${out.phase1_compositingMode.finding}`);
for (const r of out.phase1_compositingMode.ladderFlat) console.log(`      flat k=${String(r.k).padStart(3)}  measured ${r.measured.padEnd(19)} predicted ${r.predicted.padEnd(19)} ${r.uniform ? "uniform" : `${r.distinct} distinct`} ${r.ok ? "ok" : "MISMATCH"}`);
console.log(`\nPHASE 2 — ${out.phase2_theJoin.pairsSearchedUnderFittedMode} discriminating pairs found under the fitted mode:`);
for (const c of out.phase2_theJoin.cases.slice(0, 14)) console.log(`   ${c.label.padEnd(30)} measured ${c.measured.padEnd(19)} -> ${c.modelsMatching.join(",") || "NO MODEL"}`);
console.log(`\ntally: ${JSON.stringify(out.phase2_theJoin.tally)}`);
console.log(`\n${out.finding}`);
if (out.phase1_compositingMode.consequenceForTheRecord) console.log(`\nCONSEQUENCE: ${out.phase1_compositingMode.consequenceForTheRecord}`);
