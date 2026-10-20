"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { SIL_RED_FIELD_TYPE, SIL_TOKENS } from "./SILTokens";
import { useOrbitalMotionElapsedMs } from "./OrbitalSatelliteMotion";
import { renderSemioticSignature } from "./OrbitalResonanceBubble";
import { SYNTX_RESONANCE_BODY_KEYFRAMES, SyntxResonanceBody } from "./manifestation/SyntxResonanceBody";
import { SYNTX_CORE_KEYFRAMES, SyntxCoreOrganism } from "./manifestation/SyntxCoreOrganism";
import { SyntxEnergyRay, SyntxPlanetariumBackdrop } from "./manifestation/SyntxPlanetarium";
import { FocusTransitionStageShell, SYNTX_FOCUS, SYNTX_FOCUS_PULSE_KEYFRAMES } from "./manifestation/SyntxFocusShell";
import { SYNTX_COSMOS_CENTER_MATERIAL, SYNTX_COSMOS_NODE_MATERIAL, SYNTX_COSMOS_STARS, SyntxCosmosShell, syntxCosmosPoint } from "./manifestation/SyntxCosmosShell";
import { SYNTX_EVIDENCE_LINK, SYNTX_EVIDENCE_SURFACE_MATERIAL, SYNTX_NUCLEUS_MATERIAL, SYNTX_SATELLITE_MATERIAL, SyntxDeepFocusShell } from "./manifestation/SyntxDeepFocusShell";
import { SYNTX_HUD_SURFACE } from "./manifestation/SyntxHudSurface";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import { resolveSilFocusedManifestationPresentation } from "../../../../lib/career/view-model/focused-orbit-placement";
import { describeRanking, describeSelection, type JobPoolAnalysisSource } from "../../../../lib/career/job-pool/frontend-presentation";
import { useJobPoolWorkflow } from "../../../../lib/career/ui/useJobPool";
import { useAnalysisSources } from "../../../../lib/career/ui/useJobPoolSources";
import { JOB_SCOPE_REQUIRED_MESSAGE, type JobScope } from "../../../../lib/career/job-pool/job-scope";
import type { InvestigationMode } from "../../../../lib/career/job-pool/investigation-mode";
import { useJobStructure, useSelectedRoleCoverage, type JobStructureState, type SelectedRoleCoverageState } from "../../../../lib/career/ui/useRoleInvestigation";
import { readGeminiExchangeInspection, readGeminiResultInspection, type InspectorReadState } from "../../../../lib/career/result-inspector/client";
import type { GeminiExchangeInspection, GeminiResultInspection } from "../../../../lib/career/result-inspector/reader";
import type { JobStructure } from "../../../../lib/career/job-pool/job-structure";
import { DecisionLoopLabsCoreEmblem, DLL_TEAL } from "./DecisionLoopLabsMark";
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
  monoLineSize,
  requirementCardMode,
  roleCardBox,
  ROLE_CARD_FOOTER,
  roleCosmosRotation,
  roleSeniorityParts,
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
  /** The selected job scope (SFE invariant); shown here as the state of the observed role's selection action. */
  jobScope?: JobScope | null;
  /** Selects the observed role of the selected pool as the job scope (explicit, never inferred). */
  onSelectJobScope?(poolRoleId: string): void;
  /** Owner G-05: removes the selected job (explicit action at the selected role); ANALYZE is blocked afterwards. */
  onClearJobScope?(): void;
  /** Capability gate (Job Pool first): false while no VALID job is selected; the way back to the Capability Field is then closed. */
  capabilityAvailable?: boolean;
  capabilityGatedHint?: string;
  /** The investigation boundary and the analysis on view (three modes); absent = PERSON × JOB without a known analysis mode. */
  investigation?: SyntxInvestigationContext;
  /** GEMINI OUTPUT beside BOUNDARY (engineering builds only; defaults to NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI). */
  geminiOutputEnabled?: boolean;
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

/* Job Field resonance tone: the SYNTX family in the field's own register. The atmosphere and the resting structure (orbits, tethers,
 * resting rays, containment) lean from the Capability Field's cyan (189°) towards azure (201°). Active resonance stays CYAN, evidence
 * MINT, the authority boundary AMBER, missing support NEUTRAL: no state, evidence category or boundary changes its colour. */
const azure = (alpha: number): string => `rgba(92, 200, 255, ${alpha})`;
const JOB_PLANETARIUM_TONE = { glow: "#4cc4f0", orbit: azure(0.13), ring: azure(0.17), node: azure(0.42), dust: azure(0.28) };
const JOB_FIELD_ATMOSPHERE = "radial-gradient(ellipse 120% 100% at 50% 52%, transparent 58%, rgba(0, 2, 6, 0.36) 100%), radial-gradient(circle at 50% 55%, rgba(56, 212, 222, 0.07), transparent 30%), radial-gradient(ellipse 72% 62% at 50% 54%, rgba(18, 66, 112, 0.14), transparent 72%), radial-gradient(ellipse 50% 40% at 88% 8%, rgba(92, 200, 255, 0.045), transparent 70%), radial-gradient(ellipse 46% 36% at 8% 96%, rgba(40, 92, 170, 0.06), transparent 70%)";
const JOB_COSMOS_BACKDROP = "radial-gradient(ellipse at 50% 48%, rgba(14, 52, 80, 0.24) 0%, rgba(4, 9, 20, 0.74) 50%, rgba(1, 3, 9, 0.96) 100%)";
const JOB_COSMOS_STARS: React.CSSProperties = { ...SYNTX_COSMOS_STARS, backgroundImage: "radial-gradient(circle at 16% 22%, rgba(92, 200, 255, 0.3) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 31%, rgba(126, 255, 204, 0.16) 0 1px, transparent 1.5px), radial-gradient(ellipse at 70% 76%, rgba(26, 70, 132, 0.14), transparent 52%)" };
const JOB_DEEP_FOCUS_BACKDROP = "radial-gradient(circle at 50% 42%, rgba(16, 68, 96, 0.24), transparent 26%), radial-gradient(ellipse at 50% 54%, rgba(3, 11, 24, 0.64), rgba(1, 3, 9, 0.97) 76%)";
const JOB_ORBIT = azure(0.2);
/* Decision Loop Labs brand field (the logo's instrument ground): a fine technical grid that clears around the core and fades at the
 * edges, and four registration brackets framing every level. Static, behind or beside every sign; colour from the brand's teal. */
const JOB_FIELD_BRAND_GRID: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `repeating-linear-gradient(0deg, ${DLL_TEAL(0.03)} 0 1px, transparent 1px 56px), repeating-linear-gradient(90deg, ${DLL_TEAL(0.03)} 0 1px, transparent 1px 56px)`,
  maskImage: "radial-gradient(ellipse 78% 74% at 50% 55%, transparent 14%, #000 42%, rgba(0, 0, 0, 0.55) 72%, transparent 100%)",
  WebkitMaskImage: "radial-gradient(ellipse 78% 74% at 50% 55%, transparent 14%, #000 42%, rgba(0, 0, 0, 0.55) 72%, transparent 100%)"
};
const BRAND_BRACKET = 18;
function BrandFrame() {
  const arm = `1px solid ${DLL_TEAL(0.3)}`;
  const corners: Array<[string, React.CSSProperties]> = [
    ["tl", { left: "12px", top: "12px", borderLeft: arm, borderTop: arm }],
    ["tr", { right: "12px", top: "12px", borderRight: arm, borderTop: arm }],
    ["bl", { left: "12px", bottom: "calc(var(--condyn-page-header-height, 60px) + 12px)", borderLeft: arm, borderBottom: arm }],
    ["br", { right: "12px", bottom: "calc(var(--condyn-page-header-height, 60px) + 12px)", borderRight: arm, borderBottom: arm }]
  ];
  return (
    <div data-sx-brand-frame="dll" aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 46 }}>
      {corners.map(([key, style]) => <span key={key} style={{ position: "absolute", width: `${BRAND_BRACKET}px`, height: `${BRAND_BRACKET}px`, ...style }} />)}
    </div>
  );
}
/** Resting cards of the cosmos (roles, requirements) and the deep-focus satellites: the cosmos materials in the field's azure register.
 * The focused centres (cosmos centre, nucleus) keep the cyan of active resonance. */
const JOB_NODE_MATERIAL: React.CSSProperties = {
  ...SYNTX_COSMOS_NODE_MATERIAL,
  border: `1px solid ${azure(0.46)}`,
  background: "radial-gradient(circle at 18% 0%, rgba(120, 212, 255, 0.15), transparent 46%), linear-gradient(172deg, rgba(8, 21, 36, 0.97), rgba(4, 11, 21, 0.97))",
  boxShadow: `0 0 22px rgba(46, 132, 226, 0.16), 0 8px 20px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(180, 232, 255, 0.12), inset 0 0 18px ${azure(0.04)}`
};
/** The organization cosmos' centre: the shared centre material with an opaque deep core, so the receded organization body behind it
 * no longer shows through the text; a finer membrane and a calmer glow. */
const JOB_COSMOS_CENTRE_MATERIAL: React.CSSProperties = {
  border: "1.5px solid rgba(56, 229, 255, 0.85)",
  background: "radial-gradient(circle at 50% 36%, rgba(56, 229, 255, 0.2), rgba(56, 229, 255, 0.06) 46%, transparent 70%), radial-gradient(circle, #06192a 0%, #04111d 58%, #020910 100%)",
  boxShadow: "0 0 0 4px rgba(2, 8, 14, 0.55), 0 0 0 5px rgba(92, 200, 255, 0.12), 0 0 34px rgba(56, 229, 255, 0.26), 0 0 80px rgba(56, 229, 255, 0.08), inset 0 0 26px rgba(56, 229, 255, 0.16), inset 0 1px 0 rgba(210, 250, 255, 0.25)"
};
/** Role cards of the organization cosmos: semantic carriers of the orbit (ROLE ORBIT CARD REFINEMENT) — a calm deep glass lit from
 * above the centre line, a light edge and a symmetric field glow (static); everything on the card is centred on its axis. */
const JOB_ROLE_CARD_MATERIAL: React.CSSProperties = {
  ...JOB_NODE_MATERIAL,
  border: `1px solid ${azure(0.36)}`,
  background: [
    "radial-gradient(120% 95% at 50% -18%, rgba(120, 214, 255, 0.15), transparent 58%)",
    "radial-gradient(70% 55% at 50% 118%, rgba(84, 232, 236, 0.06), transparent 64%)",
    "linear-gradient(180deg, rgba(8, 22, 36, 0.97), rgba(3, 10, 19, 0.98))"
  ].join(", "),
  borderRadius: "16px",
  boxShadow: `0 0 0 1px rgba(1, 5, 10, 0.6), 0 0 24px rgba(56, 160, 230, 0.15), 0 0 58px rgba(56, 160, 230, 0.05), 0 10px 22px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(190, 240, 255, 0.16), inset 0 0 0 1px rgba(150, 220, 255, 0.035), inset 0 0 22px ${azure(0.045)}`
};
/**
 * The role title on its card, in the lines the layout counted (ROLE CARDS, PINK): the packing's estimate counts lines from the title's
 * length, so a dense title can need one more; it then reads a little smaller — in half pixels, down to 10 px — instead of being cut
 * (the card's box, which every air is measured on, stays). Only where even 10 px does not fit does the line end in "…"; the full title
 * is in the card's label and in the title's tooltip. Measured after layout on the drawn text; the server renders the base size.
 */
function RoleCardTitle({ title, lines, size, width }: { title: string; lines: number; size: number; width: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    const element = ref.current;
    if (element === null) return;
    let fitted = size;
    element.style.fontSize = `${fitted}px`;
    while (element.scrollHeight > element.clientHeight + 1 && fitted > 10) { fitted -= 0.5; element.style.fontSize = `${fitted}px`; }
    element.dataset.titleSize = String(fitted);
  }, [title, lines, size, width]);
  return (
    <span ref={ref} data-sx-role-title title={title} style={{ display: "-webkit-box", flexShrink: 0, maxWidth: "100%", marginTop: "3px", fontFamily: SANS, fontSize: `${size}px`, fontWeight: 600, lineHeight: 1.22, letterSpacing: "0.05px", color: "#f1fafd", textWrap: "balance", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" } as React.CSSProperties}>{title.replace(/ ([–—-]) /g, "\u00a0$1 ")}</span>
  );
}
/** Where the cosmos tether reaches a role card: the point on the card's edge facing the centre, in percent of the card box (exactly on
 * the edge whatever the card's rendered height), and the direction towards the centre. */
function cardAnchor(dx: number, dy: number, halfWidth: number, halfHeight: number): { left: number; top: number; angle: number } {
  const nx = dx / halfWidth, ny = dy / halfHeight;
  const reach = Math.max(Math.abs(nx), Math.abs(ny)) || 1;
  return { left: 50 + 50 * nx / reach, top: 50 + 50 * ny / reach, angle: Math.atan2(dy, dx) * 180 / Math.PI };
}
const JOB_SATELLITE_MATERIAL: React.CSSProperties = { ...SYNTX_SATELLITE_MATERIAL, border: `1px solid ${azure(0.3)}`, background: "linear-gradient(172deg, rgba(6, 17, 30, 0.95), rgba(3, 10, 19, 0.95))", boxShadow: `0 0 15px rgba(46, 132, 226, 0.1), inset 0 1px 0 rgba(180, 232, 255, 0.08)` };
/** The rim point of a 168-unit body towards its HUD tether target (the tether box is 240 units, centred on the body). */
const tetherFromRim = (target: { x: number; y: number }): { x: number; y: number } => {
  const dx = target.x - 120, dy = target.y - 120, length = Math.hypot(dx, dy) || 1;
  return { x: Math.round((120 + (dx / length) * 86) * 100) / 100, y: Math.round((120 + (dy / length) * 86) * 100) / 100 };
};
/** The body's signature clears the reading area: its geometry is kept at the rim (outer ring, the outer arcs of the two lenses) and
 * fades out towards the centre, where the identity text sits — no line runs through the text. */
const SIGNATURE_CLEARING = "radial-gradient(circle closest-side, transparent 0 47%, rgba(0, 0, 0, 0.3) 54%, #000 61%)";
/** A soft reading plate behind one text line (fades to nothing at its edges): the remaining rim geometry passes behind it. */
const readingPlate = (highlighted: boolean): React.CSSProperties => ({ padding: "1px 9px", marginLeft: "-9px", marginRight: "-9px", background: `radial-gradient(closest-side, ${highlighted ? "rgba(6, 28, 42, 0.9)" : "rgba(5, 12, 23, 0.92)"}, ${highlighted ? "rgba(6, 28, 42, 0.55)" : "rgba(5, 12, 23, 0.6)"} 72%, transparent)` });
/** A dark reading halo for text over the body's signature geometry. */
const READING_HALO = "0 0 3px rgba(3, 8, 16, 0.95), 0 0 8px rgba(3, 8, 16, 0.85)";
const JOB_TETHER = azure(0.18);

const micro: React.CSSProperties = { fontFamily: MONO, fontSize: "10.5px", color: MUTED, letterSpacing: "0.3px", lineHeight: 1.55, wordBreak: "break-word" };
const label: React.CSSProperties = { fontFamily: MONO, fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: MUTED, margin: 0 };
const prose: React.CSSProperties = { fontFamily: SANS, fontSize: "13.5px", lineHeight: 1.65, color: INK_SOFT, margin: 0 };
const stack = (gap = 8): React.CSSProperties => ({ display: "flex", flexDirection: "column", gap: `${gap}px` });
const row = (gap = 8): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: `${gap}px`, flexWrap: "wrap" });
const word = (color: string): React.CSSProperties => ({ fontFamily: MONO, fontSize: "9.5px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color, whiteSpace: "nowrap" });
const action = (tone: "cyan" | "muted" = "cyan", enabled = true): React.CSSProperties => ({ background: "transparent", border: "none", padding: "4px 0", fontFamily: MONO, fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: !enabled ? "rgba(99, 120, 138, 0.6)" : tone === "cyan" ? CYAN : MUTED, cursor: enabled ? "pointer" : "not-allowed", textShadow: enabled && tone === "cyan" ? `0 0 10px ${SIL_TOKENS.colors.cyanGlow}` : undefined, transition: "color .25s ease" });
const ghost: React.CSSProperties = { ...action("muted"), fontSize: "9.5px", letterSpacing: "1px" };
/** An edge lens: the hologram HUD surface of the planetarium (opaque universe body, cyan frame), placed at the field's edge. */
const lens: React.CSSProperties = { ...SYNTX_HUD_SURFACE, position: undefined, width: undefined, zIndex: undefined };
const input: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "transparent", border: "none", borderBottom: "1px solid rgba(99, 120, 138, 0.4)", color: INK, fontFamily: MONO, fontSize: "11.5px", padding: "5px 0", outline: "none" };

/* Job Field panels (pools · intake · boundary): semiotic resonance surfaces attached to the field, not form boxes. A deep glass body
 * with a top light, a fine azure edge, four registration ticks, a breathing aura (atmosphereGlow) and a light current travelling the
 * upper edge (sxPanelCurrent) — both LIVE only; each panel holds one node with a hairline towards the field (data-sx-panel-node).
 * Typography: a kicker with its marker and rule, quiet meta lines, readable statements, semantic chips. Visual only. */
const PANEL_TICKS = ["6px 6px", "calc(100% - 6px) 6px", "6px calc(100% - 6px)", "calc(100% - 6px) calc(100% - 6px)"].flatMap(position => [
  `linear-gradient(${azure(0.5)}, ${azure(0.5)}) ${position} / 9px 1px no-repeat`,
  `linear-gradient(${azure(0.5)}, ${azure(0.5)}) ${position} / 1px 9px no-repeat`
]);
const panel: React.CSSProperties = {
  position: "absolute",
  boxSizing: "border-box",
  padding: "18px 20px 20px",
  borderRadius: "14px",
  border: `1px solid ${azure(0.3)}`,
  background: [...PANEL_TICKS, "radial-gradient(120% 64% at 50% -12%, rgba(84, 232, 236, 0.1), transparent 58%)", "radial-gradient(90% 60% at 100% 110%, rgba(40, 110, 190, 0.08), transparent 60%)", "linear-gradient(170deg, rgba(10, 27, 40, 0.97), rgba(4, 12, 20, 0.97) 56%, rgba(2, 7, 13, 0.98))"].join(", "),
  boxShadow: `0 20px 46px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(1, 5, 10, 0.7), 0 0 36px rgba(64, 190, 230, 0.09), inset 0 1px 0 rgba(200, 248, 255, 0.15), inset 1px 0 0 rgba(200, 248, 255, 0.05), inset 0 0 0 1px rgba(170, 235, 255, 0.035), inset 0 0 30px ${azure(0.05)}`,
  backdropFilter: "blur(10px)",
  isolation: "isolate",
  color: INK
};
const panelKicker = (tone: string = azure(0.95)): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: "10px", fontFamily: MONO, fontSize: "11px", fontWeight: 600, letterSpacing: "2.2px", textTransform: "uppercase", color: "rgba(196, 232, 250, 0.92)", margin: 0, "--sx-kicker": tone } as React.CSSProperties);
const panelMeta: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", letterSpacing: "0.5px", lineHeight: 1.65, color: "rgba(160, 186, 204, 0.82)", wordBreak: "break-word" };
const panelField: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", lineHeight: 1.55, color: "rgba(168, 200, 218, 0.86)", display: "flex", flexDirection: "column", gap: "7px" };
const panelStatement = (rule: string): React.CSSProperties => ({ fontFamily: SANS, fontSize: "13px", lineHeight: 1.66, color: "rgba(226, 238, 246, 0.86)", margin: 0, padding: "2px 0 2px 12px", borderLeft: `1.5px solid ${rule}` });
/** The boundary's external resonance halo: a diffuse cyan seam that begins right at the frame and radiates a few pixels into the
 * dark — three soft layers on the body's own box-shadow (the body scrolls, so a child or pseudo aura would be clipped by its overflow;
 * its own shadow is not, and it follows the rounded corners). The halo breathes between "low" and "high" (sxBoundaryHalo, 28 s, LIVE
 * only): brighter and a little wider, then back. REDUCED and the server render keep the calm "mid" aura, still. The rest of the stack
 * (depth, outline, field glow, inner light) is identical in every state, so only the halo moves. */
const BOUNDARY_HALO = {
  low: "0 0 6px 0 rgba(56, 229, 255, 0.2), 0 0 18px 2px rgba(56, 229, 255, 0.09), 0 0 38px 4px rgba(56, 229, 255, 0.045)",
  mid: "0 0 8px 1px rgba(56, 229, 255, 0.32), 0 0 22px 3px rgba(56, 229, 255, 0.14), 0 0 46px 7px rgba(56, 229, 255, 0.07)",
  high: "0 0 10px 1px rgba(56, 229, 255, 0.46), 0 0 28px 5px rgba(56, 229, 255, 0.2), 0 0 58px 11px rgba(56, 229, 255, 0.1)"
} as const;
const boundaryShadow = (state: keyof typeof BOUNDARY_HALO): string => `${BOUNDARY_HALO[state]}, 0 30px 80px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(1, 5, 10, 0.7), 0 0 0 6px rgba(92, 200, 255, 0.035), 0 0 70px rgba(56, 190, 240, 0.14), 0 0 140px rgba(56, 190, 240, 0.06), inset 0 1px 0 rgba(210, 248, 255, 0.18), inset 0 0 0 1px rgba(170, 235, 255, 0.04), inset 0 0 48px ${azure(0.07)}`;
/** The boundary as a governance body: deep glass with a cool field light, a fine membrane and a calm outer aura (no amber glow;
 * amber stays a meaning accent on the limits). The membrane is a light gradient carried in the 1px border (a border-box layer under
 * the padding-box glass), brightest at the upper rim; inside the glass a still diagonal sheen. All static: the body's only motion
 * stays the panel aura and the edge current. */
const BOUNDARY_BODY: React.CSSProperties = {
  padding: "13px 24px 24px",
  borderRadius: "22px",
  border: "1px solid transparent",
  background: [...PANEL_TICKS.map(tick => tick.replace(/6px/g, "9px")).map(tick => `${tick.replace(/ no-repeat$/, "")} padding-box no-repeat`), "linear-gradient(112deg, transparent 18%, rgba(176, 236, 255, 0.032) 34%, transparent 46%, transparent 62%, rgba(176, 236, 255, 0.022) 74%, transparent 84%) padding-box", "radial-gradient(90% 55% at 50% -8%, rgba(92, 200, 255, 0.14), transparent 62%) padding-box", "radial-gradient(70% 50% at 50% 110%, rgba(84, 232, 236, 0.07), transparent 60%) padding-box", "linear-gradient(172deg, rgba(10, 26, 40, 0.96), rgba(4, 11, 20, 0.97) 55%, rgba(2, 7, 13, 0.98)) padding-box", "linear-gradient(180deg, rgba(160, 246, 255, 0.72), rgba(56, 229, 255, 0.36) 18%, rgba(56, 229, 255, 0.2) 52%, rgba(56, 229, 255, 0.3) 86%, rgba(130, 236, 255, 0.5)) border-box"].join(", "),
  boxShadow: boundaryShadow("mid")
};
/** One layer of the boundary: a quiet glass unit in the shared field light — an azure accent line and light rim at the top, a
 * membrane border brightest above, a faint inner shimmer from the upper corner. Every layer the same light grammar; meaning colours
 * stay on the chips. Static. */
