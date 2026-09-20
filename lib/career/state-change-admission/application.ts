import {
  assertCareerActionOccurrence,
  type CareerActionOccurrence,
} from "../relation/action-occurrence";
import {
  assertCareerStateChangeDeclaration,
  createCareerStateChangeDeclaration,
  stableCareerStateChangeDeclaration,
  type CareerStateChangeDeclaration,
  type CareerStateChangeDeclarationInput,
} from "../relation/state-change-declaration";

export interface CareerStateChangeAdmissionDependencies {
  occurrences: {
    getCareerActionOccurrenceById(id: string): Promise<CareerActionOccurrence | null>;
  };
  stateChanges: {
    persistCareerStateChangeDeclaration(
      value: CareerStateChangeDeclaration,
    ): Promise<CareerStateChangeDeclaration>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerStateChangeDeclarationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerActionOccurrenceId",
    "observedByActorId",
    "stateSubject",
    "stateDimension",
    "beforeObservation",
    "afterObservation",
    "observedAt",
    "stateChangeEvidenceRefs",
    "externalStateRef",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerActionOccurrenceId) ||
    !canonicalText(candidate.observedByActorId)
  ) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerStateChangeDeclarationInput;
}

function captureDependencies(value: unknown): CareerStateChangeAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerStateChangeAdmissionDependencies).occurrences?.getCareerActionOccurrenceById !== "function" ||
    typeof (value as CareerStateChangeAdmissionDependencies).stateChanges?.persistCareerStateChangeDeclaration !== "function"
  ) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_ADMISSION_INVALID");
  }
  return value as CareerStateChangeAdmissionDependencies;
}

/**
 * Admits an already-established observer's explicit state-difference declaration.
 * It neither establishes identity nor turns a state difference into association.
 */
export async function admitAndPersistCareerStateChangeDeclaration(
  input: CareerStateChangeDeclarationInput,
  admittedActorId: string,
  dependencies: CareerStateChangeAdmissionDependencies,
): Promise<CareerStateChangeDeclaration> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_ADMISSION_INVALID");
  }

  const occurrence = await services.occurrences.getCareerActionOccurrenceById(
    declaration.careerActionOccurrenceId,
  );
  if (occurrence === null) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_OCCURRENCE_NOT_FOUND");
  }
  try {
    assertCareerActionOccurrence(occurrence);
  } catch {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_OCCURRENCE_INVALID");
  }
  if (admittedActorId !== declaration.observedByActorId) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_OBSERVER_MISMATCH");
  }

  const expected = createCareerStateChangeDeclaration(occurrence, declaration);
  const persisted = await services.stateChanges.persistCareerStateChangeDeclaration(expected);
  try {
    assertCareerStateChangeDeclaration(persisted);
  } catch {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
  }
  if (
    stableCareerStateChangeDeclaration(persisted) !==
    stableCareerStateChangeDeclaration(expected)
  ) {
    return fail("ERR_CAREER_STATE_CHANGE_DECLARATION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
