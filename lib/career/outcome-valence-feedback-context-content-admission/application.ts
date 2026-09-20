import type { CareerDecisionContextRevision } from "../relation/decision-context";
import {
  assertCareerOutcomeValenceFeedbackContextContent,
  createCareerOutcomeValenceFeedbackContextContent,
  type CareerOutcomeValenceFeedbackContextContent,
  type CareerOutcomeValenceFeedbackContextContentInput,
} from "../relation/outcome-valence-feedback-context-content";
import type { CareerOutcomeValenceFeedbackReturnItem } from "../relation/outcome-valence-feedback-return-item";

/** Pure canonical composition of an exact base context with nonempty return-item history. */
export function createCareerOutcomeValenceFeedbackContextContentFromExactItems(
  base: CareerDecisionContextRevision,
  items: readonly CareerOutcomeValenceFeedbackReturnItem[],
  input: CareerOutcomeValenceFeedbackContextContentInput,
): CareerOutcomeValenceFeedbackContextContent {
  const content = createCareerOutcomeValenceFeedbackContextContent(base, items, input);
  assertCareerOutcomeValenceFeedbackContextContent(content);
  return structuredClone(content);
}
