import { createHash } from "node:crypto";
import { CAREER_CANONICAL_AUTHORITY_CONTRACTS, CAREER_CANONICAL_PRODUCER_ID } from "../../canonical-authority/contracts";
import { assertCareerDecisionContextRevision, type CareerDecisionContextRevision } from "../decision-context";
import type { AuthoritativeStateReference } from "../state-change-declaration";
import {
  CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION,
  type BoundCareerDecisionContextDecisionRevisionBinder,
  type CareerDecisionContextDecisionRevisionBinding,
  type CareerDecisionContextDecisionRevisionBindingInput,
  type CareerDecisionContextDecisionRevisionBindingSemanticBody,
  type CareerDecisionContextRevisionReader,
  type GenericDecisionContextRevisionReader,
  type GenericDecisionContextRevisionWitness,
} from "./types";

const invalid = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_INVALID";
const idMismatch = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_ID_MISMATCH";
const readerInvalid = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_READER_INVALID";
const contextNotFound = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_CONTEXT_NOT_FOUND";
const contextInvalid = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_CONTEXT_INVALID";
const revisionNotFound = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_DECISION_REVISION_NOT_FOUND";
const revisionInvalid = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_DECISION_REVISION_INVALID";
const witnessMissing = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISSING";
const witnessAmbiguous = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_AMBIGUOUS";
const witnessMismatch = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_RECOMMENDATION_PROPOSAL_WITNESS_MISMATCH";

