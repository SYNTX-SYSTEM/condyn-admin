/**
 * GRÜN · PHASE-G DEVELOPMENT READING · THE RUN'S OWN STATIC FLOOR.  **NO VERDICT** (A-G36 point 2).
 *
 * A-F11, GELB's own corrected rule: every run carries its OWN floor, because a bound the instrument cannot
 * reach is not a bound. PINK's committed noise-floor.json records swing_max 0.031872 at 9cc06f84 under
 * reducedMotion:reduce with nothing animating — which is why A-G26 withdrew PG-10's 0.030 max-swing ceiling.
 * This script re-measures that floor on THIS build, bucketed by source the way PINK's floor-regions.mjs does,
 * so every other reading in this directory can be read against its own floor rather than against PINK's.
 *
 * Also records the provenance A-G47 point 3 asks PINK to CHECK rather than trust.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, servedProvenance, PROVENANCE, stats, pct, e4 } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const SECONDS = Number(process.env.GRUEN_FLOOR_S ?? 12);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, W, H, cx, cy, R } = geom;
const cdp = await cdpSession(page);

/** Mark boxes dilated 2 px: antialiasing on the field's OWN bright thin edges, which no opaque ground removes. */
const boxes = await page.evaluate(() => [...document.querySelectorAll("[data-mapping-body],[data-mapping-node],[data-mapping-arc]")].map(e => { const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
const markMask = new Uint8Array(N);
for (const [x, y, w, h] of boxes) {
  const bx = Math.floor(x - clip.x - 2), by = Math.floor(y - clip.y - 2), bw = Math.ceil(w + 4), bh = Math.ceil(h + 4);
  for (let yy = by; yy < by + bh; yy += 1) for (let xx = bx; xx < bx + bw; xx += 1) if (xx >= 0 && yy >= 0 && xx < W && yy < H) markMask[yy * W + xx] = 1;
}

const first = await captureLuminance(cdp, clip, N);
const mn = Float32Array.from(first), mx = Float32Array.from(first);
let frames = 1, sumAbs = 0, prev = first;
const t0 = Date.now();
while (Date.now() - t0 < SECONDS * 1000) {
  const L = await captureLuminance(cdp, clip, N);
  for (let i = 0; i < N; i += 1) { if (L[i] < mn[i]) mn[i] = L[i]; if (L[i] > mx[i]) mx[i] = L[i]; sumAbs += Math.abs(L[i] - prev[i]); }
  prev = L; frames += 1;
}
await ctx.close(); await browser.close();

const bucket = { markAaEdge: [], quietMidDisc: [], glowBand: [], outsideDisc: [] };
for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) {
  const i = y * W + x, s = mx[i] - mn[i];
  const rr = Math.hypot(x - cx, y - cy) / R;
  if (markMask[i]) bucket.markAaEdge.push(s);
  else if (disc[i]) { if (rr >= 0.30 && rr <= 0.60) bucket.quietMidDisc.push(s); else bucket.glowBand.push(s); }
  else bucket.outsideDisc.push(s);
}
const all = [];
for (let i = 0; i < N; i += 1) all.push(mx[i] - mn[i]);
const discSwing = [];
for (let i = 0; i < N; i += 1) if (disc[i]) discSwing.push(mx[i] - mn[i]);
const fmt = v => ({ ...stats(v), fracGe0004: (() => { let c = 0; for (const s of v) if (s >= 0.004) c += 1; return +(c / Math.max(1, v.length)).toFixed(5); })() });

const out = {
  reading: "GRÜN development reading · the run's own static floor under reducedMotion:reduce",
  verdict: PROVENANCE.verdict, provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, deviceScaleFactor: 1, region: `${W}x${H}`, discPixels: geom.discPixels, frames, spanS: +((Date.now() - t0) / 1000).toFixed(1),
  definitions: {
    swing: "per-pixel (max − min) over the frame stack, reducedMotion:reduce so the FIELD contributes no motion",
    buckets: "markAaEdge = mark boxes dilated 2px; quietMidDisc = disc r/R 0.30–0.60 outside marks; glowBand = the rest of the disc; outsideDisc = host",
    whyItMatters: "A-F11 — a bound below this floor is not a bound (A-G26 withdrew PG-10's 0.030 ceiling on exactly this ground)"
  },
  wholeRegion: fmt(all), discInterior: fmt(discSwing),
  byBucket: { markAaEdge: fmt(bucket.markAaEdge), quietMidDisc: fmt(bucket.quietMidDisc), glowBand: fmt(bucket.glowBand), outsideDisc: fmt(bucket.outsideDisc) },
  meanAbsStep: e4(sumAbs / (Math.max(1, frames - 1) * N)),
  pinkComparison: { source: "mapping-phase-f-contract/outputs/9cc06f84-baseline/noise-floor.json (9cc06f84)", pink_swing_max: 0.031872, note: "divergence is a FINDING to report, not to reconcile (A-G36 point 4)" }
};
writeFileSync(resolve(here, `../outputs/floor-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ frames: out.frames, spanS: out.spanS, discSwingMax: out.discInterior.max, discSwingP999: out.discInterior.p999, markAaMax: out.byBucket.markAaEdge.max, provenance: { head: provenance.headShort, clean: provenance.treeClean, buildId: provenance.buildId, productDelta: provenance.productDeltaFrom3ec8457d, productTreeClean: provenance.productTreeClean } }, null, 1));
