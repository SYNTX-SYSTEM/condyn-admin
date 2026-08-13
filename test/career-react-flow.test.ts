import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { projectTopology } from "../lib/career/perception";
import { buildViewModel } from "../lib/career/view-model";
import { buildRadialLayout } from "../lib/career/layout";
import { toReactFlow } from "../lib/career/adapters/react-flow";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 5.3b: ReactFlow Adapter (`toReactFlow`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/canonical-expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  const getLayoutModel = () => {
    const result = validateCareerAnalysis(unverifiedPayload);
    expect(result.success).toBe(true);
    const analysis = result.data as VerifiedCareerAnalysis;
    const projection = projectTopology(analysis);
    const vm = buildViewModel(projection);
    return buildRadialLayout(vm);
  };

  it("should generate 100% identical ReactFlow graph across multiple runs for identical layout model input", () => {
    const layout = getLayoutModel();
    const rf1 = toReactFlow(layout);
    const rf2 = toReactFlow(layout);

    expect(rf1).toEqual(rf2);
    expect(() => JSON.stringify(rf1)).not.toThrow();
  });

  it("should preserve node count and edge count from layout model 1:1 without adding or removing items", () => {
    const layout = getLayoutModel();
    const rf = toReactFlow(layout);

    expect(rf.nodes).toHaveLength(layout.nodes.length);
    expect(rf.edges).toHaveLength(layout.edges.length);
  });

  it("should map position: { x, y } strictly 1:1 from node.x and node.y without recalculating coordinates", () => {
    const layout = getLayoutModel();
    const rf = toReactFlow(layout);

    for (let i = 0; i < layout.nodes.length; i++) {
      const layoutNode = layout.nodes[i];
      const rfNode = rf.nodes.find(n => n.id === layoutNode.id);
      expect(rfNode).toBeDefined();
      expect(rfNode!.position).toEqual({ x: layoutNode.x, y: layoutNode.y });
    }
  });

  it("should accurately map edge styles including strokeDasharray and animation properties", () => {
    const layout = getLayoutModel();
    const rf = toReactFlow(layout);

    for (const layoutEdge of layout.edges) {
      const rfEdge = rf.edges.find(e => e.id === layoutEdge.id);
      expect(rfEdge).toBeDefined();
      expect(rfEdge!.animated).toBe(layoutEdge.style.animated);
      expect(rfEdge!.style.strokeWidth).toBe(layoutEdge.style.strokeWidth);
      expect(rfEdge!.style.stroke).toBe(layoutEdge.style.strokeColor);

      if (layoutEdge.style.strokeStyle === "DASHED") {
        expect(rfEdge!.style.strokeDasharray).toBe("5 5");
      } else if (layoutEdge.style.strokeStyle === "DOTTED") {
        expect(rfEdge!.style.strokeDasharray).toBe("2 2");
      } else {
        expect(rfEdge!.style.strokeDasharray).toBeUndefined();
      }
    }
  });

  it("should strictly exclude D3 physics keys (fx, fy, vx, vy) from all nodes and edges", () => {
    const layout = getLayoutModel();
    const rf = toReactFlow(layout);

    const forbiddenKeys = ["fx", "fy", "vx", "vy"];

    for (const node of rf.nodes) {
      for (const key of forbiddenKeys) {
        expect((node as any)[key]).toBeUndefined();
      }
    }

    for (const edge of rf.edges) {
      for (const key of forbiddenKeys) {
        expect((edge as any)[key]).toBeUndefined();
      }
    }
  });
});
