/* Loopback Gemini stand-in for the END-TO-END VIDEO READINESS lab (owner "SFE — GELB | END-TO-END VIDEO READINESS", 2026-10-19).
 * NOT Gemini and never presented as Gemini: a deterministic replay that lets the real worker run its real three request kinds
 * (Discovery, Convergence, the legacy analysis) over GOOGLE_GEMINI_BASE_URL on 127.0.0.1, so the browser walk can be verified
 * without a live Gemini call. Its answers come only from the documents it is sent: for every term of TERMS that occurs in a
 * document, one capability whose evidence quote is the document's own line containing it (verbatim, so the evidence validator
 * accepts it), plus one invented claim with a quote that is in no document (the validator must reject it). Records kind, path and
 * whether an INVESTIGATION_SCOPE block was present (never content). */
import { createServer, type Server } from "node:http";

/** Capability name → the term searched in the document text (first line containing it, case-sensitive unless noted). */
const TERMS: Array<{ name: string; term: RegExp; domain: string }> = [
  { name: "TypeScript", term: /TypeScript/, domain: "Software Engineering" },
  { name: "React", term: /React/, domain: "Software Engineering" },
  { name: "Node.js", term: /Node\.js/, domain: "Software Engineering" },
  { name: "PostgreSQL", term: /PostgreSQL/, domain: "Data" },
  { name: "Automated Testing", term: /automated testing/i, domain: "Software Engineering" },
  { name: "Apache Kafka", term: /Apache Kafka/, domain: "Data" },
  { name: "Docker", term: /Docker/, domain: "Delivery" },
  { name: "CI/CD", term: /CI\/CD/, domain: "Delivery" },
  { name: "Python", term: /Python/, domain: "Software Engineering" },
  { name: "Kubernetes", term: /Kubernetes/, domain: "Delivery" },
  { name: "Team Leadership", term: /Led a team/, domain: "Leadership" },
  { name: "English", term: /English/, domain: "Language" }
];

interface Doc { id: string; body: string }
const lineWith = (body: string, term: RegExp): string | null => {
  for (const raw of body.split(/\r?\n/)) { const line = raw.trim(); if (line.length >= 6 && term.test(line)) return line; }
  return null;
};
const found = (docs: Doc[]) => TERMS.flatMap(entry => {
  for (const doc of docs) { const quote = lineWith(doc.body, entry.term); if (quote) return [{ ...entry, doc: doc.id, quote }]; }
  return [];
});

const audit = (count: number, docs: number) => ({ source_documents_examined: docs, capability_count: count, atomic_capability_count: count, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 });

function textOf(body: any): string {
  const contents = body?.contents;
  const parts = Array.isArray(contents) ? contents.flatMap((c: any) => typeof c === "string" ? [c] : Array.isArray(c?.parts) ? c.parts.map((p: any) => p?.text ?? "") : []) : typeof contents === "string" ? [contents] : [];
  const system = body?.systemInstruction?.parts?.map((p: any) => p?.text ?? "").join("\n") ?? "";
  return `${system}\n${parts.join("\n")}`;
}

function discovery(text: string): string {
  const kernel = /"kernel_version" MUST equal exactly "([^"]+)"/.exec(text)?.[1] ?? "discovery-v1";
  const docs: Doc[] = [...text.matchAll(/<SOURCE_DOCUMENT>\nDOC_ID: ([^\n]+)\n([\s\S]*?)<\/SOURCE_DOCUMENT>/g)].map(m => ({ id: m[1], body: m[2] }));
  const capabilities: any[] = found(docs).map(item => ({ canonical_name: item.name, capability_scope: "ATOMIC", structural_definition: `${item.name} as demonstrated in the source.`, primary_domain: item.domain, demonstrated_capability_level: null, model_confidence: 0.86, evidence_mode: "EXPLICIT", evidence: [{ source_document: item.doc, location: "body", exact_quote: item.quote }] }));
  if (docs.length > 0) capabilities.push({ canonical_name: "Quantum Annealing", capability_scope: "ATOMIC", structural_definition: "Invented by the stand-in to show a rejected claim.", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.4, evidence_mode: "EXPLICIT", evidence: [{ source_document: docs[0].id, location: "body", exact_quote: "Designed quantum annealing schedules for logistics." }] });
  return `${JSON.stringify({ coverage_audit: audit(capabilities.length, docs.length), capabilities, kernel_version: kernel }, null, "\t").replaceAll("\n", "\r\n")}\r\n`;
}

