import { createHash } from "node:crypto";
import { assertDecisionAssessmentRequest, type DecisionAssessmentRequest } from "../assessment-request";
import { assertDecisionContextRevision, type DecisionContextRevision } from "../revisions";
import {
  DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION,
  type BoundDecisionAssessmentBasisBinder,
  type DecisionAssessmentBasis,
  type DecisionAssessmentBasisRevisionReader
} from "./types";

const fail = (code: string): never => { throw new Error(code); };
const basisKeys = ["artifactKind", "schemaVersion", "assessmentBasisId", "assessmentRequest", "revision"] as const;
const basisPattern = /^DABAS_[0-9A-F]{24}$/;
type Captured = null | boolean | number | string | Captured[] | { [key: string]: Captured };

function capture(value: unknown, code: string, ancestors: WeakSet<object> = new WeakSet<object>()): Captured {
  try {
    if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
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
  for (const key of Object.keys(value).sort((left, right) => left < right ? -1 : left > right ? 1 : 0)) result[key] = canonical(value[key]);
  return result;
}

function basisId(request: DecisionAssessmentRequest, revision: DecisionContextRevision): string {
  const digest = createHash("sha256").update(JSON.stringify([
    DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION,
    canonical(request as unknown as Captured),
    canonical(revision as unknown as Captured)
  ]), "utf8").digest("hex").slice(0, 24).toUpperCase();
  return `DABAS_${digest}`;
}

function captureRequest(value: unknown, code: string): DecisionAssessmentRequest {
  try {
    const request = capture(value, code) as unknown as DecisionAssessmentRequest;
    assertDecisionAssessmentRequest(request);
    return request;
  } catch { return fail(code); }
}

function captureRevision(value: unknown, requestedRevisionId: string, code: string): DecisionContextRevision {
  try {
    const revision = capture(value, code) as unknown as DecisionContextRevision;
    assertDecisionContextRevision(revision);
    if (revision.revisionId !== requestedRevisionId) return fail(code);
    return revision;
  } catch { return fail(code); }
}

function validateItems(request: DecisionAssessmentRequest, revision: DecisionContextRevision, code: { missing: string; role: string }): void {
  const byId = new Map(revision.context.items.map((item) => [item.itemId, item]));
  const question = byId.get(request.decisionQuestionItemId);
  if (question === undefined) return fail(code.missing);
  if (question.role !== "DECISION_QUESTION" || revision.context.decisionQuestionId !== request.decisionQuestionItemId) fail(code.role);
  for (const [ids, role] of [
    [request.selectedOptionItemIds, "OPTION"],
    [request.selectedObjectiveItemIds, "OBJECTIVE"],
    [request.selectedConstraintItemIds, "CONSTRAINT"]
  ] as const) {
    for (const itemId of ids) {
      const item = byId.get(itemId);
      if (item === undefined) return fail(code.missing);
      if (item.role !== role) fail(code.role);
    }
  }
}

function construct(request: DecisionAssessmentRequest, revision: DecisionContextRevision): DecisionAssessmentBasis {
  return {
    artifactKind: "DECISION_ASSESSMENT_BASIS",
    schemaVersion: DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION,
    assessmentBasisId: basisId(request, revision),
    assessmentRequest: request,
    revision
  };
}

function captureReader(value: unknown): (revisionId: string) => Promise<DecisionContextRevision | null> {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID");
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== "getRevisionById") return fail("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID");
    const descriptor = Reflect.getOwnPropertyDescriptor(value, "getRevisionById");
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID");
    return descriptor.value.bind(value) as (revisionId: string) => Promise<DecisionContextRevision | null>;
  } catch { return fail("ERR_DECISION_ASSESSMENT_BASIS_READER_INVALID"); }
}

/** Binds one exact revision read capability to one request/revision membership operation. */
export function createBoundDecisionAssessmentBasisBinder(reader: DecisionAssessmentBasisRevisionReader): BoundDecisionAssessmentBasisBinder {
  const getRevisionById = captureReader(reader);
  return {
    async bind(assessmentRequest: DecisionAssessmentRequest): Promise<DecisionAssessmentBasis> {
      const request = captureRequest(assessmentRequest, "ERR_DECISION_ASSESSMENT_BASIS_REQUEST_INVALID");
      const returned = await getRevisionById(request.revisionId);
      if (returned === null) fail("ERR_DECISION_ASSESSMENT_BASIS_REVISION_NOT_FOUND");
      const revision = captureRevision(returned, request.revisionId, "ERR_DECISION_ASSESSMENT_BASIS_REVISION_INVALID");
      validateItems(request, revision, { missing: "ERR_DECISION_ASSESSMENT_BASIS_ITEM_NOT_FOUND", role: "ERR_DECISION_ASSESSMENT_BASIS_ROLE_MISMATCH" });
      const basis = construct(request, revision);
      assertDecisionAssessmentBasis(basis);
      return structuredClone(basis);
    }
  };
}

/** Verifies exact embedded sealed predecessor state and complete-state deterministic identity without reading a dependency. */
export function assertDecisionAssessmentBasis(value: unknown): asserts value is DecisionAssessmentBasis {
  const invalid = "ERR_DECISION_ASSESSMENT_BASIS_INVALID";
  try {
    const basis = exact(value, basisKeys, invalid);
    if (basis.artifactKind !== "DECISION_ASSESSMENT_BASIS" || basis.schemaVersion !== DECISION_ASSESSMENT_BASIS_SCHEMA_VERSION || typeof basis.assessmentBasisId !== "string" || !basisPattern.test(basis.assessmentBasisId)) fail(invalid);
    const request = captureRequest(basis.assessmentRequest, invalid);
    const revision = captureRevision(basis.revision, request.revisionId, invalid);
    validateItems(request, revision, { missing: invalid, role: invalid });
    if (basis.assessmentBasisId !== basisId(request, revision)) fail("ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH");
  } catch (error) {
    if (error instanceof Error && error.message === "ERR_DECISION_ASSESSMENT_BASIS_ID_MISMATCH") throw error;
    return fail(invalid);
  }
}
