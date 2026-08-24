import type { AuthoritativeStateReference, BoundAuthoritativeStateReader } from "../authority";
import { assertDecisionContextDraft, type DecisionContextDraft, type DecisionContextItem, type DecisionContextItemProvenance, type DecisionContextItemRole } from "../context";
import {
  EVIDENCE_BINDING_DISPOSITIONS,
  type BoundSemanticEvidenceBinder,
  type EvidenceBindingDisposition,
  type SemanticEvidenceBindingEvaluation,
  type SemanticEvidenceBindingEvaluator,
  type SemanticEvidenceBindingProposal,
  type SemanticEvidenceEvaluationInput
} from "./types";
import {
  buildSemanticEvidenceBindingId,
  canonicalEvidenceBindingReference,
  compareEvidenceBindingStrings,
  evidenceBindingTargetKey
} from "./identity";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const itemKeys = ["itemId", "role", "statement", "provenance"] as const;
const evaluationKeys = ["itemId", "stateReference", "disposition", "rationale"] as const;
const roles: readonly DecisionContextItemRole[] = ["DECISION_QUESTION", "OBJECTIVE", "CONSTRAINT", "OPTION", "OBSERVATION", "ASSUMPTION", "UNCERTAINTY"];

type CapturedData = null | boolean | number | string | CapturedData[] | { [key: string]: CapturedData };

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isRole = (value: unknown): value is DecisionContextItemRole => roles.some((role) => role === value);
const isDisposition = (value: unknown): value is EvidenceBindingDisposition => EVIDENCE_BINDING_DISPOSITIONS.some((disposition) => disposition === value);

/** Captures caller data through descriptors and never performs a later ordinary read of it. */
function captureData(value: unknown, ancestors: WeakSet<object> = new WeakSet<object>()): CapturedData {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object") return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    if (ancestors.has(value)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    ancestors.add(value);
    try {
      return Array.isArray(value) ? captureArray(value, ancestors) : captureObject(value, ancestors);
    } finally {
      ancestors.delete(value);
    }
  } catch {
    return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  }
}

function captureObject(value: object, ancestors: WeakSet<object>): { [key: string]: CapturedData } {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  const captured: { [key: string]: CapturedData } = {};
  for (const key of ownKeys) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    Object.defineProperty(captured, key, { value: captureData(descriptor.value, ancestors), enumerable: true, writable: true, configurable: true });
  }
  return captured;
}

function captureArray(value: unknown[], ancestors: WeakSet<object>): CapturedData[] {
  const ownKeys = Reflect.ownKeys(value);
  const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
  const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
  if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || ownKeys.length !== length + 1 || !ownKeys.includes("length")) {
    return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  }
  if (ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) {
    return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  }
  const captured: CapturedData[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    captured.push(captureData(descriptor.value, ancestors));
  }
  return captured;
}

function captureExactObject(value: unknown, expectedKeys: readonly string[], errorCode: string): { [key: string]: CapturedData } {
  const captured = captureData(value);
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail(errorCode);
  const keys = Object.keys(captured);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(errorCode);
  return captured;
}

function captureReference(value: unknown, errorCode: string): AuthoritativeStateReference {
  const captured = captureExactObject(value, referenceKeys, errorCode);
  const producerId = captured.producerId;
  const authorityContractId = captured.authorityContractId;
  const artifactId = captured.artifactId;
  const locator = captured.locator;
  if (!isNonEmptyString(producerId) || !isNonEmptyString(authorityContractId) || !isNonEmptyString(artifactId) || !isNonEmptyString(locator)) return fail(errorCode);
  return { producerId, authorityContractId, artifactId, locator };
}

