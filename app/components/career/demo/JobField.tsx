"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import {
  arcPath,
  deriveJobField,
  describeRoleSelection,
  provenanceOf,
  ringSegments,
  type JobField as JobFieldModel,
  type JobFieldPending,
  type JobFieldRequirement,
  type JobFieldRequirementState,
  type JobFieldRoleNode
} from "../../../../lib/career/job-pool/job-field-presentation";
import type { JobPoolAnalysisSource } from "../../../../lib/career/job-pool/frontend-presentation";
import type { JobPoolWorkflow } from "./JobPoolMatchPanel";

/**
 * JOB focus of the planetarium: the selected Job Pool is the central, spatially
 * navigable field. Pure presentation over one delivered JobPoolMatchPresentation;
 * nothing here scores, evaluates, recommends or decides, and no path leads to
 * the HR Decision Dock. Semantic governance G1–G6 (JOB_POOL_CONNECTION.md §12).
 */
type JobFieldCopy = (typeof SIL_COPY)[SilLocale]["jobField"];

export type JobFieldState = "NO_POOL" | "NO_ANALYSIS" | "LOADING" | "AVAILABLE" | "NOT_FOUND" | "INACTIVE_POOL" | "NOT_PROVISIONED" | "FAILED";

export interface JobFieldProps {
  workflow: JobPoolWorkflow;
  analysisSource: JobPoolAnalysisSource;
  selectedRoleId: string | null;
  onSelectRole(poolRoleId: string | null): void;
  onSelectPool(jobPoolUploadId: string): void;
  onExit(): void;
  locale?: SilLocale;
}

const RED = "rgba(255, 91, 101, 0.96)";
const STATE_COLOR: Record<JobFieldRequirementState, string> = {
  MATCHED: SIL_TOKENS.colors.cyanActive,
  UNRESOLVED: SIL_TOKENS.colors.tensionAmber,
  COVERED_UNSCORED: "rgba(56, 229, 255, 0.55)",
  NO_EVIDENCE_DELIVERED: "rgba(255, 91, 101, 0.75)"
};
const mono: React.CSSProperties = { fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", color: SIL_TOKENS.colors.textPrimary, wordBreak: "break-word" };
const muted: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.textMuted };
const amber: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.tensionAmber };
const red: React.CSSProperties = { ...mono, color: RED };
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: "9px", fontWeight: 700, letterSpacing: "1px", color: SIL_TOKENS.colors.cyanActive };
const surface: React.CSSProperties = { backgroundColor: "rgba(6, 11, 18, 0.94)", border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`, borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px" };
const chip = (color: string): React.CSSProperties => ({ ...mono, color, border: `1px solid ${color}`, borderRadius: "3px", padding: "1px 5px", fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap" });
const button = (active = true): React.CSSProperties => ({ backgroundColor: active ? "rgba(56, 229, 255, 0.15)" : "transparent", border: `1px solid ${active ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)"}`, color: active ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.5)", fontFamily: SIL_TOKENS.typography.mono, fontSize: "9px", fontWeight: 700, letterSpacing: "0.5px", padding: "5px 8px", borderRadius: "4px", cursor: "pointer" });
const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const shortTitle = (title: string, max = 24): string => (title.length <= max ? title : `${title.slice(0, max - 1)}…`);

export function describeJobFieldState(workflow: JobPoolWorkflow, analysisSource: JobPoolAnalysisSource): JobFieldState {
  if (workflow.selectedJobPoolUploadId === null) return "NO_POOL";
  if (analysisSource.kind === "NONE") return "NO_ANALYSIS";
  switch (workflow.matches.state) {
    case "IDLE":
    case "LOADING": return "LOADING";
    case "AVAILABLE": return "AVAILABLE";
    case "NOT_FOUND": return "NOT_FOUND";
    case "INACTIVE_POOL": return "INACTIVE_POOL";
    case "NOT_PROVISIONED": return "NOT_PROVISIONED";
    case "FAILED": return "FAILED";
  }
}

function Quotes({ quotes }: { quotes: ReadonlyArray<{ docId: string; quote: string }> }) {
  if (quotes.length === 0) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "2px" }}>
      {quotes.map((quote, index) => <li key={`${quote.docId}:${index}`} data-testid="job-field-evidence-quote" data-doc-id={quote.docId} style={muted}><span style={{ ...mono, fontStyle: "italic" }}>“{quote.quote}”</span> · {quote.docId}</li>)}
    </ul>
  );
}

