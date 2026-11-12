/**
 * GELB · PRODUCT CONSTANTS, READ OUT OF THE PRODUCT. NO COPY IS HELD.
 *
 * §87 A-G395 found six product constants forked across my instruments and I built this module to fix it —
 * by HOLDING a copy and THROWING if the copy disagreed. GRÜN's §89 shows that is one rung below the
 * available remedy, and it is right:
 *
 *   > HALTS means "holds a copy and throws if the copy disagrees". A file that holds NO copy has nothing
 *   > to disagree. READS is strictly stronger, because eliminating a duplicate beats checking one.
 *
 * So this module declares no product value. Every export is PARSED out of the committed product at a
 * pinned build, and the parse throws if a declaration is missing, duplicated or malformed.
 *
 * §90 — THE SCOPE EXTENSION, AND IT IS THE DENOMINATOR AND NOT THE NUMERATOR. Until §90 this module read
 * ONE file, so its coverage fraction was computed against one file's declarations while the product's
 * constants are not all in one file. §89 found that out the hard way: the module REFUSED SIZE_FLOOR_PX and
 * my stated reason ("it does not exist at this build") was wrong — it exists, the component IMPORTS it.
 * A correct refusal hid a scope defect. So the module now reads EVERY FILE THE DRAWING SURFACE TAKES A
 * VALUE FROM, and coverage() reports per file. The fraction got WORSE, which is the point: it got true.
 *
 * CORRECTION carried forward (commit beaa902a's message is pushed and this branch is not force-pushed):
 * that message said "25 values parsed, 30 of 47 uncovered". The authoritative figures are whatever
 * `node -e "import(...).then(m => m.coverage())"` prints, never a figure typed into prose.
 */
import { execFileSync } from "node:child_process";
import { REPO_ROOT } from "./gelb-paths.mjs"; // A-G469: derived, never declared
export const SHA = "4b83414e";
const TREE = REPO_ROOT;

/** every file the drawing surface takes a product VALUE from, by the import block at :3–:16. */
export const SOURCES = Object.freeze({
  FIELD:  "app/components/career/demo/PersonJobMappingField.tsx",
  MODEL:  "lib/career/view-model/mapping-field.ts",
  FOCUS:  "lib/career/mapping/focus.ts",
  TOKENS: "app/components/career/demo/SILTokens.ts",
  COPY:   "app/components/career/demo/mapping-field-copy.ts",
});
const text = Object.fromEntries(Object.entries(SOURCES).map(([k, p]) =>
  [k, execFileSync("git", ["-C", TREE, "show", `${SHA}:${p}`], { encoding: "utf8" })]));
const src = text.FIELD;

const fail = (m, where) => { throw new Error(`ERR_GELB_PRODUCT_CONSTANT_UNREADABLE at ${SHA}:${SOURCES[where] ?? where}\n  ${m}\n  REFUSING to export: an instrument must not run on a value this module could not read from the product.`); };
/** one capture group, exactly one match in the named source, or throw */
const one = (re, what, where = "FIELD") => {
  const m = [...text[where].matchAll(re)];
  if (m.length !== 1) fail(`${what}: expected exactly 1 match of ${re}, found ${m.length}`, where);
  return m[0][1];
};
const num = (re, what, where) => { const v = Number(one(re, what, where)); if (!Number.isFinite(v)) fail(`${what}: not a finite number`, where ?? "FIELD"); return v; };
const triple = (re, what) => {
  const s = one(re, what), p = s.split(",").map(x => Number(x.trim()));
  if (p.length !== 3 || p.some(x => !Number.isInteger(x) || x < 0 || x > 255)) fail(`${what}: "${s}" is not an rgb triple`, "FIELD");
  return p;
};
/** the body of a single-line `name: Object.freeze({ … })`, so `periodMs` can be read inside ONE owner.
 *  §90: periodMs: 10000 occurs 3 times in the FIELD file (WAVE, TRAVEL, MOTION.breath), so an
 *  unscoped /periodMs:\s*([0-9]+)/ would have matched three owners and this module would have
 *  refused — correctly, but without saying which. Scoping says which. */
const inside = (owner, key, what) => {
  const body = one(new RegExp(`${owner}\\s*(?::|=)\\s*Object\\.freeze\\(\\{([^{}]*)\\}`, "g"), `${what} owner ${owner}`);
  const m = [...body.matchAll(new RegExp(`\\b${key}:\\s*([0-9.]+)`, "g"))];
  if (m.length !== 1) fail(`${what}: ${owner}.${key} matched ${m.length} times inside its own body`, "FIELD");
  const v = Number(m[0][1]);
  if (!Number.isFinite(v)) fail(`${what}: not finite`, "FIELD");
  return v;
};

