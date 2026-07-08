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
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.0)
 * SemanticCareerIntelligenceField: The living radial Bedeutungsraum organism.
 */
export function SemanticCareerIntelligenceField({ data }: SemanticCareerIntelligenceFieldProps) {
  const [activeStageId, setActiveStageId] = useState<string | null>(null);

  const stages = [
    {
      stageId: "01",
      stageName: "IDENTITY CORE",
      subtitle: "Unverfälschter Identitätskern",
      count: data.sources.length,
      glyph: "◈",
      angleDeg: -90
    },
    {
      stageId: "02",
      stageName: "CAPABILITY FIELD",
      subtitle: "Semantischer Kern",
      count: data.capabilities.length,
      glyph: "⬡",
      angleDeg: -30
    },
    {
      stageId: "03",
      stageName: "RESONANCE ORBITS",
      subtitle: "Organisationen im Feld",
      count: data.companyMatches.length,
      glyph: "◎",
      angleDeg: 30
    },
    {
      stageId: "04",
      stageName: "ROLE MANIFESTATION",
      subtitle: "Konkrete Rollen",
      count: data.roleMatches.length,
      glyph: "⎔",
      angleDeg: 90
    },
    {
      stageId: "05",
      stageName: "TENSION FIELD",
      subtitle: "Fähigkeitslücken",
      count: data.capabilityGaps.length,
      glyph: "⟁",
      angleDeg: 150
    },
    {
      stageId: "06",
      stageName: "EVOLUTION PATHS",
      subtitle: "Entwicklungspfade",
      count: data.nextActions.length,
      glyph: "∿",
      angleDeg: 210
    }
  ];

  const radius = 230;
  const center = 300;

  return (
    <div
      data-testid="semantic-career-intelligence-field"
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "860px",
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
        <span>SYS.FIELD // RADIUS: 230px</span>
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
          width: "600px",
          height: "600px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto"
        }}
      >
        {/* SVG Energy Flow Overlay connecting core to orbitals */}
        <svg
          width="600"
          height="600"
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
              <stop offset="0%" stopColor="#38e5ff" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#030508" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Core Ambient Aura */}
          <circle cx={center} cy={center} r="280" fill="url(#fieldGlow)" />

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
            r={radius - 70}
            fill="none"
            stroke="rgba(56, 229, 255, 0.12)"
            strokeWidth="1"
          />

          {/* Energy Rays Connecting Core to Each Orbital Node */}
          {stages.map((st) => {
            const angleRad = (st.angleDeg * Math.PI) / 180;
            const targetX = center + Math.cos(angleRad) * radius;
            const targetY = center + Math.sin(angleRad) * radius;
            const isActive = activeStageId === st.stageId;

            return (
              <g key={`ray-${st.stageId}`}>
                <line
                  x1={center}
                  y1={center}
                  x2={targetX}
                  y2={targetY}
                  stroke={isActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.28)"}
                  strokeWidth={isActive ? "2" : "1"}
                  strokeDasharray={isActive ? undefined : "3 3"}
                />
                <circle
                  cx={(center + targetX) / 2}
                  cy={(center + targetY) / 2}
                  r={isActive ? "3.5" : "2"}
                  fill={isActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.6)"}
                />
              </g>
            );
          })}
        </svg>

        {/* Central Identity Core DropZone */}
        <div style={{ zIndex: 5 }}>
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

            return (
              <div
                key={st.stageId}
                style={{
                  position: "absolute",
                  left: `calc(50% + ${x}px - 80px)`,
                  top: `calc(50% + ${y}px - 80px)`,
                  pointerEvents: "auto"
                }}
              >
                <OrbitalResonanceBubble
                  stageId={st.stageId}
                  stageName={`${st.glyph} ${st.stageName}`}
                  subtitle={st.subtitle}
                  itemCount={st.count}
                  isActive={activeStageId === st.stageId}
                  onClick={() => setActiveStageId(activeStageId === st.stageId ? null : st.stageId)}
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
