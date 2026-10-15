"use client";

import React from "react";
import type { SilClusterPresentation } from "../../../../lib/career/view-model/cluster-presentation";
import { buildCapabilityCosmosLayout } from "../../../../lib/career/view-model/capability-cosmos-layout";
import { useOrbitalMotionElapsedMs } from "./OrbitalSatelliteMotion";
import { SYNTX_COSMOS_BACKDROP, SYNTX_COSMOS_CENTER_MATERIAL, SYNTX_COSMOS_NODE_MATERIAL, SyntxCosmosShell } from "./manifestation/SyntxCosmosShell";
import { SIL_TOKENS } from "./SILTokens";

interface CapabilityCosmosViewProps {
  clusters: SilClusterPresentation[];
  onSelectCluster: (clusterId: string) => void;
  onExit: () => void;
  /** Test-only deterministic clock; runtime uses the shared rAF clock. */
  motionElapsedMs?: number;
}

/**
 * Stage-02-only L1 projection. It displays proposal presentation state but
 * does not infer capability truth, confidence, or completion from its layout.
 */
export function CapabilityCosmosView({
  clusters,
  onSelectCluster,
  onExit,
  motionElapsedMs
}: CapabilityCosmosViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = React.useState({ width: 1200, height: 760 });
  const runtimeElapsedMs = useOrbitalMotionElapsedMs();
  const elapsedMs = motionElapsedMs ?? runtimeElapsedMs;

  React.useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(([entry]) => {
      setViewport({
        width: Math.max(320, Math.floor(entry.contentRect.width)),
        height: Math.max(300, Math.floor(entry.contentRect.height))
      });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = React.useMemo(
    () =>
      buildCapabilityCosmosLayout({
        capabilities: clusters.map((cluster) => ({
          id: cluster.id,
          title: cluster.title,
          evidenceCount: cluster.evidenceCount
        })),
        width: viewport.width,
        height: viewport.height
      }),
    [clusters, viewport]
  );
  const clusterById = React.useMemo(
    () => new Map(clusters.map((cluster) => [cluster.id, cluster])),
    [clusters]
  );

  return (
    <SyntxCosmosShell
      containerRef={containerRef}
      testId="capability-cosmos-view"
      attributes={{ "data-reduced-motion-contract": "static deterministic positions" }}
      onClick={onExit}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 22,
        overflow: "hidden",
        opacity: 1,
        transition: "opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1)",
        background:
          SYNTX_COSMOS_BACKDROP
      }}
      styleText={`
        @keyframes capabilityCosmosOrbit {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes rotateCounterClockwise {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-capability-cosmos-ring], [data-capability-cosmos-node] {
            animation: none !important;
          }
        }
      `}
      layout={layout}
      elapsedMs={elapsedMs}
      ringAttribute="data-capability-cosmos-ring"
      renderNode={(node) => {
        const cluster = clusterById.get(node.id);
        return (
                <button
                  type="button"
                  data-testid={`capability-cosmos-node-${node.id}`}
                  data-capability-cosmos-node={node.id}
                  data-card-orientation="viewport-upright"
                  onClick={(event) => {
                    event.stopPropagation();
                    onSelectCluster(node.id);
                  }}
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: `${node.width}px`,
                    minHeight: `${node.height}px`,
                    transform: "translate(-50%, -50%)",
                    ...SYNTX_COSMOS_NODE_MATERIAL,
                    color: SIL_TOKENS.colors.textPrimary,
                    cursor: "pointer",
                    fontFamily: SIL_TOKENS.typography.mono,
                    textAlign: "left",
                    overflowWrap: "anywhere",
                    hyphens: "auto"
                  }}
                >
                  <span style={{ display: "block", color: SIL_TOKENS.colors.cyanActive, fontSize: "8px", fontWeight: 700, letterSpacing: "0.8px" }}>
                    CLUSTER NODE // PROPOSED
                  </span>
                  <span style={{ display: "block", marginTop: "5px", fontSize: "11px", fontWeight: 700, lineHeight: 1.32 }}>
                    {node.title}
                  </span>
                  <span style={{ display: "block", marginTop: "7px", color: "rgba(206, 232, 241, 0.72)", fontSize: "8px", lineHeight: 1.45 }}>
                    {cluster?.evidenceCount ?? 0} EVIDENCE // EVIDENCE PASSED // SEMANTIC DEFINITION NOT RUN
                  </span>
                </button>
        );
      }}
      center={
      <button
        type="button"
        data-testid="capability-cosmos-center"
        onClick={(event) => {
          event.stopPropagation();
          onExit();
        }}
        style={{
          position: "absolute",
          left: `${layout.centerX}px`,
          top: `${layout.centerY}px`,
          transform: "translate(-50%, -50%)",
          ...SYNTX_COSMOS_CENTER_MATERIAL,
          color: SIL_TOKENS.colors.textPrimary,
          cursor: "pointer",
          fontFamily: SIL_TOKENS.typography.mono,
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "1px",
          lineHeight: 1.55
        }}
      >
        02 CAPABILITY FIELD<br />
        <span style={{ color: SIL_TOKENS.colors.cyanActive, fontSize: "8px" }}>CAPABILITY COSMOS // PROPOSAL FIELD</span>
      </button>
      }
    />
  );
}

export default CapabilityCosmosView;
