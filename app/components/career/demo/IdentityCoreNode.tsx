import React from "react";
import { DemoSourceItem } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

export interface IdentityCoreNodeProps {
  sources: DemoSourceItem[];
}

export function IdentityCoreNode({ sources }: IdentityCoreNodeProps) {
  return (
    <div
      data-testid="identity-core-node"
      style={{
        backgroundColor: SIL_TOKENS.colors.field,
        border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
        borderRadius: "12px",
        padding: "20px",
        color: SIL_TOKENS.colors.textPrimary,
        fontFamily: SIL_TOKENS.typography.mono,
        boxShadow: `0 0 20px ${SIL_TOKENS.colors.cyanGlow}`,
        position: "relative"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: SIL_TOKENS.colors.cyanActive,
              boxShadow: `0 0 8px ${SIL_TOKENS.colors.cyanActive}`
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
            01. IDENTITY CORE ({sources.length} SIGNATURES)
          </span>
        </div>
        <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
          VERIFIED STREAM
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {sources.map((src, idx) => (
          <div
            key={src.contentHash || idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "10px 14px",
              backgroundColor: "rgba(3,5,8,0.6)",
              border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "8px"
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "13px", color: SIL_TOKENS.colors.textPrimary, fontWeight: 600 }}>
                {src.sourceTitle}
              </span>
              {src.sourceUri && (
                <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
                  {src.sourceUri}
                </span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span
                style={{
                  fontSize: "10px",
                  color: SIL_TOKENS.colors.cyanActive,
                  backgroundColor: "rgba(56, 229, 255, 0.08)",
                  border: `1px solid rgba(56, 229, 255, 0.25)`,
                  padding: "2px 8px",
                  borderRadius: "4px",
                  textTransform: "uppercase",
                  fontWeight: 600
                }}
              >
                {src.sourceKind}
              </span>
              <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
                {src.contentHash.slice(0, 10)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
