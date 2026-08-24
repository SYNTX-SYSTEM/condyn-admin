import type { AuthoritativeStateReference, BoundAuthoritativeStateReader } from "../authority";
import { assertDecisionContextDraft, type DecisionContextDraft } from "../context";

export interface BoundDecisionContextAuthorityValidator {
  validate(context: DecisionContextDraft): Promise<void>;
}

const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;

type CapturedData = null | boolean | number | string | CapturedData[] | { [key: string]: CapturedData };

const fail = (code: string): never => { throw new Error(code); };
const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

function captureData(value: unknown, ancestors: WeakSet<object> = new WeakSet<object>()): CapturedData {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object") return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
    if (ancestors.has(value)) return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
    ancestors.add(value);
    try {
      if (Array.isArray(value)) return captureArray(value, ancestors);
      return captureObject(value, ancestors);
    } finally {
      ancestors.delete(value);
    }
  } catch {
    return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  }
}

function captureObject(value: object, ancestors: WeakSet<object>): { [key: string]: CapturedData } {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  const captured: { [key: string]: CapturedData } = {};
  for (const key of ownKeys) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
    Object.defineProperty(captured, key, {
      value: captureData(descriptor.value, ancestors),
      enumerable: true,
      writable: true,
      configurable: true
    });
  }
  return captured;
}

function captureArray(value: unknown[], ancestors: WeakSet<object>): CapturedData[] {
  const ownKeys = Reflect.ownKeys(value);
  const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
  const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
  if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || ownKeys.length !== length + 1 || !ownKeys.includes("length")) {
    return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  }
  if (ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) {
    return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  }

  const captured: CapturedData[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
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

function sameReference(left: AuthoritativeStateReference, right: AuthoritativeStateReference): boolean {
  return left.producerId === right.producerId
    && left.authorityContractId === right.authorityContractId
    && left.artifactId === right.artifactId
    && left.locator === right.locator;
}

function captureContextReferences(context: DecisionContextDraft): AuthoritativeStateReference[] {
  const capturedContext = captureExactObject(context, contextKeys, "ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  try {
    Reflect.apply(assertDecisionContextDraft, undefined, [capturedContext]);
  } catch {
    return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  }
  const sourceStateReferences = capturedContext.sourceStateReferences;
  if (!Array.isArray(sourceStateReferences)) return fail("ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID");
  return sourceStateReferences.map((reference) => captureReference(reference, "ERR_DECISION_CONTEXT_AUTHORITY_CONTEXT_INVALID"));
}

function captureResolutionReference(resolution: unknown): AuthoritativeStateReference {
  try {
    if (typeof resolution !== "object" || resolution === null || Array.isArray(resolution)) return fail("ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH");
    const descriptor = Reflect.getOwnPropertyDescriptor(resolution, "reference");
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail("ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH");
    return captureReference(descriptor.value, "ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH");
  } catch {
    return fail("ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH");
  }
}

function bindResolve(reader: BoundAuthoritativeStateReader): (reference: AuthoritativeStateReference) => Promise<unknown> {
  try {
    if (typeof reader !== "object" || reader === null) return fail("ERR_DECISION_CONTEXT_AUTHORITY_READER_INVALID");
    const resolve = reader.resolve;
    if (typeof resolve !== "function") return fail("ERR_DECISION_CONTEXT_AUTHORITY_READER_INVALID");
    return resolve.bind(reader);
  } catch {
    return fail("ERR_DECISION_CONTEXT_AUTHORITY_READER_INVALID");
  }
}

/** Resolves current upstream authority only; it does not create a reusable authority artifact. */
export function createBoundDecisionContextAuthorityValidator(
  reader: BoundAuthoritativeStateReader
): BoundDecisionContextAuthorityValidator {
  const boundResolve = bindResolve(reader);
  return {
    async validate(context: DecisionContextDraft): Promise<void> {
      const references = captureContextReferences(context);
      for (const reference of references) {
        const requestedReference = { ...reference };
        const resolution = await boundResolve(requestedReference);
        const resolvedReference = captureResolutionReference(resolution);
        if (!sameReference(requestedReference, resolvedReference)) fail("ERR_DECISION_CONTEXT_AUTHORITY_REFERENCE_MISMATCH");
      }
    }
  };
}
