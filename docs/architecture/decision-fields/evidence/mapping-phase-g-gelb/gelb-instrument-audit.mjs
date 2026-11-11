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
const HERE = dirname(fileURleToPathSafe());
function fileURleToPathSafe() { return fileURLToPath(import.meta.url); }
const files = readdirSync(HERE).filter(f => f.endsWith(".mjs") && f !== "gelb-product-constants.mjs").sort();
const TREE = "/home/codi/Entwicklung/condyn-admin-mapping-d";
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
const NAMES = ["HALO_DEPTH", "SELECTED_GAIN", "HALO_ALPHA", "CORE_ALPHA", "DEPTH_RATIO", "WEDGE_WASH",
               "CHAR_EM", "SEAT_PAD_PX", "CROWDING", "GLOW_RAMP", "CYAN", "GAP_HUE"];
console.log("");
const dup = new Map();
for (const r of rows) {
  const has = NAMES.filter(k => new RegExp(`\\b${k}\\s*=`).test(r.t));
  if (!has.length) continue;
  /* THREE states, not two. The first form of this block had two and its own narrative then claimed
     gelb-a-g340-exact.mjs "THROWS if either moved" — the classifier printed FORKS two lines above that
     sentence and the classifier was right. exact.mjs prints AGREE/DIFFER and CONTINUES. Eighth instance
     this phase of a narrative line refuted by its own adjacent output, and the distinction it hid is the
     useful one: a check that reports inside a 200-line output is a check nobody reads. */
  /* a file that IMPORTS gelb-product-constants.mjs cannot run on a stale constant, because that
     module throws at load. Added when §87's remedy was discharged: without it this classifier would
     report no improvement after the wiring, which would have been the audit failing to see its own fix. */
  const importsPinned = /from "\.\/gelb-product-constants\.mjs"/.test(r.t);
  const halts = importsPinned || /throw new Error\([^)]*mov|throw new Error\(`UNVERIFIED/.test(r.t);
  const reports = !halts && /\bAGREE\b|\bDIFFER\b|UNVERIFIED/.test(r.t);
  const state = halts ? "HALTS   " : reports ? "REPORTS " : "NOTHING ";
  for (const k of has) dup.set(k, [...(dup.get(k) || []), { f: r.f, state: state.trim() }]);
  console.log(`  ${state} ${r.f.padEnd(36)} ${has.join(" ")}`);
}
console.log(`\n  constants appearing in more than one instrument, and whether every copy is verified:\n`);
let forks = 0;
for (const [k, v] of [...dup].sort()) {
  if (v.length < 2) continue;
  const bad = v.filter(x => x.state === "NOTHING");
  const rep = v.filter(x => x.state === "REPORTS");
  if (bad.length) forks += 1;
  console.log(`    ${k.padEnd(14)} ${v.length} copies: ${v.filter(x => x.state === "HALTS").length} halt, ${rep.length} report, ${bad.length} check NOTHING` +
              (bad.length ? `  — ${bad.map(x => x.f.replace("gelb-", "").replace(".mjs", "")).join(", ")}` : ""));
}
console.log(`\n  *** ${forks} CONSTANTS HAVE AT LEAST ONE COPY THAT CHECKS NOTHING. *** And the three states matter:`);
console.log(`    HALTS   — gelb-a-g340-capability.mjs asserts haloDepth and selectedGain against the product`);
console.log(`              at a pinned SHA and THROWS "haloDepth moved". That is the only hard stop I own.`);
console.log(`    REPORTS — gelb-a-g340-exact.mjs prints AGREE/DIFFER for seven constants and CONTINUES. It`);
console.log(`              would announce a change in one line of a 200-line output and compute anyway.`);
console.log(`    NOTHING — the rest. gelb-a-g340-support.mjs and gelb-a-g340-ceiling-withdrawn.mjs carry the`);
console.log(`              same four constants with no check of any kind, and they are the instruments`);
console.log(`              carrying §83's and §84's findings.`);
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
const selfWriting = rows.filter(r => /writeFileSync/.test(r.t));
console.log(`\n  instruments that write their own output file: ${selfWriting.length} of ${rows.length}`);
for (const r of selfWriting) {
  const abs = /import\.meta\.url/.test(r.t);
  console.log(`    ${r.f.padEnd(36)} path from ${abs ? "import.meta.url — IMMUNE to a wrong cd" : "a RELATIVE path — scatterable"}`);
}
console.log(`\n  the other ${rows.length - selfWriting.length} write nothing: their output is captured by SHELL REDIRECTION, whose`);
console.log(`  destination is my working directory at the moment I run them. *** SO THE HAZARD IS REACHABLE`);
console.log(`  FOR ${rows.length - selfWriting.length} OF ${rows.length} INSTRUMENTS, and it is reachable through the one mechanism GRÜN's module-load`);
console.log(`  assertion cannot see — a redirection outside the process. ***`);
let strays = [];
for (const root of [TREE, "/home/codi/Entwicklung/condyn-admin-hr-integration"]) {
  const out = execFileSync("find", [root, "-name", "gelb-*.out.txt", "-not", "-path", "*/node_modules/*"], { encoding: "utf8" }).trim();
  for (const p of out ? out.split("\n") : []) if (dirname(p) !== HERE) strays.push(p);
}
console.log(`\n  DID IT HAPPEN? every gelb-*.out.txt in both worktrees, outside the canonical root: ${strays.length}`);
strays.forEach(p => console.log(`    STRAY ${p}`));
console.log(`  ${strays.length === 0 ? "None. The hazard is open and has not been realised — stated in that order, because the" : "Strays found — listed above."}`);
console.log(`  ${strays.length === 0 ? "second clause is luck and the first is the finding." : ""}`);
