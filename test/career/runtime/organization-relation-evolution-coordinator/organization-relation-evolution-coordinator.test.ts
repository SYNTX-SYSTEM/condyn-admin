import { describe, expect, it } from "vitest";
import {
  InMemoryCapabilityCoreRepository,
  deriveCandidateCapabilityOperand,
} from "../../../../lib/career/capability-core";
import {
  createCapabilityRequirementRelationEvaluationResult,
  createCapabilityRequirementRelationEvaluationRun,
} from "../../../../lib/career/relation/capability-requirement";
import { deriveEvolutionInputState } from "../../../../lib/career/relation/evolution-input";
import {
  InMemoryRequirementInventoryRepository,
  buildRequirementRelationAggregate,
  buildTargetRoleRequirementInventory,
  type T6BPairRepository,
} from "../../../../lib/career/relation/requirement-inventory";
import { createOrganizationRelation } from "../../../../lib/career/relation/organization-relation";
import { produceRoleRelation } from "../../../../lib/career/relation/role-relation";
import { classifyRoleRelation } from "../../../../lib/career/relation/tension-state";
import { createTargetOrganizationRevision } from "../../../../lib/career/target/organization";
import {
  createTargetRoleOrganizationBindingRevision,
  createTargetRoleProfileRevision,
} from "../../../../lib/career/target/role";
import { createTargetRequirementRevision } from "../../../../lib/career/target/role/requirement";
import { createPhase4Input } from "../../capability-core/relation-operand/phase4-fixture";

const loadCoordinator = () => import(
  "../../../../lib/career/runtime/organization-relation-evolution-coordinator"
) as Promise<any>;

const sourceStamp = "2027-04-01T00:00:00.000Z";
const coordinatorStamp = "2027-04-02T00:00:00.000Z";
const aggregationPolicy = {
  schemaVersion: "ORGANIZATION_RELATION_AGGREGATION_POLICY_V1",
  organizationRelationAggregationPolicyVersion: "ORGANIZATION_RELATION_INVENTORY_ONLY_V1",
  aggregationMode: "ROLE_RELATION_INVENTORY_ONLY",
};
const tensionClassificationPolicy = { version: "tension-v1" };
const evolutionInputDerivationPolicy = { version: "evolution-v1" };
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
    createdAt: sourceStamp,
  });
}

function profile(targetRoleEntityId: string, bindingRevisionId: string, definition: string) {
  return createTargetRoleProfileRevision({
    targetRoleEntityId,
    targetRoleOrganizationBindingRevisionId: bindingRevisionId,
    previousRevisionId: null,
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
    createdAt: sourceStamp,
  });
}

