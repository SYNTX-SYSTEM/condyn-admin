"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";
import type { CareerJobRuntimeOperation } from "../../../../lib/career/orchestration/job";
import { SIL_COPY, type SilLocale } from "../../../../lib/career/view-model/sil-language";

export interface AttemptedModelInfo {
  model: string;
  status: "SUCCESS" | "RATE_LIMITED" | "FAILED";
  latencyMs: number;
  error?: string;
}

export interface InferenceTelemetryData {
  modelsAttempted: AttemptedModelInfo[];
  activeModel: string;
  fallbackTriggered: boolean;
  totalLatencyMs: number;
}

export interface InferenceTelemetryHUDProps {
  telemetry?: InferenceTelemetryData | null;
  isAnalyzing?: boolean;
  runtimeProgress?: {
    lifecycleState: string;
    currentOperation: CareerJobRuntimeOperation | null;
    attemptCount: number | null;
  } | null;
  locale?: SilLocale;
}

const runtimeOperations: CareerJobRuntimeOperation[] = [
  "RECOVERY_CHECK",
  "SOURCE_PREPARATION",
  "INFERENCE",
  "ANALYSIS_VALIDATION",
  "PERSISTENCE"
];

/**
 * CONDYN / SYNTX — SIL v3.0 Bottom-Right Inference Telemetry HUD
 * Displays Multi-Model Failover Cascade execution in real-time.
 */
export function InferenceTelemetryHUD({
  telemetry,
  isAnalyzing,
  runtimeProgress,
  locale = SIL_COPY.defaultLocale
}: InferenceTelemetryHUDProps) {
  const t = SIL_COPY[locale].runtime;

  if (!telemetry && !isAnalyzing && !runtimeProgress) {
    return null;
  }

  const hasRuntimeProgress = Boolean(runtimeProgress);
  const activeModel = telemetry?.activeModel || "GEMINI CASCADE...";
  const fallbackTriggered = telemetry?.fallbackTriggered || false;

  return (
    <div
      data-testid="inference-telemetry-hud"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: hasRuntimeProgress ? "332px" : "280px",
        backgroundColor: "rgba(10, 14, 20, 0.94)",
        border: `1px solid ${
          fallbackTriggered ? SIL_TOKENS.colors.tensionAmber : SIL_TOKENS.colors.cyanActive
        }`,
        borderRadius: "10px",
        padding: "12px 14px",
        fontFamily: SIL_TOKENS.typography.mono,
        color: SIL_TOKENS.colors.textPrimary,
        boxShadow: fallbackTriggered
          ? "0 0 18px rgba(255, 179, 56, 0.35)"
          : "0 0 18px rgba(56, 229, 255, 0.3)",
        backdropFilter: "blur(12px)",
        zIndex: 100
      }}
    >
      {hasRuntimeProgress && runtimeProgress!.currentOperation && (
        <style>{`@keyframes careerRuntimeOperationPulse { from { box-shadow: 0 0 6px rgba(56, 229, 255, 0.24); } to { box-shadow: 0 0 14px rgba(56, 229, 255, 0.62); } }`}</style>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          paddingBottom: "6px",
          marginBottom: "8px"
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.8px",
            color: fallbackTriggered ? SIL_TOKENS.colors.tensionAmber : SIL_TOKENS.colors.cyanActive
          }}
        >
          {hasRuntimeProgress ? t.title : t.inferenceCascade}
        </span>
        <span
          style={{
            fontSize: "9px",
            color: SIL_TOKENS.colors.textMuted
          }}
        >
          {hasRuntimeProgress
            ? `JOB ${runtimeProgress!.lifecycleState}`
            : telemetry
            ? `${telemetry.totalLatencyMs}ms`
            : t.active}
        </span>
      </div>

      {hasRuntimeProgress ? (
        <>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 700,
              color: SIL_TOKENS.colors.textMuted,
              marginBottom: "6px",
              display: "flex",
              justifyContent: "space-between",
              letterSpacing: "0.45px"
            }}
          >
            <span>{`JOB ${runtimeProgress!.lifecycleState}`}</span>
            <span>{`${t.attempt} ${runtimeProgress!.attemptCount ?? t.unreported}`}</span>
          </div>

          {runtimeProgress!.currentOperation && (
            <div
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: SIL_TOKENS.colors.cyanActive,
                marginBottom: "8px",
                letterSpacing: "0.45px"
              }}
            >
              {`${t.currentOperation}: ${runtimeProgress!.currentOperation}`}
            </div>
          )}

          <div
            data-testid="career-runtime-operation-rail"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              gap: "4px",
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
              paddingTop: "8px"
            }}
          >
            {runtimeOperations.map((operation) => {
              const isActive = runtimeProgress!.currentOperation === operation;
              return (
                <div
                  key={operation}
                  data-runtime-operation={operation}
                  data-runtime-operation-active={isActive ? "true" : "false"}
                  style={{
                    minWidth: 0,
                    padding: "4px 3px",
                    border: `1px solid ${isActive ? SIL_TOKENS.colors.cyanActive : "rgba(255, 255, 255, 0.12)"}`,
                    backgroundColor: isActive ? "rgba(56, 229, 255, 0.10)" : "rgba(255, 255, 255, 0.02)",
                    color: isActive ? SIL_TOKENS.colors.cyanActive : SIL_TOKENS.colors.textMuted,
                    fontSize: "7px",
                    lineHeight: 1.3,
                    letterSpacing: "0.2px",
                    overflowWrap: "anywhere",
                    boxShadow: isActive ? "0 0 10px rgba(56, 229, 255, 0.34)" : "none",
                    animation: isActive ? "careerRuntimeOperationPulse 1s ease-in-out infinite alternate" : "none"
                  }}
                >
                  {operation}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div
          style={{
            fontSize: "11px",
            fontWeight: 700,
            color: fallbackTriggered ? SIL_TOKENS.colors.tensionAmber : SIL_TOKENS.colors.cyanActive,
            marginBottom: "8px",
            display: "flex",
            alignItems: "center",
            gap: "6px"
          }}
        >
          <span>●</span>
          <span>{isAnalyzing ? t.evaluatingCascade : activeModel.toUpperCase()}</span>
        </div>
      )}

      {telemetry && telemetry.modelsAttempted && telemetry.modelsAttempted.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          {telemetry.modelsAttempted.map((attempt, idx) => (
            <div
              key={idx}
              data-testid={`model-attempt-${idx}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "10px",
                padding: "3px 6px",
                borderRadius: "4px",
                backgroundColor:
                  attempt.status === "SUCCESS"
                    ? "rgba(56, 229, 255, 0.1)"
                    : "rgba(255, 85, 85, 0.1)"
              }}
            >
              <span>[{idx + 1}] {attempt.model}</span>
              <span
                style={{
                  fontWeight: 700,
                  color:
                    attempt.status === "SUCCESS"
                      ? SIL_TOKENS.colors.cyanActive
                      : attempt.status === "RATE_LIMITED"
                      ? SIL_TOKENS.colors.tensionAmber
                      : "#ff5555"
                }}
              >
                {attempt.status === "SUCCESS"
                  ? "✓ SUCCESS"
                  : attempt.status === "RATE_LIMITED"
                  ? "⚠ 503 OVERLOAD"
                  : "× FAIL"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
