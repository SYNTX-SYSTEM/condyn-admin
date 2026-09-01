import type { CapabilityCoreRepository } from "../repository";
import type { CapabilityCandidate, EvidenceClaim } from "../schema";
import type { CapabilityConvergenceRun } from "../convergence";
import type { CapabilityProposalProjectionReferenceRepository } from "./reference-repository";

export interface CapabilityProposalProjection {
  // This is a read model for a persisted proposal lineage, not a Capability
  // authority surface. The explicit states prevent callers from inferring truth.
  projectionKind: "CAPABILITY_PROPOSAL";
  projectionState: "PROPOSED";
  evidenceState: "EVIDENCE_PASSED";
  semanticDefinitionState: "NOT_RUN";
  authorityState: "NONE";
  capabilities: Array<{
    id: string; name: string; domain: string | null; scope: "ATOMIC" | "COMPOSITE";
    structuralDefinition: string; evidenceState: "EVIDENCE_PASSED";
    semanticDefinitionState: "NOT_RUN"; authorityState: "NONE";
    sourceCandidateIds: string[]; sourceDocumentIds: string[];
    evidence: Array<{ evidenceId: string; sourceDocumentId: string; exactQuote: string; verificationState: "SOURCE_MATCH_VERIFIED" }>;
  }>;
  relations: Array<{ id: string; sourceCapabilityId: string; targetCapabilityId: string; relationType: string; state: "PROPOSED"; reason: string }>;
}

// An immutable reference selects one exact RUN_/CONV_ pair. Never repair or
// search for another artifact when that pair fails validation.
const integrity = (): never => { throw new Error("ERR_CAPABILITY_PROPOSAL_PROJECTION_LINEAGE_INVALID"); };

type VerifiedEvidence = { candidateId: string; claim: EvidenceClaim };

function verifiedEvidence(candidates: CapabilityCandidate[]): Map<string, VerifiedEvidence> {
  const evidence = new Map<string, VerifiedEvidence>();
  for (const candidate of candidates) {
    if (candidate.status !== "EVIDENCE_PASSED") continue;
    for (const claim of candidate.evidenceClaims) {
      if (claim.verification.status === "VERIFIED" && claim.verification.matchedDocId) {
        if (evidence.has(claim.evidenceId)) integrity();
        evidence.set(claim.evidenceId, { candidateId: candidate.candidateId, claim });
      }
    }
  }
  return evidence;
}

function hasNonEmptyPcapId(value: unknown): value is string {
  return typeof value === "string" && /^PCAP_.+/.test(value);
}

function sameStringSet(left: unknown, right: unknown): boolean {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  const leftSet = new Set(left);
  const rightSet = new Set(right);
  return leftSet.size === left.length && rightSet.size === right.length &&
    leftSet.size === rightSet.size && [...leftSet].every((value) => typeof value === "string" && rightSet.has(value));
}

