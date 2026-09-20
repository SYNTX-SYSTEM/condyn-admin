import {
  assertCareerActionStateChangeAssociationDeclaration,
  createCareerActionStateChangeAssociationDeclaration,
  stableCareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclaration,
  type CareerActionStateChangeAssociationDeclarationInput,
} from "../relation/action-state-change-association-declaration";
import {
  assertCareerStateChangeDeclaration,
  type CareerStateChangeDeclaration,
} from "../relation/state-change-declaration";

export interface CareerActionStateChangeAssociationAdmissionDependencies {
  stateChanges: {
    getCareerStateChangeDeclarationById(
      id: string,
    ): Promise<CareerStateChangeDeclaration | null>;
  };
  associations: {
    persistCareerActionStateChangeAssociationDeclaration(
      value: CareerActionStateChangeAssociationDeclaration,
    ): Promise<CareerActionStateChangeAssociationDeclaration>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerActionStateChangeAssociationDeclarationInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerStateChangeDeclarationId",
    "declaredByActorId",
    "declaredAt",
    "associationEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerStateChangeDeclarationId) ||
    typeof candidate.declaredByActorId !== "string"
  ) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerActionStateChangeAssociationDeclarationInput;
}

function captureDependencies(value: unknown): CareerActionStateChangeAssociationAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerActionStateChangeAssociationAdmissionDependencies).stateChanges?.getCareerStateChangeDeclarationById !== "function" ||
    typeof (value as CareerActionStateChangeAssociationAdmissionDependencies).associations?.persistCareerActionStateChangeAssociationDeclaration !== "function"
  ) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_ADMISSION_INVALID");
  }
  return value as CareerActionStateChangeAssociationAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit association declaration.
 * It does not establish relation truth, effect, outcome, or causal authority.
 */
export async function admitAndPersistCareerActionStateChangeAssociationDeclaration(
  input: CareerActionStateChangeAssociationDeclarationInput,
  admittedActorId: string,
  dependencies: CareerActionStateChangeAssociationAdmissionDependencies,
): Promise<CareerActionStateChangeAssociationDeclaration> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_ADMISSION_INVALID");
  }

  const stateChange = await services.stateChanges.getCareerStateChangeDeclarationById(
    declaration.careerStateChangeDeclarationId,
  );
  if (stateChange === null) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_STATE_CHANGE_NOT_FOUND");
  }
  try {
    assertCareerStateChangeDeclaration(stateChange);
  } catch {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_STATE_CHANGE_INVALID");
  }

  const expected = createCareerActionStateChangeAssociationDeclaration(stateChange, declaration);
  if (admittedActorId !== expected.declaredByActorId) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_DECLARANT_MISMATCH");
  }

  const persisted = await services.associations.persistCareerActionStateChangeAssociationDeclaration(expected);
  try {
    assertCareerActionStateChangeAssociationDeclaration(persisted);
  } catch {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
  }
  if (
    stableCareerActionStateChangeAssociationDeclaration(persisted) !==
    stableCareerActionStateChangeAssociationDeclaration(expected)
  ) {
    return fail("ERR_CAREER_ACTION_STATE_CHANGE_ASSOCIATION_DECLARATION_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
