import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { projectTopology } from "../lib/career/perception";
import { buildViewModel } from "../lib/career/view-model";
import { buildRadialLayout } from "../lib/career/layout";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 5.3a: Engine-Neutral Radial Layout Layer (`buildRadialLayout`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  const getViewModel = () => {
    const result = validateCareerAnalysis(unverifiedPayload);
    expect(result.success).toBe(true);
    const analysis = result.data as VerifiedCareerAnalysis;
    const projection = projectTopology(analysis);
    return buildViewModel(projection);
  };

  it("should generate 100% identical layout model across multiple runs for identical view model input", () => {
    const vm = getViewModel();
    const layout1 = buildRadialLayout(vm);
    const layout2 = buildRadialLayout(vm);

    expect(layout1).toEqual(layout2);
    expect(() => JSON.stringify(layout1)).not.toThrow();
  });

  it("should preserve analysisId, centerNodeId, node count, edge count, and group count 1:1", () => {
    const vm = getViewModel();
    const layout = buildRadialLayout(vm);

    expect(layout.analysisId).toBe(vm.analysisId);
    expect(layout.centerNodeId).toBe(vm.centerNodeId);
    expect(layout.nodes).toHaveLength(vm.nodes.length);
    expect(layout.edges).toHaveLength(vm.edges.length);
    expect(layout.groups).toHaveLength(vm.groups.length);
  });

  it("should place center node strictly at { x: 0, y: 0 } and outer nodes on deterministic ring radii", () => {
    const vm = getViewModel();
    const layout = buildRadialLayout(vm);

    const centerNode = layout.nodes.find(n => n.id === layout.centerNodeId);
    expect(centerNode).toBeDefined();
    expect(centerNode!.x).toBe(0);
    expect(centerNode!.y).toBe(0);

    const outerNodes = layout.nodes.filter(n => n.id !== layout.centerNodeId && n.ringIndex > 0);
    expect(outerNodes.length).toBeGreaterThan(0);

    for (const node of outerNodes) {
      expect(Number.isInteger(node.x)).toBe(true);
      expect(Number.isInteger(node.y)).toBe(true);
      // Verify distance is approximately ringIndex * 250 (within 1 pixel due to rounding)
      const dist = Math.sqrt(node.x * node.x + node.y * node.y);
      const expectedRadius = node.ringIndex * 250;
      expect(Math.abs(dist - expectedRadius)).toBeLessThanOrEqual(1);
    }
  });

  it("should strictly exclude ReactFlow and D3 engine keys (position, data, sourceHandle, targetHandle, fx, fy)", () => {
    const vm = getViewModel();
    const layout = buildRadialLayout(vm);

    const forbiddenKeys = ["position", "data", "sourceHandle", "targetHandle", "fx", "fy"];

    for (const node of layout.nodes) {
      for (const key of forbiddenKeys) {
        expect((node as any)[key]).toBeUndefined();
      }
    }

    for (const edge of layout.edges) {
      for (const key of forbiddenKeys) {
        expect((edge as any)[key]).toBeUndefined();
      }
    }
  });
});
