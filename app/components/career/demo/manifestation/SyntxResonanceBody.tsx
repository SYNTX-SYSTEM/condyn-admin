"use client";

import React from "react";
import { SIL_TOKENS } from "../SILTokens";

/**
 * SYNTX manifestation grammar · resonance body (domain-neutral).
 *
 * The planetarium's resonance sphere, as the Capability Field draws its six stages (OrbitalResonanceBubble): the floating
 * 168 px body (orbitFloatPhase2 25 s), the multi-layer atmosphere of a highlighted body (atmosphereGlow 3 s, two ring pulses
 * 2.4 s, the second 1.2 s behind), the breathing attention shell, the outer semiotic ring (dashed; solid when highlighted),
 * a semiotic signature, the identity block, the moons of its items (moonOrbit 160 s, phased by index) and, while hovered, the
 * tether to its hologram HUD. What a body means — its identity, its signature, its moons, its HUD content — is the caller's.
 */
export interface SyntxResonanceBodyHud {
  tetherTestId: string;
  tetherTarget: { x: number; y: number };
  previewTestId: string;
  className: string;
  style: React.CSSProperties;
  children: React.ReactNode;
}

export interface SyntxResonanceBodyProps {
  physicsTestId: string;
  bodyTestId: string;
  attention: boolean;
  /** The body carries an open HUD (hovered, not focused): its stacking ancestor is opaque. */
  hudOpen: boolean;
  highlighted: boolean;
  dimmed: boolean;
  className: string;
  animationDelay: string;
  style?: React.CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  signature: React.ReactNode;
  children: React.ReactNode;
  moonCount: number;
  /** A moon's element; the default is the planetarium's cyan moon. */
  renderMoon?: (index: number, style: React.CSSProperties) => React.ReactNode;
  hud: SyntxResonanceBodyHud | null;
  /** Emit the keyframes with the body (default); a field that declares them once at its root passes false. */
  keyframes?: boolean;
}

/** The keyframes of the resonance body (one block per body, as the planetarium emits them). */
export const SYNTX_RESONANCE_BODY_KEYFRAMES = `
        @keyframes orbitFloatPhase2 {
          0% { transform: translateY(0px) translateX(0px) scale(1); }
          30% { transform: translateY(2px) translateX(-1px) scale(1.005); }
          65% { transform: translateY(-3px) translateX(1px) scale(1.01); }
          100% { transform: translateY(0px) translateX(0px) scale(1); }
        }
        @keyframes ringPulse {
          0% { transform: scale(1); opacity: 0.75; }
          100% { transform: scale(1.35); opacity: 0; }
        }
        @keyframes atmosphereGlow {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.9; }
        }
        @keyframes hologramFloat {
          0%, 100% { translate: 0px 0px; }
          50% { translate: 0px -4px; }
        }
        @keyframes moonOrbit {
          from { transform: rotate(0deg) translateX(110px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(110px) rotate(-360deg); }
        }

        @keyframes emptyProjectionBreathe {
          0%, 100% {
            transform: scale(0.98);
            opacity: 0.42;
            box-shadow:
              0 0 14px rgba(255, 56, 68, 0.34),
              0 0 30px rgba(255, 56, 68, 0.20);
          }
          50% {
            transform: scale(1.16);
            opacity: 0.98;
            box-shadow:
              0 0 26px rgba(255, 56, 68, 0.82),
              0 0 58px rgba(255, 56, 68, 0.52);
          }
        }

        @keyframes emptyProjectionShellBreathe {
          0%, 100% {
            transform: scale(1.01);
            opacity: 0.38;
          }
          50% {
            transform: scale(1.10);
            opacity: 0.96;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          [data-testid="empty-projection-breathing-halo"],
          [data-testid="empty-projection-breathing-shell"] {
            animation: none !important;
          }
        }
      `;

/** The orbit radius of a body's moons (moonOrbit translateX). */
export const SYNTX_MOON_ORBIT_RADIUS = 110;
/** One turn of the moons (moonOrbit), seconds. */
export const SYNTX_MOON_PERIOD_SECONDS = 160;

export function syntxMoonStyle(index: number, count: number): React.CSSProperties {
  const delay = -(160 / count) * index;
  return {
    position: "absolute",
    top: "-3px",
    left: "-3px",
    width: "9px",
    height: "9px",
    borderRadius: "50%",
    backgroundColor: SIL_TOKENS.colors.cyanActive,
    boxShadow: `0 0 8px ${SIL_TOKENS.colors.cyanActive}`,
    animation: `moonOrbit 160s linear infinite`,
    animationDelay: `${delay}s`
  };
}

