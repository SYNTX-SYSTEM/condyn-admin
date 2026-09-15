import type { CareerDecisionContextRevision } from "../decision-context";
import type { CareerOutcomeValenceFeedbackContextRevision } from "../outcome-valence-feedback-context-revision";

/**
 * Repository-abstract replay reads only. A parent reference is not parent
 * existence, and replay never selects a current revision or a sole child.
 */
export interface CareerOutcomeValenceFeedbackContextRevisionReplayDependencies {
  getCareerDecisionContextRevisionById(
    revisionId: string,
  ): Promise<CareerDecisionContextRevision | null>;
  getCareerOutcomeValenceFeedbackContextRevisionById(
    revisionId: string,
  ): Promise<CareerOutcomeValenceFeedbackContextRevision | null>;
}
