import {
  assertCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclaration,
} from "../relation/outcome-role-declaration";
import {
  assertCareerOutcomeValenceDeclaration,
  createCareerOutcomeValenceDeclaration,
  stableCareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclaration,
  type CareerOutcomeValenceDeclarationInput,
} from "../relation/outcome-valence-declaration";

export interface CareerOutcomeValenceAdmissionDependencies {
  outcomeRoles: {
    getCareerOutcomeRoleDeclarationById(
      id: string,
    ): Promise<CareerOutcomeRoleDeclaration | null>;
  };
  outcomeValences: {
    persistCareerOutcomeValenceDeclaration(
      value: CareerOutcomeValenceDeclaration,
    ): Promise<CareerOutcomeValenceDeclaration>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerOutcomeValenceDeclarationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerOutcomeRoleDeclarationId",
    "declaredByActorId",
    "declaredAt",
    "valence",
    "valenceEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerOutcomeRoleDeclarationId) ||
    typeof candidate.declaredByActorId !== "string"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerOutcomeValenceDeclarationInput;
}

function captureDependencies(value: unknown): CareerOutcomeValenceAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerOutcomeValenceAdmissionDependencies).outcomeRoles?.getCareerOutcomeRoleDeclarationById !== "function" ||
    typeof (value as CareerOutcomeValenceAdmissionDependencies).outcomeValences?.persistCareerOutcomeValenceDeclaration !== "function"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_ADMISSION_INVALID");
  }
  return value as CareerOutcomeValenceAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit outcome-valence declaration.
 * It does not establish success, effectiveness, causality, or feedback.
 */
export async function admitAndPersistCareerOutcomeValenceDeclaration(
  input: CareerOutcomeValenceDeclarationInput,
  admittedActorId: string,
  dependencies: CareerOutcomeValenceAdmissionDependencies,
): Promise<CareerOutcomeValenceDeclaration> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_ADMISSION_INVALID");
  }

  const outcomeRole = await services.outcomeRoles.getCareerOutcomeRoleDeclarationById(
    declaration.careerOutcomeRoleDeclarationId,
  );
  if (outcomeRole === null) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_OUTCOME_ROLE_NOT_FOUND");
  }
  try {
    assertCareerOutcomeRoleDeclaration(outcomeRole);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_OUTCOME_ROLE_INVALID");
  }

  const expected = createCareerOutcomeValenceDeclaration(outcomeRole, declaration);
  if (admittedActorId !== expected.declaredByActorId) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_DECLARANT_MISMATCH");
  }

  const persisted = await services.outcomeValences.persistCareerOutcomeValenceDeclaration(expected);
  try {
    assertCareerOutcomeValenceDeclaration(persisted);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
  }
  if (stableCareerOutcomeValenceDeclaration(persisted) !== stableCareerOutcomeValenceDeclaration(expected)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_DECLARATION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
