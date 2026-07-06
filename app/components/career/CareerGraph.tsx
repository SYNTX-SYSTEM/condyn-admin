import React from "react";
import { ReactFlowGraph, ReactFlowNode, ReactFlowEdge } from "../../../lib/career/adapters/react-flow";
import { GraphCanvas } from "./GraphCanvas";
import { Sidebar } from "./Sidebar";
import { Inspector } from "./Inspector";

export interface CareerGraphProps {
  graph: ReactFlowGraph;
  selectedNode?: ReactFlowNode | null;
  selectedEdge?: ReactFlowEdge | null;
  onSelectNode?: (node: ReactFlowNode) => void;
  onSelectEdge?: (edge: ReactFlowEdge) => void;
}

/**
 * Dumb Presentation Orchestrator for CONDYN Career Analysis Protocol v1.0.
 * Strictly consumes adapter output (e.g. ReactFlowGraph).
 * Performs zero inference, zero layout calculation, zero repository/validator calls.
 */
export const CareerGraph: React.FC<CareerGraphProps> = ({
  graph,
  selectedNode,
  selectedEdge,
  onSelectNode,
  onSelectEdge
}) => {
  return (
    <div data-testid="career-graph-container" className="career-graph-container">
      <Sidebar graph={graph} />
      <main className="career-graph-main">
        <GraphCanvas graph={graph} onSelectNode={onSelectNode} onSelectEdge={onSelectEdge} />
      </main>
      <Inspector selectedNode={selectedNode} selectedEdge={selectedEdge} />
    </div>
  );
};