function RequirementLine({ requirement, t }: { requirement: JobFieldRequirement; t: JobFieldCopy }) {
  const provenance = provenanceOf(requirement);
  return (
    <li
      data-testid={`job-field-requirement-${requirement.poolRequirementId}`}
      data-state={requirement.state}
      data-provenance={provenance}
      data-basis={requirement.match?.basis ?? ""}
      data-sweep-basis={requirement.sweep?.matchBasis ?? ""}
      style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "5px 0", borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <span aria-hidden="true" style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: STATE_COLOR[requirement.state], border: requirement.state === "COVERED_UNSCORED" ? `1px dashed ${SIL_TOKENS.colors.cyanActive}` : undefined, flexShrink: 0 }} />
        <span style={{ ...mono, fontWeight: 700 }}>{requirement.capabilityName}</span>
        <span style={chip(STATE_COLOR[requirement.state])}>{t.requirementStates[requirement.state]}</span>
        <span style={muted}>{requirement.necessity} · w {requirement.weight}{requirement.requiredLevel ? ` · ${requirement.requiredLevel}` : ""}</span>
      </div>
      {requirement.match !== null && (
        <span style={muted}>
          {t.provenance.ANALYSIS_CAPABILITY} · <span style={mono}>{requirement.match.matchedCapabilityName}</span>{requirement.match.matchedConstituent !== null ? ` · ${t.constituent} ${requirement.match.matchedConstituent}` : ""} · {t.basis} {requirement.match.basis} · {t.confidence} {requirement.match.confidence}
        </span>
      )}
      {requirement.match !== null && <Quotes quotes={requirement.match.evidence} />}
      {requirement.weakReason !== null && <span style={amber}>{requirement.weakReason}</span>}
      {requirement.sweep !== null && (
        <span style={{ ...muted, color: SIL_TOKENS.colors.cyanActive }}>
          {t.provenance.SWEEP_PROPOSAL} · <span style={mono}>{requirement.sweep.name}</span>{requirement.sweep.matchedConstituent !== null ? ` · ${t.constituent} ${requirement.sweep.matchedConstituent}` : ""} · {t.basis} {requirement.sweep.matchBasis} · {requirement.sweep.capabilityProposalId}
        </span>
      )}
      {requirement.sweep !== null && <Quotes quotes={requirement.sweep.evidence} />}
      {provenance === "NONE" && <span style={muted}>{t.provenance.NONE}{requirement.evidenceHint !== null ? ` · ${requirement.evidenceHint}` : ""}</span>}
    </li>
  );
}

function PendingField({ roleId, pending, t }: { roleId: string; pending: readonly JobFieldPending[]; t: JobFieldCopy }) {
  return (
    <div data-testid="job-field-pending" data-role-id={roleId} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={sectionTitle}>{t.pending}</span>
      {pending.map(item => (
        <div key={item.kind} data-testid={`job-field-pending-${item.kind}`} data-count={item.ids.length} data-ids={item.ids.join(",")} style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
          <span style={{ ...mono, color: item.kind === "NO_EVIDENCE_DELIVERED" ? RED : item.kind === "UNRESOLVED_EVIDENCE" ? SIL_TOKENS.colors.tensionAmber : SIL_TOKENS.colors.cyanActive }}>
            {t.pendingKinds[item.kind]} · {item.ids.length}
          </span>
          <span style={muted}>{item.ids.length === 0 ? t.none : item.ids.join(" · ")}</span>
        </div>
      ))}
      <span data-testid="job-field-pending-reason" style={amber}>{t.canonicalReason}</span>
    </div>
  );
}

function RoleDetail({ role, t, onBack }: { role: JobFieldRoleNode; t: JobFieldCopy; onBack(): void }) {
  return (
    <section data-testid="job-field-role-detail" data-role-id={role.poolRoleId} style={surface}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <span style={{ ...mono, fontWeight: 700, fontSize: "11px" }}>{role.title}</span>
        <button data-testid="job-field-role-back" onClick={onBack} style={button(true)}>{t.back}</button>
      </div>
      <span style={muted}>{role.organizationName} ({role.poolOrganizationId}) · {role.seniority || "—"} · {role.domainFocus || "—"} · {role.poolRoleId}</span>
      <span style={muted}>{t.rank} #{role.deliveredRank} · {t.resonance} <span style={{ ...mono, color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>{percent(role.resonanceScore)}</span>{role.hasScoredMatch ? "" : ` · ${t.noScoredMatch}`}</span>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {(["MATCHED", "UNRESOLVED", "COVERED_UNSCORED", "NO_EVIDENCE_DELIVERED"] as const).map(state => (
          <span key={state} style={chip(STATE_COLOR[state])}>{t.requirementStates[state]} {role.counts[state === "MATCHED" ? "matched" : state === "UNRESOLVED" ? "unresolved" : state === "COVERED_UNSCORED" ? "coveredUnscored" : "noEvidence"]}</span>
        ))}
      </div>
      <span style={sectionTitle}>{t.relations}</span>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {role.requirements.map(requirement => <RequirementLine key={requirement.poolRequirementId} requirement={requirement} t={t} />)}
      </ul>
      <PendingField roleId={role.poolRoleId} pending={role.pending} t={t} />
    </section>
  );
}

