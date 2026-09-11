import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";

export const CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION = "CAREER_DECISION_ACTION_INTENT_V1" as const;

export type CareerDecisionActionIntentClass =
  | "RECOMMENDATION_OPERATIONALIZATION"
  | "FURTHER_EVIDENCE_REQUEST_OPERATIONALIZATION"
  | "TARGET_CLARIFICATION_REQUEST_OPERATIONALIZATION";

export interface CareerDecisionActionIntentInput {
  humanDecisionRecordId: string;
  declaredByActorId: string;
  actionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  declaredAt: string;
  actionIntentEvidenceRefs: readonly string[];
  createdAt: string;
}

export interface CareerDecisionActionIntent {
  careerDecisionActionIntentId: string;
  humanDecisionRecordId: string;
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  declaredByActorId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  actionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  declaredAt: string;
  actionIntentEvidenceRefs: readonly string[];
  schemaVersion: typeof CAREER_DECISION_ACTION_INTENT_SCHEMA_VERSION;
  createdAt: string;
}
