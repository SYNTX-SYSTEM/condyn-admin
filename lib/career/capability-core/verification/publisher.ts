import { buildProvisionalCapabilityId } from "../identity";
import { assertVerifiedCapabilitySnapshot, buildSnapshotId, createVerifiedCapabilitySnapshot } from "../snapshot";
import { createCapabilityRelation, type CapabilityRelation, type EvidenceClaim, type VerifiedCapability, type VerifiedCapabilitySnapshot } from "../schema";
import type { CanonicalCapabilityDraft } from "../convergence/types";
import type { CapabilityVerificationPublicationInput, CapabilityVerificationRun, VerifiedCapabilitySnapshotPublisher } from "./types";

const equalArrays = (left: string[], right: string[]) => left.length === right.length && left.every((value, index) => value === right[index]);
const finalCapabilityId = (draft: CanonicalCapabilityDraft): string => {
  const expectedProvisionalId = buildProvisionalCapabilityId(draft.canonicalName, draft.scope);
  if (draft.provisionalCapabilityId !== expectedProvisionalId) throw new Error("ERR_PHASE4_PROVISIONAL_ID_MISMATCH");
  return expectedProvisionalId.replace("PCAP_", "CAP_");
};

function exactlyOne<T extends { provisionalCapabilityId: string }>(items: T[], provisionalCapabilityId: string, error: string): T {
  const matches = items.filter((item) => item.provisionalCapabilityId === provisionalCapabilityId);
  if (matches.length !== 1) throw new Error(error);
  return matches[0];
}

function assertDraftContent(draft: CanonicalCapabilityDraft, capability: VerifiedCapability): void {
  if (capability.canonicalName !== draft.canonicalName || capability.scope !== draft.scope || capability.structuralDefinition !== draft.structuralDefinition || capability.primaryDomain !== draft.primaryDomain || !equalArrays(capability.evidenceIds, draft.evidenceIds) || !equalArrays(capability.provenance.sourceCandidateIds, draft.provenance.sourceCandidateIds) || !equalArrays(capability.provenance.sourceDocumentIds, draft.provenance.sourceDocumentIds)) {
    throw new Error("ERR_PHASE4_DRAFT_CONTENT_MISMATCH");
  }
}

function assertCapabilityOutcomes(draft: CanonicalCapabilityDraft, capability: VerifiedCapability, run: CapabilityVerificationRun): void {
  const semantic = exactlyOne(run.payload.semanticDefinitionOutcomes, draft.provisionalCapabilityId, "ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED");
  if (semantic.status !== "PASSED" || capability.validation.semanticDefinitionStatus !== "PASSED") throw new Error("ERR_PHASE4_SEMANTIC_DEFINITION_NOT_PASSED");
  const level = exactlyOne(run.payload.demonstratedLevelOutcomes, draft.provisionalCapabilityId, "ERR_PHASE4_LEVEL_TRUTH_INVARIANT");
  const levelMatches = level.status === "VERIFIED"
    ? capability.levelVerificationStatus === "VERIFIED" && capability.demonstratedCapabilityLevel === level.demonstratedCapabilityLevel && level.demonstratedCapabilityLevel !== null
    : capability.levelVerificationStatus === "UNVERIFIED" && capability.demonstratedCapabilityLevel === null && level.demonstratedCapabilityLevel === null;
  if (!levelMatches) throw new Error("ERR_PHASE4_LEVEL_TRUTH_INVARIANT");
  if (capability.validation.evidenceStatus !== "PASSED") throw new Error("ERR_PHASE4_EVIDENCE_REFERENCE_INVALID");
  if (capability.validation.convergenceStatus !== "VERIFIED") throw new Error("ERR_PHASE4_CONVERGENCE_NOT_VERIFIED");
}

/** Draft order owns the final evidence order; caller evidence order is never authoritative. */
function deriveFinalEvidenceInventory(drafts: CanonicalCapabilityDraft[], evidence: EvidenceClaim[]): EvidenceClaim[] {
  const requiredIds: string[] = [];
  const required = new Set<string>();
  for (const draft of drafts) for (const evidenceId of draft.evidenceIds) {
    if (!required.has(evidenceId)) { required.add(evidenceId); requiredIds.push(evidenceId); }
  }
  const supplied = new Map<string, EvidenceClaim>();
  for (const item of evidence) {
    if (supplied.has(item.evidenceId)) throw new Error("ERR_PHASE4_EVIDENCE_INVENTORY_INVALID");
    supplied.set(item.evidenceId, item);
  }
  if (supplied.size !== requiredIds.length) throw new Error("ERR_PHASE4_EVIDENCE_INVENTORY_INVALID");
  return requiredIds.map((evidenceId) => {
    const item = supplied.get(evidenceId);
    if (!item || item.verification.status !== "VERIFIED") throw new Error("ERR_PHASE4_EVIDENCE_INVENTORY_INVALID");
    return item;
  });
}

