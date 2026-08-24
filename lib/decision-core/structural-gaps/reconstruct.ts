import type { AuthoritativeStateReference } from "../authority";
import { assertDecisionContextDraft, type DecisionContextDraft, type DecisionContextItem, type DecisionContextItemRole } from "../context";
import { EVIDENCE_BINDING_DISPOSITIONS, type EvidenceBindingDisposition, type SemanticEvidenceBindingProposal } from "../evidence-binding";
import { buildSemanticEvidenceBindingId, evidenceBindingTargetKey } from "../evidence-binding/identity";
import { assertStructuralExpectation, assertStructuralRelationProposal, type StructuralExpectation, type StructuralRelationProposal } from "../structural-findings";
import { buildStructuralGapId, compareStructuralGapStrings } from "./identity";
import { STRUCTURAL_GAP_SCHEMA_VERSION, type StructuralGap, type StructuralGapKind, type StructuralGapObservationBasis } from "./types";

const fail = (code: string): never => { throw new Error(code); };
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const bindingKeys = ["bindingId", "contextId", "itemId", "stateReference", "disposition", "rationale"] as const;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

const isString = (value: unknown): value is string => typeof value === "string" && value.trim().length > 0;
const isDisposition = (value: unknown): value is EvidenceBindingDisposition => EVIDENCE_BINDING_DISPOSITIONS.some((candidate) => candidate === value);
const isKind = (value: unknown): value is StructuralGapKind => value === "EVIDENCE_BINDING" || value === "CONTEXT_ROLE" || value === "DEPENDENCY";

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

function exact(value: unknown, keys: readonly string[], code: string): { [key: string]: Captured } {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function captureReference(value: unknown, code: string): AuthoritativeStateReference {
  const captured = exact(value, referenceKeys, code);
  const { producerId, authorityContractId, artifactId, locator } = captured;
  if (!isString(producerId) || !isString(authorityContractId) || !isString(artifactId) || !isString(locator)) return fail(code);
  return { producerId, authorityContractId, artifactId, locator };
}

const referenceKey = (reference: AuthoritativeStateReference): string => JSON.stringify([reference.producerId, reference.authorityContractId, reference.artifactId, reference.locator]);

interface CapturedContext { draft: DecisionContextDraft; contextId: string; items: DecisionContextItem[]; itemIds: Set<string>; referenceKeys: Set<string>; }

function captureContext(context: DecisionContextDraft): CapturedContext {
  try {
    const captured = exact(context, contextKeys, "ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID");
    Reflect.apply(assertDecisionContextDraft, undefined, [captured]);
    if (!isString(captured.contextId) || !Array.isArray(captured.items) || !Array.isArray(captured.sourceStateReferences)) return fail("ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID");
    const items = captured.items as unknown as DecisionContextItem[];
    return { draft: captured as unknown as DecisionContextDraft, contextId: captured.contextId, items, itemIds: new Set(items.map((item) => item.itemId)), referenceKeys: new Set(captured.sourceStateReferences.map((value) => referenceKey(captureReference(value, "ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID")))) };
  } catch { return fail("ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID"); }
}

function assertExpectation(context: DecisionContextDraft, expectation: StructuralExpectation): StructuralExpectation {
  try { Reflect.apply(assertStructuralExpectation, undefined, [context, expectation]); return structuredClone(expectation); }
  catch { return fail("ERR_DECISION_STRUCTURAL_GAP_EXPECTATION_INVALID"); }
}

function captureBinding(context: CapturedContext, value: unknown): SemanticEvidenceBindingProposal {
  try {
    const captured = exact(value, bindingKeys, "ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    if (!isString(captured.bindingId) || captured.contextId !== context.contextId || !isString(captured.itemId) || !context.itemIds.has(captured.itemId) || !isDisposition(captured.disposition) || !isString(captured.rationale) || captured.rationale !== captured.rationale.trim()) return fail("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    const stateReference = captureReference(captured.stateReference, "ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    if (!context.referenceKeys.has(referenceKey(stateReference))) return fail("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    const expectedId = buildSemanticEvidenceBindingId(context.contextId, captured.itemId, stateReference, captured.disposition);
    if (captured.bindingId !== expectedId) return fail("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID");
    return { bindingId: captured.bindingId, contextId: context.contextId, itemId: captured.itemId, stateReference, disposition: captured.disposition, rationale: captured.rationale };
  } catch { return fail("ERR_DECISION_STRUCTURAL_GAP_BINDING_INVALID"); }
}

function captureWrapper(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  try {
    if (typeof value !== "object" || value === null || Array.isArray(value)) return fail(code);
    const ownKeys = Reflect.ownKeys(value);
    if (ownKeys.some((key) => typeof key !== "string") || ownKeys.length !== keys.length || keys.some((key) => !ownKeys.includes(key))) return fail(code);
    const captured: Record<string, unknown> = {};
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      captured[key] = descriptor.value;
    }
    return captured;
  } catch { return fail(code); }
}

function captureArrayContainer(value: unknown, code: string): unknown[] {
  try {
    if (!Array.isArray(value)) return fail(code);
    const ownKeys = Reflect.ownKeys(value);
    const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
    const length = lengthDescriptor !== undefined && "value" in lengthDescriptor ? lengthDescriptor.value : undefined;
    if (typeof length !== "number" || !Number.isSafeInteger(length) || length < 0 || ownKeys.length !== length + 1 || !ownKeys.includes("length") || ownKeys.some((key) => typeof key === "symbol" || (key !== "length" && (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length)))) return fail(code);
    const result: unknown[] = [];
    for (let index = 0; index < length; index += 1) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, String(index));
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      result.push(descriptor.value);
    }
    return result;
  } catch { return fail(code); }
}

