import React, { useMemo, useState } from "react";
import { ReactFlow, Controls, MiniMap, Background } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ReactFlowGraph, ReactFlowNode, ReactFlowEdge } from "../../../lib/career/adapters/react-flow";
import { ReactFlowCareerGraphNode } from "./ReactFlowCareerGraphNode";
import { BlueprintEdge, RELATION_DISPLAY_MAP } from "./BlueprintEdge";

export interface ReactFlowCareerGraphProps {
  graph: ReactFlowGraph;
  onSelectNode?: (node: ReactFlowNode) => void;
  onSelectEdge?: (edge: ReactFlowEdge) => void;
}

const nodeTypes = {
  careerNode: ReactFlowCareerGraphNode
};

const edgeTypes = {
  blueprintEdge: BlueprintEdge,
  default: BlueprintEdge
};

/**
 * ReactFlow presentation host component ("Dumb Consumer").
 * Strictly receives pre-computed ReactFlowGraph from adapter layer.
 * Performs ZERO domain logic, ZERO persistence/db calls, ZERO validation logic, and ZERO trigonometry.
 */
export const ReactFlowCareerGraph: React.FC<ReactFlowCareerGraphProps> = ({
  graph,
  onSelectNode,
  onSelectEdge
}) => {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // SVL v2.0 - Multi-Hop Focus / Context Model
  // Focused (0 Hops): 100%
  // Direct Neighbor (1 Hop): 85%
  // Second Hop (2 Hops): 55%
  // Background Context (Rest): 20%
  const hopMap = useMemo(() => {
    const map = new Map<string, number>();
    if (!activeNodeId) return map;

    map.set(activeNodeId, 0);
    const edgesList = graph.edges || [];
    const directNeighbors = new Set<string>();

    for (const edge of edgesList) {
      if (edge.source === activeNodeId) directNeighbors.add(edge.target);
      if (edge.target === activeNodeId) directNeighbors.add(edge.source);
    }
    for (const nId of directNeighbors) {
      if (!map.has(nId)) map.set(nId, 1);
    }

    for (const nId of directNeighbors) {
      for (const edge of edgesList) {
        if (edge.source === nId && !map.has(edge.target)) map.set(edge.target, 2);
        if (edge.target === nId && !map.has(edge.source)) map.set(edge.source, 2);
      }
    }

    return map;
  }, [activeNodeId, graph.edges]);

  const nodes = useMemo(() => {
    return (graph.nodes || []).map((node: any) => {
      let opacity = node.style?.opacity ?? 1;
      let filter = undefined;
      let zIndex = node.data?.weight ? Math.round(800 + node.data.weight * 100) : 800;

      if (activeNodeId) {
        const hops = hopMap.get(node.id);
        if (hops === 0) {
          opacity = 1.0;
          zIndex = 1000;
        } else if (hops === 1) {
          opacity = 0.85;
          zIndex = 900;
        } else if (hops === 2) {
          opacity = 0.55;
          zIndex = 850;
        } else {
          opacity = 0.20;
          zIndex = 700;
          filter = "grayscale(0.35)";
        }
      }

      return {
        ...node,
        style: {
          ...node.style,
          opacity,
          filter,
          zIndex
        }
      };
    });
  }, [graph.nodes, activeNodeId, hopMap]);

  const edges = useMemo(() => {
    return (graph.edges || []).map((edge: any) => {
      // SVL-4: Strict priority chain without guessing: 1. relationType -> 2. label -> 3. CONNECTED_TO
      const rawType = (edge.data?.relationType || edge.data?.label || "").toUpperCase();
      const mappedLabel = RELATION_DISPLAY_MAP[rawType] || rawType || "CONNECTED_TO";
      const relationLabel = `[ ${mappedLabel} ]`;
      const force = edge.data?.interactionForce ?? 0.5;
      
      // SVL-4: Edge line semantics (solid, dashed, dotted, double, animated)
      let strokeDasharray: string | undefined = undefined;
      let animated = edge.animated || false;
      let strokeWidth = Math.max(1.2, Math.min(3.5, force * 3));
      let strokeColor = edge.style?.stroke || "#58a6ff";
      let opacity = 0.75;

      if (mappedLabel.includes("IMPLEMENT") || mappedLabel.includes("REQUIRE") || mappedLabel.includes("DERIVED")) {
        strokeDasharray = "5 5"; // Dashed: Derived / Implemented
      } else if (mappedLabel.includes("SUGGEST") || mappedLabel.includes("RELATED") || mappedLabel.includes("INFERRED")) {
        strokeDasharray = "2 2"; // Dotted: Weak evidence / Inferred
        opacity = 0.55;
      } else if (mappedLabel.includes("SYNERGI") || mappedLabel.includes("MUTUAL") || mappedLabel.includes("INTERACT")) {
        strokeWidth = 3; // Double / Heavy: Bidirectional / Synergistic
      } else if (mappedLabel.includes("GENERATE") || mappedLabel.includes("EXECUTE") || mappedLabel.includes("PRODUCE")) {
        animated = true; // Animated: Live transition / Active flow
        strokeDasharray = "4 4";
      }

      // Adjust Edge Importance when Focus Mode is active
      if (activeNodeId) {
        const sourceHops = hopMap.get(edge.source);
        const targetHops = hopMap.get(edge.target);
        if ((sourceHops === 0 && targetHops === 1) || (sourceHops === 1 && targetHops === 0)) {
          opacity = 1.0;
          strokeWidth = Math.max(2, strokeWidth * 1.4);
          strokeColor = "#f0f6fc";
        } else if ((sourceHops === 1 && targetHops === 2) || (sourceHops === 2 && targetHops === 1)) {
          opacity = 0.65;
        } else {
          opacity = 0.15;
        }
      }

      return {
        ...edge,
        type: "blueprintEdge",
        label: relationLabel,
        animated,
        style: {
          ...edge.style,
          strokeWidth,
          stroke: strokeColor,
          strokeDasharray,
          opacity
        }
      };
    });
  }, [graph.edges, activeNodeId, hopMap]);

  return (
    <div
      data-testid="reactflow-career-graph-container"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
        position: "relative",
        background: "radial-gradient(circle at center, rgba(17, 23, 38, 0.6) 0%, rgba(10, 13, 20, 0.98) 100%), #0a0d14",
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid rgba(48, 54, 61, 0.6)",
        boxShadow: "inset 0 0 40px rgba(0, 0, 0, 0.6)"
      }}
      className="reactflow-career-graph-wrapper svl-space-layer"
    >
      {/* SVL v2.0 Phase B: Subtiles radiales Hintergrund-Raster und Achsen */}
      <svg
        className="svl-radial-grid"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1
        }}
      >
        <g transform="translate(50%, 50%)" style={{ transformOrigin: "center" }}>
          {/* Koordinatenachsen */}
          <line x1="-1500" y1="0" x2="1500" y2="0" stroke="rgba(48, 54, 61, 0.3)" strokeDasharray="4 8" strokeWidth="1" />
          <line x1="0" y1="-1500" x2="0" y2="1500" stroke="rgba(48, 54, 61, 0.3)" strokeDasharray="4 8" strokeWidth="1" />
          {/* Ring 0 */}
          <circle cx="0" cy="0" r="150" fill="none" stroke="rgba(48, 54, 61, 0.35)" strokeDasharray="3 6" strokeWidth="1" />
          <text x="5" y="-138" fill="rgba(139, 148, 158, 0.4)" fontSize="9" fontFamily="monospace" fontWeight="600" letterSpacing="1px">RING 00 // CORE CAPABILITIES</text>
          {/* Ring 1 */}
          <circle cx="0" cy="0" r="300" fill="none" stroke="rgba(48, 54, 61, 0.25)" strokeDasharray="3 6" strokeWidth="1" />
          <text x="5" y="-288" fill="rgba(139, 148, 158, 0.35)" fontSize="9" fontFamily="monospace" fontWeight="600" letterSpacing="1px">RING 01 // TARGET ECOSYSTEM</text>
          {/* Ring 2 */}
          <circle cx="0" cy="0" r="450" fill="none" stroke="rgba(48, 54, 61, 0.18)" strokeDasharray="3 6" strokeWidth="1" />
          <text x="5" y="-438" fill="rgba(139, 148, 158, 0.25)" fontSize="9" fontFamily="monospace" fontWeight="600" letterSpacing="1px">RING 02 // STRATEGIC ROLES</text>
        </g>
      </svg>

      <ReactFlow
        nodes={nodes as any}
        edges={edges as any}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodeClick={(_, node) => {
          setActiveNodeId(prev => prev === node.id ? null : node.id);
          if (onSelectNode) onSelectNode(node as any);
        }}
        onPaneClick={() => setActiveNodeId(null)}
        onEdgeClick={(_, edge) => onSelectEdge && onSelectEdge(edge as any)}
        fitView
        minZoom={0.1}
        maxZoom={2.5}
        proOptions={{ hideAttribution: true }}
      >
        <Controls
          style={{
            background: "rgba(13, 17, 23, 0.8)",
            border: "1px solid rgba(48, 54, 61, 0.6)",
            borderRadius: "6px",
            fill: "#8b949e",
            backdropFilter: "blur(8px)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
            zIndex: 10
          }}
        />
        {/* SVL-5 Layer 7: Weightless, transparent MiniMap without gray background box */}
        <MiniMap
          nodeColor={(node: any) => node.data?.style?.colorToken || "#58a6ff"}
          nodeStrokeColor={(node: any) => node.data?.style?.colorToken || "#58a6ff"}
          nodeStrokeWidth={1}
          nodeBorderRadius={(node: any) => node.data?.style?.shape === "CIRCLE" ? 10 : node.data?.style?.shape === "PILL" ? 8 : 2}
          style={{
            background: "transparent",
            border: "1px solid rgba(48, 54, 61, 0.2)",
            borderRadius: "6px",
            boxShadow: "none",
            width: 140,
            height: 100,
            bottom: 20,
            right: 20,
            zIndex: 10
          }}
          maskColor="rgba(10, 13, 20, 0.35)"
        />
        <Background color="#30363d" gap={28} size={1.2} />
      </ReactFlow>
    </div>
  );
};
