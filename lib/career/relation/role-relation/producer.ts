import { deriveCandidateCapabilityOperand, type CandidateCapabilityOperandRepository } from "../../capability-core/relation-operand";
import { assertTargetRoleProfileRevision, type TargetRoleProfileRevision } from "../../target/role/profile";
import { assertRequirementRelationAggregate, assertTargetRoleRequirementInventory, type RequirementInventoryRepository, type RequirementRelationAggregate, type TargetRoleRequirementInventory } from "../requirement-inventory";
import { assertRoleRelation, deriveRoleRelationId } from "./contract";
import type { AggregateDimensionInventory, RequirementCoverage, RoleRelation } from "./types";

const fail = (code: string): never => { throw new Error(code); };
const direct = (group: TargetRoleRequirementInventory["requirementGroups"][number]) => group.revisionDisposition === "SINGLE_REVISION" && group.directRelationAdmission === "DIRECT_CAPABILITY_REQUIREMENT";
const pairStates = ["MATERIALIZED_RELATION", "EVALUATION_FAILED", "NOT_EVALUATED"] as const;
const necessityStates = ["REQUIRED", "PREFERRED", "OPTIONAL", "CONDITIONAL", "UNKNOWN"] as const;

export interface RoleRelationProducerInput {
  verifiedCapabilitySnapshotId: string;
  targetRoleProfileRevision: TargetRoleProfileRevision;
  inventory: TargetRoleRequirementInventory;
  createdAt: string;
  lineage: RoleRelation["lineage"];
}

export interface RoleRelationProducerDependencies {
  aggregates: Pick<RequirementInventoryRepository, "listAggregatesByExactLocator">;
  candidateRepository: CandidateCapabilityOperandRepository;
}

/**
 * Provider-free T7B assembly. Exact discovery, rather than a caller, establishes NO_AGGREGATE
 * and preserves multiplicity without winner selection; it cannot infer composition or role satisfaction.
 */
