import type { AuthoritativeStateReference } from "../authority";
import { EVIDENCE_BINDING_DISPOSITIONS, type EvidenceBindingDisposition } from "../evidence-binding";
import { assertDecisionContextDraft, type DecisionContextDraft, type DecisionContextItemProvenance, type DecisionContextItemRole } from "../context";
import {
  STRUCTURAL_EXPECTATION_KINDS,
  STRUCTURAL_EXPECTATION_SCHEMA_VERSION,
  type ContextRoleStructuralExpectation,
  type DependencyStructuralExpectation,
  type EvidenceBindingStructuralExpectation,
  type StructuralExpectation,
  type StructuralExpectationInput,
  type StructuralExpectationKind
} from "./types";
import {
  buildStructuralExpectationId,
  canonicalStructuralExpectationProvenance,
  structuralExpectationReferenceKey,
  type CanonicalContextRoleExpectationBody,
  type CanonicalDependencyExpectationBody,
  type CanonicalEvidenceBindingExpectationBody
} from "./identity";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const itemKeys = ["itemId", "role", "statement", "provenance"] as const;
const roles: readonly DecisionContextItemRole[] = ["DECISION_QUESTION", "OBJECTIVE", "CONSTRAINT", "OPTION", "OBSERVATION", "ASSUMPTION", "UNCERTAINTY"];

type CapturedData = null | boolean | number | string | CapturedData[] | { [key: string]: CapturedData };

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isRole = (value: unknown): value is DecisionContextItemRole => roles.some((role) => role === value);
const isKind = (value: unknown): value is StructuralExpectationKind => STRUCTURAL_EXPECTATION_KINDS.some((kind) => kind === value);
const isDisposition = (value: unknown): value is EvidenceBindingDisposition => EVIDENCE_BINDING_DISPOSITIONS.some((disposition) => disposition === value);

function captureData(value: unknown, errorCode: string, ancestors: WeakSet<object> = new WeakSet<object>()): CapturedData {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object") return fail(errorCode);
    if (ancestors.has(value)) return fail(errorCode);
    ancestors.add(value);
    try {
      return Array.isArray(value) ? captureArray(value, errorCode, ancestors) : captureObject(value, errorCode, ancestors);
    } finally {
      ancestors.delete(value);
    }
  } catch {
    return fail(errorCode);
  }
}

function captureObject(value: object, errorCode: string, ancestors: WeakSet<object>): { [key: string]: CapturedData } {
  const ownKeys = Reflect.ownKeys(value);
  if (ownKeys.some((key) => typeof key !== "string")) return fail(errorCode);
  const captured: { [key: string]: CapturedData } = {};
  for (const key of ownKeys) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(errorCode);
    Object.defineProperty(captured, key, { value: captureData(descriptor.value, errorCode, ancestors), enumerable: true, writable: true, configurable: true });
  }
  return captured;
}

function captureArray(value: unknown[], errorCode: string, ancestors: WeakSet<object>): CapturedData[] {
  const ownKeys = Reflect.ownKeys(value);
  const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
  const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
  if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || ownKeys.length !== length + 1 || !ownKeys.includes("length")) return fail(errorCode);
  if (ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(errorCode);
  const captured: CapturedData[] = [];
  for (let index = 0; index < length; index += 1) {
    const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(errorCode);
    captured.push(captureData(descriptor.value, errorCode, ancestors));
  }
  return captured;
}

function captureExactObject(value: unknown, expectedKeys: readonly string[], errorCode: string): { [key: string]: CapturedData } {
  const captured = captureData(value, errorCode);
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

function captureProvenance(value: unknown, inputErrorCode: string, referenceErrorCode: string): DecisionContextItemProvenance {
  const captured = captureData(value, inputErrorCode);
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail(inputErrorCode);
  const origin = captured.origin;
  const assertKeys = (keys: readonly string[]) => {
    const actual = Object.keys(captured);
    if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) fail(inputErrorCode);
  };
  if (origin === "AUTHORITATIVE_STATE") {
    assertKeys(["origin", "stateReference"]);
    return { origin, stateReference: captureReference(captured.stateReference, referenceErrorCode) };
  }
  if (origin === "HUMAN_INPUT") {
    assertKeys(["origin", "actorId"]);
    if (!isNonEmptyString(captured.actorId)) return fail(inputErrorCode);
    return { origin, actorId: captured.actorId };
  }
  if (origin === "MODEL_PROPOSAL") {
    assertKeys(["origin", "proposalRef"]);
    if (!isNonEmptyString(captured.proposalRef)) return fail(inputErrorCode);
    return { origin, proposalRef: captured.proposalRef };
  }
  if (origin === "DETERMINISTIC_DERIVATION") {
    assertKeys(["origin", "ruleId"]);
    if (!isNonEmptyString(captured.ruleId)) return fail(inputErrorCode);
    return { origin, ruleId: captured.ruleId };
  }
  return fail(inputErrorCode);
}

interface CapturedContext {
  contextId: string;
  itemIds: ReadonlySet<string>;
  referenceKeys: ReadonlySet<string>;
}

