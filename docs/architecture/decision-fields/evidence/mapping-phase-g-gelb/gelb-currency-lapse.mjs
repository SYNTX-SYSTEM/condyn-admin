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
  /* ADDED IN §134 BY A RECALL PROBE, AND THIS IS THE FIRST CORRECTION TO THIS INSTRUMENT THAT CAN MOVE THE
     COUNT UPWARD. GRÜN: both lanes' "hidden by the exclusion set" numbers are FLOORS, and the number neither
     lane can print is how many claims the PATTERN SET never matched at all. So I probed for present-tense
     status language outside the set and read every match (A-G450) rather than counting them: three, and all
     three are genuine claims — `"counterTick ⟹ splay" still passes` (:1280), `A-G33 still stands` (:3141),
     `it currently holds exactly` (:8161). The first is about the very predicate §104 replaced. */
  "still passes", "still stands", "still holds", "still clears", "still green",
  "currently holds", "remains closed", "unchanged since", "has not moved since", "holds today",
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
/* GRÜN'S §118 FALSIFICATION, APPLIED HERE. It ran its scan with the character-inferred spans removed and
   the declared markers only: 6 matched / 0 LAPSED became 10 matched / 2 LAPSED. The character test had been
   blanking 6 569 characters — ~15 % of its record — and four claim lines with them, one genuinely lapsed.
   *** AND THE DIRECTION IS THE FINDING: MY FOUR FORMS OVER-REPORTED, WHICH IS THE ALARMING DIRECTION, WHICH
   GETS AUDITED, WHICH IS WHY I CAUGHT THEM. GRÜN'S UNDER-REPORTED, WHICH IS THE FLATTERING DIRECTION, AND
   NOTHING AUDITS THAT. *** A-G474's own rule says a character-inferred test re-derives wrongly what the
   document declares, so --declared-only drops it and keeps the markup-level tests (a fence, a table row). */
/* DECLARED-ONLY IS NOW THE DEFAULT, and the consequence is ACCEPTED rather than engineered around: a
   peer's sentence quoted without a marker counts as my own claim. Over-reporting is the direction a reader
   audits, and the remedy for a false hit is a MARKER, not a cleverer pattern. GRÜN made the same choice on
   the same reasoning. --infer-spans restores the character test, for the comparison only. */
