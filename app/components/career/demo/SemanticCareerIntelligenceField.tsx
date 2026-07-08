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
      photonOutDur: "3.6s",
      photonInDur: "4.4s",
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
      photonOutDur: "4.2s",
      photonInDur: "5.0s",
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
      photonOutDur: "4.8s",
      photonInDur: "5.6s",
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
      photonOutDur: "3.9s",
      photonInDur: "4.7s",
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
      photonOutDur: "4.5s",
      photonInDur: "5.3s",
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
      photonOutDur: "5.1s",
      photonInDur: "6.0s",
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
      <style>{`
        @keyframes rotateClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes rotateCounterClockwise {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
      `}</style>
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

          {/* Phase 2b: Rotating Background Resonance Rings */}
          <g data-testid="rotating-background-rings" style={{ transformOrigin: `${center}px ${center}px` }}>
            <circle
              cx={center}
              cy={center}
              r={radius - 40}
              fill="none"
              stroke="rgba(56, 229, 255, 0.16)"
              strokeWidth="1"
              strokeDasharray="12 18"
              style={{ animation: "rotateClockwise 120s linear infinite", transformOrigin: `${center}px ${center}px` }}
            />
            <circle
              cx={center}
              cy={center}
              r={radius - 140}
              fill="none"
              stroke="rgba(56, 229, 255, 0.14)"
              strokeWidth="1"
              strokeDasharray="6 12"
              style={{ animation: "rotateCounterClockwise 90s linear infinite", transformOrigin: `${center}px ${center}px` }}
            />
          </g>

          {/* Phase 2b: Ambient Energy Nodes */}
          <g data-testid="ambient-energy-nodes">
            {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
              const rad = (deg * Math.PI) / 180;
              const nodeX = center + Math.cos(rad) * (radius - 70);
              const nodeY = center + Math.sin(rad) * (radius - 70);
              return (
                <circle
                  key={idx}
                  cx={nodeX}
                  cy={nodeY}
                  r="2.5"
                  fill="#38e5ff"
                  opacity="0.45"
                />
              );
            })}
          </g>

          {/* Phase 2c: Semantic Dust Particles in Interplanetary Space */}
          <g data-testid="semantic-dust-particles">
            {[25, 55, 85, 115, 145, 175, 205, 235, 265, 295, 325, 355].map((deg, idx) => {
              const rad = (deg * Math.PI) / 180;
              const dist = 140 + (idx % 3) * 55;
              const dustX = center + Math.cos(rad) * dist;
              const dustY = center + Math.sin(rad) * dist;
              return (
                <circle
                  key={idx}
                  cx={dustX}
                  cy={dustY}
                  r={idx % 2 === 0 ? "1.2" : "1.8"}
                  fill="#38e5ff"
                  opacity="0.3"
                />
              );
            })}
          </g>

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
                  strokeWidth={isRayActive ? "3" : "1"}
                  strokeDasharray={isRayActive ? undefined : "3 3"}
                  style={{ transition: "all 0.35s ease" }}
                />

                {/* Permanent Photon Core -> Orbit */}
                <circle
                  data-testid="photon-stream-core-to-orbit"
                  r={isRayActive ? "3.5" : "2.2"}
                  fill={isRayActive ? "#ffffff" : "#38e5ff"}
                  opacity={isRayActive ? 1 : 0.75}
                >
                  <animateMotion
                    path={`M ${center} ${center} L ${targetX} ${targetY}`}
                    dur={isRayActive ? "1.6s" : st.photonOutDur}
                    repeatCount="indefinite"
                  />
                </circle>

                {/* Permanent Photon Orbit -> Core */}
                <circle
                  data-testid="photon-stream-orbit-to-core"
                  r={isRayActive ? "3" : "1.8"}
                  fill={isRayActive ? "#38e5ff" : "#8eefff"}
                  opacity={isRayActive ? 0.95 : 0.6}
                >
                  <animateMotion
                    path={`M ${targetX} ${targetY} L ${center} ${center}`}
                    dur={isRayActive ? "2.1s" : st.photonInDur}
                    repeatCount="indefinite"
                  />
                </circle>

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
            filter: focusedStageId ? `drop-shadow(0 0 25px rgba(56, 229, 255, 0.55))` : undefined
          }}
        >
          <IdentityCoreDropZone sources={data.sources} isCommunicating={!!focusedStageId} />
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
                  angle={st.angleDeg}
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

