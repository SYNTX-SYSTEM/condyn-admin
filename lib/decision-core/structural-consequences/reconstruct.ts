import {
  assertDecisionContextDraft,
  type DecisionContextDraft
} from "../context";
import {
  assertStructuralExpectation,
  assertStructuralRelationProposal,
  type StructuralExpectation,
  type StructuralRelationProposal
} from "../structural-findings";
import {
  assertStructuralGap,
  reconstructStructuralGap,
  type StructuralGap,
  type StructuralGapObservationBasis
} from "../structural-gaps";
import { buildStructuralConsequenceId } from "./identity";
import {
  STRUCTURAL_CONSEQUENCE_SCHEMA_VERSION,
  type StructuralConsequence,
  type StructuralConsequencePropagationBasis
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const consequenceKeys = ["artifactKind", "schemaVersion", "consequenceId", "contextId", "sourceGapId", "sourceItemId", "affectedItemId", "dependencyPathRelationProposalIds"] as const;

type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

const isString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;

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
    } finally {
      ancestors.delete(value);
    }
  } catch {
    return fail(code);
  }
}

function exact(value: unknown, expectedKeys: readonly string[], code: string): { [key: string]: Captured } {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const keys = Object.keys(captured);
  if (keys.length !== expectedKeys.length || expectedKeys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function captureContext(value: DecisionContextDraft): DecisionContextDraft {
  const code = "ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID";
  try {
    const captured = exact(value, contextKeys, code);
    Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
    return captured as unknown as DecisionContextDraft;
  } catch {
    return fail(code);
  }
}

function captureGapBasis(value: StructuralGapObservationBasis, expectation: Captured): StructuralGapObservationBasis {
  const basisCode = "ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID";
  const kind = expectation !== null && !Array.isArray(expectation) && typeof expectation === "object" ? expectation.kind : undefined;
  try {
    const expectedKeys = kind === "EVIDENCE_BINDING" ? ["kind", "bindings"] : kind === "CONTEXT_ROLE" ? ["kind"] : kind === "DEPENDENCY" ? ["kind", "relationProposals"] : undefined;
    if (expectedKeys === undefined || typeof value !== "object" || value === null || Array.isArray(value)) return fail(basisCode);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string") || ownKeys.length !== expectedKeys.length || expectedKeys.some((key) => !ownKeys.includes(key))) return fail(basisCode);
    const captured: Record<string, unknown> = {};
    for (const key of expectedKeys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(basisCode);
      captured[key] = descriptor.value;
    }
    if (captured.kind !== kind) return fail(basisCode);
    const arrayKey = kind === "EVIDENCE_BINDING" ? "bindings" : kind === "DEPENDENCY" ? "relationProposals" : undefined;
    if (arrayKey === undefined) return captured as unknown as StructuralGapObservationBasis;
    const container = captured[arrayKey];
    if (!Array.isArray(container)) return fail(basisCode);
    const arrayKeys = Reflect.ownKeys(container);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(container, "length");
    const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || arrayKeys.length !== length + 1 || !arrayKeys.includes("length") || arrayKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(basisCode);
    const nestedCode = kind === "EVIDENCE_BINDING" ? "ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID" : "ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID";
    const values: Captured[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(container, String(index));
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(basisCode);
      values.push(capture(descriptor.value, nestedCode));
    }
    captured[arrayKey] = values;
    return captured as unknown as StructuralGapObservationBasis;
  } catch (error) {
    if (error instanceof Error && (error.message === "ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID" || error.message === "ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID")) throw error;
    return fail(basisCode);
  }
}

function validateExpectation(context: DecisionContextDraft, expectation: Captured): StructuralExpectation {
  try {
    Reflect.apply(assertStructuralExpectation, undefined, [context, expectation]);
    return expectation as unknown as StructuralExpectation;
  } catch {
    return fail("ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID");
  }
}

function sourceGap(
  context: DecisionContextDraft,
  expectation: StructuralExpectation,
  gapBasis: StructuralGapObservationBasis,
  gap: StructuralGap
): { context: DecisionContextDraft; gap: StructuralGap; sourceItemId: string } {
  const capturedContext = captureContext(context);
  const capturedExpectationRepresentation = capture(expectation, "ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID");
  const capturedExpectation = validateExpectation(capturedContext, capturedExpectationRepresentation);
  const capturedGapBasis = captureGapBasis(gapBasis, capturedExpectationRepresentation);
  const capturedGap = capture(gap, "ERR_DECISION_STRUCTURAL_GAP_INVALID") as unknown as StructuralGap;
  assertStructuralGap(capturedContext, capturedExpectation, capturedGapBasis, capturedGap);
  const canonicalGap = reconstructStructuralGap(capturedContext, capturedExpectation, capturedGapBasis);
  if (canonicalGap === null) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
  if (canonicalGap.kind === "CONTEXT_ROLE") return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_SOURCE_NOT_ITEM_ANCHORED");
  return {
    context: capturedContext,
    gap: canonicalGap,
    sourceItemId: canonicalGap.kind === "EVIDENCE_BINDING" ? canonicalGap.subjectItemId : canonicalGap.dependentItemId
  };
}

function captureBasis(value: StructuralConsequencePropagationBasis): unknown[] {
  const code = "ERR_DECISION_STRUCTURAL_CONSEQUENCE_BASIS_INVALID";
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return fail(code);
    const keys = Reflect.ownKeys(value);
    if (keys.some((key) => typeof key !== "string") || keys.length !== 2 || !keys.includes("kind") || !keys.includes("relationProposals")) return fail(code);
    const kind = Reflect.getOwnPropertyDescriptor(value, "kind");
    const proposals = Reflect.getOwnPropertyDescriptor(value, "relationProposals");
    if (kind === undefined || proposals === undefined || kind.enumerable !== true || proposals.enumerable !== true || !("value" in kind) || !("value" in proposals) || kind.value !== "DEPENDENCY_PATH" || !Array.isArray(proposals.value)) return fail(code);
    const array = proposals.value;
    const arrayKeys = Reflect.ownKeys(array);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(array, "length");
    const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || arrayKeys.length !== length + 1 || !arrayKeys.includes("length") || arrayKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(array, String(index));
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      result.push(descriptor.value);
    }
    return result;
  } catch {
    return fail(code);
  }
}