function captureBasis(value: unknown, kind: StructuralGapKind): { bindings?: unknown[]; relationProposals?: unknown[] } {
  const code = "ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID";
  const keys = kind === "EVIDENCE_BINDING" ? ["kind", "bindings"] : kind === "CONTEXT_ROLE" ? ["kind"] : ["kind", "relationProposals"];
  const wrapper = captureWrapper(value, keys, code);
  if (wrapper.kind !== kind) return fail(code);
  if (kind === "EVIDENCE_BINDING") return { bindings: captureArrayContainer(wrapper.bindings, code) };
  if (kind === "DEPENDENCY") return { relationProposals: captureArrayContainer(wrapper.relationProposals, code) };
  return {};
}

const canonicalIds = (values: string[], code: string): string[] => {
  if (values.some((value) => !isString(value))) return fail(code);
  const sorted = [...values].sort(compareStructuralGapStrings);
  if (new Set(sorted).size !== sorted.length) return fail(code);
  return sorted;
};

function buildGap(contextId: string, expectationId: string, kind: StructuralGapKind, body: unknown, fields: Record<string, unknown>): StructuralGap {
  const gapId = buildStructuralGapId(contextId, expectationId, kind, body);
  return { artifactKind: "STRUCTURAL_GAP", schemaVersion: STRUCTURAL_GAP_SCHEMA_VERSION, gapId, contextId, expectationId, kind, ...fields } as StructuralGap;
}

