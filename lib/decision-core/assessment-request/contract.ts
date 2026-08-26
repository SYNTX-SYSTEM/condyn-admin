import { createHash } from "node:crypto";
import {
  DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION,
  type DecisionAssessmentRequest,
  type DecisionAssessmentRequestActor,
  type DecisionAssessmentRequestInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["revisionId", "requestedBy", "decisionQuestionItemId", "selectedOptionItemIds", "selectedObjectiveItemIds", "selectedConstraintItemIds"] as const;
const storedKeys = ["artifactKind", "schemaVersion", "assessmentRequestId", ...inputKeys] as const;
const actorKeys = ["origin", "actorId"] as const;
const revisionPattern = /^DREV_[0-9A-F]{24}$/;
const itemPattern = /^DCI_[0-9A-F]{24}$/;
const requestPattern = /^DAREQ_[0-9A-F]{24}$/;

function rawExact(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const actual = Reflect.ownKeys(value);
    if (actual.some((key) => typeof key !== "string") || actual.length !== keys.length || keys.some((key) => !actual.includes(key))) return fail(code);
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      result[key] = descriptor.value;
    }
    return result;
  } catch { return fail(code); }
}

function rawArray(value: unknown, code: string): unknown[] {
  try {
    if (!Array.isArray(value)) return fail(code);
    const keys = Reflect.ownKeys(value);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      result.push(descriptor.value);
    }
    return result;
  } catch { return fail(code); }
}

const compareStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;
const equalStrings = (left: readonly string[], right: readonly string[]): boolean => left.length === right.length && left.every((value, index) => value === right[index]);

function parseRevisionId(value: unknown, code: string): string {
  if (typeof value !== "string" || !revisionPattern.test(value)) return fail(code);
  return value;
}

function parseActor(value: unknown, code: string, requireTrimmed: boolean): DecisionAssessmentRequestActor {
  const actor = rawExact(value, actorKeys, code);
  if (actor.origin !== "HUMAN_INPUT" || typeof actor.actorId !== "string") return fail(code);
  const actorId = actor.actorId.trim();
  if (actorId.length === 0 || (requireTrimmed && actor.actorId !== actorId)) return fail(code);
  return { origin: "HUMAN_INPUT", actorId };
}

function parseItemId(value: unknown, code: string): string {
  if (typeof value !== "string" || !itemPattern.test(value)) return fail(code);
  return value;
}

function parseSelection(value: unknown, malformedCode: string, itemCode: string): string[] {
  return rawArray(value, malformedCode).map((item) => parseItemId(item, itemCode));
}

interface PreparedRequest {
  revisionId: string;
  requestedBy: DecisionAssessmentRequestActor;
  decisionQuestionItemId: string;
  selectedOptionItemIds: string[];
  selectedObjectiveItemIds: string[];
  selectedConstraintItemIds: string[];
}

function canonicalSelection(value: readonly string[], all: Set<string>, questionId: string): string[] {
  const sorted = [...value].sort(compareStrings);
  if (new Set(sorted).size !== sorted.length || sorted.some((itemId) => itemId === questionId || all.has(itemId))) fail("ERR_DECISION_ASSESSMENT_REQUEST_DUPLICATE_SELECTION");
  for (const itemId of sorted) all.add(itemId);
  return sorted;
}

function prepare(value: Record<string, unknown>, codes: { revision: string; actor: string; malformed: string; item: string }, requireTrimmedActor: boolean): PreparedRequest {
  const revisionId = parseRevisionId(value.revisionId, codes.revision);
  const requestedBy = parseActor(value.requestedBy, codes.actor, requireTrimmedActor);
  const decisionQuestionItemId = parseItemId(value.decisionQuestionItemId, codes.item);
  const selectedOptionItemIds = parseSelection(value.selectedOptionItemIds, codes.malformed, codes.item);
  const selectedObjectiveItemIds = parseSelection(value.selectedObjectiveItemIds, codes.malformed, codes.item);
  const selectedConstraintItemIds = parseSelection(value.selectedConstraintItemIds, codes.malformed, codes.item);
  const all = new Set<string>();
  return {
    revisionId,
    requestedBy,
    decisionQuestionItemId,
    selectedOptionItemIds: canonicalSelection(selectedOptionItemIds, all, decisionQuestionItemId),
    selectedObjectiveItemIds: canonicalSelection(selectedObjectiveItemIds, all, decisionQuestionItemId),
    selectedConstraintItemIds: canonicalSelection(selectedConstraintItemIds, all, decisionQuestionItemId)
  };
}

