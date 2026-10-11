"use client";

import React, { useMemo, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import {
  describeAnalysisSource,
  describeRanking,
  describeSelection,
  presentationLabels,
  requirementCounts,
  type JobPoolAnalysisSource
} from "../../../../lib/career/job-pool/frontend-presentation";
import { derivePoolStructure, describePoolListState, POOL_FIELD_LAYOUT, uploadOrbit, type PoolFieldStructure, type PoolFieldStructureRole } from "../../../../lib/career/job-pool/pool-field-presentation";
import { sectorPath } from "../../../../lib/career/job-pool/job-field-presentation";
import { organizationHue } from "./JobField";
import { fieldMotion, roleMotion, JOB_FIELD_MOTION_VERSION, type JobFieldMotionMode } from "../../../../lib/career/job-pool/job-field-motion";
import { useJobPoolWorkflow } from "../../../../lib/career/ui/useJobPool";
import type { JobPoolMatchedRequirement, JobPoolMissingRequirement, JobPoolRoleMatch, JobPoolSweepProposalCoverage, JobPoolUploadView, JobPoolWeakRequirement } from "../../../../lib/career/job-pool/types";

/**
 * POOL focus of the planetarium (owner mandate "SFE — SEMIONTIC JOB POOL FIELD", 2026-10-11): the Job Pool as its
 * own field state. The persisted uploads orbit a core; the explicitly selected upload sits at the core and its
 * organisations and roles manifest around it; intake, selection and the delivered presentation matching are
 * readings on the two surfaces. The DOM contract of the former control panel (every `job-pool-*` test id and
 * data attribute) is carried unchanged; the panel's root element is now the field. Nothing here scores, evaluates,
 * recommends or decides. Same motion and surface grammar as the Job Field (job-field-motion.ts, FIELD_EXTENSION_V1).
 */
type JobPoolCopy = (typeof SIL_COPY)[SilLocale]["jobPool"];

export interface JobPoolMatchPanelProps {
  /** Analysis id of this session's succeeded capability sweep (CareerJobController), if any. */
  jobResultAnalysisId?: string | null;
  /** Exact analysis id given by the product workflow (URL). Feeds only this field; it loads nothing into the planetarium. */
  analysisId?: string | null;
  /** Exact upload selected by the product workflow (URL); never inferred. */
  jobPoolUploadId?: string | null;
  locale?: SilLocale;
  initialOpen?: boolean;
}

const CYAN = SIL_TOKENS.colors.cyanActive;
const AMBER = SIL_TOKENS.colors.tensionAmber;
const RED = "rgba(255, 91, 101, 0.96)";
const RED_SOFT = "rgba(255, 91, 101, 0.55)";
const GREEN = SIL_TOKENS.colors.evolutionGreen;
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const INK = SIL_TOKENS.colors.textPrimary;
const INK_SOFT = "rgba(230, 241, 248, 0.78)";
const MUTED = SIL_TOKENS.colors.textMuted;

const mono: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", color: INK, wordBreak: "break-all" };
const muted: React.CSSProperties = { ...mono, color: MUTED };
const micro: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.3px", lineHeight: 1.55, wordBreak: "break-word" };
const label: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: MUTED, margin: 0 };
const prose: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.65, color: INK_SOFT, margin: 0 };
const title: React.CSSProperties = { fontFamily: SANS, fontSize: "20px", fontWeight: 600, letterSpacing: "-0.3px", lineHeight: 1.2, color: INK, margin: 0 };
const display: React.CSSProperties = { fontFamily: MONO, fontSize: "30px", fontWeight: 300, letterSpacing: "-1.2px", lineHeight: 1, color: CYAN };
const amber: React.CSSProperties = { ...micro, color: AMBER, opacity: 0.9 };
const red: React.CSSProperties = { ...mono, color: RED };
const green: React.CSSProperties = { ...mono, color: GREEN };
const sectionTitle: React.CSSProperties = { ...label, color: "rgba(56, 229, 255, 0.8)" };
const stack = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: `${gap}px` });
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: `${gap}px`, flexWrap: "wrap" });
const tether = (lit: boolean): React.CSSProperties => ({ height: "1px", width: "100%", background: `linear-gradient(90deg, ${lit ? "rgba(56, 229, 255, 0.7)" : "rgba(255, 91, 101, 0.45)"} 0%, transparent 100%)` });
const word = (color: string): React.CSSProperties => ({ fontFamily: MONO, fontSize: "8px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color, whiteSpace: "nowrap" });
const action = (tone: "cyan" | "muted" = "cyan", enabled = true): React.CSSProperties => ({ background: "transparent", border: "none", padding: "4px 0", fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: !enabled ? "rgba(99, 120, 138, 0.6)" : tone === "cyan" ? CYAN : MUTED, cursor: enabled ? "pointer" : "not-allowed", textShadow: enabled && tone === "cyan" ? `0 0 10px ${SIL_TOKENS.colors.cyanGlow}` : undefined, transition: "color .25s ease, text-shadow .25s ease" });
const ghost: React.CSSProperties = { ...action("muted"), fontSize: "8px", letterSpacing: "1px" };
const field: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "transparent", border: "none", borderBottom: "1px solid rgba(99, 120, 138, 0.4)", color: INK, fontFamily: MONO, fontSize: "10px", padding: "5px 0", outline: "none" };
const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const shortTitle = (text: string, max = 22): string => (text.length <= max ? text : `${text.slice(0, max - 1)}…`);

const POOL_CSS = `
@keyframes jpEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes jpRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes jpEmerge { from { opacity: 0; transform: translate(-50%, -50%) scale(0.4); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes jpBreathLight { 0%, 100% { opacity: var(--jp-lo); } 50% { opacity: var(--jp-hi); } }
@keyframes jpBreathScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(var(--jp-amp, 1.03)); } }
@keyframes jpCirculate { to { stroke-dashoffset: -60; } }
@keyframes jpPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes jpNebula { 0%, 100% { opacity: var(--jp-lo); } 50% { opacity: var(--jp-hi); } }
[data-testid="job-pool-panel"] [data-jp-reveal] { animation: jpRise .32s ease-out both; }
[data-testid="job-pool-panel"] button:hover:not(:disabled) { color: #e6f1f8; text-shadow: 0 0 12px rgba(56, 229, 255, 0.45); }
[data-testid="job-pool-panel"] button:focus-visible, [data-testid="job-pool-panel"] input:focus-visible { outline: 1px solid rgba(56, 229, 255, 0.7); outline-offset: 3px; border-radius: 2px; }
[data-testid="job-pool-panel"] input:focus { border-bottom-color: #38e5ff; }
[data-testid="job-pool-panel"] [data-jp-upload-node] { transition: left .78s cubic-bezier(.16,1,.3,1), top .78s cubic-bezier(.16,1,.3,1), opacity .4s ease; }
[data-testid="job-pool-panel"] [data-jp-upload-node] > button { transition: transform .78s cubic-bezier(.16,1,.3,1), box-shadow .5s ease, border-color .4s ease; }
[data-testid="job-pool-panel"] [data-jp-upload-node] > button:hover:not(:disabled) { transform: scale(1.06); box-shadow: 0 0 22px rgba(56, 229, 255, 0.35); }
[data-testid="job-pool-panel"] [data-jp-surface] { scrollbar-width: thin; scrollbar-color: rgba(56, 229, 255, 0.18) transparent; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="job-pool-panel"], [data-testid="job-pool-panel"] * { animation: none !important; transition: none !important; }
}
`;

function useMotionMode(): JobFieldMotionMode {
  const [mode, setMode] = useState<JobFieldMotionMode>("LIVE");
  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMode(query.matches ? "REDUCED" : "LIVE");
    apply();
    query.addEventListener?.("change", apply);
    return () => query.removeEventListener?.("change", apply);
  }, []);
  return mode;
}

