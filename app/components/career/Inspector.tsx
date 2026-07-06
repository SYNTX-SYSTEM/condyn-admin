import React from "react";
import { ReactFlowNode, ReactFlowEdge } from "../../../lib/career/adapters/react-flow";

export interface InspectorProps {
  selectedNode?: ReactFlowNode | null;
  selectedEdge?: ReactFlowEdge | null;
}

export const Inspector: React.FC<InspectorProps> = ({ selectedNode, selectedEdge }) => {
  return (
    <div data-testid="career-inspector" className="career-inspector">
      <h4>Inspector Details</h4>
      {selectedNode ? (
        <div data-testid="inspector-node-details">
          <p>{`ID: ${selectedNode.id}`}</p>
          <p>{`Label: ${selectedNode.data.label}`}</p>
          <p>{`Ring: ${selectedNode.data.ringName}`}</p>
          <p>{`Weight: ${selectedNode.data.weight}`}</p>
        </div>
      ) : selectedEdge ? (
        <div data-testid="inspector-edge-details">
          <p>{`ID: ${selectedEdge.id}`}</p>
          <p>{`Source: ${selectedEdge.source}`}</p>
          <p>{`Target: ${selectedEdge.target}`}</p>
          <p>{`Force: ${selectedEdge.data.interactionForce}`}</p>
        </div>
      ) : (
        <div data-testid="inspector-empty">No element selected</div>
      )}
    </div>
  );
};
