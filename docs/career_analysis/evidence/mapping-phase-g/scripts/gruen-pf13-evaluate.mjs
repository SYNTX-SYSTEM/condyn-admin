/**
 * GRÜN · PHASE-G · §108 — PF-13 EVALUATED: the run half, whose verdict comes from the REPORTER.
 * **NO VERDICT on the pin** (A-G36 point 2) — this reports whether the population passes; whether PF-13 is
 * satisfied is PINK's.
 *
 * §98 named PF-13's population and resolved its exception list. It never RAN it: the greens I reported were
 * read out of a terminal by eye. This is the evaluator, and its verdict comes from vitest's JSON reporter
 * rather than from an exit code — A-G374's second limb, which bit this lane twice: once as a false sentence
 * and once, in §106, as a false ACTION that let a red commit through.
 *
 * TWO VACUITY GUARDS, AND THE FIRST IS NOT OPTIONAL. GELB hit this one call before specifying it: `vitest run`
 * over both directories returned `numTotalTests: 0, numFailedTests: 0` — *** a green-looking JSON body with a
 * zero denominator. *** So the FILE SET the reporter covered must equal the file set the population half
 * enumerates, in both directions, and the test count must be positive. A filter that matches nothing must
 * never read as a clean pass.
 *
 * ONE CONTRADICTION BETWEEN TWO RULINGS, REPORTED RATHER THAN SILENTLY RESOLVED. GELB §116 asks for "every
 * test in the population passes, EXCEPT exactly the restated set". A-G426 — which came out of this lane's
 * reading and which GELB adopted — established that PF-13's exception is to the word **UNCHANGED**, not to
 * **PASSES**: the first statement of the pin reads "every phase-D and phase-E test passes unchanged", the
 * later one drops "unchanged" and adds the three-test exception, so the three were REWRITTEN and must still
 * pass. Those two cannot both hold. This implements the STRICTER one — every test passes, no exemption from
 * passing — and reports the restated set separately as provenance. If GELB rules the other way the assertion
 * loosens; it is not this lane's to pick quietly.
 *
 * VENUE, recorded because it constrains where this can run: `global-setup.ts` runs UNCONDITIONALLY, so the
 * population's 15 static files — which open no database — cannot be evaluated without a provisioned
 * disposable one. GELB's attempt died at ERR_TEST_DATABASE_ISOLATION_MISSING and they did not guess a
 * credential or touch the gate, which is why the run half is this lane's: the credential is in this worktree.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdtempSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { spawnSync, execFileSync } from "node:child_process";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const ROOT = resolve(here, "../../../../..");
const ARCH = "test/career/mapping-field/architecture.test.ts";
const NVE = "test/career/mapping-field/neurovisual-e.test.ts";

/* ── the population, READ from phase D's own predicate (§98's form, not restated) ──────────────────── */
const archSrc = readFileSync(join(ROOT, ARCH), "utf8");
const dirsDecl = /const PHASE_DIRS = \[([^\]]+)\]/.exec(archSrc);
if (dirsDecl === null) throw new Error("ERR_GRUEN_PF13_NO_PHASE_DIRS: PF-13's population cannot be read and must not be assumed.");
const PHASE_DIRS = dirsDecl[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
const walk = d => existsSync(join(ROOT, d))
  ? readdirSync(join(ROOT, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}${e.name}/`) : [`${d}${e.name}`])
  : [];
const population = PHASE_DIRS.flatMap(walk).filter(p => /\.(test|spec)\.(ts|tsx)$/.test(p)).sort();
if (population.length === 0) throw new Error("ERR_GRUEN_PF13_EMPTY_POPULATION: an empty population would make PF-13 vacuously true.");

/* ── the restated set, derived from titles (never hand-listed) ─────────────────────────────────────── */
const restated = [];
for (const rel of population) {
  readFileSync(join(ROOT, rel), "utf8").split("\n").forEach((line, i) => {
    if (!/^\s*it\(/.test(line)) return;
    const title = (/it\(\s*["'`](.*?)["'`]\s*,/.exec(line) ?? [null, line.trim()])[1];
    if (/restated/i.test(title)) restated.push({ file: rel, itLine: i + 1, title, namesPhaseF: /phase F/i.test(title), namesPhaseG: /phase G/i.test(title) });
  });
}

