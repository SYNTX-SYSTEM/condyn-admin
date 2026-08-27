import type { DecisionProposalCoherenceValidation } from "../proposal-coherence";

export const HUMAN_DECISION_DECLARATION_SCHEMA_VERSION = "HUMAN_DECISION_DECLARATION_V1";

export interface HumanDecisionActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

export interface HumanDecisionDeclarationInput {
  decidedBy: HumanDecisionActor;
  chosenOptionItemIds: readonly string[];
  rationale: string | null;
}

export interface HumanDecisionDeclaration {
  artifactKind: "HUMAN_DECISION_DECLARATION";
  schemaVersion: typeof HUMAN_DECISION_DECLARATION_SCHEMA_VERSION;
  humanDecisionId: string;
  proposalCoherenceValidation: DecisionProposalCoherenceValidation;
  decidedBy: HumanDecisionActor;
  chosenOptionItemIds: readonly string[];
  rationale: string | null;
}
