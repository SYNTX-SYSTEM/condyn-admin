/**
 * GELB · AUDIT OF THIS LANE'S OWN INSTRUMENTS — source pinning, output location, constant provenance.
 *
 * GRÜN's §88 found two things that apply to me and one that does not, and I am checking all three rather
 * than assuming:
 *
 *  (a) ITS SEALS WERE PROTECTED BY A CONVENTION, NOT A BOUNDARY — all three sealed-writing probes wrote
 *      unconditionally, and what kept them safe was being left out of run-all.sh. My A-G389 deferral was
 *      therefore protecting nothing. Do I have the analogue? -> block [2], and I do: six instruments
 *      duplicate product constants with nothing enforcing that they match the product.
 *  (b) ITS EVIDENCE ALMOST SCATTERED ACROSS TWO WORKTREES, because in `cd A && CMD & disown; cd B && ...`
 *      the `&` backgrounds `cd A` into a subshell and the later relative `cd B` resolves from the wrong
 *      root. Nothing errored; the write succeeded to the wrong place. -> block [3].
 *  (c) and A-G109 moved from habit into code only because GRÜN tried to obey it.
 *
 * *** AND THE FIRST FORM OF BLOCK [1] WAS ITSELF A BRITTLE AUDIT. *** It detected pinning by grepping
 * for the literal `SHA = "........"`, so gelb-a-g340-exact.mjs — which pins TWO builds under the names
 * MINE and PINKS — was reported as unpinned, along with two others. A pattern-matching audit with a
 * pattern narrower than the thing it audits. Seventh instance of that family this phase, caught in one
 * step. The classifier below asks whether the file calls git at all and whether it contains any 8-hex
 * literal, which is the weakest pair of questions that cannot be fooled by a naming choice.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { READ } from "./gelb-product-constants.mjs";
import { REPO_ROOT } from "./gelb-paths.mjs"; // A-G469: derived, never declared
const HERE = dirname(fileURleToPathSafe());
function fileURleToPathSafe() { return fileURLToPath(import.meta.url); }
const files = readdirSync(HERE).filter(f => f.endsWith(".mjs") && f !== "gelb-product-constants.mjs").sort();
const TREE = REPO_ROOT;
const COMP = "app/components/career/demo/PersonJobMappingField.tsx";

console.log("=".repeat(104));
console.log("GELB · INSTRUMENT AUDIT — pinning, output location, constant provenance");
console.log("=".repeat(104));

/* ══ [1] ══ */
console.log("\n[1] SOURCE PINNING — does the instrument read the product, and at a named build?\n");
const rows = [];
for (const f of files) {
  const t = readFileSync(join(HERE, f), "utf8");
  const callsGit = /"git"/.test(t);
  const hexes = [...new Set(t.match(/\b[0-9a-f]{8}\b/g) || [])];
  const cls = callsGit && hexes.length ? "PINNED+READS" : callsGit ? "READS-UNPINNED" : "SELF-CONTAINED";
  rows.push({ f, cls, hexes, t });
  console.log(`  ${cls.padEnd(16)} ${f.padEnd(36)} ${hexes.slice(0, 3).join(" ")}`);
}
const n = c => rows.filter(r => r.cls === c).length;
console.log(`\n  PINNED+READS ${n("PINNED+READS")}   READS-UNPINNED ${n("READS-UNPINNED")}   SELF-CONTAINED ${n("SELF-CONTAINED")}`);
console.log(`\n  No instrument reads HEAD. The ${n("PINNED+READS")} that read the product name the build they read, so their`);
console.log(`  outputs are build-stable by construction — the property GRÜN's seals needed a guard to get,`);
console.log(`  arrived at by pinning rather than by protecting. That is luck as much as design: it follows`);
console.log(`  from quoting a SHA for citation, not from a decision about staleness.`);

/* ══ [2] the convention that is not a boundary ══ */
console.log("\n" + "=".repeat(104));
console.log("[2] CONSTANT PROVENANCE — GRÜN's defect in this lane's shape");
console.log("=".repeat(104));
/* §90 A-G408, LIMB 1. This was a HAND-WRITTEN LIST OF 12 NAMES, so a constant forked across my
   instruments but absent from the list was invisible — "a declaration the audit cannot extract is
   unguarded everywhere" (GRÜN, §89) applied to the AUDIT'S OWN SCOPE, which is one level above the
   level §89 fixed. The scope now follows the module: every value gelb-product-constants.mjs parses is
   in scope automatically, so adding a constant there cannot silently leave it unwatched here. */
