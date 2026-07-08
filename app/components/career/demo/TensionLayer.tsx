import React from "react";
import { DemoCapabilityGap } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

export interface TensionLayerProps {
  capabilityGaps: DemoCapabilityGap[];
}

export function TensionLayer({ capabilityGaps }: TensionLayerProps) {
  return (
    <div
      data-testid="tension-layer"
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
              backgroundColor: SIL_TOKENS.colors.tensionAmber
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: SIL_TOKENS.colors.tensionAmber,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontWeight: 700
            }}
          >
            05. TENSION FIELD ({capabilityGaps.length} GAPS)
          </span>
        </div>
        <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
          SEMANTIC DISTANCE
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {capabilityGaps.map((gap, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              padding: "12px 14px",
              backgroundColor: "rgba(3,5,8,0.5)",
              borderLeft: `3px solid ${SIL_TOKENS.colors.tensionAmber}`,
              borderTop: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRight: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderBottom: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "13px", color: SIL_TOKENS.colors.textPrimary, fontWeight: 600 }}>
                {gap.capabilityName}
              </span>
              <span
                style={{
                  fontSize: "10px",
                  color: gap.severity === "HIGH" ? "#f85149" : gap.severity === "MEDIUM" ? SIL_TOKENS.colors.tensionAmber : SIL_TOKENS.colors.textMuted,
                  backgroundColor: "rgba(245, 166, 35, 0.1)",
                  border: `1px solid rgba(245, 166, 35, 0.3)`,
                  padding: "2px 6px",
                  borderRadius: "4px",
                  fontWeight: 700
                }}
              >
                {gap.severity}
              </span>
            </div>
            <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
              Required for: {gap.requiredByRoleTitle} ({gap.organizationName})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