export function SyntxResonanceBody({
  physicsTestId,
  bodyTestId,
  attention,
  hudOpen,
  highlighted,
  dimmed,
  className,
  animationDelay,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  signature,
  children,
  moonCount,
  renderMoon,
  hud,
  keyframes = true
}: SyntxResonanceBodyProps) {
  return (
    <>
      {keyframes && <style>{SYNTX_RESONANCE_BODY_KEYFRAMES}</style>}

      <div
        data-testid={physicsTestId}
        data-attention-state={
          attention
            ? "EMPTY_PROJECTION_ATTENTION"
            : undefined
        }
        data-hud-composition-ancestor={hudOpen ? "opaque" : undefined}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={className}
        style={{
          width: "168px",
          height: "168px",
          borderRadius: "50%",
          backgroundColor: highlighted ? "rgba(56, 229, 255, 0.18)" : "rgba(10, 14, 20, 0.88)",
          border: `1.5px solid ${highlighted ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.35)"}`,
          boxShadow: highlighted
            ? `0 0 48px ${SIL_TOKENS.colors.cyanGlowStrong}, 0 0 24px ${SIL_TOKENS.colors.cyanActive}, inset 0 0 25px ${SIL_TOKENS.colors.cyanGlow}`
            : `0 0 18px rgba(3, 8, 16, 0.8), inset 0 0 12px rgba(56, 229, 255, 0.08)`,
          backdropFilter: "blur(10px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: "16px",
          textAlign: "center",
          position: "relative",
          opacity: dimmed ? 0.52 : 1,
          mixBlendMode: "normal",
          backgroundBlendMode: "normal",
          isolation: "isolate",
          animation: `orbitFloatPhase2 25s ease-in-out infinite`,
          animationDelay: animationDelay,
          transition: "opacity 0.35s ease, box-shadow 0.35s ease, border-color 0.35s ease, background-color 0.35s ease",
          ...style
        }}
      >
        <div
          data-testid={bodyTestId}
          aria-hidden="true"
          style={{ display: "contents" }}
        />
        {/* Phase 2b: Multi-layer Planetary Atmosphere (Glow / Ring / Glow / Ring / Glow) */}
        {highlighted && (
          <>
            {/* Outer Atmosphere Glow 1 */}
            <div
              style={{
                position: "absolute",
                top: "-26px",
                left: "-26px",
                right: "-26px",
                bottom: "-26px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(56, 229, 255, 0.18) 0%, transparent 70%)",
                animation: "atmosphereGlow 3s ease-in-out infinite",
                pointerEvents: "none"
              }}
            />
            {/* Concentric Ring 1 */}
            <div
              style={{
                position: "absolute",
                top: "-18px",
                left: "-18px",
                right: "-18px",
                bottom: "-18px",
                borderRadius: "50%",
                border: `1px solid rgba(56, 229, 255, 0.45)`,
                pointerEvents: "none"
              }}
            />
            {/* Outer Atmosphere Glow 2 */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "-12px",
                right: "-12px",
                bottom: "-12px",
                borderRadius: "50%",
                border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                animation: "ringPulse 2.4s ease-out infinite",
                pointerEvents: "none"
              }}
            />
            {/* Concentric Ring 2 */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                left: "-12px",
                right: "-12px",
                bottom: "-12px",
                borderRadius: "50%",
                border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                animation: "ringPulse 2.4s ease-out infinite 1.2s",
                pointerEvents: "none"
              }}
            />
          </>
        )}

        {attention && (
          <>
            <div
              data-testid="empty-projection-breathing-halo"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-20px",
                left: "-20px",
                right: "-20px",
                bottom: "-20px",
                borderRadius: "50%",
                border: "2px solid rgba(255, 56, 68, 0.78)",
                background:
                  "radial-gradient(circle, transparent 58%, rgba(255, 56, 68, 0.12) 76%, transparent 100%)",
                pointerEvents: "none",
                zIndex: 0,
                animation:
                  "emptyProjectionBreathe 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite"
              }}
            />

            <div
              data-testid="empty-projection-breathing-shell"
              aria-hidden="true"
              style={{
                position: "absolute",
                top: "-11px",
                left: "-11px",
                right: "-11px",
                bottom: "-11px",
                borderRadius: "50%",
                border: "1.5px dashed rgba(255, 56, 68, 0.92)",
                boxShadow:
                  "inset 0 0 20px rgba(255, 56, 68, 0.20)",
                pointerEvents: "none",
                zIndex: 0,
                animation:
                  "emptyProjectionShellBreathe 2.8s cubic-bezier(0.45, 0, 0.55, 1) infinite"
              }}
            />
          </>
        )}

        {/* Outer Semiotic Ring */}
        <div
          style={{
            position: "absolute",
            top: "-8px",
            left: "-8px",
            right: "-8px",
            bottom: "-8px",
            borderRadius: "50%",
            border: `1px ${highlighted ? "solid" : "dashed"} ${highlighted ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.22)"}`,
            pointerEvents: "none",
            transition: "all 0.3s ease"
          }}
        />

        {/* Phase 2c: Inner Semiotic Signature Geometry */}
        {signature}

        {children}

        {/* Phase 3c: Orbiting Moons representing the body's items */}
        {moonCount > 0 && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              pointerEvents: "none"
            }}
          >
            {Array.from({ length: moonCount }).map((_, i, arr) => {
              const moonStyle = syntxMoonStyle(i, arr.length);
              return renderMoon ? <React.Fragment key={`moon-${i}`}>{renderMoon(i, moonStyle)}</React.Fragment> : (
                <div
                  key={`moon-${i}`}
                  style={moonStyle}
                />
              );
            })}
          </div>
        )}

        {/* Freely Floating Scientific Hologram HUD with Tether Line */}
        {hud !== null && (
          <>
            {/* Tether Energy Line connecting Planet Bubble to Hologram HUD */}
            <svg
              data-testid={hud.tetherTestId}
              width="240"
              height="240"
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                pointerEvents: "none",
                overflow: "visible",
                zIndex: 49
              }}
            >
              <line
                x1="120"
                y1="120"
                x2={hud.tetherTarget.x}
                y2={hud.tetherTarget.y}
                stroke={SIL_TOKENS.colors.cyanActive}
                strokeWidth="1.5"
                strokeDasharray="4 3"
                opacity="0.85"
              />
            </svg>

            <div
              data-testid={hud.previewTestId}
              data-opaque-hud-surface="true"
              data-hud-composition-root="opaque"
              className={hud.className}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              style={{
                ...hud.style,
                animation: "hologramFloat 6s ease-in-out infinite"
              }}
            >
              {hud.children}
            </div>
          </>
        )}
      </div>
    </>
  );
}
