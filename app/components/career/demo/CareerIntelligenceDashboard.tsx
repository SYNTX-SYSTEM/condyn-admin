"use client";

import React, { useState } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SemanticCareerIntelligenceField } from "./SemanticCareerIntelligenceField";
import { SIL_TOKENS } from "./SILTokens";
import { DecisionLoopLabsMark, DLL_TEAL } from "./DecisionLoopLabsMark";

export interface CareerIntelligenceDashboardProps {
  data: DemoCareerIntelligenceData;
  canonicalSilAssociationId?: string;
  careerDecisionContextRevisionId?: string;
  decisionContextRevisionId?: string;
  analysisId?: string;
  jobPoolUploadId?: string;
  fieldFocus?: "CAPABILITY" | "FIELD";
  jobOrganizationId?: string;
  jobRoleId?: string;
  jobRequirementId?: string;
  jobScopePoolUploadId?: string;
  jobScopeRoleId?: string;
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
export function CareerIntelligenceDashboard({ data, canonicalSilAssociationId, careerDecisionContextRevisionId, decisionContextRevisionId, analysisId, jobPoolUploadId, fieldFocus, jobOrganizationId, jobRoleId, jobRequirementId, jobScopePoolUploadId, jobScopeRoleId }: CareerIntelligenceDashboardProps) {
  /* The brand surface follows the active field: Decision Loop Labs in the Job Field context; the Capability context is unchanged. */
  const [activeField, setActiveField] = useState<"CAPABILITY" | "FIELD">(fieldFocus ?? (jobPoolUploadId && jobPoolUploadId.length > 0 ? "FIELD" : "CAPABILITY"));
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
        {activeField === "FIELD" ? (
          <div data-testid="shell-brand-dll" data-sx-brand="dll" style={{ display: "flex", alignItems: "center", gap: "14px", height: "28px" }}>
            <DecisionLoopLabsMark width={56} idPrefix="sx-header-dll" weight={14} />
            <span style={{ fontSize: "14px", fontWeight: 700, color: SIL_TOKENS.colors.cyanActive, display: "inline-flex", alignItems: "baseline", gap: "10px" }}>
              <span style={{ fontFamily: SIL_TOKENS.typography.sans, fontSize: "14.5px", fontWeight: 600, letterSpacing: "2.6px", color: "#c8fbfc", textShadow: `0 0 14px ${DLL_TEAL(0.45)}` }}>DECISION LOOP LABS</span>
              <span style={{ color: "rgba(56, 229, 255, 0.78)" }}>/ SYNTX — SEMANTIC CAREER INTELLIGENCE FIELD</span>
            </span>
          </div>
        ) : (
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
        )}
      </div>

      <SemanticCareerIntelligenceField
        data={data}
        canonicalSilAssociationId={canonicalSilAssociationId}
        careerDecisionContextRevisionId={careerDecisionContextRevisionId}
        decisionContextRevisionId={decisionContextRevisionId}
        analysisId={analysisId}
        jobPoolUploadId={jobPoolUploadId}
        fieldFocus={fieldFocus}
        jobOrganizationId={jobOrganizationId}
        jobRoleId={jobRoleId}
        jobRequirementId={jobRequirementId}
        jobScopePoolUploadId={jobScopePoolUploadId}
        jobScopeRoleId={jobScopeRoleId}
        onFieldFocusChange={setActiveField}
      />
    </div>
  );
}
