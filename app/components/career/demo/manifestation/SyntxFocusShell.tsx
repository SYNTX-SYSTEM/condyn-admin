"use client";

import React from "react";
import { SIL_TOKENS } from "../SILTokens";

/**
 * SYNTX manifestation grammar · focus transformation (domain-neutral).
 *
 * What happens when the field focuses one body (FocusTransitionStageShell of the Capability Field): the focused body
 * translates to the centre and rises to 1.12 at 0.42 opacity beneath the next level's centre; everything else recedes —
 * blur(3px) grayscale(86%), scale 0.72, opacity 0.12, no pointer — over 0.78 s on the field's one easing
 * cubic-bezier(0.16, 1, 0.3, 1), fades over 0.62 s. The same values recede any level of any field.
 */
/** The focus pulse of a focused body (one ring widening out, 1.6 s). */
export const SYNTX_FOCUS_PULSE_KEYFRAMES = `
              @keyframes focusTransitionPulse {
                0% { transform: scale(1); opacity: 0.7; }
                100% { transform: scale(1.45); opacity: 0; }
              }
            `;

export const SYNTX_FOCUS = Object.freeze({
  easing: "cubic-bezier(0.16, 1, 0.3, 1)",
  recededFilter: "blur(3px) grayscale(86%)",
  recededOpacity: 0.12,
  recededScale: 0.72,
  anchorOpacity: 0.42,
  anchorScale: 1.12,
  shellTransition: "transform 0.78s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.62s ease, filter 0.62s ease",
  scaleTransition: "transform 0.78s cubic-bezier(0.16, 1, 0.3, 1)"
});

export interface FocusTransitionStageShellProps {
  stageId: string;
  x: number;
  y: number;
  isCosmosAnchor: boolean;
  isCosmosBackground: boolean;
  showFocusPulse: boolean;
  emptyVisualUnderlay?: React.ReactNode;
  emptyCopyForeground?: React.ReactNode;
  children: React.ReactNode;
  /** Emit the pulse keyframes with the shell (default); a field that declares them once at its root passes false. */
  pulseKeyframes?: boolean;
}

const FOCUSED_STAGE_BUBBLE_OUTER_RADIUS = (168 + 16 * 2 + 1.5 * 2) / 2;
const FOCUSED_EMPTY_COPY_GAP = 24;

/**
 * The position shell owns orbit-to-focus coordinates, while this visual shell
 * owns scale. Every center-dependent focus visual remains beneath both owners.
 */
export function FocusTransitionStageShell({
  stageId,
  x,
  y,
  isCosmosAnchor,
  isCosmosBackground,
  showFocusPulse,
  emptyVisualUnderlay,
  emptyCopyForeground,
  children,
  pulseKeyframes = true
}: FocusTransitionStageShellProps) {
  return (
    <div
      data-testid={`focus-transition-stage-shell-${stageId}`}
      data-focus-translation-owner="stage-position"
      style={{
        position: "absolute",
        left: `calc(50% + ${x}px - 84px)`,
        top: `calc(50% + ${y}px - 84px)`,
        pointerEvents: isCosmosBackground ? "none" : "auto",
        opacity: isCosmosBackground ? SYNTX_FOCUS.recededOpacity : isCosmosAnchor ? SYNTX_FOCUS.anchorOpacity : 1,
        filter: isCosmosBackground ? SYNTX_FOCUS.recededFilter : undefined,
        transform: isCosmosAnchor
          ? `translate(${-x}px, ${-y}px)`
          : "translate(0px, 0px)",
        transformOrigin: "center center",
        transition: SYNTX_FOCUS.shellTransition
      }}
    >
      <div
        data-testid={`focus-stage-visual-${stageId}`}
        data-focus-scale-owner="stage-visual"
        style={{
          position: "relative",
          isolation: "isolate",
          transform: `scale(${isCosmosAnchor ? SYNTX_FOCUS.anchorScale : isCosmosBackground ? SYNTX_FOCUS.recededScale : 1})`,
          transformOrigin: "center center",
          transition: SYNTX_FOCUS.scaleTransition
        }}
      >
        {emptyVisualUnderlay && (
          <div
            data-testid={`empty-visual-underlay-${stageId}`}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 0,
              height: 0,
              zIndex: 0,
              pointerEvents: "none"
            }}
          >
            {emptyVisualUnderlay}
          </div>
        )}

        <div
          data-testid={`focused-stage-bubble-${stageId}`}
          style={{ position: "relative", zIndex: 1 }}
        >
          {children}
        </div>

        {emptyCopyForeground && (
          <div
            data-testid={`empty-copy-foreground-${stageId}`}
            style={{
              position: "absolute",
              left: "50%",
              top: `calc(50% - ${FOCUSED_STAGE_BUBBLE_OUTER_RADIUS + FOCUSED_EMPTY_COPY_GAP}px)`,
              width: "390px",
              transform: "translateX(-50%) translateY(-100%)",
              zIndex: 3,
              pointerEvents: "none"
            }}
          >
            {emptyCopyForeground}
          </div>
        )}

        {showFocusPulse && (
          <>
            {pulseKeyframes && <style>{SYNTX_FOCUS_PULSE_KEYFRAMES}</style>}
            <div
              data-testid={`focus-transition-pulse-${stageId}`}
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 0,
                // The previous field-SVG pulse inherited its focused 0.18
                // opacity; retain that intensity after relocating it.
                opacity: isCosmosAnchor ? 0.4285714286 : 1
              }}
            >
              <svg width="620" height="620" viewBox="0 0 620 620">
                <circle
                  cx="310"
                  cy="310"
                  r="310"
                  fill="none"
                  stroke={SIL_TOKENS.colors.cyanActive}
                  strokeWidth="1.8"
                  style={{
                    animation: "focusTransitionPulse 1.6s ease-out infinite",
                    transformBox: "fill-box",
                    transformOrigin: "center"
                  }}
                />
              </svg>
            </div>
          </>
        )}
      </div>
    </div>
  );
}


