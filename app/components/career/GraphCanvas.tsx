import React from "react";
import { ReactFlowGraph, ReactFlowNode, ReactFlowEdge } from "../../../lib/career/adapters/react-flow";
import { GraphNode } from "./GraphNode";
import { GraphEdge } from "./GraphEdge";

export interface GraphCanvasProps {
  graph: ReactFlowGraph;
  onSelectNode?: (node: ReactFlowNode) => void;
  onSelectEdge?: (edge: ReactFlowEdge) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ graph, onSelectNode, onSelectEdge }) => {
  return (
    <div data-testid="graph-canvas" className="career-graph-canvas">
      <div className="canvas-nodes">
        {graph.nodes.map(node => (
          <GraphNode key={node.id} node={node} onSelect={onSelectNode} />
        ))}
      </div>
      <div className="canvas-edges">
        {graph.edges.map(edge => (
          <GraphEdge key={edge.id} edge={edge} onSelect={onSelectEdge} />
        ))}
      </div>
    </div>
  );
};
