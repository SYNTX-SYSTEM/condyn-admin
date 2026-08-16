import { ActionEvent } from "./action";
import { deepFreeze } from "./decision";

export type OutcomeState = "SUCCESS" | "FAILURE" | "NO_RESPONSE" | "INTERVIEW_INVITE" | "REJECTED" | "OFFER";

export interface OutcomeRecord {
  outcomeId: string;
  actionId: string;
  actor: string;
  outcomeState: OutcomeState | string;
  occurredAt: string;
  evidence?: string;
}

export function createOutcome(
  action: ActionEvent,
  actor: string,
  outcomeState: OutcomeState | string,
  occurredAt: string = new Date().toISOString(),
  evidence?: string
): Readonly<OutcomeRecord> {
  if (!action || !action.actionId) {
    throw new Error("ERR_OUTCOME_MISSING_ACTION: An outcome must reference a valid Action.");
  }
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_OUTCOME_MISSING_ACTOR: An outcome requires an explicit actor.");
  }
  if (!outcomeState || outcomeState.trim() === "") {
    throw new Error("ERR_OUTCOME_MISSING_STATE: An outcome requires an explicit state.");
  }

  // Temporal invariant: outcome cannot predate action
  if (new Date(occurredAt) < new Date(action.occurredAt)) {
    throw new Error("ERR_TEMPORAL_INVARIANT: An outcome cannot predate its action.");
  }

  const outcome: OutcomeRecord = {
    outcomeId: `OUT_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    actionId: action.actionId,
    actor,
    outcomeState,
    occurredAt,
    evidence
  };

  return deepFreeze(outcome);
}
