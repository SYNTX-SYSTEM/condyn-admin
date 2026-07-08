import React from "react";
import { DemoCapabilityItem } from "../../../career/demo/demo-data";

export interface CapabilityEvidencePanelProps {
  capabilities: DemoCapabilityItem[];
}

export function CapabilityEvidencePanel({ capabilities }: CapabilityEvidencePanelProps) {
  return (
    <div
      data-testid="capability-evidence-panel"
      style={{
        backgroundColor: "#0d1117",
        border: "1px solid #30363d",
        borderRadius: "8px",
        padding: "16px",
        color: "#c9d1d9",
        fontFamily: "var(--font-mono, monospace)"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "14px", color: "#d2a8ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          2. Recognized Capabilities ({capabilities.length})
        </h3>
        <span style={{ fontSize: "11px", color: "#8b949e", backgroundColor: "#161b22", padding: "2px 6px", borderRadius: "4px" }}>
          SEMANTIC PROFILE
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {capabilities.map((cap) => {
          const pct = Math.round(cap.evidenceConfidence * 100);
          return (
            <div
              key={cap.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                padding: "10px",
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: "6px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#e6edf3", fontWeight: 600 }}>
                  {cap.name}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: "#a5d6ff",
                    backgroundColor: "rgba(56,139,253,0.15)",
                    padding: "2px 6px",
                    borderRadius: "4px"
                  }}
                >
                  {cap.domain}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "#8b949e" }}>
                <span>{cap.evidenceSummary}</span>
                <span style={{ color: pct >= 90 ? "#3fb950" : "#d2a8ff", fontWeight: "bold" }}>
                  {`${pct}%`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