function Evidence({ quotes, t }: { quotes: JobPoolMatchedRequirement["evidence"]; t: JobPoolCopy }) {
  if (quotes.length === 0) return <span style={amber}>{t.noEvidence}</span>;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(4) }}>
      {quotes.map((quote, index) => (
        <li key={`${quote.docId}:${index}`} data-testid="job-pool-evidence-quote" data-doc-id={quote.docId} style={{ ...stack(2), paddingLeft: "10px", borderLeft: "1px solid rgba(56, 229, 255, 0.35)" }}>
          <span style={{ ...prose, fontStyle: "italic", color: INK }}>“{quote.quote}”</span>
          <span style={micro}>{quote.docId}</span>
        </li>
      ))}
    </ul>
  );
}

/** Unscored coverage by a capability sweep proposal: shown with its verified quote, never as a score. */
function SweepCoverage({ testId, coverage, t }: { testId: string; coverage: JobPoolSweepProposalCoverage | null; t: JobPoolCopy }) {
  if (coverage === null) return null;
  return (
    <div data-testid={testId} data-sweep-basis={coverage.matchBasis} data-proposal-id={coverage.capabilityProposalId} data-scored="false" style={{ ...stack(4), paddingLeft: "10px", borderLeft: "1px dashed rgba(56, 229, 255, 0.5)" }}>
      <span style={{ ...micro, color: "rgba(56, 229, 255, 0.8)" }}>
        {t.sweepCovered}: <span style={{ color: INK }}>{coverage.name}</span> ({coverage.matchBasis}{coverage.matchedConstituent !== null ? ` · ${t.constituent} ${coverage.matchedConstituent}` : ""}) · {coverage.capabilityProposalId} · <span style={word(AMBER)}>{t.unscored}</span>
      </span>
      <Evidence quotes={coverage.evidence} t={t} />
    </div>
  );
}

function MatchedRow({ roleId, item, kind, t }: { roleId: string; item: JobPoolMatchedRequirement | JobPoolWeakRequirement; kind: "matched" | "weak"; t: JobPoolCopy }) {
  const color = kind === "matched" ? CYAN : AMBER;
  return (
    <li data-testid={`job-pool-role-${roleId}-${kind}-${item.poolRequirementId}`} data-match-basis={item.matchBasis} data-necessity={item.necessity} style={{ ...stack(4), padding: "6px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "8px minmax(0, 1fr)", columnGap: "10px", alignItems: "baseline" }}>
        <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: color, boxShadow: `0 0 6px ${color}`, display: "inline-block" }} />
        <span style={{ fontFamily: SANS, fontSize: "12.5px", fontWeight: 500, color: INK }}>{item.capabilityName} <span style={micro}>· {t.level} {item.requiredLevel || "—"} · {t.weight} {item.weight} · {item.necessity}</span></span>
      </div>
      <div style={{ ...stack(4), paddingLeft: "18px" }}>
        <span style={micro}>
          {t.basis} <span style={word(color)}>{item.matchBasis}</span> {t.via} <span style={{ color: INK }}>{item.matchedCapabilityName}</span>{item.matchedConstituent !== null && <> · {t.constituent} <span data-testid="job-pool-matched-constituent" style={{ color: INK }}>{item.matchedConstituent}</span></>} ({item.matchedCapabilityEntityId}) · confidence {item.confidence} · contribution {item.contribution}
        </span>
        {"reason" in item && <span style={{ ...prose, fontSize: "11px", color: AMBER }}>{item.reason}</span>}
        <span style={label}>{t.evidence}</span>
        <Evidence quotes={item.evidence} t={t} />
        <SweepCoverage testId={`job-pool-role-${roleId}-${kind}-${item.poolRequirementId}-sweep`} coverage={item.sweepProposal} t={t} />
      </div>
    </li>
  );
}

function MissingRow({ roleId, item, t }: { roleId: string; item: JobPoolMissingRequirement; t: JobPoolCopy }) {
  return (
    <li data-testid={`job-pool-role-${roleId}-missing-${item.poolRequirementId}`} data-necessity={item.necessity} style={{ ...stack(4), padding: "6px 0" }}>
      <div style={{ display: "grid", gridTemplateColumns: "8px minmax(0, 1fr)", columnGap: "10px", alignItems: "baseline" }}>
        <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", border: `1px solid ${RED_SOFT}`, display: "inline-block" }} />
        <span style={{ fontFamily: SANS, fontSize: "12.5px", fontWeight: 500, color: INK_SOFT }}>{item.capabilityName} <span style={micro}>· {t.level} {item.requiredLevel || "—"} · {t.weight} {item.weight} · {item.necessity}</span></span>
      </div>
      <div style={{ ...stack(4), paddingLeft: "18px" }}>
        {item.evidenceHint !== null && <span style={micro}>{t.hint}: {item.evidenceHint}</span>}
        <SweepCoverage testId={`job-pool-role-${roleId}-missing-${item.poolRequirementId}-sweep`} coverage={item.sweepProposal} t={t} />
      </div>
    </li>
  );
}

