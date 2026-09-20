import { describe, expect, it } from "vitest";
import { createT13FHistoricalFixture } from "../relation/outcome-valence-feedback-context-transition/t13f-historical-fixture";

const modulePath = "../../../lib/career/outcome-valence-feedback-context-transition-admission/application.ts";
async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-context-transition-admission/application");
}

describe("T47 deterministic feedback context transition boundary", () => {
  it("constructs only an exact first append-one transition witness", async () => {
    const api = await load();
    const value = await createT13FHistoricalFixture();
    const transition = api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
      value.baseCareerDecisionContextRevision,
      null,
      value.x,
      value.contentX,
      value.transitionInput,
    );
    expect(transition.baseCareerDecisionContextRevision).toEqual(value.baseCareerDecisionContextRevision);
    expect(transition.previousFeedbackContextContent).toBeNull();
    expect(transition.addedFeedbackReturnItem).toEqual(value.x);
    expect(transition.resultingFeedbackContextContent).toEqual(value.contentX);
    expect(transition).not.toHaveProperty("careerOutcomeValenceFeedbackContextRevision");
  });

  it("preserves exact source/result inventory and rejects corrupt or non-append-one operands", async () => {
    const api = await load();
    const value = await createT13FHistoricalFixture();
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
      value.baseCareerDecisionContextRevision,
      value.contentX,
      value.y,
      value.contentXY,
      value.transitionInput,
    )).not.toThrow();
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
      value.baseCareerDecisionContextRevision,
      value.contentX,
      value.x,
      value.contentX,
      value.transitionInput,
    )).toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_MEMBER_ALREADY_PRESENT");
    expect(() => api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
      value.baseCareerDecisionContextRevision,
      null,
      value.x,
      { ...value.contentX, createdAt: "bad" },
      value.transitionInput,
    )).toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_TRANSITION_RESULT_INVALID");
  });

  it("is detached and preserves all historical valences without revision construction", async () => {
    const api = await load();
    const { createT13EHistoricalFixture } = await import("../relation/outcome-valence-feedback-context-content/t13e-historical-fixture");
    const { createCareerOutcomeValenceFeedbackContextContent } = await import("../../../lib/career/relation/outcome-valence-feedback-context-content");
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const value = await createT13EHistoricalFixture(valence);
      const item = value.firstFeedbackReturnItem;
      const content = createCareerOutcomeValenceFeedbackContextContent(
        value.baseCareerDecisionContextRevision, [item], { createdAt: "2027-02-14T02:00:00.000Z" },
      );
      const transition = api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
        value.baseCareerDecisionContextRevision, null, item, content, { createdAt: "2027-02-14T02:00:00.000Z" },
      );
      expect(transition.addedFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence).toBe(valence);
      transition.addedFeedbackReturnItem.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.stateDimension = "mutated";
      expect(item.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.stateDimension).not.toBe("mutated");
    }
  });

  it("treats createdAt as validated audit metadata, not transition chronology or authority", async () => {
    const api = await load();
    const value = await createT13FHistoricalFixture();
    const recordedLater = api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
      value.baseCareerDecisionContextRevision,
      null,
      value.x,
      value.contentX,
      { createdAt: "2027-02-15T02:00:00.000Z" },
    );
    const recordedEarlier = api.createCareerOutcomeValenceFeedbackContextTransitionFromExactContent(
      value.baseCareerDecisionContextRevision,
      null,
      value.x,
      value.contentX,
      { createdAt: "2027-02-13T02:00:00.000Z" },
    );
    expect(recordedEarlier.careerOutcomeValenceFeedbackContextTransitionId)
      .toBe(recordedLater.careerOutcomeValenceFeedbackContextTransitionId);
    expect(recordedEarlier.createdAt).toBe("2027-02-13T02:00:00.000Z");
    expect(Object.keys(api)).toEqual(["createCareerOutcomeValenceFeedbackContextTransitionFromExactContent"]);
  });
});