function convergence(text: string): string {
  const version = /"convergence_version" MUST equal exactly "([^"]+)"/.exec(text)?.[1] ?? "convergence-v1";
  const start = text.indexOf("[", text.indexOf("ELIGIBLE_CANDIDATE_COUNT"));
  const candidates = JSON.parse(text.slice(start, text.lastIndexOf("]") + 1)) as Array<{ candidate_id: string; canonical_name: string; capability_scope: "ATOMIC" | "COMPOSITE"; structural_definition: string; primary_domain: string | null }>;
  const groups = candidates.map((candidate, index) => ({ group_key: `g${index + 1}`, member_candidate_ids: [candidate.candidate_id], canonical_name: candidate.canonical_name, capability_scope: candidate.capability_scope, structural_definition: candidate.structural_definition, primary_domain: candidate.primary_domain }));
  return JSON.stringify({ convergence_version: version, groups, relations: [], reconciliation_audit: { input_candidate_count: candidates.length, grouped_candidate_count: candidates.length, group_count: groups.length, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } });
}

/** The legacy Career Analysis (PC-CONDYN-CAP-v1.0): CAPABILITY entities only, each with the document's own line as context quote. */
function legacy(text: string): string {
  const docs: Doc[] = [...text.matchAll(/--- DOCUMENT METADATA \(ID: (DOC_[A-Z0-9_]+), Title: [^\n]*\) ---\n([\s\S]*?)(?=\n--- DOCUMENT METADATA \(ID: |\n====================)/g)].map(m => ({ id: m[1], body: m[2] }));
  const items = found(docs);
  const entities = items.map((item, index) => ({ entity_id: `CAP_${String(index + 1).padStart(3, "0")}`, properties: { category: "CORE_TECHNICAL", seniority_level: "ADVANCED" }, relationships: [], evidence: [{ doc_id: item.doc, location: "body", context_quote: item.quote, evidence_score: 0.82, significance_explanation: `The source names ${item.name} in the candidate's own work.` }], confidence: 0.84, entity_kind: "CAPABILITY", name: item.name }));
  const docIds = docs.map(doc => doc.id);
  return JSON.stringify({ report_markdown: "# Career Analysis Report (deterministic stand-in, not Gemini)\n\nCapabilities named in the source documents, each with a verbatim quote.", consistency: { overall_cohesion_score: 0.9, summary: "Stand-in: one coherent source.", clusters: [{ cluster_id: "CLU_001", name: "Source corpus", cohesion_score: 0.9, doc_ids: docIds }], outlier_doc_ids: [], contradictions: [] }, entities });
}

export interface StandInRecord { at: string; path: string; kind: "DISCOVERY" | "CONVERGENCE" | "LEGACY" | "OTHER"; scopeBlock: boolean; status: number; capabilities?: number }
export function startVideoStandIn(onRecord: (record: StandInRecord) => void): Promise<{ server: Server; port: number }> {
  let n = 0;
  const server = createServer(async (request, response) => {
    let raw = ""; for await (const chunk of request) raw += String(chunk);
    const path = (request.url ?? "").split("?")[0];
    let body: any = null; try { body = JSON.parse(raw); } catch { /* not JSON */ }
    const text = textOf(body);
    const kind: StandInRecord["kind"] = text.includes("CONDYN CAPABILITY DISCOVERY SOURCE CORPUS") ? "DISCOVERY" : text.includes("CONDYN CAPABILITY CONVERGENCE INPUT") ? "CONVERGENCE" : text.includes("PC-CONDYN-CAP-v1.0") ? "LEGACY" : "OTHER";
    const reply = (status: number, payload: unknown, capabilities?: number) => { onRecord({ at: new Date().toISOString(), path, kind, scopeBlock: text.includes("<INVESTIGATION_SCOPE>"), status, capabilities }); response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(payload)); };
    if (/:countTokens$/.test(path)) return reply(200, { totalTokens: Math.ceil(raw.length / 4) });
    if (kind === "OTHER") return reply(400, { error: { code: 400, message: "video stand-in: unsupported request", status: "INVALID_ARGUMENT" } });
    n += 1;
    let out: string;
    try { out = kind === "DISCOVERY" ? discovery(text) : kind === "CONVERGENCE" ? convergence(text) : legacy(text); } catch (error) { return reply(500, { error: { code: 500, message: `stand-in: ${String(error).slice(0, 120)}`, status: "INTERNAL" } }); }
    const count = (out.match(/"canonical_name"|"entity_kind"/g) ?? []).length;
    reply(200, { candidates: [{ content: { role: "model", parts: [{ text: out }] }, finishReason: "STOP" }], modelVersion: "video-standin-001", responseId: `video-${kind.toLowerCase()}-${n}`, usageMetadata: { promptTokenCount: Math.ceil(raw.length / 4), candidatesTokenCount: Math.ceil(out.length / 4) } }, count);
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ server, port: (server.address() as { port: number }).port })));
}
