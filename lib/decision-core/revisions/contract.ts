import { assertDecisionContextDraft, type DecisionContextDraft } from "../context";
import { assertStructuralExpectation, type StructuralExpectation } from "../structural-findings";
import {
  assembleDecisionContextValidation,
  assertDecisionContextValidationAssembly,
  type DecisionContextValidationAssembly,
  type DecisionContextValidationAssemblyInput,
  type StructuralConsequenceValidationInput,
  type StructuralExpectationValidationInput
} from "../validation-assembly";
import { buildDecisionContextRevisionId, compareDecisionContextRevisionStrings } from "./identity";
import { DECISION_CONTEXT_REVISION_SCHEMA_VERSION, type DecisionContextRevision, type DecisionContextRevisionInput } from "./types";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const revisionInputKeys = ["previousRevisionId", "context", "validationInput", "validationAssembly"] as const;
const revisionKeys = ["artifactKind", "schemaVersion", "revisionId", "previousRevisionId", "context", "validationInput", "validationAssembly"] as const;
const validationInputKeys = ["expectationValidations", "consequenceValidations"] as const;
const expectationValidationKeys = ["expectation", "basis", "result"] as const;
const consequenceValidationKeys = ["expectation", "gapBasis", "gap", "propagationBasis", "consequence"] as const;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;
const sameData = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => sameData(value, right[index]));
  const leftRecord = left as Record<string, unknown>; const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord).sort(compareDecisionContextRevisionStrings);
  const rightKeys = Object.keys(rightRecord).sort(compareDecisionContextRevisionStrings);
  return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index] && sameData(leftRecord[key], rightRecord[key]));
};

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
        const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
          result.push(capture(descriptor.value, code, ancestors));
        }
        return result;
      }
      const result: { [key: string]: Captured } = {};
      for (const key of Reflect.ownKeys(value)) {
        if (typeof key !== "string") return fail(code);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
        if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
        Object.defineProperty(result, key, { value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true });
      }
      return result;
    } finally { ancestors.delete(value); }
  } catch { return fail(code); }
}

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

function captureContext(value: unknown): DecisionContextDraft {
  const captured = capture(value, "ERR_DECISION_CONTEXT_INVALID");
  if (captured === null || Array.isArray(captured) || typeof captured !== "object" || Object.keys(captured).length !== contextKeys.length || contextKeys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) fail("ERR_DECISION_CONTEXT_INVALID");
  Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
  return captured as unknown as DecisionContextDraft;
}

function capturePreviousRevisionId(value: unknown, code: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string" || !/^DREV_[0-9A-F]{24}$/.test(value)) return fail(code);
  return value;
}

function captureExpectation(context: DecisionContextDraft, value: unknown): StructuralExpectation {
  const code = "ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID";
  const captured = capture(value, code) as unknown as StructuralExpectation;
  try {
    Reflect.apply(assertStructuralExpectation, undefined, [context, captured]);
    return captured;
  } catch { return fail(code); }
}

function captureGapBasis(value: unknown, kind: StructuralExpectation["kind"]): unknown {
  const basisCode = "ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID";
  const keys = kind === "EVIDENCE_BINDING" ? ["kind", "bindings"] : kind === "CONTEXT_ROLE" ? ["kind"] : ["kind", "relationProposals"];
  const wrapper = rawExact(value, keys, basisCode);
  if (wrapper.kind !== kind) return fail(basisCode);
  if (kind === "CONTEXT_ROLE") return { kind };
  const nestedCode = kind === "EVIDENCE_BINDING" ? "ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID" : "ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID";
  const values = rawArray(kind === "EVIDENCE_BINDING" ? wrapper.bindings : wrapper.relationProposals, basisCode).map((nested) => capture(nested, nestedCode));
  return kind === "EVIDENCE_BINDING" ? { kind, bindings: values } : { kind, relationProposals: values };
}

