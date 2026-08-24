import type { AuthoritativeStateReference } from "../authority";
import {
  buildDecisionContextId,
  buildDecisionContextItemId,
  compareDecisionContextStrings,
  sourceStateReferenceKey
} from "./identity";
import {
  DECISION_CONTEXT_DRAFT_SCHEMA_VERSION,
  type DecisionContextDraft,
  type DecisionContextDraftInput,
  type DecisionContextItem,
  type DecisionContextItemInput,
  type DecisionContextItemProvenance,
  type DecisionContextItemRole
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const draftInputKeys = ["sourceStateReferences", "items"] as const;
const itemKeys = ["itemId", "role", "statement", "provenance"] as const;
const itemInputKeys = ["role", "statement", "provenance"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const roles: readonly DecisionContextItemRole[] = ["DECISION_QUESTION", "OBJECTIVE", "CONSTRAINT", "OPTION", "OBSERVATION", "ASSUMPTION", "UNCERTAINTY"];

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isRole = (value: unknown): value is DecisionContextItemRole => roles.some((role) => role === value);

/** Captures only enumerable own data descriptors, never caller-controlled property reads. */
function captureOwnDataObject(value: unknown, errorCode: string): Record<string, unknown> {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return fail(errorCode);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string")) return fail(errorCode);

    const captured: Record<string, unknown> = {};
    for (const key of ownKeys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(errorCode);
      Object.defineProperty(captured, key, {
        value: descriptor.value,
        enumerable: true,
        writable: true,
        configurable: true
      });
    }
    return captured;
  } catch {
    return fail(errorCode);
  }
}

/** Validates an exact own-data shape and returns a detached plain capture. */
function assertExactCapturedKeys(captured: Record<string, unknown>, expectedKeys: readonly string[], errorCode: string): void {
  const keys = Object.keys(captured);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) {
    fail(errorCode);
  }
}

function captureExactDataObject(value: unknown, expectedKeys: readonly string[], errorCode: string): Record<string, unknown> {
  const captured = captureOwnDataObject(value, errorCode);
  assertExactCapturedKeys(captured, expectedKeys, errorCode);
  return captured;
}

/** Captures a dense plain array and rejects holes, accessors, and hidden own state. */
function captureExactArray(value: unknown, errorCode: string): unknown[] {
  try {
    if (!Array.isArray(value)) return fail(errorCode);
    const ownKeys = Reflect.ownKeys(value);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || ownKeys.length !== length + 1) {
      return fail(errorCode);
    }
    if (!ownKeys.includes("length") || ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) {
      return fail(errorCode);
    }

    const captured: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(errorCode);
      captured.push(descriptor.value);
    }
    return captured;
  } catch {
    return fail(errorCode);
  }
}

function captureReference(value: unknown, code: string): AuthoritativeStateReference {
  const captured = captureExactDataObject(value, referenceKeys, code);
  const producerId = captured.producerId;
  const authorityContractId = captured.authorityContractId;
  const artifactId = captured.artifactId;
  const locator = captured.locator;
  if (!isNonEmptyString(producerId) || !isNonEmptyString(authorityContractId) || !isNonEmptyString(artifactId) || !isNonEmptyString(locator)) return fail(code);
  return { producerId, authorityContractId, artifactId, locator };
}

