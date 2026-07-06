import React from "react";
import { ReactFlowGraph } from "../../../lib/career/adapters/react-flow";

export interface SidebarProps {
  graph: ReactFlowGraph;
}

export const Sidebar: React.FC<SidebarProps> = ({ graph }) => {
  return (
    <aside data-testid="career-sidebar" className="career-sidebar">
      <h3>Analysis Metadata</h3>
      <div className="sidebar-stats">
        <div data-testid="stat-nodes">{`Total Nodes: ${graph.nodes.length}`}</div>
        <div data-testid="stat-edges">{`Total Edges: ${graph.edges.length}`}</div>
      </div>
    </aside>
  );
};