const NAMES = Object.keys(READ);
console.log("");
const dup = new Map();
for (const r of rows) {
  /* a file that READS the module declares no constant with `=`, so a DECLARATION-ONLY filter skipped it
     entirely and the READS row printed "(none)" while the line below it named two readers. That is
     GRÜN's §89 defect two — "the moment the fix landed, the detector called the fix the defect" — in my
     code, after being told about it. Imported names are collected so a reader appears in its own table. */
  /* §90 A-G408, LIMB 2: this matched only `import { … } from`, so gelb-e7-breath-mode.mjs — which uses
     `import * as P from` — was skipped by the `continue` below and appeared NOWHERE in this audit, in
     neither block, while being the newest instrument in the directory. Both import forms now count,
     and a namespace import is resolved through its own alias. */
  const ns = (r.t.match(/import \* as (\w+) from "\.\/gelb-product-constants\.mjs"/) || [, null])[1];
  const imported = [
    ...(r.t.match(/import \{([^}]*)\} from "\.\/gelb-product-constants\.mjs"/) || [, ""])[1]
      .split(",").map(x => x.trim()).filter(x => NAMES.includes(x)),
    ...(ns ? NAMES.filter(k => new RegExp(`\\b${ns}\\.${k}\\b`).test(r.t)) : []),
  ];
  const declared = NAMES.filter(k => new RegExp(`\\b${k}\\s*=`).test(r.t));
  const has = [...new Set([...declared, ...imported])];
  if (!has.length) continue;
  /* THREE states, not two. The first form of this block had two and its own narrative then claimed
     gelb-a-g340-exact.mjs "THROWS if either moved" — the classifier printed FORKS two lines above that
     sentence and the classifier was right. exact.mjs prints AGREE/DIFFER and CONTINUES. Eighth instance
     this phase of a narrative line refuted by its own adjacent output, and the distinction it hid is the
     useful one: a check that reports inside a 200-line output is a check nobody reads. */
  /* a file that IMPORTS gelb-product-constants.mjs cannot run on a stale constant, because that
     module throws at load. Added when §87's remedy was discharged: without it this classifier would
     report no improvement after the wiring, which would have been the audit failing to see its own fix. */
  /* FOUR states, per GRÜN's §89. HALTS = holds a copy and throws if the copy disagrees. READS = holds
     NO copy, so there is nothing to disagree — strictly stronger, because eliminating a duplicate beats
     checking one. My own gelb-product-constants.mjs was at HALTS when I built it and is now at READS,
     and a three-state classifier could not have scored that change. */
  const reads = /from "\.\/gelb-product-constants\.mjs"/.test(r.t);
  const halts = !reads && /throw new Error\([^)]*mov|throw new Error\(`UNVERIFIED/.test(r.t);
  const reports = !reads && !halts && /\bAGREE\b|\bDIFFER\b|UNVERIFIED/.test(r.t);
  const state = reads ? "READS   " : halts ? "HALTS   " : reports ? "REPORTS " : "NOTHING ";
  for (const k of has) dup.set(k, [...(dup.get(k) || []), { f: r.f, state: state.trim() }]);
  console.log(`  ${state} ${r.f.padEnd(36)} ${has.join(" ")}`);
}
console.log(`\n  constants in more than one instrument, by the state of each copy (reads / halts / reports / none):\n`);
let forks = 0;
for (const [k, v] of [...dup].sort()) {
  if (v.length < 2) continue;
  const bad = v.filter(x => x.state === "NOTHING");
  const rep = v.filter(x => x.state === "REPORTS");
  if (bad.length) forks += 1;
  const rd = v.filter(x => x.state === "READS").length, ht = v.filter(x => x.state === "HALTS").length;
  const sum = rd + ht + rep.length + bad.length;
  if (sum !== v.length) throw new Error(`state tally for ${k} sums to ${sum}, not ${v.length}`);
  console.log(`    ${k.padEnd(14)} ${v.length} copies: ${rd} read, ${ht} halt, ${rep.length} report, ${bad.length} NONE` +
              (bad.length ? `  — ${bad.map(x => x.f.replace("gelb-", "").replace(".mjs", "")).join(", ")}` : ""));
}
const short = n => n.replace("gelb-", "").replace(".mjs", "");
/* built HERE and not taken from the `byFile` below: that one is declared later in the file, so the first
   form of this block threw ReferenceError at load — and I committed it. Second broken instrument I have
   committed this phase, and the lesson is the same one: an exit code is checked, not assumed. */
const stateOf = {};
for (const [, v] of dup) for (const x of v) stateOf[x.f] = x.state;
const filesIn = st => Object.entries(stateOf).filter(([, v]) => v === st).map(([k]) => short(k));
const wired = rows.filter(r => /from "\.\/gelb-product-constants\.mjs"/.test(r.t)).map(r => short(r.f));
const STATES = ["READS", "HALTS", "REPORTS", "NOTHING"];
console.log(`\n  *** ${forks} CONSTANTS HAVE AT LEAST ONE COPY THAT CHECKS NOTHING. *** The ${STATES.length} states, with their`);
console.log(`  members LISTED FROM THE SCAN rather than named by hand — the first form of this block named`);
console.log(`  files and went stale the moment §87's remedy landed, which is the tenth instance this phase`);
console.log(`  and the first I had already committed:\n`);
console.log(`    READS    ${filesIn("READS").join(", ") || "(none)"}   <- holds no copy; strictly strongest`);
console.log(`    HALTS    ${filesIn("HALTS").join(", ") || "(none)"}`);
console.log(`    REPORTS  ${filesIn("REPORTS").join(", ") || "(none)"}`);
console.log(`    NOTHING  ${filesIn("NOTHING").join(", ") || "(none)"}`);
const PCM = readFileSync(join(HERE, "gelb-product-constants.mjs"), "utf8");
const parsed = (PCM.match(/^export const [A-Z][A-Z0-9_]*\s*=/gm) || []).length;
const holds = /^export const [A-Z][A-Z0-9_]*\s*=\s*[0-9.\[]/m.test(PCM);
console.log(`\n  ${wired.length} instrument(s) READ gelb-product-constants.mjs: ${wired.join(", ") || "(none)"}`);
/* §90 A-G407's second limb applied here: TWO independent computations of the same quantity, printed
   together with the reason they differ, instead of one number that is merely consistent with itself. */
const inREAD = Object.keys(READ).length;
if (parsed < inREAD) throw new Error(`the module exports ${parsed} UPPER_CASE constants but READ names ${inREAD} — READ cannot exceed the exports`);
console.log(`  That module exports ${parsed} UPPER_CASE constants and gathers ${inREAD} of them into READ`);
console.log(`  (the gap of ${parsed - inREAD} is SHA, SOURCES and the aliases, which are not product figures), and holds`);
console.log(`  ${holds ? "AT LEAST ONE LITERAL OF ITS OWN — which would make it HALTS, not READS" : "NO literal of its own"}, so there is nothing in it to go stale. It refuses rather than`);
console.log(`  reports if a declaration is missing, duplicated or malformed — GRÜN's writeSealed() shape,`);
console.log(`  and GRÜN's §89 rung above the HALTS form I first built.`);
const BARE = (() => {
  let n = 0;
  for (const r of rows) for (const m of r.t.match(/console\.log\(`[^`]*`\)/g) || [])
    if (!m.includes("${")) n += (m.match(/\b\d+\.?\d*\b/g) || []).length;
  return n;
})();
const tally = { HALTS: 0, REPORTS: 0, NOTHING: 0 };
for (const [, v] of dup) for (const x of v) tally[x.state] = (tally[x.state] || 0) + 1;
const byFile = {};
for (const [, v] of dup) for (const x of v) byFile[x.f] = x.state;
const nFile = st => Object.values(byFile).filter(v => v === st).length;
console.log(`\n  *** AND THE COUNT IN THIS SENTENCE IS COMPUTED, BECAUSE THE FIRST FORM OF IT WAS TYPED AND WRONG.`);
console.log(`  I wrote "absent in nine"; the table above shows ${nFile("NOTHING")}. *** Ninth instance this phase of a`);
console.log(`  narrative figure disagreeing with its own adjacent output, and the SECOND since A-G385 ruled`);
console.log(`  the remedy — so A-G385's remedy is not working as stated. The failure mode it missed is that`);
console.log(`  I write the sentence after reading the output and then TYPE a numeral into it.`);
console.log(`\n  *** RULED, REPLACING A-G385's FORM: no bare numeral appears in a narrative line. Every count,`);
console.log(`  share and ratio is an interpolated variable computed above it. ***`);
console.log(`\n  AND ONE LIMIT ON THAT RULE, STATED BECAUSE I CALLED IT "GREPPABLE" FIRST AND IT IS NOT A GATE:`);
console.log(`  grepping my own instruments for bare numerals in narrative lines returns ${BARE} of them, and`);
console.log(`  most are legitimate labels — viewport widths, "8-bit", a rung named "10q". *** I cannot`);
console.log(`  mechanically distinguish a LABEL from a DERIVED FIGURE, so the grep is a review aid with`);
console.log(`  false positives and not a check that can fail. *** The rule is still worth having because it`);
console.log(`  names the act rather than the virtue; it is simply not the gate I claimed one sentence ago.`);
console.log(`\n  Instruments by their strongest constant check: HALTS ${nFile("HALTS")}, REPORTS ${nFile("REPORTS")}, NOTHING ${nFile("NOTHING")}.`);
console.log(`  Copies by state: ${tally.HALTS} halt, ${tally.REPORTS} report, ${tally.NOTHING} check nothing.`);
console.log(`  So if the product's haloDepth moved: ${nFile("HALTS")} instrument stops, ${nFile("REPORTS")} mention it in passing, and the`);
console.log(`  ${nFile("NOTHING")} whose numbers are in the record keep producing them.`);
console.log(`  *** GRÜN's seal guard went from CONVENTION to REFUSES. Mine is at REFUSES in ${nFile("HALTS")} file of ${Object.keys(byFile).length}. ***`);
console.log(`\n  THAT IS GRÜN'S "A CONVENTION IS NOT A BOUNDARY" IN THIS LANE. My convention is "verify the`);
console.log(`  constants in the instrument where I first read them"; nothing enforces it in any other file,`);
console.log(`  and GLOW_RAMP — the ramp both peers have measured against — appears unverified in three.`);
console.log(`  A constant copied out of the product without a check is not a citation. It is a FORK.`);

/* ══ [3] output location ══ */
console.log("\n" + "=".repeat(104));
console.log("[3] OUTPUT LOCATION — is GRÜN's scatter hazard reachable here, and did it happen?");
console.log("=".repeat(104));
/* §90 A-G408, LIMB 3 — AND THIS ONE HID THE OTHER TWO FOR HALF AN HOUR. The filter was
   /writeFileSync/.test(r.t), which matched THIS FILE, because this file contains that literal inside
   the detector. So the audit listed ITSELF as writing its own output; I then ran it with `> /dev/null`
   on that belief and read, quoted and reasoned about an output file written before the newest
   instrument existed. *** A DETECTOR THAT MATCHES ITS OWN SOURCE IS NOT A DETECTOR. *** The remedy is
   one this lane already ruled once, in §80, when a PRESENT/PRESENT limb-2 probe was matching comments:
   a scan for CODE must first exclude the forms that are not code. Second instance of that rule, and
   this time the non-code form was a regex literal inside the scanner itself.
   TWO LIMBS, because either alone can be fooled: the file must IMPORT the function AND CALL it. */
const callsWrite = t => /import \{[^}]*\bwriteFileSync\b/.test(t) && /\bwriteFileSync\s*\(/.test(t);
const selfWriting = rows.filter(r => callsWrite(r.t));
if (callsWrite(readFileSync(join(HERE, "gelb-instrument-audit.mjs"), "utf8")) !== false)
  throw new Error("the self-writing detector still matches this audit, which does not write its own output");
console.log(`\n  instruments that write their own output file: ${selfWriting.length} of ${rows.length}`);
for (const r of selfWriting) {
  const abs = /import\.meta\.url/.test(r.t);
  console.log(`    ${r.f.padEnd(36)} path from ${abs ? "import.meta.url — IMMUNE to a wrong cd" : "a RELATIVE path — scatterable"}`);
}
console.log(`\n  the other ${rows.length - selfWriting.length} write nothing: their output is captured by SHELL REDIRECTION, whose`);
console.log(`  destination is my working directory at the moment I run them. *** SO THE HAZARD IS REACHABLE`);
console.log(`  FOR ${rows.length - selfWriting.length} OF ${rows.length} INSTRUMENTS, and it is reachable through the one mechanism GRÜN's module-load`);
console.log(`  assertion cannot see — a redirection outside the process. ***`);
let strays = [], examined = 0;                 // A-G480: the zero needs its denominator in its own block
for (const root of [TREE, REPO_ROOT]) {
  const out = execFileSync("find", [root, "-name", "gelb-*.out.txt", "-not", "-path", "*/node_modules/*"], { encoding: "utf8" }).trim();
  const found = out ? out.split("\n").filter(Boolean) : [];
  examined += found.length;
  for (const p of found) if (dirname(p) !== HERE) strays.push(p);
}
if (examined === 0) throw new Error("REFUSE: the find located 0 gelb-*.out.txt files in either worktree — a zero over an empty corpus is not a measurement (A-G452/A-G480)");
console.log(`\n  DID IT HAPPEN? every gelb-*.out.txt in both worktrees, outside the canonical root: ${strays.length} of ${examined} examined`);
strays.forEach(p => console.log(`    STRAY ${p}`));
console.log(`  ${strays.length === 0 ? "None. The hazard is open and has not been realised — stated in that order, because the" : "Strays found — listed above."}`);
console.log(`  ${strays.length === 0 ? "second clause is luck and the first is the finding." : ""}`);
