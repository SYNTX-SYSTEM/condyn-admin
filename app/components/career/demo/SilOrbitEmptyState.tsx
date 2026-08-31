import React from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { SilOrbitEmptyStatePresentation } from "../../../../lib/career/view-model/orbit-empty-state";
import { getOrbitAccentColor } from "./OrbitalResonanceBubble";

export interface SilOrbitEmptyStateProps {
  stageId: string;
  state: SilOrbitEmptyStatePresentation;
  towardCore?: {
    x: number;
    y: number;
  };
}

const GHOST_GLYPHS: Record<string, string> = {
  "01": "◈",
  "02": "⬡",
  "03": "◎",
  "04": "⎔",
  "05": "⟁",
  "06": "∿"
};

export function SilOrbitEmptyState({
  stageId,
  state,
  towardCore = { x: 220, y: 0 }
}: SilOrbitEmptyStateProps) {
  const accent = getOrbitAccentColor(stageId);
  const red = "rgba(255, 56, 68, 0.88)";

  const rawDistance = Math.hypot(
    towardCore.x,
    towardCore.y
  );

  const distance = rawDistance > 0
    ? rawDistance
    : 1;

  const unitX = towardCore.x / distance;
  const unitY = towardCore.y / distance;

  const ghostDistance = Math.min(
    245,
    Math.max(185, distance * 0.48)
  );

  const ghostX = unitX * ghostDistance;
  const ghostY = unitY * ghostDistance;

  const membraneWidth = 390;
  const membraneHeight = 228;

  const tetherStart = 92;
  const tetherLength = Math.max(
    72,
    ghostDistance - 150
  );

  const tetherAngle = Math.atan2(
    unitY,
    unitX
  );

  return (
    <div
      data-testid={`sil-orbit-empty-state-${stageId}`}
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        overflow: "visible",
        pointerEvents: "none",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary
      }}
    >
      <style>{`
        @keyframes ghostMembraneBreathe {
          0%, 100% {
            transform: scale(0.985);
            opacity: 0.84;
            filter: saturate(0.92);
          }
          50% {
            transform: scale(1.025);
            opacity: 1;
            filter: saturate(1.18);
          }
        }

        @keyframes ghostOuterPressure {
          0%, 100% {
            transform: scale(1);
            opacity: 0.34;
          }
          50% {
            transform: scale(1.075);
            opacity: 0.88;
          }
        }

        @keyframes ghostInnerPhase {
          0%, 100% {
            opacity: 0.32;
            transform: scale(0.97);
          }
          50% {
            opacity: 0.82;
            transform: scale(1.02);
          }
        }

        @keyframes ghostTetherPulse {
          0%, 100% {
            opacity: 0.34;
            filter: drop-shadow(0 0 2px rgba(255, 56, 68, 0.32));
          }
          50% {
            opacity: 1;
            filter:
              drop-shadow(0 0 7px rgba(255, 56, 68, 0.82))
              drop-shadow(0 0 12px ${accent});
          }
        }

        @keyframes ghostSignalTravel {
          0% {
            transform: translateX(0);
            opacity: 0;
          }
          15% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            transform: translateX(${Math.max(48, tetherLength - 10)}px);
            opacity: 0;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .sil-ghost-motion {
            animation: none !important;
          }
        }
      `}</style>

      <div
        data-testid={`sil-ghost-tether-${stageId}`}
        className="sil-ghost-motion"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: `${unitX * tetherStart}px`,
          top: `${unitY * tetherStart}px`,
          width: `${tetherLength}px`,
          height: "2px",
          transform: `rotate(${tetherAngle}rad)`,
          transformOrigin: "0 50%",
          background: `linear-gradient(
            90deg,
            ${accent} 0%,
            rgba(56, 229, 255, 0.72) 36%,
            rgba(255, 56, 68, 0.92) 100%
          )`,
          boxShadow: `
            0 0 7px ${accent},
            0 0 12px rgba(255, 56, 68, 0.45)
          `,
          animation:
            "ghostTetherPulse 2.35s ease-in-out infinite",
          zIndex: 2
        }}
      >
        <div
          className="sil-ghost-motion"
          style={{
            position: "absolute",
            left: 0,
            top: "-3px",
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            boxShadow: `
              0 0 8px ${accent},
              0 0 14px rgba(255, 56, 68, 0.82)
            `,
            animation:
              "ghostSignalTravel 2.35s linear infinite"
          }}
        />
      </div>

      <div
        data-testid={`sil-ghost-manifestation-${stageId}`}
        style={{
          position: "absolute",
          left: `${ghostX - membraneWidth / 2}px`,
          top: `${ghostY - membraneHeight / 2}px`,
          width: `${membraneWidth}px`,
          height: `${membraneHeight}px`,
          zIndex: 3
        }}
      >
        <div
          className="sil-ghost-motion"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: "-18px",
            borderRadius: "48% 52% 46% 54% / 53% 44% 56% 47%",
            border: "2px solid rgba(255, 56, 68, 0.52)",
            boxShadow: `
              0 0 34px rgba(255, 56, 68, 0.34),
              0 0 68px rgba(255, 56, 68, 0.18)
            `,
            animation:
              "ghostOuterPressure 3.1s ease-in-out infinite"
          }}
        />

        <div
          data-testid={`sil-ghost-membrane-${stageId}`}
          className="sil-ghost-motion"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "47% 53% 51% 49% / 44% 56% 47% 53%",
            border: `1.5px dashed ${accent}`,
            background: `
              radial-gradient(
                ellipse at 50% 48%,
                ${accent}20 0%,
                rgba(56, 229, 255, 0.08) 34%,
                rgba(255, 56, 68, 0.10) 62%,
                rgba(3, 6, 11, 0.94) 100%
              )
            `,
            boxShadow: `
              0 0 38px ${accent}32,
              0 0 54px rgba(255, 56, 68, 0.22),
              inset 0 0 38px ${accent}18,
              inset 0 0 64px rgba(255, 56, 68, 0.10)
            `,
            backdropFilter: "blur(13px)",
            animation:
              "ghostMembraneBreathe 3.1s cubic-bezier(0.45, 0, 0.55, 1) infinite",
            overflow: "hidden"
          }}
        >
          <div
            className="sil-ghost-motion"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: "18px",
              borderRadius: "53% 47% 45% 55% / 49% 58% 42% 51%",
              border: `1px solid ${red}`,
              opacity: 0.48,
              animation:
                "ghostInnerPhase 2.7s ease-in-out infinite"
            }}
          />

          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: "240px",
              height: "1px",
              transform:
                "translate(-50%, -50%) rotate(-14deg)",
              background: `linear-gradient(
                90deg,
                transparent,
                ${accent},
                rgba(255, 56, 68, 0.82),
                transparent
              )`,
              opacity: 0.28
            }}
          />

          <div
            data-testid={`sil-ghost-stage-glyph-${stageId}`}
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "150px",
              lineHeight: 1,
              color: accent,
              opacity: 0.055,
              textShadow: `
                0 0 20px ${accent},
                0 0 42px rgba(255, 56, 68, 0.34)
              `
            }}
          >
            {GHOST_GLYPHS[stageId] ?? "○"}
          </div>

          <div
            style={{
              position: "absolute",
              inset: "24px 38px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              zIndex: 2
            }}
          >
            <div
              style={{
                fontSize: "8px",
                fontWeight: 800,
                letterSpacing: "2.2px",
                color: "rgba(255, 91, 101, 0.96)",
                textShadow:
                  "0 0 9px rgba(255, 56, 68, 0.72)"
              }}
            >
              {state.label}
            </div>

            <div
              style={{
                marginTop: "8px",
                width: "72px",
                height: "1px",
                background: `linear-gradient(
                  90deg,
                  transparent,
                  ${accent},
                  rgba(255, 56, 68, 0.92),
                  transparent
                )`
              }}
            />

            <div
              style={{
                marginTop: "13px",
                maxWidth: "300px",
                fontSize: "15px",
                lineHeight: 1.18,
                fontWeight: 900,
                letterSpacing: "1px",
                color: SIL_TOKENS.colors.textPrimary,
                textShadow: `
                  0 0 12px ${accent}66,
                  0 0 18px rgba(255, 56, 68, 0.24)
                `
              }}
            >
              {state.title}
            </div>

            <div
              style={{
                marginTop: "14px",
                maxWidth: "300px",
                fontSize: "10px",
                lineHeight: 1.55,
                color: SIL_TOKENS.colors.textMuted
              }}
            >
              {state.reason}
            </div>

            <div
              style={{
                marginTop: "14px",
                fontSize: "7px",
                letterSpacing: "1.5px",
                color: accent,
                opacity: 0.58
              }}
            >
              ORBIT {stageId} // STRUCTURAL ABSENCE
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
