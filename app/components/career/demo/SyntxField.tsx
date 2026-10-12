"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { useOrbitalMotionElapsedMs } from "./OrbitalSatelliteMotion";
import { renderSemioticSignature } from "./OrbitalResonanceBubble";
import { SYNTX_RESONANCE_BODY_KEYFRAMES, SyntxResonanceBody } from "./manifestation/SyntxResonanceBody";
import { SYNTX_CORE_KEYFRAMES, SyntxCoreOrganism } from "./manifestation/SyntxCoreOrganism";
import { SyntxEnergyRay, SyntxPlanetariumBackdrop } from "./manifestation/SyntxPlanetarium";
import { FocusTransitionStageShell, SYNTX_FOCUS, SYNTX_FOCUS_PULSE_KEYFRAMES } from "./manifestation/SyntxFocusShell";
import { SYNTX_COSMOS_BACKDROP, SYNTX_COSMOS_CENTER_MATERIAL, SYNTX_COSMOS_NODE_MATERIAL, SYNTX_COSMOS_STARS, SyntxCosmosShell } from "./manifestation/SyntxCosmosShell";
import { SYNTX_DEEP_FOCUS_BACKDROP, SYNTX_EVIDENCE_LINK, SYNTX_EVIDENCE_SURFACE_MATERIAL, SYNTX_NUCLEUS_MATERIAL, SYNTX_SATELLITE_MATERIAL, SyntxDeepFocusShell } from "./manifestation/SyntxDeepFocusShell";
import { SYNTX_HUD_SURFACE } from "./manifestation/SyntxHudSurface";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import { resolveSilFocusedManifestationPresentation } from "../../../../lib/career/view-model/focused-orbit-placement";
import { describeRanking, describeSelection, type JobPoolAnalysisSource } from "../../../../lib/career/job-pool/frontend-presentation";
import { useJobPoolWorkflow } from "../../../../lib/career/ui/useJobPool";
import { useAnalysisSources } from "../../../../lib/career/ui/useJobPoolSources";
import {
  deriveSyntxField,
  inspectSign,
  observeOrganization,
  observeRequirement,
  observeRole,
  resolveObservation,
  returnFrom,
  summarySentence,
  PENDING_BOUNDARY_RADIUS,
  PLANETARIUM_BODY,
  SOURCE_RING_RADIUS,
  SUPPORT_DISTANCE,
  SYNTX_FIELD_GRAMMAR,
  SYNTX_LAYOUT,
  tracePath,
  tracePoint,
  traceRayPath,
  wrapLines,
  type SyntxAperture,
  type SyntxField as SyntxFieldModel,
  type SyntxObservation,
  type SyntxOrganization,
  type SyntxRequirement,
  type SyntxRole,
  type SyntxSource,
  type SyntxSupport,
  type SyntxTrace,
  type VisualSign
} from "../../../../lib/career/job-pool/syntx-field-view-model";
import {
  cardBeside,
  ecologyToScreen,
  evidenceRelationPath,
  EVIDENCE_ROW,
  requirementCardMode,
  roleCosmosRotation,
  syntxCosmosLayout,
  syntxEcologyFrame,
  syntxRequirementFocus,
  SYNTX_MARGIN,
  type SyntxEcologyFrame,
  type SyntxEvidenceRows
} from "../../../../lib/career/job-pool/syntx-manifestation-layout";

/**
 * SYNTX field (owner mandates "SFE — SYNTX SEMIONTIC FIELD RECONSTRUCTION", 2026-10-11, and "GRÜN — SYNTX SEMIOTIC TRANSFER",
 * 2026-10-12): the Job Pool in the visual language of the Capability Field, built from its own manifestation grammar
 * (./manifestation — the planetarium, the resonance body, the core organism, the focus transformation, the cosmos, the
 * deep focus and the hologram HUD, extracted from the Capability Field with its rendering byte-identical).
 *
 *   JOB POOL (planetarium: the pool as the core, organizations as resonance bodies, roles as their moons)
 *   → ORGANIZATION (the body moves to the centre, the planetarium recedes; its roles orbit as cosmos satellites)
 *   → ROLE (the organization cosmos recedes; the role is the centre of its own cosmos: requirements on the orbit of their
 *     support category, source documents on theirs, evidence traces between them, the suspended boundary around)
 *   → REQUIREMENT (deep focus: the requirement as nucleus, its siblings receded, the evidence surface beneath)
 *   → EVIDENCE (the inspection aperture as a hologram HUD on its tether)
 *
 * Everything rendered is a visual sign of the pure view model (syntx-field-view-model.ts) and carries its sign and proof
 * attributes (JOB_FIELD_FRONTEND.md §13, BR-1 … BR-5); each sign is rendered exactly once, at the level where it manifests.
 * Nothing here scores, evaluates, recommends or decides.
 */
export type JobPoolWorkflow = ReturnType<typeof useJobPoolWorkflow>;
type SyntxCopy = (typeof SIL_COPY)[SilLocale]["syntx"];
type PoolCopy = (typeof SIL_COPY)[SilLocale]["jobPool"];
export type SyntxMotionMode = "LIVE" | "REDUCED";

export type SyntxFieldState = "NO_POOL" | "NO_ANALYSIS" | "LOADING" | "AVAILABLE" | "NOT_FOUND" | "INACTIVE_POOL" | "NOT_PROVISIONED" | "FAILED";

export interface SyntxFieldProps {
  workflow: JobPoolWorkflow;
  analysisSource: JobPoolAnalysisSource;
  observation: SyntxObservation;
  onObserve(next: SyntxObservation): void;
  onSelectPool(jobPoolUploadId: string): void;
  onExit(): void;
  locale?: SilLocale;
}

const CYAN = SIL_TOKENS.colors.cyanActive;
const AMBER = SIL_TOKENS.colors.tensionAmber;
const MONO = SIL_TOKENS.typography.mono;
const SANS = SIL_TOKENS.typography.sans;
const INK = SIL_TOKENS.colors.textPrimary;
const INK_SOFT = "rgba(230, 241, 248, 0.78)";
const MUTED = SIL_TOKENS.colors.textMuted;
const NEUTRAL = "rgba(230, 241, 248, 0.42)";
const MINT = "#7effcc";

