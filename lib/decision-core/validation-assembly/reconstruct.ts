import { assertDecisionContextDraft, type DecisionContextDraft } from "../context";
import { assertStructuralConsequence, type StructuralConsequence, type StructuralConsequencePropagationBasis } from "../structural-consequences";
import { assertStructuralExpectation, type StructuralExpectation } from "../structural-findings";
import { assertStructuralGap, reconstructStructuralGap, type StructuralGap, type StructuralGapObservationBasis } from "../structural-gaps";
import { buildDecisionContextValidationAssemblyId, compareDecisionContextValidationAssemblyStrings } from "./identity";
import {
  DECISION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION,
  type DecisionContextValidationAssembly,
  type DecisionContextValidationAssemblyInput,
  type StructuralConsequenceValidationInput,
  type StructuralExpectationValidationInput,
  type StructuralExpectationValidationResult,
  type StructuralValidationBasisDescriptor
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const inputKeys = ["expectationValidations", "consequenceValidations"] as const;
const expectationValidationKeys = ["expectation", "basis", "result"] as const;
const consequenceValidationKeys = ["expectation", "gapBasis", "gap", "propagationBasis", "consequence"] as const;
const assemblyKeys = ["artifactKind", "schemaVersion", "assemblyId", "contextId", "expectationResults", "consequenceIds"] as const;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

const isString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const same = (left: unknown, right: unknown): boolean => {
  if (left === right) return true;
  if (left === null || right === null || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left) || Array.isArray(right)) return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((value, index) => same(value, right[index]));
  const leftRecord = left as Record<string, unknown>;
  const rightRecord = right as Record<string, unknown>;
  const leftKeys = Object.keys(leftRecord);
  const rightKeys = Object.keys(rightRecord);
  return leftKeys.length === rightKeys.length
    && leftKeys.every((key) => Object.prototype.hasOwnProperty.call(rightRecord, key) && same(leftRecord[key], rightRecord[key]));
};

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const descriptor = Reflect.getOwnPropertyDescriptor(value, "length");
        const length = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
        if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length; index += 1) {
          const item = Reflect.getOwnPropertyDescriptor(value, String(index));
          if (item === undefined || item.enumerable !== true || !("value" in item)) return fail(code);
          result.push(capture(item.value, code, ancestors));
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

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
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
    const descriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    const length = descriptor !== undefined && "value" in descriptor ? descriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || keys.length !== length + 1 || !keys.includes("length") || keys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const item = Reflect.getOwnPropertyDescriptor(value, String(index));
      if (item === undefined || item.enumerable !== true || !("value" in item)) return fail(code);
      result.push(item.value);
    }
    return result;
  } catch { return fail(code); }
}

function captureContext(context: DecisionContextDraft): DecisionContextDraft {
  const captured = exact(context, contextKeys, "ERR_DECISION_CONTEXT_INVALID");
  Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
  return captured as unknown as DecisionContextDraft;
}

function captureInput(input: DecisionContextValidationAssemblyInput): { expectationValidations: unknown[]; consequenceValidations: unknown[] } {
  const code = "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID";
  const wrapper = rawExact(input, inputKeys, code);
  return { expectationValidations: rawArray(wrapper.expectationValidations, code), consequenceValidations: rawArray(wrapper.consequenceValidations, code) };
}

function canonicalIds(values: unknown, code: string): string[] {
  if (!Array.isArray(values) || values.some((value) => !isString(value))) return fail(code);
  const sorted = [...values].sort(compareDecisionContextValidationAssemblyStrings);
  if (new Set(sorted).size !== sorted.length) return fail(code);
  return sorted;
}

function snapshotExpectation(context: DecisionContextDraft, value: unknown): StructuralExpectation {
  const code = "ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID";
  const captured = capture(value, code) as unknown as StructuralExpectation;
  try {
    Reflect.apply(assertStructuralExpectation, undefined, [context, captured]);
    return captured;
  } catch { return fail(code); }
}

