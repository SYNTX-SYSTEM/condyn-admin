"use client";

import React from "react";
import type { RoleDiscoveryState } from "../../../../lib/career/ui/role-discovery";
import type { JobPoolMatchPresentation } from "../../../../lib/career/job-pool/types";

/**
 * Read-only PERSON capability map.  It deliberately presents the authority
 * delivered by POOL_ROLE_DISCOVERY_V1: lexical candidates and source quotes,
 * never a semantic claim or hiring decision.
 */
export function RoleDiscoveryCapabilityMap({ state, matches = [] }: { state: RoleDiscoveryState; matches?: JobPoolMatchPresentation[] }) {
  if (state.state === "IDLE") return null;
  if (state.state !== "AVAILABLE") {
    const label = state.state === "LOADING" ? "DISCOVERING" : `ROLE DISCOVERY ${state.state}`;
    return <section data-testid="role-discovery-capability-map" data-state={state.state} style={panelStyle}>
      <strong>{label}</strong>
      {state.state === "LOADING" && <span style={mutedStyle}> · ACTIVE JOBPOOLS</span>}
    </section>;
  }

  const { discovery } = state;
  return <section data-testid="role-discovery-capability-map" data-state="AVAILABLE" style={panelStyle}>
    <div style={headingStyle}>CAPABILITY MAP // AUTOMATIC JOB DISCOVERY</div>
    <div style={mutedStyle}>
      {discovery.pools.length} ACTIVE POOL{discovery.pools.length === 1 ? "" : "S"} · {discovery.proposals.length} VERIFIED CAPABILITY PROPOSAL{discovery.proposals.length === 1 ? "" : "S"} · lexical candidates only
    </div>
    <div style={gridStyle}>
      {discovery.roles.map(role => <article key={`${role.key.jobPoolUploadId}:${role.key.poolRoleId}`} data-testid="role-discovery-role" style={cardStyle}>
        <div style={roleTitleStyle}>{role.title}</div>
        <div style={mutedStyle}>{role.organizationName} · {role.status.replaceAll("_", " ")}</div>
        <div style={mutedStyle}>{role.counts.nameRelated}/{role.counts.requirements} named requirements · {role.counts.requiredWithoutLexicalRelation} required without lexical relation</div>
        {role.requirements.map(requirement => <div key={requirement.key.poolRequirementId} data-testid="role-discovery-requirement" style={requirementStyle}>
          <span>{requirement.requirementText}</span>
          <span style={requirement.lexical.basis === "NONE" ? missingStyle : matchedStyle}>{requirement.lexical.basis.replaceAll("_", " ")}</span>
          {requirement.lexical.evidence.map((evidence, index) => <div key={`${evidence.sourceDocumentId}:${index}`} data-testid="role-discovery-evidence" style={evidenceStyle}>
            “{evidence.exactQuote}” · {evidence.sourceDocumentId}
          </div>)}
        </div>)}
      </article>)}
    </div>
    {discovery.semanticRanking && discovery.semanticRanking.length > 0 && <div data-testid="semantic-job-rankings" style={{ marginTop: "10px" }}>
      <div style={headingStyle}>SEMANTIC ROLE RANKING // PROPOSAL-ONLY</div>
      {discovery.semanticRanking.slice(0, 10).map((ranking, index) => <div key={`${ranking.jobPoolUploadId}:${ranking.poolRoleId}`} style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid rgba(255,255,255,.08)", padding: "5px 0" }}>
        <span>#{index + 1} · {ranking.poolRoleId}</span>
        <span style={{ color: ranking.score === null ? "#ffca66" : "#38ff8b" }}>{ranking.score === null ? `${ranking.evaluatedPairs}/${ranking.totalPairs} pairs` : `${Math.round(ranking.score * 100)}% · ${ranking.matched} matched`}</span>
      </div>)}
    </div>}
    {matches.length > 0 && <div data-testid="automatic-job-assignments" style={{ marginTop: "10px" }}>
      <div style={headingStyle}>AUTOMATIC JOB CANDIDATES // DETERMINISTIC PRESENTATION</div>
      {matches.flatMap(match => match.roleMatches.map(role => ({ ...role, poolId: match.jobPoolUploadId })))
        .sort((a, b) => b.resonanceScore - a.resonanceScore)
        .slice(0, 10)
        .map(role => <div key={`${role.poolId}:${role.poolRoleId}`} style={{ display: "flex", justifyContent: "space-between", gap: "10px", borderTop: "1px solid rgba(255,255,255,.08)", padding: "5px 0" }}>
          <span>{role.organizationName} · {role.title}</span><span style={{ color: "#38e5ff" }}>{Math.round(role.resonanceScore * 100)}%</span>
        </div>)}
    </div>}
    <div style={mutedStyle}>{discovery.semanticRanking ? "SEMANTIC RELATION: EXECUTED · SCORE: PRESENTATION ONLY · DECISION: NONE" : "SEMANTIC RELATION: NOT EXECUTED · SCORE: NONE · DECISION: NONE"}</div>
  </section>;
}

const panelStyle: React.CSSProperties = { position: "absolute", left: "24px", bottom: "24px", zIndex: 30, maxWidth: "min(720px, calc(100vw - 48px))", maxHeight: "42vh", overflow: "auto", padding: "14px", border: "1px solid rgba(56,229,255,.55)", borderRadius: "6px", background: "rgba(6,11,18,.94)", boxShadow: "0 0 24px rgba(56,229,255,.14)", fontSize: "11px" };
const headingStyle: React.CSSProperties = { color: "#38e5ff", fontWeight: 700, letterSpacing: "1px", marginBottom: "5px" };
const mutedStyle: React.CSSProperties = { color: "rgba(221,239,246,.7)", fontSize: "10px", marginTop: "4px" };
const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "8px", margin: "10px 0" };
const cardStyle: React.CSSProperties = { border: "1px solid rgba(56,229,255,.22)", borderRadius: "4px", padding: "8px" };
const roleTitleStyle: React.CSSProperties = { color: "#fff", fontWeight: 700 };
const requirementStyle: React.CSSProperties = { borderTop: "1px solid rgba(255,255,255,.08)", marginTop: "7px", paddingTop: "5px", display: "grid", gap: "3px" };
const matchedStyle: React.CSSProperties = { color: "#38ff8b", fontSize: "9px" };
const missingStyle: React.CSSProperties = { color: "#ffca66", fontSize: "9px" };
const evidenceStyle: React.CSSProperties = { color: "rgba(221,239,246,.78)", fontSize: "9px", lineHeight: 1.35 };

