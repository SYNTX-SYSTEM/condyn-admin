/**
 * GRÜN · PHASE-G DEVELOPMENT READING · A-G61's LIVE period-averaged PG-1, and A-G86's discriminator for the
 * joint/parts inversion.  **NO VERDICT** (A-G36 point 2).
 *
 * A-G61: the normative PG-1 is the LIVE figure, period-averaged over the full breath period. A `reduce` read
 * omits `.mf-travel` entirely (`visibility: hidden` unless data-breath="LIVE"), so it is a statement about the
 * RESTING field. Both relation carriers `.mf-travel` and `.mf-beam-glow` are in the emitting set here.
 * Averaging over exactly one 10 s period cancels the breath rather than sampling a phase of it.
 *
 * A-G86: the discriminator GELB declined to give a mechanism for, and which A-G55 already owed —
 *   PG-1 standard           = (ΣL_full − ΣL_emittingSuppressed) / ΣL_full
 *   PG-1 occluder-excluded  = (ΣL_occlSuppressed − ΣL_occlAndEmittingSuppressed) / ΣL_occlSuppressed
 * i.e. the occluding class removed from numerator AND denominator. Run at TWO shelf alphas — byte 5 and byte
 * 6, the two renders either side of A-G62 — by live style override, so one build answers it:
 *   if the inversion DISAPPEARS under the occluder-excluded form, it is occluder-mediated;
 *   if it PERSISTS, PG-1's definition needs the joint-to-parts relationship stated, not only A-G60's warning.
 * It can come out either way and this script does not prefer an outcome.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureRaw, decodeLuminance, hide, unhideAll,
  servedProvenance, PROVENANCE, CLASS_SELECTOR, EMITTING_CLASSES, OCCLUDING_CLASSES, RELATION_CLASSES, RING_CLASSES,
  alphaRendersAs, ALPHA_QUANTUM, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
/* §82: the worktree whose .next/BUILD_ID and git state the provenance block records. Defaults to THIS
   worktree, so every existing reading is unaffected; GRUEN_WT points it at a second build served on its own
   port, which is how the A-G49 hooks are verified without rebuilding — or overwriting — the build the eight
   sealed readings were taken against. */
const WT = process.env.GRUEN_WT ?? resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);
const PERIOD_MS = Number(process.env.GRUEN_PERIOD_MS ?? 10000);   // WAVE.periodMs — one full breath
const SHELF_ALPHAS = [0.02, 0.022];                                // byte 5 and byte 6
const sel = cs => cs.map(c => CLASS_SELECTOR[c]).join(",");

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: false, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, discPixels } = geom;
const cdp = await cdpSession(page);

/** The mean disc luminance sum over ≥ one full breath period — the breath cancels instead of being sampled. */
async function periodAverage(label) {
  const shots = [], t0 = Date.now();
  while (Date.now() - t0 < PERIOD_MS + 400) shots.push(await captureRaw(cdp, clip));
  let total = 0;
  for (const s of shots) {
    const L = await decodeLuminance(s, N);
    let frame = 0;
    for (let i = 0; i < N; i += 1) if (disc[i]) frame += L[i];
    total += frame;
  }
  const spanS = (Date.now() - t0) / 1000;
  return { label, mean: total / shots.length, frames: shots.length, spanS: +spanS.toFixed(1), periodsCovered: +(spanS / (PERIOD_MS / 1000)).toFixed(2) };
}
const setShelf = async alpha => {
  await page.evaluate(a => {
    document.querySelectorAll("style[data-shelf-alpha]").forEach(s => s.remove());
    const st = document.createElement("style");
    st.setAttribute("data-shelf-alpha", "1");
    st.textContent = `[data-testid="mapping-ring-shelf"]{stroke: rgba(205, 240, 255, ${a}) !important}`;
    document.head.appendChild(st);
  }, alpha);
  await page.waitForTimeout(400);
};
const averageWith = async (alpha, selector) => {
  if (selector !== null) await hide(page, selector);
  const r = await periodAverage(selector ?? "none");
  if (selector !== null) await unhideAll(page);
  await setShelf(alpha);   // unhideAll strips every injected style, the override included
  return r;
};

const EMIT = sel(EMITTING_CLASSES), OCCL = sel(OCCLUDING_CLASSES);
const byAlpha = {};
for (const alpha of SHELF_ALPHAS) {
  await setShelf(alpha);
  const full = await averageWith(alpha, null);
  const hidEmit = await averageWith(alpha, EMIT);
  const hidOccl = await averageWith(alpha, OCCL);
  const hidBoth = await averageWith(alpha, `${EMIT},${OCCL}`);
  const standard = (full.mean - hidEmit.mean) / full.mean;
  const occluderExcluded = (hidOccl.mean - hidBoth.mean) / hidOccl.mean;
  byAlpha[String(alpha)] = {
    renders: alphaRendersAs(alpha),
    PG1_standard: +standard.toFixed(5),
    PG1_occluderExcluded: +occluderExcluded.toFixed(5),
    discMeanLuminance: { full: e4(full.mean / discPixels), occludersSuppressed: e4(hidOccl.mean / discPixels) },
    windows: { full, hidEmit, hidOccl, hidBoth }
  };
}

