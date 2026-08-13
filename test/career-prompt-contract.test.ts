import { describe, it, expect } from "vitest";
import { buildCareerAnalysisPrompt } from "../lib/career/adapter";

describe("BUG010L: Prompt Contract Assertions", () => {
  it("B. should assert the compact prompt explicitly states required property contract for specialized entities", () => {
    const prompt = buildCareerAnalysisPrompt([]);

    expect(prompt.systemPrompt).toContain("ORGANIZATION: properties MUST contain \"country_iso\", \"industry_enum\", and \"resonance_score\"");
    expect(prompt.systemPrompt).toContain("ROLE: properties MUST contain \"seniority\" and \"domain_focus\"");
    expect(prompt.systemPrompt).toContain("SEARCH_QUERY: properties MUST contain \"title\", \"query\", \"purpose\", \"target\", and \"priority\"");
  });

  it("should assert the omit instead of fabricate rule", () => {
    const prompt = buildCareerAnalysisPrompt([]);
    expect(prompt.systemPrompt).toContain("If values cannot be grounded from evidence, DO NOT fabricate them. Omit the entity instead.");
  });
});
