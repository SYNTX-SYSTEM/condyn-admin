"use client";

import React from "react";
import type { SilClusterPresentation } from "../../../../lib/career/view-model/cluster-presentation";
import { buildCapabilityDeepFocusLayout } from "../../../../lib/career/view-model/capability-deep-focus-layout";
import { SIL_TOKENS } from "./SILTokens";
import { SYNTX_DEEP_FOCUS_BACKDROP, SYNTX_EVIDENCE_LINK, SYNTX_EVIDENCE_SURFACE_MATERIAL, SYNTX_NUCLEUS_MATERIAL, SYNTX_SATELLITE_MATERIAL, SyntxDeepFocusShell } from "./manifestation/SyntxDeepFocusShell";

interface CapabilityDeepFocusViewProps {
  clusters: SilClusterPresentation[];
  selectedClusterId: string;
  onSelectCluster: (clusterId: string) => void;
  onBack: () => void;
}

/** Stage-02 L2: a local capability constellation, not the generic evidence zoom. */
export function CapabilityDeepFocusView({
  clusters,
  selectedClusterId,
  onSelectCluster,
  onBack
}: CapabilityDeepFocusViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = React.useState({ width: 1200, height: 760 });
  const selected = clusters.find((cluster) => cluster.id === selectedClusterId) ?? clusters[0];

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      setViewport({ width: Math.max(320, Math.floor(entry.contentRect.width)), height: Math.max(300, Math.floor(entry.contentRect.height)) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = React.useMemo(
    () => selected ? buildCapabilityDeepFocusLayout({
      capabilities: clusters.map((cluster) => ({ id: cluster.id, title: cluster.title, evidenceCount: cluster.evidenceCount })),
      selectedCapabilityId: selected.id,
      width: viewport.width,
      height: viewport.height
    }) : null,
    [clusters, selected, viewport]
  );
  const clusterById = React.useMemo(() => new Map(clusters.map((cluster) => [cluster.id, cluster])), [clusters]);

  if (!selected || !layout) return null;

  return (
    <SyntxDeepFocusShell
      containerRef={containerRef}
      testId="capability-deep-focus-view"
      attributes={{ "data-reduced-motion-contract": "static deterministic hierarchy" }}
      style={{
        position: "absolute", inset: 0, zIndex: 23, overflow: "hidden",
        background: SYNTX_DEEP_FOCUS_BACKDROP
      }}
      styleText={`
        @keyframes capabilityDeepFocusSettle { from { opacity: 0; transform: translate(-50%, -50%) scale(0.78); } to { opacity: 1; transform: translate(-50%, -50%) scale(1); } }
        @keyframes capabilityDeepFocusSatellite { from { opacity: 0; transform: translate(-50%, -50%) scale(0.62); } to { opacity: var(--satellite-opacity); transform: translate(-50%, -50%) scale(var(--satellite-scale)); } }
        @media (prefers-reduced-motion: reduce) { [data-capability-deep-focus-motion] { animation: none !important; } }
      `}
      layout={layout}
      svgExtra={<line x1={layout.focus.x} y1={layout.focus.y + layout.focus.height / 2} x2={layout.evidence.x} y2={layout.evidence.y - layout.evidence.height / 2} stroke={SYNTX_EVIDENCE_LINK.stroke} strokeWidth={SYNTX_EVIDENCE_LINK.width} strokeDasharray={SYNTX_EVIDENCE_LINK.dash} />}
    >
      {layout.satellites.map((satellite) => {
        const cluster = clusterById.get(satellite.id);
        return (
          <button
            key={satellite.id}
            type="button"
            data-testid={`capability-focus-satellite-${satellite.id}`}
            data-capability-deep-focus-motion
            onClick={() => onSelectCluster(satellite.id)}
            style={{
              position: "absolute", left: satellite.x, top: satellite.y, width: satellite.width, minHeight: satellite.height,
              transform: "translate(-50%, -50%) scale(var(--satellite-scale))", "--satellite-scale": satellite.scale, "--satellite-opacity": satellite.opacity,
              opacity: satellite.opacity, animation: "capabilityDeepFocusSatellite 0.72s cubic-bezier(0.16, 1, 0.3, 1) both",
              ...SYNTX_SATELLITE_MATERIAL,
              fontFamily: SIL_TOKENS.typography.mono, fontSize: "11px", fontWeight: 700, textAlign: "left", cursor: "pointer", overflowWrap: "anywhere", hyphens: "auto"
            } as React.CSSProperties}
          >
            {cluster?.title ?? satellite.title}
          </button>
        );
      })}
      <button
        type="button"
        data-testid={`capability-focus-nucleus-${selected.id}`}
        data-capability-deep-focus-motion
        onClick={onBack}
        style={{
          position: "absolute", left: layout.focus.x, top: layout.focus.y, width: layout.focus.width, minHeight: layout.focus.height,
          transform: "translate(-50%, -50%)", animation: "capabilityDeepFocusSettle 0.78s cubic-bezier(0.16, 1, 0.3, 1) both",
          ...SYNTX_NUCLEUS_MATERIAL,
          color: SIL_TOKENS.colors.textPrimary, cursor: "pointer", fontFamily: SIL_TOKENS.typography.mono, textAlign: "center", overflowWrap: "anywhere", hyphens: "auto"
        }}
      >
        <span style={{ display: "block", color: SIL_TOKENS.colors.cyanActive, fontSize: "10px", fontWeight: 800, letterSpacing: "1.1px" }}>CAPABILITY NUCLEUS // {selected.projectionState ?? "PROJECTED"}</span>
        <span style={{ display: "block", marginTop: "8px", fontSize: "14px", fontWeight: 800, lineHeight: 1.34 }}>{selected.title}</span>
        {selected.projectionState === "PROPOSED" && <span style={{ display: "block", marginTop: "10px", color: "rgba(206, 232, 241, 0.86)", fontSize: "9px", fontWeight: 700, lineHeight: 1.6 }}>PROPOSED // EVIDENCE PASSED // SEMANTIC DEFINITION NOT RUN</span>}
        <span style={{ display: "block", marginTop: "10px", color: "rgba(56, 229, 255, 0.66)", fontSize: "9px", letterSpacing: "0.7px" }}>RETURN TO CAPABILITY COSMOS</span>
      </button>
      <section
        data-testid="capability-focus-evidence-surface"
        style={{
          position: "absolute", left: layout.evidence.x, top: layout.evidence.y, width: layout.evidence.width, minHeight: layout.evidence.height,
          transform: "translate(-50%, -50%)", ...SYNTX_EVIDENCE_SURFACE_MATERIAL, color: SIL_TOKENS.colors.textPrimary, fontFamily: SIL_TOKENS.typography.mono
        }}
      >
        <div style={{ color: "#7effcc", fontSize: "9px", fontWeight: 800, letterSpacing: "0.9px" }}>
          {selected.projectionState === "PROPOSED" ? "EVIDENCE // SOURCE MATCHING ONLY" : "EVIDENCE"}
        </div>
        {selected.evidences.map((evidence) => <div key={evidence.id} data-testid={`capability-focus-evidence-${evidence.id}`} style={{ marginTop: "7px", fontSize: "10px", lineHeight: 1.4, overflowWrap: "anywhere" }}>
          <strong style={{ color: "rgba(225, 245, 247, 0.94)" }}>{evidence.title}</strong>
          <span style={{ color: "rgba(126, 255, 204, 0.72)" }}> // {evidence.sourceType}</span>
          <span style={{ display: "block", color: "rgba(206, 232, 241, 0.7)", marginTop: "3px" }}>{evidence.snippet}</span>
        </div>)}
      </section>
    </SyntxDeepFocusShell>
  );
}

export default CapabilityDeepFocusView;
