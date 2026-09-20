import {
  assertCareerOutcomeValenceFeedbackReturnRepresentation,
  createCareerOutcomeValenceFeedbackReturnRepresentation,
  type CareerOutcomeValenceFeedbackReturnRepresentation,
  type CareerOutcomeValenceFeedbackReturnRepresentationInput,
} from "../relation/outcome-valence-feedback-return-representation";
import {
  assertCareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBinding,
} from "../relation/outcome-valence-feedback-target-revision-binding";

export interface CareerOutcomeValenceFeedbackReturnRepresentationAdmissionInput
extends CareerOutcomeValenceFeedbackReturnRepresentationInput {
  careerOutcomeValenceFeedbackTargetRevisionBindingId: string;
}

export interface CareerOutcomeValenceFeedbackReturnRepresentationAdmissionDependencies {
  bindings: {
    getCareerOutcomeValenceFeedbackTargetRevisionBindingById(
      id: string,
    ): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding | null>;
  };
}

const fail = (code: string): never => { throw new Error(code); };
const bindingId = /^COVFTRB_[0-9A-F]{32}$/;

function canonicalTimestamp(value: unknown): value is string {
  return typeof value === "string" && value.trim() === value &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function captureInput(
  value: unknown,
): CareerOutcomeValenceFeedbackReturnRepresentationAdmissionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = ["careerOutcomeValenceFeedbackTargetRevisionBindingId", "createdAt"];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !bindingId.test(candidate.careerOutcomeValenceFeedbackTargetRevisionBindingId as string) ||
    !canonicalTimestamp(candidate.createdAt)
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ADMISSION_INVALID");
  }
  return candidate as CareerOutcomeValenceFeedbackReturnRepresentationAdmissionInput;
}

function captureDependencies(
  value: unknown,
): CareerOutcomeValenceFeedbackReturnRepresentationAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerOutcomeValenceFeedbackReturnRepresentationAdmissionDependencies)
      .bindings?.getCareerOutcomeValenceFeedbackTargetRevisionBindingById !== "function"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_ADMISSION_INVALID");
  }
  return value as CareerOutcomeValenceFeedbackReturnRepresentationAdmissionDependencies;
}

/**
 * Deterministically represents exact COVFTRB history for a later return-item boundary.
 * It neither delivers feedback nor changes the bound target or any historical operand.
 */
export async function createCareerOutcomeValenceFeedbackReturnRepresentationFromExactBinding(
  input: CareerOutcomeValenceFeedbackReturnRepresentationAdmissionInput,
  dependencies: CareerOutcomeValenceFeedbackReturnRepresentationAdmissionDependencies,
): Promise<CareerOutcomeValenceFeedbackReturnRepresentation> {
  const request = captureInput(input);
  const services = captureDependencies(dependencies);
  const binding = await services.bindings.getCareerOutcomeValenceFeedbackTargetRevisionBindingById(
    request.careerOutcomeValenceFeedbackTargetRevisionBindingId,
  );
  if (binding === null) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_TARGET_REVISION_BINDING_NOT_FOUND");
  }
  try {
    assertCareerOutcomeValenceFeedbackTargetRevisionBinding(binding);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_TARGET_REVISION_BINDING_INVALID");
  }

  const representation = createCareerOutcomeValenceFeedbackReturnRepresentation(
    binding,
    { createdAt: request.createdAt },
  );
  try {
    assertCareerOutcomeValenceFeedbackReturnRepresentation(representation);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_REPRESENTATION_INVALID");
  }
  return structuredClone(representation);
}
