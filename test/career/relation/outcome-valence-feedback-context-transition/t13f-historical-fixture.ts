import {
  createCareerOutcomeValenceFeedbackContextContent,
} from "../../../../lib/career/relation/outcome-valence-feedback-context-content";
import {
  createCareerOutcomeValenceFeedbackReturnItem,
} from "../../../../lib/career/relation/outcome-valence-feedback-return-item";
import { createT13DHistoricalFixture } from "../outcome-valence-feedback-return-item/t13d-historical-fixture";
import { createT13EHistoricalFixture } from "../outcome-valence-feedback-context-content/t13e-historical-fixture";

/** Builds sealed complete operands for first and subsequent append-one transition evidence. */
export async function createT13FHistoricalFixture() {
  const primary = await createT13EHistoricalFixture("DESIRABLE");
  const neutral = await createT13EHistoricalFixture("NEUTRAL");
  const otherBase = await createT13DHistoricalFixture("DESIRABLE", true);
  const baseCareerDecisionContextRevision = structuredClone(primary.baseCareerDecisionContextRevision);
  const alternateBaseCareerDecisionContextRevision = structuredClone(otherBase.targetCareerDecisionContextRevision);
  const x = structuredClone(primary.firstFeedbackReturnItem);
  const y = structuredClone(primary.secondFeedbackReturnItem);
  const q = structuredClone(neutral.firstFeedbackReturnItem);
  const m = structuredClone(neutral.secondFeedbackReturnItem);
  const z = createCareerOutcomeValenceFeedbackReturnItem(
    otherBase.careerOutcomeValenceFeedbackReturnRepresentation,
    otherBase.itemInput,
  );
  const contentX = createCareerOutcomeValenceFeedbackContextContent(
    baseCareerDecisionContextRevision, [x], { createdAt: "2027-02-14T01:00:00.000Z" },
  );
  const contentY = createCareerOutcomeValenceFeedbackContextContent(
    baseCareerDecisionContextRevision, [y], { createdAt: "2027-02-14T01:00:01.000Z" },
  );
  const contentXY = createCareerOutcomeValenceFeedbackContextContent(
    baseCareerDecisionContextRevision, [x, y], { createdAt: "2027-02-14T01:00:02.000Z" },
  );
  const contentXQ = createCareerOutcomeValenceFeedbackContextContent(
    baseCareerDecisionContextRevision, [x, q], { createdAt: "2027-02-14T01:00:03.000Z" },
  );
  const contentXQM = createCareerOutcomeValenceFeedbackContextContent(
    baseCareerDecisionContextRevision, [x, q, m], { createdAt: "2027-02-14T01:00:04.000Z" },
  );
  const contentXYZ = createCareerOutcomeValenceFeedbackContextContent(
    baseCareerDecisionContextRevision, [x, y, q], { createdAt: "2027-02-14T01:00:05.000Z" },
  );
  const contentZ = createCareerOutcomeValenceFeedbackContextContent(
    alternateBaseCareerDecisionContextRevision, [z], { createdAt: "2027-02-14T01:00:06.000Z" },
  );
  return {
    baseCareerDecisionContextRevision,
    alternateBaseCareerDecisionContextRevision,
    x,
    y,
    q,
    m,
    z,
    contentX,
    contentY,
    contentXY,
    contentXQ,
    contentXQM,
    contentXYZ,
    contentZ,
    transitionInput: { createdAt: "2027-02-14T02:00:00.000Z" },
  };
}
