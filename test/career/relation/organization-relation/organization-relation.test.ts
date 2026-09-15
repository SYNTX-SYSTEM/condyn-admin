import { describe, expect, it } from "vitest";
import {
  InMemoryCapabilityCoreRepository,
  deriveCandidateCapabilityOperand,
} from "../../../../lib/career/capability-core";
import {
  InMemoryRequirementInventoryRepository,
  buildRequirementRelationAggregate,
  buildTargetRoleRequirementInventory,
  type T6BPairRepository,
} from "../../../../lib/career/relation/requirement-inventory";
import { produceRoleRelation } from "../../../../lib/career/relation/role-relation";
import {
  createCapabilityRequirementRelationEvaluationResult,
  createCapabilityRequirementRelationEvaluationRun,
} from "../../../../lib/career/relation/capability-requirement";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import {
  createTargetRoleOrganizationBindingRevision,
  createTargetRoleProfileRevision,
} from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";

const loadOrganizationRelation = () => import(
  "../../../../lib/career/relation/organization-relation"
) as Promise<any>;

const stamp = "2027-03-01T00:00:00.000Z";
const policy = {
  schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1",
  organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1",
  aggregationMode: "ROLE_RELATION_INVENTORY_ONLY",
};
const protocol = {
  relationProducerVersion: "relation-v1",
  requirementAdmissionPolicyVersion: "admission-v1",
  semanticPolicyVersion: "semantic-v1",
  levelPolicyVersion: "level-v1",
  scopePolicyVersion: "scope-v1",
  evidencePolicyVersion: "evidence-v1",
};
const lineage = {
  roleRequirementCoveragePolicyVersion: "coverage-v1",
  roleDimensionInventoryPolicyVersion: "dimension-v1",
  roleNecessityPolicyVersion: "necessity-v1",
  roleCompositionPolicyVersion: "composition-v1",
};
type Candidate = { repository: InMemoryCapabilityCoreRepository; snapshot: any };
type Membership = {
  roleRelation: any;
  targetRoleProfileRevision: any;
  targetRoleOrganizationBindingRevision: any;
};

async function candidate(seed: string): Promise<Candidate> {
  const repository = new InMemoryCapabilityCoreRepository();
  const phase4 = createPhase4Input(seed);
  await repository.saveRun(phase4.discoveryRun);
  await repository.saveConvergenceRun(phase4.convergenceRun);
  await repository.saveVerificationRun(phase4.verificationRun);
  return {
    repository,
    snapshot: await repository.createVerifiedCapabilitySnapshotPublisher().publish(phase4),
  };
}

function binding(targetRoleEntityId: string, targetOrganizationRevisionId: string, source: string) {
  return createTargetRoleOrganizationBindingRevision({
    targetRoleEntityId,
    targetRoleSourceBindingRevisionId: source,
    targetOrganizationRevisionId,
    previousRevisionId: null,
    schemaVersion: "TARGET_ROLE_ORGANIZATION_BINDING_REVISION_V1",
    createdAt: stamp,
  });
}

function profile(targetRoleEntityId: string, bindingRevisionId: string, previousRevisionId: string | null, definition: string) {
  return createTargetRoleProfileRevision({
    targetRoleEntityId,
    targetRoleOrganizationBindingRevisionId: bindingRevisionId,
    previousRevisionId,
    profile: {
      roleDescriptor: null,
      roleSemanticDefinition: definition,
      responsibilityScope: null,
      seniorityInterpretation: null,
      domainContext: null,
    },
    proposalState: "PROPOSAL_ONLY",
    sourceEvidenceState: "SOURCE_MATCH_VERIFIED",
    semanticValidationState: "NOT_RUN",
    authorityState: "NONE",
    schemaVersion: "TARGET_ROLE_PROFILE_REVISION_V1",
    createdAt: stamp,
  });
}

