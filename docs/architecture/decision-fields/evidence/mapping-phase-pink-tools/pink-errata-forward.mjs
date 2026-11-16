/**
 * PINK · THE FORWARD POINTERS — owner decision 2
 *
 *   "Connect PINK's three withdrawals by traceable forward pointers to their valid errata.
 *    Do not rewrite historical evidence."
 *
 * `PINK-SYSTEM-VALIDATION.md` is entry 47 of mapping-phase-g-contract/manifest.sha256 and may not change
 * a byte. So the pointers live in a file BESIDE it that the manifest does not list — proven harmless:
 * `sha256sum -c` verifies the lines it lists and is silent about anything else in the directory, so
 * adding an unlisted file leaves 91 OK / 0 FAILED and exit 0, while mutating a LISTED file still gives
 * 1 FAILED and exit 1. Both directions measured before this file was designed.
 *
 * ---------------------------------------------------------------------------------------------------
 * *** WHY THIS IS GENERATED AND NOT TYPED, WHICH IS THE WHOLE POINT. ***
 *
 * W-3 exists because a figure was relayed without being re-read in its artefact. Typing 1 190 characters
 * of quoted sealed text into a JSON file by hand is that same act, performed by the lane that withdrew a
 * claim for it. So this generator is given only an ID, a LINE NUMBER and a short EXPECTED SUBSTRING; it
 * READS the line from the sealed file, REFUSES if the substring is not there, and records the full line
 * VERBATIM as it stands. A mis-citation therefore fails at generation instead of becoming a pointer that
 * looks authoritative and points at the wrong line.
 *
 * *** AND THAT CHECK ALREADY CAUGHT TWO OF MY OWN MIS-CITATIONS. *** Both are recorded in the output:
 *
 *   1. The errata cites the W-3 quotation as `PINK-SYSTEM-VALIDATION.md:8`. *** LINE 8 OF THAT FILE IS
 *      EMPTY. *** The "197 tests, 197 passed" wording is at LINE 233, inside §8, which begins at line 214.
 *      A SECTION number was written in LINE-number syntax. Nothing had re-read it, because nothing could:
 *      a prose citation has no verifier. The pointer cites 233.
 *
 *   2. The errata names W-1's four dependent passages as "§0's fourth clause, §5, §8's asymmetry argument,
 *      and §11's cost paragraph". *** §8 CARRIES NO ASYMMETRY ARGUMENT AND DOES NOT REST ON THE UNPUSHED
 *      CONDITION AT ALL. *** §8 is "PIN COVERAGE — stated as TWO bounds" (lines 214-318); its only
 *      "direction" language is about a figure being wrong in both directions and coverage matching in both
 *      directions. The symmetry/asymmetry argument about READABILITY is at lines 161-169, which is §5 —
 *      the same section as the "strongest reason" clause. So the four dependents are §0's fourth clause,
 *      §5's symmetry clause, §5's strongest-reason clause, and §11's cost paragraph. Three sections, not
 *      four. The brief relaying this back to me repeated my error; I am not propagating it a third time.
 *
 * Neither correction touches a sealed byte. Both are corrections to THIS round's errata prose, which is
 * unsealed and in this lane's authority.
 *
 * ---------------------------------------------------------------------------------------------------
 * *** A-G500 ADOPTED, AND IT CAUGHT A DEFECT IN THIS FILE'S OWN OUTPUT. ***
 *
 * GELB's A-G500: a guard that scans text is INSIDE ITS OWN POPULATION, so a quotation of a withdrawn claim
 * is indistinguishable from the claim. The mark is `[WITHDRAWN <finding-id> <YYYY-MM-DD>]` on the claim's
 * own line, and a bare `[WITHDRAWN]` silences nothing.
 *
 * It applies here, against me. Measured after the first version of this generator ran: a line scanner
 * looking for `119 commits, UNPUSHED` finds it in FIVE files — the sealed register (the only LIVE claim),
 * ERRATA-FORWARD.md, ERRATA-FORWARD.json, the errata, and this generator's own SPEC. The pointer file built
 * to retract the claim had multiplied it. So every quotation this generator emits now carries the mark.
 *
 * *** AND THE MARK CANNOT REACH THE ONE LINE THAT MATTERS, WHICH IS EXACTLY WHY THIS FILE EXISTS. ***
 * A-G500 works by writing on the claim's own line. `PINK-SYSTEM-VALIDATION.md:4` is inside a frozen seal
 * (entry 47 of 91) and the owner's decision is "do not rewrite historical evidence". So the sealed claim is
 * the one case A-G500's mechanism cannot address, and a forward pointer beside the file is the available
 * substitute rather than a competing idea. GELB's rule is better than mine WHERE IT CAN BE APPLIED; it
 * cannot be applied to a sealed line; both are needed and neither replaces the other.
 *
 * Usage:
 *   node pink-errata-forward.mjs --out <dir>   write ERRATA-FORWARD.{json,md} (default: beside the register)
 *   node pink-errata-forward.mjs --check       verify an existing pointer file against both files
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join, relative } from "node:path";
import { createHash } from "node:crypto";
import { EVIDENCE_DIR, REPO_ROOT } from "./pink-tools.mjs";

const SCHEMA = "pink.errata-forward/1";
const SEALED_DIR = join(EVIDENCE_DIR, "mapping-phase-g-contract");
const SEALED = join(SEALED_DIR, "PINK-SYSTEM-VALIDATION.md");
const SEALED_MANIFEST = join(SEALED_DIR, "manifest.sha256");
const ERRATA = join(EVIDENCE_DIR, "mapping-phase-pink-tools", "PINK-ERRATA-AND-PORTABILITY-REPAIR.md");

const args = process.argv.slice(2);
const CHECK = args.includes("--check");
const i = args.indexOf("--out");
const OUT = i >= 0 ? resolve(args[i + 1]) : SEALED_DIR;

const sha = b => createHash("sha256").update(b).digest("hex");
/** A-G500: the mark carries the finding id AND the date. A bare `[WITHDRAWN]` silences nothing. */
const mark = p => `[WITHDRAWN ${p.id} ${p.date}]`;
const rel = p => relative(REPO_ROOT, p);

