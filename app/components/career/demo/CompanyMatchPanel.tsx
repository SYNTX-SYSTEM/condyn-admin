import React from "react";
import { DemoOrganizationMatch } from "../../../career/demo/demo-data";

export interface CompanyMatchPanelProps {
  companyMatches: DemoOrganizationMatch[];
}

export function CompanyMatchPanel({ companyMatches }: CompanyMatchPanelProps) {
  return (
    <div
      data-testid="company-match-panel"
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
        <h3 style={{ margin: 0, fontSize: "14px", color: "#3fb950", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          3. Organization Matches ({companyMatches.length})
        </h3>
        <span style={{ fontSize: "11px", color: "#8b949e", backgroundColor: "#161b22", padding: "2px 6px", borderRadius: "4px" }}>
          COMPANY POOL FIT
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {companyMatches.map((org) => {
          const fitPct = Math.round(org.fitScore * 100);
          return (
            <div
              key={org.organizationId}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "10px",
                backgroundColor: "#161b22",
                border: "1px solid #21262d",
                borderRadius: "6px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: "#e6edf3", fontWeight: "bold" }}>
                  {org.organizationName}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: fitPct >= 90 ? "#3fb950" : "#d2a8ff",
                    fontWeight: "bold",
                    backgroundColor: "rgba(63,185,80,0.1)",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }}
                >
                  {`${fitPct}% Fit`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "#8b949e", lineHeight: "1.4" }}>
                {org.rationale}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
