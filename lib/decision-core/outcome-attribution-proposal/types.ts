import type { AuthoritativeStateReference } from "../authority";
import type { ActionStateChangeAssociationProposal } from "../action-state-change-association";

export const OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION =
  "OUTCOME_ATTRIBUTION_PROPOSAL_V1";

export type OutcomeAttributionProvenance =
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

export interface OutcomeAttributionProposalInput {
  associationProposal: ActionStateChangeAssociationProposal;
  provenance: OutcomeAttributionProvenance;
}

export interface OutcomeAttributionProposal {
  artifactKind: "OUTCOME_ATTRIBUTION_PROPOSAL";
  schemaVersion: typeof OUTCOME_ATTRIBUTION_PROPOSAL_SCHEMA_VERSION;
  outcomeAttributionProposalId: string;
  associationProposal: ActionStateChangeAssociationProposal;
  provenance: OutcomeAttributionProvenance;
}
