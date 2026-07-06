import React from "react";
import { ReactFlowData } from "../../../lib/career/adapters/react-flow";

export interface ReactFlowCareerGraphNodeProps {
  data: ReactFlowData;
  selected?: boolean;
}

export const ReactFlowCareerGraphNode: React.FC<ReactFlowCareerGraphNodeProps> = ({ data, selected }) => {
  const { label, tooltip, ringName, style } = data;
  const borderColor = selected ? "#79c0ff" : (style?.colorToken || "#58a6ff");
  const shapeClass = style?.shape ? `shape-${style.shape.toLowerCase()}` : "shape-rectangle";

  return (
    <div
      data-testid={`reactflow-node-${label}`}
      data-ring-name={ringName}
      data-shape={style?.shape}
      style={{
        border: `${style?.borderWidth || 2}px solid ${borderColor}`,
        opacity: style?.opacity ?? 1,
        background: selected ? "rgba(33, 38, 45, 0.95)" : "rgba(22, 27, 34, 0.9)",
        boxShadow: selected
          ? `0 0 24px ${borderColor}99, 0 4px 16px rgba(0, 0, 0, 0.6)`
          : `0 0 12px ${borderColor}33, 0 4px 12px rgba(0, 0, 0, 0.4)`,
        padding: "10px 16px",
        borderRadius: style?.shape === "PILL" ? "20px" : style?.shape === "HEXAGON" ? "12px" : "8px",
        color: "#f0f6fc",
        fontSize: "13px",
        fontWeight: 600,
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer"
      }}
      className={`reactflow-career-node ${shapeClass}`}
    >
      <div className="node-content">
        <span className="node-label">{label}</span>
      </div>
      {tooltip && <span style={{ display: "none" }} className="node-tooltip">{tooltip}</span>}
    </div>
  );
};
