"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";

export interface SemanticGuideDrawerProps {
  initialOpen?: boolean;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * SemanticGuideDrawer: Collapsible right-side guide explaining the 6-stage semantic flow.
 */
export function SemanticGuideDrawer({ initialOpen = false }: SemanticGuideDrawerProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);

  const stages = [
    { id: "01", title: "IDENTITY CORE", desc: "Wer sind Sie? Ihre Quellen bilden den unverfälschten Identitätskern." },
    { id: "02", title: "CAPABILITY FIELD", desc: "Welche Fähigkeiten bilden Ihren semantischen Kern?" },
    { id: "03", title: "RESONANCE ORBITS", desc: "Mit welchen Organisationen resonieren Ihre Fähigkeiten?" },
    { id: "04", title: "ROLE MANIFESTATION", desc: "Welche konkreten Rollen passen zu diesem Resonanzfeld?" },
    { id: "05", title: "TENSION FIELD", desc: "Wo fehlen Fähigkeiten oder Erfahrung? Wo entstehen Lücken?" },
    { id: "06", title: "EVOLUTION PATHS", desc: "Welche Pfade führen zu mehr Resonanz und Möglichkeiten?" }
  ];

  if (!isOpen) {
    return (
      <button
        data-testid="semantic-guide-drawer-toggle"
        onClick={() => setIsOpen(true)}
        style={{
          position: "fixed",
          right: "24px",
          top: "24px",
          zIndex: 50,
          backgroundColor: "rgba(10, 14, 20, 0.85)",
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          borderRadius: "8px",
          padding: "8px 14px",
          color: SIL_TOKENS.colors.cyanActive,
          fontFamily: SIL_TOKENS.typography.mono,
          fontSize: "11px",
          cursor: "pointer",
          boxShadow: `0 0 12px ${SIL_TOKENS.colors.cyanGlow}`
        }}
      >
        ⓘ SEMANTIC GUIDE
      </button>
    );
  }

  return (
    <div
      data-testid="semantic-guide-drawer"
      style={{
        width: "280px",
        backgroundColor: "rgba(10, 14, 20, 0.92)",
        border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
        borderRadius: "12px",
        padding: "16px",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        gap: "12px"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3
          style={{
            margin: 0,
            fontSize: "12px",
            color: SIL_TOKENS.colors.cyanActive,
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
        >
          DER 6-STUFIGE FLUSS
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: "none",
            border: "none",
            color: SIL_TOKENS.colors.textMuted,
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {stages.map((st) => (
          <div
            key={st.id}
            style={{
              padding: "10px",
              backgroundColor: "rgba(3, 5, 8, 0.6)",
              border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
              borderRadius: "6px"
            }}
          >
            <div style={{ fontSize: "11px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
              {st.id} {st.title}
            </div>
            <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.textMuted, marginTop: "3px", lineHeight: 1.3 }}>
              {st.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
