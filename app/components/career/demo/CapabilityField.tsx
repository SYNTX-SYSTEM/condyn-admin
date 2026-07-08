import React from "react";
import { DemoCapabilityEvidence } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

export interface CapabilityFieldProps {
  capabilities: DemoCapabilityEvidence[];
}

export function CapabilityField({ capabilities }: CapabilityFieldProps) {
  return (
    <div
      data-testid="capability-field"
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
            02. CAPABILITY FIELD ({capabilities.length} VECTORS)
          </span>
        </div>
        <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
          SEMANTIC PROFILE
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {capabilities.map((cap, idx) => {
          const pct = Math.round((cap.evidenceConfidence || 0) * 100);
          return (
            <div
              key={cap.id || idx}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                padding: "12px 14px",
                backgroundColor: "rgba(3,5,8,0.5)",
                border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "8px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", color: SIL_TOKENS.colors.textPrimary, fontWeight: 600 }}>
                  {(cap as any).name || (cap as any).capabilityName}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span
                    style={{
                      fontSize: "10px",
                      color: SIL_TOKENS.colors.cyanActive,
                      backgroundColor: "rgba(56, 229, 255, 0.08)",
                      border: "1px solid rgba(56, 229, 255, 0.2)",
                      padding: "2px 6px",
                      borderRadius: "4px"
                    }}
                  >
                    {cap.domain}
                  </span>
                  <span
                    style={{
                      fontSize: "12px",
                      color: pct >= 90 ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textPrimary,
                      fontWeight: 700
                    }}
                  >
                    {`${pct}%`}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted, lineHeight: 1.4 }}>
                {cap.evidenceSummary}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
