import { describe, it, expect } from "vitest";
import { buildEvidenceGraph } from "../lib/career/evidence/traversal";
import { propagateGraphConfidence } from "../lib/career/confidence/propagation";
import { aggregateCapabilityConfidence } from "../lib/career/confidence/aggregation";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 — Phase 3: Release Edge Cases & System Resilience Suite", () => {
  it("1. Resilience: should safely handle empty or malformed capabilities list without crashing", () => {
    const emptyAnalysis: any = {
      structured_data: {
        analysis: {
          documents: [],
          capabilities: []
        }
      }
    };

    const graph = buildEvidenceGraph(emptyAnalysis, []);
    expect(graph.capabilityNodes.length).toBe(0);

    const propagated = propagateGraphConfidence(graph);
    expect(propagated.capabilityConfidences).toEqual({});
  });

  it("2. Resilience: should reject malformed or hallucinated analysis schemas via runtime Zod validator", () => {
    const malformedRawAnalysis = {
      structured_data: {
        analysis: {
          // missing required fields or invalid types
          capabilities: "invalid_string_instead_of_array"
        }
      }
    };

    const result = validateCareerAnalysis(malformedRawAnalysis);
    expect(result.success).toBe(false);
  });

  it("3. Resilience: should safely aggregate 0-confidence or duplicate evidence items without breaking bounds [0.0, 1.0]", () => {
    const aggregated = aggregateCapabilityConfidence([
      { evidenceScore: 0.0, sourceWeight: 1.0 },
      { evidenceScore: -0.5, sourceWeight: 0.85 },
      { evidenceScore: 1.5, sourceWeight: 2.0 } // out-of-bounds input should clamp safely
    ]);

    expect(aggregated).toBeGreaterThanOrEqual(0.0);
    expect(aggregated).toBeLessThanOrEqual(1.0);
  });

  it("4. Resilience: should handle contradictory or overlapping evidence entries cleanly in DirectedEvidenceGraph", () => {
    const overlappingAnalysis: any = {
      structured_data: {
        analysis: {
          documents: [
            {
              entity_id: "DOC_1",
              identity: { name: "test.pdf", type: "document" },
              evidence: [
                { doc_id: "DOC_1", location: "Page 1", context_quote: "Advanced Python expert.", evidence_score: 0.95 },
                { doc_id: "DOC_1", location: "Page 2", context_quote: "Beginner Python.", evidence_score: 0.30 }
              ]
            }
          ],
          capabilities: [
            {
              entity_id: "CAP_PY",
              identity: { name: "Python Engineering" },
              confidence: 0.70,
              evidence: [
                { doc_id: "DOC_1", location: "Page 1", context_quote: "Advanced Python expert.", evidence_score: 0.95 },
                { doc_id: "DOC_1", location: "Page 2", context_quote: "Beginner Python.", evidence_score: 0.30 }
              ]
            }
          ]
        }
      }
    };

    const graph = buildEvidenceGraph(overlappingAnalysis, []);
    const propagated = propagateGraphConfidence(graph);

    const pyConf = propagated.capabilityConfidences["CAP_PY"];
    expect(pyConf).toBeDefined();
    expect(pyConf).toBeGreaterThan(0);
    expect(pyConf).toBeLessThanOrEqual(1.0);
  });
});
