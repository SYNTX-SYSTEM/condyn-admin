"use client";

import React from "react";
import { SIL_TOKENS } from "./SILTokens";

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
}

/**
 * CONDYN / SYNTX — SIL v3.0 Bottom-Right Inference Telemetry HUD
 * Displays Multi-Model Failover Cascade execution in real-time.
 */
export function InferenceTelemetryHUD({
  telemetry,
  isAnalyzing
}: InferenceTelemetryHUDProps) {
  if (!telemetry && !isAnalyzing) {
    return null;
  }

  const activeModel = telemetry?.activeModel || "GEMINI CASCADE...";
  const fallbackTriggered = telemetry?.fallbackTriggered || false;

  return (
    <div
      data-testid="inference-telemetry-hud"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "280px",
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
          INFERENCE CASCADE
        </span>
        <span
          style={{
            fontSize: "9px",
            color: SIL_TOKENS.colors.textMuted
          }}
        >
          {telemetry ? `${telemetry.totalLatencyMs}ms` : "ACTIVE"}
        </span>
      </div>

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
        <span>{isAnalyzing ? "EVALUATING CASCADE..." : activeModel.toUpperCase()}</span>
      </div>

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
