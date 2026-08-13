import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { projectTopology } from "../lib/career/perception";
import { buildViewModel } from "../lib/career/view-model";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 5.2: View Model Builder (`buildViewModel`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  const getProjection = () => {
    const result = validateCareerAnalysis(unverifiedPayload);
    expect(result.success).toBe(true);
    const analysis = result.data as VerifiedCareerAnalysis;
    return projectTopology(analysis);
  };

  it("should generate 100% identical JSON View Model across multiple runs for identical projection input", () => {
    const projection = getProjection();
    const vm1 = buildViewModel(projection);
    const vm2 = buildViewModel(projection);

    expect(vm1).toEqual(vm2);
    expect(() => JSON.stringify(vm1)).not.toThrow();
  });

  it("should preserve analysisId, centerNodeId, node count, and edge count from projection 1:1", () => {
    const projection = getProjection();
    const vm = buildViewModel(projection);

    expect(vm.analysisId).toBe(projection.analysisId);
    expect(vm.centerNodeId).toBe(projection.centerNodeId);
    expect(vm.nodes).toHaveLength(projection.nodes.length);
    expect(vm.edges).toHaveLength(projection.edges.length);
  });

  it("should strictly exclude all engine-specific layout and position keys (x, y, fx, fy, position, data, sourceHandle, targetHandle)", () => {
    const projection = getProjection();
    const vm = buildViewModel(projection);

    const forbiddenKeys = ["x", "y", "fx", "fy", "position", "data", "sourceHandle", "targetHandle"];

    for (const node of vm.nodes) {
      for (const key of forbiddenKeys) {
        expect((node as any)[key]).toBeUndefined();
      }
    }

    for (const edge of vm.edges) {
      for (const key of forbiddenKeys) {
        expect((edge as any)[key]).toBeUndefined();
      }
    }
  });

  it("should enrich nodes and edges with deterministic style semantics, tooltips, and collapsible flags", () => {
    const projection = getProjection();
    const vm = buildViewModel(projection);

    const centerNode = vm.nodes.find(n => n.id === vm.centerNodeId);
    expect(centerNode).toBeDefined();
    expect(centerNode!.tooltip).toBeDefined();
    expect(typeof centerNode!.tooltip).toBe("string");
    expect(centerNode!.isCollapsible).toBe(false); // Core ring 0 is never collapsible
    expect(centerNode!.isExpandedByDefault).toBe(true);
    expect(centerNode!.style).toBeDefined();
    expect(centerNode!.style.colorToken).toBe("#1565C0");
    expect(centerNode!.style.shape).toBeDefined();

    const edge = vm.edges[0];
    expect(edge).toBeDefined();
    expect(edge.tooltip).toBeDefined();
    expect(edge.style).toBeDefined();
    expect(["SOLID", "DASHED", "DOTTED"]).toContain(edge.style.strokeStyle);
  });
});