const fail = (code: string): never => { throw new Error(code); };
const bindingKeys = [
  "careerDecisionContextDecisionRevisionBindingId",
  "careerDecisionContextRevision",
  "decisionContextRevision",
  "recommendationProposalWitness",
  "schemaVersion",
  "createdAt",
] as const;
const semanticKeys = ["careerDecisionContextRevision", "decisionContextRevision", "recommendationProposalWitness", "schemaVersion"] as const;
const inputKeys = ["careerDecisionContextRevisionId", "decisionContextRevisionId", "createdAt"] as const;
const revisionKeys = ["artifactKind", "schemaVersion", "revisionId", "previousRevisionId", "context", "validationInput", "validationAssembly"] as const;
const contextKeys = ["artifactKind", "schemaVersion", "contextId", "validationStatus", "sourceStateReferences", "decisionQuestionId", "items"] as const;
const referenceKeys = ["producerId", "authorityContractId", "artifactId", "locator"] as const;
const contextRevisionKeys = [
  "careerDecisionContextRevisionId",
  "decisionAuthorityGrantRevisionId",
  "recommendationProposalId",
  "decisionSubjects",
  "contextEvidenceRefs",
  "authorityScope",
  "permittedDecisionClasses",
  "permittedSubjectKinds",
  "schemaVersion",
] as const;
const bindingIdPattern = /^DCDRB_[0-9A-F]{32}$/;
const genericRevisionIdPattern = /^DREV_[0-9A-F]{24}$/;
const genericContextIdPattern = /^DCTX_[0-9A-F]{24}$/;
const genericItemIdPattern = /^DCI_[0-9A-F]{24}$/;
const careerContextIdPattern = /^DCTXREV_[0-9A-F]{32}$/;
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
        const arrayLength = length !== undefined && "value" in length && typeof length.value === "number" ? length.value : fail(code);
        if (
          !Number.isSafeInteger(arrayLength) || arrayLength < 0 || keys.length !== arrayLength + 1 ||
          !keys.includes("length") || keys.some(key => typeof key === "symbol" || (key !== "length" &&
            (!/^(0|[1-9][0-9]*)$/.test(key) || Number(key) >= arrayLength)))
        ) return fail(code);
        const result: Captured[] = [];
        for (let index = 0; index < arrayLength; index += 1) {
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

const exactText = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.trim() === value;

function reference(value: unknown, code: string): AuthoritativeStateReference {
  const result = exact(value, referenceKeys, code);
  for (const key of referenceKeys) if (!exactText(result[key])) fail(code);
  return {
    producerId: result.producerId as string,
    authorityContractId: result.authorityContractId as string,
    artifactId: result.artifactId as string,
    locator: result.locator as string,
  };
}

/** Shape witness only: exact keys, exact identifier patterns, exact references. Generic validity is the reader's duty. */
function genericRevision(value: unknown, code: string): GenericDecisionContextRevisionWitness {
  const result = exact(value, revisionKeys, code);
  if (result.artifactKind !== "DECISION_CONTEXT_REVISION" || result.schemaVersion !== "DECISION_CONTEXT_REVISION_V1") fail(code);
  if (typeof result.revisionId !== "string" || !genericRevisionIdPattern.test(result.revisionId)) fail(code);
  if (result.previousRevisionId !== null && (typeof result.previousRevisionId !== "string" || !genericRevisionIdPattern.test(result.previousRevisionId))) fail(code);
  if (result.previousRevisionId === result.revisionId) fail(code);
  const context = exact(result.context, contextKeys, code);
  if (context.artifactKind !== "DECISION_CONTEXT_DRAFT" || context.schemaVersion !== "DECISION_CONTEXT_DRAFT_V1" || context.validationStatus !== "NOT_RUN") fail(code);
  if (typeof context.contextId !== "string" || !genericContextIdPattern.test(context.contextId)) fail(code);
  if (typeof context.decisionQuestionId !== "string" || !genericItemIdPattern.test(context.decisionQuestionId)) fail(code);
  if (!Array.isArray(context.sourceStateReferences) || !Array.isArray(context.items)) fail(code);
  const sourceStateReferences = (context.sourceStateReferences as Captured[]).map(item => reference(item, code));
  if (result.validationInput === null || typeof result.validationInput !== "object" || Array.isArray(result.validationInput)) fail(code);
  if (result.validationAssembly === null || typeof result.validationAssembly !== "object" || Array.isArray(result.validationAssembly)) fail(code);
  return {
    artifactKind: "DECISION_CONTEXT_REVISION",
    schemaVersion: "DECISION_CONTEXT_REVISION_V1",
    revisionId: result.revisionId as string,
    previousRevisionId: result.previousRevisionId as string | null,
    context: {
      artifactKind: "DECISION_CONTEXT_DRAFT",
      schemaVersion: "DECISION_CONTEXT_DRAFT_V1",
      contextId: context.contextId as string,
      validationStatus: "NOT_RUN",
      sourceStateReferences,
      decisionQuestionId: context.decisionQuestionId as string,
      items: context.items as Captured[],
    },
    validationInput: result.validationInput,
    validationAssembly: result.validationAssembly,
  };
}

function careerRevision(value: unknown, code: string): CareerDecisionContextRevision {
  try {
    const result = capture(value, code) as unknown as CareerDecisionContextRevision;
    assertCareerDecisionContextRevision(result);
    return result;
  } catch {
    return fail(code);
  }
}

function semanticCareerRevision(value: unknown, code: string): Omit<CareerDecisionContextRevision, "createdAt"> {
  const result = exact(value, contextRevisionKeys, code);
  try {
    assertCareerDecisionContextRevision({ ...result, createdAt: auditPlaceholder });
    return result as unknown as Omit<CareerDecisionContextRevision, "createdAt">;
  } catch {
    return fail(code);
  }
}

/**
 * The DREV must carry exactly one whole-artifact reference to the DCTXREV's recommendation
 * proposal under the Career producer and its RCP contract id. Further references with the
 * same pair are admitted only as item locators `<rcpId>/items/<ordinal>` of that same RCP
 * (the R1/R6 locator grammar). Any reference with the pair naming another artifact is a
 * mismatch. Exact ids only; not option correspondence, semantic support, or currentness.
 */
function recommendationProposalWitness(
  revision: GenericDecisionContextRevisionWitness,
  careerContext: Pick<CareerDecisionContextRevision, "recommendationProposalId">,
  codes: { missing: string; ambiguous: string; mismatch: string },
): AuthoritativeStateReference {
  const rcpId = careerContext.recommendationProposalId;
  const candidates = revision.context.sourceStateReferences.filter(item =>
    item.producerId === CAREER_CANONICAL_PRODUCER_ID &&
    item.authorityContractId === CAREER_CANONICAL_AUTHORITY_CONTRACTS.RECOMMENDATION_PROPOSAL);
  if (candidates.some(item => item.artifactId !== rcpId)) fail(codes.mismatch);
  const itemLocator = new RegExp(`^${rcpId}/items/(0|[1-9][0-9]*)$`);
  if (candidates.some(item => item.locator !== rcpId && !itemLocator.test(item.locator))) fail(codes.mismatch);
  const whole = candidates.filter(item => item.locator === rcpId);
  if (whole.length === 0) fail(codes.missing);
  if (whole.length > 1) fail(codes.ambiguous);
  return { ...whole[0] };
}

const sameReference = (left: AuthoritativeStateReference, right: AuthoritativeStateReference) =>
  referenceKeys.every(key => left[key] === right[key]);

function semanticBody(value: unknown, code: string): CareerDecisionContextDecisionRevisionBindingSemanticBody {
  const result = exact(value, semanticKeys, code);
  if (result.schemaVersion !== CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION) fail(code);
  const careerContext = semanticCareerRevision(result.careerDecisionContextRevision, code);
  const revision = genericRevision(result.decisionContextRevision, code);
  const witness = recommendationProposalWitness(revision, careerContext, { missing: code, ambiguous: code, mismatch: code });
  if (!sameReference(witness, reference(result.recommendationProposalWitness, code))) fail(code);
  return {
    careerDecisionContextRevision: careerContext,
    decisionContextRevision: revision,
    recommendationProposalWitness: witness,
    schemaVersion: CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION,
  };
}

function semanticFromComplete(
  careerContext: CareerDecisionContextRevision,
  revision: GenericDecisionContextRevisionWitness,
  witness: AuthoritativeStateReference,
): CareerDecisionContextDecisionRevisionBindingSemanticBody {
  const { createdAt: _createdAt, ...contextBody } = careerContext;
  return semanticBody({
    careerDecisionContextRevision: contextBody,
    decisionContextRevision: revision,
    recommendationProposalWitness: witness,
    schemaVersion: CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION,
  }, invalid);
}

export function stableCareerDecisionContextDecisionRevisionBinding(value: unknown): string {
  return JSON.stringify(canonical(capture(value, invalid)));
}

export function deriveCareerDecisionContextDecisionRevisionBindingId(
  value: CareerDecisionContextDecisionRevisionBindingSemanticBody,
): string {
  const body = semanticBody(value, invalid);
  const payload = [
    CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION,
    canonical(body.careerDecisionContextRevision as unknown as Captured),
    canonical(body.decisionContextRevision as unknown as Captured),
    canonical(body.recommendationProposalWitness as unknown as Captured),
  ];
  return `DCDRB_${createHash("sha256").update(stableCareerDecisionContextDecisionRevisionBinding(payload), "utf8").digest("hex").slice(0, 32).toUpperCase()}`;
}

function captureMethod<T>(value: unknown, name: string): T {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return fail(readerInvalid);
    const keys = Reflect.ownKeys(value);
    if (keys.length !== 1 || keys[0] !== name) return fail(readerInvalid);
    const descriptor = Reflect.getOwnPropertyDescriptor(value, name);
    if (descriptor === undefined || descriptor.enumerable !== true || !("value" in descriptor) || typeof descriptor.value !== "function") return fail(readerInvalid);
    return descriptor.value.bind(value) as T;
  } catch {
    return fail(readerInvalid);
  }
}