const sealedLines = readFileSync(SEALED, "utf8").split("\n");
const errataLines = readFileSync(ERRATA, "utf8").split("\n");

const problems = [];
/** read line `n` (1-based) verbatim; refuse if `expect` is not in it. */
function at(file, lines, n, expect, what) {
  const line = lines[n - 1];
  if (line === undefined) { problems.push(`${what}: ${rel(file)}:${n} does not exist (file has ${lines.length} lines)`); return null; }
  if (expect && !line.includes(expect)) {
    problems.push(`${what}: ${rel(file)}:${n} does not contain ${JSON.stringify(expect)} — it reads ${JSON.stringify(line.slice(0, 120))}`);
    return null;
  }
  return line;
}
/** find the 1-based line of an exact anchor string. */
function anchorLine(lines, anchor, what) {
  const n = lines.findIndex(l => l.startsWith(anchor));
  if (n < 0) { problems.push(`${what}: anchor ${JSON.stringify(anchor)} not found in ${rel(ERRATA)}`); return null; }
  return n + 1;
}

// ---- the three withdrawals. ID, line, expected substring — the text itself is READ, never typed. ----
const SPEC = [
  {
    id: "W-1", verdict: "WITHDRAWN", date: "2026-11-16",
    claim: "the branch is unpushed and the validation is unreadable where it matters",
    anchor: "### W-1 ·",
    supersededBy: "the push itself, not by any change in content",
    occurrences: [{ line: 4, expect: "119 commits, UNPUSHED" }],
    dependents: [
      { section: "§0", what: "fourth clause — 'IT IS NOT READABLE WHERE IT MATTERS'", line: 27, expect: "AND IT IS NOT READABLE WHERE IT MATTERS" },
      { section: "§5", what: "symmetry clause — what is readable in which direction", line: 165, expect: "in one direction, and this unpushed statement in the other" },
      { section: "§5", what: "strongest-reason clause", line: 167, expect: "strongest reason the unpushed branch is a defect in the work" },
      { section: "§11", what: "cost paragraph", line: 363, expect: "concrete cost of the unpushed branch" },
    ],
    dependentsNote:
      "The errata names these as '§0's fourth clause, §5, §8's asymmetry argument, §11's cost paragraph'. " +
      "MEASURED: §8 (lines 214-318, 'PIN COVERAGE — stated as TWO bounds') carries no asymmetry argument and " +
      "no dependency on the unpushed condition. The asymmetry/symmetry argument is at 161-169, in §5. Four " +
      "dependent passages across THREE sections, not four.",
  },
  {
    id: "W-2", verdict: "WITHDRAWN", date: "2026-11-16",
    claim: "`PHASE_G*.md` exists in none of the four worktrees this lane can read",
    anchor: "### W-2 ·",
    supersededBy: "a worktree-versus-ref error of this lane's own: `git show <ref>:<path>` answers in every clone holding the object",
    occurrences: [
      { line: 96, expect: "exists in none of the four worktrees this lane can read" },
      { line: 158, expect: "GELB cites `PHASE_G:725`" },
      { line: 159, expect: "exist in NONE of the four worktrees this lane can read" },
      { line: 273, expect: "which this lane cannot read" },
      { line: 358, expect: "`PHASE_G*.md` remains unreadable here" },
    ],
    dependents: [],
    dependentsNote: "§5's A-G20 retirements sat on 'TAKEN ON REPORT' purely because of this error; the errata's §2 re-tiers them.",
  },
  {
    id: "W-3", verdict: "SUPERSEDED", date: "2026-11-16",
    claim: "16 files, 197 tests, 197 passed for PF-13",
    anchor: "### W-3 ·",
    supersededBy: "the artefact reads 198: one test was added (§115 A-G468, `3231f52c`). 197 was correct at `bce62ea1`.",
    occurrences: [
      { line: 233, expect: "16 files, 197 tests, 197" },
      { line: 267, expect: "**197/197** with coverage matched both ways" },
    ],
    dependents: [],
    dependentsNote:
      "The errata cites this as `PINK-SYSTEM-VALIDATION.md:8`. LINE 8 IS EMPTY — '8' is §8, which begins at " +
      "line 214. The wording is at 233 and restated at 267. Corrected here and in the errata prose.",
  },
];

