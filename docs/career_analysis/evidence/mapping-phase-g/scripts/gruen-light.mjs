/**
 * GRÜN · PHASE-G DEVELOPMENT READING · PG-1 (semantic share of the field's light) and PG-6 (relations'
 * share of the semantic light), by SUPPRESSION, with per-class attribution.  **NO VERDICT** (A-G36 point 2).
 *
 * A-G41: the §12 readings PG-1 0.42 and PG-6 0.025 are **void as measurements** — they were taken on an
 * uncommitted working tree that no longer exists (DISC_OCCLUSION and BODY_BUDGET are absent at 93c47e03 and
 * present at 10eb4030, with one commit between them, while §12 is 39d50bae at 10:59). **These are therefore
 * FIRST measurements with no prior.** Nothing here is tuned toward 0.55 from 0.42, because 0.42 is not known.
 *
 * Method: PINK's pink-pg1.mjs / pink-pg1-attr.mjs, with the phase-G taxonomy — `glows` is a first-class
 * semantic class here because A-G10 pin 7 moved the glow out of the medium and no PF-8 mask ever held it.
 * Scaffold rings are NOT semantic: PINK's PG-1 finding is that the rings alone out-lit the subject, so the
 * share is reported BOTH ways and the excl-rings form is the one PG-1 is about.
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  chromium, openField, probeGeometry, clipOf, discMask, cdpSession, captureLuminance, hide, unhideAll,
  servedProvenance, PROVENANCE, CLASS_SELECTOR, SEMANTIC_CLASSES, RELATION_CLASSES, RING_CLASSES, luminanceOfRgb, e4
} from "./gruen-instrument.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const WT = resolve(here, "../../../../..");
const VW = Number(process.env.VW ?? 1920), VH = Number(process.env.VH ?? 1080);

const sel = classes => classes.map(c => CLASS_SELECTOR[c]).join(",");
const SEM = sel(SEMANTIC_CLASSES), RINGS = sel(RING_CLASSES), REL = sel(RELATION_CLASSES);

const browser = await chromium.launch();
const { ctx, page, guard } = await openField(browser, { reduce: true, vw: VW, vh: VH });
const provenance = await servedProvenance(page, WT);
const geo = await probeGeometry(page);
const clip = clipOf(geo, VW, VH);
const geom = discMask(clip, geo);
const { disc, N, discPixels } = geom;
const cdp = await cdpSession(page);

const discSum = async () => { const L = await captureLuminance(cdp, clip, N); let s = 0; for (let i = 0; i < N; i += 1) if (disc[i]) s += L[i]; return s; };
const removedBy = async selector => { await hide(page, selector); const s = await discSum(); await unhideAll(page); return s; };

const full = await discSum();
const hiddenSem = await removedBy(SEM);
const hiddenAll = await removedBy(`${SEM},${RINGS}`);
const hiddenRings = await removedBy(RINGS);
const hiddenRel = await removedBy(REL);

/** Per-class attribution — each class suppressed alone. The parts do NOT sum to the joint removal (overlap). */
const perClass = {};
for (const cls of [...SEMANTIC_CLASSES, ...RING_CLASSES]) {
  const h = await removedBy(CLASS_SELECTOR[cls]);
  perClass[cls] = { removedShareOfField: +((full - h) / full).toFixed(5), removedSum: e4(full - h) };
}
await ctx.close(); await browser.close();

const semanticLight = full - hiddenSem;
const relationLight = full - hiddenRel;
const out = {
  reading: "GRÜN development reading · PG-1 semantic share and PG-6 relation share, by suppression",
  verdict: PROVENANCE.verdict, priorBaseline: "NONE — A-G41 voided §12's 0.42 / 0.025 (measured on a vanished working tree). FIRST MEASUREMENT.",
  provenance, instrument: PROVENANCE, guard,
  viewport: `${VW}x${VH}`, region: `${clip.width}x${clip.height}`, discPixels,
  definitions: {
    domain: "the field disc (inside mapping-ring-field), the medium's own boundary",
    semanticClasses: SEMANTIC_CLASSES, relationClasses: RELATION_CLASSES, ringClasses: RING_CLASSES,
    selectors: Object.fromEntries(Object.entries(CLASS_SELECTOR)),
    PG1: "(ΣL_full − ΣL_semanticsSuppressed) / ΣL_full over disc pixels; the excl-rings form is PG-1's subject (rings are scaffold, PINK's finding)",
    PG6: "(ΣL_full − ΣL_beamsSuppressed) / (ΣL_full − ΣL_semanticsSuppressed) — relations' share OF THE SEMANTIC LIGHT, not of the field's",
    glowsIncluded: "glows are semantic here: A-G10 pin 7 moved them out of the medium into mapping-glows (A-G36 point 3)",
    perClassCaveat: "classes are suppressed one at a time; shares do not sum to the joint removal where classes overlap"
  },
  discMeanLuminance: { full: e4(full / discPixels), groundOnly_semAndRingsSuppressed: e4(hiddenAll / discPixels) },
  stageGroundConstant: { rgb: "rgb(3, 5, 8)", wcagRelativeLuminance: e4(luminanceOfRgb(3, 5, 8)), note: "A-G27's recomputation — the occluding plate's own light, which is why PG-2 was restated" },
  PG1_semanticShare_exclRings: +(semanticLight / full).toFixed(5),
  PG1_share_inclRings: +((full - hiddenAll) / full).toFixed(5),
  PG1_boundForReference: ">= 0.55",
  ringsShareOfField: +((full - hiddenRings) / full).toFixed(5),
  PG6_relationShareOfSemanticLight: +(relationLight / Math.max(1e-12, semanticLight)).toFixed(5),
  PG6_boundForReference: ">= 0.15",
  perClassShareOfField: perClass,
  sums: { full: e4(full), semanticsSuppressed: e4(hiddenSem), semanticsAndRingsSuppressed: e4(hiddenAll), ringsSuppressed: e4(hiddenRings), beamsSuppressed: e4(hiddenRel) },
  pinkComparison: { source: "pink-pg1.mjs at 93c47e03", pink_semanticFraction_exclRings: 0.0282, pink_inclRings: 0.0809, note: "a different commit AND a different taxonomy (no glows class); divergence is a finding, not to be reconciled (A-G36 point 4)" }
};
writeFileSync(resolve(here, `../outputs/light-${VW}x${VH}.json`), JSON.stringify(out, null, 1));
console.log(JSON.stringify({ PG1_exclRings: out.PG1_semanticShare_exclRings, PG1_inclRings: out.PG1_share_inclRings, rings: out.ringsShareOfField, PG6: out.PG6_relationShareOfSemanticLight, perClass: Object.fromEntries(Object.entries(perClass).map(([k, v]) => [k, v.removedShareOfField])) }, null, 1));
