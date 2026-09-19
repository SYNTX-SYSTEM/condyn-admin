import {
  assertCareerDecisionActionIntent,
  type CareerDecisionActionIntent,
} from "../relation/action-intent";
import {
  assertCareerHumanCommitment,
  createCareerHumanCommitment,
  stableCareerHumanCommitment,
  type CareerHumanCommitment,
  type CareerHumanCommitmentInput,
} from "../relation/human-commitment";

export interface CareerHumanCommitmentAdmissionDependencies {
  intents: {
    getCareerDecisionActionIntentById(id: string): Promise<CareerDecisionActionIntent | null>;
  };
  commitments: {
    persistCareerHumanCommitment(value: CareerHumanCommitment): Promise<CareerHumanCommitment>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerHumanCommitmentInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "careerDecisionActionIntentId",
    "committedByActorId",
    "committedAt",
    "commitmentEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.careerDecisionActionIntentId) ||
    !canonicalText(candidate.committedByActorId)
  ) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerHumanCommitmentInput;
}

function captureDependencies(value: unknown): CareerHumanCommitmentAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerHumanCommitmentAdmissionDependencies).intents?.getCareerDecisionActionIntentById !== "function" ||
    typeof (value as CareerHumanCommitmentAdmissionDependencies).commitments?.persistCareerHumanCommitment !== "function"
  ) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ADMISSION_INVALID");
  }
  return value as CareerHumanCommitmentAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit commitment declaration.
 * It neither establishes actor identity nor derives a commitment from DAINT.
 */
export async function admitAndPersistCareerHumanCommitment(
  input: CareerHumanCommitmentInput,
  admittedActorId: string,
  dependencies: CareerHumanCommitmentAdmissionDependencies,
): Promise<CareerHumanCommitment> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ADMISSION_INVALID");
  }

  const actionIntent = await services.intents.getCareerDecisionActionIntentById(
    declaration.careerDecisionActionIntentId,
  );
  if (actionIntent === null) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ACTION_INTENT_NOT_FOUND");
  }
  try {
    assertCareerDecisionActionIntent(actionIntent);
  } catch {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ACTION_INTENT_INVALID");
  }
  if (
    admittedActorId !== declaration.committedByActorId ||
    declaration.committedByActorId !== actionIntent.declaredByActorId
  ) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_ACTOR_MISMATCH");
  }

  const expected = createCareerHumanCommitment(actionIntent, declaration);
  const persisted = await services.commitments.persistCareerHumanCommitment(expected);
  try {
    assertCareerHumanCommitment(persisted);
  } catch {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
  }
  if (stableCareerHumanCommitment(persisted) !== stableCareerHumanCommitment(expected)) {
    return fail("ERR_CAREER_HUMAN_COMMITMENT_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