async function roleRelation(
  candidateValue: Candidate,
  profileValue: any,
  key: string,
  options: { noAggregate?: boolean; evaluationFailed?: boolean } = {},
): Promise<any> {
  const requirement = createTargetRequirementRevision({
    targetRequirementEntityId: `TARGET_REQUIREMENT_${key}`,
    targetRoleProfileRevisionId: profileValue.targetRoleProfileRevisionId,
    previousRevisionId: null,
    requirement: {
      normalizedStatement: `${key} capability`,
      requirementType: "CAPABILITY",
      capabilityExpression: "TypeScript",
      structuralDefinition: "Typed capability",
      requiredLevelState: { kind: "NOT_APPLICABLE" },
      necessityState: { kind: "REQUIRED" },
      scopeContextState: { kind: "NOT_APPLICABLE" },
    },
    evidence: [{ exactQuote: `${key} capability` }],
    sourceEvidenceState: "SOURCE_MATCH_VERIFIED",
    classificationValidationState: "VALIDATED",
    semanticInterpretationState: "VALIDATED",
    requiredLevelValidationState: "NOT_APPLICABLE",
    necessityValidationState: "SUPPORTED",
    scopeValidationState: "NOT_APPLICABLE",
    matchingEligibility: "MATCHING_ELIGIBLE_PROPOSAL_ONLY",
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
    schemaVersion: "TARGET_REQUIREMENT_REVISION_V1",
    createdAt: stamp,
  });
  const inventory = await buildTargetRoleRequirementInventory({
    targetRoleProfileRevisionId: profileValue.targetRoleProfileRevisionId,
    requirementInventoryPolicyVersion: "inventory-v1",
    createdAt: stamp,
  }, {
    listTargetRequirementRevisionsByTargetRoleProfileRevisionId: async () => [requirement],
  });
  const operand = await deriveCandidateCapabilityOperand({
    verifiedCapabilitySnapshotId: candidateValue.snapshot.snapshotId,
    capabilityId: candidateValue.snapshot.capabilities[0].capabilityId,
  }, candidateValue.repository);
  const failedRun = options.evaluationFailed ? createCapabilityRequirementRelationEvaluationRun({
    candidate: {
      candidateCapabilityOperandId: operand.candidateCapabilityOperandId,
      verifiedCapabilitySnapshotId: operand.identity.verifiedCapabilitySnapshotId,
      capabilityId: operand.identity.capabilityId,
    },
    targetRequirementRevisionId: requirement.targetRequirementRevisionId,
    producer: { ...protocol, promptChecksum: "failure-prompt", provider: "fixture", model: "fixture", outputSchemaVersion: "fixture-v1" },
    status: "VALIDATION_FAILED",
    rawProviderOutputRef: null,
    rawProviderOutputHash: null,
    failureCode: "FIXTURE_FAILURE",
    schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RUN_V1",
    startedAt: stamp,
    completedAt: stamp,
  }) : null;
  const failedResult = failedRun === null ? null : createCapabilityRequirementRelationEvaluationResult({
    capabilityRequirementRelationEvaluationRunId: failedRun.capabilityRequirementRelationEvaluationRunId,
    candidate: {
      candidateCapabilityOperandId: operand.candidateCapabilityOperandId,
      verifiedCapabilitySnapshotId: operand.identity.verifiedCapabilitySnapshotId,
      capabilityId: operand.identity.capabilityId,
    },
    targetRequirementRevisionId: requirement.targetRequirementRevisionId,
    resultState: "FAILED",
    evaluation: null,
    failureCode: "FIXTURE_FAILURE",
    schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RESULT_V1",
    createdAt: stamp,
  });
  const terminal: T6BPairRepository = {
    getRelationById: async () => null,
    getResultById: async (id) => id === failedResult?.capabilityRequirementRelationEvaluationResultId ? structuredClone(failedResult) : null,
    getRunById: async (id) => id === failedRun?.capabilityRequirementRelationEvaluationRunId ? structuredClone(failedRun) : null,
    discoverPairTerminal: async () => ({ disposition: "NOT_EVALUATED" }),
  };
  const aggregate = await buildRequirementRelationAggregate({
    inventory,
    verifiedCapabilitySnapshotId: candidateValue.snapshot.snapshotId,
    targetRequirementEntityId: requirement.targetRequirementEntityId,
    targetRequirementRevisionId: requirement.targetRequirementRevisionId,
    candidateCapabilityOperandIds: [operand.candidateCapabilityOperandId],
    pairDispositions: [{
      candidateCapabilityOperandId: operand.candidateCapabilityOperandId,
      disposition: options.evaluationFailed ? "EVALUATION_FAILED" : "NOT_EVALUATED",
      capabilityRequirementRelationId: null,
      capabilityRequirementRelationEvaluationResultId: failedResult?.capabilityRequirementRelationEvaluationResultId ?? null,
    }],
    t6bProtocol: protocol,
    pairInventoryPolicyVersion: "pair-v1",
    compositionPolicyVersion: "composition-v1",
    createdAt: stamp,
  }, terminal);
  const inventories = new InMemoryRequirementInventoryRepository();
  await inventories.persistInventory(inventory);
  if (!options.noAggregate) await inventories.persistAggregate(aggregate);
  return produceRoleRelation({
    verifiedCapabilitySnapshotId: candidateValue.snapshot.snapshotId,
    targetRoleProfileRevision: profileValue,
    inventory,
    createdAt: stamp,
    lineage,
  }, { aggregates: inventories, candidateRepository: candidateValue.repository });
}

