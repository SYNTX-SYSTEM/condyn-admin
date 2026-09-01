import type { DemoCareerIntelligenceData, DemoCapabilityItem } from "../../app/career/demo/demo-data";
import type { CapabilityProposalProjection } from "./capability-core/projection";

/**
 * Applies a non-authoritative proposal overlay without changing legacy analysis
 * semantics. Proposal fields stay explicit so SIL cannot manufacture truth from
 * source matching, model output, or persistence alone.
 */
export function applyCapabilityProposalProjectionToDemoState(
  legacy: DemoCareerIntelligenceData,
  projection: CapabilityProposalProjection | null
): DemoCareerIntelligenceData {
  if (projection === null) return legacy;
  const capabilities: DemoCapabilityItem[] = projection.capabilities.map((capability) => ({
    id: capability.id,
    name: capability.name,
    domain: capability.domain ?? "UNKNOWN_DOMAIN",
    evidenceSummary: capability.evidence[0]?.exactQuote ?? "",
    evidenceConfidence: undefined,
    projectionState: "PROPOSED",
    evidenceState: "EVIDENCE_PASSED",
    semanticDefinitionState: "NOT_RUN",
    authorityState: "NONE",
    scope: capability.scope,
    structuralDefinition: capability.structuralDefinition,
    sourceDocumentIds: [...capability.sourceDocumentIds],
    sourceCandidateIds: [...capability.sourceCandidateIds],
    evidence: capability.evidence.map((item) => ({ ...item }))
  }));
  return { ...legacy, capabilities };
}