const boundaryLayer = (accent: string): React.CSSProperties => ({ ...stack(10), position: "relative", padding: "18px 16px 16px", borderRadius: "14px", border: "1px solid transparent", borderImage: "none", background: ["radial-gradient(70% 55% at 0% 0%, rgba(92, 200, 255, 0.075), transparent 62%) padding-box", "linear-gradient(118deg, transparent 40%, rgba(176, 236, 255, 0.024) 52%, transparent 64%) padding-box", "linear-gradient(165deg, rgba(16, 38, 56, 0.52), rgba(4, 12, 20, 0.46)) padding-box", "linear-gradient(180deg, rgba(150, 228, 255, 0.3), rgba(120, 200, 240, 0.09) 34%, rgba(120, 200, 240, 0.12)) border-box"].join(", "), boxShadow: "inset 0 1px 0 rgba(210, 250, 255, 0.1), inset 0 0 22px rgba(92, 200, 255, 0.035), 0 10px 24px rgba(0, 0, 0, 0.22), 0 0 20px rgba(56, 190, 240, 0.045)", "--sx-layer": accent } as React.CSSProperties);
/** A boundary chip: light ink on dark glass; the meaning sits in its dot (and, for a limit, in the dashed amber border). */
const boundaryChip = (rgb: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", gap: "6px", fontFamily: MONO, fontSize: "10px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", lineHeight: 1.35, color: "rgba(238, 246, 251, 0.96)", padding: "4px 9px", borderRadius: "999px", border: `1px solid rgba(${rgb}, 0.36)`, background: "linear-gradient(180deg, rgba(255, 255, 255, 0.045), rgba(255, 255, 255, 0.02))", boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.05)", fontVariantNumeric: "tabular-nums", whiteSpace: "normal" });
const chipDot = (rgb: string): React.CSSProperties => ({ display: "inline-block", width: "5px", height: "5px", borderRadius: "50%", flexShrink: 0, background: `rgb(${rgb})`, boxShadow: `0 0 6px rgba(${rgb}, 0.8)` });
/** The heading of a boundary layer: its ordinal ring in the field light, then the layer's name (mono, tracked, lit) and a rule. */
const boundaryHeading = (tone: string): React.CSSProperties => ({ display: "flex", alignItems: "center", gap: "10px", fontFamily: MONO, fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.8px", textTransform: "uppercase", color: "#e6f7fd", textShadow: "0 0 12px rgba(92, 200, 255, 0.3)", "--sx-heading": tone } as React.CSSProperties);
/** A technical line inside a boundary layer (ranking, sweep state, read parameters): quiet mono, tabular figures, clear contrast. */
const boundaryMeta: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", letterSpacing: "0.5px", lineHeight: 1.65, color: "rgba(190, 214, 230, 0.94)", fontVariantNumeric: "tabular-nums", wordBreak: "break-word" };
/** A statement inside a boundary layer (the explanation; a short rule above it parts it from the states): calm sans, generous leading. */
const boundaryStatement = (): React.CSSProperties => ({ position: "relative", fontFamily: SANS, fontSize: "13.5px", lineHeight: 1.62, color: "rgba(234, 243, 249, 0.95)", margin: 0 });
const chip = (rgb: string): React.CSSProperties => ({ display: "inline-flex", alignItems: "center", fontFamily: MONO, fontSize: "10px", fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", lineHeight: 1.35, color: `rgb(${rgb})`, padding: "4px 9px", borderRadius: "6px", border: `1px solid rgba(${rgb}, 0.42)`, background: `linear-gradient(180deg, rgba(${rgb}, 0.12), rgba(${rgb}, 0.05))`, boxShadow: `0 0 12px rgba(${rgb}, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.05)`, whiteSpace: "normal" });
const AMBER_RGB = "245, 166, 35";
const GREEN_RGB = "63, 185, 80";
const CYAN_RGB = "56, 229, 255";
const panelInput: React.CSSProperties = { width: "100%", boxSizing: "border-box", background: "rgba(2, 9, 16, 0.72)", border: `1px solid ${azure(0.22)}`, borderRadius: "7px", color: INK, fontFamily: MONO, fontSize: "12px", letterSpacing: "0.4px", textTransform: "none", padding: "8px 10px", outline: "none", boxShadow: "inset 0 1px 6px rgba(0, 0, 0, 0.45)", transition: "border-color .3s ease, box-shadow .3s ease" };
const panelAction = (enabled: boolean): React.CSSProperties => ({ ...action("cyan", enabled), fontSize: "11px", letterSpacing: "1.8px", padding: "8px 14px", borderRadius: "8px", border: `1px solid ${enabled ? "rgba(56, 229, 255, 0.55)" : "rgba(99, 120, 138, 0.3)"}`, background: enabled ? "linear-gradient(180deg, rgba(56, 229, 255, 0.16), rgba(56, 229, 255, 0.05))" : "rgba(99, 120, 138, 0.05)", boxShadow: enabled ? "0 0 16px rgba(56, 229, 255, 0.14), inset 0 1px 0 rgba(220, 250, 255, 0.16)" : "none" });
/** An edge action of the orientation surface: a quiet chip; lit while its panel is open. */
const orientAction = (open: boolean): React.CSSProperties => ({ ...ghost, fontSize: "10px", letterSpacing: "0.9px", padding: "4px 10px", borderRadius: "999px", border: `1px solid ${open ? "rgba(56, 229, 255, 0.55)" : azure(0.24)}`, background: open ? "rgba(56, 229, 255, 0.1)" : "rgba(4, 14, 24, 0.5)", color: open ? "#dffaff" : "rgba(170, 212, 232, 0.86)", boxShadow: open ? "0 0 12px rgba(56, 229, 255, 0.16)" : "none" });
/** The panel's node: the point where it attaches to the field, with a hairline fading towards the field. Decoration only. */
function PanelNode({ side, top }: { side: "left" | "right"; top: string }) {
  return (
    <span data-sx-panel-node={side} aria-hidden="true" style={{ position: "absolute", top, [side]: "-1px", width: 0, height: 0, pointerEvents: "none" }}>
      <span style={{ position: "absolute", top: "-0.5px", [side === "left" ? "right" : "left"]: "0px", width: "46px", height: "1px", background: `linear-gradient(${side === "left" ? "270deg" : "90deg"}, ${azure(0.55)}, transparent)` }} />
      <span data-sx-panel-lamp style={{ position: "absolute", top: "-3px", left: "-3px", width: "6px", height: "6px", borderRadius: "50%", background: "#bff4ff", boxShadow: `0 0 8px ${azure(0.9)}, 0 0 16px ${azure(0.45)}` }} />
    </span>
  );
}
const percent = (value: number): string => `${Math.round(value * 1000) / 10}%`;
const visuallyHidden: React.CSSProperties = { position: "absolute", width: "1px", height: "1px", margin: "-1px", padding: 0, overflow: "hidden", clip: "rect(0 0 0 0)", whiteSpace: "nowrap", border: 0 };
/** HUD typography of the planetarium (OrbitalResonanceBubble): title row, primary metric, section label, item list, hint. */
const hudTitle: React.CSSProperties = { fontSize: "12px", color: CYAN, textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: 700, borderBottom: "1px solid rgba(56, 229, 255, 0.35)", paddingBottom: "6px", marginBottom: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px" };
const hudMetric: React.CSSProperties = { fontSize: "18px", fontWeight: 700, color: INK, marginBottom: "10px", letterSpacing: "0.5px" };
const hudSection: React.CSSProperties = { fontSize: "10.5px", color: MUTED, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "4px", fontWeight: 700 };
const hudHint: React.CSSProperties = { fontSize: "10.5px", color: "rgba(56, 229, 255, 0.65)", borderTop: "1px solid rgba(56, 229, 255, 0.15)", paddingTop: "6px", letterSpacing: "0.5px" };
const pill: React.CSSProperties = { fontSize: "11.5px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${CYAN}`, color: CYAN };

/** Readable labels: wrap at word boundaries, never truncate as the primary display (spec §9.3). */
export { wrapLines };

/**
 * Motion of the field: the Capability Field's own (planetarium float, moons, core plasma, ray photons, cosmos satellites on
 * the shared rAF clock, deep-focus settle, HUD float), LIVE only. REDUCED is total: no CSS animation, no photon, the rAF clock
 * never starts, every sign in its place. The ruling that binds the names is GELB's (R15 / R15a, proposal R15b).
 */
export const SYNTX_AMBIENT_MOTION = true;
/** Resonance halo grammar, phase 1 prototype (owner mandate "SFE::SYNTX RESONANCE HALO"): the first organization body and the
 * orientation surface carry an external cyan seam whose presence follows their real UI state — inactive, active (hovered, observed or
 * keyboard-focused) and retreated (another body holds the focus, the body lies behind the observed level, or the boundary is open).
 * State changes are finite transitions (.9 s, the body's own light transition). Breathing of the ACTIVE seam is a separate prototype that
 * needs GELB's approval (R15b): off unless the lab sets NEXT_PUBLIC_SYNTX_RESONANCE_BREATH=1. */
export const SYNTX_RESONANCE_BREATH_PROTOTYPE = process.env.NEXT_PUBLIC_SYNTX_RESONANCE_BREATH === "1";
/** Infinite animations of the Job Field in LIVE mode (closed list; the planetarium's and the field's own; everything else is finite). */
export const SYNTX_AMBIENT_NAMES = Object.freeze(["orbitFloatPhase2", "moonOrbit", "ringPulse", "atmosphereGlow", "hologramFloat", "coreBreathe", "corePulseCommunicate", "plasmaRotateCw", "plasmaRotateCcw", "plasmaFlarePulse", "waveExpand", "particleIn", "rotateClockwise", "focusTransitionPulse", "sxSuspend"]);

export const SYNTX_CSS = `
${SYNTX_RESONANCE_BODY_KEYFRAMES}
${SYNTX_CORE_KEYFRAMES}
${SYNTX_FOCUS_PULSE_KEYFRAMES}
@keyframes rotateClockwise { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
@keyframes sxEnter { from { opacity: 0; } to { opacity: 1; } }
@keyframes sxApertureBreathe { 0%, 100% { opacity: .5; } 50% { opacity: 1; } }
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
/* Panels: the light current on the upper edge, the breathing aura, kicker marker and rule, node lamp; list, input and action states. */
@keyframes sxPanelCurrent { 0% { background-position: -40% 0; } 55%, 100% { background-position: 140% 0; } }
[data-sx-panel]::before { content: ""; position: absolute; left: 14px; right: 14px; top: -1px; height: 1px; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(190, 248, 255, 0.85), transparent) no-repeat; background-size: 30% 1px; opacity: .55; animation: sxPanelCurrent 18s cubic-bezier(.45, 0, .25, 1) infinite; }
[data-sx-panel]::after { content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none; z-index: -1; box-shadow: 0 0 40px rgba(92, 200, 255, 0.13), 0 0 14px rgba(92, 200, 255, 0.08), 0 0 2px rgba(150, 230, 255, 0.3); animation: atmosphereGlow 16s ease-in-out infinite; }
[data-sx-panel="boundary"]::after { box-shadow: 0 0 64px rgba(56, 229, 255, 0.2), 0 0 22px rgba(56, 229, 255, 0.12), 0 0 1.5px rgba(176, 244, 255, 0.6), inset 0 0 46px rgba(56, 229, 255, 0.11), inset 0 0 0 1px rgba(56, 229, 255, 0.08); animation-duration: 32s; }
/* The boundary's field presence: a cyan shimmer in the glass behind the four layers (seen through their glass) and the body's cyan aura
 * breathe together on the panel aura's own name at 32 s — opacity only, visible but below conscious rhythm; none in REDUCED. */
[data-sx-boundary-layers]::before { content: ""; position: absolute; inset: -16px -14px -14px; z-index: -1; pointer-events: none; border-radius: 18px; background: radial-gradient(58% 64% at 26% 22%, rgba(56, 229, 255, 0.21), transparent 72%), radial-gradient(52% 60% at 78% 82%, rgba(92, 200, 255, 0.16), transparent 72%), radial-gradient(44% 44% at 52% 50%, rgba(84, 232, 236, 0.1), transparent 70%); animation: atmosphereGlow 32s ease-in-out infinite; }
[data-sx-boundary-orientation]::before { content: ""; display: inline-block; width: 10px; height: 1px; margin-right: 8px; vertical-align: 3px; background: rgba(56, 229, 255, 0.55); box-shadow: 0 0 6px rgba(56, 229, 255, 0.6); }
[data-sx-panel-node] [data-sx-panel-lamp] { animation: atmosphereGlow 10s ease-in-out infinite; }
[data-sx-kicker]::before { content: ""; width: 6px; height: 6px; transform: rotate(45deg); flex-shrink: 0; border: 1px solid var(--sx-kicker); box-shadow: 0 0 8px var(--sx-kicker); }
[data-sx-kicker]::after { content: ""; flex: 1; height: 1px; min-width: 0; background: linear-gradient(90deg, rgba(92, 200, 255, 0.4), transparent); }
[data-sx-panel] [data-sx-section] + [data-sx-section] { padding-top: 12px; border-top: 1px solid transparent; border-image: linear-gradient(90deg, rgba(92, 200, 255, 0.24), rgba(92, 200, 255, 0.04)) 1; }
/* Pools: one conduction line (the panel's spine) carries every upload as a node; the selected upload is the lit node and the lit row. */
[data-sx-panel="pools"] ul { position: relative; }
[data-sx-panel="pools"] ul::before { content: ""; position: absolute; left: 9px; top: 14px; bottom: 14px; width: 1px; pointer-events: none; background: linear-gradient(180deg, rgba(92, 200, 255, 0.05), rgba(92, 200, 255, 0.34) 18%, rgba(92, 200, 255, 0.34) 82%, rgba(92, 200, 255, 0.05)); }
[data-sx-panel="pools"] li { transition: background-color .35s ease, border-color .35s ease, box-shadow .35s ease; }
[data-sx-panel="pools"] li::before { content: ""; position: absolute; left: 6px; top: 17px; width: 7px; height: 7px; box-sizing: border-box; border-radius: 50%; border: 1px solid rgba(92, 200, 255, 0.55); background: #04101a; pointer-events: none; transition: background-color .35s ease, box-shadow .35s ease; }
[data-sx-panel="pools"] li[data-selected="true"]::before { border-color: #9ff3ff; background: #38e5ff; box-shadow: 0 0 8px rgba(56, 229, 255, 0.95), 0 0 16px rgba(56, 229, 255, 0.4); animation: atmosphereGlow 7s ease-in-out infinite; }
[data-sx-panel="pools"] li[data-selected="false"]:hover { background-color: rgba(92, 200, 255, 0.045); }
[data-sx-panel="pools"] li[data-selected="false"]:hover::before { border-color: rgba(150, 230, 255, 0.9); box-shadow: 0 0 6px rgba(92, 200, 255, 0.6); }
[data-sx-panel="pools"] li:focus-within { border-color: rgba(56, 229, 255, 0.4); box-shadow: 0 0 16px rgba(56, 229, 255, 0.1); }
[data-sx-panel="pools"] button[aria-pressed="false"]:hover { border-color: rgba(56, 229, 255, 0.7); background: rgba(56, 229, 255, 0.1); color: #e8fbff; }
/* Meta dock (Job Field context): HOW THIS WORKS, SYSTEM CODEX and SEMANTIC GUIDE as one long, quiet segmented bar in the header
 * row — a secondary system layer, free of the intake panel. Position and skin only; the buttons, their handlers and their order stay. */
[data-sx-shell="controls"] { top: 13px !important; right: 186px !important; gap: 0 !important; filter: drop-shadow(0 0 14px rgba(56, 229, 255, 0.06)); }
[data-sx-shell="controls"] > button, [data-testid="semantic-guide-drawer-toggle"] { box-sizing: border-box !important; height: 34px !important; display: inline-flex !important; align-items: center; justify-content: center; line-height: 1 !important; padding: 0 16px !important; font-size: 11px !important; font-weight: 600 !important; letter-spacing: 0.6px !important; color: rgba(186, 228, 244, 0.88) !important; background: linear-gradient(180deg, rgba(10, 26, 40, 0.92), rgba(4, 12, 22, 0.94)) !important; border: 1px solid rgba(92, 200, 255, 0.26) !important; border-radius: 0 !important; box-shadow: inset 0 1px 0 rgba(200, 248, 255, 0.1), 0 0 18px rgba(56, 229, 255, 0.05) !important; transition: color .3s ease, background-color .3s ease, border-color .3s ease !important; }
[data-sx-shell="controls"] > [data-testid="how-this-works-btn"] { min-width: 158px; border-radius: 999px 0 0 999px !important; padding-left: 20px !important; }
[data-sx-shell="controls"] > [data-testid="open-system-codex-btn"] { min-width: 200px; border-left-color: rgba(92, 200, 255, 0.12) !important; }
[data-testid="semantic-guide-drawer-toggle"][data-testid] { top: 13px !important; right: 24px !important; width: 162px; border-left-color: rgba(92, 200, 255, 0.12) !important; border-radius: 0 999px 999px 0 !important; padding-right: 20px !important; }
[data-sx-shell="controls"] > button:hover, [data-testid="semantic-guide-drawer-toggle"]:hover { color: #ecfbff !important; background: linear-gradient(180deg, rgba(20, 52, 72, 0.94), rgba(8, 22, 36, 0.95)) !important; }
[data-sx-shell="controls"] > button:focus-visible, [data-testid="semantic-guide-drawer-toggle"]:focus-visible { outline: 1px solid rgba(56, 229, 255, 0.8); outline-offset: 2px; }
/* Boundary: statements that bound (NOT …, authority NONE) as dashed chips — a limit, not a state; affirmative states stay solid. */
[data-sx-boundary-limit] { border-style: dashed !important; box-shadow: 0 0 10px rgba(245, 166, 35, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.04) !important; }
[data-sx-boundary-heading] > span:first-child { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; flex-shrink: 0; box-sizing: border-box; border-radius: 50%; border: 1px solid var(--sx-heading); color: #d4f2ff; font-size: 9px; letter-spacing: 0; text-shadow: none; background: radial-gradient(circle at 50% 35%, rgba(92, 200, 255, 0.16), transparent 70%); box-shadow: 0 0 10px -2px var(--sx-heading), inset 0 0 6px -2px var(--sx-heading); }
[data-sx-boundary-heading]::after { content: ""; flex: 1; min-width: 0; height: 1px; background: linear-gradient(90deg, rgba(92, 200, 255, 0.3), rgba(92, 200, 255, 0.06) 70%, transparent); }
[data-sx-boundary-layers] > [data-sx-section]::before { content: ""; position: absolute; left: 16px; top: -1px; width: 34px; height: 2px; border-radius: 2px; background: var(--sx-layer); box-shadow: 0 0 10px var(--sx-layer); }
[data-sx-boundary-layers] > [data-sx-section]::after { content: ""; position: absolute; left: 56px; right: 18px; top: -1px; height: 1px; pointer-events: none; background: linear-gradient(90deg, rgba(196, 246, 255, 0.34), rgba(196, 246, 255, 0.1) 46%, transparent); }
[data-sx-boundary-statement]::before { content: ""; position: absolute; left: 0; top: -6px; width: 22px; height: 1px; background: rgba(92, 200, 255, 0.4); }
@keyframes sxBoundaryOpen { from { opacity: 0; transform: scale(0.97); } to { opacity: 1; transform: scale(1); } }
@keyframes sxBoundaryHalo { 0%, 100% { box-shadow: ${boundaryShadow("low")}; } 50% { box-shadow: ${boundaryShadow("high")}; } }
/* Resonance halo grammar (prototype): an external cyan seam right outside the contour, its presence set by the carrier's state. The
 * organization's seam rides inside the floating body ([data-sx-halo], outer box-shadow only); the orientation surface's seam is its
 * ::after (outer box-shadow only, behind nothing it covers). Weaker than the boundary's halo; nothing inside the contour changes. */
[data-sx-halo] { position: absolute; inset: -1.5px; border-radius: 50%; pointer-events: none; box-shadow: 0 0 4px 0 rgba(56, 229, 255, 0.22), 0 0 12px 1px rgba(56, 229, 255, 0.08); transition: box-shadow .9s cubic-bezier(0.16, 1, 0.3, 1), opacity .9s cubic-bezier(0.16, 1, 0.3, 1); }
[data-sx-resonance="active"] [data-sx-halo], [data-sx-resonance]:focus-visible [data-sx-halo] { box-shadow: 0 0 6px 1px rgba(56, 229, 255, 0.46), 0 0 18px 3px rgba(56, 229, 255, 0.17); }
[data-sx-resonance="retreated"] [data-sx-halo] { box-shadow: 0 0 4px 0 rgba(56, 229, 255, 0.07), 0 0 10px 0 rgba(56, 229, 255, 0.025); }
[data-sx-orient]::after { content: ""; position: absolute; inset: -1px; border-radius: inherit; pointer-events: none; z-index: -1; box-shadow: 0 0 5px 0 rgba(56, 229, 255, 0.15), 0 0 16px 1px rgba(56, 229, 255, 0.055); transition: box-shadow .9s cubic-bezier(0.16, 1, 0.3, 1), opacity .9s cubic-bezier(0.16, 1, 0.3, 1); }
[data-sx-orient]:hover::after, [data-sx-orient]:has(:focus-visible)::after { box-shadow: 0 0 7px 1px rgba(56, 229, 255, 0.3), 0 0 22px 3px rgba(56, 229, 255, 0.11); }
[data-sx-orient][data-sx-resonance="retreated"]:not(:hover):not(:has(:focus-visible))::after { box-shadow: 0 0 4px 0 rgba(56, 229, 255, 0.05), 0 0 12px 0 rgba(56, 229, 255, 0.02); }
/* Very low viewports (browser zoom ≥ 200 % on 1080 p): the orientation surface scrolls instead of pushing its edge actions out of view
 * (typography sweep 2026-10-20). Its outer halo is clipped there; at every other height nothing changes. */
@media (max-height: 600px) { [data-sx-orient] { max-height: calc(100vh - 100px); overflow-y: auto; } }
/* Breathing prototype (R15b approval required; off by default): only the ACTIVE seam breathes, on the existing name atmosphereGlow
 * (opacity .5 ↔ .9) at 24 s; none in REDUCED. */
[data-sx-resonance-breath] [data-sx-resonance="active"] [data-sx-halo], [data-sx-resonance-breath] [data-sx-resonance]:focus-visible [data-sx-halo], [data-sx-resonance-breath] [data-sx-orient]:hover::after, [data-sx-resonance-breath] [data-sx-orient]:has(:focus-visible)::after { animation: atmosphereGlow 24s ease-in-out infinite; }
/* Orientation surface (top left): field actions as chips; hover and focus light; one finite light pass on every context change. */
@keyframes sxOrientPass { from { transform: translateX(-120%); opacity: 0; } 20% { opacity: 1; } to { transform: translateX(260%); opacity: 0; } }
[data-sx-orient] [data-sx-orient-action] { transition: border-color .3s ease, background-color .3s ease, color .3s ease, box-shadow .3s ease; }
[data-sx-orient] [data-sx-orient-action]:hover { border-color: rgba(56, 229, 255, 0.6); color: #e8fbff; background-color: rgba(56, 229, 255, 0.08); }
[data-sx-orient] [data-sx-orient-action][aria-expanded="true"]:hover { background-color: rgba(56, 229, 255, 0.16); }
[data-sx-orient] [data-sx-orient-step]:not(:disabled):hover { color: #e6f4fa; }
/* Role cards: a calm light reaction on approach (border and glow only; the card holds its place on the orbit). */
[data-sx-role-card] { transition: border-color .4s ease, box-shadow .4s ease; }
[data-sx-role-card]:hover { border-color: rgba(120, 224, 255, 0.7) !important; box-shadow: 0 0 0 1px rgba(1, 5, 10, 0.6), 0 0 28px rgba(56, 200, 240, 0.24), 0 0 64px rgba(56, 160, 230, 0.08), 0 10px 22px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(200, 245, 255, 0.2), inset 0 0 22px rgba(92, 200, 255, 0.07) !important; }
[data-sx-panel="intake"] input:not([type="file"]):focus { border-color: rgba(56, 229, 255, 0.6); box-shadow: inset 0 1px 6px rgba(0, 0, 0, 0.45), 0 0 14px rgba(56, 229, 255, 0.14); }
[data-sx-panel="intake"] input[type="file"]::file-selector-button { margin-right: 12px; padding: 6px 12px; border-radius: 6px; border: 1px solid rgba(56, 229, 255, 0.5); background: linear-gradient(180deg, rgba(56, 229, 255, 0.14), rgba(56, 229, 255, 0.04)); color: #c9f6ff; font-family: inherit; font-size: 10.5px; font-weight: 600; letter-spacing: 1.4px; text-transform: uppercase; cursor: pointer; }
[data-sx-panel="intake"] input[type="file"]::file-selector-button:hover { border-color: rgba(56, 229, 255, 0.8); background: rgba(56, 229, 255, 0.16); }
/* NO_POOL giant breath (owner mandate 2026-10-13; new motion kind, R15b approval by GELB required): one slow, heavy field breath of
 * 10 s — a longer swell (0 → 46 %), a short hold, a softer release; opacity and transform only. Aura and seam swell, the outer
 * membrane widens a few pixels, the red inner rings follow minimally and a little later. The information, the cyan ring and the
 * cyan joints stay still. LIVE only; REDUCED keeps the static base (none). */
@keyframes sxGiantBreath { 0%, 100% { opacity: 0.3; transform: scale(1); animation-timing-function: cubic-bezier(0.45, 0, 0.35, 1); } 46% { opacity: 1; transform: scale(1.05); } 58% { opacity: 0.94; transform: scale(1.046); animation-timing-function: cubic-bezier(0.5, 0, 0.6, 1); } }
@keyframes sxGiantSeam { 0%, 100% { opacity: 0.18; animation-timing-function: cubic-bezier(0.45, 0, 0.35, 1); } 46% { opacity: 1; } 58% { opacity: 0.9; animation-timing-function: cubic-bezier(0.5, 0, 0.6, 1); } }
@keyframes sxGiantMembrane { 0%, 100% { transform: scale(1); animation-timing-function: cubic-bezier(0.45, 0, 0.35, 1); } 46% { transform: scale(1.024); } 58% { transform: scale(1.022); animation-timing-function: cubic-bezier(0.5, 0, 0.6, 1); } }
@keyframes sxGiantRing { 0%, 100% { opacity: 0.72; transform: scale(1); animation-timing-function: cubic-bezier(0.45, 0, 0.35, 1); } 46% { opacity: 1; transform: scale(1.012); } 58% { opacity: 0.96; transform: scale(1.011); animation-timing-function: cubic-bezier(0.5, 0, 0.6, 1); } }
[data-testid="syntx-field"][data-motion-mode="LIVE"] [data-sx-giant-aura] { animation: sxGiantBreath 10s infinite; }
[data-testid="syntx-field"][data-motion-mode="LIVE"] [data-sx-giant-seam] { animation: sxGiantSeam 10s infinite; }
[data-testid="syntx-field"][data-motion-mode="LIVE"] [data-sx-giant-membrane] { animation: sxGiantMembrane 10s infinite; }
[data-testid="syntx-field"][data-motion-mode="LIVE"] [data-sx-giant-ring] { animation: sxGiantRing 10s 0.35s infinite backwards; }
/* NO ANALYSIS nerve signal (owner "DEMO UI FIX + SEMIONTIC REFINEMENT", 2026-10-15; new motion kind, R15b approval by GELB
 * required): the amber indicator fires (a short rise, a long organic decay, a rest) and the signal reaches the chip's outer aura a
 * moment later, as along a nerve. 4.8 s; opacity and transform only, on two decorative layers (the indicator scales about its centre
 * inside a fixed 14 px ring); the message, its text and the chip's box stay still. Bound to the state: it ends with NO ANALYSIS.
 * LIVE only; REDUCED keeps the static base (none). */
@keyframes sxSignalCore { 0%, 100% { opacity: 0.6; transform: scale(1); animation-timing-function: cubic-bezier(0.3, 0, 0.2, 1); } 12% { opacity: 1; transform: scale(1.32); animation-timing-function: cubic-bezier(0.33, 0, 0.25, 1); } 58% { opacity: 0.6; transform: scale(1); } }
@keyframes sxSignalAura { 0%, 100% { opacity: 0.38; animation-timing-function: cubic-bezier(0.3, 0, 0.2, 1); } 18% { opacity: 1; animation-timing-function: cubic-bezier(0.33, 0, 0.25, 1); } 70% { opacity: 0.38; } }
[data-testid="syntx-field"][data-motion-mode="LIVE"] [data-sx-signal="awaiting-analysis"] [data-sx-signal-core] { animation: sxSignalCore 4.8s infinite; }
[data-testid="syntx-field"][data-motion-mode="LIVE"] [data-sx-signal="awaiting-analysis"] [data-sx-signal-aura] { animation: sxSignalAura 4.8s 0.24s infinite backwards; }
@media (prefers-reduced-motion: reduce) {
  [data-testid="syntx-field"], [data-testid="syntx-field"] * { animation: none !important; transition: none !important; }
  [data-testid="syntx-field"] *::before, [data-testid="syntx-field"] *::after { animation: none !important; transition: none !important; }
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

/** NO ANALYSIS in two voices (owner "SEMIONTIC REFINEMENT", 2026-10-15): the status word and the instruction of one copy; the
 *  separator stays for the reader (visually hidden), so the text is the copy unchanged. */
function MessageVoices({ copy }: { copy: string }) {
  const cut = copy.indexOf(": ");
  const head = cut < 0 ? copy : copy.slice(0, cut);
  const body = cut < 0 ? "" : copy.slice(cut + 2);
  return (
    <>
      <span style={{ fontFamily: MONO, fontSize: "11.5px", fontWeight: 700, lineHeight: 1.3, letterSpacing: "1.8px", color: "#ffbf5c", textShadow: `0 0 10px rgba(${AMBER_RGB}, 0.35)` }}>{head}</span>
      {body !== "" && <><span style={visuallyHidden}>: </span><span style={{ fontFamily: SANS, fontSize: "12.5px", fontWeight: 500, lineHeight: 1.45, letterSpacing: "0.15px", color: "rgba(255, 232, 200, 0.95)", wordBreak: "break-word" }}>{body}</span></>}
    </>
  );
}

/** Modal layers of the shell that sit above the Job Field while they are mounted (each renders only while open). */
const MODAL_LAYERS = '[data-testid="guided-onboarding-overlay"], [data-testid="system-codex-modal-backdrop"], [aria-modal="true"]';

/** The bottom edge of an element in its offset parent; 0 until measured (server render, no ResizeObserver). */
function useOffsetBottom(ref: React.RefObject<HTMLElement | null>): number {
  const [bottom, setBottom] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => setBottom(element.offsetTop + element.offsetHeight));
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return bottom;
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
        <SyntxPlanetariumBackdrop center={center} radius={radius} gradientId="syntxFieldGlow" glowOpacity={focusedId ? "0.32" : "0.22"} tone={JOB_PLANETARIUM_TONE} />
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
              stroke={active ? CYAN : azure(0.3)}
              strokeWidth={active ? "2.5" : "1.2"}
              dash={active ? undefined : "3 3"}
              photons={mode === "LIVE" ? {
                out: { r: active ? "3" : "1.8", fill: active ? "#ffffff" : CYAN, opacity: active ? 1 : 0.65, dur: active ? "1.6s" : PHOTON_OUT[index % 6] },
                in: { r: active ? "3" : "1.8", fill: active ? "#38e5ff" : "#8eefff", opacity: active ? 0.95 : 0.6, dur: active ? "2.1s" : PHOTON_IN[index % 6] }
              } : null}
              bead={{ r: active ? "4" : "2", fill: active ? CYAN : azure(0.62) }}
            />
          );
        })}
      </svg>

      <div
        data-sx-pool-core
        style={{ position: "absolute", left: "50%", top: "50%", zIndex: 10, pointerEvents: "none", opacity: anchored ? 0.12 : hoveredHere ? 0.35 : 1, transform: `translate(-50%, -50%) scale(${anchored ? 0.62 : hoveredHere ? 0.85 : 1})`, filter: anchored ? "blur(3px) grayscale(92%)" : hoveredHere ? "grayscale(80%)" : undefined, transition: "all 0.5s ease" }}
      >
        {/* The brand membrane: the logo's teal light gathered under the organism (static; the organism's own breath carries it). */}
        <span data-sx-brand-membrane="dll" aria-hidden="true" style={{ position: "absolute", left: "50%", top: "50%", width: "340px", height: "340px", transform: "translate(-50%, -50%)", borderRadius: "50%", zIndex: -1, pointerEvents: "none", background: `radial-gradient(circle, ${DLL_TEAL(0.12)} 0%, ${DLL_TEAL(0.05)} 38%, transparent 66%)` }} />
        <SyntxCoreOrganism keyframes={false} testId="syntx-pool-core" highlighted={hoveredHere !== null} communicating={hoveredHere !== null} outerRingLit={false}>
          <div style={{ textAlign: "center", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", maxWidth: "176px" }}>
            <DecisionLoopLabsCoreEmblem idPrefix="sx-pool-dll" />
            <div style={{ fontSize: "11px", color: CYAN, letterSpacing: "2px", fontWeight: 700, textTransform: "uppercase" }}>{tm.pool}</div>
            <div style={{ marginTop: "3px", fontSize: "10.5px", color: INK, letterSpacing: "0.6px", fontWeight: 700, textTransform: "uppercase", lineHeight: 1.25 }}>{wrapLines(field.pool.poolName, 18, 2).join(" ")}</div>
            <div style={{ marginTop: "6px", fontSize: "11px", color: INK, padding: "3px 10px", borderRadius: "12px", backgroundColor: "rgba(56, 229, 255, 0.12)", border: `1px solid ${CYAN}`, letterSpacing: "0.5px" }}>⬡ {field.organizations.length} {t.organizations}</div>
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

/** The organization's resonance body (Job Field material over the planetarium's sphere): a lit sphere — upper light, lower shade — with an
 * azure rim at rest; highlighted, the planetarium's cyan resonance. The light reaction is the body's own transition (colour, rim, glow). */
const organizationBodyMaterial = (highlighted: boolean): React.CSSProperties => highlighted
  ? {
      backgroundColor: "rgba(7, 30, 44, 0.96)",
      backgroundImage: "radial-gradient(circle at 34% 24%, rgba(214, 248, 255, 0.2), transparent 40%), radial-gradient(circle at 50% 56%, rgba(56, 229, 255, 0.16), rgba(56, 229, 255, 0.06) 74%)",
      border: `1.5px solid ${CYAN}`,
      boxShadow: `0 0 48px ${SIL_TOKENS.colors.cyanGlowStrong}, 0 0 22px rgba(56, 229, 255, 0.72), inset 0 1px 0 rgba(214, 248, 255, 0.28), inset 0 0 26px ${SIL_TOKENS.colors.cyanGlow}, inset 0 -18px 28px rgba(1, 6, 14, 0.42)`,
      transition: "opacity 0.35s ease, box-shadow 0.9s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.9s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.9s cubic-bezier(0.16, 1, 0.3, 1)"
    }
  : {
      backgroundColor: "rgba(5, 12, 23, 0.92)",
      backgroundImage: "radial-gradient(circle at 33% 22%, rgba(168, 226, 255, 0.13), transparent 40%), radial-gradient(circle at 70% 82%, rgba(40, 104, 196, 0.12), transparent 46%), radial-gradient(circle at 50% 54%, rgba(14, 36, 64, 0.6), rgba(2, 6, 14, 0.7) 78%)",
      border: `1.5px solid ${azure(0.4)}`,
      boxShadow: `0 0 34px rgba(36, 112, 196, 0.2), 0 0 0 1px rgba(3, 8, 16, 0.55), inset 0 1px 0 rgba(180, 232, 255, 0.14), inset 0 0 18px ${azure(0.1)}, inset 0 -22px 30px rgba(1, 4, 10, 0.6)`,
      transition: "opacity 0.35s ease, box-shadow 0.9s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.9s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.9s cubic-bezier(0.16, 1, 0.3, 1)"
    };

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
        data-sx-resonance={index === 0 ? (highlighted ? "active" : isBackground || (!anchored && hovered !== null) ? "retreated" : "inactive") : undefined}
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
          <circle cx={122} cy={122} r={PLANETARIUM_BODY.containment} fill="none" stroke={azure(0.09)} strokeWidth={1} strokeDasharray="2 9" />
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
          style={organizationBodyMaterial(highlighted)}
          signature={<span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none", zIndex: 0, WebkitMaskImage: SIGNATURE_CLEARING, maskImage: SIGNATURE_CLEARING, opacity: highlighted ? 0.85 : 0.6, transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }}>{renderSemioticSignature("03", highlighted)}</span>}
          moonCount={isAnchor ? 0 : roles.length}
          renderMoon={(moon, style) => <RoleMoon role={roles[moon]} style={style} />}
          hud={isHovered ? {
            tetherTestId: `syntx-tether-${organization.id}`,
            tetherTarget: presentation.tetherTarget,
            // The tether leaves the body at its rim towards the HUD, so it never runs through the identity text.
            tetherFrom: tetherFromRim(presentation.tetherTarget),
            previewTestId: `syntx-hud-${organization.id}`,
            className: `hologram-hud--large hologram-float quietUniverseDust hud-preview--${presentation.placement}`,
            style: { ...hudPlacement(presentation.placement) },
            children: (
              <>
                <div style={hudTitle}><span>{organization.name}</span><span style={{ fontSize: "10.5px", color: "rgba(56, 229, 255, 0.6)", whiteSpace: "nowrap" }}>{hudCopy.hologram}</span></div>
                <div style={hudMetric}>{roles.length} {t.roles}</div>
                {subtitle.length > 0 && <div style={{ marginBottom: "10px", display: "flex", gap: "6px", flexWrap: "wrap" }}>{[organization.industry, organization.region].filter((part): part is string => part !== null).map(part => <span key={part} style={pill}>{part}</span>)}</div>}
                {roles.length > 0 && (
                  <div style={{ marginBottom: "10px" }}>
                    <div style={hudSection}>{t.roles}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>{roles.slice(0, 4).map(role => <div key={role.id} style={{ fontSize: "12px", color: INK, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>• {role.title} · {role.requirementCount} {t.requirements}</div>)}</div>
                  </div>
                )}
                <div style={hudHint}>{t.manifest.focusOrganization}</div>
              </>
            )
          } : null}
        >
          {/* The body's atmosphere: a halo beyond its rim that breathes slowly (the planetarium's atmosphereGlow, 11 s), the rim light of
              its upper edge and the shade of its lower edge, and the inner light that rises when the body resonates (hover, focus). */}
          <span aria-hidden="true" style={{ position: "absolute", inset: "-52px", borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle closest-side, transparent 64%, rgba(40, 112, 204, 0.06) 78%, rgba(40, 112, 204, 0.02) 90%, transparent 100%)" }} />
          <span data-sx-aura aria-hidden="true" style={{ position: "absolute", inset: "-30px", borderRadius: "50%", pointerEvents: "none", background: `radial-gradient(circle, transparent 55%, ${azure(0.12)} 62%, rgba(36, 100, 188, 0.05) 71%, transparent 79%)`, animation: "atmosphereGlow 11s ease-in-out infinite", animationDelay: `${-1.7 * index}s` }} />
          {/* Resonance halo prototype (first organization only): the external seam, outside the rim; nothing inside changes. */}
          {index === 0 && <span data-sx-halo aria-hidden="true" />}
          {/* The light membrane: a fine ring just inside the rim, lit from the upper left and falling off around the body (still). */}
          <span aria-hidden="true" style={{ position: "absolute", inset: "4px", borderRadius: "50%", pointerEvents: "none", background: "conic-gradient(from 225deg, rgba(200, 242, 255, 0.62), rgba(92, 200, 255, 0.16) 24%, rgba(92, 200, 255, 0.05) 48%, rgba(46, 120, 214, 0.18) 72%, rgba(200, 242, 255, 0.62))", WebkitMaskImage: "radial-gradient(circle closest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1px), #000 100%, transparent 100%)", maskImage: "radial-gradient(circle closest-side, transparent calc(100% - 1.6px), #000 calc(100% - 1px), #000 100%, transparent 100%)", opacity: highlighted ? 0.95 : 0.7, transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          <span aria-hidden="true" style={{ position: "absolute", inset: "2px", borderRadius: "50%", pointerEvents: "none", boxShadow: "inset 3px 4px 7px -3px rgba(190, 238, 255, 0.34), inset -3px -5px 9px -4px rgba(24, 84, 170, 0.4)" }} />
          <span aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", pointerEvents: "none", background: "radial-gradient(circle at 50% 50%, rgba(56, 229, 255, 0.16), transparent 66%)", opacity: highlighted ? 1 : 0, transition: "opacity 0.9s cubic-bezier(0.16, 1, 0.3, 1)" }} />
          <span style={{ fontSize: "10px", color: highlighted ? CYAN : azure(0.78), fontWeight: 700, letterSpacing: "2px", position: "relative", zIndex: 1, textShadow: READING_HALO, transition: "color 0.6s ease" }}>{String(index + 1).padStart(2, "0")}</span>
          <span style={{ ...readingPlate(highlighted), fontSize: "13px", color: INK, fontWeight: 700, marginTop: "4px", lineHeight: 1.24, position: "relative", zIndex: 1, textTransform: "uppercase", letterSpacing: "0.8px", textShadow: `${READING_HALO}, 0 0 14px ${highlighted ? "rgba(56, 229, 255, 0.5)" : "rgba(92, 200, 255, 0.26)"}` }}>⬡ {organization.name}</span>
          {subtitle.length > 0 && <span style={{ ...readingPlate(highlighted), fontSize: "11px", fontWeight: 500, color: "rgba(214, 234, 244, 0.94)", marginTop: "6px", lineHeight: 1.3, letterSpacing: "0.3px", position: "relative", zIndex: 1, textShadow: READING_HALO }}>{subtitle}</span>}
          <span style={{ ...readingPlate(highlighted), fontSize: "8.5px", fontWeight: 700, color: highlighted ? "rgba(150, 238, 255, 0.9)" : azure(0.82), marginTop: "6px", position: "relative", zIndex: 1, letterSpacing: "2.4px", textShadow: READING_HALO, transition: "color 0.6s ease" }}>{t.manifest.organization}</span>
          <span style={{ marginTop: "8px", fontSize: "10.5px", fontWeight: 600, letterSpacing: "1.3px", color: highlighted ? CYAN : INK, backgroundColor: highlighted ? "rgba(56, 229, 255, 0.15)" : "rgba(6, 18, 32, 0.92)", padding: "2px 10px", borderRadius: "8px", border: `1px solid ${highlighted ? "rgba(56, 229, 255, 0.4)" : azure(0.28)}`, boxShadow: highlighted ? "0 0 10px rgba(56, 229, 255, 0.18)" : `0 0 8px ${azure(0.08)}, inset 0 1px 0 ${azure(0.12)}`, position: "relative", zIndex: 1 }}>{organization.roleIds.length} {t.roles}</span>
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

/** Vertical clearance of the organization cosmos: the orbit (the same layout, fitted to a box this much smaller above and below) keeps
 * every role card clear of the level's edges, also when a card's text runs longer than the layout's node estimate (up to four title
 * lines, a wrapped count line). The centre and the orbit's form are unchanged. */
const ROLE_CARD_CLEARANCE = 30;

function OrganizationCosmosLayer({ field, mode, t, size, onObserve, organization }: LayerProps & { organization: SyntxOrganization }) {
  const runtimeMs = useOrbitalMotionElapsedMs();
  const elapsedMs = mode === "LIVE" ? runtimeMs : 0;
  const observation = field.observation;
  const roles = useMemo(() => field.roles.filter(role => role.organizationId === organization.id), [field.roles, organization.id]);
  const { layout, compact, compactness } = useMemo(() => syntxCosmosLayout(roles.map(role => ({ id: role.id, title: role.title })), size.width, size.height - 2 * ROLE_CARD_CLEARANCE), [roles, size.width, size.height]);
  const byId = useMemo(() => new Map(roles.map(role => [role.id, role])), [roles]);
  const recededLevel = field.depth >= 2;
  const index = field.organizations.indexOf(organization);
  return (
    <div data-sx-level="organization" data-sx-depth={recededLevel ? "far" : "near"} style={{ position: "absolute", inset: 0, zIndex: 22, overflow: "hidden", background: JOB_COSMOS_BACKDROP, opacity: recededLevel ? 0.3 : 1, filter: recededLevel ? SYNTX_FOCUS.recededFilter : undefined, pointerEvents: recededLevel ? "none" : "auto", transition: "opacity 0.62s ease, filter 0.62s ease" }}>
    <SyntxCosmosShell
      testId="syntx-cosmos-organization"
      attributes={{ "data-organization-id": organization.id, "data-layout": compact ? "compact" : "full", "data-orbit-compactness-x": compactness.x.toFixed(2), "data-orbit-compactness-y": compactness.y.toFixed(2) }}
      style={{ ...levelBox, top: `${LEVEL_INSET.top + ROLE_CARD_CLEARANCE}px`, bottom: `${LEVEL_INSET.bottom + ROLE_CARD_CLEARANCE}px`, overflow: "visible" }}
      styleText=""
      layout={layout}
      elapsedMs={elapsedMs}
      ringAttribute="data-syntx-cosmos-ring"
      orbitStroke={JOB_ORBIT}
      stars={JOB_COSMOS_STARS}
      tether={{ stroke: JOB_TETHER, dash: "2 7" }}
      renderNode={(node, ring) => {
        const role = byId.get(node.id)!;
        const at = syntxCosmosPoint(layout, node, ring, elapsedMs);
        // The card as drawn: on a drawn-in orbit the box it keeps its air for (estimate plus allowance), else the packing's estimate; the
        // compact packings keep their own card form.
        const box = roleCardBox(node, compactness.x < 1 || compactness.y < 1);
        const anchorPoint = cardAnchor(layout.centerX - at.x, layout.centerY - at.y, node.width / 2, (compact ? node.height : box.height) / 2);
        const seniority = roleSeniorityParts(role.seniority);
        // The footer: what the pool states (requirements) and what was read (matching), both lines at one size — the largest up to 8.5 px
        // at which both fit the card's width (less the border and the padding left beside the lines; the matching line less its mark).
        const requirementsText = `${role.requirementCount} ${role.requirementCount === 1 ? t.manifest.requirement : t.requirements}`;
        const matchingText = role.matching === null ? t.manifest.matchingNotRead : t.manifest.matchingRead;
        const footerWidth = node.width - 2 - 2 * ((compact ? 10 : 12) - ROLE_CARD_FOOTER.reach);
        const footerSize = Math.min(monoLineSize(requirementsText, footerWidth, ROLE_CARD_FOOTER.size, 0.6), monoLineSize(matchingText, footerWidth - 11, ROLE_CARD_FOOTER.size, 0.3));
        const footerLine: React.CSSProperties = { flexShrink: 0, maxWidth: `calc(100% + ${2 * ROLE_CARD_FOOTER.reach}px)`, margin: `0 -${ROLE_CARD_FOOTER.reach}px`, fontSize: `${footerSize}px`, lineHeight: 1.2, whiteSpace: "nowrap" };
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
            data-sx-role-card
            data-card-title-lines={compact ? undefined : box.titleLines}
            data-card-box={compact ? "compact" : box.domain ? "orbit" : "packed"}
            style={{ position: "absolute", left: 0, top: 0, width: `${node.width}px`, ...JOB_ROLE_CARD_MATERIAL, ...(compact ? { minHeight: `${node.height}px`, padding: "7px 10px" } : { height: `${box.height}px`, padding: "8px 12px 7px" }), boxSizing: "border-box", overflow: "visible", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: INK, cursor: "pointer", fontFamily: MONO, textAlign: "center", overflowWrap: "anywhere", hyphens: "auto", opacity: anchor ? 0.42 : 1 }}
          >
            <span aria-hidden="true" style={{ position: "absolute", left: "22%", right: "22%", top: "-1px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(190, 244, 255, 0.75), transparent)", pointerEvents: "none" }} />
            {/* The field connection: where the tether from the centre reaches the card, a lamp on the edge and a short conduction stub. */}
            <span data-sx-card-anchor aria-hidden="true" style={{ position: "absolute", left: `${anchorPoint.left.toFixed(2)}%`, top: `${anchorPoint.top.toFixed(2)}%`, width: 0, height: 0, pointerEvents: "none" }}>
              <span style={{ position: "absolute", left: 0, top: "-0.5px", width: "16px", height: "1px", transformOrigin: "0 50%", transform: `rotate(${anchorPoint.angle.toFixed(1)}deg)`, background: `linear-gradient(90deg, ${azure(0.6)}, transparent)` }} />
              <span style={{ position: "absolute", left: "-2.5px", top: "-2.5px", width: "5px", height: "5px", borderRadius: "50%", background: "#c4f5ff", boxShadow: `0 0 6px ${azure(0.95)}, 0 0 12px ${azure(0.4)}` }} />
            </span>
            {/* Identity: the role's standing (the pool's seniority in its parts), framed by two hairlines; the class where none is stated. */}
            <span data-sx-role-standing style={{ display: "flex", flexShrink: 0, alignItems: "center", justifyContent: "center", gap: "6px", maxWidth: "100%", fontSize: "7.5px", fontWeight: 600, letterSpacing: "1.8px", lineHeight: 1.2, color: "rgba(150, 224, 255, 0.88)", textShadow: `0 0 8px ${SIL_TOKENS.colors.cyanGlow}`, whiteSpace: "nowrap" }}>
              <span aria-hidden="true" style={{ width: "12px", minWidth: 0, height: "1px", flexShrink: 100, background: `linear-gradient(90deg, transparent, ${azure(0.55)})` }} />
              <span aria-hidden="true" style={{ width: "4px", height: "4px", flexShrink: 0, transform: "rotate(45deg)", background: CYAN, boxShadow: `0 0 5px ${CYAN}` }} />
              <span title={role.seniority ?? undefined} style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{seniority.length > 0 ? seniority.map(part => part.toUpperCase()).join(" · ") : t.manifest.role}</span>
              <span aria-hidden="true" style={{ width: "12px", minWidth: 0, height: "1px", flexShrink: 100, background: `linear-gradient(90deg, ${azure(0.55)}, transparent)` }} />
            </span>
            <RoleCardTitle title={role.title} lines={compact ? 2 : box.titleLines} size={compact ? 11 : 11.5} width={node.width} />
            {/* The role's domain as the pool states it (one line); nothing where it states none. */}
            {!compact && box.domain && role.domainFocus !== null && <span data-sx-role-domain title={role.domainFocus} style={{ display: "block", flexShrink: 0, maxWidth: "100%", marginTop: "2px", fontFamily: SANS, fontSize: "9.5px", fontWeight: 500, lineHeight: 1.2, letterSpacing: "0.3px", color: "rgba(150, 212, 240, 0.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{role.domainFocus}</span>}
            <span aria-hidden="true" style={{ display: "block", flexShrink: 0, width: "56%", height: "1px", margin: "3px 0 2px", background: `linear-gradient(90deg, transparent, ${azure(0.32)}, transparent)` }} />
            {/* What the pool states of the role (its requirements) and what was read for it (the presentation matching), each on its own line. */}
            <span data-sx-role-requirements style={{ ...footerLine, display: "block", fontWeight: 700, letterSpacing: "0.6px", color: "rgba(226, 242, 250, 0.96)", overflow: "hidden", textOverflow: "ellipsis" }}>{requirementsText}</span>
            <span data-sx-role-matching style={{ ...footerLine, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", fontWeight: 500, letterSpacing: "0.3px", color: "rgba(186, 214, 230, 0.92)" }}><span aria-hidden="true" style={{ display: "block", width: "6px", height: "6px", flexShrink: 0, borderRadius: "50%", border: `1px solid ${azure(role.matching === null ? 0.45 : 0.9)}`, background: role.matching === null ? "transparent" : azure(0.9), boxSizing: "border-box" }} /><span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis" }}>{matchingText}</span></span>
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
          style={{ position: "absolute", left: `${layout.centerX}px`, top: `${layout.centerY}px`, transform: "translate(-50%, -50%)", ...SYNTX_COSMOS_CENTER_MATERIAL, ...JOB_COSMOS_CENTRE_MATERIAL, color: INK, cursor: "pointer", fontFamily: MONO, fontSize: "11px", fontWeight: 700, letterSpacing: "1.4px", lineHeight: 1.4, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "8px", opacity: recededLevel ? 0 : 1 }}
        >
          <span aria-hidden="true" style={{ position: "absolute", inset: "7px", borderRadius: "50%", border: `1px solid ${azure(0.16)}`, pointerEvents: "none" }} />
          <span style={{ display: "block", textShadow: "0 0 12px rgba(56, 229, 255, 0.35)" }}>{String(index + 1).padStart(2, "0")} {organization.name.toUpperCase()}</span>
          <span aria-hidden="true" style={{ width: "44px", height: "1px", background: `linear-gradient(90deg, transparent, ${azure(0.6)}, transparent)` }} />
          <span style={{ color: CYAN, fontSize: "9px", fontWeight: 600, letterSpacing: "1px", lineHeight: 1.55 }}><span style={{ whiteSpace: "nowrap" }}>{t.manifest.organizationCosmos}</span> <span style={{ whiteSpace: "nowrap" }}>// {roles.length} {t.roles}</span></span>
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
    <div data-testid="syntx-ecology" data-role-id={role.id} data-sx-level="role" data-sx-depth={deep ? "far" : "near"} data-card-mode={cardMode} data-rotation={rotation.toFixed(6)} style={{ position: "absolute", inset: 0, zIndex: 24, overflow: "hidden", background: JOB_COSMOS_BACKDROP, opacity: deep ? 0.34 : 1, filter: deep ? SYNTX_FOCUS.recededFilter : undefined, pointerEvents: deep ? "none" : "auto", transition: "opacity 0.62s ease, filter 0.62s ease" }}>
      <div aria-hidden="true" style={JOB_COSMOS_STARS} />
      <div style={levelBox}>
      <svg width={frame.width} height={frame.height} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", pointerEvents: "none" }}>
        {/* Orbits of the cosmos: one per support category present (circles — distance is the category, R14), the source orbit in mint. */}
        {categories.map(support => <circle key={support} data-sx-orbit={support} cx={centre.x} cy={centre.y} r={SUPPORT_DISTANCE[support] * frame.scale} fill="none" stroke={JOB_ORBIT} strokeWidth={1} strokeDasharray="4 9" />)}
        {field.sources.length > 0 && <circle data-sx-orbit="SOURCE" cx={centre.x} cy={centre.y} r={SOURCE_RING_RADIUS * frame.scale} fill="none" stroke="rgba(126, 255, 204, 0.16)" strokeWidth={1} strokeDasharray="4 9" />}
        {/* Tethers of the cosmos from the centre to every satellite (2 7); to the documents the mint evidence link (3 6). */}
        {field.requirements.map(requirement => { const point = points.get(requirement.id)!; return <line key={`tether-${requirement.id}`} x1={centre.x} y1={centre.y} x2={point.x} y2={point.y} stroke={JOB_TETHER} strokeWidth={1} strokeDasharray="2 7" />; })}
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
                <span style={{ position: "absolute", left: `${card.x - half.w - left}px`, top: `${card.y - half.h - top}px`, width: `${half.w * 2}px`, minHeight: `${half.h * 2}px`, boxSizing: "border-box", ...JOB_NODE_MATERIAL, borderRadius: "14px", padding: cardMode === "full" ? "7px 10px" : "5px 8px", fontFamily: MONO, textAlign: "left", color: INK, pointerEvents: "none" }}>
                  <span style={{ display: "block", color: requirement.support === "OPEN" ? NEUTRAL : CYAN, fontSize: "8.5px", fontWeight: 700, letterSpacing: "0.8px" }}>{t.manifest.requirement}</span>
                  <span style={{ display: "-webkit-box", marginTop: "3px", fontSize: cardMode === "full" ? "11.5px" : "10px", fontWeight: 700, lineHeight: 1.28, WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere" }}>{requirement.name}</span>
                </span>
              ) : (
                <span title={requirement.name} style={{ position: "absolute", left: `${card.x - left}px`, top: `${card.y - top}px`, transform: "translate(-50%, -50%)", maxWidth: "104px", padding: "2px 6px", borderRadius: "8px", border: "1px solid rgba(56, 229, 255, 0.28)", background: "rgba(3, 12, 20, 0.92)", fontFamily: MONO, fontSize: "9px", fontWeight: 700, color: INK_SOFT, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", pointerEvents: "none" }}>{requirement.name}</span>
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
        style={{ position: "absolute", left: `${centre.x}px`, top: `${centre.y}px`, transform: "translate(-50%, -50%)", ...SYNTX_COSMOS_CENTER_MATERIAL, color: INK, cursor: "pointer", fontFamily: MONO, fontSize: "10.5px", fontWeight: 700, letterSpacing: "1px", lineHeight: 1.45, padding: "18px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "4px", zIndex: 3 }}
      >
        <svg aria-hidden="true" width={174} height={174} style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", pointerEvents: "none", overflow: "visible" }}><circle cx={87} cy={87} r={86} fill="none" stroke="transparent" /></svg>
        <span style={{ color: CYAN, fontSize: "9px", letterSpacing: "0.5px" }}>{t.manifest.role} // {role.requirementCount} {t.requirements}</span>
        <span style={{ fontSize: "12px", textTransform: "uppercase", lineHeight: 1.3 }}>{role.title}</span>
        <span style={{ color: "rgba(56, 229, 255, 0.66)", fontSize: "8.5px", letterSpacing: "0.7px" }}>{t.manifest.returnToOrganization}</span>
      </button>
      </div>
    </div>
  );
}

/** The source glyph ◈ drawn as a vector (a document diamond holding its core), so it reads the same at every size and in every font. */
const sourceGlyph = (size: number, color: string = MINT): React.ReactNode => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 16 16" style={{ display: "block", overflow: "visible", flexShrink: 0 }}>
    <path d="M 8 1.4 L 14.6 8 L 8 14.6 L 1.4 8 Z" fill="rgba(126, 255, 204, 0.06)" stroke={color} strokeWidth={1.1} strokeLinejoin="round" />
    <path d="M 8 5.1 L 10.9 8 L 8 10.9 L 5.1 8 Z" fill={color} />
  </svg>
);

/** A source document as the planetarium's source satellite (OrbitalCosmosView): the body on the orbit, the carrier beside it — a document
 * membrane (mint hairline, lit upper edge, the document's spine), not a satellite card. */
function SourceSatellite({ source, point, centre, rotation, t, inSurface = false }: { source: SyntxSource; point: Point; centre: Point; rotation: number; t: SyntxCopy; inSurface?: boolean }) {
  const card = cardBeside(centre, point, 80, 30, 18);
  const sweepOnly = source.sign.relation === "covers_unscored";
  // The sign's own box is the extent of its body and its card (a positioning origin alone would read as invisible).
  const box = { left: Math.min(point.x - 14, card.x - 80), top: Math.min(point.y - 14, card.y - 30), right: Math.max(point.x + 14, card.x + 80), bottom: Math.max(point.y + 14, card.y + 30) };
  return (
    <div data-testid={`syntx-source-${source.docId}`} data-source-title-state={source.titleState} data-trace-count={source.traceCount} {...signAttributes(source.sign)} aria-label={`${t.source} · ${source.title ?? t.sourceUnresolved}`} style={{ position: "absolute", left: `${box.left}px`, top: `${box.top}px`, width: `${box.right - box.left}px`, height: `${box.bottom - box.top}px`, opacity: recedeOpacity(source.sign, 0.2), pointerEvents: "none" }}>
      <div data-sx-carrier-body data-orbital-motion-driver={inSurface ? undefined : "shared-rAF"} data-orbital-motion-phase={rotation.toFixed(6)} data-orbital-motion-x={point.x.toFixed(3)} data-orbital-motion-y={point.y.toFixed(3)} style={{ position: "absolute", left: 0, top: 0, transform: `translate3d(${point.x - box.left}px, ${point.y - box.top}px, 0)` }}>
        <span aria-hidden="true" style={{ position: "absolute", left: "-22px", top: "-22px", width: "44px", height: "44px", borderRadius: "50%", background: "radial-gradient(circle, rgba(126, 255, 204, 0.16), rgba(126, 255, 204, 0.04) 52%, transparent 70%)", pointerEvents: "none" }} />
        <span aria-hidden="true" style={{ position: "absolute", left: "-19px", top: "-19px", width: "38px", height: "38px", boxSizing: "border-box", borderRadius: "50%", border: "1px solid rgba(126, 255, 204, 0.14)", pointerEvents: "none" }} />
        <span aria-hidden="true" style={{ position: "absolute", left: "-14px", top: "-14px", width: "28px", height: "28px", boxSizing: "border-box", borderRadius: "50%", border: `1px ${sweepOnly ? "dashed" : "solid"} rgba(126, 255, 204, ${sweepOnly ? 0.55 : 0.85})`, background: "radial-gradient(circle at 38% 30%, rgba(126, 255, 204, 0.14), rgba(3, 14, 20, 0.96) 62%)", boxShadow: "0 0 16px rgba(126, 255, 204, 0.22), inset 0 1px 0 rgba(200, 255, 236, 0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>{sourceGlyph(13)}</span>
      </div>
      {/* The document carrier: its glow follows the document's own outline (drop-shadow over the clipped sheet), the sheet has a folded
          corner, a lit fold, a ruled ground and a second glass inside its edge — a document, not a card. */}
      <span style={{ position: "absolute", left: 0, top: 0, transform: `translate3d(${card.x - box.left}px, ${card.y - box.top}px, 0) translate(-50%, -50%)`, width: "160px", filter: "drop-shadow(0 0 9px rgba(126, 255, 204, 0.2)) drop-shadow(0 8px 14px rgba(0, 0, 0, 0.55))" }}>
        <span style={{ position: "relative", display: "block", boxSizing: "border-box", borderRadius: "11px", border: "1px solid rgba(126, 255, 204, 0.42)", background: "radial-gradient(130% 90% at 0% 0%, rgba(126, 255, 204, 0.12), transparent 56%), repeating-linear-gradient(180deg, transparent 0 11px, rgba(126, 255, 204, 0.028) 11px 12px), linear-gradient(168deg, rgba(8, 28, 37, 0.98), rgba(3, 11, 19, 0.99))", boxShadow: "inset 0 0 18px rgba(126, 255, 204, 0.05)", clipPath: "polygon(0 0, calc(100% - 15px) 0, 100% 15px, 100% 100%, 0 100%)", padding: "10px 14px 10px 15px", fontFamily: MONO, color: INK, textAlign: "left", overflow: "hidden" }}>
          <span aria-hidden="true" style={{ position: "absolute", inset: "3px", borderRadius: "8px", border: "1px solid rgba(126, 255, 204, 0.07)", pointerEvents: "none" }} />
          <span aria-hidden="true" style={{ position: "absolute", left: "12px", right: "28px", top: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(176, 255, 228, 0.65), rgba(126, 255, 204, 0.14) 85%, transparent)" }} />
          <span aria-hidden="true" style={{ position: "absolute", left: 0, top: "11px", bottom: "11px", width: "2px", borderRadius: "0 2px 2px 0", background: "linear-gradient(180deg, rgba(126, 255, 204, 0.92), rgba(126, 255, 204, 0.22))", boxShadow: "0 0 8px rgba(126, 255, 204, 0.5)" }} />
          <svg aria-hidden="true" width={16} height={16} style={{ position: "absolute", right: "-1px", top: "-1px", overflow: "visible" }}>
            <path d="M 0.5 0.5 L 0.5 15.5 L 15.5 15.5 Z" fill="rgba(126, 255, 204, 0.16)" stroke="rgba(126, 255, 204, 0.32)" strokeWidth={0.8} strokeLinejoin="round" />
            <path d="M 0.5 0.5 L 15.5 15.5" stroke="rgba(190, 255, 232, 0.85)" strokeWidth={1} />
          </svg>
          <span style={{ display: "flex", alignItems: "center", gap: "7px", color: "rgba(126, 255, 204, 0.86)", fontSize: "8.5px", fontWeight: 800, letterSpacing: "1.15px", lineHeight: 1, paddingRight: "8px", whiteSpace: "nowrap" }}>{sourceGlyph(10)}<span>{t.source} // {t.manifest.document}</span></span>
          <span style={{ display: "-webkit-box", marginTop: "8px", fontFamily: SANS, fontSize: "13px", fontWeight: 650, letterSpacing: "0.1px", lineHeight: 1.25, WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", overflowWrap: "anywhere", color: source.title !== null ? "#f2fdff" : MUTED, textShadow: source.title !== null ? "0 0 12px rgba(126, 255, 204, 0.18)" : undefined }}>{source.title ?? (source.titleState === "NOT_READ" ? t.sourceNotRead : t.sourceUnresolved)}</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", color: "rgba(126, 255, 204, 0.74)", fontSize: "8.5px", fontWeight: 700, letterSpacing: "1.1px", lineHeight: 1 }}><span aria-hidden="true" style={{ width: "12px", height: "1px", background: "linear-gradient(90deg, rgba(126, 255, 204, 0.8), rgba(126, 255, 204, 0.2))" }} />{source.traceCount} {t.manifest.evidenceCount}</span>
        </span>
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
    <div data-sx-level="requirement" style={{ position: "absolute", inset: 0, zIndex: 26, overflow: "hidden", background: JOB_DEEP_FOCUS_BACKDROP }}>
    <SyntxDeepFocusShell
      testId="syntx-deep-focus"
      spokeStroke={azure(0.13)}
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
              style={{ position: "absolute", left: `${(satellite.width * satellite.scale) / 2 + 6}px`, top: `${(satellite.height * satellite.scale) / 2 + 6}px`, width: `${satellite.width}px`, minHeight: `${satellite.height}px`, transform: "translate(-50%, -50%) scale(var(--satellite-scale))", "--satellite-scale": satellite.scale, "--satellite-opacity": satellite.opacity, opacity: satellite.opacity, animation: "sxSatelliteSettle 0.72s cubic-bezier(0.16, 1, 0.3, 1) both", ...JOB_SATELLITE_MATERIAL, fontFamily: MONO, fontSize: "9.5px", fontWeight: 700, textAlign: "left", cursor: "pointer", overflowWrap: "anywhere", hyphens: "auto", display: "flex", gap: "8px", alignItems: "flex-start" } as React.CSSProperties}
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
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", color: CYAN, fontSize: "10px", fontWeight: 800, letterSpacing: "1.1px" }}><svg aria-hidden="true" width={16} height={16} style={{ overflow: "visible", flexShrink: 0 }}><circle cx={8} cy={8} r={shape.r * 0.85} fill={shape.fill} stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeDasharray={shape.dash} /></svg>{t.manifest.nucleus} // {t.support[requirement.support]}</span>
          <span style={{ display: "block", marginTop: "8px", fontSize: "14px", fontWeight: 800, lineHeight: 1.34 }}>{requirement.name}</span>
          {requirement.evaluationState === "NOT_EVALUATED" && <span style={{ display: "block", marginTop: "10px", color: "rgba(206, 232, 241, 0.86)", fontSize: "9px", fontWeight: 700, lineHeight: 1.6, textTransform: "uppercase" }}>{t.relation.pending_evaluation}</span>}
          <span style={{ display: "block", marginTop: "10px", color: "rgba(56, 229, 255, 0.66)", fontSize: "9px", letterSpacing: "0.7px" }}>{t.manifest.returnToRole}</span>
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
          <div style={{ position: "absolute", left: "15px", right: "15px", top: "11px", color: MINT, fontSize: "9px", fontWeight: 800, letterSpacing: "0.9px" }}>{t.manifest.evidence} // {requirement.traces.length} {t.manifest.relations}</div>
          {groups.map(group => {
            const source = sourcesByDoc.get(group.docId);
            if (source === undefined) return null;
            return (
              <div key={group.docId} data-testid={`syntx-source-${source.docId}`} data-source-title-state={source.titleState} data-trace-count={source.traceCount} {...signAttributes(source.sign)} aria-label={`${t.source} · ${source.title ?? t.sourceUnresolved}`} style={{ position: "absolute", left: "15px", right: "15px", top: `${group.top}px`, height: `${EVIDENCE_ROW.group}px`, display: "flex", alignItems: "center", gap: "8px", fontSize: "10px", borderTop: "1px solid rgba(126, 255, 204, 0.14)" }}>
                <span data-sx-carrier-body aria-hidden="true" style={{ color: MINT, display: "inline-flex" }}>{sourceGlyph(11)}</span>
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
                <div style={{ fontSize: "9px", fontWeight: 800, letterSpacing: "0.8px", color: unscored ? "rgba(142, 239, 255, 0.85)" : MINT, textTransform: "uppercase" }}>{t.relation[trace.kind]} · {unscored ? t.manifest.unscored : t.manifest.scored}</div>
                <div style={{ marginTop: "4px", fontSize: "10px", color: "rgba(206, 232, 241, 0.74)", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>“{trace.quote}”</div>
              </div>
            );
          })}
          {requirement.openBoundary !== null && (
            <div data-testid={`syntx-open-${requirement.id}`} {...signAttributes(requirement.openBoundary)} role="button" tabIndex={0} aria-label={`${t.relation.missing_support} · ${requirement.name}`} onClick={stop(inspectOpen)} onKeyDown={keyActivate(inspectOpen)} style={{ position: "absolute", left: "15px", right: "15px", top: `${EVIDENCE_ROW.header + groups.length * EVIDENCE_ROW.group + rows.length * EVIDENCE_ROW.entry}px`, height: `${EVIDENCE_ROW.entry}px`, display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: NEUTRAL, fontSize: "9.5px", fontWeight: 700, letterSpacing: "0.8px" }}>
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
  border: "1px solid rgba(126, 255, 204, 0.46)",
  background: "radial-gradient(120% 70% at 0% 0%, rgba(126, 255, 204, 0.11), transparent 52%), radial-gradient(90% 60% at 100% 0%, rgba(56, 229, 255, 0.1), transparent 58%), radial-gradient(90% 55% at 50% 112%, rgba(72, 130, 255, 0.09), transparent 70%), linear-gradient(168deg, #0b1f2c 0%, #071622 38%, #040d17 72%, #02070e 100%)",
  boxShadow: "0 24px 60px rgba(0, 0, 0, 0.82), 0 6px 18px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 229, 255, 0.08), 0 0 30px rgba(56, 229, 255, 0.14), inset 0 1px 0 rgba(200, 255, 236, 0.16), inset 0 0 48px rgba(56, 229, 255, 0.045), inset 0 -40px 60px rgba(0, 3, 8, 0.35)",
  color: INK,
  fontFamily: MONO,
  textAlign: "left",
  WebkitFontSmoothing: "antialiased",
  isolation: "isolate"
};
const apertureKicker: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: "rgba(126, 255, 204, 0.82)" };
const apertureLabel: React.CSSProperties = { fontFamily: MONO, fontSize: "10px", fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(206, 232, 241, 0.6)" };
const apertureChip = (tone: string, dashed = false): React.CSSProperties => ({ display: "inline-flex", alignItems: "baseline", gap: "6px", padding: "4px 10px", borderRadius: "999px", border: `1px ${dashed ? "dashed" : "solid"} ${tone}`, background: "linear-gradient(180deg, rgba(10, 30, 44, 0.85), rgba(3, 12, 20, 0.85))", boxShadow: "inset 0 1px 0 rgba(200, 245, 255, 0.07)", fontFamily: MONO, fontSize: "12px", color: "#f1fbfe", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" });
/** A hairline between the aperture's layers: light in the middle, fading to both edges. */
const apertureRule = (tone: string): React.CSSProperties => ({ height: "1px", margin: "0 20px", background: `linear-gradient(90deg, transparent, ${tone}, transparent)` });
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
      <span style={{ fontFamily: MONO, fontSize: "12px", fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase", color: tone }}>{text}</span>
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
        <span data-sx-aperture-glow aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "14px", pointerEvents: "none", boxShadow: "0 0 38px rgba(126, 255, 204, 0.15), 0 0 90px rgba(56, 229, 255, 0.07), inset 0 0 0 1px rgba(126, 255, 204, 0.16), inset 0 0 30px rgba(126, 255, 204, 0.05)", animation: "sxApertureBreathe 9s ease-in-out infinite", zIndex: -1 }} />
        {/* Depth: a second glass a few pixels inside the frame and the lit upper edge (both still). */}
        <span aria-hidden="true" style={{ position: "absolute", inset: "5px", borderRadius: "10px", pointerEvents: "none", border: "1px solid rgba(126, 255, 204, 0.06)", zIndex: -1 }} />
        <span aria-hidden="true" style={{ position: "absolute", left: "24px", right: "24px", top: 0, height: "1px", pointerEvents: "none", background: "linear-gradient(90deg, transparent, rgba(170, 255, 226, 0.7) 30%, rgba(120, 236, 255, 0.55) 70%, transparent)" }} />
        {/* The field inside the lens: a faint star ground (still), as in the cosmos the aperture belongs to. */}
        <span aria-hidden="true" style={{ ...JOB_COSMOS_STARS, opacity: 0.22, borderRadius: "14px", zIndex: -1 }} />

        {/* Head: what is inspected — the requirement (or the role) it belongs to. */}
        <header style={{ padding: "16px 20px 14px", background: "linear-gradient(180deg, rgba(126, 255, 204, 0.07), rgba(126, 255, 204, 0.01))", borderRadius: "14px 14px 0 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
            <span style={apertureKicker}>{content.kind === "pending" ? t.manifest.role : t.manifest.requirement}{content.kind === "trace" ? ` · ${t.manifest.evidence}` : ""}</span>
            <button data-testid="syntx-aperture-close" onClick={onClose} style={{ ...action("muted"), fontSize: "10px", padding: "2px 0" }}>{t.close}</button>
          </div>
          <div style={{ marginTop: "9px", fontFamily: MONO, fontSize: "16px", fontWeight: 800, letterSpacing: "0.7px", lineHeight: 1.3, textTransform: "uppercase", color: "#effcff", textShadow: "0 0 18px rgba(56, 229, 255, 0.34), 0 0 2px rgba(210, 248, 255, 0.35)" }}>{aperture.requirement !== null ? aperture.requirement.name : observedRole?.title ?? ""}</div>
        </header>
        <div aria-hidden="true" style={apertureRule("rgba(126, 255, 204, 0.3)")} />

        <div style={{ padding: "15px 20px 17px", ...stack(13) }}>
          {content.kind === "trace" && (
            <>
              <ApertureRelation kind={content.trace.kind} label={`${t.relation[content.trace.kind]} · ${unscored ? t.manifest.unscored : t.manifest.scored}`} tone={relationTone} />
              <span data-testid="syntx-aperture-source" data-source-title-state={content.trace.sourceTitleState} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                <span aria-hidden="true" style={{ width: "22px", height: "22px", boxSizing: "border-box", borderRadius: "50%", border: `1px ${unscored ? "dashed" : "solid"} rgba(126, 255, 204, 0.75)`, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "radial-gradient(circle at 38% 30%, rgba(126, 255, 204, 0.16), rgba(3, 14, 20, 0.9) 64%)", boxShadow: "0 0 12px rgba(126, 255, 204, 0.24)", flexShrink: 0 }}>{sourceGlyph(11)}</span>
                <span style={apertureLabel}>{t.source}:</span>
                <span style={{ fontFamily: SANS, fontSize: "14px", fontWeight: 600, color: INK }}>{content.trace.sourceTitle ?? (content.trace.sourceTitleState === "NOT_READ" ? t.sourceNotRead : t.sourceUnresolved)}</span>
                {content.trace.location !== null && <span style={{ ...apertureChip("rgba(126, 255, 204, 0.35)"), fontSize: "11px" }}><span style={apertureLabel}>{t.location}</span>{content.trace.location}</span>}
              </span>
              <p data-testid="syntx-aperture-quote" style={{ margin: 0, padding: "13px 16px", borderRadius: "10px", borderLeft: `2px ${unscored ? "dashed" : "solid"} ${unscored ? "rgba(142, 239, 255, 0.7)" : "rgba(126, 255, 204, 0.85)"}`, background: "linear-gradient(90deg, rgba(126, 255, 204, 0.08), rgba(126, 255, 204, 0.02) 70%, rgba(56, 229, 255, 0.02))", boxShadow: "inset 0 0 0 1px rgba(126, 255, 204, 0.07), inset 0 10px 22px rgba(0, 4, 10, 0.28), -1px 0 10px rgba(126, 255, 204, 0.12)", fontFamily: SANS, fontSize: "15px", lineHeight: 1.62, color: "#f3fcfe", letterSpacing: "0.1px" }}><span style={{ color: unscored ? "rgba(142, 239, 255, 0.85)" : "rgba(126, 255, 204, 0.85)", textShadow: "0 0 10px rgba(126, 255, 204, 0.35)" }}>“</span>{content.trace.quote}<span style={{ color: unscored ? "rgba(142, 239, 255, 0.85)" : "rgba(126, 255, 204, 0.85)", textShadow: "0 0 10px rgba(126, 255, 204, 0.35)" }}>”</span></p>
              <span aria-hidden="true" style={{ ...apertureRule("rgba(56, 229, 255, 0.22)"), margin: "1px 0" }} />
              <span style={{ ...micro, fontSize: "11.5px", color: "rgba(206, 232, 241, 0.72)" }}><span style={apertureLabel}>{t.capabilityReference}:</span> <span style={{ color: INK }}>{content.trace.capabilityName}</span>{content.trace.matchedConstituent !== null ? ` · ${t.constituent} ${content.trace.matchedConstituent}` : ""} · {t.basis} <span style={{ color: INK }}>{content.trace.basis}</span></span>
              {content.trace.contribution !== null && content.trace.confidence !== null && (
                <span data-testid="syntx-aperture-contribution" style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}>
                  <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.contribution}</span> {content.trace.contribution}</span>
                  <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.confidence}</span> {content.trace.confidence}</span>
                  {aperture.requirement?.weight !== null && aperture.requirement?.weight !== undefined && <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.weight}</span> {aperture.requirement.weight}</span>}
                </span>
              )}
              {unscored && <span data-testid="syntx-aperture-sweep-status" data-scored="false" style={{ ...apertureChip("rgba(142, 239, 255, 0.6)", true), alignSelf: "flex-start", fontSize: "11px", color: "rgba(142, 239, 255, 0.95)", whiteSpace: "normal" }}>{t.sweepStatus}</span>}
              <p style={{ ...prose, fontSize: "13.5px", color: "rgba(230, 241, 248, 0.86)" }}>{content.trace.kind === "supports" ? t.texts.scored : content.trace.kind === "weakly_supports" ? t.texts.weak : t.texts.sweep}</p>
              {content.trace.weakReason !== null && <span style={{ ...micro, fontSize: "11.5px", color: AMBER }}>{content.trace.weakReason}</span>}
            </>
          )}
          {content.kind === "open" && (
            <>
              <ApertureRelation kind="missing_support" label={t.relation.missing_support} tone={NEUTRAL} />
              <p data-testid="syntx-aperture-open-text" style={{ ...prose, fontSize: "14px", lineHeight: 1.6, color: "#eef8fb" }}>{t.texts.missing}</p>
              {content.requirement.evidenceHint !== null && <span style={{ ...micro, fontSize: "11.5px" }}><span style={apertureLabel}>{t.hint}:</span> <span style={{ color: INK }}>{content.requirement.evidenceHint}</span></span>}
              <span style={{ ...micro, fontSize: "11.5px", color: "rgba(206, 232, 241, 0.7)" }}>{content.requirement.necessity ?? ""}{content.requirement.weight !== null ? ` · ${t.weight} ${content.requirement.weight}` : ""}{content.requirement.requiredLevel !== null ? ` · ${t.level} ${content.requirement.requiredLevel}` : ""}</span>
            </>
          )}
          {content.kind === "pending" && (
            <>
              <ApertureRelation kind="pending_evaluation" label={t.relation.pending_evaluation} tone={NEUTRAL} />
              <p data-testid="syntx-aperture-pending-text" style={{ ...prose, fontSize: "14px", lineHeight: 1.6, color: "#eef8fb" }}>{t.texts.pending}</p>
              <span style={{ ...micro, fontSize: "11.5px", color: "rgba(206, 232, 241, 0.7)" }}>{content.boundary.targetRoleProfileRevisionId} · {content.boundary.targetRequirementRevisionIds.length} TRQREV</span>
              {observedRole?.matching && <span data-testid="syntx-aperture-resonance" data-resonance-score={observedRole.matching.resonanceScore} style={{ display: "flex", flexWrap: "wrap", gap: "7px" }}><span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.resonance}</span> {percent(observedRole.matching.resonanceScore)}</span> <span style={apertureChip("rgba(56, 229, 255, 0.35)")}><span style={apertureLabel}>{t.rank}</span> #{observedRole.matching.deliveredRank}</span></span>}
            </>
          )}
        </div>

        {/* Boundary zone: the authority statement, separated from the evidence it qualifies. */}
        <footer style={{ position: "relative", padding: "14px 20px 16px", borderTop: "1px dashed rgba(255, 179, 56, 0.36)", background: "radial-gradient(90% 120% at 0% 0%, rgba(255, 179, 56, 0.08), transparent 60%), linear-gradient(180deg, rgba(255, 179, 56, 0.05), rgba(255, 179, 56, 0.01))", boxShadow: "inset 0 10px 18px -12px rgba(0, 0, 0, 0.6)", borderRadius: "0 0 14px 14px" }}>
          <span aria-hidden="true" style={{ position: "absolute", left: "20px", right: "20px", top: "-1px", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255, 196, 96, 0.5), transparent)", boxShadow: "0 0 8px rgba(255, 179, 56, 0.35)" }} />
          <span data-testid="syntx-aperture-authority" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "5px 6px", fontFamily: MONO, fontSize: "11.5px", lineHeight: 1.4, color: AMBER }}>
            {authorityParts.map((part, index) => (
              <React.Fragment key={part}>
                {index > 0 && <span style={visuallyHidden}> · </span>}
                <span style={{ padding: "3px 9px", borderRadius: "6px", border: "1px solid rgba(255, 179, 56, 0.32)", background: "linear-gradient(180deg, rgba(255, 179, 56, 0.1), rgba(255, 179, 56, 0.035))", boxShadow: "inset 0 1px 0 rgba(255, 214, 150, 0.1)", letterSpacing: "0.3px" }}>{part}</span>
              </React.Fragment>
            ))}
          </span>
        </footer>
      </aside>
    </>
  );
}

/** NO_POOL giant: the diameter follows the visible height while the field is taller than the viewport (F-4), so the body never
 * leaves the screen; 400 px when there is room, never below 300 px. */
const NO_POOL_GIANT_SIZE = "clamp(300px, calc(2 * (100vh - var(--condyn-page-header-height, 60px) - 504px)), 400px)";
const RUBY = (alpha: number): string => `rgba(255, 64, 86, ${alpha})`;

/**
 * The red absence giant (owner "SFE::JOB FIELD RED ABSENCE GIANT", 2026-10-13): NO_POOL at the field drawn as one red semiotic
 * body on the field's centre — an unbound semantic centre, not an error. It means only "no explicit job pool selection" (a persisted
 * upload may exist); it leaves with the selection, when the job cosmos takes the centre. It breathes (sxGiant*, 10 s, LIVE only):
 * aura, seam, outer membrane and red rings; the information, the cyan ring and the cyan joints never move.
 */
function NoPoolGiant({ copy }: { copy: { status: string; title: string; reason: string; orientation: string } }) {
  const ring = (inset: string, border: string): React.CSSProperties => ({ position: "absolute", inset, borderRadius: "50%", border, pointerEvents: "none" });
  const node = (left: string, top: string): React.CSSProperties => ({ position: "absolute", left, top, width: "5px", height: "5px", marginLeft: "-2.5px", marginTop: "-2.5px", borderRadius: "50%", background: "#bff4ff", boxShadow: `0 0 6px ${CYAN}, 0 0 12px ${azure(0.5)}`, pointerEvents: "none" });
  return (
    <div data-testid="syntx-no-pool" data-sx-reveal="true" data-sx-no-pool-giant style={{ position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -50%)", width: NO_POOL_GIANT_SIZE, height: NO_POOL_GIANT_SIZE, zIndex: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
      {/* The breathing aura beyond the contour (static at its base in REDUCED). */}
      <div data-sx-giant-aura aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: `0 0 30px 6px ${RUBY(0.42)}, 0 0 82px 18px rgba(214, 24, 56, 0.24)`, opacity: 0.62, pointerEvents: "none" }} />
      {/* The body: a dark, transparent interior inside a ruby seam with a soft aura beyond the contour. */}
      <div data-sx-giant-body aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1.5px solid ${RUBY(0.72)}`, background: `radial-gradient(circle at 50% 46%, rgba(46, 8, 16, 0.5) 0%, rgba(14, 5, 10, 0.78) 58%, rgba(5, 5, 9, 0.9) 100%)`, boxShadow: `0 0 0 1px ${RUBY(0.1)}, 0 0 18px ${RUBY(0.34)}, 0 0 48px rgba(214, 24, 56, 0.2), inset 0 0 30px ${RUBY(0.16)}, inset 0 0 90px rgba(120, 8, 24, 0.28)`, pointerEvents: "none" }} />
      {/* Structure: the outer semiotic ring, a tick annulus, three inner rings (one in the field's cyan). */}
      {/* The seam's light: swells and fades over the ruby contour. */}
      <div data-sx-giant-seam aria-hidden="true" style={{ position: "absolute", inset: "-1px", borderRadius: "50%", border: `2px solid ${RUBY(0.85)}`, boxShadow: `0 0 12px ${RUBY(0.7)}, inset 0 0 14px ${RUBY(0.32)}`, opacity: 0.5, pointerEvents: "none" }} />
      <div data-sx-giant-membrane aria-hidden="true" style={ring("-14px", `1px dashed ${RUBY(0.34)}`)} />
      <div data-sx-giant-membrane aria-hidden="true" style={{ position: "absolute", inset: "-7px", borderRadius: "50%", background: `repeating-conic-gradient(from 0deg, ${RUBY(0.42)} 0deg 0.7deg, transparent 0.7deg 7.5deg)`, WebkitMaskImage: "radial-gradient(closest-side, transparent calc(100% - 5px), #000 calc(100% - 4px), #000 calc(100% - 1px), transparent 100%)", maskImage: "radial-gradient(closest-side, transparent calc(100% - 5px), #000 calc(100% - 4px), #000 calc(100% - 1px), transparent 100%)", pointerEvents: "none" }} />
      <div data-sx-giant-ring aria-hidden="true" style={ring("9%", `1px solid ${RUBY(0.24)}`)} />
      <div aria-hidden="true" style={ring("17%", `1px dashed ${azure(0.2)}`)} />
      <div data-sx-giant-ring aria-hidden="true" style={ring("27%", `1px solid ${RUBY(0.1)}`)} />
      {/* Cyan joints on the seam (the link to the DLL field grammar) and two short technical ticks on the inner ring. */}
      <span aria-hidden="true" style={node("50%", "0%")} />
      <span aria-hidden="true" style={node("100%", "50%")} />
      <span aria-hidden="true" style={node("50%", "100%")} />
      <span aria-hidden="true" style={node("0%", "50%")} />
      <span aria-hidden="true" style={{ position: "absolute", left: "9%", top: "50%", width: "16px", height: "1px", background: `linear-gradient(90deg, ${azure(0.55)}, transparent)`, pointerEvents: "none" }} />
      <span aria-hidden="true" style={{ position: "absolute", right: "9%", top: "50%", width: "16px", height: "1px", background: `linear-gradient(270deg, ${azure(0.55)}, transparent)`, pointerEvents: "none" }} />
      {/* The information, inside the body: state in red, the hierarchy in cyan-white. */}
      <div style={{ position: "relative", width: "76%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", fontFamily: MONO, textWrap: "balance" }}>
        <span style={SIL_RED_FIELD_TYPE.status}>{copy.status}</span>
        <span aria-hidden="true" style={{ marginTop: "9px", width: "84px", height: "1px", background: `linear-gradient(90deg, transparent, ${CYAN}, ${RUBY(0.9)}, transparent)` }} />
        <strong style={{ marginTop: "12px", fontSize: "17px", lineHeight: 1.25, fontWeight: 800, letterSpacing: "1.3px", color: "#effbff", textShadow: `0 0 14px ${azure(0.32)}` }}>{copy.title}</strong>
        <span style={{ ...prose, marginTop: "10px", fontSize: "14px", lineHeight: 1.55, color: "rgba(222, 238, 246, 0.92)" }}>{copy.reason}</span>
        <span style={{ marginTop: "12px", fontSize: "11.5px", lineHeight: "14px", fontWeight: 600, letterSpacing: "1.1px", color: "rgba(140, 232, 252, 0.95)" }}>{copy.orientation.split(" · ").map((part, index, parts) => <React.Fragment key={index}>{index > 0 && " "}<span style={{ whiteSpace: "nowrap" }}>{index < parts.length - 1 ? `${part} ·` : part}</span></React.Fragment>)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------------------------------------
 * Investigation bodies (owner GO "DEMO FRONTEND", 2026-10-15): B2 coverage (PERSON × JOB), the job structure (JOB) and the GEMINI
 * OUTPUT inspector. Each opens at the centre as a governance body in the boundary's grammar (same glass, layers, chips and veil),
 * one at a time, and reads only: nothing starts an analysis, nothing is stored.
 * ------------------------------------------------------------------------------------------------------------------------------ */

/** GEMINI OUTPUT appears only in engineering builds (GELB GEMINI_RESULT_INSPECTOR.md §6): NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI=1. */
export const SYNTX_GEMINI_OUTPUT_ENABLED = process.env.NEXT_PUBLIC_CONDYN_RESULT_INSPECTOR_UI === "1";

/** What the Job Field knows of the investigation boundary and the analysis on view (from the shell). */
export interface SyntxInvestigationContext {
  mode: InvestigationMode;
  /** The analysis on view (job result or URL), independent of the mode; the inspector and B2 read it. */
  analysisId: string | null;
  /** The persisted boundary of the analysis on view (read from the server); null while unknown or unresolvable. */
  analysisMode: "PERSON" | "PERSON_X_JOB" | null;
  /** In PERSON × JOB: why the analysis on view is not compared — its boundary is still being read, it is PERSON, or it cannot be named. */
  comparisonWithheld?: "RESOLVING" | "PERSON" | "UNRESOLVED" | "OTHER_POOL" | null;
  /** The pool the analysis was investigated in; offered for an explicit selection when another pool is on view (never switched silently). */
  analysisPool?: string | null;
  onOpenAnalysisPool?(): void;
  /** The execution job of the analysis on view, when this session submitted it. */
  jobId: string | null;
  /** The selected job scope is VALID (validated against its stored pool). */
  scopeValid: boolean;
}

const BODY_WIDTH = "max(340px, min(760px, calc(100vw - 768px)))";
const bodyStyle = (open: boolean, mode: SyntxMotionMode): React.CSSProperties => ({ ...panel, ...BOUNDARY_BODY, display: open ? "flex" : "none", flexDirection: "column", gap: "16px", left: 0, right: 0, margin: "0 auto", top: "96px", width: BODY_WIDTH, maxHeight: "calc(100vh - 208px)", overflowY: "auto", zIndex: 46, animation: mode === "LIVE" && open ? "sxBoundaryOpen 0.6s cubic-bezier(0.16, 1, 0.3, 1) both, sxBoundaryHalo 28s ease-in-out -7s infinite" : undefined });
const bodyKicker: React.CSSProperties = { ...panelKicker(`rgba(${AMBER_RGB}, 0.85)`), fontSize: "12px", letterSpacing: "3.2px", color: "#e4f4fb" };
const bodyOrientation: React.CSSProperties = { fontFamily: SANS, fontSize: "11.5px", lineHeight: "13px", letterSpacing: "0.2px", color: "rgba(204, 230, 242, 0.9)", margin: "-12px 0 -6px 0" };
const layers: React.CSSProperties = { position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: "12px" };
const quoteLine: React.CSSProperties = { fontFamily: SANS, fontSize: "12.5px", lineHeight: 1.55, color: "rgba(214, 252, 236, 0.92)", margin: 0, paddingLeft: "10px", borderLeft: "1.5px solid rgba(126, 255, 204, 0.45)", wordBreak: "break-word" };
const sourceLine: React.CSSProperties = { fontFamily: MONO, fontSize: "11px", lineHeight: 1.55, color: "rgba(200, 226, 240, 0.9)", margin: 0, paddingLeft: "10px", borderLeft: `1.5px solid ${azure(0.4)}`, whiteSpace: "pre-wrap", wordBreak: "break-word" };
const rawText: React.CSSProperties = { margin: 0, maxHeight: "46vh", overflow: "auto", padding: "12px 14px", borderRadius: "10px", border: `1px solid ${azure(0.24)}`, background: "rgba(1, 6, 12, 0.82)", boxShadow: "inset 0 1px 8px rgba(0, 0, 0, 0.5)", fontFamily: MONO, fontSize: "12px", lineHeight: 1.55, color: "#e8f6fc", whiteSpace: "pre-wrap", wordBreak: "break-all", tabSize: 2 };
const stateLine = (rgb: string): React.CSSProperties => ({ ...boundaryStatement(), display: "flex", alignItems: "flex-start", gap: "9px", color: `rgba(${rgb === AMBER_RGB ? "255, 214, 150" : "226, 240, 248"}, 0.95)` });

function BodyHeading({ index, children }: { index: string; children: React.ReactNode }) {
  return <span data-sx-boundary-heading style={boundaryHeading(azure(0.8))}><span aria-hidden="true">{index}</span>{children}</span>;
}
function LimitChip({ rgb, limit = false, children, testId }: { rgb: string; limit?: boolean; children: React.ReactNode; testId?: string }) {
  return <span data-testid={testId} data-sx-boundary-limit={limit ? "true" : undefined} style={boundaryChip(rgb)}><span aria-hidden="true" style={chipDot(rgb)} />{children}</span>;
}
function StateStatement({ testId, state, rgb, children }: { testId: string; state: string; rgb: string; children: React.ReactNode }) {
  return <p data-testid={testId} data-state={state} role="status" style={stateLine(rgb)}><span aria-hidden="true" style={{ ...chipDot(rgb), marginTop: "7px" }} />{children}</p>;
}

/** B2 · SELECTED_ROLE_COVERAGE_V1 of exactly the selected role. Shown only while its binding equals the current selection. */
export function CoverageBody({ open, mode, t, read, hasAnalysis }: { open: boolean; mode: SyntxMotionMode; t: SyntxCopy; read: SelectedRoleCoverageState; hasAnalysis: boolean }) {
  const c = t.coverage;
  const state = hasAnalysis ? read.state : "NO_ANALYSIS";
  const coverage = state === "AVAILABLE" && read.state === "AVAILABLE" ? read.coverage : null;
  return (
    <section data-testid="syntx-coverage" data-coverage-state={state} data-scored="false" data-relation-state="NOT_EVALUATED" data-covered={coverage?.counts.covered ?? ""} data-not-covered={coverage?.counts.notCovered ?? ""} data-binding-analysis={coverage?.binding.analysisId ?? ""} data-binding-role={coverage?.binding.poolRoleId ?? ""} hidden={!open} data-sx-reveal={open ? "true" : undefined} data-sx-surface="investigation" data-sx-panel="boundary" style={bodyStyle(open, mode)}>
      <span data-sx-kicker style={bodyKicker}>{c.title}</span>
      <span data-sx-boundary-orientation style={bodyOrientation}>{c.orientation}</span>
      {coverage === null && <StateStatement testId="syntx-coverage-state" state={state} rgb={state === "LOADING" ? CYAN_RGB : AMBER_RGB}>{state === "FAILED" && read.state === "FAILED" && read.code ? `${c.states.FAILED} · ${read.code}` : c.states[state as keyof typeof c.states]}</StateStatement>}
      {coverage !== null && (
        <div data-sx-boundary-layers style={layers}>
          {/* 01 · the binding: the role, the analysis and the runs this comparison belongs to. */}
          <div data-sx-section="binding" style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="01">{c.binding}</BodyHeading>
            <span style={{ ...boundaryStatement(), fontWeight: 600 }}>{coverage.role.title} <span style={{ fontWeight: 400, color: "rgba(190, 214, 230, 0.86)" }}>· {coverage.role.organizationName}</span></span>
            <span style={boundaryMeta}>{coverage.binding.analysisId} · {coverage.binding.discoveryRunId} · {coverage.binding.convergenceRunId}</span>
            <span style={boundaryMeta}>{coverage.binding.jobPoolUploadId} · v{coverage.binding.poolVersion} · {coverage.binding.poolRoleId} · scope {coverage.binding.investigationScopeHash.slice(0, 16)}…</span>
          </div>
          {/* 02 · the requirements of the role in pool order: covered by a proposal (verbatim evidence) or not covered (no judgement). */}
          <div data-sx-section="requirements" style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="02">{c.requirements}</BodyHeading>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(10) }}>
              {coverage.requirements.map(requirement => {
                const proposal = requirement.coverage.state === "COVERED" ? requirement.coverage.proposal : null;
                const weak = proposal?.matchBasis === "TOKEN_CONTAINMENT";
                return (
                  <li key={requirement.poolRequirementId} data-testid={`syntx-coverage-req-${requirement.poolRequirementId}`} data-coverage={requirement.coverage.state} data-match-basis={proposal?.matchBasis ?? ""} data-proposal-id={proposal?.capabilityProposalId ?? ""} style={{ ...stack(5), paddingBottom: "10px", borderBottom: `1px solid ${azure(0.1)}` }}>
                    <div style={{ ...row(8), justifyContent: "space-between" }}>
                      <span style={{ fontFamily: SANS, fontSize: "13.5px", fontWeight: 600, color: "#eef9ff" }}>{requirement.capabilityName}</span>
                      {proposal !== null
                        ? <LimitChip rgb={weak ? AMBER_RGB : CYAN_RGB} limit={weak}>{weak ? c.weak : c.covered}</LimitChip>
                        : <LimitChip rgb="230, 241, 248">{c.notCovered}</LimitChip>}
                    </div>
                    <span style={boundaryMeta}>{requirement.necessityState} · {requirement.requiredLevel || "—"} · {t.weight} {requirement.weight} · {requirement.requirementType} · {requirement.matchingEligibility}</span>
                    {proposal !== null && <span style={boundaryMeta}>{c.by} <strong style={{ color: "#e6f7fd" }}>{proposal.name}</strong> · {c.basis[proposal.matchBasis]}{proposal.matchedConstituent ? ` · ${proposal.matchedConstituent}` : ""} · {proposal.evidenceState} · authority {proposal.authorityState}</span>}
                    {proposal !== null && proposal.evidence.map((quote, index) => <p key={`${quote.docId}:${index}`} data-sx-evidence-quote style={quoteLine}><span style={{ fontFamily: MONO, fontSize: "10px", color: "rgba(126, 255, 204, 0.8)", marginRight: "6px" }}>{quote.docId}</span>“{quote.quote}”</p>)}
                    {proposal === null && <span style={{ ...boundaryMeta, color: "rgba(214, 226, 236, 0.78)" }}>{c.notCoveredStatement}</span>}
                  </li>
                );
              })}
            </ul>
            <span style={boundaryMeta}>{c.evidence}</span>
          </div>
          {/* 03 · every proposal of the analysis, also those that cover nothing here. */}
          <div data-sx-section="proposals" data-testid="syntx-coverage-proposals" data-proposal-count={coverage.proposals.length} style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="03">{c.proposals}</BodyHeading>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(5) }}>
              {coverage.proposals.map(proposal => <li key={proposal.id} data-proposal-id={proposal.id} style={boundaryMeta}><strong style={{ color: "#e6f7fd" }}>{proposal.name}</strong> · {proposal.scope} · {proposal.coversPoolRequirementIds.length === 0 ? c.coversNothing : `${c.covers} ${proposal.coversPoolRequirementIds.join(", ")}`}</li>)}
            </ul>
          </div>
          {/* 04 · the authority: fixed, and the counts that are not a score. */}
          <div data-sx-section="authority" data-testid="syntx-coverage-authority" data-authority-state={coverage.authority.authorityState} style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="04">{c.authority}</BodyHeading>
            <div style={row(6)}>
              <LimitChip rgb={AMBER_RGB} limit>scored false</LimitChip>
              <LimitChip rgb={AMBER_RGB} limit>{coverage.authority.capabilityRequirementRelationState}</LimitChip>
              <LimitChip rgb={AMBER_RGB} limit>authority {coverage.authority.authorityState}</LimitChip>
              <LimitChip rgb={CYAN_RGB}>{coverage.authority.comparisonBasis}</LimitChip>
            </div>
            <span data-testid="syntx-coverage-counts" style={boundaryMeta}>{coverage.counts.requirements} {c.counts.requirements} · {coverage.counts.covered} {c.counts.covered} · {coverage.counts.notCovered} {c.counts.notCovered} · {coverage.counts.proposals} {c.counts.proposals} · {coverage.authority.reason}</span>
            <span data-sx-boundary-statement style={boundaryStatement()}>{c.countsStatement}</span>
          </div>
        </div>
      )}
    </section>
  );
}

const necessityLabel = (state: JobStructure["requirements"][number]["necessityState"]): string => state.kind === "CONDITIONAL" ? `CONDITIONAL · ${state.conditionStatement}` : state.kind;
const levelLabel = (state: JobStructure["requirements"][number]["requiredLevelState"]): string => state.kind === "CAPABILITY_LEVEL" ? state.level : state.kind === "EXPERIENCE_DURATION" ? state.minimumDuration : state.kind === "LANGUAGE_PROFICIENCY" ? state.proficiency : state.kind === "CREDENTIAL_REQUIREMENT" ? state.credential : state.kind;

/** JOB · JOB_STRUCTURE_V1 of exactly the selected job: the declaration, its states and its findings; no person, no Gemini. */
export function StructureBody({ open, mode, t, read }: { open: boolean; mode: SyntxMotionMode; t: SyntxCopy; read: JobStructureState }) {
  const c = t.structure;
  const structure = read.state === "AVAILABLE" ? read.structure : null;
  const findingsFor = (id: string) => structure?.findings.filter(finding => finding.subject.kind === "REQUIREMENT" && finding.subject.id === id) ?? [];
  return (
    <section data-testid="syntx-job-structure" data-structure-state={read.state} data-investigation-mode="JOB" data-scored="false" data-finding-count={structure?.counts.findings ?? ""} data-binding-role={structure?.binding.poolRoleId ?? ""} hidden={!open} data-sx-reveal={open ? "true" : undefined} data-sx-surface="investigation" data-sx-panel="boundary" style={bodyStyle(open, mode)}>
      <span data-sx-kicker style={bodyKicker}>{c.title}</span>
      <span data-sx-boundary-orientation style={bodyOrientation}>{c.orientation}</span>
      {structure === null && <StateStatement testId="syntx-job-structure-state" state={read.state} rgb={read.state === "LOADING" ? CYAN_RGB : AMBER_RGB}>{read.state === "FAILED" && read.code ? `${c.states.FAILED} · ${read.code}` : read.state === "IDLE" ? JOB_SCOPE_REQUIRED_MESSAGE : c.states[read.state as keyof typeof c.states]}</StateStatement>}
      {structure !== null && (
        <div data-sx-boundary-layers style={layers}>
          {/* 01 · the role as declared, with its organization and the responsibility the deterministic reading cannot declare. */}
          <div data-sx-section="role" style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="01">{c.role}</BodyHeading>
            <span style={{ ...boundaryStatement(), fontWeight: 600 }}>{structure.role.title} <span style={{ fontWeight: 400, color: "rgba(190, 214, 230, 0.86)" }}>· {structure.organization.name}</span></span>
            <span style={boundaryMeta}>{structure.role.seniority || "—"} · {structure.role.domainFocus || "—"} · {structure.organization.industry} · {structure.organization.region} {structure.organization.countryIso}</span>
            {structure.role.description.length > 0 && <p style={{ ...prose, fontSize: "13px" }}>{structure.role.description}</p>}
            <div style={row(6)}>
              {structure.role.profile.responsibilityScope.state === "DECLARED"
                ? <LimitChip rgb={CYAN_RGB}>{c.responsibility} · {c.declared}</LimitChip>
                : <LimitChip testId="syntx-job-structure-responsibility" rgb={AMBER_RGB} limit>{c.responsibility} · {c.notDeclared}</LimitChip>}
              <LimitChip rgb={AMBER_RGB} limit>{structure.role.profile.proposalState}</LimitChip>
            </div>
            <span style={boundaryMeta}>{structure.binding.jobPoolUploadId} · v{structure.binding.poolVersion} · {structure.binding.targetRoleProfileRevisionId}</span>
          </div>
          {/* 02 · the requirements in pool order: necessity, level, eligibility and the pool source lines that declare them. */}
          <div data-sx-section="requirements" style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="02">{c.requirements}</BodyHeading>
            <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(10) }}>
              {structure.requirements.map(requirement => (
                <li key={requirement.poolRequirementId} data-testid={`syntx-structure-req-${requirement.poolRequirementId}`} data-necessity={requirement.necessityState.kind} data-level-state={requirement.requiredLevelState.kind} data-eligibility={requirement.matchingEligibility} data-finding-count={findingsFor(requirement.poolRequirementId).length} style={{ ...stack(5), paddingBottom: "10px", borderBottom: `1px solid ${azure(0.1)}` }}>
                  <span style={{ fontFamily: SANS, fontSize: "13.5px", fontWeight: 600, color: "#eef9ff" }}>{requirement.capabilityName}</span>
                  <span style={boundaryMeta}>{necessityLabel(requirement.necessityState)} · {t.level} {levelLabel(requirement.requiredLevelState)} · {t.weight} {requirement.weight} · {requirement.requirementTypeDeclared ? requirement.requirementType : `${requirement.requirementType} (${c.typeDefault})`} · {requirement.matchingEligibility}</span>
                  {requirement.evidence.map((line, index) => <p key={index} data-sx-pool-source style={sourceLine}>{line}</p>)}
                  {findingsFor(requirement.poolRequirementId).length > 0 && <div style={row(5)}>{findingsFor(requirement.poolRequirementId).map(finding => <LimitChip key={finding.code} rgb={AMBER_RGB} limit>{c.findingCodes[finding.code]}</LimitChip>)}</div>}
                </li>
              ))}
            </ul>
            <span style={boundaryMeta}>{c.source}</span>
          </div>
          {/* 03 · structural findings: facts of the declaration, never an assessment. */}
          <div data-sx-section="findings" data-testid="syntx-job-structure-findings" data-finding-count={structure.findings.length} style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="03">{c.findings}</BodyHeading>
            {structure.findings.length === 0 && <span style={boundaryMeta}>{c.noFindings}</span>}
            <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(6) }}>
              {structure.findings.map((finding, index) => (
                <li key={`${finding.code}:${finding.subject.id}:${index}`} data-testid={`syntx-structure-finding-${finding.code}`} data-subject={`${finding.subject.kind}:${finding.subject.id}`} style={stack(3)}>
                  <span style={boundaryMeta}><strong style={{ color: "#ffd696" }}>{c.findingCodes[finding.code]}</strong> · {finding.subject.kind} {finding.subject.id} · {finding.field}{finding.relatedRequirementIds.length > 0 ? ` · ${finding.relatedRequirementIds.join(", ")}` : ""}</span>
                  {finding.evidence.map((line, lineIndex) => <p key={lineIndex} style={sourceLine}>{line}</p>)}
                </li>
              ))}
            </ul>
            <span data-sx-boundary-statement style={boundaryStatement()}>{c.findingsStatement}</span>
          </div>
          {/* 04 · the authority: declared fields and their canonical validation only. */}
          <div data-sx-section="authority" data-testid="syntx-job-structure-authority" data-authority-state={structure.authority.authorityState} style={boundaryLayer(azure(0.85))}>
            <BodyHeading index="04">{c.authority}</BodyHeading>
            <div style={row(6)}>
              <LimitChip rgb={AMBER_RGB} limit>interpretation {structure.authority.interpretation}</LimitChip>
              <LimitChip rgb={AMBER_RGB} limit>{structure.authority.proposalState}</LimitChip>
              <LimitChip rgb={AMBER_RGB} limit>authority {structure.authority.authorityState}</LimitChip>
              <LimitChip rgb={AMBER_RGB} limit>scored false</LimitChip>
            </div>
            <span style={boundaryMeta}>{structure.authority.basis} · {structure.counts.requirements} {t.requirements.toLowerCase()} · {structure.counts.findings}</span>
            <span data-sx-boundary-statement style={boundaryStatement()}>{c.authorityStatement}</span>
          </div>
        </div>
      )}
    </section>
  );
}