function requestId(prepared: PreparedRequest): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION,
    prepared.revisionId,
    ["HUMAN_INPUT", prepared.requestedBy.actorId],
    prepared.decisionQuestionItemId,
    prepared.selectedOptionItemIds,
    prepared.selectedObjectiveItemIds,
    prepared.selectedConstraintItemIds
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DAREQ_${digest}`;
}

function construct(prepared: PreparedRequest): DecisionAssessmentRequest {
  return {
    artifactKind: "DECISION_ASSESSMENT_REQUEST",
    schemaVersion: DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION,
    assessmentRequestId: requestId(prepared),
    revisionId: prepared.revisionId,
    requestedBy: { origin: "HUMAN_INPUT", actorId: prepared.requestedBy.actorId },
    decisionQuestionItemId: prepared.decisionQuestionItemId,
    selectedOptionItemIds: [...prepared.selectedOptionItemIds],
    selectedObjectiveItemIds: [...prepared.selectedObjectiveItemIds],
    selectedConstraintItemIds: [...prepared.selectedConstraintItemIds]
  };
}

/** Creates a detached canonical human-owned request representation without loading any referenced state. */
export function createDecisionAssessmentRequest(input: DecisionAssessmentRequestInput): DecisionAssessmentRequest {
  const wrapper = rawExact(input, inputKeys, "ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID");
  return construct(prepare(wrapper, {
    revision: "ERR_DECISION_ASSESSMENT_REQUEST_REVISION_ID_INVALID",
    actor: "ERR_DECISION_ASSESSMENT_REQUEST_ACTOR_INVALID",
    malformed: "ERR_DECISION_ASSESSMENT_REQUEST_INPUT_INVALID",
    item: "ERR_DECISION_ASSESSMENT_REQUEST_ITEM_ID_INVALID"
  }, false));
}

/** Verifies an exact canonical stored request representation without repairing it. */
export function assertDecisionAssessmentRequest(value: unknown): asserts value is DecisionAssessmentRequest {
  const invalid = "ERR_DECISION_ASSESSMENT_REQUEST_INVALID";
  try {
    const wrapper = rawExact(value, storedKeys, invalid);
    if (wrapper.artifactKind !== "DECISION_ASSESSMENT_REQUEST" || wrapper.schemaVersion !== DECISION_ASSESSMENT_REQUEST_SCHEMA_VERSION || typeof wrapper.assessmentRequestId !== "string" || !requestPattern.test(wrapper.assessmentRequestId)) fail(invalid);
    const originalOptions = parseSelection(wrapper.selectedOptionItemIds, invalid, invalid);
    const originalObjectives = parseSelection(wrapper.selectedObjectiveItemIds, invalid, invalid);
    const originalConstraints = parseSelection(wrapper.selectedConstraintItemIds, invalid, invalid);
    const prepared = prepare({
      revisionId: wrapper.revisionId,
      requestedBy: wrapper.requestedBy,
      decisionQuestionItemId: wrapper.decisionQuestionItemId,
      selectedOptionItemIds: originalOptions,
      selectedObjectiveItemIds: originalObjectives,
      selectedConstraintItemIds: originalConstraints
    }, { revision: invalid, actor: invalid, malformed: invalid, item: invalid }, true);
    if (!equalStrings(originalOptions, prepared.selectedOptionItemIds) || !equalStrings(originalObjectives, prepared.selectedObjectiveItemIds) || !equalStrings(originalConstraints, prepared.selectedConstraintItemIds)) fail(invalid);
    if (wrapper.assessmentRequestId !== requestId(prepared)) fail("ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_ASSESSMENT_REQUEST_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
