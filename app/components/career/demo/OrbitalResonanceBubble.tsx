"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";

export type HudPlacement =
  | "top"
  | "bottom"
  | "left"
  | "right"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

export function getTooltipPlacement(angle?: number, stageId?: string): HudPlacement {
  if (typeof angle === "number") {
    const norm = ((angle % 360) + 360) % 360;
    if (norm === 270) return "bottom";
    if (norm === 90) return "top";
    if (norm === 0) return "left";
    if (norm === 180) return "right";
    if (norm > 0 && norm < 90) return "top-left";
    if (norm > 90 && norm < 180) return "top-right";
    if (norm > 180 && norm < 270) return "bottom-right";
    if (norm > 270 && norm < 360) return "bottom-left";
  }

  switch (stageId) {
    case "01":
      return "bottom";
    case "02":
      return "bottom-left";
    case "03":
      return "top-left";
    case "04":
      return "top";
    case "05":
      return "top-right";
    case "06":
      return "bottom-right";
    default:
      return "top";
  }
}

function getTooltipStyle(placement: HudPlacement): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "absolute",
    width: "380px",
    backgroundColor: "rgba(6, 14, 24, 0.88)",
    border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`,
    borderRadius: "10px",
    padding: "16px 18px",
    boxShadow: `0 12px 36px rgba(0, 0, 0, 0.9), 0 0 24px rgba(56, 229, 255, 0.32)`,
    backdropFilter: "blur(16px)",
    backgroundImage: "radial-gradient(rgba(56, 229, 255, 0.12) 1px, transparent 1px)",
    backgroundSize: "14px 14px",
    zIndex: 50,
    textAlign: "left",
    pointerEvents: "none",
    fontFamily: SIL_TOKENS.typography.mono
  };

  switch (placement) {
    case "top":
      return { ...base, bottom: "215px", left: "50%", transform: "translateX(-50%)" };
    case "bottom":
      return { ...base, top: "215px", left: "50%", transform: "translateX(-50%)" };
    case "left":
      return { ...base, right: "215px", top: "50%", transform: "translateY(-50%)" };
    case "right":
      return { ...base, left: "215px", top: "50%", transform: "translateY(-50%)" };
    case "top-left":
      return { ...base, bottom: "175px", right: "175px" };
    case "top-right":
      return { ...base, bottom: "175px", left: "175px" };
    case "bottom-left":
      return { ...base, top: "175px", right: "175px" };
    case "bottom-right":
      return { ...base, top: "175px", left: "175px" };
    default:
      return { ...base, bottom: "215px", left: "50%", transform: "translateX(-50%)" };
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
  style?: React.CSSProperties;
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
  style
}: OrbitalResonanceBubbleProps) {
  const isHighlighted = isActive || isHovered;

  const defaultPrimaryMetric = primaryMetric || `${itemCount} Active Objects`;
  const defaultSecondaryMetrics = secondaryMetrics || {
    confidence: "96%",
    evidence: `${Math.max(12, itemCount * 14)} Objects`,
    state: "Verified"
  };

  const computedPlacement = placement || getTooltipPlacement(angle, stageId);

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
      `}</style>

      <div
        data-testid={`orbital-bubble-${stageId}`}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={isHighlighted ? "orbital-bubble-focused" : ""}
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
          opacity: isDimmed ? 0.52 : 1,
          animation: `orbitFloatPhase2 25s ease-in-out infinite`,
          animationDelay: animationDelay,
          transition: "opacity 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background-color 0.35s ease",
          ...style
        }}
      >
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
          {`${itemCount} items`}
        </span>

        {/* Freely Floating Scientific Hologram HUD with Tether Line */}
        {(isHovered || isActive) && (
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
                x2={
                  computedPlacement.includes("left")
                    ? "20"
                    : computedPlacement.includes("right")
                    ? "220"
                    : "120"
                }
                y2={
                  computedPlacement.includes("top")
                    ? "20"
                    : computedPlacement.includes("bottom")
                    ? "220"
                    : "120"
                }
                stroke={SIL_TOKENS.colors.cyanActive}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.85"
              />
            </svg>

            <div
              data-testid={`orbital-preview-${stageId}`}
              className={`hologram-hud--large hud-preview--${computedPlacement}`}
              style={getTooltipStyle(computedPlacement)}
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
                <span style={{ fontSize: "9px", color: "rgba(56, 229, 255, 0.6)" }}>HOLOGRAM HUD</span>
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
                  <span>CONFIDENCE</span>
                  <strong style={{ color: SIL_TOKENS.colors.cyanActive }}>{defaultSecondaryMetrics.confidence}</strong>
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
                      width: defaultSecondaryMetrics.confidence,
                      height: "100%",
                      backgroundColor: SIL_TOKENS.colors.cyanActive,
                      boxShadow: `0 0 8px ${SIL_TOKENS.colors.cyanActive}`
                    }}
                  />
                </div>
              </div>

              {/* EVIDENCE DENSITY WITH INDICATOR DOTS */}
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
                  <span>EVIDENCE DENSITY</span>
                  <strong style={{ color: SIL_TOKENS.colors.textPrimary }}>{defaultSecondaryMetrics.evidence}</strong>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  {["●", "●", "●", "●", "●", "●", "●"].map((dot, idx) => (
                    <span key={idx} style={{ color: idx < 6 ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.25)", fontSize: "10px" }}>
                      {dot}
                    </span>
                  ))}
                </div>
              </div>

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
                  SOURCES // SEMIOTIC GROUNDING
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
                    PDF ●
                  </span>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
                    GitHub ●
                  </span>
                  <span style={{ fontSize: "10px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(56, 229, 255, 0.15)", border: `1px solid ${SIL_TOKENS.colors.cyanActive}`, color: SIL_TOKENS.colors.cyanActive }}>
                    Website ●
                  </span>
                </div>
              </div>

              {/* TOP ITEMS */}
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
                    TOP ITEMS
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
                Click to focus this field
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}