function capturePropagationBasis(value: unknown): unknown {
  const basisCode = "ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID";
  const wrapper = rawExact(value, ["kind", "relationProposals"], basisCode);
  if (wrapper.kind !== "DEPENDENCY_PATH") return fail(basisCode);
  return { kind: "DEPENDENCY_PATH", relationProposals: rawArray(wrapper.relationProposals, basisCode).map((nested) => capture(nested, "ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID")) };
}

function captureExpectationValidation(context: DecisionContextDraft, value: unknown): StructuralExpectationValidationInput {
  const entry = rawExact(value, expectationValidationKeys, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const expectation = captureExpectation(context, entry.expectation);
  return {
    expectation,
    basis: captureGapBasis(entry.basis, expectation.kind) as StructuralExpectationValidationInput["basis"],
    result: entry.result === null ? null : capture(entry.result, "ERR_DECISION_STRUCTURAL_GAP_INVALID") as unknown as StructuralExpectationValidationInput["result"]
  };
}

function captureConsequenceValidation(context: DecisionContextDraft, value: unknown): StructuralConsequenceValidationInput {
  const entry = rawExact(value, consequenceValidationKeys, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const expectation = captureExpectation(context, entry.expectation);
  return {
    expectation,
    gapBasis: captureGapBasis(entry.gapBasis, expectation.kind) as StructuralConsequenceValidationInput["gapBasis"],
    gap: capture(entry.gap, "ERR_DECISION_STRUCTURAL_GAP_INVALID") as unknown as StructuralConsequenceValidationInput["gap"],
    propagationBasis: capturePropagationBasis(entry.propagationBasis) as StructuralConsequenceValidationInput["propagationBasis"],
    consequence: capture(entry.consequence, "ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID") as unknown as StructuralConsequenceValidationInput["consequence"]
  };
}

function captureValidationInput(context: DecisionContextDraft, value: unknown): DecisionContextValidationAssemblyInput {
  const wrapper = rawExact(value, validationInputKeys, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  return {
    expectationValidations: rawArray(wrapper.expectationValidations, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID").map((entry) => captureExpectationValidation(context, entry)),
    consequenceValidations: rawArray(wrapper.consequenceValidations, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID").map((entry) => captureConsequenceValidation(context, entry))
  };
}

function idOf(value: unknown, key: string): string {
  if (value === null || typeof value !== "object" || Array.isArray(value) || !isNonEmptyString((value as Record<string, unknown>)[key])) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  return (value as Record<string, string>)[key];
}

function canonicalGapBasis(value: StructuralExpectationValidationInput["basis"]): StructuralExpectationValidationInput["basis"] {
  if (value.kind === "CONTEXT_ROLE") return { kind: "CONTEXT_ROLE" };
  if (value.kind === "EVIDENCE_BINDING") return { kind: "EVIDENCE_BINDING", bindings: [...value.bindings].sort((left, right) => compareDecisionContextRevisionStrings(idOf(left, "bindingId"), idOf(right, "bindingId"))) };
  return { kind: "DEPENDENCY", relationProposals: [...value.relationProposals].sort((left, right) => compareDecisionContextRevisionStrings(idOf(left, "relationProposalId"), idOf(right, "relationProposalId"))) };
}

function canonicalValidationInput(input: DecisionContextValidationAssemblyInput): DecisionContextValidationAssemblyInput {
  const expectationValidations = input.expectationValidations.map((entry) => ({ expectation: entry.expectation, basis: canonicalGapBasis(entry.basis), result: entry.result }))
    .sort((left, right) => compareDecisionContextRevisionStrings(left.expectation.expectationId, right.expectation.expectationId));
  const consequenceValidations = input.consequenceValidations.map((entry) => ({
    expectation: entry.expectation,
    gapBasis: canonicalGapBasis(entry.gapBasis),
    gap: entry.gap,
    propagationBasis: { kind: "DEPENDENCY_PATH" as const, relationProposals: [...entry.propagationBasis.relationProposals] },
    consequence: entry.consequence
  })).sort((left, right) => compareDecisionContextRevisionStrings(left.consequence.consequenceId, right.consequence.consequenceId));
  return { expectationValidations, consequenceValidations };
}

interface PreparedRevision {
  previousRevisionId: string | null;
  context: DecisionContextDraft;
  capturedValidationInput: DecisionContextValidationAssemblyInput;
  capturedValidationAssembly: DecisionContextValidationAssembly;
  validationInput: DecisionContextValidationAssemblyInput;
  validationAssembly: DecisionContextValidationAssembly;
}

function prepare(previousRevisionId: unknown, contextValue: unknown, validationInputValue: unknown, validationAssemblyValue: unknown, previousCode: string): PreparedRevision {
  const context = captureContext(contextValue);
  const previous = capturePreviousRevisionId(previousRevisionId, previousCode);
  const validationInput = captureValidationInput(context, validationInputValue);
  const validationAssembly = capture(validationAssemblyValue, "ERR_DECISION_VALIDATION_ASSEMBLY_INVALID") as unknown as DecisionContextValidationAssembly;
  assertDecisionContextValidationAssembly(context, validationInput, validationAssembly);
  const canonicalInput = canonicalValidationInput(validationInput);
  const canonicalAssembly = assembleDecisionContextValidation(context, canonicalInput);
  assertDecisionContextValidationAssembly(context, canonicalInput, validationAssembly);
  return {
    previousRevisionId: previous,
    context,
    capturedValidationInput: validationInput,
    capturedValidationAssembly: validationAssembly,
    validationInput: canonicalInput,
    validationAssembly: canonicalAssembly
  };
}

function construct(prepared: PreparedRevision): DecisionContextRevision {
  return {
    artifactKind: "DECISION_CONTEXT_REVISION",
    schemaVersion: DECISION_CONTEXT_REVISION_SCHEMA_VERSION,
    revisionId: buildDecisionContextRevisionId(prepared.previousRevisionId, prepared.context.contextId, prepared.validationAssembly.assemblyId),
    previousRevisionId: prepared.previousRevisionId,
    context: prepared.context,
    validationInput: prepared.validationInput,
    validationAssembly: prepared.validationAssembly
  };
}

/** Constructs a detached, self-contained revision artifact without persistence or parent lookup. */
export function createDecisionContextRevision(input: DecisionContextRevisionInput): DecisionContextRevision {
  const wrapper = rawExact(input, revisionInputKeys, "ERR_DECISION_CONTEXT_REVISION_INPUT_INVALID");
  return structuredClone(construct(prepare(wrapper.previousRevisionId, wrapper.context, wrapper.validationInput, wrapper.validationAssembly, "ERR_DECISION_CONTEXT_REVISION_PREVIOUS_ID_INVALID")));
}

/** Revalidates the embedded derivation and requires canonical stored revision representation. */
export function assertDecisionContextRevision(revision: DecisionContextRevision): void {
  const wrapper = rawExact(revision, revisionKeys, "ERR_DECISION_CONTEXT_REVISION_INVALID");
  if (wrapper.artifactKind !== "DECISION_CONTEXT_REVISION" || wrapper.schemaVersion !== DECISION_CONTEXT_REVISION_SCHEMA_VERSION || !isNonEmptyString(wrapper.revisionId)) fail("ERR_DECISION_CONTEXT_REVISION_INVALID");
  const prepared = prepare(wrapper.previousRevisionId, wrapper.context, wrapper.validationInput, wrapper.validationAssembly, "ERR_DECISION_CONTEXT_REVISION_INVALID");
  const expected = construct(prepared);
  if (!sameData(prepared.previousRevisionId, expected.previousRevisionId) || !sameData(prepared.context, expected.context) || !sameData(prepared.capturedValidationInput, expected.validationInput) || !sameData(prepared.capturedValidationAssembly, expected.validationAssembly)) fail("ERR_DECISION_CONTEXT_REVISION_INVALID");
  if (wrapper.revisionId !== expected.revisionId) fail("ERR_DECISION_CONTEXT_REVISION_ID_MISMATCH");
}
