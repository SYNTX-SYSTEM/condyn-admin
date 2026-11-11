/**
 * GRÜN · PHASE-G · §73 — PG-23 (restated), THE COMPUTED-STYLE LIMB. **NO VERDICT** (A-G36 point 2).
 *
 * The second limb of the restated pin, and the one gruen-pg23-alpha.mjs declared it could not do:
 *
 *   "It is not a computed-style check. It establishes the REASON the opacity is constant — that nothing
 *    targets it — which covers every state at once; it does not verify that a browser agrees. That limb
 *    wants `getComputedStyle` across the breath cycle, which needs a rendered page, and this instrument has
 *    no computed-style reader at all."
 *
 * This is that reader. It was blocked on a running build and server, which the owner has now granted on
 * loopback. It renders nothing to a raster and measures no luminance: it samples the browser's own resolved
 * `opacity` on each shelf halo across more than one full breath period and asks whether it moves.
 *
 * WHY NOT THE RASTER FORM, restated here so the two limbs cannot be confused by a later reader: the
 * zero-by-construction channel differences two captures and therefore measures the COMPOSITE. A translucent
 * resting layer over a breathing ground shows swing at every pixel however perfect the mask, and
 * `.mf-wave-ground` breathes by design beneath the shelf — PINK measured 9.84 x the shelf's own static floor
 * on a correct build. That swing is real and it is not the glow's. Computed style asks the browser what the
 * ELEMENT's opacity is, which is what the restated pin is about.
 *
 * THE CARRIER IS PINK'S, NOT A GUESS. §62 corrected this lane: the shelf halos are addressable today as
 * `.mf-halo > circle:not(.mf-wave-halo)` — their group carries `mf-halo` like every halo and their circle is
 * the one WITHOUT `mf-wave-halo` (PersonJobMappingField.tsx:711, `b.shelf ? undefined : "mf-wave mf-wave-halo"`).
 * This lane had claimed no current instrument could check them; PINK's §15 instrument had been doing it since
 * it was written.
 *
 * AND IT CARRIES ITS OWN DISCRIMINATOR, because a time-invariance check that cannot see motion would pass on
 * a dead page and prove nothing. The field halos and the wave ground MUST move across the same samples. If
 * they do not, the reading is VOID and says so rather than reporting a clean shelf.
 *
 * BOTH OPACITIES ARE REPORTED. PG-23 as restated is about the shelf halo's OWN opacity, so that is the
 * subject; but an ancestor's opacity multiplies it on screen, so the full ancestor chain is sampled too and
 * the effective product is reported beside it. A pin about an element's own property and a pin about what
 * reaches the eye are different pins, and this lane has conflated a carrier with its superset before.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, openField, servedProvenance, PROVENANCE } from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const PERIOD_MS = 10000;            // WAVE.periodMs
const INTERVAL_MS = 250;
const SAMPLES = Math.ceil((PERIOD_MS * 1.1) / INTERVAL_MS) + 1;   // > one full period

const browser = await chromium.launch();
let out;
try {
  /* reduce:false on purpose — the breath must be RUNNING or the discriminator cannot fire */
  const { page } = await openField(browser, { reduce: false, vw: VW, vh: VH });
  const provenance = await servedProvenance(page, WT);

  const series = await page.evaluate(async ({ samples, intervalMs }) => {
    const SHELF = ".mf-halo > circle:not(.mf-wave-halo)";
    const FIELD = ".mf-wave-halo";
    const GROUND = ".mf-wave-ground";
    const collect = sel => Array.from(document.querySelectorAll(sel));
    const chainOpacity = el => {
      const chain = [];
      for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
        chain.push(Number(getComputedStyle(n).opacity));
        if (n.tagName.toLowerCase() === "svg") break;
      }
      return chain;
    };
    const groups = {
      shelfHalos: collect(SHELF),
      fieldHalos: collect(FIELD),
      waveGround: collect(GROUND)
    };
    const counts = Object.fromEntries(Object.entries(groups).map(([k, v]) => [k, v.length]));
    const rec = Object.fromEntries(Object.keys(groups).map(k => [k, groups[k].map(() => ({ own: [], effective: [] }))]));
    const stamps = [];
    for (let s = 0; s < samples; s += 1) {
      stamps.push(performance.now());
      for (const k of Object.keys(groups)) {
        groups[k].forEach((el, i) => {
          const chain = chainOpacity(el);
          rec[k][i].own.push(chain[0]);
          rec[k][i].effective.push(chain.reduce((a, b) => a * b, 1));
        });
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    return { counts, rec, spanMs: stamps[stamps.length - 1] - stamps[0] };
  }, { samples: SAMPLES, intervalMs: INTERVAL_MS });

  const stat = arr => {
    const min = Math.min(...arr), max = Math.max(...arr);
    return { min: +min.toFixed(6), max: +max.toFixed(6), range: +(max - min).toFixed(6), distinctValues: new Set(arr.map(v => v.toFixed(6))).size };
  };
  const summarise = k => series.rec[k].map((e, i) => ({ index: i, own: stat(e.own), effective: stat(e.effective) }));
  const shelf = summarise("shelfHalos"), field = summarise("fieldHalos"), ground = summarise("waveGround");

  const anyMoves = rows => rows.some(r => r.own.range > 1e-6);
  const discriminatorFires = anyMoves(field) || anyMoves(ground);
  const shelfOwnMoves = shelf.filter(r => r.own.range > 1e-6);
  const shelfEffectiveMoves = shelf.filter(r => r.effective.range > 1e-6);

  out = {
    reading: "GRÜN · §73 — PG-23 (restated), computed-style limb: is each shelf halo's OWN opacity time-invariant on a real browser?",
    verdict: PROVENANCE.verdict,
    scope: "getComputedStyle sampling on a rendered page. No raster, no luminance, no mask, no sealed datum. Loopback build and server only.",
    provenance, instrument: PROVENANCE,
    viewport: `${VW}x${VH}`,
    motion: "LIVE — reducedMotion NOT set, because the breath must be running for the discriminator to fire",
    sampling: { samples: SAMPLES, intervalMs: INTERVAL_MS, spanMs: Math.round(series.spanMs), wavePeriodMs: PERIOD_MS,
                coversAFullPeriod: series.spanMs >= PERIOD_MS },
    carriers: {
      shelfHalos: ".mf-halo > circle:not(.mf-wave-halo)   — PINK's selector, adopted (§62 corrected this lane's claim that none existed)",
      fieldHalos: ".mf-wave-halo                          — control, MUST move",
      waveGround: ".mf-wave-ground                        — control, MUST move; this is the layer whose swing the raster form mistakes for the glow's"
    },
    counts: series.counts,
    discriminator: {
      fired: discriminatorFires,
      fieldHalosThatMove: field.filter(r => r.own.range > 1e-6).length,
      waveGroundThatMoves: ground.filter(r => r.own.range > 1e-6).length,
      meaning: discriminatorFires
        ? "the instrument can see the breath on this page, so a constant shelf reading is informative"
        : "NOTHING on the page moved across a full period. The reading below is VOID — it cannot distinguish a time-invariant shelf halo from an instrument that is not sampling the animation."
    },
    shelfHalos: shelf, fieldHalos: field, waveGround: ground,
    finding: null
  };
  out.finding = !discriminatorFires
    ? "VOID — the discriminator did not fire. No claim is made about PG-23."
    : series.counts.shelfHalos === 0
      ? "NO SUBJECT — no shelf halo matched the carrier at this viewport and level, so the limb has nothing to measure here. Not a pass."
      : shelfOwnMoves.length === 0
        ? `Each of the ${series.counts.shelfHalos} shelf halos holds ONE distinct computed opacity across ${SAMPLES} samples spanning ${Math.round(series.spanMs)} ms (> one ${PERIOD_MS} ms breath period), while ${field.filter(r => r.own.range > 1e-6).length} field halos and ${ground.filter(r => r.own.range > 1e-6).length} wave-ground layers moved over the same samples. So the shelf halo's OWN opacity is time-invariant on a real browser, which is what the source limb predicted from the stylesheet and what the raster form cannot see. ${shelfEffectiveMoves.length === 0 ? "Its EFFECTIVE opacity is constant too, so no ancestor animates it either." : `Its EFFECTIVE opacity DOES move on ${shelfEffectiveMoves.length} of them, so an ANCESTOR animates: the element's own opacity is invariant and what reaches the eye is not. PG-23 as restated is about the former; a reader wanting the latter needs a different pin.`}`
        : `The shelf halo's own opacity MOVES on ${shelfOwnMoves.length} of ${series.counts.shelfHalos} halos, contradicting the source limb's prediction that no rule which animates opacity can match a shelf halo or its ancestors. The source limb and this one disagree and the disagreement is the result — one of the two is wrong and neither may be quoted until it is settled.`;

  writeFileSync(resolve(here, `../outputs/pg23-computed-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
} finally {
  await browser.close();
}
console.log(`PG-23 computed-style limb @ ${out.viewport}`);
console.log(`  counts: ${JSON.stringify(out.counts)}  span ${out.sampling.spanMs} ms over ${out.sampling.samples} samples (period ${PERIOD_MS} ms)`);
console.log(`  discriminator fired: ${out.discriminator.fired}  (field halos moving ${out.discriminator.fieldHalosThatMove}, ground moving ${out.discriminator.waveGroundThatMoves})`);
for (const [i, r] of out.shelfHalos.entries()) console.log(`  shelf[${i}] own ${r.own.min}..${r.own.max} (distinct ${r.own.distinctValues})   effective ${r.effective.min}..${r.effective.max} (distinct ${r.effective.distinctValues})`);
console.log(`\n${out.finding}`);
