import type { CareerDecisionContextRevision } from "../decision-context";
import type { CareerOutcomeValenceFeedbackContextRevision } from "../outcome-valence-feedback-context-revision";

/** Read-only feedback-revision repository surface; a parent reference is not parent existence. */
export interface CareerOutcomeValenceFeedbackContextRevisionRepository {
  getCareerOutcomeValenceFeedbackContextRevisionById(
    revisionId: string,
  ): Promise<CareerOutcomeValenceFeedbackContextRevision | null>;
}

/** Explicit heterogeneous immediate-parent readers plus an adapter-private immutable child write. */
export interface CareerOutcomeValenceFeedbackContextRevisionPersistenceDependencies {
  getCareerDecisionContextRevisionById(
    revisionId: string,
  ): Promise<CareerDecisionContextRevision | null>;
  getCareerOutcomeValenceFeedbackContextRevisionById(
    revisionId: string,
  ): Promise<CareerOutcomeValenceFeedbackContextRevision | null>;
  writeCareerOutcomeValenceFeedbackContextRevision(
    revision: CareerOutcomeValenceFeedbackContextRevision,
  ): Promise<void>;
}

export interface BoundCareerOutcomeValenceFeedbackContextRevisionPersister {
  persistCareerOutcomeValenceFeedbackContextRevision(
    revision: CareerOutcomeValenceFeedbackContextRevision,
  ): Promise<CareerOutcomeValenceFeedbackContextRevision>;
}