function pathRelations(context: DecisionContextDraft, sourceItemId: string, basis: StructuralConsequencePropagationBasis): Extract<StructuralRelationProposal, { kind: "DEPENDENCY" }>[] {
  const values = captureBasis(basis);
  if (values.length === 0) return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
  const relations = values.map((value) => {
    try {
      const captured = capture(value, "ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID") as unknown as StructuralRelationProposal;
      Reflect.apply(assertStructuralRelationProposal, undefined, [context, captured]);
      return structuredClone(captured) as StructuralRelationProposal;
    } catch {
      return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_RELATION_INVALID");
    }
  });
  if (relations.some((relation) => relation.kind !== "DEPENDENCY")) return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
  const dependencies = relations as Extract<StructuralRelationProposal, { kind: "DEPENDENCY" }>[];
  const relationIds = new Set<string>();
  const itemIds = new Set<string>([sourceItemId]);
  let previousItemId = sourceItemId;
  for (const relation of dependencies) {
    if (relationIds.has(relation.relationProposalId) || relation.prerequisiteItemId !== previousItemId || itemIds.has(relation.dependentItemId)) {
      return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_PATH_INVALID");
    }
    relationIds.add(relation.relationProposalId);
    itemIds.add(relation.dependentItemId);
    previousItemId = relation.dependentItemId;
  }
  return dependencies;
}

function reconstruct(
  context: DecisionContextDraft,
  expectation: StructuralExpectation,
  gapBasis: StructuralGapObservationBasis,
  gap: StructuralGap,
  propagationBasis: StructuralConsequencePropagationBasis
): StructuralConsequence {
  const source = sourceGap(context, expectation, gapBasis, gap);
  const relations = pathRelations(source.context, source.sourceItemId, propagationBasis);
  const dependencyPathRelationProposalIds = relations.map((relation) => relation.relationProposalId);
  return {
    artifactKind: "STRUCTURAL_CONSEQUENCE",
    schemaVersion: STRUCTURAL_CONSEQUENCE_SCHEMA_VERSION,
    consequenceId: buildStructuralConsequenceId(source.context.contextId, source.gap.gapId, dependencyPathRelationProposalIds),
    contextId: source.context.contextId,
    sourceGapId: source.gap.gapId,
    sourceItemId: source.sourceItemId,
    affectedItemId: relations[relations.length - 1].dependentItemId,
    dependencyPathRelationProposalIds
  };
}

/** Reconstructs one caller-supplied dependency path only; it performs no graph discovery. */
export function reconstructStructuralConsequence(
  context: DecisionContextDraft,
  expectation: StructuralExpectation,
  gapBasis: StructuralGapObservationBasis,
  gap: StructuralGap,
  propagationBasis: StructuralConsequencePropagationBasis
): StructuralConsequence {
  return structuredClone(reconstruct(context, expectation, gapBasis, gap, propagationBasis));
}

/** Verifies the stored consequence is the exact derivation from the supplied gap and ordered path. */
export function assertStructuralConsequence(
  context: DecisionContextDraft,
  expectation: StructuralExpectation,
  gapBasis: StructuralGapObservationBasis,
  gap: StructuralGap,
  propagationBasis: StructuralConsequencePropagationBasis,
  consequence: StructuralConsequence
): void {
  const expected = reconstruct(context, expectation, gapBasis, gap, propagationBasis);
  try {
    const captured = exact(consequence, consequenceKeys, "ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    if (captured.artifactKind !== "STRUCTURAL_CONSEQUENCE" || captured.schemaVersion !== STRUCTURAL_CONSEQUENCE_SCHEMA_VERSION || !isString(captured.consequenceId) || !isString(captured.contextId) || !isString(captured.sourceGapId) || !isString(captured.sourceItemId) || !isString(captured.affectedItemId) || !Array.isArray(captured.dependencyPathRelationProposalIds) || captured.dependencyPathRelationProposalIds.some((id) => !isString(id))) return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    const bodyKeys = ["artifactKind", "schemaVersion", "contextId", "sourceGapId", "sourceItemId", "affectedItemId", "dependencyPathRelationProposalIds"] as const;
    if (bodyKeys.some((key) => JSON.stringify(captured[key]) !== JSON.stringify(expected[key]))) return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
    if (captured.consequenceId !== expected.consequenceId) return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_STRUCTURAL_CONSEQUENCE_ID_MISMATCH") throw error;
    return fail("ERR_DECISION_STRUCTURAL_CONSEQUENCE_INVALID");
  }
}
