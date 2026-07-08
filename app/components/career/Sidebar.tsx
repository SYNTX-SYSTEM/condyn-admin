import React from "react";
import { ReactFlowGraph } from "../../../lib/career/adapters/react-flow";

export interface SidebarProps {
  graph: ReactFlowGraph;
}

export const Sidebar: React.FC<SidebarProps> = ({ graph }) => {
  return (
    <aside
      data-testid="career-sidebar"
      className="career-sidebar"
      style={{
        background: "rgba(10, 13, 20, 0.98)",
        borderRight: "1px solid rgba(48, 54, 61, 0.8)",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "36px",
        color: "#c9d1d9",
        height: "100%",
        boxSizing: "border-box",
        overflowY: "auto",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <div>
        <div style={{ fontSize: "10px", fontWeight: 800, color: "#58a6ff", textTransform: "uppercase", letterSpacing: "2px", marginBottom: "6px", fontFamily: "monospace" }}>
          01 // SYSTEM ARCHITECTURE
        </div>
        <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#f0f6fc", margin: "0 0 20px 0", letterSpacing: "0.5px" }}>
          ONTOLOGY CONTEXT
        </h3>
        <div className="sidebar-stats" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <div
            data-testid="stat-nodes"
            style={{
              background: "rgba(22, 27, 34, 0.85)",
              border: "1px solid rgba(48, 54, 61, 0.8)",
              borderRadius: "10px",
              padding: "20px 14px",
              textAlign: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
            }}
          >
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#58a6ff", marginBottom: "6px", fontFamily: "monospace" }}>{graph.nodes.length}</div>
            <div style={{ fontSize: "10px", color: "#8b949e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{`Total Nodes: ${graph.nodes.length}`}</div>
          </div>
          <div
            data-testid="stat-edges"
            style={{
              background: "rgba(22, 27, 34, 0.85)",
              border: "1px solid rgba(48, 54, 61, 0.8)",
              borderRadius: "10px",
              padding: "20px 14px",
              textAlign: "center",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)"
            }}
          >
            <div style={{ fontSize: "26px", fontWeight: 800, color: "#a371f7", marginBottom: "6px", fontFamily: "monospace" }}>{graph.edges.length}</div>
            <div style={{ fontSize: "10px", color: "#8b949e", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{`Total Edges: ${graph.edges.length}`}</div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(48, 54, 61, 0.6)", paddingTop: "28px" }}>
        <div style={{ fontSize: "10px", fontWeight: 800, color: "#8b949e", textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: "14px", fontFamily: "monospace" }}>
          02 // VERIFICATION STATE
        </div>
        <div style={{
          background: "rgba(35, 134, 54, 0.15)",
          border: "1px solid rgba(46, 160, 67, 0.4)",
          borderRadius: "8px",
          padding: "12px 14px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "16px",
          boxShadow: "0 0 16px rgba(46, 160, 67, 0.15)"
        }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3fb950", display: "inline-block", boxShadow: "0 0 8px #3fb950" }}></span>
          <span style={{ fontSize: "11px", fontWeight: 800, color: "#3fb950", letterSpacing: "1px" }}>VERIFIED (IMMUTABLE)</span>
        </div>
        <div style={{ fontSize: "12px", color: "#8b949e", lineHeight: "1.6" }}>
          Radiale Graphprojektion gemäß CONDYN Systematik v1.0. Alle Knoten und Relationen verifiziert und immun gegen Client-Leakage.
        </div>
      </div>
    </aside>
  );
};


