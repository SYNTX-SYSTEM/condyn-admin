import { createHash } from "node:crypto";
import {
  assertCareerOutcomeValenceFeedbackReturnRepresentation,
  deriveCareerOutcomeValenceFeedbackReturnRepresentationId,
  type CareerOutcomeValenceFeedbackReturnRepresentation,
} from "../outcome-valence-feedback-return-representation";
import {
  CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION,
  type CareerOutcomeValenceFeedbackReturnItem,
  type CareerOutcomeValenceFeedbackReturnItemInput,
  type CareerOutcomeValenceFeedbackReturnItemSemanticBody,
} from "./types";

const representationInvalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_REPRESENTATION_INVALID";
const invalid = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_INVALID";
const idMismatch = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_ID_MISMATCH";
const artifactKeys = [
  "careerOutcomeValenceFeedbackReturnItemId",
  "careerOutcomeValenceFeedbackReturnRepresentation",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = [
  "careerOutcomeValenceFeedbackReturnRepresentation",
  "schemaVersion",
] as const;
const inputKeys = ["createdAt"] as const;
const representationArtifactKeys = [
  "careerOutcomeValenceFeedbackReturnRepresentationId",
  "careerOutcomeValenceFeedbackTargetRevisionBinding",
  "representedFeedback",
  "schemaVersion",
  "createdAt",
] as const;
const representationPartialKeys = [
  "careerOutcomeValenceFeedbackReturnRepresentationId",
  "careerOutcomeValenceFeedbackTargetRevisionBinding",
  "representedFeedback",
  "schemaVersion",
] as const;
const itemIdPattern = /^COVFRI_[0-9A-F]{32}$/;
const auditPlaceholder = "1970-01-01T00:00:00.000Z";

type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

const fail = (code: string): never => { throw new Error(code); };

function capture(value: unknown, code: string, ancestors = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (typeof value !== "object" || ancestors.has(value)) return fail(code);
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        const keys = Reflect.ownKeys(value);
        const length = Reflect.getOwnPropertyDescriptor(value, "length");
        if (
          length === undefined || !("value" in length) || typeof length.value !== "number" ||
          !Number.isSafeInteger(length.value) || length.value < 0 || keys.length !== length.value + 1 ||
          !keys.includes("length") || keys.some(key => typeof key === "symbol" || (key !== "length" &&
            (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= length.value)))
        ) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < length.value; index += 1) {
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
        Object.defineProperty(result, key, {
          value: capture(descriptor.value, code, ancestors), enumerable: true, writable: true, configurable: true,
        });
      }
      return result;
    } finally {
      ancestors.delete(value);
    }
  } catch {
    return fail(code);
  }
}

function exact(value: unknown, keys: readonly string[], code: string): Record<string, Captured> {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const actual = Object.keys(captured);
  if (actual.length !== keys.length || !keys.every(key => Object.prototype.hasOwnProperty.call(captured, key))) return fail(code);
  return captured;
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value !== null && typeof value === "object") {
    const result: { [key: string]: Captured } = {};
    for (const key of Object.keys(value).sort()) result[key] = canonical(value[key]);
    return result;
  }
  return value;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) return false;
  const milliseconds = Date.parse(value);
  return Number.isFinite(milliseconds) && new Date(milliseconds).toISOString() === value;
}

function removeAuditTimes(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(removeAuditTimes);
  if (value !== null && typeof value === "object") {
    const result: { [key: string]: Captured } = {};
    for (const key of Object.keys(value)) {
      if (key !== "createdAt") result[key] = removeAuditTimes(value[key]);
    }
    return result;
  }
  return value;
}

function canonicalRepresentationSemanticBody(value: Captured, code: string): Captured {
  const result = removeAuditTimes(value);
  if (result === null || Array.isArray(result) || typeof result !== "object") return fail(code);
  const {
    careerOutcomeValenceFeedbackReturnRepresentationId: _representationId,
    careerOutcomeValenceFeedbackTargetRevisionBinding,
    ...representationBody
  } = result;
  if (
    careerOutcomeValenceFeedbackTargetRevisionBinding === null ||
    Array.isArray(careerOutcomeValenceFeedbackTargetRevisionBinding) ||
    typeof careerOutcomeValenceFeedbackTargetRevisionBinding !== "object"
  ) return fail(code);
  const {
    careerOutcomeValenceFeedbackTargetRevisionBindingId: _bindingId,
    careerOutcomeValenceFeedbackTargetDeclaration,
    targetCareerDecisionContextRevision,
    ...bindingBody
  } = careerOutcomeValenceFeedbackTargetRevisionBinding;
  if (
    careerOutcomeValenceFeedbackTargetDeclaration === null ||
    Array.isArray(careerOutcomeValenceFeedbackTargetDeclaration) ||
    typeof careerOutcomeValenceFeedbackTargetDeclaration !== "object" ||
    targetCareerDecisionContextRevision === null ||
    Array.isArray(targetCareerDecisionContextRevision) ||
    typeof targetCareerDecisionContextRevision !== "object"
  ) return fail(code);
  const {
    careerOutcomeValenceFeedbackTargetDeclarationId: _declarationId,
    ...declarationBody
  } = careerOutcomeValenceFeedbackTargetDeclaration;
  const {
    careerDecisionContextRevisionId: _targetRevisionId,
    ...targetRevisionBody
  } = targetCareerDecisionContextRevision;
  return {
    ...representationBody,
    careerOutcomeValenceFeedbackTargetRevisionBinding: {
      ...bindingBody,
      careerOutcomeValenceFeedbackTargetDeclaration: declarationBody,
      targetCareerDecisionContextRevision: targetRevisionBody,
    },
  };
}