function captureContext(context: DecisionContextDraft): CapturedContext {
  try {
    const captured = captureExactObject(context, contextKeys, "ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID");
    Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
    if (!isNonEmptyString(captured.contextId) || !Array.isArray(captured.items) || !Array.isArray(captured.sourceStateReferences)) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID");
    const itemIds = new Set<string>();
    for (const value of captured.items) {
      const item = captureExactObject(value, itemKeys, "ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID");
      if (!isNonEmptyString(item.itemId)) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID");
      itemIds.add(item.itemId);
    }
    const referenceKeys = new Set<string>();
    for (const value of captured.sourceStateReferences) {
      referenceKeys.add(structuralExpectationReferenceKey(captureReference(value, "ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID")));
    }
    return { contextId: captured.contextId, itemIds, referenceKeys };
  } catch {
    return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_CONTEXT_INVALID");
  }
}

interface CanonicalEvidenceBindingInput {
  kind: "EVIDENCE_BINDING";
  subjectItemId: string;
  acceptedDispositions: EvidenceBindingDisposition[];
  provenance: DecisionContextItemProvenance;
}

interface CanonicalContextRoleInput {
  kind: "CONTEXT_ROLE";
  role: DecisionContextItemRole;
  minimumCount: number;
  provenance: DecisionContextItemProvenance;
}

interface CanonicalDependencyInput {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
  provenance: DecisionContextItemProvenance;
}

type CanonicalInput = CanonicalEvidenceBindingInput | CanonicalContextRoleInput | CanonicalDependencyInput;

function requireContextItem(context: CapturedContext, itemId: unknown): string {
  if (!isNonEmptyString(itemId) || !context.itemIds.has(itemId)) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_ITEM_NOT_FOUND");
  return itemId;
}

function requireContextReference(context: CapturedContext, provenance: DecisionContextItemProvenance): void {
  if (provenance.origin === "AUTHORITATIVE_STATE" && !context.referenceKeys.has(structuralExpectationReferenceKey(provenance.stateReference))) {
    fail("ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID");
  }
}