const DECLARED_ONLY = !process.argv.includes("--infer-spans");
const QUOTED = (line, phrase) => {
  const i = line.indexOf(phrase);
  if (i < 0) return false;
  if (/^\s*\|/.test(line)) return true;                 // a table row — DECLARED by the markup
  if (DECLARED_ONLY) return false;
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

/* ───────── GRÜN'S §120 DEFECT 4, THE ONE IT TOLD ME TO CHECK FIRST: A CLAIM IS A SENTENCE, NOT A LINE ─────────
   My records are hard-wrapped and this scan was per-line, so any claim split by a wrap was invisible. Measured
   before fixing: 4 occurrences in PHASE_G are visible only when unwrapped. *** AND ALL FOUR BELONG TO CLAIMS
   THE PER-LINE SCAN ALREADY CAUGHT VIA A DIFFERENT PHRASE ON ONE OF THE TWO LINES, SO 0 DISTINCT CLAIMS WERE
   HIDDEN — AND THAT ZERO IS LUCK, NOT DESIGN. *** It holds only because the phrase set is dense enough that a
   long claim usually has one phrase landing wholly inside a line; it would not survive a sparser set or a
   different wrap. A-G464 for the fifth time this phase.
   So paragraphs are joined and an OFFSET→LINE map is carried, because GRÜN's defect 5 was the attribution
   going backwards — a line credited with the next line's claim and LAPSED at a commit eleven hours before the
   claim existed. A match's start offset names its line; nothing is credited to a neighbour.
   STATED LIMIT, not fixed: a claim spanning THREE lines whose middle line carries no phrase fragment is still
   found, since the whole paragraph is joined — but sentence SPLITTING is not attempted at all. Prose carrying
   §, ·, decimals and abbreviations is its own detector with its own defects, and GRÜN declined it for that
   reason. The paragraph is the unit here, which is coarser than a sentence and never finer than a line. */
const paragraphsOf = (lines) => {
  const out = []; let cur = []; let inFence = false;
  const flush = () => { if (cur.length) out.push(cur); cur = []; };
  lines.forEach((l, i) => {
    if (/^\s*```/.test(l)) { flush(); inFence = !inFence; return; }
    if (/^[>\s]*$/.test(l)) { flush(); return; }
    cur.push({ text: l, ln: i + 1, fenced: inFence });
  });
  flush();
  return out.map((rows) => {
    let joined = ""; const owner = [];
    rows.forEach((row, k) => {
      const t = row.text.replace(/^\s*>\s?/, "").trimEnd();
      if (k) { joined += " "; owner.push(row.ln); }
      joined += t;
      for (let c = 0; c < t.length; c++) owner.push(row.ln);
    });
    return { joined, owner, rows, byLine: Object.fromEntries(rows.map((r) => [r.ln, r])) };
  });
};

const rows = [], quoted = [];
for (const file of [PHASE_G, PHASE_F]) {
  const lines = readLines(file);
  const short = rel(file).split("/").pop().replace("PERSON_X_JOB_MAPPING_", "");
  const builds = {};                                    // one resolve-check per paragraph, cached
  for (const para of paragraphsOf(lines)) {
    /* COLLECT EVERY MATCH AS A SPAN, THEN DROP ANY SPAN CONTAINED IN ANOTHER. The pattern set has
       overlapping phrases — "resting on current readings" CONTAINS "on current readings" — and the previous
       per-line loop used CLAIMS.find(), which silently took only the first match per line and so never
       exposed the overlap. Replacing it with "every occurrence" took the asserted count 15 -> 26, and the
       extra 11 were the SAME claims counted once per contained substring. *** A COUNT THAT RISES WHEN A
       SCAN STOPS DISCARDING MATCHES IS NOT A FINDING UNTIL THE MATCHES ARE SHOWN TO BE DISTINCT. ***
       Over-reporting, so it is the direction a reader audits — and still wrong. */
    const hits = [];
    for (const c of CLAIMS) {
      let from = 0, i;
      while ((i = para.joined.indexOf(c, from)) !== -1) { hits.push({ i, end: i + c.length, c }); from = i + 1; }
    }
    const kept = hits.filter((h) => !hits.some((o) => o !== h && o.i <= h.i && o.end >= h.end && (o.end - o.i) > (h.end - h.i)));
    {
      for (const { i, c } of kept) {
        const ln = para.owner[i];                        // the line the phrase STARTS on — never a neighbour
        const row = para.byLine[ln];
        if (row.fenced) { quoted.push({ file: short, ln, phrase: c, why: "in a fenced block" }); continue; }
        if (QUOTED(row.text, c) || /^\s*\|/.test(row.text)) {
          quoted.push({ file: short, ln, phrase: c, why: "quoted span / table row" }); continue;
        }
        if (!(para.joined in builds)) builds[para.joined] = buildsIn(para.joined);
        rows.push({
          file: short, ln, phrase: c, text: row.text.trim(),
          subject: subjectOf(para.joined), liveness: LIVENESS.test(para.joined), para: para.joined.slice(0, 120),
          builds: builds[para.joined], intro: introducedBy(rel(file), row.text),
        });
      }
    }
  }
}

/** is this line already in HEAD? distinguishes "undatable" from "not committed yet".
 *  THE FULL LINE, NOT A PREFIX: the first form compared text.slice(0, 60), so a line EDITED in place whose
 *  opening 60 characters were unchanged read as "already in HEAD" and landed in UNDATABLE instead of
 *  UNCOMMITTED — GRÜN's §117b shape, the right hazard named and the wrong quantity checked. */
const headCache = {};
const inHead = (shortName, text) => {
  const path = shortName.includes("PHASE_F") ? rel(PHASE_F) : rel(PHASE_G);
  if (!(path in headCache)) { try { headCache[path] = git(REPO_ROOT, "show", `HEAD:${path}`); } catch { headCache[path] = ""; } }
  return headCache[path].includes(text);
};
/* REVIEWED EXCLUSIONS — NAMED, NOT FILTERED. The §134 recall probe widened the pattern set and LAPSED went
   2 -> 6, the first upward move this instrument had made. Reading all four new rows found ONE FALSE POSITIVE:
   PHASE_G:1280's "still passes" sits inside a HYPOTHETICAL — "…while a test asserting 'counterTick ⟹ splay'
   still passes" — a vacuity argument, not an assertion that anything currently passes. *** I HAD JUST
   DECLARED ALL THREE PROBE HITS GENUINE AFTER READING THEM, SO READING THE MATCHED LINE WAS NOT ENOUGH: THE
   SENTENCE HAD TO BE READ FOR WHAT IT DOES, NOT ONLY FOR WHAT IT SAYS. *** A-G450 one level in.
   Excluded HERE, BY NAME, AND STILL PRINTED, because a number removed without a name cannot be audited
   (A-G429 remedy 1) — and NOT given a bucket, because a convention earned by one instance is a convention
   invented for none (GRÜN's §119). Both figures are reported. */
const REVIEWED = {
  "PHASE_G.md:1280": "hypothetical — 'a test asserting X still passes' inside a vacuity argument, not a status claim",
};
const B = { LAPSED: [], CURRENT: [], SCOPED: [], "SCOPED-UNRESOLVABLE": [], UNDATABLE: [], UNCOMMITTED: [] };
for (const r of rows) {
  if (r.liveness) { r.state = "UNDATABLE"; }
  else if (!r.intro) {
    /* GRÜN'S §118, WHICH BROKE ITS INSTRUMENT WITHIN FOUR MINUTES OF WRITING THE SECTION: `git log -S`
       cannot date a line that is not committed yet, so a section being WRITTEN reports UNDATED debts against
       itself. *** AN UNCOMMITTED LINE IS DATED NOW BY CONSTRUCTION AND CANNOT BE STALE; TREATING "NOT YET
       COMMITTED" AS "NOT DATED" REPORTS A DEBT AGAINST SOMETHING NO CHANGE HAS HAD THE CHANCE TO
       INVALIDATE. *** Distinguished by asking whether the line exists in HEAD at all. */
    r.state = inHead(r.file, r.text) ? "UNDATABLE" : "UNCOMMITTED";
  }
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
                "SCOPED-UNRESOLVABLE": "SCOPED-NOREF", UNDATABLE: "UNDATABLE   ",
                UNCOMMITTED: "UNCOMMITTED " }[r.state];
  console.log(`  ${tag} ${r.file}:${String(r.ln).padStart(5)}  subj=${r.subject.padEnd(11)} ` +
    `${r.intro ? `${r.intro.sha} ${r.intro.date}` : "  not locatable "}  vs ${TIPS[r.subject].sha}  "${r.phrase}"`);
  if (r.builds.length) console.log(`               builds named in its paragraph: ${r.builds.map((b) => `${b.tok}${b.resolves ? "" : " (NO REPOSITORY REFERENT)"}`).join(", ")}`);
  console.log(`               ${r.text.slice(0, 94)}`);
}

const lapsed = B.LAPSED.length;
console.log(`\n${bar}\n[2] WHAT THIS BOUNDS\n${bar}\n`);
/* *** THIS ROW MODEL HAS COUNTED PHRASE OCCURRENCES AND CALLED THEM "CLAIMS" SINCE §131. *** One sentence
   carrying two phrases from the set ("returns to CLOSED" and "resting on current readings") has always
   produced two rows, and paragraph-joining made that visible by finding more phrases per claim: 15 -> 23.
   A mislabel inflates nothing, but it makes a figure mean something other than what its name says — which is
   the whole of A-G437's quantifier axis. BOTH are reported, and the distinct figure is the one to quote. */
const distinct = new Set(rows.map((r) => `${r.file}|${r.para}`)).size;
console.log(`  phrase occurrences ASSERTED:        ${rows.length}`);
console.log(`  DISTINCT CLAIMS (one per paragraph): ${distinct}   <- the figure to quote`);
console.log(`  quotations of a claim, excluded and counted: ${quoted.length}  <- §129/§130 ruling against them`);
for (const q of quoted) console.log(`      quoted   ${q.file.split("/").pop()}:${String(q.ln).padStart(5)}  ${(q.why ?? "").padEnd(24)} "${q.phrase}"`);
console.log(``);
/* BUCKETS AT BOTH GRANULARITIES. The phrase figure is what the rows show; the CLAIM figure is what the
   record actually asserts. *** AND THE CLAIM FIGURE IS SMALLER, WHICH MAKES THIS THE SIXTH CORRECTION IN A
   ROW TO MOVE A COUNT DOWNWARD — A-G475's direction, flagged here rather than left for a reader to notice,
   because the defensible reason for each reduction is exactly what makes the trend invisible. *** The one
   correction this session that went UP was the recall probe, and it cost a false positive immediately. */
const claimsIn = (k) => new Set(B[k].map((r) => `${r.file}|${r.para}`)).size;
console.log(`    ${"bucket".padEnd(21)} ${"phrases".padStart(8)} ${"CLAIMS".padStart(7)}`);
for (const k of ["LAPSED", "CURRENT", "SCOPED", "SCOPED-UNRESOLVABLE", "UNDATABLE", "UNCOMMITTED"])
  console.log(`    ${k.padEnd(21)} ${String(B[k].length).padStart(8)} ${String(claimsIn(k)).padStart(7)}`);
const reviewedOut = B.LAPSED.filter((r) => REVIEWED[`${r.file}:${r.ln}`]);
if (reviewedOut.length) {
  console.log(`\n  REVIEWED EXCLUSIONS — named, still printed above, not filtered and not bucketed:`);
  for (const r of reviewedOut) console.log(`      ${r.file}:${r.ln}  ${REVIEWED[`${r.file}:${r.ln}`]}`);
  console.log(`\n  *** LAPSED READS ${lapsed}; THE DEFENSIBLE FIGURE IS ${lapsed - reviewedOut.length}. BOTH ARE REPORTED. ***`);
}
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
console.log(`\n${bar}\n[2b] WHAT THE EXCLUSION SET COSTS — GRÜN's §118 line, printed every run\n${bar}\n`);
console.log(`  CLAIM LINES HIDDEN BY THE EXCLUSION SET: ${quoted.length}`);
for (const q of quoted) console.log(`      ${(q.why ?? "").padEnd(24)} ${q.file.split("/").pop()}:${q.ln}`);
console.log(`\n  *** EVERY CORRECTION TO THIS SCAN HAS MOVED ITS COUNT THE SAME WAY: 8 -> 2. GRÜN'S WENT 3 -> 1 -> 0.`);
console.log(`  EACH STEP INDIVIDUALLY CORRECT, EACH DEFENSIBLE ON ITS OWN EVIDENCE, EVERY ONE TOWARD FEWER`);
console.log(`  FINDINGS. *** A-G462 says a conclusion AGAINST yourself gets no audit because it feels like`);
console.log(`  rigour; the symmetric case is a REFINEMENT THAT ABSOLVES, which feels like precision — and there`);
console.log(`  is no step to object to. So the cost of excluding anything is printed here in every run: a 0`);
console.log(`  would mean the exclusions do nothing, and a number that GROWS without a section explaining it`);
console.log(`  is the flattering direction arriving unannounced. GRÜN's line, adopted (A-G475).`);
console.log(`\n  Run with --declared-only to drop the CHARACTER-INFERRED span test and keep only what the markup`);
console.log(`  declares. A-G474's own rule demands that comparison be available, not argued.`);
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
/* THESE TWO WERE SILENTLY DELETED BY AN EDIT AND NO RUN REVEALED IT, because the only branch using them
   (!r.intro) is unreachable in the current data — so UNCOMMITTED read 0 by CRASH-ON-USE rather than by
   measurement, and a definition-diff against a backup caught it, not the instrument. *** A FUNCTION WHOSE
   ONLY CALLER IS UNREACHABLE IS INDISTINGUISHABLE FROM A FUNCTION THAT DOES NOT EXIST. *** GRÜN's in-process
   control, which needs no mutation and therefore no revert: exercise them directly, and refuse if either the
   positive or the negative direction is unreachable. */
{
  const posIn  = inHead("PHASE_G.md", "## §89");
  const negIn  = inHead("PHASE_G.md", "a line that was never written anywhere in this record at all");
  const ok = posIn === true && negIn === false;
  console.log(`\n${bar}\n[2c] inHead() CONTROL — the branch that uses it is unreachable in this data\n${bar}\n`);
  console.log(`  in HEAD, text that is present:  ${posIn}   (must be true)`);
  console.log(`  in HEAD, text that is absent:   ${negIn}   (must be false)`);
  console.log(`  ${ok ? "both directions reachable" : "*** REFUSING: inHead is not discriminating ***"}`);
  if (!ok) process.exitCode = 1;
}

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