function representation(
  value: unknown,
  code: string,
): CareerOutcomeValenceFeedbackReturnRepresentation {
  try {
    const captured = capture(value, code) as unknown as CareerOutcomeValenceFeedbackReturnRepresentation;
    assertCareerOutcomeValenceFeedbackReturnRepresentation(captured);
    return captured;
  } catch {
    return fail(code);
  }
}

function representationSemantic(
  value: unknown,
  code: string,
): CareerOutcomeValenceFeedbackReturnItemSemanticBody["careerOutcomeValenceFeedbackReturnRepresentation"] {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const keys = Object.keys(captured);
  let complete: CareerOutcomeValenceFeedbackReturnRepresentation;
  if (keys.length === representationArtifactKeys.length && representationArtifactKeys.every(key => key in captured)) {
    complete = representation(captured, code);
  } else if (keys.length === representationPartialKeys.length && representationPartialKeys.every(key => key in captured)) {
    complete = representation({ ...captured, createdAt: auditPlaceholder }, code);
  } else {
    try {
      deriveCareerOutcomeValenceFeedbackReturnRepresentationId(captured as never);
    } catch {
      return fail(code);
    }
    return canonicalRepresentationSemanticBody(captured, code) as
      CareerOutcomeValenceFeedbackReturnItemSemanticBody["careerOutcomeValenceFeedbackReturnRepresentation"];
  }
  const { careerOutcomeValenceFeedbackReturnRepresentationId: _id, createdAt: _createdAt, ...body } = complete;
  return canonicalRepresentationSemanticBody(capture(body, code), code) as
    CareerOutcomeValenceFeedbackReturnItemSemanticBody["careerOutcomeValenceFeedbackReturnRepresentation"];
}

function semanticBody(value: unknown, code: string): CareerOutcomeValenceFeedbackReturnItemSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION) return fail(code);
  return {
    careerOutcomeValenceFeedbackReturnRepresentation: representationSemantic(
      result.careerOutcomeValenceFeedbackReturnRepresentation,
      code,
    ),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  value: CareerOutcomeValenceFeedbackReturnRepresentation,
): CareerOutcomeValenceFeedbackReturnItemSemanticBody {
  return semanticBody({
    careerOutcomeValenceFeedbackReturnRepresentation: value,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION,
  }, invalid);
}

function input(value: unknown): CareerOutcomeValenceFeedbackReturnItemInput {
  const result = exact(value, inputKeys, invalid);
  if (!timestamp(result.createdAt)) return fail(invalid);
  return { createdAt: result.createdAt };
}

export function stableCareerOutcomeValenceFeedbackReturnItem(value: unknown): string {
  return JSON.stringify(canonical(capture(value, invalid)));
}

function deriveIdFromSemanticBody(body: CareerOutcomeValenceFeedbackReturnItemSemanticBody): string {
  const identity = [
    CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION,
    canonical(body.careerOutcomeValenceFeedbackReturnRepresentation as unknown as Captured),
  ];
  return `COVFRI_${createHash("sha256").update(stableCareerOutcomeValenceFeedbackReturnItem(identity), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function deriveCareerOutcomeValenceFeedbackReturnItemId(
  value: CareerOutcomeValenceFeedbackReturnItemSemanticBody,
): string {
  const body = semanticBody(value, invalid);
  return deriveIdFromSemanticBody(body);
}

export function createCareerOutcomeValenceFeedbackReturnItem(
  representationValue: CareerOutcomeValenceFeedbackReturnRepresentation,
  inputValue: CareerOutcomeValenceFeedbackReturnItemInput,
): CareerOutcomeValenceFeedbackReturnItem {
  const representationCaptured = representation(representationValue, representationInvalid);
  const inputCaptured = input(inputValue);
  const body = semanticFromComplete(representationCaptured);
  const result: CareerOutcomeValenceFeedbackReturnItem = {
    careerOutcomeValenceFeedbackReturnItemId: deriveIdFromSemanticBody(body),
    careerOutcomeValenceFeedbackReturnRepresentation: representationCaptured,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION,
    createdAt: inputCaptured.createdAt,
  };
  assertCareerOutcomeValenceFeedbackReturnItem(result);
  return structuredClone(result);
}

export function assertCareerOutcomeValenceFeedbackReturnItem(
  value: unknown,
): asserts value is CareerOutcomeValenceFeedbackReturnItem {
  try {
    const result = exact(value, artifactKeys, invalid);
    if (
      result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_SCHEMA_VERSION ||
      typeof result.careerOutcomeValenceFeedbackReturnItemId !== "string" ||
      !itemIdPattern.test(result.careerOutcomeValenceFeedbackReturnItemId) ||
      !timestamp(result.createdAt)
    ) return fail(invalid);
    const complete = representation(result.careerOutcomeValenceFeedbackReturnRepresentation, invalid);
    const expectedId = deriveIdFromSemanticBody(semanticFromComplete(complete));
    if (result.careerOutcomeValenceFeedbackReturnItemId !== expectedId) fail(idMismatch);
  } catch (error) {
    if (error instanceof Error && error.message === idMismatch) throw error;
    return fail(invalid);
  }
}
