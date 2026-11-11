/**
 * GELB · §96 A-G427 — EVERY LINE-NUMBER CITATION IN THIS RECORD, RESOLVED AGAINST WHAT IS THERE NOW.
 *
 * GRÜN found the sharpest instance of this phase's recurring shape: the note this lane wrote to RULE
 * AGAINST line-number citations cites two line numbers that the same edit invalidated, four lines below
 * the rule, in one paragraph. The gap between a rule and its violation has been an hour (A-G422), four
 * sections (GRÜN's within-run spread) and three sections (PINK's rounding model). Here it is zero.
 *
 * So the remedy is not two edits. GRÜN's §98 resolves PF-13's exception list BY TITLE with two assertions
 * that throw — the title must be unique in its file, and it must resolve to the same it() the number did.
 * GRÜN's own words: *that form transfers to a prose document unchanged — name the sentence, not the
 * offset.* This instrument measures how far that has to go: every line-number citation in both decision
 * records, what it now points at, and which ones point at something that cannot be what was meant.
 *
 * IT CANNOT KNOW INTENT. What it can do is (1) count the exposure, (2) flag targets that are structurally
 * impossible as citation subjects — a blank line, a section heading, a table rule — and (3) where the
 * citing sentence QUOTES its target, check the quote is actually there. (3) is the only limb that can
 * prove a citation wrong rather than merely suspect; the others bound the problem.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DOCS = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const FILES = { PHASE_F: "PERSON_X_JOB_MAPPING_PHASE_F.md", PHASE_G: "PERSON_X_JOB_MAPPING_PHASE_G.md" };
const text = Object.fromEntries(Object.entries(FILES).map(([k, f]) => [k, readFileSync(join(DOCS, f), "utf8").split("\n")]));
const rule = () => console.log("=".repeat(104));
const trim = (s, n = 86) => (s ?? "").trim().replace(/\s+/g, " ").slice(0, n);

/** every citation of the form `:NNN`, `PHASE_F:NNN`, `PHASE_G:NNN` — with the file it appears in. */
function citations() {
  const out = [];
  for (const [where, lines] of Object.entries(text)) {
    lines.forEach((line, i) => {
      for (const m of line.matchAll(/`?(PHASE_[FG])?:(\d{2,5})`?/g)) {
        const target = m[1] ?? null;             // null => same file by convention
        /* a bare `:NNN` inside a backticked token naming another artifact (field-e:365, neurovisual-e:156)
           is a citation into CODE, not into this document — classified separately and not resolved here. */
        const before = line.slice(Math.max(0, m.index - 24), m.index);
        const intoCode = /[`\w][\w.-]*$/.test(before) && !/PHASE_[FG]$/.test(before);
        out.push({ where, line: i + 1, target: target ?? where, n: Number(m[2]), intoCode, src: line });
      }
    });
  }
  return out;
}

const all = citations();
const intoDocs = all.filter(c => !c.intoCode);
const intoCode = all.filter(c => c.intoCode);

rule();
console.log("GELB · §96 A-G427 — LINE-NUMBER CITATIONS, RESOLVED AGAINST THE CURRENT FILES");
rule();
console.log(`
  PHASE_F is ${text.PHASE_F.length} lines, PHASE_G is ${text.PHASE_G.length} lines.
  line-number citations found in total:        ${all.length}
    into one of these two documents:           ${intoDocs.length}   <- resolvable here
    into a code artifact (field-e:365, …):     ${intoCode.length}   <- a different target, not resolved here
`);

rule();
console.log("[1] WHAT EACH CITATION NOW POINTS AT — and a heading target is legitimate, not broken");
rule();
const classify = c => {
  const L = text[c.target]?.[c.n - 1];
  if (L === undefined) return { kind: "OUT OF RANGE", L: "" };
  const t = L.trim();
  if (t === "" || t === ">") return { kind: "BLANK", L };
  if (/^#{1,6}\s/.test(t) || /^>\s*#{1,6}\s/.test(t)) return { kind: "HEADING", L };
  if (/^\|[\s|:-]+\|$/.test(t)) return { kind: "TABLE RULE", L };
  if (/^-{3,}$/.test(t)) return { kind: "SECTION BREAK", L };
  return { kind: "CONTENT", L };
};
/* THE FIRST FORM OF THIS BLOCK COUNTED A HEADING AS IMPOSSIBLE AND REPORTED 83. That is wrong and the
   error inflated the finding: `PHASE_F:330` cites `PHASE_F:1095`, which IS A-F18's heading — citing an
   amendment by the line that names it is the most precise citation available, not a broken one. So
   HEADING is a legitimate target and only BLANK, TABLE RULE and OUT OF RANGE are impossible. Recorded
   because an instrument of mine produced an alarming number by misclassification, which is the shape
   this lane has ruled against four times today. */
const kinds = {};
for (const c of intoDocs) { const { kind, L } = classify(c); (kinds[kind] ??= []).push({ ...c, kind, L }); }
const IMPOSSIBLE = ["BLANK", "TABLE RULE", "OUT OF RANGE", "SECTION BREAK"];
const bad = IMPOSSIBLE.flatMap(k => kinds[k] ?? []);
console.log("");
for (const [k, v] of Object.entries(kinds).sort((a, b) => b[1].length - a[1].length)) {
  console.log(`  ${k.padEnd(14)} ${String(v.length).padStart(4)}   ${IMPOSSIBLE.includes(k) ? "<- IMPOSSIBLE as a citation subject" : k === "HEADING" ? "<- LEGITIMATE: cites a section or amendment by the line that names it" : "<- resolves to content; whether it is the RIGHT content is unknowable here"}`);
}
console.log("");
for (const b of bad.slice(0, 12)) console.log(`  ${b.kind.padEnd(13)} ${b.where}:${String(b.line).padEnd(6)} cites ${b.target}:${b.n}  ->  "${trim(b.L, 50)}"`);
if (bad.length > 12) console.log(`  … and ${bad.length - 12} more`);
console.log(`\n  *** ${bad.length} of ${intoDocs.length} document citations point at a BLANK LINE, a table rule or past the end of the file.`);
console.log(`  Every one of those is stale by construction: nothing was ever written there to cite. ***`);

rule();
console.log("[2] CAN A CITATION BE VERIFIED AT ALL? — the quote limb, which only verifies and never accuses");
rule();
console.log(`
  A citation can only be CHECKED if the citing sentence also carries its subject. So: where a quotation
  accompanies the number, is the quoted text at the cited line? This limb verifies and never accuses —
  a miss does not distinguish a stale number from a quote that was never about the target.
`);
const checked = [];
for (const c of intoDocs) {
  const window = [c.src, text[c.where][c.line] ?? ""].join(" ");
  const quotes = [...window.matchAll(/\*"([^"]{18,})"\*|"([^"]{18,})"/g)].map(m => (m[1] ?? m[2]).replace(/\*\*/g, "").replace(/`/g, "").trim());
  for (const q of quotes) {
    const needle = q.replace(/\s+/g, " ").slice(0, 40).toLowerCase();
    const at = (text[c.target][c.n - 1] ?? "").replace(/\s+/g, " ").toLowerCase();
    const next = (text[c.target][c.n] ?? "").replace(/\s+/g, " ").toLowerCase();
    const hit = at.includes(needle) || next.includes(needle);
    /* a stale CANDIDATE only: the quote is elsewhere in the target AND that elsewhere is not the citing
       sentence's own neighbourhood. Listed for a human to read, never counted as proven. */
    let elsewhere = null;
    if (!hit) {
      const idx = text[c.target].findIndex((l, i) => l.replace(/\s+/g, " ").toLowerCase().includes(needle) && !(c.target === c.where && Math.abs(i + 1 - c.line) <= 3));
      elsewhere = idx >= 0 ? idx + 1 : null;
    }
    checked.push({ ...c, q: needle, hit, elsewhere });
  }
}
const verified = checked.filter(c => c.hit);
const candidates = checked.filter(c => !c.hit && c.elsewhere !== null);
console.log(`  citations carrying a quotation:          ${checked.length}`);
console.log(`    VERIFIED — the quote is at the target:  ${verified.length}`);
console.log(`    UNVERIFIED:                            ${checked.length - verified.length}`);
console.log(`      of those, the quote sits elsewhere in the target file — STALE CANDIDATES: ${candidates.length}`);
console.log(`      (the rest quote a code file, paraphrase, or quote something not in the target at all)\n`);
for (const w of candidates.slice(0, 10)) {
  console.log(`  CANDIDATE  ${w.where}:${w.line} cites ${w.target}:${w.n} — quote also at ${w.target}:${w.elsewhere}`);
  console.log(`             "${trim(w.q, 64)}"`);
}
if (candidates.length > 10) console.log(`  … and ${candidates.length - 10} more candidates`);
console.log(`
  *** NO NUMBER HERE IS A COUNT OF STALE CITATIONS. *** ${verified.length} are verified; the rest are
  unverifiable by any means this instrument has, because the record does not say what they were meant
  to name. That is the finding and it is the argument for A-G427: a citation that carries its subject
  can be checked, and a citation that carries only an offset cannot be checked by anyone, ever.`);

rule();
console.log("[3] WHAT THIS BOUNDS, AND WHAT IT DOES NOT");
rule();
console.log(`
  *** OF ${intoDocs.length} LINE-NUMBER CITATIONS INTO THESE TWO DOCUMENTS, ${verified.length} CAN BE VERIFIED. ***

  That is the finding, and it is sharper than any count of stale ones would have been. ${bad.length} point at a
  blank line or a table rule and are stale by construction — nothing was ever written there to cite. Of
  the remaining ${intoDocs.length - bad.length}, ${candidates.length} carry a quotation that sits somewhere else in the target file and are
  candidates for a human to read. *** THE REST CANNOT BE CHECKED BY ANY MEANS THIS INSTRUMENT OR ANY
  OTHER HAS, because the record does not say what they were meant to name. *** A citation that carries
  only an offset is not weakly verifiable. It is UNVERIFIABLE, permanently, by anyone.

  RULED, A-G427: a citation into a document names what the document CARRIES — a quoted sentence, a pin
  id, an amendment id, a section number — and a line number may ACCOMPANY it but never replace it.
  GRÜN's §98 form transferred to prose: name the sentence, not the offset. The asymmetry is the whole
  argument: *** a quoted sentence that moves is still findable; a line number that moves is silently
  wrong, with nothing in the citation to signal it. *** And the 18 HEADING targets show the cheap fix is
  already in use here — citing an amendment by the line that names it survives an edit above it only by
  luck, but citing it by its ID survives everything.

  TWO DEFECTS IN THIS INSTRUMENT'S OWN FIRST FORM, both of which inflated a finding, both recorded
  rather than quietly fixed:
    1. it counted a HEADING target as impossible and reported ${bad.length + (kinds.HEADING ?? []).length} impossible citations. Citing A-F18 by
       the line that reads "### A-F18 · …" is the most precise citation available, not a broken one.
    2. its quote limb searched the whole target file and reported the FIRST occurrence — which is very
       often the CITING line itself, because the citing sentence contains the quote it just wrote. It
       reported 53 citations "PROVEN stale" on that basis. *** A check that locates a quote in the
       sentence quoting it has measured nothing, and it produced the largest number in the output. ***

  AND THE SHAPE THIS CAME FROM, recorded because the gap was zero: the note ruling against line-number
  citations cited two line numbers its own edit had invalidated, four lines below the rule. A-G422 was
  an hour after its rule; GRÜN's within-run spread four sections; PINK's rounding model three sections.
  *** A RULE AND ITS VIOLATION IN ONE PARAGRAPH IS NOT A WORSE FAILURE OF ATTENTION — IT IS EVIDENCE
  THAT WRITING THE RULE IS THE RISK CONDITION, because the writing is where the attention goes. ***
`);
/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log("[4] THE HARDER TARGET — citations into a file that CHANGES, and whether a build is named");
rule();
console.log(`
  GRÜN audited its own record on its own criterion ("does the citation carry a subject") and declined to
  compare its 80.2 % to this lane's 0 of 248, because the questions differ — and then said the thing worth
  acting on: *your verifier would be the thing to run against it, not mine.* So this limb runs this lane's
  criterion on the target where it bites hardest, against THIS lane's own prose: a citation into the
  drawing surface, a file that has changed 41 times between the builds this record quotes.

  A citation into a mutable source file is resolvable ONLY against a named build. So the question is not
  "is the number right" but "is there anything here that could make it right or wrong at all".
`);
const SHA_RE = /\b[0-9a-f]{8}\b/;
const bare = intoDocs.filter(c => c.target === c.where && !/PHASE_[FG]/.test(c.src.slice(Math.max(0, c.src.indexOf(`:${c.n}`) - 12), c.src.indexOf(`:${c.n}`))));
/* a citation is "component-shaped" when its own line talks about the drawing surface or its constants */
const COMPONENT_HINT = /PersonJobMappingField|drawing surface|the component|mf-wave|WAVE\.|VOLUME\.|RING_LUMINANCE|GROUND|TRAVEL\.|MOTION\.|\.mf-|keyframe|stopColor|SEAT|shelfNear|haloNear/;
const compCites = intoDocs.filter(c => COMPONENT_HINT.test(c.src));
let withBuild = 0, withoutBuild = 0;
const examples = [];
for (const c of compCites) {
  const win = [text[c.where][c.line - 2], text[c.where][c.line - 1], text[c.where][c.line], text[c.where][c.line + 1], text[c.where][c.line + 2]].join(" ");
  const sha = (win.match(SHA_RE) || [null])[0];
  if (sha) withBuild++; else { withoutBuild++; if (examples.length < 8) examples.push(c); }
}
console.log(`  citations whose own line is about the drawing surface: ${compCites.length}`);
console.log(`    a build SHA appears within 2 lines:                  ${withBuild}`);
console.log(`    NO build named within 2 lines:                       ${withoutBuild}\n`);
for (const e of examples) console.log(`  NO BUILD  ${e.where}:${e.line}  cites :${e.n}  —  "${trim(e.src, 72)}"`);
console.log(`
  *** ${withoutBuild} of ${compCites.length} citations about the drawing surface name no build within two lines. ***
  A line number into a file that changed 41 times across the builds this record quotes is not a weak
  citation without its build; it is a citation to nothing in particular. And the asymmetry with this
  lane's INSTRUMENTS is the uncomfortable part: every instrument that reads the product pins its SHA in
  code, because an unpinned read would not run. *** THE PROSE HAS NO SUCH FORCING FUNCTION, SO THE PROSE
  IS WHERE THE UNPINNED CITATIONS ARE. *** An instrument cannot cite sloppily and still execute; a
  paragraph can.

  A-G427 EXTENDED: a citation into a file that changes names its BUILD as well as its subject. The build
  is not provenance decoration — without it the citation has no referent at all.
`);

/* ────────────────────────────────────────────────────────────────────────────────────────────────── */
rule();
console.log("[5] A-G429 — FOUR INSTRUMENT ERRORS, TWO LANES, NO CONTACT, ONE DIRECTION");
rule();
console.log(`
  GRÜN audited its own citations today and its auditor's first form made two errors; this verifier's
  first form made two. Independent instruments, different languages of thought, no contact between them:

    GELB   counted a HEADING target as impossible                 65 -> 83 impossible
    GELB   quote limb matched the quote in its own citing sentence  0 -> 53 "proven stale"
    GRÜN   counted the README's PORT MAP as citations              56 -> 62 citations
    GRÜN   scanned its own source, finding its header's examples   component count inflated

  *** ALL FOUR RAN IN THE DIRECTION THAT MADE THE RECORD LOOK WORSE. ***

  RULED, A-G429, and it is GRÜN's, including the mechanism: *a false positive looks like SUCCESS to
  whoever built the detector, so nothing in the build loop pushes back on it. A detector's own errors
  are selected for by what its author is hoping to find.*

  THIS IS NOT A BIAS TOWARD PESSIMISM. It is a selection effect with a named mechanism: when a detector
  fires, its author reads the firing as the instrument working, and only a firing that is obviously
  absurd gets audited. A detector that under-reports is silent, and silence prompts no review at all.
  So the errors that survive a build loop are the ones that inflate.

  THE REMEDY IS THE PRACTICE BOTH LANES ALREADY CONVERGED ON, and A-G429's value is that it says WHY:
    1. CLASSIFY rather than filter — a number removed without a name is a number nobody can audit
       (GRÜN's ports, and this lane's first verifier had the same shape);
    2. EXCLUDE THE INSTRUMENT'S OWN SOURCE — a scanner that finds its own header's examples is A-G408;
    3. AUDIT THE ALARMING NUMBER BEFORE SENDING IT, specifically because it is alarming — the opposite
       of the instinct, which is to audit the number that looks too good.
  *** THE THIRD IS THE ONE NEITHER LANE HAD WRITTEN DOWN, and it is the one that would have caught all
  four. ***
`);
rule();
rule();
