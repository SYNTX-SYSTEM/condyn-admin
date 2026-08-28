import { createHash } from "node:crypto";
import {
  assertDecisionContextObservationItemProjection,
  type DecisionContextObservationItemProjection
} from "../context-observation-item-projection";
import {
  DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION,
  type DecisionContextObservationTargetDeclaration,
  type DecisionContextObservationTargetDeclarationActor,
  type DecisionContextObservationTargetDeclarationInput
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const inputKeys = ["decisionContextObservationItemProjection", "targetRevisionId", "declaredBy", "rationale"] as const;
const declarationKeys = ["artifactKind", "schemaVersion", "decisionContextObservationTargetDeclarationId", "decisionContextObservationItemProjection", "targetRevisionId", "declaredBy", "rationale"] as const;
const actorKeys = ["origin", "actorId"] as const;
const targetRevisionIdPattern = /^DREV_[0-9A-F]{24}$/;
const declarationIdPattern = /^DCOTD_[0-9A-F]{24}$/;

function dataObject(value: unknown, code: string): Record<string, unknown> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const result: Record<string, unknown> = {};
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string") return fail(code);
      const descriptor = Reflect.getOwnPropertyDescriptor(value, key);
      if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor)) return fail(code);
      Object.defineProperty(result, key, { value: descriptor.value, enumerable: true, writable: true, configurable: true });
    }
    return result;
  } catch { return fail(code); }
}

function exact(value: unknown, keys: readonly string[], code: string): Record<string, unknown> {
  const object = dataObject(value, code);
  const actual = Object.keys(object);
  if (actual.length !== keys.length || keys.some((key) => !Object.prototype.hasOwnProperty.call(object, key))) return fail(code);
  return object;
}

function projection(value: unknown, code: string): DecisionContextObservationItemProjection {
  try {
    assertDecisionContextObservationItemProjection(value);
    return structuredClone(value);
  } catch { return fail(code); }
}

function targetRevisionId(value: unknown, code: string): string {
  if (typeof value !== "string" || !targetRevisionIdPattern.test(value)) return fail(code);
  return value;
}

function actor(value: unknown, code: string, canonicalize: boolean): DecisionContextObservationTargetDeclarationActor {
  const captured = exact(value, actorKeys, code);
  if (captured.origin !== "HUMAN_INPUT" || typeof captured.actorId !== "string") return fail(code);
  const actorId = canonicalize ? captured.actorId.trim() : captured.actorId;
  if (actorId.length === 0 || (!canonicalize && actorId !== actorId.trim())) return fail(code);
  return { origin: "HUMAN_INPUT", actorId };
}

function rationale(value: unknown, code: string, canonicalize: boolean): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return fail(code);
  const result = canonicalize ? value.trim() : value;
  if (result.length === 0 || (!canonicalize && result !== result.trim())) return fail(code);
  return result;
}

function declarationId(
  decisionContextObservationItemProjection: DecisionContextObservationItemProjection,
  targetRevisionId: string,
  declaredBy: DecisionContextObservationTargetDeclarationActor,
  rationale: string | null
): string {
  const digest = createHash("sha256")
    .update(JSON.stringify([
      DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION,
      decisionContextObservationItemProjection.decisionContextObservationItemProjectionId,
      targetRevisionId,
      ["HUMAN_INPUT", declaredBy.actorId],
      rationale
    ]), "utf8")
    .digest("hex")
    .slice(0, 24)
    .toUpperCase();
  return `DCOTD_${digest}`;
}

function construct(
  decisionContextObservationItemProjection: DecisionContextObservationItemProjection,
  targetRevisionId: string,
  declaredBy: DecisionContextObservationTargetDeclarationActor,
  rationale: string | null
): DecisionContextObservationTargetDeclaration {
  return {
    artifactKind: "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION",
    schemaVersion: DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION,
    decisionContextObservationTargetDeclarationId: declarationId(decisionContextObservationItemProjection, targetRevisionId, declaredBy, rationale),
    decisionContextObservationItemProjection,
    targetRevisionId,
    declaredBy,
    rationale
  };
}

export function createDecisionContextObservationTargetDeclaration(input: DecisionContextObservationTargetDeclarationInput): DecisionContextObservationTargetDeclaration {
  const captured = exact(input, inputKeys, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INPUT_INVALID");
  const capturedProjection = projection(captured.decisionContextObservationItemProjection, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_PROJECTION_INVALID");
  const capturedTargetRevisionId = targetRevisionId(captured.targetRevisionId, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_REVISION_ID_INVALID");
  const capturedActor = actor(captured.declaredBy, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ACTOR_INVALID", true);
  const capturedRationale = rationale(captured.rationale, "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_RATIONALE_INVALID", true);
  const result = construct(capturedProjection, capturedTargetRevisionId, capturedActor, capturedRationale);
  assertDecisionContextObservationTargetDeclaration(result);
  return structuredClone(result);
}

export function assertDecisionContextObservationTargetDeclaration(value: unknown): asserts value is DecisionContextObservationTargetDeclaration {
  const invalid = "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_INVALID";
  try {
    const declaration = exact(value, declarationKeys, invalid);
    if (declaration.artifactKind !== "DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION" || declaration.schemaVersion !== DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_SCHEMA_VERSION || typeof declaration.decisionContextObservationTargetDeclarationId !== "string" || !declarationIdPattern.test(declaration.decisionContextObservationTargetDeclarationId)) fail(invalid);
    const capturedProjection = projection(declaration.decisionContextObservationItemProjection, invalid);
    const capturedTargetRevisionId = targetRevisionId(declaration.targetRevisionId, invalid);
    const capturedActor = actor(declaration.declaredBy, invalid, false);
    const capturedRationale = rationale(declaration.rationale, invalid, false);
    if (declaration.decisionContextObservationTargetDeclarationId !== declarationId(capturedProjection, capturedTargetRevisionId, capturedActor, capturedRationale)) fail("ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_CONTEXT_OBSERVATION_TARGET_DECLARATION_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