/* ── FIELD: the drawing surface ── */
export const HALO_DEPTH    = inside("WAVE", "haloDepth", "WAVE.haloDepth");
export const SELECTED_GAIN = inside("WAVE", "selectedGain", "WAVE.selectedGain");
export const WAVE_PEAK     = inside("WAVE", "peakAlpha", "WAVE.peakAlpha");
export const WAVE_PERIOD_MS = inside("WAVE", "periodMs", "WAVE.periodMs");
export const WAVE_LAYERS   = inside("WAVE", "layers", "WAVE.layers");
export const HALO_ALPHA    = inside("VOLUME", "haloAlpha", "VOLUME.haloAlpha");
export const CORE_ALPHA    = inside("VOLUME", "coreAlpha", "VOLUME.coreAlpha");
export const DEPTH_RATIO   = inside("VOLUME", "depthRatio", "VOLUME.depthRatio");
export const HALO_NEAR     = inside("VOLUME", "haloNear", "VOLUME.haloNear");
export const HALO_FAR      = inside("VOLUME", "haloFar", "VOLUME.haloFar");
export const SEAT_PAD_PX   = num(/export const SEAT_PAD_PX = ([0-9.]+);/g, "SEAT_PAD_PX");
export const TEXT_SEAT_PX  = num(/export const TEXT_SEAT_PX = ([0-9.]+);/g, "TEXT_SEAT_PX");
export const CHAR_EM       = num(/const CHAR_EM = ([0-9.]+);/g, "CHAR_EM");
export const CROWDING      = num(/export const CROWDING = ([0-9.]+);/g, "CROWDING");
export const WEDGE_WASH    = num(/export const WEDGE_WASH = ([0-9.]+);/g, "WEDGE_WASH");
export const GAP_ALPHA_GAIN = num(/export const GAP_ALPHA_GAIN = ([0-9.]+);/g, "GAP_ALPHA_GAIN");
export const CYAN          = triple(/const CYAN = "([^"]+)";/g, "CYAN");
export const INK           = triple(/const INK = "([^"]+)";/g, "INK");
export const GAP_HUE       = triple(/export const GAP_HUE = "([^"]+)";/g, "GAP_HUE");
export const LABEL_GAP      = num(/LABEL_GAP = ([0-9.]+)/g, "LABEL_GAP");
export const DRAWN_PX       = num(/const DRAWN_PX = ([0-9.]+)/g, "DRAWN_PX");
export const BODY_BUDGET_L0 = num(/BODY_BUDGET = Object\.freeze\(\{ L0: ([0-9]+)/g, "BODY_BUDGET.L0");
export const BODY_BUDGET_L1 = num(/BODY_BUDGET = Object\.freeze\(\{ L0: [0-9]+, L1: ([0-9]+)/g, "BODY_BUDGET.L1");

/* §90 A-G406: the three constants §89 found UNWATCHED IN BOTH LANES AT ONCE — the cross-lane gap
   A-G405 says is a property of the pair. They are read here first because that is where the gap was. */
const fourRing = (key) => num(new RegExp(`RING_LUMINANCE = Object\\.freeze\\(\\{[^}]*\\b${key}: ([0-9.]+)`, "g"), `RING_LUMINANCE.${key}`);
export const RING_LUMINANCE = Object.freeze({ shelf: fourRing("shelf"), best: fourRing("best"), field: fourRing("field"), horizon: fourRing("horizon") });
export const RING_SHELF = RING_LUMINANCE.shelf;   // the name §80–§89 cite it by
const ringWidth = (key) => num(new RegExp(`RING_WIDTH_PX = Object\\.freeze\\(\\{[^}]*\\b${key}: ([0-9.]+)`, "g"), `RING_WIDTH_PX.${key}`);
export const RING_WIDTH_PX = Object.freeze({ best: ringWidth("best"), field: ringWidth("field"), horizon: ringWidth("horizon") });
export const GROUND_STOPS = (() => {
  const body = one(/export const GROUND = Object\.freeze\(\{ stops: Object\.freeze\(\[([\s\S]*?)\]\s*as const\)/g, "GROUND.stops");
  const pairs = [...body.matchAll(/\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g)].map(m => [Number(m[1]), Number(m[2])]);
  if (pairs.length < 2) fail(`GROUND.stops: parsed ${pairs.length} stops`, "FIELD");
  if (pairs[0][0] !== 0 || pairs[pairs.length - 1][0] !== 1) fail("GROUND.stops: offsets do not span [0,1]", "FIELD");
  for (let i = 1; i < pairs.length; i++) if (pairs[i][1] >= pairs[i - 1][1]) fail("GROUND.stops: alpha is not strictly falling outward", "FIELD");
  return Object.freeze(pairs);
})();
export const MOTION_BREATH = Object.freeze({
  periodMs:         inside("breath", "periodMs", "MOTION.breath.periodMs"),
  radiusAmplitude:  inside("breath", "radiusAmplitude", "MOTION.breath.radiusAmplitude"),
  opacityMean:      inside("breath", "opacityMean", "MOTION.breath.opacityMean"),
  opacityAmplitude: inside("breath", "opacityAmplitude", "MOTION.breath.opacityAmplitude"),
});
export const MOTION_QUERY = Object.freeze({
  periodMs:    inside("query", "periodMs", "MOTION.query.periodMs"),
  amplitudePx: inside("query", "amplitudePx", "MOTION.query.amplitudePx"),
});

/** §90: the breath groups AS THE STYLESHEET DEFINES THEM — the only two that exist. Parsed as the
 *  EXPRESSIONS they are written as, so the halo's mean is checked to BE 1 − haloDepth/2 rather than
 *  compared against a literal 0.8825 held here. A relation verified beats a number stored. */
export const WAVE_GROUPS = (() => {
  const g = {};
  for (const [cls, mean, depth] of [...src.matchAll(/\.mf-wave-([a-z]+)\s*\{\s*--mf-wave-mean:\s*([^;]+);\s*--mf-wave-depth:\s*([^;]+);/g)]
      .map(m => [m[1], m[2].trim(), m[3].trim()])) {
    const ev = (e, what) => {
      if (/^[0-9.]+$/.test(e)) return Number(e);
      const m = /^\$\{\s*(1\s*-\s*)?WAVE\.haloDepth\s*\/\s*2\s*\}$/.exec(e);
      if (!m) fail(`.mf-wave-${cls} ${what}: "${e}" is neither a literal nor the haloDepth relation`, "FIELD");
      return m[1] ? 1 - HALO_DEPTH / 2 : HALO_DEPTH / 2;
    };
    g[cls] = Object.freeze({ mean: ev(mean, "mean"), depth: ev(depth, "depth") });
  }
  if (!g.ground || !g.halo) fail(`WAVE_GROUPS: expected ground and halo, found ${Object.keys(g).join(",") || "none"}`, "FIELD");
  return Object.freeze(g);
})();
/** the keyframe's own law, read rather than assumed: opacity = mean + depth × gain × w, w ∈ [−1,1]. */
export const WAVE_KEYFRAME = one(/return `\$\{[^`]*?\}% \{ (opacity: calc\([^)]*\)[^;]*);/g, "the wave keyframe body").trim();

export const GLOW_RAMP = (() => {
  const body = one(/export const GLOW_RAMP[^=]*=\s*Object\.freeze\(\[([\s\S]*?)\]\s*as const\)/g, "GLOW_RAMP");
  const pairs = [...body.matchAll(/\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g)].map(m => [Number(m[1]), Number(m[2])]);
  if (pairs.length < 3) fail(`GLOW_RAMP: parsed ${pairs.length} stops`, "FIELD");
  if (pairs[0][0] !== 0 || pairs[pairs.length - 1][0] !== 1) fail("GLOW_RAMP: offsets do not span [0,1]", "FIELD");
  return pairs;
})();

/* ── MODEL: the seven values the drawing surface IMPORTS, §89's scope defect, now in scope ── */
export const SIZE_FLOOR_PX           = num(/export const SIZE_FLOOR_PX = ([0-9.]+);/g, "SIZE_FLOOR_PX", "MODEL");
export const PRIMARY_BEAM_LUMINANCE  = num(/export const PRIMARY_BEAM_LUMINANCE = ([0-9.]+);/g, "PRIMARY_BEAM_LUMINANCE", "MODEL");
export const COLLAR_MIN_ARC_PX       = num(/export const COLLAR_MIN_ARC_PX = ([0-9.]+);/g, "COLLAR_MIN_ARC_PX", "MODEL");
export const LUMINANCE_STEP_MIN      = num(/export const LUMINANCE_STEP_MIN = ([0-9.]+);/g, "LUMINANCE_STEP_MIN", "MODEL");
export const EVIDENCE_BAND = (() => {
  /* the bands are NESTED Object.freeze([lo, hi] as const), so the inner form is parsed, not a bare pair. */
  const body = one(/export const EVIDENCE_BAND[^=]*=\s*Object\.freeze\(\{([\s\S]*?)\n\}\s*\);/g, "EVIDENCE_BAND", "MODEL");
  const out = Object.fromEntries([...body.matchAll(/(\w+):\s*Object\.freeze\(\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g)]
    .map(m => [m[1], Object.freeze([Number(m[2]), Number(m[3])])]));
  if (!Object.keys(out).length) fail("EVIDENCE_BAND: no bands parsed", "MODEL");
  for (const [k, [lo, hi]] of Object.entries(out)) if (!(hi > lo)) fail(`EVIDENCE_BAND.${k}: [${lo}, ${hi}] is not an ascending band`, "MODEL");
  return Object.freeze(out);
})();

export const READ = {
  HALO_DEPTH, SELECTED_GAIN, WAVE_PEAK, WAVE_PERIOD_MS, WAVE_LAYERS, HALO_ALPHA, CORE_ALPHA, DEPTH_RATIO,
  HALO_NEAR, HALO_FAR, SEAT_PAD_PX, TEXT_SEAT_PX, CHAR_EM, CROWDING, WEDGE_WASH, GAP_ALPHA_GAIN, CYAN, INK,
  GAP_HUE, LABEL_GAP, DRAWN_PX, BODY_BUDGET_L0, BODY_BUDGET_L1, RING_LUMINANCE, RING_WIDTH_PX, GROUND_STOPS,
  MOTION_BREATH, MOTION_QUERY, WAVE_GROUPS, GLOW_RAMP, SIZE_FLOOR_PX, PRIMARY_BEAM_LUMINANCE,
  COLLAR_MIN_ARC_PX, LUMINANCE_STEP_MIN, EVIDENCE_BAND,
};

/** what each source's declarations are, and which of them this module reaches. Per FILE, because a
 *  single fraction over a single file is the defect §89 found. */
const COVERED = {
  FIELD: ["WAVE", "VOLUME", "RING_LUMINANCE", "RING_WIDTH_PX", "GROUND", "MOTION", "GLOW_RAMP", "SEAT_PAD_PX",
    "TEXT_SEAT_PX", "CHAR_EM", "CROWDING", "WEDGE_WASH", "GAP_ALPHA_GAIN", "CYAN", "INK", "GAP_HUE",
    "BODY_BUDGET", "LABEL_GAP", "DRAWN_PX"],
  MODEL: ["SIZE_FLOOR_PX", "PRIMARY_BEAM_LUMINANCE", "COLLAR_MIN_ARC_PX", "LUMINANCE_STEP_MIN", "EVIDENCE_BAND"],
  FOCUS: [], TOKENS: [], COPY: [],
};
const declsOf = s => [...new Set([...s.matchAll(/^(?:export )?const ([A-Z][A-Z0-9_]+)\s*(?::[^=]+)?=/gm)].map(m => m[1]))].sort();

export function coverage() {
  const perFile = {}, imported = importedNames();
  for (const k of Object.keys(SOURCES)) {
    const declared = declsOf(text[k]), covered = COVERED[k];
    const ghost = covered.filter(n => !declared.includes(n));
    if (ghost.length) fail(`coverage(): claims to cover ${ghost.join(",")} which ${SOURCES[k]} does not declare`, k);
    perFile[k] = { file: SOURCES[k], declared, covered: [...covered].sort(), uncovered: declared.filter(n => !covered.includes(n)) };
  }
  const all = Object.values(perFile);
  const nDecl = all.reduce((a, f) => a + f.declared.length, 0);
  const nCov = all.reduce((a, f) => a + f.covered.length, 0);
  const nUnc = all.reduce((a, f) => a + f.uncovered.length, 0);
  if (nCov + nUnc !== nDecl) throw new Error(`coverage() tally: ${nCov} + ${nUnc} != ${nDecl}`);
  /* the names the drawing surface imports: now all resolvable to a source this module READS, which is
     the §89 defect discharged — "outOfScope" is kept and is expected to be empty. */
  const unresolved = imported.filter(n => !all.some(f => f.declared.includes(n)));
  return { perFile, declared: nDecl, covered: nCov, uncovered: nUnc, imported, outOfScope: unresolved };
}
export function importedNames() {
  const block = src.slice(0, src.indexOf("\n/**"));
  return [...new Set((block.match(/\b[A-Z][A-Z0-9_]{2,}\b/g) || [])
    .filter(n => !/^(PERSON_X_JOB_MAPPING_PHASE_[A-Z]|URL|ONE|POST|JOB|PERSON|MAPPING)$/.test(n)))].sort();
}
