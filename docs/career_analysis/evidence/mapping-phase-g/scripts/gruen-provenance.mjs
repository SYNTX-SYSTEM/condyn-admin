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
import { existsSync, readFileSync, writeFileSync } from "node:fs";

export const PW_MODULE = process.env.CONDYN_PLAYWRIGHT_MODULE ?? "/home/codi/Entwicklung/nquiry/node_modules/playwright/index.mjs";
export const SHARP_MODULE = process.env.CONDYN_SHARP_MODULE ?? new URL("../../../../../node_modules/sharp/lib/index.js", import.meta.url).pathname;
export const BASE = process.env.GRUEN_BASE ?? "http://127.0.0.1:3220";
export const ANALYSIS = "CAN_00000000000000000000000000000002";
export const FIELD_URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`;
export const PROVENANCE = Object.freeze({
  playwrightModule: PW_MODULE, sharpModule: SHARP_MODULE, base: BASE,
  instrument: "GRÜN phase-G development instrument", verdict: "NONE — development reading only (A-G36 point 2)"
});

/**
 * §88 DEFECT 16 — EVIDENCE MUST LIVE IN ONE WORKTREE, AND IT ALMOST DID NOT.
 *
 * §82 added a second worktree as a BUILD HOST. Every probe resolves its output path relative to its OWN
 * location (`resolve(here, "../outputs/...")`), so running the build host's COPY of a probe writes the
 * reading into the build host — where nothing reads it, where the staleness audit does not scan, and where
 * it sits beside an identically-named file from a different build.
 *
 * That is exactly what happened: `fixture-states-1920x1080.json` was written into the hooks worktree at build
 * `utpaUMQpafZVzAeyYImhv` while the canonical copy still held `TKZRoMo0_1Ro-svJrokkW`. Two readings, one
 * name, two worktrees, and the newer one invisible to every instrument that looks for it.
 *
 * THE CAUSE IS A SHELL DETAIL WORTH NAMING, because it will recur: in `cd A && CMD & disown; cd B && node …`
 * the `&` backgrounds `cd A && CMD` INTO A SUBSHELL, so the main shell never leaves its previous directory
 * and the later RELATIVE `cd B` resolves from the wrong root. Nothing errored. The reading was written
 * successfully, to the wrong place — A-G374's shape again, a tool reporting on its own execution.
 *
 * So the invariant is asserted at module load, in the one module every probe imports. `GRUEN_EVIDENCE_ROOT`
 * overrides it for a deliberate second store; otherwise a probe run from any other worktree FAILS LOUD
 * rather than writing where no one will look.
 */
const CANONICAL_EVIDENCE_ROOT = process.env.GRUEN_EVIDENCE_ROOT ?? "/home/codi/Entwicklung/condyn-admin-mapping-d";
const _hereDir = new URL(".", import.meta.url).pathname;
const _worktreeOfScript = _hereDir.replace(/\/docs\/career_analysis\/evidence\/mapping-phase-g\/scripts\/?$/, "");
if (_worktreeOfScript !== CANONICAL_EVIDENCE_ROOT) {
  throw new Error(
    `ERR_GRUEN_WRONG_EVIDENCE_WORKTREE: this probe lives in ${_worktreeOfScript} but evidence belongs in ` +
    `${CANONICAL_EVIDENCE_ROOT}. Run the canonical worktree's copy of the script (absolute path), or set ` +
    `GRUEN_EVIDENCE_ROOT deliberately. A reading written into a build host is invisible to the staleness ` +
    `audit and collides by name with the canonical one.`
  );
}
export const EVIDENCE_ROOT = CANONICAL_EVIDENCE_ROOT;

/**
 * §88 · A-G109 ENFORCED IN CODE RATHER THAN BY CONVENTION.
 *
 * Three probes write a `SEALED-*` file — gruen-pg11, gruen-pg12-chroma, gruen-pg17 — and all three wrote it
 * UNCONDITIONALLY. The only thing protecting the eight seals was that those probes are kept out of
 * run-all.sh. That is a convention, and a convention is not a boundary: one deliberate re-run of a probe for
 * its UNSEALED companion would have silently replaced a seal.
 *
 * And that companion is the live case, not a hypothetical. `gruen-pg11.mjs` writes `pg11-guard-*.json` AND
 * `SEALED-pg11-ratio-*.json` in ONE PASS — and the guard file carries the marginFactor that GELB's
 * INCONCLUSIVE-BY-MEASUREMENT closure of PG-11's relation limb rests on. So "re-run the unsealed reading,
 * defer the seals" could not be done at all: the probe did not separate them. Now it does.
 *
 * `writeSealed` refuses to replace an existing seal unless `GRUEN_RESEAL=1` says so deliberately, reports
 * what it declined on stderr, and returns the outcome so a probe can record in its own output that its seal
 * was not rewritten. Re-sealing stays a ruling; refreshing an unsealed companion becomes a re-run.
 */
export function writeSealed(path, json) {
  const text = `${JSON.stringify(json, null, 1)}\n`.replace(/\n$/, "");
  const exists = existsSync(path);
  const name = path.split("/").pop();
  if (!exists) { writeFileSync(path, text); return { written: true, outcome: "CREATED", path }; }
  if (readFileSync(path, "utf8") === text) return { written: false, outcome: "IDENTICAL", path };
  if (process.env.GRUEN_RESEAL !== "1") {
    console.error(`!! DECLINED to overwrite a SEALED reading: ${name}`);
    console.error(`   A-G109: a seal is replaced only by a deliberate act. Set GRUEN_RESEAL=1 to re-seal.`);
    console.error(`   The probe's UNSEALED output, if it has one, was written normally.`);
    return { written: false, outcome: "REFUSED", path };
  }
  writeFileSync(path, text);
  return { written: true, outcome: "RESEALED", path };
}