type GeminiView = "SCOPE" | "ORIGINAL" | "PROCESSING" | "PROJECTION" | "EXCHANGES";
const GEMINI_VIEWS: GeminiView[] = ["SCOPE", "ORIGINAL", "PROCESSING", "PROJECTION", "EXCHANGES"];
const json = (value: unknown): string => { try { return JSON.stringify(value, null, 2) ?? "null"; } catch { return "—"; } };
type InspectorFetch = Parameters<typeof readGeminiResultInspection>[0];
const inspectorFetch: InspectorFetch = (input, init) => fetch(input, init);

/**
 * GEMINI OUTPUT · the Result Inspector (GELB lib/career/result-inspector/client.ts). The operator's token lives in this body's
 * memory only (never a URL, storage, cookie or attribute) and goes out per read as the header; closing the body unmounts it and
 * discards the token and every result. GET only, no retry. The original response is shown exactly as received, or NOT_RETAINED
 * literally — never a processed artifact in its place.
 */
export function GeminiOutputBody({ mode, t, investigation, fetcher = inspectorFetch }: { mode: SyntxMotionMode; t: SyntxCopy; investigation: SyntxInvestigationContext; fetcher?: InspectorFetch }) {
  const g = t.gemini;
  const [token, setToken] = useState("");
  const [inspection, setInspection] = useState<InspectorReadState<GeminiResultInspection> | { state: "LOADING" } | null>(null);
  const [exchanges, setExchanges] = useState<InspectorReadState<GeminiExchangeInspection> | { state: "LOADING" } | null>(null);
  const [view, setView] = useState<GeminiView>("ORIGINAL");
  const reads = useRef<AbortController[]>([]);
  useEffect(() => () => { reads.current.forEach(controller => controller.abort()); reads.current = []; }, []);
  const analysisId = investigation.analysisId;
  // A change of the analysis on view discards what was read for the earlier one.
  useEffect(() => { setInspection(null); setExchanges(null); }, [analysisId]);
  const begin = () => { const controller = new AbortController(); reads.current.push(controller); return controller; };
  const readInspection = () => {
    if (analysisId === null || token.length === 0) return;
    const controller = begin();
    setInspection({ state: "LOADING" }); setExchanges(null);
    void readGeminiResultInspection(fetcher, analysisId, token, controller.signal).then(next => { if (!controller.signal.aborted) setInspection(next); });
  };
  const exchangeJobId = inspection?.state === "AVAILABLE" ? inspection.value.jobId : investigation.jobId;
  const readExchanges = () => {
    if (exchangeJobId === null || token.length === 0) return;
    const controller = begin();
    setExchanges({ state: "LOADING" });
    void readGeminiExchangeInspection(fetcher, exchangeJobId, token, controller.signal).then(next => { if (!controller.signal.aborted) setExchanges(next); });
  };
  const result = inspection?.state === "AVAILABLE" ? inspection.value : null;
  const original = result?.originalGeminiResponse ?? null;
  /** A run older than its job was reused: this job made no Gemini call of its own (GEMINI_RESULT_INSPECTOR.md §2). */
  const reused = result !== null && result.investigationInput.jobCreatedAt !== null && Date.parse(result.investigationInput.discoveryRunCreatedAt) < Date.parse(result.investigationInput.jobCreatedAt);
  const unavailable = investigation.mode === "JOB" ? "NO_GEMINI" : analysisId === null ? "NO_ANALYSIS" : null;
  return (
    <section data-testid="syntx-gemini-output" data-inspection-state={unavailable ?? inspection?.state ?? "IDLE"} data-run-reused={reused ? "true" : "false"} data-investigation-mode={investigation.mode} data-analysis-id={analysisId ?? ""} data-view={view} data-sx-reveal="true" data-sx-surface="gemini" data-sx-panel="boundary" style={bodyStyle(true, mode)}>
      <span data-sx-kicker style={bodyKicker}>{g.title}</span>
      <span data-sx-boundary-orientation style={bodyOrientation}>{g.orientation}</span>
      {unavailable !== null && <StateStatement testId="syntx-gemini-unavailable" state={unavailable} rgb={AMBER_RGB}>{unavailable === "NO_GEMINI" ? g.noGemini : g.noAnalysis}</StateStatement>}
      {unavailable === null && (
        <>
          <div data-sx-section="access" style={{ ...boundaryLayer(azure(0.85)), gap: "8px" }}>
            <span style={boundaryMeta}>{g.analysis} {analysisId}{exchangeJobId !== null ? ` · ${g.job} ${exchangeJobId}` : ""}</span>
            <form onSubmit={event => { event.preventDefault(); readInspection(); }} style={{ ...row(8), flexWrap: "nowrap" }}>
              <label style={{ ...panelField, flex: 1, minWidth: 0 }}>{g.token}
                <input data-testid="syntx-gemini-token" type="password" autoComplete="off" spellCheck={false} value={token} onChange={event => setToken(event.target.value)} style={panelInput} />
              </label>
              <button data-testid="syntx-gemini-read" type="submit" disabled={token.length === 0 || inspection?.state === "LOADING"} style={{ ...panelAction(token.length > 0), alignSelf: "flex-end" }}>{inspection?.state === "LOADING" ? g.reading : g.read}</button>
            </form>
            <span style={{ ...boundaryMeta, fontSize: "10px", color: "rgba(170, 196, 214, 0.8)" }}>{g.tokenHint}</span>
          </div>
          {inspection !== null && inspection.state !== "AVAILABLE" && inspection.state !== "LOADING" && <StateStatement testId="syntx-gemini-state" state={inspection.state} rgb={AMBER_RGB}>{g.states[inspection.state]}</StateStatement>}
          {result !== null && (
            <>
              <div role="tablist" aria-label={g.title} style={row(6)}>
                {GEMINI_VIEWS.map(item => <button key={item} type="button" role="tab" data-testid={`syntx-gemini-view-${item}`} aria-selected={view === item} onClick={() => setView(item)} style={orientAction(view === item)}>{g.views[item]}</button>)}
              </div>
              {view === "SCOPE" && (
                <div data-sx-section="scope" data-testid="syntx-gemini-scope" data-scope-state={result.investigationInput.investigationScope.state} style={boundaryLayer(azure(0.85))}>
                  <BodyHeading index="01">{g.views.SCOPE}</BodyHeading>
                  <div style={row(6)}><LimitChip rgb={CYAN_RGB}>{g.mode} {result.investigationInput.investigationMode}</LimitChip>{result.investigationInput.jobScopeSelection !== null && <LimitChip rgb={CYAN_RGB}>{result.investigationInput.jobScopeSelection.poolRoleId}</LimitChip>}</div>
                  <span style={boundaryMeta}>{result.investigationInput.discoveryRunId} · {result.investigationInput.inference.provider} · {result.investigationInput.inference.model} · {result.investigationInput.schemaVersion} · kernel {result.investigationInput.kernel.kernelVersion}</span>
                  {result.investigationInput.investigationScope.state === "RETAINED" && <><span style={boundaryMeta}>{g.scopeText} · {result.investigationInput.investigationScope.textMatchesScopeHash ? "sha256 ✓" : "sha256 ✗"}</span><pre data-testid="syntx-gemini-scope-text" style={rawText}>{result.investigationInput.investigationScope.text}</pre></>}
                  {result.investigationInput.investigationScope.state === "NOT_RETAINED" && <span style={boundaryMeta}>{g.scopeNotRetained} · {result.investigationInput.investigationScope.scopeHash}</span>}
                  {result.investigationInput.investigationScope.state === "UNSCOPED" && <span style={boundaryMeta}>{g.unscoped}</span>}
                </div>
              )}
              {view === "ORIGINAL" && original !== null && (
                <div data-sx-section="original" data-testid="syntx-gemini-original" data-original-state={original.state} style={boundaryLayer(azure(0.85))}>
                  <BodyHeading index="02">{g.views.ORIGINAL}</BodyHeading>
                  {reused && <><LimitChip testId="syntx-gemini-reused" rgb={AMBER_RGB} limit>{g.reused}</LimitChip><span style={{ ...boundaryMeta, color: "#ffd696" }}>{g.reusedStatement}</span></>}
                  {original.state === "RETAINED" ? (
                    <>
                      <div style={row(6)}>
                        <LimitChip rgb={original.textMatchesSha256 ? GREEN_RGB : AMBER_RGB} limit={!original.textMatchesSha256}>sha256 {original.textMatchesSha256 ? "✓" : "✗"}</LimitChip>
                        <LimitChip rgb={original.parserResultMatchesText ? GREEN_RGB : AMBER_RGB} limit={!original.parserResultMatchesText}>parser = text {original.parserResultMatchesText ? "✓" : "✗"}</LimitChip>
                        {original.finishReason !== null && <LimitChip rgb={CYAN_RGB}>{original.finishReason}</LimitChip>}
                      </div>
                      <span style={boundaryMeta}>{g.verbatim} · {original.modelVersion ?? "—"} · {original.responseId ?? "—"} · {original.receivedAt} · {original.exchangeId}{original.attempt !== null ? ` · ${g.attemptOf} ${original.attempt.jobId} (lease ${original.attempt.leaseVersion ?? "—"})` : ""} · retained {original.retainedAt} → {original.expiresAt}</span>
                      <pre data-testid="syntx-gemini-original-text" style={rawText}>{original.text ?? ""}</pre>
                    </>
                  ) : (
                    <>
                      <LimitChip testId="syntx-gemini-not-retained" rgb={AMBER_RGB} limit>{g.notRetained}</LimitChip>
                      <span data-sx-boundary-statement style={boundaryStatement()}>{g.notRetainedStatement}</span>
                    </>
                  )}
                </div>
              )}
              {view === "PROCESSING" && (
                <div data-sx-section="processing" data-testid="syntx-gemini-processing" style={boundaryLayer(azure(0.85))}>
                  <BodyHeading index="03">{g.views.PROCESSING}</BodyHeading>
                  <span style={boundaryMeta}>{g.parser} · rawOutputHash {result.parserResult.rawOutputHash ?? "—"}</span>
                  <pre style={rawText}>{json(result.parserResult.kernelOutput)}</pre>
                  <span style={boundaryMeta}>{g.verification} · {result.evidenceVerification.candidates.length}</span>
                  <pre style={rawText}>{json(result.evidenceVerification.candidates)}</pre>
                  <span style={boundaryMeta}>{g.convergence} · {result.convergence.convergenceRunId} · {result.convergence.createdAt}</span>
                  <pre style={rawText}>{json(result.convergence.payload)}</pre>
                </div>
              )}
              {view === "PROJECTION" && (
                <div data-sx-section="projection" data-testid="syntx-gemini-projection" style={boundaryLayer(azure(0.85))}>
                  <BodyHeading index="04">{g.views.PROJECTION}</BodyHeading>
                  <span style={boundaryMeta}>{g.projection}</span>
                  <pre style={rawText}>{result.projection === null ? g.noProjection : json(result.projection)}</pre>
                </div>
              )}
              {view === "EXCHANGES" && (
                <div data-sx-section="exchanges" data-testid="syntx-gemini-exchanges" data-exchanges-state={exchanges?.state ?? "IDLE"} style={boundaryLayer(azure(0.85))}>
                  <BodyHeading index="05">{g.views.EXCHANGES}</BodyHeading>
                  <button data-testid="syntx-gemini-read-exchanges" type="button" disabled={exchanges?.state === "LOADING"} onClick={readExchanges} style={{ ...panelAction(true), alignSelf: "flex-start" }}>{exchanges?.state === "LOADING" ? g.reading : g.readExchanges}</button>
                  {exchanges !== null && exchanges.state !== "AVAILABLE" && exchanges.state !== "LOADING" && <span style={{ ...boundaryMeta, color: "#ffd696" }}>{g.states[exchanges.state]}</span>}
                  {exchanges?.state === "AVAILABLE" && exchanges.value.exchanges.length === 0 && <span data-testid="syntx-gemini-exchanges-empty" style={boundaryMeta}>{g.exchangesEmpty}{reused ? ` ${g.reusedStatement}` : ""}</span>}
                  {exchanges?.state === "AVAILABLE" && exchanges.value.exchanges.map(exchange => (
                    <div key={exchange.exchangeId} data-testid={`syntx-gemini-exchange-${exchange.exchangeId}`} data-outcome={exchange.outcome} data-error-code={exchange.errorCode ?? ""} style={stack(5)}>
                      <div style={row(6)}><LimitChip rgb={exchange.outcome === "COMPLETED" ? GREEN_RGB : AMBER_RGB} limit={exchange.outcome !== "COMPLETED"}>{exchange.outcome}</LimitChip>{exchange.errorCode !== null && <LimitChip rgb={AMBER_RGB} limit>{exchange.errorCode}</LimitChip>}</div>
                      <span style={boundaryMeta}>{exchange.runId} · lease {exchange.attempt?.leaseVersion ?? "—"} · {exchange.response.finishReason ?? "—"} · {exchange.retainedAt} → {exchange.expiresAt}</span>
                      <pre style={rawText}>{exchange.response.text ?? g.notRetained}</pre>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export function SyntxField({ workflow, analysisSource, observation: requested, onObserve, onSelectPool, onExit, locale = SIL_COPY.defaultLocale, jobScope = null, onSelectJobScope, onClearJobScope, capabilityAvailable = true, capabilityGatedHint, investigation: investigationContext, geminiOutputEnabled = SYNTX_GEMINI_OUTPUT_ENABLED }: SyntxFieldProps) {
  const t = SIL_COPY[locale].syntx;
  const tp: PoolCopy = SIL_COPY[locale].jobPool;
  const mode = useMotionMode();
  const rootRef = useRef<HTMLElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const size = useStageSize(stageRef);
  /** The orientation surface grows with the observation path and its state; the pool list opens below it, never over its actions
   *  (DEMO UI FIX, 2026-10-15: at a role the list covered HIDE GEMINI OUTPUT). The list keeps its place while the surface is short. */
  const orientRef = useRef<HTMLDivElement | null>(null);
  const poolsTop = Math.max(300, useOffsetBottom(orientRef) + 16);
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
  /** The investigation bodies (B2 / job structure) and GEMINI OUTPUT open at the centre like the boundary: one body at a time. */
  const [investigationOpen, setInvestigationOpen] = useState(false);
  const [geminiOpen, setGeminiOpen] = useState(false);
  const toggleBoundary = () => { setInvestigationOpen(false); setGeminiOpen(false); setBoundaryOpen(value => !value); };
  const toggleInvestigation = () => { setBoundaryOpen(false); setGeminiOpen(false); setInvestigationOpen(value => !value); };
  const toggleGemini = () => { setBoundaryOpen(false); setInvestigationOpen(false); setGeminiOpen(value => !value); };
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
  const investigation: SyntxInvestigationContext = investigationContext ?? { mode: "PERSON_X_JOB", analysisId: analysisSource.kind === "NONE" ? null : analysisSource.analysisId, analysisMode: null, jobId: null, scopeValid: jobScope !== null };
  const withheld = investigation.mode === "PERSON_X_JOB" ? investigation.comparisonWithheld ?? null : null;
  /** Role-bound: the bodies of PERSON × JOB (B2) and JOB (structure) belong to exactly the selected job, observed at its role. */
  const atSelectedJob = field !== null && jobScope !== null && investigation.scopeValid && jobScope.jobPoolUploadId === field.pool.jobPoolUploadId && (observation.kind === "ROLE" || observation.kind === "REQUIREMENT") && observation.roleId === jobScope.poolRoleId;
  const investigationBody: "COVERAGE" | "STRUCTURE" | null = !atSelectedJob ? null : investigation.mode === "PERSON_X_JOB" ? "COVERAGE" : investigation.mode === "JOB" ? "STRUCTURE" : null;
  const investigationVisible = investigationOpen && investigationBody !== null;
  // Read only while the body is open: closing discards, reopening reads again.
  const coverageRead = useSelectedRoleCoverage(investigationVisible && investigationBody === "COVERAGE" ? investigation.analysisId : null, investigationVisible && investigationBody === "COVERAGE" ? jobScope : null);
  const structureRead = useJobStructure(investigationVisible && investigationBody === "STRUCTURE" ? jobScope : null);
  const anyBodyOpen = boundaryOpen || investigationVisible || geminiOpen;
  /** NO ANALYSIS in PERSON × JOB: the one state line that asks for an action, shown as a signal (owner "SEMIONTIC REFINEMENT"). */
  const awaitingAnalysis = investigation.mode === "PERSON_X_JOB" && withheld === null && state === "NO_ANALYSIS";

  /** F-SX-1 (PINK, R8): when a return or an aperture close unmounts the focused sign, focus moves to the sign of the new observation point, else to the field root, so Escape keeps working at every level. */
  useEffect(() => {
    const root = rootRef.current;
    if (root === null || typeof document === "undefined") return;
    const active = document.activeElement;
    if (active !== null && active !== root && active !== document.body && root.contains(active)) return;
    // The investigation boundary is chosen at the shell: a keyboard choice that brings the Job Field in (JOB closes the Capability
    // Field) keeps the focus on the chosen option, so ←/Home keep steering the boundary (PINK O-MODE-KEYBOARD-FOCUS, §3.36).
    if (active instanceof Element && active.closest('[data-sx-shell="investigation"]') !== null) return;
    const target = (observedSignId === null ? null : root.querySelector<HTMLElement | SVGElement>(`[data-sign-id="${observedSignId}"]`)) ?? root;
    (target as HTMLElement).focus?.({ preventScroll: true });
  }, [observation.kind, observation.organizationId, observation.roleId, observation.requirementId, apertureOpen, observedSignId]);

  const onFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) { setFileName(null); setFileText(null); return; }
    setFileName(file.name);
    setFileText(await file.text());
  };

  /** Escape returns one level (R8); with an edge lens open it closes that first. A focus inside the closing surface moves to the
   *  field root first, so the next Escape still reaches the field. */
  const escapeOneLevel = () => {
    const active = typeof document === "undefined" ? null : document.activeElement;
    if (active instanceof HTMLElement && active.closest("[data-sx-panel]") !== null) rootRef.current?.focus({ preventScroll: true });
    if (intakeOpen) { setIntakeOpen(false); return; }
    if (geminiOpen) { setGeminiOpen(false); return; }
    if (investigationVisible) { setInvestigationOpen(false); return; }
    if (boundaryOpen) { setBoundaryOpen(false); return; }
    if (poolsOpen && selection.kind !== "NONE") { setPoolsOpen(false); return; }
    if (observation.kind !== "FIELD") onObserve(returnFrom(observation));
  };
  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    escapeOneLevel();
  };
  /** DEMO UI FIX (2026-10-15): a focus lost to the document (a control that closed with its surface) leaves Escape nowhere to go;
   *  while the field is open, an Escape on the bare document is the field's. Focus anywhere else keeps its own Escape, and a modal
   *  layer above the field (onboarding, System Codex, any aria-modal dialog) keeps the field still (GELB review of d9c7fea). */
  const escapeRef = useRef(escapeOneLevel);
  useEffect(() => { escapeRef.current = escapeOneLevel; });
  useEffect(() => {
    const onDocumentKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      const active = document.activeElement;
      if (active !== null && active !== document.body && active !== document.documentElement) return;
      if (document.querySelector(MODAL_LAYERS) !== null) return;
      event.preventDefault();
      rootRef.current?.focus({ preventScroll: true });
      escapeRef.current();
    };
    document.addEventListener("keydown", onDocumentKeyDown);
    return () => document.removeEventListener("keydown", onDocumentKeyDown);
  }, []);

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
      data-sx-field="job"
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
      data-investigation-mode={investigation.mode}
      data-analysis-boundary={withheld ?? (investigation.analysisMode ?? "")}
      data-investigation-body={investigationBody ?? ""}
      data-investigation-visible={investigationVisible ? "true" : "false"}
      data-gemini-output-visible={geminiOpen ? "true" : "false"}
      data-sx-ambient={SYNTX_AMBIENT_MOTION ? "on" : "off"}
      data-sx-resonance-breath={SYNTX_RESONANCE_BREATH_PROTOTYPE ? "prototype" : undefined}
      tabIndex={-1}
      onKeyDown={onKeyDown}
      style={{ position: "absolute", inset: 0, zIndex: 45, backgroundColor: "rgba(3, 5, 8, 0.9)", backgroundImage: JOB_FIELD_ATMOSPHERE, backdropFilter: "blur(8px)", fontFamily: MONO, color: INK, outline: "none", animation: mode === "LIVE" ? "sxEnter 620ms ease-out both" : undefined }}
    >
      <style>{SYNTX_CSS}</style>
      <div data-sx-brand-field="dll" aria-hidden="true" style={JOB_FIELD_BRAND_GRID} />
      <BrandFrame />

      {/* BR-4: the screen-reader summary of the observation point, generated from the same view model as the signs. */}
      <p data-testid="syntx-summary" data-summary-for={observationId} aria-live="polite" style={visuallyHidden}>{summary ?? ""}</p>

      {/* The stage: every level of the field and the aperture share one coordinate space (the whole field area, as the Capability Field's). */}
      <div ref={stageRef} data-testid="syntx-stage" style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        {field !== null && <FieldStage field={field} mode={mode} t={t} locale={locale} size={size} onObserve={onObserve} />}
        {resolution.stale !== null && <span data-testid="syntx-stale" data-stale-kind={resolution.stale.kind} data-stale-id={resolution.stale.id} data-sx-reveal="true" style={{ ...lens, ...prose, color: AMBER, position: "absolute", left: "50%", top: "calc(50% + 150px)", transform: "translateX(-50%)", width: "min(320px, 40%)", textAlign: "center", zIndex: 41 }}>{t.stale[resolution.stale.kind]}</span>}
        {state === "NO_POOL" && <NoPoolGiant copy={t.noPool} />}
        {investigation.mode !== "PERSON_X_JOB" && field !== null && <span data-testid="syntx-investigation-statement" data-investigation-mode={investigation.mode} style={{ ...micro, color: "rgba(196, 236, 248, 0.86)", position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 62px)", transform: "translateX(-50%)", width: "min(640px, 80%)", textAlign: "center", zIndex: 41 }}>{t.investigation.field[investigation.mode]}</span>}
        {withheld !== null && field !== null && (
          <span data-testid="syntx-analysis-boundary" data-boundary-state={withheld} data-analysis-pool={investigation.analysisPool ?? ""} style={{ ...micro, color: AMBER, position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 64px)", transform: "translateX(-50%)", width: "min(560px, 80%)", textAlign: "center", zIndex: 46, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span>{t.investigation.withheld[withheld]}{withheld === "OTHER_POOL" && investigation.analysisPool ? ` ${listed.find(pool => pool.jobPoolUploadId === investigation.analysisPool)?.poolName ?? investigation.analysisPool}` : ""}</span>
            {withheld === "OTHER_POOL" && investigation.onOpenAnalysisPool && <button data-testid="syntx-analysis-pool-open" data-sx-orient-action onClick={investigation.onOpenAnalysisPool} style={{ ...orientAction(false), fontSize: "10px", letterSpacing: "1.3px", padding: "4px 12px" }}>{t.investigation.openAnalysisPool}</button>}
          </span>
        )}
        {investigation.mode === "PERSON_X_JOB" && withheld === null && state === "NO_ANALYSIS" && field !== null && <span data-testid="syntx-no-analysis" style={{ position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 64px)", transform: "translateX(-50%)", width: "min(620px, 80%)", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", textAlign: "center", zIndex: 41 }}><MessageVoices copy={tp.analysisNone} /></span>}
      </div>

      {/* Orientation surface: (A) the field and its relation to the Capability Field, (B) the observation path (each step a return),
          (C) the read state, (D) the keys, (E) the edge actions. The one header that is always visible (§12.2): a calm, lit glass at
          the edge; its only motion is one light pass on each context change (finite, none in REDUCED). */}
      <div ref={orientRef} data-sx-surface="header" data-sx-orient data-sx-resonance={anyBodyOpen ? "retreated" : "inactive"} style={{ position: "absolute", left: "28px", top: "84px", display: "flex", flexDirection: "column", zIndex: 47, width: "min(340px, 28vw)", boxSizing: "border-box", padding: "12px 14px 12px 16px", borderRadius: "14px", border: `1px solid ${azure(0.2)}`, background: `radial-gradient(120% 90% at 0% 0%, rgba(84, 232, 236, 0.1), transparent 55%), linear-gradient(160deg, rgba(12, 31, 47, 0.7), rgba(5, 14, 24, 0.62))`, boxShadow: `0 0 0 1px rgba(1, 5, 10, 0.45), 0 0 34px rgba(64, 190, 230, 0.1), 0 0 70px rgba(64, 190, 230, 0.04), 0 14px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(210, 248, 255, 0.13), inset 0 0 0 1px rgba(170, 235, 255, 0.035)`, backdropFilter: "blur(8px)" }}>
        <span aria-hidden="true" style={{ position: "absolute", right: "-1px", top: "22px", width: 0, height: 0, pointerEvents: "none" }}>
          <span style={{ position: "absolute", left: 0, top: "-0.5px", width: "38px", height: "1px", background: `linear-gradient(90deg, ${azure(0.5)}, transparent)` }} />
          <span style={{ position: "absolute", left: "-2.5px", top: "-2.5px", width: "5px", height: "5px", borderRadius: "50%", background: "#bff4ff", boxShadow: `0 0 7px ${azure(0.85)}, 0 0 14px ${azure(0.35)}` }} />
        </span>
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: "14px", bottom: "14px", width: "2px", borderRadius: "2px", background: `linear-gradient(180deg, ${CYAN}, ${azure(0.35)} 60%, transparent)`, boxShadow: `0 0 8px ${azure(0.5)}`, pointerEvents: "none" }} />
        <span aria-hidden="true" style={{ position: "absolute", left: 0, right: 0, top: 0, height: "100%", overflow: "hidden", borderRadius: "inherit", pointerEvents: "none" }}>
          <span key={`${observation.kind}:${observationId}`} data-sx-orient-pass style={{ position: "absolute", top: 0, bottom: 0, left: 0, width: "45%", background: "linear-gradient(90deg, transparent, rgba(170, 240, 255, 0.09), transparent)", animation: mode === "LIVE" ? "sxOrientPass 1.6s cubic-bezier(0.16, 1, 0.3, 1) both" : undefined }} />
        </span>
        {/* A · where: the field, and the way back to the Capability Field. */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
          <h3 style={{ ...label, display: "inline-flex", alignItems: "center", gap: "8px", color: CYAN, fontSize: "12px", letterSpacing: "2px", textShadow: `0 0 14px ${SIL_TOKENS.colors.cyanGlowStrong}` }}><span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", background: CYAN, boxShadow: `0 0 8px ${CYAN}, 0 0 16px ${azure(0.5)}` }} />{t.title}</h3>
          <button data-testid="syntx-exit-btn" data-sx-orient-action data-field-gate={capabilityAvailable ? "OPEN" : "AWAITING_JOB"} disabled={!capabilityAvailable || undefined} aria-disabled={!capabilityAvailable || undefined} title={capabilityAvailable ? undefined : capabilityGatedHint} onClick={onExit} style={{ ...action("muted"), opacity: capabilityAvailable ? 1 : 0.42, cursor: capabilityAvailable ? "pointer" : "not-allowed", fontSize: "9.5px", letterSpacing: "0.8px", padding: "3px 9px", borderRadius: "999px", border: `1px solid ${azure(0.22)}`, color: "rgba(168, 206, 226, 0.82)" }}>{t.exit}</button>
        </div>
        {/* B · the active context: the observation path on its rail. */}
        <nav data-testid="syntx-path" aria-label={t.observation[observation.kind]} style={{ ...row(6), rowGap: "3px", marginTop: "10px", paddingLeft: "10px", borderLeft: `1px solid ${azure(0.3)}` }}>
          {path.map((step, index) => (
            <React.Fragment key={step.kind}>
              {index > 0 && <span aria-hidden="true" style={{ fontFamily: SANS, fontSize: "11.5px", color: "rgba(140, 180, 204, 0.5)" }}>›</span>}
              <button data-testid={`syntx-path-${step.kind}`} data-sx-orient-step data-current={index === path.length - 1 ? "true" : "false"} disabled={index === path.length - 1} onClick={() => onObserve(step.target)} style={{ ...ghost, fontFamily: SANS, fontSize: index === path.length - 1 ? "13px" : "11.5px", fontWeight: index === path.length - 1 ? 600 : 400, color: index === path.length - 1 ? "#f2fbff" : "rgba(170, 198, 216, 0.78)", cursor: index === path.length - 1 ? "default" : "pointer", textTransform: "none", letterSpacing: "0.1px", lineHeight: 1.45, padding: "1px 0", maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: index === path.length - 1 ? "normal" : "nowrap", textAlign: "left", transition: "color .3s ease" }} title={step.name}>{step.name}</button>
            </React.Fragment>
          ))}
          {observation.kind !== "FIELD" && <button data-testid="syntx-return-btn" data-sx-orient-action onClick={() => onObserve(returnFrom(observation))} style={{ ...action("cyan"), fontSize: "9.5px", letterSpacing: "1.3px", padding: "2px 8px", borderRadius: "999px", border: "1px solid rgba(56, 229, 255, 0.4)", background: "rgba(56, 229, 255, 0.06)" }}>← {t.returnLabel}</button>}
        </nav>
        {/* C · the read state, D · the keys. */}
        {awaitingAnalysis ? (
          <span data-testid="syntx-state" data-state={state} data-sx-signal="awaiting-analysis" style={{ position: "relative", alignSelf: "stretch", display: "flex", alignItems: "flex-start", gap: "11px", marginTop: "12px", padding: "11px 14px 12px 12px", borderRadius: "12px", border: `1px solid rgba(${AMBER_RGB}, 0.5)`, background: `radial-gradient(120% 140% at 0% 0%, rgba(${AMBER_RGB}, 0.16), transparent 60%), rgba(28, 18, 6, 0.55)`, boxShadow: "inset 0 1px 0 rgba(255, 222, 170, 0.1)" }}>
            <span data-sx-signal-aura aria-hidden="true" style={{ position: "absolute", inset: "-1px", borderRadius: "inherit", pointerEvents: "none", opacity: 0.5, boxShadow: `0 0 0 1px rgba(${AMBER_RGB}, 0.22), 0 0 14px 1px rgba(${AMBER_RGB}, 0.3), 0 0 32px 4px rgba(${AMBER_RGB}, 0.12)` }} />
            <span aria-hidden="true" style={{ position: "relative", flexShrink: 0, width: "14px", height: "14px", marginTop: "1px", display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", border: `1px solid rgba(${AMBER_RGB}, 0.38)` }}>
              <span data-sx-signal-core style={{ width: "7px", height: "7px", transformOrigin: "50% 50%", borderRadius: "50%", background: AMBER, boxShadow: `0 0 7px ${AMBER}, 0 0 16px rgba(${AMBER_RGB}, 0.55)` }} />
            </span>
            <span style={{ display: "flex", flexDirection: "column", gap: "5px", minWidth: 0 }}><MessageVoices copy={tp.analysisNone} /></span>
          </span>
        ) : (
          <span data-testid="syntx-state" data-state={state} style={{ ...micro, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: "8px", marginTop: "10px", padding: "3px 10px 3px 8px", borderRadius: "999px", fontSize: "10px", letterSpacing: "1.3px", color: state === "AVAILABLE" ? "rgba(196, 236, 248, 0.92)" : AMBER, border: `1px solid ${state === "AVAILABLE" ? "rgba(56, 229, 255, 0.28)" : "rgba(245, 166, 35, 0.4)"}`, background: state === "AVAILABLE" ? "rgba(56, 229, 255, 0.06)" : "rgba(245, 166, 35, 0.07)" }}>
            <span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: state === "AVAILABLE" ? CYAN : AMBER, boxShadow: `0 0 6px ${state === "AVAILABLE" ? CYAN : AMBER}`, flexShrink: 0 }} />
            {investigation.mode !== "PERSON_X_JOB" && state !== "NO_POOL" ? t.investigation.state[investigation.mode] : withheld !== null && state !== "NO_POOL" ? t.investigation.withheld[withheld] : state === "AVAILABLE" ? t.matching : state === "NO_POOL" ? tp.selectionNone : state === "NO_ANALYSIS" ? tp.analysisNone : state === "LOADING" ? tp.matchesLoading : state === "NOT_FOUND" ? tp.matchesNotFound : state === "INACTIVE_POOL" ? tp.matchesInactive : state === "NOT_PROVISIONED" ? tp.notProvisioned : tp.matchesFailed}
          </span>
        )}
        {/* C' · the job scope: the observed role becomes the selected job only by this explicit action (SFE invariant). */}
        {field !== null && onSelectJobScope !== undefined && (observation.kind === "ROLE" || observation.kind === "REQUIREMENT") && observation.roleId !== null && (() => {
          const scopeHere = jobScope !== null && jobScope.jobPoolUploadId === field.pool.jobPoolUploadId && jobScope.poolRoleId === observation.roleId;
          const roleId = observation.roleId;
          const removable = scopeHere && onClearJobScope !== undefined;
          const select = <button data-testid="syntx-job-scope-select" data-sx-orient-action data-job-scope-selected={scopeHere ? "true" : "false"} aria-pressed={scopeHere} disabled={scopeHere} onClick={() => onSelectJobScope(roleId)} style={{ ...orientAction(scopeHere), alignSelf: "flex-start", marginTop: removable ? 0 : "10px", fontSize: "10.5px", letterSpacing: "1.5px", padding: "5px 12px", color: scopeHere ? "#e9fbff" : CYAN, border: `1px solid ${scopeHere ? "rgba(56, 229, 255, 0.7)" : "rgba(56, 229, 255, 0.45)"}`, background: scopeHere ? "rgba(56, 229, 255, 0.16)" : "rgba(56, 229, 255, 0.06)", cursor: scopeHere ? "default" : "pointer" }}>{scopeHere ? t.jobScope.selected : t.jobScope.select}</button>;
          if (!removable) return select;
          // G-05: the selected job is removed only here, by this explicit action (beside the selection it reverses).
          return <div style={{ ...row(6), alignSelf: "flex-start", marginTop: "10px" }}>{select}<button data-testid="syntx-job-scope-clear" data-sx-orient-action title={t.jobScope.clearHint} onClick={onClearJobScope} style={{ ...orientAction(false), fontSize: "10.5px", letterSpacing: "1.5px", padding: "5px 12px" }}>{t.jobScope.clear}</button></div>;
        })()}
        <span style={{ ...micro, marginTop: "8px", fontSize: "9px", letterSpacing: "0.1px", color: "rgba(150, 180, 198, 0.78)" }}>{t.keys.split(" · ").map((part, index) => { const gap = part.indexOf(" "); const key = gap < 0 ? part : part.slice(0, gap); return <React.Fragment key={index}>{index > 0 && <span style={{ color: "rgba(120, 160, 184, 0.45)" }}> · </span>}<kbd style={{ fontFamily: MONO, fontSize: "8.5px", padding: "0 4px", borderRadius: "4px", border: "1px solid rgba(150, 205, 230, 0.28)", background: "rgba(255, 255, 255, 0.04)", boxShadow: "inset 0 -1px 0 rgba(0, 0, 0, 0.45)", color: "rgba(224, 240, 248, 0.92)" }}>{key}</kbd>{gap < 0 ? "" : part.slice(gap)}</React.Fragment>; })}</span>
        {/* E · the edge actions (panels open / closed). */}
        <div style={{ ...row(6), marginTop: "10px", paddingTop: "10px", borderTop: "1px solid transparent", borderImage: `linear-gradient(90deg, ${azure(0.24)}, ${azure(0.03)}) 1` }}>
          <button data-testid="syntx-pools-toggle" data-sx-orient-action aria-expanded={poolsVisible} onClick={() => setPoolsOpen(value => !value)} style={orientAction(poolsVisible)}>{poolsVisible ? t.poolsHide : `⬡ ${t.pools}${listed.length > 0 ? ` · ${listed.length}` : ""}`}</button>
          <button data-testid="job-pool-intake-toggle" data-sx-orient-action aria-expanded={intakeVisible} onClick={() => setIntakeOpen(value => !value)} style={orientAction(intakeVisible)}>{intakeVisible ? tp.intakeHide : tp.intakeOpen}</button>
          {field !== null && field.boundary !== null && <button data-testid="syntx-boundary-toggle" data-sx-orient-action aria-expanded={boundaryOpen} onClick={toggleBoundary} style={orientAction(boundaryOpen)}>{boundaryOpen ? t.boundaryHide : t.boundary}</button>}
          {investigationBody !== null && <button data-testid="syntx-investigation-toggle" data-sx-orient-action data-investigation-body={investigationBody} aria-expanded={investigationVisible} onClick={toggleInvestigation} style={orientAction(investigationVisible)}>{investigationBody === "COVERAGE" ? (investigationVisible ? t.coverage.hide : t.coverage.toggle) : (investigationVisible ? t.structure.hide : t.structure.toggle)}</button>}
          {geminiOutputEnabled && <button data-testid="syntx-gemini-output-toggle" data-sx-orient-action aria-expanded={geminiOpen} onClick={toggleGemini} style={orientAction(geminiOpen)}>{geminiOpen ? t.gemini.hide : t.gemini.toggle}</button>}
        </div>
      </div>

      {/* Edge aperture: the persisted uploads (explicit selection only); the contextual action while nothing is at the field. */}
      <div data-testid="job-pool-list" data-pool-count={listed.length} data-list-state={workflow.pools.state} hidden={!poolsVisible} data-sx-reveal={poolsVisible ? "true" : undefined} data-sx-surface="pools" data-sx-panel="pools" style={{ ...panel, display: poolsVisible ? "flex" : "none", flexDirection: "column", gap: "12px", left: "28px", top: `${poolsTop}px`, width: "min(316px, 27vw)", maxHeight: `max(160px, calc(100vh - ${poolsTop + 120}px))`, overflowY: "auto", zIndex: 46 }}>
        <PanelNode side="right" top="26px" />
        <span data-sx-kicker style={panelKicker()}>{tp.pools}</span>
        {(workflow.pools.state === "IDLE" || workflow.pools.state === "LOADING") && <span data-testid="job-pool-list-loading" style={{ ...micro, color: AMBER }}>{tp.poolsLoading}</span>}
        {workflow.pools.state === "EMPTY" && <span data-testid="job-pool-list-empty" style={micro}>{tp.poolsEmpty}</span>}
        {workflow.pools.state === "NOT_PROVISIONED" && <span data-testid="job-pool-list-not-provisioned" style={{ ...micro, color: AMBER }}>{tp.notProvisioned}</span>}
        {workflow.pools.state === "FAILED" && <span data-testid="job-pool-list-failed" style={{ ...micro, color: AMBER }}>{tp.poolsFailed}{workflow.pools.code ? ` · ${workflow.pools.code}` : ""}</span>}
        {selection.kind === "NOT_LISTED" && <span data-testid="job-pool-selection-not-listed" style={{ ...micro, color: AMBER }}>{tp.selectionNotListed} · {selection.jobPoolUploadId}</span>}
        <ul style={{ margin: 0, padding: 0, listStyle: "none", ...stack(4) }}>
          {listed.map((pool, index) => {
            const selected = pool.jobPoolUploadId === workflow.selectedJobPoolUploadId;
            return (
              <li key={pool.jobPoolUploadId} data-testid={`job-pool-item-${pool.jobPoolUploadId}`} data-selected={selected ? "true" : "false"} data-pool-status={pool.poolStatus} data-delivered-index={index + 1} style={{ position: "relative", display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto", columnGap: "12px", rowGap: "5px", alignItems: "center", padding: "11px 12px 11px 24px", borderRadius: "10px", border: `1px solid ${selected ? "rgba(56, 229, 255, 0.3)" : "transparent"}`, background: selected ? "linear-gradient(100deg, rgba(56, 229, 255, 0.1), rgba(56, 229, 255, 0.025) 72%, transparent)" : "transparent", boxShadow: selected ? "0 0 20px rgba(56, 229, 255, 0.08), inset 0 1px 0 rgba(200, 248, 255, 0.08)" : "none" }}>
                <span style={{ display: "contents" }}>
                  <span style={{ gridColumn: 1, gridRow: 1, minWidth: 0, fontFamily: SANS, fontSize: "14px", fontWeight: selected ? 600 : 500, lineHeight: 1.3, letterSpacing: "0.1px", color: selected ? "#f4fcff" : "rgba(222, 236, 245, 0.88)", textShadow: selected ? "0 0 14px rgba(56, 229, 255, 0.25)" : "none" }}>{pool.poolName}</span>
                  <span style={{ gridColumn: "1 / -1", gridRow: 2, fontFamily: MONO, fontSize: "10px", letterSpacing: "0.5px", lineHeight: 1.5, color: pool.poolStatus === "ACTIVE" ? (selected ? "rgba(170, 214, 232, 0.86)" : "rgba(140, 170, 190, 0.74)") : AMBER, wordBreak: "break-word" }}>v{pool.poolVersion} · {pool.poolStatus} · {pool.organizationCount} org · {pool.roleCount} roles · {pool.requirementCount} req</span>
                </span>
                <button data-testid={`job-pool-select-${pool.jobPoolUploadId}`} disabled={selected} aria-pressed={selected} onClick={() => { rootRef.current?.focus({ preventScroll: true }); onSelectPool(pool.jobPoolUploadId); setPoolsOpen(false); }} style={{ ...action("cyan", true), gridColumn: 2, gridRow: 1, justifySelf: "end", minWidth: "84px", boxSizing: "border-box", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "9.5px", letterSpacing: "1.5px", padding: "5px 10px", borderRadius: "999px", cursor: selected ? "default" : "pointer", color: selected ? "#e4fbff" : "rgba(56, 229, 255, 0.88)", border: `1px solid ${selected ? "rgba(56, 229, 255, 0.62)" : azure(0.26)}`, background: selected ? "linear-gradient(180deg, rgba(56, 229, 255, 0.2), rgba(56, 229, 255, 0.08))" : "rgba(4, 14, 24, 0.6)", boxShadow: selected ? "0 0 14px rgba(56, 229, 255, 0.2), inset 0 1px 0 rgba(220, 250, 255, 0.18)" : "none", textShadow: selected ? `0 0 8px ${SIL_TOKENS.colors.cyanGlow}` : "none", transition: "border-color .3s ease, background .3s ease, color .3s ease" }}>{selected && <span aria-hidden="true" style={{ width: "5px", height: "5px", borderRadius: "50%", background: CYAN, boxShadow: `0 0 6px ${CYAN}` }} />}{selected ? tp.selected : tp.select}</button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Edge aperture: intake (the one client write), opened only on explicit action. */}
      <section data-testid="job-pool-upload" hidden={!intakeVisible} data-sx-reveal={intakeVisible ? "true" : undefined} data-sx-panel="intake" style={{ ...panel, display: intakeVisible ? "flex" : "none", flexDirection: "column", gap: "12px", right: "28px", top: "150px", width: "min(316px, 27vw)", zIndex: 46 }}>
        <PanelNode side="left" top="26px" />
        <span data-sx-kicker style={panelKicker()}>{tp.intake} · {tp.upload}</span>
        <label style={panelField}>{tp.uploader}
          <input data-testid="job-pool-actor-input" value={actorId} onChange={event => setActorId(event.target.value)} style={panelInput} />
        </label>
        <label style={panelField}>{tp.chooseFile}
          <span style={{ display: "block", padding: "8px 10px", borderRadius: "9px", border: `1px dashed ${azure(0.3)}`, background: `radial-gradient(120% 90% at 50% 0%, ${azure(0.06)}, transparent 70%), rgba(2, 9, 16, 0.5)` }}>
            <input data-testid="job-pool-file-input" type="file" accept="application/json,.json" onChange={event => { void onFile(event); }} style={{ ...panelInput, border: "none", background: "transparent", boxShadow: "none", padding: 0, fontSize: "11px", color: "rgba(160, 186, 204, 0.82)" }} />
          </span>
        </label>
        <span data-testid="job-pool-file-name" style={{ ...panelMeta, display: "flex", alignItems: "center", gap: "8px", color: fileName ? INK : "rgba(160, 186, 204, 0.82)" }}><span aria-hidden="true" style={{ width: "6px", height: "6px", borderRadius: "50%", flexShrink: 0, border: `1px solid ${fileName ? MINT : NEUTRAL}`, background: fileName ? MINT : "transparent", boxShadow: fileName ? `0 0 6px ${MINT}` : "none" }} />{fileName ?? tp.noFile}</span>
        <button data-testid="job-pool-upload-btn" disabled={!canUpload} onClick={() => { if (fileText !== null) void workflow.submitUpload(fileText, actorId); }} style={{ ...panelAction(canUpload), alignSelf: "flex-start" }}>
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

      {/* The boundary as its own field level: while it is open the field recedes behind a quiet veil (above every sign, below the
          edge surfaces, transparent to the pointer), and the boundary opens at the centre as a governance body. */}
      {field !== null && field.boundary !== null && <div data-sx-boundary-veil aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 44, pointerEvents: "none", opacity: boundaryOpen ? 1 : 0, background: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(2, 9, 16, 0.4), rgba(1, 4, 9, 0.66) 100%)", backdropFilter: boundaryOpen ? "blur(1.5px) saturate(0.8)" : "none", transition: "opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)" }} />}
      {field !== null && field.boundary !== null && matching !== null && view !== null && (
        <section data-testid="job-pool-matches" data-matches-state={workflow.matches.state} data-ranking={describeRanking(matching.roleMatches)} hidden={!boundaryOpen} data-sx-reveal={boundaryOpen ? "true" : undefined} data-sx-surface="boundary" data-sx-panel="boundary" style={{ ...panel, ...BOUNDARY_BODY, display: boundaryOpen ? "flex" : "none", flexDirection: "column", gap: "16px", left: 0, right: 0, margin: "0 auto", top: "96px", width: "max(340px, min(760px, calc(100vw - 768px)))", maxHeight: "calc(100vh - 208px)", overflowY: "auto", zIndex: 46, animation: mode === "LIVE" && boundaryOpen ? "sxBoundaryOpen 0.6s cubic-bezier(0.16, 1, 0.3, 1) both, sxBoundaryHalo 28s ease-in-out -7s infinite" : undefined }}>
          <span data-sx-kicker style={{ ...panelKicker(`rgba(${AMBER_RGB}, 0.85)`), fontSize: "12px", letterSpacing: "3.2px", color: "#e4f4fb" }}>{t.boundary}</span>
          {/* The orientation sentence: what this body is. It sits in the space the kicker gave up (padding 22 → 13), so the body and
              its layers keep their exact boxes. */}
          <span data-sx-boundary-orientation style={{ fontFamily: SANS, fontSize: "11.5px", lineHeight: "13px", letterSpacing: "0.2px", color: "rgba(204, 230, 242, 0.9)", margin: "-12px 0 -6px 0" }}>{t.boundaryOrientation}</span>
          <div data-sx-boundary-layers style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "12px" }}>
            {/* 1 · the presentation: what this field is and is not (its authority boundary) and how it is ordered. */}
            <div data-sx-section="presentation" style={boundaryLayer(azure(0.85))}>
              <span data-sx-boundary-heading style={boundaryHeading(azure(0.8))}><span aria-hidden="true">01</span>{tp.boundaryPresentation}</span>
              <div data-testid="job-pool-presentation-labels" data-policy-version={field.boundary.policyVersion} data-authority-state={field.boundary.authorityState} style={row(6)}>
                {field.boundary.labels.map(item => <span key={item} data-testid={`job-pool-label-${item}`} data-sx-boundary-limit={item.startsWith("NOT_") ? "true" : undefined} style={boundaryChip(item.startsWith("NOT_") ? AMBER_RGB : CYAN_RGB)}><span aria-hidden="true" style={chipDot(item.startsWith("NOT_") ? AMBER_RGB : CYAN_RGB)} />{tp.labels[item]}</span>)}
              </div>
              <span data-testid="job-pool-ranking" data-ranking={describeRanking(matching.roleMatches)} style={boundaryMeta}>{tp.ranking[describeRanking(matching.roleMatches)]}</span>
            </div>
            {/* 2 · canonical mapping: its states, then the statement that bounds it. */}
            <div data-sx-section="mapping" style={boundaryLayer(azure(0.85))}>
              <span data-sx-boundary-heading style={boundaryHeading(azure(0.8))}><span aria-hidden="true">02</span>{tp.canonicalMapping}</span>
              <div data-testid="job-pool-canonical-mapping" data-mapping-state={view.canonicalMapping.mappingState} data-proposal-state={view.canonicalMapping.proposalState} data-authority-state={view.canonicalMapping.authorityState} style={row(6)}>
                <span style={boundaryChip(GREEN_RGB)}><span aria-hidden="true" style={chipDot(GREEN_RGB)} />{view.canonicalMapping.mappingState}</span><span style={boundaryChip(AMBER_RGB)}><span aria-hidden="true" style={chipDot(AMBER_RGB)} />{view.canonicalMapping.proposalState}</span><span data-sx-boundary-limit="true" style={boundaryChip(AMBER_RGB)}><span aria-hidden="true" style={chipDot(AMBER_RGB)} />authority {view.canonicalMapping.authorityState}</span>
              </div>
              <span data-sx-boundary-statement style={boundaryStatement()}>{tp.canonicalMappingBoundary}</span>
            </div>
            {/* 3 · the capability sweep: its state line, then what sweep coverage is and is not. */}
            <div data-sx-section="sweep" data-testid="job-pool-capability-sweep" data-sweep-state={field.boundary.capabilitySweep.state} data-proposal-count={field.boundary.capabilitySweep.proposalCount} data-scored="false" style={boundaryLayer(azure(0.85))}>
              <span data-sx-boundary-heading style={boundaryHeading(azure(0.8))}><span aria-hidden="true">03</span>{tp.sweep}</span>
              <span style={boundaryMeta}><span aria-hidden="true" style={{ ...chipDot(field.boundary.capabilitySweep.state === "AVAILABLE" ? CYAN_RGB : AMBER_RGB), marginRight: "7px", verticalAlign: "1px" }} />{tp.sweepStates[field.boundary.capabilitySweep.state]} · {tp.sweepProposals} {field.boundary.capabilitySweep.proposalCount} · <span data-sx-boundary-limit="true" style={{ ...boundaryChip(AMBER_RGB), padding: "1px 7px", fontSize: "9.5px", verticalAlign: "1px" }}>{tp.unscored}</span></span>
              <span data-sx-boundary-statement style={boundaryStatement()}>{tp.sweepBoundary}</span>
            </div>
            {/* 4 · gaps: the read's parameters, then what missing requirements are. */}
            <div data-sx-section="gaps" style={boundaryLayer(azure(0.85))}>
              <span data-sx-boundary-heading style={boundaryHeading(azure(0.8))}><span aria-hidden="true">04</span>{tp.missing}</span>
              <span style={boundaryMeta}>{tp.candidateCapabilities} {field.boundary.candidateCapabilityCount} · {tp.weakThreshold} {field.boundary.weakEvidenceThreshold}</span>
              <span data-sx-boundary-statement style={boundaryStatement()}>{tp.missingBoundary}</span>
            </div>
          </div>
        </section>
      )}

      {/* The investigation bodies and GEMINI OUTPUT: the same field level as the boundary (veil below the edge surfaces, body at the centre). */}
      {(investigationVisible || geminiOpen) && <div data-sx-boundary-veil aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 44, pointerEvents: "none", opacity: 1, background: "radial-gradient(ellipse 70% 65% at 50% 50%, rgba(2, 9, 16, 0.4), rgba(1, 4, 9, 0.66) 100%)", backdropFilter: "blur(1.5px) saturate(0.8)" }} />}
      {investigationVisible && investigationBody === "COVERAGE" && <CoverageBody open mode={mode} t={t} read={coverageRead} hasAnalysis={investigation.analysisId !== null} />}
      {investigationVisible && investigationBody === "STRUCTURE" && <StructureBody open mode={mode} t={t} read={structureRead} />}
      {geminiOutputEnabled && geminiOpen && <GeminiOutputBody mode={mode} t={t} investigation={investigation} />}

      {/* Field-edge semantic line: the laws of the field, always visible, never in the way. */}
      <span data-testid="job-pool-non-claims" style={{ position: "absolute", left: "50%", bottom: "calc(var(--condyn-page-header-height, 60px) + 22px)", transform: "translateX(-50%)", maxWidth: "min(960px, 84vw)", textAlign: "center", ...micro, fontSize: "9.5px", letterSpacing: "1.2px", color: "rgba(230, 241, 248, 0.7)", zIndex: 46 }}>{t.nonClaims}</span>
    </section>
  );
}