function RoleNode({ role, selected, nearest, dimmed, t, onSelect }: { role: JobFieldRoleNode; selected: boolean; nearest: boolean; dimmed: boolean; t: JobFieldCopy; onSelect(): void }) {
  const radius = 26 + Math.min(10, role.counts.total);
  const segments = ringSegments(role.counts);
  const fill = `rgba(56, 229, 255, ${0.06 + role.resonanceScore * 0.4})`;
  return (
    <g
      data-testid={`job-field-role-${role.poolRoleId}`}
      data-delivered-rank={role.deliveredRank}
      data-resonance-score={role.resonanceScore}
      data-distance={role.distance}
      data-scored-match={role.hasScoredMatch ? "true" : "false"}
      data-nearest={nearest ? "true" : "false"}
      data-selected={selected ? "true" : "false"}
      data-matched={role.counts.matched}
      data-unresolved={role.counts.unresolved}
      data-covered-unscored={role.counts.coveredUnscored}
      data-no-evidence={role.counts.noEvidence}
      transform={`translate(${role.x} ${role.y})`}
      onClick={event => { event.stopPropagation(); onSelect(); }}
      style={{ cursor: "pointer", opacity: dimmed ? 0.35 : 1, transition: "opacity 0.35s ease" }}
    >
      <circle r={radius + 14} fill="none" stroke={selected ? SIL_TOKENS.colors.cyanActive : nearest ? "rgba(56, 229, 255, 0.45)" : "transparent"} strokeWidth={selected ? 2 : 1} strokeDasharray={nearest && !selected ? "4 4" : undefined} />
      {segments.map(segment => (
        <path key={segment.state} d={arcPath(0, 0, radius + 7, segment.startAngle + 1, segment.endAngle - 1)} fill="none" stroke={STATE_COLOR[segment.state]} strokeWidth={5} strokeDasharray={segment.state === "COVERED_UNSCORED" ? "3 3" : undefined} strokeLinecap="butt" />
      ))}
      <circle r={radius} fill={fill} stroke={role.hasScoredMatch ? SIL_TOKENS.colors.cyanActive : "rgba(255, 91, 101, 0.6)"} strokeWidth={1.2} style={{ filter: role.hasScoredMatch ? `drop-shadow(0 0 ${6 + role.resonanceScore * 10}px ${SIL_TOKENS.colors.cyanGlowStrong})` : undefined }} />
      <text textAnchor="middle" y={-2} fill={SIL_TOKENS.colors.textPrimary} fontFamily={SIL_TOKENS.typography.mono} fontSize={10} fontWeight={700}>{percent(role.resonanceScore)}</text>
      <text textAnchor="middle" y={10} fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>#{role.deliveredRank}</text>
      <text textAnchor="middle" y={radius + 24} fill={SIL_TOKENS.colors.textPrimary} fontFamily={SIL_TOKENS.typography.mono} fontSize={10} fontWeight={700}>{shortTitle(role.title)}</text>
      <text textAnchor="middle" y={radius + 36} fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{shortTitle(role.organizationName, 28)}</text>
      {!role.hasScoredMatch && <text textAnchor="middle" y={radius + 48} fill={RED} fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{t.noScoredMatch}</text>}
    </g>
  );
}

