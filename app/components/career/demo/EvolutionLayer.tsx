import React from "react";
import { DemoNextAction } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

export interface EvolutionLayerProps {
  nextActions: DemoNextAction[];
}

export function EvolutionLayer({ nextActions }: EvolutionLayerProps) {
  return (
    <div
      data-testid="evolution-layer"
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
              backgroundColor: SIL_TOKENS.colors.evolutionGreen
            }}
          />
          <span
            style={{
              fontSize: "12px",
              color: SIL_TOKENS.colors.evolutionGreen,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              fontWeight: 700
            }}
          >
            06. EVOLUTION VECTORS ({nextActions.length} PATHS)
          </span>
        </div>
        <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textMuted }}>
          SYMMETRY GROWTH
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {nextActions.map((act) => (
          <div
            key={act.actionId}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              padding: "14px",
              backgroundColor: "rgba(3,5,8,0.5)",
              borderLeft: `3px solid ${SIL_TOKENS.colors.evolutionGreen}`,
              borderTop: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRight: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderBottom: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px",
              boxShadow: `0 0 12px ${SIL_TOKENS.colors.evolutionGlow}`
            }}
          >
            <span style={{ fontSize: "13px", color: SIL_TOKENS.colors.evolutionGreen, fontWeight: 700 }}>
              {act.title}
            </span>
            <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.textPrimary, lineHeight: 1.4 }}>
              {act.description}
            </span>
            <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.cyanActive, fontStyle: "italic" }}>
              Impact: {act.expectedImpact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
