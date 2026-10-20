"use client";

import React from "react";
import { SIL_RED_FIELD_TYPE, SIL_TOKENS } from "./SILTokens";
import { SyntxResonanceBody } from "./manifestation/SyntxResonanceBody";
import { syntxHudPlacementStyle } from "./manifestation/SyntxHudSurface";
import { SilSourcePresentation } from "../../../../lib/career/view-model/source-presentation";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";
import {
  resolveSilFocusedManifestationPresentation,
  type SilFocusedManifestationPlacement
} from "../../../../lib/career/view-model/focused-orbit-placement";

export type HudPlacement = SilFocusedManifestationPlacement;

export function getTooltipPlacement(angle?: number, stageId?: string): HudPlacement {
  return resolveSilFocusedManifestationPresentation(
    stageId,
    angle
  ).placement;
}

function getTooltipStyle(placement: HudPlacement): React.CSSProperties {
  return syntxHudPlacementStyle(placement);
}

export function renderSemioticSignature(stageId: string, isHighlighted: boolean) {
  const strokeColor = isHighlighted ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.45)";
  const amberColor = isHighlighted ? "#ffb338" : "rgba(255, 179, 56, 0.55)";

  switch (stageId) {
    case "01":
      return (
        <svg
          data-testid="semiotic-signature-01"
          width="130"
          height="130"
          style={{ position: "absolute", top: "19px", left: "19px", pointerEvents: "none", zIndex: 0, opacity: 0.85 }}
        >
          <circle cx="65" cy="65" r="54" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 3" />
          <circle cx="65" cy="65" r="40" fill="none" stroke={strokeColor} strokeWidth="1.2" />
          <circle cx="65" cy="65" r="24" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="6 4" />
        </svg>
      );
    case "02":
      return (
        <svg
          data-testid="semiotic-signature-02"
          width="130"
          height="130"
          style={{ position: "absolute", top: "19px", left: "19px", pointerEvents: "none", zIndex: 0, opacity: 0.85 }}
        >
          <polygon points="65,15 110,48 93,105 37,105 20,48" fill="none" stroke={strokeColor} strokeWidth="1.2" />
          <line x1="65" y1="15" x2="93" y2="105" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="65" y1="15" x2="37" y2="105" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 2" />
          <line x1="20" y1="48" x2="110" y2="48" stroke={strokeColor} strokeWidth="0.8" strokeDasharray="2 2" />
          <circle cx="65" cy="15" r="3" fill={strokeColor} />
          <circle cx="110" cy="48" r="3" fill={strokeColor} />
          <circle cx="93" cy="105" r="3" fill={strokeColor} />
          <circle cx="37" cy="105" r="3" fill={strokeColor} />
          <circle cx="20" cy="48" r="3" fill={strokeColor} />
        </svg>
      );
    case "03":
      return (
        <svg
          data-testid="semiotic-signature-03"
          width="130"
          height="130"
          style={{ position: "absolute", top: "19px", left: "19px", pointerEvents: "none", zIndex: 0, opacity: 0.85 }}
        >
          <circle cx="65" cy="65" r="50" fill="none" stroke={strokeColor} strokeWidth="1" />
          <circle cx="53" cy="65" r="36" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" />
          <circle cx="77" cy="65" r="36" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="4 3" />
          <circle cx="65" cy="65" r="22" fill="none" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );
    case "04":
      return (
        <svg
          data-testid="semiotic-signature-04"
          width="130"
          height="130"
          style={{ position: "absolute", top: "19px", left: "19px", pointerEvents: "none", zIndex: 0, opacity: 0.85 }}
        >
          <polygon points="65,18 92,34 92,65 65,81 38,65 38,34" fill="none" stroke={strokeColor} strokeWidth="1.2" />
          <polygon points="65,49 92,65 92,96 65,112 38,96 38,65" fill="none" stroke={strokeColor} strokeWidth="1" strokeDasharray="3 2" />
          <circle cx="65" cy="65" r="4" fill={strokeColor} />
        </svg>
      );
    case "05":
      return (
        <svg
          data-testid="semiotic-signature-05"
          width="130"
          height="130"
          style={{ position: "absolute", top: "19px", left: "19px", pointerEvents: "none", zIndex: 0, opacity: 0.85 }}
        >
          <circle cx="65" cy="65" r="48" fill="none" stroke={amberColor} strokeWidth="1.2" strokeDasharray="18 8 6 12" />
          <path d="M 40 40 L 60 65 L 48 85 L 78 90" fill="none" stroke={amberColor} strokeWidth="1.5" />
          <path d="M 85 38 L 70 58 L 88 78" fill="none" stroke={amberColor} strokeWidth="1.2" strokeDasharray="4 2" />
          <circle cx="60" cy="65" r="2.5" fill={amberColor} />
        </svg>
      );
    case "06":
      return (
        <svg
          data-testid="semiotic-signature-06"
          width="130"
          height="130"
          style={{ position: "absolute", top: "19px", left: "19px", pointerEvents: "none", zIndex: 0, opacity: 0.85 }}
        >
          <path
            d="M 65 65 Q 65 35 95 35 T 95 95 T 35 95 T 35 25"
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.3"
            strokeDasharray="5 3"
          />
          <circle cx="65" cy="65" r="16" fill="none" stroke={strokeColor} strokeWidth="1.2" />
        </svg>
      );
    default:
      return null;
  }
}

