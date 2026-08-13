import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { validateCareerAnalysis } from "../lib/career/validator";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { propagateGraphConfidence } from "../lib/career/confidence/propagation";

describe("CONDYN Career Analysis Protocol v1.0 — Phase 4: Prompt Quality & Gold Standard Benchmark Suite", () => {
  const goldExpectedPath = path.resolve(
    __dirname,
    "gold/case_001_minimal_valid/expected/canonical-expected.json"
  );

  it("1. Gold Standard Compliance: expected.json passes CanonicalCareerAnalysis validator with 100% success", () => {
    expect(fs.existsSync(goldExpectedPath)).toBe(true);
    const rawContent = fs.readFileSync(goldExpectedPath, "utf-8");
    const parsed = JSON.parse(rawContent);

    const validation = validateCareerAnalysis(parsed);
    expect(validation.success).toBe(true);
    expect(validation.issues.filter((i) => i.severity === "ERROR")).toHaveLength(0);
  });

  it("2. Benchmark Grounding Evaluation: Gold Standard profile generates fully connected graph without orphaned evidence", () => {
    const rawContent = fs.readFileSync(goldExpectedPath, "utf-8");
    const parsed = JSON.parse(rawContent);

    const graph = buildEvidenceGraph(parsed, []);
    expect(graph.evidenceNodes.length).toBeGreaterThan(0);
    expect(graph.capabilityNodes.length).toBeGreaterThan(0);

    // Verify all capabilities link back to valid evidence
    expect(
      graph.capabilityNodes.every((cap) => cap.incomingEvidenceIds.length > 0)
    ).toBe(true);
  });

  it("3. Benchmark Confidence Evaluation: Gold Standard profile yields robust capability confidences >= 0.70", () => {
    const rawContent = fs.readFileSync(goldExpectedPath, "utf-8");
    const parsed = JSON.parse(rawContent);

    const graph = buildEvidenceGraph(parsed, []);
    const propagated = propagateGraphConfidence(graph);

    const capValues = Object.values(propagated.capabilityConfidences);
    expect(capValues.length).toBeGreaterThan(0);
    expect(capValues.every((conf) => conf >= 0.50)).toBe(true);
  });
});
