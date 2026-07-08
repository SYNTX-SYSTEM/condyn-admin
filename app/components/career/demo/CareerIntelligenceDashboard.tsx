import React from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SourceSummaryPanel } from "./SourceSummaryPanel";
import { CapabilityEvidencePanel } from "./CapabilityEvidencePanel";
import { CompanyMatchPanel } from "./CompanyMatchPanel";
import { RoleMatchPanel } from "./RoleMatchPanel";
import { RecommendationPanel } from "./RecommendationPanel";

export interface CareerIntelligenceDashboardProps {
  data: DemoCareerIntelligenceData;
}

/**
 * CONDYN CAREER ANALYSIS PROTOCOL v1.0
 * CAREER INTELLIGENCE DASHBOARD (`app/components/career/demo/CareerIntelligenceDashboard.tsx`)
 *
 * Scientific instrument presentation layer orchestrating 100% client-safe panels
 * explaining sources, recognized capabilities, company & role matching, gaps, and recommendations.
 */
export function CareerIntelligenceDashboard({ data }: CareerIntelligenceDashboardProps) {
  return (
    <div
      data-testid="career-intelligence-dashboard"
      style={{
        backgroundColor: "#010409",
        color: "#c9d1d9",
        minHeight: "100vh",
        padding: "24px",
        fontFamily: "var(--font-mono, monospace)"
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingBottom: "16px",
          borderBottom: "1px solid #21262d",
          marginBottom: "20px"
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: "18px", color: "#58a6ff", letterSpacing: "1px" }}>
            CONDYN Career Intelligence Instrument
          </h1>
          <span style={{ fontSize: "11px", color: "#8b949e" }}>
            Semantic Career Profile & Actionable Fit Analysis
          </span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span
            style={{
              fontSize: "11px",
              color: "#3fb950",
              backgroundColor: "rgba(63,185,80,0.15)",
              padding: "4px 8px",
              borderRadius: "4px",
              border: "1px solid rgba(63,185,80,0.4)"
            }}
          >
            ID: {data.analysisId}
          </span>
          <span style={{ fontSize: "11px", color: "#8b949e" }}>
            {data.generatedAt}
          </span>
        </div>
      </header>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "20px"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <SourceSummaryPanel sources={data.sources} />
          <CapabilityEvidencePanel capabilities={data.capabilities} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <CompanyMatchPanel companyMatches={data.companyMatches} />
          <RoleMatchPanel roleMatches={data.roleMatches} />
          <RecommendationPanel
            capabilityGaps={data.capabilityGaps}
            nextActions={data.nextActions}
          />
        </div>
      </div>
    </div>
  );
}
