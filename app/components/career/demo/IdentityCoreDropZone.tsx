"use client";

import React, { useState } from "react";
import { DemoSourceItem } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";

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
    <>
      <style>{`
        @keyframes coreBreathe {
          0%, 100% { transform: scale(0.98); }
          50% { transform: scale(1.02); }
        }
        @keyframes waveExpand {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.45); opacity: 0; }
        }
        @keyframes particleIn {
          0% { transform: scale(0.8) translate(40px, -40px); opacity: 0; }
          50% { opacity: 0.8; }
          100% { transform: scale(1) translate(0px, 0px); opacity: 0; }
        }
        @keyframes corePulseCommunicate {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes plasmaRotateCw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes plasmaRotateCcw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes plasmaFlarePulse {
          0%, 100% { opacity: 0.15; transform: scale(0.96) rotate(0deg); }
          35% { opacity: 0.65; transform: scale(1.08) rotate(45deg); }
          70% { opacity: 0.25; transform: scale(1.01) rotate(90deg); }
        }
      `}</style>

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
          backgroundColor: "rgba(3, 8, 16, 0.88)",
          border: `2px solid ${isHighlighted ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.45)"}`,
          boxShadow: isHighlighted
            ? `0 0 65px ${SIL_TOKENS.colors.cyanActive}, inset 0 0 35px ${SIL_TOKENS.colors.cyanGlowStrong}`
            : `0 0 30px ${SIL_TOKENS.colors.cyanGlow}, inset 0 0 18px rgba(56, 229, 255, 0.14)`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          position: "relative",
          animation: "coreBreathe 14s ease-in-out infinite",
          transition: "border-color 0.3s ease, box-shadow 0.3s ease"
        }}
      >
        {/* Communicating Activation Pulse Ring */}
        {isCommunicating && (
          <div
            style={{
              position: "absolute",
              top: "-18px",
              left: "-18px",
              right: "-18px",
              bottom: "-18px",
              borderRadius: "50%",
              border: `2px solid ${SIL_TOKENS.colors.cyanActive}`,
              boxShadow: `0 0 25px ${SIL_TOKENS.colors.cyanActive}`,
              animation: "corePulseCommunicate 1.8s ease-in-out infinite",
              pointerEvents: "none"
            }}
          />
        )}

        {/* Phase 2c: Inner Rotating Plasma Rings */}
        <div
          data-testid="plasma-core-rings"
          style={{
            position: "absolute",
            top: "12px",
            left: "12px",
            right: "12px",
            bottom: "12px",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <svg width="196" height="196" style={{ position: "absolute" }}>
            <circle
              cx="98"
              cy="98"
              r="84"
              fill="none"
              stroke={SIL_TOKENS.colors.cyanActive}
              strokeWidth="1.5"
              strokeDasharray="24 12 8 16"
              opacity="0.65"
              style={{ animation: "plasmaRotateCw 20s linear infinite", transformOrigin: "98px 98px" }}
            />
            <circle
              cx="98"
              cy="98"
              r="68"
              fill="none"
              stroke={SIL_TOKENS.colors.cyanGlowStrong}
              strokeWidth="1.2"
              strokeDasharray="16 8 4 12"
              opacity="0.5"
              style={{ animation: "plasmaRotateCcw 14s linear infinite", transformOrigin: "98px 98px" }}
            />
          </svg>
        </div>

        {/* Phase 2d: Autonomous Plasma Filament Flares */}
        <div
          data-testid="plasma-flare"
          style={{
            position: "absolute",
            top: "18px",
            left: "18px",
            right: "18px",
            bottom: "18px",
            borderRadius: "50%",
            pointerEvents: "none",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            boxShadow: `0 0 35px ${SIL_TOKENS.colors.cyanActive}, inset 0 0 25px ${SIL_TOKENS.colors.cyanGlowStrong}`,
            animation: "plasmaFlarePulse 11s ease-in-out infinite"
          }}
        />
        {/* Living Energy Wave Rings */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "50%",
            border: `1px solid rgba(56, 229, 255, 0.35)`,
            animation: "waveExpand 6s cubic-bezier(0.25, 0.8, 0.25, 1) infinite",
            pointerEvents: "none"
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: "50%",
            border: `1px solid rgba(56, 229, 255, 0.25)`,
            animation: "waveExpand 6s cubic-bezier(0.25, 0.8, 0.25, 1) infinite 3s",
            pointerEvents: "none"
          }}
        />

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

        {/* Floating Inward Particles */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            width: "5px",
            height: "5px",
            borderRadius: "50%",
            backgroundColor: SIL_TOKENS.colors.cyanActive,
            animation: "particleIn 5s ease-in-out infinite 1s",
            pointerEvents: "none"
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "28px",
            width: "4px",
            height: "4px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            animation: "particleIn 7s ease-in-out infinite 3.5s",
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
    </>
  );
}

