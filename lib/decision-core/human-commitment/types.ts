import type { DecisionActionIntent } from "../action-intent";

export const HUMAN_COMMITMENT_SCHEMA_VERSION = "HUMAN_COMMITMENT_V1";

export interface HumanCommitmentActor {
  origin: "HUMAN_INPUT";
  actorId: string;
}

export interface HumanCommitmentInput {
  committedBy: HumanCommitmentActor;
  rationale: string | null;
}

export interface HumanCommitment {
  artifactKind: "HUMAN_COMMITMENT";
  schemaVersion: typeof HUMAN_COMMITMENT_SCHEMA_VERSION;
  humanCommitmentId: string;
  actionIntent: DecisionActionIntent;
  committedBy: HumanCommitmentActor;
  rationale: string | null;
}
