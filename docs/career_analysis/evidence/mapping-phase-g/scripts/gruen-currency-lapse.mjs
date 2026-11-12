/**
 * GRÜN · §117 · A-G473 TURNED ON THIS LANE'S OWN RECORD. PRODUCES NO VERDICT (A-G36 point 2).
 *
 *   node docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-currency-lapse.mjs
 *
 * GELB's A-G473: a currency claim is itself DATED. A status earned by a re-measurement decays exactly as
 * silently as the reading it replaced, so the repair of a staleness defect is not a closure but a DATED one.
 * Their own instrument found 8 of 8 claims lapsed in PHASE_F/PHASE_G. This is the same question asked here,
 * with one deliberate difference and one deliberate refusal.
 *
 * THE DIFFERENCE · A SINGLE REFERENT IS ITSELF A FRAME ERROR (A-G435, the domain axis). GELB dates every
 * claim against the last commit touching the COMPONENT. That over-reports and under-reports at once: a claim
 * about the test population is not invalidated by a comment moving in the product, and a claim about a pixel
 * reading is not validated by the tests being untouched. Each claim is therefore dated against the last
 * commit touching ITS OWN subject, and the subject is read from the claim rather than assumed.
 *
 * THE REFUSAL · A LIVENESS CLAIM HAS NO COMMIT REFERENT AT ALL. "The four stands return 200" and "PINK's
 * ports are untouched" decay in WALL-CLOCK time against running processes, not in commits. Dating them
 * against any tip would be a category error in whichever direction the tip happened to fall, so they are
 * reported UNDATABLE — a third bucket, not a lenient reading of the other two. §111b is the same split:
 * a recipe correct for a liveness scan is wrong for an existence scan.
 *
 * THREE DETECTOR DEFECTS ARE DESIGNED AGAINST, ALL THREE MEASURED IN GELB'S INSTRUMENT FIRST:
 *   1. SELF-MEASUREMENT. A scan that counts the sentence ruling AGAINST a claim as an instance of the claim
 *      has measured its own prose — four of their twelve rows were §129/§130 quoting the claims they
 *      overturn. This file excludes ITSELF (§100's lesson, where four of thirteen findings were the auditor
 *      quoting its own header) and excludes marked quotation SPANS.
 *   2. A QUOTATION IS A SPAN, NOT A PAIR OF NEIGHBOURING CHARACTERS. Their second form tested for a quote
 *      mark adjacent to the phrase and missed a line whose quote opened earlier. Spans are therefore matched
 *      as spans: `{{WAS: … }}`, `{{THEIRS-WAS: … }}` (§111/§113) and emphasised quotations.
 *   3. BOTH QUOTE FAMILIES, LITERALLY. Their patch threw on \u-escaped quotes where the file held literal
 *      UTF-8 typographic ones — and the file was left unchanged while the next command reprinted the old
 *      figures. MEASURED here rather than assumed: this README holds 92 U+0022, 3 U+201C and 3 U+201D, and
 *      all three are in the character class below.
 *
 * AND THE BUCKET-REACHABILITY PROOF, which GELB's fifth mutant is the argument for: a classifier that
 * reports 0 CURRENT is unaudited in exactly the direction A-G452 names. The positive control at the foot
 * asserts that a synthetic claim dated AFTER its referent classifies CURRENT, so "0 CURRENT" is a reading
 * and not a bucket nobody can reach.
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(here, "../../../../..");
const SELF = "docs/career_analysis/evidence/mapping-phase-g/scripts/gruen-currency-lapse.mjs";
const RECORD = "docs/career_analysis/evidence/mapping-phase-g/README.md";

const git = (...args) => execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }).trim();
const lastCommitFor = paths => {
  const out = git("log", "-1", "--format=%H%x1f%cI%x1f%s", "--", ...paths);
  if (out === "") throw new Error(`ERR_GRUEN_CURRENCY_NO_REFERENT: nothing in history touches ${JSON.stringify(paths)} — a referent that cannot be dated must not be reported as current.`);
  const [sha, when, subject] = out.split("\u001f");
  return { sha: sha.slice(0, 8), when, subject };
};

/**
 * A claim's SUBJECT decides its referent. Ordered: the first pattern that matches a line claims it, so the
 * narrow forms precede the broad ones. `undatable: true` means wall-clock liveness, never a commit.
 */
