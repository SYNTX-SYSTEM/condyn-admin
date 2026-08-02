import { describe, it, expect } from "vitest";

const MANDATORY_SECTIONS = [
  "LEVEL A",
  "Source Register",
  "Evidence Ledger",
  "Capability Qualification",
  "Demonstrated Capability Architecture",
  "Capability Consolidation",
  "Problem Map",
  "Domain Map",
  "Institution Map",
  "Task Map",
  "Role Map",
  "Search Query Library",
  "Organization Map",
  "Hidden Opportunity Map",
  "Structural Resonance Ranking",
  "Entry Strategies",
  "Provisional Branches",
  "Excluded Branches",
  "Contradictions",
  "Evidence Limits"
];

function validateCompleteness(fullText: string): { complete: boolean; missingSections: string[] } {
  const missingSections: string[] = [];
  for (const section of MANDATORY_SECTIONS) {
    const regex = new RegExp(section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (!regex.test(fullText)) {
      missingSections.push(section);
    }
  }
  return {
    complete: missingSections.length === 0,
    missingSections
  };
}

describe("CONDYN Section-Based Workflow & Completeness Validation", () => {
  it("should fail validation when mandatory sections are missing", () => {
    const incompleteText = "# LEVEL A\nSome text...\n## Source Register\nData...";
    const result = validateCompleteness(incompleteText);
    expect(result.complete).toBe(false);
    expect(result.missingSections).toContain("Evidence Ledger");
    expect(result.missingSections).toContain("Task Map");
    expect(result.missingSections).toContain("Evidence Limits");
  });

  it("should pass validation when all 20 mandatory sections are present", () => {
    const completeText = MANDATORY_SECTIONS.map((sec) => `## ${sec}\nContent for ${sec}`).join("\n\n");
    const result = validateCompleteness(completeText);
    expect(result.complete).toBe(true);
    expect(result.missingSections.length).toBe(0);
  });
});
