import type { DecisionAuthorityScope, PermittedDecisionClass, PermittedSubjectKind } from "../decision-authority";
import type { DecisionSubjectReference } from "../decision-context";

export const HUMAN_DECISION_RECORD_SCHEMA_VERSION = "HUMAN_DECISION_RECORD_V1" as const;
export type HumanDecisionDeclarationClass = "ACCEPT_RECOMMENDATION" | "REJECT_RECOMMENDATION" | "DEFER_DECISION" | "REQUEST_FURTHER_EVIDENCE" | "REQUEST_TARGET_CLARIFICATION";
/** The only caller-provided state at the human declaration boundary. */
export interface HumanDecisionDeclarationInput { careerDecisionContextRevisionId: string; declarantActorId: string; declarationClass: HumanDecisionDeclarationClass; declaredAt: string; declarationEvidenceRefs: readonly string[]; createdAt: string; }
/** Non-regenerable historical human declaration over one exact context inventory. */
export interface HumanDecisionRecord { humanDecisionRecordId: string; careerDecisionContextRevisionId: string; decisionAuthorityGrantRevisionId: string; recommendationProposalId: string; declarantActorId: string; decisionSubjects: readonly DecisionSubjectReference[]; declarationClass: HumanDecisionDeclarationClass; declaredAt: string; declarationEvidenceRefs: readonly string[]; authorityScope: DecisionAuthorityScope; permittedDecisionClasses: readonly PermittedDecisionClass[]; permittedSubjectKinds: readonly PermittedSubjectKind[]; schemaVersion: typeof HUMAN_DECISION_RECORD_SCHEMA_VERSION; createdAt: string; }
