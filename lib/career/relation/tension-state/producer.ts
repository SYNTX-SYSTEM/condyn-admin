import { assertRoleRelation, type RoleRelation, type RoleRelationRepository } from "../role-relation";
import { assertTensionState, deriveTensionStateId, sameTensionStateData } from "./contract";
import type { TensionStateRepository } from "./persistence";
import type { TensionClassification, TensionRequirementItem, TensionState } from "./types";

const fail = (code: string): never => { throw new Error(code); };
export interface TensionClassificationPolicy { version: string; }
export interface TensionClassificationPolicyRegistry { resolveTensionClassificationPolicy(version: string): TensionClassificationPolicy | null; }

const base = (family: TensionClassification["family"], code: string, subjectKind: TensionClassification["subjectKind"], dimension: TensionClassification["dimension"], item: TensionRequirementItem, extra: Partial<TensionClassification> = {}): TensionClassification => ({
  family, code, subjectKind, dimension, targetRequirementEntityId: item.targetRequirementEntityId,
  targetRequirementRevisionIds: [...item.targetRequirementRevisionIds], requirementRelationAggregateId: null,
  candidateCapabilityOperandId: null, capabilityRequirementRelationId: null,
  capabilityRequirementRelationEvaluationResultId: null, necessityStates: structuredClone(item.necessityStates), ...extra,
});

/** Every mapped dimension remains an independent cause; aggregate-set unresolved intentionally has no winner. */
const dimensionMapping: Record<string, [TensionClassification["family"], string]> = {
  SEMANTIC_DISTINCT: ["STRUCTURAL_DIFFERENCE", "SEMANTIC_DISTINCT_RELATION"], SEMANTIC_PARTIAL: ["STRUCTURAL_DIFFERENCE", "SEMANTIC_PARTIAL_RELATION"], LEVEL_BELOW: ["STRUCTURAL_DIFFERENCE", "LEVEL_BELOW_RELATION"], SCOPE_INCOMPATIBLE: ["STRUCTURAL_DIFFERENCE", "SCOPE_INCOMPATIBLE_RELATION"], SCOPE_PARTIAL: ["STRUCTURAL_DIFFERENCE", "SCOPE_PARTIAL_RELATION"],
  SEMANTIC_UNKNOWN: ["EPISTEMIC_UNCERTAINTY", "SEMANTIC_UNKNOWN"], LEVEL_UNKNOWN: ["EPISTEMIC_UNCERTAINTY", "LEVEL_UNKNOWN"], EVIDENCE_UNKNOWN: ["EPISTEMIC_UNCERTAINTY", "EVIDENCE_UNKNOWN"], EVIDENCE_INSUFFICIENT: ["EPISTEMIC_UNCERTAINTY", "EVIDENCE_INSUFFICIENT"], SCOPE_UNKNOWN: ["EPISTEMIC_UNCERTAINTY", "SCOPE_UNKNOWN"],
  SEMANTIC_EQUIVALENT: ["NOT_A_TENSION", "SEMANTIC_EQUIVALENT"], SEMANTIC_CANDIDATE_COVERS_REQUIREMENT: ["NOT_A_TENSION", "SEMANTIC_CANDIDATE_COVERS_REQUIREMENT"], LEVEL_MEETS: ["NOT_A_TENSION", "LEVEL_MEETS"], LEVEL_EXCEEDS: ["NOT_A_TENSION", "LEVEL_EXCEEDS"], LEVEL_NOT_APPLICABLE: ["NOT_A_TENSION", "LEVEL_NOT_APPLICABLE"], EVIDENCE_SUFFICIENT: ["NOT_A_TENSION", "EVIDENCE_SUFFICIENT"], SCOPE_COMPATIBLE: ["NOT_A_TENSION", "SCOPE_COMPATIBLE"], SCOPE_NOT_APPLICABLE: ["NOT_A_TENSION", "SCOPE_NOT_APPLICABLE"],
};
const coverageMapping: Record<string, [TensionClassification["family"], string]> = {
  NO_AGGREGATE: ["EPISTEMIC_UNCERTAINTY", "RELATION_NOT_AVAILABLE"], REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED: ["EPISTEMIC_UNCERTAINTY", "REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED"], ELIGIBILITY_UNKNOWN: ["EPISTEMIC_UNCERTAINTY", "ELIGIBILITY_UNKNOWN"], REQUIREMENT_REVISION_BRANCH_UNRESOLVED: ["EPISTEMIC_UNCERTAINTY", "REQUIREMENT_REVISION_BRANCH_UNRESOLVED"], NON_DIRECT_REQUIREMENT: ["NOT_A_TENSION", "NON_DIRECT_REQUIREMENT_REVIEWED"], INELIGIBLE: ["NOT_A_TENSION", "INELIGIBLE_DIRECT_RELATION_NOT_APPLICABLE"],
};

