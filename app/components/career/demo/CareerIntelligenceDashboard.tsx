"use client";

import React, { useState } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { IdentityCoreNode } from "./IdentityCoreNode";
import { CapabilityField } from "./CapabilityField";
import { ResonanceOrbits } from "./ResonanceOrbits";
import { RoleManifestation } from "./RoleManifestation";
import { TensionLayer } from "./TensionLayer";
import { EvolutionLayer } from "./EvolutionLayer";
import { SemanticCareerIntelligenceField } from "./SemanticCareerIntelligenceField";
import { SIL_TOKENS } from "./SILTokens";

export interface CareerIntelligenceDashboardProps {
  data: DemoCareerIntelligenceData;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * CAREER INTELLIGENCE FIELD (`app/components/career/demo/CareerIntelligenceDashboard.tsx`)
 *
 * Supports switching between FIELD MODE (Radial Organism) and LIST MODE (Vertical Flow).
 */
export function CareerIntelligenceDashboard({ data }: CareerIntelligenceDashboardProps) {
  const [mode, setMode] = useState<"FIELD" | "LIST">("FIELD");

  return (
    <div
      data-testid="career-intelligence-dashboard"
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "100vh",
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative"
      }}
    >
      {/* Top Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 32px",
          borderBottom: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
          backgroundColor: "rgba(3, 5, 8, 0.9)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img
            src="/logo.jpeg"
            alt="ConDyn"
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`,
              boxShadow: `0 0 10px ${SIL_TOKENS.colors.cyanActive}`
            }}
          />
          <span style={{ fontSize: "14px", fontWeight: 700, color: SIL_TOKENS.colors.cyanActive }}>
            CONDYN / SYNTX — SEMANTIC CAREER INTELLIGENCE FIELD
          </span>
        </div>

        {/* Mode Switcher */}
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setMode("FIELD")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: `1px solid ${mode === "FIELD" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              backgroundColor: mode === "FIELD" ? "rgba(56, 229, 255, 0.15)" : "transparent",
              color: mode === "FIELD" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ● FIELD MODE
          </button>
          <button
            onClick={() => setMode("LIST")}
            style={{
              padding: "6px 14px",
              borderRadius: "20px",
              border: `1px solid ${mode === "LIST" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.fieldBorder}`,
              backgroundColor: mode === "LIST" ? "rgba(56, 229, 255, 0.15)" : "transparent",
              color: mode === "LIST" ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            ○ LIST MODE
          </button>
        </div>
      </div>

      {mode === "FIELD" ? (
        <SemanticCareerIntelligenceField data={data} />
      ) : (
        <div style={{ maxWidth: "1080px", margin: "32px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
          <IdentityCoreNode sources={data.sources} />
          <CapabilityField capabilities={data.capabilities} />
          <ResonanceOrbits companyMatches={data.companyMatches} />
          <RoleManifestation roleMatches={data.roleMatches} />
          <TensionLayer capabilityGaps={data.capabilityGaps} />
          <EvolutionLayer nextActions={data.nextActions} />
        </div>
      )}
    </div>
  );
}
