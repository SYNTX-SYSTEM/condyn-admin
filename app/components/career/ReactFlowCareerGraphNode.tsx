import React from "react";
import { Handle, Position, useViewport } from "@xyflow/react";
import { ReactFlowData } from "../../../lib/career/adapters/react-flow";

export interface ReactFlowCareerGraphNodeProps {
  data: ReactFlowData;
  selected?: boolean;
}

function getSemioticProperties(typeString: string, defaultShape?: string, defaultColor?: string) {
  const t = (typeString || "").toUpperCase();
  if (t.includes("CAPABILITY")) {
    return { shape: "HEXAGON", color: "#58a6ff", badge: "CAPABILITY" };
  } else if (t.includes("ORGANIZATION") || t.includes("ORG")) {
    return { shape: "RECTANGLE", color: "#3fb950", badge: "ORGANIZATION" };
  } else if (t.includes("ROLE")) {
    return { shape: "PILL", color: "#d29922", badge: "ROLE" };
  } else if (t.includes("STRATEGY")) {
    return { shape: "DIAMOND", color: "#a371f7", badge: "STRATEGY" };
  } else if (t.includes("OPPORTUNITY")) {
    return { shape: "CIRCLE", color: "#39c5bb", badge: "OPPORTUNITY" };
  } else if (t.includes("DOC") || t.includes("EVIDENCE") || t.includes("CERT")) {
    return { shape: "DOCUMENT", color: "#8b949e", badge: "EVIDENCE" };
  }
  return {
    shape: defaultShape || "RECTANGLE",
    color: defaultColor || "#58a6ff",
    badge: t || "ENTITY"
  };
}