/** Reconstructs one deterministic, basis-relative unsatisfied expectation; it does not claim real-world absence. */
export function reconstructStructuralGap(context: DecisionContextDraft, expectation: StructuralExpectation, basis: StructuralGapObservationBasis): StructuralGap | null {
  const capturedContext = captureContext(context);
  const capturedExpectation = assertExpectation(capturedContext.draft, expectation);
  const capturedBasis = captureBasis(basis, capturedExpectation.kind);
  if (capturedExpectation.kind === "EVIDENCE_BINDING") {
    const bindings = (capturedBasis.bindings ?? []).map((value) => captureBinding(capturedContext, value));
    const ids = new Set<string>();
    const targets = new Set<string>();
    for (const binding of bindings) {
      const target = evidenceBindingTargetKey(binding.itemId, binding.stateReference);
      if (ids.has(binding.bindingId) || targets.has(target)) fail("ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
      ids.add(binding.bindingId);
      targets.add(target);
    }
    const relevant = bindings.filter((binding) => binding.itemId === capturedExpectation.subjectItemId);
    if (relevant.some((binding) => capturedExpectation.acceptedDispositions.includes(binding.disposition))) return null;
    const observedBindingIds = canonicalIds(relevant.map((binding) => binding.bindingId), "ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
    return structuredClone(buildGap(capturedContext.contextId, capturedExpectation.expectationId, "EVIDENCE_BINDING", [capturedExpectation.subjectItemId, capturedExpectation.acceptedDispositions, observedBindingIds], { subjectItemId: capturedExpectation.subjectItemId, acceptedDispositions: [...capturedExpectation.acceptedDispositions], observedBindingIds }));
  }
  if (capturedExpectation.kind === "CONTEXT_ROLE") {
    const observedItemIds = canonicalIds(capturedContext.items.filter((item) => item.role === capturedExpectation.role).map((item) => item.itemId), "ERR_DECISION_STRUCTURAL_GAP_CONTEXT_INVALID");
    if (observedItemIds.length >= capturedExpectation.minimumCount) return null;
    return structuredClone(buildGap(capturedContext.contextId, capturedExpectation.expectationId, "CONTEXT_ROLE", [capturedExpectation.role, capturedExpectation.minimumCount, observedItemIds], { role: capturedExpectation.role, minimumCount: capturedExpectation.minimumCount, observedCount: observedItemIds.length, observedItemIds }));
  }
  const proposals = (capturedBasis.relationProposals ?? []).map((value) => {
    try { Reflect.apply(assertStructuralRelationProposal, undefined, [capturedContext.draft, value]); return structuredClone(value) as StructuralRelationProposal; }
    catch { return fail("ERR_DECISION_STRUCTURAL_GAP_RELATION_INVALID"); }
  });
  const allIds = new Set<string>();
  for (const proposal of proposals) { if (allIds.has(proposal.relationProposalId)) fail("ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID"); allIds.add(proposal.relationProposalId); }
  const dependencyProposals = proposals.filter((proposal): proposal is Extract<StructuralRelationProposal, { kind: "DEPENDENCY" }> => proposal.kind === "DEPENDENCY");
  const relevant = dependencyProposals.filter((proposal) => (proposal.dependentItemId === capturedExpectation.dependentItemId && proposal.prerequisiteItemId === capturedExpectation.prerequisiteItemId) || (proposal.dependentItemId === capturedExpectation.prerequisiteItemId && proposal.prerequisiteItemId === capturedExpectation.dependentItemId));
  if (relevant.some((proposal) => proposal.dependentItemId === capturedExpectation.dependentItemId && proposal.prerequisiteItemId === capturedExpectation.prerequisiteItemId)) return null;
  const observedRelationProposalIds = canonicalIds(relevant.map((proposal) => proposal.relationProposalId), "ERR_DECISION_STRUCTURAL_GAP_BASIS_INVALID");
  return structuredClone(buildGap(capturedContext.contextId, capturedExpectation.expectationId, "DEPENDENCY", [capturedExpectation.dependentItemId, capturedExpectation.prerequisiteItemId, observedRelationProposalIds], { dependentItemId: capturedExpectation.dependentItemId, prerequisiteItemId: capturedExpectation.prerequisiteItemId, observedRelationProposalIds }));
}

/** Verifies the stored gap is the canonical unsatisfied result of this exact represented basis. */
export function assertStructuralGap(context: DecisionContextDraft, expectation: StructuralExpectation, basis: StructuralGapObservationBasis, gap: StructuralGap): void {
  const capturedContext = captureContext(context);
  const capturedExpectation = assertExpectation(capturedContext.draft, expectation);
  const expectedGap = reconstructStructuralGap(capturedContext.draft, capturedExpectation, basis);
  if (expectedGap === null) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
  try {
    const captured = capture(gap, "ERR_DECISION_STRUCTURAL_GAP_INVALID");
    if (captured === null || Array.isArray(captured) || typeof captured !== "object" || captured.artifactKind !== "STRUCTURAL_GAP" || captured.schemaVersion !== STRUCTURAL_GAP_SCHEMA_VERSION || captured.contextId !== capturedContext.contextId || captured.expectationId !== capturedExpectation.expectationId || !isString(captured.gapId) || !isKind(captured.kind) || captured.kind !== capturedExpectation.kind) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
    const keys = captured.kind === "EVIDENCE_BINDING" ? ["artifactKind", "schemaVersion", "gapId", "contextId", "expectationId", "kind", "subjectItemId", "acceptedDispositions", "observedBindingIds"] : captured.kind === "CONTEXT_ROLE" ? ["artifactKind", "schemaVersion", "gapId", "contextId", "expectationId", "kind", "role", "minimumCount", "observedCount", "observedItemIds"] : ["artifactKind", "schemaVersion", "gapId", "contextId", "expectationId", "kind", "dependentItemId", "prerequisiteItemId", "observedRelationProposalIds"];
    const actual = Object.keys(captured);
    if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
    let body: unknown;
    if (captured.kind === "EVIDENCE_BINDING" && capturedExpectation.kind === "EVIDENCE_BINDING") {
      if (captured.subjectItemId !== capturedExpectation.subjectItemId || JSON.stringify(captured.acceptedDispositions) !== JSON.stringify(capturedExpectation.acceptedDispositions) || !Array.isArray(captured.observedBindingIds)) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      const ids = canonicalIds(captured.observedBindingIds as string[], "ERR_DECISION_STRUCTURAL_GAP_INVALID");
      if (JSON.stringify(ids) !== JSON.stringify(captured.observedBindingIds)) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      body = [captured.subjectItemId, captured.acceptedDispositions, ids];
    } else if (captured.kind === "CONTEXT_ROLE" && capturedExpectation.kind === "CONTEXT_ROLE") {
      if (captured.role !== capturedExpectation.role || captured.minimumCount !== capturedExpectation.minimumCount || !Array.isArray(captured.observedItemIds) || captured.observedCount !== captured.observedItemIds.length) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      const ids = canonicalIds(captured.observedItemIds as string[], "ERR_DECISION_STRUCTURAL_GAP_INVALID");
      if (JSON.stringify(ids) !== JSON.stringify(captured.observedItemIds)) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      const expectedObserved = canonicalIds(capturedContext.items.filter((item) => item.role === capturedExpectation.role).map((item) => item.itemId), "ERR_DECISION_STRUCTURAL_GAP_INVALID");
      if (JSON.stringify(ids) !== JSON.stringify(expectedObserved)) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      body = [captured.role, captured.minimumCount, ids];
    } else if (captured.kind === "DEPENDENCY" && capturedExpectation.kind === "DEPENDENCY") {
      if (captured.dependentItemId !== capturedExpectation.dependentItemId || captured.prerequisiteItemId !== capturedExpectation.prerequisiteItemId || !Array.isArray(captured.observedRelationProposalIds)) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      const ids = canonicalIds(captured.observedRelationProposalIds as string[], "ERR_DECISION_STRUCTURAL_GAP_INVALID");
      if (JSON.stringify(ids) !== JSON.stringify(captured.observedRelationProposalIds)) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
      body = [captured.dependentItemId, captured.prerequisiteItemId, ids];
    } else return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
    if (keys.some((key) => key !== "gapId" && JSON.stringify(captured[key]) !== JSON.stringify((expectedGap as unknown as Record<string, unknown>)[key]))) return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
    if (captured.gapId !== buildStructuralGapId(capturedContext.contextId, capturedExpectation.expectationId, captured.kind, body)) fail("ERR_DECISION_STRUCTURAL_GAP_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_STRUCTURAL_GAP_ID_MISMATCH") throw error;
    return fail("ERR_DECISION_STRUCTURAL_GAP_INVALID");
  }
}
