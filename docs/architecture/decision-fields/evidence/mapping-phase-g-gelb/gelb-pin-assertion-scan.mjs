/**
 * GELB · §112 A-G446 — WHICH PINS ARE NAMED NOWHERE IN THE TEST POPULATION.
 *
 * GRÜN's closing clause on PG-15 is the strongest argument the mutant programme produced:
 *
 *   > "the mutant did not find a weak test, it found the ABSENCE of one, and no run of the suite in any
 *   >  configuration could have reported that. A green suite is consistent with a pin having no guard,
 *   >  and nothing in a green suite says which pins those are."
 *
 * PG-15 was found because it was one of five pins someone chose to mutate. *** THE RECORD DOES NOT KNOW
 * HOW MANY OTHER PINS HAVE NO GUARD *** — and the pins are this lane's assembled form, so the hole is.
 *
 * THIS INSTRUMENT BOUNDS IT FROM BELOW AND SAYS SO. It scans the phase-D/E/F/G test population for every
 * pin id in the two decision records. A pin named nowhere is a CANDIDATE for being unasserted; a pin named
 * somewhere is not thereby asserted, because a mention can be a comment. *** AND A PIN CAN BE ASSERTED
 * WITHOUT BEING NAMED — PG-15's property could have been guarded by a test that never wrote "PG-15" — SO
 * ZERO MENTIONS IS NOT A PROOF OF ABSENCE AND A MENTION IS NOT A PROOF OF PRESENCE. *** What the scan gives
 * is the candidate list, which is the thing nobody has had.
 */
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const GRUEN = "/home/codi/Entwicklung/condyn-admin-mapping-d";
const rule = () => console.log("=".repeat(104));
const f = (x, n = 1) => Number(x).toFixed(n);

/* ── every pin id the two records state, taken from the obligation tables' own row syntax ── */
function pins() {
  const ids = new Set();
  for (const file of ["PERSON_X_JOB_MAPPING_PHASE_F.md", "PERSON_X_JOB_MAPPING_PHASE_G.md"]) {
    const src = readFileSync(join(DOCS, file), "utf8");
    for (const m of src.matchAll(/^\|\s*\*\*(P[FG]-\d+)\*\*\s*\|/gm)) ids.add(m[1]);
  }
  if (ids.size === 0) throw new Error("no pin ids parsed from the obligation tables — the parse is wrong, not the records");
  return [...ids].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

/* ── the test population, read from PHASE_DIRS rather than named, per A-G426 ── */
function population() {
  const arch = join(GRUEN, "test/career/mapping-field/architecture.test.ts");
  if (!existsSync(arch)) throw new Error(`cannot read GRÜN's architecture test at ${arch}`);
  const m = /PHASE_DIRS\s*=\s*\[([^\]]+)\]/.exec(readFileSync(arch, "utf8"));
  if (!m) throw new Error("PHASE_DIRS not found — the population must be READ, not named (A-G426)");
  const dirs = [...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]);
  const files = [];
  for (const d of dirs) {
    const abs = join(GRUEN, d);
    if (!existsSync(abs)) { console.log(`  NOTE: ${d} does not exist in this worktree`); continue; }
    for (const name of readdirSync(abs)) if (/\.(ts|tsx)$/.test(name)) files.push({ dir: d, name, abs: join(abs, name) });
  }
  return { dirs, files };
}

