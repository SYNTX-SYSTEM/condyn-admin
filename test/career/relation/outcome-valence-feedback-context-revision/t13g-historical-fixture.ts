import {
  createCareerOutcomeValenceFeedbackContextTransition,
} from "../../../../lib/career/relation/outcome-valence-feedback-context-transition";
import { createT13FHistoricalFixture } from "../outcome-valence-feedback-context-transition/t13f-historical-fixture";

/** Builds sealed base, content, and append-one transition witnesses for bounded revision-lineage evidence. */
export async function createT13GHistoricalFixture() {
  const predecessor = await createT13FHistoricalFixture();
  const base = structuredClone(predecessor.baseCareerDecisionContextRevision);
  const alternateBase = structuredClone(predecessor.alternateBaseCareerDecisionContextRevision);
  const first = createCareerOutcomeValenceFeedbackContextTransition(
    base,
    null,
    predecessor.x,
    predecessor.contentX,
    { createdAt: "2027-02-15T01:00:00.000Z" },
  );
  const firstAlternate = createCareerOutcomeValenceFeedbackContextTransition(
    base,
    null,
    predecessor.y,
    predecessor.contentY,
    { createdAt: "2027-02-15T01:00:01.000Z" },
  );
  const subsequent = createCareerOutcomeValenceFeedbackContextTransition(
    base,
    predecessor.contentX,
    predecessor.y,
    predecessor.contentXY,
    { createdAt: "2027-02-15T01:00:02.000Z" },
  );
  const subsequentAlternate = createCareerOutcomeValenceFeedbackContextTransition(
    base,
    predecessor.contentY,
    predecessor.x,
    predecessor.contentXY,
    { createdAt: "2027-02-15T01:00:03.000Z" },
  );
  const otherBaseFirst = createCareerOutcomeValenceFeedbackContextTransition(
    alternateBase,
    null,
    predecessor.z,
    predecessor.contentZ,
    { createdAt: "2027-02-15T01:00:04.000Z" },
  );

  return {
    ...predecessor,
    base,
    alternateBase,
    first,
    firstAlternate,
    subsequent,
    subsequentAlternate,
    otherBaseFirst,
    firstParent: {
      parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION" as const,
      parentRevisionId: base.careerDecisionContextRevisionId,
    },
    subsequentParent: {
      parentRevisionKind: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION" as const,
      parentRevisionId: "COVFCR_11111111111111111111111111111111",
      parentFeedbackContextContent: structuredClone(predecessor.contentX),
    },
    alternateSubsequentParent: {
      parentRevisionKind: "CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION" as const,
      parentRevisionId: "COVFCR_22222222222222222222222222222222",
      parentFeedbackContextContent: structuredClone(predecessor.contentY),
    },
    revisionInput: { createdAt: "2027-02-15T02:00:00.000Z" },
  };
}
