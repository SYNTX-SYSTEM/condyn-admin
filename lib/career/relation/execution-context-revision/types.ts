import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type { CareerDecisionActionIntentClass } from "../action-intent";

export const CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION =
  "CAREER_EXECUTION_CONTEXT_REVISION_V1" as const;

export interface CareerExecutionTarget {
  targetKind: CareerExecutionTargetKind;
  targetRef: string;
}

export interface CareerExecutionChannel {
  channelKind: CareerExecutionChannelKind;
  channelRef: string;
}

export interface CareerExecutionContextRevisionInput {
  careerExecutionAuthorityGrantRevisionId: string;
  declaredByActorId: string;
  executionTarget: CareerExecutionTarget;
  executionChannel: CareerExecutionChannel;
  declaredAt: string;
  contextEvidenceRefs: readonly string[];
  createdAt: string;
}

export interface CareerExecutionContextRevision {
  careerExecutionContextRevisionId: string;
  careerExecutionAuthorityGrantRevisionId: string;
  careerHumanCommitmentId: string;
  careerDecisionActionIntentId: string;
  humanDecisionRecordId: string;
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  declaredByActorId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  executionAuthorityScope: CareerExecutionAuthorityScope;
  executionTarget: CareerExecutionTarget;
  executionChannel: CareerExecutionChannel;
  declaredAt: string;
  contextEvidenceRefs: readonly string[];
  schemaVersion: typeof CAREER_EXECUTION_CONTEXT_REVISION_SCHEMA_VERSION;
  createdAt: string;
}