/* ── the run, with its verdict taken from the reporter ─────────────────────────────────────────────── */
const envLocal = join(ROOT, ".env.local");
if (!existsSync(envLocal)) throw new Error("ERR_GRUEN_PF13_NO_CREDENTIAL: global-setup.ts runs unconditionally, so even the static files need a provisioned disposable database. No .env.local in this worktree.");
const env = { ...process.env };
for (const line of readFileSync(envLocal, "utf8").split("\n")) {
  const m = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim());
  if (m !== null) env[m[1]] = m[2];
}
const jsonPath = join(mkdtempSync(join(tmpdir(), "gruen-pf13-")), "report.json");
const run = spawnSync("npm", ["run", "test:isolated", "--", ...PHASE_DIRS, "--reporter=json", `--outputFile=${jsonPath}`],
  { cwd: ROOT, env, encoding: "utf8", timeout: 900000 });
if (!existsSync(jsonPath)) throw new Error(`ERR_GRUEN_PF13_NO_REPORT: the reporter wrote no file. A run with no artifact is not a pass.\n${(run.stderr ?? "").slice(-900)}`);
const report = JSON.parse(readFileSync(jsonPath, "utf8"));

/* ── guard 1: the reporter's file set must equal the enumerated population, BOTH directions ────────── */
const rel = p => p.replace(`${ROOT}/`, "");
const covered = [...new Set((report.testResults ?? []).map(r => rel(r.name)))].sort();
const missing = population.filter(p => !covered.includes(p));
const extra = covered.filter(p => !population.includes(p));
/* ── guard 2: a zero denominator is not a pass ─────────────────────────────────────────────────────── */
const total = report.numTotalTests ?? 0, failed = report.numFailedTests ?? 0, passed = report.numPassedTests ?? 0;

const failures = (report.testResults ?? []).flatMap(f => (f.assertionResults ?? []).filter(a => a.status === "failed")
  .map(a => ({ file: rel(f.name), title: a.fullName ?? a.title, messages: (a.failureMessages ?? []).map(m => String(m).split("\n")[0]) })));

const problems = [];
if (total === 0) problems.push("ERR_GRUEN_PF13_ZERO_DENOMINATOR: numTotalTests is 0. A green-looking report with nothing in it is the failure mode GELB hit one call before specifying this guard.");
if (missing.length > 0) problems.push(`ERR_GRUEN_PF13_POPULATION_NOT_COVERED: the reporter never ran ${JSON.stringify(missing)}. A filter that misses part of the population reads as a clean pass.`);
if (extra.length > 0) problems.push(`ERR_GRUEN_PF13_OUT_OF_POPULATION: the reporter covered ${JSON.stringify(extra)}, outside PHASE_DIRS. PF-13's verdict must not rest on tests outside its population (A-G95: the 27 lifecycle postgres failures are outside it).`);
if (failed > 0) problems.push(`ERR_GRUEN_PF13_FAILURES: ${failed} test(s) failed, NAMED: ${JSON.stringify(failures.map(f => `${f.file} :: ${f.title}`), null, 1)}`);

