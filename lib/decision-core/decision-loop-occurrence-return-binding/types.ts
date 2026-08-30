import type { DecisionContextObservationRevisionPersistence } from "../context-observation-revision-persistence";
import type { HumanCommitmentActionOccurrenceAssociationProposal } from "../human-commitment-action-occurrence-association";

export const DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION = "DECISION_LOOP_OCCURRENCE_RETURN_BINDING_V1";

export interface DecisionLoopOccurrenceReturnBindingInput {
  humanCommitmentActionOccurrenceAssociationProposal: HumanCommitmentActionOccurrenceAssociationProposal;
  decisionContextObservationRevisionPersistence: DecisionContextObservationRevisionPersistence;
}

export interface DecisionLoopOccurrenceReturnBinding {
  artifactKind: "DECISION_LOOP_OCCURRENCE_RETURN_BINDING";
  schemaVersion: typeof DECISION_LOOP_OCCURRENCE_RETURN_BINDING_SCHEMA_VERSION;
  decisionLoopOccurrenceReturnBindingId: string;
  humanCommitmentActionOccurrenceAssociationProposal: HumanCommitmentActionOccurrenceAssociationProposal;
  decisionContextObservationRevisionPersistence: DecisionContextObservationRevisionPersistence;
}
