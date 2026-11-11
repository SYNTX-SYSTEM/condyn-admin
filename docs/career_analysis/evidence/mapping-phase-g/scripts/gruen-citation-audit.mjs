/**
 * GRÜN · PHASE-G · §100 — A-G427 TURNED ON THIS LANE'S OWN RECORD.
 * **NO VERDICT** (A-G36 point 2). Pure arithmetic over committed files. No browser, no build, no server.
 *
 * GELB's citation verifier found 0 of 248 line-number citations in the two phase documents verifiable, and
 * A-G427 ruled that a citation names what a document CARRIES — a quoted sentence, a pin id, a section — with
 * a line number permitted to accompany it and never to replace it. I caught the instance that started it, in
 * their record. It would be the cheapest possible mistake to leave the rule pointing outward: my instrument
 * headers and README cite the product component by line — :111, :835, :953, :1081, :230 and others — and
 * **I EDIT THAT FILE.** §93 moved it by +7 lines net, so my own citations past that point are stale by my own
 * hand, in the same phase in which I reported theirs.
 *
 * AND THE FIRST COUNT I TOOK WAS WRONG IN MY OWN FAVOUR, which is the part worth keeping. A bare grep for
 * `:\d{2,4}` over my record returned 62 "citations" — and several are PORT NUMBERS from the README's port map
 * (:3017, :3020, :3120, :3121). An inflated denominator would have made my record look more careless than it
 * is, exactly as GELB's first verifier inflated theirs in the direction of a bigger finding. So the port class
 * is CLASSIFIED and reported here, never silently filtered: a number removed without a name is a number
 * nobody can audit.
 *
 * WHAT THIS CAN AND CANNOT CHECK. A citation whose target is named on the same line is resolvable. A citation
 * carrying only an offset is not weakly verifiable but UNVERIFIABLE, permanently, because the record does not
 * say what it was meant to name — GELB's sharpest sentence and it applies here unchanged. So this reports
 * verified, unverifiable, and WHY, and it never accuses: zero verified is a finding that needs no accusation.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { dirname, resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PROVENANCE } from "./gruen-provenance.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "../outputs");
const ROOT = resolve(here, "../../../../..");
const COMPONENT = "app/components/career/demo/PersonJobMappingField.tsx";

/* A-G408, and I committed its defect inside the instrument built to apply its sibling: the first form of
   this audit scanned its OWN source, whose header lists :111, :835, :953, :1081 and :230 as examples of the
   problem. Four of thirteen "citations into the component" were this file quoting itself. A DETECTOR THAT
   MATCHES ITS OWN SOURCE IS NOT A DETECTOR — GELB's sentence, which I quoted approvingly this morning. */
