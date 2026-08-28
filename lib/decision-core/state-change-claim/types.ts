import type { AuthoritativeStateReference } from "../authority";

export const STATE_CHANGE_CLAIM_SCHEMA_VERSION = "STATE_CHANGE_CLAIM_V1";

export type StateChangeClaimSource =
  | {
      origin: "HUMAN_INPUT";
      actorId: string;
    }
  | {
      origin: "AUTHORITATIVE_STATE";
      stateReference: AuthoritativeStateReference;
    };

export interface StateChangeClaimInput {
  source: StateChangeClaimSource;
  stateChangeDescription: string;
}

export interface StateChangeClaim {
  artifactKind: "STATE_CHANGE_CLAIM";
  schemaVersion: typeof STATE_CHANGE_CLAIM_SCHEMA_VERSION;
  stateChangeClaimId: string;
  source: StateChangeClaimSource;
  stateChangeDescription: string;
}