async function roleRelation(
  candidateValue: Candidate,
  profileValue: any,
  key: string,
  options: {
    noAggregate?: boolean;
    evaluationFailed?: boolean;
    eligibility?: "MATCHING_ELIGIBLE_PROPOSAL_ONLY" | "MATCHING_INELIGIBLE" | "MATCHING_ELIGIBILITY_UNKNOWN";
  } = {},
): Promise<any> {
  const requirement = createTargetRequirementRevision({
    targetRequirementEntityId: `TARGET_REQUIREMENT_T16_${key}`,
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
    matchingEligibility: options.eligibility ?? "MATCHING_ELIGIBLE_PROPOSAL_ONLY",
    proposalState: "PROPOSAL_ONLY",
    authorityState: "NONE",
    schemaVersion: "TARGET_REQUIREMENT_REVISION_V1",
    createdAt: sourceStamp,
  });
  const inventory = await buildTargetRoleRequirementInventory({
    targetRoleProfileRevisionId: profileValue.targetRoleProfileRevisionId,
    requirementInventoryPolicyVersion: "inventory-v1",
    createdAt: sourceStamp,
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
    producer: {
      ...protocol,
      promptChecksum: "failure-prompt",
      provider: "fixture",
      model: "fixture",
      outputSchemaVersion: "fixture-v1",
    },
    status: "VALIDATION_FAILED",
    rawProviderOutputRef: null,
    rawProviderOutputHash: null,
    failureCode: "FIXTURE_FAILURE",
    schemaVersion: "CAPABILITY_REQUIREMENT_RELATION_EVALUATION_RUN_V1",
    startedAt: sourceStamp,
    completedAt: sourceStamp,
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
    createdAt: sourceStamp,
  });
  const terminal: T6BPairRepository = {
    getRelationById: async () => null,
    getResultById: async (id) => id === failedResult?.capabilityRequirementRelationEvaluationResultId
      ? structuredClone(failedResult)
      : null,
    getRunById: async (id) => id === failedRun?.capabilityRequirementRelationEvaluationRunId
      ? structuredClone(failedRun)
      : null,
    discoverPairTerminal: async () => ({ disposition: "NOT_EVALUATED" }),
  };
  const aggregate = options.eligibility === "MATCHING_INELIGIBLE" ? null
    : await buildRequirementRelationAggregate({
      inventory,
      verifiedCapabilitySnapshotId: candidateValue.snapshot.snapshotId,
      targetRequirementEntityId: requirement.targetRequirementEntityId,
      targetRequirementRevisionId: requirement.targetRequirementRevisionId,
      candidateCapabilityOperandIds: [operand.candidateCapabilityOperandId],
      pairDispositions: [{
        candidateCapabilityOperandId: operand.candidateCapabilityOperandId,
        disposition: options.evaluationFailed ? "EVALUATION_FAILED" : "NOT_EVALUATED",
        capabilityRequirementRelationId: null,
        capabilityRequirementRelationEvaluationResultId:
          failedResult?.capabilityRequirementRelationEvaluationResultId ?? null,
      }],
      t6bProtocol: protocol,
      pairInventoryPolicyVersion: "pair-v1",
      compositionPolicyVersion: "composition-v1",
      createdAt: sourceStamp,
    }, terminal);
  const inventories = new InMemoryRequirementInventoryRepository();
  await inventories.persistInventory(inventory);
  if (aggregate !== null && !options.noAggregate) await inventories.persistAggregate(aggregate);
  return produceRoleRelation({
    verifiedCapabilitySnapshotId: candidateValue.snapshot.snapshotId,
    targetRoleProfileRevision: profileValue,
    inventory,
    createdAt: sourceStamp,
    lineage,
  }, { aggregates: inventories, candidateRepository: candidateValue.repository });
}

async function fixture() {
  const organization = createTargetOrganizationRevision({
    targetOrganizationEntityId: "TARGET_ORGANIZATION_T16",
    previousRevisionId: null,
    organizationDescriptor: "Declared Organization",
    descriptorKind: "DECLARED_NAME",
    schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
    createdAt: sourceStamp,
  });
  const primaryCandidate = await candidate("T16_PRIMARY");
  const alternateCandidate = await candidate("T16_ALTERNATE");
  const alphaBinding = binding("TARGET_ROLE_ALPHA", organization.targetOrganizationRevisionId, "TRSBREV_T16_ALPHA");
  const alphaProfile = profile("TARGET_ROLE_ALPHA", alphaBinding.targetRoleOrganizationBindingRevisionId, "Alpha role");
  const betaBinding = binding("TARGET_ROLE_BETA", organization.targetOrganizationRevisionId, "TRSBREV_T16_BETA");
  const betaProfile = profile("TARGET_ROLE_BETA", betaBinding.targetRoleOrganizationBindingRevisionId, "Beta role");

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
  const alternateCandidateBeta: Membership = {
    roleRelation: await roleRelation(alternateCandidate, betaProfile, "BETA_ALTERNATE"),
    targetRoleProfileRevision: betaProfile,
    targetRoleOrganizationBindingRevision: betaBinding,
  };
  const unknown: Membership = {
    roleRelation: await roleRelation(primaryCandidate, betaProfile, "UNKNOWN", { noAggregate: true }),
    targetRoleProfileRevision: betaProfile,
    targetRoleOrganizationBindingRevision: betaBinding,
  };
  const evaluationFailed: Membership = {
    roleRelation: await roleRelation(primaryCandidate, betaProfile, "FAILURE", { evaluationFailed: true }),
    targetRoleProfileRevision: betaProfile,
    targetRoleOrganizationBindingRevision: betaBinding,
  };
  const ineligible: Membership = {
    roleRelation: await roleRelation(primaryCandidate, betaProfile, "INELIGIBLE", {
      eligibility: "MATCHING_INELIGIBLE",
    }),
    targetRoleProfileRevision: betaProfile,
    targetRoleOrganizationBindingRevision: betaBinding,
  };
  return {
    organization,
    primaryCandidate,
    alpha,
    beta,
    alternateCandidateBeta,
    unknown,
    evaluationFailed,
    ineligible,
  };
}

