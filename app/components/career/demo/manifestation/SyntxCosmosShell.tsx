"use client";

import React from "react";
import type { CapabilityCosmosLayout, CapabilityCosmosLayoutNode, CapabilityCosmosRing } from "../../../../../lib/career/view-model/capability-cosmos-layout";
import { getOrbitalSatellitePosition, OrbitalSatelliteMotion } from "../OrbitalSatelliteMotion";
import { SIL_TOKENS } from "../SILTokens";

/**
 * SYNTX manifestation grammar · cosmos (domain-neutral).
 *
 * The L1 space of a focused body, as the Capability Field draws its cosmos (CapabilityCosmosView, OrbitalCosmosView): the
 * deep backdrop over the receded planetarium, a faint star field, the dashed orbit ellipses (4 9), one tether per
 * satellite from the centre (2 7, recomputed from the satellite's position every frame) and the satellites themselves,
 * upright, on the shared linear rAF clock (OrbitalSatelliteMotion). What the satellites and the centre are is the caller's.
 */
export const SYNTX_COSMOS_BACKDROP = "radial-gradient(ellipse at center, rgba(8, 36, 50, 0.18) 0%, rgba(3, 8, 15, 0.72) 48%, rgba(1, 3, 8, 0.96) 100%)";
export const SYNTX_COSMOS_STARS: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  opacity: 0.42,
  backgroundImage:
    "radial-gradient(circle at 16% 22%, rgba(56, 229, 255, 0.28) 0 1px, transparent 1.5px), radial-gradient(circle at 76% 31%, rgba(126, 255, 204, 0.18) 0 1px, transparent 1.5px), radial-gradient(ellipse at 70% 76%, rgba(12, 93, 111, 0.12), transparent 52%)",
  backgroundSize: "92px 92px, 127px 127px, auto"
};

/** Material of a cosmos satellite card (upright capsule with its cyan frame and soft glow). */
export const SYNTX_COSMOS_NODE_MATERIAL: React.CSSProperties = {
  border: "1px solid rgba(56, 229, 255, 0.52)",
  borderRadius: "18px",
  padding: "10px 13px",
  background:
    "radial-gradient(circle at 20% 0%, rgba(56, 229, 255, 0.16), transparent 44%), rgba(5, 16, 27, 0.96)",
  boxShadow: "0 0 22px rgba(56, 229, 255, 0.16), inset 0 0 18px rgba(56, 229, 255, 0.04)"
};

/** Material of the cosmos centre (the focused body, 174 units, its cyan rim and inner light). */
export const SYNTX_COSMOS_CENTER_MATERIAL: React.CSSProperties = {
  width: "174px",
  minHeight: "174px",
  borderRadius: "50%",
  border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`,
  background: "radial-gradient(circle, rgba(56, 229, 255, 0.25), rgba(5, 18, 29, 0.92) 58%, rgba(2, 7, 13, 0.98))",
  boxShadow: "0 0 38px rgba(56, 229, 255, 0.3), inset 0 0 28px rgba(56, 229, 255, 0.18)"
};

export interface SyntxCosmosShellProps {
  containerRef?: React.Ref<HTMLDivElement>;
  testId: string;
  /** The container's own attributes (contract markers, field-specific data attributes). */
  attributes?: Record<string, string>;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  style: React.CSSProperties;
  styleText: string;
  layout: CapabilityCosmosLayout;
  elapsedMs: number;
  /** The attribute naming a ring layer, e.g. data-capability-cosmos-ring. */
  ringAttribute: string;
  /** Between the orbit SVG and the satellites (e.g. an empty-projection note). */
  afterOrbits?: React.ReactNode;
  /** Inside the orbit SVG, after the tethers (relations of the field drawn in the same space). */
  svgExtra?: React.ReactNode;
  /** Tether style; the planetarium's faint dashed line by default. */
  tether?: { stroke: string; dash: string } | null;
  renderNode: (node: CapabilityCosmosLayoutNode, ring: CapabilityCosmosRing) => React.ReactNode;
  center: React.ReactNode;
  /** The orbit ellipses' stroke; the planetarium's faint cyan by default. */
  orbitStroke?: string;
  /** The star field; SYNTX_COSMOS_STARS by default. */
  stars?: React.CSSProperties;
}

export function syntxCosmosPoint(layout: CapabilityCosmosLayout, node: CapabilityCosmosLayoutNode, ring: CapabilityCosmosRing, elapsedMs: number) {
  return getOrbitalSatellitePosition({ cx: layout.centerX, cy: layout.centerY, rx: ring.radiusX, ry: ring.radiusY, initialPhase: node.angle, angularVelocity: (Math.PI * 2) / ring.periodSeconds, elapsedMs });
}

export function SyntxCosmosShell({ containerRef, testId, attributes, onClick, style, styleText, layout, elapsedMs, ringAttribute, afterOrbits, svgExtra, tether = { stroke: "rgba(56, 229, 255, 0.18)", dash: "2 7" }, renderNode, center, orbitStroke = "rgba(56, 229, 255, 0.18)", stars = SYNTX_COSMOS_STARS }: SyntxCosmosShellProps) {
  const ringByIndex = React.useMemo(
    () => new Map(layout.rings.map((ring) => [ring.index, ring])),
    [layout.rings]
  );

  return (
    <div
      ref={containerRef}
      data-testid={testId}
      {...attributes}
      onClick={onClick}
      style={style}
    >
      <style>{styleText}</style>

      <div
        aria-hidden="true"
        style={stars}
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
            stroke={orbitStroke}
            strokeWidth="1"
            strokeDasharray="4 9"
          />
        ))}
        {tether !== null && layout.nodes.map((node) => {
          const ring = ringByIndex.get(node.ringIndex)!;
          const point = syntxCosmosPoint(layout, node, ring, elapsedMs);
          return <line key={`tether-${node.id}`} x1={layout.centerX} y1={layout.centerY} x2={point.x} y2={point.y} stroke={tether.stroke} strokeWidth="1" strokeDasharray={tether.dash} />;
        })}
        {svgExtra}
      </svg>

      {afterOrbits}

      {layout.rings.map((ring) => (
        <div
          key={ring.index}
          {...{ [ringAttribute]: ring.index }}
          style={{
            position: "absolute",
            inset: 0
          }}
        >
          {layout.nodes
            .filter((node) => node.ringIndex === ring.index)
            .map((node) => (
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
                {renderNode(node, ring)}
              </OrbitalSatelliteMotion>
            ))}
        </div>
      ))}

      {center}
    </div>
  );
}
