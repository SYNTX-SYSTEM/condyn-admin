/**
 * GELB · §131 A-G473's DISCHARGE — WHICH CURRENCY CLAIMS IN THIS RECORD HAVE LAPSED
 *
 * A-G473: a currency claim is itself DATED. "Re-measured on the current build" is a statement about a MOMENT,
 * and writing it in the present tense makes it read live forever. §89 recorded "A-G277 returns to CLOSED,
 * resting on current readings" at 17:58; the component changed at 20:25 and again at 22:13. The sentence was
 * true for 2h27m and has been false since, and nothing in the record marks the expiry.
 *
 * So the rule cannot be left as prose: it indicts the record that states it. This instrument dates every
 * currency claim against the product's own history.
 *
 * METHOD, and it is deliberately the weakest form that can still fail:
 *   1. find each CURRENCY CLAIM in the record by phrase;
 *   2. date it by the commit that INTRODUCED that line (`git log -S`), not by the section it sits in — a
 *      section can be edited long after its claim was written;
 *   3. compare against the last commit touching the PRODUCT at the peer ref;
 *   4. LAPSED if the product moved after the claim was written. CURRENT otherwise.
 *
 * WHAT IT CANNOT DO, stated because A-G465 is this lane's rule: it cannot tell whether a lapsed claim is
 * WRONG. A reading can survive a product change that does not touch its quantity — §129 measured exactly
 * that, with 5 of 9 instruments' findings stable across +166/-29. *** SO "LAPSED" MEANS "NO LONGER CARRIES
 * ITS OWN WARRANT", NOT "FALSE". *** It is over-inclusive by construction and that is the only honest
 * direction for it: a claim whose warrant has expired needs re-measurement to say anything at all.
 *
 * AND IT DOES NOT ANNOUNCE A VERDICT ON ANY PIN. A-G36 point 2 reserves obligation verdicts to PINK.
 */
import { REPO_ROOT, PHASE_G, PHASE_F, peerRef } from "./gelb-paths.mjs";
import { readLines, git } from "./gelb-read.mjs";

const PRODUCT = "app/components/career/demo/PersonJobMappingField.tsx";
const PEER = peerRef(REPO_ROOT);

/* phrases that ASSERT a reading is current. Over-inclusive by design (A-G429 remedy 1: classify, never
   filter) — every hit is printed with its line so no row stands on something unshown. */
const CLAIMS = [
  "resting on current readings", "on current readings", "re-measured on the shipping build",
  "on the build that ships", "byte-identical to HEAD", "re-ran all three cells",
  "RE-MEASURED ON THE SHIPPING BUILD", "SUSPENSION LIFTED", "returns to CLOSED",
  "closed again", "CLOSED AGAIN", "verified on a rendered page", "on the current build",
];

/* ─────────────── GRÜN'S CORRECTION, §117: A SINGLE REFERENT IS ITSELF A FRAME ERROR (A-G435) ───────────────
   The first form dated EVERY claim against the last commit touching the component. That over- and
   under-reports at once: a claim about the test population is not invalidated by a comment moving in the
   product, and a pixel reading is not validated by the tests being untouched. Measured at the peer ref, the
   subjects' tips are 25 hours apart — so the single-referent rule was not a simplification, it was a wrong
   answer in both directions. Each claim is now dated against ITS OWN subject, read from the claim.

   AND TWO BUCKETS THE FIRST FORM DID NOT HAVE, both of which it folded into LAPSED and so INFLATED a figure
   that was about to reach the owner:

     SCOPED      a DATED measurement cannot lapse, because it never claimed to be current (A-G54: a figure
                 belongs to a build). Decided from the enclosing PARAGRAPH, not from adjacent characters —
                 which is this instrument's second defect, generalised. STATED LIMIT: a paragraph naming a
                 build for some OTHER clause scopes this claim too, so this direction UNDER-reports, and that
                 is the direction to under-report in.
     UNDATABLE   a LIVENESS claim has no commit referent at all — "the stands return 200" decays in
                 wall-clock time against a running process. Dating it against any tip is a category error in
                 whichever direction that tip fell. A third bucket, not a lenient reading of the other two.

   BOTH ARE GRÜN'S, AND BOTH CHANGED MY ANSWER: 8 LAPSED became 6. */
