import type { DecisionSubjectReference } from "../decision-context";
import type { HumanDecisionDeclarationClass } from "../decision-record";
import type { CareerDecisionActionIntentClass } from "../action-intent";

export const CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION = "CAREER_HUMAN_COMMITMENT_V1" as const;

export interface CareerHumanCommitmentInput {
  careerDecisionActionIntentId: string;
  committedByActorId: string;
  committedAt: string;
  commitmentEvidenceRefs: readonly string[];
  createdAt: string;
}

export interface CareerHumanCommitment {
  careerHumanCommitmentId: string;
  careerDecisionActionIntentId: string;
  humanDecisionRecordId: string;
  careerDecisionContextRevisionId: string;
  decisionAuthorityGrantRevisionId: string;
  recommendationProposalId: string;
  committedByActorId: string;
  decisionSubjects: readonly DecisionSubjectReference[];
  sourceDeclarationClass: HumanDecisionDeclarationClass;
  sourceActionIntentClass: CareerDecisionActionIntentClass;
  operationDescription: string;
  committedAt: string;
  commitmentEvidenceRefs: readonly string[];
  schemaVersion: typeof CAREER_HUMAN_COMMITMENT_SCHEMA_VERSION;
  createdAt: string;
}
