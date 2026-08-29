import { createHash } from "node:crypto";
import { assertDecisionContextDraft, createDecisionContextDraft, type DecisionContextDraft, type DecisionContextItem } from "../context";
import {
  assertDecisionContextObservationItemMaterialization,
  type DecisionContextObservationItemMaterialization
} from "../context-observation-item-materialization";
import {
  DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION,
  type DecisionContextObservationContextTransition,
  type DecisionContextObservationContextTransitionInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationItemMaterialization"] as const;
const transitionKeys = ["artifactKind", "schemaVersion", "decisionContextObservationContextTransitionId", "decisionContextObservationItemMaterialization", "context"] as const;
const transitionIdPattern = /^DCOCT_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value as Captured;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const descriptor = Reflect.getOwnPropertyDescriptor(value, "length");
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

function exactOwn(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const actual = Reflect.ownKeys(value);
    if (actual.length !== keys.length || actual.some((key) => typeof key !== "string") || keys.some((key) => !actual.includes(key))) return fail(code);
    const result: Record<string, unknown> = {};
    for (const key of keys) {
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      Object.defineProperty(result, key, { value: descriptor.value, enumerable: true, writable: true, configurable: true });
    }
    return result;
  } catch { return fail(code); }
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]);
  return result;
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left as Captured)) === JSON.stringify(canonical(right as Captured));
}

function captureMaterialization(value: unknown, code: string): DecisionContextObservationItemMaterialization {
  try {
    const materialization = capture(value, code) as unknown as DecisionContextObservationItemMaterialization;
    assertDecisionContextObservationItemMaterialization(materialization);
    return materialization;
  } catch { return fail(code); }
}

function captureContext(value: unknown, code: string): DecisionContextDraft {
  try {
    const context = capture(value, code) as unknown as DecisionContextDraft;
    assertDecisionContextDraft(context);
    return context;
  } catch { return fail(code); }
}

function baseContext(materialization: DecisionContextObservationItemMaterialization): DecisionContextDraft {
  return materialization.decisionContextObservationMaterializationReadiness.decisionContextObservationTargetRevisionBinding.revision.context;
}

function itemInput(item: DecisionContextItem): { role: DecisionContextItem["role"]; statement: string; provenance: DecisionContextItem["provenance"] } {
  return { role: item.role, statement: item.statement, provenance: item.provenance };
}

function buildContext(materialization: DecisionContextObservationItemMaterialization): DecisionContextDraft {
  const base = baseContext(materialization);
  return createDecisionContextDraft({
    sourceStateReferences: base.sourceStateReferences,
    items: [...base.items.map(itemInput), itemInput(materialization.item)]
  });
}

function itemEquals(left: DecisionContextItem, right: DecisionContextItem): boolean {
  return left.itemId === right.itemId && left.role === right.role && left.statement === right.statement && same(left.provenance, right.provenance);
}

function assertDelta(materialization: DecisionContextObservationItemMaterialization, context: DecisionContextDraft, code: string): void {
  const base = baseContext(materialization);
  if (!same(context.sourceStateReferences, base.sourceStateReferences) || context.decisionQuestionId !== base.decisionQuestionId || context.contextId === base.contextId || context.items.length !== base.items.length + 1) fail(code);
  const resultItems = new Map(context.items.map((item) => [item.itemId, item]));
  const baseIds = new Set(base.items.map((item) => item.itemId));
  if (resultItems.size !== context.items.length || baseIds.has(materialization.item.itemId)) fail(code);
  for (const item of base.items) {
    const result = resultItems.get(item.itemId);
    if (result === undefined || !itemEquals(result, item)) fail(code);
  }
  const additional = resultItems.get(materialization.item.itemId);
  if (additional === undefined || !itemEquals(additional, materialization.item)) fail(code);
  for (const item of context.items) if (!baseIds.has(item.itemId) && item.itemId !== materialization.item.itemId) fail(code);
}

function transitionId(materialization: DecisionContextObservationItemMaterialization, context: DecisionContextDraft): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION,
    canonical(materialization as unknown as Captured),
    canonical(context as unknown as Captured)
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DCOCT_${digest}`;
}

function construct(materialization: DecisionContextObservationItemMaterialization, context: DecisionContextDraft): DecisionContextObservationContextTransition {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION,
    decisionContextObservationContextTransitionId: transitionId(materialization, context),
    decisionContextObservationItemMaterialization: materialization,
    context
  };
}

export function createDecisionContextObservationContextTransition(input: DecisionContextObservationContextTransitionInput): DecisionContextObservationContextTransition {
  const wrapper = exactOwn(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INPUT_INVALID");
  const materialization = captureMaterialization(wrapper.decisionContextObservationItemMaterialization, "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_MATERIALIZATION_INVALID");
  const context = buildContext(materialization);
  assertDelta(materialization, context, "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INVALID");
  const result = construct(materialization, context);
  assertDecisionContextObservationContextTransition(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationContextTransition(value: unknown): asserts value is DecisionContextObservationContextTransition {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_INVALID";
  try {
    const transition = exactOwn(value, transitionKeys, invalid);
    if (transition.artifactKind !== "DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION" || transition.schemaVersion !== DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_SCHEMA_VERSION || typeof transition.decisionContextObservationContextTransitionId !== "string" || !transitionIdPattern.test(transition.decisionContextObservationContextTransitionId)) fail(invalid);
    const materialization = captureMaterialization(transition.decisionContextObservationItemMaterialization, invalid);
    const context = captureContext(transition.context, invalid);
    assertDelta(materialization, context, invalid);
    if (transition.decisionContextObservationContextTransitionId !== transitionId(materialization, context)) fail("ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_CONTEXT_TRANSITION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
