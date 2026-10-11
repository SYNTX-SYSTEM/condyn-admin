"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  type JobFieldPendingKind,
  type JobFieldRequirement,
  type JobFieldRequirementState,
  type JobFieldRoleNode
} from "../../../../lib/career/job-pool/job-field-presentation";
import {
  fieldMotion,
  pendingRings,
  roleMotion,
  segmentMotion,
  JOB_FIELD_MOTION_VERSION,
  type JobFieldMotionMode
} from "../../../../lib/career/job-pool/job-field-motion";
import type { JobPoolAnalysisSource } from "../../../../lib/career/job-pool/frontend-presentation";
import type { JobPoolWorkflow } from "./JobPoolMatchPanel";

/**
 * JOB focus of the planetarium: the selected Job Pool is the central, spatially
 * navigable field. Pure presentation over one delivered JobPoolMatchPresentation;
 * nothing here scores, evaluates, recommends or decides, and no path leads to
 * the HR Decision Dock. Semantic governance G1–G6 (JOB_POOL_CONNECTION.md §12).
 *
 * Semiontic layer (SFE — SEMIONTIC FRONTEND RECONSTRUCTION): light, breath, waver,
 * circulation, flow and orbit are derived from delivered facts by job-field-motion.ts
 * and carry one meaning each. Text is revealed progressively; the DOM contract
 * (test ids and data attributes, JOB_FIELD_FRONTEND.md §4) is unchanged.
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

const CYAN = SIL_TOKENS.colors.cyanActive;
const AMBER = SIL_TOKENS.colors.tensionAmber;
const RED = "rgba(255, 91, 101, 0.96)";
const RED_SOFT = "rgba(255, 91, 101, 0.55)";
const STATE_COLOR: Record<JobFieldRequirementState, string> = {
  MATCHED: CYAN,
  UNRESOLVED: AMBER,
  COVERED_UNSCORED: "rgba(56, 229, 255, 0.55)",
  NO_EVIDENCE_DELIVERED: "rgba(255, 91, 101, 0.75)"
};
const PENDING_COLOR: Record<JobFieldPendingKind, string> = {
  UNPROVEN_CANONICAL: "rgba(230, 241, 248, 0.45)",
  UNRESOLVED_EVIDENCE: AMBER,
  UNSCORED_COVERAGE: "rgba(56, 229, 255, 0.7)",
  NO_EVIDENCE_DELIVERED: RED_SOFT
};
const mono: React.CSSProperties = { fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", color: SIL_TOKENS.colors.textPrimary, wordBreak: "break-word" };
const muted: React.CSSProperties = { ...mono, color: SIL_TOKENS.colors.textMuted };
const amber: React.CSSProperties = { ...mono, color: AMBER };
const red: React.CSSProperties = { ...mono, color: RED };
const sectionTitle: React.CSSProperties = { margin: 0, fontSize: "9px", fontWeight: 700, letterSpacing: "1.2px", color: CYAN };
const surface: React.CSSProperties = { backgroundColor: "rgba(6, 11, 18, 0.82)", border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`, borderRadius: "10px", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "8px", backdropFilter: "blur(10px)", boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)" };
const chip = (color: string): React.CSSProperties => ({ ...mono, color, border: `1px solid ${color}`, borderRadius: "3px", padding: "1px 6px", fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.5px", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "5px" });
const button = (active = true): React.CSSProperties => ({ backgroundColor: active ? "rgba(56, 229, 255, 0.12)" : "transparent", border: `1px solid ${active ? CYAN : "rgba(56, 229, 255, 0.35)"}`, color: active ? CYAN : "rgba(56, 229, 255, 0.5)", fontFamily: SIL_TOKENS.typography.mono, fontSize: "9px", fontWeight: 700, letterSpacing: "0.6px", padding: "5px 9px", borderRadius: "5px", cursor: "pointer", transition: "background-color .25s ease, box-shadow .25s ease" });
const ghost: React.CSSProperties = { background: "transparent", border: "none", color: SIL_TOKENS.colors.textMuted, fontFamily: SIL_TOKENS.typography.mono, fontSize: "8.5px", letterSpacing: "0.6px", cursor: "pointer", padding: "2px 4px", textDecoration: "underline dotted", textUnderlineOffset: "3px" };
const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const shortTitle = (title: string, max = 24): string => (title.length <= max ? title : `${title.slice(0, max - 1)}…`);
const countKey = (state: JobFieldRequirementState): "matched" | "unresolved" | "coveredUnscored" | "noEvidence" => (state === "MATCHED" ? "matched" : state === "UNRESOLVED" ? "unresolved" : state === "COVERED_UNSCORED" ? "coveredUnscored" : "noEvidence");
const STATES: readonly JobFieldRequirementState[] = ["MATCHED", "UNRESOLVED", "COVERED_UNSCORED", "NO_EVIDENCE_DELIVERED"];

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

/** prefers-reduced-motion: every duration becomes zero, every light value stays (light is meaning, motion is emphasis). */
function useMotionMode(): JobFieldMotionMode {
  const [mode, setMode] = useState<JobFieldMotionMode>("LIVE");
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMode(query.matches ? "REDUCED" : "LIVE");
    apply();
    query.addEventListener?.("change", apply);
    return () => query.removeEventListener?.("change", apply);
  }, []);
  return mode;
}

