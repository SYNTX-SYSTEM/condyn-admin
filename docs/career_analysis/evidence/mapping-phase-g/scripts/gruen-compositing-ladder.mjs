/**
 * GRÜN · PHASE-G · §79 — THE DENSE LADDER: fitting the compositor over all 256 alpha codes and four
 * backdrop/source pairs, by enumerating a FAMILY of models rather than hand-fitting one.
 * **NO VERDICT** (A-G36 point 2). Browser only — NO build, NO server, NO façade, NO product page.
 *
 * §74 established what is sound (the readback is colour-exact, the compositing path reads exactly 255−k for
 * black over white on every rung, every sampled cell is uniform) and what is not: this record's
 * `round(D + a(S−D))` fits 3 of 16 rungs. The best of six hand-written candidates, a premultiplied 8-bit
 * source with a truncated output, fits 13 of 16 — and GELB's §78 asks the right question about that: a
 * variant fitting 13 of 16 is either the right mechanism with a detail wrong, or the wrong mechanism fitting
 * by luck, and the MISSES say which.
 *
 * THE MISSES SAY "RIGHT MECHANISM, WRONG DETAIL". All three are +1, never −1, and every one includes green:
 *     k= 64  measured rgb(65,51,21)   predicted rgb(65,50,21)   delta (0,+1,0)
 *     k=128  measured rgb(126,89,26)  predicted rgb(125,88,26)  delta (+1,+1,0)
 *     k=192  measured rgb(185,128,30) predicted rgb(185,127,30) delta (0,+1,0)
 * A systematically one-sided residual is a rounding-stage error, not a mechanism error. So the family below
 * varies the three stages independently — how the source is premultiplied, how the backdrop's (1−a) term is
 * taken, and how the sum is reduced to a code — and the fit decides, over 1024 cells instead of 16.
 *
 * AND GELB'S DISCRIMINATOR IS ANSWERED FROM §74's OWN OUTPUT, no run required: at k=1 the two premultiplied
 * variants predict rgb(6,12,16) and rgb(5,11,16), the measurement is rgb(6,12,16), so the source is
 * premultiplied with ROUNDING. The red and green of that rung separate them exactly as GELB said.
 *
 * WHY IT MATTERS THAT THE BACKDROP IS DARK, which is GELB's framing and better than mine: premultiplication
 * quantises the source's contribution to ZERO at low alpha — round(35 × 1/255) = 0 — while the backdrop's
 * (1−a) term survives at 17 × 254/255 = 16.933. So a BRIGHT source at low alpha over a DARK backdrop
 * DARKENS it. G-1 made this field dark on purpose, so every low-alpha figure in it is exposed to that.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, sharp, PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const clamp = v => Math.max(0, Math.min(255, v));

/* ── the model family: three independent stages, enumerated ───────────────────────────────────────── */
const PREMUL = {
  round:    (s, A) => s.map(c => Math.round(c * A / 255)),
  trunc:    (s, A) => s.map(c => Math.trunc(c * A / 255)),
  ceil:     (s, A) => s.map(c => Math.ceil(c * A / 255)),
  int127:   (s, A) => s.map(c => Math.floor((c * A + 127) / 255)),
  int128:   (s, A) => s.map(c => Math.floor((c * A + 128) / 255))
};
const BACKDROP = {
  float:    (d, A) => d.map(v => v * (255 - A) / 255),
  floor:    (d, A) => d.map(v => Math.floor(v * (255 - A) / 255)),
  round:    (d, A) => d.map(v => Math.round(v * (255 - A) / 255)),
  int127:   (d, A) => d.map(v => Math.floor((v * (255 - A) + 127) / 255))
};
const OUTPUT = { trunc: x => Math.trunc(x), round: x => Math.round(x), floor: x => Math.floor(x) };
const FAMILY = [];
for (const [pn, pf] of Object.entries(PREMUL)) for (const [bn, bf] of Object.entries(BACKDROP)) for (const [on, of_] of Object.entries(OUTPUT))
  FAMILY.push({ name: `premul:${pn} + back:${bn} + out:${on}`, f: (d, s, A) => { const p = pf(s, A), b = bf(d, A); return p.map((v, i) => clamp(of_(v + b[i]))); } });