const KINDS = [
  { kind: "test-population", undatable: false, paths: ["test/career/mapping-field", "test/career/mapping-spec"],
    re: /\b\d+ files?, \d+ tests\b|\b\d+ tests, (?:\d+ passed, )?\d+ failed\b|architecture\.test\.ts\*{0,2} \*{0,2}\d+\/\d+/ },
  /* §118: the referent EXCLUDES the two audits' own outputs. A claim about the readings corpus cannot be
     invalidated by the audit that describes the corpus writing its own file — that is the claim dating
     itself stale, one turn of the same screw A-G473 names. And `\d+ STALE` alone matched prose about a
     PEER's citations being "+20 stale", so the staleness forms now require a corpus noun. */
  { kind: "readings-corpus", undatable: false,
    paths: ["docs/career_analysis/evidence/mapping-phase-g/outputs",
            ":(exclude)docs/career_analysis/evidence/mapping-phase-g/outputs/currency-lapse.json",
            ":(exclude)docs/career_analysis/evidence/mapping-phase-g/outputs/seal-staleness.json"],
    re: /\bvalid\b[^.\n]*\bis now \d+|\b\d+ STALE (?:UNSEALED )?(?:READINGS?|SEALS?)\b|\bstale\b[^.\n]*\breadings\b/i },
  { kind: "seal-corpus", undatable: false, paths: ["docs/career_analysis/evidence/mapping-phase-g/outputs"],
    re: /\bseals? (?:are|is|stay|stays|remain|remains) untouched\b|\bSEALED-\*[^.\n]*untouched\b/i },
  { kind: "stand-liveness", undatable: true, paths: [],
    re: /\breturning 200\b|\bports? [^.\n]*\b(?:are|is) untouched\b|:3\d{3}[^.\n]*\buntouched\b/i },
  { kind: "product-pixels", undatable: false, paths: ["app/components/career/demo/PersonJobMappingField.tsx"],
    re: /\b0 of 47 ?073\b|\bpx\b[^.\n]*\bworst\b|\bworst residual\b/i },
  { kind: "peer-worktree", undatable: false, paths: [],
    re: /BUILD_ID [A-Za-z0-9_-]+\)? (?:is|stays) untouched/ }
];

const src = readFileSync(resolve(ROOT, RECORD), "utf8");

/**
 * §118 · A-G474 (GELB's), AND THE FALSIFICATION THAT MADE IT MINE. Their rule: when a distinction is carried
 * by the document's own structure, READ THE STRUCTURE — a test that re-derives it from characters re-derives
 * it wrongly and goes on failing in NEW ways after each repair. They reached it after four forms.
 *
 * MEASURED HERE rather than accepted: this scan was run with the two CHARACTER-inferred spans removed and
 * only the document-DECLARED ones kept, and the row set changed from 6 matched / 0 LAPSED to 10 matched /
 * 2 LAPSED. *** SO THE CHARACTER TEST WAS HIDING FOUR CLAIMS, ONE OF THEM GENUINELY LAPSED. *** GELB's four
 * forms OVER-reported, which is the alarming direction and gets audited; mine UNDER-reported, which is the
 * flattering direction and does not. A "0 LAPSED" produced by an over-broad quotation detector is the same
 * shape as a green produced by an empty population (§94).
 *
 * So only DECLARED markers remain. The consequence is accepted rather than engineered around: a peer's
 * sentence quoted WITHOUT a marker now counts as this lane's own claim. That over-reports, which is the
 * direction a reader audits, and the remedy is a marker on the quotation (§111/§113's forms) rather than a
 * cleverer regex — which is exactly what A-G474 says.
 */
const QUOTE_SPANS = [
  /\{\{WAS:[\s\S]*?\}\}/g,          // §111 — this lane asserted it and retracted it
  /\{\{THEIRS-WAS:[\s\S]*?\}\}/g    // §113 — another lane retracted it; this record only quotes it
];
/**
 * §117b: THE FIRST FORM OF THIS BLANKING REPLACED EVERY CHARACTER OF A SPAN WITH A SPACE, NEWLINES INCLUDED.
 * Total length was preserved, so the guard below — which checked LENGTH — passed, while `split("\n")`
 * returned fewer lines than the source and every row cited a line it had not matched. The comment on that
 * guard already said "line numbers would shift and every row would cite the wrong line": the right hazard
 * was named and the wrong quantity was checked. Newlines are now preserved per character, and the invariant
 * asserted is the one the row numbers actually depend on.
 */