function input(value: any, memberships: Membership[], createdAt = coordinatorStamp) {
  return {
    targetOrganizationRevision: structuredClone(value.organization),
    roleRelationMemberships: structuredClone(memberships),
    aggregationPolicy: structuredClone(aggregationPolicy),
    tensionClassificationPolicy: structuredClone(tensionClassificationPolicy),
    evolutionInputDerivationPolicy: structuredClone(evolutionInputDerivationPolicy),
    createdAt,
  };
}

/* T16 is only deterministic application-service composition through the sealed EvolutionInput boundary. */
describe("OrganizationRelation evolution coordinator contract", () => {
  it("constructs sealed organization memberships and direct Tension/Evolution fixtures before the absent coordinator import", async () => {
    const value = await fixture();
    const relation = createOrganizationRelation({
      targetOrganizationRevision: structuredClone(value.organization),
      roleRelationMemberships: structuredClone([value.alpha, value.beta]),
      aggregationPolicy: structuredClone(aggregationPolicy),
      createdAt: coordinatorStamp,
    });
    const tension = classifyRoleRelation(value.alpha.roleRelation, tensionClassificationPolicy, coordinatorStamp);
    const evolution = deriveEvolutionInputState(tension, evolutionInputDerivationPolicy, coordinatorStamp);
    expect(relation.roleRelationMemberships).toHaveLength(2);
    expect(value.alpha.roleRelation.verifiedCapabilitySnapshotId)
      .toBe(value.beta.roleRelation.verifiedCapabilitySnapshotId);
    expect(tension.createdAt).toBe(coordinatorStamp);
    expect(evolution.createdAt).toBe(coordinatorStamp);
    expect(value.unknown.roleRelation.requirementCoverages[0].disposition).toBe("NO_AGGREGATE");
    expect(value.evaluationFailed.roleRelation.pairTerminalInventory.EVALUATION_FAILED.count).toBe(1);
    expect(value.ineligible.roleRelation.requirementCoverages[0].disposition).toBe("INELIGIBLE");
  });

  it("freezes the exact six-input, two-output, three-branch surface and canonical organization membership order", async () => {
    const api = await loadCoordinator();
    const value = await fixture();
    const reverseInput = input(value, [value.beta, value.alpha]);
    expect(Object.keys(reverseInput).sort()).toEqual([
      "aggregationPolicy", "createdAt", "evolutionInputDerivationPolicy", "roleRelationMemberships",
      "targetOrganizationRevision", "tensionClassificationPolicy",
    ]);
    expect(Object.keys(api)).toEqual(["composeOrganizationRelationEvolution"]);
    expect(api.composeOrganizationRelationEvolution).toBeTypeOf("function");
    const result = api.composeOrganizationRelationEvolution(reverseInput);
    expect(result).not.toBeInstanceOf(Promise);
    expect(Object.keys(result).sort()).toEqual(["organizationRelation", "roleBranches"]);
    expect(result.roleBranches).toHaveLength(2);
    expect(Object.keys(result.roleBranches[0]).sort()).toEqual([
      "evolutionInputState", "roleRelation", "tensionState",
    ]);
    const relationIds = result.organizationRelation.roleRelationMemberships
      .map((membership: any) => membership.roleRelation.roleRelationId);
    expect(relationIds).toEqual([...relationIds].sort());
    expect(result.roleBranches.map((branch: any) => branch.roleRelation.roleRelationId)).toEqual(relationIds);
    const sortedResult = api.composeOrganizationRelationEvolution(input(value, [value.alpha, value.beta]));
    expect(result.organizationRelation.organizationRelationId)
      .toBe(sortedResult.organizationRelation.organizationRelationId);
    expect(result.roleBranches.map((branch: any) => branch.roleRelation.roleRelationId))
      .toEqual(sortedResult.roleBranches.map((branch: any) => branch.roleRelation.roleRelationId));
    expect(api.composeOrganizationRelationEvolution(input(value, [value.alpha])).roleBranches).toHaveLength(1);
    const laterAudit = api.composeOrganizationRelationEvolution(
      input(value, [value.alpha, value.beta], "2027-04-03T00:00:00.000Z"),
    );
    expect(laterAudit.organizationRelation.organizationRelationId)
      .toBe(sortedResult.organizationRelation.organizationRelationId);
    expect(laterAudit.roleBranches.map((branch: any) => branch.tensionState.tensionStateId))
      .toEqual(sortedResult.roleBranches.map((branch: any) => branch.tensionState.tensionStateId));
    expect(laterAudit.roleBranches.map((branch: any) => branch.evolutionInputState.evolutionInputStateId))
      .toEqual(sortedResult.roleBranches.map((branch: any) => branch.evolutionInputState.evolutionInputStateId));
  });

  it("freezes common audit time, explicit policies, exact constituent errors, and all-or-nothing inventory construction", async () => {
    const api = await loadCoordinator();
    const value = await fixture();
    const result = api.composeOrganizationRelationEvolution(input(value, [value.alpha, value.beta]));
    expect(result.organizationRelation.createdAt).toBe(coordinatorStamp);
    expect(result.organizationRelation.aggregationPolicy).toEqual(aggregationPolicy);
    for (const branch of result.roleBranches) {
      expect(branch.tensionState.createdAt).toBe(coordinatorStamp);
      expect(branch.tensionState.classificationPolicyLineage).toEqual({ tensionClassificationPolicyVersion: "tension-v1" });
      expect(branch.evolutionInputState.createdAt).toBe(coordinatorStamp);
      expect(branch.evolutionInputState.derivationPolicyLineage)
        .toEqual({ evolutionInputDerivationPolicyVersion: "evolution-v1" });
    }
    expect(() => api.composeOrganizationRelationEvolution(input(value, [value.alpha, value.alternateCandidateBeta])))
      .toThrow("ERR_ORGANIZATION_RELATION_CANDIDATE_SNAPSHOT_MISMATCH");
    const otherOrganization = createTargetOrganizationRevision({
      targetOrganizationEntityId: "TARGET_ORGANIZATION_T16_OTHER",
      previousRevisionId: null,
      organizationDescriptor: "Other Declared Organization",
      descriptorKind: "DECLARED_NAME",
      schemaVersion: "TARGET_ORGANIZATION_REVISION_V1",
      createdAt: sourceStamp,
    });
    const otherBinding = binding(
      "TARGET_ROLE_OTHER_ORGANIZATION",
      otherOrganization.targetOrganizationRevisionId,
      "TRSBREV_T16_OTHER_ORGANIZATION",
    );
    const otherProfile = profile(
      "TARGET_ROLE_OTHER_ORGANIZATION",
      otherBinding.targetRoleOrganizationBindingRevisionId,
      "Other organization role",
    );
    const mismatchedOrganization = {
      roleRelation: await roleRelation(value.primaryCandidate, otherProfile, "OTHER_ORGANIZATION"),
      targetRoleProfileRevision: otherProfile,
      targetRoleOrganizationBindingRevision: otherBinding,
    };
    expect(() => api.composeOrganizationRelationEvolution(input(value, [value.alpha, mismatchedOrganization])))
      .toThrow("ERR_ORGANIZATION_RELATION_MEMBERSHIP_MISMATCH");
    expect(() => api.composeOrganizationRelationEvolution(input(value, [value.alpha, structuredClone(value.alpha)])))
      .toThrow("ERR_ORGANIZATION_RELATION_DUPLICATE_ROLE_RELATION");
    expect(() => api.composeOrganizationRelationEvolution({
      ...input(value, [value.alpha]), tensionClassificationPolicy: { version: "" },
    })).toThrow("ERR_TENSION_STATE_CLASSIFICATION_POLICY_UNAVAILABLE");
    expect(() => api.composeOrganizationRelationEvolution({
      ...input(value, [value.alpha]), evolutionInputDerivationPolicy: { version: "" },
    })).toThrow("ERR_EVOLUTION_INPUT_DERIVATION_POLICY_UNAVAILABLE");
    expect(() => api.composeOrganizationRelationEvolution(input(value, [])))
      .toThrow("ERR_ORGANIZATION_RELATION_EMPTY_INVENTORY");
  });

  it("preserves lawful failed, unknown, proposal-only, and eligibility-governed branch facts without downstream authority", async () => {
    const api = await loadCoordinator();
    const value = await fixture();
    const failed = api.composeOrganizationRelationEvolution(input(value, [value.evaluationFailed])).roleBranches[0];
    expect(failed.roleRelation.pairTerminalInventory.EVALUATION_FAILED.count).toBe(1);
    expect(failed.tensionState.requirementItems[0].classifications)
      .toContainEqual(expect.objectContaining({ family: "OPERAND_FAILURE", code: "EVALUATION_FAILED" }));
    expect(failed.evolutionInputState.items)
      .toContainEqual(expect.objectContaining({ derivationDisposition: "UPSTREAM_FAILURE", tensionClassificationCode: "EVALUATION_FAILED" }));
    const unknown = api.composeOrganizationRelationEvolution(input(value, [value.unknown])).roleBranches[0];
    expect(unknown.roleRelation.requirementCoverages[0].disposition).toBe("NO_AGGREGATE");
    expect(unknown.tensionState.requirementItems[0].classifications)
      .toContainEqual(expect.objectContaining({ family: "EPISTEMIC_UNCERTAINTY", code: "RELATION_NOT_AVAILABLE" }));
    expect(unknown.evolutionInputState.items)
      .toContainEqual(expect.objectContaining({
        derivationDisposition: "DERIVABLE",
        evolutionInputClass: "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT",
      }));
    expect(unknown.roleRelation.proposalState).toBe("PROPOSAL_ONLY");
    const ineligible = api.composeOrganizationRelationEvolution(input(value, [value.ineligible])).roleBranches[0];
    expect(ineligible.roleRelation.requirementCoverages[0].disposition).toBe("INELIGIBLE");
    expect(ineligible.tensionState.requirementItems[0].classifications)
      .toContainEqual(expect.objectContaining({
        family: "NOT_A_TENSION",
        code: "INELIGIBLE_DIRECT_RELATION_NOT_APPLICABLE",
      }));
    expect(ineligible.evolutionInputState.items)
      .toContainEqual(expect.objectContaining({
        derivationDisposition: "DERIVABLE",
        evolutionInputClass: "NO_ACTION_JUSTIFIED_INPUT",
      }));
    for (const forbidden of [
      "recommendationProposal", "decision", "commitment", "action", "outcome", "feedback", "status",
      "organizationRelationId", "schemaVersion", "createdAt", "fit", "score", "resonance",
    ]) expect(unknown).not.toHaveProperty(forbidden);
  });

  it("freezes detached SIL-compatible artifacts without persistence, replay, provider, repository, transaction, legacy, or fabricated identity/capability output", async () => {
    const api = await loadCoordinator();
    const value = await fixture();
    const source = input(value, [value.beta, value.alpha]);
    const result = api.composeOrganizationRelationEvolution(source);
    const firstOutputRoleId = result.roleBranches[0].roleRelation.roleRelationId;
    const callerRoleId = source.roleRelationMemberships[0].roleRelation.roleRelationId;
    source.roleRelationMemberships[0].roleRelation.createdAt = "mutated caller role";
    source.roleRelationMemberships.push(structuredClone(source.roleRelationMemberships[0]));
    source.targetOrganizationRevision.organizationDescriptor = "mutated caller organization";
    source.aggregationPolicy.aggregationMode = "mutated caller policy";
    expect(result.organizationRelation.targetOrganizationRevision.organizationDescriptor).toBe("Declared Organization");
    expect(result.organizationRelation.aggregationPolicy).toEqual(aggregationPolicy);
    expect(result.roleBranches[0].roleRelation.roleRelationId).toBe(firstOutputRoleId);
    expect(result.roleBranches).toHaveLength(2);
    expect(result.roleBranches.find((branch: any) => branch.roleRelation.roleRelationId === callerRoleId)
      .roleRelation.createdAt).toBe(sourceStamp);
    result.roleBranches.reverse();
    result.roleBranches[0].roleRelation.createdAt = "mutated returned branch";
    expect(source.roleRelationMemberships.some((membership: any) => membership.roleRelation.createdAt === "mutated returned branch"))
      .toBe(false);
    expect(result.organizationRelation).toHaveProperty("organizationRelationId");
    expect(result.roleBranches[0]).toHaveProperty("roleRelation.roleRelationId");
    expect(result.roleBranches[0]).toHaveProperty("tensionState.tensionStateId");
    expect(result.roleBranches[0]).toHaveProperty("evolutionInputState.evolutionInputStateId");
    for (const forbidden of [
      "persistOrganizationRelationEvolution", "byteReplayOrganizationRelationEvolution",
      "semanticReplayOrganizationRelationEvolution", "derivationReplayOrganizationRelationEvolution",
      "OrganizationRelationEvolutionRepository", "createRecommendationProposal", "produceTensionState",
      "produceEvolutionInputState", "transaction", "provider", "repository", "postgres", "legacy",
      "identity", "capability", "runtimeId", "coordinatorId", "runId",
    ]) expect(api).not.toHaveProperty(forbidden);
  });
});
