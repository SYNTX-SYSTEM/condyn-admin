import { DecisionRecord, deepFreeze } from "./decision";

export interface CommitmentRecord {
  commitmentId: string;
  decisionId: string;
  actor: string;
  actionType: string;
  targetRef?: string;
  createdAt: string;
  dueAt?: string;
  rationale?: string;
}

export interface ActionEvent {
  actionId: string;
  commitmentId: string;
  actor: string;
  actionType: string;
  occurredAt: string;
  externalRef?: string;
  note?: string;
}

export function createCommitment(
  decision: DecisionRecord,
  actor: string,
  actionType: string,
  createdAt: string = new Date().toISOString(),
  targetRef?: string,
  dueAt?: string,
  rationale?: string
): Readonly<CommitmentRecord> {
  if (!decision || !decision.decisionId) {
    throw new Error("ERR_COMMITMENT_MISSING_DECISION: A commitment must reference a valid Decision.");
  }
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_COMMITMENT_MISSING_ACTOR: A commitment requires an explicit actor.");
  }
  if (!actionType || actionType.trim() === "") {
    throw new Error("ERR_COMMITMENT_MISSING_ACTION_TYPE: A commitment requires an action type.");
  }

  if (new Date(createdAt) < new Date(decision.timestamp)) {
    throw new Error("ERR_TEMPORAL_INVARIANT: A commitment cannot predate its decision.");
  }

  const commitment: CommitmentRecord = {
    commitmentId: `COM_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    decisionId: decision.decisionId,
    actor,
    actionType,
    targetRef,
    createdAt,
    dueAt,
    rationale
  };

  return deepFreeze(commitment);
}

const actionEventCache = new Map<string, ActionEvent>();

export function createActionEvent(
  actionId: string, 
  commitment: CommitmentRecord,
  actor: string,
  actionType: string,
  occurredAt: string = new Date().toISOString(),
  externalRef?: string,
  note?: string
): Readonly<ActionEvent> {
  if (!commitment || !commitment.commitmentId) {
    throw new Error("ERR_ACTION_MISSING_COMMITMENT: An action must reference a valid Commitment.");
  }
  if (!actor || actor.trim() === "") {
    throw new Error("ERR_ACTION_MISSING_ACTOR: An action requires an explicit actor.");
  }
  if (!actionType || actionType.trim() === "") {
    throw new Error("ERR_ACTION_MISSING_ACTION_TYPE: An action requires an action type.");
  }

  const actualActionId = actionId || `ACT_${Date.now()}_${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

  if (actionEventCache.has(actualActionId)) {
    const existing = actionEventCache.get(actualActionId)!;
    if (existing.commitmentId !== commitment.commitmentId || existing.actor !== actor || existing.actionType !== actionType) {
      throw new Error(`ERR_ACTION_CONFLICT: Action ${actualActionId} already exists with a different payload.`);
    }
    return deepFreeze(existing);
  }

  if (new Date(occurredAt) < new Date(commitment.createdAt)) {
    throw new Error("ERR_TEMPORAL_INVARIANT: An action cannot predate its commitment.");
  }

  const event: ActionEvent = {
    actionId: actualActionId,
    commitmentId: commitment.commitmentId,
    actor,
    actionType,
    occurredAt,
    externalRef,
    note
  };

  const sealed = deepFreeze(event);
  actionEventCache.set(sealed.actionId, sealed);
  return sealed;
}

export function clearActionCache() {
  actionEventCache.clear();
}
