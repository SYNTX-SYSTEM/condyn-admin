"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";

export interface OrbitalResonanceBubbleProps {
  stageId: string;
  stageName: string;
  subtitle: string;
  itemCount: number;
  isActive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * OrbitalResonanceBubble: Floating planetary resonance sphere around the center.
 */
export function OrbitalResonanceBubble({
  stageId,
  stageName,
  subtitle,
  itemCount,
  isActive = false,
  onClick,
  style
}: OrbitalResonanceBubbleProps) {
  return (
    <div
      data-testid={`orbital-bubble-${stageId}`}
      onClick={onClick}
      style={{
        width: "160px",
        height: "160px",
        borderRadius: "50%",
        backgroundColor: isActive ? "rgba(56, 229, 255, 0.16)" : "rgba(10, 14, 20, 0.85)",
        border: `1.5px solid ${isActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)"}`,
        boxShadow: isActive
          ? `0 0 35px ${SIL_TOKENS.colors.cyanGlowStrong}, inset 0 0 20px ${SIL_TOKENS.colors.cyanGlow}`
          : `0 0 18px rgba(3, 8, 16, 0.8), inset 0 0 12px rgba(56, 229, 255, 0.08)`,
        backdropFilter: "blur(8px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        padding: "14px",
        textAlign: "center",
        position: "relative",
        transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
          border: `1px ${isActive ? "solid" : "dashed"} ${isActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.18)"}`,
          pointerEvents: "none",
          transition: "all 0.3s ease"
        }}
      />
      <span
        style={{
          fontSize: "11px",
          color: isActive ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
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
          color: isActive ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textPrimary,
          backgroundColor: "rgba(255,255,255,0.05)",
          padding: "2px 6px",
          borderRadius: "8px"
        }}
      >
        {`${itemCount} items`}
      </span>
    </div>
  );
}
