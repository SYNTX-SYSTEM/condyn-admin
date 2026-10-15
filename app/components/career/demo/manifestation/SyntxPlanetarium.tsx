"use client";

import React from "react";
import { SIL_TOKENS } from "../SILTokens";

/**
 * SYNTX manifestation grammar · planetarium field (domain-neutral).
 *
 * The space around the core, as the Capability Field draws it (SemanticCareerIntelligenceField): the atmospheric field
 * glow, three concentric orbit paths (0.35, 0.68 dashed 4 4, 1 × R), the resonance ring turning in 120 s, six ambient
 * energy nodes and four dust particles; and one energy ray per body — dashed at rest, solid when active — with its photon
 * streams (SMIL animateMotion out and back) and the midpoint bead. Which bodies the rays reach is the caller's.
 */
/** The tone of the planetarium's backdrop: the glow, the orbit paths, the resonance ring, the energy nodes and the dust. */
export interface SyntxPlanetariumTone {
  glow: string;
  orbit: string;
  ring: string;
  node: string;
  dust: string;
}

/** The Capability Field's tone (the default). */
export const SYNTX_PLANETARIUM_TONE: SyntxPlanetariumTone = Object.freeze({
  glow: "#38e5ff",
  orbit: "rgba(56, 229, 255, 0.12)",
  ring: "rgba(56, 229, 255, 0.16)",
  node: "rgba(56, 229, 255, 0.38)",
  dust: "rgba(56, 229, 255, 0.25)"
});

export function SyntxPlanetariumBackdrop({ center, radius, gradientId = "fieldGlow", glowOpacity, tone = SYNTX_PLANETARIUM_TONE }: { center: number; radius: number; gradientId?: string; glowOpacity: string; tone?: SyntxPlanetariumTone }) {
  return (
    <>
    <defs>
      <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor={tone.glow} stopOpacity={glowOpacity} />
        <stop offset="100%" stopColor="#030508" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Phase 2a: Atmospheric Field Glow Background */}
    <circle
      cx={center}
      cy={center}
      r={radius + 30}
      fill={`url(#${gradientId})`}
    />

    {/* Concentric Orbit Paths */}
    {[radius * 0.35, radius * 0.68, radius].map((r, i) => (
      <circle
        key={i}
        cx={center}
        cy={center}
        r={r}
        fill="none"
        stroke={tone.orbit}
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
        stroke={tone.ring}
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
            fill={tone.node}
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
            fill={tone.dust}
          />
        );
      })}
    </g>

    </>
  );
}

export interface SyntxPhoton {
  r: string;
  fill: string;
  opacity: number;
  dur: string;
}

export interface SyntxEnergyRayProps {
  testId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: string;
  dash: string | undefined;
  /** Photon streams; null renders none (reduced motion). */
  photons: { out: SyntxPhoton; in: SyntxPhoton } | null;
  bead: { r: string; fill: string };
}

export function SyntxEnergyRay({ testId, x1, y1, x2, y2, stroke, strokeWidth, dash, photons, bead }: SyntxEnergyRayProps) {
  return (
    <g data-testid={testId}>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeDasharray={dash}
        style={{ transition: "all 0.35s ease" }}
      />

      {photons !== null && (
        <>
          <circle
            data-testid="photon-stream-core-to-orbit"
            r={photons.out.r}
            fill={photons.out.fill}
            opacity={photons.out.opacity}
          >
            <animateMotion
              path={`M ${x1} ${y1} L ${x2} ${y2}`}
              dur={photons.out.dur}
              repeatCount="indefinite"
            />
          </circle>

          <circle
            data-testid="photon-stream-orbit-to-core"
            r={photons.in.r}
            fill={photons.in.fill}
            opacity={photons.in.opacity}
          >
            <animateMotion
              path={`M ${x2} ${y2} L ${x1} ${y1}`}
              dur={photons.in.dur}
              repeatCount="indefinite"
            />
          </circle>
        </>
      )}

      <circle
        cx={(x1 + x2) / 2}
        cy={(y1 + y2) / 2}
        r={bead.r}
        fill={bead.fill}
        style={{ transition: "all 0.35s ease" }}
      />
    </g>
  );
}

/** The cyan of an active ray (SIL token). */
export const SYNTX_RAY_ACTIVE = SIL_TOKENS.colors.cyanActive;
