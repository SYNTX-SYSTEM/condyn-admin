import type { CareerDecisionContextRevision } from "../relation/decision-context";
import {
  assertCareerOutcomeValenceFeedbackTargetDeclaration,
  type CareerOutcomeValenceFeedbackTargetDeclaration,
} from "../relation/outcome-valence-feedback-target-declaration";
import {
  assertCareerOutcomeValenceFeedbackTargetRevisionBinding,
  createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder,
  stableCareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBinding,
  type CareerOutcomeValenceFeedbackTargetRevisionBindingInput,
} from "../relation/outcome-valence-feedback-target-revision-binding";

export interface CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionInput
extends CareerOutcomeValenceFeedbackTargetRevisionBindingInput {
  careerOutcomeValenceFeedbackTargetDeclarationId: string;
}

export interface CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies {
  declarations: {
    getCareerOutcomeValenceFeedbackTargetDeclarationById(
      id: string,
    ): Promise<CareerOutcomeValenceFeedbackTargetDeclaration | null>;
  };
  decisionContexts: {
    getCareerDecisionContextRevisionById(
      id: string,
    ): Promise<CareerDecisionContextRevision | null>;
  };
  bindings: {
    persistCareerOutcomeValenceFeedbackTargetRevisionBinding(
      value: CareerOutcomeValenceFeedbackTargetRevisionBinding,
    ): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding>;
  };
}

const fail = (code: string): never => { throw new Error(code); };
const targetDeclarationId = /^COVFTD_[0-9A-F]{32}$/;

function canonicalText(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.trim() === value;
}

function canonicalTimestamp(value: unknown): value is string {
  return canonicalText(value) &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value));
}

function captureInput(value: unknown): CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ADMISSION_INVALID");
  }
  const candidate = value as Record<string, unknown>;
  const keys = ["careerOutcomeValenceFeedbackTargetDeclarationId", "createdAt"];
  if (
    Object.keys(candidate).length !== keys.length ||
    keys.some(key => !Object.prototype.hasOwnProperty.call(candidate, key)) ||
    !targetDeclarationId.test(candidate.careerOutcomeValenceFeedbackTargetDeclarationId as string) ||
    !canonicalTimestamp(candidate.createdAt)
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ADMISSION_INVALID");
  }
  return candidate as CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionInput;
}

function captureDependencies(
  value: unknown,
): CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies {
  if (
    !value || typeof value !== "object" || Array.isArray(value) ||
    typeof (value as CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies)
      .declarations?.getCareerOutcomeValenceFeedbackTargetDeclarationById !== "function" ||
    typeof (value as CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies)
      .decisionContexts?.getCareerDecisionContextRevisionById !== "function" ||
    typeof (value as CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies)
      .bindings?.persistCareerOutcomeValenceFeedbackTargetRevisionBinding !== "function"
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_ADMISSION_INVALID");
  }
  return value as CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies;
}

/**
 * Deterministically binds the exact opaque target declared by COVFTD.
 * It does not alter the target or create feedback, delivery, mutation, or learning.
 */
export async function bindAndPersistCareerOutcomeValenceFeedbackTargetRevision(
  input: CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionInput,
  dependencies: CareerOutcomeValenceFeedbackTargetRevisionBindingAdmissionDependencies,
): Promise<CareerOutcomeValenceFeedbackTargetRevisionBinding> {
  const request = captureInput(input);
  const services = captureDependencies(dependencies);
  const declaration = await services.declarations
    .getCareerOutcomeValenceFeedbackTargetDeclarationById(
      request.careerOutcomeValenceFeedbackTargetDeclarationId,
    );
  if (declaration === null) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_DECLARATION_NOT_FOUND");
  }
  try {
    assertCareerOutcomeValenceFeedbackTargetDeclaration(declaration);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_TARGET_DECLARATION_INVALID");
  }

  const binder = createBoundCareerOutcomeValenceFeedbackTargetRevisionBinder({
    getCareerDecisionContextRevisionById: async (id: string) => {
      return await services.decisionContexts.getCareerDecisionContextRevisionById(id);
    },
  });
  const expected = await binder.bind(declaration, { createdAt: request.createdAt });
  const persisted = await services.bindings
    .persistCareerOutcomeValenceFeedbackTargetRevisionBinding(expected);
  try {
    assertCareerOutcomeValenceFeedbackTargetRevisionBinding(persisted);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED");
  }
  if (
    stableCareerOutcomeValenceFeedbackTargetRevisionBinding(persisted) !==
    stableCareerOutcomeValenceFeedbackTargetRevisionBinding(expected)
  ) {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_TARGET_REVISION_BINDING_PERSISTENCE_FAILED");
  }
  return structuredClone(persisted);
}
