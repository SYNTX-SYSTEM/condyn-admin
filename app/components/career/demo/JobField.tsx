"use client";

import React, { useEffect, useMemo, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import {
  arcPath,
  deriveJobField,
  describeRoleSelection,
  provenanceOf,
  requirementMoons,
  sectorPath,
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

/** Identity hues of the pool organisations (nebulae), by delivered position; a hue is never a value. */
export const ORGANIZATION_HUES = [190, 262, 158, 222, 300, 120] as const;
export const organizationHue = (hueIndex: number): number => ORGANIZATION_HUES[hueIndex % ORGANIZATION_HUES.length];
/** Reading sentence from delivered facts only. */
export function readingSentence(template: string, role: JobFieldRoleNode): string {
  return template
    .replace("{title}", role.title)
    .replace("{organization}", role.organizationName)
    .replace("{resonance}", `${Math.round(role.resonanceScore * 1000) / 10}%`)
    .replace("{matched}", String(role.counts.matched))
    .replace("{total}", String(role.counts.total))
    .replace("{unresolved}", String(role.counts.unresolved))
    .replace("{covered}", String(role.counts.coveredUnscored))
    .replace("{none}", String(role.counts.noEvidence));
}

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
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const INK = SIL_TOKENS.colors.textPrimary;
const INK_SOFT = "rgba(230, 241, 248, 0.78)";
const MUTED = SIL_TOKENS.colors.textMuted;
/** Typographic scale of the information surfaces: mono for identifiers, numbers and tracked labels; sans for titles and prose. */
const mono: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", color: INK, wordBreak: "break-word" };
const muted: React.CSSProperties = { ...mono, color: MUTED };
const micro: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.3px", lineHeight: 1.55, wordBreak: "break-word" };
const label: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: MUTED, margin: 0 };
const prose: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.65, color: INK_SOFT, margin: 0 };
const title: React.CSSProperties = { fontFamily: SANS, fontSize: "20px", fontWeight: 600, letterSpacing: "-0.3px", lineHeight: 1.2, color: INK, margin: 0 };
const display: React.CSSProperties = { fontFamily: MONO, fontSize: "34px", fontWeight: 300, letterSpacing: "-1.2px", lineHeight: 1, color: CYAN };
const amber: React.CSSProperties = { ...micro, color: AMBER, opacity: 0.85 };
const red: React.CSSProperties = { ...mono, color: RED };
const sectionTitle: React.CSSProperties = { ...label, color: "rgba(56, 229, 255, 0.8)" };
const stack = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: `${gap}px` });
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: `${gap}px`, flexWrap: "wrap" });
/** A relation line from the field into a surface: cyan for a lit (scored) subject, red-tinted for an unlit one. */
const tether = (lit: boolean): React.CSSProperties => ({ height: "1px", width: "100%", background: `linear-gradient(90deg, ${lit ? "rgba(56, 229, 255, 0.7)" : "rgba(255, 91, 101, 0.45)"} 0%, transparent 100%)` });
const stateWord = (color: string): React.CSSProperties => ({ fontFamily: MONO, fontSize: "8.5px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color, whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "5px" });
/** Buttons stay buttons (semantics, proofs); they read as text affordances of the field, not as controls of a panel. */
const action = (tone: "cyan" | "muted" = "cyan"): React.CSSProperties => ({ background: "transparent", border: "none", padding: "4px 0", fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: tone === "cyan" ? CYAN : MUTED, cursor: "pointer", textShadow: tone === "cyan" ? `0 0 10px ${SIL_TOKENS.colors.cyanGlow}` : undefined, transition: "color .25s ease, text-shadow .25s ease" });
const ghost: React.CSSProperties = { ...action("muted"), fontSize: "8px", letterSpacing: "1px" };
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
@keyframes jfRise { from { opacity: 0; } to { opacity: 1; } }
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
@keyframes jfSpin { to { transform: rotate(360deg); } }
@keyframes jfNebula { 0%, 100% { opacity: var(--jf-lo); } 50% { opacity: var(--jf-hi); } }
[data-testid="job-field"] [data-jf-reveal] { animation: jfRise .32s ease-out both; }
[data-testid="job-field"] button:hover { color: #e6f1f8; text-shadow: 0 0 12px rgba(56, 229, 255, 0.45); }
[data-testid="job-field"] button:focus-visible, [data-testid="job-field"] [role="button"]:focus-visible { outline: 1px solid rgba(56, 229, 255, 0.7); outline-offset: 3px; border-radius: 2px; }
[data-testid="job-field"] [data-jf-surface], [data-testid="job-field-lens"], [data-testid="job-field-legend-text"] { scrollbar-width: thin; scrollbar-color: rgba(56, 229, 255, 0.18) transparent; }
[data-testid="job-field-nearest"] button, [data-testid="job-field-nearest"] [role="button"] { pointer-events: auto; }
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

function Quotes({ quotes, color }: { quotes: ReadonlyArray<{ docId: string; quote: string }>; color: string }) {
  if (quotes.length === 0) return null;
  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(4) }}>
      {quotes.map((quote, index) => (
        <li key={`${quote.docId}:${index}`} data-testid="job-field-evidence-quote" data-doc-id={quote.docId} style={{ ...stack(2), paddingLeft: "10px", borderLeft: `1px solid ${color}` }}>
          <span style={{ ...prose, fontStyle: "italic", color: INK }}>“{quote.quote}”</span>
          <span style={micro}>{quote.docId}</span>
        </li>
      ))}
    </ul>
  );
}

