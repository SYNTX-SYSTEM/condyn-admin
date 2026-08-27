import { createHash } from "node:crypto";
import { assertDecisionActionIntent, type DecisionActionIntent } from "../action-intent";
import {
  HUMAN_COMMITMENT_SCHEMA_VERSION,
  type HumanCommitment,
  type HumanCommitmentActor,
  type HumanCommitmentInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["committedBy", "rationale"] as const;
const commitmentKeys = ["artifactKind", "schemaVersion", "humanCommitmentId", "actionIntent", "committedBy", "rationale"] as const;
const actorKeys = ["origin", "actorId"] as const;
const idPattern = /^DHCOM_[0-9A-F]{24}$/;
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

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort(compare)) result[key] = canonical(value[key]);
  return result;
}

function compare(left: string, right: string): number { return left < right ? -1 : left > right ? 1 : 0; }

function captureActionIntent(value: unknown, code: string): DecisionActionIntent {
  try {
    const actionIntent = capture(value, code) as unknown as DecisionActionIntent;
    assertDecisionActionIntent(actionIntent);
    return actionIntent;
  } catch { return fail(code); }
}

function actor(value: unknown, trim: boolean, code: string): HumanCommitmentActor {
  const captured = exact(value, actorKeys, code);
  if (captured.origin !== "HUMAN_INPUT" || typeof captured.actorId !== "string") return fail(code);
  const actorId = trim ? captured.actorId.trim() : captured.actorId;
  if (actorId.length === 0 || (!trim && actorId !== captured.actorId.trim())) return fail(code);
  return { origin: "HUMAN_INPUT", actorId };
}

function rationale(value: unknown, trim: boolean, code: string): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return fail(code);
  const result = trim ? value.trim() : value;
  if (result.length === 0 || (!trim && result !== value.trim())) return fail(code);
  return result;
}

function commitmentId(actionIntent: DecisionActionIntent, committedBy: HumanCommitmentActor, commitmentRationale: string | null): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      HUMAN_COMMITMENT_SCHEMA_VERSION,
      canonical(actionIntent as unknown as Captured),
      ["HUMAN_INPUT", committedBy.actorId],
      commitmentRationale
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DHCOM_${digest}`;
}

function construct(actionIntent: DecisionActionIntent, committedBy: HumanCommitmentActor, commitmentRationale: string | null): HumanCommitment {
  return {
    artifactKind: "HUMAN_COMMITMENT",
    schemaVersion: HUMAN_COMMITMENT_SCHEMA_VERSION,
    humanCommitmentId: commitmentId(actionIntent, committedBy, commitmentRationale),
    actionIntent,
    committedBy,
    rationale: commitmentRationale
  };
}

export function createHumanCommitment(actionIntent: DecisionActionIntent, input: HumanCommitmentInput): HumanCommitment {
  const capturedActionIntent = captureActionIntent(actionIntent, "ERR_DECISION_HUMAN_COMMITMENT_ACTION_INTENT_INVALID");
  const capturedInput = exact(input, inputKeys, "ERR_DECISION_HUMAN_COMMITMENT_INPUT_INVALID");
  const committedBy = actor(capturedInput.committedBy, true, "ERR_DECISION_HUMAN_COMMITMENT_ACTOR_INVALID");
  const commitmentRationale = rationale(capturedInput.rationale, true, "ERR_DECISION_HUMAN_COMMITMENT_RATIONALE_INVALID");
  const commitment = construct(capturedActionIntent, committedBy, commitmentRationale);
  assertHumanCommitment(commitment);
  return structuredClone(commitment);
}

export function assertHumanCommitment(value: unknown): asserts value is HumanCommitment {
  const invalid = "ERR_DECISION_HUMAN_COMMITMENT_INVALID";
  try {
    const commitment = exact(value, commitmentKeys, invalid);
    if (commitment.artifactKind !== "HUMAN_COMMITMENT" || commitment.schemaVersion !== HUMAN_COMMITMENT_SCHEMA_VERSION || typeof commitment.humanCommitmentId !== "string" || !idPattern.test(commitment.humanCommitmentId)) fail(invalid);
    const actionIntent = captureActionIntent(commitment.actionIntent, invalid);
    const committedBy = actor(commitment.committedBy, false, invalid);
    const commitmentRationale = rationale(commitment.rationale, false, invalid);
    if (commitment.humanCommitmentId !== commitmentId(actionIntent, committedBy, commitmentRationale)) fail("ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_HUMAN_COMMITMENT_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