async function fixture() {
  const organization = createTargetOrganizationRevision({
    targetOrganizationEntityId: "TARGET_ORGANIZATION_T15",
    previousRevisionId: null,
    organizationDescriptor: "Declared Organization",
    descriptorKind: "DECLARED_NAME",
    schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
    createdAt: stamp,
  });
  const primaryCandidate = await candidate("T15_PRIMARY");
  const alternateCandidate = await candidate("T15_ALTERNATE");

  const alphaBinding = binding("TARGET_ROLE_ALPHA", organization.targetOrganizationRevisionId, "TRSBREV_ALPHA");
  const alphaProfile = profile("TARGET_ROLE_ALPHA", alphaBinding.targetRoleOrganizationBindingRevisionId, null, "Alpha role");
  const alphaHistoricalBinding = binding("TARGET_ROLE_ALPHA", organization.targetOrganizationRevisionId, "TRSBREV_ALPHA_HISTORICAL");
  const alphaHistoricalProfile = profile("TARGET_ROLE_ALPHA", alphaHistoricalBinding.targetRoleOrganizationBindingRevisionId, alphaProfile.targetRoleProfileRevisionId, "Alpha historical role revision");
  const betaBinding = binding("TARGET_ROLE_BETA", organization.targetOrganizationRevisionId, "TRSBREV_BETA");
  const betaProfile = profile("TARGET_ROLE_BETA", betaBinding.targetRoleOrganizationBindingRevisionId, null, "Beta role");

  const alpha: Membership = {
    roleRelation: await roleRelation(primaryCandidate, alphaProfile, "ALPHA"),
    targetRoleProfileRevision: alphaProfile,
    targetRoleOrganizationBindingRevision: alphaBinding,
  };
  const beta: Membership = {
    roleRelation: await roleRelation(primaryCandidate, betaProfile, "BETA"),
    targetRoleProfileRevision: betaProfile,
    targetRoleOrganizationBindingRevision: betaBinding,
  };
  const alphaHistorical: Membership = {
    roleRelation: await roleRelation(primaryCandidate, alphaHistoricalProfile, "ALPHA_HISTORICAL"),
    targetRoleProfileRevision: alphaHistoricalProfile,
    targetRoleOrganizationBindingRevision: alphaHistoricalBinding,
  };
  const betaAlternateCandidate: Membership = {
    roleRelation: await roleRelation(alternateCandidate, betaProfile, "BETA_ALT_CANDIDATE"),
    targetRoleProfileRevision: betaProfile,
    targetRoleOrganizationBindingRevision: betaBinding,
  };
  return { organization, primaryCandidate, alpha, beta, alphaHistorical, betaAlternateCandidate };
}

