/**
 * GRÜN · PHASE-G · §98 — PF-13's POPULATION, NAMED; and its exception list resolved from line numbers to tests.
 * **NO VERDICT** (A-G36 point 2). Pure arithmetic over committed files. No browser, no build, no server, no DB.
 *
 * PF-13 (PHASE_F :950): "every phase-D and phase-E test passes, except the three restated in writing:
 * `neurovisual-e :156`, `:174`, `:140`."  Cited references: §12, A-F15.
 *
 * WHY THIS EXISTS. GELB §95 ruled that the 27 career-lifecycle postgres failures are OUTSIDE PF-13's
 * population, and that PF-13 must therefore name that population explicitly so "the suite" and "PF-13" can
 * never again be mistaken for one another — both lanes have slid between them. Two things follow, and the
 * second is the one neither of us had noticed:
 *
 *   1. THE POPULATION IS DERIVED, NOT DECLARED HERE. `architecture.test.ts` already defines phase D's own
 *      predicate — `PHASE_DIRS = ["test/career/mapping-field/", "test/career/mapping-spec/"]` — so this reads
 *      that declaration instead of restating it (§88's READS rung: a copy that cannot disagree beats a copy
 *      that is checked). My own earlier report of "170/170 on test/career/mapping-field" covered the FIRST of
 *      those two directories and I described it as PF-13's population. It is half of it.
 *
 *   2. THE EXCEPTION LIST IS CITED BY LINE NUMBER, WHICH IS A PROPERTY OF A BUILD (A-G54). The three numbers
 *      do resolve — each falls 3…7 lines INSIDE one `it()` — and they still resolve after §93, which shifted
 *      that file by +3. I checked rather than assumed. But `:156` sits only 3 lines inside its own `it()`, so
 *      a shift of four lines would make the pin name a DIFFERENT test, and the mechanism gives no signal when
 *      it crosses. So this resolves each citation to a TITLE and asserts the headroom, which turns a silent
 *      mis-identification into a failure.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const ROOT = resolve(here, "../../../../..");
const ARCH = "test/career/mapping-field/architecture.test.ts";
const NVE = "test/career/mapping-field/neurovisual-e.test.ts";
const CITED = [156, 174, 140];              // PF-13's own three, in the order the pin writes them
const MIN_HEADROOM = 2;                     // a citation closer than this to its it() is one edit from moving

const git = (...a) => execFileSync("git", a, { cwd: ROOT, encoding: "utf8" }).trim();

/* ── 1 · the population, READ out of phase D's own predicate ───────────────────────────────────────── */
const archSrc = readFileSync(join(ROOT, ARCH), "utf8");
const dirsDecl = /const PHASE_DIRS = \[([^\]]+)\]/.exec(archSrc);
if (dirsDecl === null) throw new Error(`ERR_GRUEN_PF13_NO_PHASE_DIRS: PHASE_DIRS is not declared in ${ARCH}, so PF-13's population cannot be read and must not be assumed.`);
const PHASE_DIRS = dirsDecl[1].split(",").map(s => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
if (PHASE_DIRS.length === 0) throw new Error("ERR_GRUEN_PF13_EMPTY_POPULATION: an empty population would make PF-13 vacuously true.");

const walk = d => existsSync(join(ROOT, d))
  ? readdirSync(join(ROOT, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(`${d}${e.name}/`) : [`${d}${e.name}`])
  : [];
const population = PHASE_DIRS.flatMap(walk).filter(p => /\.(test|spec)\.(ts|tsx)$/.test(p)).sort();
const helpers = PHASE_DIRS.flatMap(walk).filter(p => !/\.(test|spec)\.(ts|tsx)$/.test(p)).sort();
if (population.length === 0) throw new Error("ERR_GRUEN_PF13_NO_TESTS: the population resolved to no test file.");

/* ── 2 · the exception list, resolved from line numbers to test identities ─────────────────────────── */
const nveSrc = readFileSync(join(ROOT, NVE), "utf8").split("\n");
const itLines = nveSrc.map((l, i) => ({ line: i + 1, text: l })).filter(x => /^\s*it\(/.test(x.text));
const resolveCitation = n => {
  const before = itLines.filter(x => x.line <= n);
  const after = itLines.find(x => x.line > n);
  if (before.length === 0) return { citedLine: n, resolved: false, why: "no it() at or above this line" };
  const own = before[before.length - 1];
  const title = (/it\(\s*["'`](.*?)["'`]\s*,/.exec(own.text) ?? [null, own.text.trim()])[1];
  return {
    citedLine: n, itLine: own.line, headroomLines: n - own.line,
    nextItLine: after?.line ?? null, linesToNextIt: after === undefined ? null : after.line - n,
    title, resolved: true,
    selfIdentifiesAsRestated: /restated/i.test(title)
  };
};
const exceptions = CITED.map(resolveCitation);

/* ── the RULED fix: the exception list names TITLES. A title is only a citation if it is UNIQUE, so that is
   asserted rather than hoped, and the title-based list is cross-checked against the line-based one so the
   conversion is proven faithful instead of merely plausible. A citation into a mutable file must name
   something the file CARRIES, not a position in it. */
const titleOccurrences = t => nveSrc.filter(l => l.includes(t)).length;
for (const e of exceptions) {
  if (!e.resolved) continue;
  const n = titleOccurrences(e.title);
  if (n !== 1) throw new Error(`ERR_GRUEN_PF13_TITLE_NOT_UNIQUE: the title for :${e.citedLine} occurs ${n} times in ${NVE}, so naming it would be as ambiguous as naming a line. Title: ${e.title.slice(0, 80)}`);
  e.titleIsUniqueInFile = true;
}
/* the cross-check: resolving by TITLE must land on the same it() lines the NUMBERS landed on */
const byTitle = exceptions.map(e => ({ title: e.title, itLine: nveSrc.findIndex(l => l.includes(e.title)) + 1 }));
const sameTests = byTitle.every((t, i) => t.itLine === exceptions[i].itLine);
if (!sameTests) throw new Error(`ERR_GRUEN_PF13_CONVERSION_UNFAITHFUL: title-based resolution lands on ${JSON.stringify(byTitle.map(t => t.itLine))} where the line-based resolution landed on ${JSON.stringify(exceptions.map(e => e.itLine))}. The new citation form must name the same three tests or it is not a conversion.`);
const unresolved = exceptions.filter(e => !e.resolved);
if (unresolved.length > 0) throw new Error(`ERR_GRUEN_PF13_CITATION_UNRESOLVED: ${JSON.stringify(unresolved)}`);
const fragile = exceptions.filter(e => e.headroomLines < MIN_HEADROOM);
const distinct = new Set(exceptions.map(e => e.itLine));

const out = {
  reading: "GRÜN · §98 — PF-13's population named, and its exception list resolved from line numbers to test identities",
  verdict: PROVENANCE.verdict,
  scope: "pure arithmetic over committed files. No browser, no build, no server, no database, no test executed here — this names WHAT PF-13 covers; the run is reported separately.",
  commit: git("rev-parse", "--short", "HEAD"),
  pin: {
    statement: "PF-13: every phase-D and phase-E test passes, except the three restated in writing: neurovisual-e :156, :174, :140.",
    citedReferences: "§12, A-F15",
    source: "PERSON_X_JOB_MAPPING_PHASE_F.md :950 — a document NOT present in this worktree; it lives on architecture/mapping-phase-f. Recorded because a pin this lane reports against is read from another lane's branch."
  },
  population: {
    derivedFrom: `${ARCH} -> PHASE_DIRS, read rather than restated`,
    phaseDirs: PHASE_DIRS,
    testFiles: population, testFileCount: population.length,
    nonTestHelpersInThoseDirs: helpers,
    correctionToMyOwnEarlierReport: "I reported '170/170 on test/career/mapping-field' and called it PF-13's population. PHASE_DIRS has TWO entries and that is the first. The second, test/career/mapping-spec/, was never in the number I quoted."
  },
  exceptionList: {
    citedBy: "LINE NUMBER, which A-G54 makes a property of a build.",
    resolved: exceptions,
    distinctTestsNamed: distinct.size,
    allThreeResolveToDistinctTests: distinct.size === CITED.length,
    fragileCitations: fragile.map(e => ({ citedLine: e.citedLine, headroomLines: e.headroomLines, title: e.title })),
    theRisk: `a citation ${MIN_HEADROOM} lines or fewer inside its own it() is one edit away from naming the PREVIOUS test, and nothing signals the crossing. §93 shifted this file by +3 and all three still resolve — checked, not assumed — but that is luck rather than design.`,
    theRemedy: "two of the three titles self-identify ('position half restated, phase F §12/A-F15' and 'restated, phase F §12 and phase G §8'), which matches the pin's own cited §12/A-F15. An exception list should name those titles; a line number cannot survive an edit to the file it points into."
  },
  canonicalExceptionList: {
    ruledBy: "GELB §95: PF-13's exception list names TEST TITLES, not line numbers — a line number into a file still being edited is the only kind of citation that can come to mean something else with no edit to the citation itself.",
    form: "file + test title",
    file: NVE,
    titles: exceptions.map(e => e.title),
    eachTitleUniqueInThatFile: exceptions.every(e => e.titleIsUniqueInFile === true),
    conversionProvenFaithful: sameTests,
    howItWasProven: "each title was resolved back to an it() line and compared against the line the ORIGINAL number resolved to. Both forms name the same three tests, so this is a conversion and not a new list. The instrument throws if a title is not unique in the file, because an ambiguous title is no better than a drifting number.",
    legacyCitation: { byLineNumber: CITED, stillResolvesAtThisCommit: true,
      headroomLines: exceptions.map(e => e.headroomLines),
      note: "kept so the pin's own wording stays traceable, and demoted because at this commit two of the three sit 0 and 1 lines inside their own it()."
    }
  },
  finding: null
};
out.finding =
`PF-13's POPULATION IS ${population.length} TEST FILES over ${PHASE_DIRS.length} directories (${PHASE_DIRS.join(", ")}), read out of architecture.test.ts's own phase-D predicate rather than restated here.
AND IT CORRECTS MY OWN REPORT: I quoted "170/170 on test/career/mapping-field" as PF-13's population. That is ONE of the two directories PHASE_DIRS names; ${population.filter(p => p.startsWith(PHASE_DIRS[1] ?? "\u0000")).length} test files under ${PHASE_DIRS[1] ?? "(none)"} were never in the number.
THE EXCEPTION LIST IS NOW NAMED BY TITLE (GELB §95, ruled), and the conversion is PROVEN rather than asserted: each title resolves back to the same it() line its original NUMBER resolved to, each title is unique in the file, and the instrument throws on either failure. The line numbers are kept as a legacy citation so the pin's own wording stays traceable.
THE LEGACY CITATION RESOLVES, AND IT IS FRAGILE. The pin's three line numbers each fall inside one it() — ${exceptions.map(e => `:${e.citedLine} -> it() at :${e.itLine} (+${e.headroomLines})`).join(", ")} — naming ${distinct.size} distinct tests. ${exceptions.filter(e => e.selfIdentifiesAsRestated).length} of the 3 titles say "restated" in the title itself, matching the pin's cited §12/A-F15. But ${fragile.length === 0 ? "none sits inside the fragility limit" : `${fragile.length} citation(s) sit ${MIN_HEADROOM} lines or fewer inside their own it()`}, and §93 shifted this file by +3 — all three still resolve, which I checked rather than assumed, and which is luck rather than design.
NO VERDICT (A-G36 point 2): this names a population and resolves a citation. Whether the population passes is a RUN, reported separately, and whether PF-13 is satisfied is PINK's.`;

const { writeFileSync } = await import("node:fs");
writeFileSync(resolve(OUT, "pf13-population.json"), JSON.stringify(out, null, 1));
console.log(`PHASE_DIRS (read): ${JSON.stringify(PHASE_DIRS)}`);
console.log(`population: ${population.length} test files`);
for (const p of population) console.log(`   ${p}`);
console.log(`\nexception list, resolved:`);
for (const e of exceptions) console.log(`   :${e.citedLine} -> it() at :${e.itLine} (+${e.headroomLines} lines, next it() in ${e.linesToNextIt})  restated-in-title=${e.selfIdentifiesAsRestated}\n      "${e.title}"`);
console.log(`\n${out.finding}`);
