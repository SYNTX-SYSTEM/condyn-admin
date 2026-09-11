import type { CareerDecisionActionIntentClass } from "../action-intent";
import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type {
  CareerExecutionAuthorityScope,
  CareerExecutionChannelKind,
  CareerExecutionTargetKind,
} from "../execution-authority-grant";

export const CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION =
  "CAREER_ACTION_OCCURRENCE_V1" as const;

export interface CareerActionOccurrenceInput {
  careerExecutionContextRevisionId: string;
  performedByActorId: string;
  occurredAt: string;
  occurrenceEvidenceRefs: readonly string[];
  externalOccurrenceRef: string | null;
  createdAt: string;
}

export interface CareerActionOccurrence {
  careerActionOccurrenceId: string;
  careerExecutionContextRevisionId: string;
  careerExecutionAuthorityGrantRevisionId: string;
  careerHumanCommitmentId: string;
  careerDecisionActionIntentId: string;
  humanDecisionRecordId: string;
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  performedByActorId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  executionAuthorityScope: CareerExecutionAuthorityScope;
  executionTarget: {
    targetKind: CareerExecutionTargetKind;
    targetRef: string;
  };
  executionChannel: {
    channelKind: CareerExecutionChannelKind;
    channelRef: string;
  };
  occurredAt: string;
  occurrenceEvidenceRefs: readonly string[];
  externalOccurrenceRef: string | null;
  schemaVersion: typeof CAREER_ACTION_OCCURRENCE_SCHEMA_VERSION;
  createdAt: string;
}
