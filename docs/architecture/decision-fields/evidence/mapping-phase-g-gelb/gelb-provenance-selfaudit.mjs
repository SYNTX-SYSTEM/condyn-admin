/**
 * GELB · DOES THIS LANE'S OWN RECORD NAME THE BUILD ITS FIGURES CAME FROM?
 *
 * §85's A-G389 ruled an interim obligation: "every figure quoted from a SEAL names its build." GRÜN's §87
 * shows the scope was wrong — a seal protects a reading from being OVERWRITTEN and was never a statement
 * about which readings can go stale. Its census: 41 readings carry a buildId, 8 sealed and 33 not, and at
 * 7910845b only 3 of the 41 are valid. So the obligation must read "every figure quoted from a READING".
 *
 * Which makes it an obligation on THIS document, and this is the audit of it. Demanding provenance of a
 * peer and not measuring my own is the asymmetry A-G272 was ruled against in a different form.
 *
 * Method: for every section of PHASE_G.md, count the quoted MEASUREMENTS (decimal figures in prose, which
 * is what a later reader lifts) and ask whether the section names a build or a commit anywhere in itself.
 * Crude on purpose: a section-level attribution is the weakest form that could discharge the obligation,
 * so a section failing THIS fails any stricter test.
 */
import { execFileSync } from "node:child_process";
const DOC = "/home/codi/Entwicklung/condyn-admin-hr-integration/docs/architecture/decision-fields/PERSON_X_JOB_MAPPING_PHASE_G.md";
const lines = execFileSync("cat", [DOC], { encoding: "utf8" }).split("\n");
const f = (x, n = 1) => x.toFixed(n);