const MOTION_CSS = `
@keyframes jfEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes jfRise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
@keyframes jfEmerge { from { opacity: 0; transform: scale(0.35); } to { opacity: 1; transform: scale(1); } }
@keyframes jfBreathLight { 0%, 100% { opacity: var(--jf-lo); } 50% { opacity: var(--jf-hi); } }
@keyframes jfBreathScale { 0%, 100% { transform: scale(1); } 50% { transform: scale(var(--jf-amp, 1.03)); } }
@keyframes jfWaver { 0%, 100% { opacity: 0.9; } 28% { opacity: 0.42; } 46% { opacity: 0.8; } 71% { opacity: 0.5; } }
@keyframes jfCirculate { to { stroke-dashoffset: -60; } }
@keyframes jfFlow { to { stroke-dashoffset: -26; } }
@keyframes jfOrbit { to { stroke-dashoffset: -220; } }
@keyframes jfPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
@keyframes jfDotWaver { 0%, 100% { opacity: 1; } 40% { opacity: 0.35; } 65% { opacity: 0.8; } }
@keyframes jfDotCirculate { to { transform: rotate(360deg); } }
[data-testid="job-field"] [data-jf-reveal] { animation: jfRise .32s ease-out both; }
[data-testid="job-field"] button:hover { box-shadow: 0 0 14px rgba(56, 229, 255, 0.25); }
[data-testid="job-field"] [data-testid^="job-field-role-"]:hover [data-jf-body] { filter: drop-shadow(0 0 10px rgba(56, 229, 255, 0.45)); }
[data-testid="job-field"] ::-webkit-scrollbar { width: 6px; }
[data-testid="job-field"] ::-webkit-scrollbar-thumb { background: rgba(56, 229, 255, 0.18); border-radius: 3px; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="job-field"], [data-testid="job-field"] * { animation: none !important; transition: none !important; }
}
`;

function StateDot({ state, size = 8 }: { state: JobFieldRequirementState; size?: number }) {
  const motion = segmentMotion(state);
  const color = STATE_COLOR[state];
  const base: React.CSSProperties = { width: `${size}px`, height: `${size}px`, borderRadius: "50%", flexShrink: 0, display: "inline-block" };
  if (motion.kind === "CIRCULATE") return <span aria-hidden="true" data-jf-dot={motion.kind} style={{ ...base, border: `1.5px dashed ${CYAN}`, animation: motion.durationMs > 0 ? `jfDotCirculate ${motion.durationMs}ms linear infinite` : undefined }} />;
  if (motion.kind === "VOID") return <span aria-hidden="true" data-jf-dot={motion.kind} style={{ ...base, border: `1px solid ${color}`, opacity: 0.6 }} />;
  if (motion.kind === "WAVER") return <span aria-hidden="true" data-jf-dot={motion.kind} style={{ ...base, backgroundColor: color, boxShadow: `0 0 6px ${SIL_TOKENS.colors.tensionGlow}`, animation: motion.durationMs > 0 ? `jfDotWaver ${motion.durationMs}ms ease-in-out infinite` : undefined }} />;
  return <span aria-hidden="true" data-jf-dot={motion.kind} style={{ ...base, backgroundColor: color, boxShadow: `0 0 8px ${SIL_TOKENS.colors.cyanGlowStrong}` }} />;
}

function Quotes({ quotes }: { quotes: ReadonlyArray<{ docId: string; quote: string }> }) {
  if (quotes.length === 0) return null;
  return (
    <ul style={{ margin: 0, paddingLeft: "12px", display: "flex", flexDirection: "column", gap: "3px" }}>
      {quotes.map((quote, index) => <li key={`${quote.docId}:${index}`} data-testid="job-field-evidence-quote" data-doc-id={quote.docId} style={{ ...muted, borderLeft: `2px solid ${SIL_TOKENS.colors.fieldBorder}`, paddingLeft: "6px" }}><span style={{ ...mono, fontStyle: "italic" }}>“{quote.quote}”</span> · {quote.docId}</li>)}
    </ul>
  );
}