export interface OrbitalResonanceBubbleProps {
  stageId: string;
  stageName: string;
  subtitle: string;
  itemCount: number;
  previewItems?: string[];
  primaryMetric?: string;
  secondaryMetrics?: {
    confidence: string;
    evidence: string;
    state: string;
  };
  angle?: number;
  placement?: HudPlacement;
  isActive?: boolean;
  isHovered?: boolean;
  isDimmed?: boolean;
  animationDelay?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onHudAction?: (action: "OPEN EVIDENCE" | "INSPECT SOURCES" | "VIEW MATCHES", stageId: string) => void;
  accentColor?: string;
  style?: React.CSSProperties;
  sourcePresentation?: SilSourcePresentation;
  locale?: SilLocale;
  attentionState?: "EMPTY_PROJECTION_ATTENTION" | null;
  canonicalState?: "AVAILABLE" | "EMPTY" | "NOT_PRODUCED" | "UNKNOWN" | "FAILED" | "PRE_CANONICAL";
}

export function getOrbitAccentColor(stageId: string): string {
  switch (stageId) {
    case "01":
      return "#38e5ff"; // Cyan Core
    case "02":
      return "#00ffd5"; // Emerald Capability
    case "03":
      return "#6b8eff"; // Electric Indigo Resonance
    case "04":
      return "#b87fff"; // Purple Role
    case "05":
      return "#ff7c5c"; // Amber-Coral Tension
    case "06":
      return "#38ff8b"; // Mint Evolution
    default:
      return "#38e5ff";
  }
}

function getOrbitalPhysicsClass(stageId: string): string {
  switch (stageId) {
    case "01":
      return "physics--precision-calm";
    case "02":
      return "physics--network-rotate";
    case "03":
      return "physics--wave-harmonic";
    case "04":
      return "physics--matrix-grid";
    case "05":
      return "physics--tension-instability";
    case "06":
      return "physics--spiral-evolution";
    default:
      return "";
  }
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.5 Phase 2b)
 * OrbitalResonanceBubble: Planetary resonance sphere with multi-layered atmosphere aura & floating Hologram HUD.
 */
