import type { AuthoritativeStateReference } from "../authority";

export const ACTION_OCCURRENCE_CLAIM_SCHEMA_VERSION = "ACTION_OCCURRENCE_CLAIM_V1";

export type ActionOccurrenceClaimSource =
  | {
      origin: "HUMAN_INPUT";
      actorId: string;
    }
  | {
      origin: "AUTHORITATIVE_STATE";
      stateReference: AuthoritativeStateReference;
    };

export interface ActionOccurrenceClaimInput {
  source: ActionOccurrenceClaimSource;
  operationDescription: string;
}

export interface ActionOccurrenceClaim {
  artifactKind: "ACTION_OCCURRENCE_CLAIM";
  schemaVersion: typeof ACTION_OCCURRENCE_CLAIM_SCHEMA_VERSION;
  actionOccurrenceClaimId: string;
  source: ActionOccurrenceClaimSource;
  operationDescription: string;
}
