import {
  createCareerOutcomeValenceFeedbackContextRevision,
} from "../../../../lib/career/relation/outcome-valence-feedback-context-revision";
import { createT13GHistoricalFixture } from "../outcome-valence-feedback-context-revision/t13g-historical-fixture";

/** Builds only sealed predecessor witnesses; persistence and repository existence are deliberately absent. */
export async function createT13HHistoricalFixture() {
  const predecessor = await createT13GHistoricalFixture();
  const firstRevision = createCareerOutcomeValenceFeedbackContextRevision(
    predecessor.firstParent,
    predecessor.first,
    { createdAt: "2027-02-16T01:00:00.000Z" },
  );
  const subsequentParent = {
    parentRevisionKind: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION" as const,
    parentRevisionId: firstRevision.careerOutcomeValenceFeedbackContextRevisionId,
    parentFeedbackContextContent: structuredClone(predecessor.contentX),
  };
  const subsequentRevision = createCareerOutcomeValenceFeedbackContextRevision(
    subsequentParent,
    predecessor.subsequent,
    { createdAt: "2027-02-16T01:00:01.000Z" },
  );
  const branchRevision = createCareerOutcomeValenceFeedbackContextRevision(
    predecessor.firstParent,
    predecessor.firstAlternate,
    { createdAt: "2027-02-16T01:00:02.000Z" },
  );
  const firstRevisionLaterAudit = createCareerOutcomeValenceFeedbackContextRevision(
    predecessor.firstParent,
    predecessor.first,
    { createdAt: "2027-02-16T01:00:03.000Z" },
  );
  const baseLaterAudit = {
    ...structuredClone(predecessor.base),
    createdAt: "2027-02-14T00:00:09.000Z",
  };
  const contentLaterAudit = {
    ...structuredClone(predecessor.contentX),
    createdAt: "2027-02-14T00:00:09.000Z",
  };

  return {
    ...predecessor,
    firstRevision,
    subsequentParent,
    subsequentRevision,
    branchRevision,
    firstRevisionLaterAudit,
    baseLaterAudit,
    contentLaterAudit,
  };
}