const blankSpan = m => m.replace(/[^\n]/g, " ");
const blanked = QUOTE_SPANS.reduce((acc, re) => acc.replace(re, blankSpan), src);
if (blanked.length !== src.length) throw new Error("ERR_GRUEN_CURRENCY_BLANKING_CHANGED_LENGTH: the span blanking changed the file's length.");
if (blanked.split("\n").length !== src.split("\n").length) throw new Error("ERR_GRUEN_CURRENCY_BLANKING_CHANGED_LINES: line numbers would shift and every row would cite a line it did not match.");
const quotedChars = src.length - blanked.replace(/ /g, "").length - (src.length - src.replace(/ /g, "").length);

/**
 * §118b · WHAT THE EXCLUSION SET COSTS, REPORTED IN EVERY RUN RATHER THAN PROVED ONCE.
 *
 * The A-G474 falsification above was a one-off: run with the character spans removed, see the row set grow
 * from 6 to 10. A one-off does not survive the next broadening of the set — and both lanes' corrections to
 * these instruments moved their counts the SAME way, GELB's 8 -> 2 and this lane's 3 -> 1 -> 0, each step
 * individually correct and every step toward fewer findings. *** THAT IS THE DIRECTION A-G462 SAYS GETS NO
 * AUDIT: not only a conclusion against oneself, but a refinement that ABSOLVES, when each move is
 * defensible on its own. *** So the cost of excluding anything is a number printed every time: how many
 * claim-matching lines the exclusion set removes from view. A zero here means the markers are doing nothing;
 * a number that grows without a section explaining it is the flattering direction arriving unannounced.
 */
const hiddenByExclusion = (() => {
  const unblanked = src.split("\n");
  const count = ls => ls.reduce((n, line) => n + (line.trim() !== "" && KINDS.some(k => k.re.test(line)) ? 1 : 0), 0);
  return count(unblanked) - count(blanked.split("\n"));
})();

const lines = blanked.split("\n");
const rawLines = src.split("\n");

/**
 * §119 · A-G476 (GELB's): A QUOTATION INHERITS THE DATE OF THE COMMIT THAT QUOTES IT, SO QUOTING A STALE
 * CLAIM LAUNDERS ITS DATE. Reproduced here before it was believed: §118's two lines quoting §116c's
 * staleness figure — written expressly to say that figure carried NO BUILD — were dated to §118's own
 * commit and read CURRENT. *** THE SENTENCE DISCLAIMING A FIGURE'S CURRENCY CERTIFIED IT. *** Worse than
 * §113's irony, because there the quotation carried a defect and here it carries a STATUS.
 *
 * So a claim is dated from the OLDEST version of this record that already contained its FIGURES, not from
 * the commit that introduced its line. Every blob of the record is read once, oldest first, and a claim
 * matches a blob when some line of that blob carries all of the claim's numbers. A restatement then
 * inherits the date of the reading it restates, which is A-G427's ruling — the quotation carries the quoted
 * claim's build — enforced by the instrument instead of left to a convention.
 *
 * DETECTOR LIMITS, both deliberate:
 *   · a claim with fewer than two numbers has no signature and keeps its line date; a single number collides
 *     across unrelated sentences, and a false EARLIER date would make a current claim read lapsed, which is
 *     the alarming direction but still wrong.
 *   · a different sentence that happens to carry the same numbers will match. That makes the effective date
 *     too OLD, i.e. it over-reports lapse. Chosen on purpose: §118b's finding is that every refinement here
 *     has moved the count toward fewer findings, and this is the one lever that moves it the other way.
 */
