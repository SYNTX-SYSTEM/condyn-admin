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
/**
 * §130 — the ONE dependency this module now has, and why it does not reopen §62 DEFECT 10.
 *
 * The docstring above says "WITH NO DEPENDENCIES AT ALL", and the point of that was never the import count:
 * it was that a DERIVATION — arithmetic over committed JSON, no render, no build, no server — must not
 * inherit a hard requirement on Playwright to obtain one frozen string. `gruen-paths.mjs` imports node
 * builtins only. It touches neither Playwright nor sharp at import, so every build-free check still runs on a
 * bare checkout, which is the property §62 bought and this keeps.
 *
 * What it buys: the two machine-absolute paths below are gone. `PW_MODULE` named a file inside
 * /home/codi/Entwicklung/nquiry — a DIFFERENT repository (SYNTX-SYSTEM/NQUIRY.git) that origin does not
 * contain — and 47 of this lane's output files carry that path. README §5's risk I-2, measured.
 */
import { EVIDENCE_ROOT as DERIVED_EVIDENCE_ROOT, resolveToolModule, launchProvenance } from "./gruen-paths.mjs";

/**
 * RESOLUTION IS LAZY AND IT REFUSES RATHER THAN GUESSING.
 *
 * `resolveToolModule` throws ERR_GRUEN_TOOL_UNRESOLVED naming every candidate it tried. Calling it eagerly
 * here would make that throw happen at the import of this module — i.e. in every derivation — which is
 * exactly the coupling §62 removed. So the attempt is made eagerly but the FAILURE is deferred: a derivation
 * that never renders gets `null` and a recorded reason; a probe that needs a browser calls
 * `playwrightModuleOrThrow()` and gets the full candidate list.
 *
 * MEASURED on frontend/mapping-phase-g at 9b57319d: sharp resolves by BARE_IMPORT at 0.34.5 (transitively,
 * under next@16.2.4 — present but UNDECLARED, which is its own fragility and is reported as such), and
 * playwright does NOT resolve bare and lands on the documented fallback at 1.63.0. GELB declared both as
 * exact devDependencies at 430741fc on the integration branch; once that reaches this branch, both resolve by
 * BARE_IMPORT and `npm ci` from a fresh clone is enough.
 */
const _tool = name => { try { return { ...resolveToolModule(name), error: null }; } catch (e) { return { path: null, version: null, how: "UNRESOLVED", error: String(e.message).split("\n")[0] }; } };
const _pw = _tool("playwright"), _sharp = _tool("sharp");

export const PW_MODULE = _pw.path;
export const SHARP_MODULE = _sharp.path;
export function playwrightModuleOrThrow() { if (_pw.path === null) resolveToolModule("playwright"); return _pw.path; }
export function sharpModuleOrThrow() { if (_sharp.path === null) resolveToolModule("sharp"); return _sharp.path; }

