import React from "react";
import { describe, it, expect, vi } from "vitest";
import { renderToString } from "react-dom/server";

vi.mock("../lib/career/ui/useCareerAnalysisJob", () => ({
  useCareerAnalysisJob: vi.fn()
}));

import { useCareerAnalysisJob } from "../lib/career/ui/useCareerAnalysisJob";
import { OrbitalResonanceBubble } from "../app/components/career/demo/OrbitalResonanceBubble";
import { SemanticCareerIntelligenceField } from "../app/components/career/demo/SemanticCareerIntelligenceField";

const emptyData: any = {
  analysisId: "ANL_EMPTY_ATTENTION",
  generatedAt: "2026-08-31T00:00:00.000Z",
  sources: [],
  capabilities: [],
  companyMatches: [],
  roleMatches: [],
  capabilityGaps: [],
  nextActions: [],
  reactFlowGraph: {
    nodes: [],
    edges: []
  }
};

function renderBubble(
  attentionState: "EMPTY_PROJECTION_ATTENTION" | null
) {
  return renderToString(
    <OrbitalResonanceBubble
      stageId="05"
      stageName="⟁ TENSION FIELD"
      subtitle="Capability-gap projection"
      itemCount={0}
      previewItems={[]}
      attentionState={attentionState}
    />
  );
}

describe("SIL empty-orbit visual attention", () => {
  it("renders a dedicated breathing attention layer for an empty completed projection", () => {
    const html = renderBubble("EMPTY_PROJECTION_ATTENTION");

    expect(html).toContain(
      'data-attention-state="EMPTY_PROJECTION_ATTENTION"'
    );
    expect(html).toContain(
      'data-testid="empty-projection-breathing-halo"'
    );
    expect(html).toContain(
      'data-testid="empty-projection-breathing-shell"'
    );
  });

  it("uses a red respiratory animation while preserving the semantic orbit body", () => {
    const html = renderBubble("EMPTY_PROJECTION_ATTENTION");

    expect(html).toContain("emptyProjectionBreathe");
    expect(html).toContain('data-testid="orbital-physics-05"');
    expect(html).toContain("Capability-gap projection");
  });

  it("does not render the breathing layer for a normal orbit", () => {
    const html = renderBubble(null);

    expect(html).not.toContain(
      'data-attention-state="EMPTY_PROJECTION_ATTENTION"'
    );
    expect(html).not.toContain(
      '<div data-testid="empty-projection-breathing-halo"'
    );
    expect(html).not.toContain(
      '<div data-testid="empty-projection-breathing-shell"'
    );
  });

  it("wires all six empty orbits after SUCCEEDED", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: {
        state: "SUCCEEDED",
        canonicalAnalysis: null,
        currentOperation: null,
        attemptCount: 1,
        errorCode: null,
        errorSummary: null
      },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField data={emptyData} />
    );

    const matches =
      html.match(
        /data-attention-state="EMPTY_PROJECTION_ATTENTION"/g
      ) ?? [];

    expect(matches).toHaveLength(6);
  });

  it("does not flag empty orbits while RUNNING", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: {
        state: "RUNNING",
        canonicalAnalysis: null,
        currentOperation: "INFERENCE",
        attemptCount: 1,
        errorCode: null,
        errorSummary: null
      },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField data={emptyData} />
    );

    expect(html).not.toContain(
      'data-attention-state="EMPTY_PROJECTION_ATTENTION"'
    );
  });

  it("flags only actually empty orbits after SUCCEEDED", () => {
    (useCareerAnalysisJob as any).mockReturnValue({
      state: {
        state: "SUCCEEDED",
        canonicalAnalysis: null,
        currentOperation: null,
        attemptCount: 1,
        errorCode: null,
        errorSummary: null
      },
      submitAnalysis: vi.fn()
    });

    const html = renderToString(
      <SemanticCareerIntelligenceField
        data={{
          ...emptyData,
          capabilities: [
            {
              id: "CAP_001",
              name: "System Architecture",
              domain: "Architecture",
              evidenceSummary: "Projected capability"
            }
          ]
        }}
      />
    );

    const matches =
      html.match(
        /data-attention-state="EMPTY_PROJECTION_ATTENTION"/g
      ) ?? [];

    expect(matches).toHaveLength(5);
  });

  it("does not express ERROR or BLOCKED semantics", () => {
    const html = renderBubble("EMPTY_PROJECTION_ATTENTION");

    expect(html).not.toContain(">ERROR<");
    expect(html).not.toContain(">BLOCKED<");
    expect(html).not.toContain(">GAP DETECTED<");
  });
});
