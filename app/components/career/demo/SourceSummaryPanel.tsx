import React from "react";
import { DemoSourceItem } from "../../../career/demo/demo-data";

export interface SourceSummaryPanelProps {
  sources: DemoSourceItem[];
}

export function SourceSummaryPanel({ sources }: SourceSummaryPanelProps) {
  return (
    <div
      data-testid="source-summary-panel"
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
        <h3 style={{ margin: 0, fontSize: "14px", color: "#58a6ff", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          1. Ingestion Sources ({sources.length})
        </h3>
        <span style={{ fontSize: "11px", color: "#8b949e", backgroundColor: "#161b22", padding: "2px 6px", borderRadius: "4px" }}>
          VERIFIED STREAM
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {sources.map((src, index) => (
          <div
            key={index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              backgroundColor: "#161b22",
              border: "1px solid #21262d",
              borderRadius: "6px"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "12px", color: "#e6edf3", fontWeight: 600 }}>
                {src.sourceTitle}
              </span>
              {src.sourceUri && (
                <span style={{ fontSize: "11px", color: "#8b949e" }}>{src.sourceUri}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: "#3fb950",
                  backgroundColor: "rgba(63,185,80,0.15)",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  border: "1px solid rgba(63,185,80,0.4)"
                }}
              >
                {src.sourceKind}
              </span>
              <span style={{ fontSize: "10px", color: "#6e7681" }}>
                {src.contentHash.slice(0, 10)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