const recordBlobs = (() => {
  const shas = git("log", "--format=%H%x1f%cI", "--reverse", "--", RECORD).split("\n").filter(Boolean);
  return shas.map(row => {
    const [sha, when] = row.split("\u001f");
    let body = "";
    try { body = execFileSync("git", ["show", `${sha}:${RECORD}`], { cwd: ROOT, encoding: "utf8", maxBuffer: 1 << 26 }); } catch { body = ""; }
    return { sha: sha.slice(0, 8), when, numbersByLine: body.split("\n").map(l => (l.match(/\d[\d.]*/g) ?? [])) };
  });
})();
if (recordBlobs.length === 0) throw new Error("ERR_GRUEN_CURRENCY_NO_HISTORY: the record has no committed history, so no claim can be dated.");

const signatureOf = line => (line.match(/\d[\d.]*/g) ?? []).filter(n => n.length > 0);
const firstBlobCarrying = sig => {
  if (sig.length < 2) return null;
  for (const blob of recordBlobs)
    for (const nums of blob.numbersByLine) {
      if (nums.length < sig.length) continue;
      if (sig.every(n => nums.includes(n))) return { sha: blob.sha, when: blob.when };
    }
  return null;
};

/** The commit that INTRODUCED a line, not the one that last touched the file: a section can be edited long
 *  after its claim was written, and `git log -S` oldest hit is the date the claim entered the record. */
const introducedBy = text => {
  const needle = text.trim();
  if (needle.length < 12) return null;
  const out = git("log", "--format=%H%x1f%cI%x1f%s", "-S", needle, "--", RECORD);
  if (out === "") return null;
  const rows = out.split("\n").filter(Boolean);
  const [sha, when, subject] = rows[rows.length - 1].split("\u001f"); // oldest
  return { sha: sha.slice(0, 8), when, subject };
};

const referentCache = new Map();
const referentFor = kind => {
  if (kind.undatable) return null;
  if (kind.paths.length === 0) return null;
  if (!referentCache.has(kind.kind)) referentCache.set(kind.kind, lastCommitFor(kind.paths));
  return referentCache.get(kind.kind);
};

/**
 * §117c: A READING THAT NAMES ITS BUILD IS NOT A CURRENCY CLAIM. The first form of this scan reported three
 * LAPSED rows; two of them read "16 files, 197 tests … at `c7143fcd`" and "reports 8 stale at `fb4632da`".
 * Those are DATED measurements — A-G54, a figure belongs to a build — and a dated measurement cannot lapse,
 * because it never claimed to be current. Counting them as lapsed is the over-report direction, which is
 * the alarming one (A-G429), and it would have had this lane editing correct sentences.
 *
 * The scope is read from the enclosing PARAGRAPH, not from characters adjacent to the match: GELB's second
 * defect was a discriminator that tested for a quote mark NEXT TO the phrase and missed a span opening
 * earlier. DETECTOR LIMIT, chosen deliberately: a paragraph naming a build for some OTHER clause will scope
 * this claim too, so the scan under-reports rather than over-reports. A claim is only called lapsed when its
 * whole paragraph names no build at all.
 */
const paragraphs = (() => {
  const out = new Array(rawLines.length).fill("");
  let start = 0;
  const flush = end => { const body = rawLines.slice(start, end).join("\n"); for (let j = start; j < end; j += 1) out[j] = body; };
  for (let i = 0; i < rawLines.length; i += 1) if (rawLines[i].trim() === "" || rawLines[i].trim() === ">") { flush(i); start = i + 1; }
  flush(rawLines.length);
  return out;
})();
const NAMES_A_BUILD = /`[0-9a-f]{8}`|`[0-9a-f]{40}`|BUILD_ID [A-Za-z0-9_-]{8,}|buildId [A-Za-z0-9_-]{8,}/;