export const BASE = process.env.GRUEN_BASE ?? "http://127.0.0.1:3220";
export const ANALYSIS = "CAN_00000000000000000000000000000002";
export const FIELD_URL = `${BASE}/career/demo?focus=MAPPING&investigationMode=PERSON&analysisId=${ANALYSIS}`;
export const PROVENANCE = Object.freeze({
  playwrightModule: PW_MODULE, sharpModule: SHARP_MODULE, base: BASE,
  /* §130: a figure now records WHICH BUILD of its tool produced it and HOW that tool was found, so a reading
     taken against an out-of-repository fallback is distinguishable from one taken against the declared
     devDependency. The old block recorded a path and nothing else, and a path is not a version. */
  playwright: Object.freeze({ resolvedBy: _pw.how, version: _pw.version, path: _pw.path, unresolvedReason: _pw.error }),
  sharp: Object.freeze({ resolvedBy: _sharp.how, version: _sharp.version, path: _sharp.path, unresolvedReason: _sharp.error }),
  ...launchProvenance(),
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
/**
 * §130 — THE FIX ABOVE WAS RIGHT ABOUT THE DEFECT AND WRONG ABOUT THE REMEDY, and the difference matters.
 *
 * The §88 remedy asserted equality against an ABSOLUTE canonical root. That closed the scatter and created a
 * machine lock: from a fresh clone of origin the assertion throws, so this module — imported by 25 of this
 * lane's instruments — could not be imported anywhere but on one machine. *** A GUARD THAT CANNOT RUN FROM A
 * FRESH CLONE IS NOT A GUARD, IT IS A MACHINE LOCK, *** and it is A-G469's filesystem clause committed by the
 * instrument written to respect it.
 *
 * The invariant §88 actually needs is already structural and was never the absolute path's doing: every probe
 * resolves its output as `resolve(here, "../outputs/…")`, so a probe WRITES INTO THE TREE IT WAS LAUNCHED
 * FROM, full stop. What was missing was not a pin but a LABEL — §88's symptom was two same-named readings in
 * two worktrees with nothing in either naming its tree. `launchProvenance()` is now folded into PROVENANCE,
 * so every reading names its own tree and HEAD and a misplaced one says so.
 *
 * `GRUEN_EVIDENCE_ROOT` therefore changes meaning, deliberately and narrowly: unset it is no longer a
 * hardcoded machine path but the DERIVED root; set, it is enforced as a deliberate pin and still throws on a
 * mismatch (gruen-paths.mjs). The trade is stated here rather than hidden in a default.
 */
export const EVIDENCE_ROOT = DERIVED_EVIDENCE_ROOT;

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

/**
 * §89 · READ THE PRODUCT'S COLOUR CONSTANTS, DO NOT COPY THEM.
 *
 * GELB's standard, which I reported as a hazard and had not run on myself: a constant copied out of the
 * product without a check is not a citation, it is a FORK. The audit found four of my instruments forking
 * `GAP_HUE` — and those four carry every PG-12 figure in the record, including the measured floor
 * (`outputs/pg12-floor-measured.json`) and the compositing ladder (`outputs/compositing-ladder.json`).
 *
 * A guard on a duplicate is weaker than no duplicate, so this reads the value instead of checking a copy.
 * It throws when the declaration cannot be found, because a colour constant that silently defaults is how a
 * figure ends up describing a hue the product does not draw.
 */
const PRODUCT_SOURCE = new URL("../../../../../app/components/career/demo/PersonJobMappingField.tsx", import.meta.url).pathname;
export function rgbConstant(name) {
  const src = readFileSync(PRODUCT_SOURCE, "utf8");
  const m = new RegExp(`^(?:export )?const ${name} = "([^"]+)";`, "m").exec(src);
  if (m === null) throw new Error(`ERR_GRUEN_PRODUCT_CONSTANT_MISSING: ${name} is not declared as an rgb triple in ${PRODUCT_SOURCE}. An instrument that cannot read it must not assume it.`);
  const parts = m[1].split(",").map(x => Number(x.trim()));
  if (parts.length !== 3 || parts.some(n => !Number.isInteger(n) || n < 0 || n > 255))
    throw new Error(`ERR_GRUEN_PRODUCT_CONSTANT_SHAPE: ${name} = "${m[1]}" is not three 8-bit channels.`);
  return parts;
}

/**
 * §94 — the same discipline as `rgbConstant`, for a NUMBER inside a frozen record, plus the one thing
 * `rgbConstant` cannot do: read it out of the build being MEASURED rather than the worktree the instrument
 * runs in. A-G54 says a figure belongs to a build; a CONSTANT a figure is derived from belongs to one too,
 * and this instrument runs in the canonical evidence worktree while the pixels come from another.
 *
 * It throws rather than defaulting, and it refuses a nested record instead of guessing which brace closed
 * the one asked for — `MOTION.stage.geometryMs` needs a path this does not take, and a reader that silently
 * matched the wrong closing brace would return a number from a sibling key.
 */
export function numericConstant(objectName, key, sourcePath = PRODUCT_SOURCE) {
  const src = readFileSync(sourcePath, "utf8");
  const m = new RegExp(`^(?:export )?const ${objectName} = Object\\.freeze\\(\\{([^;]*?)\\}\\);`, "m").exec(src);
  if (m === null) throw new Error(`ERR_GRUEN_PRODUCT_RECORD_MISSING: ${objectName} is not declared as a frozen record in ${sourcePath}.`);
  if (/Object\.freeze/.test(m[1])) throw new Error(`ERR_GRUEN_PRODUCT_RECORD_NESTED: ${objectName} in ${sourcePath} contains a nested Object.freeze, so this reader cannot tell which brace closes it. Give the key a path-aware reader instead of guessing.`);
  const k = new RegExp(`\\b${key}:\\s*(-?\\d+(?:\\.\\d+)?)\\b`).exec(m[1]);
  if (k === null) throw new Error(`ERR_GRUEN_PRODUCT_CONSTANT_MISSING: ${objectName}.${key} is not declared as a number in ${sourcePath}. An instrument that cannot read it must not assume it.`);
  return Number(k[1]);
}
