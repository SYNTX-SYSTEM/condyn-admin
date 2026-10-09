import type { VerifiedCapabilitySnapshot } from "../career/capability-core";
import type { EvolutionInputState } from "../career/relation/evolution-input";
import type { RecommendationProposal } from "../career/relation/recommendation-proposal";
import type { RoleRelation } from "../career/relation/role-relation";
import type { TensionState } from "../career/relation/tension-state";
import type { TargetRequirementRevision, TargetRoleProfileRevision } from "../career/target/role";

/**
 * Exact upstream artifacts an HR Decision Context is built over. They are read by the
 * caller through G3 repositories and are referenced, never copied, into the context.
 */
export interface HrDecisionContextSourceState {
  verifiedCapabilitySnapshot: VerifiedCapabilitySnapshot;
  recommendationProposal: RecommendationProposal;
  evolutionInputState: EvolutionInputState;
  tensionState: TensionState;
  roleRelation: RoleRelation;
  targetRoleProfileRevision: TargetRoleProfileRevision;
  targetRequirementRevisions: readonly TargetRequirementRevision[];
}

/** The decision question is always a human input; it is never derived from upstream state. */
export interface HrDecisionContextQuestion {
  statement: string;
  actorId: string;
}

export interface HrDecisionContextDraftRequest {
  question: HrDecisionContextQuestion;
  sourceState: HrDecisionContextSourceState;
}
