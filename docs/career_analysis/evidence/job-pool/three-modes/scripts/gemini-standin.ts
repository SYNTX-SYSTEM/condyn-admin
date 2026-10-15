/* Loopback Gemini stand-in for GRÜN's three-mode lab (no live Gemini): answers the real worker's three Gemini request kinds over
 * GOOGLE_GEMINI_BASE_URL on 127.0.0.1 — Discovery (capabilities quoted verbatim from the SOURCE_DOCUMENTs it was sent, plus one invented
 * claim the evidence validator must reject), Convergence (one group per candidate) and the legacy analysis (the gold case). Every
 * request is recorded by kind, path and whether it carried an INVESTIGATION_SCOPE block (never its content). */
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";

const W = "/home/codi/Entwicklung/condyn-admin-job-field";
const PHRASES: Array<{ name: string; quote: string; domain: string | null }> = [
  { name: "Distributed Systems Architecture", quote: "Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees.", domain: "Engineering" },
  { name: "Edge Computing", quote: "high-throughput edge automation", domain: "Engineering" },
  { name: "Gossip Protocols", quote: "Implemented fault-tolerant gossip protocols across 5,000+ edge nodes in EMEA.", domain: "Engineering" },
  { name: "IoT Infrastructure Transformation", quote: "Led the worldwide IoT infrastructure transformation at Siemens Industrial Automation.", domain: null }
];
const audit = (count: number, docs: number) => ({ source_documents_examined: docs, capability_count: count, atomic_capability_count: count, composite_capability_count: 0, attribution_pass_completed: true, target_state_ownership_pass_completed: true, atomic_extraction_pass_completed: true, method_capability_pass_completed: true, composite_reconstruction_pass_completed: true, global_convergence_pass_completed: true, inventory_reconciliation_pass_completed: true, final_reconciliation_produced_new_capabilities: false, unresolved_target_operations: 0, segments_classified_as_external_source_content: 0, segments_classified_as_target_subject_operation: 0, segments_classified_as_target_subject_designed_target_state: 0, segments_classified_as_target_organization_capability: 0, segments_excluded_due_to_attribution_ambiguity: 0 });

function textOf(body: any): string {
  const contents = body?.contents;
  const parts = Array.isArray(contents) ? contents.flatMap((c: any) => typeof c === "string" ? [c] : Array.isArray(c?.parts) ? c.parts.map((p: any) => p?.text ?? "") : []) : typeof contents === "string" ? [contents] : [];
  return parts.join("\n");
}

function discovery(text: string): string {
  const kernel = /"kernel_version" MUST equal exactly "([^"]+)"/.exec(text)?.[1] ?? "discovery-v1";
  const docs = [...text.matchAll(/<SOURCE_DOCUMENT>\nDOC_ID: ([^\n]+)\n[\s\S]*?<\/SOURCE_DOCUMENT>/g)].map(match => ({ id: match[1], body: match[0] }));
  const capabilities: any[] = [];
  for (const phrase of PHRASES) {
    const doc = docs.find(item => item.body.includes(phrase.quote));
    if (doc) capabilities.push({ canonical_name: phrase.name, capability_scope: "ATOMIC", structural_definition: `${phrase.name} demonstrated in the source.`, primary_domain: phrase.domain, demonstrated_capability_level: null, model_confidence: 0.88, evidence_mode: "EXPLICIT", evidence: [{ source_document: doc.id, location: "body", exact_quote: phrase.quote }] });
  }
  // One claim with a quote that is in no document: the evidence validator must reject it (REJECTED_*), never a proposal.
  if (docs.length > 0) capabilities.push({ canonical_name: "Quantum Annealing", capability_scope: "ATOMIC", structural_definition: "Invented by the stand-in to show a rejected claim.", primary_domain: null, demonstrated_capability_level: null, model_confidence: 0.4, evidence_mode: "EXPLICIT", evidence: [{ source_document: docs[0].id, location: "body", exact_quote: "Designed quantum annealing schedules for logistics." }] });
  // Deliberately not the canonical form (key order, tab indentation, CRLF, trailing newline): the original text stays distinguishable from the parsed object.
  return `${JSON.stringify({ coverage_audit: audit(capabilities.length, docs.length), capabilities, kernel_version: kernel }, null, "\t").replaceAll("\n", "\r\n")}\r\n`;
}