const PINS = pins();
const { dirs, files } = population();
const HEAD = execFileSync("git", ["-C", GRUEN, "rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim();

rule();
console.log(`GELB · §112 A-G446 — PIN NAMES IN THE TEST POPULATION. GRÜN @ ${HEAD}`);
rule();
console.log(`
  pin ids stated in the two records:  ${PINS.length}
  PHASE_DIRS, read not named:         ${dirs.join(", ")}
  test files in the population:       ${files.length}
`);

const text = Object.fromEntries(files.map(x => [x.dir + x.name, readFileSync(x.abs, "utf8")]));

/* *** THE FIRST FORM OF THIS INSTRUMENT REPORTED "17 of 32 PINS NAMED NOWHERE" AND THAT NUMBER WAS AN
   ARTEFACT. *** Most of the 17 are PIXEL pins — PF-2…PF-10, PG-11, PG-12, PG-17…PG-19, PG-22 — measured on
   a browser raster stand and NOT in the vitest population, so their absence there is expected and says
   nothing. A-G429's third remedy, applied before publishing: audit the alarming number BECAUSE it is
   alarming. The classification is now by VENUE, and only "named in no venue this lane can read" is a
   candidate. */
const rasterDirs = ["docs/career_analysis/evidence/mapping-phase-g", "docs/career_analysis/evidence/mapping-phase-f"];
const raster = {};
for (const d of rasterDirs) {
  const abs = join(GRUEN, d);
  if (!existsSync(abs)) continue;
  for (const name of readdirSync(abs)) {
    if (!/\.(mjs|mts|js|ts|md|json)$/.test(name)) continue;
    try { raster[d + "/" + name] = readFileSync(join(abs, name), "utf8"); } catch { /* unreadable */ }
  }
}
const hits = {};
for (const p of PINS) {
  const re = new RegExp(`\\b${p}\\b`, "g");
  hits[p] = Object.entries(text).filter(([, src]) => re.test(src)).map(([k]) => k);
}
const rhits = {};
for (const p of PINS) {
  const re = new RegExp(`\\b${p}\\b`, "g");
  rhits[p] = Object.entries(raster).filter(([, src]) => re.test(src)).map(([k]) => k);
}
const named = PINS.filter(p => hits[p].length > 0);
const rasterOnly = PINS.filter(p => hits[p].length === 0 && rhits[p].length > 0);
const unnamed = PINS.filter(p => hits[p].length === 0 && rhits[p].length === 0);

rule();
console.log("[1] PINS NAMED NOWHERE IN THE TEST POPULATION — the candidate list");
rule();
console.log(`
  raster instrument files readable from this lane: ${Object.keys(raster).length}
  *** PINK's instruments are on an unpushed branch and are NOT readable here — so a pin named only in
  PINK's lane will appear below as a candidate when it is not one. That hole is stated, not closed. ***
`);
console.log(`  named in the VITEST population:              ${named.length}`);
console.log(`  named only in a RASTER instrument:           ${rasterOnly.length}   <- expected; these are pixel pins`);
console.log(`  named in NEITHER venue this lane can read:   ${unnamed.length}\n`);
for (const p of rasterOnly) console.log(`  raster-only  ${p.padEnd(7)} ${rhits[p].length} file(s)`);
console.log("");
for (const p of unnamed) console.log(`  *** CANDIDATE  ${p}`);
if (unnamed.length === 0) console.log("  (no candidates)");
console.log(`
  *** THE FIRST FORM OF THIS BLOCK REPORTED ${unnamed.length + rasterOnly.length} OF ${PINS.length} "NAMED NOWHERE" BY SCANNING ONLY THE VITEST
  POPULATION — and ${rasterOnly.length} of those are pixel pins measured on a raster stand, where their absence from
  vitest is expected and carries no information. *** A-G429's third remedy applied to this instrument
  before publishing: the alarming number was audited BECAUSE it was alarming, and it was mostly venue.`);

rule();
console.log("[2] WHAT THIS IS AND WHAT IT IS NOT");
rule();
console.log(`
  *** ZERO MENTIONS IS NOT A PROOF OF ABSENCE AND A MENTION IS NOT A PROOF OF PRESENCE. ***

    a pin named nowhere   -> a CANDIDATE for being unasserted. Its property may still be guarded by a test
                             that never writes its id — which is exactly how PG-15 was NOT guarded, but is
                             also how a pin could be guarded without this scan seeing it.
    a pin named somewhere -> NOT thereby asserted. A mention can be a comment, a docstring, or a restated
                             obligation with no assertion attached. PG-15 was mentioned and had no guard.

  So this bounds the hole from below and names the places to look. It does not close it. The closing move
  is GRÜN's: a mutant per pin, which is the only thing that distinguishes a weak guard from no guard —
  *** because a green suite is consistent with a pin having no guard, and nothing in a green suite says
  which pins those are. ***

  AND THE COUNT ABOVE IS A LOWER BOUND ON THE WORK, NOT AN UPPER BOUND ON THE RISK: ${unnamed.length} pins are
  candidates by name, and any of the ${named.length} named ones may be mentioned without being asserted. PG-15 was
  in the second group.
`);

rule();
console.log("[3] WHERE EACH NAMED PIN IS MENTIONED — so the next lane can check one rather than all");
rule();
console.log("");
for (const p of named) console.log(`  ${p.padEnd(7)} ${hits[p].length} file(s): ${hits[p].map(x => x.replace(/^test\/career\//, "")).join(", ")}`);
rule();
console.log(`CONSTANT PROVENANCE: pin ids parsed from the obligation tables of both records; the population`);
console.log(`READ from PHASE_DIRS in GRÜN's architecture test at ${HEAD}, never named here (A-G426).`);
console.log(`This instrument asserts nothing about the build. It reports where to look.`);
rule();
