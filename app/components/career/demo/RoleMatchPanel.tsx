import React from "react";
import { DemoRoleMatch } from "../../../career/demo/demo-data";

export interface RoleMatchPanelProps {
  roleMatches: DemoRoleMatch[];
}

export function RoleMatchPanel({ roleMatches }: RoleMatchPanelProps) {
  return (
    <div
      data-testid="role-match-panel"
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
        <h3 style={{ margin: 0, fontSize: "14px", color: "#f2cc60", textTransform: "uppercase", letterSpacing: "0.5px" }}>
          4. Role Matches ({roleMatches.length})
        </h3>
        <span style={{ fontSize: "11px", color: "#8b949e", backgroundColor: "#161b22", padding: "2px 6px", borderRadius: "4px" }}>
          SEMANTIC ROLE ALIGNMENT
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {roleMatches.map((role) => {
          const fitPct = Math.round(role.fitScore * 100);
          return (
            <div
              key={role.roleId}
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
                <div>
                  <span style={{ fontSize: "13px", color: "#e6edf3", fontWeight: "bold" }}>
                    {role.roleTitle}
                  </span>
                  <span style={{ fontSize: "11px", color: "#8b949e", marginLeft: "8px" }}>
                    ({role.organizationName})
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "12px",
                    color: fitPct >= 90 ? "#3fb950" : "#f2cc60",
                    fontWeight: "bold",
                    backgroundColor: "rgba(242,204,96,0.1)",
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }}
                >
                  {`${fitPct}%`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: "#8b949e", lineHeight: "1.4" }}>
                {role.rationale}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