function snapshotGapBasis(value: unknown, kind: StructuralExpectation["kind"]): StructuralGapObservationBasis {
  const basisCode = "ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID";
  const keys = kind === "EVIDENCE_BINDING" ? ["kind", "bindings"] : kind === "CONTEXT_ROLE" ? ["kind"] : ["kind", "relationProposals"];
  const wrapper = rawExact(value, keys, basisCode);
  if (wrapper.kind !== kind) return fail(basisCode);
  if (kind === "CONTEXT_ROLE") return { kind };
  const nestedCode = kind === "EVIDENCE_BINDING" ? "ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID" : "ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID";
  const values = rawArray(kind === "EVIDENCE_BINDING" ? wrapper.bindings : wrapper.relationProposals, basisCode).map((nested) => capture(nested, nestedCode));
  return kind === "EVIDENCE_BINDING"
    ? { kind, bindings: values as never }
    : { kind, relationProposals: values as never };
}

function snapshotGap(value: unknown): StructuralGap {
  return capture(value, "ERR_DECISION_STRUCTURAL_GAP_INVALID") as unknown as StructuralGap;
}

function snapshotPropagationBasis(value: unknown): StructuralConsequencePropagationBasis {
  const basisCode = "ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID";
  const wrapper = rawExact(value, ["kind", "relationProposals"], basisCode);
  if (wrapper.kind !== "DEPENDENCY_PATH") return fail(basisCode);
  return {
    kind: "DEPENDENCY_PATH",
    relationProposals: rawArray(wrapper.relationProposals, basisCode).map((nested) => capture(nested, "ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID")) as never
  };
}

function snapshotConsequence(value: unknown): StructuralConsequence {
  return capture(value, "ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID") as unknown as StructuralConsequence;
}

