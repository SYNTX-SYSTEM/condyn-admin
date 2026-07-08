import React from "react";
import { DemoCapabilityGap, DemoNextAction } from "../../../career/demo/demo-data";

export interface RecommendationPanelProps {
  capabilityGaps: DemoCapabilityGap[];
  nextActions: DemoNextAction[];
}

export function RecommendationPanel({ capabilityGaps, nextActions }: RecommendationPanelProps) {
  return (
    <div
      data-testid="recommendation-panel"
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
        <h3 style={{ margin: 0, fontSize: "14px", color: "#f85149", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          5 & 6. Capability Gaps & Actionable Recommendations
        </h3>
        <span style={{ fontSize: "11px", color: "#8b949e", backgroundColor: "#161b22", padding: "2px 6px", borderRadius: "4px" }}>
          FIT ENHANCEMENT
        </span>
      </div>

      <div style={{ marginBottom: "14px" }}>
        <div style={{ fontSize: "12px", color: "#8b949e", textTransform: "uppercase", marginBottom: "6px" }}>
          Missing Capabilities ({capabilityGaps.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {capabilityGaps.map((gap, idx) => (
            <div
              key={idx}
              style={{
                padding: "8px 10px",
                backgroundColor: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "6px",
                display: "flex",
                flexDirection: "column",
                gap: "3px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#ffa198", fontWeight: 600 }}>
                  {gap.capabilityName}
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    color: gap.severity === "HIGH" ? "#f85149" : gap.severity === "MEDIUM" ? "#d29922" : "#8b949e",
                    backgroundColor: "rgba(248,81,73,0.1)",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    fontWeight: "bold"
                  }}
                >
                  {gap.severity}
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "#8b949e" }}>
                Required for: {gap.requiredByRoleTitle} ({gap.organizationName})
              </span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: "12px", color: "#8b949e", textTransform: "uppercase", marginBottom: "6px" }}>
          Recommended Next Steps ({nextActions.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {nextActions.map((act) => (
            <div
              key={act.actionId}
              style={{
                padding: "10px",
                backgroundColor: "#161b22",
                borderLeft: "3px solid #3fb950",
                borderTop: "1px solid #21262d",
                borderRight: "1px solid #21262d",
                borderBottom: "1px solid #21262d",
                borderRadius: "4px",
                display: "flex",
                flexDirection: "column",
                gap: "4px"
              }}
            >
              <span style={{ fontSize: "12px", color: "#3fb950", fontWeight: "bold" }}>
                {act.title}
              </span>
              <span style={{ fontSize: "11px", color: "#c9d1d9" }}>
                {act.description}
              </span>
              <span style={{ fontSize: "11px", color: "#8b949e", fontStyle: "italic" }}>
                Impact: {act.expectedImpact}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
