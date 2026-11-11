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
 * So this module no longer declares a single product value. Every export is PARSED out of the committed
 * product at a pinned build, and the parse throws if a declaration is missing, duplicated or malformed —
 * which is a weaker failure mode than a stale copy, because there is no copy to go stale.
 *
 * GRÜN's second rule from the same section is also honoured: "a declaration the audit cannot extract is
 * one it cannot check anywhere — a hole in the audit before it is a hole in any instrument." So the
 * module reports its own COVERAGE: which product constants it extracts, and which exported constants of
 * the product it does not. A constant absent from this list is unguarded everywhere, silently.
 */
import { execFileSync } from "node:child_process";
export const SHA = "4b83414e";
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const src = execFileSync("git", ["-C", TREE, "show", `${SHA}:${FILE}`], { encoding: "utf8" });

const fail = m => { throw new Error(`ERR_GELB_PRODUCT_CONSTANT_UNREADABLE at ${SHA}:${FILE}\n  ${m}\n  REFUSING to export: an instrument must not run on a value this module could not read from the product.`); };
/** one capture group, exactly one match, or throw */
const one = (re, what) => {
  const m = [...src.matchAll(re)];
  if (m.length !== 1) fail(`${what}: expected exactly 1 match of ${re}, found ${m.length}`);
  return m[0][1];
};
const num = (re, what) => { const v = Number(one(re, what)); if (!Number.isFinite(v)) fail(`${what}: not a finite number`); return v; };
const triple = (re, what) => {
  const s = one(re, what), p = s.split(",").map(x => Number(x.trim()));
  if (p.length !== 3 || p.some(x => !Number.isInteger(x) || x < 0 || x > 255)) fail(`${what}: "${s}" is not an rgb triple`);
  return p;
};

