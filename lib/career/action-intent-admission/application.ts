import {
  assertCareerDecisionActionIntent,
  createCareerDecisionActionIntent,
  stableCareerDecisionActionIntent,
  type CareerDecisionActionIntent,
  type CareerDecisionActionIntentInput,
} from "../relation/action-intent";
import {
  assertHumanDecisionRecord,
  type HumanDecisionRecord,
} from "../relation/decision-record";

export interface CareerDecisionActionIntentAdmissionDependencies {
  records: {
    getHumanDecisionRecordById(id: string): Promise<HumanDecisionRecord | null>;
  };
  intents: {
    persistCareerDecisionActionIntent(value: CareerDecisionActionIntent): Promise<CareerDecisionActionIntent>;
  };
}

const fail = (code: string): never => { throw new Error(code); };

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function captureDeclaration(value: unknown): CareerDecisionActionIntentInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = [
    "humanDecisionRecordId",
    "declaredByActorId",
    "actionIntentClass",
    "operationDescription",
    "declaredAt",
    "actionIntentEvidenceRefs",
    "createdAt",
  ];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !canonicalText(candidate.humanDecisionRecordId) ||
    !canonicalText(candidate.declaredByActorId)
  ) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_ADMISSION_INVALID");
  }
  return candidate as unknown as CareerDecisionActionIntentInput;
}

function captureDependencies(value: unknown): CareerDecisionActionIntentAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerDecisionActionIntentAdmissionDependencies).records?.getHumanDecisionRecordById !== "function" ||
    typeof (value as CareerDecisionActionIntentAdmissionDependencies).intents?.persistCareerDecisionActionIntent !== "function"
  ) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_ADMISSION_INVALID");
  }
  return value as CareerDecisionActionIntentAdmissionDependencies;
}

/**
 * Admits an already-established actor's explicit operationalization declaration.
 * It neither establishes actor identity nor derives human content from the DCR.
 */
export async function admitAndPersistCareerDecisionActionIntent(
  input: CareerDecisionActionIntentInput,
  admittedActorId: string,
  dependencies: CareerDecisionActionIntentAdmissionDependencies,
): Promise<CareerDecisionActionIntent> {
  const declaration = captureDeclaration(input);
  const services = captureDependencies(dependencies);
  if (!canonicalText(admittedActorId)) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_ADMISSION_INVALID");
  }

  const record = await services.records.getHumanDecisionRecordById(declaration.humanDecisionRecordId);
  if (record === null) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_HUMAN_DECISION_RECORD_NOT_FOUND");
  }
  try {
    assertHumanDecisionRecord(record);
  } catch {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_HUMAN_DECISION_RECORD_INVALID");
  }
  if (
    admittedActorId !== declaration.declaredByActorId ||
    declaration.declaredByActorId !== record.declarantActorId
  ) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_DECLARANT_MISMATCH");
  }

  const expected = createCareerDecisionActionIntent(record, declaration);
  const persisted = await services.intents.persistCareerDecisionActionIntent(expected);
  try {
    assertCareerDecisionActionIntent(persisted);
  } catch {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
  }
  if (stableCareerDecisionActionIntent(persisted) !== stableCareerDecisionActionIntent(expected)) {
    return fail("ERR_CAREER_DECISION_ACTION_INTENT_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
