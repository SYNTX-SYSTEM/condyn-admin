import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { projectTopology } from "../lib/career/perception";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 5.1: Topology Projection Mapper (`projectTopology`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  const getVerifiedAnalysis = (): VerifiedCareerAnalysis => {
    const result = validateCareerAnalysis(unverifiedPayload);
    expect(result.success).toBe(true);
    return result.data as VerifiedCareerAnalysis;
  };

  it("should throw ERR_UNVERIFIED_ANALYSIS_PROJECTION when passed an unverified analysis", () => {
    const dirtyAnalysis = {
      ...unverifiedPayload,
      structured_data: {
        ...unverifiedPayload.structured_data,
        analysis: {
          ...unverifiedPayload.structured_data.analysis,
          metadata: {
            ...unverifiedPayload.structured_data.analysis.metadata,
            validation_state: "UNVERIFIED"
          }
        }
      }
    } as VerifiedCareerAnalysis;

    expect(() => projectTopology(dirtyAnalysis)).toThrow("ERR_UNVERIFIED_ANALYSIS_PROJECTION");
  });

  it("should project canonical model into TopologyProjection without mutating domain scores or labels", () => {
    const analysis = getVerifiedAnalysis();
    const projection = projectTopology(analysis);

    expect(projection.analysisId).toBe("ANL_20260706_000001");
    expect(projection.centerNodeId).toBe("CAP_001");
    expect(projection.nodes).toHaveLength(3);
    expect(projection.edges).toHaveLength(2);

    // Verify center node mapping (CAP_001 in Core Capabilities ring 0)
    const capNode = projection.nodes.find(n => n.id === "CAP_001");
    expect(capNode).toBeDefined();
    expect(capNode!.label).toBe("Distributed Systems Architecture & Resilience");
    expect(capNode!.type).toBe("CAPABILITY");
    expect(capNode!.ringName).toBe("Core Capabilities");
    expect(capNode!.ringIndex).toBe(0);
    expect(capNode!.colorToken).toBe("#1565C0"); // From ui_layout.color_tokens.CAPABILITY
    expect(capNode!.weight).toBe(0.95);
    expect(capNode!.position).toEqual({ x: 0, y: 0 }); // Center ring must be at (0, 0)
  });

  it("should map priority groups and edges 1:1 from semantic_graph and ui_layout", () => {
    const analysis = getVerifiedAnalysis();
    const projection = projectTopology(analysis);

    // ORG_001 belongs to priority group GRP_TOP_RESONANCE
    const orgNode = projection.nodes.find(n => n.id === "ORG_001");
    expect(orgNode).toBeDefined();
    expect(orgNode!.priorityGroup).toBe("Immediate Market Match");
    expect(orgNode!.colorToken).toBe("#4CAF50");

    // Verify edge mapping
    const edge = projection.edges.find(e => e.source === "ORG_001" && e.target === "CAP_001");
    expect(edge).toBeDefined();
    expect(edge!.id).toBe("edge-ORG_001-CAP_001");
    expect(edge!.interactionForce).toBe(0.89);
  });

  it("should generate 100% deterministic integer pixel coordinates across multiple projection runs", () => {
    const analysis = getVerifiedAnalysis();
    const run1 = projectTopology(analysis);
    const run2 = projectTopology(analysis);
    const run3 = projectTopology(analysis);

    expect(run1.nodes).toEqual(run2.nodes);
    expect(run2.nodes).toEqual(run3.nodes);

    // Verify that coordinates are integer pixels (no floating point jitter)
    for (const node of run1.nodes) {
      expect(Number.isInteger(node.position.x)).toBe(true);
      expect(Number.isInteger(node.position.y)).toBe(true);
    }
  });
});
