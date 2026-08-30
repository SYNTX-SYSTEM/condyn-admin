import type { ActionOccurrenceClaim } from "../action-occurrence-claim";
import type { AuthoritativeStateReference } from "../authority";
import type { HumanCommitment } from "../human-commitment";

export const HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION =
  "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_V1";

export type HumanCommitmentActionOccurrenceAssociationProvenance =
  | { origin: "HUMAN_INPUT"; actorId: string }
  | { origin: "MODEL_PROPOSAL"; proposalRef: string }
  | { origin: "AUTHORITATIVE_STATE"; stateReference: AuthoritativeStateReference };

export interface HumanCommitmentActionOccurrenceAssociationProposalInput {
  humanCommitment: HumanCommitment;
  actionOccurrenceClaim: ActionOccurrenceClaim;
  provenance: HumanCommitmentActionOccurrenceAssociationProvenance;
}

export interface HumanCommitmentActionOccurrenceAssociationProposal {
  artifactKind: "HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL";
  schemaVersion: typeof HUMAN_COMMITMENT_ACTION_OCCURRENCE_ASSOCIATION_PROPOSAL_SCHEMA_VERSION;
  humanCommitmentActionOccurrenceAssociationProposalId: string;
  humanCommitment: HumanCommitment;
  actionOccurrenceClaim: ActionOccurrenceClaim;
  provenance: HumanCommitmentActionOccurrenceAssociationProvenance;
}
