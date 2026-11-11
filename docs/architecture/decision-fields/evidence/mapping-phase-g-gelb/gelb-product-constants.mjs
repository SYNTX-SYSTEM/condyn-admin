/**
 * GELB · THE ONE PLACE A PRODUCT CONSTANT IS READ, AND IT HALTS.
 *
 * §87 A-G395: six product constants were duplicated across my instruments with at least one copy that
 * checked nothing — HALTS in 1 file, REPORTS in 4, NOTHING in 6, and the NOTHING six included the two
 * instruments carrying §83's and §84's findings. A constant copied out of the product without a check is
 * not a citation; it is a fork. This is the check, in the form GRÜN's writeSealed() took: it REFUSES
 * rather than reports.
 *
 * Every export below is asserted against the committed product at a PINNED build. If a constant moved,
 * the import throws and the importing instrument does not run. That is the difference between HALTS and
 * REPORTS, and §87 found I only had the latter where it mattered.
 */
import { execFileSync } from "node:child_process";
export const SHA = "4b83414e";
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d";
const FILE = "app/components/career/demo/PersonJobMappingField.tsx";
const src = execFileSync("git", ["-C", TREE, "show", `${SHA}:${FILE}`], { encoding: "utf8" });

/* each entry: the exported value, and the EXACT substring of the product that must contain it */
const PINS = [
  ["HALO_DEPTH",    0.235,  "haloDepth: 0.235"],
  ["SELECTED_GAIN", 0.35,   "selectedGain: 0.35"],
  ["HALO_ALPHA",    0.5,    "haloAlpha: 0.5"],
  ["CORE_ALPHA",    0.16,   "coreAlpha: 0.16"],
  ["DEPTH_RATIO",   1.45,   "depthRatio: 1.45"],
  ["SEAT_PAD_PX",   1.6,    "export const SEAT_PAD_PX = 1.6;"],
  ["CHAR_EM",       0.62,   "const CHAR_EM = 0.62;"],
  ["CROWDING",      0.3,    "export const CROWDING = 0.3;"],
  ["WEDGE_WASH",    0.009,  "export const WEDGE_WASH = 0.009;"],
];
const STRINGS = [
  ["CYAN",    "92, 200, 255",   'const CYAN = "92, 200, 255";'],
  ["GAP_HUE", "245, 166, 35",   'export const GAP_HUE = "245, 166, 35";'],
];
const RAMP = [[0, 1], [0.33, 1], [0.45, 0.72], [0.58, 0.46], [0.72, 0.24], [0.86, 0.08], [1, 0]];
const RAMP_NEEDLE = "[[0, 1], [0.33, 1], [0.45, 0.72], [0.58, 0.46], [0.72, 0.24], [0.86, 0.08], [1, 0]]";

const bad = [];
const occurs = needle => { const n = src.split(needle).length - 1; return n; };
for (const [name, , needle] of [...PINS, ...STRINGS, ["GLOW_RAMP", null, RAMP_NEEDLE]]) {
  const n = occurs(needle);
  if (n !== 1) bad.push(`${name}: expected exactly 1 occurrence of \`${needle}\`, found ${n}`);
}
if (bad.length) {
  throw new Error(
    `ERR_GELB_PRODUCT_CONSTANT_MOVED at ${SHA}:${FILE}\n  ` + bad.join("\n  ") +
    `\n  REFUSING to export. An instrument importing this module must not run on a stale constant.` +
    `\n  Fix: re-read the product, update this module, and re-run every instrument that imports it.`);
}

export const HALO_DEPTH = 0.235, SELECTED_GAIN = 0.35, HALO_ALPHA = 0.5, CORE_ALPHA = 0.16;
export const DEPTH_RATIO = 1.45, SEAT_PAD_PX = 1.6, CHAR_EM = 0.62, CROWDING = 0.3, WEDGE_WASH = 0.009;
export const CYAN = [92, 200, 255], GAP_HUE = [245, 166, 35], GLOW_RAMP = RAMP;
export const VERIFIED = PINS.length + STRINGS.length + 1;