function captureProvenance(value: unknown): DecisionContextItemProvenance {
  const captured = captureOwnDataObject(value, "ERR_DECISION_CONTEXT_ITEM_INVALID");
  const origin = captured.origin;
  if (origin === "AUTHORITATIVE_STATE") {
    assertExactCapturedKeys(captured, ["origin", "stateReference"], "ERR_DECISION_CONTEXT_ITEM_INVALID");
    return { origin, stateReference: captureReference(captured.stateReference, "ERR_DECISION_CONTEXT_ITEM_INVALID") };
  }
  if (origin === "HUMAN_INPUT") {
    assertExactCapturedKeys(captured, ["origin", "actorId"], "ERR_DECISION_CONTEXT_ITEM_INVALID");
    if (!isNonEmptyString(captured.actorId)) return fail("ERR_DECISION_CONTEXT_ITEM_INVALID");
    return { origin, actorId: captured.actorId };
  }
  if (origin === "MODEL_PROPOSAL") {
    assertExactCapturedKeys(captured, ["origin", "proposalRef"], "ERR_DECISION_CONTEXT_ITEM_INVALID");
    if (!isNonEmptyString(captured.proposalRef)) return fail("ERR_DECISION_CONTEXT_ITEM_INVALID");
    return { origin, proposalRef: captured.proposalRef };
  }
  if (origin === "DETERMINISTIC_DERIVATION") {
    assertExactCapturedKeys(captured, ["origin", "ruleId"], "ERR_DECISION_CONTEXT_ITEM_INVALID");
    if (!isNonEmptyString(captured.ruleId)) return fail("ERR_DECISION_CONTEXT_ITEM_INVALID");
    return { origin, ruleId: captured.ruleId };
  }
  return fail("ERR_DECISION_CONTEXT_ITEM_INVALID");
}

function captureItemInput(value: unknown): DecisionContextItemInput {
  const captured = captureExactDataObject(value, itemInputKeys, "ERR_DECISION_CONTEXT_ITEM_INVALID");
  const role = captured.role;
  const statement = captured.statement;
  if (!isRole(role) || !isNonEmptyString(statement)) return fail("ERR_DECISION_CONTEXT_ITEM_INVALID");
  return { role, statement: statement.trim(), provenance: captureProvenance(captured.provenance) };
}

function createCanonicalItem(value: unknown): DecisionContextItem {
  const input = captureItemInput(value);
  return { itemId: buildDecisionContextItemId(input.role, input.statement, input.provenance), ...input };
}

function captureReferences(values: unknown): AuthoritativeStateReference[] {
  const capturedValues = captureExactArray(values, "ERR_DECISION_CONTEXT_REFERENCE_INVALID");
  const references = capturedValues.map((value) => captureReference(value, "ERR_DECISION_CONTEXT_REFERENCE_INVALID"));
  const keys = references.map(sourceStateReferenceKey);
  if (new Set(keys).size !== keys.length) return fail("ERR_DECISION_CONTEXT_DUPLICATE_SOURCE_STATE_REFERENCE");
  return references;
}

function canonicalizeReferences(references: AuthoritativeStateReference[]): AuthoritativeStateReference[] {
  return [...references].sort((left, right) => compareDecisionContextStrings(sourceStateReferenceKey(left), sourceStateReferenceKey(right)));
}

function captureInputItems(values: unknown): DecisionContextItem[] {
  const capturedValues = captureExactArray(values, "ERR_DECISION_CONTEXT_ITEM_INVALID");
  const items = capturedValues.map(createCanonicalItem);
  const ids = items.map((item) => item.itemId);
  if (new Set(ids).size !== ids.length) return fail("ERR_DECISION_CONTEXT_DUPLICATE_ITEM");
  return items;
}

function captureDraftItems(values: unknown): DecisionContextItem[] {
  const capturedValues = captureExactArray(values, "ERR_DECISION_CONTEXT_ITEM_INVALID");
  const items = capturedValues.map((value) => {
    const item = captureExactDataObject(value, itemKeys, "ERR_DECISION_CONTEXT_ITEM_INVALID");
    if (!isNonEmptyString(item.itemId)) return fail("ERR_DECISION_CONTEXT_ITEM_INVALID");
    const canonical = createCanonicalItem({ role: item.role, statement: item.statement, provenance: item.provenance });
    if (canonical.itemId !== item.itemId) return fail("ERR_DECISION_CONTEXT_ITEM_ID_MISMATCH");
    return { ...canonical, itemId: item.itemId };
  });
  const ids = items.map((item) => item.itemId);
  if (new Set(ids).size !== ids.length) return fail("ERR_DECISION_CONTEXT_DUPLICATE_ITEM");
  return items;
}

