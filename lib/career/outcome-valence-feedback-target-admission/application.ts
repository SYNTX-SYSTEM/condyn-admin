import {
  assertCareerOutcomeValenceFeedbackAdmissionDeclaration,
  type CareerOutcomeValenceFeedbackAdmissionDeclaration,
} from "../relation/outcome-valence-feedback-admission-declaration";
import {
  assertCareerOutcomeValenceFeedbackTargetDeclaration,
  createCareerOutcomeValenceFeedbackTargetDeclaration,
  stableCareerOutcomeValenceFeedbackTargetDeclaration,
  type CareerOutcomeValenceFeedbackTargetDeclaration,
  type CareerOutcomeValenceFeedbackTargetDeclarationInput,
} from "../relation/outcome-valence-feedback-target-declaration";

export interface CareerOutcomeValenceFeedbackTargetAdmissionDependencies {
  admissions: {
    getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
      id: string,
    ): Promise<CareerOutcomeValenceFeedbackAdmissionDeclaration | null>;
  };
  targets: {
    persistCareerOutcomeValenceFeedbackTargetDeclaration(
      value: CareerOutcomeValenceFeedbackTargetDeclaration,
    ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerOutcomeValenceFeedbackTargetDeclarationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerOutcomeValenceFeedbackAdmissionDeclarationId",
    "targetCareerDecisionContextRevisionId",
    "declaredByActorId",
    "declaredAt",
    "targetSelectionEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerOutcomeValenceFeedbackAdmissionDeclarationId) ||
    typeof candidate.declaredByActorId !== "string"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerOutcomeValenceFeedbackTargetDeclarationInput;
}

function captureDependencies(value: unknown): CareerOutcomeValenceFeedbackTargetAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerOutcomeValenceFeedbackTargetAdmissionDependencies).admissions
      ?.getCareerOutcomeValenceFeedbackAdmissionDeclarationById !== "function" ||
    typeof (value as CareerOutcomeValenceFeedbackTargetAdmissionDependencies).targets
      ?.persistCareerOutcomeValenceFeedbackTargetDeclaration !== "function"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
  }
  return value as CareerOutcomeValenceFeedbackTargetAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit feedback target declaration.
 * It neither binds the target revision nor delivers feedback or mutates the target.
 */
export async function admitAndPersistCareerOutcomeValenceFeedbackTargetDeclaration(
  input: CareerOutcomeValenceFeedbackTargetDeclarationInput,
  admittedActorId: string,
  dependencies: CareerOutcomeValenceFeedbackTargetAdmissionDependencies,
): Promise<CareerOutcomeValenceFeedbackTargetDeclaration> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
  }

  const admission = await services.admissions
    .getCareerOutcomeValenceFeedbackAdmissionDeclarationById(
      declaration.careerOutcomeValenceFeedbackAdmissionDeclarationId,
    );
  if (admission === null) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_NOT_FOUND");
  }
  try {
    assertCareerOutcomeValenceFeedbackAdmissionDeclaration(admission);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_ADMISSION_INVALID");
  }

  const expected = createCareerOutcomeValenceFeedbackTargetDeclaration(admission, declaration);
  if (admittedActorId !== expected.declaredByActorId) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_DECLARANT_MISMATCH");
  }

  const persisted = await services.targets.persistCareerOutcomeValenceFeedbackTargetDeclaration(expected);
  try {
    assertCareerOutcomeValenceFeedbackTargetDeclaration(persisted);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED");
  }
  if (
    stableCareerOutcomeValenceFeedbackTargetDeclaration(persisted) !==
    stableCareerOutcomeValenceFeedbackTargetDeclaration(expected)
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_DECLARATION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
