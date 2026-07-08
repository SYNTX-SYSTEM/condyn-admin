"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";

export interface OrbitalResonanceBubbleProps {
  stageId: string;
  stageName: string;
  subtitle: string;
  itemCount: number;
  previewItems?: string[];
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
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.5 Phase 1)
 * OrbitalResonanceBubble: Floating planetary resonance sphere with organic respiration (±4px).
 */
export function OrbitalResonanceBubble({
  stageId,
  stageName,
  subtitle,
  itemCount,
  previewItems,
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

  return (
    <>
      <style>{`
        @keyframes orbitFloat {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-4px) scale(1.01); }
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
            ? `0 0 38px ${SIL_TOKENS.colors.cyanGlowStrong}, inset 0 0 22px ${SIL_TOKENS.colors.cyanGlow}`
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
          animation: `orbitFloat 24s ease-in-out infinite`,
          animationDelay: animationDelay,
          transition: "opacity 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background-color 0.35s ease",
          ...style
        }}
      >
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
        <span
          style={{
            fontSize: "11px",
            color: isHighlighted ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
            fontWeight: 700,
            letterSpacing: "1px"
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
            lineHeight: 1.2
          }}
        >
          {stageName}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: SIL_TOKENS.colors.textMuted,
            marginTop: "4px",
            lineHeight: 1.2
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
            border: `1px solid ${isHighlighted ? "rgba(56, 229, 255, 0.4)" : "transparent"}`
          }}
        >
          {`${itemCount} items`}
        </span>

        {/* Mini-Preview on Hover / Active */}
        {(isHovered || isActive) && previewItems && previewItems.length > 0 && (
          <div
            data-testid={`orbital-preview-${stageId}`}
            style={{
              position: "absolute",
              bottom: "-54px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(8, 12, 18, 0.95)",
              border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
              borderRadius: "6px",
              padding: "6px 10px",
              boxShadow: `0 4px 20px rgba(0, 0, 0, 0.7), 0 0 12px rgba(56, 229, 255, 0.22)`,
              zIndex: 40,
              whiteSpace: "nowrap",
              pointerEvents: "none"
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: SIL_TOKENS.colors.cyanActive,
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                marginBottom: "3px",
                fontWeight: 700
              }}
            >
              PREVIEW // TOP ITEMS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", textAlign: "left" }}>
              {previewItems.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  style={{
                    fontSize: "10px",
                    color: SIL_TOKENS.colors.textPrimary,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    maxWidth: "200px"
                  }}
                >
                  • {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

