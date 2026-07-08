import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToString } from "react-dom/server";
import * as fs from "fs";
import * as path from "path";
import { ReactFlowCareerGraph } from "../app/components/career/ReactFlowCareerGraph";
import { ReactFlowGraph, ReactFlowNode, ReactFlowEdge } from "../lib/career/adapters/react-flow";

// Mock @xyflow/react for SSR / node test environment since ReactFlow requires DOM dimensions/ResizeObserver
vi.mock("@xyflow/react", () => {
  return {
    ReactFlow: ({ nodes, edges, children }: any) => (
      <div data-testid="mock-reactflow-canvas" data-node-count={nodes?.length || 0} data-edge-count={edges?.length || 0}>
        <div className="react-flow__nodes">
          {nodes?.map((node: any) => (
            <div
              key={node.id}
              data-testid={`reactflow-node-${node.id}`}
              data-x={node.position?.x}
              data-y={node.position?.y}
              data-label={node.data?.label}
              data-shape={node.data?.style?.shape}
              className="react-flow__node"
            >
              {node.data?.label}
            </div>
          ))}
        </div>
        <div className="react-flow__edges">
          {edges?.map((edge: any) => (
            <div
              key={edge.id}
              data-testid={`reactflow-edge-${edge.id}`}
              data-source={edge.source}
              data-target={edge.target}
              data-animated={edge.animated}
              className="react-flow__edge"
            >
              {edge.id}
            </div>
          ))}
        </div>
        {children}
      </div>
    ),
    Controls: () => <div data-testid="mock-reactflow-controls" />,
    MiniMap: () => <div data-testid="mock-reactflow-minimap" />,
    Background: () => <div data-testid="mock-reactflow-background" />
  };
});

function getMockReactFlowGraph(): ReactFlowGraph {
  const nodes: ReactFlowNode[] = [
    {
      id: "CAP_001",
      type: "careerNode",
      position: { x: 0, y: 0 },
      data: {
        label: "Distributed Systems Architecture",
        type: "CAPABILITY",
        ringName: "Core Capabilities",
        ringIndex: 0,
        weight: 0.95,
        tooltip: "Distributed Systems Architecture (CAPABILITY)",
        isCollapsible: false,
        isExpandedByDefault: true,
        style: {
          colorToken: "#1565C0",
          shape: "HEXAGON",
          borderWidth: 3,
          opacity: 1
        }
      },
      style: { opacity: 1 }
    },
    {
      id: "ORG_001",
      type: "careerNode",
      position: { x: 0, y: -250 },
      data: {
        label: "Siemens AG",
        type: "CONCRETE_ORGANIZATION",
        ringName: "Target Organizations",
        ringIndex: 1,
        weight: 0.94,
        tooltip: "Siemens AG",
        isCollapsible: true,
        isExpandedByDefault: true,
        style: {
          colorToken: "#4CAF50",
          shape: "RECTANGLE",
          borderWidth: 1,
          opacity: 1
        }
      },
      style: { opacity: 1 }
    }
  ];

  const edges: ReactFlowEdge[] = [
    {
      id: "edge-ORG_001-CAP_001",
      source: "ORG_001",
      target: "CAP_001",
      animated: false,
      style: {
        strokeWidth: 1,
        stroke: "#999999",
        strokeDasharray: "5 5"
      },
      data: {
        interactionForce: 0.89,
        tooltip: "Connection force: 89%"
      }
    }
  ];

  return { nodes, edges };
}

describe("CONDYN Career Analysis Protocol v1.0 - Step 6.1: ReactFlow Graph Engine Integration", () => {
  it("should render ReactFlowCareerGraph strictly from adapter data without mutation", () => {
    const graph = getMockReactFlowGraph();
    const html = renderToString(<ReactFlowCareerGraph graph={graph} />);

    expect(html).toContain('data-testid="mock-reactflow-canvas"');
    expect(html).toContain('data-node-count="2"');
    expect(html).toContain('data-edge-count="1"');
  });

  it("should render all nodes and edges with identical IDs and labels from adapter graph", () => {
    const graph = getMockReactFlowGraph();
    const html = renderToString(<ReactFlowCareerGraph graph={graph} />);

    expect(html).toContain('data-testid="reactflow-node-CAP_001"');
    expect(html).toContain("Distributed Systems Architecture");
    expect(html).toContain('data-testid="reactflow-node-ORG_001"');
    expect(html).toContain("Siemens AG");
    expect(html).toContain('data-testid="reactflow-edge-edge-ORG_001-CAP_001"');
  });

  it("should map node positions strictly 1:1 without running layout calculations or trigonometry", () => {
    const graph = getMockReactFlowGraph();
    const html = renderToString(<ReactFlowCareerGraph graph={graph} />);

    expect(html).toContain('data-x="0"');
    expect(html).toContain('data-y="-250"');
  });

  it("should strictly enforce Dumb Consumer principle: zero imports or calls to repository, validator, or canonical schema", () => {
    const filePath = path.join(__dirname, "../app/components/career/ReactFlowCareerGraph.tsx");
    const content = fs.readFileSync(filePath, "utf-8");

    // Must not import domain/backend modules
    expect(content).not.toMatch(/from\s+["'].*CanonicalCareerAnalysis.*["']/);
    expect(content).not.toMatch(/from\s+["'].*repository.*["']/);
    expect(content).not.toMatch(/from\s+["'].*validator.*["']/);
    expect(content).not.toContain("projectTopology");
    expect(content).not.toContain("buildViewModel");
    expect(content).not.toContain("buildRadialLayout");

    // Must only import adapters or React/UI dependencies
    expect(content).toContain("react-flow");
  });
});
