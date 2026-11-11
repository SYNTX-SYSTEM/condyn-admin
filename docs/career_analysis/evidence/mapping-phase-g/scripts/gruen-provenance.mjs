/**
 * GRÜN · PHASE-G · the lane's identity and verdict stamp, WITH NO DEPENDENCIES AT ALL.
 *
 * §62 DEFECT 10. This file exists to break a coupling, not to add a layer. `gruen-instrument.mjs` imports
 * Playwright and `sharp` AT MODULE LOAD and throws `ERR_INSTRUMENT_NO_PLAYWRIGHT` if Playwright is absent.
 * Every derivation — the ones that render nothing, need no build, no server and no façade, and exist
 * precisely so that something in this lane can be checked on a bare checkout — imported `PROVENANCE` from
 * there, and so inherited that hard requirement to obtain ONE FROZEN STRING.
 *
 * The consequence was the opposite of what run-all.sh's own comment claimed: the lane's only build-free
 * checks were hostage to `CONDYN_PLAYWRIGHT_MODULE`, an UNVERSIONED PATH INTO AN UNRELATED REPOSITORY that
 * README §5 itself records as integrity risk **I-2** — "one `node_modules` deletion in an unrelated project
 * away from rendering the proof stand unrunnable". Verified before the split: with that path unset to a
 * nonexistent file, `gruen-pg16-satisfiability.mjs` — pure arithmetic over committed JSON — failed to start.
 *
 * So the stamp moves here, where it has no imports, and `gruen-instrument.mjs` re-exports it unchanged so
 * that every existing probe keeps working with no edit. Nothing about any reading changes.
 */
export const PW_MODULE = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
export const SHARP_MODULE = process.env.CONDYN_SHARP_MODULE ?? new URL("../../../../../node_modules/sharp/lib/index.js", import.meta.url).pathname;
export const BASE = process.env.GRUEN_BASE ?? "http://127.0.0.1:3220";
export const ANALYSIS = "CAN_00000000000000000000000000000002";
export const FIELD_URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`;
export const PROVENANCE = Object.freeze({
  playwrightModule: PW_MODULE, sharpModule: SHARP_MODULE, base: BASE,
  instrument: "GRÜN phase-G development instrument", verdict: "NONE — development reading only (A-G36 point 2)"
});
