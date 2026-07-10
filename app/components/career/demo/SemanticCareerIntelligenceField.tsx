"use client";

import React, { useState } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";
import { IdentityCoreDropZone } from "./IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "./OrbitalResonanceBubble";
import { SourceDock } from "./SourceDock";
import { SemanticGuideDrawer } from "./SemanticGuideDrawer";
import { OrbitalSubspaceView, SemanticZoomLevel } from "./OrbitalSubspaceView";
import { InferenceTelemetryHUD } from "./InferenceTelemetryHUD";
import { buildEvidenceGraph } from "../../../../lib/career/evidence/traversal";
import { computeGraphFocus } from "../../../../lib/career/evidence/highlight";
import { DecisionGraphInspector } from "./DecisionGraphInspector";

export interface SemanticCareerIntelligenceFieldProps {
  data: DemoCareerIntelligenceData;
  initialAnalysisState?: {
    isAnalyzing?: boolean;
    analysisStep?: string | null;
    analysisError?: string | null;
    analysisSuccess?: boolean;
    inferenceTelemetry?: any;
  };
}

/**
 * CONDYN / SYNTX — Semantic Interface Language (SIL v3.0 Phase 3c Continuous Semantic Space)
 * SemanticCareerIntelligenceField: The living radial Bedeutungsraum organism with L0-L4 Semantic Zoom.
 */