function bindingInput(value: unknown): CareerDecisionContextDecisionRevisionBindingInput {
  const result = exact(value, inputKeys, invalid);
  if (typeof result.careerDecisionContextRevisionId !== "string" || !careerContextIdPattern.test(result.careerDecisionContextRevisionId)) fail(invalid);
  if (typeof result.decisionContextRevisionId !== "string" || !genericRevisionIdPattern.test(result.decisionContextRevisionId)) fail(invalid);
  if (!timestamp(result.createdAt)) fail(invalid);
  return {
    careerDecisionContextRevisionId: result.careerDecisionContextRevisionId as string,
    decisionContextRevisionId: result.decisionContextRevisionId as string,
    createdAt: result.createdAt as string,
  };
}

/**
 * Exact reader-backed binding only. Both sides are read by exact id through
 * capabilities bound at construction; nothing is selected, refreshed, or
 * validated beyond represented shape and exact identifier equality.
 */
export function createBoundCareerDecisionContextDecisionRevisionBinder(
  contexts: CareerDecisionContextRevisionReader,
  revisions: GenericDecisionContextRevisionReader,
): BoundCareerDecisionContextDecisionRevisionBinder {
  const getCareerDecisionContextRevisionById = captureMethod<(id: string) => Promise<CareerDecisionContextRevision | null>>(contexts, "getCareerDecisionContextRevisionById");
  const getDecisionContextRevisionById = captureMethod<(id: string) => Promise<unknown>>(revisions, "getDecisionContextRevisionById");
  return {
    async bind(inputValue) {
      const input = bindingInput(inputValue);
      const returnedContext = await getCareerDecisionContextRevisionById(input.careerDecisionContextRevisionId);
      if (returnedContext === null || returnedContext === undefined) fail(contextNotFound);
      const careerContext = careerRevision(returnedContext, contextInvalid);
      if (careerContext.careerDecisionContextRevisionId !== input.careerDecisionContextRevisionId) fail(contextInvalid);
      const returnedRevision = await getDecisionContextRevisionById(input.decisionContextRevisionId);
      if (returnedRevision === null || returnedRevision === undefined) fail(revisionNotFound);
      const revision = genericRevision(returnedRevision, revisionInvalid);
      if (revision.revisionId !== input.decisionContextRevisionId) fail(revisionInvalid);
      const witness = recommendationProposalWitness(revision, careerContext, { missing: witnessMissing, ambiguous: witnessAmbiguous, mismatch: witnessMismatch });
      const body = semanticFromComplete(careerContext, revision, witness);
      const result: CareerDecisionContextDecisionRevisionBinding = {
        careerDecisionContextDecisionRevisionBindingId: deriveCareerDecisionContextDecisionRevisionBindingId(body),
        careerDecisionContextRevision: careerContext,
        decisionContextRevision: revision,
        recommendationProposalWitness: witness,
        schemaVersion: CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION,
        createdAt: input.createdAt,
      };
      assertCareerDecisionContextDecisionRevisionBinding(result);
      return structuredClone(result);
    },
  };
}

