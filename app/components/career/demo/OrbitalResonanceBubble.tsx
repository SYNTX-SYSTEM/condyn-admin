"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";
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
  const base: React.CSSProperties = {
    position: "absolute",
    width: "380px",
    // The observation surface must visually isolate its evidence from the
    // organism behind it; this is quiet spatial framing, not a new HUD state.
    // A true, opaque observation surface. The atmosphere layers decorate a
    // solid universe rather than functioning as transparent glass.
    // The final opaque gradient is the actual body surface; decorative star
    // layers never expose the organism underneath the observation HUD.
    background: "#02070d",
    backgroundColor: "#02070d",
    backgroundImage:
      "radial-gradient(circle at 8% 14%, rgba(255,255,255,0.95) 0 1px, transparent 1.8px), radial-gradient(circle at 19% 68%, rgba(56,229,255,0.95) 0 1.2px, transparent 2px), radial-gradient(circle at 34% 30%, rgba(255,255,255,0.78) 0 0.9px, transparent 1.7px), radial-gradient(circle at 52% 15%, rgba(126,255,204,0.90) 0 1px, transparent 1.8px), radial-gradient(circle at 67% 73%, rgba(255,255,255,0.82) 0 1px, transparent 1.8px), radial-gradient(circle at 82% 22%, rgba(142,156,255,0.96) 0 1.1px, transparent 2px), radial-gradient(circle at 91% 61%, rgba(56,229,255,0.94) 0 1.2px, transparent 2px), radial-gradient(circle at 44% 88%, rgba(255,255,255,0.70) 0 0.9px, transparent 1.7px), radial-gradient(ellipse at 18% 27%, rgba(0,218,255,0.34) 0%, rgba(0,141,190,0.22) 20%, rgba(0,84,118,0.10) 38%, transparent 57%), radial-gradient(ellipse at 84% 24%, rgba(108,92,255,0.30) 0%, rgba(75,55,180,0.16) 23%, transparent 49%), radial-gradient(ellipse at 58% 82%, rgba(0,255,213,0.18) 0%, rgba(0,118,130,0.08) 32%, transparent 55%), radial-gradient(ellipse at 50% 50%, rgba(20,90,120,0.18) 0%, rgba(5,25,40,0.06) 44%, transparent 68%), linear-gradient(145deg, #0a1c2b 0%, #071321 28%, #050c18 62%, #02070d 100%)",
    border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`,
    borderRadius: "10px",
    padding: "16px 18px",
    boxShadow: `0 16px 44px rgba(0, 0, 0, 0.92), 0 0 34px rgba(56, 229, 255, 0.28), 0 0 72px rgba(56, 229, 255, 0.10), inset 0 0 42px rgba(0, 0, 0, 0.62)`,
    backgroundSize: "auto",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    opacity: 1,
    mixBlendMode: "normal",
    backgroundBlendMode: "normal",
    backdropFilter: "none",
    isolation: "isolate",
    zIndex: 50,
    textAlign: "left",
    pointerEvents: "auto",
    fontFamily: SIL_TOKENS.typography.mono,
    WebkitFontSmoothing: "antialiased"
  };

  switch (placement) {
    case "top":
      return { ...base, bottom: "215px", left: "-106px" }; // (380 - 168) / 2 = 106
    case "bottom":
      return { ...base, top: "215px", left: "-106px" };
    case "left":
      return { ...base, right: "215px", top: "-50px" }; // Approximate vertical center without dynamic calc
    case "right":
      return { ...base, left: "215px", top: "-50px" };
    case "top-left":
      return { ...base, bottom: "175px", right: "175px" };
    case "top-right":
      return { ...base, bottom: "175px", left: "175px" };
    case "bottom-left":
      return { ...base, top: "175px", right: "175px" };
    case "bottom-right":
      return { ...base, top: "175px", left: "175px" };
    default:
      return { ...base, bottom: "215px", left: "-106px" };
  }
}

function renderSemioticSignature(stageId: string, isHighlighted: boolean) {
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
  attentionState = null
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
    <>
      <style>{`
        @keyframes orbitFloatPhase2 {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          30% { transform: translateY(2px) translateX(-1px) scale(1.005); }
          65% { transform: translateY(-3px) translateX(1px) scale(1.01); }
          100% { transform: translateY(0px) translateX(0px) scale(1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes atmosphereGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes hologramFloat {
          0%, 100% { translate: 0px 0px; }
          50% { translate: 0px -4px; }
        }
        @keyframes moonOrbit {
          from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
        }

        @keyframes emptyProjectionBreathe {
          0%, 100% {
            transform: scale(0.98);
            opacity: 0.42;
            box-shadow:
              0 0 14px rgba(255, 56, 68, 0.34),
              0 0 30px rgba(255, 56, 68, 0.20);
          }
          50% {
            transform: scale(1.16);
            opacity: 0.98;
            box-shadow:
              0 0 26px rgba(255, 56, 68, 0.82),
              0 0 58px rgba(255, 56, 68, 0.52);
          }
        }

        @keyframes emptyProjectionShellBreathe {
          0%, 100% {
            transform: scale(1.01);
            opacity: 0.38;
          }
          50% {
            transform: scale(1.10);
            opacity: 0.96;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-testid="empty-projection-breathing-halo"],
          [data-testid="empty-projection-breathing-shell"] {
            animation: none !important;
          }
        }
      `}</style>

      <div
        data-testid={`orbital-physics-${stageId}`}
        data-attention-state={
          isEmptyProjectionAttention
            ? "EMPTY_PROJECTION_ATTENTION"
            : undefined
        }
        data-hud-composition-ancestor={isHovered && !isActive ? "opaque" : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`${isHighlighted ? "orbital-bubble-focused" : ""} ${physicsClass}`.trim()}
        style={{
          width: "168px",
          height: "168px",
          borderRadius: "50%",
          backgroundColor: isHighlighted ? "rgba(56, 229, 255, 0.18)" : "rgba(10, 14, 20, 0.88)",
          border: `1.5px solid ${isHighlighted ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)"}`,
          boxShadow: isHighlighted
            ? `0 0 48px ${SIL_TOKENS.colors.cyanGlowStrong}, 0 0 24px ${SIL_TOKENS.colors.cyanActive}, inset 0 0 25px ${SIL_TOKENS.colors.cyanGlow}`
            : `0 0 18px rgba(3, 8, 16, 0.8), inset 0 0 12px rgba(56, 229, 255, 0.08)`,
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "16px",
          textAlign: "center",
          position: "relative",
          opacity: isEffectivelyDimmed ? 0.52 : 1,
          mixBlendMode: "normal",
          backgroundBlendMode: "normal",
          isolation: "isolate",
          animation: `orbitFloatPhase2 25s ease-in-out infinite`,
          animationDelay: animationDelay,
          transition: "opacity 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background-color 0.35s ease",
          ...style
        }}
      >
        <div
          data-testid={`orbital-bubble-body-${stageId}`}
          aria-hidden="true"
          style={{ display: "contents" }}
        />
        {/* Phase 2b: Multi-layer Planetary Atmosphere (Glow / Ring / Glow / Ring / Glow) */}
        {isHighlighted && (
          <>
            {/* Outer Atmosphere Glow 1 */}
            <div
              style={{
                position: "absolute",
                top: "-26px",
                left: "-26px",
                right: "-26px",
                bottom: "-26px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(56, 229, 255, 0.18) 0%, transparent 70%)",
                animation: "atmosphereGlow 3s ease-in-out infinite",
                pointerEvents: "none"
              }}
            />
            {/* Concentric Ring 1 */}
            <div
              style={{
                position: "absolute",
                top: "-18px",
                left: "-18px",
                right: "-18px",
                bottom: "-18px",
                borderRadius: "50%",
                border: `1px solid rgba(56, 229, 255, 0.45)`,
                pointerEvents: "none"
              }}
            />
            {/* Outer Atmosphere Glow 2 */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "-12px",
                right: "-12px",
                bottom: "-12px",
                borderRadius: "50%",
                border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                animation: "ringPulse 2.4s ease-out infinite",
                pointerEvents: "none"
              }}
            />
            {/* Concentric Ring 2 */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "-12px",
                right: "-12px",
                bottom: "-12px",
                borderRadius: "50%",
                border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                animation: "ringPulse 2.4s ease-out infinite 1.2s",
                pointerEvents: "none"
              }}
            />
          </>
        )}

        {isEmptyProjectionAttention && (
          <>
            <div
              data-testid="empty-projection-breathing-halo"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-20px",
                left: "-20px",
                right: "-20px",
                bottom: "-20px",
                borderRadius: "50%",
                border: "2px solid rgba(255, 56, 68, 0.78)",
                background:
                  "radial-gradient(circle, transparent 58%, rgba(255, 56, 68, 0.12) 76%, transparent 100%)",
                pointerEvents: "none",
                zIndex: 0,
                animation:
                  "emptyProjectionBreathe 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite"
              }}
            />

            <div
              data-testid="empty-projection-breathing-shell"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-11px",
                left: "-11px",
                right: "-11px",
                bottom: "-11px",
                borderRadius: "50%",
                border: "1.5px dashed rgba(255, 56, 68, 0.92)",
                boxShadow:
                  "inset 0 0 20px rgba(255, 56, 68, 0.20)",
                pointerEvents: "none",
                zIndex: 0,
                animation:
                  "emptyProjectionShellBreathe 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite"
              }}
            />
          </>
        )}

        {/* Outer Semiotic Ring */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "-8px",
            right: "-8px",
            bottom: "-8px",
            borderRadius: "50%",
            border: `1px ${isHighlighted ? "solid" : "dashed"} ${isHighlighted ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.22)"}`,
            pointerEvents: "none",
            transition: "all 0.3s ease"
          }}
        />

        {/* Phase 2c: Inner Semiotic Signature Geometry */}
        {renderSemioticSignature(stageId, isHighlighted)}

        <span
          style={{
            fontSize: "11px",
            color: isHighlighted ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
            fontWeight: 700,
            letterSpacing: "1px",
            position: "relative",
            zIndex: 1
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
            fontSize: "10px",
            color: SIL_TOKENS.colors.textMuted,
            marginTop: "4px",
            lineHeight: 1.2,
            position: "relative",
            zIndex: 1
          }}
        >
          {subtitle}
        </span>
        <span
          style={{
            marginTop: "8px",
            fontSize: "10px",
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

        {/* Phase 3c: Orbiting Moons representing Capabilities */}
        {!isActive && itemCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              pointerEvents: "none"
            }}
          >
            {Array.from({ length: Math.min(itemCount, 24) }).map((_, i, arr) => {
              const delay = -(160 / arr.length) * i;
              return (
                <div
                  key={`moon-${i}`}
                  style={{
                    position: "absolute",
                    top: "-3px",
                    left: "-3px",
                    width: "9px",
                    height: "9px",
                    borderRadius: "50%",
                    backgroundColor: SIL_TOKENS.colors.cyanActive,
                    boxShadow: `0 0 8px ${SIL_TOKENS.colors.cyanActive}`,
                    animation: `moonOrbit 160s linear infinite`,
                    animationDelay: `${delay}s`
                  }}
                />
              );
            })}
          </div>
        )}

        {/* Freely Floating Scientific Hologram HUD with Tether Line */}
        {(isHovered && !isActive) && (
          <>
            {/* Tether Energy Line connecting Planet Bubble to Hologram HUD */}
            <svg
              data-testid={`orbital-tether-${stageId}`}
              width="240"
              height="240"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                overflow: "visible",
                zIndex: 49
              }}
            >
              <line
                x1="120"
                y1="120"
                x2={tetherTarget.x}
                y2={tetherTarget.y}
                stroke={SIL_TOKENS.colors.cyanActive}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.85"
              />
            </svg>

            <div
              data-testid={`orbital-preview-${stageId}`}
              data-opaque-hud-surface="true"
              data-hud-composition-root="opaque"
              className={`hologram-hud--large hologram-float quietUniverseDust hud-preview--${computedPlacement}`}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              style={{
                ...getTooltipStyle(computedPlacement),
                animation: "hologramFloat 6s ease-in-out infinite"
              }}
            >
              {/* TITLE */}
              <div
                style={{
                  fontSize: "11px",
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
                <span style={{ fontSize: "9px", color: "rgba(56, 229, 255, 0.6)" }}>{t.hud.hologram}</span>
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
                      fontSize: "10px",
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
                      fontSize: "10px",
                      color: SIL_TOKENS.colors.textMuted,
                      marginBottom: "4px"
                    }}
                  >
                    <span>{t.hud.evidenceDensity}</span>
                    <strong style={{ color: SIL_TOKENS.colors.textPrimary }}>{secondaryMetrics.evidence}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {["●", "●", "●", "●", "●", "●", "●"].map((dot, idx) => (
                      <span key={idx} style={{ color: idx < 6 ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.25)", fontSize: "10px" }}>
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
                    fontSize: "9px",
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
                      <span key={idx} style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
                        {label} ●
                      </span>
                    ))
                  ) : (
                    <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
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
                      fontSize: "9px",
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
                          fontSize: "11px",
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
                      fontSize: "8.5px",
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
                  fontSize: "9px",
                  color: "rgba(56, 229, 255, 0.65)",
                  borderTop: `1px solid rgba(56, 229, 255, 0.15)`,
                  paddingTop: "6px",
                  letterSpacing: "0.5px"
                }}
              >
                {t.hud.clickToFocus}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
