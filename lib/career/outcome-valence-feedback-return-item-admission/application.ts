import {
  assertCareerOutcomeValenceFeedbackReturnRepresentation,
  type CareerOutcomeValenceFeedbackReturnRepresentation,
} from "../relation/outcome-valence-feedback-return-representation";
import {
  assertCareerOutcomeValenceFeedbackReturnItem,
  createCareerOutcomeValenceFeedbackReturnItem,
  type CareerOutcomeValenceFeedbackReturnItem,
  type CareerOutcomeValenceFeedbackReturnItemInput,
} from "../relation/outcome-valence-feedback-return-item";

const fail = (code: string): never => { throw new Error(code); };

/**
 * Deterministically wraps exact COVFRR for a later feedback-context boundary.
 * It neither delivers, consumes, evaluates, nor mutates feedback or context.
 */
export function createCareerOutcomeValenceFeedbackReturnItemFromRepresentation(
  representation: CareerOutcomeValenceFeedbackReturnRepresentation,
  input: CareerOutcomeValenceFeedbackReturnItemInput,
): CareerOutcomeValenceFeedbackReturnItem {
  try {
    assertCareerOutcomeValenceFeedbackReturnRepresentation(representation);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_REPRESENTATION_INVALID");
  }
  const item = createCareerOutcomeValenceFeedbackReturnItem(representation, input);
  try {
    assertCareerOutcomeValenceFeedbackReturnItem(item);
  } catch {
    return fail("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_INVALID");
  }
  return structuredClone(item);
}
