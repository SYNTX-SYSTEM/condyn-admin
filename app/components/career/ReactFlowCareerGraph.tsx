import React, { useMemo } from "react";
import { ReactFlow, Controls, MiniMap, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ReactFlowGraph, ReactFlowNode, ReactFlowEdge } from "../../../lib/career/adapters/react-flow";
import { ReactFlowCareerGraphNode } from "./ReactFlowCareerGraphNode";

export interface ReactFlowCareerGraphProps {
  graph: ReactFlowGraph;
  onSelectNode?: (node: ReactFlowNode) => void;
  onSelectEdge?: (edge: ReactFlowEdge) => void;
}

const nodeTypes = {
  careerNode: ReactFlowCareerGraphNode
};

/**
 * ReactFlow presentation host component ("Dumb Consumer").
 * Strictly receives pre-computed ReactFlowGraph from adapter layer.
 * Performs ZERO domain logic, ZERO repository calls, ZERO validator calls, and ZERO trigonometry.
 */
export const ReactFlowCareerGraph: React.FC<ReactFlowCareerGraphProps> = ({
  graph,
  onSelectNode,
  onSelectEdge
}) => {
  const nodes = useMemo(() => graph.nodes || [], [graph.nodes]);
  const edges = useMemo(() => graph.edges || [], [graph.edges]);

  return (
    <div
      data-testid="reactflow-career-graph-container"
      style={{ width: "100%", height: "100%", minHeight: "500px", position: "relative", background: "#0d1117" }}
      className="reactflow-career-graph-wrapper"
    >
      <ReactFlow
        nodes={nodes as any}
        edges={edges as any}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode && onSelectNode(node as any)}
        onEdgeClick={(_, edge) => onSelectEdge && onSelectEdge(edge as any)}
        fitView
        minZoom={0.2}
        maxZoom={2.0}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "6px",
            fill: "#c9d1d9"
          }}
        />
        <MiniMap
          nodeColor={(node: any) => node.data?.style?.colorToken || "#58a6ff"}
          style={{
            background: "#161b22",
            border: "1px solid #30363d",
            borderRadius: "6px"
          }}
        />
        <Background color="#30363d" gap={24} size={1} />
      </ReactFlow>
    </div>
  );
};
