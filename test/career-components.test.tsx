import fs from "fs";
import path from "path";
import React from "react";
import { renderToString } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { projectTopology } from "../lib/career/perception";
import { buildViewModel } from "../lib/career/view-model";
import { buildRadialLayout } from "../lib/career/layout";
import { toReactFlow, ReactFlowGraph } from "../lib/career/adapters/react-flow";
import { VerifiedCareerAnalysis } from "../lib/career/types";
import { validateCareerAnalysis } from "../lib/career/validator";
import { CareerGraph } from "../app/components/career/CareerGraph";
import { GraphNode } from "../app/components/career/GraphNode";
import { GraphEdge } from "../app/components/career/GraphEdge";
import { Sidebar } from "../app/components/career/Sidebar";
import { Inspector } from "../app/components/career/Inspector";

describe("CONDYN Career Analysis Protocol v1.0 - Step 5.5: React Presentation Components", () => {
  const goldJsonPath = path.join(__dirname, "gold/case_001_minimal_valid/expected/expected.json");
  const goldJsonRaw = fs.readFileSync(goldJsonPath, "utf-8");
  const unverifiedPayload = JSON.parse(goldJsonRaw);

  const getAdapterGraph = (): ReactFlowGraph => {
    const result = validateCareerAnalysis(unverifiedPayload);
    expect(result.success).toBe(true);
    const analysis = result.data as VerifiedCareerAnalysis;
    const projection = projectTopology(analysis);
    const vm = buildViewModel(projection);
    const layout = buildRadialLayout(vm);
    return toReactFlow(layout);
  };

  it("should render CareerGraph strictly from adapter output with identical HTML output across multiple renders", () => {
    const graph = getAdapterGraph();
    const html1 = renderToString(<CareerGraph graph={graph} />);
    const html2 = renderToString(<CareerGraph graph={graph} />);

    expect(html1).toBe(html2);
    expect(html1).toContain("career-graph-container");
    expect(html1).toContain("career-sidebar");
    expect(html1).toContain("graph-canvas");
    expect(html1).toContain("career-inspector");
  });

  it("should render all nodes and edges from adapter graph without mutation or layout calculation", () => {
    const graph = getAdapterGraph();
    const html = renderToString(<CareerGraph graph={graph} />);

    for (const node of graph.nodes) {
      expect(html).toContain(`graph-node-${node.id}`);
      expect(html).toContain(node.data.label.replace(/&/g, "&amp;"));
    }

    for (const edge of graph.edges) {
      expect(html).toContain(`graph-edge-${edge.id}`);
    }
  });

  it("should render Sidebar with accurate metadata counts derived purely from adapter graph", () => {
    const graph = getAdapterGraph();
    const html = renderToString(<Sidebar graph={graph} />);

    expect(html).toContain(`Total Nodes: ${graph.nodes.length}`);
    expect(html).toContain(`Total Edges: ${graph.edges.length}`);
  });

  it("should render Inspector details accurately when selectedNode or selectedEdge is provided", () => {
    const graph = getAdapterGraph();
    const firstNode = graph.nodes[0];
    const firstEdge = graph.edges[0];

    const nodeHtml = renderToString(<Inspector selectedNode={firstNode} />);
    expect(nodeHtml).toContain(`ID: ${firstNode.id}`);
    expect(nodeHtml).toContain(`Label: ${firstNode.data.label.replace(/&/g, "&amp;")}`);
    expect(nodeHtml).toContain(`Ring: ${firstNode.data.ringName}`);

    const edgeHtml = renderToString(<Inspector selectedEdge={firstEdge} />);
    expect(edgeHtml).toContain(`ID: ${firstEdge.id}`);
    expect(edgeHtml).toContain(`Source: ${firstEdge.source}`);
    expect(edgeHtml).toContain(`Target: ${firstEdge.target}`);
    expect(edgeHtml).toContain(`Force: ${firstEdge.data.interactionForce}`);

    const emptyHtml = renderToString(<Inspector />);
    expect(emptyHtml).toContain("No element selected");
  });

  it("should render individual GraphNode and GraphEdge components with correct visual style attributes", () => {
    const graph = getAdapterGraph();
    const node = graph.nodes[0];
    const edge = graph.edges[0];

    const nodeHtml = renderToString(<GraphNode node={node} />);
    expect(nodeHtml).toContain(`data-testid="graph-node-${node.id}"`);
    expect(nodeHtml).toContain(`data-shape="${node.data.style.shape}"`);

    const edgeHtml = renderToString(<GraphEdge edge={edge} />);
    expect(edgeHtml).toContain(`data-testid="graph-edge-${edge.id}"`);
    expect(edgeHtml).toContain(`data-source="${edge.source}"`);
    expect(edgeHtml).toContain(`data-target="${edge.target}"`);
  });
});