function deriveFinalRelations(proposedRelations: CapabilityRelation[], draftsByProvisionalId: Map<string, CanonicalCapabilityDraft>, run: CapabilityVerificationRun): CapabilityRelation[] {
  if (run.payload.publicationEligibility !== "ELIGIBLE") throw new Error("ERR_PHASE4_PUBLICATION_BLOCKED");
  const proposedIds = new Set(proposedRelations.map((relation) => relation.relationId));
  const dispositions = new Map<string, CapabilityVerificationRun["payload"]["relationDispositions"][number]>();
  if (proposedIds.size !== proposedRelations.length) throw new Error("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
  for (const disposition of run.payload.relationDispositions) {
    if (!proposedIds.has(disposition.relationId) || dispositions.has(disposition.relationId)) throw new Error("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    dispositions.set(disposition.relationId, disposition);
  }
  return proposedRelations.flatMap((proposal) => {
    const disposition = dispositions.get(proposal.relationId);
    if (!disposition) throw new Error("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    if (disposition.status === "UNRESOLVED") throw new Error("ERR_PHASE4_PUBLICATION_BLOCKED");
    if (disposition.status === "REJECTED") return [];
    if (proposal.status !== "PROPOSED" || proposal.relationType === "UNRESOLVED" || proposal.relationType === "SAME_CAPABILITY") throw new Error("ERR_PHASE4_RELATION_NOT_VERIFIED");
    const source = draftsByProvisionalId.get(proposal.sourceCapabilityRef);
    const target = draftsByProvisionalId.get(proposal.targetCapabilityRef);
    if (!source || !target) throw new Error("ERR_PHASE4_RELATION_DISPOSITION_MISSING");
    return [createCapabilityRelation({
      sourceCapabilityRef: finalCapabilityId(source),
      targetCapabilityRef: finalCapabilityId(target),
      relationType: proposal.relationType,
      status: "VERIFIED",
      reason: proposal.reason,
      createdBy: proposal.createdBy,
      createdAt: proposal.createdAt
    })];
  });
}

/**
 * This boundary derives final IDs, graph edges, and publication metadata from immutable inputs.
 * Verification Run Integrity is intentionally deferred: this slice does not yet authenticate the run artifact itself.
 */
export function publishVerifiedCapabilitySnapshot(input: CapabilityVerificationPublicationInput & { verificationRun: CapabilityVerificationRun }): VerifiedCapabilitySnapshot {
  const { publicationContext, verificationRun } = input;
  if (input.capabilities.some((capability) => capability.relationIds.length)) throw new Error("ERR_PHASE4_RELATION_NOT_VERIFIED");
  if (verificationRun.status !== "COMPLETED") throw new Error("ERR_PHASE4_VERIFICATION_RUN_BINDING");
  if (input.canonicalDrafts.length !== input.capabilities.length || new Set(input.canonicalDrafts.map(({ provisionalCapabilityId }) => provisionalCapabilityId)).size !== input.canonicalDrafts.length) throw new Error("ERR_PHASE4_FINAL_ID_NOT_DERIVED");
  const finalEvidence = deriveFinalEvidenceInventory(input.canonicalDrafts, input.evidence);

  const draftsByProvisionalId = new Map(input.canonicalDrafts.map((draft) => [draft.provisionalCapabilityId, draft]));
  const finalCapabilities = input.canonicalDrafts.map((draft) => {
    const capabilityId = finalCapabilityId(draft);
    const matches = input.capabilities.filter((capability) => capability.capabilityId === capabilityId);
    if (matches.length !== 1) throw new Error("ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID");
    const capability = matches[0];
    assertDraftContent(draft, capability);
    assertCapabilityOutcomes(draft, capability, verificationRun);
    if (!capability.evidenceIds.length || !capability.evidenceIds.every((evidenceId) => finalEvidence.some((evidence) => evidence.evidenceId === evidenceId))) throw new Error("ERR_PHASE4_EVIDENCE_REFERENCE_INVALID");
    if (!capability.provenance.sourceCandidateIds.length || !capability.provenance.sourceDocumentIds.length) throw new Error("ERR_PHASE4_PROVENANCE_INCOMPLETE");
    return { ...capability, relationIds: [] };
  });
  if (new Set(finalCapabilities.map(({ capabilityId }) => capabilityId)).size !== finalCapabilities.length) throw new Error("ERR_PHASE4_NONDETERMINISTIC_CAPABILITY_ID");

  const finalRelations = deriveFinalRelations(input.proposedRelations, draftsByProvisionalId, verificationRun);
  const capabilitiesWithRelationIds = finalCapabilities.map((capability) => ({
    ...capability,
    relationIds: finalRelations.filter((relation) => relation.sourceCapabilityRef === capability.capabilityId || relation.targetCapabilityRef === capability.capabilityId).map(({ relationId }) => relationId)
  }));
  const genericSnapshot = createVerifiedCapabilitySnapshot({
    sourceBundleHash: publicationContext.sourceBundleHash,
    kernelVersion: verificationRun.kernelVersion,
    prompt: { checksum: verificationRun.promptChecksum },
    inference: verificationRun.inference,
    schemaVersion: publicationContext.schemaVersion,
    candidateCount: publicationContext.candidateCount,
    rejectedCandidateCount: publicationContext.rejectedCandidateCount,
    createdAt: verificationRun.completedAt,
    status: "VERIFIED"
  }, capabilitiesWithRelationIds, finalEvidence, finalRelations);
  const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId: verificationRun.verificationRunId, verificationRawOutputHash: verificationRun.rawOutputHash };
  const published = {
    ...genericSnapshot,
    publication,
    snapshotId: buildSnapshotId({
      sourceBundleHash: genericSnapshot.sourceBundleHash,
      kernelVersion: genericSnapshot.kernelVersion,
      prompt: genericSnapshot.prompt,
      inference: genericSnapshot.inference,
      schemaVersion: genericSnapshot.schemaVersion,
      publication
    })
  };
  assertVerifiedCapabilitySnapshot(published);
  return published;
}

export const verifiedCapabilitySnapshotPublisher: VerifiedCapabilitySnapshotPublisher = { publish: publishVerifiedCapabilitySnapshot };
