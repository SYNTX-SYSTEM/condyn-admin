import type { DecisionAuthorityScope, PermittedDecisionClass, PermittedSubjectKind } from "../decision-authority";

export const CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION = "CAREER_DECISION_CONTEXT_REVISION_V1" as const;

/** An exact RCP item witness; the ordinal has no meaning without this RCP ID. */
export interface DecisionSubjectReference {
  recommendationProposalId: string;
  sourceEvolutionInputItemOrdinal: number;
}

export interface CareerDecisionContextRevisionInput {
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  contextEvidenceRefs: readonly string[];
  createdAt: string;
}

/**
 * Immutable structural input for a possible later human declaration. It is not
 * a decision, selection, instruction, commitment, or execution authority.
 */
export interface CareerDecisionContextRevision {
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  contextEvidenceRefs: readonly string[];
  authorityScope: DecisionAuthorityScope;
  permittedDecisionClasses: readonly PermittedDecisionClass[];
  permittedSubjectKinds: readonly PermittedSubjectKind[];
  schemaVersion: typeof CAREER_DECISION_CONTEXT_REVISION_SCHEMA_VERSION;
  createdAt: string;
}