function captureProvenance(value: unknown): DecisionContextItemProvenance {
  const captured = captureData(value);
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  const origin = captured.origin;
  const exact = (keys: readonly string[]) => {
    const actualKeys = Object.keys(captured);
    if (actualKeys.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  };
  if (origin === "AUTHORITATIVE_STATE") {
    exact(["origin", "stateReference"]);
    return { origin, stateReference: captureReference(captured.stateReference, "ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID") };
  }
  if (origin === "HUMAN_INPUT") {
    exact(["origin", "actorId"]);
    if (!isNonEmptyString(captured.actorId)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    return { origin, actorId: captured.actorId };
  }
  if (origin === "MODEL_PROPOSAL") {
    exact(["origin", "proposalRef"]);
    if (!isNonEmptyString(captured.proposalRef)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    return { origin, proposalRef: captured.proposalRef };
  }
  if (origin === "DETERMINISTIC_DERIVATION") {
    exact(["origin", "ruleId"]);
    if (!isNonEmptyString(captured.ruleId)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    return { origin, ruleId: captured.ruleId };
  }
  return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
}

function captureItem(value: unknown): DecisionContextItem {
  const captured = captureExactObject(value, itemKeys, "ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  const itemId = captured.itemId;
  const role = captured.role;
  const statement = captured.statement;
  if (!isNonEmptyString(itemId) || !isRole(role) || !isNonEmptyString(statement)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  return { itemId, role, statement, provenance: captureProvenance(captured.provenance) };
}

interface CapturedContext {
  contextId: string;
  sourceStateReferences: AuthoritativeStateReference[];
  items: DecisionContextItem[];
}

function captureContext(context: DecisionContextDraft): CapturedContext {
  try {
    const captured = captureExactObject(context, contextKeys, "ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
    const contextId = captured.contextId;
    if (!isNonEmptyString(contextId) || !Array.isArray(captured.sourceStateReferences) || !Array.isArray(captured.items)) return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
    return {
      contextId,
      sourceStateReferences: captured.sourceStateReferences.map((reference) => captureReference(reference, "ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID")),
      items: captured.items.map(captureItem)
    };
  } catch {
    return fail("ERR_DECISION_EVIDENCE_BINDING_CONTEXT_INVALID");
  }
}

function sameReference(left: AuthoritativeStateReference, right: AuthoritativeStateReference): boolean {
  return left.producerId === right.producerId
    && left.authorityContractId === right.authorityContractId
    && left.artifactId === right.artifactId
    && left.locator === right.locator;
}

/** Captures only resolution envelope metadata; payload remains opaque and un-cloned. */
function captureResolution(resolution: unknown): { reference: AuthoritativeStateReference; payload: unknown } {
  try {
    if (typeof resolution !== "object" || resolution === null || Array.isArray(resolution)) return fail("ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH");
    const ownKeys = Reflect.ownKeys(resolution);
    if (ownKeys.length !== 2 || ownKeys.some((key) => key !== "reference" && key !== "payload")) return fail("ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH");
    const referenceDescriptor = Reflect.getOwnPropertyDescriptor(resolution, "reference");
    const payloadDescriptor = Reflect.getOwnPropertyDescriptor(resolution, "payload");
    if (referenceDescriptor === undefined || payloadDescriptor === undefined || !referenceDescriptor.enumerable || !payloadDescriptor.enumerable || !("value" in referenceDescriptor) || !("value" in payloadDescriptor)) {
      return fail("ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH");
    }
    return {
      reference: captureReference(referenceDescriptor.value, "ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH"),
      payload: payloadDescriptor.value
    };
  } catch {
    return fail("ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH");
  }
}

function isSharedMemoryBuffer(value: unknown): boolean {
  return typeof SharedArrayBuffer !== "undefined" && value instanceof SharedArrayBuffer;
}

/**
 * SharedArrayBuffer survives structuredClone by design. Detect it recursively so a
 * semantic evaluator never receives memory that remains mutable by the producer.
 */
function containsSharedMemory(value: unknown, visited: WeakSet<object> = new WeakSet<object>()): boolean {
  try {
    if (isSharedMemoryBuffer(value)) return true;
    if (typeof value !== "object" || value === null) return false;
    if (visited.has(value)) return false;
    visited.add(value);

    if (ArrayBuffer.isView(value)) return isSharedMemoryBuffer(value.buffer);
    if (value instanceof Map) {
      for (const [key, entry] of value) {
        if (containsSharedMemory(key, visited) || containsSharedMemory(entry, visited)) return true;
      }
      return false;
    }
    if (value instanceof Set) {
      for (const entry of value) {
        if (containsSharedMemory(entry, visited)) return true;
      }
      return false;
    }

    for (const key of Reflect.ownKeys(value)) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || !("value" in descriptor)) return true;
      if (containsSharedMemory(descriptor.value, visited)) return true;
    }
    return false;
  } catch {
    return true;
  }
}

/** Semantic evaluation receives an operation-local payload copy, never producer-owned object identity or shared memory. */
function detachSemanticPayload(payload: unknown): unknown {
  try {
    const detached = structuredClone(payload);
    if (containsSharedMemory(detached)) return fail("ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE");
    return detached;
  } catch {
    return fail("ERR_DECISION_EVIDENCE_BINDING_PAYLOAD_NOT_DETACHABLE");
  }
}

function bindResolve(reader: BoundAuthoritativeStateReader): (reference: AuthoritativeStateReference) => Promise<unknown> {
  try {
    if (typeof reader !== "object" || reader === null) return fail("ERR_DECISION_EVIDENCE_BINDING_READER_INVALID");
    const resolve = reader.resolve;
    if (typeof resolve !== "function") return fail("ERR_DECISION_EVIDENCE_BINDING_READER_INVALID");
    return resolve.bind(reader);
  } catch {
    return fail("ERR_DECISION_EVIDENCE_BINDING_READER_INVALID");
  }
}

function bindEvaluate(evaluator: SemanticEvidenceBindingEvaluator): (input: SemanticEvidenceEvaluationInput) => Promise<readonly SemanticEvidenceBindingEvaluation[]> {
  try {
    if (typeof evaluator !== "object" || evaluator === null) return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATOR_INVALID");
    const evaluate = evaluator.evaluate;
    if (typeof evaluate !== "function") return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATOR_INVALID");
    return evaluate.bind(evaluator);
  } catch {
    return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATOR_INVALID");
  }
}

function captureEvaluation(value: unknown, expectedReference: AuthoritativeStateReference, itemIds: ReadonlySet<string>): Omit<SemanticEvidenceBindingProposal, "bindingId" | "contextId"> {
  try {
    const captured = captureExactObject(value, evaluationKeys, "ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
    const itemId = captured.itemId;
    const disposition = captured.disposition;
    const rationale = captured.rationale;
    if (!isNonEmptyString(itemId) || !itemIds.has(itemId)) return fail("ERR_DECISION_EVIDENCE_BINDING_ITEM_NOT_FOUND");
    const stateReference = captureReference(captured.stateReference, "ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID");
    if (!sameReference(stateReference, expectedReference)) return fail("ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID");
    if (!isDisposition(disposition) || !isNonEmptyString(rationale)) return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
    return { itemId, stateReference, disposition, rationale: rationale.trim() };
  } catch (error) {
    if (error instanceof Error && (error.message === "ERR_DECISION_EVIDENCE_BINDING_ITEM_NOT_FOUND" || error.message === "ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID")) throw error;
    return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
  }
}

function captureEvaluationArray(value: unknown, expectedReference: AuthoritativeStateReference, itemIds: ReadonlySet<string>): Omit<SemanticEvidenceBindingProposal, "bindingId" | "contextId">[] {
  try {
    if (!Array.isArray(value)) return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
    const ownKeys = Reflect.ownKeys(value);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || ownKeys.length !== length + 1 || !ownKeys.includes("length")) return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
    if (ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
    const evaluations: Omit<SemanticEvidenceBindingProposal, "bindingId" | "contextId">[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
      evaluations.push(captureEvaluation(descriptor.value, expectedReference, itemIds));
    }
    return evaluations;
  } catch (error) {
    if (error instanceof Error && (error.message === "ERR_DECISION_EVIDENCE_BINDING_ITEM_NOT_FOUND" || error.message === "ERR_DECISION_EVIDENCE_BINDING_STATE_REFERENCE_INVALID")) throw error;
    return fail("ERR_DECISION_EVIDENCE_BINDING_EVALUATION_INVALID");
  }
}

/**
 * Binds authority re-resolution and semantic proposal evaluation at composition time.
 * Returned bindings are proposals; this operation does not create a validated context or authority token.
 */
export function createBoundSemanticEvidenceBinder(
  reader: BoundAuthoritativeStateReader,
  evaluator: SemanticEvidenceBindingEvaluator
): BoundSemanticEvidenceBinder {
  const boundResolve = bindResolve(reader);
  const boundEvaluate = bindEvaluate(evaluator);
  return {
    async bind(context: DecisionContextDraft): Promise<SemanticEvidenceBindingProposal[]> {
      const capturedContext = captureContext(context);
      const itemIds = new Set(capturedContext.items.map((item) => item.itemId));
      const bindings: SemanticEvidenceBindingProposal[] = [];
      const targetKeys = new Set<string>();
      const bindingIds = new Set<string>();

      const preparedStates: Array<{ reference: AuthoritativeStateReference; payload: unknown }> = [];

      // Stage A: establish every reference and detach every payload before semantics begins.
      for (const reference of capturedContext.sourceStateReferences) {
        const requestedReference = { ...reference };
        const resolution = captureResolution(await boundResolve({ ...requestedReference }));
        if (!sameReference(requestedReference, resolution.reference)) fail("ERR_DECISION_EVIDENCE_BINDING_AUTHORITY_REFERENCE_MISMATCH");
        preparedStates.push({ reference: requestedReference, payload: detachSemanticPayload(resolution.payload) });
      }

      // Stage B: only all-or-nothing authority preparation may expose detached payloads to evaluation.
      for (const preparedState of preparedStates) {
        const requestedReference = preparedState.reference;
        const evaluations = captureEvaluationArray(await boundEvaluate({
          contextId: capturedContext.contextId,
          items: structuredClone(capturedContext.items),
          stateReference: { ...requestedReference },
          payload: preparedState.payload
        }), requestedReference, itemIds);
        for (const evaluation of evaluations) {
          const targetKey = evidenceBindingTargetKey(evaluation.itemId, evaluation.stateReference);
          if (targetKeys.has(targetKey)) fail("ERR_DECISION_EVIDENCE_BINDING_DUPLICATE");
          const bindingId = buildSemanticEvidenceBindingId(
            capturedContext.contextId,
            evaluation.itemId,
            evaluation.stateReference,
            evaluation.disposition
          );
          if (bindingIds.has(bindingId)) fail("ERR_DECISION_EVIDENCE_BINDING_DUPLICATE");
          targetKeys.add(targetKey);
          bindingIds.add(bindingId);
          bindings.push({ bindingId, contextId: capturedContext.contextId, ...evaluation });
        }
      }

      bindings.sort((left, right) => compareEvidenceBindingStrings(left.bindingId, right.bindingId));
      return structuredClone(bindings);
    }
  };
}