export function SemanticCareerIntelligenceField({
  data,
  initialAnalysisState
}: SemanticCareerIntelligenceFieldProps) {
  const [activeData, setActiveData] = useState(data);
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<SemanticZoomLevel>(0);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(initialAnalysisState?.isAnalyzing ?? false);
  const [analysisStep, setAnalysisStep] = useState<string | null>(initialAnalysisState?.analysisStep ?? null);
  const [analysisError, setAnalysisError] = useState<string | null>(initialAnalysisState?.analysisError ?? null);
  const [analysisSuccess, setAnalysisSuccess] = useState(initialAnalysisState?.analysisSuccess ?? false);
  const [inferenceTelemetry, setInferenceTelemetry] = useState<any>(initialAnalysisState?.inferenceTelemetry ?? null);
  const [lastStagedDocs, setLastStagedDocs] = useState<any[]>([]);

  const handleAnalyze = async (stagedDocs: any[]) => {
    setLastStagedDocs(stagedDocs);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisSuccess(false);
    setAnalysisStep("ingesting");

    try {
      setTimeout(() => setAnalysisStep("extracting"), 300);
      setTimeout(() => setAnalysisStep("validating"), 600);
      setTimeout(() => setAnalysisStep("matching"), 900);

      const documentsPayload = stagedDocs.map((doc) => {
        if (doc.type === "pdf") {
          return { type: "pdf", content: doc.content, title: doc.title };
        }
        if (doc.type === "github" || doc.type === "website") {
          return { type: doc.type, url: doc.url, title: doc.title };
        }
        return { type: "text", content: doc.content, title: doc.title };
      });

      const res = await fetch("/api/career/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents: documentsPayload })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.issues?.[0]?.message || "Analyse fehlgeschlagen.");
      }

      setAnalysisStep("complete");
      if (json.inferenceTelemetry) {
        setInferenceTelemetry(json.inferenceTelemetry);
      }
      setActiveData((prev) => ({
        ...prev,
        sources: stagedDocs.map((d) => ({
          id: d.id,
          name: d.title,
          type: d.type,
          status: "VERIFIED"
        }))
      }));
      setAnalysisSuccess(true);
    } catch (err: any) {
      setAnalysisError(err.message || "Fehler bei der Analyse");
      setAnalysisSuccess(false);
    } finally {
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisStep(null);
      }, 300);
    }
  };

  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  const evidenceGraph = React.useMemo(() => {
    return buildEvidenceGraph({ structured_data: activeData }, [
      {
        jobId: "job_siemens_lead",
        title: "Principal Cloud Architect",
        company: "Siemens AG",
        requirements: (activeData.capabilities || []).map((c) => ({
          capability_name: c.name || "Capability",
          domain: "DevOps",
          weight: 0.5,
          required_level: "L5"
        }))
      }
    ]);
  }, [activeData]);

  const graphFocus = React.useMemo(() => {
    if (!selectedGraphNodeId) return null;
    return computeGraphFocus(evidenceGraph, selectedGraphNodeId);
  }, [evidenceGraph, selectedGraphNodeId]);

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

  const activeStageObj = stages.find((s) => s.stageId === activeStageId);
  const activeAngleRad = activeStageObj ? (activeStageObj.angleDeg * Math.PI) / 180 : 0;
  const activeOrbitX = Math.cos(activeAngleRad) * radius;
  const activeOrbitY = Math.sin(activeAngleRad) * radius;

  let cameraScale = 1;
  let cameraTranslateX = 0;
  let cameraTranslateY = 0;

  if (zoomLevel === 1 && activeStageId) {
    cameraScale = 1.65;
    cameraTranslateX = -activeOrbitX * 0.85;
    cameraTranslateY = -activeOrbitY * 0.85;
  } else if (zoomLevel >= 2 && activeStageId) {
    cameraScale = 2.2;
    cameraTranslateX = -activeOrbitX * 0.95;
    cameraTranslateY = -activeOrbitY * 0.95;
  }

  const subClusters = activeStageId
    ? [
        {
          id: `cl-${activeStageId}-1`,
          title: "Core Architecture Cluster",
          confidence: "98%",
          evidenceCount: 14,
          dx: -130,
          dy: -85,
          evidences: [
            { id: `ev-${activeStageId}-1`, title: "Distributed System Reference", sourceType: "PDF", snippet: "System design specification verified." },
            { id: `ev-${activeStageId}-2`, title: "Core Reconciler Implementation", sourceType: "GitHub", snippet: "pkg/engine/reconcile.go lines 14-88" }
          ]
        },
        {
          id: `cl-${activeStageId}-2`,
          title: "Semantic Resonance Vector",
          confidence: "95%",
          evidenceCount: 9,
          dx: 130,
          dy: -75,
          evidences: [
            { id: `ev-${activeStageId}-3`, title: "SIL v3.0 Continuous Space Engine", sourceType: "GitHub", snippet: "app/components/career/demo/SemanticCareerIntelligenceField.tsx" }
          ]
        }
      ]
    : [];

  return (
    <div
      data-testid="semantic-career-intelligence-field"
      data-zoom-level={zoomLevel}
      data-focused-stage-id={activeStageId || ""}
      data-camera-scale={cameraScale}
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "960px",
        padding: "24px 32px",
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative",
        overflow: "visible",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start"
      }}
    >

      {/* Phase 3c: Floating Mini-HUD Camera Instrument at top center */}
      <div
        data-testid="semantic-zoom-telemetry"
        className="semantic-zoom-telemetry--core"
        style={{
          position: "absolute",
          top: "-46px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 40,
          maxWidth: "560px",
          width: "max-content",
          backgroundColor: "rgba(6, 14, 24, 0.65)",
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          boxShadow: `0 0 16px rgba(56, 229, 255, 0.22)`,
          backdropFilter: "blur(10px)",
          borderRadius: "16px",
          padding: "6px 14px",
          display: "flex",
          alignItems: "center",
          gap: "6px"
        }}
      >
        {[
          { level: 0 as SemanticZoomLevel, label: "L0", title: "PLANETARIUM", isEnabled: true },
          { level: 1 as SemanticZoomLevel, label: "L1", title: "CLUSTER", isEnabled: activeStageId !== null },
          { level: 2 as SemanticZoomLevel, label: "L2", title: "EVIDENCE", isEnabled: selectedClusterId !== null },
          { level: 3 as SemanticZoomLevel, label: "L3", title: "SOURCE", isEnabled: false },
          { level: 4 as SemanticZoomLevel, label: "L4", title: "ORIGINAL", isEnabled: false }
        ].map((item, idx) => {
          const isCurrent = zoomLevel === item.level;
          return (
            <React.Fragment key={item.level}>
              {idx > 0 && <span style={{ color: "rgba(56, 229, 255, 0.3)", fontSize: "9px" }}>●──</span>}
              <button
                type="button"
                disabled={!item.isEnabled}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={!item.isEnabled ? "true" : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!item.isEnabled) return;
                  if (item.level === 0) {
                    setZoomLevel(0);
                    setActiveStageId(null);
                    setSelectedClusterId(null);
                  } else {
                    setZoomLevel(item.level);
                  }
                }}
                style={{
                  background: isCurrent ? "rgba(56, 229, 255, 0.22)" : "transparent",
                  border: isCurrent ? `1px solid ${SIL_TOKENS.colors.cyanActive}` : "1px solid transparent",
                  borderRadius: "8px",
                  color: isCurrent ? "#ffffff" : item.isEnabled ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)",
                  cursor: item.isEnabled ? "pointer" : "not-allowed",
                  padding: "3px 8px",
                  fontSize: "9px",
                  fontWeight: 700,
                  fontFamily: SIL_TOKENS.typography.mono,
                  letterSpacing: "0.5px",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease"
                }}
              >
                {`${item.label} ${item.title}`}
              </button>
            </React.Fragment>
          );
        })}
      </div>

      {/* Left Compact SourceDock */}
      <div style={{ zIndex: 10 }}>
        <SourceDock onAnalyze={handleAnalyze} isAnalyzing={isAnalyzing} />
      </div>

      {/* Telemetry Ingestion Status Banner */}
      {isAnalyzing && (
        <div
          data-testid="intake-telemetry-banner"
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(10, 14, 20, 0.92)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            padding: "8px 16px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "11px",
            zIndex: 100,
            boxShadow: "0 0 20px rgba(56, 229, 255, 0.35)",
            display: "flex",
            alignItems: "center",
            gap: "10px"
          }}
        >
          <span style={{ animation: "atmosphereGlow 1.5s infinite" }}>●</span>
          <span>INTAKE TELEMETRY // STEP: {(analysisStep || "INGESTING").toUpperCase()}</span>
        </div>
      )}

      {analysisSuccess && (
        <div
          data-testid="intake-success-banner"
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(10, 24, 20, 0.95)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            padding: "10px 18px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "11px",
            zIndex: 100,
            boxShadow: "0 0 24px rgba(56, 229, 255, 0.4)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px"
          }}
        >
          <div style={{ fontWeight: 700 }}>ANALYSE ERFOLGREICH ABGESCHLOSSEN</div>
          <div style={{ fontSize: "10px", color: SIL_TOKENS.colors.textPrimary }}>
            IDENTITÄTSKERN & ORBITS MANIFESTIERT
          </div>
        </div>
      )}

      {analysisError && (
        <div
          data-testid="intake-error-banner"
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(30, 10, 14, 0.95)",
            border: "1px solid #ff5555",
            borderRadius: "8px",
            padding: "10px 16px",
            color: "#ff5555",
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "11px",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}
        >
          <div>
            <div style={{ fontWeight: 700 }}>ANALYSE FEHLGESCHLAGEN</div>
            <div style={{ fontSize: "10px" }}>{analysisError}</div>
          </div>
          <button
            data-testid="retry-intake-btn"
            onClick={() => handleAnalyze(lastStagedDocs)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#ff5555",
              color: "#0a0e14",
              border: "none",
              borderRadius: "4px",
              fontWeight: 700,
              fontSize: "10px",
              cursor: "pointer"
            }}
          >
            NEU VERSUCHEN
          </button>
        </div>
      )}

      <InferenceTelemetryHUD
        telemetry={inferenceTelemetry}
        isAnalyzing={isAnalyzing}
      />

      <DecisionGraphInspector
        graph={evidenceGraph}
        focus={graphFocus}
        onSelectNode={(id) => setSelectedGraphNodeId(id)}
      />

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
          margin: "16px auto 0",
          transform: `scale(${cameraScale}) translate(${cameraTranslateX}px, ${cameraTranslateY}px)`,
          transition: "transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)"
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
              </g>

              {/* Phase 2b: Living Ecosystem Field Ambient Elements */}
              <g data-testid="ambient-energy-nodes">
                {[0, 60, 120, 180, 240, 300].map((deg, idx) => {
                  const rAmbient = radius * 0.82;
                  const rad = (deg * Math.PI) / 180;
                  const ax = Math.round((center + Math.cos(rad) * rAmbient) * 100) / 100;
                  const ay = Math.round((center + Math.sin(rad) * rAmbient) * 100) / 100;
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
                  d="M 565 685.79 Q 540 320 235 685.79"
                  fill="none"
                  stroke={SIL_TOKENS.colors.cyanActive}
                  strokeWidth="2.2"
                  strokeDasharray="6 4"
                  opacity="0.45"
                />
                <path
                  d="M 70 400 Q 290 520 565 114.21"
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
                const targetX = Math.round((center + Math.cos(angleRad) * radius) * 100) / 100;
                const targetY = Math.round((center + Math.sin(angleRad) * radius) * 100) / 100;
                const isRayActive = focusedStageId === st.stageId;

                return (
                  <g key={`ray-${st.stageId}`} data-testid={`energy-ray-${st.stageId}`}>
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
                const x = Math.round(Math.cos(angleRad) * radius * 100) / 100;
                const y = Math.round(Math.sin(angleRad) * radius * 100) / 100;
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

            {/* Phase 3c: Continuous Semantic Space Sub-Clusters (L1) */}
            {zoomLevel >= 1 && activeStageId && (
              <>
                <svg
                  width="800"
                  height="800"
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                    zIndex: 14
                  }}
                >
                  {subClusters.map((cluster) => (
                    <line
                      key={`line-${cluster.id}`}
                      x1={center + activeOrbitX}
                      y1={center + activeOrbitY}
                      x2={Math.round((center + activeOrbitX + cluster.dx) * 100) / 100}
                      y2={Math.round((center + activeOrbitY + cluster.dy) * 100) / 100}
                      stroke={SIL_TOKENS.colors.cyanActive}
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                  ))}
                </svg>

                {subClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    data-testid="subspace-cluster"
                    onClick={() => {
                      setSelectedClusterId(cluster.id);
                      setZoomLevel(2);
                    }}
                    style={{
                      position: "absolute",
                      left: `${Math.round((center + activeOrbitX + cluster.dx - 90) * 100) / 100}px`,
                      top: `${Math.round((center + activeOrbitY + cluster.dy - 35) * 100) / 100}px`,
                      width: "180px",
                      backgroundColor: "rgba(10, 18, 30, 0.92)",
                      border: `1px solid ${selectedClusterId === cluster.id ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.45)"}`,
                      borderRadius: "8px",
                      padding: "10px",
                      cursor: "pointer",
                      zIndex: 15,
                      boxShadow: "0 0 16px rgba(56, 229, 255, 0.18)"
                    }}
                  >
                    <div style={{ fontSize: "9px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
                      CLUSTER NODE // {cluster.confidence}
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 700, margin: "4px 0" }}>
                      {cluster.title}
                    </div>
                    <div style={{ fontSize: "9px", color: SIL_TOKENS.colors.textMuted }}>
                      {cluster.evidenceCount} Verified Objects
                    </div>
                  </div>
                ))}
              </>
            )}

            {/* Phase 3c: Continuous Semantic Space Evidence Nodes (L2) */}
            {zoomLevel >= 2 && selectedClusterId && (
              <>
                {subClusters
                  .filter((cl) => cl.id === selectedClusterId)
                  .flatMap((cl) => cl.evidences)
                  .map((ev, i) => (
                    <div
                      key={ev.id}
                      data-testid="evidence-node"
                      style={{
                        position: "absolute",
                        left: `${Math.round((center + activeOrbitX + (i === 0 ? -190 : 20)) * 100) / 100}px`,
                        top: `${Math.round((center + activeOrbitY + (i === 0 ? 35 : 45)) * 100) / 100}px`,
                        width: "160px",
                        backgroundColor: "rgba(6, 12, 20, 0.95)",
                        border: "1px solid #38e5ff",
                        borderRadius: "6px",
                        padding: "8px",
                        zIndex: 16
                      }}
                    >
                      <div style={{ fontSize: "8px", color: "#38e5ff", fontWeight: 700 }}>
                        EVIDENCE // {ev.sourceType}
                      </div>
                      <div style={{ fontSize: "10px", fontWeight: 700, margin: "3px 0" }}>
                        {ev.title}
                      </div>
                      <div style={{ fontSize: "9px", color: "#63788a" }}>
                        {ev.snippet}
                      </div>
                    </div>
                  ))}
              </>
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

