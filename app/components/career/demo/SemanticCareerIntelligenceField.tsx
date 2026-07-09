"use client";

import React, { useState } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";
import { IdentityCoreDropZone } from "./IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "./OrbitalResonanceBubble";
import { SourceDock } from "./SourceDock";
import { SemanticGuideDrawer } from "./SemanticGuideDrawer";
import { OrbitalSubspaceView, SemanticZoomLevel } from "./OrbitalSubspaceView";

export interface SemanticCareerIntelligenceFieldProps {
  data: DemoCareerIntelligenceData;
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v2.5 Phase 1 / SIL v3.0 Phase 3b)
 * SemanticCareerIntelligenceField: The living radial Bedeutungsraum organism with L0-L4 Semantic Zoom.
 */
export function SemanticCareerIntelligenceField({ data }: SemanticCareerIntelligenceFieldProps) {
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<SemanticZoomLevel>(0);

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
      {/* Phase 3b: NASA Semantic Zoom Telemetry Breadcrumb Bar */}
      <div
        data-testid="semantic-zoom-telemetry"
        style={{
          position: "absolute",
          top: "14px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 35,
          backgroundColor: "rgba(5, 10, 18, 0.92)",
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          boxShadow: `0 0 20px rgba(56, 229, 255, 0.25)`,
          backdropFilter: "blur(10px)",
          borderRadius: "20px",
          padding: "6px 18px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.8px"
        }}
      >
        {[
          { level: 0 as SemanticZoomLevel, label: "L0 PLANETARIUM" },
          { level: 1 as SemanticZoomLevel, label: "L1 CLUSTER" },
          { level: 2 as SemanticZoomLevel, label: "L2 EVIDENCE" },
          { level: 3 as SemanticZoomLevel, label: "L3 SOURCE" },
          { level: 4 as SemanticZoomLevel, label: "L4 ORIGINAL" }
        ].map((item, idx) => (
          <React.Fragment key={item.level}>
            {idx > 0 && <span style={{ color: "rgba(56, 229, 255, 0.35)" }}>→</span>}
            <span
              style={{
                color: zoomLevel === item.level ? "#ffffff" : zoomLevel > item.level ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.4)",
                textDecoration: zoomLevel === item.level ? "underline" : "none",
                cursor: item.level <= zoomLevel ? "pointer" : "default"
              }}
              onClick={() => {
                if (item.level <= zoomLevel) {
                  setZoomLevel(item.level);
                  if (item.level === 0) setActiveStageId(null);
                }
              }}
            >
              {item.label}
            </span>
          </React.Fragment>
        ))}

        {zoomLevel > 0 && (
          <button
            data-testid="zoom-reset-btn"
            onClick={() => {
              setZoomLevel(0);
              setActiveStageId(null);
            }}
            style={{
              marginLeft: "8px",
              backgroundColor: "rgba(56, 229, 255, 0.15)",
              border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
              color: SIL_TOKENS.colors.cyanActive,
              fontSize: "8.5px",
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: "10px",
              cursor: "pointer"
            }}
          >
            RESET L0
          </button>
        )}
      </div>

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
        {zoomLevel === 0 ? (
          <>
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

              {/* Phase 2a: Atmospheric Field Glow Background */}
              <circle
                cx={center}
                cy={center}
                r={radius + 30}
                fill="url(#fieldGlow)"
              />

              {/* Concentric Orbit Paths */}
              {[radius * 0.35, radius * 0.68, radius].map((r, i) => (
                <circle
                  key={i}
                  cx={center}
                  cy={center}
                  r={r}
                  fill="none"
                  stroke="rgba(56, 229, 255, 0.12)"
                  strokeWidth="1"
                  strokeDasharray={i === 1 ? "4 4" : undefined}
                />
              ))}

              {/* Phase 2b: Living Ecosystem Field Ambient Elements */}
              <g data-testid="ambient-energy-nodes">
                {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
                  const rAmbient = radius * 0.82;
                  const rad = (deg * Math.PI) / 180;
                  const ax = center + Math.cos(rad) * rAmbient;
                  const ay = center + Math.sin(rad) * rAmbient;
                  return (
                    <circle
                      key={idx}
                      cx={ax}
                      cy={ay}
                      r="1.5"
                      fill="rgba(56, 229, 255, 0.38)"
                    />
                  );
                })}
              </g>

              {/* Phase 2b: Semantic Dust Particles */}
              <g data-testid="semantic-dust-particles">
                {[45, 135, 225, 315].map((deg, idx) => {
                  const rDust = radius * 0.5;
                  const rad = (deg * Math.PI) / 180;
                  const dx = center + Math.cos(rad) * rDust;
                  const dy = center + Math.sin(rad) * rDust;
                  return (
                    <circle
                      key={idx}
                      cx={dx}
                      cy={dy}
                      r="1"
                      fill="rgba(56, 229, 255, 0.25)"
                    />
                  );
                })}
              </g>

              {/* Phase 2d: Inter-Orbital Coupling weighted relationships */}
              <g data-testid="inter-orbital-coupling">
                <path
                  d={`M ${center + Math.cos((60 * Math.PI) / 180) * radius} ${center + Math.sin((60 * Math.PI) / 180) * radius} Q ${center + 140} ${center - 80} ${center + Math.cos((120 * Math.PI) / 180) * radius} ${center + Math.sin((120 * Math.PI) / 180) * radius}`}
                  fill="none"
                  stroke={SIL_TOKENS.colors.cyanActive}
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  opacity="0.45"
                />
                <path
                  d={`M ${center + Math.cos((180 * Math.PI) / 180) * radius} ${center + Math.sin((180 * Math.PI) / 180) * radius} Q ${center - 110} ${center + 120} ${center + Math.cos((300 * Math.PI) / 180) * radius} ${center + Math.sin((300 * Math.PI) / 180) * radius}`}
                  fill="none"
                  stroke="rgba(56, 229, 255, 0.22)"
                  strokeWidth="1.2"
                  strokeDasharray="3 5"
                />
              </g>

              {/* Phase 2d: Sympathetic Resonance Cascade on Interaction */}
              {focusedStageId && (
                <g data-testid="resonance-cascade">
                  <circle
                    cx={center}
                    cy={center}
                    r={radius - 20}
                    fill="none"
                    stroke={SIL_TOKENS.colors.cyanActive}
                    strokeWidth="1.8"
                    opacity="0.7"
                    style={{ animation: "waveExpand 1.6s ease-out infinite" }}
                  />
                </g>
              )}

              {/* Energy Rays Connecting Core to Each Orbital Node */}
              {stages.map((st) => {
                const angleRad = (st.angleDeg * Math.PI) / 180;
                const targetX = center + Math.cos(angleRad) * radius;
                const targetY = center + Math.sin(angleRad) * radius;
                const isRayActive = focusedStageId === st.stageId;

                return (
                  <g key={st.stageId}>
                    <line
                      x1={center}
                      y1={center}
                      x2={targetX}
                      y2={targetY}
                      stroke={isRayActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.28)"}
                      strokeWidth={isRayActive ? "2.5" : "1.2"}
                      strokeDasharray={isRayActive ? undefined : "3 3"}
                      style={{ transition: "all 0.35s ease" }}
                    />

                    <circle
                      data-testid="photon-stream-core-to-orbit"
                      r={isRayActive ? "3" : "1.8"}
                      fill={isRayActive ? "#ffffff" : SIL_TOKENS.colors.cyanActive}
                      opacity={isRayActive ? 1 : 0.65}
                    >
                      <animateMotion
                        path={`M ${center} ${center} L ${targetX} ${targetY}`}
                        dur={isRayActive ? "1.6s" : st.photonOutDur}
                        repeatCount="indefinite"
                      />
                    </circle>

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
                      onClick={() => {
                        const newActive = isStageActive ? null : st.stageId;
                        setActiveStageId(newActive);
                        setZoomLevel(newActive ? 1 : 0);
                      }}
                      onMouseEnter={() => setHoveredStageId(st.stageId)}
                      onMouseLeave={() => setHoveredStageId(null)}
                    />
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ zIndex: 20 }}>
            {activeStageId && (
              <OrbitalSubspaceView
                stageId={activeStageId}
                stageName={stages.find((s) => s.stageId === activeStageId)?.stageName || activeStageId}
                subtitle={stages.find((s) => s.stageId === activeStageId)?.subtitle}
                zoomLevel={zoomLevel}
                onZoomChange={(lvl) => {
                  setZoomLevel(lvl);
                  if (lvl === 0) setActiveStageId(null);
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Phase 3a: Compact Scientific Focus Detail Panel when an orbit is focused */}
      {activeStageId && (
        <div
          data-testid="semantic-focus-panel"
          style={{
            position: "absolute",
            top: "54px",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 25,
            backgroundColor: "rgba(6, 11, 18, 0.92)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            boxShadow: `0 0 30px ${SIL_TOKENS.colors.cyanGlowStrong}`,
            backdropFilter: "blur(12px)",
            borderRadius: "6px",
            padding: "10px 18px",
            display: "flex",
            alignItems: "center",
            gap: "18px",
            color: SIL_TOKENS.colors.textPrimary,
            fontSize: "11px"
          }}
        >
          <div>
            <div style={{ fontSize: "9px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700, letterSpacing: "1px" }}>
              ACTIVE FOCUS // ORBIT {activeStageId}
            </div>
            <div style={{ fontWeight: 600, fontSize: "12px", marginTop: "2px" }}>
              {stages.find((s) => s.stageId === activeStageId)?.stageName}
            </div>
          </div>
          <div style={{ height: "24px", width: "1px", backgroundColor: "rgba(56, 229, 255, 0.25)" }} />
          <div style={{ display: "flex", gap: "12px", fontSize: "10px", color: SIL_TOKENS.colors.textMuted }}>
            <span>STATE: <strong style={{ color: SIL_TOKENS.colors.cyanActive }}>RESONANT</strong></span>
            <span>EVIDENCE: <strong style={{ color: SIL_TOKENS.colors.textPrimary }}>VERIFIED</strong></span>
          </div>
          <button
            onClick={() => setActiveStageId(null)}
            style={{
              backgroundColor: "transparent",
              border: `1px solid rgba(56, 229, 255, 0.35)`,
              color: SIL_TOKENS.colors.cyanActive,
              fontSize: "9px",
              padding: "4px 8px",
              borderRadius: "3px",
              cursor: "pointer"
            }}
          >
            RESET FOCUS
          </button>
        </div>
      )}

      {/* Right Collapsible Semantic Guide Drawer */}
      <div style={{ zIndex: 10 }}>
        <SemanticGuideDrawer />
      </div>
    </div>
  );
}