export async function produceRoleRelation(input: RoleRelationProducerInput, dependencies: RoleRelationProducerDependencies): Promise<RoleRelation> {
  assertTargetRoleProfileRevision(input.targetRoleProfileRevision);
  assertTargetRoleRequirementInventory(input.inventory);
  if (input.inventory.targetRoleProfileRevisionId !== input.targetRoleProfileRevision.targetRoleProfileRevisionId) fail("ERR_ROLE_RELATION_OPERAND_MISMATCH");
  const snapshot = await dependencies.candidateRepository.getSnapshotById(input.verifiedCapabilitySnapshotId);
  if (!snapshot || snapshot.snapshotId !== input.verifiedCapabilitySnapshotId) throw new Error("ERR_ROLE_RELATION_OPERAND_MISMATCH");
  const exactSnapshot = snapshot as NonNullable<typeof snapshot>;
  const operands = await Promise.all(exactSnapshot.capabilities.map(capability => deriveCandidateCapabilityOperand({ verifiedCapabilitySnapshotId: exactSnapshot.snapshotId, capabilityId: capability.capabilityId }, dependencies.candidateRepository)));
  const operandIds = new Set(operands.map(operand => operand.candidateCapabilityOperandId));
  const discovered = new Map<string, RequirementRelationAggregate[]>();
  for (const group of input.inventory.requirementGroups) {
    if (!direct(group)) continue;
    const targetRequirementRevisionId = group.targetRequirementRevisionIds[0];
    const values = await dependencies.aggregates.listAggregatesByExactLocator({ targetRoleRequirementInventoryId: input.inventory.targetRoleRequirementInventoryId, verifiedCapabilitySnapshotId: input.verifiedCapabilitySnapshotId, targetRequirementEntityId: group.targetRequirementEntityId, targetRequirementRevisionId });
    for (const aggregate of values) {
      assertRequirementRelationAggregate(aggregate);
      if (aggregate.targetRoleRequirementInventoryId !== input.inventory.targetRoleRequirementInventoryId || aggregate.verifiedCapabilitySnapshotId !== input.verifiedCapabilitySnapshotId || aggregate.targetRequirementEntityId !== group.targetRequirementEntityId || aggregate.targetRequirementRevisionId !== targetRequirementRevisionId || aggregate.candidateCapabilityOperandIds.some(id => !operandIds.has(id))) fail("ERR_ROLE_RELATION_OPERAND_MISMATCH");
    }
    discovered.set(targetRequirementRevisionId, values.sort((a, b) => a.requirementRelationAggregateId.localeCompare(b.requirementRelationAggregateId)));
  }
  const aggregates = [...discovered.values()].flat();
  if (new Set(aggregates.map(value => value.requirementRelationAggregateId)).size !== aggregates.length) fail("ERR_ROLE_RELATION_OPERAND_MISMATCH");
  const requirementCoverages: RequirementCoverage[] = input.inventory.requirementGroups.map(group => {
    const values = group.revisionDisposition === "SINGLE_REVISION" ? discovered.get(group.targetRequirementRevisionIds[0]) ?? [] : [];
    const disposition = group.revisionDisposition === "MULTIPLE_REVISIONS_UNRESOLVED" ? "REQUIREMENT_REVISION_BRANCH_UNRESOLVED" : group.directRelationAdmission === "TARGET_REQUIREMENT_TYPE_NOT_DIRECT_CAPABILITY" ? "NON_DIRECT_REQUIREMENT" : group.directRelationAdmission === "TARGET_REQUIREMENT_INELIGIBLE" ? "INELIGIBLE" : group.directRelationAdmission === "TARGET_REQUIREMENT_ELIGIBILITY_UNKNOWN" ? "ELIGIBILITY_UNKNOWN" : values.length === 0 ? "NO_AGGREGATE" : values.length === 1 ? "DIRECT_CAPABILITY_AGGREGATE_PRESENT" : "REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED";
    return { targetRequirementEntityId: group.targetRequirementEntityId, targetRequirementRevisionIds: [...group.targetRequirementRevisionIds], necessityStates: structuredClone(group.necessityStates), disposition, requirementRelationAggregateIds: values.map(value => value.requirementRelationAggregateId) };
  });
  const aggregateDimensionInventories: AggregateDimensionInventory[] = aggregates.map(aggregate => ({ requirementRelationAggregateId: aggregate.requirementRelationAggregateId, lineage: structuredClone(aggregate.lineage), semanticRelationInventory: structuredClone(aggregate.semanticRelationInventory), levelRelationInventory: structuredClone(aggregate.levelRelationInventory), evidenceSufficiencyInventory: structuredClone(aggregate.evidenceSufficiencyInventory), scopeRelationInventory: structuredClone(aggregate.scopeRelationInventory), pairDispositions: structuredClone(aggregate.pairDispositions) })).sort((a, b) => a.requirementRelationAggregateId.localeCompare(b.requirementRelationAggregateId));
  const pairTerminalInventory = Object.fromEntries(pairStates.map(state => [state, { count: 0, references: [] as string[] }])) as RoleRelation["pairTerminalInventory"];
  for (const aggregate of aggregates) for (const pair of aggregate.pairDispositions) pairTerminalInventory[pair.disposition].references.push(`${aggregate.requirementRelationAggregateId}:${pair.candidateCapabilityOperandId}`);
  for (const state of pairStates) { pairTerminalInventory[state].references.sort(); pairTerminalInventory[state].count = pairTerminalInventory[state].references.length; }
  const necessityInventory = Object.fromEntries(necessityStates.map(state => [state, { count: 0, targetRequirementRevisionIds: [] as string[] }])) as RoleRelation["necessityInventory"];
  for (const group of input.inventory.requirementGroups) for (const necessity of group.necessityStates) necessityInventory[necessity.necessityState].targetRequirementRevisionIds.push(necessity.targetRequirementRevisionId);
  for (const state of necessityStates) { necessityInventory[state].targetRequirementRevisionIds.sort(); necessityInventory[state].count = necessityInventory[state].targetRequirementRevisionIds.length; }
  const structuralStateInventory = [...new Set([...(input.inventory.requirementGroups.length ? [] : ["NO_REQUIREMENTS"]), ...requirementCoverages.filter(coverage => coverage.disposition !== "DIRECT_CAPABILITY_AGGREGATE_PRESENT").map(coverage => coverage.disposition)])].sort();
  const semantic = { verifiedCapabilitySnapshotId: input.verifiedCapabilitySnapshotId, targetRoleProfileRevisionId: input.targetRoleProfileRevision.targetRoleProfileRevisionId, targetRoleRequirementInventoryId: input.inventory.targetRoleRequirementInventoryId, requirementCoverages, requirementRelationAggregateIds: aggregates.map(value => value.requirementRelationAggregateId).sort(), aggregateDimensionInventories, pairTerminalInventory, necessityInventory, composition: { state: "COMPOSITION_NOT_EVALUATED" as const }, structuralStateInventory, lineage: structuredClone(input.lineage), proposalState: "PROPOSAL_ONLY" as const, authorityState: "NONE" as const, schemaVersion: "ROLE_RELATION_V1" as const };
  const result = { roleRelationId: deriveRoleRelationId(semantic), ...semantic, createdAt: input.createdAt };
  assertRoleRelation(result);
  return structuredClone(result);
}