function relationIds(entry: unknown): readonly string[] {
  if (entry === null || typeof entry !== "object" || Array.isArray(entry)) return fail("ERR_TENSION_STATE_CLASSIFICATION_FAILED");
  const value = Reflect.get(entry, "capabilityRequirementRelationIds");
  if (!Array.isArray(value) || value.some(identifier => typeof identifier !== "string")) return fail("ERR_TENSION_STATE_CLASSIFICATION_FAILED");
  return value;
}

function classifyInventory(item: TensionRequirementItem, aggregateId: string, inventory: object, dimension: "SEMANTIC" | "LEVEL" | "EVIDENCE" | "SCOPE"): void {
  for (const [value, entry] of Object.entries(inventory)) {
    const mapped = dimensionMapping[value];
    if (!mapped) continue;
    for (const relationId of relationIds(entry)) item.classifications.push(base(mapped[0], mapped[1], "AGGREGATE_DIMENSION", dimension, item, { requirementRelationAggregateId: aggregateId, capabilityRequirementRelationId: relationId }));
  }
}

/** T8 consumes the exact T7B artifact only; it never re-evaluates relation truth or calls a provider. */
export function classifyRoleRelation(role: RoleRelation, policy: TensionClassificationPolicy, createdAt: string): TensionState {
  assertRoleRelation(role);
  if (!policy || policy.version.length === 0) fail("ERR_TENSION_STATE_CLASSIFICATION_POLICY_UNAVAILABLE");
  const dimensions = new Map(role.aggregateDimensionInventories.map(item => [item.requirementRelationAggregateId, item]));
  const items: TensionRequirementItem[] = role.requirementCoverages.map(coverage => ({ targetRequirementEntityId: coverage.targetRequirementEntityId, targetRequirementRevisionIds: [...coverage.targetRequirementRevisionIds], necessityStates: structuredClone(coverage.necessityStates), coverageDisposition: coverage.disposition, classifications: [] }));
  for (const item of items) {
    const coverage = role.requirementCoverages.find(value => value.targetRequirementEntityId === item.targetRequirementEntityId) ?? fail("ERR_TENSION_STATE_CLASSIFICATION_FAILED");
    const covered = coverageMapping[coverage.disposition];
    if (covered) item.classifications.push(base(covered[0], covered[1], "REQUIREMENT", "COVERAGE", item));
    for (const aggregateId of coverage.requirementRelationAggregateIds) {
      const aggregate = dimensions.get(aggregateId) ?? fail("ERR_TENSION_STATE_CLASSIFICATION_FAILED");
      classifyInventory(item, aggregateId, aggregate.semanticRelationInventory, "SEMANTIC");
      classifyInventory(item, aggregateId, aggregate.levelRelationInventory, "LEVEL");
      classifyInventory(item, aggregateId, aggregate.evidenceSufficiencyInventory, "EVIDENCE");
      classifyInventory(item, aggregateId, aggregate.scopeRelationInventory, "SCOPE");
      for (const pair of aggregate.pairDispositions) {
        if (pair.disposition === "NOT_EVALUATED") item.classifications.push(base("EPISTEMIC_UNCERTAINTY", "PAIR_NOT_EVALUATED", "PAIR", "PAIR", item, { requirementRelationAggregateId: aggregateId, candidateCapabilityOperandId: pair.candidateCapabilityOperandId }));
        if (pair.disposition === "EVALUATION_FAILED") item.classifications.push(base("OPERAND_FAILURE", "EVALUATION_FAILED", "PAIR", "PAIR", item, { requirementRelationAggregateId: aggregateId, candidateCapabilityOperandId: pair.candidateCapabilityOperandId, capabilityRequirementRelationEvaluationResultId: pair.capabilityRequirementRelationEvaluationResultId }));
      }
      item.classifications.push(base("EPISTEMIC_UNCERTAINTY", "COMPOSITION_UNEVALUATED", "AGGREGATE_DIMENSION", "COMPOSITION", item, { requirementRelationAggregateId: aggregateId }));
    }
    item.classifications.sort((left, right) => JSON.stringify(left).localeCompare(JSON.stringify(right)));
  }
  const roleClassifications: TensionClassification[] = role.requirementCoverages.length > 0 ? [] : [{ family: "NOT_A_TENSION", code: "NO_REQUIREMENTS_REVIEWED", subjectKind: "ROLE", dimension: "COVERAGE", targetRequirementEntityId: null, targetRequirementRevisionIds: [], requirementRelationAggregateId: null, candidateCapabilityOperandId: null, capabilityRequirementRelationId: null, capabilityRequirementRelationEvaluationResultId: null, necessityStates: [] }];
  const semantic = { roleRelationId: role.roleRelationId, verifiedCapabilitySnapshotId: role.verifiedCapabilitySnapshotId, targetRoleProfileRevisionId: role.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: role.targetRoleRequirementInventoryId, roleClassifications, requirementItems: items.sort((left, right) => left.targetRequirementEntityId.localeCompare(right.targetRequirementEntityId)), classificationPolicyLineage: { tensionClassificationPolicyVersion: policy.version }, proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "TENSION_STATE_V1" as const };
  const result = { tensionStateId: deriveTensionStateId(semantic), ...semantic, createdAt };
  assertTensionState(result);
  return structuredClone(result);
}

