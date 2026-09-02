"use client";

import React from "react";
import type { OrbitFocusItem } from "../../../../lib/career/view-model/orbit-focus-projection";
import { buildOrbitalCosmosLayout } from "../../../../lib/career/view-model/orbital-cosmos-layout";
import { getOrbitalSatellitePosition, OrbitalSatelliteMotion, useOrbitalMotionElapsedMs } from "./OrbitalSatelliteMotion";
import { SIL_TOKENS } from "./SILTokens";

interface OrbitalCosmosViewProps {
  stageId: string;
  stageName: string;
  items: OrbitFocusItem[];
  onSelectItem: (itemId: string) => void;
  onExit: () => void;
  motionElapsedMs?: number;
}

/** Shared L1 spatial shell; stage content arrives via the semantic projection. */
export function OrbitalCosmosView({ stageId, stageName, items, onSelectItem, onExit, motionElapsedMs }: OrbitalCosmosViewProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = React.useState({ width: 1200, height: 760 });
  const runtimeElapsedMs = useOrbitalMotionElapsedMs();
  const elapsedMs = motionElapsedMs ?? runtimeElapsedMs;
  React.useEffect(() => {
    const element = containerRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setViewport({
      width: Math.max(320, Math.floor(entry.contentRect.width)),
      height: Math.max(300, Math.floor(entry.contentRect.height))
    }));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const layout = React.useMemo(
    () => buildOrbitalCosmosLayout({ items, width: viewport.width, height: viewport.height }),
    [items, viewport]
  );
  const ringByIndex = React.useMemo(
    () => new Map(layout.rings.map((ring) => [ring.index, ring])),
    [layout.rings]
  );
  const itemById = React.useMemo(
    () => new Map(items.map((item) => [item.id, item])),
    [items]
  );

  return (
    <div ref={containerRef} data-testid={`orbital-cosmos-view-${stageId}`} data-reduced-motion-contract="static deterministic positions" onClick={onExit} style={{ position: "absolute", inset: 0, zIndex: 22, overflow: "hidden", background: "radial-gradient(ellipse at center, rgba(8, 36, 50, 0.18) 0%, rgba(3, 8, 15, 0.72) 48%, rgba(1, 3, 8, 0.96) 100%)" }}>
      <style>{`
        @media (prefers-reduced-motion: reduce) { [data-orbital-cosmos-ring], [data-orbital-cosmos-node] { animation: none !important; } }
      `}</style>
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.42, backgroundImage: "radial-gradient(circle at 16% 22%, rgba(56, 229, 255, 0.28) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 31%, rgba(126, 255, 204, 0.18) 0 1px, transparent 1.5px), radial-gradient(ellipse at 70% 76%, rgba(12, 93, 111, 0.12), transparent 52%)", backgroundSize: "92px 92px, 127px 127px, auto" }} />
      <svg aria-hidden="true" width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {layout.rings.map((ring) => <ellipse key={ring.index} cx={layout.centerX} cy={layout.centerY} rx={ring.radiusX} ry={ring.radiusY} fill="none" stroke="rgba(56, 229, 255, 0.18)" strokeWidth="1" strokeDasharray="4 9" />)}
        {layout.nodes.map((node) => {
          const ring = ringByIndex.get(node.ringIndex)!;
          const point = getOrbitalSatellitePosition({ cx: layout.centerX, cy: layout.centerY, rx: ring.radiusX, ry: ring.radiusY, initialPhase: node.angle, angularVelocity: (Math.PI * 2) / ring.periodSeconds, elapsedMs });
          return <line key={`tether-${node.id}`} x1={layout.centerX} y1={layout.centerY} x2={point.x} y2={point.y} stroke="rgba(56, 229, 255, 0.18)" strokeWidth="1" strokeDasharray="2 7" />;
        })}
      </svg>
      {items.length === 0 && <div data-testid={`orbital-cosmos-empty-${stageId}`} style={{ position: "absolute", left: `${layout.centerX}px`, top: `${layout.centerY + 120}px`, transform: "translate(-50%, -50%)", color: "rgba(206, 232, 241, 0.58)", fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", letterSpacing: "0.8px" }}>NO ACTUAL ITEMS PROJECTED</div>}
      {layout.rings.map((ring) => <div key={ring.index} data-orbital-cosmos-ring={ring.index} style={{ position: "absolute", inset: 0 }}>
        {layout.nodes.filter((node) => node.ringIndex === ring.index).map((node) => {
          const sourceSatellite = itemById.get(node.id)?.sourceSatellite;

          return <OrbitalSatelliteMotion key={node.id} cx={layout.centerX} cy={layout.centerY} rx={ring.radiusX} ry={ring.radiusY} initialPhase={node.angle} angularVelocity={(Math.PI * 2) / ring.periodSeconds} elapsedMs={elapsedMs}><button type="button" data-testid={`orbital-cosmos-node-${node.id}`} data-orbital-cosmos-node={node.id} data-card-orientation="viewport-upright" onClick={(event) => { event.stopPropagation(); onSelectItem(node.id); }} style={{ position: "absolute", left: 0, top: 0, width: `${node.width}px`, minHeight: `${node.height}px`, transform: "translate(-50%, -50%)", border: "1px solid rgba(56, 229, 255, 0.52)", borderRadius: "18px", padding: "10px 13px", background: "radial-gradient(circle at 20% 0%, rgba(56, 229, 255, 0.16), transparent 44%), rgba(5, 16, 27, 0.96)", boxShadow: "0 0 22px rgba(56, 229, 255, 0.16)", color: SIL_TOKENS.colors.textPrimary, cursor: "pointer", fontFamily: SIL_TOKENS.typography.mono, textAlign: "left", overflowWrap: "anywhere", hyphens: "auto" }}>
            {sourceSatellite ? (
              <>
                <span
                  data-testid={`source-satellite-kind-${node.id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    color: SIL_TOKENS.colors.cyanActive,
                    fontSize: "7.5px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    lineHeight: 1
                  }}
                >
                  <span>{sourceSatellite.kindLabel}</span>
                  <span aria-hidden="true" style={{ fontSize: "10px" }}>
                    {sourceSatellite.glyph}
                  </span>
                </span>

                <span
                  style={{
                    display: "-webkit-box",
                    marginTop: "8px",
                    fontSize: "11px",
                    fontWeight: 800,
                    lineHeight: 1.25,
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    overflowWrap: "normal",
                    hyphens: "none"
                  }}
                >
                  {node.title}
                </span>

                <span
                  style={{
                    display: "block",
                    marginTop: "8px",
                    color: "rgba(126, 255, 204, 0.62)",
                    fontSize: "7px",
                    fontWeight: 700,
                    letterSpacing: "0.8px",
                    lineHeight: 1
                  }}
                >
                  {sourceSatellite.secondaryLabel}
                </span>
              </>
            ) : (
              <span style={{ display: "block", fontSize: "11px", fontWeight: 700, lineHeight: 1.32 }}>
                {node.title}
              </span>
            )}
          </button></OrbitalSatelliteMotion>;
        })}
      </div>)}
      <button type="button" data-testid={`orbital-cosmos-center-${stageId}`} onClick={(event) => { event.stopPropagation(); onExit(); }} style={{ position: "absolute", left: `${layout.centerX}px`, top: `${layout.centerY}px`, transform: "translate(-50%, -50%)", width: "174px", minHeight: "174px", borderRadius: "50%", border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`, background: "radial-gradient(circle, rgba(56, 229, 255, 0.25), rgba(5, 18, 29, 0.92) 58%, rgba(2, 7, 13, 0.98))", boxShadow: "0 0 38px rgba(56, 229, 255, 0.3)", color: SIL_TOKENS.colors.textPrimary, cursor: "pointer", fontFamily: SIL_TOKENS.typography.mono, fontSize: "10px", fontWeight: 700, letterSpacing: "1px", lineHeight: 1.55 }}>{stageId} {stageName}<br /><span style={{ color: SIL_TOKENS.colors.cyanActive, fontSize: "8px" }}>ORBIT COSMOS</span></button>
    </div>
  );
}
