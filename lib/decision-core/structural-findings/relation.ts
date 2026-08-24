import type { AuthoritativeStateReference } from "../authority";
import { assertDecisionContextDraft, type DecisionContextDraft, type DecisionContextItemProvenance } from "../context";
import {
  buildStructuralRelationProposalId,
  structuralRelationReferenceKey
} from "./relation-identity";
import {
  STRUCTURAL_RELATION_PROPOSAL_KINDS,
  STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION,
  type ContradictionStructuralRelationProposal,
  type DependencyStructuralRelationProposal,
  type StructuralRelationProposal,
  type StructuralRelationProposalInput,
  type StructuralRelationProposalKind
} from "./relation-types";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const itemKeys = ["itemId", "role", "statement", "provenance"] as const;

type CapturedData = null | boolean | number | string | CapturedData[] | { [key: string]: CapturedData };

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isKind = (value: unknown): value is StructuralRelationProposalKind => STRUCTURAL_RELATION_PROPOSAL_KINDS.some((kind) => kind === value);
const compareStrings = (left: string, right: string): number => left < right ? -1 : left > right ? 1 : 0;

function captureData(value: unknown, errorCode: string, ancestors: WeakSet<object> = new WeakSet<object>()): CapturedData {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(errorCode);
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
  const { producerId, authorityContractId, artifactId, locator } = captured;
  if (!isNonEmptyString(producerId) || !isNonEmptyString(authorityContractId) || !isNonEmptyString(artifactId) || !isNonEmptyString(locator)) return fail(errorCode);
  return { producerId, authorityContractId, artifactId, locator };
}

function captureProvenance(value: unknown, inputErrorCode: string, referenceErrorCode: string): DecisionContextItemProvenance {
  const captured = captureData(value, inputErrorCode);
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail(inputErrorCode);
  const exact = (keys: readonly string[]) => {
    const actual = Object.keys(captured);
    if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) fail(inputErrorCode);
  };
  if (captured.origin === "AUTHORITATIVE_STATE") {
    exact(["origin", "stateReference"]);
    return { origin: "AUTHORITATIVE_STATE", stateReference: captureReference(captured.stateReference, referenceErrorCode) };
  }
  if (captured.origin === "HUMAN_INPUT") {
    exact(["origin", "actorId"]);
    if (!isNonEmptyString(captured.actorId)) return fail(inputErrorCode);
    return { origin: "HUMAN_INPUT", actorId: captured.actorId };
  }
  if (captured.origin === "MODEL_PROPOSAL") {
    exact(["origin", "proposalRef"]);
    if (!isNonEmptyString(captured.proposalRef)) return fail(inputErrorCode);
    return { origin: "MODEL_PROPOSAL", proposalRef: captured.proposalRef };
  }
  if (captured.origin === "DETERMINISTIC_DERIVATION") {
    exact(["origin", "ruleId"]);
    if (!isNonEmptyString(captured.ruleId)) return fail(inputErrorCode);
    return { origin: "DETERMINISTIC_DERIVATION", ruleId: captured.ruleId };
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
    const captured = captureExactObject(context, contextKeys, "ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID");
    Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
    if (!isNonEmptyString(captured.contextId) || !Array.isArray(captured.items) || !Array.isArray(captured.sourceStateReferences)) return fail("ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID");
    const itemIds = new Set<string>();
    for (const value of captured.items) {
      const item = captureExactObject(value, itemKeys, "ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID");
      if (!isNonEmptyString(item.itemId)) return fail("ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID");
      itemIds.add(item.itemId);
    }
    const referenceSet = new Set<string>();
    for (const value of captured.sourceStateReferences) referenceSet.add(structuralRelationReferenceKey(captureReference(value, "ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID")));
    return { contextId: captured.contextId, itemIds, referenceKeys: referenceSet };
  } catch {
    return fail("ERR_DECISION_STRUCTURAL_RELATION_CONTEXT_INVALID");
  }
}

interface CanonicalContradictionInput {
  kind: "CONTRADICTION";
  itemIds: [string, string];
  provenance: DecisionContextItemProvenance;
}

interface CanonicalDependencyInput {
  kind: "DEPENDENCY";
  dependentItemId: string;
  prerequisiteItemId: string;
  provenance: DecisionContextItemProvenance;
}

type CanonicalInput = CanonicalContradictionInput | CanonicalDependencyInput;

function requireContextItem(context: CapturedContext, itemId: unknown): string {
  if (!isNonEmptyString(itemId) || !context.itemIds.has(itemId)) return fail("ERR_DECISION_STRUCTURAL_RELATION_ITEM_NOT_FOUND");
  return itemId;
}

function requireContextReference(context: CapturedContext, provenance: DecisionContextItemProvenance): void {
  if (provenance.origin === "AUTHORITATIVE_STATE" && !context.referenceKeys.has(structuralRelationReferenceKey(provenance.stateReference))) {
    fail("ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID");
  }
}

