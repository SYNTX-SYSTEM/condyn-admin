import type { AuthoritativeStateReference } from "../authority";
import type { ActionOccurrenceClaim } from "../action-occurrence-claim";
import type { StateChangeClaim } from "../state-change-claim";

export const ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION =
  "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_V1";

export type ActionStateChangeAssociationProvenance =
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

export interface ActionStateChangeAssociationProposalInput {
  actionOccurrenceClaim: ActionOccurrenceClaim;
  stateChangeClaim: StateChangeClaim;
  provenance: ActionStateChangeAssociationProvenance;
}

export interface ActionStateChangeAssociationProposal {
  artifactKind: "ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL";
  schemaVersion: typeof ACTION_STATE_CHANGE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION;
  actionStateChangeAssociationProposalId: string;
  actionOccurrenceClaim: ActionOccurrenceClaim;
  stateChangeClaim: StateChangeClaim;
  provenance: ActionStateChangeAssociationProvenance;
}
