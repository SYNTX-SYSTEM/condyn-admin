import React from "react";
import { ReactFlowNode } from "../../../lib/career/adapters/react-flow";

export interface GraphNodeProps {
  node: ReactFlowNode;
  onSelect?: (node: ReactFlowNode) => void;
}

export const GraphNode: React.FC<GraphNodeProps> = ({ node, onSelect }) => {
  return (
    <div
      data-testid={`graph-node-${node.id}`}
      data-ring-name={node.data.ringName}
      data-ring-index={node.data.ringIndex}
      data-shape={node.data.style.shape}
      style={{
        left: `calc(50% + ${node.position?.x || 0}px)`,
        top: `calc(50% + ${node.position?.y || 0}px)`,
        opacity: node.style.opacity
      }}
      onClick={() => onSelect && onSelect(node)}
      className="career-graph-node"
    >
      <span className="node-label">{node.data.label}</span>
      <span className="node-tooltip">{node.data.tooltip}</span>
    </div>
  );
};