const out = {
  reading: "GRÜN · §108 — PF-13 evaluated over its own population, verdict from the JSON reporter",
  verdict: PROVENANCE.verdict, instrument: PROVENANCE,
  commit: execFileSync("git", ["-c", "core.quotePath=false", "rev-parse", "--short", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim(),
  pin: { statement: "PF-13: every phase-D and phase-E test passes, except the three restated in writing.",
    firstStatement: "an earlier statement of the same pin reads 'every phase-D and phase-E test passes UNCHANGED'",
    aG426: "the exception is to UNCHANGED, not to PASSES — the three were rewritten for phase F and must still pass. This evaluator implements that stricter reading and reports the contradiction with GELB §116's wording rather than choosing quietly." },
  population: { derivedFrom: `${ARCH} -> PHASE_DIRS`, phaseDirs: PHASE_DIRS, testFiles: population, testFileCount: population.length },
  reporter: { totalTests: total, passed, failed, filesCovered: covered.length,
    coverageMatchesPopulation: missing.length === 0 && extra.length === 0, missing, extra },
  restatedSetDerivedFromTitles: {
    allInPopulation: restated,
    /* §108: the first form of this reported all five itLines as one list and attributed them to neurovisual-e
       in the same sentence. A set derived over SEVERAL files, reported as if from ONE — A-G417's shape in this
       instrument's own output, and it would have handed GELB five lines to amend a pin that needs three. */
    forPF13_phaseF_inTheCitedFile: restated.filter(r => r.file === NVE && r.namesPhaseF),
    outsidePF13_phaseG: restated.filter(r => !(r.file === NVE && r.namesPhaseF)),
    whyTheFilterIsPhaseAware: "PF-13 is a PHASE-F pin and says 'the three restated in writing' in neurovisual-e. Two further tests in the population say 'restated, phase G' (field-e.test.tsx and field-f.test.tsx) — restated for a LATER phase, so outside a phase-F pin's exception list by design rather than by omission. 'Restated' in a title does not by itself mean 'exempted by PF-13'; the phase it names decides."
  },
  failuresNamed: failures,
  venue: { note: "global-setup.ts runs UNCONDITIONALLY, so the population's static files — which open no database — cannot be evaluated without a provisioned disposable one. That is a property of the stand, not of the pin, and it is why this half runs in the lane holding the credential." },
  finding: null
};
out.finding =
`PF-13 EVALUATED over ${population.length} test files from PHASE_DIRS, verdict read from the JSON reporter rather than an exit code: ${total} tests, ${passed} passed, ${failed} failed.
COVERAGE GUARD: the reporter's file set ${missing.length === 0 && extra.length === 0 ? "EQUALS" : "DOES NOT EQUAL"} the enumerated population (missing ${missing.length}, out-of-population ${extra.length}). A zero denominator or a partial filter reads as a clean pass and is refused here instead.
THE RESTATED SET FOR PF-13, derived from titles and scoped to the pin's own phase and file: ${JSON.stringify(restated.filter(r => r.file === NVE && r.namesPhaseF).map(r => r.itLine))} in ${NVE}. ${restated.length - restated.filter(r => r.file === NVE && r.namesPhaseF).length} further tests in the population say "restated, phase G" (${restated.filter(r => !(r.file === NVE && r.namesPhaseF)).map(r => `${r.file.split("/").pop()}:${r.itLine}`).join(", ")}) — restated for a LATER phase, outside a phase-F pin by design. PF-13's own citations resolve to a DIFFERENT set — §98 reports that mismatch and now fails on it.
NO VERDICT on the pin (A-G36 point 2): this says the population passes. Whether PF-13 is satisfied is PINK's.`;

writeFileSync(resolve(OUT, "pf13-evaluated.json"), JSON.stringify(out, null, 1));
console.log(`population: ${population.length} files · reporter: ${total} tests, ${passed} passed, ${failed} failed`);
console.log(`coverage matches population: ${missing.length === 0 && extra.length === 0}  (missing ${missing.length}, extra ${extra.length})`);
console.log(`restated FOR PF-13 (phase F, cited file): ${JSON.stringify(restated.filter(r => r.file === NVE && r.namesPhaseF).map(r => r.itLine))}`);
console.log(`restated for phase G, outside PF-13: ${JSON.stringify(restated.filter(r => !(r.file === NVE && r.namesPhaseF)).map(r => `${r.file.split("/").pop()}:${r.itLine}`))}`);
for (const f of failures) console.log(`   FAILED: ${f.file} :: ${f.title}\n      ${f.messages[0] ?? ""}`);
console.log(`\n${out.finding}`);
if (problems.length > 0) { console.error(`\n${problems.join("\n\n")}`); process.exitCode = 1; }
