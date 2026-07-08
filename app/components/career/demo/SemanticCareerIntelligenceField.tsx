"use client";

import React, { useState } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";
import { IdentityCoreDropZone } from "./IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "./OrbitalResonanceBubble";
import { SourceDock } from "./SourceDock";
import { SemanticGuideDrawer } from "./SemanticGuideDrawer";

export interface SemanticCareerIntelligenceFieldProps {
  data: DemoCareerIntelligenceData;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.5 Phase 1)
 * SemanticCareerIntelligenceField: The living radial Bedeutungsraum organism.
 */
export function SemanticCareerIntelligenceField({ data }: SemanticCareerIntelligenceFieldProps) {
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);

  const stages = [
    {
      stageId: "01",
      stageName: "IDENTITY CORE",
      subtitle: "Unverfälschter Identitätskern",
      count: data.sources.length,
      glyph: "◈",
      angleDeg: -90,
      animationDelay: "0s",
      previewItems: data.sources.slice(0, 3).map((s) => s.name || s.title || "Quellendokument")
    },
    {
      stageId: "02",
      stageName: "CAPABILITY FIELD",
      subtitle: "Semantischer Kern",
      count: data.capabilities.length,
      glyph: "⬡",
      angleDeg: -30,
      animationDelay: "-4s",
      previewItems: data.capabilities.slice(0, 3).map((c) => c.name)
    },
    {
      stageId: "03",
      stageName: "RESONANCE ORBITS",
      subtitle: "Organisationen im Feld",
      count: data.companyMatches.length,
      glyph: "◎",
      angleDeg: 30,
      animationDelay: "-8s",
      previewItems: data.companyMatches.slice(0, 3).map((c) => c.companyName)
    },
    {
      stageId: "04",
      stageName: "ROLE MANIFESTATION",
      subtitle: "Konkrete Rollen",
      count: data.roleMatches.length,
      glyph: "⎔",
      angleDeg: 90,
      animationDelay: "-12s",
      previewItems: data.roleMatches.slice(0, 3).map((r) => r.roleTitle)
    },
    {
      stageId: "05",
      stageName: "TENSION FIELD",
      subtitle: "Fähigkeitslücken",
      count: data.capabilityGaps.length,
      glyph: "⟁",
      angleDeg: 150,
      animationDelay: "-16s",
      previewItems: data.capabilityGaps.slice(0, 3).map((g) => g.capabilityName)
    },
    {
      stageId: "06",
      stageName: "EVOLUTION PATHS",
      subtitle: "Entwicklungspfade",
      count: data.nextActions.length,
      glyph: "∿",
      angleDeg: 210,
      animationDelay: "-20s",
      previewItems: data.nextActions.slice(0, 3).map((a) => a.title)
    }
  ];

  const radius = 330;
  const center = 400;
  const focusedStageId = hoveredStageId || activeStageId;

  return (
    <div
      data-testid="semantic-career-intelligence-field"
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "960px",
        padding: "24px 32px",
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative",
        overflow: "hidden",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
      }}
    >
      {/* HUD Background Coordinates & Semiotic Grid */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: "10px",
          color: "rgba(56, 229, 255, 0.4)",
          letterSpacing: "2px",
          textTransform: "uppercase",
          pointerEvents: "none",
          display: "flex",
          gap: "24px"
        }}
      >
        <span>SYS.PLANETARIUM // RADIUS: 330px</span>
        <span>SEMANTIC RESONANCE: ACTIVE</span>
        <span>LATENCY: 0.4ms</span>
      </div>

      {/* Left Compact SourceDock */}
      <div style={{ zIndex: 10 }}>
        <SourceDock />
      </div>

      {/* Center Radial Organism Field */}
      <div
        style={{
          position: "relative",
          width: "800px",
          height: "800px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto"
        }}
      >
        {/* SVG Energy Flow Overlay connecting core to orbitals */}
        <svg
          data-testid="resonance-energy-paths"
          width="800"
          height="800"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
            zIndex: 1
          }}
        >
          <defs>
            <radialGradient id="fieldGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#38e5ff" stopOpacity={focusedStageId ? "0.32" : "0.22"} />
              <stop offset="100%" stopColor="#030508" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Core Ambient Aura */}
          <circle
            cx={center}
            cy={center}
            r="360"
            fill="url(#fieldGlow)"
            style={{ transition: "all 0.5s ease" }}
          />

          {/* Concentric Orbit Rings */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(56, 229, 255, 0.22)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <circle
            cx={center}
            cy={center}
            r={radius - 90}
            fill="none"
            stroke="rgba(56, 229, 255, 0.12)"
            strokeWidth="1"
          />

          {/* Energy Rays Connecting Core to Each Orbital Node */}
          {stages.map((st) => {
            const angleRad = (st.angleDeg * Math.PI) / 180;
            const targetX = center + Math.cos(angleRad) * radius;
            const targetY = center + Math.sin(angleRad) * radius;
            const isRayActive = focusedStageId === st.stageId;

            return (
              <g key={`ray-${st.stageId}`} data-testid={`energy-ray-${st.stageId}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={targetX}
                  y2={targetY}
                  stroke={isRayActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.26)"}
                  strokeWidth={isRayActive ? "2.5" : "1"}
                  strokeDasharray={isRayActive ? undefined : "3 3"}
                  style={{ transition: "all 0.35s ease" }}
                />

                {/* Subtle Light Pulse along connection when active/hovered */}
                {isRayActive && (
                  <circle r="3.5" fill="#ffffff">
                    <animateMotion
                      path={`M ${center} ${center} L ${targetX} ${targetY}`}
                      dur="2.2s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                <circle
                  cx={(center + targetX) / 2}
                  cy={(center + targetY) / 2}
                  r={isRayActive ? "4" : "2"}
                  fill={isRayActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.6)"}
                  style={{ transition: "all 0.35s ease" }}
                />
              </g>
            );
          })}
        </svg>

        {/* Central Identity Core DropZone with subtle hover reaction */}
        <div
          data-testid="identity-core-wrapper"
          style={{
            zIndex: 5,
            transition: "all 0.35s ease",
            transform: focusedStageId ? "scale(1.03)" : "scale(1)",
            filter: focusedStageId ? `drop-shadow(0 0 20px rgba(56, 229, 255, 0.35))` : undefined
          }}
        >
          <IdentityCoreDropZone sources={data.sources} />
        </div>

        {/* Orbiting Resonance Bubbles */}
        <div
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 6
          }}
        >
          {stages.map((st) => {
            const angleRad = (st.angleDeg * Math.PI) / 180;
            const x = Math.cos(angleRad) * radius;
            const y = Math.sin(angleRad) * radius;
            const isStageActive = activeStageId === st.stageId;
            const isStageHovered = hoveredStageId === st.stageId;
            const isStageDimmed = focusedStageId !== null && focusedStageId !== st.stageId;

            return (
              <div
                key={st.stageId}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px - 84px)`,
                  top: `calc(50% + ${y}px - 84px)`,
                  pointerEvents: "auto"
                }}
              >
                <OrbitalResonanceBubble
                  stageId={st.stageId}
                  stageName={`${st.glyph} ${st.stageName}`}
                  subtitle={st.subtitle}
                  itemCount={st.count}
                  previewItems={st.previewItems}
                  isActive={isStageActive}
                  isHovered={isStageHovered}
                  isDimmed={isStageDimmed}
                  animationDelay={st.animationDelay}
                  onClick={() => setActiveStageId(isStageActive ? null : st.stageId)}
                  onMouseEnter={() => setHoveredStageId(st.stageId)}
                  onMouseLeave={() => setHoveredStageId(null)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Collapsible Semantic Guide Drawer */}
      <div style={{ zIndex: 10 }}>
        <SemanticGuideDrawer />
      </div>
    </div>
  );
}

