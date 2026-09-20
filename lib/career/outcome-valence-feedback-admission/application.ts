import {
  assertCareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclaration,
} from "../relation/outcome-valence-declaration";
import {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration,
  createCareerOutcomeValenceFeedbackAdmissionDeclaration,
  stableCareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclarationInput,
} from "../relation/outcome-valence-feedback-admission-declaration";

export interface CareerOutcomeValenceFeedbackAdmissionDependencies {
  outcomeValences: {
    getCareerOutcomeValenceDeclarationById(
      id: string,
    ): Promise<CareerOutcomeValenceDeclaration | null>;
  };
  admissions: {
    persistCareerOutcomeValenceFeedbackAdmissionDeclaration(
      value: CareerOutcomeValenceFeedbackAdmissionDeclaration,
    ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerOutcomeValenceFeedbackAdmissionDeclarationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerOutcomeValenceDeclarationId",
    "admittedByActorId",
    "admittedAt",
    "admissionEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerOutcomeValenceDeclarationId) ||
    typeof candidate.admittedByActorId !== "string"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerOutcomeValenceFeedbackAdmissionDeclarationInput;
}

function captureDependencies(value: unknown): CareerOutcomeValenceFeedbackAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerOutcomeValenceFeedbackAdmissionDependencies).outcomeValences?.getCareerOutcomeValenceDeclarationById !== "function" ||
    typeof (value as CareerOutcomeValenceFeedbackAdmissionDependencies).admissions?.persistCareerOutcomeValenceFeedbackAdmissionDeclaration !== "function"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMISSION_INVALID");
  }
  return value as CareerOutcomeValenceFeedbackAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit valence-feedback admission history.
 * It does not select a target, create feedback, mutate context, or create learning.
 */
export async function admitAndPersistCareerOutcomeValenceFeedbackAdmissionDeclaration(
  input: CareerOutcomeValenceFeedbackAdmissionDeclarationInput,
  admittedActorId: string,
  dependencies: CareerOutcomeValenceFeedbackAdmissionDependencies,
): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMISSION_INVALID");
  }

  const outcomeValence = await services.outcomeValences.getCareerOutcomeValenceDeclarationById(
    declaration.careerOutcomeValenceDeclarationId,
  );
  if (outcomeValence === null) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_OUTCOME_VALENCE_NOT_FOUND");
  }
  try {
    assertCareerOutcomeValenceDeclaration(outcomeValence);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_OUTCOME_VALENCE_INVALID");
  }

  const expected = createCareerOutcomeValenceFeedbackAdmissionDeclaration(outcomeValence, declaration);
  if (admittedActorId !== expected.admittedByActorId) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_ADMITTER_MISMATCH");
  }

  const persisted = await services.admissions.persistCareerOutcomeValenceFeedbackAdmissionDeclaration(expected);
  try {
    assertCareerOutcomeValenceFeedbackAdmissionDeclaration(persisted);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
  }
  if (
    stableCareerOutcomeValenceFeedbackAdmissionDeclaration(persisted) !==
    stableCareerOutcomeValenceFeedbackAdmissionDeclaration(expected)
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_ADMISSION_DECLARATION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
