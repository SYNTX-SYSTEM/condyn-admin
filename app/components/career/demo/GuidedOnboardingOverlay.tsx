"use client";

import React, { useState } from "react";
import { SIL_TOKENS } from "./SILTokens";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";

export interface GuidedOnboardingOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCodex?: () => void;
  locale?: SilLocale;
}

/**
 * CONDYN / SYNTX — Guided Onboarding Tour (6 Steps)
 * Interactive onboarding overlay teaching the user the core elements of the Decision Operating System in <30 seconds.
 */
export function GuidedOnboardingOverlay({
  isOpen,
  onClose,
  onOpenCodex,
  locale = SIL_COPY.defaultLocale
}: GuidedOnboardingOverlayProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const t = SIL_COPY[locale].onboarding;

  if (!isOpen) return null;

  const steps = t.steps.map((entry, index) => ({
    step: index + 1,
    title: entry.title,
    description: entry.description
  }));

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
          backgroundColor: SIL_TOKENS.colors.field,
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
            {`${t.title} // ${t.step} ${stepIndex + 1} ${t.of} ${steps.length}`}
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
                ◀ {t.previous}
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
                📖 {t.openManual}
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
                {t.next} ▶
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
                ✓ {t.finish}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
