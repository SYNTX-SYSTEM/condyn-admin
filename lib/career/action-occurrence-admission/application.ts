import {
  assertCareerActionOccurrence,
  createCareerActionOccurrence,
  stableCareerActionOccurrence,
  type CareerActionOccurrence,
  type CareerActionOccurrenceInput,
} from "../relation/action-occurrence";
import {
  assertCareerExecutionContextRevision,
  type CareerExecutionContextRevision,
} from "../relation/execution-context-revision";

export interface CareerActionOccurrenceAdmissionDependencies {
  contexts: {
    getCareerExecutionContextRevisionById(
      id: string,
    ): Promise<CareerExecutionContextRevision | null>;
  };
  occurrences: {
    persistCareerActionOccurrence(
      value: CareerActionOccurrence,
    ): Promise<CareerActionOccurrence>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerActionOccurrenceInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerExecutionContextRevisionId",
    "performedByActorId",
    "occurredAt",
    "occurrenceEvidenceRefs",
    "externalOccurrenceRef",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerExecutionContextRevisionId) ||
    !canonicalText(candidate.performedByActorId)
  ) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerActionOccurrenceInput;
}

function captureDependencies(value: unknown): CareerActionOccurrenceAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerActionOccurrenceAdmissionDependencies).contexts?.getCareerExecutionContextRevisionById !== "function" ||
    typeof (value as CareerActionOccurrenceAdmissionDependencies).occurrences?.persistCareerActionOccurrence !== "function"
  ) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_ADMISSION_INVALID");
  }
  return value as CareerActionOccurrenceAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit occurrence declaration.
 * It neither establishes identity nor infers a state change from occurrence.
 */
export async function admitAndPersistCareerActionOccurrence(
  input: CareerActionOccurrenceInput,
  admittedActorId: string,
  dependencies: CareerActionOccurrenceAdmissionDependencies,
): Promise<CareerActionOccurrence> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_ADMISSION_INVALID");
  }

  const context = await services.contexts.getCareerExecutionContextRevisionById(
    declaration.careerExecutionContextRevisionId,
  );
  if (context === null) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_CONTEXT_NOT_FOUND");
  }
  try {
    assertCareerExecutionContextRevision(context);
  } catch {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_CONTEXT_INVALID");
  }
  if (
    admittedActorId !== declaration.performedByActorId ||
    declaration.performedByActorId !== context.declaredByActorId
  ) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_PERFORMER_MISMATCH");
  }

  const expected = createCareerActionOccurrence(context, declaration);
  const persisted = await services.occurrences.persistCareerActionOccurrence(expected);
  try {
    assertCareerActionOccurrence(persisted);
  } catch {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
  }
  if (stableCareerActionOccurrence(persisted) !== stableCareerActionOccurrence(expected)) {
    return fail("ERR_CAREER_ACTION_OCCURRENCE_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