const micro: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", color: MUTED, letterSpacing: "0.3px", lineHeight: 1.55, wordBreak: "break-word" };
const label: React.CSSProperties = { fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: MUTED, margin: 0 };
const prose: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.65, color: INK_SOFT, margin: 0 };
const stack = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: `${gap}px` });
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: `${gap}px`, flexWrap: "wrap" });
const word = (color: string): React.CSSProperties => ({ fontFamily: MONO, fontSize: "8px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color, whiteSpace: "nowrap" });
const action = (tone: "cyan" | "muted" = "cyan", enabled = true): React.CSSProperties => ({ background: "transparent", border: "none", padding: "4px 0", fontFamily: MONO, fontSize: "9px", fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: !enabled ? "rgba(99, 120, 138, 0.6)" : tone === "cyan" ? CYAN : MUTED, cursor: enabled ? "pointer" : "not-allowed", textShadow: enabled && tone === "cyan" ? `0 0 10px ${SIL_TOKENS.colors.cyanGlow}` : undefined, transition: "color .25s ease" });
const ghost: React.CSSProperties = { ...action("muted"), fontSize: "8px", letterSpacing: "1px" };
/** An edge lens: the hologram HUD surface of the planetarium (opaque universe body, cyan frame), placed at the field's edge. */
const lens: React.CSSProperties = { ...SYNTX_HUD_SURFACE, position: undefined, width: undefined, zIndex: undefined };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "transparent", border: "none", borderBottom: "1px solid rgba(99, 120, 138, 0.4)", color: INK, fontFamily: MONO, fontSize: "10px", padding: "5px 0", outline: "none" };
const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const visuallyHidden: React.CSSProperties = { position: "absolute", width: "1px", height: "1px", margin: "-1px", padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 };
/** HUD typography of the planetarium (OrbitalResonanceBubble): title row, primary metric, section label, item list, hint. */
const hudTitle: React.CSSProperties = { fontSize: "11px", color: CYAN, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, borderBottom: "1px solid rgba(56, 229, 255, 0.35)", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" };
const hudMetric: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: INK, marginBottom: "10px", letterSpacing: "0.5px" };
const hudSection: React.CSSProperties = { fontSize: "9px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px", fontWeight: 700 };
const hudHint: React.CSSProperties = { fontSize: "9px", color: "rgba(56, 229, 255, 0.65)", borderTop: "1px solid rgba(56, 229, 255, 0.15)", paddingTop: "6px", letterSpacing: "0.5px" };
const pill: React.CSSProperties = { fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${CYAN}`, color: CYAN };

/** Readable labels: wrap at word boundaries, never truncate as the primary display (spec §9.3). */
export { wrapLines };

/**
 * Motion of the field: the Capability Field's own (planetarium float, moons, core plasma, ray photons, cosmos satellites on
 * the shared rAF clock, deep-focus settle, HUD float), LIVE only. REDUCED is total: no CSS animation, no photon, the rAF clock
 * never starts, every sign in its place. The ruling that binds the names is GELB's (R15 / R15a, proposal R15b).
 */
export const SYNTX_AMBIENT_MOTION = true;
/** Infinite animations of the Job Field in LIVE mode (closed list; the planetarium's and the field's own; everything else is finite). */
export const SYNTX_AMBIENT_NAMES = Object.freeze(["orbitFloatPhase2", "moonOrbit", "ringPulse", "atmosphereGlow", "hologramFloat", "coreBreathe", "corePulseCommunicate", "plasmaRotateCw", "plasmaRotateCcw", "plasmaFlarePulse", "waveExpand", "particleIn", "rotateClockwise", "focusTransitionPulse", "sxSuspend"]);

const SYNTX_CSS = `
${SYNTX_RESONANCE_BODY_KEYFRAMES}
${SYNTX_CORE_KEYFRAMES}
${SYNTX_FOCUS_PULSE_KEYFRAMES}
@keyframes rotateClockwise { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes sxEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes sxApertureBreathe { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
@keyframes sxRise { from { opacity: 0; } to { opacity: 1; } }
@keyframes sxSuspend { to { stroke-dashoffset: -120; } }
@keyframes sxUnfold { from { opacity: 0; transform: scale(.62); } to { opacity: 1; transform: scale(1); } }
@keyframes sxSuspendEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes sxTraceDraw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
@keyframes sxNucleusSettle { from { opacity: 0; transform: translate(-50%, -50%) scale(0.78); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
@keyframes sxSatelliteSettle { from { opacity: 0; transform: translate(-50%, -50%) scale(0.62); } to { opacity: var(--satellite-opacity); transform: translate(-50%, -50%) scale(var(--satellite-scale)); } }
[data-testid="syntx-field"] [data-sx-reveal] { animation: sxRise .32s ease-out backwards; }
/* Levels enter as the Capability Field's cosmos and deep focus enter (opacity over .72 s on the field's one easing). */
[data-testid="syntx-field"] [data-sx-level]:not([data-sx-level="planetarium"]) { animation: sxEnter .72s cubic-bezier(.16,1,.3,1) backwards; }
/* Requirement satellites unfold out of the role (deep-focus satellite settle: .62 → 1 over .72 s); evidence rises along its trace. */
[data-sx-level="role"] [data-sign-manifestation="anchor"][data-sign-transition="unfold"] { transform-origin: var(--sx-origin, center); animation: sxUnfold .72s cubic-bezier(.16,1,.3,1) backwards; }
[data-testid="syntx-field"] [data-sign-transition="trace_rise"][data-sign-manifestation^="trace"] { animation: sxRise .5s ease-out .5s backwards; }
[data-testid="syntx-field"] [data-sign-transition="trace_rise"] > [data-sx-trace-ray] { animation: sxTraceDraw 1.1s cubic-bezier(.3,0,.2,1) .55s backwards; }
[data-testid="syntx-field"] [data-sign-transition="boundary_suspend"] { animation: sxSuspendEnter .78s cubic-bezier(.16,1,.3,1) backwards; }
/* Glow referents: a trace glows only while inspectable. */
[data-testid="syntx-field"] [data-sx-trace-glow] { opacity: 0; transition: opacity .45s ease; }
[data-testid="syntx-field"] [data-sign-state="inspectable"] > [data-sx-trace-glow] { opacity: 1; }
[data-testid="syntx-field"] [data-sign-interaction="select"]:hover { filter: brightness(1.18); }
[data-testid="syntx-field"] button:hover:not(:disabled) { color: #e6f1f8; }
/* The field's buttons are signs and cards of the planetarium, not app buttons: no ripple veil, no press shrink. */
[data-testid="syntx-field"] button::before { content: none; display: none; }
[data-testid="syntx-field"] button:active { transform: none; }
[data-testid="syntx-field"] button:focus-visible, [data-testid="syntx-field"] input:focus-visible, [data-testid="syntx-field"] [tabindex="0"]:focus-visible { outline: 1px solid rgba(56, 229, 255, 0.75); outline-offset: 3px; }
[data-testid="syntx-field"] g[tabindex]:focus { outline: none; }
[data-testid="syntx-field"] g[tabindex]:focus-visible > :not([data-sx-hit]) { filter: drop-shadow(0 0 4px rgba(56, 229, 255, 0.9)); }
[data-testid="syntx-field"] [data-sign-id] { transition: opacity .45s ease, filter .62s ease; }
[data-testid="syntx-field"] [data-sx-surface] { scrollbar-width: thin; scrollbar-color: rgba(56, 229, 255, 0.18) transparent; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="syntx-field"], [data-testid="syntx-field"] * { animation: none !important; transition: none !important; }
}
`;

function useMotionMode(): SyntxMotionMode {
  const [mode, setMode] = useState<SyntxMotionMode>("LIVE");
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

/** The viewport of the stage (the Capability layouts' ResizeObserver; 1200 × 760 on the server). */
function useStageSize(ref: React.RefObject<HTMLElement | null>): { width: number; height: number } {
  const [size, setSize] = useState({ width: 1200, height: 760 });
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: Math.max(320, Math.floor(entry.contentRect.width)), height: Math.max(300, Math.floor(entry.contentRect.height)) }));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

export function describeSyntxFieldState(workflow: JobPoolWorkflow, analysisSource: JobPoolAnalysisSource): SyntxFieldState {
  if (workflow.selectedJobPoolUploadId === null) return "NO_POOL";
  if (workflow.view.state === "LOADING" || workflow.view.state === "IDLE") return "LOADING";
  if (workflow.view.state === "NOT_FOUND") return "NOT_FOUND";
  if (workflow.view.state === "NOT_PROVISIONED") return "NOT_PROVISIONED";
  if (workflow.view.state === "FAILED") return "FAILED";
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

/** BR-2: the sign and proof attributes of one visual sign; proof ids are attributes only, never default-state text. */
function signAttributes(sign: VisualSign): Record<string, string> {
  const attributes: Record<string, string> = {
    "data-sign-id": sign.id,
    "data-sign-source": sign.source,
    "data-sign-relation": sign.relation,
    "data-sign-state": sign.state,
    "data-sign-manifestation": sign.manifestation,
    "data-sign-interaction": sign.interaction,
    "data-sign-transition": sign.transition
  };
  const proof = sign.proof;
  if (proof.uploadId) attributes["data-proof-upload-id"] = proof.uploadId;
  if (proof.organizationId) attributes["data-proof-organization-id"] = proof.organizationId;
  if (proof.roleId) attributes["data-proof-role-id"] = proof.roleId;
  if (proof.requirementId) attributes["data-proof-requirement-id"] = proof.requirementId;
  if (proof.targetId) attributes["data-proof-target-id"] = proof.targetId;
  if (proof.trqrevId) attributes["data-proof-trqrev-id"] = proof.trqrevId;
  if (proof.analysisId) attributes["data-proof-analysis-id"] = proof.analysisId;
  if (proof.capabilityId) attributes["data-proof-capability-id"] = proof.capabilityId;
  if (proof.docId) attributes["data-proof-doc-id"] = proof.docId;
  if (proof.evidenceId) attributes["data-proof-evidence-id"] = proof.evidenceId;
  return attributes;
}

const receded = (sign: VisualSign): boolean => sign.state === "receded";
/** Render order of traces: receded first, then field, inspectable last (O-SX-1: the inspectable trace owns the pointer where traces converge). */
const traceOrder = (trace: SyntxTrace): number => (trace.sign.state === "inspectable" ? 2 : trace.sign.state === "receded" ? 0 : 1);
const recedeOpacity = (sign: VisualSign, deep = 0.22): number => (receded(sign) ? deep : 1);
/** Enter / Space on a focusable sign that is not a native button. */
const keyActivate = (handler: () => void) => (event: React.KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); handler(); } };
const stop = (handler: () => void) => (event: React.MouseEvent) => { event.stopPropagation(); handler(); };

/** The open boundary of a requirement without delivered support: an arc around its glyph whose gap faces outward. */
function openArc(cx: number, cy: number, radius: number, outwardAngle: number): string {
  const start = outwardAngle + 38;
  const end = outwardAngle + 322;
  const point = (angle: number) => { const radians = ((angle - 90) * Math.PI) / 180; return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)] as const; };
  const [x1, y1] = point(start);
  const [x2, y2] = point(end);
  return `M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`;
}

/** The glyph of a support category (the anchor body): filled = scored support, outlined thin = weak, dashed = sweep only, open = none. */
const SUPPORT_SHAPE: Record<SyntxSupport, { fill: string; stroke: string; strokeWidth: number; dash?: string; r: number }> = {
  SUPPORTED: { fill: CYAN, stroke: CYAN, strokeWidth: 0, r: 7.5 },
  WEAK: { fill: "rgba(56, 229, 255, 0.18)", stroke: "rgba(56, 229, 255, 0.75)", strokeWidth: 1.2, r: 6.8 },
  SWEEP_ONLY: { fill: "none", stroke: "rgba(56, 229, 255, 0.7)", strokeWidth: 1.4, dash: "2 2.6", r: 7 },
  OPEN: { fill: "none", stroke: NEUTRAL, strokeWidth: 0, r: 6.8 },
  UNREAD: { fill: "none", stroke: "rgba(230, 241, 248, 0.5)", strokeWidth: 1, r: 6.2 }
};
const SUPPORT_ORDER: readonly SyntxSupport[] = ["SUPPORTED", "WEAK", "UNREAD", "SWEEP_ONLY", "OPEN"];

/** The relation of a trace (the Capability Field's deep-focus evidence link: mint 3 6 1.4 .42): scored solid-dashed, weak thinner, sweep dotted. Kept in every state, so scored and unscored stay distinct even on one document. */
const TRACE_STROKE: Record<SyntxTrace["kind"], { width: number; dash: string; color: string; lit: string }> = {
  supports: { width: 1.4, dash: SYNTX_EVIDENCE_LINK.dash, color: SYNTX_EVIDENCE_LINK.stroke, lit: "rgba(126, 255, 204, 0.95)" },
  weakly_supports: { width: 1, dash: SYNTX_EVIDENCE_LINK.dash, color: "rgba(126, 255, 204, 0.26)", lit: "rgba(126, 255, 204, 0.72)" },
  covers_unscored: { width: 1.2, dash: "1 5", color: "rgba(142, 239, 255, 0.4)", lit: "rgba(142, 239, 255, 0.9)" }
};
/** Photon pacing of the planetarium's energy rays (SemanticCareerIntelligenceField stages 01–06), by index. */
const PHOTON_OUT = ["3.6s", "4.2s", "4.8s", "3.9s", "4.5s", "5.1s"] as const;
const PHOTON_IN = ["4.4s", "5.0s", "5.6s", "4.7s", "5.3s", "6.0s"] as const;

type Point = { x: number; y: number };
/** The free field area of the deeper levels: below the orientation line and the strip, above the field-edge semantic line. */
const LEVEL_INSET = Object.freeze({ top: 104, bottom: 96 });
const levelBox: React.CSSProperties = { position: "absolute", left: 0, right: 0, top: `${LEVEL_INSET.top}px`, bottom: `${LEVEL_INSET.bottom}px` };
interface LayerProps {
  field: SyntxFieldModel;
  mode: SyntxMotionMode;
  t: SyntxCopy;
  locale: SilLocale;
  size: { width: number; height: number };
  onObserve(next: SyntxObservation): void;
}

/** One evidence trace: hit path (pointer), the relation, its ray, its glow, the photon streams of the planetarium (LIVE) and the midpoint bead. */
function TraceSign({ trace, requirementName, d, ray, bead, index, mode, t, onInspect }: { trace: SyntxTrace; requirementName: string; d: string; ray: string; bead: Point; index: number; mode: SyntxMotionMode; t: SyntxCopy; onInspect(): void }) {
  const stroke = TRACE_STROKE[trace.kind];
  const inspectable = trace.sign.state === "inspectable";
  return (
    <g
      data-testid={`syntx-trace-${trace.sign.id}`}
      data-trace-bow={trace.bow}
      data-trace-kind={trace.kind}
      {...signAttributes(trace.sign)}
      role="button"
      tabIndex={receded(trace.sign) ? -1 : 0}
      aria-label={`${t.relation[trace.kind]} · ${requirementName}`}
      onClick={stop(onInspect)}
      onKeyDown={keyActivate(onInspect)}
      style={{ cursor: "pointer", opacity: recedeOpacity(trace.sign, 0.16) }}
    >
      <path data-sx-hit d={d} fill="none" stroke="transparent" strokeWidth={12} style={{ pointerEvents: "stroke" }} />
      <path d={d} fill="none" stroke={inspectable ? stroke.lit : stroke.color} strokeWidth={inspectable ? stroke.width + 0.4 : stroke.width} strokeDasharray={stroke.dash} strokeLinecap="round" style={{ pointerEvents: "none", transition: "stroke .35s ease" }} />
      <path data-sx-trace-ray d={ray} pathLength={1} fill="none" stroke={trace.kind === "covers_unscored" ? "rgba(142, 239, 255, 0.2)" : "rgba(142, 239, 255, 0.32)"} strokeWidth={0.8} strokeDasharray="1 1" strokeLinecap="round" style={{ pointerEvents: "none" }} />
      <path data-sx-trace-glow d={d} fill="none" stroke="rgba(56, 229, 255, 0.08)" strokeWidth={6} strokeLinecap="round" style={{ pointerEvents: "none" }} />
      {mode === "LIVE" && (
        <>
          <circle data-sx-photon="out" r={inspectable ? 2.6 : 1.8} fill={inspectable ? "#ffffff" : CYAN} opacity={inspectable ? 1 : 0.65} style={{ pointerEvents: "none" }}>
            <animateMotion path={ray} dur={inspectable ? "1.6s" : PHOTON_OUT[index % 6]} repeatCount="indefinite" />
          </circle>
          <circle data-sx-photon="in" r={inspectable ? 2.6 : 1.8} fill={inspectable ? CYAN : "#8eefff"} opacity={inspectable ? 0.95 : 0.6} style={{ pointerEvents: "none" }}>
            <animateMotion path={d} dur={inspectable ? "2.1s" : PHOTON_IN[index % 6]} repeatCount="indefinite" />
          </circle>
        </>
      )}
      <circle data-sx-trace-bead cx={bead.x} cy={bead.y} r={inspectable ? 2.6 : 1.8} fill={inspectable ? CYAN : "rgba(56, 229, 255, 0.6)"} style={{ pointerEvents: "none" }} />
    </g>
  );
}

/* ================================================================================================================
 * JOB POOL · the planetarium (Capability Field L0)
 * ================================================================================================================ */

function RoleMoon({ role, style }: { role: SyntxRole; style: React.CSSProperties }) {
  return (
    <div
      data-testid={`syntx-role-${role.id}`}
      data-requirement-count={role.requirementCount}
      data-matching-read={role.matching === null ? "false" : "true"}
      data-manifestation-form="moon"
      {...signAttributes(role.sign)}
      tabIndex={-1}
      aria-label={`${role.title} · ${role.organizationName}`}
      style={style}
    >
      <svg aria-hidden="true" width={9} height={9} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}><circle cx={4.5} cy={4.5} r={4.5} fill="none" /></svg>
      <span style={visuallyHidden}>{role.title}</span>
    </div>
  );
}

function PlanetariumLayer({ field, mode, t, locale, size, onObserve }: LayerProps) {
  const { size: box, center, radius } = SYNTX_LAYOUT;
  const tm = t.manifest;
  const observation = field.observation;
  const anchored = field.depth >= 1;
  const observedId = anchored ? observation.organizationId : null;
  const [hovered, setHovered] = useState<string | null>(null);
  const leave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hoveredHere = anchored ? null : hovered;
  const focusedId = hoveredHere ?? observedId;
  // The planetarium keeps its 800-unit box, fitted to the stage (the Capability Field's L0 at its own scale).
  const fit = Math.round(Math.max(0.42, Math.min(1.04, (Math.min(size.width, size.height - LEVEL_INSET.top - LEVEL_INSET.bottom + 60) - 12) / 860)) * 1000) / 1000;
  const rolesOf = useMemo(() => new Map(field.organizations.map(organization => [organization.id, field.roles.filter(role => role.organizationId === organization.id)])), [field.organizations, field.roles]);
  const hud = SIL_COPY[locale].hud;
  return (
    <div data-sx-level="planetarium" data-sx-depth={anchored ? "far" : "near"} style={{ position: "absolute", left: "50%", top: "50%", width: `${box}px`, height: `${box}px`, transform: `translate(-50%, -50%) scale(${fit})`, zIndex: 5 }}>
      {/* The pool: the total field — its orbits, its rays and its core organism (its emblem names the pool and the organizations it contains). */}
      <div data-testid="syntx-pool" {...signAttributes(field.pool.sign)} aria-label={`${tm.pool} · ${field.pool.poolName}`} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
      <svg data-testid="syntx-orbits" width={box} height={box} style={{ position: "absolute", top: 0, left: 0, pointerEvents: "none", zIndex: 1, opacity: anchored ? 0.18 : 1, filter: anchored ? "blur(2px)" : undefined, transition: "opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1), filter 0.72s cubic-bezier(0.16, 1, 0.3, 1)" }}>
        <SyntxPlanetariumBackdrop center={center} radius={radius} gradientId="syntxFieldGlow" glowOpacity={focusedId ? "0.32" : "0.22"} />
        {field.organizations.map((organization, index) => {
          const active = focusedId === organization.id;
          return (
            <SyntxEnergyRay
              key={`ray-${organization.id}`}
              testId={`syntx-ray-${organization.id}`}
              x1={center}
              y1={center}
              x2={organization.x}
              y2={organization.y}
              stroke={active ? CYAN : "rgba(56, 229, 255, 0.28)"}
              strokeWidth={active ? "2.5" : "1.2"}
              dash={active ? undefined : "3 3"}
              photons={mode === "LIVE" ? {
                out: { r: active ? "3" : "1.8", fill: active ? "#ffffff" : CYAN, opacity: active ? 1 : 0.65, dur: active ? "1.6s" : PHOTON_OUT[index % 6] },
                in: { r: active ? "3" : "1.8", fill: active ? "#38e5ff" : "#8eefff", opacity: active ? 0.95 : 0.6, dur: active ? "2.1s" : PHOTON_IN[index % 6] }
              } : null}
              bead={{ r: active ? "4" : "2", fill: active ? CYAN : "rgba(56, 229, 255, 0.6)" }}
            />
          );
        })}
      </svg>

      <div
        data-sx-pool-core
        style={{ position: "absolute", left: "50%", top: "50%", zIndex: 10, pointerEvents: "none", opacity: anchored ? 0.12 : hoveredHere ? 0.35 : 1, transform: `translate(-50%, -50%) scale(${anchored ? 0.62 : hoveredHere ? 0.85 : 1})`, filter: anchored ? "blur(3px) grayscale(92%)" : hoveredHere ? "grayscale(80%)" : undefined, transition: "all 0.5s ease" }}
      >
        <SyntxCoreOrganism keyframes={false} testId="syntx-pool-core" highlighted={hoveredHere !== null} communicating={hoveredHere !== null} outerRingLit={false}>
          <div style={{ textAlign: "center", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "176px" }}>
            <div style={{ width: "92px", height: "92px", borderRadius: "50%", border: `2px solid ${CYAN}`, boxShadow: `0 0 20px ${CYAN}`, marginBottom: "8px", backgroundColor: "#000", display: "flex", alignItems: "center", justifyContent: "center", color: CYAN, fontSize: "40px", lineHeight: 1 }} aria-hidden="true">⬡</div>
            <div style={{ fontSize: "10px", color: CYAN, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase" }}>{tm.pool}</div>
            <div style={{ marginTop: "3px", fontSize: "9.5px", color: INK, letterSpacing: "0.6px", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.25 }}>{wrapLines(field.pool.poolName, 18, 2).join(" ")}</div>
            <div style={{ marginTop: "6px", fontSize: "10px", color: INK, padding: "3px 10px", borderRadius: "12px", backgroundColor: "rgba(56, 229, 255, 0.12)", border: `1px solid ${CYAN}`, letterSpacing: "0.5px" }}>⬡ {field.organizations.length} {t.organizations}</div>
          </div>
        </SyntxCoreOrganism>
      </div>
      </div>

      {/* Organizations: resonance bodies on the orbits; their roles are their moons. */}
      <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: hoveredHere !== null ? 60 : 6 }}>
        {field.organizations.map((organization, index) => (
          <OrganizationBody
            key={organization.id}
            organization={organization}
            index={index}
            roles={rolesOf.get(organization.id) ?? []}
            observation={observation}
            depth={field.depth}
            isAnchor={organization.id === observedId}
            hovered={hoveredHere}
            mode={mode}
            t={t}
            hudCopy={hud}
            onHover={id => { if (leave.current) clearTimeout(leave.current); if (id !== null) setHovered(id); else leave.current = setTimeout(() => setHovered(null), 250); }}
            onObserve={onObserve}
          />
        ))}
      </div>
    </div>
  );
}

function OrganizationBody({ organization, index, roles, observation, depth, isAnchor, hovered, t, hudCopy, onHover, onObserve }: { organization: SyntxOrganization; index: number; roles: SyntxRole[]; observation: SyntxObservation; depth: number; isAnchor: boolean; hovered: string | null; mode: SyntxMotionMode; t: SyntxCopy; hudCopy: (typeof SIL_COPY)[SilLocale]["hud"]; onHover(id: string | null): void; onObserve(next: SyntxObservation): void }) {
  const { center } = SYNTX_LAYOUT;
  const anchored = depth >= 1;
  const isBackground = anchored && !isAnchor;
  const isHovered = hovered === organization.id;
  const selected = organization.sign.state === "organization_selected";
  const highlighted = isHovered || isAnchor;
  const subtitle = [organization.industry, organization.region].filter((part): part is string => part !== null).join(" · ");
  const presentation = resolveSilFocusedManifestationPresentation(undefined, organization.angle);
  const select = () => onObserve(observeOrganization(observation, organization.id));
  return (
    <FocusTransitionStageShell
      pulseKeyframes={false}
      stageId={`syntx-${organization.id}`}
      x={Math.round((organization.x - center) * 100) / 100}
      y={Math.round((organization.y - center) * 100) / 100}
      isCosmosAnchor={isAnchor}
      isCosmosBackground={isBackground}
      showFocusPulse={!anchored ? isHovered : isAnchor && depth === 1}
    >
      <div
        data-testid={`syntx-organization-${organization.id}`}
        data-role-count={organization.roleIds.length}
        data-body-scale={organization.bodyScale}
        data-sx-depth={isBackground ? "far" : undefined}
        {...signAttributes(organization.sign)}
        role="button"
        tabIndex={depth <= 1 ? 0 : -1}
        aria-label={organization.name}
        aria-pressed={selected}
        onClick={stop(select)}
        onKeyDown={keyActivate(select)}
        onMouseEnter={() => onHover(anchored ? null : organization.id)}
        onMouseLeave={() => onHover(null)}
        style={{ position: "relative", width: `${PLANETARIUM_BODY.size}px`, height: `${PLANETARIUM_BODY.size}px`, borderRadius: "50%", transform: `scale(${organization.bodyScale})`, cursor: "pointer" }}
      >
        {/* Containment of the organization: the orbit its roles (moons) keep — organization ⊃ role made visible (binding §2.1). */}
        <svg data-sx-containment aria-hidden="true" width={244} height={244} style={{ position: "absolute", left: "-38px", top: "-38px", pointerEvents: "none", overflow: "visible" }}>
          <circle cx={122} cy={122} r={PLANETARIUM_BODY.containment} fill="none" stroke="rgba(56, 229, 255, 0.07)" strokeWidth={1} strokeDasharray="2 9" />
        </svg>
        <SyntxResonanceBody
          keyframes={false}
          physicsTestId={`syntx-body-${organization.id}`}
          bodyTestId={`syntx-body-surface-${organization.id}`}
          attention={false}
          hudOpen={isHovered}
          highlighted={highlighted}
          dimmed={!anchored && hovered !== null && !isHovered}
          className=""
          animationDelay={`${-4 * (index % 6)}s`}
          signature={renderSemioticSignature("03", highlighted)}
          moonCount={isAnchor ? 0 : roles.length}
          renderMoon={(moon, style) => <RoleMoon role={roles[moon]} style={style} />}
          hud={isHovered ? {
            tetherTestId: `syntx-tether-${organization.id}`,
            tetherTarget: presentation.tetherTarget,
            previewTestId: `syntx-hud-${organization.id}`,
            className: `hologram-hud--large hologram-float quietUniverseDust hud-preview--${presentation.placement}`,
            style: { ...hudPlacement(presentation.placement) },
            children: (
              <>
                <div style={hudTitle}><span>{organization.name}</span><span style={{ fontSize: "9px", color: "rgba(56, 229, 255, 0.6)", whiteSpace: "nowrap" }}>{hudCopy.hologram}</span></div>
                <div style={hudMetric}>{roles.length} {t.roles}</div>
                {subtitle.length > 0 && <div style={{ marginBottom: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>{[organization.industry, organization.region].filter((part): part is string => part !== null).map(part => <span key={part} style={pill}>{part}</span>)}</div>}
                {roles.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={hudSection}>{t.roles}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>{roles.slice(0, 4).map(role => <div key={role.id} style={{ fontSize: "11px", color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>• {role.title} · {role.requirementCount} {t.requirements}</div>)}</div>
                  </div>
                )}
                <div style={hudHint}>{t.manifest.focusOrganization}</div>
              </>
            )
          } : null}
        >
          <span style={{ fontSize: "11px", color: highlighted ? CYAN : MUTED, fontWeight: 700, letterSpacing: "1px", position: "relative", zIndex: 1 }}>{String(index + 1).padStart(2, "0")}</span>
          <span style={{ fontSize: "13px", color: INK, fontWeight: 700, marginTop: "4px", lineHeight: 1.2, position: "relative", zIndex: 1, textTransform: "uppercase", letterSpacing: "0.6px" }}>⬡ {organization.name}</span>
          {subtitle.length > 0 && <span style={{ fontSize: "10px", color: MUTED, marginTop: "4px", lineHeight: 1.2, position: "relative", zIndex: 1 }}>{subtitle}</span>}
          <span style={{ fontSize: "9px", color: MUTED, marginTop: "3px", position: "relative", zIndex: 1, letterSpacing: "0.8px" }}>{t.manifest.organization}</span>
          <span style={{ marginTop: "8px", fontSize: "10px", color: highlighted ? CYAN : INK, backgroundColor: highlighted ? "rgba(56, 229, 255, 0.15)" : "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "8px", border: `1px solid ${highlighted ? "rgba(56, 229, 255, 0.4)" : "transparent"}`, position: "relative", zIndex: 1 }}>{organization.roleIds.length} {t.roles}</span>
        </SyntxResonanceBody>
      </div>
    </FocusTransitionStageShell>
  );
}

/** The HUD beside a 168-unit body (the planetarium's placement table). */
function hudPlacement(placement: ReturnType<typeof resolveSilFocusedManifestationPresentation>["placement"]): React.CSSProperties {
  const base = SYNTX_HUD_SURFACE;
  switch (placement) {
    case "top": return { ...base, bottom: "215px", left: "-106px" };
    case "bottom": return { ...base, top: "215px", left: "-106px" };
    case "left": return { ...base, right: "215px", top: "-50px" };
    case "right": return { ...base, left: "215px", top: "-50px" };
    case "top-left": return { ...base, bottom: "175px", right: "175px" };
    case "top-right": return { ...base, bottom: "175px", left: "175px" };
    case "bottom-left": return { ...base, top: "175px", right: "175px" };
    case "bottom-right": return { ...base, top: "175px", left: "175px" };
    default: return { ...base, bottom: "215px", left: "-106px" };
  }
}

/* ================================================================================================================
 * ORGANIZATION · the organization cosmos (Capability Field L1)
 * ================================================================================================================ */

function OrganizationCosmosLayer({ field, mode, t, size, onObserve, organization }: LayerProps & { organization: SyntxOrganization }) {
  const runtimeMs = useOrbitalMotionElapsedMs();
  const elapsedMs = mode === "LIVE" ? runtimeMs : 0;
  const observation = field.observation;
  const roles = useMemo(() => field.roles.filter(role => role.organizationId === organization.id), [field.roles, organization.id]);
  const { layout, compact } = useMemo(() => syntxCosmosLayout(roles.map(role => ({ id: role.id, title: role.title })), size.width, size.height), [roles, size.width, size.height]);
  const byId = useMemo(() => new Map(roles.map(role => [role.id, role])), [roles]);
  const recededLevel = field.depth >= 2;
  const index = field.organizations.indexOf(organization);
  return (
    <div data-sx-level="organization" data-sx-depth={recededLevel ? "far" : "near"} style={{ position: "absolute", inset: 0, zIndex: 22, overflow: "hidden", background: SYNTX_COSMOS_BACKDROP, opacity: recededLevel ? 0.3 : 1, filter: recededLevel ? SYNTX_FOCUS.recededFilter : undefined, pointerEvents: recededLevel ? "none" : "auto", transition: "opacity 0.62s ease, filter 0.62s ease" }}>
    <SyntxCosmosShell
      testId="syntx-cosmos-organization"
      attributes={{ "data-organization-id": organization.id, "data-layout": compact ? "compact" : "full" }}
      style={{ ...levelBox, overflow: "visible" }}
      styleText=""
      layout={layout}
      elapsedMs={elapsedMs}
      ringAttribute="data-syntx-cosmos-ring"
      renderNode={node => {
        const role = byId.get(node.id)!;
        // The observed role is now the centre of its own cosmos: here it remains as the receding anchor (no sign, no pointer).
        const anchor = recededLevel && role.id === observation.roleId;
        const select = () => onObserve(observeRole(observation, role.organizationId, role.id));
        const attributes = anchor ? { "data-sx-anchor": role.id } : { "data-testid": `syntx-role-${role.id}`, "data-requirement-count": String(role.requirementCount), "data-matching-read": role.matching === null ? "false" : "true", "data-manifestation-form": "satellite", ...signAttributes(role.sign) };
        return (
          <button
            type="button"
            {...attributes}
            data-card-orientation="viewport-upright"
            role={anchor ? undefined : "button"}
            tabIndex={anchor || receded(role.sign) ? -1 : 0}
            aria-label={`${role.title} · ${role.organizationName}`}
            aria-pressed={anchor ? undefined : role.sign.state === "role_selected"}
            onClick={stop(select)}
            style={{ position: "absolute", left: 0, top: 0, width: `${node.width}px`, minHeight: `${node.height}px`, transform: "translate(-50%, -50%)", ...SYNTX_COSMOS_NODE_MATERIAL, ...(compact ? { padding: "7px 10px" } : {}), color: INK, cursor: "pointer", fontFamily: MONO, textAlign: "left", overflowWrap: "anywhere", hyphens: "auto", opacity: anchor ? 0.42 : 1 }}
          >
            <span style={{ display: "block", color: CYAN, fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px" }}>{t.manifest.role}{role.seniority !== null ? ` // ${role.seniority.toUpperCase()}` : ""}</span>
            <span style={{ display: "-webkit-box", marginTop: "5px", fontSize: compact ? "10px" : "11px", fontWeight: 700, lineHeight: 1.32, WebkitLineClamp: compact ? 2 : 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{role.title}</span>
            <span style={{ display: "block", marginTop: "7px", color: "rgba(206, 232, 241, 0.72)", fontSize: "8px", lineHeight: 1.45 }}>{role.requirementCount} {t.requirements} // {role.matching === null ? t.manifest.matchingNotRead : t.manifest.matchingRead}</span>
          </button>
        );
      }}
      center={
        <button
          type="button"
          data-testid="syntx-cosmos-centre"
          aria-label={t.manifest.returnToField}
          tabIndex={-1}
          onClick={stop(() => onObserve(returnFrom({ ...observation, kind: "ORGANIZATION", roleId: null, requirementId: null, apertureSignId: null })))}
          style={{ position: "absolute", left: `${layout.centerX}px`, top: `${layout.centerY}px`, transform: "translate(-50%, -50%)", ...SYNTX_COSMOS_CENTER_MATERIAL, color: INK, cursor: "pointer", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", lineHeight: 1.55, padding: "16px 14px", opacity: recededLevel ? 0 : 1 }}
        >
          {String(index + 1).padStart(2, "0")} {organization.name.toUpperCase()}<br />
          <span style={{ color: CYAN, fontSize: "8px" }}>{t.manifest.organizationCosmos} // {roles.length} {t.roles}</span>
        </button>
      }
    />
    </div>
  );
}

/* ================================================================================================================
 * ROLE · the role cosmos (Capability Field L1 at the next depth; relation-state geometry R14)
 * ================================================================================================================ */

function RoleCosmosLayer({ field, mode, t, size, onObserve, role }: LayerProps & { role: SyntxRole }) {
  const runtimeMs = useOrbitalMotionElapsedMs();
  const elapsedMs = mode === "LIVE" ? runtimeMs : 0;
  const observation = field.observation;
  const frame: SyntxEcologyFrame = useMemo(() => syntxEcologyFrame(size.width, size.height), [size.width, size.height]);
  const rotation = roleCosmosRotation(elapsedMs);
  const toScreen = (point: Point) => ecologyToScreen(frame, role, point, rotation);
  const centre = { x: frame.cx, y: frame.cy };
  const deep = field.depth >= 3;
  const observedRequirementId = deep ? observation.requirementId : null;
  const categories = SUPPORT_ORDER.filter(support => field.requirements.some(requirement => requirement.support === support));
  // Cards sit outward of their glyph: the room that counts is the arc at the innermost card distance.
  const innermost = Math.min(...field.requirements.map(requirement => SUPPORT_DISTANCE[requirement.support])) * frame.scale + 60;
  const cardMode = requirementCardMode(field.requirements.length, innermost);
  const points = new Map(field.requirements.map(requirement => [requirement.id, toScreen(requirement)]));
  const sourcePoints = field.sources.map(source => toScreen(source));
  const inspectTrace = (trace: SyntxTrace) => onObserve({ kind: "REQUIREMENT", organizationId: observation.organizationId, roleId: trace.roleId, requirementId: trace.requirementId, apertureSignId: trace.sign.id });
  const inspectOpen = (requirement: SyntxRequirement) => requirement.openBoundary !== null && onObserve({ kind: "REQUIREMENT", organizationId: observation.organizationId, roleId: requirement.roleId, requirementId: requirement.id, apertureSignId: requirement.openBoundary.id });
  const traces = field.requirements.flatMap(requirement => requirement.traces.map(trace => ({ requirement, trace }))).filter(({ trace }) => trace.requirementId !== observedRequirementId).sort((a, b) => traceOrder(a.trace) - traceOrder(b.trace));
  const sourcesHere = field.sources.map((source, index) => ({ source, index })).filter(({ source }) => !deep || receded(source.sign));
  const select = () => onObserve(observeRole(observation, role.organizationId, role.id));
  const pending = field.pendingBoundary;
  return (
    <div data-testid="syntx-ecology" data-role-id={role.id} data-sx-level="role" data-sx-depth={deep ? "far" : "near"} data-card-mode={cardMode} data-rotation={rotation.toFixed(6)} style={{ position: "absolute", inset: 0, zIndex: 24, overflow: "hidden", background: SYNTX_COSMOS_BACKDROP, opacity: deep ? 0.34 : 1, filter: deep ? SYNTX_FOCUS.recededFilter : undefined, pointerEvents: deep ? "none" : "auto", transition: "opacity 0.62s ease, filter 0.62s ease" }}>
      <div aria-hidden="true" style={SYNTX_COSMOS_STARS} />
      <div style={levelBox}>
      <svg width={frame.width} height={frame.height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {/* Orbits of the cosmos: one per support category present (circles — distance is the category, R14), the source orbit in mint. */}
        {categories.map(support => <circle key={support} data-sx-orbit={support} cx={centre.x} cy={centre.y} r={SUPPORT_DISTANCE[support] * frame.scale} fill="none" stroke="rgba(56, 229, 255, 0.18)" strokeWidth={1} strokeDasharray="4 9" />)}
        {field.sources.length > 0 && <circle data-sx-orbit="SOURCE" cx={centre.x} cy={centre.y} r={SOURCE_RING_RADIUS * frame.scale} fill="none" stroke="rgba(126, 255, 204, 0.16)" strokeWidth={1} strokeDasharray="4 9" />}
        {/* Tethers of the cosmos from the centre to every satellite (2 7); to the documents the mint evidence link (3 6). */}
        {field.requirements.map(requirement => { const point = points.get(requirement.id)!; return <line key={`tether-${requirement.id}`} x1={centre.x} y1={centre.y} x2={point.x} y2={point.y} stroke="rgba(56, 229, 255, 0.18)" strokeWidth={1} strokeDasharray="2 7" />; })}
        {field.sources.map((source, index) => <line key={`link-${source.docId}`} x1={centre.x} y1={centre.y} x2={sourcePoints[index].x} y2={sourcePoints[index].y} stroke="rgba(126, 255, 204, 0.3)" strokeWidth={1} strokeDasharray="3 6" />)}
        {pending !== null && !deep && (
          <g
            data-testid={`syntx-pending-${role.id}`}
            {...signAttributes(pending.sign)}
            role="button"
            tabIndex={0}
            aria-label={t.relation.pending_evaluation}
            onClick={stop(() => onObserve(inspectSign(observation, pending.sign.id)))}
            onKeyDown={keyActivate(() => onObserve(inspectSign(observation, pending.sign.id)))}
            style={{ cursor: "pointer" }}
          >
            <circle data-sx-hit cx={centre.x} cy={centre.y} r={PENDING_BOUNDARY_RADIUS * frame.scale} fill="none" stroke="transparent" strokeWidth={14} style={{ pointerEvents: "stroke" }} />
            <circle cx={centre.x} cy={centre.y} r={PENDING_BOUNDARY_RADIUS * frame.scale} fill="none" stroke="rgba(230, 241, 248, 0.32)" strokeWidth={0.9} strokeDasharray="5 7" style={{ pointerEvents: "none", animation: mode === "LIVE" ? "sxSuspend 48s linear infinite" : undefined }} />
          </g>
        )}
        {traces.map(({ requirement, trace }, traceIndex) => {
          const from = points.get(requirement.id)!;
          const to = sourcePoints[trace.sourceDocIndex] ?? from;
          const bow = trace.bow * frame.scale;
          return <TraceSign key={trace.sign.id} trace={trace} requirementName={requirement.name} d={tracePath(from, to, bow)} ray={traceRayPath(from, to, bow)} bead={tracePoint(from, to, bow, 0.5)} index={traceIndex} mode={mode} t={t} onInspect={() => inspectTrace(trace)} />;
        })}
      </svg>

      {/* Source documents: the planetarium's source satellites (kind, glyph, title), carried on the source orbit; the body is the relation's end. */}
      {sourcesHere.map(({ source, index }) => <SourceSatellite key={source.docId} source={source} point={sourcePoints[index]} centre={centre} rotation={rotation} t={t} />)}

      {/* Requirements: satellites on the orbit of their support category, each glyph at its point, its card outward. */}
      {field.requirements.map(requirement => {
        const point = points.get(requirement.id)!;
        const shape = SUPPORT_SHAPE[requirement.support];
        const half = cardMode === "full" ? { w: 76, h: 25 } : cardMode === "compact" ? { w: 58, h: 19 } : { w: 52, h: 8 };
        const card = cardBeside(centre, point, half.w, half.h, 14);
        const left = Math.min(point.x - 14, card.x - half.w);
        const top = Math.min(point.y - 14, card.y - half.h);
        const right = Math.max(point.x + 14, card.x + half.w);
        const bottom = Math.max(point.y + 14, card.y + half.h);
        const outward = ((Math.atan2(point.x - centre.x, -(point.y - centre.y)) * 180) / Math.PI + 360) % 360;
        const observe = () => onObserve(observeRequirement(observation, requirement.id));
        const anchorSign = !deep;
        // The requirement's own box: its anchor (glyph and card) and its open boundary.
        const wrap = { left: Math.min(left, point.x - 14), top: Math.min(top, point.y - 14) };
        const wrapRight = Math.max(right, point.x + 14);
        const wrapBottom = Math.max(bottom, point.y + 14);
        return (
          <div key={requirement.id} {...(anchorSign ? { "data-testid": `syntx-requirement-${requirement.id}`, "data-support": requirement.support, "data-evaluation-state": requirement.evaluationState ?? "", "data-trace-count": String(requirement.traces.length), "data-role-id": requirement.roleId } : { "data-sx-anchor": requirement.id })} style={{ position: "absolute", left: `${wrap.left}px`, top: `${wrap.top}px`, width: `${wrapRight - wrap.left}px`, height: `${wrapBottom - wrap.top}px` }}>
            <div
              {...(anchorSign ? signAttributes(requirement.sign) : {})}
              role={anchorSign ? "button" : undefined}
              tabIndex={anchorSign && !receded(requirement.sign) ? 0 : -1}
              aria-label={`${requirement.name} · ${t.support[requirement.support]}`}
              aria-pressed={anchorSign ? requirement.sign.state === "requirement_selected" : undefined}
              onClick={stop(observe)}
              onKeyDown={keyActivate(observe)}
              style={{ position: "absolute", left: `${left - wrap.left}px`, top: `${top - wrap.top}px`, width: `${right - left}px`, height: `${bottom - top}px`, cursor: "pointer", opacity: anchorSign ? recedeOpacity(requirement.sign) : requirement.id === observedRequirementId ? 0 : 0.6, "--sx-origin": `${centre.x - left}px ${centre.y - top}px` } as React.CSSProperties}
            >
              <svg aria-hidden="true" width={28} height={28} style={{ position: "absolute", left: `${point.x - left - 14}px`, top: `${point.y - top - 14}px`, overflow: "visible", pointerEvents: "none" }}>
                <circle cx={14} cy={14} r={shape.r} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeDasharray={shape.dash} />
                <circle cx={14} cy={14} r={shape.r + 5} fill="none" stroke="rgba(56, 229, 255, 0.22)" strokeWidth={0.8} strokeDasharray="2 3" />
              </svg>
              {cardMode !== "glyph" ? (
                <span style={{ position: "absolute", left: `${card.x - half.w - left}px`, top: `${card.y - half.h - top}px`, width: `${half.w * 2}px`, minHeight: `${half.h * 2}px`, boxSizing: "border-box", ...SYNTX_COSMOS_NODE_MATERIAL, borderRadius: "14px", padding: cardMode === "full" ? "7px 10px" : "5px 8px", fontFamily: MONO, textAlign: "left", color: INK, pointerEvents: "none" }}>
                  <span style={{ display: "block", color: requirement.support === "OPEN" ? NEUTRAL : CYAN, fontSize: "7.5px", fontWeight: 700, letterSpacing: "0.8px" }}>{t.manifest.requirement}</span>
                  <span style={{ display: "-webkit-box", marginTop: "3px", fontSize: cardMode === "full" ? "10.5px" : "9.5px", fontWeight: 700, lineHeight: 1.28, WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>{requirement.name}</span>
                </span>
              ) : (
                <span title={requirement.name} style={{ position: "absolute", left: `${card.x - left}px`, top: `${card.y - top}px`, transform: "translate(-50%, -50%)", maxWidth: "104px", padding: "2px 6px", borderRadius: "8px", border: "1px solid rgba(56, 229, 255, 0.28)", background: "rgba(3, 12, 20, 0.92)", fontFamily: MONO, fontSize: "8px", fontWeight: 700, color: INK_SOFT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pointerEvents: "none" }}>{requirement.name}</span>
              )}
            </div>
            {anchorSign && requirement.openBoundary !== null && (
              <div
                data-testid={`syntx-open-${requirement.id}`}
                {...signAttributes(requirement.openBoundary)}
                role="button"
                tabIndex={receded(requirement.openBoundary) ? -1 : 0}
                aria-label={`${t.relation.missing_support} · ${requirement.name}`}
                onClick={stop(() => inspectOpen(requirement))}
                onKeyDown={keyActivate(() => inspectOpen(requirement))}
                style={{ position: "absolute", left: `${point.x - 14 - wrap.left}px`, top: `${point.y - 14 - wrap.top}px`, width: "28px", height: "28px", cursor: "pointer", zIndex: 2, opacity: recedeOpacity(requirement.openBoundary, 0.2) }}
              >
                <svg aria-hidden="true" width={28} height={28} style={{ overflow: "visible", pointerEvents: "none" }}><path d={openArc(14, 14, shape.r + 5, outward)} fill="none" stroke={NEUTRAL} strokeWidth={1.2} strokeLinecap="round" /></svg>
              </div>
            )}
          </div>
        );
      })}

      {/* The role: centre of its cosmos (the cosmos centre material); a return to the organization cosmos. */}
      <button
        type="button"
        data-testid={`syntx-role-${role.id}`}
        data-requirement-count={role.requirementCount}
        data-matching-read={role.matching === null ? "false" : "true"}
        data-manifestation-form="centre"
        {...signAttributes(role.sign)}
        role="button"
        tabIndex={deep ? -1 : 0}
        aria-label={`${role.title} · ${role.organizationName}`}
        aria-pressed={role.sign.state === "role_selected"}
        onClick={stop(select)}
        style={{ position: "absolute", left: `${centre.x}px`, top: `${centre.y}px`, transform: "translate(-50%, -50%)", ...SYNTX_COSMOS_CENTER_MATERIAL, color: INK, cursor: "pointer", fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", lineHeight: 1.45, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", zIndex: 3 }}
      >
        <svg aria-hidden="true" width={174} height={174} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", overflow: "visible" }}><circle cx={87} cy={87} r={86} fill="none" stroke="transparent" /></svg>
        <span style={{ color: CYAN, fontSize: "8px", letterSpacing: "1px" }}>{t.manifest.role} // {role.requirementCount} {t.requirements}</span>
        <span style={{ fontSize: "11px", textTransform: "uppercase", lineHeight: 1.3 }}>{role.title}</span>
        <span style={{ color: "rgba(56, 229, 255, 0.66)", fontSize: "7.5px", letterSpacing: "0.7px" }}>{t.manifest.returnToOrganization}</span>
      </button>
      </div>
    </div>
  );
}

/** A source document as the planetarium's source satellite (OrbitalCosmosView): the body on the orbit, the card beside it. */
function SourceSatellite({ source, point, centre, rotation, t, inSurface = false }: { source: SyntxSource; point: Point; centre: Point; rotation: number; t: SyntxCopy; inSurface?: boolean }) {
  const card = cardBeside(centre, point, 80, 30, 18);
  const sweepOnly = source.sign.relation === "covers_unscored";
  // The sign's own box is the extent of its body and its card (a positioning origin alone would read as invisible).
  const box = { left: Math.min(point.x - 14, card.x - 80), top: Math.min(point.y - 14, card.y - 30), right: Math.max(point.x + 14, card.x + 80), bottom: Math.max(point.y + 14, card.y + 30) };
  return (
    <div data-testid={`syntx-source-${source.docId}`} data-source-title-state={source.titleState} data-trace-count={source.traceCount} {...signAttributes(source.sign)} aria-label={`${t.source} · ${source.title ?? t.sourceUnresolved}`} style={{ position: "absolute", left: `${box.left}px`, top: `${box.top}px`, width: `${box.right - box.left}px`, height: `${box.bottom - box.top}px`, opacity: recedeOpacity(source.sign, 0.2), pointerEvents: "none" }}>
      <div data-sx-carrier-body data-orbital-motion-driver={inSurface ? undefined : "shared-rAF"} data-orbital-motion-phase={rotation.toFixed(6)} data-orbital-motion-x={point.x.toFixed(3)} data-orbital-motion-y={point.y.toFixed(3)} style={{ position: "absolute", left: 0, top: 0, transform: `translate3d(${point.x - box.left}px, ${point.y - box.top}px, 0)` }}>
        <span aria-hidden="true" style={{ position: "absolute", left: "-14px", top: "-14px", width: "28px", height: "28px", boxSizing: "border-box", borderRadius: "50%", border: `1px ${sweepOnly ? "dashed" : "solid"} rgba(126, 255, 204, ${sweepOnly ? 0.55 : 0.85})`, background: "rgba(3, 14, 20, 0.96)", boxShadow: "0 0 14px rgba(126, 255, 204, 0.18)", color: MINT, fontSize: "11px", display: "flex", alignItems: "center", justifyContent: "center" }}>◈</span>
      </div>
      <span style={{ position: "absolute", left: 0, top: 0, transform: `translate3d(${card.x - box.left}px, ${card.y - box.top}px, 0) translate(-50%, -50%)`, width: "160px", boxSizing: "border-box", ...SYNTX_COSMOS_NODE_MATERIAL, border: "1px solid rgba(126, 255, 204, 0.42)", padding: "8px 11px", fontFamily: MONO, color: INK, textAlign: "left" }}>
        <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px", color: CYAN, fontSize: "7.5px", fontWeight: 800, letterSpacing: "1px", lineHeight: 1 }}><span>{t.source} // {t.manifest.document}</span><span aria-hidden="true" style={{ fontSize: "10px" }}>◈</span></span>
        <span style={{ display: "-webkit-box", marginTop: "7px", fontSize: "10.5px", fontWeight: 800, lineHeight: 1.25, WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere", color: source.title !== null ? INK : MUTED }}>{source.title ?? (source.titleState === "NOT_READ" ? t.sourceNotRead : t.sourceUnresolved)}</span>
        <span style={{ display: "block", marginTop: "6px", color: "rgba(126, 255, 204, 0.62)", fontSize: "7px", fontWeight: 700, letterSpacing: "0.8px", lineHeight: 1 }}>{source.traceCount} {t.manifest.evidenceCount}</span>
      </span>
    </div>
  );
}

/* ================================================================================================================
 * REQUIREMENT · deep focus (Capability Field L2) and the evidence surface
 * ================================================================================================================ */

function RequirementFocusLayer({ field, mode, t, onObserve, requirement, focus, scrollTop, onScroll }: LayerProps & { requirement: SyntxRequirement; focus: SyntxEvidenceRows; scrollTop: number; onScroll(top: number): void }) {
  const observation = field.observation;
  const { layout, surface, groups, rows } = focus;
  const siblings = field.requirements.filter(item => item.id !== requirement.id);
  const rowById = new Map(rows.map(item => [item.id, item]));
  const rowCentre = (id: string) => { const placed = rowById.get(id); return placed === undefined ? surface.top + EVIDENCE_ROW.header : evidenceRowCentre(surface, placed, scrollTop); };
  const inspectTrace = (trace: SyntxTrace) => onObserve(inspectSign(observation, trace.sign.id));
  const inspectOpen = () => requirement.openBoundary !== null && onObserve(inspectSign(observation, requirement.openBoundary.id));
  const ordered = rows.map(placed => requirement.traces.find(trace => trace.sign.id === placed.id)).filter((trace): trace is SyntxTrace => trace !== undefined);
  const shape = SUPPORT_SHAPE[requirement.support];
  const pending = field.pendingBoundary;
  const sourcesByDoc = new Map(field.sources.map(source => [source.docId, source]));
  const focusBottom = layout.focus.y + layout.focus.height / 2;
  return (
    <div data-sx-level="requirement" style={{ position: "absolute", inset: 0, zIndex: 26, overflow: "hidden", background: SYNTX_DEEP_FOCUS_BACKDROP }}>
    <SyntxDeepFocusShell
      testId="syntx-deep-focus"
      attributes={{ "data-requirement-id": requirement.id, "data-reduced-motion-contract": "static deterministic hierarchy" }}
      style={{ ...levelBox, overflow: "visible" }}
      styleText=""
      layout={layout}
      svgExtra={
        <>
          <line x1={layout.focus.x} y1={focusBottom + NUCLEUS_EXTRA_HEIGHT / 2} x2={layout.focus.x} y2={surface.top} stroke={SYNTX_EVIDENCE_LINK.stroke} strokeWidth={SYNTX_EVIDENCE_LINK.width} strokeDasharray={SYNTX_EVIDENCE_LINK.dash} />
          {pending !== null && (
            <g data-testid={`syntx-pending-${pending.roleId}`} {...signAttributes(pending.sign)} role="button" tabIndex={0} aria-label={t.relation.pending_evaluation} onClick={stop(() => onObserve(inspectSign(observation, pending.sign.id)))} onKeyDown={keyActivate(() => onObserve(inspectSign(observation, pending.sign.id)))} style={{ cursor: "pointer" }}>
              <ellipse data-sx-hit cx={layout.focus.x} cy={layout.focus.y} rx={layout.focus.width / 2 + 34} ry={layout.focus.height / 2 + 26} fill="none" stroke="transparent" strokeWidth={14} style={{ pointerEvents: "stroke" }} />
              <ellipse cx={layout.focus.x} cy={layout.focus.y} rx={layout.focus.width / 2 + 34} ry={layout.focus.height / 2 + 26} fill="none" stroke="rgba(230, 241, 248, 0.32)" strokeWidth={0.9} strokeDasharray="5 7" style={{ pointerEvents: "none", animation: mode === "LIVE" ? "sxSuspend 48s linear infinite" : undefined }} />
            </g>
          )}
          {ordered.map((trace, index) => {
            const side: -1 | 1 = index % 2 === 0 ? -1 : 1;
            const relation = evidenceRelationPath(layout, surface, rowCentre(trace.sign.id), side, Math.floor(index / 2));
            const ray = `M ${relation.to.x} ${relation.to.y} Q ${relation.control.x} ${relation.control.y} ${relation.from.x} ${relation.from.y}`;
            const bead = { x: 0.25 * relation.from.x + 0.5 * relation.control.x + 0.25 * relation.to.x, y: 0.25 * relation.from.y + 0.5 * relation.control.y + 0.25 * relation.to.y };
            return <TraceSign key={trace.sign.id} trace={trace} requirementName={requirement.name} d={relation.d} ray={ray} bead={bead} index={index} mode={mode} t={t} onInspect={() => inspectTrace(trace)} />;
          })}
        </>
      }
    >
      {siblings.map(sibling => {
        const satellite = layout.satellites.find(item => item.id === sibling.id);
        if (satellite === undefined) return null;
        const siblingShape = SUPPORT_SHAPE[sibling.support];
        const observe = () => onObserve(observeRequirement(observation, sibling.id));
        return (
          <div key={sibling.id} data-testid={`syntx-requirement-${sibling.id}`} data-support={sibling.support} data-evaluation-state={sibling.evaluationState ?? ""} data-trace-count={sibling.traces.length} data-role-id={sibling.roleId} style={{ position: "absolute", left: `${satellite.x - (satellite.width * satellite.scale) / 2 - 6}px`, top: `${satellite.y - (satellite.height * satellite.scale) / 2 - 6}px`, width: `${satellite.width * satellite.scale + 12}px`, height: `${satellite.height * satellite.scale + 12}px` }}>
            <button
              type="button"
              {...signAttributes(sibling.sign)}
              role="button"
              tabIndex={-1}
              aria-label={`${sibling.name} · ${t.support[sibling.support]}`}
              aria-pressed={false}
              onClick={stop(observe)}
              style={{ position: "absolute", left: `${(satellite.width * satellite.scale) / 2 + 6}px`, top: `${(satellite.height * satellite.scale) / 2 + 6}px`, width: `${satellite.width}px`, minHeight: `${satellite.height}px`, transform: "translate(-50%, -50%) scale(var(--satellite-scale))", "--satellite-scale": satellite.scale, "--satellite-opacity": satellite.opacity, opacity: satellite.opacity, animation: "sxSatelliteSettle 0.72s cubic-bezier(0.16, 1, 0.3, 1) both", ...SYNTX_SATELLITE_MATERIAL, fontFamily: MONO, fontSize: "9px", fontWeight: 700, textAlign: "left", cursor: "pointer", overflowWrap: "anywhere", hyphens: "auto", display: "flex", gap: "8px", alignItems: "flex-start" } as React.CSSProperties}
            >
              <svg aria-hidden="true" width={16} height={16} style={{ flexShrink: 0, overflow: "visible" }}><circle cx={8} cy={8} r={siblingShape.r * 0.8} fill={siblingShape.fill} stroke={siblingShape.stroke} strokeWidth={siblingShape.strokeWidth} strokeDasharray={siblingShape.dash} /></svg>
              <span>{sibling.name}</span>
            </button>
            {sibling.openBoundary !== null && (
              <div data-testid={`syntx-open-${sibling.id}`} {...signAttributes(sibling.openBoundary)} role="button" tabIndex={-1} aria-label={`${t.relation.missing_support} · ${sibling.name}`} onClick={stop(() => onObserve({ ...observation, requirementId: sibling.id, apertureSignId: sibling.openBoundary!.id }))} style={{ position: "absolute", left: "2px", top: "2px", width: "16px", height: "16px", opacity: satellite.opacity, cursor: "pointer" }}>
                <svg aria-hidden="true" width={16} height={16} style={{ overflow: "visible" }}><path d={openArc(8, 8, 6, 315)} fill="none" stroke={NEUTRAL} strokeWidth={1} strokeLinecap="round" /></svg>
              </div>
            )}
          </div>
        );
      })}

      <div data-testid={`syntx-requirement-${requirement.id}`} data-support={requirement.support} data-evaluation-state={requirement.evaluationState ?? ""} data-trace-count={requirement.traces.length} data-role-id={requirement.roleId} style={{ position: "absolute", left: `${layout.focus.x - layout.focus.width / 2}px`, top: `${layout.focus.y - (layout.focus.height + NUCLEUS_EXTRA_HEIGHT) / 2}px`, width: `${layout.focus.width}px`, height: `${layout.focus.height + NUCLEUS_EXTRA_HEIGHT}px` }}>
        <button
          type="button"
          {...signAttributes(requirement.sign)}
          role="button"
          tabIndex={0}
          aria-label={`${requirement.name} · ${t.support[requirement.support]}`}
          aria-pressed={true}
          onClick={stop(() => onObserve(observeRequirement(observation, requirement.id)))}
          style={{ position: "absolute", left: "50%", top: "50%", width: `${layout.focus.width}px`, minHeight: `${layout.focus.height + NUCLEUS_EXTRA_HEIGHT}px`, transform: "translate(-50%, -50%)", animation: "sxNucleusSettle 0.78s cubic-bezier(0.16, 1, 0.3, 1) both", ...SYNTX_NUCLEUS_MATERIAL, color: INK, cursor: "pointer", fontFamily: MONO, textAlign: "center", overflowWrap: "anywhere", hyphens: "auto" }}
        >
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", color: CYAN, fontSize: "9px", fontWeight: 800, letterSpacing: "1.1px" }}><svg aria-hidden="true" width={16} height={16} style={{ overflow: "visible", flexShrink: 0 }}><circle cx={8} cy={8} r={shape.r * 0.85} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeDasharray={shape.dash} /></svg>{t.manifest.nucleus} // {t.support[requirement.support]}</span>
          <span style={{ display: "block", marginTop: "8px", fontSize: "14px", fontWeight: 800, lineHeight: 1.34 }}>{requirement.name}</span>
          {requirement.evaluationState === "NOT_EVALUATED" && <span style={{ display: "block", marginTop: "10px", color: "rgba(206, 232, 241, 0.86)", fontSize: "8px", fontWeight: 700, lineHeight: 1.6, textTransform: "uppercase" }}>{t.relation.pending_evaluation}</span>}
          <span style={{ display: "block", marginTop: "10px", color: "rgba(56, 229, 255, 0.66)", fontSize: "8px", letterSpacing: "0.7px" }}>{t.manifest.returnToRole}</span>
        </button>
      </div>

      {/* The evidence surface beneath the nucleus: one row per evidence relation, grouped by its source document. */}
      <section
        data-testid="syntx-evidence-surface"
        data-sx-surface="evidence"
        onScroll={event => onScroll(event.currentTarget.scrollTop)}
        onClick={event => event.stopPropagation()}
        style={{ position: "absolute", left: `${surface.left}px`, top: `${surface.top}px`, width: `${surface.width}px`, height: `${surface.height}px`, boxSizing: "border-box", overflowY: surface.scroll ? "auto" : "hidden", ...SYNTX_EVIDENCE_SURFACE_MATERIAL, padding: 0, color: INK, fontFamily: MONO, zIndex: 2 }}
      >
        <div style={{ position: "relative", height: `${EVIDENCE_ROW.header + groups.length * EVIDENCE_ROW.group + rows.length * EVIDENCE_ROW.entry + (requirement.openBoundary !== null ? EVIDENCE_ROW.entry : 0) + EVIDENCE_ROW.padding}px` }}>
          <div style={{ position: "absolute", left: "15px", right: "15px", top: "11px", color: MINT, fontSize: "8px", fontWeight: 800, letterSpacing: "0.9px" }}>{t.manifest.evidence} // {requirement.traces.length} {t.manifest.relations}</div>
          {groups.map(group => {
            const source = sourcesByDoc.get(group.docId);
            if (source === undefined) return null;
            return (
              <div key={group.docId} data-testid={`syntx-source-${source.docId}`} data-source-title-state={source.titleState} data-trace-count={source.traceCount} {...signAttributes(source.sign)} aria-label={`${t.source} · ${source.title ?? t.sourceUnresolved}`} style={{ position: "absolute", left: "15px", right: "15px", top: `${group.top}px`, height: `${EVIDENCE_ROW.group}px`, display: "flex", alignItems: "center", gap: "8px", fontSize: "9px", borderTop: "1px solid rgba(126, 255, 204, 0.14)" }}>
                <span data-sx-carrier-body aria-hidden="true" style={{ color: MINT }}>◈</span>
                <strong style={{ color: "rgba(225, 245, 247, 0.94)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source.title ?? (source.titleState === "NOT_READ" ? t.sourceNotRead : t.sourceUnresolved)}</strong>
                <span style={{ color: "rgba(126, 255, 204, 0.72)", whiteSpace: "nowrap" }}>// {t.manifest.document}</span>
              </div>
            );
          })}
          {ordered.map(trace => {
            const placed = rowById.get(trace.sign.id)!;
            const unscored = trace.kind === "covers_unscored";
            return (
              <div key={trace.sign.id} data-sx-evidence-row={trace.sign.id} data-trace-kind={trace.kind} aria-hidden="true" onClick={stop(() => inspectTrace(trace))} style={{ position: "absolute", left: "15px", right: "15px", top: `${placed.top}px`, height: `${EVIDENCE_ROW.entry}px`, boxSizing: "border-box", padding: "5px 0 5px 10px", borderLeft: `${trace.kind === "weakly_supports" ? 1 : 2}px ${unscored ? "dashed" : "solid"} ${unscored ? "rgba(142, 239, 255, 0.6)" : trace.kind === "supports" ? "rgba(126, 255, 204, 0.85)" : "rgba(126, 255, 204, 0.5)"}`, cursor: "pointer", background: trace.sign.id === observation.apertureSignId ? "rgba(56, 229, 255, 0.08)" : undefined }}>
                <div style={{ fontSize: "8px", fontWeight: 800, letterSpacing: "0.8px", color: unscored ? "rgba(142, 239, 255, 0.85)" : MINT, textTransform: "uppercase" }}>{t.relation[trace.kind]} · {unscored ? t.manifest.unscored : t.manifest.scored}</div>
                <div style={{ marginTop: "4px", fontSize: "9px", color: "rgba(206, 232, 241, 0.74)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{trace.quote}”</div>
              </div>
            );
          })}
          {requirement.openBoundary !== null && (
            <div data-testid={`syntx-open-${requirement.id}`} {...signAttributes(requirement.openBoundary)} role="button" tabIndex={0} aria-label={`${t.relation.missing_support} · ${requirement.name}`} onClick={stop(inspectOpen)} onKeyDown={keyActivate(inspectOpen)} style={{ position: "absolute", left: "15px", right: "15px", top: `${EVIDENCE_ROW.header + groups.length * EVIDENCE_ROW.group + rows.length * EVIDENCE_ROW.entry}px`, height: `${EVIDENCE_ROW.entry}px`, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: NEUTRAL, fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.8px" }}>
              <svg aria-hidden="true" width={18} height={18} style={{ overflow: "visible", flexShrink: 0 }}><path d={openArc(9, 9, 7, 0)} fill="none" stroke={NEUTRAL} strokeWidth={1.2} strokeLinecap="round" /></svg>
              <span>{t.support.OPEN}</span>
            </div>
          )}
        </div>
      </section>
    </SyntxDeepFocusShell>
    </div>
  );
}

/** The nucleus carries one line more than the Capability nucleus (the pending evaluation): its height beyond the layout estimate. */
const NUCLEUS_EXTRA_HEIGHT = 30;

/** Centre of an evidence row on screen: its place in the surface less the surface's scroll, kept inside the visible surface. */
function evidenceRowCentre(surface: SyntxEvidenceRows["surface"], placed: { top: number; height: number }, scrollTop: number): number {
  const y = surface.top + placed.top + placed.height / 2 - scrollTop;
  return Math.min(Math.max(y, surface.top + EVIDENCE_ROW.header), surface.top + surface.height - 10);
}

/** The deep-focus geometry of the observed requirement: its evidence rows grouped by document in delivered order. */
function requirementFocus(field: SyntxFieldModel, requirement: SyntxRequirement, size: { width: number; height: number }): SyntxEvidenceRows {
  const groups: Array<{ docId: string; entries: string[] }> = [];
  for (const trace of requirement.traces) {
    const group = groups.find(item => item.docId === trace.docId);
    if (group === undefined) groups.push({ docId: trace.docId, entries: [trace.sign.id] });
    else group.entries.push(trace.sign.id);
  }
  return syntxRequirementFocus(field.requirements.map(item => ({ id: item.id, title: item.name })), requirement.id, groups, requirement.openBoundary !== null ? 1 : 0, size.width, size.height, NUCLEUS_EXTRA_HEIGHT);
}

/* ================================================================================================================
 * The stage: every level of the field in one coordinate space; the background returns one level (spec §13.3)
 * ================================================================================================================ */

interface ApertureAnchor { x: number; y: number; side: "left" | "right" }

function FieldStage({ field, mode, t, locale, onObserve, size }: LayerProps) {
  const observation = field.observation;
  const organization = observation.organizationId === null ? null : field.organizations.find(item => item.id === observation.organizationId) ?? null;
  const role = observation.roleId === null ? null : field.roles.find(item => item.id === observation.roleId) ?? null;
  const requirement = field.depth === 3 ? field.requirements.find(item => item.id === observation.requirementId) ?? null : null;
  const inner = useMemo(() => ({ width: size.width, height: Math.max(300, size.height - LEVEL_INSET.top - LEVEL_INSET.bottom) }), [size.width, size.height]);
  const focus = useMemo(() => (requirement === null ? null : requirementFocus(field, requirement, inner)), [field, requirement, inner]);
  const [scrollTop, setScrollTop] = useState(0);
  useEffect(() => setScrollTop(0), [requirement?.id]);
  const inLevel = apertureAnchor(field, inner, focus, scrollTop);
  const anchor = { ...inLevel, y: inLevel.y + LEVEL_INSET.top };
  const props = { field, mode, t, locale, size, onObserve };
  const deeper = { ...props, size: inner };
  return (
    <>
      <div data-testid="syntx-canvas" data-depth={field.depth} data-camera-scale={field.camera.scale} data-motion-mode={mode} onClick={() => onObserve(returnFrom(observation))} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <PlanetariumLayer {...props} />
        {organization !== null && field.depth >= 1 && <OrganizationCosmosLayer {...deeper} organization={organization} />}
        {role !== null && field.depth >= 2 && <RoleCosmosLayer {...deeper} role={role} />}
        {requirement !== null && focus !== null && <RequirementFocusLayer {...deeper} requirement={requirement} focus={focus} scrollTop={scrollTop} onScroll={setScrollTop} />}
      </div>
      {field.aperture !== null && <Aperture aperture={field.aperture} field={field} t={t} anchor={anchor} onClose={() => onObserve(returnFrom(observation))} />}
    </>
  );
}

/** Where the inspection aperture attaches: the evidence row of the inspected relation, or the suspended boundary of the role. */
function apertureAnchor(field: SyntxFieldModel, size: { width: number; height: number }, focus: SyntxEvidenceRows | null, scrollTop: number): ApertureAnchor {
  const aperture = field.aperture;
  const roomRight = (x: number) => size.width - x - 64 - APERTURE_WIDTH - SYNTX_MARGIN >= 0;
  if (aperture !== null && focus !== null) {
    const { surface, rows, layout } = focus;
    const inspected = aperture.inspects;
    const placed = inspected.kind === "trace" ? rows.find(item => item.id === inspected.trace.sign.id) : undefined;
    const y = placed !== undefined ? evidenceRowCentre(surface, placed, scrollTop) : inspected.kind === "open" ? surface.top + surface.height - EVIDENCE_ROW.entry / 2 : layout.focus.y;
    const rightEdge = inspected.kind === "pending" ? layout.focus.x + layout.focus.width / 2 : surface.left + surface.width;
    const leftEdge = inspected.kind === "pending" ? layout.focus.x - layout.focus.width / 2 : surface.left;
    return roomRight(rightEdge) ? { x: rightEdge, y, side: "right" } : { x: leftEdge, y, side: "left" };
  }
  const frame = syntxEcologyFrame(size.width, size.height);
  const radius = PENDING_BOUNDARY_RADIUS * frame.scale;
  const x = frame.cx + radius * Math.cos(-Math.PI / 4);
  const y = frame.cy + radius * Math.sin(-Math.PI / 4);
  return roomRight(x) ? { x, y, side: "right" } : { x: frame.cx - radius * Math.cos(-Math.PI / 4), y, side: "left" };
}

/* ================================================================================================================
 * EVIDENCE · the inspection aperture as the planetarium's hologram HUD on its tether (a reading surface: it holds still)
 * ================================================================================================================ */

/** The aperture: a calm hologram surface (rounded HUD, fine mint / cyan frame, atmospheric interior) in semantic layers. */
const APERTURE_WIDTH = 400;
const APERTURE_SURFACE: React.CSSProperties = {
  position: "absolute",
  width: `${APERTURE_WIDTH}px`,
  boxSizing: "border-box",
  borderRadius: "14px",
  border: "1px solid rgba(126, 255, 204, 0.5)",
  background: "radial-gradient(120% 80% at 0% 0%, rgba(126, 255, 204, 0.1), transparent 55%), radial-gradient(90% 70% at 100% 0%, rgba(56, 229, 255, 0.1), transparent 60%), radial-gradient(80% 60% at 50% 115%, rgba(107, 142, 255, 0.08), transparent 70%), linear-gradient(160deg, #0a1d29 0%, #061420 45%, #030a12 100%)",
  boxShadow: "0 18px 48px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(56, 229, 255, 0.1), 0 0 28px rgba(56, 229, 255, 0.18), inset 0 0 40px rgba(56, 229, 255, 0.05)",
  color: INK,
  fontFamily: MONO,
  textAlign: "left",
  WebkitFontSmoothing: "antialiased",
  isolation: "isolate"
};
const apertureKicker: React.CSSProperties = { fontFamily: MONO, fontSize: "8.5px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(126, 255, 204, 0.72)" };
const apertureLabel: React.CSSProperties = { fontFamily: MONO, fontSize: "8.5px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(206, 232, 241, 0.55)" };
const apertureChip = (tone: string, dashed = false): React.CSSProperties => ({ display: "inline-flex", alignItems: "baseline", gap: "6px", padding: "4px 9px", borderRadius: "999px", border: `1px ${dashed ? "dashed" : "solid"} ${tone}`, background: "rgba(3, 14, 22, 0.7)", fontFamily: MONO, fontSize: "10.5px", color: INK, whiteSpace: "nowrap" });
/** The relation of the inspected sign as its own line: the stroke it is drawn with, the relation, scored or unscored. */
function ApertureRelation({ kind, label: text, tone }: { kind: SyntxTrace["kind"] | "missing_support" | "pending_evaluation"; label: string; tone: string }) {
  const stroke = kind === "supports" || kind === "weakly_supports" || kind === "covers_unscored" ? TRACE_STROKE[kind] : null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      <svg aria-hidden="true" width={34} height={10} style={{ flexShrink: 0, overflow: "visible" }}>
        {stroke !== null
          ? <line x1={1} y1={5} x2={33} y2={5} stroke={stroke.lit} strokeWidth={stroke.width + 0.6} strokeDasharray={stroke.dash} strokeLinecap="round" />
          : <path d={kind === "missing_support" ? openArc(17, 5, 4.5, 90) : "M 1 5 L 33 5"} fill="none" stroke={NEUTRAL} strokeWidth={1.2} strokeDasharray={kind === "pending_evaluation" ? "5 4" : undefined} strokeLinecap="round" />}
      </svg>
      <span style={{ fontFamily: MONO, fontSize: "10.5px", fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase", color: tone }}>{text}</span>
    </div>
  );
}

function Aperture({ aperture, field, t, anchor, onClose }: { aperture: SyntxAperture; field: SyntxFieldModel; t: SyntxCopy; anchor: ApertureAnchor; onClose(): void }) {
  const observedRole = field.roles.find(role => role.id === field.observation.roleId) ?? null;
  const content = aperture.inspects;
  const hudLeft = anchor.side === "right" ? anchor.x + 64 : anchor.x - 64 - APERTURE_WIDTH;
  const left = Math.max(SYNTX_MARGIN, hudLeft);
  const authorityParts = t.authority.split(" · ");
  const unscored = content.kind === "trace" && content.trace.kind === "covers_unscored";
  const relationTone = content.kind !== "trace" ? NEUTRAL : unscored ? "rgba(142, 239, 255, 0.95)" : MINT;
  return (
    <>
      <svg data-sx-aperture-tether aria-hidden="true" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 39, overflow: "visible" }}>
        <line x1={anchor.x} y1={anchor.y} x2={anchor.side === "right" ? left : left + APERTURE_WIDTH} y2={anchor.y} stroke={CYAN} strokeWidth={1.5} strokeDasharray="4 3" opacity={0.85} />
        <circle cx={anchor.x} cy={anchor.y} r={3} fill={CYAN} />
      </svg>
      <aside
        data-testid="syntx-aperture"
        data-aperture-for={aperture.sign.id.replace(/^aperture:/, "")}
        data-aperture-kind={content.kind}
        data-source-title-state={content.kind === "trace" ? content.trace.sourceTitleState : ""}
        {...signAttributes(aperture.sign)}
        data-sx-reveal="true"
        role="dialog"
        aria-label={t.inspect}
        onClick={event => event.stopPropagation()}
        style={{ ...APERTURE_SURFACE, left: `${left}px`, top: `${anchor.y}px`, transform: "translateY(-50%)", maxHeight: "74%", overflowY: "auto", zIndex: 40 }}
      >
        {/* The surface breathes: its glow alone rises and falls (no movement — the reading surface holds still). */}
        <span data-sx-aperture-glow aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "14px", pointerEvents: "none", boxShadow: "0 0 34px rgba(126, 255, 204, 0.16), inset 0 0 0 1px rgba(126, 255, 204, 0.18)", animation: "sxApertureBreathe 7s ease-in-out infinite", zIndex: -1 }} />

        {/* Head: what is inspected — the requirement (or the role) it belongs to. */}
        <header style={{ padding: "15px 20px 13px", borderBottom: "1px solid rgba(126, 255, 204, 0.16)", background: "linear-gradient(180deg, rgba(126, 255, 204, 0.06), transparent)", borderRadius: "14px 14px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <span style={apertureKicker}>{content.kind === "pending" ? t.manifest.role : t.manifest.requirement}{content.kind === "trace" ? ` · ${t.manifest.evidence}` : ""}</span>
            <button data-testid="syntx-aperture-close" onClick={onClose} style={{ ...action("muted"), fontSize: "8.5px", padding: "2px 0" }}>{t.close}</button>
          </div>
          <div style={{ marginTop: "8px", fontFamily: MONO, fontSize: "15px", fontWeight: 800, letterSpacing: "0.6px", lineHeight: 1.3, textTransform: "uppercase", color: "#e9fbff", textShadow: `0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong}` }}>{aperture.requirement !== null ? aperture.requirement.name : observedRole?.title ?? ""}</div>
        </header>

        <div style={{ padding: "14px 20px 16px", ...stack(13) }}>
          {content.kind === "trace" && (
            <>
              <ApertureRelation kind={content.trace.kind} label={`${t.relation[content.trace.kind]} · ${unscored ? t.manifest.unscored : t.manifest.scored}`} tone={relationTone} />
              <span data-testid="syntx-aperture-source" data-source-title-state={content.trace.sourceTitleState} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span aria-hidden="true" style={{ width: "22px", height: "22px", borderRadius: "50%", border: `1px ${unscored ? "dashed" : "solid"} rgba(126, 255, 204, 0.75)`, display: "inline-flex", alignItems: "center", justifyContent: "center", color: MINT, fontSize: "10px", boxShadow: "0 0 10px rgba(126, 255, 204, 0.2)", flexShrink: 0 }}>◈</span>
                <span style={apertureLabel}>{t.source}:</span>
                <span style={{ fontFamily: SANS, fontSize: "13px", fontWeight: 600, color: INK }}>{content.trace.sourceTitle ?? (content.trace.sourceTitleState === "NOT_READ" ? t.sourceNotRead : t.sourceUnresolved)}</span>
                {content.trace.location !== null && <span style={{ ...apertureChip("rgba(126, 255, 204, 0.35)"), fontSize: "9.5px" }}><span style={apertureLabel}>{t.location}</span>{content.trace.location}</span>}
              </span>
              <p data-testid="syntx-aperture-quote" style={{ margin: 0, padding: "13px 16px", borderRadius: "10px", borderLeft: `2px ${unscored ? "dashed" : "solid"} ${unscored ? "rgba(142, 239, 255, 0.7)" : "rgba(126, 255, 204, 0.85)"}`, background: "linear-gradient(90deg, rgba(126, 255, 204, 0.07), rgba(126, 255, 204, 0.015))", fontFamily: SANS, fontSize: "15px", lineHeight: 1.6, color: "#f1fbfd", letterSpacing: "0.1px" }}>“{content.trace.quote}”</p>
              <span style={{ ...micro, fontSize: "10px", color: "rgba(206, 232, 241, 0.7)" }}><span style={apertureLabel}>{t.capabilityReference}:</span> <span style={{ color: INK }}>{content.trace.capabilityName}</span>{content.trace.matchedConstituent !== null ? ` · ${t.constituent} ${content.trace.matchedConstituent}` : ""} · {t.basis} <span style={{ color: INK }}>{content.trace.basis}</span></span>
              {content.trace.contribution !== null && content.trace.confidence !== null && (
                <span data-testid="syntx-aperture-contribution" style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.contribution}</span> {content.trace.contribution}</span>
                  <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.confidence}</span> {content.trace.confidence}</span>
                  {aperture.requirement?.weight !== null && aperture.requirement?.weight !== undefined && <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.weight}</span> {aperture.requirement.weight}</span>}
                </span>
              )}
              {unscored && <span data-testid="syntx-aperture-sweep-status" data-scored="false" style={{ ...apertureChip("rgba(142, 239, 255, 0.6)", true), alignSelf: "flex-start", fontSize: "9.5px", color: "rgba(142, 239, 255, 0.95)", whiteSpace: "normal" }}>{t.sweepStatus}</span>}
              <p style={{ ...prose, fontSize: "12.5px", color: "rgba(230, 241, 248, 0.86)" }}>{content.trace.kind === "supports" ? t.texts.scored : content.trace.kind === "weakly_supports" ? t.texts.weak : t.texts.sweep}</p>
              {content.trace.weakReason !== null && <span style={{ ...micro, fontSize: "10px", color: AMBER }}>{content.trace.weakReason}</span>}
            </>
          )}
          {content.kind === "open" && (
            <>
              <ApertureRelation kind="missing_support" label={t.relation.missing_support} tone={NEUTRAL} />
              <p data-testid="syntx-aperture-open-text" style={{ ...prose, fontSize: "14px", lineHeight: 1.6, color: "#eef8fb" }}>{t.texts.missing}</p>
              {content.requirement.evidenceHint !== null && <span style={{ ...micro, fontSize: "10px" }}><span style={apertureLabel}>{t.hint}:</span> <span style={{ color: INK }}>{content.requirement.evidenceHint}</span></span>}
              <span style={{ ...micro, fontSize: "10px", color: "rgba(206, 232, 241, 0.7)" }}>{content.requirement.necessity ?? ""}{content.requirement.weight !== null ? ` · ${t.weight} ${content.requirement.weight}` : ""}{content.requirement.requiredLevel !== null ? ` · ${t.level} ${content.requirement.requiredLevel}` : ""}</span>
            </>
          )}
          {content.kind === "pending" && (
            <>
              <ApertureRelation kind="pending_evaluation" label={t.relation.pending_evaluation} tone={NEUTRAL} />
              <p data-testid="syntx-aperture-pending-text" style={{ ...prose, fontSize: "14px", lineHeight: 1.6, color: "#eef8fb" }}>{t.texts.pending}</p>
              <span style={{ ...micro, fontSize: "10px", color: "rgba(206, 232, 241, 0.7)" }}>{content.boundary.targetRoleProfileRevisionId} · {content.boundary.targetRequirementRevisionIds.length} TRQREV</span>
              {observedRole?.matching && <span data-testid="syntx-aperture-resonance" data-resonance-score={observedRole.matching.resonanceScore} style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}><span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.resonance}</span> {percent(observedRole.matching.resonanceScore)}</span> <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.rank}</span> #{observedRole.matching.deliveredRank}</span></span>}
            </>
          )}
        </div>

        {/* Boundary zone: the authority statement, separated from the evidence it qualifies. */}
        <footer style={{ padding: "12px 20px 14px", borderTop: "1px dashed rgba(255, 179, 56, 0.32)", background: "linear-gradient(180deg, rgba(255, 179, 56, 0.05), rgba(255, 179, 56, 0.015))", borderRadius: "0 0 14px 14px" }}>
          <span data-testid="syntx-aperture-authority" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px 6px", fontFamily: MONO, fontSize: "10px", lineHeight: 1.4, color: AMBER }}>
            {authorityParts.map((part, index) => (
              <React.Fragment key={part}>
                {index > 0 && <span style={visuallyHidden}> · </span>}
                <span style={{ padding: "2px 8px", borderRadius: "6px", border: "1px solid rgba(255, 179, 56, 0.28)", background: "rgba(255, 179, 56, 0.06)" }}>{part}</span>
              </React.Fragment>
            ))}
          </span>
        </footer>
      </aside>
    </>
  );
}

export function SyntxField({ workflow, analysisSource, observation: requested, onObserve, onSelectPool, onExit, locale = SIL_COPY.defaultLocale }: SyntxFieldProps) {
  const t = SIL_COPY[locale].syntx;
  const tp: PoolCopy = SIL_COPY[locale].jobPool;
  const mode = useMotionMode();
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const size = useStageSize(stageRef);
  const state = describeSyntxFieldState(workflow, analysisSource);
  const view = workflow.view.state === "AVAILABLE" ? workflow.view.upload : null;
  const matching = workflow.matches.state === "AVAILABLE" ? workflow.matches.matches : null;
  const analysisId = matching?.analysisId ?? null;
  const sourcesState = useAnalysisSources(analysisId);
  const sources = sourcesState.state === "AVAILABLE" ? sourcesState.sources : null;
  const field = useMemo(() => deriveSyntxField(view, matching, sources, requested), [view, matching, sources, requested]);
  const resolution = useMemo(() => resolveObservation(view, requested), [view, requested]);
  const observation = field?.observation ?? resolution.observation;
  const listed = workflow.pools.state === "AVAILABLE" ? workflow.pools.jobPools : [];
  const selection = describeSelection(workflow.selectedJobPoolUploadId, listed);
  const [poolsOpen, setPoolsOpen] = useState(false);
  const [intakeOpen, setIntakeOpen] = useState(false);
  const [boundaryOpen, setBoundaryOpen] = useState(false);
  const [actorId, setActorId] = useState("JOB_POOL_UPLOADER_LOCAL");
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileText, setFileText] = useState<string | null>(null);
  const canUpload = fileText !== null && workflow.upload.state !== "SUBMITTING";
  const poolsVisible = selection.kind === "NONE" || poolsOpen;
  const intakeVisible = intakeOpen;
  const summary = field === null ? null : summarySentence(field.summary, t.summary);
  const observationId = observation.kind === "FIELD" ? (field?.pool.jobPoolUploadId ?? workflow.selectedJobPoolUploadId ?? "") : observation.kind === "ORGANIZATION" ? observation.organizationId ?? "" : observation.kind === "ROLE" ? observation.roleId ?? "" : observation.requirementId ?? "";
  const observedSignId = observation.kind === "ORGANIZATION" ? `org:${observation.organizationId}` : observation.kind === "ROLE" ? `role:${observation.roleId}` : observation.kind === "REQUIREMENT" ? `req:${observation.requirementId}` : null;
  const apertureOpen = field?.aperture !== null && field?.aperture !== undefined;

  /** F-SX-1 (PINK, R8): when a return or an aperture close unmounts the focused sign, focus moves to the sign of the new observation point, else to the field root, so Escape keeps working at every level. */
  useEffect(() => {
    const root = rootRef.current;
    if (root === null || typeof document === "undefined") return;
    const active = document.activeElement;
    if (active !== null && active !== root && active !== document.body && root.contains(active)) return;
    const target = (observedSignId === null ? null : root.querySelector<HTMLElement | SVGElement>(`[data-sign-id="${observedSignId}"]`)) ?? root;
    (target as HTMLElement).focus?.({ preventScroll: true });
  }, [observation.kind, observation.organizationId, observation.roleId, observation.requirementId, apertureOpen, observedSignId]);

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setFileName(null); setFileText(null); return; }
    setFileName(file.name);
    setFileText(await file.text());
  };

  /** Escape returns one level (R8); with an edge lens open it closes that first. */
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    if (intakeOpen) { setIntakeOpen(false); return; }
    if (boundaryOpen) { setBoundaryOpen(false); return; }
    if (poolsOpen && selection.kind !== "NONE") { setPoolsOpen(false); return; }
    if (observation.kind !== "FIELD") onObserve(returnFrom(observation));
  };

  const path: Array<{ kind: SyntxObservation["kind"]; name: string; target: SyntxObservation }> = [];
  if (field !== null) {
    path.push({ kind: "FIELD", name: field.pool.poolName, target: { kind: "FIELD", organizationId: null, roleId: null, requirementId: null, apertureSignId: null } });
    const organization = observation.organizationId === null ? null : field.organizations.find(item => item.id === observation.organizationId) ?? null;
    const role = observation.roleId === null ? null : field.roles.find(item => item.id === observation.roleId) ?? null;
    const requirement = observation.kind === "REQUIREMENT" ? field.requirements.find(item => item.id === observation.requirementId) ?? null : null;
    if (observation.kind !== "FIELD" && organization !== null) path.push({ kind: "ORGANIZATION", name: organization.name, target: { kind: "ORGANIZATION", organizationId: organization.id, roleId: null, requirementId: null, apertureSignId: null } });
    if ((observation.kind === "ROLE" || observation.kind === "REQUIREMENT") && role !== null) path.push({ kind: "ROLE", name: role.title, target: { kind: "ROLE", organizationId: role.organizationId, roleId: role.id, requirementId: null, apertureSignId: null } });
    if (observation.kind === "REQUIREMENT" && requirement !== null && role !== null) path.push({ kind: "REQUIREMENT", name: requirement.name, target: { kind: "REQUIREMENT", organizationId: role.organizationId, roleId: role.id, requirementId: requirement.id, apertureSignId: null } });
  }

  return (
    <section
      ref={rootRef}
      data-testid="syntx-field"
      data-field-grammar={SYNTX_FIELD_GRAMMAR}
      data-observation-kind={observation.kind}
      data-observation-id={observationId}
      data-aperture-open={field?.aperture ? "true" : "false"}
      data-motion-mode={mode}
      data-field-state={state}
      data-pool-id={workflow.selectedJobPoolUploadId ?? ""}
      data-analysis-id={analysisSource.kind === "NONE" ? "" : analysisSource.analysisId}
      data-analysis-source={analysisSource.kind}
      data-pools-state={workflow.pools.state}
      data-upload-state={workflow.upload.state}
      data-selection-kind={selection.kind}
      data-selected-pool={workflow.selectedJobPoolUploadId ?? ""}
      data-view-state={workflow.view.state}
      data-matches-state={workflow.matches.state}
      data-sources-state={sourcesState.state}
      data-matching-delivered={field?.matchingDelivered ? "true" : "false"}
      data-sign-count={field?.signs.length ?? 0}
      data-organization-count={field?.organizations.length ?? 0}
      data-role-count={field?.roles.length ?? 0}
      data-requirement-count={field?.requirements.length ?? 0}
      data-pools-visible={poolsVisible ? "true" : "false"}
      data-intake-visible={intakeVisible ? "true" : "false"}
      data-boundary-visible={boundaryOpen ? "true" : "false"}
      data-sx-ambient={SYNTX_AMBIENT_MOTION ? "on" : "off"}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.9)", backdropFilter: "blur(8px)", fontFamily: MONO, color: INK, outline: "none", animation: mode === "LIVE" ? "sxEnter 620ms ease-out both" : undefined }}
    >
      <style>{SYNTX_CSS}</style>

      {/* BR-4: the screen-reader summary of the observation point, generated from the same view model as the signs. */}
      <p data-testid="syntx-summary" data-summary-for={observationId} aria-live="polite" style={visuallyHidden}>{summary ?? ""}</p>

      {/* The stage: every level of the field and the aperture share one coordinate space (the whole field area, as the Capability Field's). */}
      <div ref={stageRef} data-testid="syntx-stage" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {field !== null && <FieldStage field={field} mode={mode} t={t} locale={locale} size={size} onObserve={onObserve} />}
        {resolution.stale !== null && <span data-testid="syntx-stale" data-stale-kind={resolution.stale.kind} data-stale-id={resolution.stale.id} data-sx-reveal="true" style={{ ...lens, ...prose, color: AMBER, position: "absolute", left: "50%", top: "calc(50% + 150px)", transform: "translateX(-50%)", width: "min(320px, 40%)", textAlign: "center", zIndex: 41 }}>{t.stale[resolution.stale.kind]}</span>}
        {state === "NO_POOL" && <span data-testid="syntx-no-pool" data-sx-reveal="true" style={{ ...prose, position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: "min(360px, 60%)", textAlign: "center", zIndex: 3 }}>{t.noPool}</span>}
        {state === "NO_ANALYSIS" && field !== null && <span data-testid="syntx-no-analysis" style={{ ...micro, color: AMBER, position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 44px)", transform: "translateX(-50%)", width: "min(520px, 80%)", textAlign: "center", zIndex: 41 }}>{tp.analysisNone}</span>}
      </div>

      {/* Orientation line: title, exit, the observation path (each step a return), the read state. Never a panel. */}
      <div data-sx-surface="header" style={{ position: "absolute", left: "28px", top: "136px", ...stack(6), zIndex: 46, maxWidth: "min(340px, 28vw)" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "14px", flexWrap: "wrap" }}>
          <h3 style={{ ...label, color: CYAN, fontSize: "10px", letterSpacing: "2.4px", textShadow: `0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong}` }}>{t.title}</h3>
          <button data-testid="syntx-exit-btn" onClick={onExit} style={action("muted")}>{t.exit}</button>
        </div>
        <nav data-testid="syntx-path" aria-label={t.observation[observation.kind]} style={{ ...row(6), rowGap: "2px" }}>
          {path.map((step, index) => (
            <React.Fragment key={step.kind}>
              {index > 0 && <span aria-hidden="true" style={{ ...micro, opacity: 0.5 }}>›</span>}
              <button data-testid={`syntx-path-${step.kind}`} data-current={index === path.length - 1 ? "true" : "false"} disabled={index === path.length - 1} onClick={() => onObserve(step.target)} style={{ ...ghost, fontSize: "8.5px", color: index === path.length - 1 ? INK : MUTED, cursor: index === path.length - 1 ? "default" : "pointer", textTransform: "none", letterSpacing: "0.4px", padding: "2px 0", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{step.name}</button>
            </React.Fragment>
          ))}
          {observation.kind !== "FIELD" && <button data-testid="syntx-return-btn" onClick={() => onObserve(returnFrom(observation))} style={{ ...action("cyan"), fontSize: "8.5px" }}>← {t.returnLabel}</button>}
        </nav>
        <span data-testid="syntx-state" data-state={state} style={{ ...micro, display: "inline-flex", alignItems: "center", gap: "8px", color: state === "AVAILABLE" ? MUTED : AMBER }}>
          <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: state === "AVAILABLE" ? CYAN : AMBER, flexShrink: 0 }} />
          {state === "AVAILABLE" ? t.matching : state === "NO_POOL" ? tp.selectionNone : state === "NO_ANALYSIS" ? tp.analysisNone : state === "LOADING" ? tp.matchesLoading : state === "NOT_FOUND" ? tp.matchesNotFound : state === "INACTIVE_POOL" ? tp.matchesInactive : state === "NOT_PROVISIONED" ? tp.notProvisioned : tp.matchesFailed}
        </span>
        <span style={{ ...micro, opacity: 0.7 }}>{t.keys}</span>
        <div style={row(14)}>
          <button data-testid="syntx-pools-toggle" aria-expanded={poolsVisible} onClick={() => setPoolsOpen(value => !value)} style={{ ...ghost, fontSize: "9px" }}>{poolsVisible ? t.poolsHide : `⬡ ${t.pools}${listed.length > 0 ? ` · ${listed.length}` : ""}`}</button>
          <button data-testid="job-pool-intake-toggle" aria-expanded={intakeVisible} onClick={() => setIntakeOpen(value => !value)} style={{ ...ghost, fontSize: "9px" }}>{intakeVisible ? tp.intakeHide : tp.intakeOpen}</button>
          {field !== null && field.boundary !== null && <button data-testid="syntx-boundary-toggle" aria-expanded={boundaryOpen} onClick={() => setBoundaryOpen(value => !value)} style={{ ...ghost, fontSize: "9px" }}>{boundaryOpen ? t.boundaryHide : t.boundary}</button>}
        </div>
      </div>

      {/* Edge aperture: the persisted uploads (explicit selection only); the contextual action while nothing is at the field. */}
      <div data-testid="job-pool-list" data-pool-count={listed.length} data-list-state={workflow.pools.state} hidden={!poolsVisible} data-sx-reveal={poolsVisible ? "true" : undefined} data-sx-surface="pools" style={{ ...lens, display: poolsVisible ? "flex" : "none", flexDirection: "column", gap: "8px", position: "absolute", left: "28px", top: "300px", width: "min(300px, 26vw)", maxHeight: "calc(100vh - 420px)", overflowY: "auto", zIndex: 46 }}>
        <span style={label}>{tp.pools}</span>
        {(workflow.pools.state === "IDLE" || workflow.pools.state === "LOADING") && <span data-testid="job-pool-list-loading" style={{ ...micro, color: AMBER }}>{tp.poolsLoading}</span>}
        {workflow.pools.state === "EMPTY" && <span data-testid="job-pool-list-empty" style={micro}>{tp.poolsEmpty}</span>}
        {workflow.pools.state === "NOT_PROVISIONED" && <span data-testid="job-pool-list-not-provisioned" style={{ ...micro, color: AMBER }}>{tp.notProvisioned}</span>}
        {workflow.pools.state === "FAILED" && <span data-testid="job-pool-list-failed" style={{ ...micro, color: AMBER }}>{tp.poolsFailed}{workflow.pools.code ? ` · ${workflow.pools.code}` : ""}</span>}
        {selection.kind === "NOT_LISTED" && <span data-testid="job-pool-selection-not-listed" style={{ ...micro, color: AMBER }}>{tp.selectionNotListed} · {selection.jobPoolUploadId}</span>}
        <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(6) }}>
          {listed.map((pool, index) => {
            const selected = pool.jobPoolUploadId === workflow.selectedJobPoolUploadId;
            return (
              <li key={pool.jobPoolUploadId} data-testid={`job-pool-item-${pool.jobPoolUploadId}`} data-selected={selected ? "true" : "false"} data-pool-status={pool.poolStatus} data-delivered-index={index + 1} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "10px", paddingBottom: "6px", borderBottom: "1px solid rgba(99, 120, 138, 0.2)" }}>
                <span style={stack(2)}>
                  <span style={{ fontFamily: SANS, fontSize: "12.5px", fontWeight: 500, color: INK }}>{pool.poolName}</span>
                  <span style={{ ...micro, color: pool.poolStatus === "ACTIVE" ? MUTED : AMBER }}>v{pool.poolVersion} · {pool.poolStatus} · {pool.organizationCount} org · {pool.roleCount} roles · {pool.requirementCount} req</span>
                </span>
                <button data-testid={`job-pool-select-${pool.jobPoolUploadId}`} disabled={selected} aria-pressed={selected} onClick={() => { onSelectPool(pool.jobPoolUploadId); setPoolsOpen(false); }} style={action("cyan", !selected)}>{selected ? tp.selected : tp.select}</button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Edge aperture: intake (the one client write), opened only on explicit action. */}
      <section data-testid="job-pool-upload" hidden={!intakeVisible} data-sx-reveal={intakeVisible ? "true" : undefined} style={{ ...lens, display: intakeVisible ? "flex" : "none", flexDirection: "column", gap: "8px", position: "absolute", right: "28px", top: "136px", width: "min(300px, 26vw)", zIndex: 46 }}>
        <span style={label}>{tp.intake} · {tp.upload}</span>
        <label style={{ ...micro, ...stack(2) }}>{tp.uploader}
          <input data-testid="job-pool-actor-input" value={actorId} onChange={event => setActorId(event.target.value)} style={input} />
        </label>
        <label style={{ ...micro, ...stack(2) }}>{tp.chooseFile}
          <input data-testid="job-pool-file-input" type="file" accept="application/json,.json" onChange={event => { void onFile(event); }} style={{ ...input, fontSize: "9px", color: MUTED }} />
        </label>
        <span data-testid="job-pool-file-name" style={micro}>{fileName ?? tp.noFile}</span>
        <button data-testid="job-pool-upload-btn" disabled={!canUpload} onClick={() => { if (fileText !== null) void workflow.submitUpload(fileText, actorId); }} style={{ ...action("cyan", canUpload), alignSelf: "flex-start" }}>
          {workflow.upload.state === "SUBMITTING" ? tp.submitting : `${tp.submit} →`}
        </button>
        {(workflow.upload.state === "CREATED" || workflow.upload.state === "IDENTICAL_EXISTS") && (
          <div data-testid="job-pool-upload-result" data-upload-outcome={workflow.upload.state} data-upload-id={workflow.upload.upload.jobPoolUploadId} data-sx-reveal="true" style={stack(3)}>
            <span style={{ ...word(SIL_TOKENS.colors.evolutionGreen), whiteSpace: "normal" }}>{workflow.upload.state === "CREATED" ? tp.uploadCreated : tp.uploadIdentical}</span>
            <span style={{ ...micro, color: INK }}>{workflow.upload.upload.jobPoolUploadId}</span>
            <span style={micro}>{workflow.upload.upload.poolName} v{workflow.upload.upload.poolVersion} · {workflow.upload.upload.poolStatus}</span>
            {workflow.selectedJobPoolUploadId !== workflow.upload.upload.jobPoolUploadId && <span style={{ ...micro, color: AMBER }}>{tp.uploadNotSelected}</span>}
          </div>
        )}
        {workflow.upload.state === "REJECTED" && (
          <div data-testid="job-pool-upload-rejected" data-rejection-code={workflow.upload.code} data-rejection-status={workflow.upload.status} data-sx-reveal="true" style={stack(3)}>
            <span style={{ ...micro, color: AMBER }}>{tp.uploadRejected} · HTTP {workflow.upload.status} · {workflow.upload.code}</span>
            <span style={micro}>{workflow.upload.message}</span>
            {workflow.upload.issues.map((issue, index) => <span key={`${issue.path}:${index}`} data-testid="job-pool-upload-issue" style={micro}>{issue.path || "(root)"}: {issue.message}</span>)}
          </div>
        )}
        {workflow.upload.state === "NOT_PROVISIONED" && <span data-testid="job-pool-upload-not-provisioned" style={{ ...micro, color: AMBER }}>{tp.notProvisioned}</span>}
        {workflow.upload.state === "FAILED" && <span data-testid="job-pool-upload-failed" style={{ ...micro, color: AMBER }}>{tp.uploadFailed}{workflow.upload.code ? ` · ${workflow.upload.code}` : ""}</span>}
      </section>

      {/* Edge aperture: the authority boundary of what was read (labels, canonical mapping state, sweep state), opened on demand. */}
      {field !== null && field.boundary !== null && matching !== null && view !== null && (
        <section data-testid="job-pool-matches" data-matches-state={workflow.matches.state} data-ranking={describeRanking(matching.roleMatches)} hidden={!boundaryOpen} data-sx-reveal={boundaryOpen ? "true" : undefined} data-sx-surface="boundary" style={{ ...lens, display: boundaryOpen ? "flex" : "none", flexDirection: "column", gap: "8px", position: "absolute", right: "28px", bottom: "calc(var(--condyn-page-header-height, 60px) + 52px)", width: "min(340px, 28vw)", maxHeight: "50vh", overflowY: "auto", zIndex: 46 }}>
          <span style={label}>{t.boundary}</span>
          <div data-testid="job-pool-presentation-labels" data-policy-version={field.boundary.policyVersion} data-authority-state={field.boundary.authorityState} style={row(10)}>
            {field.boundary.labels.map(item => <span key={item} data-testid={`job-pool-label-${item}`} style={{ ...word(AMBER), whiteSpace: "normal" }}>{tp.labels[item]}</span>)}
          </div>
          <span data-testid="job-pool-ranking" data-ranking={describeRanking(matching.roleMatches)} style={micro}>{tp.ranking[describeRanking(matching.roleMatches)]}</span>
          <div data-testid="job-pool-canonical-mapping" data-mapping-state={view.canonicalMapping.mappingState} data-proposal-state={view.canonicalMapping.proposalState} data-authority-state={view.canonicalMapping.authorityState} style={row(10)}>
            <span style={word(SIL_TOKENS.colors.evolutionGreen)}>{view.canonicalMapping.mappingState}</span><span style={word(AMBER)}>{view.canonicalMapping.proposalState}</span><span style={word(AMBER)}>authority {view.canonicalMapping.authorityState}</span>
          </div>
          <span style={{ ...prose, fontSize: "11px" }}>{tp.canonicalMappingBoundary}</span>
          <div data-testid="job-pool-capability-sweep" data-sweep-state={field.boundary.capabilitySweep.state} data-proposal-count={field.boundary.capabilitySweep.proposalCount} data-scored="false" style={stack(3)}>
            <span style={{ ...micro, color: field.boundary.capabilitySweep.state === "AVAILABLE" ? MUTED : AMBER }}>{tp.sweepStates[field.boundary.capabilitySweep.state]} · {tp.sweepProposals} {field.boundary.capabilitySweep.proposalCount} · <span style={word(AMBER)}>{tp.unscored}</span></span>
            <span style={{ ...prose, fontSize: "11px" }}>{tp.sweepBoundary}</span>
          </div>
          <span style={micro}>{tp.candidateCapabilities} {field.boundary.candidateCapabilityCount} · {tp.weakThreshold} {field.boundary.weakEvidenceThreshold}</span>
          <span style={{ ...prose, fontSize: "11px" }}>{tp.missingBoundary}</span>
        </section>
      )}

      {/* Field-edge semantic line: the laws of the field, always visible, never in the way. */}
      <span data-testid="job-pool-non-claims" style={{ position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 22px)", transform: "translateX(-50%)", maxWidth: "min(960px, 84vw)", textAlign: "center", ...micro, fontSize: "8.5px", letterSpacing: "1.4px", color: "rgba(230, 241, 248, 0.55)", zIndex: 46 }}>{t.nonClaims}</span>
    </section>
  );
}
