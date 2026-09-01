"use client";

import React from "react";
import type { SilClusterPresentation } from "../../../../lib/career/view-model/cluster-presentation";
import { buildCapabilityCosmosLayout } from "../../../../lib/career/view-model/capability-cosmos-layout";
import { getOrbitalSatellitePosition, OrbitalSatelliteMotion, useOrbitalMotionElapsedMs } from "./OrbitalSatelliteMotion";
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
  const ringByIndex = React.useMemo(
    () => new Map(layout.rings.map((ring) => [ring.index, ring])),
    [layout.rings]
  );

  return (
    <div
      ref={containerRef}
      data-testid="capability-cosmos-view"
      data-reduced-motion-contract="static deterministic positions"
      onClick={onExit}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 22,
        overflow: "hidden",
        opacity: 1,
        transition: "opacity 0.72s cubic-bezier(0.16, 1, 0.3, 1)",
        background:
          "radial-gradient(ellipse at center, rgba(8, 36, 50, 0.18) 0%, rgba(3, 8, 15, 0.72) 48%, rgba(1, 3, 8, 0.96) 100%)"
      }}
    >
      <style>{`
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
      `}</style>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          opacity: 0.42,
          backgroundImage:
            "radial-gradient(circle at 16% 22%, rgba(56, 229, 255, 0.28) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 31%, rgba(126, 255, 204, 0.18) 0 1px, transparent 1.5px), radial-gradient(ellipse at 70% 76%, rgba(12, 93, 111, 0.12), transparent 52%)",
          backgroundSize: "92px 92px, 127px 127px, auto"
        }}
      />

      <svg
        aria-hidden="true"
        width={layout.width}
        height={layout.height}
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        {layout.rings.map((ring) => (
          <ellipse
            key={ring.index}
            cx={layout.centerX}
            cy={layout.centerY}
            rx={ring.radiusX}
            ry={ring.radiusY}
            fill="none"
            stroke="rgba(56, 229, 255, 0.18)"
            strokeWidth="1"
            strokeDasharray="4 9"
          />
        ))}
        {layout.nodes.map((node) => {
          const ring = ringByIndex.get(node.ringIndex)!;
          const point = getOrbitalSatellitePosition({ cx: layout.centerX, cy: layout.centerY, rx: ring.radiusX, ry: ring.radiusY, initialPhase: node.angle, angularVelocity: (Math.PI * 2) / ring.periodSeconds, elapsedMs });
          return <line key={`tether-${node.id}`} x1={layout.centerX} y1={layout.centerY} x2={point.x} y2={point.y} stroke="rgba(56, 229, 255, 0.18)" strokeWidth="1" strokeDasharray="2 7" />;
        })}
      </svg>

      {layout.rings.map((ring) => (
        <div
          key={ring.index}
          data-capability-cosmos-ring={ring.index}
          style={{
            position: "absolute",
            inset: 0
          }}
        >
          {layout.nodes
            .filter((node) => node.ringIndex === ring.index)
            .map((node) => {
              const cluster = clusterById.get(node.id);
              return (
                <OrbitalSatelliteMotion
                  key={node.id}
                  cx={layout.centerX}
                  cy={layout.centerY}
                  rx={ring.radiusX}
                  ry={ring.radiusY}
                  initialPhase={node.angle}
                  angularVelocity={(Math.PI * 2) / ring.periodSeconds}
                  elapsedMs={elapsedMs}
                >
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
                    border: "1px solid rgba(56, 229, 255, 0.52)",
                    borderRadius: "18px",
                    padding: "10px 13px",
                    background:
                      "radial-gradient(circle at 20% 0%, rgba(56, 229, 255, 0.16), transparent 44%), rgba(5, 16, 27, 0.96)",
                    boxShadow: "0 0 22px rgba(56, 229, 255, 0.16), inset 0 0 18px rgba(56, 229, 255, 0.04)",
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
                </OrbitalSatelliteMotion>
              );
            })}
        </div>
      ))}

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
          width: "174px",
          minHeight: "174px",
          borderRadius: "50%",
          border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`,
          background: "radial-gradient(circle, rgba(56, 229, 255, 0.25), rgba(5, 18, 29, 0.92) 58%, rgba(2, 7, 13, 0.98))",
          boxShadow: "0 0 38px rgba(56, 229, 255, 0.3), inset 0 0 28px rgba(56, 229, 255, 0.18)",
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
    </div>
  );
}

export default CapabilityCosmosView;
