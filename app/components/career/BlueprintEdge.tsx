import React from "react";
import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "@xyflow/react";

/**
 * SVL v2.0 Phase B - Strikte Display-Mapping-Tabelle für Relationen
 * Keine semantischen Verben erfinden, die Richtung oder Bedeutung verändern.
 */
export const RELATION_DISPLAY_MAP: Record<string, string> = {
  ROLE_IN_ORGANIZATION: "ROLE_IN_ORG",
  BELONGS_TO_CLASS: "BELONGS_TO",
  RESONATES_WITH: "RESONATES_WITH",
  REQUIRES: "REQUIRES",
  SUPPORTS: "SUPPORTS",
  DERIVED_FROM: "DERIVED_FROM",
  CONFLICTS_WITH: "CONFLICTS_WITH",
};

export const BlueprintEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [pathString, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Tangentenwinkel zwischen Start- und Zielpunkt bestimmen
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Flip-Korrektur bei Überkopf-Winkeln (> 90° oder < -90°)
  if (angle > 90 || angle < -90) {
    angle += 180;
  }
  if (angle > 180) {
    angle -= 360;
  }

  const rawRelationType = (data?.relationType as string) || (data?.label as string) || "";
  const displayLabel = RELATION_DISPLAY_MAP[rawRelationType] || rawRelationType || "CONNECTED_TO";

  const strokeColor = style?.stroke || "#58a6ff";
  const strokeWidth = style?.strokeWidth || 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={pathString}
        style={style}
        markerEnd={markerEnd}
      />
      {/* Technische CAD-Ankerpunkte am Kantenstart und -ende */}
      <circle
        cx={sourceX}
        cy={sourceY}
        r={2.5}
        fill="#0a0d14"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <circle
        cx={targetX}
        cy={targetY}
        r={2.5}
        fill="#0a0d14"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px) rotate(${angle}deg)`,
            pointerEvents: "all",
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: "8.5px",
            fontWeight: 600,
            letterSpacing: "0.8px",
            color: "#8b949e",
            background: "rgba(10, 13, 20, 0.92)",
            border: "1px solid rgba(48, 54, 61, 0.6)",
            borderRadius: "3px",
            padding: "2px 6px",
            boxShadow: "0 2px 6px rgba(0, 0, 0, 0.5)",
            whiteSpace: "nowrap",
            zIndex: 1000,
          }}
          className="nodrag nopan"
        >
          {`[ ${displayLabel} ]`}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