function convergence(text: string): string {
  const version = /"convergence_version" MUST equal exactly "([^"]+)"/.exec(text)?.[1] ?? "convergence-v1";
  const start = text.indexOf("[", text.indexOf("ELIGIBLE_CANDIDATE_COUNT"));
  const candidates = JSON.parse(text.slice(start, text.lastIndexOf("]") + 1)) as Array<{ candidate_id: string; canonical_name: string; capability_scope: "ATOMIC" | "COMPOSITE"; structural_definition: string; primary_domain: string | null }>;
  const groups = candidates.map((candidate, index) => ({ group_key: `g${index + 1}`, member_candidate_ids: [candidate.candidate_id], canonical_name: candidate.canonical_name, capability_scope: candidate.capability_scope, structural_definition: candidate.structural_definition, primary_domain: candidate.primary_domain }));
  return JSON.stringify({ convergence_version: version, groups, relations: [], reconciliation_audit: { input_candidate_count: candidates.length, grouped_candidate_count: candidates.length, group_count: groups.length, same_capability_merge_count: 0, unresolved_relation_count: 0, reconciliation_pass_completed: true } });
}

const legacy = (): string => readFileSync(`${W}/test/gold/case_001_minimal_valid/expected/expected.json`, "utf8");

export interface StandInRecord { at: string; path: string; kind: "DISCOVERY" | "CONVERGENCE" | "LEGACY" | "OTHER"; scopeBlock: boolean; status: number }
export function startGeminiStandIn(onRecord: (record: StandInRecord) => void): Promise<{ server: Server; port: number }> {
  let n = 0;
  const server = createServer(async (request, response) => {
    let raw = ""; for await (const chunk of request) raw += String(chunk);
    const path = (request.url ?? "").split("?")[0];
    let body: any = null; try { body = JSON.parse(raw); } catch { /* not JSON */ }
    const text = textOf(body);
    const kind: StandInRecord["kind"] = text.includes("CONDYN CAPABILITY DISCOVERY SOURCE CORPUS") ? "DISCOVERY" : text.includes("CONDYN CAPABILITY CONVERGENCE INPUT") ? "CONVERGENCE" : /:generateContent$/.test(path) ? "LEGACY" : "OTHER";
    const reply = (status: number, payload: unknown) => { onRecord({ at: new Date().toISOString(), path, kind, scopeBlock: text.includes("<INVESTIGATION_SCOPE>"), status }); response.writeHead(status, { "content-type": "application/json" }); response.end(JSON.stringify(payload)); };
    if (/:countTokens$/.test(path)) return reply(200, { totalTokens: Math.ceil(raw.length / 4) });
    if (kind === "OTHER") return reply(400, { error: { code: 400, message: "GRÜN stand-in: unsupported request", status: "INVALID_ARGUMENT" } });
    n += 1;
    let out: string;
    try { out = kind === "DISCOVERY" ? discovery(text) : kind === "CONVERGENCE" ? convergence(text) : legacy(); } catch (error) { return reply(500, { error: { code: 500, message: `stand-in: ${String(error).slice(0, 120)}`, status: "INTERNAL" } }); }
    reply(200, { candidates: [{ content: { role: "model", parts: [{ text: out }] }, finishReason: "STOP" }], modelVersion: "gruen-standin-001", responseId: `gruen-${kind.toLowerCase()}-${n}`, usageMetadata: { promptTokenCount: Math.ceil(raw.length / 4), candidatesTokenCount: Math.ceil(out.length / 4) } });
  });
  return new Promise(resolve => server.listen(0, "127.0.0.1", () => resolve({ server, port: (server.address() as { port: number }).port })));
}
