import { describe, expect, it } from "vitest";
import { InMemoryCapabilityCoreRepository, deriveCandidateCapabilityOperand } from "../../../../lib/career/capability-core";
import { buildRequirementRelationAggregate, buildTargetRoleRequirementInventory, derivationReplayRequirementRelationAggregate, derivationReplayTargetRoleRequirementInventory, InMemoryRequirementInventoryRepository, semanticReplayRequirementRelationAggregate, type T6BPairRepository } from "../../../../lib/career/relation/requirement-inventory";
import { createTargetRoleProfileRevision } from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";

const stamp = "2026-10-05T00:00:00.000Z";
const protocol = { relationProducerVersion: "relation-v1", requirementAdmissionPolicyVersion: "admission-v1", semanticPolicyVersion: "semantic-v1", levelPolicyVersion: "level-v1", scopePolicyVersion: "scope-v1", evidencePolicyVersion: "evidence-v1" };
const notEvaluated: T6BPairRepository = { getRelationById: async () => null, getResultById: async () => null, getRunById: async () => null, discoverPairTerminal: async () => ({ disposition: "NOT_EVALUATED" }) };

async function fixture() {
  const capability = new InMemoryCapabilityCoreRepository();
  const phase4 = createPhase4Input("T7A_REPLAY");
  await capability.saveRun(phase4.discoveryRun); await capability.saveConvergenceRun(phase4.convergenceRun); await capability.saveVerificationRun(phase4.verificationRun);
  const snapshot = await capability.createVerifiedCapabilitySnapshotPublisher().publish(phase4);
  const operand = await deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: snapshot.capabilities[0].capabilityId }, capability);
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: "ROLE_REPLAY", targetRoleOrganizationBindingRevisionId: "BINDING_REPLAY", previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: "Role", responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  const requirement = createTargetRequirementRevision({ targetRequirementEntityId: "REQ_REPLAY", targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, previousRevisionId: null, requirement: { normalizedStatement: "TypeScript capability", requirementType: "CAPABILITY", capabilityExpression: "TypeScript", structuralDefinition: "Typed capability", requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: "REQUIRED" }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: "TypeScript capability" }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp });
  const requirements = { listTargetRequirementRevisionsByTargetRoleProfileRevisionId: async () => [requirement] };
  const inventory = await buildTargetRoleRequirementInventory({ targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, requirementInventoryPolicyVersion: "inventory-v1", createdAt: stamp }, requirements);
  const aggregate = await buildRequirementRelationAggregate({ inventory, verifiedCapabilitySnapshotId: snapshot.snapshotId, targetRequirementEntityId: requirement.targetRequirementEntityId, targetRequirementRevisionId: requirement.targetRequirementRevisionId, candidateCapabilityOperandIds: [operand.candidateCapabilityOperandId], pairDispositions: [{ candidateCapabilityOperandId: operand.candidateCapabilityOperandId, disposition: "NOT_EVALUATED", capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null }], t6bProtocol: protocol, pairInventoryPolicyVersion: "pair-v1", compositionPolicyVersion: "composition-v1", createdAt: stamp }, notEvaluated);
  const repository = new InMemoryRequirementInventoryRepository(); await repository.persistInventory(inventory); await repository.persistAggregate(aggregate);
  const implementations = { resolveRequirementInventoryPolicy: (version: string) => version === "inventory-v1" ? { version } : null, resolvePairInventoryPolicy: (version: string) => version === "pair-v1" ? { version } : null, resolveCompositionPolicy: (version: string) => version === "composition-v1" ? { version } : null };
  return { capability, profile, requirement, inventory, aggregate, repository, implementations, requirements };
}

describe("T7A deterministic replay", () => {
  it("recomposes historical inventory and aggregate IDs from exact immutable inputs without a provider", async () => {
    const value = await fixture();
    const deps = { repository: value.repository, requirements: value.requirements, getTargetRoleProfileRevisionById: async (id: string) => id === value.profile.targetRoleProfileRevisionId ? value.profile : null, candidateRepository: value.capability, t6b: notEvaluated, implementations: value.implementations };
    await expect(semanticReplayRequirementRelationAggregate(value.aggregate.requirementRelationAggregateId, { repository: value.repository, t6b: notEvaluated })).resolves.toEqual(value.aggregate);
    await expect(derivationReplayTargetRoleRequirementInventory(value.inventory.targetRoleRequirementInventoryId, deps)).resolves.toEqual(value.inventory);
    await expect(derivationReplayRequirementRelationAggregate(value.aggregate.requirementRelationAggregateId, deps)).resolves.toEqual(value.aggregate);
  });

  it("fails closed for unavailable pinned policy or changed historical terminal disposition", async () => {
    const value = await fixture();
    const base = { repository: value.repository, requirements: value.requirements, getTargetRoleProfileRevisionById: async () => value.profile, candidateRepository: value.capability, implementations: value.implementations };
    await expect(derivationReplayRequirementRelationAggregate(value.aggregate.requirementRelationAggregateId, { ...base, implementations: { ...value.implementations, resolvePairInventoryPolicy: () => null }, t6b: notEvaluated })).rejects.toThrow("PINNED_VERSION_UNAVAILABLE");
    const changed: T6BPairRepository = { ...notEvaluated, discoverPairTerminal: async () => ({ disposition: "MATERIALIZED_RELATION", relation: { capabilityRequirementRelationId: "CRREL_CHANGED" } as any }) };
    await expect(derivationReplayRequirementRelationAggregate(value.aggregate.requirementRelationAggregateId, { ...base, t6b: changed })).rejects.toThrow("DERIVATION_REPLAY_MISMATCH");
  });
});
