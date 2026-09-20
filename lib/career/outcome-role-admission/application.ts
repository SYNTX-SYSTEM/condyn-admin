import {
  assertCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration,
} from "../relation/action-state-change-association-declaration";
import {
  assertCareerOutcomeRoleDeclaration,
  createCareerOutcomeRoleDeclaration,
  stableCareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclaration,
  type CareerOutcomeRoleDeclarationInput,
} from "../relation/outcome-role-declaration";

export interface CareerOutcomeRoleAdmissionDependencies {
  associations: {
    getCareerActionStateChangeAssociationDeclarationById(
      id: string,
    ): Promise<CareerActionStateChangeAssociationDeclaration | null>;
  };
  outcomeRoles: {
    persistCareerOutcomeRoleDeclaration(
      value: CareerOutcomeRoleDeclaration,
    ): Promise<CareerOutcomeRoleDeclaration>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerOutcomeRoleDeclarationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerActionStateChangeAssociationDeclarationId",
    "declaredByActorId",
    "declaredAt",
    "outcomeRoleEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerActionStateChangeAssociationDeclarationId) ||
    typeof candidate.declaredByActorId !== "string"
  ) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerOutcomeRoleDeclarationInput;
}

function captureDependencies(value: unknown): CareerOutcomeRoleAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerOutcomeRoleAdmissionDependencies).associations?.getCareerActionStateChangeAssociationDeclarationById !== "function" ||
    typeof (value as CareerOutcomeRoleAdmissionDependencies).outcomeRoles?.persistCareerOutcomeRoleDeclaration !== "function"
  ) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ADMISSION_INVALID");
  }
  return value as CareerOutcomeRoleAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit outcome-role declaration.
 * It does not assign valence, establish causality, or create feedback.
 */
export async function admitAndPersistCareerOutcomeRoleDeclaration(
  input: CareerOutcomeRoleDeclarationInput,
  admittedActorId: string,
  dependencies: CareerOutcomeRoleAdmissionDependencies,
): Promise<CareerOutcomeRoleDeclaration> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ADMISSION_INVALID");
  }

  const association = await services.associations.getCareerActionStateChangeAssociationDeclarationById(
    declaration.careerActionStateChangeAssociationDeclarationId,
  );
  if (association === null) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ASSOCIATION_NOT_FOUND");
  }
  try {
    assertCareerActionStateChangeAssociationDeclaration(association);
  } catch {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_ASSOCIATION_INVALID");
  }

  const expected = createCareerOutcomeRoleDeclaration(association, declaration);
  if (admittedActorId !== expected.declaredByActorId) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_DECLARANT_MISMATCH");
  }

  const persisted = await services.outcomeRoles.persistCareerOutcomeRoleDeclaration(expected);
  try {
    assertCareerOutcomeRoleDeclaration(persisted);
  } catch {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
  }
  if (stableCareerOutcomeRoleDeclaration(persisted) !== stableCareerOutcomeRoleDeclaration(expected)) {
    return fail("ERR_CAREER_OUTCOME_ROLE_DECLARATION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
