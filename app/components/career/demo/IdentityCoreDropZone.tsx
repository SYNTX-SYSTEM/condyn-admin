"use client";

import React, { useState } from "react";
import { DemoSourceItem } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";
import { SyntxCoreOrganism } from "./manifestation/SyntxCoreOrganism";

export interface IdentityCoreDropZoneProps {
  sources: DemoSourceItem[];
  onDropSource?: (source: { title: string; kind: string }) => void;
  isCommunicating?: boolean;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.5 Phase 2b)
 * IdentityCoreDropZone: The living central star organism of the Bedeutungsraum.
 */
export function IdentityCoreDropZone({ sources, onDropSource, isCommunicating = false }: IdentityCoreDropZoneProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const isHighlighted = isDragging || isHovered || isCommunicating;

  return (
    <SyntxCoreOrganism
      testId="identity-core-dropzone"
      highlighted={isHighlighted}
      communicating={isCommunicating}
      outerRingLit={isDragging || isHovered}
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
    >
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
              src="/dll-logo.svg"
              alt="DLL Logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
          </div>
          <div
            style={{
              fontSize: "10.5px",
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
              fontSize: "10.5px",
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
    </SyntxCoreOrganism>
  );
}
