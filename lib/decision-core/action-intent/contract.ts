import { createHash } from "node:crypto";
import { assertHumanDecisionDeclaration, type HumanDecisionDeclaration } from "../human-decision";
import {
  DECISION_ACTION_INTENT_SCHEMA_VERSION,
  type ActionIntentActor,
  type DecisionActionIntent,
  type DecisionActionIntentInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["declaredBy", "operationalizedOptionItemIds", "operationDescription", "rationale"] as const;
const intentKeys = ["artifactKind", "schemaVersion", "actionIntentId", "humanDecisionDeclaration", "declaredBy", "operationalizedOptionItemIds", "operationDescription", "rationale"] as const;
const actorKeys = ["origin", "actorId"] as const;
const idPattern = /^DAINT_[0-9A-F]{24}$/;
const itemPattern = /^DCI_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const length = Reflect.getOwnPropertyDescriptor(value, "length")?.value;
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

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort(compare)) result[key] = canonical(value[key]);
  return result;
}

function captureDecision(value: unknown, code: string): HumanDecisionDeclaration {
  try {
    const declaration = capture(value, code) as unknown as HumanDecisionDeclaration;
    assertHumanDecisionDeclaration(declaration);
    return declaration;
  } catch { return fail(code); }
}

function actor(value: unknown, trim: boolean, code: string): ActionIntentActor {
  const captured = exact(value, actorKeys, code);
  if (captured.origin !== "HUMAN_INPUT" || typeof captured.actorId !== "string") return fail(code);
  const actorId = trim ? captured.actorId.trim() : captured.actorId;
  if (actorId.length === 0 || (!trim && actorId !== captured.actorId.trim())) return fail(code);
  return { origin: "HUMAN_INPUT", actorId };
}

function optionIds(value: unknown, code: { input: string; id: string }): string[] {
  const captured = capture(value, code.input);
  if (!Array.isArray(captured) || captured.length === 0 || captured.some((item) => typeof item !== "string")) return fail(code.input);
  for (const item of captured) if (!itemPattern.test(item as string)) fail(code.id);
  return captured as string[];
}

function text(value: unknown, trim: boolean, code: string, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== "string") return fail(code);
  const result = trim ? value.trim() : value;
  if (result.length === 0 || (!trim && result !== value.trim())) return fail(code);
  return result;
}

function validateOptions(declaration: HumanDecisionDeclaration, values: readonly string[], code: { id: string; unchosen: string; duplicate: string }): void {
  const available = new Set(declaration.chosenOptionItemIds);
  const seen = new Set<string>();
  for (const value of values) {
    if (!itemPattern.test(value)) fail(code.id);
    if (!available.has(value)) fail(code.unchosen);
    if (seen.has(value)) fail(code.duplicate);
    seen.add(value);
  }
}

function intentId(declaration: HumanDecisionDeclaration, declaredBy: ActionIntentActor, optionIds: readonly string[], operationDescription: string, rationale: string | null): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_ACTION_INTENT_SCHEMA_VERSION,
      canonical(declaration as unknown as Captured),
      ["HUMAN_INPUT", declaredBy.actorId],
      optionIds,
      operationDescription,
      rationale
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DAINT_${digest}`;
}

function construct(declaration: HumanDecisionDeclaration, declaredBy: ActionIntentActor, optionIds: readonly string[], operationDescription: string, rationale: string | null): DecisionActionIntent {
  const ordered = [...optionIds].sort(compare);
  return {
    artifactKind: "DECISION_ACTION_INTENT",
    schemaVersion: DECISION_ACTION_INTENT_SCHEMA_VERSION,
    actionIntentId: intentId(declaration, declaredBy, ordered, operationDescription, rationale),
    humanDecisionDeclaration: declaration,
    declaredBy,
    operationalizedOptionItemIds: ordered,
    operationDescription,
    rationale
  };
}

export function createDecisionActionIntent(humanDecisionDeclaration: HumanDecisionDeclaration, input: DecisionActionIntentInput): DecisionActionIntent {
  const declaration = captureDecision(humanDecisionDeclaration, "ERR_DECISION_ACTION_INTENT_HUMAN_DECISION_INVALID");
  const captured = exact(input, inputKeys, "ERR_DECISION_ACTION_INTENT_INPUT_INVALID");
  const declaredBy = actor(captured.declaredBy, true, "ERR_DECISION_ACTION_INTENT_ACTOR_INVALID");
  const optionValues = optionIds(captured.operationalizedOptionItemIds, { input: "ERR_DECISION_ACTION_INTENT_INPUT_INVALID", id: "ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID" });
  const operationDescription = text(captured.operationDescription, true, "ERR_DECISION_ACTION_INTENT_OPERATION_INVALID") as string;
  const rationale = text(captured.rationale, true, "ERR_DECISION_ACTION_INTENT_RATIONALE_INVALID", true);
  validateOptions(declaration, optionValues, { id: "ERR_DECISION_ACTION_INTENT_OPTION_ID_INVALID", unchosen: "ERR_DECISION_ACTION_INTENT_OPTION_NOT_CHOSEN", duplicate: "ERR_DECISION_ACTION_INTENT_DUPLICATE_OPTION" });
  const intent = construct(declaration, declaredBy, optionValues, operationDescription, rationale);
  assertDecisionActionIntent(intent);
  return structuredClone(intent);
}

export function assertDecisionActionIntent(value: unknown): asserts value is DecisionActionIntent {
  const invalid = "ERR_DECISION_ACTION_INTENT_INVALID";
  try {
    const intent = exact(value, intentKeys, invalid);
    if (intent.artifactKind !== "DECISION_ACTION_INTENT" || intent.schemaVersion !== DECISION_ACTION_INTENT_SCHEMA_VERSION || typeof intent.actionIntentId !== "string" || !idPattern.test(intent.actionIntentId)) fail(invalid);
    const declaration = captureDecision(intent.humanDecisionDeclaration, invalid);
    const declaredBy = actor(intent.declaredBy, false, invalid);
    const optionValues = optionIds(intent.operationalizedOptionItemIds, { input: invalid, id: invalid });
    const operationDescription = text(intent.operationDescription, false, invalid) as string;
    const rationale = text(intent.rationale, false, invalid, true);
    validateOptions(declaration, optionValues, { id: invalid, unchosen: invalid, duplicate: invalid });
    const ordered = [...optionValues].sort(compare);
    if (JSON.stringify(optionValues) !== JSON.stringify(ordered)) fail(invalid);
    if (intent.actionIntentId !== intentId(declaration, declaredBy, optionValues, operationDescription, rationale)) fail("ERR_DECISION_ACTION_INTENT_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_ACTION_INTENT_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