export async function produceTensionState(input: { roleRelationId: string; classificationPolicyVersion: string; createdAt: string }, dependencies: { roles: RoleRelationRepository; policies: TensionClassificationPolicyRegistry }): Promise<TensionState> {
  const role = (await dependencies.roles.getRoleRelationById(input.roleRelationId)) ?? fail("ERR_TENSION_STATE_ROLE_RELATION_NOT_FOUND");
  try { assertRoleRelation(role); } catch { return fail("ERR_TENSION_STATE_ROLE_RELATION_INVALID"); }
  const policy = dependencies.policies.resolveTensionClassificationPolicy(input.classificationPolicyVersion);
  if (!policy || policy.version !== input.classificationPolicyVersion) return fail("ERR_TENSION_STATE_CLASSIFICATION_POLICY_UNAVAILABLE");
  try { return classifyRoleRelation(role, policy, input.createdAt); } catch (error) { if (error instanceof Error && error.message.startsWith("ERR_TENSION_STATE_")) throw error; return fail("ERR_TENSION_STATE_CLASSIFICATION_FAILED"); }
}

/** Persistence is part of production, so a produced state is always reread before it is returned. */
export async function produceAndPersistTensionState(input: { roleRelationId: string; classificationPolicyVersion: string; createdAt: string }, dependencies: { roles: RoleRelationRepository; policies: TensionClassificationPolicyRegistry; tensionStates: TensionStateRepository }): Promise<TensionState> {
  const produced = await produceTensionState(input, dependencies);
  const reread = await dependencies.tensionStates.persistTensionState(produced);
  if (!sameTensionStateData(produced, reread)) fail("ERR_TENSION_STATE_PERSISTENCE_FAILED");
  return reread;
}