function descriptor(basis: StructuralGapObservationBasis, code: string): StructuralValidationBasisDescriptor {
  const captured = capture(basis, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  if (captured.kind === "CONTEXT_ROLE" && Object.keys(captured).length === 1) return { kind: "CONTEXT_ROLE" };
  if (captured.kind === "EVIDENCE_BINDING" && Object.keys(captured).length === 2 && Array.isArray(captured.bindings)) {
    const ids = canonicalIds(captured.bindings.map((binding) => binding !== null && !Array.isArray(binding) && typeof binding === "object" ? binding.bindingId : undefined), code);
    return { kind: "EVIDENCE_BINDING", bindingIds: ids };
  }
  if (captured.kind === "DEPENDENCY" && Object.keys(captured).length === 2 && Array.isArray(captured.relationProposals)) {
    const ids = canonicalIds(captured.relationProposals.map((proposal) => proposal !== null && !Array.isArray(proposal) && typeof proposal === "object" ? proposal.relationProposalId : undefined), code);
    return { kind: "DEPENDENCY", relationProposalIds: ids };
  }
  return fail(code);
}

function expectationResult(context: DecisionContextDraft, value: unknown): StructuralExpectationValidationResult {
  const entry = rawExact(value, expectationValidationKeys, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const expectation = snapshotExpectation(context, entry.expectation);
  const basisInput = snapshotGapBasis(entry.basis, expectation.kind);
  const result = entry.result === null ? null : snapshotGap(entry.result);
  const canonical = reconstructStructuralGap(context, expectation, basisInput);
  const basis = descriptor(basisInput, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  if (canonical === null) {
    if (result !== null) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH");
    return { expectationId: expectation.expectationId, basis, outcome: "NO_GAP" };
  }
  if (result === null) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_RESULT_MISMATCH");
  assertStructuralGap(context, expectation, basisInput, result);
  return { expectationId: expectation.expectationId, basis, outcome: "GAP", gapId: canonical.gapId };
}

function consequenceId(context: DecisionContextDraft, value: unknown, results: readonly StructuralExpectationValidationResult[]): string {
  const entry = rawExact(value, consequenceValidationKeys, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const expectation = snapshotExpectation(context, entry.expectation);
  const gapBasis = snapshotGapBasis(entry.gapBasis, expectation.kind);
  const gap = snapshotGap(entry.gap);
  const propagationBasis = snapshotPropagationBasis(entry.propagationBasis);
  const consequence = snapshotConsequence(entry.consequence);
  assertStructuralConsequence(context, expectation, gapBasis, gap, propagationBasis, consequence);
  const canonicalGap = reconstructStructuralGap(context, expectation, gapBasis);
  if (canonicalGap === null) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING");
  const basis = descriptor(gapBasis, "ERR_DECISION_VALIDATION_ASSEMBLY_INPUT_INVALID");
  const source = results.find((result) => result.expectationId === expectation.expectationId && result.outcome === "GAP" && result.gapId === canonicalGap.gapId && same(result.basis, basis));
  if (source === undefined) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_CONSEQUENCE_SOURCE_MISSING");
  return consequence.consequenceId;
}

function build(context: DecisionContextDraft, input: DecisionContextValidationAssemblyInput): DecisionContextValidationAssembly {
  const capturedContext = captureContext(context);
  const capturedInput = captureInput(input);
  const byExpectation = new Map<string, StructuralExpectationValidationResult>();
  for (const value of capturedInput.expectationValidations) {
    const result = expectationResult(capturedContext, value);
    if (byExpectation.has(result.expectationId)) fail("ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_EXPECTATION");
    byExpectation.set(result.expectationId, result);
  }
  const expectationResults = [...byExpectation.values()].sort((left, right) => compareDecisionContextValidationAssemblyStrings(left.expectationId, right.expectationId));
  const consequenceIds = canonicalIds(capturedInput.consequenceValidations.map((value) => consequenceId(capturedContext, value, expectationResults)), "ERR_DECISION_VALIDATION_ASSEMBLY_DUPLICATE_CONSEQUENCE");
  return {
    artifactKind: "DECISION_CONTEXT_VALIDATION_ASSEMBLY",
    schemaVersion: DECISION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION,
    assemblyId: buildDecisionContextValidationAssemblyId(capturedContext.contextId, expectationResults, consequenceIds),
    contextId: capturedContext.contextId,
    expectationResults,
    consequenceIds
  };
}

/** Assembles revalidated predecessor derivations; it does not establish truth or completeness. */
export function assembleDecisionContextValidation(context: DecisionContextDraft, input: DecisionContextValidationAssemblyInput): DecisionContextValidationAssembly {
  return structuredClone(build(context, input));
}

/** Verifies stored assembly representation against the exact revalidated derivation inputs. */
export function assertDecisionContextValidationAssembly(context: DecisionContextDraft, input: DecisionContextValidationAssemblyInput, assembly: DecisionContextValidationAssembly): void {
  const expected = build(context, input);
  try {
    const captured = exact(assembly, assemblyKeys, "ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
    if (captured.artifactKind !== "DECISION_CONTEXT_VALIDATION_ASSEMBLY" || captured.schemaVersion !== DECISION_CONTEXT_VALIDATION_ASSEMBLY_SCHEMA_VERSION || !isString(captured.assemblyId) || captured.contextId !== expected.contextId || !Array.isArray(captured.expectationResults) || !Array.isArray(captured.consequenceIds)) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
    if (captured.expectationResults.some((result) => result === null || Array.isArray(result) || typeof result !== "object") || !captured.consequenceIds.every(isString)) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
    const expectedBody = { artifactKind: expected.artifactKind, schemaVersion: expected.schemaVersion, contextId: expected.contextId, expectationResults: expected.expectationResults, consequenceIds: expected.consequenceIds };
    const actualBody = { artifactKind: captured.artifactKind, schemaVersion: captured.schemaVersion, contextId: captured.contextId, expectationResults: captured.expectationResults, consequenceIds: captured.consequenceIds };
    if (!same(actualBody, expectedBody)) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
    if (captured.assemblyId !== expected.assemblyId) return fail("ERR_DECISION_VALIDATION_ASSEMBLY_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_VALIDATION_ASSEMBLY_ID_MISMATCH") throw error;
    return fail("ERR_DECISION_VALIDATION_ASSEMBLY_INVALID");
  }
}
