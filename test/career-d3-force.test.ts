import fs from "fs";
import path from "path";
import { describe, it, expect } from "vitest";
import { projectTopology } from "../lib/career/perception";
import { buildViewModel } from "../lib/career/view-model";
import { buildRadialLayout } from "../lib/career/layout";
import { toD3Force } from "../lib/career/adapters/d3-force";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";

describe("CONDYN Career Analysis Protocol v1.0 - Step 5.4: D3 Force Adapter (`toD3Force`)", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/expected.json");
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

  it("should generate 100% identical D3 force graph across multiple runs for identical layout model input", () => {
    const layout = getLayoutModel();
    const d3_1 = toD3Force(layout);
    const d3_2 = toD3Force(layout);

    expect(d3_1).toEqual(d3_2);
    expect(() => JSON.stringify(d3_1)).not.toThrow();
  });

  it("should preserve node count and link count from layout model 1:1 without adding or removing items", () => {
    const layout = getLayoutModel();
    const d3Graph = toD3Force(layout);

    expect(d3Graph.nodes).toHaveLength(layout.nodes.length);
    expect(d3Graph.links).toHaveLength(layout.edges.length);
  });

  it("should map x and y strictly 1:1 from node.x and node.y without running ticks or recalculations", () => {
    const layout = getLayoutModel();
    const d3Graph = toD3Force(layout);

    for (const layoutNode of layout.nodes) {
      const d3Node = d3Graph.nodes.find(n => n.id === layoutNode.id);
      expect(d3Node).toBeDefined();
      expect(d3Node!.x).toBe(layoutNode.x);
      expect(d3Node!.y).toBe(layoutNode.y);
      expect(d3Node!.label).toBe(layoutNode.label);
    }
  });

  it("should assign fx: 0 and fy: 0 strictly to center node and leave outer nodes without fx/fy", () => {
    const layout = getLayoutModel();
    const d3Graph = toD3Force(layout);

    const centerNode = d3Graph.nodes.find(n => n.id === layout.centerNodeId);
    expect(centerNode).toBeDefined();
    expect(centerNode!.fx).toBe(0);
    expect(centerNode!.fy).toBe(0);

    const outerNodes = d3Graph.nodes.filter(n => n.id !== layout.centerNodeId);
    expect(outerNodes.length).toBeGreaterThan(0);

    for (const node of outerNodes) {
      expect(node.fx).toBeUndefined();
      expect(node.fy).toBeUndefined();
    }
  });

  it("should map edge interactionForce strictly to link strength and pass styles through", () => {
    const layout = getLayoutModel();
    const d3Graph = toD3Force(layout);

    for (const layoutEdge of layout.edges) {
      const d3Link = d3Graph.links.find(l => l.id === layoutEdge.id);
      expect(d3Link).toBeDefined();
      expect(d3Link!.strength).toBe(layoutEdge.interactionForce);
      expect(d3Link!.animated).toBe(layoutEdge.style.animated);
      expect(d3Link!.style.strokeWidth).toBe(layoutEdge.style.strokeWidth);
      expect(d3Link!.style.stroke).toBe(layoutEdge.style.strokeColor);
    }
  });

  it("should strictly exclude ReactFlow keys (position, sourceHandle, targetHandle) from nodes and links", () => {
    const layout = getLayoutModel();
    const d3Graph = toD3Force(layout);

    const forbiddenKeys = ["position", "sourceHandle", "targetHandle"];

    for (const node of d3Graph.nodes) {
      for (const key of forbiddenKeys) {
        expect((node as any)[key]).toBeUndefined();
      }
    }

    for (const link of d3Graph.links) {
      for (const key of forbiddenKeys) {
        expect((link as any)[key]).toBeUndefined();
      }
    }
  });
});
