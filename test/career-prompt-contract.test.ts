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

  it("requires ORGANIZATION.country_iso to use a grounded canonical ISO alpha-2 code", () => {
    const prompt = buildCareerAnalysisPrompt([]);

    expect(prompt.systemPrompt).toMatch(/ISO-3166-1 alpha-2/i);
    expect(prompt.systemPrompt).toMatch(/exactly 2 (?:uppercase )?(?:ASCII )?letters/i);
    expect(prompt.systemPrompt).toMatch(/uppercase/i);
    expect(prompt.systemPrompt).toMatch(/country names? (?:are )?forbidden/i);
    expect(prompt.systemPrompt).toMatch(/alpha-3 (?:codes? )?(?:are )?forbidden/i);
    expect(prompt.systemPrompt).toMatch(/country (?:cannot be )?grounded.*do not fabricate.*omit the ORGANIZATION entity/i);
  });
});
