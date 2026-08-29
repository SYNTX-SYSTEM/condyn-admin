import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationMaterializationReadiness,
  type DecisionContextObservationMaterializationReadiness
} from "../context-observation-materialization-readiness";
import type { DecisionContextItem } from "../context";
import {
  DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION,
  type DecisionContextObservationItemMaterialization,
  type DecisionContextObservationItemMaterializationInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationMaterializationReadiness"] as const;
const materializationKeys = ["artifactKind", "schemaVersion", "decisionContextObservationItemMaterializationId", "decisionContextObservationMaterializationReadiness", "item"] as const;
const itemKeys = ["itemId", "role", "statement", "provenance"] as const;
const materializationIdPattern = /^DCOIM_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value as Captured;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value); const lengthDescriptor = Reflect.getOwnPropertyDescriptor(value, "length");
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

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const object = capture(value, code);
  if (object === null || Array.isArray(object) || typeof object !== "object") return fail(code);
  const actual = Object.keys(object);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(object, key))) return fail(code);
  return object;
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]);
  return result;
}

function captureReadiness(value: unknown, code: string): DecisionContextObservationMaterializationReadiness {
  try {
    const readiness = capture(value, code) as unknown as DecisionContextObservationMaterializationReadiness;
    assertDecisionContextObservationMaterializationReadiness(readiness);
    return readiness;
  } catch { return fail(code); }
}

function expectedItem(readiness: DecisionContextObservationMaterializationReadiness): DecisionContextItem {
  const projected = readiness.decisionContextObservationTargetRevisionBinding.decisionContextObservationTargetDeclaration.decisionContextObservationItemProjection.projectedItemInput;
  return { itemId: readiness.candidateItemId, role: projected.role, statement: projected.statement, provenance: projected.provenance };
}

function captureItem(value: unknown, code: string): DecisionContextItem {
  const item = exact(value, itemKeys, code) as unknown as DecisionContextItem;
  if (typeof item.itemId !== "string" || item.role !== "OBSERVATION" || typeof item.statement !== "string" || item.provenance === null || typeof item.provenance !== "object") return fail(code);
  return item;
}

function same(left: unknown, right: unknown): boolean {
  return JSON.stringify(canonical(left as Captured)) === JSON.stringify(canonical(right as Captured));
}

function matches(item: DecisionContextItem, expected: DecisionContextItem): boolean {
  return item.itemId === expected.itemId && item.role === expected.role && item.statement === expected.statement && same(item.provenance, expected.provenance);
}

function materializationId(readiness: DecisionContextObservationMaterializationReadiness, item: DecisionContextItem): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION,
    canonical(readiness as unknown as Captured),
    canonical(item as unknown as Captured)
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DCOIM_${digest}`;
}

function construct(readiness: DecisionContextObservationMaterializationReadiness, item: DecisionContextItem): DecisionContextObservationItemMaterialization {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION,
    decisionContextObservationItemMaterializationId: materializationId(readiness, item),
    decisionContextObservationMaterializationReadiness: readiness,
    item
  };
}

export function createDecisionContextObservationItemMaterialization(input: DecisionContextObservationItemMaterializationInput): DecisionContextObservationItemMaterialization {
  const wrapper = exactOwn(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INPUT_INVALID");
  const readiness = captureReadiness(wrapper.decisionContextObservationMaterializationReadiness, "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_READINESS_INVALID");
  const result = construct(readiness, expectedItem(readiness));
  assertDecisionContextObservationItemMaterialization(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationItemMaterialization(value: unknown): asserts value is DecisionContextObservationItemMaterialization {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_INVALID";
  try {
    const materialization = exactOwn(value, materializationKeys, invalid);
    if (materialization.artifactKind !== "DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION" || materialization.schemaVersion !== DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_SCHEMA_VERSION || typeof materialization.decisionContextObservationItemMaterializationId !== "string" || !materializationIdPattern.test(materialization.decisionContextObservationItemMaterializationId)) fail(invalid);
    const readiness = captureReadiness(materialization.decisionContextObservationMaterializationReadiness, invalid);
    const item = captureItem(materialization.item, invalid); const expected = expectedItem(readiness);
    if (!matches(item, expected)) fail(invalid);
    if (materialization.decisionContextObservationItemMaterializationId !== materializationId(readiness, item)) fail("ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_ITEM_MATERIALIZATION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
