"use client";

import React from "react";
import type { CapabilityDeepFocusLayout } from "../../../../../lib/career/view-model/capability-deep-focus-layout";
import { SIL_TOKENS } from "../SILTokens";

/**
 * SYNTX manifestation grammar · deep focus (domain-neutral).
 *
 * The L2 constellation of one focused item, as the Capability Field draws it (CapabilityDeepFocusView, OrbitalDeepFocusView):
 * the deep backdrop, the nucleus (an ellipse of depth with a mint highlight, settling .78 → 1 over .78 s), its siblings
 * receded as satellites (.78 / .42) on faint dashed spokes (3 10, .12), and the evidence surface beneath the nucleus.
 * What the nucleus, the satellites and the surface hold is the caller's.
 */
export const SYNTX_DEEP_FOCUS_BACKDROP = "radial-gradient(circle at 50% 42%, rgba(14, 66, 73, 0.22), transparent 26%), radial-gradient(ellipse at 50% 54%, rgba(2, 12, 20, 0.62), rgba(1, 3, 8, 0.97) 76%)";

/** Material of the nucleus: the ellipse of depth with its mint highlight and soft cyan glow. */
export const SYNTX_NUCLEUS_MATERIAL: React.CSSProperties = {
  border: `1.5px solid ${SIL_TOKENS.colors.cyanActive}`, borderRadius: "50%", padding: "26px 34px",
  background: "radial-gradient(circle at 50% 30%, rgba(126, 255, 204, 0.28), transparent 40%), radial-gradient(circle, rgba(7, 45, 53, 0.98), rgba(2, 8, 14, 1) 76%)",
  boxShadow: "0 0 52px rgba(56, 229, 255, 0.36), inset 0 0 34px rgba(126, 255, 204, 0.15)"
};

/** Material of a receded sibling satellite. */
export const SYNTX_SATELLITE_MATERIAL: React.CSSProperties = {
  border: "1px solid rgba(56, 229, 255, 0.28)", borderRadius: "16px", padding: "9px 11px",
  background: "rgba(3, 12, 20, 0.94)", boxShadow: "0 0 15px rgba(56, 229, 255, 0.08)", color: "rgba(222, 242, 247, 0.82)"
};

/** Material of the evidence surface beneath the nucleus (mint frame). */
export const SYNTX_EVIDENCE_SURFACE_MATERIAL: React.CSSProperties = {
  border: "1px solid rgba(126, 255, 204, 0.48)", borderRadius: "15px", padding: "12px 15px",
  background: "rgba(3, 14, 20, 0.98)", boxShadow: "0 0 24px rgba(126, 255, 204, 0.12)"
};

/** The mint evidence link from the nucleus to the evidence surface. */
export const SYNTX_EVIDENCE_LINK = Object.freeze({ stroke: "rgba(126, 255, 204, 0.42)", width: "1.4", dash: "3 6" });

export interface SyntxDeepFocusShellProps {
  containerRef?: React.Ref<HTMLDivElement>;
  testId: string;
  attributes?: Record<string, string>;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  style: React.CSSProperties;
  styleText: string;
  layout: CapabilityDeepFocusLayout;
  /** Inside the spoke SVG, after the spokes (the evidence link, relations). */
  svgExtra?: React.ReactNode;
  children: React.ReactNode;
}

export function SyntxDeepFocusShell({ containerRef, testId, attributes, onClick, style, styleText, layout, svgExtra, children }: SyntxDeepFocusShellProps) {
  return (
    <div
      ref={containerRef}
      data-testid={testId}
      {...attributes}
      onClick={onClick}
      style={style}
    >
      <style>{styleText}</style>
      <svg aria-hidden="true" width={layout.width} height={layout.height} style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {layout.satellites.map((satellite) => (
          <line key={satellite.id} x1={layout.focus.x} y1={layout.focus.y} x2={satellite.x} y2={satellite.y} stroke="rgba(56, 229, 255, 0.12)" strokeWidth="1" strokeDasharray="3 10" />
        ))}
        {svgExtra}
      </svg>
      {children}
    </div>
  );
}
