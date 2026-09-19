import {
  assertCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
} from "../relation/execution-authority-grant";
import {
  assertCareerExecutionContextRevision,
  createCareerExecutionContextRevision,
  stableCareerExecutionContextRevision,
  type CareerExecutionContextRevision,
  type CareerExecutionContextRevisionInput,
} from "../relation/execution-context-revision";

export interface CareerExecutionContextAdmissionDependencies {
  grants: {
    getCareerExecutionAuthorityGrantRevisionById(
      id: string,
    ): Promise<CareerExecutionAuthorityGrantRevision | null>;
  };
  contexts: {
    persistCareerExecutionContextRevision(
      value: CareerExecutionContextRevision,
    ): Promise<CareerExecutionContextRevision>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerExecutionContextRevisionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerExecutionAuthorityGrantRevisionId",
    "declaredByActorId",
    "executionTarget",
    "executionChannel",
    "declaredAt",
    "contextEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerExecutionAuthorityGrantRevisionId) ||
    !canonicalText(candidate.declaredByActorId)
  ) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerExecutionContextRevisionInput;
}

function captureDependencies(value: unknown): CareerExecutionContextAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerExecutionContextAdmissionDependencies).grants?.getCareerExecutionAuthorityGrantRevisionById !== "function" ||
    typeof (value as CareerExecutionContextAdmissionDependencies).contexts?.persistCareerExecutionContextRevision !== "function"
  ) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_ADMISSION_INVALID");
  }
  return value as CareerExecutionContextAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit execution-context declaration.
 * It neither establishes actor identity nor turns authority into an occurrence.
 */
export async function admitAndPersistCareerExecutionContextRevision(
  input: CareerExecutionContextRevisionInput,
  admittedActorId: string,
  dependencies: CareerExecutionContextAdmissionDependencies,
): Promise<CareerExecutionContextRevision> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_ADMISSION_INVALID");
  }

  const authority = await services.grants.getCareerExecutionAuthorityGrantRevisionById(
    declaration.careerExecutionAuthorityGrantRevisionId,
  );
  if (authority === null) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_AUTHORITY_NOT_FOUND");
  }
  try {
    assertCareerExecutionAuthorityGrantRevision(authority);
  } catch {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_AUTHORITY_INVALID");
  }
  if (
    admittedActorId !== declaration.declaredByActorId ||
    declaration.declaredByActorId !== authority.authorizedExecutionActorId
  ) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_DECLARANT_MISMATCH");
  }

  const expected = createCareerExecutionContextRevision(authority, declaration);
  const persisted = await services.contexts.persistCareerExecutionContextRevision(expected);
  try {
    assertCareerExecutionContextRevision(persisted);
  } catch {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
  }
  if (
    stableCareerExecutionContextRevision(persisted) !==
    stableCareerExecutionContextRevision(expected)
  ) {
    return fail("ERR_CAREER_EXECUTION_CONTEXT_REVISION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
