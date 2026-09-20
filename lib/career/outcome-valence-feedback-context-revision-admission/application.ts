import {
  assertCareerOutcomeValenceFeedbackContextRevision,
  createCareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextParent,
  type CareerOutcomeValenceFeedbackContextRevision,
  type CareerOutcomeValenceFeedbackContextRevisionInput,
} from "../relation/outcome-valence-feedback-context-revision";
import type { CareerOutcomeValenceFeedbackContextTransition } from "../relation/outcome-valence-feedback-context-transition";

/**
 * Constructs one sealed feedback-context revision envelope from explicit
 * typed lineage and an exact transition; it does not persist or activate it.
 */
export function createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
  parent: CareerOutcomeValenceFeedbackContextParent,
  transition: CareerOutcomeValenceFeedbackContextTransition,
  input: CareerOutcomeValenceFeedbackContextRevisionInput,
): CareerOutcomeValenceFeedbackContextRevision {
  const revision = createCareerOutcomeValenceFeedbackContextRevision(parent, transition, input);
  assertCareerOutcomeValenceFeedbackContextRevision(revision);
  return structuredClone(revision);
}
