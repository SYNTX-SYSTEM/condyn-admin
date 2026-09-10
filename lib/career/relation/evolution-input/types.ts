import type { TensionClassification, TensionState } from "../tension-state";

export type EvolutionInputClass = "ACQUIRE_CAPABILITY_INPUT" | "INCREASE_DEMONSTRATED_LEVEL_INPUT" | "STRENGTHEN_EVIDENCE_INPUT" | "BROADEN_SCOPE_INPUT" | "GAIN_DOMAIN_CONTEXT_INPUT" | "RESOLVE_SEMANTIC_UNCERTAINTY_INPUT" | "RESOLVE_TARGET_UNCERTAINTY_INPUT" | "NO_ACTION_JUSTIFIED_INPUT";
export type EvolutionInputDerivationDisposition = "DERIVABLE" | "NOT_DERIVABLE" | "UNRESOLVED" | "UPSTREAM_FAILURE" | "NOT_APPLICABLE";

/** Every exact T8 classification becomes one independent bounded T9 record; it is not advice, selection, or an action. */
export interface EvolutionInputItem {
  evolutionInputClass: EvolutionInputClass | null;
  derivationDisposition: EvolutionInputDerivationDisposition;
  tensionClassificationFamily: TensionClassification["family"];
  tensionClassificationCode: string;
  subjectKind: TensionClassification["subjectKind"];
  dimension: TensionClassification["dimension"];
  targetRequirementEntityId: string | null;
  targetRequirementRevisionIds: string[];
  requirementRelationAggregateId: string | null;
  candidateCapabilityOperandId: string | null;
  capabilityRequirementRelationId: string | null;
  capabilityRequirementRelationEvaluationResultId: string | null;
  necessityStates: TensionClassification["necessityStates"];
}

/** One immutable artifact for one exact TensionState under one pinned T9 policy; copied lineage IDs are witnesses, never independent operands. */
export interface EvolutionInputState {
  evolutionInputStateId: string;
  tensionStateId: string;
  roleRelationId: string;
  verifiedCapabilitySnapshotId: string;
  targetRoleProfileRevisionId: string;
  targetRoleRequirementInventoryId: string;
  items: EvolutionInputItem[];
  derivationPolicyLineage: { evolutionInputDerivationPolicyVersion: string };
  proposalState: "PROPOSAL_ONLY";
  authorityState: "NONE";
  schemaVersion: "EVOLUTION_INPUT_STATE_V1";
  createdAt: string;
}
