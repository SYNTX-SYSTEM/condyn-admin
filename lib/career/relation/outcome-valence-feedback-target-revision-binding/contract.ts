import { createHash } from "node:crypto";
import {
  assertCareerDecisionContextRevision,
  type CareerDecisionContextRevision,
} from "../decision-context";
import {
  assertCareerOutcomeValenceFeedbackTargetDeclaration,
  type CareerOutcomeValenceFeedbackTargetDeclaration,
} from "../outcome-valence-feedback-target-declaration";
import {
  CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION,
  type BoundCareerOutcomeValenceFeedbackTargetRevisionBinder,
  type CareerDecisionContextRevisionReader,
  type CareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBindingInput,
  type CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody,
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const bindingKeys = [
  "careerOutcomeValenceFeedbackTargetRevisionBindingId",
  "careerOutcomeValenceFeedbackTargetDeclaration",
  "targetCareerDecisionContextRevision",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = [
  "careerOutcomeValenceFeedbackTargetDeclaration",
  "targetCareerDecisionContextRevision",
  "schemaVersion",
] as const;
const inputKeys = ["createdAt"] as const;
const bindingIdPattern = /^COVFTRB_[0-9A-F]{32}$/;
const auditPlaceholder = "1970-01-01T00:00:00.000Z";

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

function declaration(value: unknown, code: string): CareerOutcomeValenceFeedbackTargetDeclaration {
  try {
    const result = capture(value, code) as unknown as CareerOutcomeValenceFeedbackTargetDeclaration;
    assertCareerOutcomeValenceFeedbackTargetDeclaration(result);
    return result;
  } catch {
    return fail(code);
  }
}

function revision(value: unknown, targetId: string, code: string): CareerDecisionContextRevision {
  try {
    const result = capture(value, code) as unknown as CareerDecisionContextRevision;
    assertCareerDecisionContextRevision(result);
    if (result.careerDecisionContextRevisionId !== targetId) return fail(code);
    return result;
  } catch {
    return fail(code);
  }
}

function semanticDeclaration(value: unknown, code: string): Omit<CareerOutcomeValenceFeedbackTargetDeclaration, "createdAt"> {
  const result = exact(value, [
    "careerOutcomeValenceFeedbackTargetDeclarationId",
    "careerOutcomeValenceFeedbackAdmissionDeclarationId",
    "careerOutcomeValenceDeclarationId",
    "careerOutcomeRoleDeclarationId",
    "careerActionStateChangeAssociationDeclarationId",
    "careerStateChangeDeclarationId",
    "careerActionOccurrenceId",
    "careerExecutionContextRevisionId",
    "careerExecutionAuthorityGrantRevisionId",
    "careerHumanCommitmentId",
    "careerDecisionActionIntentId",
    "humanDecisionRecordId",
    "careerDecisionContextRevisionId",
    "decisionAuthorityGrantRevisionId",
    "recommendationProposalId",
    "performedByActorId",
    "observedByActorId",
    "associationDeclaredByActorId",
    "outcomeRoleDeclaredByActorId",
    "outcomeValenceDeclaredByActorId",
    "decisionSubjects",
    "sourceDeclarationClass",
    "sourceActionIntentClass",
    "operationDescription",
    "executionAuthorityScope",
    "executionTarget",
    "executionChannel",
    "actionOccurredAt",
    "stateSubject",
    "stateDimension",
    "beforeObservation",
    "afterObservation",
    "observedAt",
    "associationDeclaredAt",
    "outcomeRoleDeclaredAt",
    "outcomeValenceDeclaredAt",
    "valence",
    "admittedByActorId",
    "admittedAt",
    "admissionState",
    "targetCareerDecisionContextRevisionId",
    "declaredByActorId",
    "declaredAt",
    "targetSelectionEvidenceRefs",
    "schemaVersion",
  ], code);
  try {
    assertCareerOutcomeValenceFeedbackTargetDeclaration({ ...result, createdAt: auditPlaceholder });
    return result as unknown as Omit<CareerOutcomeValenceFeedbackTargetDeclaration, "createdAt">;
  } catch {
    return fail(code);
  }
}

function semanticRevision(value: unknown, code: string): Omit<CareerDecisionContextRevision, "createdAt"> {
  const result = exact(value, [
    "careerDecisionContextRevisionId",
    "decisionAuthorityGrantRevisionId",
    "recommendationProposalId",
    "decisionSubjects",
    "contextEvidenceRefs",
    "authorityScope",
    "permittedDecisionClasses",
    "permittedSubjectKinds",
    "schemaVersion",
  ], code);
  try {
    assertCareerDecisionContextRevision({ ...result, createdAt: auditPlaceholder });
    return result as unknown as Omit<CareerDecisionContextRevision, "createdAt">;
  } catch {
    return fail(code);
  }
}

function semanticBody(value: unknown, code: string): CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION) return fail(code);
  const targetDeclaration = semanticDeclaration(result.careerOutcomeValenceFeedbackTargetDeclaration, code);
  const targetRevision = semanticRevision(result.targetCareerDecisionContextRevision, code);
  if (targetDeclaration.targetCareerDecisionContextRevisionId !== targetRevision.careerDecisionContextRevisionId) return fail(code);
  return {
    careerOutcomeValenceFeedbackTargetDeclaration: targetDeclaration,
    targetCareerDecisionContextRevision: targetRevision,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  targetDeclaration: CareerOutcomeValenceFeedbackTargetDeclaration,
  targetRevision: CareerDecisionContextRevision,
): CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody {
  const { createdAt: _declarationCreatedAt, ...declarationBody } = targetDeclaration;
  const { createdAt: _revisionCreatedAt, ...revisionBody } = targetRevision;
  return semanticBody({
    careerOutcomeValenceFeedbackTargetDeclaration: declarationBody,
    targetCareerDecisionContextRevision: revisionBody,
    schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION,
  }, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID");
}

export function stableCareerOutcomeValenceFeedbackTargetRevisionBinding(value: unknown): string {
  return JSON.stringify(canonical(capture(value, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID")));
}

export function deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId(
  value: CareerOutcomeValenceFeedbackTargetRevisionBindingSemanticBody,
): string {
  const body = semanticBody(value, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID");
  const payload = [
    CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION,
    canonical(body.careerOutcomeValenceFeedbackTargetDeclaration as unknown as Captured),
    canonical(body.targetCareerDecisionContextRevision as unknown as Captured),
  ];
  return `COVFTRB_${createHash("sha256").update(stableCareerOutcomeValenceFeedbackTargetRevisionBinding(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

function captureReader(value: unknown): (id: string) => Promise<CareerDecisionContextRevision | null> {
  const code = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_READER_INVALID";
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(code);
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "getCareerDecisionContextRevisionById") return fail(code);
    const descriptor = Reflect.getOwnPropertyDescriptor(value, "getCareerDecisionContextRevisionById");
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail(code);
    return descriptor.value.bind(value) as (id: string) => Promise<CareerDecisionContextRevision | null>;
  } catch {
    return fail(code);
  }
}

function bindingInput(value: unknown): CareerOutcomeValenceFeedbackTargetRevisionBindingInput {
  const result = exact(value, inputKeys, "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID");
  if (!timestamp(result.createdAt)) return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID");
  return { createdAt: result.createdAt };
}

/** Exact reader-backed binding only; it does not create target, receiver, or context authority. */
export function createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder(
  reader: CareerDecisionContextRevisionReader,
): BoundCareerOutcomeValenceFeedbackTargetRevisionBinder {
  const getCareerDecisionContextRevisionById = captureReader(reader);
  return {
    async bind(declarationValue, inputValue) {
      const targetDeclaration = declaration(
        declarationValue,
        "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_DECLARATION_INVALID",
      );
      const targetId = targetDeclaration.targetCareerDecisionContextRevisionId;
      const input = bindingInput(inputValue);
      const returned = await getCareerDecisionContextRevisionById(targetId);
      if (returned === null) fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_NOT_FOUND");
      const targetRevision = revision(
        returned,
        targetId,
        "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_REVISION_INVALID",
      );
      const body = semanticFromComplete(targetDeclaration, targetRevision);
      const result: CareerOutcomeValenceFeedbackTargetRevisionBinding = {
        careerOutcomeValenceFeedbackTargetRevisionBindingId:
          deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId(body),
        careerOutcomeValenceFeedbackTargetDeclaration: targetDeclaration,
        targetCareerDecisionContextRevision: targetRevision,
        schemaVersion: CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION,
        createdAt: input.createdAt,
      };
      assertCareerOutcomeValenceFeedbackTargetRevisionBinding(result);
      return structuredClone(result);
    },
  };
}

export function assertCareerOutcomeValenceFeedbackTargetRevisionBinding(
  value: unknown,
): asserts value is CareerOutcomeValenceFeedbackTargetRevisionBinding {
  const code = "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_INVALID";
  try {
    const result = exact(value, bindingKeys, code);
    if (
      result.schemaVersion !== CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_SCHEMA_VERSION ||
      typeof result.careerOutcomeValenceFeedbackTargetRevisionBindingId !== "string" ||
      !bindingIdPattern.test(result.careerOutcomeValenceFeedbackTargetRevisionBindingId) ||
      !timestamp(result.createdAt)
    ) return fail(code);
    const targetDeclaration = declaration(result.careerOutcomeValenceFeedbackTargetDeclaration, code);
    const targetRevision = revision(
      result.targetCareerDecisionContextRevision,
      targetDeclaration.targetCareerDecisionContextRevisionId,
      code,
    );
    const expected = deriveCareerOutcomeValenceFeedbackTargetRevisionBindingId(
      semanticFromComplete(targetDeclaration, targetRevision),
    );
    if (result.careerOutcomeValenceFeedbackTargetRevisionBindingId !== expected) {
      fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ID_MISMATCH");
    }
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ID_MISMATCH") throw error;
    return fail(code);
  }
}
