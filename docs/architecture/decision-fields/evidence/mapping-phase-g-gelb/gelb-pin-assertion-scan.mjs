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
/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log("[4] A-G448's DETECTOR, RUN ON THE RECORDS THAT DEFINE THE PINS");
rule();
console.log(`
  PINK ran this on its own instrument prose and found PF-5: four mentions, every one adjacent to PF-6, and
  never measured. *** A pin cited only alongside a measured pin inherits its appearance of coverage and
  none of its evidence. *** The reciprocal check belongs here, because these two records are where the pins
  are STATED — a pin that is defined and then only ever discussed in a LIST is the sharper case.

  Each mention is SOLITARY if no other pin id sits within 40 characters of it, ADJACENT otherwise. The
  defining table row is excluded: it names the pin by construction and says nothing about whether anyone
  ever reasoned about it on its own.
`);
const docSrc = ["PERSON_X_JOB_MAPPING_PHASE_F.md", "PERSON_X_JOB_MAPPING_PHASE_G.md"]
  .map(f => readFileSync(join(DOCS, f), "utf8")).join("\n");
const ANY_PIN = /\bP[FG]-\d+\b/g;
const adjacency = {};
for (const p of PINS) {
  let solitary = 0, adjacent = 0, inTable = 0;
  const re = new RegExp(`\\b${p}\\b`, "g");
  for (const m of docSrc.matchAll(re)) {
    const lineStart = docSrc.lastIndexOf("\n", m.index) + 1;
    const lineEnd = docSrc.indexOf("\n", m.index);
    const line = docSrc.slice(lineStart, lineEnd < 0 ? undefined : lineEnd);
    if (/^\|\s*\*\*P[FG]-\d+\*\*\s*\|/.test(line)) { inTable++; continue; }
    const w = docSrc.slice(Math.max(0, m.index - 40), m.index + p.length + 40);
    const others = [...w.matchAll(ANY_PIN)].map(x => x[0]).filter(x => x !== p);
    others.length ? adjacent++ : solitary++;
  }
  adjacency[p] = { solitary, adjacent, inTable };
}
const neverAlone = PINS.filter(p => adjacency[p].solitary === 0 && adjacency[p].adjacent > 0);
const onlyTable = PINS.filter(p => adjacency[p].solitary === 0 && adjacency[p].adjacent === 0);
console.log("  pin     solitary  adjacent  table rows");
for (const p of PINS) {
  const a = adjacency[p];
  const flag = a.solitary === 0 ? (a.adjacent > 0 ? "   <- NEVER DISCUSSED ALONE" : "   <- ONLY the table row") : "";
  console.log(`  ${p.padEnd(7)} ${String(a.solitary).padStart(7)} ${String(a.adjacent).padStart(9)} ${String(a.inTable).padStart(10)}${flag}`);
}
console.log(`
  *** ${neverAlone.length} pin(s) are mentioned outside their table row and NEVER ALONE: ${neverAlone.join(", ") || "(none)"} ***
  *** ${onlyTable.length} pin(s) appear ONLY in a table row and nowhere else at all: ${onlyTable.join(", ") || "(none)"} ***

  A zero in the solitary column is not a proof that nobody reasoned about the pin — a sentence can be about
  one pin while naming two. It is the detector PINK describes and it has one job: *** to find the pin whose
  whole textual life is as the second half of a pair. *** PF-5 is PINK's instance in its own lane; the
  column above is the same question asked of the records that state the obligations.

  AND THE STATE IT CATCHES IS THE ONE THAT LOOKS LIKE COVERAGE FROM BOTH DIRECTIONS: a pin absent from
  every instrument venue AND present in the prose of the lane that was meant to measure it — invisible to
  a venue scan because the prose is elsewhere, invisible in the prose because the neighbour's verdict sits
  beside it. *** GRÜN asked which pins have no guard. This is the class where the answer is "none, and it
  looks like one". ***
`);
rule();
/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log("[5] OPENING THE FIFTEEN — A-G449: grep cannot tell a guard from its obituary");
rule();
console.log(`
  PINK opened its seven and two of them turned out to be LEDGER ROWS recording that a guard was dropped or
  that a pin is unsatisfiable. *** A pin named in a ledger of dropped guards is indistinguishable, to a
  search, from a pin that has one — grep cannot tell a guard from its obituary. *** So the venue count is
  an upper bound in BOTH lanes: 15 and 7 are the number of places a guard COULD be, not where one IS.

  This limb opens each mention. A mention inside an it()/test()/describe() TITLE whose block contains an
  expect() is a GUARD CANDIDATE; a mention in a comment is a MENTION; anything else is OTHER. The block is
  taken to the next line at the title's own indentation, which is crude and stated as such — it cannot tell
  an assertion ABOUT the pin from an assertion merely inside the same block, and only reading the
  assertion does that. *** This narrows 15 to a shorter list to read; it does not read them. ***
`);
const stripComments = t => t.replace(/\/\*[\s\S]*?\*\//g, m => m.replace(/[^\n]/g, " "));
const classify = (src, pin) => {
  const bare = stripComments(src);
  const lines = src.split("\n");
  const out = { guard: 0, mention: 0, other: 0, titles: [] };
  lines.forEach((line, i) => {
    if (!new RegExp(`\\b${pin}\\b`).test(line)) return;
    const isComment = /^\s*(\/\/|\*|\/\*)/.test(line) || !new RegExp(`\\b${pin}\\b`).test(stripComments(line));
    const isTitle = /\b(it|test|describe)(\.\w+)?\s*\(\s*["'`]/.test(line);
    if (isTitle) {
      const indent = (line.match(/^\s*/) || [""])[0].length;
      let body = "";
      for (let j = i; j < lines.length; j++) {
        if (j > i && (lines[j].match(/^\s*/) || [""])[0].length <= indent && /\S/.test(lines[j]) && /\}\)/.test(lines[j])) { body += lines[j]; break; }
        body += lines[j] + "\n";
      }
      if (/\bexpect\s*\(/.test(body)) { out.guard++; out.titles.push(line.trim().slice(0, 94)); return; }
      out.other++; return;
    }
    if (isComment) { out.mention++; return; }
    out.other++;
  });
  return out;
};
const states = {};
for (const p of named) {
  const agg = { guard: 0, mention: 0, other: 0, titles: [] };
  for (const [, src] of Object.entries(text)) {
    const c = classify(src, p);
    agg.guard += c.guard; agg.mention += c.mention; agg.other += c.other; agg.titles.push(...c.titles);
  }
  states[p] = agg;
}
const withGuard = named.filter(p => states[p].guard > 0);
const mentionOnly = named.filter(p => states[p].guard === 0);
console.log(`  pin      titled-with-expect   comment mentions   other`);
for (const p of named) {
  const a = states[p];
  console.log(`  ${p.padEnd(7)} ${String(a.guard).padStart(13)} ${String(a.mention).padStart(18)} ${String(a.other).padStart(7)}${a.guard === 0 ? "   <- NO TITLED TEST NAMES IT" : ""}`);
}
console.log(`
  *** ${withGuard.length} of the ${named.length} named pins appear in at least one it()/describe() TITLE whose block asserts.
  ${mentionOnly.length} appear only in comments or other positions — the shorter list to read. ***
`);
for (const p of mentionOnly) console.log(`  READ THIS ONE  ${p}`);
if (mentionOnly.length === 0) console.log("  (every named pin has at least one asserting titled test)");
console.log("\n  the titles, so a reader can go to one rather than to all:");
for (const p of withGuard) for (const t of states[p].titles.slice(0, 2)) console.log(`    ${p.padEnd(7)} ${t}`);
console.log(`
  *** AND THE LIMIT, WHICH IS THE SAME ONE PINK NAMED: a titled test that asserts is a guard CANDIDATE and
  not a guard. It may assert something adjacent to the pin rather than the pin's own bound — PF-4's
  instrument is partial and says so, PF-10's mention is its guard's obituary, and neither could be told
  from a grep. The only detector that works is opening the file, and this limb opens it one level: far
  enough to say which files to read, not far enough to say what they prove. ***
`);
rule();
rule();