/* ── every value PARSED, none held ── */
export const HALO_DEPTH    = num(/haloDepth:\s*([0-9.]+)/g, "WAVE.haloDepth");
export const SELECTED_GAIN = num(/selectedGain:\s*([0-9.]+)/g, "WAVE.selectedGain");
export const WAVE_PEAK     = num(/peakAlpha:\s*([0-9.]+)/g, "WAVE.peakAlpha");
export const HALO_ALPHA    = num(/haloAlpha:\s*([0-9.]+)/g, "VOLUME.haloAlpha");
export const CORE_ALPHA    = num(/coreAlpha:\s*([0-9.]+)/g, "VOLUME.coreAlpha");
export const DEPTH_RATIO   = num(/depthRatio:\s*([0-9.]+)/g, "VOLUME.depthRatio");
export const HALO_NEAR     = num(/haloNear:\s*([0-9.]+)/g, "VOLUME.haloNear");
export const HALO_FAR      = num(/haloFar:\s*([0-9.]+)/g, "VOLUME.haloFar");
export const SEAT_PAD_PX   = num(/export const SEAT_PAD_PX = ([0-9.]+);/g, "SEAT_PAD_PX");
export const TEXT_SEAT_PX  = num(/export const TEXT_SEAT_PX = ([0-9.]+);/g, "TEXT_SEAT_PX");
export const CHAR_EM       = num(/const CHAR_EM = ([0-9.]+);/g, "CHAR_EM");
export const CROWDING      = num(/export const CROWDING = ([0-9.]+);/g, "CROWDING");
export const WEDGE_WASH    = num(/export const WEDGE_WASH = ([0-9.]+);/g, "WEDGE_WASH");
export const GAP_ALPHA_GAIN = num(/export const GAP_ALPHA_GAIN = ([0-9.]+);/g, "GAP_ALPHA_GAIN");
export const CYAN          = triple(/const CYAN = "([^"]+)";/g, "CYAN");
export const INK           = triple(/const INK = "([^"]+)";/g, "INK");
export const GAP_HUE       = triple(/export const GAP_HUE = "([^"]+)";/g, "GAP_HUE");
export const RING_SHELF    = num(/RING_LUMINANCE = Object\.freeze\(\{ shelf: ([0-9.]+)/g, "RING_LUMINANCE.shelf");
/* §88 A-G400: the two uncovered constants that bear on LIVE pins — BODY_BUDGET on §69's character
   budget and LABEL_GAP on PG-14's frame. Added first because "34 uncovered" is only a useful number
   if the ones touching open questions come out of it. */
export const BODY_BUDGET_L0 = num(/BODY_BUDGET = Object\.freeze\(\{ L0: ([0-9]+)/g, "BODY_BUDGET.L0");
export const BODY_BUDGET_L1 = num(/BODY_BUDGET = Object\.freeze\(\{ L0: [0-9]+, L1: ([0-9]+)/g, "BODY_BUDGET.L1");
export const LABEL_GAP      = num(/LABEL_GAP = ([0-9.]+)/g, "LABEL_GAP");
export const DRAWN_PX       = num(/const DRAWN_PX = ([0-9.]+)/g, "DRAWN_PX");
/* NOT covered, and the refusal is the finding: SIZE_FLOOR_PX and FRAME_PASS_CAP do not exist at this
   pinned build. GRÜN's §89 named LABEL_GAP, FRAME_PASS_CAP and SIZE_FLOOR_PX as the three product
   constants equal to 12; only LABEL_GAP is here, so two of the three are POST-4b83414e — they came with
   GRÜN's PG-14 work. So this module's coverage count is against 4b83414e and NOT against what ships,
   which is a limit on the number rather than on the module. Stated because the module refused to export
   a constant I had assumed existed, which is the behaviour A-G398 bought. */

export const GLOW_RAMP = (() => {
  const body = one(/export const GLOW_RAMP[^=]*=\s*Object\.freeze\(\[([\s\S]*?)\]\s*as const\)/g, "GLOW_RAMP");
  const pairs = [...body.matchAll(/\[\s*([0-9.]+)\s*,\s*([0-9.]+)\s*\]/g)].map(m => [Number(m[1]), Number(m[2])]);
  if (pairs.length < 3) fail(`GLOW_RAMP: parsed ${pairs.length} stops`);
  if (pairs[0][0] !== 0 || pairs[pairs.length - 1][0] !== 1) fail(`GLOW_RAMP: offsets do not span [0,1]`);
  return pairs;
})();

export const READ = {
  HALO_DEPTH, SELECTED_GAIN, WAVE_PEAK, HALO_ALPHA, CORE_ALPHA, DEPTH_RATIO, HALO_NEAR, HALO_FAR,
  SEAT_PAD_PX, TEXT_SEAT_PX, CHAR_EM, CROWDING, WEDGE_WASH, GAP_ALPHA_GAIN, CYAN, INK, GAP_HUE,
  RING_SHELF, GLOW_RAMP, BODY_BUDGET_L0, BODY_BUDGET_L1, LABEL_GAP, DRAWN_PX,
};

/** GRÜN's rule: a declaration the audit cannot extract is unguarded everywhere. So report the gap. */
export function coverage() {
  const declared = [...src.matchAll(/^(?:export )?const ([A-Z][A-Z0-9_]+)\s*(?::[^=]+)?=/gm)].map(m => m[1]);
  const covered = new Set(["HALO_DEPTH", "SELECTED_GAIN", "WAVE_PEAK", "HALO_ALPHA", "CORE_ALPHA", "DEPTH_RATIO",
    "HALO_NEAR", "HALO_FAR", "SEAT_PAD_PX", "TEXT_SEAT_PX", "CHAR_EM", "CROWDING", "WEDGE_WASH",
    "GAP_ALPHA_GAIN", "CYAN", "INK", "GAP_HUE", "RING_SHELF", "GLOW_RAMP", "WAVE", "VOLUME",
    "RING_LUMINANCE", "BODY_BUDGET", "LABEL_GAP", "DRAWN_PX"]);
  return { declared: [...new Set(declared)].sort(), uncovered: [...new Set(declared)].filter(n => !covered.has(n)).sort() };
}
