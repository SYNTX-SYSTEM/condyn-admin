import type { RequirementRelationAggregate, TargetRoleRequirementInventory } from "../requirement-inventory";

/**
 * T7B is historical relation state, not a role match: it carries no fit,
 * qualification, satisfaction, score, recommendation, tension, or decision authority.
 * Future TensionState classifies these relational facts; RoleRelation does not pre-classify them.
 */
export type RequirementCoverageDisposition = "DIRECT_CAPABILITY_AGGREGATE_PRESENT" | "NO_AGGREGATE" | "REQUIREMENT_RELATION_AGGREGATE_SET_UNRESOLVED" | "NON_DIRECT_REQUIREMENT" | "INELIGIBLE" | "ELIGIBILITY_UNKNOWN" | "REQUIREMENT_REVISION_BRANCH_UNRESOLVED";
/** One coverage entry exists for every inventory group; unresolved branches remain unselected. */
export interface RequirementCoverage { targetRequirementEntityId: string; targetRequirementRevisionIds: string[]; necessityStates: TargetRoleRequirementInventory["requirementGroups"][number]["necessityStates"]; disposition: RequirementCoverageDisposition; requirementRelationAggregateIds: string[]; }
/** T6B dimensions remain per-aggregate facts and must never become role-level scalar conclusions. */
export interface AggregateDimensionInventory { requirementRelationAggregateId: string; lineage: RequirementRelationAggregate["lineage"]; semanticRelationInventory: RequirementRelationAggregate["semanticRelationInventory"]; levelRelationInventory: RequirementRelationAggregate["levelRelationInventory"]; evidenceSufficiencyInventory: RequirementRelationAggregate["evidenceSufficiencyInventory"]; scopeRelationInventory: RequirementRelationAggregate["scopeRelationInventory"]; pairDispositions: RequirementRelationAggregate["pairDispositions"]; }
/**
 * Exact persisted operands make absence, failure, and unresolved state replayable downstream.
 * proposalState/authorityState are a ceiling, and composition deliberately remains unevaluated.
 */
export interface RoleRelation { roleRelationId: string; verifiedCapabilitySnapshotId: string; targetRoleProfileRevisionId: string; targetRoleRequirementInventoryId: string; requirementCoverages: RequirementCoverage[]; requirementRelationAggregateIds: string[]; aggregateDimensionInventories: AggregateDimensionInventory[]; pairTerminalInventory: Record<"MATERIALIZED_RELATION" | "EVALUATION_FAILED" | "NOT_EVALUATED", { count: number; references: string[] }>; necessityInventory: Record<"REQUIRED" | "PREFERRED" | "OPTIONAL" | "CONDITIONAL" | "UNKNOWN", { count: number; targetRequirementRevisionIds: string[] }>; composition: { state: "COMPOSITION_NOT_EVALUATED" }; structuralStateInventory: string[]; lineage: { roleRequirementCoveragePolicyVersion: string; roleDimensionInventoryPolicyVersion: string; roleNecessityPolicyVersion: string; roleCompositionPolicyVersion: string; }; proposalState: "PROPOSAL_ONLY"; authorityState: "NONE"; schemaVersion: "ROLE_RELATION_V1"; createdAt: string; }
