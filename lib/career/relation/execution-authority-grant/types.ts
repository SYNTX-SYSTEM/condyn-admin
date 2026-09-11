import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";

export const CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION =
  "CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_V1" as const;

export type CareerExecutionAuthorityScope =
  | "RECOMMENDATION_OPERATION_EXECUTION"
  | "FURTHER_EVIDENCE_REQUEST_EXECUTION"
  | "TARGET_CLARIFICATION_REQUEST_EXECUTION";

export type CareerExecutionTargetKind =
  | "PERSON"
  | "ORGANIZATION"
  | "SYSTEM"
  | "DOCUMENT"
  | "COMMUNICATION_ENDPOINT";

export type CareerExecutionChannelKind =
  | "EMAIL"
  | "MESSAGE"
  | "API"
  | "DOCUMENT"
  | "HUMAN_HANDOFF";

export interface CareerExecutionAuthorityGrantRevisionInput {
  careerHumanCommitmentId: string;
  grantorActorId: string;
  authorizedExecutionActorId: string;
  executionAuthorityScope: CareerExecutionAuthorityScope;
  permittedTargetKinds: readonly CareerExecutionTargetKind[];
  permittedChannelKinds: readonly CareerExecutionChannelKind[];
  authorityEvidenceRefs: readonly string[];
  declaredAt: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  createdAt: string;
}

export interface CareerExecutionAuthorityGrantRevision {
  careerExecutionAuthorityGrantRevisionId: string;
  careerHumanCommitmentId: string;
  humanDecisionRecordId: string;
  careerDecisionActionIntentId: string;
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  grantorActorId: string;
  authorizedExecutionActorId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  executionAuthorityScope: CareerExecutionAuthorityScope;
  permittedTargetKinds: readonly CareerExecutionTargetKind[];
  permittedChannelKinds: readonly CareerExecutionChannelKind[];
  authorityEvidenceRefs: readonly string[];
  declaredAt: string;
  effectiveFrom: string;
  effectiveUntil: string | null;
  schemaVersion: typeof CAREER_EXECUTION_AUTHORITY_GRANT_REVISION_SCHEMA_VERSION;
  createdAt: string;
}
