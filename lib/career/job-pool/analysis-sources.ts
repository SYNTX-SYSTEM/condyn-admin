/**
 * Analysis sources for the SYNTX field (owner mandate "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION", 2026-10-11;
 * SYNTX_FIELD_CONTRACT_BINDING.md §1, §2.3, R12).
 *
 * The second read the binding permits: `GET /api/career/analyses/{analysisId}` is read for exactly three things and
 * nothing else — the source documents (title per docId), the evidence locations of the legacy analysis capabilities
 * (provenance), and the evidence ids of the capability proposal projection (sweep). The LLM-inferred organizations,
 * roles, the legacy `matching` and the `recommendations` of that body are never decoded here (binding §1 "Not an input").
 *
 * Every join the view model performs over these sources is an exact-match lookup inside one analysis: a failed join
 * omits the field (title, location, evidence id); nothing falls back to fuzzy matching (SG-1).
 */

export interface AnalysisSourceDocument {
  docId: string;
  title: string;
}

export interface AnalysisCapabilityEvidence {
  capabilityEntityId: string;
  docId: string;
  quote: string;
  location: string | null;
}

export interface AnalysisProposalEvidence {
  capabilityProposalId: string;
  evidenceId: string;
  docId: string;
  quote: string;
}

export interface AnalysisSources {
  analysisId: string;
  documents: AnalysisSourceDocument[];
  capabilityEvidence: AnalysisCapabilityEvidence[];
  proposalEvidence: AnalysisProposalEvidence[];
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const str = (value: unknown): string | null => (typeof value === "string" && value.length > 0 ? value : null);
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);

/** Decodes the analysis read body to its three source surfaces; absent or malformed parts decode to empty lists, never to a guess. */
export function decodeAnalysisSources(analysisId: string, body: unknown): AnalysisSources {
  const sources: AnalysisSources = { analysisId, documents: [], capabilityEvidence: [], proposalEvidence: [] };
  if (!isRecord(body)) return sources;
  const analysis = isRecord(body.analysis) ? body.analysis : null;
  const structured = analysis !== null && isRecord(analysis.structured_data) ? analysis.structured_data : null;
  const inner = structured !== null && isRecord(structured.analysis) ? structured.analysis : null;
  if (inner !== null) {
    for (const entity of list(inner.documents)) {
      if (!isRecord(entity)) continue;
      const docId = str(entity.entity_id);
      // Source carriers only: the document's identity name is its title (binding §2.3), never an inferred organization or role.
      const identity = isRecord(entity.identity) ? entity.identity : null;
      const title = identity === null ? null : str(identity.name);
      if (docId !== null && title !== null) sources.documents.push({ docId, title });
    }
    for (const entity of list(inner.capabilities)) {
      if (!isRecord(entity)) continue;
      const capabilityEntityId = str(entity.entity_id);
      if (capabilityEntityId === null) continue;
      for (const evidence of list(entity.evidence)) {
        if (!isRecord(evidence)) continue;
        const docId = str(evidence.doc_id);
        const quote = str(evidence.context_quote);
        if (docId === null || quote === null) continue;
        sources.capabilityEvidence.push({ capabilityEntityId, docId, quote, location: str(evidence.location) });
      }
    }
  }
  const projection = isRecord(body.capabilityProposalProjection) ? body.capabilityProposalProjection : null;
  if (projection !== null) {
    for (const capability of list(projection.capabilities)) {
      if (!isRecord(capability)) continue;
      const capabilityProposalId = str(capability.id);
      if (capabilityProposalId === null) continue;
      for (const evidence of list(capability.evidence)) {
        if (!isRecord(evidence)) continue;
        const evidenceId = str(evidence.evidenceId);
        const docId = str(evidence.sourceDocumentId);
        const quote = str(evidence.exactQuote);
        if (evidenceId === null || docId === null || quote === null) continue;
        sources.proposalEvidence.push({ capabilityProposalId, evidenceId, docId, quote });
      }
    }
  }
  return sources;
}

export type AnalysisSourcesState =
  | { state: "IDLE" }
  | { state: "LOADING"; analysisId: string }
  | { state: "AVAILABLE"; analysisId: string; sources: AnalysisSources }
  | { state: "NOT_FOUND"; analysisId: string }
  | { state: "FAILED"; analysisId: string };

export const ANALYSIS_ROUTE = "/api/career/analyses";

export async function readAnalysisSources(analysisId: string, fetcher: typeof fetch = (input, init) => fetch(input, init)): Promise<AnalysisSourcesState> {
  let response: Response;
  try { response = await fetcher(`${ANALYSIS_ROUTE}/${encodeURIComponent(analysisId)}`); } catch { return { state: "FAILED", analysisId }; }
  if (response.status === 404) return { state: "NOT_FOUND", analysisId };
  if (response.status !== 200) return { state: "FAILED", analysisId };
  let body: unknown = null;
  try { body = await response.json(); } catch { return { state: "FAILED", analysisId }; }
  return { state: "AVAILABLE", analysisId, sources: decodeAnalysisSources(analysisId, body) };
}