function ResonanceReading({ role, t }: { role: JobFieldRoleNode; t: JobFieldCopy }) {
  const motion = roleMotion(role);
  const lit = role.hasScoredMatch;
  return (
    <div data-testid="job-field-resonance-bar" data-resonance-score={role.resonanceScore} data-motion={motion.kind} style={stack(5)}>
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
        <span style={{ ...display, color: lit ? CYAN : MUTED, textShadow: lit ? `0 0 ${motion.glowRadius}px rgba(56, 229, 255, ${motion.glowOpacity * 0.6})` : undefined }}>{percent(role.resonanceScore)}</span>
        <span style={{ ...label, fontSize: "8px" }}>{t.resonance}</span>
      </div>
      <div style={{ position: "relative", height: "2px", backgroundColor: "rgba(56, 229, 255, 0.08)" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${Math.round(Math.min(1, Math.max(0, role.resonanceScore)) * 100)}%`, backgroundColor: lit ? CYAN : RED_SOFT, boxShadow: lit ? `0 0 ${motion.glowRadius}px rgba(56, 229, 255, ${motion.glowOpacity})` : undefined, transition: "width .6s cubic-bezier(.2,.8,.2,1)" }} />
      </div>
      <span style={micro}>{t.rank} #{role.deliveredRank}{lit ? "" : <span style={{ color: RED }}> · {t.noScoredMatch}</span>}</span>
    </div>
  );
}

function Composition({ role, t }: { role: JobFieldRoleNode; t: JobFieldCopy }) {
  if (role.counts.total === 0) return null;
  return (
    <div data-testid="job-field-composition" style={stack(6)}>
      <span style={label}>{t.composition}</span>
      <div style={{ display: "flex", height: "3px", gap: "2px" }}>
        {STATES.map(state => {
          const count = role.counts[countKey(state)];
          if (count === 0) return null;
          const motion = segmentMotion(state);
          return <div key={state} data-segment-state={state} data-motion={motion.kind} title={`${t.requirementStates[state]} ${count}`} style={{ flex: count, backgroundColor: STATE_COLOR[state], opacity: motion.opacity, backgroundImage: motion.dasharray !== null ? `repeating-linear-gradient(90deg, ${STATE_COLOR[state]} 0 3px, transparent 3px 6px)` : undefined, animation: motion.kind === "WAVER" && motion.durationMs > 0 ? `jfWaver ${motion.durationMs}ms ease-in-out infinite` : undefined }} />;
        })}
      </div>
      <div style={row(14)}>
        {STATES.map(state => {
          const count = role.counts[countKey(state)];
          return <span key={state} style={{ ...stateWord(count === 0 ? MUTED : STATE_COLOR[state]), opacity: count === 0 ? 0.45 : 1 }}><StateDot state={state} size={6} />{t.requirementStates[state]} <span style={{ fontFamily: MONO, fontSize: "10px", fontWeight: 600, color: count === 0 ? MUTED : INK }}>{count}</span></span>;
        })}
      </div>
    </div>
  );
}

function RequirementLine({ requirement, t, revealed, onToggle, onHover }: { requirement: JobFieldRequirement; t: JobFieldCopy; revealed: boolean; onToggle(): void; onHover(entered: boolean): void }) {
  const provenance = provenanceOf(requirement);
  const motion = segmentMotion(requirement.state);
  const color = STATE_COLOR[requirement.state];
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
      style={{ ...stack(4), padding: "7px 0" }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "10px minmax(0, 1fr) auto", columnGap: "10px", rowGap: "3px", alignItems: "baseline" }}>
        <span style={{ display: "inline-flex", alignItems: "center", height: "16px" }}><StateDot state={requirement.state} /></span>
        <span style={{ fontFamily: SANS, fontSize: "14px", fontWeight: 500, color: INK, lineHeight: 1.3 }}>{requirement.capabilityName}</span>
        <button data-testid={`job-field-requirement-toggle-${requirement.poolRequirementId}`} aria-expanded={revealed} onClick={event => { event.stopPropagation(); onToggle(); }} style={ghost}>{revealed ? t.hide : t.reveal}</button>
        <span />
        <span style={stateWord(color)}>{t.requirementStates[requirement.state]}</span>
      </div>
      <div data-testid={`job-field-requirement-evidence-${requirement.poolRequirementId}`} hidden={!revealed} data-jf-reveal={revealed ? "true" : undefined} style={{ display: revealed ? "flex" : "none", flexDirection: "column", gap: "6px", paddingLeft: "20px" }}>
        <span style={micro}>{requirement.necessity} · w {requirement.weight}{requirement.requiredLevel ? ` · ${requirement.requiredLevel}` : ""}</span>
        {requirement.match !== null && (
          <span style={micro}>
            {t.provenance.ANALYSIS_CAPABILITY} · <span style={{ color: INK }}>{requirement.match.matchedCapabilityName}</span>{requirement.match.matchedConstituent !== null ? ` · ${t.constituent} ${requirement.match.matchedConstituent}` : ""} · {t.basis} {requirement.match.basis} · {t.confidence} {requirement.match.confidence}
          </span>
        )}
        {requirement.match !== null && <Quotes quotes={requirement.match.evidence} color="rgba(56, 229, 255, 0.4)" />}
        {requirement.weakReason !== null && <span style={{ ...prose, fontSize: "11px", color: AMBER, opacity: 0.9 }}>{requirement.weakReason}</span>}
        {requirement.sweep !== null && (
          <span style={{ ...micro, color: "rgba(56, 229, 255, 0.75)" }}>
            {t.provenance.SWEEP_PROPOSAL} · <span style={{ color: INK }}>{requirement.sweep.name}</span>{requirement.sweep.matchedConstituent !== null ? ` · ${t.constituent} ${requirement.sweep.matchedConstituent}` : ""} · {t.basis} {requirement.sweep.matchBasis} · {requirement.sweep.capabilityProposalId}
          </span>
        )}
        {requirement.sweep !== null && <Quotes quotes={requirement.sweep.evidence} color="rgba(56, 229, 255, 0.3)" />}
        {provenance === "NONE" && <span style={{ ...prose, fontSize: "11px" }}>{t.provenance.NONE}{requirement.evidenceHint !== null ? ` · ${requirement.evidenceHint}` : ""}</span>}
      </div>
    </li>
  );
}

function PendingField({ roleId, pending, t }: { roleId: string; pending: readonly JobFieldPending[]; t: JobFieldCopy }) {
  const [openKind, setOpenKind] = useState<JobFieldPendingKind | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const open = pending.find(item => item.kind === openKind) ?? null;
  return (
    <div data-testid="job-field-pending" data-role-id={roleId} style={stack(8)}>
      <span style={sectionTitle}>{t.pending}</span>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", columnGap: "12px" }}>
        {pending.map(item => {
          const color = PENDING_COLOR[item.kind];
          const present = item.ids.length > 0;
          const isOpen = openKind === item.kind;
          return (
            <div
              key={item.kind}
              data-testid={`job-field-pending-${item.kind}`}
              data-count={item.ids.length}
              data-ids={item.ids.join(",")}
              data-present={present ? "true" : "false"}
              role="button"
              tabIndex={0}
              aria-expanded={isOpen}
              onClick={event => { event.stopPropagation(); setOpenKind(isOpen ? null : item.kind); }}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setOpenKind(isOpen ? null : item.kind); } }}
              title={item.ids.length === 0 ? t.none : item.ids.join(" · ")}
              style={{ ...stack(3), paddingTop: "6px", borderTop: `1px ${item.kind === "UNSCORED_COVERAGE" ? "dashed" : "solid"} ${present ? color : "rgba(99, 120, 138, 0.25)"}`, opacity: present ? 1 : 0.4, cursor: "pointer", minWidth: 0 }}
            >
              <span style={{ fontFamily: MONO, fontSize: "20px", fontWeight: 300, letterSpacing: "-0.5px", lineHeight: 1, color: present ? color : MUTED }}>{item.ids.length}</span>
              <span style={{ ...micro, fontSize: "7.5px", letterSpacing: "0.6px", lineHeight: 1.3, color: present ? INK_SOFT : MUTED }}>{t.pendingKinds[item.kind]}</span>
              <span hidden={!isOpen} style={{ display: "none" }}>{t.ids}: {item.ids.length === 0 ? t.none : item.ids.join(" · ")}</span>
            </div>
          );
        })}
      </div>
      {open !== null && <span data-testid="job-field-pending-ids" data-kind={open.kind} data-jf-reveal="true" style={{ ...micro, color: INK_SOFT }}>{t.ids} · {t.pendingKinds[open.kind]}: {open.ids.length === 0 ? t.none : open.ids.join(" · ")}</span>}
      <button data-testid="job-field-pending-why" aria-expanded={whyOpen} onClick={event => { event.stopPropagation(); setWhyOpen(value => !value); }} style={{ ...ghost, alignSelf: "flex-start" }}>{whyOpen ? t.whyHide : t.why}</button>
      <span data-testid="job-field-pending-reason" hidden={!whyOpen} data-jf-reveal={whyOpen ? "true" : undefined} style={{ ...prose, fontSize: "11.5px", color: AMBER, opacity: 0.85, display: whyOpen ? "block" : "none" }}>{t.canonicalReason}</span>
    </div>
  );
}

function RoleDetail({ role, t, onBack }: { role: JobFieldRoleNode; t: JobFieldCopy; onBack(): void }) {
  const [revealAll, setRevealAll] = useState(false);
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(() => new Set());
  const [hovered, setHovered] = useState<string | null>(null);
  const toggle = (id: string) => setRevealed(previous => { const next = new Set(previous); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  return (
    <section data-testid="job-field-role-detail" data-role-id={role.poolRoleId} data-jf-reveal="true" style={stack(16)}>
      <div style={stack(6)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px" }}>
          <span style={label}>{role.organizationName}</span>
          <button data-testid="job-field-role-back" onClick={onBack} style={action("muted")}>{t.back}</button>
        </div>
        <h4 style={title}>{role.title}</h4>
        <p data-testid="job-field-reading" style={prose}>{readingSentence(t.reading, role)}</p>
        <span style={micro}>{role.seniority || "—"} · {role.domainFocus || "—"} · <span style={{ opacity: 0.7 }}>{role.poolRoleId} · {role.poolOrganizationId}</span></span>
        <div style={tether(role.hasScoredMatch)} />
      </div>
      <ResonanceReading role={role} t={t} />
      <Composition role={role} t={t} />
      <div style={stack(2)}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "8px" }}>
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
      </div>
      <PendingField roleId={role.poolRoleId} pending={role.pending} t={t} />
    </section>
  );
}

const CAMERA_SCALE = 1.5;
/** When a role is focused the camera moves onto it: the role sits at (280, 400) of the viewBox, the lens opens to its right. */
function camera(field: JobFieldModel, selectedRoleId: string | null): { scale: number; tx: number; ty: number } {
  const role = selectedRoleId === null ? null : field.roles.find(candidate => candidate.poolRoleId === selectedRoleId) ?? null;
  if (role === null) return { scale: 1, tx: 0, ty: 0 };
  return { scale: CAMERA_SCALE, tx: Math.round((280 - CAMERA_SCALE * role.x) * 100) / 100, ty: Math.round((400 - CAMERA_SCALE * role.y) * 100) / 100 };
}

function RoleNode({ role, selected, nearest, dimmed, focused, hoveredRequirementId, mode, t, onSelect, onHover, onHoverRequirement }: { role: JobFieldRoleNode; selected: boolean; nearest: boolean; dimmed: boolean; focused: boolean; hoveredRequirementId: string | null; mode: JobFieldMotionMode; t: JobFieldCopy; onSelect(): void; onHover(entered: boolean): void; onHoverRequirement(poolRequirementId: string | null): void }) {
  const radius = 26 + Math.min(10, role.counts.total);
  const moonRadius = selected ? radius + 40 : radius + 10;
  const moons = requirementMoons(role.requirements, moonRadius);
  const motion = roleMotion(role, mode);
  const rings = focused ? pendingRings(role.pending, mode) : [];
  const ringBase = selected ? moonRadius + 14 : radius + 7;
  const breathing = motion.kind === "BREATH" && motion.periodMs > 0;
  const named = (id: string) => role.requirements.find(requirement => requirement.poolRequirementId === id)?.capabilityName ?? id;
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
      data-moon-radius={moonRadius}
      transform={`translate(${role.x} ${role.y})`}
      onClick={event => { event.stopPropagation(); onSelect(); }}
      onMouseEnter={() => onHover(true)}
      onMouseLeave={() => onHover(false)}
      style={{ cursor: "pointer", opacity: dimmed ? 0.22 : 1, transition: "opacity 0.5s ease" }}
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
          <circle key={ring.kind} data-pending-kind={ring.kind} data-pending-count={ring.count} data-motion="ORBIT" r={ringBase + ring.radiusOffset} fill="none" stroke={PENDING_COLOR[ring.kind]} strokeWidth={1} strokeDasharray={ring.dasharray} style={{ opacity: ring.opacity, animation: ring.durationMs > 0 ? `jfOrbit ${ring.durationMs}ms linear infinite${ring.index % 2 === 1 ? " reverse" : ""}` : undefined }} />
        ))}
        <circle r={radius + 16} fill="none" stroke={selected ? CYAN : nearest ? "rgba(56, 229, 255, 0.45)" : "transparent"} strokeWidth={selected ? 1.2 : 1} strokeDasharray={nearest && !selected ? "4 4" : undefined} style={{ transition: "stroke .3s ease" }} />
        {selected && <circle r={moonRadius} fill="none" stroke="rgba(56, 229, 255, 0.14)" strokeDasharray="2 5" />}
        {moons.map(moon => {
          const moonStyle = segmentMotion(moon.state, mode);
          const hollow = moon.state === "NO_EVIDENCE_DELIVERED";
          const dashed = moon.state === "COVERED_UNSCORED";
          const hot = hoveredRequirementId === moon.poolRequirementId;
          const labelRadians = ((moon.angle - 90) * Math.PI) / 180;
          const labelX = Math.cos(labelRadians) * 11;
          const labelY = Math.sin(labelRadians) * 11;
          const anchor = Math.abs(Math.cos(labelRadians)) < 0.35 ? "middle" : Math.cos(labelRadians) > 0 ? "start" : "end";
          return (
            <g key={moon.poolRequirementId} onMouseEnter={() => selected && onHoverRequirement(moon.poolRequirementId)} onMouseLeave={() => selected && onHoverRequirement(null)}>
              <circle
                data-testid={`job-field-moon-${moon.poolRequirementId}`}
                data-segment-state={moon.state}
                data-motion={moonStyle.kind}
                cx={moon.x}
                cy={moon.y}
                r={hot ? 5.6 : selected ? 4.6 : 3.8}
                fill={hollow || dashed ? "none" : STATE_COLOR[moon.state]}
                stroke={STATE_COLOR[moon.state]}
                strokeWidth={hollow ? 1 : dashed ? 1.4 : 0}
                strokeDasharray={dashed ? "2 2" : undefined}
                style={{ opacity: moonStyle.opacity, transformBox: "fill-box", transformOrigin: "center", transition: "cx .78s cubic-bezier(.16,1,.3,1), cy .78s cubic-bezier(.16,1,.3,1), r .25s ease", animation: moonStyle.durationMs > 0 ? `${moonStyle.kind === "WAVER" ? "jfWaver" : "jfSpin"} ${moonStyle.durationMs}ms ${moonStyle.kind === "WAVER" ? "ease-in-out" : "linear"} infinite` : undefined, filter: moon.state === "MATCHED" ? `drop-shadow(0 0 3px ${SIL_TOKENS.colors.cyanGlowStrong})` : undefined }}
              />
              {selected && (
                <text data-jf-moon-label x={moon.x + labelX} y={moon.y + labelY + 3} textAnchor={anchor} fill={hot ? INK : STATE_COLOR[moon.state]} fontFamily={SANS} fontSize={hot ? 8.5 : 7.5} fontWeight={600} style={{ pointerEvents: "none", transition: "fill .2s ease" }}>{shortTitle(named(moon.poolRequirementId), 18)}</text>
              )}
            </g>
          );
        })}
        <g data-jf-body>
          <circle r={radius} fill={`rgba(56, 229, 255, ${motion.bodyOpacity})`} stroke={role.hasScoredMatch ? CYAN : "rgba(255, 91, 101, 0.5)"} strokeWidth={role.hasScoredMatch ? 1.2 : 0.9} style={{ ["--jf-lo" as string]: 1 - motion.amplitude * 0.5, ["--jf-hi" as string]: 1, animation: breathing ? `jfBreathLight ${motion.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties} />
          <text textAnchor="middle" y={0} fill={role.hasScoredMatch ? INK : MUTED} fontFamily={MONO} fontSize={12} fontWeight={700}>{percent(role.resonanceScore)}</text>
          <text textAnchor="middle" y={12} fill={MUTED} fontFamily={MONO} fontSize={8}>#{role.deliveredRank}</text>
        </g>
        {!selected && <text textAnchor="middle" y={radius + 28} fill={role.hasScoredMatch ? INK : MUTED} fontFamily={SANS} fontSize={12} fontWeight={600}>{shortTitle(role.title)}</text>}
        {focused && !selected && <text data-jf-hover-label textAnchor="middle" y={radius + 41} fill={MUTED} fontFamily={MONO} fontSize={8.5}>{shortTitle(role.organizationName, 28)}</text>}
        {focused && !selected && !role.hasScoredMatch && <text data-jf-hover-label textAnchor="middle" y={radius + 53} fill={RED} fontFamily={MONO} fontSize={8.5}>{t.noScoredMatch}</text>}
      </g>
    </g>
  );
}

function FieldCanvas({ field, selectedRoleId, hoveredRoleId, hoveredRequirementId, mode, t, onSelectRole, onHoverRole, onHoverRequirement }: { field: JobFieldModel; selectedRoleId: string | null; hoveredRoleId: string | null; hoveredRequirementId: string | null; mode: JobFieldMotionMode; t: JobFieldCopy; onSelectRole(poolRoleId: string | null): void; onHoverRole(poolRoleId: string | null): void; onHoverRequirement(poolRequirementId: string | null): void }) {
  const { center, innerRadius, outerRadius, size } = field.layout;
  const motion = fieldMotion(mode);
  const nearestId = field.nearestPresentedRole?.poolRoleId ?? null;
  const nearestNode = nearestId === null ? null : field.roles.find(role => role.poolRoleId === nearestId) ?? null;
  const view = camera(field, selectedRoleId);
  return (
    <svg data-testid="job-field-canvas" data-motion-mode={mode} data-camera-scale={view.scale} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }} onClick={() => onSelectRole(null)}>
      <defs>
        <filter id="jfBlur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
        <filter id="jfBlurSoft" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22" /></filter>
        <filter id="jfNebula" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="34" /></filter>
        <radialGradient id="jfCoreGradient"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.55)" /><stop offset="55%" stopColor="rgba(56, 229, 255, 0.12)" /><stop offset="100%" stopColor="rgba(56, 229, 255, 0)" /></radialGradient>
        <radialGradient id="jfFieldGradient"><stop offset="0%" stopColor="rgba(56, 229, 255, 0.06)" /><stop offset="70%" stopColor="rgba(56, 229, 255, 0.015)" /><stop offset="100%" stopColor="rgba(3, 5, 8, 0)" /></radialGradient>
      </defs>
      <g data-jf-camera style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: "0 0", transition: "transform .78s cubic-bezier(.16,1,.3,1)" }}>
        <circle cx={center} cy={center} r={outerRadius + 60} fill="url(#jfFieldGradient)" />
        {field.organizations.map(organization => {
          const hue = organizationHue(organization.hueIndex);
          const lit = organization.aggregateScore !== null;
          const light = lit ? 0.05 + 0.3 * Math.min(1, Math.max(0, organization.aggregateScore ?? 0)) : 0.045;
          const focusedHere = organization.roleIds.some(id => id === hoveredRoleId || id === selectedRoleId);
          return (
            <path
              key={organization.poolOrganizationId}
              data-testid={`job-field-nebula-${organization.poolOrganizationId}`}
              data-aggregate-score={organization.aggregateScore ?? ""}
              data-hue={hue}
              data-motion={lit && motion.core.periodMs > 0 ? "BREATH" : "STILL"}
              d={sectorPath(center, center, innerRadius - 14, outerRadius + 46, organization.startAngle + 1, organization.endAngle - 1)}
              fill={`hsla(${hue}, 85%, 62%, 1)`}
              filter="url(#jfNebula)"
              style={{ opacity: light * (focusedHere ? 1.35 : selectedRoleId !== null ? 0.5 : 1), ["--jf-lo" as string]: light * 0.75, ["--jf-hi" as string]: light * 1.25, animation: lit && motion.core.periodMs > 0 ? `jfNebula ${motion.core.periodMs * 1.6}ms ease-in-out infinite` : undefined, transition: "opacity .4s ease", pointerEvents: "none" } as React.CSSProperties}
            />
          );
        })}
        {field.roles.filter(role => role.hasScoredMatch).map(role => (
          <line key={`thread-${role.poolRoleId}`} data-testid={`job-field-thread-${role.poolRoleId}`} data-resonance-score={role.resonanceScore} x1={center} y1={center} x2={role.x} y2={role.y} stroke={CYAN} strokeWidth={0.8} style={{ opacity: (0.08 + 0.42 * role.resonanceScore) * (selectedRoleId !== null && selectedRoleId !== role.poolRoleId ? 0.3 : 1), pointerEvents: "none", transition: "opacity .4s ease" }} />
        ))}
        <circle cx={center} cy={center} r={innerRadius} fill="none" stroke="rgba(56, 229, 255, 0.16)" strokeDasharray="2 6" />
        <circle cx={center} cy={center} r={(innerRadius + outerRadius) / 2} fill="none" stroke="rgba(56, 229, 255, 0.09)" strokeDasharray="2 6" />
        <circle cx={center} cy={center} r={outerRadius} fill="none" stroke="rgba(255, 91, 101, 0.2)" strokeDasharray="2 6" />
        <text x={center} y={center - outerRadius - 46} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={8} opacity={0.8}>{t.resonance} 0% · {t.noScoredMatch}</text>
        <text x={center} y={center - innerRadius - 10} textAnchor="middle" fill="rgba(56, 229, 255, 0.5)" fontFamily={MONO} fontSize={8}>{t.resonance} 100%</text>
        {field.organizations.map(organization => {
          const mid = (organization.startAngle + organization.endAngle) / 2;
          const radians = ((mid - 90) * Math.PI) / 180;
          const labelRadius = outerRadius + 64;
          const focusedHere = organization.roleIds.some(id => id === hoveredRoleId || id === selectedRoleId);
          return (
            <g key={organization.poolOrganizationId} data-testid={`job-field-organization-${organization.poolOrganizationId}`} data-role-count={organization.roleIds.length} style={{ transition: "opacity .3s ease", opacity: selectedRoleId !== null && !focusedHere ? 0.3 : 1 }}>
              <path d={arcPath(center, center, outerRadius + 40, organization.startAngle + 2, organization.endAngle - 2)} fill="none" stroke={focusedHere ? `hsla(${organizationHue(organization.hueIndex)}, 85%, 70%, 0.7)` : `hsla(${organizationHue(organization.hueIndex)}, 85%, 70%, 0.28)`} strokeWidth={focusedHere ? 1.6 : 1} style={{ transition: "stroke .3s ease" }} />
              <text x={center + labelRadius * Math.cos(radians)} y={center + labelRadius * Math.sin(radians)} textAnchor="middle" dominantBaseline="middle" fill={focusedHere ? INK : MUTED} fontFamily={MONO} fontSize={9.5} letterSpacing={1.4}>{shortTitle(organization.name.toUpperCase(), 30)}</text>
            </g>
          );
        })}
        {nearestNode !== null && (
          <line data-testid="job-field-nearest-ray" data-motion="FLOW" x1={center} y1={center} x2={nearestNode.x} y2={nearestNode.y} stroke={CYAN} strokeWidth={1.2} strokeDasharray={motion.nearestFlow.dasharray} opacity={selectedRoleId !== null && selectedRoleId !== nearestId ? 0.2 : 0.7} style={{ animation: motion.nearestFlow.durationMs > 0 ? `jfFlow ${motion.nearestFlow.durationMs}ms linear infinite` : undefined, transition: "opacity .4s ease" }} />
        )}
        <g data-testid="job-field-core" data-candidate-capability-count={field.candidateCapabilityCount} data-sweep-proposal-count={field.capabilitySweep.proposalCount} data-motion="BREATH" transform={`translate(${center} ${center})`} style={{ opacity: selectedRoleId !== null ? 0.55 : 1, transition: "opacity .4s ease" }}>
          <circle r={110} fill="url(#jfCoreGradient)" filter="url(#jfBlurSoft)" style={{ ["--jf-lo" as string]: 0.55, ["--jf-hi" as string]: 1, animation: motion.core.periodMs > 0 ? `jfBreathLight ${motion.core.periodMs}ms ease-in-out infinite` : undefined } as React.CSSProperties} />
          <g style={{ ["--jf-amp" as string]: motion.core.amplitudeScale, animation: motion.core.periodMs > 0 ? `jfBreathScale ${motion.core.periodMs}ms ease-in-out infinite` : undefined, transformBox: "fill-box", transformOrigin: "center" } as React.CSSProperties}>
            <circle r={54} fill="rgba(3, 5, 8, 0.92)" stroke={CYAN} strokeWidth={1.5} style={{ filter: `drop-shadow(0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong})` }} />
            <text textAnchor="middle" y={-8} fill={CYAN} fontFamily={MONO} fontSize={10} fontWeight={700} letterSpacing={1.5}>{t.core}</text>
            <text textAnchor="middle" y={6} fill={INK} fontFamily={MONO} fontSize={9}>{field.candidateCapabilityCount} · {field.capabilitySweep.proposalCount}</text>
            <text textAnchor="middle" y={18} fill={MUTED} fontFamily={MONO} fontSize={7}>scored · unscored</text>
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
            hoveredRequirementId={role.poolRoleId === selectedRoleId ? hoveredRequirementId : null}
            mode={mode}
            t={t}
            onSelect={() => onSelectRole(role.poolRoleId === selectedRoleId ? null : role.poolRoleId)}
            onHover={entered => onHoverRole(entered ? role.poolRoleId : null)}
            onHoverRequirement={onHoverRequirement}
          />
        ))}
      </g>
    </svg>
  );
}

