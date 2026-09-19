import {
  assertCareerExecutionAuthorityGrantRevision,
  createCareerExecutionAuthorityGrantRevision,
  stableCareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevision,
  type CareerExecutionAuthorityGrantRevisionInput,
} from "../relation/execution-authority-grant";
import {
  assertCareerHumanCommitment,
  type CareerHumanCommitment,
} from "../relation/human-commitment";

export interface CareerExecutionAuthorityGrantAdmissionDependencies {
  commitments: {
    getCareerHumanCommitmentById(id: string): Promise<CareerHumanCommitment | null>;
  };
  grants: {
    persistCareerExecutionAuthorityGrantRevision(
      value: CareerExecutionAuthorityGrantRevision,
    ): Promise<CareerExecutionAuthorityGrantRevision>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerExecutionAuthorityGrantRevisionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerHumanCommitmentId",
    "grantorActorId",
    "authorizedExecutionActorId",
    "executionAuthorityScope",
    "permittedTargetKinds",
    "permittedChannelKinds",
    "authorityEvidenceRefs",
    "declaredAt",
    "effectiveFrom",
    "effectiveUntil",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerHumanCommitmentId) ||
    !canonicalText(candidate.grantorActorId)
  ) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerExecutionAuthorityGrantRevisionInput;
}

function captureDependencies(value: unknown): CareerExecutionAuthorityGrantAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerExecutionAuthorityGrantAdmissionDependencies).commitments?.getCareerHumanCommitmentById !== "function" ||
    typeof (value as CareerExecutionAuthorityGrantAdmissionDependencies).grants?.persistCareerExecutionAuthorityGrantRevision !== "function"
  ) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_ADMISSION_INVALID");
  }
  return value as CareerExecutionAuthorityGrantAdmissionDependencies;
}

/**
 * Admits an already-established grantor's explicit execution-authority declaration.
 * It neither establishes actor identity nor derives authority from commitment.
 */
export async function admitAndPersistCareerExecutionAuthorityGrantRevision(
  input: CareerExecutionAuthorityGrantRevisionInput,
  admittedActorId: string,
  dependencies: CareerExecutionAuthorityGrantAdmissionDependencies,
): Promise<CareerExecutionAuthorityGrantRevision> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_ADMISSION_INVALID");
  }

  const commitment = await services.commitments.getCareerHumanCommitmentById(
    declaration.careerHumanCommitmentId,
  );
  if (commitment === null) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_HUMAN_COMMITMENT_NOT_FOUND");
  }
  try {
    assertCareerHumanCommitment(commitment);
  } catch {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_HUMAN_COMMITMENT_INVALID");
  }
  if (admittedActorId !== declaration.grantorActorId) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_GRANTOR_MISMATCH");
  }

  const expected = createCareerExecutionAuthorityGrantRevision(commitment, declaration);
  const persisted = await services.grants.persistCareerExecutionAuthorityGrantRevision(expected);
  try {
    assertCareerExecutionAuthorityGrantRevision(persisted);
  } catch {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
  }
  if (
    stableCareerExecutionAuthorityGrantRevision(persisted) !==
    stableCareerExecutionAuthorityGrantRevision(expected)
  ) {
    return fail("ERR_CAREER_EXECUTION_AUTHORITY_GRANT_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