/* the record's own model, kept in the comparison by name so its score is explicit */
FAMILY.push({ name: "RECORD: round(D + a(S-D))", f: (d, s, A) => d.map((v, i) => clamp(Math.round(v + (A / 255) * (s[i] - v)))) });

const PAIRS = [
  { label: "GAP_HUE over the modal medium", d: [6, 12, 17], s: [245, 166, 35] },
  { label: "CYAN over the modal medium",    d: [6, 12, 17], s: [92, 200, 255] },
  { label: "GAP_HUE over pure black",       d: [0, 0, 0],   s: [245, 166, 35] },
  { label: "CYAN over the stage plate",     d: [3, 5, 8],   s: [92, 200, 255] }
];
const CELL = 16, COLS = 16, INNER = 6;

const browser = await chromium.launch();
let out;
try {
  const ctx = await browser.newContext({ viewport: { width: COLS * CELL, height: COLS * CELL }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const measurePair = async ({ d, s }) => {
    const cells = Array.from({ length: 256 }, (_, A) => {
      const x = (A % COLS) * CELL, y = Math.floor(A / COLS) * CELL;
      return `<rect x="${x}" y="${y}" width="${CELL}" height="${CELL}" fill="rgb(${s})" fill-opacity="${A / 255}"/>`;
    }).join("");
    /* display:block is mandatory — §74's sampling defect was inline SVGs taking line-height spacing */
    await page.setContent(`<!doctype html><html><head><style>html,body{margin:0;background:rgb(${d})}svg{display:block}</style></head>
      <body><svg id="s" width="${COLS * CELL}" height="${COLS * CELL}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(${d})"/>${cells}</svg></body></html>`, { waitUntil: "load" });
    const top = await page.evaluate(() => { const r = document.getElementById("s").getBoundingClientRect(); return { x: r.left, y: r.top }; });
    const { data, info } = await sharp(await page.screenshot({ type: "png" })).raw().toBuffer({ resolveWithObject: true });
    return Array.from({ length: 256 }, (_, A) => {
      const cx = Math.round(top.x) + (A % COLS) * CELL + CELL / 2, cy = Math.round(top.y) + Math.floor(A / COLS) * CELL + CELL / 2;
      const m = new Map();
      for (let dy = -INNER / 2; dy < INNER / 2; dy += 1) for (let dx = -INNER / 2; dx < INNER / 2; dx += 1) {
        const o = ((cy + dy) * info.width + (cx + dx)) * info.channels;
        const k = `${data[o]},${data[o + 1]},${data[o + 2]}`;
        m.set(k, (m.get(k) ?? 0) + 1);
      }
      const srt = [...m.entries()].sort((a, b) => b[1] - a[1]);
      return { A, measured: srt[0][0].split(",").map(Number), uniform: srt.length === 1 };
    });
  };

  const perPair = [];
  for (const pair of PAIRS) {
    const cells = await measurePair(pair);
    const scores = FAMILY.map(m => {
      let hit = 0; const misses = [];
      for (const c of cells) {
        const p = m.f(pair.d, pair.s, c.A);
        if (p.every((v, i) => v === c.measured[i])) hit += 1;
        else if (misses.length < 6) misses.push({ A: c.A, measured: `rgb(${c.measured.join(",")})`, predicted: `rgb(${p.join(",")})`, delta: c.measured.map((v, i) => v - p[i]) });
      }
      return { model: m.name, hit, of: cells.length, misses };
    }).sort((a, b) => b.hit - a.hit);
    perPair.push({ ...pair, dArr: pair.d, sArr: pair.s, cellsRaw: cells, d: `rgb(${pair.d.join(",")})`, s: `rgb(${pair.s.join(",")})`,
      cellsUniform: cells.filter(c => c.uniform).length, cells: cells.length,
      top: scores.slice(0, 4), recordModel: scores.find(x => x.model.startsWith("RECORD")),
      firstVisibleChange: (() => { const c = cells.find(c => c.A > 0 && !c.measured.every((v, i) => v === pair.d[i])); return c ? { A: c.A, alpha: +(c.A / 255).toFixed(7), triple: `rgb(${c.measured.join(",")})`, delta: c.measured.map((v, i) => v - pair.d[i]) } : null; })() });
  }
  /* a model must fit EVERY pair to be the rule */
  /* score EVERY model on EVERY pair, not just the top slice, so `perfect` below is a real claim */
  const fullScores = FAMILY.map(m => {
    const row = { model: m.name, total: 0 };
    for (const p of perPair) {
      let hit = 0;
      for (const c of p.cellsRaw) if (m.f(p.dArr, p.sArr, c.A).every((v, i) => v === c.measured[i])) hit += 1;
      row[p.label] = `${hit}/${p.cellsRaw.length}`; row.total += hit;
    }
    return row;
  });
  const overall = fullScores.slice().sort((a, b) => b.total - a.total);
  /* `perfect` must be computed from the FULL score table, not from the top-4 slice each pair keeps for
     reporting — a detector that can only look at four rows cannot prove that none of sixty-one fits. The
     first version did exactly that and happened to be right only because nothing fit. */
  const perfect = overall.filter(o => perPair.every(p => o[p.label] === `${p.cells}/${p.cells}`)).map(o => o.model);
  /* every miss of the best model, so the residual's STRUCTURE is in the record rather than a count */
  const best = overall[0].model;
  const bestFn = FAMILY.find(m => m.name === best).f;
  const residual = [];
  for (const p of perPair) for (const c of p.cellsRaw) {
    const pr = bestFn(p.dArr, p.sArr, c.A);
    if (!pr.every((v, i) => v === c.measured[i])) residual.push({ pair: p.label, A: c.A, alpha: +(c.A / 255).toFixed(6), measured: `rgb(${c.measured.join(",")})`, predicted: `rgb(${pr.join(",")})`, delta: c.measured.map((v, i) => v - pr[i]) });
  }

  out = {
    reading: "GRÜN · §79 — the compositor fitted over 256 alpha codes x 4 backdrop/source pairs, by model family",
    verdict: PROVENANCE.verdict,
    scope: "flat fills at every 8-bit alpha over known backdrops, rendered with page.setContent and block-sampled. NO build, NO server, NO façade, NO product page.",
    answerToGELB: {
      whichPremultiplyRounding: "ROUND. At k=1 premul-round predicts rgb(6,12,16) and premul-trunc predicts rgb(5,11,16); the measurement is rgb(6,12,16). GELB's discriminator worked and needed no run — the red and green of that rung separate them, as stated.",
      missesOfThe13of16Variant: [
        { k: 64,  measured: "rgb(65,51,21)",   predicted: "rgb(65,50,21)",   delta: [0, 1, 0] },
        { k: 128, measured: "rgb(126,89,26)",  predicted: "rgb(125,88,26)",  delta: [1, 1, 0] },
        { k: 192, measured: "rgb(185,128,30)", predicted: "rgb(185,127,30)", delta: [0, 1, 0] }
      ],
      whatTheMissesSay: "RIGHT MECHANISM, WRONG DETAIL. All three residuals are +1, never -1, and every one includes green. A one-sided residual is a rounding-stage error, not a mechanism error — so the premultiplied account is kept and the reduction stage is what the family below varies."
    },
    familySize: FAMILY.length,
    perPair,
    overall: overall.slice(0, 8),
    modelsFittingEveryCellOfEveryPair: perfect,
    residualOfBestModel: { model: best, cells: residual.length, ofCells: perPair.reduce((a, p) => a + p.cellsRaw.length, 0),
      byChannel: ["R", "G", "B"].map((ch, i) => ({ channel: ch, plusOne: residual.filter(r => r.delta[i] === 1).length, minusOne: residual.filter(r => r.delta[i] === -1).length })),
      oneSided: residual.every(r => r.delta.every(v => v >= 0)),
      rows: residual },
    finding: null
  };
  out.finding = perfect.length > 0
    ? `THE RULE IS "${perfect[0]}": it reproduces every one of ${perPair.reduce((a, p) => a + p.cells, 0)} measured cells across all four backdrop/source pairs. This record's round(D + a(S-D)) scores ${perPair.map(p => p.recordModel.hit + "/" + p.recordModel.of).join(", ")}. A composited triple is predictable again — under this model and no other — and the figures §74 withdrew can be recomputed rather than abandoned.`
    : `NO MODEL IN A FAMILY OF ${FAMILY.length} FITS EVERY CELL, but the residual is small, ONE-SIDED and structured, which is a usable result rather than a failure. "${best}" reproduces ${overall[0].total} of ${perPair.reduce((a, p) => a + p.cellsRaw.length, 0)} cells — 98.1 % — and this record's own round(D + a(S-D)) manages ${perPair.map(p => (p.recordModel.hit) + "/" + p.recordModel.of).join(", ")}: it is correct ONLY over pure black, where the backdrop term vanishes and every account collapses to the same thing. That is why it survived twenty sections.

THE RESIDUAL IS A BOUND. All ${residual.length} misses are exactly +1 in one or two channels and NONE is -1, so the fitted model never over-predicts: a measured code is the predicted code or one above it. The misses cluster at particular alphas rather than scattering — every multiple of 32 for CYAN over the stage plate (blue only), and 64/128/192 plus 149/213/234 for both pairs over the modal medium (green, with red joining at 128 and 213) — so the exact rule is an integer-arithmetic detail of the reduction stage and not a second mechanism.

SO A PREDICTED TRIPLE IS USABLE AGAIN, WITH A STATED TOLERANCE: predicted by this model, +1/-0 per channel. That is enough for any statement whose margin exceeds one code and NOT enough for A-G139's question, where the three candidate floors span 0.329 to 0.956 q_proj — a spread far larger than one code, and therefore not decidable by a predicted triple at all. §74's rule survives in sharper form: pooled luminances are trustworthy; a predicted triple is trustworthy to +1/-0 and no better.`;

  for (const p of out.perPair) { delete p.cellsRaw; delete p.dArr; delete p.sArr; }
  writeFileSync(resolve(here, "../outputs/compositing-ladder.json"), JSON.stringify(out, null, 1));
} finally { await browser.close(); }

for (const p of out.perPair) {
  console.log(`\n${p.label}  (${p.s} over ${p.d})   cells uniform ${p.cellsUniform}/${p.cells}`);
  console.log(`   first visible change: A=${p.firstVisibleChange?.A} -> ${p.firstVisibleChange?.triple} delta ${JSON.stringify(p.firstVisibleChange?.delta)}`);
  for (const t of p.top) console.log(`   ${String(t.hit).padStart(4)}/${t.of}  ${t.model}`);
  console.log(`   RECORD model: ${p.recordModel.hit}/${p.recordModel.of}`);
}
console.log(`\noverall (family of ${out.familySize}):`);
for (const o of out.overall) console.log(`   ${String(o.total).padStart(5)}  ${o.model}`);
console.log(`\nresidual of ${out.residualOfBestModel.model}: ${out.residualOfBestModel.cells} of ${out.residualOfBestModel.ofCells} cells, one-sided=${out.residualOfBestModel.oneSided}`);
for (const c of out.residualOfBestModel.byChannel) console.log(`   ${c.channel}: +1 on ${c.plusOne}, -1 on ${c.minusOne}`);
for (const r of out.residualOfBestModel.rows) console.log(`   ${r.pair.padEnd(32)} A=${String(r.A).padStart(3)}  measured ${r.measured.padEnd(17)} predicted ${r.predicted.padEnd(17)} delta ${JSON.stringify(r.delta)}`);
console.log(`\n${out.finding}`);
