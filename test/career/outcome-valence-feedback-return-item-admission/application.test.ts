import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { createCareerOutcomeValenceFeedbackReturnRepresentation } from "../../../lib/career/relation/outcome-valence-feedback-return-representation";
import { createT13CHistoricalFixture } from "../relation/outcome-valence-feedback-return-representation/t13c-historical-fixture";

const modulePath = "../../../lib/career/outcome-valence-feedback-return-item-admission/application.ts";
const sourcePath = resolve(process.cwd(), "lib/career/outcome-valence-feedback-return-item-admission/application.ts");
async function load() { return await import(/* @vite-ignore */ new URL(modulePath, import.meta.url).href) as typeof import("../../../lib/career/outcome-valence-feedback-return-item-admission/application"); }

describe("T45 deterministic CareerOutcomeValenceFeedbackReturnItem boundary", () => {
  it("wraps exact COVFRR without delivery, consumption, mutation, or context construction", async () => {
    const api = await load(); const value = await createT13CHistoricalFixture();
    const representation = createCareerOutcomeValenceFeedbackReturnRepresentation(
      value.careerOutcomeValenceFeedbackTargetRevisionBinding, value.representationInput,
    );
    const item = api.createCareerOutcomeValenceFeedbackReturnItemFromRepresentation(representation, { createdAt: "2027-02-12T01:00:00.000Z" });
    expect(item.careerOutcomeValenceFeedbackReturnRepresentation).toEqual(representation);
    expect(item.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback).toEqual(representation.representedFeedback);
    expect(item).not.toHaveProperty("delivery"); expect(item).not.toHaveProperty("consumption"); expect(item).not.toHaveProperty("contextContent");
    item.careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.stateDimension = "changed";
    expect(representation.representedFeedback.stateDimension).not.toBe("changed");
  });

  it("rejects corrupt COVFRR and malformed item input, preserving every exact valence", async () => {
    const api = await load(); const value = await createT13CHistoricalFixture();
    const representation = createCareerOutcomeValenceFeedbackReturnRepresentation(value.careerOutcomeValenceFeedbackTargetRevisionBinding, value.representationInput);
    expect(() => api.createCareerOutcomeValenceFeedbackReturnItemFromRepresentation({ ...representation, createdAt: "bad" }, { createdAt: "2027-02-12T01:00:00.000Z" }))
      .toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_REPRESENTATION_INVALID");
    expect(() => api.createCareerOutcomeValenceFeedbackReturnItemFromRepresentation(representation, { createdAt: "bad" }))
      .toThrow("ERR_CAREER_OUTCOME_VALENCE_FEEDBACK_RETURN_ITEM_INVALID");
    for (const valence of ["DESIRABLE", "UNDESIRABLE", "NEUTRAL", "UNRESOLVED"] as const) {
      const historical = await createT13CHistoricalFixture(valence);
      const parent = createCareerOutcomeValenceFeedbackReturnRepresentation(historical.careerOutcomeValenceFeedbackTargetRevisionBinding, historical.representationInput);
      expect(api.createCareerOutcomeValenceFeedbackReturnItemFromRepresentation(parent, { createdAt: "2027-02-12T01:00:00.000Z" })
        .careerOutcomeValenceFeedbackReturnRepresentation.representedFeedback.valence).toBe(valence);
    }
  });

  it("has deterministic identity excluding audit time and no transport, persistence, replay, or downstream construction", async () => {
    const api = await load(); const value = await createT13CHistoricalFixture();
    const parent = createCareerOutcomeValenceFeedbackReturnRepresentation(value.careerOutcomeValenceFeedbackTargetRevisionBinding, value.representationInput);
    const first = api.createCareerOutcomeValenceFeedbackReturnItemFromRepresentation(parent, { createdAt: "2027-02-12T01:00:00.000Z" });
    const later = api.createCareerOutcomeValenceFeedbackReturnItemFromRepresentation(parent, { createdAt: "2027-02-12T02:00:00.000Z" });
    expect(later.careerOutcomeValenceFeedbackReturnItemId).toBe(first.careerOutcomeValenceFeedbackReturnItemId);
    const source = readFileSync(sourcePath, "utf8"); const executable = source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    expect(executable).not.toMatch(/\.json\(|headers\.|cookies\(|Authorization|JWT|jose|issuer|Date\.now|new Date|current|latest|head|provider|fetch\(|persist|replay|delivery|consumption|mutation|learning|Recommendation|causality/i);
  });
});