export function createCapabilityProposalProjectionReader(dependencies: {
  references: CapabilityProposalProjectionReferenceRepository;
  capabilityRepository: Pick<CapabilityCoreRepository, "getRunById" | "getConvergenceRunById">;
}): { read(analysisId: string): Promise<CapabilityProposalProjection | null> } {
  return {
    async read(analysisId) {
      const reference = await dependencies.references.getByAnalysisId(analysisId);
      // Historical analyses predate F11 and therefore have no proposal sidecar.
      if (reference === null) return null;
      if (reference.analysisId !== analysisId) integrity();
      const discovery = await dependencies.capabilityRepository.getRunById(reference.discoveryRunId);
      const convergence = await dependencies.capabilityRepository.getConvergenceRunById(reference.convergenceRunId);
      if (!discovery || !convergence) integrity();
      const discoveryRun = discovery as NonNullable<typeof discovery>;
      const convergenceRun = convergence as NonNullable<typeof convergence>;
      if (
        discoveryRun.runId !== reference.discoveryRunId ||
        convergenceRun.convergenceRunId !== reference.convergenceRunId ||
        discoveryRun.status !== "COMPLETED" ||
        convergenceRun.status !== "COMPLETED" ||
        convergenceRun.discoveryRunId !== discoveryRun.runId ||
        reference.sourceBundleHash !== discoveryRun.sourceBundleHash ||
        reference.sourceBundleHash !== convergenceRun.sourceBundleHash ||
        convergenceRun.payload?.reconciliation?.status !== "PASSED"
      ) integrity();
      const candidates = (discoveryRun.payload as { candidates?: CapabilityCandidate[] }).candidates;
      if (!Array.isArray(candidates)) integrity();
      const persistedCandidates = candidates as CapabilityCandidate[];
      const candidatesById = new Map<string, CapabilityCandidate>();
      for (const candidate of persistedCandidates) {
        if (!candidate.candidateId || candidatesById.has(candidate.candidateId)) integrity();
        candidatesById.set(candidate.candidateId, candidate);
      }
      // EVIDENCE_PASSED is source-match admission only; it is not semantic
      // definition verification or capability authority.
      const evidenceById = verifiedEvidence(persistedCandidates);
      const drafts = convergenceRun.payload.canonicalDrafts;
      if (!Array.isArray(drafts)) integrity();
      const capabilityIds = new Set<string>();
      const capabilities = drafts.map((draft) => {
        if (
          !hasNonEmptyPcapId(draft.provisionalCapabilityId) ||
          capabilityIds.has(draft.provisionalCapabilityId) ||
          draft.semanticDefinitionStatus !== "NOT_RUN" ||
          !Array.isArray(draft.provenance?.sourceCandidateIds) ||
          draft.provenance.sourceCandidateIds.length === 0 ||
          !Array.isArray(draft.evidenceIds)
        ) integrity();
        capabilityIds.add(draft.provisionalCapabilityId);
        const sourceCandidateIds = draft.provenance.sourceCandidateIds;
        if (new Set(sourceCandidateIds).size !== sourceCandidateIds.length) integrity();
        for (const candidateId of sourceCandidateIds) {
          const candidate = candidatesById.get(candidateId);
          if (!candidate || candidate.status !== "EVIDENCE_PASSED") integrity();
        }
        if (new Set(draft.evidenceIds).size !== draft.evidenceIds.length) integrity();
        const evidence = draft.evidenceIds.map((evidenceId) => {
          const resolved = evidenceById.get(evidenceId);
          if (!resolved) integrity();
          const resolvedEvidence = resolved as VerifiedEvidence;
          if (!sourceCandidateIds.includes(resolvedEvidence.candidateId)) integrity();
          const verifiedClaim = resolvedEvidence.claim;
          const sourceDocumentId = verifiedClaim.verification.matchedDocId;
          if (!sourceDocumentId) integrity();
          return { evidenceId, sourceDocumentId: sourceDocumentId as string, exactQuote: verifiedClaim.exactQuote, verificationState: "SOURCE_MATCH_VERIFIED" as const };
        });
        if (!sameStringSet(evidence.map((item) => item.sourceDocumentId), draft.provenance.sourceDocumentIds)) integrity();
        return {
          id: draft.provisionalCapabilityId, name: draft.canonicalName, domain: draft.primaryDomain,
          scope: draft.scope, structuralDefinition: draft.structuralDefinition,
          evidenceState: "EVIDENCE_PASSED" as const, semanticDefinitionState: "NOT_RUN" as const,
          authorityState: "NONE" as const, sourceCandidateIds: [...sourceCandidateIds],
          sourceDocumentIds: [...draft.provenance.sourceDocumentIds], evidence
        };
      });
      const relations = convergenceRun.payload.proposedRelations.map((relation) => {
        if (relation.status !== "PROPOSED" || !capabilityIds.has(relation.sourceCapabilityRef) || !capabilityIds.has(relation.targetCapabilityRef)) integrity();
        return { id: relation.relationId, sourceCapabilityId: relation.sourceCapabilityRef, targetCapabilityId: relation.targetCapabilityRef, relationType: relation.relationType, state: "PROPOSED" as const, reason: relation.reason };
      });
      return { projectionKind: "CAPABILITY_PROPOSAL", projectionState: "PROPOSED", evidenceState: "EVIDENCE_PASSED", semanticDefinitionState: "NOT_RUN", authorityState: "NONE", capabilities, relations };
    }
  };
}