function FieldCanvas({ field, selectedRoleId, t, onSelectRole }: { field: JobFieldModel; selectedRoleId: string | null; t: JobFieldCopy; onSelectRole(poolRoleId: string | null): void }) {
  const { center, innerRadius, outerRadius, size } = field.layout;
  const nearestId = field.nearestPresentedRole?.poolRoleId ?? null;
  const nearestNode = nearestId === null ? null : field.roles.find(role => role.poolRoleId === nearestId) ?? null;
  return (
    <svg data-testid="job-field-canvas" width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", overflow: "visible" }} onClick={() => onSelectRole(null)}>
      <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(56, 229, 255, 0.18)" strokeDasharray="2 6" />
      <circle cx={center} cy={center} r={(innerRadius + outerRadius) / 2} fill="none" stroke="rgba(56, 229, 255, 0.10)" strokeDasharray="2 6" />
      <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="rgba(255, 91, 101, 0.22)" strokeDasharray="2 6" />
      <text x={center} y={center - outerRadius - 46} textAnchor="middle" fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{t.resonance} 0% · {t.noScoredMatch}</text>
      <text x={center} y={center - innerRadius - 10} textAnchor="middle" fill="rgba(56, 229, 255, 0.5)" fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{t.resonance} 100%</text>
      {field.organizations.map(organization => {
        const mid = (organization.startAngle + organization.endAngle) / 2;
        const radians = ((mid - 90) * Math.PI) / 180;
        const labelRadius = outerRadius + 64;
        return (
          <g key={organization.poolOrganizationId} data-testid={`job-field-organization-${organization.poolOrganizationId}`} data-role-count={organization.roleIds.length}>
            <path d={arcPath(center, center, outerRadius + 40, organization.startAngle + 2, organization.endAngle - 2)} fill="none" stroke="rgba(56, 229, 255, 0.28)" strokeWidth={1.5} />
            <text x={center + labelRadius * Math.cos(radians)} y={center + labelRadius * Math.sin(radians)} textAnchor="middle" dominantBaseline="middle" fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={9} letterSpacing={1}>{shortTitle(organization.name.toUpperCase(), 30)}</text>
          </g>
        );
      })}
      {nearestNode !== null && (
        <line data-testid="job-field-nearest-ray" x1={center} y1={center} x2={nearestNode.x} y2={nearestNode.y} stroke={SIL_TOKENS.colors.cyanActive} strokeWidth={1.2} strokeDasharray="6 5" opacity={0.7} />
      )}
      <g data-testid="job-field-core" data-candidate-capability-count={field.candidateCapabilityCount} data-sweep-proposal-count={field.capabilitySweep.proposalCount} transform={`translate(${center} ${center})`}>
        <circle r={54} fill="rgba(3, 5, 8, 0.9)" stroke={SIL_TOKENS.colors.cyanActive} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong})` }} />
        <circle r={62} fill="none" stroke="rgba(56, 229, 255, 0.3)" strokeDasharray="3 4" />
        <text textAnchor="middle" y={-8} fill={SIL_TOKENS.colors.cyanActive} fontFamily={SIL_TOKENS.typography.mono} fontSize={10} fontWeight={700} letterSpacing={1.5}>{t.core}</text>
        <text textAnchor="middle" y={6} fill={SIL_TOKENS.colors.textPrimary} fontFamily={SIL_TOKENS.typography.mono} fontSize={9}>{field.candidateCapabilityCount} · {field.capabilitySweep.proposalCount}</text>
        <text textAnchor="middle" y={18} fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={7}>scored · unscored</text>
      </g>
      {field.roles.map(role => (
        <RoleNode key={role.poolRoleId} role={role} selected={role.poolRoleId === selectedRoleId} nearest={role.poolRoleId === nearestId} dimmed={selectedRoleId !== null && role.poolRoleId !== selectedRoleId} t={t} onSelect={() => onSelectRole(role.poolRoleId === selectedRoleId ? null : role.poolRoleId)} />
      ))}
    </svg>
  );
}

export function JobField({ workflow, analysisSource, selectedRoleId, onSelectRole, onSelectPool, onExit, locale = SIL_COPY.defaultLocale }: JobFieldProps) {
  const t = SIL_COPY[locale].jobField;
  const state = describeJobFieldState(workflow, analysisSource);
  const field = workflow.matches.state === "AVAILABLE" ? deriveJobField(workflow.matches.matches) : null;
  const selection = field === null ? { kind: "NONE" as const } : describeRoleSelection(selectedRoleId, field);
  const nearest = field?.nearestPresentedRole ?? null;
  const nearestNode = field === null || nearest === null ? null : field.roles.find(role => role.poolRoleId === nearest.poolRoleId) ?? null;
  const listed = workflow.pools.state === "AVAILABLE" ? workflow.pools.jobPools : [];
  return (
    <div
      data-testid="job-field"
      data-field-state={state}
      data-analysis-id={analysisSource.kind === "NONE" ? "" : analysisSource.analysisId}
      data-pool-id={workflow.selectedJobPoolUploadId ?? ""}
      data-role-count={field?.roles.length ?? 0}
      data-ranking={field?.ranking ?? ""}
      data-nearest-role={nearest?.poolRoleId ?? ""}
      data-selected-role={selection.kind === "ROLE" ? selection.role.poolRoleId : ""}
      data-sweep-state={field?.capabilitySweep.state ?? ""}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.86)", backdropFilter: "blur(6px)", fontFamily: SIL_TOKENS.typography.mono, color: SIL_TOKENS.colors.textPrimary }}
    >
      {field !== null && <FieldCanvas field={field} selectedRoleId={selection.kind === "ROLE" ? selection.role.poolRoleId : null} t={t} onSelectRole={onSelectRole} />}

      <div style={{ position: "absolute", left: "24px", top: "132px", width: "300px", display: "flex", flexDirection: "column", gap: "10px", zIndex: 46 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "12px", color: SIL_TOKENS.colors.cyanActive, letterSpacing: "1px" }}>{t.title}</h3>
          <button data-testid="job-field-exit-btn" onClick={onExit} style={button(true)}>{t.exit}</button>
        </div>
        <span style={muted}>{t.subtitle}</span>
        <span data-testid="job-field-state" style={state === "AVAILABLE" ? muted : state === "FAILED" || state === "NOT_FOUND" ? red : amber}>{t.states[state]}</span>
        {state === "NO_POOL" && (
          <div data-testid="job-field-pool-selection" style={surface}>
            {listed.length === 0 && <span style={muted}>{SIL_COPY[locale].jobPool.poolsEmpty}</span>}
            {listed.map(pool => (
              <div key={pool.jobPoolUploadId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={mono}>{pool.poolName} <span style={muted}>v{pool.poolVersion} · {pool.poolStatus}</span></span>
                <button data-testid={`job-field-select-pool-${pool.jobPoolUploadId}`} onClick={() => onSelectPool(pool.jobPoolUploadId)} style={button(true)}>{t.select}</button>
              </div>
            ))}
          </div>
        )}
        {state === "NO_ANALYSIS" && <span data-testid="job-field-no-analysis" style={amber}>{t.states.NO_ANALYSIS}</span>}
        {field !== null && (
          <div data-testid="job-field-legend" style={surface}>
            <span style={muted}>{t.coreCapabilities}: <span style={mono}>{field.candidateCapabilityCount}</span> · {t.coreSweep}: <span style={mono}>{field.capabilitySweep.proposalCount}</span> ({field.capabilitySweep.state})</span>
            <span style={muted}>{t.legend}</span>
            <span style={muted}>{t.ranking[field.ranking]}</span>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {(["MATCHED", "UNRESOLVED", "COVERED_UNSCORED", "NO_EVIDENCE_DELIVERED"] as const).map(stateKey => <span key={stateKey} style={chip(STATE_COLOR[stateKey])}>{t.requirementStates[stateKey]}</span>)}
            </div>
          </div>
        )}
        {field !== null && selection.kind === "NOT_DELIVERED" && <span data-testid="job-field-role-not-delivered" style={red}>{selection.poolRoleId} · {t.states.NOT_FOUND}</span>}
      </div>

      <div style={{ position: "absolute", right: "24px", top: "132px", width: "440px", maxHeight: "calc(100vh - 180px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", zIndex: 46 }}>
        {field !== null && selection.kind === "ROLE" && <RoleDetail role={selection.role} t={t} onBack={() => onSelectRole(null)} />}
        {field !== null && selection.kind !== "ROLE" && nearestNode !== null && (
          <section data-testid="job-field-nearest" data-role-id={nearestNode.poolRoleId} style={surface}>
            <span style={sectionTitle}>{t.nearest}</span>
            <span style={{ ...mono, fontWeight: 700, fontSize: "11px" }}>{nearestNode.title} <span style={muted}>· {nearestNode.organizationName}</span></span>
            <span style={muted}>{t.rank} #{nearestNode.deliveredRank} · {t.resonance} <span style={{ ...mono, color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>{percent(nearestNode.resonanceScore)}</span></span>
            <span style={amber}>{t.nearestLabel}</span>
            <PendingField roleId={nearestNode.poolRoleId} pending={nearestNode.pending} t={t} />
            <button data-testid="job-field-open-nearest" onClick={() => onSelectRole(nearestNode.poolRoleId)} style={button(true)}>{t.open}</button>
          </section>
        )}
        {field !== null && selection.kind !== "ROLE" && nearestNode === null && (
          <section data-testid="job-field-no-nearest" style={surface}>
            <span style={sectionTitle}>{t.nearest}</span>
            <span style={red}>{t.noNearest}</span>
            <span style={amber}>{t.nearestLabel}</span>
          </section>
        )}
        <span data-testid="job-field-non-claims" style={{ ...muted, fontSize: "9px", letterSpacing: "0.5px" }}>{t.nonClaims}</span>
      </div>
    </div>
  );
}
