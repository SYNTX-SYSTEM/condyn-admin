import type { CareerDecisionContextRevision } from "../relation/decision-context";
import type { CareerOutcomeValenceFeedbackContextContent } from "../relation/outcome-valence-feedback-context-content";
import {
  assertCareerOutcomeValenceFeedbackContextTransition,
  createCareerOutcomeValenceFeedbackContextTransition,
  type CareerOutcomeValenceFeedbackContextTransition,
  type CareerOutcomeValenceFeedbackContextTransitionInput,
} from "../relation/outcome-valence-feedback-context-transition";
import type { CareerOutcomeValenceFeedbackReturnItem } from "../relation/outcome-valence-feedback-return-item";

/**
 * Constructs one sealed append-one context transition witness from exact
 * already-composed content; it does not construct a context revision.
 */
export function createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
  base: CareerDecisionContextRevision,
  previous: CareerOutcomeValenceFeedbackContextContent | null,
  added: CareerOutcomeValenceFeedbackReturnItem,
  result: CareerOutcomeValenceFeedbackContextContent,
  input: CareerOutcomeValenceFeedbackContextTransitionInput,
): CareerOutcomeValenceFeedbackContextTransition {
  const transition = createCareerOutcomeValenceFeedbackContextTransition(base, previous, added, result, input);
  assertCareerOutcomeValenceFeedbackContextTransition(transition);
  return structuredClone(transition);
}
