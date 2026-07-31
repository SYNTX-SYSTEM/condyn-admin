"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";

export interface GuidedOnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCodex?: () => void;
}

/**
 * CONDYN / SYNTX — Guided Onboarding Tour (6 Steps)
 * Interactive onboarding overlay teaching the user the core elements of the Decision Operating System in <30 seconds.
 */
export function GuidedOnboardingOverlay({
  isOpen,
  onClose,
  onOpenCodex
}: GuidedOnboardingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: "1. IDENTITY CORE",
      description: "Das ist der Identity Core im Zentrum des Planetariums. Hier entsteht die Analyse aus Ihren Quellen."
    },
    {
      step: 2,
      title: "2. WISSEN EINSPEISEN",
      description: "Links im SourceDock speisen Sie Wissen ein: PDF-Dokumente, GitHub-Repositories, Webseiten oder Textstellen."
    },
    {
      step: 3,
      title: "3. DIE 6 RESONANZ-ORBITS",
      description: "Um den Kern kreisen die 6 semantischen Bereiche: von Fähigkeiten über Organisationen bis zu Entwicklungspfaden."
    },
    {
      step: 4,
      title: "4. TIEFER FLIEGEN (SEMANTISCHER ZOOM)",
      description: "Klicken Sie auf einen Orbit im Planetarium, um in L1 (Cluster) und L2 (Beweise) einzutauchen."
    },
    {
      step: 5,
      title: "5. DECISION GRAPH INSPECTOR",
      description: "Der Inspector rechts unten zeigt für jede Entscheidung, ob sie durch Beweise unterstützt (SUPPORTED) oder blockiert (BLOCKED) ist."
    },
    {
      step: 6,
      title: "6. TRUST & NACHVOLLZIEHBARKEIT",
      description: "Die 5 Vertrauensfragen und der System Codex erklären mathematisch exakt, warum Sie dem Ergebnis vertrauen können."
    }
  ];

  const currentStep = steps[stepIndex] || steps[0];

  const handleFinish = () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("condyn_onboarding_seen", "true");
      } catch (err) {}
    }
    onClose();
  };

  return (
    <div
      data-testid="guided-onboarding-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 150,
        backgroundColor: "rgba(3, 7, 12, 0.72)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px"
      }}
    >
      <div
        data-testid="onboarding-step-card"
        style={{
          width: "520px",
          maxWidth: "92vw",
          backgroundColor: SIL_TOKENS.colors.surface,
          border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
          borderRadius: "16px",
          boxShadow: `0 0 28px rgba(56, 229, 255, 0.35)`,
          padding: "28px",
          fontFamily: SIL_TOKENS.typography.mono,
          color: SIL_TOKENS.colors.textPrimary,
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: "11px",
              color: SIL_TOKENS.colors.cyanActive,
              textTransform: "uppercase",
              letterSpacing: "1px",
              fontWeight: 700
            }}
          >
            {`CONDYN ONBOARDING // SCHRITT ${stepIndex + 1} VON ${steps.length}`}
          </span>
          <button
            data-testid="onboarding-close-btn"
            onClick={handleFinish}
            style={{
              background: "transparent",
              border: "none",
              color: SIL_TOKENS.colors.textMuted,
              cursor: "pointer",
              fontSize: "14px"
            }}
          >
            ✕
          </button>
        </div>

        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: SIL_TOKENS.colors.cyanActive }}>
            {currentStep.title}
          </h3>
          <p style={{ margin: "10px 0 0", fontSize: "13px", lineHeight: 1.5, color: SIL_TOKENS.colors.textPrimary }}>
            {currentStep.description}
          </p>
        </div>

        {/* Progress indicators */}
        <div style={{ display: "flex", gap: "6px", margin: "4px 0" }}>
          {steps.map((st, i) => (
            <div
              key={st.step}
              style={{
                height: "3px",
                flex: 1,
                borderRadius: "2px",
                backgroundColor: i <= stepIndex ? SIL_TOKENS.colors.cyanActive : "rgba(56, 229, 255, 0.2)",
                transition: "background-color 0.2s ease"
              }}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
          <div style={{ display: "flex", gap: "8px" }}>
            {stepIndex > 0 && (
              <button
                data-testid="onboarding-prev-btn"
                onClick={() => setStepIndex(stepIndex - 1)}
                style={{
                  padding: "8px 14px",
                  backgroundColor: "transparent",
                  border: `1px solid ${SIL_TOKENS.colors.fieldBorder}`,
                  borderRadius: "6px",
                  color: SIL_TOKENS.colors.textPrimary,
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                ◀ ZURÜCK
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            {onOpenCodex && (
              <button
                data-testid="open-codex-from-onboarding"
                onClick={() => {
                  handleFinish();
                  onOpenCodex();
                }}
                style={{
                  padding: "8px 14px",
                  backgroundColor: "rgba(56, 229, 255, 0.1)",
                  border: `1px solid ${SIL_TOKENS.colors.cyanActive}`,
                  borderRadius: "6px",
                  color: SIL_TOKENS.colors.cyanActive,
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                📖 HANDBUCH ÖFFNEN
              </button>
            )}

            {stepIndex < steps.length - 1 ? (
              <button
                data-testid="onboarding-next-btn"
                onClick={() => setStepIndex(stepIndex + 1)}
                style={{
                  padding: "8px 18px",
                  backgroundColor: SIL_TOKENS.colors.cyanActive,
                  border: "none",
                  borderRadius: "6px",
                  color: "#060a10",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                WEITER ▶
              </button>
            ) : (
              <button
                data-testid="onboarding-finish-btn"
                onClick={handleFinish}
                style={{
                  padding: "8px 18px",
                  backgroundColor: SIL_TOKENS.colors.cyanActive,
                  border: "none",
                  borderRadius: "6px",
                  color: "#060a10",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ✓ TOUR BEENDEN
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
