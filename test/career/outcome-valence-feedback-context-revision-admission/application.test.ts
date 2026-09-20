import { describe, expect, it } from "vitest";
import { createT13GHistoricalFixture } from "../relation/outcome-valence-feedback-context-revision/t13g-historical-fixture";

const modulePath = "../../../lib/career/outcome-valence-feedback-context-revision-admission/application.ts";
async function load() {
  return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-context-revision-admission/application");
}

describe("T48 deterministic feedback context revision boundary", () => {
  it("constructs an exact first revision envelope from an exact first transition", async () => {
    const api = await load();
    const value = await createT13GHistoricalFixture();
    const revision = api.createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
      value.firstParent,
      value.first,
      value.revisionInput,
    );
    expect(revision.parent).toEqual(value.firstParent);
    expect(revision.careerOutcomeValenceFeedbackContextTransition).toEqual(value.first);
    expect(revision).not.toHaveProperty("current");
    expect(revision).not.toHaveProperty("accepted");
    expect(revision).not.toHaveProperty("feedbackContextContent");
  });

  it("preserves exact subsequent lineage and rejects mismatched parent content", async () => {
    const api = await load();
    const value = await createT13GHistoricalFixture();
    const revision = api.createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
      value.subsequentParent,
      value.subsequent,
      value.revisionInput,
    );
    expect(revision.parent).toEqual(value.subsequentParent);
    expect(revision.careerOutcomeValenceFeedbackContextTransition.resultingFeedbackContextContent)
      .toEqual(value.contentXY);
    expect(() => api.createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
      { ...value.subsequentParent, parentFeedbackContextContent: value.contentY },
      value.subsequent,
      value.revisionInput,
    )).toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_REVISION_PARENT_CONTENT_MISMATCH");
  });

  it("retains transition identity and feedback valence while leaving audit time out of revision identity", async () => {
    const api = await load();
    const value = await createT13GHistoricalFixture();
    const first = api.createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
      value.firstParent,
      value.first,
      { createdAt: "2027-02-15T02:00:00.000Z" },
    );
    const sameRevisionLaterAudit = api.createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
      value.firstParent,
      value.first,
      { createdAt: "2027-02-16T02:00:00.000Z" },
    );
    expect(sameRevisionLaterAudit.careerOutcomeValenceFeedbackContextRevisionId)
      .toBe(first.careerOutcomeValenceFeedbackContextRevisionId);
    expect(first.careerOutcomeValenceFeedbackContextTransition.addedFeedbackReturnItem
      .careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence).toBe("DESIRABLE");
    expect(Object.keys(api)).toEqual(["createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition"]);
  });

  it("preserves every individual historical valence without aggregation or revision authority", async () => {
    const api = await load();
    const { createT13EHistoricalFixture } = await import("../relation/outcome-valence-feedback-context-content/t13e-historical-fixture");
    const { createCareerOutcomeValenceFeedbackContextContent } = await import("../../../lib/career/relation/outcome-valence-feedback-context-content");
    const { createCareerOutcomeValenceFeedbackContextTransition } = await import("../../../lib/career/relation/outcome-valence-feedback-context-transition");
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const value = await createT13EHistoricalFixture(valence);
      const content = createCareerOutcomeValenceFeedbackContextContent(
        value.baseCareerDecisionContextRevision,
        [value.firstFeedbackReturnItem],
        { createdAt: "2027-02-15T03:00:00.000Z" },
      );
      const transition = createCareerOutcomeValenceFeedbackContextTransition(
        value.baseCareerDecisionContextRevision,
        null,
        value.firstFeedbackReturnItem,
        content,
        { createdAt: "2027-02-15T03:00:01.000Z" },
      );
      const revision = api.createCareerOutcomeValenceFeedbackContextRevisionFromExactTransition(
        {
          parentRevisionKind: "CAREER_DECISION_CONTEXT_REVISION",
          parentRevisionId: value.baseCareerDecisionContextRevision.careerDecisionContextRevisionId,
        },
        transition,
        { createdAt: "2027-02-15T03:00:02.000Z" },
      );
      expect(revision.careerOutcomeValenceFeedbackContextTransition.addedFeedbackReturnItem
        .careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence).toBe(valence);
      expect(revision).not.toHaveProperty("actor");
      expect(revision).not.toHaveProperty("persistenceState");
      expect(revision).not.toHaveProperty("learning");
    }
  });
});
