"use client";

import React, { useEffect, useRef, useState } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SemanticCareerIntelligenceField } from "./SemanticCareerIntelligenceField";
import { SIL_TOKENS } from "./SILTokens";
import { DecisionLoopLabsMark, DLL_TEAL } from "./DecisionLoopLabsMark";
import { CAREER_DEMO_LAYOUT_CSS, applyCareerDemoHudClearance, applyCareerDemoStageFit } from "./career-demo-layout";

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
  investigationMode?: string;
  analysisJobId?: string;
  discoveryPoolUploadIds?: string[];
  roleInvestigationId?: string;
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
export function CareerIntelligenceDashboard({ data, canonicalSilAssociationId, careerDecisionContextRevisionId, decisionContextRevisionId, analysisId, jobPoolUploadId, fieldFocus, jobOrganizationId, jobRoleId, jobRequirementId, jobScopePoolUploadId, jobScopeRoleId, investigationMode, analysisJobId, discoveryPoolUploadIds, roleInvestigationId }: CareerIntelligenceDashboardProps) {
  /* The brand surface follows the active field: Decision Loop Labs in the Job Field context; the Capability context is unchanged.
     Job Pool first: the Job Field is active until the field reports a VALID job scope and an entered Capability Field. */
  const [activeField, setActiveField] = useState<"CAPABILITY" | "FIELD">("FIELD");
  /** O-PXJ-720 (PINK V-01 … V-03): the viewport tier and the planetarium's fit, written on this root (career-demo-layout.ts). */
  const rootRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const fit = () => { const root = rootRef.current; if (root) applyCareerDemoStageFit(root, window.innerWidth, window.innerHeight, root.querySelector<HTMLElement>(":scope > div")?.getBoundingClientRect().height ?? 61); };
    fit();
    window.addEventListener("resize", fit);
    // V-20: the telemetry box comes and goes with a run; its height follows its content.
    const root = rootRef.current;
    let pending = false;
    const clearance = () => { if (!root || pending) return; pending = true; requestAnimationFrame(() => { pending = false; applyCareerDemoHudClearance(root); }); };
    const observer = root && typeof MutationObserver !== "undefined" ? new MutationObserver(clearance) : null;
    if (root && observer) { observer.observe(root, { childList: true, subtree: true }); clearance(); }
    return () => { window.removeEventListener("resize", fit); observer?.disconnect(); };
  }, []);
  return (
    <div
      ref={rootRef}
      data-testid="career-intelligence-dashboard"
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "100vh",
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative"
      }}
    >
      <style>{CAREER_DEMO_LAYOUT_CSS}</style>
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
        investigationMode={investigationMode}
        analysisJobId={analysisJobId}
        discoveryPoolUploadIds={discoveryPoolUploadIds}
        roleInvestigationId={roleInvestigationId}
        onFieldFocusChange={setActiveField}
      />
    </div>
  );
}
