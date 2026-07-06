import React from "react";
import { ReactFlowEdge } from "../../../lib/career/adapters/react-flow";

export interface GraphEdgeProps {
  edge: ReactFlowEdge;
  onSelect?: (edge: ReactFlowEdge) => void;
}

export const GraphEdge: React.FC<GraphEdgeProps> = ({ edge, onSelect }) => {
  return (
    <div
      data-testid={`graph-edge-${edge.id}`}
      data-source={edge.source}
      data-target={edge.target}
      data-animated={edge.animated}
      style={{
        strokeWidth: edge.style.strokeWidth,
        stroke: edge.style.stroke,
        strokeDasharray: edge.style.strokeDasharray
      }}
      onClick={() => onSelect && onSelect(edge)}
      className="career-graph-edge"
    >
      <span className="edge-tooltip">{edge.data.tooltip}</span>
    </div>
  );
};