function ResonanceBar({ role, t }: { role: JobFieldRoleNode; t: JobFieldCopy }) {
  const motion = roleMotion(role);
  return (
    <div data-testid="job-field-resonance-bar" data-resonance-score={role.resonanceScore} data-motion={motion.kind} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
        <span style={muted}>{t.resonance}</span>
        <span style={{ ...mono, fontSize: "14px", fontWeight: 700, color: role.hasScoredMatch ? CYAN : SIL_TOKENS.colors.textMuted }}>{percent(role.resonanceScore)}</span>
      </div>
      <div style={{ position: "relative", height: "4px", borderRadius: "2px", backgroundColor: "rgba(56, 229, 255, 0.08)", overflow: "visible" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round(Math.min(1, Math.max(0, role.resonanceScore)) * 100)}%`, borderRadius: "2px", backgroundColor: role.hasScoredMatch ? CYAN : RED_SOFT, boxShadow: role.hasScoredMatch ? `0 0 ${motion.glowRadius}px rgba(56, 229, 255, ${motion.glowOpacity})` : undefined, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
      <span style={muted}>{t.rank} #{role.deliveredRank}{role.hasScoredMatch ? "" : <span style={red}> · {t.noScoredMatch}</span>}</span>
    </div>
  );
}

function CompositionBar({ role, t }: { role: JobFieldRoleNode; t: JobFieldCopy }) {
  if (role.counts.total === 0) return null;
  return (
    <div data-testid="job-field-composition" style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
      <span style={{ ...sectionTitle, color: SIL_TOKENS.colors.textMuted }}>{t.composition}</span>
      <div style={{ display: "flex", height: "6px", borderRadius: "3px", overflow: "hidden", gap: "2px" }}>
        {STATES.map(state => {
          const count = role.counts[countKey(state)];
          if (count === 0) return null;
          const motion = segmentMotion(state);
          return <div key={state} data-segment-state={state} data-motion={motion.kind} title={`${t.requirementStates[state]} ${count}`} style={{ flex: count, backgroundColor: STATE_COLOR[state], opacity: motion.opacity, backgroundImage: motion.dasharray !== null ? `repeating-linear-gradient(90deg, ${STATE_COLOR[state]} 0 3px, transparent 3px 6px)` : undefined, animation: motion.kind === "WAVER" && motion.durationMs > 0 ? `jfWaver ${motion.durationMs}ms ease-in-out infinite` : undefined }} />;
        })}
      </div>
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {STATES.map(state => <span key={state} style={{ ...chip(STATE_COLOR[state]), opacity: role.counts[countKey(state)] === 0 ? 0.35 : 1 }}><StateDot state={state} size={6} />{t.requirementStates[state]} {role.counts[countKey(state)]}</span>)}
      </div>
    </div>
  );
}

function RequirementLine({ requirement, t, revealed, onToggle, onHover }: { requirement: JobFieldRequirement; t: JobFieldCopy; revealed: boolean; onToggle(): void; onHover(entered: boolean): void }) {
  const provenance = provenanceOf(requirement);
  const motion = segmentMotion(requirement.state);
  return (
    <li
      data-testid={`job-field-requirement-${requirement.poolRequirementId}`}
      data-state={requirement.state}
      data-provenance={provenance}
      data-basis={requirement.match?.basis ?? ""}
      data-sweep-basis={requirement.sweep?.matchBasis ?? ""}
      data-motion={motion.kind}
      data-revealed={revealed ? "true" : "false"}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "6px 0", borderBottom: `1px dashed ${SIL_TOKENS.colors.fieldBorder}` }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "7px", flexWrap: "wrap" }}>
        <StateDot state={requirement.state} />
        <span style={{ ...mono, fontWeight: 700, fontSize: "10.5px" }}>{requirement.capabilityName}</span>
        <span style={chip(STATE_COLOR[requirement.state])}>{t.requirementStates[requirement.state]}</span>
        <span style={{ ...muted, marginLeft: "auto" }}>{requirement.necessity} · w {requirement.weight}{requirement.requiredLevel ? ` · ${requirement.requiredLevel}` : ""}</span>
        <button data-testid={`job-field-requirement-toggle-${requirement.poolRequirementId}`} aria-expanded={revealed} onClick={event => { event.stopPropagation(); onToggle(); }} style={ghost}>{revealed ? t.hide : t.reveal}</button>
      </div>
      <div data-testid={`job-field-requirement-evidence-${requirement.poolRequirementId}`} hidden={!revealed} data-jf-reveal={revealed ? "true" : undefined} style={{ display: revealed ? "flex" : "none", flexDirection: "column", gap: "3px", paddingLeft: "15px" }}>
        {requirement.match !== null && (
          <span style={muted}>
            {t.provenance.ANALYSIS_CAPABILITY} · <span style={mono}>{requirement.match.matchedCapabilityName}</span>{requirement.match.matchedConstituent !== null ? ` · ${t.constituent} ${requirement.match.matchedConstituent}` : ""} · {t.basis} {requirement.match.basis} · {t.confidence} {requirement.match.confidence}
          </span>
        )}
        {requirement.match !== null && <Quotes quotes={requirement.match.evidence} />}
        {requirement.weakReason !== null && <span style={amber}>{requirement.weakReason}</span>}
        {requirement.sweep !== null && (
          <span style={{ ...muted, color: CYAN }}>
            {t.provenance.SWEEP_PROPOSAL} · <span style={mono}>{requirement.sweep.name}</span>{requirement.sweep.matchedConstituent !== null ? ` · ${t.constituent} ${requirement.sweep.matchedConstituent}` : ""} · {t.basis} {requirement.sweep.matchBasis} · {requirement.sweep.capabilityProposalId}
          </span>
        )}
        {requirement.sweep !== null && <Quotes quotes={requirement.sweep.evidence} />}
        {provenance === "NONE" && <span style={muted}>{t.provenance.NONE}{requirement.evidenceHint !== null ? ` · ${requirement.evidenceHint}` : ""}</span>}
      </div>
    </li>
  );
}

function PendingField({ roleId, pending, t }: { roleId: string; pending: readonly JobFieldPending[]; t: JobFieldCopy }) {
  const [openKind, setOpenKind] = useState<JobFieldPendingKind | null>(null);
  return (
    <div data-testid="job-field-pending" data-role-id={roleId} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <span style={sectionTitle}>{t.pending}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "6px" }}>
        {pending.map(item => {
          const color = PENDING_COLOR[item.kind];
          const present = item.ids.length > 0;
          const open = openKind === item.kind;
          return (
            <div
              key={item.kind}
              data-testid={`job-field-pending-${item.kind}`}
              data-count={item.ids.length}
              data-ids={item.ids.join(",")}
              data-present={present ? "true" : "false"}
              role="button"
              tabIndex={0}
              aria-expanded={open}
              onClick={event => { event.stopPropagation(); setOpenKind(open ? null : item.kind); }}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpenKind(open ? null : item.kind); } }}
              title={item.ids.length === 0 ? t.none : item.ids.join(" · ")}
              style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 7px", borderRadius: "6px", border: `1px ${item.kind === "UNSCORED_COVERAGE" ? "dashed" : "solid"} ${present ? color : SIL_TOKENS.colors.fieldBorder}`, backgroundColor: present ? "rgba(6, 11, 18, 0.6)" : "transparent", opacity: present ? 1 : 0.45, cursor: "pointer", minWidth: 0 }}
            >
              <span style={{ ...mono, fontSize: "15px", fontWeight: 700, color: present ? color : SIL_TOKENS.colors.textMuted, lineHeight: 1 }}>{item.ids.length}</span>
              <span style={{ ...muted, fontSize: "7.5px", letterSpacing: "0.4px", lineHeight: 1.25 }}>{t.pendingKinds[item.kind]}</span>
              <span hidden={!open} data-jf-reveal={open ? "true" : undefined} style={{ ...muted, fontSize: "8px", display: open ? "block" : "none" }}>{t.ids}: {item.ids.length === 0 ? t.none : item.ids.join(" · ")}</span>
            </div>
          );
        })}
      </div>
      <span data-testid="job-field-pending-reason" style={{ ...amber, fontSize: "8.5px", opacity: 0.85 }}>{t.canonicalReason}</span>
    </div>
  );
}

function RoleDetail({ role, t, onBack }: { role: JobFieldRoleNode; t: JobFieldCopy; onBack(): void }) {
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const toggle = (id: string) => setRevealed(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return (
    <section data-testid="job-field-role-detail" data-role-id={role.poolRoleId} data-jf-reveal="true" style={surface}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "2px", minWidth: 0 }}>
          <span style={{ ...mono, fontWeight: 700, fontSize: "13px", color: SIL_TOKENS.colors.textPrimary }}>{role.title}</span>
          <span style={muted}>{role.organizationName} · {role.seniority || "—"} · {role.domainFocus || "—"}</span>
          <span style={{ ...muted, fontSize: "8px", opacity: 0.7 }}>{role.poolRoleId} · {role.poolOrganizationId}</span>
        </div>
        <button data-testid="job-field-role-back" onClick={onBack} style={button(true)}>{t.back}</button>
      </div>
      <ResonanceBar role={role} t={t} />
      <CompositionBar role={role} t={t} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
        <span style={sectionTitle}>{t.relations}</span>
        <button data-testid="job-field-reveal-all" data-revealed-all={revealAll ? "true" : "false"} aria-pressed={revealAll} onClick={() => setRevealAll(value => !value)} style={ghost}>{revealAll ? t.hideAll : t.revealAll}</button>
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {role.requirements.map(requirement => (
          <RequirementLine
            key={requirement.poolRequirementId}
            requirement={requirement}
            t={t}
            revealed={revealAll || revealed.has(requirement.poolRequirementId) || hovered === requirement.poolRequirementId}
            onToggle={() => toggle(requirement.poolRequirementId)}
            onHover={entered => setHovered(current => (entered ? requirement.poolRequirementId : current === requirement.poolRequirementId ? null : current))}
          />
        ))}
      </ul>
      <PendingField roleId={role.poolRoleId} pending={role.pending} t={t} />
    </section>
  );
}

function RoleNode({ role, selected, nearest, dimmed, focused, mode, t, onSelect, onHover }: { role: JobFieldRoleNode; selected: boolean; nearest: boolean; dimmed: boolean; focused: boolean; mode: JobFieldMotionMode; t: JobFieldCopy; onSelect(): void; onHover(entered: boolean): void }) {
  const radius = 26 + Math.min(10, role.counts.total);
  const segments = ringSegments(role.counts);
  const motion = roleMotion(role, mode);
  const rings = focused ? pendingRings(role.pending, mode) : [];
  const breathing = motion.kind === "BREATH" && motion.periodMs > 0;
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
      data-motion={motion.kind}
      data-focused={focused ? "true" : "false"}
      transform={`translate(${role.x} ${role.y})`}
      onClick={event => { event.stopPropagation(); onSelect(); }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer", opacity: dimmed ? 0.3 : 1, transition: "opacity 0.4s ease" }}
    >
      <g data-jf-emerge style={{ animation: motion.emergeDurationMs > 0 ? `jfEmerge ${motion.emergeDurationMs}ms cubic-bezier(.2,.8,.2,1) ${motion.emergeDelayMs}ms both` : undefined, transformBox: "fill-box", transformOrigin: "center" }}>
        {motion.glowRadius > 0 && (
          <circle
            data-jf-light
            r={radius + motion.glowRadius}
            fill={CYAN}
            filter="url(#jfBlur)"
            style={{ opacity: motion.glowOpacity, ["--jf-lo" as string]: motion.glowOpacity * (1 - motion.amplitude), ["--jf-hi" as string]: motion.glowOpacity, animation: breathing ? `jfBreathLight ${motion.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties}
          />
        )}
        {rings.map(ring => (
          <circle key={ring.kind} data-pending-kind={ring.kind} data-pending-count={ring.count} data-motion="ORBIT" r={radius + 7 + ring.radiusOffset} fill="none" stroke={PENDING_COLOR[ring.kind]} strokeWidth={1} strokeDasharray={ring.dasharray} style={{ opacity: ring.opacity, animation: ring.durationMs > 0 ? `jfOrbit ${ring.durationMs}ms linear infinite${ring.index % 2 === 1 ? " reverse" : ""}` : undefined }} />
        ))}
        <circle r={radius + 14} fill="none" stroke={selected ? CYAN : nearest ? "rgba(56, 229, 255, 0.45)" : "transparent"} strokeWidth={selected ? 1.6 : 1} strokeDasharray={nearest && !selected ? "4 4" : undefined} style={{ transition: "stroke .3s ease" }} />
        {segments.map(segment => {
          const segmentStyle = segmentMotion(segment.state, mode);
          return (
            <path
              key={segment.state}
              data-segment-state={segment.state}
              data-motion={segmentStyle.kind}
              d={arcPath(0, 0, radius + 7, segment.startAngle + 1, segment.endAngle - 1)}
              fill="none"
              stroke={STATE_COLOR[segment.state]}
              strokeWidth={segment.state === "NO_EVIDENCE_DELIVERED" ? 3 : 5}
              strokeDasharray={segmentStyle.dasharray ?? undefined}
              strokeLinecap="butt"
              style={{ opacity: segmentStyle.opacity, animation: segmentStyle.durationMs > 0 ? `${segmentStyle.kind === "WAVER" ? "jfWaver" : "jfCirculate"} ${segmentStyle.durationMs}ms ${segmentStyle.kind === "WAVER" ? "ease-in-out" : "linear"} infinite` : undefined }}
            />
          );
        })}
        <g data-jf-body>
          <circle r={radius} fill={`rgba(56, 229, 255, ${motion.bodyOpacity})`} stroke={role.hasScoredMatch ? CYAN : "rgba(255, 91, 101, 0.5)"} strokeWidth={role.hasScoredMatch ? 1.2 : 0.9} style={{ ["--jf-lo" as string]: 1 - motion.amplitude * 0.5, ["--jf-hi" as string]: 1, animation: breathing ? `jfBreathLight ${motion.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties} />
          <text textAnchor="middle" y={-1} fill={role.hasScoredMatch ? SIL_TOKENS.colors.textPrimary : SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={11} fontWeight={700}>{percent(role.resonanceScore)}</text>
          <text textAnchor="middle" y={11} fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={7.5}>#{role.deliveredRank}</text>
        </g>
        <text textAnchor="middle" y={radius + 24} fill={role.hasScoredMatch ? SIL_TOKENS.colors.textPrimary : SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={10} fontWeight={700}>{shortTitle(role.title)}</text>
        {focused && <text data-jf-hover-label textAnchor="middle" y={radius + 36} fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{shortTitle(role.organizationName, 28)}</text>}
        {focused && !role.hasScoredMatch && <text data-jf-hover-label textAnchor="middle" y={radius + 48} fill={RED} fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{t.noScoredMatch}</text>}
      </g>
    </g>
  );
}

function FieldCanvas({ field, selectedRoleId, hoveredRoleId, mode, t, onSelectRole, onHoverRole }: { field: JobFieldModel; selectedRoleId: string | null; hoveredRoleId: string | null; mode: JobFieldMotionMode; t: JobFieldCopy; onSelectRole(poolRoleId: string | null): void; onHoverRole(poolRoleId: string | null): void }) {
  const { center, innerRadius, outerRadius, size } = field.layout;
  const motion = fieldMotion(mode);
  const nearestId = field.nearestPresentedRole?.poolRoleId ?? null;
  const nearestNode = nearestId === null ? null : field.roles.find(role => role.poolRoleId === nearestId) ?? null;
  return (
    <svg data-testid="job-field-canvas" data-motion-mode={mode} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", top: "50%", left: "calc(50% - 64px)", transform: "translate(-50%, -50%)", width: "min(88vh, 50vw, 760px)", height: "min(88vh, 50vw, 760px)", overflow: "visible" }} onClick={() => onSelectRole(null)}>
      <defs>
        <filter id="jfBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="jfBlurSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        <radialGradient id="jfCoreGradient"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.55)" /><stop offset="55%" stopColor="rgba(56, 229, 255, 0.12)" /><stop offset="100%" stopColor="rgba(56, 229, 255, 0)" /></radialGradient>
        <radialGradient id="jfFieldGradient"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.06)" /><stop offset="70%" stopColor="rgba(56, 229, 255, 0.015)" /><stop offset="100%" stopColor="rgba(3, 5, 8, 0)" /></radialGradient>
      </defs>
      <circle cx={center} cy={center} r={outerRadius + 60} fill="url(#jfFieldGradient)" />
      <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(56, 229, 255, 0.16)" strokeDasharray="2 6" />
      <circle cx={center} cy={center} r={(innerRadius + outerRadius) / 2} fill="none" stroke="rgba(56, 229, 255, 0.09)" strokeDasharray="2 6" />
      <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="rgba(255, 91, 101, 0.2)" strokeDasharray="2 6" />
      <text x={center} y={center - outerRadius - 46} textAnchor="middle" fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={8} opacity={0.8}>{t.resonance} 0% · {t.noScoredMatch}</text>
      <text x={center} y={center - innerRadius - 10} textAnchor="middle" fill="rgba(56, 229, 255, 0.5)" fontFamily={SIL_TOKENS.typography.mono} fontSize={8}>{t.resonance} 100%</text>
      {field.organizations.map(organization => {
        const mid = (organization.startAngle + organization.endAngle) / 2;
        const radians = ((mid - 90) * Math.PI) / 180;
        const labelRadius = outerRadius + 64;
        const focusedHere = organization.roleIds.some(id => id === hoveredRoleId || id === selectedRoleId);
        return (
          <g key={organization.poolOrganizationId} data-testid={`job-field-organization-${organization.poolOrganizationId}`} data-role-count={organization.roleIds.length} style={{ transition: "opacity .3s ease", opacity: selectedRoleId !== null && !focusedHere ? 0.45 : 1 }}>
            <path d={arcPath(center, center, outerRadius + 40, organization.startAngle + 2, organization.endAngle - 2)} fill="none" stroke={focusedHere ? "rgba(56, 229, 255, 0.6)" : "rgba(56, 229, 255, 0.26)"} strokeWidth={focusedHere ? 2 : 1.5} style={{ transition: "stroke .3s ease" }} />
            <text x={center + labelRadius * Math.cos(radians)} y={center + labelRadius * Math.sin(radians)} textAnchor="middle" dominantBaseline="middle" fill={focusedHere ? SIL_TOKENS.colors.textPrimary : SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={9} letterSpacing={1}>{shortTitle(organization.name.toUpperCase(), 30)}</text>
          </g>
        );
      })}
      {nearestNode !== null && (
        <line data-testid="job-field-nearest-ray" data-motion="FLOW" x1={center} y1={center} x2={nearestNode.x} y2={nearestNode.y} stroke={CYAN} strokeWidth={1.2} strokeDasharray={motion.nearestFlow.dasharray} opacity={0.7} style={{ animation: motion.nearestFlow.durationMs > 0 ? `jfFlow ${motion.nearestFlow.durationMs}ms linear infinite` : undefined }} />
      )}
      <g data-testid="job-field-core" data-candidate-capability-count={field.candidateCapabilityCount} data-sweep-proposal-count={field.capabilitySweep.proposalCount} data-motion="BREATH" transform={`translate(${center} ${center})`}>
        <circle r={110} fill="url(#jfCoreGradient)" filter="url(#jfBlurSoft)" style={{ ["--jf-lo" as string]: 0.55, ["--jf-hi" as string]: 1, animation: motion.core.periodMs > 0 ? `jfBreathLight ${motion.core.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties} />
        <g style={{ ["--jf-amp" as string]: motion.core.amplitudeScale, animation: motion.core.periodMs > 0 ? `jfBreathScale ${motion.core.periodMs}ms ease-in-out infinite` : undefined, transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}>
          <circle r={54} fill="rgba(3, 5, 8, 0.92)" stroke={CYAN} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong})` }} />
          <text textAnchor="middle" y={-8} fill={CYAN} fontFamily={SIL_TOKENS.typography.mono} fontSize={10} fontWeight={700} letterSpacing={1.5}>{t.core}</text>
          <text textAnchor="middle" y={6} fill={SIL_TOKENS.colors.textPrimary} fontFamily={SIL_TOKENS.typography.mono} fontSize={9}>{field.candidateCapabilityCount} · {field.capabilitySweep.proposalCount}</text>
          <text textAnchor="middle" y={18} fill={SIL_TOKENS.colors.textMuted} fontFamily={SIL_TOKENS.typography.mono} fontSize={7}>scored · unscored</text>
        </g>
        <circle data-motion="CIRCULATE" data-sweep-halo r={64} fill="none" stroke={field.capabilitySweep.proposalCount > 0 ? "rgba(56, 229, 255, 0.4)" : "rgba(56, 229, 255, 0.14)"} strokeDasharray={motion.sweepHalo.dasharray} style={{ animation: motion.sweepHalo.durationMs > 0 && field.capabilitySweep.proposalCount > 0 ? `jfCirculate ${motion.sweepHalo.durationMs}ms linear infinite` : undefined }} />
      </g>
      {field.roles.map(role => (
        <RoleNode
          key={role.poolRoleId}
          role={role}
          selected={role.poolRoleId === selectedRoleId}
          nearest={role.poolRoleId === nearestId}
          dimmed={selectedRoleId !== null && role.poolRoleId !== selectedRoleId}
          focused={role.poolRoleId === selectedRoleId || role.poolRoleId === hoveredRoleId}
          mode={mode}
          t={t}
          onSelect={() => onSelectRole(role.poolRoleId === selectedRoleId ? null : role.poolRoleId)}
          onHover={entered => onHoverRole(entered ? role.poolRoleId : null)}
        />
      ))}
    </svg>
  );
}

function StateLine({ state, t }: { state: JobFieldState; t: JobFieldCopy }) {
  const tone = state === "AVAILABLE" ? CYAN : state === "FAILED" || state === "NOT_FOUND" ? RED : AMBER;
  const live = state === "LOADING";
  return (
    <span data-testid="job-field-state" data-state={state} style={{ ...(state === "AVAILABLE" ? muted : state === "FAILED" || state === "NOT_FOUND" ? red : amber), display: "inline-flex", alignItems: "center", gap: "7px" }}>
      <span aria-hidden="true" style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: tone, boxShadow: `0 0 8px ${tone}`, flexShrink: 0, animation: live ? "jfPulse 1.4s ease-in-out infinite" : undefined }} />
      {t.states[state]}
    </span>
  );
}

export function JobField({ workflow, analysisSource, selectedRoleId, onSelectRole, onSelectPool, onExit, locale = SIL_COPY.defaultLocale }: JobFieldProps) {
  const t = SIL_COPY[locale].jobField;
  const mode = useMotionMode();
  const motion = fieldMotion(mode);
  const state = describeJobFieldState(workflow, analysisSource);
  const field = useMemo(() => (workflow.matches.state === "AVAILABLE" ? deriveJobField(workflow.matches.matches) : null), [workflow.matches]);
  const selection = field === null ? { kind: "NONE" as const } : describeRoleSelection(selectedRoleId, field);
  const selectedId = selection.kind === "ROLE" ? selection.role.poolRoleId : null;
  const nearest = field?.nearestPresentedRole ?? null;
  const nearestNode = field === null || nearest === null ? null : field.roles.find(role => role.poolRoleId === nearest.poolRoleId) ?? null;
  const listed = workflow.pools.state === "AVAILABLE" ? workflow.pools.jobPools : [];
  const [hoveredRoleId, setHoveredRoleId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  return (
    <div
      data-testid="job-field"
      data-field-state={state}
      data-analysis-id={analysisSource.kind === "NONE" ? "" : analysisSource.analysisId}
      data-pool-id={workflow.selectedJobPoolUploadId ?? ""}
      data-role-count={field?.roles.length ?? 0}
      data-ranking={field?.ranking ?? ""}
      data-nearest-role={nearest?.poolRoleId ?? ""}
      data-selected-role={selectedId ?? ""}
      data-sweep-state={field?.capabilitySweep.state ?? ""}
      data-motion-grammar={JOB_FIELD_MOTION_VERSION}
      data-motion-mode={mode}
      data-hovered-role={hoveredRoleId ?? ""}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.88)", backdropFilter: "blur(8px)", fontFamily: SIL_TOKENS.typography.mono, color: SIL_TOKENS.colors.textPrimary, animation: motion.enterMs > 0 ? `jfEnter ${motion.enterMs}ms ease-out both` : undefined }}
    >
      <style>{MOTION_CSS}</style>
      {field !== null && <FieldCanvas field={field} selectedRoleId={selectedId} hoveredRoleId={hoveredRoleId} mode={mode} t={t} onSelectRole={onSelectRole} onHoverRole={setHoveredRoleId} />}

      <div style={{ position: "absolute", left: "24px", top: "132px", width: "min(300px, 26vw)", display: "flex", flexDirection: "column", gap: "10px", zIndex: 46 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
          <h3 style={{ margin: 0, fontSize: "12px", color: CYAN, letterSpacing: "1.4px", textShadow: `0 0 12px ${SIL_TOKENS.colors.cyanGlowStrong}` }}>{t.title}</h3>
          <button data-testid="job-field-exit-btn" onClick={onExit} style={button(true)}>{t.exit}</button>
        </div>
        <span style={{ ...muted, fontSize: "8.5px", letterSpacing: "0.6px" }}>{t.subtitle}</span>
        <StateLine state={state} t={t} />
        {state === "NO_POOL" && (
          <div data-testid="job-field-pool-selection" data-jf-reveal="true" style={surface}>
            {listed.length === 0 && <span style={muted}>{SIL_COPY[locale].jobPool.poolsEmpty}</span>}
            {listed.map(pool => (
              <div key={pool.jobPoolUploadId} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                <span style={mono}>{pool.poolName} <span style={muted}>v{pool.poolVersion} · {pool.poolStatus}</span></span>
                <button data-testid={`job-field-select-pool-${pool.jobPoolUploadId}`} onClick={() => onSelectPool(pool.jobPoolUploadId)} style={button(true)}>{t.select}</button>
              </div>
            ))}
          </div>
        )}
        {state === "NO_ANALYSIS" && <span data-testid="job-field-no-analysis" data-jf-reveal="true" style={amber}>{t.states.NO_ANALYSIS}</span>}
        {field !== null && (
          <div data-testid="job-field-legend" data-legend-open={legendOpen ? "true" : "false"} data-jf-reveal="true" style={surface}>
            <span style={muted}>{t.coreCapabilities}: <span style={{ ...mono, color: CYAN, fontWeight: 700 }}>{field.candidateCapabilityCount}</span> · {t.coreSweep}: <span style={{ ...mono, fontWeight: 700 }}>{field.capabilitySweep.proposalCount}</span> ({field.capabilitySweep.state})</span>
            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
              {STATES.map(stateKey => <span key={stateKey} style={chip(STATE_COLOR[stateKey])}><StateDot state={stateKey} size={6} />{t.requirementStates[stateKey]}</span>)}
            </div>
            <span style={{ ...muted, fontSize: "8.5px" }}>{t.ranking[field.ranking]}</span>
            <button data-testid="job-field-legend-toggle" aria-expanded={legendOpen} onClick={() => setLegendOpen(value => !value)} style={{ ...ghost, alignSelf: "flex-start" }}>{legendOpen ? t.legendHide : t.legendToggle}</button>
            <div data-testid="job-field-legend-text" hidden={!legendOpen} data-jf-reveal={legendOpen ? "true" : undefined} style={{ display: legendOpen ? "flex" : "none", flexDirection: "column", gap: "6px" }}>
              <span style={muted}>{t.legend}</span>
              <span style={{ ...muted, color: "rgba(56, 229, 255, 0.75)" }}>{t.motion}</span>
              <span style={{ ...muted, fontSize: "8.5px" }}>{t.hoverHint}</span>
            </div>
          </div>
        )}
        {field !== null && selection.kind === "NOT_DELIVERED" && <span data-testid="job-field-role-not-delivered" data-jf-reveal="true" style={red}>{selection.poolRoleId} · {t.states.NOT_FOUND}</span>}
      </div>

      <div style={{ position: "absolute", right: "24px", top: "132px", width: "min(440px, 34vw)", maxHeight: "calc(100vh - 180px)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", zIndex: 46 }}>
        {field !== null && selection.kind === "ROLE" && <RoleDetail key={selection.role.poolRoleId} role={selection.role} t={t} onBack={() => onSelectRole(null)} />}
        {field !== null && selection.kind !== "ROLE" && nearestNode !== null && (
          <section data-testid="job-field-nearest" data-role-id={nearestNode.poolRoleId} data-jf-reveal="true" style={surface}>
            <span style={sectionTitle}>{t.nearest}</span>
            <span style={{ ...mono, fontWeight: 700, fontSize: "13px" }}>{nearestNode.title} <span style={muted}>· {nearestNode.organizationName}</span></span>
            <ResonanceBar role={nearestNode} t={t} />
            <span style={{ ...amber, fontSize: "8.5px", opacity: 0.85 }}>{t.nearestLabel}</span>
            <PendingField roleId={nearestNode.poolRoleId} pending={nearestNode.pending} t={t} />
            <button data-testid="job-field-open-nearest" onClick={() => onSelectRole(nearestNode.poolRoleId)} style={{ ...button(true), alignSelf: "flex-start" }}>{t.open}</button>
          </section>
        )}
        {field !== null && selection.kind !== "ROLE" && nearestNode === null && (
          <section data-testid="job-field-no-nearest" data-jf-reveal="true" style={surface}>
            <span style={sectionTitle}>{t.nearest}</span>
            <span style={red}>{t.noNearest}</span>
            <span style={{ ...amber, fontSize: "8.5px", opacity: 0.85 }}>{t.nearestLabel}</span>
          </section>
        )}
        <span data-testid="job-field-non-claims" style={{ ...muted, fontSize: "8.5px", letterSpacing: "0.5px", opacity: 0.8 }}>{t.nonClaims}</span>
      </div>
    </div>
  );
}