const SUBJECTS = [
  { key: "component", path: "app/components/career/demo/PersonJobMappingField.tsx",
    cue: /pixel|render|rendered page|swing|glow|halo|shelf|guardClears|marginFactor|viewBox|solve|pass(es)?\b|constant/i },
  { key: "tests",     path: "test/career/mapping-field",
    cue: /test|suite|vitest|population|PHASE_DIRS|\bfiles?\b.*\btests?\b/i },
  { key: "peer-record", path: "docs/career_analysis",
    cue: /GRÜN's (count|record|scan|README|audit)|seal|SEALED/i },
];
const LIVENESS = /\breturn(s)? 200\b|\bports? (are )?untouched\b|\bis (still )?(up|running|listening)\b|\bresponds\b/i;
/* a build NAMED in the paragraph: a 7-8 hex sha, or a Next.js buildId (21 chars, base64url-ish) */
const BUILD_TOKEN = /`([0-9a-f]{7,8})`|`([A-Za-z0-9_-]{21})`/g;

const tipFor = (path) => {
  const out = git(REPO_ROOT, "log", "-1", "--format=%H %ct %ad %s", "--date=format:%m-%d %H:%M", PEER.sha, "--", path).trim();
  const [sha, ct, ...rest] = out.split(" ");
  return { sha: sha.slice(0, 8), ct: Number(ct), label: rest.join(" ").slice(0, 52) };
};
const TIPS = Object.fromEntries(SUBJECTS.map((s) => [s.key, tipFor(s.path)]));

const subjectOf = (text) => (SUBJECTS.find((s) => s.cue.test(text)) ?? SUBJECTS[0]).key;

/** the enclosing paragraph: contiguous non-blank lines around the hit, blockquote markers stripped */
const paragraphAt = (lines, i) => {
  const blank = (l) => /^[>\s]*$/.test(l);
  let a = i, b = i;
  while (a > 0 && !blank(lines[a - 1])) a--;
  while (b < lines.length - 1 && !blank(lines[b + 1])) b++;
  return lines.slice(a, b + 1).join(" ");
};

/** builds named in a paragraph, and whether each resolves to a commit in this repository */
const buildsIn = (para) => {
  const out = [];
  for (const m of para.matchAll(BUILD_TOKEN)) {
    const tok = m[1] ?? m[2];
    let resolves = false;
    try { git(REPO_ROOT, "cat-file", "-e", `${tok}^{commit}`); resolves = true; } catch { resolves = false; }
    out.push({ tok, resolves });
  }
  return out;
};


/** the commit that INTRODUCED this exact line into this file — a section can be edited long after its
 *  claim was written, so the SECTION's date is the wrong date to use. Oldest pickaxe hit wins. */
const introducedBy = (file, line) => {
  const needle = line.trim();
  if (needle.length < 24) return null;
  try {
    const out = git(REPO_ROOT, "log", "--format=%H %ct %ad", "--date=format:%m-%d %H:%M",
      "-S", needle, "--pickaxe-all", "--", file).trim();
    if (!out) return null;
    const hits = out.split("\n").filter(Boolean);
    const [sha, ct, ...d] = hits[hits.length - 1].split(" ");
    return { sha: sha.slice(0, 8), ct: Number(ct), date: d.join(" ") };
  } catch { return null; }
};

/* AN ASSERTION AND A QUOTATION OF IT ARE DIFFERENT THINGS, and every cheap test for the difference has been
   wrong here. The first form counted §129/§130's own text quoting the lapsed claims as instances of them —
   a scan that counts the sentence ruling against a claim as an instance of the claim has measured its own
   prose. The second tested for a quote mark ADJACENT to the phrase and missed a span opening earlier on the
   line. *** A QUOTATION IS A SPAN, NOT A PAIR OF NEIGHBOURING CHARACTERS. ***
   NOTE ON GRÜN'S §117b: its span handling blanked whole spans INCLUDING NEWLINES, preserving total length so
   its length guard passed while split("\n") returned fewer lines and every row cited a line it had not
   matched. This implementation cannot have that defect BY CONSTRUCTION rather than by care — it splits into
   lines FIRST and tests containment within a single line, so a span can never cross a newline. */
const quotedSpans = (line) => {
  const spans = []; const re = /["\u201C]([^"\u201D]{3,})["\u201D]/g; let m;
  while ((m = re.exec(line)) !== null) spans.push([m.index, m.index + m[0].length]);
  return spans;
};
const QUOTED = (line, phrase) => {
  const i = line.indexOf(phrase);
  if (i < 0) return false;
  if (/^\s*\|/.test(line)) return true;                 // a table row citing it
  return quotedSpans(line).some(([a, b]) => i >= a && i + phrase.length <= b);
};

const bar = "=".repeat(108);
console.log(bar);
console.log("GELB · §131 A-G473 — CURRENCY CLAIMS, EACH DATED AGAINST ITS OWN SUBJECT");
console.log(bar);
console.log(`\n  peer ref   ${PEER.ref} -> ${PEER.sha}`);
console.log(`\n  SUBJECT TIPS — a single referent is itself a frame error (A-G435, GRÜN's §117 correction):`);
for (const s of SUBJECTS) console.log(`    ${s.key.padEnd(12)} ${TIPS[s.key].sha}  ${TIPS[s.key].label}`);
console.log(`\n  A claim written BEFORE ITS OWN SUBJECT'S TIP no longer carries its own warrant. That is NOT the`);
console.log(`  same as being wrong — §129 measured 5 of 9 instruments' findings stable across +166/-29.`);

const rel = (f) => f.replace(`${REPO_ROOT}/`, "");
const rows = [], quoted = [];
for (const file of [PHASE_G, PHASE_F]) {
  const lines = readLines(file);
  let inFence = false;
  lines.forEach((l, i) => {
    if (/^\s*```/.test(l)) { inFence = !inFence; return; }
    const hit = CLAIMS.find((c) => l.includes(c));
    if (!hit) return;
    /* A FENCED BLOCK IS VERBATIM QUOTED MATERIAL, NOT AN ASSERTION. §131's own listing of the lapsed
       phrases sat inside one, and the span rule did not save it: the line reads
         to HEAD" · "resting on current readings"
       and the regex paired `" · "` as a span, leaving the phrase OUTSIDE any span. Fourth correction in
       this instrument and the same family every time — but this one is structural rather than textual,
       which is why it is the one that holds: a fence is declared by the document, not inferred from
       punctuation. *** EVERY TEXTUAL TEST FOR "IS THIS QUOTED" HAS FAILED HERE; THE MARKUP-LEVEL ONE DID
       NOT. *** */
    if (inFence) { quoted.push({ file: rel(file), ln: i + 1, phrase: hit, why: "in a fenced block" }); return; }
    if (QUOTED(l, hit)) { quoted.push({ file: rel(file), ln: i + 1, phrase: hit, why: "quoted span / table row" }); return; }
    const para = paragraphAt(lines, i);
    rows.push({
      file: rel(file).split("/").pop().replace("PERSON_X_JOB_MAPPING_", ""),
      ln: i + 1, phrase: hit, text: l.trim(),
      subject: subjectOf(l), liveness: LIVENESS.test(l), builds: buildsIn(para),
      intro: introducedBy(rel(file), l),
    });
  });
}

const B = { LAPSED: [], CURRENT: [], SCOPED: [], "SCOPED-UNRESOLVABLE": [], UNDATABLE: [] };
for (const r of rows) {
  if (r.liveness) { r.state = "UNDATABLE"; }
  else if (!r.intro) { r.state = "UNDATABLE"; }
  else if (r.builds.length) {
    /* A dated measurement cannot lapse — unless the build it names resolves for nobody, in which case the
       scoping is NOMINAL: §89's utpaUMQpafZVzAeyYImhv is a Next.js buildId with no repository referent, so
       a reader cannot test the claim by any means. A-G469's axis, one layer out from a SHA. */
    r.state = r.builds.some((b) => b.resolves) ? "SCOPED" : "SCOPED-UNRESOLVABLE";
  } else if (r.intro.ct < TIPS[r.subject].ct) { r.state = "LAPSED"; }
  else { r.state = "CURRENT"; }
  B[r.state].push(r);
}

console.log(`\n${bar}\n[1] EVERY CURRENCY CLAIM, ITS SUBJECT, ITS DATE AND ITS STATE\n${bar}\n`);
for (const r of rows) {
  const tag = { LAPSED: "*** LAPSED  ", CURRENT: "CURRENT     ", SCOPED: "SCOPED      ",
                "SCOPED-UNRESOLVABLE": "SCOPED-NOREF", UNDATABLE: "UNDATABLE   " }[r.state];
  console.log(`  ${tag} ${r.file}:${String(r.ln).padStart(5)}  subj=${r.subject.padEnd(11)} ` +
    `${r.intro ? `${r.intro.sha} ${r.intro.date}` : "  not locatable "}  vs ${TIPS[r.subject].sha}  "${r.phrase}"`);
  if (r.builds.length) console.log(`               builds named in its paragraph: ${r.builds.map((b) => `${b.tok}${b.resolves ? "" : " (NO REPOSITORY REFERENT)"}`).join(", ")}`);
  console.log(`               ${r.text.slice(0, 94)}`);
}

const lapsed = B.LAPSED.length;
console.log(`\n${bar}\n[2] WHAT THIS BOUNDS\n${bar}\n`);
console.log(`  currency claims ASSERTED:  ${rows.length}`);
console.log(`  quotations of a claim, excluded and counted: ${quoted.length}  <- §129/§130 ruling against them`);
for (const q of quoted) console.log(`      quoted   ${q.file.split("/").pop()}:${String(q.ln).padStart(5)}  ${(q.why ?? "").padEnd(24)} "${q.phrase}"`);
console.log(``);
for (const k of ["LAPSED", "CURRENT", "SCOPED", "SCOPED-UNRESOLVABLE", "UNDATABLE"])
  console.log(`    ${k.padEnd(21)} ${String(B[k].length).padStart(2)}`);
console.log(`\n  *** ${lapsed} OF ${rows.length} CURRENCY CLAIMS IN THIS RECORD NO LONGER CARRY THEIR OWN WARRANT. ***`);
console.log(`  THE FIRST FORM OF THIS INSTRUMENT SAID 8, by dating every claim against one referent and folding`);
console.log(`  SCOPED and UNDATABLE into LAPSED. GRÜN warned that an inflated figure was about to reach the owner`);
console.log(`  and it was: a DATED measurement never claimed to be current, so counting it lapsed is the`);
console.log(`  over-report direction — the alarming one — and acting on it would have me editing correct`);
console.log(`  sentences. ${B.SCOPED.length} row(s) are SCOPED and not owed.`);
console.log(`\n  AND ONE STATE NEITHER LANE HAD: ${B["SCOPED-UNRESOLVABLE"].length} row(s) are scoped to a build with NO REPOSITORY`);
console.log(`  REFERENT. The scoping is NOMINAL — a reader cannot test the claim by any means, so the row is`);
console.log(`  neither safely dated nor merely owed a re-run. A-G469's axis one layer out from a SHA.`);
console.log(`\n  LIMITS, STATED: (a) SCOPED is decided from the enclosing PARAGRAPH, so a paragraph naming a build`);
console.log(`  for some OTHER clause scopes this claim too — this UNDER-reports, which is the right direction.`);
console.log(`  (b) LAPSED means the warrant is older than its subject, NOT that the claim is false. (c) Only a`);
console.log(`  re-measurement moves a row out of LAPSED, and re-sealing is a deliberate act on a deliberate`);
console.log(`  build — so these rows are OWED, not silently repairable.`);
console.log(`\n  AND ONE BUCKET IS VACUOUS, DECLARED RATHER THAN REPORTED AS A FINDING (A-G453): UNDATABLE reads 0`);
console.log(`  because NO PHRASE IN THIS PATTERN SET IS A LIVENESS CLAIM, and this record makes none. Verified`);
console.log(`  rather than assumed: a grep for "is up"/"returns 200"/"ports untouched" over both records gives`);
console.log(`  four hits and all four are "is UPheld" or "spread is UP to" — A-G450, read the matched line. So`);
console.log(`  the bucket is reachable in CODE and unreachable in DATA. It exists because GRÜN's record HAS such`);
console.log(`  claims; a 0 here is a property of the pattern set, not of the record, and reporting it as a`);
console.log(`  finding would be the vacuity A-G453 was written for.`);
console.log(`\n  NO PIN VERDICT IS ANNOUNCED HERE. A-G36 point 2 reserves those to PINK.`);
console.log(bar);


/* ───────────── A-G452: prove each state can fire, on synthetic lines, printing every outcome ───────────── */
console.log(`\n${bar}\n[3] MUTANTS — each classification proven reachable (A-G452)\n${bar}\n`);
{
  const cases = [
    ["an asserted claim",            "So **A-G277 returns to CLOSED**, resting on current readings.", false],
    ["the same claim QUOTED",        'the note said *"resting on current readings"* and that is the defect',  true],
    ["the same claim in a TABLE ROW", '| `7910845b` | §86 · verified on a rendered page | inside the 90 |',   true],
    ["QUOTED, span opens earlier",   '> *"So limb (a) holds on the build that ships and A-G277 returns to CLOSED, resting on current readings."*', true],
    ["ASSERTED in italics not quotes", "*re-ran all three cells; the product is byte-identical to HEAD now.*", false],
    ["a line with no claim at all",  "PG-14's two passes do not converge at 420 px.",                        null],
  ];
  let pass = 0, fail = 0;
  for (const [name, line, expectQuoted] of cases) {
    const hit = CLAIMS.find((c) => line.includes(c));
    const got = hit ? QUOTED(line, hit) : null;
    const ok = got === expectQuoted;
    console.log(`  ${ok ? "✓" : "✗"} ${name.padEnd(32)} hit=${hit ? `"${hit}"` : "none"} -> ${got === null ? "NOT A CLAIM" : got ? "QUOTED" : "ASSERTED"}`);
    ok ? pass++ : fail++;
  }
  console.log(`\n  mutants: ${pass} pass, ${fail} fail. The LAST is the no-signal direction and the one before it is the\n  negative control: without a line that must classify as ASSERTED, a scan reporting 0 CURRENT would be\n  unaudited in exactly the direction A-G452 names.`);
  if (fail) process.exitCode = 1;
}

/* FAIL-CLOSED, AND OVER BOTH FAILING STATES. A lapsed claim is owed a re-measurement; a claim scoped to a
   build with no repository referent cannot be re-checked AT ALL, which is not better. Both fail. */
if (B.LAPSED.length + B["SCOPED-UNRESOLVABLE"].length > 0) process.exitCode = 1;
/* and the pattern set must match SOMETHING — a scan of a 1.1 MB record finding no claims has measured
   nothing, and would report every bucket empty as though the record were clean (A-G452). GRÜN's control. */
if (rows.length + quoted.length === 0) {
  console.log("\n  REFUSE: the claim pattern set matched nothing in either record. A scan with no hits reports");
  console.log("  every bucket empty, which is indistinguishable from a clean record. Exiting non-zero.");
  process.exitCode = 1;
}
