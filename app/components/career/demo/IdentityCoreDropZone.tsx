"use client";

import React, { useState } from "react";
import { DemoIngestionSource } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

export interface IdentityCoreDropZoneProps {
  sources: DemoIngestionSource[];
  onDropSource?: (source: { title: string; kind: string }) => void;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * IdentityCoreDropZone: The central living engine of the Bedeutungsraum.
 */
export function IdentityCoreDropZone({ sources, onDropSource }: IdentityCoreDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      data-testid="identity-core-dropzone"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (onDropSource) {
          onDropSource({ title: "dropped-source.pdf", kind: "PDF" });
        }
      }}
      style={{
        width: "220px",
        height: "220px",
        borderRadius: "50%",
        backgroundColor: "rgba(3, 8, 16, 0.85)",
        border: `2px solid ${isDragging || isHovered ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.45)"}`,
        boxShadow: isDragging || isHovered
          ? `0 0 45px ${SIL_TOKENS.colors.cyanActive}, inset 0 0 25px ${SIL_TOKENS.colors.cyanGlow}`
          : `0 0 25px ${SIL_TOKENS.colors.cyanGlow}, inset 0 0 15px rgba(56, 229, 255, 0.1)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        position: "relative",
        transition: "all 0.3s ease-in-out"
      }}
    >
      {/* Semiotic Outer Orbit Ring */}
      <div
        style={{
          position: "absolute",
          top: "-24px",
          left: "-24px",
          right: "-24px",
          bottom: "-24px",
          borderRadius: "50%",
          border: `1px dashed ${SIL_TOKENS.colors.cyanActive}`,
          opacity: isDragging || isHovered ? 0.9 : 0.35,
          pointerEvents: "none",
          transition: "all 0.4s ease"
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-10px",
          left: "-10px",
          right: "-10px",
          bottom: "-10px",
          borderRadius: "50%",
          border: `1px solid rgba(56, 229, 255, 0.2)`,
          pointerEvents: "none"
        }}
      />

      {/* Center Logo Emblem */}
      <div style={{ textAlign: "center", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div
          style={{
            width: "92px",
            height: "92px",
            borderRadius: "50%",
            overflow: "hidden",
            border: `2px solid ${SIL_TOKENS.colors.cyanActive}`,
            boxShadow: `0 0 20px ${SIL_TOKENS.colors.cyanActive}`,
            marginBottom: "8px",
            backgroundColor: "#000"
          }}
        >
          <img
            src="/logo.jpeg"
            alt="ConDyn SYNTX Logo"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover"
            }}
          />
        </div>
        <div
          style={{
            fontSize: "10px",
            color: SIL_TOKENS.colors.cyanActive,
            letterSpacing: "2px",
            fontWeight: 700,
            textTransform: "uppercase"
          }}
        >
          SYNTX CORE • ORGANISM
        </div>

        <div
          style={{
            marginTop: "8px",
            fontSize: "10px",
            color: isDragging ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textPrimary,
            padding: "3px 10px",
            borderRadius: "12px",
            backgroundColor: "rgba(56, 229, 255, 0.12)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            letterSpacing: "0.5px"
          }}
        >
          {isDragging ? "⚡ DROP SOURCE NOW" : `◈ ${sources.length} SOURCES ACTIVE`}
        </div>
      </div>
    </div>
  );
}
