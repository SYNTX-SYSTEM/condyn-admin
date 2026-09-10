export const DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION = "DECISION_AUTHORITY_GRANT_REVISION_V1" as const;

/** The grant exists as an explicit declaration; it is not independently verified authority truth. */
export type DecisionAuthorityScope = "CAREER_RECOMMENDATION_DECISION";

/** Human declaration meanings, not workflow states or instructions. */
export type PermittedDecisionClass =
  | "ACCEPT_RECOMMENDATION"
  | "REJECT_RECOMMENDATION"
  | "DEFER_DECISION"
  | "REQUEST_FURTHER_EVIDENCE"
  | "REQUEST_TARGET_CLARIFICATION";

/** T11A grants authority over exact historical proposal items only. */
export type PermittedSubjectKind = "RCP_ITEM";

export interface DecisionAuthorityGrantRevisionInput {
  grantorActorId: string;
  authorizedActorId: string;
  authorityScope: DecisionAuthorityScope;
  permittedDecisionClasses: readonly PermittedDecisionClass[];
  permittedSubjectKinds: readonly PermittedSubjectKind[];
  authorityEvidenceRefs: readonly string[];
  declaredAt: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  createdAt: string;
}

/**
 * An immutable historical grant declaration. It records what the grantor
 * declared; it does not prove organizational truth or create a decision.
 */
export interface DecisionAuthorityGrantRevision {
  decisionAuthorityGrantRevisionId: string;
  grantorActorId: string;
  authorizedActorId: string;
  authorityScope: DecisionAuthorityScope;
  permittedDecisionClasses: readonly PermittedDecisionClass[];
  permittedSubjectKinds: readonly PermittedSubjectKind[];
  authorityEvidenceRefs: readonly string[];
  declaredAt: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  schemaVersion: typeof DECISION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION;
  createdAt: string;
}
