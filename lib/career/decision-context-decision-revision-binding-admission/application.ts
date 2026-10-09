import type { CareerDecisionContextRevision } from "../relation/decision-context";
import {
  assertCareerDecisionContextDecisionRevisionBinding,
  createBoundCareerDecisionContextDecisionRevisionBinder,
  stableCareerDecisionContextDecisionRevisionBinding,
  type CareerDecisionContextDecisionRevisionBinding,
  type CareerDecisionContextDecisionRevisionBindingInput,
} from "../relation/decision-context-decision-revision-binding";

export interface CareerDecisionContextDecisionRevisionBindingAdmissionDependencies {
  decisionContexts: {
    getCareerDecisionContextRevisionById(id: string): Promise<CareerDecisionContextRevision | null>;
  };
  decisionRevisions: {
    getDecisionContextRevisionById(id: string): Promise<unknown>;
  };
  bindings: {
    persistCareerDecisionContextDecisionRevisionBinding(
      value: CareerDecisionContextDecisionRevisionBinding,
    ): Promise<CareerDecisionContextDecisionRevisionBinding>;
  };
}

const fail = (code: string): never => { throw new Error(code); };
const admissionInvalid = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_ADMISSION_INVALID";
const persistenceFailed = "ERR_CAREER_DECISION_CONTEXT_DECISION_REVISION_BINDING_PERSISTENCE_FAILED";
const careerContextId = /^DCTXREV_[0-9A-F]{32}$/;
const genericRevisionId = /^DREV_[0-9A-F]{24}$/;

function canonicalTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) && Number.isFinite(Date.parse(value));
}

function captureInput(value: unknown): CareerDecisionContextDecisionRevisionBindingInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) return fail(admissionInvalid);
  const candidate = value as Record<string, unknown>;
  const keys = ["careerDecisionContextRevisionId", "decisionContextRevisionId", "createdAt"];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    typeof candidate.careerDecisionContextRevisionId !== "string" || !careerContextId.test(candidate.careerDecisionContextRevisionId) ||
    typeof candidate.decisionContextRevisionId !== "string" || !genericRevisionId.test(candidate.decisionContextRevisionId) ||
    !canonicalTimestamp(candidate.createdAt)
  ) return fail(admissionInvalid);
  return {
    careerDecisionContextRevisionId: candidate.careerDecisionContextRevisionId,
    decisionContextRevisionId: candidate.decisionContextRevisionId,
    createdAt: candidate.createdAt,
  };
}

function captureDependencies(value: unknown): CareerDecisionContextDecisionRevisionBindingAdmissionDependencies {
  const candidate = value as CareerDecisionContextDecisionRevisionBindingAdmissionDependencies | null;
  if (
    !candidate || typeof candidate !== "object" || Array.isArray(candidate) ||
    typeof candidate.decisionContexts?.getCareerDecisionContextRevisionById !== "function" ||
    typeof candidate.decisionRevisions?.getDecisionContextRevisionById !== "function" ||
    typeof candidate.bindings?.persistCareerDecisionContextDecisionRevisionBinding !== "function"
  ) return fail(admissionInvalid);
  return candidate;
}

/**
 * Deterministically binds one exact Career decision context to one exact
 * generic Decision Context revision and persists the witness. It does not
 * declare a decision, select a revision, or confer authority on either side.
 */
export async function bindAndPersistCareerDecisionContextDecisionRevision(
  input: CareerDecisionContextDecisionRevisionBindingInput,
  dependencies: CareerDecisionContextDecisionRevisionBindingAdmissionDependencies,
): Promise<CareerDecisionContextDecisionRevisionBinding> {
  const request = captureInput(input);
  const services = captureDependencies(dependencies);
  const binder = createBoundCareerDecisionContextDecisionRevisionBinder(
    { getCareerDecisionContextRevisionById: async (id: string) => services.decisionContexts.getCareerDecisionContextRevisionById(id) },
    { getDecisionContextRevisionById: async (id: string) => services.decisionRevisions.getDecisionContextRevisionById(id) },
  );
  const expected = await binder.bind(request);
  const persisted = await services.bindings.persistCareerDecisionContextDecisionRevisionBinding(expected);
  try {
    assertCareerDecisionContextDecisionRevisionBinding(persisted);
  } catch {
    return fail(persistenceFailed);
  }
  if (stableCareerDecisionContextDecisionRevisionBinding(persisted) !== stableCareerDecisionContextDecisionRevisionBinding(expected)) {
    return fail(persistenceFailed);
  }
  return structuredClone(persisted);
}
