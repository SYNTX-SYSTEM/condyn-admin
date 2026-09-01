"use client";

import React from "react";

export interface OrbitalSatellitePosition {
  x: number;
  y: number;
  phase: number;
}

export function getOrbitalSatellitePosition({
  cx,
  cy,
  rx,
  ry,
  initialPhase,
  angularVelocity,
  elapsedMs
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  initialPhase: number;
  angularVelocity: number;
  elapsedMs: number;
}): OrbitalSatellitePosition {
  const phase = initialPhase + angularVelocity * (elapsedMs / 1000);
  return { x: cx + rx * Math.cos(phase), y: cy + ry * Math.sin(phase), phase };
}

/** One calm, linear rAF clock shared by every satellite in a Cosmos view. */
export function useOrbitalMotionElapsedMs() {
  const [elapsedMs, setElapsedMs] = React.useState(0);
  React.useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    let startedAt: number | null = null;
    const tick = (now: number) => {
      startedAt ??= now;
      setElapsedMs(now - startedAt);
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return elapsedMs;
}

export function OrbitalSatelliteMotion({
  cx,
  cy,
  rx,
  ry,
  initialPhase,
  angularVelocity,
  elapsedMs,
  children
}: {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  initialPhase: number;
  angularVelocity: number;
  elapsedMs: number;
  children: React.ReactNode;
}) {
  const point = getOrbitalSatellitePosition({ cx, cy, rx, ry, initialPhase, angularVelocity, elapsedMs });
  return <div data-orbital-motion-driver="shared-rAF" data-orbital-motion-phase={point.phase.toFixed(6)} data-orbital-motion-x={point.x.toFixed(3)} data-orbital-motion-y={point.y.toFixed(3)} style={{ position: "absolute", left: 0, top: 0, transform: `translate3d(${point.x}px, ${point.y}px, 0)`, willChange: "transform" }}>{children}</div>;
}
