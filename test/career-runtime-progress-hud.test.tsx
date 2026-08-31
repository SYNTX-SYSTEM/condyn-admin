import React from "react";
import { describe, expect, it } from "vitest";
import { renderToString } from "react-dom/server";
import { InferenceTelemetryHUD } from "../app/components/career/demo/InferenceTelemetryHUD";

const runtimeOperations = [
  "RECOVERY_CHECK",
  "SOURCE_PREPARATION",
  "INFERENCE",
  "ANALYSIS_VALIDATION",
  "PERSISTENCE"
] as const;

describe("Career runtime progress telemetry V1 — SIL HUD contract", () => {
  it.each(runtimeOperations)(
    "renders %s as the exact active worker-owned operation with lifecycle and attempt telemetry",
    (currentOperation) => {
      const html = renderToString(
        <InferenceTelemetryHUD
          isAnalyzing={true}
          {...({
            runtimeProgress: {
              lifecycleState: "RUNNING",
              currentOperation,
              attemptCount: 2
            }
          } as any)}
        />
      );

      expect(html).toContain(`CURRENT OPERATION: ${currentOperation}`);
      expect(html).toContain("JOB RUNNING");
      expect(html).toContain("ATTEMPT 2");
      expect(html).toContain("data-testid=\"career-runtime-operation-rail\"");
    }
  );

  it("does not claim an operation or provider activity when RUNNING reports null", () => {
    const html = renderToString(
      <InferenceTelemetryHUD
        isAnalyzing={true}
        {...({
          runtimeProgress: {
            lifecycleState: "RUNNING",
            currentOperation: null,
            attemptCount: 1
          }
        } as any)}
      />
    );

    expect(html).toContain("JOB RUNNING");
    expect(html).toContain("ATTEMPT 1");
    expect(html).not.toContain("EVALUATING CASCADE...");
    for (const operation of runtimeOperations) {
      expect(html).not.toContain(`CURRENT OPERATION: ${operation}`);
    }
  });

  it("contains no fake percentage, completion, or Decision-authority progress semantics", () => {
    const html = renderToString(
      <InferenceTelemetryHUD
        isAnalyzing={true}
        {...({
          runtimeProgress: {
            lifecycleState: "RUNNING",
            currentOperation: "INFERENCE",
            attemptCount: 1
          }
        } as any)}
      />
    );

    expect(html).not.toMatch(/\d+%|percent|progressPercent|estimatedCompletion|completed|verified|decisionReady|decision ready|authoritative/i);
  });
});
