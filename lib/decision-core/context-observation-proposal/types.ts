import type { AuthoritativeStateReference } from "../authority";
import type { OutcomeAttributionProposal } from "../outcome-attribution-proposal";

export const DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION =
  "DECISION_CONTEXT_OBSERVATION_PROPOSAL_V1";

export type DecisionContextObservationProposalProvenance =
  | {
      origin: "HUMAN_INPUT";
      actorId: string;
    }
  | {
      origin: "MODEL_PROPOSAL";
      proposalRef: string;
    }
  | {
      origin: "AUTHORITATIVE_STATE";
      stateReference: AuthoritativeStateReference;
    };

export interface DecisionContextObservationProposalInput {
  outcomeAttributionProposal: OutcomeAttributionProposal;
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}

export interface DecisionContextObservationProposal {
  artifactKind: "DECISION_CONTEXT_OBSERVATION_PROPOSAL";
  schemaVersion: typeof DECISION_CONTEXT_OBSERVATION_PROPOSAL_SCHEMA_VERSION;
  decisionContextObservationProposalId: string;
  outcomeAttributionProposal: OutcomeAttributionProposal;
  statement: string;
  provenance: DecisionContextObservationProposalProvenance;
}