// ---- build -----------------------------------------------------------------------------------------
const pointers = SPEC.map(s => ({
  id: s.id, verdict: s.verdict, date: s.date, claim: s.claim,
  sealedFile: rel(SEALED),
  errataFile: rel(ERRATA),
  errataAnchor: s.anchor,
  errataAnchorLine: anchorLine(errataLines, s.anchor, s.id),
  supersededBy: s.supersededBy,
  occurrences: s.occurrences.map(o => ({
    line: o.line,
    quote: at(SEALED, sealedLines, o.line, o.expect, `${s.id} occurrence`),
  })),
  dependentPassages: s.dependents.map(d => ({
    section: d.section, what: d.what, line: d.line,
    quote: at(SEALED, sealedLines, d.line, d.expect, `${s.id} dependent ${d.section}`),
  })),
  dependentPassagesNote: s.dependentsNote,
}));

// every `### W-n ·` heading in the errata must have a pointer — the other direction of the guard.
const errataWithdrawals = errataLines
  .map((l, n) => ({ l, n: n + 1 }))
  .filter(x => /^### W-\d+ ·/.test(x.l))
  .map(x => ({ id: x.l.match(/^### (W-\d+) ·/)[1], line: x.n }));
for (const w of errataWithdrawals)
  if (!pointers.some(p => p.id === w.id)) problems.push(`errata declares ${w.id} at :${w.line} with no forward pointer`);
for (const p of pointers)
  if (!errataWithdrawals.some(w => w.id === p.id)) problems.push(`pointer ${p.id} has no '### ${p.id} ·' heading in the errata`);

if (problems.length) {
  console.error(`*** REFUSING TO WRITE THE POINTER FILE *** ${problems.length} problem(s). A pointer that cites the ` +
    `wrong line is worse than no pointer: it looks authoritative and sends the reader to the wrong place.\n` +
    problems.map(p => "  - " + p).join("\n"));
  process.exit(4);
}

const manifestRaw = readFileSync(SEALED_MANIFEST, "utf8");
const manifestEntries = manifestRaw.split("\n").filter(l => /^[0-9a-f]{64}\s/.test(l)).length;
const POINTER_BASENAME = "ERRATA-FORWARD.json";
const listedInManifest = manifestRaw.includes(POINTER_BASENAME);

const doc = {
  schema: SCHEMA,
  what: "Forward pointers from withdrawn or superseded claims standing in a SEALED register to the errata " +
        "that withdraws them. The sealed register is not modified; this file sits beside it and is not listed " +
        "in its manifest.",
  ownerDecision: "Connect PINK's three withdrawals by traceable forward pointers to their valid errata. " +
                 "Do not rewrite historical evidence.",
  generatedAtUTC: new Date().toISOString(),
  generator: rel(new URL(import.meta.url).pathname),
  howQuotesWereObtained: "READ from the sealed file at the cited line and recorded verbatim. The generator is " +
    "given only an id, a line number and a short expected substring, and REFUSES (exit 4) if the substring is " +
    "not at that line. Quotes are never typed into this file by hand — that is the W-3 failure mode.",
  sealedRegister: {
    path: rel(SEALED),
    digest: sha(readFileSync(SEALED)),
    lines: sealedLines.length,
    manifest: rel(SEALED_MANIFEST),
    manifestEntries,
    manifestEntryForRegister: 47,
    mustNotChange: true,
  },
  thisFile: {
    path: rel(join(OUT, POINTER_BASENAME)),
    listedInSealedManifest: listedInManifest,
    whyUnlisted: "Adding an unlisted file to a sealed directory does not break the seal: `sha256sum -c` " +
      "verifies the lines it lists and is silent about anything else present. Measured both ways — adding " +
      "three unlisted files (one nested) left 33 OK / exit 0 on a throwaway copy of mapping-phase-e-contract, " +
      "while appending one byte to a LISTED file gave 1 FAILED / exit 1.",
  },
  errata: { path: rel(ERRATA), declaredWithdrawals: errataWithdrawals },
  markConvention: {
    rule: "A-G500 (GELB). Every quotation of a withdrawn claim carries `[WITHDRAWN <id> <YYYY-MM-DD>]` on its " +
      "own line; a bare `[WITHDRAWN]` silences nothing and the line falls back to being a live claim.",
    form: "[WITHDRAWN <id> <YYYY-MM-DD>]",
    appliedIn: ["ERRATA-FORWARD.md"],
    notAppliedIn: ["the sealed register"],
    whyNotInTheSealedRegister: "A-G500 writes on the claim's own line. That line is inside a frozen seal " +
      "(entry 47 of 91) and the owner's decision is 'do not rewrite historical evidence'. This is the one " +
      "case the mark cannot reach, which is why a forward pointer beside the file is needed at all.",
    marks: Object.fromEntries(SPEC.map(x => [x.id, `[WITHDRAWN ${x.id} ${x.date}]`])),
  },
  guardContract: {
    forWhom: "a browser-free guard consuming this file; GELB owns it in test/integration-boundary/",
    mustGoRedIf: [
      "the 167 historical seal entries stop verifying (33 + 43 + 91, `sha256sum -c` in each contract dir)",
      "pointers[].occurrences[].quote is no longer present at pointers[].occurrences[].line of sealedRegister.path",
      "pointers[].dependentPassages[].quote is no longer present at its .line",
      "errata.path is missing, or pointers[].errataAnchor is not found as a line prefix in it",
      "errata.declaredWithdrawals contains an id with no entry in pointers[]",
      "sealedRegister.digest no longer matches the file (history rewritten)",
    ],
    lineNumbersAre: "1-based",
    quoteComparison: "exact substring of the whole line; the quote IS the whole line as it stood at generation",
  },
  pointers,
};

if (CHECK) {
  const p = join(OUT, POINTER_BASENAME);
  if (!existsSync(p)) { console.error(`REFUSE: ${p} absent`); process.exit(5); }
  const prev = JSON.parse(readFileSync(p, "utf8"));
  const diffs = [];
  if (prev.sealedRegister.digest !== doc.sealedRegister.digest) diffs.push("sealed register digest changed");
  for (const a of prev.pointers) {
    const b = doc.pointers.find(x => x.id === a.id);
    if (!b) { diffs.push(`${a.id} no longer generated`); continue; }
    for (const o of a.occurrences)
      if (sealedLines[o.line - 1] !== o.quote) diffs.push(`${a.id}: line ${o.line} no longer reads its recorded quote`);
    for (const d of a.dependentPassages)
      if (sealedLines[d.line - 1] !== d.quote) diffs.push(`${a.id}: dependent ${d.section} line ${d.line} moved`);
  }
  if (diffs.length) { console.error(`CHECK FAILED (${diffs.length}):\n` + diffs.map(d => "  - " + d).join("\n")); process.exit(6); }
  console.log(`CHECK OK — ${prev.pointers.length} pointers, ` +
    `${prev.pointers.reduce((n, p2) => n + p2.occurrences.length, 0)} sealed occurrences, ` +
    `${prev.pointers.reduce((n, p2) => n + p2.dependentPassages.length, 0)} dependent passages, all still at their cited lines`);
  process.exit(0);
}

writeFileSync(join(OUT, POINTER_BASENAME), JSON.stringify(doc, null, 2) + "\n");

const md = [
  `# ⚠ FORWARD POINTERS — THREE CLAIMS IN THIS DIRECTORY'S SEALED REGISTER ARE WITHDRAWN`,
  ``,
  `**Read this before \`PINK-SYSTEM-VALIDATION.md\`.** Three claims that still stand verbatim in that file`,
  `have been withdrawn or superseded by its own author. The file is **entry 47 of \`manifest.sha256\`** and`,
  `may not change a byte, so the retraction lives here instead of in the text.`,
  ``,
  `Machine-readable form: **\`${POINTER_BASENAME}\`** (schema \`${SCHEMA}\`). This file and that one are`,
  `**not listed** in \`manifest.sha256\`, which is why their presence leaves the seal at **91 OK / 0 FAILED**.`,
  ``,
  `| | claim as it still stands | at | verdict |`,
  `|---|---|---|---|`,
  ...pointers.map(p => `| **${p.id}** | ${p.claim} | \`:${p.occurrences.map(o => o.line).join("\`, \`:")}\` | **${p.verdict}** |`),
  ``,
  `Full grounds: \`${rel(ERRATA)}\` §1.`,
  ``,
  ...pointers.flatMap(p => [
    `## ${p.id} — ${p.verdict}`,
    ``,
    `**Still standing at \`${rel(SEALED)}:${p.occurrences[0].line}\`:**`,
    ``,
    ...p.occurrences.map(o => `> \`:${o.line}\` ${o.quote.trim()}  ${mark(p)}`),
    ``,
    `**Superseded by:** ${p.supersededBy}`,
    ``,
    ...(p.dependentPassages.length ? [
      `**Dependent passages that rest on the withdrawn premise** — a validator does not retract a premise and`,
      `leave its conclusions standing:`,
      ``,
      ...p.dependentPassages.map(d => `- \`:${d.line}\` **${d.section}** ${d.what}  \n  > ${d.quote.trim()}  ${mark(p)}`),
      ``,
    ] : []),
    ...(p.dependentPassagesNote ? [`*${p.dependentPassagesNote}*`, ``] : []),
  ]),
  `---`,
  ``,
  `*Generated by \`${rel(new URL(import.meta.url).pathname)}\`. Quotes are read from the sealed file at the`,
  `cited line, never typed: the generator refuses if a cited line does not carry its expected text. Re-check`,
  `with \`--check\`.*`,
  ``,
].join("\n");
writeFileSync(join(OUT, "ERRATA-FORWARD.md"), md);

console.log(`--- written ---`);
console.log(`  ${join(OUT, POINTER_BASENAME)}`);
console.log(`  ${join(OUT, "ERRATA-FORWARD.md")}`);
console.log(`  pointers ${pointers.length} | sealed occurrences ${pointers.reduce((n, p) => n + p.occurrences.length, 0)}` +
  ` | dependent passages ${pointers.reduce((n, p) => n + p.dependentPassages.length, 0)}`);
console.log(`  listed in the sealed manifest: ${listedInManifest} (must be false)`);