/* sections */
const secs = [];
lines.forEach((l, i) => { if (/^## §\d+/.test(l)) secs.push({ n: secs.length, head: l.slice(3, 86), start: i }); });
secs.forEach((s, i) => { s.end = i + 1 < secs.length ? secs[i + 1].start : lines.length; });

/* a quoted measurement: a decimal with >= 3 significant places, or scientific notation, in prose */
const MEAS = /(?<![\w.-])(?:\d+\.\d{3,}|\d\.\d+e[-+]?\d+)(?![\w-])/gi;
/* provenance: a 7-10 hex commit, or a Next BUILD_ID shape (21 chars of base64url) */
const SHA = /\b[0-9a-f]{8}\b/g;
const BUILD = /\b[A-Za-z0-9_-]{21}\b/g;

console.log("=".repeat(104));
console.log("GELB · PROVENANCE SELF-AUDIT — does each section name a build for the figures it quotes?");
console.log("=".repeat(104));
let totMeas = 0, bare = 0, withProv = 0, bareSecs = [];
for (const s of secs) {
  const body = lines.slice(s.start, s.end).join("\n");
  const m = (body.match(MEAS) || []).length;
  const shas = new Set(body.match(SHA) || []);
  const builds = new Set((body.match(BUILD) || []).filter(x => /[A-Z]/.test(x) && /[a-z]/.test(x) && /\d/.test(x)));
  totMeas += m;
  const prov = shas.size > 0 || builds.size > 0;
  if (m > 0 && !prov) { bare += m; bareSecs.push({ ...s, m }); } else if (m > 0) withProv += m;
}
console.log(`\n  sections: ${secs.length}      quoted measurements: ${totMeas}`);
console.log(`  in sections naming a commit or build: ${withProv}  (${f(withProv / totMeas * 100)} %)`);
console.log(`  in sections naming NEITHER:           ${bare}  (${f(bare / totMeas * 100)} %)`);
console.log(`\n  sections with figures and no provenance of any kind — the ones that fail the weakest test:\n`);
bareSecs.sort((a, b) => b.m - a.m).slice(0, 14).forEach(s => console.log(`    ${String(s.m).padStart(4)} figures   ${s.head}`));
if (bareSecs.length > 14) console.log(`    … and ${bareSecs.length - 14} more sections`);

console.log(`\n  *** AND THAT RESULT IS THE DEFECT, NOT THE FINDING: ${f(withProv / totMeas * 100)} % PASS A TEST THAT CANNOT FAIL. ***`);
console.log(`  A section counts as attributed if it mentions ANY 8-hex token anywhere in itself — and these`);
console.log(`  sections mention commit SHAs constantly, because this lane quotes its OWN commits. The test`);
console.log(`  measures "does this section contain a hex string", not "does this figure name its build".`);
console.log(`  A-G128's gate applied to my own audit, and the sixth instance of the family this phase.`);

/* ── the sharper test: is a provenance token NEAR the figure? ── */
console.log("\n" + "-".repeat(104));
console.log("THE SHARPER TEST — a provenance token within N lines of the figure itself");
console.log("-".repeat(104) + "\n");
const provLine = lines.map(l => {
  const shas = (l.match(SHA) || []);
  const builds = (l.match(BUILD) || []).filter(x => /[A-Z]/.test(x) && /[a-z]/.test(x) && /\d/.test(x));
  return shas.length + builds.length > 0;
});
const figLines = [];
lines.forEach((l, i) => { const m = (l.match(MEAS) || []).length; if (m) figLines.push([i, m]); });
for (const N of [0, 2, 5, 10]) {
  let near = 0, tot = 0;
  for (const [i, m] of figLines) {
    tot += m;
    let hit = false;
    for (let j = Math.max(0, i - N); j <= Math.min(lines.length - 1, i + N); j++) if (provLine[j]) { hit = true; break; }
    if (hit) near += m;
  }
  console.log(`  within ${String(N).padStart(2)} lines:  ${String(near).padStart(5)} of ${tot}  (${f(near / tot * 100)} %)`);
}
console.log(`\n  *** AT THE FIGURE'S OWN LINE THE SHARE COLLAPSES. *** That is the number A-G389's obligation`);
console.log(`  actually describes, and it is the one worth reporting. The section-level 98.6 % was a`);
console.log(`  measurement of my commit habit.`);
console.log(`\n  AND THE OBLIGATION ITSELF IS WRONG, which the audit shows by being unable to test it: prose`);
console.log(`  does not BIND a figure to a provenance token, so no proximity threshold is the right one.`);
console.log(`  *** RULED, REPLACING A-G389's INTERIM FORM: a figure quoted from a reading names the READING'S`);
console.log(`  FILE, not a build. *** The file carries provenance.buildId, so GRÜN's audit can decide whether`);
console.log(`  it is stale; a build id written into my prose goes stale silently and cannot be re-checked by`);
console.log(`  anything. A reference that delegates its own currency to an instrument beats one that asserts it.`);
console.log(`  GRÜN's census found 3 of 41 readings valid; that number is checkable precisely BECAUSE it lives`);
console.log(`  in the files rather than in either lane's prose.`);

/* ── A-G277 specifically: what does the PG-11 closure rest on? ── */
console.log("\n" + "=".repeat(104));
console.log("A-G277 · WHAT THE PG-11 CLOSURE RESTS ON, QUOTED FROM ITS OWN TEXT");
console.log("=".repeat(104));
const i0 = lines.findIndex(l => l.includes("A-G277 · PG-11 is INCONCLUSIVE BY MEASUREMENT"));
const block = lines.slice(i0, i0 + 20).join("\n");
const figs = block.match(MEAS) || [];
console.log(`\n  figures in the closure: ${figs.join(", ")}`);
const THRESH = 2e-4, READ = [4.58e-5, 9.98e-5];
console.log(`\n  A-G30's threshold ${THRESH}   readings ${READ.join(" and ")}`);
READ.forEach(r => console.log(`    marginFactor ${f(r / THRESH, 3)}  — ${f(THRESH / r, 2)}x below the threshold`));
console.log(`\n  The closure's logic has two limbs:`);
console.log(`   (a) the measured energy is BELOW A-G30's threshold, so the guard does not clear  <- DEPENDS ON THE VALUES`);
console.log(`   (b) no factor rescues it: >= 1.0 fails, < 1.0 asks for resolution the instrument lacks`);
console.log(`\n  *** LIMB (a) IS A FIGURE AND THE FIGURE IS STALE. *** The nearer reading is only ${f(THRESH / Math.max(...READ), 2)}x below`);
console.log(`  the threshold, and the new solve changes the emitted viewBox, hence k, hence every rendered`);
console.log(`  size — so the pooled region changes. A factor-of-two move flips limb (a). GRÜN is right that`);
console.log(`  this is the thing to re-take, and right that it needs a re-run and not a re-seal.`);
console.log(`\n  BUT THE STATUS IS NOT "WITHDRAWN". A-G54: a figure is a property of a build. The closure is`);
console.log(`  correct AS A STATEMENT ABOUT 3ec8457d and silent about 7910845b.`);
console.log(`  *** RULED: CLOSED ON A BUILD THAT NO LONGER SHIPS — a status this record did not have, and`);
console.log(`  one that reads differently from "closed", which is how §64's sweep row will otherwise be read.`);