const SELF = "gruen-citation-audit.mjs";
const sources = [...readdirSync(here).filter(f => (f.endsWith(".mjs") || f.endsWith(".mts")) && f !== SELF).map(f => `scripts/${f}`), "README.md"];
const CITE = /:(\d{2,4})\b/g;
/* a number that is part of an address or introduced as a port is not a citation */
const isPort = (line, idx) => /127\.0\.0\.1$|localhost$|\/\/$/.test(line.slice(Math.max(0, idx - 12), idx)) || /\bport\b/i.test(line);
/* a citation CARRIES a subject if the same line names something the target holds */
const SUBJECT = /["'`][^"'`]{8,}["'`]|\bA-[GF]\d+\b|\bP[GF]-\d+\b|\bB-[FG]?\d+\b|\bE-\d+\b|§\s?\d+|\b[A-Za-z0-9_-]+\.(?:tsx?|mjs|mts|md|json)\b/;
/* the target is DETERMINABLE if the same line names a file or one of the two phase documents */
const TARGET_FILE = /\b([A-Za-z0-9_./-]+\.(?:tsx?|mjs|mts|json))\b/;
const PHASE_DOC = /PHASE_[A-G]\b|PERSON_X_JOB_MAPPING_PHASE_[A-G]/;

const rows = [];
for (const rel of sources) {
  const p = join(here, "..", rel.startsWith("scripts/") ? rel.slice(8) : rel);
  const path = rel.startsWith("scripts/") ? join(here, rel.slice(8)) : join(here, "..", rel);
  if (!existsSync(path)) continue;
  const lines = readFileSync(path, "utf8").split("\n");
  lines.forEach((line, i) => {
    for (const m of line.matchAll(CITE)) {
      const idx = m.index ?? 0;
      const cls = isPort(line, idx) ? "PORT_OR_ADDRESS"
        : TARGET_FILE.test(line) ? "TARGET_NAMED"
        : PHASE_DOC.test(line) ? "PHASE_DOC_NAMED"
        : "BARE_OFFSET";
      rows.push({ source: rel, sourceLine: i + 1, citedLine: Number(m[1]), classification: cls,
        carriesSubject: SUBJECT.test(line), context: line.trim().slice(0, 150) });
    }
  });
}

const byClass = rows.reduce((a, r) => { a[r.classification] = (a[r.classification] ?? 0) + 1; return a; }, {});
const citations = rows.filter(r => r.classification !== "PORT_OR_ADDRESS");
const withSubject = citations.filter(r => r.carriesSubject);
const bare = citations.filter(r => r.classification === "BARE_OFFSET" && !r.carriesSubject);

/* the one target present in this worktree AND edited by this lane: the product component */
const compLines = readFileSync(join(ROOT, COMPONENT), "utf8").split("\n");
const trivial = l => l === undefined || l.trim() === "" || /^[\s{}()*;/]*$/.test(l.trim());
const intoComponent = citations.filter(r => /PersonJobMappingField|component/i.test(r.context));
const componentChecked = intoComponent.map(r => ({
  ...r, targetLine: compLines[r.citedLine - 1]?.trim().slice(0, 110) ?? null,
  landsOnTrivialLine: trivial(compLines[r.citedLine - 1])
}));

const out = {
  reading: "GRÜN · §100 — A-G427 applied to this lane's own record: every line-number citation, classified",
  verdict: PROVENANCE.verdict,
  scope: "pure arithmetic over committed files in this evidence directory. No browser, no build, no server, nothing measured on a page.",
  rule: { origin: "GELB A-G427, from a defect I found in their record", statement: "a citation names what a document CARRIES — a quoted sentence, a pin id, a section — and a line number may accompany it but never replace it.", asymmetry: "a quoted sentence that moves is still findable; a line number that moves is silently wrong with nothing to signal it." },
  sourcesScanned: sources.length,
  selfExcluded: { file: SELF, why: "the first form of this audit scanned its own header, which lists example citations, and counted them as findings. A-G408." },
  classification: byClass,
  portsExcludedAndWhy: { count: byClass.PORT_OR_ADDRESS ?? 0, why: "a bare grep for :\\d{2,4} counts the README's port map (:3017, :3020, :3120, :3121) as citations. CLASSIFIED rather than filtered, because a number removed without a name is a number nobody can audit — and an inflated denominator would make this record look more careless than it is, which is the direction GELB's first verifier erred in too." },
  totals: {
    citations: citations.length,
    carryingASubjectOnTheSameLine: withSubject.length,
    bareOffsetWithNoSubject: bare.length,
    pctCarryingASubject: citations.length === 0 ? null : +(100 * withSubject.length / citations.length).toFixed(1)
  },
  intoTheProductComponent: {
    note: `the component is the one cited target this lane EDITS. §93 moved it by +7 lines net, so citations past that point are stale by my own hand.`,
    count: componentChecked.length,
    landingOnATrivialLine: componentChecked.filter(r => r.landsOnTrivialLine).length,
    rows: componentChecked
  },
  bareOffsets: bare.map(r => ({ source: r.source, sourceLine: r.sourceLine, citedLine: r.citedLine, context: r.context })),
  finding: null
};
out.finding =
`A-G427 ON MY OWN RECORD: ${citations.length} line-number citations across ${sources.length} scanned files (this audit's own source EXCLUDED — its first form counted its own header's examples, A-G408), after classifying ${byClass.PORT_OR_ADDRESS ?? 0} port/address numbers OUT — a bare grep counted those as citations and would have inflated my denominator in the direction that makes my record look worse, which is the same error GELB's first verifier made in the same direction.
${withSubject.length} of ${citations.length} (${(100 * withSubject.length / Math.max(1, citations.length)).toFixed(1)} %) carry a SUBJECT on the same line — a quoted sentence, a pin id, a section or a filename — so they survive A-G427 with the number as an accompaniment rather than as the citation. ${bare.length} carry an offset and nothing else, and those are unverifiable permanently, not weakly: the record does not say what they were meant to name.
INTO THE PRODUCT COMPONENT, the one cited target this lane EDITS: ${componentChecked.length} citations, of which ${componentChecked.filter(r => r.landsOnTrivialLine).length} now land on a blank or brace-only line. §93 shifted that file by +7 and I reported GELB's stale citations in the same phase.
NO VERDICT (A-G36 point 2): this counts and classifies. It accuses nobody, including me — zero verified would be a finding that needs no accusation.`;

writeFileSync(resolve(OUT, "citation-audit.json"), JSON.stringify(out, null, 1));
console.log(`classification: ${JSON.stringify(byClass)}`);
console.log(`citations (ports excluded): ${citations.length} · carrying a subject: ${withSubject.length} (${(100 * withSubject.length / Math.max(1, citations.length)).toFixed(1)} %) · bare offsets: ${bare.length}`);
console.log(`into the component: ${componentChecked.length}, landing on a trivial line: ${componentChecked.filter(r => r.landsOnTrivialLine).length}`);
for (const r of componentChecked) console.log(`   ${r.source}:${r.sourceLine} cites :${r.citedLine} -> ${r.landsOnTrivialLine ? "TRIVIAL/BLANK" : "has content"}  | ${r.targetLine ?? "(past end of file)"}`);
console.log(`\n${out.finding}`);
