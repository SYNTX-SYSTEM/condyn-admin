"use client";

import React from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SemanticCareerIntelligenceField } from "./SemanticCareerIntelligenceField";
import { SIL_TOKENS } from "./SILTokens";

export interface CareerIntelligenceDashboardProps {
  data: DemoCareerIntelligenceData;
  canonicalSilAssociationId?: string;
  careerDecisionContextRevisionId?: string;
  decisionContextRevisionId?: string;
  analysisId?: string;
  jobPoolUploadId?: string;
  fieldFocus?: "CAPABILITY" | "JOB";
  jobRoleId?: string;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * CAREER INTELLIGENCE FIELD (`app/components/career/demo/CareerIntelligenceDashboard.tsx`)
 *
 * Renders the Semantic Career Intelligence Field only. The legacy LIST-mode
 * components (IdentityCoreNode, CapabilityField, ResonanceOrbits, RoleManifestation,
 * TensionLayer, EvolutionLayer) are not mounted here: they label absent scores as
 * "UNSUPPORTED" or "0%", which the field semantics forbid (PINK finding F-JF-5).
 */
export function CareerIntelligenceDashboard({ data, canonicalSilAssociationId, careerDecisionContextRevisionId, decisionContextRevisionId, analysisId, jobPoolUploadId, fieldFocus, jobRoleId }: CareerIntelligenceDashboardProps) {
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
            src="/dll-logo.svg"
            alt="Decision Loop Labs"
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

      <SemanticCareerIntelligenceField
        data={data}
        canonicalSilAssociationId={canonicalSilAssociationId}
        careerDecisionContextRevisionId={careerDecisionContextRevisionId}
        decisionContextRevisionId={decisionContextRevisionId}
        analysisId={analysisId}
        jobPoolUploadId={jobPoolUploadId}
        fieldFocus={fieldFocus}
        jobRoleId={jobRoleId}
      />
    </div>
  );
}