/** One role of the delivered matching as a reading: rank, title, resonance and counts; relations revealed on demand (in the DOM throughout). */
function RoleReading({ role, rank, t }: { role: JobPoolRoleMatch; rank: number; t: JobPoolCopy }) {
  const counts = requirementCounts(role);
  const [revealed, setRevealed] = useState(false);
  const lit = role.resonanceScore > 0 && role.matched.length > 0;
  const motion = roleMotion({ resonanceScore: role.resonanceScore, hasScoredMatch: lit, deliveredRank: rank });
  return (
    <article
      data-testid={`job-pool-role-${role.poolRoleId}`}
      data-rank={rank}
      data-resonance-score={role.resonanceScore}
      data-matched-count={counts.matched}
      data-weak-count={counts.weakEvidence}
      data-missing-count={counts.missing}
      data-sweep-covered={counts.sweepCovered}
      data-sweep-only-coverage={counts.sweepOnlyCoverage}
      data-relation-state={role.canonical.capabilityRequirementRelationState}
      data-revealed={revealed ? "true" : "false"}
      style={{ ...stack(8), padding: "12px 0" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "auto minmax(0, 1fr) auto", columnGap: "14px", alignItems: "baseline" }}>
        <span style={{ ...display, fontSize: "22px", color: lit ? CYAN : MUTED, textShadow: lit ? `0 0 ${motion.glowRadius}px rgba(56, 229, 255, ${motion.glowOpacity * 0.6})` : undefined }}>{percent(role.resonanceScore)}</span>
        <span style={stack(2)}>
          <span style={{ fontFamily: SANS, fontSize: "15px", fontWeight: 600, color: INK }}>{role.title}</span>
          <span style={micro}>#{rank} · {role.organizationName} · {role.seniority || "—"} · {role.domainFocus || "—"}</span>
        </span>
        <button data-testid={`job-pool-role-${role.poolRoleId}-toggle`} aria-expanded={revealed} onClick={() => setRevealed(value => !value)} style={ghost}>{revealed ? t.hideRole : t.revealRole}</button>
      </div>
      <div style={tether(lit)} />
      <div style={row(14)}>
        <span style={word(CYAN)}>{t.matched} <span style={{ color: INK }}>{counts.matched}</span></span>
        <span style={word(AMBER)}>{t.weakEvidence} <span style={{ color: INK }}>{counts.weakEvidence}</span></span>
        <span style={word(RED_SOFT)}>{t.missing} <span style={{ color: INK }}>{counts.missing}</span></span>
        <span data-testid={`job-pool-role-${role.poolRoleId}-sweep-only`} data-count={counts.sweepOnlyCoverage} style={{ ...word(counts.sweepOnlyCoverage > 0 ? CYAN : MUTED), opacity: counts.sweepOnlyCoverage > 0 ? 1 : 0.6 }}>{t.sweepOnlyCoverage}: <span style={{ color: INK }}>{counts.sweepOnlyCoverage}</span></span>
      </div>
      <div hidden={!revealed} data-jp-reveal={revealed ? "true" : undefined} style={{ display: revealed ? "flex" : "none", flexDirection: "column", gap: "8px" }}>
        <span style={sectionTitle}>{t.matched} ({counts.matched})</span>
        {role.matched.length === 0 ? <span style={micro}>{t.none}</span> : <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{role.matched.map(item => <MatchedRow key={item.poolRequirementId} roleId={role.poolRoleId} item={item} kind="matched" t={t} />)}</ul>}
        <span style={sectionTitle}>{t.weakEvidence} ({counts.weakEvidence})</span>
        {role.weakEvidence.length === 0 ? <span style={micro}>{t.none}</span> : <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{role.weakEvidence.map(item => <MatchedRow key={item.poolRequirementId} roleId={role.poolRoleId} item={item} kind="weak" t={t} />)}</ul>}
        <span style={sectionTitle}>{t.missing} ({counts.missing})</span>
        {role.missing.length === 0 ? <span style={micro}>{t.none}</span> : <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>{role.missing.map(item => <MissingRow key={item.poolRequirementId} roleId={role.poolRoleId} item={item} t={t} />)}</ul>}
        <div data-testid={`job-pool-role-${role.poolRoleId}-canonical`} data-relation-state={role.canonical.capabilityRequirementRelationState} data-relation-reason={role.canonical.reason} style={{ ...stack(3), paddingTop: "6px", borderTop: "1px solid rgba(99, 120, 138, 0.25)" }}>
          <span style={sectionTitle}>{t.canonicalState}</span>
          <span style={micro}>{t.roleProfile}: <span style={{ color: INK }}>{role.canonical.targetRoleProfileRevisionId}</span></span>
          <span style={micro}>{t.requirementRevisions} ({counts.canonicalRequirementRevisions}):</span>
          <span style={row(8)}>{role.canonical.targetRequirementRevisionIds.map(id => <span key={id} data-testid={`job-pool-trqrev-${id}`} style={{ ...micro, color: INK_SOFT }}>{id}</span>)}</span>
          <span style={amber}>{t.relation}: {role.canonical.capabilityRequirementRelationState} · {role.canonical.reason}</span>
        </div>
      </div>
    </article>
  );
}

function CanonicalMappingReading({ upload, t }: { upload: JobPoolUploadView; t: JobPoolCopy }) {
  const mapping = upload.canonicalMapping;
  const [open, setOpen] = useState(false);
  return (
    <div data-testid="job-pool-canonical-mapping" data-mapping-state={mapping.mappingState} data-proposal-state={mapping.proposalState} data-authority-state={mapping.authorityState} data-revealed={open ? "true" : "false"} style={stack(6)}>
      <span style={row(12)}>
        <span style={word(GREEN)}>{mapping.mappingState}</span> <span style={word(AMBER)}>{mapping.proposalState}</span> <span style={word(AMBER)}>authority {mapping.authorityState}</span>
        <button data-testid="job-pool-layer-c-toggle" aria-expanded={open} onClick={() => setOpen(value => !value)} style={ghost}>{open ? t.layerCHide : t.layerC}</button>
      </span>
      <div hidden={!open} data-jp-reveal={open ? "true" : undefined} style={{ display: open ? "flex" : "none", flexDirection: "column", gap: "6px" }}>
        <span style={sectionTitle}>{t.canonicalMapping}</span>
        <span style={micro}>{mapping.provider} · {mapping.organizations.length} TOREV · {mapping.roles.length} TRPREV · {mapping.roles.reduce((sum, role) => sum + role.requirements.length, 0)} TRQREV · raw sha256 {upload.rawSha256.slice(0, 16)}… · canonical sha256 {upload.canonicalSha256.slice(0, 16)}…</span>
        <span style={{ ...prose, fontSize: "11.5px" }}>{t.canonicalMappingBoundary}</span>
      </div>
    </div>
  );
}