function canonicalizeItems(items: DecisionContextItem[]): DecisionContextItem[] {
  return [...items].sort((left, right) => compareDecisionContextStrings(left.itemId, right.itemId));
}

function assertQuestionAndAuthoritativeReferences(items: DecisionContextItem[], references: AuthoritativeStateReference[]): string {
  const questions = items.filter((item) => item.role === "DECISION_QUESTION");
  if (questions.length !== 1) return fail("ERR_DECISION_CONTEXT_DECISION_QUESTION_COUNT");
  const referenceKeys = new Set(references.map(sourceStateReferenceKey));
  for (const item of items) {
    if (item.provenance.origin === "AUTHORITATIVE_STATE" && !referenceKeys.has(sourceStateReferenceKey(item.provenance.stateReference))) {
      return fail("ERR_DECISION_CONTEXT_AUTHORITATIVE_REFERENCE_MISSING");
    }
  }
  return questions[0].itemId;
}

/** Creates a detached, canonical structural draft without resolving upstream authority. */
export function createDecisionContextDraft(input: DecisionContextDraftInput): DecisionContextDraft {
  const capturedInput = captureExactDataObject(input, draftInputKeys, "ERR_DECISION_CONTEXT_INVALID");
  const sourceStateReferences = canonicalizeReferences(captureReferences(capturedInput.sourceStateReferences));
  const items = canonicalizeItems(captureInputItems(capturedInput.items));
  const decisionQuestionId = assertQuestionAndAuthoritativeReferences(items, sourceStateReferences);
  const contextId = buildDecisionContextId(DECISION_CONTEXT_DRAFT_SCHEMA_VERSION, sourceStateReferences, decisionQuestionId, items.map((item) => item.itemId));
  const draft: DecisionContextDraft = {
    artifactKind: "DECISION_CONTEXT_DRAFT",
    schemaVersion: DECISION_CONTEXT_DRAFT_SCHEMA_VERSION,
    contextId,
    validationStatus: "NOT_RUN",
    sourceStateReferences,
    decisionQuestionId,
    items
  };
  assertDecisionContextDraft(draft);
  return structuredClone(draft);
}

/** Structural integrity only: this assertion neither resolves nor authenticates upstream references. */
export function assertDecisionContextDraft(draft: DecisionContextDraft): void {
  const capturedDraft = captureExactDataObject(draft, contextKeys, "ERR_DECISION_CONTEXT_INVALID");
  if (capturedDraft.artifactKind !== "DECISION_CONTEXT_DRAFT" || capturedDraft.schemaVersion !== DECISION_CONTEXT_DRAFT_SCHEMA_VERSION || capturedDraft.validationStatus !== "NOT_RUN" || !isNonEmptyString(capturedDraft.contextId) || !isNonEmptyString(capturedDraft.decisionQuestionId)) {
    fail("ERR_DECISION_CONTEXT_INVALID");
  }
  const submittedReferences = captureReferences(capturedDraft.sourceStateReferences);
  const references = canonicalizeReferences(submittedReferences);
  if (JSON.stringify(references) !== JSON.stringify(submittedReferences)) fail("ERR_DECISION_CONTEXT_SOURCE_STATE_REFERENCES_NOT_CANONICAL");

  const submittedItems = captureDraftItems(capturedDraft.items);
  const items = canonicalizeItems(submittedItems);
  const ids = items.map((item) => item.itemId);
  if (JSON.stringify(items) !== JSON.stringify(submittedItems)) fail("ERR_DECISION_CONTEXT_ITEMS_NOT_CANONICAL");
  const decisionQuestionId = assertQuestionAndAuthoritativeReferences(items, references);
  if (capturedDraft.decisionQuestionId !== decisionQuestionId) fail("ERR_DECISION_CONTEXT_DECISION_QUESTION_ID_MISMATCH");
  const expectedContextId = buildDecisionContextId(DECISION_CONTEXT_DRAFT_SCHEMA_VERSION, references, decisionQuestionId, ids);
  if (capturedDraft.contextId !== expectedContextId) fail("ERR_DECISION_CONTEXT_ID_MISMATCH");
}