export function assertCareerDecisionContextDecisionRevisionBinding(
  value: unknown,
): asserts value is CareerDecisionContextDecisionRevisionBinding {
  try {
    const result = exact(value, bindingKeys, invalid);
    if (
      result.schemaVersion !== CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_SCHEMA_VERSION ||
      typeof result.careerDecisionContextDecisionRevisionBindingId !== "string" ||
      !bindingIdPattern.test(result.careerDecisionContextDecisionRevisionBindingId) ||
      !timestamp(result.createdAt)
    ) fail(invalid);
    const careerContext = careerRevision(result.careerDecisionContextRevision, invalid);
    const revision = genericRevision(result.decisionContextRevision, invalid);
    const witness = recommendationProposalWitness(revision, careerContext, { missing: invalid, ambiguous: invalid, mismatch: invalid });
    if (!sameReference(witness, reference(result.recommendationProposalWitness, invalid))) fail(invalid);
    const expected = deriveCareerDecisionContextDecisionRevisionBindingId(semanticFromComplete(careerContext, revision, witness));
    if (result.careerDecisionContextDecisionRevisionBindingId !== expected) fail(idMismatch);
  } catch (error) {
    if (error instanceof Error && error.message === idMismatch) throw error;
    return fail(invalid);
  }
}

export function sameCareerDecisionContextDecisionRevisionBinding(left: unknown, right: unknown): boolean {
  try {
    return stableCareerDecisionContextDecisionRevisionBinding(left) === stableCareerDecisionContextDecisionRevisionBinding(right);
  } catch {
    return false;
  }
}