function StructureRoleReading({ role, t, onBack }: { role: PoolFieldStructureRole; t: JobPoolCopy; onBack(): void }) {
  const lit = role.hasScoredMatch === true;
  return (
    <section data-testid={`job-pool-structure-role-detail`} data-role-id={role.poolRoleId} data-jp-reveal="true" style={stack(10)}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
        <span style={label}>{t.structureRole} · {role.organizationName}</span>
        <button data-testid="job-pool-structure-role-back" onClick={onBack} style={action("muted")}>{t.allRoles}</button>
      </div>
      <h4 style={title}>{role.title}</h4>
      <span style={micro}>{role.poolRoleId} · {role.poolOrganizationId} · {role.targetRoleProfileRevisionId}</span>
      <div style={tether(lit)} />
      {role.resonanceScore !== null && (
        <span style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
          <span style={{ ...display, fontSize: "22px", color: lit ? CYAN : MUTED }}>{percent(role.resonanceScore)}</span>
          <span style={{ ...label, fontSize: "8px" }}>{t.resonance} · {t.labels.DETERMINISTIC_PRESENTATION}</span>
        </span>
      )}
      <span style={sectionTitle}>{t.requirements} ({role.requirements.length})</span>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(6) }}>
        {role.requirements.map(requirement => (
          <li key={requirement.poolRequirementId} data-testid={`job-pool-structure-requirement-${requirement.poolRequirementId}`} data-necessity={requirement.necessityState} data-eligibility={requirement.matchingEligibility} style={stack(2)}>
            <span style={{ fontFamily: SANS, fontSize: "12.5px", fontWeight: 500, color: INK }}>{requirement.capabilityName}</span>
            <span style={micro}>{requirement.necessityState} · {requirement.matchingEligibility} · {requirement.targetRequirementRevisionId}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StructureCanvas({ structure, selectedRoleId, hoveredRoleId, mode, t, onSelectRole, onHoverRole }: { structure: PoolFieldStructure | null; selectedRoleId: string | null; hoveredRoleId: string | null; mode: JobFieldMotionMode; t: JobPoolCopy; onSelectRole(id: string | null): void; onHoverRole(id: string | null): void }) {
  const { size, center, coreRadius, structureRadius, organizationRadius, uploadRadius } = POOL_FIELD_LAYOUT;
  const motion = fieldMotion(mode);
  return (
    <svg data-testid="job-pool-structure-canvas" data-motion-mode={mode} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} onClick={() => onSelectRole(null)}>
      <defs>
        <filter id="jpBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="jpBlurSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        <filter id="jpNebula" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="30" /></filter>
        <radialGradient id="jpCoreGradient"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.5)" /><stop offset="55%" stopColor="rgba(56, 229, 255, 0.1)" /><stop offset="100%" stopColor="rgba(56, 229, 255, 0)" /></radialGradient>
        <radialGradient id="jpFieldGradient"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.05)" /><stop offset="70%" stopColor="rgba(56, 229, 255, 0.012)" /><stop offset="100%" stopColor="rgba(3, 5, 8, 0)" /></radialGradient>
      </defs>
      <circle cx={center} cy={center} r={uploadRadius + 60} fill="url(#jpFieldGradient)" />
      <circle cx={center} cy={center} r={uploadRadius} fill="none" stroke="rgba(56, 229, 255, 0.16)" strokeDasharray="2 6" />
      <text x={center} y={center - uploadRadius - 22} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={8} letterSpacing={1}>{t.orbit}</text>
      <circle cx={center} cy={center} r={structureRadius} fill="none" stroke="rgba(56, 229, 255, 0.1)" strokeDasharray="2 6" />
      {structure !== null && structure.organizations.map(organization => {
        const hue = organizationHue(organization.hueIndex);
        const lit = organization.aggregateScore !== null;
        const light = lit ? 0.06 + 0.3 * Math.min(1, Math.max(0, organization.aggregateScore ?? 0)) : 0.05;
        const focusedHere = organization.roleIds.some(id => id === hoveredRoleId || id === selectedRoleId);
        return (
          <path
            key={`nebula-${organization.poolOrganizationId}`}
            data-testid={`job-pool-nebula-${organization.poolOrganizationId}`}
            data-aggregate-score={organization.aggregateScore ?? ""}
            data-hue={hue}
            data-motion={lit && motion.core.periodMs > 0 ? "BREATH" : "STILL"}
            d={sectorPath(center, center, structureRadius - 48, organizationRadius + 14, organization.startAngle + 1, organization.endAngle - 1)}
            fill={`hsla(${hue}, 85%, 62%, 1)`}
            filter="url(#jpNebula)"
            style={{ opacity: light * (focusedHere ? 1.35 : 1), ["--jp-lo" as string]: light * 0.75, ["--jp-hi" as string]: light * 1.25, animation: lit && motion.core.periodMs > 0 ? `jpNebula ${motion.core.periodMs * 1.6}ms ease-in-out infinite` : undefined, transition: "opacity .4s ease", pointerEvents: "none" } as React.CSSProperties}
          />
        );
      })}
      <g data-testid="job-pool-core" data-motion="BREATH" transform={`translate(${center} ${center})`}>
        <circle r={coreRadius + 50} fill="url(#jpCoreGradient)" filter="url(#jpBlurSoft)" style={{ ["--jp-lo" as string]: 0.55, ["--jp-hi" as string]: 1, animation: motion.core.periodMs > 0 ? `jpBreathLight ${motion.core.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties} />
        <g style={{ ["--jp-amp" as string]: motion.core.amplitudeScale, animation: motion.core.periodMs > 0 ? `jpBreathScale ${motion.core.periodMs}ms ease-in-out infinite` : undefined, transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}>
          <circle r={coreRadius} fill="rgba(3, 5, 8, 0.92)" stroke={structure !== null ? CYAN : "rgba(56, 229, 255, 0.35)"} strokeWidth={1.4} style={{ filter: structure !== null ? `drop-shadow(0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong})` : undefined }} />
        </g>
        <circle r={coreRadius + 9} fill="none" stroke="rgba(56, 229, 255, 0.3)" strokeDasharray="3 5" style={{ animation: motion.sweepHalo.durationMs > 0 && structure !== null ? `jpCirculate ${motion.sweepHalo.durationMs}ms linear infinite` : undefined }} />
      </g>
      {structure !== null && structure.organizations.map(organization => {
        const focusedHere = organization.roleIds.some(id => id === hoveredRoleId || id === selectedRoleId);
        const labelPathId = `jp-label-arc-${organization.poolOrganizationId}`;
        return (
          <g key={organization.poolOrganizationId} data-testid={`job-pool-structure-organization-${organization.poolOrganizationId}`} data-role-count={organization.roleIds.length} style={{ transition: "opacity .3s ease", opacity: selectedRoleId !== null && !focusedHere ? 0.45 : 1 }}>
            <path d={organization.arc} fill="none" stroke={`hsla(${organizationHue(organization.hueIndex)}, 85%, 70%, ${focusedHere ? 0.7 : 0.28})`} strokeWidth={focusedHere ? 1.6 : 1} style={{ transition: "stroke .3s ease" }} />
            <defs><path id={labelPathId} d={organization.labelArc} /></defs>
            <text fill={focusedHere ? INK : MUTED} fontFamily={MONO} fontSize={9.5} letterSpacing={1.6} dominantBaseline="middle">
              <textPath href={`#${labelPathId}`} startOffset="50%" textAnchor="middle">{shortTitle(organization.name.toUpperCase(), 30)}</textPath>
            </text>
          </g>
        );
      })}
      {structure !== null && structure.roles.map(role => {
        const lit = role.hasScoredMatch === true;
        const light = role.resonanceScore === null ? null : roleMotion({ resonanceScore: role.resonanceScore, hasScoredMatch: lit, deliveredRank: role.deliveredRank ?? 1 }, mode);
        const radius = 16 + Math.min(8, role.requirements.length);
        const selected = role.poolRoleId === selectedRoleId;
        const focused = selected || role.poolRoleId === hoveredRoleId;
        return (
          <g
            key={role.poolRoleId}
            data-testid={`job-pool-structure-role-${role.poolRoleId}`}
            data-requirement-count={role.requirements.length}
            data-resonance-score={role.resonanceScore ?? ""}
            data-scored-match={role.hasScoredMatch === null ? "" : role.hasScoredMatch ? "true" : "false"}
            data-motion={light === null ? "UNLIT" : light.kind}
            data-selected={selected ? "true" : "false"}
            data-focused={focused ? "true" : "false"}
            transform={`translate(${role.x} ${role.y})`}
            onClick={event => { event.stopPropagation(); onSelectRole(selected ? null : role.poolRoleId); }}
            onMouseEnter={() => onHoverRole(role.poolRoleId)}
            onMouseLeave={() => onHoverRole(null)}
            style={{ cursor: "pointer", opacity: selectedRoleId !== null && !selected ? 0.35 : 1, transition: "opacity .4s ease" }}
          >
            {light !== null && light.glowRadius > 0 && <circle data-jp-light r={radius + light.glowRadius} fill={CYAN} filter="url(#jpBlur)" style={{ opacity: light.glowOpacity, ["--jp-lo" as string]: light.glowOpacity * (1 - light.amplitude), ["--jp-hi" as string]: light.glowOpacity, animation: light.periodMs > 0 ? `jpBreathLight ${light.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties} />}
            <circle r={radius + 8} fill="none" stroke={selected ? CYAN : "transparent"} strokeWidth={1.4} />
            {Array.from({ length: Math.min(12, role.requirements.length) }, (_, index) => {
              const angle = (index / Math.min(12, role.requirements.length)) * 360;
              const radians = ((angle - 90) * Math.PI) / 180;
              return <line key={index} x1={(radius + 3) * Math.cos(radians)} y1={(radius + 3) * Math.sin(radians)} x2={(radius + 6) * Math.cos(radians)} y2={(radius + 6) * Math.sin(radians)} stroke="rgba(56, 229, 255, 0.55)" strokeWidth={1.2} />;
            })}
            <circle r={radius} fill={`rgba(56, 229, 255, ${light === null ? 0.06 : light.bodyOpacity})`} stroke={light === null ? "rgba(56, 229, 255, 0.4)" : lit ? CYAN : "rgba(255, 91, 101, 0.5)"} strokeWidth={1} />
            <text textAnchor="middle" y={3} fill={INK} fontFamily={MONO} fontSize={8.5} fontWeight={700}>{role.resonanceScore === null ? role.requirements.length : percent(role.resonanceScore)}</text>
            <text textAnchor="middle" y={radius + 17} fill={lit || light === null ? INK : MUTED} fontFamily={SANS} fontSize={11} fontWeight={600}>{shortTitle(role.title, 20)}</text>
            {focused && <text textAnchor="middle" y={radius + 27} fill={MUTED} fontFamily={MONO} fontSize={7.5}>{role.requirements.length} {t.requirements.toLowerCase()}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export type JobPoolWorkflow = ReturnType<typeof useJobPoolWorkflow>;

export interface JobPoolMatchPanelViewProps {
  workflow: JobPoolWorkflow;
  analysisSource: JobPoolAnalysisSource;
  jobPoolUploadId?: string | null;
  locale?: SilLocale;
  initialOpen?: boolean;
  /** Controlled field state (POOL focus of the planetarium). When omitted the view keeps its own open state. */
  open?: boolean;
  onOpenChange?(open: boolean): void;
  /** Whether the view renders its own toggle while closed; the planetarium renders the switch in its field-state strip instead. */
  showToggle?: boolean;
  /** Switch to the JOB focus of the planetarium from inside the Pool Field (when a matching was delivered). */
  onEnterJobField?(): void;
}

/** Owns the workflow hook; the SIL field uses the View with a lifted hook so the Job Field shares one read. */
export function JobPoolMatchPanel({ jobResultAnalysisId = null, analysisId = null, jobPoolUploadId = null, locale = SIL_COPY.defaultLocale, initialOpen }: JobPoolMatchPanelProps) {
  const analysisSource = describeAnalysisSource(jobResultAnalysisId, analysisId);
  const workflow = useJobPoolWorkflow({ analysisId: analysisSource.kind === "NONE" ? null : analysisSource.analysisId, initialJobPoolUploadId: jobPoolUploadId });
  return <JobPoolMatchPanelView workflow={workflow} analysisSource={analysisSource} jobPoolUploadId={jobPoolUploadId} locale={locale} initialOpen={initialOpen} />;
}

export function JobPoolMatchPanelView({ workflow, analysisSource, jobPoolUploadId = null, locale = SIL_COPY.defaultLocale, initialOpen, open, onOpenChange, showToggle = true, onEnterJobField }: JobPoolMatchPanelViewProps) {
  const t = SIL_COPY[locale].jobPool;
  const mode = useMotionMode();
  const motion = fieldMotion(mode);
  const effectiveAnalysisId = analysisSource.kind === "NONE" ? null : analysisSource.analysisId;
  const [ownOpen, setOwnOpen] = useState<boolean>(initialOpen ?? (jobPoolUploadId !== null && jobPoolUploadId.length > 0));
  const isOpen = open ?? ownOpen;
  const setOpen = (next: boolean) => { if (open === undefined) setOwnOpen(next); onOpenChange?.(next); };
  const [actorId, setActorId] = useState("JOB_POOL_UPLOADER_LOCAL");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const [structureRoleId, setStructureRoleId] = useState<string | null>(null);
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const selectPool = (id: string) => {
    workflow.select(id);
    setStructureRoleId(null);
    if (typeof window !== "undefined" && typeof window.history?.replaceState === "function") {
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("jobPoolUploadId", id);
        window.history.replaceState(window.history.state, "", url.toString());
      } catch { /* navigation state is a convenience, never a requirement */ }
    }
  };

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setFileName(null); setFileText(null); return; }
    setFileName(file.name);
    setFileText(await file.text());
  };

  const listed = workflow.pools.state === "AVAILABLE" ? workflow.pools.jobPools : [];
  const listState = describePoolListState(workflow.pools);
  const selection = describeSelection(workflow.selectedJobPoolUploadId, listed);
  const canUpload = fileText !== null && workflow.upload.state !== "SUBMITTING";
  const orbit = useMemo(() => uploadOrbit(listed, workflow.selectedJobPoolUploadId), [listed, workflow.selectedJobPoolUploadId]);
  const matching = workflow.matches.state === "AVAILABLE" ? workflow.matches.matches : null;
  const structure = useMemo(() => (workflow.view.state === "AVAILABLE" ? derivePoolStructure(workflow.view.upload, matching) : null), [workflow.view, matching]);
  const structureRole = structure?.roles.find(role => role.poolRoleId === structureRoleId) ?? null;
  const selectedNode = orbit.find(node => node.selected) ?? null;

  if (!isOpen) {
    if (!showToggle) return null;
    return (
      <button
        data-testid="job-pool-panel-toggle"
        data-field-focus-active="false"
        onClick={() => setOpen(true)}
        style={{ position: "fixed", left: "24px", top: "132px", zIndex: 50, backgroundColor: "rgba(10, 14, 20, 0.85)", border: `1px solid ${CYAN}`, borderRadius: "8px", padding: "8px 14px", color: CYAN, fontFamily: MONO, fontSize: "11px", cursor: "pointer", boxShadow: `0 0 12px ${SIL_TOKENS.colors.cyanGlow}` }}
      >
        {t.toggleOpen}
      </button>
    );
  }

  const stateTone = listState === "AVAILABLE" ? CYAN : listState === "FAILED" ? RED : AMBER;
  const inputStyle = field;
  return (
    <section
      data-testid="job-pool-panel"
      data-pools-state={workflow.pools.state}
      data-upload-state={workflow.upload.state}
      data-selection-kind={selection.kind}
      data-selected-pool={workflow.selectedJobPoolUploadId ?? ""}
      data-view-state={workflow.view.state}
      data-analysis-source={analysisSource.kind}
      data-analysis-id={effectiveAnalysisId ?? ""}
      data-matches-state={workflow.matches.state}
      data-field-grammar="POOL_FIELD_V1"
      data-surface-grammar="FIELD_EXTENSION_V1"
      data-galaxy-grammar="GALAXY_V1"
      data-motion-grammar={JOB_FIELD_MOTION_VERSION}
      data-motion-mode={mode}
      data-structure-role={structureRole?.poolRoleId ?? ""}
      data-upload-count={orbit.length}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.9)", backdropFilter: "blur(8px)", fontFamily: MONO, color: INK, animation: motion.enterMs > 0 ? `jpEnter ${motion.enterMs}ms ease-out both` : undefined }}
    >
      <style>{POOL_CSS}</style>

      {/* The orbit: structure canvas (SVG) beneath, upload nodes (HTML, positioned by the same geometry) above. */}
      <div data-testid="job-pool-orbit" style={{ position: "absolute", top: "50%", left: "calc(50% - 64px)", transform: "translate(-50%, -50%)", width: "min(88vh, 50vw, 760px)", height: "min(88vh, 50vw, 760px)" }}>
        <StructureCanvas structure={structure} selectedRoleId={structureRoleId} hoveredRoleId={hoveredRoleId} mode={mode} t={t} onSelectRole={setStructureRoleId} onHoverRole={setHoveredRoleId} />
        <div data-testid="job-pool-list" data-pool-count={listed.length} data-list-state={listState} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {(workflow.pools.state === "IDLE" || workflow.pools.state === "LOADING") && <span data-testid="job-pool-list-loading" style={{ ...micro, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "120px", color: AMBER, animation: motion.enterMs > 0 ? "jpPulse 1.4s ease-in-out infinite" : undefined }}>{t.poolsLoading}</span>}
          {workflow.pools.state === "EMPTY" && <span data-testid="job-pool-list-empty" style={{ ...micro, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "120px" }}>{t.poolsEmpty}</span>}
          {workflow.pools.state === "NOT_PROVISIONED" && <span data-testid="job-pool-list-not-provisioned" style={{ ...micro, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "140px", color: AMBER }}>{t.notProvisioned}</span>}
          {workflow.pools.state === "FAILED" && <span data-testid="job-pool-list-failed" style={{ ...micro, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "140px", color: RED }}>{t.poolsFailed}{workflow.pools.code ? ` · ${workflow.pools.code}` : ""}</span>}
          {workflow.pools.state === "AVAILABLE" && selectedNode === null && <span style={{ ...micro, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", width: "110px" }}>{t.coreEmpty}<br /><span style={{ opacity: 0.7 }}>{t.coreHint}</span></span>}
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {orbit.map(node => {
              const draft = node.poolStatus !== "ACTIVE";
              const delay = motion.enterMs > 0 ? Math.min(1600, 90 * (node.deliveredIndex - 1)) : 0;
              return (
                <li
                  key={node.jobPoolUploadId}
                  data-testid={`job-pool-item-${node.jobPoolUploadId}`}
                  data-selected={node.selected ? "true" : "false"}
                  data-pool-status={node.poolStatus}
                  data-at-core={node.selected ? "true" : "false"}
                  data-delivered-index={node.deliveredIndex}
                  data-jp-upload-node
                  style={{ position: "absolute", left: `${(node.x / POOL_FIELD_LAYOUT.size) * 100}%`, top: `${(node.y / POOL_FIELD_LAYOUT.size) * 100}%`, pointerEvents: "auto", zIndex: node.selected ? 2 : 1 }}
                >
                  <button
                    data-testid={`job-pool-select-${node.jobPoolUploadId}`}
                    onClick={() => selectPool(node.jobPoolUploadId)}
                    disabled={node.selected}
                    aria-pressed={node.selected}
                    title={`${node.jobPoolUploadId} · ${node.organizationCount} org · ${node.roleCount} roles · ${node.requirementCount} req`}
                    style={{ position: "absolute", left: 0, top: 0, transform: `translate(-50%, -50%) scale(${node.selected ? 1.18 : 1})`, width: node.selected ? "118px" : "88px", height: node.selected ? "118px" : "88px", borderRadius: "50%", background: node.selected ? "rgba(3, 5, 8, 0.6)" : "rgba(6, 11, 18, 0.9)", border: `1px ${draft ? "dashed" : "solid"} ${node.selected ? CYAN : draft ? "rgba(245, 166, 35, 0.6)" : "rgba(56, 229, 255, 0.45)"}`, boxShadow: node.selected ? `0 0 34px rgba(56, 229, 255, 0.4)` : undefined, color: INK, fontFamily: MONO, cursor: node.selected ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "3px", padding: "6px", animation: motion.enterMs > 0 ? `jpEmerge 760ms cubic-bezier(.2,.8,.2,1) ${delay}ms both` : undefined }}
                  >
                    <span style={{ fontFamily: SANS, fontSize: node.selected ? "11px" : "10px", fontWeight: 600, color: INK, lineHeight: 1.2, textAlign: "center", maxWidth: "78px", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>{node.poolName}</span>
                    <span style={{ ...micro, color: draft ? AMBER : MUTED }}>v{node.poolVersion} · {node.poolStatus}</span>
                    <span style={{ ...micro, fontSize: "7.5px", opacity: 0.8 }}>{node.roleCount} roles · {node.requirementCount} req</span>
                    <span style={{ ...word(node.selected ? CYAN : "rgba(56, 229, 255, 0.6)"), fontSize: "7px" }}>{node.selected ? t.selected : t.select}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div aria-hidden="true" data-jp-veil="left" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: "min(380px, 32vw)", background: "linear-gradient(90deg, rgba(3, 5, 8, 0.96) 0%, rgba(3, 5, 8, 0.72) 55%, rgba(3, 5, 8, 0) 100%)", pointerEvents: "none", zIndex: 45 }} />
      <div aria-hidden="true" data-jp-veil="right" style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: "min(560px, 42vw)", background: "linear-gradient(270deg, rgba(3, 5, 8, 0.97) 0%, rgba(3, 5, 8, 0.8) 60%, rgba(3, 5, 8, 0) 100%)", pointerEvents: "none", zIndex: 45 }} />

      {/* Left surface: title, state, analysis, intake. */}
      <div data-jp-surface="left" style={{ position: "absolute", left: "28px", top: "136px", width: "min(284px, 25vw)", maxHeight: "calc(100vh - 200px)", overflowY: "auto", ...stack(14), zIndex: 46 }}>
        <div style={stack(6)}>
          <h3 style={{ ...label, color: CYAN, fontSize: "10px", letterSpacing: "2.4px", textShadow: `0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong}` }}>{t.title}</h3>
          <span style={{ ...micro, opacity: 0.8 }}>{t.fieldSubtitle}</span>
          <button data-testid="job-pool-panel-collapse" onClick={() => setOpen(false)} style={{ ...action("muted"), alignSelf: "flex-start" }}>{t.collapse}</button>
          <span data-testid="job-pool-list-state" data-list-state={listState} style={{ ...micro, display: "inline-flex", alignItems: "center", gap: "8px", color: listState === "AVAILABLE" ? MUTED : stateTone }}>
            <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: stateTone, boxShadow: `0 0 8px ${stateTone}`, flexShrink: 0, animation: listState === "LOADING" && motion.enterMs > 0 ? "jpPulse 1.4s ease-in-out infinite" : undefined }} />
            {listState === "AVAILABLE" ? `${t.pools} · ${listed.length}` : listState === "LOADING" ? t.poolsLoading : listState === "EMPTY" ? t.poolsEmpty : listState === "NOT_PROVISIONED" ? t.notProvisioned : t.poolsFailed}
          </span>
        </div>

        <section data-testid="job-pool-analysis" data-analysis-source={analysisSource.kind} style={stack(4)}>
          <span style={label}>{t.analysis}</span>
          {analysisSource.kind === "NONE" && <span data-testid="job-pool-analysis-none" style={{ ...prose, fontSize: "10.5px", color: AMBER }}>{t.analysisNone}</span>}
          {analysisSource.kind !== "NONE" && (
            <>
              <span style={{ ...mono, color: INK }}>{analysisSource.analysisId}</span>
              <span style={micro}>{analysisSource.kind === "JOB_RESULT" ? t.analysisFromJob : t.analysisFromUrl}</span>
            </>
          )}
        </section>

        <section data-testid="job-pool-upload" style={stack(8)}>
          <span style={label}>{t.intake} · {t.upload}</span>
          <label style={{ ...micro, ...stack(2) }}>{t.uploader}
            <input data-testid="job-pool-actor-input" value={actorId} onChange={event => setActorId(event.target.value)} style={inputStyle} />
          </label>
          <label style={{ ...micro, ...stack(2) }}>{t.chooseFile}
            <input data-testid="job-pool-file-input" type="file" accept="application/json,.json" onChange={event => { void onFile(event); }} style={{ ...inputStyle, fontSize: "9px", color: MUTED }} />
          </label>
          <span data-testid="job-pool-file-name" style={micro}>{fileName ?? t.noFile}</span>
          <button data-testid="job-pool-upload-btn" disabled={!canUpload} onClick={() => { if (fileText !== null) void workflow.submitUpload(fileText, actorId); }} style={{ ...action("cyan", canUpload), alignSelf: "flex-start" }}>
            {workflow.upload.state === "SUBMITTING" ? t.submitting : `${t.submit} →`}
          </button>
          {(workflow.upload.state === "CREATED" || workflow.upload.state === "IDENTICAL_EXISTS") && (
            <div data-testid="job-pool-upload-result" data-upload-outcome={workflow.upload.state} data-upload-id={workflow.upload.upload.jobPoolUploadId} data-jp-reveal="true" style={stack(3)}>
              <span style={{ ...word(GREEN), whiteSpace: "normal" }}>{workflow.upload.state === "CREATED" ? t.uploadCreated : t.uploadIdentical}</span>
              <span style={{ ...mono, color: INK }}>{workflow.upload.upload.jobPoolUploadId}</span>
              <span style={micro}>{workflow.upload.upload.poolName} v{workflow.upload.upload.poolVersion} · {workflow.upload.upload.poolStatus} · raw sha256 {workflow.upload.upload.rawSha256.slice(0, 16)}…</span>
              {workflow.selectedJobPoolUploadId !== workflow.upload.upload.jobPoolUploadId && <span style={amber}>{t.uploadNotSelected}</span>}
            </div>
          )}
          {workflow.upload.state === "REJECTED" && (
            <div data-testid="job-pool-upload-rejected" data-rejection-code={workflow.upload.code} data-rejection-status={workflow.upload.status} data-jp-reveal="true" style={stack(3)}>
              <span style={red}>{t.uploadRejected} · HTTP {workflow.upload.status} · {workflow.upload.code}</span>
              <span style={micro}>{workflow.upload.message}</span>
              {workflow.upload.issues.map((issue, index) => <span key={`${issue.path}:${index}`} data-testid="job-pool-upload-issue" style={micro}>{issue.path || "(root)"}: {issue.message}</span>)}
            </div>
          )}
          {workflow.upload.state === "NOT_PROVISIONED" && <span data-testid="job-pool-upload-not-provisioned" style={amber}>{t.notProvisioned}</span>}
          {workflow.upload.state === "FAILED" && <span data-testid="job-pool-upload-failed" style={red}>{t.uploadFailed}{workflow.upload.code ? ` · ${workflow.upload.code}` : ""}</span>}
        </section>
      </div>

      {/* Right surface: the selected upload (core reading), the pool structure, the delivered matching. */}
      <div data-jp-surface="right" style={{ position: "absolute", right: "32px", top: "136px", width: "min(420px, 32vw)", maxHeight: "calc(100vh - 200px)", overflowY: "auto", paddingRight: "6px", ...stack(18), zIndex: 46 }}>
        <section data-testid="job-pool-selected" data-selection-kind={selection.kind} style={stack(8)}>
          <span style={sectionTitle}>{t.selectedPool}</span>
          {selection.kind === "NONE" && <span data-testid="job-pool-selection-none" style={{ ...prose, fontSize: "10.5px" }}>{t.selectionNone}</span>}
          {selection.kind === "NOT_LISTED" && <span data-testid="job-pool-selection-not-listed" style={{ ...prose, fontSize: "10.5px", color: AMBER }}>{t.selectionNotListed} · {selection.jobPoolUploadId}</span>}
          {selection.kind !== "NONE" && (
            <>
              {workflow.view.state === "LOADING" && <span style={micro}>{t.viewLoading}</span>}
              {workflow.view.state === "NOT_FOUND" && <span data-testid="job-pool-view-not-found" style={red}>{t.viewNotFound} · {workflow.view.jobPoolUploadId}</span>}
              {workflow.view.state === "NOT_PROVISIONED" && <span style={amber}>{t.notProvisioned}</span>}
              {workflow.view.state === "FAILED" && <span data-testid="job-pool-view-failed" style={red}>{t.viewFailed}{workflow.view.code ? ` · ${workflow.view.code}` : ""}</span>}
              {workflow.view.state === "AVAILABLE" && structure !== null && (
                <div data-jp-reveal="true" style={stack(8)}>
                  <h4 style={title}>{workflow.view.upload.poolName} <span style={{ ...micro, fontSize: "10px" }}>v{workflow.view.upload.poolVersion} · {workflow.view.upload.poolStatus}</span></h4>
                  <span style={{ ...mono, color: INK_SOFT }}>{workflow.view.upload.jobPoolUploadId}</span>
                  <div style={tether(true)} />
                  <span style={row(16)}>
                    <span style={{ display: "flex", flexDirection: "column-reverse", gap: "2px" }}><span style={{ ...micro, fontSize: "7.5px", letterSpacing: "1px" }}>ORG</span><span style={{ ...display, fontSize: "20px", color: INK_SOFT }}>{structure.organizations.length}</span></span>
                    <span style={{ display: "flex", flexDirection: "column-reverse", gap: "2px" }}><span style={{ ...micro, fontSize: "7.5px", letterSpacing: "1px" }}>ROLES</span><span style={{ ...display, fontSize: "20px", color: INK_SOFT }}>{structure.roles.length}</span></span>
                    <span style={{ display: "flex", flexDirection: "column-reverse", gap: "2px" }}><span style={{ ...micro, fontSize: "7.5px", letterSpacing: "1px" }}>REQ</span><span style={{ ...display, fontSize: "20px", color: INK_SOFT }}>{structure.requirementCount}</span></span>
                  </span>
                  <span style={micro}>{t.structure} · {t.structureHint}</span>
                  <CanonicalMappingReading upload={workflow.view.upload} t={t} />
                </div>
              )}
            </>
          )}
        </section>

        {structureRole !== null && <StructureRoleReading role={structureRole} t={t} onBack={() => setStructureRoleId(null)} />}

        <section data-testid="job-pool-matches" data-matches-state={workflow.matches.state} data-ranking={workflow.matches.state === "AVAILABLE" ? describeRanking(workflow.matches.matches.roleMatches) : ""} style={stack(10)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px" }}>
            <span style={sectionTitle}>{t.matches}</span>
            {workflow.matches.state === "AVAILABLE" && onEnterJobField !== undefined && <button data-testid="job-pool-enter-job-field" onClick={onEnterJobField} style={action("cyan")}>{t.enterJobField}</button>}
          </div>
          {workflow.matches.state === "IDLE" && <span data-testid="job-pool-matches-idle" style={{ ...prose, fontSize: "10.5px" }}>{t.matchesIdle}</span>}
          {workflow.matches.state === "LOADING" && <span style={micro}>{t.matchesLoading}</span>}
          {workflow.matches.state === "NOT_FOUND" && <span data-testid="job-pool-matches-not-found" style={red}>{t.matchesNotFound}{workflow.matches.code ? ` · ${workflow.matches.code}` : ""}{workflow.matches.message ? ` · ${workflow.matches.message}` : ""}</span>}
          {workflow.matches.state === "INACTIVE_POOL" && <span data-testid="job-pool-matches-inactive" style={{ ...prose, fontSize: "10.5px", color: AMBER }}>{t.matchesInactive}{workflow.matches.message ? ` · ${workflow.matches.message}` : ""}</span>}
          {workflow.matches.state === "NOT_PROVISIONED" && <span data-testid="job-pool-matches-not-provisioned" style={amber}>{t.notProvisioned}</span>}
          {workflow.matches.state === "FAILED" && <span data-testid="job-pool-matches-failed" style={red}>{t.matchesFailed}{workflow.matches.code ? ` · ${workflow.matches.code}` : ""}</span>}
          {workflow.matches.state === "AVAILABLE" && (() => {
            const presentation = workflow.matches.matches;
            const ranking = describeRanking(presentation.roleMatches);
            return (
              <div data-jp-reveal="true" style={stack(10)}>
                <div data-testid="job-pool-presentation-labels" data-policy-version={presentation.presentation.policyVersion} data-authority-state={presentation.presentation.authorityState} style={row(12)}>
                  {presentationLabels(presentation.presentation).map(item => <span key={item} data-testid={`job-pool-label-${item}`} style={word(AMBER)}>{t.labels[item]}</span>)}
                </div>
                <span data-testid="job-pool-ranking" data-ranking={ranking} style={{ ...micro, color: ranking === "DELIVERED_ORDER_NOT_MONOTONE" ? AMBER : MUTED }}>{t.ranking[ranking]}</span>
                <button data-testid="job-pool-matching-details-toggle" aria-expanded={detailsOpen} onClick={() => setDetailsOpen(value => !value)} style={{ ...ghost, alignSelf: "flex-start" }}>{detailsOpen ? t.matchingDetailsHide : t.matchingDetails}</button>
                <div data-testid="job-pool-matching-details" hidden={!detailsOpen} data-jp-reveal={detailsOpen ? "true" : undefined} style={{ display: detailsOpen ? "flex" : "none", flexDirection: "column", gap: "8px" }}>
                  <span style={micro}>{presentation.presentation.kind} · {presentation.presentation.policyVersion} · authority {presentation.presentation.authorityState} · canonicalEvaluation {String(presentation.presentation.canonicalEvaluation)} · decision {String(presentation.presentation.decision)}</span>
                  <span style={micro}>{t.candidateCapabilities} {presentation.candidateCapabilityCount} · {t.weakThreshold} {presentation.presentation.weakEvidenceThreshold} · {presentation.poolId} v{presentation.poolVersion}</span>
                  <div data-testid="job-pool-capability-sweep" data-sweep-state={presentation.capabilitySweep.state} data-proposal-count={presentation.capabilitySweep.proposalCount} data-scored="false" style={{ ...stack(4), padding: "8px 0", borderTop: "1px dashed rgba(99, 120, 138, 0.3)", borderBottom: "1px dashed rgba(99, 120, 138, 0.3)" }}>
                    <span style={sectionTitle}>{t.sweep}</span>
                    <span style={{ ...micro, color: presentation.capabilitySweep.state === "FAILED" ? RED : presentation.capabilitySweep.state === "NOT_PRODUCED" ? AMBER : MUTED }}>{t.sweepStates[presentation.capabilitySweep.state]} · {t.sweepProposals} {presentation.capabilitySweep.proposalCount} · <span style={word(AMBER)}>{t.unscored}</span></span>
                    <span style={{ ...prose, fontSize: "11.5px" }}>{t.sweepBoundary}</span>
                  </div>
                  <span style={{ ...prose, fontSize: "11.5px" }}>{t.missingBoundary}</span>
                  <div data-testid="job-pool-organizations" style={stack(4)}>
                    <span style={sectionTitle}>{t.organizations}</span>
                    {presentation.organizationMatches.map(organization => (
                      <span key={organization.poolOrganizationId} data-testid={`job-pool-organization-${organization.poolOrganizationId}`} style={micro}>
                        <span style={{ color: INK }}>{organization.name}</span> · {organization.industry || "—"} · {percent(organization.aggregateScore)} · {organization.roleCount} roles · top: {organization.topRoleTitle ?? "—"}
                      </span>
                    ))}
                  </div>
                </div>
                <div data-testid="job-pool-role-list" data-role-count={presentation.roleMatches.length} style={stack(2)}>
                  {presentation.roleMatches.map((role, index) => <RoleReading key={role.poolRoleId} role={role} rank={index + 1} t={t} />)}
                </div>
              </div>
            );
          })()}
        </section>
      </div>

      <span data-testid="job-pool-non-claims" style={{ position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 22px)", transform: "translateX(-50%)", maxWidth: "min(900px, 80vw)", textAlign: "center", ...micro, fontSize: "8.5px", letterSpacing: "1.4px", color: "rgba(230, 241, 248, 0.55)", zIndex: 46 }}>{t.nonClaims}</span>
    </section>
  );
}
