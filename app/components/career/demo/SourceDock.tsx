"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";

export interface SourceDockProps {
  onAddSource?: (type: string) => void;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * SourceDock: Compact left-side ingestion dock focused on feeding the core.
 */
export function SourceDock({ onAddSource }: SourceDockProps) {
  const sourceTypes = [
    { id: "pdf", label: "PDF Dokumente" },
    { id: "github", label: "GitHub Repository" },
    { id: "website", label: "Website / Portfolio" },
    { id: "markdown", label: "Markdown / Text" },
    { id: "linkedin", label: "LinkedIn Profil" },
    { id: "research", label: "Research Papers" }
  ];

  return (
    <div
      data-testid="source-dock"
      style={{
        width: "240px",
        backgroundColor: "rgba(10, 14, 20, 0.65)",
        border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
        borderRadius: "12px",
        padding: "16px",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary,
        display: "flex",
        flexDirection: "column",
        gap: "14px"
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: "12px",
            color: SIL_TOKENS.colors.cyanActive,
            textTransform: "uppercase",
            letterSpacing: "1px"
          }}
        >
          1. WISSEN EINSPEISEN
        </h3>
        <p style={{ margin: "4px 0 0 0", fontSize: "11px", color: SIL_TOKENS.colors.textMuted, lineHeight: 1.3 }}>
          Ziehen Sie Quellen in das Zentrum oder wählen Sie eine Quelle aus.
        </p>
      </div>

      <div
        style={{
          border: `1px dashed ${SIL_TOKENS.colors.cyanActive}`,
          borderRadius: "8px",
          padding: "12px",
          textAlign: "center",
          backgroundColor: "rgba(56, 229, 255, 0.04)",
          cursor: "pointer"
        }}
      >
        <span style={{ fontSize: "11px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
          + ZIEHEN & ABLEGEN
        </span>
        <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.textMuted, marginTop: "2px" }}>
          oder klicken zum Auswählen
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: "10px",
            color: SIL_TOKENS.colors.textMuted,
            textTransform: "uppercase",
            marginBottom: "8px",
            letterSpacing: "0.5px"
          }}
        >
          QUELLEN BEISPIELE
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {sourceTypes.map((st) => (
            <button
              key={st.id}
              onClick={() => onAddSource && onAddSource(st.id)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                backgroundColor: "rgba(3, 5, 8, 0.6)",
                border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                borderRadius: "6px",
                color: SIL_TOKENS.colors.textPrimary,
                fontSize: "11px",
                textAlign: "left",
                cursor: "pointer"
              }}
            >
              <span>•</span>
              <span>{st.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
