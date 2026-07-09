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
      </div>

      <SemanticCareerIntelligenceField data={data} />
    </div>
  );
}