function canonicalizeDispositions(value: unknown): EvidenceBindingDisposition[] {
  const captured = captureData(value, "ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
  if (!Array.isArray(captured) || captured.length === 0) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID");
  const selected = new Set<EvidenceBindingDisposition>();
  for (const disposition of captured) {
    if (!isDisposition(disposition)) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_DISPOSITION_INVALID");
    if (selected.has(disposition)) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_DUPLICATE_DISPOSITION");
    selected.add(disposition);
  }
  return EVIDENCE_BINDING_DISPOSITIONS.filter((disposition) => selected.has(disposition));
}

function captureInput(context: CapturedContext, input: unknown): CanonicalInput {
  const captured = captureData(input, "ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
  const kind = captured.kind;
  const exact = (keys: readonly string[]) => {
    const actual = Object.keys(captured);
    if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
  };
  if (kind === "EVIDENCE_BINDING") {
    exact(["kind", "subjectItemId", "acceptedDispositions", "provenance"]);
    const provenance = captureProvenance(captured.provenance, "ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID", "ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID");
    requireContextReference(context, provenance);
    return { kind, subjectItemId: requireContextItem(context, captured.subjectItemId), acceptedDispositions: canonicalizeDispositions(captured.acceptedDispositions), provenance };
  }
  if (kind === "CONTEXT_ROLE") {
    exact(["kind", "role", "minimumCount", "provenance"]);
    if (!isRole(captured.role) || typeof captured.minimumCount !== "number" || !Number.isSafeInteger(captured.minimumCount) || captured.minimumCount <= 0) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    const provenance = captureProvenance(captured.provenance, "ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID", "ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID");
    requireContextReference(context, provenance);
    return { kind, role: captured.role, minimumCount: captured.minimumCount, provenance };
  }
  if (kind === "DEPENDENCY") {
    exact(["kind", "dependentItemId", "prerequisiteItemId", "provenance"]);
    const dependentItemId = requireContextItem(context, captured.dependentItemId);
    const prerequisiteItemId = requireContextItem(context, captured.prerequisiteItemId);
    if (dependentItemId === prerequisiteItemId) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
    const provenance = captureProvenance(captured.provenance, "ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID", "ERR_DECISION_STRUCTURAL_EXPECTATION_REFERENCE_INVALID");
    requireContextReference(context, provenance);
    return { kind, dependentItemId, prerequisiteItemId, provenance };
  }
  return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INPUT_INVALID");
}

function canonicalBody(input: CanonicalInput): CanonicalEvidenceBindingExpectationBody | CanonicalContextRoleExpectationBody | CanonicalDependencyExpectationBody {
  switch (input.kind) {
    case "EVIDENCE_BINDING":
      return [input.subjectItemId, input.acceptedDispositions];
    case "CONTEXT_ROLE":
      return [input.role, input.minimumCount];
    case "DEPENDENCY":
      return [input.dependentItemId, input.prerequisiteItemId];
  }
}

function materialize(contextId: string, input: CanonicalInput, expectationId: string): StructuralExpectation {
  switch (input.kind) {
    case "EVIDENCE_BINDING": {
      const expectation: EvidenceBindingStructuralExpectation = {
        artifactKind: "STRUCTURAL_EXPECTATION",
        schemaVersion: STRUCTURAL_EXPECTATION_SCHEMA_VERSION,
        expectationId,
        contextId,
        kind: input.kind,
        subjectItemId: input.subjectItemId,
        acceptedDispositions: [...input.acceptedDispositions],
        provenance: input.provenance
      };
      return expectation;
    }
    case "CONTEXT_ROLE": {
      const expectation: ContextRoleStructuralExpectation = {
        artifactKind: "STRUCTURAL_EXPECTATION",
        schemaVersion: STRUCTURAL_EXPECTATION_SCHEMA_VERSION,
        expectationId,
        contextId,
        kind: input.kind,
        role: input.role,
        minimumCount: input.minimumCount,
        provenance: input.provenance
      };
      return expectation;
    }
    case "DEPENDENCY": {
      const expectation: DependencyStructuralExpectation = {
        artifactKind: "STRUCTURAL_EXPECTATION",
        schemaVersion: STRUCTURAL_EXPECTATION_SCHEMA_VERSION,
        expectationId,
        contextId,
        kind: input.kind,
        dependentItemId: input.dependentItemId,
        prerequisiteItemId: input.prerequisiteItemId,
        provenance: input.provenance
      };
      return expectation;
    }
  }
}

function assertStoredDispositionsCanonical(value: CapturedData | undefined, expected: EvidenceBindingDisposition[]): void {
  if (!Array.isArray(value) || value.length !== expected.length || value.some((disposition, index) => disposition !== expected[index])) {
    fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  }
}

function expectationInputFromArtifact(context: CapturedContext, expectation: StructuralExpectation): { expectationId: string; input: CanonicalInput } {
  const captured = captureData(expectation, "ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  if (captured.artifactKind !== "STRUCTURAL_EXPECTATION" || captured.schemaVersion !== STRUCTURAL_EXPECTATION_SCHEMA_VERSION || captured.contextId !== context.contextId || !isNonEmptyString(captured.expectationId) || !isKind(captured.kind)) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  let input: CanonicalInput;
  switch (captured.kind) {
    case "EVIDENCE_BINDING":
      input = captureInput(context, {
        kind: captured.kind,
        subjectItemId: captured.subjectItemId,
        acceptedDispositions: captured.acceptedDispositions,
        provenance: captured.provenance
      });
      if (input.kind !== "EVIDENCE_BINDING") return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
      assertStoredDispositionsCanonical(captured.acceptedDispositions, input.acceptedDispositions);
      break;
    case "CONTEXT_ROLE":
      input = captureInput(context, {
        kind: captured.kind,
        role: captured.role,
        minimumCount: captured.minimumCount,
        provenance: captured.provenance
      });
      break;
    case "DEPENDENCY":
      input = captureInput(context, {
        kind: captured.kind,
        dependentItemId: captured.dependentItemId,
        prerequisiteItemId: captured.prerequisiteItemId,
        provenance: captured.provenance
      });
      break;
  }
  const expectedKeys = input.kind === "EVIDENCE_BINDING"
    ? ["artifactKind", "schemaVersion", "expectationId", "contextId", "kind", "subjectItemId", "acceptedDispositions", "provenance"]
    : input.kind === "CONTEXT_ROLE"
      ? ["artifactKind", "schemaVersion", "expectationId", "contextId", "kind", "role", "minimumCount", "provenance"]
      : ["artifactKind", "schemaVersion", "expectationId", "contextId", "kind", "dependentItemId", "prerequisiteItemId", "provenance"];
  const keys = Object.keys(captured);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail("ERR_DECISION_STRUCTURAL_EXPECTATION_INVALID");
  return { expectationId: captured.expectationId, input };
}

function assertAgainstCapturedContext(context: CapturedContext, expectation: StructuralExpectation): void {
  const captured = expectationInputFromArtifact(context, expectation);
  const expectedId = buildStructuralExpectationId(context.contextId, captured.input.kind, canonicalBody(captured.input), captured.input.provenance);
  if (captured.expectationId !== expectedId) fail("ERR_DECISION_STRUCTURAL_EXPECTATION_ID_MISMATCH");
}

/** Creates one explicit structural comparison target. It does not derive a finding or inspect semantic bindings. */
export function createStructuralExpectation(context: DecisionContextDraft, input: StructuralExpectationInput): StructuralExpectation {
  const capturedContext = captureContext(context);
  const capturedInput = captureInput(capturedContext, input);
  const expectationId = buildStructuralExpectationId(capturedContext.contextId, capturedInput.kind, canonicalBody(capturedInput), capturedInput.provenance);
  const expectation = materialize(capturedContext.contextId, capturedInput, expectationId);
  assertAgainstCapturedContext(capturedContext, expectation);
  return structuredClone(expectation);
}

/** Structural integrity only: this assertion neither resolves authority nor evaluates binding satisfaction. */
export function assertStructuralExpectation(context: DecisionContextDraft, expectation: StructuralExpectation): void {
  assertAgainstCapturedContext(captureContext(context), expectation);
}
