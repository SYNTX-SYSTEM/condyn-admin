import type { SelectedRoleCoverage } from "../../../lib/career/job-pool/selected-role-coverage";
import type { PersistedAnalysisInvestigation } from "../../../lib/career/investigation/persisted";
import { ANALYSIS, ROLE, UPLOAD, coverage as b2 } from "../three-modes/fixtures";

/**
 * PERSON × JOB · first screen (owner G1): synthetic bodies built to the contracts, no Gemini raw text and no personal data.
 * B2 is the three-modes fixture (SELECTED_ROLE_COVERAGE_V1); the persisted result is new and agrees with it: its projection holds
 * exactly the proposals B2 names, in the same order, with the same verbatim quotes from the one persisted document DOC_001.
 */
export { ANALYSIS, ROLE, UPLOAD };
export const OTHER_ROLE = "role_pink_alpha_platform";

export const projection = () => ({
  projectionKind: "CAPABILITY_PROPOSAL",
  projectionState: "PROPOSED",
  evidenceState: "EVIDENCE_PASSED",
  semanticDefinitionState: "NOT_RUN",
  authorityState: "NONE",
  capabilities: [
    { id: "CAPP_1", name: "Distributed Systems Architecture", domain: "Engineering", scope: "ATOMIC", structuralDefinition: "Designs distributed systems.", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE", sourceCandidateIds: ["CAND_1"], sourceDocumentIds: ["DOC_001"], evidence: [{ evidenceId: "EVD_1", sourceDocumentId: "DOC_001", exactQuote: "Architected distributed IIoT Edge Computing systems with 99.999% uptime guarantees.", verificationState: "SOURCE_MATCH_VERIFIED" }] },
    { id: "CAPP_2", name: "Edge Computing", domain: "Engineering", scope: "ATOMIC", structuralDefinition: "Runs workloads at the edge.", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE", sourceCandidateIds: ["CAND_2"], sourceDocumentIds: ["DOC_001"], evidence: [{ evidenceId: "EVD_2", sourceDocumentId: "DOC_001", exactQuote: "high-throughput edge automation", verificationState: "SOURCE_MATCH_VERIFIED" }] },
    { id: "CAPP_3", name: "Gossip Protocols", domain: null, scope: "ATOMIC", structuralDefinition: "Membership by gossip.", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE", sourceCandidateIds: ["CAND_3"], sourceDocumentIds: ["DOC_001"], evidence: [{ evidenceId: "EVD_3", sourceDocumentId: "DOC_001", exactQuote: "Implemented SWIM-style gossip membership.", verificationState: "SOURCE_MATCH_VERIFIED" }] }
  ],
  relations: [{ id: "REL_1", sourceCapabilityId: "CAPP_1", targetCapabilityId: "CAPP_3", relationType: "USES", state: "PROPOSED", reason: "synthetic" }]
});

/** The legacy analysis carries one organisation, one role and one strategy: under PERSON × JOB none of them may surface. */
export const LEGACY_NAMES = ["Legacy Resonance Works", "Legacy Inferred Lead", "Legacy Strategy Path"] as const;

export const resultBody = (overrides: Record<string, unknown> = {}) => ({
  success: true,
  status: "VERIFIED",
  analysisId: ANALYSIS,
  metadata: { analysis_id: ANALYSIS, analysis_timestamp: "2026-10-22T08:00:00.000Z" },
  matching: { note: "demo pool, never read" },
  recommendations: [{ note: "never read" }],
  capabilityProposalProjection: projection(),
  analysis: {
    structured_data: {
      analysis: {
        metadata: { analysis_id: ANALYSIS, analysis_timestamp: "2026-10-22T08:00:00.000Z" },
        documents: [{ entity_id: "DOC_001", identity: { name: "Synthetic profile.pdf" }, properties: { hash_sha256: "5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5f1c0ffee5" } }],
        capabilities: [],
        organizations: [{ entity_id: "ORG_L1", identity: { name: LEGACY_NAMES[0] }, evidence: [] }],
        roles: [{ entity_id: "ROLE_L1", identity: { name: LEGACY_NAMES[1] }, relationships: [], evidence: [] }],
        requirements: [],
        strategies: [{ entity_id: "STR_L1", identity: { name: LEGACY_NAMES[2] }, properties: { purpose: "p", target: "t" } }]
      }
    }
  },
  reactFlowGraph: { nodes: [], edges: [] },
  ...overrides
});

export const boundary = (overrides: Partial<PersistedAnalysisInvestigation> = {}): PersistedAnalysisInvestigation => ({
  investigationVersion: "ANALYSIS_INVESTIGATION_V1",
  analysisId: ANALYSIS,
  jobId: "JOB_1792044447366_377",
  mode: "PERSON_X_JOB",
  jobScopeSelection: { jobPoolUploadId: UPLOAD, poolRoleId: ROLE },
  basis: "JOB_DECLARATION_AND_DISCOVERY_RUN",
  discoveryRunId: "RUN_A",
  investigationScopeHash: "ad1ae5e4a6faba2b00",
  ...overrides
});

export const coverage = (): SelectedRoleCoverage => b2();
export const selection = { jobPoolUploadId: UPLOAD, poolRoleId: ROLE };

/** A fetcher scripted per URL that records every request (T-03 spy). */
export function scripted(routes: Record<string, { status: number; body: unknown }>) {
  const calls: Array<{ url: string; method: string; cache: string }> = [];
  const fetcher = async (url: string, init: { method: "GET"; cache: "no-store"; signal?: AbortSignal }) => {
    calls.push({ url, method: init.method, cache: init.cache });
    const route = routes[url];
    if (!route) throw new Error(`unscripted ${url}`);
    return { status: route.status, json: async () => route.body };
  };
  return { calls, fetcher };
}
