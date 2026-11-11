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
rule();
