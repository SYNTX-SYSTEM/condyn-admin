import { describe, expect, it } from "vitest";
import { createT13EHistoricalFixture } from "../relation/outcome-valence-feedback-context-content/t13e-historical-fixture";
const modulePath = "../../../lib/career/outcome-valence-feedback-context-content-admission/application.ts";
async function load() { return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-context-content-admission/application"); }
describe("T46 deterministic feedback context content boundary", () => {
  it("composes exact base context and canonical nonempty return-item inventory only", async () => {
    const api = await load(); const value = await createT13EHistoricalFixture();
    const result = api.createCareerOutcomeValenceFeedbackContextContentFromExactItems(
      value.baseCareerDecisionContextRevision,
      [value.secondFeedbackReturnItem, value.firstFeedbackReturnItem], { createdAt: "2027-02-13T01:00:00.000Z" },
    );
    expect(result.baseCareerDecisionContextRevision).toEqual(value.baseCareerDecisionContextRevision);
    expect(result.feedbackReturnItems.map(i => i.careerOutcomeValenceFeedbackReturnItemId))
      .toEqual([...result.feedbackReturnItems].map(i => i.careerOutcomeValenceFeedbackReturnItemId).sort());
    expect(result).not.toHaveProperty("transition");
  });
  it("rejects empty, duplicate, corrupt, and mismatched-base inventories", async () => {
    const api = await load(); const value = await createT13EHistoricalFixture();
    const call = (items: any[]) => api.createCareerOutcomeValenceFeedbackContextContentFromExactItems(value.baseCareerDecisionContextRevision, items, { createdAt: "2027-02-13T01:00:00.000Z" });
    expect(() => call([])).toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_EMPTY_MEMBER_INVENTORY");
    expect(() => call([value.firstFeedbackReturnItem, value.firstFeedbackReturnItem])).toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_DUPLICATE_MEMBER");
    expect(() => api.createCareerOutcomeValenceFeedbackContextContentFromExactItems({ ...value.baseCareerDecisionContextRevision, createdAt: "bad" }, [value.firstFeedbackReturnItem], { createdAt: "2027-02-13T01:00:00.000Z" })).toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_CONTEXT_CONTENT_BASE_INVALID");
  });
});