const input = (value: any, memberships: Membership[], createdAt = "2027-03-02T00:00:00.000Z") => ({
  targetOrganizationRevision: structuredClone(value.organization),
  roleRelationMemberships: structuredClone(memberships),
  aggregationPolicy: structuredClone(policy),
  createdAt,
});

/*
 * T15 freezes only an exact supplied organization-scoped role-relation inventory.
 * It remains distinct from fit, resonance truth, completeness, selection, and recommendation.
 */
describe("OrganizationRelation V1 frozen contract", () => {
  it("constructs only sealed organization/profile/binding/RoleRelation witnesses before the absent OrganizationRelation import", async () => {
    const value = await fixture();
    expect(value.alpha.roleRelation.verifiedCapabilitySnapshotId)
      .toBe(value.beta.roleRelation.verifiedCapabilitySnapshotId);
    expect(value.alpha.targetRoleOrganizationBindingRevision.targetOrganizationRevisionId)
      .toBe(value.organization.targetOrganizationRevisionId);
    expect(value.alphaHistorical.targetRoleProfileRevision.targetRoleEntityId)
      .toBe(value.alpha.targetRoleProfileRevision.targetRoleEntityId);
    expect(value.alphaHistorical.targetRoleProfileRevision.targetRoleProfileRevisionId)
      .not.toBe(value.alpha.targetRoleProfileRevision.targetRoleProfileRevisionId);
    expect(value.betaAlternateCandidate.roleRelation.verifiedCapabilitySnapshotId)
      .not.toBe(value.beta.roleRelation.verifiedCapabilitySnapshotId);
    expect(value.alpha.roleRelation.proposalState).toBe("PROPOSAL_ONLY");
    expect(value.alpha.roleRelation.composition).toEqual({ state: "COMPOSITION_NOT_EVALUATED" });
  });

  it("freezes the exact public V1 surface, seven-field relation root, membership witnesses, and inventory-only policy", async () => {
    const api = await loadOrganizationRelation();
    const value = await fixture();
    expect(api.ORGANIZATION_RELATION_SCHEMA_VERSION).toBe("ORGANIZATION_RELATION_V1");
    expect(api.ORGANIZATION_RELATION_AGGREGATION_POLICY_SCHEMA_VERSION)
      .toBe("ORGANIZATION_RELATION_AGGREGATION_POLICY_V1");
    expect(api.ORGANIZATION_RELATION_INVENTORY_ONLY_POLICY_VERSION)
      .toBe("ORGANIZATION_RELATION_INVENTORY_ONLY_V1");
    expect(api.createOrganizationRelation).toBeTypeOf("function");
    expect(api.deriveOrganizationRelationId).toBeTypeOf("function");
    expect(api.assertOrganizationRelation).toBeTypeOf("function");
    expect(api.stableOrganizationRelation).toBeTypeOf("function");
    const result = api.createOrganizationRelation(input(value, [value.alpha]));
    expect(Object.keys(result).sort()).toEqual([
      "aggregationPolicy", "createdAt", "organizationRelationId", "roleRelationMemberships",
      "schemaVersion", "targetOrganizationRevision", "verifiedCapabilitySnapshotId",
    ]);
    expect(result.organizationRelationId).toMatch(/^ORL_[A-F0-9]{32}$/);
    expect(result.verifiedCapabilitySnapshotId).toBe(value.alpha.roleRelation.verifiedCapabilitySnapshotId);
    expect(Object.keys(result.roleRelationMemberships[0]).sort()).toEqual([
      "roleRelation", "targetRoleOrganizationBindingRevision", "targetRoleProfileRevision",
    ]);
    expect(result.aggregationPolicy).toEqual(policy);
    for (const forbidden of [
      "score", "fit", "resonance", "qualification", "recommendation", "decision", "tension",
      "completeness", "current", "latest", "head", "requirementRelationIds", "persist", "replay",
    ]) expect(result).not.toHaveProperty(forbidden);
  });

  it("freezes lawful one/many/historical-role inventories, deterministic ordering, and audit-excluded identity", async () => {
    const api = await loadOrganizationRelation();
    const value = await fixture();
    const one = api.createOrganizationRelation(input(value, [value.alpha]));
    const manyReverse = api.createOrganizationRelation(input(value, [value.beta, value.alpha]));
    const manySorted = api.createOrganizationRelation(input(value, [value.alpha, value.beta]));
    const historical = api.createOrganizationRelation(input(value, [value.alpha, value.alphaHistorical]));
    expect(manyReverse.organizationRelationId).toBe(manySorted.organizationRelationId);
    expect(manyReverse.roleRelationMemberships.map((entry: any) => entry.roleRelation.roleRelationId))
      .toEqual([...manyReverse.roleRelationMemberships.map((entry: any) => entry.roleRelation.roleRelationId)].sort());
    expect(historical.roleRelationMemberships.map((entry: any) => entry.targetRoleProfileRevision.targetRoleEntityId))
      .toEqual(["TARGET_ROLE_ALPHA", "TARGET_ROLE_ALPHA"]);
    expect(historical.organizationRelationId).not.toBe(one.organizationRelationId);
    expect(api.createOrganizationRelation(input(value, [value.alpha], "2027-03-03T00:00:00.000Z")).organizationRelationId)
      .toBe(one.organizationRelationId);
    const organizationLaterAudit = { ...structuredClone(value.organization), createdAt: "2027-03-03T00:00:00.000Z" };
    expect(api.createOrganizationRelation({ ...input(value, [value.alpha]), targetOrganizationRevision: organizationLaterAudit }).organizationRelationId)
      .toBe(one.organizationRelationId);
    const membershipLaterAudit = structuredClone(value.alpha);
    membershipLaterAudit.roleRelation.createdAt = "2027-03-03T00:00:00.000Z";
    membershipLaterAudit.targetRoleProfileRevision.createdAt = "2027-03-03T00:00:00.000Z";
    membershipLaterAudit.targetRoleOrganizationBindingRevision.createdAt = "2027-03-03T00:00:00.000Z";
    expect(api.createOrganizationRelation(input(value, [membershipLaterAudit])).organizationRelationId)
      .toBe(one.organizationRelationId);
    expect(api.createOrganizationRelation(input(value, [value.beta])).organizationRelationId).not.toBe(one.organizationRelationId);
    const { targetOrganizationRevisionId: _organizationId, ...organizationInput } = value.organization;
    const organizationSemanticChange = createTargetOrganizationRevision({
      ...organizationInput,
      previousRevisionId: value.organization.targetOrganizationRevisionId,
      organizationDescriptor: "Changed declared descriptor",
      createdAt: "2027-03-04T00:00:00.000Z",
    });
    const changedBinding = binding("TARGET_ROLE_ALPHA", organizationSemanticChange.targetOrganizationRevisionId, "TRSBREV_ALPHA_CHANGED_ORG");
    const changedProfile = profile("TARGET_ROLE_ALPHA", changedBinding.targetRoleOrganizationBindingRevisionId, null, "Changed organization scope");
    const changedRole = await roleRelation(value.primaryCandidate, changedProfile, "CHANGED_ORGANIZATION");
    expect(api.createOrganizationRelation({
      ...input(value, [{
        roleRelation: changedRole,
        targetRoleProfileRevision: changedProfile,
        targetRoleOrganizationBindingRevision: changedBinding,
      }]),
      targetOrganizationRevision: organizationSemanticChange,
    }).organizationRelationId).not.toBe(one.organizationRelationId);
    expect(() => api.createOrganizationRelation({ ...input(value, [value.alpha]), aggregationPolicy: { ...policy, aggregationMode: "WEIGHTED_SCORE" } }))
      .toThrow("ERR_ORGANIZATION_RELATION_AGGREGATION_POLICY_INVALID");
  });

  it("freezes standalone-invalid precedence, candidate/linkage/duplicate failures, and no negative reinterpretation", async () => {
    const api = await loadOrganizationRelation();
    const value = await fixture();
    expect(() => api.createOrganizationRelation({ ...input(value, [value.alpha]), targetOrganizationRevision: {} }))
      .toThrow("ERR_ORGANIZATION_RELATION_ORGANIZATION_INVALID");
    expect(() => api.createOrganizationRelation({ ...input(value, [{ ...value.alpha, roleRelation: {} }]) }))
      .toThrow("ERR_ORGANIZATION_RELATION_ROLE_RELATION_INVALID");
    expect(() => api.createOrganizationRelation({ ...input(value, [{ ...value.alpha, targetRoleProfileRevision: {} }]) }))
      .toThrow("ERR_ORGANIZATION_RELATION_ROLE_PROFILE_INVALID");
    expect(() => api.createOrganizationRelation({ ...input(value, [{ ...value.alpha, targetRoleOrganizationBindingRevision: {} }]) }))
      .toThrow("ERR_ORGANIZATION_RELATION_ROLE_ORGANIZATION_BINDING_INVALID");
    expect(() => api.createOrganizationRelation(input(value, []))).toThrow("ERR_ORGANIZATION_RELATION_EMPTY_INVENTORY");
    expect(() => api.createOrganizationRelation(input(value, [value.alpha, value.betaAlternateCandidate])))
      .toThrow("ERR_ORGANIZATION_RELATION_CANDIDATE_SNAPSHOT_MISMATCH");
    expect(() => api.createOrganizationRelation(input(value, [value.alpha, { ...value.beta, targetRoleProfileRevision: value.alpha.targetRoleProfileRevision }])))
      .toThrow("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    expect(() => api.createOrganizationRelation(input(value, [value.alpha, { ...value.beta, targetRoleOrganizationBindingRevision: value.alpha.targetRoleOrganizationBindingRevision }])))
      .toThrow("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    expect(() => api.createOrganizationRelation(input(value, [value.alpha, structuredClone(value.alpha)])))
      .toThrow("ERR_ORGANIZATION_RELATION_DUPLICATE_ROLE_RELATION");
    const duplicateProfile = {
      roleRelation: await roleRelation(value.primaryCandidate, value.alpha.targetRoleProfileRevision, "DUPLICATE_PROFILE"),
      targetRoleProfileRevision: value.alpha.targetRoleProfileRevision,
      targetRoleOrganizationBindingRevision: value.alpha.targetRoleOrganizationBindingRevision,
    };
    expect(() => api.createOrganizationRelation(input(value, [value.alpha, duplicateProfile])))
      .toThrow("ERR_ORGANIZATION_RELATION_DUPLICATE_ROLE_PROFILE");
    const entityMismatchBinding = binding("TARGET_ROLE_ENTITY_OTHER", value.organization.targetOrganizationRevisionId, "TRSBREV_ENTITY_OTHER");
    const entityMismatchProfile = profile("TARGET_ROLE_ENTITY_PROFILE", entityMismatchBinding.targetRoleOrganizationBindingRevisionId, null, "Entity mismatch profile");
    const entityMismatch = {
      roleRelation: await roleRelation(value.primaryCandidate, entityMismatchProfile, "ENTITY_MISMATCH"),
      targetRoleProfileRevision: entityMismatchProfile,
      targetRoleOrganizationBindingRevision: entityMismatchBinding,
    };
    expect(() => api.createOrganizationRelation(input(value, [entityMismatch])))
      .toThrow("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    const { targetOrganizationRevisionId: _otherOrganizationId, ...otherOrganizationInput } = value.organization;
    const otherOrganization = createTargetOrganizationRevision({
      ...otherOrganizationInput,
      previousRevisionId: value.organization.targetOrganizationRevisionId,
      organizationDescriptor: "Other declared descriptor",
      createdAt: "2027-03-04T00:00:00.000Z",
    });
    const organizationMismatchBinding = binding("TARGET_ROLE_OTHER_ORG", otherOrganization.targetOrganizationRevisionId, "TRSBREV_OTHER_ORG");
    const organizationMismatchProfile = profile("TARGET_ROLE_OTHER_ORG", organizationMismatchBinding.targetRoleOrganizationBindingRevisionId, null, "Organization mismatch profile");
    const organizationMismatch = {
      roleRelation: await roleRelation(value.primaryCandidate, organizationMismatchProfile, "ORGANIZATION_MISMATCH"),
      targetRoleProfileRevision: organizationMismatchProfile,
      targetRoleOrganizationBindingRevision: organizationMismatchBinding,
    };
    expect(() => api.createOrganizationRelation(input(value, [organizationMismatch])))
      .toThrow("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    expect(() => api.createOrganizationRelation({ ...input(value, [value.alpha]), verifiedCapabilitySnapshotId: "CALLER_SUPPLIED" }))
      .toThrow("ERR_ORGANIZATION_RELATION_INVALID");
    const unknownMembership = {
      roleRelation: await roleRelation(value.primaryCandidate, value.beta.targetRoleProfileRevision, "UNKNOWN", { noAggregate: true }),
      targetRoleProfileRevision: value.beta.targetRoleProfileRevision,
      targetRoleOrganizationBindingRevision: value.beta.targetRoleOrganizationBindingRevision,
    };
    const failureMembership = {
      roleRelation: await roleRelation(value.primaryCandidate, value.beta.targetRoleProfileRevision, "FAILURE", { evaluationFailed: true }),
      targetRoleProfileRevision: value.beta.targetRoleProfileRevision,
      targetRoleOrganizationBindingRevision: value.beta.targetRoleOrganizationBindingRevision,
    };
    expect(api.createOrganizationRelation(input(value, [unknownMembership])).roleRelationMemberships[0].roleRelation.requirementCoverages[0].disposition)
      .toBe("NO_AGGREGATE");
    expect(api.createOrganizationRelation(input(value, [failureMembership])).roleRelationMemberships[0].roleRelation.pairTerminalInventory.EVALUATION_FAILED.count)
      .toBe(1);
    const lawful = api.createOrganizationRelation(input(value, [value.alpha]));
    expect(lawful.roleRelationMemberships[0].roleRelation.structuralStateInventory)
      .toEqual(value.alpha.roleRelation.structuralStateInventory);
    expect(lawful.roleRelationMemberships[0].roleRelation.proposalState).toBe("PROPOSAL_ONLY");
    expect(Object.keys(lawful)).not.toContain("eligibilityState");
  });

  it("freezes deterministic assertion, deep detachment, and absence of persistence, replay, provider, TensionState, or authority surface", async () => {
    const api = await loadOrganizationRelation();
    const value = await fixture();
    const source = input(value, [value.alpha, value.beta]);
    const result = api.createOrganizationRelation(source);
    api.assertOrganizationRelation(result);
    expect(() => api.assertOrganizationRelation({ ...result, organizationRelationId: "ORL_00000000000000000000000000000000" }))
      .toThrow("ERR_ORGANIZATION_RELATION_ID_MISMATCH");
    source.targetOrganizationRevision.organizationDescriptor = "mutated";
    source.roleRelationMemberships[0].roleRelation.structuralStateInventory.push("MUTATED");
    source.roleRelationMemberships[0].targetRoleProfileRevision.profile.roleSemanticDefinition = "mutated";
    source.roleRelationMemberships[0].targetRoleOrganizationBindingRevision.targetRoleEntityId = "mutated";
    source.aggregationPolicy.aggregationMode = "mutated";
    expect(result.targetOrganizationRevision.organizationDescriptor).toBe("Declared Organization");
    expect(result.roleRelationMemberships[0].roleRelation.structuralStateInventory).not.toContain("MUTATED");
    expect(result.aggregationPolicy).toEqual(policy);
    for (const forbidden of [
      "OrganizationRelationRepository", "persistOrganizationRelation", "byteReplayOrganizationRelation",
      "semanticReplayOrganizationRelation", "derivationReplayOrganizationRelation", "produceTensionState",
      "createRecommendationProposal", "createGenericRelation", "resonanceScore", "getCurrentOrganizationRelation",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
