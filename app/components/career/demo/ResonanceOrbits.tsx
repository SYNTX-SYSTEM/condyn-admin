import React from "react";
import { DemoOrganizationMatch } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

export interface ResonanceOrbitsProps {
  companyMatches: DemoOrganizationMatch[];
}

export function ResonanceOrbits({ companyMatches }: ResonanceOrbitsProps) {
  return (
    <div
      data-testid="resonance-orbits"
      style={{
        backgroundColor: SIL_TOKENS.colors.field,
        border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
        borderRadius: "12px",
        padding: "20px",
        color: SIL_TOKENS.colors.textPrimary,
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              backgroundColor: SIL_TOKENS.colors.cyanActive
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: SIL_TOKENS.colors.cyanActive,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontWeight: 700
            }}
          >
            03. RESONANCE ORBITS ({companyMatches.length} NODES)
          </span>
        </div>
        <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
          COMPANY POOL FIT
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {companyMatches.map((org) => {
          const fitPct = Math.round(org.fitScore * 100);
          return (
            <div
              key={org.organizationId}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "14px",
                backgroundColor: "rgba(3,5,8,0.5)",
                border: `1px solid ${fitPct >= 90 ? "rgba(56, 229, 255, 0.4)" : SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "8px",
                boxShadow: fitPct >= 90 ? `0 0 14px ${SIL_TOKENS.colors.cyanGlow}` : "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "14px", color: SIL_TOKENS.colors.textPrimary, fontWeight: 700 }}>
                  {org.organizationName}
                </span>
                <span
                  style={{
                    fontSize: "12px",
                    color: fitPct >= 90 ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textPrimary,
                    fontWeight: 700,
                    backgroundColor: fitPct >= 90 ? "rgba(56, 229, 255, 0.12)" : "rgba(255, 255, 255, 0.05)",
                    border: `1px solid ${fitPct >= 90 ? "rgba(56, 229, 255, 0.3)" : SIL_TOKENS.colors.fieldBorder}`,
                    padding: "2px 8px",
                    borderRadius: "4px"
                  }}
                >
                  {`${fitPct}% Fit`}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "11px", color: SIL_TOKENS.colors.textMuted, lineHeight: 1.4 }}>
                {org.rationale}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
