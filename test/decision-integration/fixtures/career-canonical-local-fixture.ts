import { createHash } from "node:crypto";
import {
  buildSnapshotId,
  createVerifiedCapabilitySnapshot,
  type VerifiedCapabilitySnapshot
} from "../../../lib/career/capability-core";
import { createCapabilityRequirementRelationEvaluationResult } from "../../../lib/career/relation/capability-requirement";
import { deriveEvolutionInputState } from "../../../lib/career/relation/evolution-input";
import { createOrganizationRelation } from "../../../lib/career/relation/organization-relation";
import { deriveRecommendationPolicyRevisionId, deriveRecommendationProposal, type RecommendationPolicyRevision } from "../../../lib/career/relation/recommendation-proposal";
import { deriveRoleRelationId, type RoleRelation } from "../../../lib/career/relation/role-relation";
import { classifyRoleRelation } from "../../../lib/career/relation/tension-state";
import { createTargetOrganizationRevision } from "../../../lib/career/target/organization";
import {
  createTargetRequirementRevision,
  createTargetRoleOrganizationBindingRevision,
  createTargetRoleProfileRevision,
  createTargetRoleSourceBindingRevision
} from "../../../lib/career/target/role";
import { createTargetSourceRevision } from "../../../lib/career/target/source";
import { createT12JHistoricalFixture } from "../../career/relation/outcome-valence-feedback-admission-declaration/t12j-historical-fixture";
import { createT13HHistoricalFixture } from "../../career/relation/outcome-valence-feedback-context-revision-persistence/t13h-historical-fixture";

export const localFixtureStamp = "2026-10-09T00:00:00.000Z";

const hex32 = (seed: string) => createHash("sha256").update(seed, "utf8").digest("hex").slice(0, 32).toUpperCase();

/** The marker lives only in Capability Core payload fields; it must never reach a Decision revision. */
export const LOCAL_SNAPSHOT_PAYLOAD_MARKER = "G2G3_LOCAL_SNAPSHOT_PAYLOAD_MARKER_51C0";

export function createPhase4SnapshotFixture(marker = LOCAL_SNAPSHOT_PAYLOAD_MARKER, verificationRunId = "VFY_0123456789ABCDEF01234567"): VerifiedCapabilitySnapshot {
  const generic = createVerifiedCapabilitySnapshot({
    sourceBundleHash: "source-g2g3",
    kernelVersion: "kernel-g2g3",
    prompt: { checksum: "prompt-g2g3" },
    inference: { provider: "test", model: marker },
    schemaVersion: "snapshot-g2g3",
    candidateCount: 0,
    rejectedCandidateCount: 0,
    createdAt: localFixtureStamp,
    status: "VERIFIED"
  }, [], []);
  const publication = { mode: "PHASE4_VERIFIED" as const, verificationRunId, verificationRawOutputHash: "a".repeat(64) };
  return { ...generic, publication, snapshotId: buildSnapshotId({ ...generic, publication }) };
}