function StateLine({ state, t }: { state: JobFieldState; t: JobFieldCopy }) {
  const tone = state === "AVAILABLE" ? CYAN : state === "FAILED" || state === "NOT_FOUND" ? RED : AMBER;
  const live = state === "LOADING";
  return (
    <span data-testid="job-field-state" data-state={state} style={{ ...micro, color: state === "AVAILABLE" ? MUTED : tone, display: "inline-flex", alignItems: "center", gap: "8px", lineHeight: 1.4 }}>
      <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: tone, boxShadow: `0 0 8px ${tone}`, flexShrink: 0, animation: live ? "jfPulse 1.4s ease-in-out infinite" : undefined }} />
      {t.states[state]}
    </span>
  );
}

/** A lens: the one contextual reading of the focused body. No border, a faint void behind the text so the galaxy stays readable. */
const lens: React.CSSProperties = { background: "radial-gradient(ellipse at 20% 0%, rgba(3, 5, 8, 0.94) 0%, rgba(3, 5, 8, 0.82) 60%, rgba(3, 5, 8, 0.6) 100%)", backdropFilter: "blur(6px)", borderRadius: "14px", padding: "14px 16px" };
const pct = (value: number) => `${(value / JOB_FIELD_LAYOUT_SIZE) * 100}%`;
const JOB_FIELD_LAYOUT_SIZE = 800;

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
  const [hoveredRequirementId, setHoveredRequirementId] = useState<string | null>(null);
  const [legendOpen, setLegendOpen] = useState(false);
  /** The caption sits outward from the core, on the free side of its body, so it never covers the candidate or another body. */
  const captionSide = nearestNode === null ? "right" : nearestNode.x >= 400 ? "right" : "left";
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
      data-surface-grammar="FIELD_EXTENSION_V1"
      data-galaxy-grammar="GALAXY_V1"
      data-interaction-grammar="LENS_V1"
      data-focus-level={selectedId !== null ? "ROLE" : "FIELD"}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.9)", backdropFilter: "blur(8px)", fontFamily: MONO, color: INK, animation: motion.enterMs > 0 ? `jfEnter ${motion.enterMs}ms ease-out both` : undefined }}
    >
      <style>{MOTION_CSS}</style>

      {/* The stage: the galaxy and its lenses share one coordinate space (percentages of the viewBox). */}
      <div data-testid="job-field-stage" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: "min(90vh, 62vw, 820px)", height: "min(90vh, 62vw, 820px)" }}>
        {field !== null && <FieldCanvas field={field} selectedRoleId={selectedId} hoveredRoleId={hoveredRoleId} hoveredRequirementId={hoveredRequirementId} mode={mode} t={t} onSelectRole={onSelectRole} onHoverRole={setHoveredRoleId} onHoverRequirement={setHoveredRequirementId} />}

        {/* FIELD level: one caption at the nearest presented role; nothing else occupies attention. */}
        {field !== null && selection.kind !== "ROLE" && nearestNode !== null && (
          <section
            data-testid="job-field-nearest"
            data-role-id={nearestNode.poolRoleId}
            data-jf-reveal="true"
            data-caption-side={captionSide}
            style={{ ...lens, position: "absolute", left: captionSide === "right" ? `calc(${pct(nearestNode.x)} + 64px)` : `calc(${pct(nearestNode.x)} - 64px)`, top: pct(nearestNode.y), transform: captionSide === "right" ? "translateY(-50%)" : "translate(-100%, -50%)", width: "min(300px, 36%)", ...stack(10), zIndex: 3, pointerEvents: "none" }}
          >
            <span style={sectionTitle}>{t.nearest}</span>
            <h4 style={{ ...title, fontSize: "18px" }}>{nearestNode.title}</h4>
            <span style={micro}>{nearestNode.organizationName}</span>
            <p data-testid="job-field-reading" style={{ ...prose, fontSize: "12px" }}>{readingSentence(t.reading, nearestNode)}</p>
            <ResonanceReading role={nearestNode} t={t} />
            <PendingField roleId={nearestNode.poolRoleId} pending={nearestNode.pending} t={t} />
            <span style={{ ...amber, fontSize: "8.5px" }}>{t.nearestLabel}</span>
            <button data-testid="job-field-open-nearest" onClick={() => onSelectRole(nearestNode.poolRoleId)} style={{ ...action("cyan"), alignSelf: "flex-start" }}>{t.open} →</button>
          </section>
        )}
        {field !== null && selection.kind !== "ROLE" && nearestNode === null && (
          <section data-testid="job-field-no-nearest" data-jf-reveal="true" style={{ ...lens, position: "absolute", left: "50%", top: "calc(50% + 96px)", transform: "translateX(-50%)", width: "min(320px, 40%)", ...stack(8), zIndex: 3, textAlign: "center" }}>
            <span style={sectionTitle}>{t.nearest}</span>
            <span style={{ ...prose, color: RED }}>{t.noNearest}</span>
            <span style={{ ...amber, fontSize: "8.5px" }}>{t.nearestLabel}</span>
          </section>
        )}

        {/* ROLE level: the camera sits on the role; its reading opens beside it as one lens. */}
        {field !== null && selection.kind === "ROLE" && (
          <div data-testid="job-field-lens" data-role-id={selection.role.poolRoleId} style={{ ...lens, position: "absolute", left: "calc(35% + 210px)", top: "8%", width: "min(380px, 44%)", maxHeight: "84%", overflowY: "auto", zIndex: 3 }}>
            <RoleDetail key={selection.role.poolRoleId} role={selection.role} t={t} onBack={() => onSelectRole(null)} />
          </div>
        )}

        {/* No field yet: the state itself is the centre. */}
        {state === "NO_POOL" && (
          <div data-testid="job-field-pool-selection" data-jf-reveal="true" style={{ ...lens, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(360px, 60%)", ...stack(10), zIndex: 3 }}>
            <span style={sectionTitle}>{t.states.NO_POOL}</span>
            {listed.length === 0 && <span style={prose}>{SIL_COPY[locale].jobPool.poolsEmpty}</span>}
            {listed.map(pool => (
              <div key={pool.jobPoolUploadId} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", paddingBottom: "8px", borderBottom: "1px solid rgba(99, 120, 138, 0.2)" }}>
                <span style={stack(2)}><span style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 500, color: INK }}>{pool.poolName}</span><span style={micro}>v{pool.poolVersion} · {pool.poolStatus}</span></span>
                <button data-testid={`job-field-select-pool-${pool.jobPoolUploadId}`} onClick={() => onSelectPool(pool.jobPoolUploadId)} style={action("cyan")}>{t.select}</button>
              </div>
            ))}
          </div>
        )}
        {state === "NO_ANALYSIS" && <span data-testid="job-field-no-analysis" data-jf-reveal="true" style={{ ...lens, ...prose, color: AMBER, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(360px, 60%)", textAlign: "center", zIndex: 3 }}>{t.states.NO_ANALYSIS}</span>}
        {field !== null && selection.kind === "NOT_DELIVERED" && <span data-testid="job-field-role-not-delivered" data-jf-reveal="true" style={{ ...lens, ...prose, color: RED, position: "absolute", left: "50%", top: "calc(50% + 96px)", transform: "translateX(-50%)", width: "min(320px, 40%)", textAlign: "center", zIndex: 3 }}>{selection.poolRoleId} · {t.states.NOT_FOUND}</span>}
      </div>

      {/* Orientation: one small line, never a panel. */}
      <div data-jf-surface="header" style={{ position: "absolute", left: "28px", top: "136px", ...stack(6), zIndex: 46, maxWidth: "min(300px, 26vw)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px" }}>
          <h3 style={{ ...label, color: CYAN, fontSize: "10px", letterSpacing: "2.4px", textShadow: `0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong}` }}>{t.title}</h3>
          <button data-testid="job-field-exit-btn" onClick={onExit} style={action("muted")}>{t.exit}</button>
        </div>
        <StateLine state={state} t={t} />
      </div>

      {/* Legend: an affordance, open on demand; the key and every explanation live here. */}
      {field !== null && (
        <div data-testid="job-field-legend" data-legend-open={legendOpen ? "true" : "false"} style={{ position: "absolute", left: "28px", bottom: "calc(var(--condyn-page-header-height, 60px) + 52px)", ...stack(10), zIndex: 46, width: "min(320px, 28vw)" }}>
          <div data-testid="job-field-legend-text" hidden={!legendOpen} data-jf-reveal={legendOpen ? "true" : undefined} style={{ ...lens, display: legendOpen ? "flex" : "none", flexDirection: "column", gap: "10px", maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
            <span style={{ ...micro, opacity: 0.8 }}>{t.subtitle}</span>
            <div style={stack(6)}>
              {STATES.map(stateKey => <span key={stateKey} style={stateWord(STATE_COLOR[stateKey])}><StateDot state={stateKey} size={7} />{t.requirementStates[stateKey]}</span>)}
            </div>
            <div style={{ display: "flex", gap: "22px" }}>
              <span style={{ display: "flex", flexDirection: "column-reverse", gap: "3px" }}><span style={{ ...micro, fontSize: "8px", letterSpacing: "1px", textTransform: "uppercase" }}>{t.coreCapabilities}: </span><span style={{ ...display, fontSize: "22px" }}>{field.candidateCapabilityCount}</span></span>
              <span style={{ display: "flex", flexDirection: "column-reverse", gap: "3px" }}><span style={{ ...micro, fontSize: "8px", letterSpacing: "1px", textTransform: "uppercase" }}>{t.coreSweep}: </span><span style={{ ...display, fontSize: "22px", color: INK_SOFT }}>{field.capabilitySweep.proposalCount}<span style={{ ...micro, marginLeft: "6px", letterSpacing: "0.6px" }}>({field.capabilitySweep.state})</span></span></span>
            </div>
            <span style={micro}>{t.ranking[field.ranking]}</span>
            <p style={prose}>{t.legend}</p>
            <p style={{ ...prose, color: "rgba(56, 229, 255, 0.78)" }}>{t.motion}</p>
            <p style={{ ...prose, color: "rgba(56, 229, 255, 0.78)" }}>{t.galaxy}</p>
            <span style={micro}>{t.hoverHint}</span>
          </div>
          <button data-testid="job-field-legend-toggle" aria-expanded={legendOpen} onClick={() => setLegendOpen(value => !value)} style={{ ...ghost, alignSelf: "flex-start", fontSize: "9px" }}>{legendOpen ? t.legendHide : `ⓘ ${t.legendToggle}`}</button>
        </div>
      )}

      {/* Ground line: the laws of the field, always visible, never in the way (B-JF-GROUND-LINE). */}
      <span data-testid="job-field-non-claims" style={{ position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 22px)", transform: "translateX(-50%)", maxWidth: "min(900px, 80vw)", textAlign: "center", ...micro, fontSize: "8.5px", letterSpacing: "1.4px", color: "rgba(230, 241, 248, 0.55)", zIndex: 46 }}>{t.nonClaims}</span>
    </div>
  );
}