/** Per-class LIVE attribution at the as-built alpha. NOT summands (A-G60). */
await setShelf(0.022);
const perClass = {};
for (const cls of [...EMITTING_CLASSES, ...OCCLUDING_CLASSES, ...RING_CLASSES]) {
  const base = byAlpha["0.022"].windows.full.mean;
  const h = await averageWith(0.022, CLASS_SELECTOR[cls]);
  perClass[cls] = { removedShareOfField: +((base - h.mean) / base).toFixed(5), frames: h.frames };
}
const relationJoint = await averageWith(0.022, sel(RELATION_CLASSES));
await ctx.close(); await browser.close();

const a1 = byAlpha["0.02"], a2 = byAlpha["0.022"];
const partsSum = EMITTING_CLASSES.reduce((s, c) => s + perClass[c].removedShareOfField, 0);
const out = {
  reading: "GRÜN development reading · A-G61 LIVE period-averaged PG-1, and A-G86's joint/parts discriminator",
  verdict: PROVENANCE.verdict, provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, region: `${clip.width}x${clip.height}`, discPixels,
  motion: "LIVE (reducedMotion: no-preference) — the breath runs and .mf-travel is visible",
  periodAveraging: { periodMs: PERIOD_MS, note: "each figure is the mean disc sum over ≥ one full breath period, so the breath cancels rather than being sampled at a phase (A-G61)" },
  definitions: {
    emittingClasses: EMITTING_CLASSES, occludingClasses: OCCLUDING_CLASSES, relationClasses: RELATION_CLASSES,
    travelCarriersAdded: "A-G61: .mf-travel and .mf-beam-glow are now in the emitting set. A reduce read cannot see .mf-travel at all (visibility:hidden off LIVE), which is most of why this lane's RESTING PG-1 sat below PINK's LIVE figure.",
    PG1_standard: "(ΣL_full − ΣL_emittingSuppressed) / ΣL_full over disc pixels",
    PG1_occluderExcluded: "A-G86: (ΣL_occlSuppressed − ΣL_occlAndEmittingSuppressed) / ΣL_occlSuppressed — the occluder removed from numerator AND denominator, which is what A-G55 already owed",
    discriminator: "run at shelf alpha byte 5 (0.02) and byte 6 (0.022) by live style override on ONE build, so the perturbation is controlled and no rebuild is involved",
    alphaQuantum: `the alpha is quantised to 8 bits BEFORE compositing (A-G81): quantum ${ALPHA_QUANTUM.toFixed(7)}, so 0.022 and 0.025 render identically`,
    nonAdditive: "A-G60: the per-class shares are NOT summands and are not added here; the sum is printed ONLY to exhibit the gap against the joint"
  },
  A_G86_discriminator: {
    PG1_standard: { "byte5_0.02": a1.PG1_standard, "byte6_0.022": a2.PG1_standard, delta: +(a2.PG1_standard - a1.PG1_standard).toFixed(5) },
    PG1_occluderExcluded: { "byte5_0.02": a1.PG1_occluderExcluded, "byte6_0.022": a2.PG1_occluderExcluded, delta: +(a2.PG1_occluderExcluded - a1.PG1_occluderExcluded).toFixed(5) },
    reading: "a POSITIVE delta reproduces the inversion (PG-1 rising when scaffold light rises, against the expected slight fall). Compare the two rows: if the occluder-excluded delta is ~0 or negative while the standard delta is positive, the inversion is occluder-mediated. If both stay positive, PG-1's definition needs its joint-to-parts relationship stated.",
    expectedDirectionWithoutInversion: "NEGATIVE — rings are excluded from the numerator and included in the denominator, so adding ring light should lower the share"
  },
  byShelfAlpha: byAlpha,
  PG1_boundForReference: ">= 0.55",
  perClassShareOfField_notSummands: perClass,
  nonAdditivity: { sumOfEmittingParts: +partsSum.toFixed(5), jointEmittingShare: a2.PG1_standard, gap: +(partsSum - a2.PG1_standard).toFixed(5), note: "A-G60 — the gap is expected and the parts may not be added; printed to exhibit it" },
  PG6_relationShareOfSemanticLight_live: +((byAlpha["0.022"].windows.full.mean - relationJoint.mean) / (byAlpha["0.022"].windows.full.mean - byAlpha["0.022"].windows.hidEmit.mean)).toFixed(5),
  PG6_boundForReference: ">= 0.15",
  PG6_note: "LIVE and with all three relation carriers (beam, its glow, its travelling light). The RESTING reading with the beam alone was 0.02075 / 0.02181."
};
writeFileSync(resolve(here, `../outputs/pg1-live-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ standard: out.A_G86_discriminator.PG1_standard, occluderExcluded: out.A_G86_discriminator.PG1_occluderExcluded, PG6_live: out.PG6_relationShareOfSemanticLight_live, partsSum: out.nonAdditivity.sumOfEmittingParts, joint: out.nonAdditivity.jointEmittingShare }, null, 1));