const rows = [];
lines.forEach((line, i) => {
  if (line.trim() === "") return;
  const kind = KINDS.find(k => k.re.test(line));
  if (kind === undefined) return;
  const row = { line: i + 1, kind: kind.kind, text: rawLines[i].trim().slice(0, 150) };
  if (!kind.undatable && NAMES_A_BUILD.test(paragraphs[i])) {
    row.status = "SCOPED";
    row.why = "the claim's own paragraph names a build, so it is a DATED measurement (A-G54) and cannot lapse";
    rows.push(row);
    return;
  }
  if (kind.undatable) { row.status = "UNDATABLE"; row.why = "a liveness claim about a running process decays in wall-clock time, not in commits"; rows.push(row); return; }
  const wrote = introducedBy(rawLines[i]);
  const ref = referentFor(kind);
  /**
   * §118c: AN UNCOMMITTED LINE IS NOT AN UNDATED CLAIM. The first form returned `UNDATED` for a claim
   * `git log -S` could not find, and fail-closed on it — so writing §118 made this instrument report two
   * debts against a section that was being written at that moment. A line in the working tree is dated NOW
   * by construction and cannot be stale; treating "not yet committed" as "not dated" is the §94 shape
   * inverted, a debt reported against something no change has had the chance to invalidate.
   *
   * KNOWN LIMIT, named rather than engineered around: the two rows that exposed this are §118's own prose
   * QUOTING §116c's figure in order to rule about it. A-G460 — a rule scoped to the artifact does not bind
   * the sentence about the artifact — and this scan cannot tell a claim from a sentence about a claim. That
   * is GELB's defect 1 family in its fourth appearance across the two lanes, and the only structural remedy
   * is a marker on the quotation. One is NOT invented here: the UNCOMMITTED fix makes these rows correct,
   * and a convention earned by one instance is a convention invented for none.
   */
  if (wrote === null) {
    const ref2 = referentFor(kind);
    row.status = ref2 === null ? "UNDATABLE" : "UNCOMMITTED";
    row.why = "the line is in the working tree, so it is dated NOW by construction and cannot be stale; it is not yet a committed claim";
    if (ref2 !== null) row.referent = ref2;
    rows.push(row);
    return;
  }
  if (ref === null) { row.status = "UNDATABLE"; row.why = "the claim's subject is not a path in this repository"; rows.push(row); return; }
  const carried = firstBlobCarrying(signatureOf(rawLines[i]));
  const effective = carried !== null && Date.parse(carried.when) < Date.parse(wrote.when) ? carried : wrote;
  row.writtenAt = wrote;
  if (effective !== wrote) { row.restatesFrom = carried; row.note = "A-G476: dated from the oldest version of the record carrying these figures, not from the line that restates them"; }
  row.effectiveAt = effective;
  row.referent = ref;
  row.status = Date.parse(effective.when) >= Date.parse(ref.when) ? "CURRENT" : "LAPSED";
  rows.push(row);
});

/* THE POSITIVE CONTROL. A classifier reporting 0 CURRENT is unaudited in precisely the direction A-G452
   names, so CURRENT is shown to be REACHABLE before any count below is believed. The synthetic claim is
   dated by construction, never by a scan of this file. */
const control = (() => {
  const ref = lastCommitFor(["test/career/mapping-field", "test/career/mapping-spec"]);
  const after = { sha: "0000000f", when: new Date(Date.parse(ref.when) + 60_000).toISOString(), subject: "(synthetic)" };
  const before = { sha: "0000000e", when: new Date(Date.parse(ref.when) - 60_000).toISOString(), subject: "(synthetic)" };
  const classify = wrote => (Date.parse(wrote.when) >= Date.parse(ref.when) ? "CURRENT" : "LAPSED");
  return { currentIsReachable: classify(after) === "CURRENT", lapsedIsReachable: classify(before) === "LAPSED" };
})();
/* §119b: TWO MORE BUCKETS PROVED REACHABLE IN-PROCESS, because GELB shipped an UNCOMMITTED bucket that
   read 0 for a reason that was not the record, and because a dating mechanism that changes no number on
   this record is unaudited in exactly the way §94 names. No corpus mutant: their revert step silently did
   not run (a `cd ..` landed one directory short) and the mutant sat in the record until an md5 caught it.
   A mutant programme's revert needs the same proof as its apply, and a control that needs no mutation
   needs no revert. */
const mechanismControl = (() => {
  const oldest = recordBlobs[0];
  const sig = oldest.numbersByLine.find(nums => nums.length >= 2);
  if (sig === undefined) return { datesBackwards: null, why: "the oldest blob has no line with two numbers" };
  const found = firstBlobCarrying(sig);
  return { datesBackwards: found !== null && found.sha === oldest.sha, resolvedTo: found, oldestBlob: oldest.sha };
})();
const uncommittedControl = (() => {
  const absent = introducedBy("a sentence that has never been written into this record: " + "x".repeat(40));
  return { reachable: absent === null };
})();
if (mechanismControl.datesBackwards === false)
  throw new Error(`ERR_GRUEN_CURRENCY_DATING_INERT: a signature from the OLDEST blob did not resolve to it (${JSON.stringify(mechanismControl)}) — the A-G476 dating cannot reach back and would silently never fire.`);
