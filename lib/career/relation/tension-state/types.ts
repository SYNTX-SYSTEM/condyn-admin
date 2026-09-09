import type { RoleRelation } from "../role-relation";

export type TensionClassificationFamily = "STRUCTURAL_DIFFERENCE" | "EPISTEMIC_UNCERTAINTY" | "OPERAND_FAILURE" | "NOT_A_TENSION";
export type TensionSubjectKind = "ROLE" | "REQUIREMENT" | "AGGREGATE_DIMENSION" | "PAIR";
/** A classified relational fact, never a gap, score, satisfaction, qualification, or recommendation. */
export interface TensionClassification {
  family: TensionClassificationFamily; code: string; subjectKind: TensionSubjectKind; dimension: "SEMANTIC" | "LEVEL" | "EVIDENCE" | "SCOPE" | "COMPOSITION" | "COVERAGE" | "PAIR" | null;
  targetRequirementEntityId: string | null; targetRequirementRevisionIds: string[]; requirementRelationAggregateId: string | null; candidateCapabilityOperandId: string | null; capabilityRequirementRelationId: string | null; capabilityRequirementRelationEvaluationResultId: string | null;
  necessityStates: RoleRelation["requirementCoverages"][number]["necessityStates"];
}
/** Necessity is retained as context; it neither rewrites a relation nor increases authority. */
export interface TensionRequirementItem { targetRequirementEntityId: string; targetRequirementRevisionIds: string[]; necessityStates: RoleRelation["requirementCoverages"][number]["necessityStates"]; coverageDisposition: RoleRelation["requirementCoverages"][number]["disposition"]; classifications: TensionClassification[]; }
/** One immutable artifact for one exact RoleRelation, never an entity, head, or current-state pointer. T9 may consume its facts but no EvolutionInput semantics live here. */
export interface TensionState {
  tensionStateId: string; roleRelationId: string; verifiedCapabilitySnapshotId: string; targetRoleProfileRevisionId: string; targetRoleRequirementInventoryId: string;
  roleClassifications: TensionClassification[]; requirementItems: TensionRequirementItem[];
  classificationPolicyLineage: { tensionClassificationPolicyVersion: string };
  proposalState: "PROPOSAL_ONLY"; authorityState: "NONE"; schemaVersion: "TENSION_STATE_V1"; createdAt: string;
}