export function OrbitalResonanceBubble({
  stageId,
  stageName,
  subtitle,
  itemCount,
  previewItems,
  primaryMetric,
  secondaryMetrics,
  angle,
  placement,
  isActive = false,
  isHovered = false,
  isDimmed = false,
  animationDelay = "0s",
  onClick,
  onMouseEnter,
  onMouseLeave,
  onHudAction,
  accentColor,
  style,
  sourcePresentation,
  locale = SIL_COPY.defaultLocale,
  attentionState = null,
  canonicalState = "PRE_CANONICAL"
}: OrbitalResonanceBubbleProps) {
  const t = SIL_COPY[locale];
  const isEmptyProjectionAttention =
    attentionState === "EMPTY_PROJECTION_ATTENTION";
  const isHighlighted = isActive || isHovered;
  // The shared physics shell also contains the hover HUD and tether. A hovered
  // stage is therefore an interaction surface, never an opacity-dimmed ancestor.
  const isEffectivelyDimmed = isDimmed && !isHovered;

  const defaultPrimaryMetric = primaryMetric || `${itemCount} ${t.hud.activeObjects}`;

  const focusedPresentation =
    resolveSilFocusedManifestationPresentation(
      stageId,
      angle,
      placement
    );
  const computedPlacement = focusedPresentation.placement;
  const tetherTarget = focusedPresentation.tetherTarget;
  const physicsClass = getOrbitalPhysicsClass(stageId);
  const stageAccentColor = accentColor || getOrbitAccentColor(stageId);

  return (
    <SyntxResonanceBody
      physicsTestId={`orbital-physics-${stageId}`}
      bodyTestId={`orbital-bubble-body-${stageId}`}
      attention={isEmptyProjectionAttention}
      hudOpen={isHovered && !isActive}
      highlighted={isHighlighted}
      dimmed={isEffectivelyDimmed}
      className={`${isHighlighted ? "orbital-bubble-focused" : ""} ${physicsClass}`.trim()}
      animationDelay={animationDelay}
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      signature={renderSemioticSignature(stageId, isHighlighted)}
      moonCount={!isActive && itemCount > 0 ? Math.min(itemCount, 24) : 0}
      hud={isHovered && !isActive ? {
        tetherTestId: `orbital-tether-${stageId}`,
        tetherTarget,
        previewTestId: `orbital-preview-${stageId}`,
        className: `hologram-hud--large hologram-float quietUniverseDust hud-preview--${computedPlacement}`,
        style: getTooltipStyle(computedPlacement),
        children: (
          <>
              {/* TITLE */}
              <div
                style={{
                  fontSize: "12px",
                  color: SIL_TOKENS.colors.cyanActive,
                  textTransform: "uppercase",
                  letterSpacing: "1.5px",
                  fontWeight: 700,
                  borderBottom: `1px solid rgba(56, 229, 255, 0.35)`,
                  paddingBottom: "6px",
                  marginBottom: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <span>{stageName}</span>
                <span style={{ fontSize: "10.5px", color: "rgba(56, 229, 255, 0.6)" }}>{t.hud.hologram}</span>
              </div>

              {/* PRIMARY METRIC */}
              <div
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: SIL_TOKENS.colors.textPrimary,
                  marginBottom: "10px",
                  letterSpacing: "0.5px"
                }}
              >
                {defaultPrimaryMetric}
              </div>

              {/* CONFIDENCE WITH PROGRESS BAR */}
              {secondaryMetrics?.confidence && (
                <div style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11.5px",
                      color: SIL_TOKENS.colors.textMuted,
                      marginBottom: "4px"
                    }}
                  >
                    <span>{t.hud.confidence}</span>
                    <strong style={{ color: SIL_TOKENS.colors.cyanActive }}>{secondaryMetrics.confidence}</strong>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        width: secondaryMetrics.confidence,
                        height: "100%",
                        backgroundColor: SIL_TOKENS.colors.cyanActive,
                        boxShadow: `0 0 8px ${SIL_TOKENS.colors.cyanActive}`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* EVIDENCE DENSITY WITH INDICATOR DOTS */}
              {secondaryMetrics?.evidence && (
                <div style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "11.5px",
                      color: SIL_TOKENS.colors.textMuted,
                      marginBottom: "4px"
                    }}
                  >
                    <span>{t.hud.evidenceDensity}</span>
                    <strong style={{ color: SIL_TOKENS.colors.textPrimary }}>{secondaryMetrics.evidence}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {["●", "●", "●", "●", "●", "●", "●"].map((dot, idx) => (
                      <span key={idx} style={{ color: idx < 6 ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.25)", fontSize: "11.5px" }}>
                        {dot}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* SOURCES WITH MINI PILLS */}
              <div style={{ marginBottom: "10px" }}>
                <div
                  style={{
                    fontSize: "10.5px",
                    color: SIL_TOKENS.colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                    marginBottom: "4px",
                    fontWeight: 700
                  }}
                >
                  {t.hud.sourcesGrounding}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {sourcePresentation && sourcePresentation.labels.length > 0 ? (
                    sourcePresentation.labels.map((label, idx) => (
                      <span key={idx} style={{ fontSize: "11.5px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
                        {label} ●
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "11.5px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
                      SRC ●
                    </span>
                  )}
                </div>
              </div>

              {/* {t.hud.topItems} */}
              {previewItems && previewItems.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <div
                    style={{
                      fontSize: "10.5px",
                      color: SIL_TOKENS.colors.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      marginBottom: "4px",
                      fontWeight: 700
                    }}
                  >
                    {t.hud.topItems}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                    {previewItems.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          fontSize: "12px",
                          color: SIL_TOKENS.colors.textPrimary,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                      >
                        • {item}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* INTERACTIVE HUD ACTION BAR (Phase 3a) */}
              <div
                data-testid="hud-actions"
                style={{
                  display: "flex",
                  gap: "5px",
                  marginBottom: "8px",
                  pointerEvents: "auto"
                }}
              >
                {[
                  {
                    action: "OPEN EVIDENCE" as const,
                    label: t.hud.openEvidence,
                    id: "open-evidence",
                    color: stageAccentColor,
                    bg: "rgba(56, 229, 255, 0.16)",
                    border: stageAccentColor
                  },
                  {
                    action: "INSPECT SOURCES" as const,
                    label: t.hud.inspectSources,
                    id: "inspect-sources",
                    color: "#8ebbff",
                    bg: "rgba(107, 142, 255, 0.16)",
                    border: "#6b8eff"
                  },
                  {
                    action: "VIEW MATCHES" as const,
                    label: t.hud.viewMatches,
                    id: "view-matches",
                    color: "#66ffdf",
                    bg: "rgba(0, 255, 213, 0.16)",
                    border: "#00ffd5"
                  }
                ].map((act) => (
                  <button
                    key={act.id}
                    data-testid={`hud-action-${act.id}`}
                    disabled={act.id === "inspect-sources"}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (act.id === "inspect-sources") return;
                      if (onHudAction) {
                        onHudAction(act.action, stageId);
                      }
                    }}
                    style={{
                      flex: 1,
                      backgroundColor: act.bg,
                      border: `1px solid ${act.border}77`,
                      color: act.color,
                      fontSize: "10px",
                      fontWeight: 700,
                      letterSpacing: "0.5px",
                      padding: "6px 4px",
                      borderRadius: "4px",
                      cursor: act.id === "inspect-sources" ? "not-allowed" : "pointer",
                      opacity: act.id === "inspect-sources" ? 0.3 : 1,
                      textAlign: "center",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (act.id === "inspect-sources") return;
                      e.currentTarget.style.backgroundColor = act.bg.replace("0.16", "0.32");
                      e.currentTarget.style.borderColor = act.border;
                    }}
                    onMouseLeave={(e) => {
                      if (act.id === "inspect-sources") return;
                      e.currentTarget.style.backgroundColor = act.bg;
                      e.currentTarget.style.borderColor = `${act.border}77`;
                    }}
                  >
                    {act.label}
                  </button>
                ))}
              </div>

              {/* ACTION HINT */}
              <div
                style={{
                  fontSize: "10.5px",
                  color: "rgba(56, 229, 255, 0.65)",
                  borderTop: `1px solid rgba(56, 229, 255, 0.15)`,
                  paddingTop: "6px",
                  letterSpacing: "0.5px"
                }}
              >
                {t.hud.clickToFocus}
              </div>
          </>
        )
      } : null}
    >
        <span
          style={{
            fontSize: "11px",
            color: isHighlighted ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
            fontWeight: 700,
            letterSpacing: "1px",
            position: "relative",
            zIndex: 1,
            ...(isEmptyProjectionAttention && !isHighlighted ? SIL_RED_FIELD_TYPE.bodyStage : null)
          }}
        >
          {stageId}
        </span>
        <span
          style={{
            fontSize: "13px",
            color: SIL_TOKENS.colors.textPrimary,
            fontWeight: 700,
            marginTop: "4px",
            lineHeight: 1.2,
            position: "relative",
            zIndex: 1
          }}
        >
          {stageName}
        </span>
        <span
          style={{
            fontSize: "10.5px",
            color: SIL_TOKENS.colors.textMuted,
            marginTop: "4px",
            lineHeight: 1.2,
            position: "relative",
            zIndex: 1,
            ...(isEmptyProjectionAttention ? SIL_RED_FIELD_TYPE.bodyCaption : null)
          }}
        >
          {subtitle}
        </span>
        <span
          data-testid={`canonical-sil-region-state-${stageId}`}
          style={{ fontSize: "9.5px", color: canonicalState === "PRE_CANONICAL" ? SIL_TOKENS.colors.textMuted : SIL_TOKENS.colors.cyanActive, marginTop: "3px", position: "relative", zIndex: 1, ...(isEmptyProjectionAttention && canonicalState === "PRE_CANONICAL" ? SIL_RED_FIELD_TYPE.bodyState : null) }}
        >
          {canonicalState === "PRE_CANONICAL" ? "PRE-CANONICAL DISCOVERY" : `CANONICAL ${canonicalState}`}
        </span>
        <span
          style={{
            marginTop: "8px",
            fontSize: "10.5px",
            color: isHighlighted ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textPrimary,
            backgroundColor: isHighlighted ? "rgba(56, 229, 255, 0.15)" : "rgba(255,255,255,0.05)",
            padding: "2px 8px",
            borderRadius: "8px",
            border: `1px solid ${isHighlighted ? "rgba(56, 229, 255, 0.4)" : "transparent"}`,
            position: "relative",
            zIndex: 1
          }}
        >
          {`${itemCount} ${t.field.items}`}
        </span>

    </SyntxResonanceBody>
  );
}
