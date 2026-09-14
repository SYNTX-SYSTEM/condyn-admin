import { createHash } from "node:crypto";
import {
  assertCareerOutcomeValenceFeedbackTargetRevisionBinding,
  deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId,
  type CareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody,
} from "../outcome-valence-feedback-target-revision-binding";
import {
  CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION,
  type CareerOutcomeValenceFeedbackReturnPayload,
  type CareerOutcomeValenceFeedbackReturnRepresentation,
  type CareerOutcomeValenceFeedbackReturnRepresentationInput,
  type CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody,
  type CareerStateSubject,
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const artifactKeys = [
  "careerOutcomeValenceFeedbackReturnRepresentationId",
  "careerOutcomeValenceFeedbackTargetRevisionBinding",
  "representedFeedback",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = [
  "careerOutcomeValenceFeedbackTargetRevisionBinding",
  "representedFeedback",
  "schemaVersion",
] as const;
const payloadKeys = [
  "feedbackKind",
  "stateSubject",
  "stateDimension",
  "beforeObservation",
  "afterObservation",
  "observedAt",
  "valence",
] as const;
const inputKeys = ["createdAt"] as const;
const bindingSemanticKeys = [
  "careerOutcomeValenceFeedbackTargetDeclaration",
  "targetCareerDecisionContextRevision",
  "schemaVersion",
] as const;
const bindingArtifactKeys = [
  "careerOutcomeValenceFeedbackTargetRevisionBindingId",
  "careerOutcomeValenceFeedbackTargetDeclaration",
  "targetCareerDecisionContextRevision",
  "schemaVersion",
  "createdAt",
] as const;
const bindingIdPattern = /^COVFTRB_[0-9A-F]{32}$/;
const representationIdPattern = /^COVFRR_[0-9A-F]{32}$/;
const auditPlaceholder = "1970-01-01T00:00:00.000Z";
const subjectKinds = [
  "PERSON", "ORGANIZATION", "SYSTEM", "DOCUMENT", "COMMUNICATION_ENDPOINT", "EXTERNAL_RESOURCE",
] as const;
const valences = ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const;
const observationStates = ["OBSERVED", "UNKNOWN", "NOT_OBSERVED", "OBSERVATION_FAILED"] as const;

type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

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
  const object = capture(value, code);
  if (object === null || Array.isArray(object) || typeof object !== "object") return fail(code);
  const actual = Object.keys(object);
  if (actual.length !== keys.length || keys.some(key => !Object.prototype.hasOwnProperty.call(object, key))) return fail(code);
  return object;
}

function canonical(value: Captured): Captured {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;
  const result: { [key: string]: Captured } = {};
  for (const key of Object.keys(value).sort()) result[key] = canonical(value[key]);
  return result;
}

function timestamp(value: unknown): value is string {
  if (typeof value !== "string" || value.trim() !== value || value.length === 0) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

function removeCreatedAt(value: Captured, code: string): Captured {
  if (value === null || Array.isArray(value) || typeof value !== "object") return fail(code);
  const { createdAt: _createdAt, ...body } = value;
  return body;
}

function normalizeBindingSemantic(
  value: unknown,
  code: string,
): CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody {
  const result = exact(value, bindingSemanticKeys, code);
  const declaration = removeCreatedAt(result.careerOutcomeValenceFeedbackTargetDeclaration, code);
  const revision = removeCreatedAt(result.targetCareerDecisionContextRevision, code);
  const body = {
    careerOutcomeValenceFeedbackTargetDeclaration: declaration,
    targetCareerDecisionContextRevision: revision,
    schemaVersion: result.schemaVersion,
  } as unknown as CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody;
  try {
    deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId(body);
    return body;
  } catch {
    return fail(code);
  }
}

function bindingSemantic(
  value: unknown,
  code: string,
): CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody {
  const captured = capture(value, code);
  if (captured === null || Array.isArray(captured) || typeof captured !== "object") return fail(code);
  const keys = Object.keys(captured);
  if (keys.length === bindingArtifactKeys.length && bindingArtifactKeys.every(key => Object.prototype.hasOwnProperty.call(captured, key))) {
    const bound = binding(captured, code);
    return normalizeBindingSemantic({
      careerOutcomeValenceFeedbackTargetDeclaration: bound.careerOutcomeValenceFeedbackTargetDeclaration,
      targetCareerDecisionContextRevision: bound.targetCareerDecisionContextRevision,
      schemaVersion: bound.schemaVersion,
    }, code);
  }
  const partialKeys = [
    "careerOutcomeValenceFeedbackTargetRevisionBindingId",
    "careerOutcomeValenceFeedbackTargetDeclaration",
    "targetCareerDecisionContextRevision",
    "schemaVersion",
  ];
  if (keys.length === partialKeys.length && partialKeys.every(key => Object.prototype.hasOwnProperty.call(captured, key))) {
    const bound = binding({ ...captured, createdAt: auditPlaceholder }, code);
    return normalizeBindingSemantic({
      careerOutcomeValenceFeedbackTargetDeclaration: bound.careerOutcomeValenceFeedbackTargetDeclaration,
      targetCareerDecisionContextRevision: bound.targetCareerDecisionContextRevision,
      schemaVersion: bound.schemaVersion,
    }, code);
  }
  return normalizeBindingSemantic(captured, code);
}

function binding(
  value: unknown,
  code: string,
): CareerOutcomeValenceFeedbackTargetRevisionBinding {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackTargetRevisionBinding;
    assertCareerOutcomeValenceFeedbackTargetRevisionBinding(result);
    return result;
  } catch {
    return fail(code);
  }
}

function subject(value: unknown, code: string): CareerStateSubject {
  const result = exact(value, ["subjectKind", "subjectRef"], code);
  if (
    !subjectKinds.includes(result.subjectKind as CareerStateSubject["subjectKind"]) ||
    typeof result.subjectRef !== "string" || result.subjectRef.length === 0 || result.subjectRef.trim() !== result.subjectRef
  ) return fail(code);
  return { subjectKind: result.subjectKind as CareerStateSubject["subjectKind"], subjectRef: result.subjectRef };
}

function observation(value: unknown, code: string): CareerOutcomeValenceFeedbackReturnPayload["beforeObservation"] {
  const result = exact(value, ["observationState", "value"], code);
  if (!observationStates.includes(result.observationState as typeof observationStates[number])) return fail(code);
  if (result.observationState === "OBSERVED") {
    if (typeof result.value !== "string" || result.value.length === 0 || result.value.trim() !== result.value) return fail(code);
    return { observationState: "OBSERVED", value: result.value };
  }
  if (result.value !== null) return fail(code);
  return {
    observationState: result.observationState as "UNKNOWN" | "NOT_OBSERVED" | "OBSERVATION_FAILED",
    value: null,
  };
}

function payload(value: unknown, code: string): CareerOutcomeValenceFeedbackReturnPayload {
  const result = exact(value, payloadKeys, code);
  if (
    result.feedbackKind !== "OUTCOME_VALENCE_FEEDBACK" ||
    typeof result.stateDimension !== "string" || result.stateDimension.length === 0 ||
    result.stateDimension.trim() !== result.stateDimension || !timestamp(result.observedAt) ||
    !valences.includes(result.valence as typeof valences[number])
  ) return fail(code);
  return {
    feedbackKind: "OUTCOME_VALENCE_FEEDBACK",
    stateSubject: subject(result.stateSubject, code),
    stateDimension: result.stateDimension,
    beforeObservation: observation(result.beforeObservation, code),
    afterObservation: observation(result.afterObservation, code),
    observedAt: result.observedAt,
    valence: result.valence as CareerOutcomeValenceFeedbackReturnPayload["valence"],
  };
}

function projected(
  value: CareerOutcomeValenceFeedbackTargetRevisionBinding,
): CareerOutcomeValenceFeedbackReturnPayload {
  const declaration = value.careerOutcomeValenceFeedbackTargetDeclaration;
  return {
    feedbackKind: "OUTCOME_VALENCE_FEEDBACK",
    stateSubject: subject(declaration.stateSubject, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID"),
    stateDimension: declaration.stateDimension,
    beforeObservation: observation(declaration.beforeObservation, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID"),
    afterObservation: observation(declaration.afterObservation, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID"),
    observedAt: declaration.observedAt,
    valence: declaration.valence,
  };
}

function same(left: Captured, right: Captured): boolean {
  return JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
}

function semanticBody(
  value: unknown,
  code: string,
): CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION) return fail(code);
  return {
    careerOutcomeValenceFeedbackTargetRevisionBinding: bindingSemantic(
      result.careerOutcomeValenceFeedbackTargetRevisionBinding,
      code,
    ),
    representedFeedback: payload(result.representedFeedback, code),
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  bindingValue: CareerOutcomeValenceFeedbackTargetRevisionBinding,
  representedFeedback: CareerOutcomeValenceFeedbackReturnPayload,
): CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody {
  return semanticBody({
    careerOutcomeValenceFeedbackTargetRevisionBinding: bindingValue,
    representedFeedback,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION,
  }, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID");
}

function input(value: unknown): CareerOutcomeValenceFeedbackReturnRepresentationInput {
  const result = exact(value, inputKeys, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID");
  if (!timestamp(result.createdAt)) return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID");
  return { createdAt: result.createdAt };
}

export function stableCareerOutcomeValenceFeedbackReturnRepresentation(value: unknown): string {
  return JSON.stringify(canonical(capture(value, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID")));
}

export function deriveCareerOutcomeValenceFeedbackReturnRepresentationId(
  value: CareerOutcomeValenceFeedbackReturnRepresentationSemanticBody,
): string {
  const body = semanticBody(value, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID");
  const identity = [
    CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION,
    canonical(body.careerOutcomeValenceFeedbackTargetRevisionBinding as unknown as Captured),
    canonical(body.representedFeedback as unknown as Captured),
  ];
  return `COVFRR_${createHash("sha256").update(stableCareerOutcomeValenceFeedbackReturnRepresentation(identity), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

export function createCareerOutcomeValenceFeedbackReturnRepresentation(
  bindingValue: CareerOutcomeValenceFeedbackTargetRevisionBinding,
  inputValue: CareerOutcomeValenceFeedbackReturnRepresentationInput,
): CareerOutcomeValenceFeedbackReturnRepresentation {
  const bindingCaptured = binding(
    bindingValue,
    "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_TARGET_REVISION_BINDING_INVALID",
  );
  const inputCaptured = input(inputValue);
  const representedFeedback = projected(bindingCaptured);
  const body = semanticFromComplete(bindingCaptured, representedFeedback);
  const result: CareerOutcomeValenceFeedbackReturnRepresentation = {
    careerOutcomeValenceFeedbackReturnRepresentationId:
      deriveCareerOutcomeValenceFeedbackReturnRepresentationId(body),
    careerOutcomeValenceFeedbackTargetRevisionBinding: bindingCaptured,
    representedFeedback,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION,
    createdAt: inputCaptured.createdAt,
  };
  assertCareerOutcomeValenceFeedbackReturnRepresentation(result);
  return structuredClone(result);
}

export function assertCareerOutcomeValenceFeedbackReturnRepresentation(
  value: unknown,
): asserts value is CareerOutcomeValenceFeedbackReturnRepresentation {
  const code = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID";
  try {
    const result = exact(value, artifactKeys, code);
    if (
      result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_SCHEMA_VERSION ||
      typeof result.careerOutcomeValenceFeedbackReturnRepresentationId !== "string" ||
      !representationIdPattern.test(result.careerOutcomeValenceFeedbackReturnRepresentationId) ||
      !timestamp(result.createdAt)
    ) return fail(code);
    const bound = binding(result.careerOutcomeValenceFeedbackTargetRevisionBinding, code);
    const actualPayload = payload(result.representedFeedback, code);
    const expectedPayload = projected(bound);
    if (!same(actualPayload as unknown as Captured, expectedPayload as unknown as Captured)) return fail(code);
    const expectedId = deriveCareerOutcomeValenceFeedbackReturnRepresentationId(
      semanticFromComplete(bound, expectedPayload),
    );
    if (result.careerOutcomeValenceFeedbackReturnRepresentationId !== expectedId) {
      fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ID_MISMATCH");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ID_MISMATCH") throw error;
    return fail(code);
  }
}