export const recommendationPolicyFixture = (): RecommendationPolicyRevision => {
  const semantic = {
    provenance: { origin: "EXPLICIT_POLICY_DECLARATION" as const, actorId: "POLICY_G2G3", authorityEvidenceRef: "evidence://policy/g2g3" },
    rules: [
      { evolutionInputClass: "INCREASE_DEMONSTRATED_LEVEL_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "DEMONSTRATED_LEVEL_RECOMMENDATION" as const },
      { evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "SEMANTIC_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
      { evolutionInputClass: "RESOLVE_TARGET_UNCERTAINTY_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "TARGET_UNCERTAINTY_RESOLUTION_RECOMMENDATION" as const },
      { evolutionInputClass: "STRENGTHEN_EVIDENCE_INPUT" as const, action: "PROPOSE" as const, recommendationKind: "EVIDENCE_STRENGTHENING_RECOMMENDATION" as const }
    ],
    recommendationPolicyImplementationVersion: "recommendation-v1",
    schemaVersion: "RECOMMENDATION_POLICY_REVISION_V1" as const
  };
  return { recommendationPolicyRevisionId: deriveRecommendationPolicyRevisionId(semantic), ...semantic, createdAt: localFixtureStamp };
};

/**
 * One exact artifact per resolvable G3 family, built with the pure create/derive functions
 * of the field. Upstream ids are coherent (RRL -> TSN -> EIS -> RCP over one snapshot and one
 * profile) so the same fixture also serves the HR context layer.
 */
export async function createCareerCanonicalLocalFixture(key = "G2G3") {
  const stamp = localFixtureStamp;
  const snapshot = createPhase4SnapshotFixture();
  const source = createTargetSourceRevision({ targetSourceEntityId: `SOURCE_${key}`, previousRevisionId: null, sourceKind: "DOCUMENT", sourceLocator: `source://${key}`, rawContentHash: "a".repeat(64), normalizedContentHash: "b".repeat(64), normalizedContent: `${key} TypeScript PostgreSQL`, normalizationVersion: "v1", schemaVersion: "TARGET_SOURCE_REVISION_V1", createdAt: stamp });
  const organization = createTargetOrganizationRevision({ targetOrganizationEntityId: `ORG_${key}`, previousRevisionId: null, organizationDescriptor: `Org ${key}`, descriptorKind: "DECLARED_NAME", schemaVersion: "TARGET_ORGANIZATION_REVISION_V1", createdAt: stamp });
  const roleSource = createTargetRoleSourceBindingRevision({ targetRoleEntityId: `ROLE_${key}`, targetSourceRevisionId: source.targetSourceRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_SOURCE_BINDING_REVISION_V1", createdAt: stamp });
  const binding = createTargetRoleOrganizationBindingRevision({ targetRoleEntityId: `ROLE_${key}`, targetRoleSourceBindingRevisionId: roleSource.targetRoleSourceBindingRevisionId, targetOrganizationRevisionId: organization.targetOrganizationRevisionId, previousRevisionId: null, schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1", createdAt: stamp });
  const profile = createTargetRoleProfileRevision({ targetRoleEntityId: `ROLE_${key}`, targetRoleOrganizationBindingRevisionId: binding.targetRoleOrganizationBindingRevisionId, previousRevisionId: null, profile: { roleDescriptor: null, roleSemanticDefinition: `Platform role ${key}`, responsibilityScope: null, seniorityInterpretation: null, domainContext: null }, proposalState: "PROPOSAL_ONLY", sourceEvidenceState: "SOURCE_MATCH_VERIFIED", semanticValidationState: "NOT_RUN", authorityState: "NONE", schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1", createdAt: stamp });
  const requirement = (entity: string, statement: string, necessity: "REQUIRED" | "OPTIONAL") => createTargetRequirementRevision({ targetRequirementEntityId: entity, targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId, previousRevisionId: null, requirement: { normalizedStatement: statement, requirementType: "CAPABILITY", capabilityExpression: statement, structuralDefinition: `${statement} capability`, requiredLevelState: { kind: "NOT_APPLICABLE" }, necessityState: { kind: necessity }, scopeContextState: { kind: "NOT_APPLICABLE" } }, evidence: [{ exactQuote: statement }], sourceEvidenceState: "SOURCE_MATCH_VERIFIED", classificationValidationState: "VALIDATED", semanticInterpretationState: "VALIDATED", requiredLevelValidationState: "NOT_APPLICABLE", necessityValidationState: "SUPPORTED", scopeValidationState: "NOT_APPLICABLE", matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY", proposalState: "PROPOSAL_ONLY", authorityState: "NONE", schemaVersion: "TARGET_REQUIREMENT_REVISION_V1", createdAt: stamp });
  const requirementA = requirement(`REQ_${key}_A`, "TypeScript", "REQUIRED");
  const requirementB = requirement(`REQ_${key}_B`, "PostgreSQL", "OPTIONAL");
  const inventoryId = `TRQINV_${hex32(`inventory-${key}`)}`;

  const coverage = (revision: typeof requirementA, necessity: "REQUIRED" | "OPTIONAL") => ({ targetRequirementEntityId: revision.targetRequirementEntityId, targetRequirementRevisionIds: [revision.targetRequirementRevisionId], necessityStates: [{ targetRequirementRevisionId: revision.targetRequirementRevisionId, necessityState: necessity }], disposition: "NO_AGGREGATE" as const, requirementRelationAggregateIds: [] as string[] });
  const roleSemantic = {
    verifiedCapabilitySnapshotId: snapshot.snapshotId,
    targetRoleProfileRevisionId: profile.targetRoleProfileRevisionId,
    targetRoleRequirementInventoryId: inventoryId,
    requirementCoverages: [coverage(requirementA, "REQUIRED"), coverage(requirementB, "OPTIONAL")],
    requirementRelationAggregateIds: [] as string[],
    aggregateDimensionInventories: [] as never[],
    pairTerminalInventory: { MATERIALIZED_RELATION: { count: 0, references: [] as string[] }, EVALUATION_FAILED: { count: 0, references: [] as string[] }, NOT_EVALUATED: { count: 0, references: [] as string[] } },
    necessityInventory: { REQUIRED: { count: 1, targetRequirementRevisionIds: [requirementA.targetRequirementRevisionId] }, PREFERRED: { count: 0, targetRequirementRevisionIds: [] as string[] }, OPTIONAL: { count: 1, targetRequirementRevisionIds: [requirementB.targetRequirementRevisionId] }, CONDITIONAL: { count: 0, targetRequirementRevisionIds: [] as string[] }, UNKNOWN: { count: 0, targetRequirementRevisionIds: [] as string[] } },
    composition: { state: "COMPOSITION_NOT_EVALUATED" as const },
    structuralStateInventory: ["NO_AGGREGATE"],
    lineage: { roleRequirementCoveragePolicyVersion: "coverage-v1", roleDimensionInventoryPolicyVersion: "dimension-v1", roleNecessityPolicyVersion: "necessity-v1", roleCompositionPolicyVersion: "composition-v1" },
    proposalState: "PROPOSAL_ONLY" as const,
    authorityState: "NONE" as const,
    schemaVersion: "ROLE_RELATION_V1" as const
  };
  const roleRelation = { roleRelationId: deriveRoleRelationId(roleSemantic as unknown as Omit<RoleRelation, "roleRelationId" | "createdAt">), ...roleSemantic, createdAt: stamp } as unknown as RoleRelation;
  const tensionState = classifyRoleRelation(roleRelation, { version: "tension-v1" }, stamp);
  const evolutionInputState = deriveEvolutionInputState(tensionState, { version: "evolution-v1" }, stamp);
  const policy = recommendationPolicyFixture();
  const recommendationProposal = deriveRecommendationProposal(evolutionInputState, policy, { version: "recommendation-v1" }, stamp);
  const organizationRelation = createOrganizationRelation({
    targetOrganizationRevision: organization,
    roleRelationMemberships: [{ roleRelation, targetRoleProfileRevision: profile, targetRoleOrganizationBindingRevision: binding }],
    aggregationPolicy: { schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1", organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1", aggregationMode: "ROLE_RELATION_INVENTORY_ONLY" },
    createdAt: stamp
  });
  const evaluationResult = createCapabilityRequirementRelationEvaluationResult({
    capabilityRequirementRelationEvaluationRunId: `CRRUN_${hex32(`run-${key}`)}`,
    candidate: { candidateCapabilityOperandId: `CCOP_${hex32(`operand-${key}`)}`, verifiedCapabilitySnapshotId: snapshot.snapshotId, capabilityId: `CAP_${hex32(`capability-${key}`)}` },
    targetRequirementRevisionId: requirementA.targetRequirementRevisionId,
    resultState: "FAILED",
    evaluation: null,
    failureCode: "PRODUCER_FAILED",
    schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_V1",
    createdAt: stamp
  });
  const t12j = createT12JHistoricalFixture();
  const t13h = await createT13HHistoricalFixture();

  return {
    snapshot,
    source,
    organization,
    roleSource,
    binding,
    profile,
    requirementA,
    requirementB,
    roleRelation,
    tensionState,
    evolutionInputState,
    policy,
    recommendationProposal,
    organizationRelation,
    evaluationResult,
    actionOccurrence: t12j.occurrence,
    stateChangeDeclaration: t12j.stateChangeDeclaration,
    associationDeclaration: t12j.associationDeclaration,
    outcomeRoleDeclaration: t12j.outcomeRoleDeclaration,
    outcomeValenceDeclaration: t12j.outcomeValenceDeclaration,
    feedbackContextRevision: t13h.firstRevision
  };
}

export type CareerCanonicalLocalFixture = Awaited<ReturnType<typeof createCareerCanonicalLocalFixture>>;