function captureItemPair(value: unknown): [string, string] {
  const captured = captureData(value, "ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
  if (!Array.isArray(captured) || captured.length !== 2 || !isNonEmptyString(captured[0]) || !isNonEmptyString(captured[1])) return fail("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
  return [captured[0], captured[1]];
}

function captureInput(context: CapturedContext, input: unknown): CanonicalInput {
  const captured = captureData(input, "ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
  const exact = (keys: readonly string[]) => {
    const actual = Object.keys(captured);
    if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) fail("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
  };
  if (captured.kind === "CONTRADICTION") {
    exact(["kind", "itemIds", "provenance"]);
    const [left, right] = captureItemPair(captured.itemIds);
    const first = requireContextItem(context, left);
    const second = requireContextItem(context, right);
    if (first === second) return fail("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
    const provenance = captureProvenance(captured.provenance, "ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID", "ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID");
    requireContextReference(context, provenance);
    return { kind: "CONTRADICTION", itemIds: compareStrings(first, second) <= 0 ? [first, second] : [second, first], provenance };
  }
  if (captured.kind === "DEPENDENCY") {
    exact(["kind", "dependentItemId", "prerequisiteItemId", "provenance"]);
    const dependentItemId = requireContextItem(context, captured.dependentItemId);
    const prerequisiteItemId = requireContextItem(context, captured.prerequisiteItemId);
    if (dependentItemId === prerequisiteItemId) return fail("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
    const provenance = captureProvenance(captured.provenance, "ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID", "ERR_DECISION_STRUCTURAL_RELATION_REFERENCE_INVALID");
    requireContextReference(context, provenance);
    return { kind: "DEPENDENCY", dependentItemId, prerequisiteItemId, provenance };
  }
  return fail("ERR_DECISION_STRUCTURAL_RELATION_INPUT_INVALID");
}

function relationBody(input: CanonicalInput): [string, string] {
  return input.kind === "CONTRADICTION" ? [...input.itemIds] : [input.dependentItemId, input.prerequisiteItemId];
}

function materialize(contextId: string, input: CanonicalInput, relationProposalId: string): StructuralRelationProposal {
  if (input.kind === "CONTRADICTION") {
    const proposal: ContradictionStructuralRelationProposal = { artifactKind: "STRUCTURAL_RELATION_PROPOSAL", schemaVersion: STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION, relationProposalId, contextId, kind: input.kind, itemIds: [...input.itemIds] as [string, string], provenance: input.provenance };
    return proposal;
  }
  const proposal: DependencyStructuralRelationProposal = { artifactKind: "STRUCTURAL_RELATION_PROPOSAL", schemaVersion: STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION, relationProposalId, contextId, kind: input.kind, dependentItemId: input.dependentItemId, prerequisiteItemId: input.prerequisiteItemId, provenance: input.provenance };
  return proposal;
}

function assertStoredContradictionCanonical(submitted: CapturedData | undefined, canonical: [string, string]): void {
  if (!Array.isArray(submitted) || submitted.length !== 2 || submitted[0] !== canonical[0] || submitted[1] !== canonical[1]) {
    fail("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  }
}

function proposalInputFromArtifact(context: CapturedContext, proposal: StructuralRelationProposal): { relationProposalId: string; input: CanonicalInput } {
  const captured = captureData(proposal, "ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  if (Array.isArray(captured) || captured === null || typeof captured !== "object") return fail("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  if (captured.artifactKind !== "STRUCTURAL_RELATION_PROPOSAL" || captured.schemaVersion !== STRUCTURAL_RELATION_PROPOSAL_SCHEMA_VERSION || captured.contextId !== context.contextId || !isNonEmptyString(captured.relationProposalId) || !isKind(captured.kind)) return fail("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
  const expectedKeys = captured.kind === "CONTRADICTION"
    ? ["artifactKind", "schemaVersion", "relationProposalId", "contextId", "kind", "itemIds", "provenance"]
    : ["artifactKind", "schemaVersion", "relationProposalId", "contextId", "kind", "dependentItemId", "prerequisiteItemId", "provenance"];
  const keys = Object.keys(captured);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail("ERR_DECISION_STRUCTURAL_RELATION_INVALID");

  let input: CanonicalInput;
  if (captured.kind === "CONTRADICTION") {
    input = captureInput(context, { kind: "CONTRADICTION", itemIds: captured.itemIds, provenance: captured.provenance });
    if (input.kind !== "CONTRADICTION") return fail("ERR_DECISION_STRUCTURAL_RELATION_INVALID");
    assertStoredContradictionCanonical(captured.itemIds, input.itemIds);
  } else {
    input = captureInput(context, { kind: "DEPENDENCY", dependentItemId: captured.dependentItemId, prerequisiteItemId: captured.prerequisiteItemId, provenance: captured.provenance });
  }
  return { relationProposalId: captured.relationProposalId, input };
}

function assertAgainstCapturedContext(context: CapturedContext, proposal: StructuralRelationProposal): void {
  const captured = proposalInputFromArtifact(context, proposal);
  const expectedId = buildStructuralRelationProposalId(context.contextId, captured.input.kind, relationBody(captured.input), captured.input.provenance);
  if (captured.relationProposalId !== expectedId) fail("ERR_DECISION_STRUCTURAL_RELATION_ID_MISMATCH");
}

/** Creates one explicit relation proposal only; it neither detects nor validates a relation. */
export function createStructuralRelationProposal(context: DecisionContextDraft, input: StructuralRelationProposalInput): StructuralRelationProposal {
  const capturedContext = captureContext(context);
  const capturedInput = captureInput(capturedContext, input);
  const relationProposalId = buildStructuralRelationProposalId(capturedContext.contextId, capturedInput.kind, relationBody(capturedInput), capturedInput.provenance);
  const proposal = materialize(capturedContext.contextId, capturedInput, relationProposalId);
  assertAgainstCapturedContext(capturedContext, proposal);
  return structuredClone(proposal);
}

/** Structural integrity only; this assertion does not establish relation truth or a finding. */
export function assertStructuralRelationProposal(context: DecisionContextDraft, proposal: StructuralRelationProposal): void {
  assertAgainstCapturedContext(captureContext(context), proposal);
}