if (!uncommittedControl.reachable)
  throw new Error("ERR_GRUEN_CURRENCY_UNCOMMITTED_UNREACHABLE: a line that was never written resolved to a commit, so UNCOMMITTED is a bucket nothing can enter and a 0 there would be vacuous (A-G453).");
if (!control.currentIsReachable || !control.lapsedIsReachable)
  throw new Error(`ERR_GRUEN_CURRENCY_BUCKET_UNREACHABLE: ${JSON.stringify(control)} — a classifier that cannot reach both buckets has not measured anything.`);

/* And the detector must have found SOMETHING: a pattern set that matches nothing reports a clean record. */
if (rows.length === 0) throw new Error("ERR_GRUEN_CURRENCY_EMPTY: no claim matched. A pattern set that matches nothing reports a clean record and proves nothing (§94).");

const by = status => rows.filter(r => r.status === status);
const out = {
  instrument: SELF,
  verdict: "NONE — development reading only (A-G36 point 2)",
  rule: "A-G473 (GELB's): a currency claim is itself DATED; the repair of a staleness defect is a DATED closure.",
  record: RECORD,
  head: git("rev-parse", "--short=8", "HEAD"),
  referents: Object.fromEntries([...referentCache]),
  quotationCharsExcluded: quotedChars,
  claimLinesHiddenByExclusion: hiddenByExclusion,
  control,
  mechanismControl,
  uncommittedControl,
  counts: { matched: rows.length, LAPSED: by("LAPSED").length, CURRENT: by("CURRENT").length, SCOPED: by("SCOPED").length, UNCOMMITTED: by("UNCOMMITTED").length, UNDATABLE: by("UNDATABLE").length, UNDATED: by("UNDATED").length },
  rows,
  detectorLimit: "Claims are found by PATTERN, so a currency claim phrased outside these six forms is invisible to this scan and the counts are a FLOOR, not a census. LAPSED means the claim no longer carries its own WARRANT — not that it is false: a reading can survive a change that does not touch its quantity, which GELB measured as 5 of 9 findings stable across +166/-29."
};

console.log(`\nA-G473 over ${RECORD} at ${out.head}`);
console.log(`referents: ${Object.entries(out.referents).map(([k, v]) => `${k}=${v.sha} ${v.when.slice(0, 16)}`).join(" · ")}`);
console.log(`control: CURRENT=${control.currentIsReachable} LAPSED=${control.lapsedIsReachable} A-G476-dates-backwards=${mechanismControl.datesBackwards} UNCOMMITTED-reachable=${uncommittedControl.reachable} · quotation chars excluded: ${quotedChars} · CLAIM LINES HIDDEN BY THE EXCLUSION SET: ${hiddenByExclusion}\n`);
for (const r of rows) {
  const dated = r.writtenAt === undefined ? "" : ` written ${r.writtenAt.sha} ${r.writtenAt.when.slice(0, 16)} vs ${r.referent.sha} ${r.referent.when.slice(0, 16)}`;
  console.log(`${r.status.padEnd(10)} :${String(r.line).padEnd(4)} ${r.kind.padEnd(17)}${dated}`);
  console.log(`           ${r.text}`);
}
console.log(`\nmatched ${out.counts.matched} · LAPSED ${out.counts.LAPSED} · CURRENT ${out.counts.CURRENT} · SCOPED ${out.counts.SCOPED} · UNCOMMITTED ${out.counts.UNCOMMITTED} · UNDATABLE ${out.counts.UNDATABLE} · UNDATED ${out.counts.UNDATED}`);
console.log(out.detectorLimit);

const { writeFileSync } = await import("node:fs");
writeFileSync(resolve(here, "../outputs/currency-lapse.json"), JSON.stringify(out, null, 1));

/* Fail-closed: a lapsed currency claim is a debt this record owes, and an instrument that reports it with
   exit 0 hands a reader the same "no news" a clean run gives (A-G465). The code describes the RECORD's
   state, never a verdict on a pin. */
if (out.counts.LAPSED > 0 || out.counts.UNDATED > 0) process.exitCode = 1;
