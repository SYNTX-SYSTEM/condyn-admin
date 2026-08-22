"use client";

import React, { useState, useEffect } from "react";
import { DemoCareerIntelligenceData } from "../../../career/demo/demo-data";
import { SIL_TOKENS } from "./SILTokens";
import { IdentityCoreDropZone } from "./IdentityCoreDropZone";
import { OrbitalResonanceBubble } from "./OrbitalResonanceBubble";
import { SourceDock } from "./SourceDock";
import { SemanticGuideDrawer } from "./SemanticGuideDrawer";
import { SystemCodexModal } from "./SystemCodexModal";
import { GuidedOnboardingOverlay } from "./GuidedOnboardingOverlay";
import { OrbitalSubspaceView, SemanticZoomLevel } from "./OrbitalSubspaceView";
import { InferenceTelemetryHUD } from "./InferenceTelemetryHUD";
import { buildEvidenceGraph } from "../../../../lib/career/evidence/traversal";
import { computeGraphFocus } from "../../../../lib/career/evidence/highlight";
import { DecisionGraphInspector } from "./DecisionGraphInspector";
import { adaptCanonicalToDemoState } from "../../../../lib/career/ui-adapter";
import { buildSilSourcePresentation } from "../../../../lib/career/view-model/source-presentation";
import { buildSilClusterPresentation } from "../../../../lib/career/view-model/cluster-presentation";
import { useCareerAnalysisJob } from "../../../../lib/career/ui/useCareerAnalysisJob";

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
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [zoomLevel, setZoomLevel] = useState<SemanticZoomLevel>(0);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);
  
  const job = useCareerAnalysisJob();
  const jobState = job.state.state;
  const isAnalyzing = jobState === "SUBMITTING" || jobState === "PENDING" || jobState === "RUNNING" || jobState === "LOADING_RESULT";
  const analysisError = jobState === "FAILED" ? JSON.stringify({ status: job.state.errorCode || 500, issues: [{ message: job.state.errorSummary || "Job Failed" }] }) : null;
  const analysisSuccess = jobState === "SUCCEEDED";
  const analysisStep = jobState; // fallback mapping

  const [inferenceTelemetry, setInferenceTelemetry] = useState<any>(initialAnalysisState?.inferenceTelemetry ?? null);
  const [lastStagedDocs, setLastStagedDocs] = useState<any[]>([]);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const seen = localStorage.getItem("condyn_onboarding_seen");
        if (!seen) {
          setIsOnboardingOpen(true);
        }
      } catch (err) {}
    }
  }, []);

  useEffect(() => {
    if (job.state.state === "SUCCEEDED" && job.state.canonicalAnalysis) {
      const canonical = job.state.canonicalAnalysis;
      if (canonical.inferenceTelemetry) {
        setInferenceTelemetry(canonical.inferenceTelemetry);
      }
      
      const realData = canonical.analysis || canonical.data || canonical;
      const projectedRealState = adaptCanonicalToDemoState(
        realData, 
        lastStagedDocs, 
        canonical.sourceManifest
      );
      setActiveData(projectedRealState);
    }
  }, [job.state.state, job.state.canonicalAnalysis]);

  const handleHudAction = (action: "OPEN EVIDENCE" | "INSPECT SOURCES" | "VIEW MATCHES", stageId: string) => {
    setActiveStageId(stageId);
    if (action === "OPEN EVIDENCE" || action === "INSPECT SOURCES") {
      setZoomLevel(2);
      
      let firstId = `cl-${stageId}-0`;
      if (stageId === "02" && activeData.capabilities?.length > 0) firstId = activeData.capabilities[0].id || activeData.capabilities[0].capabilityId || firstId;
      if (stageId === "03" && activeData.companyMatches?.length > 0) firstId = activeData.companyMatches[0].companyId || firstId;
      if (stageId === "04" && activeData.roleMatches?.length > 0) firstId = activeData.roleMatches[0].jobId || firstId;
      if (stageId === "05" && activeData.tensionField?.length > 0) firstId = activeData.tensionField[0].requirementId || firstId;
      if (stageId === "06" && activeData.evolutionPaths?.length > 0) firstId = activeData.evolutionPaths[0].id || firstId;
      
      setSelectedClusterId(firstId);
    } else if (action === "VIEW MATCHES") {
      setZoomLevel(1);
      setSelectedClusterId(null);
    }
  };

  const handleAnalyze = async (stagedDocs: any[]) => {
    setLastStagedDocs(stagedDocs);
    const documentsPayload = stagedDocs.map((doc) => {
      if (doc.type === "pdf") {
        return { type: "pdf", content: doc.content, title: doc.title, docId: doc.id };
      }
      if (doc.type === "github" || doc.type === "website") {
        return { type: doc.type, url: doc.url, title: doc.title, docId: doc.id };
      }
      return { type: "text", content: doc.content, title: doc.title, docId: doc.id };
    });

    job.submitAnalysis({ documents: documentsPayload });
  };

  const [selectedGraphNodeId, setSelectedGraphNodeId] = useState<string | null>(null);

  const evidenceGraph = React.useMemo(() => {
    return buildEvidenceGraph({ structured_data: activeData }, []);
  }, [activeData]);

  const sourcePresentation = React.useMemo(() => {
    return buildSilSourcePresentation(activeData);
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
      count: activeData.sources.length,
      glyph: "◈",
      angleDeg: -90,
      color: "#38e5ff",
      animationDelay: "0s",
      photonOutDur: "3.6s",
      photonInDur: "4.4s",
      previewItems: activeData.sources.slice(0, 3).map((s) => s.sourceTitle || (s as any).name || "Quellendokument")
    },
    {
      stageId: "02",
      stageName: "CAPABILITY FIELD",
      subtitle: "Semantischer Kern",
      count: activeData.capabilities.length,
      glyph: "⬡",
      angleDeg: -30,
      color: "#00ffd5",
      animationDelay: "-4s",
      photonOutDur: "4.2s",
      photonInDur: "5.0s",
      previewItems: activeData.capabilities.slice(0, 3).map((c) => c.name)
    },
    {
      stageId: "03",
      stageName: "RESONANCE ORBITS",
      subtitle: "Organisationen im Feld",
      count: activeData.companyMatches.length,
      glyph: "◎",
      angleDeg: 30,
      color: "#6b8eff",
      animationDelay: "-8s",
      photonOutDur: "4.8s",
      photonInDur: "5.6s",
      previewItems: activeData.companyMatches.slice(0, 3).map((c) => c.organizationName)
    },
    {
      stageId: "04",
      stageName: "ROLE MANIFESTATION",
      subtitle: "Konkrete Rollen",
      count: activeData.roleMatches.length,
      glyph: "⎔",
      angleDeg: 90,
      color: "#b87fff",
      animationDelay: "-12s",
      photonOutDur: "3.9s",
      photonInDur: "4.7s",
      previewItems: activeData.roleMatches.slice(0, 3).map((r) => r.roleTitle)
    },
    {
      stageId: "05",
      stageName: "TENSION FIELD",
      subtitle: "Fähigkeitslücken",
      count: activeData.capabilityGaps.length,
      glyph: "⟁",
      angleDeg: 150,
      color: "#ff7c5c",
      animationDelay: "-16s",
      photonOutDur: "4.5s",
      photonInDur: "5.3s",
      previewItems: activeData.capabilityGaps.slice(0, 3).map((g) => g.capabilityName)
    },
    {
      stageId: "06",
      stageName: "EVOLUTION PATHS",
      subtitle: "Entwicklungspfade",
      count: activeData.nextActions.length,
      glyph: "∿",
      angleDeg: 210,
      color: "#38ff8b",
      animationDelay: "-20s",
      photonOutDur: "5.1s",
      photonInDur: "6.0s",
      previewItems: activeData.nextActions.slice(0, 3).map((a) => a.title)
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

  const subClusters = buildSilClusterPresentation(
    activeStageId,
    analysisSuccess,
    sourcePresentation,
    activeData
  );

  return (
    <div
      data-testid="semantic-career-intelligence-field"
      data-zoom-level={zoomLevel}
      data-focused-stage-id={activeStageId || ""}
      data-camera-scale={cameraScale}
      onClick={() => {
        if (graphFocus) {
          setSelectedGraphNodeId(null);
        }
      }}
      style={{
        backgroundColor: SIL_TOKENS.colors.void,
        color: SIL_TOKENS.colors.textPrimary,
        minHeight: "960px",
        height: "100vh",
        width: "100%",
        fontFamily: SIL_TOKENS.typography.mono,
        position: "relative",
        overflow: "hidden"
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
                suppressHydrationWarning
                type="button"
                disabled={item.isEnabled ? undefined : true}
                aria-current={isCurrent ? "step" : undefined}
                aria-disabled={item.isEnabled ? undefined : true}
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
      <div style={{ position: "absolute", top: "50%", transform: "translateY(-50%)", left: "40px", zIndex: 30 }}>
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
          <span>INTAKE TELEMETRY // STEP: {jobState === "PENDING" ? "QUEUED" : (jobState === "RUNNING" ? "ANALYZING SOURCES..." : jobState.toUpperCase())}</span>
        </div>
      )}

      {analysisSuccess && (
        <div
          data-testid="intake-success-banner"
          style={{
            position: "absolute",
            bottom: "32px",
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

      {analysisError && (() => {
        let errData = { status: 500, issues: [{ message: analysisError }] };
        try { errData = JSON.parse(analysisError); } catch (e) {}
        
        return (
        <div
          data-testid="intake-error-banner"
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(26, 9, 11, 0.96)",
            border: "1px solid #ff3333",
            borderRadius: "8px",
            padding: "16px 24px",
            color: "#ff5555",
            fontFamily: SIL_TOKENS.typography.mono,
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            boxShadow: "0 0 30px rgba(255, 51, 51, 0.25)",
            maxWidth: "600px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 800, fontSize: "14px", letterSpacing: "1px" }}>
              {errData.status === 422 ? "SEMANTIC BOUNDARY VIOLATION" : errData.status === 503 ? "PROVIDER TRUNCATION" : "ANALYSE FEHLGESCHLAGEN"}
            </div>
            <div style={{ fontSize: "10px", color: "rgba(255, 85, 85, 0.7)" }}>HTTP {errData.status}</div>
          </div>
          
          <div style={{ fontSize: "11px", color: "#ffbaba", lineHeight: "1.5" }}>
            {errData.status === 422 && "Model output violated the canonical semantic contract and was rejected before entering the validated state."}
            {errData.status === 503 && "Das Modell hat das maximale Token-Limit überschritten (Truncation) oder der Provider ist nicht erreichbar. Die Pipeline hat die strukturierte Extraktion abgebrochen."}
          </div>

          <div style={{ maxHeight: "150px", overflowY: "auto", borderTop: "1px solid rgba(255, 51, 51, 0.3)", paddingTop: "8px", marginTop: "4px" }}>
            {errData.issues.map((issue: any, i: number) => (
              <div key={i} style={{ fontSize: "10px", marginBottom: "6px", display: "flex", gap: "8px" }}>
                <span style={{ color: "#ff3333" }}>•</span>
                <div>
                  {issue.code && <strong style={{ color: "#ff3333", display: "block" }}>[{issue.code}]</strong>}
                  <span style={{ color: "#ff8888" }}>{issue.message}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "8px" }}>
            <button
              data-testid="retry-intake-btn"
              onClick={() => handleAnalyze(lastStagedDocs)}
              style={{
                padding: "8px 16px",
                backgroundColor: "#ff3333",
                color: "#0a0e14",
                border: "none",
                borderRadius: "4px",
                fontWeight: 800,
                fontSize: "11px",
                cursor: "pointer",
                letterSpacing: "1px",
                transition: "background 0.2s"
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#ff5555"}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#ff3333"}
            >
              NEU VERSUCHEN
            </button>
          </div>
        </div>
      );})()}

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
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "800px",
          height: "800px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translate(calc(-50% + ${cameraTranslateX}px), calc(-50% + ${cameraTranslateY}px)) scale(${cameraScale})`,
          transition: "transform 0.75s cubic-bezier(0.16, 1, 0.3, 1)",
          zIndex: 5
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
                
                let isRayRelated = false;
                if (graphFocus) {
                  const focusSet = new Set([graphFocus.focusNodeId, ...graphFocus.upstreamNodes, ...graphFocus.downstreamNodes]);
                  if (st.stageId === "01") isRayRelated = evidenceGraph.sourceNodes.some(n => focusSet.has(n.id)) || evidenceGraph.evidenceNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "02") isRayRelated = evidenceGraph.capabilityNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "03") isRayRelated = evidenceGraph.organisationNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "04") isRayRelated = evidenceGraph.jobNodes.some(n => focusSet.has(n.id)) || evidenceGraph.requirementNodes.some(n => focusSet.has(n.id));
                }
                
                const rayStroke = graphFocus 
                  ? (isRayRelated ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.05)")
                  : (isRayActive ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.28)");

                return (
                  <g key={`ray-${st.stageId}`} data-testid={`energy-ray-${st.stageId}`}>
                    <line
                      x1={center}
                      y1={center}
                      x2={targetX}
                      y2={targetY}
                      stroke={rayStroke}
                      strokeWidth={isRayActive || (graphFocus && isRayRelated) ? "2.5" : "1.2"}
                      strokeDasharray={isRayActive || (graphFocus && isRayRelated) ? undefined : "3 3"}
                      style={{ transition: "all 0.35s ease" }}
                    />

                    <circle
                      data-testid="photon-stream-core-to-orbit"
                      r={isRayActive || (graphFocus && isRayRelated) ? "3" : "1.8"}
                      fill={isRayActive || (graphFocus && isRayRelated) ? "#ffffff" : SIL_TOKENS.colors.cyanActive}
                      opacity={isRayActive || (graphFocus && isRayRelated) ? 1 : (graphFocus ? 0.1 : 0.65)}
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
                zIndex: 10,
                opacity: focusedStageId ? 0.35 : 1,
                transform: focusedStageId ? "scale(0.85)" : "scale(1)",
                filter: focusedStageId ? "grayscale(80%)" : undefined,
                pointerEvents: focusedStageId ? "none" : "auto",
                transition: "all 0.5s ease"
              }}
            >
              <IdentityCoreDropZone sources={activeData.sources} isCommunicating={!!focusedStageId} />
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
                
                let isStageRelated = false;
                if (graphFocus) {
                  const focusSet = new Set([graphFocus.focusNodeId, ...graphFocus.upstreamNodes, ...graphFocus.downstreamNodes]);
                  if (st.stageId === "01") isStageRelated = evidenceGraph.sourceNodes.some(n => focusSet.has(n.id)) || evidenceGraph.evidenceNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "02") isStageRelated = evidenceGraph.capabilityNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "03") isStageRelated = evidenceGraph.organisationNodes.some(n => focusSet.has(n.id));
                  if (st.stageId === "04") isStageRelated = evidenceGraph.jobNodes.some(n => focusSet.has(n.id)) || evidenceGraph.requirementNodes.some(n => focusSet.has(n.id));
                }

                // If a focus exists, stages are dimmed unless they are related
                const isStageDimmed = graphFocus ? !isStageRelated : (focusedStageId !== null && focusedStageId !== st.stageId);


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
                      sourcePresentation={sourcePresentation}
                      onClick={() => {
                        const newActive = isStageActive ? null : st.stageId;
                        setActiveStageId(newActive);
                        setZoomLevel(newActive ? 1 : 0);
                        if (!newActive) setSelectedGraphNodeId(null);
                      }}
                      onMouseEnter={() => {
                        if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
                        setHoveredStageId(st.stageId);
                      }}
                      onMouseLeave={() => {
                        hoverTimeoutRef.current = setTimeout(() => {
                          setHoveredStageId(null);
                        }, 250);
                      }}
                      onHudAction={handleHudAction}
                      accentColor={st.color}
                    />
                  </div>
                );
              })}
            </div>

            {/* Phase 3c: Continuous Semantic Space Sub-Clusters (L1) */}
            {zoomLevel >= 1 && activeStageId && (
              <div
                style={{
                  position: "absolute",
                  left: `${center + activeOrbitX}px`,
                  top: `${center + activeOrbitY}px`,
                  width: 0,
                  height: 0,
                  zIndex: 14,
                  animation: "rotateClockwise 160s linear infinite"
                }}
              >
                <svg
                  width="800"
                  height="800"
                  style={{
                    position: "absolute",
                    top: -400,
                    left: -400,
                    pointerEvents: "none",
                  }}
                >
                  {subClusters.map((cluster) => (
                    <line
                      key={`line-${cluster.id}`}
                      x1={400}
                      y1={400}
                      x2={Math.round((400 + cluster.dx) * 100) / 100}
                      y2={Math.round((400 + cluster.dy) * 100) / 100}
                      stroke={(graphFocus && (cluster.id === graphFocus.focusNodeId || graphFocus.upstreamNodes.includes(cluster.id) || graphFocus.downstreamNodes.includes(cluster.id))) ? SIL_TOKENS.colors.cyanActive : (graphFocus ? "rgba(56, 229, 255, 0.05)" : SIL_TOKENS.colors.cyanActive)}
                      strokeWidth={(graphFocus && (cluster.id === graphFocus.focusNodeId || graphFocus.upstreamNodes.includes(cluster.id) || graphFocus.downstreamNodes.includes(cluster.id))) ? "2.5" : "1.5"}
                      strokeDasharray={(graphFocus && (cluster.id === graphFocus.focusNodeId || graphFocus.upstreamNodes.includes(cluster.id) || graphFocus.downstreamNodes.includes(cluster.id))) ? undefined : "3 3"}
                      style={{ transition: "all 0.3s ease" }}
                    />
                  ))}
                </svg>

                {subClusters.map((cluster) => (
                  <div
                    key={cluster.id}
                    data-testid="subspace-cluster"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClusterId(cluster.id);
                      setSelectedGraphNodeId(cluster.id);
                      setZoomLevel(2);
                    }}
                    style={{
                      position: "absolute",
                      left: `${Math.round((cluster.dx - 68) * 100) / 100}px`,
                      top: `${Math.round((cluster.dy - 25) * 100) / 100}px`,
                      width: "135px",
                      backgroundColor: "rgba(10, 18, 30, 0.92)",
                      border: `1px solid ${selectedClusterId === cluster.id ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.45)"}`,
                      borderRadius: "6px",
                      padding: "6px 8px",
                      cursor: "pointer",
                      zIndex: 15,
                      boxShadow: (graphFocus && cluster.id === graphFocus.focusNodeId) ? "0 0 25px rgba(56, 229, 255, 0.6)" : "0 0 16px rgba(56, 229, 255, 0.18)",
                      opacity: (graphFocus && cluster.id !== graphFocus.focusNodeId && !graphFocus.upstreamNodes.includes(cluster.id) && !graphFocus.downstreamNodes.includes(cluster.id)) ? 0.3 : 1,
                      filter: (graphFocus && cluster.id !== graphFocus.focusNodeId && !graphFocus.upstreamNodes.includes(cluster.id) && !graphFocus.downstreamNodes.includes(cluster.id)) ? "grayscale(80%)" : undefined,
                      transition: "all 0.3s ease",
                      transformOrigin: "center center",
                      animation: "rotateCounterClockwise 160s linear infinite"
                    }}
                  >
                    <div style={{ fontSize: "8px", color: SIL_TOKENS.colors.cyanActive, fontWeight: 700 }}>
                      CLUSTER NODE {cluster.confidence ? `// ${cluster.confidence}` : "// N/A"}
                    </div>
                    <div style={{ fontSize: "10px", fontWeight: 700, margin: "3px 0", lineHeight: "1.2" }}>
                      {cluster.title}
                    </div>
                    <div style={{ fontSize: "8px", color: SIL_TOKENS.colors.textMuted }}>
                      {cluster.evidenceCount !== undefined ? `${cluster.evidenceCount} Evidences` : "NO EVIDENCE"}
                    </div>
                  </div>
                ))}
              </div>
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
            bottom: "32px",
            right: "32px",
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

      {/* Persistent Top-Right How This Works / Codex Button */}
      <div
        style={{
          position: "fixed",
          top: "24px",
          right: "24px",
          zIndex: 60,
          display: "flex",
          gap: "10px"
        }}
      >
        <button
          data-testid="how-this-works-btn"
          onClick={() => setIsOnboardingOpen(true)}
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(10, 20, 30, 0.9)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 16px rgba(56, 229, 255, 0.25)`
          }}
        >
          ? HOW THIS WORKS
        </button>
        <button
          data-testid="open-system-codex-btn"
          onClick={() => setIsCodexOpen(true)}
          style={{
            padding: "8px 14px",
            backgroundColor: "rgba(56, 229, 255, 0.15)",
            border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
            borderRadius: "8px",
            color: SIL_TOKENS.colors.cyanActive,
            fontFamily: SIL_TOKENS.typography.mono,
            fontSize: "11px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 0 16px rgba(56, 229, 255, 0.3)`
          }}
        >
          📖 SYSTEM CODEX [DE|EN]
        </button>
      </div>

      {/* Right Collapsible Semantic Guide Drawer */}
      <div style={{ zIndex: 10 }}>
        <SemanticGuideDrawer />
      </div>

      <SystemCodexModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
      />

      <GuidedOnboardingOverlay
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenCodex={() => setIsCodexOpen(true)}
      />
    </div>
  );
}