export const ReactFlowCareerGraphNode: React.FC<ReactFlowCareerGraphNodeProps> = ({ data, selected }) => {
  const { label, tooltip, ringName, style, type } = data;
  const semiotic = getSemioticProperties(type, style?.shape, style?.colorToken);
  
  // Resilient useViewport for SSR / Vitest mock compatibility
  let zoom = 1;
  try {
    const vp = useViewport();
    if (vp && typeof vp.zoom === "number") zoom = vp.zoom;
  } catch {
    zoom = 1;
  }

  // SVL v2.0 - 4-Stage Level of Detail (LOD)
  // LOD0 (< 0.4): Dots only
  // LOD1 (0.4 - 0.7): Silhouettes only
  // LOD2 (0.7 - 1.15): Identity Name only
  // LOD3 (>= 1.15): Full Semantics
  let lod = 3;
  if (zoom < 0.4) lod = 0;
  else if (zoom < 0.7) lod = 1;
  else if (zoom < 1.15) lod = 2;

  const borderColor = selected ? "#ffffff" : semiotic.color;
  const shapeClass = `shape-${semiotic.shape.toLowerCase()}`;

  // SVL-1: Multi-Dimensional Influence Scaling (Node Importance Matrix)
  const weight = data.weight ?? 0.5;
  const isPrimary = weight >= 0.85;
  const isSecondary = weight >= 0.6;
  
  // SVL v2.0 Phase B: Optische Node-Staffelung (Role 110%, Organization 90%, Capability & Rest 80%)
  const opticalScale = semiotic.shape === "PILL" ? 1.10 : semiotic.shape === "RECTANGLE" ? 0.90 : 0.80;

  const fontSize = isPrimary ? "15px" : isSecondary ? "13px" : "11px";
  const fontWeight = isPrimary ? 800 : isSecondary ? 700 : 600;
  const borderWidth = lod === 0 ? 0 : isPrimary ? 3 : isSecondary ? 2 : 1.5;
  const zIndex = selected ? 1000 : Math.round(800 + weight * 100);

  // SVL-1 Silhouettes & LOD0 Dot override
  let borderRadius = "6px";
  let borderLeft = undefined;
  let minWidth = semiotic.shape === "CIRCLE" ? "70px" : isPrimary ? "140px" : "110px";
  let padding = lod === 1 ? "12px 20px" : isPrimary ? "14px 24px" : isSecondary ? "10px 18px" : "8px 14px";
  
  if (lod === 0) {
    // LOD0: Purist color/size dot, no border, no text, no glow
    const dotSize = Math.round(Math.max(10, Math.min(22, weight * 22)));
    return (
      <div
        data-testid={`reactflow-node-${label}`}
        data-ring-name={ringName}
        data-shape={style?.shape || semiotic.shape}
        data-lod={lod}
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          borderRadius: "50%",
          background: semiotic.color,
          opacity: style?.opacity ?? 1,
          transform: `scale(${opticalScale})`,
          transformOrigin: "center",
          transition: "all 0.2s ease",
          cursor: "pointer",
          position: "relative",
          zIndex
        }}
        className="reactflow-career-node lod0-dot"
      >
        <Handle type="target" position={Position.Top} style={{ opacity: 0, width: 1, height: 1 }} />
        <Handle type="source" position={Position.Bottom} style={{ opacity: 0, width: 1, height: 1 }} />
      </div>
    );
  }

  if (semiotic.shape === "PILL") {
    borderRadius = "9999px"; // Radical horizontal capsule
  } else if (semiotic.shape === "HEXAGON") {
    borderRadius = "14px"; // Clean geometric corners
  } else if (semiotic.shape === "CIRCLE") {
    borderRadius = "50%";
  } else if (semiotic.shape === "DIAMOND") {
    borderRadius = "4px";
  } else if (semiotic.shape === "DOCUMENT") {
    borderRadius = "4px 16px 4px 4px";
  } else if (semiotic.shape === "RECTANGLE") {
    borderRadius = "4px"; // Monolithic Server Blade
    borderLeft = `4px solid ${selected ? "#ffffff" : "#2ea043"}`;
  }

  // SVL-2 State Grammar: Exclusively state-based glow and background
  const background = selected
    ? "rgba(22, 27, 34, 0.98)"
    : "rgba(13, 17, 23, 0.94)";
  const boxShadow = selected
    ? `0 0 20px rgba(255, 255, 255, 0.3), 0 0 12px ${semiotic.color}88, 0 8px 24px rgba(0, 0, 0, 0.9)`
    : "0 4px 12px rgba(0, 0, 0, 0.6)";

  return (
    <div
      data-testid={`reactflow-node-${label}`}
      data-ring-name={ringName}
      data-shape={style?.shape || semiotic.shape}
      data-lod={lod}
      style={{
        border: `${borderWidth}px solid ${borderColor}`,
        borderLeft: borderLeft || `${borderWidth}px solid ${borderColor}`,
        opacity: style?.opacity ?? 1,
        background,
        boxShadow,
        padding,
        borderRadius,
        color: "#f0f6fc",
        fontSize,
        fontWeight,
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        transform: `scale(${opticalScale})`,
        transformOrigin: "center",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        cursor: "pointer",
        position: "relative",
        minWidth,
        textAlign: "center",
        zIndex
      }}
      className={`reactflow-career-node ${shapeClass} lod-${lod}`}
    >
      {/* Node Anchors: Organization (Left target), Role/Others (Top target) */}
      <Handle
        type="target"
        position={semiotic.shape === "RECTANGLE" ? Position.Left : Position.Top}
        style={{
          background: borderColor,
          width: 7,
          height: 7,
          border: "1.5px solid #0d1117",
          opacity: 0.8,
          [semiotic.shape === "RECTANGLE" ? "left" : "top"]: -4
        }}
      />
      
      {/* Additional Handle for capability multi-side connection */}
      {semiotic.shape === "HEXAGON" && (
        <Handle
          type="target"
          position={Position.Left}
          id="left-target"
          style={{ background: borderColor, width: 7, height: 7, border: "1.5px solid #0d1117", opacity: 0.8, left: -4 }}
        />
      )}

      {/* LOD1+: Silhouette is visible. LOD2+: Text label visible. LOD3: Full badges/metadata */}
      {lod >= 2 && (
        <div className="node-content" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
          <span className="node-label" style={{ letterSpacing: "0.3px", lineHeight: "1.2" }}>{label}</span>
          {lod >= 3 && (
            <span
              className="node-badge"
              style={{
                fontSize: "9px",
                color: semiotic.color,
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: 700,
                opacity: 0.95,
                background: `${semiotic.color}15`,
                padding: "1px 6px",
                borderRadius: "4px",
                border: `1px solid ${semiotic.color}33`
              }}
            >
              {semiotic.badge}
            </span>
          )}
        </div>
      )}

      {tooltip && <span style={{ display: "none" }} className="node-tooltip">{tooltip}</span>}

      {/* Node Anchors: Organization (Right source), Role/Others (Bottom source) */}
      <Handle
        type="source"
        position={semiotic.shape === "RECTANGLE" ? Position.Right : Position.Bottom}
        style={{
          background: borderColor,
          width: 7,
          height: 7,
          border: "1.5px solid #0d1117",
          opacity: 0.8,
          [semiotic.shape === "RECTANGLE" ? "right" : "bottom"]: -4
        }}
      />

      {/* Additional Source Handle for capability multi-side connection */}
      {semiotic.shape === "HEXAGON" && (
        <Handle
          type="source"
          position={Position.Right}
          id="right-source"
          style={{ background: borderColor, width: 7, height: 7, border: "1.5px solid #0d1117", opacity: 0.8, right: -4 }}
        />
      )}
    </div>
  );
};


